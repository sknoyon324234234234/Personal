/* =====================================================================
   XIRAIYA — the power scroll (術)
   A dock in the corner of every page with five jutsu:
     Chidori       lightning gathers in the hand, then a strike that
                   cracks the screen and knocks every visible block off
                   the page
     Wind          a gust of leaves and petals; on a wrecked page it
                   blows the rubble away
     Kamehameha    ka… me… ha… me… then a beam across the screen that
                   blasts whatever it touches off the page
     Super Saiyan  a toggle: the whole site turns gold and burns
     Arise         the shadow command: every broken piece climbs back
                   into place as a shadow, then gets its colour back
   The page is really wrecked: blocks are moved with the Web Animations
   API and never removed, so the text stays in the page for screen
   readers and Arise can put everything back exactly where it was.
   Other scripts call window.XRPOWER or use [data-power="…"] buttons.
   Add data-power="off" to a page's <body> to leave the dock out.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR || !document.body || !Element.prototype.animate) return;
  if (document.body.getAttribute('data-power') === 'off') return;
  var doc = document, root = doc.documentElement, reduce = XR.reduce;
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = innerWidth, H = innerHeight, small = W < 760;
  var rnd = Math.random, PI2 = Math.PI * 2;
  function r(a, b) { return a + rnd() * (b - a); }
  function sign() { return rnd() < .5 ? -1 : 1; }
  function T(x, y, deg, s) { return 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + deg.toFixed(1) + 'deg)' + (s ? ' scale(' + s + ')' : ''); }
  function quest(id) { if (XR.quest) XR.quest(id); }

  /* =============================== sound ================================
     Everything is synthesised: no audio files to download. */
  var ac = null, master = null, nbuf = null, muted = XR.store('xr-pw-mute') === 1;
  function audio() {
    if (muted) return null;
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC(); master = ac.createGain(); master.gain.value = .55; master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function noiseBuf(a) {
    if (nbuf) return nbuf;
    nbuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    var d = nbuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
    return nbuf;
  }
  function env(a, gain, t, dur, vol, attack) {
    gain.gain.setValueAtTime(.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + (attack || Math.min(.04, dur / 4)));
    gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
  }
  function noise(type, f0, f1, dur, vol, at, q, attack) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (at || 0), s = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain();
    s.buffer = noiseBuf(a); s.loop = true;
    f.type = type; f.Q.value = q || .8;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(a, v, t, dur, vol, attack);
    s.connect(f); f.connect(v); v.connect(master); s.start(t); s.stop(t + dur + .05);
  }
  function tone(type, f0, f1, dur, vol, at, attack) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (at || 0), o = a.createOscillator(), v = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(a, v, t, dur, vol, attack);
    o.connect(v); v.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  var SFX = {
    /* a thousand birds: band-passed noise chopped by a square wave, plus a whine */
    chirp: function (dur) {
      var a = audio(); if (!a) return;
      var t = a.currentTime, s = a.createBufferSource(), f = a.createBiquadFilter(), chop = a.createGain(), v = a.createGain(), lfo = a.createOscillator(), depth = a.createGain();
      s.buffer = noiseBuf(a); s.loop = true;
      f.type = 'bandpass'; f.frequency.setValueAtTime(2400, t); f.frequency.linearRampToValueAtTime(4200, t + dur); f.Q.value = 1.4;
      chop.gain.value = .5; lfo.type = 'square'; lfo.frequency.value = 34; depth.gain.value = .5;
      lfo.connect(depth); depth.connect(chop.gain);
      env(a, v, t, dur, .55, .2);
      s.connect(f); f.connect(chop); chop.connect(v); v.connect(master);
      s.start(t); lfo.start(t); s.stop(t + dur + .05); lfo.stop(t + dur + .05);
      tone('sawtooth', 1900, 3400, dur, .05, 0, .3);
    },
    boom: function (big) {
      tone('sine', big ? 160 : 130, 32, big ? 1.8 : 1.2, .9, 0, .01);
      noise('lowpass', 2400, 60, big ? 1.6 : 1, .8, 0, .7, .005);
    },
    crack: function () { noise('highpass', 1800, 7000, .3, .5, 0, .6, .003); noise('bandpass', 900, 300, .5, .35, .04, 2); },
    whoosh: function (dur) { noise('bandpass', 260, 1600, dur * .55, .55, 0, .9, dur * .3); noise('bandpass', 1600, 300, dur * .5, .45, dur * .45, .9, .08); },
    charge: function (dur) {
      tone('sawtooth', 80, 480, dur, .07, 0, dur * .8);
      tone('sine', 160, 960, dur, .14, 0, dur * .8);
      noise('bandpass', 300, 2600, dur, .2, 0, 3, dur * .8);
    },
    beam: function (dur) { noise('lowpass', 3200, 400, dur, .75, 0, .5, .02); tone('sawtooth', 72, 46, dur, .22, 0, .02); tone('square', 140, 90, dur, .06); },
    arise: function () {
      tone('sine', 55, 52, 2.8, .55, 0, .6); tone('triangle', 82.4, 80, 2.6, .22, .15, .6); tone('sine', 110, 104, 2.4, .16, .35, .5);
      noise('lowpass', 180, 1400, 2.4, .3, 0, .7, 1.4);
      tone('sine', 70, 34, .5, .8, 0, .01); tone('sine', 70, 34, .5, .6, .42, .01);
    },
    ssj: function () { tone('sawtooth', 110, 420, 1.5, .1, 0, 1.2); noise('bandpass', 500, 3200, 1.5, .4, 0, 1.2, 1.2); SFX.boom(true); },
    hit: function () { noise('bandpass', 1400, 200, .18, .45, 0, 1.5, .003); tone('square', 220, 60, .15, .12); },
    blip: function (f) { tone('square', f || 660, (f || 660) * 1.5, .09, .05); }
  };

  /* ============================== layers ================================ */
  var box, cv, g, shade, call, cracks, flashEl, live;
  function layers() {
    if (box) return;
    box = doc.createElement('div');
    box.className = 'pw-root';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<div class="pw-shade"></div><div class="pw-aura"></div>' +
      '<svg class="pw-cracks" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="pw-crater"><stop offset="0" stop-color="#050303" stop-opacity=".7"/><stop offset=".45" stop-color="#1a0f08" stop-opacity=".35"/><stop offset="1" stop-color="#1a0f08" stop-opacity="0"/></radialGradient></defs></svg>' +
      '<canvas class="pw-fx"></canvas><div class="pw-call"><b></b><small></small></div><div class="pw-flash"></div>';
    doc.body.appendChild(box);
    cv = box.querySelector('.pw-fx'); g = cv.getContext('2d');
    shade = box.querySelector('.pw-shade'); call = box.querySelector('.pw-call');
    cracks = box.querySelector('.pw-cracks'); flashEl = box.querySelector('.pw-flash');
    size();
  }
  function size() {
    W = innerWidth; H = innerHeight; small = W < 760;
    if (!cv) return;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cracks.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  }
  addEventListener('resize', function () { if (cv) size(); else { W = innerWidth; H = innerHeight; } }, { passive: true });

  function say(kind, big, sm, ms) {
    layers();
    call.setAttribute('data-kind', kind);
    call.querySelector('b').textContent = big;
    call.querySelector('small').textContent = sm || '';
    call.classList.remove('is-on'); void call.offsetWidth; call.classList.add('is-on');
    clearTimeout(say.t); say.t = setTimeout(function () { call.classList.remove('is-on'); }, ms || 1200);
  }
  function flash(color, ms) {
    layers();
    flashEl.style.background = color || '#fff';
    flashEl.animate([{ opacity: reduce ? .5 : 1 }, { opacity: 0 }], { duration: ms || 320, easing: 'ease-out' });
  }
  function shadeOn(bg) { layers(); shade.style.background = bg; shade.classList.add('is-on'); }
  function shadeOff() { if (shade) { shade.classList.remove('is-on'); shade.style.background = ''; } }
  function shake(ms, px) {
    if (reduce) return;
    root.style.setProperty('--pw-sh', (px || 8) + 'px');
    root.classList.remove('pw-shake'); void root.offsetWidth; root.classList.add('pw-shake');
    clearTimeout(shake.t); shake.t = setTimeout(function () { root.classList.remove('pw-shake'); }, ms || 500);
  }
  function announce(msg) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); } }

  /* ============================ particles =============================== */
  var parts = [], bolts = [], orbs = [], beams = [], running = false, last = 0, ssjOn = false, sprites = {};
  function sprite(col) {
    if (sprites[col]) return sprites[col];
    var c = doc.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(.35, col.replace(/[\d.]+\)$/, function (a) { return (parseFloat(a) * .5) + ')'; })); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (sprites[col] = c);
  }
  function add(p) { if (reduce || parts.length > (small ? 420 : 900)) return; p.life = p.max = p.max || 1; parts.push(p); run(); }
  function sparks(x, y, n, col, speed) {
    for (var i = 0; i < n; i++) { var a = rnd() * PI2, s = r(.3, 1) * (speed || 700); add({ k: 'spark', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, max: r(.3, .8), col: col || '#bfe8ff', w: r(1, 2.4) }); }
  }
  function smoke(x, y, n, col, rise) {
    for (var i = 0; i < n; i++) add({ k: 'smoke', x: x + r(-30, 30), y: y + r(-20, 20), vx: r(-40, 40), vy: -r(20, rise || 90), max: r(1.2, 2.6), s: r(40, 110), grow: r(30, 80), col: col || 'rgba(30,24,20,.55)' });
  }
  var SHARD = ['#efe4cc', '#1f1813', '#c4321d', '#fffdf8', '#d9a441', '#6b604f'];
  function shards(x, y, n, power) {
    for (var i = 0; i < n; i++) {
      var a = rnd() * PI2, s = r(200, 900) * (power || 1), sz = r(4, 16);
      add({ k: 'shard', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 300, max: r(1, 2), rot: rnd() * PI2, vr: r(-12, 12), col: SHARD[i % SHARD.length],
        pts: [[r(-sz, 0), r(-sz, 0)], [r(0, sz), r(-sz * .6, sz * .2)], [r(-sz * .4, sz * .6), r(0, sz)]] });
    }
  }
  function ring(x, y, col, max, grow) { add({ k: 'ring', x: x, y: y, s: 10, grow: grow || 1400, max: max || .55, col: col || 'rgba(190,230,255,1)' }); }
  function bolt(x1, y1, x2, y2, life, col, w, disp) { if (reduce) return; bolts.push({ x1: x1, y1: y1, x2: x2, y2: y2, life: life, max: life, col: col || '#8fd3ff', w: w || 2, disp: disp || Math.hypot(x2 - x1, y2 - y1) * .35 }); run(); }

  function jag(x1, y1, x2, y2, disp) {
    var pts = [[x1, y1], [x2, y2]];
    for (var k = 0; k < 5; k++) {
      var next = [pts[0]];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, off = (rnd() - .5) * disp;
        next.push([(a[0] + b[0]) / 2 - dy / l * off, (a[1] + b[1]) / 2 + dx / l * off], b);
      }
      pts = next; disp *= .56;
    }
    return pts;
  }
  function trace(pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); }
  function drawBolt(b, alpha) {
    var pts = jag(b.x1, b.y1, b.x2, b.y2, b.disp);
    g.lineCap = g.lineJoin = 'round';
    trace(pts);
    g.strokeStyle = b.col; g.globalAlpha = alpha * .22; g.lineWidth = b.w * 5; g.stroke();
    g.globalAlpha = alpha * .7; g.lineWidth = b.w * 1.8; g.stroke();
    g.strokeStyle = '#fff'; g.globalAlpha = alpha; g.lineWidth = b.w * .7; g.stroke();
    if (rnd() < .5 && pts.length > 8) {
      var p = pts[(rnd() * (pts.length - 4) | 0) + 2], a = Math.atan2(b.y2 - b.y1, b.x2 - b.x1) + sign() * r(.4, 1), l = Math.hypot(b.x2 - b.x1, b.y2 - b.y1) * r(.15, .35);
      trace(jag(p[0], p[1], p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l, l * .4));
      g.strokeStyle = b.col; g.globalAlpha = alpha * .6; g.lineWidth = b.w * .9; g.stroke();
    }
  }
  function glow(x, y, rad, col, a) { g.globalAlpha = a == null ? 1 : a; g.drawImage(sprite(col), x - rad, y - rad, rad * 2, rad * 2); }

  function drawOrb(o, dt) {
    o.t += dt;
    if (o.move) {
      var m = o.move, p = Math.min(1, (o.t - m.t0) / m.dur), e = p * p;
      if (p >= 0) { o.x = m.x0 + (m.x1 - m.x0) * e; o.y = m.y0 + (m.y1 - m.y0) * e; }
    }
    o.r += ((o.to || 30) - o.r) * Math.min(1, dt * 3);
    if (o.k === 'chidori') {
      glow(o.x, o.y, o.r * 7, 'rgba(90,170,255,.55)', .9);
      glow(o.x, o.y, o.r * 2.4, 'rgba(210,240,255,1)', 1);
      var n = small ? 4 : 7;
      for (var i = 0; i < n; i++) {
        var a = rnd() * PI2, d = o.r * r(1.3, 3.2);
        drawBolt({ x1: o.x + r(-4, 4), y1: o.y + r(-4, 4), x2: o.x + Math.cos(a) * d, y2: o.y + Math.sin(a) * d, disp: d * .5, col: '#7fc8ff', w: 1.4 }, r(.6, 1));
      }
      if (rnd() < .5) sparks(o.x, o.y, 1, '#cfeeff', 380);
    } else {
      var gold = o.gold;
      glow(o.x, o.y, o.r * 6, gold ? 'rgba(255,200,70,.5)' : 'rgba(60,150,255,.55)', .9);
      glow(o.x, o.y, o.r * 2.2, 'rgba(200,235,255,1)', 1);
      g.globalAlpha = .9; g.strokeStyle = gold ? '#ffe7a0' : '#bfe6ff'; g.lineWidth = 2;
      for (var s = 0; s < 3; s++) { g.beginPath(); g.arc(o.x, o.y, o.r * (1 + s * .35), o.t * (6 + s * 2) + s * 2, o.t * (6 + s * 2) + s * 2 + 1.6); g.stroke(); }
      if (o.pull) {
        var k = small ? 2 : 4;
        for (var j = 0; j < k; j++) { var aa = rnd() * PI2, dd = r(120, 320); add({ k: 'in', x: o.x + Math.cos(aa) * dd, y: o.y + Math.sin(aa) * dd, tx: o.x, ty: o.y, max: r(.35, .6), col: gold ? '#ffe39a' : '#9fdcff' }); }
      }
    }
  }
  function drawBeam(b, dt) {
    b.t += dt;
    var p = b.t / b.dur, grow = Math.min(1, b.t / .2), fade = p > .78 ? Math.max(0, 1 - (p - .78) / .22) : 1;
    var x0 = b.x0, x1 = x0 + (W + 240 - x0) * grow, h = b.h * (.9 + Math.sin(b.t * 45) * .06) * Math.sqrt(fade);
    if (h <= 1) return;
    var layersB = [[1, b.gold ? 'rgba(255,190,60,.35)' : 'rgba(60,140,255,.38)'], [.62, b.gold ? 'rgba(255,230,140,.7)' : 'rgba(110,200,255,.75)'], [.28, 'rgba(255,255,255,1)']];
    for (var L = 0; L < layersB.length; L++) {
      var hh = h * layersB[L][0] / 2, step = 22;
      g.globalAlpha = 1; g.fillStyle = layersB[L][1];
      g.beginPath(); g.moveTo(x0, b.y - hh * .6);
      for (var x = x0; x <= x1; x += step) g.lineTo(x, b.y - hh - Math.sin(x * .03 + b.t * 34 + L) * hh * .12 - rnd() * hh * .06);
      g.lineTo(x1, b.y);
      for (x = x1; x >= x0; x -= step) g.lineTo(x, b.y + hh + Math.sin(x * .031 + b.t * 30 + L * 2) * hh * .12 + rnd() * hh * .06);
      g.lineTo(x0, b.y + hh * .6); g.closePath(); g.fill();
    }
    glow(x0, b.y, h * 1.1, b.gold ? 'rgba(255,215,110,.9)' : 'rgba(150,215,255,.9)', fade);
    glow(x0, b.y, h * .45, 'rgba(255,255,255,1)', fade);
    if (grow < 1) glow(x1, b.y, h * .9, 'rgba(210,240,255,1)', 1);
    if (!small || rnd() < .5) add({ k: 'spark', x: r(x0, x1), y: b.y + sign() * h * r(.3, .6), vx: r(200, 900), vy: r(-200, 200), max: r(.2, .5), col: b.gold ? '#ffe7a0' : '#cdeeff', w: 2 });
    if (p >= 1) b.dead = true;
  }

  function loop(t) {
    var dt = Math.max(0, Math.min(.05, (t - last) / 1000)); last = t;
    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    if (ssjOn && !doc.hidden) ssjTick(dt);
    g.globalCompositeOperation = 'source-over';
    var i, p, keep = [];
    for (i = 0; i < parts.length; i++) {
      p = parts[i]; p.life -= dt;
      if (p.life <= 0) continue;
      keep.push(p);
      var f = p.life / p.max;
      if (p.k === 'in') { p.x += (p.tx - p.x) * Math.min(1, dt * 7); p.y += (p.ty - p.y) * Math.min(1, dt * 7); continue; }
      if (p.k === 'ring') { p.s += p.grow * dt; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 'spark') { p.vy += 900 * dt; p.vx *= .985; }
      else if (p.k === 'shard') {
        p.vy += 1600 * dt; p.rot += p.vr * dt;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, f * 2);
        g.fillStyle = p.col; g.strokeStyle = 'rgba(10,8,6,.7)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(p.pts[0][0], p.pts[0][1]); g.lineTo(p.pts[1][0], p.pts[1][1]); g.lineTo(p.pts[2][0], p.pts[2][1]); g.closePath(); g.fill(); g.stroke();
        g.restore();
      } else if (p.k === 'smoke') {
        p.s += p.grow * dt; p.vx *= .98;
        g.globalAlpha = Math.sin(f * Math.PI) * .9; g.drawImage(sprite(p.col), p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      } else if (p.k === 'leaf') {
        p.vy += Math.sin(p.life * 6 + p.ph) * 260 * dt; p.rot += p.vr * dt;
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.life * 7 + p.ph));
        g.globalAlpha = Math.min(1, f * 3); g.fillStyle = p.col;
        g.beginPath(); g.ellipse(0, 0, p.s, p.s * .45, 0, 0, PI2); g.fill();
        g.restore();
      } else if (p.k === 'streak') {
        g.globalAlpha = Math.sin(f * Math.PI) * .45; g.strokeStyle = p.col; g.lineWidth = p.w;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.len, p.y + Math.sin(p.x * .01) * 6); g.stroke();
      }
    }
    parts = keep;
    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < parts.length; i++) {
      p = parts[i]; var fl = p.life / p.max;
      if (p.k === 'spark' || p.k === 'in') {
        g.globalAlpha = Math.min(1, fl * 1.5); g.strokeStyle = p.col; g.lineWidth = p.w || 1.6;
        g.beginPath(); g.moveTo(p.x, p.y);
        if (p.k === 'in') g.lineTo(p.x + (p.x - p.tx) * .08, p.y + (p.y - p.ty) * .08); else g.lineTo(p.x - p.vx * .025, p.y - p.vy * .025);
        g.stroke();
      } else if (p.k === 'ember') {
        p.vx += Math.sin(p.life * 5 + p.ph) * 40 * dt;
        glow(p.x, p.y, p.s * (1 + Math.sin(p.life * 20) * .2), p.col, Math.min(1, fl * 1.4));
      } else if (p.k === 'ring') {
        g.globalAlpha = fl * .9; g.strokeStyle = p.col; g.lineWidth = 3 + fl * 10;
        g.beginPath(); g.arc(p.x, p.y, Math.max(0, p.s), 0, PI2); g.stroke();
      }
    }
    var kb = [];
    for (i = 0; i < bolts.length; i++) { var b = bolts[i]; b.life -= dt; if (b.life <= 0) continue; kb.push(b); drawBolt(b, Math.min(1, b.life / b.max * 2) * r(.55, 1)); }
    bolts = kb;
    orbs = orbs.filter(function (o) { if (o.dead) return false; drawOrb(o, dt); return true; });
    beams = beams.filter(function (bm) { drawBeam(bm, dt); return !bm.dead; });
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (parts.length || bolts.length || orbs.length || beams.length || ssjOn) requestAnimationFrame(loop);
    else { running = false; g.clearRect(0, 0, W, H); }
  }
  function run() { layers(); if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } }

  /* ============================ the cracks ============================== */
  function crackAt(x, y, n) {
    layers();
    var ns = 'http://www.w3.org/2000/svg', grp = doc.createElementNS(ns, 'g'), html = '<circle class="pw-crater" cx="' + x + '" cy="' + y + '" r="' + (small ? 90 : 150) + '" fill="url(#pw-crater)"/>';
    var reach = Math.max(W, H) * .75;
    function walk(px, py, a, len, segs, wig) {
      var d = 'M' + px.toFixed(1) + ' ' + py.toFixed(1), out = [d];
      for (var s = 0; s < segs; s++) {
        a += (rnd() - .5) * wig;
        var st = len / segs * r(.6, 1.4);
        px += Math.cos(a) * st; py += Math.sin(a) * st;
        d += 'L' + px.toFixed(1) + ' ' + py.toFixed(1);
        if (rnd() < .2 && segs > 5) out.push(walk(px, py, a + sign() * r(.5, 1.1), len * r(.15, .3), 4, .8)[0]);
      }
      out[0] = d;
      return out;
    }
    var paths = [];
    for (var i = 0; i < n; i++) paths = paths.concat(walk(x, y, i / n * PI2 + r(-.25, .25), reach * r(.35, 1), 12 + (rnd() * 8 | 0), .55));
    [r(30, 44), r(78, 104)].forEach(function (rad) {
      var k = 10 + (rnd() * 5 | 0), d = '';
      for (var j = 0; j <= k; j++) { var a = j / k * PI2, rr = rad * r(.8, 1.2); d += (j ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); }
      paths.push(d + 'Z');
    });
    paths.forEach(function (d, k) {
      var dl = (k * 18 % 260) + 'ms';
      html += '<path class="pw-crack-hi" pathLength="1" style="animation-delay:' + dl + '" d="' + d + '"/><path class="pw-crack-ln" pathLength="1" style="animation-delay:' + dl + '" d="' + d + '"/>';
    });
    grp.setAttribute('class', 'pw-crack');
    grp.innerHTML = html;
    cracks.appendChild(grp);
    while (cracks.querySelectorAll('.pw-crack').length > 5) cracks.querySelector('.pw-crack').remove();
  }

  /* ============================ the wreck ===============================
     Pieces are chosen top-down: the first block small enough to fall as
     one chunk wins and its children ride along with it. */
  var pieces = [], wrecked = false;
  var SKIPTAG = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, BR: 1, SOURCE: 1, TRACK: 1, TEMPLATE: 1, NOSCRIPT: 1, OPTION: 1, OPTGROUP: 1, WBR: 1, AREA: 1, MAP: 1, PARAM: 1, HEAD: 1, TITLE: 1 };
  var KEEP_OUT = '.pw-root,.pw-dock,.pw-arise,.toasts,.skip,.skip-link,.palette,.modal,.tabbar,.curtain,.progress,.loader,.lw-backdrop,[data-pw-keep]';
  function pick(limit, maxFrac, cls, inRect) {
    var out = [], all = doc.body.getElementsByTagName('*'), maxA = W * H * (maxFrac || .16);
    var box2 = inRect || { top: 0, bottom: H, left: 0, right: W };
    for (var i = 0; i < all.length && out.length < limit; i++) {
      var el = all[i];
      if (SKIPTAG[el.tagName] || (el.ownerSVGElement) || el.classList.contains(cls)) continue;
      var rc = el.getBoundingClientRect();
      if (rc.width < 14 || rc.height < 10 || rc.width > W * 1.25) continue;
      if (Math.min(rc.bottom, box2.bottom) - Math.max(rc.top, box2.top) < 8 || Math.min(rc.right, box2.right) - Math.max(rc.left, box2.left) < 8) continue;
      if (rc.width * rc.height > maxA) continue;
      if (el.closest(KEEP_OUT) || (el.parentElement && el.parentElement.closest('.' + cls)) || el.querySelector('.' + cls)) continue;
      var cs = getComputedStyle(el);
      if (cs.display === 'inline' || cs.display === 'contents' || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < .05) continue;
      if (cs.position === 'fixed') continue;
      el.classList.add(cls);
      out.push({ el: el, r: rc });
    }
    return out;
  }
  var BURNT = 'brightness(.82) saturate(.55) contrast(1.05)';
  function knock(p, o) {
    var rc = p.r, cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2, dist = Math.hypot(cx - o.x, cy - o.y);
    var dir = cx < o.x ? -1 : 1, pw = o.power || 1;
    var dx = dir * r(20, 140) * pw, dy = Math.max(24, H - rc.bottom - r(0, 60)), rot = sign() * r(10, 80) * Math.min(1.3, pw);
    var delay = (o.delay || 0) + Math.min(650, dist * .8) + r(0, 140), dur = reduce ? 1 : 700 + r(0, 400) + dy * .35;
    var end = T(dx, dy, rot);
    p.anim = p.el.animate([
      { transform: 'none', filter: 'none', easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: T(dx * .12, -r(8, 26), rot * .15), filter: 'brightness(1.5)', offset: .14, easing: 'cubic-bezier(.55,0,1,.55)' },
      { transform: end, filter: BURNT, offset: .8, easing: 'cubic-bezier(.2,.8,.4,1)' },
      { transform: T(dx, dy - r(8, 22), rot * 1.05), filter: BURNT, offset: .89, easing: 'cubic-bezier(.6,0,1,.6)' },
      { transform: end, filter: BURNT }
    ], { duration: dur, delay: delay, fill: 'forwards' });
    p.state = 'down';
    if (!reduce && o.fx && o.fx.n < (small ? 26 : 60)) {
      o.fx.n++;
      setTimeout(function () { sparks(cx, cy, 3, o.col, 420); if (rnd() < .5) smoke(cx, cy + 10, 1); }, delay);
    }
  }
  function blast(p, o) {
    var rc = p.r, cx = rc.left + rc.width / 2, delay = Math.max(0, (cx - o.x0)) * .45 + r(0, 80);
    p.anim = p.el.animate([
      { transform: 'none', filter: 'none', opacity: 1 },
      { transform: T(18, r(-8, 8), r(-4, 4)), filter: 'brightness(2.2) saturate(0)', opacity: 1, offset: .12 },
      { transform: T(W + 260 - rc.left, r(-160, 160), sign() * r(180, 720), .6), filter: 'brightness(3) saturate(0)', opacity: 0 }
    ], { duration: reduce ? 1 : r(650, 950), delay: delay, easing: 'cubic-bezier(.5,0,.9,.4)', fill: 'forwards' });
    p.state = 'gone';
  }
  function setWrecked(on) {
    wrecked = on;
    root.classList.toggle('pw-wrecked', on);
    if (areBtn) { areBtn.hidden = !on; if (on) areBtn.classList.add('is-in'); }
  }
  /* new blocks that scroll into view on a wrecked page arrive broken */
  var rubbleT = 0;
  addEventListener('scroll', function () {
    if (!wrecked || busy) return;
    clearTimeout(rubbleT); rubbleT = setTimeout(function () { rubble(); rubbleT = setTimeout(rubble, 900); }, 80);
  }, { passive: true });
  function rubble() {
    if (!wrecked || pieces.length > 800) return;
    pick(70, .16, 'pw-piece').forEach(function (p) {
      var hard = rnd() < .3, rot = sign() * (hard ? r(35, 95) : r(3, 18)), dx = r(-1, 1) * (hard ? 150 : 36), dy = hard ? r(60, 200) : r(0, 36);
      p.anim = p.el.animate([{ transform: 'none', filter: 'none' }, { transform: T(dx, dy, rot), filter: BURNT }], { duration: reduce ? 1 : r(260, 520), easing: 'cubic-bezier(.55,0,1,.5)', fill: 'forwards' });
      p.state = 'down';
      pieces.push(p);
    });
  }

  /* ============================== powers ================================ */
  var busy = false, areBtn = null, dock = null;
  function start(id) {
    if (busy) { if (dock) dock.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], 260); return false; }
    busy = true; layers(); quest('power'); closeMenu();
    XR.store('xr-pw-hint', 1);
    var hn = dock && dock.querySelector('.pw-hint'); if (hn) hn.hidden = true;
    return true;
  }
  function done(ms) { setTimeout(function () { busy = false; }, ms); }
  function hand(from) {
    if (from && from.getBoundingClientRect) {
      var b = from.getBoundingClientRect();
      if (b.width && b.bottom > 0 && b.top < H) return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }
    return { x: W * (small ? .2 : .18), y: H * (small ? .78 : .74) };
  }

  function chidori(from) {
    if (!start()) return;
    var o = hand(from), ix = W * r(.45, .6), iy = H * r(.38, .5);
    if (o.x > W * .6) ix = W * r(.3, .45);
    say('chidori', '千鳥', 'Chidori', 1500);
    shadeOn('radial-gradient(circle at ' + o.x + 'px ' + o.y + 'px, rgba(20,60,140,.25), rgba(2,6,22,.72) 60%)');
    SFX.chirp(1.45);
    var orb = { k: 'chidori', x: o.x, y: o.y, r: 2, to: small ? 22 : 30, t: 0 };
    orbs.push(orb); run();
    var zap = setInterval(function () { bolt(orb.x, orb.y, orb.x + r(-1, 1) * 260, orb.y + r(-1, 1) * 220, .12, '#8fd3ff', 1.4); }, 110);
    setTimeout(function () { clearInterval(zap); orb.move = { x0: orb.x, y0: orb.y, x1: ix, y1: iy, t0: orb.t, dur: .16 }; bolt(o.x, o.y, ix, iy, .35, '#b8e6ff', 3); }, 1150);
    setTimeout(function () {
      orb.dead = true;
      flash('#f2fbff', 380); SFX.boom(true); SFX.crack(); shake(750, small ? 10 : 16);
      crackAt(ix, iy, small ? 9 : 13);
      ring(ix, iy, 'rgba(190,230,255,1)', .6, 1800); ring(ix, iy, 'rgba(120,190,255,1)', .8, 1100);
      sparks(ix, iy, small ? 50 : 110, '#cfeeff', 1100); shards(ix, iy, small ? 20 : 44, 1.1); smoke(ix, iy, 10, 'rgba(20,18,24,.6)', 140);
      for (var k = 0; k < (small ? 5 : 9); k++) bolt(ix, iy, r(0, W), r(0, H), r(.35, .8), '#8fd3ff', 2.2);
      var zz = setInterval(function () { bolt(ix, iy, r(0, W), r(0, H), .2, '#8fd3ff', 1.6); }, 90);
      setTimeout(function () { clearInterval(zz); }, 800);
      var fx = { n: 0 };
      pick(small ? 90 : 190, .18, 'pw-piece').forEach(function (p) { knock(p, { x: ix, y: iy, power: 1, fx: fx, col: '#cfeeff' }); pieces.push(p); });
      setWrecked(true);
    }, 1330);
    setTimeout(function () { shadeOff(); announce('Chidori. The page is wrecked. Press Arise to bring it back.'); }, 2500);
    done(2600);
  }

  function kamehameha(from) {
    if (!start()) return;
    var o = hand(from), gold = ssjOn, ox = Math.min(o.x, W * .3), oy = Math.max(H * .3, Math.min(H * .7, o.y));
    if (!from) { ox = W * (small ? .14 : .12); oy = H * .52; }
    shadeOn('radial-gradient(circle at ' + ox + 'px ' + oy + 'px, rgba(30,90,200,.25), rgba(0,8,30,.75) 65%)');
    SFX.charge(2.05);
    var orb = { k: 'kame', x: ox, y: oy, r: 2, to: (small ? 34 : 54) * (gold ? 1.35 : 1), t: 0, pull: true, gold: gold };
    orbs.push(orb); run();
    [['か', 'Ka'], ['め', 'Me'], ['は', 'Ha'], ['め', 'Me']].forEach(function (s, i) {
      setTimeout(function () { say('kame', s[0], s[1] + '…', 460); SFX.blip(520 + i * 120); }, i * 500);
    });
    setTimeout(function () { shake(900, 4); }, 1100);
    setTimeout(function () {
      orb.dead = true;
      var h = H * (gold ? .42 : .3) * (small ? 1.15 : 1);
      say('kame', '波ァァッ!!', 'HAAAAA', 1500);
      SFX.beam(1.5); shake(1500, small ? 12 : 20);
      flash(gold ? 'rgba(255,230,160,.7)' : 'rgba(190,230,255,.7)', 500);
      beams.push({ x0: ox, y: oy, h: h, t: 0, dur: 1.6, gold: gold }); run();
      var band = { top: oy - h * .45, bottom: oy + h * .45, left: ox - 20, right: W };
      pick(small ? 70 : 150, .2, 'pw-piece', band).forEach(function (p) { blast(p, { x0: ox }); pieces.push(p); });
      setTimeout(function () {
        var fx = { n: 0 };
        pick(small ? 70 : 140, .18, 'pw-piece').forEach(function (p) { knock(p, { x: ox, y: oy, power: .75, fx: fx, col: gold ? '#ffe39a' : '#cdeeff' }); pieces.push(p); });
        crackAt(W * r(.55, .75), oy + sign() * h * .5, small ? 7 : 10);
      }, 350);
      setWrecked(true);
    }, 2050);
    setTimeout(function () { smoke(W * .5, oy, 14, 'rgba(24,26,40,.6)', 120); shadeOff(); announce('Kamehameha. The beam blasted the page. Press Arise to bring it back.'); }, 3650);
    done(3700);
  }

  function wind(from) {
    if (!start()) return;
    say('wind', '風遁', 'Wind Release', 1300);
    SFX.whoosh(2);
    var n = small ? 40 : 90, cols = ['#6f9a3a', '#8fb450', '#f3b7c2', '#f7cdd5', '#e7a0ae', '#c9d98f'];
    for (var i = 0; i < n; i++) add({ k: 'leaf', x: -r(20, W * .6), y: r(-20, H), vx: r(520, 1100), vy: r(-80, 60), max: r(1.6, 2.6), rot: rnd() * PI2, vr: r(-8, 8), ph: rnd() * 6, s: r(5, 11), col: cols[i % cols.length] });
    for (i = 0; i < (small ? 22 : 50); i++) add({ k: 'streak', x: -r(0, W), y: r(0, H), vx: r(1400, 2400), vy: 0, max: r(.6, 1.2), len: r(80, 260), w: r(1, 2.2), col: 'rgba(255,255,255,.9)' });
    var down = pieces.filter(function (p) { if (p.state !== 'down' || !p.el.isConnected) return false; var b = p.el.getBoundingClientRect(); return b.bottom > -100 && b.top < H + 100; });
    if (wrecked && down.length) {
      down.forEach(function (p) {
        var m = getComputedStyle(p.el).transform, rc = p.el.getBoundingClientRect(), delay = rc.left / W * 500 + r(0, 200);
        if (p.anim) p.anim.cancel();
        p.anim = p.el.animate([
          { transform: m === 'none' ? 'none' : m, filter: BURNT, opacity: 1 },
          { transform: 'translate(' + (W + 200 - rc.left) + 'px,' + r(-220, 40) + 'px) ' + (m === 'none' ? '' : m) + ' rotate(' + r(90, 400) + 'deg)', filter: BURNT, opacity: 0 }
        ], { duration: reduce ? 1 : r(700, 1100), delay: delay, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'both' });
        p.state = 'gone';
      });
      announce('Wind Release. The rubble blew away.');
      setTimeout(function () { say('wind', '一掃', 'Swept clean', 1100); }, 1200);
    } else {
      var sw = pick(small ? 60 : 140, .3, 'pw-sway');
      sw.forEach(function (p) {
        var delay = (p.r.left + p.r.width / 2) / W * 520 + r(0, 80), k = r(.6, 1.2);
        p.el.animate([
          { transform: 'none', transformOrigin: '50% 100%' },
          { transform: 'skewX(' + (-8 * k) + 'deg) translateX(' + 12 * k + 'px) rotate(' + (-1.4 * k) + 'deg)', transformOrigin: '50% 100%', offset: .3 },
          { transform: 'skewX(' + 4 * k + 'deg) translateX(' + (-5 * k) + 'px)', transformOrigin: '50% 100%', offset: .6 },
          { transform: 'skewX(' + (-1.5 * k) + 'deg)', transformOrigin: '50% 100%', offset: .82 },
          { transform: 'none', transformOrigin: '50% 100%' }
        ], { duration: reduce ? 1 : 1300, delay: delay, easing: 'ease-in-out' }).onfinish = function () { p.el.classList.remove('pw-sway'); };
      });
      setTimeout(function () { sw.forEach(function (p) { p.el.classList.remove('pw-sway'); }); }, 2400);
      announce('Wind Release.');
    }
    done(1500);
  }

  function arise(from) {
    if (!start()) return;
    quest('power');
    var list = pieces.filter(function (p) { return p.el.isConnected; }), flourish = !list.length;
    if (wrecked) quest('power-arise');
    if (flourish) list = pick(small ? 40 : 90, .25, 'pw-piece').map(function (p) { p.state = 'up'; return p; });
    pieces = [];
    root.classList.add('pw-arising');
    shadeOn('radial-gradient(ellipse at 50% 110%, rgba(70,40,170,.55), rgba(6,4,18,.9) 70%)');
    setTimeout(function () { say('arise', 'ARISE', '起きろ', 2300); }, 250);
    SFX.arise(); shake(600, 5);
    var from2 = 0, puff = setInterval(function () {
      for (var i = 0; i < (small ? 3 : 6); i++) {
        add({ k: 'smoke', x: r(0, W), y: H + 30, vx: r(-20, 20), vy: -r(80, 220), max: r(1.4, 2.4), s: r(50, 120), grow: 40, col: 'rgba(40,20,90,.6)' });
        add({ k: 'ember', x: r(0, W), y: H + 10, vx: r(-20, 20), vy: -r(120, 360), max: r(1, 2.2), s: r(5, 12), ph: rnd() * 6, col: 'rgba(150,120,255,.9)' });
      }
      if (++from2 > 22) clearInterval(puff);
    }, 90);
    run();
    if (cracks) { cracks.classList.add('is-heal'); setTimeout(function () { cracks.querySelectorAll('.pw-crack').forEach(function (c) { c.remove(); }); cracks.classList.remove('is-heal'); }, 1900); }
    list.sort(function (a, b) { return b.el.getBoundingClientRect().top - a.el.getBoundingClientRect().top; });
    list.forEach(function (p, i) {
      var cs = getComputedStyle(p.el), m = cs.transform, op = cs.opacity, rc = p.el.getBoundingClientRect();
      var onScreen = rc.bottom > -200 && rc.top < H + 200;
      var delay = (onScreen ? 650 + Math.min(1300, i * (small ? 22 : 12)) : 400) + r(0, 160);
      var start0 = flourish ? 'translateY(34px)' : (m === 'none' ? 'none' : m);
      if (p.anim) p.anim.cancel();
      var a = p.el.animate([
        { transform: start0, opacity: flourish ? 0 : op, filter: 'brightness(1) drop-shadow(0 0 0 rgba(120,90,255,0))' },
        { transform: start0, opacity: 1, filter: 'brightness(0) drop-shadow(0 0 14px rgba(120,90,255,.95))', offset: .16 },
        { transform: 'translateY(-16px) scale(1.02)', opacity: 1, filter: 'brightness(.2) drop-shadow(0 0 20px rgba(150,120,255,.95))', offset: .66 },
        { transform: 'none', opacity: 1, filter: 'brightness(1) drop-shadow(0 0 0 rgba(150,120,255,0))' }
      ], { duration: reduce ? 1 : (onScreen ? 1500 : 600), delay: reduce ? 0 : delay, easing: 'cubic-bezier(.25,.75,.25,1)', fill: 'both' });
      a.onfinish = function () { a.cancel(); p.el.classList.remove('pw-piece'); };
      if (onScreen && !reduce && i < 40) setTimeout(function () { var b = p.el.getBoundingClientRect(); add({ k: 'ember', x: b.left + b.width / 2, y: b.bottom, vx: 0, vy: -r(60, 160), max: 1, s: 16, ph: 0, col: 'rgba(160,130,255,.9)' }); }, delay + 200);
    });
    setWrecked(false);
    setTimeout(function () { shadeOff(); root.classList.remove('pw-arising'); announce('Arise. Everything is back in place.'); }, 3300);
    done(3000);
  }

  /* ---------- Super Saiyan: a mode, not a move ---------- */
  var ssjAcc = 0, ssjBolt = 0;
  function ssjTick(dt) {
    ssjAcc += dt * (small ? 14 : 34);
    while (ssjAcc > 1) {
      ssjAcc--;
      var edge = rnd(), x, y;
      if (edge < .6) { x = r(0, W); y = H + 10; } else if (edge < .8) { x = r(-10, 30); y = r(H * .3, H); } else { x = W - r(-10, 30); y = r(H * .3, H); }
      add({ k: 'ember', x: x, y: y, vx: r(-20, 20), vy: -r(140, 420), max: r(.8, 1.8), s: r(4, 10), ph: rnd() * 6, col: rnd() < .8 ? 'rgba(255,205,70,.95)' : 'rgba(255,245,200,1)' });
    }
    ssjBolt -= dt;
    if (ssjBolt <= 0 && !small) {
      ssjBolt = r(.8, 2.2);
      var sx = rnd() < .5 ? r(0, 60) : W - r(0, 60), sy = r(H * .2, H);
      bolt(sx, sy, sx + r(-80, 80), sy + r(-120, 120), .16, '#9fdcff', 1.2);
    }
  }
  function ssj(on, quiet) {
    on = on == null ? !ssjOn : !!on;
    if (on === ssjOn) return;
    if (!quiet && !start()) return;
    ssjOn = on;
    root.classList.toggle('pw-ssj', on);
    XR.store('xr-pw-ssj', on ? 1 : 0);
    if (dock) dock.querySelector('[data-power="ssj"]').setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) {
      layers(); run();
      if (!quiet) {
        say('ssj', '超', 'Super Saiyan', 1500); SFX.ssj();
        flash('rgba(255,222,110,.9)', 520); shake(1000, 9);
        ring(W / 2, H / 2, 'rgba(255,210,80,1)', .7, 1600);
        for (var i = 0; i < 6; i++) bolt(W / 2, H / 2, r(0, W), r(0, H), .4, '#ffe9a8', 2);
        announce('Super Saiyan mode on. The site is gold.');
      }
    } else if (!quiet) { say('ssj-off', '解', 'Power down', 900); SFX.hit(); announce('Super Saiyan mode off.'); }
    if (!quiet) done(on ? 1100 : 400);
  }

  /* ================================ dock ================================ */
  var POWERS = [
    ['chidori', '千', 'Chidori', 'Lightning strike'],
    ['wind', '風', 'Wind', 'Blow it all away'],
    ['kamehameha', '波', 'Kamehameha', 'Ka-me-ha-me-HA'],
    ['ssj', '超', 'Super Saiyan', 'Golden aura mode'],
    ['arise', '起', 'Arise', 'Raise what fell']
  ];
  var RUN = { chidori: chidori, wind: wind, kamehameha: kamehameha, arise: arise, ssj: function () { ssj(); } };
  function closeMenu() { if (dock && dock.classList.contains('is-open')) { dock.classList.remove('is-open'); dock.querySelector('.pw-fab').setAttribute('aria-expanded', 'false'); } }
  function buildDock() {
    dock = doc.createElement('div');
    dock.className = 'pw-dock';
    dock.innerHTML = '<div class="pw-menu" id="pw-menu" role="group" aria-label="Powers">' +
      POWERS.map(function (p) {
        return '<button type="button" class="pw-btn" data-power="' + p[0] + '"' + (p[0] === 'ssj' ? ' aria-pressed="false"' : '') + '><i class="pw-k" aria-hidden="true">' + p[1] + '</i><span><b>' + p[2] + '</b><small>' + p[3] + '</small></span></button>';
      }).join('') +
      '<button type="button" class="pw-mute" aria-pressed="' + (muted ? 'true' : 'false') + '">' + XR.icon('volume') + '<span>' + (muted ? 'Sound off' : 'Sound on') + '</span></button></div>' +
      '<button type="button" class="pw-fab" aria-expanded="false" aria-controls="pw-menu"><span class="pw-fab-k" aria-hidden="true">術</span><span class="pw-fab-t">Powers</span></button>' +
      '<p class="pw-hint" hidden>Try a jutsu. Chidori wrecks the page.</p>';
    doc.body.appendChild(dock);
    areBtn = doc.createElement('button');
    areBtn.type = 'button'; areBtn.className = 'pw-arise'; areBtn.hidden = true;
    areBtn.setAttribute('data-power', 'arise');
    areBtn.innerHTML = '<i aria-hidden="true">起</i><span>Arise</span>';
    doc.body.appendChild(areBtn);
    live = doc.createElement('p'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
    doc.body.appendChild(live);
    var fab = dock.querySelector('.pw-fab');
    fab.addEventListener('click', function () {
      var open = !dock.classList.contains('is-open');
      dock.classList.toggle('is-open', open);
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      hint.hidden = true;
      if (open) dock.querySelector('.pw-btn').focus({ preventScroll: true });
    });
    var mute = dock.querySelector('.pw-mute');
    mute.addEventListener('click', function () {
      muted = !muted; XR.store('xr-pw-mute', muted ? 1 : 0);
      mute.setAttribute('aria-pressed', muted ? 'true' : 'false');
      mute.querySelector('span').textContent = muted ? 'Sound off' : 'Sound on';
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dock.classList.contains('is-open')) { closeMenu(); fab.focus(); } });
    doc.addEventListener('pointerdown', function (e) { if (!dock.contains(e.target)) closeMenu(); });
    var hint = dock.querySelector('.pw-hint');
    if (XR.store('xr-pw-hint') !== 1) {
      setTimeout(function () { if (!dock.classList.contains('is-open') && XR.store('xr-pw-hint') !== 1) { hint.hidden = false; XR.store('xr-pw-hint', 1); setTimeout(function () { hint.hidden = true; }, 7000); } }, 5200);
    }
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-power]');
    if (!b || b === doc.body) return;
    var fn = RUN[b.getAttribute('data-power')];
    if (!fn) return;
    e.preventDefault();
    fn(b.closest('.pw-dock') ? null : b);
  });

  buildDock();
  if (XR.store('xr-pw-ssj') === 1) ssj(true, true);

  window.XRPOWER = {
    chidori: chidori, wind: wind, kamehameha: kamehameha, arise: arise, ssj: ssj,
    isWrecked: function () { return wrecked; }, isSsj: function () { return ssjOn; },
    sfx: SFX, say: say, flash: flash, shake: shake
  };
})();
