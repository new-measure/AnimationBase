// The job worker: a long-running process next to `next dev` that claims jobs from Postgres (Neon) and runs them.
//   build   an arena run: copy the engine, write BRIEF.md and STORYBOARD.md, let the agent build the film
//   revise  a revision of the winner, resuming the agent's session with the user's note
//   render  render.mjs --frames then --encode, reporting progress
// Up to AGENT_SLOTS agent jobs run at once (both arena runs build side by side) and one render.
import { spawn } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  claimJob, claimJobById, finishJob, failStaleJobs, failSilentJobs, queuedJobIds, heartbeat, getRun, getProject, updateRun, addEvent,
  updateRender, jobCancelled, type Job,
} from '../src/server/db';
import { dispatch } from '../src/server/dispatch';
import { createWorkspace, wsDir, SCENE } from '../src/server/workspace';
import { publishEngine } from '../src/server/engine';
import { recordVersion, ensureWorkspace } from '../src/server/films';
import { runAgent, buildInstructions } from '../src/server/agent';
import { briefMarkdown, storyboardMarkdown } from '../src/server/plan';
import { getSettings } from '../src/server/models';
import { sandboxed, openSandbox, copyOut, REMOTE } from '../src/server/sandbox';
import { runInNewContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { s3Enabled, putFile } from '../src/server/storage';
import type { Sandbox } from 'modal';

const AGENT_SLOTS = +(process.env.AGENT_SLOTS || 4);
const RENDER_WORKERS = +(process.env.RENDER_WORKERS || 4);
// In a sandbox, several headless Chromes exhaust the container's shared memory and hang; one renders ~5 frames/s.
const SANDBOX_RENDER_WORKERS = +(process.env.SANDBOX_RENDER_WORKERS || 1);
let agents = 0, renders = 0;

async function build(job: Job) {
  const run = (await getRun(job.runId))!, project = (await getProject(run.projectId))!;
  await updateRun(run.id, { status: 'running', startedAt: Date.now(), error: null });
  await addEvent(run.id, 'status', 'Setting up a private copy of the engine');
  createWorkspace(run.id, {
    'BRIEF.md': briefMarkdown(project.brief!, project.similar),
    'STORYBOARD.md': storyboardMarkdown(project.storyboard!),
  });
  // pin this run to a snapshot of the engine in S3, so any machine can rebuild or preview it later
  if (s3Enabled()) await updateRun(run.id, { engineHash: await publishEngine(wsDir(run.id)) });
  const r = await runAgent({ jobId: job.id, runId: run.id, prompt: buildInstructions(project.brief!) });
  await finishAgentJob(job, run.id, r);
}

async function revise(job: Job) {
  const run = (await getRun(job.runId))!, project = (await getProject(run.projectId))!;
  await ensureWorkspace(run);
  const note = String(job.payload.message || ''), at = job.payload.at as number | undefined;
  const text = `${at != null ? `At ${at.toFixed(1)}s: ` : ''}${note}`;
  await updateRun(run.id, { status: 'running', error: null });
  // resume the session so the agent remembers the film; without one, start over with the full context
  const prompt = run.sessionId
    ? `The user reviewed the film and asks for this change:\n\n${text}\n\nMake it, check it with contact sheets or strips around the affected moment, and reply with one or two sentences on what you changed, in plain language for the person watching (no file names, code or tool names). Don't render the final video.`
    : `${buildInstructions(project.brief!)}\n\nThe film in src/scenes/${SCENE}.js already exists. The user asks for this change:\n\n${text}`;
  // admins choose who revises: the model that won (default) or a fixed model
  const { studioModel } = await getSettings();
  const r = await runAgent({ jobId: job.id, runId: run.id, prompt, resume: run.sessionId, model: studioModel === 'winner' ? undefined : studioModel });
  await finishAgentJob(job, run.id, r);
}

async function finishAgentJob(job: Job, runId: string, r: { ok: boolean; cancelled: boolean }) {
  const run = (await getRun(runId))!;
  if (r.cancelled) { await updateRun(runId, { status: 'cancelled', finishedAt: Date.now() }); await finishJob(job.id, 'cancelled'); return; }
  if (!existsSync(resolve(wsDir(runId), 'src/scenes', `${SCENE}.js`))) {
    await updateRun(runId, { status: 'failed', error: 'the agent finished without writing the film', finishedAt: Date.now() });
    await finishJob(job.id, 'failed'); return;
  }
  const version = run.version + 1;
  await recordVersion(run, version);
  await updateRun(runId, { status: r.ok ? 'done' : 'failed', version, finishedAt: Date.now(), error: r.ok ? null : 'the agent stopped early; the film may be incomplete' });
  await addEvent(runId, 'status', `Version ${version} ready`, { version });
  await finishJob(job.id, r.ok ? 'done' : 'failed');
}

function node(cwd: string, args: string[], onLine: (l: string) => void, isCancelled: () => Promise<boolean>): Promise<void> {
  return new Promise((res, rej) => {
    const p = spawn(process.execPath, ['render.mjs', ...args], { cwd, env: process.env });
    let stopped = false;
    const tick = setInterval(async () => { if (await isCancelled()) { stopped = true; p.kill('SIGTERM'); } }, 1500);
    let tail = '';
    const feed = (d: Buffer) => { const s = d.toString(); tail = (tail + s).slice(-2000); s.split('\n').forEach(l => l.trim() && onLine(l.trim())); };
    p.stdout.on('data', feed); p.stderr.on('data', feed);
    p.on('close', code => { clearInterval(tick); if (stopped) rej(new Error('cancelled')); else if (code === 0) res(); else rej(new Error(tail.split('\n').slice(-6).join('\n'))); });
  });
}

// progress lines from render.mjs --frames: "frame 412/840 ... eta 1.2 min"
function progressFrom(line: string): { progress: number; eta: string | null } | null {
  const m = line.match(/frame (\d+)\/(\d+).*?eta ([\d.]+ min)?/) || line.match(/frame (\d+)\/(\d+)/);
  return m ? { progress: Math.min(.95, (+m[1] / +m[2]) * .95), eta: m[3] || null } : null;
}

// Render the film to MP4, then keep it in S3. In sandbox mode the frames render on a Modal machine (software WebGL,
// so --soft-gl); locally they render on this one.
async function render(job: Job) {
  const renderId = String(job.payload.renderId), local = wsDir(job.runId), out = `out/${SCENE}_${renderId}.mp4`;
  await ensureWorkspace((await getRun(job.runId))!);
  await updateRender(renderId, { status: 'running', progress: 0 });
  const cancelled = () => jobCancelled(job.id);
  const onLine = (l: string) => { const p = progressFrom(l); if (p) void updateRender(renderId, p); };
  try {
    if (sandboxed()) {
      const sb = await openSandbox(job.runId, 'render');
      try {
        // software WebGL only for the painted style: clean-style films render ~100x faster without it
        const gl = sceneStyle(local) === 'clean' ? [] : ['--soft-gl'];
        await sandboxRender(sb, ['--frames', `--workers=${SANDBOX_RENDER_WORKERS}`, `--scene=${SCENE}`, ...gl], onLine, cancelled);
        await updateRender(renderId, { progress: .96, eta: 'encoding' });
        await sandboxRender(sb, ['--encode', `--scene=${SCENE}`, `--out=${out}`], () => {}, cancelled);
        await copyOut(sb, `${REMOTE}/${out}`, resolve(local, out));
      } finally { await sb.terminate().catch(() => {}); }
    } else {
      rmSync(resolve(local, 'out/frames', SCENE), { recursive: true, force: true });
      await node(local, ['--frames', `--workers=${RENDER_WORKERS}`, `--scene=${SCENE}`], onLine, cancelled);
      await updateRender(renderId, { progress: .96, eta: 'encoding' });
      await node(local, ['--encode', `--scene=${SCENE}`, `--out=${out}`], () => {}, cancelled);
    }
    const file = s3Enabled() ? await putFile(`renders/${job.runId}/${renderId}.mp4`, resolve(local, out)) : out;
    await updateRender(renderId, { status: 'done', progress: 1, eta: null, file });
    await finishJob(job.id, 'done');
  } catch (e) {
    const msg = (e as Error).message;
    await updateRender(renderId, { status: msg === 'cancelled' ? 'cancelled' : 'failed', error: msg });
    await finishJob(job.id, msg === 'cancelled' ? 'cancelled' : 'failed');
  }
}

// the film's style from its scene list ('clean' draws with Canvas 2D; anything else is painted with WebGL)
function sceneStyle(dir: string): string {
  try {
    const ctx: Record<string, unknown> = {};
    runInNewContext(`${readFileSync(resolve(dir, 'src/scenes/index.js'), 'utf8')}\n;this.__s = SCENES.${SCENE}`, ctx);
    return ((ctx.__s as { project?: { style?: string } })?.project?.style) || 'painted';
  } catch { return 'painted'; }
}

// render.mjs in a sandbox, streaming its output line by line; stops if the job is cancelled
async function sandboxRender(sb: Sandbox, args: string[], onLine: (l: string) => void, isCancelled: () => Promise<boolean>) {
  const p = await sb.exec(['node', 'render.mjs', ...args], { workdir: REMOTE, stdout: 'pipe', stderr: 'pipe' });
  let tail = '', stopped = false;
  const tick = setInterval(async () => { if (await isCancelled()) { stopped = true; await sb.terminate().catch(() => {}); } }, 2000);
  const pump = async (st: ReadableStream<string>) => {
    let buf = '';
    for await (const chunk of st as unknown as AsyncIterable<string>) {
      buf += chunk; tail = (tail + chunk).slice(-2000);
      const lines = buf.split('\n'); buf = lines.pop() || '';
      lines.forEach(l => l.trim() && onLine(l.trim()));
    }
  };
  try {
    const [, , code] = await Promise.all([pump(p.stdout), pump(p.stderr), p.wait()]);
    if (stopped) throw new Error('cancelled');
    if (code !== 0) throw new Error(tail.split('\n').slice(-6).join('\n'));
  } catch (e) {
    if (stopped) throw new Error('cancelled');
    throw e;
  } finally { clearInterval(tick); }
}

async function runJob(job: Job, fn: (j: Job) => Promise<void>) {
  const beat = setInterval(() => { heartbeat(job.id).catch(() => {}); }, 30_000);   // lets the sweeper spot dead machines
  try { await fn(job); } catch (e) {
    const msg = (e as Error).stack || String(e);
    console.error(`[worker] ${job.kind} ${job.runId} failed:`, msg);
    if (job.kind !== 'render') {
      await addEvent(job.runId, 'error', (e as Error).message);
      await updateRun(job.runId, { status: 'failed', error: (e as Error).message, finishedAt: Date.now() });
    }
    await finishJob(job.id, 'failed');
  } finally { clearInterval(beat); }
}

let pumping = false;
async function pump() {
  if (pumping) return;
  pumping = true;
  try { await claimAll(); } catch (e) { console.error('[worker] poll failed:', (e as Error).message); } finally { pumping = false; }
}
async function claimAll() {
  while (agents < AGENT_SLOTS) {
    const job = await claimJob(['build', 'revise']);
    if (!job) break;
    agents++;
    console.log(`[worker] ${job.kind} ${job.runId}`);
    runJob(job, job.kind === 'build' ? build : revise).finally(() => { agents--; });
  }
  while (renders < 1) {
    const job = await claimJob(['render']);
    if (!job) break;
    renders++;
    console.log(`[worker] render ${job.runId}`);
    runJob(job, render).finally(() => { renders--; });
  }
}

const HANDLERS = { build, revise, render } as const;

// Modes:
//   (none)      local development: poll the queue and run jobs side by side (npm run dev)
//   --job <id>  production: run one job in the Modal container started for it, then exit (modal/worker_app.py run_job)
//   --sweep     production, every minute: start jobs nobody picked up, fail jobs whose machine went silent
async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--job') {
    const job = await claimJobById(Number(args[1]));
    if (!job) { console.log(`[worker] job ${args[1]} was already taken or is gone`); return; }
    console.log(`[worker] ${job.kind} ${job.runId} (job ${job.id})`);
    await runJob(job, HANDLERS[job.kind]);
    return;
  }
  if (args[0] === '--sweep') {
    const dead = await failSilentJobs(5 * 60_000);
    const waiting = await queuedJobIds(45_000);
    for (const id of waiting) await dispatch(id);
    console.log(`[worker] sweep: ${dead} silent job(s) failed, ${waiting.length} waiting job(s) started`);
    return;
  }
  await failStaleJobs();
  if (!process.env.ANTHROPIC_API_KEY) console.warn('[worker] ANTHROPIC_API_KEY is not set: add it to the Infisical project animate');
  console.log(`[worker] ready: ${AGENT_SLOTS} agent slots, 1 render slot; tools and renders run ${sandboxed() ? 'in Modal sandboxes' : 'locally (RUNNER=local)'}; exports ${s3Enabled() ? 'go to S3' : 'stay on disk'}`);
  setInterval(pump, 1000);
}
main().then(() => { if (process.argv.includes('--job') || process.argv.includes('--sweep')) process.exit(0); })
  .catch(e => { console.error('[worker] failed:', e); process.exit(1); });
