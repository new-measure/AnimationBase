'use client';
// Step 2: the storyboard checkpoint. Nothing is built until the user approves the shots, so a wrong idea costs a
// minute here instead of two agent runs. Approving starts the arena.
import { useState } from 'react';
import type { Project, Shot, Storyboard } from '@/lib/types';
import type { FamilyStats } from '@/server/catalog';
import { Badge, Button, Card, Page, Textarea } from './ui';
import { ArrowRight } from './icons';

function Editable({ value, onSave, className = '', multiline, placeholder }: { value: string; onSave: (v: string) => void; className?: string; multiline?: boolean; placeholder?: string }) {
  const common = { defaultValue: value, placeholder, onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (e.target.value !== value) onSave(e.target.value); } };
  const cls = `w-full bg-transparent rounded-md px-1.5 -mx-1.5 py-0.5 outline-none hover:bg-sunken focus:bg-sunken focus:ring-1 focus:ring-accent placeholder:text-faint ${className}`;
  return multiline ? <textarea {...common} rows={2} className={`${cls} resize-y field-sizing-content`} /> : <input {...common} className={cls} />;
}

export default function StoryboardStep({ project, family, onSave, onRevise, onStart, busy }: {
  project: Project; family: Omit<FamilyStats, 'byCategory'> | null;
  onSave: (s: Storyboard) => void; onRevise: (change: string) => Promise<void>;
  onStart: () => Promise<void>; busy: '' | 'revise' | 'start';
}) {
  const s = project.storyboard!, len = project.brief!.length;
  const [change, setChange] = useState('');
  const upd = (i: number, p: Partial<Shot>) => onSave({ ...s, shots: s.shots.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const avgShot = s.shots.length ? len / s.shots.length : 0;

  return (
    <Page width="wide" className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-accent">Storyboard · {s.shots.length} shots · {len}s</p>
        <Editable value={s.title} onSave={v => onSave({ ...s, title: v })} className="text-2xl sm:text-3xl font-semibold tracking-tight" />
        <Editable value={s.logline} onSave={v => onSave({ ...s, logline: v })} className="mt-1 text-base text-muted" multiline />

        {/* the film at a glance, with the genre's measured cut rhythm underneath */}
        <div className="mt-6">
          <div className="flex h-10 rounded-lg overflow-hidden ring-1 ring-line bg-panel">
            {s.shots.map((sh, i) => (
              <a key={sh.id} href={`#shot-${sh.id}`} style={{ width: `${((sh.t1 - sh.t0) / len) * 100}%` }}
                className={`flex items-center px-2 text-xs whitespace-nowrap overflow-hidden border-r border-panel transition-colors ${i % 2 ? 'bg-accent/20' : 'bg-accent/10'} hover:bg-accent/30`}>
                <b className="mr-1.5 font-semibold">{sh.id}</b><span className="truncate text-muted">{sh.name}</span>
              </a>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-faint tabular-nums"><span>0s</span><span>{len / 2}s</span><span>{len}s</span></div>
          {family?.pacing && (
            <p className="mt-3 text-sm text-muted text-pretty">
              {s.shots.length} shots, ~{avgShot.toFixed(1)}s each. Real {family.label} films cut every {family.pacing.shot}s with beats of ~{Math.round(family.pacing.beat)}s,
              {family.group === 'beyond' ? ' so each shot holds long enough to be read, one change at a time.' : ' so shots here usually hold several quick moves.'}
            </p>
          )}
        </div>

        <Card className="mt-5 px-5 py-4">
          <p className="text-sm font-semibold">Look</p>
          <Editable value={s.look} onSave={v => onSave({ ...s, look: v })} className="mt-1 text-sm text-muted" multiline />
        </Card>

        <div className="mt-4 grid gap-3">
          {s.shots.map((sh, i) => (
            <Card key={sh.id} className="px-5 py-4 scroll-mt-20">
              <div id={`shot-${sh.id}`} className="flex items-center gap-3">
                <span className="size-7 shrink-0 rounded-lg bg-ink text-bg grid place-items-center text-xs font-semibold">{sh.id}</span>
                <Editable value={sh.name} onSave={v => upd(i, { name: v })} className="font-medium" />
                <Badge className="ml-auto shrink-0 tabular-nums">{sh.t0}–{sh.t1}s</Badge>
              </div>
              <div className="mt-3 grid gap-3 text-sm">
                <Editable value={sh.action} onSave={v => upd(i, { action: v })} multiline />
                <div className="grid grid-cols-[88px_1fr] items-baseline gap-x-3 gap-y-1.5 border-t border-line pt-3">
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
        <Card className="p-5 border-accent/40">
          <p className="text-base font-semibold tracking-tight">Build it in the arena</p>
          <p className="mt-1 text-sm text-muted">Two versions of your film are built side by side from this storyboard. Watch both, then keep the one you like.</p>
          <Button size="lg" className="mt-4 w-full" disabled={!!busy && busy !== 'start'} loading={busy === 'start'} onClick={onStart}>
            {busy === 'start' ? 'Starting…' : <>Approve and start the arena <ArrowRight /></>}
          </Button>
          <p className="mt-2.5 text-xs text-muted">Usually 10–30 minutes. You can leave and come back.</p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold">Ask for changes</p>
          <Textarea value={change} onChange={e => setChange(e.target.value)} rows={3} disabled={!!busy} className="mt-2"
            placeholder="“Make the opening calmer” · “Add a shot showing the mobile app” · “Shorter end card”" />
          <Button variant="secondary" className="mt-2 w-full" disabled={!change.trim() || (!!busy && busy !== 'revise')} loading={busy === 'revise'}
            onClick={async () => { await onRevise(change); setChange(''); }}>
            {busy === 'revise' ? 'Revising…' : 'Revise storyboard'}
          </Button>
          <p className="mt-2.5 text-xs text-muted">Or click any text on the left to edit it directly.</p>
        </Card>
      </aside>
    </Page>
  );
}
