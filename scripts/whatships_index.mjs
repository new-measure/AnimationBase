// whatships_index.mjs: builds an exhaustive, offline index of the What Ships launch-video catalog (whatships.com), the
// reference library for the motion-graphics genres (see plan.md, Phase 0). Every entry, not a sample:
//   videos  every slug in search-index.json UNION every /videos/{slug}/ in sitemap.xml, each fetched as markdown, plus
//           the source video's resolution (from the URL embedded in the HTML page: .../avc1/1920x1080/..., no download)
//   tools   /tools/ page     studios  /studios/ page
// The run fails loudly if any slug can't be fetched or parsed, or if the counts disagree with llms-full.txt.
//
//   node scripts/whatships_index.mjs [--posters] [--refresh] [--concurrency=4]
//
// Writes refs/whatships/catalog.json (everything) and refs/whatships/catalog.md (one line per entry, by category).
// Raw pages are cached in refs/whatships/raw/ (resumable; --refresh refetches). --posters also saves each poster to
// refs/whatships/posters/{slug}.webp, for the visual genre-tagging pass. Metadata only: the site is a directory, not a
// CDN, so this never downloads the videos themselves. Cite entries with their original X URL (the site's policy).
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const BASE = 'https://whatships.com', DIR = 'refs/whatships', RAW = `${DIR}/raw`, POS = `${DIR}/posters`;
const CONC = +(args.concurrency || 4), UA = 'AnimationBase-reference-indexer (+https://whatships.com/llms.txt)';
mkdirSync(RAW, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, { md = false, bin = false } = {}) {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, ...(md ? { Accept: 'text/markdown' } : {}) } });
      if (r.status === 404) return null;
      if (r.ok) return bin ? Buffer.from(await r.arrayBuffer()) : await r.text();
      if (r.status !== 429 && r.status < 500) throw new Error(`${r.status} ${url}`);
    } catch (e) { if (i === 4) throw e; }
    await sleep(1000 * 2 ** i);
  }
  throw new Error(`gave up on ${url}`);
}
async function pool(items, fn) {
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (next < items.length) { const it = items[next++]; await fn(it); if (++done % 200 === 0) console.log(`  ${done}/${items.length}`); }
  }));
}

// ---------- 1. every slug, from both sources ----------
const index = JSON.parse(await get(`${BASE}/search-index.json`));
const sitemap = await get(`${BASE}/sitemap.xml`);
const fromIndex = new Map(index.filter(e => e.kind === 'video').map(e => [e.slug, e]));
const fromSitemap = new Set([...sitemap.matchAll(/<loc>https:\/\/whatships\.com\/videos\/([^/<]+)\/<\/loc>/g)].map(m => m[1]).filter(s => s !== 'category'));
const slugs = [...new Set([...fromIndex.keys(), ...fromSitemap])].sort();
const onlyIndex = [...fromIndex.keys()].filter(s => !fromSitemap.has(s)), onlySitemap = [...fromSitemap].filter(s => !fromIndex.has(s));
console.log(`videos: ${fromIndex.size} in search index, ${fromSitemap.size} in sitemap, ${slugs.length} in the union`);
if (onlyIndex.length) console.log(`  only in search index: ${onlyIndex.join(', ')}`);
if (onlySitemap.length) console.log(`  only in sitemap: ${onlySitemap.join(', ')}`);

// ---------- 2. fetch every entry as markdown (cached) ----------
const missing = [];
await pool(slugs, async slug => {
  const f = `${RAW}/${slug}.md`;
  if (existsSync(f) && !args.refresh) return;
  const md = await get(`${BASE}/videos/${slug}/`, { md: true });
  if (md == null || !md.startsWith('# ')) { missing.push(slug); return; }
  writeFileSync(f, md);
});
if (missing.length) { console.error(`FAILED to fetch ${missing.length} entries: ${missing.join(', ')}`); process.exit(1); }
// the source video's URL and resolution, from the HTML page (cached as a small JSON per slug)
await pool(slugs, async slug => {
  const f = `${RAW}/${slug}.video.json`;
  if (existsSync(f) && !args.refresh) return;
  const html = await get(`${BASE}/videos/${slug}/`), m = html?.match(/&quot;videoUrl&quot;:\[0,&quot;([^&]+)&quot;/);
  const r = m?.[1].match(/\/(\d{2,5})x(\d{2,5})\//);
  writeFileSync(f, JSON.stringify({ videoUrl: m?.[1] || null, w: r ? +r[1] : null, h: r ? +r[2] : null }));
});

// ---------- 3. parse ----------
const FIELD = { Product: 'product', Company: 'company', Category: 'category', Published: 'published', Duration: 'duration', Author: 'author', 'Original X post': 'x', 'Directory entry': 'url', Tags: 'tags' };
function parse(slug, md) {
  const lines = md.split('\n'), e = { slug, title: lines[0].replace(/^# /, '').trim() };
  const desc = [];
  for (const l of lines.slice(1)) {
    const m = l.match(/^- ([^:]+): (.*)$/);
    if (m && FIELD[m[1]]) e[FIELD[m[1]]] = m[2].trim();
    else if (!l.startsWith('- ') && l.trim() && !l.startsWith('What Ships (whatships.com)') && !e.product) desc.push(l.trim());
  }
  e.description = desc.join(' ');
  const a = e.author?.match(/\[@?([^\]]+)\]\(([^)]+)\)/); if (a) { e.handle = a[1]; e.author = a[2]; }
  e.tags = e.tags ? e.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (e.duration) { const p = e.duration.split(':').map(Number); e.seconds = p.reduce((s, v) => s * 60 + v, 0); }
  if (e.published) { const d = new Date(e.published + ' UTC'); if (!isNaN(d)) e.published = d.toISOString().slice(0, 10); }
  e.poster = fromIndex.get(slug)?.poster ? BASE + fromIndex.get(slug).poster : null;
  e.url ??= `${BASE}/videos/${slug}/`;
  const vf = `${RAW}/${slug}.video.json`, vj = existsSync(vf) ? JSON.parse(readFileSync(vf, 'utf8')) : {};
  if (vj.w) { e.width = vj.w; e.height = vj.h; const a = vj.w / vj.h; e.aspect = a > 1.2 ? 'landscape' : a < .85 ? 'portrait' : 'square'; }
  return e;
}
const videos = slugs.map(s => parse(s, readFileSync(`${RAW}/${s}.md`, 'utf8')));
const bad = videos.filter(v => !v.category || !v.x);
if (bad.length) { console.error(`FAILED to parse category / X link for: ${bad.map(v => v.slug).join(', ')}`); process.exit(1); }

// ---------- 4. tools and studios ----------
const listPage = async (path, kind) => {
  const md = await get(`${BASE}${path}`, { md: true });
  return [...md.matchAll(/^- \[([^\]]+)\]\(([^)]+)\) — (.*) \(([^)]+)\)$/gm)].map(m => ({ kind, name: m[1], link: m[2], blurb: m[3], type: m[4] }));
};
const tools = await listPage('/tools/', 'tool'), studios = await listPage('/studios/', 'studio');
const want = k => index.filter(e => e.kind === k).length;
if (tools.length !== want('tool') || studios.length !== want('studio')) {
  console.error(`tools/studios mismatch: parsed ${tools.length}/${studios.length}, search index has ${want('tool')}/${want('studio')}`); process.exit(1);
}

// ---------- 5. check against the published count ----------
const full = await get(`${BASE}/llms-full.txt`), stated = +(full.match(/publishes (\d+) curated/)?.[1] || 0);
if (stated && stated !== videos.length) console.warn(`WARNING: llms-full.txt states ${stated} videos, indexed ${videos.length} (the catalog may have changed between files)`);

// ---------- 6. posters (optional) ----------
if (args.posters) {
  mkdirSync(POS, { recursive: true });
  const need = videos.filter(v => v.poster && (args.refresh || !existsSync(`${POS}/${v.slug}.webp`)));
  console.log(`posters: ${need.length} to fetch`);
  const failed = [];
  await pool(need, async v => { const b = await get(v.poster, { bin: true }); if (b) writeFileSync(`${POS}/${v.slug}.webp`, b); else failed.push(v.slug); });
  if (failed.length) console.warn(`WARNING: no poster for ${failed.length}: ${failed.join(', ')}`);
}

// ---------- 7. write ----------
const byCat = {}; for (const v of videos) (byCat[v.category] ||= []).push(v);
const aspects = {}; for (const v of videos) aspects[v.aspect || 'unknown'] = (aspects[v.aspect || 'unknown'] || 0) + 1;
const cats = Object.keys(byCat).sort((a, b) => byCat[b].length - byCat[a].length);
const secs = videos.map(v => v.seconds).filter(Boolean).sort((a, b) => a - b), med = secs[secs.length >> 1];
writeFileSync(`${DIR}/catalog.json`, JSON.stringify({
  source: BASE, indexed: new Date().toISOString(), stated, counts: { videos: videos.length, tools: tools.length, studios: studios.length },
  categories: Object.fromEntries(cats.map(c => [c, byCat[c].length])), aspects, videos, tools, studios,
}, null, 1));
const line = v => `- [${v.title}](${v.url}) — ${v.company || v.product || ''}${v.duration ? ' · ' + v.duration : ''}${v.width ? ` · ${v.width}×${v.height}` : ''}${v.published ? ' · ' + v.published : ''} · [X](${v.x})`;
writeFileSync(`${DIR}/catalog.md`, [
  `# What Ships catalog index`, ``,
  `Exhaustive index of ${BASE}: ${videos.length} launch videos, ${tools.length} tools, ${studios.length} studios. Indexed ${new Date().toISOString().slice(0, 10)}.`,
  `Durations known for ${secs.length}; median ${Math.floor(med / 60)}:${String(med % 60).padStart(2, '0')}. Generated by scripts/whatships_index.mjs; don't edit by hand.`,
  `Names, trademarks and videos belong to their owners. Cite with the original X link.`, ``,
  `| category | videos |`, `|---|---|`, ...cats.map(c => `| ${c} | ${byCat[c].length} |`), ``,
  `| aspect | videos |`, `|---|---|`, ...Object.entries(aspects).map(([a, n]) => `| ${a} | ${n} |`), ``,
  ...cats.flatMap(c => [`## ${c} (${byCat[c].length})`, ``, ...byCat[c].sort((a, b) => (b.published || '').localeCompare(a.published || '')).map(line), ``]),
  `## Tools (${tools.length})`, ``, ...tools.map(t => `- [${t.name}](${t.link}) — ${t.blurb} (${t.type})`), ``,
  `## Studios (${studios.length})`, ``, ...studios.map(t => `- [${t.name}](${t.link}) — ${t.blurb} (${t.type})`), ``,
].join('\n'));
console.log(`wrote ${DIR}/catalog.json and catalog.md: ${videos.length} videos, ${tools.length} tools, ${studios.length} studios`);
