// whatships_pacing.mjs: measures how launch films are paced (plan.md, Phase 0.4). For a sample of films per visual family
// (refs/whatships/genres.json), it downloads each video to a temp file, measures it, and deletes it. The videos are
// analysed, never kept or used in anything we make.
//   cuts      frame-difference score (ffmpeg scdet at 12 fps, 320 px); a local peak ≥ CUT with ≥ 0.5 s spacing is a cut or
//             hard transition. Soft fades and slow pushes score low and aren't counted (the beat pass catches them).
//   activity  mean change score per second; seconds under STILL are "holds"
//   audio     presence, integrated loudness (EBU R128), total silence
//   sheet     one frame every `step` s (1 s for films up to 72 s), labelled with its time, for the beat pass
// Writes refs/whatships/pacing/<slug>.json (committed) and pacing/sheets/<slug>.jpg (gitignored). Resumable.
//   node scripts/whatships_pacing.mjs [--per=24] [--footage=12] [--concurrency=3] [--chrome=<path>]
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, createWriteStream } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const DIR = 'refs/whatships', OUT = `${DIR}/pacing`, SHEETS = `${OUT}/sheets`, TMP = args.tmp || join(tmpdir(), 'whatships_pacing');
const PER = +(args.per || 24), FOOTAGE_PER = +(args.footage || 12), CONC = +(args.concurrency || 3), CUT = 4.5, STILL = .15, MAX_TILES = 72;
const FOOTAGE = new Set(['founder_talk', 'product_footage', 'cinematic_broll', 'type_over_footage']);
for (const d of [OUT, SHEETS, TMP]) mkdirSync(d, { recursive: true });

const genres = JSON.parse(readFileSync(`${DIR}/genres.json`, 'utf8'));
const { videos } = JSON.parse(readFileSync(`${DIR}/catalog.json`, 'utf8')), bySlug = new Map(videos.map(v => [v.slug, v]));
// the sample: each family's representatives first, then more in a fixed hashed order, typical lengths (10 s – 2 min) only
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const sample = [];
for (const [fam, g] of Object.entries(genres)) {
  if (fam === 'unclassified') continue;
  const n = FOOTAGE.has(fam) ? FOOTAGE_PER : PER, typical = s => { const x = bySlug.get(s).seconds; return x >= 10 && x <= 120; };
  const rest = g.slugs.filter(s => !g.representatives.includes(s) && typical(s)).sort((a, b) => hash(a) - hash(b));
  for (const s of [...g.representatives.filter(typical), ...rest].slice(0, n)) sample.push({ slug: s, family: fam });
}
console.log(`sample: ${sample.length} films`);

const run = (cmd, a, { out = false } = {}) => new Promise((ok, bad) => {
  const p = spawn(cmd, a); let so = '', se = '';
  p.stdout.on('data', d => so += d); p.stderr.on('data', d => se += d);
  p.on('close', c => c ? bad(new Error(`${cmd} exited ${c}: ${se.slice(-300)}`)) : ok(out ? so : se));
});

async function download(url, f) {
  for (const u of [url, 'https://proxy.whatships.com/?url=' + encodeURIComponent(url)]) {
    try { const r = await fetch(u); if (!r.ok) continue; await pipeline(Readable.fromWeb(r.body), createWriteStream(f)); return u === url ? 'direct' : 'proxy'; } catch { }
  }
  return null;
}

const browser = await puppeteer.launch({ executablePath: [args.chrome, process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && existsSync(p)), headless: true, args: ['--allow-file-access-from-files'] });
const composer = await browser.newPage(); await composer.goto(pathToFileURL(resolve(TMP)).href + '/');
let composing = Promise.resolve();

async function analyse({ slug, family }) {
  const outF = `${OUT}/${slug}.json`; if (existsSync(outF) && !args.refresh) return 'cached';
  const meta = JSON.parse(readFileSync(`${DIR}/raw/${slug}.video.json`, 'utf8'));
  if (!meta.videoUrl) { writeFileSync(outF, JSON.stringify({ slug, family, error: 'no video url' })); return 'no url'; }
  const vf = join(TMP, `${slug}.mp4`), fd = join(TMP, slug);
  try {
    const via = await download(meta.videoUrl, vf);
    if (!via) { writeFileSync(outF, JSON.stringify({ slug, family, error: 'download failed' })); return 'failed'; }
    const probe = JSON.parse(await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', vf], { out: true }));
    const dur = +probe.format.duration, vs = probe.streams.find(s => s.codec_type === 'video'), hasAudio = probe.streams.some(s => s.codec_type === 'audio');
    // per-frame change scores at 12 fps
    const sc = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', vf, '-vf', 'fps=12,scale=320:-2,scdet=threshold=0,metadata=print:file=-', '-an', '-f', 'null', '-'], { out: true });
    const ts = [...sc.matchAll(/pts_time:([\d.]+)/g)].map(m => +m[1]), ss = [...sc.matchAll(/lavfi\.scd\.score=([\d.]+)/g)].map(m => +m[1]);
    const cuts = [];
    for (let i = 1; i < ss.length - 1; i++) if (ss[i] >= CUT && ss[i] >= ss[i - 1] && ss[i] >= ss[i + 1] && ts[i] > .3 && (!cuts.length || ts[i] - cuts[cuts.length - 1] >= .5)) cuts.push(+ts[i].toFixed(2));
    const bounds = [0, ...cuts, +dur.toFixed(2)], shots = bounds.slice(1).map((b, i) => +(b - bounds[i]).toFixed(2));
    const activity = []; for (let s = 0; s < Math.ceil(dur); s++) { const w = ss.filter((_, i) => ts[i] >= s && ts[i] < s + 1); activity.push(w.length ? +(w.reduce((a, b) => a + b, 0) / w.length).toFixed(2) : 0); }
    // audio
    let lufs = null, silence = null;
    if (hasAudio) {
      const e = await run('ffmpeg', ['-hide_banner', '-nostats', '-i', vf, '-vn', '-af', 'ebur128=framelog=quiet,silencedetect=n=-45dB:d=0.5', '-f', 'null', '-']);
      lufs = +(e.match(/I:\s+(-?[\d.]+) LUFS/)?.[1] ?? NaN); if (isNaN(lufs)) lufs = null;
      silence = +[...e.matchAll(/silence_duration: ([\d.]+)/g)].reduce((a, m) => a + +m[1], 0).toFixed(1);
    }
    // labelled sheet for the beat pass
    const step = Math.max(1, Math.ceil(dur / MAX_TILES));
    mkdirSync(fd, { recursive: true });
    await run('ffmpeg', ['-v', 'error', '-i', vf, '-vf', `fps=1/${step},scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2`, '-q:v', '4', join(fd, '%04d.jpg')]);
    const frames = readdirSync(fd).filter(f => f.endsWith('.jpg')).sort();
    const sheetDone = composing.then(async () => {
      const url = await composer.evaluate(async (srcs, step, title) => {
        const CW = 320, CH = 180, COLS = 6, c = document.createElement('canvas'); c.width = COLS * CW; c.height = Math.ceil(srcs.length / COLS) * CH + 30; const x = c.getContext('2d');
        x.fillStyle = '#222'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#fff'; x.font = 'bold 18px sans-serif'; x.fillText(title, 8, 21);
        for (let i = 0; i < srcs.length; i++) {
          const img = new Image(); img.src = srcs[i]; await img.decode();
          const cx = (i % COLS) * CW, cy = 30 + Math.floor(i / COLS) * CH; x.drawImage(img, cx, cy, CW, CH);
          x.fillStyle = '#FFE14D'; x.fillRect(cx, cy, 52, 22); x.fillStyle = '#000'; x.font = 'bold 16px sans-serif'; x.fillText(`${i * step}s`, cx + 4, cy + 17);
          x.strokeStyle = '#222'; x.strokeRect(cx + .5, cy + .5, CW - 1, CH - 1);
        }
        return c.toDataURL('image/jpeg', .85);
      }, frames.map(f => pathToFileURL(join(fd, f)).href), step, `${slug} · ${dur.toFixed(1)} s · one frame every ${step} s`);
      writeFileSync(`${SHEETS}/${slug}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
    });
    composing = sheetDone.catch(() => {}); await sheetDone;
    const holds = activity.filter(a => a < STILL).length;
    writeFileSync(outF, JSON.stringify({ slug, family, via, duration: +dur.toFixed(2), width: vs?.width, height: vs?.height, fps: vs?.r_frame_rate,
      hasAudio, lufs, silence, cuts, shots, cutsPerMin: +(cuts.length / dur * 60).toFixed(1), holdSeconds: holds, activity, sheetStep: step, sheetFrames: frames.length }));
    return 'ok';
  } finally { rmSync(vf, { force: true }); rmSync(fd, { recursive: true, force: true }); }   // never keep the video
}

let next = 0, done = 0; const tally = {};
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < sample.length) {
    const it = sample[next++]; let r;
    try { r = await analyse(it); } catch (e) { r = 'error'; writeFileSync(`${OUT}/${it.slug}.json`, JSON.stringify({ slug: it.slug, family: it.family, error: String(e.message).slice(0, 300) })); }
    tally[r] = (tally[r] || 0) + 1; if (++done % 10 === 0 || done === sample.length) console.log(`  ${done}/${sample.length}  ${JSON.stringify(tally)}`);
  }
}));
await browser.close();
rmSync(TMP, { recursive: true, force: true });
writeFileSync(`${OUT}/sample.json`, JSON.stringify(sample, null, 0).replace(/\},\{/g, '},\n{'));
console.log(`done: ${JSON.stringify(tally)} → ${OUT}/ (videos deleted)`);
