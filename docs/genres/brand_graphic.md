# Brand and graphic motion

Flat 2D graphics as the subject: logo reveals and lock-ups, app icons, partner constellations, diagrams, badges and
shapes. It's also the vocabulary every other family's end card borrows.

**In the catalog:** 143 films (6.4%). Median length 0:40, with the middle half between 0:24 and 1:17.
- Background: light 43%, dark 38%, gradient 12%.
- Text: some 65%, none 32%.
- Overlays: text 48%, logo 24%.
- Aspect: 89% landscape.
- Categories: developer tools 29%, AI 27%.
- Code can make it: 141 yes, 2 partial.

## What it looks like (from the representatives)

- **Logo on a plain ground:** a wordmark centred on white or cream
  ([Replit](https://whatships.com/videos/replit-black-box-pentest/)), or a partnership lock-up with an ×
  ([Higgsfield × Gemini](https://whatships.com/videos/higgsfield-omni-1-1-flash/)).
- **Icon with a notification:** an app icon and a speech bubble ([Poke](https://whatships.com/videos/interaction-moves-to-sf/)).
- **Hub and spokes:** the product mark connected to the tools it works with
  ([Rivet MCP](https://whatships.com/videos/rivet-mcp/)), or logos orbiting a title
  ([X Ticker](https://whatships.com/videos/x-ticker/)).
- **Dials, arcs and tick marks with small caps labels,** used as a metaphor for a feature
  ([Linear Loops](https://whatships.com/videos/linear-loops-update/)).
- **Stacks and badges:** warning chips stacking up ([Bouncer](https://whatships.com/videos/bouncer/)), pages fanning out.
- **A mascot as a shape:** a single bold form with eyes ([Grok bot](https://whatships.com/videos/grok-bot-icon-in-code/)).

## Beats

1. **A shape or mark appears** from a point, a line or a mask.
2. **It transforms** into the idea: it splits, orbits, connects or stacks.
3. **It resolves** to the lock-up: mark, wordmark, then tagline.
4. **Hold, then out.** End cards measured 3.3–4.6 s (a median of 4 s in this family). Hold 3.5–4.5 s, with some life: a slow drift or a soft glow.

## Motion vocabulary

- SVG strokes drawing on (animate `stroke-dashoffset` from `t`), and shape morphs between paths with matching points.
- Orbits and radial layouts (positions from angles as functions of `t`), and connectors that draw from hub to spoke.
- Masks and wipes that reveal the wordmark. The mark scales down as the wordmark slides out from behind it.
- Scale-ups without overshoot (97% of top-tier moves have none), about 0.55 s with a balanced ease-in-out. Keep springs for playful brands.

## Engine

- **Have:** SVG through `D.svg`/`D.path` and friends, transforms, and springs.
- **Phase 2 (built, all of it is in `src/lib/` (`shapes`, `brand`)):**
  - `lib/shapes`: stroke draw-on, path morph, arcs and dials, orbit layout, connectors.
  - `lib/brand`: lock-up and end-card templates driven by brand tokens (logo SVG, colours, fonts from `brand/`,
    Phase 3).

## Pitfalls

- A logo that just fades in. Give it a build that means something.
- Real partner logos without permission. Use placeholders unless the brief supplies them.
- An end card that ends the instant it's complete. Hold it.

Representatives: [refs/whatships/genres.md](../../refs/whatships/genres.md#brand-and-graphic-motion-143).
