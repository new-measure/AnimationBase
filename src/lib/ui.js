// ui.js: product-UI building blocks for launch films, on the DOM layer and themed by THEME (lib/theme.js). They draw
// state, not motion: pass in what changes (typed text, focus, a check's progress), computed from t with lib/motion.js,
// and animate their entrances with enter()/anim() from the scene. Sizes are px at 1080 on the short side (px()).
//   UI.icon(name, size, color)                       sparkle, search, check, send, plus, bell, calendar, arrow, doc, bolt
//   UI.window(key, props, kids, o)                   app window: o.chrome 'mac' (default) | 'browser' (o.url) | 'none'
//   UI.card(key, props, kids)                        a surface with the theme's radius and shadow
//   UI.input(key, o, props)                          prompt / command bar: o.text, o.placeholder, o.focus 0..1, o.caret,
//                                                    o.icon, o.hint (e.g. '⌘K'), o.flash 0..1 (on submit)
//   UI.button(key, label, props, o)                  o.primary, o.press 0..1
//   UI.chip(key, label, props, o)                    o.tone 'accent' | 'neutral' | 'success', o.icon
//   UI.avatar(key, name, props, o)                   o.color, o.size
//   UI.row(key, o, props)                            list row: o.title, o.sub, o.meta, o.avatar ({ name, color }), o.dot
//   UI.check(key, k, props)                          checkbox filling as k goes 0 → 1
//   UI.bars(key, values, t, t0, props, o)            bar chart growing bar by bar
//   UI.progress(key, k, props)                       a progress bar
const UI = (() => {
  const P = {
    sparkle: 'M12 2.5 L14 9.8 L21.5 12 L14 14.2 L12 21.5 L10 14.2 L2.5 12 L10 9.8 Z',
    search: 'M10.5 4 a6.5 6.5 0 1 0 0.01 0 M15.3 15.3 L20 20',
    check: 'M4.5 12.5 L9.5 17.5 L19.5 6.5',
    send: 'M4 12 L20 4 L14 20 L11 13 Z',
    plus: 'M12 5 V19 M5 12 H19',
    bell: 'M6 16 V11 a6 6 0 0 1 12 0 V16 L19.5 18 H4.5 Z M10 20.5 a2 2 0 0 0 4 0',
    calendar: 'M4.5 6.5 H19.5 V19.5 H4.5 Z M4.5 10.5 H19.5 M8.5 4 V8 M15.5 4 V8',
    arrow: 'M5 12 H19 M13 6 L19 12 L13 18',
    doc: 'M6.5 3.5 H14 L18.5 8 V20.5 H6.5 Z M14 3.5 V8 H18.5 M9.5 12.5 H15.5 M9.5 16 H15.5',
    bolt: 'M13 2.5 L5 13.5 H11.5 L10.5 21.5 L18.5 10.5 H12 Z',
  };
  const FILLED = new Set(['sparkle', 'send', 'bolt']);
  function icon(name, size = 22, color = THEME.text, props = {}) {
    D.svg({ w: px(size), h: px(size), attrs: { viewBox: '0 0 24 24' }, style: { flexShrink: 0 }, ...props }, () =>
      D.path({ attrs: FILLED.has(name) ? { d: P[name], fill: color } : { d: P[name], fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } }));
  }
  const txt = (size, weight = THEME.weight.body, color = THEME.text) => ({ font: `${weight} ${px(size)}px ${THEME.font}`, color });

  function window(key, props, kids, o = {}) {
    D.div(key, { radius: px(THEME.radius.md), bg: THEME.surface, shadow: THEME.shadow, ...props,
      style: { overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${THEME.line}`, ...(props.style || {}) } }, () => {
      if (o.chrome !== 'none') D.div({ h: px(52), style: { display: 'flex', alignItems: 'center', gap: px(9), padding: `0 ${px(20)}px`, flexShrink: 0, borderBottom: `1px solid ${THEME.line}`, background: THEME.surface2 } }, () => {
        for (const c of ['#FF5F57', '#FEBC2E', '#28C840']) D.div({ w: px(13), h: px(13), radius: '50%', bg: c, style: { flexShrink: 0 } });
        if (o.chrome === 'browser') D.div({ style: { flex: 1, display: 'flex', justifyContent: 'center' } }, () =>
          D.text(o.url || '', { ...txt(16, 500, THEME.muted), style: { padding: `${px(6)}px ${px(18)}px`, borderRadius: 999, background: THEME.bg, minWidth: px(320), textAlign: 'center' } }));
        else if (o.title) D.text(o.title, { ...txt(17, 500, THEME.muted), style: { flex: 1, textAlign: 'center', marginRight: px(60) } });
      });
      D.div({ style: { flex: 1, minHeight: 0, display: 'flex', position: 'relative' } }, kids);
    });
  }
  const card = (key, props, kids) => D.div(key, { radius: px(THEME.radius.md), bg: THEME.surface, shadow: THEME.shadow, ...props,
    style: { border: `1px solid ${THEME.line}`, ...(props.style || {}) } }, kids);

  function input(key, o = {}, props = {}) {
    const f = o.focus ?? 0, fl = o.flash ?? 0;
    D.div(key, { h: px(o.h || 68), radius: px(THEME.radius.md * .6), bg: THEME.dark ? THEME.surface2 : THEME.surface, ...props,
      shadow: `0 0 0 1px ${alpha(THEME.accent, .15 + .55 * f)}, 0 0 0 ${px(6) * f}px ${alpha(THEME.accent, .12 * f + .2 * fl)}${THEME.dark ? '' : ', 0 8px 24px rgba(24,24,48,.06)'}`,
      style: { display: 'flex', alignItems: 'center', gap: px(14), padding: `0 ${px(22)}px`, flexShrink: 0, ...(props.style || {}) } }, () => {
      if (o.icon !== null) icon(o.icon || 'sparkle', 22, THEME.accent);
      D.div({ style: { display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' } }, () => {
        if (o.text) D.text(o.text, { ...txt(o.size || 24, 400), style: { whiteSpace: 'pre' } });
        if (o.caret) D.div({ w: px(2.5), h: px(30), bg: THEME.accent, style: { marginLeft: px(2), flexShrink: 0 } });
        if (!o.text && o.placeholder) D.text(o.placeholder, { ...txt(o.size || 24, 400, THEME.faint), style: { whiteSpace: 'nowrap', marginLeft: o.caret ? px(6) : 0 } });
      });
      if (o.hint) D.text(o.hint, { ...txt(15, 500, THEME.muted), style: { padding: `${px(4)}px ${px(9)}px`, border: `1px solid ${THEME.line}`, borderRadius: px(8) } });
      if (o.submit) D.div({ w: px(42), h: px(42), radius: px(12), bg: THEME.accent, style: { display: 'grid', placeItems: 'center', flexShrink: 0, opacity: .35 + .65 * (o.submitOn ?? 1) } }, () => icon('arrow', 22, THEME.onAccent));
    });
  }
  function button(key, label, props = {}, o = {}) {
    const pr = o.press ?? 0;
    D.div(key, { ...props, scale: 1 - .04 * pr, radius: px(14), bg: o.primary ? THEME.accent : THEME.surface2, color: o.primary ? THEME.onAccent : THEME.text,
      font: `500 ${px(20)}px ${THEME.font}`, style: { padding: `${px(14)}px ${px(26)}px`, display: 'inline-flex', alignItems: 'center', gap: px(10), whiteSpace: 'nowrap', ...(props.style || {}) } }, () => {
      if (o.icon) icon(o.icon, 20, o.primary ? THEME.onAccent : THEME.text);
      D.text(label);
    });
  }
  function chip(key, label, props = {}, o = {}) {
    const tone = { accent: [alpha(THEME.accent, .12), THEME.accent], neutral: [THEME.surface2, THEME.muted], success: ['rgba(22,163,74,.12)', '#16A34A'] }[o.tone || 'accent'];
    D.div(key, { ...props, radius: 999, bg: tone[0], color: tone[1], font: `500 ${px(18)}px ${THEME.font}`,
      style: { padding: `${px(8)}px ${px(16)}px`, display: 'inline-flex', alignItems: 'center', gap: px(8), whiteSpace: 'nowrap', ...(props.style || {}) } }, () => {
      if (o.icon) icon(o.icon, 18, tone[1]);
      D.text(label);
    });
  }
  function avatar(key, name, props = {}, o = {}) {
    const s = px(o.size || 40);
    D.div(key, { w: s, h: s, radius: '50%', bg: o.color || THEME.accent, color: '#fff', font: `600 ${s * .42}px ${THEME.font}`, ...props,
      style: { display: 'grid', placeItems: 'center', flexShrink: 0, ...(props.style || {}) } }, () => D.text(name[0]));
  }
  function row(key, o = {}, props = {}) {
    D.div(key, { h: px(o.h || 76), ...props, style: { display: 'flex', alignItems: 'center', gap: px(16), padding: `0 ${px(18)}px`, flexShrink: 0,
      borderBottom: `1px solid ${THEME.line}`, ...(props.style || {}) } }, () => {
      if (o.dot !== undefined) D.div({ w: px(8), h: px(8), radius: '50%', bg: o.dot ? THEME.accent : 'transparent', style: { flexShrink: 0 } });
      if (o.avatar) avatar(null, o.avatar.name, {}, { color: o.avatar.color });
      D.div({ style: { display: 'flex', flexDirection: 'column', gap: px(4), flex: 1, minWidth: 0 } }, () => {
        D.text(o.title, { ...txt(20, 500), style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } });
        if (o.sub) D.text(o.sub, { ...txt(18, 400, THEME.muted), style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } });
      });
      if (o.meta) D.text(o.meta, { ...txt(16, 400, THEME.faint), style: { flexShrink: 0 } });
      if (o.right) o.right();
    });
  }
  function check(key, k, props = {}) {
    const s = px(props.size || 26);
    D.div(key, { w: s, h: s, radius: px(8), ...props, bg: k > 0 ? alpha(THEME.accent, clamp(k * 2)) : 'transparent',
      style: { border: `${px(2)}px solid ${k > .3 ? THEME.accent : THEME.faint}`, display: 'grid', placeItems: 'center', flexShrink: 0, ...(props.style || {}) } }, () =>
      D.svg({ w: s * .7, h: s * .7, attrs: { viewBox: '0 0 24 24' } }, () =>
        D.path({ attrs: { d: P.check, fill: 'none', stroke: THEME.onAccent, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 - clamp((k - .3) / .7) } })));
  }
  function bars(key, values, t, t0, props = {}, o = {}) {
    const h = px(o.h || 220), max = o.max || Math.max(...values);
    D.div(key, { h, ...props, style: { display: 'flex', alignItems: 'flex-end', gap: px(o.gap || 14), ...(props.style || {}) } }, () =>
      values.forEach((v, i) => {
        const k = anim(t, t0 + i * MOTION.stagger, 'panel');
        D.div({ w: px(o.bw || 36), h: Math.max(px(4), h * v / max * k), radius: px(8), bg: i === (o.hi ?? values.length - 1) ? THEME.accent : alpha(THEME.accent, .22) });
      }));
  }
  const progress = (key, k, props = {}) => D.div(key, { h: px(8), radius: 999, bg: THEME.surface2, ...props, style: { overflow: 'hidden', ...(props.style || {}) } }, () =>
    D.div({ w: `${clamp(k) * 100}%`, h: '100%', radius: 999, bg: THEME.accent }));

  return { icon, window, card, input, button, chip, avatar, row, check, bars, progress, txt };
})();
