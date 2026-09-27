// pi-smoke.ts: a quick check that the Pi harness works for a model before it goes into the arena. The agent runs a
// shell command (renders a contact sheet with the engine), then reads the image and describes it: that exercises
// bash, image reading and the event stream. Run: infisical run --env=dev -- npx tsx scripts/pi-smoke.ts <models.id>...
import { createProject, createRun, runEvents } from '../src/server/db';
import { getModel } from '../src/server/models';
import { createWorkspace } from '../src/server/workspace';
import { runAgent } from '../src/server/agent';

const PROMPT = 'Run `node render.mjs --scene=mg_demo --sheet=1,4,8 --cols=3 --w=480 --out=out/check/smoke.jpg`, then read out/check/smoke.jpg and describe what the three frames show in one sentence.';

async function main() {
  const ids = process.argv.slice(2);
  if (!ids.length) throw new Error('usage: pi-smoke.ts <models.id>...');
  const project = await createProject({ prompt: '[smoke test]', brief: null, similar: [] });
  await Promise.all(ids.map(async (id, i) => {
    const m = await getModel(id);
    if (!m) throw new Error(`${id} is not in the registry`);
    const run = await createRun(project.id, i ? 'B' : 'A', id, 'low');
    createWorkspace(run.id, {});
    const t0 = Date.now();
    const r = await runAgent({ jobId: -1, runId: run.id, prompt: PROMPT });
    const ev = await runEvents(run.id);
    console.log(`\n== ${m.label} (${m.provider}/${m.modelId}): ${r.ok ? 'OK' : 'FAILED'} in ${((Date.now() - t0) / 1000).toFixed(0)}s, $${r.cost.toFixed(3)}`);
    console.log('   steps:', ev.filter(e => e.kind === 'tool' || e.kind === 'sheet').map(e => `${e.kind}: ${e.text.slice(0, 70)}`).join(' | '));
    console.log('   reply:', r.summary.slice(0, 300));
  }));
}
main().catch(e => { console.error(e); process.exit(1); });
