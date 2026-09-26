// Runs Claude (through the Agent SDK) inside a workspace: the first build of a film from its storyboard, or a revision
// of the winner. Every step is written to `events`, so the UI can show what the agent is doing and each contact sheet
// it looks at.
import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { relative } from 'node:path';
import { addEvent, getRun, updateRun, jobCancelled } from './db';
import { wsDir, SCENE } from './workspace';
import type { Brief } from '@/lib/types';

const SIZES = { landscape: '[1920, 1080]', square: '[1080, 1080]', portrait: '[1080, 1920]' };

export function buildInstructions(b: Brief) {
  return `You are building a short product launch film with the animation engine in this directory. The whole directory is yours to edit.

Read first: ANIMATION_GUIDE.md (skip the Clawd character sections unless the film uses a character kit), BRIEF.md, STORYBOARD.md, the genre recipe named in BRIEF.md under docs/genres/, and refs/pacing.md and refs/craft.md for measured pacing and motion craft. src/lib/ holds a motion-graphics kit (type, UI, cursor, transitions, looks) documented in the guide: use it.

Build:
- Write the film in src/scenes/${SCENE}.js and register it as "${SCENE}" in src/scenes/index.js, with project settings { duration: ${b.length}, size: ${SIZES[b.format]}, ... } plus whatever style, canvasBg, fonts and libs it needs.
- Follow STORYBOARD.md's shots, timings and on-screen words. Words on screen are allowed and expected here: the guide's "no text" rule applies to character cartoons only.
- Every frame must stay a pure function of t.

Check your work the way the guide describes: contact sheets, strips and crops with node render.mjs --scene=${SCENE} ... --out=out/check/<name>.jpg, then Read the image. Fix what looks wrong: legibility, overlaps, dead moments, timing, transitions.

Do not render the final video (no --clip, --frames or --encode): the app does that. Don't touch files outside this directory. When the film matches the storyboard and looks polished, stop and reply with two or three sentences on what you built.`;
}

function toolSummary(name: string, input: Record<string, unknown>, cwd: string): { text: string; sheet?: string } {
  const rel = (p: unknown) => (typeof p === 'string' ? relative(cwd, p) || p : '');
  switch (name) {
    case 'Bash': return { text: String(input.description || input.command || '').slice(0, 160) };
    case 'Read': {
      const p = rel(input.file_path);
      return /\.(jpe?g|png|webp)$/i.test(p) ? { text: `Looking at ${p}`, sheet: p } : { text: `Reading ${p}` };
    }
    case 'Write': return { text: `Writing ${rel(input.file_path)}` };
    case 'Edit': return { text: `Editing ${rel(input.file_path)}` };
    case 'Glob': case 'Grep': return { text: `Searching ${String(input.pattern || '')}` };
    case 'TodoWrite': return { text: 'Updating its plan' };
    default: return { text: name };
  }
}

export async function runAgent(opts: { jobId: number; runId: string; prompt: string; resume?: string | null; effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' }) {
  const run = getRun(opts.runId);
  if (!run) throw new Error('run not found');
  const cwd = wsDir(run.id), abort = new AbortController();
  const poll = setInterval(() => { if (jobCancelled(opts.jobId)) abort.abort(); }, 1500);
  let cost = run.costUsd, ok = false, summary = '';
  try {
    const q = query({
      prompt: opts.prompt,
      options: {
        cwd, model: run.model, abortController: abort, resume: opts.resume || undefined,
        permissionMode: 'bypassPermissions', allowDangerouslySkipPermissions: true,
        disallowedTools: ['WebFetch', 'WebSearch'],
        settingSources: [], effort: opts.effort || 'high', maxTurns: 150,
        env: { ...process.env } as Record<string, string>,
      },
    });
    for await (const m of q as AsyncIterable<SDKMessage>) {
      if (m.type === 'system' && 'session_id' in m && m.subtype === 'init') updateRun(run.id, { sessionId: m.session_id });
      else if (m.type === 'assistant' && !m.parent_tool_use_id) {
        for (const block of m.message.content) {
          if (block.type === 'text' && block.text.trim()) addEvent(run.id, 'say', block.text.trim());
          else if (block.type === 'tool_use') {
            const s = toolSummary(block.name, block.input as Record<string, unknown>, cwd);
            addEvent(run.id, s.sheet ? 'sheet' : 'tool', s.text, s.sheet ? { path: s.sheet } : null);
          }
        }
      } else if (m.type === 'result') {
        cost += m.total_cost_usd || 0;
        ok = m.subtype === 'success' && !m.is_error;
        summary = m.subtype === 'success' ? m.result : `stopped: ${m.subtype}`;
        addEvent(run.id, 'result', ok ? 'Finished' : summary, { turns: m.num_turns, costUsd: m.total_cost_usd, ms: m.duration_ms });
      }
    }
  } catch (e) {
    if (abort.signal.aborted) { addEvent(run.id, 'status', 'Cancelled'); return { ok: false, cancelled: true, cost, summary }; }
    throw e;
  } finally {
    clearInterval(poll);
    updateRun(run.id, { costUsd: cost });
  }
  return { ok, cancelled: false, cost, summary };
}
