// dom.js: the DOM layer. HTML, CSS and SVG as a second drawing surface next to the p5 canvas, for UI, typography and
// anything the browser renders better than paint: real fonts, blur, shadows, glass, gradients, 2.5D tilts.
//
// Immediate mode, like p5: each frame, a shot DECLARES everything on screen, in paint order (later = on top). The engine
// reuses last frame's elements, applies this frame's props and removes whatever wasn't declared, so a frame is still a
// pure function of t: nothing a shot set on an earlier frame survives unless it sets it again.
//
//   D.div(key?, props?, kids?)       a box; its children flow (flexbox and grid layouts work) unless given pos: 'abs'
//   D.group(key?, props?, kids?)     a layer the size of its parent; its children are placed absolutely (x, y)
//   D.text(key?, str, props?)        a span of text          D.img(key?, src, props?)    an image, decoded before capture
//   D.svg(key?, props?, kids?)       inline SVG; inside it D.path, D.circle, D.rect, D.line, D.g, ... take SVG attrs
//   D.video(key, src, time, props?) a video frame: the frame at media time `time` (seconds), frame-exact; capture waits
//                                    for the seek. Compute time from t (lib/media.js does offsets, loops, speed ramps).
//   D.el(tag, key?, props?, kids?)   any element
//   D.cam(cx, cy, zoom, rot, kids)   camera: world point (cx, cy) lands at screen centre (same maths as camBegin)
//   D.canvas()                       the p5 painting, at this point in the paint order
// kids is a function that declares the children. The key is optional (it defaults to the tag and call index within the
// parent); a key only lets the engine reuse the same element (images aren't re-decoded), it never changes the picture.
//
// props (all optional):
//   x, y           position in px. Children of the stage, a group or a camera sit at (x, y); flowing children move by it.
//   dx, dy         an extra offset added to x, y (for entrance and exit moves: spread enter() from lib/motion.js)
//   w, h           size (px, or any CSS length)
//   ax, ay         anchor, 0..1 of the element's own size: (x, y) is where that point lands. Default 0, 0 (top-left).
//   scale, sx, sy, rot (deg), rx, ry (deg, 2.5D tilt: give an ancestor persp), z (px, translateZ), persp (px)
//   origin         transform-origin (default: the anchor)
//   opacity, blur (px), bg, color, radius, shadow, font     shorthands for the obvious CSS
//   style          any CSS, camelCase or kebab-case; numbers become px except for unitless properties
//   cls            class name(s)      attrs: attributes (SVG geometry, href, ...)      text / html: content
//   pos            'abs' or 'flow', to override the default
//
// Everything moves only through t: CSS animations and transitions are switched off under #stage and SVG animation is
// paused. Images inside html strings are awaited too; CSS background-image URLs are not, so use D.img for pictures.
const D = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const SVG_TAGS = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan', 'defs',
    'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'use', 'filter', 'feGaussianBlur', 'feOffset', 'feMerge',
    'feMergeNode', 'feColorMatrix', 'feBlend', 'pattern', 'image', 'symbol', 'foreignObject', 'textPath']);
  const UNITLESS = new Set(['opacity', 'z-index', 'font-weight', 'line-height', 'flex', 'flex-grow', 'flex-shrink', 'order', 'zoom',
    'scale', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'stroke-miterlimit', 'aspect-ratio', 'column-count', 'grid-row',
    'grid-column', 'grid-row-start', 'grid-row-end', 'grid-column-start', 'grid-column-end', 'tab-size', 'widows', 'orphans']);
  const kebab = k => k.includes('-') ? k : k.replace(/^Webkit/, '-webkit').replace(/[A-Z]/g, c => '-' + c.toLowerCase());
  const cssVal = (k, v) => typeof v === 'number' && !UNITLESS.has(k) ? v + 'px' : String(v);
  const len = v => typeof v === 'number' ? v + 'px' : v;

  let stage = null, frame = 0, stack = [], live = false, canvasOn = false, camN = 0;

  // Freeze CSS motion under the stage: in a video, the only clock is t.
  const freeze = document.createElement('style');
  freeze.textContent = '#stage, #stage *, #stage *::before, #stage *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }';
  document.head.appendChild(freeze);

  function init(el) { stage = el; stage._kids = new Map(); }

  function begin() { frame++; live = false; canvasOn = false; camN = 0; stack = [{ el: stage, n: {}, i: 0, keys: new Set(), abs: true }]; }

  function end() {
    prune(stack[0]);
    // A frame with no DOM is a pure p5 frame: the painting is the whole picture. A frame with DOM shows the painting only
    // where it declared D.canvas().
    if (outC.parentNode !== stage) stage.insertBefore(outC, stage.firstChild);
    outC.style.display = !live || canvasOn ? '' : 'none';
    if (!live && stage.firstChild !== outC) stage.insertBefore(outC, stage.firstChild);
  }

  // Remove the children of ctx.el that weren't declared this frame (the p5 canvas is only ever hidden, never removed).
  function prune(ctx) {
    const kids = ctx.el._kids; if (!kids) return;
    for (const [k, el] of kids) if (el._stamp !== frame && el !== outC) { el.remove(); kids.delete(k); }
  }

  function place(ctx, el) {
    const at = ctx.el.childNodes[ctx.i];
    if (at !== el) ctx.el.insertBefore(el, at || null);
    ctx.i++;
  }

  function el(tag, key, props, kids) {
    // optional key: el(tag, props, kids) or el(tag, kids)
    if (typeof key === 'function') { kids = key; key = null; props = {}; }
    else if (key != null && typeof key === 'object') { kids = props; props = key; key = null; }
    if (typeof props === 'function') { kids = props; props = {}; }
    props = props || {};
    const ctx = stack[stack.length - 1], parent = ctx.el;
    if (!parent._kids) parent._kids = new Map();
    const id = key != null ? 'k:' + key : tag + '#' + (ctx.n[tag] = (ctx.n[tag] || 0) + 1);
    if (ctx.keys.has(id)) throw new Error(`D: two elements with key "${key}" in the same parent`);
    ctx.keys.add(id);
    // inside an <svg> (but not a foreignObject), elements are SVG and take no CSS positioning
    const inSvg = parent.namespaceURI === NS && parent.localName !== 'foreignObject';
    let e = parent._kids.get(id);
    if (!e || e._tag !== tag) {
      if (e) e.remove();
      e = tag === 'svg' || (inSvg && SVG_TAGS.has(tag)) ? document.createElementNS(NS, tag) : document.createElement(tag);
      e._tag = tag; e._style = {}; e._attrs = {};
      if (tag === 'svg') { e.setAttribute('overflow', 'visible'); e.pauseAnimations?.(); }
      parent._kids.set(id, e);
    }
    e._stamp = frame; live = true;
    place(ctx, e);
    apply(e, props, inSvg, props.pos ? props.pos === 'abs' : ctx.abs);
    if (props.text != null || props.html != null) {
      if (kids) throw new Error('D: an element takes text/html or kids, not both');
      e._kids = null;
    } else {
      // (apply already cleared any text an earlier frame left in it)
      stack.push({ el: e, n: {}, i: 0, keys: new Set(), abs: props._layer === true });
      if (kids) kids();
      prune(stack.pop());
    }
    return e;
  }

  function apply(e, p, svg, abs) {
    const s = {};
    if (!svg) {
      s.position = abs ? 'absolute' : 'relative';
      if (abs) { s.left = '0px'; s.top = '0px'; }
      s['box-sizing'] = 'border-box';
    }
    if (p.w != null) s.width = len(p.w);
    if (p.h != null) s.height = len(p.h);
    const ax = p.ax || 0, ay = p.ay || 0, tf = [];
    const tx = (p.x || 0) + (p.dx || 0), ty = (p.y || 0) + (p.dy || 0);
    if (tx || ty) tf.push(`translate(${tx}px, ${ty}px)`);
    if (ax || ay) tf.push(`translate(${-ax * 100}%, ${-ay * 100}%)`);
    if (p.z) tf.push(`translateZ(${p.z}px)`);
    if (p.rx) tf.push(`rotateX(${p.rx}deg)`);
    if (p.ry) tf.push(`rotateY(${p.ry}deg)`);
    if (p.rot) tf.push(`rotate(${p.rot}deg)`);
    const sx = (p.scale ?? 1) * (p.sx ?? 1), sy = (p.scale ?? 1) * (p.sy ?? 1);
    if (sx !== 1 || sy !== 1) tf.push(`scale(${sx}, ${sy})`);
    if (p._tf) tf.push(p._tf);
    if (tf.length) {
      s.transform = tf.join(' ');
      s['transform-origin'] = p.origin || `${ax * 100}% ${ay * 100}%`;
      if (svg) s['transform-box'] = 'fill-box';
    }
    if (p.persp) { s.perspective = p.persp + 'px'; s['transform-style'] = 'preserve-3d'; }
    if (p.rx || p.ry || p.z) s['transform-style'] = 'preserve-3d';
    if (p.opacity != null) s.opacity = String(clamp(p.opacity));
    if (p.bg != null) s.background = p.bg;
    if (p.color != null) s.color = p.color;
    if (p.radius != null) s['border-radius'] = len(p.radius);
    if (p.shadow != null) s['box-shadow'] = p.shadow;
    if (p.font != null) s.font = p.font;
    if (p.style) for (const k in p.style) { const kk = kebab(k), v = p.style[k]; if (v != null && v !== false) s[kk] = cssVal(kk, v); }
    if (p.blur) s.filter = `blur(${p.blur}px)` + (s.filter ? ' ' + s.filter : '');
    // styles: when anything changed, rewrite the whole declaration in order. Updating single properties isn't safe with
    // shorthands: setting `background` resets `background-image`, and removing a stale longhand clears the shorthand's.
    const old = e._style, ks = Object.keys(s), ko = Object.keys(old);
    if (ks.length !== ko.length || ks.some((k, i) => k !== ko[i] || s[k] !== old[k])) {
      e.removeAttribute('style');
      for (const k of ks) e.style.setProperty(k, s[k]);
    }
    e._style = s;
    // attributes
    const a = { ...(p.attrs || {}) };
    if (p.cls) a.class = p.cls;
    if (p.src != null) a.src = p.src;
    const oa = e._attrs;
    for (const k in a) if (a[k] != null && oa[k] !== String(a[k])) e.setAttribute(k, a[k]);
    for (const k in oa) if (!(k in a) || a[k] == null) e.removeAttribute(k);
    e._attrs = Object.fromEntries(Object.entries(a).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]));
    // content
    if (p.text != null) { const t = String(p.text); if (e._text !== t || e._html != null) { e.textContent = t; e._text = t; e._html = null; } }
    else if (p.html != null) { if (e._html !== p.html) { e.innerHTML = p.html; e._html = p.html; e._text = null; } }
    else if (e._text != null || e._html != null) { e.textContent = ''; e._text = e._html = null; }
  }

  // Wait until the frame is ready to capture: layout done, every font it uses loaded, every image decoded.
  async function ready() {
    void stage.offsetWidth;
    await document.fonts.ready;
    await Promise.all([...stage.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
    await Promise.all([...stage.querySelectorAll('video')].map(seek));
  }
  // Seek a video to the media time its frame declared, and resolve once that frame is decoded. A millisecond past the
  // exact time, so float error never shows the frame before.
  const once = (v, ev) => new Promise(r => v.addEventListener(ev, r, { once: true }));
  async function seek(v) {
    if (v.readyState < 1) await once(v, 'loadedmetadata');
    const want = Math.max(0, Math.min((v._want || 0) + 1e-3, v.duration - 1e-3));
    if (Math.abs(v.currentTime - want) > 1e-4) { const s = once(v, 'seeked'); v.currentTime = want; await s; }
    if (v.readyState < 2) await once(v, 'loadeddata');
  }

  const api = {
    init, begin, end, ready,
    get live() { return live; },
    el,
    div: (k, p, c) => el('div', k, p, c),
    text: (k, str, p) => { if (typeof str !== 'string' && typeof str !== 'number') { p = str; str = k; k = null; } return el('span', k, { ...(p || {}), text: str }); },
    img: (k, src, p) => { if (typeof src !== 'string') { p = src; src = k; k = null; } return el('img', k ?? src, { ...(p || {}), src }); },
    video(k, src, time = 0, p = {}) {
      const e = el('video', k ?? src, { ...p, src, attrs: { muted: '', playsinline: '', preload: 'auto', ...(p.attrs || {}) }, style: { objectFit: 'cover', ...(p.style || {}) } });
      e.muted = true; e._want = time;   // sound goes through the audio cues (lib/audio.js), never the element
      return e;
    },
    group: (k, p, c) => {
      if (typeof k === 'function') { c = k; k = null; p = {}; } else if (k != null && typeof k === 'object') { c = p; p = k; k = null; }
      if (typeof p === 'function') { c = p; p = {}; }
      p = p || {};
      return el('div', k, { w: '100%', h: '100%', origin: '50% 50%', ...p, _layer: true }, c);
    },
    // Same maths as camBegin: translate(W/2, H/2) rotate(rot) scale(zoom) translate(-cx, -cy). rot in radians.
    cam(cx = W / 2, cy = H / 2, zoom = 1, rot = 0, kids) {
      if (typeof rot === 'function') { kids = rot; rot = 0; }
      const prev = CAM; CAM = LAST_CAM = { cx, cy, zoom, rot };
      const e = el('div', '__cam' + (++camN), { w: W, h: H, pos: 'abs', origin: '0 0', _layer: true,
        _tf: `translate(${W / 2}px, ${H / 2}px) rotate(${rot}rad) scale(${zoom}) translate(${-cx}px, ${-cy}px)` }, kids);
      CAM = prev;
      return e;
    },
    canvas() {
      const ctx = stack[stack.length - 1];
      if (ctx.el !== stage) throw new Error('D.canvas(): declare the p5 painting at the top level, not inside another element');
      canvasOn = true; place(ctx, outC); outC._stamp = frame;
    },
  };
  for (const t of ['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'use'])
    if (!api[t]) api[t] = (k, p, c) => el(t, k, p, c);
  return api;
})();
