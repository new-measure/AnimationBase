// launch_demo.js: "Plume", a 21.6-second launch film for a made-up meeting-notes app, built only from src/lib/ and
// following the measured spec (docs/motion_design_spec.md): light theme, one sans family, the product on screen from
// the first frame, the camera cropped to one component at a time, something new every 1–2 s, no overshoot, 4-frame
// staggers, holds after moves, sound on the same times as the visuals, and an end card held ~4 s. The layout is computed
// from W and H, so it renders square and vertical too. It's one idea, not a template.
// (Revised after the Phase 5 evaluation, docs/eval.md: the first cut showed the whole app small for 5 s before anything
// happened, at half the top tier's move density.)
//   0–3.2 s    the promise, word by word, over the app rising into place
//   3.2–10.8   the camera crops in on the prompt: click, type, submit; it moves to the answer, which writes on; the
//              cursor ticks the items; "Sent to #team"
//   10.8–13.6  hard cut: "Action items, handled."
//   13.6–17.4  the number: 3.5 hours saved a week, bars growing
//   17.4–21.6  end card
(() => {
  const portrait = H > W, narrow = W < 1500, M = THEME.margin * W;   // narrow: square or vertical, the headline wraps
  // window geometry (world coordinates; the camera looks at the whole frame until the push)
  const WW = Math.min(W - 2 * M, px(1400)), WH = Math.min(H * (portrait ? .5 : .6), px(700));
  const WX = W / 2 - WW / 2, WY = H / 2 - WH / 2 + px(portrait ? 120 : 70), BAR = px(52), PAD = px(28);
  const SIDE = narrow ? 0 : WW * .34;                                     // meetings list (hidden when narrow: it'd squeeze the answer)
  const PX = WX + SIDE + PAD, PW = WW - SIDE - 2 * PAD;                    // right pane
  const IN = { x: PX, y: WY + BAR + PAD, w: PW, h: px(68) };               // prompt bar
  const SUM = { x: PX, y: IN.y + IN.h + px(24), w: PW };                   // summary card
  const LINE = px(58), ITEMS_Y = SUM.y + px(78);                           // summary rows
  const ASK = 'Summarize today\'s standup';
  const ITEMS = ['Ship the onboarding redesign by Friday', 'Maya reviews the pricing page', 'Move the retro to Thursday'];
  const MEETINGS = [['Weekly standup', 'Today · 9:30', true], ['Design review', 'Yesterday', false], ['Pricing sync', 'Mon', false], ['1:1 with Leo', 'Mon', false], ['Planning', 'Last week', false]];
  const CLICK = 3.9, typedAt = 4.05, typed = t => Type.typed(ASK, t, typedAt, 17), SUBMIT = typed(99).end + .35;
  const checkAt = [SUBMIT + 2.0, SUBMIT + 2.55, SUBMIT + 3.1], SENT = SUBMIT + 3.55;
  const cursorKeys = [
    { t: 3.45, x: IN.x + IN.w * .55, y: IN.y + IN.h + px(120) },
    { t: CLICK, x: IN.x + px(120), y: IN.y + IN.h / 2, click: true },
    { t: SUBMIT, x: IN.x + IN.w - px(40), y: IN.y + IN.h / 2, click: true },
    ...checkAt.map((c, i) => ({ t: c, x: SUM.x + px(40), y: ITEMS_Y + i * LINE + px(13), click: true })),
    { t: SENT + .6, x: SUM.x + px(40), y: ITEMS_Y + 3 * LINE + px(40), hide: true },
  ];
  // the camera: the whole app, then cropped in on the prompt, then on the answer (Cam.at arrives on each key's time)
  // how much of the width the component fills once cropped in: more on narrow canvases (square, vertical), where a
  // width-only rule would leave the camera at ~1× and the component small in an empty frame
  const fillIn = narrow ? .94 : .72, fillSum = narrow ? .96 : .78;
  const zIn = clamp(fillIn * W / IN.w, 1, 2.4), zSum = clamp(Math.min(fillSum * W / SUM.w, .7 * H / px(400)), 1, 2.4);
  const CAM_KEYS = [[0, W / 2, H / 2, 1], [3.95, IN.x + IN.w / 2, IN.y + IN.h / 2 + px(60), zIn], [SUBMIT + .9, SUM.x + SUM.w / 2, SUM.y + px(190), zSum]];
  // sound, declared once: a music bed, the cursor's clicks, the typing, a pop as the answer lands, a chime at the end
  Sound.music('assets/music/soft_pad_110.m4a', { gain: -12 });
  Sound.clicks(cursorKeys, { gain: -9 });
  Sound.typing(ASK, typedAt, 17);
  Sound.sfx(SUBMIT + .25, 'pop', { gain: -12 }); Sound.sfx(SENT, 'pop', { gain: -13 });
  Sound.sfx(17.6, 'chime', { gain: -10 });

  const bg = () => D.div({ w: W, h: H, bg: THEME.bg });
  const glow = (x, y, r, a = 1) => D.div({ x, y, w: r * 2, h: r * 2, ax: .5, ay: .5, opacity: a, bg: `radial-gradient(closest-side, ${THEME.glow}, transparent)` });
  const mark = (key, s, props = {}) => D.div(key, { w: s, h: s, radius: s * .3, bg: THEME.accent, ...props, style: { display: 'grid', placeItems: 'center', flexShrink: 0, ...(props.style || {}) } }, () =>
    D.svg({ w: s * .56, h: s * .56, attrs: { viewBox: '0 0 24 24' } }, () =>
      D.path({ attrs: { d: 'M5 19 C9 18 17 12 19 4 C13 6 7 11 5 19 Z M5 19 L11 13', fill: 'none', stroke: THEME.onAccent, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } })));

  // The app: meetings list + prompt + summary. o carries the state computed from t.
  function app(t, o) {
    UI.window('app', { x: WX, y: WY, w: WW, h: WH, ...enter(o.in, 'rise', 40) }, () => D.group(() => {
      if (SIDE) {
        D.div({ x: 0, y: 0, w: SIDE, h: WH - BAR, style: { borderRight: `1px solid ${THEME.line}`, padding: `${PAD}px ${px(14)}px`, display: 'flex', flexDirection: 'column', gap: px(4) } }, () => {
          D.text('Meetings', { ...UI.txt(17, 500, THEME.muted), style: { padding: `0 ${px(14)}px ${px(10)}px` } });
          MEETINGS.forEach(([title, when, on], i) => UI.row(null, { title, sub: when, h: 64 }, { radius: px(12), bg: on ? alpha(THEME.accent, .08) : 'transparent', style: { borderBottom: 'none' },
            ...enter(anim(t, .5 + i * MOTION.stagger, 'card'), 'rise', 12) }));
        });
      }
      UI.input('ask', { text: o.text, placeholder: 'Ask Plume about any meeting…', focus: o.focus, caret: o.caret, flash: o.flash, submit: true, submitOn: o.text ? 1 : 0 },
        { x: IN.x - WX, y: IN.y - WY - BAR, w: IN.w, pos: 'abs' });
      if (o.sum > 0) UI.card('sum', { x: SUM.x - WX, y: SUM.y - WY - BAR, w: SUM.w, pos: 'abs', ...enter(o.sum, 'rise', 20),
        style: { padding: `${px(24)}px ${px(26)}px`, boxShadow: 'none', background: THEME.surface2 } }, () => {
        D.div({ style: { display: 'flex', alignItems: 'center', gap: px(10), height: px(30) } }, () => {
          UI.icon('sparkle', 20, THEME.accent); D.text('Action items', UI.txt(20, 500));
        });
        D.div({ style: { display: 'flex', flexDirection: 'column', marginTop: px(24) } }, () => ITEMS.forEach((it, i) => {
          const k = anim(t, o.linesAt + i * MOTION.stagger, 'text'), done = o.checks[i];
          D.div({ h: LINE, ...enter(k, 'rise', 14), style: { display: 'flex', alignItems: 'center', gap: px(14) } }, () => {
            UI.check(null, done, { size: 26 });
            D.text(it, { ...UI.txt(22, 400, done > .5 ? THEME.muted : THEME.text), style: { whiteSpace: 'nowrap', textDecoration: done > .6 ? 'line-through' : 'none', textDecorationColor: THEME.faint } });
          });
        }));
        if (o.sent > 0) UI.chip('sent', 'Sent to #team', { ...enter(o.sent, 'rise', 10), style: { marginTop: px(18) } }, { tone: 'success', icon: 'check' });
      });
    }), { title: 'Plume' });
  }

  shots([
    // intro + demo + feature: one continuous canvas, with a camera push in the middle
    [0, (t, lt) => {
      const focus = anim(t, CLICK, 'card'), tp = typed(t);
      bg();
      Cam.shot(t, CAM_KEYS, () => {   // Cam.shot adds a slow drift: the frame is never dead
        glow(W / 2, WY, WW * .6, .9);
        Type.words('promise', 'Meeting notes that write themselves.', t, .15,
          { x: W / 2, y: WY - px(narrow ? 150 : 104), ax: .5, ay: .5, w: narrow ? W - 2 * M : undefined },
          { align: 'center', accent: [3, 4], wrap: narrow, out: 2.95 });   // it leaves before the camera crops in, not cut off by it
        // the product is on screen within the first second
        app(t, { in: anim(t, .05, 'panel'), text: tp.text, focus, caret: focus > .5 && t < SUBMIT + .2 && (!tp.done || frac(t * 1.8) < .55),
          flash: Math.exp(-10 * Math.max(0, t - SUBMIT)) * (t > SUBMIT ? 1 : 0),
          sum: anim(t, SUBMIT + .25, 'card'), linesAt: SUBMIT + .45,
          checks: checkAt.map(c => anim(t, c + .02, 'card')), sent: anim(t, SENT, 'card') });
        Cursor.draw('cursor', t, cursorKeys);
      }, { drift: .006 });
    }],
    // the idea in words, full frame: a hard cut on content (cuts are the most common UI-film transition: 87%)
    [10.8, (t, lt, dur) => {
      bg(); glow(W / 2, H / 2, Math.max(W, H) * .45);
      Type.words('handled', 'Action items, handled.', lt, .15, { x: W / 2, y: H / 2, ax: .5, ay: .5, w: narrow ? W - 2 * M : undefined },
        { size: narrow ? 96 : 120, weight: 600, accent: [2], align: 'center', wrap: narrow });
    }],
    // proof: hard cut to the number
    [13.6, (t, lt, dur) => {
      bg(); glow(W / 2, H * .45, Math.max(W, H) * .45);
      const out = anim(lt, dur - .5, 'default');
      D.group({ opacity: 1 - out, scale: 1 - .02 * out }, () => {
        D.div({ x: W / 2, y: H * .4, ax: .5, ay: .5, style: { display: 'flex', alignItems: 'baseline', gap: px(18) } }, () => {
          Type.counter('n', 0, 3.5, lt, .15, 1.1, { ...enter(anim(lt, .1, 'text'), 'rise', 20) }, { size: 170, weight: 600, fmt: v => v.toFixed(1) });
          Type.line('unit', 'hours', lt, .2, {}, { size: 170, weight: 600, color: THEME.accent });
        });
        Type.words('saved', 'saved every week, per person.', lt, .9, { x: W / 2, y: H * .4 + px(150), ax: .5, ay: .5 }, { size: 'title', weight: 400, color: THEME.muted, align: 'center' });
        UI.bars('bars', [2, 3, 3, 4, 5, 6, 8], lt, 1.6, { x: W / 2, y: H * .4 + px(230), ax: .5, ay: 0 }, { h: 200, bw: 48, gap: 18, hi: 6 });
      });
    }],
    // end card: fades in over the last frame of the proof, held ~4 s, then out to the background
    [17.4, (t, lt, dur) => {
      bg(); glow(W / 2, H * .42, Math.max(W, H) * .4);
      const k = anim(lt, 0, 'panel'), out = anim(lt, dur - .6, 'default');
      D.group({ opacity: 1 - out }, () => {
        D.div({ x: W / 2, y: H * .42, ax: .5, ay: .5, style: { display: 'flex', alignItems: 'center', gap: px(22) } }, () => {
          mark('mark', px(88), enter(k, 'scale'));
          D.text('Plume', { font: `600 ${px(96)}px ${THEME.font}`, color: THEME.text, style: { letterSpacing: '-0.035em' }, ...enter(anim(lt, MOTION.stagger, 'text'), 'rise', 16) });
        });
        Type.line('tag', 'Meeting notes that write themselves.', lt, .6, { x: W / 2, y: H * .42 + px(110), ax: .5, ay: .5 }, { size: 'title', weight: 400, color: THEME.muted });
        UI.button('cta', 'Try Plume free', { x: W / 2, y: H * .42 + px(200), ax: .5, ay: .5, ...enter(anim(lt, 1.1, 'card'), 'rise', 14) }, { primary: true });
      });
    }],
  ]);
})();
