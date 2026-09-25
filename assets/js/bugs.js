/* =====================================================================
   XIRAIYA — Ant World · 蟻の国
   Two ant colonies live on every page. Aka (red) and Kuro (black) dig
   nests in the quiet corners of each section and get on with life.
   Castes: workers forage, scouts explore and lay scent, soldiers guard
   and answer alarms, and each colony has a queen at its home nest.
   Foragers follow fading pheromone trails (drawn as faint dotted ink) to
   food and back, remember where food was, and team up to haul big leaves.
   Small trees, grass, pebbles, mushrooms and flowers grow in the empty
   corners of sections; ants climb them and carry petals and leaf bits
   home, and nests grow as food comes in. Ladybugs, butterflies and
   dragonflies pass by, and fireflies come out in ink (dark) mode.
   Workers also walk the edges of buttons, cards and images, bite pieces
   out of them and carry letters home; rain leaves puddles to swim in.
   Everything the ants eat grows back, and the text never leaves the DOM.
   One canvas, no libraries. Opt out per page with <body data-ants="off">.
   Light version on phones, touch screens and narrow windows: fewer ants,
   no biting or letter stealing. Reduced motion: static scenery, slow ants.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  var doc = document, root = doc.documentElement, body = doc.body;
  if (!XR || !body || body.getAttribute('data-ants') === 'off') return;
  var cv = doc.createElement('canvas'), ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return;

  var PI = Math.PI, TAU = PI * 2, HALF = PI / 2;
  var phone = XR.phone;
  function mq(q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } }
  /* light version: phones, touch-first screens and narrow windows */
  var lite = phone || mq('(pointer: coarse)') || (window.innerWidth || 1024) < 900;
  var still = !!XR.reduce || mq('(prefers-reduced-motion: reduce)'); /* static scenery, minimal motion */
  var KEY = 'xr-ants', TRAIL_KEY = 'xr-ants-trails';
  var DPR = Math.min(window.devicePixelRatio || 1, lite ? 1.75 : 2);
  var PER_NEST = lite ? 3 : 7, MAX_POP = lite ? 20 : 72, MAX_STOLEN = lite ? 0 : 24, MAX_BITTEN = lite ? 0 : 30; /* in the light version text stays readable: ants walk, fight and swim but do not eat words */
  var MAX_PATCH = lite ? 5 : 9, MAX_ITEMS = lite ? 8 : 16, MAX_PLANTED = lite ? 3 : 6, MAX_FLIES = lite ? 6 : 11;
  var PAD = 100; /* a bite mask reaches this far past the element, so its shadow survives */
  var SKIP = '.ant-ui, .mmenu, .palette, .modal, .drawer, dialog, [hidden], [inert], template, noscript';
  var SURF_SEL = '.site-header, .site-footer, .tabbar, .btn, .card, .chip, .stat, .hanko, img, h1, h2, h3, .mode-btn, .hdr-nav a, input:not([type="hidden"]), textarea, select, [data-ant-surface]';
  var EAT_SEL = 'h1, h2, h3, h4, .h4, p, li, .btn, .chip, .hdr-nav a, .site-footer a, .stat, label, blockquote, figcaption, dd, td, th';
  var NO_EAT = 'pre, code, textarea, [contenteditable], .marquee, .outline-text, [data-ants-skip], ' + SKIP;
  var OBST = 'h1,h2,h3,h4,h5,h6,p,li,a,button,img,picture,video,canvas,iframe,input,select,textarea,label,table,pre,blockquote,figure,.card,.chip,.btn,.stat';
  var BITE = { btn: 1, card: 1, chip: 1, img: 1, bar: 1, stat: 1, hanko: 1 };
  var CH_OK = /[0-9A-Za-zÀ-ɏঀ-৿぀-ヿ㐀-鿿]/;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[(Math.random() * list.length) | 0]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dist(ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return Math.sqrt(dx * dx + dy * dy); }
  function angDiff(a, b) { var d = (a - b) % TAU; if (d > PI) d -= TAU; else if (d < -PI) d += TAU; return d; }
  function short(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
  function clear(c) { return !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c); }
  function weighted(list, w) {
    var sum = 0, i;
    for (i = 0; i < w.length; i++) sum += w[i];
    var r = Math.random() * sum;
    for (i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }
  function byDist(x, y) { return function (a, b) { return dist(a.x, a.y, x, y) - dist(b.x, b.y, x, y); }; }

  /* ------------------------------------------------------------------
     World state
     ------------------------------------------------------------------ */
  var on = false, built = false, raf = 0, last = 0, now = 0, frameNo = 0, uid = 0;
  var VW = 0, VH = 0, DH = 0, sx = 0, sy = 0;
  var ants = [], nests = [], puddles = [], foods = [], parts = [], drops = [], trails = [], logs = [], fights = [];
  var surfs = [], surfMap = new Map(), texts = [];
  var stolen = [], stolenBy = new Map(), bitten = new Map();
  var stats = { letters: 0, bites: 0, duels: 0, swims: 0, captures: 0, flicks: 0, leaves: 0, finds: 0, trees: 0 };
  var rain = null, aim = null, next = {}, ticks = {}, quiet = {}, PAL = {};
  var patches = [], trees = [], planted = [], items = [], flyers = [], flies = [], obsCache = [];
  var night = false, SPD = 1, showTrails = true, asleep = false, idleT = 0, hiddenTab = false, sleepT = 0, cost = { n: 0, ms: 0, worst: 0 };
  var range = doc.createRange();
  var COL = [
    { id: 0, name: 'Aka', jp: '赤', food: 12, spawn: 1, pop: 0, sold: 0, nests: 0, queen: null },
    { id: 1, name: 'Kuro', jp: '黒', food: 12, spawn: 1.6, pop: 0, sold: 0, nests: 0, queen: null }
  ];

  function readColors() {
    var cs = getComputedStyle(root);
    function v(n, d) { return cs.getPropertyValue(n).trim() || d; }
    function rim(n) { var x = v(n, 'none'); return x === 'none' || x === 'transparent' ? '' : x; }
    COL[0].body = v('--ant-aka', '#b3301c'); COL[0].hi = v('--ant-aka-hi', '#f0a08a'); COL[0].rim = rim('--ant-aka-rim');
    COL[1].body = v('--ant-kuro', '#1d1712'); COL[1].hi = v('--ant-kuro-hi', '#8d7a66'); COL[1].rim = rim('--ant-kuro-rim');
    COL.forEach(function (c) { c.line = c.rim || c.body; });
    PAL.queen = v('--ant-queen', '#d9a441');
    PAL.mound = v('--ant-mound', '#c2a47a'); PAL.mound2 = v('--ant-mound-2', '#97774f'); PAL.hole = v('--ant-hole', '#2a1d12');
    PAL.water = v('--ant-water', '64, 140, 170');
    PAL.sugar = v('--ant-sugar', '#fffdf8'); PAL.sugar2 = v('--ant-sugar-2', '#e6dccb');
    PAL.halo = 'rgba(' + v('--bg-rgb', '246, 241, 231') + ', .85)';
    PAL.dust = 'rgba(' + v('--fx', '40, 28, 16') + ', .22)';
    PAL.font = v('--font-body', 'sans-serif');
    /* scenery: washi greens, bark, sakura and the sumi line every drawing is inked with */
    PAL.inkL = v('--ant-line', 'rgba(42, 32, 25, .78)');
    PAL.leaf = v('--ant-leaf', '#6f8a4e'); PAL.leaf2 = v('--ant-leaf-2', '#4d6636'); PAL.leaf3 = v('--ant-leaf-3', '#a3b879');
    PAL.bark = v('--ant-bark', '#5a4130'); PAL.grass = v('--ant-grass', '#7b9152');
    PAL.bloom = v('--ant-blossom', '#eba7b0'); PAL.bloom2 = v('--ant-blossom-2', '#f8dfe1');
    PAL.stone = v('--ant-stone', '#b3a792'); PAL.cap = v('--ant-cap', '#c4321d'); PAL.stem = v('--ant-stem', '#efe6d2');
    PAL.pot = v('--ant-pot', '#9c2a1b'); PAL.fly = v('--ant-firefly', '236, 214, 120');
    PAL.wing = [v('--ant-wing-1', '#d9a441'), v('--ant-wing-2', '#df7f73'), v('--ant-wing-3', '#6fb3a8')];
    PAL.lady = v('--ant-ladybug', '#c4321d');
    PAL.petals = [v('--ant-flower-1', '#d9a441'), v('--ant-flower-2', '#eba7b0'), v('--ant-flower-3', '#fffdf8')];
    night = root.getAttribute('data-mode') === 'ink';
    SPD = (night ? .8 : 1) * (still ? .75 : 1);
    if (built) paintSprites();
  }

  function measure() {
    VW = root.clientWidth || window.innerWidth;
    VH = window.innerHeight;
    DH = Math.max(VH, root.scrollHeight, body.scrollHeight);
    var w = Math.round(VW * DPR), h = Math.round(VH * DPR);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; cv.style.width = VW + 'px'; cv.style.height = VH + 'px'; }
  }
  function docRect(el) { var r = el.getBoundingClientRect(); return { x: r.left + sx, y: r.top + sy, w: r.width, h: r.height }; }
  function onScreen(x, y, m) { return x > sx - m && x < sx + VW + m && y > sy - m && y < sy + VH + m; }
  function every(key, gap, dt) { ticks[key] = (ticks[key] || 0) - dt; if (ticks[key] > 0) return false; ticks[key] += gap; if (ticks[key] < 0) ticks[key] = gap; return true; }
  function calm(key, gap) { if (quiet[key] > now) return false; quiet[key] = now + gap; return true; }

  /* ------------------------------------------------------------------
     Surfaces: the edges ants walk on. A rounded rect, walked clockwise.
     ------------------------------------------------------------------ */
  function kindOf(el) {
    if (el.matches('.site-header, .site-footer, .tabbar')) return 'bar';
    if (el.matches('.btn, .mode-btn')) return 'btn';
    if (el.matches('.card')) return 'card';
    if (el.matches('.chip')) return 'chip';
    if (el.tagName === 'IMG') return 'img';
    if (el.matches('h1, h2, h3')) return 'head';
    if (el.matches('.stat')) return 'stat';
    if (el.matches('.hanko')) return 'hanko';
    if (el.matches('input, textarea, select')) return 'field';
    return 'misc';
  }
  function radiusOf(el, w, h) {
    var raw = getComputedStyle(el).borderTopLeftRadius || '0', n = parseFloat(raw) || 0;
    return raw.indexOf('%') > -1 ? n / 100 * Math.min(w, h) : n;
  }
  function setRect(s, r) {
    s.x = r.x; s.y = r.y; s.w = r.w; s.h = r.h;
    s.rad = Math.max(0, Math.min(s.rad0, s.w / 2, s.h / 2));
    s.len = 2 * (s.w - 2 * s.rad) + 2 * (s.h - 2 * s.rad) + TAU * s.rad;
  }
  function refreshSurfaces() {
    var list = doc.querySelectorAll(SURF_SEL), seen = new Set(), out = [];
    for (var i = 0; i < list.length && out.length < 420; i++) {
      var el = list[i];
      if (el.closest(SKIP)) continue;
      var r = docRect(el);
      if (r.w < 14 || r.h < 10 || r.x > VW - 4 || r.x + r.w < 4) continue;
      var s = surfMap.get(el);
      if (!s) { s = { el: el, kind: kindOf(el), rad0: radiusOf(el, r.w, r.h), frame: -1 }; surfMap.set(el, s); }
      setRect(s, r);
      s.alive = true; s.frame = frameNo;
      out.push(s); seen.add(el);
    }
    surfMap.forEach(function (s, el) { if (!seen.has(el)) { s.alive = false; surfMap.delete(el); } });
    surfs = out;
  }
  /* fresh rect for a surface an ant is using (fixed headers and sliders move every frame) */
  function live(s) {
    if (s.frame === frameNo || !s.alive) return s;
    s.frame = frameNo;
    if (!s.el.isConnected) { s.alive = false; return s; }
    if (s.kind !== 'bar' && (s.y > sy + VH + 300 || s.y + s.h < sy - 300)) return s;
    var r = docRect(s.el);
    if (r.w < 4 || r.h < 4) { s.alive = false; return s; }
    setRect(s, r);
    return s;
  }
  function arcPt(cx, cy, r, a) { return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a: a + HALF }; }
  function perimAt(s, d) {
    var r = s.rad, a = s.w - 2 * r, b = s.h - 2 * r, q = r * HALF, L = s.len || 1;
    d = ((d % L) + L) % L;
    if (d < a) return { x: s.x + r + d, y: s.y, a: 0 };
    d -= a;
    if (d < q) return arcPt(s.x + s.w - r, s.y + r, r, -HALF + d / r);
    d -= q;
    if (d < b) return { x: s.x + s.w, y: s.y + r + d, a: HALF };
    d -= b;
    if (d < q) return arcPt(s.x + s.w - r, s.y + s.h - r, r, d / r);
    d -= q;
    if (d < a) return { x: s.x + s.w - r - d, y: s.y + s.h, a: PI };
    d -= a;
    if (d < q) return arcPt(s.x + r, s.y + s.h - r, r, HALF + d / r);
    d -= q;
    if (d < b) return { x: s.x, y: s.y + s.h - r - d, a: -HALF };
    d -= b;
    return r > 0 ? arcPt(s.x + r, s.y + r, r, PI + d / r) : { x: s.x, y: s.y, a: 0 };
  }
  function nearestS(s, px, py) {
    var n = clamp(Math.round(s.len / 6), 16, 420), best = 0, bd = Infinity;
    for (var i = 0; i < n; i++) {
      var d = s.len * i / n, p = perimAt(s, d), dd = (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py);
      if (dd < bd) { bd = dd; best = d; }
    }
    return best;
  }

  /* ------------------------------------------------------------------
     Food on the page: letters and bites
     ------------------------------------------------------------------ */
  function refreshTexts() {
    if (!MAX_STOLEN) { texts = []; return; } /* light version: nobody eats letters, so skip the reads */
    var list = doc.querySelectorAll(EAT_SEL), out = [];
    for (var i = 0; i < list.length && out.length < 600; i++) {
      var el = list[i];
      if (el.closest(NO_EAT) || !/\S/.test(el.textContent)) continue;
      var r = docRect(el);
      if (r.w < 6 || r.h < 6 || r.x > VW || r.x + r.w < 0) continue;
      out.push({ el: el, x: r.x + r.w / 2, y: r.y + r.h / 2 });
    }
    texts = out;
  }
  function textNodes(el) {
    var tw = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, out = [];
    while ((n = tw.nextNode()) && out.length < 60) {
      var p = n.parentElement;
      if (p && /\S/.test(n.nodeValue) && !p.closest('.ant-char, svg, script, style, .sr-only')) out.push(n);
    }
    return out;
  }
  function charRect(node, i) {
    if (!node.isConnected || i >= node.nodeValue.length) return null;
    range.setStart(node, i); range.setEnd(node, i + 1);
    var r = range.getBoundingClientRect();
    if (r.width < 2 || r.height < 5) return null;
    return { x: r.left + sx, y: r.top + sy, w: r.width, h: r.height };
  }
  function inkOf(p) {
    var cs = getComputedStyle(p);
    if (clear(cs.color) || clear(cs.webkitTextFillColor) || cs.visibility === 'hidden' || cs.opacity === '0') return null;
    if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') return null;
    var fs = parseFloat(cs.fontSize) || 16;
    return {
      color: cs.color, upper: cs.textTransform === 'uppercase',
      font: (cs.fontStyle === 'italic' ? 'italic ' : '') + cs.fontWeight + ' ' + clamp(fs, 9, 15).toFixed(1) + 'px ' + cs.fontFamily
    };
  }
  function reserved(node, i) {
    for (var k = 0; k < ants.length; k++) { var j = ants[k].job; if (j && j.k === 'letter' && j.node === node && j.i === i) return true; }
    return false;
  }
  function findLetter(an, el) {
    if (stolen.length >= MAX_STOLEN) return null;
    var cand = [], w = [];
    if (el) { if (el.isConnected && (stolenBy.get(el) || 0) < 3) { cand.push({ el: el }); w.push(1); } }
    else texts.forEach(function (t) {
      var d = dist(an.x, an.y, t.x, t.y);
      if (d > 650 || (stolenBy.get(t.el) || 0) >= 3) return;
      cand.push(t); w.push((onScreen(t.x, t.y, 60) ? 4 : 1) * (1.1 - d / 700));
    });
    for (var tries = 0; tries < 5 && cand.length; tries++) {
      var t = weighted(cand, w), nodes = textNodes(t.el);
      if (!nodes.length) continue;
      for (var k = 0; k < 5; k++) {
        var node = pick(nodes), s = node.nodeValue, i = (Math.random() * s.length) | 0, code = s.charCodeAt(i);
        if (!CH_OK.test(s.charAt(i)) || (code >= 0xD800 && code <= 0xDFFF) || reserved(node, i)) continue;
        var r = charRect(node, i), ink = r && inkOf(node.parentElement);
        if (!ink) continue;
        return { el: t.el, node: node, i: i, ch: s.charAt(i), ink: ink, x: r.x + r.w / 2, y: r.y + r.h * .55 };
      }
    }
    return null;
  }
  /* the letter is wrapped in a span and made transparent, so layout and screen readers do not change */
  function steal(j) {
    var node = j.node, i = j.i, par = node.parentNode;
    if (!par || !node.isConnected || node.nodeValue.charAt(i) !== j.ch || stolen.length >= MAX_STOLEN) return false;
    /* text sitting directly in a flex or grid box gets a wrapper first, so splitting it adds no gaps */
    if (par.nodeType === 1 && /flex|grid/.test(getComputedStyle(par).display)) {
      var wrap = doc.createElement('span');
      wrap.className = 'ant-wrap';
      par.insertBefore(wrap, node); wrap.appendChild(node);
    }
    var mid = i > 0 ? node.splitText(i) : node;
    var rest = mid.nodeValue.length > 1 ? mid.splitText(1) : null;
    ants.forEach(function (o) {
      var oj = o.job;
      if (!oj || oj === j || oj.k !== 'letter' || oj.node !== node) return;
      if (oj.i === i) o.job = null;
      else if (oj.i > i) { if (rest) { oj.node = rest; oj.i -= i + 1; } else o.job = null; }
    });
    var span = doc.createElement('span');
    span.className = 'ant-char ant-gone';
    mid.parentNode.insertBefore(span, mid);
    span.appendChild(mid);
    stolen.push({ span: span, el: j.el, at: now, heal: rand(38, 70) });
    stolenBy.set(j.el, (stolenBy.get(j.el) || 0) + 1);
    stats.letters++;
    return true;
  }
  function unsteal(it, fast) {
    var sp = it.span;
    stolenBy.set(it.el, Math.max(0, (stolenBy.get(it.el) || 1) - 1));
    if (!sp.isConnected) return;
    sp.classList.remove('ant-gone');
    setTimeout(function () {
      var p = sp.parentNode;
      if (!p) return;
      while (sp.firstChild) p.insertBefore(sp.firstChild, sp);
      p.removeChild(sp);
      if (p.classList && p.classList.contains('ant-wrap') && !p.querySelector('.ant-char')) {
        var gp = p.parentNode;
        while (p.firstChild) gp.insertBefore(p.firstChild, p);
        gp.removeChild(p);
        p = gp;
      }
      var busy = ants.some(function (a) { return a.job && a.job.k === 'letter' && p.contains(a.job.node); });
      if (!busy) p.normalize();
    }, fast ? 0 : 1000);
  }

  function bgOf(el) {
    for (var e = el, k = 0; e && e !== body && k < 5; e = e.parentElement, k++) {
      var c = getComputedStyle(e).backgroundColor;
      if (!clear(c)) return c;
    }
    return el.tagName === 'IMG' ? '#9c8468' : PAL.mound2;
  }
  function canBite(s, d) {
    if (!BITE[s.kind] || !s.alive) return false;
    var b = bitten.get(s.el);
    if (b) { if (b.list.length >= 6) return false; }
    else {
      if (bitten.size >= MAX_BITTEN) return false;
      var cs = getComputedStyle(s.el), m = cs.maskImage || cs.webkitMaskImage;
      if (m && m !== 'none') return false;
    }
    if (d == null) return true;
    var p = perimAt(s, d);
    /* header and footer: only their long edges, so the nav never loses a corner */
    if (s.kind === 'bar' && Math.abs(Math.sin(p.a)) > .3) return false;
    if (b) for (var i = 0; i < b.list.length; i++) if (dist(p.x - s.x, p.y - s.y, b.list[i].x, b.list[i].y) < 9) return false;
    return true;
  }
  function makeBite(s, d, an) {
    var el = s.el, p = perimAt(s, d), b = bitten.get(el);
    if (!b) { b = { el: el, list: [] }; bitten.set(el, b); }
    var R = clamp(an.L * rand(.5, .72), 3, 6), lx = p.x - s.x, ly = p.y - s.y, c = Math.cos(p.a), sn = Math.sin(p.a);
    var bits = [{ x: lx, y: ly, r: R }, { x: lx + c * R * .95, y: ly + sn * R * .95, r: R * .66 }];
    if (Math.random() < .6) bits.push({ x: lx - c * R * .9, y: ly - sn * R * .9, r: R * .5 });
    b.list.push({ x: lx, y: ly, bits: bits, at: now, heal: rand(50, 90) });
    paintMask(b);
    stats.bites++;
  }
  /* mask writes wait for the end of the frame, after every layout read */
  var maskDirty = new Set();
  function paintMask(b) { maskDirty.add(b); }
  function flushMasks() {
    if (!maskDirty.size) return;
    maskDirty.forEach(function (b) { if (b.el.isConnected && bitten.get(b.el) === b) applyMask(b); });
    maskDirty.clear();
  }
  function applyMask(b) {
    var st = b.el.style, g = [];
    b.list.forEach(function (bt) {
      bt.bits.forEach(function (q) {
        if (q.r > .35) g.push('radial-gradient(circle at ' + (q.x + PAD).toFixed(1) + 'px ' + (q.y + PAD).toFixed(1) + 'px, transparent ' + q.r.toFixed(2) + 'px, #000 ' + (q.r + .9).toFixed(2) + 'px)');
      });
    });
    if (!g.length) { clearMask(b.el); bitten.delete(b.el); return; }
    var img = g.join(', '), size = 'calc(100% + ' + PAD * 2 + 'px) calc(100% + ' + PAD * 2 + 'px)', pos = -PAD + 'px ' + -PAD + 'px';
    st.webkitMaskImage = img; st.webkitMaskSize = size; st.webkitMaskPosition = pos; st.webkitMaskRepeat = 'no-repeat'; st.webkitMaskComposite = 'source-in';
    st.maskImage = img; st.maskSize = size; st.maskPosition = pos; st.maskRepeat = 'no-repeat'; st.maskComposite = 'intersect';
    st.maskOrigin = 'border-box'; st.maskClip = 'no-clip';
  }
  function clearMask(el) {
    var st = el.style;
    ['webkitMaskImage', 'webkitMaskSize', 'webkitMaskPosition', 'webkitMaskRepeat', 'webkitMaskComposite',
      'maskImage', 'maskSize', 'maskPosition', 'maskRepeat', 'maskComposite', 'maskOrigin', 'maskClip'].forEach(function (k) { st[k] = ''; });
  }
  /* letters fade back in, bites close up from the edges */
  function heal(dt) {
    for (var i = stolen.length - 1; i >= 0; i--) {
      if (now - stolen[i].at > stolen[i].heal) { unsteal(stolen[i]); stolen.splice(i, 1); }
    }
    bitten.forEach(function (b) {
      if (!b.el.isConnected) { bitten.delete(b.el); return; }
      var changed = false;
      b.list = b.list.filter(function (bt) {
        if (now - bt.at < bt.heal) return true;
        changed = true;
        var open = false;
        bt.bits.forEach(function (q) { q.r -= dt * 1.1; if (q.r > .35) open = true; });
        return open;
      });
      if (changed) paintMask(b);
    });
  }
  function restoreAll() {
    stolen.forEach(function (it) { unsteal(it, true); });
    stolen = []; stolenBy = new Map();
    bitten.forEach(function (b) { clearMask(b.el); });
    bitten.clear(); maskDirty.clear();
    trails = [];
    phClear();
  }

  /* ------------------------------------------------------------------
     Nests: one per section, dug where nothing else lives
     ------------------------------------------------------------------ */
  function sectionsList() {
    var main = doc.querySelector('main'), list = [];
    if (main) {
      list = Array.prototype.filter.call(main.querySelectorAll('section, [data-ant-nest]'), function (e) {
        var up = e.parentElement && e.parentElement.closest('section');
        return !up || !main.contains(up);
      });
      if (list.length < 2) list = [main];
    }
    var foot = doc.querySelector('.site-footer');
    if (foot) list.push(foot);
    list = list.filter(function (e) {
      if (e.closest(SKIP)) return false;
      var r = e.getBoundingClientRect();
      return r.height >= 140 && r.width >= 200;
    });
    if (!list.length) list = [body];
    if (list.length > 14) {
      var sel = [];
      for (var i = 0; i < 14; i++) sel.push(list[Math.round(i * (list.length - 1) / 13)]);
      list = sel;
    }
    return list;
  }
  function obstacles() {
    var out = [], list = doc.querySelectorAll(OBST);
    for (var i = 0; i < list.length && out.length < 1800; i++) {
      var e = list[i];
      /* decorative copies (a marquee's aria-hidden twin) are still on screen, so they count too */
      if (e.closest(SKIP)) continue;
      var r = docRect(e);
      if (r.w >= 2 && r.h >= 2 && r.x < VW && r.x + r.w > 0) out.push(r);
    }
    /* anything that slides sideways claims its whole row */
    var mq = doc.querySelectorAll('.marquee, [class*="marquee"], [data-marquee]');
    for (i = 0; i < mq.length && i < 40; i++) { var m = docRect(mq[i]); if (m.h >= 2) out.push({ x: 0, y: m.y, w: VW, h: m.h }); }
    var tw = doc.createTreeWalker(doc.querySelector('main') || body, NodeFilter.SHOW_TEXT, null), n, k = 0;
    while ((n = tw.nextNode()) && k < 2500) {
      var pe = n.parentElement;
      if (!/\S/.test(n.nodeValue) || !pe || pe.closest('script, style, ' + SKIP)) continue;
      k++;
      range.selectNodeContents(n);
      var q = range.getBoundingClientRect();
      if (q.width > 1) out.push({ x: q.left + sx, y: q.top + sy, w: q.width, h: q.height });
    }
    /* sticky things (a sidebar, a pinned header) sweep their whole parent as the page scrolls */
    var all = (doc.querySelector('main') || body).querySelectorAll('*');
    for (i = 0; i < all.length && i < 5000; i++) {
      if (getComputedStyle(all[i]).position !== 'sticky') continue;
      var sr = docRect(all[i]), par = all[i].parentElement, pr = par ? docRect(par) : sr;
      out.push({ x: sr.x, y: Math.min(sr.y, pr.y), w: sr.w, h: Math.max(pr.y + pr.h, sr.y + sr.h) - Math.min(sr.y, pr.y) });
    }
    /* the circuit layer's traces and chips are drawn art too: keep off them */
    var cx = doc.querySelectorAll('.cx-base path, .cx-base circle, .cx-chip');
    for (i = 0; i < cx.length && i < 300; i++) {
      var c = docRect(cx[i]);
      if (c.w + c.h >= 2 && (Math.min(c.w, c.h) < 90 || c.w * c.h < 120000)) out.push({ x: c.x - 3, y: c.y - 3, w: c.w + 6, h: c.h + 6 });
    }
    return out;
  }
  function siteIn(r, obs, used, right) {
    var best = null, bs = -1, cols = phone ? 9 : 16, rows = clamp(Math.round(r.h / 70), 3, 16);
    var near = obs.filter(function (o) { return o.y < r.y + r.h + 60 && o.y + o.h > r.y - 60; });
    for (var ci = 0; ci < cols; ci++) {
      for (var ri = 0; ri < rows; ri++) {
        var x = r.x + (ci + .5) / cols * r.w, y = r.y + (ri + .5) / rows * r.h;
        if (y < 120 || x < 18 || x > VW - 18) continue;
        var clr = 140;
        for (var k = 0; k < near.length && clr > 0; k++) {
          var o = near[k], dx = Math.max(o.x - x, 0, x - o.x - o.w), dy = Math.max(o.y - y, 0, y - o.y - o.h);
          clr = Math.min(clr, Math.sqrt(dx * dx + dy * dy));
        }
        for (k = 0; k < used.length; k++) clr = Math.min(clr, dist(x, y, used[k].x, used[k].y) - 40);
        var score = Math.min(clr, 90) + ((x > r.x + r.w / 2) === right ? 12 : 0) + Math.random() * 4;
        if (clr >= 16 && score > bs) { bs = score; best = { x: x, y: y }; }
      }
    }
    return best;
  }
  function nestName(sec, i) {
    if (sec.classList.contains('site-footer')) return 'the footer';
    if (i === 0 && (sec.classList.contains('hero') || sec.querySelector('h1'))) return 'the hero';
    var h = sec.querySelector('h1, h2, h3'), t = short(h ? h.textContent : sec.getAttribute('aria-label'), 24);
    return t ? '“' + t + '”' : 'section ' + (i + 1);
  }
  function makeNest(sec, i, site, r) {
    var n = { id: i, sec: sec, rx: site.x - r.x, ry: site.y - r.y, x: site.x, y: site.y, owner: 0, home: false, name: nestName(sec, i), loot: [], cap: 0, capBy: 0, flash: 0, alarm: 0, seed: rand(0, 1000), grains: [], size: 1, holes: [] };
    /* extra entrances, dug as the nest grows */
    for (var h = 0; h < 2; h++) { var ha = rand(0, TAU); n.holes.push({ x: Math.cos(ha) * rand(.55, .8), y: Math.sin(ha) * rand(.3, .5), s: rand(.6, .8) }); }
    for (var k = 0; k < 16; k++) { var a = rand(0, TAU), d = rand(.85, 1.55); n.grains.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * .7, s: rand(.7, 1.4) }); }
    return n;
  }
  /* nests and scenery share one survey of where the page's content sits */
  function layoutWorld() {
    var secs = sectionsList(), obs = obstacles();
    obsCache = obs;
    placeNests(secs, obs);
    placeScenery(secs, obs);
    phReset();
  }
  function placeNests(secs, obs) {
    var used = [], old = nests, out = [];
    secs.forEach(function (sec, i) {
      var r = docRect(sec), right = i % 2 === 1;
      var site = siteIn(r, obs, used, right) || { x: right ? VW - 24 : 24, y: r.y + r.h * .5 };
      used.push(site);
      out.push(makeNest(sec, i, site, r));
    });
    if (out.length === 1) {
      var r1 = docRect(secs[0]), s2 = siteIn(r1, obs, used, true) || { x: VW - 24, y: r1.y + r1.h * .75 };
      out.push(makeNest(secs[0], 1, s2, r1));
    }
    var half = Math.ceil(out.length / 2), same = old.length === out.length;
    out.forEach(function (n, i) { n.owner = same ? old[i].owner : i < half ? 0 : 1; if (same) { n.loot = old[i].loot; n.size = old[i].size; } });
    out[0].home = true; out[out.length - 1].home = true;
    out[0].owner = 0; out[out.length - 1].owner = 1;
    nests = out;
    COL[0].homeN = nests[0]; COL[1].homeN = nests[nests.length - 1];
    if (!old.length) return;
    /* a resize moved the nests: send every ant to its new address */
    trails = [];
    ants.forEach(function (a) {
      if (a.caste === 'q') { a.home = a.inNest = COL[a.col].homeN; if (a.hidden) { a.x = a.home.x; a.y = a.home.y; } }
      else if (same) { ['home', 'inNest'].forEach(function (k) { if (a[k]) a[k] = out[old.indexOf(a[k])] || null; }); }
      else { a.home = a.inNest = null; }
      if (!a.home || a.home.owner !== a.col) a.home = nearestNest(a.col, a.x, a.y);
      if (!a.inNest) a.inNest = a.home;
      a.raid = null;
      if (a.job && (a.job.n || a.job.k === 'raid')) a.job = null;
    });
  }
  function anchorNests() {
    nests.forEach(function (n) {
      if (!n.sec.isConnected) return;
      var r = docRect(n.sec);
      n.x = clamp(r.x + n.rx, 14, VW - 14);
      n.y = r.y + clamp(n.ry, 10, Math.max(10, r.h - 10));
    });
  }
  function nearestNest(cid, x, y) {
    var best = COL[cid].homeN, bd = Infinity;
    nests.forEach(function (n) { if (n.owner !== cid) return; var d = dist(x, y, n.x, n.y); if (d < bd) { bd = d; best = n; } });
    return best;
  }
  function placeName(x, y) {
    var best = nests[0], bd = Infinity;
    nests.forEach(function (n) { var d = dist(x, y, n.x, n.y); if (d < bd) { bd = d; best = n; } });
    return best ? best.name : 'the page';
  }

  /* ------------------------------------------------------------------
     Ants
     ------------------------------------------------------------------ */
  function makeAnt(cid, caste, x, y) {
    var q = caste === 'q', s = caste === 's', c = caste === 'c';
    var an = {
      id: ++uid, col: cid, caste: caste, x: x, y: y, a: rand(0, TAU),
      L: (q ? 13.5 : s ? rand(8.4, 9.6) : c ? rand(6.2, 6.9) : rand(6.1, 7.3)) * (phone ? .95 : 1),
      v: (q ? 15 : s ? rand(27, 34) : c ? rand(42, 50) : rand(33, 43)) * (phone ? .92 : 1),
      hp: q ? 40 : s ? 15 : c ? 5 : 6, home: null, lay: 0, tree: null, inNest: null, raid: null, raidUntil: 0,
      job: null, surf: null, s: 0, dir: 1, off: rand(-1.3, 1.3), carry: null, foe: null, pa: 0, ft: 0, tick: 0,
      flee: 0, fx: 0, fy: 0, pause: 0, cool: 0, greet: 0, daze: 0, fl: 0, flT: 1, vx: 0, vy: 0, spin: 0, spinA: 0, z: 1,
      gait: rand(0, TAU), wob: rand(0, TAU), seed: rand(0, 100), alpha: 1, hidden: false, hideT: 0,
      swim: false, rip: 0, dead: 0, sense: rand(0, .5), rainId: 0
    };
    an.maxHp = an.hp;
    ants.push(an);
    return an;
  }
  function populate() {
    nests.forEach(function (n) {
      var k = n.home ? PER_NEST + 2 : PER_NEST;
      for (var i = 0; i < k && ants.filter(function (a) { return a.col === n.owner; }).length < MAX_POP; i++) {
        var a = rand(0, TAU), d = rand(12, 170);
        var an = makeAnt(n.owner, casteFor(Math.random()), clamp(n.x + Math.cos(a) * d, 6, VW - 6), clamp(n.y + Math.sin(a) * d * .8, 6, DH - 6));
        an.home = n;
        if (Math.random() < .2) { an.hidden = true; an.inNest = n; an.hideT = rand(.5, 6); }
      }
    });
    /* a few scouts start on the first screen, so every visit opens on a living page */
    var free = ants.filter(function (a) { return !a.hidden; });
    for (var s = 0; s < (lite ? 6 : 12) && free.length; s++) {
      var an = free.splice((Math.random() * free.length) | 0, 1)[0];
      an.x = sx + rand(30, VW - 30); an.y = sy + rand(VH * .2, VH - 40);
    }
    COL.forEach(function (c) {
      var q = makeAnt(c.id, 'q', c.homeN.x, c.homeN.y);
      q.home = q.inNest = c.homeN; q.hidden = true; q.hideT = Infinity;
      c.queen = q;
    });
  }
  /* roughly a quarter soldiers, one in seven a scout, the rest workers */
  function casteFor(r) { return r < .26 ? 's' : r < .4 ? 'c' : 'w'; }
  var CASTE = { w: 'worker', c: 'scout', s: 'soldier', q: 'queen' };
  function detach(an) { an.surf = null; an.tree = null; }
  function grab(an, it) { an.carry = it; an.lay = 1; }
  function bound(an) { an.x = clamp(an.x, 3, VW - 3); an.y = clamp(an.y, 3, DH - 3); }

  /* stop-and-go rhythm, like real ants */
  function pace(an, dt) { an.wob += dt * (1.6 + an.seed % 1); return .8 + .3 * Math.sin(an.wob * 1.7 + an.seed); }
  function walkTo(an, dt, gx, gy, mul) {
    var dx = gx - an.x, dy = gy - an.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < .6) return d;
    var bz = pace(an, dt), want = Math.atan2(dy, dx);
    if (d > 26) want += Math.sin(an.wob) * .42 + Math.sin(an.wob * 2.3 + an.seed) * .18;
    var diff = angDiff(want, an.a), turn = (an.caste === 'q' ? 4 : 7.5) * dt;
    an.a += clamp(diff, -turn, turn);
    var step = Math.min(an.v * SPD * (mul || 1) * bz * (an.swim ? .45 : 1) * dt, d);
    if (Math.abs(diff) > 1.3) step *= .3;
    an.x += Math.cos(an.a) * step; an.y += Math.sin(an.a) * step;
    an.gait += step / (an.L * .28);
    return d - step;
  }
  function placeOn(an, s, dt, face) {
    var p = perimAt(s, an.s), n = p.a - HALF;
    an.x = p.x + Math.cos(n) * an.off; an.y = p.y + Math.sin(n) * an.off;
    var want = face != null ? face : p.a + (an.dir < 0 ? PI : 0);
    an.a += angDiff(want, an.a) * Math.min(1, dt * 12);
  }
  function crawl(an, dt) {
    var step = an.v * SPD * pace(an, dt) * (an.swim ? .45 : 1) * dt;
    an.s += step * an.dir;
    an.gait += step / (an.L * .28);
    placeOn(an, an.surf, dt);
    return step;
  }

  /* ---------- decisions ---------- */
  function wanderJob(an, R) {
    var a = an.a + rand(-1.4, 1.4), d = rand(R * .4, R);
    return { k: 'wander', x: clamp(an.x + Math.cos(a) * d, 8, VW - 8), y: clamp(an.y + Math.sin(a) * d, 8, DH - 8), t: rand(3, 7) };
  }
  function guardJob(n) { return { k: 'guard', n: n, t: rand(7, 13), ang: rand(0, TAU), R: rand(22, 46), sp: Math.random() < .5 ? 1 : -1 }; }
  function foodJob(f) { return { k: 'food', f: f, ph: 'go', ox: rand(-3, 3), oy: rand(-3, 3), t: 0 }; }
  function raidJob(n) { return { k: 'raid', n: n, ph: 'march', ox: rand(-14, 14), oy: rand(-10, 10), t: 0 }; }
  function patrolJob(an, bite, s) {
    if (!s) {
      var cand = [], w = [];
      surfs.forEach(function (q) {
        if (!q.alive) return;
        var cx = clamp(an.x, q.x, q.x + q.w), cy = clamp(an.y, q.y, q.y + q.h), d = dist(an.x, an.y, cx, cy);
        if (d > 480) return;
        var kw = q.kind === 'btn' ? 3 : q.kind === 'bar' ? 2.2 : q.kind === 'card' || q.kind === 'chip' ? 2 : q.kind === 'img' ? 1.6 : 1;
        if (an.caste === 's' && (q.kind === 'bar' || q.kind === 'card')) kw *= 1.6;
        cand.push(q); w.push(kw * (onScreen(cx, cy, 80) ? 3 : 1) * (1.2 - d / 480));
      });
      if (!cand.length) return false;
      s = weighted(cand, w);
    }
    live(s);
    if (!s.alive) return false;
    an.job = { k: 'patrol', ph: 'go', surf: s, s0: nearestS(s, an.x, an.y), dir: Math.random() < .5 ? 1 : -1, left: Math.min(s.len * rand(.5, 1.8), rand(260, 900)), bite: bite, t: 0 };
    return true;
  }
  function letterJob(an, el) {
    var L = findLetter(an, el);
    if (!L) return false;
    an.job = { k: 'letter', ph: 'go', el: L.el, node: L.node, i: L.i, ch: L.ch, ink: L.ink, x: L.x, y: L.y, re: .35, t: 0 };
    return true;
  }
  /* food an ant can smell: sugar, fallen leaves and petals, then the fallen */
  function nearFood(an, R) {
    var best = null, bd = R, i;
    for (i = 0; i < foods.length; i++) { var f = foods[i]; if (f.n <= 0) continue; var d = dist(an.x, an.y, f.x, f.y); if (d < bd) { bd = d; best = f; } }
    if (an.caste !== 's') for (i = 0; i < items.length; i++) {
      var it = items[i];
      if (!takeable(it, an)) continue;
      var e = dist(an.x, an.y, it.x, it.y) * (it.need > 1 ? .8 : 1);
      if (e < bd) { bd = e; best = it; }
    }
    if (best) return best;
    bd = Math.min(R, 320);
    ants.forEach(function (c) {
      if (c.dead < 2 || c.claimed || c.gone || c.fl > 0) return;
      var d = dist(an.x, an.y, c.x, c.y);
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  }
  function takeable(it, an) { return it.n > 0 && it.state === 'ground' && (it.col == null || it.col === an.col) && it.crew.length < it.need; }
  function goFor(an, f) { detach(an); an.job = f.item ? haulJob(f) : foodJob(f); }
  function pickTrail(an) {
    var c = [], w = [];
    trails.forEach(function (t) { if (t.col === an.col && t.str > .3 && dist(an.x, an.y, t.n.x, t.n.y) < 520) { c.push(t); w.push(t.str); } });
    return c.length ? weighted(c, w) : null;
  }
  /* food memory: a colony remembers where food was and sends workers back */
  function followTrail(an, t) {
    var s = t.src;
    if (s.k === 'text') return letterJob(an, s.el);
    if (s.k === 'bite') return canBite(s.surf) && patrolJob(an, .5, s.surf);
    if (s.k === 'tree') return climbJob(an, s.tr);
    if (s.k === 'food' && s.f.n > 0) { if (s.f.item && !takeable(s.f, an)) return false; goFor(an, s.f); return true; }
    return false;
  }
  function forageJob(an) {
    var n = an.home, away = Math.atan2(an.y - n.y, an.x - n.x);
    return { k: 'forage', t: rand(9, 16), sn: 0, want: dist(an.x, an.y, n.x, n.y) > 20 ? away + rand(-1, 1) : rand(0, TAU), on: 0 };
  }
  /* scouts range far, preferring corners of the page their colony has not seen lately */
  var seen = [new Map(), new Map()], SEEN = 110;
  function seenKey(x, y) { return ((x / SEEN) | 0) + ((y / SEEN) | 0) * 512; }
  function scoutJob(an) {
    var best = null, bs = Infinity, m = seen[an.col];
    for (var k = 0; k < 7; k++) {
      var a = rand(0, TAU), d = rand(220, lite ? 520 : 760);
      var x = clamp(an.x + Math.cos(a) * d, 16, VW - 16), y = clamp(an.y + Math.sin(a) * d, 16, DH - 16);
      var sc = (m.get(seenKey(x, y)) || -99) + Math.random() * 6 + (onScreen(x, y, 0) ? -4 : 0);
      if (sc < bs) { bs = sc; best = { x: x, y: y }; }
    }
    return { k: 'scout', x: best.x, y: best.y, t: rand(10, 18), sn: 0 };
  }
  function climbJob(an, tr) {
    if (!tr) {
      var c = [], w = [];
      trees.forEach(function (t) {
        if (t.grow < .9) return;
        var d = dist(an.x, an.y, t.x, t.y);
        if (d < 520 && climbers(t) < 3) { c.push(t); w.push((onScreen(t.x, t.y, 0) ? 3 : 1) * (1.2 - d / 520)); }
      });
      if (!c.length) return false;
      tr = weighted(c, w);
    }
    if (!tr.alive || climbers(tr) >= 3) return false;
    detach(an);
    an.job = { k: 'climb', tr: tr, ph: 'go', path: pick(tr.paths), i: 0, t: 0 };
    return true;
  }
  function climbers(t) { var n = 0; for (var i = 0; i < ants.length; i++) if (ants[i].tree === t) n++; return n; }
  function haulJob(it) { return { k: 'haul', it: it, ph: 'go', t: 0, w: 0, call: 0 }; }
  function think(an) {
    if (an.caste === 'q') { an.job = { k: 'home', n: an.home, why: 'queen' }; return; }
    if (an.home.owner !== an.col) an.home = nearestNest(an.col, an.x, an.y);
    var dHome = dist(an.x, an.y, an.home.x, an.home.y), r = Math.random();
    if (rain && an.rainId !== rain.id) {
      an.rainId = rain.id;
      if (r < .4) { an.job = { k: 'home', why: 'shelter' }; return; }
    }
    if (an.caste === 's') {
      if (an.raid && now < an.raidUntil && an.raid.owner !== an.col) { an.job = raidJob(an.raid); return; }
      an.raid = null;
      /* soldiers stay close to home: they guard the mound and walk its nearest edges */
      if (dHome > 700 && r < .6) an.job = { k: 'home', why: 'rest' };
      else if (r < .45) an.job = guardJob(an.home);
      else if (r < .78 && patrolJob(an, 0)) return;
      else an.job = wanderJob(an, 160);
      return;
    }
    if (an.caste === 'c') {
      if (dHome > 1300 && r < .5) { an.job = { k: 'home', why: 'rest' }; return; }
      if (r < .72) { an.job = scoutJob(an); return; }
      if (r < .82 && climbJob(an)) return;
      if (r < .92 && patrolJob(an, 0)) return;
      an.job = wanderJob(an, 220);
      return;
    }
    if (dHome > 950 && r < .55) { an.job = { k: 'home', why: 'rest' }; return; }
    var tr = pickTrail(an);
    if (tr && Math.random() < .5 && followTrail(an, tr)) return;
    var f = nearFood(an, 600);
    if (f && Math.random() < (f.item ? .9 : .75)) { goFor(an, f); return; }
    r = Math.random();
    if (r < .2 && letterJob(an)) return;
    if (r < .46 && patrolJob(an, rand(.05, .14))) return;
    if (r < .58 && climbJob(an)) return;
    if (r < .84) { an.job = forageJob(an); return; }
    if (r < .92) { an.job = { k: 'home', why: 'rest' }; return; }
    an.job = wanderJob(an, 140);
  }

  /* ---------- jobs ---------- */
  function stepPatrol(an, j, dt) {
    var s = live(j.surf);
    if (!s.alive) { detach(an); an.job = null; return; }
    /* knocked off the edge (a scare, a fight): walk back to the nearest point and climb on again */
    if (j.ph !== 'go' && an.surf !== s) { j.ph = 'go'; j.s0 = nearestS(s, an.x, an.y); j.t = 0; }
    if (j.ph === 'go') {
      var p = perimAt(s, j.s0);
      j.t += dt;
      if (j.t > 30) { an.job = null; return; }
      if (walkTo(an, dt, p.x, p.y, 1) < 2.5) { an.surf = s; an.s = j.s0; an.dir = j.dir; j.ph = 'crawl'; }
      return;
    }
    if (j.ph === 'crawl') {
      j.left -= crawl(an, dt);
      if (j.bite && an.caste === 'w' && !an.carry && Math.random() < dt * j.bite && canBite(s, an.s)) { j.ph = 'nibble'; j.t = rand(1.3, 2.3); j.cr = 0; j.c = bgOf(s.el); return; }
      if (j.left <= 0) { detach(an); an.job = null; }
      else if (Math.random() < dt * .08) an.pause = rand(.25, .8);
      return;
    }
    /* nibble: face into the edge and chew */
    var q = perimAt(s, an.s);
    placeOn(an, s, dt, q.a + HALF);
    an.gait += dt * 3;
    j.t -= dt; j.cr -= dt;
    if (j.cr <= 0) { j.cr = .14; crumbs(q.x, q.y, j.c, 1); }
    if (j.t > 0) return;
    detach(an);
    if (canBite(s, an.s)) {
      makeBite(s, an.s, an);
      grab(an, { k: 'crumb', c: j.c, sh: rand(0, TAU) });
      if (calm('bite', 9)) log(COL[an.col].name + ' took a bite out of ' + label(s.el), an.col);
      an.job = { k: 'home', why: 'carry', src: { k: 'bite', surf: s } };
    } else an.job = null;
  }
  function stepLetter(an, j, dt) {
    j.re -= dt;
    if (j.re <= 0) {
      j.re = .35;
      var r = j.node.isConnected && j.node.nodeValue.charAt(j.i) === j.ch && charRect(j.node, j.i);
      if (!r) { an.job = null; return; }
      j.x = r.x + r.w / 2; j.y = r.y + r.h * .55;
    }
    if (j.ph === 'go') {
      j.t += dt;
      if (j.t > 35) { an.job = null; return; }
      if (walkTo(an, dt, j.x, j.y, 1) < 2.5) { j.ph = 'eat'; j.e = rand(1, 1.7); j.cr = 0; }
      return;
    }
    an.x += (j.x - an.x) * Math.min(1, dt * 6); an.y += (j.y - an.y) * Math.min(1, dt * 6);
    an.a += Math.sin(now * 9 + an.seed) * dt * 1.5;
    j.e -= dt; j.cr -= dt;
    if (j.cr <= 0) { j.cr = .16; crumbs(an.x + Math.cos(an.a) * an.L * .5, an.y + Math.sin(an.a) * an.L * .5, j.ink.color, 1); }
    if (j.e > 0) return;
    if (!steal(j)) { an.job = null; return; }
    grab(an, { k: 'glyph', ch: j.ink.upper ? j.ch.toUpperCase() : j.ch, font: j.ink.font, c: j.ink.color });
    if (calm('letter', 8)) log(COL[an.col].name + ' ate the “' + an.carry.ch + '” from “' + short(j.el.innerText || j.el.textContent, 24) + '”', an.col);
    an.job = { k: 'home', why: 'carry', src: { k: 'text', el: j.el } };
  }
  function stepFood(an, j, dt) {
    var f = j.f, corpse = f.dead > 0;
    if (corpse ? f.gone || (f.claimed && f.claimed !== an) || f.fl > 0 : f.n <= 0) { an.job = null; return; }
    if (j.ph === 'go') {
      j.t += dt;
      if (j.t > 40) { an.job = null; return; }
      if (walkTo(an, dt, f.x + (corpse ? 0 : j.ox), f.y + (corpse ? 0 : j.oy), 1) < (corpse ? 4 : 3)) { j.ph = 'eat'; j.e = corpse ? .5 : rand(.6, 1.1); if (corpse) f.claimed = an; }
      return;
    }
    j.e -= dt; an.gait += dt * 2;
    if (j.e > 0) return;
    if (corpse) { f.gone = true; grab(an, { k: 'corpse', col: f.col, L: f.L }); }
    else { f.n--; grab(an, { k: 'sugar' }); crumbs(f.x, f.y, PAL.sugar2, 2); }
    an.job = { k: 'home', why: 'carry', src: corpse ? null : { k: 'food', f: f } };
  }
  function stepHome(an, j, dt) {
    if (an.caste === 'q') j.n = an.home;
    else if (!j.n || j.n.owner !== an.col) j.n = nearestNest(an.col, an.x, an.y);
    var n = j.n, d = walkTo(an, dt, n.x, n.y, an.carry ? .9 : 1.05);
    if (d < 8) an.alpha = Math.max(.2, d / 8);
    if (d > 2.5) return;
    an.home = an.inNest = n;
    if (an.carry) deposit(an, n, j.src);
    if (j.why === 'report') report(an, n, j.f);
    an.hidden = true; an.surf = null; an.job = null; an.alpha = 1;
    an.hideT = an.caste === 'q' ? Infinity : j.why === 'shelter' ? (rain ? rain.dur - rain.t : 0) + rand(2, 6) : rand(1.2, 5);
  }
  function deposit(an, n, src) {
    var it = an.carry;
    var v = it.k === 'glyph' ? 2 : it.k === 'corpse' ? 3 : 1;
    COL[an.col].food += v;
    grow(n, v);
    if (it.k === 'glyph') {
      n.loot.push({ ch: it.ch, c: it.c, a: rand(0, TAU), d: rand(1.05, 1.6), r: rand(-.6, .6) });
      if (n.loot.length > 7) n.loot.shift();
    }
    an.carry = null;
    if (src) addTrail(an.col, n, src);
  }
  /* nests grow with the food that comes in; a big nest digs more doors and raises more ants */
  function grow(n, v) {
    var was = n.size;
    n.size = Math.min(2.2, n.size + v * .012);
    if (was < 1.5 && n.size >= 1.5 && calm('grow' + n.id, 60)) log('The ' + COL[n.owner].name + ' nest in ' + n.name + ' dug a new chamber', n.owner);
  }
  /* a scout back from a find: it wakes the nest and leads foragers out along its fresh scent */
  function report(an, n, f) {
    if (!f || f.n <= 0) return;
    stats.finds++;
    var k = 0;
    ants.forEach(function (a) {
      if (k >= 4 || !a.hidden || a.inNest !== n || a.col !== an.col || a.caste !== 'w') return;
      k++; a.hideT = rand(.2, 1.2); a.job = null; a.next = f;
    });
    recruit(an.col, n.x, n.y, 2, function (a) { return a.caste === 'w' && dist(a.x, a.y, n.x, n.y) < 260; }).forEach(function (a) { goFor(a, f); k++; });
    if (k && calm('scout' + an.col, 16)) log((/^[AEIOU]/.test(COL[an.col].name) ? 'An ' : 'A ') + COL[an.col].name + ' scout found ' + (f.k === 'sugar' ? 'sugar' : f.k === 'leaf' ? 'a leaf' : 'petals') + ' and led ' + k + ' workers out', an.col);
  }
  function stepHidden(an, dt) {
    an.hideT -= dt;
    if (an.hideT > 0) return;
    var n = an.inNest || an.home;
    an.hidden = false; an.x = n.x; an.y = n.y; an.alpha = 0; an.a = rand(0, TAU);
    an.job = { k: 'emerge', t: .8, a: rand(0, TAU), n: n };
    /* recruited by a scout: head straight for the find */
    if (an.next) { var f = an.next; an.next = null; if (f.n > 0 && (!f.item || takeable(f, an))) { an.job = f.item ? haulJob(f) : foodJob(f); an.a = Math.atan2(f.y - n.y, f.x - n.x); } }
  }
  function stepJob(an, dt) {
    var j = an.job, n;
    switch (j.k) {
      case 'emerge':
        j.t -= dt;
        walkTo(an, dt, j.n.x + Math.cos(j.a) * 18, j.n.y + Math.sin(j.a) * 13, .8);
        if (j.t <= 0) an.job = null;
        break;
      case 'wander':
        j.t -= dt;
        if (walkTo(an, dt, j.x, j.y, 1) < 3 || j.t <= 0) an.job = null;
        else if (Math.random() < dt * .12) an.pause = rand(.2, .7);
        break;
      case 'patrol': stepPatrol(an, j, dt); break;
      case 'letter': stepLetter(an, j, dt); break;
      case 'food': stepFood(an, j, dt); break;
      case 'home': stepHome(an, j, dt); break;
      case 'guard':
        j.t -= dt; j.ang += dt * j.sp * 26 / j.R;
        walkTo(an, dt, j.n.x + Math.cos(j.ang) * j.R, j.n.y + Math.sin(j.ang) * j.R * .72, j.rush && dist(an.x, an.y, j.n.x, j.n.y) > 60 ? 1.5 : .9);
        if (j.t <= 0 || j.n.owner !== an.col) an.job = null;
        break;
      case 'hunt':
        j.t -= dt;
        if (!j.foe || j.foe.dead || j.foe.hidden || j.t <= 0) an.job = null;
        else walkTo(an, dt, j.foe.x, j.foe.y, 1.25);
        break;
      case 'raid':
        n = j.n;
        if (n.owner === an.col) { an.home = n; an.raid = null; an.job = guardJob(n); break; }
        if (j.ph === 'march') {
          j.t += dt;
          if (walkTo(an, dt, n.x + j.ox, n.y + j.oy, 1.5) < 4 || j.t > 150) { j.ph = 'siege'; j.t = rand(18, 28); j.w = 0; }
          break;
        }
        j.t -= dt; j.w -= dt;
        if (j.w <= 0) { var a = rand(0, TAU), d = rand(4, 30); j.w = rand(.8, 1.6); j.x = n.x + Math.cos(a) * d; j.y = n.y + Math.sin(a) * d * .75; }
        walkTo(an, dt, j.x, j.y, .9);
        if (j.t <= 0) { an.raid = null; an.job = null; }
        break;
      case 'stroll':
        j.t -= dt; j.ang += dt * .33;
        walkTo(an, dt, j.n.x + Math.cos(j.ang) * 36, j.n.y + Math.sin(j.ang) * 24, 1);
        if (j.t <= 0) an.job = { k: 'home', why: 'queen' };
        break;
      case 'forage': stepForage(an, j, dt); break;
      case 'scout': stepScout(an, j, dt); break;
      case 'climb': stepClimb(an, j, dt); break;
      case 'haul': stepHaul(an, j, dt); break;
      case 'curious': stepCurious(an, j, dt); break;
      case 'attend':
        var q = j.q;
        j.t -= dt;
        if (q.hidden || q.dead || !q.job || q.job.k !== 'stroll' || j.t <= 0) an.job = null;
        else walkTo(an, dt, q.x + Math.cos(q.a + j.o) * 13, q.y + Math.sin(q.a + j.o) * 13, 1.2);
        break;
      default: an.job = null;
    }
  }

  /* foraging: sniff three points ahead and turn toward the strongest scent; no scent, keep exploring */
  function stepForage(an, j, dt) {
    j.t -= dt; j.sn -= dt;
    if (j.t <= 0) { an.job = { k: 'home', why: 'rest' }; return; }
    if (j.sn <= 0) {
      j.sn = rand(.2, .3);
      var f = nearFood(an, j.on > 0 ? 70 : 52);
      if (f) { goFor(an, f); return; }
      var bk = 9, bv = .035;
      for (var k = -1; k <= 1; k++) {
        var sa = an.a + k * .6, v = phAt(an.col, an.x + Math.cos(sa) * 20, an.y + Math.sin(sa) * 20) * (k ? 1 : 1.08);
        if (v > bv) { bv = v; bk = k; }
      }
      if (bk !== 9) { j.want = an.a + bk * .5; j.on = 1.5; }
      else { j.on -= .25; j.want += rand(-.55, .55); }
      /* keep off the edges of the page */
      if (an.x < 24 || an.x > VW - 24 || an.y < 24 || an.y > DH - 24) j.want = Math.atan2(an.home.y - an.y, an.home.x - an.x);
    }
    var tn = 5 * dt;
    an.a += clamp(angDiff(j.want, an.a), -tn, tn);
    var st = an.v * SPD * pace(an, dt) * (an.swim ? .45 : 1) * (j.on > 0 ? 1.05 : .85) * dt;
    an.x += Math.cos(an.a) * st; an.y += Math.sin(an.a) * st;
    an.gait += st / (an.L * .28);
    if (j.on <= 0 && Math.random() < dt * .15) an.pause = rand(.2, .6);
  }
  /* scouting: range out, remember what was seen, run home laying scent when something good turns up */
  function stepScout(an, j, dt) {
    j.t -= dt; j.sn -= dt;
    if (j.sn <= 0) {
      j.sn = .4;
      seen[an.col].set(seenKey(an.x, an.y), now);
      var f = null, bd = 110, i;
      for (i = 0; i < foods.length; i++) { var q = foods[i], d = dist(an.x, an.y, q.x, q.y); if (q.n > 0 && d < bd) { bd = d; f = q; } }
      for (i = 0; i < items.length; i++) { var it = items[i]; if (it.state === 'ground' && it.n > 0 && it.col == null) { d = dist(an.x, an.y, it.x, it.y); if (d < bd) { bd = d; f = it; } } }
      if (f && !known(an.col, f)) {
        addTrail(an.col, nearestNest(an.col, an.x, an.y), { k: 'food', f: f });
        an.job = { k: 'home', why: 'report', f: f };
        an.lay = 1; an.pause = .35;
        return;
      }
      for (i = 0; i < trees.length; i++) {
        var tr = trees[i];
        if (tr.grow >= 1 && dist(an.x, an.y, tr.x, tr.y) < 70 && !known(an.col, tr)) addTrail(an.col, nearestNest(an.col, an.x, an.y), { k: 'tree', tr: tr });
      }
    }
    if (walkTo(an, dt, j.x, j.y, 1) < 4 || j.t <= 0) { an.job = null; an.pause = rand(.3, .8); }
  }
  function known(cid, f) {
    for (var i = 0; i < trails.length; i++) { var t = trails[i], s = t.src; if (t.col === cid && (s.f === f || s.tr === f)) return true; }
    return false;
  }
  /* trees: up the trunk, out along a branch, a rest in the leaves, a cut leaf or a petal, and back down */
  function treePt(tr, p) {
    var c = Math.cos(tr.sway), s = Math.sin(tr.sway), k = tr.grow;
    return { x: tr.x + (p[0] * c - p[1] * s) * k, y: tr.y + (p[0] * s + p[1] * c) * k };
  }
  function stepClimb(an, j, dt) {
    var tr = j.tr;
    if (!tr.alive) { detach(an); an.job = null; return; }
    if (j.ph === 'go') {
      var b = treePt(tr, j.path[0]);
      j.t += dt;
      if (j.t > 30) { an.job = null; return; }
      if (walkTo(an, dt, b.x, b.y, 1) < 2) { j.ph = 'up'; j.i = 1; an.tree = tr; }
      return;
    }
    if (an.tree !== tr) { an.job = null; return; } /* knocked off */
    if (j.ph === 'rest') {
      var p = treePt(tr, j.path[j.path.length - 1]);
      an.x = p.x; an.y = p.y; an.gait += dt * 1.5;
      an.a += Math.sin(now * 2 + an.seed) * dt * .8;
      j.w -= dt;
      if (j.w > 0) return;
      if (!an.carry && Math.random() < .6) {
        grab(an, tr.kind === 'sakura' ? { k: 'petal', c: Math.random() < .5 ? PAL.bloom : PAL.bloom2, sh: rand(0, TAU) } : { k: 'leafbit', c: Math.random() < .6 ? PAL.leaf : PAL.leaf3, sh: rand(-.3, .3) });
        crumbs(p.x, p.y, tr.kind === 'sakura' ? PAL.bloom : PAL.leaf, 2);
        if (calm('climb', 25)) log(COL[an.col].name + ' ' + CASTE[an.caste] + 's are cutting ' + (tr.kind === 'sakura' ? 'sakura petals' : 'leaves') + ' from a ' + TREE_NAME[tr.kind] + ' near ' + placeName(tr.x, tr.y), an.col);
      }
      j.ph = 'down'; j.i = j.path.length - 2;
      return;
    }
    var up = j.ph === 'up', q = treePt(tr, j.path[j.i]);
    if (walkTo(an, dt, q.x, q.y, up ? .5 : .75) > 1.5) return;
    j.i += up ? 1 : -1;
    if (up && j.i >= j.path.length) { j.ph = 'rest'; j.w = rand(1, 2.6); j.i = j.path.length - 1; }
    else if (!up && j.i < 0) {
      an.tree = null;
      an.job = an.carry ? { k: 'home', why: 'carry', src: { k: 'tree', tr: tr } } : null;
    }
  }
  /* hauling: one ant takes a petal alone; a leaf needs a team that walks it home together */
  function stepHaul(an, j, dt) {
    var it = j.it, mine = it.crew.indexOf(an) > -1;
    if (!mine && !takeable(it, an)) { an.job = null; return; }
    if (j.ph === 'go') {
      j.t += dt;
      if (j.t > 30) { an.job = null; return; }
      if (walkTo(an, dt, it.x, it.y, 1) > it.s * .55 + 2) return;
      if (it.need <= 1) {
        it.n = 0; it.state = 'gone';
        grab(an, { k: 'petal', c: it.c, sh: it.rot });
        an.job = { k: 'home', why: 'carry', src: null };
        return;
      }
      it.crew.push(an); it.col = an.col;
      j.ph = 'hold'; j.w = 0; j.call = 0;
      j.slot = it.crew.length - 1;
      return;
    }
    if (!mine) { an.job = null; return; }
    /* hold the leaf at an assigned place around its edge */
    var n = it.crew.length, k = it.crew.indexOf(an), sa = it.dir + HALF + (k + .5) * TAU / Math.max(n, it.need), R = it.s * .5 + an.L * .42;
    var tx = it.x + Math.cos(sa) * R, ty = it.y + Math.sin(sa) * R;
    an.x += (tx - an.x) * Math.min(1, dt * 10); an.y += (ty - an.y) * Math.min(1, dt * 10);
    if (it.state === 'carried') {
      an.a += angDiff(it.dir, an.a) * Math.min(1, dt * 8);
      an.gait += it.sp * dt / (an.L * .28);
      return;
    }
    an.a += angDiff(sa + PI, an.a) * Math.min(1, dt * 8);
    an.gait += dt * 5;
    j.w += dt; j.call -= dt;
    if (j.call <= 0) {
      j.call = 1.2;
      /* tug and call for help */
      recruit(an.col, it.x, it.y, it.need - n, function (a) { return a.caste === 'w' && dist(a.x, a.y, it.x, it.y) < 380 && (!a.job || /wander|forage|patrol|home/.test(a.job.k)) && !a.surf; }).forEach(function (a) { detach(a); a.job = haulJob(it); });
    }
    if (j.w > 16) { it.crew.splice(k, 1); an.job = { k: 'home', why: 'rest' }; }
  }
  /* a resting cursor: a few ants come over, stop at a polite distance and wave their antennae */
  function stepCurious(an, j, dt) {
    j.t -= dt;
    if (j.t <= 0 || !cursor.rest) { an.job = null; an.pause = rand(.2, .5); return; }
    var cx = cursor.x + sx, cy = cursor.y + sy, tx = cx + Math.cos(j.o) * j.R, ty = cy + Math.sin(j.o) * j.R;
    if (walkTo(an, dt, tx, ty, .75) < 2) {
      an.a += angDiff(Math.atan2(cy - an.y, cx - an.x), an.a) * Math.min(1, dt * 6);
      an.pause = .12;
      if (!j.said && calm('curious', 40)) { j.said = 1; log('The ants are curious about your cursor', an.col); }
    }
  }

  /* ---------- trails: the ant highways between a nest and good food ---------- */
  function srcPoint(src) {
    if (src.k === 'text') { if (!src.el.isConnected) return null; var r = docRect(src.el); return r.w ? { x: r.x + r.w / 2, y: r.y + r.h / 2 } : null; }
    if (src.k === 'bite') { var s = src.surf; return s.alive ? { x: s.x + s.w / 2, y: s.y + s.h / 2 } : null; }
    if (src.k === 'tree') return src.tr.alive ? { x: src.tr.x, y: src.tr.y } : null;
    return src.f.n > 0 ? { x: src.f.x, y: src.f.y } : null;
  }
  function sameSrc(a, b) {
    if (a.k !== b.k) return false;
    return a.k === 'text' ? a.el === b.el : a.k === 'bite' ? a.surf === b.surf : a.k === 'tree' ? a.tr === b.tr : a.f === b.f;
  }
  function addTrail(cid, n, src) {
    for (var i = 0; i < trails.length; i++) {
      var t = trails[i];
      if (t.col === cid && t.n === n && sameSrc(t.src, src)) { t.str = Math.min(6, t.str + 1); return; }
    }
    var p = srcPoint(src);
    if (!p) return;
    trails.push({ col: cid, n: n, src: src, x: p.x, y: p.y, str: 1.2 });
    if (trails.length > 24) trails.shift();
  }
  function tendTrails(dt) {
    trails = trails.filter(function (t) {
      t.str -= dt * .1;
      var p = t.n.owner === t.col && t.str > 0 && srcPoint(t.src);
      if (!p) return false;
      t.x = p.x; t.y = p.y;
      return true;
    });
  }

  /* ---------- pheromone: a coarse scent grid per colony that fades with time ----------
     Ants carrying food home (and scouts running back with news) lay scent, strongest near
     the find, so the gradient points foragers the right way. Only touched cells are kept
     in a list, so fading and drawing cost nothing where nobody has walked. */
  var PH = { c: lite ? 20 : 16, cols: 0, rows: 0, g: [null, null], on: null, act: [] };
  function phReset() {
    var cols = Math.ceil(VW / PH.c) + 1, rows = Math.ceil(DH / PH.c) + 2;
    if (cols === PH.cols && rows <= PH.rows) return;
    if (cols === PH.cols && PH.g[0]) { /* the page got taller: keep the scent, add rows */
      var n = cols * (rows + 40);
      PH.g = PH.g.map(function (o) { var g = new Float32Array(n); g.set(o); return g; });
      var on = new Uint8Array(n); on.set(PH.on); PH.on = on; PH.rows = rows + 40;
      return;
    }
    PH.cols = cols; PH.rows = rows + 40;
    PH.g = [new Float32Array(cols * PH.rows), new Float32Array(cols * PH.rows)];
    PH.on = new Uint8Array(cols * PH.rows); PH.act = [];
  }
  function phClear() { if (!PH.on) return; PH.g[0].fill(0); PH.g[1].fill(0); PH.on.fill(0); PH.act = []; }
  function phIdx(x, y) {
    var cx = (x / PH.c) | 0, cy = (y / PH.c) | 0;
    return cx < 0 || cy < 0 || cx >= PH.cols || cy >= PH.rows ? -1 : cx + cy * PH.cols;
  }
  function phAt(cid, x, y) { var i = PH.g[0] ? phIdx(x, y) : -1; return i < 0 ? 0 : PH.g[cid][i]; }
  function phAdd(cid, x, y, v) {
    var i = PH.g[0] ? phIdx(x, y) : -1;
    if (i < 0) return;
    if (!PH.on[i]) { if (PH.act.length >= 9000) return; PH.on[i] = 1; PH.act.push(i); }
    var g = PH.g[cid]; g[i] = Math.min(1.6, g[i] + v);
  }
  function phFade(dt) {
    var k = Math.pow(.5, dt / 22), a = PH.act, g0 = PH.g[0], g1 = PH.g[1];
    for (var n = a.length - 1; n >= 0; n--) {
      var i = a[n];
      g0[i] *= k; g1[i] *= k;
      if (g0[i] < .012 && g1[i] < .012) { g0[i] = g1[i] = 0; PH.on[i] = 0; a[n] = a[a.length - 1]; a.pop(); }
    }
  }
  function layScent(an, dt) {
    an.lay = Math.max(.12, an.lay - dt * .045);
    phAdd(an.col, an.x, an.y, dt * .95 * an.lay);
  }
  /* the scent drawn as faint, slightly wandering dots of ink */
  function drawScent() {
    var a = PH.act, c = PH.c, cols = PH.cols, y0 = sy - c, y1 = sy + VH + c;
    if (!a.length) return;
    for (var cid = 0; cid < 2; cid++) {
      var g = PH.g[cid];
      ctx.fillStyle = COL[cid].line;
      for (var band = 0; band < 3; band++) {
        var lo = band === 0 ? .05 : band === 1 ? .25 : .6, hi = band === 0 ? .25 : band === 1 ? .6 : 99;
        ctx.globalAlpha = (night ? 1.25 : 1) * (band === 0 ? .1 : band === 1 ? .17 : .26);
        ctx.beginPath();
        for (var n = 0; n < a.length; n++) {
          var i = a[n], v = g[i];
          if (v < lo || v >= hi) continue;
          var y = ((i / cols) | 0) * c;
          if (y < y0 || y > y1) continue;
          var h = (i * 2654435761) >>> 0, x = (i % cols) * c + c / 2 + ((h & 7) - 3.5) * .9 + (cid ? 2 : -2);
          y += c / 2 + (((h >> 3) & 7) - 3.5) * .9;
          ctx.rect(x - .8, y - .8, 1.7, 1.7);
        }
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------
     Meetings, fights and war
     ------------------------------------------------------------------ */
  var grid = new Map(), CELL = 24;
  function buildGrid() {
    grid.clear();
    for (var i = 0; i < ants.length; i++) {
      var a = ants[i];
      if (a.dead || a.hidden || a.fl > 0) continue;
      var k = ((a.x / CELL) | 0) + ((a.y / CELL) | 0) * 4096, b = grid.get(k);
      if (b) b.push(a); else grid.set(k, [a]);
    }
  }
  function around(x, y, R, fn) {
    var c0 = Math.floor((x - R) / CELL), c1 = Math.floor((x + R) / CELL), r0 = Math.floor((y - R) / CELL), r1 = Math.floor((y + R) / CELL);
    for (var cy = r0; cy <= r1; cy++) {
      for (var cx = c0; cx <= c1; cx++) {
        var b = grid.get(cx + cy * 4096);
        if (b) for (var i = 0; i < b.length; i++) fn(b[i]);
      }
    }
  }
  function contacts(dt) {
    for (var i = 0; i < ants.length; i++) {
      var a = ants[i];
      if (a.dead || a.hidden || a.fl > 0 || a.daze > 0) continue;
      a.sense -= dt;
      var scan = a.sense <= 0;
      if (scan) a.sense = rand(.3, .5);
      if (a.foe && !scan) continue;
      var R = scan ? (a.caste === 's' ? 90 : 26) : a.L + 6, foe = null, bd = R;
      around(a.x, a.y, R, function (b) {
        if (b === a || b.daze > 0) return;
        var d = dist(a.x, a.y, b.x, b.y);
        if (b.col === a.col) {
          /* two nestmates meet head-on: a quick antenna touch */
          if (d < (a.L + b.L) * .5 && a.greet <= 0 && b.greet <= 0 && !a.foe && !b.foe && !a.surf && !b.surf && Math.abs(angDiff(a.a, b.a)) > 2.3) {
            a.greet = b.greet = 6; a.pause = b.pause = rand(.3, .5);
          }
          return;
        }
        if (d < bd) { bd = d; foe = b; }
      });
      if (!foe || a.foe) continue;
      var touch = bd < (a.L + foe.L) * .55;
      if (touch && a.cool <= 0) {
        if (a.carry || a.caste === 'q' || a.caste === 'c' || (a.job && a.job.k === 'haul' && a.job.ph === 'hold') || (a.caste === 'w' && foe.caste === 's' && Math.random() < .6)) run(a, foe, rand(.6, 1), 1.5);
        else if (a.caste === 's' || foe.caste === 's' || Math.random() < .35) { if (foe.foe || foe.carry || foe.caste === 'q') { a.foe = foe; a.ft = 0; detach(a); } else engage(a, foe); }
        else run(a, foe, .5, 2.5);
      } else if (scan && a.caste === 's' && (!a.job || a.job.k !== 'hunt')) {
        detach(a); a.job = { k: 'hunt', foe: foe, t: 7 };
      } else if (scan && a.caste === 'w' && !a.carry && bd < 26 && foe.foe && Math.random() < .3) {
        detach(a); a.foe = foe; a.ft = 0;
      }
    }
  }
  function run(a, from, t, cool) { a.flee = t; a.fx = from.x; a.fy = from.y; a.cool = cool; detach(a); }
  function engage(a, b) {
    detach(a); detach(b);
    a.foe = b; b.foe = a; a.ft = b.ft = 0;
    a.tick = rand(.15, .4); b.tick = rand(.15, .4);
    a.pa = Math.atan2(b.y - a.y, b.x - a.x); b.pa = a.pa + PI;
    alarmCall(a, b); alarmCall(b, a);
  }
  /* a fight gives off alarm scent: soldiers close by drop what they are doing and come */
  function alarmCall(an, foe) {
    if (an.caste === 's' && Math.random() < .5) return;
    around(an.x, an.y, 160, function (s) {
      if (s.col !== an.col || s.caste !== 's' || s.foe || s.hidden || (s.job && (s.job.k === 'hunt' || s.job.k === 'raid'))) return;
      detach(s); s.job = { k: 'hunt', foe: foe, t: 6 };
    });
  }
  function stepFight(an, dt) {
    var f = an.foe;
    if (!f || f.dead || f.hidden || f.fl > 0 || f.gone) { an.foe = null; return false; }
    an.ft += dt;
    var reach = (an.L + f.L) * .5;
    if (f.foe === an) {
      /* a duel: the pair circles and lunges; the older ant drives both bodies */
      if (an.id < f.id) {
        an.pa += Math.sin(now * 1.3 + an.seed) * dt * 1.4;
        var mx = (an.x + f.x) / 2 + Math.sin(now * 2.1 + an.seed) * dt * 4, my = (an.y + f.y) / 2 + Math.cos(now * 1.7 + an.seed) * dt * 4;
        var h = reach * .56, l = Math.sin(now * 16 + an.seed) * an.L * .12, c = Math.cos(an.pa), s = Math.sin(an.pa);
        an.x = mx - c * (h + l); an.y = my - s * (h + l);
        f.x = mx + c * (h - l); f.y = my + s * (h - l);
        an.a = an.pa; f.a = an.pa + PI;
      }
    } else {
      /* piling on: run up and bite from the side */
      if (walkTo(an, dt, f.x, f.y, 1.3) > reach) { if (an.ft > 8) an.foe = null; return true; }
      an.a = Math.atan2(f.y - an.y, f.x - an.x);
    }
    an.gait += dt * 16;
    an.tick -= dt;
    if (an.tick <= 0) {
      an.tick = rand(.32, .62);
      if (Math.random() < .62) {
        spark((an.x + f.x) / 2, (an.y + f.y) / 2, COL[an.col].line);
        hurt(f, an.caste === 's' ? rand(2.4, 4.2) : an.caste === 'q' ? rand(4, 6) : rand(.9, 1.8), an);
      }
    }
    if (an.caste === 'w' && an.hp < 2 && Math.random() < dt * .6) {
      if (f.foe === an) f.foe = null;
      an.foe = null;
      run(an, f, 1.2, 3);
    }
    return true;
  }
  function hurt(v, d, by) {
    v.hp -= d;
    if (v.caste === 'q' && v.hp < 14) {
      v.hp = 14;
      if (v.foe && v.foe.foe === v) v.foe.foe = null;
      v.foe = null; v.job = { k: 'home', why: 'queen' };
      return;
    }
    if (v.hp <= 0) die(v, by);
  }
  function die(an, by) {
    an.dead = .001; an.hp = 0; an.surf = null; an.job = null; an.foe = null; an.z = 1; an.spinA = 0; an.alpha = 1;
    if (an.carry && an.carry.k === 'glyph') part({ k: 'glyph', x: an.x, y: an.y, T: 1.6, ch: an.carry.ch, c: an.carry.c, font: an.carry.font });
    an.carry = null;
    stats.duels++;
    puff(an.x, an.y);
    if (by) battle(an, by);
  }
  /* deaths close together in time and space are one battle */
  function battle(an, by) {
    var b = null;
    fights = fights.filter(function (f) { return now - f.t < 12; });
    fights.forEach(function (f) { if (dist(f.x, f.y, an.x, an.y) < 240) b = f; });
    if (!b) { b = { x: an.x, y: an.y, t: now, n: 0, win: [0, 0], told: false }; fights.push(b); }
    b.n++; b.win[by.col]++; b.t = now;
    if (b.n >= 3 && !b.told) {
      b.told = true;
      var lead = b.win[0] >= b.win[1] ? 0 : 1;
      log('Battle near ' + placeName(b.x, b.y) + ': ' + COL[lead].name + ' is winning, ' + b.n + ' ants down', lead);
    } else if (b.n === 1 && calm('duel', 14)) {
      log((/^[AEIOU]/.test(COL[by.col].name) ? 'An ' : 'A ') + COL[by.col].name + ' ' + CASTE[by.caste] + ' won a duel near ' + placeName(an.x, an.y), by.col);
    }
  }

  function raid(cid) {
    var foe = 1 - cid, targets = nests.filter(function (n) { return n.owner === foe; }), own = nests.filter(function (n) { return n.owner === cid; });
    if (!targets.length || !own.length) return false;
    var t = weighted(targets, targets.map(function (n) {
      var d = Math.min.apply(null, own.map(function (o) { return dist(o.x, o.y, n.x, n.y); }));
      return (n.home ? .35 : 1) * (onScreen(n.x, n.y, 200) ? 2 : 1) / (1 + (d / 300) * (d / 300));
    }));
    function ready(a) { return a.col === cid && !a.dead && !a.foe && a.fl <= 0 && a.caste !== 'q' && dist(a.x, a.y, t.x, t.y) < 1500; }
    var k = (lite ? 4 : 7) + (own.length <= 1 ? 2 : 0), c = COL[cid], from = nearestNest(cid, t.x, t.y);
    var squad = ants.filter(function (a) { return ready(a) && a.caste === 's'; }).sort(byDist(t.x, t.y)).slice(0, k);
    /* not enough soldiers close by: the nearest friendly nest hatches a war party from the food store */
    while (squad.length < Math.min(k, 5) && c.food >= 3) {
      c.food -= 3;
      var w = makeAnt(cid, 's', from.x, from.y);
      w.home = w.inNest = from; w.alpha = 0;
      squad.push(w);
    }
    if (squad.length < 3) squad = squad.concat(ants.filter(function (a) { return ready(a) && a.caste === 'w' && !a.carry; }).sort(byDist(t.x, t.y)).slice(0, 5 - squad.length));
    if (squad.length < 2) return false;
    squad.forEach(function (a) {
      if (a.hidden) { var n0 = a.inNest || a.home; a.hidden = false; a.x = n0.x; a.y = n0.y; a.alpha = 0; }
      detach(a); a.raid = t; a.raidUntil = now + 100; a.job = raidJob(t);
    });
    ants.forEach(function (a) {
      if (a.col === foe && a.caste === 's' && !a.dead && !a.foe && !a.hidden && dist(a.x, a.y, t.x, t.y) < 650) { detach(a); a.job = guardJob(t); }
    });
    t.alarm = 1;
    log(COL[cid].name + ' soldiers march on the ' + COL[foe].name + ' nest in ' + t.name, cid);
    return true;
  }
  function watchNests(dt) {
    nests.forEach(function (n) {
      var own = 0, foe = 0;
      ants.forEach(function (a) {
        if (a.dead || a.hidden || a.caste === 'q') return;
        var d = dist(a.x, a.y, n.x, n.y);
        if (a.col === n.owner) { if (d < 70 && a.flee <= 0) own++; } else if (d < 46) foe++;
      });
      /* a fresh alarm at the door: soldiers nearby rush home to guard it */
      if (foe && n.alarm < .5) ants.forEach(function (a) {
        if (a.col === n.owner && a.caste === 's' && !a.dead && !a.hidden && !a.foe && !(a.job && a.job.k === 'raid') && dist(a.x, a.y, n.x, n.y) < 480) { detach(a); a.job = guardJob(n); a.job.rush = 1; a.job.R = rand(14, 30); }
      });
      n.alarm = foe ? 1 : Math.max(0, n.alarm - dt * .5);
      if (n.flash > 0) n.flash = Math.max(0, n.flash - dt);
      if (foe) {
        /* intruders at the door: everyone inside pours out */
        ants.forEach(function (a) { if (a.hidden && a.inNest === n && a.col === n.owner && a.caste !== 'q' && a.hideT > .4) a.hideT = rand(0, .4); });
      }
      if (n.home) { n.cap = 0; return; }
      /* raiders who outnumber the defenders two to one take the nest after a few seconds */
      if (foe >= 2 && foe >= own * 2) { n.capBy = 1 - n.owner; n.cap += dt / 3; if (n.cap >= 1) capture(n, n.capBy); }
      else n.cap = Math.max(0, n.cap - dt / 2);
    });
  }
  function capture(n, cid) {
    var prev = n.owner;
    n.owner = cid; n.cap = 0; n.flash = 1.2; n.loot = []; n.size = Math.max(1, n.size * .7);
    stats.captures++;
    ring(n.x, n.y, 4, 80, 1.2, COL[cid].line, 2.2);
    ants.forEach(function (a) {
      if (a.dead) return;
      if (a.col === prev && (a.home === n || a.inNest === n)) { a.home = nearestNest(prev, n.x, n.y); if (a.hidden) a.hideT = rand(0, 1); }
      if (a.col === cid && dist(a.x, a.y, n.x, n.y) < 120) a.home = n;
    });
    trails = trails.filter(function (t) { return t.n !== n; });
    log(COL[cid].name + ' captured the nest in ' + n.name + ' from ' + COL[prev].name, cid);
  }
  function colonies(dt) {
    COL.forEach(function (c) {
      var owned = nests.filter(function (n) { return n.owner === c.id; }), pop = 0, sold = 0, scouts = 0, room = 0;
      ants.forEach(function (a) { if (a.col === c.id && !a.dead && a.caste !== 'q') { pop++; if (a.caste === 's') sold++; else if (a.caste === 'c') scouts++; } });
      owned.forEach(function (n) { room += n.size - 1; });
      c.pop = pop; c.sold = sold; c.scouts = scouts; c.work = pop - sold - scouts; c.nests = owned.length; c.size = room + owned.length;
      c.food += dt * (owned.length <= 1 ? .7 : .35);
      c.spawn -= dt;
      if (c.spawn > 0) return;
      c.spawn = rand(2, 3.6) * (owned.length <= 1 ? .55 : 1);
      if (pop >= Math.min(MAX_POP, 4 + PER_NEST * owned.length + Math.floor(room * 3)) || c.food < 2 || !owned.length) return;
      c.food -= 2;
      var vis = owned.filter(function (n) { return onScreen(n.x, n.y, 100); });
      var n = vis.length && Math.random() < .5 ? pick(vis) : pick(owned);
      var an = makeAnt(c.id, sold / Math.max(1, pop) < .27 ? 's' : scouts / Math.max(1, pop) < .13 ? 'c' : 'w', n.x, n.y);
      an.home = an.inNest = n; an.alpha = 0;
      an.job = { k: 'emerge', t: .9, a: rand(0, TAU), n: n };
    });
    /* the fallen fade away; keep the page from filling up with bodies */
    var dead = ants.filter(function (a) { return a.dead > 0 && !a.gone; });
    if (dead.length > 40) dead.slice(0, dead.length - 40).forEach(function (a) { a.gone = true; });
    ants = ants.filter(function (a) { return !a.gone && a.dead < 34; });
  }

  /* ------------------------------------------------------------------
     Events: rain, sugar, feasts, raids, the queen's walk
     ------------------------------------------------------------------ */
  function startRain() {
    if (rain) return;
    rain = { id: ++uid, t: 0, dur: rand(7, 9), want: phone ? 2 : 2 + ((Math.random() * 3) | 0), made: 0, next: 1 };
    log('A rain shower rolls over the page. Puddles are forming', 'w');
  }
  function stepRain(dt) {
    if (rain) {
      rain.t += dt;
      var n = (lite ? 70 : 150) * clamp(Math.min(rain.t / 1.2, (rain.dur - rain.t) / 1.5), 0, 1) * dt;
      for (; n > 0; n--) if (n >= 1 || Math.random() < n) drops.push({ x: rand(-40, VW + 80), y: rand(-60, -10), vy: rand(900, 1250), vx: -rand(60, 110), g: rand(VH * .05, VH), L: rand(9, 17) });
      if (rain.made < rain.want && rain.t > rain.next) { rain.next += rand(.9, 1.8); rain.made++; makePuddle(); }
      if (rain.t >= rain.dur) rain = null;
    }
    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.y < d.g) continue;
      drops.splice(i, 1);
      var X = d.x + sx, Y = d.g + sy;
      ring(X, Y, .5, rand(3, 6), .45, 'water', .8);
      around(X, Y, 8, function (a) { if (!a.surf && !a.foe) { a.x += rand(-3, 3); a.y += rand(-3, 3); a.pause = Math.max(a.pause, .25); } });
    }
  }
  function makePuddle(x, y, R) {
    if (x == null) {
      var vis = ants.filter(function (a) { return !a.dead && !a.hidden && onScreen(a.x, a.y, -40); });
      if (vis.length && Math.random() < .6) { var a = pick(vis); x = a.x + rand(-30, 30); y = a.y + rand(-30, 30); }
      else { x = sx + rand(60, VW - 60); y = sy + rand(VH * .25, VH * .85); }
    }
    if (puddles.length >= 8) puddles.shift();
    puddles.push({ x: x, y: y, R: R || (phone ? rand(20, 36) : rand(28, 56)), r: 0, age: 0, life: rand(40, 58), alpha: 1, p1: rand(0, TAU), p2: rand(0, TAU), p3: rand(0, TAU) });
  }
  function stepPuddles(dt) {
    puddles = puddles.filter(function (p) {
      p.age += dt;
      var grow = clamp(p.age / 2.5, 0, 1), fade = clamp((p.life - p.age) / 8, 0, 1);
      p.r = p.R * (1 - Math.pow(1 - grow, 3)) * (.35 + .65 * fade);
      p.alpha = fade;
      return p.age < p.life;
    });
  }
  function shapeR(p, a) { return p.r * (1 + .13 * Math.sin(3 * a + p.p1) + .07 * Math.sin(5 * a + p.p2) + .04 * Math.sin(7 * a + p.p3)); }
  function inWater(x, y) {
    for (var i = 0; i < puddles.length; i++) {
      var p = puddles[i], dx = x - p.x, dy = y - p.y, dd = dx * dx + dy * dy;
      if (dd < p.r * p.r * 1.6 && Math.sqrt(dd) < shapeR(p, Math.atan2(dy, dx))) return p;
    }
    return null;
  }
  function recruit(cid, x, y, k, filter) {
    return ants.filter(function (a) {
      return a.col === cid && a.caste !== 'q' && !a.dead && !a.hidden && !a.carry && !a.foe && a.fl <= 0 && dist(a.x, a.y, x, y) < 1000 && (!filter || filter(a));
    }).sort(byDist(x, y)).slice(0, k);
  }
  function dropSugar(x, y) {
    var f = { k: 'sugar', x: x, y: y, n: 16, n0: 16, rot: rand(-.4, .4) };
    foods.push(f);
    if (foods.length > 10) foods.shift();
    ring(x, y, 2, 16, .6, PAL.queen, 1.2);
    COL.forEach(function (c) { recruit(c.id, x, y, lite ? 4 : 7).forEach(function (a) { detach(a); a.job = foodJob(f); }); });
    if (calm('sugar', 6)) log('Sugar! Both colonies smell it', 's');
  }
  function feast() {
    var vis = surfs.filter(function (s) { return s.alive && /btn|card|chip|img/.test(s.kind) && onScreen(s.x + s.w / 2, s.y + s.h / 2, -30) && canBite(s); });
    if (!vis.length) return false;
    var s = pick(vis), cx = s.x + s.w / 2, cy = s.y + s.h / 2, cid = Math.random() < .5 ? 0 : 1;
    var crew = recruit(cid, cx, cy, lite ? 4 : 6, function (a) { return a.caste === 'w'; });
    if (crew.length < 2) return false;
    crew.forEach(function (a) { detach(a); patrolJob(a, .55, s); });
    log(COL[cid].name + ' workers swarm ' + label(s.el), cid);
    return true;
  }
  function queenWalk(cid) {
    var c = COL[cid], q = c.queen;
    if (!q || !q.hidden || q.dead) return false;
    var n = c.homeN;
    q.home = q.inNest = n; q.hidden = false; q.x = n.x; q.y = n.y; q.alpha = 0; q.hp = q.maxHp;
    q.job = { k: 'stroll', n: n, t: 16, ang: rand(0, TAU) };
    recruit(cid, n.x, n.y, 4, function (a) { return a.caste === 'w'; }).forEach(function (a, i) { detach(a); a.job = { k: 'attend', q: q, t: 16, o: PI * .6 + i * PI * .27 }; });
    log('The ' + c.name + ' queen is taking a walk near ' + n.name, cid);
    return true;
  }
  function attacker() {
    var a = COL[0].nests, b = COL[1].nests;
    if (a === b) return Math.random() < .5 ? 0 : 1;
    var under = a < b ? 0 : 1;
    return Math.random() < .7 ? under : 1 - under;
  }
  function director() {
    if (now > next.feast) { next.feast = now + rand(22, 40); feast(); }
    if (now > next.raid) { next.raid = now + rand(32, 55); raid(attacker()); }
    if (now > next.rain) { next.rain = now + rand(75, 130); startRain(); }
    if (now > next.queen) { next.queen = now + rand(60, 110); queenWalk(Math.random() < .5 ? 0 : 1); }
    if (now > next.fly) { next.fly = now + rand(lite ? 35 : 22, lite ? 70 : 45); if (!flyers.some(function (f) { return f.k === 'fly'; })) spawnFlyer('fly'); }
    if (now > next.drag) { next.drag = now + rand(55, 100); if (!night && !flyers.some(function (f) { return f.k === 'drag'; })) spawnFlyer('drag'); }
    if (now > next.lady) { next.lady = now + rand(30, 60); if (!flyers.some(function (f) { return f.k === 'lady'; })) spawnFlyer('lady'); }
  }

  /* ------------------------------------------------------------------
     Nature: small trees, grass, pebbles, mushrooms and flowers, drawn
     with a sumi line into sprites once, placed only where nothing else
     lives (never over text, links or buttons), plus the small creatures
     that visit them.
     ------------------------------------------------------------------ */
  var TREE_NAME = { pine: 'pine', sakura: 'sakura', bonsai: 'bonsai' };
  function seededRand(str) {
    var a = 2166136261;
    for (var i = 0; i < str.length; i++) { a ^= str.charCodeAt(i); a = Math.imul(a, 16777619); }
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rr(R, a, b) { return a + R() * (b - a); }
  function hit(b, list) {
    for (var i = 0; i < list.length; i++) { var o = list[i]; if (b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y) return true; }
    return false;
  }
  /* the best empty spot for a w by h patch, standing on a base line near the bottom of r */
  function findSpot(r, boxes, used, w, h, right, rnd, band) {
    var top = Math.max(r.y + h + 6, r.y + r.h - (band || 170), 110), bot = r.y + r.h - 4;
    if (bot < top) return null;
    var near = boxes.filter(function (o) { return o.y < bot + 4 && o.y + o.h > top - h - 4; }), best = null, bs = -1;
    var stepX = lite ? 8 : 12, span = Math.max(1, bot - top);
    for (var by = bot; by >= top; by -= 8) {
      for (var x = 6; x <= VW - w - 6; x += stepX) {
        var b = { x: x, y: by - h, w: w, h: h };
        if (hit(b, near) || hit(b, used)) continue;
        var edge = clamp(1 - Math.min(x, VW - x - w) / (VW * .28), 0, 1), side = (x + w / 2 > VW / 2) === right ? 8 : 0;
        var sc = (by - top) / span * 30 + edge * 36 + side + rnd() * 10;
        if (sc > bs) { bs = sc; best = { x: x, y: by }; }
      }
    }
    return best;
  }
  function placeScenery(secs, obs) {
    var boxes = obs.map(function (o) { return { x: o.x - 10, y: o.y - 40, w: o.w + 20, h: o.h + 52 }; });
    var used = nests.map(function (n) { return { x: n.x - 40, y: n.y - 34, w: 80, h: 64 }; });
    used.push({ x: 0, y: VH - 100, w: 100, h: 100 }); /* the ant button's corner on the first screen */
    var path = location.pathname.replace(/\/index\.html$/, '/'), out = [];
    var kinds = ['pine', 'sakura', 'bonsai'], tk = 0, off = (seededRand(path)() * 3) | 0;
    secs.forEach(function (sec, i) {
      if (out.length >= MAX_PATCH || sec === body) return;
      var r = docRect(sec), R = seededRand(path + '#' + i);
      var wantTree = R() < (lite ? .55 : .72), kind = kinds[(off + tk) % 3]; /* the three kinds take turns */
      var spec = wantTree ? treePatchSpec(R, kind) : smallPatchSpec(R);
      var spot = findSpot(r, boxes, used, spec.w, spec.h, i % 2 === 1, R);
      if (!spot && wantTree) { spec = smallPatchSpec(R); spot = findSpot(r, boxes, used, spec.w, spec.h, i % 2 === 1, R); }
      if (!spot) return;
      if (spec.tree) tk++;
      var p = { sec: sec, rx: spot.x - r.x, ry: spot.y - r.y, x: spot.x, y: spot.y, w: spec.w, h: spec.h, spec: spec, sprite: null, tree: null, flowers: [] };
      if (spec.tree) p.tree = makeTree(spec.tree.kind, spec.tree.h, spot.x + spec.tree.x, spot.y, R, p);
      out.push(p);
      used.push({ x: spot.x - 40, y: spot.y - spec.h - 40, w: spec.w + 80, h: spec.h + 80 });
    });
    patches = out;
    trees = patches.filter(function (p) { return p.tree; }).map(function (p) { return p.tree; }).concat(planted);
    items = items.filter(function (it) { return it.state !== 'fall'; });
    paintSprites();
    anchorPatches();
  }
  function anchorPatches() {
    patches.forEach(function (p) {
      if (!p.sec.isConnected) return;
      var r = docRect(p.sec);
      p.x = r.x + p.rx; p.y = r.y + p.ry;
      if (p.tree) { p.tree.x = p.x + p.spec.tree.x; p.tree.y = p.y; }
      p.flowers = p.spec.parts.filter(function (q) { return q.k === 'flower'; }).map(function (q) { return { x: p.x + q.x, y: p.y - q.h }; });
    });
  }
  /* ---------- patch recipes (local coordinates, base line at y = 0) ---------- */
  function smallParts(R, x0, x1, k) {
    var parts = [], x = x0;
    for (var i = 0; i < k && x < x1; i++) {
      var r = R(), q;
      if (r < .4) q = { k: 'grass', x: x + 5, h: rr(R, 7, 13), n: 5 + ((R() * 4) | 0), seed: R() };
      else if (r < .6) q = { k: 'pebble', x: x + 5, n: 1 + ((R() * 3) | 0), seed: R() };
      else if (r < .8) q = { k: 'flower', x: x + 4, h: rr(R, 9, 15), c: (R() * 3) | 0, n: 1 + ((R() * 2) | 0), seed: R() };
      else q = { k: 'mush', x: x + 4, h: rr(R, 5, 8), red: R() < .55, n: 1 + ((R() * 2) | 0), seed: R() };
      parts.push(q);
      x += q.k === 'pebble' ? 13 : q.k === 'flower' ? 12 : 11;
    }
    return parts;
  }
  function treePatchSpec(R, kind) {
    var h = lite ? rr(R, 38, 54) : rr(R, 50, 80), tw = h * (kind === 'sakura' ? 1.05 : kind === 'pine' ? 1.1 : .9);
    var extra = rr(R, 26, 44), flip = R() < .5, w = Math.round(tw + extra);
    var tx = flip ? w - tw / 2 - 2 : tw / 2 + 2;
    var parts = smallParts(R, flip ? 2 : tw * .8, flip ? w - tw * .8 : w - 6, 3);
    parts.push({ k: 'grass', x: tx + (flip ? -1 : 1) * tw * .22, h: rr(R, 6, 10), n: 5, seed: R() });
    return { w: w, h: Math.round(h + 6), tree: { kind: kind, h: h, x: tx }, parts: parts, seed: R() };
  }
  function smallPatchSpec(R) {
    var w = Math.round(rr(R, 40, lite ? 54 : 66));
    return { w: w, h: 18, tree: null, parts: smallParts(R, 2, w - 8, 4), seed: R() };
  }
  /* ---------- trees ---------- */
  function makeTree(kind, h, x, y, R, patch) {
    var tr = { kind: kind, h: h, x: x, y: y, sway: 0, ph: R() * TAU, grow: 1, alive: true, drop: rr(R, 2, 8), patch: patch, planted: !patch, sprite: null, seed: R() };
    tr.geo = treeGeo(kind, h, seededRand('t' + tr.seed));
    tr.paths = tr.geo.paths;
    return tr;
  }
  function bez(p0, p1, p2, t) { var u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; }
  function treeGeo(kind, h, R) {
    var g = { kind: kind, h: h, trunk: [], limbs: [], pads: [], blooms: [], paths: [], crown: [], pot: null };
    var base = 0, lean = (R() < .5 ? -1 : 1) * h * rr(R, .06, kind === 'pine' ? .2 : .15);
    if (kind === 'bonsai') {
      var pw = h * .62, ph = h * .15;
      g.pot = { w: pw, h: ph };
      base = -ph;
    }
    var topY = kind === 'sakura' ? -h * .52 : -h * .8;
    var c0 = [0, base], c1 = [kind === 'bonsai' ? -lean * 1.4 : -lean * .8, base + (topY - base) * .55], c2 = [lean, topY];
    var W0 = h * (kind === 'bonsai' ? .1 : kind === 'sakura' ? .075 : .068);
    for (var i = 0; i <= 8; i++) { var t = i / 8, p = bez(c0, c1, c2, t); g.trunk.push([p[0], p[1], W0 * (1 - t * .68)]); }
    var tp = g.trunk.map(function (q) { return [q[0], q[1]]; });
    function pathTo(idx, end) {
      var pts = [];
      if (g.pot) { pts.push([g.pot.w * .46, 0], [g.pot.w * .5, -g.pot.h], [W0 * .6, -g.pot.h]); }
      else pts.push([W0 * .4, 0]);
      for (var k = 1; k <= idx; k++) pts.push(tp[k]);
      pts.push(end);
      return pts;
    }
    if (kind === 'sakura') {
      var n = 3, side = R() < .5 ? -1 : 1;
      for (var k = 0; k < n; k++) {
        var from = tp[8], ang = -HALF + (k - 1) * .75 + (R() - .5) * .3, len = h * rr(R, .28, .4);
        var end = [from[0] + Math.cos(ang) * len * 1.15, from[1] + Math.sin(ang) * len * .8];
        var mid = [(from[0] + end[0]) / 2 + side * h * .04, (from[1] + end[1]) / 2 + h * .03];
        g.limbs.push({ a: from, b: mid, c: end, w: W0 * .5 });
        g.crown.push({ x: end[0], y: end[1], r: h * rr(R, .17, .22) });
        g.paths.push(pathTo(8, end));
        side = -side;
      }
      g.crown.push({ x: tp[8][0], y: tp[8][1] - h * .3, r: h * .2 });
      g.crown.forEach(function (c) {
        for (var q = 0; q < 20; q++) {
          var a = R() * TAU, d = Math.sqrt(R()) * c.r;
          g.blooms.push({ x: c.x + Math.cos(a) * d * 1.2, y: c.y + Math.sin(a) * d * .85, r: h * rr(R, .028, .052), c: R() < .5 ? 0 : 1 });
        }
      });
      g.blooms.sort(function (a, b) { return a.y - b.y; });
    } else {
      /* pine and bonsai: cloud-pad foliage on short branches */
      var sides = R() < .5 ? [-1, 1, -1] : [1, -1, 1], nb = kind === 'bonsai' ? 2 : 2 + (R() < .6 ? 1 : 0);
      var ats = kind === 'bonsai' ? [4, 6] : nb === 3 ? [3, 5, 6] : [3 + ((R() * 2) | 0), 6];
      for (var b = 0; b < nb; b++) {
        var at = ats[b], s = tp[at], sd = sides[b], L = h * rr(R, .2, .34) * (kind === 'bonsai' ? 1.1 : 1) * (1 - b * .12);
        var e = [s[0] + sd * L, s[1] - L * rr(R, -.05, .3)];
        g.limbs.push({ a: s, b: [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2 + h * .03], c: e, w: W0 * .38 });
        var rx = h * rr(R, .15, .21);
        g.pads.push({ x: e[0], y: e[1], rx: rx, ry: rx * .44, seed: R() });
        g.paths.push(pathTo(Math.min(7, at), [e[0], e[1] - rx * .3]));
      }
      var top = tp[8], trx = h * rr(R, .16, .2);
      g.pads.push({ x: top[0], y: top[1] - trx * .15, rx: trx, ry: trx * .5, seed: R() });
      g.paths.push(pathTo(8, [top[0], top[1] - trx * .45]));
      g.pads.sort(function (a, b) { return a.y - b.y; });
      g.pads.forEach(function (p) { g.crown.push({ x: p.x, y: p.y, r: p.rx * .8 }); });
    }
    return g;
  }
  /* the sprite canvas for a tree or a patch, sized in CSS px around an anchor point */
  function sprite(w, h) {
    var c = doc.createElement('canvas');
    c.width = Math.ceil(w * DPR); c.height = Math.ceil(h * DPR);
    var x = c.getContext('2d');
    x.scale(DPR, DPR); x.lineCap = 'round'; x.lineJoin = 'round';
    return { c: c, x: x, w: w, h: h };
  }
  function paintSprites() {
    patches.forEach(paintPatch);
    trees.forEach(paintTree);
  }
  function paintTree(tr) {
    var g = tr.geo, h = g.h, W = h * 1.5, H = h * 1.25, sp = sprite(W, H), x = sp.x, i;
    tr.sprite = sp; tr.ax = W / 2; tr.ay = H - 4;
    x.translate(tr.ax, tr.ay);
    x.strokeStyle = PAL.inkL; x.lineWidth = .9;
    if (g.pot) {
      var pw = g.pot.w, ph = g.pot.h;
      x.fillStyle = PAL.pot;
      x.beginPath(); x.moveTo(-pw / 2, -ph); x.lineTo(pw / 2, -ph); x.lineTo(pw / 2 - ph * .35, -ph * .15); x.lineTo(-pw / 2 + ph * .35, -ph * .15); x.closePath(); x.fill(); x.stroke();
      x.beginPath(); x.rect(-pw / 2 + ph * .5, -ph * .2, ph * .45, ph * .2); x.rect(pw / 2 - ph * .95, -ph * .2, ph * .45, ph * .2); x.fillStyle = PAL.inkL; x.fill();
      x.globalAlpha = .35; x.strokeStyle = PAL.stem; x.beginPath(); x.moveTo(-pw / 2 + 2, -ph + 1.6); x.lineTo(pw / 2 - 2, -ph + 1.6); x.stroke();
      x.globalAlpha = 1; x.strokeStyle = PAL.inkL;
      x.fillStyle = PAL.mound2; x.beginPath(); x.ellipse(0, -ph, pw * .42, 1.6, 0, 0, TAU); x.fill();
    }
    /* limbs, then the tapered trunk over them */
    g.limbs.forEach(function (l) {
      x.strokeStyle = PAL.inkL; x.lineWidth = l.w + 1.4;
      x.beginPath(); x.moveTo(l.a[0], l.a[1]); x.quadraticCurveTo(l.b[0], l.b[1], l.c[0], l.c[1]); x.stroke();
      x.strokeStyle = PAL.bark; x.lineWidth = l.w;
      x.beginPath(); x.moveTo(l.a[0], l.a[1]); x.quadraticCurveTo(l.b[0], l.b[1], l.c[0], l.c[1]); x.stroke();
    });
    var L = [], Rt = [], T = g.trunk;
    for (i = 0; i < T.length; i++) {
      var p = T[i], q = T[Math.min(T.length - 1, i + 1)], o = T[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / d, ny = dx / d, w = p[2] / 2 * (i === 0 ? 1.35 : 1);
      L.push([p[0] + nx * w, p[1] + ny * w]); Rt.push([p[0] - nx * w, p[1] - ny * w]);
    }
    x.beginPath(); x.moveTo(L[0][0], L[0][1]);
    for (i = 1; i < L.length; i++) x.lineTo(L[i][0], L[i][1]);
    for (i = Rt.length - 1; i >= 0; i--) x.lineTo(Rt[i][0], Rt[i][1]);
    x.closePath(); x.fillStyle = PAL.bark; x.fill(); x.lineWidth = .9; x.strokeStyle = PAL.inkL; x.stroke();
    /* bark: a few dry-brush marks */
    x.globalAlpha = .45; x.lineWidth = .6; x.beginPath();
    for (i = 2; i < T.length - 2; i += 2) { x.moveTo(T[i][0] - T[i][2] * .2, T[i][1]); x.lineTo(T[i + 1][0] - T[i][2] * .1, T[i + 1][1] + 1.5); }
    x.stroke(); x.globalAlpha = 1;
    if (g.kind === 'sakura') {
      /* a soft wash under the blossom, then the flowers dabbed on top */
      x.globalAlpha = .35; x.fillStyle = PAL.bloom;
      g.crown.forEach(function (c) { x.beginPath(); x.ellipse(c.x, c.y, c.r * 1.15, c.r * .8, 0, 0, TAU); x.fill(); });
      x.globalAlpha = .92;
      g.blooms.forEach(function (b) {
        x.fillStyle = b.c ? PAL.bloom2 : PAL.bloom;
        x.beginPath(); x.arc(b.x, b.y, b.r, 0, TAU); x.fill();
      });
      x.globalAlpha = .4; x.strokeStyle = PAL.inkL; x.lineWidth = .55;
      g.crown.forEach(function (c) { x.beginPath(); x.ellipse(c.x, c.y, c.r * 1.15, c.r * .8, 0, PI * 1.1, PI * 1.9); x.stroke(); });
      x.globalAlpha = .9; x.fillStyle = PAL.pot;
      g.blooms.forEach(function (b, k) { if (k % 4 === 1) { x.beginPath(); x.arc(b.x + b.r * .2, b.y + b.r * .1, Math.max(.5, b.r * .22), 0, TAU); x.fill(); } });
      x.globalAlpha = 1;
    } else {
      g.pads.forEach(function (p) {
        var R = seededRand('p' + p.seed), n = 4 + ((R() * 2) | 0), k;
        x.fillStyle = PAL.leaf2;
        x.beginPath(); x.ellipse(p.x, p.y + p.ry * .35, p.rx * 1.02, p.ry * .85, 0, 0, TAU); x.fill();
        x.fillStyle = PAL.leaf;
        x.beginPath();
        for (k = 0; k < n; k++) {
          var lx = p.x - p.rx + (k + .5) * (2 * p.rx / n), lr = p.rx / n * 1.35, ly = p.y - p.ry * .1 - Math.sin((k + .5) / n * PI) * p.ry * .45;
          x.moveTo(lx + lr, ly); x.ellipse(lx, ly, lr, lr * .8, 0, 0, TAU);
        }
        x.fill();
        x.beginPath(); x.ellipse(p.x, p.y + p.ry * .1, p.rx, p.ry * .7, 0, 0, TAU); x.fill();
        x.strokeStyle = PAL.inkL; x.lineWidth = .8;
        for (k = 0; k < n; k++) {
          var ax = p.x - p.rx + (k + .5) * (2 * p.rx / n), ar = p.rx / n * 1.35, ay = p.y - p.ry * .1 - Math.sin((k + .5) / n * PI) * p.ry * .45;
          x.beginPath(); x.ellipse(ax, ay, ar, ar * .8, 0, PI * 1.08, PI * 1.92); x.stroke();
        }
        x.beginPath(); x.ellipse(p.x, p.y + p.ry * .15, p.rx * .98, p.ry * .72, 0, .15, PI - .15); x.stroke();
        x.globalAlpha = .55; x.strokeStyle = PAL.leaf3; x.lineWidth = .7; x.beginPath();
        for (k = 0; k < n * 2; k++) { var hx = p.x - p.rx * .8 + R() * p.rx * 1.6, hy = p.y - p.ry * .2 + R() * p.ry * .5; x.moveTo(hx, hy); x.lineTo(hx + 1.6, hy - 1.4); }
        x.stroke(); x.globalAlpha = 1;
      });
    }
  }
  function paintPatch(p) {
    var pad = 6, sp = sprite(p.w + pad * 2, p.h + pad + 6), x = sp.x;
    p.sprite = sp; p.ax = pad; p.ay = p.h + pad;
    x.translate(p.ax, p.ay);
    var R = seededRand('g' + p.spec.seed);
    /* ground: a soft shadow and one dry brush stroke */
    x.fillStyle = PAL.dust; x.globalAlpha = .45;
    x.beginPath(); x.ellipse(p.w / 2, 1, p.w * .5, 2.4, 0, 0, TAU); x.fill();
    x.globalAlpha = .7; x.strokeStyle = PAL.mound2; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(2, 1);
    for (var gx = 2; gx <= p.w - 2; gx += 6) x.lineTo(gx, 1 + (R() - .5) * 1.1);
    x.stroke();
    x.globalAlpha = .6; x.fillStyle = PAL.mound2;
    for (var k = 0; k < p.w / 7; k++) x.fillRect(R() * p.w, 2 + R() * 2, .9, .9);
    x.globalAlpha = 1;
    p.spec.parts.forEach(function (q) { drawPart2(x, q); });
  }
  function drawPart2(x, q) {
    var R = seededRand('q' + q.seed), i;
    x.strokeStyle = PAL.inkL; x.lineWidth = .8;
    if (q.k === 'grass') {
      for (i = 0; i < q.n; i++) {
        var bx = q.x + (i - q.n / 2) * 1.6, lean = (i - q.n / 2) * 1.4 + (R() - .5) * 2, bh = q.h * rr(R, .55, 1);
        x.strokeStyle = i % 2 ? PAL.grass : PAL.leaf2; x.lineWidth = 1.1;
        x.beginPath(); x.moveTo(bx, 0); x.quadraticCurveTo(bx + lean * .3, -bh * .6, bx + lean, -bh); x.stroke();
      }
    } else if (q.k === 'pebble') {
      for (i = 0; i < q.n; i++) {
        var px = q.x + i * 4.5, rx = rr(R, 2.4, 4.4), ry = rx * rr(R, .55, .7);
        x.fillStyle = PAL.stone; x.beginPath(); x.ellipse(px, -ry + .6, rx, ry, (R() - .5) * .4, 0, TAU); x.fill();
        x.globalAlpha = .55; x.stroke(); x.globalAlpha = .5;
        x.fillStyle = PAL.stem; x.beginPath(); x.ellipse(px - rx * .3, -ry * 1.25 + .6, rx * .35, ry * .22, 0, 0, TAU); x.fill();
        x.globalAlpha = 1;
      }
    } else if (q.k === 'flower') {
      for (i = 0; i < q.n; i++) {
        var fx = q.x + i * 5, fh = q.h * (i ? .72 : 1), sw = (R() - .5) * 3;
        x.strokeStyle = PAL.leaf2; x.lineWidth = .9;
        x.beginPath(); x.moveTo(fx, 0); x.quadraticCurveTo(fx + sw, -fh * .5, fx + sw * .6, -fh); x.stroke();
        x.fillStyle = PAL.leaf; x.beginPath(); x.ellipse(fx + 1.8, -fh * .35, 2, .9, -.5, 0, TAU); x.fill();
        var cx = fx + sw * .6, cy = -fh, pr = 1.55;
        x.fillStyle = PAL.petals[q.c];
        x.beginPath();
        for (var k = 0; k < 5; k++) { var a = k / 5 * TAU - HALF; x.moveTo(cx + Math.cos(a) * pr * 1.3 + pr, cy + Math.sin(a) * pr * 1.3); x.arc(cx + Math.cos(a) * pr * 1.3, cy + Math.sin(a) * pr * 1.3, pr, 0, TAU); }
        x.fill(); x.globalAlpha = .6; x.lineWidth = .5; x.stroke(); x.globalAlpha = 1;
        x.fillStyle = q.c === 0 ? PAL.pot : PAL.queen; x.beginPath(); x.arc(cx, cy, .9, 0, TAU); x.fill();
      }
    } else if (q.k === 'mush') {
      for (i = 0; i < q.n; i++) {
        var mx = q.x + i * 5.5, mh = q.h * (i ? .7 : 1), cw = mh * .75;
        x.fillStyle = PAL.stem; x.beginPath(); x.moveTo(mx - cw * .22, 0); x.lineTo(mx - cw * .16, -mh * .8); x.lineTo(mx + cw * .16, -mh * .8); x.lineTo(mx + cw * .24, 0); x.closePath(); x.fill(); x.lineWidth = .6; x.stroke();
        x.fillStyle = q.red ? PAL.cap : PAL.bark; x.lineWidth = .8;
        x.beginPath(); x.moveTo(mx - cw, -mh * .72); x.quadraticCurveTo(mx - cw * .9, -mh * 1.35, mx, -mh * 1.3); x.quadraticCurveTo(mx + cw * .9, -mh * 1.35, mx + cw, -mh * .72); x.closePath(); x.fill(); x.stroke();
        if (q.red) { x.fillStyle = PAL.stem; x.beginPath(); x.arc(mx - cw * .4, -mh * 1.02, .8, 0, TAU); x.arc(mx + cw * .3, -mh * 1.12, .7, 0, TAU); x.arc(mx + cw * .05, -mh * .9, .6, 0, TAU); x.fill(); }
      }
    }
  }
  /* planting: a small tree grows out of the ground over a few seconds */
  function plantTree(x, y, kind) {
    var R = seededRand('plant' + (++uid) + Math.random());
    kind = kind || pick(['pine', 'sakura', 'bonsai']);
    var h = lite ? rr(R, 36, 50) : rr(R, 46, 66);
    var tr = makeTree(kind, h, clamp(x, h * .6, VW - h * .6), clamp(y, 40, DH - 4), R, null);
    tr.grow = 0.02;
    tr.ground = { k: 'grass', x: 0, h: 7, n: 6, seed: R() };
    paintTree(tr);
    planted.push(tr); trees.push(tr);
    if (planted.length > MAX_PLANTED) { var old = planted.shift(); old.alive = false; trees.splice(trees.indexOf(old), 1); }
    ring(tr.x, tr.y, 2, 24, .8, PAL.leaf, 1.2);
    crumbs(tr.x, tr.y, PAL.mound2, 4);
    log('A little ' + TREE_NAME[kind] + ' was planted near ' + placeName(tr.x, tr.y) + '. The scouts noticed', '');
    return tr;
  }
  /* the keyboard has no pointer: find an empty spot on screen instead */
  function freeSpot(w, h) {
    var r = { x: 0, y: sy + 60, w: VW, h: VH - 60 - (phone ? 90 : 20) };
    var boxes = obsCache.map(function (o) { return { x: o.x - 8, y: o.y - 8, w: o.w + 16, h: o.h + 16 }; });
    var used = trees.map(function (t) { return { x: t.x - t.h * .6, y: t.y - t.h, w: t.h * 1.2, h: t.h }; });
    return findSpot(r, boxes, used, w, h, Math.random() < .5, Math.random, VH);
  }
  function stepTrees(dt) {
    for (var i = 0; i < trees.length; i++) {
      var tr = trees[i];
      if (tr.grow < 1) tr.grow = Math.min(1, tr.grow + dt / (still ? .01 : 3.2));
      tr.sway = still ? 0 : (Math.sin(now * .9 + tr.ph) * .016 + Math.sin(now * 2.2 + tr.ph * 1.7) * .005) * tr.grow;
      if (tr.grow < 1 || !onScreen(tr.x, tr.y - tr.h / 2, 60)) continue;
      tr.drop -= dt;
      if (tr.drop > 0 || items.length >= MAX_ITEMS) continue;
      tr.drop = tr.kind === 'sakura' ? rand(4, 9) : rand(7, 15);
      var c = pick(tr.geo.crown), p = treePt(tr, [c.x + rand(-c.r, c.r) * .7, c.y + rand(-c.r, c.r) * .4]);
      var petal = tr.kind === 'sakura' && Math.random() < .8;
      dropItem(petal ? 'petal' : 'leaf', p.x, p.y, tr.y + rand(-2, 8), petal ? (Math.random() < .5 ? PAL.bloom : PAL.bloom2) : Math.random() < .7 ? PAL.leaf : PAL.leaf3);
    }
  }
  /* ---------- leaves and petals: they flutter down, lie a while, and get carried off ---------- */
  function dropItem(k, x, y, gy, c) {
    var leaf = k === 'leaf', s = leaf ? rand(8, 11.5) : rand(4, 5.5);
    var it = { item: true, k: k, x: x, y: y, gy: Math.max(gy, y), c: c || PAL.leaf, s: s, need: leaf ? (s > 10.8 ? 3 : 2) : 1, crew: [], col: null, n: 1, state: 'fall', t: 0, life: rand(45, 70), rot: rand(0, TAU), dir: 0, sp: 0, ph: rand(0, TAU), home: null };
    if (items.length >= MAX_ITEMS) { var idx = -1; items.forEach(function (o, i) { if (idx < 0 && o.state === 'ground' && !o.crew.length) idx = i; }); if (idx < 0) return null; items.splice(idx, 1); }
    items.push(it);
    return it;
  }
  function stepItems(dt) {
    items = items.filter(function (it) {
      it.t += dt;
      if (it.state === 'gone' || it.n <= 0) return false;
      if (it.state === 'fall') {
        var vy = it.k === 'leaf' ? 26 : 20;
        it.y += vy * dt * (still ? 2 : 1);
        if (!still) { it.x += Math.sin(it.t * 2.2 + it.ph) * 22 * dt; it.rot += Math.sin(it.t * 1.7 + it.ph) * 2.2 * dt; }
        if (it.y >= it.gy) { it.y = it.gy; it.state = 'ground'; it.t = 0; }
        return true;
      }
      it.crew = it.crew.filter(function (a) { return !a.dead && !a.hidden && a.fl <= 0 && !a.foe && a.flee <= 0 && a.job && a.job.k === 'haul' && a.job.it === it; });
      if (!it.crew.length) it.col = null;
      if (it.state === 'carried' && it.crew.length < it.need) { it.state = 'ground'; it.t = 0; }
      if (it.state === 'ground') {
        if (it.crew.length >= it.need) {
          it.state = 'carried'; it.home = nearestNest(it.col, it.x, it.y);
          it.dir = Math.atan2(it.home.y - it.y, it.home.x - it.x);
          if (calm('haul', 14)) log(it.crew.length + ' ' + COL[it.col].name + ' workers are carrying a leaf home together', it.col);
          return true;
        }
        return it.crew.length > 0 || it.t < it.life;
      }
      /* carried: the team walks it home, a little slower than one ant, weaving as they argue */
      var n = it.home;
      if (!n || n.owner !== it.col) { n = it.home = nearestNest(it.col, it.x, it.y); }
      var want = Math.atan2(n.y - it.y, n.x - it.x) + Math.sin(it.t * 1.3 + it.ph) * .35;
      it.dir += clamp(angDiff(want, it.dir), -2 * dt, 2 * dt);
      it.sp = 15 * SPD * (inWater(it.x, it.y) ? .5 : 1) * (.8 + .2 * Math.sin(it.t * 3));
      it.x += Math.cos(it.dir) * it.sp * dt; it.y += Math.sin(it.dir) * it.sp * dt;
      it.rot += Math.sin(it.t * 2 + it.ph) * .3 * dt;
      for (var k = 0; k < it.crew.length; k++) phAdd(it.col, it.crew[k].x, it.crew[k].y, dt * .5);
      if (dist(it.x, it.y, n.x, n.y) > 7) return true;
      /* home: the leaf goes down into the nest */
      COL[it.col].food += it.need * 2;
      grow(n, it.need * 3);
      it.crew.forEach(function (a) { a.home = a.inNest = n; a.hidden = true; a.hideT = rand(1.5, 5); a.job = null; a.surf = null; a.alpha = 1; });
      addTrail(it.col, n, { k: 'food', f: it });
      stats.leaves++;
      if (calm('leafhome', 20)) log('A leaf reached the ' + COL[it.col].name + ' nest in ' + n.name, it.col);
      it.n = 0;
      return false;
    });
  }
  function drawLeaf(x, y, rot, s, c, al) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.quadraticCurveTo(0, -s * .42, s / 2, 0); ctx.quadraticCurveTo(0, s * .42, -s / 2, 0); ctx.fill();
    ctx.strokeStyle = PAL.inkL; ctx.lineWidth = .6; ctx.globalAlpha = al * .8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s / 2 - 1.2, 0); ctx.lineTo(s * .35, 0); ctx.stroke();
    ctx.restore();
  }
  function drawPetal(x, y, rot, s, c, al) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = al;
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.quadraticCurveTo(-s * .1, -s * .55, s / 2, -s * .12); ctx.lineTo(s * .32, 0); ctx.lineTo(s / 2, s * .12); ctx.quadraticCurveTo(-s * .1, s * .55, -s / 2, 0); ctx.fill();
    ctx.strokeStyle = PAL.inkL; ctx.lineWidth = .45; ctx.globalAlpha = al * .45; ctx.stroke();
    ctx.restore();
  }
  function drawItem(it) {
    var al = it.state === 'ground' && !it.crew.length ? clamp((it.life - it.t) / 3, 0, 1) : 1;
    if (al < .02) return;
    var y = it.y - (it.state === 'carried' ? 2.5 : 0);
    if (it.k === 'leaf') drawLeaf(it.x, y, it.rot, it.s, it.c, al);
    else drawPetal(it.x, y, it.rot, it.s, it.c, al);
  }

  /* ---------- visitors from outside the colony: butterflies, dragonflies, ladybugs ---------- */
  function visiblePatch() {
    var c = patches.filter(function (p) { return onScreen(p.x + p.w / 2, p.y - p.h / 2, -20); });
    var t = planted.filter(function (tr) { return onScreen(tr.x, tr.y - tr.h / 2, -20); });
    return c.length ? pick(c) : t.length ? { x: t[0].x - 20, y: t[0].y, w: 40, h: t[0].h, flowers: [], tree: t[0] } : null;
  }
  function spawnFlyer(kind) {
    if (still) return false;
    var p = visiblePatch(), left = Math.random() < .5, f;
    if (kind === 'lady') {
      if (!p) return false;
      f = { k: 'lady', x: p.x + rand(4, p.w - 4), y: p.y + rand(-2, 3), a: rand(0, TAU), t: 0, T: rand(16, 26), st: 'walk', v: 7, turn: 0, base: p.y, x0: p.x - 30, x1: p.x + p.w + 30, open: 0, z: 1 };
    } else {
      var y = sy + rand(VH * .2, VH * .65);
      f = { k: kind, x: left ? sx - 30 : sx + VW + 30, y: y, a: left ? 0 : PI, t: 0, T: kind === 'fly' ? 30 : 16, st: 'fly', tx: 0, ty: 0, wp: 0, hov: 0, dir: left ? 1 : -1, seed: rand(0, 100), c: pick(PAL.wing), flower: null };
      if (kind === 'fly' && p && p.flowers.length && Math.random() < .7) f.flower = pick(p.flowers);
      nextWay(f);
    }
    flyers.push(f);
    return true;
  }
  function nextWay(f) {
    f.wp++;
    if (f.k === 'fly' && f.flower && f.wp === 2) { f.tx = f.flower.x; f.ty = f.flower.y - 2; return; }
    var gone = f.wp > (f.k === 'drag' ? 4 : 3);
    f.tx = gone ? (f.dir > 0 ? sx + VW + 60 : sx - 60) : sx + clamp((f.dir > 0 ? f.wp / 4 : 1 - f.wp / 4) * VW + rand(-VW * .12, VW * .12), 30, VW - 30);
    f.ty = gone ? sy + rand(VH * .1, VH * .5) : sy + rand(VH * .15, VH * .75);
  }
  function stepFlyers(dt) {
    flyers = flyers.filter(function (f) {
      f.t += dt;
      if (f.k === 'lady') {
        if (f.st === 'walk') {
          f.turn -= dt;
          if (f.turn <= 0) { f.turn = rand(.8, 2.4); f.want = f.a + rand(-1.2, 1.2); if (f.x < f.x0 || f.x > f.x1) f.want = f.x < f.x0 ? 0 : PI; }
          f.a += clamp(angDiff(f.want || f.a, f.a), -2 * dt, 2 * dt);
          f.x += Math.cos(f.a) * f.v * dt; f.y += Math.sin(f.a) * f.v * dt * .3;
          f.y += (f.base - f.y) * Math.min(1, dt * 2);
          if (f.t > f.T) { f.st = 'open'; f.t = 0; }
        } else if (f.st === 'open') {
          f.open = Math.min(1, f.t / .5);
          if (f.t > .7) { f.st = 'away'; f.t = 0; f.a = -HALF + rand(-.6, .6); }
        } else {
          f.x += Math.cos(f.a) * 70 * dt; f.y += Math.sin(f.a) * 70 * dt; f.z = 1 + f.t * .6;
          if (f.t > 3) return false;
        }
        return true;
      }
      if (f.t > 60) return false;
      if (f.hov > 0) {
        f.hov -= dt;
        if (f.hov <= 0) nextWay(f);
        return true;
      }
      var dx = f.tx - f.x, dy = f.ty - f.y, d = Math.sqrt(dx * dx + dy * dy);
      if (f.k === 'drag') {
        var sp = Math.min(d * 4, 240);
        f.a = Math.atan2(dy, dx);
        f.x += dx / (d || 1) * sp * dt; f.y += dy / (d || 1) * sp * dt;
        if (d < 3) { if (f.wp > 4) return false; f.hov = rand(.4, 1.3); }
      } else {
        var want = Math.atan2(dy, dx) + Math.sin(f.t * 3 + f.seed) * .6;
        f.a += clamp(angDiff(want, f.a), -3 * dt, 3 * dt);
        var v = d < 30 ? Math.max(14, d * 1.6) : 58;
        f.x += Math.cos(f.a) * v * dt; f.y += Math.sin(f.a) * v * dt + Math.sin(f.t * 7 + f.seed) * 14 * dt;
        if (d < 5) {
          if (f.wp > 3) return false;
          if (f.flower && f.wp === 2) { f.x = f.tx; f.y = f.ty; f.hov = rand(3, 6); f.sit = true; log2(); }
          else nextWay(f);
        }
      }
      if (f.sit && f.hov <= 0) f.sit = false;
      return true;
    });
  }
  function log2() { if (calm('butterfly', 60)) log('A butterfly stopped on a flower. The ants pretend not to care', ''); }
  function drawFlyer(f) {
    ctx.save(); ctx.translate(f.x, f.y);
    if (f.k === 'lady') {
      ctx.rotate(f.a); ctx.scale(f.z, f.z);
      if (f.z > 1.02) ctx.globalAlpha = clamp(1.8 - f.z * .6, 0, 1);
      if (f.open > 0) {
        ctx.fillStyle = 'rgba(' + PAL.water + ', .35)';
        var fl = f.st === 'away' ? Math.abs(Math.sin(now * 40)) : .5;
        ctx.beginPath(); ctx.ellipse(-1, -3.5 * f.open, 5, 1.6 + fl, -.4, 0, TAU); ctx.ellipse(-1, 3.5 * f.open, 5, 1.6 + fl, .4, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = PAL.inkL; ctx.beginPath(); ctx.arc(3.6, 0, 1.9, 0, TAU); ctx.fill();
      ctx.fillStyle = PAL.lady;
      var o = f.open * .9;
      ctx.beginPath(); ctx.ellipse(0, -o, 3.9, 3.4, -o * .3, -HALF, HALF, true); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, o, 3.9, 3.4, o * .3, -HALF, HALF); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = PAL.inkL; ctx.lineWidth = .6; ctx.beginPath(); ctx.ellipse(0, 0, 3.9, 3.4, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = PAL.inkL;
      ctx.beginPath(); ctx.arc(-1.2, -1.6 - o, .75, 0, TAU); ctx.arc(1, -1.2 - o, .6, 0, TAU); ctx.arc(-1.2, 1.6 + o, .75, 0, TAU); ctx.arc(1, 1.2 + o, .6, 0, TAU); ctx.fill();
      if (!o) { ctx.beginPath(); ctx.moveTo(3.4, 0); ctx.lineTo(-3.8, 0); ctx.stroke(); }
    } else if (f.k === 'fly') {
      /* butterfly seen from above: the wings narrow as they beat */
      var flap = f.sit ? .55 + .45 * Math.sin(now * 2) : Math.abs(Math.sin(now * 13 + f.seed)), k = .25 + .75 * flap;
      ctx.rotate(f.a + HALF);
      ctx.fillStyle = f.c; ctx.strokeStyle = PAL.inkL; ctx.lineWidth = .6;
      for (var sd = -1; sd <= 1; sd += 2) {
        ctx.save(); ctx.scale(sd * k, 1);
        ctx.beginPath(); ctx.moveTo(0, -1); ctx.bezierCurveTo(4, -9, 10, -7, 8, -2); ctx.bezierCurveTo(7, 0, 3, 0, 0, 0); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(5, 1, 7, 6, 3.5, 6.5); ctx.bezierCurveTo(1.5, 6.5, .5, 4, 0, 1.5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = PAL.inkL; ctx.beginPath(); ctx.arc(5.8, -4.2, .8, 0, TAU); ctx.fill(); ctx.fillStyle = f.c;
        ctx.restore();
      }
      ctx.strokeStyle = PAL.inkL; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0, -3.5); ctx.lineTo(0, 4.5); ctx.stroke();
      ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(0, -3.5); ctx.lineTo(-1.8, -7); ctx.moveTo(0, -3.5); ctx.lineTo(1.8, -7); ctx.stroke();
    } else {
      /* dragonfly: long body, four glassy wings */
      ctx.rotate(f.a);
      var sh = .5 + .5 * Math.sin(now * 60 + f.seed);
      ctx.fillStyle = 'rgba(' + PAL.water + ',' + (.18 + .14 * sh) + ')'; ctx.strokeStyle = PAL.inkL; ctx.lineWidth = .4;
      ctx.beginPath(); ctx.ellipse(2, -5.5, 1.6, 6, .25, 0, TAU); ctx.ellipse(2, 5.5, 1.6, 6, -.25, 0, TAU); ctx.ellipse(-1.5, -5, 1.4, 5.2, -.2, 0, TAU); ctx.ellipse(-1.5, 5, 1.4, 5.2, .2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = PAL.wing[2]; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(-13, 0); ctx.stroke();
      ctx.strokeStyle = PAL.inkL; ctx.lineWidth = .5; ctx.globalAlpha = .7; ctx.beginPath();
      for (var s = -3; s > -13; s -= 2.5) { ctx.moveTo(s, -.8); ctx.lineTo(s, .8); }
      ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = PAL.wing[2]; ctx.beginPath(); ctx.arc(2.5, 0, 1.6, 0, TAU); ctx.fill();
      ctx.fillStyle = PAL.inkL; ctx.beginPath(); ctx.arc(4, -.9, .8, 0, TAU); ctx.arc(4, .9, .8, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  /* ---------- fireflies, in ink mode: they gather around the plants and nests on screen ---------- */
  var glow = null;
  function glowSprite() {
    if (glow) return glow;
    var sp = sprite(24, 24), x = sp.x, g = x.createRadialGradient(12, 12, 0, 12, 12, 12);
    g.addColorStop(0, 'rgba(' + PAL.fly + ', .95)'); g.addColorStop(.25, 'rgba(' + PAL.fly + ', .45)'); g.addColorStop(1, 'rgba(' + PAL.fly + ', 0)');
    x.fillStyle = g; x.fillRect(0, 0, 24, 24);
    return (glow = sp);
  }
  function flyAnchors() {
    var out = [];
    patches.forEach(function (p) { if (onScreen(p.x + p.w / 2, p.y, 40)) out.push({ x: p.x + p.w / 2, y: p.y - p.h * .6, r: Math.max(40, p.w * .8) }); });
    planted.forEach(function (t) { if (onScreen(t.x, t.y, 40)) out.push({ x: t.x, y: t.y - t.h * .6, r: 50 }); });
    nests.forEach(function (n) { if (onScreen(n.x, n.y, 40)) out.push({ x: n.x, y: n.y - 20, r: 44 }); });
    return out;
  }
  function stepFlies(dt) {
    var want = night ? MAX_FLIES : 0, anchors = null;
    if (every('flyAnchor', .6, dt)) {
      anchors = want ? flyAnchors() : [];
      flies.forEach(function (f) { if (!onScreen(f.ax, f.ay, 60)) f.out = true; });
      while (anchors.length && flies.filter(function (f) { return !f.out; }).length < want) {
        var a = pick(anchors);
        flies.push({ x: a.x + rand(-a.r, a.r), y: a.y + rand(-a.r * .6, a.r * .4), ax: a.x, ay: a.y, R: a.r, a: rand(0, TAU), ph: rand(0, TAU), w: rand(1.2, 2.4), al: 0, out: false });
      }
      if (!want) flies.forEach(function (f) { f.out = true; });
    }
    flies = flies.filter(function (f) {
      f.al = f.out ? f.al - dt : Math.min(1, f.al + dt * .8);
      if (f.al <= 0 && f.out) return false;
      if (still) return true;
      f.a += rand(-2, 2) * dt;
      var dx = f.x - f.ax, dy = f.y - f.ay;
      if (dx * dx + dy * dy > f.R * f.R) f.a += angDiff(Math.atan2(-dy, -dx), f.a) * Math.min(1, dt * 2);
      f.x += Math.cos(f.a) * 12 * dt; f.y += Math.sin(f.a) * 9 * dt;
      return true;
    });
  }
  function drawFlies() {
    if (!flies.length) return;
    var g = glowSprite();
    for (var i = 0; i < flies.length; i++) {
      var f = flies[i];
      if (!onScreen(f.x, f.y, 20)) continue;
      var b = Math.pow(Math.max(0, Math.sin(now * f.w * (still ? .5 : 1) + f.ph)), 3) * .9 + .1;
      ctx.globalAlpha = b * f.al;
      ctx.drawImage(g.c, f.x - 9, f.y - 9, 18, 18);
      ctx.fillStyle = 'rgba(' + PAL.fly + ', 1)';
      ctx.fillRect(f.x - .7, f.y - .7, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
  }
  function drawScenery() {
    var m = 20, i;
    for (i = 0; i < patches.length; i++) {
      var p = patches[i];
      if (!p.sprite || p.x + p.w < sx - m || p.x > sx + VW + m || p.y < sy - m || p.y - p.h - 90 > sy + VH + m) continue;
      ctx.drawImage(p.sprite.c, p.x - p.ax, p.y - p.ay, p.sprite.w, p.sprite.h);
    }
    for (i = 0; i < trees.length; i++) {
      var t = trees[i];
      if (!t.sprite || !onScreen(t.x, t.y - t.h / 2, t.h)) continue;
      ctx.save();
      ctx.translate(t.x, t.y); ctx.rotate(t.sway);
      if (t.grow < 1) { var k = 1 - Math.pow(1 - t.grow, 3); ctx.scale(k, k); }
      ctx.drawImage(t.sprite.c, -t.ax, -t.ay, t.sprite.w, t.sprite.h);
      ctx.restore();
      if (t.planted && t.grow > .3) {
        ctx.globalAlpha = .6; ctx.strokeStyle = PAL.mound2; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(t.x - t.h * .32, t.y + 1); ctx.lineTo(t.x + t.h * .32, t.y + 1); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
  }

  /* ------------------------------------------------------------------
     Visitors: fast pointers scare ants, a tap flicks one
     ------------------------------------------------------------------ */
  /* a resting cursor makes the ants curious: a few walk over for a look */
  var cursor = { x: 0, y: 0, t: -9, in: false, rest: false, spot: 0 };
  function watchCursor() {
    if (!cursor.in || aim || panelOpen || lite || now - cursor.t < 1.3) return;
    if (!cursor.rest) { cursor.rest = true; cursor.spot = 0; }
    if (cursor.spot >= 4) return;
    var cx = cursor.x + sx, cy = cursor.y + sy;
    var list = ants.filter(function (a) {
      return !a.dead && !a.hidden && !a.foe && !a.carry && a.fl <= 0 && a.caste !== 'q' && !a.tree && (!a.job || /wander|forage|patrol|guard|scout/.test(a.job.k)) && dist(a.x, a.y, cx, cy) < 230;
    }).sort(byDist(cx, cy)).slice(0, 4 - cursor.spot);
    list.forEach(function (a) { detach(a); cursor.spot++; a.job = { k: 'curious', t: rand(4, 8), o: rand(0, TAU), R: rand(16, 26) }; });
  }
  function scare(x, y, R) {
    ants.forEach(function (a) {
      if (a.dead || a.hidden || a.foe || a.fl > 0 || a.caste === 'q' || dist(a.x, a.y, x, y) > R) return;
      a.flee = rand(.5, .9); a.fx = x; a.fy = y;
      if (a.surf || a.tree) { detach(a); if (a.job && /patrol|climb/.test(a.job.k)) a.job = null; }
      if (a.job && a.job.k === 'curious') a.job = null;
    });
  }
  function flick(an, px, py) {
    var a = Math.atan2(an.y - py, an.x - px) + rand(-.4, .4), sp = rand(240, 380);
    an.vx = Math.cos(a) * sp; an.vy = Math.sin(a) * sp; an.fl = an.flT = .75; an.spin = rand(-18, 18);
    detach(an);
    if (an.foe && an.foe.foe === an) an.foe.foe = null;
    an.foe = null;
    if (an.hidden) an.hidden = false;
    if (an.job && an.job.k !== 'home') an.job = null;
    stats.flicks++;
    if (stats.flicks === 1 || calm('flick', 20)) log('Someone flicked a ' + COL[an.col].name + ' ant across the page', an.col);
  }
  function stepFlung(an, dt) {
    an.fl -= dt;
    an.x += an.vx * dt; an.y += an.vy * dt;
    var k = Math.pow(.06, dt);
    an.vx *= k; an.vy *= k;
    an.spinA += an.spin * dt;
    an.z = 1 + Math.sin(PI * clamp(1 - an.fl / an.flT, 0, 1)) * .9;
    bound(an);
    if (an.fl > 0) return;
    an.z = 1; an.a += an.spinA; an.spinA = 0;
    puff(an.x, an.y);
    if (inWater(an.x, an.y)) ring(an.x, an.y, 1, 12, .7, 'water', 1.2);
    if (!an.dead) an.daze = rand(.7, 1.2);
  }

  /* ------------------------------------------------------------------
     Particles
     ------------------------------------------------------------------ */
  function part(o) { if (parts.length > 500) parts.shift(); o.t = 0; parts.push(o); return o; }
  function crumbs(x, y, c, n) { for (var i = 0; i < n; i++) part({ k: 'crumb', x: x, y: y, vx: rand(-22, 22), vy: rand(-22, 22), T: rand(.5, .9), c: c, s: rand(.9, 1.7) }); }
  function spark(x, y, c) { part({ k: 'spark', x: x, y: y, T: .24, a: rand(0, TAU), c: c }); }
  function puff(x, y) { for (var i = 0; i < 3; i++) part({ k: 'puff', x: x + rand(-3, 3), y: y + rand(-3, 3), T: rand(.5, .8), r: rand(2, 4) }); }
  function ring(x, y, r0, r1, T, c, w) { part({ k: 'ring', x: x, y: y, r0: r0, r1: r1, T: T, c: c, w: w || 1 }); }
  function stepParts(dt) {
    parts = parts.filter(function (p) {
      p.t += dt;
      if (p.vx) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; }
      if (p.k === 'glyph') p.y += dt * 6;
      return p.t < p.T;
    });
  }

  /* ------------------------------------------------------------------
     Drawing
     ------------------------------------------------------------------ */
  var LEG = [ /* hip x, knee x, knee y, foot x, foot y, in body lengths */
    [.13, .27, .19, .45, .29],
    [.06, .07, .24, .03, .41],
    [-.01, -.13, .21, -.37, .35]
  ];
  function oval(x, y, rx, ry) { ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); }
  function drawAnt(an) {
    var c = COL[an.col], dead = an.dead > 0, L = an.L * an.z;
    var al = an.alpha * (dead ? clamp((34 - an.dead) / 6, 0, 1) * .85 : 1);
    if (al < .02) return;
    ctx.save();
    ctx.globalAlpha = al;
    ctx.translate(an.x, an.y + (an.swim ? Math.sin(now * 5.5 + an.seed) * .5 : 0));
    if (an.z > 1.03) {
      ctx.fillStyle = PAL.dust;
      ctx.beginPath(); ctx.ellipse((an.z - 1) * 6, (an.z - 1) * 9, an.L * .45, an.L * .22, an.a, 0, TAU); ctx.fill();
    }
    ctx.rotate(an.a + an.spinA);
    ctx.scale(L, L);
    var lw = Math.max(.55, an.L * .085) / L;
    ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = c.body;
    ctx.beginPath();
    var swim = an.swim && !dead;
    for (var i = 0; i < 3; i++) {
      var P = LEG[i];
      for (var sd = -1; sd <= 1; sd += 2) {
        var kx, ky, fx, fy;
        if (dead) { kx = P[0] + .04; ky = sd * .11; fx = P[0] - .03 + (i - 1) * .05; fy = sd * .05; }
        else {
          var ph = an.gait + ((i + (sd > 0 ? 1 : 0)) % 2 ? PI : 0);
          var sw = Math.sin(swim ? ph * .7 : ph) * (swim ? .2 : .12), lift = swim ? 0 : Math.max(0, Math.cos(ph)) * .1;
          kx = P[1] + sw * .5; ky = sd * P[2] * (1 - lift * .5);
          fx = P[3] + sw; fy = sd * P[4] * (1 - lift) * (swim ? 1.12 : 1);
        }
        ctx.moveTo(P[0], sd * .04); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy);
      }
    }
    if (dead) {
      ctx.moveTo(.38, -.03); ctx.lineTo(.46, -.09); ctx.moveTo(.38, .03); ctx.lineTo(.46, .09);
    } else {
      var wave = an.pause > 0 ? 2.2 : 1, w1 = Math.sin(now * 8 + an.seed) * .035 * wave, w2 = Math.sin(now * 6.3 + an.seed * 1.7) * .035 * wave;
      var tip = an.caste === 'c' ? .78 : .64; /* scouts have long, busy antennae */
      ctx.moveTo(.38, -.035); ctx.lineTo(.5, -.13 + w1); ctx.lineTo(tip, -.1 + w2 * (tip > .7 ? 1.6 : 1));
      ctx.moveTo(.38, .035); ctx.lineTo(.5, .13 - w2); ctx.lineTo(tip, .1 - w1 * (tip > .7 ? 1.6 : 1));
      if (an.caste === 's') {
        var m = an.foe ? Math.sin(now * 22 + an.seed) * .025 : 0;
        ctx.moveTo(.41, -.06); ctx.quadraticCurveTo(.52, -.08 - m, .55, -.015 - m);
        ctx.moveTo(.41, .06); ctx.quadraticCurveTo(.52, .08 + m, .55, .015 + m);
      }
    }
    ctx.stroke();
    var q = an.caste === 'q', s = an.caste === 's', sc = an.caste === 'c';
    ctx.fillStyle = c.body;
    ctx.beginPath();
    oval(-.3, 0, q ? .34 : sc ? .21 : .23, q ? .21 : sc ? .14 : .165);
    oval(-.075, 0, .05, .045);
    oval(.06, 0, q ? .16 : .135, q ? .095 : .075);
    oval(.3, 0, s ? .145 : q ? .12 : .105, s ? .125 : q ? .105 : .095);
    ctx.fill();
    if (c.rim) { ctx.strokeStyle = c.rim; ctx.lineWidth = lw * .8; ctx.stroke(); }
    ctx.globalAlpha = al * (dead ? .25 : .55);
    ctx.fillStyle = c.hi;
    ctx.beginPath(); oval(-.34, -.06, .09, .045); oval(.28, -.035, .04, .025); ctx.fill();
    if (q) { ctx.globalAlpha = al; ctx.fillStyle = PAL.queen; ctx.beginPath(); oval(.06, 0, .07, .05); ctx.fill(); }
    ctx.restore();
    if (an.carry) drawCarry(an);
    if (an.daze > 0) {
      ctx.fillStyle = PAL.queen;
      for (var k = 0; k < 2; k++) {
        var sa = now * 7 + k * PI;
        ctx.beginPath(); ctx.arc(an.x + Math.cos(sa) * an.L * .6, an.y - an.L * .3 + Math.sin(sa) * an.L * .25, .9, 0, TAU); ctx.fill();
      }
    }
    if (an.foe && !dead && an.hp < an.maxHp) {
      var bw = an.L * 1.1, bx = an.x - bw / 2, by = an.y - an.L * .95;
      ctx.fillStyle = PAL.dust; ctx.fillRect(bx, by, bw, 1.4);
      ctx.fillStyle = c.line; ctx.fillRect(bx, by, bw * clamp(an.hp / an.maxHp, 0, 1), 1.4);
    }
  }
  var BODY = { col: 0, caste: 'w', L: 6, z: 1, alpha: 1, dead: 1, x: 0, y: 0, a: 0, spinA: 0, swim: false, gait: 0, seed: 0, pause: 0, carry: null, daze: 0, foe: null, hp: 0, maxHp: 1 };
  function drawCarry(an) {
    var it = an.carry, hx = an.x + Math.cos(an.a) * an.L * .78, hy = an.y + Math.sin(an.a) * an.L * .78 + (an.swim ? Math.sin(now * 5.5 + an.seed) * .5 : 0);
    ctx.save();
    ctx.globalAlpha = an.alpha;
    if (it.k === 'glyph') {
      /* held up like a leaf, kept upright so you can read what was taken */
      ctx.translate(hx, hy - 1);
      ctx.rotate(Math.sin(now * 4 + an.seed) * .12);
      ctx.font = it.font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 2.4; ctx.strokeStyle = PAL.halo; ctx.strokeText(it.ch, 0, 0);
      ctx.fillStyle = it.c; ctx.fillText(it.ch, 0, 0);
    } else if (it.k === 'crumb') {
      ctx.translate(hx, hy); ctx.rotate(it.sh + an.a);
      ctx.fillStyle = it.c;
      ctx.beginPath(); ctx.moveTo(-2, -1.6); ctx.lineTo(1.8, -1.9); ctx.lineTo(2.3, 1.2); ctx.lineTo(-.6, 2); ctx.lineTo(-2.4, .6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = PAL.dust; ctx.lineWidth = .6; ctx.stroke();
    } else if (it.k === 'sugar') {
      ctx.translate(hx, hy); ctx.rotate(an.a);
      ctx.fillStyle = PAL.sugar2; ctx.fillRect(-1.1, -1.1, 3, 3);
      ctx.fillStyle = PAL.sugar; ctx.fillRect(-1.5, -1.5, 3, 3);
    } else if (it.k === 'petal') {
      drawPetal(hx, hy - 1, it.sh + Math.sin(now * 3 + an.seed) * .2, 5, it.c, an.alpha);
    } else if (it.k === 'leafbit') {
      /* held high like a leafcutter's sail */
      ctx.translate(hx, hy); ctx.rotate(an.a + HALF + it.sh + Math.sin(now * 3.5 + an.seed) * .1);
      ctx.fillStyle = it.c;
      ctx.beginPath(); ctx.moveTo(0, 1); ctx.quadraticCurveTo(-4, -2.5, -.5, -6.5); ctx.quadraticCurveTo(3.5, -3, 0, 1); ctx.fill();
      ctx.strokeStyle = PAL.inkL; ctx.lineWidth = .5; ctx.stroke();
    } else if (it.k === 'corpse') {
      BODY.col = it.col; BODY.L = it.L * .85; BODY.x = hx; BODY.y = hy; BODY.a = an.a + HALF; BODY.alpha = an.alpha;
      drawAnt(BODY);
    }
    ctx.restore();
  }
  function drawNest(n) {
    var c = COL[n.owner], R = (n.home ? 15 : 12) * (.8 + .2 * n.size), i;
    ctx.save();
    ctx.translate(n.x, n.y);
    var g = ctx.createRadialGradient(-R * .3, -R * .35, 1, 0, 0, R * 1.35);
    g.addColorStop(0, PAL.mound); g.addColorStop(1, PAL.mound2);
    ctx.globalAlpha = .92; ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, R * 1.3, R * .9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = PAL.mound2;
    for (i = 0; i < n.grains.length; i++) { var q = n.grains[i]; ctx.fillRect(q.x * R * 1.3, q.y * R * 1.3, q.s, q.s); }
    ctx.globalAlpha = 1; ctx.fillStyle = PAL.hole;
    ctx.beginPath(); ctx.ellipse(0, -1, R * .3, R * .2, 0, 0, TAU);
    /* a growing nest opens more doors */
    for (i = 0; i < n.holes.length; i++) { if (n.size < 1.35 + i * .4) break; var hq = n.holes[i]; oval(hq.x * R * 1.3, hq.y * R * 1.3, R * .2 * hq.s, R * .13 * hq.s); }
    ctx.fill();
    /* the letters this nest has eaten lie around the mound */
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 8px ' + PAL.font;
    for (i = 0; i < n.loot.length; i++) {
      var l = n.loot[i];
      ctx.save(); ctx.translate(Math.cos(l.a) * l.d * R * 1.3, Math.sin(l.a) * l.d * R * .9); ctx.rotate(l.r);
      ctx.globalAlpha = .75; ctx.fillStyle = l.c; ctx.fillText(l.ch, 0, 0); ctx.restore();
    }
    /* colony flag; home nests carry the queen's gold */
    var px = R * .95, top = -R - 9, wv = Math.sin(now * 3 + n.seed) * 1.2;
    ctx.strokeStyle = PAL.mound2; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, -R * .1); ctx.lineTo(px, top); ctx.stroke();
    ctx.fillStyle = c.body;
    ctx.beginPath(); ctx.moveTo(px, top); ctx.quadraticCurveTo(px + 6, top + 1.5 + wv, px + 10, top + 3 + wv * .6); ctx.quadraticCurveTo(px + 5, top + 5 + wv, px, top + 6); ctx.closePath(); ctx.fill();
    if (c.rim) { ctx.strokeStyle = c.rim; ctx.lineWidth = .6; ctx.stroke(); }
    if (n.home) { ctx.fillStyle = PAL.queen; ctx.beginPath(); ctx.arc(px, top - 1.6, 1.8, 0, TAU); ctx.fill(); }
    if (n.cap > .01) {
      ctx.strokeStyle = COL[n.capBy].line; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.3 + 5, -HALF, -HALF + TAU * n.cap); ctx.stroke();
    }
    if (n.alarm > 0) {
      var ph = (now * 1.6) % 1;
      ctx.globalAlpha = (1 - ph) * .5 * n.alarm; ctx.strokeStyle = c.line; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, R * (1.3 + ph * .9), R * (.9 + ph * .7), 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  function drawPuddle(p) {
    var a = p.alpha, k;
    ctx.beginPath();
    for (k = 0; k <= 36; k++) {
      var ang = k / 36 * TAU, r = shapeR(p, ang);
      if (k) ctx.lineTo(p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r); else ctx.moveTo(p.x + r * Math.cos(ang), p.y + r * Math.sin(ang));
    }
    ctx.closePath();
    var g = ctx.createRadialGradient(p.x - p.r * .3, p.y - p.r * .35, p.r * .1, p.x, p.y, p.r * 1.25);
    g.addColorStop(0, 'rgba(' + PAL.water + ',' + (.1 * a) + ')');
    g.addColorStop(1, 'rgba(' + PAL.water + ',' + (.32 * a) + ')');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(' + PAL.water + ',' + (.55 * a) + ')'; ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, ' + (.45 * a) + ')';
    ctx.beginPath(); ctx.ellipse(p.x - p.r * .35, p.y - p.r * .42, p.r * .28, p.r * .08, -.5, 0, TAU); ctx.fill();
    var ph = (now * .5 + p.p1) % 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (.2 * (1 - ph) * a) + ')'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (.25 + ph * .55), 0, TAU); ctx.stroke();
  }
  function drawSugar(f) {
    var s = (phone ? 5 : 6) * (.45 + .55 * f.n / f.n0);
    ctx.save();
    ctx.translate(f.x, f.y); ctx.rotate(f.rot);
    ctx.fillStyle = PAL.sugar2; ctx.fillRect(-s / 2 + 1.2, -s / 2 + 1.2, s, s);
    ctx.fillStyle = PAL.sugar; ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.strokeStyle = PAL.dust; ctx.lineWidth = .6; ctx.strokeRect(-s / 2, -s / 2, s, s);
    var tw = (now * .8 + f.rot * 3) % 2.2;
    if (tw < .35) {
      var k = Math.sin(tw / .35 * PI) * 3;
      ctx.strokeStyle = PAL.queen; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(-s / 2 - k, -s / 2); ctx.lineTo(-s / 2 + k, -s / 2); ctx.moveTo(-s / 2, -s / 2 - k); ctx.lineTo(-s / 2, -s / 2 + k); ctx.stroke();
    }
    ctx.restore();
  }
  function drawPart(p) {
    var k = p.t / p.T, e = 1 - Math.pow(1 - k, 3);
    ctx.globalAlpha = 1;
    if (p.k === 'ring') {
      ctx.strokeStyle = p.c === 'water' ? 'rgba(' + PAL.water + ',' + (.7 * (1 - k)) + ')' : p.c;
      if (p.c !== 'water') ctx.globalAlpha = 1 - k;
      ctx.lineWidth = p.w;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * e, 0, TAU); ctx.stroke();
    } else if (p.k === 'crumb') {
      ctx.globalAlpha = 1 - k; ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    } else if (p.k === 'spark') {
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = p.c; ctx.lineWidth = .9;
      ctx.beginPath();
      for (var i = 0; i < 3; i++) {
        var a = p.a + i * 2.1, r0 = 1 + e * 2, r1 = 2.5 + e * 3.5;
        ctx.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0); ctx.lineTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
      }
      ctx.stroke();
    } else if (p.k === 'puff') {
      ctx.globalAlpha = 1 - k; ctx.fillStyle = PAL.dust;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + e * 1.5), 0, TAU); ctx.fill();
    } else if (p.k === 'glyph') {
      ctx.globalAlpha = 1 - k; ctx.fillStyle = p.c; ctx.font = p.font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.ch, p.x, p.y);
    }
  }
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(DPR, 0, 0, DPR, -sx * DPR, -sy * DPR);
    var m = 40, i;
    if (showTrails) drawScent();
    ctx.globalAlpha = 1;
    puddles.forEach(function (p) { if (onScreen(p.x, p.y, p.r + m)) drawPuddle(p); });
    drawScenery();
    nests.forEach(function (n) { if (onScreen(n.x, n.y, m)) drawNest(n); });
    foods.forEach(function (f) { if (onScreen(f.x, f.y, m)) drawSugar(f); });
    for (i = 0; i < items.length; i++) { var it = items[i]; if (it.state === 'ground' && onScreen(it.x, it.y, m)) drawItem(it); }
    parts.forEach(function (p) { if (p.k === 'ring' && onScreen(p.x, p.y, m)) drawPart(p); });
    ctx.globalAlpha = 1;
    ants.forEach(function (a) { if (a.dead && onScreen(a.x, a.y, m)) drawAnt(a); });
    ants.forEach(function (a) { if (!a.dead && !a.hidden && a.fl <= 0 && onScreen(a.x, a.y, m)) drawAnt(a); });
    for (i = 0; i < items.length; i++) { it = items[i]; if (it.state !== 'ground' && onScreen(it.x, it.y, m)) drawItem(it); }
    ants.forEach(function (a) { if (!a.dead && a.fl > 0 && onScreen(a.x, a.y, m)) drawAnt(a); });
    for (i = 0; i < flyers.length; i++) if (onScreen(flyers[i].x, flyers[i].y, m)) drawFlyer(flyers[i]);
    parts.forEach(function (p) { if (p.k !== 'ring' && onScreen(p.x, p.y, m)) drawPart(p); });
    ctx.globalAlpha = 1;
    drawFlies();
    if (drops.length) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.strokeStyle = 'rgba(' + PAL.water + ', .5)'; ctx.lineWidth = 1;
      ctx.beginPath();
      drops.forEach(function (d) { var k = d.L / d.vy; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.vx * k, d.y - d.L); });
      ctx.stroke();
    }
  }
  /* is anything of the world on screen right now? if not, the loop can rest */
  function anyVisible() {
    var m = 60, i;
    if (aim || rain || drops.length || flyers.length || flies.length) return true;
    for (i = 0; i < ants.length; i++) { var a = ants[i]; if (!a.hidden && onScreen(a.x, a.y, m)) return true; }
    for (i = 0; i < nests.length; i++) if (onScreen(nests[i].x, nests[i].y, m)) return true;
    for (i = 0; i < trees.length; i++) if (onScreen(trees[i].x, trees[i].y - trees[i].h / 2, trees[i].h)) return true;
    for (i = 0; i < patches.length; i++) if (onScreen(patches[i].x + patches[i].w / 2, patches[i].y, m)) return true;
    for (i = 0; i < items.length; i++) if (onScreen(items[i].x, items[i].y, m)) return true;
    for (i = 0; i < puddles.length; i++) if (onScreen(puddles[i].x, puddles[i].y, puddles[i].r + m)) return true;
    for (i = 0; i < foods.length; i++) if (onScreen(foods[i].x, foods[i].y, m)) return true;
    return parts.length > 0 && parts.some(function (p) { return onScreen(p.x, p.y, m); });
  }

  /* ------------------------------------------------------------------
     Loop
     ------------------------------------------------------------------ */
  function stepAnt(an, dt) {
    if (an.dead) { an.dead += dt; if (an.fl > 0) stepFlung(an, dt); return; }
    if (an.hidden) { stepHidden(an, dt); return; }
    if (an.alpha < 1 && !(an.job && an.job.k === 'home')) an.alpha = Math.min(1, an.alpha + dt * 2.2);
    if (an.cool > 0) an.cool -= dt;
    if (an.greet > 0) an.greet -= dt;
    if (an.fl > 0) { stepFlung(an, dt); return; }
    var w = inWater(an.x, an.y);
    if (w && !an.swim) { stats.swims++; ring(an.x, an.y, 1, an.L * 1.6, .7, 'water', 1); }
    an.swim = !!w;
    if (an.swim && (an.rip -= dt) <= 0) {
      an.rip = .32;
      ring(an.x - Math.cos(an.a) * an.L * .3, an.y - Math.sin(an.a) * an.L * .3, an.L * .3, an.L * 1.4, .9, 'water', .8);
    }
    if (an.daze > 0) { an.daze -= dt; an.gait += dt * 22; return; }
    if (an.foe && stepFight(an, dt)) { bound(an); return; }
    if (an.flee > 0) {
      an.flee -= dt;
      var aw = Math.atan2(an.y - an.fy, an.x - an.fx), st = an.v * SPD * 1.9 * (an.swim ? .5 : 1) * dt;
      an.a += clamp(angDiff(aw, an.a), -11 * dt, 11 * dt);
      an.x += Math.cos(an.a) * st; an.y += Math.sin(an.a) * st; an.gait += st / (an.L * .28);
      bound(an);
      return;
    }
    if (an.pause > 0) { an.pause -= dt; if (an.surf) placeOn(an, live(an.surf), dt); return; }
    if (!an.job) think(an);
    if (an.job) stepJob(an, dt);
    if (an.carry || (an.job && an.job.why === 'report')) layScent(an, dt);
    if (!an.surf) bound(an);
  }
  function simulate(dt) {
    now += dt; frameNo++;
    sx = window.scrollX || window.pageXOffset || 0; sy = window.scrollY || window.pageYOffset || 0;
    /* layout reads are spread out: surfaces one second, text and anchors the next */
    if (every('surf', 2, dt)) { measure(); refreshSurfaces(); anchorNests(); anchorPatches(); phReset(); }
    if (every('text', 2, dt) && frameNo > 2) refreshTexts();
    if (every('slow', .5, dt)) { tendTrails(.5); phFade(.5); watchNests(.5); colonies(.5); cv.classList.toggle('is-covered', !!doc.querySelector('.pst.full, .present, .studio')); }
    if (every('heal', .25, dt)) heal(.25);
    if (every('cursor', .4, dt)) watchCursor();
    director();
    stepRain(dt);
    stepPuddles(dt);
    foods = foods.filter(function (f) { return f.n > 0; });
    stepTrees(dt);
    stepItems(dt);
    buildGrid();
    contacts(dt);
    for (var i = 0; i < ants.length; i++) {
      /* a decorative layer must never stall the page: an ant that trips gets a fresh start */
      try { stepAnt(ants[i], dt); } catch (err) { var a = ants[i]; a.job = null; a.surf = null; a.foe = null; a.tree = null; if (!quiet.err) { quiet.err = 1; console.error(err); } }
    }
    stepParts(dt);
    stepFlyers(dt);
    stepFlies(dt);
    flushMasks();
  }
  function frame(t) {
    raf = 0;
    if (!on || hiddenTab) return;
    raf = requestAnimationFrame(frame);
    var t0 = performance.now();
    var dt = Math.min(.05, Math.max(0, (t - last) / 1000)) || .016;
    last = t;
    simulate(dt);
    /* nothing of the world on screen for a second: stop drawing and slow the clock down */
    if (anyVisible()) idleT = 0;
    else if ((idleT += dt) > 1 && !panelOpen) { sleep(); return; }
    render();
    if (panelOpen && every('panel', .25, dt)) renderPanel();
    else if (every('badge', 1, dt)) badge.textContent = COL[0].pop + COL[1].pop;
    var ms = performance.now() - t0;
    cost.n++; cost.ms += ms; if (ms > cost.worst) cost.worst = ms;
  }
  function sleep() {
    if (asleep) return;
    asleep = true;
    cancelAnimationFrame(raf); raf = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    clearTimeout(sleepT);
    sleepT = setTimeout(doze, 250);
  }
  /* asleep: four slow ticks a second keep the colonies living off screen, without drawing */
  function doze() {
    sleepT = 0;
    if (!asleep || !on || hiddenTab) return;
    var t0 = performance.now();
    simulate(.125); simulate(.125);
    cost.doze = (cost.doze || 0) + performance.now() - t0;
    if (anyVisible()) { wake(); return; }
    sleepT = setTimeout(doze, 250);
  }
  function wake() {
    if (!on || hiddenTab) return;
    if (asleep) { asleep = false; clearTimeout(sleepT); sleepT = 0; idleT = 0; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function halt() {
    cancelAnimationFrame(raf); raf = 0;
    clearTimeout(sleepT); sleepT = 0;
  }

  /* ------------------------------------------------------------------
     Ant button + panel
     ------------------------------------------------------------------ */
  function svg(d, fill) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (fill || '') + '<path d="' + d + '"/></svg>'; }
  var ICON = {
    ant: svg('M11 4.4L9.1 2.3M13 4.4l1.9-2.1M10.3 9.9L6.4 7.6 5.3 5.4M13.7 9.9l3.9-2.3 1.1-2.2M10 11.3l-4.4.7-1.8 2M14 11.3l4.4.7 1.8 2M10.3 12.6L7 16l-.6 3.4M13.7 12.6L17 16l.6 3.4',
      '<ellipse cx="12" cy="16.7" rx="3.1" ry="4.1" fill="currentColor" stroke="none"/><ellipse cx="12" cy="10.9" rx="2" ry="2.2" fill="currentColor" stroke="none"/><circle cx="12" cy="6.4" r="2.2" fill="currentColor" stroke="none"/>'),
    close: svg('M6 6l12 12M18 6L6 18'),
    sugar: svg('M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9'),
    water: svg('M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z'),
    rain: svg('M7 15a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 7.5 3.8 3.8 0 0 1 17.5 15zM8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5'),
    war: svg('M5 21V4M5 4h11l-2.2 4L16 12H5'),
    heal: svg('M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5'),
    power: svg('M12 3v8M6.3 6.8a8 8 0 1 0 11.4 0'),
    tree: svg('M12 21v-5M12 16l-3-2M12 13.5l2.6-1.8M5 12.5c0-2.2 2-3.6 3.6-3.4C9 6.5 10.6 5 12.4 5.2c2 .2 3.3 1.8 3.4 3.6 1.8 0 3.2 1.4 3.2 3.2 0 1.9-1.5 3.2-3.4 3.2H8.2C6.4 15.2 5 14.3 5 12.5zM8 21h8'),
    leaf: svg('M5 19C5 10 10.5 5 19 5c0 8.5-5 14-14 14zM5 19l8.5-8.5M9.5 14.5H13M9.5 14.5V11'),
    trail: svg('M4 18.5h.01M7.5 16h.01M11 14.5h.01M14 12h.01M16.5 9h.01M18.5 6h.01', '<circle cx="19.5" cy="4.5" r="1.6" fill="currentColor" stroke="none"/>')
  };
  var ROWS = [['work', 'Workers'], ['scouts', 'Scouts'], ['sold', 'Soldiers'], ['queen', 'Queen'], ['food', 'Food stored'], ['nests', 'Nests'], ['rooms', 'Chambers']];
  var ui = doc.createElement('div');
  ui.className = 'ant-ui';
  ui.innerHTML =
    '<button type="button" class="ant-fab" aria-expanded="false" aria-controls="ant-panel" aria-label="Ant World: open the ant colony panel" title="Ant World">' + ICON.ant + '<span class="ant-fab-n" aria-hidden="true">0</span></button>' +
    '<div class="ant-panel" id="ant-panel" role="dialog" aria-label="Ant World" hidden>' +
      '<div class="ant-hd"><div><b>Ant World</b><span class="ant-jp">蟻の国</span></div><button type="button" class="ant-x" data-ant="close" aria-label="Close the ant panel">' + ICON.close + '</button></div>' +
      '<p class="ant-sub">Two ant colonies live on this site. Scouts find food and lay scent, workers follow it and haul leaves home together, soldiers guard the nests. They climb the little trees, eat letters and fight for every section. Everything grows back.</p>' +
      '<div class="ant-bar" role="img" aria-label="Territory"><i></i></div>' +
      '<div class="ant-bar-cap"><span>Aka territory</span><span>Kuro territory</span></div>' +
      '<table class="ant-census"><caption>Colony census</caption><thead><tr><th scope="col"><span class="ant-sr">Caste or store</span></th>' +
        COL.map(function (c) { return '<th scope="col" data-col="' + c.id + '"><i aria-hidden="true"></i>' + c.name + '<span class="ant-jp2" aria-hidden="true">' + c.jp + '</span></th>'; }).join('') + '</tr></thead><tbody>' +
        ROWS.map(function (r) { return '<tr><th scope="row">' + r[1] + '</th>' + COL.map(function (c) { return '<td data-k="' + r[0] + '" data-col="' + c.id + '">0</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table>' +
      '<dl class="ant-stats">' + [['letters', 'Letters eaten'], ['bites', 'Bites'], ['duels', 'Fallen'], ['leaves', 'Leaves hauled'], ['finds', 'Scout finds'], ['captures', 'Nests taken'], ['swims', 'Swims'], ['trees', 'Trees'], ['flicks', 'Flicked']].map(function (s) { return '<div><dt>' + s[1] + '</dt><dd data-stat="' + s[0] + '">0</dd></div>'; }).join('') + '</dl>' +
      '<ol class="ant-log" aria-live="polite"></ol>' +
      '<div class="ant-acts">' +
        '<button type="button" data-ant="sugar" aria-pressed="false">' + ICON.sugar + '<span>Drop sugar</span></button>' +
        '<button type="button" data-ant="water" aria-pressed="false">' + ICON.water + '<span>Spill water</span></button>' +
        '<button type="button" data-ant="plant" aria-pressed="false">' + ICON.tree + '<span>Plant a tree</span></button>' +
        '<button type="button" data-ant="leaf" aria-pressed="false">' + ICON.leaf + '<span>Drop a leaf</span></button>' +
        '<button type="button" data-ant="rain">' + ICON.rain + '<span>Make it rain</span></button>' +
        '<button type="button" data-ant="war">' + ICON.war + '<span>Start a war</span></button>' +
        '<button type="button" data-ant="trails" class="ant-wide" aria-pressed="true">' + ICON.trail + '<span>Show scent trails</span></button>' +
        '<button type="button" data-ant="heal" class="ant-wide">' + ICON.heal + '<span>Restore the website</span></button>' +
        '<button type="button" data-ant="toggle" class="ant-wide">' + ICON.power + '<span>Hide the ants</span></button>' +
      '</div>' +
    '</div>';
  var fab = ui.querySelector('.ant-fab'), badge = ui.querySelector('.ant-fab-n'), panel = ui.querySelector('.ant-panel'), panelOpen = false, lastLog = -1;

  function renderPanel() {
    var total = nests.length || 1, aka = nests.filter(function (n) { return n.owner === 0; }).length;
    ui.querySelector('.ant-bar i').style.width = (aka / total * 100).toFixed(1) + '%';
    ui.querySelector('.ant-bar').setAttribute('aria-label', 'Territory: Aka holds ' + aka + ' of ' + total + ' nests');
    COL.forEach(function (c) {
      var q = c.queen, rooms = 0;
      nests.forEach(function (n) { if (n.owner === c.id) rooms += 1 + Math.floor((n.size - 1) / .3); });
      var v = {
        work: c.work || 0, scouts: c.scouts || 0, sold: c.sold || 0, food: Math.floor(c.food), nests: c.nests, rooms: rooms,
        queen: !q || q.dead ? 'lost' : q.hidden ? 'at home' : 'walking'
      };
      ROWS.forEach(function (r) {
        var td = ui.querySelector('td[data-k="' + r[0] + '"][data-col="' + c.id + '"]'), t = String(v[r[0]]);
        if (td.textContent !== t) td.textContent = t;
      });
    });
    stats.trees = trees.length;
    Object.keys(stats).forEach(function (k) { var el = ui.querySelector('[data-stat="' + k + '"]'); if (el) el.textContent = stats[k]; });
    badge.textContent = COL[0].pop + COL[1].pop;
    if (lastLog !== logs.length + ':' + (logs[0] && logs[0].t)) {
      lastLog = logs.length + ':' + (logs[0] && logs[0].t);
      ui.querySelector('.ant-log').innerHTML = logs.length ? logs.map(function (l) { return '<li data-c="' + l.c + '">' + XR.esc(l.m) + '</li>'; }).join('') : '<li class="is-empty">Quiet for now. Watch the buttons.</li>';
    }
  }
  function log(m, c) {
    logs.unshift({ m: m, c: c == null ? '' : String(c), t: now });
    if (logs.length > 5) logs.pop();
  }
  function label(el) {
    var cl = el.classList, tag = el.tagName;
    if (cl.contains('site-header')) return 'the header';
    if (cl.contains('site-footer')) return 'the footer';
    if (cl.contains('tabbar')) return 'the tab bar';
    var h = cl.contains('card') ? el.querySelector('h2, h3, h4, .h4, strong, b') : null;
    var t = short(tag === 'IMG' ? el.getAttribute('alt') : el.getAttribute('aria-label') || (h || el).innerText || (h || el).textContent, 26);
    var kind = tag === 'IMG' ? 'image' : cl.contains('btn') || tag === 'BUTTON' ? 'button' : cl.contains('card') ? 'card' : cl.contains('chip') ? 'tag' : cl.contains('stat') ? 'stat' : 'block';
    return t ? 'the “' + t + '” ' + kind : 'a ' + kind;
  }
  function openPanel(open) {
    panelOpen = open;
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    fab.classList.remove('is-hint');
    if (open) { lastLog = -1; renderPanel(); }
  }
  var AIMS = ['sugar', 'water', 'plant', 'leaf'];
  var AIM_TIP = { sugar: 'Click anywhere to drop sugar.', water: 'Click anywhere to spill water.', plant: 'Click an empty spot to plant a little tree.', leaf: 'Click anywhere to drop a leaf.' };
  function aimAt(mode) {
    aim = mode;
    root.classList.toggle('ant-aiming', !!mode);
    AIMS.forEach(function (k) { ui.querySelector('[data-ant="' + k + '"]').setAttribute('aria-pressed', aim === k ? 'true' : 'false'); });
    if (!mode) return;
    wake();
    if (phone) openPanel(false);
    XR.toast(AIM_TIP[mode] + ' Esc to stop.');
  }
  /* the pointer actions, at a page point */
  function actAt(mode, x, y) {
    if (mode === 'sugar') dropSugar(x, y);
    else if (mode === 'water') {
      makePuddle(x, y, phone ? 34 : 50);
      ring(x, y, 2, 30, .8, 'water', 1.4);
      if (calm('spill', 8)) log('Someone spilled water. Swimming lessons for everyone', 'w');
    } else if (mode === 'plant') plantTree(x, y);
    else if (mode === 'leaf') {
      var it = dropItem('leaf', x, y - (still ? 0 : 60), y, Math.random() < .5 ? PAL.leaf : PAL.leaf3);
      if (it && calm('dropleaf', 10)) log('A leaf fell near ' + placeName(x, y) + '. It is too big for one ant', '');
    }
    wake();
  }
  /* from the keyboard there is no pointer to aim with: act at a sensible spot on screen */
  function actHere(mode) {
    var x = sx + VW / 2 + rand(-VW * .2, VW * .2), y = sy + VH * rand(.45, .7), s;
    if (mode === 'plant') { s = freeSpot(56, 70); if (s) { x = s.x + 28; y = s.y; } }
    else if (mode === 'leaf') {
      var vt = trees.filter(function (t) { return t.grow >= 1 && onScreen(t.x, t.y - t.h / 2, -10); });
      if (vt.length) { var t = pick(vt), c = pick(t.geo.crown), p = treePt(t, [c.x, c.y]); actAt('leaf', p.x, t.y + rand(-2, 8)); return XR.toast('A leaf fell from a ' + TREE_NAME[t.kind] + ' on screen.'); }
    } else if (mode === 'sugar') {
      var vn = nests.filter(function (n) { return onScreen(n.x, n.y, -20); });
      if (vn.length) { var n = pick(vn); x = n.x + rand(-80, 80); y = n.y + rand(-50, 50); }
    }
    actAt(mode, clamp(x, 20, VW - 20), y);
    XR.toast(mode === 'plant' ? 'A tree was planted on screen.' : mode === 'sugar' ? 'Sugar dropped on screen.' : mode === 'water' ? 'Water spilled on screen.' : 'A leaf fell on screen.');
  }
  function setTrails(v, save) {
    showTrails = v;
    if (save) XR.store(TRAIL_KEY, v ? 'on' : 'off');
    ui.querySelector('[data-ant="trails"]').setAttribute('aria-pressed', v ? 'true' : 'false');
  }
  function setOn(v, save) {
    if (save) XR.store(KEY, v ? 'on' : 'off');
    ui.classList.toggle('is-off', !v);
    ui.querySelector('[data-ant="toggle"] span').textContent = v ? 'Hide the ants' : 'Bring the ants back';
    fab.setAttribute('aria-label', v ? 'Ant World: open the ant colony panel' : 'Ant World is hidden: open the panel to bring the ants back');
    if (v === on) return;
    on = v;
    if (v) {
      if (!built) build();
      cv.style.display = '';
      asleep = false; idleT = 0;
      wake();
    } else {
      halt(); asleep = false;
      aimAt(null);
      restoreAll();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      cv.style.display = 'none';
    }
  }
  ui.addEventListener('click', function (e) {
    if (e.target.closest('.ant-fab')) { openPanel(!panelOpen); return; }
    var b = e.target.closest('[data-ant]');
    if (!b) return;
    var act = b.getAttribute('data-ant');
    if (act === 'close') { openPanel(false); fab.focus(); }
    else if (act === 'toggle') setOn(!on, true);
    else if (act === 'trails') setTrails(!showTrails, true);
    else if (!on) return;
    else if (AIMS.indexOf(act) > -1) { if (e.detail === 0 && aim !== act) actHere(act); else aimAt(aim === act ? null : act); }
    else if (act === 'rain') { next.rain = now + rand(75, 130); startRain(); wake(); }
    else if (act === 'war') { var a = raid(0), k = raid(1); if (a && k) log('War! Both colonies are on the march', ''); }
    else if (act === 'heal') { restoreAll(); log('The website was restored. The ants are already hungry again', ''); }
    renderPanel();
  });

  /* ---------- page listeners ---------- */
  var pm = { x: 0, y: 0, t: 0 };
  window.addEventListener('pointermove', function (e) {
    if (!on || e.pointerType !== 'mouse') return;
    var t = performance.now(), x = e.clientX + (window.scrollX || 0), y = e.clientY + (window.scrollY || 0), gap = (t - pm.t) / 1000;
    var speed = gap > 0 && gap < .1 ? dist(x, y, pm.x, pm.y) / gap : 0;
    pm.x = x; pm.y = y; pm.t = t;
    cursor.x = e.clientX; cursor.y = e.clientY; cursor.t = now; cursor.in = true;
    if (cursor.rest) { cursor.rest = false; if (speed > 200) scare(x, y, 30); }
    /* a fast cursor scares ants; the faster it moves, the wider the panic */
    if (speed > 700) scare(x, y, clamp(speed / 16, 42, 90));
    if (asleep) wake();
  }, { passive: true });
  doc.addEventListener('mouseleave', function () { cursor.in = false; cursor.rest = false; });
  window.addEventListener('pointerdown', function (e) {
    if (!on || aim || e.button > 0 || (e.target.closest && e.target.closest('.ant-ui'))) return;
    var x = e.clientX + (window.scrollX || 0), y = e.clientY + (window.scrollY || 0), best = null, bd = e.pointerType === 'mouse' ? 13 : 22;
    ants.forEach(function (a) { if (a.hidden || a.gone) return; var d = dist(a.x, a.y, x, y); if (d < bd) { bd = d; best = a; } });
    if (best) flick(best, x, y);
  }, { passive: true });
  window.addEventListener('click', function (e) {
    if (!aim || !on || (e.target.closest && e.target.closest('.ant-ui'))) return;
    e.preventDefault(); e.stopPropagation();
    actAt(aim, e.clientX + (window.scrollX || 0), e.clientY + (window.scrollY || 0));
  }, true);
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (aim) aimAt(null);
    else if (panelOpen) { openPanel(false); fab.focus(); }
  });
  doc.addEventListener('pointerdown', function (e) { if (panelOpen && !aim && !ui.contains(e.target)) openPanel(false); });
  var resizeT = 0;
  window.addEventListener('resize', function () {
    if (!built) return;
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      sx = window.scrollX || 0; sy = window.scrollY || 0;
      measure(); refreshSurfaces(); refreshTexts(); layoutWorld();
      ants.forEach(bound);
      planted.forEach(function (t) { t.x = clamp(t.x, t.h * .6, VW - t.h * .6); });
      items.forEach(function (it) { it.x = clamp(it.x, 6, VW - 6); });
      wake();
    }, 300);
  });
  window.addEventListener('load', function () { if (built) { measure(); layoutWorld(); } });
  /* a hidden tab costs nothing: no frames, no timers */
  doc.addEventListener('visibilitychange', function () {
    hiddenTab = doc.hidden;
    if (hiddenTab) { halt(); asleep = false; }
    else if (on) { idleT = 0; wake(); }
  });
  window.addEventListener('scroll', function () { if (asleep) wake(); }, { passive: true });
  new MutationObserver(readColors).observe(root, { attributes: true, attributeFilter: ['data-mode'] });

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function build() {
    built = true;
    sx = window.scrollX || 0; sy = window.scrollY || 0;
    readColors();
    measure();
    refreshSurfaces();
    refreshTexts();
    layoutWorld();
    populate();
    next = { feast: rand(6, 12), raid: rand(14, 24), rain: still ? Infinity : rand(28, 45), queen: rand(30, 60), fly: rand(6, 14), drag: rand(25, 45), lady: rand(10, 20) };
    now = 0;
    ticks.text = 1; /* text reads land a second after surface reads */
  }
  function start() {
    if (start.done) return;
    start.done = true;
    cv.className = 'ant-canvas';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.display = 'none';
    body.appendChild(cv);
    body.appendChild(ui);
    var pref = XR.store(KEY), tp = XR.store(TRAIL_KEY);
    hiddenTab = !!doc.hidden;
    setTrails(tp ? tp === 'on' : true, false);
    setOn(pref ? pref === 'on' : !still, false);
    if (on && !XR.store('xr-ants-hi')) {
      XR.store('xr-ants-hi', 1);
      setTimeout(function () {
        fab.classList.add('is-hint');
        XR.toast('Ants moved in. Tap the ant button to watch the colony war.');
      }, 5000);
    }
  }
  /* a small read-only window for testing and the curious: counts and the loop's cost */
  XR.antWorld = function () {
    var c = {};
    ants.forEach(function (a) { if (!a.dead) c[a.caste] = (c[a.caste] || 0) + 1; });
    return {
      on: on, asleep: asleep, lite: lite, still: still, night: night, castes: c, ants: ants.length, nests: nests.length,
      sizes: nests.map(function (n) { return +n.size.toFixed(2); }), patches: patches.length, trees: trees.length, items: items.length, itemState: items.map(function (it) { return it.k[0] + ':' + it.state[0] + it.crew.length + '/' + it.need; }).join(' '),
      climbing: trees.map(function (t) { return { x: Math.round(t.x), y: Math.round(t.y), n: climbers(t) }; }),
      boxes: patches.map(function (p) { return { x: Math.round(p.x), y: Math.round(p.y - p.h), w: p.w, h: p.h, tree: p.tree ? p.tree.kind : '' }; }),
      flyers: flyers.map(function (f) { return f.k; }), flies: flies.length, scent: PH.act.length, memory: trails.length,
      jobs: ants.reduce(function (o, a) { var k = a.hidden ? 'inside' : a.job ? a.job.k : 'idle'; o[k] = (o[k] || 0) + 1; return o; }, {}),
      frameMs: cost.n ? +(cost.ms / cost.n).toFixed(3) : 0, worstMs: +cost.worst.toFixed(2), frames: cost.n, dozeMs: +(cost.doze || 0).toFixed(1),
      reset: function () { cost = { n: 0, ms: 0, worst: 0 }; }
    };
  };
  if (XR.onReady) XR.onReady(function () { setTimeout(start, 250); });
  setTimeout(start, 4000);
})();
