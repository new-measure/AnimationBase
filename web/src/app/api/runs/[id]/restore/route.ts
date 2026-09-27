import { ownRun } from '@/server/auth';
import { restoreVersion } from '@/server/films';
import { json, fail, body, handle } from '@/server/http';

// roll the film back to an earlier version (saved as a new version, so nothing is lost)
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/runs/[id]/restore'>) => {
  const { id } = await ctx.params;
  const { run } = await ownRun(id);
  const { version } = await body<{ version?: number }>(req);
  if (!version) return fail('which version?');
  if (run.busy) return fail('wait for the agent to finish first');
  return json({ ok: true, version: await restoreVersion(run.id, version) });
});
