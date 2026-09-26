// shapes.js: vector graphics that move (brand and graphic motion, diagrams), on the DOM layer as SVG, pure functions of t.
// Draw them inside Shape.layer(), a full-canvas SVG in world coordinates (so they follow D.cam like everything else).
//   Shape.layer(key, kids)                          full-canvas <svg>, viewBox 0 0 W H
//   Shape.stroke(key, d, k, o)                      path d drawn on as k goes 0 → 1 (o.color, o.width, o.fill, o.cap)
//   Shape.lerpPath(a, b, k)                         morph between two paths with the same commands (numbers interpolated)
//   Shape.arcPath(cx, cy, r, a0, a1)                an SVG arc path (angles in degrees, 0 = up, clockwise)
//   Shape.dial(key, cx, cy, r, k, o)                a gauge: track, progress arc to k, o.ticks tick marks
//   Shape.connector(key, a, b, k, o)                a curved line from point a to b drawn on (o.bend, o.dash, o.dot)
//   Shape.orbit(n, cx, cy, rx, ry, t, o)            n positions on an ellipse, turning with t (o.speed rev/s, o.phase)
//   Shape.ring(key, cx, cy, r, k, o)                a circle drawn on (o.width, o.color)
// Strokes use pathLength = 1, so "drawn on" is exact for any path.
const Shape = (() => {
  const layer = (key, kids) => D.svg(key, { x: 0, y: 0, w: W, h: H, attrs: { viewBox: `0 0 ${W} ${H}` }, style: { overflow: 'visible' } }, kids);
  function stroke(key, d, k = 1, o = {}) {
    if (k <= 0 && !o.fill) return;
    D.path(key, { attrs: { d, fill: o.fill || 'none', 'fill-opacity': o.fill ? clamp(o.fillK ?? 1) : null, stroke: o.color || THEME.text, 'stroke-width': o.width ?? px(3),
      'stroke-linecap': o.cap || 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': o.dash ? o.dash : 1, 'stroke-dashoffset': o.dash ? null : 1 - clamp(k),
      opacity: o.opacity ?? 1 } });
  }
  function lerpPath(a, b, k) {
    const na = a.match(/-?\d*\.?\d+(e-?\d+)?/g).map(Number), nb = b.match(/-?\d*\.?\d+(e-?\d+)?/g).map(Number);
    if (na.length !== nb.length) throw new Error('Shape.lerpPath: the two paths need the same commands and point count');
    let i = 0; return a.replace(/-?\d*\.?\d+(e-?\d+)?/g, () => { const v = lerp(na[i], nb[i], k); i++; return +v.toFixed(2); });
  }
  const pt = (cx, cy, r, a) => [cx + r * Math.sin(a * Math.PI / 180), cy - r * Math.cos(a * Math.PI / 180)];
  function arcPath(cx, cy, r, a0, a1) {
    const [x0, y0] = pt(cx, cy, r, a0), [x1, y1] = pt(cx, cy, r, a1), big = Math.abs(a1 - a0) > 180 ? 1 : 0, sweep = a1 > a0 ? 1 : 0;
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${big} ${sweep} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  function dial(key, cx, cy, r, k, o = {}) {
    const a0 = o.from ?? -120, a1 = o.to ?? 120, w = o.width ?? px(10);
    D.g(key, () => {
      stroke('track', arcPath(cx, cy, r, a0, a1), 1, { color: o.track || alpha(o.color || THEME.accent, .15), width: w });
      if (k > 0) stroke('val', arcPath(cx, cy, r, a0, lerp(a0, a1, clamp(k))), 1, { color: o.color || THEME.accent, width: w });
      for (let i = 0; i < (o.ticks || 0); i++) {
        const a = lerp(a0, a1, i / (o.ticks - 1)), [x0, y0] = pt(cx, cy, r + w * 1.2, a), [x1, y1] = pt(cx, cy, r + w * 1.2 + px(10), a);
        stroke('tick' + i, `M${x0} ${y0} L${x1} ${y1}`, 1, { color: THEME.faint, width: px(2) });
      }
    });
  }
  function connector(key, a, b, k, o = {}) {
    const [x0, y0] = a, [x1, y1] = b, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, bend = o.bend ?? .15;
    const d = `M${x0} ${y0} Q${mx - dy * bend} ${my + dx * bend} ${x1} ${y1}`;
    stroke(key, d, k, { color: o.color || THEME.faint, width: o.width ?? px(2.5), dash: o.dash });
    if (o.dot && k > .98) D.circle(key + ':dot', { attrs: { cx: x1, cy: y1, r: px(5), fill: o.color || THEME.accent } });
  }
  function orbit(n, cx, cy, rx, ry, t, o = {}) {
    return Array.from({ length: n }, (_, i) => { const a = TAU * (i / n + (o.phase || 0) + t * (o.speed ?? .03)); return [cx + rx * Math.sin(a), cy - ry * Math.cos(a), a]; });
  }
  const ring = (key, cx, cy, r, k, o = {}) => stroke(key, `M${cx} ${cy - r} a${r} ${r} 0 1 1 -0.01 0`, k, o);
  return { layer, stroke, lerpPath, arcPath, dial, connector, orbit, ring };
})();
