// The job worker: a long-running process next to `next dev` that claims jobs from SQLite and runs them.
//   build   an arena run: copy the engine, write BRIEF.md and STORYBOARD.md, let the agent build the film
//   revise  a revision of the winner, resuming the agent's session with the user's note
//   render  render.mjs --frames then --encode, reporting progress
// Up to AGENT_SLOTS agent jobs run at once (both arena runs build side by side) and one render.
import { spawn } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  claimJob, finishJob, failStaleJobs, getRun, getProject, updateRun, addEvent, updateRender, jobCancelled, type Job,
} from '../src/server/db';
import { createWorkspace, wsDir, snapshot, SCENE } from '../src/server/workspace';
import { runAgent, buildInstructions } from '../src/server/agent';
import { briefMarkdown, storyboardMarkdown } from '../src/server/plan';

const AGENT_SLOTS = +(process.env.AGENT_SLOTS || 4);
const RENDER_WORKERS = +(process.env.RENDER_WORKERS || 4);
let agents = 0, renders = 0;

async function build(job: Job) {
  const run = getRun(job.runId)!, project = getProject(run.projectId)!;
  updateRun(run.id, { status: 'running', startedAt: Date.now(), error: null });
  addEvent(run.id, 'status', 'Setting up a private copy of the engine');
  createWorkspace(run.id, {
    'BRIEF.md': briefMarkdown(project.brief!, project.similar),
    'STORYBOARD.md': storyboardMarkdown(project.storyboard!),
  });
  const r = await runAgent({ jobId: job.id, runId: run.id, prompt: buildInstructions(project.brief!), effort: (job.payload.effort as 'high') || 'high' });
  finishAgentJob(job, run.id, r);
}

async function revise(job: Job) {
  const run = getRun(job.runId)!, project = getProject(run.projectId)!;
  const note = String(job.payload.message || ''), at = job.payload.at as number | undefined;
  const text = `${at != null ? `At ${at.toFixed(1)}s: ` : ''}${note}`;
  updateRun(run.id, { status: 'running', error: null });
  // resume the session so the agent remembers the film; without one, start over with the full context
  const prompt = run.sessionId
    ? `The user reviewed the film and asks for this change:\n\n${text}\n\nMake it, check it with contact sheets or strips around the affected moment, and reply with one or two sentences on what you changed. Don't render the final video.`
    : `${buildInstructions(project.brief!)}\n\nThe film in src/scenes/${SCENE}.js already exists. The user asks for this change:\n\n${text}`;
  const r = await runAgent({ jobId: job.id, runId: run.id, prompt, resume: run.sessionId });
  finishAgentJob(job, run.id, r);
}

function finishAgentJob(job: Job, runId: string, r: { ok: boolean; cancelled: boolean }) {
  const run = getRun(runId)!;
  if (r.cancelled) { updateRun(runId, { status: 'cancelled', finishedAt: Date.now() }); finishJob(job.id, 'cancelled'); return; }
  if (!existsSync(resolve(wsDir(runId), 'src/scenes', `${SCENE}.js`))) {
    updateRun(runId, { status: 'failed', error: 'the agent finished without writing the film', finishedAt: Date.now() });
    finishJob(job.id, 'failed'); return;
  }
  const version = run.version + 1;
  snapshot(runId, version);
  updateRun(runId, { status: r.ok ? 'done' : 'failed', version, finishedAt: Date.now(), error: r.ok ? null : 'the agent stopped early; the film may be incomplete' });
  addEvent(runId, 'status', `Version ${version} ready`, { version });
  finishJob(job.id, r.ok ? 'done' : 'failed');
}

function node(cwd: string, args: string[], onLine: (l: string) => void, isCancelled: () => boolean): Promise<void> {
  return new Promise((res, rej) => {
    const p = spawn(process.execPath, ['render.mjs', ...args], { cwd, env: process.env });
    const tick = setInterval(() => { if (isCancelled()) p.kill('SIGTERM'); }, 1500);
    let tail = '';
    const feed = (d: Buffer) => { const s = d.toString(); tail = (tail + s).slice(-2000); s.split('\n').forEach(l => l.trim() && onLine(l.trim())); };
    p.stdout.on('data', feed); p.stderr.on('data', feed);
    p.on('close', code => { clearInterval(tick); if (isCancelled()) rej(new Error('cancelled')); else if (code === 0) res(); else rej(new Error(tail.split('\n').slice(-6).join('\n'))); });
  });
}

async function render(job: Job) {
  const renderId = String(job.payload.renderId), cwd = wsDir(job.runId), out = `out/${SCENE}_${renderId}.mp4`;
  updateRender(renderId, { status: 'running', progress: 0 });
  rmSync(resolve(cwd, 'out/frames', SCENE), { recursive: true, force: true });
  const cancelled = () => jobCancelled(job.id);
  try {
    await node(cwd, ['--frames', `--workers=${RENDER_WORKERS}`, `--scene=${SCENE}`], l => {
      const m = l.match(/frame (\d+)\/(\d+).*?eta ([\d.]+ min)?/) || l.match(/frame (\d+)\/(\d+)/);
      if (m) updateRender(renderId, { progress: Math.min(.95, (+m[1] / +m[2]) * .95), eta: m[3] || null });
    }, cancelled);
    updateRender(renderId, { progress: .96, eta: 'encoding' });
    await node(cwd, ['--encode', `--scene=${SCENE}`, `--out=${out}`], () => {}, cancelled);
    updateRender(renderId, { status: 'done', progress: 1, eta: null, file: out });
    finishJob(job.id, 'done');
  } catch (e) {
    const msg = (e as Error).message;
    updateRender(renderId, { status: msg === 'cancelled' ? 'cancelled' : 'failed', error: msg });
    finishJob(job.id, msg === 'cancelled' ? 'cancelled' : 'failed');
  }
}

async function runJob(job: Job, fn: (j: Job) => Promise<void>) {
  try { await fn(job); } catch (e) {
    const msg = (e as Error).stack || String(e);
    console.error(`[worker] ${job.kind} ${job.runId} failed:`, msg);
    if (job.kind !== 'render') {
      addEvent(job.runId, 'error', (e as Error).message);
      updateRun(job.runId, { status: 'failed', error: (e as Error).message, finishedAt: Date.now() });
    }
    finishJob(job.id, 'failed');
  }
}

function pump() {
  while (agents < AGENT_SLOTS) {
    const job = claimJob(['build', 'revise']);
    if (!job) break;
    agents++;
    console.log(`[worker] ${job.kind} ${job.runId}`);
    runJob(job, job.kind === 'build' ? build : revise).finally(() => { agents--; });
  }
  while (renders < 1) {
    const job = claimJob(['render']);
    if (!job) break;
    renders++;
    console.log(`[worker] render ${job.runId}`);
    runJob(job, render).finally(() => { renders--; });
  }
}

failStaleJobs();
if (!process.env.ANTHROPIC_API_KEY) console.warn('[worker] ANTHROPIC_API_KEY is not set: start with `npm run dev` (it runs through infisical)');
console.log(`[worker] ready: ${AGENT_SLOTS} agent slots, 1 render slot`);
setInterval(pump, 1000);
