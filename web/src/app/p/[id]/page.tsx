import { notFound } from 'next/navigation';
import { projectState } from '@/server/state';
import { viewer, canSee } from '@/server/auth';
import { getProject } from '@/server/db';
import { catalog, familyCards } from '@/server/catalog';
import ProjectView from '@/components/ProjectView';

export default async function ProjectPage({ params }: PageProps<'/p/[id]'>) {
  const { id } = await params;
  const [v, project] = await Promise.all([viewer(), getProject(id)]);
  if (!project || !canSee(v, project)) notFound();
  const state = (await projectState(id, { admin: v.admin }))!;
  return <ProjectView initial={state} families={familyCards()} categories={catalog().categories} />;
}
