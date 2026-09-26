# Motion graphics over footage

Films led by camera footage: people on camera, product footage, cinematic b-roll, and big type set over footage. Code
can't make the footage. But **63% of these films (539 of 855) carry designed overlays**, meaning titles, captions,
logos, UI and graphics, and those are exactly what this engine makes. With your footage supplied (Phase 3), the system
builds everything laid over it.

**In the catalog:**

| family | films | median length | overlays |
|---|---|---|---|
| People on camera | 567 (25.5%) | 1:24 | text 38%, **captions 31%**, logo 10%, UI 7% |
| Cinematic b-roll | 178 (8.0%) | 1:04 | text 31%, captions 11%, logo 11% |
| Product footage | 110 (5.0%) | 1:00 | text 23%, captions 12%, UI 11% |
| Type over footage | 22 (1.0%) | 1:09 | **type dominant in 73%**, graphics 32% |

Overall, 94% of people-on-camera films have a photographic background, 95% are landscape, and AI is 49% of them.

## What the overlays look like (from the representatives)

- **Huge type over footage,** one word filling the frame ([Memory Store](https://whatships.com/videos/memory-store/)'s
  FRICTION), a word cut around a face ([Adialante](https://whatships.com/videos/adialante-launch/)'s *people*), a
  wordmark over a scene ([Cluely](https://whatships.com/videos/cluely-0915/), [Gamma](https://whatships.com/videos/gamma-3415/)).
- **A big question or statistic** over dimmed footage ([Matiks](https://whatships.com/videos/matiks/),
  [Wealor](https://whatships.com/videos/wealor-launch/)'s glowing dollar figure).
- **An editorial serif line** over a moody still ([flowscope](https://whatships.com/videos/flowscope-launch/)).
- **Captions under talking heads** (31% of people-on-camera films), and **UI laid over the scene**, like a frame-rate
  slider on footage ([Runway](https://whatships.com/videos/runway-enhance-frame-rate/)).
- **Graphic treatments on footage:** neon grid lines ([Greptile](https://whatships.com/videos/greptile-security-agent/)),
  and a spotlight vignette with coloured type ([Asimov](https://whatships.com/videos/asimov/)).

## Beats (people-on-camera launch, the most common shape)

1. **Cold open:** a line of type over b-roll, or the founder's first sentence with captions.
2. **The problem:** the founder speaks, with lower-third name and title, and B-roll cutaways with a word or two of type.
3. **The product:** a cut to the UI ([ui_walkthrough.md](ui_walkthrough.md) or [screen_demo.md](screen_demo.md)),
   then back to the founder.
4. **Proof:** a number (funding, users), big and over footage.
5. **End card:** logo and call to action.

## Engine

- **Build (Phase 3):**
  - A frame-exact video layer (`D.video`: seek to `t`, wait for `seeked`, then capture), with trims, speed ramps and
    Ken Burns moves on stills.
  - Colour treatments: dim, duotone, vignette and grain as CSS filters or blend modes.
  - Text behind subject (a word cut around a person) needs a matte: either a supplied alpha matte or a segmentation
    pass done offline and supplied as a mask video.
  - Captions from a transcript with word timings (supplied SRT or VTT, or a transcription step), with word-by-word
    highlight styles.
  - Lower thirds and name tags.
- **Have:** everything the overlays themselves need: type, shapes, UI, a camera and transitions on the DOM layer.

## Pitfalls

- Type over busy footage without a dim, blur or scrim. Contrast first.
- Captions covering faces or UI. Keep captions in a safe band.
- Mismatched motion. Overlays should move with the cut rhythm of the footage, not against it.

Representatives: [refs/whatships/genres.md](../../refs/whatships/genres.md) (people on camera, product footage,
cinematic b-roll, type over footage).
