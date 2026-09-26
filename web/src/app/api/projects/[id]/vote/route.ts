import { getProject, projectRuns, recordVote, getVote } from '@/server/db';
import { projectState } from '@/server/state';
import { json, fail, body, handle } from '@/server/http';

// record the blind vote (then the models are revealed); moving on to the studio is a separate step (winner route)
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]/vote'>) => {
  const { id } = await ctx.params;
  const p = getProject(id), runs = projectRuns(id);
  const { choice } = await body<{ choice?: string }>(req);
  if (!p || runs.length !== 2) return fail('no arena to vote on');
  if (!['A', 'B', 'tie', 'bad'].includes(choice || '')) return fail('choice must be A, B, tie or bad');
  if (getVote(id)) return fail('already voted');
  const [a, b] = runs;
  recordVote(id, a, b, choice!);
  return json(projectState(id));
});
