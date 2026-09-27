"""genres_ext_index.py: verifies and indexes the reference sets for genres beyond launch films (refs/genres_ext/*.json,
gathered from awards, curators and recognised studios). Metadata and links only: nothing is downloaded.
For every film it asks the platform's public oEmbed endpoint (YouTube, Vimeo) whether the link resolves, and records the
platform's own title and uploader next to what the researcher claimed, so a wrong or dead link can't hide.
  python3 scripts/genres_ext_index.py
Writes refs/genres_ext/<genre>.verified.json (every film, with its check) and refs/genres_ext/index.md (the index).
"""
import json, glob, os, re, time, urllib.request, urllib.parse, collections
from concurrent.futures import ThreadPoolExecutor

D = 'refs/genres_ext'
UA = {'User-Agent': 'AnimationBase-reference-indexer'}
MEDIA = {
    'explainers': ['motion_graphics', 'flat_illustration', 'character_2d', 'kinetic_type', 'data_viz', 'screen_capture', '3d', 'mixed', 'live_action'],
    'tutorials': ['ui_motion', 'screen_capture', 'presenter_and_screen', 'motion_graphics', 'mixed', 'live_action'],
    'data_stories': ['animated_charts', 'maps', 'math_animation', 'motion_graphics', 'data_art', '3d', 'mixed', 'live_action'],
    'lyric_videos': ['kinetic_type', 'type_over_illustration', 'type_over_footage', 'hand_lettering', 'motion_graphics', 'character_2d', '3d', 'mixed'],
}

def oembed(url):
    if re.search(r'youtu\.?be', url): ep = 'https://www.youtube.com/oembed?format=json&url='
    elif 'vimeo.com' in url: ep = 'https://vimeo.com/api/oembed.json?url='
    else: ep = None
    for attempt in range(3):
        try:
            if ep:
                with urllib.request.urlopen(urllib.request.Request(ep + urllib.parse.quote(url, safe=''), headers=UA), timeout=20) as r:
                    j = json.loads(r.read()); return {'ok': True, 'title': j.get('title'), 'author': j.get('author_name'), 'how': 'oembed'}
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA, method='GET'), timeout=20) as r:
                return {'ok': r.status < 400, 'title': None, 'author': None, 'how': f'http {r.status}'}
        except urllib.error.HTTPError as e:
            if e.code in (401, 403) and ep and 'youtube' in ep:   # embedding disabled: the video exists but can't be embedded
                return {'ok': True, 'title': None, 'author': None, 'how': f'oembed {e.code} (exists, embedding off)'}
            if e.code in (404, 400): return {'ok': False, 'title': None, 'author': None, 'how': f'{e.code}'}
        except Exception as e:
            last = str(e)
        time.sleep(1.5 * (attempt + 1))
    return {'ok': False, 'title': None, 'author': None, 'how': 'unreachable'}

norm = lambda s: re.sub(r'[^a-z0-9]', '', (s or '').lower())
def creator_match(claimed, got, client):
    # the uploader matches if it contains (or is contained in) the creator or any part of the client ("Artist / Label"),
    # ignoring a VEVO suffix and parenthesised credits
    if not got: return None
    g = norm(re.sub(r'vevo$', '', got, flags=re.I)) or norm(got)
    parts = [re.sub(r'\(.*?\)', '', p) for c in (claimed, client) if c for p in re.split(r'[/,&]| ft\.? | for | via ', c)]
    return any(norm(p) and len(norm(p)) > 2 and (norm(p) in g or g in norm(p)) for p in parts) or None

rows, summary = [], {}
for f in sorted(glob.glob(f'{D}/*.json')):
    if f.endswith('.verified.json'): continue
    g = json.load(open(f)); genre = g['genre']; films = g['films']
    seen, uniq = set(), []
    for x in films:
        k = norm(x['url'].split('&')[0])
        if k not in seen: seen.add(k); uniq.append(x)
    with ThreadPoolExecutor(6) as ex: checks = list(ex.map(lambda x: oembed(x['url']), uniq))
    out = []
    for x, c in zip(uniq, checks):
        x = dict(x); x['check'] = c; x['creator_matches_uploader'] = creator_match(x.get('creator'), c.get('author'), x.get('client'))
        if x.get('medium') not in MEDIA.get(genre, []): x['medium_invalid'] = True
        out.append(x)
    json.dump({**g, 'films': out}, open(f'{D}/{genre}.verified.json', 'w'), indent=1)
    ok = [x for x in out if x['check']['ok']]
    cre = collections.Counter(x.get('creator') for x in ok)
    summary[genre] = dict(definition=g.get('definition'), sources=g.get('sources', []), claimed=len(films), duplicates=len(films) - len(uniq), resolved=len(ok),
        dead=[(x['title'], x['url'], x['check']['how']) for x in out if not x['check']['ok']],
        mismatch=[(x['title'], x.get('creator'), x['check'].get('author')) for x in ok if x['creator_matches_uploader'] is None and x['check'].get('author')],
        medium=collections.Counter(x['medium'] for x in ok), feasible=collections.Counter(x['feasible'] for x in ok),
        platform=collections.Counter(x['platform'] for x in ok), top_creators=cre.most_common(4),
        years=sorted(x['year'] for x in ok if x.get('year')), films=ok)

L = ['# Reference sets beyond launch films', '',
     'Curated from awards, curators and recognised studios by the research pass, then **every link checked independently** against',
     'the platform (YouTube and Vimeo oEmbed): the uploader and title below are the platform\'s, not the researcher\'s. Metadata',
     'and links only: nothing was downloaded. Generated by scripts/genres_ext_index.py.', '',
     '| genre | films (verified) | code can make it: yes / partial / no | main media | years |', '|---|---|---|---|---|']
for gname, s in summary.items():
    y = s['years']; fz = s['feasible']
    L.append(f"| {gname} | {s['resolved']} of {s['claimed']} | {fz.get('yes', 0)} / {fz.get('partial', 0)} / {fz.get('no', 0)} | "
             + ', '.join(f'{k} {v}' for k, v in s['medium'].most_common(3)) + f" | {y[0] if y else '–'}–{y[-1] if y else '–'} |")
for gname, s in summary.items():
    L += ['', f'## {gname}', '', f"{s['definition']}", '',
          f"Checked: {s['resolved']} of {s['claimed']} resolve ({s['duplicates']} duplicates removed). Most-used creators: "
          + ', '.join(f'{c} {n}' for c, n in s['top_creators']) + '.', '']
    if s['dead']: L += ['Dropped (link did not resolve): ' + '; '.join(f'{t} ({h})' for t, u, h in s['dead']) + '.', '']
    if s['mismatch']: L += ['Uploader differs from the credited creator (often fine: a label or client channel uploads a studio\'s work): '
                            + '; '.join(f'{t}: credited {c}, uploaded by {a}' for t, c, a in s['mismatch'][:12]) + ('…' if len(s['mismatch']) > 12 else '') + '.', '']
    L += ['Sources: ' + '; '.join(f"[{x['name']}]({x['url']})" for x in s['sources']), '',
          '| # | film | creator | year | length | medium | code | why it\'s a reference |', '|---|---|---|---|---|---|---|---|']
    for i, x in enumerate(s['films'], 1):
        d = x.get('duration_s'); ln = f'{d // 60}:{d % 60:02d}' if d else '–'
        why = x.get('quality_signal', '').replace('|', '/')
        L.append(f"| {i} | [{x['title'].replace('|', '/')}]({x['url']}) | {(x.get('creator') or '').replace('|', '/')} | {x.get('year') or '–'} | {ln} | {x['medium']} | {x['feasible']} | {why} |")
open(f'{D}/index.md', 'w').write('\n'.join(L) + '\n')
for gname, s in summary.items(): print(gname, 'resolved', s['resolved'], '/', s['claimed'], 'dead', len(s['dead']), 'mismatch', len(s['mismatch']), dict(s['feasible']))
