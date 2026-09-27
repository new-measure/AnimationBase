// data_story_demo.js: "427", a 51-second data story on the carbon dioxide measured at Mauna Loa, built from src/lib/
// (chart.js for the charts) and following the data-story recipe (docs/genres/data_story.md): dark, muted, one highlight
// colour; the chart built one piece at a time (frame, unit, data, the one thing to notice), each held until read; two
// hard cuts in 51 s (the genre's ~2.7 a minute); a layout morph from one encoding to the next; the source held at the end.
// Data: NOAA Global Monitoring Laboratory, Mauna Loa annual mean CO₂ (gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.txt,
// fetched 2026-09-26). Every number on screen is computed from DATA below. Designed for 16:9.
//   0–9 s     hook: the number, counted up, then what it measures
//   9–41      the chart: axes, unit, the line grows 1959 → 2025; 1959 and 2025 annotated; the difference bracketed.
//             Then: "rising faster": the line splits into decades, the chart slides left, and each decade's stretch
//             becomes a bar of ppm added per year; the last bar is annotated against the first
//   41–51     conclusion and source
(() => {
  const DATA = [[1959, 315.98], [1960, 316.91], [1961, 317.64], [1962, 318.45], [1963, 318.99], [1964, 319.62], [1965, 320.04], [1966, 321.37],
    [1967, 322.18], [1968, 323.05], [1969, 324.62], [1970, 325.68], [1971, 326.32], [1972, 327.46], [1973, 329.68], [1974, 330.19], [1975, 331.13],
    [1976, 332.03], [1977, 333.84], [1978, 335.41], [1979, 336.84], [1980, 338.76], [1981, 340.12], [1982, 341.48], [1983, 343.15], [1984, 344.87],
    [1985, 346.35], [1986, 347.61], [1987, 349.31], [1988, 351.69], [1989, 353.20], [1990, 354.45], [1991, 355.70], [1992, 356.54], [1993, 357.21],
    [1994, 358.96], [1995, 360.97], [1996, 362.74], [1997, 363.88], [1998, 366.84], [1999, 368.54], [2000, 369.71], [2001, 371.32], [2002, 373.45],
    [2003, 375.98], [2004, 377.70], [2005, 379.98], [2006, 382.09], [2007, 384.02], [2008, 385.83], [2009, 387.64], [2010, 390.10], [2011, 391.85],
    [2012, 394.06], [2013, 396.74], [2014, 398.81], [2015, 401.01], [2016, 404.41], [2017, 406.76], [2018, 408.72], [2019, 411.65], [2020, 414.21],
    [2021, 416.41], [2022, 418.53], [2023, 421.08], [2024, 424.61], [2025, 427.35]];
  const val = y => DATA.find(d => d[0] === y)[1], FIRST = DATA[0], LAST = DATA[DATA.length - 1];
  // ppm added per year, by decade (from each decade's start to the next; the 2020s so far: 2020 → 2025)
  const DEC = [1960, 1970, 1980, 1990, 2000, 2010, 2020].map(d => { const e = Math.min(d + 10, LAST[0]); return [d, e, (val(e) - val(d)) / (e - d)]; });
  const RATIO = DEC[DEC.length - 1][2] / DEC[0][2];
  const RISING = DATA.every((d, i) => !i || d[1] > DATA[i - 1][1]), SPEEDING = DEC[DEC.length - 1][2] > DEC[DEC.length - 2][2];
  const f1 = v => v.toFixed(1), N = v => Math.round(v).toString();
  const ratioWords = Math.abs(RATIO - Math.round(RATIO)) < .15 ? ['', '', 'twice', 'three times', 'four times'][Math.round(RATIO)] || `${f1(RATIO)}×` : `${f1(RATIO)}×`;

  const M = THEME.margin * W, HI = THEME.accent, TINT = '#FFD7B0';   // TINT: every other decade, opaque (a translucent accent over the accent line would be invisible)
  // the line chart, full width, then slid to the left half for the bars (a layout morph: Tx.rect of its box)
  const BOX_A = { x: M + px(40), y: px(250), w: W - 2 * M - px(160), h: px(600) };
  const BOX_B = { x: M + px(40), y: px(250), w: W * .40, h: px(600) };
  const BARS = { x: W * .62, y: px(330), w: W - M - W * .62, h: px(520) };
  const LY = [300, 440], LX = [FIRST[0], LAST[0]];

  // shot B's times (local)
  const T = { title: .3, axes: .9, unit: 2.2, grow: 3.4, a1: 10.2, a2: 12.4, span: 14.6, out: 18.2, faster: 18.9, segs: 20.1, slide: 21.4,
    bAxes: 22.6, bars: 23.4, hiK: 26.4, a3: 27.4 };

  Sound.music('assets/music/soft_pad_110.m4a', { gain: -15, fadeOut: 2.5 });
  [9 + T.a1, 9 + T.a2, 9 + T.span, 9 + T.a3].forEach(t => Sound.sfx(t + .1, 'tick', { gain: -18 }));
  Sound.sfx(9 + T.bars, 'whoosh', { gain: -22 });

  const bg = () => D.div({ w: W, h: H, bg: THEME.bg });
  const glow = (x, y, r, a = 1) => D.div({ x, y, w: r * 2, h: r * 2, ax: .5, ay: .5, opacity: a, bg: `radial-gradient(closest-side, ${alpha(HI, .10)}, transparent)` });

  shots([
    // A: the hook: the number
    [0, (t, lt, dur) => {
      const out = 0;   // a hard cut to the chart (cuts are the genre's main transition)
      bg(); glow(W / 2, H * .48, px(700), .8);
      D.group({ opacity: 1 - out }, () => {
        Type.line('lead', 'Last year, the air over Mauna Loa held', lt, .3, { x: W / 2, y: H * .30, ax: .5, ay: .5 }, { size: 'title', weight: 400, color: THEME.muted });
        D.div({ x: W / 2, y: H * .5, ax: .5, ay: .5, style: { display: 'flex', alignItems: 'baseline', gap: px(24) } }, () => {
          Type.counter('n', 0, LAST[1], lt, 1.2, 1.8, enter(anim(lt, 1.1, 'text'), 'rise', 20), { size: 220, weight: 600, color: HI, fmt: N });
          Type.line('ppm', 'ppm', lt, 1.5, {}, { size: 96, weight: 500, color: HI });
        });
        Type.words('what', 'parts of carbon dioxide in every million parts of air.', lt, 3.6, { x: W / 2, y: H * .69, ax: .5, ay: .5 }, { size: 'title', weight: 400, color: THEME.text, align: 'center' });
      });
    }],

    // B: the chart, then the rate of rise
    [9, (t, lt, dur) => {
      bg();
      const slide = anim(lt, T.slide, { dur: 1.1, ease: 'inOut' });
      const F = Chart.frame(Tx.rect(BOX_A, BOX_B, slide), LX, LY);
      const end = 0;   // hard cut to the conclusion
      D.group({ opacity: 1 - end }, () => {
        // the title, then the question it turns into
        Type.line('t1', `Carbon dioxide at Mauna Loa, ${FIRST[0]}–${LAST[0]}`, lt, T.title, { x: BOX_A.x - px(16), y: px(96) }, { size: 'title', weight: 500, out: T.out });
        Type.line('t2', 'And it’s rising faster, decade by decade.', lt, T.faster, { x: BOX_A.x - px(16), y: px(96) }, { size: 'title', weight: 500 });

        Chart.axes('ax', F, lt, T.axes, { xTicks: [1960, 1970, 1980, 1990, 2000, 2010, 2020], yTicks: [320, 360, 400, 440].filter(v => v < LY[1]), xFmt: v => slide > .5 && v % 20 ? '' : String(v) });
        Chart.unit('u', F, 'CO₂, parts per million (annual mean)', lt, T.unit);

        // decade stretches, alternating tints, fade in over the line before it slides
        const segs = DEC.map(([a, b], i) => [a, b, i % 2 ? TINT : HI]);
        const L = Chart.line('co2', F, DATA, lt, T.grow, { dur: 6, ease: 'linear', segs, segK: anim(lt, T.segs, 'default'), dot: lt < T.segs + .6 });
        // a running readout at the head while it grows
        const grow = seg(lt, T.grow, T.grow + 6);
        if (grow > 0 && lt < T.a1) {
          const yr = Math.round(lerp(LX[0], LX[1], grow));
          D.text('read', `${yr}  ${N(L.head[2])}`, { x: L.head[0] + px(18), y: L.head[1] - px(18), ay: 1, font: `500 ${px(22)}px ${THEME.font}`, color: THEME.muted,
            style: { whiteSpace: 'pre', fontVariantNumeric: 'tabular-nums' }, opacity: 1 - seg(lt, T.grow + 6.2, T.a1) });
        }
        const p0 = [F.sx(FIRST[0]), F.sy(FIRST[1])], p1 = [F.sx(LAST[0]), F.sy(LAST[1])];
        Chart.annotate('a1', p0, `${N(FIRST[1])} ppm\nin ${FIRST[0]}`, lt, T.a1, { dx: px(90), dy: px(-150), align: 'right', out: T.out });
        Chart.annotate('a2', p1, `${N(LAST[1])} ppm\nin ${LAST[0]}`, lt, T.a2, { dx: px(-170), dy: px(-40), out: T.out });
        Chart.span('sp', p0, p1, `+${N(LAST[1] - FIRST[1])} ppm`, lt, T.span, { x: BOX_A.x + BOX_A.w + px(50), out: T.out });

        // the bars: each decade's stretch of the line, re-encoded as the ppm it added per year
        if (lt > T.bAxes - .2) {
          const B = Chart.frame(BARS, [-.5, DEC.length - .5], [0, 4]);
          Chart.axes('bx', B, lt, T.bAxes, { xTicks: DEC.map((_, i) => i), yTicks: [1, 2, 3], grid: true,
            xFmt: i => DEC[i][0] === 2020 ? '2020s*' : `’${String(DEC[i][0]).slice(2)}s`, size: 20 });
          Chart.unit('bu', B, 'ppm added per year', lt, T.bAxes + .5);
          Chart.bars('bars', B, DEC.map(([, , r], i) => [i, r]), lt, T.bars, { hi: [DEC.length - 1], hiK: anim(lt, T.hiK, 'default'), labels: true, fmt: f1, stagger: .28,
            from: i => { const [a, b] = DEC[i], v = lerp(val(a), val(b), .5); return { x: F.sx(a), y: F.sy(v) - px(3), w: F.sx(b) - F.sx(a), h: px(6), r: px(3) }; } });
          const last = DEC.length - 1;
          Chart.annotate('a3', [B.sx(last), B.sy(DEC[last][2])], `${f1(DEC[last][2])} a year since 2020:\n${ratioWords} the pace of the 1960s`, lt, T.a3,
            { dx: px(-40), dy: px(-120), r: 10 });
          Chart.source('fn', '* 2020–2025 so far', lt, T.bAxes + 1, { x: BARS.x + BARS.w, y: BARS.y + BARS.h + px(64), ax: 1 });
        }
      });
    }],

    // C: conclusion, then the source, held
    [41, (t, lt, dur) => {
      bg(); glow(W / 2, H * .42, px(760), .7);
      const out = anim(lt, dur - .8, { dur: .75, ease: 'inOut' });
      D.group({ opacity: 1 - out }, () => {
        Type.words('c1', RISING ? `Every year since ${FIRST[0]} has ended higher than the one before.` : `${LAST[0]}: the highest annual mean on record.`, lt, .3,
          { x: W / 2, y: H * .40, ax: .5, ay: .5, w: W - 2 * M }, { size: 'headline', weight: 500, align: 'center', wrap: true });
        if (SPEEDING) Type.line('c2', 'And the yearly rise is still getting bigger.', lt, 2.6, { x: W / 2, y: H * .40 + px(150), ax: .5, ay: .5 }, { size: 'title', weight: 400, color: HI });
        Chart.source('src', `Source: NOAA Global Monitoring Laboratory, Mauna Loa Observatory: annual mean CO₂, ${FIRST[0]}–${LAST[0]}`, lt, 4.4,
          { x: W / 2, y: H - px(110), ax: .5, ay: .5 });
      });
    }],
  ]);
})();
