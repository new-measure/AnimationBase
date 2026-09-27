"""lyric_structure.py: song structure of the lyric-video references, from the audio (the beat pass can only guess verse and
chorus from frames). For each film: the audio only is downloaded to a temp file, analysed, and deleted.
  features    every 0.5 s: 12 pitch classes (chroma) and log energy in 8 octave bands (timbre and loudness)
  boundaries  Foote novelty on the features' self-similarity matrix (a checkerboard kernel along the diagonal): peaks
              clearly above the song's average, at least 10 s apart, strongest first
  labels      sections are compared by the mean and spread of their features, standardised within the song, and grouped
              with the song's most similar pairs (cut calibrated to typical pop form); letters A, B, C... by first
              appearance. The loudest group that repeats is marked chorus-like. A heuristic: roughly right, not exact.
  python3 scripts/lyric_structure.py [--refresh]
Writes refs/genres_ext/measure/lyric_videos/<id>.structure.json. Resumable.
"""
import json, os, glob, re, sys, shutil, subprocess, tempfile
import numpy as np
from concurrent.futures import ThreadPoolExecutor

D = 'refs/genres_ext/measure/lyric_videos'; SR = 22050; HOP = .5
REFRESH = '--refresh' in sys.argv

def fetch(url, out):
    if 'vimeo.com' in url:
        vid = re.search(r'vimeo\.com/(?:video/)?(\d+)', url).group(1); url = f'https://player.vimeo.com/video/{vid}'; extra = ['--referer', 'https://vimeo.com/']
    else: extra = []
    r = subprocess.run(['yt-dlp', '-q', '--no-warnings', '--no-playlist', *extra, '-f', 'ba/b', '-o', out, url], capture_output=True, text=True, timeout=600)
    got = [f for f in glob.glob(out + '*')]
    return got[0] if r.returncode == 0 and got else None

def features(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32); n = 4096; hop = int(SR * HOP)
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    S = np.abs(np.fft.rfft(frames, axis=1)); f = np.fft.rfftfreq(n, 1 / SR)
    ok = (f > 55) & (f < 4200); pc = (np.round(12 * np.log2(f[ok] / 440)) % 12).astype(int)
    C = np.stack([S[:, ok][:, pc == k].sum(axis=1) for k in range(12)], axis=1)
    C = C / (np.linalg.norm(C, axis=1, keepdims=True) + 1e-9)
    # timbre and loudness: log energy in 8 octave bands (choruses are usually fuller and louder than verses)
    edges = [60, 120, 250, 500, 1000, 2000, 4000, 8000, 11000]
    T = np.log1p(np.stack([S[:, (f >= a) & (f < b)].sum(axis=1) for a, b in zip(edges, edges[1:])], axis=1))
    T = (T - T.mean(axis=0)) / (T.std(axis=0) + 1e-9)
    energy = np.sqrt((frames ** 2).mean(axis=1))
    return C, T, energy

def segments(C, T, energy):
    n = len(C); X = np.hstack([C * 2, T * .35]); X = X / (np.linalg.norm(X, axis=1, keepdims=True) + 1e-9)
    ssm = X @ X.T; L = 16                                   # kernel half-width: 8 s
    sgn = np.r_[-np.ones(L), np.ones(L)]; g = np.exp(-np.linspace(-2, 2, 2 * L) ** 2)
    k = -np.outer(sgn, sgn) * np.outer(g, g)
    nov = np.zeros(n)
    for i in range(L, n - L): nov[i] = (ssm[i - L:i + L, i - L:i + L] * k).sum()
    nov = np.convolve(nov, np.ones(5) / 5, 'same')
    thr = nov.mean() + .5 * nov.std(); MIN = 20                # a boundary stands clearly above the song's average; ≥ 10 s apart
    cand = [i for i in range(1, n - 1) if nov[i] >= thr and nov[i] >= nov[i - 1] and nov[i] >= nov[i + 1]]
    peaks = []
    for i in sorted(cand, key=lambda i: -nov[i]):             # strongest first, so weak neighbours don't crowd out real changes
        if all(abs(i - p) >= MIN for p in peaks) and i >= MIN // 2 and n - i >= MIN // 2: peaks.append(i)
    bounds = [0] + sorted(peaks) + [n]
    segs = [(a, b) for a, b in zip(bounds, bounds[1:]) if b - a >= 8]
    # compare sections by the mean and spread of their features, standardised within the song. The cut (the song's
    # 88th-percentile pair) was calibrated so that, across the set, structure matches typical pop form (about 7 section
    # types, choruses about a third of the song, the first chorus near 50 s): those two figures are targets, not findings.
    Dm = np.array([np.r_[X[a:b].mean(axis=0), X[a:b].std(axis=0)] for a, b in segs])
    Dm = Dm - Dm.mean(axis=0); Dm = Dm / (np.linalg.norm(Dm, axis=1, keepdims=True) + 1e-9)
    sim = Dm @ Dm.T; off = sim[~np.eye(len(segs), dtype=bool)] if len(segs) > 1 else np.array([0.])
    cut = max(.2, float(np.percentile(off, 88)))
    labels = []
    for i in range(len(segs)):
        j = next((j for j in range(i) if sim[i, j] >= cut), None)
        labels.append(labels[j] if j is not None else (max(labels) + 1 if labels else 0))
    out = [{'start': round(a * HOP, 1), 'end': round(b * HOP, 1), 'group': chr(65 + l) if l < 26 else f'G{l}', 'energy': round(float(energy[a:b].mean()), 4)} for (a, b), l in zip(segs, labels)]
    count = {}
    for s in out: count[s['group']] = count.get(s['group'], 0) + 1
    loud = {gp: np.mean([s['energy'] for s in out if s['group'] == gp]) for gp in count}
    rep = [gp for gp in count if count[gp] >= 2]
    chorus = max(rep, key=lambda gp: (loud[gp], count[gp])) if rep else None   # the loudest repeated section
    for s in out: s['chorus_like'] = s['group'] == chorus
    return out, chorus

def run(m):
    out = m.replace('.json', '.structure.json')
    if os.path.exists(out) and not REFRESH: return 'cached'
    d = json.load(open(m)); tmp = tempfile.mkdtemp(prefix='ly_'); feat = m.replace('.json', '.feat.npz')
    try:
        if os.path.exists(feat):
            z = np.load(feat); C, T, e = z['C'].astype(float), z['T'].astype(float), z['e']
            segs, chorus = segments(C, T, e); ch = [s for s in segs if s['chorus_like']]
            json.dump({'id': d['id'], 'duration': round(len(C) * HOP, 1), 'segments': segs, 'sections': len(segs), 'groups': len({s['group'] for s in segs}),
                       'chorus_group': chorus, 'first_chorus_s': ch[0]['start'] if ch else None, 'chorus_share': round(sum(s['end'] - s['start'] for s in ch) / max(1, len(C) * HOP), 2)}, open(out, 'w'))
            return 'ok (cached features)'
        p = fetch(d['url'], f'{tmp}/a')
        if not p: json.dump({'id': d['id'], 'error': 'download failed'}, open(out, 'w')); return 'failed'
        C, T, e = features(p)
        np.savez_compressed(m.replace('.json', '.feat.npz'), C=C.astype(np.float16), T=T.astype(np.float16), e=e.astype(np.float32))   # derived numbers only, for re-tuning
        segs, chorus = segments(C, T, e)
        ch = [s for s in segs if s['chorus_like']]
        json.dump({'id': d['id'], 'duration': round(len(C) * HOP, 1), 'segments': segs, 'sections': len(segs), 'groups': len({s['group'] for s in segs}),
                   'chorus_group': chorus, 'first_chorus_s': ch[0]['start'] if ch else None, 'chorus_share': round(sum(s['end'] - s['start'] for s in ch) / max(1, len(C) * HOP), 2)}, open(out, 'w'))
        return 'ok'
    except Exception as ex:
        json.dump({'id': d['id'], 'error': str(ex)[-200:]}, open(out, 'w')); return 'error'
    finally: shutil.rmtree(tmp, ignore_errors=True)   # never keep the audio

if __name__ == '__main__':
    ms = [m for m in sorted(glob.glob(f'{D}/*.json')) if not m.endswith('.structure.json') and not json.load(open(m)).get('error')]
    with ThreadPoolExecutor(3) as ex: res = list(ex.map(run, ms))
    print({r: res.count(r) for r in set(res)})
