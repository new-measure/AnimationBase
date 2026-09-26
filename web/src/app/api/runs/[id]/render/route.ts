import { getRun, createRender, latestRender, enqueue } from '@/server/db';
import { json, fail, handle } from '@/server/http';

export const GET = handle(async (_req: Request, ctx: RouteContext<'/api/runs/[id]/render'>) => json(latestRender((await ctx.params).id)));

// export the film to MP4 (render.mjs --frames, then --encode) in the worker
export const POST = handle(async (_req: Request, ctx: RouteContext<'/api/runs/[id]/render'>) => {
  const { id } = await ctx.params;
  const run = getRun(id);
  if (!run || !run.version) return fail('there is no finished film to export yet');
  if (run.busy) return fail('wait for the agent to finish first');
  const cur = latestRender(id);
  if (cur && ['queued', 'running'].includes(cur.status)) return json(cur);
  const r = createRender(id);
  enqueue('render', id, { renderId: r.id });
  return json(r);
});
