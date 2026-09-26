// camera.js: camera moves for DOM scenes, on top of D.cam. Measured: camera moves take ~0.75 s ease-in-out (18 frames);
// push-ins are the most common camera behaviour in UI films (78%), then static holds, pans and zoom-out reveals.
//   Cam.at(t, keys)               [[t, cx, cy, zoom, rot?], ...]: holds at each key, moves between consecutive keys over
//                                 MOTION.camera (or the gap, if shorter), ending on the key's time → { cx, cy, zoom, rot }
//   Cam.shot(t, keys, kids, o)    D.cam at Cam.at(t, keys), plus o.drift: a slow extra push (zoom per second) so the frame
//                                 is never dead
//   Cam.layer(depth, kids)        parallax inside a camera: depth 1 = the focal plane, < 1 farther (moves less),
//                                 > 1 nearer (moves more). o.dof blurs layers by their distance from the focal plane.
//   Cam.dof(depth, focus, amount) blur in px for a layer at depth when focus is in focus (rack focus: animate focus)
const Cam = (() => {
  function at(t, keys) {
    let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1];
    if (!b) return { cx: a[1], cy: a[2], zoom: a[3] ?? 1, rot: a[4] || 0 };
    // move into key b, arriving on its time
    const dur = Math.min(MOTION.camera.dur, b[0] - a[0]), k = EASE.inOut(seg(t, b[0] - dur, b[0]));
    return { cx: lerp(a[1], b[1], k), cy: lerp(a[2], b[2], k), zoom: lerp(a[3] ?? 1, b[3] ?? 1, k), rot: lerp(a[4] || 0, b[4] || 0, k) };
  }
  // NB: keys hold until the next key's move begins; to arrive at b at time tb, put b at tb.
  function shot(t, keys, kids, o = {}) {
    const c = at(t, keys);
    return D.cam(c.cx, c.cy, c.zoom * (1 + (o.drift ?? .004) * t), c.rot, kids);
  }
  // Parallax: shift a layer by how far the camera has moved from the frame centre, scaled by (depth - 1).
  function layer(depth, kids, o = {}) {
    const c = CAM || { cx: W / 2, cy: H / 2 };
    const dx = (c.cx - W / 2) * (1 - depth), dy = (c.cy - H / 2) * (1 - depth);
    return D.group({ dx, dy, blur: o.dof ? dof(depth, o.focus ?? 1, o.dof) : 0 }, kids);
  }
  const dof = (depth, focus = 1, amount = 12) => Math.min(amount * 2, amount * Math.abs(depth - focus) * 2);
  return { at, shot, layer, dof };
})();
