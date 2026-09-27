'use client';
// Step 4: the studio, for the film the user kept. Chat or pin a comment to a moment to ask for changes; every finished
// change is a version you can go back to; export renders the MP4.
import { useRef, useState } from 'react';
import type { ProjectState, RunView } from '@/server/state';
import { useEvents } from '@/lib/hooks';
import { api, fmtTime } from '@/lib/api';
import Player, { type PlayerHandle } from './Player';
import { Conversation, Progress } from './AgentFeed';
import { Badge, Button, Card, Segmented, Spinner, Textarea, buttonClass } from './ui';
import { Comment, Download, Restore, X } from './icons';
import { toast } from './toast';

const ASPECT = { landscape: 16 / 9, square: 1, portrait: 9 / 16 };

function Export({ run, title, refresh }: { run: RunView; title: string; refresh: () => void }) {
  const r = run.render;
  const start = async () => { try { await api(`/api/runs/${run.id}/render`, 'POST'); refresh(); } catch (e) { toast.error((e as Error).message); } };
  const file = (title || 'film').toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-v${run.version}.mp4`;
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold">Export</p>
      {(!r || r.status === 'cancelled') && <><p className="mt-1 text-sm text-muted">Renders every frame to an MP4. Takes a few minutes.</p>
        <Button className="mt-3 w-full" icon={<Download />} onClick={start} disabled={run.busy}>Export MP4</Button></>}
      {r && (r.status === 'queued' || r.status === 'running') && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-sunken overflow-hidden"><div className="h-full bg-accent transition-all" style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>
          <p className="mt-1.5 text-xs text-muted tabular-nums">{r.status === 'queued' ? 'Waiting for the renderer…' : `${Math.round(r.progress * 100)}%${r.eta ? ` · ${r.eta === 'encoding' ? 'encoding' : `about ${r.eta} left`}` : ''}`}</p>
        </div>
      )}
      {r?.status === 'done' && r.file && (
        <div className="mt-2 grid gap-2">
          <video src={`/api/runs/${run.id}/download?v=${r.id}`} controls className="w-full rounded-lg bg-stage" />
          <a href={`/api/runs/${run.id}/download?download=${encodeURIComponent(file)}`} className={buttonClass('primary', 'md', 'w-full')}><Download /> Download MP4</a>
          <Button variant="quiet" size="sm" onClick={start} disabled={run.busy}>Re-export the current version</Button>
        </div>
      )}
      {r?.status === 'failed' && <><p className="mt-2 rounded-lg bg-bad-soft px-3 py-2 text-xs text-bad line-clamp-4 font-mono">{r.error}</p><Button variant="secondary" className="mt-2 w-full" onClick={start}>Try again</Button></>}
    </Card>
  );
}

export default function Studio({ state, refresh }: { state: ProjectState; refresh: () => void }) {
  const { project } = state;
  const run = state.runs.find(r => r.id === project.winnerRunId)!;
  const events = useEvents(run.id, run.busy || run.status === 'running' || run.status === 'queued');
  const player = useRef<PlayerHandle>(null);
  const [msg, setMsg] = useState(''), [at, setAt] = useState<number | null>(null), [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'shots' | 'versions'>('shots');
  const shots = project.storyboard?.shots || [];
  const pins = events.filter(e => e.kind === 'user' && e.data?.at != null).map(e => ({ t: Number(e.data!.at), label: e.text }));
  const working = run.busy || run.status === 'queued' || run.status === 'running';

  const send = async () => {
    if (!msg.trim() || working) return;
    setSending(true);
    try { await api(`/api/runs/${run.id}/revise`, 'POST', { message: msg, at: at ?? undefined }); setMsg(''); setAt(null); refresh(); }
    catch (e) { toast.error((e as Error).message); } finally { setSending(false); }
  };
  const restore = async (v: number) => { try { await api(`/api/runs/${run.id}/restore`, 'POST', { version: v }); refresh(); } catch (e) { toast.error((e as Error).message); } };

  return (
    <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid gap-5 lg:grid-cols-[340px_1fr_300px] items-start">
      {/* chat */}
      <Card className="flex flex-col lg:h-[calc(100vh-7.5rem)] lg:sticky lg:top-20 order-2 lg:order-1">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <p className="text-sm font-semibold">Agent</p>
          {run.modelLabel && <Badge title="Only admins see this">{run.modelLabel}</Badge>}
          {working && <Badge tone="accent" className="ml-auto"><Spinner className="size-3 border-[1.5px]" /> Working</Badge>}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-60 flex flex-col gap-3">
          <Conversation events={events} />
          <Progress ws={run.ws} events={events} working={working} />
        </div>
        <div className="border-t border-line p-3">
          {at != null && (
            <Badge tone="accent" className="mb-2">
              <Comment size={12} /> at {at.toFixed(1)}s <button onClick={() => setAt(null)} aria-label="Remove time" className="-mr-0.5 rounded-full hover:text-ink"><X size={12} /></button>
            </Badge>
          )}
          <Textarea value={msg} onChange={e => setMsg(e.target.value)} rows={2} disabled={working}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={working ? 'The agent is working…' : at != null ? 'What should change at this moment?' : 'Ask for a change… or pin a comment on the timeline'} />
          <div className="mt-2 flex items-center gap-2">
            {working ? <Button variant="secondary" size="sm" className="ml-auto" onClick={() => api(`/api/runs/${run.id}/cancel`, 'POST').then(refresh)}>Stop</Button>
              : <Button size="sm" className="ml-auto" onClick={send} disabled={!msg.trim()} loading={sending}>Send</Button>}
          </div>
        </div>
      </Card>

      {/* preview */}
      <div className="min-w-0 order-1 lg:order-2">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{project.storyboard?.title}</h1>
          <Badge className="shrink-0 tabular-nums">v{run.version}</Badge>
        </div>
        {run.version > 0
          ? <Player ref={player} ws={run.ws} version={run.version} aspect={ASPECT[project.brief!.format]} shots={shots} pins={pins} onPin={t => setAt(+t.toFixed(1))} />
          : <div className="rounded-xl bg-stage aspect-video grid place-items-center text-white/60 text-sm">No film yet</div>}
        <p className="mt-3 text-xs text-muted"><kbd className="rounded border border-line bg-panel px-1 font-sans">Space</kbd> plays and pauses. Click the timeline to scrub; “Comment” pins your next message to that moment.</p>
      </div>

      {/* storyboard, versions, export */}
      <div className="grid gap-4 order-3 lg:sticky lg:top-20">
        <Export run={run} title={project.storyboard?.title || ''} refresh={refresh} />
        <Card className="p-4">
          <Segmented size="sm" value={tab} onPick={setTab} options={[{ v: 'shots', l: `Shots · ${shots.length}` }, { v: 'versions', l: `Versions · ${run.versions.length}` }]} />
          {tab === 'shots' ? (
            <ul className="mt-3 grid gap-0.5">
              {shots.map(s => (
                <li key={s.id}>
                  <button onClick={() => player.current?.seek(s.t0 + .05)} className="w-full text-left flex items-baseline gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-sunken text-sm">
                    <b className="w-4 shrink-0 font-semibold">{s.id}</b><span className="truncate">{s.name}</span>
                    <span className="ml-auto text-xs text-muted tabular-nums shrink-0">{fmtTime(s.t0)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-3 grid gap-0.5">
              {[...run.versions].reverse().map(v => (
                <li key={v} className="flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 text-sm">
                  <span className={`tabular-nums ${v === run.version ? 'font-semibold' : 'text-muted'}`}>v{v}</span>
                  {v === run.version && <Badge tone="accent">current</Badge>}
                  {v === 1 && <span className="text-xs text-muted">arena build</span>}
                  {v !== run.version && <Button variant="quiet" size="sm" icon={<Restore size={12} />} disabled={working} onClick={() => restore(v)} className="ml-auto">Restore</Button>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
