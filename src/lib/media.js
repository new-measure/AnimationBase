// media.js: supplied footage, screen recordings and stills in a film, on top of D.video / D.img (frame-exact: see
// scripts/check_video_frames.mjs). 63% of camera-led launch films carry designed overlays (captions, titles, logos, UI);
// this is the part that puts them on real footage. Sound never comes from the elements: use Sound (lib/audio.js).
//   Media.time(t, o)                 media time for film time t: o.at (film time the clip starts), o.from (media time
//                                    at that moment), o.rate, o.loop (loop length), o.ramp [[t, mediaTime], ...] (a speed
//                                    ramp: piecewise linear, overrides the rest)
//   Media.filmTime(m, o)            the inverse: the film time at which media time m plays (to cue sounds on events)
//   Media.clip(key, src, t, o, props)    a video at Media.time, with o.treat (see treat()) and o.kb (Ken Burns)
//   Media.still(key, src, t, o, props)   an image with o.kb and o.treat
//   Media.treat(o)                   CSS filter for { dim, saturate, contrast, blur, gray, warm }
//   Media.duotone(key, dark, light)  a duotone wash over what's beneath (draw right after the media)
//   Media.scrim(key, o)              a contrast gradient for text over footage: o.side 'bottom' | 'top' | 'left' | 'full', o.a
//   Media.device(key, kind, props, kids)   'phone' | 'tablet' | 'laptop' | 'browser': a frame around kids (the screen)
//   Media.captions(key, t, cues, o)  subtitle captions: cues [{ t0, t1, text, words? [[t, 'word'], ...] }] (word-level
//                                    timing highlights the word being said); o.style 'box' | 'bold' (big, centred, one
//                                    phrase at a time); parse .vtt/.srt text with Media.parseVTT / parseSRT
//   Media.lowerThird(key, t, t0, t1, name, title, props)   a name tag that slides in, holds and leaves
// o.kb: [s0, s1, dx, dy] scales from s0 to s1 and drifts by (dx, dy) px over o.kbDur (default: 6 s from o.at).
const Media = (() => {
  function time(t, o = {}) {
    if (o.ramp) {
      const r = o.ramp; if (t <= r[0][0]) return r[0][1];
      for (let i = 1; i < r.length; i++) if (t < r[i][0]) return lerp(r[i - 1][1], r[i][1], (t - r[i - 1][0]) / (r[i][0] - r[i - 1][0]));
      const [a, b] = [r[r.length - 2], r[r.length - 1]]; return b[1] + (t - b[0]) * (b[1] - a[1]) / (b[0] - a[0]);
    }
    let m = (o.from || 0) + (t - (o.at || 0)) * (o.rate ?? 1);
    if (o.loop) m = (o.from || 0) + ((m - (o.from || 0)) % o.loop + o.loop) % o.loop;
    return Math.max(0, m);
  }
  // the film time at which media time m plays (the inverse of time(), for placing sounds on a recording's events)
  function filmTime(m, o = {}) {
    if (o.ramp) {
      const r = o.ramp; for (let i = 1; i < r.length; i++) if (m <= r[i][1]) return lerp(r[i - 1][0], r[i][0], (m - r[i - 1][1]) / (r[i][1] - r[i - 1][1]));
      const [a, b] = [r[r.length - 2], r[r.length - 1]]; return b[0] + (m - b[1]) * (b[0] - a[0]) / (b[1] - a[1]);
    }
    return (o.at || 0) + (m - (o.from || 0)) / (o.rate ?? 1);
  }
  function treat(o = {}) {
    const f = [];
    if (o.dim) f.push(`brightness(${1 - o.dim})`);
    if (o.saturate != null) f.push(`saturate(${o.saturate})`);
    if (o.contrast != null) f.push(`contrast(${o.contrast})`);
    if (o.gray) f.push(`grayscale(${o.gray})`);
    if (o.warm) f.push(`sepia(${o.warm * .35}) saturate(${1 + o.warm * .2})`);
    if (o.blur) f.push(`blur(${o.blur}px)`);
    return f.join(' ');
  }
  const kbProps = (t, o) => {
    if (!o.kb) return {};
    const [s0, s1, dx = 0, dy = 0] = o.kb, k = EASE.inOut(seg(t, o.at || 0, (o.at || 0) + (o.kbDur || 6)));
    return { scale: lerp(s0, s1, k), dx: dx * k, dy: dy * k, origin: '50% 50%' };
  };
  function clip(key, src, t, o = {}, props = {}) {
    return D.video(key, src, time(t, o), { w: W, h: H, ...props, ...kbProps(t, o), style: { filter: treat(o.treat), ...(props.style || {}) } });
  }
  function still(key, src, t, o = {}, props = {}) {
    return D.img(key, src, { w: W, h: H, ...props, ...kbProps(t, o), style: { objectFit: 'cover', filter: treat(o.treat), ...(props.style || {}) } });
  }
  function duotone(key, dark = '#101828', light = THEME.accent) {
    D.div(key + ':d', { w: W, h: H, bg: dark, style: { mixBlendMode: 'lighten' } });
    D.div(key + ':l', { w: W, h: H, bg: light, style: { mixBlendMode: 'multiply' } });
  }
  function scrim(key, o = {}) {
    const a = o.a ?? .6, c = o.color || '0,0,0', dir = { bottom: 'to top', top: 'to bottom', left: 'to right', right: 'to left' }[o.side || 'bottom'];
    D.div(key, { w: W, h: H, bg: o.side === 'full' ? `rgba(${c},${a})` : `linear-gradient(${dir}, rgba(${c},${a}) 0%, rgba(${c},${a * .45}) 35%, rgba(${c},0) 65%)` });
  }
  function device(key, kind, props, kids) {
    const w = props.w, h = props.h;
    if (kind === 'browser') return UI.window(key, props, kids, { chrome: 'browser', url: props.url });
    const bezel = { phone: w * .045, tablet: w * .035, laptop: w * .02 }[kind], r = { phone: w * .16, tablet: w * .06, laptop: w * .025 }[kind];
    return D.div(key, { ...props, h: kind === 'laptop' ? h * 1.08 : h, style: { overflow: 'visible', ...(props.style || {}) } }, () => {
      D.div('body', { w, h, radius: r, bg: '#0b0b0f', shadow: '0 40px 90px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.08)', pos: 'abs',
        style: { padding: bezel, boxSizing: 'border-box' } }, () =>
        D.div('screen', { w: '100%', h: '100%', radius: Math.max(0, r - bezel), style: { overflow: 'hidden', position: 'relative', background: '#000' } }, () => {
          D.group('content', {}, kids);
          if (kind === 'phone') D.div('island', { x: w / 2 - bezel, y: bezel * .6, w: w * .3, h: w * .075, ax: .5, radius: 999, bg: '#000', pos: 'abs' });
        }));
      if (kind === 'laptop') D.div('base', { x: -w * .06, y: h - 2, w: w * 1.12, h: h * .06, radius: `0 0 ${w * .02}px ${w * .02}px`, pos: 'abs',
        bg: 'linear-gradient(#d9d9de, #a9a9b0)', shadow: '0 20px 40px rgba(0,0,0,.25)' });
    });
  }
  function captions(key, t, cues, o = {}) {
    const c = cues.find(q => t >= q.t0 && t < q.t1); if (!c) return;
    const k = anim(t, c.t0, 'card') * (1 - anim(t, c.t1 - .12, { dur: .12, ease: 'in' })), bold = o.style === 'bold';
    const words = c.words || c.text.split(' ').map(w => [c.t0, w]);
    D.div(key, { x: W / 2, y: H * (bold ? .5 : .86), ax: .5, ay: .5, w: W * (bold ? .8 : .72), ...enter(k, 'rise', 10),
      style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${px(bold ? 16 : 10)}px`, ...(bold ? {} : { padding: `${px(12)}px ${px(22)}px` }) } }, () =>
      words.forEach(([wt, w], i) => {
        const said = t >= wt, now = c.words && said && (i + 1 >= words.length || t < words[i + 1][0]);
        D.text(w, { font: `${bold ? 700 : 600} ${px(bold ? 84 : 40)}px ${THEME.font}`, color: bold && now ? THEME.accent : '#fff',
          opacity: c.words ? (said ? 1 : .45) : 1, scale: bold && now ? 1.04 : 1,
          style: { textShadow: '0 2px 12px rgba(0,0,0,.55)', ...(bold || !now ? {} : { background: alpha(THEME.accent, .85), borderRadius: px(8), padding: `0 ${px(6)}px`, margin: `0 -${px(6)}px` }) } });
      }));
  }
  function lowerThird(key, t, t0, t1, name, title, props = {}) {
    const k = life(t, t0, t1, 'panel', 'exit'); if (k <= 0) return;
    // above the caption band (captions centre at 86% of the height), so the two never share a line
    D.div(key, { x: W * .07, y: H * .64, ...props, ...enter(k, 'slide', -40), style: { display: 'flex', alignItems: 'stretch', gap: px(18), ...(props.style || {}) } }, () => {
      D.div({ w: px(6), radius: 3, bg: THEME.accent, sy: EASE.out(k) });
      D.div({ style: { display: 'flex', flexDirection: 'column', gap: px(4) } }, () => {
        D.text(name, { font: `600 ${px(40)}px ${THEME.font}`, color: '#fff', style: { textShadow: '0 2px 10px rgba(0,0,0,.5)' } });
        D.text(title, { font: `400 ${px(26)}px ${THEME.font}`, color: 'rgba(255,255,255,.8)', style: { textShadow: '0 2px 10px rgba(0,0,0,.5)' } });
      });
    });
  }
  const ts = s => { const m = s.trim().replace(',', '.').split(':').map(Number); return m.length === 3 ? m[0] * 3600 + m[1] * 60 + m[2] : m[0] * 60 + m[1]; };
  function parseVTT(text) {
    return text.replace(/\r/g, '').split(/\n\n+/).map(b => b.split('\n')).map(L => {
      const i = L.findIndex(l => l.includes('-->')); if (i < 0) return null;
      const [a, b] = L[i].split('-->').map(s => s.trim().split(' ')[0]);
      return { t0: ts(a), t1: ts(b), text: L.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').trim() };
    }).filter(Boolean);
  }
  const parseSRT = parseVTT;   // the same block structure (an index line, then "a --> b", then text)
  return { time, filmTime, treat, clip, still, duotone, scrim, device, captions, lowerThird, parseVTT, parseSRT };
})();
