# Motion and design spec (measured)

The default numbers Phase 2's presets and design tokens will use. Every number comes from measurement:
- [refs/whatships/craft.md](../refs/whatships/craft.md): 36 top-tier films, with 742 moves measured automatically,
  198 key moves read frame by frame, and 141 full-resolution stills.
- [refs/whatships/pacing.md](../refs/whatships/pacing.md): 213 films across all visual families.

The top tier is films by the site's listed studios, the curated Motion category, and design-led product teams
(`refs/whatships/top_tier.json`). The videos were downloaded, measured and deleted.

These are **defaults, not rules**. A brief can ask for a bouncy, loud or maximal look. But when nothing says
otherwise, this is what the best films do.

## Motion

| | measured | default preset |
|---|---|---|
| Move length | median 0.58 s (middle half 0.38–0.96 s); settles in 16 frames (10–25) | `dur: .55`, with a range of .4–.95 |
| Easing shape | 56% balanced, 28% front-loaded, 16% back-loaded | default `inOut` (cubic) |
| Cards and panels | cards: 100% fast start, 9 frames (6.5–15); UI panels: 57% fast start, 16 frames | `card`: easeOut (quart), .38 s; `panel`: easeOut, .65 s |
| Text | 19% fast start, 15.5 frames | `text`: inOut, .65 s |
| Camera | 18 frames (12–26), 33% fast start | `camera`: inOut, .75 s. Continuous pushes use slow linear-in-out drifts |
| Overshoot | **97% none**, 3% slight | **off by default.** `backOut`, springs and squash are reserved for character and playful briefs |
| Stagger | 4 frames (3–5.75), 0.17 s | `stagger: 4/24` s |
| Speed peaks | 28% of moves have several (staggered groups); 0.17 s apart | matches the stagger |
| Motion blur | 19% of key moves | off by default; on for whips and fast slides |
| Holds between moves | 1.25 s (0.79–2.08 s); 28% of holds ≥ 2 s | after a move lands, hold ≥ 1.25 s before the next read |
| Density | 4.1 moves per 10 s | about one new move every 2.5 s |

**Styles in use** (share of key moves): fade 32%, slide 32%, scale-pop 20%, scale-down 20%, typing 16%, rotate 15%,
colour change 14%, stagger list 13%, morph 12%, rise 11%, zoom-through 11%, blur-in 6%, draw-on and mask reveal 3%
each. Library priority follows this order.

"Scale-pop" here means a scale-up **without** overshoot (overshoot is 3% overall).

## Pacing (213 films)

| | measured (medians) | default |
|---|---|---|
| Beat (one unit of content) | 4.6–6.0 s across families | one beat about every 5 s; a 30 s film has about 6 beats |
| Time between hard cuts | 1.1–2.7 s (UI walkthroughs 2.7 s; 3D and type 1.1–1.3 s) | cuts inside beats are fine; UI films cut least |
| Product first on screen | at 0 s in UI, screen and graphic films | **show the product in the first second**; no slow cold open for UI films |
| First text | at 0–1 s in most designed families (3D at 2 s) | text from the first second |
| End card | in 65–88% of designed films (screen demos only 33%), lasting 3.3–4.6 s | end card, held 3.5–4.5 s |
| Length | 31–49 s for designed families | 20–60 s |
| Sound | 71–100% have sound; loudness −13 to −19 LUFS by family | music bed, mastered around −15 LUFS |

## Sound

- 30 of 36 top-tier films have music with a clear tempo. The median is 110 BPM, with the middle half at 74–128 BPM.
- **Cuts don't land on beats** more than chance: 20% of cuts fall within ±70 ms of a beat, against 26% by chance.
  Move starts behave the same. Beat-matching cuts is not a top-tier norm, so the guide's "put the hits on beats"
  becomes optional. The tempo estimate has some error, so treat this as "no strong beat-sync" rather than
  "never sync".

## Design

| | measured | default token |
|---|---|---|
| Background | light 54%, dark 38%; flat 47%, gradient 27%, image 14%, texture 12% | light theme by default; flat or a soft gradient |
| Typefaces | 1 per frame; sans 96%, mono 12%, serif 9% | one sans family, plus mono for code |
| Weights | regular 77%, medium 37%, bold 27% | body regular, headline medium; bold for emphasis only |
| Headline | cap height 44 px at 1080p (28–72) | font-size about 64 px (cap height ≈ 0.7 × size); range 40–100 px |
| Smallest text | cap height 14 px (10–23) | font-size ≥ 20 px |
| Alignment | centred 49%, left 30%, mixed 19% | centred for statements, left for UI and editorial |
| Margin | 13% of width to the nearest edge (5–25%) | safe margin 12% (≈ 230 px at 1920), never under 5% |
| Corner radius | 28 px at 1080p (17–52) | `radius: 28` (cards), 16 (small), 48 (large panels) |
| Shadow | none 58%, soft 27%, glow 15% | none, or one soft shadow |
| Colour | saturation 0.04 (0–0.17); 6 colours ≥ 2% of frame; accents 1 (0–2) | near-neutral palette plus **one accent** |
| Contrast | 7.7:1 between darkest and lightest 1% (2.2–17.5) | text at ≥ 7:1 against its background |
| Density | sparse 57%, medium 27%, dense 16% | sparse: one focal element per frame |

## What this changes in the repo

- **`mg_demo` breaks several of these defaults**: `backOut` pops everywhere, 104 px weight-800 headlines, a saturated
  dark look, and the product first seen at 3 s. It stays as an engine test. Phase 2 components follow this spec, and a
  new demo will be built on them.
- **The Clawd guide's motion rules** (squash and stretch, overshoot, anticipation) are right for character animation
  and wrong as launch-film defaults. Phase 4 splits them by genre.

## Limits

- The motion figures use frame differences as a speed proxy. Settle and overshoot come from vision agents reading
  every frame. Several strips hold more than one move, and the agents flagged these in their notes.
- 36 films is a small top tier. Widen it (`top_tier.json`, then re-run `whatships_craft.py`) before treating edge
  cases as rules.
- Stills come from the longest holds, so they show composed end states, not transitional frames.
