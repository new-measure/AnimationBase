'use client';
// Step 2: the storyboard checkpoint. Nothing is built until the user approves the shots, so a wrong idea costs a
// minute here instead of two agent runs. Approving starts the arena.
import { useState } from 'react';
import type { Project, Shot, Storyboard } from '@/lib/types';
import type { FamilyStats } from '@/server/catalog';
import { MODELS } from '@/lib/models';
import { Button, Card, Spinner } from './ui';

const EFFORTS = [{ v: 'medium', l: 'Quick draft' }, { v: 'high', l: 'Standard' }, { v: 'xhigh', l: 'Extra care' }];

function Editable({ value, onSave, className = '', multiline, placeholder }: { value: string; onSave: (v: string) => void; className?: string; multiline?: boolean; placeholder?: string }) {
  const common = { defaultValue: value, placeholder, onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (e.target.value !== value) onSave(e.target.value); } };
  const cls = `w-full bg-transparent rounded-md px-1.5 -mx-1.5 py-0.5 outline-none hover:bg-sunken focus:bg-sunken focus:ring-1 focus:ring-accent placeholder:text-faint ${className}`;
  return multiline ? <textarea {...common} rows={2} className={`${cls} resize-y field-sizing-content`} /> : <input {...common} className={cls} />;
}

export default function StoryboardStep({ project, family, onSave, onRevise, onStart, busy }: {
  project: Project; family: Omit<FamilyStats, 'byCategory'> | null;
  onSave: (s: Storyboard) => void; onRevise: (change: string) => Promise<void>;
  onStart: (models: string[], effort: string) => Promise<void>; busy: '' | 'revise' | 'start';
}) {
  const s = project.storyboard!, len = project.brief!.length;
  const [change, setChange] = useState('');
  const [models, setModels] = useState<string[]>([MODELS[0].id, MODELS[1].id]);
  const [effort, setEffort] = useState('high');
  const upd = (i: number, p: Partial<Shot>) => onSave({ ...s, shots: s.shots.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const avgShot = s.shots.length ? len / s.shots.length : 0;

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <Editable value={s.title} onSave={v => onSave({ ...s, title: v })} className="text-2xl font-semibold tracking-tight" />
        <Editable value={s.logline} onSave={v => onSave({ ...s, logline: v })} className="mt-1 text-muted" multiline />

        {/* the film at a glance, with the genre's measured cut rhythm underneath */}
        <div className="mt-6">
          <div className="flex h-9 rounded-lg overflow-hidden ring-1 ring-line">
            {s.shots.map((sh, i) => (
              <a key={sh.id} href={`#shot-${sh.id}`} style={{ width: `${((sh.t1 - sh.t0) / len) * 100}%` }}
                className={`flex items-center px-2 text-xs whitespace-nowrap overflow-hidden border-r border-bg ${i % 2 ? 'bg-accent/20' : 'bg-accent/10'} hover:bg-accent/30`}>
                <b className="mr-1">{sh.id}</b>{sh.name}
              </a>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-faint tabular-nums"><span>0s</span><span>{len / 2}s</span><span>{len}s</span></div>
          {family?.pacing && (
            <p className="mt-2 text-xs text-muted">
              {s.shots.length} shots, ~{avgShot.toFixed(1)}s each. Real {family.label} films cut every {family.pacing.shot}s with beats of ~{family.pacing.beat}s,
              so shots here usually hold several quick moves.
            </p>
          )}
        </div>

        <Card className="mt-5 px-5 py-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Look</p>
          <Editable value={s.look} onSave={v => onSave({ ...s, look: v })} className="mt-1 text-sm" multiline />
        </Card>

        <div className="mt-4 grid gap-3">
          {s.shots.map((sh, i) => (
            <Card key={sh.id} className="px-5 py-4 scroll-mt-20">
              <div id={`shot-${sh.id}`} className="flex items-center gap-3">
                <span className="size-7 shrink-0 rounded-lg bg-ink text-bg grid place-items-center text-xs font-semibold">{sh.id}</span>
                <Editable value={sh.name} onSave={v => upd(i, { name: v })} className="font-medium" />
                <span className="ml-auto shrink-0 text-xs tabular-nums text-muted">{sh.t0}–{sh.t1}s</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <Editable value={sh.action} onSave={v => upd(i, { action: v })} multiline />
                <div className="grid grid-cols-[88px_1fr] items-baseline gap-2">
                  <span className="text-xs text-muted">On screen</span>
                  <Editable value={sh.text || ''} onSave={v => upd(i, { text: v })} placeholder="no words" className="font-medium" />
                  <span className="text-xs text-muted">Transition</span>
                  <Editable value={sh.transition} onSave={v => upd(i, { transition: v })} className="text-muted" multiline />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 self-start grid gap-4">
        <Card className="p-4">
          <p className="text-sm font-medium">Ask for changes</p>
          <textarea value={change} onChange={e => setChange(e.target.value)} rows={3} disabled={!!busy}
            placeholder="“Make the opening calmer” · “Add a shot showing the mobile app” · “Shorter end card”"
            className="mt-2 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent resize-none" />
          <Button variant="ghost" className="mt-2 w-full" disabled={!change.trim() || !!busy}
            onClick={async () => { await onRevise(change); setChange(''); }}>
            {busy === 'revise' ? <span className="inline-flex items-center gap-2"><Spinner /> Revising…</span> : 'Revise storyboard'}
          </Button>
          <p className="mt-2 text-[11px] text-faint">Or edit any text directly: click it.</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-medium">Build it in the arena</p>
          <p className="mt-1 text-xs text-muted">Two models build this storyboard side by side. You won’t know which is which until you pick the better film.</p>
          <div className="mt-3 grid gap-2">
            {[0, 1].map(i => (
              <label key={i} className="grid grid-cols-[64px_1fr] items-center gap-2 text-sm">
                <span className="text-muted text-xs">Model {i + 1}</span>
                <select value={models[i]} onChange={e => setModels(m => m.map((x, j) => (j === i ? e.target.value : x)))}
                  className="rounded-lg border border-line bg-bg px-2 py-1.5">
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}{m.note ? ` · ${m.note}` : ''}</option>)}
                </select>
              </label>
            ))}
            <label className="grid grid-cols-[64px_1fr] items-center gap-2 text-sm">
              <span className="text-muted text-xs">Effort</span>
              <select value={effort} onChange={e => setEffort(e.target.value)} className="rounded-lg border border-line bg-bg px-2 py-1.5">
                {EFFORTS.map(x => <option key={x.v} value={x.v}>{x.l}</option>)}
              </select>
            </label>
          </div>
          {models[0] === models[1] && <p className="mt-2 text-[11px] text-warn">Same model twice: you’ll compare two takes.</p>}
          <Button className="mt-4 w-full" disabled={!!busy} onClick={() => onStart(models, effort)}>
            {busy === 'start' ? <span className="inline-flex items-center gap-2"><Spinner /> Starting…</span> : 'Approve & start arena →'}
          </Button>
          <p className="mt-2 text-[11px] text-faint">A build usually takes 10–30 minutes. You can leave this page and come back.</p>
        </Card>
      </aside>
    </div>
  );
}
