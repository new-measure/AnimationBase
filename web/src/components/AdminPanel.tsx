'use client';
// The admin page: which models exist, which pairs meet in the arena (and how often), the planning and studio models,
// and a log of recent runs with their cost. Users never see any of this.
import { useState } from 'react';
import Link from 'next/link';
import { api, ago } from '@/lib/api';
import type { ModelRow, PairRow, Settings } from '@/server/models';
import type { recentRuns, modelTotals } from '@/server/admin';
import { Badge, Button, ButtonLink, Card, CardHeader, Page, PageHeader, Stat, Switch, fieldClass } from './ui';
import { ArrowRight, Plus } from './icons';
import { toast } from './toast';

type Runs = Awaited<ReturnType<typeof recentRuns>>;
type Totals = Awaited<ReturnType<typeof modelTotals>>;
interface Data { models: ModelRow[]; pairs: PairRow[]; settings: Settings; runs: Runs; totals: Totals; users: number }

const THINKING = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'];
const input = `${fieldClass} w-auto py-1.5`;
const STATUS: Record<string, 'good' | 'bad' | 'accent' | 'neutral'> = { done: 'good', failed: 'bad', running: 'accent', queued: 'neutral', cancelled: 'neutral' };
const money = (n: number) => `$${n.toFixed(2)}`;

export default function AdminPanel({ initial }: { initial: Data }) {
  const [d, setD] = useState(initial);
  const label = (id: string) => d.models.find(m => m.id === id)?.label ?? id;
  const act = async <T,>(fn: () => Promise<T>, apply: (r: T) => void, msg = 'Saved') => {
    try { apply(await fn()); toast(msg); } catch (e) { toast.error((e as Error).message); }
  };
  const saveModel = (m: Partial<ModelRow>) => act(() => api<ModelRow[]>('/api/admin/models', 'POST', m), models => setD(x => ({ ...x, models })));
  const savePair = (p: Partial<PairRow>) => act(() => api<PairRow[]>('/api/admin/pairs', 'POST', p), pairs => setD(x => ({ ...x, pairs })));
  const dropPair = (id: number) => act(() => api<PairRow[]>(`/api/admin/pairs?id=${id}`, 'DELETE'), pairs => setD(x => ({ ...x, pairs })), 'Removed');
  const saveSettings = (s: Partial<{ planningModel: string; studioModel: string }>) => act(() => api<Settings>('/api/admin/settings', 'POST', s), settings => setD(x => ({ ...x, settings })));

  const [nm, setNm] = useState({ provider: 'anthropic', modelId: '', label: '' });
  const [np, setNp] = useState({ modelA: '', modelB: '', weight: 1 });
  const enabled = d.models.filter(m => m.enabled);
  const totalCost = d.totals.reduce((s, x) => s + x.costUsd, 0);
  const weightSum = d.pairs.filter(p => p.enabled).reduce((s, p) => s + p.weight, 0);

  return (
    <Page width="wide" className="grid gap-6">
      <PageHeader title="Admin" description="Only admins see model names, the lineup and costs. Users just build and vote."
        actions={<>
          <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-panel shadow-card">
            <Stat label="Users" value={d.users} />
            <Stat label="Runs" value={d.totals.reduce((s, x) => s + x.runs, 0)} />
            <Stat label="Spend" value={money(totalCost)} />
          </div>
          <ButtonLink href="/leaderboard" variant="secondary">Leaderboard <ArrowRight size={14} /></ButtonLink>
        </>} />

      {/* arena lineup */}
      <Card className="p-5">
        <CardHeader title="Arena lineup" description="Each new arena draws one enabled pair, in proportion to its weight. Which model is Film A is random." />
        <div className="mt-4 -mx-5 overflow-x-auto px-5"><table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted border-b border-line [&>th]:pr-3"><th className="py-2 font-medium">Pair</th><th className="font-medium">Weight</th><th className="font-medium">Share</th><th className="font-medium">On</th><th /></tr></thead>
          <tbody>
            {d.pairs.map(p => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-sunken/40 [&>td]:pr-3">
                <td className="py-2.5">{label(p.modelA)} <span className="text-muted">vs</span> {label(p.modelB)}</td>
                <td><input type="number" min={0} defaultValue={p.weight} onBlur={e => +e.target.value !== p.weight && savePair({ ...p, weight: +e.target.value })} className={`${input} w-20`} /></td>
                <td className="tabular-nums text-muted">{p.enabled && weightSum ? `${Math.round(100 * p.weight / weightSum)}%` : '—'}</td>
                <td><Switch label="Pair enabled" checked={p.enabled} onChange={v => savePair({ ...p, enabled: v })} /></td>
                <td className="text-right"><Button variant="danger" size="sm" onClick={() => dropPair(p.id)}>Remove</Button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={np.modelA} onChange={e => setNp({ ...np, modelA: e.target.value })} className={input}><option value="">Model…</option>{enabled.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
          <span className="text-muted text-sm">vs</span>
          <select value={np.modelB} onChange={e => setNp({ ...np, modelB: e.target.value })} className={input}><option value="">Model…</option>{enabled.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
          <input type="number" min={1} value={np.weight} onChange={e => setNp({ ...np, weight: +e.target.value })} className={`${input} w-20`} title="weight" />
          <Button variant="secondary" icon={<Plus size={14} />} disabled={!np.modelA || !np.modelB} onClick={() => { savePair(np); setNp({ modelA: '', modelB: '', weight: 1 }); }}>Add pair</Button>
        </div>
      </Card>

      {/* models */}
      <Card className="p-5">
        <CardHeader title="Models" description="Builds need vision (agents look at their contact sheets). Turning a model off takes it out of every pair at once." />
        <div className="mt-4 -mx-5 overflow-x-auto px-5"><table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted border-b border-line [&>th]:pr-3"><th className="py-2 font-medium">Label</th><th className="font-medium">Provider · API id</th><th className="font-medium">Thinking</th><th className="font-medium">Runs · done · failed</th><th className="font-medium">Avg time · spend</th><th className="font-medium">On</th></tr></thead>
          <tbody>
            {d.models.map(m => {
              const tot = d.totals.find(x => x.model === m.id);
              return (
                <tr key={m.id} className="border-b border-line last:border-0 hover:bg-sunken/40 [&>td]:pr-3">
                  <td className="py-2.5"><input defaultValue={m.label} onBlur={e => e.target.value !== m.label && saveModel({ ...m, label: e.target.value })} className={`${input} w-36`} /></td>
                  <td className="text-muted font-mono text-xs">{m.provider} · {m.modelId}</td>
                  <td><select value={m.thinking} onChange={e => saveModel({ ...m, thinking: e.target.value })} className={input}>{THINKING.map(x => <option key={x}>{x}</option>)}</select></td>
                  <td className="tabular-nums text-muted">{tot ? `${tot.runs} · ${tot.done} · ${tot.failed}` : '—'}</td>
                  <td className="tabular-nums text-muted">{tot ? `${tot.avgMinutes.toFixed(0)} min · ${money(tot.costUsd)}` : '—'}</td>
                  <td><Switch label="Model enabled" checked={m.enabled} onChange={v => saveModel({ ...m, enabled: v })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={nm.provider} onChange={e => setNm({ ...nm, provider: e.target.value })} className={input}><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option></select>
          <input value={nm.modelId} onChange={e => setNm({ ...nm, modelId: e.target.value })} placeholder="API model id, e.g. gpt-5.2" className={`${input} w-56 font-mono`} />
          <input value={nm.label} onChange={e => setNm({ ...nm, label: e.target.value })} placeholder="Label" className={`${input} w-36`} />
          <Button variant="secondary" icon={<Plus size={14} />} disabled={!nm.modelId.trim() || !nm.label.trim()} onClick={() => { saveModel({ ...nm, thinking: 'high' }); setNm({ provider: nm.provider, modelId: '', label: '' }); }}>Add model</Button>
          <span className="text-xs text-muted">The id must be in Pi’s catalog. Smoke-test a new model (scripts/pi-smoke.ts) before turning it on.</span>
        </div>
      </Card>

      {/* settings */}
      <Card className="p-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold">Planning model</span>
          <span className="text-xs text-muted">Writes every storyboard, with web search. Must be Anthropic.</span>
          <select value={d.models.find(m => m.modelId === d.settings.planningModel && m.provider === 'anthropic')?.id ?? ''} onChange={e => saveSettings({ planningModel: e.target.value })} className={input}>
            {d.models.filter(m => m.provider === 'anthropic').map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold">Studio revisions</span>
          <span className="text-xs text-muted">Who makes the changes users ask for after the arena.</span>
          <select value={d.settings.studioModel} onChange={e => saveSettings({ studioModel: e.target.value })} className={input}>
            <option value="winner">The model that won (default)</option>
            {enabled.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
      </Card>

      {/* recent runs */}
      <Card className="p-5">
        <CardHeader title="Recent runs" description="The last 40, newest first." />
        <div className="mt-4 -mx-5 overflow-x-auto px-5"><table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-muted border-b border-line [&>th]:pr-3"><th className="py-2 font-medium">When</th><th className="font-medium">User</th><th className="font-medium">Film</th><th className="font-medium">Model</th><th className="font-medium">Status</th><th className="font-medium text-right">Time · cost</th></tr></thead>
          <tbody>
            {d.runs.map(r => (
              <tr key={r.id} className="border-b border-line last:border-0 align-top hover:bg-sunken/40 [&>td]:pr-3 [&>td]:py-2.5">
                <td className="py-2 text-muted whitespace-nowrap">{r.startedAt ? ago(r.startedAt) : 'queued'}</td>
                <td className="text-muted truncate max-w-40">{r.email ?? '—'}</td>
                <td className="max-w-72"><Link href={`/p/${r.projectId}`} className="hover:text-accent line-clamp-1">{r.prompt}</Link><span className="text-xs text-muted">Film {r.slot} · v{r.version}</span></td>
                <td>{label(r.model)}</td>
                <td><Badge tone={STATUS[r.status] ?? 'neutral'} title={r.error ?? ''}>{r.status}</Badge></td>
                <td className="text-right tabular-nums text-muted whitespace-nowrap">{r.startedAt && r.finishedAt ? `${Math.round((r.finishedAt - r.startedAt) / 60000)} min · ` : ''}{money(r.costUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>
    </Page>
  );
}
