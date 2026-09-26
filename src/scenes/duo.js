// duo.js: Clawd and Jolly in one scene, through their namespaces (Clawd.draw, Jolly.draw, ...). The first kit loaded
// (clawd, per the manifest) also owns the plain globals; the second is always called through its namespace. A check that
// several characters can share a frame, and a pattern to copy.
(() => {
  shots([[0, (t, lt) => {
    paint(rectPts(-60, -60, W + 120, H + 120), { wash: PAL.cream, ink: null });
    paint(ellPts(960, 1130, 1300, 330, 40, 2), { wash: PAL.sap, ink: PAL.ink, sw: 1 });
    const cm = Clawd.emotions(lt, [[0, 'curious'], [1.6, 'surprised'], [2.4, 'happy']]);
    const jm = Jolly.emotions(lt, [[0, 'happy'], [1.2, 'excited'], [2.6, 'love']]);
    Clawd.draw(640, 860, 24, { ...cm, view: 'q' });
    Jolly.draw(1300, 860, 26, { ...jm, view: 'q', flip: true, ...Jolly.move('wave', lt) });
  }]]);
})();
