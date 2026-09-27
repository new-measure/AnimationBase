// sandbox-smoke.ts: checks the Modal sandbox end to end: builds the image (first run takes a few minutes), unpacks a
// workspace, renders a contact sheet with the engine, copies it out, and confirms only Google Fonts is reachable.
// Run: infisical run --env=dev -- npx tsx scripts/sandbox-smoke.ts
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createWorkspace, wsDir } from '../src/server/workspace';
import { openSandbox, sh, copyOut } from '../src/server/sandbox';

async function main() {
  const id = 'sbsmoke' + Date.now().toString(36);
  createWorkspace(id, {});
  let t = Date.now();
  const sb = await openSandbox(id, 'agent');
  console.log(`sandbox ready in ${((Date.now() - t) / 1000).toFixed(0)}s`);
  try {
    t = Date.now();
    const r = await sh(sb, 'node render.mjs --scene=mg_demo --sheet=1,4,8 --cols=3 --w=480 --soft-gl --out=out/check/smoke.jpg');
    console.log(`render: exit ${r.code} in ${((Date.now() - t) / 1000).toFixed(0)}s\n${r.out.trim().split('\n').slice(-3).join('\n')}`);
    const local = resolve(wsDir(id), 'out/check/smoke.jpg');
    await copyOut(sb, '/workspace/out/check/smoke.jpg', local);
    console.log('copied out:', existsSync(local) ? `${statSync(local).size} bytes → ${local}` : 'MISSING');
    for (const url of ['https://fonts.googleapis.com/css2?family=Inter', 'https://example.com', 'https://api.anthropic.com']) {
      const n = await sh(sb, `curl -s -o /dev/null -m 8 -w '%{http_code}' ${url} || echo blocked`);
      console.log(`network ${url}: ${n.out.trim()}`);
    }
    const env = await sh(sb, 'env | grep -ciE "anthropic|openai|aws_|database_url|workos" || true');
    console.log('secret-looking env vars inside sandbox:', env.out.trim());
  } finally {
    await sb.terminate();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
