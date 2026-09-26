"""whatships_craft_summary.py: pools the top-tier craft measurements (refs/whatships/craft/<slug>.json from
whatships_craft.py) and the vision pass over their strips and stills (craft/vision/<slug>.json) into
refs/whatships/craft.md. Fails if a film has no vision file, or one that doesn't match its strips and stills.
  python3 scripts/whatships_craft_summary.py
"""
import json, glob, sys, collections
import numpy as np

R = 'refs/whatships/craft'; FPS = 24
films = [json.load(open(f)) for f in sorted(glob.glob(f'{R}/*.json'))]
films = [f for f in films if not f.get('error')]
vis, errs = {}, []
for f in films:
    try: v = json.load(open(f'{R}/vision/{f["slug"]}.json'))
    except Exception as e: errs.append(f'{f["slug"]}: {e}'); continue
    if len(v.get('moves', [])) != len(f['strips']): errs.append(f'{f["slug"]}: {len(v.get("moves", []))} moves for {len(f["strips"])} strips')
    if len(v.get('stills', [])) != len(f['stills']): errs.append(f'{f["slug"]}: {len(v.get("stills", []))} stills for {len(f["stills"])}')
    vis[f['slug']] = v
if errs: print('\n'.join(errs)); sys.exit(1)

def q(a, ps=(.25, .5, .75)):
    a = [x for x in a if x is not None]
    return [round(float(np.percentile(a, p * 100)), 2) for p in ps] if a else [None] * len(ps)
def share(pred, a): a = list(a); return f'{100 * sum(1 for x in a if pred(x)) / len(a):.0f}%' if a else '–'
def top(counter, n): return ', '.join(f'{k} {100 * v / n:.0f}%' for k, v in counter.most_common())
def mq(a, unit=''): x = q(a); return f'{x[1]}{unit} (middle half {x[0]}–{x[2]}{unit})'

moves = [m for f in films for m in f['moves'] if m['dur'] <= 2.5]
long_moves = [m for f in films for m in f['moves'] if m['dur'] > 2.5]
holds = [h for f in films for h in f['holds']]
dur = sum(f['duration'] for f in films)
# timing stats leave out hard-cut "replace" strips (their frame count is the gap between cuts, not a settle), and
# layout stats leave out stills with no text or no layout (an empty frame, a full-bleed image)
V_all = [(f['slug'], m) for f in films for m in vis[f['slug']]['moves']]
V = [(k, m) for k, m in V_all if m['action'] != 'replace']
# a move still changing at the strip's last frame (typing, drifts, loops) has no settle time: counted apart
strip_len = {(f['slug'], st['k']): min(36, round(st['dur'] * FPS) + 7) for f in films for st in f['strips']}
settled = lambda k, m: m['frames_to_settle'] < strip_len.get((k, m['k']), 36) - 2
VS = [(k, m) for k, m in V if settled(k, m)]
S_all = [s for f in films for s in vis[f['slug']]['stills']]
S = [s for s in S_all if s.get('typefaces')]
A = [f['audio'] for f in films if f.get('audio') and f['audio'].get('bpm')]
ST = [s for f in films for s in f['stills']]
by_el = collections.defaultdict(list)
for _, m in VS: by_el[m['element']].append(m)

L = [f'# Craft of top-tier launch films: measured', '',
     f'{len(films)} films from `refs/whatships/top_tier.json` (listed studios, the Motion category, design-led product teams),',
     f'{dur / 60:.1f} minutes in all. Videos were downloaded to a temp file, measured and deleted (scripts/whatships_craft.py).',
     'Automatic measures come from frame differences at 24 fps; the rest from a vision pass over every-frame strips of',
     f'{len(V_all)} key moves and {len(S_all)} full-resolution stills. Medians, with the middle half in brackets.',
     f'Move timings leave out {len(V_all) - len(V)} hard-cut strips; type and layout figures leave out {len(S_all) - len(S)} stills with no text.', '',
     '## Motion (automatic, every move in every film)', '',
     f'- **Moves:** {len(moves)} short moves (≤ 2.5 s) and {len(long_moves)} long drifts; {len(moves) / dur * 10:.1f} moves per 10 s.',
     f'- **Move length:** {mq([m["dur"] for m in moves], " s")}.',
     f'- **Easing shape** (where a move\'s energy centres: 0 = start, 1 = end): {mq([m["centroid"] for m in moves])}. '
     f'Front-loaded (ease-out, centre < 0.45): {share(lambda m: m["centroid"] < .45, moves)}; balanced (ease-in-out, 0.45–0.55): '
     f'{share(lambda m: .45 <= m["centroid"] <= .55, moves)}; back-loaded (ease-in, > 0.55): {share(lambda m: m["centroid"] > .55, moves)}.',
     f'- **Peak speed at** {mq([m["peak_at"] for m in moves])} of the move.',
     f'- **Several speed peaks** (staggered groups or bounces): {share(lambda m: m["peaks"] > 1, moves)} of moves; gap between peaks {mq([m["peak_gap"] for m in moves], " s")}.',
     f'- **Holds** (≥ 0.5 s near-still between moves): {mq(holds, " s")}; {share(lambda h: h >= 2, holds)} of holds last 2 s or more.',
     f'- **Hard cuts:** {sum(len(f["cuts"]) for f in films) / dur * 60:.1f} a minute.', '',
     '## Motion (vision, key moves frame by frame)', '',
     f'- **Frames to settle:** {mq([m["frames_to_settle"] for _, m in VS], " frames")} at 24 fps ({len(V) - len(VS)} moves still changing at the end of their strip are left out).',
     f'- **Fast start (ease-out):** {share(lambda x: x[1]["fast_start"], V)} of key moves.',
     f'- **Overshoot:** {top(collections.Counter(m["overshoot"] for _, m in V), len(V))}.',
     f'- **Stagger** between items in a group: {mq([m["stagger_frames"] for _, m in V], " frames")} ({share(lambda x: x[1]["stagger_frames"] is not None, V)} of key moves are staggered groups).',
     f'- **Motion blur:** {share(lambda x: x[1]["motion_blur"], V)}.',
     f'- **Styles:** {top(collections.Counter(s for _, m in V for s in m["style"]), len(V))}.',
     f'- **Actions:** {top(collections.Counter(m["action"] for _, m in V), len(V))}.', '',
     '| element | moves | frames to settle | fast start | overshoot slight/clear | stagger frames |', '|---|---|---|---|---|---|',
     *[f'| {e} | {len(ms)} | {q([m["frames_to_settle"] for m in ms])[1]} ({q([m["frames_to_settle"] for m in ms])[0]}–{q([m["frames_to_settle"] for m in ms])[2]}) | '
       f'{share(lambda m: m["fast_start"], ms)} | {share(lambda m: m["overshoot"] != "none", ms)} | {q([m["stagger_frames"] for m in ms])[1]} |'
       for e, ms in sorted(by_el.items(), key=lambda kv: -len(kv[1]))], '',
     '## Sound', '',
     f'- {len(A)} of {len(films)} films have a soundtrack with a detectable tempo: {mq([a["bpm"] for a in A], " BPM")}.',
     f'- **Cuts on the beat** (±70 ms): {mq([a["cuts_on_beat"] for a in A])} of cuts, against {mq([a["chance_on_beat"] for a in A])} by chance.',
     f'- **Move starts on the beat:** {mq([a["moves_on_beat"] for a in A])}, against the same chance.', '',
     '## Design (automatic, full-resolution stills)', '',
     f'- **Background:** light (luminance > 0.5) in {share(lambda s: s["bg_luminance"] > .5, ST)} of stills, dark (< 0.1) in {share(lambda s: s["bg_luminance"] < .1, ST)}.',
     f'- **Contrast** (darkest vs lightest 1%): {mq([s["contrast"] for s in ST], ":1")}.',
     f'- **Saturation:** {mq([s["saturation"] for s in ST])}. Colours covering ≥ 2% of the frame: {mq([sum(1 for c in s["palette"] if c["share"] >= .02) for s in ST])}.', '',
     '## Design (vision, full-resolution stills)', '',
     f'- **Headline cap height** at 1080p: {mq([s["headline_px"] for s in S], " px")}. **Smallest text:** {mq([s["body_px"] for s in S], " px")}.',
     f'- **Typefaces per frame:** {mq([s["typefaces"] for s in S])}. Styles: {top(collections.Counter(t for s in S for t in s["type_style"]), len(S))}.',
     f'- **Weights:** {top(collections.Counter(w for s in S for w in s["weights"]), len(S))}.',
     f'- **Alignment:** {top(collections.Counter(s["align"] for s in S), len(S))}.',
     f'- **Margin** to the nearest edge: {mq([s["margin_pct"] for s in S], "% of width")}.',
     f'- **Corner radius** of the main card or window at 1080p: {mq([s["radius_px"] for s in S], " px")}.',
     f'- **Shadow:** {top(collections.Counter(s["shadow"] for s in S), len(S))}. **Background:** {top(collections.Counter(s["bg_style"] for s in S), len(S))}.',
     f'- **Accent colours:** {mq([s["accent_count"] for s in S])}. **Density:** {top(collections.Counter(s["density"] for s in S), len(S))}.', '']
open('refs/whatships/craft.md', 'w').write('\n'.join(L))
print('\n'.join(L))
