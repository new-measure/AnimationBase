// Modal sandboxes (the resslai workspace): where agent commands and renders run, away from our server. A sandbox gets
// a copy of the run's workspace, no API keys, and network access to Google Fonts only (films load their fonts from
// there). Pi itself runs in the worker and reaches into the sandbox through the tool operations below, so the model
// providers' keys never enter it.
//
// Local mode (RUNNER=local) skips all of this and runs tools on the worker's machine, for development.
import { ModalClient, type Sandbox, type Image, type App } from 'modal';
import { execFile } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { BashOperations, ReadOperations, WriteOperations, EditOperations } from '@earendil-works/pi-coding-agent';
import { wsDir } from './workspace';
import { s3Enabled, putBuffer } from './storage';

const run = promisify(execFile);
// macOS tar adds AppleDouble files (._name) holding extended attributes; they must never reach a sandbox or a version
const TAR_ENV = { ...process.env, COPYFILE_DISABLE: '1' };
export const REMOTE = '/workspace';
export const sandboxed = () => (process.env.RUNNER || 'modal') === 'modal';

// The engine's runtime: Node, Chromium for render.mjs, ffmpeg for encoding, Python with numpy and Pillow for the
// scoring scripts, fonts, and the engine's npm dependencies (the engine's own files come with each run's workspace).
const IMAGE_COMMANDS = [
  'RUN apt-get update && apt-get install -y --no-install-recommends chromium python3 python3-numpy python3-pil ripgrep fonts-noto fonts-noto-color-emoji fonts-liberation ca-certificates curl xz-utils && rm -rf /var/lib/apt/lists/*',
  // a current static ffmpeg: Debian's 5.1 can't build the engine's soundtrack filter chain
  'RUN curl -fsSL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar -xJ -C /tmp && mv /tmp/ffmpeg-*-static/ffmpeg /tmp/ffmpeg-*-static/ffprobe /usr/local/bin/ && rm -rf /tmp/ffmpeg-*-static && ffmpeg -version | head -1',
  'RUN mkdir -p /opt/engine && cd /opt/engine && npm init -y >/dev/null && npm install --omit=dev p5@^2.3.3 p5.brush@^2.2.3 puppeteer-core@^25.11.0',
  'ENV CHROME_PATH=/usr/bin/chromium',
];
const ALLOWED_DOMAINS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const g = globalThis as unknown as { __modal?: { client: ModalClient; app: Promise<App>; image: Promise<Image> } };
function modal() {
  if (g.__modal) return g.__modal;
  const client = new ModalClient();
  const app = client.apps.fromName('animate-sandbox', { createIfMissing: true });
  const image = app.then(a => client.images.fromRegistry('node:22-bookworm').dockerfileCommands(IMAGE_COMMANDS).build(a));
  return (g.__modal = { client, app, image });
}

// tar the local workspace (minus node_modules and render output) so it can be unpacked in a sandbox
async function packWorkspace(runId: string): Promise<string> {
  const tar = resolve(tmpdir(), `animate-${runId}-${randomUUID().slice(0, 8)}.tgz`);
  await run('tar', ['-czf', tar, '--exclude=./node_modules', '--exclude=./out/frames', '--exclude=./out/*.mp4', '--exclude=./versions', '--exclude=._*', '-C', wsDir(runId), '.'], { env: TAR_ENV });
  return tar;
}

export async function sh(sb: Sandbox, command: string, { workdir = REMOTE, timeoutMs }: { workdir?: string; timeoutMs?: number } = {}): Promise<{ code: number; out: string }> {
  const p = await sb.exec(['bash', '-lc', command], { workdir, stdout: 'pipe', stderr: 'pipe', ...(timeoutMs ? { timeoutMs } : {}) });
  const [out, err, code] = await Promise.all([p.stdout.readText(), p.stderr.readText(), p.wait()]);
  return { code, out: out + err };
}

// A sandbox holding this run's workspace at /workspace, ready for the agent or a render.
export async function openSandbox(runId: string, purpose: 'agent' | 'render'): Promise<Sandbox> {
  const { client, app, image } = modal();
  const sb = await client.sandboxes.create(await app, await image, {
    cpu: 4, memoryMiB: 8192,
    timeoutMs: 24 * 3600_000,                // the platform maximum: builds have no time limit of ours
    outboundDomainAllowlist: ALLOWED_DOMAINS,
    workdir: '/', tags: { app: 'animate', run: runId, purpose },
  });
  try {
    const tar = await packWorkspace(runId);
    await sb.filesystem.copyFromLocal(tar, '/tmp/ws.tgz');
    rmSync(tar, { force: true });
    const r = await sh(sb, `mkdir -p ${REMOTE} && tar -xzf /tmp/ws.tgz -C ${REMOTE} && rm /tmp/ws.tgz && rm -rf ${REMOTE}/node_modules && ln -s /opt/engine/node_modules ${REMOTE}/node_modules`, { workdir: '/' });
    if (r.code !== 0) throw new Error(`could not unpack the workspace: ${r.out.slice(-400)}`);
    return sb;
  } catch (e) {
    await sb.terminate().catch(() => {});
    throw e;
  }
}

// Bring the film's code (and anything else the agent changed under src/) back to the local mirror that previews and
// version snapshots use.
export async function syncBack(sb: Sandbox, runId: string, paths = ['src', 'STORYBOARD.md']) {
  const r = await sh(sb, `tar -czf /tmp/back.tgz -C ${REMOTE} ${paths.join(' ')} 2>/dev/null; echo $?`);
  if (r.code !== 0) throw new Error(`could not pack the workspace: ${r.out.slice(-400)}`);
  const local = resolve(tmpdir(), `animate-back-${runId}-${randomUUID().slice(0, 8)}.tgz`);
  await sb.filesystem.copyToLocal('/tmp/back.tgz', local);
  rmSync(resolve(wsDir(runId), 'src'), { recursive: true, force: true });
  await run('tar', ['-xzf', local, '-C', wsDir(runId)]);
  rmSync(local, { force: true });
}

export async function copyOut(sb: Sandbox, remotePath: string, localPath: string) {
  mkdirSync(dirname(localPath), { recursive: true });
  await sb.filesystem.copyToLocal(remotePath, localPath);
}

// ---------- Pi tool operations, executed in the sandbox ----------
const IMAGE_TYPES: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
const q = (p: string) => `'${p.replace(/'/g, `'\\''`)}'`;

export function sandboxTools(sb: Sandbox, runId: string) {
  // images the agent looks at are mirrored locally, so the progress card can show its latest contact sheet
  const mirror = (abs: string, data: Buffer) => {
    if (!IMAGE_TYPES[extname(abs).toLowerCase()] || !abs.startsWith(REMOTE + '/')) return;
    const local = resolve(wsDir(runId), abs.slice(REMOTE.length + 1));
    try { mkdirSync(dirname(local), { recursive: true }); writeFileSync(local, data); } catch { /* preview only */ }
    if (s3Enabled()) void putBuffer(`runs/${runId}/files/${abs.slice(REMOTE.length + 1)}`, data, IMAGE_TYPES[extname(abs).toLowerCase()]).catch(() => {});
  };
  const readFile = async (abs: string) => { const b = Buffer.from(await sb.filesystem.readBytes(abs)); mirror(abs, b); return b; };
  const access = async (abs: string) => { if ((await sh(sb, `test -e ${q(abs)}`)).code !== 0) throw Object.assign(new Error(`ENOENT: ${abs}`), { code: 'ENOENT' }); };
  const writeFile = async (abs: string, content: string) => { await sh(sb, `mkdir -p ${q(dirname(abs))}`); await sb.filesystem.writeText(content, abs); };

  const read: ReadOperations = { readFile, access, detectImageMimeType: async abs => IMAGE_TYPES[extname(abs).toLowerCase()] ?? null };
  const write: WriteOperations = { writeFile, mkdir: async dir => { await sh(sb, `mkdir -p ${q(dir)}`); } };
  const edit: EditOperations = { readFile, writeFile, access };
  const bash: BashOperations = {
    exec: async (command, cwd, { onData, timeout }) => {
      // Pi passes the session's cwd; anything outside the sandbox's workspace means the workspace itself
      const workdir = cwd && (cwd === REMOTE || cwd.startsWith(REMOTE + '/')) ? cwd : REMOTE;
      const p = await sb.exec(['bash', '-lc', command], { workdir, stdout: 'pipe', stderr: 'pipe', mode: 'binary', ...(timeout ? { timeoutMs: timeout * 1000 } : {}) });
      const pump = async (s: ReadableStream<Uint8Array>) => { for await (const chunk of s as unknown as AsyncIterable<Uint8Array>) onData(Buffer.from(chunk)); };
      const [, , exitCode] = await Promise.all([pump(p.stdout), pump(p.stderr), p.wait()]);
      return { exitCode };
    },
  };
  return { read, write, edit, bash };
}

