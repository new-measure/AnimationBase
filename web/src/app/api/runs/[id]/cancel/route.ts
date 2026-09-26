import { getRun, requestCancel, updateRun } from '@/server/db';
import { json, fail, handle } from '@/server/http';

export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/runs/[id]/cancel'>) => {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run) return fail('not found', 404);
  requestCancel(id);
  if (run.status === 'queued') updateRun(id, { status: 'cancelled' });
  return json({ ok: true });
});
