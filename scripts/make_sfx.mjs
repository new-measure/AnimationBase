// make_sfx.mjs: generates the kit's small UI sound-effect library into assets/sfx/ with ffmpeg, from expressions only
// (no samples, no third-party audio), so the sounds are ours and deterministic. Re-run to regenerate.
//   node scripts/make_sfx.mjs
// click    a short, soft tick for cursor clicks and key presses
// tick     a lighter tick for checkboxes and toggles
// pop      a rounded blip for cards and chips appearing
// whoosh   filtered noise swelling and fading, for whips, zooms and wipes
// chime    two soft bell partials, for success moments and end cards
// type     a very short key tap, for typing (use one cue per few characters, not per character)
// and a music bed, assets/music/soft_pad_110.m4a: a calm 110 BPM four-chord pad with a light pulse, 64 s (fades out;
// use o.from / the film's length to take what you need)
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const OUT = 'assets/sfx'; mkdirSync(OUT, { recursive: true });
const SR = 48000;
const SOUNDS = {
  click: { d: .06, e: `(random(0)*2-1)*exp(-t*140)*0.5 + sin(2*PI*2400*t)*exp(-t*90)*0.25`, f: 'highpass=f=900,lowpass=f=7000' },
  tick: { d: .04, e: `sin(2*PI*3200*t)*exp(-t*160)*0.35 + (random(0)*2-1)*exp(-t*300)*0.2`, f: 'highpass=f=1500' },
  pop: { d: .16, e: `sin(2*PI*(520+900*exp(-t*38))*t)*exp(-t*28)*0.55`, f: 'lowpass=f=5000' },
  whoosh: { d: .7, e: `(random(0)*2-1)*0.6*sin(PI*t/0.7)^2`, f: 'bandpass=f=1200:width_type=o:w=2.2,lowpass=f=4000,afade=t=in:d=0.25,afade=t=out:st=0.4:d=0.3' },
  chime: { d: 1.4, e: `(sin(2*PI*1318.5*t)*0.35+sin(2*PI*1975.5*t)*0.18+sin(2*PI*2637*t)*0.07)*exp(-t*3.2)*(1-exp(-t*400))`, f: 'lowpass=f=9000' },
  type: { d: .035, e: `(random(0)*2-1)*exp(-t*220)*0.35 + sin(2*PI*1800*t)*exp(-t*200)*0.15`, f: 'highpass=f=1200' },
};
for (const [name, s] of Object.entries(SOUNDS)) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `aevalsrc='${s.e}':s=${SR}:d=${s.d}:c=mono`, '-af', `${s.f},volume=0.9`, '-ar', String(SR), `${OUT}/${name}.wav`], { stdio: 'inherit' });
  if (r.status) { console.error(`failed: ${name}`); process.exit(1); }
}
// the bed: Cmaj7, Am7, Fmaj7, G6, one chord a bar at 110 BPM, with a soft kick on every beat
mkdirSync('assets/music', { recursive: true });
const B = 60 / 110, bar = 4 * B, chords = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 329.6]];
const voice = i => chords.map((c, k) => `if(eq(mod(floor(t/${bar}),4),${k}),${c[i]},0)`).join('+');
const pad = [0, 1, 2, 3].map(i => `sin(2*PI*(${voice(i)})*t)`).join('+');
const bed = `(${pad})*0.09*(0.75+0.25*exp(-mod(t,${B})*5)) + sin(2*PI*55*t)*exp(-mod(t,${B})*18)*0.22`;
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `aevalsrc='${bed}':s=48000:d=64:c=stereo`, '-af', 'lowpass=f=3200,afade=t=in:d=1,afade=t=out:st=60:d=4',
  '-c:a', 'aac', '-b:a', '96k', 'assets/music/soft_pad_110.m4a'], { stdio: 'inherit' });
if (r.status) { console.error('failed: music bed'); process.exit(1); }
console.log(`wrote ${Object.keys(SOUNDS).length} sounds → ${OUT}/ and the bed → assets/music/soft_pad_110.m4a`);
