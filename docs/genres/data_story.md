# Data story

A film whose story is told through data: animated charts, maps, counters and annotations, usually narrated, building
one insight at a time. It's the most code-makeable of the new genres, and the slowest and most deliberate.

**Measured** over 43 reference films (awards such as Information is Beautiful and recognised data teams), in
[refs/genres_ext/measured.md](../../refs/genres_ext/measured.md). Maths animations were left out
([refs/genres_ext/curation.json](../../refs/genres_ext/curation.json)).
- **Length:** median 5.5 min (middle half 2.7–8.6 min). A beat lasts about **24 s** (12–45), with 12 per film.
- **The slowest genre:**
  - Hard cuts: 2.7 a minute, against launch films' 10.
  - Moves: 1.9 every 10 s, against 4.3.
  - Holds of 2 s or more: **41%**.
  - Pace: 40% of films are rated slow.
  - Motion stays smooth and even: moves take 0.62 s with a balanced easing centre (0.50).
- **Look:** dark backgrounds are common (only 31% light), saturation is 0.13, and contrast is high (10.6:1).
- **Charts used** (share of films): maps 53%, line 35%, bar 35%, pictogram 33%, timeline 30%, counter 30%, scatter 21%.
  Annotations appear in **88%**, and the source is shown in 53%.
- **Opening and ending:** films open on a hook (53%) or a title (28%), with text on screen from 0 s. More than half end
  on the source.

## What it looks like (references)
- **A map as the stage**, with data moving across it: [Kiln's shipping map](https://www.youtube.com/watch?v=oyOwm5TUDYc)
  (Information is Beautiful Gold) and [Charting Culture](https://www.youtube.com/watch?v=4gIhRkCcD4U) (Nature).
- **Motion-graphics economics:** [WSJ, How the Fed Steers Interest Rates](https://www.youtube.com/watch?v=AkMsMDk_brU).
- **Scale and wonder:** [Kurzgesagt, Everything You Need to Know About Planet Earth](https://www.youtube.com/watch?v=JGXi_9A__Vc)
  (Information is Beautiful Bronze).
- **Data as art:** [Stephen Malinowski's graphical score](https://www.youtube.com/watch?v=02tkp6eeh40).
- Every film, with its reason for inclusion: [refs/genres_ext/index.md](../../refs/genres_ext/index.md#data_stories).

## Beats
1. **Hook** (the first beat runs about 18 s): a surprising number, a question, or a map that sets the stakes.
2. **Context:** what's being measured, and why it matters.
3. **Chart reveal:** build it in this order, one step at a time, each held until it's read.
   1. The frame: the axes or the map.
   2. The unit, named.
   3. The data, growing into place.
   4. The one thing to notice, annotated.
4. **Comparison and insight** (56% and 81% of films): add a second series or highlight one. Say what it means in words
   on screen, next to the mark it's about.
5. **Story:** a person or case that makes the number concrete (77%).
6. **Conclusion, then the source.**

## Motion and look
- **Hold long.** The measured median hold is 1.6 s, and 41% of holds run 2 s or more. A viewer needs time to read an
  axis, find the mark and compare. The reading rule applies to every label.
- **One change at a time:** a bar grows, *then* the label lands, *then* the annotation. Never all three together.
- **Transitions:** mostly cuts, plus pushes into a region of a chart or map (42%), dissolves (42%), and morphs of one
  chart into the next (40%). A morph between charts is the signature move: the same data re-encoded.
- **Camera:** static, or a slow pan or push across the map (about half of films). Zoom-out reveals appear in 42%.
- **Colour:** muted, with one or two highlight colours for the series that matters. Grey out everything else.

## Engine
- **Have `lib/chart`** (`src/lib/chart.js`):
  - axes that draw on, and the unit
  - line and area series that grow, with recoloured stretches
  - bars that grow, with highlight and mute, and can be born from another encoding's rects (a morph)
  - annotations with leader lines, and bracketed differences
  - pictograms, and GeoJSON projection (equirectangular or Mercator) for maps
  - the source line
- **Also have:** `Type.counter`, shapes, `FX.particles` (flows), the camera, transitions and `Tx.rect` (layout morphs).
- **Worked example:** `src/scenes/data_story_demo.js` ("427", 51 s, real NOAA Mauna Loa data). Render it with `node render.mjs --scene=data_story_demo --clip`.
  Measured against the genre: 1.8 moves every 10 s (genre 1.9), moves of 0.5 s with a balanced easing centre, holds of
  1.4 s (1.6), 42% of holds 2 s or more (41%), contrast 8.9:1 (10.6). Its two hard cuts are between dark, sparse
  frames, and the cut detector doesn't count them.
- **Still missing:** a bundled world or country GeoJSON (supply it with the project), a timeline scrubber, and
  choropleth colour scales.
- Sources on screen are ordinary type: small, muted, held on the last beat.

## Pitfalls
- Everything animating at once. It's the opposite of this genre's pace.
- A chart without a named unit or axis.
- More than two highlighted series.
- Numbers that change before they've been read.
- Invented data. Use the brief's data, and show where it came from.
