// check_video_frames.mjs: proves D.video is frame-exact. Renders scene video_test at many times (in shuffled order),
// decodes the frame number from each still's pixels (see src/scenes/video_test.js) and compares it with the expected
// source frame: floor(24 · media time). Exits non-zero on any mismatch.
//   node scripts/check_video_frames.mjs
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
const times = []; for (let i = 0; i < 40; i++) times.push(+((i * 0.173 + (i % 7) * 0.041) % 7.9).toFixed(3));
times.sort((a, b) => Math.sin(a * 91) - Math.sin(b * 91));   // out of order, like parallel rendering
const out = 'out/check/video_frames';
spawnSync('rm', ['-rf', out]);
const r = spawnSync('node', ['render.mjs', '--scene=video_test', `--stills=${times.join(',')}`, `--out=${out}`], { stdio: 'inherit' }); if (r.status) process.exit(1);
const lum = (f, x, y) => { const b = spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-vf', `crop=40:40:${x - 20}:${y - 20},format=gray,scale=1:1:flags=area`, '-f', 'rawvideo', '-'], { encoding: 'buffer' }).stdout; return b[0]; };
// the video's luma is limited range (16–235) and the browser shows it expanded to 0–255 (measured: shown = (Y − 16) ·
// 255/219), so map back, then read the level: Y = 24 + 12·k
const k = v => Math.round((v * 219 / 255 + 16 - 24) / 12);
const frameAt = (f, x0) => 16 * k(lum(f, x0, 270)) + k(lum(f, x0, 810));
let bad = 0;
for (const t of times) {
  const f = `${out}/t${t.toFixed(2).replace('.', '_')}.png`;
  const expA = Math.floor(24 * t + 1e-6), expB = Math.floor(24 * (1 + t * .5) + 1e-6), a = frameAt(f, 480), b = frameAt(f, 1440);
  const ok = a === expA && b === expB; if (!ok) bad++;
  console.log(`t=${t.toFixed(3)}  left ${a} (want ${expA})  right ${b} (want ${expB})  ${ok ? 'ok' : 'MISMATCH'}`);
}
console.log(bad ? `${bad} of ${times.length} frames wrong` : `all ${times.length} frames exact`);
process.exit(bad ? 1 : 0);
