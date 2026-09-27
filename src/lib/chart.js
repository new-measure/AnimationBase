// chart.js: animated charts for data stories (docs/genres/data_story.md), on the DOM layer, as pure functions of t.
// Measured in data stories: charts are built one piece at a time (the frame, the unit, the data, the one thing to
// notice), each held until it's read; moves are smooth and even (~0.6 s), and the data itself grows over seconds.
// Marks are SVG; labels are DOM text. Both are in world coordinates, so they follow D.cam like everything else.
//   Chart.frame(box, x, y)                    a chart's geometry: box { x, y, w, h } (the plot area), x and y domains
//                                             [min, max] → { box, sx(v), sy(v), x, y }. Animate box (Tx.rect) to move or
//                                             resize a chart: everything below re-lays out from it.
//   Chart.ticks(a, b, n)                      round tick values across [a, b] (about n of them)
//   Chart.axes(key, F, t, t0, o)              baseline and gridlines drawn on, then tick labels (o.xTicks, o.yTicks: arrays
//                                             or counts; o.xFmt, o.yFmt; o.grid: false for none)
//   Chart.unit(key, F, text, t, t0, o)        the unit, named, above the y axis (a chart without one is a pitfall)
//   Chart.line(key, F, pts, t, t0, o)         a line series growing left to right over o.dur (default 3 s), with a head
//                                             dot → { head: [x, y, value], k }; o.area fills under it; o.color, o.width;
//                                             o.segs [[x0, x1, color], ...] recolour stretches of it (o.segK: 0 → 1)
//   Chart.bars(key, F, data, t, t0, o)        [[x, value], ...] growing from the baseline one after another; o.hi: indices
//                                             in the highlight colour, the rest muted (o.hiK: fade to that); o.from(i) → { x, y, w, h }: each bar
//                                             is born from that rect (a morph from another encoding); o.labels, o.fmt
//   Chart.annotate(key, at, text, t, t0, o)   the one thing to notice: a ring on the point, a leader line drawn on, then
//                                             the label (o.dx, o.dy: label offset; o.align; o.out: leave time)
//   Chart.span(key, a, b, text, t, t0, o)     a bracket between two points on the y axis (a difference), labelled
//   Chart.units(key, n, t, t0, props, o)      a pictogram: n unit squares filling in (o.cols, o.size, o.gap, o.hi)
//   Chart.geo(features, box, o)               GeoJSON (Polygon, MultiPolygon, Point) projected into box: → { paths, pt }
//                                             o.proj 'equirect' (default) or 'mercator'; o.bounds [[lon0, lat0], [lon1, lat1]]
//   Chart.source(key, text, t, t0, props)     the source line: small, muted, held (shown in about half of data stories)
const Chart = (() => {
  const C = () => ({ ink: THEME.text, muted: THEME.muted, grid: THEME.line, hi: THEME.accent, dim: alpha(THEME.dark ? '#FFFFFF' : '#17171F', .16) });
  const lbl = (size, weight = THEME.weight.body, color = THEME.muted) => ({ font: `${weight} ${px(size)}px ${THEME.font}`, color, style: { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } });

  function frame(box, x, y) {
    const sx = v => box.x + (v - x[0]) / (x[1] - x[0]) * box.w, sy = v => box.y + box.h - (v - y[0]) / (y[1] - y[0]) * box.h;
    return { box, sx, sy, x, y };
  }
  function ticks(a, b, n = 5) {
    const raw = (b - a) / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    const step = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag, out = [];
    for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  function axes(key, F, t, t0, o = {}) {
    const { box } = F, c = C();
    const xt = Array.isArray(o.xTicks) ? o.xTicks : ticks(F.x[0], F.x[1], o.xTicks || 6);
    const yt = Array.isArray(o.yTicks) ? o.yTicks : ticks(F.y[0], F.y[1], o.yTicks || 4);
    const xFmt = o.xFmt || String, yFmt = o.yFmt || String, kOut = o.out == null ? 1 : 1 - anim(t, o.out, 'exit');
    Shape.layer(key + ':m', () => {
      Shape.stroke('base', `M${box.x} ${box.y + box.h} H${box.x + box.w}`, anim(t, t0, 'default'), { color: c.muted, width: px(2), opacity: kOut });
      if (o.grid !== false) yt.forEach((v, i) => {
        if (Math.abs(F.sy(v) - (box.y + box.h)) < 1) return;
        Shape.stroke('g' + i, `M${box.x} ${F.sy(v)} H${box.x + box.w}`, anim(t, t0 + .15 + i * MOTION.stagger, 'default'), { color: c.grid, width: px(1.5), opacity: kOut });
      });
    });
    const at = t0 + .5;
    xt.forEach((v, i) => D.text(key + ':x' + i, xFmt(v), { x: F.sx(v), y: box.y + box.h + px(16), ax: .5, ...lbl(o.size || 20), ...enter(anim(t, at + i * MOTION.stagger, 'text') * kOut, 'fade') }));
    yt.forEach((v, i) => D.text(key + ':y' + i, yFmt(v), { x: box.x - px(16), y: F.sy(v), ax: 1, ay: .5, ...lbl(o.size || 20), ...enter(anim(t, at + i * MOTION.stagger, 'text') * kOut, 'fade') }));
  }
  const unit = (key, F, text, t, t0, o = {}) =>
    D.text(key, text, { x: F.box.x - (o.inset ?? px(16)), y: F.box.y - px(o.gap ?? 48), ay: 1, ...lbl(o.size || 22, THEME.weight.strong, o.color || C().ink),
      ...enter(life(t, t0, o.out ?? null, 'text'), 'rise', 12) });

  // the line: drawn by stroke-dashoffset along its own length (pathLength = 1), so it grows at an even pace in x only if
  // the points are evenly spaced in x; the head sits at the data point at the same x progress
  function line(key, F, pts, t, t0, o = {}) {
    const k = EASE[o.ease || 'inOut'](seg(t, t0, t0 + (o.dur ?? 3))), c = C(), col = o.color || c.hi, n = pts.length;
    const xy = pts.map(([x, y]) => [F.sx(x), F.sy(y)]), d = 'M' + xy.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    // the head: interpolated along x
    const xh = lerp(pts[0][0], pts[n - 1][0], k); let i = 0; while (i < n - 2 && pts[i + 1][0] < xh) i++;
    const f = clamp((xh - pts[i][0]) / (pts[i + 1][0] - pts[i][0])), vh = lerp(pts[i][1], pts[i + 1][1], f), head = [F.sx(xh), F.sy(vh), vh];
    // draw exactly up to the head (a clip on x, not a dash along length, so the line and its head stay together)
    const cid = key.replace(/\W/g, '') + 'clip', w = o.width ?? px(4), kOut = o.out == null ? 1 : 1 - anim(t, o.out, 'exit');
    if (k <= 0) return { head, k };
    Shape.layer(key, () => {
      D.defs(() => D.clipPath({ attrs: { id: cid } }, () => D.rect({ attrs: { x: F.box.x - w * 3, y: F.box.y - px(400), width: head[0] - F.box.x + w * 3, height: F.box.h + px(800) } })));
      D.g({ attrs: { 'clip-path': `url(#${cid})`, opacity: kOut * (o.opacity ?? 1) } }, () => {
        if (o.area) D.path('area', { attrs: { d: `${d} L${xy[n - 1][0]} ${F.box.y + F.box.h} L${xy[0][0]} ${F.box.y + F.box.h} Z`, fill: alpha(col, o.area === true ? .14 : o.area) } });
        D.path('line', { attrs: { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } });
        // recoloured stretches (e.g. one per decade), fading in over the base line
        (o.segs || []).forEach(([x0, x1, sc], j) => {
          const sub = pts.filter(p => p[0] >= x0 && p[0] <= x1).map(([x, y]) => F.sx(x).toFixed(1) + ' ' + F.sy(y).toFixed(1));
          if (sub.length > 1) D.path('seg' + j, { attrs: { d: 'M' + sub.join(' L'), fill: 'none', stroke: sc, 'stroke-width': w * 1.25, 'stroke-linecap': 'round', opacity: clamp(o.segK ?? 1) } });
        });
      });
      if (o.dot !== false && kOut > 0) D.circle('head', { attrs: { cx: head[0], cy: head[1], r: w * 1.6, fill: col, opacity: kOut } });
    });
    return { head, k };
  }

  function bars(key, F, data, t, t0, o = {}) {
    const c = C(), hi = new Set(o.hi || []), bw = o.bw ?? F.box.w / data.length * .62, base = F.box.y + F.box.h, fmt = o.fmt || (v => String(v));
    const gap = o.stagger ?? MOTION.stagger * 2, kOut = o.out == null ? 1 : 1 - anim(t, o.out, 'exit');
    // o.hiK 0 → 1 fades the bars outside o.hi from the highlight colour to muted (default 1: muted from the start)
    const hk = o.hiK ?? 1, col = i => hi.size && !hi.has(i) && hk >= 1 ? o.muted || c.dim : c.hi, op = i => hi.size && !hi.has(i) && hk < 1 ? 1 - .75 * hk : 1;
    Shape.layer(key, () => data.forEach(([x, v], i) => {
      const k = anim(t, t0 + i * gap, o.preset || 'panel');
      if (k <= 0) return;
      const to = { x: F.sx(x) - bw / 2, y: F.sy(v), w: bw, h: base - F.sy(v), r: o.radius ?? px(6) };
      const r = o.from ? Tx.rect(o.from(i), to, k) : { x: to.x, y: base - to.h * k, w: bw, h: to.h * k, radius: to.r };
      D.rect('b' + i, { attrs: { x: r.x, y: r.y, width: Math.max(0, r.w), height: Math.max(0, r.h), rx: Math.min(r.radius, r.w / 2), fill: col(i), opacity: kOut * op(i) } });
    }));
    if (o.labels) data.forEach(([x, v], i) => {
      const k = anim(t, t0 + i * gap + .4, 'text') * kOut;
      D.text(key + ':v' + i, fmt(v), { x: F.sx(x), y: F.sy(v) - px(12), ax: .5, ay: 1, ...lbl(o.size || 22, THEME.weight.strong, hi.has(i) ? c.ink : c.muted), ...enter(k, 'rise', 10) });
    });
  }

  function annotate(key, at, text, t, t0, o = {}) {
    const k = life(t, t0, o.out ?? null, 'default'); if (k <= 0 && t > t0) return;
    const c = C(), [x, y] = at, dx = o.dx ?? px(-120), dy = o.dy ?? px(-90), lx = x + dx, ly = y + dy;
    const ring = anim(t, t0, 'card'), lead = anim(t, t0 + .15, 'default'), txt = anim(t, t0 + .45, 'text');
    const kOut = o.out == null ? 1 : 1 - anim(t, o.out, 'exit');
    Shape.layer(key + ':m', () => {
      Shape.ring('ring', x, y, px(o.r ?? 14), ring, { color: o.color || c.ink, width: px(2.5), opacity: kOut });
      // the leader runs from the label to the point, stopping short of the ring
      const L = Math.hypot(dx, dy), e = 1 - px((o.r ?? 14) + 6) / L;
      Shape.stroke('lead', `M${lx} ${ly} L${lerp(lx, x, e)} ${lerp(ly, y, e)}`, lead, { color: o.color || c.muted, width: px(2), opacity: kOut });
    });
    const ax = o.align === 'right' ? 0 : o.align === 'center' ? .5 : 1;
    D.text(key, text, { x: lx + (ax === 1 ? -px(12) : ax === 0 ? px(12) : 0), y: ly, ax, ay: ax === .5 ? (dy < 0 ? 1 : 0) : .5,
      ...lbl(o.size || 26, o.weight || THEME.weight.strong, o.textColor || c.ink), style: { whiteSpace: 'pre', lineHeight: 1.25, textAlign: ax === 1 ? 'right' : 'left' },
      ...enter(txt * kOut, 'fade') });
  }

  function span(key, a, b, text, t, t0, o = {}) {
    const c = C(), x = o.x ?? Math.max(a[0], b[0]) + px(40), k = anim(t, t0, 'default'), kOut = o.out == null ? 1 : 1 - anim(t, o.out, 'exit');
    const tk = px(12), [y0, y1] = [a[1], b[1]];
    Shape.layer(key + ':m', () => {
      Shape.stroke('br', `M${x - tk} ${y0} H${x} V${y1} H${x - tk}`, k, { color: o.color || c.hi, width: px(2.5), opacity: kOut });
      [a, b].forEach((p, i) => Shape.stroke('d' + i, `M${p[0] + px(10)} ${p[1]} H${x - tk - px(6)}`, anim(t, t0, 'default'), { color: c.grid, width: px(1.5), dash: `${px(4)} ${px(6)}`, opacity: kOut * k }));
    });
    D.text(key, text, { x: x + px(18), y: (y0 + y1) / 2, ay: .5, ...lbl(o.size || 34, THEME.weight.emph, o.color || c.hi), ...enter(anim(t, t0 + .4, 'text') * kOut, 'slide', -16) });
  }

  function units(key, n, t, t0, props = {}, o = {}) {
    const cols = o.cols || 10, s = px(o.size || 28), g = px(o.gap || 8), hi = o.hi ?? 0, c = C();
    D.div(key, { ...props, w: cols * s + (cols - 1) * g, style: { display: 'flex', flexWrap: 'wrap', gap: g, ...(props.style || {}) } }, () => {
      for (let i = 0; i < n; i++) {
        const k = anim(t, t0 + i * (o.stagger ?? 1 / 48), 'card');
        D.div({ w: s, h: s, radius: px(o.radius ?? 6), bg: i < hi ? c.hi : c.dim, ...enter(k, 'scale') });
      }
    });
  }

  function geo(features, box, o = {}) {
    const merc = o.proj === 'mercator', my = lat => merc ? Math.log(Math.tan(Math.PI / 4 + clamp(lat, -85, 85) * Math.PI / 360)) : lat * Math.PI / 180;
    const [[l0, a0], [l1, a1]] = o.bounds || [[-180, -85], [180, 85]];
    const sx = box.w / ((l1 - l0) * Math.PI / 180), sy = box.h / (my(a1) - my(a0)), s = Math.min(sx, sy);
    const ox = box.x + (box.w - s * (l1 - l0) * Math.PI / 180) / 2, oy = box.y + (box.h - s * (my(a1) - my(a0))) / 2;
    const pt = ([lon, lat]) => [ox + s * (lon - l0) * Math.PI / 180, oy + s * (my(a1) - my(lat))];
    const ring = r => 'M' + r.map(p => pt(p).map(v => v.toFixed(1)).join(' ')).join(' L') + ' Z';
    const list = features.type === 'FeatureCollection' ? features.features : Array.isArray(features) ? features : [features];
    const paths = list.map(f => {
      const g = f.geometry || f, polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      return { props: f.properties || {}, d: polys.map(p => p.map(ring).join(' ')).join(' '), point: g.type === 'Point' ? pt(g.coordinates) : null };
    });
    return { paths, pt };
  }

  const source = (key, text, t, t0, props = {}) => D.text(key, text, { ...props, ...lbl(20), ...enter(anim(t, t0, 'text'), 'fade') });

  return { frame, ticks, axes, unit, line, bars, annotate, span, units, geo, source };
})();
