# Genre recipes

How launch films in each visual family are made, for an agent building one with this engine. They're drawn from
**the whole What Ships catalog**: all 2,221 films were tagged from their poster frames and sorted into families
(`refs/whatships/visual.md`, `refs/whatships/genres.md`), and 16 representatives per family were studied.

**What the evidence covers.**
- The shares, backgrounds, text and overlays are measured over **every** film in a family, from its poster frame.
- The films themselves were measured for a sample, with each video deleted right after measurement:
  - Pacing and beat structure for 213 films: [refs/whatships/pacing.md](../../refs/whatships/pacing.md).
  - Motion, design and sound craft for 36 top-tier films: [refs/whatships/craft.md](../../refs/whatships/craft.md).
  - The numbers these give are collected in [docs/motion_design_spec.md](../motion_design_spec.md), and they override
    anything in the recipes below that conflicts with them.
- **The biggest correction:** top-tier films almost never overshoot (97% of moves have none). Where a recipe suggests
  `backOut` or springs, use a smooth ease-in-out or ease-out unless the brief is playful.

| family | films | share | median length | code can make it (yes / partial / no) | recipe |
|---|---|---|---|---|---|
| Product UI walkthrough | 382 | 17.2% | 0:37 | 366 / 16 / 0 | [ui_walkthrough.md](ui_walkthrough.md) |
| Type-led announcement | 317 | 14.3% | 0:49 | 317 / 0 / 0 | [type_led.md](type_led.md) |
| Screen-recording demo | 267 | 12.0% | 0:39 | 0 / 267 / 0 (needs the recording, or a rebuilt UI) | [screen_demo.md](screen_demo.md) |
| Brand and graphic motion | 143 | 6.4% | 0:40 | 141 / 2 / 0 | [brand_graphic.md](brand_graphic.md) |
| 3D product and scene | 106 | 4.8% | 0:35 | 0 / 43 / 63 (stylised partial, photoreal no) | [stylised_3d.md](stylised_3d.md) |
| Illustrated and character | 58 | 2.6% | 0:42 | 50 / 8 / 0 (the Clawd and Jolly kits live here) | [illustrated.md](illustrated.md) |
| Abstract and atmospheric | 55 | 2.5% | 0:38 | 53 / 2 / 0 | [abstract.md](abstract.md) |
| Footage-led (people, product, b-roll, type over footage) | 877 | 39.5% | 1:00–1:24 | 0 / 22 / 855 (the footage; its overlays are code) | [footage_overlays.md](footage_overlays.md) |

Exact counts per family, with 16 cited representatives each, are in [refs/whatships/genres.md](../../refs/whatships/genres.md).

## Beyond launch films

These are measured the same way, over about 50 curated reference films each (awards, curators, recognised studios),
in [refs/genres_ext/measured.md](../../refs/genres_ext/measured.md):

| genre | films | length | beat | cuts/min | recipe |
|---|---|---|---|---|---|
| Explainer | 50 | 3 min | 16 s | 17 | [explainer.md](explainer.md) |
| Tutorial | 46 | 4 min | 16 s | 6.5 | [tutorial.md](tutorial.md) |
| Data story | 43 | 5.5 min | 24 s | 2.7 | [data_story.md](data_story.md) |
| Lyric video | 48 | 3.75 min | 19 s | 25 | [lyric_video.md](lyric_video.md) |

## What holds across every family

- **Words on screen are the norm.** 75.7% of all films show text, and 10.9% are dominated by it. The Clawd guide's
  "no text" rule is right for character cartoons and wrong for launch films.
- **Light is as common as dark.** Across the catalog, 25.5% of backgrounds are light and 23.7% dark. For UI films it's
  50% light and 28% dark. Don't default to a dark look; pick the one the brand calls for.
- **Landscape 16:9 dominates** (91%), but 5% are square and 3.5% vertical. The engine must render 1:1 and 9:16 too
  (Phase 2).
- **Designed films are short.** The code-makeable families have a median of 35–49 s, with most between 20 s and 75 s.
  Footage-led films run longer (a median of 1:00–1:24).
- **Cursors are a genre signature.** They appear in 22–24% of UI films. A good cursor (arcs, clicks, drags) is a
  first-class component.
- **Footage films are rarely bare.** 63% carry designed overlays: text, captions, logos, UI. That's the compositing
  work of Phase 3.
