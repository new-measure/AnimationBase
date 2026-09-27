import Link from 'next/link';
import { connection } from 'next/server';
import PromptBox, { type StyleCard } from '@/components/PromptBox';
import ProjectList from '@/components/ProjectList';
import { Page, Section } from '@/components/ui';
import { ArrowRight } from '@/components/icons';
import { viewer, visibleProjects } from '@/server/auth';
import { families, catalog } from '@/server/catalog';

export default async function Home() {
  await connection();
  const recent = await visibleProjects(await viewer(), 6);
  const styles: StyleCard[] = families().map(f => ({
    key: f.key, label: f.label, blurb: f.blurb, share: f.share, group: f.group, count: f.count,
    seconds: Math.round(f.pacing?.length ?? f.medianSeconds ?? 30), shot: f.pacing?.shot ?? null, beat: f.pacing?.beat ?? null,
  }));
  return (
    <Page className="sm:py-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">Turn a brief into a film.</h1>
        <p className="mt-4 text-lg text-muted text-pretty">
          A launch film, an explainer, a tutorial or a data story: describe it in a line. We plan the storyboard with you, then two models build it side by side and you keep the better one.
        </p>
      </div>
      <div className="mt-8"><PromptBox styles={styles} total={catalog().total} /></div>

      {recent.length > 0 && (
        <Section title="Recent videos" className="mt-16"
          actions={<Link href="/projects" className="inline-flex items-center gap-1 text-accent hover:underline">All projects <ArrowRight size={14} /></Link>}>
          <ProjectList projects={recent} />
        </Section>
      )}
    </Page>
  );
}
