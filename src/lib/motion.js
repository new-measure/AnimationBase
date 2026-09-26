// motion.js: motion presets measured from top-tier launch films (docs/motion_design_spec.md), as pure functions of t.
//   Moves last ~0.55 s with a balanced ease-in-out; cards enter fast with an ease-out over ~9 frames; items in a group
//   start 4 frames apart; the frame holds ~1.25 s after a move lands. Overshoot is almost never used (3% of moves), so
//   no preset has it; 'playful' (backOut) is opt-in for character or toy-like briefs.
const EASE = {
  inOut: x => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: x => 1 - Math.pow(1 - clamp(x), 3),
  outQuart: x => 1 - Math.pow(1 - clamp(x), 4),
  in: x => Math.pow(clamp(x), 3),
  linear: x => clamp(x),
  back: x => backOut(x),
};
const MOTION = {
  default: { dur: .55, ease: 'inOut' },
  card: { dur: .38, ease: 'outQuart' },
  panel: { dur: .65, ease: 'out' },
  text: { dur: .65, ease: 'inOut' },
  camera: { dur: .75, ease: 'inOut' },
  exit: { dur: .35, ease: 'in' },
  playful: { dur: .5, ease: 'back' },
  stagger: 4 / 24,      // s between items in a group
  hold: 1.25,           // s of stillness after a move lands, before the next read
};
// anim(t, t0, preset): eased progress 0 → 1 of a move starting at t0. preset: a MOTION name or { dur, ease }.
function anim(t, t0, preset = 'default') {
  const p = typeof preset === 'string' ? MOTION[preset] : preset;
  return EASE[p.ease](seg(t, t0, t0 + p.dur));
}
// life(t, tIn, tOut, pIn, pOut): 0 → 1 on the way in, 1 → 0 on the way out (tOut = null: stays).
function life(t, tIn, tOut = null, pIn = 'default', pOut = 'exit') {
  return anim(t, tIn, pIn) * (tOut == null ? 1 : 1 - anim(t, tOut, pOut));
}
// enter(k, how, d): props for an element at entrance progress k. Spread them into a D.* call after its own props: they
// only set opacity, the dx/dy offsets, scale and blur, so the element's x, y stay put.
//   'rise' (up from d px), 'fall', 'slide' (from the right by d; negative d: from the left), 'scale' (from 96%, no
//   overshoot), 'fade', 'blur' (rise + blur). Measured shares of key moves: fade 32%, slide 32%, scale 20%, rise 11%.
function enter(k, how = 'rise', d = 24) {
  const o = { opacity: clamp(k * 1.4) };
  if (how === 'rise' || how === 'blur') o.dy = (1 - k) * px(d);
  if (how === 'fall') o.dy = -(1 - k) * px(d);
  if (how === 'slide') o.dx = (1 - k) * px(d);
  if (how === 'scale') o.scale = .96 + .04 * k;
  if (how === 'blur') o.blur = (1 - k) * 10;
  return o;
}
