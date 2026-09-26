'use client';
// One page per project that walks through the four steps: brief → storyboard → arena → studio.
import { useState } from 'react';
import type { ProjectState } from '@/server/state';
import type { FamilyStats } from '@/server/catalog';
import type { Brief, Storyboard } from '@/lib/types';
import { useProject } from '@/lib/hooks';
import { api } from '@/lib/api';
import BriefReview from './BriefReview';
import StoryboardStep from './StoryboardStep';
import Arena from './Arena';
import Studio from './Studio';
import { Stepper } from './ui';

const STEP = { brief: 0, storyboard: 1, arena: 2, studio: 3 } as const;

export default function ProjectView({ initial, families, categories }: { initial: ProjectState; families: Omit<FamilyStats, 'byCategory'>[]; categories: string[] }) {
  const { state, setState, refresh } = useProject(initial.project.id, initial);
  const { project, runs } = state;
  const reached = STEP[project.status];
  const [view, setView] = useState<number | null>(null);   // looking back at the brief before the arena starts
  const step = view ?? reached;
  const [busy, setBusy] = useState<'' | 'storyboard' | 'revise' | 'start'>('');
  const [error, setError] = useState('');
  const id = project.id;

  const run = async <T,>(key: typeof busy, fn: () => Promise<T>) => {
    setBusy(key); setError('');
    try { return await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  };
  const put = (s: ProjectState | undefined) => { if (s) setState(s); };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-line bg-panel">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-11 flex items-center gap-4">
          <Stepper at={step} onGo={runs.length ? undefined : i => setView(i === reached ? null : i)} />
          {view != null && view < reached && <button onClick={() => setView(null)} className="text-xs text-accent hover:underline">Back to the {['brief', 'storyboard', 'arena', 'studio'][reached]} →</button>}
          <span className="ml-auto text-xs text-muted truncate hidden sm:block">{project.brief?.product}</span>
        </div>
      </div>
      {error && <div className="bg-bad/10 text-bad text-sm px-6 py-2 text-center">{error} <button onClick={() => setError('')} className="ml-2 underline">dismiss</button></div>}

      {step === 0 && (
        <BriefReview project={project} families={families} categories={categories} busy={busy === 'storyboard'}
          onPatch={async (b: Partial<Brief>) => put(await run('', () => api<ProjectState>(`/api/projects/${id}`, 'PATCH', { brief: b })))}
          onNext={async () => { const s = await run('storyboard', () => api<ProjectState>(`/api/projects/${id}/storyboard`, 'POST', {})); if (s) { setState(s); setView(null); } }} />
      )}
      {step === 1 && project.storyboard && (
        <StoryboardStep project={project} family={state.family} busy={busy === 'revise' || busy === 'start' ? busy : ''}
          onSave={(s: Storyboard) => { setState({ ...state, project: { ...project, storyboard: s } }); api(`/api/projects/${id}`, 'PATCH', { storyboard: s }).catch(e => setError(e.message)); }}
          onRevise={async change => put(await run('revise', () => api<ProjectState>(`/api/projects/${id}/storyboard`, 'POST', { change })))}
          onStart={async (models, effort) => put(await run('start', () => api<ProjectState>(`/api/projects/${id}/arena`, 'POST', { models, effort })))} />
      )}
      {step === 2 && (
        <Arena state={state}
          onVote={async c => put(await run('', () => api<ProjectState>(`/api/projects/${id}/vote`, 'POST', { choice: c })))}
          onContinue={async runId => put(await run('', () => api<ProjectState>(`/api/projects/${id}/winner`, 'POST', { runId })))} />
      )}
      {step === 3 && project.winnerRunId && <Studio state={state} refresh={refresh} />}
    </div>
  );
}
