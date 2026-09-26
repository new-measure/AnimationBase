// fx.js: looks and atmosphere: moving gradients, grain, glow, vignette (DOM), and particle fields that form shapes
// (painted by p5 on the canvas layer: the scene needs canvasBg: null and a D.canvas() call where they should sit).
// Everything is a pure function of t: particles are closed-form (a seeded home position, a drift, an eased path to a
// target point), never simulated.
//   FX.gradient(key, t, o)        soft gradient field: o.colors (2–4), o.speed, o.base (background colour)
//   FX.glow(key, x, y, r, o)      a soft radial light (o.color, o.opacity)
//   FX.grain(key, t, o)           film grain over everything (o.opacity ≈ .05–.12); it re-seeds 12 times a second
//   FX.vignette(key, o)           darkened edges (o.opacity)
//   FX.particles(t, o)            p5 particle field: o.n, o.seed, o.color(s), o.size, o.drift, o.targets (points from
//                                 FX.sample.*), o.form [t0, t1] (scatter → targets), o.burst [t0, t1] (targets → scatter)
//   FX.sample.ring(n, cx, cy, r) / .text(str, cx, cy, size, weight, step) / .grid(n, x, y, w, h)   target points
const FX = (() => {
  function gradient(key, t, o = {}) {
    // light: pale tints of the accent family only (mixing warm and cool on a light ground turns grey)
    const cols = o.colors || (THEME.dark ? [alpha(THEME.accent, .35), 'rgba(60,140,255,.25)', 'rgba(200,80,255,.18)'] : [alpha(THEME.accent, .16), 'rgba(120,170,255,.14)', alpha(THEME.accent, .08)]);
    const sp = o.speed ?? .05, layers = cols.map((c, i) => {
      const a = TAU * (sp * t + i / cols.length), x = 50 + 28 * Math.sin(a + i), y = 50 + 24 * Math.cos(a * .8 + i * 2);
      return `radial-gradient(circle at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${c}, transparent ${55 + 10 * i}%)`;
    });
    D.div(key, { w: W, h: H, style: { background: `${layers.join(', ')}, ${o.base || THEME.bg}` } });
  }
  const glow = (key, x, y, r, o = {}) => D.div(key, { x, y, w: r * 2, h: r * 2, ax: .5, ay: .5, opacity: o.opacity ?? 1,
    bg: `radial-gradient(closest-side, ${o.color || THEME.glow}, transparent)` });
  function grain(key, t, o = {}) {
    const seed = Math.floor(t * 12) % 97;
    D.svg(key, { x: 0, y: 0, w: W, h: H, opacity: o.opacity ?? .08, attrs: { viewBox: `0 0 ${W} ${H}` }, style: { mixBlendMode: THEME.dark ? 'screen' : 'multiply', pointerEvents: 'none' } }, () => {
      D.defs(() => D.el('filter', 'gf', { attrs: { id: key + 'f' } }, () => {
        D.el('feTurbulence', 'tb', { attrs: { type: 'fractalNoise', baseFrequency: .9, numOctaves: 2, seed, stitchTiles: 'stitch' } });
        D.el('feColorMatrix', 'cm', { attrs: { type: 'saturate', values: 0 } });
      }));
      D.rect('r', { attrs: { width: W, height: H, filter: `url(#${key}f)` } });
    });
  }
  // Vignettes suit dark grounds; on light ones keep opacity low (≤ .15) or they read as dirt.
  const vignette = (key, o = {}) => D.div(key, { w: W, h: H, opacity: o.opacity ?? (THEME.dark ? .5 : .12), bg: `radial-gradient(ellipse at center, transparent 55%, ${THEME.dark ? '#000' : 'rgba(40,40,60,.35)'} 100%)` });

  // ---------- particles (p5, closed form) ----------
  function particles(t, o = {}) {
    const n = o.n || 400, seed = o.seed || 1, tg = o.targets, cols = [].concat(o.color || THEME.accent), size = px(o.size || 3.2);
    noStroke();
    for (let i = 0; i < n; i++) {
      const h = k => hash(i * 17.31 + seed * 101 + k);
      // home: scattered over the frame, drifting slowly on its own loop
      const dr = px(o.drift ?? 30), hx = h(1) * W + Math.sin(t * (.2 + .3 * h(3)) + h(4) * TAU) * dr, hy = h(2) * H + Math.cos(t * (.2 + .3 * h(5)) + h(6) * TAU) * dr;
      let x = hx, y = hy;
      if (tg && tg.length) {
        const [tx, ty] = tg[i % tg.length], st = h(7) * .35;   // staggered: each particle leaves a little later
        let k = 0;
        if (o.form) k = EASE.inOut(seg(t, o.form[0] + st * (o.form[1] - o.form[0]), o.form[1]));
        if (o.burst) k *= 1 - EASE.inOut(seg(t, o.burst[0], o.burst[1] - st * (o.burst[1] - o.burst[0]) * .5));
        x = lerp(hx, tx + Math.sin(t * 2 + i) * px(1.2), k); y = lerp(hy, ty + Math.cos(t * 2 + i) * px(1.2), k);
      }
      const c = color(cols[i % cols.length]); c.setAlpha(255 * (o.opacity ?? 1) * (.45 + .55 * h(8)));
      fill(c); circle(x, y, size * (.6 + .8 * h(9)));
    }
  }
  const sample = {
    ring: (n, cx, cy, r) => Array.from({ length: n }, (_, i) => [cx + r * Math.sin(TAU * i / n), cy - r * Math.cos(TAU * i / n)]),
    grid: (n, x, y, w, h) => { const c = Math.ceil(Math.sqrt(n * w / h)), r = Math.ceil(n / c); return Array.from({ length: n }, (_, i) => [x + (i % c + .5) * w / c, y + (Math.floor(i / c) + .5) * h / r]); },
    // points inside the glyphs of a string, from an offscreen canvas (deterministic: same inputs, same points)
    text(str, cx, cy, size, weight = 700, step = 6) {
      const key = [str, cx, cy, size, weight, step].join('|'); if (sample._c[key]) return sample._c[key];
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      c.fillStyle = '#000'; c.font = `${weight} ${size}px ${THEME.font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(str, cx, cy);
      const d = c.getImageData(0, 0, W, H).data, pts = [];
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
      return (sample._c[key] = pts.sort((a, b) => hash(a[0] * 7 + a[1] * 13) - hash(b[0] * 7 + b[1] * 13)));
    },
    _c: {},
  };
  return { gradient, glow, grain, vignette, particles, sample };
})();
