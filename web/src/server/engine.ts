// Engine snapshots in S3, so previews and workspaces don't depend on one machine's disk.
//
// When a run starts, its freshly copied engine is published once per distinct content (content-addressed by hash):
//   engines/<hash>/engine.tgz        the whole engine as the run sees it, to rebuild a workspace anywhere
//   engines/<hash>/manifest.json     { path: sha256 } of every file, to tell a film's own changes from the engine
//   engines/<hash>/files/<path>      the files a preview loads (studio.html, src/, assets/, p5 and p5.brush)
// Each version of a film (run_versions in Neon) then stores only the files that differ from its engine.
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readdirSync, readFileSync, lstatSync, rmSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { putBuffer, getBuffer, exists } from './storage';
import { ENGINE_ROOT } from './paths';

const run = promisify(execFile);
const TAR_ENV = { ...process.env, COPYFILE_DISABLE: '1' };   // no macOS AppleDouble (._name) files in archives
// not part of the engine: the run's own inputs and outputs
const SKIP = new Set(['BRIEF.md', 'STORYBOARD.md', 'node_modules', 'out', 'versions']);
const PREVIEW_DIRS = ['src/', 'assets/'], PREVIEW_FILES = ['studio.html', 'node_modules/p5/lib/p5.min.js', 'node_modules/p5.brush/dist/p5.brush.js'];

function walk(dir: string, base = dir, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const abs = resolve(dir, name), rel = relative(base, abs).split(sep).join('/');
    if (dir === base && SKIP.has(name)) continue;
    if (name.startsWith('._') || name === '.DS_Store') continue;   // macOS metadata, not engine files
    const st = lstatSync(abs);
    if (st.isDirectory()) walk(abs, base, out); else if (st.isFile()) out.push(rel);
  }
  return out;
}
const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

export type Manifest = Record<string, string>;
export function manifestOf(dir: string): Manifest {
  return Object.fromEntries(walk(dir).sort().map(p => [p, sha(readFileSync(resolve(dir, p)))]));
}
const hashOf = (m: Manifest) => sha(Object.entries(m).map(([p, h]) => `${p}\0${h}`).join('\n')).slice(0, 24);

// Publish the engine copy in a fresh workspace (before the agent touches it). Returns its hash.
export async function publishEngine(wsDir: string): Promise<string> {
  const manifest = manifestOf(wsDir), hash = hashOf(manifest), prefix = `engines/${hash}`;
  if (await exists(`${prefix}/manifest.json`)) return hash;
  const tar = resolve(tmpdir(), `engine-${hash}-${randomUUID().slice(0, 6)}.tgz`);
  await run('tar', ['-czf', tar, '-C', wsDir, ...Object.keys(manifest)], { env: TAR_ENV });
  await putBuffer(`${prefix}/engine.tgz`, readFileSync(tar), 'application/gzip');
  rmSync(tar, { force: true });
  const preview = [...Object.keys(manifest).filter(p => PREVIEW_DIRS.some(d => p.startsWith(d)) || p === 'studio.html'), ...PREVIEW_FILES.filter(p => p.startsWith('node_modules/'))];
  for (let i = 0; i < preview.length; i += 16) {
    await Promise.all(preview.slice(i, i + 16).map(p => {
      const abs = resolve(wsDir, p);
      return existsSync(abs) ? putBuffer(`${prefix}/files/${p}`, readFileSync(abs), contentType(p), 'public, max-age=31536000, immutable') : null;
    }));
  }
  await putBuffer(`${prefix}/manifest.json`, Buffer.from(JSON.stringify(manifest)), 'application/json');   // written last: marks it complete
  return hash;
}

const manifests = new Map<string, Manifest>();
export async function engineManifest(hash: string): Promise<Manifest> {
  if (!manifests.has(hash)) {
    const b = await getBuffer(`engines/${hash}/manifest.json`);
    if (!b) throw new Error(`engine ${hash} is not in storage`);
    manifests.set(hash, JSON.parse(b.toString('utf8')));
  }
  return manifests.get(hash)!;
}

// Rebuild a workspace from an engine snapshot (on a machine that doesn't have it yet).
export async function downloadEngine(hash: string, dir: string) {
  const b = await getBuffer(`engines/${hash}/engine.tgz`);
  if (!b) throw new Error(`engine ${hash} is not in storage`);
  mkdirSync(dir, { recursive: true });
  const tar = resolve(tmpdir(), `engine-${hash}-${randomUUID().slice(0, 6)}.tgz`);
  writeFileSync(tar, b);
  await run('tar', ['-xzf', tar, '-C', dir]);
  rmSync(tar, { force: true });
  if (!existsSync(resolve(dir, 'node_modules'))) symlinkSync(resolve(ENGINE_ROOT, 'node_modules'), resolve(dir, 'node_modules'), 'dir');
  mkdirSync(resolve(dir, 'out/check'), { recursive: true });
}

// A film's own files: what differs from its engine under src/ (the scene, the scene list, anything it added or
// changed), and what it deleted there.
export async function filmChanges(wsDir: string, hash: string): Promise<{ files: Record<string, string>; deleted: string[] }> {
  const engine = await engineManifest(hash), now = manifestOf(wsDir), files: Record<string, string> = {};
  for (const [p, h] of Object.entries(now)) {
    if (!p.startsWith('src/') || engine[p] === h) continue;
    const text = readFileSync(resolve(wsDir, p), 'utf8');
    if (!text.includes('\u0000')) files[p] = text;   // films are text; skip anything binary
  }
  const deleted = Object.keys(engine).filter(p => p.startsWith('src/') && !(p in now));
  return { files, deleted };
}

const TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8',
  json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  mp4: 'video/mp4', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', md: 'text/plain; charset=utf-8',
};
export const contentType = (p: string) => TYPES[p.split('.').pop()!.toLowerCase()] || 'application/octet-stream';
