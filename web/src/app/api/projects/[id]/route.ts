import { projectState } from '@/server/state';
import { getProject, updateProject } from '@/server/db';
import { applyDefaults, similarFilms } from '@/server/catalog';
import { json, fail, body, handle } from '@/server/http';
import type { Brief, Storyboard } from '@/lib/types';

export const GET = handle(async (_req: Request, ctx: RouteContext<'/api/projects/[id]'>) => {
  const s = projectState((await ctx.params).id);
  return s ? json(s) : fail('not found', 404);
});

// edit the brief (fields the user touches become "said"; the rest re-derive from the catalog) or the storyboard
export const PATCH = handle(async (req: Request, ctx: RouteContext<'/api/projects/[id]'>) => {
  const { id } = await ctx.params;
  const p = getProject(id);
  if (!p) return fail('not found', 404);
  const { brief, storyboard } = await body<{ brief?: Partial<Brief>; storyboard?: Storyboard }>(req);
  if (brief && p.brief) {
    const next: Brief = { ...p.brief, ...brief, source: { ...p.brief.source }, why: { ...p.brief.why } };
    for (const k of Object.keys(brief) as (keyof Brief)[]) { next.source[k] = 'said'; delete next.why[k]; }
    const b = applyDefaults(next);
    updateProject(id, { brief: b, similar: similarFilms(b) });
  }
  if (storyboard) updateProject(id, { storyboard });
  return json(projectState(id));
});
