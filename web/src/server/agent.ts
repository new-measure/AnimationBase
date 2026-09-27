// Runs a build or a revision inside a workspace with the Pi coding agent (@earendil-works/pi-coding-agent), for every
// model in the admin registry: Anthropic models with ANTHROPIC_API_KEY, OpenAI models with OPENAI_API_KEY. Every model
// gets the same system prompt, tools and settings, so the arena compares models, not harnesses. No turn, time or token
// limits. Every step is written to `events` (kept for debugging); the UI shows only a summary (src/lib/progress.ts).
import {
  createAgentSession, createExtensionRuntime, ModelRuntime, SessionManager, SettingsManager, type ResourceLoader,
  createReadToolDefinition, createWriteToolDefinition, createEditToolDefinition, createBashToolDefinition, type ToolDefinition,
} from '@earendil-works/pi-coding-agent';
import { mkdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { addEvent, getRun, updateRun, jobCancelled } from './db';
import { getModel } from './models';
import { wsDir, SCENE } from './workspace';
import { DATA_DIR } from './paths';
import { sandboxed, openSandbox, sandboxTools, syncBack, REMOTE } from './sandbox';
import { groupOf, type Brief } from '@/lib/types';

const SIZES = { landscape: '[1920, 1080]', square: '[1080, 1080]', portrait: '[1080, 1920]' };

// genre-specific reading and checks for films beyond launch films (docs/genres/README.md)
const BEYOND_NOTES: Record<string, string> = {
  explainer: 'There is no voice-over: the words on screen carry the explanation, so give every line its reading time.',
  tutorial: 'Rebuild the UI with the kit (src/lib/ui.js, src/lib/cursor.js) and frame each step with the camera (Cam.shot), as the tutorial recipe describes.',
  data_story: 'Build the charts with src/lib/chart.js (Chart.*, documented in the guide); src/scenes/data_story_demo.js is a worked data story to learn from, not to copy. Chart exactly the figures in STORYBOARD.md and BRIEF.md, compute every number on screen from them, and show the source at the end.',
};

export function buildInstructions(b: Brief) {
  const launch = groupOf(b.family) === 'launch';
  const what = launch ? 'a short product launch film' : `a short ${b.family.replace('_', ' ')} film (not a launch film)`;
  const refs = launch
    ? 'docs/motion_design_spec.md for the measured defaults, and refs/whatships/pacing.md and refs/whatships/craft.md for measured pacing and motion craft'
    : 'and refs/genres_ext/measured.md for this genre\'s measured pacing and structure. Where the genre\'s numbers differ from the launch-film defaults in the guide and docs/motion_design_spec.md (beat length, holds, cuts, end card), follow the genre';
  return `You are building ${what} with the animation engine in this directory. The whole directory is yours to edit.

Read first: ANIMATION_GUIDE.md (skip the Clawd character sections unless the film uses a character kit), BRIEF.md, STORYBOARD.md, the genre recipe named in BRIEF.md under docs/genres/, ${refs}. src/lib/ holds a motion-graphics kit (type, UI, cursor, charts, transitions, looks) documented in the guide: use it.${launch ? '' : ` ${BEYOND_NOTES[b.family] ?? ''}`}

Build:
- Write the film in src/scenes/${SCENE}.js and register it as "${SCENE}" in src/scenes/index.js, with project settings { duration: ${b.length}, size: ${SIZES[b.format]}, ... } plus whatever style, canvasBg, fonts and libs it needs.
- Follow STORYBOARD.md's shots, timings and on-screen words. Words on screen are allowed and expected here: the guide's "no text" rule applies to character cartoons only.
- Every frame must stay a pure function of t.

Check your work the way the guide describes: contact sheets, strips and crops with node render.mjs --scene=${SCENE} ... --out=out/check/<name>.jpg, then Read the image. Fix what looks wrong: legibility, overlaps, dead moments, timing, transitions.

Near the end, you may score the film once, as the guide's workflow describes: render a check copy with node render.mjs --scene=${SCENE} --clip --out=out/check/score.mp4, then python3 scripts/whatships_craft.py --local out/check/score.mp4 and python3 scripts/eval_scorecard.py score; fix what it flags or know why it differs.${launch ? '' : ' The scorecard compares with launch films: judge this film against the genre\'s numbers in refs/genres_ext/measured.md instead.'} Apart from that check copy, do not render the video (no --frames or --encode, and --clip only to out/check/): the app renders the final one. Don't touch files outside this directory. When the film matches the storyboard and looks polished, stop and reply with two or three sentences on what you built. This reply is shown to the person who ordered the film: describe the film in plain language (what happens, the look), with no file names, code or tool names.`;
}

// what the progress view needs from each tool call (raw steps stay in the database)
function toolSummary(name: string, args: Record<string, unknown>, cwd: string): { text: string; sheet?: string } {
  const rel = (p: unknown) => (typeof p === 'string' ? relative(cwd, resolve(cwd, p)) || p : '');
  switch (name) {
    case 'bash': return { text: String(args.command || '').slice(0, 160) };
    case 'read': {
      const p = rel(args.path);
      return /\.(jpe?g|png|webp)$/i.test(p) ? { text: `Looking at ${p}`, sheet: p } : { text: `Reading ${p}` };
    }
    case 'write': return { text: `Writing ${rel(args.path)}` };
    case 'edit': return { text: `Editing ${rel(args.path)}` };
    case 'grep': case 'find': return { text: `Searching ${String(args.pattern || '')}` };
    case 'ls': return { text: `Listing ${rel(args.path) || '.'}` };
    default: return { text: name };
  }
}

// Pi's own config and session files live under data/pi, never in ~/.pi, and nothing is discovered from disk: no
// extensions, skills, prompt templates or AGENTS.md files, only what we pass in.
const PI_DIR = resolve(DATA_DIR, 'pi');
const SYSTEM = `You are an expert motion designer and creative coder. You work in the current directory, which holds an animation engine, using the tools you have: read files (including images, so you can look at the contact sheets you render), write and edit files, and run shell commands. Work carefully and completely, check your own work by looking at renders, and keep going until the film is finished and polished. Paths are relative to the current directory.`;
// said to every model when its tools run in a Modal sandbox
const SANDBOX_NOTE = `This machine has no GPU. Scenes in the hand-painted style (WebGL, p5.brush) need --soft-gl on node render.mjs commands; clean-style scenes must not use it (it makes them far slower). It has no internet access (except Google Fonts, which films load their fonts from), so everything you need is already in this directory.`;
const resources = (sandboxed: boolean): ResourceLoader => ({
  getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
  getSkills: () => ({ skills: [], diagnostics: [] }),
  getPrompts: () => ({ prompts: [], diagnostics: [] }),
  getThemes: () => ({ themes: [], diagnostics: [] }),
  getAgentsFiles: () => ({ agentsFiles: [] }),
  getSystemPrompt: () => (sandboxed ? `${SYSTEM}\n\n${SANDBOX_NOTE}` : SYSTEM),
  getSystemPromptSource: () => undefined,
  getAppendSystemPrompt: () => [],
  getAppendSystemPromptSources: () => [],
  extendResources: () => {},
  reload: async () => {},
});

let runtime: Promise<ModelRuntime> | null = null;
function modelRuntime(): Promise<ModelRuntime> {
  return (runtime ||= (async () => {
    mkdirSync(PI_DIR, { recursive: true });
    const rt = await ModelRuntime.create({ authPath: resolve(PI_DIR, 'auth.json'), modelsPath: resolve(PI_DIR, 'models.json') });
    if (process.env.ANTHROPIC_API_KEY) await rt.setRuntimeApiKey('anthropic', process.env.ANTHROPIC_API_KEY);
    if (process.env.OPENAI_API_KEY) await rt.setRuntimeApiKey('openai', process.env.OPENAI_API_KEY);
    return rt;
  })());
}

type Thinking = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
// resume: the Pi session file of an earlier pass, so a revision continues with the agent's memory of the film.
// model: a registry id that overrides the run's own model (admin setting for studio revisions).
export async function runAgent(opts: { jobId: number; runId: string; prompt: string; resume?: string | null; model?: string }) {
  const run = await getRun(opts.runId);
  if (!run) throw new Error('run not found');
  const entry = await getModel(opts.model || run.model);
  if (!entry) throw new Error(`model ${opts.model || run.model} is not in the registry`);
  const rt = await modelRuntime();
  const model = rt.getModel(entry.provider, entry.modelId);
  if (!model) throw new Error(`Pi doesn't know ${entry.provider}/${entry.modelId}`);
  const thinking = ((opts.model ? entry.thinking : run.thinking) || 'high') as Thinking;

  const local = wsDir(run.id), sessionDir = resolve(PI_DIR, 'sessions', run.id);
  mkdirSync(sessionDir, { recursive: true });
  // In sandbox mode the four core tools run in a Modal sandbox holding a copy of the workspace at /workspace (the
  // agent searches with grep and ls through bash there), and the session's cwd is that path, so the model only ever
  // sees sandbox paths. Locally, Pi's built-in tools run in the workspace directory itself.
  const sb = sandboxed() ? await openSandbox(run.id, 'agent') : null;
  const cwd = sb ? REMOTE : local;
  const sessionManager = opts.resume ? SessionManager.open(opts.resume, sessionDir, cwd) : SessionManager.create(cwd, sessionDir);
  const toolSetup = sb ? (() => {
    const ops = sandboxTools(sb, run.id);
    return {
      noTools: 'builtin' as const,
      customTools: [
        createReadToolDefinition(REMOTE, { operations: ops.read }), createWriteToolDefinition(REMOTE, { operations: ops.write }),
        createEditToolDefinition(REMOTE, { operations: ops.edit }), createBashToolDefinition(REMOTE, { operations: ops.bash }),
      ] as unknown as ToolDefinition[],   // each definition is generic over its own schema
    };
  })() : { tools: ['read', 'bash', 'edit', 'write', 'grep', 'find', 'ls'] };
  const { session } = await createAgentSession({
    cwd, agentDir: PI_DIR, model, thinkingLevel: thinking, modelRuntime: rt, resourceLoader: resources(!!sb),
    ...toolSetup, sessionManager,
    settingsManager: SettingsManager.inMemory({ enableInstallTelemetry: false, compaction: { enabled: true }, retry: { enabled: true, maxRetries: 3 } }),
  });
  if (session.sessionFile) await updateRun(run.id, { sessionId: session.sessionFile });

  let cost = run.costUsd, cancelled = false, failure = '';
  const writes: Promise<unknown>[] = [];
  const unsubscribe = session.subscribe(ev => {
    if (ev.type === 'tool_execution_start') {
      const s = toolSummary(ev.toolName, (ev.args || {}) as Record<string, unknown>, cwd);
      writes.push(addEvent(run.id, s.sheet ? 'sheet' : 'tool', s.text, s.sheet ? { path: s.sheet } : null));
    } else if (ev.type === 'message_end' && ev.message.role === 'assistant') {
      const m = ev.message as { content?: { type: string; text?: string }[]; usage?: { cost?: { total?: number } }; stopReason?: string; errorMessage?: string };
      if (m.stopReason === 'error') { failure = m.errorMessage || 'the model returned an error'; writes.push(addEvent(run.id, 'error', failure)); }
      const text = (m.content || []).filter(c => c.type === 'text' && c.text?.trim()).map(c => c.text!.trim()).join('\n\n');
      if (text) writes.push(addEvent(run.id, 'say', text));
      cost += m.usage?.cost?.total || 0;
      writes.push(updateRun(run.id, { costUsd: cost }));   // live spend on the admin page
    }
  });
  const poll = setInterval(async () => { if (!cancelled && await jobCancelled(opts.jobId)) { cancelled = true; await session.abort(); } }, 1500);
  let ok = false, summary = '';
  const started = Date.now();
  try {
    await session.prompt(opts.prompt);
    summary = session.getLastAssistantText() || '';
    ok = !cancelled;
  } catch (e) {
    if (!cancelled) throw e;
  } finally {
    clearInterval(poll);
    unsubscribe();
    await Promise.all(writes);
    session.dispose();
    await updateRun(run.id, { costUsd: cost });
    // the film comes back to the local mirror (previews, versions); then the sandbox goes away
    if (sb) {
      try { await syncBack(sb, run.id); } catch (e) { failure ||= `could not copy the film out of the sandbox: ${(e as Error).message}`; }
      await sb.terminate().catch(() => {});
    }
  }
  if (cancelled) { await addEvent(run.id, 'status', 'Cancelled'); return { ok: false, cancelled: true, cost, summary }; }
  ok = ok && !failure;
  await addEvent(run.id, 'result', ok ? 'Finished' : `Stopped: ${failure}`, { costUsd: cost - run.costUsd, ms: Date.now() - started, model: entry.id, summary });
  return { ok, cancelled: false, cost, summary };
}
