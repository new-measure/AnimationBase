# Explainer

A short animated film that makes a concept, product or process understandable, usually narrated, in flat illustration
or motion graphics. Think TED-Ed, Kurzgesagt, and studio work for brands (BUCK, Oddfellows, Giant Ant).

**Measured** over 50 reference films (Stash and "Best of Stash" selections, Cannes Lions, recognised studios and
channels), in [refs/genres_ext/measured.md](../../refs/genres_ext/measured.md).
- **Length:** median 3 min (middle half 1.5–5 min). Beats last about **16 s** (8.6–30), with 10 per film.
- **Pacing:**
  - The frame changes often: **17 hard cuts a minute** and about 9 scene changes a minute, each scene a new
    illustration of the idea.
  - Within a scene, motion is calm: 2.6 moves every 10 s, holds of 1.3 s, and a balanced easing centre (0.49).
  - Pace: 68% medium.
- **Look:**
  - Colourful: saturation 0.22, five times the launch films'. Backgrounds are 45% light.
  - Contrast is modest (6.6:1): illustration, not UI.
- **Characters:** half the films have a **recurring character**. Only 6% show a presenter.
- **Openings and endings:**
  - Films open on a hook (68%) or a title (30%). The first beat is about 8 s, and text arrives around 6 s.
  - They end on a call to action (70% contain one; it's the most common last beat) or a recap (72% contain one).

## What it looks like (references)
- **TED-Ed character pieces:** [How does the stock market work?](https://www.youtube.com/watch?v=p7HKvqRI_Bo).
- **Flat, graphic concept work:** [Champ, How does AI learn?](https://vimeo.com/522542250) and
  [Eoin Duffy, What do all languages have in common?](https://vimeo.com/501630931) (both in Stash).
- **Studio explainers for brands:** [BUCK, What is GitHub?](https://vimeo.com/785256722) and
  [BUCK, The Gap](https://vimeo.com/362469637).
- **The public-information classic:** [Dumb Ways to Die](https://www.youtube.com/watch?v=IJNR2EpS0jw) (Cannes Lions
  Grand Prix).
- Every film: [refs/genres_ext/index.md](../../refs/genres_ext/index.md#explainers).

## Beats
1. **Hook** (about 8 s): a question or a striking image the film will answer.
2. **Context:** why it matters (78%).
3. **Explanation, in steps:** one idea per scene, with each scene a new illustration (about 9 a minute).
4. **Example** (80%), and sometimes an **analogy** (28%). Concrete cases make the idea stick.
5. **Recap:** the idea restated in one line.
6. **Call to action,** or a title card.

## Motion and look
- **Narration sets the pace.** About one visual idea per spoken sentence. A scene lasts as long as its sentence, then
  cuts or morphs to the next.
- **Transitions:** cuts (98%), with a lot of **morph and match** (78%). One scene's shape becomes the next scene's
  subject, which is the signature explainer move. Pushes appear in 64%, pans in 48%.
- **Camera:** mostly static, with slow push-ins (86%).
- **A recurring character or object** carries the viewer through (50%). Keep it on model, with the same shape and
  colours in every scene.
- **Colour:** a bold, limited palette, often saturated, used consistently across scenes.

## Engine
- **Have:** flat shapes and SVG (`lib/shapes`), p5 painted or clean illustration, characters (`Clawd`, `Jolly`, and
  others made the same way), morphs (`Shape.lerpPath`, `Tx.rect`), type, the camera, transitions, and sound.
- **Needs narration-driven timing:** a voice-over file plus its transcript with word or sentence timings. Scenes and
  captions cue to sentences (`Sound.clip` for the voice-over, `Media.captions` with word timings). Build the storyboard
  from the script, one row per sentence.
- **Needs an illustration kit:** icons, objects and simple scene pieces in one consistent flat style.

## Pitfalls
- Scenes that don't change with the narration, so pictures lag behind the words.
- A new visual style in every scene.
- Text on screen repeating the narration word for word.
- A hook that takes more than 10 s to land.
