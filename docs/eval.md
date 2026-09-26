# Evaluation: our films against the top tier (Phase 5)

Do films made with this kit hold up next to the best launch films? This page answers with the same instruments that
measured the references.
- **Automatic:** frame differences at 24 fps for moves, easing, holds and cuts; stills for contrast and colour; and the
  soundtrack.
- **Vision:** the same subagent prompt, blind to whose films they were, read every-frame strips of key moves and
  full-resolution stills.
- **Side by side:** one-frame-a-second sheets against references of the same genre.

To score any new film:

```bash
python3 scripts/whatships_craft.py --local out/my_film.mp4
python3 scripts/eval_scorecard.py my_film           # → refs/eval/scorecard.md
```

## Scorecard

The top tier is 36 films (`refs/whatships/craft.md`). ⚠ marks a value outside the top tier's middle half. v1 is the
first cut of each demo; the unmarked column is the version after this evaluation.

| measure | top tier: median (middle half) | mg_demo (before the spec) | launch_demo v1 | **launch_demo** | relay_demo v1 | **relay_demo** | footage_demo |
|---|---|---|---|---|---|---|---|
| moves per 10 s | 4.31 (3.42–5.00) | 7.27 ⚠ | 2.08 ⚠ | **5.10** (just over) | 4.39 | **3.41** (at the edge) | 3.81 |
| move length (s) | 0.58 (0.38–0.96) | 0.67 | 0.67 | **0.50** | 0.38 | **0.62** | 0.54 |
| easing centre (0.5 = balanced) | 0.49 (0.44–0.53) | 0.48 | 0.41 ⚠ | **0.50** | 0.57 ⚠ | **0.50** | 0.48 |
| hold length (s) | 1.25 (0.79–2.08) | 1.44 | 2.19 ⚠ | **1.75** | 2.17 ⚠ | **1.48** | 0.62 ⚠ |
| share of holds ≥ 2 s | 30% | 50% | 50% | **29%** | 57% | **38%** | 15% |
| hard cuts per minute | 10.3 (4.1–24.9) | 5.5 | 0 ⚠ | **2.8** ⚠ | 5.9 | **5.9** | 5.7 |
| contrast (1%/99%) | 7.7 (2.2–17.5) | 18 ⚠ | 4.75 | **5.65** | 3.45 | **5.30** | 11.35 |
| saturation | 0.04 (0.00–0.17) | 0.49 ⚠ | 0.01 | **0.03** | 0.06 | **0.06** | 0.14 |
| light background | 54% | 0% | 100% | **100%** | 100% | **100%** | 50% |
| sound | 83% of films | none | none | **yes**, −14.8 LUFS | none | **yes**, −14.8 LUFS | yes, −14.7 LUFS |

Vision pass, key moves and stills:

| | top tier | launch_demo | relay_demo | footage_demo | mg_demo |
|---|---|---|---|---|---|
| moves with overshoot | 3% | 0% | 0% | 0% | 0% |
| stagger between items (frames) | 4 | 4 | 5 | 2 | 2 |
| frames to settle (median) | 20 | 10 | 11 | 7 | 14 |
| typefaces per frame | 1 | 1 | 1 | 1 | 1 |
| weights | regular, medium, bold | regular, medium, bold | regular, bold, medium | regular, bold | regular, medium, **black** |
| corner radius (px at 1080p) | 28 | 24 | 32 | 24 | 32 |

## What the evaluation found, and what changed

1. **The measured spec works on look and colour.**
   - The pre-spec engine test (`mg_demo`) was dark, saturated (0.49 against 0.04) and set in black-weight type.
   - Every kit-built film lands on the top tier's saturation, weights, typeface count, radius and absence of
     overshoot.
2. **`launch_demo` v1 was sparse and slow.**
   - It had half the top tier's move density and holds twice as long. The side-by-side against AchX's launch film
     showed why: the reference gives a new read about every second, with big scale contrast (full-frame words next to
     small lines).
   - v1 showed the whole app small, text unreadable, and nothing happened until 4.9 s. It broke our own recipe's rule:
     crop to one component.
   - **Changed:**
     - The camera crops in on the prompt at 3.2 s, then on the answer.
     - The action starts by 3.9 s instead of 5.45 s.
     - A full-frame type beat was added.
     - The film went from 24 s to 21.6 s.
     - Sound was added: a music bed, clicks and typing from the cursor and typing times, pops and a chime.
   - **Result:** density 2.1 → 5.1, holds 2.19 → 1.75 s, easing centre 0.41 → 0.50, contrast 4.75 → 5.65.
3. **`relay_demo` v1 had no through-line.**
   - Against Linear's Loops film, which is one continuous dial the camera travels along with a new label every 1–2 s,
     ours dropped its hub diagram and set the words alone on a gradient. Its moves were back-loaded (easing centre
     0.57).
   - **First change:** one continuous shot. The hub stays on screen and each word lights the tool it names.
   - That over-corrected: density fell to 1.95, because the transitions went and only the colour changed.
   - **Second change:** as each word arrives, the ring turns so that the tool swings between the hub and the word
     (hub → tool → word). The highlight also waits for the word to *arrive*: the first version lit it while the last
     word was still leaving.
   - **Result:** density 3.41, easing 0.50, holds 1.48 s, and sound.
4. **Contrast was below the rule.** The muted text colour measured 4.5–5.2:1. It's now `#4E4E5A`, which is ≥ 7:1 on
   every light surface, and `#A1A1AC` on dark. `faint` is kept for placeholders and decoration only.
5. **Narrow canvases broke the crop-in.**
   - A zoom computed from width alone stayed at about 1× on vertical, leaving the component small in an empty frame.
   - On square, the sidebar squeezed the answer until its rows clipped.
   - **Changed:** the fill factor now grows on narrow canvases, and the sidebar hides when narrow.

## What's still open

- **Cuts.** Our films cut 3–6 times a minute; the top tier cuts about 10 times (UI films 8.3). The continuous-canvas
  style that the recipes favour cuts less. A cut between features is the cheapest next step toward the reference
  rhythm.
- **Contrast on the scorecard** (5.3–5.65 against 7.7). The text itself now meets 7:1. The metric takes the darkest
  and lightest 1% of the whole frame, so light, sparse frames with small text score low. Bigger or darker type in the
  wide shots would lift it.
- **Settle time** is about half the top tier's (10 frames against 20). Per element the presets match (cards 9, text
  about 15), but our key moves are dominated by short card and click moves. Longer, slower camera and panel moves in
  the wide beats would match the tier's feel better.
- **Vertical.** The automatic measures read low for vertical frames (1.85 moves per 10 s, 1.6 contrast). That's
  partly because the whole-frame metrics are diluted by empty area: the top tier is 91% landscape. The design point
  behind it is real, though: **a vertical film needs its own stacked composition** (headline, component, caption),
  not a cropped landscape layout. `launch_demo_vertical` crops in correctly now, but it isn't a composed vertical film.
- **The sample.** 36 top-tier films. The references came from the site's listed studios, the Motion category and
  design-led teams. A wider tier (`refs/whatships/top_tier.json`) would tighten every band.

Side-by-side sheets are in `refs/eval/sheets/`, next to the references in `refs/whatships/pacing/sheets/`. Both are
gitignored (derived from third-party films). Measurements are in `refs/eval/craft/`.
