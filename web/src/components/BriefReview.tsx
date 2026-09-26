'use client';
// Step 1: "here's what I understood". Everything is already filled in, from the prompt (said / guessed) or from what
// real launch films of this style usually do (from catalog), so most people just continue.
import { useState, type ReactNode } from 'react';
import type { Brief, Project } from '@/lib/types';
import type { FamilyStats } from '@/server/catalog';
import { Button, Card, Spinner } from './ui';

type FamilyCard = Omit<FamilyStats, 'byCategory'>;
const FORMATS = [{ v: 'landscape', l: '16:9', d: 'Landscape' }, { v: 'square', l: '1:1', d: 'Square' }, { v: 'portrait', l: '9:16', d: 'Reel' }] as const;

function Badge({ s }: { s?: string }) {
  if (s === 'said') return <span className="rounded-full bg-good-soft text-good px-2 py-0.5 text-[11px] font-medium">you said</span>;
  if (s === 'guessed') return <span className="rounded-full bg-warn-soft text-warn px-2 py-0.5 text-[11px] font-medium">guessed</span>;
  if (s === 'default') return <span className="rounded-full bg-accent-soft text-accent px-2 py-0.5 text-[11px] font-medium">from catalog</span>;
  return null;
}

function Row({ label, source, why, children, editor }: { label: string; source?: string; why?: string; children: ReactNode; editor?: (done: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[130px_1fr_auto] gap-x-4 gap-y-1 py-3.5 border-b border-line last:border-0 items-start">
      <span className="text-sm text-muted pt-0.5">{label}</span>
      <div className="min-w-0">
        {open && editor ? editor(() => setOpen(false)) : <div className="text-[15px]">{children}</div>}
        {why && !open && <p className="mt-0.5 text-xs text-faint">why: {why}</p>}
      </div>
      <div className="col-start-2 sm:col-start-3 flex items-center gap-2 sm:justify-end">
        <Badge s={source} />
        {editor && !open && <button onClick={() => setOpen(true)} className="text-xs text-muted hover:text-accent">Edit</button>}
      </div>
    </div>
  );
}

function TextEdit({ value, onSave, done, multiline }: { value: string; onSave: (v: string) => void; done: () => void; multiline?: boolean }) {
  const [v, setV] = useState(value);
  const save = () => { if (v.trim() !== value) onSave(v.trim()); done(); };
  const cls = 'w-full rounded-lg border border-accent bg-bg px-2.5 py-1.5 text-[15px] outline-none';
  return multiline
    ? <textarea autoFocus value={v} rows={2} onChange={e => setV(e.target.value)} onBlur={save} className={cls} />
    : <input autoFocus value={v} onChange={e => setV(e.target.value)} onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') done(); }} className={cls} />;
}

function Seg<T extends string>({ value, options, onPick }: { value: T; options: { v: T; l: string }[]; onPick: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-sunken p-0.5">
      {options.map(o => (
        <button key={o.v} onClick={() => onPick(o.v)} className={`rounded-md px-3 py-1 text-sm ${value === o.v ? 'bg-panel shadow-sm font-medium' : 'text-muted hover:text-ink'}`}>{o.l}</button>
      ))}
    </div>
  );
}

export default function BriefReview({ project, families, categories, onPatch, onNext, busy }: {
  project: Project; families: FamilyCard[]; categories: string[];
  onPatch: (b: Partial<Brief>) => Promise<void>; onNext: () => void; busy: boolean;
}) {
  const b = project.brief!;
  const fam = families.find(f => f.key === b.family);
  const [brandOpen, setBrandOpen] = useState(false), [refsOpen, setRefsOpen] = useState(false);
  const set = (p: Partial<Brief>) => { onPatch(p); };

  return (
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
      <p className="text-sm text-muted">You said</p>
      <p className="mt-1 text-xl font-medium">“{project.prompt}”</p>

      <h2 className="mt-8 text-sm font-medium">Here’s what I understood <span className="text-muted font-normal">· click Edit on anything to change it</span></h2>
      <Card className="mt-3 px-5">
        <Row label="Product" source={b.source.product} editor={d => <TextEdit value={b.product} onSave={v => set({ product: v })} done={d} />}>{b.product}</Row>
        <Row label="Message" source={b.source.message} editor={d => <TextEdit value={b.message} onSave={v => set({ message: v })} done={d} multiline />}>“{b.message}”</Row>
        <Row label="Audience" source={b.source.audience} editor={d => <TextEdit value={b.audience} onSave={v => set({ audience: v })} done={d} />}>{b.audience}</Row>
        <Row label="Category" source={b.source.category} editor={d => (
          <select autoFocus value={b.category} onChange={e => { set({ category: e.target.value }); d(); }} onBlur={d} className="rounded-lg border border-accent bg-bg px-2 py-1.5">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        )}>{b.category}</Row>
        <Row label="Style" source={b.source.family} why={b.why.family} editor={d => (
          <div className="grid gap-2 sm:grid-cols-2">
            {families.map(f => (
              <button key={f.key} onClick={() => { if (f.key !== b.family) set({ family: f.key }); d(); }}
                className={`text-left rounded-xl border p-3 ${f.key === b.family ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent'}`}>
                <p className="font-medium text-sm">{f.label}</p>
                <p className="text-xs text-muted mt-0.5">{f.blurb}</p>
                <p className="text-[11px] text-faint mt-1.5">{f.share}% of launch films · ~{Math.round(f.pacing?.length ?? f.medianSeconds ?? 30)}s</p>
              </button>
            ))}
          </div>
        )}>
          <span className="font-medium">{fam?.label}</span>
          {fam && <span className="text-muted text-sm"> · {fam.blurb}</span>}
        </Row>
        <Row label="Length" source={b.source.length} why={b.why.length} editor={d => (
          <div className="flex items-center gap-3">
            <input type="range" min={10} max={60} step={5} defaultValue={b.length} onMouseUp={e => { set({ length: +(e.target as HTMLInputElement).value }); d(); }}
              onKeyUp={e => { if (e.key === 'Enter') { set({ length: +(e.target as HTMLInputElement).value }); d(); } }} className="flex-1 accent-[var(--accent)]" />
            <button onClick={d} className="text-xs text-muted">Cancel</button>
          </div>
        )}>{b.length}s</Row>
        <Row label="Format" source={b.source.format} why={b.why.format}>
          <Seg value={b.format} options={FORMATS.map(f => ({ v: f.v, l: `${f.l} ${f.d}` }))} onPick={v => v !== b.format && set({ format: v })} />
        </Row>
        <Row label="Look" source={[b.source.theme, b.source.textLevel].includes('said') ? 'said' : b.source.theme} why={[b.why.theme, b.why.cursor].filter(Boolean).join('; ')}>
          <div className="flex flex-wrap items-center gap-2">
            <Seg value={b.theme} options={[{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }]} onPick={v => v !== b.theme && set({ theme: v })} />
            <Seg value={b.textLevel} options={[{ v: 'none', l: 'No text' }, { v: 'some', l: 'Some text' }, { v: 'dominant', l: 'Type-heavy' }]} onPick={v => v !== b.textLevel && set({ textLevel: v })} />
            <label className="inline-flex items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={b.cursor} onChange={e => set({ cursor: e.target.checked })} className="accent-[var(--accent)]" /> Cursor
            </label>
          </div>
        </Row>
        <Row label="End card" source={b.source.cta} editor={d => <TextEdit value={b.cta} onSave={v => set({ cta: v })} done={d} />}>{b.cta}</Row>
        {b.notes && <Row label="Notes" source="said" editor={d => <TextEdit value={b.notes} onSave={v => set({ notes: v })} done={d} multiline />}>{b.notes}</Row>}
      </Card>

      <Card className="mt-3">
        <button onClick={() => setBrandOpen(o => !o)} className="w-full flex items-center px-5 py-3.5 text-sm">
          <span>{brandOpen ? '▾' : '▸'} Add brand <span className="text-muted">(logo colours, font)</span></span>
          <span className="ml-auto text-xs text-faint">optional</span>
        </button>
        {brandOpen && (
          <div className="px-5 pb-4 grid gap-3 sm:grid-cols-2 text-sm">
            <label className="grid gap-1"><span className="text-muted text-xs">Colours (hex, comma separated)</span>
              <input defaultValue={b.brand.colors.join(', ')} placeholder="#5B4BDB, #111111" className="rounded-lg border border-line bg-bg px-2.5 py-1.5"
                onBlur={e => set({ brand: { ...b.brand, colors: e.target.value.split(/[\s,]+/).filter(c => /^#?[0-9a-f]{3,8}$/i.test(c)).map(c => c.startsWith('#') ? c : '#' + c) } })} />
            </label>
            <label className="grid gap-1"><span className="text-muted text-xs">Font (any Google Font)</span>
              <input defaultValue={b.brand.font} placeholder="Inter" className="rounded-lg border border-line bg-bg px-2.5 py-1.5"
                onBlur={e => set({ brand: { ...b.brand, font: e.target.value.trim() } })} />
            </label>
            {b.brand.colors.length > 0 && <div className="flex gap-1.5">{b.brand.colors.map(c => <span key={c} className="size-6 rounded-md ring-1 ring-line" style={{ background: c }} />)}</div>}
          </div>
        )}
      </Card>

      <Card className="mt-3">
        <button onClick={() => setRefsOpen(o => !o)} className="w-full flex items-center px-5 py-3.5 text-sm">
          <span>{refsOpen ? '▾' : '▸'} Similar launch films the agents will learn from <span className="text-muted">({project.similar.length})</span></span>
          <span className="ml-auto text-xs text-faint">patterns only, never copied</span>
        </button>
        {refsOpen && (
          <ul className="px-5 pb-4 grid gap-2.5">
            {project.similar.map(s => (
              <li key={s.slug} className="text-sm">
                <a href={s.x} target="_blank" rel="noreferrer" className="font-medium hover:text-accent">{s.title} ↗</a>
                <p className="text-xs text-muted">{s.category}{s.seconds ? ` · ${s.seconds}s` : ''} · {s.bg} · {s.note}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-8 flex items-center gap-4">
        {fam?.pacing && <p className="text-xs text-muted">Real {fam.label} films cut every ~{fam.pacing.shot}s and end on a {fam.pacing.endCard}s end card. The storyboard will follow that.</p>}
        <Button onClick={onNext} disabled={busy} className="ml-auto shrink-0">
          {busy ? <span className="inline-flex items-center gap-2"><Spinner /> Writing the storyboard…</span> : 'Looks good · storyboard it →'}
        </Button>
      </div>
    </div>
  );
}
