'use client';
// What the agent is doing, as a readable feed: its notes, the steps it takes, and every contact sheet it looks at.
import { useEffect, useRef, useState } from 'react';
import type { RunEvent } from '@/lib/types';

const ICON: Record<string, string> = { tool: '›', status: '•', result: '✓', error: '!', say: '', sheet: '', user: '' };

export default function AgentFeed({ runId, events, compact }: { runId: string; events: RunEvent[]; compact?: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [events.length]);
  const shown = compact ? events.filter(e => e.kind !== 'tool').slice(-12) : events;

  return (
    <div className="flex flex-col gap-2 text-sm">
      {shown.length === 0 && <p className="text-muted text-xs">Waiting for the agent to start…</p>}
      {shown.map(e => {
        if (e.kind === 'user') return (
          <div key={e.id} className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-accent text-accent-ink px-3 py-2">
            {e.data?.at != null && <span className="block text-[11px] opacity-80">at {Number(e.data.at).toFixed(1)}s</span>}
            {e.text}
          </div>
        );
        if (e.kind === 'say') return <p key={e.id} className="whitespace-pre-wrap leading-relaxed">{e.text}</p>;
        if (e.kind === 'sheet') {
          const src = `/ws/${runId}/${String(e.data?.path)}?e=${e.id}`;
          return (
            <button key={e.id} onClick={() => setZoom(src)} className="text-left">
              <span className="text-xs text-muted">Checking its work · {String(e.data?.path).split('/').pop()}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="contact sheet the agent reviewed" className="mt-1 w-full rounded-lg ring-1 ring-line hover:ring-accent" loading="lazy" />
            </button>
          );
        }
        return (
          <p key={e.id} className={`text-xs flex gap-2 ${e.kind === 'error' ? 'text-bad' : e.kind === 'result' ? 'text-good' : 'text-muted'}`}>
            <span className="w-3 shrink-0 text-center">{ICON[e.kind]}</span><span className="min-w-0 break-words">{e.text}</span>
          </p>
        );
      })}
      <div ref={end} />
      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="contact sheet, enlarged" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
