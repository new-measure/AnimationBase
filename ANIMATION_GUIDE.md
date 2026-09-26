# Making launch films and animated shorts

Read this whole file before you build anything. It covers how to make a short film with this kit: motion-graphics launch films (product UI, typography, brand graphics, abstract, footage with overlays) and hand-painted character cartoons. It sets out the rules that make them look good, the workflow that catches mistakes, and the engine reference.

The person prompting you decides **what** the film is about. This guide decides **how** it's made. Its defaults are **measured**, not guessed:
- all 2,221 launch films on [whatships.com](https://whatships.com) were tagged;
- 213 were measured for pacing;
- 36 top-tier films were measured frame by frame for motion, design and sound.

The evidence is in [docs/motion_design_spec.md](docs/motion_design_spec.md), [docs/genres/](docs/genres/README.md) and `refs/whatships/`. If the person asks for something a default rules out (a bouncy style, a dark look, beat-matched cuts), do what they ask.

**No design here is final.** The components, presets and characters are a starting point. Change them, and add what the idea needs, built the same way so it belongs with the rest.

---

## Start here: what kind of film is it?

Pick the genre first. It decides the rules that differ, and each one has a recipe with measured structure, looks and pitfalls.

| genre | what it is | recipe |
|---|---|---|
| Product UI walkthrough | the product's interface, redesigned for film, one component at a time | [docs/genres/ui_walkthrough.md](docs/genres/ui_walkthrough.md) |
| Type-led announcement | typography is the picture | [docs/genres/type_led.md](docs/genres/type_led.md) |
| Screen-recording demo | a real capture, framed, zoomed and ramped | [docs/genres/screen_demo.md](docs/genres/screen_demo.md) |
| Brand and graphic motion | logos, icons, diagrams, lock-ups | [docs/genres/brand_graphic.md](docs/genres/brand_graphic.md) |
| Abstract and atmospheric | particles, light, gradients | [docs/genres/abstract.md](docs/genres/abstract.md) |
| 3D product and scene | stylised objects (photoreal 3D is out of scope) | [docs/genres/stylised_3d.md](docs/genres/stylised_3d.md) |
| Footage with overlays | supplied camera footage with type, captions, UI, logos | [docs/genres/footage_overlays.md](docs/genres/footage_overlays.md) |
| Character cartoon | a painted character acts out a story | [docs/character_guide.md](docs/character_guide.md) |

Most launch films mix two genres, for example a UI walkthrough that opens type-led and ends on a brand end card. Take each part's rules from its genre.

## The goals

Every rule serves one of four goals.

- **Clear.** The viewer follows it on one viewing, at full speed, without sound. Timing (rule 1) is the rule models get wrong most often.
- **Alive.** Something is always moving, even in a hold: a slow camera drift, a breathing glow.
- **Crafted.** It looks like a good studio made it. Top-tier motion is quiet and precise: short, even moves with no bounce, one typeface, one accent colour and generous space. The kit's defaults already look like that, so keep them unless you have a reason.
- **One piece.** One film with one idea, not a pile of clips. Plan it before you build it, and link every part to the next.

## The rules

### 1. Time it for the viewer

You know what happens because you wrote the code. The viewer doesn't: they see it once, at full speed, for the first time. **For every moment, ask what the viewer needs to understand and how long that takes, and time it for that.**

- **Write the reads.** For each beat, list in order what the viewer has to understand. Each item is a *read*. A read needs time for the eye to find it, time to understand it, and a moment to register before the next one starts.
- **One read at a time.** When two things change at once, the viewer sees only one. A line leaves *before* the next arrives (`Type.swap` does this). A card lands, *then* its rows write on, *then* the cursor moves.
- **Fast moves, held meanings.** A move takes about 0.4–1 s. What it shows needs a hold after it lands (a median of 1.25 s in top-tier films). Contrast between quick and held is what gives a film rhythm.
- **Something new every 1–2 s.** Top-tier films make about 4 prominent moves every 10 s, and only 30% of their holds last 2 s or more. A beat is about 5 s, but *inside* it, the next read arrives every 1–2 s.
- **The reading rule for text:** keep a line fully readable for at least **0.5 s + 0.3 s per word**, and longer for the line that carries the message. In a sheet, count the frames it's fully on screen.
- **Lead the eye.** The viewer looks at what moves, is bright, is big or is being pointed at. Get the eye there (a cursor, a camera push, a highlight) before the read starts.
- **Measured pacing** ([refs/whatships/pacing.md](refs/whatships/pacing.md)):
  - A new beat about every **5 s**.
  - Designed films run **30–50 s**, and 20–60 s is normal.
  - UI films show the **product in the first second**.
  - The end card holds **3.5–4.5 s**.
  - Let the reads set the length. Never squeeze reads to hit a duration: cut a read or lengthen the film.

### 2. One focal thing at a time

- One element leads each moment, big enough to read on a phone. 57% of top-tier frames are sparse.
- Don't show the whole app: crop to the component that matters, and move between components with the camera.
- Everything else waits: dimmed, blurred, smaller or not there yet.

### 3. Something happens in every beat

- Every beat has an event: something changes between its first and last frame. The user asks and the product answers, a number rolls up, a word lands, a tool connects.
- **Cause, then result:** the click, then the response. The result is the payoff, so give it the hold.
- **Pay it off:** whatever you set up (a question, an empty input) gets answered on screen.

### 4. Nothing is ever dead

- Holds are still, not frozen. Keep a slow camera drift (`Cam.shot` adds one), a gradient that moves, a glow that breathes, grain.
- A frame where nothing at all moves for over a second reads as a bug. The exception is the last frame after a fade.

### 5. Motion defaults (measured)

These are from [docs/motion_design_spec.md](docs/motion_design_spec.md) and built into `lib/motion.js`:
- **Duration:** moves take about **0.55 s** (0.4–0.95). Cards enter in **0.38 s** with a fast ease-out. Text takes about 0.65 s and the camera about 0.75 s, both ease-in-out.
- **No overshoot:** 97% of top-tier moves have none. No `backOut` pops, springs or squash in launch films. They belong to character cartoons and playful briefs (`playful` preset).
- **Staggers:** items in a group start **4 frames (0.17 s)** apart.
- **Styles** in order of use: fade, slide, scale-up (no overshoot), typing, rotate, colour change, stagger lists, morph, rise, zoom-through.
- **Transitions** (UI films): hard cut 87%, push/zoom 65%, match or morph 43%, fade 39%, pan 17%, whip 13%, wipe 9%.
  - Every seam is *designed*: open from something (a fade, a push, the first element arriving) and close on the held end card.
  - Cut on content or on action, not in the middle of a read.
  - Don't pull the camera back just before a cut.

### 6. Typography

Launch films are full of words (76% show text). Type is designed like everything else:
- **One family,** usually a sans. Add a mono for code. Use weights 400/500, and bold only for emphasis.
- **Sizes** (font-size at 1080 px on the short side; `THEME.size`):
  - headline **64** (cap height about 44 px measured)
  - hero numbers and names 96–170
  - titles 40
  - body 26
  - **nothing under 20**, because it must read on a phone
- **Hierarchy:** one dominant line per frame. Accent a word or two (`accent`), never a whole sentence.
- **Alignment:** centre statements, and left-align UI and editorial layouts.
- **Margins:** keep 12% of the width (`Brand.safe()`), and never go under 5%.
- **Contrast:** text at ≥ 7:1 against its background. On footage, **always** put a scrim under it (`Media.scrim`).
- **Wrap on narrow canvases** (square and vertical). Never let a line run off the frame.
- **Text is the message, not the narration.** Show the product doing it and let the words name it. Don't caption what the viewer can already see.
- **Captions** for anything spoken: most feeds autoplay muted.

### 7. Colour and look

- **Light is as common as dark:** 54% of top-tier frames are light. Pick for the brand, and the kit defaults to light.
- **One accent colour** on a near-neutral palette. Saturation is low, with a median of 0.04.
- Radius 28 on cards, soft shadows or none, and flat or softly graded backgrounds.
- No muddy greys: on light grounds keep vignettes faint and gradients within the accent family.

### 8. Formats

- 16:9 by default (91% of films). Square (5%) and vertical (3.5%) exist for social feeds.
- Lay every scene out from `W` and `H`, so one scene renders in all three (`PROJECT.size`). Check each format's sheets: text wraps, nothing crops, and the safe margins hold.
- On narrow canvases, crop in *further* (the component should fill about 95% of the width) and drop side panels that squeeze the content.
- A vertical film needs its **own stacked composition** (headline, component, caption, top to bottom), not a cropped landscape layout ([docs/eval.md](docs/eval.md)).

### 9. Sound

- 71–100% of launch films have sound: a music bed, with effects on the key moments (a click, a pop when a card lands, a chime on the end card).
- Don't sonify every move. Keep effects under the music, and mix to about **−15 LUFS** (`render.mjs` normalises).
- Cuts in top-tier films land on the beat no more often than chance, so the music needn't dictate the edit.
- Declare sound once at scene load (`Sound.*`). Sounds on screen events come from the same times as the visuals (`Sound.clicks(cursorKeys)`, `Media.filmTime`).

### 10. One piece

- **Storyboard first,** in writing, before any scene code (the template is below). If you're working with a person, show it and let them react before you build.
- One look throughout, one idea, and an ending that answers the opening. The question asked at the start is the one the end card resolves.
- Carry elements across seams: the mark that becomes the hub, the card that grows into the next frame.

### 11. Honest

- Use the brief's real product, claims and numbers, never invented ones. With no brief, use a clearly fictional product and say so.
- Use no real third-party logos or brands unless the brief supplies them. Don't reuse reference films' assets: they're for study only.

---

## Workflow

### 1. The brief

- Every film starts from a brief: [projects/_template/brief.md](projects/_template/brief.md).
- For a real brand, make a project folder ([projects/README.md](projects/README.md)) holding the brief, `project.js` (brand, fonts, captions), the supplied `assets/` and the scene.
- If the prompt is only a sentence, write the brief yourself from it. Fill in the one message, audience, length, format, genre and call to action, and flag anything you had to invent.

### 2. Storyboard

Write it before any code: `STORYBOARD.md`, or `projects/<name>/storyboard.md`.

```
Film:    product · the one message · audience · length · format · genre(s)
Look:    light/dark · accent · font · references (whatships films and what to take from each)
Sound:   music bed · the few moments that get an effect
Beats (≈5 s each; reads set the real length):
  1  0.0–4.5   [in: ___]   what's on screen · the event · text on screen (exact words) · camera
       reads: 0.2–1.4  the first thing the viewer must understand
              1.6–3.0  the next (where is the eye when it starts?)
  2  4.5–9.5   [transition: ___]  ...
  ...
  N  t–end     end card: logo → line → call to action, held 3.5–4.5 s   [out: ___]
```

Structures that recur in the catalog, by genre. Adapt them; don't copy them.

| genre | the usual beats |
|---|---|
| UI walkthrough | intro with the product in view → the ask (typing) → the response → 2–3 features, one component each → end card |
| Type-led | cold open line → 2–5 building lines → the turn ("Introducing…") → proof (a number) → end card |
| Screen demo | context → task → result (ramped through the wait) × 2–3 → end card |
| Brand and graphic | a mark appears → it transforms into the idea → lock-up → hold |
| Abstract | emergence → formation → charge → the reveal (name or product) |
| Footage with overlays | cold open line over footage → the problem (a person speaks, captioned) → the product (cut to UI) → proof → end card |

Check the storyboard:
- Is there an event in every beat?
- Does every read fit the reading rule, with no two reads overlapping?
- Is the product on screen in the first second (UI films)?
- Is every seam designed?
- Is the end card held 3.5–4.5 s?
- Is every word on screen necessary?

### 3. Build

- Put the scene in `projects/<name>/scene.js` (or `src/scenes/<name>.js`). Wrap it in an IIFE, end it with `shots([...])`, and register it in [src/scenes/index.js](src/scenes/index.js) with its libs (`mg` for the kit; `clawd`, `jolly`, `human` for characters) and project settings.
- **Build from the kit** (`src/lib/`). Look at its model sheets first ([docs/kit/](docs/kit/), or `studio.html?scene=kit&loop=kit_ui`). Write new components the same way: pure functions of `t`, themed by `THEME`, timed by `anim()` and presets.
- Build and check one beat at a time, in order. Block the layout as stills first (`--sheet` at key times), then add motion.

```js
// projects/my_film/scene.js
(() => {
  const ask = 'Summarize today', t0 = 1.2, end = Type.typed(ask, 1e9, t0).end;
  Sound.typing(ask, t0);                                    // sound at load, from the same times as the visuals
  shots([
    [0, (t, lt) => {
      D.div({ w: W, h: H, bg: THEME.bg });
      Cam.shot(lt, [[0, W / 2, H / 2, 1], [end + .3, W / 2, H / 2 - px(40), 1.2]], () => {   // push in after the ask
        UI.window('app', { x: W / 2, y: H / 2, ax: .5, ay: .5, w: px(1200), h: px(680), ...enter(anim(t, 0, 'panel'), 'rise', 40) }, () =>
          // a window's content area is a flex row: give children a width, or they shrink to their content
          UI.input('ask', { text: Type.typed(ask, t, t0).text, placeholder: 'Ask anything…', focus: anim(t, t0 - .3, 'card'), caret: t > t0 - .2 },
            { w: px(1144), style: { margin: px(28) } }));
      });
    }],
    [6, (t, lt, dur) => Brand.endCard(t, 6, dur)],
  ]);
})();
```

### 4. Look at it: the review loop

You can't see motion by reading code. Render and look at every beat:

```bash
node render.mjs --scene=my_film --sheet=0.2,1,2,3,4,5 --cols=6 --w=320 --out=out/check/sheet.jpg   # the whole shape
node render.mjs --scene=my_film --strip=2.1:2.6 --cols=6 --w=320 --out=out/check/strip.jpg        # EVERY frame of a move
node render.mjs --scene=my_film --sheet=2.4 --crop=760,420,500,400 --w=500 --out=out/check/c.jpg   # full-res detail
node render.mjs --scene=my_film --strip=2:2.6 --crop-at=960,700,500,400 --out=out/check/f.jpg      # follows a world point
```

Open each image and actually look at it. Check:
- **Reads:** render each beat as a sheet every 0.1–0.2 s and read it in order. Where is the eye? Is every line fully readable for its reading-rule time? Do two reads ever overlap?
- **Product and end card:** is the product on screen in the first second? Is the end card held 3.5–4.5 s?
- **Motion:** in strips, look for pops, jumps and snaps between frames. Is there bounce where the genre doesn't want it? Does everything move at once instead of staggering? Is anything stuck at a constant speed?
- **Type:** is it ≥ 20 px, does it keep ≥ 7:1 contrast (with a scrim on footage), does it wrap on narrow formats, and is it clear of the edges?
- **Layout:** are there collisions (a lower third on the caption band, a headline over the product) or empty frames?
- **Transitions:** check the first and last 0.5 s of every beat and every seam.
- **Formats:** check a sheet of every format you deliver.
- **Sound:** after `--clip`, check the loudness (about −15 LUFS) and that each effect lands on its event.

Fix what you find, then look again. **Budget:** a sheet per beat, a strip for every key move and seam, a crop for every piece of small text. Sheets run at about 0.05–1 s a frame, so this is cheap: don't skip it.

### 5. Score it against the top tier

The measurements that set the defaults also score your film. Fix anything flagged, or know why it's different ([docs/eval.md](docs/eval.md)):

```bash
python3 scripts/whatships_craft.py --local out/my_film.mp4 && python3 scripts/eval_scorecard.py my_film
```

### 6. Render

```bash
node render.mjs --scene=my_film --clip --out=out/my_film.mp4       # straight to MP4, sound mixed in
node render.mjs --scene=my_film --frames --workers=4               # or: parallel, resumable frames into out/frames/my_film …
node render.mjs --scene=my_film --encode --out=out/my_film.mp4     # … then encode them, with sound
```

---

## Common failures

These are the things that make a generated launch film look generated. Every one of them happened while building this kit. Check your storyboard and sheets against them:
- two reads at once: a line arriving while the last one is still leaving, a cursor moving while a card lands
- words that leave before they're read (the reading rule)
- the product first seen seconds in, after a slow cold open
- bounce everywhere: `backOut` pops and springs on UI and type
- huge, heavy type: weight 800 at 100 px+ for ordinary lines, or three typefaces
- dark and saturated by default, when the brand or the catalog says light and quiet
- the whole app on screen at once, with 14 px text nobody can read
- text over footage with no scrim, or captions and lower thirds on the same line
- a camera that pulls back just before a cut, or moves that end without a hold
- a headline that runs off a square or vertical frame
- muddy grey gradients and vignettes on light grounds
- an effect on every move, or effects louder than the music
- an end card that's gone in a second
- invented claims, numbers or third-party logos
- the whole app shown small in a wide frame for seconds on end, when the camera should crop to the component (the first `launch_demo`)
- a highlight or lit element that switches before its word arrives, while the last word is still leaving
- a diagram that disappears when the words start, instead of the words acting on it (the first `relay_demo`)
- a crop-in computed from width only, which stays at 1× on vertical
- a film with no sound, when 83% of the top tier has it

For character cartoons, see also the failures in [docs/character_guide.md](docs/character_guide.md).

---

## Engine

### Files

| file | what's in it |
|---|---|
| `src/config.js` | `PROJECT` defaults: `scene, duration, bpm, offset, style, canvasBg, size, theme, brand, fonts, audio` |
| `src/scenes/index.js` | the scene manifest: each scene's file, libs, project folder (`dir`) and settings |
| `src/core.js` | canvas, timing and motion helpers, `paint()`, camera, effects, `glow()`, lettering, render hooks, `character()` |
| `src/dom.js` | the DOM layer: HTML, CSS and SVG as a second surface, including frame-exact `D.video` |
| `src/timeline.js` | `shots()` (with `xfade`), `LOOPS`, `brushWipe()` |
| `src/lib/` | the motion-graphics kit: theme, motion, type, ui, cursor, shapes, fx, camera, transitions, brand, media, audio |
| `src/clawd.js`, `src/jolly.js`, `src/human.js` | characters (see [docs/character_guide.md](docs/character_guide.md)) |
| `projects/<name>/` | a film's brief, `project.js`, `assets/` and `scene.js` ([projects/README.md](projects/README.md)) |
| `studio.html` | scrub or play a scene: `?scene=name`, `?t=2.5`, `?loop=name`; space plays |
| `render.mjs` | headless renderer: sheets, strips, crops, stills, PNG loops, frames, MP4 with mixed sound |
| `scripts/` | the What Ships research pipeline, the effect and demo-asset generators, and the video-frame check |

### Frames are pure functions of time

- **Frames render in parallel and out of order.** A shot is `fn(t, lt, dur)` and must draw the same frame for the same `t`, every time. No state carried between frames, no counters, no `Math.random()`, no physics that integrates frame by frame. Compute everything from `t`, in closed form (the helpers below do this for you).
- Randomness: `hash(i)` for stable per-object values, and `jit(a)`/`random()` for boil (they change 12 times a second).
- **Painted (p5.brush) scenes: seed each element with `boilSeed(key)`.** Each boil drawing holds for two frames, so anything that isn't moving must draw the same in both. But a moving thing uses a different amount of randomness each frame, which shifts the stream for everything drawn after it, and all of that re-boils every frame and looks jittery.
  - `boilSeed(key)` restarts the stream from the boil frame and a key that stays the same every frame (any string or number, unique within the frame).
  - Call it before each separate element: each background layer, prop and effect.
  - `clawd()` seeds itself and each of its parts, then reseeds when it's done, so nothing drawn after it depends on its pose. Its key is its call order; set `boilKey` if characters come and go mid-shot.
- **Each shot paints the whole frame,** background included. The paper texture is under everything and the grain is multiplied over the top, so leaving paper showing is a valid look.
- **Canvas:** `W × H` from `PROJECT.size` (1920 × 1080 by default), origin top-left, y down.
- `LOOPS.name = t => {...}; LOOPS.name.len = 4;` makes a standalone loop (tests, GIFs, sheets), rendered with `--loop=name`.

### DOM layer (HTML, CSS, SVG)

For product UI, typography and motion graphics, the browser draws better than paint: real fonts, blur, shadows, glass, gradients and 2.5D tilts. [src/dom.js](src/dom.js) makes the page itself a second drawing surface, and it keeps the rule above: **a frame is a pure function of `t`.**

- **Immediate mode, like p5.** Each frame, the shot *declares* everything on screen, in paint order (later is on top). The engine reuses last frame's elements, applies this frame's props and removes whatever wasn't declared. Nothing a shot set on an earlier frame survives unless the shot sets it again.
- **Motion only through `t`.** CSS animations and transitions are switched off under the stage, and SVG animation is paused. Animate by computing props from `t` with the same helpers as always (`seg`, `ease`, `kf`, `spring`, …).
- **Calls** (kids is a function that declares the children; every key is optional):
  - `D.div(key?, props?, kids?)`: a box. Its children flow, so flexbox and grid layouts work.
  - `D.group(key?, props?, kids?)`: a layer the size of its parent. Its children are placed absolutely at `x, y`.
  - `D.text(key?, str, props?)`, `D.img(key?, src, props?)`.
  - `D.svg(key?, props?, kids?)` with `D.path`, `D.circle`, `D.rect`, `D.g`, `D.linearGradient`, `D.stop`, … inside it, taking SVG `attrs`.
  - `D.el(tag, key?, props?, kids?)`: any element.
  - `D.cam(cx, cy, zoom, rot, kids)`: a camera. World point `(cx, cy)` lands at screen centre, with the same maths as `camBegin`, and `--crop-at` follows it.
  - `D.canvas()`: the p5 painting, at this point in the paint order.
- **Props:**
  - `x, y` position, `w, h` size, and anchor `ax, ay` (0..1 of the element's own size; `.5, .5` centres it on `x, y`).
  - `scale`, `sx`, `sy`, `rot` (degrees), and `rx, ry` (a 2.5D tilt; give a parent `persp`).
  - `opacity`, `blur` (px), and the shorthands `bg`, `color`, `radius`, `shadow`, `font`.
  - `style` (any CSS), `cls`, `attrs`, `text` / `html`, and `pos: 'abs' | 'flow'`.
  - Transforms come from these props, so don't put `transform` in `style`: it would replace them.
- **Mixing with p5:** set `canvasBg: null` in the scene's project settings so the painting is transparent (no paper, no grain), then call `D.canvas()` between DOM layers, for example a DOM background, then p5 particles, then a DOM card. A frame that declares DOM but no `D.canvas()` hides the painting. Pure p5 scenes are unaffected.
- **Fonts:** list Google Fonts families in the scene's project settings (`fonts: ['Inter:wght@400;600;800']`). They load, and every listed weight is preloaded before the first frame. Images from `D.img` are decoded before a frame is captured. CSS `background-image` URLs aren't waited for, so use `D.img` for pictures.
- **Capture:** `render.mjs` screenshots the stage for frames with DOM and reads the canvas for pure p5 frames. All the flags work the same for both. Canvas frames are byte-identical from run to run; DOM frames can differ by ±1/255 of raster noise between Chrome runs, which is invisible.
- **Engine test:** [src/scenes/mg_demo.js](src/scenes/mg_demo.js) was built before the measured spec to exercise the DOM layer. Its bouncy pops, heavy type and dark look break the defaults above, so don't learn style from it; learn from the kit examples.

### Motion-graphics kit (`src/lib/`)

For launch films, UI and type, build from the kit rather than raw `D.*` calls. Load it with the `mg` lib in the scene manifest. Its defaults are **measured** from top-tier launch films ([docs/motion_design_spec.md](docs/motion_design_spec.md)), so a scene built from it starts out looking like one.

- **`theme.js`:** `THEME` holds the colours (light by default, or `PROJECT.theme = 'dark'`), one font, the type sizes (headline 64), the weights (400/500), radius 28, and a margin of 12% of the width. `PROJECT.brand` overrides any of them. `px(n)` scales a 1080-based size to the canvas.
- **`motion.js`:**
  - `anim(t, t0, preset)` gives eased progress. The presets: `default` .55 s ease-in-out, `card` .38 s fast ease-out, `panel`, `text`, `camera`, `exit`.
  - `life(t, tIn, tOut)` gives an in-then-out envelope.
  - `enter(k, 'rise' | 'slide' | 'scale' | 'fade' | 'blur')` gives entrance props. Spread them after an element's own props: they only use the `dx`/`dy` offsets, so its position stays put.
  - `MOTION.stagger` is 4 frames, and `MOTION.hold` is 1.25 s.
  - **No preset overshoots,** because 97% of top-tier moves don't. `playful` (`backOut`) is opt-in.
- **`type.js`:**
  - `Type.line`, and `Type.words` (staggered, with accent words and a highlighter sweep).
  - `Type.swap` (replace in place) and `Type.counter`.
  - `Type.typed(str, t, t0, cps)` types at a human pace with a fixed jitter.
- **`ui.js`:** `UI.window` (mac or browser chrome), `card`, `input` (prompt bar with focus, caret and submit), `button`, `chip`, `avatar`, `row`, `check`, `bars`, `progress` and `icon`. They draw state; you compute the state from `t`.
- **`cursor.js`:** `Cursor.draw(key, t, keys)`. Each key gives the time the pointer *arrives*. It leaves just early enough for a move sized to the distance, travels on a gentle arc, and clicks with a press and a ripple.
- **`shapes.js`:** inside `Shape.layer()` (a full-canvas SVG in world coordinates):
  - `Shape.stroke` draws a path on (any path, exactly), and `Shape.lerpPath` morphs between two paths.
  - `Shape.arcPath` and `Shape.dial` for arcs and gauges.
  - `Shape.connector` draws a curved hub-to-spoke line, and `Shape.orbit` gives positions on an ellipse.
  - `Shape.ring` draws a circle on.
- **`fx.js`:**
  - `FX.gradient` (a slowly moving soft field), `FX.glow`, `FX.grain` (re-seeded 12 times a second) and `FX.vignette`. Keep vignettes faint on light grounds.
  - `FX.particles` is painted by p5 on the canvas layer (needs `canvasBg: null` and `D.canvas()`). It's closed-form: seeded homes and drift, forming on `targets` over `form: [t0, t1]` and bursting apart over `burst`. Get targets from `FX.sample.ring`, `.grid` or `.text` (points inside a word's glyphs).
- **`camera.js`:**
  - `Cam.at` / `Cam.shot(t, [[t, cx, cy, zoom], ...], kids)`: keyframed camera. It holds at each key and moves into the next over `MOTION.camera`, plus a slow drift.
  - `Cam.layer(depth, kids)`: parallax inside a camera. `Cam.dof(depth, focus)` blurs by distance from the focal plane (a rack focus).
- **`transitions.js`:**
  - Covers, drawn last across a seam with the cut at `p = .5`: `Tx.dip`, `Tx.wipe`, `Tx.iris`, `Tx.grid`.
  - Moves, as props for each side's content group: `Tx.whip` and `Tx.zoom`.
  - `Tx.rect(a, b, k)` for a shared element moving between layouts.
  - A **real cross-dissolve** is a shot option: `[t0, fn, { xfade: .6 }]` in `shots()`. The previous shot keeps drawing underneath while this one's DOM fades in.
- **`brand.js`:**
  - Everything reads `PROJECT.brand = { name, tagline, cta, url, logo: { d } | { src } }`.
  - `Brand.mark`, and `Brand.lockup`: the mark lands and the wordmark slides out from behind it.
  - `Brand.endCard(t, t0, dur)`: lock-up, then line, then call to action, held, then a fade. End cards hold 3.5–4.5 s.
  - `Brand.partner` ("A × B"), and `Brand.safe()` for the safe area.
- **Characters:**
  - `clawd.js` and `jolly.js` live in namespaces (`Clawd`, `Jolly`) with one interface: `draw`, `feel`, `emotions`, `move`, `turn`, `EMO`.
  - The first kit loaded also owns the plain globals, so one-character scenes read as before.
  - To put two characters in a scene, list both libs and call the second through its namespace. See [src/scenes/duo.js](src/scenes/duo.js).
- **Model sheets:** every part of the kit is on a loop at `studio.html?scene=kit&loop=kit_motion` (and `kit_type`, `kit_ui`, `kit_shapes`, `kit_fx`, `kit_transitions`, `kit_brand`). Stills are in [docs/kit/](docs/kit/). Look at them before building.
- **Canvas size:** `PROJECT.size` is `'landscape'` (default), `'square'`, `'portrait'` or `[w, h]`. Lay scenes out from `W` and `H` so one scene renders in every format.
- **Examples** (each one idea, not a template):
  - [src/scenes/launch_demo.js](src/scenes/launch_demo.js) (`?scene=launch_demo`, and its `_square`, `_vertical` and `_dark` variants): a 24 s UI walkthrough.
  - [src/scenes/relay_demo.js](src/scenes/relay_demo.js): a 20.5 s brand-and-type film, with particles, a zoom-through, a hub with connectors, a cross-dissolve, word swaps, a grid cover and an end card.

### Media and sound (supplied footage, recordings, music)

A film for a real brand lives in a project folder, [projects/<name>/](projects/README.md), with its `brief.md`, `project.js` (brand, fonts, captions), `assets/` and `scene.js`. Start from the brief, and storyboard only from what it says and what `assets/` holds.

- **Video is frame-exact.** `D.video(key, src, mediaTime)` seeks every frame to its media time and waits for it before capture. `node scripts/check_video_frames.mjs` proves it.
- **`Media.clip(key, asset('x.mp4'), t, o)`:**
  - Timing: `o.at` (when it starts in the film), `o.from`, `o.rate`, `o.loop`, or `o.ramp: [[filmTime, mediaTime], ...]` for a speed ramp. Hurry through the waits in a recording, and play the actions at 1×.
  - Look: `o.treat` (`dim`, `saturate`, `contrast`, `gray`, `warm`, `blur`) and `o.kb` (Ken Burns).
  - `Media.filmTime(m, o)` inverts the timing, so a sound can land on a recording's click.
  - `Media.still` places an image the same way.
- **Over footage:**
  - `Media.scrim` makes text legible: always put one under text on footage.
  - `Media.duotone` for a colour wash.
  - `Media.lowerThird` for a name tag. It sits above the caption band.
  - `Media.captions(key, t, cues)` for captions: cues come from `Media.parseVTT(PROJECT.captionsVTT)`, and optional word timings highlight the word being said. `style: 'bold'` gives big, centred social captions.
  - `Media.device(key, 'phone' | 'tablet' | 'laptop' | 'browser', props, kids)` frames a recording or a rebuilt UI.
- **Sound** is declared once at scene load, never inside shots, and `render.mjs` mixes it into `--clip` and `--encode`, normalised to −15 LUFS:
  - `Sound.music(src)`, `Sound.sfx(t, 'click' | 'tick' | 'pop' | 'whoosh' | 'chime' | 'type')` (the library is made by `scripts/make_sfx.mjs`) and `Sound.clip(t, src, { from, dur })`.
  - `Sound.clicks(cursorKeys)` gives one click per cursor click, and `Sound.typing(str, t0, cps)` gives taps along a `Type.typed` run.
  - Keep effects under the music's impact and don't sonify every move. Cuts in top-tier films don't follow the beat, so the music needn't dictate the edit.

### Time and motion (all pure functions of t)

- **Progress and keys:**
  - `seg(t, a, b)`: 0..1 progress through [a, b]
  - `kf(t, [[t0, v0], [t1, v1], ...], ease)`: keyframes; values may be arrays
  - `lerp`, `clamp`, `frac`, `wob(t, freq, phase)`, `TAU`
- **Easing:** `ease`, `easeIn`, `easeOut`, `backOut` (overshoot) and `elasticOut`.
- **Rhythm:** `BEAT` (seconds per beat), `bpOf(t)` (beat position), `beatN(t)` (beat number), and `pulse(t, k)` / `pulse2(t, k)`, which are 1 on each beat (or eighth) and then decay.
- **Acting:**
  - `jump(t, t0, t1, h)`: crouch, stretch, arc and squash-land. Returns `{dy, sq}`.
  - `take(t, t0, amt)`: a surprise take, returns `{sq, dy}`.
  - `stroll(t, t0, t1, x0, x1, u)`: an eased walk. Returns `{x, walk, view, flip, dy}`.
  - `spring(t, t0, k, w)`: a damped wobble after an event, for settles and follow-through.
  - `ring(t, [t0, t1, ...])`: one `spring` kick per event time.
  - `arcPt(p0, p1, h, k)`: a point on a thrown arc.
  - `onTwos(t)`: holds each drawing for two frames. Wrap a shot's `t` in it for a snappier, hand-drawn feel.
- **Camera:**
  - `camBegin(cx, cy, zoom, rot)` … `camEnd()`: world point (cx, cy) lands at screen centre. One level only; always pair them.
  - `toScreen(x, y)`: world → screen while a camera is active. Use it to aim an iris at a character.
  - `shakeXY(t, amount)`: [dx, dy] to add to the camera on impacts.
- **Full-frame effects** (screen space, after `camEnd()`):
  - `brushWipe(p, [c1, c2])`: fat strokes cover the frame (p 0 → .5) and then drag off (.5 → 1). Cut under full cover. Its comment in timeline.js shows the two calls.
  - `iris(cx, cy, r, colour)` and `irisShape(pts, colour)`: shaped reveals.
  - `flash(k, colour)`: a full-frame flash.
- **Lettering** (only if you must, see "No text"):
  - `letter(txt, x, y, size, colour, {pop, rot, alpha, screen})`
  - `sfx(txt, x, y, size, colour, age)`
  - Both are composited at `flushLetters()`, after the shot. If a wipe or iris must cover them, call it yourself first.


### Painting (p5.brush)

Painted scenes (`style: 'painted'`) draw with `paint()` and `inkLine()` on p5.brush. The reference and its quirks are in [docs/character_guide.md](docs/character_guide.md#painting-p5brush). The clean style (`style: 'clean'`) draws the same calls as crisp vectors, and it's what motion-graphics scenes use for their canvas layer (particles, light).

---

## Examples

Each is one idea, not a template. Don't reuse their stories, products or layouts.

| scene | what it shows |
|---|---|
| `launch_demo` (+ `_square`, `_vertical`, `_dark`) | a 21.6 s UI walkthrough built only from the kit: the product from the first frame, a crop-in to the prompt, typing and clicks with sound, the answer writing on, a full-frame type beat, the number, the end card (revised after [docs/eval.md](docs/eval.md)) |
| `relay_demo` | a 20.5 s brand and type film: particles forming a ring, a zoom-through, a hub with connectors whose ring turns to each word's tool, a grid cover, the end card, with sound |
| `footage_demo` ([projects/demo](projects/demo/)) | a 21 s footage-led film: type over footage, a screen recording in a laptop with a speed ramp and synced clicks, captions, a lower third, a mixed soundtrack |
| `booked` | a 30 s character film (Jolly) with a product moment |
| `clawd` | the 11 s painted Clawd cartoon |
| `duo` | two characters in one scene through their namespaces |
| `kit` | the kit's model sheets (`?loop=kit_ui`, …) |
