"""eval_scorecard.py: scores our films against the top tier, with the same measurements (plan.md, Phase 5).
Measure a film first, then score it:
  python3 scripts/whatships_craft.py --local out/my_film.mp4          # → refs/eval/craft/my_film.json
  python3 scripts/eval_scorecard.py [my_film ...]                     # → refs/eval/scorecard.md (all measured films if none)
Each row is compared with the top tier's median and middle half (refs/whatships/craft/). A value outside the top tier's
middle half is flagged. Frame-difference and contrast figures are computed over the whole frame, so vertical films
(mostly empty background at these sizes) read low: compare them by eye, against their own format.
"""
import json, glob, os, sys
import numpy as np

TOP = [json.load(open(f)) for f in glob.glob('refs/whatships/craft/*.json')]
TOP = [f for f in TOP if not f.get('error')]
names = sys.argv[1:] or sorted(os.path.basename(f)[:-5] for f in glob.glob('refs/eval/craft/*.json'))

def metrics(fs):
    mv = [m for f in fs for m in f['moves'] if m['dur'] <= 2.5]; dur = sum(f['duration'] for f in fs)
    holds = [h for f in fs for h in f['holds']]; st = [s for f in fs for s in f['stills']]
    return {
        'moves per 10 s': [len([m for m in f['moves'] if m['dur'] <= 2.5]) / f['duration'] * 10 for f in fs],
        'move length (s)': [m['dur'] for m in mv],
        'easing centre (0.5 = balanced)': [m['centroid'] for m in mv],
        'hold length (s)': holds,
        'share of holds ≥ 2 s': [float(np.mean([h >= 2 for h in f['holds']])) if f['holds'] else 0 for f in fs],
        'hard cuts per minute': [len(f['cuts']) / f['duration'] * 60 for f in fs],
        'contrast (1%/99%)': [s['contrast'] for s in st],
        'saturation': [s['saturation'] for s in st],
        'light background': [float(s['bg_luminance'] > .5) for s in st],
        'has sound': [float(bool(f['audio'] and f['audio'].get('has_sound'))) for f in fs],
    }
top = metrics(TOP)
band = {k: (np.percentile(v, 25), np.percentile(v, 50), np.percentile(v, 75)) for k, v in top.items()}
L = ['# Scorecard: our films against the top tier', '',
     f'Same measurements as refs/whatships/craft.md ({len(TOP)} top-tier films). ⚠ marks a value outside the top tier\'s',
     'middle half. Share rows (holds ≥ 2 s, light background, sound) compare a single film\'s share with the tier\'s.', '',
     '| measure | top tier: median (middle half) | ' + ' | '.join(names) + ' |', '|---|---|' + '---|' * len(names)]
ours = {n: metrics([json.load(open(f'refs/eval/craft/{n}.json'))]) for n in names}
for k, (a, m, b) in band.items():
    share = k.startswith('share') or k in ('light background', 'has sound')
    tier = f'{np.mean(top[k]):.0%}' if share else f'{m:.2f} ({a:.2f}–{b:.2f})'
    cells = []
    for n in names:
        v = ours[n][k]
        if not v: cells.append('–'); continue
        x = float(np.mean(v)) if share else float(np.median(v))
        flag = '' if share else (' ⚠' if not (a <= x <= b) else '')
        cells.append(f'{x:.0%}' if share else f'{x:.2f}{flag}')
    L.append(f'| {k} | {tier} | ' + ' | '.join(cells) + ' |')
open('refs/eval/scorecard.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
