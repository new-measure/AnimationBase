import Link from 'next/link';
import type { Project } from '@/lib/types';
import { ago } from '@/lib/api';
import { Badge, ButtonLink, EmptyState } from './ui';
import { Film, Plus } from './icons';

const STEP: Record<string, { label: string; tone: 'neutral' | 'accent' | 'good' }> = {
  brief: { label: 'Brief', tone: 'neutral' }, storyboard: { label: 'Storyboard', tone: 'neutral' },
  arena: { label: 'Arena', tone: 'accent' }, studio: { label: 'Studio', tone: 'good' },
};
const FRAME = { landscape: 'h-20 aspect-video', square: 'h-24 aspect-square', portrait: 'h-28 aspect-[9/16]' };

// a stand-in poster: the film's format, light or dark ground, and brand colour, until real thumbnails exist
function Poster({ p }: { p: Project }) {
  const b = p.brief, dark = b?.theme !== 'light', tint = b?.brand?.colors?.[0] || 'var(--accent)';
  return (
    <div className="relative h-36 overflow-hidden rounded-t-2xl bg-sunken grid place-items-center">
      <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(60% 80% at 50% 110%, color-mix(in srgb, ${tint} 35%, transparent), transparent)` }} />
      <div className={`relative ${FRAME[b?.format ?? 'landscape']} rounded-md ring-1 ring-black/10 shadow-float overflow-hidden flex flex-col justify-end p-2 transition-transform group-hover:scale-[1.04] ${dark ? 'bg-stage text-white' : 'bg-white text-neutral-900'}`}>
        <span className="h-1 w-6 rounded-full mb-1" style={{ background: tint }} />
        <span className="text-[0.625rem] font-semibold leading-tight line-clamp-2">{p.storyboard?.title || b?.product || 'Untitled'}</span>
      </div>
    </div>
  );
}

export default function ProjectList({ projects }: { projects: Project[] }) {
  if (!projects.length) return (
    <EmptyState icon={<Film size={20} />} title="No videos yet" action={<ButtonLink href="/" icon={<Plus size={14} />}>New video</ButtonLink>}>
      Describe a film in a line and we’ll storyboard it with you.
    </EmptyState>
  );
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(p => (
        <li key={p.id}>
          <Link href={`/p/${p.id}`} className="group block h-full rounded-2xl border border-line bg-panel shadow-card transition hover:border-accent/50 hover:shadow-float hover:-translate-y-px">
            <Poster p={p} />
            <div className="p-4">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 font-medium truncate">{p.storyboard?.title || p.brief?.product || 'Untitled'}</p>
                <Badge tone={STEP[p.status].tone}>{STEP[p.status].label}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted line-clamp-2">{p.prompt}</p>
              <p className="mt-3 text-xs text-faint">{ago(p.createdAt)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
