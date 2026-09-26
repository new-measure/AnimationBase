# Type-led announcement

Typography is the picture: a headline, a name, a number, or a manifesto line by line, with a logo and a little
graphic support. It's the cheapest family to make well and the easiest to make badly.

**In the catalog:** 317 films (14.3%). Median length 0:49, with the middle half between 0:30 and 1:13.
- Background: light 46%, dark 39%, gradient 13%.
- Text: **dominant in 51%**.
- Overlays: graphics 25%, logo 21%, UI 9%.
- Aspect: 90% landscape.
- Categories: AI 46%, developer tools 22%.
- Code can make it: all 317.

## What it looks like (from the representatives)

- **"Introducing X" title cards:** a name plus a one-line descriptor, with a clear hierarchy of size and weight
  ([FigmaTrace](https://whatships.com/videos/figmatrace/), [Abacus AI](https://whatships.com/videos/abacus/),
  [Helium](https://whatships.com/videos/conrad-wip-motion/)).
- **One word in an accent:** a colour, gradient or highlighter stroke on the key word
  ([Mirasim](https://whatships.com/videos/mirasim/)'s highlighted *one place*,
  [brrr](https://whatships.com/videos/brrr/), [Mythos for Sales](https://whatships.com/videos/chatgpt-mythos-for-sales/)).
- **Rhythm lines:** "One call. / Every TikTok storefront." ([Xona](https://whatships.com/videos/xona-tiktok-shop/)),
  and "We killed [icon]" ([design demo](https://whatships.com/videos/not-a-single-prompt/)). A word gets swapped
  for an image mid-sentence.
- **Type as texture:** a paragraph being selected ([Superhuman Go](https://whatships.com/videos/superhuman-go-agents/)),
  a mono terminal release-notes style ([Marketing Skills v2.0](https://whatships.com/videos/marketing-skills-v2-0/)),
  or a block of colour wiping in behind a word ([Codex Sites](https://whatships.com/videos/codex-sites/)).
- **Cinematic spacing:** small, widely spaced caps on black ([Edgerun](https://whatships.com/videos/edgerun/),
  [Polymarket Perps](https://whatships.com/videos/polymarket-perps/)).

## Beats

1. **Cold open:** one line alone, with the problem or the tension.
2. **Build:** two to five lines that escalate or list, each replacing or pushing the last. One line on screen at a time
   is the default.
3. **Turn:** "Introducing" or "Meet", and the name lands with the biggest move of the film.
4. **Proof:** optionally a number, a stamp (Accepted, v2.0), or a quick product glimpse.
5. **End card:** logo lock-up and a call to action.

## Motion vocabulary

- Words or lines rise with blur and fade (as in `mg_demo`'s open), or are revealed by a mask that sweeps across.
- Words replace words in the same position (a match cut on the baseline), and a word morphs into an icon or logo.
- Highlighter or underline strokes draw on after the word lands, never at the same time.
- Kerning tightens as a name settles. Words or items in a group start 4 frames (0.17 s) apart, which is the measured median. Letter-by-letter reveals go faster, at 1 frame each.
- Counters roll up to big numbers. Stamps land with a quick scale-down, and overshoot only in playful briefs.

## Reading time (the timing rule for this family)

A viewer reads about 3–4 words a second, and needs about 0.5 s to find a new line. So hold each line for at least
**0.5 s plus 0.3 s per word** after it finishes arriving, and longer for the line that carries the message.
In a contact sheet, count the frames each line is fully readable.

## Engine

- **Have:** the DOM layer with real fonts, gradient text, and the blur/opacity/scale props. Text moves take about 0.65 s with a balanced ease-in-out ([spec](../motion_design_spec.md)).
- **Phase 2 (built, in `src/lib/type.js` and `Brand.safe()`, except auto-fit to a box, stamps and the word-to-icon morph):**
  - `lib/type`: reveals by word, letter and line (rise, blur, mask), swaps in place, highlight and underline strokes,
    counters, stamps, auto-fit to a box, and a "word becomes an icon" morph.
  - Safe-area guides for square and vertical formats.

## Pitfalls

- Lines that leave before they're read. Use the reading-time rule.
- Three typefaces. One family with two or three weights is the norm.
- Centred everything. Left-aligned editorial layouts are common and read as more designed.
- Animating every word the same way. Give the hero line its own, bigger move.

Representatives: [refs/whatships/genres.md](../../refs/whatships/genres.md#type-led-announcement-317).
