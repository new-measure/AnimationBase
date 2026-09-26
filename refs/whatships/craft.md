# Craft of top-tier launch films: measured

36 films from `refs/whatships/top_tier.json` (listed studios, the Motion category, design-led product teams),
28.8 minutes in all. Videos were downloaded to a temp file, measured and deleted (scripts/whatships_craft.py).
Automatic measures come from frame differences at 24 fps; the rest from a vision pass over every-frame strips of
198 key moves and 141 full-resolution stills. Medians, with the middle half in brackets.
Move timings leave out 46 hard-cut strips; type and layout figures leave out 28 stills with no text.

## Motion (automatic, every move in every film)

- **Moves:** 709 short moves (≤ 2.5 s) and 33 long drifts; 4.1 moves per 10 s.
- **Move length:** 0.58 s (middle half 0.38–0.96 s).
- **Easing shape** (where a move's energy centres: 0 = start, 1 = end): 0.49 (middle half 0.44–0.53). Front-loaded (ease-out, centre < 0.45): 28%; balanced (ease-in-out, 0.45–0.55): 56%; back-loaded (ease-in, > 0.55): 16%.
- **Peak speed at** 0.45 (middle half 0.25–0.67) of the move.
- **Several speed peaks** (staggered groups or bounces): 28% of moves; gap between peaks 0.17 s (middle half 0.12–0.33 s).
- **Holds** (≥ 0.5 s near-still between moves): 1.25 s (middle half 0.79–2.08 s); 28% of holds last 2 s or more.
- **Hard cuts:** 15.8 a minute.

## Motion (vision, key moves frame by frame)

- **Frames to settle:** 16.0 frames (middle half 10.0–25.0 frames) at 24 fps (38 moves still changing at the end of their strip are left out).
- **Fast start (ease-out):** 39% of key moves.
- **Overshoot:** none 97%, slight 3%.
- **Stagger** between items in a group: 4.0 frames (middle half 3.0–5.75 frames) (25% of key moves are staggered groups).
- **Motion blur:** 19%.
- **Styles:** fade 32%, slide 32%, scale_pop 20%, scale_down 20%, typing 16%, rotate 15%, color_change 14%, stagger_list 13%, morph 12%, rise 11%, zoom_through 11%, blur_in 6%, draw_on 3%, mask_reveal 3%, fall 2%, wipe 2%, particles 1%, flip 1%.
- **Actions:** enter 34%, transform 32%, camera_move 27%, exit 7%.

| element | moves | frames to settle | fast start | overshoot slight/clear | stagger frames |
|---|---|---|---|---|---|
| camera | 24 | 18.0 (11.75–26.0) | 33% | 0% | None |
| ui_panel | 23 | 16.0 (12.5–22.5) | 57% | 0% | 4.0 |
| text | 16 | 15.5 (10.75–23.5) | 19% | 6% | 4.0 |
| shape | 12 | 12.5 (5.75–21.5) | 50% | 17% | None |
| card | 10 | 9.0 (6.5–14.75) | 100% | 10% | 2.5 |
| mixed | 8 | 18.0 (15.5–27.75) | 38% | 12% | 3.5 |
| image | 8 | 28.0 (20.25–32.25) | 0% | 0% | 3.0 |
| logo | 7 | 16.0 (8.5–17.0) | 43% | 0% | 5.5 |
| character | 4 | 13.0 (12.5–13.25) | 75% | 0% | None |
| icon | 2 | 17.0 (11.5–22.5) | 50% | 0% | 9.0 |

## Sound

- 30 of 36 films have a soundtrack with a detectable tempo: 110.0 BPM (middle half 73.8–127.65 BPM).
- **Cuts on the beat** (±70 ms): 0.2 (middle half 0.04–0.34) of cuts, against 0.26 (middle half 0.17–0.3) by chance.
- **Move starts on the beat:** 0.24 (middle half 0.14–0.28), against the same chance.

## Design (automatic, full-resolution stills)

- **Background:** light (luminance > 0.5) in 54% of stills, dark (< 0.1) in 38%.
- **Contrast** (darkest vs lightest 1%): 7.7:1 (middle half 2.2–17.5:1).
- **Saturation:** 0.04 (middle half 0.0–0.17). Colours covering ≥ 2% of the frame: 6.0 (middle half 4.0–7.0).

## Design (vision, full-resolution stills)

- **Headline cap height** at 1080p: 44.0 px (middle half 28.0–72.0 px). **Smallest text:** 14.0 px (middle half 10.0–23.0 px).
- **Typefaces per frame:** 1.0 (middle half 1.0–1.0). Styles: sans 96%, mono 12%, serif 9%, display 4%.
- **Weights:** regular 77%, medium 37%, bold 27%, light 4%.
- **Alignment:** center 49%, left 30%, mixed 19%, none 2%.
- **Margin** to the nearest edge: 13.1% of width (middle half 5.4–25.0% of width).
- **Corner radius** of the main card or window at 1080p: 28.0 px (middle half 16.75–52.0 px).
- **Shadow:** none 58%, soft 27%, glow 15%. **Background:** flat 47%, gradient 27%, image 14%, texture 12%.
- **Accent colours:** 1.0 (middle half 0.0–2.0). **Density:** sparse 57%, medium 27%, dense 16%.
