// A workspace is a private copy of the engine for one arena run: the agent edits it freely, the preview serves it, and
// renders happen inside it. It's copied fresh when the run starts, so each run is pinned to the engine of that moment.
import { cpSync, mkdirSync, symlinkSync, existsSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { ENGINE_ROOT, WORKSPACES } from './paths';

export const SCENE = 'film';
export const wsDir = (runId: string) => resolve(WORKSPACES, runId);

const COPY = ['studio.html', 'render.mjs', 'ANIMATION_GUIDE.md', 'package.json', 'src', 'docs', 'assets',
  'projects/README.md', 'projects/_template',                       // the guide's brief template and project layout
  'projects/demo/brief.md', 'projects/demo/project.js', 'projects/demo/scene.js',   // the footage example, to read (its media isn't copied)
  'scripts/whatships_craft.py', 'scripts/eval_scorecard.py',        // so the agent can score its film (guide, workflow 5)
  'refs/genres_ext/measured.md', 'refs/genres_ext/index.md'];      // the genres beyond launch films: measured pacing and structure, reference list
// refs keep the engine's own paths (refs/whatships/...), which the guide links to. The flat copies (refs/pacing.md, ...)
// are kept for runs whose instructions predate that.
const REFS = ['pacing.md', 'craft.md', 'genres.md', 'visual.md'];

export function createWorkspace(runId: string, files: Record<string, string>) {
  const dir = wsDir(runId);
  mkdirSync(dir, { recursive: true });
  for (const f of COPY) {
    const from = resolve(ENGINE_ROOT, f);
    if (existsSync(from)) cpSync(from, resolve(dir, f), { recursive: true, filter: s => !s.includes(`${sep}out${sep}`) });
  }
  mkdirSync(resolve(dir, 'refs/whatships'), { recursive: true });
  for (const f of REFS) {
    const from = resolve(ENGINE_ROOT, 'refs/whatships', f);
    if (existsSync(from)) { cpSync(from, resolve(dir, 'refs/whatships', f)); cpSync(from, resolve(dir, 'refs', f)); }
  }
  // the top tier's per-film measurements (no strips, stills or vision files), for scripts/eval_scorecard.py
  const craft = resolve(ENGINE_ROOT, 'refs/whatships/craft');
  if (existsSync(craft)) {
    mkdirSync(resolve(dir, 'refs/whatships/craft'), { recursive: true });
    for (const f of readdirSync(craft)) if (f.endsWith('.json')) cpSync(resolve(craft, f), resolve(dir, 'refs/whatships/craft', f));
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
