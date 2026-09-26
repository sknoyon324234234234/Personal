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
       chidori-hit          the strike, as the page shatters
       arise                the voice, as the dark falls
       arise-rise           the fallen page rising back up
       wind                 the gale (loops while the wind blows)
       kamehameha           the chant: ka... me... ha... me...
       kamehameha-fire      HAAAA, as the beam fires
       super-saiyan         the scream while powering up
       super-saiyan-burst   the golden burst at the end
     ================================================================== */
  var AC = null, master = null, muted = store(KEY_MUTE) === '1', clips = {}, loops = {};
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
        .catch(function () { return null; });
    });
  }
  /* play a clip some ms from now; a looping clip runs until stopClip(name) */
  function clip(name, ms, loop) {
    var a = audio();
    if (!a || !sfxMap()[name]) return;
    preload();
    var at = a.currentTime + (ms || 0) / 1000;
    clips[name].then(function (buf) {
      if (!buf || muted) return;
      if (ms && a.currentTime - at > .5) return;   /* decoded too late to land on its beat */
      var src = a.createBufferSource(), g = a.createGain();
      src.buffer = buf; src.loop = !!loop;
      src.connect(g); g.connect(master);
      src.start(Math.max(a.currentTime, at));
      if (loop) { stopClip(name, 0); loops[name] = { s: src, g: g }; }
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
  function focusLines(c, x, y, inner, color, n, alpha) {
    var R = Math.hypot(W, H);
    c.fillStyle = color; c.globalAlpha = alpha; c.beginPath();
    for (var i = 0; i < n; i++) {
      var a = rand(0, TAU), w = rand(.0025, .011), r0 = inner * rand(1, 1.9);
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
      var s = seq[i++];
      if (!s) { ink.remove(); root.classList.remove('pw-neg-violet', 'pw-neg-gold'); return; }
      if (s === 'neg') root.classList.add('pw-neg');
      else { ink.style.background = s === 'white' ? '#fff' : '#000'; ink.style.opacity = 1; }
      setTimeout(step, 55);
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
  function lock(onOff) {
    root.classList.toggle('pw-locked', onOff);
    var fn = onOff ? 'addEventListener' : 'removeEventListener';
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
    var w = vw(), h = vh();
    var sx = w * (phone ? .22 : .16), sy = h * .8, ex = w / 2, ey = h * (phone ? .56 : .58);
    var CHARGE = reduce ? 500 : 1350, DASH = reduce ? 1 : 420, HIT = CHARGE + DASH;
    lock(true); letterbox(true);
    var dim = overlay('pw-dim'); dim.style.setProperty('--px', ex + 'px'); dim.style.setProperty('--py', ey + 'px'); on(dim);
    var lit = reduce ? null : pageLight('90,160,255'), spk = sparkField('70,150,255', function () { return vh() * .93; });
    layer(function (c, t) { spk.draw(c); return t < HIT + 3200; });
    /* camera: slow push in on the hand while it charges, whip to the target on the dash */
    camera(sx, sy, 1.07, CHARGE, 'cubic-bezier(.3,0,.2,1)');
    later(CHARGE, function () { camera(ex, ey, 1.12, DASH, 'cubic-bezier(.7,0,.3,1)'); });
    clip('chidori', 0);
    clip('chidori-hit', HIT);

    var trail = [], arcs = [];
    for (var i = 0; i < (phone ? 7 : 12); i++) arcs.push({ b: null, until: 0 });
    layer(function (c, t, now) {
      if (t > HIT + 380) return false;
      var p = Math.min(1, t / CHARGE), d = t < CHARGE ? 0 : ease(Math.min(1, (t - CHARGE) / DASH));
      var x = sx + (ex - sx) * d, y = sy + (ey - sy) * d;
      trail.push([x, y]); if (trail.length > 14) trail.shift();
      /* the room flickers with the lightning, like a strobe */
      dim.style.opacity = (.78 + Math.random() * .22 * (.4 + p)).toFixed(2);
      /* the lightning lights the page around the hand, strobing as it arcs */
      var fl = Math.random() < .3 ? rand(.45, 1) : rand(.8, .95);
      if (lit && t < HIT) lit.at(x, y, 240 + p * 560, (.22 + p * .62) * fl);
      /* anamorphic streak through the hand */
      if (!reduce) {
        var sl = w * (.2 + p * .5), sg = c.createLinearGradient(x - sl, 0, x + sl, 0);
        sg.addColorStop(0, 'rgba(80,160,255,0)'); sg.addColorStop(.5, 'rgba(220,240,255,' + (.35 + p * .5) + ')'); sg.addColorStop(1, 'rgba(80,160,255,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = sg; c.fillRect(x - sl, y - 2, sl * 2, 4);
        c.globalCompositeOperation = 'source-over';
      }
      /* focus lines tighten as the charge peaks */
      if (!reduce) focusLines(c, x, y, 140 - p * 50, 'rgba(210,235,255,1)', phone ? 40 : 80, .12 + p * .2);
      c.globalCompositeOperation = 'lighter';
      /* orb core */
      var R = 14 + p * 30 + Math.sin(t / 25) * 4;
      var g = c.createRadialGradient(x, y, 0, x, y, R * 3.4);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(200,235,255,1)'); g.addColorStop(.45, 'rgba(70,150,255,.55)'); g.addColorStop(1, 'rgba(20,80,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R * 3.4, 0, TAU); c.fill();
      /* its light pooling on the ground below */
      c.save(); c.translate(x, h * .93); c.scale(1, .16); blob(c, sprite('80,150,255'), 0, 0, 120 + p * 220, (.25 + p * .45) * fl); c.restore();
      /* a 3D sphere of lightning spinning in the hand: arcs wrap around
         it and whip outward, near side bright and thick, far side dim */
      var n = Math.min(arcs.length, 3 + Math.round(p * arcs.length)), SR = 22 + p * (phone ? 34 : 48);
      var ay = t * .006, ax = .5 + Math.sin(t / 700) * .4;
      for (var k = 0; k < n; k++) {
        var A = arcs[k];
        if (!A.b || now > A.until) { A.b = sphereArc(SR); A.until = now + rand(40, 100); }
        draw3d(c, A.b, x, y, ay, ax, '#4aa8ff', rand(1.1, 1.8));
      }
      /* short arcs jumping off the sphere into the air around it */
      if (!reduce && Math.random() < .45 + p * .45) {
        var ma = rand(0, TAU), ml = rand(50, 90 + p * 150), mb = makeBolt(x + Math.cos(ma) * SR * .7, y + Math.sin(ma) * SR * .7, x + Math.cos(ma + rand(-.7, .7)) * ml, y + Math.sin(ma + rand(-.7, .7)) * ml, .9, 1, .22);
        drawBolt(c, mb, '#6ab8ff', .95); ion(mb, .6);
      }
      /* dashing: lightning dragged along the ground behind the hand */
      if (d > 0 && d < 1) {
        for (var j = 0; j < trail.length - 1; j += 3) {
          var tp = trail[j];
          var tb = makeBolt(tp[0], tp[1], tp[0] + rand(-30, 30), h * .93 + rand(-10, 10), 1.2, 1, .1);
          drawBolt(c, tb, '#4aa8ff', .7); ion(tb, .8);
        }
        spk.burst(x, h * .93, 5, 13, Math.PI + .5, .5, 2);
      }
      if (Math.random() < .55 + p * .3) spk.burst(x, y, 1 + Math.round(p * 2), 6 + p * 5);
    });
    later(250, function () { sfx('千鳥', w / 2, h * (phone ? .24 : .2), { cls: 'xl', en: 'CHIDORI', color: '#2d8cff', life: 1400, rot: -6 }); });
    later(650, function () { sfx('チチチチチ', w * (phone ? .7 : .72), h * .66, { cls: 'sm', color: '#2d8cff', life: 1000 }); });
    later(1000, function () { sfx('バチバチ', w * (phone ? .28 : .3), h * .42, { cls: 'sm', color: '#2d8cff', life: 800, rot: 8 }); });

    later(HIT, function () {
      cameraReset(260);
      hitStop(170);
      chroma(420);
      lensFlare(ex, ey, '90,170,255', 1100, 1.4);
      smokeRing(ex, ey, '150,160,180', phone ? 12 : 22);
      impact(['neg', 'black', 'neg', 'black'], null);
      flash('#e8f4ff', 600, .85);
      shake(phone ? 18 : 30, 800);
      spk.burst(ex, ey, phone ? 40 : 90, 24, null, null, 4);
      if (lit) layer(function (c2, t2) { var k = Math.max(0, 1 - t2 / 1100); lit.at(ex, ey, Math.max(w, h) * (.6 + (1 - k) * .4), k * (Math.random() < .3 ? .5 : 1)); if (k <= 0) { lit.off(200); return false; } });
      shockwave(ex, ey, '#7cc4ff', Math.max(w, h) * .9, 900);
      var edges = [], ne = phone ? 7 : 12;
      for (var i = 0; i < ne; i++) {
        var a = (i / ne) * TAU + rand(-.2, .2);
        edges.push(flicker((function (aa) { return function () { return makeBolt(ex, ey, ex + Math.cos(aa) * Math.max(w, h), ey + Math.sin(aa) * Math.max(w, h), 2.4, 2, .09); }; })(a), 50));
      }
      layer(function (c, t, now) {
        if (t > 520) return false;
        c.globalCompositeOperation = 'lighter';
        edges.forEach(function (f) { drawBolt(c, f(now), '#6ab8ff', 1 - t / 520); });
      });
      later(220, function () { sfx('ドゴォン', ex - (phone ? 40 : 190), ey - 60, { color: '#ff5a2a', life: 1200, rot: -12 }); });
      cracks(ex, ey);
      glass(ex, ey);
      shatter(ex, ey);
    });
    later(HIT + 500, function () { drop(dim, 600); });
    later(HIT + 1700, function () { letterbox(false); });
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
      /* glass cracks almost instantly */
      svg.animate([{ clipPath: 'circle(0px at ' + px + 'px ' + py + 'px)' }, { clipPath: 'circle(' + maxR.toFixed(0) + 'px at ' + px + 'px ' + py + 'px)' }],
        { duration: 200, easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' });
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
      var dx = rand(-60, 60) + (cxs - px) * .2, rot = rand(-70, 70);
      el2.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (dx * .15).toFixed(0) + 'px,4px) rotate(' + (rot * .05).toFixed(1) + 'deg)', opacity: 1, offset: .12 },
        { transform: 'translate(' + dx.toFixed(0) + 'px,' + (h - cys + 120).toFixed(0) + 'px) rotate(' + rot.toFixed(0) + 'deg)', opacity: .9 }
      ], { duration: rand(900, 1400), delay: rand(180, 700), easing: 'cubic-bezier(.55,0,.85,.55)', fill: 'forwards' });
    });
  }

  function glass(px, py) {
    var shards = [], n = phone ? 26 : 48;
    for (var i = 0; i < n; i++) {
      var a = rand(0, TAU), sp = rand(4, 17), s = rand(10, phone ? 38 : 60);
      shards.push({ x: px, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(2, 8), r: rand(0, 6), vr: rand(-.2, .2),
        p: [[0, 0], [rand(.4, 1) * s, rand(-.4, .4) * s], [rand(-.3, .5) * s, rand(.5, 1) * s]] });
    }
    layer(function (c, t) {
      if (t > 2600) return false;
      var H2 = vh();
      shards.forEach(function (s) {
        s.x += s.vx; s.y += s.vy; s.vy += .45; s.vx *= .99; s.r += s.vr;
        c.save(); c.translate(s.x, s.y); c.rotate(s.r);
        c.beginPath(); c.moveTo(s.p[0][0], s.p[0][1]); c.lineTo(s.p[1][0], s.p[1][1]); c.lineTo(s.p[2][0], s.p[2][1]); c.closePath();
        c.globalAlpha = Math.max(0, 1 - t / 2600) * (s.y < H2 + 80 ? 1 : 0);
        c.fillStyle = 'rgba(190,225,255,.28)'; c.fill();
        c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2; c.stroke();
        c.restore();
      });
    });
  }

  function shatter(px, py) {
    var w = vw(), h = vh(), list = pieces(phone ? 110 : 260), anims = [];
    list.forEach(function (p) {
      var r = p.r, cxp = r.left + r.width / 2, cyp = r.top + r.height / 2;
      var dx = cxp - px, dy = cyp - py, dist = Math.max(40, Math.hypot(dx, dy)), big = r.width * r.height > w * h * .08;
      var push = (big ? 60 : 180) + 120000 / (dist + 200);
      var bx = dx / dist * push + rand(-40, 40), by = dy / dist * push * .6 - rand(40, big ? 60 : 200);
      /* land in a rubble pile along the bottom of the screen */
      var endLeft = Math.min(w - r.width * .4, Math.max(-r.width * .5, r.left + dx * rand(.25, .7) + rand(-60, 60)));
      var endTop = h - r.height * rand(.25, .75) - rand(0, h * (big ? .1 : .3));
      var ex = endLeft - r.left, ey = endTop - r.top;
      var rot = (big ? rand(-14, 14) : rand(-170, 170)) * (Math.random() < .5 ? 1 : -1);
      var tilt = big ? 22 : 75;
      var vEnd = { x: ex, y: ey, z: rand(-220, 60), rx: rand(-tilt, tilt), ry: rand(-tilt, tilt), rz: rot };
      var vBlast = { x: bx, y: by, z: rand(120, big ? 200 : 420), rx: vEnd.rx * rand(.8, 1.6), ry: vEnd.ry * rand(.8, 1.6), rz: rot * .45 };
      var vSettle = { x: ex, y: ey, z: vEnd.z, rx: vEnd.rx + rand(-4, 4), ry: vEnd.ry + rand(-4, 4), rz: rot + rand(-4, 4) };
      var end = tf(vSettle);
      var endFilter = 'brightness(.5) saturate(.4) blur(0px)';
      var delay = Math.min(260, dist / 6) + rand(0, 80);
      var kf = reduce ? [{ opacity: 1 }, { opacity: 0 }] : [
        { transform: tf(Z0), filter: 'brightness(1) saturate(1) blur(0px)', easing: 'cubic-bezier(.1,.7,.3,1)' },
        { transform: tf(vBlast), filter: 'brightness(1.8) saturate(1) blur(1.6px)', offset: .32, easing: 'cubic-bezier(.55,0,.9,.5)' },
        { transform: tf(vEnd), filter: endFilter, offset: .9, easing: 'ease-out' },
        { transform: end, filter: endFilter }
      ];
      if (phone) kf.forEach(function (k) { delete k.filter; });
      var a = p.el.animate(kf, { duration: reduce ? 500 : rand(1300, 1900), delay: reduce ? 0 : delay, fill: 'both' });
      anims.push({ el: p.el, a: a, end: end, v: vSettle, top: r.top });
    });
    ruin = { anims: anims, px: px, py: py };
    root.classList.add('pw-destroyed');
    later(1500, function () { ruinScene(px, py); });
  }

  function ruinScene(px, py) {
    var r = overlay('pw-ruin'); r.style.setProperty('--px', px + 'px'); r.style.setProperty('--py', py + 'px'); on(r);
    ruinParts.push(r);
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
  function soldier(c, s, t) {
    var h = vh(), size = s.size, rise = s.rise;
    var top = h + 10 - rise * size * 2.3, x = s.x + Math.sin(t / 900 + s.ph) * 3;
    var hr = size * .17, hy = top + hr * 1.3, sh = hy + size * .2, sw = size * .52;
    c.save();
    /* body: near-black armour that melts into smoke toward the ground */
    var g = c.createLinearGradient(0, top - hr, 0, h);
    g.addColorStop(0, 'rgba(5,2,12,' + (.96 * s.o) + ')'); g.addColorStop(.55, 'rgba(10,4,24,' + (.9 * s.o) + ')'); g.addColorStop(1, 'rgba(30,10,70,0)');
    c.fillStyle = g;
    c.beginPath();
    /* horned helmet */
    c.moveTo(x - hr, hy + hr * .4);
    c.lineTo(x - hr * 1.05, hy - hr * .3);
    c.quadraticCurveTo(x - hr * 1.9, hy - hr * 1.2, x - hr * 1.6, top - hr * 1.6);
    c.quadraticCurveTo(x - hr * 1.2, hy - hr * 1.3, x - hr * .7, top + hr * .1);
    c.lineTo(x, top - hr * .8);
    c.lineTo(x + hr * .7, top + hr * .1);
    c.quadraticCurveTo(x + hr * 1.2, hy - hr * 1.3, x + hr * 1.6, top - hr * 1.6);
    c.quadraticCurveTo(x + hr * 1.9, hy - hr * 1.2, x + hr * 1.05, hy - hr * .3);
    c.lineTo(x + hr, hy + hr * .4);
    /* spiked pauldrons */
    c.lineTo(x + hr * .9, sh - size * .06);
    c.lineTo(x + sw * .7, sh - size * .12); c.lineTo(x + sw * 1.25, sh - size * .2); c.lineTo(x + sw * 1.05, sh + size * .02);
    c.lineTo(x + sw * 1.1, sh + size * .18);
    /* ragged cloak edges down into the smoke */
    for (var k = 0; k <= 7; k++) { var yy = sh + size * .2 + k * (h - sh) / 7; c.lineTo(x + sw * (.95 - k * .05) + Math.sin(t / 160 + k * 1.3 + s.ph) * 7, yy); }
    for (var k2 = 7; k2 >= 0; k2--) { var yy2 = sh + size * .2 + k2 * (h - sh) / 7; c.lineTo(x - sw * (.95 - k2 * .05) + Math.sin(t / 150 + k2 * 1.3 + s.ph + 2) * 7, yy2); }
    c.lineTo(x - sw * 1.1, sh + size * .18); c.lineTo(x - sw * 1.05, sh + size * .02);
    c.lineTo(x - sw * 1.25, sh - size * .2); c.lineTo(x - sw * .7, sh - size * .12);
    c.lineTo(x - hr * .9, sh - size * .06);
    c.closePath(); c.fill();
    var edge = c.createLinearGradient(0, top - hr, 0, h);
    edge.addColorStop(0, 'rgba(170,110,255,' + (.8 * s.o) + ')'); edge.addColorStop(.6, 'rgba(120,60,255,' + (.35 * s.o) + ')'); edge.addColorStop(1, 'rgba(120,60,255,0)');
    c.strokeStyle = edge; c.lineWidth = 1.3; c.stroke();
    /* a greatsword planted in front */
    if (s.sword) {
      var bx = x + sw * .35, by = sh + size * .15;
      c.fillStyle = 'rgba(6,3,14,' + s.o + ')'; c.strokeStyle = 'rgba(170,110,255,' + (.7 * s.o) + ')';
      c.beginPath(); c.moveTo(bx - 4, by); c.lineTo(bx + 4, by); c.lineTo(bx + 3, h); c.lineTo(bx - 3, h); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(bx - 16, by); c.lineTo(bx + 16, by); c.lineWidth = 4; c.stroke();
    }
    /* eyes */
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = s.o * (.85 + Math.sin(t / 90 + s.ph) * .15);
    c.fillStyle = '#b9f0ff';
    c.beginPath(); c.ellipse(x - hr * .4, hy, hr * .28, hr * .07, -.3, 0, TAU); c.ellipse(x + hr * .4, hy, hr * .28, hr * .07, .3, 0, TAU); c.fill();
    c.globalAlpha = s.o * .25; c.fillStyle = '#7b3fff'; c.beginPath(); c.ellipse(x, hy, hr * 1.2, hr * .5, 0, 0, TAU); c.fill();
    c.restore();
  }

  function shadowArmy(total) {
    var w = vw(), h = vh(), n = phone ? 3 : 6, army = [], smoke = [];
    for (var i = 0; i < n; i++) army.push({ x: (i + .5) / n * w + rand(-30, 30), size: rand(.85, 1.15) * (phone ? 110 : 150) * (i % 2 ? 1 : 1.15), rise: 0, o: 1, ph: rand(0, 6), sword: i % 2 === 1, at: 700 + Math.abs(i - (n - 1) / 2) * 180 });
    var ground = flicker(function () { var x = rand(0, w); return makeBolt(x, h, x + rand(-160, 160), h - rand(20, 90), 1, 1, .15); }, 80);
    layer(function (c, t, now) {
      if (t > total) return false;
      var fade = t > total - 700 ? (total - t) / 700 : 1;
      /* shadow smoke pouring up from the ground */
      if (t < total - 900) for (var k = 0; k < (phone ? 2 : 4); k++) smoke.push({ x: rand(0, w), y: h + 30, r: rand(30, phone ? 70 : 110), v: rand(1.5, 4), l: 1 });
      smoke = smoke.filter(function (s) {
        s.y -= s.v; s.r *= 1.006; s.l -= .008;
        var g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        g.addColorStop(0, 'rgba(60,20,120,' + (.35 * s.l * fade) + ')'); g.addColorStop(1, 'rgba(10,4,24,0)');
        c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill();
        return s.l > 0;
      });
      army.forEach(function (s) {
        if (!s.glint && t > s.at + 600) { s.glint = true; lensFlare(s.x, h + 10 - s.size * 2.3 + s.size * .17 * 1.3, '120,220,255', 700, .35); }
        var r = Math.max(0, Math.min(1, (t - s.at) / 900));
        s.rise = 1 - Math.pow(1 - r, 3); s.o = fade;
        if (s.rise > 0) soldier(c, s, t);
      });
      if (t < total - 800) { c.globalCompositeOperation = 'lighter'; drawBolt(c, ground(now), '#8a5cff', .8); }
    });
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
     起きろ ARISE — shadow extraction, following the anime:
     1. darkness falls and the seal opens under the fallen
     2. "ARISE" — the command lands with impact frames
     3. each fallen piece turns to shadow and its soul is torn out as
        black-violet smoke streaming upward
     4. the shadows stand up: every piece rises back to its place as a
        black silhouette, knights rise behind, and they kneel
     5. a violet sweep wakes them into full colour; the System confirms
     ================================================================== */
  function arise() {
    if (busy) return;
    var restoring = !!ruin;
    setBusy(true); closeDock();
    if (restoring) { ruin.rising = true; if (ruin.cta) { drop(ruin.cta, 600); ruin.cta = null; } }
    var w = vw(), h = vh();
    var count = restoring ? ruin.anims.length : 0;
    clip('arise', 0);
    var sh = overlay('pw-shadow'); on(sh);
    /* violet light welling up from the ground */
    var lit = reduce ? null : pageLight('140,80,255');
    if (lit) layer(function (c, t) { if (lit.dead) return false; var k = Math.min(1, t / 900); lit.at(w / 2, h * 1.05, h * (.75 + .12 * Math.sin(t / 480)), (.4 + .18 * Math.sin(t / 90) * Math.random()) * k); });
    function litOff() { if (lit && !lit.dead) { lit.dead = true; lit.off(900); } }
    letterbox(true);
    /* camera sinks toward the ground where the fallen lie */
    camera(w / 2, h * .85, 1.06, 1400, 'cubic-bezier(.4,0,.2,1)');
    var seal = overlay('pw-seal');
    seal.innerHTML = '<svg viewBox="-100 -100 200 200"><g fill="none" stroke="#b28cff"><circle r="96" stroke-width="2"/><circle r="84" stroke-width="1" stroke-dasharray="3 6"/><circle r="52" stroke-width="2"/>' +
      '<path d="M0-84 73 42H-73Z M0 84-73-42H73Z" stroke-width="1.6"/><path d="M0-52V52M-45-26 45 26M45-26-45 26" stroke-width=".8" opacity=".6"/></g>' +
      '<g fill="#d9c6ff" font-size="11" font-family="serif" text-anchor="middle"><text y="-88">影</text><text y="96">王</text><text x="-90" y="4">起</text><text x="90" y="4">兵</text></g></svg>';
    on(seal);

    /* 1 → the fallen go dark: every rubble piece becomes a shadow */
    var SHADOW = phone ? 'brightness(0)' : 'brightness(0) drop-shadow(0 0 5px rgba(140,80,255,.9))';
    if (restoring) ruin.anims.forEach(function (p) {
      p.dark = p.el.animate([{ transform: p.end, filter: phone ? 'none' : 'brightness(.5) saturate(.4)' }, { transform: p.end, filter: SHADOW }],
        { duration: reduce ? 1 : 700, delay: rand(0, 250), fill: 'forwards' });
    });
    var sys = null;

    /* 2 → the command */
    later(880, function () {
      hitStop(140);
      chroma(500);
      lensFlare(w / 2, h * .3, '150,90,255', 1400, 1.6);
      smokeRing(w / 2, h, '40,15,80', phone ? 10 : 18);
      impact(['neg', 'black', 'neg'], 'violet');
      shockwave(w / 2, h, '#9a6bff', Math.max(w, h), 1100);
      shake(10, 900);
      sfx('ARISE', w / 2, h * .3, { cls: 'xl pw-arise-word', en: '起きろ', life: 1900, rot: 0 });
    });

    shadowArmy(restoring ? 5600 : 3800);

    if (!restoring) {
      later(1500, function () {
        sys = sysWindow('SYSTEM', ['No fallen enemies found.', 'Summoning your standing shadow army instead.']);
      });
      later(3600, function () {
        drop(sh, 800); drop(seal, 800); letterbox(false); cameraReset(500); litOff();
        if (sys) sys.close(0);
        setBusy(false); paint();
        toast('Use Chidori first, then Arise will extract the fallen page.');
      });
      return;
    }

    /* 3 → souls torn out of the fallen */
    later(1300, function () {
      var rects = ruin.anims.map(function (p) { return p.el.getBoundingClientRect(); });
      extractSouls(rects, 1500);
      sys = sysWindow('SYSTEM', ['Shadow extraction in progress.', 'Targets: <em>' + count + '</em> fallen elements.'], { bar: true });
      var t0 = performance.now();
      (function tick() {
        if (!sys) return;
        var p = Math.min(1, (performance.now() - t0) / 3400);
        sys.progress(p);
        if (p < 1) requestAnimationFrame(tick);
      })();
    });

    /* 4 → the shadows stand up and take their places, then kneel */
    var done = [];
    later(2300, function () {
      clip('arise-rise', 0);
      cameraReset(1400);
      sh.classList.add('thin');
      ruinParts.forEach(function (p) { p.style.transition = 'opacity 1.2s'; p.style.opacity = '0'; });
      ruin.anims.forEach(function (p) {
        var d = reduce ? 0 : Math.max(0, (h - p.top) / h) * 600 + rand(0, 300);
        var v = p.v, mid = { x: v.x * .35, y: v.y * .35 - rand(30, 90), z: rand(80, 200), rx: v.rx * .2, ry: v.ry * .2, rz: v.rz * .25 };
        var kf = reduce ? [{ opacity: 0 }, { opacity: 1 }] : [
          { transform: tf(v), filter: phone ? SHADOW : SHADOW + ' blur(0px)', easing: 'cubic-bezier(.5,0,.3,1)' },
          { transform: tf(mid, 1.04), filter: phone ? SHADOW : SHADOW + ' blur(1.4px)', offset: .55, easing: 'cubic-bezier(.2,.7,.2,1)' },
          { transform: tf({ x: 0, y: -10, z: 40, rx: -8, ry: 0, rz: 0 }, 1.02), filter: phone ? SHADOW : SHADOW + ' blur(0px)', offset: .82, easing: 'cubic-bezier(.3,0,.3,1)' },
          { transform: tf({ x: 0, y: 5, z: -10, rx: 6, ry: 0, rz: 0 }, .99), filter: phone ? SHADOW : SHADOW + ' blur(0px)', offset: .92 },
          { transform: tf(Z0), filter: phone ? SHADOW : SHADOW + ' blur(0px)' }
        ];
        p.rise = p.el.animate(kf, { duration: reduce ? 400 : rand(1300, 1700), delay: d, fill: 'forwards' });
        done.push(p.rise.finished.catch(function () {}));
      });

      /* 5 → awaken: a violet sweep brings the colour back, top to bottom */
      Promise.all(done).then(function () {
        var SWEEP = reduce ? 300 : 1100;
        awakenSweep(SWEEP);
        var wake = [];
        ruin.anims.forEach(function (p) {
          var top = p.el.getBoundingClientRect().top;
          var d = reduce ? 0 : Math.max(0, Math.min(1, (top + 60) / (h + 120))) * SWEEP;
          p.wake = p.el.animate([
            { filter: SHADOW },
            { filter: phone ? 'brightness(1.6)' : 'brightness(1.8) drop-shadow(0 0 8px rgba(170,120,255,.9))', offset: .35 },
            { filter: 'none' }
          ], { duration: reduce ? 200 : 520, delay: d, fill: 'forwards' });
          wake.push(p.wake.finished.catch(function () {}));
        });
        Promise.all(wake).then(function () {
          ruin.anims.forEach(function (p) { [p.a, p.dark, p.rise, p.wake].forEach(function (a) { if (a) a.cancel(); }); });
          ruinParts.forEach(function (p) { p.remove(); }); ruinParts = [];
          drop(sh, 800); drop(seal, 800); letterbox(false); litOff();
          root.classList.remove('pw-destroyed');
          if (sys) { sys.progress(1); sys.close(0); }
          var fin = sysWindow('SYSTEM', ['Shadow extraction <em>successful</em>.', '<em>' + count + '</em> shadows have joined your army.', 'The page lives again.']);
          fin.close(3400);
          lock(false); ruin = null; setBusy(false); paint();
        });
      });
    });
  }

  /* ==================================================================
     風 WIND — a gale: streaks, spiral vortices, leaves; the page sways
     ================================================================== */
  var windStop = 0;
  function wind() {
    if (windOn) { windOn = false; root.classList.remove('pw-windy'); paint(); return; }
    if (busy || ruin) return;
    windOn = true; paint(); closeDock();
    if (!reduce) root.classList.add('pw-windy');
    Array.prototype.forEach.call(document.querySelectorAll('main h1, main h2, main h3, main img, main .btn, main .card, main p, .hero-mascot'), function (e, i) {
      if (i < 300) e.style.setProperty('--pw-d', (-(i % 7) * .13).toFixed(2));
    });
    clip('wind', 0, true);
    var dark = root.getAttribute('data-mode') === 'ink';
    var streak = dark ? 'rgba(230,240,255,1)' : 'rgba(40,70,90,1)';
    var LEAF = ['#e8a1b0', '#f3c3cc', '#7fae5a', '#a9c96e', '#d9a441'];
    var lines = [], leaves = [], vort = [], NL = phone ? 26 : 60, NV = phone ? 18 : 42;
    var motes = [], NM = phone ? 120 : 300;
    for (var m0 = 0; m0 < NM; m0++) motes.push({ x: rand(0, vw()), y: rand(0, vh()), s: rand(.6, 1.4) });
    function newLine(any) { return { x: any ? rand(-vw(), vw()) : rand(-400, -60), y: rand(0, vh()), len: rand(80, 300), v: rand(16, 34), a: rand(.12, .45), wob: rand(0, 6) }; }
    function newLeaf(any) { return { x: any ? rand(0, vw()) : rand(-80, -10), y: rand(-20, vh()), v: rand(4, 11), s: rand(4, 9), r: rand(0, 6), vr: rand(-.25, .25), c: pick(LEAF), wob: rand(0, 6) }; }
    function newVortex() { return { x: rand(-200, -50), y: rand(.15, .85) * vh(), r: rand(40, phone ? 80 : 130), v: rand(8, 14), spin: rand(0, TAU) }; }
    for (var i = 0; i < NL; i++) lines.push(newLine(true));
    for (var j = 0; j < NV; j++) leaves.push(newLeaf(true));
    for (var k = 0; k < (phone ? 2 : 4); k++) { var v0 = newVortex(); v0.x = rand(0, vw()); vort.push(v0); }
    var kanji = sfx('風', vw() * .5, vh() * .4, { cls: 'xl', en: 'WIND RELEASE', color: '#2fa876', life: 1400, rot: -4 });
    later(500, function () { sfx('ヒュウウウ', vw() * .7, vh() * .62, { cls: 'sm', color: '#2fa876', life: 1100 }); });
    var end = performance.now() + 9000; windStop = end;
    layer(function (c, t, now) {
      var fade = windOn ? Math.min(1, t / 400) : 0;
      if (windOn && now > end && windStop === end) { windOn = false; root.classList.remove('pw-windy'); paint(); }
      if (!windOn) { stopClip('wind'); return false; }
      var Wd = vw(), Hd = vh();
      c.lineCap = 'round'; c.strokeStyle = streak;
      /* dust motes riding a turbulent flow field */
      c.globalAlpha = .45 * fade; c.lineWidth = 1; c.beginPath();
      motes.forEach(function (m) {
        var an = (noise2(m.x * .003, m.y * .004 + t * .0004) - .5) * 1.6, sp = (9 + noise1(m.y * .01 + t * .001) * 14) * m.s;
        var mx = m.x + Math.cos(an) * sp, my = m.y + Math.sin(an) * sp;
        c.moveTo(m.x, m.y); c.lineTo(mx, my); m.x = mx; m.y = my;
        if (m.x > Wd + 20 || m.y < -20 || m.y > Hd + 20) { m.x = rand(-40, 0); m.y = rand(0, Hd); }
      });
      c.stroke();
      lines.forEach(function (l, i) {
        l.x += l.v; if (l.x > Wd + 40) lines[i] = newLine(false);
        var y = l.y + Math.sin(t / 400 + l.wob) * 12;
        c.globalAlpha = l.a * fade; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(l.x, y); c.quadraticCurveTo(l.x + l.len * .5, y - 10, l.x + l.len, y); c.stroke();
      });
      /* spiral vortices rolling across */
      vort.forEach(function (v, i) {
        v.x += v.v; v.spin += .12; if (v.x > Wd + 200) vort[i] = newVortex();
        c.globalAlpha = .35 * fade; c.lineWidth = 1.6;
        for (var r = 0; r < 3; r++) {
          c.beginPath();
          for (var a = 0; a < 5.5; a += .15) {
            var rr = v.r * (a / 5.5) * (1 - r * .2), px = v.x + Math.cos(a + v.spin + r * 2) * rr, py = v.y + Math.sin(a + v.spin + r * 2) * rr * .45;
            if (a === 0) c.moveTo(px, py); else c.lineTo(px, py);
          }
          c.stroke();
        }
      });
      leaves.forEach(function (f, i) {
        f.x += f.v; f.y += Math.sin(t / 300 + f.wob) * 1.8 + .6 + (noise2(f.x * .003, t * .0004) - .5) * 3; f.r += f.vr;
        if (f.x > Wd + 30 || f.y > Hd + 30) leaves[i] = newLeaf(false);
        /* leaves tumble in 3D: they turn edge-on and show their darker back */
        var flip = Math.cos(t / 240 + f.wob), sq = Math.sin(t / 170 + f.wob * 2);
        c.save(); c.translate(f.x, f.y); c.rotate(f.r); c.scale(Math.max(.12, Math.abs(flip)), .55 + Math.abs(sq) * .45);
        c.globalAlpha = .92 * fade; c.fillStyle = f.c;
        c.beginPath(); c.moveTo(-f.s, 0); c.quadraticCurveTo(0, -f.s * .75, f.s, 0); c.quadraticCurveTo(0, f.s * .75, -f.s, 0); c.fill();
        if (flip < 0) { c.fillStyle = 'rgba(0,0,0,.28)'; c.fill(); }
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = .8; c.beginPath(); c.moveTo(-f.s, 0); c.lineTo(f.s, 0); c.stroke();
        c.restore();
      });
    });
    return kanji;
  }

  /* ==================================================================
     かめはめ波 KAMEHAMEHA — ka, me, ha, me: energy spirals into the
     cupped hands, then HAAA: a beam with bloom, rings and debris
     ================================================================== */
  function kamehameha() {
    if (busy || ruin) return;
    setBusy(true); closeDock();
    var w = vw(), h = vh(), portrait = h > w;
    var ox = portrait ? w / 2 : w * .14, oy = portrait ? h * .8 : h * .58, ang = portrait ? -Math.PI / 2 : 0;
    var dim = overlay('pw-dim kame'); dim.style.setProperty('--px', ox + 'px'); dim.style.setProperty('--py', oy + 'px'); on(dim);
    var STEP = reduce ? 150 : 520, CHARGE = STEP * 4 + 250, BEAM = reduce ? 600 : 1700;
    var lit = reduce ? null : pageLight('70,150,255'), litB = reduce ? null : pageLight('110,180,255'), spk = sparkField('90,160,255');
    layer(function (c, t) { spk.draw(c); return t < CHARGE + BEAM + 1600; });
    clip('kamehameha', 0);
    ['か', 'め', 'は', 'め'].forEach(function (ch, i) {
      later(i * STEP, function () {
        var tx = portrait ? w * (.2 + i * .2) : ox + 60 + i * Math.min(130, w * .09);
        var ty = portrait ? h * .5 : oy - 160 - (i % 2) * 44;
        sfx(ch, tx, ty, { color: '#2d8cff', life: CHARGE - i * STEP + 200, rot: rand(-12, 12) });
        shake(2 + i * 2.5, STEP);
      });
    });
    var bits = [], dust = [], zaps = [];
    for (var z = 0; z < (phone ? 4 : 7); z++) zaps.push(null);
    layer(function (c, t, now) {
      if (t > CHARGE + BEAM + 700) return false;
      var p = Math.min(1, t / CHARGE), fire = t > CHARGE, bt = t - CHARGE;
      /* the orb and then the beam light up the page */
      var fl = .9 + Math.random() * .1;
      if (lit) lit.at(ox, oy, 180 + p * 620 + (fire ? 220 : 0), (fire ? Math.max(0, 1 - Math.max(0, bt - BEAM) / 700) : .15 + p * .6) * fl);
      if (!fire && p > .4 && Math.random() < .4) spk.burst(ox, oy, 1, 6 + p * 6);
      if (!fire && !reduce) focusLines(c, ox, oy, 120 - p * 40, 'rgba(200,230,255,1)', phone ? 36 : 70, .08 + p * .18);
      c.globalCompositeOperation = 'lighter';
      /* energy spiralling into the palms */
      /* energy on tilted 3D orbits, spiralling into the palms */
      if (t < CHARGE) for (var k = 0; k < (phone ? 4 : 8); k++) { var nrm = unit3(), e1 = norm3(cross3(nrm, unit3())); bits.push({ e1: e1, e2: cross3(nrm, e1), a: rand(0, TAU), r: rand(120, 340), v: rand(.1, .16) }); }
      c.strokeStyle = '#a8dcff';
      bits = bits.filter(function (b) {
        function at(a, r) { var ca = Math.cos(a) * r, sa = Math.sin(a) * r; return proj([b.e1[0] * ca + b.e2[0] * sa, b.e1[1] * ca + b.e2[1] * sa, b.e1[2] * ca + b.e2[2] * sa], ox, oy); }
        var p0 = at(b.a, b.r); b.a += b.v * 2; b.r *= .9; var p1 = at(b.a, b.r);
        c.globalAlpha = Math.min(1, (p1[2] - .6) * 2); c.lineWidth = 2.6 * p1[2];
        c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
        return b.r > 8;
      });
      /* three tilted energy rings orbiting the orb */
      if (!fire || bt < 300) for (var ri = 0; ri < 3; ri++) {
        var rr = 30 + p * 70 + ri * 14, ring = [];
        for (var ra = 0; ra <= 36; ra++) { var aa = ra / 36 * TAU; ring.push([Math.cos(aa) * rr, Math.sin(aa) * rr * .15, Math.sin(aa) * rr]); }
        draw3d(c, ring, ox, oy, t * .004 + ri * 2.1, .9 + ri * .5, '#6ab8ff', .9);
      }
      /* ground dust lifting */
      if (t < CHARGE + BEAM && Math.random() < .8) dust.push({ x: rand(0, w), y: h + 5, v: rand(1, 3 + p * 4), s: rand(2, 5), l: 1 });
      c.fillStyle = '#bfe3ff';
      dust = dust.filter(function (d) { d.y -= d.v; d.l -= .012; c.globalAlpha = d.l * .6; c.fillRect(d.x, d.y, d.s, d.s); return d.l > 0; });
      /* the orb */
      var R = fire ? 64 * (1 - Math.max(0, bt - BEAM) / 700) : 10 + p * 50 + Math.sin(t / 40) * 4;
      if (R > 0) {
        var g = c.createRadialGradient(ox, oy, 0, ox, oy, R * 2.8);
        g.addColorStop(0, '#fff'); g.addColorStop(.25, 'rgba(160,220,255,1)'); g.addColorStop(.55, 'rgba(60,140,255,.6)'); g.addColorStop(1, 'rgba(20,90,255,0)');
        c.fillStyle = g; c.globalAlpha = 1; c.beginPath(); c.arc(ox, oy, R * 2.8, 0, TAU); c.fill();
        /* corona: a wide soft halo that breathes, a white-hot heart and an anamorphic streak */
        blob(c, sprite('80,160,255'), ox, oy, R * (5.5 + Math.sin(t / 55) * .4), .45);
        blob(c, sprite('220,240,255', true), ox, oy, R * 1.3, .9);
        if (!reduce) { var sl2 = R * (6 + p * 4), sg2 = c.createLinearGradient(ox - sl2, 0, ox + sl2, 0); sg2.addColorStop(0, 'rgba(80,160,255,0)'); sg2.addColorStop(.5, 'rgba(230,245,255,1)'); sg2.addColorStop(1, 'rgba(80,160,255,0)'); c.globalAlpha = .5 + p * .4; c.fillStyle = sg2; c.fillRect(ox - sl2, oy - 1.5, sl2 * 2, 3); }
        c.globalAlpha = 1;
        /* sparks crackling off the orb */
        if (p > .3) for (var q = 0; q < zaps.length; q++) {
          if (!zaps[q] || now > zaps[q].until) { var a = rand(0, TAU), l = R * rand(1.2, 2.6); zaps[q] = { b: makeBolt(ox + Math.cos(a) * R * .5, oy + Math.sin(a) * R * .5, ox + Math.cos(a) * l, oy + Math.sin(a) * l, 1, 1, .15), until: now + rand(40, 90) }; }
          drawBolt(c, zaps[q].b, '#5fb4ff', .8);
        }
      }
      if (!fire) return;
      /* the beam */
      var grow = Math.min(1, bt / 200), thin = bt > BEAM ? Math.max(0, 1 - (bt - BEAM) / 700) : 1;
      var L = Math.hypot(w, h) * 1.2 * grow, hh = (portrait ? w * .22 : h * .15) * thin * (1 + Math.sin(bt / 28) * .06);
      /* the beam casts a band of light across the page */
      if (litB) {
        var bw2 = Math.round(hh * 3.2 / 8) * 8, fb = (.55 + Math.random() * .15) * thin * grow, lc = 'rgba(110,180,255,';
        litB.band(portrait ? 'linear-gradient(90deg,' + lc + '0) ' + (ox - bw2) + 'px,' + lc + '.55) ' + ox.toFixed(0) + 'px,' + lc + '0) ' + (ox + bw2) + 'px)'
          : 'linear-gradient(180deg,' + lc + '0) ' + (oy - bw2) + 'px,' + lc + '.55) ' + oy.toFixed(0) + 'px,' + lc + '0) ' + (oy + bw2) + 'px)', fb);
      }
      if (!reduce && thin > .3 && Math.random() < .8) spk.burst(ox + Math.cos(ang) * 40, oy + Math.sin(ang) * 40, 3, 28, ang, .35, 0);
      c.translate(ox, oy); c.rotate(ang);
      var gr = c.createLinearGradient(0, -hh * 1.3, 0, hh * 1.3);
      gr.addColorStop(0, 'rgba(30,110,255,0)'); gr.addColorStop(.2, 'rgba(40,130,255,.45)'); gr.addColorStop(.38, 'rgba(120,210,255,.95)');
      gr.addColorStop(.5, '#ffffff'); gr.addColorStop(.62, 'rgba(120,210,255,.95)'); gr.addColorStop(.8, 'rgba(40,130,255,.45)'); gr.addColorStop(1, 'rgba(30,110,255,0)');
      c.fillStyle = gr; c.globalAlpha = 1; c.beginPath(); c.moveTo(0, -hh * .5);
      for (var x = 0; x <= L; x += 22) c.lineTo(x, -hh * 1.3 * (1 + Math.sin(x * .03 - bt * .045) * .08));
      c.lineTo(L, hh * 1.3);
      for (var x2 = L; x2 >= 0; x2 -= 22) c.lineTo(x2, hh * 1.3 * (1 + Math.sin(x2 * .03 + bt * .05) * .08));
      c.lineTo(0, hh * .5); c.closePath(); c.fill();
      /* a turbulent plasma envelope: three layers of rolling noise */
      for (var pl = 0; pl < 3; pl++) {
        var amp = hh * (1.45 + pl * .3), fq = .0035 + pl * .0025, spd = .004 + pl * .003;
        c.beginPath(); c.moveTo(0, -hh * .4);
        for (var nx = 0; nx <= L; nx += 16) c.lineTo(nx, -amp * (.7 + noise1(nx * fq - bt * spd + pl * 9) * .55));
        for (var nx2 = L; nx2 >= 0; nx2 -= 16) c.lineTo(nx2, amp * (.7 + noise1(nx2 * fq + bt * spd + pl * 17) * .55));
        c.lineTo(0, hh * .4); c.closePath();
        c.fillStyle = 'rgba(' + (pl ? '40,110,255' : '90,170,255') + ',' + ((.13 - pl * .03) * thin) + ')'; c.fill();
      }
      /* the white-hot core, flickering along its length */
      c.fillStyle = '#ffffff'; c.globalAlpha = .9 * thin;
      c.beginPath(); c.moveTo(0, -hh * .22);
      for (var cq = 0; cq <= L; cq += 24) c.lineTo(cq, -hh * (.18 + noise1(cq * .01 - bt * .02) * .1));
      for (var cq2 = L; cq2 >= 0; cq2 -= 24) c.lineTo(cq2, hh * (.18 + noise1(cq2 * .01 + bt * .02 + 5) * .1));
      c.closePath(); c.fill(); c.globalAlpha = 1;
      /* spiralling energy around the beam */
      c.strokeStyle = '#dff3ff'; c.lineWidth = 1.4; c.globalAlpha = .28 * thin;
      for (var sI = 0; sI < 3; sI++) {
        c.beginPath();
        for (var sx2 = 0; sx2 <= L; sx2 += 14) { var yy = Math.sin(sx2 * (.012 + sI * .006) - bt * .03 + sI * 2) * hh * (.9 + Math.sin(sx2 * .01 + sI) * .2); if (sx2 === 0) c.moveTo(sx2, yy); else c.lineTo(sx2, yy); }
        c.stroke();
      }
      /* shock rings travelling along the beam give it a round, 3D body */
      c.strokeStyle = '#ffffff';
      for (var ring2 = 0; ring2 < 6; ring2++) {
        var rx0 = ((bt * .9 + ring2 * L / 6) % L);
        c.globalAlpha = .45 * thin * (1 - rx0 / L * .6); c.lineWidth = 3;
        c.beginPath(); c.ellipse(rx0, 0, hh * .28, hh * 1.35, 0, 0, TAU); c.stroke();
      }
      c.globalAlpha = .85 * thin; c.lineWidth = 2;
      for (var s = 0; s < 10; s++) { var y3 = rand(-hh * .9, hh * .9), xs = rand(0, L); c.beginPath(); c.moveTo(xs, y3); c.lineTo(xs + rand(60, 240), y3); c.stroke(); }
      if (grow < 1) { var hg = c.createRadialGradient(L, 0, 0, L, 0, hh * 2); hg.addColorStop(0, '#fff'); hg.addColorStop(1, 'rgba(60,150,255,0)'); c.fillStyle = hg; c.beginPath(); c.arc(L, 0, hh * 2, 0, TAU); c.fill(); }
    });
    later(CHARGE, function () {
      clip('kamehameha-fire', 0);
      impact(['neg', 'white', 'neg'], null);
      flash('#dff1ff', 420, .7); shake(phone ? 14 : 22, BEAM);
      spk.burst(ox, oy, phone ? 30 : 60, 20);
      shockwave(ox, oy, '#6ab8ff', Math.max(w, h) * .6, 800);
      later(260, function () { shockwave(ox, oy, '#6ab8ff', Math.max(w, h) * .45, 700); });
      sfx('波ァァァ!!', portrait ? w / 2 : w * .55, portrait ? h * .3 : oy - (phone ? 90 : 180), { cls: 'xl', en: 'KAMEHAMEHA', color: '#2d8cff', life: BEAM + 200, rot: -5 });
      blast(ox, oy, ang, portrait ? w * .22 : h * .15);
    });
    later(CHARGE + BEAM + 450, function () {
      drop(dim, 500);
      if (lit) lit.off(600);
      if (litB) litB.off(400);
      if (!root.classList.contains('pw-ssj')) ssj(true, true); else setBusy(false);
    });
  }

  /* anything the beam passes through gets knocked about */
  function blast(ox, oy, ang, hh) {
    if (reduce) return;
    var dx = Math.cos(ang), dy = Math.sin(ang);
    pieces(phone ? 60 : 160).forEach(function (p) {
      var r = p.r, cxp = r.left + r.width / 2 - ox, cyp = r.top + r.height / 2 - oy;
      var along = cxp * dx + cyp * dy, across = Math.abs(-cxp * dy + cyp * dx);
      if (along < 0 || across > hh * 1.4) return;
      var k = rand(16, 40);
      p.el.animate([
        { transform: 'none' },
        { transform: 'translate(' + (dx * k + rand(-6, 6)).toFixed(0) + 'px,' + (dy * k + rand(-6, 6)).toFixed(0) + 'px) rotate(' + rand(-6, 6).toFixed(1) + 'deg)', offset: .2 },
        { transform: 'translate(' + rand(-3, 3).toFixed(0) + 'px,' + rand(-3, 3).toFixed(0) + 'px)', offset: .6 },
        { transform: 'none' }
      ], { duration: 900, delay: along / 6, easing: 'ease-out' });
    });
  }

  /* ==================================================================
     超 SUPER SAIYAN — the scream, rocks lifting, golden flames, SSJ2
     lightning, then a gold impact and the aura stays on
     ================================================================== */
  var aura = null;
  function ssj(onOff, animate) {
    if (onOff) {
      if (!aura) aura = overlay('pw-aura');
      if (animate) {
        setBusy(true);
        var w = vw(), h = vh(), DUR = reduce ? 300 : 1700, fx = w / 2, fy = h * (phone ? .66 : .7);
        var dim = overlay('pw-dim ssj'); on(dim);
        var lit = reduce ? null : pageLight('255,190,60');
        later(DUR + 700, function () { if (lit) lit.off(400); });
        clip('super-saiyan', 0);
        clip('super-saiyan-burst', DUR);
        var rocks = [], zap = [], flames = [];
        for (var z = 0; z < (phone ? 3 : 6); z++) zap.push(null);
        layer(function (c, t, now) {
          if (t > DUR + 700) return false;
          var p = Math.min(1, t / DUR), fade = t > DUR ? 1 - (t - DUR) / 700 : 1;
          if (!reduce) focusLines(c, fx, fy - 60, 150, 'rgba(255,230,150,1)', phone ? 36 : 70, (.1 + p * .2) * fade);
          c.globalCompositeOperation = 'lighter';
          if (lit) lit.at(fx, fy - 60, 300 + p * 700, (.25 + p * .55) * fade * (.85 + Math.random() * .15));
          /* golden flame aura: hundreds of rising, flickering embers that
             together read as fire licking up around the body */
          var bw = phone ? 90 : 120, bh = phone ? 220 : 300;
          if (t < DUR + 300) for (var i = 0; i < (phone ? 9 : 18); i++) {
            var a = rand(0, TAU), ex2 = Math.cos(a) * bw * (.55 + p * .5), ey2 = Math.sin(a) * bh * .42;
            flames.push({ x: fx + ex2, y: fy - 40 + ey2, vx: ex2 * .004, vy: -rand(2.5, 5.5) * (.6 + p * .6), s: rand(10, 24) * (.6 + p * .6), l: 1, d: rand(.018, .03), ph: rand(0, 50) });
          }
          var sprHot = sprite('255,240,190'), sprGold = sprite('255,180,40');
          flames = flames.filter(function (f) {
            f.x += f.vx + (noise1(f.ph + t * .004) - .5) * 2.2; f.y += f.vy; f.vy *= .99; f.l -= f.d; f.s *= .985;
            if (f.l <= 0) return false;
            c.save(); c.translate(f.x, f.y); c.scale(.7, 1.6);
            blob(c, f.l > .6 ? sprHot : sprGold, 0, 0, f.s, f.l * fade * .55);
            c.restore();
            return true;
          });
          var core = c.createRadialGradient(fx, fy - 60, 0, fx, fy - 60, bh * .8);
          core.addColorStop(0, 'rgba(255,245,200,' + (.5 * fade * p) + ')'); core.addColorStop(1, 'rgba(255,170,0,0)');
          c.fillStyle = core; c.beginPath(); c.arc(fx, fy - 60, bh * .8, 0, TAU); c.fill();
          /* SSJ2 lightning crawling over the aura */
          for (var q = 0; q < zap.length; q++) {
            if (!zap[q] || now > zap[q].until) { var x0 = fx + rand(-bw * 1.4, bw * 1.4), y0 = fy - rand(0, bh); zap[q] = { b: makeBolt(x0, y0, x0 + rand(-70, 70), y0 + rand(40, 140), 1.1, 1, .15), c: Math.random() < .5 ? '#ffd35a' : '#8fd3ff', until: now + rand(50, 110) }; ion(zap[q].b, .6); }
            drawBolt(c, zap[q].b, zap[q].c, fade);
          }
          /* rocks and dust lifting off the ground */
          /* jagged rocks lifting off the ground, lit gold from the aura side */
          if (t < DUR) for (var k = 0; k < (phone ? 2 : 4); k++) {
            var rs = rand(3, 12), pts = [];
            for (var v = 0; v < 6; v++) { var va = v / 6 * TAU + rand(-.3, .3), vr = rs * rand(.6, 1.1); pts.push([Math.cos(va) * vr, Math.sin(va) * vr * .8]); }
            rocks.push({ x: rand(0, w), y: h + 10, v: rand(1.5, 5), vr: rand(-.08, .08), r: rand(0, 6), p: pts, wob: rand(0, 6) });
          }
          c.globalCompositeOperation = 'source-over';
          rocks = rocks.filter(function (r) {
            r.y -= r.v; r.r += r.vr; r.x += Math.sin(t / 300 + r.wob) * .3;
            c.save(); c.translate(r.x, r.y); c.rotate(r.r); c.globalAlpha = fade;
            c.beginPath(); r.p.forEach(function (q, j) { if (j) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath();
            c.fillStyle = '#3b2c1e'; c.fill(); c.strokeStyle = 'rgba(255,205,110,.55)'; c.lineWidth = 1.2; c.stroke();
            c.restore();
            return r.y > -30;
          });
        });
        sfx('ハアアアア!!', w / 2, h * .3, { cls: 'xl', en: 'SUPER SAIYAN', color: '#ff9f00', life: DUR + 300, rot: -3 });
        shake(6, DUR * .5); later(DUR * .5, function () { shake(14, DUR * .5); });
        later(DUR, function () {
          impact(['neg', 'white', 'neg'], 'gold');
          flash('#fff3c4', 700, .85);
          shockwave(fx, fy - 60, '#ffd35a', Math.max(w, h) * .8, 900);
          root.classList.add('pw-ssj'); on(aura);
          drop(dim, 700); setBusy(false); paint();
          toast('Super Saiyan mode. Tap 超 again to power down.');
        });
      } else { root.classList.add('pw-ssj'); on(aura); }
      store(KEY_SSJ, '1');
    } else {
      root.classList.remove('pw-ssj');
      if (aura) { drop(aura, 1000); aura = null; }
      store(KEY_SSJ, null);
    }
    paint();
  }

  /* ==================================================================
     The dock
     ================================================================== */
  var POWERS = [
    { id: 'chidori', k: '千', name: 'Chidori', sub: 'destroy the page', c: '#5fb4ff', run: chidori },
    { id: 'arise', k: '起', name: 'Arise', sub: 'raise the shadows', c: '#9a6bff', run: arise },
    { id: 'wind', k: '風', name: 'Wind', sub: 'wind release', c: '#4fbf8f', run: wind },
    { id: 'kame', k: '波', name: 'Kamehameha', sub: 'charge and fire', c: '#2d8cff', run: kamehameha },
    { id: 'ssj', k: '超', name: 'Super Saiyan', sub: 'golden aura', c: '#ffc83a', run: function () { if (!busy && !ruin) ssj(!root.classList.contains('pw-ssj'), true); } }
  ];
  var dock = el('div', 'pw-dock');
  dock.innerHTML = '<div class="pw-list" id="pw-list"></div><button type="button" class="pw-toggle" aria-expanded="false" aria-controls="pw-list" aria-label="Powers"><span aria-hidden="true">術</span></button>';
  var list = dock.querySelector('.pw-list'), toggle = dock.querySelector('.pw-toggle'), btn = {};
  POWERS.forEach(function (p, i) {
    var b = el('button', 'pw-item', '<b aria-hidden="true">' + p.k + '</b><span>' + p.name + '<small>' + p.sub + '</small></span>');
    b.type = 'button'; b.style.setProperty('--pw-c', p.c); b.style.setProperty('--i', i);
    b.addEventListener('click', function () { p.run(); });
    btn[p.id] = b; list.appendChild(b);
  });
  var mute = el('button', 'pw-item pw-mute');
  mute.type = 'button'; mute.style.setProperty('--i', POWERS.length);
  mute.addEventListener('click', function () {
    muted = !muted; store(KEY_MUTE, muted ? '1' : null);
    if (muted) Object.keys(loops).forEach(function (n) { stopClip(n, 200); });
    if (AC) { if (muted) AC.suspend(); else AC.resume(); }
    if (!muted) { preload(); if (windOn) clip('wind', 0, true); }
    paint();
  });
  list.appendChild(mute);
  toggle.addEventListener('click', function () { dock.classList.contains('open') ? closeDock() : openDock(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dock.classList.contains('open')) { closeDock(); toggle.focus(); } });
  document.addEventListener('click', function (e) { if (!dock.contains(e.target)) closeDock(); });
  function openDock() {
    dock.classList.add('open'); toggle.setAttribute('aria-expanded', 'true');
    preload();
  }
  function closeDock() { dock.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  function setBusy(b) { busy = b; dock.classList.toggle('pw-busy', b); }
  function paint() {
    btn.chidori.disabled = !!ruin;
    btn.kame.disabled = !!ruin;
    btn.ssj.disabled = !!ruin;
    btn.wind.disabled = !!ruin;
    btn.arise.classList.toggle('pw-ready', !!ruin);
    btn.wind.setAttribute('aria-pressed', windOn ? 'true' : 'false');
    btn.ssj.setAttribute('aria-pressed', root.classList.contains('pw-ssj') ? 'true' : 'false');
    mute.innerHTML = muted ? 'Sound off' : 'Sound on';
    mute.setAttribute('aria-pressed', muted ? 'false' : 'true');
  }

  function start() {
    document.body.appendChild(dock);
    if (store(KEY_SSJ) === '1') ssj(true, false);
    paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  /* page code can trigger any power: XRPowers.chidori() or <button data-power="chidori"> */
  var API = {
    chidori: chidori, arise: arise, wind: wind, kamehameha: kamehameha, 
    ssj: function (onOff) { if (busy || ruin) return; ssj(onOff == null ? !root.classList.contains('pw-ssj') : !!onOff, true); },
    state: function () { return { busy: busy, destroyed: !!ruin, wind: windOn, ssj: root.classList.contains('pw-ssj') }; }
  };
  window.XRPowers = API;
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-power]');
    if (!t || dock.contains(t)) return;
    var fn = API[t.getAttribute('data-power')];
    if (fn) { e.preventDefault(); fn(); }
  });
  document.dispatchEvent(new CustomEvent('xr-powers-ready', { detail: API }));
})();
