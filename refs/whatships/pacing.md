# What Ships: measured pacing and structure

213 films across 11 families (3 could not be fetched). Each was downloaded to a temp file,
measured, and deleted; only the numbers below and the beat annotations are kept. Measurements come from
scripts/whatships_pacing.mjs (cuts, shots, stills, audio) and the vision pass over one-frame-a-second sheets
(beats, text, product, end card, transitions). All values are medians. "Shot" is the time between hard cuts;
"beat" is a unit of content from the annotations, which also counts soft transitions.

| family | films | length s | shot s | cuts/min | still | beat s | first text s | product at s | end card s | end card | sound |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Product UI walkthrough | 23 | 30.6 | 2.7 | 8.3 | 35% | 4.6 | 0 | 0 | 3.3 | 65% | 83% |
| Screen-recording demo | 24 | 38.4 | 1.8 | 8.1 | 47% | 6 | 0 | 0 | 3.5 | 33% | 71% |
| Type-led announcement | 24 | 45.4 | 1.3 | 11.5 | 37% | 5 | 0 | 1 | 3.8 | 88% | 79% |
| Type over footage | 12 | 67.3 | 1.4 | 19 | 31% | 5.8 | 0 | 31 | 4.3 | 100% | 100% |
| Brand and graphic motion | 24 | 36.1 | 1.3 | 10.1 | 36% | 5.2 | 0 | 0 | 4 | 83% | 75% |
| Abstract and atmospheric | 24 | 38.1 | 1.6 | 8.9 | 42% | 5 | 1 | 3 | 4.6 | 88% | 96% |
| Illustrated and character | 24 | 49 | 1.5 | 23.3 | 16% | 4.8 | 0 | 4 | 3.6 | 79% | 96% |
| 3D product and scene | 23 | 35.1 | 1.1 | 17.2 | 22% | 4.9 | 2 | 1 | 4.2 | 78% | 83% |
| People on camera | 12 | 55.7 | 1.6 | 24.9 | 27% | 5.8 | 3 | 3 | 4.3 | 100% | 100% |
| Product footage | 11 | 41.3 | 1.8 | 23.5 | 33% | 5.8 | 2 | 6 | 4.5 | 82% | 100% |
| Cinematic b-roll | 12 | 69.6 | 1.2 | 17.4 | 33% | 5.4 | 1 | 6 | 5.1 | 83% | 100% |

## Product UI walkthrough (23 films measured of 382)

- Length: median 30.6 s (middle half 21.7–60.1 s).
- Shots between hard cuts: median 2.7 s (middle half 1.3–4.9 s); 8.3 cuts a minute.
- Beats: median 4.6 s each (middle half 3–7.6 s), 7 per film.
- Opens with: demo 39%, intro 39%, hook 17%, montage 4%.
- Films containing each beat kind: feature 87%, demo 83%, end_card 65%, intro 57%, other 30%, montage 30%, hook 22%, proof 13%, transition 9%, problem 4%.
- First text on screen at 0 s; product first seen at 0 s (medians).
- End card in 65% (logo 57%, call to action 26%); it lasts 3.3 s (median).
- Full-screen text moments: median 2 per film.
- Transitions seen: cut 87%, push_zoom 65%, morph_match 43%, fade_dissolve 39%, pan_slide 17%, whip_blur 13%, wipe_mask 9%, none_visible 4%.
- Camera: push_in 78%, static 61%, pan 48%, zoom_out_reveal 39%, tilt_3d 26%.
- Pace: medium 57%, fast 35%, slow 9%.
- Audio: 83% have sound; median loudness -17.5 LUFS.
- Stills: 35% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `ace` (15.1 s): demo
- `achx-launch-film` (36.9 s): hook → problem → intro → feature → end_card
- `agent-arcade` (81.1 s): hook → demo → feature → other → end_card
- `benji-motion-launch-reel` (25.8 s): montage → end_card
- `chatgpt-legal-plugins` (60.1 s): intro → feature → demo → feature → demo → feature → demo → feature → demo → proof → other → intro → end_card
- `claude-design` (81.6 s): intro → demo → feature → demo → montage → demo → feature → montage → feature → montage → end_card
- `codex-1796` (9.6 s): demo → feature → other
- `devin-auto-triage` (50 s): intro → demo → feature → proof → end_card
- `explee-launches-autogtm-sales-agent` (21.7 s): intro → demo → feature → proof → end_card
- `figma-make-local-code` (30.1 s): demo → montage → feature → intro → end_card
- `gemini-3-5-flash` (76.9 s): demo → feature → demo → feature → demo → other
- `hoy-mac` (43.7 s): demo → feature → demo → feature → demo → other

## Screen-recording demo (24 films measured of 267)

- Length: median 38.4 s (middle half 22.3–68.5 s).
- Shots between hard cuts: median 1.8 s (middle half 0.8–4.8 s); 8.1 cuts a minute.
- Beats: median 6 s each (middle half 3.4–9 s), 6 per film.
- Opens with: hook 42%, demo 42%, intro 17%.
- Films containing each beat kind: demo 92%, feature 67%, hook 42%, intro 42%, end_card 38%, other 29%, montage 17%, transition 8%, proof 4%.
- First text on screen at 0 s; product first seen at 0 s (medians).
- End card in 33% (logo 33%, call to action 13%); it lasts 3.5 s (median).
- Full-screen text moments: median 0 per film.
- Transitions seen: cut 75%, push_zoom 63%, none_visible 29%, fade_dissolve 21%, morph_match 17%, pan_slide 17%.
- Camera: static 79%, push_in 63%, zoom_out_reveal 38%, pan 33%, handheld 4%, tilt_3d 4%.
- Pace: medium 42%, slow 42%, fast 17%.
- Audio: 71% have sound; median loudness -17.6 LUFS.
- Stills: 47% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `autosales` (23.9 s): hook → demo → proof
- `chatgpt-financial-services` (81.3 s): hook → intro → feature → demo → feature → demo → feature → demo → feature → montage → end_card
- `circuitly-pcb-design` (58.3 s): demo → feature → demo → feature
- `claude-code-setup-6165` (11.1 s): demo
- `claude-code-setup` (11.1 s): demo → end_card
- `command-code-desktop` (46.3 s): hook → intro → demo → feature → end_card
- `css-web-development-tutorial` (22.3 s): demo → feature → demo → feature
- `driftguard` (14.3 s): demo
- `figma-3980` (38.4 s): hook → montage → end_card
- `fiscal-enterprise-launch` (30.2 s): demo → feature → demo → feature
- `freellm` (11 s): intro → demo
- `granola` (26.2 s): intro → demo → feature → other → end_card

## Type-led announcement (24 films measured of 317)

- Length: median 45.4 s (middle half 26.6–54.3 s).
- Shots between hard cuts: median 1.3 s (middle half 0.8–2.5 s); 11.5 cuts a minute.
- Beats: median 5 s each (middle half 3–7 s), 7 per film.
- Opens with: hook 46%, intro 42%, other 8%, demo 4%.
- Films containing each beat kind: intro 88%, end_card 88%, feature 83%, demo 71%, hook 54%, other 42%, proof 33%, montage 25%, problem 21%, transition 17%, story 13%.
- First text on screen at 0 s; product first seen at 1 s (medians).
- End card in 88% (logo 71%, call to action 46%); it lasts 3.8 s (median).
- Full-screen text moments: median 4 per film.
- Transitions seen: cut 83%, fade_dissolve 71%, morph_match 46%, push_zoom 33%, whip_blur 17%, pan_slide 17%, none_visible 4%, wipe_mask 4%.
- Camera: static 83%, push_in 71%, pan 38%, zoom_out_reveal 21%, handheld 17%, tilt_3d 4%.
- Pace: medium 67%, fast 25%, slow 8%.
- Audio: 79% have sound; median loudness -15.6 LUFS.
- Stills: 37% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `abacus` (43.2 s): hook → intro → demo → end_card
- `adventure-ai-layers-studio` (45.4 s): intro → hook → demo → feature → end_card
- `bitcoin-thunderbolt` (30 s): intro → feature → end_card
- `browserbase-functions` (53.7 s): hook → problem → intro → feature → demo → proof → end_card
- `brrr` (18.9 s): intro → demo → feature
- `chatgpt-mythos-for-sales` (46.9 s): intro → demo → feature → proof → end_card
- `codex-sites` (46.5 s): intro → demo → other → demo → other → feature → other → demo → montage → intro → end_card
- `conrad-wip-motion` (11.4 s): hook → intro → demo
- `cristian-ponce-launch` (60 s): hook → problem → other → intro → demo → feature → story → end_card → other
- `cursor-cloud-agent-builds` (19.9 s): hook → feature → demo → other → end_card
- `edgerun` (79.9 s): hook → problem → proof → intro → feature → montage → end_card
- `figmatrace` (19.1 s): other → intro → proof → feature → end_card

## Type over footage (12 films measured of 22)

- Length: median 67.3 s (middle half 47.3–92.9 s).
- Shots between hard cuts: median 1.4 s (middle half 0.8–2.9 s); 19 cuts a minute.
- Beats: median 5.8 s each (middle half 3.4–10.8 s), 9 per film.
- Opens with: hook 75%, intro 17%, story 8%.
- Films containing each beat kind: hook 92%, end_card 92%, story 75%, feature 75%, intro 67%, other 50%, demo 50%, problem 42%, proof 25%, montage 17%, transition 17%.
- First text on screen at 0 s; product first seen at 31 s (medians).
- End card in 100% (logo 75%, call to action 50%); it lasts 4.3 s (median).
- Full-screen text moments: median 4 per film.
- Transitions seen: cut 100%, morph_match 58%, fade_dissolve 42%, push_zoom 33%, pan_slide 25%, whip_blur 17%, wipe_mask 8%.
- Camera: static 92%, push_in 92%, pan 50%, handheld 33%, zoom_out_reveal 17%.
- Pace: fast 42%, medium 33%, slow 25%.
- Audio: 100% have sound; median loudness -14.9 LUFS.
- Stills: 31% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `adialante-launch` (92.9 s): hook → problem → story → problem → intro → feature → story → end_card
- `altitude` (47.3 s): hook → problem → montage → other → montage → feature → story → other → end_card
- `chatgpt-linux-desktop` (45.3 s): intro → demo → end_card
- `chatgpt-work-computer-use-feature` (55.5 s): hook → story → demo → feature → demo → end_card
- `figma-weave-node` (31.4 s): hook → demo → feature → demo → other → end_card
- `flick` (67.3 s): hook → intro → proof → intro → montage → other → montage → other → end_card
- `flowscope-launch` (64.2 s): hook → problem → story → intro → feature → end_card → other
- `gamma-3415` (115.1 s): intro → proof → hook → feature → demo → story → feature → story → end_card
- `marcos-rico-peng-launch` (39.1 s): hook → intro → demo → story → demo → other → feature → story → feature → other → end_card
- `matiks` (87 s): hook → story → demo → story → proof
- `memory-store` (69.3 s): story → hook → problem → other → intro → feature → end_card
- `wealor-launch` (105 s): hook → story → problem → intro → feature → story → end_card

## Brand and graphic motion (24 films measured of 143)

- Length: median 36.1 s (middle half 19.1–57.1 s).
- Shots between hard cuts: median 1.3 s (middle half 0.8–3.3 s); 10.1 cuts a minute.
- Beats: median 5.2 s each (middle half 3.3–7.7 s), 7 per film.
- Opens with: intro 50%, hook 33%, demo 8%, feature 8%.
- Films containing each beat kind: end_card 83%, feature 75%, intro 75%, demo 50%, hook 33%, montage 25%, transition 21%, problem 17%, other 17%, proof 17%, story 17%.
- First text on screen at 0 s; product first seen at 0 s (medians).
- End card in 83% (logo 71%, call to action 38%); it lasts 4 s (median).
- Full-screen text moments: median 2 per film.
- Transitions seen: cut 83%, fade_dissolve 63%, morph_match 58%, push_zoom 33%, whip_blur 13%, wipe_mask 8%, none_visible 8%.
- Camera: static 79%, push_in 63%, zoom_out_reveal 42%, tilt_3d 25%, pan 21%, handheld 21%.
- Pace: fast 38%, medium 33%, slow 29%.
- Audio: 75% have sound; median loudness -14 LUFS.
- Stills: 36% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `bouncer` (31.7 s): hook → problem → demo → feature → end_card
- `candle-launches-love-letters-word-game` (13.1 s): demo → other
- `coinbase-us500-perps` (11.3 s): intro → montage → end_card
- `cosmos-summer` (53.9 s): hook → intro → feature → demo → proof → feature → demo → end_card
- `designers-machines` (28 s): hook → feature → demo
- `giza-world` (36.1 s): hook → problem → hook → intro → other → end_card
- `grok-bot-icon-in-code` (30.8 s): intro → feature → end_card
- `higgsfield-fable-5-1` (57.1 s): intro → demo → feature → demo → feature → end_card
- `higgsfield-omni-1-1-flash` (77.3 s): intro → feature → end_card
- `hydra-0` (111.8 s): intro → feature → proof → feature → end_card
- `interaction-moves-to-sf` (13.9 s): hook → demo → story → end_card
- `linear-loops-update` (28.5 s): feature → intro → end_card

## Abstract and atmospheric (24 films measured of 55)

- Length: median 38.1 s (middle half 30.1–51.4 s).
- Shots between hard cuts: median 1.6 s (middle half 0.9–3.6 s); 8.9 cuts a minute.
- Beats: median 5 s each (middle half 3–7.1 s), 7 per film.
- Opens with: hook 67%, intro 29%, demo 4%.
- Films containing each beat kind: end_card 88%, intro 83%, hook 79%, feature 58%, other 50%, demo 50%, montage 21%, transition 17%, proof 13%, story 13%, problem 8%.
- First text on screen at 1 s; product first seen at 3 s (medians).
- End card in 88% (logo 79%, call to action 29%); it lasts 4.6 s (median).
- Full-screen text moments: median 3 per film.
- Transitions seen: cut 75%, fade_dissolve 67%, morph_match 54%, push_zoom 42%, wipe_mask 21%, whip_blur 21%, none_visible 17%, pan_slide 4%.
- Camera: static 75%, push_in 71%, pan 38%, tilt_3d 33%, zoom_out_reveal 29%, handheld 13%.
- Pace: slow 38%, medium 33%, fast 29%.
- Audio: 96% have sound; median loudness -16.1 LUFS.
- Stills: 42% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `ai-com` (30.2 s): hook → intro → hook → other → demo → end_card
- `anyone-desktop-vpn` (17 s): hook → intro → other → end_card
- `claude-code-remotion` (95.3 s): intro → demo → feature → other → end_card
- `elevenlabs-scribe-v2` (51.4 s): hook → intro → proof → feature → end_card
- `flip-notes` (38 s): demo → feature → end_card
- `gemini-3-1-pro` (47.2 s): hook → demo → feature → other
- `google-ai-studio-apps` (33.1 s): hook → intro → demo → other → end_card
- `gpt-6-astra-teaser` (15.3 s): hook → other
- `haha-launch` (34.5 s): intro → montage → hook → intro → feature → other → end_card
- `hermes-agent-3333` (20.6 s): hook → intro → other
- `hermes-profile-builder` (47.4 s): hook → intro → feature → end_card
- `hop-aero` (52.6 s): intro → feature → montage → proof → story → proof → end_card

## Illustrated and character (24 films measured of 58)

- Length: median 49 s (middle half 32.1–61.6 s).
- Shots between hard cuts: median 1.5 s (middle half 0.8–2.7 s); 23.3 cuts a minute.
- Beats: median 4.8 s each (middle half 3.2–7.4 s), 8 per film.
- Opens with: hook 71%, intro 8%, demo 8%, montage 4%, feature 4%, story 4%.
- Films containing each beat kind: end_card 79%, hook 75%, feature 71%, intro 58%, demo 58%, montage 38%, other 29%, story 29%, problem 25%, transition 25%, proof 4%.
- First text on screen at 0 s; product first seen at 4 s (medians).
- End card in 79% (logo 67%, call to action 38%); it lasts 3.6 s (median).
- Full-screen text moments: median 2 per film.
- Transitions seen: cut 92%, push_zoom 58%, morph_match 50%, fade_dissolve 38%, wipe_mask 13%, whip_blur 13%, pan_slide 8%, none_visible 8%.
- Camera: static 88%, push_in 75%, pan 46%, zoom_out_reveal 38%, tilt_3d 17%, handheld 17%.
- Pace: fast 46%, medium 42%, slow 13%.
- Audio: 96% have sound; median loudness -13.4 LUFS.
- Stills: 16% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `achx-2` (64.4 s): hook → problem → intro → other → story → montage → feature → end_card
- `achx-recent` (81.9 s): hook → feature → demo → end_card
- `archer` (35.4 s): montage → demo → intro → end_card
- `bitmor` (50.4 s): hook → demo → intro → feature → problem → feature → problem → other → end_card
- `browserbase` (66.1 s): hook → demo → problem → intro → feature → demo → story → feature → end_card
- `cibby` (46.4 s): hook → demo → feature → montage → other → end_card
- `claude-fable-5-1` (27.4 s): hook → montage → intro → end_card → other
- `claude-for-chrome` (32.1 s): hook → intro → montage → end_card
- `dreamina-seedance-2-0-mini` (10.2 s): intro → hook
- `figma-draw` (53.1 s): hook → intro → demo → feature → intro → end_card
- `framepack` (60 s): demo
- `gemini-3-1-pro-6433` (30.1 s): feature

## 3D product and scene (23 films measured of 106)

- Length: median 35.1 s (middle half 17.6–80.1 s).
- Shots between hard cuts: median 1.1 s (middle half 0.7–2 s); 17.2 cuts a minute.
- Beats: median 4.9 s each (middle half 3.2–8.7 s), 7 per film.
- Opens with: hook 78%, intro 13%, demo 9%.
- Films containing each beat kind: hook 83%, end_card 83%, feature 78%, intro 52%, demo 43%, story 35%, other 30%, montage 30%, problem 17%, transition 17%, proof 9%.
- First text on screen at 2 s; product first seen at 1 s (medians).
- End card in 78% (logo 61%, call to action 22%); it lasts 4.2 s (median).
- Full-screen text moments: median 2 per film.
- Transitions seen: cut 83%, fade_dissolve 52%, morph_match 39%, push_zoom 39%, pan_slide 17%, whip_blur 13%, wipe_mask 13%, none_visible 4%.
- Camera: push_in 78%, static 65%, pan 52%, zoom_out_reveal 30%, tilt_3d 26%, handheld 22%.
- Pace: fast 48%, medium 35%, slow 17%.
- Audio: 83% have sound; median loudness -15.2 LUFS.
- Stills: 22% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `achx-studio` (68.2 s): hook → story → intro → end_card
- `arcane` (52.3 s): hook → problem → hook → story → problem → feature → end_card
- `articraft` (42.1 s): hook → feature → end_card
- `atoms` (114.8 s): hook → story → other → story → montage → intro → end_card
- `co-invest-imessage` (32.2 s): hook → demo → intro → feature → end_card
- `eigencloud-launch-eigencompute-eigenai` (74.3 s): hook → problem → intro → feature → proof → story → end_card
- `framer-f1` (25.5 s): hook → feature → intro → other → end_card
- `gemini-37-flash` (72.6 s): hook → demo → feature → montage → end_card
- `geometry-nodes-blender` (14.6 s): hook → feature
- `grok-imagine-video-1-5` (11.2 s): hook → demo
- `intelligence-factory-launch` (100.4 s): hook → story → problem → intro → demo → feature → demo → montage → story → end_card
- `minimax-design-astra` (82.7 s): intro → demo → feature → montage → feature → montage → end_card

## People on camera (12 films measured of 567)

- Length: median 55.7 s (middle half 44.9–69.9 s).
- Shots between hard cuts: median 1.6 s (middle half 0.9–2.8 s); 24.9 cuts a minute.
- Beats: median 5.8 s each (middle half 3.6–8.3 s), 8 per film.
- Opens with: hook 83%, story 8%, intro 8%.
- Films containing each beat kind: feature 100%, end_card 100%, hook 83%, intro 67%, story 58%, demo 58%, montage 42%, other 33%, problem 33%, proof 17%, transition 17%.
- First text on screen at 3 s; product first seen at 3 s (medians).
- End card in 100% (logo 75%, call to action 67%); it lasts 4.3 s (median).
- Full-screen text moments: median 3 per film.
- Transitions seen: cut 100%, push_zoom 50%, fade_dissolve 42%, wipe_mask 33%, morph_match 25%, whip_blur 17%.
- Camera: static 100%, push_in 92%, pan 58%, handheld 50%, zoom_out_reveal 17%.
- Pace: fast 58%, medium 25%, slow 17%.
- Audio: 100% have sound; median loudness -16.8 LUFS.
- Stills: 27% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `1x-neo-humanoid-robot` (42.3 s): hook → feature → montage → feature → story → end_card
- `bigmotion` (44.9 s): story → intro → feature → end_card
- `dreamina-seedance-2-0` (48 s): hook → intro → feature → other → montage → other → montage → intro → end_card
- `eachlabs-mcp` (49.4 s): hook → intro → demo → story → feature → proof → other → end_card
- `elevenlabs-studio-4` (65.7 s): hook → intro → montage → feature → montage → end_card
- `indie-os` (116.1 s): hook → problem → story → demo → story → feature → story → demo → story → end_card
- `instance` (72.7 s): intro → story → problem → feature → demo → end_card
- `kinara` (40.3 s): hook → demo → feature → demo → end_card
- `pocket-heypocket` (55.7 s): hook → intro → feature → demo → feature → other → intro → end_card
- `runway-enhance-frame-rate` (38.1 s): hook → intro → feature → demo → feature → intro → end_card
- `tempo-health` (69.9 s): hook → story → proof → problem → montage → story → demo → feature → other → end_card
- `uplift` (60.3 s): hook → problem → story → intro → montage → feature → end_card

## Product footage (11 films measured of 110)

- Length: median 41.3 s (middle half 32–87.3 s).
- Shots between hard cuts: median 1.8 s (middle half 1–2.9 s); 23.5 cuts a minute.
- Beats: median 5.8 s each (middle half 3.6–8.3 s), 8 per film.
- Opens with: hook 82%, demo 18%.
- Films containing each beat kind: hook 82%, end_card 82%, intro 73%, feature 64%, demo 64%, story 55%, montage 55%, problem 36%, proof 18%, transition 9%.
- First text on screen at 2 s; product first seen at 6 s (medians).
- End card in 82% (logo 82%, call to action 45%); it lasts 4.5 s (median).
- Full-screen text moments: median 1 per film.
- Transitions seen: cut 91%, fade_dissolve 82%, push_zoom 36%, morph_match 36%, none_visible 9%, whip_blur 9%.
- Camera: static 91%, push_in 73%, handheld 36%, pan 27%, tilt_3d 18%, zoom_out_reveal 18%.
- Pace: medium 64%, slow 18%, fast 18%.
- Audio: 100% have sound; median loudness -19 LUFS.
- Stills: 33% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `applied-electrodynamics` (87.3 s): hook → intro → story → proof → story → feature → demo → feature → demo → end_card
- `composite-launch` (113.8 s): hook → intro → proof → story → problem → feature → proof → montage → end_card
- `interact-ai` (97.3 s): hook → montage → story → montage → intro → demo → feature → demo → feature → end_card
- `jupiter-portfolio-v2` (41.3 s): hook → problem → story → intro → feature → end_card
- `mac-mini` (38 s): hook → feature → intro → end_card
- `microduck` (51.1 s): hook → story → feature → montage → end_card
- `sabbath` (21.9 s): demo
- `tesseract` (32 s): hook → intro → demo → montage → demo → montage → end_card
- `typeahead-launches-ai-autocomplete-for-mac` (60.1 s): hook → problem → hook → intro → demo → montage → feature → demo → end_card
- `uno-wallet-mobile-payments-wallet` (40.2 s): hook → story → problem → intro → demo → end_card
- `word-learning-application-ai-powered-object-reco` (23.1 s): demo → montage

## Cinematic b-roll (12 films measured of 178)

- Length: median 69.6 s (middle half 24.1–98 s).
- Shots between hard cuts: median 1.2 s (middle half 0.8–2.4 s); 17.4 cuts a minute.
- Beats: median 5.4 s each (middle half 3–8.7 s), 8 per film.
- Opens with: hook 67%, intro 17%, problem 17%.
- Films containing each beat kind: intro 92%, end_card 83%, story 67%, feature 67%, hook 67%, other 42%, demo 42%, montage 42%, proof 33%, problem 33%, transition 17%.
- First text on screen at 1 s; product first seen at 6 s (medians).
- End card in 83% (logo 75%, call to action 42%); it lasts 5.1 s (median).
- Full-screen text moments: median 2 per film.
- Transitions seen: cut 92%, fade_dissolve 50%, push_zoom 25%, wipe_mask 25%, whip_blur 17%, morph_match 17%, pan_slide 8%, none_visible 8%.
- Camera: static 100%, push_in 92%, pan 42%, handheld 33%, zoom_out_reveal 8%, tilt_3d 8%.
- Pace: medium 42%, fast 42%, slow 17%.
- Audio: 100% have sound; median loudness -15 LUFS.
- Stills: 33% of seconds are near-still holds (mean change score < 0.15).

Structures (beat kinds in order, repeats merged):

- `edra-ai-enterprise-ai-agents-series-a` (98 s): intro → proof → other → story → other → story → feature → story → proof → story → end_card
- `f2` (101.1 s): problem → story → intro → feature → story → proof → demo → feature → proof → story → end_card
- `hexa-industrial-distribution` (64.2 s): problem → intro → demo → feature → intro → feature → end_card
- `knowndating` (91.1 s): hook → story → montage → story → intro → end_card
- `onepay-next` (31.1 s): hook → story → intro → hook → montage → intro → feature → end_card
- `pixelframe-cosmos` (20.1 s): hook → story → intro → feature → montage → other → feature → end_card
- `propel` (80.8 s): hook → problem → story → intro → montage → proof → end_card
- `robocurve` (106.6 s): hook → intro → problem → proof → montage → demo → proof → feature → other → end_card
- `seedance-2-0-buzzy` (69.6 s): intro → feature → other → end_card
- `skillsync-2360` (21.6 s): hook → intro → story → demo → end_card
- `skud` (24.1 s): hook → intro → feature → demo → other
- `tesla-product-update-film` (15.9 s): hook → story
