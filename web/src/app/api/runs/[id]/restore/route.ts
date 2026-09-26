import { getRun, updateRun, addEvent } from '@/server/db';
import { restore, snapshot } from '@/server/workspace';
import { json, fail, body, handle } from '@/server/http';

// roll the film back to an earlier version (saved as a new version, so nothing is lost)
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/runs/[id]/restore'>) => {
  const { id } = await ctx.params;
  const run = getRun(id);
  const { version } = await body<{ version?: number }>(req);
  if (!run || !version) return fail('not found', 404);
  if (run.busy) return fail('wait for the agent to finish first');
  restore(id, version);
  const next = run.version + 1;
  snapshot(id, next);
  updateRun(id, { version: next });
  addEvent(id, 'status', `Restored version ${version} as version ${next}`, { version: next });
  return json({ ok: true, version: next });
});
