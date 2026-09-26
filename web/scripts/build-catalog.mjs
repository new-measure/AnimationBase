// build-catalog.mjs: turns the What Ships scan in ../refs/whatships into web/data/catalog.json, a small file the app
// reads for genre stats, brief defaults and similar-film retrieval. Public screens only ever show stats, tags and the
// original X links from this file, never posters.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REFS = resolve(HERE, '../../refs/whatships');
const OUT = resolve(HERE, '../data/catalog.json');
const read = f => JSON.parse(readFileSync(resolve(REFS, f), 'utf8'));

// the families code can make end to end (docs/genres/README.md)
const FAMILIES = {
  ui_walkthrough: { label: 'UI walkthrough', blurb: 'The product’s interface, redesigned for film, acting out what it does.', recipe: 'ui_walkthrough.md', mg: true },
  type_led: { label: 'Type-led', blurb: 'Bold kinetic typography carries the message.', recipe: 'type_led.md', mg: true },
  brand_graphic: { label: 'Brand & graphic', blurb: 'Shapes, logo and colour in designed motion.', recipe: 'brand_graphic.md', mg: true },
  illustrated: { label: 'Illustrated & character', blurb: 'A hand-drawn world with a character who acts it out.', recipe: 'illustrated.md', mg: false },
  abstract: { label: 'Abstract & atmospheric', blurb: 'Mood first: gradients, particles, light and texture.', recipe: 'abstract.md', mg: true },
};

const catalog = read('catalog.json'), visual = read('visual.json'), genres = read('genres.json');
const familyOf = {};
for (const [fam, g] of Object.entries(genres)) for (const s of g.slugs || []) familyOf[s] = fam;

// measured pacing: the summary table at the top of pacing.md, keyed by family label
const pacing = {};
if (existsSync(resolve(REFS, 'pacing.md'))) {
  const lines = readFileSync(resolve(REFS, 'pacing.md'), 'utf8').split('\n').filter(l => l.startsWith('|'));
  const head = lines[0].split('|').map(s => s.trim()).filter(Boolean);
  for (const l of lines.slice(2)) {
    const cells = l.split('|').map(s => s.trim()).filter(Boolean);
    if (cells.length !== head.length) continue;
    const row = Object.fromEntries(head.map((h, i) => [h, cells[i]]));
    pacing[row.family] = {
      films: +row.films, length: +row['length s'], shot: +row['shot s'], cutsPerMin: +row['cuts/min'],
      beat: +row['beat s'], endCard: +row['end card s'], endCardShare: row['end card'],
    };
  }
}

const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const share = (arr, pred) => arr.length ? Math.round(1000 * arr.filter(pred).length / arr.length) / 10 : 0;
const dist = (arr, key) => { const c = {}; for (const x of arr) c[x[key]] = (c[x[key]] || 0) + 1; return Object.fromEntries(Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, Math.round(1000 * v / arr.length) / 10])); };

const films = catalog.videos.map(v => {
  const t = visual[v.slug] || {};
  return {
    slug: v.slug, title: v.title, company: v.company, category: v.category, x: v.x, url: v.url,
    seconds: v.seconds ?? null, aspect: v.aspect, tags: v.tags || [], description: (v.description || '').slice(0, 280),
    family: familyOf[v.slug] || 'unclassified', medium: t.medium, bg: t.bg, text: t.text, overlays: t.overlays || [], note: t.note || '',
  };
});

const pacingLabel = { ui_walkthrough: 'Product UI walkthrough', type_led: 'Type-led announcement', brand_graphic: 'Brand and graphic motion', illustrated: 'Illustrated and character', abstract: 'Abstract and atmospheric' };
const families = {};
for (const [key, meta] of Object.entries(FAMILIES)) {
  const fs = films.filter(f => f.family === key);
  const byCat = {};
  for (const f of fs) (byCat[f.category] ||= []).push(f);
  families[key] = {
    key, ...meta, count: fs.length, share: Math.round(1000 * fs.length / films.length) / 10,
    medianSeconds: median(fs.map(f => f.seconds).filter(Boolean)),
    bg: dist(fs, 'bg'), text: dist(fs, 'text'), aspect: dist(fs, 'aspect'),
    cursor: share(fs, f => f.overlays.includes('cursor')), logo: share(fs, f => f.overlays.includes('logo')),
    pacing: pacing[pacingLabel[key]] || null,
    representatives: (genres[key]?.representatives || []),
    byCategory: Object.fromEntries(Object.entries(byCat).map(([c, a]) => [c, { count: a.length, bg: dist(a, 'bg'), text: dist(a, 'text'), medianSeconds: median(a.map(f => f.seconds).filter(Boolean)) }])),
  };
}

// only films from the code-makeable families go to retrieval
const index = films.filter(f => FAMILIES[f.family]);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ source: catalog.source, indexed: catalog.indexed, total: films.length, categories: Object.keys(catalog.categories), families, films: index }));
console.log(`catalog.json: ${Object.keys(families).length} families, ${index.length} films indexed (of ${films.length})`);
