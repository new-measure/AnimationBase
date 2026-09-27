import { getRun, updateProject } from '@/server/db';
import { projectState } from '@/server/state';
import { ownProject } from '@/server/auth';
import { json, fail, body, handle } from '@/server/http';

// the film the user keeps working on in the studio (after voting A or B, or picking one after a tie)
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]/winner'>) => {
  const { id } = await ctx.params;
  const { v } = await ownProject(id);
  const { runId } = await body<{ runId?: string }>(req);
  const run = runId ? await getRun(runId) : null;
  if (!run || run.projectId !== id) return fail('pick one of this project’s films');
  if (!run.version) return fail('that film never finished, so there is nothing to keep working on');
  await updateProject(id, { winnerRunId: run.id, status: 'studio' });
  return json(await projectState(id, { admin: v.admin }));
});
