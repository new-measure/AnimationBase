import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { leaderboard, type LeaderRow, type HeadToHead } from '@/server/leaderboard';
import { viewer } from '@/server/auth';
import { Badge, ButtonLink, Card, CardHeader, EmptyState, Page, PageHeader, Stat } from '@/components/ui';
import { Plus, Trophy } from '@/components/icons';

const PROVISIONAL = 10; // fewer battles than this and the win rate is mostly noise
const pct = (n: number) => `${Math.round(n * 100)}%`;
const SEGMENTS = [
  { key: 'wins', label: 'Won', cls: 'bg-good' },
  { key: 'ties', label: 'Tie', cls: 'bg-faint' },
  { key: 'losses', label: 'Lost', cls: 'bg-bad/70' },
  { key: 'bad', label: 'Both bad', cls: 'bg-warn/70' },
] as const;

export default async function Leaderboard() {
  await connection();
  if (!(await viewer()).admin) notFound();
  const { votes, rows, h2h } = await leaderboard();
  const decisive = rows.reduce((s, r) => s + r.wins, 0);
  const bothBad = votes ? rows.reduce((s, r) => s + r.bad, 0) / 2 / votes : 0;

  return (
    <Page className="grid gap-6">
      <PageHeader eyebrow="Arena" title="Leaderboard"
        description="Two models build the same storyboard and the viewer picks the better film, blind. Every vote from every user counts here."
        actions={
          <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-panel shadow-card">
            <Stat label="Votes" value={votes.toLocaleString()} />
            <Stat label="Models" value={rows.length} />
            <Stat label="Decisive" value={votes ? pct(decisive / votes) : '—'} hint={votes ? `${pct(bothBad)} both bad` : undefined} />
          </div>
        } />

      {rows.length === 0 ? (
        <EmptyState icon={<Trophy size={20} />} title="No votes yet" action={<ButtonLink href="/" icon={<Plus size={14} />}>New video</ButtonLink>}>
          Make a video and pick a winner in the arena. Results show up here.
        </EmptyState>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="hidden sm:grid grid-cols-[3rem_minmax(0,1fr)_11rem_12rem_4.5rem] gap-4 px-5 py-3 border-b border-line bg-sunken/50 text-xs font-medium text-muted">
              <span>Rank</span><span>Model</span><span>Win rate</span><span>Record</span><span className="text-right">Battles</span>
            </div>
            <ol className="divide-y divide-line">
              {rows.map((r, i) => <Row key={r.model} r={r} rank={i + 1} />)}
            </ol>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 border-t border-line text-xs text-muted">
              {SEGMENTS.map(s => <span key={s.key} className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${s.cls}`} />{s.label}</span>)}
              <span className="sm:ml-auto">Win rate = (wins + ½ ties) ÷ battles. “Both bad” counts against both.</span>
            </div>
          </Card>

          {rows.length > 1 && <Matrix rows={rows} h2h={h2h} />}
        </>
      )}
    </Page>
  );
}

function Row({ r, rank }: { r: LeaderRow; rank: number }) {
  const medal = rank === 1 ? 'bg-accent text-accent-ink' : rank <= 3 ? 'bg-accent-soft text-accent' : 'text-muted';
  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:grid-cols-[3rem_minmax(0,1fr)_11rem_12rem_4.5rem] items-center gap-x-4 gap-y-2 px-5 py-4 hover:bg-sunken/40 transition-colors">
      <span className={`size-8 rounded-full grid place-items-center text-sm font-semibold tabular-nums ${medal}`}>{rank}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{r.label}</span>
          {r.battles < PROVISIONAL && <Badge title={`Under ${PROVISIONAL} battles: the win rate is still noisy`}>provisional</Badge>}
        </div>
        {r.provider && <p className="text-xs text-faint capitalize">{r.provider}</p>}
      </div>
      <div className="flex items-center gap-3 justify-end sm:justify-start">
        <span className="w-10 text-right text-lg font-semibold tabular-nums tracking-tight">{pct(r.score)}</span>
        <div className="hidden sm:block h-1.5 flex-1 rounded-full bg-sunken overflow-hidden">
          <div className="h-full rounded-full bg-accent" style={{ width: pct(r.score) }} />
        </div>
      </div>
      <div className="col-span-2 sm:col-span-1 col-start-2 sm:col-start-auto">
        <div className="flex h-1.5 gap-px rounded-full overflow-hidden bg-sunken">
          {SEGMENTS.map(s => r[s.key] > 0 && <div key={s.key} className={s.cls} style={{ width: `${(r[s.key] / r.battles) * 100}%` }} />)}
        </div>
        <p className="mt-1.5 text-xs text-muted tabular-nums">
          {r.wins}W · {r.ties}T · {r.losses}L{r.bad > 0 && <> · {r.bad} both bad</>}
          <span className="sm:hidden"> · {r.battles} battles</span>
        </p>
      </div>
      <span className="hidden sm:block text-right text-sm tabular-nums">{r.battles}</span>
    </li>
  );
}

// how each row model did against each column model
function Matrix({ rows, h2h }: { rows: LeaderRow[]; h2h: HeadToHead }) {
  return (
    <Card className="p-5">
      <CardHeader title="Head to head" description="Win rate of the row model against the column model, with the number of battles." />
      <div className="mt-4 overflow-x-auto">
        <table className="text-sm border-separate border-spacing-1">
          <thead>
            <tr>
              <th />
              {rows.map(c => <th key={c.model} className="px-2 pb-1 text-xs font-medium text-muted text-center max-w-28 truncate" title={c.label}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.model}>
                <th className="pr-3 text-left text-xs font-medium whitespace-nowrap">{r.label}</th>
                {rows.map(c => {
                  if (r.model === c.model) return <td key={c.model} className="h-12 min-w-20 rounded-lg bg-sunken/60" />;
                  const x = h2h[r.model]?.[c.model];
                  const n = x ? x.wins + x.losses + x.ties + x.bad : 0;
                  if (!n) return <td key={c.model} className="h-12 min-w-20 rounded-lg border border-dashed border-line text-center text-xs text-faint">—</td>;
                  const s = (x.wins + x.ties / 2) / n;
                  const tone = s > 0.55 ? 'bg-good-soft text-good' : s < 0.45 ? 'bg-warn-soft text-warn' : 'bg-sunken text-ink';
                  return (
                    <td key={c.model} className={`h-12 min-w-20 rounded-lg text-center ${tone}`} title={`${x.wins}W · ${x.ties}T · ${x.losses}L · ${x.bad} both bad`}>
                      <p className="font-semibold tabular-nums leading-tight">{pct(s)}</p>
                      <p className="text-xs opacity-70 tabular-nums">{n} {n === 1 ? 'battle' : 'battles'}</p>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
