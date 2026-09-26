import { connection } from 'next/server';
import ProjectList from '@/components/ProjectList';
import { listProjects } from '@/server/db';

export default async function Projects() {
  await connection();
  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
      <div className="mt-6"><ProjectList projects={listProjects(100)} /></div>
    </div>
  );
}
