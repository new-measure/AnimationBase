// Shapes shared by the UI, the API routes and the worker.

export type Family = 'ui_walkthrough' | 'type_led' | 'brand_graphic' | 'illustrated' | 'abstract';
export type Format = 'landscape' | 'square' | 'portrait';
export type Source = 'said' | 'guessed' | 'default';

export interface Brief {
  product: string;
  message: string;
  audience: string;
  category: string;
  family: Family;
  length: number;           // seconds
  format: Format;
  theme: 'light' | 'dark';
  textLevel: 'none' | 'some' | 'dominant';
  cursor: boolean;
  cta: string;
  notes: string;            // anything else the prompt asked for
  brand: { colors: string[]; font: string };
  source: Partial<Record<keyof Brief, Source>>;
  why: Partial<Record<keyof Brief, string>>;
}

export interface Shot {
  id: string;               // 'A', 'B', ...
  t0: number;
  t1: number;
  name: string;
  action: string;           // what happens, beat by beat
  text?: string;            // words on screen, if any
  transition: string;       // how it hands over to the next shot
}

export interface Storyboard {
  title: string;
  logline: string;
  look: string;             // palette, type, ground, motion feel
  shots: Shot[];
}

export interface SimilarFilm {
  slug: string; title: string; company: string; category: string; x: string;
  family: string; tags: string[]; bg?: string; text?: string; overlays: string[]; note: string; seconds: number | null;
}

export type ProjectStatus = 'brief' | 'storyboard' | 'arena' | 'studio';
export type RunStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export interface Project {
  id: string;
  prompt: string;
  status: ProjectStatus;
  brief: Brief | null;
  storyboard: Storyboard | null;
  similar: SimilarFilm[];
  winnerRunId: string | null;
  createdAt: number;
}

export interface Run {
  id: string;
  projectId: string;
  slot: 'A' | 'B';
  model: string;
  status: RunStatus;
  sessionId: string | null;
  version: number;          // bumps with every finished revision
  busy: boolean;            // an agent job (build or revision) is queued or running
  error: string | null;
  costUsd: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface RunEvent {
  id: number;
  runId: string;
  kind: 'say' | 'tool' | 'sheet' | 'user' | 'result' | 'error' | 'status';
  text: string;
  data: Record<string, unknown> | null;
  at: number;
}

export interface Render {
  id: string;
  runId: string;
  status: RunStatus;
  progress: number;         // 0..1
  eta: string | null;
  file: string | null;      // workspace-relative mp4 path
  error: string | null;
  createdAt: number;
}

export interface Vote {
  projectId: string;
  choice: 'A' | 'B' | 'tie' | 'bad';
  modelA: string;
  modelB: string;
}
