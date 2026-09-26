// Models the arena can pit against each other. The first is the default for slot A, the second for slot B.
export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Opus 5.5', note: 'best quality, slowest' },
  { id: 'claude-sonnet-5', label: 'Sonnet 5', note: 'fast, strong' },
  { id: 'claude-fable-5-1', label: 'Fable 5.1', note: '' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', note: 'fastest, cheapest' },
] as const;

export const modelLabel = (id: string) => MODELS.find(m => m.id === id)?.label || id;

// brief extraction is a quick structured read; the storyboard is the creative plan, so it gets the strongest model
export const BRIEF_MODEL = 'claude-sonnet-5';
export const STORYBOARD_MODEL = 'claude-opus-5-5';
