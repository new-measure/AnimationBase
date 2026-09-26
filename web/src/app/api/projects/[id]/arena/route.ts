import { getProject, updateProject, createRun, enqueue, projectRuns } from '@/server/db';
import { projectState } from '@/server/state';
import { MODELS } from '@/lib/models';
import { json, fail, body, handle } from '@/server/http';

// start the arena: the same storyboard, built by two models side by side. Which model gets slot A is random, so the
// left/right position says nothing about the model.
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]/arena'>) => {
  const { id } = await ctx.params;
  const p = getProject(id);
  if (!p?.storyboard) return fail('write the storyboard first');
  if (projectRuns(id).length) return fail('this project already has an arena');
  const { models = [MODELS[0].id, MODELS[1].id], effort = 'high' } = await body<{ models?: string[]; effort?: string }>(req);
  if (models.length !== 2 || !models.every(m => MODELS.some(x => x.id === m))) return fail('pick two models');
  const order = Math.random() < .5 ? models : [models[1], models[0]];
  for (const [i, slot] of (['A', 'B'] as const).entries()) enqueue('build', createRun(id, slot, order[i]).id, { effort });
  updateProject(id, { status: 'arena' });
  return json(projectState(id));
});
