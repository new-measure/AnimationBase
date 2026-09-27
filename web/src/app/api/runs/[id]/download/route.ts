import { redirect } from 'next/navigation';
import { latestRender } from '@/server/db';
import { ownRun, signRun } from '@/server/auth';
import { signedUrl } from '@/server/storage';
import { fail, handle } from '@/server/http';

// the latest exported MP4 of a run, for its owner: a short-lived S3 link (or the local file in local mode).
// ?download=<name> makes the browser save it instead of playing it.
export const GET = handle(async (req: Request, ctx: RouteContext<'/api/runs/[id]/download'>) => {
  const { run } = await ownRun((await ctx.params).id);
  const r = await latestRender(run.id);
  if (!r?.file || r.status !== 'done') return fail('no export yet', 404);
  const download = new URL(req.url).searchParams.get('download') || undefined;
  if (r.file.startsWith('s3://')) redirect(await signedUrl(r.file, { download }));
  redirect(`/ws/${signRun(run.id)}/${r.file}${download ? `?download=${encodeURIComponent(download)}` : ''}`);
});
