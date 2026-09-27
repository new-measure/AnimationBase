// Everything the project page needs in one read. Users never see which model built a film: model ids and labels are
// only included for admins.
import { getProject, projectRuns, getVote, latestRender } from './db';
import { listModels } from './models';
import { catalog, type FamilyStats } from './catalog';
import { filmVersions } from './films';
import { signRun } from './auth';
import type { Project, Run, Render } from '@/lib/types';

// ws: the signed path prefix for this run's preview, contact sheets and downloads (/ws/<ws>/...)
export interface RunView extends Omit<Run, 'model'> { model: string | null; modelLabel: string | null; ws: string; render: Render | null; versions: number[] }
export interface ProjectState {
  project: Project;
  runs: RunView[];
  vote: string | null;
  family: FamilyStats | null;
}

export async function projectState(id: string, opts: { admin?: boolean } = {}): Promise<ProjectState | null> {
  const project = await getProject(id);
  if (!project) return null;
  const [vote, runs, models] = await Promise.all([getVote(id), projectRuns(id), opts.admin ? listModels() : Promise.resolve([])]);
  const label = new Map(models.map(m => [m.id, m.label]));
  const views = await Promise.all(runs.map(async r => ({
    ...r,
    model: opts.admin ? r.model : null,
    modelLabel: opts.admin ? label.get(r.model) ?? r.model : null,
    ws: signRun(r.id),
    render: await latestRender(r.id),
    versions: await filmVersions(r),
  })));
  const family = project.brief ? catalog().families[project.brief.family] ?? null : null;
  return { project, runs: views, vote: vote?.choice ?? null, family };
}
