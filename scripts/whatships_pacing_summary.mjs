// whatships_pacing_summary.mjs: turns the per-film measurements (refs/whatships/pacing/<slug>.json, from
// whatships_pacing.mjs) and beat annotations (pacing/beats/<slug>.json, from the vision pass over the sheets) into
// refs/whatships/pacing.md: measured pacing and structure per visual family. Fails if a measured film has no beats file
// or a beats file is malformed.
//   node scripts/whatships_pacing_summary.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const DIR = 'refs/whatships', P = `${DIR}/pacing`;
const KINDS = ['hook', 'problem', 'intro', 'demo', 'feature', 'proof', 'montage', 'story', 'transition', 'end_card', 'other'];
const TRANS = ['cut', 'push_zoom', 'pan_slide', 'fade_dissolve', 'morph_match', 'wipe_mask', 'whip_blur', 'none_visible'];
const CAMS = ['static', 'push_in', 'pan', 'zoom_out_reveal', 'tilt_3d', 'handheld'];
const genres = JSON.parse(readFileSync(`${DIR}/genres.json`, 'utf8'));

const films = readdirSync(P).filter(f => f.endsWith('.json') && f !== 'sample.json').map(f => JSON.parse(readFileSync(`${P}/${f}`, 'utf8')));
const ok = films.filter(f => !f.error), failed = films.filter(f => f.error);
const errors = [], beats = {};
for (const f of ok) {
  const bf = `${P}/beats/${f.slug}.json`;
  if (!existsSync(bf)) { errors.push(`no beats for ${f.slug}`); continue; }
  let b; try { b = JSON.parse(readFileSync(bf, 'utf8')); } catch (e) { errors.push(`${f.slug}: beats not JSON`); continue; }
  if (!Array.isArray(b.beats) || !b.beats.length) errors.push(`${f.slug}: no beats`);
  for (const x of b.beats || []) if (!KINDS.includes(x.kind) || !(x.end > x.start)) errors.push(`${f.slug}: bad beat ${JSON.stringify(x)}`);
  for (const t of b.transitions || []) if (!TRANS.includes(t)) errors.push(`${f.slug}: bad transition ${t}`);
  for (const c of b.camera || []) if (!CAMS.includes(c)) errors.push(`${f.slug}: bad camera ${c}`);
  if (!['slow', 'medium', 'fast'].includes(b.pace)) errors.push(`${f.slug}: bad pace ${b.pace}`);
  beats[f.slug] = b;
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const q = (a, p) => { const s = a.filter(x => x != null && !isNaN(x)).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const f1 = x => x == null ? '–' : (Math.round(x * 10) / 10).toString();
const pct = (n, d) => d ? `${Math.round(100 * n / d)}%` : '–';
const fams = Object.keys(genres).filter(k => ok.some(f => f.family === k));
const rows = [], detail = [];
for (const k of fams) {
  const L = ok.filter(f => f.family === k), B = L.map(f => beats[f.slug]);
  const shots = L.flatMap(f => f.shots), beatLens = B.flatMap(b => b.beats.filter(x => x.kind !== 'transition').map(x => x.end - x.start));
  const endCards = B.map((b, i) => b.end_card ? L[i].duration - b.end_card.start : null);
  rows.push([`${genres[k].name}`, L.length, f1(q(L.map(f => f.duration), .5)), f1(q(shots, .5)), f1(q(L.map(f => f.cutsPerMin), .5)),
    pct(L.reduce((a, f) => a + f.holdSeconds, 0), L.reduce((a, f) => a + Math.ceil(f.duration), 0)), f1(q(beatLens, .5)),
    f1(q(B.map(b => b.first_text_s), .5)), f1(q(B.map(b => b.first_product_s), .5)), f1(q(endCards, .5)),
    pct(B.filter(b => b.end_card).length, B.length), pct(L.filter(f => f.hasAudio).length, L.length)]);
  const kindCount = {}; for (const b of B) for (const x of new Set(b.beats.map(x => x.kind))) kindCount[x] = (kindCount[x] || 0) + 1;
  const tr = {}; for (const b of B) for (const t of b.transitions || []) tr[t] = (tr[t] || 0) + 1;
  const cam = {}; for (const b of B) for (const c of b.camera || []) cam[c] = (cam[c] || 0) + 1;
  const pace = {}; for (const b of B) pace[b.pace] = (pace[b.pace] || 0) + 1;
  const open = {}; for (const b of B) open[b.beats[0].kind] = (open[b.beats[0].kind] || 0) + 1;
  const seq = b => b.beats.filter(x => x.kind !== 'transition').map(x => x.kind).filter((x, i, a) => x !== a[i - 1]).join(' → ');
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([x, n]) => `${x} ${pct(n, L.length)}`).join(', ');
  detail.push(`## ${genres[k].name} (${L.length} films measured of ${genres[k].count})`, '',
    `- Length: median ${f1(q(L.map(f => f.duration), .5))} s (middle half ${f1(q(L.map(f => f.duration), .25))}–${f1(q(L.map(f => f.duration), .75))} s).`,
    `- Shots between hard cuts: median ${f1(q(shots, .5))} s (middle half ${f1(q(shots, .25))}–${f1(q(shots, .75))} s); ${f1(q(L.map(f => f.cutsPerMin), .5))} cuts a minute.`,
    `- Beats: median ${f1(q(beatLens, .5))} s each (middle half ${f1(q(beatLens, .25))}–${f1(q(beatLens, .75))} s), ${f1(q(B.map(b => b.beats.filter(x => x.kind !== 'transition').length), .5))} per film.`,
    `- Opens with: ${top(open)}.`,
    `- Films containing each beat kind: ${top(kindCount)}.`,
    `- First text on screen at ${f1(q(B.map(b => b.first_text_s), .5))} s; product first seen at ${f1(q(B.map(b => b.first_product_s), .5))} s (medians).`,
    `- End card in ${pct(B.filter(b => b.end_card).length, L.length)} (logo ${pct(B.filter(b => b.end_card?.logo).length, L.length)}, call to action ${pct(B.filter(b => b.end_card?.cta).length, L.length)}); it lasts ${f1(q(endCards, .5))} s (median).`,
    `- Full-screen text moments: median ${f1(q(B.map(b => b.text_cards), .5))} per film.`,
    `- Transitions seen: ${top(tr)}.`, `- Camera: ${top(cam)}.`, `- Pace: ${top(pace)}.`,
    `- Audio: ${pct(L.filter(f => f.hasAudio).length, L.length)} have sound; median loudness ${f1(q(L.map(f => f.lufs), .5))} LUFS.`,
    `- Stills: ${pct(L.reduce((a, f) => a + f.holdSeconds, 0), L.reduce((a, f) => a + Math.ceil(f.duration), 0))} of seconds are near-still holds (mean change score < 0.15).`,
    '', 'Structures (beat kinds in order, repeats merged):', '', ...L.slice(0, 12).map(f => `- \`${f.slug}\` (${f1(f.duration)} s): ${seq(beats[f.slug])}`), '');
}
const head = ['family', 'films', 'length s', 'shot s', 'cuts/min', 'still', 'beat s', 'first text s', 'product at s', 'end card s', 'end card', 'sound'];
writeFileSync(`${DIR}/pacing.md`, [
  `# What Ships: measured pacing and structure`, '',
  `${ok.length} films across ${fams.length} families (${failed.length} could not be fetched). Each was downloaded to a temp file,`,
  `measured, and deleted; only the numbers below and the beat annotations are kept. Measurements come from`,
  `scripts/whatships_pacing.mjs (cuts, shots, stills, audio) and the vision pass over one-frame-a-second sheets`,
  `(beats, text, product, end card, transitions). All values are medians. "Shot" is the time between hard cuts;`,
  `"beat" is a unit of content from the annotations, which also counts soft transitions.`, '',
  `| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`), '',
  ...detail,
].join('\n'));
console.log(`pacing.md: ${ok.length} films, ${fams.length} families${failed.length ? `; failed: ${failed.map(f => f.slug + ' (' + f.error + ')').join(', ')}` : ''}`);
