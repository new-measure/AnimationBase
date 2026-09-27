// Arena results (admins only): a win counts 1, a tie half for each; "both bad" counts against both.
import { allVotes } from './db';
import { listModels } from './models';

export interface LeaderRow { model: string; label: string; provider: string; battles: number; wins: number; losses: number; ties: number; bad: number; score: number }
// h2h[a][b] = how a did against b
export type HeadToHead = Record<string, Record<string, { wins: number; losses: number; ties: number; bad: number }>>;

export async function leaderboard() {
  const [votes, models] = await Promise.all([allVotes(), listModels()]);
  const info = new Map(models.map(m => [m.id, m]));
  const t: Record<string, LeaderRow> = {};
  const row = (m: string) => (t[m] ||= { model: m, label: info.get(m)?.label ?? m, provider: info.get(m)?.provider ?? '', battles: 0, wins: 0, losses: 0, ties: 0, bad: 0, score: 0 });
  const h2h: HeadToHead = {};
  const cell = (a: string, b: string) => ((h2h[a] ||= {})[b] ||= { wins: 0, losses: 0, ties: 0, bad: 0 });
  for (const v of votes) {
    const a = row(v.model_a), b = row(v.model_b), ab = cell(v.model_a, v.model_b), ba = cell(v.model_b, v.model_a);
    a.battles++; b.battles++;
    if (v.choice === 'A') { a.wins++; b.losses++; ab.wins++; ba.losses++; }
    else if (v.choice === 'B') { b.wins++; a.losses++; ba.wins++; ab.losses++; }
    else if (v.choice === 'tie') { a.ties++; b.ties++; ab.ties++; ba.ties++; }
    else { a.bad++; b.bad++; ab.bad++; ba.bad++; }
  }
  const rows = Object.values(t).map(r => ({ ...r, score: r.battles ? (r.wins + r.ties / 2) / r.battles : 0 }))
    .sort((x, y) => y.score - x.score || y.battles - x.battles);
  return { votes: votes.length, rows, h2h };
}
