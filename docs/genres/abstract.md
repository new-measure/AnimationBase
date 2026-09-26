# Abstract and atmospheric

Particles, light, gradients, glitch and flowing lines as the subject. It's used for mood, for "intelligence", and for
teasers that reveal little. It's often the opening or the bed under type.

**In the catalog:** 55 films (2.5%). Median length 0:38, with the middle half between 0:25 and 0:53.
- Background: **dark 62%**, gradient 18%, colorful 13%.
- Text: none 65%.
- Overlays: text 25%, logo 13%.
- Aspect: 85% landscape, 13% square.
- Categories: AI 45%.
- Code can make it: 53 yes, 2 partial.

## What it looks like (from the representatives)

- **Particle forms:** a star cluster ([GPT-6 Astra](https://whatships.com/videos/gpt-6-astra-teaser/)), a ring orb
  ([Totalis](https://whatships.com/videos/totalis/)), a flock over a dusk gradient
  ([Gemini 3.1 Pro](https://whatships.com/videos/gemini-3-1-pro/)), a dot cloud erupting over a grid
  ([Hermes Agent](https://whatships.com/videos/hermes-agent-3333/)).
- **A glowing orb or sphere** ([xAI voice](https://whatships.com/videos/xai-voice-cloning-via-xai-api/)), and light
  streaks through a starfield ([ai.com](https://whatships.com/videos/ai-com/)).
- **Flowing lines carrying data labels** ([Linear](https://whatships.com/videos/linear-391850/)).
- **Soft gradient fields** ([Claude Code × Remotion](https://whatships.com/videos/claude-code-remotion/)), and a
  tilted plane of gradient with a small UI element ([Flip](https://whatships.com/videos/flip-notes/)).
- **Glitch and scanline** treatments ([Anyone VPN](https://whatships.com/videos/anyone-desktop-vpn/)).

## Beats

1. **Emergence:** from black, a point, a line or a haze.
2. **Formation:** particles organise into a shape (a ring, a sphere, a logo).
3. **Charge:** light intensifies on the beat, and the camera pushes.
4. **Reveal:** a name or logo out of the form, or a cut to the product.

## Motion vocabulary

- Particle systems in closed form: each particle's position is a function of its seed (`hash(i)`) and `t`. There's no
  simulation state, so frames stay pure (see `motes()` in `mg_demo`).
- Formation: interpolate each particle from a scattered position to a target shape (points sampled on a ring, a sphere
  projected to 2D, or a logo's outline), with staggered easing.
- Additive light with `glow()`, bloom as blurred copies, and noise fields (`noise()`, seeded per frame).
- Pulses on the beat (`pulse(t)`), and slow camera drift so it never freezes.

## Engine

- **Have:** the p5 canvas layer (clean style, transparent) between DOM layers, `glow()`, `hash`, `noise` and `pulse`.
- **Phase 2 (built, in `src/lib/fx.js` (particles with ring, grid and text targets; gradient, grain, glow), except the sphere sampler, glitch, streaks, bloom and a WebGL layer):** `lib/fx`, with a particle field (scatter → shape → scatter), shape samplers (ring, sphere, text
  or logo outline via an offscreen canvas), gradient meshes, grain, glitch/scanline, light streaks and bloom. For
  thousands of particles, a WebGL layer can use the same pure-of-`t` rule.

## Pitfalls

- Pretty but meaningless. Tie the form to the product's idea (voice → waveform orb, network → connected points).
- Muddy colour. On dark grounds use additive light, not paint.
- Too long. This family has the shortest middle half (25–53 s). Use abstraction as an opening or a bridge.

Representatives: [refs/whatships/genres.md](../../refs/whatships/genres.md#abstract-and-atmospheric-55).
