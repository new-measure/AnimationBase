// The data layer, on Neon Postgres through Drizzle (HTTP driver, so it works from serverless routes and the worker
// alike). Jobs are rows in `jobs`: the API inserts them, the worker claims them with FOR UPDATE SKIP LOCKED.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, asc, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import * as t from './schema';
import type { Project, Run, RunEvent, Render, ProjectStatus, RunStatus } from '@/lib/types';

const g = globalThis as unknown as { __db?: ReturnType<typeof drizzle<typeof t>> };
export function db() {
  if (g.__db) return g.__db;
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set: run through `npm run dev` (Infisical project animate)');
  return (g.__db = drizzle(neon(process.env.DATABASE_URL), { schema: t }));
}
export const newId = () => randomUUID().replace(/-/g, '').slice(0, 12);

// ---------- projects ----------
type ProjectRow = typeof t.projects.$inferSelect;
const toProject = (r: ProjectRow): Project => ({
  id: r.id, userId: r.userId, prompt: r.prompt, status: r.status as ProjectStatus, brief: r.brief ?? null,
  storyboard: r.storyboard ?? null, similar: r.similar ?? [], winnerRunId: r.winnerRunId, createdAt: r.createdAt,
});

export async function createProject(p: Pick<Project, 'prompt' | 'brief' | 'similar'> & { userId?: string | null }): Promise<Project> {
  const [r] = await db().insert(t.projects).values({
    id: newId(), userId: p.userId ?? null, prompt: p.prompt, status: 'brief', brief: p.brief, similar: p.similar, createdAt: Date.now(),
  }).returning();
  return toProject(r);
}
export async function getProject(id: string): Promise<Project | null> {
  const [r] = await db().select().from(t.projects).where(eq(t.projects.id, id));
  return r ? toProject(r) : null;
}
export async function listProjects(opts: { userId?: string | null; limit?: number } = {}): Promise<Project[]> {
  const q = db().select().from(t.projects);
  const rows = await (opts.userId ? q.where(eq(t.projects.userId, opts.userId)) : q).orderBy(desc(t.projects.createdAt)).limit(opts.limit ?? 30);
  return rows.map(toProject);
}
export async function updateProject(id: string, p: Partial<Pick<Project, 'status' | 'brief' | 'storyboard' | 'similar' | 'winnerRunId'>>) {
  if (Object.keys(p).length) await db().update(t.projects).set(p).where(eq(t.projects.id, id));
}

// ---------- runs ----------
type RunRow = typeof t.runs.$inferSelect;
async function busyRuns(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const rows = await db().select({ runId: t.jobs.runId }).from(t.jobs).where(and(
    inArray(t.jobs.runId, ids), inArray(t.jobs.kind, ['build', 'revise']), inArray(t.jobs.status, ['queued', 'running', 'cancel'])));
  return new Set(rows.map(r => r.runId));
}
const toRun = (r: RunRow, busy: Set<string>): Run => ({
  id: r.id, projectId: r.projectId, slot: r.slot as 'A' | 'B', model: r.model, thinking: r.thinking, status: r.status as RunStatus,
  sessionId: r.sessionId, version: r.version, busy: busy.has(r.id), error: r.error, costUsd: r.costUsd,
  startedAt: r.startedAt, finishedAt: r.finishedAt, engineHash: r.engineHash,
});
export async function createRun(projectId: string, slot: 'A' | 'B', model: string, thinking: string): Promise<Run> {
  const [r] = await db().insert(t.runs).values({ id: newId(), projectId, slot, model, thinking, status: 'queued' }).returning();
  return toRun(r, new Set());
}
export async function getRun(id: string): Promise<Run | null> {
  const [r] = await db().select().from(t.runs).where(eq(t.runs.id, id));
  return r ? toRun(r, await busyRuns([id])) : null;
}
export async function projectRuns(projectId: string): Promise<Run[]> {
  const rows = await db().select().from(t.runs).where(eq(t.runs.projectId, projectId)).orderBy(asc(t.runs.slot));
  const busy = await busyRuns(rows.map(r => r.id));
  return rows.map(r => toRun(r, busy));
}
export async function updateRun(id: string, p: Partial<Pick<RunRow, 'status' | 'sessionId' | 'version' | 'error' | 'costUsd' | 'startedAt' | 'finishedAt' | 'engineHash'>>) {
  if (Object.keys(p).length) await db().update(t.runs).set(p).where(eq(t.runs.id, id));
}

// ---------- versions ----------
export type VersionRow = typeof t.runVersions.$inferSelect;
export async function saveVersion(runId: string, version: number, v: { files: Record<string, string>; deleted: string[] }, note: string | null = null) {
  await db().insert(t.runVersions).values({ runId, version, files: v.files, deleted: v.deleted, note, createdAt: Date.now() })
    .onConflictDoUpdate({ target: [t.runVersions.runId, t.runVersions.version], set: { files: v.files, deleted: v.deleted, note } });
}
export async function getVersion(runId: string, version: number): Promise<VersionRow | null> {
  const [r] = await db().select().from(t.runVersions).where(and(eq(t.runVersions.runId, runId), eq(t.runVersions.version, version)));
  return r ?? null;
}
export async function listVersions(runId: string): Promise<{ version: number; note: string | null; createdAt: number }[]> {
  return db().select({ version: t.runVersions.version, note: t.runVersions.note, createdAt: t.runVersions.createdAt }).from(t.runVersions)
    .where(eq(t.runVersions.runId, runId)).orderBy(asc(t.runVersions.version));
}

// ---------- events ----------
export async function addEvent(runId: string, kind: RunEvent['kind'], text: string, data: Record<string, unknown> | null = null) {
  await db().insert(t.events).values({ runId, kind, text, data, at: Date.now() });
}
export async function runEvents(runId: string, after = 0, limit = 400): Promise<RunEvent[]> {
  const rows = await db().select().from(t.events).where(and(eq(t.events.runId, runId), gt(t.events.id, after))).orderBy(asc(t.events.id)).limit(limit);
  return rows.map(r => ({ id: r.id, runId: r.runId, kind: r.kind as RunEvent['kind'], text: r.text, data: r.data ?? null, at: r.at }));
}

// ---------- jobs ----------
export type JobKind = 'build' | 'revise' | 'render';
export interface Job { id: number; kind: JobKind; runId: string; payload: Record<string, unknown>; status: string }
export async function enqueue(kind: JobKind, runId: string, payload: Record<string, unknown> = {}) {
  const [j] = await db().insert(t.jobs).values({ kind, runId, payload, status: 'queued', createdAt: Date.now() }).returning({ id: t.jobs.id });
  // in production each job runs in its own Modal container, started right away (the sweeper is the fallback)
  if (process.env.WORKER_MODE === 'modal') await import('./dispatch').then(d => d.dispatch(j.id)).catch(e => console.error('dispatch failed; the sweeper will retry', e));
  return j.id;
}
// claim one specific job (production: the container started for it). 'held' jobs are only ever claimed this way,
// which keeps them away from polling workers (handy for tests and debugging).
export async function claimJobById(id: number): Promise<Job | null> {
  const [r] = await db().update(t.jobs).set({ status: 'running', heartbeatAt: Date.now() }).where(and(eq(t.jobs.id, id), inArray(t.jobs.status, ['queued', 'held']))).returning();
  return r ? { id: r.id, kind: r.kind as JobKind, runId: r.runId, payload: r.payload ?? {}, status: r.status } : null;
}
export async function heartbeat(id: number) {
  await db().update(t.jobs).set({ heartbeatAt: Date.now() }).where(eq(t.jobs.id, id));
}
export async function queuedJobIds(olderThanMs: number): Promise<number[]> {
  const rows = await db().select({ id: t.jobs.id }).from(t.jobs).where(and(eq(t.jobs.status, 'queued'), sql`${t.jobs.createdAt} < ${Date.now() - olderThanMs}`));
  return rows.map(r => r.id);
}
// running jobs whose container stopped sending heartbeats: mark them and their run or render failed
export async function failSilentJobs(silentMs: number) {
  const cutoff = Date.now() - silentMs;
  const dead = await db().update(t.jobs).set({ status: 'failed' })
    .where(and(inArray(t.jobs.status, ['running', 'cancel']), sql`coalesce(${t.jobs.heartbeatAt}, ${t.jobs.createdAt}) < ${cutoff}`))
    .returning({ runId: t.jobs.runId, kind: t.jobs.kind });
  for (const s of dead) {
    if (s.kind === 'render') await db().update(t.renders).set({ status: 'failed', error: 'the render machine stopped' }).where(and(eq(t.renders.runId, s.runId), inArray(t.renders.status, ['queued', 'running'])));
    else await db().update(t.runs).set({ status: 'failed', error: 'the build machine stopped' }).where(and(eq(t.runs.id, s.runId), inArray(t.runs.status, ['queued', 'running'])));
  }
  return dead.length;
}
// atomically claim the oldest queued job of one of these kinds (safe with several workers)
export async function claimJob(kinds: JobKind[]): Promise<Job | null> {
  const res = await db().execute(sql`
    UPDATE jobs SET status = 'running', heartbeat_at = ${Date.now()} WHERE id = (
      SELECT id FROM jobs WHERE status = 'queued' AND kind IN (${sql.join(kinds.map(k => sql`${k}`), sql`, `)})
      ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
    RETURNING id, kind, run_id, payload, status`);
  const r = res.rows[0] as { id: number | string; kind: JobKind; run_id: string; payload: Record<string, unknown>; status: string } | undefined;
  return r ? { id: Number(r.id), kind: r.kind, runId: r.run_id, payload: r.payload ?? {}, status: r.status } : null;
}
export async function finishJob(id: number, status: 'done' | 'failed' | 'cancelled') {
  await db().update(t.jobs).set({ status }).where(eq(t.jobs.id, id));
}
export async function requestCancel(runId: string) {
  await db().update(t.jobs).set({ status: 'cancelled' }).where(and(eq(t.jobs.runId, runId), eq(t.jobs.status, 'queued')));
  await db().update(t.jobs).set({ status: 'cancel' }).where(and(eq(t.jobs.runId, runId), eq(t.jobs.status, 'running')));
}
export async function jobCancelled(id: number): Promise<boolean> {
  const [r] = await db().select({ status: t.jobs.status }).from(t.jobs).where(eq(t.jobs.id, id));
  return r?.status === 'cancel';
}
// a worker that died mid-job leaves rows 'running'; on start, the worker marks them failed
export async function failStaleJobs() {
  const stale = await db().update(t.jobs).set({ status: 'failed' }).where(inArray(t.jobs.status, ['running', 'cancel'])).returning({ runId: t.jobs.runId, kind: t.jobs.kind });
  for (const s of stale) {
    if (s.kind === 'render') await db().update(t.renders).set({ status: 'failed', error: 'worker restarted' }).where(and(eq(t.renders.runId, s.runId), inArray(t.renders.status, ['queued', 'running'])));
    else await db().update(t.runs).set({ status: 'failed', error: 'worker restarted' }).where(and(eq(t.runs.id, s.runId), inArray(t.runs.status, ['queued', 'running'])));
  }
}

// ---------- renders ----------
type RenderRow = typeof t.renders.$inferSelect;
const toRender = (r: RenderRow): Render => ({ ...r, status: r.status as RunStatus });
export async function createRender(runId: string): Promise<Render> {
  const [r] = await db().insert(t.renders).values({ id: newId(), runId, status: 'queued', createdAt: Date.now() }).returning();
  return toRender(r);
}
export async function latestRender(runId: string): Promise<Render | null> {
  const [r] = await db().select().from(t.renders).where(eq(t.renders.runId, runId)).orderBy(desc(t.renders.createdAt)).limit(1);
  return r ? toRender(r) : null;
}
export async function updateRender(id: string, p: Partial<Pick<RenderRow, 'status' | 'progress' | 'eta' | 'file' | 'error'>>) {
  if (Object.keys(p).length) await db().update(t.renders).set(p).where(eq(t.renders.id, id));
}

// ---------- votes ----------
export async function recordVote(projectId: string, runA: Run, runB: Run, choice: string, userId: string | null = null) {
  await db().insert(t.votes).values({ projectId, userId, runA: runA.id, runB: runB.id, modelA: runA.model, modelB: runB.model, choice, createdAt: Date.now() })
    .onConflictDoNothing({ target: t.votes.projectId });
}
export async function getVote(projectId: string): Promise<{ choice: string } | null> {
  const [r] = await db().select({ choice: t.votes.choice }).from(t.votes).where(eq(t.votes.projectId, projectId));
  return r ?? null;
}
export async function allVotes() {
  return db().select({ model_a: t.votes.modelA, model_b: t.votes.modelB, choice: t.votes.choice }).from(t.votes);
}
