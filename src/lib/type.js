// type.js: typography that moves, on the DOM layer, as pure functions of t. Defaults follow the measured spec: one sans
// family, headline 64 px at weight 500, text moves ~0.65 s ease-in-out, words 4 frames apart, no overshoot.
//   Type.line(key, str, t, t0, props, o)     a line that enters (and optionally leaves) as one piece
//   Type.words(key, str, t, t0, props, o)    words entering one after another; o.accent: indices of words in the accent
//                                            colour; o.mark: { i, t0 } a highlighter sweep behind word i
//   Type.swap(key, keys, t, props, o)        [[t0, 'text'], [t1, 'text'], ...]: each replaces the last in place (the old line
//                                            leaves first, then the new one arrives: one read at a time)
//   Type.counter(key, from, to, t, t0, dur, props, o)   a number rolling up, formatted by o.fmt
//   Type.typed(str, t, t0, cps)              { text, n, done, end }: str typed at a human pace (deterministic jitter)
//   Type.charTimes(str, t0, cps)             the time each character appears (for typing sounds: Sound.typing)
// Common props: x, y, ax, ay (anchor), w, and o.size ('headline', 'title', ... or px), o.weight, o.color, o.align.
// o.how: 'rise' (default), 'fade', 'slide', 'scale', 'blur', or 'mask' (the line rises out of a clip). o.out: exit time.
const Type = (() => {
  const font = o => {
    const size = typeof o.size === 'number' ? o.size : THEME.size[o.size || 'headline'];
    return `${o.weight || THEME.weight.strong} ${px(size)}px ${o.font || THEME.font}`;
  };
  const base = o => ({ font: font(o), color: o.color || THEME.text, style: { whiteSpace: 'nowrap', letterSpacing: o.tracking ?? '-0.02em', lineHeight: 1.12, textAlign: o.align || 'left', ...(o.style || {}) } });

  function line(key, str, t, t0, props = {}, o = {}) {
    const k = life(t, t0, o.out ?? null, o.preset || 'text');
    if (k <= 0 && t > t0) return;
    if (o.how === 'mask') {   // the text rises into view from behind its own baseline
      D.div(key, { ...props, style: { overflow: 'hidden', ...(props.style || {}) } }, () =>
        D.text(str, { ...base(o), pos: 'flow', dy: (1 - k) * px(size(o)) * 1.15, style: { ...base(o).style, display: 'block' } }));
      return;
    }
    D.text(key, str, { ...props, ...base(o), ...enter(k, o.how || 'rise', o.dist ?? 24) });
  }
  const size = o => typeof o.size === 'number' ? o.size : THEME.size[o.size || 'headline'];

  function words(key, str, t, t0, props = {}, o = {}) {
    const list = str.split(' '), gap = o.stagger ?? MOTION.stagger, acc = new Set(o.accent || []);
    const kOut = o.out == null ? 1 : 1 - anim(t, o.out, 'exit');
    // the word gap is a quarter of the TEXT size (an em of the row itself would be the page's 16 px)
    D.div(key, { ...props, style: { display: 'flex', gap: `${.26 * px(size(o))}px`, rowGap: `${.08 * px(size(o))}px`, flexWrap: o.wrap ? 'wrap' : 'nowrap', justifyContent: o.align === 'center' ? 'center' : 'flex-start', ...(props.style || {}) } }, () => {
      list.forEach((w, i) => {
        const k = anim(t, t0 + i * gap, o.preset || 'text') * kOut;
        const m = o.mark && o.mark.i === i ? anim(t, o.mark.t0, 'default') : 0;
        D.text(w, { ...base(o), color: acc.has(i) ? THEME.accent : o.color || THEME.text, ...enter(k, o.how || 'rise', o.dist ?? 24),
          style: { ...base(o).style, display: 'inline-block',
            ...(o.mark && o.mark.i === i ? { backgroundImage: `linear-gradient(${alpha(THEME.accent, .18)}, ${alpha(THEME.accent, .18)})`, backgroundRepeat: 'no-repeat',
              backgroundSize: `${m * 100}% 100%`, padding: '0 .08em', margin: '0 -.08em', borderRadius: px(6) } : {}) } });
      });
    });
  }

  function swap(key, keys, t, props = {}, o = {}) {
    let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const [t0, str] = keys[i];
    D.div(key, { ...props, style: { position: 'absolute', ...(props.style || {}) } }, () => {
      // one read at a time: the previous line rises out and fades (MOTION.exit), then this one rises in on the same baseline
      const ex = MOTION.exit.dur;
      if (i > 0 && t - t0 < ex) {
        const k = anim(t, t0, 'exit');
        D.text(keys[i - 1][1], { ...base(o), pos: 'abs', opacity: 1 - k, dy: -k * px(28) });
      }
      const kin = anim(t, t0 + (i > 0 ? ex : 0), o.preset || 'text');
      D.text(str, { ...base(o), pos: 'abs', ...enter(kin, 'rise', 18) });
    });
  }

  function counter(key, from, to, t, t0, dur = 1.2, props = {}, o = {}) {
    const k = EASE.out(seg(t, t0, t0 + dur)), v = from + (to - from) * k;
    const fmt = o.fmt || (x => Math.round(x).toLocaleString('en-US'));
    D.text(key, fmt(v), { ...props, ...base(o), style: { ...base(o).style, fontVariantNumeric: 'tabular-nums' } });
  }

  // Typing at a human pace: cps characters a second on average, each gap jittered ±40% by a fixed hash, a little longer
  // after spaces and punctuation. Pure: the same (str, t0) always types the same way.
  // the time each character appears (index i: character i has appeared from times[i] on)
  function charTimes(str, t0, cps = 16) {
    const out = []; let at = t0;
    for (let i = 0; i < str.length; i++) { at += (1 / cps) * (.6 + .8 * hash(i * 13.7 + str.length)) * (/[ ,.]/.test(str[i - 1] || '') ? 1.6 : 1); out.push(at); }
    return out;
  }
  function typed(str, t, t0, cps = 16) {
    const ts = charTimes(str, t0, cps); let n = 0; while (n < ts.length && t >= ts[n]) n++;
    return { text: str.slice(0, n), n, done: n === str.length, end: ts.length ? ts[ts.length - 1] : t0 };
  }

  return { line, words, swap, counter, typed, charTimes, font };
})();
