import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

// the initiate-login route: straight to the AuthKit sign-in page
export const GET = async () => redirect(await getSignInUrl());
