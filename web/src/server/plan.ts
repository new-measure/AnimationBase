// The two planning calls that happen before any code: read a one-line prompt into a brief, and write (or revise) the
// storyboard. Both use structured outputs (a JSON schema) so the answer is parseable, and both may search the web
// (the brief to learn what a named product really is, the storyboard to get its features and look right).
import Anthropic from '@anthropic-ai/sdk';
import docs from '@/generated/plan-docs.json';
import { applyDefaults, catalog, FAMILY_KEYS } from './catalog';
import { getSettings } from './models';

// the brief is a quick read with a lookup; the storyboard model is an admin setting (planningModel)
const BRIEF_MODEL = 'claude-sonnet-5';
import { FIELD_LABELS, groupOf, type Brief, type SimilarFilm, type Storyboard } from '@/lib/types';

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

export interface Source { title: string; url: string }

// One structured call. With `search`, the model may use the web search server tool first; a long search can pause
// the turn (stop_reason "pause_turn"), in which case the conversation is sent back to let it continue.
async function structured<T>(model: string, system: string, user: string, schema: Record<string, unknown>,
  { maxTokens = 4000, search = 0 }: { maxTokens?: number; search?: number } = {}): Promise<{ data: T; sources: Source[] }> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: user }];
  const sources = new Map<string, string>();
  for (let turn = 0; turn < 5; turn++) {
    const res = await anthropic().messages.create({
      model, max_tokens: maxTokens, system, messages,
      output_config: { format: { type: 'json_schema', schema: closed(schema) as Record<string, unknown> } },
      ...(search ? { tools: [{ type: 'web_search_20260318', name: 'web_search', max_uses: search }] } : {}),
    });
    let answer = '';
    for (const b of res.content) {
      if (b.type === 'web_search_tool_result') {
        answer = '';   // only the text after the last search is the answer
        if (Array.isArray(b.content)) for (const r of b.content) sources.set(r.url, r.title);
      } else if (b.type === 'text') answer += b.text;
    }
    if (res.stop_reason === 'pause_turn') { messages.push({ role: 'assistant', content: res.content }); continue; }
    if (!answer.trim()) throw new Error(`the model returned no answer (${res.stop_reason})`);
    const json = answer.slice(answer.indexOf('{'), answer.lastIndexOf('}') + 1);
    return { data: JSON.parse(json) as T, sources: [...sources].map(([url, title]) => ({ url, title })) };
  }
  throw new Error('the model kept searching without answering');
}

// ---------- brief ----------
const SOURCE = { type: 'string', enum: ['said', 'guessed'] };
const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    product: { type: 'string', description: 'Product name and what it is, a few words. For an explainer, tutorial or data story: the topic, the task taught, or the story the data tells' },
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
    cta: { type: 'string', description: 'How the film ends. Launch film or explainer: the call to action for the end card, e.g. a URL or "Available today". Tutorial: the outro (where to learn more). Data story: the data source to credit on screen. Guess a sensible one' },
    notes: { type: 'string', description: 'Anything else the prompt asks for (scenes, mood, references), or empty' },
    colors: { type: 'array', items: { type: 'string' }, description: 'Brand hex colours if given or found on the product’s own site, else empty' },
    research: {
      type: 'object', description: 'What you learned about the product from the web. All empty when you did not search or found nothing.',
      properties: {
        summary: { type: 'string', description: 'What the product is and does, 1–3 sentences, from its own site or reliable coverage' },
        url: { type: 'string', description: 'The product’s own website, if found' },
        features: { type: 'array', items: { type: 'string' }, description: 'Up to 5 key features worth showing in a film' },
      },
      required: ['summary', 'url', 'features'],
    },
    source: {
      type: 'object', description: 'said = the prompt states it; guessed = you inferred it',
      properties: { product: SOURCE, message: SOURCE, audience: SOURCE, category: SOURCE, family: SOURCE, cta: SOURCE },
      required: ['product', 'message', 'audience', 'category', 'family', 'cta'],
    },
  },
  required: ['product', 'message', 'audience', 'category', 'family', 'familyWhy', 'length', 'format', 'theme', 'textLevel', 'stated', 'cta', 'notes', 'colors', 'research', 'source'],
};

export async function extractBrief(prompt: string): Promise<Brief> {
  const cat = catalog();
  const fams = Object.values(cat.families).map(f => f.group === 'launch'
    ? `- ${f.key}: ${f.label} launch film. ${f.blurb} (${f.share}% of launch films)`
    : `- ${f.key}: ${f.label} (not a launch film). ${f.blurb}`).join('\n');
  const schema = structuredClone(BRIEF_SCHEMA);
  (schema.properties.category as { enum: string[] }).enum = cat.categories;
  const { data: r, sources } = await structured<{
    product: string; message: string; audience: string; category: string; family: Brief['family']; familyWhy: string;
    length: number; format: Brief['format']; theme: Brief['theme']; textLevel: Brief['textLevel']; stated: string[];
    cta: string; notes: string; colors: string[]; source: Record<string, 'said' | 'guessed'>;
    research: { summary: string; url: string; features: string[] };
  }>(BRIEF_MODEL,
    `You turn a one-line request for a short film into a brief. Most requests are product launch films; some are explainers (make an idea or process understandable), tutorials (teach how to do a task, usually in a product) or data stories (a story told with numbers and charts): pick those families only when that's what the request asks for, and a launch family for announcing or showing off a product. Mark each field "said" only when the prompt states it; otherwise make a sensible guess and mark it "guessed". List in "stated" only those of length, format, theme and textLevel that the prompt actually states or clearly implies; the rest get defaults from data. If the request names a real product or company, search the web (its own site first) to learn what it actually is and does, and use that for product, message, audience, call to action and brand colours (still marked "guessed" unless the prompt says them), and fill in research. If it's fictional or nothing turns up, don't keep searching: leave research empty. For a data story, search for the real data instead: put what the dataset shows in research.summary, its page in research.url, and up to five exact figures with units, years and the publisher in research.features; never make figures up. Pick the visual style from these families (all made entirely in code, no live footage):\n${fams}`,
    `Request: ${prompt}`, schema, { search: 3 });

  const said = new Set(r.stated || []);
  const source = { ...r.source } as Brief['source'];
  for (const k of ['length', 'format', 'theme', 'textLevel'] as const) if (said.has(k)) source[k] = 'said';
  const b: Brief = {
    product: r.product, message: r.message, audience: r.audience, category: r.category, family: r.family,
    length: r.length || 30, format: r.format || 'landscape', theme: r.theme || 'light', textLevel: r.textLevel || 'some',
    cursor: false, cta: r.cta, notes: r.notes, brand: { colors: r.colors || [], font: '' }, source, why: { family: r.familyWhy },
    research: r.research?.summary ? { ...r.research, sources: sources.slice(0, 6) } : null,
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

const recipes = docs.recipes as Record<string, string>;

export function briefMarkdown(b: Brief, similar: SimilarFilm[]): string {
  const f = catalog().families[b.family], L = FIELD_LABELS[b.family] ?? FIELD_LABELS.ui_walkthrough, launch = groupOf(b.family) === 'launch';
  return [
    `# Brief`, ``,
    `- ${L.product}: ${b.product}`, `- Message: ${b.message}`, `- Audience: ${b.audience}`, launch ? `- Category: ${b.category}` : '',
    `- Style: ${f?.label ?? b.family}${launch ? '' : ' (not a launch film)'} (recipe: docs/genres/${f?.recipe ?? ''})`,
    `- Length: ${b.length}s · Format: ${b.format} · Theme: ${b.theme} · Text: ${b.textLevel} · Cursor: ${b.cursor ? 'yes' : 'no'}`,
    launch ? `- End card / call to action: ${b.cta}` : `- ${L.cta}: ${b.cta}`,
    b.brand.colors.length ? `- Brand colours: ${b.brand.colors.join(', ')}` : '', b.brand.font ? `- Brand font: ${b.brand.font}` : '',
    b.notes ? `- Notes: ${b.notes}` : '', ``,
    b.research ? `## ${launch ? 'What the product really is' : b.family === 'data_story' ? 'The data' : 'What I found'} (from the web)\n\n${b.research.summary}${b.research.url ? `\nSite: ${b.research.url}` : ''}${b.research.features.length ? `\nFeatures:\n${b.research.features.map(x => `- ${x}`).join('\n')}` : ''}\n` : '',
    f?.pacing ? (launch
      ? `## Measured pacing for this style (medians)\n\nLength ${f.pacing.length}s, shot between cuts ${f.pacing.shot}s, ${f.pacing.cutsPerMin} cuts/min, beat ${f.pacing.beat}s, end card ${f.pacing.endCard}s (in ${f.pacing.endCardShare} of films).\n`
      : `## Measured pacing for this genre (medians over ${f.pacing.films} reference films)\n\nReal films run ${Math.round(f.pacing.length)}s; this one is ${b.length}s, so it tells fewer beats at the same pace. Beat ${f.pacing.beat}s, ${f.pacing.cutsPerMin} hard cuts/min, ${f.pacing.shot}s between cuts.${f.ending ? ` Most end on: ${Object.keys(f.ending).filter(k => k !== 'other').join(' or ')}.` : ''}\n`) : '',
    launch ? `## Similar launch films (patterns only: never copy their brands, words or assets)` : `## Reference ${f?.label ?? ''} films (patterns only: never copy their words, characters or assets)`, ``,
    ...similar.map(s => launch
      ? `- ${s.title} (${s.company}, ${s.category}${s.seconds ? `, ${s.seconds}s` : ''}): ${s.note}. bg ${s.bg}, text ${s.text}${s.overlays.length ? `, overlays ${s.overlays.join('/')}` : ''}. tags: ${s.tags.join(', ')}`
      : `- ${s.title} (${s.company}${s.seconds ? `, ${s.seconds}s` : ''}): ${s.note.replace(/\.+$/, '')}. ${s.tags.join(', ')}`),
  ].filter(l => l !== '').join('\n');
}

export function storyboardMarkdown(s: Storyboard): string {
  return [
    `# ${s.title}`, ``, `Logline: ${s.logline}`, ``, `Look: ${s.look}`, ``, `## Shots`, ``,
    ...s.shots.flatMap(sh => [`### ${sh.id}  ${sh.t0}–${sh.t1}s  ${sh.name}`, `- ${sh.action}`, sh.text ? `- On screen: "${sh.text}"` : '', `- Transition: ${sh.transition}`, ``]),
  ].filter(l => l !== '').join('\n');
}

export async function writeStoryboard(b: Brief, similar: SimilarFilm[], previous?: Storyboard | null, change?: string): Promise<Storyboard> {
  const f = catalog().families[b.family], launch = groupOf(b.family) === 'launch';
  const recipe = (recipes[f?.recipe ?? ''] ?? '').slice(0, 9000);
  const craft = launch ? docs.craft.slice(0, 5000) : ((docs as { measured?: Record<string, string> }).measured?.[b.family] ?? '').slice(0, 5000);
  const tiling = `shots tile the whole length with no gaps (each t0 is the previous t1, the first starts at 0, the last ends at the full length)`;
  const reading = `words on screen are short and stay fully readable for at least 0.5 s plus 0.3 s per word, longer for the line that carries the message (the reading rule in ANIMATION_GUIDE.md)`;
  const ending: Record<string, string> = {
    explainer: 'end on a one-line recap, then the call to action or title card. There is no voice-over: words on screen carry the explanation, one idea per scene, so keep each line short and give it time',
    tutorial: 'build every step the same way (name the step, zoom into that part of the UI, the cursor acts with a highlight first, hold on the result), and end on an outro that recaps. The UI is rebuilt in code, never a screen recording',
    data_story: 'build each chart one piece at a time (axes, then the unit named, then the data growing, then one annotation on the thing to notice), hold long, cut rarely, and end on the conclusion and then the source, held about 4 s. Use only real figures: those in the brief, or ones you find with web search from a reliable publisher, quoted exactly with units and years, and put the exact numbers in each shot so the builder can chart them. Never invent or round data into something it isn\'t',
  };
  const system = (launch ? [
    `You are a motion designer planning a short product launch film. It will be built entirely in code (p5.js painting plus an HTML/CSS/SVG layer, rendered in headless Chrome): no live footage, photos or photoreal 3D. Plan a film that code can make beautifully.`,
    `Rules: one focal point at a time; every shot has something happening; a designed transition at every seam; ${reading}; ${tiling}; finish on an end card with the product name and call to action.`,
    `Genre recipe:\n${recipe}`,
    craft ? `Measured craft of top-tier launch films:\n${craft}` : '',
    `You may search the web to get the product right: what its interface and key features look like, its real wording and brand. Keep it to what makes the story accurate; never plan to reuse another company's footage, logos or assets.`,
  ] : [
    `You are a motion designer planning a short ${f?.label.toLowerCase() ?? 'motion-graphics'} film (not a launch film). It will be built entirely in code (p5.js painting plus an HTML/CSS/SVG layer, rendered in headless Chrome): no live footage, photos, narration or photoreal 3D. Plan a film that code can make beautifully.`,
    `Rules: one focal point at a time; follow this genre's measured pace, not a launch film's (its beats are longer and it holds longer); ${reading}; ${tiling}; ${ending[b.family] ?? 'end the way the genre recipe says'}.`,
    `Genre recipe:\n${recipe}`,
    craft ? `Measured structure of this genre's reference films:\n${craft}` : '',
    `You may search the web to get the facts right. Keep it to what makes the film accurate; never plan to reuse anyone's footage, characters, logos or assets.`,
  ]).filter(Boolean).join('\n\n');
  const user = previous
    ? `${briefMarkdown(b, similar)}\n\n# Current storyboard\n\n${storyboardMarkdown(previous)}\n\n# Change requested\n\n${change}\n\nReturn the full revised storyboard.`
    : `${briefMarkdown(b, similar)}\n\nWrite the storyboard for a ${b.length}s film.`;
  const { data: s } = await structured<Storyboard>((await getSettings()).planningModel, system, user, STORYBOARD_SCHEMA, { maxTokens: 16000, search: 3 });
  // keep the shots tiling 0..length even if the model drifts
  s.shots.sort((a, c) => a.t0 - c.t0);
  s.shots.forEach((sh, i) => { sh.t0 = i ? s.shots[i - 1].t1 : 0; if (i === s.shots.length - 1) sh.t1 = b.length; });
  return s;
}
