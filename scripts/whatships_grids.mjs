// whatships_grids.mjs: packs every poster in refs/whatships/posters/ into numbered 4 × 4 contact grids, for the visual
// tagging pass (plan.md, Phase 0). Each grid gNNN.jpg (1920 × 1080, 16 cells of 480 × 270) comes with gNNN.json, the
// slugs in cell order (cell 1 is top-left, row by row). Posters are letterboxed to 16:9 so square and vertical films
// keep their shape. Run scripts/whatships_index.mjs --posters first.
//   node scripts/whatships_grids.mjs [--chrome=<path>]
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const CHROME = [args.chrome, process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .find(p => p && existsSync(p));
const DIR = 'refs/whatships', OUT = `${DIR}/grids`, PER = 16, COLS = 4, CW = 480, CH = 270;
mkdirSync(OUT, { recursive: true });

const { videos } = JSON.parse(readFileSync(`${DIR}/catalog.json`, 'utf8'));
const slugs = videos.map(v => v.slug).sort();
const noPoster = slugs.filter(s => !existsSync(`${DIR}/posters/${s}.webp`));
if (noPoster.length) { console.error(`missing posters (run whatships_index.mjs --posters): ${noPoster.join(', ')}`); process.exit(1); }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve(DIR)).href + '/');
const n = Math.ceil(slugs.length / PER);
for (let g = 0; g < n; g++) {
  const cells = slugs.slice(g * PER, (g + 1) * PER), id = 'g' + String(g).padStart(3, '0');
  const url = await page.evaluate(async (srcs, id, COLS, CW, CH) => {
    const c = document.createElement('canvas'); c.width = COLS * CW; c.height = Math.ceil(16 / COLS) * CH; const x = c.getContext('2d');
    x.fillStyle = '#777'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < srcs.length; i++) {
      const img = new Image(); img.src = srcs[i]; await img.decode();
      const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH, k = Math.min((CW - 4) / img.width, (CH - 4) / img.height);
      const w = img.width * k, h = img.height * k;
      x.fillStyle = '#000'; x.fillRect(cx + 2, cy + 2, CW - 4, CH - 4);
      x.drawImage(img, cx + (CW - w) / 2, cy + (CH - h) / 2, w, h);
      x.fillStyle = '#FFE14D'; x.fillRect(cx + 2, cy + 2, 46, 34); x.fillStyle = '#000'; x.font = 'bold 26px sans-serif'; x.fillText(String(i + 1), cx + 8, cy + 29);
    }
    x.fillStyle = '#FFE14D'; x.font = 'bold 18px sans-serif'; x.fillText(id, c.width - 64, c.height - 8);
    return c.toDataURL('image/jpeg', .88);
  }, cells.map(s => `posters/${s}.webp`), id, COLS, CW, CH);
  writeFileSync(`${OUT}/${id}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  writeFileSync(`${OUT}/${id}.json`, JSON.stringify(cells));
}
await browser.close();
console.log(`${n} grids → ${OUT} (${slugs.length} posters)`);
