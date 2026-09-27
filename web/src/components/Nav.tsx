'use client';
// Header navigation with the current section highlighted.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm">
      {links.map(l => {
        const on = path === l.href || path.startsWith(l.href + '/');
        return (
          <Link key={l.href} href={l.href} aria-current={on ? 'page' : undefined}
            className={`rounded-lg px-2.5 py-1.5 transition ${on ? 'bg-sunken text-ink font-medium' : 'text-muted hover:text-ink hover:bg-sunken/60'}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
