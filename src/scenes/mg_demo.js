// mg_demo.js: "Quillo", an 11-second launch film for a made-up AI email app, built on the DOM layer (src/dom.js). It
// exists to exercise the engine (kinetic type, a 2.5D product window, cursor and typing, a camera push, p5 particles
// layered between DOM layers, three transitions); it's one idea, not a template.
//   Shot A (0–3 s):   from black, "Email that reads itself." rises word by word; "Meet Quillo." pops; the logo mark
//                     springs in and the camera zooms through it.
//   Shot B (3–8 s):   the app window settles out of a tilt; the cursor clicks the command bar and types; the camera
//                     pushes into the summary card as its lines write on; "3 replies drafted". Whip pan out.
//   Shot C (8–11 s):  whip in to the end card: mark + wordmark tighten, tagline, "Available today" pill, over drifting
//                     p5 light. Fade to black.
(() => {
  const BG = '#0A0B14', INK = '#F5F5FA', MUTED = '#8B90A8', A1 = '#7C5CFF', A2 = '#38B6FF';
  const GRAD = `linear-gradient(135deg, ${A1}, ${A2})`, FONT = '"Inter", system-ui, sans-serif';
  const gradText = { backgroundImage: `linear-gradient(90deg, ${A1}, ${A2})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
  const inOut = x => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  // ---------- pieces ----------
  // The logo mark: a gradient tile with a white "Q". glyph = the Q's opacity (it fades while the camera zooms through).
  function mark(key, s, props = {}, glyph = 1) {
    D.div(key, { w: s, h: s, radius: s * .28, bg: GRAD, shadow: `0 ${s * .12}px ${s * .45}px rgba(124,92,255,${.35 + .2 * pulse(T, 4)})`,
      ...props, style: { display: 'grid', placeItems: 'center', ...(props.style || {}) } }, () => {
      D.svg({ w: s * .58, h: s * .58, opacity: glyph, attrs: { viewBox: '0 0 24 24' } }, () => {
        D.circle({ attrs: { cx: 11.5, cy: 11.5, r: 7.2, fill: 'none', stroke: '#fff', 'stroke-width': 2.8 } });
        D.path({ attrs: { d: 'M15.2 15.2 L20 20', stroke: '#fff', 'stroke-width': 2.8, 'stroke-linecap': 'round' } });
      });
    });
  }
  // A row of words that rise into place one after another from t0 (blur and fade in with the rise). more(i, k) gives
  // extra props for word i at rise progress k.
  function words(key, list, lt, t0, props, more = () => ({})) {
    D.div(key, { ax: .5, ay: .5, ...props, style: { display: 'flex', gap: '0.26em', whiteSpace: 'nowrap', ...(props.style || {}) } }, () => {
      list.forEach((w, i) => {
        const k = easeOut(seg(lt, t0 + i * .1, t0 + i * .1 + .45));
        D.text(w, { y: (1 - k) * 60, blur: (1 - k) * 14, opacity: k, ...more(i, k) });
      });
    });
  }
  const sparkle = (s, fill = 'url(#qg)') => D.svg({ w: s, h: s, attrs: { viewBox: '0 0 24 24' } }, () => {
    D.defs(() => D.linearGradient({ attrs: { id: 'qg', x1: 0, y1: 0, x2: 1, y2: 1 } }, () => {
      D.stop({ attrs: { offset: 0, 'stop-color': A1 } }); D.stop({ attrs: { offset: 1, 'stop-color': A2 } });
    }));
    D.path({ attrs: { d: 'M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z', fill } });
  });

  const MAIL = [
    ['Maya Chen', 'Q3 deck: need your sign-off by Friday', '9:41', '#E27A92', true],
    ['Billing', 'Invoice #2041 was paid', '9:12', A1, false],
    ['Design team', 'Review moved to Thursday, 2pm', '8:55', A2, true],
    ['Leo Park', 'Re: onboarding copy', '8:30', '#E8AA38', false],
    ['Ops', 'Weekly sync: updated agenda', '8:02', '#3A9C98', false],
    ['Ana Ruiz', 'Contract draft v3 attached', 'Yesterday', '#98B25E', true],
    ['Docs', '3 pages were edited', 'Yesterday', MUTED, false],
  ];
  const ASK = 'Summarize today and draft replies';
  const SUMMARY = ['Maya needs sign-off on the Q3 deck', 'Design review moved to Thursday, 2pm', 'Invoice #2041 is paid: nothing to do'];

  // The app window, centred on (960, 540) in world space. o: tilt, typed text, focus 0..1, caret on, enter flash 0..1.
  function appWindow(o) {
    D.div('win', { x: 960, y: 540, ax: .5, ay: .5, w: 1320, h: 780, radius: 18, bg: '#111325', rx: o.rx, ry: o.ry,
      shadow: '0 50px 140px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08)', font: `500 18px ${FONT}`, color: INK,
      style: { overflow: 'hidden', display: 'flex', flexDirection: 'column' } }, () => {
      // title bar
      D.div({ h: 44, bg: '#0D0F1E', style: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,.06)' } }, () => {
        for (const c of ['#FF5F57', '#FEBC2E', '#28C840']) D.div({ w: 13, h: 13, radius: 7, bg: c });
      });
      D.div({ style: { display: 'flex', flex: 1, minHeight: 0 } }, () => {
        // sidebar
        D.div({ w: 250, style: { padding: '22px 16px', display: 'flex', flexDirection: 'column', gap: 6, borderRight: '1px solid rgba(255,255,255,.06)' } }, () => {
          D.div({ style: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 18px' } }, () => { mark('m', 28); D.text('Quillo', { font: `700 20px ${FONT}` }); });
          [['Inbox', 12], ['Starred', 0], ['Sent', 0], ['Drafts', 3], ['Later', 0]].forEach(([n, c], i) =>
            D.div({ h: 42, radius: 10, bg: i ? 'transparent' : 'rgba(124,92,255,.16)', color: i ? MUTED : INK,
              style: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px' } }, () => {
              D.div({ w: 8, h: 8, radius: 4, bg: i ? 'rgba(255,255,255,.18)' : A1 });
              D.text(n, { style: { flex: 1 } });
              if (c) D.text(String(c), { font: `600 14px ${FONT}`, color: MUTED });
            }));
        });
        // main: command bar + mail list
        D.div({ style: { flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 } }, () => {
          const f = o.focus;
          D.div('cmd', { h: 58, radius: 14, bg: mixCol('#171A31', '#2A2560', o.flash),
            shadow: `0 0 0 1px rgba(124,92,255,${.08 + .6 * f}), 0 0 0 ${5 * f}px rgba(124,92,255,${.22 * f})`,
            style: { display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', flexShrink: 0 } }, () => {
            sparkle(22);
            D.div({ style: { display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 } }, () => {
              if (o.typed) D.text(o.typed, { font: `500 20px ${FONT}`, color: INK, style: { whiteSpace: 'pre' } });
              if (o.caret) D.div({ w: 2, h: 26, bg: A2, style: { marginLeft: 2 } });
              if (!o.typed) D.text('Ask Quillo anything…', { font: `500 20px ${FONT}`, color: MUTED, style: { marginLeft: o.caret ? 6 : 0 } });
            });
            D.text('⌘K', { font: `600 14px ${FONT}`, color: MUTED, style: { padding: '4px 8px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 7 } });
          });
          for (const [who, subj, when, col, unread] of MAIL)
            D.div({ h: 70, radius: 12, style: { display: 'flex', alignItems: 'center', gap: 16, padding: '0 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.04)' } }, () => {
              D.div({ w: 8, h: 8, radius: 4, bg: unread ? A2 : 'transparent', style: { flexShrink: 0 } });
              D.div({ w: 40, h: 40, radius: 20, bg: col, font: `700 16px ${FONT}`, color: '#fff', style: { display: 'grid', placeItems: 'center', flexShrink: 0 } }, () => D.text(who[0]));
              D.text(who, { w: 170, font: `${unread ? 700 : 500} 18px ${FONT}`, style: { flexShrink: 0 } });
              D.text(subj, { color: MUTED, style: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } });
              D.text(when, { font: `500 15px ${FONT}`, color: MUTED });
            });
        });
      });
    });
  }
  function cursor(x, y, press, opacity) {
    D.svg('cursor', { x, y, w: 34, h: 34, scale: 1 - .16 * press, origin: '10% 10%', opacity, attrs: { viewBox: '0 0 24 24' },
      style: { filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.45))' } }, () =>
      D.path({ attrs: { d: 'M3 2 L3 20 L8 15.5 L11.5 23 L14.8 21.6 L11.4 14.3 L18 14.3 Z', fill: '#fff', stroke: '#111', 'stroke-width': 1.3, 'stroke-linejoin': 'round' } }));
  }
  // drifting points of light, painted by p5 (a canvas layer between DOM layers)
  function motes(t, k = 1) {
    noStroke();
    for (let i = 0; i < 70; i++) {
      const sp = 18 + 50 * hash(i + 7), x = hash(i) * W + Math.sin(t * .6 + i) * 18, y = ((hash(i + 3) * (H + 200) - t * sp) % (H + 200) + H + 200) % (H + 200) - 100;
      const r = 1.5 + 3.5 * hash(i + 11), a = k * (.35 + .65 * hash(i + 5)) * (.6 + .4 * Math.sin(t * 2 + i * 1.7)), col = hash(i + 13) < .5 ? A1 : A2;
      const c = color(col); c.setAlpha(255 * a); fill(c); circle(x, y, r * 2);
      glow(x, y, r * 9, col, .45 * a);
    }
  }

  // ---------- shots ----------
  shots([
    // A: kinetic type from black, then zoom through the logo mark
    [0, (t, lt) => {
      const up = easeIn(seg(lt, 2.15, 2.4));
      D.div({ w: W, h: H, bg: BG });
      D.div({ x: 960, y: 520, ax: .5, ay: .5, w: 1400, h: 900, opacity: ease(seg(lt, 0, .8)) * (.8 + .2 * wob(t, .5)),
        bg: 'radial-gradient(closest-side, rgba(124,92,255,.35), rgba(124,92,255,0))' });
      D.group({ y: -70 * up, opacity: 1 - up, blur: 10 * up, font: `800 104px ${FONT}`, color: INK, style: { letterSpacing: -3 } }, () => {
        const lift = ease(seg(lt, 1.5, 1.85));
        words('l1', ['Email', 'that', 'reads', 'itself.'], lt, .35, { x: 960, y: 480 - 60 * lift, opacity: 1 - .45 * lift });
        words('l2', ['Meet', 'Quillo.'], lt, 1.65, { x: 960, y: 600 }, (i, k) => i ? { scale: .8 + .2 * backOut(k), style: gradText } : {});
      });
      // the mark springs in, then the camera zooms through it; by 3 s its gradient fills the frame
      const pop = backOut(seg(lt, 2.42, 2.74)), thru = easeIn(seg(lt, 2.76, 3.0));
      if (pop > 0) mark('logo', 170, { x: 960, y: 540, ax: .5, ay: .5, scale: pop * (1 + 34 * thru), rot: -8 * (1 - pop) }, 1 - seg(lt, 2.76, 2.88));
      if (lt < .5) D.div({ w: W, h: H, bg: '#000', opacity: 1 - ease(seg(lt, 0, .5)) });   // in from black
    }],

    // B: the product: tilt settles, click, type, push into the answer, whip out
    [3, (t, lt) => {
      const settle = easeOut(seg(lt, 0, 1.1));
      const cx = kf(lt, [[0, 960], [2.9, 960], [3.6, 1150]], inOut), cy = kf(lt, [[0, 540], [2.9, 540], [3.6, 600]], inOut);
      const zoom = kf(lt, [[0, .9], [1.1, 1], [2.9, 1.02], [3.6, 1.34], [5, 1.4]], inOut);
      const whip = easeIn(seg(lt, 4.6, 5.0));
      const typedN = Math.floor(seg(lt, 1.7, 2.65) * ASK.length), typing = lt > 1.7 && lt < 2.7;
      const focus = ease(seg(lt, 1.55, 1.75)), flash = Math.exp(-12 * Math.max(0, lt - 2.85)) * (lt > 2.85 ? 1 : 0);
      D.div({ w: W, h: H, bg: BG, style: { backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '64px 64px' } });
      D.div({ x: 960, y: 60, ax: .5, ay: .5, w: 1800, h: 700, opacity: .8 + .2 * wob(t, .4), bg: 'radial-gradient(closest-side, rgba(124,92,255,.28), rgba(124,92,255,0))' });
      D.group({ x: -1100 * whip, blur: 36 * whip }, () => D.cam(cx, cy, zoom, () => {
        D.group({ persp: 2400 }, () => appWindow({
          rx: 18 * (1 - settle), ry: -16 * (1 - settle), typed: ASK.slice(0, typedN), focus, flash,
          caret: focus > .5 && lt < 3.0 && (typing || frac(lt * 2) < .5),
        }));
        // cursor: arcs in, clicks the command bar, leaves after Enter
        const [px, py] = arcPt([1560, 940], [742, 236], 90, inOut(seg(lt, .85, 1.5)));
        const press = Math.sin(Math.PI * seg(lt, 1.48, 1.64)), rip = seg(lt, 1.55, 2.05);
        if (rip > 0 && rip < 1) D.div('ripple', { x: 742, y: 236, ax: .5, ay: .5, w: 90 * easeOut(rip), h: 90 * easeOut(rip), radius: '50%', opacity: 1 - rip, style: { border: `3px solid ${A2}` } });
        if (lt > .85 && lt < 3.2) cursor(px, py, press, seg(lt, .85, 1.0) * (1 - seg(lt, 2.95, 3.15)));
        // the answer card springs up over the list and writes on line by line
        const inK = seg(lt, 3.0, 3.4);
        if (inK > 0) D.div('card', { x: 1150, y: 600, ax: .5, ay: .5, w: 660, scale: .85 + .15 * backOut(inK), opacity: easeOut(inK * 1.6),
          radius: 22, bg: 'rgba(22,25,50,.94)', color: INK, font: `500 21px ${FONT}`,
          shadow: '0 40px 100px rgba(0,0,0,.55), 0 0 0 1px rgba(124,92,255,.45)',
          style: { padding: '26px 30px 24px', display: 'flex', flexDirection: 'column', gap: 16, backdropFilter: 'blur(18px)' } }, () => {
          D.div({ style: { display: 'flex', alignItems: 'center', gap: 12 } }, () => { sparkle(26); D.text('Today, in three lines', { font: `700 24px ${FONT}` }); });
          SUMMARY.forEach((line, i) => {
            const k = inOut(seg(lt, 3.3 + i * .3, 3.3 + i * .3 + .4));
            D.div({ opacity: k > 0 ? 1 : 0, style: { display: 'flex', alignItems: 'center', gap: 14, clipPath: `inset(0 ${(1 - k) * 100}% 0 0)` } }, () => {
              D.div({ w: 10, h: 10, radius: 5, bg: [A1, A2, '#98B25E'][i], style: { flexShrink: 0 } });
              D.text(line, { style: { whiteSpace: 'nowrap' } });
            });
          });
          const chip = backOut(seg(lt, 4.25, 4.55));
          D.div({ opacity: chip > 0 ? 1 : 0, scale: .6 + .4 * chip, origin: '0 50%', style: { display: 'flex', alignSelf: 'flex-start', alignItems: 'center', gap: 10, marginTop: 4,
            padding: '9px 16px', borderRadius: 999, background: 'rgba(56,182,255,.14)', color: A2, font: `700 18px ${FONT}` } }, () => {
            D.svg({ w: 18, h: 18, attrs: { viewBox: '0 0 24 24' } }, () => D.path({ attrs: { d: 'M4 12.5 L9.5 18 L20 6.5', fill: 'none', stroke: A2, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } }));
            D.text('3 replies drafted');
          });
        });
      }));
      if (lt < .45) D.div({ w: W, h: H, bg: GRAD, opacity: 1 - ease(seg(lt, 0, .45)) });   // the zoom-through, landing
    }],

    // C: whip in to the end card, over drifting light; fade to black
    [8, (t, lt, dur) => {
      const inK = easeOut(seg(lt, 0, .5)), tight = easeOut(seg(lt, .15, 1.1)), float = wob(t, .5) * 6;
      D.div({ w: W, h: H, bg: `radial-gradient(circle at 50% 45%, #1C1942 0%, ${BG} 62%)` });
      motes(t, ease(seg(lt, 0, .6)));
      D.canvas();
      D.group({ x: 900 * (1 - inK), blur: 36 * (1 - inK) }, () => {
        D.div({ x: 960, y: 470 + float, ax: .5, ay: .5, style: { display: 'flex', alignItems: 'center', gap: 38 } }, () => {
          mark('logo', 150, { scale: .9 + .1 * backOut(seg(lt, .1, .5)) });
          D.text('Quillo', { font: `800 156px ${FONT}`, color: INK, style: { letterSpacing: lerp(14, -5, tight) } });
        });
        const tag = easeOut(seg(lt, .95, 1.4));
        D.text('Email that reads itself.', { x: 960, y: 650 + 30 * (1 - tag), ax: .5, ay: .5, opacity: tag, blur: 8 * (1 - tag), font: `500 46px ${FONT}`, color: MUTED });
        const pill = backOut(seg(lt, 1.55, 1.9));
        if (pill > 0) D.text('Available today on Mac and web', { x: 960, y: 760, ax: .5, ay: .5, scale: pill, font: `600 26px ${FONT}`, color: INK,
          style: { padding: '14px 30px', borderRadius: 999, background: 'rgba(124,92,255,.18)', border: '1px solid rgba(124,92,255,.5)', whiteSpace: 'nowrap' } });
      });
      if (lt > dur - .55) D.div({ w: W, h: H, bg: '#000', opacity: ease(seg(lt, dur - .55, dur - .05)) });   // out to black
    }],
  ]);
})();
