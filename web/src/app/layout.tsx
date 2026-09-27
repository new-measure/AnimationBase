import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { signOut } from '@workos-inc/authkit-nextjs';
import { viewer } from '@/server/auth';
import Nav from '@/components/Nav';
import { Toaster } from '@/components/toast';
import { ButtonLink } from '@/components/ui';
import { Logo, Plus } from '@/components/icons';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Video Arena',
  description: 'Turn a one-line brief into a film (launch films, explainers, tutorials, data stories): two models build it, you pick the better one.',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const v = await viewer();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="h-14 shrink-0 border-b border-line bg-panel/80 backdrop-blur sticky top-0 z-30">
          <div className="h-full max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center gap-3 sm:gap-5">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <Logo />
              <span className="hidden sm:inline">Video Arena</span>
            </Link>
            {v.userId && (
              <Nav links={[{ href: '/projects', label: 'Projects' }, ...(v.admin ? [{ href: '/leaderboard', label: 'Leaderboard' }, { href: '/admin', label: 'Admin' }] : [])]} />
            )}
            {v.userId && (
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <ButtonLink href="/" size="sm" icon={<Plus size={14} />}>New video</ButtonLink>
                <form action={async () => { 'use server'; await signOut(); }} className="flex items-center gap-2 border-l border-line pl-2 sm:pl-3">
                  <span title={v.email ?? ''} className="grid size-7 place-items-center rounded-full bg-sunken text-xs font-semibold uppercase text-muted">{(v.email ?? '?')[0]}</span>
                  <button className="hidden sm:block text-xs text-muted hover:text-ink">Sign out</button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
