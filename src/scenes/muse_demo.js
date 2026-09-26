// muse_demo.js: "Booked." — 30s Muse / Jolly short.
// Sam wants to take their partner to dinner but is swamped, so they hand it to Muse (Jolly), who finds a table,
// checks with Sam, and books it.
//   Shot A (0–7s):    the ask. Sam, swamped on the sofa, dreams of dinner; taps the phone; Jolly pops out; Sam points.
//   Shot B (7–14s):   inside the phone. Jolly flicks through restaurants, scans the calendar, finds the slot.
//   Shot C (14–21s):  over Sam's shoulder. Jolly holds up the card; Sam's finger taps ✓; booked.
//   Shot D (21–30s):  the dinner. Sam and the partner clink glasses; Jolly peeks out of the phone and waves. Iris out.

(() => {
  const PARTY = [PAL.rose, PAL.ochre];
  const WALL_A = mixCol(PAL.indigo, PAL.cream, .45);
  const FLOOR = mixCol(PAL.clayDk, PAL.ink, .3);
  const SCREEN = '#E4EFFA', APP = mixCol(PAL.sky, PAL.cream, .45);
  const PHONE = mixCol(PAL.ink, PAL.indigo, .25);

  // ---------- small painted icons (no text) ----------
  function forkKnife(x, y, s, col = PAL.ink, sw = 2) {
    for (const dx of [-.28, 0, .28]) inkLine([[x - .8 * s + dx * s, y - 1.4 * s], [x - .8 * s + dx * s, y - .55 * s]], sw * .7, col, 'ink', 0);
    inkLine([[x - 1.1 * s, y - .6 * s], [x - .8 * s, y - .3 * s], [x - .5 * s, y - .6 * s]], sw * .8, col, 'ink', .6);
    inkLine([[x - .8 * s, y - .35 * s], [x - .8 * s, y + 1.4 * s]], sw, col, 'ink', 0);
    paint([[x + .6 * s, y - 1.4 * s], [x + 1.05 * s, y - .8 * s], [x + 1.0 * s, y - .05 * s], [x + .8 * s, y + .05 * s],
      [x + .8 * s, y + 1.4 * s], [x + .6 * s, y + 1.4 * s]], { wash: col, ink: null, curv: .3 });
  }
  function plateIcon(x, y, s, sw = 2) {
    paint(ellPts(x, y, 1.25 * s, 1.25 * s, 24), { wash: '#FFFDF6', ink: PAL.ink, sw });
    paint(ellPts(x, y, .85 * s, .85 * s, 20), { wash: mixCol(PAL.cream, PAL.sky, .18), ink: PAL.ink, sw: sw * .5 });
    const k = .7 * s;
    for (const dx of [-.25, 0, .25]) inkLine([[x - 2 * s + dx * k, y - 1.1 * s], [x - 2 * s + dx * k, y - .4 * s]], sw * .7, PAL.ink, 'ink', 0);
    inkLine([[x - 2 * s, y - .4 * s], [x - 2 * s, y + 1.2 * s]], sw, PAL.ink, 'ink', 0);
    paint([[x + 1.9 * s, y - 1.2 * s], [x + 2.25 * s, y - .6 * s], [x + 2.2 * s, y], [x + 2.05 * s, y + .05 * s],
      [x + 2.05 * s, y + 1.2 * s], [x + 1.9 * s, y + 1.2 * s]], { wash: PAL.ink, ink: null, curv: .3 });
  }
  function personIcon(x, y, s, col, sw = 1.5, bun = false) {
    if (bun) paint(ellPts(x, y - 1.6 * s, .32 * s, .3 * s, 12), { wash: PARTNER.hair, ink: PAL.ink, sw: sw * .8 });
    paint(ellPts(x, y - 1.05 * s, .55 * s, .55 * s, 16), { wash: col, ink: PAL.ink, sw });
    const P = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; P.push([x + Math.cos(a) * .95 * s, y + .75 * s + Math.sin(a) * .9 * s]); }
    paint(P, { wash: col, ink: PAL.ink, sw });
  }
  function candleIcon(x, y, s, t) {
    glow(x, y - 1.3 * s, 2.4 * s, '#FFC766', .6);
    paint(rrPts(x - .25 * s, y - s, .5 * s, 1.6 * s, .15 * s), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
    paint([[x, y - 1.9 * s * (1 + .06 * Math.sin(t * 17))], [x + .22 * s, y - 1.3 * s], [x, y - 1.05 * s], [x - .22 * s, y - 1.3 * s]], { wash: PAL.ochre, ink: PAL.ink, sw: .7, curv: .6 });
  }
  function checkMark(x, y, s, sw, col, k = 1) {
    if (k <= 0) return;
    const P = [[x - 1 * s, y], [x - .3 * s, y + .75 * s], [x + 1.15 * s, y - .85 * s]], L1 = .45;
    const pts = k < L1 ? [P[0], [lerp(P[0][0], P[1][0], k / L1), lerp(P[0][1], P[1][1], k / L1)]]
      : [P[0], P[1], [lerp(P[1][0], P[2][0], (k - L1) / (1 - L1)), lerp(P[1][1], P[2][1], (k - L1) / (1 - L1))]];
    inkLine(pts, sw, col, 'ink', .15);
  }
  function crossMark(x, y, s, sw, col) {
    inkLine([[x - s, y - s], [x + s, y + s]], sw, col, 'ink', 0);
    inkLine([[x + s, y - s], [x - s, y + s]], sw, col, 'ink', 0);
  }
  function confetti(lt, t0, n, key, x0 = 0, x1 = W, y0 = -60) {
    const a = lt - t0; if (a < 0) return;
    boilSeed(key);
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, hash(i + 11)) + Math.sin(a * 2 + i) * 30;
      const y = y0 - hash(i + 3) * 400 + a * (170 + 120 * hash(i + 5));
      if (y > H + 40) continue;
      const r = a * (2 + 3 * hash(i + 9)) + i, c = [PAL.rose, PAL.ochre, PAL.sap, PAL.sky, PAL.cream][i % 5];
      const w = 9 + 7 * hash(i + 1), h = 5 + 3 * hash(i + 2), cr = Math.cos(r), sr = Math.sin(r);
      paint([[-w, -h], [w, -h], [w, h], [-w, h]].map(([px, py]) => [x + px * cr - py * sr, y + (px * sr + py * cr) * .8]), { wash: c, washOp: 230, ink: null });
    }
  }
  function dreamBubble(cx, cy, k, fromX, fromY, t) {   // thought bubble: dinner for two
    if (k <= 0) return;
    boilSeed('bubble');
    for (let i = 0; i < 3; i++) {
      const q = backOut(seg(k, i * .12, i * .12 + .3)); if (q <= 0) continue;
      const f = (i + 1) / 4;
      paint(ellPts(lerp(fromX, cx - 120, f), lerp(fromY, cy + 110, f), (8 + i * 6) * q, (8 + i * 6) * q, 12), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
    }
    const q = backOut(seg(k, .35, .75)); if (q <= 0) return;
    push(); translate(cx, cy); scale(q);
    paint(cloudPts(0, 0, 200, 120, 9, .12), { wash: PAL.cream, ink: PAL.ink, sw: 1.3, curv: .3 });
    boilSeed('bubbleicons');
    plateIcon(-80, 10, 26, 1.6);
    candleIcon(0, 40, 22, t);
    personIcon(95, 20, 38, PARTNER.shirt, 1.3, true);
    paint(heartPts(40, -55, 18 * (1 + .1 * Math.sin(t * 6))), { wash: '#E2476E', ink: PAL.ink, sw: 1 });
    pop();
  }

  // ---------- Shot A: the ask ----------
  function livingRoom(t) {
    boilSeed('wall');
    paint(rectPts(-300, -300, W + 600, 1080), { wash: WALL_A, fill: mixCol(WALL_A, PAL.violet, .3), fillOp: 60, bleed: .1, tex: .5, ink: null });
    boilSeed('floor');
    paint(rectPts(-300, 800, W + 600, 700), { wash: FLOOR, fill: mixCol(FLOOR, PAL.clay, .3), fillOp: 70, bleed: .1, tex: .6, ink: null });
    inkLine([[-100, 800], [960, 802]], 1, PAL.ink, 'inkfine', 0); inkLine([[960, 802], [2020, 800]], 1, PAL.ink, 'inkfine', 0);
    // window at dusk
    boilSeed('window');
    const wx = 1320, wy = 150, ww = 400, wh = 340;
    paint(rrPts(wx - 22, wy - 22, ww + 44, wh + 44, 10, 1.5), { wash: mixCol(PAL.cream, WALL_A, .25), ink: PAL.ink, sw: 1.2 });
    paint(rectPts(wx, wy, ww, wh * .5), { wash: mixCol(PAL.violet, PAL.indigo, .4), ink: null });
    paint(rectPts(wx, wy + wh * .5, ww, wh * .5), { wash: mixCol(PAL.rose, PAL.violet, .4), ink: null });
    glow(wx + 300, wy + 80, 60, '#FFF1C8', .5);
    paint(ellPts(wx + 300, wy + 80, 26, 26, 16), { wash: PAL.cream, ink: null });
    for (let i = 0; i < 8; i++) {
      const bx = wx + i * ww / 8, bh = 70 + 130 * hash(i + 21);
      paint(rectPts(bx, wy + wh - bh, ww / 8 + 5, bh), { wash: mixCol(PAL.night, PAL.indigo, .3 + .3 * hash(i)), ink: null });
      if (hash(i * 5) > .4) paint(rectPts(bx + 12, wy + wh - bh + 20, 7, 9), { wash: PAL.ochre, ink: null });
    }
    inkLine([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 3, mixCol(PAL.cream, WALL_A, .25), 'ink', 0);
    inkLine([[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], 3, mixCol(PAL.cream, WALL_A, .25), 'ink', 0);
    // lamp
    boilSeed('lamp');
    glow(250, 380, 380, '#FFC766', .45);
    inkLine([[250, 420], [254, 860]], 2.4, PAL.ink, 'ink', 0);
    paint(ellPts(252, 865, 50, 11, 16), { wash: PAL.ink, ink: null });
    paint([[190, 410], [310, 410], [280, 300], [220, 300]], { wash: mixCol(PAL.ochre, PAL.cream, .35), ink: PAL.ink, sw: 1.1 });
  }
  function sofa(pass) {
    const col = mixCol(PAL.violet, PAL.rose, .35), dk = mixCol(col, PAL.ink, .25);
    if (pass === 'back') {
      boilSeed('sofaback');
      paint(ellPts(840, 880, 460, 30, 24), { fill: PAL.ink, fillOp: 70, bleed: .2, ink: null });
      paint(rrPts(420, 520, 840, 260, 40, 1.5), { wash: dk, ink: PAL.ink, sw: 1.3 });
      paint(rrPts(450, 545, 380, 200, 30), { wash: col, ink: PAL.ink, sw: .8 });
      paint(rrPts(850, 545, 380, 200, 30), { wash: col, ink: PAL.ink, sw: .8 });
      paint(rrPts(400, 740, 880, 110, 30, 1), { wash: col, ink: PAL.ink, sw: 1.3 });
    } else {
      boilSeed('sofaarms');
      paint(rrPts(360, 640, 110, 230, 40, 1), { wash: dk, ink: PAL.ink, sw: 1.3 });
      paint(rrPts(1210, 640, 110, 230, 40, 1), { wash: dk, ink: PAL.ink, sw: 1.3 });
    }
  }
  function workPile(t) {
    // laptop on the cushion, full of rose "unread" rows, and a stack of papers
    boilSeed('worklaptop');
    glow(560, 670, 120, '#BFD8FF', .35);
    paint([[480, 745], [650, 745], [640, 600], [490, 600]], { wash: PHONE, ink: PAL.ink, sw: 1.1 });
    paint([[497, 732], [633, 732], [626, 612], [504, 612]], { wash: SCREEN, ink: null });
    for (let i = 0; i < 5; i++) {
      paint(rrPts(512, 622 + i * 21, 86 + 20 * hash(i + 3), 11, 4), { wash: i % 2 ? mixCol(PAL.rose, SCREEN, .3) : mixCol(PAL.indigo, SCREEN, .6), ink: null });
      paint(ellPts(612, 628 + i * 21, 5, 5, 8), { wash: PAL.rose, ink: null });
    }
    paint([[460, 740], [670, 740], [690, 758], [440, 758]], { wash: mixCol(PAL.sky, PAL.ink, .45), ink: PAL.ink, sw: 1 });
    boilSeed('papers');
    for (let i = 0; i < 6; i++) paint(rrPts(1100 + 6 * hash(i) - 3, 735 - i * 11, 120, 14, 3), { wash: i % 2 ? PAL.cream : '#F4EBDA', ink: PAL.ink, sw: .7 });
    paint(rrPts(1106, 672, 108, 12, 3), { wash: PAL.cream, ink: PAL.ink, sw: .7 });
  }
  function heldPhone(lit, bump = 0) {
    return (u, sw) => {
      push(); translate(0, -1.1 * u - bump * u); rotate(-.12);
      if (lit > 0) glow(-.2 * u, 0, 3.5 * u, '#BFE0FF', .5 * lit);
      paint(rrPts(-.55 * u, -1.3 * u, 1.1 * u, 2.3 * u, .25 * u), { wash: PHONE, ink: PAL.ink, sw: sw * .8 });
      paint(rrPts(-.42 * u, -1.15 * u, .84 * u, 1.95 * u, .15 * u), { wash: mixCol('#2B3160', SCREEN, lit), ink: null });
      pop();
    };
  }

  function shotAsk(t, lt, dur) {
    const X = 820, Y = 760, u = 24;
    const into = easeIn(seg(lt, 6.35, dur));
    const PH = [X + 2.9 * u, Y - 4.7 * u];   // phone in the far hand, world
    const cx = kf(lt, [[0, 830], [1.9, 840], [2.6, 950], [3.7, 950], [4.2, 930], [4.9, 960], [6.2, 960]]);
    const cy = kf(lt, [[0, 640], [1.9, 640], [2.6, 520], [3.7, 520], [4.2, 610], [4.9, 540], [6.2, 560]]);
    const z = kf(lt, [[0, 1.5], [1.9, 1.6], [2.6, 1.35], [3.7, 1.35], [4.2, 1.95], [4.9, 1.6], [6.2, 1.65]]);
    camBegin(lerp(cx, PH[0], into), lerp(cy, PH[1] - 20, into), lerp(z, 2.3, into));
    livingRoom(t);
    sofa('back');
    workPile(t);

    // work pings popping off the phone
    const tap = lt > 3.9 && lt < 4.15 ? Math.sin(seg(lt, 3.9, 4.15) * Math.PI) : 0;
    const sam = hmood(lt, [
      [0, { eyes: 'half', brow: 'sad', mouth: 'flat', lookY: .6, lookX: .6 }],
      [1.45, { eyes: 'closed', brow: 'sad', mouth: 'frown' }],
      [1.85, { eyes: 'half', brow: 'sad', mouth: 'flat', lookY: .6, lookX: .6 }],
      [2.1, { eyes: 'open', brow: 'up', mouth: 'smile', lookX: .8, lookY: -1, blush: .5 }],
      [3.6, { eyes: 'open', brow: 'flat', mouth: 'smile', lookX: .7, lookY: .5 }],
      [4.2, { eyes: 'open', brow: 'up', mouth: 'open', lookX: 1, lookY: -.2 }],
      [4.8, { eyes: 'open', brow: 'flat', mouth: 'grin', lookX: 1, lookY: -.8 }],
      [5.9, { eyes: 'happy', mouth: 'grin', blush: .4 }],
    ]);
    const sigh = Math.exp(-Math.max(0, lt - 1.45) * 3) * (lt > 1.45 ? 1 : 0);
    const breathe = .08 * Math.sin(t * 2.2) + .25 * sigh;
    const point = seg(lt, 4.8, 5.1);
    const handN = [lerp(2.3, 3.6, ease(point)), lerp(-.9, -8.4, backOut(point))];
    human(X, Y, u, {
      pal: SAM, view: 'q', legs: true, hair: 'short', boilKey: 'samA', ...sam,
      dy: breathe, tilt: kf(lt, [[0, .1], [1.9, .12], [2.3, -.06], [3.6, -.04], [4.0, .03], [4.8, -.05]]),
      lean: kf(lt, [[0, -.08], [1.45, -.12], [2.0, -.1], [2.4, .02], [4.0, .06], [4.3, -.04], [4.9, .1]]),
      handF: [2.9, -3.6 - tap * .25], holdF: heldPhone(ease(seg(lt, .3, .6)), tap * .1),
      handN, pointN: point > .5 ? -1.05 : undefined,
    });
    sofa('front');

    // work pings
    for (let i = 0; i < 3; i++) {
      const a = lt - (.7 + i * .4); if (a < 0 || a > 1.1) continue;
      boilSeed('ping' + i);
      const k = backOut(seg(a, 0, .2)) * (1 - seg(a, .8, 1.1));
      paint(ellPts(PH[0] + 30 + i * 22, PH[1] - 40 - a * 60, 13 * k, 13 * k, 12), { wash: PAL.rose, ink: PAL.ink, sw: .8 });
    }

    dreamBubble(1110, 360, seg(lt, 2.1, 3.1), X + 60, Y - 11 * u, t);

    // Jolly pops out of the phone
    const pop = seg(lt, 4.1, 4.5), back = seg(lt, 6.1, 6.45);
    if (pop > 0 && back < 1) {
      const k = backOut(pop) * (1 - easeIn(back));
      const jx = lerp(PH[0], 1010, easeOut(pop)) + (PH[0] - 1010) * easeIn(back) * (pop >= 1 ? 1 : 0);
      const jy = lerp(PH[1] - 20, 650, easeOut(pop)) + (PH[1] - 20 - 650) * easeIn(back) + Math.sin(t * 3) * 6;
      if (pop < 1) glow(PH[0], PH[1] - 30, 160, '#BFE0FF', .8 * (1 - pop));
      boilSeed('jpop');
      for (let i = 0; i < 6; i++) {
        const q = seg(lt, 4.1 + i * .03, 4.7); if (q <= 0 || q >= 1) continue;
        const a = i / 6 * TAU;
        paint(starPts(PH[0] + Math.cos(a) * 90 * easeOut(q), PH[1] - 30 + Math.sin(a) * 70 * easeOut(q), 12 * (1 - q), .4, 4), { wash: PAL.ochre, ink: null });
      }
      const jm = emotions(lt, [
        [4.1, 'excited', { lookX: -.8 }],
        [4.9, 'thinking', { lookX: .6, lookY: -1, emote: null }],
        [5.3, 'idea', { lookX: .5, lookY: -.8 }],
        [5.95, 'happy', { emote: null }],
      ]);
      const wave = lt < 4.9 ? move('wave', lt) : {};
      jolly(jx, jy, 13 * k, { ...jm, ...wave, view: 'q', flip: lt < 4.9, noShadow: true, dy: (jm.dy || 0) + (wave.dy || 0), smear: back > 0 ? .6 : 0 });
    }

    const eye = toScreen(X + 6, Y - 8.4 * u);
    camEnd();
    boilSeed('trA');
    if (lt < .6) iris(...eye, lerp(0, 1700, easeIn(lt / .6)));
    flash(ease(seg(lt, 6.6, dur)), APP);
  }

  // ---------- Shot B: inside the phone ----------
  const GX = 772, GY = 392, CW = 121.6, CH = 101.3, GAP = 12, FOUND = 7;
  const cellXY = i => [GX + (i % 5) * (CW + GAP), GY + Math.floor(i / 5) * (CH + GAP)];
  const busy = i => i !== FOUND && hash(i * 7.3 + 1) < .5;

  function calendar(k, scanIdx, foundAge) {
    if (k <= 0) return;
    push(); translate(1105, 520); scale(backOut(k)); translate(-1105, -520);
    boilSeed('calbg');
    paint(rrPts(GX - 30, 300, 5 * CW + 4 * GAP + 60, 450, 26), { wash: '#FBFDFF', ink: PAL.ink, sw: 1.3 });
    paint(rrPts(GX, 322, 5 * CW + 4 * GAP, 50, 10), { wash: mixCol(PAL.indigo, SCREEN, .55), ink: null });
    for (let i = 0; i < 15; i++) {
      boilSeed('cell' + i);
      const [x, y] = cellXY(i);
      if (i === FOUND && foundAge > 0) continue;
      paint(rrPts(x, y, CW, CH, 10), { wash: busy(i) ? mixCol(PAL.rose, SCREEN, .55) : '#FFFFFF', ink: mixCol(PAL.indigo, SCREEN, .5), sw: .7 });
      if (busy(i)) crossMark(x + CW / 2, y + CH / 2, 14, 2.4, mixCol(PAL.rose, PAL.ink, .35));
    }
    if (scanIdx != null && foundAge <= 0) {
      boilSeed('scan');
      const [x, y] = cellXY(scanIdx);
      glow(x + CW / 2, y + CH / 2, 90, '#7FB8FF', .45);
      paint(rrPts(x - 4, y - 4, CW + 8, CH + 8, 12), { wash: mixCol(PAL.sky, SCREEN, .35), washOp: 170, ink: PAL.indigo, sw: 2 });
    }
    if (foundAge > 0) {
      boilSeed('found');
      const [x, y] = cellXY(FOUND), q = backOut(seg(foundAge, 0, .35)), cx = x + CW / 2, cy = y + CH / 2;
      glow(cx, cy, 170 + 60 * Math.exp(-foundAge * 3), '#FFD96A', .5 + .4 * Math.exp(-foundAge * 2));
      push(); translate(cx, cy); scale(.8 + .35 * q);
      paint(rrPts(-CW / 2, -CH / 2, CW, CH, 12), { wash: mixCol(PAL.ochre, PAL.cream, .2), ink: PAL.ink, sw: 1.6 });
      checkMark(0, 0, 26, 5, PAL.ink, easeOut(seg(foundAge, .1, .4)));
      pop();
      for (let i = 0; i < 7; i++) {
        const s = seg(foundAge, i * .03, .7); if (s <= 0 || s >= 1) continue;
        const a = i / 7 * TAU + .3, r = 70 + 90 * easeOut(s);
        paint(starPts(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 18 * (1 - s), .38, 4), { wash: PAL.ochre, ink: null });
      }
    }
    pop();
  }

  // restaurant option cards: 0 burger (busy), 1 noodles (busy), 2 candlelit (the one)
  function placeCard(kind, t, cross) {
    boilSeed('place' + kind);
    paint(rrPts(-190, -240, 380, 480, 28, 1), { wash: '#FFFDF6', ink: PAL.ink, sw: 1.4 });
    const top = [mixCol(PAL.ochre, PAL.cream, .3), mixCol(PAL.teal, PAL.cream, .4), mixCol(PAL.night, PAL.violet, .3)][kind];
    paint(rrPts(-165, -215, 330, 250, 18), { wash: top, ink: null });
    if (kind === 0) {           // burger
      paint(ellPts(0, -110, 90, 50, 20), { wash: mixCol(PAL.ochre, PAL.clay, .3), ink: PAL.ink, sw: 1.2 });
      paint(rrPts(-95, -95, 190, 22, 10), { wash: PAL.clayDk, ink: PAL.ink, sw: 1 });
      paint(rrPts(-90, -72, 180, 34, 14), { wash: mixCol(PAL.ochre, PAL.clay, .3), ink: PAL.ink, sw: 1.2 });
    } else if (kind === 1) {    // noodle bowl
      paint([[-100, -100], [100, -100], [70, -30], [-70, -30]], { wash: PAL.rose, ink: PAL.ink, sw: 1.2, curv: .5 });
      for (let i = 0; i < 3; i++) inkLine([[-60 + i * 20, -100], [-40 + i * 25, -140], [-50 + i * 30, -170]], 2, PAL.cream, 'ink', .6);
      inkLine([[20, -190], [90, -95]], 3, PAL.clayDk, 'ink', 0); inkLine([[45, -195], [105, -100]], 3, PAL.clayDk, 'ink', 0);
    } else {                    // candlelit table for two
      candleIcon(0, -70, 34, t);
      paint(ellPts(-85, -55, 42, 14, 16), { wash: '#FFFDF6', ink: PAL.ink, sw: 1 });
      paint(ellPts(85, -55, 42, 14, 16), { wash: '#FFFDF6', ink: PAL.ink, sw: 1 });
    }
    // rating stars
    const n = [3, 3, 5][kind];
    for (let i = 0; i < 5; i++) paint(starPts(-100 + i * 50, 90, 20, .45, 5), { wash: i < n ? PAL.ochre : mixCol(PAL.ink, PAL.cream, .8), ink: PAL.ink, sw: .8 });
    paint(rrPts(-120, 150, 240, 14, 6), { wash: mixCol(PAL.ink, PAL.cream, .8), ink: null });
    paint(rrPts(-120, 180, 160, 14, 6), { wash: mixCol(PAL.ink, PAL.cream, .8), ink: null });
    if (cross > 0) {     // fully booked
      const q = backOut(cross);
      paint(ellPts(130, -190, 50 * q, 50 * q, 18), { wash: PAL.rose, ink: PAL.ink, sw: 1.2 });
      crossMark(130, -190, 20 * q, 5, PAL.cream);
    }
  }

  function shotSearch(t, lt, dur) {
    camBegin(960 + 8 * Math.sin(lt * .5), 540, 1.0 + .01 * lt);
    boilSeed('appbg');
    paint(rectPts(-300, -300, W + 600, H + 600), { wash: APP, fill: mixCol(APP, PAL.sky, .4), fillOp: 60, bleed: .12, tex: .4, ink: null });
    for (let i = 0; i < 12; i++) for (let j = 0; j < 7; j++)
      paint(ellPts(80 + i * 160 + (j % 2) * 80, 90 + j * 150, 4, 4, 6), { wash: mixCol(APP, PAL.indigo, .25), ink: null });

    // carousel of places: each slides in from the right, the busy ones get ✗ and slide off left
    const CX = 1105, CY = 540;
    for (let i = 0; i < 3; i++) {
      const t0 = .45 + i * .9, inK = easeOut(seg(lt, t0, t0 + .3)), cross = seg(lt, t0 + .45, t0 + .6);
      const outK = i < 2 ? ease(seg(lt, t0 + .8, t0 + 1.05)) : 0;
      if (inK <= 0 || outK >= 1) continue;
      let x = lerp(W + 260, CX, inK) - outK * (CX + 400), y = CY, s = 1;
      if (i === 2) {  // the chosen one flies up to the corner
        const k = ease(seg(lt, 3.3, 3.75));
        x = lerp(x, 330, k); y = lerp(CY, 250, k); s = lerp(1, .5, k);
        const pick = seg(lt, 2.75, 3.3);
        if (pick > 0) glow(x, y, 300 * s, '#FFD96A', .45 * Math.sin(pick * Math.PI) + .15 * k);
      }
      push(); translate(x, y); scale(s); rotate(.04 * Math.sin(lt * 2 + i));
      placeCard(i, t, i < 2 ? cross : 0);
      pop();
    }

    let scanIdx = null;
    if (lt > 4.0 && lt < 5.0) scanIdx = Math.floor((lt - 4.0) * 9) % 10;
    else if (lt >= 5.0 && lt < 5.6) scanIdx = 10 + Math.floor((lt - 5.0) * 6) % 5;
    calendar(seg(lt, 3.6, 4.0), scanIdx, lt - 5.6);

    const mood = emotions(lt, [
      [0, 'working', { lookX: .9, lookY: 0, typing: 0 }],
      [2.9, 'hopeful', { lookX: .9 }],
      [4.0, 'working', { lookX: .9, lookY: -.2, typing: 0 }],
      [4.8, 'thinking', { lookX: .8, lookY: -.6 }],
      [5.95, 'surprised', { lookX: .8, lookY: -.1 }],
      [6.4, 'excited'],
    ]);
    // Jolly flicks each card away
    const flick = [1.25, 2.15].reduce((s, e) => s + Math.max(0, Math.sin(seg(lt, e - .1, e + .25) * Math.PI)), 0);
    jolly(360, 960, 34, { ...mood, view: 'q', aL: (mood.aL || 0) + 1.2 * flick, dy: (mood.dy || 0) + Math.sin(t * 2.4) * .3, rot: .08 * flick });

    camEnd();
    // phone bezel around the frame: we are inside the screen
    boilSeed('bezel');
    irisShape(rrPts(26, 22, W - 52, H - 44, 70), PHONE);
    flash(1 - ease(seg(lt, 0, .45)), APP);
    flash(ease(seg(lt, 6.65, dur)), PAL.cream);
  }

  // ---------- Shot C: over Sam's shoulder, the permission ----------
  function shotPermit(t, lt, dur) {
    const TAP = 4.2, tapA = lt - TAP;
    const pull = ease(seg(lt, 0, 1.0));
    const sh = tapA > .05 && tapA < .4 ? shakeXY(t, 8 * (1 - seg(tapA, .05, .4))) : [0, 0];
    camBegin(lerp(1000, 960, pull) + sh[0] + 6 * Math.sin(lt * .6), lerp(430, 540, pull) + sh[1], lerp(2.1, 1.0, pull) + .015 * Math.max(0, lt - 1));

    // room behind, soft and dark (the living room at night)
    const warm = ease(seg(tapA, .2, 1.4));
    boilSeed('bgC');
    const bg = mixCol(mixCol(WALL_A, PAL.indigo, .45), mixCol(PAL.ochre, PAL.rose, .5), warm * .6);
    paint(rectPts(-300, -300, W + 600, H + 600), { wash: bg, fill: mixCol(bg, PAL.violet, .3), fillOp: 60, bleed: .12, tex: .5, ink: null });
    glow(200, 200, 360, '#FFC766', .3);

    // the phone, big
    const PX = 1000, PY = 560;
    glow(PX, PY - 60, 520, '#BFE0FF', .35 + .3 * warm);
    boilSeed('bigphone');
    push(); translate(PX, PY); rotate(-.04);
    paint(rrPts(-270, -470, 540, 980, 60, 1), { wash: PHONE, ink: PAL.ink, sw: 1.6 });
    paint(rrPts(-245, -445, 490, 930, 42), { wash: mixCol(APP, mixCol(PAL.sap, PAL.cream, .6), ease(seg(tapA, .15, .5)) * .6), ink: null });

    // the card
    const arr = backOut(seg(lt, .7, 1.2));
    boilSeed('card');
    push(); translate(0, -150); scale(.5 + .5 * arr);
    paint(rrPts(-215, -250, 430, 470, 30), { wash: '#FFFDF6', ink: PAL.ink, sw: 1.4 });
    paint(rrPts(-190, -225, 380, 170, 18), { wash: mixCol(PAL.night, PAL.violet, .3), ink: null });
    candleIcon(0, -110, 28, t);
    paint(ellPts(-80, -95, 36, 12, 16), { wash: '#FFFDF6', ink: PAL.ink, sw: .9 });
    paint(ellPts(80, -95, 36, 12, 16), { wash: '#FFFDF6', ink: PAL.ink, sw: .9 });
    boilSeed('cardicons');
    personIcon(-55, 20, 40, PAL.teal, 1.4);
    personIcon(55, 20, 40, PARTNER.shirt, 1.4, true);
    paint(heartPts(0, -20, 18), { wash: '#E2476E', ink: PAL.ink, sw: 1 });
    // buttons
    const press = tapA > 0 && tapA < .25 ? Math.sin(seg(tapA, 0, .25) * Math.PI) : 0;
    const call = lt > 2.6 && tapA < 0 ? .5 + .5 * Math.sin((lt - 2.6) * 6) : 0;
    boilSeed('btnA');
    if (call > 0) glow(-80, 150, 130, '#B8E986', .4 * call);
    push(); translate(-80, 150); scale(1 + .06 * call - .12 * press, 1 + .06 * call - .2 * press);
    paint(rrPts(-95, -42, 190, 84, 42), { wash: PAL.sap, ink: PAL.ink, sw: 1.3 });
    checkMark(0, 0, 24, 5, PAL.cream);
    pop();
    boilSeed('btnB');
    paint(rrPts(40, 108, 130, 84, 42), { wash: mixCol(PAL.cream, PAL.ink, .3 + .15 * seg(tapA, .1, .5)), ink: PAL.ink, sw: 1.1 });
    crossMark(105, 150, 16, 5, PAL.cream);
    if (tapA > 0 && tapA < .8) {
      boilSeed('ripple');
      for (let i = 0; i < 2; i++) {
        const q = seg(tapA, i * .12, .6 + i * .12); if (q <= 0 || q >= 1) continue;
        const r = easeOut(q);
        inkLine(ellPts(-80, 150, 50 + 150 * r, 35 + 100 * r, 28).concat([[-80 + 50 + 150 * r, 150]]), 4 * (1 - q), PAL.sap, 'ink', .5);
      }
    }
    if (tapA > .12) {
      boilSeed('stamp');
      glow(0, -20, 300, '#D8F5A8', .6 * Math.exp(-(tapA - .12) * 2));
      checkMark(0, -30, 120, 14, mixCol(PAL.sap, PAL.ink, .15), easeOut(seg(tapA, .12, .4)));
    }
    pop();

    // Jolly on the screen, presenting the card to Sam
    const jm = emotions(lt, [
      [0, 'hopeful', { lookX: -.6, lookY: -.3 }],
      [2.5, 'nervous', { lookY: -.2 }],
      [4.5, 'success'],
      [6.0, 'happy'],
    ]);
    const hop = jump(lt, 4.55, 5.05, 2.2);
    jolly(-95, 330, 26, {
      ...jm, view: 'q', flip: true, aL: lt < 2.5 ? 1.35 + .1 * Math.sin(t * 5) : jm.aL,
      dy: (jm.dy || 0) + hop.dy, sq: (jm.sq || 0) + hop.sq, boilKey: 'jC',
    });
    confetti(lt, TAP + .35, 22, 'confC', -240, 240, -440);
    pop();

    // Sam: back of the head and shoulder, big in the foreground, and the hand holding the phone
    boilSeed('samshoulder');
    const lift = .5 * ease(seg(tapA, .3, .8)) * (1 - seg(lt, 6, 7));
    paint([[-100, 1200], [-100, 900], [120, 840], [420, 830], [700, 900], [860, 1200]], { wash: SAM.shirt, ink: PAL.ink, sw: 2, curv: .4 });
    boilSeed('samhead');
    const tilt = lt > 2.2 && lt < 3.6 ? .06 * Math.sin(seg(lt, 2.2, 3.6) * Math.PI) : 0;
    push(); translate(360, 760 - lift * 30); rotate(tilt);
    paint(ellPts(0, -60, 250, 290, 30), { wash: SAM.skin, ink: PAL.ink, sw: 2 });
    paint(ellPts(235, -30, 40, 62, 14), { wash: mixCol(SAM.skin, PAL.clayDk, .25), ink: PAL.ink, sw: 1.6 });
    paint(ellPts(-10, -110, 262, 270, 30), { wash: SAM.hair, fill: mixCol(SAM.hair, PAL.violet, .3), fillOp: 50, ink: PAL.ink, sw: 2 });
    pop();
    // the holding hand wraps the phone's lower left edge
    boilSeed('holdhand');
    paint(ellPts(745, 900, 95, 120, 20), { wash: SAM.skin, ink: PAL.ink, sw: 1.8 });
    for (let i = 0; i < 3; i++) paint(ellPts(745 + 20, 820 + i * 55, 45, 26, 12), { wash: SAM.skin, ink: PAL.ink, sw: 1.4 });
    // the tapping finger comes in from the bottom right
    const fk = kf(lt, [[0, 0], [2.9, 0], [3.5, .75], [3.95, .75], [4.2, 1], [4.45, .8], [5.1, .7], [5.8, 0]]);
    if (fk > 0) {
      boilSeed('finger');
      const tip = [lerp(1600, 922, fk), lerp(1250, 566, fk)];
      if (fk > .95) glow(tip[0], tip[1], 60, '#FFFFFF', .4);
      const hx = tip[0] + 150, hy = tip[1] + 130;
      paint(ribbon([[hx + 200, hy + 400], [hx + 90, hy + 180], [hx, hy]], 150, 120), { wash: SAM.skin, ink: PAL.ink, sw: 1.8 });
      paint(ribbon([[hx - 20, hy - 20], [lerp(hx, tip[0], .5), lerp(hy, tip[1], .5)], tip], 52, 42), { wash: SAM.skin, ink: PAL.ink, sw: 1.6 });
      paint(ellPts(hx + 10, hy + 20, 85, 75, 18), { wash: SAM.skin, ink: PAL.ink, sw: 1.8 });
      paint(ellPts(tip[0] + 8, tip[1] + 8, 14, 11, 10, 0, .7), { wash: mixCol(SAM.skin, PAL.cream, .5), ink: null });
    }

    camEnd();
    flash(tapA > .12 ? Math.exp(-(tapA - .12) * 5) * .45 : 0, '#FBFFF0');
    flash(1 - ease(seg(lt, 0, .35)), PAL.cream);
    boilSeed('trC');
    if (lt > dur - .3) brushWipe((lt - (dur - .3)) / .6, PARTY);
  }

  // ---------- Shot D: the dinner ----------
  function restaurant(t) {
    boilSeed('wallD');
    const wall = mixCol(PAL.clay, PAL.ochre, .45), wallDk = mixCol(wall, PAL.clayDk, .5);
    paint(rectPts(-300, -300, W + 600, 1100), { wash: wall, fill: mixCol(wall, PAL.cream, .3), fillOp: 60, bleed: .1, tex: .55, ink: null });
    paint(rectPts(-300, 640, W + 600, 180), { wash: wallDk, ink: null });
    boilSeed('floorD');
    paint(rectPts(-300, 810, W + 600, 700), { wash: mixCol(PAL.clayDk, PAL.ink, .4), fill: PAL.clayDk, fillOp: 60, bleed: .1, tex: .6, ink: null });
    // window with the night city
    boilSeed('winD');
    const wx = 1380, wy = 150, ww = 400, wh = 340;
    paint(rrPts(wx - 22, wy - 22, ww + 44, wh + 44, 10, 1.5), { wash: mixCol(PAL.cream, wall, .2), ink: PAL.ink, sw: 1.2 });
    paint(rectPts(wx, wy, ww, wh), { wash: mixCol(PAL.night, PAL.indigo, .4), ink: null });
    glow(wx + 300, wy + 80, 70, '#FFF1C8', .6);
    paint(ellPts(wx + 300, wy + 80, 28, 28, 16), { wash: PAL.cream, ink: null });
    for (let i = 0; i < 8; i++) {
      const bx = wx + i * ww / 8, bh = 70 + 130 * hash(i + 21);
      paint(rectPts(bx, wy + wh - bh, ww / 8 + 5, bh), { wash: mixCol(PAL.night, PAL.ink, .2 + .3 * hash(i)), ink: null });
      if (hash(i * 5) > .35) paint(rectPts(bx + 12, wy + wh - bh + 20, 7, 9), { wash: PAL.ochre, ink: null });
    }
    inkLine([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 3, mixCol(PAL.cream, wall, .2), 'ink', 0);
    inkLine([[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], 3, mixCol(PAL.cream, wall, .2), 'ink', 0);
    // string lights
    boilSeed('lights');
    const sag = x => 60 + 50 * Math.sin((x + 100) / (W + 200) * Math.PI);
    inkLine([[-100, sag(-100)], [480, sag(480)], [960, sag(960)]], .8, PAL.ink, 'inkfine', .6);
    inkLine([[960, sag(960)], [1440, sag(1440)], [2020, sag(2020)]], .8, PAL.ink, 'inkfine', .6);
    for (let i = 0; i < 14; i++) {
      const x = -40 + i * 150, y = sag(x) + 14, tw = .75 + .25 * Math.sin(t * 3 + i * 1.7);
      glow(x, y, 60, '#FFD27A', .45 * tw);
      paint(ellPts(x, y, 9, 12, 10), { wash: mixCol(PAL.ochre, PAL.cream, .5), ink: PAL.ink, sw: .6 });
    }
  }
  function chair(x, y) {
    boilSeed('chair' + x);
    paint(rrPts(x - 90, y - 330, 180, 340, 36, 1), { wash: mixCol(PAL.clayDk, PAL.ink, .25), ink: PAL.ink, sw: 1.2 });
    paint(rrPts(x - 68, y - 305, 136, 190, 26), { wash: mixCol(PAL.rose, PAL.clayDk, .45), ink: null });
  }
  function glass(fill) {
    return (u, sw) => {
      push(); translate(0, -.4 * u);
      inkLine([[0, 0], [0, -1.3 * u]], sw * .8, PAL.ink, 'ink', 0);
      paint(ellPts(0, -2.1 * u, .7 * u, .85 * u, 14), { wash: mixCol(PAL.cream, PAL.sky, .2), washOp: 200, ink: PAL.ink, sw: sw * .7 });
      paint(ellPts(0, -1.85 * u, .55 * u, .5 * u, 12), { wash: fill, ink: null });
      pop();
    };
  }
  function tableTop(t, x, y) {
    boilSeed('table');
    paint(ellPts(x, y + 220, 240, 24, 20), { fill: PAL.ink, fillOp: 70, bleed: .2, ink: null });
    inkLine([[x, y + 90], [x, y + 215]], 5, PAL.ink, 'ink', 0);
    paint([[x - 290, y], [x + 290, y], [x + 300, y + 110], [x + 170, y + 124], [x, y + 116], [x - 170, y + 124], [x - 300, y + 110]], { wash: PAL.cream, ink: PAL.ink, sw: 1.2 });
    paint(ellPts(x, y, 290, 36, 28), { wash: mixCol(PAL.cream, PAL.ochre, .12), ink: PAL.ink, sw: 1.2 });
    boilSeed('plates');
    for (const d of [-1, 1]) {
      paint(ellPts(x + d * 150, y + 4, 62, 13, 18), { wash: '#FFFDF6', ink: PAL.ink, sw: .9 });
      paint(ellPts(x + d * 150, y + 4, 40, 8, 14), { wash: mixCol(PAL.cream, PAL.sky, .15), ink: null });
    }
    boilSeed('candleD');
    const fl = 1 + .08 * Math.sin(t * 17) + .05 * Math.sin(t * 29);
    glow(x + 110, y - 40, 200 * fl, '#FFC766', .4);
    paint(rrPts(x + 98, y - 42, 24, 44, 6), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
    paint([[x + 110, y - 82 * fl], [x + 121, y - 56], [x + 110, y - 46], [x + 99, y - 56]], { wash: PAL.ochre, ink: PAL.ink, sw: .8, curv: .6 });
  }

  function shotDinner(t, lt, dur) {
    const TX = 1000, TY = 780;
    const PH = [985, TY + 26];
    const toPhone = ease(seg(lt, 4.0, 5.0));
    camBegin(lerp(1000 + 8 * Math.sin(lt * .5), 1000, toPhone), lerp(640, 700, toPhone), lerp(1.35 + .02 * lt, 1.65, toPhone));
    restaurant(t);
    chair(820, 820); chair(1180, 820);

    const clink = seg(lt, 1.5, 2.0), back = seg(lt, 2.6, 3.1);
    const reach = ease(clink) * (1 - ease(back));
    const samF = hmood(lt, [
      [0, { eyes: 'open', mouth: 'smile', lookX: 1, blush: .4 }],
      [2.05, { eyes: 'happy', mouth: 'grin', blush: .6 }],
      [3.4, { eyes: 'open', mouth: 'smile', lookX: 1, blush: .5 }],
    ]);
    const parF = hmood(lt, [
      [0, { eyes: 'open', mouth: 'smile', lookX: 1, blush: .6, seed: 7 }],
      [2.1, { eyes: 'happy', mouth: 'grin', blush: .8, seed: 7 }],
      [3.5, { eyes: 'open', mouth: 'smile', lookX: 1, blush: .7, seed: 7 }],
    ]);
    const u = 26, br = s => .06 * Math.sin(t * 2.2 + s);
    // hands: resting on the table → meet over the table to clink
    const sHand = [lerp(3.4, (TX - 14 - 840) / u, reach), lerp(-2.2, (610 - 830) / u, reach)];
    const pHand = [lerp(3.4, (1160 - (TX + 14)) / u, reach), lerp(-2.2, (610 - 830) / u, reach)];
    human(840, 830, u, { pal: SAM, view: 'q', hair: 'short', boilKey: 'samD', ...samF, dy: br(0), lean: .03 + .1 * reach, tilt: .05 * Math.sin(t * 1.3), handN: sHand, holdN: glass(mixCol(PAL.rose, PAL.clayDk, .4)), handF: [2.2, -2.3] });
    human(1160, 830, u, { pal: PARTNER, view: 'q', flip: true, hair: 'bun', boilKey: 'parD', ...parF, dy: br(1.3), lean: .03 + .1 * reach, tilt: .06 * Math.sin(t * 1.1 + 1), handN: pHand, holdN: glass(mixCol(PAL.rose, PAL.clayDk, .4)), handF: [2.2, -2.3] });
    tableTop(t, TX, TY);

    // clink sparkle, then hearts rising between them
    if (lt > 2.0 && lt < 2.6) {
      boilSeed('clink');
      const a = lt - 2.0, k = 1 - seg(a, .1, .6);
      for (let i = 0; i < 6; i++) {
        const ang = -Math.PI / 2 + (i - 2.5) * .45, r1 = 50 + 40 * easeOut(seg(a, 0, .3)), r2 = r1 + 30;
        inkLine([[TX + Math.cos(ang) * r1, 540 + Math.sin(ang) * r1], [TX + Math.cos(ang) * r2, 540 + Math.sin(ang) * r2]], 3 * k, PAL.cream, 'ink', 0);
      }
    }
    if (lt > 2.3) {
      boilSeed('heartsD');
      for (let i = 0; i < 3; i++) {
        const ph = frac((lt - 2.3) * .45 + i / 3), a = Math.sin(ph * Math.PI); if (a < .1) continue;
        paint(heartPts(TX + Math.sin(ph * 6 + i) * 30, 520 - ph * 220, 16 + 10 * a), { wash: '#E2476E', washOp: 230 * a, ink: PAL.ink, sw: .8 });
      }
    }

    // the phone on the table, and Jolly peeking out of it
    boilSeed('phoneD');
    paint(rrPts(PH[0] - 42, PH[1] - 12, 84, 26, 7), { wash: PHONE, ink: PAL.ink, sw: .9 });
    const jk = seg(lt, 4.4, 4.8);
    glow(PH[0], PH[1] - 6, 60 + 60 * jk, '#D8F5A8', .5);
    if (jk <= 0) checkMark(PH[0], PH[1] + 1, 9, 2.4, PAL.sap);
    let eye = toScreen(PH[0], PH[1] - 60);
    if (jk > 0) {
      const jm = emotions(lt, [
        [4.4, 'excited', { lookX: -.3 }],
        [5.3, 'love'],
        [6.4, 'happy'],
      ]);
      const wave = lt > 6.4 ? move('wave', lt) : {};
      const ju = 15 * backOut(jk), jy = PH[1] - 4 - 10 * (1 - jk);
      jolly(PH[0], jy, ju, { ...jm, ...wave, view: 'front', noShadow: true, dy: (jm.dy || 0) + (wave.dy || 0), boilKey: 'jD' });
      eye = toScreen(PH[0], jy - 5 * 15);
    }
    camEnd();
    confetti(lt, -1.0, 26, 'confD');
    boilSeed('trD');
    if (lt < .3) brushWipe(.5 + lt / .6, PARTY);
    if (lt > dur - 1.5) iris(...eye, lerp(1300, 0, ease(seg(lt, dur - 1.5, dur - .15))));
  }

  shots([
    [0, shotAsk],
    [7, shotSearch],
    [14, shotPermit],
    [21, shotDinner],
  ]);
})();
