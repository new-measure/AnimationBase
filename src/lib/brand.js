// brand.js: the brand's marks and the end card, from PROJECT.brand. End cards close 65–88% of designed launch films
// and hold 3.3–4.6 s (measured); the logo appears first, then the line, then the call to action, and it holds.
//   PROJECT.brand = { name, tagline, cta, url, logo, accent, font, ... } where logo is one of
//     { d: '<svg path>', viewBox: '0 0 24 24', stroke: true }   drawn in the onAccent colour on an accent tile
//     { src: 'assets/logo.svg' }                                an image (decoded before capture)
//     omitted                                                   a monogram tile (first letter of the name)
//   Brand.mark(key, size, props)                     the logo mark
//   Brand.lockup(key, t, t0, props, o)               mark + wordmark: the mark lands, the wordmark slides out from
//                                                    behind it (o.size wordmark px, o.stack for mark above name)
//   Brand.endCard(t, t0, dur, o)                     the whole end card: background, lock-up, tagline, call to action
//                                                    (button or URL), a fade out over the last o.fade s
//   Brand.partner(key, t, t0, other, props, o)       "Name × Other" lock-up for partnership launches
//   Brand.safe()                                     { x, y, w, h } of the safe area (THEME.margin on every side)
const Brand = (() => {
  const B = () => ({ name: 'Product', ...(PROJECT.brand || {}) });
  function mark(key, s, props = {}) {
    const b = B(), L = b.logo || {};
    if (L.src) return D.img(key, L.src, { w: s, h: s, ...props, style: { objectFit: 'contain', ...(props.style || {}) } });
    D.div(key, { w: s, h: s, radius: s * .28, bg: THEME.accent, ...props, style: { display: 'grid', placeItems: 'center', flexShrink: 0, ...(props.style || {}) } }, () => {
      if (L.d) D.svg({ w: s * .58, h: s * .58, attrs: { viewBox: L.viewBox || '0 0 24 24' } }, () =>
        D.path({ attrs: L.stroke === false ? { d: L.d, fill: THEME.onAccent } : { d: L.d, fill: 'none', stroke: THEME.onAccent, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } }));
      else D.text(b.name[0], { font: `600 ${s * .5}px ${THEME.font}`, color: THEME.onAccent });
    });
  }
  function lockup(key, t, t0, props = {}, o = {}) {
    const b = B(), size = px(o.size || 96), ms = size * .92, km = anim(t, t0, 'card'), kw = anim(t, t0 + MOTION.stagger * 2, 'text');
    D.div(key, { ...props, style: { display: 'flex', flexDirection: o.stack ? 'column' : 'row', alignItems: 'center', gap: size * .24, ...(props.style || {}) } }, () => {
      mark('mark', ms, enter(km, 'scale'));
      // the wordmark slides out from behind the mark: a clip that opens as it moves
      D.div('wm', { style: { overflow: 'hidden', padding: `0 ${size * .04}px`, clipPath: o.stack ? 'none' : `inset(-20% ${(1 - kw) * 100}% -20% 0)` } }, () =>
        D.text(b.name, { font: `600 ${size}px ${THEME.font}`, color: THEME.text, style: { letterSpacing: '-0.035em', display: 'block', whiteSpace: 'nowrap' },
          ...(o.stack ? enter(kw, 'rise', 16) : { dx: -(1 - kw) * size * .6, opacity: clamp(kw * 2) }) }));
    });
  }
  function endCard(t, t0, dur, o = {}) {
    const b = B(), lt = t - t0, out = anim(lt, dur - (o.fade ?? .6), 'default'), cy = H * (o.y ?? .44);
    if (o.bg !== false) D.div('ec:bg', { w: W, h: H, bg: THEME.bg });
    if (o.glow !== false) FX.glow('ec:glow', W / 2, cy, Math.max(W, H) * .42);
    D.group('ec', { opacity: 1 - out }, () => {
      lockup('ec:lock', lt, .05, { x: W / 2, y: cy, ax: .5, ay: .5 }, { size: o.size || 96, stack: H > W });
      const tag = o.tagline ?? b.tagline, cta = o.cta ?? b.cta, url = o.url ?? b.url, below = px(H > W ? 190 : 118);
      if (tag) Type.line('ec:tag', tag, lt, .6, { x: W / 2, y: cy + below, ax: .5, ay: .5 }, { size: 'title', weight: 400, color: THEME.muted });
      if (cta) UI.button('ec:cta', cta, { x: W / 2, y: cy + below + px(92), ax: .5, ay: .5, ...enter(anim(lt, 1.1, 'card'), 'rise', 14) }, { primary: true });
      else if (url) Type.line('ec:url', url, lt, 1.1, { x: W / 2, y: cy + below + px(80), ax: .5, ay: .5 }, { size: 'body', weight: 500, color: THEME.accent });
    });
  }
  function partner(key, t, t0, other, props = {}, o = {}) {
    const b = B(), size = px(o.size || 72), f = `600 ${size}px ${THEME.font}`;
    D.div(key, { ...props, style: { display: 'flex', alignItems: 'center', gap: size * .45, ...(props.style || {}) } }, () => {
      D.text(b.name, { font: f, color: THEME.text, ...enter(anim(t, t0, 'text'), 'slide', -30) });
      D.text('×', { font: `300 ${size * .8}px ${THEME.font}`, color: THEME.faint, ...enter(anim(t, t0 + MOTION.stagger, 'text'), 'scale') });
      D.text(other, { font: f, color: THEME.text, ...enter(anim(t, t0 + MOTION.stagger * 2, 'text'), 'slide', 30) });
    });
  }
  const safe = () => { const m = THEME.margin * Math.min(W, H); return { x: m, y: m, w: W - 2 * m, h: H - 2 * m }; };
  return { mark, lockup, endCard, partner, safe };
})();
