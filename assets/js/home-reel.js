/* =====================================================================
   XIRAIYA — home: "Comp 01", a live After Effects comp
   A dark motion-design workspace plays a 12 second kinetic-type piece:
   an ink ensō and a hanko stamp, "I build" plus seven crafts (each with
   its own transition), a night flip, then a hand-off to Albedo below.
   On desktop the section pins and scrolling scrubs the playhead; phones
   and short screens autoplay it while it is on screen. Every keyframe
   in the timeline panel is a real key driving the viewer.
   Reduced motion: a still poster frame; Play stays available.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, clamp = XR.clamp;
  var sec = $('#reel');
  if (!sec) return;
  var app = $('.rl-app', sec), comp = $('.rl-comp', sec), board = $('.rl-board', sec);
  if (!app || !comp || !board) return;

  var FPS = 30, DUR = 12, FR = DUR * FPS;
  var SQ = window.matchMedia('(max-width: 760px)').matches;   // phones get the square "social cut"
  var CW = SQ ? 1080 : 1920, CH = 1080;
  /* layout in comp px: e0/e1 ensō start/bullet, l1/l2 = [x, top, font-size], ic = [cx, cy, size] */
  var L = SQ ? {
    e0: [540, 540], e1: [118, 322], eS: .3, eK: 2.2, cap: [80, 76],
    l1: [205, 250, 150], l2: [205, 470, 96], fit: 800, ic: [890, 250, 120],
    nt: [110, 836, 76, 880], st: [110, 1016, 24], lift: -236,
    moon: [900, 150, 56], hd: [410, 118], nx: 790, lines: 30
  } : {
    e0: [960, 540], e1: [300, 420], eS: .34, eK: 2.6, cap: [192, 118],
    l1: [430, 330, 200], l2: [430, 640, 120], fit: 1060, ic: [1650, 694, 150],
    nt: [430, 890, 96, 1440], st: [430, 1012, 30], lift: -150,
    moon: [1600, 180, 70], hd: [470, 150], nx: 760, lines: 48
  };
  var WORDS = [
    ['websites', 'roll', 'globe'], ['Telegram bots', 'wipe', 'send'], ['AI agents', 'glitch', 'bot'],
    ['Chrome extensions', 'pop', 'puzzle'], ['Minecraft plugins', 'hold', 'cube'],
    ['Android apps', 'flip', 'phone'], ['crypto checkouts', 'drop', 'btc']
  ];
  var CFG = window.XIRAIYA_CONFIG || {}, SVC = window.XIRAIYA_SERVICES || [];
  var YRS = +CFG.experienceYears || 5, CRAFTS = SVC.length || 11;

  /* ---------- easing: cubic-bezier solver, the site's curves ---------- */
  var RAW = { out: [.16, 1, .3, 1], io: [.77, 0, .175, 1], ease: [.33, 0, .67, 1], in: [.7, 0, .84, 0], spring: [.34, 1.56, .64, 1] };
  var EZN = { lin: 'Linear', hold: 'Hold', out: 'Ease Out', io: 'Ease In-Out', ease: 'Easy Ease', in: 'Ease In', spring: 'Overshoot' };
  function bez(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sx(u) { return ((ax * u + bx) * u + cx) * u; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var u = x, i, d, s;
      for (i = 0; i < 6; i++) {
        d = sx(u) - x; if (Math.abs(d) < 1e-5) break;
        s = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(s) < 1e-6) break;
        u -= d / s;
      }
      if (u < 0 || u > 1 || Math.abs(sx(u) - x) > 1e-4) {
        var lo = 0, hi = 1; u = x;
        for (i = 0; i < 24; i++) { if (sx(u) > x) hi = u; else lo = u; u = (lo + hi) / 2; }
      }
      return ((ay * u + by) * u + cy) * u;
    };
  }
  var EZ = { lin: function (u) { return u; }, hold: function () { return 0; } };
  Object.keys(RAW).forEach(function (k) { EZ[k] = bez.apply(null, RAW[k]); });

  var HEX = {};
  function rgb(h) { return HEX[h] || (HEX[h] = [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]); }
  function mix(a, b, u) {
    if (typeof a === 'number') return a + (b - a) * u;
    if (u <= 0) return a;
    if (u >= 1) return b;
    var p = rgb(a), q = rgb(b);
    return 'rgb(' + Math.round(p[0] + (q[0] - p[0]) * u) + ',' + Math.round(p[1] + (q[1] - p[1]) * u) + ',' + Math.round(p[2] + (q[2] - p[2]) * u) + ')';
  }

  /* ---------- DOM helpers ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function h(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function s(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pos(e, x, y, fs) { e.style.left = x + 'px'; e.style.top = y + 'px'; if (fs) e.style.fontSize = fs + 'px'; }
  function chars(parent, text) {
    return text.split('').map(function (c) {
      var m = h('span', 'rl-mask', parent);
      return h('span', 'rl-ch', m, c === ' ' ? ' ' : c);
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- the track engine ---------- */
  var nodes = [], tracks = [];
  /* kind: h = HTML (CSS transform), g = SVG group (transform attribute), p = SVG path (trim only), o = opacity only */
  function node(e, kind, bx, by) {
    e._r = { kind: kind || 'h', bx: bx || 0, by: by || 0, v: {}, c: {} };
    nodes.push(e);
    return e;
  }
  function tr(n, p, keys, layer) {
    if (!n._r) node(n);
    if (p === 'gx') n._r.gx = true;
    tracks.push({ n: n, p: p, k: keys, l: layer });
  }
  function evalAt(k, t) {
    if (t <= k[0][0]) return k[0][1];
    var n = k.length - 1;
    if (t >= k[n][0]) return k[n][1];
    for (var i = 0; i < n; i++) if (t < k[i + 1][0]) break;
    var a = k[i], b = k[i + 1], e = a[2] || 'lin';
    if (e === 'hold') return a[1];
    return mix(a[1], b[1], EZ[e]((t - a[0]) / (b[0] - a[0])));
  }
  var ADD = { x: 1, y: 1, yp: 1, r: 1, rx: 1, skx: 1, gx: 1 }, MUL = { s: 1, sx: 1, sy: 1, o: 1 };
  function put(e, c, key, val, fn) { if (c[key] !== val) { c[key] = val; fn(val); } }

  function write(n) {
    var r = n._r, v = r.v, c = r.c, st = n.style;
    var o = +clamp(v.o, 0, 1).toFixed(3);
    var sx = Math.max(0, v.s * v.sx), sy = Math.max(0, v.s * v.sy);
    if (r.kind === 'g') {
      put(n, c, 'tf', 'translate(' + (r.bx + v.x).toFixed(2) + ' ' + (r.by + v.y).toFixed(2) + ')' +
        (v.r ? ' rotate(' + v.r.toFixed(2) + ')' : '') + (sx !== 1 || sy !== 1 ? ' scale(' + sx.toFixed(4) + ' ' + sy.toFixed(4) + ')' : ''),
        function (x) { n.setAttribute('transform', x); });
      put(n, c, 'o', o, function (x) { n.setAttribute('opacity', x); });
      return;
    }
    if (r.kind === 'o') { put(n, c, 'o', o, function (x) { n.setAttribute('opacity', x); }); return; }
    if (r.kind === 'v') {
      if (v.bg !== undefined) put(n, c, 'bg', v.bg, function (x) { st.setProperty('--rl-bgc', x); });
      if (v.fg !== undefined) put(n, c, 'fg', v.fg, function (x) { st.setProperty('--rl-fg', x); });
      return;
    }
    if (r.kind === 'p') {
      if (v.te === undefined) return;
      var e = clamp(v.te, 0, 1), b = clamp(v.ts, 0, e), len = e - b;
      put(n, c, 'trim', len.toFixed(4) + '|' + b.toFixed(4), function () {
        st.strokeDasharray = len > .0005 ? len.toFixed(4) + ' 2' : '0 2';
        st.strokeDashoffset = (-b).toFixed(4);
        st.visibility = len > .0005 ? '' : 'hidden';
      });
      return;
    }
    put(n, c, 'tf', 'translate3d(' + v.x.toFixed(2) + 'px,' + v.y.toFixed(2) + 'px,0)' +
      (v.yp ? ' translateY(' + v.yp.toFixed(2) + '%)' : '') +
      (v.rx ? ' perspective(900px) rotateX(' + v.rx.toFixed(2) + 'deg)' : '') +
      (v.r ? ' rotate(' + v.r.toFixed(2) + 'deg)' : '') +
      (v.skx ? ' skewX(' + v.skx.toFixed(2) + 'deg)' : '') +
      (sx !== 1 || sy !== 1 ? ' scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')' : ''),
      function (x) { st.transform = x; });
    put(n, c, 'o', o, function (x) { st.opacity = x; });
    if (v.clip !== undefined) put(n, c, 'clip', v.clip.toFixed(2), function (x) { st.clipPath = 'inset(-10% ' + x + '% -20% 0)'; });
    if (v.ls !== undefined) put(n, c, 'ls', v.ls.toFixed(4), function (x) { st.letterSpacing = x + 'em'; });
    if (v.bgx !== undefined) put(n, c, 'bgx', v.bgx.toFixed(2), function (x) { st.backgroundPosition = x + '% 0'; });
    if (v.ico !== undefined) put(n, c, 'ico', (110 * (1 - clamp(v.ico, 0, 1))).toFixed(2), function (x) { st.strokeDashoffset = x; });
    if (r.gx) put(n, c, 'gx', v.gx, function (x) { st.setProperty('--gx', x + 'px'); st.setProperty('--go', x ? 1 : 0); });
  }

  /* ---------- build the composition ---------- */
  comp.style.width = CW + 'px';
  comp.style.height = CH + 'px';
  var guides = $('.rl-guides', sec);
  if (guides) {
    guides.setAttribute('viewBox', '0 0 ' + CW + ' ' + CH);
    guides.style.width = CW + 'px'; guides.style.height = CH + 'px';
    s('rect', { x: CW * .05, y: CH * .05, width: CW * .9, height: CH * .9 }, guides);
    s('rect', { x: CW * .1, y: CH * .1, width: CW * .8, height: CH * .8 }, guides);
    s('path', { d: 'M' + (CW / 2 - 40) + ' ' + CH / 2 + 'h80M' + CW / 2 + ' ' + (CH / 2 - 40) + 'v80' }, guides);
  }
  var glow = h('div', 'rl-glow', comp);
  var sky = s('svg', { class: 'rl-sky', viewBox: '0 0 ' + CW + ' ' + CH }, comp);
  var cam = h('div', 'rl-cam', comp);
  var svg = s('svg', { class: 'rl-svg', viewBox: '0 0 ' + CW + ' ' + CH }, cam);
  h('div', 'rl-grain', comp);

  function burst(parent, cls, seed) {
    var g = s('g', { class: 'rl-burst ' + cls }, parent), rnd = XR.seeded(seed), n = L.lines;
    for (var i = 0; i < n; i++) {
      var a = (i + rnd() * .6) / n * Math.PI * 2, r0 = 330 + rnd() * 90, r1 = 900 - rnd() * 260;
      s('line', { x1: (Math.cos(a) * r0).toFixed(1), y1: (Math.sin(a) * r0).toFixed(1), x2: (Math.cos(a) * r1).toFixed(1), y2: (Math.sin(a) * r1).toFixed(1), 'stroke-width': (2 + rnd() * 3).toFixed(1) }, g);
    }
    return g;
  }
  var burstP = node(burst(svg, 'paper', 'rl-burst'), 'g', CW / 2, CH / 2);
  var burstN = node(burst(sky, 'night', 'rl-burst-n'), 'g', CW / 2, CH / 2);

  /* ensō + hanko (one group; it later becomes the bullet in front of "I build") */
  var ensoX = node(s('g', {}, svg), 'g');
  var enso = node(s('g', {}, ensoX), 'g');
  var art = s('g', { transform: 'scale(' + L.eK + ') translate(-100 -100)' }, enso);
  var ensoMain = node(s('path', { class: 'rl-enso', pathLength: 1, d: 'M112 20C160 26 186 64 182 106 178 150 142 182 98 180 54 178 20 144 22 100 24 62 52 30 92 22' }, art), 'p');
  var ensoThin = node(s('path', { class: 'rl-enso thin', pathLength: 1, d: 'M120 30C158 40 176 72 172 108' }, art), 'p');
  var rnd = XR.seeded('rl-ink'), drops = [], i;
  for (i = 0; i < 14; i++) {
    var da = -.7 + rnd() * 2.5, dd = 110 + rnd() * 150;
    var dg = node(s('g', {}, enso), 'g', Math.cos(da) * dd, Math.sin(da) * dd);
    s('circle', { r: (4 + rnd() * 12).toFixed(1), class: 'rl-drop' }, dg);
    drops.push(dg);
  }
  var hanko = node(s('g', {}, enso), 'g');
  s('rect', { x: -75, y: -75, width: 150, height: 150, rx: 6, fill: '#c4321d' }, hanko);
  s('rect', { x: -65, y: -65, width: 130, height: 130, rx: 3, fill: 'none', stroke: '#fbf1dc', 'stroke-opacity': .6, 'stroke-width': 4 }, hanko);
  s('text', { x: 0, y: 6, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'rl-hanko-t' }, hanko).textContent = '児';

  /* "I build" + caption */
  var l1x = h('div', 'rl-x', cam);
  var cap = h('div', 'rl-cap', l1x, SQ ? 'Comp 01 · 1080×1080 · 児雷也' : 'Comp 01 · What I build · 児雷也');
  pos(cap, L.cap[0], L.cap[1]);
  var l1 = h('div', 'rl-line', l1x);
  pos(l1, L.l1[0], L.l1[1], L.l1[2]);
  var l1c = chars(l1, 'I build');
  var caret = h('span', 'rl-caret', l1);

  /* the craft slot: seven words, underline brushes, one wipe plate */
  var l2x = h('div', 'rl-x', cam), l2 = h('div', 'rl-line rl-l2', l2x);
  pos(l2, L.l2[0], L.l2[1], L.l2[2]);
  var W = WORDS.map(function (w) {
    var fit = h('div', 'rl-wfit', l2), clip = h('div', 'rl-wclip', fit), word = h('div', 'rl-w', clip);
    word.setAttribute('data-t', w[0]);
    var ul = s('svg', { class: 'rl-ul' + (w[1] === 'drop' ? ' gold' : ''), width: 10, height: 40, viewBox: '0 0 10 40' }, fit);
    return { fit: fit, w: word, cs: chars(word, w[0]), ul: ul, up: s('path', { pathLength: 1 }, ul), txt: w[0] };
  });
  var wipe = h('div', 'rl-wipe', l2);
  wipe.style.width = (L.fit + 60) + 'px';
  var icx = h('div', 'rl-x', cam);
  var ICO = WORDS.map(function (w) {
    var e = s('svg', { class: 'rl-icon', viewBox: '0 0 24 24' }, icx);
    s('use', { href: '#i-' + w[2] }, e);
    e.style.left = (L.ic[0] - L.ic[2] / 2) + 'px'; e.style.top = (L.ic[1] - L.ic[2] / 2) + 'px';
    e.style.width = e.style.height = L.ic[2] + 'px';
    return e;
  });

  /* night line, stats, moon */
  var ntx = h('div', 'rl-x', cam), nt = h('div', 'rl-line rl-night', ntx);
  pos(nt, L.nt[0], L.nt[1], L.nt[2]);
  nt.style.width = L.nt[3] + 'px';
  var NW = 'that work while you sleep.'.split(' ').map(function (w, k, a) {
    var e = h('span', 'rl-nw' + (k === a.length - 1 ? ' red' : ''), nt, w);
    if (k < a.length - 1) nt.appendChild(document.createTextNode(' '));
    return e;
  });
  var stx = h('div', 'rl-x', cam), stats = h('div', 'rl-stats', stx);
  pos(stats, L.st[0], L.st[1], L.st[2]);
  var stY = h('span', '', stats, '00');
  stats.appendChild(document.createTextNode('+ years · '));
  var stN = h('span', '', stats, '00');
  stats.appendChild(document.createTextNode(' crafts · '));
  if (SQ) h('br', '', stats);
  stats.appendChild(document.createTextNode('24/7 uptime · Rajshahi, BD'));

  var defs = s('defs', {}, sky), mk = s('mask', { id: 'rl-moon-m', maskUnits: 'userSpaceOnUse', x: -300, y: -300, width: 600, height: 600 }, defs);
  s('rect', { x: -300, y: -300, width: 600, height: 600, fill: '#fff' }, mk);
  s('circle', { cx: (L.moon[2] * .4).toFixed(1), cy: (-L.moon[2] * .26).toFixed(1), r: L.moon[2], fill: '#000' }, mk);
  var moonX = node(s('g', {}, sky), 'g');
  var moon = s('g', { transform: 'translate(' + L.moon[0] + ' ' + L.moon[1] + ')' }, moonX);
  var moonFill = node(s('circle', { r: L.moon[2], class: 'rl-moon-fill', mask: 'url(#rl-moon-m)' }, moon), 'o');
  var moonRing = node(s('circle', { r: L.moon[2], class: 'rl-moon-ring', pathLength: 1, transform: 'rotate(-90)', mask: 'url(#rl-moon-m)' }, moon), 'p');
  var rays = node(s('g', {}, moon), 'g'), RAYS = [];
  for (i = 0; i < 12; i++) {
    var rg = node(s('g', {}, rays), 'g');
    s('line', { class: 'rl-ray', x1: 0, y1: -(L.moon[2] + 40), x2: 0, y2: -(L.moon[2] + 70), transform: 'rotate(' + i * 30 + ')' }, rg);
    RAYS.push(rg);
  }
  var streaks = s('g', { transform: 'rotate(-24 ' + CW / 2 + ' ' + CH / 2 + ')' }, sky), SK = [], rs = XR.seeded('rl-streak');
  [.6, .8, 1, 1.1, 1.25, 1.4].forEach(function (f) {
    var len = 300 + rs() * 400, g = node(s('g', {}, streaks), 'g', 0, CH * (.1 + rs() * .8));
    s('line', { class: 'rl-streak', x1: -len, y1: 0, x2: 0, y2: 0, 'stroke-width': (2 + rs() * 2).toFixed(1) }, g);
    SK.push([g, len, f]);
  });

  /* hand-off */
  var hd = h('div', 'rl-line rl-hand', cam);
  pos(hd, 0, L.hd[0], L.hd[1]);
  var hdc = chars(hd, SQ ? 'Now meet' : 'Now meet the crew.');
  if (SQ) { hd.appendChild(document.createElement('br')); hdc = hdc.concat(chars(hd, 'the crew.')); }
  var hdg = h('div', 'rl-line rl-hand rl-hand-glow', cam);
  pos(hdg, 0, L.hd[0], L.hd[1]);
  hdg.innerHTML = SQ ? 'Now meet<br>the crew.' : 'Now meet the crew.';
  var nx = h('div', 'rl-next', cam);
  pos(nx, 0, L.nx);
  nx.innerHTML = 'Next comp · 01_Albedo_Overseer <svg class="ic" aria-hidden="true"><use href="#i-arrow-right"/></svg>';

  /* ---------- keyframes: layer numbers match the timeline rows ---------- */
  node(comp, 'v');
  tr(comp, 'bg', [[0, '#efe4cc', 'hold'], [7.1, '#efe4cc', 'io'], [7.6, '#0a0806', 'hold'], [10.6, '#0a0806', 'io'], [11.4, '#07030c']], 10);
  tr(comp, 'fg', [[0, '#1f1813', 'hold'], [7.1, '#1f1813', 'io'], [7.6, '#efe4cc']], 10);
  tr(glow, 'o', [[0, 0, 'hold'], [10.6, 0, 'out'], [11.6, 1]], 10);

  // Shot 1 · 墨 cold open: the ensō draws, the hanko slams, ink flies
  tr(enso, 'x', [[0, L.e0[0], 'hold'], [2, L.e0[0], 'ease'], [2.7, L.e1[0]]], 9);
  tr(enso, 'y', [[0, L.e0[1], 'hold'], [2, L.e0[1], 'ease'], [2.7, L.e1[1]]], 9);
  tr(enso, 's', [[2, 1, 'ease'], [2.7, L.eS]], 9);
  tr(enso, 'r', [[.1, -40, 'out'], [1.3, 0, 'hold'], [2, 0, 'ease'], [2.7, -20]], 9);
  tr(ensoMain, 'te', [[.1, 0, 'io'], [1.1, 1]], 9);
  tr(ensoMain, 'ts', [[1, 0, 'out'], [1.4, .08]], 9);
  tr(ensoThin, 'te', [[.55, 0, 'io'], [1.25, 1]], 9);
  tr(hanko, 'o', [[0, 0, 'hold'], [1, 1]], 9);
  tr(hanko, 's', [[1, 2.4, 'in'], [1.12, .94, 'spring'], [1.3, 1]], 9);
  tr(hanko, 'r', [[1, -14, 'out'], [1.3, -4]], 9);
  drops.forEach(function (d, k) {
    tr(d, 's', [[1 + k * .006, 0, 'out'], [1.1 + k * .006, 1]], 9);
    tr(d, 'o', [[1.1, 1, 'lin'], [1.6, .7, 'hold'], [2, .7, 'lin'], [2.3, 0]], 9);
  });
  var SH = [[30, 7, -5], [31, -5, 4], [32, 3, -2], [33, -1, 1], [34, 0, 0]];
  tr(cam, 'x', [[0, 0, 'hold']].concat(SH.map(function (f) { return [f[0] / FPS, f[1], 'hold']; })), 1);
  tr(cam, 'y', [[0, 0, 'hold']].concat(SH.map(function (f) { return [f[0] / FPS, f[2], 'hold']; })), 1);
  tr(burstP, 'o', [[1, 0, 'lin'], [1.06, .28, 'out'], [1.45, 0]], 3);
  tr(burstP, 's', [[1, .85, 'out'], [1.45, 1.1]], 3);
  tr(cap, 'o', [[.3, 0, 'out'], [.8, 1]], 8);
  tr(cap, 'x', [[.3, -24, 'out'], [.8, 0]], 8);

  // Shot 2 · 題 title: "I build" rises through per-letter masks, tracking tightens
  l1c.forEach(function (c, k) {
    var t0 = 2.3 + k * .05;
    tr(c, 'yp', [[t0, 150, 'out'], [t0 + .7, 0]], 8);
    tr(c, 'skx', [[t0, -8, 'hold'], [t0 + .067, 0]], 8);
    tr(c, 'sy', [[t0, 1.18, 'hold'], [t0 + .067, 1]], 8);
  });
  tr(l1, 'ls', [[2.3, .45, 'out'], [3.15, -.01]], 8);
  tr(caret, 'o', [[0, 0, 'hold'], [2.95, 1, 'hold'], [3.2, 0, 'hold'], [3.45, 1, 'hold'], [3.6, 1, 'lin'], [3.75, 0]], 8);
  tr(caret, 'y', [[3.45, 0, 'out'], [3.57, L.l2[1] - L.l1[1]]], 8);

  // Shot 3 · 技 crafts: one word per beat, each with its own transition
  function T(k) { return 3.5 + .5 * k; }
  W.forEach(function (o, k) {
    var t0 = T(k), type = WORDS[k][1], nxt = k < 6 ? T(k + 1) : null, ntype = k < 6 ? WORDS[k + 1][1] : null;
    var on = type === 'wipe' ? t0 + .075 : t0;
    var ok = [[0, 0, 'hold'], [on, 1, nxt == null ? 'lin' : 'hold']];
    var yp = [];
    if (type === 'roll') yp.push([t0, 140, 'out'], [t0 + .3, 0]);
    if (nxt != null) {
      if (ntype === 'wipe') ok.push([nxt + .075, 0]);
      else if (ntype === 'glitch') ok.push([nxt, 0]);
      else { ok[1][2] = 'hold'; ok.push([nxt, 1, 'in'], [nxt + .12, 0]); yp.push([nxt, 0, 'in'], [nxt + .12, -100]); }
    }
    tr(o.fit, 'o', ok, 6);
    if (yp.length) tr(o.w, 'yp', yp, 6);
    if (type === 'glitch') tr(o.w, 'gx', [[t0, 14, 'hold'], [t0 + 1 / FPS, 9, 'hold'], [t0 + 2 / FPS, 4, 'hold'], [t0 + 3 / FPS, 0]], 6);
    if (type === 'flip') tr(o.w, 'rx', [[t0, 90, 'out'], [t0 + .4, 0]], 6);
    o.cs.forEach(function (c, j) {
      if (type === 'pop') tr(c, 's', [[t0 + j * .02, 0, 'spring'], [t0 + j * .02 + .32, 1]], 6);
      if (type === 'hold') { var a = t0 + j * .015; tr(c, 'y', [[a, 60, 'hold'], [a + .04, 40, 'hold'], [a + .08, 20, 'hold'], [a + .12, 0]], 6); }
      if (type === 'drop') tr(c, 'y', [[t0 + j * .02, -140, 'spring'], [t0 + j * .02 + .4, 0]], 6);
    });
    var ul = [[t0 + .05, 0, 'out'], [t0 + .35, 1, 'hold']];
    if (nxt != null) ul.push([nxt, 0]);
    node(o.up, 'p');
    tr(o.up, 'te', ul, 6);
    var io = [[0, 0, 'hold'], [t0, 1, 'hold']];
    if (nxt != null) io.push([nxt, 0]);
    tr(ICO[k], 'o', io, 7);
    tr(ICO[k], 'ico', [[t0 + .03, 0, 'out'], [t0 + .4, 1]], 7);
    tr(ICO[k], 's', [[t0 + .03, .8, 'out'], [t0 + .4, 1]], 7);
  });
  tr(wipe, 'sx', [[4, 0, 'io'], [4.075, 1, 'io'], [4.15, 0]], 6);
  tr(wipe, 'x', [[4.075, 0, 'io'], [4.15, L.fit + 60]], 6);

  // Shot 4 · 夜 night: the page turns to ink, the camera lifts, the moon draws on
  tr(cam, 'y', [[7, 0, 'ease'], [7.6, L.lift, 'hold'], [9, L.lift, 'ease'], [10, -40]], 1);
  NW.forEach(function (w, k) { var a = 7.25 + k * .12; tr(w, 'clip', [[a, 100, 'out'], [a + .35, 0]], 4); });
  tr(moonRing, 'te', [[7.3, 0, 'io'], [7.9, 1]], 5);
  tr(moonFill, 'o', [[7.7, 0, 'out'], [8.1, 1]], 5);
  RAYS.forEach(function (g, k) { tr(g, 's', [[7.6 + k * .03, 0, 'spring'], [7.9 + k * .03, 1]], 5); });
  tr(rays, 'r', [[7.6, 0, 'out'], [8.8, 30]], 5);
  tr(burstN, 'o', [[7.4, 0, 'lin'], [8, .07, 'hold'], [9.2, .07, 'in'], [9.6, 0]], 3);
  tr(burstN, 'r', [[7.4, 0, 'lin'], [9.45, 6]], 3);
  tr(stats, 'o', [[8.1, 0, 'out'], [8.4, 1]], 4);
  tr(stats, 'y', [[8.1, 20, 'out'], [8.4, 0]], 4);

  // Shot 5 · 終 hand-off: everything exits up, "Now meet the crew." lands, the palette becomes Albedo's
  tr(cam, 's', [[9, 1, 'ease'], [12, 1.12]], 1);
  [l1x, l2x, icx, ntx, stx, moonX, ensoX].forEach(function (e, k) {
    var a = 9 + k * .04, layer = [8, 6, 7, 4, 4, 5, 9][k];
    tr(e, 'y', [[a, 0, 'in'], [a + .41, -60]], layer);
    tr(e, 'o', [[a, 1, 'in'], [a + .41, 0]], layer);
  });
  hdc.forEach(function (c, k) { var a = 9.4 + k * .035; tr(c, 'yp', [[a, -150, 'out'], [a + .6, 0]], 2); });
  tr(hdg, 'o', [[0, 0, 'hold'], [10.62, 1]], 2);
  tr(hdg, 'bgx', [[10.62, 100, 'io'], [11.4, 0]], 2);
  SK.forEach(function (q) {
    var d = 2 / q[2];
    tr(q[0], 'x', [[9.6, -.3 * CW, 'lin'], [9.6 + d, 1.3 * CW + q[1]]], 3);
    tr(q[0], 'o', [[9.6, 0, 'lin'], [9.6 + d * .25, .7, 'hold'], [9.6 + d * .7, .7, 'lin'], [9.6 + d, 0]], 3);
  });
  tr(nx, 'o', [[11, 0, 'out'], [11.4, 1]], 2);
  tr(nx, 'x', [[11, -20, 'out'], [11.4, 0]], 2);

  /* ---------- render ---------- */
  var SET = 'ABCDEFGHJKLMNPRSTUVXYZ01#/<>';
  var t = 0, rate = 0, dir = 1, lastFnFr = -1;
  function render(tt, fr) {
    var k, v, tk, val;
    for (k = 0; k < nodes.length; k++) {
      v = nodes[k]._r.v;
      v.x = v.y = v.yp = v.r = v.rx = v.skx = v.gx = v.ts = 0;
      v.s = v.sx = v.sy = v.o = 1;
      v.clip = v.te = v.ls = v.bgx = v.ico = v.bg = v.fg = undefined;
    }
    for (k = 0; k < tracks.length; k++) {
      tk = tracks[k]; v = tk.n._r.v; val = evalAt(tk.k, tt);
      if (ADD[tk.p]) v[tk.p] += val;
      else if (MUL[tk.p]) v[tk.p] *= val;
      else v[tk.p] = val;
    }
    // the one impact frame: only when playing forward at close to real time
    if ((fr === 210 || fr === 211) && rate > 0 && rate <= 2.2 && !XR.reduce) { comp._r.v.bg = '#0a0806'; comp._r.v.fg = '#efe4cc'; }
    for (k = 0; k < nodes.length; k++) write(nodes[k]);
    comp.classList.toggle('is-dark', tt > 7.35 || fr === 210 || fr === 211);
    if (fr !== lastFnFr) {
      lastFnFr = fr;
      // glitch scramble resolves left to right (seeded per frame, so scrubbing back is identical)
      var g = W[2], a = clamp((tt - 4.5) / .22, 0, 1), done = Math.floor(a * g.cs.length), rr = XR.seeded('rl-g' + fr);
      g.cs.forEach(function (c, j) {
        var ch = g.txt[j], out = (tt < 4.5 || a >= 1 || j < done || ch === ' ') ? ch : SET[Math.floor(rr() * SET.length)];
        out = out === ' ' ? ' ' : out;
        if (c.textContent !== out) c.textContent = out;
      });
      var u = clamp((tt - 8.2) / .7, 0, 1);
      stY.textContent = pad(Math.round(YRS * u));
      stN.textContent = pad(Math.round(CRAFTS * u));
    }
  }

  /* ---------- timeline panel ---------- */
  var LAY = [
    ['Null_CAM', '#d9a441', '—', 0, 12], ['TXT_HANDOFF', '#b57bff', 'Null_CAM', 9.3, 12],
    ['FX_LINES', '#cfc3ad', '—', .9, 12], ['TXT_NIGHT', '#6fb3a8', 'Null_CAM', 7.1, 9.45],
    ['SHP_MOON_repeater', '#7fc4a0', '—', 7.2, 9.45], ['TXT_SLOT_services', '#d9492f', 'Null_CAM', 3.45, 9.45],
    ['SHP_ICON_trim', '#e2a07a', 'Null_CAM', 3.5, 9.45], ['TXT_I_BUILD', '#df7f73', 'Null_CAM', .3, 9.45],
    ['SHP_ENSO_HANKO', '#ff8a5c', 'Null_CAM', 0, 9.45], ['BG_Solid_washi', '#6b604f', '—', 0, 12]
  ];
  var layersEl = $('.rl-layers', sec), rowsEl = $('.rl-rows', sec), ruler = $('.rl-ruler', sec);
  var phWrap = $('.rl-ph-wrap', sec), cacheEl = $('.rl-cache', sec);
  var LR = [], GL = [], keyTimes = [];
  var perLayer = {};
  tracks.forEach(function (tk) {
    var m = perLayer[tk.l] || (perLayer[tk.l] = {});
    tk.k.forEach(function (k) { var f = Math.round(k[0] * FPS / 3); if (!(f in m)) m[f] = k[2] || 'lin'; });
  });
  LAY.forEach(function (ly, k) {
    var n = k + 1;
    if (layersEl) {
      var b = h('div', 'rl-lr', layersEl);
      b.style.setProperty('--c', ly[1]);
      h('span', '', b, n); h('i', '', b); h('b', '', b, ly[0]); h('small', '', b, ly[2]);
      b.addEventListener('click', function () { selL = n; selTill = performance.now() + 6000; fxUpdate(true); });
      LR.push(b);
    }
    if (!rowsEl) return;
    var row = h('div', 'rl-row', rowsEl), bar = h('i', 'rl-b', row);
    bar.style.left = (ly[3] / DUR * 100) + '%';
    bar.style.width = ((ly[4] - ly[3]) / DUR * 100) + '%';
    bar.style.setProperty('--c', ly[1]);
    var m = perLayer[n] || {};
    Object.keys(m).forEach(function (f) {
      var tt = Math.min(DUR, f * 3 / FPS), e = m[f], sh = e === 'lin' ? 'd' : e === 'hold' ? 'h' : 'e';
      var el = h('i', 'rl-k k-' + sh, row);
      el.style.left = (tt / DUR * 100) + '%';
      GL.push({ t: tt, el: el, sh: sh, st: -1 });
      keyTimes.push(Math.round(tt * FPS));
    });
  });
  keyTimes = keyTimes.filter(function (f, k, a) { return a.indexOf(f) === k; }).sort(function (a, b) { return a - b; });
  if (ruler) {
    for (i = 0; i <= DUR; i++) { var lb = h('i', 'rl-rl', ruler, pad(i) + 's'); lb.style.left = (i / DUR * 100) + '%'; }
    [[0, '墨', 'Cold open'], [2, '題', 'Title'], [3.5, '技', 'Crafts'], [7, '夜', 'Night'], [9, '終', 'Hand-off']].forEach(function (mk) {
      var e = h('b', 'rl-mk jp', ruler, mk[1]); e.title = mk[2]; e.style.left = (mk[0] / DUR * 100) + '%';
    });
  }

  /* ---------- effect controls + graph ---------- */
  var PN = { x: 'Position X', y: 'Position Y', yp: 'Offset Y', s: 'Scale', sx: 'Scale X', sy: 'Scale Y', r: 'Rotation', rx: 'X Rotation', skx: 'Skew', o: 'Opacity', te: 'Trim End', ts: 'Trim Start', ico: 'Trim End', clip: 'Mask Offset', ls: 'Tracking', bgx: 'Sweep', gx: 'RGB Split', bg: 'Fill Color', fg: 'Text Fill' };
  var PRI = [6, 8, 4, 5, 9, 2, 3, 1, 10, 7];
  var byLayer = {};
  tracks.forEach(function (tk) { (byLayer[tk.l] = byLayer[tk.l] || []).push(tk); });
  var fxSel = $('[data-rl-sel]', sec), fxProps = $('.rl-props', sec), gCurve = $('.g-curve', sec), gHand = $('.g-hand', sec), gDot = $('.g-dot', sec), gLab = $('[data-rl-ez]', sec);
  var selL = 0, selTill = 0, curL = 1, curTk = null, fxRows = [], fxNode = null, fxLast = 0;
  function seg(tk, tt) {
    var k = tk.k;
    for (var j = 0; j < k.length - 1; j++) if (tt >= k[j][0] && tt < k[j + 1][0]) return k[j][1] !== k[j + 1][1] && k[j][2] !== 'hold' ? j : -1;
    return -1;
  }
  function fmt(p, v, r) {
    if (v === undefined) return '—';
    if (p === 'bg' || p === 'fg') return v.charAt(0) === '#' ? v.toUpperCase() : v.replace(/rgb\(|\)/g, '');
    if (p === 'x') return (v + r.bx).toFixed(1);
    if (p === 'y') return (v + r.by).toFixed(1);
    if (p === 's' || p === 'sx' || p === 'sy') return (v * 100).toFixed(1) + '%';
    if (p === 'r' || p === 'rx' || p === 'skx') return '0x' + (v >= 0 ? '+' : '') + v.toFixed(1) + '°';
    if (p === 'o' || p === 'te' || p === 'ts' || p === 'ico') return (clamp(v, 0, 1) * 100).toFixed(1) + '%';
    if (p === 'ls') return Math.round(v * 1000) + '';
    if (p === 'clip' || p === 'yp' || p === 'bgx') return v.toFixed(1) + '%';
    return (+v).toFixed(1);
  }
  function gy(v) { return (100 - (v + .25) / 1.5 * 100).toFixed(2); }
  function fxUpdate(force) {
    if (!fxProps) return;
    var now = performance.now();
    if (!force && now - fxLast < 66) return;
    fxLast = now;
    var tt = t, L2 = null, best = null, bestT = -1;
    if (selTill > now && selL) L2 = selL;
    (L2 ? [L2] : PRI).some(function (n) {
      (byLayer[n] || []).forEach(function (tk) { var j = seg(tk, tt); if (j >= 0 && tk.k[j][0] > bestT) { bestT = tk.k[j][0]; best = tk; } });
      if (best) { curL = n; return true; }
      return false;
    });
    if (L2) { curL = L2; if (!best) best = (byLayer[L2] || [])[0] || null; }
    if (best) curTk = best;
    LR.forEach(function (b, k) { b.classList.toggle('is-sel', k + 1 === curL); });
    if (fxSel) fxSel.textContent = LAY[curL - 1][0];
    if (!curTk) return;
    var n = curTk.n;
    if (n !== fxNode) {
      fxNode = n;
      fxProps.textContent = '';
      fxRows = [];
      var seen = {};
      tracks.forEach(function (tk) {
        if (tk.n !== n || seen[tk.p] || fxRows.length >= 6) return;
        seen[tk.p] = 1;
        var row = h('div', '', fxProps); h('i', 'sw', row); h('dt', '', row, PN[tk.p] || tk.p);
        fxRows.push({ tk: tk, row: row, dd: h('dd', '', row) });
      });
    }
    fxRows.forEach(function (fr) {
      var txt = fmt(fr.tk.p, n._r.v[fr.tk.p], n._r);
      if (fr.dd.textContent !== txt) fr.dd.textContent = txt;
      fr.row.classList.toggle('on', seg(fr.tk, tt) >= 0);
    });
    if (!gCurve) return;
    var j = seg(curTk, tt);
    if (j < 0) {
      gCurve.setAttribute('d', 'M0 ' + gy(0) + 'H200');
      if (gHand) gHand.setAttribute('d', '');
      if (gDot) gDot.style.opacity = 0;
      if (gLab) gLab.textContent = 'No active keys · ' + (PN[curTk.p] || curTk.p);
      return;
    }
    var a = curTk.k[j], b = curTk.k[j + 1], e = a[2] || 'lin', f = EZ[e], d = 'M0 ' + gy(0);
    for (var q = 1; q <= 32; q++) d += 'L' + (q / 32 * 200).toFixed(1) + ' ' + gy(f(q / 32));
    gCurve.setAttribute('d', d);
    var rw = RAW[e];
    if (gHand) gHand.setAttribute('d', rw ? 'M0 ' + gy(0) + 'L' + rw[0] * 200 + ' ' + gy(rw[1]) + 'M200 ' + gy(1) + 'L' + rw[2] * 200 + ' ' + gy(rw[3]) : '');
    var uu = clamp((tt - a[0]) / (b[0] - a[0]), 0, 1);
    if (gDot) { gDot.style.opacity = 1; gDot.style.left = (uu * 100) + '%'; gDot.style.top = gy(f(uu)) + '%'; }
    if (gLab) gLab.textContent = EZN[e] + ' · ' + (PN[curTk.p] || curTk.p);
  }

  /* ---------- per-frame readouts ---------- */
  var tcEls = $$('[data-rl-tc]', sec), frEl = $('[data-rl-frame]', sec), beatEl = $('[data-rl-beat]', sec), stateEl = $('[data-rl-state]', sec), zoomEl = $('[data-rl-zoom]', sec);
  var cache = new Uint8Array(FR + 1), cacheT = 0, drawnFr = -1, lastState = '';
  function tc(fr) { return '0:00:' + pad(Math.floor(fr / FPS)) + ':' + pad(fr % FPS); }
  function ctx(tt) {
    if (tt < 2) return 'opening';
    if (tt < 3.5) return 'I build';
    if (tt < 7) return 'I build ' + WORDS[Math.min(6, Math.floor((tt - 3.5) / .5))][0];
    if (tt < 9) return 'that work while you sleep';
    return 'now meet the crew';
  }
  function frameUI(fr) {
    var s1 = tc(fr);
    tcEls.forEach(function (e) { e.textContent = s1; });
    if (frEl) frEl.textContent = fr;
    if (beatEl) beatEl.textContent = 'Bar ' + (Math.floor(fr / 60) + 1) + ' · Beat ' + (Math.floor(fr / 15) % 4 + 1);
    if (ruler) { ruler.setAttribute('aria-valuenow', fr); ruler.setAttribute('aria-valuetext', (fr / FPS).toFixed(1) + ' seconds, ' + ctx(fr / FPS)); }
    var tt = fr / FPS;
    GL.forEach(function (g) {
      var st = Math.abs(g.t - tt) < .06 ? 2 : g.t < tt ? 1 : 0;
      if (st !== g.st) { g.st = st; g.el.className = 'rl-k k-' + g.sh + (st === 2 ? ' is-now' : st === 1 ? ' is-past' : ''); }
    });
    LR.forEach(function (b, k) { b.classList.toggle('is-live', tt >= LAY[k][3] && tt <= LAY[k][4]); });
    cache[fr] = 1;
    var now = performance.now();
    if (cacheEl && now - cacheT > 150) {
      cacheT = now;
      var html = '', st2 = -1;
      for (var f = 0; f <= FR + 1; f++) {
        if (f <= FR && cache[f]) { if (st2 < 0) st2 = f; }
        else if (st2 >= 0) { html += '<i style="left:' + (st2 / FR * 100).toFixed(2) + '%;width:' + ((f - st2) / FR * 100).toFixed(2) + '%"></i>'; st2 = -1; }
      }
      cacheEl.innerHTML = html;
    }
    fxUpdate();
  }
  function setState(moving) {
    var s2 = drawnFr >= FR - 2 ? 'Render complete · 360 frames · 0 dropped' : moving ? 'Rendering…' : 'Ready';
    if (s2 === lastState || !stateEl) return;
    lastState = s2;
    stateEl.textContent = s2;
    stateEl.className = moving ? 'is-busy' : drawnFr >= FR - 2 ? 'is-done' : '';
  }
  function draw() {
    var fr = Math.round(t * FPS);
    render(t, fr);
    if (phWrap) phWrap.style.setProperty('--t', (t / DUR).toFixed(5));
    if (fr !== drawnFr) { drawnFr = fr; frameUI(fr); }
  }

  /* ---------- driver: scroll-scrub (pinned) or autoplay (flat) ---------- */
  var pinned = !SQ && !XR.reduce && window.innerHeight >= 620;
  var mode = pinned ? 'scrub' : 'pause', loop = true, visible = false, raf = 0, last = 0, holdTill = 0, dragging = false, userPaused = false, hintGone = false, run = 1;
  if (!pinned) { sec.classList.add('is-flat'); board.style.aspectRatio = CW + ' / ' + CH; }
  if (SQ) sec.classList.add('is-phone');
  if (XR.reduce) sec.classList.add('is-reduced');
  var playBtn = $('[data-rl="play"]', sec), playUse = playBtn && $('use', playBtn), loopBtn = $('[data-rl="loop"]', sec), modeEl = $('.rl-mode', sec);

  function measure() { run = Math.max(1, sec.offsetHeight - window.innerHeight); }
  function scrollT() {
    var r = sec.getBoundingClientRect();
    return clamp((clamp(-r.top / run, 0, 1) - .04) / .9, 0, 1) * DUR;
  }
  function hideHint() { if (hintGone) return; hintGone = true; sec.classList.remove('is-hint'); }
  function setMode(m) {
    mode = m;
    holdTill = 0;
    var on = m === 'play';
    if (on && t >= DUR - .01) t = 0;
    if (playBtn) {
      playBtn.setAttribute('aria-pressed', on);
      playBtn.setAttribute('aria-label', on ? 'Pause composition' : 'Play composition');
      if (playUse) playUse.setAttribute('href', on ? '#i-pause' : '#i-play');
    }
    if (modeEl) { modeEl.textContent = { scrub: 'Scrub', play: 'Play', drag: 'Drag', pause: 'Paused' }[m]; modeEl.setAttribute('data-m', m); }
    wake();
  }
  function tick(now) {
    raf = 0;
    var dt = last ? clamp(now - last, 1, 64) : 16, prev = t, tgt = null;
    last = now;
    if (mode === 'play') {
      if (holdTill) { if (now >= holdTill) { holdTill = 0; t = 0; } }
      else {
        t += dt / 1000;
        if (t >= DUR) {
          t = DUR;
          if (loop) holdTill = now + (SQ ? 1200 : 700);
          else setMode(pinned ? 'drag' : 'pause');
        }
      }
    } else if (mode === 'scrub' && pinned) {
      tgt = scrollT();
      var d = tgt - t;
      if (Math.abs(d) < 1 / 60) t = tgt;
      else { var cap = 6 * dt / 1000; t += clamp(d * (1 - Math.exp(-dt / 80)), -cap, cap); }
      if (t > 1) hideHint();
    }
    rate = (t - prev) / (dt / 1000);
    if (t !== prev) dir = t > prev ? 1 : -1;
    if (t !== prev || needDraw) { needDraw = false; draw(); }
    var moving = mode === 'play' || (tgt !== null && Math.abs(tgt - t) > 1e-4);
    setState(moving || t !== prev);
    if (visible && !document.hidden && moving) raf = requestAnimationFrame(tick);
    else { last = 0; if (!moving) setState(false); }
  }
  var needDraw = true;
  function wake() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); }
  function seek(tt, m) {
    t = Math.round(clamp(tt, 0, DUR) * FPS) / FPS;
    rate = 0;
    if (m && mode !== m) setMode(m);
    needDraw = true;
    draw();
    fxUpdate(true);
    setState(false);
    hideHint();
  }

  /* transport */
  $$('[data-rl]', sec).forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-rl');
      if (k === 'play') {
        if (mode === 'play') { userPaused = true; setMode(pinned ? 'drag' : 'pause'); }
        else { userPaused = false; setMode('play'); }
      }
      if (k === 'start') seek(0, pinned ? 'drag' : 'pause');
      if (k === 'end') seek(DUR, pinned ? 'drag' : 'pause');
      if (k === 'loop') { loop = !loop; b.setAttribute('aria-pressed', loop); }
    });
  });

  /* ruler / rows: drag to scrub */
  function seekX(e, el) { var r = el.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * DUR, pinned ? 'drag' : 'pause'); }
  [ruler, rowsEl].forEach(function (el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      dragging = true; userPaused = true;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      seekX(e, el);
      e.preventDefault();
    });
    el.addEventListener('pointermove', function (e) { if (dragging) seekX(e, el); });
    el.addEventListener('pointerup', function () { dragging = false; });
    el.addEventListener('pointercancel', function () { dragging = false; });
  });
  function keyStep(d) {
    var f = Math.round(t * FPS), k;
    if (d > 0) { for (k = 0; k < keyTimes.length; k++) if (keyTimes[k] > f) return keyTimes[k]; return FR; }
    for (k = keyTimes.length - 1; k >= 0; k--) if (keyTimes[k] < f) return keyTimes[k];
    return 0;
  }
  if (ruler) ruler.addEventListener('keydown', function (e) {
    var f = Math.round(t * FPS), k = e.key, nf = null;
    if (k === 'ArrowRight' || k === 'ArrowUp' || k === 'PageDown') nf = f + (e.shiftKey ? 10 : 1);
    else if (k === 'ArrowLeft' || k === 'ArrowDown' || k === 'PageUp') nf = f - (e.shiftKey ? 10 : 1);
    else if (k === 'Home') nf = 0;
    else if (k === 'End') nf = FR;
    if (nf === null) return;
    e.preventDefault();
    userPaused = true;
    seek(clamp(nf, 0, FR) / FPS, pinned ? 'drag' : 'pause');
  });
  app.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Spacebar') && !e.target.closest('button, a, input')) { e.preventDefault(); if (playBtn) playBtn.click(); }
    else if (/^[jk]$/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); userPaused = true; seek(keyStep(/k/i.test(e.key) ? 1 : -1) / FPS, pinned ? 'drag' : 'pause'); }
  });

  /* scroll: any real scroll hands the playhead back to the page */
  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY, dy = Math.abs(y - lastY);
    lastY = y;
    if (!pinned || !visible) return;
    if (mode !== 'scrub' && dy > 4 && !dragging) setMode('scrub');
    wake();
  }, { passive: true });

  /* visibility */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { needDraw = true; wake(); }
    }, { rootMargin: '120px' }).observe(sec);
    if (!pinned && !XR.reduce) {
      new IntersectionObserver(function (en) {
        var on = en[0].intersectionRatio >= .4;
        if (on && !userPaused && mode !== 'play') setMode('play');
        else if (!on && mode === 'play') setMode('pause');
      }, { threshold: [0, .4] }).observe(app);
    }
  } else { visible = true; }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = 0; wake(); } });

  /* comp fit */
  function fitComp() {
    var bw = board.clientWidth, bh = board.clientHeight;
    if (!bw || !bh) return;
    var k = Math.min(bw / CW, bh / CH);
    sec.style.setProperty('--k', k.toFixed(5));
    if (zoomEl) zoomEl.textContent = 'Fit (' + (k * 100).toFixed(1) + '%)';
  }
  if ('ResizeObserver' in window) new ResizeObserver(fitComp).observe(board);
  window.addEventListener('resize', function () { measure(); fitComp(); needDraw = true; wake(); });

  /* measure the craft words once the display font is in (fit + underline length) */
  function measureWords() {
    W.forEach(function (o) {
      var w = o.w.offsetWidth;
      if (!w) return;
      o.fit.style.scale = w > L.fit ? (L.fit / w).toFixed(4) : '';
      o.ul.setAttribute('width', w);
      o.ul.setAttribute('viewBox', '0 0 ' + w + ' 40');
      o.up.setAttribute('d', 'M6 28C' + (w * .3).toFixed(0) + ' 36 ' + (w * .68).toFixed(0) + ' 30 ' + (w - 6) + ' 12');
    });
    needDraw = true;
    draw();
  }
  (function fontsReady() {
    var done = false;
    function go() { if (done) return; done = true; measureWords(); }
    setTimeout(go, 1800);
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('800 120px "Shippori Mincho B1"'), document.fonts.load('500 22px "JetBrains Mono"')]).then(go, go);
    } else go();
  })();

  /* boot: the window assembles itself once, when it first comes into view */
  if (XR.reduce) sec.classList.add('is-on');
  else {
    sec.classList.add('is-boot');
    XR.whenVisible(app, function () {
      if (sec.getBoundingClientRect().top < -window.innerHeight * .5) sec.classList.add('no-boot');
      requestAnimationFrame(function () { sec.classList.add('is-on'); });
      setTimeout(function () { sec.classList.remove('no-boot'); if (!hintGone && !SQ) sec.classList.add('is-hint'); }, 1100);
      setTimeout(hideHint, 9000);
    }, '0px 0px -15% 0px');
  }

  measure();
  fitComp();
  t = XR.reduce ? 6.95 : pinned ? scrollT() : 0;
  setMode(mode);
  measureWords();
  setState(false);
})();
