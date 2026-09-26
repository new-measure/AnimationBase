// Arena results: a win counts 1, a tie half for each; "both bad" counts against both.
import { allVotes } from './db';

export function leaderboard() {
  const t: Record<string, { model: string; battles: number; wins: number; ties: number; bad: number }> = {};
  const row = (m: string) => (t[m] ||= { model: m, battles: 0, wins: 0, ties: 0, bad: 0 });
  const votes = allVotes();
  for (const v of votes) {
    const a = row(v.model_a), b = row(v.model_b);
    a.battles++; b.battles++;
    if (v.choice === 'A') a.wins++; else if (v.choice === 'B') b.wins++;
    else if (v.choice === 'tie') { a.ties++; b.ties++; } else { a.bad++; b.bad++; }
  }
  const rows = Object.values(t).map(r => ({ ...r, score: r.battles ? (r.wins + r.ties / 2) / r.battles : 0 })).sort((x, y) => y.score - x.score);
  return { votes: votes.length, rows };
}
