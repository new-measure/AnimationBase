# Lyric video

A music video where the lyrics are the main visual: kinetic type, type set into illustration or footage, or hand
lettering. It's timed to the vocals, and it's the only genre here where the soundtrack *is* the structure.

**Measured** over 48 reference films (the MTV VMA Best Lyric Video, UK Music Video Awards shortlists, Vimeo Staff Picks,
and Stash and Motionographer features), in [refs/genres_ext/measured.md](../../refs/genres_ext/measured.md). Music
videos with barely any lyrics were left out.
- **Length:** the song's, a median 3.75 min. The beat pass found sections of about 19 s. Audio analysis
  (`scripts/lyric_structure.py`) found about 12 sections of 15.5 s per song.
- **The fastest genre:** **25 hard cuts a minute** (middle half 6–57), 3.7 moves every 10 s, short moves (0.42 s) and
  holds of 1.1 s. Pace: 52% fast.
- **Look:** **dark** (only 20% light), the **most colourful** (saturation 0.33), and high contrast (12.5:1).
- **Text:**
  - typically **4 words on screen** at once (3–5)
  - a line holds about **3 s** (2–4)
  - position varies with the scene (62%); centred in only 21%
  - style: set **into the scene** 35%, kinetic 23%, hand-lettered 15%, plain title cards only 10%
- **Opening:** an intro (54%) or the song's title card (44%), with the first lyric at about 4 s.
- **Rhythm:** moves and cuts land on the beat **no more often than chance** (0.23 against 0.22), and section changes
  don't attract cuts (0.50 against 0.47). **The words carry the sync, not the edit.**

## What it looks like (references)
- **Big kinetic type:** [Taylor Swift, Look What You Made Me Do](https://www.youtube.com/watch?v=3K0RzZGpyds) (ODD NY,
  Stash).
- **Type in illustration:** [5 Seconds of Summer, Don't Stop](https://www.youtube.com/watch?v=ym6NDDRFHvc) (MTV VMA Best
  Lyric Video 2014), [Imagine Dragons, Sharks](https://www.youtube.com/watch?v=7j7twuejxvU) (a Saul Bass homage), and
  [Car Seat Headrest, Hollywood](https://www.youtube.com/watch?v=ka9l8X8W03Y).
- **Hand lettering:** [Odezenne, Dedans](https://www.youtube.com/watch?v=Q42FXJEhnAI) (Vimeo Staff Pick).
- **Character-led:** [Tom Rosenthal, Don't Die Curious](https://www.youtube.com/watch?v=ekgiGwVER8M).
- Every film: [refs/genres_ext/index.md](../../refs/genres_ext/index.md#lyric_videos).

## Structure
Follow the song: **intro → verse → pre-chorus → chorus → verse → chorus → bridge → chorus → outro.** Verses and choruses
appear in nearly all of them, bridges in 77%.
- **Intro:** the title card (song and artist), or the first image, before the vocals start.
- **Verse:** quieter, with smaller type and more words per card, which moves less.
- **Chorus:** the visual peak, with the biggest type and the boldest colour. It repeats with variation, so the second
  chorus shouldn't be identical to the first.
- **Bridge:** a change of scene or style.
- **Outro:** let the last line hold, then the title or artist.

## Timing (the rule of this genre)
- **Each word or phrase appears as it's sung.** Its onset is the vocal onset, give or take a frame. It's held while
  it's sung, then leaves before or on the next phrase.
- **About 4 words at a time,** with a line held about 3 s. On fast rap passages, show phrases, not words.
- **Cuts and moves are free of the beat.** The measured films don't lock the edit to it. Sync lives in the words, with
  accents on emphasised syllables: a scale pulse, a colour change.

## Engine
- **Needs lyric timing input:**
  - an LRC file (line times) or word-level timestamps, from the artist or a forced-alignment tool
  - parsed to `[[t, 'word'], …]` and driven through `Type` with per-word onsets
- **Needs:**
  - song sections from the audio (`scripts/lyric_structure.py` already finds them), so the look can change per
    section
  - audio-reactive accents: `Sound`-side loudness per frame, exposed to scenes as a pure function of `t`
- **Have:** kinetic type (`Type.words`, `Type.swap`, reveals), shapes, `FX`, the camera, transitions, painted
  illustration, and `Media.clip` for footage.

## Pitfalls
- Text drifting off the vocals by more than a couple of frames, which viewers notice at once.
- Too many words at once.
- Every chorus identical.
- Illegible type over busy art: use a contrast plate or place the text in calm areas.
- Lyrics you don't have the rights to show. Use the artist's.
