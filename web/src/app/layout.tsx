import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Animate',
  description: 'Turn a one-line brief into a launch film: two models build it, you pick the better one.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="h-14 shrink-0 border-b border-line bg-panel/80 backdrop-blur sticky top-0 z-30">
          <div className="h-full max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="size-6 rounded-full bg-accent grid place-items-center text-accent-ink text-xs">◐</span>
              Animate
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link href="/projects" className="hover:text-ink">Projects</Link>
              <Link href="/leaderboard" className="hover:text-ink">Leaderboard</Link>
            </nav>
            <Link href="/" className="ml-auto text-sm rounded-lg bg-ink text-bg px-3 py-1.5 hover:opacity-90">+ New video</Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
