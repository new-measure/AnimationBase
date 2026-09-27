import { runEvents } from '@/server/db';
import { ownRun } from '@/server/auth';
import { json, handle } from '@/server/http';

// the agent's progress feed, polled by the UI with ?after=<last id>
export const GET = handle(async (req: Request, ctx: RouteContext<'/api/runs/[id]/events'>) => {
  const { id } = await ctx.params;
  await ownRun(id);
  const after = +(new URL(req.url).searchParams.get('after') || 0);
  return json(await runEvents(id, after));
});
