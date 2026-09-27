import { projectState } from '@/server/state';
import { updateProject } from '@/server/db';
import { applyDefaults, similarFilms } from '@/server/catalog';
import { ownProject } from '@/server/auth';
import { json, body, handle } from '@/server/http';
import type { Brief, Storyboard } from '@/lib/types';

export const GET = handle(async (_req: Request, ctx: RouteContext<'/api/projects/[id]'>) => {
  const { v, project } = await ownProject((await ctx.params).id);
  return json(await projectState(project.id, { admin: v.admin }));
});

// edit the brief (fields the user touches become "said"; the rest re-derive from the catalog) or the storyboard
export const PATCH = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]'>) => {
  const { id } = await ctx.params;
  const { v, project: p } = await ownProject(id);
  const { brief, storyboard } = await body<{ brief?: Partial<Brief>; storyboard?: Storyboard }>(req);
  if (brief && p.brief) {
    const next: Brief = { ...p.brief, ...brief, source: { ...p.brief.source }, why: { ...p.brief.why } };
    for (const k of Object.keys(brief) as (keyof Brief)[]) { next.source[k] = 'said'; delete next.why[k]; }
    const b = applyDefaults(next);
    await updateProject(id, { brief: b, similar: similarFilms(b) });
  }
  if (storyboard) await updateProject(id, { storyboard });
  return json(await projectState(id, { admin: v.admin }));
});
