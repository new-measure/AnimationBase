// Data for the admin page: recent runs with their owner, model and cost, and per-model totals.
import { desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import * as t from './schema';

export async function recentRuns(limit = 50) {
  return db().select({
    id: t.runs.id, projectId: t.runs.projectId, slot: t.runs.slot, model: t.runs.model, status: t.runs.status,
    version: t.runs.version, costUsd: t.runs.costUsd, startedAt: t.runs.startedAt, finishedAt: t.runs.finishedAt, error: t.runs.error,
    prompt: t.projects.prompt, email: t.users.email,
  }).from(t.runs)
    .leftJoin(t.projects, eq(t.projects.id, t.runs.projectId))
    .leftJoin(t.users, eq(t.users.id, t.projects.userId))
    .orderBy(desc(sql`coalesce(${t.runs.startedAt}, 0)`)).limit(limit);
}

export async function modelTotals() {
  return db().select({
    model: t.runs.model,
    runs: sql<number>`count(*)::int`,
    done: sql<number>`count(*) filter (where ${t.runs.status} = 'done')::int`,
    failed: sql<number>`count(*) filter (where ${t.runs.status} = 'failed')::int`,
    costUsd: sql<number>`coalesce(sum(${t.runs.costUsd}), 0)::float`,
    avgMinutes: sql<number>`coalesce(avg((${t.runs.finishedAt} - ${t.runs.startedAt}) / 60000.0) filter (where ${t.runs.finishedAt} is not null), 0)::float`,
  }).from(t.runs).groupBy(t.runs.model);
}

export async function userCount() {
  const [r] = await db().select({ n: sql<number>`count(*)::int` }).from(t.users);
  return r?.n ?? 0;
}
