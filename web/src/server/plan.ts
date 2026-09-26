// The two planning calls that happen before any code: read a one-line prompt into a brief, and write (or revise) the
// storyboard. Both use structured outputs (a JSON schema) so the answer is parseable.
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ENGINE_ROOT } from './paths';
import { applyDefaults, catalog, FAMILY_KEYS } from './catalog';
import { BRIEF_MODEL, STORYBOARD_MODEL } from '@/lib/models';
import type { Brief, SimilarFilm, Storyboard } from '@/lib/types';

let client: Anthropic | null = null;
const anthropic = () => (client ||= new Anthropic());

// structured outputs need every object closed (additionalProperties: false)
function closed(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(closed);
  if (!schema || typeof schema !== 'object') return schema;
  const o = Object.fromEntries(Object.entries(schema).map(([k, v]) => [k, closed(v)]));
  if (o.type === 'object') o.additionalProperties = false;
  return o;
}

async function structured<T>(model: string, system: string, user: string, schema: Record<string, unknown>, maxTokens = 4000): Promise<T> {
  const res = await anthropic().messages.create({
    model, max_tokens: maxTokens, system,
    output_config: { format: { type: 'json_schema', schema: closed(schema) as Record<string, unknown> } },
    messages: [{ role: 'user', content: user }],
  });
  const text = res.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  if (!text) throw new Error(`the model returned no answer (${res.stop_reason})`);
  return JSON.parse(text) as T;
}

// ---------- brief ----------
const SOURCE = { type: 'string', enum: ['said', 'guessed'] };
const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    product: { type: 'string', description: 'Product name and what it is, a few words' },
    message: { type: 'string', description: 'The single message the film should land, one short sentence' },
    audience: { type: 'string' },
    category: { type: 'string', enum: [] as string[] },
    family: { type: 'string', enum: FAMILY_KEYS as unknown as string[] },
    familyWhy: { type: 'string', description: 'One short line: why this style fits' },
    length: { type: 'number', description: 'Seconds' },
    format: { type: 'string', enum: ['landscape', 'square', 'portrait'], description: 'reel, story, TikTok → portrait' },
    theme: { type: 'string', enum: ['light', 'dark'] },
    textLevel: { type: 'string', enum: ['none', 'some', 'dominant'] },
    stated: { type: 'array', items: { type: 'string', enum: ['length', 'format', 'theme', 'textLevel'] }, description: 'Which of length, format, theme and textLevel the prompt explicitly states or clearly implies. Leave the others out: their values will come from data.' },
    cta: { type: 'string', description: 'Call to action for the end card, e.g. a URL or "Available today"; guess a sensible one' },
    notes: { type: 'string', description: 'Anything else the prompt asks for (scenes, mood, references), or empty' },
    colors: { type: 'array', items: { type: 'string' }, description: 'Brand hex colours if given, else empty' },
    source: {
      type: 'object', description: 'said = the prompt states it; guessed = you inferred it',
      properties: { product: SOURCE, message: SOURCE, audience: SOURCE, category: SOURCE, family: SOURCE, cta: SOURCE },
      required: ['product', 'message', 'audience', 'category', 'family', 'cta'],
    },
  },
  required: ['product', 'message', 'audience', 'category', 'family', 'familyWhy', 'length', 'format', 'theme', 'textLevel', 'stated', 'cta', 'notes', 'colors', 'source'],
};

export async function extractBrief(prompt: string): Promise<Brief> {
  const cat = catalog();
  const fams = Object.values(cat.families).map(f => `- ${f.key}: ${f.label}. ${f.blurb} (${f.share}% of launch films)`).join('\n');
  const schema = structuredClone(BRIEF_SCHEMA);
  (schema.properties.category as { enum: string[] }).enum = cat.categories;
  const r = await structured<{
    product: string; message: string; audience: string; category: string; family: Brief['family']; familyWhy: string;
    length: number; format: Brief['format']; theme: Brief['theme']; textLevel: Brief['textLevel']; stated: string[];
    cta: string; notes: string; colors: string[]; source: Record<string, 'said' | 'guessed'>;
  }>(BRIEF_MODEL,
    `You turn a one-line request for a short product launch film into a brief. Mark each field "said" only when the prompt states it; otherwise make a sensible guess and mark it "guessed". List in "stated" only those of length, format, theme and textLevel that the prompt actually states or clearly implies; the rest get defaults from data. Pick the visual style from these families (all made entirely in code, no live footage):\n${fams}`,
    `Request: ${prompt}`, schema);

  const said = new Set(r.stated || []);
  const source = { ...r.source } as Brief['source'];
  for (const k of ['length', 'format', 'theme', 'textLevel'] as const) if (said.has(k)) source[k] = 'said';
  const b: Brief = {
    product: r.product, message: r.message, audience: r.audience, category: r.category, family: r.family,
    length: r.length || 30, format: r.format || 'landscape', theme: r.theme || 'light', textLevel: r.textLevel || 'some',
    cursor: false, cta: r.cta, notes: r.notes, brand: { colors: r.colors || [], font: '' }, source, why: { family: r.familyWhy },
  };
  return applyDefaults(b);
}

// ---------- storyboard ----------
const STORYBOARD_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Working title, 1–3 words' },
    logline: { type: 'string', description: 'One sentence: what happens and what the viewer takes away' },
    look: { type: 'string', description: 'Palette (hex), type, ground, motion feel; 2–4 short sentences' },
    shots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'A, B, C, ...' },
          t0: { type: 'number' }, t1: { type: 'number' },
          name: { type: 'string', description: '1–3 words' },
          action: { type: 'string', description: 'What happens, beat by beat with rough times; concrete and visual' },
          text: { type: 'string', description: 'Exact words on screen in this shot, or empty' },
          transition: { type: 'string', description: 'How it hands over to the next shot (or the ending)' },
        },
        required: ['id', 't0', 't1', 'name', 'action', 'text', 'transition'],
      },
    },
  },
  required: ['title', 'logline', 'look', 'shots'],
};

const read = (p: string, max = 12000) => (existsSync(p) ? readFileSync(p, 'utf8').slice(0, max) : '');

export function briefMarkdown(b: Brief, similar: SimilarFilm[]): string {
  const f = catalog().families[b.family];
  return [
    `# Brief`, ``,
    `- Product: ${b.product}`, `- Message: ${b.message}`, `- Audience: ${b.audience}`, `- Category: ${b.category}`,
    `- Style: ${f?.label ?? b.family} (recipe: docs/genres/${f?.recipe ?? ''})`,
    `- Length: ${b.length}s · Format: ${b.format} · Theme: ${b.theme} · Text: ${b.textLevel} · Cursor: ${b.cursor ? 'yes' : 'no'}`,
    `- End card / call to action: ${b.cta}`,
    b.brand.colors.length ? `- Brand colours: ${b.brand.colors.join(', ')}` : '', b.brand.font ? `- Brand font: ${b.brand.font}` : '',
    b.notes ? `- Notes: ${b.notes}` : '', ``,
    f?.pacing ? `## Measured pacing for this style (medians)\n\nLength ${f.pacing.length}s, shot between cuts ${f.pacing.shot}s, ${f.pacing.cutsPerMin} cuts/min, beat ${f.pacing.beat}s, end card ${f.pacing.endCard}s (in ${f.pacing.endCardShare} of films).\n` : '',
    `## Similar launch films (patterns only: never copy their brands, words or assets)`, ``,
    ...similar.map(s => `- ${s.title} (${s.company}, ${s.category}${s.seconds ? `, ${s.seconds}s` : ''}): ${s.note}. bg ${s.bg}, text ${s.text}${s.overlays.length ? `, overlays ${s.overlays.join('/')}` : ''}. tags: ${s.tags.join(', ')}`),
  ].filter(l => l !== '').join('\n');
}

export function storyboardMarkdown(s: Storyboard): string {
  return [
    `# ${s.title}`, ``, `Logline: ${s.logline}`, ``, `Look: ${s.look}`, ``, `## Shots`, ``,
    ...s.shots.flatMap(sh => [`### ${sh.id}  ${sh.t0}–${sh.t1}s  ${sh.name}`, `- ${sh.action}`, sh.text ? `- On screen: "${sh.text}"` : '', `- Transition: ${sh.transition}`, ``]),
  ].filter(l => l !== '').join('\n');
}

export async function writeStoryboard(b: Brief, similar: SimilarFilm[], previous?: Storyboard | null, change?: string): Promise<Storyboard> {
  const f = catalog().families[b.family];
  const recipe = read(resolve(ENGINE_ROOT, 'docs/genres', f?.recipe ?? ''), 9000);
  const craft = read(resolve(ENGINE_ROOT, 'refs/whatships/craft.md'), 5000);
  const system = [
    `You are a motion designer planning a short product launch film. It will be built entirely in code (p5.js painting plus an HTML/CSS/SVG layer, rendered in headless Chrome): no live footage, photos or photoreal 3D. Plan a film that code can make beautifully.`,
    `Rules: one focal point at a time; every shot has something happening; a designed transition at every seam; words on screen are short and held long enough to read (about 0.3 s per word plus 1 s); shots tile the whole length with no gaps (each t0 is the previous t1, the first starts at 0, the last ends at the full length); finish on an end card with the product name and call to action.`,
    `Genre recipe:\n${recipe}`,
    craft ? `Measured craft of top-tier launch films:\n${craft}` : '',
  ].filter(Boolean).join('\n\n');
  const user = previous
    ? `${briefMarkdown(b, similar)}\n\n# Current storyboard\n\n${storyboardMarkdown(previous)}\n\n# Change requested\n\n${change}\n\nReturn the full revised storyboard.`
    : `${briefMarkdown(b, similar)}\n\nWrite the storyboard for a ${b.length}s film.`;
  const s = await structured<Storyboard>(STORYBOARD_MODEL, system, user, STORYBOARD_SCHEMA, 16000);
  // keep the shots tiling 0..length even if the model drifts
  s.shots.sort((a, c) => a.t0 - c.t0);
  s.shots.forEach((sh, i) => { sh.t0 = i ? s.shots[i - 1].t1 : 0; if (i === s.shots.length - 1) sh.t1 = b.length; });
  return s;
}
