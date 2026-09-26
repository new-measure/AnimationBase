// muse_sheets.js: Jolly model sheets as standalone loops.
// Scrub: studio.html?loop=emotions or ?loop=views
// Render: node render.mjs --loop=emotions --sheet=1 --cols=1 --w=1920 --out=docs/jolly_emotions.jpg
(() => {
  const label = (txt, x, y, size = 20) => letter(txt, x, y, size, PAL.ink, { ink: false, alpha: .8 });
  const floor = (y) => inkLine([[40, y + 6], [W / 2, y + 4], [W - 40, y + 7]], .6, mixCol(PAL.paper, PAL.ink, .35), 'inkfine', .5);

  LOOPS.emotions = t => {
    const names = Object.keys(EMO), cols = 7, cw = W / cols, ch = H / 3;
    names.forEach((name, i) => {
      const cx = cw * (i % cols) + cw / 2, gy = ch * Math.floor(i / cols) + ch - 70;
      jolly(cx, gy, 12, feel(name, t, { seed: i }));
      label(name, cx, gy + 36);
    });
    for (let r = 0; r < 3; r++) floor(ch * r + ch - 70);
  };
  LOOPS.emotions.len = 4;

  LOOPS.views = t => {
    const views = ['front', 'q', 'side', 'qback', 'back'];
    views.forEach((v, i) => {
      const x = 220 + i * 370;
      jolly(x, 400, 20, { ...feel('idle', t, { seed: i }), view: v });
      label(v, x, 450, 24);
    });
    floor(400);

    const y2 = 780, u2 = 14;
    const row = [
      ['walk', x => jolly(x, y2, u2, { ...move('walk', t), view: 'side' })],
      ['turn', x => jolly(x, y2, u2, { ...feel('happy', t), ...spinView(Math.floor(t * 2) / 8) })],
      ['typing', x => jolly(x, y2, u2, { ...feel('working', t), view: 'q' })],
      ['wave', x => jolly(x, y2, u2, { ...feel('success', t), ...move('wave', t) })],
      ['jump', x => { const k = t % 1.5; jolly(x, y2, u2, { ...feel('excited', t), ...jump(k, .35, .95, 2.5) }); }],
    ];
    row.forEach(([name, f], i) => { const x = 200 + i * 360; f(x); label(name, x, y2 + 42); });
    floor(y2);
  };
  LOOPS.views.len = 4;
})();

// ?loop=people — Sam and the partner, seated, in a few poses.
LOOPS.people = t => {
  paint(rectPts(-100, -100, W + 200, H + 200), { wash: PAL.paper, ink: null });
  human(250, 640, 34, { pal: SAM, view: 'q', legs: true, hair: 'short', eyes: 'half', mouth: 'flat', brow: 'sad', lean: -.1, tilt: .08, boilKey: 's1' });
  human(720, 640, 34, { pal: SAM, view: 'front', legs: true, hair: 'short', mouth: 'grin', eyes: 'happy', blush: .6, boilKey: 's2' });
  human(1150, 640, 34, { pal: SAM, view: 'q', hair: 'short', pointN: -1.1, handN: [3.4, -8.6], lookY: -1, lean: .12, brow: 'up', mouth: 'open', boilKey: 's3' });
  human(1650, 640, 34, { pal: PARTNER, view: 'q', flip: true, hair: 'bun', mouth: 'smile', blush: .7, handN: [3.6, -4.6], seed: 3, boilKey: 'p1' });
};
LOOPS.people.len = 2;
