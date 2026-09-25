/* =====================================================================
   XIRAIYA — Ant World · 蟻の国
   Two ant colonies live on every page. Aka (red) and Kuro (black) dig
   nests in the quiet corners of each section and get on with life:
   workers walk the edges of buttons, cards, images, the header and the
   footer, bite pieces out of them and carry letters home; soldiers guard
   nests, hunt intruders and march on enemy nests to capture them. Rain
   leaves puddles the ants swim through. Visitors can flick ants, drop
   sugar, spill water and start a war from the ant button.
   Everything the ants eat grows back, and the text never leaves the DOM.
   One canvas, no libraries. Opt out per page with <body data-ants="off">.
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
  var KEY = 'xr-ants';
  var DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.75 : 2);
  var PER_NEST = phone ? 4 : 7, MAX_POP = phone ? 26 : 72, MAX_STOLEN = phone ? 0 : 24, MAX_BITTEN = phone ? 0 : 30; /* on phones text stays readable: ants walk, fight and swim but do not eat words */
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
  var stats = { letters: 0, bites: 0, duels: 0, swims: 0, captures: 0, flicks: 0 };
  var rain = null, aim = null, next = {}, ticks = {}, quiet = {}, PAL = {};
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
  function paintMask(b) {
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
    bitten.clear();
    trails = [];
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
      if (e.closest('[aria-hidden="true"], ' + SKIP)) continue;
      var r = docRect(e);
      if (r.w >= 2 && r.h >= 2 && r.x < VW && r.x + r.w > 0) out.push(r);
    }
    var tw = doc.createTreeWalker(doc.querySelector('main') || body, NodeFilter.SHOW_TEXT, null), n, k = 0;
    while ((n = tw.nextNode()) && k < 2500) {
      var pe = n.parentElement;
      if (!/\S/.test(n.nodeValue) || !pe || pe.closest('[aria-hidden="true"], script, style')) continue;
      k++;
      range.selectNodeContents(n);
      var q = range.getBoundingClientRect();
      if (q.width > 1) out.push({ x: q.left + sx, y: q.top + sy, w: q.width, h: q.height });
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
    var n = { id: i, sec: sec, rx: site.x - r.x, ry: site.y - r.y, x: site.x, y: site.y, owner: 0, home: false, name: nestName(sec, i), loot: [], cap: 0, capBy: 0, flash: 0, alarm: 0, seed: rand(0, 1000), grains: [] };
    for (var k = 0; k < 16; k++) { var a = rand(0, TAU), d = rand(.85, 1.55); n.grains.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * .7, s: rand(.7, 1.4) }); }
    return n;
  }
  function placeNests() {
    var secs = sectionsList(), obs = obstacles(), used = [], old = nests, out = [];
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
    out.forEach(function (n, i) { n.owner = same ? old[i].owner : i < half ? 0 : 1; if (same) n.loot = old[i].loot; });
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
    var q = caste === 'q', s = caste === 's';
    var an = {
      id: ++uid, col: cid, caste: caste, x: x, y: y, a: rand(0, TAU),
      L: (q ? 13.5 : s ? rand(8.4, 9.6) : rand(6.1, 7.3)) * (phone ? .95 : 1),
      v: (q ? 15 : s ? rand(27, 34) : rand(33, 43)) * (phone ? .92 : 1),
      hp: q ? 40 : s ? 15 : 6, home: null, inNest: null, raid: null, raidUntil: 0,
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
      for (var i = 0; i < k; i++) {
        var a = rand(0, TAU), d = rand(12, 170);
        var an = makeAnt(n.owner, Math.random() < .26 ? 's' : 'w', clamp(n.x + Math.cos(a) * d, 6, VW - 6), clamp(n.y + Math.sin(a) * d * .8, 6, DH - 6));
        an.home = n;
        if (Math.random() < .2) { an.hidden = true; an.inNest = n; an.hideT = rand(.5, 6); }
      }
    });
    /* a few scouts start on the first screen, so every visit opens on a living page */
    var free = ants.filter(function (a) { return !a.hidden; });
    for (var s = 0; s < (phone ? 6 : 12) && free.length; s++) {
      var an = free.splice((Math.random() * free.length) | 0, 1)[0];
      an.x = sx + rand(30, VW - 30); an.y = sy + rand(VH * .2, VH - 40);
    }
    COL.forEach(function (c) {
      var q = makeAnt(c.id, 'q', c.homeN.x, c.homeN.y);
      q.home = q.inNest = c.homeN; q.hidden = true; q.hideT = Infinity;
      c.queen = q;
    });
  }
  function detach(an) { an.surf = null; }
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
    var step = Math.min(an.v * (mul || 1) * bz * (an.swim ? .45 : 1) * dt, d);
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
    var step = an.v * pace(an, dt) * (an.swim ? .45 : 1) * dt;
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
  function nearFood(an, R) {
    var best = null, bd = R;
    foods.forEach(function (f) { if (f.n <= 0) return; var d = dist(an.x, an.y, f.x, f.y); if (d < bd) { bd = d; best = f; } });
    if (best) return best;
    bd = Math.min(R, 320);
    ants.forEach(function (c) {
      if (c.dead < 2 || c.claimed || c.gone || c.fl > 0) return;
      var d = dist(an.x, an.y, c.x, c.y);
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  }
  function pickTrail(an) {
    var c = [], w = [];
    trails.forEach(function (t) { if (t.col === an.col && t.str > .3 && dist(an.x, an.y, t.n.x, t.n.y) < 520) { c.push(t); w.push(t.str); } });
    return c.length ? weighted(c, w) : null;
  }
  function followTrail(an, t) {
    var s = t.src;
    if (s.k === 'text') return letterJob(an, s.el);
    if (s.k === 'bite') return canBite(s.surf) && patrolJob(an, .5, s.surf);
    if (s.k === 'food' && s.f.n > 0) { an.job = foodJob(s.f); return true; }
    return false;
  }
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
      if (dHome > 800 && r < .5) an.job = { k: 'home', why: 'rest' };
      else if (r < .38) an.job = guardJob(an.home);
      else if (r < .78 && patrolJob(an, 0)) return;
      else an.job = wanderJob(an, 160);
      return;
    }
    if (dHome > 950 && r < .55) { an.job = { k: 'home', why: 'rest' }; return; }
    var tr = pickTrail(an);
    if (tr && Math.random() < .5 && followTrail(an, tr)) return;
    var f = nearFood(an, 600);
    if (f && Math.random() < .75) { an.job = foodJob(f); return; }
    r = Math.random();
    if (r < .26 && letterJob(an)) return;
    if (r < .66 && patrolJob(an, rand(.05, .14))) return;
    if (r < .76) { an.job = { k: 'home', why: 'rest' }; return; }
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
      an.carry = { k: 'crumb', c: j.c, sh: rand(0, TAU) };
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
    an.carry = { k: 'glyph', ch: j.ink.upper ? j.ch.toUpperCase() : j.ch, font: j.ink.font, c: j.ink.color };
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
    if (corpse) { f.gone = true; an.carry = { k: 'corpse', col: f.col, L: f.L }; }
    else { f.n--; an.carry = { k: 'sugar' }; crumbs(f.x, f.y, PAL.sugar2, 2); }
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
    an.hidden = true; an.surf = null; an.job = null; an.alpha = 1;
    an.hideT = an.caste === 'q' ? Infinity : j.why === 'shelter' ? (rain ? rain.dur - rain.t : 0) + rand(2, 6) : rand(1.2, 5);
  }
  function deposit(an, n, src) {
    var it = an.carry;
    COL[an.col].food += it.k === 'glyph' ? 2 : it.k === 'corpse' ? 3 : 1;
    if (it.k === 'glyph') {
      n.loot.push({ ch: it.ch, c: it.c, a: rand(0, TAU), d: rand(1.05, 1.6), r: rand(-.6, .6) });
      if (n.loot.length > 7) n.loot.shift();
    }
    an.carry = null;
    if (src) addTrail(an.col, n, src);
  }
  function stepHidden(an, dt) {
    an.hideT -= dt;
    if (an.hideT > 0) return;
    var n = an.inNest || an.home;
    an.hidden = false; an.x = n.x; an.y = n.y; an.alpha = 0; an.a = rand(0, TAU);
    an.job = { k: 'emerge', t: .8, a: rand(0, TAU), n: n };
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
        walkTo(an, dt, j.n.x + Math.cos(j.ang) * j.R, j.n.y + Math.sin(j.ang) * j.R * .72, .9);
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
      case 'attend':
        var q = j.q;
        j.t -= dt;
        if (q.hidden || q.dead || !q.job || q.job.k !== 'stroll' || j.t <= 0) an.job = null;
        else walkTo(an, dt, q.x + Math.cos(q.a + j.o) * 13, q.y + Math.sin(q.a + j.o) * 13, 1.2);
        break;
      default: an.job = null;
    }
  }

  /* ---------- trails: the ant highways between a nest and good food ---------- */
  function srcPoint(src) {
    if (src.k === 'text') { if (!src.el.isConnected) return null; var r = docRect(src.el); return r.w ? { x: r.x + r.w / 2, y: r.y + r.h / 2 } : null; }
    if (src.k === 'bite') { var s = src.surf; return s.alive ? { x: s.x + s.w / 2, y: s.y + s.h / 2 } : null; }
    return src.f.n > 0 ? { x: src.f.x, y: src.f.y } : null;
  }
  function sameSrc(a, b) {
    if (a.k !== b.k) return false;
    return a.k === 'text' ? a.el === b.el : a.k === 'bite' ? a.surf === b.surf : a.f === b.f;
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
        if (a.carry || a.caste === 'q' || (a.caste === 'w' && foe.caste === 's' && Math.random() < .6)) run(a, foe, rand(.6, 1), 1.5);
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
      log((/^[AEIOU]/.test(COL[by.col].name) ? 'An ' : 'A ') + COL[by.col].name + ' ' + (by.caste === 's' ? 'soldier' : by.caste === 'q' ? 'queen' : 'worker') + ' won a duel near ' + placeName(an.x, an.y), by.col);
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
    var k = (phone ? 4 : 7) + (own.length <= 1 ? 2 : 0), c = COL[cid], from = nearestNest(cid, t.x, t.y);
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
    n.owner = cid; n.cap = 0; n.flash = 1.2; n.loot = [];
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
      var owned = nests.filter(function (n) { return n.owner === c.id; }), pop = 0, sold = 0;
      ants.forEach(function (a) { if (a.col === c.id && !a.dead && a.caste !== 'q') { pop++; if (a.caste === 's') sold++; } });
      c.pop = pop; c.sold = sold; c.nests = owned.length;
      c.food += dt * (owned.length <= 1 ? .7 : .35);
      c.spawn -= dt;
      if (c.spawn > 0) return;
      c.spawn = rand(2, 3.6) * (owned.length <= 1 ? .55 : 1);
      if (pop >= Math.min(MAX_POP, 4 + PER_NEST * owned.length) || c.food < 2 || !owned.length) return;
      c.food -= 2;
      var vis = owned.filter(function (n) { return onScreen(n.x, n.y, 100); });
      var n = vis.length && Math.random() < .5 ? pick(vis) : pick(owned);
      var an = makeAnt(c.id, sold / Math.max(1, pop) < .27 ? 's' : 'w', n.x, n.y);
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
      var n = (phone ? 70 : 150) * clamp(Math.min(rain.t / 1.2, (rain.dur - rain.t) / 1.5), 0, 1) * dt;
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
    COL.forEach(function (c) { recruit(c.id, x, y, phone ? 4 : 7).forEach(function (a) { detach(a); a.job = foodJob(f); }); });
    if (calm('sugar', 6)) log('Sugar! Both colonies smell it', 's');
  }
  function feast() {
    var vis = surfs.filter(function (s) { return s.alive && /btn|card|chip|img/.test(s.kind) && onScreen(s.x + s.w / 2, s.y + s.h / 2, -30) && canBite(s); });
    if (!vis.length) return false;
    var s = pick(vis), cx = s.x + s.w / 2, cy = s.y + s.h / 2, cid = Math.random() < .5 ? 0 : 1;
    var crew = recruit(cid, cx, cy, phone ? 4 : 6, function (a) { return a.caste === 'w'; });
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
  }

  /* ------------------------------------------------------------------
     Visitors: fast pointers scare ants, a tap flicks one
     ------------------------------------------------------------------ */
  function scare(x, y, R) {
    ants.forEach(function (a) {
      if (a.dead || a.hidden || a.foe || a.fl > 0 || a.caste === 'q' || dist(a.x, a.y, x, y) > R) return;
      a.flee = rand(.5, .9); a.fx = x; a.fy = y;
      if (a.surf) { detach(a); if (a.job && a.job.k === 'patrol') a.job = null; }
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
      ctx.moveTo(.38, -.035); ctx.lineTo(.5, -.13 + w1); ctx.lineTo(.64, -.1 + w2);
      ctx.moveTo(.38, .035); ctx.lineTo(.5, .13 - w2); ctx.lineTo(.64, .1 - w1);
      if (an.caste === 's') {
        var m = an.foe ? Math.sin(now * 22 + an.seed) * .025 : 0;
        ctx.moveTo(.41, -.06); ctx.quadraticCurveTo(.52, -.08 - m, .55, -.015 - m);
        ctx.moveTo(.41, .06); ctx.quadraticCurveTo(.52, .08 + m, .55, .015 + m);
      }
    }
    ctx.stroke();
    var q = an.caste === 'q', s = an.caste === 's';
    ctx.fillStyle = c.body;
    ctx.beginPath();
    oval(-.3, 0, q ? .34 : .23, q ? .21 : .165);
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
    } else if (it.k === 'corpse') {
      BODY.col = it.col; BODY.L = it.L * .85; BODY.x = hx; BODY.y = hy; BODY.a = an.a + HALF; BODY.alpha = an.alpha;
      drawAnt(BODY);
    }
    ctx.restore();
  }
  function drawNest(n) {
    var c = COL[n.owner], R = n.home ? 15 : 12, i;
    ctx.save();
    ctx.translate(n.x, n.y);
    var g = ctx.createRadialGradient(-R * .3, -R * .35, 1, 0, 0, R * 1.35);
    g.addColorStop(0, PAL.mound); g.addColorStop(1, PAL.mound2);
    ctx.globalAlpha = .92; ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, R * 1.3, R * .9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = PAL.mound2;
    for (i = 0; i < n.grains.length; i++) { var q = n.grains[i]; ctx.fillRect(q.x * R * 1.3, q.y * R * 1.3, q.s, q.s); }
    ctx.globalAlpha = 1; ctx.fillStyle = PAL.hole;
    ctx.beginPath(); ctx.ellipse(0, -1, R * .3, R * .2, 0, 0, TAU); ctx.fill();
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
    ctx.lineCap = 'round'; ctx.setLineDash([1, 6]); ctx.lineWidth = 1.3;
    for (i = 0; i < trails.length; i++) {
      var t = trails[i];
      if (Math.max(t.n.y, t.y) < sy - m || Math.min(t.n.y, t.y) > sy + VH + m) continue;
      ctx.globalAlpha = Math.min(.45, .09 * t.str);
      ctx.strokeStyle = COL[t.col].line;
      ctx.lineDashOffset = -now * 8;
      ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.n.x, t.n.y); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    puddles.forEach(function (p) { if (onScreen(p.x, p.y, p.r + m)) drawPuddle(p); });
    nests.forEach(function (n) { if (onScreen(n.x, n.y, m)) drawNest(n); });
    foods.forEach(function (f) { if (onScreen(f.x, f.y, m)) drawSugar(f); });
    parts.forEach(function (p) { if (p.k === 'ring' && onScreen(p.x, p.y, m)) drawPart(p); });
    ctx.globalAlpha = 1;
    ants.forEach(function (a) { if (a.dead && onScreen(a.x, a.y, m)) drawAnt(a); });
    ants.forEach(function (a) { if (!a.dead && !a.hidden && a.fl <= 0 && onScreen(a.x, a.y, m)) drawAnt(a); });
    ants.forEach(function (a) { if (!a.dead && a.fl > 0 && onScreen(a.x, a.y, m)) drawAnt(a); });
    parts.forEach(function (p) { if (p.k !== 'ring' && onScreen(p.x, p.y, m)) drawPart(p); });
    ctx.globalAlpha = 1;
    if (drops.length) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.strokeStyle = 'rgba(' + PAL.water + ', .5)'; ctx.lineWidth = 1;
      ctx.beginPath();
      drops.forEach(function (d) { var k = d.L / d.vy; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.vx * k, d.y - d.L); });
      ctx.stroke();
    }
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
      var aw = Math.atan2(an.y - an.fy, an.x - an.fx), st = an.v * 1.9 * (an.swim ? .5 : 1) * dt;
      an.a += clamp(angDiff(aw, an.a), -11 * dt, 11 * dt);
      an.x += Math.cos(an.a) * st; an.y += Math.sin(an.a) * st; an.gait += st / (an.L * .28);
      bound(an);
      return;
    }
    if (an.pause > 0) { an.pause -= dt; if (an.surf) placeOn(an, live(an.surf), dt); return; }
    if (!an.job) think(an);
    if (an.job) stepJob(an, dt);
    if (!an.surf) bound(an);
  }
  function frame(t) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(.05, Math.max(0, (t - last) / 1000)) || .016;
    last = t; now += dt; frameNo++;
    sx = window.scrollX || window.pageXOffset || 0; sy = window.scrollY || window.pageYOffset || 0;
    if (every('surf', 2, dt)) { measure(); refreshSurfaces(); refreshTexts(); anchorNests(); }
    if (every('slow', .5, dt)) { tendTrails(.5); watchNests(.5); colonies(.5); cv.classList.toggle('is-covered', !!doc.querySelector('.pst.full, .present, .studio')); }
    if (every('heal', .25, dt)) heal(.25);
    director();
    stepRain(dt);
    stepPuddles(dt);
    foods = foods.filter(function (f) { return f.n > 0; });
    buildGrid();
    contacts(dt);
    for (var i = 0; i < ants.length; i++) {
      /* a decorative layer must never stall the page: an ant that trips gets a fresh start */
      try { stepAnt(ants[i], dt); } catch (err) { var a = ants[i]; a.job = null; a.surf = null; a.foe = null; if (!quiet.err) { quiet.err = 1; console.error(err); } }
    }
    stepParts(dt);
    render();
    if (panelOpen && every('panel', .25, dt)) renderPanel();
    else if (every('badge', 1, dt)) badge.textContent = COL[0].pop + COL[1].pop;
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
    power: svg('M12 3v8M6.3 6.8a8 8 0 1 0 11.4 0')
  };
  var ui = doc.createElement('div');
  ui.className = 'ant-ui';
  ui.innerHTML =
    '<button type="button" class="ant-fab" aria-expanded="false" aria-controls="ant-panel" aria-label="Ant World: open the ant colony panel" title="Ant World">' + ICON.ant + '<span class="ant-fab-n" aria-hidden="true">0</span></button>' +
    '<div class="ant-panel" id="ant-panel" role="dialog" aria-label="Ant World" hidden>' +
      '<div class="ant-hd"><div><b>Ant World</b><span class="ant-jp">蟻の国</span></div><button type="button" class="ant-x" data-ant="close" aria-label="Close the ant panel">' + ICON.close + '</button></div>' +
      '<p class="ant-sub">Two ant colonies live on this site. They walk your buttons, eat letters, swim in puddles and fight for every section. Everything grows back.</p>' +
      '<div class="ant-bar" role="img" aria-label="Territory"><i></i></div>' +
      '<div class="ant-bar-cap"><span>Aka territory</span><span>Kuro territory</span></div>' +
      '<div class="ant-cols">' + COL.map(function (c) { return '<div class="ant-col" data-col="' + c.id + '"><i></i><div><b>' + c.name + '<span>' + c.jp + '</span></b><small>&nbsp;</small></div><em>0</em></div>'; }).join('') + '</div>' +
      '<dl class="ant-stats">' + [['letters', 'Letters eaten'], ['bites', 'Bites'], ['duels', 'Fallen'], ['swims', 'Swims'], ['captures', 'Nests taken'], ['flicks', 'Flicked']].map(function (s) { return '<div><dt>' + s[1] + '</dt><dd data-stat="' + s[0] + '">0</dd></div>'; }).join('') + '</dl>' +
      '<ol class="ant-log"></ol>' +
      '<div class="ant-acts">' +
        '<button type="button" data-ant="sugar" aria-pressed="false">' + ICON.sugar + '<span>Drop sugar</span></button>' +
        '<button type="button" data-ant="water" aria-pressed="false">' + ICON.water + '<span>Spill water</span></button>' +
        '<button type="button" data-ant="rain">' + ICON.rain + '<span>Make it rain</span></button>' +
        '<button type="button" data-ant="war">' + ICON.war + '<span>Start a war</span></button>' +
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
      var row = ui.querySelector('.ant-col[data-col="' + c.id + '"]');
      row.querySelector('em').textContent = c.pop;
      row.querySelector('small').textContent = c.sold + ' soldiers · ' + c.nests + (c.nests === 1 ? ' nest' : ' nests') + ' · food ' + Math.floor(c.food);
    });
    Object.keys(stats).forEach(function (k) { ui.querySelector('[data-stat="' + k + '"]').textContent = stats[k]; });
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
  function aimAt(mode) {
    aim = mode;
    root.classList.toggle('ant-aiming', !!mode);
    ['sugar', 'water'].forEach(function (k) { ui.querySelector('[data-ant="' + k + '"]').setAttribute('aria-pressed', aim === k ? 'true' : 'false'); });
    if (!mode) return;
    if (phone) openPanel(false);
    XR.toast(mode === 'sugar' ? 'Click anywhere to drop sugar. Esc to stop.' : 'Click anywhere to spill water. Esc to stop.');
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
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
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
    else if (!on) return;
    else if (act === 'sugar' || act === 'water') aimAt(aim === act ? null : act);
    else if (act === 'rain') { next.rain = now + rand(75, 130); startRain(); }
    else if (act === 'war') { var a = raid(0), k = raid(1); if (a && k) log('War! Both colonies are on the march', ''); }
    else if (act === 'heal') { restoreAll(); log('The website was restored. The ants are already hungry again', ''); }
    renderPanel();
  });

  /* ---------- page listeners ---------- */
  var pm = { x: 0, y: 0, t: 0 };
  window.addEventListener('pointermove', function (e) {
    if (!on || e.pointerType !== 'mouse') return;
    var t = performance.now(), x = e.clientX + (window.scrollX || 0), y = e.clientY + (window.scrollY || 0), gap = (t - pm.t) / 1000;
    var fast = gap > 0 && gap < .1 && dist(x, y, pm.x, pm.y) / gap > 700;
    pm.x = x; pm.y = y; pm.t = t;
    if (fast) scare(x, y, 42);
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    if (!on || aim || e.button > 0 || (e.target.closest && e.target.closest('.ant-ui'))) return;
    var x = e.clientX + (window.scrollX || 0), y = e.clientY + (window.scrollY || 0), best = null, bd = e.pointerType === 'mouse' ? 13 : 22;
    ants.forEach(function (a) { if (a.hidden || a.gone) return; var d = dist(a.x, a.y, x, y); if (d < bd) { bd = d; best = a; } });
    if (best) flick(best, x, y);
  }, { passive: true });
  window.addEventListener('click', function (e) {
    if (!aim || !on || (e.target.closest && e.target.closest('.ant-ui'))) return;
    e.preventDefault(); e.stopPropagation();
    var x = e.clientX + (window.scrollX || 0), y = e.clientY + (window.scrollY || 0);
    if (aim === 'sugar') dropSugar(x, y);
    else {
      makePuddle(x, y, phone ? 34 : 50);
      ring(x, y, 2, 30, .8, 'water', 1.4);
      if (calm('spill', 8)) log('Someone spilled water. Swimming lessons for everyone', 'w');
    }
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
      measure(); refreshSurfaces(); refreshTexts(); placeNests();
      ants.forEach(bound);
    }, 300);
  });
  window.addEventListener('load', function () { if (built) { measure(); placeNests(); } });
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
    placeNests();
    populate();
    next = { feast: rand(6, 12), raid: rand(14, 24), rain: rand(28, 45), queen: rand(30, 60) };
    now = 0;
  }
  function start() {
    if (start.done) return;
    start.done = true;
    cv.className = 'ant-canvas';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.display = 'none';
    body.appendChild(cv);
    body.appendChild(ui);
    var pref = XR.store(KEY);
    setOn(pref ? pref === 'on' : !XR.reduce, false);
    if (on && !XR.store('xr-ants-hi')) {
      XR.store('xr-ants-hi', 1);
      setTimeout(function () {
        fab.classList.add('is-hint');
        XR.toast('Ants moved in. Tap the ant button to watch the colony war.');
      }, 5000);
    }
  }
  if (XR.onReady) XR.onReady(function () { setTimeout(start, 250); });
  setTimeout(start, 4000);
})();
