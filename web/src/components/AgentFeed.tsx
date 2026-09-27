'use client';
// What people see of the agent's work: a progress bar through its phases, its latest contact sheet, and the
// conversation (your requests, its closing replies). Raw steps stay in the database.
import { useEffect, useRef, useState } from 'react';
import type { RunEvent } from '@/lib/types';
import { PHASES, progress, conversation } from '@/lib/progress';
import { Spinner } from './ui';

export function Progress({ ws, events, working }: { ws: string; events: RunEvent[]; working: boolean }) {
  const p = progress(events);
  const [zoom, setZoom] = useState(false);
  if (!working) return null;
  const src = p.lastSheet ? `/ws/${ws}/${String(p.lastSheet.data?.path)}?e=${p.lastSheet.id}` : null;
  return (
    <div className="rounded-xl bg-sunken p-3">
      <div className="flex items-center gap-2 text-sm">
        <Spinner className="text-accent" />
        <span className="font-medium">{PHASES[p.index].label}…</span>
        {p.checks > 0 && <span className="ml-auto text-xs text-muted tabular-nums">checked {p.checks}×</span>}
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1">
        {PHASES.map((ph, i) => <div key={ph.key} title={ph.label} className={`h-1 rounded-full ${i <= p.index ? 'bg-accent' : 'bg-line'}`} />)}
      </div>
      {src && (
        <button onClick={() => setZoom(true)} className="mt-3 block w-full text-left">
          <span className="text-xs text-muted">Latest check</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="the latest contact sheet the agent checked" className="mt-1 w-full rounded-lg ring-1 ring-line hover:ring-accent" />
        </button>
      )}
      {zoom && src && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="contact sheet, enlarged" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

export function Conversation({ events }: { events: RunEvent[] }) {
  const items = conversation(events);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [items.length]);
  return (
    <div className="flex flex-col gap-3 text-sm">
      {items.length === 0 && <p className="text-muted text-xs">Ask for any change: timing, wording, colours, a new shot. Pin a comment on the timeline to point at a moment.</p>}
      {items.map(it => {
        if (it.who === 'user') return (
          <div key={it.id} className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-accent text-accent-ink px-3 py-2">
            {it.at != null && <span className="block text-xs opacity-80">at {it.at.toFixed(1)}s</span>}
            {it.text}
          </div>
        );
        if (it.who === 'agent') return <p key={it.id} className="max-w-[92%] rounded-2xl rounded-bl-sm bg-sunken px-3 py-2 whitespace-pre-wrap leading-relaxed">{it.text}</p>;
        return <p key={it.id} className={`text-center text-xs ${it.who === 'error' ? 'text-bad' : 'text-faint'}`}>{it.text}</p>;
      })}
      <div ref={end} />
    </div>
  );
}
