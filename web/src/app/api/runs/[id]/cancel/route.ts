import { requestCancel, updateRun } from '@/server/db';
import { ownRun } from '@/server/auth';
import { json, handle } from '@/server/http';

export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/runs/[id]/cancel'>) => {
  const { id } = await ctx.params;
  const { run } = await ownRun(id);
  await requestCancel(id);
  if (run.status === 'queued') await updateRun(id, { status: 'cancelled' });
  return json({ ok: true });
});
