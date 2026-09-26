// jolly.js: Jolly (Muse's mascot) — a soft fuzzy bean with rosy cheeks, painted in wash + ink.
// Silhouette: round plush body (~8u wide, ~9u tall with feet). (x, y) is the ground point under the feet.
// Body-local: body centred near (0, -5u); eyes at (±1.7u, -5.8u); mouth near (0, -4.2u); feet at y 0.
// Arms pivot near (±3.6u, -4.2u). Use feel() / emotions() / turn() the same way as the clawd kit.
//
// Not a Meta asset dump: this is an original brush interpretation for this animation base. Tweak freely.

// The kit lives in a namespace with the shared character interface (see character() in core.js); the first kit loaded
// also gets these names as plain globals.
const Jolly = character((() => {
const JOLLY_PAL = {
  fluff: '#F3E4D0', fluffDk: '#D9C0A4', fluffLt: '#FFF6EA',
  cheek: '#F0A0A8', nose: '#E88B7A',
};

// ---------- views (drawn key views; every view faces screen-right; flip: true faces left) ----------
const VIEWS = {
  front: { L: -4, R: 4, face: { cx: 0, fw: 1, sides: [-1, 1], mx: 0, bx: 2.4 },
           feet: [[-1.6, 0], [1.6, 0]], arms: [[-3.5, -1, 'L', 0], [3.5, 1, 'R', 0]] },
  q:     { L: -4, R: 4.1, face: { cx: 1.1, fw: .72, sides: [-1, 1], mx: .25, bx: 2.3 },
           feet: [[-1.4, 1], [1.8, 0]], arms: [[3.6, 1, 'R', 2], [-3.3, -1, 'L', 1]] },
  side:  { L: -2.6, R: 2.6, face: { cx: 1.1, fw: .5, sides: [1], mx: 1.4, bx: .9 },
           feet: [[-.6, 1], [.9, 0]], arms: [[1.4, 0, 'L', 1]] },
  qback: { L: -4.1, R: 4, face: null,
           feet: [[1.8, 1], [-1.4, 0]], arms: [[-3.6, -1, 'R', 2], [3.3, 1, 'L', 1]] },
  back:  { L: -4, R: 4, face: null, back: true,
           feet: [[-1.6, 0], [1.6, 0]], arms: [[-3.5, -1, 'R', 0], [3.5, 1, 'L', 0]] },
};

function spinView(a) {
  const K = [['front', 0], ['q', 0], ['side', 0], ['qback', 0], ['back', 0], ['qback', 1], ['side', 1], ['q', 1]];
  const [view, f] = K[((Math.round(a * 8) % 8) + 8) % 8]; return { view, flip: !!f };
}
function turn(t, t0, t1, a0, a1) {
  const k = ease(seg(t, t0, t1)), v = spinView(lerp(a0, a1, k));
  return { ...v, smear: t > t0 && t < t1 ? .45 * Math.sin(k * Math.PI) : 0, smearDir: 0 };
}

const TINT = { pale: '#F6E6D2', flush: '#E23E36', blue: '#6D86BE', rosy: '#EF8EA8', green: '#98B25E', gold: '#F0BE46' };
function tintCols(o) {
  const c = { col: o.col || JOLLY_PAL.fluff, dk: o.dk || JOLLY_PAL.fluffDk, lt: o.lt || JOLLY_PAL.fluffLt };
  const tc = o.tint && (TINT[o.tint] || o.tint), k = clamp(o.tintK ?? 1);
  if (!tc || k <= 0) return c;
  return { col: mixCol(c.col, tc, .5 * k), dk: mixCol(c.dk, mixCol(tc, PAL.ink, .3), .45 * k), lt: mixCol(c.lt, mixCol(tc, '#FFFFFF', .4), .4 * k) };
}

// ---------- Jolly ----------
// Options (all optional): dx, dy, sq, rot, flip, sx, sy, aL, aR, walk, view, smear, eyes, mouth,
// lookX/Y, squint, blush, seed, tint/tintK, emote/emoteK/emoteAge, draw, armL, armR, boilKey, typing (0..1)
function jolly(x, y, u, o = {}) {
  const id = o.boilKey ?? ++CLAWD_N, rs = part => boilSeed(`jolly ${id} ${part}`);
  x += (o.dx || 0) * u;
  const V = VIEWS[o.view] || VIEWS.front;
  const dy = (o.dy || 0) * u, sq = (o.sq || 0) + (o.take || 0), sm = clamp(o.smear || 0);
  const sw = clamp(u / 16, .4, 2.2) * (o.swMul || 1), J = u * .1;
  const { col, dk, lt } = tintCols(o), far = mixCol(dk, PAL.ink, .18);

  rs('shadow');
  if (!o.noShadow) {
    const f = 1 - Math.min(.5, Math.abs(o.dy || 0) * .06), w = (V.R - V.L) / 8;
    paint(ellPts(x, y + u * .12, u * 4.2 * f * w, u * .85 * f, 20), { fill: PAL.ink, fillOp: 85, bleed: .25, tex: .3, border: .1, ink: null });
  }
  if (sm > .05) {
    rs('smear');
    const dir = o.smearDir ?? (o.flip ? -1 : 1);
    for (let i = 1; i <= 3; i++) {
      const k = sm * (1 - i / 4);
      paint(ellPts(x - dir * i * u * .7 * sm, y + dy - 4.5 * u, 3.6 * u * (1 + .1 * k), 4.2 * u, 18, J * .4), {
        wash: col, washOp: 70 * k, ink: null
      });
    }
  }

  push();
  translate(x, y + dy);
  if (o.rot) rotate(o.rot);
  scale((o.flip ? -1 : 1) * (o.sx ?? 1) * (1 + sq * .55) * (1 + sm * .25), (o.sy ?? 1) * (1 - sq));

  const arm = ([px, dir, which, layer]) => {
    rs('arm' + which);
    let a = which === 'L' ? (o.aL ?? .15) : (o.aR ?? .15);
    if (o.typing) {   // tiny keyboard taps while Muse works
      const tap = Math.sin((T + (which === 'L' ? 0 : .17)) * TAU * 7) * o.typing;
      a = lerp(a, .55 + .55 * tap, o.typing);
    }
    const hook = which === 'L' ? o.armL : o.armR;
    push(); translate(px * u, -4.2 * u);
    if (dir === 0) {
      rotate(.55 - a);
      paint(ellPts(1.1 * u, 0, 1.35 * u, .7 * u, 14, J * .5), { wash: layer === 2 ? mixCol(col, dk, .35) : col, ink: PAL.ink, sw: sw * .75 });
      if (hook) { translate(2 * u, 0); hook(u, sw); }
    } else {
      rotate(dir < 0 ? a : -a);
      paint(ellPts(dir * 1.15 * u, 0, 1.35 * u, .7 * u, 14, J * .5), {
        wash: layer === 2 ? mixCol(col, dk, .35) : col, ink: PAL.ink, sw: sw * .75
      });
      if (hook) { translate(dir * 2.1 * u, 0); if (dir < 0) scale(-1, 1); hook(u, sw); }
    }
    pop();
  };

  V.arms.filter(a => a[3] !== 1).forEach(arm);

  // stubby feet
  if (!o.noFeet) V.feet.forEach(([fx, isFar], i) => {
    rs('foot' + i);
    let lift = 0, sx = 0;
    if (o.walk != null) {
      const ph = Math.sin((o.walk + (i % 2 ? .5 : 0)) * TAU);
      if (ph > 0) lift = ph * .55;
      if (o.view === 'side') sx = Math.sin((o.walk + i * .5) * TAU) * .35;
    }
    paint(ellPts((fx + sx) * u, -lift * u, 1.15 * u, .7 * u, 12, J * .4), {
      wash: isFar ? far : dk, ink: PAL.ink, sw: sw * .7
    });
  });

  // fuzzy body: soft oval + faint tuft edge
  rs('body');
  const bw = (V.R - V.L) / 2, bh = 4.4;
  paint(fuzzPts(0, -5 * u, bw * u, bh * u, 64, .022, J * .6), {
    wash: col, washOp: 255, fill: lt, fillOp: 55, bleed: .08, tex: .55, ink: PAL.ink, sw, curv: .6
  });
  // soft shading on the lower side, so the fluff has volume
  paint(ellPts(-.6 * u, -2.6 * u, bw * u * .78, bh * u * .38, 20, J * .4), { fill: dk, fillOp: 70, bleed: .2, tex: .4, ink: null });
  // soft belly patch
  paint(ellPts(.2 * u * (V.face ? V.face.fw : 0), -3.8 * u, bw * u * .55, bh * u * .45, 18, J * .5), {
    wash: lt, washOp: 120, ink: null
  });
  // ear / tuft bumps on top (front & q)
  if (V.face || o.view === 'q' || !o.view) {
    rs('tufts');
    for (const s of [-1, 1]) {
      if (o.view === 'side' && s < 0) continue;
      const tx = (V.face ? V.face.cx : 0) * u + s * 2.2 * u * (V.face ? V.face.fw : 1);
      paint(fuzzPts(tx, -8.7 * u, 1.05 * u, 1.25 * u, 20, .04, J * .4), { wash: col, ink: PAL.ink, sw: sw * .7, curv: .6 });
    }
  }

  V.arms.filter(a => a[3] === 1).forEach(arm);

  // face
  if (V.face) {
    const F = V.face;
    rs('cheeks');
    const blushAmt = clamp(o.blush ?? .55);
    for (const s of F.sides.length > 1 ? [-1, 1] : F.sides) {
      const cx = (F.cx + s * F.bx * .55) * u;
      paint(ellPts(cx, -4.6 * u, 1.1 * u * F.fw, .7 * u, 12), {
        fill: JOLLY_PAL.cheek, fillOp: 90 + 100 * blushAmt, bleed: .15, tex: .3, ink: null
      });
    }
    rs('eyes');
    jEyes(u, o, sw, F);
    rs('mouth');
    jMouth(u, o.mouth ?? 'smile', sw, F);
    // tiny nose
    paint(ellPts(F.cx * u + F.mx * .15 * u, -4.85 * u, .35 * u * F.fw, .28 * u, 8), {
      wash: JOLLY_PAL.nose, washOp: 180, ink: null
    });
  }

  if (o.draw) { rs('draw'); o.draw(u, sw); }

  // emote over head
  if (o.emote && (o.emoteK ?? 1) > .02) {
    rs('emote');
    const top = true;
    const ex = top ? 0 : 4.2 * u, ey = -10.2 * u;
    jEmote(o.emote, ex, ey, u * 1.1, o.emoteK ?? 1, o.emoteAge ?? T);
  }

  pop();
  boilSeed(`jolly ${id} done`);
}

function jEyes(u, o, sw, F) {
  const names = Array.isArray(o.eyes) ? o.eyes : [o.eyes || 'normal', o.eyes || 'normal'];
  const squint = clamp(o.squint || 0);
  F.sides.forEach((side, i) => {
    const name = names[side < 0 ? 0 : Math.min(1, names.length - 1)] || 'normal';
    const ex = (F.cx + side * 1.7 * F.fw) * u, ey = -5.85 * u;
    const lx = (o.lookX || 0) * .35 * u, ly = (o.lookY || 0) * .3 * u;
    // blink
    const seed = (o.seed || 0) + side * 17;
    const blink = (() => {
      const ph = frac(T * .35 + hash(seed + 3));
      return ph < .06 ? ease(ph / .03) * (ph < .03 ? 1 : 1 - (ph - .03) / .03) : 0;
    })();
    const shut = Math.max(blink, squint);
    push(); translate(ex + lx * (1 - shut), ey + ly * (1 - shut)); scale(o.eyeScale ?? 1.25);
    if (shut > .85) {
      inkLine([[-.7 * u, 0], [.7 * u, 0]], sw * .9, PAL.ink, 'ink', .4);
    } else {
      const h = lerp(1, .15, shut);
      switch (name) {
        case 'happy':
          inkLine([[-.75 * u, .15 * u], [0, -.35 * u * h], [.75 * u, .15 * u]], sw, PAL.ink, 'ink', .55);
          break;
        case 'closed':
          inkLine([[-.7 * u, 0], [.7 * u, 0]], sw * .9, PAL.ink, 'ink', .4);
          break;
        case 'sleepy':
          inkLine([[-.75 * u, -.1 * u], [.75 * u, .15 * u]], sw, PAL.ink, 'ink', .4);
          break;
        case 'wide':
          paint(ellPts(0, 0, .85 * u, .95 * u * h, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .85 });
          paint(ellPts(lx * .4, ly * .4, .38 * u, .42 * u * h, 10), { wash: PAL.ink, ink: null });
          paint(ellPts(lx * .4 - .15 * u, ly * .4 - .15 * u, .12 * u, .12 * u, 8), { wash: PAL.cream, ink: null });
          break;
        case 'shine':
          paint(ellPts(0, 0, .8 * u, .9 * u * h, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .85 });
          paint(ellPts(lx * .35, ly * .35, .32 * u, .36 * u * h, 10), { wash: PAL.ink, ink: null });
          paint(starPts(.25 * u, -.25 * u, .28 * u, .4, 4), { wash: PAL.cream, ink: null });
          break;
        case 'look':
          paint(ellPts(0, 0, .75 * u, .85 * u * h, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .85 });
          paint(ellPts(lx * .9, ly * .9, .3 * u, .34 * u * h, 10), { wash: PAL.ink, ink: null });
          break;
        case 'heart':
          paint(heartPts(0, 0, .7 * u * h), { wash: '#E2476E', ink: PAL.ink, sw: sw * .6 });
          break;
        case 'narrow':
          paint(ellPts(0, 0, .75 * u, .45 * u * h, 12), { wash: PAL.cream, ink: PAL.ink, sw: sw * .8 });
          paint(ellPts(lx * .4, 0, .28 * u, .22 * u * h, 8), { wash: PAL.ink, ink: null });
          break;
        default: // normal
          paint(ellPts(0, 0, .72 * u, .82 * u * h, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .85 });
          paint(ellPts(lx * .45, ly * .45, .3 * u, .34 * u * h, 10), { wash: PAL.ink, ink: null });
          paint(ellPts(lx * .45 - .12 * u, ly * .45 - .14 * u, .1 * u, .1 * u, 6), { wash: PAL.cream, ink: null });
      }
    }
    pop();
  });
}

function jMouth(u, m, sw, F) {
  const mx = F.mx * u, my = -4.15 * u;
  push(); translate(mx, my);
  switch (m) {
    case null:
    case 'none': break;
    case 'smile':
      inkLine([[-1.1 * u, 0], [0, .55 * u], [1.1 * u, 0]], sw * .9, PAL.ink, 'ink', .65); break;
    case 'grin':
      paint(ellPts(0, .25 * u, 1.3 * u, .7 * u, 14), { wash: PAL.cream, ink: PAL.ink, sw: sw * .8 });
      inkLine([[-1.1 * u, .1 * u], [1.1 * u, .1 * u]], sw * .5, PAL.ink, 'inkfine', 0); break;
    case 'open':
      paint(ellPts(0, .35 * u, .9 * u, .85 * u, 14), { wash: mixCol(PAL.ink, '#5A3040', .3), ink: PAL.ink, sw: sw * .8 }); break;
    case 'O':
      paint(ellPts(0, .2 * u, .7 * u, .75 * u, 14), { wash: mixCol(PAL.ink, '#5A3040', .25), ink: PAL.ink, sw: sw * .85 }); break;
    case 'flat':
      inkLine([[-.9 * u, .1 * u], [.9 * u, .1 * u]], sw * .85, PAL.ink, 'ink', .2); break;
    case 'frown':
      inkLine([[-1 * u, .45 * u], [0, 0], [1 * u, .45 * u]], sw * .9, PAL.ink, 'ink', .65); break;
    case 'cat':
      inkLine([[-1 * u, .15 * u], [-.35 * u, .45 * u], [0, .2 * u], [.35 * u, .45 * u], [1 * u, .15 * u]], sw * .85, PAL.ink, 'ink', .5); break;
    case 'wobble':
      inkLine([[-1 * u, .15 * u], [-.4 * u, .4 * u], [.2 * u, .05 * u], [.9 * u, .35 * u]], sw * .85, PAL.ink, 'ink', .55); break;
    case 'o':
      paint(ellPts(0, .15 * u, .4 * u, .35 * u, 10), { wash: mixCol(PAL.ink, '#5A3040', .2), ink: PAL.ink, sw: sw * .7 }); break;
    default:
      inkLine([[-1.1 * u, 0], [0, .55 * u], [1.1 * u, 0]], sw * .9, PAL.ink, 'ink', .65);
  }
  pop();
}

// A fluffy oval: the radius alternates in and out around the rim (stable per point), for a plush, tufted edge.
function fuzzPts(cx, cy, rx, ry, n = 40, amp = .05, j = 0) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, k = 1 + amp * (i % 2 ? -.6 : 1) * (.7 + .6 * hash(i * 3.1));
    p.push([cx + Math.cos(a) * rx * k + jit(j), cy + Math.sin(a) * ry * k + jit(j)]);
  }
  return p;
}

function heartPts(cx, cy, r, n = 22) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    p.push([cx + x * r / 16, cy + y * r / 16]);
  }
  return p;
}

// Compact painted emotes (Muse-relevant subset)
function jEmote(kind, x, y, s, k = 1, age = T) {
  const p = backOut(k); if (p < .02) return;
  const sw = clamp(s / 15, .4, 2);
  push(); translate(x, y); scale(p);
  switch (kind) {
    case '!': {
      paint([[-.55, -2.1], [.55, -2.1], [.2, .4], [-.2, .4]].map(([a, b]) => [a * s, b * s]), {
        wash: PAL.ochre, ink: PAL.ink, sw: sw * .8, curv: .2
      });
      paint(ellPts(0, 1.15 * s, .4 * s, .4 * s, 10), { wash: PAL.ochre, ink: PAL.ink, sw: sw * .7 });
      break;
    }
    case '?': {
      paint(ribbon([[-1, -1.2], [-.4, -2.1], [.5, -2.2], [1, -1.4], [.5, -.5], [0, .2]].map(([a, b]) => [a * s, b * s]), .7 * s, .45 * s), {
        wash: PAL.sky, ink: PAL.ink, sw: sw * .75
      });
      paint(ellPts(0, 1.1 * s, .38 * s, .38 * s, 10), { wash: PAL.sky, ink: PAL.ink, sw: sw * .7 });
      break;
    }
    case 'dots':
      for (let i = 0; i < 3; i++) {
        const ph = frac(age / 1.6), q = backOut(clamp((ph - i * .2) * 6)); if (q < .02) continue;
        paint(ellPts((i - 1) * 1.25 * s, 0, .38 * s * q, .38 * s * q, 10), { wash: PAL.ink, ink: null });
      }
      break;
    case 'spark':
      paint(starPts(0, 0, 1.5 * s * (1 + .12 * Math.sin(age * 10))), { wash: PAL.cream, fill: PAL.ochre, fillOp: 80, ink: PAL.ink, sw: sw * .5 });
      break;
    case 'hearts':
      for (let i = 0; i < 3; i++) {
        const ph = frac(age * .55 + i / 3), a = Math.sin(ph * Math.PI); if (a < .1) continue;
        paint(heartPts((Math.sin(ph * 6 + i) * .7 + i * .55 - .55) * s, -ph * 3.5 * s, s * (.45 + .5 * a)), {
          wash: '#E2476E', fill: PAL.rose, fillOp: 90, ink: PAL.ink, sw: sw * .5
        });
      }
      break;
    case 'sweat': {
      const d = (frac(age * .7) * 1.2) * s;
      push(); translate(2.6 * s, -.6 * s + d);
      paint([[0, -1.1 * s], [.55 * s, 0], [.4 * s, .45 * s], [0, .6 * s], [-.4 * s, .45 * s], [-.55 * s, 0]], {
        wash: mixCol(PAL.sky, PAL.cream, .3), ink: PAL.ink, sw: sw * .6, curv: .5
      });
      pop();
      break;
    }
    case 'check': {
      const pts = [[-1.1, 0], [-.25, 1], [1.4, -1.3]].map(([a, b]) => [a * s, b * s]);
      inkLine(pts, sw * 1.4, PAL.sap, 'ink', .3);
      break;
    }
    case 'zzz':
      for (let i = 0; i < 3; i++) {
        const ph = frac(age * .4 + i / 3), a = Math.sin(ph * Math.PI); if (a < .12) continue;
        const zs = (.7 + ph * .6) * s;
        push(); translate(ph * 2.4 * s, -ph * 3.8 * s); rotate(-.12);
        paint([[-.55, -.55], [.55, -.55], [.55, -.25], [-.1, .25], [.55, .25], [.55, .55], [-.55, .55], [-.55, .25], [.1, -.25], [-.55, -.25]]
          .map(([a, b]) => [a * zs, b * zs]), { wash: PAL.cream, fill: PAL.sky, fillOp: 70, ink: PAL.ink, sw: sw * .6 });
        pop();
      }
      break;
    case 'bulb':
      glow(0, -1.2 * s, 4 * s, '#FFD27A', .7);
      paint(ellPts(0, -1.2 * s, 1.05 * s, 1.1 * s, 14), { wash: '#FFE68A', ink: PAL.ink, sw: sw * .7 });
      paint(rectPts(-.45 * s, -.15 * s, .9 * s, .7 * s), { wash: '#9A93A8', ink: PAL.ink, sw: sw * .55 });
      break;
    default:
      paint(ellPts(0, 0, .6 * s, .6 * s, 10), { wash: PAL.ochre, ink: PAL.ink, sw: sw * .6 });
  }
  pop();
}

// ---------- emotions ----------
const _b = t => { const bp = bpOf(t), s1 = Math.sin(bp * Math.PI); return { bp, s1, ab: Math.abs(s1), hit: pulse(t), s2: Math.sin(bp * TAU), f: frac(bp) }; };
const EMO = {
  idle:       { eyes: 'normal', mouth: 'smile', blush: .5, take: .25, body: t => { const b = _b(t); return { dy: -.2 * b.ab, sq: .025 * b.hit, aL: .1 + .05 * b.s1, aR: .1 - .05 * b.s1 }; } },
  happy:      { eyes: 'happy', mouth: 'smile', blush: .7, take: .55, body: t => { const b = _b(t); return { dy: -1.0 * b.ab, sq: .08 * b.hit, aL: .35 + .35 * b.s1, aR: .35 - .35 * b.s1 }; } },
  excited:    { eyes: 'wide', mouth: 'open', emote: 'spark', take: .95, body: t => { const b = _b(t), h = Math.abs(b.s2); return { dy: -2.0 * h, sq: .14 * pulse2(t) - .05 * h, aL: .9 + .4 * Math.sin(b.bp * TAU * 2), aR: .9 - .4 * Math.sin(b.bp * TAU * 2) }; } },
  love:       { eyes: 'heart', mouth: 'cat', blush: .9, tint: 'rosy', tintK: .35, emote: 'hearts', take: .65, body: t => { const b = _b(t), s = Math.sin(b.bp * Math.PI / 2); return { rot: .06 * s, dx: .35 * s, dy: -.5 * b.ab, aL: -.05 + .12 * b.s1, aR: -.05 - .12 * b.s1 }; } },
  working:    { eyes: 'look', mouth: 'flat', take: .35, body: t => { const b = _b(t); return { lookY: .55, lookX: .15 * b.s1, dy: -.12 * b.ab, aL: .4, aR: .4, typing: 1, sq: .03 * b.hit }; } },
  thinking:   { eyes: 'look', mouth: 'flat', emote: 'dots', take: .35, body: t => { const b = _b(t); return { lookX: .45, lookY: -.7, rot: .04, aR: .85, aL: -.25 + .2 * Math.sin(b.f * Math.PI), dy: -.1 * b.ab }; } },
  waiting:    { eyes: 'normal', mouth: 'o', blush: .4, take: .3, body: t => { const b = _b(t); return { lookY: -.15, dy: -.15 * b.ab, aL: -.35 + .08 * b.s1, aR: -.35 - .08 * b.s1, sq: .04 + .02 * Math.sin(t * 2) }; } },
  hopeful:    { eyes: 'shine', mouth: 'cat', blush: .65, take: .45, body: t => { const b = _b(t); return { sq: -.05 - .02 * b.ab, dy: -.22 * b.ab, lookY: -.35, aL: .45 + .05 * b.s1, aR: .45 - .05 * b.s1 }; } },
  surprised:  { eyes: 'wide', mouth: 'O', emote: '!', fade: true, take: 1.15, body: t => { const b = _b(t); return { sq: -.1, dy: -.25 - .12 * b.ab, aL: 1.0 + .04 * b.s2, aR: 1.0 - .04 * b.s2 }; } },
  success:    { eyes: 'happy', mouth: 'grin', blush: .75, emote: 'check', take: .85, body: t => { const b = _b(t); return { dy: -1.4 * b.ab, sq: .1 * b.hit, aL: 1.05 + .2 * b.s1, aR: 1.05 - .2 * b.s1 }; } },
  confused:   { eyes: ['narrow', 'wide'], mouth: 'wobble', emote: '?', take: .55, body: t => { const b = _b(t); return { rot: .09 * Math.sin(b.bp * Math.PI / 4), aL: .1, aR: 1.3 + .12 * Math.sin(t * TAU * 3), dy: -.12 * b.ab }; } },
  nervous:    { eyes: 'look', mouth: 'wobble', tint: 'pale', tintK: .15, emote: 'sweat', take: .45, body: t => { const b = _b(t); return { lookX: beatN(t) % 2 ? .7 : -.7, dx: .22 * b.s1, aL: -.05 + .15 * Math.sin(t * TAU * 5), aR: -.05 + .15 * Math.sin(t * TAU * 5 + 1) }; } },
  sleepy:     { eyes: 'sleepy', mouth: 'o', emote: 'zzz', take: .2, body: t => { const br = Math.sin(t * TAU * .28); return { sq: .04 + .04 * br, rot: .05 * Math.sin(t * .7), aL: -.55, aR: -.55 }; } },
  idea:       { eyes: 'shine', mouth: 'grin', emote: 'bulb', take: 1.0, body: t => { const b = _b(t); return { dy: -.85 * b.ab, sq: -.04 + .08 * b.hit, aR: 1.4 + .08 * b.s2, aL: .15 + .15 * b.s1 }; } },
};

function feel(name, t, over = {}) {
  const E = EMO[name] || EMO.idle;
  return { eyes: E.eyes, mouth: E.mouth, tint: E.tint, tintK: E.tintK ?? 1, blush: E.blush || 0,
           emote: E.emote, ...(E.body ? E.body(t) : {}), ...over };
}

function emotions(t, keys, o = {}) {
  let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
  const [tc, name, over] = keys[i], age = t - tc, cur = feel(name, t, over);
  const tn = i + 1 < keys.length ? keys[i + 1][0] : Infinity, tkS = o.take ?? 1;
  const E = EMO[name] || EMO.idle;
  let squint = cur.squint || 0;
  if (tn - t < .1) squint = Math.max(squint, 1 - (tn - t) / .1);
  if (i > 0 && age < .14) squint = Math.max(squint, 1 - age / .14);
  const prev = i > 0 ? feel(keys[i - 1][1], t, keys[i - 1][2]) : null;
  if (prev && age < .5) {
    const base = { dy: 0, sq: 0, aL: .15, aR: .15, rot: 0, dx: 0, lookX: 0, lookY: 0, typing: 0 };
    const k = backOut(seg(age, 0, .4)), kc = ease(seg(age, 0, .3));
    for (const f in base) cur[f] = lerp(prev[f] ?? base[f], cur[f] ?? base[f], k);
    const a = tintCols(prev), b = tintCols(cur);
    cur.col = mixCol(a.col, b.col, kc); cur.dk = mixCol(a.dk, b.dk, kc); cur.lt = mixCol(a.lt, b.lt, kc); cur.tint = null;
    cur.blush = lerp(prev.blush || 0, cur.blush || 0, kc);
  }
  const t1 = prev ? take(t, tc, (E.take ?? .6) * tkS) : { sq: 0, dy: 0 };
  const En = i + 1 < keys.length ? EMO[keys[i + 1][1]] || EMO.idle : null;
  const t2 = En ? take(t, tn, (En.take ?? .6) * tkS) : { sq: 0, dy: 0 };
  cur.sq = (cur.sq || 0) + t1.sq + t2.sq; cur.dy = (cur.dy || 0) + t1.dy + t2.dy;
  cur.squint = squint;
  const same = prev && prev.emote === cur.emote;
  cur.emoteK = same ? 1 : seg(age, .06, .32) * (E.fade && !(over && over.emote) ? 1 - seg(age, 1.4, 1.8) : 1);
  cur.emoteAge = age;
  return cur;
}

function move(style, t, seed = 0) {
  const bp = bpOf(t), bi = Math.floor(bp), bf = bp - bi, hit = Math.max(0, 1 - bf * 3.5), s1 = Math.sin(bp * Math.PI), ab = Math.abs(s1);
  const o = { dy: 0, sq: 0, aL: .15, aR: .15, rot: 0, walk: null, dx: 0 };
  switch (style) {
    case 'bounce': o.dy = -ab * 1.4; o.sq = hit * .1; o.aL = .35 + s1; o.aR = .35 - s1; break;
    case 'walk': o.walk = bp / 2; o.dy = -ab * .5; o.aL = .25 * s1; o.aR = -o.aL; break;
    case 'wave': o.dy = -ab * .8; o.aL = 1.05 + .45 * Math.sin(bp * TAU * 2); o.aR = -.15; o.sq = hit * .07; break;
    case 'idle': o.dy = -ab * .4; o.sq = hit * .04; break;
    default: o.dy = -ab * .4; o.sq = hit * .04;
  }
  return o;
}

return { draw: jolly, jolly, EMO, feel, emotions, move, turn, spinView, VIEWS, TINT, tintCols, heartPts, fuzzPts, emote: jEmote, jEmote, JOLLY_PAL };
})());
