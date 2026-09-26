'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import type { ProjectState } from '@/server/state';
import type { RunEvent } from './types';

// The project page polls one endpoint: fast while agents or renders are working, slower when idle.
export function useProject(id: string, initial: ProjectState) {
  const [state, setState] = useState(initial);
  const refresh = useCallback(async () => { try { setState(await api<ProjectState>(`/api/projects/${id}`)); } catch { /* keep the last good state */ } }, [id]);
  const active = state.runs.some(r => r.busy || r.status === 'running' || r.status === 'queued' || r.render?.status === 'running' || r.render?.status === 'queued');
  useEffect(() => {
    const h = setInterval(refresh, active ? 1500 : 5000);
    return () => clearInterval(h);
  }, [refresh, active]);
  return { state, setState, refresh };
}

// A run's event feed, fetched incrementally while `live`. Mount one per run (key the component by run id).
export function useEvents(runId: string | null, live: boolean) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const last = useRef(0);
  useEffect(() => {
    if (!runId) return;
    let stop = false;
    const tick = async () => {
      try {
        const more = await api<RunEvent[]>(`/api/runs/${runId}/events?after=${last.current}`);
        if (!stop && more.length) { last.current = more[more.length - 1].id; setEvents(e => [...e, ...more]); }
      } catch { /* retry next tick */ }
    };
    tick();
    const h = live ? setInterval(tick, 1500) : null;
    return () => { stop = true; if (h) clearInterval(h); };
  }, [runId, live]);
  return events;
}
