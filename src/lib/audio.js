// audio.js (Sound): a film's sound, declared once (at scene load, not in shot functions) and mixed by render.mjs at encode:
// a music bed, sound effects at event times, and clips (voice-over, or a video's own sound). 71–100% of launch films
// have sound; loudness sits around -13 to -19 LUFS by family, so the mix is normalised to -15 LUFS (-1.5 dBTP).
//   Sound.music(src, o)          the bed: o.gain (dB), o.from (s into the file), o.fadeIn, o.fadeOut (s)
//   Sound.sfx(t, name, o)        a sound at film time t: name is one of assets/sfx/ (click, tick, pop, whoosh, chime,
//                                type) or a path; o.gain (dB)
//   Sound.clip(t, src, o)        a stretch of any audio or video file at t: o.from, o.dur, o.gain
//   Sound.clicks(keys, o)        one click cue per { click: true } key of a Cursor path (the same keys array)
//   Sound.typing(str, t0, cps)   soft key taps along a Type.typed() run (one per ~3 characters)
//   Sound.plan()                 { music, cues } for render.mjs
// The mix leaves music under effects: effects default to -6 dB, music to -14 dB, both before normalisation.
const Sound = (() => {
  const plan = { music: null, cues: [] };
  const path = name => name.includes('/') ? name : `assets/sfx/${name}.wav`;
  return {
    music(src, o = {}) { plan.music = { src, gain: o.gain ?? -14, from: o.from || 0, fadeIn: o.fadeIn ?? .8, fadeOut: o.fadeOut ?? 1.5 }; },
    sfx(t, name, o = {}) { plan.cues.push({ t, src: path(name), gain: o.gain ?? -6, from: 0, dur: null }); },
    clip(t, src, o = {}) { plan.cues.push({ t, src, gain: o.gain ?? 0, from: o.from || 0, dur: o.dur ?? null }); },
    clicks(keys, o = {}) { for (const k of keys) if (k.click) this.sfx(k.t - 1 / 24, o.name || 'click', o); },
    typing(str, t0, cps = 16, o = {}) {
      let last = -1;
      Type.charTimes(str, t0, cps).forEach((at, i) => { if (i % 3 === 0 && at - last > .08) { this.sfx(at, 'type', { gain: o.gain ?? -14 }); last = at; } });
    },
    plan: () => JSON.parse(JSON.stringify(plan)),
  };
})();
window.audioPlan = () => Sound.plan();
