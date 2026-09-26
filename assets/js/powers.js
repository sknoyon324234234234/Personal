/* =====================================================================
   XIRAIYA — power dock. Five techniques that work on every page:
     千鳥 Chidori      charges lightning and shatters the page into rubble
     起きろ Arise      raises the rubble back as shadows, then restores it
     風 Wind          a gust of streaks and leaves that sways the page
     かめはめ波        charges and fires a Kamehameha beam, then powers up
     超 Super Saiyan  golden aura mode, remembered across pages
   Everything is drawn on one canvas plus Web Animations on real elements,
   so nothing is copied and the page comes back exactly as it was.
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

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; }
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function vw() { return window.innerWidth; }
  function vh() { return window.innerHeight; }
  function toast(msg) { if (window.XR && window.XR.toast) window.XR.toast(msg); }

  /* stylesheet: one include line per page is enough */
  (function () {
    var s = document.currentScript && document.currentScript.src;
    var href = s ? s.replace(/js\/powers\.js.*$/, 'css/powers.css') : 'assets/css/powers.css';
    if (!document.querySelector('link[href$="powers.css"]')) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
    }
  })();

  /* ------------------------------------------------------------------
     Sound: a tiny synth, only ever started by a click
     ------------------------------------------------------------------ */
  var AC = null, master = null, muted = store(KEY_MUTE) === '1', noiseBuf = null;
  function audio() {
    if (muted) return null;
    if (!AC) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try { AC = new Ctx(); } catch (e) { return null; }
      master = AC.createGain(); master.gain.value = .32; master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function noise(dur, type, f1, f2, g1, when) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (when || 0);
    var src = a.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var f = a.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + dur); f.Q.value = 1.2;
    var g = a.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(g1, t + Math.min(.05, dur / 4)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + dur + .05);
  }
  function tone(dur, type, f1, f2, g1, when) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (when || 0);
    var o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    var g = a.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(g1, t + dur * .2); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  var SND = {
    chirp: function (dur) { for (var i = 0; i < dur * 22; i++) noise(.05, 'bandpass', rand(2600, 5200), rand(3000, 6000), rand(.25, .6), i / 22 + rand(0, .03)); },
    boom: function () { noise(1.6, 'lowpass', 900, 60, 1, 0); tone(1.2, 'sine', 90, 30, .9, 0); },
    crumble: function () { for (var i = 0; i < 14; i++) noise(.25, 'lowpass', rand(300, 900), 120, rand(.2, .5), .2 + i * rand(.06, .14)); },
    whoosh: function (dur) { noise(dur, 'bandpass', 250, 1400, .5, 0); noise(dur * .8, 'bandpass', 900, 300, .3, dur * .3); },
    charge: function (dur) { tone(dur, 'sawtooth', 70, 380, .22, 0); tone(dur, 'sine', 140, 760, .2, 0); },
    beam: function () { noise(1.8, 'bandpass', 500, 180, .9, 0); tone(1.6, 'square', 110, 55, .25, 0); },
    drone: function (dur) { tone(dur, 'sawtooth', 55, 52, .2, 0); tone(dur, 'sawtooth', 55.8, 110, .16, .2); noise(dur, 'lowpass', 120, 900, .25, 0); },
    rise: function () { tone(1.6, 'triangle', 110, 440, .3, 0); noise(1.2, 'highpass', 800, 4000, .2, .3); },
    power: function () { tone(1.4, 'sawtooth', 90, 300, .2, 0); noise(1.6, 'bandpass', 400, 2400, .45, 0); }
  };

  /* ------------------------------------------------------------------
     One canvas, many layers. A layer returns false when it is done.
     ------------------------------------------------------------------ */
  var cv = null, cx = null, W = 0, H = 0, DPR = 1, layers = [], raf = 0;
  function resize() {
    if (!cv) return;
    W = vw(); H = vh(); DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    cv.width = W * DPR; cv.height = H * DPR;
  }
  function canvas() {
    if (!cv) {
      cv = el('canvas', 'pw-canvas'); cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv); cx = cv.getContext('2d');
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
    layers = layers.filter(function (f) { cx.save(); var r = f(cx, now - f.t0, now); cx.restore(); return r !== false; });
    raf = layers.length ? requestAnimationFrame(loop) : 0;
  }

  /* jagged lightning between two points */
  function bolt(x1, y1, x2, y2, disp, out) {
    out = out || [[x1, y1]];
    if (disp < 3) { out.push([x2, y2]); return out; }
    var mx = (x1 + x2) / 2 + rand(-.5, .5) * disp, my = (y1 + y2) / 2 + rand(-.5, .5) * disp;
    bolt(x1, y1, mx, my, disp / 2, out); bolt(mx, my, x2, y2, disp / 2, out);
    return out;
  }
  function strokeBolt(c, pts, color, width) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = color; c.globalAlpha = .35; c.lineWidth = width * 4; c.stroke();
    c.strokeStyle = '#ffffff'; c.globalAlpha = 1; c.lineWidth = width; c.stroke();
  }

  /* ------------------------------------------------------------------
     Overlays, manga SFX, screen shake, flash
     ------------------------------------------------------------------ */
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
    var rot = opt.rot == null ? rand(-10, 10) : opt.rot;
    var life = opt.life || 900;
    var a = s.animate([
      { transform: 'translate(-50%,-50%) scale(2.4) rotate(' + rot + 'deg)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(.92) rotate(' + rot + 'deg)', opacity: 1, offset: .14 },
      { transform: 'translate(-50%,-50%) scale(1) rotate(' + rot + 'deg)', opacity: 1, offset: .8 },
      { transform: 'translate(-50%,-50%) scale(1.15) rotate(' + rot + 'deg)', opacity: 0 }
    ], { duration: life, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    a.onfinish = function () { s.remove(); };
    return s;
  }
  function shakeTargets() {
    return Array.prototype.slice.call(document.querySelectorAll('body > main, body > .site-header, body > footer, body > .site-footer'));
  }
  function shake(power, ms) {
    if (reduce) return;
    var frames = [], n = Math.max(6, Math.round(ms / 45));
    for (var i = 0; i < n; i++) {
      var k = power * (1 - i / n);
      frames.push({ transform: 'translate(' + rand(-k, k).toFixed(1) + 'px,' + rand(-k, k).toFixed(1) + 'px)' });
    }
    frames.push({ transform: 'none' });
    shakeTargets().forEach(function (t) { t.animate(frames, { duration: ms, easing: 'linear' }); });
  }
  function flash(color, ms, peak) {
    var f = overlay('pw-flash'); f.style.background = color || '#fff';
    var a = f.animate([{ opacity: 0 }, { opacity: peak == null ? .95 : peak, offset: .12 }, { opacity: 0 }], { duration: ms || 500, easing: 'ease-out' });
    a.onfinish = function () { f.remove(); };
  }

  /* ------------------------------------------------------------------
     Pieces of the page: visible blocks small enough to fly as one
     ------------------------------------------------------------------ */
  var ATOM = /^(IMG|SVG|CANVAS|VIDEO|PICTURE|IFRAME|BUTTON|A|INPUT|TEXTAREA|SELECT|H1|H2|H3|H4|H5|H6|P|LI|LABEL|DT|DD|BLOCKQUOTE|FIGURE|PRE|CODE|SPAN|B|STRONG|EM|SMALL|I)$/;
  var SKIP = /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|LINK|META|BR|DEFS)$/;
  function isOurs(n) { return n.className && typeof n.className === 'string' && /(^|\s)(pw-|toasts|curtain|loader|skip|grain|progress)/.test(n.className); }
  function hasSkin(cs) {
    return (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
      cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none';
  }
  function pieces(max) {
    var out = [], w = vw(), h = vh(), area = w * h;
    function walk(n) {
      if (out.length >= max || n.nodeType !== 1 || SKIP.test(n.tagName.toUpperCase()) || isOurs(n)) return;
      var cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (cs.display === 'contents') { kids(n); return; }
      var r = n.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > h || r.right < 0 || r.left > w) return;
      var a = r.width * r.height, tag = n.tagName.toUpperCase();
      var small = a < area * .05, atom = ATOM.test(tag) && a < area * .3, card = hasSkin(cs) && a < area * .16;
      if (small || atom || card || tag === 'SVG' || !n.children.length) { out.push({ el: n, r: r }); return; }
      kids(n);
    }
    function kids(n) { for (var i = 0; i < n.children.length; i++) walk(n.children[i]); }
    kids(document.body);
    return out;
  }

  /* ------------------------------------------------------------------
     Scroll lock (native, the site's wheel inertia and keys)
     ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------
     千鳥 CHIDORI — charge, strike, shatter the page into rubble
     ------------------------------------------------------------------ */
  function chidori() {
    if (busy || ruin) return;
    setBusy(true); closeDock();
    var w = vw(), h = vh(), px = w / 2, py = h * (phone ? .58 : .6);
    lock(true);
    var dim = overlay('pw-dim'); dim.style.setProperty('--px', px + 'px'); dim.style.setProperty('--py', py + 'px'); on(dim);
    var CHARGE = reduce ? 500 : 1500;
    SND.chirp(CHARGE / 1000);

    /* charge: an orb of lightning with chirping arcs */
    var sparks = [];
    layer(function (c, t) {
      var p = Math.min(1, t / CHARGE);
      if (t > CHARGE + 380) return false;
      c.globalCompositeOperation = 'lighter';
      var R = 16 + p * 34 + Math.sin(t / 30) * 4;
      var g = c.createRadialGradient(px, py, 0, px, py, R * 3);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(140,210,255,.9)'); g.addColorStop(1, 'rgba(40,110,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(px, py, R * 3, 0, 7); c.fill();
      var arcs = 3 + Math.round(p * (phone ? 5 : 9));
      for (var i = 0; i < arcs; i++) {
        var a = rand(0, Math.PI * 2), len = rand(40, 90 + p * (phone ? 150 : 260));
        strokeBolt(c, bolt(px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, len / 2.2), '#5fb4ff', rand(1, 2.4));
      }
      if (Math.random() < .6) sparks.push({ x: px, y: py, vx: rand(-6, 6), vy: rand(-7, 3), l: 1 });
      c.fillStyle = '#cfeaff';
      sparks = sparks.filter(function (s) { s.x += s.vx; s.y += s.vy; s.vy += .25; s.l -= .03; c.globalAlpha = Math.max(0, s.l); c.fillRect(s.x, s.y, 2.4, 2.4); return s.l > 0; });
    });
    setTimeout(function () { sfx('千鳥', px, py - (phone ? 120 : 170), { cls: 'xl', en: 'CHIDORI', color: '#2d8cff', life: 1300, rot: -6 }); }, reduce ? 0 : 250);
    setTimeout(function () { sfx('チチチチ', px + (phone ? 70 : 220), py + 30, { cls: 'sm', color: '#2d8cff', life: 900 }); }, reduce ? 0 : 700);

    setTimeout(function () {
      /* strike: bolts to every edge, white flash, the page breaks */
      SND.boom(); SND.crumble();
      flash('#e8f4ff', 520);
      shake(phone ? 16 : 26, 700);
      var edges = [];
      for (var i = 0; i < (phone ? 6 : 10); i++) {
        var a = (i / (phone ? 6 : 10)) * Math.PI * 2 + rand(-.2, .2);
        edges.push([px + Math.cos(a) * Math.max(w, h), py + Math.sin(a) * Math.max(w, h)]);
      }
      layer(function (c, t) {
        if (t > 420) return false;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - t / 420;
        edges.forEach(function (e) { strokeBolt(c, bolt(px, py, e[0], e[1], 220), '#7cc4ff', 3); });
      });
      sfx('ドォン', px - (phone ? 60 : 200), py - 40, { color: '#ff5a2a', life: 1100, rot: -12 });
      cracks(px, py);
      glass(px, py);
      shatter(px, py);
    }, CHARGE);

    setTimeout(function () { drop(dim, 600); }, CHARGE + 500);
  }

  function cracks(px, py) {
    var w = vw(), h = vh(), NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'pw-cracks'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('aria-hidden', 'true');
    var d = '', n = phone ? 9 : 14;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + rand(-.25, .25), x = px, y = py, len = Math.max(w, h) * rand(.4, .9), steps = 7;
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
      for (var k = 1; k <= 12; k++) { var aa = k / 12 * Math.PI * 2; d += 'L' + (px + Math.cos(aa) * rr * rand(.85, 1.15)).toFixed(0) + ' ' + (py + Math.sin(aa) * rr * rand(.85, 1.15)).toFixed(0); }
    }
    svg.innerHTML = '<path d="' + d + '" stroke="rgba(120,190,255,.55)" stroke-width="7"/><path d="' + d + '" stroke="#05040a" stroke-width="3.2"/><path d="' + d + '" stroke="rgba(230,245,255,.8)" stroke-width="1"/>';
    document.body.appendChild(svg);
    var len2 = 6000;
    Array.prototype.forEach.call(svg.querySelectorAll('path'), function (p) {
      p.style.strokeDasharray = len2; p.animate([{ strokeDashoffset: len2 }, { strokeDashoffset: 0 }], { duration: reduce ? 1 : 700, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    });
    ruinParts.push(svg);
  }

  function glass(px, py) {
    var shards = [], n = phone ? 26 : 48;
    for (var i = 0; i < n; i++) {
      var a = rand(0, Math.PI * 2), sp = rand(4, 16), s = rand(10, phone ? 38 : 60);
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

  var ruinParts = [];
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
      var endFilter = phone ? 'none' : 'brightness(.5) saturate(.4)';
      var delay = Math.min(260, dist / 6) + rand(0, 80);
      var kf = reduce ? [{ opacity: 1 }, { opacity: 0 }] : [
        { transform: 'none', filter: 'none', easing: 'cubic-bezier(.1,.7,.3,1)' },
        { transform: 'translate(' + bx.toFixed(0) + 'px,' + by.toFixed(0) + 'px) rotate(' + (rot * .45).toFixed(0) + 'deg)', filter: phone ? 'none' : 'brightness(1.8)', offset: .32, easing: 'cubic-bezier(.55,0,.9,.5)' },
        { transform: end, filter: endFilter, offset: .9, easing: 'ease-out' },
        { transform: end.replace(/rotate\(([-\d]+)deg\)/, function (m, d) { return 'rotate(' + (+d + rand(-4, 4)).toFixed(0) + 'deg)'; }), filter: endFilter }
      ];
      if (phone) kf.forEach(function (k) { delete k.filter; });
      var a = p.el.animate(kf, { duration: reduce ? 500 : rand(1300, 1900), delay: reduce ? 0 : delay, fill: 'both' });
      anims.push({ el: p.el, a: a, end: end, top: r.top });
    });
    ruin = { anims: anims, px: px, py: py };
    root.classList.add('pw-destroyed');
    setTimeout(function () { ruinScene(px, py); }, reduce ? 300 : 1500);
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

  /* smoke, embers and a last crackle while the page lies in ruins */
  function embers() {
    var list = [], n = phone ? 28 : 64;
    for (var i = 0; i < n; i++) list.push(newEmber(true));
    function newEmber(any) { return { x: rand(0, vw()), y: any ? rand(0, vh()) : vh() + 10, v: rand(.3, 1.3), s: rand(1, 3), w: rand(0, 6), blue: Math.random() < .35 }; }
    layer(function (c, t) {
      if (!ruin || ruin.rising) return false;
      c.globalCompositeOperation = 'lighter';
      list.forEach(function (e, i) {
        e.y -= e.v; e.x += Math.sin(t / 700 + e.w) * .5;
        if (e.y < -10) list[i] = newEmber(false);
        c.globalAlpha = .5 + Math.sin(t / 200 + e.w) * .3;
        c.fillStyle = e.blue ? '#7cc4ff' : '#ff8a3a';
        c.fillRect(e.x, e.y, e.s, e.s);
      });
      if (!reduce && Math.random() < .03) {
        c.globalAlpha = .8; var a = rand(0, 7), l = rand(40, 120);
        strokeBolt(c, bolt(ruin.px, ruin.py, ruin.px + Math.cos(a) * l, ruin.py + Math.sin(a) * l, 40), '#5fb4ff', 1.2);
      }
    });
  }

  /* ------------------------------------------------------------------
     起きろ ARISE — shadows rise from the rubble and the page returns
     ------------------------------------------------------------------ */
  function arise() {
    if (!ruin || busy) return;
    setBusy(true); closeDock();
    ruin.rising = true;
    if (ruin.cta) { drop(ruin.cta, 600); ruin.cta = null; }
    var w = vw(), h = vh();
    SND.drone(3.4);
    var sh = overlay('pw-shadow'); on(sh);
    var seal = overlay('pw-seal');
    seal.innerHTML = '<svg viewBox="-100 -100 200 200"><g fill="none" stroke="#b28cff"><circle r="96" stroke-width="2"/><circle r="84" stroke-width="1" stroke-dasharray="3 6"/><circle r="52" stroke-width="2"/>' +
      '<path d="M0-84 73 42H-73Z M0 84-73-42H73Z" stroke-width="1.6"/><path d="M0-52V52M-45-26 45 26M45-26-45 26" stroke-width=".8" opacity=".6"/></g>' +
      '<g fill="#d9c6ff" font-size="11" font-family="serif" text-anchor="middle"><text y="-88">影</text><text y="96">王</text><text x="-90" y="4">起</text><text x="90" y="4">兵</text></g></svg>';
    on(seal);
    ruinParts.forEach(function (p) { if (p.classList && p.classList.contains('pw-ruin')) p.style.transition = 'opacity 1.4s'; });

    /* shadow smoke pouring up */
    var smoke = [], eyes = [];
    for (var i = 0; i < (phone ? 7 : 14); i++) eyes.push({ x: rand(.08, .92) * w, y: rand(.55, .9) * h, t: rand(300, 1500) });
    layer(function (c, t) {
      if (t > 3600) return false;
      var fade = t > 2800 ? 1 - (t - 2800) / 800 : 1;
      if (t < 2600) for (var k = 0; k < (phone ? 2 : 4); k++) smoke.push({ x: rand(0, w), y: h + 30, r: rand(30, phone ? 70 : 110), v: rand(1.5, 4), l: 1 });
      smoke = smoke.filter(function (s) {
        s.y -= s.v; s.r *= 1.006; s.l -= .008;
        var g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        g.addColorStop(0, 'rgba(60,20,120,' + (.35 * s.l * fade) + ')'); g.addColorStop(1, 'rgba(10,4,24,0)');
        c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill();
        return s.l > 0;
      });
      c.globalCompositeOperation = 'lighter';
      eyes.forEach(function (e) {
        if (t < e.t || t > e.t + 1500) return;
        var o = Math.sin((t - e.t) / 1500 * Math.PI) * fade;
        c.globalAlpha = o; c.fillStyle = '#9fe0ff';
        c.beginPath(); c.ellipse(e.x - 9, e.y, 6, 2, -.2, 0, 7); c.ellipse(e.x + 9, e.y, 6, 2, .2, 0, 7); c.fill();
        c.globalAlpha = o * .4; c.fillStyle = '#6a2cff'; c.beginPath(); c.arc(e.x, e.y, 26, 0, 7); c.fill();
      });
      c.globalAlpha = 1;
    });

    var word = sfx('ARISE', w / 2, h * .36, { cls: 'xl pw-arise-word', en: '起きろ', life: 1900, rot: 0 });
    word.setAttribute('aria-hidden', 'true');
    shake(8, 900);

    setTimeout(function () {
      /* the rubble rises, darkest first, then colour comes back */
      SND.rise();
      sh.classList.add('thin');
      ruinParts.forEach(function (p) { p.style.transition = 'opacity 1.2s'; p.style.opacity = '0'; });
      var done = [];
      ruin.anims.forEach(function (p) {
        var d = reduce ? 0 : Math.max(0, (h - p.top) / h) * 700 + rand(0, 250);
        var kf = reduce ? [{ opacity: 0 }, { opacity: 1 }] : [
          { transform: p.end, filter: 'brightness(.15) saturate(0)', opacity: .9, easing: 'cubic-bezier(.3,0,.2,1)' },
          { transform: 'translate(0,-26px) rotate(0deg) scale(1.03)', filter: 'brightness(.35) saturate(0) contrast(1.4)', opacity: 1, offset: .7, easing: 'cubic-bezier(.2,.8,.2,1)' },
          { transform: 'none', filter: 'none', opacity: 1 }
        ];
        if (phone && !reduce) kf.forEach(function (k) { delete k.filter; });
        var a = p.el.animate(kf, { duration: reduce ? 400 : rand(1100, 1500), delay: d, fill: 'both' });
        done.push(a.finished.catch(function () {}));
        p.rise = a;
      });
      Promise.all(done).then(function () {
        flash('#8a5cff', 700, .5);
        SND.power();
        ruin.anims.forEach(function (p) { p.a.cancel(); if (p.rise) p.rise.cancel(); });
        ruinParts.forEach(function (p) { p.remove(); }); ruinParts = [];
        drop(sh, 800); drop(seal, 800);
        root.classList.remove('pw-destroyed');
        lock(false); ruin = null; setBusy(false); paint();
        toast('Shadow extraction complete. The page lives again.');
      });
    }, reduce ? 300 : 1300);
  }

  /* ------------------------------------------------------------------
     風 WIND — streaks and leaves blow across, the page sways
     ------------------------------------------------------------------ */
  var windStop = 0;
  function wind() {
    if (windOn) { windOn = false; root.classList.remove('pw-windy'); paint(); return; }
    if (busy || ruin) return;
    windOn = true; paint(); closeDock();
    if (!reduce) root.classList.add('pw-windy');
    Array.prototype.forEach.call(document.querySelectorAll('main h1, main h2, main h3, main img, main .btn, main .card, main p, .hero-mascot'), function (e, i) {
      if (i < 300) e.style.setProperty('--pw-d', (-(i % 7) * .13).toFixed(2));
    });
    SND.whoosh(2.2);
    var gust = setInterval(function () { if (windOn) SND.whoosh(1.8); }, 2600);
    var dark = root.getAttribute('data-mode') === 'ink';
    var streak = dark ? 'rgba(230,240,255,' : 'rgba(40,60,80,';
    var LEAF = ['#e8a1b0', '#f3c3cc', '#7fae5a', '#a9c96e', '#d9a441'];
    var lines = [], leaves = [], NL = phone ? 26 : 60, NV = phone ? 18 : 42;
    function newLine(any) { return { x: any ? rand(-vw(), vw()) : rand(-400, -60), y: rand(0, vh()), len: rand(60, 260), v: rand(14, 30), a: rand(.12, .45), wob: rand(0, 6) }; }
    function newLeaf(any) { return { x: any ? rand(0, vw()) : rand(-80, -10), y: rand(-20, vh()), v: rand(4, 10), s: rand(4, 9), r: rand(0, 6), vr: rand(-.2, .2), c: pick(LEAF), wob: rand(0, 6) }; }
    for (var i = 0; i < NL; i++) lines.push(newLine(true));
    for (var j = 0; j < NV; j++) leaves.push(newLeaf(true));
    var kanji = sfx('風', vw() * .5, vh() * .4, { cls: 'xl', en: 'WIND RELEASE', color: '#4fbf8f', life: 1400, rot: -4 });
    setTimeout(function () { sfx('ヒュウウウ', vw() * .7, vh() * .62, { cls: 'sm', color: '#4fbf8f', life: 1100 }); }, 500);
    var end = performance.now() + 9000; windStop = end;
    layer(function (c, t, now) {
      var fade = windOn ? Math.min(1, t / 400) : 0;
      if (windOn && now > end && windStop === end) { windOn = false; root.classList.remove('pw-windy'); paint(); }
      if (!windOn) { clearInterval(gust); return false; }
      var Wd = vw(), Hd = vh();
      c.lineCap = 'round';
      lines.forEach(function (l, i) {
        l.x += l.v; if (l.x > Wd + 40) lines[i] = newLine(false);
        var y = l.y + Math.sin(t / 400 + l.wob) * 12;
        c.globalAlpha = l.a * fade; c.strokeStyle = streak + '1)'; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(l.x, y); c.quadraticCurveTo(l.x + l.len * .5, y - 8, l.x + l.len, y); c.stroke();
      });
      leaves.forEach(function (f, i) {
        f.x += f.v; f.y += Math.sin(t / 300 + f.wob) * 1.6 + .6; f.r += f.vr;
        if (f.x > Wd + 30 || f.y > Hd + 30) leaves[i] = newLeaf(false);
        c.save(); c.translate(f.x, f.y); c.rotate(f.r); c.globalAlpha = .9 * fade; c.fillStyle = f.c;
        c.beginPath(); c.ellipse(0, 0, f.s, f.s * .45, 0, 0, 7); c.fill(); c.restore();
      });
    });
    return kanji;
  }

  /* ------------------------------------------------------------------
     かめはめ波 KAMEHAMEHA — chant, charge, fire, then power up
     ------------------------------------------------------------------ */
  function kamehameha() {
    if (busy || ruin) return;
    setBusy(true); closeDock();
    var w = vw(), h = vh(), portrait = h > w;
    var ox = portrait ? w / 2 : w * .14, oy = portrait ? h * .8 : h * .58, ang = portrait ? -Math.PI / 2 : 0;
    var dim = overlay('pw-dim kame'); dim.style.setProperty('--px', ox + 'px'); dim.style.setProperty('--py', oy + 'px'); on(dim);
    var STEP = reduce ? 150 : 420, CHARGE = STEP * 4 + 300, BEAM = reduce ? 600 : 1500;
    SND.charge(CHARGE / 1000);
    ['か', 'め', 'は', 'め'].forEach(function (ch, i) {
      setTimeout(function () {
        var tx = portrait ? w * (.2 + i * .2) : ox + 60 + i * Math.min(120, w * .09);
        var ty = portrait ? h * .5 : oy - 150 - (i % 2) * 40;
        sfx(ch, tx, ty, { color: '#2d8cff', life: CHARGE - i * STEP + 200, rot: rand(-12, 12) });
        shake(2 + i * 2, STEP);
      }, i * STEP);
    });
    var bits = [];
    layer(function (c, t) {
      if (t > CHARGE + BEAM + 600) return false;
      c.globalCompositeOperation = 'lighter';
      var p = Math.min(1, t / CHARGE);
      /* particles pulled into the palms */
      if (t < CHARGE) for (var k = 0; k < (phone ? 3 : 6); k++) { var a = rand(0, 7), d = rand(120, 320); bits.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d }); }
      c.fillStyle = '#9fd8ff';
      bits = bits.filter(function (b) { b.x += (ox - b.x) * .12; b.y += (oy - b.y) * .12; c.fillRect(b.x, b.y, 2.5, 2.5); return Math.abs(b.x - ox) + Math.abs(b.y - oy) > 6; });
      var fire = t > CHARGE, bt = t - CHARGE;
      var R = fire ? 60 * (1 - Math.max(0, bt - BEAM) / 600) : 10 + p * 46 + Math.sin(t / 40) * 4;
      if (R > 0) {
        var g = c.createRadialGradient(ox, oy, 0, ox, oy, R * 2.6);
        g.addColorStop(0, '#fff'); g.addColorStop(.3, 'rgba(120,200,255,.95)'); g.addColorStop(1, 'rgba(20,90,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(ox, oy, R * 2.6, 0, 7); c.fill();
      }
      if (!fire) return;
      /* the beam */
      var grow = Math.min(1, bt / 220), thin = bt > BEAM ? Math.max(0, 1 - (bt - BEAM) / 600) : 1;
      var L = Math.hypot(w, h) * 1.2 * grow, hh = (portrait ? w * .22 : h * .15) * thin * (1 + Math.sin(bt / 30) * .05);
      c.translate(ox, oy); c.rotate(ang);
      var gr = c.createLinearGradient(0, -hh, 0, hh);
      gr.addColorStop(0, 'rgba(30,110,255,0)'); gr.addColorStop(.18, 'rgba(40,130,255,.45)'); gr.addColorStop(.36, 'rgba(120,210,255,.9)');
      gr.addColorStop(.5, '#ffffff'); gr.addColorStop(.64, 'rgba(120,210,255,.9)'); gr.addColorStop(.82, 'rgba(40,130,255,.45)'); gr.addColorStop(1, 'rgba(30,110,255,0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(0, -hh * .5);
      for (var x = 0; x <= L; x += 24) c.lineTo(x, -hh * (1 + Math.sin(x * .03 - bt * .04) * .08));
      c.lineTo(L, hh);
      for (var x2 = L; x2 >= 0; x2 -= 24) c.lineTo(x2, hh * (1 + Math.sin(x2 * .03 + bt * .05) * .08));
      c.lineTo(0, hh * .5); c.closePath(); c.fill();
      c.globalAlpha = .8 * thin; c.strokeStyle = '#fff'; c.lineWidth = 2;
      for (var s = 0; s < 8; s++) { var yy = rand(-hh * .8, hh * .8), xs = rand(0, L); c.beginPath(); c.moveTo(xs, yy); c.lineTo(xs + rand(60, 200), yy); c.stroke(); }
    });
    setTimeout(function () {
      SND.beam(); flash('#dff1ff', 420, .8); shake(phone ? 12 : 20, BEAM);
      sfx('波ァァァ!!', portrait ? w / 2 : w * .55, portrait ? h * .3 : oy - (phone ? 90 : 170), { cls: 'xl', en: 'KAMEHAMEHA', color: '#2d8cff', life: BEAM + 200, rot: -5 });
      blast(ox, oy, ang, portrait ? w * .22 : h * .15);
    }, CHARGE);
    setTimeout(function () {
      drop(dim, 500);
      if (!root.classList.contains('pw-ssj')) ssj(true, true); else { setBusy(false); }
    }, CHARGE + BEAM + 400);
  }

  /* anything the beam passes through gets knocked about */
  function blast(ox, oy, ang, hh) {
    if (reduce) return;
    var dx = Math.cos(ang), dy = Math.sin(ang);
    pieces(phone ? 60 : 160).forEach(function (p) {
      var r = p.r, cxp = r.left + r.width / 2 - ox, cyp = r.top + r.height / 2 - oy;
      var along = cxp * dx + cyp * dy, across = Math.abs(-cxp * dy + cyp * dx);
      if (along < 0 || across > hh * 1.3) return;
      var k = rand(14, 34);
      p.el.animate([
        { transform: 'none' },
        { transform: 'translate(' + (dx * k + rand(-6, 6)).toFixed(0) + 'px,' + (dy * k + rand(-6, 6)).toFixed(0) + 'px) rotate(' + rand(-5, 5).toFixed(1) + 'deg)', offset: .2 },
        { transform: 'translate(' + rand(-3, 3).toFixed(0) + 'px,' + rand(-3, 3).toFixed(0) + 'px)', offset: .6 },
        { transform: 'none' }
      ], { duration: 900, delay: along / 6, easing: 'ease-out' });
    });
  }

  /* ------------------------------------------------------------------
     超 SUPER SAIYAN — golden aura that follows you across pages
     ------------------------------------------------------------------ */
  var aura = null;
  function ssj(onOff, animate) {
    if (onOff) {
      if (!aura) { aura = overlay('pw-aura'); }
      if (animate) {
        setBusy(true);
        var w = vw(), h = vh();
        var dim = overlay('pw-dim ssj'); on(dim);
        SND.power();
        var up = [];
        layer(function (c, t) {
          if (t > 1900) return false;
          c.globalCompositeOperation = 'lighter';
          if (t < 1400) for (var k = 0; k < (phone ? 4 : 9); k++) up.push({ x: rand(0, w), y: h + 10, v: rand(8, 20), l: rand(20, 70) });
          c.strokeStyle = '#ffd35a'; c.lineWidth = 2;
          up = up.filter(function (u) { u.y -= u.v; c.globalAlpha = .7; c.beginPath(); c.moveTo(u.x, u.y); c.lineTo(u.x, u.y + u.l); c.stroke(); return u.y > -80; });
          if (Math.random() < .25) { c.globalAlpha = 1; var x = rand(0, w), y = rand(0, h); strokeBolt(c, bolt(x, y, x + rand(-80, 80), y + rand(40, 140), 50), '#ffd35a', 1.5); }
        });
        sfx('ハアアア!!', w / 2, h * .42, { cls: 'xl', en: 'SUPER SAIYAN', color: '#ff9f00', life: 1600, rot: -3 });
        shake(10, 1300);
        setTimeout(function () {
          flash('#fff3c4', 600, .85);
          root.classList.add('pw-ssj'); on(aura);
          drop(dim, 600); setBusy(false); paint();
          toast('Super Saiyan mode. Tap 超 again to power down.');
        }, reduce ? 200 : 1300);
      } else { root.classList.add('pw-ssj'); on(aura); }
      store(KEY_SSJ, '1');
    } else {
      root.classList.remove('pw-ssj');
      if (aura) { drop(aura, 1000); aura = null; }
      store(KEY_SSJ, null);
    }
    paint();
  }

  /* ------------------------------------------------------------------
     The dock
     ------------------------------------------------------------------ */
  var POWERS = [
    { id: 'chidori', k: '千', name: 'Chidori', sub: 'destroy the page', c: '#5fb4ff', run: chidori },
    { id: 'arise', k: '起', name: 'Arise', sub: 'raise it again', c: '#9a6bff', run: arise },
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
  mute.addEventListener('click', function () { muted = !muted; store(KEY_MUTE, muted ? '1' : null); if (AC && muted) AC.suspend(); paint(); });
  list.appendChild(mute);
  toggle.addEventListener('click', function () { dock.classList.contains('open') ? closeDock() : openDock(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dock.classList.contains('open')) { closeDock(); toggle.focus(); } });
  document.addEventListener('click', function (e) { if (!dock.contains(e.target)) closeDock(); });
  function openDock() { dock.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); }
  function closeDock() { dock.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  function setBusy(b) { busy = b; dock.classList.toggle('pw-busy', b); }
  function paint() {
    btn.chidori.disabled = !!ruin;
    btn.arise.disabled = !ruin;
    btn.kame.disabled = !!ruin;
    btn.ssj.disabled = !!ruin;
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
