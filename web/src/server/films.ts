// A film's versions: each finished pass stores what differs from its engine snapshot (run_versions in Neon), so any
// machine can rebuild the film's workspace, and previews can be served without the worker's disk.
// Runs made before engine snapshots existed (engineHash null) keep the old on-disk snapshots in workspace.ts.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getRun, saveVersion, getVersion, listVersions, updateRun, addEvent } from './db';
import { filmChanges, downloadEngine } from './engine';
import { wsDir, snapshot, restore as restoreOnDisk, versions as versionsOnDisk } from './workspace';
import type { Run } from '@/lib/types';

// after a build or revision: store this version
export async function recordVersion(run: Run, version: number, note: string | null = null) {
  if (!run.engineHash) return snapshot(run.id, version);
  await saveVersion(run.id, version, await filmChanges(wsDir(run.id), run.engineHash), note);
}

// before a revision or render on any machine: the workspace, at the run's latest version
export async function ensureWorkspace(run: Run) {
  if (!run.engineHash) return;   // legacy runs live on this machine's disk
  const dir = wsDir(run.id);
  if (!existsSync(resolve(dir, 'studio.html'))) await downloadEngine(run.engineHash, dir);
  const v = run.version ? await getVersion(run.id, run.version) : null;
  if (!v) return;
  for (const [p, body] of Object.entries(v.files)) { const abs = resolve(dir, p); mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, body); }
  for (const p of v.deleted) rmSync(resolve(dir, p), { force: true });
}

// roll back to an earlier version, saved as a new version so nothing is lost
export async function restoreVersion(runId: string, version: number): Promise<number> {
  const run = await getRun(runId);
  if (!run) throw new Error('run not found');
  const next = run.version + 1;
  if (!run.engineHash) { restoreOnDisk(runId, version); snapshot(runId, next); }
  else {
    const v = await getVersion(runId, version);
    if (!v) throw new Error(`no version ${version}`);
    await saveVersion(runId, next, { files: v.files, deleted: v.deleted }, `restored v${version}`);
    await ensureWorkspace({ ...run, version: next });
  }
  await updateRun(runId, { version: next });
  await addEvent(runId, 'status', `Restored version ${version} as version ${next}`, { version: next });
  return next;
}

export async function filmVersions(run: Pick<Run, 'id' | 'engineHash'>): Promise<number[]> {
  return run.engineHash ? (await listVersions(run.id)).map(v => v.version) : versionsOnDisk(run.id);
}
