// make_demo_assets.mjs: generates stand-in media for projects/demo/ (a project needs real footage, recordings and
// music; these let the pipeline be built and tested without any). Everything is made here: nothing third-party.
//   frame_counter.mp4   320×180, 24 fps, 10 s: frame N is encoded in luma (top half 24 + 12·floor(N/16), bottom half
//                       24 + 12·(N mod 16): inside the limited range, so no level clips) so a render can prove the video
//                       layer shows exactly the right frame
//   screen.mp4          a "screen recording": 8 s of our own launch_demo (5–13 s), re-encoded
//   broll.mp4           "footage": a slow drifting gradient, 12 s
//   music.wav           a soft 110 BPM pad with a light pulse, 24 s
//   logo.svg            the demo brand's logo
//   node scripts/make_demo_assets.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const A = 'projects/demo/assets'; mkdirSync(A, { recursive: true });
const ff = (...args) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status) { console.error('ffmpeg failed:', args.join(' ')); process.exit(1); } };
const x264 = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];

ff('-f', 'lavfi', '-i', 'color=black:s=320x180:r=24:d=10', '-vf', "geq=lum='24+12*if(lt(Y,H/2),floor(N/16),mod(N,16))':cb=128:cr=128", ...x264, '-crf', '2', '-g', '24', `${A}/frame_counter.mp4`);

const F = 'out/frames/launch_demo';
if (!existsSync(F) || readdirSync(F).length < 312) {
  const r = spawnSync('node', ['render.mjs', '--scene=launch_demo', '--frames', '--range=5:13', '--workers=4'], { stdio: 'inherit' }); if (r.status) process.exit(1);
}
ff('-framerate', '24', '-start_number', '120', '-i', `${F}/f%05d.jpg`, '-frames:v', '192', ...x264, '-crf', '18', `${A}/screen.mp4`);

ff('-f', 'lavfi', '-i', 'gradients=s=1920x1080:c0=0x1b2a4a:c1=0x6a4c93:c2=0xd98a5f:c3=0x2e6f73:n=4:speed=0.004:r=24:d=12,eq=saturation=0.85',
  ...x264, '-crf', '22', `${A}/broll.mp4`);   // no baked noise: it's incompressible (grain comes from FX.grain)

// 110 BPM: a four-chord pad (Cmaj7, Am7, Fmaj7, G6), one chord a bar, with a soft pulse on each beat
const B = 60 / 110, bar = 4 * B, chords = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 329.6]];
const voice = (i) => chords.map((c, k) => `if(eq(mod(floor(t/${bar}),4),${k}),${c[i]},0)`).join('+');
const pad = [0, 1, 2, 3].map(i => `sin(2*PI*(${voice(i)})*t)`).join('+');
const expr = `(${pad})*0.09*(0.75+0.25*exp(-mod(t,${B})*5)) + sin(2*PI*55*t)*exp(-mod(t,${B})*18)*0.22`;
ff('-f', 'lavfi', '-i', `aevalsrc='${expr}':s=48000:d=24:c=stereo`, '-af', 'lowpass=f=3200,afade=t=in:d=1.2,afade=t=out:st=22:d=2', `${A}/music.wav`);

writeFileSync(`${A}/logo.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#0E7C66"/><path d="M18 40 C26 18 38 18 46 40" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="44" r="4.5" fill="#fff"/></svg>`);
console.log(`demo assets → ${A}/`);
