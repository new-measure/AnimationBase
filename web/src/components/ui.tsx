// Small shared UI pieces.
import type { ReactNode } from 'react';

export function Button({ children, variant = 'primary', className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'dark' }) {
  const v = variant === 'primary' ? 'bg-accent text-accent-ink hover:opacity-90' : variant === 'dark' ? 'bg-ink text-bg hover:opacity-90' : 'border border-line bg-panel hover:border-accent hover:text-accent';
  return <button {...p} className={`rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:pointer-events-none transition ${v} ${className}`}>{children}</button>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-panel ${className}`}>{children}</div>;
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`inline-block size-3.5 rounded-full border-2 border-current border-r-transparent animate-spin ${className}`} />;
}

const STEPS = ['Brief', 'Storyboard', 'Arena', 'Studio'];
export function Stepper({ at, onGo }: { at: number; onGo?: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-1 text-xs">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          <button disabled={!onGo || i >= at} onClick={() => onGo?.(i)}
            className={`rounded-full px-2.5 py-1 ${i === at ? 'bg-ink text-bg font-medium' : i < at ? 'text-ink hover:bg-sunken' : 'text-faint'} disabled:cursor-default`}>
            {i < at ? '✓ ' : ''}{s}
          </button>
          {i < STEPS.length - 1 && <span className="text-faint">›</span>}
        </li>
      ))}
    </ol>
  );
}
