import { extractBrief } from '@/server/plan';
import { similarFilms } from '@/server/catalog';
import { createProject, listProjects } from '@/server/db';
import { json, fail, body, handle } from '@/server/http';

export const GET = handle(async () => json(listProjects()));

// a one-line prompt → a brief (Claude reads what was said, catalog stats fill the rest) → a new project
export const POST = handle(async (req: Request) => {
  const { prompt } = await body<{ prompt?: string }>(req);
  if (!prompt?.trim()) return fail('Describe the video you want');
  const brief = await extractBrief(prompt.trim());
  const project = createProject(prompt.trim(), brief, similarFilms(brief));
  return json({ id: project.id });
});
