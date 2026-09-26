# Claude Animation Base

This is a small starter kit with code, instructions and assets for animating a character in [p5.js](https://p5js.org) and [p5.brush](https://github.com/acamposuribe/p5.brush) with Claude Opus 5.5. It's based on the code from the music video [I'm Upping My P(doom)](https://github.com/JohnHeibel/PDoomVideo) and an analysis of what the model did and didn't do well. I highly recommend playing around with your prompting: make it give you the storyboard before coding, give it very broad instructions, try being very specific, ask for subagents, and try a bunch of other fun ways of testing the model's capabilities. In my testing, it can do a lot with very little, but it's also quite accurate when you give it more requirements. Also try asking the model to swap out the character or make new emotions or costumes, give it your own reference images, and try many other fun things like that. I've found that the reasoning level corresponds to how "extravagant" and detail-oriented the model makes the scene. All test videos were generated with Opus 5.5 on xhigh reasoning in Claude Code.

![Clawd's emotions, animated](docs/emotions.webp)

It now also makes **motion-graphics launch films**: product UI walkthroughs, type-led announcements, brand and graphic
motion, abstract pieces, and supplied footage or screen recordings with titles, captions and sound. It has a kit of
components whose defaults are measured from real launch films (see [plan.md](plan.md) for how it was built).

## Make a video

Clone it, open it in Claude Code (or any coding agent) and ask for what you want:

> Read ANIMATION_GUIDE.md, then make a 30-second launch film for our note-taking app. The brief is in projects/notes/brief.md.

> Read ANIMATION_GUIDE.md, then make a 15-second video of Clawd trying to catch a butterfly.

The model picks the genre, storyboards first, builds shot by shot from the kit, renders contact sheets to check its own
work, and writes the MP4 with the sound mixed in.

[ANIMATION_GUIDE.md](ANIMATION_GUIDE.md) holds the rules it follows: timing for the viewer (one read at a time), a
focal point in every frame, something happening in every beat, designed transitions, typography, and the craft
defaults. Those defaults are **measured** from the 2,221 launch films on whatships.com: quiet motion with no bounce,
one typeface, one accent, the product shown in the first second, and an end card held about 4 s.

Character cartoons follow their own rules in [docs/character_guide.md](docs/character_guide.md): hand-painted, boiling
ink, no text.

## Run it yourself

You need Node.js, Google Chrome and ffmpeg.

Without a dedicated GPU, p5.brush's watercolour fills make render times fairly slow, measured in seconds per frame. If you're running on integrated graphics, I recommend asking the model to avoid those fills and replace them with something else appropriate. (I love the look of the watercolours, though.)

```bash
npm install
node render.mjs --clip --out=out/video.mp4
```

That renders the default scene (`scene` in [src/config.js](src/config.js)); pick another with `--scene=<name>` from [src/scenes/index.js](src/scenes/index.js): `clawd` is the 11-second Clawd demo in [src/scenes/demo.js](src/scenes/demo.js), `mg_demo` a motion-graphics launch film on the DOM layer. Open [studio.html](studio.html) in Chrome to scrub or play it (`?scene=<name>` to pick one). Add `?loop=emotions` or `?loop=views` to see the model sheets. If Chrome isn't in a standard location, pass `--chrome=<path>` or set `CHROME_PATH`.

On Linux, `render.mjs` starts Chrome with `--no-sandbox` (Ubuntu 23.10+ blocks Chrome's sandbox in headless use) and also finds a Chromium installed by Playwright. With no GPU at all, add `--soft-gl` to render WebGL in software: slow on watercolour fills, but it works. On a headless Linux machine with an NVIDIA GPU (a cloud or cluster node), add `--gpu-angle=gl-egl` (or `vulkan`); `node gpu_probe.mjs <chrome path>` shows which renderer each set of flags gets.

## What's here

| path | what it is |
|---|---|
| [ANIMATION_GUIDE.md](ANIMATION_GUIDE.md) | The rules, the workflow and the full API. Read it first. |
| [src/clawd.js](src/clawd.js) | Clawd: views, emotions, eyes, mouths, hats, emotes, dances |
| [src/core.js](src/core.js) | Painting, timing, motion helpers, camera, light, paper |
| [src/timeline.js](src/timeline.js) | Shots, loops and the brush-wipe transition |
| [src/config.js](src/config.js) | Length and tempo |
| [src/scenes/index.js](src/scenes/index.js) | The scene manifest: `studio.html?scene=<name>`, `render.mjs --scene=<name>` |
| [src/lib/](src/lib/) | The motion-graphics kit: theme, measured motion presets, type, UI, cursor, shapes, fx, camera, transitions, brand (see [docs/motion_design_spec.md](docs/motion_design_spec.md); model sheets in [docs/kit/](docs/kit/)) |
| [docs/eval.md](docs/eval.md) | How our films score against the top tier, and what that changed (`scripts/eval_scorecard.py`) |
| [projects/](projects/README.md) | One folder per film: brief, brand, fonts, captions, supplied footage and recordings, scene. [projects/demo](projects/demo/) is a working example |
| [src/dom.js](src/dom.js) | The DOM layer: HTML, CSS and SVG for UI, type and motion graphics, still a pure function of time |
| [src/scenes/](src/scenes/) | Your video goes here (the demo is an example) |
| [render.mjs](render.mjs) | Headless renderer: contact sheets, frame strips, crops, stills, MP4 |
| [docs/](docs/) | Model sheets: [emotions](docs/emotions.jpg) (also [animated](docs/emotions.webp)) and [views, motion and hats](docs/views.jpg) |
