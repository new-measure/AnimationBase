import Link from 'next/link';
import { connection } from 'next/server';
import PromptBox from '@/components/PromptBox';
import ProjectList from '@/components/ProjectList';
import { listProjects } from '@/server/db';
import { families, catalog } from '@/server/catalog';

export default async function Home() {
  await connection();
  const recent = listProjects(6), fams = families();
  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Turn a brief into a launch film.</h1>
      <p className="mt-3 text-lg text-muted max-w-2xl">
        Describe it in a line. We plan the storyboard with you, then two models build it side by side and you keep the better one.
      </p>
      <div className="mt-8"><PromptBox /></div>

      <section className="mt-16">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide">Styles, from {catalog().total.toLocaleString()} real launch films</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {fams.map(f => (
            <div key={f.key} className="rounded-xl border border-line bg-panel p-4">
              <p className="font-medium">{f.label}</p>
              <p className="mt-1 text-sm text-muted">{f.blurb}</p>
              <p className="mt-3 text-xs text-faint">{f.share}% of films · ~{Math.round(f.pacing?.length ?? f.medianSeconds ?? 30)}s{f.pacing ? ` · cut every ${f.pacing.shot}s` : ''}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wide">Recent videos</h2>
          <Link href="/projects" className="text-sm text-accent hover:underline">All projects →</Link>
        </div>
        <div className="mt-4"><ProjectList projects={recent} /></div>
      </section>
    </div>
  );
}
