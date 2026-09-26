// index.js: the scene manifest. studio.html?scene=<name> (render.mjs --scene=<name>) loads one scene: its libs, in
// order, then its file, with its project settings layered over PROJECT from config.js. With no ?scene, PROJECT.scene.
//   LIBS:   named groups of script files a scene can ask for. Character kits define the same globals (EMO, feel, VIEWS,
//           ...), so a scene loads at most one of clawd / jolly.
//   SCENES: file, libs, and project (any PROJECT key: duration, bpm, offset, style, canvasBg, fonts, audio, size,
//           theme, brand), and optionally dir: a project folder whose project.js is loaded first (projects/README.md).
//           fonts are Google Fonts families as in their css2 URL ('Inter:wght@400;600;800'); they're loaded and
//           preloaded before the first frame.
const LIBS = {
  clawd: ['src/clawd.js', 'src/sheets.js'],
  jolly: ['src/jolly.js', 'src/muse_sheets.js'],
  human: ['src/human.js'],
  // motion-graphics kit (docs/motion_design_spec.md): tokens, measured motion presets, type, UI, cursor
  mg: ['src/lib/theme.js', 'src/lib/motion.js', 'src/lib/type.js', 'src/lib/ui.js', 'src/lib/cursor.js', 'src/lib/shapes.js',
    'src/lib/fx.js', 'src/lib/camera.js', 'src/lib/transitions.js', 'src/lib/brand.js', 'src/lib/media.js', 'src/lib/audio.js'],
};

const SCENES = {
  booked: { file: 'src/scenes/muse_demo.js', libs: ['jolly', 'human'], project: { duration: 30, style: 'clean' } },
  clawd: { file: 'src/scenes/demo.js', libs: ['clawd'], project: { duration: 11, style: 'painted' } },
  launch_demo: { file: 'src/scenes/launch_demo.js', libs: ['mg'], project: { duration: 21.6, style: 'clean', canvasBg: null, fonts: ['Inter:wght@400;500;600'] } },
  launch_demo_square: { file: 'src/scenes/launch_demo.js', libs: ['mg'], project: { duration: 21.6, style: 'clean', canvasBg: null, size: 'square', fonts: ['Inter:wght@400;500;600'] } },
  launch_demo_vertical: { file: 'src/scenes/launch_demo.js', libs: ['mg'], project: { duration: 21.6, style: 'clean', canvasBg: null, size: 'portrait', fonts: ['Inter:wght@400;500;600'] } },
  launch_demo_dark: { file: 'src/scenes/launch_demo.js', libs: ['mg'], project: { duration: 21.6, style: 'clean', canvasBg: null, theme: 'dark', fonts: ['Inter:wght@400;500;600'] } },
  // the kit's model sheets: studio.html?scene=kit&loop=kit_ui (kit_motion, kit_type, kit_shapes, kit_fx, kit_transitions, kit_brand)
  relay_demo: { file: 'src/scenes/relay_demo.js', libs: ['mg'], project: { duration: 20.5, style: 'clean', canvasBg: null, fonts: ['Inter:wght@300;400;500;600'],
    brand: { name: 'Relay', tagline: 'Every tool, one inbox.', cta: 'Get early access', logo: { d: 'M4.5 8.5 H15.5 M12.5 5.5 L15.5 8.5 L12.5 11.5 M19.5 15.5 H8.5 M11.5 12.5 L8.5 15.5 L11.5 18.5' } } } },
  // two characters in one frame, through their namespaces (see character() in core.js)
  duo: { file: 'src/scenes/duo.js', libs: ['clawd', 'jolly'], project: { duration: 4, style: 'painted' } },
  // a project folder (projects/<name>/: brief.md, project.js, assets/, scene.js); see projects/README.md
  footage_demo: { dir: 'projects/demo', file: 'projects/demo/scene.js', libs: ['mg'], project: { duration: 21, style: 'clean', canvasBg: null } },
  // checks that D.video is frame-exact (scripts/check_video_frames.mjs)
  video_test: { file: 'src/scenes/video_test.js', libs: [], project: { duration: 8, style: 'clean', canvasBg: null } },
  kit: { file: 'src/lib/sheets.js', libs: ['mg'], project: { duration: 1, style: 'clean', canvasBg: null, fonts: ['Inter:wght@300;400;500;600;800'],
    brand: { name: 'Relay', tagline: 'Every tool, one inbox.', cta: 'Get early access' } } },
  mg_demo: {
    file: 'src/scenes/mg_demo.js', libs: [],
    project: { duration: 11, style: 'clean', canvasBg: null, fonts: ['Inter:wght@400;500;600;700;800'] },
  },
};
