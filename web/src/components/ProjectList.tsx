import Link from 'next/link';
import type { Project } from '@/lib/types';
import { ago } from '@/lib/api';

const STEP: Record<string, string> = { brief: 'Brief', storyboard: 'Storyboard', arena: 'Arena', studio: 'Studio' };

export default function ProjectList({ projects }: { projects: Project[] }) {
  if (!projects.length) return <p className="text-sm text-muted">No videos yet.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(p => (
        <li key={p.id}>
          <Link href={`/p/${p.id}`} className="block rounded-xl border border-line bg-panel p-4 hover:border-accent transition">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="rounded-full bg-accent-soft text-accent px-2 py-0.5 font-medium">{STEP[p.status]}</span>
              <span>{ago(p.createdAt)}</span>
            </div>
            <p className="mt-2 font-medium line-clamp-1">{p.storyboard?.title || p.brief?.product || 'Untitled'}</p>
            <p className="mt-1 text-sm text-muted line-clamp-2">{p.prompt}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
