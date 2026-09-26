// Everything the project page needs in one read. Arena runs stay blind (no model names) until the user has voted.
import { getProject, projectRuns, getVote, latestRender } from './db';
import { catalog, type FamilyStats } from './catalog';
import { versions } from './workspace';
import type { Project, Run, Render } from '@/lib/types';

export interface RunView extends Omit<Run, 'model'> { model: string | null; render: Render | null; versions: number[] }
export interface ProjectState {
  project: Project;
  runs: RunView[];
  vote: string | null;
  family: FamilyStats | null;
}

export function projectState(id: string): ProjectState | null {
  const project = getProject(id);
  if (!project) return null;
  const vote = getVote(id)?.choice ?? null;
  const reveal = vote != null || project.status === 'studio';
  const runs = projectRuns(id).map(r => ({ ...r, model: reveal ? r.model : null, render: latestRender(r.id), versions: versions(r.id) }));
  const family = project.brief ? catalog().families[project.brief.family] ?? null : null;
  return { project, runs, vote, family };
}
