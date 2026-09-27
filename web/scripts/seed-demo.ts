// seed-demo.ts: a ready-made arena to try the UI without spending API credits. The two "builds" are the engine's own
// demo films (launch_demo and mg_demo), registered as the film in two workspaces. Run: npm run seed
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createProject, updateProject, createRun, updateRun, addEvent } from '../src/server/db';
import { createWorkspace, snapshot, wsDir } from '../src/server/workspace';
import type { Brief, Storyboard } from '../src/lib/types';

const brief: Brief = {
  product: 'Relay, a sync engine for apps', message: 'Your app, instantly in sync everywhere', audience: 'developers',
  category: 'Developer tools', family: 'ui_walkthrough', length: 11, format: 'landscape', theme: 'dark', textLevel: 'some',
  cursor: true, cta: 'relay.dev', notes: '', brand: { colors: [], font: 'Inter' },
  source: { product: 'said', message: 'guessed', audience: 'guessed', category: 'guessed', family: 'guessed', length: 'said', format: 'default', theme: 'default', textLevel: 'default', cursor: 'default', cta: 'guessed' },
  why: { family: 'developer launches usually show the product working', format: '91% of UI walkthrough films are landscape' },
};
const storyboard: Storyboard = {
  title: 'Relay', logline: 'A developer types one command and watches their app sync everywhere at once.',
  look: 'Deep navy ground, Inter, one violet accent (#8B7FF0), soft glow; snappy ease-out moves with small staggers.',
  shots: [
    { id: 'A', t0: 0, t1: 3, name: 'Hook', action: 'Kinetic headline rises word by word out of the dark.', text: 'Sync, solved.', transition: 'zoom through the last word' },
    { id: 'B', t0: 3, t1: 7, name: 'The app', action: 'App window tilts in, cursor clicks, typing, a result card springs in.', text: '', transition: 'push in to the card' },
    { id: 'C', t0: 7, t1: 11, name: 'End card', action: 'Logo resolves with glow particles behind; tagline and URL.', text: 'relay.dev', transition: 'fade out' },
  ],
};

async function main() {
const project = await createProject({ prompt: '11s launch film for Relay, a sync engine for developers', brief, similar: [] });
await updateProject(project.id, { storyboard, status: 'arena' });

// both demo scenes are in the engine; each workspace registers one of them as "film"
for (const [slot, scene, model] of [['A', 'launch_demo', 'anthropic/claude-opus-5-5'], ['B', 'mg_demo', 'anthropic/claude-sonnet-5']] as const) {
  const run = await createRun(project.id, slot, model, 'high');
  createWorkspace(run.id, {});
  const idx = resolve(wsDir(run.id), 'src/scenes/index.js');
  const src = readFileSync(idx, 'utf8');
  const m = src.match(new RegExp(`\\n\\s*${scene}: (\\{[\\s\\S]*?\\}),?\\n\\s*(?:[a-z_]+:|\\};)`));
  if (!m) throw new Error(`scene ${scene} not found in index.js`);
  writeFileSync(idx, src.replace(/const SCENES = \{/, `const SCENES = {\n  film: ${m[1]},`));
  snapshot(run.id, 1);
  await updateRun(run.id, { status: 'done', version: 1, startedAt: Date.now() - 9 * 60000, finishedAt: Date.now() });
  await addEvent(run.id, 'status', 'Seeded from the engine demo "' + scene + '"');
  await addEvent(run.id, 'result', 'Finished', {});
}
console.log(`seeded: http://localhost:3000/p/${project.id}`);
}
main().catch(e => { console.error(e); process.exit(1); });
