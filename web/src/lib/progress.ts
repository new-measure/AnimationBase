// Turns the agent's raw event stream into what a person wants to see: which phase it's in, how many times it has
// checked its work, its latest contact sheet, and its replies. The raw steps (files read, shell commands) stay in the
// database for debugging and never reach the screen.
import type { RunEvent } from './types';

export const PHASES = [
  { key: 'study', label: 'Reading the brief' },
  { key: 'build', label: 'Building the film' },
  { key: 'check', label: 'Checking its work' },
  { key: 'polish', label: 'Polishing' },
] as const;
export type Phase = (typeof PHASES)[number]['key'];

const isCheck = (e: RunEvent) => e.kind === 'sheet' || (e.kind === 'tool' && /render|contact sheet|strip|crop|still|score|craft/i.test(e.text));
const isBuild = (e: RunEvent) => e.kind === 'tool' && /^(Writing|Editing) /.test(e.text);

export function progress(events: RunEvent[]) {
  let phase: Phase = 'study', checked = false;
  for (const e of events) {
    if (e.kind === 'user') { phase = 'study'; checked = false; }       // a revision starts a new pass
    else if (isCheck(e)) { phase = 'check'; checked = true; }
    else if (isBuild(e)) phase = checked ? 'polish' : 'build';
  }
  const sheets = events.filter(e => e.kind === 'sheet');
  return { phase, index: PHASES.findIndex(p => p.key === phase), checks: sheets.length, lastSheet: sheets[sheets.length - 1] || null };
}

// The conversation: the user's requests and, for each finished pass, the agent's closing reply (its last message
// before the result), plus version and error notes.
export type ChatItem = { id: number; who: 'user' | 'agent' | 'note' | 'error'; text: string; at?: number };
export function conversation(events: RunEvent[]): ChatItem[] {
  const out: ChatItem[] = [];
  let lastSay: RunEvent | null = null;
  for (const e of events) {
    if (e.kind === 'say') lastSay = e;
    else if (e.kind === 'user') { out.push({ id: e.id, who: 'user', text: e.text, at: e.data?.at != null ? Number(e.data.at) : undefined }); lastSay = null; }
    else if (e.kind === 'result') {
      const text = e.data?.summary ? String(e.data.summary) : lastSay?.text;
      if (text) out.push({ id: e.id, who: 'agent', text });
      lastSay = null;
    }
    else if (e.kind === 'status' && /^Version \d+ ready|^Restored|^Cancelled/.test(e.text)) out.push({ id: e.id, who: 'note', text: e.text });
    else if (e.kind === 'error') out.push({ id: e.id, who: 'error', text: e.text });
  }
  return out;
}
