// A workspace is a private copy of the engine for one arena run: the agent edits it freely, the preview serves it, and
// renders happen inside it. It's copied fresh when the run starts, so each run is pinned to the engine of that moment.
import { cpSync, mkdirSync, symlinkSync, existsSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { ENGINE_ROOT, WORKSPACES } from './paths';

export const SCENE = 'film';
export const wsDir = (runId: string) => resolve(WORKSPACES, runId);

const COPY = ['studio.html', 'render.mjs', 'ANIMATION_GUIDE.md', 'package.json', 'src', 'docs', 'assets'];
const REFS = ['pacing.md', 'craft.md', 'genres.md'];

export function createWorkspace(runId: string, files: Record<string, string>) {
  const dir = wsDir(runId);
  mkdirSync(dir, { recursive: true });
  for (const f of COPY) {
    const from = resolve(ENGINE_ROOT, f);
    if (existsSync(from)) cpSync(from, resolve(dir, f), { recursive: true, filter: s => !s.includes(`${sep}out${sep}`) });
  }
  mkdirSync(resolve(dir, 'refs'), { recursive: true });
  for (const f of REFS) {
    const from = resolve(ENGINE_ROOT, 'refs/whatships', f);
    if (existsSync(from)) cpSync(from, resolve(dir, 'refs', f));
  }
  if (!existsSync(resolve(dir, 'node_modules'))) symlinkSync(resolve(ENGINE_ROOT, 'node_modules'), resolve(dir, 'node_modules'), 'dir');
  mkdirSync(resolve(dir, 'out/check'), { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(resolve(dir, name), body);
  return dir;
}

// Resolve a path inside a workspace, refusing anything that escapes it (node_modules is a symlink to the engine's,
// which is allowed because it's resolved lexically here).
export function wsPath(runId: string, rel: string): string | null {
  const dir = wsDir(runId), p = resolve(dir, rel);
  const r = relative(dir, p);
  if (r.startsWith('..') || r.includes(`..${sep}`)) return null;
  return p;
}

// ---------- versions: a snapshot of the scene files after every finished build or revision ----------
const SNAP = ['src/scenes', 'src/config.js'];
export function snapshot(runId: string, version: number) {
  const dir = wsDir(runId), to = resolve(dir, 'versions', `v${version}`);
  rmSync(to, { recursive: true, force: true });
  for (const f of SNAP) if (existsSync(resolve(dir, f))) cpSync(resolve(dir, f), resolve(to, f), { recursive: true });
}
export function restore(runId: string, version: number) {
  const dir = wsDir(runId), from = resolve(dir, 'versions', `v${version}`);
  if (!existsSync(from)) throw new Error(`no version ${version}`);
  for (const f of SNAP) if (existsSync(resolve(from, f))) { rmSync(resolve(dir, f), { recursive: true, force: true }); cpSync(resolve(from, f), resolve(dir, f), { recursive: true }); }
}
export function versions(runId: string): number[] {
  const d = resolve(wsDir(runId), 'versions');
  return existsSync(d) ? readdirSync(d).map(v => +v.slice(1)).filter(Boolean).sort((a, b) => a - b) : [];
}
