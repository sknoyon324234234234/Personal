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
   Sound: recreated in the browser with Web Audio (no copied clips).
   To use your own sound for a power, put the file in the site and set
   its path in XIRAIYA_CONFIG.powerSounds (assets/js/config.js), e.g.
     powerSounds: { chidori: 'assets/sfx/chidori.mp3' }
   A file replaces that power's built-in sound and voice.
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
    var href = s ? s.replace(/js\/powers\.js.*$/, 'css/powers.css') : 'assets/css/powers.css';
    if (!document.querySelector('link[href$="powers.css"]')) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
    }
  })();

  /* ==================================================================
     SOUND — a small cinematic synth: compressor, reverb, distortion.
     Every sound is scheduled against the same clock as the visuals.
     ================================================================== */
  var AC = null, master = null, verb = null, muted = store(KEY_MUTE) === '1', noiseBuf = null;
  function audio() {
    if (muted) return null;
    if (!AC) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try { AC = new Ctx(); } catch (e) { return null; }
      var comp = AC.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = .003; comp.release.value = .25;
      master = AC.createGain(); master.gain.value = .55;
      master.connect(comp); comp.connect(AC.destination);
      /* generated hall reverb */
      verb = AC.createConvolver();
      var len = AC.sampleRate * 2.6, ir = AC.createBuffer(2, len, AC.sampleRate);
      for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      verb.buffer = ir;
      var vg = AC.createGain(); vg.gain.value = .45; verb.connect(vg); vg.connect(master);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      var nd = noiseBuf.getChannelData(0);
      for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function T(when) { return AC.currentTime + (when || 0); }
  function out(node, wet) {
    node.connect(master);
    if (wet) { var g = AC.createGain(); g.gain.value = wet; node.connect(g); g.connect(verb); }
  }
  function env(g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + Math.max(.004, a));
    g.gain.setValueAtTime(peak, t + Math.max(.004, a) + hold);
    g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.004, a) + hold + rel);
  }
  var curves = {};
  function drive(k) {
    if (curves[k]) return curves[k];
    var n = 1024, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / n * 2 - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    return (curves[k] = c);
  }
  function noiseSrc(t, dur) {
    var s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    s.start(t, Math.random() * 1.5); s.stop(t + dur + .1);
    return s;
  }
  /* filtered noise with a filter sweep and an envelope */
  function nz(when, dur, type, f1, f2, peak, q, wet, attack) {
    var a = audio(); if (!a) return;
    var at = attack == null ? Math.min(.02, dur / 5) : attack;
    var t = T(when), s = noiseSrc(t, dur), f = a.createBiquadFilter(), g = a.createGain();
    f.type = type; f.Q.value = q || 1; f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, at, peak, 0, Math.max(.01, dur - at));
    s.connect(f); f.connect(g); out(g, wet);
  }
  /* an oscillator with a pitch sweep and an envelope */
  function osc(when, dur, type, f1, f2, peak, wet, attack, dist) {
    var a = audio(); if (!a) return;
    var at = attack == null ? dur * .1 : attack;
    var t = T(when), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, at, peak, 0, Math.max(.01, dur - at));
    var node = o;
    if (dist) { var ws = a.createWaveShaper(); ws.curve = drive(dist); o.connect(ws); node = ws; }
    node.connect(g); out(g, wet); o.start(t); o.stop(t + dur + .05);
  }
  /* electric crackle: noise gated by random steps, like arcing */
  function crackle(when, dur, f, peak, rate) {
    var a = audio(); if (!a) return;
    var t = T(when), s = noiseSrc(t, dur), bp = a.createBiquadFilter(), g = a.createGain();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = .7;
    g.gain.setValueAtTime(0, t);
    for (var x = 0; x < dur; x += 1 / rate) {
      var p = x / dur, v = Math.random() < .55 ? peak * rand(.2, 1) * Math.min(1, p * 3 + .15) : 0;
      g.gain.setValueAtTime(v, t + x);
    }
    g.gain.setValueAtTime(0, t + dur);
    s.connect(bp); bp.connect(g); out(g, .15);
  }
  /* high-voltage buzz: detuned saws through a hard clipper */
  function buzz(when, dur, f, peak) {
    var a = audio(); if (!a) return;
    var t = T(when), g = a.createGain(), ws = a.createWaveShaper(), bp = a.createBiquadFilter(), lfo = a.createOscillator(), lg = a.createGain();
    ws.curve = drive(40); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .6;
    lfo.frequency.value = 34; lg.gain.value = peak * .45; lfo.connect(lg); lg.connect(g.gain);
    [f, f * 1.012, f * 2.01].forEach(function (fr) { var o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(fr, t); o.frequency.linearRampToValueAtTime(fr * 1.6, t + dur); o.connect(ws); o.start(t); o.stop(t + dur + .05); });
    env(g, t, dur * .6, peak, dur * .35, .08);
    ws.connect(bp); bp.connect(g); out(g, .1); lfo.start(t); lfo.stop(t + dur + .05);
  }
  var SND = {
    /* Chidori: a thousand birds. Crackle and buzz build, chirps get
       denser, then a thunderclap, glass and falling rubble. */
    chidoriCharge: function (dur) {
      crackle(0, dur, 4200, .55, 70);
      crackle(.1, dur - .1, 2600, .4, 45);
      buzz(0, dur, 92, .22);
      for (var t = 0; t < dur;) {
        var p = t / dur;
        osc(t, .05, 'sine', rand(4200, 6800), rand(2200, 3400), .12 + p * .12, .15, .004);
        t += Math.max(.022, .12 - p * .1) * rand(.6, 1.3);
      }
    },
    thunder: function (when) {
      when = when || 0;
      nz(when, .14, 'highpass', 5000, 1500, 1, .7, .4, .002);
      nz(when + .02, 2.6, 'lowpass', 1800, 70, .95, .8, .6, .01);
      osc(when, 1.4, 'sine', 95, 28, 1, .2, .005, 3);
      crackle(when + .05, .9, 3000, .5, 90);
    },
    glass: function (when) {
      for (var i = 0; i < 26; i++) nz((when || 0) + rand(0, .7), rand(.05, .18), 'bandpass', rand(4000, 9500), rand(3000, 8000), rand(.15, .4), 18, .5, .002);
    },
    rubble: function (when) {
      for (var i = 0; i < 18; i++) nz((when || 0) + rand(0, 1.6), rand(.12, .35), 'lowpass', rand(400, 1200), 90, rand(.2, .55), 1, .3, .005);
    },
    /* Arise: a sub drop, a swelling drone, a reversed rush into the
       word, a metallic hit, then a rising choir and a shing. */
    arise: function () {
      osc(0, 1.2, 'sine', 90, 32, .9, .3, .01);
      [55, 55.6, 82.4].forEach(function (f) { osc(0, 4.2, 'sawtooth', f, f * 1.01, .12, .5, 1.5); });
      nz(0, 4, 'lowpass', 150, 900, .25, 1, .5, 1.5);
      nz(.15, .75, 'bandpass', 300, 3500, .7, 1.2, .3, .72);
      osc(.9, 2.4, 'sine', 220, 214, .35, .8, .003);
      osc(.9, 2.2, 'sine', 331, 327, .22, .8, .003);
      osc(.9, 1.8, 'sine', 523, 519, .15, .8, .003);
      osc(.9, 1.1, 'sine', 70, 30, 1, .3, .004, 4);
      crackle(.9, 1.4, 3400, .35, 60);
    },
    ariseRise: function () {
      var a = audio(); if (!a) return;
      [220, 261.6, 329.6, 440].forEach(function (f, i) {
        var t = T(0), o = a.createOscillator(), f1 = a.createBiquadFilter(), g = a.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f / 2, t); o.frequency.exponentialRampToValueAtTime(f, t + 1.6);
        f1.type = 'bandpass'; f1.frequency.value = i % 2 ? 1100 : 750; f1.Q.value = 4;
        env(g, t, 1.2, .12, .4, .9); o.connect(f1); f1.connect(g); out(g, .8); o.start(t); o.stop(t + 2.6);
      });
      nz(0, 1.6, 'highpass', 600, 5000, .3, 1, .6, 1.4);
    },
    /* souls leaving the bodies: rising ghostly wails over a rushing wind */
    souls: function (dur) {
      nz(0, dur, 'bandpass', 300, 2600, .45, 3, .6, dur * .5);
      for (var i = 0; i < 4; i++) {
        var f = rand(300, 520);
        osc(i * .2, dur - i * .15, 'triangle', f, f * rand(1.6, 2.2), .06, .9, .4);
      }
      crackle(0, dur, 2200, .15, 30);
    },
    shing: function (when) {
      osc(when || 0, 1.6, 'sine', 2637, 2600, .22, .9, .002);
      osc(when || 0, 1.3, 'sine', 3951, 3900, .14, .9, .002);
      nz(when || 0, .5, 'highpass', 6000, 9000, .25, 1, .5, .002);
    },
    /* Wind: whistling gusts with a sweeping resonant filter */
    gust: function (when, dur) {
      nz(when, dur, 'bandpass', 380, 1500, .5, 7, .3, dur * .45);
      nz(when + dur * .3, dur * .7, 'bandpass', 1400, 520, .35, 9, .3, .2);
      nz(when, dur, 'lowpass', 300, 900, .45, .7, .2, dur * .4);
      for (var i = 0; i < 10; i++) nz(when + rand(0, dur), .08, 'highpass', 5000, 7000, .08, 1, .1, .005);
    },
    /* Kamehameha: a rising, wobbling whine and rumble while it charges,
       then a crack and a sustained roar for the length of the beam. */
    kameCharge: function (dur) {
      var a = audio(); if (!a) return;
      var t = T(0), o = a.createOscillator(), vib = a.createOscillator(), vg = a.createGain(), g = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(880, t + dur);
      vib.frequency.setValueAtTime(5, t); vib.frequency.linearRampToValueAtTime(14, t + dur);
      vg.gain.setValueAtTime(4, t); vg.gain.linearRampToValueAtTime(40, t + dur);
      vib.connect(vg); vg.connect(o.frequency);
      env(g, t, dur * .9, .28, dur * .1, .05);
      o.connect(g); out(g, .4); o.start(t); o.stop(t + dur + .1); vib.start(t); vib.stop(t + dur + .1);
      nz(0, dur, 'bandpass', 1500, 6500, .25, 2, .3, dur * .9);
      nz(0, dur, 'lowpass', 90, 260, .6, 1, .2, dur * .9);
      crackle(dur * .4, dur * .6, 3800, .3, 40);
    },
    kameFire: function (dur) {
      nz(0, .12, 'highpass', 4000, 1200, 1, .7, .3, .002);
      var a = audio(); if (!a) return;
      var t = T(0), s = noiseSrc(t, dur + 1), lp = a.createBiquadFilter(), ws = a.createWaveShaper(), g = a.createGain();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur + .8);
      ws.curve = drive(8);
      env(g, t, .03, .9, dur - .2, 1);
      s.connect(lp); lp.connect(ws); ws.connect(g); out(g, .4);
      osc(0, dur + .8, 'sawtooth', 58, 40, .35, .2, .03, 6);
      osc(0, 1.5, 'sine', 80, 30, 1, .3, .004);
    },
    /* Super Saiyan: rumble, a formant "aaah" scream rising, crackles,
       then a golden burst. */
    ssj: function (dur) {
      nz(0, dur, 'lowpass', 70, 200, .7, 1, .2, dur * .6);
      var a = audio(); if (!a) return;
      var t = T(0);
      [[800, 5], [1150, 6], [2400, 8]].forEach(function (fm) {
        var o = a.createOscillator(), bp = a.createBiquadFilter(), g = a.createGain(), vib = a.createOscillator(), vg = a.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(260, t + dur);
        vib.frequency.value = 7; vg.gain.value = 6; vib.connect(vg); vg.connect(o.frequency);
        bp.type = 'bandpass'; bp.frequency.value = fm[0]; bp.Q.value = fm[1];
        env(g, t, dur * .7, .3, dur * .25, .15);
        o.connect(bp); bp.connect(g); out(g, .5); o.start(t); o.stop(t + dur + .2); vib.start(t); vib.stop(t + dur + .2);
      });
      crackle(.2, dur, 3600, .45, 55);
      nz(dur, .1, 'highpass', 4000, 1500, 1, .7, .4, .002);
      osc(dur, 1.4, 'sine', 90, 30, 1, .4, .004, 3);
      SND.shing(dur + .05);
    }
  };

  /* voice lines, recreated with the browser's own speech engine */
  function say(text, when, pitch, rate) {
    if (muted || !('speechSynthesis' in window)) return;
    later(when || 0, function () {
      try {
        var u = new SpeechSynthesisUtterance(text), vs = speechSynthesis.getVoices();
        var v = vs.filter(function (x) { return /^en/i.test(x.lang) && /male|daniel|alex|fred|david|guy|george/i.test(x.name) && !/female/i.test(x.name); })[0] || vs.filter(function (x) { return /^en/i.test(x.lang); })[0];
        if (v) u.voice = v;
        u.pitch = pitch == null ? .2 : pitch; u.rate = rate || .8; u.volume = 1;
        speechSynthesis.speak(u);
      } catch (e) {}
    });
  }
  if ('speechSynthesis' in window) try { speechSynthesis.getVoices(); } catch (e) {}

  /* your own sound files, if set in XIRAIYA_CONFIG.powerSounds */
  var buffers = {};
  function soundFile(id) { var c = (window.XIRAIYA_CONFIG || {}).powerSounds || {}; return c[id] || ''; }
  function loadFile(id) {
    var url = soundFile(id), a = audio();
    if (!url || !a) return null;
    if (!buffers[url]) buffers[url] = fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (b) { return new Promise(function (ok, no) { a.decodeAudioData(b, ok, no); }); });
    return buffers[url];
  }
  /* plays the user's file for this power; returns true if one is set */
  function custom(id) {
    var p = loadFile(id);
    if (!p) return false;
    p.then(function (buf) { var s = AC.createBufferSource(); s.buffer = buf; s.connect(master); s.start(); }).catch(function () {});
    return true;
  }

  /* ==================================================================
     CANVAS — one effect canvas + a blurred copy for bloom
     ================================================================== */
  var cv = null, cx = null, glow = null, gx = null, W = 0, H = 0, DPR = 1, layers = [], raf = 0;
  var GS = phone ? .25 : .33;
  function resize() {
    if (!cv) return;
    W = vw(); H = vh(); DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    cv.width = W * DPR; cv.height = H * DPR;
    glow.width = Math.ceil(W * GS); glow.height = Math.ceil(H * GS);
  }
  function canvas() {
    if (!cv) {
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
  function loop(now) {
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx.clearRect(0, 0, W, H);
    layers = layers.filter(function (f) { cx.save(); var r = f(cx, Math.max(0, now - f.t0), now); cx.restore(); return r !== false; });
    gx.clearRect(0, 0, glow.width, glow.height);
    if (layers.length) gx.drawImage(cv, 0, 0, glow.width, glow.height);
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
      frames.push({ transform: 'translate(' + rand(-k, k).toFixed(1) + 'px,' + rand(-k, k).toFixed(1) + 'px) rotate(' + (rand(-k, k) / 10).toFixed(2) + 'deg)' });
    }
    frames.push({ transform: 'none' });
    shakeTargets().forEach(function (t) { t.animate(frames, { duration: ms, easing: 'linear' }); });
  }
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
  function isOurs(n) { return n.className && typeof n.className === 'string' && /(^|\s)(pw-|toasts|curtain|loader|skip|grain|progress)/.test(n.className); }
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
    lock(true);
    var dim = overlay('pw-dim'); dim.style.setProperty('--px', ex + 'px'); dim.style.setProperty('--py', ey + 'px'); on(dim);
    if (!custom('chidori')) { SND.chidoriCharge(HIT / 1000); SND.thunder(HIT / 1000); SND.glass(HIT / 1000 + .05); SND.rubble(HIT / 1000 + .3); }

    var sparks = [], trail = [], arcs = [];
    for (var i = 0; i < (phone ? 7 : 12); i++) arcs.push({ b: null, until: 0 });
    layer(function (c, t, now) {
      if (t > HIT + 380) return false;
      var p = Math.min(1, t / CHARGE), d = t < CHARGE ? 0 : ease(Math.min(1, (t - CHARGE) / DASH));
      var x = sx + (ex - sx) * d, y = sy + (ey - sy) * d;
      trail.push([x, y]); if (trail.length > 14) trail.shift();
      /* focus lines tighten as the charge peaks */
      if (!reduce) focusLines(c, x, y, 140 - p * 50, 'rgba(210,235,255,1)', phone ? 40 : 80, .12 + p * .2);
      c.globalCompositeOperation = 'lighter';
      /* orb core */
      var R = 14 + p * 30 + Math.sin(t / 25) * 4;
      var g = c.createRadialGradient(x, y, 0, x, y, R * 3.4);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(200,235,255,1)'); g.addColorStop(.45, 'rgba(70,150,255,.55)'); g.addColorStop(1, 'rgba(20,80,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R * 3.4, 0, TAU); c.fill();
      /* arcs spraying from the hand, each holding a few frames */
      var n = Math.min(arcs.length, 3 + Math.round(p * arcs.length));
      for (var k = 0; k < n; k++) {
        var A = arcs[k];
        if (!A.b || now > A.until || d > 0) {
          var a = rand(0, TAU), len = rand(40, 80 + p * (phone ? 140 : 240));
          A.b = makeBolt(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, rand(.8, 1.6), 1, .12);
          A.until = now + rand(40, 90);
        }
        drawBolt(c, A.b, '#4aa8ff', .9);
      }
      /* dashing: lightning dragged along the ground behind the hand */
      if (d > 0 && d < 1) {
        for (var j = 0; j < trail.length - 1; j += 3) {
          var tp = trail[j];
          drawBolt(c, makeBolt(tp[0], tp[1], tp[0] + rand(-30, 30), h * .93 + rand(-10, 10), 1.2, 1, .1), '#4aa8ff', .7);
        }
        for (var q = 0; q < 6; q++) sparks.push({ x: x, y: h * .93, vx: rand(-12, -2), vy: rand(-9, -2), l: 1 });
      }
      if (Math.random() < .7) sparks.push({ x: x, y: y, vx: rand(-7, 7), vy: rand(-8, 3), l: 1 });
      c.fillStyle = '#d6f0ff';
      sparks = sparks.filter(function (s) { s.x += s.vx; s.y += s.vy; s.vy += .35; s.l -= .035; c.globalAlpha = Math.max(0, s.l); c.fillRect(s.x, s.y, 2.6, 2.6); return s.l > 0; });
    });
    later(250, function () { sfx('千鳥', w / 2, h * (phone ? .24 : .2), { cls: 'xl', en: 'CHIDORI', color: '#2d8cff', life: 1400, rot: -6 }); });
    later(650, function () { sfx('チチチチチ', w * (phone ? .7 : .72), h * .66, { cls: 'sm', color: '#2d8cff', life: 1000 }); });
    later(1000, function () { sfx('バチバチ', w * (phone ? .28 : .3), h * .42, { cls: 'sm', color: '#2d8cff', life: 800, rot: 8 }); });

    later(HIT, function () {
      impact(['neg', 'black', 'neg', 'black'], null);
      flash('#e8f4ff', 600, .85);
      shake(phone ? 18 : 30, 800);
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
  }

  var ruinParts = [];
  function cracks(px, py) {
    var w = vw(), h = vh(), NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'pw-cracks'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('aria-hidden', 'true');
    var d = '', n = phone ? 9 : 14;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * TAU + rand(-.25, .25), x = px, y = py, len = Math.max(w, h) * rand(.4, .9), steps = 7;
      d += 'M' + x.toFixed(0) + ' ' + y.toFixed(0);
      for (var s = 0; s < steps; s++) {
        a += rand(-.35, .35); x += Math.cos(a) * len / steps; y += Math.sin(a) * len / steps;
        d += 'L' + x.toFixed(0) + ' ' + y.toFixed(0);
        if (Math.random() < .35) { var b = a + rand(-1, 1); d += 'M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'l' + (Math.cos(b) * 60).toFixed(0) + ' ' + (Math.sin(b) * 60).toFixed(0) + 'M' + x.toFixed(0) + ' ' + y.toFixed(0); }
      }
    }
    for (var ring = 1; ring <= 3; ring++) {
      var rr = ring * (phone ? 70 : 110);
      d += 'M' + (px + rr) + ' ' + py;
      for (var k = 1; k <= 12; k++) { var aa = k / 12 * TAU; d += 'L' + (px + Math.cos(aa) * rr * rand(.85, 1.15)).toFixed(0) + ' ' + (py + Math.sin(aa) * rr * rand(.85, 1.15)).toFixed(0); }
    }
    svg.innerHTML = '<path d="' + d + '" stroke="rgba(120,190,255,.55)" stroke-width="7"/><path d="' + d + '" stroke="#05040a" stroke-width="3.2"/><path d="' + d + '" stroke="rgba(230,245,255,.8)" stroke-width="1"/>';
    document.body.appendChild(svg);
    Array.prototype.forEach.call(svg.querySelectorAll('path'), function (p) {
      p.style.strokeDasharray = 6000; p.animate([{ strokeDashoffset: 6000 }, { strokeDashoffset: 0 }], { duration: reduce ? 1 : 700, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    });
    ruinParts.push(svg);
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
      var end = 'translate(' + ex.toFixed(0) + 'px,' + ey.toFixed(0) + 'px) rotate(' + rot.toFixed(0) + 'deg)';
      var endFilter = 'brightness(.5) saturate(.4)';
      var delay = Math.min(260, dist / 6) + rand(0, 80);
      var kf = reduce ? [{ opacity: 1 }, { opacity: 0 }] : [
        { transform: 'none', filter: 'none', easing: 'cubic-bezier(.1,.7,.3,1)' },
        { transform: 'translate(' + bx.toFixed(0) + 'px,' + by.toFixed(0) + 'px) rotate(' + (rot * .45).toFixed(0) + 'deg)', filter: 'brightness(1.8)', offset: .32, easing: 'cubic-bezier(.55,0,.9,.5)' },
        { transform: end, filter: endFilter, offset: .9, easing: 'ease-out' },
        { transform: end.replace(/rotate\(([-\d]+)deg\)/, function (m, dd) { return 'rotate(' + (+dd + rand(-4, 4)).toFixed(0) + 'deg)'; }), filter: endFilter }
      ];
      if (phone) kf.forEach(function (k) { delete k.filter; });
      var a = p.el.animate(kf, { duration: reduce ? 500 : rand(1300, 1900), delay: reduce ? 0 : delay, fill: 'both' });
      anims.push({ el: p.el, a: a, end: end, top: r.top });
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
    if (!muted && AC) { osc(0, .25, 'sine', 1320, 1320, .12, .3, .004); osc(.08, .3, 'sine', 1760, 1760, .1, .3, .004); }
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
    var w = vw(), h = vh(), own = custom('arise');
    var count = restoring ? ruin.anims.length : 0;
    if (!own) { SND.arise(); say('Arise', 820, .05, .7); }
    var sh = overlay('pw-shadow'); on(sh);
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
      impact(['neg', 'black', 'neg'], 'violet');
      shockwave(w / 2, h, '#9a6bff', Math.max(w, h), 1100);
      shake(10, 900);
      sfx('ARISE', w / 2, h * .3, { cls: 'xl pw-arise-word', en: '起きろ', life: 1900, rot: 0 });
    });

    shadowArmy(restoring ? 5600 : 3800);

    if (!restoring) {
      later(1500, function () {
        if (!own) SND.souls(1.6);
        sys = sysWindow('SYSTEM', ['No fallen enemies found.', 'Summoning your standing shadow army instead.']);
      });
      later(3600, function () {
        drop(sh, 800); drop(seal, 800);
        if (!own) SND.shing(0);
        if (sys) sys.close(0);
        setBusy(false); paint();
        toast('Use Chidori first, then Arise will extract the fallen page.');
      });
      return;
    }

    /* 3 → souls torn out of the fallen */
    later(1300, function () {
      if (!own) SND.souls(1.8);
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
      if (!own) SND.ariseRise();
      sh.classList.add('thin');
      ruinParts.forEach(function (p) { p.style.transition = 'opacity 1.2s'; p.style.opacity = '0'; });
      ruin.anims.forEach(function (p) {
        var d = reduce ? 0 : Math.max(0, (h - p.top) / h) * 600 + rand(0, 300);
        var mid = p.end.replace(/translate\(([-\d.]+)px,([-\d.]+)px\) rotate\(([-\d.]+)deg\)/, function (m, x, y, r) {
          return 'translate(' + (x * .35).toFixed(0) + 'px,' + (y * .35 - rand(30, 90)).toFixed(0) + 'px) rotate(' + (r * .25).toFixed(0) + 'deg)';
        });
        var kf = reduce ? [{ opacity: 0 }, { opacity: 1 }] : [
          { transform: p.end, filter: SHADOW, easing: 'cubic-bezier(.5,0,.3,1)' },
          { transform: mid + ' scale(1.04)', filter: SHADOW, offset: .55, easing: 'cubic-bezier(.2,.7,.2,1)' },
          { transform: 'translate(0,-10px) scale(1.02)', filter: SHADOW, offset: .82, easing: 'cubic-bezier(.3,0,.3,1)' },
          { transform: 'translate(0,5px) scale(.99)', filter: SHADOW, offset: .92 },
          { transform: 'none', filter: SHADOW }
        ];
        p.rise = p.el.animate(kf, { duration: reduce ? 400 : rand(1300, 1700), delay: d, fill: 'forwards' });
        done.push(p.rise.finished.catch(function () {}));
      });

      /* 5 → awaken: a violet sweep brings the colour back, top to bottom */
      Promise.all(done).then(function () {
        var SWEEP = reduce ? 300 : 1100;
        awakenSweep(SWEEP);
        if (!own) SND.shing(0);
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
          drop(sh, 800); drop(seal, 800);
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
    var own = custom('wind');
    if (!own) SND.gust(0, 2.4);
    var gust = setInterval(function () { if (windOn && !own) SND.gust(0, rand(1.8, 2.8)); }, 2500);
    var dark = root.getAttribute('data-mode') === 'ink';
    var streak = dark ? 'rgba(230,240,255,1)' : 'rgba(40,70,90,1)';
    var LEAF = ['#e8a1b0', '#f3c3cc', '#7fae5a', '#a9c96e', '#d9a441'];
    var lines = [], leaves = [], vort = [], NL = phone ? 26 : 60, NV = phone ? 18 : 42;
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
      if (!windOn) { clearInterval(gust); return false; }
      var Wd = vw(), Hd = vh();
      c.lineCap = 'round'; c.strokeStyle = streak;
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
        f.x += f.v; f.y += Math.sin(t / 300 + f.wob) * 1.8 + .6; f.r += f.vr;
        if (f.x > Wd + 30 || f.y > Hd + 30) leaves[i] = newLeaf(false);
        c.save(); c.translate(f.x, f.y); c.rotate(f.r); c.scale(1, Math.abs(Math.sin(t / 200 + f.wob)) * .8 + .2); c.globalAlpha = .9 * fade; c.fillStyle = f.c;
        c.beginPath(); c.ellipse(0, 0, f.s, f.s * .45, 0, 0, TAU); c.fill(); c.restore();
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
    var own = custom('kamehameha');
    if (!own) SND.kameCharge(CHARGE / 1000);
    ['か', 'め', 'は', 'め'].forEach(function (ch, i) {
      later(i * STEP, function () {
        var tx = portrait ? w * (.2 + i * .2) : ox + 60 + i * Math.min(130, w * .09);
        var ty = portrait ? h * .5 : oy - 160 - (i % 2) * 44;
        sfx(ch, tx, ty, { color: '#2d8cff', life: CHARGE - i * STEP + 200, rot: rand(-12, 12) });
        shake(2 + i * 2.5, STEP);
        if (!own) say(['Ka', 'me', 'ha', 'me'][i], 0, .6 - i * .05, 1);
      });
    });
    var bits = [], dust = [], zaps = [];
    for (var z = 0; z < (phone ? 4 : 7); z++) zaps.push(null);
    layer(function (c, t, now) {
      if (t > CHARGE + BEAM + 700) return false;
      var p = Math.min(1, t / CHARGE), fire = t > CHARGE, bt = t - CHARGE;
      if (!fire && !reduce) focusLines(c, ox, oy, 120 - p * 40, 'rgba(200,230,255,1)', phone ? 36 : 70, .08 + p * .18);
      c.globalCompositeOperation = 'lighter';
      /* energy spiralling into the palms */
      if (t < CHARGE) for (var k = 0; k < (phone ? 4 : 8); k++) bits.push({ a: rand(0, TAU), r: rand(120, 340), v: rand(.08, .14) });
      c.strokeStyle = '#a8dcff'; c.lineWidth = 2;
      bits = bits.filter(function (b) {
        var x0 = ox + Math.cos(b.a) * b.r, y0 = oy + Math.sin(b.a) * b.r;
        b.a += b.v * 2; b.r *= .9;
        c.globalAlpha = .8; c.beginPath(); c.moveTo(x0, y0); c.lineTo(ox + Math.cos(b.a) * b.r, oy + Math.sin(b.a) * b.r); c.stroke();
        return b.r > 8;
      });
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
      c.translate(ox, oy); c.rotate(ang);
      var gr = c.createLinearGradient(0, -hh * 1.3, 0, hh * 1.3);
      gr.addColorStop(0, 'rgba(30,110,255,0)'); gr.addColorStop(.2, 'rgba(40,130,255,.45)'); gr.addColorStop(.38, 'rgba(120,210,255,.95)');
      gr.addColorStop(.5, '#ffffff'); gr.addColorStop(.62, 'rgba(120,210,255,.95)'); gr.addColorStop(.8, 'rgba(40,130,255,.45)'); gr.addColorStop(1, 'rgba(30,110,255,0)');
      c.fillStyle = gr; c.globalAlpha = 1; c.beginPath(); c.moveTo(0, -hh * .5);
      for (var x = 0; x <= L; x += 22) c.lineTo(x, -hh * 1.3 * (1 + Math.sin(x * .03 - bt * .045) * .08));
      c.lineTo(L, hh * 1.3);
      for (var x2 = L; x2 >= 0; x2 -= 22) c.lineTo(x2, hh * 1.3 * (1 + Math.sin(x2 * .03 + bt * .05) * .08));
      c.lineTo(0, hh * .5); c.closePath(); c.fill();
      /* spiralling energy around the beam */
      c.strokeStyle = '#dff3ff'; c.lineWidth = 1.4; c.globalAlpha = .28 * thin;
      for (var sI = 0; sI < 3; sI++) {
        c.beginPath();
        for (var sx2 = 0; sx2 <= L; sx2 += 14) { var yy = Math.sin(sx2 * (.012 + sI * .006) - bt * .03 + sI * 2) * hh * (.9 + Math.sin(sx2 * .01 + sI) * .2); if (sx2 === 0) c.moveTo(sx2, yy); else c.lineTo(sx2, yy); }
        c.stroke();
      }
      c.globalAlpha = .85 * thin; c.lineWidth = 2;
      for (var s = 0; s < 10; s++) { var y3 = rand(-hh * .9, hh * .9), xs = rand(0, L); c.beginPath(); c.moveTo(xs, y3); c.lineTo(xs + rand(60, 240), y3); c.stroke(); }
      if (grow < 1) { var hg = c.createRadialGradient(L, 0, 0, L, 0, hh * 2); hg.addColorStop(0, '#fff'); hg.addColorStop(1, 'rgba(60,150,255,0)'); c.fillStyle = hg; c.beginPath(); c.arc(L, 0, hh * 2, 0, TAU); c.fill(); }
    });
    later(CHARGE, function () {
      if (!own) { SND.kameFire(BEAM / 1000); say('HAAAAAA', 0, .5, .6); }
      impact(['neg', 'white', 'neg'], null);
      flash('#dff1ff', 420, .7); shake(phone ? 14 : 22, BEAM);
      shockwave(ox, oy, '#6ab8ff', Math.max(w, h) * .6, 800);
      later(260, function () { shockwave(ox, oy, '#6ab8ff', Math.max(w, h) * .45, 700); });
      sfx('波ァァァ!!', portrait ? w / 2 : w * .55, portrait ? h * .3 : oy - (phone ? 90 : 180), { cls: 'xl', en: 'KAMEHAMEHA', color: '#2d8cff', life: BEAM + 200, rot: -5 });
      blast(ox, oy, ang, portrait ? w * .22 : h * .15);
    });
    later(CHARGE + BEAM + 450, function () {
      drop(dim, 500);
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
        if (!custom('ssj')) { SND.ssj(DUR / 1000); say('HAAAAAAAA', 100, .9, .5); }
        var rocks = [], zap = [];
        for (var z = 0; z < (phone ? 3 : 6); z++) zap.push(null);
        layer(function (c, t, now) {
          if (t > DUR + 700) return false;
          var p = Math.min(1, t / DUR), fade = t > DUR ? 1 - (t - DUR) / 700 : 1;
          if (!reduce) focusLines(c, fx, fy - 60, 150, 'rgba(255,230,150,1)', phone ? 36 : 70, (.1 + p * .2) * fade);
          c.globalCompositeOperation = 'lighter';
          /* golden flame aura around the body */
          var n = phone ? 22 : 38, bw = phone ? 90 : 120, bh = phone ? 220 : 300;
          for (var i = 0; i < n; i++) {
            var a = i / n * Math.PI + Math.PI, bx = fx + Math.cos(a) * bw * (.6 + p * .4), by = fy + Math.sin(a) * bh * .3;
            var fh = (60 + p * bh) * rand(.5, 1.1), sw = rand(10, 22);
            var g = c.createLinearGradient(bx, by, bx, by - fh);
            g.addColorStop(0, 'rgba(255,240,170,' + (.55 * fade) + ')'); g.addColorStop(.6, 'rgba(255,190,40,' + (.35 * fade) + ')'); g.addColorStop(1, 'rgba(255,140,0,0)');
            c.fillStyle = g; c.beginPath(); c.moveTo(bx - sw, by); c.quadraticCurveTo(bx - sw * .4, by - fh * .6, bx + rand(-8, 8), by - fh); c.quadraticCurveTo(bx + sw * .4, by - fh * .6, bx + sw, by); c.fill();
          }
          var core = c.createRadialGradient(fx, fy - 60, 0, fx, fy - 60, bh * .8);
          core.addColorStop(0, 'rgba(255,245,200,' + (.5 * fade * p) + ')'); core.addColorStop(1, 'rgba(255,170,0,0)');
          c.fillStyle = core; c.beginPath(); c.arc(fx, fy - 60, bh * .8, 0, TAU); c.fill();
          /* SSJ2 lightning crawling over the aura */
          for (var q = 0; q < zap.length; q++) {
            if (!zap[q] || now > zap[q].until) { var x0 = fx + rand(-bw * 1.4, bw * 1.4), y0 = fy - rand(0, bh); zap[q] = { b: makeBolt(x0, y0, x0 + rand(-70, 70), y0 + rand(40, 140), 1.1, 1, .15), c: Math.random() < .5 ? '#ffd35a' : '#8fd3ff', until: now + rand(50, 110) }; }
            drawBolt(c, zap[q].b, zap[q].c, fade);
          }
          /* rocks and dust lifting off the ground */
          if (t < DUR) for (var k = 0; k < (phone ? 2 : 4); k++) rocks.push({ x: rand(0, w), y: h + 10, v: rand(1.5, 5), s: rand(3, 9), r: rand(0, 6) });
          c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(60,45,30,.9)';
          rocks = rocks.filter(function (r) { r.y -= r.v; r.r += .05; c.save(); c.translate(r.x, r.y); c.rotate(r.r); c.globalAlpha = fade; c.fillRect(-r.s / 2, -r.s / 2, r.s, r.s * .7); c.restore(); return r.y > -20; });
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
    if (AC) { if (muted) AC.suspend(); else AC.resume(); }
    if (muted && 'speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) {}
    paint();
  });
  list.appendChild(mute);
  toggle.addEventListener('click', function () { dock.classList.contains('open') ? closeDock() : openDock(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dock.classList.contains('open')) { closeDock(); toggle.focus(); } });
  document.addEventListener('click', function (e) { if (!dock.contains(e.target)) closeDock(); });
  function openDock() {
    dock.classList.add('open'); toggle.setAttribute('aria-expanded', 'true');
    ['chidori', 'arise', 'wind', 'kamehameha', 'ssj'].forEach(loadFile);
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
