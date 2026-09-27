// Serves a run's preview: studio.html (plus a small bridge so the app can drive it), the engine, the film's own files and
// the contact sheets the agent made. Each file resolves, in order, from the film's current version (Neon), the run's
// contact sheets (S3), and the run's engine snapshot (S3); runs made before snapshots existed are served from disk. The preview runs in a sandboxed iframe without same-origin rights, so the agent's code
// can't reach the app; the bridge talks to the parent with postMessage.
import { readFileSync, statSync, createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { wsPath } from '@/server/workspace';
import { verifyRunToken } from '@/server/auth';
import { getRun, getVersion, type VersionRow } from '@/server/db';
import { getBuffer } from '@/server/storage';
import { contentType } from '@/server/engine';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.md': 'text/plain; charset=utf-8',
};

// The bridge: fits the stage to the iframe, and answers seek / play / pause with time updates. W, H and DUR are the
// engine's globals; window.seek(t) renders the frame at t.
const BRIDGE = `<script>(() => {
  const post = m => parent.postMessage({ __anim: 1, ...m }, '*');
  addEventListener('error', e => post({ type: 'error', message: e.message }));
  let playing = false, t = 0, busy = false, want = null, start = 0, t0 = 0, dur = 0;
  const fit = () => { const st = document.getElementById('stage'); if (!st) return; const s = Math.min(innerWidth / W, innerHeight / H);
    st.style.transform = 'translate(' + (innerWidth - W * s) / 2 + 'px,' + (innerHeight - H * s) / 2 + 'px) scale(' + s + ')'; };
  const go = async () => { if (busy) return; busy = true;
    while (want != null) { const x = want; want = null; try { await window.seek(x); } catch (e) { post({ type: 'error', message: String(e) }); } t = x; post({ type: 'time', t }); }
    busy = false; };
  const seekTo = x => { want = Math.max(0, Math.min(dur, x)); go(); };
  const loop = () => { if (!playing) return; const x = t0 + (performance.now() - start) / 1000;
    if (x >= dur) { playing = false; seekTo(dur); post({ type: 'paused' }); return; }
    if (!busy) seekTo(x); requestAnimationFrame(loop); };
  addEventListener('message', e => { const m = e.data || {};
    if (m.type === 'seek') { playing = false; seekTo(m.t); }
    else if (m.type === 'play') { t0 = t >= dur - .05 ? 0 : t; start = performance.now(); playing = true; loop(); }
    else if (m.type === 'pause') playing = false; });
  const wait = () => { if (!window.ready) return setTimeout(wait, 50); dur = DUR; fit(); addEventListener('resize', fit); seekTo(0); post({ type: 'ready', dur, w: W, h: H }); };
  addEventListener('load', wait);
})();</script>
<style>html, body { overflow: hidden; background: transparent !important; } body.render #view { width: 100vw !important; height: 100vh; aspect-ratio: auto; }</style>`;

// small caches: engine files never change for a hash; a version row never changes once written
const engineCache = new Map<string, Buffer | null>();
let engineBytes = 0;
const versionCache = new Map<string, VersionRow | null>();
async function engineFile(hash: string, rel: string): Promise<Buffer | null> {
  const key = `${hash}/${rel}`;
  if (engineCache.has(key)) return engineCache.get(key)!;
  const b = await getBuffer(`engines/${hash}/files/${rel}`);
  if (engineBytes > 200e6) { engineCache.clear(); engineBytes = 0; }
  engineCache.set(key, b); engineBytes += b?.length ?? 0;
  return b;
}
async function version(runId: string, v: number): Promise<VersionRow | null> {
  const key = `${runId}@${v}`;
  if (!versionCache.has(key)) { if (versionCache.size > 500) versionCache.clear(); versionCache.set(key, await getVersion(runId, v)); }
  return versionCache.get(key)!;
}

function respond(body: Buffer | string, rel: string, req: Request) {
  const url = new URL(req.url);
  const headers: Record<string, string> = {
    'Content-Type': TYPES[extname(rel).toLowerCase()] || contentType(rel), 'Cache-Control': 'no-store',
    // Films are model-written JavaScript. The CSP sandbox makes the browser treat every preview response as a
    // sandboxed, sessionless page even when opened directly in a tab, so film code can never act as the signed-in user.
    'Content-Security-Policy': 'sandbox allow-scripts', 'X-Content-Type-Options': 'nosniff',
  };
  if (url.searchParams.has('download')) headers['Content-Disposition'] = `attachment; filename="${url.searchParams.get('download') || 'file'}"`;
  if (rel === 'studio.html') body = body.toString().replace(/<head>/i, `<head>\n${BRIDGE}`);
  return new Response(typeof body === 'string' ? body : new Uint8Array(body), { headers });
}

export async function GET(req: Request, ctx: RouteContext<'/ws/[runId]/[...path]'>) {
  const { runId: token, path } = await ctx.params;
  const runId = verifyRunToken(token);   // the URL carries <runId>.<signature>; see signRun in auth.ts
  const rel = path.map(decodeURIComponent).join('/');
  if (!runId || !/^[a-z0-9]+$/i.test(runId) || rel.split('/').includes('..')) return new Response('not found', { status: 404 });
  const run = await getRun(runId);
  if (!run) return new Response('not found', { status: 404 });

  if (run.engineHash) {
    const v = run.version ? await version(run.id, run.version) : null;
    if (v?.deleted.includes(rel)) return new Response('not found', { status: 404 });
    if (v && rel in v.files) return respond(v.files[rel], rel, req);
    const fromRun = rel.startsWith('out/') ? await getBuffer(`runs/${run.id}/files/${rel}`) : null;
    if (fromRun) return respond(fromRun, rel, req);
    const fromEngine = await engineFile(run.engineHash, rel);
    if (fromEngine) return respond(fromEngine, rel, req);
  }
  return fromDisk(runId, rel, req);   // legacy runs, and anything the agent is still writing on this machine
}

// the workspace on this machine's disk, with byte ranges so <video> can seek a local MP4
async function fromDisk(runId: string, rel: string, req: Request) {
  const file = wsPath(runId, rel);
  let st;
  try { st = file ? statSync(file) : null; } catch { st = null; }
  if (!file || !st?.isFile()) return new Response('not found', { status: 404 });
  if (rel === 'studio.html' || st.size < 5e6 && !req.headers.get('range')) return respond(readFileSync(file), rel, req);
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Cache-Control': 'no-store', 'Content-Security-Policy': 'sandbox allow-scripts', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
  const range = req.headers.get('range')?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const a = range[1] ? +range[1] : 0, b = range[2] ? +range[2] : st.size - 1;
    return new Response(Readable.toWeb(createReadStream(file, { start: a, end: b })) as ReadableStream, { status: 206, headers: { ...headers, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Content-Length': String(b - a + 1) } });
  }
  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers: { ...headers, 'Content-Length': String(st.size) } });
}
