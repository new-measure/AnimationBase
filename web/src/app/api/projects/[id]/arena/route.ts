import { updateProject, createRun, enqueue, projectRuns } from '@/server/db';
import { drawArenaPair } from '@/server/models';
import { projectState } from '@/server/state';
import { ownProject } from '@/server/auth';
import { json, fail, handle } from '@/server/http';

// start the arena: the same storyboard, built by two models side by side. The pair comes from the admin lineup
// (users never choose), and which model gets slot A is random.
export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/projects/[id]/arena'>) => {
  const { id } = await ctx.params;
  const { v, project: p } = await ownProject(id);
  if (!p.storyboard) return fail('write the storyboard first');
  if ((await projectRuns(id)).length) return fail('this project already has an arena');
  const { a, b } = await drawArenaPair();
  for (const [slot, m] of [['A', a], ['B', b]] as const) {
    const run = await createRun(id, slot, m.id, m.thinking);
    await enqueue('build', run.id);
  }
  await updateProject(id, { status: 'arena' });
  return json(await projectState(id, { admin: v.admin }));
});
