import { connection } from 'next/server';
import ProjectList from '@/components/ProjectList';
import { ButtonLink, Page, PageHeader } from '@/components/ui';
import { Plus } from '@/components/icons';
import { viewer, visibleProjects } from '@/server/auth';

export default async function Projects() {
  await connection();
  const projects = await visibleProjects(await viewer(), 100);
  return (
    <Page>
      <PageHeader title="Projects" description={`${projects.length} ${projects.length === 1 ? 'video' : 'videos'}, newest first.`}
        actions={<ButtonLink href="/" icon={<Plus size={14} />}>New video</ButtonLink>} />
      <div className="mt-8"><ProjectList projects={projects} /></div>
    </Page>
  );
}
