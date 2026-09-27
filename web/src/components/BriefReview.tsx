'use client';
// Step 1: "here's what I understood". Everything is already filled in, from the prompt (said / guessed) or from what
// real films of this style usually do (from catalog), so most people just continue. Launch films and the genres
// beyond them share one brief; its labels follow the genre (Product → Topic, End card → Source, ...).
import { useState, type ReactNode } from 'react';
import { FIELD_LABELS, LENGTHS, type Brief, type Project } from '@/lib/types';
import type { FamilyStats } from '@/server/catalog';
import { Badge, Button, Card, CardHeader, Disclosure, Field, InfoTip, Input, Page, Segmented, Select, fieldClass } from './ui';
import { ArrowRight, External, Globe } from './icons';

type FamilyCard = Omit<FamilyStats, 'byCategory'>;
const FORMATS = [{ v: 'landscape', l: '16:9', d: 'Landscape' }, { v: 'square', l: '1:1', d: 'Square' }, { v: 'portrait', l: '9:16', d: 'Reel' }] as const;
const SOURCE = { said: { l: 'you said', tone: 'good' }, guessed: { l: 'guessed', tone: 'warn' }, default: { l: 'from catalog', tone: 'accent' } } as const;

function Row({ label, source, why, children, editor }: { label: string; source?: string; why?: string; children: ReactNode; editor?: (done: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const src = SOURCE[source as keyof typeof SOURCE];
  return (
    <div className="group grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr_auto] gap-x-4 gap-y-1.5 py-4 border-b border-line last:border-0 items-start">
      <span className="flex items-center gap-1.5 pt-0.5 text-sm text-muted">{label}{why && <InfoTip text={why} />}</span>
      <div className="min-w-0">
        {open && editor ? editor(() => setOpen(false)) : <div className="text-[0.9375rem]">{children}</div>}
      </div>
      <div className="col-start-2 sm:col-start-3 flex items-center gap-2 sm:justify-end">
        {src && <Badge tone={src.tone}>{src.l}</Badge>}
        {editor && !open && (
          <button onClick={() => setOpen(true)} className="rounded-md px-1.5 py-0.5 text-xs font-medium text-muted hover:bg-sunken hover:text-accent">Edit</button>
        )}
      </div>
    </div>
  );
}

function TextEdit({ value, onSave, done, multiline }: { value: string; onSave: (v: string) => void; done: () => void; multiline?: boolean }) {
  const [v, setV] = useState(value);
  const save = () => { if (v.trim() !== value) onSave(v.trim()); done(); };
  const keys = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !multiline) { e.preventDefault(); save(); } if (e.key === 'Escape') done(); };
  return multiline
    ? <textarea autoFocus value={v} rows={2} onChange={e => setV(e.target.value)} onBlur={save} onKeyDown={keys} className={`${fieldClass} resize-y field-sizing-content`} />
    : <input autoFocus value={v} onChange={e => setV(e.target.value)} onBlur={save} onKeyDown={keys} className={fieldClass} />;
}

export default function BriefReview({ project, families, categories, onPatch, onNext, busy }: {
  project: Project; families: FamilyCard[]; categories: string[];
  onPatch: (b: Partial<Brief>) => Promise<void>; onNext: () => void; busy: boolean;
}) {
  const b = project.brief!;
  const fam = families.find(f => f.key === b.family);
  const set = (p: Partial<Brief>) => { onPatch(p); };
  const launch = (fam?.group ?? 'launch') === 'launch', L = FIELD_LABELS[b.family] ?? FIELD_LABELS.ui_walkthrough, len = LENGTHS[fam?.group ?? 'launch'];
  const famMeta = (f: FamilyCard) => f.group === 'launch'
    ? `${f.share}% of launch films · ~${Math.round(f.pacing?.length ?? f.medianSeconds ?? 30)}s`
    : `${f.count} reference films · ${Math.round(f.pacing?.beat ?? 0)}s beats`;
  const famButton = (f: FamilyCard, d: () => void) => (
    <button key={f.key} onClick={() => { if (f.key !== b.family) set({ family: f.key }); d(); }}
      className={`text-left rounded-xl border p-3 transition ${f.key === b.family ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent/50'}`}>
      <p className="font-medium text-sm">{f.label}</p>
      <p className="text-xs text-muted mt-0.5">{f.blurb}</p>
      <p className="text-xs text-faint mt-1.5">{famMeta(f)}</p>
    </button>
  );

  return (
    <Page width="narrow" className="grid gap-4">
      <div className="mb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">Your brief</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-balance">“{project.prompt}”</p>
      </div>

      <Card className="px-5 pt-4">
        <CardHeader title="Here’s what I understood" description="Most of this is ready as is. Edit anything that’s off." />
        <div className="mt-2">
          <Row label={L.product} source={b.source.product} editor={d => <TextEdit value={b.product} onSave={v => set({ product: v })} done={d} />}>{b.product}</Row>
          <Row label="Message" source={b.source.message} editor={d => <TextEdit value={b.message} onSave={v => set({ message: v })} done={d} multiline />}>“{b.message}”</Row>
          <Row label="Audience" source={b.source.audience} editor={d => <TextEdit value={b.audience} onSave={v => set({ audience: v })} done={d} />}>{b.audience}</Row>
          {launch && <Row label="Category" source={b.source.category} editor={d => (
            <Select autoFocus value={b.category} onChange={e => { set({ category: e.target.value }); d(); }} onBlur={d}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </Select>
          )}>{b.category}</Row>}
          <Row label="Style" source={b.source.family} why={b.why.family} editor={d => (
            <div className="grid gap-3">
              {(['launch', 'beyond'] as const).map(g => families.some(f => f.group === g) && (
                <div key={g}>
                  <p className="mb-1.5 text-xs font-medium text-muted">{g === 'launch' ? 'Launch films' : 'Beyond launch films'}</p>
                  <div className="grid gap-2 sm:grid-cols-2">{families.filter(f => f.group === g).map(f => famButton(f, d))}</div>
                </div>
              ))}
            </div>
          )}>
            <span className="font-medium">{fam?.label}</span>
            {fam && <span className="block text-sm text-muted">{fam.blurb}</span>}
          </Row>
          <Row label="Length" source={b.source.length} why={b.why.length} editor={d => (
            <div className="flex items-center gap-3">
              <input type="range" min={len.min} max={len.max} step={len.step} defaultValue={Math.max(len.min, Math.min(len.max, b.length))} onMouseUp={e => { set({ length: +(e.target as HTMLInputElement).value }); d(); }}
                onKeyUp={e => { if (e.key === 'Enter') { set({ length: +(e.target as HTMLInputElement).value }); d(); } }} className="flex-1 accent-[var(--accent)]" />
              <Button variant="quiet" size="sm" onClick={d}>Cancel</Button>
            </div>
          )}><span className="tabular-nums">{b.length}s</span></Row>
          <Row label="Format" source={b.source.format} why={b.why.format}>
            <Segmented value={b.format} options={FORMATS.map(f => ({ v: f.v, l: <>{f.l} <span className="hidden sm:inline">{f.d}</span></> }))} onPick={v => v !== b.format && set({ format: v })} />
          </Row>
          <Row label="Look" source={[b.source.theme, b.source.textLevel].includes('said') ? 'said' : b.source.theme} why={[b.why.theme, b.why.cursor].filter(Boolean).join('; ')}>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented value={b.theme} options={[{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }]} onPick={v => v !== b.theme && set({ theme: v })} />
              <Segmented value={b.textLevel} options={[{ v: 'none', l: 'No text' }, { v: 'some', l: 'Some text' }, { v: 'dominant', l: 'Type-heavy' }]} onPick={v => v !== b.textLevel && set({ textLevel: v })} />
              <label className="inline-flex items-center gap-1.5 px-1 text-sm text-muted">
                <input type="checkbox" checked={b.cursor} onChange={e => set({ cursor: e.target.checked })} className="size-4 accent-[var(--accent)]" /> Cursor
              </label>
            </div>
          </Row>
          <Row label={L.cta} source={b.source.cta} editor={d => <TextEdit value={b.cta} onSave={v => set({ cta: v })} done={d} />}>{b.cta}</Row>
          {b.notes && <Row label="Notes" source="said" editor={d => <TextEdit value={b.notes} onSave={v => set({ notes: v })} done={d} multiline />}>{b.notes}</Row>}
        </div>
      </Card>

      {b.research && (
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Globe className="text-accent" />
            <h2 className="text-base font-semibold tracking-tight">{b.family === 'data_story' ? 'The data I found' : 'What I found online'}</h2>
            {b.research.url && (
              <a href={b.research.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex min-w-0 items-center gap-1 text-xs text-accent hover:underline">
                <span className="truncate">{b.research.url.replace(/^https?:\/\//, '')}</span><External size={12} />
              </a>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed">{b.research.summary}</p>
          {b.research.features.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5">{b.research.features.map(f => <li key={f}><Badge>{f}</Badge></li>)}</ul>}
          {b.research.sources.length > 0 && (
            <p className="mt-3 text-xs text-muted">Sources: {b.research.sources.map((s, i) => <span key={s.url}>{i ? ' · ' : ''}<a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-accent">{s.title || new URL(s.url).hostname}</a></span>)}</p>
          )}
        </Card>
      )}

      <Disclosure title="Add brand" meta="optional · logo colours, font">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Colours" hint="Hex, comma separated">
            <Input defaultValue={b.brand.colors.join(', ')} placeholder="#5B4BDB, #111111"
              onBlur={e => set({ brand: { ...b.brand, colors: e.target.value.split(/[\s,]+/).filter(c => /^#?[0-9a-f]{3,8}$/i.test(c)).map(c => c.startsWith('#') ? c : '#' + c) } })} />
          </Field>
          <Field label="Font" hint="Any Google Font">
            <Input defaultValue={b.brand.font} placeholder="Inter" onBlur={e => set({ brand: { ...b.brand, font: e.target.value.trim() } })} />
          </Field>
          {b.brand.colors.length > 0 && <div className="flex gap-1.5">{b.brand.colors.map(c => <span key={c} title={c} className="size-7 rounded-lg ring-1 ring-line" style={{ background: c }} />)}</div>}
        </div>
      </Disclosure>

      <Disclosure title={<>{launch ? 'Similar launch films' : `Reference ${fam?.label.toLowerCase() ?? ''} films`} <span className="font-normal text-muted">({project.similar.length})</span></>} meta="the agents learn patterns, never copy">
        <ul className="grid gap-3">
          {project.similar.map(s => (
            <li key={s.slug} className="text-sm">
              <a href={s.x} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium hover:text-accent">{s.title} <External size={12} className="text-muted" /></a>
              <p className="text-xs text-muted">{[s.category === 'Reference' ? s.company : s.category, s.seconds ? (s.seconds >= 90 ? `${Math.round(s.seconds / 60)} min` : `${s.seconds}s`) : '', s.bg, s.note].filter(Boolean).join(' · ')}</p>
            </li>
          ))}
        </ul>
      </Disclosure>

      <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center gap-4">
        {fam?.pacing && <p className="text-sm text-muted text-pretty">{launch
          ? <>Real {fam.label} films cut every ~{fam.pacing.shot}s and end on a {fam.pacing.endCard}s end card. The storyboard will follow that.</>
          : <>Real {fam.label.toLowerCase()} films run ~{Math.round(fam.pacing.length / 60)} min in beats of ~{Math.round(fam.pacing.beat)}s. Yours tells fewer beats at the same pace.</>}</p>}
        <Button onClick={onNext} loading={busy} size="lg" className="sm:ml-auto shrink-0">
          {busy ? 'Writing the storyboard…' : <>Looks good, storyboard it <ArrowRight /></>}
        </Button>
      </div>
    </Page>
  );
}
