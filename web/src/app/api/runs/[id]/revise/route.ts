import { getRun, getProject, enqueue, addEvent, updateRun } from '@/server/db';
import { json, fail, body, handle } from '@/server/http';

// a change request on the winning film: queued for the agent, optionally pinned to a moment in the film
export const POST = handle(async (req: Request, ctx: RouteContext<'/api/runs/[id]/revise'>) => {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run || getProject(run.projectId)?.winnerRunId !== id) return fail('only the chosen film can be revised');
  if (run.busy) return fail('the agent is still working on this film');
  const { message, at } = await body<{ message?: string; at?: number }>(req);
  if (!message?.trim()) return fail('say what to change');
  addEvent(id, 'user', message.trim(), at != null ? { at } : null);
  updateRun(id, { status: 'queued' });
  enqueue('revise', id, { message: message.trim(), at });
  return json({ ok: true });
});
