import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { viewer } from '@/server/auth';
import { listModels, listPairs, getSettings } from '@/server/models';
import { recentRuns, modelTotals, userCount } from '@/server/admin';
import AdminPanel from '@/components/AdminPanel';

// Admins only: the model registry, the arena lineup, settings, and what's been running.
export default async function Admin() {
  await connection();
  if (!(await viewer()).admin) notFound();
  const [models, pairs, settings, runs, totals, users] = await Promise.all([listModels(), listPairs(), getSettings(), recentRuns(40), modelTotals(), userCount()]);
  return <AdminPanel initial={{ models, pairs, settings, runs, totals, users }} />;
}
