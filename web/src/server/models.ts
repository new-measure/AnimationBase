// The admin-controlled model registry, arena lineup and settings. Users never pick a model: every arena draws a pair
// from the enabled lineup here, weighted, and the planning and studio models come from settings.
import { and, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import * as t from './schema';

export type ModelRow = typeof t.models.$inferSelect;
export type PairRow = typeof t.arenaPairs.$inferSelect;

export const DEFAULT_SETTINGS = {
  planningModel: 'claude-opus-5-5',      // Anthropic model for the brief and storyboard (they use web search)
  studioModel: 'winner' as string,       // 'winner' = revisions stay with the model that won, or a models.id
};
export type Settings = typeof DEFAULT_SETTINGS;

export async function listModels(): Promise<ModelRow[]> {
  return db().select().from(t.models).orderBy(t.models.provider, t.models.label);
}
export async function getModel(id: string): Promise<ModelRow | null> {
  const [m] = await db().select().from(t.models).where(eq(t.models.id, id));
  return m ?? null;
}
export async function upsertModel(m: Omit<ModelRow, 'createdAt'>) {
  await db().insert(t.models).values({ ...m, createdAt: Date.now() }).onConflictDoUpdate({ target: t.models.id, set: m });
}

export async function listPairs(): Promise<PairRow[]> {
  return db().select().from(t.arenaPairs).orderBy(t.arenaPairs.id);
}
export async function savePair(p: Omit<PairRow, 'id'> & { id?: number }) {
  if (p.id) await db().update(t.arenaPairs).set(p).where(eq(t.arenaPairs.id, p.id));
  else await db().insert(t.arenaPairs).values(p);
}
export async function deletePair(id: number) {
  await db().delete(t.arenaPairs).where(eq(t.arenaPairs.id, id));
}

// Draw the pair for a new arena: enabled pairs whose two models are both enabled, chosen by weight. Which model
// gets slot A is random, so position says nothing about the model.
export async function drawArenaPair(): Promise<{ a: ModelRow; b: ModelRow }> {
  const pairs = (await listPairs()).filter(p => p.enabled && p.weight > 0);
  const ids = [...new Set(pairs.flatMap(p => [p.modelA, p.modelB]))];
  const ms = ids.length ? await db().select().from(t.models).where(and(inArray(t.models.id, ids), eq(t.models.enabled, true))) : [];
  const byId = new Map(ms.map(m => [m.id, m]));
  const live = pairs.filter(p => byId.has(p.modelA) && byId.has(p.modelB));
  if (!live.length) throw new Error('No arena lineup is configured. An admin needs to enable at least one model pair.');
  let r = Math.random() * live.reduce((s, p) => s + p.weight, 0);
  const pick = live.find(p => (r -= p.weight) < 0) ?? live[live.length - 1];
  const [a, b] = Math.random() < .5 ? [pick.modelA, pick.modelB] : [pick.modelB, pick.modelA];
  return { a: byId.get(a)!, b: byId.get(b)! };
}

export async function getSettings(): Promise<Settings> {
  const rows = await db().select().from(t.settings);
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map(r => [r.key, r.value])) } as Settings;
}
export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db().insert(t.settings).values({ key, value }).onConflictDoUpdate({ target: t.settings.key, set: { value } });
}
