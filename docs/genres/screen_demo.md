# Screen-recording demo

A real capture of the product: an app window, a terminal, a browser. Sometimes it's raw, and often it's framed on a
coloured ground, with zooms, a cursor and captions added. Code can't invent the recording, but it can frame, zoom,
annotate and caption it (Phase 3), or rebuild the UI as a [walkthrough](ui_walkthrough.md).

**In the catalog:** 267 films (12.0%). Median length 0:39, with the middle half between 0:24 and 1:11.
- Background: dark 43%, light 37%, photo 10%.
- Text: some text in 93%.
- Overlays: **cursor 24%**, text 10%, UI 9%, captions 4%.
- Aspect: 89% landscape, **9% square** (the highest of any family).
- Categories: **developer tools 38%**, AI 24%, design 18%.
- Code can make it: partial for all 267 (it needs the recording).

## What it looks like (from the representatives)

- **A window on a colour field:** the capture sits in a rounded window with a shadow, on a solid or gradient ground
  ([Granola](https://whatships.com/videos/granola/) on lime, [ChatGPT for Financial Services](https://whatships.com/videos/chatgpt-financial-services/)
  on a soft gradient, [Zaro](https://whatships.com/videos/zaro/) on light).
- **Terminal and agent demos:** mono text on black, where the typing *is* the demo
  ([Autosales](https://whatships.com/videos/autosales/)).
- **Zoom to the detail:** the frame pushes into the part of the UI being used, and the cursor leads
  ([Fiscal](https://whatships.com/videos/fiscal-enterprise-launch/), [Graph slides](https://whatships.com/videos/graph-slides/)).
- **A raw browser or website capture,** often square, made for the social feed.

## Beats

1. **Context:** the app or landing page, one line of text saying what it is.
2. **Task:** the cursor goes to the input. A caption or type names what's about to happen.
3. **Result:** zoom in to the result and hold. Speed up the waiting parts (2–8× with a visible cue) rather than
   cutting them out silently.
4. **Repeat** for two or three tasks, then the end card.

## Engine

- **Build (Phase 3):**
  - A frame-exact video layer: a `<video>` element seeked to `t`, waited on until seeked, then captured.
  - A window frame with a shadow, and a zoom/pan on the recording (the same `D.cam` maths).
  - Speed ramps (time remapping as a pure function of `t`).
  - A cursor-highlight overlay, and captions ([footage_overlays.md](footage_overlays.md)).
- **Alternative:** rebuild the key screens in DOM ([ui_walkthrough.md](ui_walkthrough.md)). It's sharper, fully
  controllable and needs no recording, which is how most polished launch films do it.

## Pitfalls

- A tiny full-screen capture that nobody can read. Always crop or zoom to the part that matters.
- Real waiting time on screen. Ramp through it.
- Mouse jitter from the recording. The engine's cursor can replace it if the rebuild route is taken.

Representatives: [refs/whatships/genres.md](../../refs/whatships/genres.md#screen-recording-demo-267).
