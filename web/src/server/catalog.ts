// The What Ships scan (data/catalog.json, built by scripts/build-catalog.mjs): genre stats, brief defaults, and
// similar films to show the agent. Only stats, tags and outbound X links ever reach the UI.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DATA_DIR } from './paths';
import type { Brief, Family, SimilarFilm } from '@/lib/types';

export interface FamilyStats {
  key: Family; label: string; blurb: string; recipe: string; mg: boolean;
  count: number; share: number; medianSeconds: number | null;
  bg: Record<string, number>; text: Record<string, number>; aspect: Record<string, number>;
  cursor: number; logo: number;
  pacing: { films: number; length: number; shot: number; cutsPerMin: number; beat: number; endCard: number; endCardShare: string } | null;
  byCategory: Record<string, { count: number; bg: Record<string, number>; text: Record<string, number>; medianSeconds: number | null }>;
}
interface CatalogFilm extends SimilarFilm { description: string; medium?: string }
interface Catalog { total: number; categories: string[]; families: Record<Family, FamilyStats>; films: CatalogFilm[] }

const g = globalThis as unknown as { __catalog?: Catalog };
export function catalog(): Catalog {
  return (g.__catalog ||= JSON.parse(readFileSync(resolve(DATA_DIR, 'catalog.json'), 'utf8')));
}
export const families = () => Object.values(catalog().families);
export const FAMILY_KEYS = ['ui_walkthrough', 'type_led', 'brand_graphic', 'illustrated', 'abstract'] as const;

const top = (d: Record<string, number>, allowed: string[]) => Object.entries(d).find(([k]) => allowed.includes(k));

// Fill what the prompt didn't say from what films of this family (and category) usually do, with a one-line why.
export function applyDefaults(b: Brief): Brief {
  const f = catalog().families[b.family];
  if (!f) return b;
  const cat = f.byCategory[b.category];
  const out: Brief = { ...b, source: { ...b.source }, why: { ...b.why } };
  const setDefault = <K extends keyof Brief>(k: K, v: Brief[K], why: string) => {
    if (out.source[k] === 'said') return;
    out[k] = v; out.source[k] = 'default'; out.why[k] = why;
  };
  const len = f.pacing?.length ?? f.medianSeconds ?? 30;
  setDefault('length', Math.max(10, Math.min(60, Math.round(len / 5) * 5)), `typical ${f.label} film runs about ${Math.round(len)}s`);
  const theme = top(cat && cat.count >= 8 ? cat.bg : f.bg, ['light', 'dark']);
  if (theme) setDefault('theme', theme[0] as 'light' | 'dark', `${Math.round(theme[1])}% of ${cat && cat.count >= 8 ? `${b.category} ` : ''}${f.label} films use a ${theme[0]} background`);
  const text = top(f.text, ['none', 'some', 'dominant']);
  if (text) setDefault('textLevel', text[0] as Brief['textLevel'], `${Math.round(text[1])}% of ${f.label} films have ${text[0] === 'some' ? 'some' : text[0]} text`);
  setDefault('cursor', f.cursor >= 15, f.cursor >= 15 ? `a cursor appears in ${Math.round(f.cursor)}% of ${f.label} films` : `cursors are rare in ${f.label} films`);
  setDefault('format', 'landscape', `${Math.round(f.aspect.landscape ?? 90)}% of ${f.label} films are landscape`);
  return out;
}

// Score films by family, category and word overlap with the brief. Cheap and explainable; embeddings can come later.
const words = (s: string) => new Set(s.toLowerCase().match(/[a-z][a-z0-9]{2,}/g) || []);
const STOP = new Set(['the', 'and', 'for', 'with', 'your', 'our', 'that', 'this', 'from', 'into', 'you', 'are', 'launch', 'film', 'video', 'new']);
export function similarFilms(b: Brief, n = 5): SimilarFilm[] {
  const q = [...words(`${b.product} ${b.message} ${b.audience} ${b.notes}`)].filter(w => !STOP.has(w));
  const scored = catalog().films.map(f => {
    const hay = words(`${f.title} ${f.tags.join(' ')} ${f.description} ${f.note}`);
    let s = (f.family === b.family ? 6 : 0) + (f.category === b.category ? 3 : 0);
    for (const w of q) if (hay.has(w)) s += 1.5;
    if (f.bg === b.theme) s += 1;
    if (b.cursor && f.overlays.includes('cursor')) s += 1;
    return { f, s };
  }).sort((a, b) => b.s - a.s);
  return scored.slice(0, n).map(({ f }) => ({
    slug: f.slug, title: f.title, company: f.company, category: f.category, x: f.x, family: f.family,
    tags: f.tags.slice(0, 6), bg: f.bg, text: f.text, overlays: f.overlays, note: f.note, seconds: f.seconds,
  }));
}

// family stats without the per-category breakdown, for the UI
export type FamilyCard = Omit<FamilyStats, 'byCategory'>;
export const familyCards = (): FamilyCard[] => families().map(f => { const c: Partial<FamilyStats> = { ...f }; delete c.byCategory; return c as FamilyCard; });
