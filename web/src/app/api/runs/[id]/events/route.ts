import { runEvents, getRun } from '@/server/db';
import { json, fail, handle } from '@/server/http';

// the agent's progress feed, polled by the UI with ?after=<last id>
export const GET = handle(async (req: Request, ctx: RouteContext<'/api/runs/[id]/events'>) => {
  const { id } = await ctx.params;
  if (!getRun(id)) return fail('not found', 404);
  const after = +(new URL(req.url).searchParams.get('after') || 0);
  return json(runEvents(id, after));
});
