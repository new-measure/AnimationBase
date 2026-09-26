import { connection } from 'next/server';
import { leaderboard } from '@/server/leaderboard';
import { modelLabel } from '@/lib/models';

export default async function Leaderboard() {
  await connection();
  const { votes, rows } = leaderboard();
  return (
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-sm text-muted">Blind arena votes: the same storyboard built by two models, the viewer picks the better film. {votes} {votes === 1 ? 'vote' : 'votes'} so far.</p>
      {rows.length === 0 ? <p className="mt-8 text-sm text-muted">No votes yet. Make a video and vote in the arena.</p> : (
        <table className="mt-6 w-full text-sm">
          <thead><tr className="text-left text-muted border-b border-line">
            <th className="py-2 font-medium">#</th><th className="font-medium">Model</th><th className="font-medium text-right">Win rate</th>
            <th className="font-medium text-right">Battles</th><th className="font-medium text-right">W / T / both bad</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.model} className="border-b border-line">
              <td className="py-3 text-muted">{i + 1}</td>
              <td className="font-medium">{modelLabel(r.model)}</td>
              <td className="text-right">
                <div className="inline-flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-sunken overflow-hidden"><div className="h-full bg-accent" style={{ width: `${r.score * 100}%` }} /></div>
                  {(r.score * 100).toFixed(0)}%
                </div>
              </td>
              <td className="text-right tabular-nums">{r.battles}</td>
              <td className="text-right tabular-nums text-muted">{r.wins} / {r.ties} / {r.bad}</td>
            </tr>))}</tbody>
        </table>
      )}
    </div>
  );
}
