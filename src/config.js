// config.js: project settings. A scene's own settings in src/scenes/index.js override these.
//   scene:    the scene studio.html and render.mjs load when no ?scene / --scene is given (see src/scenes/index.js).
//   duration: the video's length in seconds.
//   bpm:      the rhythm that bounces, dances and pulse() follow. Characters always move to some beat; if the video has
//             music, set this to the song's tempo, and set offset to the time in seconds of its first downbeat.
//   style:    'clean' = crisp vector look (flat fills, even outlines, no boil or paper). Anything else is hand-painted.
//   canvasBg: the p5 canvas's background: omit for paper, a colour, or null for transparent (DOM layers show through).
//   size:     'landscape' (1920 × 1080, default), 'square' (1080 × 1080), 'portrait' (1080 × 1920), or [w, h].
//   theme:    'light' (default) or 'dark', for the motion-graphics libs (src/lib/theme.js); brand: token overrides.
const PROJECT = { scene: 'booked', duration: 30, bpm: 120, offset: 0, style: 'clean' };
