// scene.js: the demo project's film (brief.md): footage-led, with the product's screen recording inside, captions and
// a lower third, sound mixed from a music bed and effects. Built on the stand-in assets from make_demo_assets.mjs.
//   0–5 s      type over footage: the problem, then the question                      → whip pan (whoosh)
//   5–12.5     the screen recording in a laptop: typing and clicks at 1×, the wait at 3×, then the result
//   12.5–17    a customer line, captioned word by word, with a lower third           → cross-dissolve in, dip out
//   17–21      the end card (chime)
(() => {
  const cx = W / 2, cy = H / 2;
  // the recording's speed ramp, in film time: 1× through the typing and submit, 3× through the wait, 1× to the end
  const REC = { ramp: [[5.0, 0], [7.6, 2.6], [8.6, 5.6], [11.0, 8.0]] };
  const LAP = { w: px(1240), h: px(775) };
  const cues = Media.parseVTT(PROJECT.captionsVTT).map((c, i) => ({ ...c, words: PROJECT.captionWords?.[i] }));

  // sound: declared once, at load (render.mjs mixes it)
  Sound.music(asset('music.wav'), { gain: -12 });
  Sound.sfx(4.72, 'whoosh', { gain: -10 });
  Sound.typing('Summarize today\'s standup', 5.6, 17);                       // the recording types from media 0.6 s
  for (const m of [.45, 2.46, 5.9, 6.7, 7.5]) Sound.sfx(Media.filmTime(m, REC) - 1 / 24, 'click', { gain: -9 });   // its clicks
  Sound.sfx(7.62, 'pop', { gain: -12 });                                      // the 3× chip
  Sound.sfx(17.35, 'chime', { gain: -10 });

  shots([
    [0, (t, lt, dur) => {
      const out = lt > dur - .3 ? Tx.whip(seg(lt, dur - .3, dur)) : {};
      D.group('a', out, () => {
        Media.clip('broll', asset('broll.mp4'), t, { at: 0, kb: [1.1, 1.0, 0, -20], kbDur: 5, treat: { dim: .35, saturate: .8 } });
        Media.scrim('scrim', { side: 'full', a: .25 });
        Type.swap('q', [[.3, 'Status updates eat your week.'], [2.5, 'What if they wrote themselves?']], lt, { x: cx, y: cy, ax: .5, ay: .5 },
          { size: 84, weight: 600, color: '#fff', style: { transform: 'translate(-50%, -50%)', textShadow: '0 4px 30px rgba(0,0,0,.35)' } });
      });
    }],
    [5, (t, lt, dur) => {
      const into = lt < .3 ? Tx.whip(1 - lt / .3, 1) : {};
      D.div('bg', { w: W, h: H, bg: THEME.bg });
      FX.glow('glow', cx, cy, px(900));
      D.group('b', into, () => Cam.shot(lt, [[0, cx, cy, .94], [1.0, cx, cy, 1], [3.0, cx + px(90), cy - px(60), 1.16], [7.5, cx + px(90), cy - px(40), 1.2]], () => {
        Media.device('laptop', 'laptop', { x: cx - LAP.w / 2, y: cy - LAP.h / 2 - px(20), ...LAP }, () =>
          Media.clip('rec', asset('screen.mp4'), t, REC, { w: '100%', h: '100%', pos: 'abs' }));
      }));
      // the fast-forward chip while the recording runs at 3×
      const ff = life(t, 7.6, 8.55, 'card', 'exit');
      if (ff > 0) UI.chip('ff', '3× while it writes', { x: cx, y: H - px(110), ax: .5, ay: .5, ...enter(ff, 'rise', 12) }, { tone: 'accent', icon: 'bolt' });
    }],
    [12.5, (t, lt, dur) => {
      Media.clip('broll2', asset('broll.mp4'), t, { at: 12.5, from: 5, rate: .8, kb: [1.0, 1.06], kbDur: 5, treat: { dim: .25, warm: .6 } });
      Media.scrim('scrim2', { side: 'bottom', a: .7 });
      Media.lowerThird('lt', t, 13.0, 16.4, 'Maya Chen', 'Head of Product, Northwind');
      Media.captions('cap', t, cues);
      if (lt > dur - .3) Tx.dip((lt - (dur - .3)) / .6, THEME.bg);
    }, { xfade: .5 }],
    [17, (t, lt, dur) => {
      Brand.endCard(t, 17, dur, {});
      if (lt < .3) Tx.dip(.5 + lt / .6, THEME.bg);
    }],
  ]);
})();
