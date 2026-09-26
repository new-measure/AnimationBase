# Projects

A project is one film for one brand: its brief, brand, assets and scene in one folder.

```
projects/<name>/
  brief.md      what the film must do (for the agent: storyboard from this). Start from projects/_template/brief.md
  project.js    settings loaded before the engine: brand tokens, fonts, captions (see below)
  assets/       everything supplied: footage, screen recordings, stills, music, voice-over, logo, font files
  scene.js      the film (shots), written by the agent
```

Register it in [src/scenes/index.js](../src/scenes/index.js) with its folder:

```js
my_film: { dir: 'projects/my_film', file: 'projects/my_film/scene.js', libs: ['mg'], project: { duration: 30, style: 'clean', canvasBg: null } },
```

Then preview it with `studio.html?scene=my_film` and render it with `node render.mjs --scene=my_film --clip --out=out/my_film.mp4`. The
MP4 includes the mixed sound.

## project.js

```js
PROJECT_FILE({
  fonts: ['Inter:wght@400;500;600'],                    // Google Fonts, or:
  localFonts: [{ family: 'Brand Sans', src: 'BrandSans-Medium.woff2', weight: 500 }],   // files in assets/
  brand: { name, tagline, cta, url, accent, font: '"Brand Sans", sans-serif', logo: { src: 'logo.svg' } },
  captionsVTT: `WEBVTT ...`,                            // captions (paste the .vtt or .srt text)
  captionWords: { 0: [[t, 'word'], ...] },              // optional word timings per cue, for the highlight
});
```

- Settings apply in this order: config.js defaults, then project.js, then the scene's own `project` settings.
- `asset('file')` gives a file's path inside the scene. `brand.logo.src` and `localFonts[].src` are resolved against
  `assets/` automatically.
- Captions are pasted in, not loaded from a file, because a browser opening `studio.html` from disk can't fetch local
  files.

## What goes in assets/

- **Footage and screen recordings:** MP4 (H.264), or WebM. Use WebM with alpha for pre-keyed layers, such as a person
  cut out so text can sit behind them.
  - They're shown frame-exact: `Media.clip(key, asset('x.mp4'), t, { at, from, rate, loop, ramp })`.
  - Sound from footage goes through `Sound.clip(t, asset('x.mp4'), { from, dur })`, never through the video element.
- **Stills:** PNG or JPG, placed with `Media.still` (with optional Ken Burns).
- **Music and voice-over:** WAV, MP3 or M4A, via `Sound.music(asset('bed.wav'))` and `Sound.clip(...)`.
- **Logo:** SVG. **Fonts:** WOFF2, TTF or OTF.

Media files (`*.mp4`, `*.wav`) in `projects/*/assets/` are gitignored. Keep the originals wherever the brand keeps them.

## The demo

[projects/demo](demo/) is a working example on stand-in media made by `node scripts/make_demo_assets.mjs`. Run that
once first. It includes:
- type over footage;
- the screen recording in a laptop frame, sped up 3× through the wait, with clicks and typing synced to the recording;
- a captioned customer line with a lower third;
- the end card with the brand's logo file;
- a music bed with effects, mixed to −15 LUFS.

`node scripts/check_video_frames.mjs` proves the video layer shows the exact frame for every film time.
