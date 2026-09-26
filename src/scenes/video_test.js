// video_test.js: a check that D.video shows exactly the right frame. frame_counter.mp4 encodes its frame number N in
// luma (top half 24 + 12·floor(N/16), bottom half 24 + 12·(N mod 16)); the left copy plays at media time t, the right at
// half speed from 1 s. scripts/check_video_frames.mjs renders stills and decodes N from the pixels.
(() => {
  shots([[0, t => {
    D.div({ w: W, h: H, bg: '#808080' });
    D.video('a', 'projects/demo/assets/frame_counter.mp4', t, { x: 0, y: 0, w: W / 2, h: H });
    D.video('b', 'projects/demo/assets/frame_counter.mp4', 1 + t * .5, { x: W / 2, y: 0, w: W / 2, h: H });
  }]]);
})();
