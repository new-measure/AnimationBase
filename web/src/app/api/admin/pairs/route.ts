import { requireAdmin } from '@/server/auth';
import { savePair, deletePair, listPairs, getModel } from '@/server/models';
import { json, fail, body, handle } from '@/server/http';

// the arena lineup: add or edit a pair, or remove one (admins only)
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const p = await body<{ id?: number; modelA?: string; modelB?: string; weight?: number; enabled?: boolean }>(req);
  if (!p.modelA || !p.modelB || !(await getModel(p.modelA)) || !(await getModel(p.modelB))) return fail('pick two models from the registry');
  await savePair({ id: p.id, modelA: p.modelA, modelB: p.modelB, weight: Math.max(0, Math.round(p.weight ?? 1)), enabled: p.enabled ?? true });
  return json(await listPairs());
});

export const DELETE = handle(async (req: Request) => {
  await requireAdmin();
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!id) return fail('which pair?');
  await deletePair(id);
  return json(await listPairs());
});
