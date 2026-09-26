import { getProject, updateProject } from '@/server/db';
import { writeStoryboard } from '@/server/plan';
import { projectState } from '@/server/state';
import { json, fail, body, handle } from '@/server/http';

// write the storyboard from the brief, or revise the current one with a note
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]/storyboard'>) => {
  const { id } = await ctx.params;
  const p = getProject(id);
  if (!p?.brief) return fail('not found', 404);
  const { change } = await body<{ change?: string }>(req);
  const storyboard = await writeStoryboard(p.brief, p.similar, change ? p.storyboard : null, change);
  updateProject(id, { storyboard, status: 'storyboard' });
  return json(projectState(id));
});
