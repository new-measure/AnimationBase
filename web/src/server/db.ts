// SQLite through node:sqlite, shared by the Next.js server and the worker (WAL mode, so both can use it at once).
// Jobs are rows in `jobs`: the API inserts them, the worker claims and runs them.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { DATA_DIR, DB_PATH } from './paths';
import type { Project, Run, RunEvent, Render, Brief, Storyboard, SimilarFilm, ProjectStatus, RunStatus } from '@/lib/types';

const g = globalThis as unknown as { __db?: DatabaseSync };

export function db(): DatabaseSync {
  if (g.__db) return g.__db;
  mkdirSync(DATA_DIR, { recursive: true });
  const d = new DatabaseSync(DB_PATH);
  d.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, prompt TEXT NOT NULL, status TEXT NOT NULL, brief TEXT, storyboard TEXT, similar TEXT,
      winner_run_id TEXT, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, slot TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL,
      session_id TEXT, version INTEGER NOT NULL DEFAULT 0, error TEXT, cost_usd REAL NOT NULL DEFAULT 0,
      started_at INTEGER, finished_at INTEGER);
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, data TEXT,
      at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS events_run ON events (run_id, id);
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, run_id TEXT NOT NULL, payload TEXT, status TEXT NOT NULL,
      created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS renders (
      id TEXT PRIMARY KEY, run_id TEXT NOT NULL, status TEXT NOT NULL, progress REAL NOT NULL DEFAULT 0, eta TEXT,
      file TEXT, error TEXT, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL UNIQUE, run_a TEXT NOT NULL, run_b TEXT NOT NULL,
      model_a TEXT NOT NULL, model_b TEXT NOT NULL, choice TEXT NOT NULL, created_at INTEGER NOT NULL);
  `);
  g.__db = d;
  return d;
}

type Row = Record<string, unknown>;
const j = <T>(s: unknown, fallback: T): T => (typeof s === 'string' && s ? JSON.parse(s) : fallback);
export const newId = () => randomUUID().replace(/-/g, '').slice(0, 12);

// ---------- projects ----------
const toProject = (r: Row): Project => ({
  id: r.id as string, prompt: r.prompt as string, status: r.status as ProjectStatus,
  brief: j<Brief | null>(r.brief, null), storyboard: j<Storyboard | null>(r.storyboard, null),
  similar: j<SimilarFilm[]>(r.similar, []), winnerRunId: (r.winner_run_id as string) || null, createdAt: r.created_at as number,
});

export function createProject(prompt: string, brief: Brief, similar: SimilarFilm[]): Project {
  const id = newId();
  db().prepare('INSERT INTO projects (id, prompt, status, brief, similar, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, prompt, 'brief', JSON.stringify(brief), JSON.stringify(similar), Date.now());
  return getProject(id)!;
}
export function getProject(id: string): Project | null {
  const r = db().prepare('SELECT * FROM projects WHERE id = ?').get(id) as Row | undefined;
  return r ? toProject(r) : null;
}
export function listProjects(limit = 30): Project[] {
  return (db().prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT ?').all(limit) as Row[]).map(toProject);
}
export function updateProject(id: string, p: Partial<Pick<Project, 'status' | 'brief' | 'storyboard' | 'similar' | 'winnerRunId'>>) {
  const cols: Record<string, unknown> = {};
  if (p.status) cols.status = p.status;
  if (p.brief !== undefined) cols.brief = JSON.stringify(p.brief);
  if (p.storyboard !== undefined) cols.storyboard = JSON.stringify(p.storyboard);
  if (p.similar !== undefined) cols.similar = JSON.stringify(p.similar);
  if (p.winnerRunId !== undefined) cols.winner_run_id = p.winnerRunId;
  const keys = Object.keys(cols);
  if (!keys.length) return;
  db().prepare(`UPDATE projects SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`).run(...(Object.values(cols) as never[]), id);
}

// ---------- runs ----------
const toRun = (r: Row): Run => ({
  id: r.id as string, projectId: r.project_id as string, slot: r.slot as 'A' | 'B', model: r.model as string,
  status: r.status as RunStatus, sessionId: (r.session_id as string) || null, version: r.version as number,
  busy: !!db().prepare("SELECT 1 FROM jobs WHERE run_id = ? AND kind IN ('build', 'revise') AND status IN ('queued', 'running')").get(r.id as string),
  error: (r.error as string) || null, costUsd: r.cost_usd as number,
  startedAt: (r.started_at as number) || null, finishedAt: (r.finished_at as number) || null,
});
export function createRun(projectId: string, slot: 'A' | 'B', model: string): Run {
  const id = newId();
  db().prepare('INSERT INTO runs (id, project_id, slot, model, status) VALUES (?, ?, ?, ?, ?)').run(id, projectId, slot, model, 'queued');
  return getRun(id)!;
}
export function getRun(id: string): Run | null {
  const r = db().prepare('SELECT * FROM runs WHERE id = ?').get(id) as Row | undefined;
  return r ? toRun(r) : null;
}
export function projectRuns(projectId: string): Run[] {
  return (db().prepare('SELECT * FROM runs WHERE project_id = ? ORDER BY slot').all(projectId) as Row[]).map(toRun);
}
export function updateRun(id: string, p: Partial<{ status: RunStatus; sessionId: string; version: number; error: string | null; costUsd: number; startedAt: number; finishedAt: number }>) {
  const map: Record<string, string> = { status: 'status', sessionId: 'session_id', version: 'version', error: 'error', costUsd: 'cost_usd', startedAt: 'started_at', finishedAt: 'finished_at' };
  const keys = Object.keys(p) as (keyof typeof p)[];
  if (!keys.length) return;
  db().prepare(`UPDATE runs SET ${keys.map(k => `${map[k]} = ?`).join(', ')} WHERE id = ?`).run(...(keys.map(k => p[k]) as never[]), id);
}

// ---------- events ----------
export function addEvent(runId: string, kind: RunEvent['kind'], text: string, data: Record<string, unknown> | null = null) {
  db().prepare('INSERT INTO events (run_id, kind, text, data, at) VALUES (?, ?, ?, ?, ?)').run(runId, kind, text, data ? JSON.stringify(data) : null, Date.now());
}
export function runEvents(runId: string, after = 0, limit = 400): RunEvent[] {
  return (db().prepare('SELECT * FROM events WHERE run_id = ? AND id > ? ORDER BY id LIMIT ?').all(runId, after, limit) as Row[]).map(r => ({
    id: r.id as number, runId: r.run_id as string, kind: r.kind as RunEvent['kind'], text: r.text as string,
    data: j<Record<string, unknown> | null>(r.data, null), at: r.at as number,
  }));
}

// ---------- jobs ----------
export type JobKind = 'build' | 'revise' | 'render';
export interface Job { id: number; kind: JobKind; runId: string; payload: Record<string, unknown>; status: string }
export function enqueue(kind: JobKind, runId: string, payload: Record<string, unknown> = {}) {
  db().prepare('INSERT INTO jobs (kind, run_id, payload, status, created_at) VALUES (?, ?, ?, ?, ?)').run(kind, runId, JSON.stringify(payload), 'queued', Date.now());
}
// atomically claim the oldest queued job of one of these kinds
export function claimJob(kinds: JobKind[]): Job | null {
  const d = db();
  const r = d.prepare(`SELECT * FROM jobs WHERE status = 'queued' AND kind IN (${kinds.map(() => '?').join(',')}) ORDER BY id LIMIT 1`).get(...kinds) as Row | undefined;
  if (!r) return null;
  const res = d.prepare("UPDATE jobs SET status = 'running' WHERE id = ? AND status = 'queued'").run(r.id as number);
  if (!res.changes) return null;
  return { id: r.id as number, kind: r.kind as JobKind, runId: r.run_id as string, payload: j(r.payload, {}), status: 'running' };
}
export function finishJob(id: number, status: 'done' | 'failed' | 'cancelled') {
  db().prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, id);
}
export function requestCancel(runId: string) {
  db().prepare("UPDATE jobs SET status = 'cancelled' WHERE run_id = ? AND status = 'queued'").run(runId);
  db().prepare("UPDATE jobs SET status = 'cancel' WHERE run_id = ? AND status = 'running'").run(runId);
}
export function jobCancelled(id: number): boolean {
  const r = db().prepare('SELECT status FROM jobs WHERE id = ?').get(id) as Row | undefined;
  return r?.status === 'cancel';
}
// a worker that died mid-job leaves rows 'running'; on start, the worker marks them failed
export function failStaleJobs() {
  const d = db();
  const stale = d.prepare("SELECT run_id, kind FROM jobs WHERE status IN ('running', 'cancel')").all() as Row[];
  d.prepare("UPDATE jobs SET status = 'failed' WHERE status IN ('running', 'cancel')").run();
  for (const s of stale) {
    if (s.kind === 'render') d.prepare("UPDATE renders SET status = 'failed', error = 'worker restarted' WHERE run_id = ? AND status IN ('queued', 'running')").run(s.run_id as string);
    else d.prepare("UPDATE runs SET status = 'failed', error = 'worker restarted' WHERE id = ? AND status IN ('queued', 'running')").run(s.run_id as string);
  }
}

// ---------- renders ----------
const toRender = (r: Row): Render => ({
  id: r.id as string, runId: r.run_id as string, status: r.status as RunStatus, progress: r.progress as number,
  eta: (r.eta as string) || null, file: (r.file as string) || null, error: (r.error as string) || null, createdAt: r.created_at as number,
});
export function createRender(runId: string): Render {
  const id = newId();
  db().prepare('INSERT INTO renders (id, run_id, status, created_at) VALUES (?, ?, ?, ?)').run(id, runId, 'queued', Date.now());
  return toRender(db().prepare('SELECT * FROM renders WHERE id = ?').get(id) as Row);
}
export function latestRender(runId: string): Render | null {
  const r = db().prepare('SELECT * FROM renders WHERE run_id = ? ORDER BY created_at DESC LIMIT 1').get(runId) as Row | undefined;
  return r ? toRender(r) : null;
}
export function updateRender(id: string, p: Partial<{ status: RunStatus; progress: number; eta: string | null; file: string; error: string }>) {
  const keys = Object.keys(p) as (keyof typeof p)[];
  if (!keys.length) return;
  db().prepare(`UPDATE renders SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`).run(...(keys.map(k => p[k]) as never[]), id);
}

// ---------- votes ----------
export function recordVote(projectId: string, runA: Run, runB: Run, choice: string) {
  db().prepare('INSERT OR REPLACE INTO votes (project_id, run_a, run_b, model_a, model_b, choice, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(projectId, runA.id, runB.id, runA.model, runB.model, choice, Date.now());
}
export function getVote(projectId: string): { choice: string } | null {
  return (db().prepare('SELECT choice FROM votes WHERE project_id = ?').get(projectId) as { choice: string } | undefined) || null;
}
export function allVotes(): { model_a: string; model_b: string; choice: string }[] {
  return db().prepare('SELECT model_a, model_b, choice FROM votes').all() as { model_a: string; model_b: string; choice: string }[];
}
