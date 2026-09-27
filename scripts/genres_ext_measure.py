"""genres_ext_measure.py: measures the reference films of the new genres (refs/genres_ext/<genre>.verified.json) with the
same instruments as the launch-film top tier (whatships_craft.py): moves, easing, holds, cuts, sound, palette and
contrast; plus a labelled pacing sheet for the beat pass and every-frame strips and stills for the craft vision pass.
Each video is downloaded (≤ 720p) to a temp file, measured and deleted; only the numbers and the study images (gitignored)
are kept, and nothing is used in anything we make. YouTube is fetched directly, Vimeo through its public embed player.
Motion is measured over the first ANALYSE seconds (long tutorials and explainers run to 10+ minutes); the pacing sheet
covers the whole film.
  python3 scripts/genres_ext_measure.py [genre ...] [--refresh]
Writes refs/genres_ext/measure/<genre>/<id>.json, and sheets/, strips/, stills/ beside it. Resumable.
"""
import json, os, re, sys, shutil, subprocess, tempfile, io
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from concurrent.futures import ThreadPoolExecutor
sys.argv_saved = sys.argv; sys.argv = [sys.argv[0]]            # whatships_craft reads argv at import
sys.path.insert(0, 'scripts'); import whatships_craft as C
sys.argv = sys.argv_saved

ROOT = 'refs/genres_ext'; ANALYSE = 180; FPS = C.FPS; MAX_TILES = 72
REFRESH = '--refresh' in sys.argv
GENRES = [a for a in sys.argv[1:] if not a.startswith('--')] or ['explainers', 'data_stories', 'tutorials', 'lyric_videos']
FONT = ImageFont.load_default(size=16); TITLE = ImageFont.load_default(size=18)

def fid(url):
    m = re.search(r'(?:v=|youtu\.be/|vimeo\.com/(?:video/)?)([\w-]+)', url); return m.group(1) if m else re.sub(r'\W', '', url)[-16:]

def download(url, out):
    if 'vimeo.com' in url:
        url = 'https://player.vimeo.com/video/' + fid(url); extra = ['--referer', 'https://vimeo.com/']
    else: extra = []
    r = subprocess.run(['yt-dlp', '-q', '--no-warnings', '--no-playlist', *extra, '-f', 'bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/bv*[height<=720]+ba/b[height<=720]/b',
                        '--merge-output-format', 'mp4', '-o', out, url], capture_output=True, text=True, timeout=900)
    return r.returncode == 0 and os.path.exists(out), (r.stderr or '')[-300:]

def grey(path, secs):
    raw = C.ff(['-t', str(secs), '-i', path, '-vf', f'fps={FPS},scale={C.GW}:{C.GH}:force_original_aspect_ratio=decrease,pad={C.GW}:{C.GH}:(ow-iw)/2:(oh-ih)/2,format=gray', '-f', 'rawvideo', '-'])
    return np.frombuffer(raw, np.uint8).reshape(-1, C.GH, C.GW)

def sheet(path, dur, out, title):
    step = max(1, int(np.ceil(dur / MAX_TILES))); d = tempfile.mkdtemp()
    try:
        C.ff(['-i', path, '-vf', f'fps=1/{step},scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2', '-q:v', '4', f'{d}/%04d.jpg'])
        fr = sorted(os.listdir(d)); cols = 6; im = Image.new('RGB', (cols * 320, 30 + ((len(fr) + cols - 1) // cols) * 180), '#222'); dr = ImageDraw.Draw(im)
        dr.text((8, 5), f'{title} · {dur:.1f} s · one frame every {step} s', fill='#fff', font=TITLE)
        for i, f in enumerate(fr):
            x, y = (i % cols) * 320, 30 + (i // cols) * 180; im.paste(Image.open(f'{d}/{f}'), (x, y))
            dr.rectangle([x, y, x + 58, y + 22], fill='#FFE14D'); dr.text((x + 4, y + 2), f'{i * step}s', fill='#000', font=FONT)
        im.save(out, quality=85); return step, len(fr)
    finally: shutil.rmtree(d, ignore_errors=True)

MIN_FREE = 2 * 1024 ** 3   # stop (don't fail) below 2 GB free: a full disk breaks everything else on the machine
def measure(genre, film):
    base = f'{ROOT}/measure/{genre}'; key = fid(film['url']); out = f'{base}/{key}.json'
    if os.path.exists(out) and not REFRESH: return 'cached'
    if shutil.disk_usage(tempfile.gettempdir()).free < MIN_FREE: return 'skipped: low disk'
    tmp = tempfile.mkdtemp(prefix='gx_'); vf = f'{tmp}/v.mp4'
    try:
        ok, err = download(film['url'], vf)
        if not ok: json.dump({'id': key, 'title': film['title'], 'error': 'download failed', 'detail': err}, open(out, 'w')); return 'failed'
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vf], capture_output=True, text=True).stdout or 0)
        secs = min(dur, ANALYSE); f = grey(vf, secs)
        d, cuts, moves, holds, floor = C.motion(f); cut_t = [c / FPS for c in cuts]
        # sound: over the whole film (tempo and beat sync), with cuts and moves from the analysed window
        a = C.audio(vf, cut_t, [m['start'] for m in moves])
        # every-frame strips of up to 4 key moves, and 3 stills from the longest holds (all inside the analysed window)
        fd = f'{tmp}/f'; os.makedirs(fd)
        C.ff(['-t', str(secs), '-i', vf, '-vf', f'fps={FPS},scale=256:144:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=256:144:(ow-iw)/2:(oh-ih)/2', '-q:v', '5', f'{fd}/%05d.jpg'])
        key_moves = sorted([m for m in moves if .2 <= m['dur'] <= 2.5], key=lambda m: -m['energy']); chosen = []
        for m in key_moves:
            if all(abs(m['start'] - c['start']) > 3 for c in chosen): chosen.append(m)
            if len(chosen) == 4: break
        strips = []
        for k, m in enumerate(sorted(chosen, key=lambda m: m['start'])):
            s = int(m['start'] * FPS) - 2; e = int((m['start'] + m['dur']) * FPS) + 5; p = f'{base}/strips/{key}_{k}.jpg'
            if C.strip(fd, s + 1, e + 1, f'{key}  move {k}  starts {m["start"]:.2f}s  ~{m["dur"]:.2f}s  every frame @24fps (f00 = 2 frames before)', p):
                strips.append({'k': k, 'start': m['start'], 'dur': m['dur'], 'file': os.path.basename(p)})
        mask = np.ones(len(d), bool)
        for m in moves: mask[int(m['start'] * FPS):int((m['start'] + m['dur']) * FPS)] = False
        for c in cuts: mask[c] = False
        still_runs = sorted([(e - s, (s + e) / 2 / FPS) for s, e in C.runs(mask) if e - s >= FPS // 2], reverse=True)[:3]
        stills = []
        for k, (_, t) in enumerate(still_runs):
            png = C.ff(['-ss', f'{t:.3f}', '-i', vf, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])
            img = Image.open(io.BytesIO(png)); p = f'{base}/stills/{key}_{k}.jpg'
            img.convert('RGB').resize((960, int(960 * img.height / img.width))).save(p, quality=88)
            stills.append({'k': k, 't': round(t, 2), 'file': os.path.basename(p), 'h': int(960 * img.height / img.width), **C.palette(img)})
        step, tiles = sheet(vf, dur, f'{base}/sheets/{key}.jpg', f'{key} · {film["title"][:60]}')
        json.dump({'id': key, 'genre': genre, 'title': film['title'], 'creator': film.get('creator'), 'url': film['url'], 'medium': film.get('medium'),
                   'feasible': film.get('feasible'), 'duration': round(dur, 2), 'analysed_s': round(secs, 2), 'noise_floor': round(floor, 2),
                   'cuts': [round(c, 2) for c in cut_t], 'moves': moves, 'holds': holds, 'audio': a, 'strips': strips, 'stills': stills,
                   'sheet': {'file': f'{key}.jpg', 'step': step, 'tiles': tiles}}, open(out, 'w'))
        return 'ok'
    except Exception as e:
        json.dump({'id': key, 'title': film['title'], 'error': str(e)[-300:]}, open(out, 'w')); return 'error'
    finally: shutil.rmtree(tmp, ignore_errors=True)   # never keep the video

if __name__ == '__main__':
    for g in GENRES:
        for sub in ('', '/sheets', '/strips', '/stills'): os.makedirs(f'{ROOT}/measure/{g}{sub}', exist_ok=True)
        films = [x for x in json.load(open(f'{ROOT}/{g}.verified.json'))['films'] if x['check']['ok']]
        tally = {}
        with ThreadPoolExecutor(3) as ex:
            for i, r in enumerate(ex.map(lambda x: measure(g, x), films)):
                tally[r] = tally.get(r, 0) + 1
                if (i + 1) % 10 == 0 or i + 1 == len(films): print(f'{g}: {i + 1}/{len(films)} {tally}', flush=True)
    print('done')
