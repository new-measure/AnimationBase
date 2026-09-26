// relay_demo.js: "Relay", a 20.5-second brand-and-type launch film for a made-up product, built from the kit's shapes,
// fx, camera, transitions and brand libs (docs/motion_design_spec.md). It's one idea, not a template.
//   0–4.5 s    the mark, with particles gathering into a ring around it; "Every tool. One inbox."   → zoom through
//   4.5–16     the hub: tools orbit in and connect to the mark; the count rolls up; then the camera lifts it and
//              each word lights the tool it names: Search. Automate. Ship.                            → grid cover
//   16–20.5    the end card, held
(() => {
  const cx = W / 2, cy = H * .46, TOOLS = ['doc', 'bell', 'calendar', 'search', 'send', 'bolt'];
  const ring = FX.sample.ring(520, cx, cy, px(250));
  // sound, declared once: the bed, a whoosh into the zoom-through, pops as tools arrive, ticks as words land, a chime
  Sound.music('assets/music/soft_pad_110.m4a', { gain: -12 });
  Sound.sfx(4.15, 'whoosh', { gain: -10 });
  for (let i = 0; i < 6; i++) Sound.sfx(4.5 + .35 + i * MOTION.stagger, 'pop', { gain: -18 });
  for (const w0 of [5.0, 6.9, 8.8]) Sound.sfx(4.5 + w0 + MOTION.exit.dur, 'tick', { gain: -12 });
  Sound.sfx(15.75, 'whoosh', { gain: -14 }); Sound.sfx(16.3, 'chime', { gain: -10 });

  shots([
    [0, (t, lt, dur) => {
      const z = lt > dur - .35 ? Tx.zoom(seg(lt, dur - .35, dur)) : {};
      FX.gradient('bg', t);
      D.canvas();
      // the ring fades as the camera flies into the mark (the canvas isn't inside the zoomed group)
      FX.particles(t, { n: 520, targets: ring, form: [.2, 2.2], size: 4.4, color: [THEME.accent, alpha(THEME.accent, .6)], opacity: 1 - seg(lt, dur - .35, dur - .1) });
      D.group('s1', z, () => Cam.shot(lt, [[0, cx, cy, 1]], () => {
        Brand.mark('mark', px(150), { x: cx, y: cy, ax: .5, ay: .5, ...enter(anim(lt, .3, 'card'), 'scale') });
        Type.words('line', 'Every tool. One inbox.', lt, 1.5, { x: cx, y: cy + px(330), ax: .5, ay: .5 }, { align: 'center', accent: [2, 3] });
      }, { drift: .01 }));
      FX.grain('grain', t, { opacity: .06 });
    }],
    // one continuous shot: the hub assembles, then the camera lifts it and each word lights the tool it names (the
    // words act on the picture instead of floating alone: revised after the Phase 5 evaluation, docs/eval.md)
    [4.5, (t, lt, dur) => {
      const land = Tx.zoom(1 - seg(lt, 0, .45), -1), WORDS = [[5.0, 'Search.', 3], [6.9, 'Automate.', 5], [8.8, 'Ship.', 4]];
      // a tool lights as its word ARRIVES (Type.swap brings the new word in after the old one's exit), never while the last word is still on
      const ex = MOTION.exit.dur; let lit = -1, litK = 0;
      for (const [w0, , i] of WORDS) if (lt >= w0 + ex) { lit = i; litK = anim(lt, w0 + ex, 'card'); }
      FX.gradient('bg', t);
      D.group('s2', land, () => Cam.shot(lt, [[0, cx, cy, 1], [3.2, cx, cy + px(20), 1.08], [5.0, cx, cy + px(170), .92]], () => {
        // the ring drifts slowly, then turns as each word arrives so the tool it names swings to the bottom, between the
        // hub and the word: hub → tool → word reads as one line
        const n = TOOLS.length, drift = .02;
        let phase = drift * Math.min(lt, WORDS[0][0] + ex);
        for (const [w0, , i] of WORDS) {
          let target = .5 - i / n; while (target - phase > .5) target -= 1; while (phase - target > .5) target += 1;
          phase = lerp(phase, target, anim(lt, w0 + ex, 'camera'));
        }
        const sp = Shape.orbit(n, cx, cy, px(420), px(250), 0, { phase, speed: 0 });
        Shape.layer('lines', () => sp.forEach((p, i) => Shape.connector('c' + i, [cx, cy], [p[0], p[1]], anim(lt, .9 + i * MOTION.stagger, { dur: .6, ease: 'inOut' }),
          { color: i === lit ? alpha(THEME.accent, .45 + .5 * litK) : alpha(THEME.accent, lit >= 0 ? .2 : .45), width: px(i === lit ? 2.5 + 2 * litK : 2.5), dot: true })));
        // data flowing to the lit tool: a pulse leaves the hub on every beat and travels the connector (closed form in t)
        if (lit >= 0) Shape.layer('flow', () => {
          const [tx, ty] = sp[lit], mx = (cx + tx) / 2, my = (cy + ty) / 2, dx = tx - cx, dy = ty - cy, qx = mx - dy * .15, qy = my + dx * .15;
          for (let j = 0; j < 3; j++) {
            const u = frac(bpOf(t) + j / 3); if (u > .92) continue;
            const e = EASE.inOut(u), x = (1 - e) ** 2 * cx + 2 * (1 - e) * e * qx + e * e * tx, y = (1 - e) ** 2 * cy + 2 * (1 - e) * e * qy + e * e * ty;
            D.circle('p' + j, { attrs: { cx: x, cy: y, r: px(7), fill: THEME.accent, opacity: litK * Math.sin(Math.PI * u) } });
          }
        });
        sp.forEach((p, i) => D.div('tool' + i, { x: p[0], y: p[1], w: px(92), h: px(92), ax: .5, ay: .5, radius: px(26),
          bg: i === lit ? THEME.accent : THEME.surface, shadow: THEME.shadow, ...enter(anim(lt, .35 + i * MOTION.stagger, 'card'), 'scale'),
          scale: i === lit ? 1 + .1 * litK : lit >= 0 ? .94 : 1, opacity: lit >= 0 && i !== lit ? .55 : 1,
          style: { display: 'grid', placeItems: 'center', border: `1px solid ${THEME.line}` } },
          () => UI.icon(TOOLS[i], 40, i === lit ? THEME.onAccent : THEME.accent)));
        Brand.mark('hub', px(128), { x: cx, y: cy, ax: .5, ay: .5 });
        const kc = life(lt, 1.8, 4.4, 'text', 'exit');
        if (kc > 0) D.div('count', { x: cx, y: cy + px(360), ax: .5, ay: .5, style: { display: 'flex', alignItems: 'baseline', gap: px(14) }, ...enter(kc, 'rise', 16) }, () => {
          Type.counter('n', 0, 128, lt, 1.8, 1.2, {}, { size: 'headline', weight: 600 });
          D.text('tools connected', UI.txt(40, 400, THEME.muted));
        });
        // each word: 0.35 s out, 0.65 s in, then ≥ 0.9 s fully readable before the next (and before the grid cover)
        Type.swap('what', WORDS.map(([w0, w]) => [w0, w]), lt, { x: cx, y: cy + px(430), ax: .5, ay: .5 },
          { size: 130, weight: 600, color: THEME.text, style: { transform: 'translate(-50%, -50%)' } });
      }));
      FX.grain('grain', t, { opacity: .06 });
      if (lt > dur - .3) Tx.grid((lt - (dur - .3)) / .6);
    }],
    [16, (t, lt, dur) => {
      Brand.endCard(t, 16, dur, {});
      if (lt < .3) Tx.grid(.5 + lt / .6);
    }],
  ]);
})();
