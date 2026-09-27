'use client';
// Step 3: the arena. The same storyboard, built by two models side by side, shown blind as Film A and Film B. The
// user plays both, picks one, and only then sees which model made which.
import { useEffect, useRef, useState } from 'react';
import type { ProjectState, RunView } from '@/server/state';
import type { Shot, RunEvent } from '@/lib/types';
import { useEvents } from '@/lib/hooks';
import { api } from '@/lib/api';
import Player, { type PlayerHandle } from './Player';
import { PHASES, progress } from '@/lib/progress';
import { Badge, Button, Card, Spinner } from './ui';
import { ArrowLeft, ArrowRight, Play, Scale, Stop, ThumbDown, Trophy } from './icons';

const ASPECT = { landscape: 16 / 9, square: 1, portrait: 9 / 16 };
const finished = (r: RunView) => ['done', 'failed', 'cancelled'].includes(r.status) && !r.busy;

function useNow(on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!on) return; const h = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(h); }, [on]);
  return now;
}

function StatusChip({ run, now }: { run: RunView; now: number }) {
  const mins = run.startedAt ? Math.max(0, Math.floor(((run.finishedAt || now) - run.startedAt) / 60000)) : 0;
  if (run.status === 'queued') return <Badge>Queued</Badge>;
  if (run.status === 'running' || run.busy) return <Badge tone="accent"><Spinner className="size-3 border-[1.5px]" /> Building · {mins} min</Badge>;
  if (run.status === 'done') return <Badge tone="good">Ready · {mins} min</Badge>;
  if (run.status === 'cancelled') return <Badge>Stopped</Badge>;
  return <Badge tone="bad" title={run.error || ''}>{run.version ? 'Finished with problems' : 'Failed'}</Badge>;
}

// the phase strip under a film that's still building (the latest contact sheet is already its poster)
function ProgressBar({ events }: { events: RunEvent[] }) {
  const p = progress(events);
  return (
    <div>
      <div className="flex items-center text-xs"><span className="font-medium">{PHASES[p.index].label}…</span>{p.checks > 0 && <span className="ml-auto text-muted tabular-nums">checked {p.checks}×</span>}</div>
      <div className="mt-1.5 grid grid-cols-4 gap-1">{PHASES.map((ph, i) => <div key={ph.key} className={`h-1 rounded-full ${i <= p.index ? 'bg-accent' : 'bg-line'}`} />)}</div>
    </div>
  );
}

function Side({ run, label, aspect, shots, playerRef, now, revealed, picked }: {
  run: RunView; label: string; aspect: number; shots: Shot[];
  playerRef: React.Ref<PlayerHandle>; now: number; revealed: boolean; picked: boolean;
}) {
  const live = !finished(run);
  const events = useEvents(run.id, live);
  const lastSheet = [...events].reverse().find(e => e.kind === 'sheet');

  return (
    <Card className={`p-4 min-w-0 flex flex-col gap-3 transition ${picked ? 'border-accent ring-2 ring-accent/30' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`size-7 shrink-0 rounded-lg grid place-items-center text-sm font-semibold ${picked ? 'bg-accent text-accent-ink' : 'bg-ink text-bg'}`}>{label}</span>
        <span className="font-semibold tracking-tight">Film {label}</span>
        {picked && <Badge tone="accent"><Trophy size={12} /> Your pick</Badge>}
        {revealed && run.modelLabel && <Badge className="truncate" title="Only admins see this">{run.modelLabel}</Badge>}
        <span className="ml-auto shrink-0"><StatusChip run={run} now={now} /></span>
      </div>

      {run.version > 0 ? (
        <Player ref={playerRef} ws={run.ws} version={run.version} aspect={aspect} shots={shots} compact />
      ) : (
        <div className="relative w-full rounded-xl overflow-hidden bg-stage ring-1 ring-line grid place-items-center" style={{ aspectRatio: aspect, maxHeight: '46vh' }}>
          {lastSheet ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/ws/${run.ws}/${String(lastSheet.data?.path)}?e=${lastSheet.id}`} alt="latest contact sheet" className="absolute inset-0 w-full h-full object-contain opacity-60" />
          ) : <div className="absolute inset-0 skeleton opacity-20" />}
          <div className="relative text-center px-6">
            <p className="text-white/90 text-sm font-medium">{run.status === 'queued' ? 'Waiting to start' : run.status === 'running' ? 'Building the film' : 'No film yet'}</p>
            {run.error && !live && <p className="mt-1 text-white/70 text-xs">{run.error}</p>}
          </div>
        </div>
      )}

      {live && (
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0"><ProgressBar events={events} /></div>
          <Button variant="danger" size="sm" icon={<Stop size={12} />} onClick={() => api(`/api/runs/${run.id}/cancel`, 'POST')} className="-mt-1">Stop</Button>
        </div>
      )}
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
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-accent">Arena</p>
          <h1 className="text-2xl font-semibold tracking-tight truncate">{project.storyboard?.title}</h1>
          <p className="mt-1 text-sm text-muted">Same storyboard, two takes, names hidden. Watch both, then pick the better film.</p>
        </div>
        {a.version > 0 && b.version > 0 && <Button variant="secondary" className="ml-auto" icon={<Play size={12} />} onClick={playBoth}>Play both from the start</Button>}
      </div>

      <div className={`mt-5 grid gap-4 ${project.brief!.format === 'portrait' ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'lg:grid-cols-2'}`}>
        <Side run={a} label="A" aspect={aspect} shots={shots} playerRef={refA} now={now} revealed={!!vote} picked={vote === 'A'} />
        <Side run={b} label="B" aspect={aspect} shots={shots} playerRef={refB} now={now} revealed={!!vote} picked={vote === 'B'} />
      </div>

      <div className="sticky bottom-4 z-20 mt-5 rounded-2xl border border-line bg-panel/95 backdrop-blur p-3 sm:p-4 shadow-float">
        {!vote ? (
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Button variant="dark" size="lg" disabled={!allDone || (!!busy && busy !== 'A')} loading={busy === 'A'} icon={<ArrowLeft />}
              onClick={() => act('A', () => onVote('A'))} className="sm:justify-self-start sm:min-w-44">A is better</Button>
            <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto flex flex-col items-center gap-1.5 text-center">
              <p className="text-sm font-medium">
                {allDone ? 'Which film is better?' : <span className="inline-flex items-center gap-2 text-muted"><Spinner /> Voting opens when both films are finished</span>}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="quiet" size="sm" icon={<Scale size={14} />} disabled={!allDone || (!!busy && busy !== 'tie')} loading={busy === 'tie'} onClick={() => act('tie', () => onVote('tie'))}>It’s a tie</Button>
                <Button variant="quiet" size="sm" icon={<ThumbDown size={14} />} disabled={!allDone || (!!busy && busy !== 'bad')} loading={busy === 'bad'} onClick={() => act('bad', () => onVote('bad'))}>Both are bad</Button>
              </div>
            </div>
            <Button variant="dark" size="lg" disabled={!allDone || (!!busy && busy !== 'B')} loading={busy === 'B'}
              onClick={() => act('B', () => onVote('B'))} className="sm:justify-self-end sm:min-w-44">B is better <ArrowRight /></Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="mr-auto min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                {winner ? <><Trophy className="text-accent" /> You picked Film {vote}</> : <>You voted {vote === 'tie' ? 'a tie' : 'both bad'}. Pick one to keep working on.</>}
              </p>
              {a.modelLabel && (
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <Badge>Admin</Badge> A: {a.modelLabel} · B: {b.modelLabel}
                </p>
              )}
            </div>
            {winner ? (
              <Button size="lg" loading={busy === 'go'} onClick={() => act('go', () => onContinue(winner.id))}>Continue to the studio <ArrowRight /></Button>
            ) : (<>
              <Button variant="secondary" disabled={!!busy || !a.version} loading={busy === 'a'} onClick={() => act('a', () => onContinue(a.id))}>Continue with A</Button>
              <Button variant="secondary" disabled={!!busy || !b.version} loading={busy === 'b'} onClick={() => act('b', () => onContinue(b.id))}>Continue with B</Button>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}
