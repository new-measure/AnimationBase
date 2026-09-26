// Serves a run's workspace: the preview (studio.html plus a small bridge so the app can drive it), contact sheets the
// agent made, and exported MP4s. The preview runs in a sandboxed iframe without same-origin rights, so the agent's code
// can't reach the app; the bridge talks to the parent with postMessage.
import { readFileSync, statSync, createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { wsPath } from '@/server/workspace';

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

export async function GET(req: Request, ctx: RouteContext<'/ws/[runId]/[...path]'>) {
  const { runId, path } = await ctx.params;
  const rel = path.map(decodeURIComponent).join('/');
  const file = /^[a-z0-9]+$/i.test(runId) ? wsPath(runId, rel) : null;
  let st;
  try { st = file ? statSync(file) : null; } catch { st = null; }
  if (!file || !st?.isFile()) return new Response('not found', { status: 404 });
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  const headers: Record<string, string> = { 'Content-Type': type, 'Cache-Control': 'no-store' };
  const url = new URL(req.url);
  if (url.searchParams.has('download')) headers['Content-Disposition'] = `attachment; filename="${url.searchParams.get('download') || 'film.mp4'}"`;

  if (rel === 'studio.html') {
    const html = readFileSync(file, 'utf8').replace(/<head>/i, `<head>\n${BRIDGE}`);
    return new Response(html, { headers });
  }
  // byte ranges, so <video> can seek an exported MP4
  const range = req.headers.get('range')?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const startB = range[1] ? +range[1] : 0, endB = range[2] ? +range[2] : st.size - 1;
    const stream = Readable.toWeb(createReadStream(file, { start: startB, end: endB })) as ReadableStream;
    return new Response(stream, { status: 206, headers: { ...headers, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${startB}-${endB}/${st.size}`, 'Content-Length': String(endB - startB + 1) } });
  }
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, 'Accept-Ranges': 'bytes', 'Content-Length': String(st.size) } });
}
