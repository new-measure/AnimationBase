import { createRender, latestRender, enqueue } from '@/server/db';
import { ownRun } from '@/server/auth';
import { json, fail, handle } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: RouteContext<'/api/runs/[id]/render'>) => {
  const { run } = await ownRun((await ctx.params).id);
  return json(await latestRender(run.id));
});

// export the film to MP4 (render.mjs --frames, then --encode) in the worker
export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/runs/[id]/render'>) => {
  const { id } = await ctx.params;
  const { run } = await ownRun(id);
  if (!run.version) return fail('there is no finished film to export yet');
  if (run.busy) return fail('wait for the agent to finish first');
  const cur = await latestRender(id);
  if (cur && ['queued', 'running'].includes(cur.status)) return json(cur);
  const r = await createRender(id);
  await enqueue('render', id, { renderId: r.id });
  return json(r);
});
