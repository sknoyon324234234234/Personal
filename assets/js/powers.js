/* =====================================================================
   XIRAIYA — power dock. Five techniques that work on every page:
     千鳥 Chidori      charges, dashes and shatters the page into rubble
     起きろ Arise      shadow soldiers rise and raise the page back
     風 Wind          a gale of streaks, vortices and leaves
     かめはめ波        chant, charge, fire a beam, then power up
     超 Super Saiyan  golden aura mode, remembered across pages
   Rendering: one effect canvas plus a blurred bloom copy of it (the
   "glow" pass), anime impact frames (negative flashes), manga focus lines
   and Web Animations on the real page elements, so the page comes back
   exactly as it was.
   Sound: only your own clips from assets/sfx/ (see SOUND below).
   Page code: XRPowers.chidori() / .arise() / .wind() / .kamehameha() /
.ssj(on?) / .state(), or any <button data-power="chidori">.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__xrPowers) return;
  window.__xrPowers = true;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 760px)').matches;
  var KEY_SSJ = 'xr-ssj', KEY_MUTE = 'xr-pw-mute';
  var busy = false, ruin = null, windOn = false;
  var TAU = Math.PI * 2;

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function later(ms, fn) { return setTimeout(fn, reduce ? Math.min(ms, 200) : ms); }
  function vw() { return window.innerWidth; }
  function vh() { return window.innerHeight; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function toast(msg) { if (window.XR && window.XR.toast) window.XR.toast(msg); }

  /* stylesheet: one include line per page is enough */
  (function () {
    var s = document.currentScript && document.currentScript.src;
    var href = s ? s.replace(/js\/powers\.js(\?[^#]*)?.*$/, 'css/powers.css$1') : 'assets/css/powers.css';
    if (!document.querySelector('link[href*="powers.css"]')) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
    }
  })();

  /* ==================================================================
     SOUND — your own clips only, nothing is generated. Drop an audio file
     named after a cue into assets/sfx/ (for example chidori.mp3), run
     node tools/version-assets.js, and it plays on that beat of the power.
     The tool lists the files it finds in assets/sfx/sounds.js; a cue with
     no file stays silent.
       chidori              the charge, as the power starts
       arise                the shadow spell, as the dark falls
       arise-voice          a voice saying "Arise", landing on the command
       arise-theme          the music under the whole Arise cinematic (its drop,
                            beat and accents are in assets/sfx/marks.json)
       wind                 the gale (loops while the wind blows)
       kamehameha           the energy charging up
       kamehameha-voice     the full chant, ka... me... ha... me... HAAA (the
                            beam waits and fires on its final HAAA)
       kamehameha-fire      HAAAA, as the beam fires
       super-saiyan         the scream while powering up
       super-saiyan-burst   the golden burst at the end
     ================================================================== */
  var AC = null, master = null, muted = store(KEY_MUTE) === '1', clips = {}, loops = {}, durs = {};
  function audio() {
    if (muted) return null;
    if (!AC) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try { AC = new Ctx(); } catch (e) { return null; }
      /* full volume into a brickwall limiter, so clips that overlap stay loud but never clip */
      var lim = AC.createDynamicsCompressor();
      lim.threshold.value = -2; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .001; lim.release.value = .12;
      master = AC.createGain(); master.gain.value = 1; master.connect(lim); lim.connect(AC.destination);
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  var sfxRoot = (function () { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/js\/powers\.js.*$/, 'sfx/') : 'assets/sfx/'; })();
  (function () {
    var s = document.currentScript && document.currentScript.src;
    var src = s ? s.replace(/js\/powers\.js(\?[^#]*)?.*$/, 'sfx/sounds.js$1') : 'assets/sfx/sounds.js';
    var tag = document.createElement('script'); tag.src = src; tag.async = true; document.head.appendChild(tag);
  })();
  function sfxMap() { return (window.XR_SFX && window.XR_SFX.files) || {}; }
  function preload() {
    var a = audio(), m = sfxMap();
    if (!a) return;
    Object.keys(m).forEach(function (n) {
      if (clips[n]) return;
      clips[n] = fetch(sfxRoot + m[n]).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (ok, no) { a.decodeAudioData(b, ok, no); }); })
        .then(function (buf) { durs[n] = buf.duration; return buf; })
        .catch(function () { return null; });
    });
  }
  /* play a clip some ms from now; a looping clip runs until stopClip(name) */
  function clipDur(name) { return durs[name] || 0; }
  function clip(name, ms, loop, gain, keep) {
    var a = audio();
    if (!a || !sfxMap()[name]) return;
    preload();
    var at = a.currentTime + (ms || 0) / 1000;
    clips[name].then(function (buf) {
      if (!buf || muted) return;
      if (ms && a.currentTime - at > .5) return;   /* decoded too late to land on its beat */
      var src = a.createBufferSource(), g = a.createGain();
      src.buffer = buf; src.loop = !!loop; g.gain.value = gain == null ? 1 : gain;
      src.connect(g); g.connect(master);
      src.start(Math.max(a.currentTime, at));
      if (loop || keep) { stopClip(name, 0); loops[name] = { s: src, g: g }; }
    });
  }
  function stopClip(name, fade) {
    var l = loops[name];
    if (!l || !AC) return;
    delete loops[name];
    var t = AC.currentTime, f = (fade == null ? 800 : fade) / 1000;
    l.g.gain.setValueAtTime(l.g.gain.value, t);
    l.g.gain.linearRampToValueAtTime(0, t + f);
    try { l.s.stop(t + f + .05); } catch (e) {}
  }
  document.addEventListener('pointerdown', function () { preload(); }, { once: true, capture: true });

  /* ==================================================================
     CANVAS — one effect canvas + a blurred copy for bloom
     ================================================================== */
  var cv = null, cx = null, glow = null, gx = null, bloom = null, bx = null, W = 0, H = 0, DPR = 1, layers = [], raf = 0;
  var GS = phone ? .25 : .33;
  function resize() {
    if (!cv) return;
    W = vw(); H = vh(); DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    cv.width = W * DPR; cv.height = H * DPR;
    glow.width = Math.ceil(W * GS); glow.height = Math.ceil(H * GS);
    if (bloom) { bloom.width = Math.ceil(W / 10); bloom.height = Math.ceil(H / 10); }
  }
  function canvas() {
    if (!cv) {
      if (!phone) { bloom = el('canvas', 'pw-bloom'); bloom.setAttribute('aria-hidden', 'true'); document.body.appendChild(bloom); bx = bloom.getContext('2d'); }
      glow = el('canvas', 'pw-glow'); glow.setAttribute('aria-hidden', 'true');
      cv = el('canvas', 'pw-canvas'); cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(glow); document.body.appendChild(cv);
      cx = cv.getContext('2d'); gx = glow.getContext('2d');
      resize(); window.addEventListener('resize', resize);
    }
    return cx;
  }
  function layer(fn) {
    canvas(); fn.t0 = performance.now(); layers.push(fn);
    if (!raf) raf = requestAnimationFrame(loop);
    return fn;
  }
  var frozenUntil = 0;
  function loop(now) {
    /* hit-stop: hold the last frame while the world is frozen */
    if (now < frozenUntil) { raf = requestAnimationFrame(loop); return; }
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.clearRect(0, 0, W, H);
    layers = layers.filter(function (f) { cx.save(); var r = f(cx, Math.max(0, now - f.t0), now); cx.restore(); return r !== false; });
    gx.clearRect(0, 0, glow.width, glow.height);
    if (layers.length) gx.drawImage(cv, 0, 0, glow.width, glow.height);
    if (bx) { bx.clearRect(0, 0, bloom.width, bloom.height); if (layers.length) bx.drawImage(glow, 0, 0, bloom.width, bloom.height); }
    raf = layers.length ? requestAnimationFrame(loop) : 0;
  }

  /* ---------- lightning: branching bolts, After Effects style ---------- */
  function subdivide(x1, y1, x2, y2, disp, pts) {
    if (disp < 2.5) { pts.push([x2, y2]); return; }
    var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
    var off = rand(-.5, .5) * disp, mx = (x1 + x2) / 2 - dy / l * off, my = (y1 + y2) / 2 + dx / l * off;
    subdivide(x1, y1, mx, my, disp / 2, pts); subdivide(mx, my, x2, y2, disp / 2, pts);
  }
  function makeBolt(x1, y1, x2, y2, w, depth, forks) {
    var segs = [];
    (function branch(ax, ay, bx, by, wd, dp) {
      var len = Math.hypot(bx - ax, by - ay), pts = [[ax, ay]];
      subdivide(ax, ay, bx, by, len * .32, pts);
      segs.push({ p: pts, w: wd });
      if (dp <= 0) return;
      var ang = Math.atan2(by - ay, bx - ax), n = pts.length;
      for (var i = 2; i < n - 2; i++) {
        if (Math.random() < (forks || .07)) {
          var a = ang + rand(.35, .9) * (Math.random() < .5 ? -1 : 1), rest = len * (1 - i / n) * rand(.25, .6);
          branch(pts[i][0], pts[i][1], pts[i][0] + Math.cos(a) * rest, pts[i][1] + Math.sin(a) * rest, wd * .55, dp - 1);
        }
      }
    })(x1, y1, x2, y2, w, depth == null ? 2 : depth);
    return segs;
  }
  function drawBolt(c, segs, color, alpha) {
    c.lineJoin = 'round'; c.lineCap = 'round';
    var passes = [[color, .16, 7], [color, .55, 2.6], ['#ffffff', 1, 1]];
    passes.forEach(function (ps) {
      c.strokeStyle = ps[0]; c.globalAlpha = ps[1] * (alpha == null ? 1 : alpha);
      segs.forEach(function (s) {
        c.lineWidth = s.w * ps[2]; c.beginPath(); c.moveTo(s.p[0][0], s.p[0][1]);
        for (var i = 1; i < s.p.length; i++) c.lineTo(s.p[i][0], s.p[i][1]);
        c.stroke();
      });
    });
    c.globalAlpha = 1;
  }
  /* a bolt that holds its shape for a few frames, then re-strikes */
  function flicker(gen, life) {
    var cur = null, until = 0;
    return function (now) { if (!cur || now > until) { cur = gen(); until = now + (life || 70) * rand(.6, 1.4); } return cur; };
  }

  /* ---------- a small 3D engine: rotate, project, depth-shade ---------- */
  var FOCAL = 620;
  function unit3() { var z = rand(-1, 1), a = rand(0, TAU), r = Math.sqrt(1 - z * z); return [r * Math.cos(a), r * Math.sin(a), z]; }
  function norm3(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function rotAxis(v, k, a) {
    var c = Math.cos(a), s = Math.sin(a), d = v[0] * k[0] + v[1] * k[1] + v[2] * k[2];
    return [v[0] * c + (k[1] * v[2] - k[2] * v[1]) * s + k[0] * d * (1 - c), v[1] * c + (k[2] * v[0] - k[0] * v[2]) * s + k[1] * d * (1 - c), v[2] * c + (k[0] * v[1] - k[1] * v[0]) * s + k[2] * d * (1 - c)];
  }
  function spin3(p, ay, ax) {
    var cy = Math.cos(ay), sy = Math.sin(ay), x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy;
    var cx2 = Math.cos(ax), sx = Math.sin(ax), y = p[1] * cx2 - z * sx;
    return [x, y, p[1] * sx + z * cx2];
  }
  function proj(p, ox, oy) { var s = FOCAL / (FOCAL + p[2]); return [ox + p[0] * s, oy + p[1] * s, s]; }
  /* a jagged lightning arc wrapped around a sphere of radius R */
  function sphereArc(R) {
    var u = unit3(), k = norm3(cross3(u, unit3())), span = rand(.9, 2.4), n = 18, pts = [], th0 = rand(0, TAU);
    for (var i = 0; i <= n; i++) {
      var v = rotAxis(u, k, th0 + span * i / n), r = R * rand(.92, 1.28);
      pts.push([v[0] * r + rand(-3, 3), v[1] * r + rand(-3, 3), v[2] * r + rand(-3, 3)]);
    }
    if (Math.random() < .5) { var tip = pts[n], out = rand(1.4, 2.6); pts.push([tip[0] * out, tip[1] * out, tip[2] * out]); }
    return pts;
  }
  /* draw 3D polylines with depth: near is thick and bright, far is thin and dim */
  function draw3d(c, pts, ox, oy, ay, ax, color, w) {
    var P = pts.map(function (p) { return proj(spin3(p, ay, ax), ox, oy); });
    c.lineCap = 'round';
    [[color, .18, 6], [color, .6, 2.4], ['#ffffff', 1, 1]].forEach(function (ps) {
      c.strokeStyle = ps[0];
      for (var i = 1; i < P.length; i++) {
        var s = (P[i][2] + P[i - 1][2]) / 2, d = Math.max(.08, Math.min(1, (s - .78) * 3.2));
        c.globalAlpha = ps[1] * d; c.lineWidth = (w || 1.4) * ps[2] * s;
        c.beginPath(); c.moveTo(P[i - 1][0], P[i - 1][1]); c.lineTo(P[i][0], P[i][1]); c.stroke();
      }
    });
    c.globalAlpha = 1;
  }
  /* page elements move in real 3D: translate3d plus three rotations */
  var Z0 = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
  function tf(v, sc) {
    return 'perspective(900px) translate3d(' + v.x.toFixed(0) + 'px,' + v.y.toFixed(0) + 'px,' + v.z.toFixed(0) + 'px) rotateX(' + v.rx.toFixed(1) + 'deg) rotateY(' + v.ry.toFixed(1) + 'deg) rotateZ(' + v.rz.toFixed(1) + 'deg) scale(' + (sc || 1) + ')';
  }

  /* ---------- manga focus lines ---------- */
  /* a repeatable random stream, so a frame can be held for a few frames (animation on twos) */
  function seeded(v) { return function () { v = v + 0x6D2B79F5 | 0; var t = Math.imul(v ^ v >>> 15, 1 | v); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function focusLines(c, x, y, inner, color, n, alpha, rnd) {
    var R = Math.hypot(W, H), rr = rnd || Math.random;
    c.fillStyle = color; c.globalAlpha = alpha; c.beginPath();
    for (var i = 0; i < n; i++) {
      var a = rr() * TAU, w = .0025 + rr() * .0085, r0 = inner * (1 + rr() * .9);
      c.moveTo(x + Math.cos(a - w) * R, y + Math.sin(a - w) * R);
      c.lineTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
      c.lineTo(x + Math.cos(a + w) * R, y + Math.sin(a + w) * R);
    }
    c.fill(); c.globalAlpha = 1;
  }
  /* ---------- shockwave rings ---------- */
  function shockwave(x, y, color, max, ms) {
    layer(function (c, t) {
      if (t > ms) return false;
      var p = t / ms, e = 1 - Math.pow(1 - p, 3);
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = color; c.globalAlpha = 1 - p; c.lineWidth = 30 * (1 - p) + 2;
      c.beginPath(); c.arc(x, y, e * max, 0, TAU); c.stroke();
      c.lineWidth = 3; c.globalAlpha = (1 - p) * .8; c.strokeStyle = '#fff';
      c.beginPath(); c.arc(x, y, e * max * .82, 0, TAU); c.stroke();
    });
  }

  /* ==================================================================
     Overlays, manga SFX, impact frames, shake, flash
     ================================================================== */
  function overlay(cls) { var o = el('div', cls); o.setAttribute('aria-hidden', 'true'); document.body.appendChild(o); return o; }
  function on(o) { o.getBoundingClientRect(); o.classList.add('on'); }
  function drop(o, ms) { if (!o) return; o.classList.remove('on'); setTimeout(function () { o.remove(); }, ms || 700); }
  function sfx(text, x, y, opt) {
    opt = opt || {};
    var s = el('div', 'pw-sfx ' + (opt.cls || ''), text + (opt.en ? '<span class="en">' + opt.en + '</span>' : ''));
    s.setAttribute('aria-hidden', 'true');
    s.style.left = x + 'px'; s.style.top = y + 'px';
    if (opt.color) s.style.setProperty('--pw-s', opt.color);
    document.body.appendChild(s);
    var rot = opt.rot == null ? rand(-10, 10) : opt.rot, life = opt.life || 900;
    var a = s.animate(reduce ? [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .8 }, { opacity: 0 }] : [
      { transform: 'translate(-50%,-50%) scale(2.6) rotate(' + rot + 'deg)', opacity: 0, filter: 'blur(6px)' },
      { transform: 'translate(-50%,-50%) scale(.9) rotate(' + rot + 'deg)', opacity: 1, filter: 'blur(0px)', offset: .12 },
      { transform: 'translate(-50%,-50%) scale(1) rotate(' + rot + 'deg)', opacity: 1, filter: 'blur(0px)', offset: .82 },
      { transform: 'translate(-50%,-50%) scale(1.25) rotate(' + rot + 'deg)', opacity: 0, filter: 'blur(4px)' }
    ], { duration: life, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    a.onfinish = function () { s.remove(); };
    return s;
  }
  function shakeTargets() {
    return Array.prototype.slice.call(document.querySelectorAll('body > main, body > .site-header, body > footer, body > .site-footer'));
  }
  function shake(power, ms) {
    if (reduce) return;
    var frames = [], n = Math.max(6, Math.round(ms / 40));
    for (var i = 0; i < n; i++) {
      var k = power * Math.pow(1 - i / n, 1.4);
      frames.push({ transform: 'perspective(1400px) translate3d(' + rand(-k, k).toFixed(1) + 'px,' + rand(-k, k).toFixed(1) + 'px,' + (-k * 3).toFixed(0) + 'px) rotateX(' + (rand(-k, k) / 7).toFixed(2) + 'deg) rotateY(' + (rand(-k, k) / 7).toFixed(2) + 'deg)' });
    }
    frames.push({ transform: 'perspective(1400px) translate3d(0px,0px,0px) rotateX(0deg) rotateY(0deg)' });
    /* pivot the 3D tilt on the middle of the screen, not the middle of a
       page that may be tens of thousands of pixels tall */
    shakeTargets().forEach(function (t) {
      var done = pivot(t);
      t.animate(frames, { duration: ms, easing: 'linear', composite: 'add' }).finished.then(done, done);
    });
  }
  /* every camera move and shake pivots on the middle of the screen */
  function pivot(t) {
    if (!t.__pwShakes) { t.__pwShakes = 0; t.__pwOrigin = t.style.transformOrigin; t.style.transformOrigin = '50% ' + (vh() / 2 - t.getBoundingClientRect().top).toFixed(0) + 'px'; }
    t.__pwShakes++;
    var once = false;
    return function () { if (once) return; once = true; if (--t.__pwShakes === 0) { t.style.transformOrigin = t.__pwOrigin; t.__pwShakes = null; } };
  }

  /* ---------- cinematic tools ---------- */
  /* camera: push in toward a point on screen, like a dolly/zoom in AE */
  var cams = [];
  function camera(px, py, scale, ms, ease2) {
    if (reduce) return;
    var cxs = vw() / 2, cys = vh() / 2;
    var tx = (px - cxs) * (1 - scale), ty = (py - cys) * (1 - scale);
    shakeTargets().forEach(function (t) {
      var cur = t.__pwCam || 'translate(0px,0px) scale(1)';
      /* a move that cuts in on one still playing (a skip mid push-in) starts from where the camera is now, not where it was going */
      if (cams.some(function (c) { return c.t === t && c.a.playState !== 'finished'; })) cur = getComputedStyle(t).transform;
      var next = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + scale + ')';
      var done = pivot(t);
      var a = t.animate([{ transform: cur }, { transform: next }], { duration: ms, easing: ease2 || 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' });
      t.__pwCam = next;
      cams.push({ t: t, a: a, done: done });
    });
  }
  function cameraReset(ms) {
    if (reduce) return;
    camera(vw() / 2, vh() / 2, 1, ms || 300, 'cubic-bezier(.16,1,.3,1)');
    var list = cams; cams = [];
    later((ms || 300) + 30, function () { list.forEach(function (c) { c.a.cancel(); c.done(); c.t.__pwCam = null; }); });
  }
  /* a hard cut back to the wide shot: no easing, the framing simply changes on the next frame */
  function cameraCut() {
    var list = cams; cams = [];
    list.forEach(function (c) { c.a.cancel(); c.done(); c.t.__pwCam = null; });
  }
  /* an impact tremor: one hard kick away from the hit, then a damped ring-down with a faster
     tremor riding on it, the way a camera on a real rig settles; not random jitter every frame */
  function quake(power, ms, ax, ay) {
    if (reduce) return;
    var n = Math.max(8, Math.round(ms / 16)), frames = [], ph = rand(0, TAU);
    for (var i = 0; i <= n; i++) {
      var u = i / n, T = u * ms / 1000, env = Math.exp(-4.2 * u) * (1 - u);
      var slow = Math.cos(T * TAU * 6.5), fast = Math.sin(T * TAU * 14 + ph) * .35;
      var x = power * env * (ax * slow + fast * .7), y = power * env * (ay * slow * .8 + fast), rz = power * env * .05 * Math.sin(T * TAU * 5 + ph), z = -power * 2 * env * Math.abs(slow);
      frames.push({ transform: 'perspective(1400px) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(0) + 'px) rotateZ(' + rz.toFixed(2) + 'deg)' });
    }
    frames.push({ transform: 'perspective(1400px) translate3d(0px,0px,0px) rotateZ(0deg)' });
    shakeTargets().forEach(function (t) {
      var done = pivot(t);
      t.animate(frames, { duration: ms, easing: 'linear', composite: 'add' }).finished.then(done, done);
    });
  }
  /* cinematic letterbox bars */
  var bars = null;
  function letterbox(onOff) {
    if (onOff) { if (!bars) { bars = overlay('pw-bars'); on(bars); } }
    else if (bars) { drop(bars, 600); bars = null; }
  }
  /* hit-stop: the whole world freezes for a few frames on impact */
  function hitStop(ms) {
    if (reduce) return;
    var list = document.getAnimations().filter(function (a) { return a.playState === 'running'; });
    list.forEach(function (a) { a.pause(); });
    frozenUntil = performance.now() + ms;
    setTimeout(function () {
      list.forEach(function (a) { try { a.play(); } catch (e) {} });
      layers.forEach(function (f) { f.t0 += ms; });
    }, ms);
  }
  /* chromatic aberration on the page */
  function chroma(ms) {
    if (reduce || phone) return;
    root.classList.add('pw-chroma');
    setTimeout(function () { root.classList.remove('pw-chroma'); }, ms);
  }
  /* anamorphic lens flare: a long horizontal streak plus ghosts */
  function lensFlare(x, y, rgb, ms, size) {
    size = size || 1;
    layer(function (c, t) {
      if (t > ms) return false;
      var k = t < ms * .15 ? t / (ms * .15) : 1 - (t - ms * .15) / (ms * .85), w = vw(), h = vh();
      c.globalCompositeOperation = 'lighter';
      var len = w * .75 * size, g = c.createLinearGradient(x - len, 0, x + len, 0);
      g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(.5, 'rgba(255,255,255,' + (.9 * k) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      c.fillStyle = g; c.fillRect(x - len, y - 2.5 * size, len * 2, 5 * size);
      c.globalAlpha = .35 * k; c.fillRect(x - len * .6, y - 9 * size, len * 1.2, 18 * size);
      var gx2 = w / 2 - (x - w / 2), gy2 = h / 2 - (y - h / 2);
      [[.35, 40], [.6, 18], [.85, 70], [1.1, 28]].forEach(function (gh) {
        var fx = x + (gx2 - x) * gh[0], fy = y + (gy2 - y) * gh[0], r = gh[1] * size;
        var rg = c.createRadialGradient(fx, fy, 0, fx, fy, r);
        rg.addColorStop(0, 'rgba(' + rgb + ',' + (.25 * k) + ')'); rg.addColorStop(.7, 'rgba(' + rgb + ',' + (.12 * k) + ')'); rg.addColorStop(1, 'rgba(' + rgb + ',0)');
        c.globalAlpha = 1; c.fillStyle = rg; c.beginPath(); c.arc(fx, fy, r, 0, TAU); c.fill();
      });
    });
  }
  /* a ring of dust and smoke punching outward from an impact */
  function smokeRing(x, y, rgb, n) {
    var puffs = [];
    for (var i = 0; i < n; i++) { var a = rand(0, TAU), v = rand(6, 16); puffs.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6, r: rand(20, 50), l: 1 }); }
    layer(function (c, t) {
      if (t > 1800) return false;
      c.globalCompositeOperation = 'source-over';
      puffs.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vx *= .93; p.vy *= .93; p.r *= 1.025; p.l -= .012;
        var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, 'rgba(' + rgb + ',' + (.35 * Math.max(0, p.l)) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
        c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
      });
    });
  }
  /* ==================================================================
     REALISM KIT — light that falls on the page, glowing sprites, spark
     physics and ionised afterglow
     ================================================================== */
  /* a light source that actually lights the page: a screen-blended
     radial glow over everything, moved and flickered every frame */
  function pageLight(rgb) {
    var o = overlay('pw-light');
    o.style.setProperty('--lc', rgb);
    var last = '';
    return {
      el: o,
      at: function (x, y, r, a) {
        var k = x.toFixed(0) + ',' + y.toFixed(0) + ',' + r.toFixed(0) + ',' + a.toFixed(2);
        if (k === last) return;
        last = k;
        o.style.setProperty('--lx', x.toFixed(0) + 'px'); o.style.setProperty('--ly', y.toFixed(0) + 'px');
        o.style.setProperty('--lr', Math.max(1, r).toFixed(0) + 'px'); o.style.opacity = Math.max(0, Math.min(1, a)).toFixed(2);
      },
      band: function (css, a) { o.style.background = css; o.style.opacity = Math.max(0, Math.min(1, a)).toFixed(2); },
      off: function (ms) { o.style.transition = 'opacity ' + (ms || 500) + 'ms'; o.style.opacity = 0; setTimeout(function () { o.remove(); }, (ms || 500) + 50); }
    };
  }
  /* soft round sprites, rendered once per colour: far cheaper than a
     new radial gradient for every particle */
  var sprites = {};
  function sprite(rgb, hard) {
    var key = rgb + (hard ? 'h' : '');
    if (sprites[key]) return sprites[key];
    var s = document.createElement('canvas'), x = s.getContext('2d');
    s.width = s.height = 64;
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (hard) { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(' + rgb + ',1)'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); }
    else { g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(.45, 'rgba(' + rgb + ',.45)'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); }
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (sprites[key] = s);
  }
  function blob(c, spr, x, y, r, a) { if (a <= 0 || r <= 0) return; c.globalAlpha = Math.min(1, a); c.drawImage(spr, x - r, y - r, r * 2, r * 2); }
  /* sparks: hot streaks with gravity and drag that cool from white to
     their colour, bounce and skid along the floor, then die */
  function sparkField(rgb, floorY) {
    var list = [], col = rgb.split(',').map(Number);
    return {
      burst: function (x, y, n, sp, dir, spread, up) {
        for (var i = 0; i < n; i++) {
          var a = (dir == null ? rand(0, TAU) : dir + rand(-(spread || .6), spread || .6)), v = rand(.3, 1) * (sp || 9);
          list.push({ x: x, y: y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (up || 0), l: rand(.6, 1), heat: 1 });
        }
      },
      draw: function (c) {
        var fy = floorY == null ? vh() - 4 : floorY();
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        list = list.filter(function (s) {
          s.px = s.x; s.py = s.y;
          s.vy += .38; s.vx *= .985; s.vy *= .985;
          s.x += s.vx; s.y += s.vy;
          if (s.y > fy) { s.y = fy; s.vy *= -.32; s.vx *= .72; s.l -= .08; }
          s.heat = Math.max(0, s.heat - .045); s.l -= .016;
          if (s.l <= 0) return false;
          var hh = s.heat, r = Math.round(col[0] + (255 - col[0]) * hh), g = Math.round(col[1] + (255 - col[1]) * hh), b = Math.round(col[2] + (255 - col[2]) * hh);
          c.strokeStyle = 'rgb(' + r + ',' + g + ',' + b + ')'; c.globalAlpha = Math.min(1, s.l * 1.6);
          c.lineWidth = .8 + hh * 1.8;
          c.beginPath(); c.moveTo(s.px - s.vx * .6, s.py - s.vy * .6); c.lineTo(s.x, s.y); c.stroke();
          return true;
        });
        c.globalAlpha = 1;
        return list.length;
      }
    };
  }
  /* ionised afterglow: every strike leaves a violet ghost of its path
     that fades out, like the retina after a real lightning flash */
  var ions = [], ionOn = false;
  function ion(segs, w) {
    ions.push({ segs: segs, t: performance.now(), w: w || 1 });
    if (ionOn) return;
    ionOn = true;
    layer(function (c, t, now) {
      ions = ions.filter(function (i) { return now - i.t < 260; });
      if (!ions.length) { ionOn = false; return false; }
      c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
      ions.forEach(function (i) {
        var k = 1 - (now - i.t) / 260;
        c.strokeStyle = 'rgba(130,110,255,1)'; c.globalAlpha = .22 * k * k;
        i.segs.forEach(function (s) {
          c.lineWidth = s.w * 9 * i.w; c.beginPath(); c.moveTo(s.p[0][0], s.p[0][1]);
          for (var j = 1; j < s.p.length; j++) c.lineTo(s.p[j][0], s.p[j][1]);
          c.stroke();
        });
      });
      c.globalAlpha = 1;
    });
  }
  /* smooth value noise for flames, plasma edges and wind */
  function noise1(x) { var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); function h(n) { var s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); } return h(i) * (1 - u) + h(i + 1) * u; }
  function noise2(x, y) { return noise1(x + noise1(y * 1.7) * 4.3); }

  function flash(color, ms, peak) {
    var f = overlay('pw-flash'); f.style.background = color || '#fff';
    var a = f.animate([{ opacity: 0 }, { opacity: peak == null ? .95 : peak, offset: .1 }, { opacity: 0 }], { duration: ms || 500, easing: 'ease-out' });
    a.onfinish = function () { f.remove(); };
  }
  /* anime impact frames: the whole screen flips to a negative, then a
     solid frame where only the energy shows, then negative again */
  function impact(seq, tint) {
    if (reduce) { flash('#fff', 300, .6); return; }
    var ink = overlay('pw-ink'), i = 0;
    root.classList.toggle('pw-neg-violet', tint === 'violet');
    root.classList.toggle('pw-neg-gold', tint === 'gold');
    (function step() {
      root.classList.remove('pw-neg'); ink.style.opacity = 0;
      var s = seq[i++], kind = s && s.length && typeof s !== 'string' ? s[0] : s, ms = s && typeof s !== 'string' ? s[1] : 55;   /* a step is 'neg' | 'black' | 'white', or [kind, ms] */
      if (!s) { ink.remove(); root.classList.remove('pw-neg-violet', 'pw-neg-gold'); return; }
      if (kind === 'neg') root.classList.add('pw-neg');
      else { ink.style.background = kind === 'white' ? '#fff' : '#000'; ink.style.opacity = 1; }
      setTimeout(step, ms);
    })();
  }

  /* ==================================================================
     Pieces of the page: visible blocks small enough to fly as one
     ================================================================== */
  var ATOM = /^(IMG|SVG|CANVAS|VIDEO|PICTURE|IFRAME|BUTTON|A|INPUT|TEXTAREA|SELECT|H1|H2|H3|H4|H5|H6|P|LI|LABEL|DT|DD|BLOCKQUOTE|FIGURE|PRE|CODE|SPAN|B|STRONG|EM|SMALL|I)$/;
  var SKIP = /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|LINK|META|BR|DEFS)$/;
  /* our own layers (including SVG ones, whose className is not a string) never fly as rubble */
  function isOurs(n) { var c = n.getAttribute && n.getAttribute('class'); return !!c && /(^|\s)(pw-|toasts|curtain|loader|skip|grain|progress)/.test(c); }
  function hasSkin(cs) {
    return (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
      cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none';
  }
  function pieces(max) {
    var outl = [], w = vw(), h = vh(), area = w * h;
    function walk(n) {
      if (outl.length >= max || n.nodeType !== 1 || SKIP.test(n.tagName.toUpperCase()) || isOurs(n)) return;
      var cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (cs.display === 'contents') { kids(n); return; }
      var r = n.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > h || r.right < 0 || r.left > w) return;
      var a = r.width * r.height, tag = n.tagName.toUpperCase();
      if (tag === 'SVG' && r.height > h * 2) return; /* page-long decorative layers stay put */
      var small = a < area * .05, atom = ATOM.test(tag) && a < area * .3, card = hasSkin(cs) && a < area * .16;
      if (small || atom || card || tag === 'SVG' || !n.children.length) { outl.push({ el: n, r: r }); return; }
      kids(n);
    }
    function kids(n) { for (var i = 0; i < n.children.length; i++) walk(n.children[i]); }
    kids(document.body);
    return outl;
  }

  /* ==================================================================
     Scroll lock (native, the site's wheel inertia and keys)
     ================================================================== */
  function block(e) { e.preventDefault(); e.stopImmediatePropagation(); }
  function blockKeys(e) {
    if (e.key === 'Escape' && ruin && !busy) { e.preventDefault(); arise(); return; }
    if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key) && !(e.target.closest && e.target.closest('.pw-dock, .pw-ruin-cta'))) block(e);
  }
  /* the page is held still by blocking scroll input and undoing any stray scroll, never with
     overflow: hidden, which breaks position: sticky and made pinned sections jump away */
  var lockPos = null;
  function holdScroll() { if (lockPos && (window.scrollX !== lockPos[0] || window.scrollY !== lockPos[1])) window.scrollTo({ left: lockPos[0], top: lockPos[1], behavior: 'instant' }); }
  function lock(onOff) {
    root.classList.toggle('pw-locked', onOff);
    lockPos = onOff ? [window.scrollX, window.scrollY] : null;
    var fn = onOff ? 'addEventListener' : 'removeEventListener';
    window[fn]('scroll', holdScroll, { passive: true });
    window[fn]('wheel', block, { capture: true, passive: false });
    window[fn]('touchmove', block, { capture: true, passive: false });
    window[fn]('keydown', blockKeys, true);
  }

  /* ==================================================================
     千鳥 CHIDORI — charge in the hand, dash dragging lightning along the
     ground, strike, impact frames, the page shatters into rubble
     ================================================================== */
  function chidori() {
    if (busy || ruin) return;
    setBusy(true); closeDock();
    var w = vw(), h = vh(), floor = h * .93;
    var sx = w * (phone ? .22 : .16), sy = h * .8, ex = w / 2, ey = h * (phone ? .56 : .58);
    /* timing from the clip (assets/sfx/marks.json): the strike, and the surges
       (its strongest onsets) where the lightning flares */
    var DASH = reduce ? 1 : 460, CHARGE = reduce ? 500 : Math.max(900, mark('chidori', 'strike', 1.77) * 1000 - DASH), HIT = CHARGE + DASH;
    var SURGE = mark('chidori', 'surges', [.84, 1.02, 2.04]).map(function (s) { return s * 1000; }).filter(function (s) { return s < CHARGE - 150; });
    var BIRTH = SURGE.length ? SURGE[0] : CHARGE * .3;
    lock(true); letterbox(true);
    var dim = overlay('pw-dim'); dim.style.setProperty('--px', sx + 'px'); dim.style.setProperty('--py', sy + 'px'); on(dim);
    var lit = reduce ? null : pageLight('90,160,255'), spk = sparkField('70,150,255', function () { return floor; });
    layer(function (c, t) { spk.draw(c); return t < HIT + 3200; });
    camera(sx, sy, 1.09, CHARGE, 'cubic-bezier(.3,0,.2,1)');
    clip('chidori', 0);

    /* things near the hand the lightning can jump to */
    var near = [];
    Array.prototype.forEach.call(document.querySelectorAll('main h1, main h2, main h3, main .btn, main img, main p, main li, main a, main .card'), function (e) {
      if (near.length >= 30) return;
      var r = e.getBoundingClientRect();
      if (r.width < 10 || r.height < 6 || r.bottom < 0 || r.top > h) return;
      var nx = Math.max(r.left, Math.min(sx, r.right)), ny = Math.max(r.top, Math.min(sy, r.bottom)), d = Math.hypot(nx - sx, ny - sy);
      if (d > 50 && d < (phone ? 260 : 430)) near.push({ e: e, r: r });
    });
    function edgePoint(r) {
      var k = Math.random();
      return k < .25 ? [rand(r.left, r.right), r.top] : k < .5 ? [rand(r.left, r.right), r.bottom] : k < .75 ? [r.left, rand(r.top, r.bottom)] : [r.right, rand(r.top, r.bottom)];
    }

    var flare = 0, lines = null, linesT = 0, ghosts = [], scar = [], jumpT = 0;
    var arcs = [], tend = [];
    for (var i = 0; i < (phone ? 7 : 12); i++) arcs.push({ b: null, until: 0 });
    for (i = 0; i < (phone ? 6 : 11); i++) tend.push({ b: null, until: 0 });
    function surge(k) { flare = Math.max(flare, k); }
    SURGE.forEach(function (s, n) {
      later(s, function () {
        surge(n === 0 ? 1.5 : 1.1);
        flash('#dff1ff', 200, n === 0 ? .35 : .2);
        shake(n === 0 ? 6 : 4 + n * 2, 320);
        if (n === 0) sfx('千鳥', w / 2, h * (phone ? .24 : .2), { cls: 'xl', en: 'CHIDORI', color: '#2d8cff', life: 1700, rot: -6 });
        if (n === 1) sfx('チチチチチ', w * (phone ? .7 : .72), h * .66, { cls: 'sm', color: '#2d8cff', life: 1100 });
        if (n === 2) sfx('バチバチ', w * (phone ? .28 : .3), h * .42, { cls: 'sm', color: '#2d8cff', life: 900, rot: 8 });
      });
    });
    if (!SURGE.length) later(250, function () { sfx('千鳥', w / 2, h * (phone ? .24 : .2), { cls: 'xl', en: 'CHIDORI', color: '#2d8cff', life: 1500, rot: -6 }); });

    var sprCore = sprite('225,240,255', true), sprHalo = sprite('70,150,255');
    layer(function (c, t, now) {
      if (t > HIT + 420) return false;
      flare *= .93;
      var p = Math.min(1, t / CHARGE), born = Math.min(1, Math.max(0, (t - BIRTH) / 260)), bornE = 1 - Math.pow(1 - born, 3);
      /* the dash: a short pull back, then an explosive, slightly arcing run */
      var dt = t < CHARGE ? -1 : Math.min(1, (t - CHARGE) / DASH), x = sx, y = sy;
      if (dt >= 0) {
        if (dt < .2) { var q = dt / .2; x = sx - 22 * (1 - Math.pow(1 - q, 2)); y = sy + 6 * q; }
        else { var u = (dt - .2) / .8, e = u < .5 ? 16 * u * u * u * u * u : 1 - Math.pow(-2 * u + 2, 5) / 2; x = sx - 22 + (ex - sx + 22) * e; y = sy + 6 + (ey - sy - 6) * e - Math.sin(Math.PI * e) * 46; }
      }
      var fl = Math.random() < .25 + p * .4 ? rand(.5, 1) : rand(.8, .95);   /* the strobe quickens as it charges */
      if (t < HIT) dim.style.opacity = (.8 + Math.random() * .2 * (.3 + p)).toFixed(2);
      if (lit && t < HIT) lit.at(x, y, 200 + p * 520 + flare * 160, Math.min(1, (.12 + bornE * .55 + flare * .3) * fl));
      /* focus lines, redrawn on twos like anime cels, tightening to the peak */
      if (!reduce && born > 0) {
        if (!lines || now - linesT > 70) { linesT = now; lines = { s: (Math.random() * 1e9) | 0 }; }
        focusLines(c, x, y, 150 - p * 55, 'rgba(210,235,255,1)', phone ? 40 : 80, (.1 + p * .22) * bornE, seeded(lines.s));
      }
      c.globalCompositeOperation = 'lighter';
      /* anamorphic streak through the hand */
      if (!reduce && born > 0) {
        var sl = w * (.18 + p * .5 + flare * .1), sg = c.createLinearGradient(x - sl, 0, x + sl, 0);
        sg.addColorStop(0, 'rgba(80,160,255,0)'); sg.addColorStop(.5, 'rgba(225,242,255,' + Math.min(1, .3 + p * .5 + flare * .2) + ')'); sg.addColorStop(1, 'rgba(80,160,255,0)');
        c.fillStyle = sg; c.fillRect(x - sl, y - 2, sl * 2, 4);
      }
      /* before it is born: a sputtering point */
      var R = born > 0 ? 8 + bornE * (30 + p * 16) + flare * 10 + Math.sin(t / 22) * 2 : 3 + Math.random() * 3;
      blob(c, sprHalo, x, y, R * 5.2, (.35 + .4 * bornE) * fl);
      blob(c, sprCore, x, y, R * 1.6, 1);
      /* its light pooling on the ground below */
      c.save(); c.translate(x, floor); c.scale(1, .16); blob(c, sprite('80,150,255'), 0, 0, 110 + p * 230 + flare * 80, (.2 + .5 * bornE) * fl); c.restore();
      if (born <= 0) {
        if (Math.random() < .5) spk.burst(x, y, 1, 4);
        if (Math.random() < .3) drawBolt(c, makeBolt(x, y, x + rand(-30, 30), y + rand(-30, 30), .6, 0, 0), '#6ab8ff', .8);
        return;
      }
      /* the 3D sphere of arcs spinning in the hand */
      var n = Math.min(arcs.length, 3 + Math.round(p * arcs.length)), SR = 18 + bornE * (phone ? 30 : 44) + flare * 12;
      var ay = t * .006, ax = .5 + Math.sin(t / 700) * .4;
      for (var k = 0; k < n; k++) {
        var A = arcs[k];
        if (!A.b || now > A.until) { A.b = sphereArc(SR); A.until = now + rand(40, 90); }
        draw3d(c, A.b, x, y, ay, ax, '#4aa8ff', rand(1.1, 1.8));
      }
      /* long tendrils re-striking all around it: the thousand birds */
      var nt = Math.min(tend.length, 2 + Math.round((p * .8 + flare * .4) * tend.length));
      for (var m = 0; m < nt; m++) {
        var T = tend[m];
        if (!T.b || now > T.until) {
          var ta = rand(0, TAU), tl = rand(55, 120 + p * 200) * (1 + flare * .6);
          T.b = makeBolt(x + Math.cos(ta) * SR * .6, y + Math.sin(ta) * SR * .6, x + Math.cos(ta) * tl, y + Math.sin(ta) * tl * .8, 1, 1, .25);
          T.until = now + rand(35, 80); ion(T.b, .5);
        }
        drawBolt(c, T.b, '#6ab8ff', .95);
      }
      /* lightning dragging into the ground below the hand */
      if (dt < 0 && Math.random() < .35 + p * .45) {
        var gb = makeBolt(x + rand(-10, 10), y + SR * .5, x + rand(-80, 80), floor + rand(-6, 6), 1.1, 1, .12);
        drawBolt(c, gb, '#4aa8ff', .85); ion(gb, .7);
        if (Math.random() < .5) spk.burst(gb[0].p[gb[0].p.length - 1][0], floor, 3, 8, -Math.PI / 2, 1, 2);
      }
      /* arcs jumping onto the page around it: what they hit flickers */
      if (!reduce && dt < 0 && near.length && now > jumpT && Math.random() < .08 + p * .18) {
        jumpT = now + rand(60, 160);
        var tg = near[(Math.random() * near.length) | 0], ep = edgePoint(tg.r);
        var jb = makeBolt(x, y, ep[0], ep[1], 1, 1, .15);
        drawBolt(c, jb, '#8fd0ff', 1); ion(jb, .9);
        spk.burst(ep[0], ep[1], 5, 7);
        try { tg.e.animate([{ filter: 'brightness(2.4) drop-shadow(0 0 8px #6ab8ff)' }, { filter: 'none' }], { duration: 220 }); } catch (er) {}
      }
      if (Math.random() < .5 + p * .3) spk.burst(x, y, 1 + Math.round(p * 2), 6 + p * 5);
      /* the dash: afterimages, speed and a scar gouged into the ground */
      if (dt >= 0 && dt < 1) {
        ghosts.push({ x: x, y: y, t: now });
        scar.push([x, floor]);
        spk.burst(x, floor, 6, 14, Math.PI + .45, .45, 2);
        var tb = makeBolt(x, y, x - rand(20, 60), floor + rand(-8, 8), 1.2, 1, .1);
        drawBolt(c, tb, '#4aa8ff', .75); ion(tb, .8);
      }
      ghosts = ghosts.filter(function (g) { var a = 1 - (now - g.t) / 200; if (a <= 0) return false; blob(c, sprHalo, g.x, g.y, R * 3.5, a * .45); blob(c, sprCore, g.x, g.y, R * 1.1, a * .6); return true; });
    });

    /* the scar the dash leaves in the ground, cooling from white to ember */
    layer(function (c, t) {
      if (t > HIT + 1900) return false;
      if (scar.length < 2) return;
      var age = Math.max(0, t - HIT) / 1900, a = 1 - age;
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      [[age < .3 ? '#ffffff' : '#9fd6ff', 2.5], ['rgba(90,160,255,.6)', 9], ['rgba(255,130,60,' + (.5 * age) + ')', 5]].forEach(function (ps) {
        c.strokeStyle = ps[0]; c.lineWidth = ps[1]; c.globalAlpha = a;
        c.beginPath(); c.moveTo(scar[0][0], scar[0][1]);
        for (var s = 1; s < scar.length; s++) c.lineTo(scar[s][0], scar[s][1] + Math.sin(s * 1.7) * 2);
        c.stroke();
      });
      c.globalAlpha = 1;
    });

    later(CHARGE, function () { camera(ex, ey, 1.14, DASH, 'cubic-bezier(.7,0,.3,1)'); surge(.8); });

    /* the strike, cut like an anime impact: a hard cut to the wide shot, two white frames,
       then negative and black impact frames held while the cracks race out across the
       screen; the world resumes with a tremor, lightning bursting to every edge, and the
       page breaks up into rubble that falls, tumbles and settles in dust */
    var FREEZE = 230, BURST = 270;
    later(HIT, function () {
      cameraCut();
      hitStop(FREEZE);
      /* impact frames are pure graphics: no soft light, no dim, just the negative page and the bolt */
      if (lit) lit.at(ex, ey, 1, 0);
      dim.style.transition = 'none'; dim.style.opacity = '0';
      impact([['white', 33], ['neg', 66], ['black', 33], ['neg', 66], ['black', 33]], null);
      lensFlare(ex, ey, '90,170,255', 700, 1);
      spk.burst(ex, ey, phone ? 50 : 110, 26, null, null, 4);
      /* the strike's light on the page dies down with a guttering flicker, not random jumps */
      if (lit) layer(function (c2, t2) { var k = Math.max(0, 1 - t2 / 1200); lit.at(ex, ey, Math.max(w, h) * (.6 + (1 - k) * .4), k * (.65 + .35 * noise1(t2 / 45))); if (k <= 0) { lit.off(200); return false; } });
      shockwave(ex, ey, '#7cc4ff', Math.max(w, h) * .9, 700);
      var ring = [], nr = phone ? 12 : 20;
      for (var i = 0; i < nr; i++) ring.push({ b: null, until: 0, a: i / nr * TAU });
      /* fewer, bolder bolts to the edges, each drawing held for four frames */
      var edges = [], ne = phone ? 5 : 7;
      for (i = 0; i < ne; i++) {
        var a = (i / ne) * TAU + rand(-.25, .25);
        edges.push(flicker((function (aa) { return function () { return makeBolt(ex, ey, ex + Math.cos(aa) * Math.max(w, h), ey + Math.sin(aa) * Math.max(w, h), 3, 2, .07); }; })(a), 66));
      }
      layer(function (c, t, now) {
        if (t > 520) return false;
        var k = 1 - t / 520, rr = (1 - Math.pow(1 - t / 520, 3)) * Math.max(w, h) * .62;
        c.globalCompositeOperation = 'lighter';
        edges.forEach(function (f) { if (t < 340) drawBolt(c, f(now), '#6ab8ff', 1 - t / 340); });
        /* the ring: short bolts laid along an expanding circle */
        ring.forEach(function (r2) {
          if (!r2.b || now > r2.until) {
            var a0 = r2.a + rand(-.05, .05), a1 = a0 + TAU / nr * rand(.8, 1.3);
            r2.b = makeBolt(ex + Math.cos(a0) * rr, ey + Math.sin(a0) * rr * .85, ex + Math.cos(a1) * rr, ey + Math.sin(a1) * rr * .85, 1.3, 1, .2);
            r2.until = now + 60;
          }
          drawBolt(c, r2.b, '#8fd0ff', k);
        });
      });
      cracks(ex, ey);
      var landings = shatter(ex, ey, BURST);
      scorch(ex, ey);
      dust(ex, ey, floor, landings, FREEZE, BURST);
      /* the frozen frames end: the camera kicks away from the hit and rings down */
      var kx = w / 2 - ex, ky = h / 2 - ey, kl = Math.hypot(kx, ky);
      later(FREEZE, function () {
        quake(phone ? 16 : 26, 1100, kl > 1 ? kx / kl : 0, kl > 1 ? ky / kl : -1);
        chroma(400);
        glass(ex, ey);
        var r = overlay('pw-ruin'); r.style.setProperty('--px', ex + 'px'); r.style.setProperty('--py', ey + 'px'); r.style.transition = 'opacity .7s'; on(r);
        ruinParts.push(r);
      });
      /* the heaviest pieces landing thump the ground */
      landings.filter(function (l) { return l.m > 2.4; }).slice(0, 3).forEach(function (l) { later(l.t, function () { quake(phone ? 2 : 4, 280, 0, 1); }); });
      later(300, function () { sfx('ピシャアアン', ex - (phone ? 40 : 190), ey - 70, { color: '#6ab8ff', life: 1200, rot: -12 }); });
    });
    later(HIT + 600, function () { drop(dim, 100); });
    later(HIT + 2000, function () { letterbox(false); });
  }

  var ruinParts = [];
  /* the screen itself breaks like smashed glass: straight, sharp cracks
     run out from the hit, short straight cracks join some of them (never a
     full ring), each piece catches the light a little differently, the
     impact point is crushed white, and a few shards drop out of the screen */
  function cracks(px, py) {
    var w = vw(), h = vh(), NS = 'http://www.w3.org/2000/svg';
    var maxR = Math.hypot(Math.max(px, w - px), Math.max(py, h - py)) + 60, crush = phone ? 20 : 30;
    function f(q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }
    function ray(th) {
      var p = [[px, py]], s = [0], a = th, x = px, y = py, len = 0;
      while (len < maxR) { var seg = rand(110, 280); a += rand(-.12, .12); x += Math.cos(a) * seg; y += Math.sin(a) * seg; len += seg; p.push([x, y]); s.push(len); }
      return { p: p, s: s };
    }
    function at(R, d) {
      for (var k = 1; k < R.s.length; k++) if (R.s[k] >= d) { var u = (d - R.s[k - 1]) / (R.s[k] - R.s[k - 1]); return [R.p[k - 1][0] + (R.p[k][0] - R.p[k - 1][0]) * u, R.p[k - 1][1] + (R.p[k][1] - R.p[k - 1][1]) * u]; }
      return R.p[R.p.length - 1];
    }
    function span(R, d0, d1) {
      var out = [at(R, d0)];
      for (var k = 1; k < R.s.length; k++) if (R.s[k] > d0 && R.s[k] < d1) out.push(R.p[k]);
      out.push(at(R, d1));
      return out;
    }
    var n = phone ? 9 : 14, rays = [], i, k;
    for (i = 0; i < n; i++) rays.push(ray((i + rand(-.3, .3)) / n * TAU));
    var lines = '', near = '', shards = '', fallers = [];
    rays.forEach(function (R) {
      lines += 'M' + span(R, crush * .8, maxR).map(f).join('L');
      near += 'M' + span(R, crush * .8, maxR * .2).map(f).join('L');
      /* the odd Y-fork: a straight branch off the main crack */
      if (Math.random() < .45) {
        var d = maxR * rand(.2, .55), o = at(R, d), q = at(R, d + 10), ang = Math.atan2(q[1] - o[1], q[0] - o[0]) + rand(.25, .55) * (Math.random() < .5 ? 1 : -1), l = rand(90, 260);
        var m = [o[0] + Math.cos(ang) * l * .5, o[1] + Math.sin(ang) * l * .5], e = [m[0] + Math.cos(ang + rand(-.1, .1)) * l * .5, m[1] + Math.sin(ang + rand(-.1, .1)) * l * .5];
        lines += 'M' + [o, m, e].map(f).join('L');
      }
    });
    /* each wedge between two cracks is split into pieces by 0-3 straight cross-cracks */
    for (i = 0; i < n; i++) {
      var A = rays[i], B = rays[(i + 1) % n], cuts = [[crush, crush]], cnt = pick([0, 1, 1, 2, 2, 3]);
      for (k = 0; k < cnt; k++) { var d0 = rand(crush * 2.5, maxR * .7); cuts.push([d0, d0 * rand(.8, 1.25)]); }
      cuts.sort(function (x, y) { return x[0] - y[0]; });
      for (k = 1; k < cuts.length; k++) if (cuts[k][1] <= cuts[k - 1][1] + 24) cuts[k][1] = cuts[k - 1][1] + 24;
      cuts.push([maxR, maxR]);
      for (k = 1; k < cuts.length - 1; k++) {
        var c0 = at(A, cuts[k][0]), c1 = at(B, cuts[k][1]), mid = [(c0[0] + c1[0]) / 2 + rand(-10, 10), (c0[1] + c1[1]) / 2 + rand(-10, 10)];
        lines += 'M' + [c0, mid, c1].map(f).join('L');
      }
      for (k = 0; k < cuts.length - 1; k++) {
        var poly = span(A, cuts[k][0], cuts[k + 1][0]).concat(span(B, cuts[k][1], cuts[k + 1][1]).reverse()), d = 'M' + poly.map(f).join('L') + 'Z';
        var falls = k < 2 && cuts[k + 1][0] < maxR * .45 && fallers.length < (phone ? 3 : 6) && Math.random() < .5;
        if (falls) { fallers.push({ d: d, poly: poly }); shards += '<path d="' + d + '" fill="rgba(0,0,0,.72)"/>'; }
        else shards += '<path d="' + d + '" fill="' + (Math.random() < .72 ? 'rgba(255,255,255,' + rand(.012, .06).toFixed(3) : 'rgba(8,12,28,' + rand(.05, .15).toFixed(3)) + ')"/>';
      }
    }
    /* the crushed spot where it hit */
    var crushLines = '';
    for (k = 0; k < (phone ? 18 : 30); k++) {
      var ca = rand(0, TAU), cr = rand(2, crush * 1.4), cl = rand(5, crush * .8), cb = ca + rand(-1.2, 1.2);
      var s0 = [px + Math.cos(ca) * cr, py + Math.sin(ca) * cr];
      crushLines += 'M' + f(s0) + 'L' + f([s0[0] + Math.cos(cb) * cl, s0[1] + Math.sin(cb) * cl]);
    }
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'pw-cracks'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML =
      '<defs><radialGradient id="pw-crush"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#dfefff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<g>' + shards + '</g>' +
      '<path d="' + lines + '" fill="none" stroke="rgba(0,0,0,.65)" stroke-width="3" transform="translate(1.2 1.2)"/>' +
      '<path d="' + lines + '" fill="none" stroke="rgba(238,246,255,.92)" stroke-width="1.4"/>' +
      '<path d="' + near + '" fill="none" stroke="#fff" stroke-width="2.2"/>' +
      '<path class="pw-crack-glow" d="' + near + '" fill="none" stroke="#8fd0ff" stroke-width="1.4"/>' +
      '<circle cx="' + px.toFixed(0) + '" cy="' + py.toFixed(0) + '" r="' + (crush * 2.2).toFixed(0) + '" fill="url(#pw-crush)"/>' +
      '<path d="' + crushLines + '" fill="none" stroke="rgba(255,255,255,.9)" stroke-width=".9"/>' +
      '<circle cx="' + px.toFixed(0) + '" cy="' + py.toFixed(0) + '" r="' + (phone ? 4 : 6) + '" fill="#000"/>';
    document.body.appendChild(svg);
    ruinParts.push(svg);
    if (!reduce) {
      /* the cracks race out in six jumps over the impact frames, fast near the hit,
         slowing as they reach the edges: propagation drawn on twos, not a smooth wipe */
      svg.animate([
        { clipPath: 'circle(0px at ' + px + 'px ' + py + 'px)', easing: 'steps(1, end)' },
        { clipPath: 'circle(' + (maxR * .3).toFixed(0) + 'px at ' + px + 'px ' + py + 'px)', offset: .17, easing: 'steps(1, end)' },
        { clipPath: 'circle(' + (maxR * .55).toFixed(0) + 'px at ' + px + 'px ' + py + 'px)', offset: .34, easing: 'steps(1, end)' },
        { clipPath: 'circle(' + (maxR * .74).toFixed(0) + 'px at ' + px + 'px ' + py + 'px)', offset: .5, easing: 'steps(1, end)' },
        { clipPath: 'circle(' + (maxR * .88).toFixed(0) + 'px at ' + px + 'px ' + py + 'px)', offset: .67, easing: 'steps(1, end)' },
        { clipPath: 'circle(' + (maxR * .97).toFixed(0) + 'px at ' + px + 'px ' + py + 'px)', offset: .84, easing: 'steps(1, end)' },
        { clipPath: 'circle(' + maxR.toFixed(0) + 'px at ' + px + 'px ' + py + 'px)' }
      ], { duration: 200, fill: 'forwards' });
      svg.querySelector('.pw-crack-glow').animate([{ opacity: 1 }, { opacity: .8, offset: .15 }, { opacity: 0 }], { duration: 2400, easing: 'ease-out', fill: 'forwards' });
    }
    /* loose shards drop out of the screen, turning as they fall */
    fallers.forEach(function (sh) {
      var cxs = 0, cys = 0;
      sh.poly.forEach(function (q) { cxs += q[0]; cys += q[1]; });
      cxs /= sh.poly.length; cys /= sh.poly.length;
      var el2 = document.createElementNS(NS, 'svg');
      el2.setAttribute('class', 'pw-cracks pw-shard'); el2.setAttribute('viewBox', '0 0 ' + w + ' ' + h); el2.setAttribute('aria-hidden', 'true');
      el2.innerHTML = '<path d="' + sh.d + '" fill="rgba(200,225,255,.16)" stroke="rgba(240,248,255,.9)" stroke-width="1.2"/>';
      el2.style.transformOrigin = cxs.toFixed(0) + 'px ' + cys.toFixed(0) + 'px';
      document.body.appendChild(el2);
      ruinParts.push(el2);
      if (reduce) { el2.style.opacity = 0; return; }
      /* a loose shard tips out after the burst and falls under gravity, drawn on the cel clock */
      var dx = rand(-60, 60) + (cxs - px) * .2, rot = rand(-70, 70), fall = h - cys + 120, dur = rand(800, 1200), kf2 = [], nk = Math.round(dur / CEL);
      for (var q = 0; q <= nk; q++) {
        var u = q / nk, tip = Math.min(1, u / .18), drp = Math.max(0, (u - .18) / .82);
        kf2.push({ transform: 'translate(' + (dx * (tip * .15 + drp * .85)).toFixed(0) + 'px,' + (4 * tip + fall * drp * drp).toFixed(0) + 'px) rotate(' + (rot * (tip * .05 + drp * .95)).toFixed(1) + 'deg)', easing: 'steps(1, end)' });
      }
      el2.animate(kf2, { duration: dur, delay: rand(320, 900), fill: 'forwards' });
    });
  }

  /* the cel clock the rubble is drawn on: 24 drawings a second, each held until the next */
  var CEL = 1000 / 24;
  /* glass shards spat out of the hit: small ones fly fastest, all tumble, fall, skip once
     off the rubble line and come to rest; drawn on the cel clock, lit on the side that
     faces the hit while its light lasts */
  function glass(px, py) {
    var shards = [], n = phone ? 18 : 32, floor = vh() * .93, W2 = vw(), cel = -1, DT = CEL / 1000;
    for (var i = 0; i < n; i++) {
      var a = rand(0, TAU), s = rand(8, phone ? 34 : 54), sp = rand(300, 1400) * (1.3 - s / 60);
      shards.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(100, 500), r: rand(0, 6), vr: rand(-9, 9), s: s, down: false,
        p: [[0, 0], [rand(.4, 1) * s, rand(-.4, .4) * s], [rand(-.3, .5) * s, rand(.5, 1) * s]] });
    }
    layer(function (c, t) {
      if (t > 2600) return false;
      var f = Math.floor(t / CEL);
      if (f !== cel) {
        for (var k = cel < 0 ? 1 : f - cel; k > 0; k--) shards.forEach(function (s) {
          if (s.down) return;
          s.vy += 2600 * DT; s.vx *= .992;
          s.x += s.vx * DT; s.y += s.vy * DT; s.r += s.vr * DT;
          if (s.x < 0 || s.x > W2) { s.vx *= -.4; s.x = Math.max(0, Math.min(W2, s.x)); }
          if (s.y > floor - s.s * .3) {
            s.y = floor - s.s * .3;
            if (s.vy > 320) { s.vy *= -rand(.15, .3); s.vx *= .5; s.vr *= -.4; }
            else { s.down = true; s.downT = t; }
          }
        });
        cel = f;
      }
      var lit = Math.max(0, 1 - t / 1200), fade = Math.max(0, Math.min(1, (2600 - t) / 600));
      shards.forEach(function (s) {
        var face = !s.down && Math.cos(s.r + Math.atan2(py - s.y, px - s.x)) > .2 && lit > 0;
        var a = fade * (s.down ? Math.max(0, 1 - (t - s.downT) / 700) : 1);
        if (a <= 0) return;
        c.save(); c.translate(s.x, s.y); c.rotate(s.r);
        c.beginPath(); c.moveTo(s.p[0][0], s.p[0][1]); c.lineTo(s.p[1][0], s.p[1][1]); c.lineTo(s.p[2][0], s.p[2][1]); c.closePath();
        c.globalAlpha = a;
        c.fillStyle = face ? 'rgba(235,245,255,' + (.45 + lit * .4) + ')' : 'rgba(120,150,190,.3)'; c.fill();
        c.strokeStyle = face ? '#fff' : 'rgba(190,215,245,.7)'; c.lineWidth = 1.2; c.stroke();
        c.restore();
      });
      c.globalAlpha = 1;
    });
  }

  /* dust: two-tone cel smoke in clumps of circles, advanced on twos (12 drawings a second).
     A dome rolls out of the hit and a wave runs along the ground; every piece of rubble that
     lands kicks up its own puff, weighted by its mass; it all hangs, spreads and settles over
     a few seconds. While the strike's light lasts the clumps are lit on the side facing it */
  function dust(px, py, floor, events, off, burst) {
    if (reduce) return;
    /* this layer is born during the frozen impact frames, so its clock starts `off` ms after the hit */
    var puffs = [], cel = -1, ei = 0, T = 1000 / 12, dome = false, t1 = burst - off;
    /* only the heavier, faster landings raise dust, the heaviest first */
    events = events.filter(function (e) { return e.v > 500 && e.m > .9; }).sort(function (a, b) { return b.m - a.m; }).slice(0, phone ? 22 : 48).sort(function (a, b) { return a.t - b.t; });
    function add(x, y, vx, vy, r, life) { puffs.push({ x: x, y: y, vx: vx, vy: vy, r: r, g: rand(1.2, 3), age: 0, life: life, k: rand(0, TAU), a: 0 }); }
    /* a clump of five circles, the shape cel smoke is drawn with */
    function clump(c, p, ox, oy, sc, grow) {
      var r = p.r * sc + (grow || 0);
      c.beginPath();
      c.moveTo(p.x + ox + r, p.y + oy); c.arc(p.x + ox, p.y + oy, r, 0, TAU);
      for (var j = 0; j < 4; j++) {
        var a = p.k + j * 1.6, rr = r * (j % 2 ? .62 : .74), x2 = p.x + Math.cos(a) * p.r * .6 + ox, y2 = p.y + Math.sin(a) * p.r * .38 + oy;
        c.moveTo(x2 + rr, y2); c.arc(x2, y2, rr, 0, TAU);
      }
      c.fill();
    }
    layer(function (c, t) {
      if (t > 5600) return false;
      var gone = ruin && ruin.rising ? Math.max(0, 1 - (t - (ruin.riseT || (ruin.riseT = t))) / 500) : 1;
      if (gone <= 0) return false;
      var f = Math.floor(t / T);
      if (f !== cel) {
        cel = f;
        if (!dome && t >= t1) {
          dome = true;
          /* the dome: fast out of the hit, braking hard, thinning as it spreads */
          for (var i = 0, nd = phone ? 14 : 30; i < nd; i++) { var a = rand(0, TAU), v = rand(14, 42); add(px + Math.cos(a) * 16, py + Math.sin(a) * 10, Math.cos(a) * v, Math.sin(a) * v * .72 - rand(0, 3), rand(12, 28), rand(1500, 2600)); }
          for (i = 0; i < (phone ? 8 : 16); i++) { var d = i % 2 ? 1 : -1; add(px + d * rand(0, 50), floor - rand(0, 14), d * rand(10, 30), -rand(1, 4), rand(12, 26), rand(1800, 3200)); }
        }
        while (ei < events.length && events[ei].t - off <= t) { var e = events[ei++], n = 1 + Math.round(Math.min(3, e.m / 1.5)); for (i = 0; i < n; i++) add(e.x + rand(-12, 12) * e.m, e.y + rand(-4, 4), rand(-1, 1) * (4 + e.m * 2), -rand(.8, 2.6) - e.v / 500, (6 + e.m * 4) * rand(.7, 1.3), rand(1100, 2200)); }
        puffs = puffs.filter(function (p) {
          p.age += T; if (p.age > p.life) return false;
          p.x += p.vx; p.y += p.vy; p.vx *= .87; p.vy = p.vy * .87 + .12; p.r += p.g; p.g *= .93;
          var u = p.age / p.life; p.a = u < .15 ? u / .15 : 1 - (u - .15) / .85;
          return true;
        });
      }
      /* three tones: a dark outline, the body, and a highlight on the side facing the strike's
         light while it lasts, then from above */
      var lit = Math.max(0, 1 - t / 1400), hr = Math.round(120 + (128 - 120) * (1 - lit)), hg = Math.round(150 + (120 - 150) * (1 - lit)), hb = Math.round(200 + (112 - 200) * (1 - lit));
      c.globalCompositeOperation = 'source-over';
      puffs.forEach(function (p) {
        var a = p.a * gone;
        c.fillStyle = 'rgba(22,18,18,' + (a * .5).toFixed(3) + ')'; clump(c, p, 0, 0, 1, 1.5);
        c.fillStyle = 'rgba(72,66,62,' + (a * .52).toFixed(3) + ')'; clump(c, p, 0, 0, 1);
        var lx = px - p.x, ly = py - p.y, ll = Math.hypot(lx, ly) || 1, ox = (lx / ll * lit) * p.r * .26, oy = (ly / ll * lit - (1 - lit)) * p.r * .26;
        c.fillStyle = 'rgba(' + hr + ',' + hg + ',' + hb + ',' + (a * (.22 + lit * .15)).toFixed(3) + ')'; clump(c, p, ox, oy, .7);
      });
    });
  }

  /* the scorch where the lightning went in: a burnt, sooty disc with glowing fissures that
     cool from white through orange to a dull red over a few seconds, then keep a faint ember
     pulse for as long as the page lies in ruins */
  function scorch(px, py) {
    if (reduce) return;
    var fis = [], n = phone ? 6 : 9, R = phone ? 46 : 68;
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU + rand(-.3, .3), l = rand(R * .5, R * 1.3), x = px, y = py, pts = [[x, y]];
      for (var k = 0; k < 4; k++) { a += rand(-.5, .5); x += Math.cos(a) * l / 4; y += Math.sin(a) * l / 4; pts.push([x, y]); }
      fis.push(pts);
    }
    var spr = sprite('255,150,60'), sprB = sprite('90,160,255');
    layer(function (c, t) {
      if (!ruin) return false;
      /* when the Monarch starts raising the page, the scorch fades under his darkness */
      var gone = ruin.rising ? Math.max(0, 1 - (t - (ruin.riseT || (ruin.riseT = t))) / 500) : 1;
      if (gone <= 0) return false;
      var heat = Math.max(0, 1 - t / 4200), k = heat * heat, pulse = .1 + Math.sin(t / 260) * .05;
      c.globalCompositeOperation = 'source-over';
      var g = c.createRadialGradient(px, py, 0, px, py, R);
      g.addColorStop(0, 'rgba(12,8,8,.72)'); g.addColorStop(.55, 'rgba(16,10,8,.42)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.globalAlpha = Math.min(1, t / 120) * gone; c.beginPath(); c.arc(px, py, R, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter';
      blob(c, sprB, px, py, R * (.8 + k * 1.2), k * .3 * gone);
      blob(c, spr, px, py, R * (.6 + k), (k * .8 + pulse * (1 - heat)) * gone);
      c.strokeStyle = heat > .6 ? '#ffffff' : heat > .3 ? '#ffb060' : '#c04a1c'; c.lineWidth = .8 + heat * 1.6; c.lineCap = 'round'; c.lineJoin = 'round';
      c.globalAlpha = (.18 + heat * .82 + (1 - heat) * pulse) * gone;
      c.beginPath();
      fis.forEach(function (p) { c.moveTo(p[0][0], p[0][1]); for (var j = 1; j < p.length; j++) c.lineTo(p[j][0], p[j][1]); });
      c.stroke();
      c.globalAlpha = 1;
    });
  }

  /* the flight of one piece of the page, simulated on the cel clock: an impulse away from the
     hit that falls off with distance and with the piece's mass (a heavy block barely shifts, a
     word flies), gravity, a pop toward the camera, tumbling that resolves into a resting tilt
     as it lands, one skip off the rubble line, a slide, rest. Returns stepped keyframes (each
     drawing held until the next, a smear on the fastest ones), the resting pose and where and
     when it lands, for the dust */
  function fling(r, px, py, w, h) {
    var cx0 = r.left + r.width / 2, cy0 = r.top + r.height / 2;
    var dx = cx0 - px, dy = cy0 - py, d = Math.max(30, Math.hypot(dx, dy)), ux = dx / d, uy = dy / d;
    var area = r.width * r.height, big = area > w * h * .08, m = Math.max(.6, Math.min(6, Math.sqrt(area) / 60));
    var sp = Math.min(2200, (700 + 260000 / (d + 120)) / Math.pow(m, .7)) * rand(.8, 1.15);
    var vx = ux * sp + rand(-120, 120), vy = uy * sp * .75 - (200 + 380 / Math.sqrt(m)) * rand(.6, 1.2);
    var wz = rand(90, 520) / m * (Math.random() < .5 ? -1 : 1) * (big ? .25 : 1);
    var tilt = big ? 22 : 75, rxE = rand(-tilt, tilt), ryE = rand(-tilt, tilt), zE = rand(-220, 60), zPeak = rand(120, 420) / Math.sqrt(m);
    var TX = big ? 10 : rand(30, 90) / Math.sqrt(m), TY = big ? 8 : rand(30, 90) / Math.sqrt(m), ox = rand(4, 9), oy = rand(4, 9), phx = rand(0, TAU), phy = rand(0, TAU);
    /* the pile along the bottom of the screen: where its top comes to rest */
    var floorY = Math.max(0, h - r.height * rand(.25, .75) - rand(0, h * (big ? .1 : .3)) - r.top);
    var minX = -r.width * .5 - r.left, maxX = w - r.width * .4 - r.left;
    var x = 0, y = 0, rz = 0, t = 0, DT = CEL / 1000, G = 2600, bounces = 0, rest = false, tL = -1, land = null, path = [];
    for (var i = 1; i <= 62 && !rest; i++) {
      t = i * DT;
      vy += G * DT; vx *= .995;
      x += vx * DT; y += vy * DT; rz += wz * DT;
      if (x < minX) { x = minX; vx = -vx * .3; wz *= -.5; }
      if (x > maxX) { x = maxX; vx = -vx * .3; wz *= -.5; }
      if (y >= floorY && vy >= 0) {
        y = floorY;
        if (tL < 0) { tL = t; land = { t: t, x: cx0 + x, y: cy0 + y, m: m, v: vy }; }
        if (vy > 260 && bounces < 2) { vy = -vy * rand(.18, .32); vx *= .55; wz *= -.35; bounces++; }
        else { vy = 0; vx *= .5; wz *= .45; if (Math.abs(vx) < 25 && Math.abs(wz) < 20) rest = true; }
      }
      path.push({ t: t, x: x, y: y, rz: rz, sp: Math.hypot(vx, vy), ang: Math.atan2(vy, vx) });
    }
    if (tL < 0) tL = t;
    var dur = Math.round(t * 1000) + CEL, kf = [{ transform: tf(Z0), easing: 'steps(1, end)', offset: 0 }], v = null;
    path.forEach(function (q) {
      var u = Math.min(1, q.t / tL), s = u * u * (3 - 2 * u);
      v = { x: q.x, y: q.y, z: zE * s + zPeak * Math.sin(Math.PI * u), rx: rxE * s + TX * Math.sin(ox * q.t + phx) * (1 - s), ry: ryE * s + TY * Math.sin(oy * q.t + phy) * (1 - s), rz: q.rz };
      var sm = q.sp > 900 ? Math.min(.7, (q.sp - 900) / 2200) : 0, a = q.ang * 180 / Math.PI;
      kf.push({ transform: sm ? tfSmear(v, a, sm) : tf(v), easing: 'steps(1, end)', offset: q.t * 1000 / dur });
    });
    return { kf: kf, v: v, dur: dur, d: d, land: land };
  }
  /* tf() with a stretch along the direction of travel, applied in screen space */
  function tfSmear(v, ang, s) {
    return 'perspective(900px) translate3d(' + v.x.toFixed(0) + 'px,' + v.y.toFixed(0) + 'px,' + v.z.toFixed(0) + 'px) rotate(' + ang.toFixed(1) + 'deg) scale(' + (1 + s).toFixed(3) + ',' + (1 - s * .35).toFixed(3) + ') rotate(' + (-ang).toFixed(1) + 'deg) rotateX(' + v.rx.toFixed(1) + 'deg) rotateY(' + v.ry.toFixed(1) + 'deg) rotateZ(' + v.rz.toFixed(1) + 'deg) scale(1)';
  }

  /* the page bursts, each piece on its own simulated flight, the burst reaching the far
     pieces a little later; the strike's light flares on the pieces nearest the hit, then
     they all darken as they fall into the ruin's shadow */
  function shatter(px, py, burst) {
    var w = vw(), h = vh(), list = pieces(phone ? 110 : 260), anims = [], landings = [];
    list.forEach(function (p) {
      var r = p.r, a, end, vSettle, delay;
      if (reduce) { vSettle = Z0; end = tf(Z0); a = p.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'both' }); }
      else {
        var f = fling(r, px, py, w, h), kf = f.kf, endFilter = 'brightness(.5) saturate(.4)';
        vSettle = f.v; end = tf(vSettle);
        delay = burst + Math.min(140, f.d / 10) + rand(0, 40);
        kf.push({ transform: end, offset: 1 });
        if (!phone) {
          kf.push({ filter: 'brightness(1) saturate(1)', offset: 0 });
          kf.push({ filter: 'brightness(' + (1.25 + 90 / (f.d + 80)).toFixed(2) + ') saturate(.85)', offset: CEL / f.dur });
          kf.push({ filter: 'brightness(1.05) saturate(1)', offset: Math.min(.35, 260 / f.dur) });
          kf.push({ filter: endFilter, offset: 1 });
          kf.sort(function (x, y) { return x.offset - y.offset; });
        }
        a = p.el.animate(kf, { duration: f.dur, delay: delay, fill: 'both' });
        if (f.land) landings.push({ t: delay + f.land.t * 1000, x: f.land.x, y: f.land.y, m: f.land.m, v: f.land.v });
      }
      anims.push({ el: p.el, a: a, end: end, v: vSettle, top: r.top, r: r });
    });
    ruin = { anims: anims, px: px, py: py };
    root.classList.add('pw-destroyed');
    later(1900, function () { ruinScene(px, py); });
    return landings;
  }

  function ruinScene(px, py) {
    var cta = el('div', 'pw-ruin-cta',
      '<span class="k">千鳥 · the page was destroyed</span>' +
      '<p>Everything here is rubble. Only the Shadow Monarch can bring it back.</p>' +
      '<button type="button" class="pw-arise-btn">ARISE<small>起きろ · raise it again</small></button>' +
      '<span class="pw-hint">or press Esc</span>');
    cta.setAttribute('role', 'dialog'); cta.setAttribute('aria-label', 'The page was destroyed');
    document.body.appendChild(cta); on(cta);
    cta.querySelector('button').addEventListener('click', arise);
    setTimeout(function () { try { cta.querySelector('button').focus({ preventScroll: true }); } catch (e) {} }, 400);
    ruin.cta = cta;
    embers();
    setBusy(false); paint();
  }

  /* smoke, embers and leftover crackle while the page lies in ruins */
  function embers() {
    var list = [], n = phone ? 28 : 64;
    var zap = flicker(function () { var a = rand(0, TAU), l = rand(50, 140); return makeBolt(ruin.px, ruin.py, ruin.px + Math.cos(a) * l, ruin.py + Math.sin(a) * l, 1, 1, .1); }, 90);
    function newEmber(any) { return { x: rand(0, vw()), y: any ? rand(0, vh()) : vh() + 10, v: rand(.3, 1.3), s: rand(1, 3), w: rand(0, 6), blue: Math.random() < .35 }; }
    for (var i = 0; i < n; i++) list.push(newEmber(true));
    var zapping = 0;
    layer(function (c, t, now) {
      if (!ruin || ruin.rising) return false;
      c.globalCompositeOperation = 'lighter';
      list.forEach(function (e, i) {
        e.y -= e.v; e.x += Math.sin(t / 700 + e.w) * .5;
        if (e.y < -10) list[i] = newEmber(false);
        c.globalAlpha = .5 + Math.sin(t / 200 + e.w) * .3;
        c.fillStyle = e.blue ? '#7cc4ff' : '#ff8a3a';
        c.fillRect(e.x, e.y, e.s, e.s);
      });
      if (!reduce) {
        if (now > zapping && Math.random() < .02) zapping = now + rand(120, 300);
        if (now < zapping) drawBolt(c, zap(now), '#5fb4ff', .8);
      }
    });
  }

  /* ==================================================================
     起きろ ARISE — darkness, the word, shadow soldiers rise from the
     ground, and the rubble rises with them back into place
     ================================================================== */

  /* ---------- cel shading: three flat tones and a hard-edged step ----------
     The Monarch and the knights are drawn like anime cels: an ink-black fill,
     one violet mid-tone where the seal's light catches the form, a thin white
     rim on the lit edge, a thick outline, and a hard ground shadow cast away
     from the seal. There are no gradients: the mid-tone is the shape minus
     itself pushed away from the light, so the terminator wraps round every
     curve like a painted one. Figures further back are mixed toward the fog. */
  var TONE = { ink: [5, 2, 12], mid: [82, 42, 190], rim: [240, 232, 255], line: [0, 0, 0], fog: [70, 44, 120] };
  function mixc(a, b, k) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')'; }
  function tones(dim) { var k = 1 - dim; return { ink: mixc(TONE.ink, TONE.fog, k * .8), mid: mixc(TONE.mid, TONE.fog, k * .7), rim: mixc(TONE.rim, TONE.fog, k * .9), line: mixc(TONE.line, TONE.fog, k * .6) }; }
  /* paint one part of a figure: path(c) traces it in screen pixels, (lx, ly)
     points at the light, band is the width of the mid-tone step, ow the
     outline; lod 0 = full, 1 = no rim, 2 = flat ink (the far ranks) */
  function paintCel(c, path, lx, ly, tn, band, ow, lod) {
    c.beginPath(); path(c);
    if (lod >= 2) { c.fillStyle = tn.ink; c.fill(); }
    else {
      c.save(); c.clip();
      var rim = ow * .5 + 2, mid = ow * .5 + band;
      c.fillStyle = lod ? tn.mid : tn.rim; c.fill();
      if (!lod) { c.translate(-lx * rim, -ly * rim); c.fillStyle = tn.mid; c.beginPath(); path(c); c.fill(); c.translate(lx * rim, ly * rim); }
      c.translate(-lx * mid, -ly * mid); c.fillStyle = tn.ink; c.beginPath(); path(c); c.fill();
      c.restore();
    }
    c.beginPath(); path(c);
    c.lineWidth = ow; c.strokeStyle = tn.line; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
  }
  /* a scratch canvas the size of the effect canvas: figures are drawn on to it
     opaque, then composited once with alpha, so overlapping parts never show
     through each other while a figure fades or casts its shadow */
  var celBuf = null, celBx = null;
  function celBuffer() {
    if (!celBuf) { celBuf = document.createElement('canvas'); celBx = celBuf.getContext('2d'); }
    if (celBuf.width !== cv.width || celBuf.height !== cv.height) { celBuf.width = cv.width; celBuf.height = cv.height; }
    celBx.setTransform(DPR, 0, 0, DPR, 0, 0); celBx.clearRect(0, 0, W, H);
    return celBx;
  }
  function composite(c, alpha) { if (alpha <= 0) return; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = Math.min(1, alpha); c.drawImage(celBuf, 0, 0); c.restore(); }
  /* path builders in figure space: units of the figure's size, feet at the
     origin, y up; polyPath turns them into pixels */
  function capsule(a, b, wa, wb) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, ex = dx / l * .04, ey = dy / l * .04;
    return [[a[0] - ex + nx * wa, a[1] - ey + ny * wa], [b[0] + ex + nx * wb, b[1] + ey + ny * wb], [b[0] + ex - nx * wb, b[1] + ey - ny * wb], [a[0] - ex - nx * wa, a[1] - ey - ny * wa]];
  }
  function polyPath(pts, S) { return function (c) { for (var i = 0; i < pts.length; i++) { if (i) c.lineTo(pts[i][0] * S, -pts[i][1] * S); else c.moveTo(pts[i][0] * S, -pts[i][1] * S); } c.closePath(); }; }
  function discPath(x, y, r, S) { return function (c) { c.moveTo((x + r) * S, -y * S); c.arc(x * S, -y * S, r * S, 0, TAU); c.closePath(); }; }
  function lerpPose(a, b, k, out) { for (var key in b) out[key] = a[key] + (b[key] - a[key]) * k; return out; }
  var EASE = {
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    inq: function (t) { return t * t; },
    back: function (t) { var s = 1.35; t -= 1; return 1 + t * t * ((s + 1) * t + s); },
    land: function (t) { return t < .7 ? 1.06 * (1 - Math.pow(1 - t / .7, 3)) : 1.06 - .06 * ((t - .7) / .3); }
  };
  /* the pose rig: a figure holds its current pose and a queue of changes, each
     with its own start, length and ease; a change starts from whatever the
     blend is at that moment, so an interruption never pops. Key drawings,
     with the in-betweens computed. */
  function rig(pose) {
    var cur = {}, from = {}, to = null, t0 = 0, dur = 1, ease = EASE.out, queue = [];
    for (var k in pose) cur[k] = from[k] = pose[k];
    return {
      pose: cur,
      to: function (p, at, ms, e) { queue.push({ p: p, at: at, ms: ms, e: e || EASE.out }); },
      step: function (now) {
        queue.sort(function (a, b) { return a.at - b.at; });
        while (queue.length && queue[0].at <= now) { var q = queue.shift(); for (var k2 in cur) from[k2] = cur[k2]; to = q.p; t0 = q.at; dur = q.ms; ease = q.e; }
        if (to) lerpPose(from, to, ease(Math.min(1, (now - t0) / dur)), cur);
        return cur;
      }
    };
  }
  /* draws a figure's parts, back to front, at s.x / s.base (sunk by s.sink
     while it comes out of the ground, scaled by s.sx / s.sy on a smear or squash drawing) */
  function drawFigure(c, s, parts, lx, ly, tn, lod) {
    var S = s.size, ow = Math.max(1.5, S * .018), band = S * .13;
    c.save(); c.translate(s.x, s.base + (s.sink || 0)); c.scale(s.sx || 1, s.sy || 1);
    parts.forEach(function (pt) {
      if (pt[1] === 'cel') paintCel(c, pt[0], lx, ly, tn, band * pt[2], ow, lod);
      else if (pt[1] === 'ink') { c.beginPath(); pt[0](c); c.fillStyle = tn.ink; c.fill(); c.lineWidth = ow; c.strokeStyle = tn.line; c.lineJoin = 'round'; c.stroke(); }
      else if (pt[1] === 'hole') { c.beginPath(); pt[0](c); c.fillStyle = tn.ink; c.fill(); }
      else if (pt[1] === 'edge') { if (lod < 2) { c.beginPath(); pt[0](c); c.lineWidth = ow * .6; c.strokeStyle = tn.mid; c.lineJoin = 'round'; c.stroke(); } }
      else if (lod < 2) { c.beginPath(); pt[0](c); c.lineWidth = ow * .7; c.strokeStyle = tn.line; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
    });
    c.restore();
  }
  /* the figure's silhouette flattened on to the ground and sheared away from
     the seal: a hard cast shadow, drawn into the buffer so parts never stack */
  function castShadow(b, s, parts, w) {
    var k = (s.x - w / 2) / (w / 2);
    b.save(); b.translate(s.x, s.base); b.transform(s.sx || 1, 0, -k * .9, .14 * (s.sy || 1), 0, 0); b.translate(0, s.sink || 0);
    b.fillStyle = '#000';
    parts.forEach(function (pt) { if (pt[1] !== 'line') { b.beginPath(); pt[0](b); b.fill(); } });
    b.restore();
    b.beginPath(); b.ellipse(s.x, s.base, s.size * .5, s.size * .06, 0, 0, TAU); b.fill();
  }
  /* which way the seal's light falls on a figure: from the seal's centre,
     which sits low in the middle of the screen, up at the figure's chest */
  function sealLight(s, chestY) {
    var dx = vw() / 2 - s.x, dy = s.base + 40 - (s.base - chestY * s.size), l = Math.hypot(dx, dy) || 1;
    return [dx / l, dy / l];
  }

  /* ---------- the knight: pose keyframes ----------
     Joints in units of the knight's size, feet at the origin, y up: hips h,
     knees kl/kr, feet fl/fr, chest c, neck n, head hd, shoulders sl/sr,
     elbows el/er, hands hl/hr; bow = head pitch, shrug, spread and flare for
     the cloak, sw = where the greatsword stands, grip/gripR = a hand on it. */
  var KP = {
    stand: { hx: 0, hy: 1, klx: .17, kly: .5, flx: .2, fly: 0, krx: -.17, kry: .5, frx: -.22, fry: 0, cx: 0, cy: 1.5, nx: 0, ny: 1.82, hdx: 0, hdy: 2.06, bow: 0, slx: .4, sly: 1.74, srx: -.4, sry: 1.74, shrug: .05, elx: .5, ely: 1.34, hlx: .5, hly: .98, erx: -.5, ery: 1.34, hrx: -.5, hry: .98, spread: 1, flare: 0, swx: .3, swy: 0, grip: 1, gripR: 1 },
    rise: { hx: 0, hy: .78, klx: .3, kly: .4, flx: .34, fly: 0, krx: -.3, kry: .4, frx: -.36, fry: 0, cx: 0, cy: 1.22, nx: 0, ny: 1.52, hdx: 0, hdy: 1.72, bow: .9, slx: .42, sly: 1.44, srx: -.42, sry: 1.44, shrug: .8, elx: .58, ely: 1.08, hlx: .5, hly: .72, erx: -.58, ery: 1.08, hrx: -.5, hry: .72, spread: 1.35, flare: 1, swx: .3, swy: 0, grip: 0, gripR: 0 },
    brace: { hx: 0, hy: .82, klx: .33, kly: .43, flx: .42, fly: 0, krx: -.33, kry: .43, frx: -.44, fry: 0, cx: 0, cy: 1.3, nx: 0, ny: 1.62, hdx: 0, hdy: 1.84, bow: .35, slx: .45, sly: 1.54, srx: -.45, sry: 1.54, shrug: .5, elx: .74, ely: 1.32, hlx: .94, hly: 1.08, erx: -.74, ery: 1.32, hrx: -.94, hry: 1.08, spread: 1.45, flare: 1, swx: .3, swy: 0, grip: 0, gripR: 0 },
    saluteAnt: { hx: 0, hy: .94, klx: .2, kly: .47, flx: .24, fly: 0, krx: -.2, kry: .47, frx: -.26, fry: 0, cx: 0, cy: 1.43, nx: 0, ny: 1.74, hdx: 0, hdy: 1.97, bow: .2, slx: .41, sly: 1.66, srx: -.41, sry: 1.66, shrug: .3, elx: .5, ely: 1.28, hlx: .48, hly: .92, erx: -.54, ery: 1.24, hrx: -.56, hry: .88, spread: 1.1, flare: .2, swx: .3, swy: 0, grip: 1, gripR: 0 },
    salute: { hx: 0, hy: 1.02, klx: .17, kly: .51, flx: .2, fly: 0, krx: -.17, kry: .51, frx: -.22, fry: 0, cx: 0, cy: 1.53, nx: 0, ny: 1.86, hdx: 0, hdy: 2.1, bow: -.15, slx: .42, sly: 1.77, srx: -.42, sry: 1.77, shrug: .2, elx: .47, ely: 1.36, hlx: .47, hly: .98, erx: -.66, ery: 1.52, hrx: -.1, hry: 1.5, spread: 1.05, flare: .3, swx: .34, swy: .3, grip: 1, gripR: 0 },
    kneelAnt: { hx: 0, hy: 1.05, klx: .16, kly: .53, flx: .19, fly: 0, krx: -.16, kry: .53, frx: -.21, fry: 0, cx: 0, cy: 1.55, nx: 0, ny: 1.88, hdx: 0, hdy: 2.12, bow: -.05, slx: .41, sly: 1.8, srx: -.41, sry: 1.8, shrug: .35, elx: .5, ely: 1.4, hlx: .5, hly: 1.04, erx: -.5, ery: 1.4, hrx: -.5, hry: 1.04, spread: 1.1, flare: .4, swx: .32, swy: 0, grip: 1, gripR: 1 },
    kneel: { hx: -.05, hy: .56, klx: .36, kly: .56, flx: .44, fly: 0, krx: -.22, kry: .03, frx: -.64, fry: .04, cx: .04, cy: 1, nx: .07, ny: 1.3, hdx: .1, hdy: 1.5, bow: .75, slx: .46, sly: 1.24, srx: -.32, sry: 1.24, shrug: .1, elx: .68, ely: .96, hlx: .52, hly: .64, erx: -.38, ery: .78, hrx: -.3, hry: .06, spread: 1.15, flare: .15, swx: .36, swy: 0, grip: 1, gripR: 1 }
  };
  /* every part of a knight in its pose, back to front, as [path, kind];
     kind: 'cel' shaded, 'ink' flat with an outline, 'line' drawn on top */
  function knightParts(s, t, p) {
    var S = s.size, ph = s.ph, parts = [], k, hl = [p.hlx, p.hly], hr = [p.hrx, p.hry], el = [p.elx, p.ely], er = [p.erx, p.ery];
    var sw = [p.swx, p.swy], pom = [sw[0], sw[1] + 1.37];
    function add(fn, kind, bs) { parts.push([fn, kind, bs || 1]); }
    if (s.sword) {
      /* a hand on the greatsword's pommel pulls that arm with it */
      if (p.grip > 0) { hl = [hl[0] + (pom[0] - .05 - hl[0]) * p.grip, hl[1] + (pom[1] - .06 - hl[1]) * p.grip]; el = [el[0] + ((p.slx + hl[0]) / 2 + .16 - el[0]) * p.grip, el[1] + ((p.sly + hl[1]) / 2 - .02 - el[1]) * p.grip]; }
      if (p.gripR > 0) { hr = [hr[0] + (pom[0] + .06 - hr[0]) * p.gripR, hr[1] + (pom[1] - .16 - hr[1]) * p.gripR]; er = [er[0] + ((p.srx + hr[0]) / 2 - .14 - er[0]) * p.gripR, er[1] + ((p.sry + hr[1]) / 2 - .04 - er[1]) * p.gripR]; }
    }
    /* the cloak: hangs from the shoulders, its ragged hem swaying in the seal's draught */
    var cl = [[p.slx - .04, p.sly + .04], [p.slx + .16 * p.spread + .1 * p.flare, p.sly - .5], [p.hx + .5 * p.spread + .18 * p.flare, .5 + .2 * p.flare]];
    for (k = 0; k <= 6; k++) cl.push([p.hx + (.55 - k / 6 * 1.1) * p.spread + Math.sin(t / 160 + k * 1.3 + ph) * .05, (k % 2 ? .02 : .13) + Math.abs(k - 3) / 3 * .2 * p.flare]);
    cl.push([p.hx - .5 * p.spread - .18 * p.flare, .5 + .2 * p.flare], [p.srx - .16 * p.spread - .1 * p.flare, p.sry - .5], [p.srx + .04, p.sry + .04]);
    add(polyPath(cl, S), 'cel', 1.3);
    /* legs: thigh, shin, foot */
    var hipL = [p.hx + .1, p.hy - .02], hipR = [p.hx - .1, p.hy - .02], kl = [p.klx, p.kly], kr = [p.krx, p.kry], fl = [p.flx, p.fly], fr = [p.frx, p.fry];
    add(polyPath(capsule(hipR, kr, .19, .15), S), 'cel', .55); add(polyPath(capsule(kr, fr, .15, .11), S), 'cel', .45);
    add(polyPath([[fr[0] + .12, fr[1] + .02], [fr[0] - .16, fr[1] + .02], [fr[0] - .14, fr[1] + .14], [fr[0] + .1, fr[1] + .16]], S), 'ink');
    add(polyPath(capsule(hipL, kl, .19, .15), S), 'cel', .55); add(polyPath(capsule(kl, fl, .15, .11), S), 'cel', .45);
    add(polyPath([[fl[0] - .12, fl[1] + .02], [fl[0] + .16, fl[1] + .02], [fl[0] + .14, fl[1] + .14], [fl[0] - .1, fl[1] + .16]], S), 'ink');
    /* torso, the chest plate and the belt */
    add(polyPath([[p.hx - .25, p.hy - .04], [p.hx + .25, p.hy - .04], [p.hx + .22, p.hy + .14], [p.cx + .32, p.cy], [p.slx - .02, p.sly + .02], [p.srx + .02, p.sry + .02], [p.cx - .32, p.cy], [p.hx - .22, p.hy + .14]], S), 'cel');
    add(function (c) { c.moveTo((p.cx - .2) * S, -(p.cy + .1) * S); c.lineTo(p.cx * S, -(p.cy - .08) * S); c.lineTo((p.cx + .2) * S, -(p.cy + .1) * S); }, 'line');
    add(function (c) { c.moveTo((p.hx - .22) * S, -(p.hy + .1) * S); c.lineTo((p.hx + .22) * S, -(p.hy + .1) * S); }, 'line');
    /* the greatsword, planted or raised, behind the hands that hold it */
    if (s.sword) {
      add(polyPath([[sw[0] - .035, sw[1]], [sw[0] + .035, sw[1]], [sw[0] + .05, sw[1] + 1.05], [sw[0] - .05, sw[1] + 1.05]], S), 'cel', .3);
      add(function (c) { c.moveTo(sw[0] * S, -(sw[1] + .12) * S); c.lineTo(sw[0] * S, -(sw[1] + .98) * S); }, 'line');
      add(polyPath([[sw[0] - .18, sw[1] + 1.04], [sw[0] + .18, sw[1] + 1.04], [sw[0] + .14, sw[1] + 1.12], [sw[0] - .14, sw[1] + 1.12]], S), 'cel', .4);
      add(polyPath(capsule([sw[0], sw[1] + 1.1], [sw[0], sw[1] + 1.33], .05, .045), S), 'cel', .3);
      add(discPath(pom[0], pom[1], .06, S), 'cel', .4);
    }
    /* arms: the left, then the right in front of it (it salutes) */
    add(polyPath(capsule([p.slx, p.sly - .04], el, .16, .12), S), 'cel', .5); add(polyPath(capsule(el, hl, .12, .1), S), 'cel', .4); add(discPath(hl[0], hl[1], .085, S), 'cel', .45);
    add(polyPath(capsule([p.srx, p.sry - .04], er, .16, .12), S), 'cel', .5); add(polyPath(capsule(er, hr, .12, .1), S), 'cel', .4); add(discPath(hr[0], hr[1], .085, S), 'cel', .45);
    /* spiked pauldrons */
    var sh = p.shrug;
    add(polyPath([[p.slx - .28, p.sly + .06 + sh * .05], [p.slx + .02, p.sly + .22 + sh * .08], [p.slx + .12, p.sly + .06], [p.slx + .25, p.sly + .3 + sh * .1], [p.slx + .3, p.sly + .02], [p.slx + .44, p.sly + .12], [p.slx + .3, p.sly - .15], [p.slx - .05, p.sly - .17]], S), 'cel', .75);
    add(polyPath([[p.srx + .28, p.sry + .06 + sh * .05], [p.srx - .02, p.sry + .22 + sh * .08], [p.srx - .12, p.sry + .06], [p.srx - .25, p.sry + .3 + sh * .1], [p.srx - .3, p.sry + .02], [p.srx - .44, p.sry + .12], [p.srx - .3, p.sry - .15], [p.srx + .05, p.sry - .17]], S), 'cel', .75);
    /* the horned helmet; a bow tips it forward and drops the horns */
    var hx = p.hdx + p.bow * .04, hy = p.hdy - p.bow * .05, hb = p.bow * .15;
    add(function (c) {
      c.moveTo((hx - .19) * S, -(hy - .18) * S); c.lineTo((hx - .21) * S, -(hy + .02) * S);
      c.quadraticCurveTo((hx - .36) * S, -(hy + .18) * S, (hx - .3) * S, -(hy + .5 - hb) * S);
      c.quadraticCurveTo((hx - .22) * S, -(hy + .22) * S, (hx - .13) * S, -(hy + .24) * S);
      c.lineTo(hx * S, -(hy + .32 - hb * .5) * S); c.lineTo((hx + .13) * S, -(hy + .24) * S);
      c.quadraticCurveTo((hx + .22) * S, -(hy + .22) * S, (hx + .3) * S, -(hy + .5 - hb) * S);
      c.quadraticCurveTo((hx + .36) * S, -(hy + .18) * S, (hx + .21) * S, -(hy + .02) * S);
      c.lineTo((hx + .19) * S, -(hy - .18) * S); c.lineTo((hx + .1) * S, -(hy - .25) * S); c.lineTo((hx - .1) * S, -(hy - .25) * S); c.closePath();
    }, 'cel', .8);
    add(function (c) { c.moveTo((hx - .17) * S, -(hy - .02 - p.bow * .03) * S); c.lineTo((hx + .17) * S, -(hy - .02 - p.bow * .03) * S); }, 'line');
    s.eyeX = s.x + hx * S * (s.sx || 1); s.eyeY = s.base + (s.sink || 0) - (hy - .02 - p.bow * .03) * S * (s.sy || 1);
    return parts;
  }
  /* burning eyes and their violet halo, added with light on top of the helmet */
  function knightEyes(c, s, t) {
    var S = s.size, eb = s.eye || 1, x = s.eyeX, y = s.eyeY, hr = S * .17;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, s.o * (.85 + Math.sin(t / 90 + s.ph) * .15) * eb);
    c.fillStyle = '#b9f0ff';
    c.beginPath(); c.ellipse(x - hr * .42, y, hr * .3, hr * .07, -.3, 0, TAU); c.ellipse(x + hr * .42, y, hr * .3, hr * .07, .3, 0, TAU); c.fill();
    c.globalAlpha = Math.min(1, s.o * .25 * eb); c.fillStyle = '#7b3fff'; c.beginPath(); c.ellipse(x, y, hr * 1.2 * (1 + (eb - 1) * .5), hr * .5 * (1 + (eb - 1) * .5), 0, 0, TAU); c.fill();
    c.restore();
  }
  /* one knight in its current pose, cel-shaded and lit from the seal */
  function soldier(c, s, parts) {
    var L = sealLight(s, s.pose.cy);
    drawFigure(c, s, parts, L[0], L[1], tones(s.dim), s.lod || 0);
  }


  /* Solo Leveling style System window */
  function sysWindow(title, lines, opt) {
    opt = opt || {};
    var box = el('div', 'pw-sys', '<div class="pw-sys-h"><i aria-hidden="true">!</i><b>' + title + '</b></div>' +
      '<div class="pw-sys-b">' + lines.map(function (l) { return '<p>' + l + '</p>'; }).join('') + '</div>' +
      (opt.bar ? '<div class="pw-sys-bar"><span></span></div><div class="pw-sys-n">0%</div>' : ''));
    box.setAttribute('role', 'status');
    document.body.appendChild(box); on(box);
    box.progress = function (p) {
      var bar = box.querySelector('.pw-sys-bar span'), n = box.querySelector('.pw-sys-n');
      if (bar) bar.style.width = (p * 100).toFixed(0) + '%';
      if (n) n.textContent = (p * 100).toFixed(0) + '%';
    };
    box.close = function (ms) { later(ms || 0, function () { drop(box, 500); }); };
    return box;
  }

  /* souls torn out of each fallen piece: black-violet smoke streams that
     spiral upward, with a bright soul spark at the head of each stream */
  function extractSouls(rects, dur) {
    var streams = [], max = phone ? 40 : 110;
    rects.slice(0, max).forEach(function (r, i) {
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      streams.push({ x: x, y: y, x0: x, y0: y, vy: rand(1.6, 3.4), sw: rand(.02, .05), ph: rand(0, 6), amp: rand(8, 26), at: rand(0, dur * .5), trail: [], smoke: [] });
    });
    layer(function (c, t) {
      if (t > dur + 900) return false;
      var fade = t > dur ? 1 - (t - dur) / 900 : 1;
      streams.forEach(function (s) {
        if (t < s.at) return;
        var lt = t - s.at;
        s.y -= s.vy * (1 + lt / 900); s.x = s.x0 + Math.sin(lt * s.sw * .12 + s.ph) * s.amp * (1 + lt / 700);
        s.trail.push([s.x, s.y]); if (s.trail.length > 18) s.trail.shift();
        if (Math.random() < .5) s.smoke.push({ x: s.x0 + rand(-20, 20), y: s.y0 + rand(-10, 10), r: rand(8, 22), l: 1, v: rand(.6, 1.6) });
        /* smoke boiling off the body */
        s.smoke = s.smoke.filter(function (m) {
          m.y -= m.v; m.r *= 1.02; m.l -= .02;
          c.globalCompositeOperation = 'source-over';
          c.globalAlpha = m.l * .5 * fade; c.fillStyle = '#0b0418';
          c.beginPath(); c.arc(m.x, m.y, m.r, 0, TAU); c.fill();
          return m.l > 0;
        });
        /* the soul stream */
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        for (var i = 1; i < s.trail.length; i++) {
          var k = i / s.trail.length;
          c.globalAlpha = k * .75 * fade; c.strokeStyle = k > .8 ? '#d9c8ff' : '#7b3fff'; c.lineWidth = 1 + k * 3.5;
          c.beginPath(); c.moveTo(s.trail[i - 1][0], s.trail[i - 1][1]); c.lineTo(s.trail[i][0], s.trail[i][1]); c.stroke();
        }
        var g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, 12);
        g.addColorStop(0, 'rgba(235,225,255,' + fade + ')'); g.addColorStop(1, 'rgba(120,60,255,0)');
        c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, 12, 0, TAU); c.fill();
      });
    });
  }

  /* a violet scanline that passes down the screen and wakes everything */
  function awakenSweep(ms) {
    layer(function (c, t) {
      if (t > ms) return false;
      var y = (t / ms) * (vh() + 120) - 60, w = vw();
      c.globalCompositeOperation = 'lighter';
      var g = c.createLinearGradient(0, y - 60, 0, y + 8);
      g.addColorStop(0, 'rgba(120,60,255,0)'); g.addColorStop(.85, 'rgba(150,100,255,.45)'); g.addColorStop(1, 'rgba(230,220,255,.9)');
      c.fillStyle = g; c.fillRect(0, y - 60, w, 68);
      c.fillStyle = '#fff'; c.globalAlpha = .9; c.fillRect(0, y + 6, w, 2);
    });
  }

  /* ==================================================================
     起きろ ARISE — a cinematic shadow extraction, cut to the music.
     Every beat comes from the cue sheet (assets/sfx/marks.json): where
     the word lands inside the voice clip, and the theme's drop, beat
     grid and accents. Without marks it uses the same timings.
       · darkness falls, the System counts the fallen, the seal opens
       · "ARISE": the command lands on the word with impact frames
       · the camera leans in on the word (speed lines on the seal), freezes
         black-and-white on the drop's first hit and kicks out on its second
       · the theme starts as the word ends; souls tear out of the rubble
       · on each hit of the drop a wave of shadow knights erupts
       · the page rebuilds on the beat, bottom to top, fed by soul light
       · the knights salute, a violet sweep wakes the page, they kneel
       · the SHADOW ARMY title card, then it all fades with the music
     Skip (the button or Esc) jumps to the end.
     ================================================================== */
  function mark(name, key, def) {
    var m = window.XR_SFX && window.XR_SFX.marks && window.XR_SFX.marks[name];
    return m && m[key] != null ? m[key] : def;
  }

  /* the cel clock: the Monarch and the knights are drawn on twos and threes,
     like hand-drawn animation, while particles, fog and the camera keep
     running at 60. A drawing is held for 2 frames of 24 (83 ms), every
     fourth one for 3, and a figure's count starts on the beat that spawned
     it, so every new drawing lands on the music. cel(ms) says which drawing
     (0, 1, 2...) is up `ms` after that beat, and when it went up. */
  var CEL = 1000 / 24, HOLDS = [2, 2, 2, 3], CYCLE = 9;
  function cel(ms) {
    if (!(ms > 0)) return { n: 0, at: 0 };
    var f = Math.floor(ms / CEL), c = Math.floor(f / CYCLE), r = f - c * CYCLE, n = 0, at = 0;
    while (n < HOLDS.length - 1 && at + HOLDS[n] <= r) at += HOLDS[n++];
    return { n: c * HOLDS.length + n, at: (c * CYCLE + at) * CEL };
  }
  /* how a figure erupts from the ground, drawing by drawing, as [width,
     height, rise]: smear frames stretched tall and thin that streak up past
     its full height, a squash frame as it lands, then the last pose is held
     hard for HOLD drawings before it starts to breathe (on twos, IDLE ms of
     sway per drawing) */
  var KNIGHT = [[.55, 1.55, .9], [.82, 1.18, 1], [1.1, .92, 1], [1, 1, 1]];
  var LORD = [[.7, 1.3, .5], [.8, 1.22, .82], [.9, 1.08, 1], [1.06, .95, 1], [1, 1, 1]];
  var HOLD = 6, IDLE = 90;
  function pose(seq, d) { return seq[Math.min(d.n, seq.length - 1)]; }
  function idle(seq, d) { return Math.max(0, d.n - (seq.length - 1) - HOLD) * IDLE; }
  /* speed lines under a smear frame, the same ones for as long as the drawing is held */
  function streaks(c, s, n) {
    var rr = seeded((s.ph * 1e4 | 0) + n), i;
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#b28cff'; c.lineCap = 'round';
    for (i = 0; i < 5; i++) {
      var sx = s.x + (rr() - .5) * s.size * 1.1, len = s.size * (1.2 + rr() * 1.4) * (n ? .6 : 1), yb = s.base - rr() * s.size * .3;
      c.globalAlpha = (n ? .25 : .45) * s.o; c.lineWidth = 1 + rr() * 2.5;
      c.beginPath(); c.moveTo(sx, yb); c.lineTo(sx + (rr() - .5) * 8, yb - len); c.stroke();
    }
    c.restore();
  }

  /* the shadow army: a front line of knights that erupt on the drop, and two
     ranks behind them (smaller, dimmer, standing higher up in the fog) that
     rise on the accents; all their eyes pulse with the music. Every knight is
     a cel-shaded figure on a pose rig, drawn on the cel clock: it erupts
     hunched (rise), lands low (brace), snaps upright, salutes with a fist to
     the chest, and goes down on one knee, each change with its anticipation,
     snap and hold, sampled once per drawing so a key reads on a held frame. */
  function legion(cine) {
    var w = vw(), h = vh(), n = phone ? 4 : 8, list = [], ranks = [], kneelT = 0, fade = 1, lyr, i, j;
    for (i = 0; i < n; i++) {
      var slot = (i + .5) / n, off = Math.abs(slot - .5);
      list.push({ x: slot * w + rand(-24, 24), size: rand(.88, 1.1) * (phone ? 96 : 138) * (1.15 - off * .5), base: h + 6, dim: 1, o: 1, ph: rand(0, 6), sword: i % 2 === 1, t0: 0, eye: 1, off: off, lod: 0, rig: rig(KP.rise), pose: KP.rise, dn: -1 });
    }
    list.sort(function (a, b) { return a.off - b.off; });   /* the middle rises first */
    [[phone ? 5 : 10, .62, h - (phone ? 40 : 62), .72], [phone ? 6 : 13, .44, h - (phone ? 72 : 112), .5]].forEach(function (rk, ri) {
      for (j = 0; j < rk[0]; j++) ranks.push({ x: (j + .5) / rk[0] * w + rand(-20, 20), size: rand(.9, 1.08) * (phone ? 96 : 138) * rk[1], base: rk[2], dim: rk[3], o: 0, ph: rand(0, 6), sword: Math.random() < .3, t0: 0, eye: 1, rank: ri, lod: phone ? 2 : 1, rig: rig(KP.rise), pose: KP.rise, dn: -1 });
    });
    var spk = sparkField('150,100,255'), mist = sprite('34,18,64');
    var order = ranks.filter(function (s) { return s.rank === 1; }).concat(ranks.filter(function (s) { return s.rank === 0; }), list);
    function eyeY(s) { return s.eyeY || s.base - s.size * 2.06; }
    /* layer time now: the cel clocks and the pose rigs run on it, so a hit-stop holds them too */
    function lnow() { return Math.max(1, performance.now() - lyr.t0); }
    function up(s, t) { return s.t0 && t >= s.t0; }
    /* the erupt: smear drawings up out of the ground, a squash as it lands
       (the brace), then the snap upright; a knight that rises after the
       kneel was called goes down on one knee as soon as it stands */
    function erupt(s, at) {
      s.t0 = at; s.eye = Math.max(s.eye, 1.8);
      s.rig.to(KP.brace, at + CEL * 2, 1); s.rig.to(KP.stand, at + CEL * 4, 250, EASE.back);
      if (kneelT) { s.rig.to(KP.kneelAnt, at + CEL * 10, 170, EASE.inq); s.rig.to(KP.kneel, at + CEL * 12, 300, EASE.land); }
    }
    lyr = layer(function (c, t, now) {
      if (cine.ending) fade = Math.max(0, fade - .025);
      spk.draw(c); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      var b = celBuffer(), vis = [];
      order.forEach(function (s) {
        if (!up(s, t)) return;
        /* on twos and threes: the pose, the smear and the sway only change with the drawing, never between */
        var d = cel(t - s.t0), p = pose(KNIGHT, d);
        s.o = fade; s.eye = 1 + (s.eye - 1) * .9;
        if (s.dn !== d.n) {
          s.dn = d.n; s.sx = p[0]; s.sy = p[1]; s.sink = (1 - p[2]) * s.size * 2.6;
          s.pose = s.rig.step(s.t0 + d.at); s.parts = knightParts(s, s.t0 + idle(KNIGHT, d), s.pose);
        }
        vis.push(s);
        /* the ground: a hard shadow thrown away from the seal */
        b.save(); if (s.rank != null) { b.beginPath(); b.rect(0, 0, w, s.base + 2); b.clip(); }
        castShadow(b, s, s.parts, w); b.restore();
      });
      composite(c, .5 * fade);
      /* back to front: the far rank, the near rank, then the front line; each
         rank stands in its own mist so its feet vanish into the fog */
      var tgt = fade < 1 ? celBuffer() : c, rk = null;
      vis.forEach(function (s) {
        if (s.rank !== rk) { if (rk != null) rankMist(rk); rk = s.rank; }
        if (s.dn < 2) streaks(tgt, s, s.dn);
        tgt.save(); if (s.rank != null) { tgt.beginPath(); tgt.rect(0, 0, w, s.base + 2); tgt.clip(); }
        soldier(tgt, s, s.parts); tgt.restore();
      });
      if (rk != null) rankMist(rk);
      if (tgt !== c) composite(c, fade);
      vis.forEach(function (s) { knightEyes(c, s, t); });
      function rankMist(ri) {
        var t2 = tgt; t2.save(); t2.globalCompositeOperation = 'source-over';
        ranks.forEach(function (s) { if (s.rank === ri && up(s, t)) { blob(t2, mist, s.x - s.size * .3, s.base + 2, s.size * .55, .55); blob(t2, mist, s.x + s.size * .35, s.base + 6, s.size * .5, .5); } });
        t2.restore();
      }
      if (cine.ending && fade <= 0) return false;
    });
    return {
      spawn: function (wave, waves) {
        var per = Math.ceil(n / waves), now = lnow();
        list.slice(wave * per, wave * per + per).forEach(function (s) {
          erupt(s, now); s.eye = 2.2;
          shockwave(s.x, h, '#9a6bff', s.size * 2.4, 700);
          spk.burst(s.x, h - 4, phone ? 10 : 22, 13, -Math.PI / 2, .9, 3);
          later(480, function () { if (!cine.dead) lensFlare(s.x, eyeY(s), '120,220,255', 800, .4); });
        });
      },
      /* a whole rank rises out of the fog, rippling outward from the middle;
         the ripple is snapped to the cel grid, so the rank changes drawings together */
      rank: function (ri) {
        var now = lnow();
        ranks.forEach(function (s) { if (s.rank === ri) erupt(s, now + Math.round((Math.abs(s.x - w / 2) / w * 700 + rand(0, 120)) / (CEL * 2)) * CEL * 2); });
      },
      pulse: function (k) { list.concat(ranks).forEach(function (s) { s.eye = Math.max(s.eye, k || 1.5); }); },
      /* the salute: a dip, then the right fist snaps to the chest, the middle first */
      salute: function () {
        var now = lnow(); cine.saluteT = performance.now();
        list.forEach(function (s, i) {
          if (!s.t0) return;
          s.eye = 2.8;
          var at = Math.max(now + CEL * 4 + i * CEL * 2, s.t0 + CEL * 8);
          s.rig.to(KP.saluteAnt, at - CEL * 2, 170, EASE.inq); s.rig.to(KP.salute, at, 200, EASE.back);
          later(at - now, function () { if (!cine.dead) lensFlare(s.x, eyeY(s), '140,210,255', 1000, .55); });
        });
        ranks.forEach(function (s) {
          s.eye = 2.4;
          if (!up(s, now)) return;
          var at = Math.max(now + CEL * 6 + Math.round(Math.abs(s.x - w / 2) / w * 5) * CEL * 2 + s.rank * CEL * 3, s.t0 + CEL * 10);
          s.rig.to(KP.saluteAnt, at - CEL * 2, 170, EASE.inq); s.rig.to(KP.salute, at, 200, EASE.back);
        });
      },
      /* the kneel: a breath up, then down hard on one knee, sparks off the ground */
      kneel: function () {
        var now = lnow(); kneelT = now; cine.kneelT = performance.now();
        list.concat(ranks).forEach(function (s) {
          if (!s.t0) return;
          var at = now + CEL * 4 + Math.round(Math.abs(s.x - w / 2) / w * 6) * CEL * 2 + (s.rank == null ? 0 : (s.rank + 1) * CEL * 4);
          if (now < s.t0 + CEL * 10) at = Math.max(at, s.t0 + CEL * 12);   /* still landing: kneel once it stands */
          s.rig.to(KP.kneelAnt, at - CEL * 2, 170, EASE.inq); s.rig.to(KP.kneel, at, 300, EASE.land);
          if (s.rank == null) later(at - now + 180, function () { if (!cine.dead) spk.burst(s.x - s.size * .22, s.base - 6, phone ? 4 : 8, 6, -Math.PI / 2, 1.3, 2); });
        });
      }
    };
  }

  /* ---------- the Shadow Monarch: pose keyframes ----------
     The same joints as a knight, in units of his size; hand = the right hand
     open (1) or a fist (0), spread and flare shape the coat. */
  var MP = {
    stand: { hx: 0, hy: 1.28, klx: .13, kly: .64, flx: .16, fly: 0, krx: -.13, kry: .64, frx: -.18, fry: 0, cx: 0, cy: 1.92, nx: 0, ny: 2.24, hdx: 0, hdy: 2.45, bow: 0, slx: .38, sly: 2.16, srx: -.38, sry: 2.16, shrug: 0, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.46, ery: 1.66, hrx: -.44, hry: 1.2, hand: 0, spread: 1, flare: 0 },
    rise: { hx: 0, hy: 1.12, klx: .16, kly: .56, flx: .18, fly: 0, krx: -.16, kry: .56, frx: -.2, fry: 0, cx: 0, cy: 1.72, nx: 0, ny: 2.02, hdx: 0, hdy: 2.22, bow: .55, slx: .37, sly: 1.95, srx: -.37, sry: 1.95, shrug: .3, elx: .5, ely: 1.46, hlx: .52, hly: 1.02, erx: -.5, ery: 1.46, hrx: -.52, hry: 1.02, hand: 0, spread: 1.45, flare: 1 },
    cmdAnt: { hx: 0, hy: 1.27, klx: .13, kly: .64, flx: .16, fly: 0, krx: -.13, kry: .64, frx: -.18, fry: 0, cx: 0, cy: 1.9, nx: 0, ny: 2.22, hdx: 0, hdy: 2.43, bow: .08, slx: .38, sly: 2.15, srx: -.38, sry: 2.15, shrug: .1, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.5, ery: 1.9, hrx: -.14, hry: 2.02, hand: 0, spread: 1.05, flare: .2 },
    command: { hx: 0, hy: 1.28, klx: .15, kly: .64, flx: .2, fly: 0, krx: -.17, kry: .64, frx: -.24, fry: 0, cx: .02, cy: 1.93, nx: .01, ny: 2.25, hdx: .02, hdy: 2.47, bow: -.06, slx: .38, sly: 2.15, srx: -.4, sry: 2.18, shrug: 0, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.86, ery: 2.16, hrx: -1.3, hry: 1.96, hand: 1, spread: 1.15, flare: .55 },
    salute: { hx: 0, hy: 1.29, klx: .14, kly: .64, flx: .18, fly: 0, krx: -.15, kry: .64, frx: -.21, fry: 0, cx: 0, cy: 1.95, nx: 0, ny: 2.27, hdx: 0, hdy: 2.5, bow: -.18, slx: .38, sly: 2.17, srx: -.4, sry: 2.2, shrug: 0, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.7, ery: 2.5, hrx: -.62, hry: 2.95, hand: 1, spread: 1.1, flare: .7 },
    rest: { hx: 0, hy: 1.28, klx: .13, kly: .64, flx: .16, fly: 0, krx: -.13, kry: .64, frx: -.18, fry: 0, cx: 0, cy: 1.92, nx: 0, ny: 2.24, hdx: 0, hdy: 2.45, bow: -.08, slx: .38, sly: 2.16, srx: -.38, sry: 2.16, shrug: 0, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.46, ery: 1.66, hrx: -.42, hry: 1.18, hand: 0, spread: .95, flare: 0 }
  };
  function monarchParts(s, t, p, push) {
    var S = s.size, parts = [], k, hl = [p.hlx, p.hly], hr = [p.hrx - push * .1 * p.hand, p.hry - push * .02], el = [p.elx, p.ely], er = [p.erx, p.ery];
    function add(fn, kind, bs) { parts.push([fn, kind, bs || 1]); }
    /* the coat behind him: long, its tails streaming */
    var co = [[p.slx + .02, p.sly + .05], [p.slx + .16 * p.spread + .1 * p.flare, p.sly - .45], [p.hx + .6 * p.spread + .2 * p.flare, .55 + .1 * p.flare]];
    for (k = 0; k <= 8; k++) co.push([p.hx + (.72 - k / 8 * 1.44) * p.spread + Math.sin(t / 240 + k * .9) * .06 * (1 + p.flare), (k % 2 ? .01 : .08) + Math.abs(k - 4) / 4 * .22 * p.flare]);
    co.push([p.hx - .6 * p.spread - .2 * p.flare, .55 + .1 * p.flare], [p.srx - .16 * p.spread - .1 * p.flare, p.sry - .45], [p.srx - .02, p.sry + .05]);
    add(polyPath(co, S), 'cel', 1.4);
    /* legs and boots, seen between the coat's front panels */
    var hipL = [p.hx + .11, p.hy - .02], hipR = [p.hx - .11, p.hy - .02], kl = [p.klx, p.kly], kr = [p.krx, p.kry], fl = [p.flx, p.fly], fr = [p.frx, p.fry];
    add(polyPath(capsule(hipR, kr, .2, .16), S), 'cel', .5); add(polyPath(capsule(kr, fr, .16, .13), S), 'cel', .45);
    add(polyPath([[fr[0] + .13, fr[1]], [fr[0] - .17, fr[1]], [fr[0] - .15, fr[1] + .2], [fr[0] + .11, fr[1] + .24]], S), 'ink');
    add(polyPath(capsule(hipL, kl, .2, .16), S), 'cel', .5); add(polyPath(capsule(kl, fl, .16, .13), S), 'cel', .45);
    add(polyPath([[fl[0] - .13, fl[1]], [fl[0] + .17, fl[1]], [fl[0] + .15, fl[1] + .2], [fl[0] - .11, fl[1] + .24]], S), 'ink');
    add(polyPath([[p.hx - .3, p.hy + .06], [p.hx - .04, p.hy + .06], [p.hx - .14 - .04 * p.flare, .02], [p.hx - .5 * p.spread - .12 * p.flare, .02 + .1 * p.flare]], S), 'cel', 1.1);
    add(polyPath([[p.hx + .3, p.hy + .06], [p.hx + .04, p.hy + .06], [p.hx + .14 + .04 * p.flare, .02], [p.hx + .5 * p.spread + .12 * p.flare, .02 + .1 * p.flare]], S), 'cel', 1.1);
    /* the torso: the coat buttoned to the waist, broad at the shoulders */
    add(polyPath([[p.hx - .27, p.hy - .04], [p.hx + .27, p.hy - .04], [p.cx + .31, p.cy], [p.slx + .02, p.sly + .04], [p.srx - .02, p.sry + .04], [p.cx - .31, p.cy]], S), 'cel');
    add(function (c) { c.moveTo(p.cx * S, -(p.cy + .12) * S); c.lineTo(p.hx * S, -(p.hy + .02) * S); }, 'line');
    /* arms; the right one gives the command */
    add(polyPath(capsule([p.slx, p.sly - .05], el, .15, .12), S), 'cel', .5); add(polyPath(capsule(el, hl, .12, .1), S), 'cel', .4); add(discPath(hl[0], hl[1], .085, S), 'cel', .45);
    add(polyPath(capsule([p.srx, p.sry - .05], er, .15, .12), S), 'cel', .5); add(polyPath(capsule(er, hr, .12, .1), S), 'cel', .4);
    if (p.hand > .5) {
      /* the open hand, fingers spread, palm down over the seal */
      var dx = hr[0] - er[0], dy = hr[1] - er[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux, o = (p.hand - .5) * 2;
      add(polyPath([[hr[0] - nx * .1, hr[1] - ny * .1], [hr[0] + nx * .1, hr[1] + ny * .1], [hr[0] + ux * .22 * o + nx * .14, hr[1] + uy * .22 * o + ny * .14], [hr[0] + ux * .3 * o + nx * .03, hr[1] + uy * .3 * o + ny * .03], [hr[0] + ux * .27 * o - nx * .08, hr[1] + uy * .27 * o - ny * .08], [hr[0] + ux * .17 * o - nx * .13, hr[1] + uy * .17 * o - ny * .13]], S), 'cel', .55);
      add(function (c) {
        c.moveTo((hr[0] + ux * .08) * S, -(hr[1] + uy * .08) * S); c.lineTo((hr[0] + ux * .26 * o + nx * .01) * S, -(hr[1] + uy * .26 * o + ny * .01) * S);
        c.moveTo((hr[0] + ux * .1 + nx * .06) * S, -(hr[1] + uy * .1 + ny * .06) * S); c.lineTo((hr[0] + ux * .21 * o + nx * .08) * S, -(hr[1] + uy * .21 * o + ny * .08) * S);
      }, 'line');
    } else add(discPath(hr[0], hr[1], .085, S), 'cel', .45);
    /* the high collar */
    add(polyPath([[p.nx - .26, p.ny - .14], [p.nx + .26, p.ny - .14], [p.nx + .3, p.ny + .2], [p.nx + .13, p.ny + .08], [p.nx, p.ny], [p.nx - .13, p.ny + .08], [p.nx - .3, p.ny + .2]], S), 'cel', .8);
    /* the hood, and the face in shadow under it */
    var hx = p.hdx + p.bow * .05, hy = p.hdy - p.bow * .06;
    add(function (c) {
      c.moveTo((hx - .34) * S, -(hy - .3) * S);
      c.quadraticCurveTo((hx - .3) * S, -(hy + .1) * S, (hx - .14) * S, -(hy + .28) * S);
      c.quadraticCurveTo((hx - .02) * S, -(hy + .4) * S, (hx + .03) * S, -(hy + .5) * S);
      c.quadraticCurveTo((hx + .1) * S, -(hy + .36) * S, (hx + .18) * S, -(hy + .26) * S);
      c.quadraticCurveTo((hx + .3) * S, -(hy + .1) * S, (hx + .34) * S, -(hy - .3) * S);
      c.lineTo((hx + .12) * S, -(hy - .34) * S); c.lineTo((hx - .12) * S, -(hy - .34) * S); c.closePath();
    }, 'cel');
    add(polyPath([[hx - .16, hy - .26], [hx + .16, hy - .26], [hx + .13, hy + .06], [hx + .02, hy + .18], [hx - .11, hy + .08]], S), 'hole');
    add(function (c) { c.moveTo((hx - .12) * S, -(hy - .02) * S); c.lineTo((hx - .16) * S, -(hy - .26) * S); c.lineTo((hx + .16) * S, -(hy - .26) * S); c.lineTo((hx + .13) * S, -(hy + .02) * S); }, 'edge');
    s.eyeX = s.x + hx * S * (s.sx || 1); s.eyeY = s.base + (s.sink || 0) - (hy - .01 - p.bow * .03) * S * (s.sy || 1);
    return parts;
  }

  /* the Shadow Monarch: a tall hooded figure who rises from the seal on the
     command, coat streaming, eyes burning, wrapped in a violet-black aura;
     purple lightning crackles around him when the music surges. His poses:
     he straightens as he rises, throws his hand out over the army as the
     drop hits (the cue sheet says when), raises it to the sky for the
     salute, and lowers it to receive the kneel. The army's salute and kneel
     reach him through cine.saluteT / cine.kneelT, which legion() sets. */
  function monarch(cine) {
    var w = vw(), h = vh(), S = phone ? 118 : 172, x0 = w / 2, t0 = 0, rose = 0, fade = 1, fx = [], zap = null, zapT = 0, surge = 0, push = 0, cued = 0, dn = -1, parts = null, lyr;
    var sprV = sprite('140,80,255'), sprD = sprite('6,2,14'), sprE = sprite('175,232,255', true);
    var fig = { x: x0, base: h + 6, size: S, dim: 1, ph: 0, o: 1, lod: 0, pose: MP.rise }, R = rig(MP.rise);
    /* the command lands on the first hit of the drop: by the cue sheet, that long after the word */
    var DROP0 = (mark('arise-voice', 'end', 1.85) - mark('arise-voice', 'word', 1.3) + mark('arise-theme', 'drop', [3.96])[0]) * 1000;
    lyr = layer(function (c, t, now) {
      if (cine.ending) fade = Math.max(0, fade - .025);
      if (cine.ending && fade <= 0) return false;
      if (!t0) return;
      surge *= .94; push *= .88;
      /* the cues, in layer time so a drawing never skips: the command is timed from the word by the
         clock on the wall (a hit-stop between the two must not delay it), the army's salute and
         kneel reach him through cine; the hand goes up to the sky, then down to receive the kneel */
      if (!cued && now >= rose + DROP0 - 260) { cued = 1; R.to(MP.cmdAnt, t, 240, EASE.inq); R.to(MP.command, t + 240, 200, EASE.back); }
      if (cine.saluteT && cued < 2) { cued = 2; R.to(MP.cmdAnt, t, 170, EASE.inq); R.to(MP.salute, t + 170, 220, EASE.back); }
      if (cine.kneelT && cued < 3) { cued = 3; R.to(MP.rest, t + 200, 700); }
      /* on twos and threes from the beat he rose on: smear drawings, a squash, then a hard hold before the coat streams */
      var d = cel(t - t0), p = pose(LORD, d), rise = p[2];
      var H = S * 2.7, top = fig.base - rise * H, x = x0 + Math.sin(t / 1300) * 2;
      fig.o = fade;
      if (dn !== d.n) {
        dn = d.n; fig.x = x; fig.sx = p[0]; fig.sy = p[1]; fig.sink = (1 - rise) * S * 2.9;
        fig.pose = R.step(t0 + d.at); parts = monarchParts(fig, t0 + idle(LORD, d), fig.pose, push);
      }
      /* the aura: violet flames and black smoke boiling up off him */
      for (var k = 0; k < (phone ? 3 : 6); k++) {
        var a = rand(-1, 1);
        fx.push({ x: x + a * S * .45, y: top + H * rand(.1, 1), vx: a * .3, vy: -rand(1.2, 3), s: rand(12, 30), l: 1, dark: Math.random() < .45 });
      }
      fx = fx.filter(function (f) {
        f.x += f.vx + Math.sin(t / 200 + f.s) * .3; f.y += f.vy; f.l -= .022;
        if (f.l <= 0) return false;
        c.globalCompositeOperation = f.dark ? 'source-over' : 'lighter';
        c.save(); c.translate(f.x, f.y); c.scale(.7, 1.5);
        blob(c, f.dark ? sprD : sprV, 0, 0, f.s, (f.dark ? .5 : .35 + surge * .3) * f.l * fade * rise);
        c.restore();
        return true;
      });
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      /* his shadow on the seal, then the figure */
      if (dn < 2) streaks(c, fig, dn);
      castShadow(celBuffer(), fig, parts, w); composite(c, .5 * fade);
      var L = sealLight(fig, fig.pose.cy);
      if (fade < 1) { drawFigure(celBuffer(), fig, parts, L[0], L[1], tones(1), 0); composite(c, fade); }
      else drawFigure(c, fig, parts, L[0], L[1], tones(1), 0);
      /* the eyes */
      c.globalCompositeOperation = 'lighter';
      var hw = S * .11, ey = fig.eyeY, eb = (.8 + Math.sin(t / 110) * .2 + surge) * fade * rise;
      blob(c, sprE, fig.eyeX - hw * .9, ey, hw * .55 * (1 + surge), eb); blob(c, sprE, fig.eyeX + hw * .9, ey, hw * .55 * (1 + surge), eb);
      c.fillStyle = '#e6f6ff'; c.globalAlpha = Math.min(1, eb);
      c.fillRect(fig.eyeX - hw * 1.08, ey - 1, hw * .36, 2); c.fillRect(fig.eyeX + hw * .72, ey - 1, hw * .36, 2);
      /* purple lightning when the music surges: at 60, never held */
      if (surge > .3 && now > zapT) {
        zapT = now + rand(40, 90);
        var za = rand(0, TAU), zy = top + H * rand(.15, .7);
        zap = makeBolt(x + rand(-12, 12), zy, x + Math.cos(za) * S * rand(.6, 1.1), zy + Math.sin(za) * S * .6, 1, 1, .2);
        ion(zap, .7);
      }
      if (zap && surge > .3) drawBolt(c, zap, '#a86bff', Math.min(1, surge));
      c.globalAlpha = 1;
    });
    return {
      rise: function () {
        rose = performance.now(); t0 = Math.max(1, rose - lyr.t0); surge = 1.3;
        R.to(MP.stand, t0 + CEL * 5, 600);
      },
      surge: function (k) { surge = Math.max(surge, k); if (k >= 1.05) { push = 1; dn = -1; } }
    };
  }

  /* the air: shadow tendrils creeping in from the edges, dark ground fog,
     drifting ash and bokeh, beat ripples out from the seal, god rays, embers,
     and soul light flowing up into each piece of the page as it rises */
  function atmosphere(cine) {
    var w = vw(), h = vh(), ash = [], fog = [], flow = [], rings = [], tend = [], fade = 0, i, rayT = 0, retractT = 0;
    for (i = 0; i < (phone ? 50 : 120); i++) ash.push({ x: rand(0, w), y: rand(0, h), v: rand(.2, .9), s: rand(1, 2.6), ph: rand(0, 6), big: Math.random() < .08 });
    for (i = 0; i < (phone ? 6 : 12); i++) fog.push({ x: rand(-100, w + 100), y: h - rand(0, h * .16), r: rand(130, 280), v: rand(-.35, .35) });
    for (i = 0; i < (phone ? 6 : 11); i++) {
      var e = Math.random(), sx0 = e < .5 ? rand(0, w) : (e < .75 ? -10 : w + 10), sy0 = e < .5 ? (Math.random() < .5 ? -10 : h + 10) : rand(0, h);
      var ang = Math.atan2(h * .55 - sy0, w / 2 - sx0) + rand(-.5, .5), pts = [[sx0, sy0]], L = Math.max(w, h) * rand(.28, .42);
      for (var k = 1; k <= 22; k++) { ang += rand(-.28, .28); pts.push([pts[k - 1][0] + Math.cos(ang) * L / 22, pts[k - 1][1] + Math.sin(ang) * L / 22]); }
      tend.push({ p: pts, w: rand(16, 30), ph: rand(0, 6) });
    }
    var sprV = sprite('120,60,255'), sprD = sprite('8,3,18'), sprS = sprite('205,175,255', true), emb = sparkField('180,130,255');
    layer(function (c, t, now) {
      fade = cine.ending ? Math.max(0, fade - .02) : Math.min(1, fade + .02);
      if (cine.ending && fade <= 0) return false;
      /* shadow tendrils: they grow in as the dark falls and pull back when the knights rise */
      var grow = Math.min(1, t / 2600) * (retractT ? Math.max(0, 1 - (now - retractT) / 1400) : 1);
      if (grow > 0) {
        c.globalCompositeOperation = 'source-over'; c.lineCap = 'round'; c.lineJoin = 'round';
        tend.forEach(function (td) {
          var m = Math.max(1, Math.floor(td.p.length * .8 * grow));
          for (var s = 1; s < m; s++) {
            var a0 = td.p[s - 1], a1 = td.p[s], wob = Math.sin(t / 320 + s * .6 + td.ph) * 4;
            c.strokeStyle = 'rgba(4,2,10,.85)'; c.globalAlpha = fade; c.lineWidth = td.w * (1 - s / td.p.length) + 2;
            c.beginPath(); c.moveTo(a0[0], a0[1] + wob); c.lineTo(a1[0], a1[1] + wob); c.stroke();
          }
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(150,90,255,.4)'; c.lineWidth = 1.4; c.beginPath();
          for (var s2 = 0; s2 < m; s2++) { var pp = td.p[s2]; c[s2 ? 'lineTo' : 'moveTo'](pp[0], pp[1] + Math.sin(t / 320 + s2 * .6 + td.ph) * 4); }
          c.stroke(); c.globalCompositeOperation = 'source-over';
        });
      }
      c.globalCompositeOperation = 'source-over';
      fog.forEach(function (f) { f.x += f.v; if (f.x < -320) f.x = w + 320; if (f.x > w + 320) f.x = -320; blob(c, sprD, f.x, f.y, f.r, .6 * fade); });
      c.globalCompositeOperation = 'lighter';
      fog.forEach(function (f) { blob(c, sprV, f.x, f.y + 24, f.r * .8, .1 * fade); });
      /* ripples out across the ground from the seal, on the beat */
      rings = rings.filter(function (rg) {
        /* a ring pushed on a beat timer can be newer than this frame's timestamp: clamp, since
           a negative radius throws in ellipse() and an exception here stops the whole loop */
        var k2 = Math.max(0, (now - rg.t) / 1400);
        if (k2 >= 1) return false;
        var e2 = 1 - Math.pow(1 - k2, 3), rx = e2 * w * .6 + 20;
        c.strokeStyle = 'rgba(170,120,255,1)'; c.globalAlpha = (1 - k2) * .55 * rg.k * fade; c.lineWidth = 2;
        c.beginPath(); c.ellipse(w / 2, h * .985, rx, rx * .16, 0, 0, TAU); c.stroke();
        return true;
      });
      /* god rays when the page wakes */
      if (rayT) {
        var rk = (now - rayT) / 2200;
        if (rk < 1) {
          var env = Math.sin(Math.PI * rk), ox = w / 2, oy = -h * .25;
          for (var ri = 0; ri < 14; ri++) {
            var ra = Math.PI / 2 + (ri / 13 - .5) * 1.3 + Math.sin(now / 1400 + ri) * .03, rw = .018 + (ri % 3) * .01, R = Math.hypot(w, h) * 1.3;
            var gr = c.createLinearGradient(ox, oy, ox + Math.cos(ra) * R, oy + Math.sin(ra) * R);
            gr.addColorStop(0, 'rgba(235,225,255,' + (.34 * env) + ')'); gr.addColorStop(.6, 'rgba(150,100,255,' + (.12 * env) + ')'); gr.addColorStop(1, 'rgba(150,100,255,0)');
            c.globalAlpha = fade; c.fillStyle = gr; c.beginPath(); c.moveTo(ox, oy);
            c.lineTo(ox + Math.cos(ra - rw) * R, oy + Math.sin(ra - rw) * R); c.lineTo(ox + Math.cos(ra + rw) * R, oy + Math.sin(ra + rw) * R); c.closePath(); c.fill();
          }
        } else rayT = 0;
      }
      ash.forEach(function (a) {
        a.y -= a.v; a.x += Math.sin(t / 900 + a.ph) * .3;
        if (a.y < -20) { a.y = h + 10; a.x = rand(0, w); }
        if (a.big) blob(c, sprV, a.x, a.y, 14 + a.s * 6, .12 * fade);
        else { c.globalAlpha = (.35 + .25 * Math.sin(t / 300 + a.ph)) * fade; c.fillStyle = '#b9a2ff'; c.fillRect(a.x, a.y, a.s, a.s); }
      });
      c.lineCap = 'round';
      flow = flow.filter(function (p) {
        var k3 = (now - p.t0) / p.d;
        if (k3 < 0) return true;
        if (k3 >= 1) return false;
        var e3 = k3 * k3 * (3 - 2 * k3), x = p.x0 + (p.x1 - p.x0) * e3 + Math.sin(k3 * 6 + p.ph) * p.sw * (1 - k3), y = p.y0 + (p.y1 - p.y0) * e3;
        if (p.px != null) { c.strokeStyle = '#a07bff'; c.globalAlpha = .7 * fade; c.lineWidth = 2; c.beginPath(); c.moveTo(p.px, p.py); c.lineTo(x, y); c.stroke(); }
        p.px = x; p.py = y;
        blob(c, sprS, x, y, 7, .9 * fade);
        return true;
      });
      c.globalAlpha = 1;
      emb.draw(c);
    });
    return {
      flow: function (x0, y0, x1, y1, delay) { flow.push({ x0: x0, y0: y0, x1: x1, y1: y1, t0: performance.now() + (delay || 0), d: rand(650, 1050), ph: rand(0, 6), sw: rand(10, 40), px: null, py: null }); },
      ripple: function (k) { rings.push({ t: performance.now(), k: k || 1 }); },
      retract: function () { if (!retractT) retractT = performance.now(); },
      rays: function () { rayT = performance.now(); },
      embers: function (x, y, n2) { emb.burst(x, y, n2, 9, -Math.PI / 2, 1.4, 4); }
    };
  }

