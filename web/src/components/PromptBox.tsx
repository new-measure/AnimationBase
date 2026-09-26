'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const EXAMPLES = [
  { style: 'UI walkthrough', prompt: '35s launch film for Tempo, an AI calendar that schedules meetings for you' },
  { style: 'Type-led', prompt: 'Bold type-led announcement: Relay 2.0 is out, sync is 10x faster. For developers.' },
  { style: 'Brand', prompt: 'Logo reveal and short brand film for Kiln, a new design studio, warm orange palette' },
  { style: 'Character', prompt: 'Illustrated story of a tiny robot helping a busy baker, for Crumb, an AI bakery assistant' },
  { style: 'Abstract', prompt: 'Dark, glowing, mysterious teaser for Aurora, a new AI voice model' },
  { style: 'Reel', prompt: '15s vertical reel announcing Snap Notes, a voice notes app that writes your to-dos' },
];

export default function PromptBox() {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function start() {
    if (!prompt.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const { id } = await api<{ id: string }>('/api/projects', 'POST', { prompt });
      router.push(`/p/${id}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-line bg-panel shadow-sm focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15 transition">
        <textarea
          value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} autoFocus disabled={busy}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) { e.preventDefault(); start(); } }}
          placeholder="Describe your video… “30s launch film for our AI calendar app, Tempo”"
          className="w-full resize-none bg-transparent px-5 pt-4 text-lg outline-none placeholder:text-faint"
        />
        <div className="flex items-center gap-3 px-4 pb-3">
          <span className="text-xs text-faint">Product, message, length, format: say as much or as little as you like.</span>
          <button onClick={start} disabled={!prompt.trim() || busy}
            className="ml-auto rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-40 hover:opacity-90">
            {busy ? 'Reading your brief…' : 'Start →'}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        {EXAMPLES.map(x => (
          <button key={x.style} onClick={() => setPrompt(x.prompt)} disabled={busy}
            className="group rounded-full border border-line bg-panel px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-ink text-left">
            <span className="font-medium text-ink">{x.style}</span>
            <span className="hidden sm:inline"> · {x.prompt.length > 48 ? x.prompt.slice(0, 48) + '…' : x.prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
