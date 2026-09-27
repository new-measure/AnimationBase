'use client';
// The composer on the home page: one line in, a project out. The style cards underneath fill in an example.
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Family, FamilyGroup } from '@/lib/types';
import { Button, Spinner } from './ui';
import { ArrowRight } from './icons';
import { toast } from './toast';

export interface StyleCard { key: Family; label: string; blurb: string; share: number; group: FamilyGroup; count: number; seconds: number; shot: number | null; beat: number | null }

const EXAMPLES: Record<Family, string> = {
  ui_walkthrough: '35s launch film for Tempo, an AI calendar that schedules meetings for you',
  type_led: 'Bold type-led announcement: Relay 2.0 is out, sync is 10x faster. For developers.',
  brand_graphic: 'Logo reveal and short brand film for Kiln, a new design studio, warm orange palette',
  illustrated: 'Illustrated story of a tiny robot helping a busy baker, for Crumb, an AI bakery assistant',
  abstract: 'Dark, glowing, mysterious teaser for Aurora, a new AI voice model',
  explainer: 'A one-minute explainer: how does a vaccine teach your immune system to fight a virus?',
  tutorial: 'Tutorial for Tempo, an AI calendar: how to set up focus time in three steps',
  data_story: 'Data story on the carbon dioxide measured at Mauna Loa since 1959, and how fast it is rising now',
};

export default function PromptBox({ styles, total }: { styles: StyleCard[]; total: number }) {
  const [prompt, setPrompt] = useState('');
  const [picked, setPicked] = useState<Family | null>(null);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  async function start() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    try {
      const { id } = await api<{ id: string }>('/api/projects', 'POST', { prompt });
      router.push(`/p/${id}`);
    } catch (e) { toast.error((e as Error).message); setBusy(false); }
  }
  const pickStyle = (s: StyleCard) => { setPrompt(EXAMPLES[s.key]); setPicked(s.key); box.current?.focus(); };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-line bg-panel shadow-float focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 transition">
        <textarea
          ref={box} value={prompt} onChange={e => { setPrompt(e.target.value); setPicked(null); }} rows={3} autoFocus disabled={busy}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) { e.preventDefault(); start(); } }}
          placeholder="Describe your video… “30s launch film for our AI calendar app, Tempo” or “an explainer on how vaccines work”" aria-label="Describe your video"
          className="w-full resize-none bg-transparent px-5 pt-4 text-lg outline-none focus-visible:outline-none placeholder:text-faint disabled:opacity-60"
        />
        <div className="flex items-center gap-3 px-4 pb-3">
          <p className="min-w-0 flex-1 truncate text-xs text-muted">
            {busy ? <span className="inline-flex items-center gap-2 text-accent"><Spinner /> Reading your brief and looking up the product…</span>
              : 'Product or topic, message, length, format: say as much or as little as you like.'}
          </p>
          <Button onClick={start} disabled={!prompt.trim()} loading={busy} size="lg" className="shrink-0">
            Start {!busy && <ArrowRight />}
          </Button>
        </div>
      </div>

      <div className="mt-12 grid gap-10">
      <StyleGrid title="Launch films" note={`Learned from ${total.toLocaleString()} real launch films`} cols="lg:grid-cols-5"
        styles={styles.filter(s => s.group === 'launch')} picked={picked} busy={busy} onPick={pickStyle} meta={s => `${s.share}% of films · ~${s.seconds}s`} />
      <StyleGrid title="Beyond launch films" note={`Learned from ${styles.filter(s => s.group === 'beyond').reduce((n, s) => n + s.count, 0)} award-winning and curated films`} cols="lg:grid-cols-3"
        styles={styles.filter(s => s.group === 'beyond')} picked={picked} busy={busy} onPick={pickStyle}
        meta={s => `${s.count} reference films${s.beat ? ` · ${Math.round(s.beat)}s beats` : ''}`} />
      </div>
    </div>
  );
}

function StyleGrid({ title, note, cols, styles, picked, busy, onPick, meta }: {
  title: string; note: string; cols: string; styles: StyleCard[]; picked: Family | null; busy: boolean;
  onPick: (s: StyleCard) => void; meta: (s: StyleCard) => string;
}) {
  if (!styles.length) return null;
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-muted">{note}</p>
      </div>
      <div className={`grid gap-3 grid-cols-2 ${cols}`}>
        {styles.map(s => (
          <button key={s.key} onClick={() => onPick(s)} disabled={busy} aria-pressed={picked === s.key}
            className={`group flex flex-col rounded-2xl border p-4 text-left transition shadow-card disabled:opacity-60
              ${picked === s.key ? 'border-accent bg-accent-soft' : 'border-line bg-panel hover:border-accent/50 hover:-translate-y-px hover:shadow-float'}`}>
            <span className="font-medium">{s.label}</span>
            <span className="mt-1 flex-1 text-sm text-muted line-clamp-3">{s.blurb}</span>
            <span className="mt-3 flex items-center gap-1 text-xs text-muted tabular-nums">
              {meta(s)}
              <ArrowRight size={12} className="ml-auto text-accent opacity-0 transition group-hover:opacity-100" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
