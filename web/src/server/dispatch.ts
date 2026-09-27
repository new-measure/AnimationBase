// Production: start the Modal container for a job right away (web/modal/worker_app.py, function run_job). The sweeper
// in the same app starts anything this misses. Locally (WORKER_MODE unset) the polling worker picks jobs up instead.
import { ModalClient } from 'modal';

const APP = process.env.MODAL_WORKER_APP || 'videoarena-worker';
let client: ModalClient | null = null;

export async function dispatch(jobId: number) {
  client ||= new ModalClient();
  const fn = await client.functions.fromName(APP, 'run_job');
  await fn.spawn([jobId]);
}
