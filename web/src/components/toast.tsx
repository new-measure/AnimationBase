'use client';
// Toasts: call toast('Saved') or toast.error(msg) from anywhere on the client; <Toaster /> in the layout shows them.
import { useEffect, useState } from 'react';
import { Alert, Check, X } from './icons';

interface Item { id: number; text: string; tone: 'good' | 'bad' }
let items: Item[] = [], next = 1;
const subs = new Set<(x: Item[]) => void>();
const emit = () => subs.forEach(f => f(items));
const dismiss = (id: number) => { items = items.filter(x => x.id !== id); emit(); };

function push(text: string, tone: Item['tone']) {
  const id = next++;
  items = [...items.slice(-3), { id, text, tone }]; emit();
  setTimeout(() => dismiss(id), tone === 'bad' ? 7000 : 2400);
}
export const toast = Object.assign((text: string) => push(text, 'good'), { error: (text: string) => push(text, 'bad') });

export function Toaster() {
  const [list, setList] = useState<Item[]>([]);
  useEffect(() => { subs.add(setList); return () => { subs.delete(setList); }; }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4">
      {list.map(t => (
        <div key={t.id} role={t.tone === 'bad' ? 'alert' : 'status'}
          className="pointer-events-auto animate-enter flex max-w-md items-start gap-2.5 rounded-xl border border-line bg-panel px-3.5 py-2.5 text-sm shadow-float">
          {t.tone === 'bad' ? <Alert className="mt-0.5 text-bad" /> : <Check className="mt-0.5 text-good" />}
          <span className="min-w-0 flex-1">{t.text}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-mr-1 rounded p-0.5 text-muted hover:text-ink"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}
