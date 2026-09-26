// sheets.js: model sheets of the motion-graphics kit, as standalone loops (the one place labels are fine). Scrub them at
// studio.html?scene=kit&loop=kit_motion (kit_type, kit_ui, kit_shapes, kit_fx, kit_transitions, kit_brand), or render:
//   node render.mjs --scene=kit --loop=kit_ui --sheet=1.5 --cols=1 --w=1920 --out=docs/kit/ui.jpg
(() => {
  const label = (key, s, x, y, o = {}) => D.text(key, s, { x, y, ...UI.txt(o.size || 18, 500, THEME.muted), style: { whiteSpace: 'nowrap', letterSpacing: '.02em', textTransform: 'uppercase' } });
  const bg = () => D.div('bg', { w: W, h: H, bg: THEME.bg });
  const cyc = (t, len) => t % len;   // restart a demo every len seconds

  // presets as moving chips and their easing curves
  LOOPS.kit_motion = t => {
    bg(); label('title', 'Motion presets (measured) · no overshoot', 80, 60, { size: 22 });
    const rows = ['default', 'card', 'panel', 'text', 'camera', 'exit', 'playful'];
    rows.forEach((name, i) => {
      const y = 150 + i * 118, p = MOTION[name], k = anim(cyc(t, 2), .3, name);
      label('l' + i, `${name}  ${p.dur}s  ${p.ease}`, 80, y + 18);
      D.svg('c' + i, { x: 420, y, w: 160, h: 80, attrs: { viewBox: '0 0 160 80' } }, () => {
        let d = 'M0 80'; for (let s = 1; s <= 40; s++) d += ` L${s * 4} ${80 - 80 * EASE[p.ease](s / 40)}`;
        D.path({ attrs: { d, fill: 'none', stroke: name === 'playful' ? THEME.faint : THEME.accent, 'stroke-width': 3 } });
      });
      D.div('track' + i, { x: 640, y: y + 38, w: 1180, h: 4, radius: 2, bg: THEME.line });
      UI.chip('chip' + i, name, { x: 640 + 1040 * k, y: y + 20 }, { tone: name === 'playful' ? 'neutral' : 'accent' });
    });
    label('stag', `stagger ${Math.round(MOTION.stagger * 24)} frames · hold ${MOTION.hold}s`, 80, 1000);
    for (let i = 0; i < 8; i++) D.div('sq' + i, { x: 640 + i * 70, y: 985, w: 50, h: 50, radius: 12, bg: THEME.accent, ...enter(anim(cyc(t, 2), .3 + i * MOTION.stagger, 'card'), 'rise', 30) });
  };
  LOOPS.kit_motion.len = 4;

  LOOPS.kit_type = t => {
    bg(); const c = cyc(t, 4);
    label('a', 'Type.words · accent · mark', 120, 90); Type.words('w', 'Notes that write themselves.', c, .2, { x: 120, y: 130 }, { accent: [3], mark: { i: 1, t0: 1.4 } });
    label('b', 'Type.line · how: rise / mask / blur', 120, 320);
    ['rise', 'mask', 'blur'].forEach((h, i) => Type.line('l' + i, h, c, .2 + i * .3, { x: 120 + i * 360, y: 360 }, { how: h, size: 'title' }));
    label('c', 'Type.swap', 120, 520); Type.swap('s', [[0, 'Search.'], [1.3, 'Automate.'], [2.6, 'Ship.']], c, { x: 120, y: 560 }, { size: 'headline' });
    label('d', 'Type.counter', 1000, 520); Type.counter('n', 0, 12480, c, .3, 1.4, { x: 1000, y: 560 }, { size: 'headline', weight: 600 });
    label('e', 'Type.typed in UI.input', 120, 760);
    const tp = Type.typed('Draft a reply to Maya', c, .4, 16);
    UI.input('in', { text: tp.text, caret: !tp.done || frac(c * 1.8) < .55, focus: 1, placeholder: 'Ask anything…', hint: '⌘K', submit: true, submitOn: tp.done ? 1 : 0 }, { x: 120, y: 800, w: 900 });
    label('f', 'sizes: hero 96 · headline 64 · title 40 · body 26 · small 20 (px at 1080)', 120, 1000);
  };
  LOOPS.kit_type.len = 4;

  LOOPS.kit_ui = t => {
    bg(); const c = cyc(t, 4);
    UI.window('win', { x: 80, y: 80, w: 1000, h: 620 }, () => D.group(() => {
      ['Weekly standup', 'Design review', 'Pricing sync', 'Planning'].forEach((s, i) =>
        UI.row(null, { title: s, sub: ['Today · 9:30', 'Yesterday', 'Mon', 'Last week'][i], meta: ['9:30', '14:00', '11:00', ''][i], avatar: { name: s, color: ['#E27A92', '#4F46E5', '#3A9C98', '#E8AA38'][i] }, dot: i === 0 },
          { x: 0, y: i * 80, w: 1000, pos: 'abs', ...enter(anim(c, .2 + i * MOTION.stagger, 'card'), 'rise', 14) }));
      UI.input('in', { placeholder: 'Ask Plume…', focus: seg(c, 1.4, 1.7), caret: c > 1.6 && frac(c * 1.8) < .55, hint: '⌘K' }, { x: 30, y: 380, w: 940, pos: 'abs' });
    }), { title: 'UI.window' });
    Cursor.draw('cur', c, [{ t: .8, x: 900, y: 760 }, { t: 1.5, x: 300, y: 540, click: true }, { t: 2.6, x: 1300, y: 300, click: true }, { t: 3.5, x: 1500, y: 700, hide: true }]);
    label('a', 'UI.button · chip · avatar · check', 1180, 90);
    UI.button('b1', 'Try it free', { x: 1180, y: 130 }, { primary: true, press: Math.sin(Math.PI * seg(c, 2.55, 2.75)) });
    UI.button('b2', 'Learn more', { x: 1420, y: 130 });
    UI.chip('c1', 'Sent to #team', { x: 1180, y: 230 }, { tone: 'success', icon: 'check' }); UI.chip('c2', 'Draft', { x: 1440, y: 230 }, { tone: 'neutral' });
    [0, 1, 2].forEach(i => UI.check('k' + i, anim(c, 1 + i * .5, 'card'), { x: 1180 + i * 60, y: 320, pos: 'abs' }));
    UI.avatar('av', 'Maya', { x: 1400, y: 312 }, { color: '#E27A92', size: 48 });
    label('bb', 'UI.bars · progress', 1180, 420); UI.bars('bars', [3, 4, 4, 6, 7, 9], c, .3, { x: 1180, y: 460 }, { h: 180 });
    UI.progress('pr', seg(c, .5, 3.5), { x: 1180, y: 690, w: 560 });
    label('ic', 'UI.icon', 1180, 760); ['sparkle', 'search', 'check', 'send', 'plus', 'bell', 'calendar', 'arrow', 'doc', 'bolt'].forEach((n, i) => UI.icon(n, 30, THEME.text, { x: 1180 + i * 56, y: 800, pos: 'abs' }));
    label('cc', 'Cursor.draw: arcs, click, ripple', 80, 760);
  };
  LOOPS.kit_ui.len = 4;

  LOOPS.kit_shapes = t => {
    bg(); const c = cyc(t, 4);
    Shape.layer('svg', () => {
      Shape.stroke('s1', 'M140 300 C 260 120, 420 480, 560 260 S 780 160, 820 320', anim(c, .2, { dur: 1.2, ease: 'inOut' }), { color: THEME.accent, width: 6 });
      const sq = 'M1000 180 L1200 180 L1200 380 L1000 380 Z', ci = 'M1100 180 L1200 280 L1100 380 L1000 280 Z';
      Shape.stroke('m', Shape.lerpPath(sq, ci, EASE.inOut(seg(c, 1, 1.6)) * (1 - EASE.inOut(seg(c, 2.6, 3.2)))), 1, { color: THEME.text, width: 5, fill: alpha(THEME.accent, .15) });
      Shape.dial('d', 1560, 300, 120, anim(c, .5, { dur: 1.6, ease: 'inOut' }) * .78, { ticks: 11 });
      const hub = [480, 760], sp = Shape.orbit(6, hub[0], hub[1], 300, 190, c);
      sp.forEach((p, i) => Shape.connector('c' + i, hub, [p[0], p[1]], anim(c, .4 + i * MOTION.stagger, { dur: .7, ease: 'inOut' }), { dot: true, color: alpha(THEME.accent, .5) }));
      Shape.ring('r', 1480, 780, 150, anim(c, .3, { dur: 1.4, ease: 'inOut' }), { color: THEME.accent, width: 8 });
    });
    const sp = Shape.orbit(6, 480, 760, 300, 190, c);
    sp.forEach((p, i) => D.div('n' + i, { x: p[0], y: p[1], w: 64, h: 64, ax: .5, ay: .5, radius: 18, bg: THEME.surface, shadow: THEME.shadow, ...enter(anim(c, .6 + i * MOTION.stagger, 'card'), 'scale'),
      style: { display: 'grid', placeItems: 'center' } }, () => UI.icon(['doc', 'bell', 'calendar', 'search', 'send', 'bolt'][i], 28, THEME.accent)));
    D.div('hub', { x: 480, y: 760, w: 96, h: 96, ax: .5, ay: .5, radius: 28, bg: THEME.accent, style: { display: 'grid', placeItems: 'center' } }, () => UI.icon('sparkle', 44, THEME.onAccent));
    [['Shape.stroke', 140, 90], ['Shape.lerpPath', 1000, 90], ['Shape.dial', 1440, 90], ['Shape.orbit + connector', 180, 520], ['Shape.ring', 1400, 560]].forEach(([s, x, y], i) => label('lb' + i, s, x, y));
  };
  LOOPS.kit_shapes.len = 4;

  LOOPS.kit_fx = t => {
    FX.gradient('g', t, {});
    D.canvas();
    const pts = FX.sample.text('Relay', W / 2, H / 2, 300, 800, 7);
    FX.particles(t, { n: Math.min(pts.length, 2600), targets: pts, form: [.4, 2], burst: [3.2, 4], size: 3.4, color: [THEME.accent, THEME.text] });
    FX.glow('gl', W * .82, H * .25, 260);
    FX.vignette('v');
    FX.grain('gr', t, { opacity: .09 });
    label('a', 'FX.gradient · FX.particles (text targets) · glow · vignette · grain', 80, 60);
  };
  LOOPS.kit_fx.len = 4.5;

  // the four covers, one after another, each across a seam at its midpoint
  LOOPS.kit_transitions = t => {
    const names = ['dip', 'wipe', 'iris', 'grid'], i = Math.floor(t / 2) % 4, p = (t % 2) / 2;
    const side = p < .5 ? 0 : 1;
    D.div('bg', { w: W, h: H, bg: side ? THEME.surface2 : THEME.bg });
    Type.line('s', side ? 'shot B' : 'shot A', 1, 0, { x: W / 2, y: H / 2, ax: .5, ay: .5 }, { size: 'hero', weight: 600, color: side ? THEME.accent : THEME.text });
    label('n', `Tx.${names[i]}  p = ${p.toFixed(2)}  (cut at .5)`, 80, 60, { size: 22 });
    if (i === 0) Tx.dip(p, THEME.text); if (i === 1) Tx.wipe(p); if (i === 2) Tx.iris(p, W * .5, H * .5); if (i === 3) Tx.grid(p);
  };
  LOOPS.kit_transitions.len = 8;

  LOOPS.kit_brand = t => { Brand.endCard(t, 0, LOOPS.kit_brand.len, { fade: .5 }); label('a', 'Brand.endCard (lockup · tagline · cta)', 80, 60); };
  LOOPS.kit_brand.len = 4.5;
})();
