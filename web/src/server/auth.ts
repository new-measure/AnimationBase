// Who is making the request, from the WorkOS AuthKit session. Admins are the emails in ADMIN_EMAILS (Infisical).
// Every signed-in user is recorded in `users`, with their role kept in step with that list.
import { withAuth } from '@workos-inc/authkit-nextjs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db, getProject, getRun, listProjects } from './db';
import * as t from './schema';
import type { Project, Run } from '@/lib/types';

export interface Viewer { userId: string | null; email: string | null; name: string | null; admin: boolean }

const ADMINS = () => new Set((process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean));
const seen = new Set<string>();

export async function viewer(): Promise<Viewer> {
  const { user } = await withAuth();
  if (!user) return { userId: null, email: null, name: null, admin: false };
  const email = user.email.toLowerCase(), admin = ADMINS().has(email);
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
  if (!seen.has(user.id + admin)) {
    seen.add(user.id + admin);
    const role = admin ? 'admin' : 'user';
    await db().insert(t.users).values({ id: user.id, email, name, role, createdAt: Date.now() })
      .onConflictDoUpdate({ target: t.users.id, set: { email, name, role } });
  }
  return { userId: user.id, email, name, admin };
}

// Access checks: a project (and its runs) belongs to the user who made it; admins can open everything. Projects made
// before login existed have no owner, so only admins see them.
export class Forbidden extends Error { status = 404; constructor() { super('not found'); } }
export const canSee = (v: Viewer, p: Pick<Project, 'userId'>) => v.admin || (!!v.userId && p.userId === v.userId);

export async function ownProject(id: string): Promise<{ v: Viewer; project: Project }> {
  const [v, project] = await Promise.all([viewer(), getProject(id)]);
  if (!project || !canSee(v, project)) throw new Forbidden();
  return { v, project };
}
export async function ownRun(id: string): Promise<{ v: Viewer; run: Run; project: Project }> {
  const run = await getRun(id);
  if (!run) throw new Forbidden();
  const { v, project } = await ownProject(run.projectId);
  return { v, run, project };
}
export async function requireAdmin(): Promise<Viewer> {
  const v = await viewer();
  if (!v.admin) throw new Forbidden();
  return v;
}

// Preview links. The preview runs in an iframe sandboxed without same-origin rights, so the browser doesn't send the
// session cookie with its requests. Its URLs carry an unguessable signature instead, handed only to the run's owner.
const key = () => { const k = process.env.WORKOS_COOKIE_PASSWORD; if (!k) throw new Error('WORKOS_COOKIE_PASSWORD is not set'); return k; };
export const signRun = (runId: string) => `${runId}.${createHmac('sha256', key()).update(`ws:${runId}`).digest('base64url').slice(0, 22)}`;
export function verifyRunToken(token: string): string | null {
  const [runId, sig] = token.split('.');
  if (!runId || !sig) return null;
  const want = signRun(runId).split('.')[1];
  return sig.length === want.length && timingSafeEqual(Buffer.from(sig), Buffer.from(want)) ? runId : null;
}

// the projects a viewer may list: admins see everything, users their own, nobody signed out sees any
export async function visibleProjects(v: Viewer, limit = 30): Promise<Project[]> {
  if (v.admin) return listProjects({ limit });
  return v.userId ? listProjects({ userId: v.userId, limit }) : [];
}
