# Muse / Jolly kit

This branch swaps Clawd for **Jolly**, an original brush take on Muse’s fuzzy mascot, using the same AnimationBase engine.

## What’s new

| path | what |
|---|---|
| [src/jolly.js](src/jolly.js) | Character: views, emotions, typing, emotes |
| [src/human.js](src/human.js) | Sam + partner: seated people, IK arms, faces |
| [src/scenes/muse_demo.js](src/scenes/muse_demo.js) | 30s film: “Booked.” |
| [src/muse_sheets.js](src/muse_sheets.js) | `?loop=emotions` / `?loop=views` |
| [STORYBOARD.md](STORYBOARD.md) | Shot list + reads |
| [src/config.js](src/config.js) | `duration: 30`, `style: 'clean'` (crisp vector; remove for the hand-painted look) |

Clawd files (`src/clawd.js`, `src/sheets.js`, `src/scenes/demo.js`) stay in the repo but are not loaded by `studio.html` on this branch.

## Preview (no render yet)

```bash
npm install
open studio.html          # scrub the 30s timeline
open "studio.html?loop=emotions"
```

When you want the MP4:

```bash
node render.mjs --clip --out=out/muse.mp4
```

## Prompt pattern

> Read ANIMATION_GUIDE.md (medium + timing rules), STORYBOARD.md, and src/jolly.js. Build / revise the Muse video in src/scenes/ — star Jolly, no text, transitions at every seam.
