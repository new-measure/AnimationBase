// seed-models.ts: the starting model registry and arena lineup. Inserts only what's missing, so it never overwrites
// what an admin has changed. Model ids must exist in Pi's provider catalog.
// Run: npm run db:seed
import { db } from '../src/server/db';
import * as t from '../src/server/schema';

const MODELS = [
  { id: 'anthropic/claude-opus-5-5', provider: 'anthropic', modelId: 'claude-opus-5-5', label: 'Opus 5.5' },
  { id: 'anthropic/claude-sonnet-5', provider: 'anthropic', modelId: 'claude-sonnet-5', label: 'Sonnet 5' },
  { id: 'anthropic/claude-haiku-4-5', provider: 'anthropic', modelId: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', enabled: false },
  // OpenAI, through the Pi harness: registered off, for an admin to switch on after a smoke test (scripts/pi-smoke.ts)
  { id: 'openai/gpt-6-sol', provider: 'openai', modelId: 'gpt-6-sol', label: 'GPT-6 Sol', enabled: false },
  { id: 'openai/gpt-6-astra', provider: 'openai', modelId: 'gpt-6-astra', label: 'GPT-6 Astra', enabled: false },
  { id: 'openai/gpt-5.6-terra', provider: 'openai', modelId: 'gpt-5.6-terra', label: 'GPT-5.6 Terra', enabled: false },
];

async function main() {
  for (const m of MODELS) {
    await db().insert(t.models).values({ vision: true, enabled: true, thinking: 'high', ...m, createdAt: Date.now() }).onConflictDoNothing();
  }
  const pairs = await db().select().from(t.arenaPairs);
  if (!pairs.length) await db().insert(t.arenaPairs).values({ modelA: 'anthropic/claude-opus-5-5', modelB: 'anthropic/claude-sonnet-5', weight: 1, enabled: true });
  const ms = await db().select().from(t.models);
  const ps = await db().select().from(t.arenaPairs);
  console.log('models:', ms.map(m => `${m.label}${m.enabled ? '' : ' (off)'}`).join(', '));
  console.log('arena pairs:', ps.map(p => `${p.modelA} vs ${p.modelB} ×${p.weight}${p.enabled ? '' : ' (off)'}`).join('; '));
}
main().catch(e => { console.error(e); process.exit(1); });
