// cursor.js: a pointer that moves between waypoints and clicks, as a pure function of t. Cursors appear in 22–24% of
// UI launch films, so this is a first-class component.
//   Cursor.at(t, keys) → { x, y, press, ripple, opacity }
//   Cursor.draw(key, t, keys, props)         the pointer (and click ripple), in the coordinates of its parent
// keys: [{ t, x, y, click, hide }] in time order. t is when the pointer ARRIVES at (x, y): it leaves the previous key
// just early enough for a move that fits the distance (0.35–0.9 s, ease-in-out, on a gentle arc), so it rests at each
// key until it has to go. click: a press on arrival (down 2 frames before, up ~3 frames after) with a ripple.
// hide: fade out after this key (and back in at the next one).
const Cursor = (() => {
  const moveDur = d => clamp(.25 + d / 1800, .35, .9);
  function at(t, keys) {
    let i = 0; while (i + 1 < keys.length && t >= keys[i + 1].t - moveDur(Math.hypot(keys[i + 1].x - keys[i].x, keys[i + 1].y - keys[i].y))) i++;
    const a = keys[i], b = keys[i + 1];
    let x = a.x, y = a.y;
    if (b) {
      const d = Math.hypot(b.x - a.x, b.y - a.y), t0 = b.t - moveDur(d), k = EASE.inOut(seg(t, t0, b.t));
      if (t >= t0) {   // a gentle arc: bow sideways by 8% of the distance, always the same way for the same pair
        const nx = -(b.y - a.y) / (d || 1), ny = (b.x - a.x) / (d || 1), bow = .08 * d * Math.sin(Math.PI * k) * (hash(a.t * 7 + b.t) < .5 ? 1 : -1);
        x = lerp(a.x, b.x, k) + nx * bow; y = lerp(a.y, b.y, k) + ny * bow;
      }
    }
    let press = 0, ripple = -1;
    for (const c of keys) if (c.click) {
      press = Math.max(press, Math.sin(Math.PI * seg(t, c.t - 2 / 24, c.t + 3 / 24)));
      if (t >= c.t && t < c.t + .5) ripple = (t - c.t) / .5;
    }
    let opacity = seg(t, keys[0].t - .15, keys[0].t + .05);
    for (let j = 0; j < keys.length; j++) if (keys[j].hide) opacity = Math.min(opacity, 1 - seg(t, keys[j].t + .1, keys[j].t + .35) * (keys[j + 1] ? 1 - seg(t, keys[j + 1].t - .6, keys[j + 1].t - .35) : 1));
    return { x, y, press, ripple, opacity };
  }
  function draw(key, t, keys, props = {}) {
    const c = at(t, keys), s = px(props.size || 34);
    if (c.ripple >= 0) {
      const r = s * (.4 + 1.6 * EASE.out(c.ripple));
      D.div(key + ':ripple', { x: c.x, y: c.y, w: r * 2, h: r * 2, ax: .5, ay: .5, radius: '50%', opacity: (1 - c.ripple) * .9 * c.opacity,
        style: { border: `${px(2.5)}px solid ${THEME.accent}`, background: alpha(THEME.accent, .08) } });
    }
    if (c.opacity <= 0) return c;
    D.svg(key, { x: c.x - s * .12, y: c.y - s * .08, w: s, h: s, scale: 1 - .14 * c.press, origin: '12% 8%', opacity: c.opacity,
      attrs: { viewBox: '0 0 24 24' }, style: { filter: `drop-shadow(0 ${px(3)}px ${px(6)}px rgba(0,0,0,.28))` } }, () =>
      D.path({ attrs: { d: 'M3 2 L3 20 L8 15.5 L11.5 23 L14.8 21.6 L11.4 14.3 L18 14.3 Z', fill: THEME.dark ? '#fff' : '#111', stroke: THEME.dark ? '#111' : '#fff', 'stroke-width': 1.4, 'stroke-linejoin': 'round' } }));
    return c;
  }
  return { at, draw };
})();
