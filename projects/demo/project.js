// project.js: the demo project's settings, loaded before the engine (see projects/README.md). Paths are relative to
// this folder's assets/. The media are stand-ins made by scripts/make_demo_assets.mjs; a real project puts its own
// footage, recordings, music, logo and fonts in assets/.
PROJECT_FILE({
  fonts: ['Inter:wght@400;500;600;700'],
  brand: {
    name: 'Tandem', tagline: 'Your team, in sync.', cta: 'Start free', url: 'tandem.example',
    accent: '#0E7C66', logo: { src: 'logo.svg' },
  },
  // captions as WebVTT (the usual export from an editor or a transcription tool), plus word timings for the highlight
  captionsVTT: `WEBVTT

00:00:13.400 --> 00:00:15.100
We used to lose a day a week to updates.

00:00:15.300 --> 00:00:16.900
Now Tandem writes them for us.`,
  captionWords: {
    1: [[15.3, 'Now'], [15.55, 'Tandem'], [15.95, 'writes'], [16.25, 'them'], [16.45, 'for'], [16.6, 'us.']],
  },
});
