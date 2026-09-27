// The shared UI kit. Every page builds from these so buttons, fields, cards, badges and headers look the same
// everywhere. Rules: rounded-lg controls, rounded-2xl cards; text-xs is the smallest size; one accent.
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Info } from './icons';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---- buttons

type Variant = 'primary' | 'secondary' | 'dark' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink shadow-card hover:brightness-110 active:brightness-95',
  secondary: 'border border-line bg-panel text-ink shadow-card hover:border-accent/50 hover:text-accent',
  dark: 'bg-ink text-bg shadow-card hover:opacity-90',
  quiet: 'text-muted hover:text-ink hover:bg-sunken',
  danger: 'text-muted hover:text-bad hover:bg-bad-soft',
};
const SIZES: Record<Size, string> = { sm: 'h-8 px-2.5 text-xs gap-1.5', md: 'h-9 px-3.5 text-sm gap-2', lg: 'h-11 px-5 text-sm gap-2' };

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className = '') =>
  cx('inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition select-none',
    'disabled:opacity-40 disabled:pointer-events-none aria-disabled:opacity-40 aria-disabled:pointer-events-none', VARIANTS[variant], SIZES[size], className);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean; icon?: ReactNode };
export function Button({ children, variant, size, loading, icon, className, disabled, ...p }: ButtonProps) {
  return (
    <button {...p} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, size, className)}>
      {loading ? <Spinner /> : icon}{children}
    </button>
  );
}

export function ButtonLink({ href, children, variant, size, icon, className, ...p }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; size?: Size; icon?: ReactNode }) {
  return <Link href={href} {...p} className={buttonClass(variant, size, className)}>{icon}{children}</Link>;
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span aria-hidden className={cx('inline-block size-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent animate-spin', className)} />;
}

// ---- fields

export const fieldClass = cx('w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink placeholder:text-faint transition',
  'outline-none focus-visible:outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 disabled:opacity-60');

export function Input({ className = '', ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(fieldClass, className)} />;
}
export function Textarea({ className = '', ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(fieldClass, 'resize-none', className)} />;
}
export function Select({ className = '', ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(fieldClass, 'w-auto pr-8', className)} />;
}

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('grid gap-1.5', className)}>
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="-mt-1 text-xs text-muted">{hint}</span>}
      {children}
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onPick, size = 'md' }: { value: T; options: { v: T; l: ReactNode }[]; onPick: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" className="inline-flex rounded-lg bg-sunken p-0.5">
      {options.map(o => (
        <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onPick(o.v)}
          className={cx('rounded-md transition', size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1 text-sm',
            value === o.v ? 'bg-panel text-ink font-medium shadow-card' : 'text-muted hover:text-ink')}>{o.l}</button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition', checked ? 'bg-accent' : 'bg-line')}>
      <span className={cx('size-4 rounded-full bg-panel shadow-card transition-transform', checked ? 'translate-x-4.5' : 'translate-x-0.5')} />
    </button>
  );
}

// ---- surfaces

export function Card({ children, className = '', interactive }: { children: ReactNode; className?: string; interactive?: boolean }) {
  return <div className={cx('rounded-2xl border border-line bg-panel shadow-card', interactive && 'transition hover:border-accent/50 hover:shadow-float hover:-translate-y-px', className)}>{children}</div>;
}

// a card's header row: title, optional description, optional actions on the right
export function CardHeader({ title, description, actions, className = '' }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-start gap-x-4 gap-y-2', className)}>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

// native <details>, so it opens without JS and works with the keyboard
export function Disclosure({ title, meta, children, className = '' }: { title: ReactNode; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <details className={cx('group rounded-2xl border border-line bg-panel shadow-card', className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl px-5 py-3.5 text-sm hover:bg-sunken/50 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="text-muted transition-transform -rotate-90 group-open:rotate-0" />
        <span className="font-medium">{title}</span>
        {meta && <span className="ml-auto text-xs text-muted">{meta}</span>}
      </summary>
      <div className="px-5 pb-4 animate-enter">{children}</div>
    </details>
  );
}

// ---- page structure

const WIDTHS = { narrow: 'max-w-3xl', default: 'max-w-5xl', wide: 'max-w-6xl', full: 'max-w-[1600px]' };
export function Page({ children, width = 'default', className = '' }: { children: ReactNode; width?: keyof typeof WIDTHS; className?: string }) {
  return <div className={cx(WIDTHS[width], 'w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-enter', className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-accent">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// a labelled group of content inside a page
export function Section({ title, actions, children, className = '' }: { title: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-baseline gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {actions && <div className="ml-auto text-sm">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      {icon && <div className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</div>}
      <p className="font-medium">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-24 px-5 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="text-xs text-faint tabular-nums">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cx('skeleton rounded-lg', className)} />;
}

// ---- small bits

type Tone = 'neutral' | 'accent' | 'good' | 'warn' | 'bad';
const TONES: Record<Tone, string> = {
  neutral: 'bg-sunken text-muted', accent: 'bg-accent-soft text-accent', good: 'bg-good-soft text-good', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad',
};
export function Badge({ tone = 'neutral', children, className = '', title }: { tone?: Tone; children: ReactNode; className?: string; title?: string }) {
  return <span title={title} className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', TONES[tone], className)}>{children}</span>;
}

// a quiet explanation, shown on hover or focus instead of a line of small print
export function InfoTip({ text }: { text: string }) {
  return (
    <span tabIndex={0} title={text} className="inline-flex align-middle text-faint hover:text-muted cursor-help">
      <Info size={14} /><span className="sr-only">{text}</span>
    </span>
  );
}

// ---- the project steps

const STEPS = ['Brief', 'Storyboard', 'Arena', 'Studio'];
export function Stepper({ at, onGo }: { at: number; onGo?: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-1 text-xs">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          <button disabled={!onGo || i >= at} onClick={() => onGo?.(i)} aria-current={i === at ? 'step' : undefined}
            className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition disabled:cursor-default',
              i === at ? 'bg-ink text-bg font-medium' : i < at ? 'text-ink hover:bg-sunken' : 'text-faint')}>
            <span className={cx('grid size-4 place-items-center rounded-full text-[0.625rem] font-semibold',
              i === at ? 'bg-bg/20' : i < at ? 'bg-good-soft text-good' : 'ring-1 ring-line')}>
              {i < at ? <Check size={10} strokeWidth={3} /> : i + 1}
            </span>
            <span className={i === at ? '' : 'hidden sm:inline'}>{s}</span>
          </button>
          {i < STEPS.length - 1 && <span className={cx('h-px w-4', i < at ? 'bg-good/40' : 'bg-line')} />}
        </li>
      ))}
    </ol>
  );
}
