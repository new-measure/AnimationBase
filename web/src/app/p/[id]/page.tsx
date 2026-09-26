import { notFound } from 'next/navigation';
import { projectState } from '@/server/state';
import { catalog, familyCards } from '@/server/catalog';
import ProjectView from '@/components/ProjectView';

export default async function ProjectPage({ params }: PageProps<'/p/[id]'>) {
  const { id } = await params;
  const state = projectState(id);
  if (!state) notFound();
  return <ProjectView initial={state} families={familyCards()} categories={catalog().categories} />;
}
