"""Video Arena's production worker on Modal (resslai workspace).

Each queued job (a build, a revision or an export) runs in its own trusted container: `run_job` starts the TypeScript
worker for that one job (web/worker/index.ts --job <id>), which runs Pi with the model API keys and drives the
untrusted sandboxes where the agent's commands and renders execute. The web app starts `run_job` as soon as it queues
a job; `sweep` runs every minute to start anything missed and to fail jobs whose container stopped.

Secrets come from the Modal secret "videoarena" (the Infisical project animate, env prod).
Deploy from the repo root:  modal deploy web/modal/worker_app.py
"""
import pathlib
import subprocess

import modal

# the repo on the machine running `modal deploy`; inside the container the same files live under /app
REPO = pathlib.Path(__file__).resolve().parents[2] if modal.is_local() else pathlib.Path("/app")

# Only what the worker and the engine need (the repo also holds renders, local workspaces and scan data).
ENGINE_FILES = ["studio.html", "render.mjs", "ANIMATION_GUIDE.md", "package.json", "package-lock.json"]
ENGINE_DIRS = ["src", "docs", "assets", "scripts", "projects/_template"]
PROJECT_FILES = ["projects/README.md", "projects/demo/brief.md", "projects/demo/project.js", "projects/demo/scene.js"]
REFS = ["catalog.json", "visual.json", "genres.json", "top_tier.json", "catalog.md", "craft.md", "genres.md", "pacing.md", "visual.md"]
WEB_IGNORE = ["node_modules", ".next", "data", ".infisical.json", ".env*"]

image = modal.Image.from_registry("node:22-bookworm-slim", add_python="3.12").apt_install("ca-certificates", "tar")
for f in ENGINE_FILES + PROJECT_FILES:
    if (REPO / f).exists():
        image = image.add_local_file(REPO / f, f"/app/{f}", copy=True)
for d in ENGINE_DIRS:
    if (REPO / d).exists():
        image = image.add_local_dir(REPO / d, f"/app/{d}", copy=True)
for f in REFS:
    if (REPO / "refs/whatships" / f).exists():
        image = image.add_local_file(REPO / "refs/whatships" / f, f"/app/refs/whatships/{f}", copy=True)
# the genres beyond launch films: measured stats (the catalog build reads measured.json) and the notes agents read
for f in ["measured.json", "measured.md", "index.md"]:
    if (REPO / "refs/genres_ext" / f).exists():
        image = image.add_local_file(REPO / "refs/genres_ext" / f, f"/app/refs/genres_ext/{f}", copy=True)
# the top tier's per-film measurements (json only), used by the scoring script
image = image.add_local_dir(REPO / "refs/whatships/craft", "/app/refs/whatships/craft", copy=True, ignore=["*/", "!*.json"])
image = (
    image.add_local_dir(REPO / "web", "/app/web", copy=True, ignore=WEB_IGNORE)
    # the engine's own dependencies (p5, p5.brush, puppeteer-core), then the app's, then the catalog data
    .run_commands("cd /app && npm ci --omit=dev", "cd /app/web && npm ci && npm run catalog")
    .env({"RUNNER": "modal", "WORKER_MODE": "modal", "NODE_ENV": "production"})
)

app = modal.App("videoarena-worker", image=image, secrets=[modal.Secret.from_name("videoarena")])


def worker(*args: str) -> None:
    subprocess.run(["npx", "tsx", "worker/index.ts", *args], cwd="/app/web", check=True)


# Pi mostly waits on the model, so a small container is enough; renders happen in their own sandboxes.
# 24 h is the platform maximum: we set no time limit of our own.
@app.function(cpu=0.5, memory=2048, timeout=24 * 3600, retries=0)
def run_job(job_id: int) -> None:
    worker("--job", str(job_id))


@app.function(schedule=modal.Period(minutes=1), cpu=0.25, memory=512, timeout=300)
def sweep() -> None:
    worker("--sweep")
