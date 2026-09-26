// transitions.js: transitions for DOM scenes. Measured in UI films: hard cuts 87%, push/zoom 65%, match or morph 43%,
// fade or dissolve 39%, pans 17%, whips 13%, mask wipes 9%. Two kinds:
//   covers   drawn last, in screen space, across the seam: p runs 0 → 1 over the transition and the cut to the next
//            shot happens under full cover at p = .5 (the same contract as brushWipe):
//              end of shot A:   Tx.wipe((lt - (dur - d / 2)) / d)     start of shot B:   Tx.wipe(.5 + lt / d)
//            Tx.dip(p, color)            dip to a colour
//            Tx.wipe(p, o)               a panel sweeping across (o.angle degrees, o.color)
//            Tx.iris(p, x, y, o)         a circle closing on (x, y), then opening from it
//            Tx.grid(p, o)               tiles popping in to cover, then out (o.cols, o.rows, o.color)
//   moves    props for the content group on each side of a cut (spread into a D.group around the shot):
//            Tx.whip(k, dir)             whip pan: k 0 → 1 leaving (A) or 1 → 0 arriving (B); motion blur included
//            Tx.zoom(k, dir)             zoom through: A scales up and fades while B lands from a smaller scale
// And a real cross-dissolve between two shots: give the second shot { xfade: seconds } in shots() (see timeline.js).
// Layout morph (a shared element moving from one frame to the next): Tx.rect(a, b, k) interpolates { x, y, w, h, r }.
const Tx = (() => {
  const cover = p => p < .5 ? EASE.inOut(p * 2) : 1 - EASE.inOut((p - .5) * 2);
  function dip(p, col = THEME.bg) { if (p <= 0 || p >= 1) return; D.div('tx:dip', { w: W, h: H, bg: col, opacity: cover(p), pos: 'abs' }); }
  function wipe(p, o = {}) {
    if (p <= 0 || p >= 1) return;
    const k = p < .5 ? EASE.inOut(p * 2) : EASE.inOut((p - .5) * 2), L = Math.hypot(W, H);
    // in: the panel's leading edge crosses the frame; out: its trailing edge leaves on the far side
    const x = p < .5 ? lerp(-L, 0, k) : lerp(0, L, k);
    D.div('tx:wipe', { x: W / 2, y: H / 2, w: L * 1.02, h: L, ax: .5, ay: .5, rot: o.angle ?? -12, pos: 'abs', bg: o.color || THEME.accent, _tf: `translateX(${x}px)` });
  }
  function iris(p, x = W / 2, y = H / 2, o = {}) {
    if (p <= 0 || p >= 1) return;
    const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)), r = R * (1 - cover(p));
    D.div('tx:iris', { w: W, h: H, pos: 'abs', style: { background: `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, ${o.color || THEME.text} ${r + 1}px)` } });
  }
  function grid(p, o = {}) {
    if (p <= 0 || p >= 1) return;
    const cols = o.cols || 8, rows = o.rows || Math.round(cols * H / W), cw = W / cols, ch = H / rows;
    D.group('tx:grid', { pos: 'abs' }, () => {
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const d = ((i + j) / (cols + rows)) * .5, q = p < .5 ? EASE.out(clamp((p * 2 - d) / .5)) : 1 - EASE.in(clamp(((p - .5) * 2 - d) / .5));
        if (q <= 0) continue;
        D.div(null, { x: i * cw + cw / 2, y: j * ch + ch / 2, w: cw + 1, h: ch + 1, ax: .5, ay: .5, scale: q, bg: o.color || THEME.accent, radius: px(8) * (1 - q) });
      }
    });
  }
  const whip = (k, dir = -1) => ({ dx: dir * W * .9 * EASE.in(k), blur: 40 * Math.sin(Math.PI * clamp(k)) });
  const zoom = (k, dir = 1) => dir > 0 ? { scale: 1 + 2.5 * EASE.in(k), opacity: 1 - EASE.in(k), blur: 16 * k } : { scale: .7 + .3 * EASE.out(1 - k), opacity: 1 - k };
  const rect = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), radius: lerp(a.r ?? 0, b.r ?? 0, k) });
  return { dip, wipe, iris, grid, whip, zoom, rect, cover };
})();
