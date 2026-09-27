import { projectRuns, recordVote, getVote } from '@/server/db';
import { projectState } from '@/server/state';
import { ownProject } from '@/server/auth';
import { json, fail, body, handle } from '@/server/http';

// record the blind vote; moving on to the studio is a separate step (winner route)
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]/vote'>) => {
  const { id } = await ctx.params;
  const { v } = await ownProject(id);
  const runs = await projectRuns(id);
  const { choice } = await body<{ choice?: string }>(req);
  if (runs.length !== 2) return fail('no arena to vote on');
  if (!['A', 'B', 'tie', 'bad'].includes(choice || '')) return fail('choice must be A, B, tie or bad');
  if (await getVote(id)) return fail('already voted');
  await recordVote(id, runs[0], runs[1], choice!, v.userId);
  return json(await projectState(id, { admin: v.admin }));
});
