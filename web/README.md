# Animate: the web app

A Next.js product UI for the animation engine in the parent directory. Someone types one line, and then:

1. **Brief.** Claude reads what they said. Anything they didn't say (length, format, theme, amount of text, cursor)
   is filled in from the What Ships catalog, which covers 2,221 real launch films. Each field is marked
   *you said*, *guessed* or *from catalog*, with a one-line reason.
2. **Storyboard.** Opus writes a shot list from the brief. It uses the genre recipe (`docs/genres/`), the measured
   pacing and craft notes (`refs/whatships/`), and similar catalog films. The user edits it, revises it by chat, then
   approves it.
3. **Arena.** Two models build the same storyboard side by side, each in its own copy of the engine. The films are
   shown blind as A and B, with live previews and the contact sheets each agent checked. The user votes, and only then
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

Open http://localhost:3000. `npm run dev` wraps everything in
`infisical run --env=dev --path=/shared --path=/personal/abhishek`, which needs `ANTHROPIC_API_KEY` in Infisical.
`web/.infisical.json` links the project. `npm start` does the same with `--env=prod` after `npm run build`.
`npm run dev:raw` skips Infisical. Use it if the key is already in your environment.

To try the arena and studio without spending credits, run `npm run seed`. It creates a finished arena whose two
"builds" are the engine's own demo films.

You also need what the engine needs: Node, Google Chrome and ffmpeg.

## How it's put together

| path | what |
|---|---|
| `src/app/` | Pages (`/`, `/p/[id]`, `/projects`, `/leaderboard`) and API routes |
| `src/app/ws/[runId]/[...path]` | Serves a workspace: the preview (`studio.html` plus a postMessage bridge), contact sheets, MP4s |
| `src/components/` | `BriefReview`, `StoryboardStep`, `Arena`, `Studio`, `Player` (the sandboxed live preview), `AgentFeed` |
| `src/server/plan.ts` | Brief extraction and storyboard writing (Messages API, structured outputs) |
| `src/server/agent.ts` | Agent SDK runs inside a workspace; every step becomes an event |
| `src/server/catalog.ts` | Genre stats, brief defaults, similar-film retrieval from `data/catalog.json` |
| `src/server/db.ts` | SQLite (`node:sqlite`, WAL): projects, runs, events, jobs, renders, votes |
| `worker/index.ts` | The job worker: arena builds and revisions (up to 4 at once) and renders (one at a time) |
| `scripts/build-catalog.mjs` | `refs/whatships/*` → `data/catalog.json` (runs on `dev` and `build`) |

**Previews cost nothing.** A film is JavaScript, so the preview draws every frame in the browser on demand. Only
the export renders frames to video (`render.mjs --frames`, then `--encode`).

**The catalog.** Public screens show only stats, tags and links to the original X posts, never the catalog's
posters or footage. Agents get the similar films' tags and notes as patterns to learn from, not assets to copy.

**Safety.** Agent code runs with permission checks bypassed inside its workspace, and the preview runs in an
iframe sandboxed without same-origin rights. That's fine for a local tool. Before hosting it for other people, run
each workspace in its own container and serve previews from a separate origin (milestone 4 in the plan).
