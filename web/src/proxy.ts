// Every page and API route needs a signed-in user (WorkOS AuthKit), except signing in itself and the signed preview
// URLs under /ws, whose requests come from a sandboxed iframe that carries no cookies (see signRun in server/auth.ts).
import { authkitProxy } from '@workos-inc/authkit-nextjs';

export default authkitProxy({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ['/sign-in', '/callback', '/ws/:path*'],
  },
});

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
