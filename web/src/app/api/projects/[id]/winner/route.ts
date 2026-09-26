import { getProject, getRun, updateProject } from '@/server/db';
import { projectState } from '@/server/state';
import { json, fail, body, handle } from '@/server/http';

// after a tie (or both bad), the user still picks which film to keep working on
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]/winner'>) => {
  const { id } = await ctx.params;
  const { runId } = await body<{ runId?: string }>(req);
  const run = runId ? getRun(runId) : null;
  if (!getProject(id) || !run || run.projectId !== id) return fail('pick one of this project’s films');
  if (!run.version) return fail('that film never finished, so there is nothing to keep working on');
  updateProject(id, { winnerRunId: run.id, status: 'studio' });
  return json(projectState(id));
});
