/* =====================================================================
   XIRAIYA — Motion Academy: a tiny After Effects-style engine
   Layers · keyframes with per-segment easing · timeline · effect
   controls · motion paths · CSS export.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, I = XR.icon, esc = XR.esc;
  var FPS = 30, CW = 960, CH = 540;

  /* ------------------------------------------------------------------
     Easing
     ------------------------------------------------------------------ */
  var EASE = {
    lin: function (k) { return k; },
    in: function (k) { return k * k * k; },
    out: function (k) { return 1 - Math.pow(1 - k, 3); },
    io: function (k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    expo: function (k) { return k === 1 ? 1 : 1 - Math.pow(2, -10 * k); },
    back: function (k) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
    hold: function () { return 0; }
  };
  var EASE_NAME = { lin: 'Linear', in: 'Ease In (cubic)', out: 'Ease Out (cubic)', io: 'Easy Ease (cubic)', expo: 'Expo Out', back: 'Back Out (overshoot)', hold: 'Hold' };
  var BEZ = { lin: 'linear', in: 'cubic-bezier(.55,.055,.675,.19)', out: 'cubic-bezier(.215,.61,.355,1)', io: 'cubic-bezier(.645,.045,.355,1)', expo: 'cubic-bezier(.16,1,.3,1)', back: 'cubic-bezier(.34,1.56,.64,1)', hold: 'steps(1, end)' };

  /* ------------------------------------------------------------------
     Property metadata
     ------------------------------------------------------------------ */
  var PROP = {
    x: { n: 'Position X', u: 'px' }, y: { n: 'Position Y', u: 'px' }, s: { n: 'Scale', u: '%' }, sx: { n: 'Scale X', u: '%' }, sy: { n: 'Scale Y', u: '%' },
    r: { n: 'Rotation', u: '°' }, o: { n: 'Opacity', u: '%' }, w: { n: 'Width', u: 'px' }, ls: { n: 'Tracking', u: 'em' }, blur: { n: 'Blur', u: 'px' },
    clip: { n: 'Reveal', u: '%' }, bg: { n: 'Fill', u: '' }, text: { n: 'Source Text', u: '' }
  };
  var DEF = { x: 0, y: 0, s: 100, r: 0, o: 100 };

  /* ------------------------------------------------------------------
     Lessons (first layer = top of the stack, like After Effects)
     ------------------------------------------------------------------ */
  var CHECK = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var CURSOR = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M5 3l14 7-6 2-2 6z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  var LESSONS = [
    { id: 'kinetic', title: 'Kinetic type reveal', c: '#ff2e4d', dur: 3.2, bg: '#0b0b12', layers: [
      { name: 'Underline', type: 'Shape', lc: '#27e1d6', css: 'height:6px;background:#ff2e4d;border-radius:3px;box-shadow:0 0 20px #ff2e4d', st: { y: 72 },
        p: { w: [[1.2, 0, 'io'], [2.0, 360]], o: [[1.2, 0, 'lin'], [1.25, 100]] } },
      { name: 'Subtitle', type: 'Text', lc: '#8b6cff', html: 'Motion Academy · Lesson 01', css: 'font:500 18px JetBrains Mono,monospace;color:#bdb8cc;letter-spacing:.24em;text-transform:uppercase;white-space:nowrap',
        p: { o: [[1.0, 0, 'out'], [1.6, 100]], y: [[1.0, 140, 'expo'], [1.7, 112]] } },
      { name: 'Title', type: 'Text', lc: '#ffc24b', html: 'BUILD LEGENDARY', css: 'font:900 66px Unbounded,Arial Black,sans-serif;color:#f4f0e8;white-space:nowrap',
        p: { y: [[0.3, 80, 'expo'], [1.1, 0]], o: [[0.3, 0, 'out'], [0.8, 100]], ls: [[0.3, 0.5, 'expo'], [1.5, 0.02]] } },
      { name: 'Slash', type: 'Shape', lc: '#ff5fb6', css: 'width:760px;height:12px;background:linear-gradient(90deg,transparent,#ff2e4d 30%,#fff 60%,transparent);border-radius:6px;box-shadow:0 0 30px #ff2e4d', st: { r: -6, y: -8 },
        p: { x: [[0, -1100, 'expo'], [0.6, 0, 'hold'], [1.6, 0, 'in'], [2.2, 1100]] } },
      { name: 'Background', type: 'Solid', lc: '#7f7b93', css: 'width:960px;height:540px;background:radial-gradient(circle at 50% 50%,#2a0b18,#0b0b12 70%)',
        p: { s: [[0, 112, 'out'], [3.2, 100]] } }
    ], notes: [
      [0, 'Background: a slow 112% → 100% scale across the whole shot adds life without drawing attention — a “Ken Burns” push.'],
      [0, 'The slash enters with Expo Out: a very fast start and a soft landing. Perfect for energetic intros.'],
      [0.3, 'Title rises 80px while fading in. Tracking tightens from 0.5em to 0.02em — classic kinetic typography.'],
      [1.0, 'The subtitle follows 700ms later. Staggering elements leads the eye in reading order.'],
      [1.2, 'The underline draws with Easy Ease, so it feels hand-drawn instead of mechanical.'],
      [1.6, 'The slash exits with Ease In: things leaving the frame should accelerate out.']
    ] },
    { id: 'stinger', title: 'Logo stinger', c: '#8b6cff', dur: 3.0, bg: '#07070b', layers: [
      { name: 'Flash', type: 'Solid', lc: '#f4f0e8', css: 'width:960px;height:540px;background:#fff', p: { o: [[0.9, 0, 'out'], [1.0, 85, 'in'], [1.35, 0]] } },
      { name: 'Wordmark', type: 'Text', lc: '#ffc24b', html: 'XIRAIYA', css: 'font:900 60px Unbounded,Arial Black,sans-serif;color:#f4f0e8;white-space:nowrap', st: { y: 150 },
        p: { clip: [[1.1, 0, 'expo'], [1.9, 100]], ls: [[1.1, 0.5, 'expo'], [2.3, 0.12]] } },
      { name: 'Shockwave', type: 'Shape', lc: '#ff2e4d', css: 'width:220px;height:220px;border-radius:50%;border:4px solid #ff2e4d', st: { y: -20 },
        p: { s: [[0.95, 0, 'expo'], [1.8, 420]], o: [[0.95, 100, 'lin'], [1.8, 0]] } },
      { name: 'Blade B', type: 'Shape', lc: '#ff5fb6', css: 'width:30px;height:210px;background:#ff2e4d;border-radius:4px;box-shadow:0 0 30px #ff2e4d', st: { y: -20 },
        p: { x: [[0.15, 700, 'expo'], [0.95, 0]], r: [[0.15, 90, 'expo'], [0.95, -32]] } },
      { name: 'Blade A', type: 'Shape', lc: '#27e1d6', css: 'width:30px;height:210px;background:#f4f0e8;border-radius:4px', st: { y: -20 },
        p: { x: [[0, -700, 'expo'], [0.9, 0]], r: [[0, -90, 'expo'], [0.9, 32]] } },
      { name: 'Diamond', type: 'Shape', lc: '#8b6cff', css: 'width:200px;height:200px;border:6px solid #8b6cff;box-shadow:0 0 40px rgba(139,108,255,.5)', st: { y: -20 },
        p: { r: [[0.9, -135, 'back'], [1.6, 45]], s: [[0.9, 0, 'back'], [1.6, 100]] } },
      { name: 'Background', type: 'Solid', lc: '#7f7b93', css: 'width:960px;height:540px;background:radial-gradient(circle,#1d0b2a,#07070b 70%)', p: {} }
    ], notes: [
      [0, 'Two blades fly in from opposite sides with Expo Out and a 150ms offset — asymmetry makes it feel alive.'],
      [0.9, 'The diamond pops in with Back Out: it overshoots past 100% scale, then settles. That overshoot is the “snap”.'],
      [0.95, 'A shockwave ring scales to 420% while fading — the visual “sound” of impact.'],
      [0.9, 'A 3-frame white flash (0 → 85% → 0) sells the moment. Keep flashes short to avoid discomfort.'],
      [1.1, 'The wordmark is revealed left-to-right with a clip-path mask while tracking relaxes — no fade needed.']
    ] },
    { id: 'impact', title: 'Anime impact frame', c: '#e8112d', dur: 2.6, bg: '#f4f0e8', layers: [
      { name: 'Camera', type: 'Null', lc: '#bdb8cc', cam: true,
        p: { x: [[0.56, 0, 'lin'], [0.6, -22, 'lin'], [0.65, 16, 'lin'], [0.7, -11, 'lin'], [0.76, 8, 'lin'], [0.82, -4, 'lin'], [0.9, 0]], r: [[0.56, 0, 'lin'], [0.62, -1.5, 'lin'], [0.72, 1, 'lin'], [0.9, 0]] } },
      { name: 'Invert frame', type: 'Solid', lc: '#111111', css: 'width:960px;height:540px;background:#111', p: { o: [[0.55, 0, 'hold'], [0.56, 100, 'hold'], [0.63, 0]] } },
      { name: 'Kanji 斬', type: 'Text', lc: '#e8112d', html: '斬', css: 'font:900 250px Noto Serif JP,serif;color:#111;line-height:1',
        p: { o: [[0.5, 0, 'hold'], [0.56, 100]], s: [[0.56, 280, 'expo'], [0.78, 100, 'lin'], [2.6, 110]], r: [[0.56, -14, 'back'], [0.95, 0]] } },
      { name: 'Red slash', type: 'Shape', lc: '#ff5fb6', css: 'width:1300px;height:44px;background:#e8112d', st: { r: -18 },
        p: { sx: [[0.4, 0, 'expo'], [0.56, 100]] } },
      { name: 'Speed lines', type: 'Shape', lc: '#7f7b93', css: 'width:1400px;height:1400px;background:repeating-conic-gradient(from 0deg,#111 0 1.2deg,transparent 1.2deg 6deg);-webkit-mask:radial-gradient(circle,transparent 18%,#000 55%);mask:radial-gradient(circle,transparent 18%,#000 55%)',
        p: { o: [[0.5, 0, 'hold'], [0.56, 100]], r: [[0, 0, 'lin'], [2.6, 40]], s: [[0.56, 150, 'expo'], [0.95, 100]] } },
      { name: 'Paper', type: 'Solid', lc: '#ffc24b', css: 'width:960px;height:540px;background:radial-gradient(rgba(0,0,0,.14) 1.2px,transparent 1.4px) 0 0/9px 9px,#f4f0e8', p: {} }
    ], notes: [
      [0, 'Anticipation: 0.5 seconds of stillness. The calm before the hit makes the hit land harder.'],
      [0.4, 'The red slash wipes in fast (Expo Out over 160ms) — this is the “cut”.'],
      [0.55, 'Hold keyframes, not easing: the kanji and speed lines appear on a hard cut, exactly like an anime impact frame.'],
      [0.56, 'One 2-frame black invert frame adds the flash of the strike.'],
      [0.56, 'The camera (a Null layer) shakes with decaying linear offsets — each bounce smaller than the last.'],
      [0.78, 'After the hit, a slow linear push-in (100% → 110%) keeps tension while the frame holds.']
    ] },
    { id: 'button', title: 'Button micro-interaction', c: '#22c55e', dur: 2.4, bg: '#0e0e14', layers: [
      { name: 'Cursor', type: 'Shape', lc: '#f4f0e8', html: CURSOR, css: 'width:34px;height:34px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))',
        p: { x: [[0, 280, 'io'], [0.8, 50]], y: [[0, 190, 'io'], [0.8, 26]], s: [[0.85, 100, 'out'], [0.95, 82, 'back'], [1.15, 100]] } },
      { name: 'Label', type: 'Text', lc: '#ffc24b', html: 'Pay 129 USDT', css: 'font:700 22px Plus Jakarta Sans,sans-serif;color:#fff;white-space:nowrap;display:flex;align-items:center;gap:10px',
        p: { text: [[0, 'Pay 129 USDT', 'hold'], [1.25, CHECK + 'Paid']], o: [[1.1, 100, 'in'], [1.25, 0, 'out'], [1.4, 100]], y: [[1.25, 12, 'back'], [1.55, 0]] } },
      { name: 'Ripple', type: 'Shape', lc: '#27e1d6', css: 'width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,.35)', st: { x: 50, y: 20 },
        p: { s: [[0.95, 0, 'out'], [1.6, 420]], o: [[0.95, 60, 'lin'], [1.6, 0]] } },
      { name: 'Button', type: 'Shape', lc: '#ff2e4d', css: 'width:300px;height:76px;border-radius:38px;box-shadow:0 20px 40px -16px rgba(0,0,0,.8)',
        p: { bg: [[0, '#ff2e4d', 'hold'], [1.2, '#ff2e4d', 'io'], [1.5, '#22c55e']], s: [[0.85, 100, 'out'], [0.95, 94, 'back'], [1.2, 100]], w: [[1.2, 300, 'io'], [1.6, 210]] } },
      { name: 'Background', type: 'Solid', lc: '#7f7b93', css: 'width:960px;height:540px;background:radial-gradient(circle at 50% 60%,#171726,#0e0e14 70%)', p: {} }
    ], notes: [
      [0, 'The cursor travels with Easy Ease — people move a mouse with acceleration and deceleration, never linearly.'],
      [0.85, 'Press: the button squashes to 94% in 100ms, then springs back with Back Out. Feedback in under 150ms feels instant.'],
      [0.95, 'A ripple grows from the exact click point — it tells the user “I heard you, right here”.'],
      [1.1, 'Label swap: fade out with Ease In, swap the text on a Hold keyframe, then bring the new label up with an overshoot.'],
      [1.2, 'Color and width morph together into a compact success pill. Never animate more than 2–3 properties at once.']
    ] },
    { id: 'parallax', title: 'Parallax camera move', c: '#27e1d6', dur: 4.0, bg: '#2a0f3a', layers: [
      { name: 'Camera', type: 'Null', lc: '#bdb8cc', cam: true, p: { s: [[0, 100, 'io'], [4, 112]], y: [[0, 10, 'io'], [4, -10]] } },
      { name: 'Front hills', type: 'Shape', lc: '#ff2e4d', css: 'width:1500px;height:240px;background:#12061c;border-radius:50% 50% 0 0/100% 100% 0 0', st: { y: 230 },
        p: { x: [[0, 180, 'io'], [4, -180]] } },
      { name: 'Mid hills', type: 'Shape', lc: '#ff5fb6', css: 'width:1500px;height:300px;background:#3a1450;border-radius:40% 60% 0 0/100% 100% 0 0', st: { y: 210 },
        p: { x: [[0, 100, 'io'], [4, -100]] } },
      { name: 'Mountains', type: 'Shape', lc: '#8b6cff', css: 'width:1400px;height:320px;background:#6b2a6e;clip-path:polygon(0 100%,14% 30%,26% 70%,40% 10%,55% 60%,68% 22%,82% 66%,100% 18%,100% 100%)', st: { y: 150 },
        p: { x: [[0, 45, 'io'], [4, -45]] } },
      { name: 'Clouds', type: 'Shape', lc: '#f4f0e8', css: 'width:240px;height:36px;border-radius:18px;background:rgba(255,255,255,.75);box-shadow:120px -26px 0 -6px rgba(255,255,255,.55),-260px 40px 0 -10px rgba(255,255,255,.45)', st: { y: -150 },
        p: { x: [[0, -260, 'lin'], [4, 260]] } },
      { name: 'Sun', type: 'Shape', lc: '#ffc24b', css: 'width:230px;height:230px;border-radius:50%;background:radial-gradient(circle at 45% 40%,#ffd36b,#ff7a3d 60%,#e8112d);box-shadow:0 0 90px rgba(255,122,61,.7)', st: { y: -10 },
        p: { x: [[0, 16, 'io'], [4, -16]], y: [[0, 20, 'io'], [4, -30]] } },
      { name: 'Sky', type: 'Solid', lc: '#7f7b93', css: 'width:960px;height:540px;background:linear-gradient(180deg,#1a0b3a,#7a1f5c 65%,#ff7a3d)', p: {} }
    ], notes: [
      [0, 'Parallax rule: the further away a layer is, the less it moves. Front hills move 360px, mountains 90px, the sun 32px.'],
      [0, 'Every layer shares the same Easy Ease, so it reads as one camera move instead of layers sliding separately.'],
      [0, 'The camera Null adds a slow 12% zoom and a slight tilt up — depth plus a hint of “reveal”.'],
      [0, 'Clouds drift linearly and in the opposite direction — ambient motion that never stops.']
    ] },
    { id: 'loader', title: 'Loader loop', c: '#ffc24b', dur: 2.0, bg: '#0b0b12', layers: [
      { name: 'Label', type: 'Text', lc: '#bdb8cc', html: 'LOADING', css: 'font:600 16px JetBrains Mono,monospace;color:#bdb8cc;letter-spacing:.4em', st: { y: 130 },
        p: { o: [[0, 35, 'io'], [1, 100, 'io'], [2, 35]] } },
      { name: 'Dot 3', type: 'Shape', lc: '#27e1d6', css: 'width:26px;height:26px;border-radius:50%;background:#27e1d6;box-shadow:0 0 18px #27e1d6', st: { x: 56 },
        p: { y: [[0.3, 0, 'out'], [0.6, -46, 'in'], [0.9, 0]], sy: [[0.9, 100, 'out'], [0.98, 70, 'out'], [1.1, 100]] } },
      { name: 'Dot 2', type: 'Shape', lc: '#8b6cff', css: 'width:26px;height:26px;border-radius:50%;background:#8b6cff;box-shadow:0 0 18px #8b6cff',
        p: { y: [[0.15, 0, 'out'], [0.45, -46, 'in'], [0.75, 0]], sy: [[0.75, 100, 'out'], [0.83, 70, 'out'], [0.95, 100]] } },
      { name: 'Dot 1', type: 'Shape', lc: '#ff2e4d', css: 'width:26px;height:26px;border-radius:50%;background:#ff2e4d;box-shadow:0 0 18px #ff2e4d', st: { x: -56 },
        p: { y: [[0, 0, 'out'], [0.3, -46, 'in'], [0.6, 0]], sy: [[0.6, 100, 'out'], [0.68, 70, 'out'], [0.8, 100]] } },
      { name: 'Ring', type: 'Shape', lc: '#ffc24b', css: 'width:190px;height:190px;border-radius:50%;border:6px solid rgba(255,255,255,.08);border-top-color:#ffc24b',
        p: { r: [[0, 0, 'lin'], [2, 360]] } },
      { name: 'Background', type: 'Solid', lc: '#7f7b93', css: 'width:960px;height:540px;background:#0b0b12', p: {} }
    ], notes: [
      [0, 'A seamless loop: every property ends exactly where it started, and the ring uses Linear so there is no pause at the seam.'],
      [0, 'Dots rise with Ease Out and fall with Ease In — that is gravity. Their 150ms offsets create the wave.'],
      [0.6, 'Squash on landing (Scale Y 100 → 70 → 100) gives the dots weight. Tiny detail, huge difference.'],
      [0, 'The label breathes between 35% and 100% opacity on a 2-second cycle — calm, not flashy.']
    ] }
  ];

  /* ------------------------------------------------------------------
     Engine helpers
     ------------------------------------------------------------------ */
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, k) {
    if (typeof a === 'number') return a + (b - a) * k;
    if (/^#/.test(a) && /^#/.test(b)) {
      var A = hex2rgb(a), B = hex2rgb(b);
      return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * k); }).join(',') + ')';
    }
    return k < 1 ? a : b;
  }
  function valueAt(track, t) {
    if (t <= track[0][0]) return track[0][1];
    for (var i = 0; i < track.length - 1; i++) {
      var a = track[i], b = track[i + 1];
      if (t < b[0]) {
        var k = (t - a[0]) / (b[0] - a[0]);
        return mix(a[1], b[1], (EASE[a[2] || 'lin'] || EASE.lin)(k));
      }
    }
    return track[track.length - 1][1];
  }
  function val(layer, key, t) {
    if (layer.p[key]) return valueAt(layer.p[key], t);
    if (layer.st && layer.st[key] != null) return layer.st[key];
    return DEF[key];
  }
  function fmtTC(t) {
    var f = Math.round(t * FPS), s = Math.floor(f / FPS), fr = f % FPS;
    return '0:00:' + String(s).padStart(2, '0') + ':' + String(fr).padStart(2, '0');
  }
  function fmtVal(key, v) {
    if (key === 'bg' || key === 'text') return key === 'text' ? '“' + String(v).replace(/<[^>]+>/g, '').trim() + '”' : v;
    var u = PROP[key].u;
    return (key === 'ls' ? v.toFixed(2) : (Math.round(v * 10) / 10).toFixed(1)) + u;
  }
  function keysOf(layer) {
    var out = [];
    Object.keys(layer.p).forEach(function (k) { layer.p[k].forEach(function (kf) { if (out.indexOf(kf[0]) < 0) out.push(kf[0]); }); });
    return out.sort(function (a, b) { return a - b; });
  }

  /* ------------------------------------------------------------------
     DOM refs + state
     ------------------------------------------------------------------ */
  var ae = $('#ae');
  if (!ae) return;
  var stageWrap = $('.ae-stage-wrap', ae), stage = $('.ae-stage', ae), viewer = $('.ae-viewer', ae), pathsSvg = $('.ae-paths', ae);
  var rowsEl = $('.ae-rows', ae), ruler = $('.ae-ruler', ae), playhead = $('.ae-playhead', ae), tl = $('.ae-tl', ae);
  var tcEl = $('.ae-timecode', ae), frEl = $('.ae-frame', ae), tcMini = $('.ae-tc-mini', ae), fxEl = $('.ae-fx', ae);
  var playBtn = $('[data-act="play"]', ae), speedSel = $('.ae-speed', ae), zoomv = $('.ae-zoomv', ae);
  var notesEl = $('.ac-notes'), cssEl = $('.ac-css'), titleEl = $('.ac-title');
  var L = null, li = 0, t = 0, playing = false, loop = true, speed = 1, sel = 0, open = {}, hidden = {}, els = [], cam = null, last = 0, inView = true;

  /* ------------------------------------------------------------------
     Build a lesson
     ------------------------------------------------------------------ */
  function load(i) {
    li = i; L = LESSONS[i]; t = 0; sel = L.layers.findIndex(function (l) { return !l.cam && Object.keys(l.p).length; }); open = {}; hidden = {};
    if (sel < 0) sel = 0;
    open[sel] = true;
    $$('.ae-lessons button').forEach(function (b, j) { b.classList.toggle('is-on', j === i); });
    $('.ae-comp-name', ae).textContent = L.title;
    stage.style.background = L.bg;
    stage.innerHTML = '';
    var camEl = document.createElement('div');
    camEl.className = 'ae-cam';
    camEl.style.cssText = 'position:absolute;inset:0;transform-origin:50% 50%';
    stage.appendChild(camEl);
    els = [];
    cam = null;
    for (var k = L.layers.length - 1; k >= 0; k--) {
      var layer = L.layers[k];
      if (layer.cam) { cam = { layer: layer, el: camEl }; els[k] = null; continue; }
      var el = document.createElement('div');
      el.className = 'ae-layer';
      el.style.cssText += ';' + (layer.css || '');
      el.innerHTML = layer.html || '';
      camEl.appendChild(el);
      els[k] = el;
    }
    buildTimeline();
    buildNotes();
    cssEl.innerHTML = exportCSS();
    titleEl.textContent = 'Lesson ' + String(i + 1).padStart(2, '0') + ' — ' + L.title;
    fit();
    update();
  }

  function buildTimeline() {
    // ruler ticks
    var r = '';
    for (var f = 0; f <= L.dur * FPS; f += 5) {
      var sec = f % FPS === 0;
      r += '<span class="' + (sec ? 's' : '') + '" style="left:' + (f / FPS / L.dur * 100) + '%">' + (sec ? '<em>' + (f / FPS) + 's</em>' : '') + '</span>';
    }
    ruler.innerHTML = r;
    var html = '';
    L.layers.forEach(function (layer, i) {
      var keys = keysOf(layer), props = Object.keys(layer.p);
      html += '<div class="ae-row layer' + (open[i] ? ' is-open' : '') + (i === sel ? ' is-sel' : '') + '" data-l="' + i + '" style="--lc:' + layer.lc + '">' +
        '<div class="ae-name"><span class="ae-idx">' + (i + 1) + '</span><span class="ae-lab"></span>' +
        '<button type="button" class="ae-eye" data-eye="' + i + '" aria-label="Toggle visibility">' + I('eye') + '</button>' +
        (props.length ? '<span class="ae-twirl">' + I('chevron-right') + '</span>' : '<span class="ae-twirl"></span>') +
        '<span class="ae-lname">' + esc(layer.name) + '</span><span class="ae-type">' + layer.type + '</span></div>' +
        '<div class="ae-track"><div class="ae-bar"></div>' + keys.map(function (k) { return '<button type="button" class="ae-kf" data-t="' + k + '" style="left:' + (k / L.dur * 100) + '%" aria-label="Keyframe at ' + k + 's"></button>'; }).join('') + '</div></div>';
      props.forEach(function (pk) {
        html += '<div class="ae-row prop" data-pl="' + i + '"' + (open[i] ? '' : ' hidden') + '><div class="ae-name"><span>' + I('clock') + PROP[pk].n + '</span><b data-v="' + i + ':' + pk + '"></b></div>' +
          '<div class="ae-track">' + layer.p[pk].map(function (kf) {
            return '<button type="button" class="ae-kf' + (kf[2] && kf[2] !== 'lin' ? ' ez' : '') + '" data-t="' + kf[0] + '" data-k="' + i + ':' + pk + '" style="left:' + (kf[0] / L.dur * 100) + '%" title="' + PROP[pk].n + ' · ' + kf[0] + 's · ' + (EASE_NAME[kf[2] || 'lin']) + '" aria-label="' + PROP[pk].n + ' keyframe at ' + kf[0] + 's"></button>';
          }).join('') + '</div></div>';
      });
    });
    rowsEl.innerHTML = html;
  }

  function buildNotes() {
    notesEl.innerHTML = L.notes.map(function (n, i) {
      return '<li><button type="button" data-note="' + i + '" data-t="' + n[0] + '"><time>' + fmtTC(n[0]) + '</time><span>' + esc(n[1]) + '</span></button></li>';
    }).join('');
  }

  /* ------------------------------------------------------------------
     Render one frame
     ------------------------------------------------------------------ */
  function applyLayer(layer, el, tt) {
    var x = val(layer, 'x', tt), y = val(layer, 'y', tt), s = val(layer, 's', tt), r = val(layer, 'r', tt);
    var sx = layer.p.sx ? valueAt(layer.p.sx, tt) : s, sy = layer.p.sy ? valueAt(layer.p.sy, tt) : s;
    el.style.transform = (layer.cam ? '' : 'translate(-50%,-50%) ') + 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) rotate(' + r.toFixed(2) + 'deg) scale(' + (sx / 100).toFixed(4) + ',' + (sy / 100).toFixed(4) + ')';
    el.style.opacity = (val(layer, 'o', tt) / 100).toFixed(3);
    if (layer.p.w) el.style.width = valueAt(layer.p.w, tt).toFixed(1) + 'px';
    if (layer.p.ls) el.style.letterSpacing = valueAt(layer.p.ls, tt).toFixed(3) + 'em';
    if (layer.p.blur) el.style.filter = 'blur(' + valueAt(layer.p.blur, tt).toFixed(1) + 'px)';
    if (layer.p.clip) el.style.clipPath = 'inset(0 ' + (100 - valueAt(layer.p.clip, tt)).toFixed(2) + '% 0 0)';
    if (layer.p.bg) el.style.background = valueAt(layer.p.bg, tt);
    if (layer.p.text) { var tx = valueAt(layer.p.text, tt); if (el.__tx !== tx) { el.__tx = tx; el.innerHTML = tx; } }
  }

  function update() {
    L.layers.forEach(function (layer, i) {
      if (layer.cam) { if (cam) applyLayer(layer, cam.el, t); return; }
      var el = els[i]; if (!el) return;
      applyLayer(layer, el, t);
      el.classList.toggle('is-hidden', !!hidden[i]);
    });
    // time displays
    var tc = fmtTC(t);
    tcEl.textContent = tc; tcMini.textContent = tc;
    frEl.textContent = String(Math.round(t * FPS)).padStart(5, '0') + ' (30.00 fps)';
    var rr = ruler.getBoundingClientRect(), tr = tl.getBoundingClientRect();
    playhead.style.left = (rr.left - tr.left + (t / L.dur) * rr.width) + 'px';
    // prop values + active keyframes
    $$('[data-v]', rowsEl).forEach(function (b) {
      var parts = b.getAttribute('data-v').split(':'), layer = L.layers[+parts[0]];
      b.textContent = fmtVal(parts[1], valueAt(layer.p[parts[1]], t));
    });
    $$('.ae-kf', rowsEl).forEach(function (k) { k.classList.toggle('is-now', Math.abs(+k.getAttribute('data-t') - t) < .5 / FPS); });
    // notes
    var tmax = -1;
    L.notes.forEach(function (n) { if (n[0] <= t + 1e-6 && n[0] > tmax) tmax = n[0]; });
    $$('[data-note]', notesEl).forEach(function (b, i) { b.classList.toggle('is-now', L.notes[i][0] === tmax); });
    renderFx();
    drawPaths();
  }

  /* effect controls */
  var fxKey = '';
  function renderFx() {
    var layer = L.layers[sel];
    $('.ae-sel-name', ae).textContent = layer ? layer.name : '—';
    if (!layer) { fxEl.innerHTML = '<p class="fx-empty">No layer selected</p>'; return; }
    var key = li + ':' + sel;
    if (fxKey !== key) {
      fxKey = key;
      var rows = [['Anchor Point', 'ap'], ['Position', 'pos'], ['Scale', 'sc'], ['Rotation', 'r'], ['Opacity', 'o']];
      var extra = ['w', 'ls', 'blur', 'clip', 'bg', 'text'].filter(function (k) { return layer.p[k]; });
      fxEl.innerHTML = '<div class="fx-group"><h4><span class="fx-fx">fx</span>Transform</h4>' +
        rows.map(function (r) {
          var anim = r[1] === 'pos' ? (layer.p.x || layer.p.y) : r[1] === 'sc' ? (layer.p.s || layer.p.sx || layer.p.sy) : layer.p[r[1]];
          return '<div class="fx-row' + (anim ? ' is-anim' : '') + '">' + I('clock') + '<span>' + r[0] + '</span><b data-fx="' + r[1] + '"></b></div>';
        }).join('') + '</div>' +
        (extra.length ? '<div class="fx-group"><h4><span class="fx-fx">fx</span>Effects</h4>' + extra.map(function (k) { return '<div class="fx-row is-anim">' + I('clock') + '<span>' + PROP[k].n + '</span><b data-fx="' + k + '"></b></div>'; }).join('') + '</div>' : '') +
        '<div class="fx-group"><h4><span class="fx-fx">ƒ</span>Graph · current segment</h4><div class="fx-ease"><span class="fx-ease-t"></span><svg viewBox="0 0 100 60" preserveAspectRatio="none"><path/><circle r="3"/></svg></div></div>';
    }
    var x = val(layer, 'x', t), y = val(layer, 'y', t), s = val(layer, 's', t);
    var sx = layer.p.sx ? valueAt(layer.p.sx, t) : s, sy = layer.p.sy ? valueAt(layer.p.sy, t) : s;
    var set = function (k, v) { var b = $('[data-fx="' + k + '"]', fxEl); if (b) b.textContent = v; };
    set('ap', '0.0, 0.0');
    set('pos', (CW / 2 + x).toFixed(1) + ', ' + (CH / 2 + y).toFixed(1));
    set('sc', sx.toFixed(1) + ', ' + sy.toFixed(1) + '%');
    set('r', '0x ' + val(layer, 'r', t).toFixed(1) + '°');
    set('o', val(layer, 'o', t).toFixed(0) + '%');
    ['w', 'ls', 'blur', 'clip', 'bg', 'text'].forEach(function (k) { if (layer.p[k]) set(k, fmtVal(k, valueAt(layer.p[k], t))); });
    // graph of the active segment of the first animated track
    var pk = Object.keys(layer.p).find(function (k) { return layer.p[k].length > 1; });
    var info = $('.fx-ease-t', fxEl), path = $('.fx-ease path', fxEl), dot = $('.fx-ease circle', fxEl);
    if (!pk) { info.textContent = 'This layer is static.'; path.setAttribute('d', ''); dot.setAttribute('cx', -10); return; }
    var tr = layer.p[pk], seg = null;
    for (var i = 0; i < tr.length - 1; i++) if (t >= tr[i][0] && t <= tr[i + 1][0]) { seg = [tr[i], tr[i + 1]]; break; }
    if (!seg) seg = t < tr[0][0] ? [tr[0], tr[1]] : [tr[tr.length - 2], tr[tr.length - 1]];
    var e = EASE[seg[0][2] || 'lin'], d = '';
    for (var n = 0; n <= 40; n++) { var k = n / 40; d += (n ? 'L' : 'M') + (k * 100).toFixed(1) + ' ' + (55 - e(k) * 45).toFixed(1); }
    path.setAttribute('d', d);
    var kk = XR.clamp((t - seg[0][0]) / (seg[1][0] - seg[0][0]), 0, 1);
    dot.setAttribute('cx', kk * 100); dot.setAttribute('cy', 55 - e(kk) * 45);
    info.innerHTML = PROP[pk].n + ': <b style="color:var(--ae-blue)">' + EASE_NAME[seg[0][2] || 'lin'] + '</b> · ' + seg[0][0] + 's → ' + seg[1][0] + 's';
  }

  /* motion paths for layers that move in x/y */
  var pathsOn = true;
  function drawPaths() {
    if (!pathsOn) { pathsSvg.innerHTML = ''; return; }
    var out = '';
    L.layers.forEach(function (layer, i) {
      if (layer.cam || !(layer.p.x || layer.p.y) || hidden[i]) return;
      var keys = keysOf(layer).filter(function (k) { return (layer.p.x && layer.p.x.some(function (f) { return f[0] === k; })) || (layer.p.y && layer.p.y.some(function (f) { return f[0] === k; })); });
      var t0 = keys[0], t1 = keys[keys.length - 1], d = '';
      for (var n = 0; n <= 40; n++) { var tt = t0 + (t1 - t0) * n / 40; d += (n ? 'L' : 'M') + val(layer, 'x', tt).toFixed(1) + ' ' + val(layer, 'y', tt).toFixed(1); }
      out += '<path d="' + d + '" style="opacity:' + (i === sel ? 1 : .35) + '"/>';
      keys.forEach(function (k) { out += '<rect x="' + (val(layer, 'x', k) - 3) + '" y="' + (val(layer, 'y', k) - 3) + '" width="6" height="6" style="opacity:' + (i === sel ? 1 : .35) + '"/>'; });
    });
    pathsSvg.innerHTML = out;
  }

  /* ------------------------------------------------------------------
     CSS export (individual transform properties + per-keyframe easing)
     ------------------------------------------------------------------ */
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'layer'; }
  function exportCSS() {
    var dur = L.dur, out = '<span class="c">/* ' + esc(L.title) + ' — exported from Motion Academy */</span>\n', pct = function (tt) { return +(tt / dur * 100).toFixed(2) + '%'; };
    L.layers.forEach(function (layer) {
      var keys = Object.keys(layer.p);
      if (!keys.length) return;
      var name = (layer.cam ? 'camera' : slug(layer.name)), anims = [], blocks = '';
      function block(prop, track, fmt) {
        var kname = name + '-' + prop.replace(/[^a-z]/g, '');
        anims.push(kname);
        var lines = '';
        var first = track[0], lastK = track[track.length - 1];
        if (first[0] > 0) lines += '  0% { ' + fmt(first[1]) + ' }\n';
        track.forEach(function (kf) {
          lines += '  ' + pct(kf[0]) + ' { ' + fmt(kf[1]) + (kf !== lastK ? '; animation-timing-function: ' + BEZ[kf[2] || 'lin'] : '') + ' }\n';
        });
        if (lastK[0] < dur) lines += '  100% { ' + fmt(lastK[1]) + ' }\n';
        blocks += '<span class="k">@keyframes</span> <span class="f">' + kname + '</span> {\n' + esc(lines).replace(/(cubic-bezier\([^)]*\)|linear|steps\([^)]*\))/g, '<span class="s">$1</span>') + '}\n';
      }
      if (layer.p.x || layer.p.y) {
        var times = [];
        ['x', 'y'].forEach(function (k) { if (layer.p[k]) layer.p[k].forEach(function (f) { if (times.indexOf(f[0]) < 0) times.push(f[0]); }); });
        times.sort(function (a, b) { return a - b; });
        var tr = times.map(function (tt) {
          var src = (layer.p.x && layer.p.x.find(function (f) { return f[0] === tt; })) || (layer.p.y && layer.p.y.find(function (f) { return f[0] === tt; }));
          return [tt, [val(layer, 'x', tt), val(layer, 'y', tt)], src[2]];
        });
        block('translate', tr, function (v) { return 'translate: ' + (+v[0].toFixed(1)) + 'px ' + (+v[1].toFixed(1)) + 'px'; });
      }
      if (layer.p.r) block('rotate', layer.p.r, function (v) { return 'rotate: ' + v + 'deg'; });
      if (layer.p.s) block('scale', layer.p.s, function (v) { return 'scale: ' + (v / 100); });
      if (layer.p.sx) block('scalex', layer.p.sx, function (v) { return 'scale: ' + (v / 100) + ' 1'; });
      if (layer.p.sy) block('scaley', layer.p.sy, function (v) { return 'scale: 1 ' + (v / 100); });
      if (layer.p.o) block('opacity', layer.p.o, function (v) { return 'opacity: ' + (v / 100); });
      if (layer.p.w) block('width', layer.p.w, function (v) { return 'width: ' + v + 'px'; });
      if (layer.p.ls) block('tracking', layer.p.ls, function (v) { return 'letter-spacing: ' + v + 'em'; });
      if (layer.p.clip) block('reveal', layer.p.clip, function (v) { return 'clip-path: inset(0 ' + (100 - v) + '% 0 0)'; });
      if (layer.p.bg) block('fill', layer.p.bg, function (v) { return 'background: ' + v; });
      var st = layer.st || {}, stat = '';
      if (!layer.p.x && !layer.p.y && (st.x || st.y)) stat += '  translate: ' + (st.x || 0) + 'px ' + (st.y || 0) + 'px;\n';
      else if (layer.p.x && !layer.p.y && st.y) stat += '  <span class="c">/* y is static at ' + st.y + 'px (baked into translate) */</span>\n';
      if (!layer.p.r && st.r) stat += '  rotate: ' + st.r + 'deg;\n';
      out += '\n<span class="t">.' + name + '</span> {\n' + stat + '  animation: ' + anims.map(function (a) { return a + ' ' + dur + 's infinite'; }).join(',\n             ') + ';\n}\n' + blocks;
    });
    return out;
  }

  /* ------------------------------------------------------------------
     Playback
     ------------------------------------------------------------------ */
  function setPlaying(v) {
    playing = v;
    playBtn.innerHTML = I(v ? 'pause' : 'play');
    playBtn.setAttribute('aria-label', v ? 'Pause' : 'Play');
    last = performance.now();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!playing || !inView || document.hidden) { last = now; return; }
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    t += dt * speed;
    if (t >= L.dur) {
      if (loop) t = t % L.dur; else { t = L.dur; setPlaying(false); }
    }
    update();
  }
  function seek(tt) { t = Math.round(XR.clamp(tt, 0, L.dur) * FPS) / FPS; update(); }
  function allKeys() { var k = []; L.layers.forEach(function (l) { keysOf(l).forEach(function (x) { if (k.indexOf(x) < 0) k.push(x); }); }); return k.sort(function (a, b) { return a - b; }); }
  function jumpKey(dir) {
    var ks = allKeys(), eps = .5 / FPS, target = null;
    if (dir > 0) target = ks.find(function (k) { return k > t + eps; });
    else for (var i = ks.length - 1; i >= 0; i--) if (ks[i] < t - eps) { target = ks[i]; break; }
    if (target != null) { setPlaying(false); seek(target); }
  }

  /* ------------------------------------------------------------------
     Interaction
     ------------------------------------------------------------------ */
  $('.ae-transport', ae).addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.getAttribute('data-act');
    if (a === 'play') { if (!playing && t >= L.dur) t = 0; setPlaying(!playing); }
    if (a === 'start') { setPlaying(false); seek(0); }
    if (a === 'end') { setPlaying(false); seek(L.dur); }
    if (a === 'prevkey') jumpKey(-1);
    if (a === 'nextkey') jumpKey(1);
    if (a === 'loop') { loop = !loop; b.classList.toggle('is-on', loop); b.setAttribute('aria-pressed', loop); }
    if (a === 'expand') {
      var all = L.layers.every(function (l, i) { return open[i] || !Object.keys(l.p).length; });
      L.layers.forEach(function (l, i) { open[i] = !all; });
      buildTimeline(); update();
      b.lastChild.textContent = all ? 'Expand all' : 'Collapse all';
    }
    if (a === 'export') { $('.ac-lesson').scrollIntoView({ behavior: XR.reduce ? 'auto' : 'smooth' }); }
  });
  speedSel.addEventListener('change', function () { speed = +speedSel.value; });

  // scrubbing on ruler + tracks
  function scrubAt(clientX) {
    var r = ruler.getBoundingClientRect();
    seek(XR.clamp((clientX - r.left) / r.width, 0, 1) * L.dur);
  }
  var scrubbing = false;
  ruler.addEventListener('pointerdown', function (e) { scrubbing = true; setPlaying(false); ruler.setPointerCapture(e.pointerId); scrubAt(e.clientX); });
  ruler.addEventListener('pointermove', function (e) { if (scrubbing) scrubAt(e.clientX); });
  ruler.addEventListener('pointerup', function () { scrubbing = false; });

  rowsEl.addEventListener('click', function (e) {
    var kf = e.target.closest('.ae-kf');
    if (kf) { setPlaying(false); seek(+kf.getAttribute('data-t')); var k = kf.getAttribute('data-k'); if (k) { sel = +k.split(':')[0]; markSel(); } return; }
    var eye = e.target.closest('[data-eye]');
    if (eye) { var i = +eye.getAttribute('data-eye'); hidden[i] = !hidden[i]; eye.classList.toggle('is-off', hidden[i]); update(); return; }
    var track = e.target.closest('.ae-track');
    if (track) { setPlaying(false); scrubAt(e.clientX); return; }
    var row = e.target.closest('.ae-row.layer');
    if (row) {
      var idx = +row.getAttribute('data-l');
      if (sel === idx || e.target.closest('.ae-twirl')) {
        open[idx] = !open[idx];
        row.classList.toggle('is-open', open[idx]);
        $$('[data-pl="' + idx + '"]', rowsEl).forEach(function (p) { p.hidden = !open[idx]; });
      }
      sel = idx; markSel(); update();
    }
  });
  function markSel() { $$('.ae-row.layer', rowsEl).forEach(function (r) { r.classList.toggle('is-sel', +r.getAttribute('data-l') === sel); }); fxKey = ''; }

  notesEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-t]'); if (!b) return;
    setPlaying(false); seek(+b.getAttribute('data-t'));
    ae.scrollIntoView({ behavior: XR.reduce ? 'auto' : 'smooth', block: 'center' });
  });
  $('#opt-path').addEventListener('change', function (e) { pathsOn = e.target.checked; drawPaths(); });
  $('#opt-safe').addEventListener('change', function (e) { $('.ae-safe', ae).classList.toggle('is-on', e.target.checked); });
  $('.ac-copy').addEventListener('click', function () { XR.copy(cssEl.textContent).then(function () { XR.toast('CSS copied — paste it next to your HTML'); }); });

  document.addEventListener('keydown', function (e) {
    if (!inView || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Space') { e.preventDefault(); if (!playing && t >= L.dur) t = 0; setPlaying(!playing); }
    else if (e.key === 'j' || e.key === 'J') jumpKey(-1);
    else if (e.key === 'l' || e.key === 'L') jumpKey(1);
    else if (e.key === ',') { setPlaying(false); seek(Math.round(t * FPS - 1) / FPS); }
    else if (e.key === '.') { setPlaying(false); seek(Math.round(t * FPS + 1) / FPS); }
    else if (e.key === 'Home') { e.preventDefault(); setPlaying(false); seek(0); }
    else if (e.key === 'End') { e.preventDefault(); setPlaying(false); seek(L.dur); }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: .15 }).observe(ae);

  function fit() {
    var w = viewer.clientWidth - 28, h = viewer.clientHeight - 28;
    var s = Math.max(.1, Math.min(w / CW, h / CH));
    stageWrap.style.transform = 'scale(' + s + ')';
    stageWrap.style.margin = ((CH * s - CH) / 2) + 'px ' + ((CW * s - CW) / 2) + 'px';
    zoomv.textContent = Math.round(s * 100) + '%';
  }
  window.addEventListener('resize', function () { fit(); update(); });

  /* lesson list */
  $('.ae-lessons', ae).innerHTML = LESSONS.map(function (l, i) {
    return '<li><button type="button" data-lesson="' + i + '"><span class="thumb" style="--c:' + l.c + '">' + String(i + 1).padStart(2, '0') + '</span><span><b>' + esc(l.title) + '</b><small>' + l.dur.toFixed(1) + 's · ' + l.layers.length + ' layers</small></span></button></li>';
  }).join('');
  $('.ae-lessons', ae).addEventListener('click', function (e) {
    var b = e.target.closest('[data-lesson]'); if (!b) return;
    var was = playing; load(+b.getAttribute('data-lesson')); setPlaying(was || true);
  });

  /* easing lab */
  var EL = [['Linear', 'lin', '#7f7b93', 'Robotic. Use for loops, rotation and progress bars.'], ['Ease Out', 'out', '#27e1d6', 'Things entering the screen. Fast in, gentle stop.'], ['Ease In', 'in', '#ff5fb6', 'Things leaving the screen. Slow start, fast exit.'], ['Easy Ease', 'io', '#8b6cff', 'Objects moving on screen, like a camera or a cursor.'], ['Expo Out', 'expo', '#ff2e4d', 'Premium, snappy UI. The site’s signature curve.'], ['Back Out', 'back', '#ffc24b', 'Playful overshoot for buttons, badges and pop-ins.']];
  $('.ease-list').innerHTML = EL.map(function (e) {
    return '<button type="button" class="ease" data-copy="' + BEZ[e[1]] + '"><span><b>' + e[0] + '</b><small>' + e[3] + '</small></span><span class="ease-track"><i style="--c:' + e[2] + ';--e:' + BEZ[e[1]] + '"></i></span><em>' + BEZ[e[1]] + '</em></button>';
  }).join('');

  load(0);
  requestAnimationFrame(frame);
  XR.whenVisible(ae, function () { setTimeout(function () { setPlaying(true); }, 500); }, '0px');
})();
