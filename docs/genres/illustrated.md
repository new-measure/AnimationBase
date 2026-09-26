# Illustrated and character

Drawn worlds and characters: cartoons, pixel art, line drawings, painted and vintage illustration. This is where the
original Clawd kit and the Jolly kit live, and it's the family the existing
[ANIMATION_GUIDE.md](../../ANIMATION_GUIDE.md) rules were written for.

**In the catalog:** 58 films (2.6%). Median length 0:42, with the middle half between 0:25 and 1:00.
- Background: light 31%, colorful 31%, dark 19%, photo 14%.
- Text: none 48%, some 52%.
- Overlays: text 36%, **UI 19%** (a character next to a product screen).
- Aspect: 79% landscape, 10% square, 9% vertical.
- Categories: AI 43%.
- Code can make it: 50 yes, 8 partial.

## What it looks like (from the representatives)

- **A character who acts out the product:** a cartoon figure pressing a giant LAUNCH key
  ([AchX 2.0](https://whatships.com/videos/achx-2/)), a line-drawn man next to a phone mockup
  ([AchX](https://whatships.com/videos/achx-recent/)). This is the Jolly pattern: character plus UI.
- **Pixel and retro worlds:** a pixel landscape with a caption box ([Browserbase](https://whatships.com/videos/browserbase/)),
  a pinball board ([Pegfinity](https://whatships.com/videos/pegfinity-steam/)), a retro Start button
  ([Pops](https://whatships.com/videos/pops/)).
- **Vintage or editorial illustration** ([Claude Fable 5.1](https://whatships.com/videos/claude-fable-5-1/)), and flat
  silhouettes with big type ([MiniMax H3](https://whatships.com/videos/minimax-h3-public/)).
- **Cozy illustrated rooms** framing a product ([Cibby](https://whatships.com/videos/cibby/)).
- Some AI-generated anime and painterly footage falls here too. Code can't make that.

## Beats

Follow the existing guide: a character wants something, tries, fails, reacts and gets it, with one read at a time,
transitions at every seam and acted emotions. The launch-film twist is that **the product is the thing that gets the
character what it wants**, so it appears as a UI moment inside the story (as in the Muse "Booked." film). Close on the
logo end card.

## Engine

- **Have:** everything in the Clawd and Jolly kits (painted or clean styles, emotions, views, motion principles), and
  now a DOM layer for crisp UI beside the character.
- **Phase 2 (built, namespaced characters are done (`Clawd`, `Jolly`, see `src/scenes/duo.js`); pixel-art and line-art styles are not yet):**
  - Namespaced characters with one shared interface, so several can share a scene.
  - A pixel-art style (a nearest-neighbour render of a low-resolution canvas).
  - A line-art style (ink only, no fills).

## Pitfalls

- The character upstaging the product. The UI beat is the payoff and needs the hold.
- Mixing styles in one frame (painted character, vector UI) without framing the UI as an object in the world, like a
  phone or a screen.

Representatives: [refs/whatships/genres.md](../../refs/whatships/genres.md#illustrated-and-character-58).
