// Small helpers for route handlers.
export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const fail = (message: string, status = 400) => Response.json({ error: message }, { status });
export async function body<T>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}
// route handlers wrap their work so a thrown error becomes JSON the UI can show. Access errors (auth.ts Forbidden)
// become a plain 404, so a project you can't see looks the same as one that doesn't exist.
export function handle<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    try { return await fn(...a); } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) return fail('not found', 404);
      console.error(e);
      return fail((e as Error).message || 'something went wrong', 500);
    }
  };
}
