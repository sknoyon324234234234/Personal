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
