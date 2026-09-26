// human.js: simple painted people (Sam and the partner), drawn to sit with Jolly in either style.
// human(x, y, u, o): (x, y) is the HIP / seat point of a seated person. Body-local, facing screen-right in 'q':
//   torso y 0..-6.2u, shoulders near (±1.9u, -5.6u), head centre (0, -8.6u) (rx 2.1u, ry 2.35u).
//   Seated legs (o.legs) end on a floor 3.9u below the hip.
// Pose: lean (radians, + = forward; the upper body bends at the hip, legs stay put), tilt (head), dy (u).
// Arms are two-bone IK to hand targets given in u in hip space: o.handN (near arm, drawn in front) and o.handF.
//   Targets stay where you put them however the body leans. o.holdN / o.holdF(u, sw) draw at the hand.
//   o.pointN: the near hand points along that angle (index finger out).
// Face: eyes 'open' | 'half' | 'closed' | 'happy' | 'wide', mouth 'smile' | 'flat' | 'frown' | 'open' | 'grin' | 'o',
//   brow 'flat' | 'sad' | 'up', lookX/lookY, blush 0..1, seed (blink timing). hair 'short' | 'bun'.
//   view 'front' | 'q'. flip faces left.
// hmood(t, keys): picks the current key's face fields and blinks across each change (faces never snap).

function ikElbow(S, Hd, L1, L2) {
  let dx = Hd[0] - S[0], dy = Hd[1] - S[1], d = Math.hypot(dx, dy);
  const dm = L1 + L2 - .01; if (d > dm) { dx *= dm / d; dy *= dm / d; d = dm; }
  d = Math.max(d, .01);
  const a = Math.atan2(dy, dx), off = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const e1 = [S[0] + L1 * Math.cos(a + off), S[1] + L1 * Math.sin(a + off)];
  const e2 = [S[0] + L1 * Math.cos(a - off), S[1] + L1 * Math.sin(a - off)];
  return { E: e1[1] > e2[1] ? e1 : e2, H: [S[0] + dx, S[1] + dy] };
}

function cloudPts(cx, cy, rx, ry, bumps = 7, amp = .13, n = 70) {
  const p = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + amp * Math.abs(Math.sin(a * bumps / 2)); p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return p;
}

// scaled copy of a unit point list
const US = (P, u, ox = 0, oy = 0) => P.map(([a, b]) => [ox + a * u, oy + b * u]);

let HUMAN_N = 0;
function human(x, y, u, o = {}) {
  const id = o.boilKey ?? ('h' + (++HUMAN_N)), rs = part => boilSeed(`human ${id} ${part}`);
  const P = o.pal, q = o.view !== 'front', sw = clamp(u / 18, .4, 2);
  const skinDk = mixCol(P.skin, PAL.clayDk, .28), shirtDk = mixCol(P.shirt, PAL.ink, .22), hairLt = mixCol(P.hair, PAL.cream, .18);
  const lean = o.lean || 0, dy = (o.dy || 0) * u;

  push(); translate(x, y); scale(o.flip ? -1 : 1, 1);

  // ---- legs (seated), not affected by the lean ----
  if (o.legs) {
    rs('legs');
    if (q) {
      for (const [k, c] of [[1, mixCol(P.pants, PAL.ink, .2)], [0, P.pants]]) {
        const ox = k * -.55 * u;
        paint(ribbon([[ox - .2 * u, -.6 * u], [ox + 1.7 * u, -.55 * u], [ox + 3.5 * u, -.35 * u]], 1.7 * u, 1.4 * u), { wash: c, ink: PAL.ink, sw: sw * .8, curv: .4 });
        paint(ribbon([[ox + 3.4 * u, -.5 * u], [ox + 3.5 * u, 1.5 * u], [ox + 3.55 * u, 3.3 * u]], 1.3 * u, 1.1 * u), { wash: c, ink: PAL.ink, sw: sw * .8, curv: .4 });
        paint(US([[-.5, -.3], [.9, -.35], [1.35, .1], [1.2, .45], [-.55, .45]], u, ox + 3.6 * u, 3.5 * u), { wash: P.shoe, ink: PAL.ink, sw: sw * .8, curv: .4 });
      }
    } else {
      for (const s of [-1, 1]) {
        paint(ribbon([[s * 1 * u, -.3 * u], [s * 1.08 * u, 1.7 * u], [s * 1.15 * u, 3.3 * u]], 1.5 * u, 1.2 * u), { wash: P.pants, ink: PAL.ink, sw: sw * .8, curv: .4 });
        paint(ellPts(s * 1.3 * u, 3.65 * u, 1.05 * u, .5 * u, 16), { wash: P.shoe, ink: PAL.ink, sw: sw * .8 });
      }
    }
  }

  // ---- upper body: bends at the hip ----
  translate(0, dy); rotate(lean);
  const inv = ([hx, hy]) => { const c = Math.cos(-lean), s = Math.sin(-lean), X = hx * u, Y = hy * u - dy; return [X * c - Y * s, X * s + Y * c]; };
  const SN = [q ? 1.35 * u : 1.95 * u, -5.55 * u], SF = [q ? -1.5 * u : -1.95 * u, -5.55 * u];
  const L = 2.7 * u;
  const handN = inv(o.handN || [2.3, -1.2]), handF = inv(o.handF || [q ? 1.3 : -2.3, -1.2]);

  const arm = (S, Ht, which, far) => {
    rs('arm' + which);
    const { E, H } = ikElbow(S, Ht, L, L);
    const sc = far ? shirtDk : P.shirt, kc = far ? skinDk : P.skin;
    const mid = (A, B, k) => [lerp(A[0], B[0], k), lerp(A[1], B[1], k)];
    // forearm (skin) under the sleeve
    paint(ribbon([mid(S, E, .7), E, mid(E, H, .5), H], 1.0 * u, .82 * u), { wash: kc, ink: PAL.ink, sw: sw * .8 });
    paint(ribbon([S, mid(S, E, .5), mid(S, E, .95)], 1.45 * u, 1.2 * u), { wash: sc, ink: PAL.ink, sw: sw * .8 });
    const hold = which === 'N' ? o.holdN : o.holdF, point = which === 'N' && o.pointN != null;
    const ang = Math.atan2(H[1] - E[1], H[0] - E[0]);
    push(); translate(H[0], H[1]);
    if (hold) { push(); rotate(0); hold(u, sw); pop(); }
    push(); rotate(point ? o.pointN : ang);
    paint(US([[-.35, -.5], [.35, -.55], [.75, -.3], [.8, .25], [.4, .55], [-.3, .5], [-.55, 0]], u), { wash: kc, ink: PAL.ink, sw: sw * .7, curv: .5 });
    if (point) paint(ribbon([[.5 * u, -.25 * u], [1.1 * u, -.28 * u], [1.7 * u, -.3 * u]], .38 * u, .32 * u), { wash: kc, ink: PAL.ink, sw: sw * .6 });
    else paint(ellPts(.25 * u, -.55 * u, .28 * u, .2 * u, 10, 0, -.4), { wash: kc, ink: PAL.ink, sw: sw * .55 });   // thumb
    pop();
    pop();
  };

  if (o.hair === 'bun') {   // hair that hangs behind the head
    rs('hairback');
    paint(US([[-2.2, -9.6], [1.4, -10.6], [2.2, -8.6], [1.6, -6.9], [-1.6, -6.5], [-2.4, -7.6]], u, q ? -.3 * u : 0, 0), { wash: P.hair, ink: PAL.ink, sw: sw * .8, curv: .5 });
  }
  arm(SF, handF, 'F', true);

  // torso: a soft bean with a shaded back side
  rs('torso');
  const torso = US([[-1.8, .3], [1.8, .3], [2.15, -1.6], [2.3, -4.1], [2.05, -5.5], [1.2, -6.15], [-1.2, -6.15], [-2.05, -5.5], [-2.3, -4.1], [-2.15, -1.6]], u);
  paint(torso, { wash: P.shirt, ink: null, curv: .5 });
  paint(US([[-1.8, .3], [-.9, .3], [-1.25, -2.5], [-1.1, -5.6], [-1.3, -6.1], [-2.05, -5.5], [-2.3, -4.1], [-2.15, -1.6]], u, q ? -.05 * u : 0), { wash: shirtDk, washOp: 150, ink: null, curv: .5 });
  paint(torso, { ink: PAL.ink, sw, curv: .5 });
  paint(US([[-.75, -6.1], [.75, -6.1], [0, -5.15]], u, q ? .35 * u : 0), { wash: mixCol(P.shirt, PAL.cream, .35), ink: PAL.ink, sw: sw * .5, curv: .3 });

  // ---- head ----
  push(); translate(q ? .3 * u : 0, 0); rotate(o.tilt || 0);
  rs('neck');
  paint(rrPts(-.55 * u, -7.2 * u, 1.1 * u, 1.4 * u, .4 * u), { wash: skinDk, ink: PAL.ink, sw: sw * .6 });
  rs('head');
  const hx = 0, hy = -8.6 * u;
  const head = [];
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, low = Math.sin(a) > 0 ? 1 - .12 * Math.sin(a) : 1; head.push([hx + Math.cos(a) * 2.1 * u * low, hy + Math.sin(a) * 2.35 * u]); }
  paint(head, { wash: P.skin, ink: PAL.ink, sw });
  paint(ellPts(hx - (q ? .2 : 0) * u, hy + 1.3 * u, 1.5 * u, .7 * u, 16), { wash: skinDk, washOp: 60, ink: null });
  if (q) paint(ellPts(hx - 1.25 * u, hy + .2 * u, .42 * u, .58 * u, 12), { wash: P.skin, ink: PAL.ink, sw: sw * .6 });   // ear

  rs('hair');
  const fx = q ? .8 * u : 0;
  if (o.hair === 'bun') {
    paint(ellPts(hx - (q ? .9 : 0) * u, hy - 2.6 * u, 1.05 * u, .95 * u, 18), { wash: P.hair, ink: PAL.ink, sw: sw * .8 });
    paint(US([[-2.25, .4], [-2.3, -.8], [-1.6, -2], [0, -2.55], [1.6, -2.1], [2.25, -.9], [2.15, .1], [1.6, -.9], [.6, -1.3], [-.5, -.9], [-1.2, -.3], [-1.6, .9]], u, hx + (q ? .1 * u : 0), hy), { wash: P.hair, ink: PAL.ink, sw: sw * .9, curv: .5 });
    paint(US([[-.6, -1.9], [.8, -2.1], [1.4, -1.6], [.2, -1.5]], u, hx, hy), { wash: hairLt, ink: null, curv: .5 });
  } else {
    paint(US([[-2.2, .5], [-2.3, -.9], [-1.5, -2.2], [0, -2.75], [1.5, -2.45], [2.3, -1.3], [2.2, -.3], [1.4, -.95], [.5, -1.5], [.3, -.9], [-.6, -1.3], [-1.3, -.6], [-1.5, .5]], u, hx + (q ? .05 * u : 0), hy), { wash: P.hair, ink: PAL.ink, sw: sw * .9, curv: .5 });
    paint(US([[-.9, -2.1], [.6, -2.4], [1.3, -2], [0, -1.8]], u, hx, hy), { wash: hairLt, ink: null, curv: .5 });
  }

  // face
  rs('face');
  const fcx = hx + fx, sp = q ? .72 * u : .85 * u;
  const lx = (o.lookX || 0) * .22 * u, ly = (o.lookY || 0) * .18 * u;
  const blink = frac(T * .3 + hash((o.seed || 0) + 5)) < .035;
  const eyes = blink ? 'closed' : (o.eyes || 'open');
  for (const s of [-1, 1]) {
    const ex = fcx + s * sp + (q && s < 0 ? .12 * u : 0), ey = hy - .05 * u, er = q && s < 0 ? .88 : 1;
    if (eyes === 'open' || eyes === 'wide') {
      const k = eyes === 'wide' ? 1.25 : 1;
      paint(ellPts(ex + lx, ey + ly, .27 * u * k * er, .36 * u * k, 12), { wash: PAL.ink, ink: null });
      paint(ellPts(ex + lx + .08 * u, ey + ly - .12 * u, .08 * u, .08 * u, 8), { wash: '#FFFFFF', ink: null });
    } else if (eyes === 'half') {
      paint(ellPts(ex + lx, ey + ly + .1 * u, .26 * u * er, .2 * u, 10), { wash: PAL.ink, ink: null });
      inkLine([[ex - .38 * u, ey - .02 * u], [ex + .38 * u, ey - .02 * u]], sw * .9, PAL.ink, 'ink', 0);
    } else if (eyes === 'happy') inkLine([[ex - .34 * u, ey + .12 * u], [ex, ey - .22 * u], [ex + .34 * u, ey + .12 * u]], sw * .95, PAL.ink, 'ink', .6);
    else inkLine([[ex - .34 * u, ey + .02 * u], [ex, ey + .12 * u], [ex + .34 * u, ey + .02 * u]], sw * .9, PAL.ink, 'ink', .5);
    const by = hy - .85 * u - (o.brow === 'up' ? .18 * u : 0), bt = o.brow === 'sad' ? .2 : 0;
    inkLine([[ex - .38 * u, by - s * bt * u], [ex, by - .1 * u], [ex + .38 * u, by + s * bt * u]], sw * 1.05, P.hair === '#3A2A2E' ? PAL.ink : mixCol(P.hair, PAL.ink, .4), 'ink', .5);
  }
  if (o.blush) for (const s of [-1, 1]) paint(ellPts(fcx + s * (sp + .3 * u), hy + .7 * u, .45 * u, .26 * u, 12), { wash: '#EF8EA8', washOp: 150 * o.blush, ink: null });
  if (q) inkLine([[fcx + .3 * u, hy + .15 * u], [fcx + .52 * u, hy + .55 * u], [fcx + .25 * u, hy + .65 * u]], sw * .6, skinDk, 'ink', .4);
  else inkLine([[fcx - .1 * u, hy + .5 * u], [fcx + .1 * u, hy + .55 * u]], sw * .6, skinDk, 'ink', 0);
  const mx = fcx + (q ? .2 * u : 0), my = hy + 1.2 * u;
  switch (o.mouth || 'smile') {
    case 'flat': inkLine([[mx - .42 * u, my], [mx + .42 * u, my]], sw * .85, PAL.ink, 'ink', 0); break;
    case 'frown': inkLine([[mx - .42 * u, my + .14 * u], [mx, my - .06 * u], [mx + .42 * u, my + .14 * u]], sw * .85, PAL.ink, 'ink', .6); break;
    case 'open': paint(ellPts(mx, my + .1 * u, .32 * u, .3 * u, 12), { wash: '#6E2B3A', ink: PAL.ink, sw: sw * .6 }); break;
    case 'o': paint(ellPts(mx, my + .05 * u, .18 * u, .2 * u, 10), { wash: '#6E2B3A', ink: PAL.ink, sw: sw * .5 }); break;
    case 'grin':
      paint(US([[-.6, -.1], [.6, -.1], [.45, .3], [0, .5], [-.45, .3]], u, mx, my), { wash: '#6E2B3A', ink: PAL.ink, sw: sw * .7, curv: .5 });
      paint(US([[-.5, -.08], [.5, -.08], [.4, .08], [-.4, .08]], u, mx, my), { wash: '#FFFFFF', ink: null });
      break;
    default: inkLine([[mx - .48 * u, my - .06 * u], [mx, my + .26 * u], [mx + .48 * u, my - .06 * u]], sw * .85, PAL.ink, 'ink', .6);
  }
  pop();

  arm(SN, handN, 'N', false);
  pop();
}

function hmood(t, keys) {
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const cur = { ...keys[i][1] };
  const near = Math.min(i > 0 ? t - keys[i][0] : 9, i + 1 < keys.length ? keys[i + 1][0] - t : 9);
  if (near < .06) cur.eyes = 'closed';
  return cur;
}

const SAM = { skin: '#D69B74', hair: '#3A2A2E', shirt: PAL.teal, pants: '#3E4A72', shoe: '#2B2233' };
const PARTNER = { skin: '#F1C9A4', hair: '#8A4A2E', shirt: PAL.rose, pants: '#5A3A5A', shoe: '#2B2233' };
