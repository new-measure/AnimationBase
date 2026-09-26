'use client';
// Step 3: the arena. The same storyboard, built by two models side by side, shown blind as Film A and Film B. The
// user plays both, picks one, and only then sees which model made which.
import { useEffect, useRef, useState } from 'react';
import type { ProjectState, RunView } from '@/server/state';
import type { Shot } from '@/lib/types';
import { useEvents } from '@/lib/hooks';
import { modelLabel } from '@/lib/models';
import { api } from '@/lib/api';
import Player, { type PlayerHandle } from './Player';
import AgentFeed from './AgentFeed';
import { Button, Card, Spinner } from './ui';

const ASPECT = { landscape: 16 / 9, square: 1, portrait: 9 / 16 };
const finished = (r: RunView) => ['done', 'failed', 'cancelled'].includes(r.status) && !r.busy;

function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!on) return; const h = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(h); }, [on]);
  return now;
}

function StatusChip({ run, now }: { run: RunView; now: number }) {
  const mins = run.startedAt ? Math.max(0, Math.floor(((run.finishedAt || now) - run.startedAt) / 60000)) : 0;
  if (run.status === 'queued') return <span className="text-xs text-muted">Queued</span>;
  if (run.status === 'running' || run.busy) return <span className="inline-flex items-center gap-1.5 text-xs text-accent"><Spinner /> Building · {mins} min</span>;
  if (run.status === 'done') return <span className="text-xs text-good">✓ Ready · took {mins} min</span>;
  if (run.status === 'cancelled') return <span className="text-xs text-muted">Stopped</span>;
  return <span className="text-xs text-bad" title={run.error || ''}>{run.version ? 'Finished with problems' : 'Failed'}</span>;
}

function Side({ run, label, aspect, shots, playerRef, now, revealed, picked }: {
  run: RunView; label: string; aspect: number; shots: Shot[];
  playerRef: React.Ref<PlayerHandle>; now: number; revealed: boolean; picked: boolean;
}) {
  const live = !finished(run);
  const events = useEvents(run.id, live);
  const [showFeed, setShowFeed] = useState(false);
  const lastSheet = [...events].reverse().find(e => e.kind === 'sheet');
  const lastLine = [...events].reverse().find(e => e.kind === 'tool' || e.kind === 'say' || e.kind === 'status');

  return (
    <Card className={`p-4 min-w-0 flex flex-col gap-3 ${picked ? 'ring-2 ring-accent' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="size-7 rounded-lg bg-ink text-bg grid place-items-center text-sm font-semibold">{label}</span>
        <span className="font-medium">Film {label}</span>
        {revealed && run.model && <span className="rounded-full bg-accent-soft text-accent px-2 py-0.5 text-xs font-medium">{modelLabel(run.model)}</span>}
        <span className="ml-auto"><StatusChip run={run} now={now} /></span>
      </div>

      {run.version > 0 ? (
        <Player ref={playerRef} runId={run.id} version={run.version} aspect={aspect} shots={shots} compact />
      ) : (
        <div className="relative w-full rounded-xl overflow-hidden bg-stage ring-1 ring-line grid place-items-center" style={{ aspectRatio: aspect, maxHeight: '46vh' }}>
          {lastSheet ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/ws/${run.id}/${String(lastSheet.data?.path)}?e=${lastSheet.id}`} alt="latest contact sheet" className="absolute inset-0 w-full h-full object-contain opacity-60" />
          ) : <div className="absolute inset-0 skeleton opacity-20" />}
          <div className="relative text-center px-6">
            <p className="text-white/90 text-sm font-medium">{run.status === 'queued' ? 'Waiting to start' : run.status === 'running' ? 'Building the film' : 'No film yet'}</p>
            {lastLine && live && <p className="mt-1 text-white/60 text-xs line-clamp-2">{lastLine.text}</p>}
            {run.error && !live && <p className="mt-1 text-white/70 text-xs">{run.error}</p>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs">
        <button onClick={() => setShowFeed(s => !s)} className="text-muted hover:text-ink">{showFeed ? '▾ Hide' : '▸ Show'} what it’s doing ({events.filter(e => e.kind === 'sheet').length} checks)</button>
        {live && <button onClick={() => api(`/api/runs/${run.id}/cancel`, 'POST')} className="ml-auto text-muted hover:text-bad">Stop</button>}
      </div>
      {showFeed && <div className="max-h-80 overflow-y-auto pr-1 border-t border-line pt-3"><AgentFeed runId={run.id} events={events} compact /></div>}
    </Card>
  );
}

export default function Arena({ state, onVote, onContinue }: {
  state: ProjectState; onVote: (c: string) => Promise<void>; onContinue: (runId: string) => Promise<void>;
}) {
  const { project, runs, vote } = state;
  const [a, b] = runs;
  const refA = useRef<PlayerHandle>(null), refB = useRef<PlayerHandle>(null);
  const [busy, setBusy] = useState('');
  const allDone = runs.length === 2 && runs.every(finished);
  const now = useNow(!allDone);
  const aspect = ASPECT[project.brief!.format];
  const shots = project.storyboard?.shots || [];
  const playBoth = () => { refA.current?.seek(0); refB.current?.seek(0); setTimeout(() => { refA.current?.play(); refB.current?.play(); }, 150); };
  if (!a || !b) return null;
  const winner = vote === 'A' ? a : vote === 'B' ? b : null;

  const act = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); } finally { setBusy(''); } };

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{project.storyboard?.title} · Arena</h1>
          <p className="text-sm text-muted">Same storyboard, two models. Watch both, then pick the better film.</p>
        </div>
        {a.version > 0 && b.version > 0 && <Button variant="ghost" className="ml-auto" onClick={playBoth}>▶ Play both from the start</Button>}
      </div>

      <div className={`mt-5 grid gap-4 ${project.brief!.format === 'portrait' ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'lg:grid-cols-2'}`}>
        <Side run={a} label="A" aspect={aspect} shots={shots} playerRef={refA} now={now} revealed={!!vote} picked={vote === 'A'} />
        <Side run={b} label="B" aspect={aspect} shots={shots} playerRef={refB} now={now} revealed={!!vote} picked={vote === 'B'} />
      </div>

      <Card className="mt-5 p-4 sticky bottom-4 shadow-lg">
        {!vote ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium mr-auto">{allDone ? 'Which film is better?' : 'Voting opens when both films are finished.'}</p>
            <Button variant="dark" disabled={!allDone || !!busy} onClick={() => act('A', () => onVote('A'))}>← A is better</Button>
            <Button variant="ghost" disabled={!allDone || !!busy} onClick={() => act('tie', () => onVote('tie'))}>It’s a tie</Button>
            <Button variant="ghost" disabled={!allDone || !!busy} onClick={() => act('bad', () => onVote('bad'))}>Both are bad</Button>
            <Button variant="dark" disabled={!allDone || !!busy} onClick={() => act('B', () => onVote('B'))}>B is better →</Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm mr-auto">
              {winner ? <>You picked <b>Film {vote}</b>, made by <b>{modelLabel(winner.model!)}</b>. The other was {modelLabel((winner === a ? b : a).model!)}.</>
                : <>You voted <b>{vote === 'tie' ? 'a tie' : 'both bad'}</b>. A was {modelLabel(a.model!)}, B was {modelLabel(b.model!)}. Pick one to keep working on.</>}
            </p>
            {winner ? (
              <Button disabled={!!busy} onClick={() => act('go', () => onContinue(winner.id))}>Continue to the studio →</Button>
            ) : (<>
              <Button variant="ghost" disabled={!!busy || !a.version} onClick={() => act('a', () => onContinue(a.id))}>Continue with A</Button>
              <Button variant="ghost" disabled={!!busy || !b.version} onClick={() => act('b', () => onContinue(b.id))}>Continue with B</Button>
            </>)}
          </div>
        )}
      </Card>
    </div>
  );
}
