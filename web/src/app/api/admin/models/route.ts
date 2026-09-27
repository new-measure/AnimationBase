import { requireAdmin } from '@/server/auth';
import { upsertModel, listModels } from '@/server/models';
import { json, fail, body, handle } from '@/server/http';

const THINKING = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'];

// add or edit a model in the registry (admins only)
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const m = await body<{ id?: string; provider?: string; modelId?: string; label?: string; vision?: boolean; enabled?: boolean; thinking?: string }>(req);
  if (!m.provider || !['anthropic', 'openai'].includes(m.provider)) return fail('provider must be anthropic or openai');
  if (!m.modelId?.trim() || !m.label?.trim()) return fail('model id and label are required');
  const thinking = m.thinking && THINKING.includes(m.thinking) ? m.thinking : 'high';
  await upsertModel({
    id: m.id || `${m.provider}/${m.modelId.trim()}`, provider: m.provider, modelId: m.modelId.trim(), label: m.label.trim(),
    vision: m.vision ?? true, enabled: m.enabled ?? true, thinking,
  });
  return json(await listModels());
});
