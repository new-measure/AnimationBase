'use client';
// The live preview: the run's studio.html in a sandboxed iframe (no same-origin rights), driven over postMessage.
// Nothing is rendered to video to preview: every frame is drawn in the browser on demand, so scrubbing is instant.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Shot } from '@/lib/types';
import { fmtTime } from '@/lib/api';
import { Comment, Pause, Play } from './icons';
import { Spinner } from './ui';

export interface PlayerHandle { seek: (t: number) => void; play: () => void; pause: () => void; time: () => number }
interface Props {
  ws: string; version: number; aspect: number;                // ws: the run's signed preview prefix              // width / height, until the page reports its own
  shots?: Shot[]; pins?: { t: number; label: string }[];
  onTime?: (t: number) => void; onPin?: (t: number) => void; compact?: boolean;
}

const Player = forwardRef<PlayerHandle, Props>(function Player({ ws, version, aspect, shots = [], pins = [], onTime, onPin, compact }, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false), [dur, setDur] = useState(0), [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false), [error, setError] = useState(''), [ratio, setRatio] = useState(aspect);
  const tRef = useRef(0), onTimeRef = useRef(onTime);
  useEffect(() => { onTimeRef.current = onTime; });
  const send = (m: object) => frame.current?.contentWindow?.postMessage(m, '*');

  useImperativeHandle(ref, () => ({
    seek: x => send({ type: 'seek', t: x }), play: () => { send({ type: 'play' }); setPlaying(true); },
    pause: () => { send({ type: 'pause' }); setPlaying(false); }, time: () => tRef.current,
  }));

  useEffect(() => {
    setReady(false); setError(''); setPlaying(false);
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || !e.data?.__anim) return;
      const m = e.data;
      if (m.type === 'ready') { setReady(true); setDur(m.dur); setRatio(m.w / m.h); }
      else if (m.type === 'time') { tRef.current = m.t; setT(m.t); onTimeRef.current?.(m.t); }
      else if (m.type === 'paused') setPlaying(false);
      else if (m.type === 'error') setError(m.message);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [ws, version]);

  const toggle = () => { if (playing) { send({ type: 'pause' }); setPlaying(false); } else { send({ type: 'play' }); setPlaying(true); } };
  const scrubTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    send({ type: 'seek', t: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur }); setPlaying(false);
  };
  const current = shots.find(s => t >= s.t0 && t < s.t1) || shots[shots.length - 1];

  return (
    <div className="flex flex-col gap-2 min-w-0" onKeyDown={e => { if (e.key === ' ') { e.preventDefault(); toggle(); } }}>
      <div className="relative w-full rounded-xl overflow-hidden bg-stage ring-1 ring-line" style={{ aspectRatio: ratio, maxHeight: compact ? '46vh' : '62vh' }}>
        <iframe
          key={`${ws}-${version}`} ref={frame} title="preview" sandbox="allow-scripts" allow="accelerometer; gyroscope"
          src={`/ws/${ws}/studio.html?render&scene=film&v=${version}`}
          className="absolute inset-0 w-full h-full border-0"
        />
        {!ready && !error && <div className="absolute inset-0 grid place-items-center text-sm text-white/60"><span className="inline-flex items-center gap-2"><Spinner /> Loading preview…</span></div>}
        {error && <div className="absolute inset-x-0 bottom-0 bg-bad/90 text-white text-xs px-3 py-2 font-mono line-clamp-3">Preview error: {error}</div>}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={toggle} disabled={!ready} aria-label={playing ? 'Pause' : 'Play'}
          className="size-9 shrink-0 rounded-full bg-ink text-bg grid place-items-center shadow-card transition disabled:opacity-30 hover:scale-105">
          {playing ? <Pause size={14} /> : <Play size={14} className="translate-x-px" />}
        </button>
        <span className="text-xs tabular-nums text-muted w-24 shrink-0">{fmtTime(t)} / {fmtTime(dur)}</span>
        {!compact && current && <span className="min-w-0 text-xs text-muted truncate"><b className="font-semibold text-ink">Shot {current.id}</b> · {current.name}</span>}
        {onPin && ready && (
          <button onClick={() => onPin(t)} className="ml-auto shrink-0 inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 text-xs font-medium shadow-card transition hover:border-accent/50 hover:text-accent">
            <Comment size={14} /> Comment at <span className="tabular-nums">{t.toFixed(1)}s</span>
          </button>
        )}
      </div>

      {/* timeline: shot segments, playhead, comment pins; click or drag to scrub */}
      <div className="relative select-none">
        <div className="relative h-8 rounded-lg bg-sunken cursor-pointer overflow-hidden flex"
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); scrubTo(e); }}
          onPointerMove={e => { if (e.buttons) scrubTo(e); }}>
          {dur > 0 && shots.map((s, i) => (
            <div key={s.id} className={`h-full border-r border-bg/80 px-1.5 flex items-center text-xs overflow-hidden whitespace-nowrap ${i % 2 ? 'bg-accent/10' : 'bg-accent/5'} ${current?.id === s.id ? 'text-ink font-medium' : 'text-muted'}`}
              style={{ width: `${((s.t1 - s.t0) / dur) * 100}%` }}>{compact ? s.id : `${s.id} · ${s.name}`}</div>
          ))}
          {dur > 0 && <div className="absolute top-0 bottom-0 w-0.5 bg-accent pointer-events-none" style={{ left: `${(t / dur) * 100}%` }} />}
        </div>
        {dur > 0 && pins.map((p, i) => (
          <button key={i} title={p.label} aria-label={`Comment at ${p.t.toFixed(1)}s: ${p.label}`} onClick={() => send({ type: 'seek', t: p.t })}
            className="absolute -top-1.5 -translate-x-1/2 size-3 rounded-full bg-accent ring-2 ring-panel transition hover:scale-125" style={{ left: `${(p.t / dur) * 100}%` }} />
        ))}
      </div>
    </div>
  );
});
export default Player;
