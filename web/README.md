# Video Arena: the web app

A Next.js product UI for the animation engine in the parent directory. Someone types one line, and then:

1. **Brief.** Claude reads what they said. Anything they didn't say (length, format, theme, amount of text, cursor)
   is filled in from the What Ships catalog, which covers 2,221 real launch films. Each field is marked
   *you said*, *guessed* or *from catalog*, with a one-line reason. If the prompt names a real product, Claude first
   searches the web (the product's own site first) for what it does, its key features and its brand colours. The
   brief shows what it found and where.
2. **Storyboard.** Opus writes a shot list from the brief. It uses the genre recipe (`docs/genres/`), the measured
   pacing and craft notes (`refs/whatships/`), and similar catalog films. It can also search the web so the product's
   features and look are right. The user edits it, revises it by chat, then
   approves it.
3. **Arena.** Two models, drawn from the admin's lineup, build the same storyboard side by side, each in its own copy of
   the engine, all through the same Pi harness (same prompt, tools and settings, thinking high, no turn or time limits). The films are
   shown blind as A and B, with live previews. While a film builds, a progress bar shows the agent's phase (reading
   the brief, building, checking its work, polishing) and how many times it has checked a contact sheet. Near the end
   an agent may score a check copy against the top tier (`scripts/whatships_craft.py`, `scripts/eval_scorecard.py`). The user votes, and only then
   sees which model made which. Votes feed `/leaderboard`.
4. **Studio.** Revise the chosen film by chat or by pinning a comment to a moment. Every finished change is a
   version you can restore. Export renders the MP4.

The app never edits the engine. Each arena run copies the engine into `data/workspaces/<run>/` when it starts, so a
run is pinned to the engine as it was at that moment.

## Run it

```bash
cd web
npm install
npm run dev          # Next.js + the job worker, with secrets from Infisical (dev env)
```

Open http://localhost:3000. `npm run dev` wraps everything in `infisical run --env=dev`, and `npm start` uses
`--env=prod` after `npm run build`. Secrets come from the dedicated Infisical project **animate**, which
`web/.infisical.json` links to. `npm run dev:raw` skips Infisical; use it if the variables are already in your
environment.

Variables (in the `animate` project): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (for the Pi harness), `DATABASE_URL` (Neon),
`WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI`, `ADMIN_EMAILS`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, and for Modal either `MODAL_PROFILE=resslai`
(dev, with the Modal CLI logged in) or `MODAL_TOKEN_ID` / `MODAL_TOKEN_SECRET` (prod).

Database: `npm run db:push` applies `src/server/schema.ts` to the Neon dev branch (`db:push:prod` for main), and
`npm run db:seed` adds the starting model registry and arena lineup (only what's missing).

**Sign-in and admins.** Every page and API route needs a WorkOS AuthKit session (`src/proxy.ts`). Users see only their
own projects. The emails in `ADMIN_EMAILS` are admins: they see every project, and they get `/admin` and `/leaderboard`.
`/admin` is where the model registry, the arena lineup (weighted pairs), the planning model and the studio-revision
model are set. Users never choose or see a model. Previews run in a sandboxed iframe that sends no cookies, so their
URLs carry a signature instead (`/ws/<runId>.<sig>/…`, see `signRun` in `src/server/auth.ts`).

To try the arena and studio without spending credits, run `npm run seed`. It creates a finished arena whose two
"builds" are the engine's own demo films.

You also need what the engine needs: Node, Google Chrome and ffmpeg.

## How it's put together

| path | what |
|---|---|
| `src/app/` | Pages (`/`, `/p/[id]`, `/projects`, `/leaderboard`) and API routes |
| `src/app/ws/[runId]/[...path]` | Serves a workspace: the preview (`studio.html` plus a postMessage bridge), contact sheets, MP4s |
| `src/components/` | `BriefReview`, `StoryboardStep`, `Arena`, `Studio`, `Player` (the sandboxed live preview), `AgentFeed` |
| `src/server/plan.ts` | Brief extraction and storyboard writing (Messages API, structured outputs, web search) |
| `src/server/workspace.ts` | Copies the engine, refs, project template and scoring scripts into a run's workspace |
| `src/lib/progress.ts` | Turns the raw agent event stream into a phase, a check count and the conversation |
| `src/lib/models.ts` | The models the arena can use, and which model writes the brief and the storyboard |
| `src/server/agent.ts` | Agent SDK runs inside a workspace. Every step is stored as an event for debugging; the UI shows only the summary |
| `src/server/catalog.ts` | Genre stats, brief defaults, similar-film retrieval from `data/catalog.json` |
| `src/server/db.ts`, `schema.ts` | Neon Postgres via Drizzle: users, projects, runs, events, jobs, renders, votes, models, arena pairs, settings |
| `src/server/auth.ts`, `src/proxy.ts` | WorkOS sessions, admins, ownership checks, signed preview URLs |
| `src/server/models.ts`, `src/app/admin` | The admin-controlled model registry, arena lineup and settings |
| `worker/index.ts` | The job worker: arena builds and revisions (up to 4 at once) and renders (one at a time) |
| `scripts/build-catalog.mjs` | `refs/whatships/*` → `data/catalog.json` (runs on `dev` and `build`) |

**Previews cost nothing.** A film is JavaScript, so the preview draws every frame in the browser on demand. Only
the export renders frames to video (`render.mjs --frames`, then `--encode`).

**The catalog.** Public screens show only stats, tags and links to the original X posts, never the catalog's
posters or footage. Agents get the similar films' tags and notes as patterns to learn from, not assets to copy.

**Where agents run.** Pi runs in the worker, but its tools (read, write, edit, bash) execute in a **Modal sandbox**
(resslai workspace, `src/server/sandbox.ts`): a fresh container per build or revision holding a copy of the run's
workspace, with no API keys and network access to Google Fonts only. When a pass ends, the film's code is copied back
to the local mirror that previews are served from. MP4 exports render in a sandbox too and are uploaded to S3;
downloads are short-lived presigned links after an ownership check. `RUNNER=local` runs everything on the worker's
machine instead, for development. `scripts/sandbox-smoke.ts` checks the sandbox end to end (image, render, copy-out,
network allowlist, no secrets inside).
## Production

| Piece | Where |
|---|---|
| Web app (pages, API, login, planning) | Vercel, from `web/` (planning routes allow 300 s) |
| Worker (runs Pi, holds the model keys) | Modal app `videoarena-worker` (`modal/worker_app.py`): `run_job` per job, `sweep` every minute |
| Sandboxes (agent commands, renders) | Modal app `animate-sandbox`, untrusted: no keys, Google Fonts only |
| Database | Neon project `animate`, branch `main` |
| Files | S3 `animate-media-699392538664`: `engines/<hash>/…` (engine snapshots), `runs/<id>/…` (contact sheets), `renders/…` (MP4s) |
| Login | WorkOS project Animate |
| Secrets | Infisical project `animate`, env `prod` → Vercel env vars and the Modal secret `videoarena` |

How a job runs in production: an API route inserts the job (`WORKER_MODE=modal`), then spawns `run_job(id)`. That
container claims the job (`worker --job <id>`), writes a heartbeat every 30 s, and exits when done. `sweep` starts any
job left waiting for 45 s and fails jobs whose heartbeat stopped for 5 minutes. A job inserted as `held` is only ever
claimed by id (`npx tsx worker/index.ts --job <id>`), which is handy for tests.

Previews never touch a worker's disk: a run's files resolve from its current version in Neon (`run_versions`: only
what differs from its engine), then its contact sheets and its engine snapshot in S3. Every preview response carries
`Content-Security-Policy: sandbox allow-scripts`, so model-written film code runs sessionless even when a preview URL
is opened directly, and one domain is enough.

Deploy: `npm run db:push:prod` (schema) and the seed on `main`, `modal deploy web/modal/worker_app.py`, then
`vercel deploy --prod` with the prod env vars (including `WORKER_MODE=modal`, `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`
and `NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://<domain>/callback`).
