import { requireAdmin } from '@/server/auth';
import { getSettings, setSetting, getModel } from '@/server/models';
import { json, fail, body, handle } from '@/server/http';

// admin settings: the planning model (Anthropic, since planning uses its web search) and who handles revisions
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const s = await body<{ planningModel?: string; studioModel?: string }>(req);
  if (s.planningModel) {
    const m = await getModel(s.planningModel);
    if (!m || m.provider !== 'anthropic') return fail('the planning model must be an Anthropic model (planning uses its web search)');
    await setSetting('planningModel', m.modelId);
  }
  if (s.studioModel) {
    if (s.studioModel !== 'winner' && !(await getModel(s.studioModel))) return fail('unknown model');
    await setSetting('studioModel', s.studioModel);
  }
  return json(await getSettings());
});
