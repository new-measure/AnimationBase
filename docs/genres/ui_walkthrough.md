# Product UI walkthrough

The product's own interface, redesigned for film: one component at a time, big and legible, on a designed ground,
acting out what the product does. This is the most common code-makeable family and the core of the system.

**In the catalog:** 382 films (17.2%). Median length 0:37, with the middle half between 0:20 and 1:00.
- Background: light 50%, dark 28%, gradient 10%, colorful 8%, photo 4%.
- Text: some text in 96%.
- Overlays: text 29%, **cursor 22%**, graphics 11%, extra UI 10%, logo 8%.
- Aspect: 91% landscape.
- Categories: AI 39%, developer tools 19%, design 16%.
- Code can make it: 366 yes, 16 partial (the ones over a photo).

## What it looks like (from the representatives)

- **One component fills the frame**, cropped tight: a prompt input ([Figma Make](https://whatships.com/videos/figma-make-local-code/), [Claude Design](https://whatships.com/videos/claude-design/), [Ace](https://whatships.com/videos/ace/)), a command palette ([Codex](https://whatships.com/videos/codex-1796/)), a set of dashboard cards ([Luma](https://whatships.com/videos/luma-shadcn/)), a sidebar ([Devin Auto-Triage](https://whatships.com/videos/devin-auto-triage/)), or an integrations grid ([Lovable Connectors](https://whatships.com/videos/lovable-connectors/)). It's rarely the whole app at once.
- **Designed ground:** soft light or cream, an iridescent gradient ([Teable](https://whatships.com/videos/teable/)), or a dark window on a saturated colour field ([Codex](https://whatships.com/videos/codex-1796/) on blue, [SEO dashboard](https://whatships.com/videos/seo-ai-search-dashboard/) on teal).
- **Depth from blur and scale,** not perspective: cards behind are blurred ([AchX](https://whatships.com/videos/achx-launch-film/)), and the element in focus is large.
- **An oversized, stylised cursor** and selection boxes with handles ([Figma Make](https://whatships.com/videos/figma-make-local-code/)).

## Beats (standard practice, checked against the representatives)

1. **Hook (0–3 s):** the promise as a few words, or the empty input waiting.
2. **The ask:** typing into the input or palette, with the caret visible and the text readable.
3. **The response:** the UI answers. Results stream in, cards assemble, a list sorts itself.
4. **Two to four feature beats,** each one component, one action and one read, about 3–6 s each. Move between them with
   the camera on one continuous canvas (pan, zoom out to reveal, push in to detail) rather than hard cuts.
5. **End card:** logo, tagline, then availability or a call to action (see [brand_graphic.md](brand_graphic.md)).

## Motion vocabulary

- Typing with a caret. Characters land at a human pace: fast, but not uniform.
- The cursor travels on an arc, anticipates, clicks (a small press plus a ripple), then drags or leaves.
- Cards enter with a fast ease-out over about 9 frames (0.38 s), with no overshoot. Items in a group start 4 frames (0.17 s) apart. Numbers count up.
- Highlight sweeps and selection rectangles pull the eye to the next read.
- A card grows into a panel (a layout morph between two rectangles).
- A 2.5D tilt that settles flat. Use it once as an entrance, not everywhere.

## Engine

- **Have (Phase 1):** the DOM layer (`D.*`), `D.cam` for pushes, `persp` with `rx`/`ry` tilts, and fonts.
  [src/scenes/mg_demo.js](../../src/scenes/mg_demo.js) shows typing, a cursor, a ripple and a card write-on, as local
  helpers.
- **Phase 2 (built, all of it is in `src/lib/` (`ui`, `cursor`, `type`; layout morph is `Tx.rect`)):**
  - `lib/ui`: window, input, palette, card, list, table, chart, toast, sidebar and avatar, all themed with light and
    dark tokens.
  - `lib/cursor`: arcs, clicks, drags and hovers.
  - A layout-morph helper that interpolates between two rectangles as a pure function of `t`.
  - Count-up numbers and highlight sweeps.

## Pitfalls

- Showing the whole app. One component per read.
- Text too small to read on a phone: keep body UI text at 20 px or more at 1080p, and crop in if you can't.
- Defaulting to dark. Half this family is light.
- Real third-party logos in integration grids. Use neutral marks unless the brief supplies them.
- Everything moving at once. Stagger it, and hold about 1.25 s after each move lands.

Representatives: [refs/whatships/genres.md](../../refs/whatships/genres.md#product-ui-walkthrough-382).
