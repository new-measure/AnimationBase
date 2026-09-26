// render.mjs: renders studio.html in headless Chrome. Length and fps come from the page (PROJECT in src/config.js).
//
//   Look at it (open the images with your image viewer / Read tool):
//     node render.mjs --sheet=0.5,1,1.5,2 [--cols=4] [--w=480] --out=out/check/a.jpg        contact sheet of chosen times
//     node render.mjs --strip=2.0:2.5 [--cols=6] [--w=320] --out=out/check/strip.jpg        EVERY frame in a stretch (motion)
//     node render.mjs --sheet=2.1,2.2 --crop=760,300,400,400 --w=600 --out=out/check/face.jpg full-res crops (details)
//     node render.mjs --strip=2.0:2.5 --crop-at=960,780,500,400 --out=out/check/feet.jpg       crops that follow a WORLD point
//         (x,y in world px, may be page expressions like PLK.MX(1.38); w,h in screen px) through each frame's camera
//     node render.mjs --stills=1.2,3.4 --out=out/stills                                     full-res PNGs
//   Make the video:
//     node render.mjs --clip [--range=0:4] --out=out/video.mp4                               straight to MP4 (one worker)
//     node render.mjs --frames [--range=0:8] --workers=4                                     JPEG frames → out/frames/<scene> (parallel, resumable)
//     node render.mjs --encode --out=out/video.mp4                                           out/frames/<scene> → MP4
//   Standalone loops (LOOPS in the page): add --loop=<name> to any of the above (times are then loop times), or
//     node render.mjs --loop=emotions --png --out=out/loop_emotions                          one cycle as PNGs (for GIFs)
//   Sound: a scene's plan (src/lib/audio.js: Sound.music / sfx / clip) is mixed into --clip and --encode and normalised
//   to -15 LUFS; without one, --audio=assets/song.mp3 (or PROJECT.audio) is muxed as it is. Other flags: --fps=24,
//   --chrome=<path to Chrome/Chromium>.
//   Scenes: --scene=<name> renders that scene from src/scenes/index.js (default: PROJECT.scene in src/config.js).
//   Frames with DOM (src/dom.js) are captured as screenshots of the stage; pure p5 frames are read from the canvas.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, statSync, renameSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const CHROMES = [args.chrome, process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ...playwrightChromes()];
// Chromium builds Playwright downloaded (~/.cache/ms-playwright/chromium-NNNN), newest first
function playwrightChromes() {
  const dir = `${homedir()}/.cache/ms-playwright`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(n => /^chromium-\d+$/.test(n)).sort((a, b) => b.split('-')[1] - a.split('-')[1])
    .map(n => `${dir}/${n}/chrome-linux64/chrome`);
}
const CHROME = CHROMES.find(p => p && existsSync(p));
if (!CHROME) { console.error('Chrome not found: pass --chrome=<path> or set CHROME_PATH'); process.exit(1); }
// frames of different scenes never mix: each scene resumes from its own folder
const fps = +(args.fps || 24), FRAMES_DIR = args['frames-dir'] || `out/frames/${args.scene || 'default'}`;
const run = (cmd, a) => new Promise((ok, bad) => { const p = spawn(cmd, a, { stdio: 'inherit' }); p.on('close', c => c ? bad(new Error(cmd + ' exited ' + c)) : ok()); });
const times = s => String(s).split(',').map(Number);
const span = s => String(s).split(':').map(Number);
// comma-separated fields, keeping commas inside parentheses ('PLK.MX(1.38),PLK.WL,500,300'); numbers stay numbers
const fields = s => { const out = []; let d = 0, cur = ''; for (const ch of String(s)) { if (ch === ',' && !d) { out.push(cur); cur = ''; continue; } d += ch === '(' ? 1 : ch === ')' ? -1 : 0; cur += ch; } out.push(cur); return out.map(v => isNaN(+v) ? v : +v); };


// --soft-gl: no GPU on this machine; render WebGL in software (SwiftShader), which Chrome only allows when asked.
// --gpu-angle=vulkan|gl-egl: headless Linux on an NVIDIA GPU (e.g. a cloud or cluster node); plain --use-gl=angle gets
// no WebGL context there. Check which GPU Chrome actually lands on with gpu_probe.mjs.
const ANGLE = { vulkan: ['--use-angle=vulkan', '--enable-features=Vulkan'], 'gl-egl': ['--use-angle=gl-egl'] };
if (args['gpu-angle'] && !ANGLE[args['gpu-angle']]) { console.error(`--gpu-angle must be one of ${Object.keys(ANGLE)}`); process.exit(1); }
const gpu = args['soft-gl'] ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  : args['gpu-angle'] ? ANGLE[args['gpu-angle']]
  : process.platform === 'win32' ? ['--use-angle=d3d11'] : process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-gl=angle'];
// Ubuntu 23.10+ blocks Chrome's user-namespace sandbox; headless rendering of local files doesn't need it.
const sandbox = process.platform === 'linux' ? ['--no-sandbox'] : [];
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, protocolTimeout: 0,
  args: [...sandbox, '--allow-file-access-from-files', '--ignore-gpu-blocklist', ...gpu, '--enable-gpu-rasterization', '--window-size=1920,1080', '--disable-renderer-backgrounding', '--disable-background-timer-throttling']
});
async function openPage(tag = '') {
  const page = await browser.newPage();
  page.on('console', m => { if (['error', 'warn'].includes(m.type())) console.log(`[page${tag}]`, m.text()); });
  page.on('pageerror', e => console.log(`[page error${tag}]`, e.message));
  await page.goto(pathToFileURL(resolve('studio.html')).href + '?render' + (args.scene ? '&scene=' + encodeURIComponent(args.scene) : ''), { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.ready === true', { timeout: 60000 });
  // the viewport matches the scene's canvas (PROJECT.size), so screenshots of the stage are 1:1
  page.size = await page.evaluate(() => [W, H]);
  await page.setViewport({ width: page.size[0], height: page.size[1], deviceScaleFactor: 1 });
  if (args.loop) {
    const ok = await page.evaluate(name => { if (!LOOPS[name]) return false; window.LOOP = LOOPS[name]; return true; }, args.loop);
    if (!ok) { console.error(`no loop named "${args.loop}"`); process.exit(1); }
  }
  return page;
}
// One capture path for everything: the canvas when the frame is pure p5, else a screenshot of the W × H stage.
const frameOf = async (page, t, type, q) => {
  const url = await page.evaluate((t, type, q) => window.renderAt(t, type, q), t, type, q);
  if (url) return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  const png = type === 'image/png';
  return Buffer.from(await page.screenshot({ type: png ? 'png' : 'jpeg', ...(png ? {} : { quality: Math.round(q * 100) }), clip: { x: 0, y: 0, width: page.size[0], height: page.size[1] }, optimizeForSpeed: true }));
};
// Sound: the scene's plan (lib/audio.js: a music bed plus timed cues) is mixed and normalised to -15 LUFS (-1.5 dBTP);
// with no plan, a single --audio file (or PROJECT.audio) is muxed as it is. Returns ffmpeg input and output args for
// the stretch [a, b] of the film, or null for silence.
async function soundArgs(page, a, b) {
  const plan = await page.evaluate(() => window.audioPlan ? window.audioPlan() : null), len = b - a;
  const legacy = args.audio || await page.evaluate(() => PROJECT.audio || '');
  if (!plan || (!plan.music && !plan.cues.length)) return legacy
    ? { inputs: ['-ss', String(a), '-t', String(len), '-i', legacy], out: ['-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest'] } : null;
  const inputs = [], chains = [], labels = [], fmt = 'aformat=sample_rates=48000:channel_layouts=stereo';
  if (plan.music) {
    const m = plan.music; inputs.push('-i', m.src);
    chains.push(`[1:a]${fmt},atrim=start=${m.from + a},asetpts=PTS-STARTPTS,afade=t=in:d=${a > 0 ? .05 : m.fadeIn},afade=t=out:st=${Math.max(0, len - m.fadeOut)}:d=${m.fadeOut},volume=${m.gain}dB[m]`);
    labels.push('[m]');
  }
  for (const c of plan.cues) {
    const at = c.t - a; if (at < 0 || at >= len) continue;
    const i = inputs.length / 2 + 1; inputs.push('-i', c.src);
    chains.push(`[${i}:a]${fmt},atrim=start=${c.from}${c.dur ? `:duration=${c.dur}` : ''},asetpts=PTS-STARTPTS,volume=${c.gain}dB,adelay=${Math.round(at * 1000)}:all=1[c${i}]`);
    labels.push(`[c${i}]`);
  }
  if (!labels.length) return null;
  chains.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,apad,atrim=duration=${len},loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[aout]`);
  console.log(`sound: ${plan.music ? 'music + ' : ''}${labels.length - (plan.music ? 1 : 0)} cues, normalised to -15 LUFS`);
  return { inputs, out: ['-filter_complex', chains.join(';'), '-map', '0:v', '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k'] };
}
// Contact sheet of frames at times ts, each cell cropped to crop = [x, y, w, h] (screen px), or to a w × h window that
// follows the world point at = [x, y, w, h] through each frame's camera. Assembled on a blank composer page.
async function sheet(page, ts, cols, w, crop, at) {
  const shots = [], ms = [];
  for (const t of ts) {
    const t0 = Date.now(), buf = await frameOf(page, t, 'image/jpeg', .95); ms.push(Date.now() - t0);
    shots.push({ t, src: 'data:image/jpeg;base64,' + buf.toString('base64'), r: at ? await page.evaluate(at => window.cropAt(at), at) : crop || [0, 0, ...page.size] });
  }
  const composer = await browser.newPage();
  const url = await composer.evaluate(async (shots, cols, w) => {
    const [, , cw, ch] = shots[0].r, h = Math.round(w * ch / cw), sc = document.createElement('canvas');
    sc.width = cols * w; sc.height = Math.ceil(shots.length / cols) * h; const c = sc.getContext('2d');
    for (let i = 0; i < shots.length; i++) {
      const img = new Image(); img.src = shots[i].src; await img.decode();
      const x = (i % cols) * w, y = Math.floor(i / cols) * h, [cx, cy] = shots[i].r;
      c.drawImage(img, cx, cy, cw, ch, x, y, w, h);
      c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x, y, 84, 24); c.fillStyle = '#fff'; c.font = '15px sans-serif'; c.fillText(shots[i].t.toFixed(2) + 's', x + 6, y + 17);
    }
    return sc.toDataURL('image/jpeg', .9);
  }, shots, cols, w);
  await composer.close();
  return { url, ms };
}
// the length of whatever is being rendered: a loop's .len, or the video's duration
const lengthOf = page => page.evaluate(() => window.LOOP ? window.LOOP.len : DUR);

if (args.sheet || args.strip) {
  const page = await openPage(), out = args.out || 'out/sheet.jpg'; mkdirSync(dirname(out), { recursive: true });
  let ts;
  if (args.strip) { const [a, b] = span(args.strip); ts = []; for (let i = Math.round(a * fps); i <= Math.round(b * fps); i++) ts.push(i / fps); }
  else ts = times(args.sheet);
  const crop = args.crop ? times(args.crop) : null, at = args['crop-at'] ? fields(args['crop-at']) : null;
  const { url, ms } = await sheet(page, ts, +(args.cols || (args.strip ? 6 : 3)), +(args.w || (args.strip ? 320 : 640)), crop, at);
  writeFileSync(out, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  console.log(`${out}  (${ts.length} frames)  ms/frame: ${ms.join(' ')}`);
} else if (args.stills) {
  const page = await openPage(), out = args.out || 'out/stills'; mkdirSync(out, { recursive: true });
  console.log('GPU:', await page.evaluate(() => window.gpuInfo()));
  for (const s of times(args.stills)) {
    const t0 = Date.now(), buf = await frameOf(page, s, 'image/png');
    const f = `${out}/t${s.toFixed(2).replace('.', '_')}.png`; writeFileSync(f, buf);
    console.log(`${f}  ${Date.now() - t0} ms`);
  }
} else if (args.png) {
  // PNG sequence (for GIFs): a loop's full cycle (frame n equals frame 0, so it isn't rendered), or --range=a:b.
  const probe = await openPage(), len = await lengthOf(probe); await probe.close();
  const [a, b] = args.range ? span(args.range) : [0, len], n = Math.round((b - a) * fps);
  const out = args.out || `out/${args.loop ? 'loop_' + args.loop : 'png'}`, workers = +(args.workers || 3); mkdirSync(out, { recursive: true });
  let next = 0; const start = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage('#' + w);
    while (next < n) { const i = next++; writeFileSync(`${out}/f${String(i).padStart(4, '0')}.png`, await frameOf(page, a + i / fps, 'image/png')); }
  }));
  console.log(`${n} frames → ${out}  (${((Date.now() - start) / n).toFixed(0)} ms/frame)`);
} else if (args.frames) {
  // Parallel and resumable: each worker pulls the next missing frame; files are written atomically.
  const probe = await openPage(), len = await lengthOf(probe); await probe.close();
  const [a, b] = args.range ? span(args.range) : [0, len], workers = +(args.workers || 4);
  mkdirSync(FRAMES_DIR, { recursive: true });
  const first = Math.round(a * fps), last = Math.min(Math.ceil(len * fps) - 1, Math.round(b * fps) - 1);
  const todo = []; for (let i = first; i <= last; i++) { const f = `${FRAMES_DIR}/f${String(i).padStart(5, '0')}.jpg`; if (!existsSync(f) || statSync(f).size < 1000) todo.push(i); }
  console.log(`${todo.length} frames to render (${last - first + 1 - todo.length} already done), ${workers} workers`);
  let next = 0, done = 0; const start = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage('#' + w);
    while (next < todo.length) {
      const i = todo[next++], f = `${FRAMES_DIR}/f${String(i).padStart(5, '0')}.jpg`;
      const buf = await frameOf(page, i / fps, 'image/jpeg', .94);
      writeFileSync(f + '.tmp', buf); renameSync(f + '.tmp', f);
      if (++done % 24 === 0 || done === todo.length) {
        const el = (Date.now() - start) / 1000;
        console.log(`frame ${done}/${todo.length}  ${(el / done * 1000).toFixed(0)} ms/frame effective  eta ${((todo.length - done) * el / done / 60).toFixed(1)} min`);
      }
    }
  }));
} else if (args.clip) {
  const page = await openPage(), len = await lengthOf(page);
  const [a, b] = args.range ? span(args.range) : typeof args.clip === 'string' ? span(args.clip) : [0, len];
  const snd = await soundArgs(page, a, b);
  const out = args.out || 'out/clip.mp4'; mkdirSync(dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    ...(snd ? [...snd.inputs, ...snd.out] : []),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((b - a) * fps), start = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await frameOf(page, a + i / fps, 'image/jpeg', .93);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 24 === 0 || i === n - 1) console.log(`frame ${i + 1}/${n}  ${((Date.now() - start) / (i + 1)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(`wrote ${out}`);
} else if (args.encode) {
  // frames on disk → MP4, with the scene's sound (a page is opened only to read the sound plan and length)
  const page = await openPage(), len = await lengthOf(page), out = args.out || 'out/video.mp4';
  const n = readdirSync(FRAMES_DIR).filter(f => f.endsWith('.jpg')).length, snd = await soundArgs(page, 0, Math.min(len, n / fps));
  console.log(`encoding ${n} frames → ${out}`);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-stats', '-framerate', String(fps), '-i', `${FRAMES_DIR}/f%05d.jpg`,
    ...(snd ? [...snd.inputs, ...snd.out] : []),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
  console.log('wrote ' + out);
} else {
  console.log('nothing to do: see the usage notes at the top of render.mjs');
}
await browser.close();
