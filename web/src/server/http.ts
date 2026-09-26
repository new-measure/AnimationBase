// Small helpers for route handlers.
export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const fail = (message: string, status = 400) => Response.json({ error: message }, { status });
export async function body<T>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}
// route handlers wrap their work so a thrown error becomes a JSON 500 the UI can show
export function handle<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    try { return await fn(...a); } catch (e) {
      console.error(e);
      return fail((e as Error).message || 'something went wrong', 500);
    }
  };
}
