// The Postgres schema (Neon), managed with drizzle-kit (`npm run db:push`). Times are epoch milliseconds, as in the
// rest of the app.
import { pgTable, text, integer, bigint, bigserial, serial, boolean, doublePrecision, real, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import type { Brief, Storyboard, SimilarFilm } from '@/lib/types';

const ms = (name: string) => bigint(name, { mode: 'number' });

export const users = pgTable('users', {
  id: text('id').primaryKey(),                        // WorkOS user id
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').notNull().default('user'),       // 'user' | 'admin'
  createdAt: ms('created_at').notNull(),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id'),                            // owner; null for projects made before login existed
  prompt: text('prompt').notNull(),
  status: text('status').notNull(),
  brief: jsonb('brief').$type<Brief>(),
  storyboard: jsonb('storyboard').$type<Storyboard>(),
  similar: jsonb('similar').$type<SimilarFilm[]>().notNull().default([]),
  winnerRunId: text('winner_run_id'),
  createdAt: ms('created_at').notNull(),
}, t => [index('projects_user').on(t.userId, t.createdAt)]);

export const runs = pgTable('runs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  slot: text('slot').notNull(),                       // 'A' | 'B'
  model: text('model').notNull(),                     // models.id
  thinking: text('thinking').notNull().default('high'),
  status: text('status').notNull(),
  sessionId: text('session_id'),
  version: integer('version').notNull().default(0),
  error: text('error'),
  costUsd: doublePrecision('cost_usd').notNull().default(0),
  startedAt: ms('started_at'),
  finishedAt: ms('finished_at'),
  engineHash: text('engine_hash'),                   // the engine snapshot in S3 this run was built on (engine.ts)
}, t => [index('runs_project').on(t.projectId)]);

// Each finished pass (build, revision, restore) of a film: only the files that differ from its engine snapshot.
export const runVersions = pgTable('run_versions', {
  runId: text('run_id').notNull(),
  version: integer('version').notNull(),
  files: jsonb('files').$type<Record<string, string>>().notNull(),
  deleted: jsonb('deleted').$type<string[]>().notNull().default([]),
  note: text('note'),
  createdAt: ms('created_at').notNull(),
}, t => [uniqueIndex('run_versions_pk').on(t.runId, t.version)]);

export const events = pgTable('events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  runId: text('run_id').notNull(),
  kind: text('kind').notNull(),
  text: text('text').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>(),
  at: ms('at').notNull(),
}, t => [index('events_run').on(t.runId, t.id)]);

export const jobs = pgTable('jobs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  kind: text('kind').notNull(),                       // 'build' | 'revise' | 'render'
  runId: text('run_id').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  status: text('status').notNull(),                   // queued | running | cancel | done | failed | cancelled
  createdAt: ms('created_at').notNull(),
  heartbeatAt: ms('heartbeat_at'),                    // written every 30 s while a job runs; the sweeper fails silent ones
}, t => [index('jobs_queue').on(t.status, t.kind, t.id), index('jobs_run').on(t.runId)]);

export const renders = pgTable('renders', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull(),
  status: text('status').notNull(),
  progress: real('progress').notNull().default(0),
  eta: text('eta'),
  file: text('file'),
  error: text('error'),
  createdAt: ms('created_at').notNull(),
}, t => [index('renders_run').on(t.runId, t.createdAt)]);

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  projectId: text('project_id').notNull(),
  userId: text('user_id'),
  runA: text('run_a').notNull(),
  runB: text('run_b').notNull(),
  modelA: text('model_a').notNull(),
  modelB: text('model_b').notNull(),
  choice: text('choice').notNull(),                   // 'A' | 'B' | 'tie' | 'bad'
  createdAt: ms('created_at').notNull(),
}, t => [uniqueIndex('votes_project').on(t.projectId)]);

// ---------- admin-controlled ----------
// Every model the arena can use. Only admins see or change these; users never pick a model.
export const models = pgTable('models', {
  id: text('id').primaryKey(),                        // 'anthropic/claude-opus-5-5'
  provider: text('provider').notNull(),               // 'anthropic' | 'openai'
  modelId: text('model_id').notNull(),                // the provider's API model id
  label: text('label').notNull(),
  vision: boolean('vision').notNull().default(true),  // builds need it: the agent looks at contact sheets
  enabled: boolean('enabled').notNull().default(true),
  thinking: text('thinking').notNull().default('high'),
  createdAt: ms('created_at').notNull(),
});

// The arena lineup: each new arena draws one enabled pair, weighted.
export const arenaPairs = pgTable('arena_pairs', {
  id: serial('id').primaryKey(),
  modelA: text('model_a').notNull(),
  modelB: text('model_b').notNull(),
  weight: integer('weight').notNull().default(1),
  enabled: boolean('enabled').notNull().default(true),
});

// Other admin settings as key/value: planningModel, studioModel ('winner' or a model id).
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
});
