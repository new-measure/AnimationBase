# Tutorial

A video that teaches someone to use a product or do a task in steps: a feature walkthrough, an onboarding video, or
"how to X in Y". The UI is the subject, captured or rebuilt. Unlike a launch film, the aim is that the viewer can do it
afterwards.

**Measured** over 46 reference films (design-led product companies such as Figma, Linear, Notion, Apple and Raycast, plus
recognised educators), in [refs/genres_ext/measured.md](../../refs/genres_ext/measured.md). Teasers and promos were left
out. Few tutorials win awards, so their quality signal is the maker's reputation.
- **Length:** median 4 min (middle half 2.2–6.7 min). About **5 steps** (4–7.75), with beats of 16 s.
- **Pacing:** 6.5 hard cuts a minute and 3.3 moves every 10 s. Holds are 1.2 s. Pace varies (41% fast, 35% medium,
  24% slow).
- **Look:** the most legible genre (contrast 16:1) and the least colourful (saturation 0.10). 60% have light
  backgrounds.
- **UI craft signals:**
  - a **cursor** in 91% of films
  - **zooms into the UI** in 89%
  - callouts or highlights in 59%
  - a presenter on screen in 59%, often picture-in-picture
- **Openings and endings:**
  - Films open on an intro (54%) or a title (39%), with text on screen at 0 s. The first beat is about 7 s.
  - 63% give an overview before the first step, and 48% add a tip.
  - They end on an outro (91%).

## What it looks like (references)
- **Rebuilt, polished UI motion:** [Intro to Linear](https://www.youtube.com/watch?v=9Q5BoiIFBiY) and
  [Automate Triage in Linear](https://www.youtube.com/watch?v=QfRULgmspxs).
- **Quick-tip series:** [Figma Slides quick start](https://www.youtube.com/watch?v=NibyIWzbua8).
- **Device how-tos:** [Apple Support, Live Text](https://www.youtube.com/watch?v=hL5HJKQNPQQ) and
  [Stage Manager](https://www.youtube.com/watch?v=B7t_BCmY-lg).
- **A breadth tour:** [101 things you can do with Raycast](https://www.youtube.com/watch?v=NuIpZoQwuVY).
- Every film: [refs/genres_ext/index.md](../../refs/genres_ext/index.md#tutorials).

## Beats
1. **Intro** (about 7 s): what you'll be able to do, with the finished result shown first where possible.
2. **Overview:** where it lives in the product (63%).
3. **Steps** (about 5), each built the same way:
   1. Name the step: a title or chapter card, or a spoken line.
   2. Zoom into the region of the UI.
   3. The cursor does the action, with a highlight on what it clicks.
   4. Hold on the result.
4. **Tip:** a shortcut or variation (48%).
5. **Outro:** the recap, and where to learn more.

## Motion and look
- **The zoom is the camera.** Push into the part of the UI being used (89%), and pull back to reorient between steps.
- **The cursor leads the eye.** It moves on an arc to the target, pauses, clicks, then holds. Never click faster than
  the viewer can follow.
- **Highlight before the action:** a box, a glow, or dimming the rest, so the eye is already there when the click
  happens.
- **Every step lands visibly.** Show the result and hold it (holds of 1.2 s here, longer for complex UI).
- **Transitions:** cuts (100%) and zoom-pushes (70%). Few effects: clarity beats style.
- **Captions and keyboard-shortcut chips** when a key combination is used.

## Engine
- **Have:**
  - the UI kit and cursor (`lib/ui`, `lib/cursor`), for rebuilt UI
  - `Media.clip` with speed ramps and `Media.device`, for supplied recordings
  - `Cam.shot` for zooms
  - captions, chips and sound (clicks, typing)
- **Needs:**
  - step callouts: numbered badges, a highlight box or spotlight that dims the rest, and arrow annotations
  - a keyboard-shortcut overlay
  - chapter cards
  - a zoom-to-region helper for recordings: give it a rectangle in the recording's pixels, and the camera frames it
    over `MOTION.camera`

## Pitfalls
- Unreadable full-screen captures. Zoom in.
- Waiting time left in. Ramp through it.
- The cursor moving before the viewer has found it.
- Steps without a visible result.
- A presenter covering the UI.
