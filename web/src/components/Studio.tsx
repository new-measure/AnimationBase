'use client';
// Step 4: the studio, for the film the user kept. Chat or pin a comment to a moment to ask for changes; every finished
// change is a version you can go back to; export renders the MP4.
import { useRef, useState } from 'react';
import type { ProjectState, RunView } from '@/server/state';
import { useEvents } from '@/lib/hooks';
import { modelLabel } from '@/lib/models';
import { api, fmtTime } from '@/lib/api';
import Player, { type PlayerHandle } from './Player';
import AgentFeed from './AgentFeed';
import { Button, Card, Spinner } from './ui';

const ASPECT = { landscape: 16 / 9, square: 1, portrait: 9 / 16 };

function Export({ run, title, refresh }: { run: RunView; title: string; refresh: () => void }) {
  const r = run.render;
  const [err, setErr] = useState('');
  const start = async () => { setErr(''); try { await api(`/api/runs/${run.id}/render`, 'POST'); refresh(); } catch (e) { setErr((e as Error).message); } };
  const file = (title || 'film').toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-v${run.version}.mp4`;
  return (
    <Card className="p-4">
      <p className="text-sm font-medium">Export</p>
      {(!r || r.status === 'cancelled') && <><p className="mt-1 text-xs text-muted">Renders every frame to an MP4. Takes a few minutes.</p>
        <Button className="mt-3 w-full" onClick={start} disabled={run.busy}>Export MP4</Button></>}
      {r && (r.status === 'queued' || r.status === 'running') && (
        <div className="mt-2">
          <div className="h-2 rounded-full bg-sunken overflow-hidden"><div className="h-full bg-accent transition-all" style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>
          <p className="mt-1.5 text-xs text-muted tabular-nums">{r.status === 'queued' ? 'Waiting for the renderer…' : `${Math.round(r.progress * 100)}%${r.eta ? ` · ${r.eta === 'encoding' ? 'encoding' : `about ${r.eta} left`}` : ''}`}</p>
        </div>
      )}
      {r?.status === 'done' && r.file && (
        <div className="mt-2 grid gap-2">
          <video src={`/ws/${run.id}/${r.file}`} controls className="w-full rounded-lg bg-stage" />
          <a href={`/ws/${run.id}/${r.file}?download=${file}`} className="rounded-xl bg-accent text-accent-ink text-center px-4 py-2 text-sm font-medium hover:opacity-90">Download MP4</a>
          <button onClick={start} disabled={run.busy} className="text-xs text-muted hover:text-accent disabled:opacity-40">Re-export the current version</button>
        </div>
      )}
      {r?.status === 'failed' && <><p className="mt-1 text-xs text-bad line-clamp-4 font-mono">{r.error}</p><Button variant="ghost" className="mt-2 w-full" onClick={start}>Try again</Button></>}
      {err && <p className="mt-2 text-xs text-bad">{err}</p>}
    </Card>
  );
}

export default function Studio({ state, refresh }: { state: ProjectState; refresh: () => void }) {
  const { project } = state;
  const run = state.runs.find(r => r.id === project.winnerRunId)!;
  const events = useEvents(run.id, run.busy || run.status === 'running' || run.status === 'queued');
  const player = useRef<PlayerHandle>(null);
  const [msg, setMsg] = useState(''), [at, setAt] = useState<number | null>(null), [err, setErr] = useState(''), [sending, setSending] = useState(false);
  const shots = project.storyboard?.shots || [];
  const pins = events.filter(e => e.kind === 'user' && e.data?.at != null).map(e => ({ t: Number(e.data!.at), label: e.text }));
  const working = run.busy || run.status === 'queued' || run.status === 'running';

  const send = async () => {
    if (!msg.trim() || working) return;
    setSending(true); setErr('');
    try { await api(`/api/runs/${run.id}/revise`, 'POST', { message: msg, at: at ?? undefined }); setMsg(''); setAt(null); refresh(); }
    catch (e) { setErr((e as Error).message); } finally { setSending(false); }
  };
  const restore = async (v: number) => { try { await api(`/api/runs/${run.id}/restore`, 'POST', { version: v }); refresh(); } catch (e) { setErr((e as Error).message); } };

  return (
    <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5 grid gap-5 lg:grid-cols-[340px_1fr_300px] items-start">
      {/* chat */}
      <Card className="flex flex-col lg:h-[calc(100vh-7.5rem)] lg:sticky lg:top-20 order-2 lg:order-1">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <p className="text-sm font-medium">Agent</p>
          {run.model && <span className="text-xs text-muted">{modelLabel(run.model)}</span>}
          {working && <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-accent"><Spinner /> Working</span>}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-60"><AgentFeed runId={run.id} events={events} /></div>
        <div className="border-t border-line p-3">
          {at != null && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft text-accent px-2.5 py-1 text-xs">
              💬 at {at.toFixed(1)}s <button onClick={() => setAt(null)} aria-label="Remove time" className="hover:text-ink">×</button>
            </div>
          )}
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={2} disabled={working}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={working ? 'The agent is working…' : at != null ? 'What should change at this moment?' : 'Ask for a change… or pin a comment on the timeline'}
            className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60" />
          <div className="mt-2 flex items-center gap-2">
            {err && <p className="text-xs text-bad mr-auto">{err}</p>}
            {working ? <Button variant="ghost" className="ml-auto" onClick={() => api(`/api/runs/${run.id}/cancel`, 'POST').then(refresh)}>Stop</Button>
              : <Button className="ml-auto" onClick={send} disabled={!msg.trim() || sending}>Send</Button>}
          </div>
        </div>
      </Card>

      {/* preview */}
      <div className="min-w-0 order-1 lg:order-2">
        <div className="flex items-baseline gap-3 mb-3">
          <h1 className="text-xl font-semibold tracking-tight truncate">{project.storyboard?.title}</h1>
          <span className="text-sm text-muted shrink-0">version {run.version}</span>
        </div>
        {run.version > 0
          ? <Player ref={player} runId={run.id} version={run.version} aspect={ASPECT[project.brief!.format]} shots={shots} pins={pins} onPin={t => setAt(+t.toFixed(1))} />
          : <div className="rounded-xl bg-stage aspect-video grid place-items-center text-white/60 text-sm">No film yet</div>}
        <p className="mt-3 text-xs text-faint">Space plays and pauses. Click the timeline to scrub; “Comment at” pins your next message to that moment.</p>
      </div>

      {/* storyboard, versions, export */}
      <div className="grid gap-4 order-3 lg:sticky lg:top-20">
        <Export run={run} title={project.storyboard?.title || ''} refresh={refresh} />
        <Card className="p-4">
          <p className="text-sm font-medium">Storyboard</p>
          <ul className="mt-2 grid gap-0.5">
            {shots.map(s => (
              <li key={s.id}>
                <button onClick={() => player.current?.seek(s.t0 + .05)} className="w-full text-left flex items-baseline gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-sunken text-sm">
                  <b className="w-4 shrink-0">{s.id}</b><span className="truncate">{s.name}</span>
                  <span className="ml-auto text-xs text-muted tabular-nums shrink-0">{fmtTime(s.t0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium">Versions</p>
          <ul className="mt-2 grid gap-1">
            {[...run.versions].reverse().map(v => (
              <li key={v} className="flex items-center text-sm">
                <span className={v === run.version ? 'font-medium' : 'text-muted'}>v{v}{v === run.version ? ' · current' : ''}{v === 1 ? ' · arena build' : ''}</span>
                {v !== run.version && <button disabled={working} onClick={() => restore(v)} className="ml-auto text-xs text-muted hover:text-accent disabled:opacity-40">Restore</button>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
