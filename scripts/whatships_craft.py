"""whatships_craft.py: motion, design and audio measurements of the top-tier films (refs/whatships/top_tier.json), for
the motion presets and design tokens of Phase 2 (plan.md, Phase 0.5). Each video is downloaded to a temp file, measured
and deleted; nothing from it is used in anything we make.

  motion  frames at 24 fps, 320 px grey. d[t] = mean |frame t - frame t-1| is a speed proxy. Hard cuts are spikes.
          A "move" is a run of d above the noise floor (cuts removed), extended out to its slow tails; per move: duration,
          where its speed peaks and where
          its energy centres (easing shape: early = ease-out, middle = ease-in-out, late = ease-in), number of speed
          peaks (staggers or bounces) and their spacing. "Holds" are the still stretches between moves.
  design  full-resolution stills at the middle of the longest holds: palette (8 colours with coverage), background
          luminance, contrast ratio (WCAG) between the darkest and lightest 1% of pixels, saturation.
  audio   onset strength (spectral flux) → tempo by autocorrelation (60–180 BPM) → beat grid; the share of cuts and move
          starts within ±70 ms of a beat, against the share expected by chance.
  strips  every frame of up to 6 key moves (256 × 144 tiles: even sizes, for the JPEG encoder), labelled (strips/<slug>_<k>.jpg), and the stills (stills/<slug>_<k>.jpg),
          both gitignored, for the vision pass.

  python3 scripts/whatships_craft.py [--refresh]
  python3 scripts/whatships_craft.py --local out/launch_demo.mp4 [--local ...] [--out refs/eval/craft]
      measures our own films the same way (Phase 5): each file's name is its slug; outputs go to --out
Writes refs/whatships/craft/<slug>.json. Resumable.
"""
import json, os, sys, shutil, subprocess, tempfile, urllib.request, urllib.parse, colorsys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = 'refs/whatships'
LOCAL = [sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--local']
OUT = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--out'), 'refs/eval/craft' if LOCAL else f'{ROOT}/craft')
STRIPS = f'{OUT}/strips'; STILLS = f'{OUT}/stills'
for d in (OUT, STRIPS, STILLS): os.makedirs(d, exist_ok=True)
FPS, GW, GH = 24, 320, 180
REFRESH = '--refresh' in sys.argv
FONT = ImageFont.load_default(size=15)

def ff(args, **kw): return subprocess.run(['ffmpeg', '-v', 'error', *args], capture_output=True, check=True, **kw).stdout

def download(url, path):
    for u in (url, 'https://proxy.whatships.com/?url=' + urllib.parse.quote(url, safe='')):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'AnimationBase-research'}), timeout=120) as r, open(path, 'wb') as f:
                shutil.copyfileobj(r, f)
            return True
        except Exception: pass
    return False

def frames_grey(path):
    raw = ff(['-i', path, '-vf', f'fps={FPS},scale={GW}:{GH}:force_original_aspect_ratio=decrease,pad={GW}:{GH}:(ow-iw)/2:(oh-ih)/2,format=gray', '-f', 'rawvideo', '-'])
    return np.frombuffer(raw, np.uint8).reshape(-1, GH, GW).astype(np.float32)

def runs(mask):
    out, s = [], None
    for i, m in enumerate(mask):
        if m and s is None: s = i
        if not m and s is not None: out.append((s, i)); s = None
    if s is not None: out.append((s, len(mask)))
    return out

def motion(f):
    d = np.zeros(len(f)); d[1:] = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    med = np.median(d) if len(d) else 0
    local = np.array([np.median(d[max(0, i - 12):i + 12]) for i in range(len(d))])
    cuts = [i for i in range(1, len(d)) if d[i] > max(12, 6 * local[i] + 2) and d[i] >= d[i - 1] and (i + 1 >= len(d) or d[i] >= d[i + 1])]
    dm = d.copy()
    for c in cuts: dm[c] = 0
    floor = max(.25, 2.5 * float(np.median(dm[dm > 0])) if (dm > 0).any() else .25)
    # a move: speed above the floor for ≥ 3 frames; gaps of ≤ 2 frames are bridged
    mask = dm > floor
    for s, e in runs(~mask):
        if e - s <= 2 and s > 0 and e < len(mask): mask[s:e] = True
    # extend each core outward to where its speed falls to 15% of its peak or to the local baseline, so the slow
    # ease-in and ease-out tails (the easing itself) belong to the move
    base = np.array([np.percentile(dm[max(0, i - 36):i + 36], 10) for i in range(len(dm))])
    moves, taken = [], np.zeros(len(dm), bool)
    for s, e in runs(mask):
        if e - s < 3: continue
        pk = float(dm[s:e].max()); stop = lambda i: dm[i] <= max(.15 * pk, base[i] + .1) or taken[i] or i in cuts
        while s > 0 and not stop(s - 1): s -= 1
        while e < len(dm) and not stop(e): e += 1
        taken[s:e] = True
        seg = dm[s:e]; n = e - s; t = np.arange(n)
        centroid = float((seg * t).sum() / seg.sum() / max(1, n - 1))
        peaks = [i for i in range(1, n - 1) if seg[i] >= seg[i - 1] and seg[i] > seg[i + 1] and seg[i] > .5 * seg.max()]
        # only count separate peaks: a valley under 60% of the smaller neighbour between them
        sep = []
        for p in peaks:
            if not sep or seg[sep[-1]:p + 1].min() < .6 * min(seg[sep[-1]], seg[p]): sep.append(p)
        moves.append({'start': round(s / FPS, 3), 'dur': round(n / FPS, 3), 'peak_at': round(int(seg.argmax()) / max(1, n - 1), 2),
                      'centroid': round(centroid, 2), 'peaks': len(sep) or 1,
                      'peak_gap': round(float(np.median(np.diff(sep))) / FPS, 3) if len(sep) > 1 else None,
                      'energy': round(float(seg.sum()), 1), 'max': round(float(seg.max()), 2)})
    holds = [round((e - s) / FPS, 3) for s, e in runs(~mask) if e - s >= FPS // 2]
    return d, cuts, moves, holds, floor

def audio(path, cut_times, move_starts):
    try: raw = ff(['-i', path, '-vn', '-ac', '1', '-ar', '11025', '-f', 'f32le', '-'])
    except subprocess.CalledProcessError: return None
    x = np.frombuffer(raw, np.float32)
    if len(x) < 11025 * 3 or np.abs(x).max() < 1e-4: return {'has_sound': False}
    n, hop = 1024, 256
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    S = np.abs(np.fft.rfft(frames, axis=1))
    flux = np.maximum(0, np.diff(np.log1p(S), axis=0)).sum(axis=1); flux = np.concatenate([[0], flux])
    flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    rate = 11025 / hop
    ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
    lags = np.arange(len(ac)) / rate
    ok = (lags >= 60 / 180) & (lags <= 60 / 60)
    if not ok.any(): return {'has_sound': True}
    period = float(lags[ok][ac[ok].argmax()]); bpm = 60 / period
    # beat phase: the offset whose grid collects the most onset strength
    offs = np.linspace(0, period, 48, endpoint=False)
    score = [flux[np.clip(((np.arange(offs_i, len(flux) / rate, period)) * rate).astype(int), 0, len(flux) - 1)].sum() for offs_i in offs]
    phase = float(offs[int(np.argmax(score))])
    near = lambda t: abs(((t - phase + period / 2) % period) - period / 2) <= .07
    rms = float(np.sqrt((x ** 2).mean()))
    chance = min(1, .14 / period)
    return {'has_sound': True, 'bpm': round(bpm, 1), 'beat_phase': round(phase, 3), 'rms': round(rms, 4),
            'cuts_on_beat': round(sum(map(near, cut_times)) / len(cut_times), 2) if cut_times else None,
            'moves_on_beat': round(sum(map(near, move_starts)) / len(move_starts), 2) if move_starts else None,
            'chance_on_beat': round(chance, 2), 'n_cuts': len(cut_times), 'n_moves': len(move_starts)}

def lum(c):
    def ch(v): v /= 255; return v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4
    r, g, b = c; return .2126 * ch(r) + .7152 * ch(g) + .0722 * ch(b)

def palette(img):
    small = img.convert('RGB').resize((160, 90))
    q = small.quantize(8, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:24]; counts = sorted(q.getcolors(), reverse=True)
    cols = [{'hex': '#%02x%02x%02x' % tuple(pal[i * 3:i * 3 + 3]), 'rgb': tuple(pal[i * 3:i * 3 + 3]), 'share': round(n / (160 * 90), 3)} for n, i in counts]
    bg = cols[0]; L = lum(bg['rgb'])
    # contrast between the darkest and lightest 1% of the full-resolution frame (thin text survives, unlike a palette)
    Y = np.asarray(img.convert('RGB'), np.float32) / 255
    Y = np.where(Y <= .03928, Y / 12.92, ((Y + .055) / 1.055) ** 2.4) @ np.array([.2126, .7152, .0722])
    lo, hi = np.percentile(Y, 1), np.percentile(Y, 99)
    contrast = (hi + .05) / (lo + .05)
    sat = float(np.mean([colorsys.rgb_to_hsv(*(np.array(c['rgb']) / 255))[1] * c['share'] for c in cols]) * len(cols))
    for c in cols: del c['rgb']
    return {'palette': cols, 'bg': bg['hex'], 'bg_luminance': round(L, 3), 'contrast': round(contrast, 1), 'saturation': round(sat, 2)}

def strip(frames_dir, first, last, label, out):
    idx = list(range(max(1, first), last + 1))[:36]
    tiles = [Image.open(f'{frames_dir}/{i:05d}.jpg') for i in idx if os.path.exists(f'{frames_dir}/{i:05d}.jpg')]
    if not tiles: return False
    cols = 6; w, h = tiles[0].size; im = Image.new('RGB', (cols * w, 26 + ((len(tiles) + cols - 1) // cols) * h), '#222')
    dr = ImageDraw.Draw(im); dr.text((6, 5), label, fill='#fff', font=FONT)
    for k, (i, t) in enumerate(zip(idx, tiles)):
        x, y = (k % cols) * w, 26 + (k // cols) * h; im.paste(t, (x, y))
        dr.rectangle([x, y, x + 58, y + 18], fill='#FFE14D'); dr.text((x + 3, y + 1), f'f{i - idx[0]:02d}', fill='#000', font=FONT)
    im.save(out, quality=85); return True

def analyse(slug):
    out = f'{OUT}/{slug}.json'
    if os.path.exists(out) and not REFRESH: return 'cached'
    local = next((p for p in LOCAL if os.path.splitext(os.path.basename(p))[0] == slug), None)
    meta = {} if local else json.load(open(f'{ROOT}/raw/{slug}.video.json'))
    tmp = tempfile.mkdtemp(prefix='craft_'); vf = f'{tmp}/v.mp4'
    try:
        if local: shutil.copy(local, vf)
        elif not meta.get('videoUrl') or not download(meta['videoUrl'], vf):
            json.dump({'slug': slug, 'error': 'download failed'}, open(out, 'w')); return 'failed'
        f = frames_grey(vf); dur = len(f) / FPS
        d, cuts, moves, holds, floor = motion(f)
        cut_t = [c / FPS for c in cuts]
        a = audio(vf, cut_t, [m['start'] for m in moves])
        # colour frames for strips (24 fps, 240 px)
        fd = f'{tmp}/f'; os.makedirs(fd)
        ff(['-i', vf, '-vf', f'fps={FPS},scale=256:144:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=256:144:(ow-iw)/2:(oh-ih)/2', '-q:v', '5', f'{fd}/%05d.jpg'])
        # key moves: the biggest short moves, spread over the film
        key = sorted([m for m in moves if .2 <= m['dur'] <= 2.5], key=lambda m: -m['energy'])
        chosen = []
        for m in key:
            if all(abs(m['start'] - c['start']) > 1.5 for c in chosen): chosen.append(m)
            if len(chosen) == 6: break
        chosen.sort(key=lambda m: m['start'])
        strips = []
        for k, m in enumerate(chosen):
            s = int(m['start'] * FPS) - 2; e = int((m['start'] + m['dur']) * FPS) + 5
            p = f'{STRIPS}/{slug}_{k}.jpg'
            if strip(fd, s + 1, e + 1, f'{slug}  move {k}  starts {m["start"]:.2f}s  ~{m["dur"]:.2f}s  every frame @24fps (f00 = 2 frames before)', p):
                strips.append({'k': k, 'start': m['start'], 'dur': m['dur'], 'file': os.path.basename(p)})
        # design stills: middles of the longest holds, full resolution
        mask_runs = []
        still_mask = np.ones(len(d), bool)
        for m in moves: still_mask[int(m['start'] * FPS):int((m['start'] + m['dur']) * FPS)] = False
        for c in cuts: still_mask[c] = False
        for s, e in runs(still_mask):
            if e - s >= FPS // 2: mask_runs.append((e - s, (s + e) / 2 / FPS))
        stills = []
        for k, (_, t) in enumerate(sorted(mask_runs, reverse=True)[:4]):
            png = ff(['-ss', f'{t:.3f}', '-i', vf, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])
            img = Image.open(__import__('io').BytesIO(png)); p = f'{STILLS}/{slug}_{k}.jpg'
            img.convert('RGB').resize((960, int(960 * img.height / img.width))).save(p, quality=88)
            stills.append({'k': k, 't': round(t, 2), 'file': os.path.basename(p), **palette(img)})
        json.dump({'slug': slug, 'duration': round(dur, 2), 'noise_floor': round(floor, 2), 'cuts': [round(c, 2) for c in cut_t],
                   'moves': moves, 'holds': holds, 'audio': a, 'strips': strips, 'stills': stills}, open(out, 'w'))
        return 'ok'
    finally:
        shutil.rmtree(tmp, ignore_errors=True)   # never keep the video

if __name__ == '__main__':
    tier = [{'slug': os.path.splitext(os.path.basename(p))[0]} for p in LOCAL] if LOCAL else json.load(open(f'{ROOT}/top_tier.json'))
    from concurrent.futures import ThreadPoolExecutor
    tally = {}
    with ThreadPoolExecutor(3) as ex:
        def safe(t):
            try: return t['slug'], analyse(t['slug'])
            except Exception as e:   # one film's failure is recorded, not fatal
                json.dump({'slug': t['slug'], 'error': str(e)[-300:]}, open(f"{OUT}/{t['slug']}.json", 'w')); return t['slug'], 'error'
        for i, r in enumerate(ex.map(safe, tier)):
            tally[r[1]] = tally.get(r[1], 0) + 1; print(f'{i + 1}/{len(tier)} {r[0]}: {r[1]}', flush=True)
    print('done', tally)
