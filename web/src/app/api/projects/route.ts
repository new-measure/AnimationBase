import { extractBrief } from '@/server/plan';
import { similarFilms } from '@/server/catalog';
import { createProject } from '@/server/db';
import { viewer, visibleProjects } from '@/server/auth';
import { json, fail, body, handle } from '@/server/http';

// planning calls (with web search) take up to a minute or two
export const maxDuration = 300;

export const GET = handle(async () => json(await visibleProjects(await viewer())));

// a one-line prompt → a brief (Claude reads what was said and looks the product up; catalog stats fill the rest)
export const POST = handle(async (req: Request) => {
  const { prompt } = await body<{ prompt?: string }>(req);
  if (!prompt?.trim()) return fail('Describe the video you want');
  const brief = await extractBrief(prompt.trim());
  const v = await viewer();
  if (!v.userId) return fail('sign in first', 401);
  const project = await createProject({ prompt: prompt.trim(), brief, similar: similarFilms(brief), userId: v.userId });
  return json({ id: project.id });
});
