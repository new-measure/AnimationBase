// Line icons (24px grid, 1.75 stroke, currentColor), drawn inline so they match the type and need no dependency.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const make = (d: React.ReactNode, fill = false) => function Icon({ size = 16, className = '', ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`shrink-0 ${className}`} {...p}>{d}</svg>
  );
};

export const Play = make(<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />, true);
export const Pause = make(<><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>, true);
export const Stop = make(<rect x="6" y="6" width="12" height="12" rx="2" />);
export const Comment = make(<path d="M21 12a8 8 0 0 1-11.6 7.14L4 20l.9-4.6A8 8 0 1 1 21 12z" />);
export const ChevronRight = make(<path d="m9 6 6 6-6 6" />);
export const ChevronDown = make(<path d="m6 9 6 6 6-6" />);
export const ArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ArrowLeft = make(<path d="M19 12H5M11 18l-6-6 6-6" />);
export const Check = make(<path d="M20 6 9 17l-5-5" />);
export const External = make(<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />);
export const Plus = make(<path d="M12 5v14M5 12h14" />);
export const X = make(<path d="M18 6 6 18M6 6l12 12" />);
export const Download = make(<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />);
export const Restore = make(<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />);
export const Info = make(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>);
export const Alert = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16h.01" /></>);
export const Trophy = make(<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />);
export const Film = make(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>);
export const Sparkle = make(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" />);
export const Globe = make(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
export const Scale = make(<path d="M12 4v16M8 20h8M5 8h14M5 8l-2.5 6a3 3 0 0 0 5 0L5 8zM19 8l-2.5 6a3 3 0 0 0 5 0L19 8zM12 4l-7 4M12 4l7 4" />);
export const ThumbDown = make(<path d="M17 14V3M21 12.5V5a2 2 0 0 0-2-2H8.4a2 2 0 0 0-2 1.6l-1.3 7A2 2 0 0 0 7 14h4.5l-1 4.4A2 2 0 0 0 12.4 21L17 14h2a2 2 0 0 0 2-1.5z" />);

// the brand mark: a half-lit frame
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <rect width="24" height="24" rx="7" fill="var(--accent)" />
      <path d="M12 6a6 6 0 0 1 0 12z" fill="var(--accent-ink)" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="var(--accent-ink)" strokeWidth="1.75" />
    </svg>
  );
}
