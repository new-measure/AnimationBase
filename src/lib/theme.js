// theme.js: design tokens for the motion-graphics libs. The defaults are measured from top-tier launch films
// (docs/motion_design_spec.md): light by default, one sans family, regular and medium weights, headline cap ≈ 44 px at
// 1080p (font-size 64), one accent colour on a near-neutral palette, radius 28, margin 12% of width, soft or no shadow.
//   PROJECT.theme  'light' (default) or 'dark'
//   PROJECT.brand  overrides, e.g. { accent: '#FF5A1F', font: '"Geist", sans-serif', radius: { md: 20 } }
// Components read THEME, never hard-coded colours or sizes. Sizes are px at 1080 px on the short side; px(n) scales
// them to the canvas (a square or vertical canvas keeps the same type size relative to its width).
const THEMES = {
  light: {
    dark: false, bg: '#F5F4F1', surface: '#FFFFFF', surface2: '#F1F0EC', line: 'rgba(22,22,32,.09)',
    text: '#17171F', muted: '#4E4E5A', faint: '#A3A3AD', accent: '#4F46E5', onAccent: '#FFFFFF',
    shadow: '0 24px 64px rgba(24,24,48,.10), 0 2px 8px rgba(24,24,48,.06)', glow: 'rgba(79,70,229,.14)',
  },
  dark: {
    dark: true, bg: '#0C0C10', surface: '#16161D', surface2: '#1F1F28', line: 'rgba(255,255,255,.09)',
    text: '#F3F3F6', muted: '#A1A1AC', faint: '#5C5C68', accent: '#8B7CFF', onAccent: '#FFFFFF',
    shadow: '0 32px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06)', glow: 'rgba(139,124,255,.22)',
  },
};
// Contrast (measured against bg, surface and surface2): text ≥ 15:1, muted ≥ 7:1 (the reading rule for any text you
// expect to be read), faint ≈ 2.2:1: for placeholders, meta and decoration only, never for reading text.
const TOKENS = {
  font: '"Inter", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace',
  size: { hero: 96, headline: 64, title: 40, body: 26, small: 20 },   // font-size px; ≥ 20 keeps small text readable
  weight: { body: 400, strong: 500, emph: 600 },
  radius: { sm: 12, md: 28, lg: 48 },
  margin: .12,                                                        // of the canvas width
};
const THEME = (() => {
  const b = PROJECT.brand || {}, base = THEMES[PROJECT.theme || 'light'];
  return { ...base, ...TOKENS, ...b, size: { ...TOKENS.size, ...b.size }, weight: { ...TOKENS.weight, ...b.weight }, radius: { ...TOKENS.radius, ...b.radius } };
})();
const px = n => n * Math.min(W, H) / 1080;
// A colour with alpha, from #rrggbb.
const alpha = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
