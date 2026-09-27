import { handleAuth } from '@workos-inc/authkit-nextjs';

// AuthKit sends users back here after signing in (NEXT_PUBLIC_WORKOS_REDIRECT_URI)
export const GET = handleAuth();
