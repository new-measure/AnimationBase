import { updateProject } from '@/server/db';
import { writeStoryboard } from '@/server/plan';
import { projectState } from '@/server/state';
import { ownProject } from '@/server/auth';
import { json, fail, body, handle } from '@/server/http';

// planning calls (with web search) take up to a minute or two
export const maxDuration = 300;

// write the storyboard from the brief, or revise the current one with a note
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]/storyboard'>) => {
  const { id } = await ctx.params;
  const { v, project: p } = await ownProject(id);
  if (!p.brief) return fail('this project has no brief yet');
  const { change } = await body<{ change?: string }>(req);
  const storyboard = await writeStoryboard(p.brief, p.similar, change ? p.storyboard : null, change);
  await updateProject(id, { storyboard, status: 'storyboard' });
  return json(await projectState(id, { admin: v.admin }));
});
