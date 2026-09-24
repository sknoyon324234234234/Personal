/* =====================================================================
   XIRAIYA — circuit layer
   A circuit board drawn over the whole page. One main trace runs down the
   margin; buses fork across the empty band above each section and end in
   microchips. As you scroll, a lightning spark races down the trace and
   "discovers" the site: it lights every trace it passes, fires the buses,
   and sends a power pulse through the cards and buttons it reaches.
   Traces are routed around content, never over text. Pure SVG.
   Opt out per page with <body data-circuit="off">.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  var doc = document, root = doc.documentElement, body = doc.body;
  if (!XR || !body || body.getAttribute('data-circuit') === 'off') return;

  var reduce = XR.reduce, phone = XR.phone;
  var NS = 'http://www.w3.org/2000/svg';
  var OBST = 'h1,h2,h3,h4,h5,h6,p,li,a,button,img,picture,video,canvas,iframe,input,select,textarea,label,table,pre,blockquote,figure,.card,.chip,.btn';
  var HIT = '.card,.step,.stat,.btn-primary,[data-cx]';

  /* seeded random, so every page keeps the same board between visits */
  var page = body.getAttribute('data-page') || 'page', seed0 = 7, seed = 7;
  for (var c = 0; c < page.length; c++) seed0 = (seed0 * 31 + page.charCodeAt(c)) % 2147483647;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function node(tag, attrs, parent) {
    var e = doc.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function empty(g) { while (g.firstChild) g.removeChild(g.firstChild); }
  function pathD(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(''); }

  /* polylines: cumulative length, point at length, length at y (trunk is monotonic in y) */
  function poly(pts) {
    var cum = [0], L = 0;
    for (var i = 1; i < pts.length; i++) { L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); cum.push(L); }
    return { pts: pts, cum: cum, len: L };
  }
  function at(pl, l) {
    var p = pl.pts;
    if (l <= 0) return p[0];
    for (var i = 1; i < p.length; i++) {
      if (pl.cum[i] >= l) {
        var seg = (pl.cum[i] - pl.cum[i - 1]) || 1, t = (l - pl.cum[i - 1]) / seg;
        return { x: p[i - 1].x + (p[i].x - p[i - 1].x) * t, y: p[i - 1].y + (p[i].y - p[i - 1].y) * t };
      }
    }
    return p[p.length - 1];
  }
  function lenAtY(pl, y) {
    var p = pl.pts;
    if (y <= p[0].y) return 0;
    for (var i = 1; i < p.length; i++) {
      if (p[i].y >= y) { var t = (y - p[i - 1].y) / ((p[i].y - p[i - 1].y) || 1); return pl.cum[i - 1] + (pl.cum[i] - pl.cum[i - 1]) * t; }
    }
    return pl.len;
  }

  /* jagged lightning between two points (midpoint displacement, calmer at the ends) */
  function jag(x0, y0, x1, y1, n, amp) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, s = 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1);
    for (var i = 1; i < n; i++) {
      var t = i / n, o = (rnd() * 2 - 1) * amp * Math.sin(Math.PI * t);
      s += 'L' + (x0 + dx * t + nx * o).toFixed(1) + ' ' + (y0 + dy * t + ny * o).toFixed(1);
    }
    return s + 'L' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  }

  /* ------------------------------------------------------------------
     Layer
     ------------------------------------------------------------------ */
  var layer = doc.createElement('div');
  layer.className = 'cx-layer';
  layer.setAttribute('aria-hidden', 'true');
  var svg = node('svg', { class: 'cx-svg', focusable: 'false' });
  layer.appendChild(svg);
  var gBase = node('g', { class: 'cx-base' }, svg);
  var gLive = node('g', { class: 'cx-live' }, svg);
  var gPads = node('g', { class: 'cx-pads' }, svg);
  var gFx = node('g', { class: 'cx-fx' }, svg);
  var hot = node('path', { class: 'cx-hot' }, svg);
  var gPk = node('g', { class: 'cx-pks' }, svg);
  var head = node('g', { class: 'cx-head' }, svg);
  node('circle', { class: 'halo', r: 17 }, head);
  node('circle', { class: 'ring', r: 7.5 }, head);
  var bolts = [0, 1, 2].map(function () { return [node('path', { class: 'cx-bolt-g' }, head), node('path', { class: 'cx-bolt' }, head)]; });
  node('circle', { class: 'core', r: 3.8 }, head);
  head.style.display = 'none';
  hot.style.display = 'none';
  body.insertBefore(layer, body.firstChild);

  var W = 0, H = 0, sx = 0, sy = 0, headerH = 76;
  var trunk = [], total = 0, endY = 0, wires = [], hits = [], wireIdx = 0, hitIdx = 0, terminal = null;
  var headY = 0, target = 0, started = false, done = false, hotPc = null;
  var hitSeen = typeof WeakSet === 'function' ? new WeakSet() : null;

  function rectOf(e) {
    var r = e.getBoundingClientRect();
    return { l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy, w: r.width, h: r.height };
  }

  /* everything a trace must not cross: every visible text run, plus media, controls and cards */
  var offscreen = [];
  function obstacles() {
    var out = [], range = doc.createRange();
    offscreen = [];
    function add(r, e) {
      if (r.w < 2 || r.h < 2) return;
      /* content parked past the edges belongs to a slider or marquee that moves under the margin */
      if (r.r < 0 || r.l > W) { offscreen.push(e); return; }
      r.el = e;
      out.push(r);
    }
    [doc.querySelector('main'), doc.querySelector('.site-footer')].forEach(function (scope) {
      if (!scope) return;
      Array.prototype.forEach.call(scope.querySelectorAll(OBST), function (e) {
        if (!e.closest('[aria-hidden="true"]')) add(rectOf(e), e);
      });
      var tw = doc.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null), n;
      while ((n = tw.nextNode())) {
        var pe = n.parentElement;
        if (!/\S/.test(n.nodeValue) || !pe || pe.closest('[aria-hidden="true"], script, style, template')) continue;
        range.selectNodeContents(n);
        var r = range.getBoundingClientRect();
        add({ l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy, w: r.width, h: r.height }, pe);
      }
    });
    return out;
  }

  function sections(obs) {
    var main = doc.querySelector('main');
    if (!main) return [];
    var list = Array.prototype.filter.call(main.children, function (e) { return e.tagName === 'SECTION'; });
    if (list.length < 2) list = [main];
    var foot = doc.querySelector('.site-footer');
    if (foot) list.push(foot);
    var out = [];
    list.forEach(function (s) {
      if (s.hidden || !s.getClientRects().length) return;
      var r = rectOf(s);
      if (r.h < 24) return;
      var cl = Infinity, cr = -Infinity;
      obs.forEach(function (o) {
        if (o.t < r.b && o.b > r.t && s.contains(o.el)) { if (o.l < cl) cl = o.l; if (o.r > cr) cr = o.r; }
      });
      if (cl === Infinity) { cl = W / 2; cr = W / 2; }
      var lane = phone ? clamp(Math.round(cl * 0.45), 4, 30) : clamp(Math.round(cl * 0.5), 6, 72);
      var moving = offscreen.some(function (e) { return s.contains(e); });
      out.push({ el: s, r: r, pad: parseFloat(getComputedStyle(s).paddingTop) || 0, cl: cl, cr: cr, lane: lane, tunnel: moving || cl < 12 || cl - lane < 7 });
    });
    out.sort(function (a, b) { return a.r.t - b.r.t; });
    return out;
  }
  function secAt(secs, y) {
    var s = secs[0];
    for (var i = 1; i < secs.length; i++) if (secs[i].r.t <= y) s = secs[i];
    return s;
  }

  /* ------------------------------------------------------------------
     Build: trunk, buses, heading branches, margin stubs, vias, chips
     ------------------------------------------------------------------ */
  var ends = [];
  function via(x, y, cls, r) {
    var e = node('circle', { class: cls || 'cx-via', cx: x.toFixed(1), cy: y.toFixed(1), r: r || 3 }, gPads);
    ends.push({ x: x, y: y });
    return e;
  }

  /* a microchip: body, a darker side edge for depth, pins and a core that lights */
  function chip(x, y, w, h) {
    var g = node('g', { class: 'cx-chip cx-end', transform: 'translate(' + x.toFixed(1) + ' ' + (y - h / 2).toFixed(1) + ')' }, gPads);
    node('rect', { class: 'side', x: 2, y: 2.5, width: w, height: h, rx: 2.5 }, g);
    node('rect', { class: 'body', x: 0, y: 0, width: w, height: h, rx: 2.5 }, g);
    for (var i = 1; i < 4; i++) {
      var px = (w / 4 * i).toFixed(1);
      node('path', { class: 'pin', d: 'M' + px + ' -4V0M' + px + ' ' + h + 'v4' }, g);
    }
    node('circle', { class: 'core', cx: (w / 2).toFixed(1), cy: (h / 2).toFixed(1), r: 2.2 }, g);
    return g;
  }

  /* a wire lights on its own once the spark passes its trigger y */
  function wire(pts, y, kind, end) {
    var pl = poly(pts), dd = pathD(pts);
    node('path', { d: dd }, gBase);
    var glow = node('path', { d: dd, class: 'cx-glow cx-w' }, gLive), live = node('path', { d: dd, class: 'cx-l cx-w' }, gLive);
    [glow, live].forEach(function (p) { p.style.strokeDasharray = pl.len.toFixed(1) + ' ' + (pl.len + 2).toFixed(1); p.style.strokeDashoffset = pl.len.toFixed(1); });
    var w = { pl: pl, len: pl.len, y: y, kind: kind, glow: glow, live: live, end: end, lit: false };
    wires.push(w);
    return w;
  }

  function buildTrunk(secs) {
    var first = secs[0], last = secs[secs.length - 1];
    var y0 = Math.max(headerH, first.r.t + 10);
    endY = Math.max(y0 + 40, last.r.t + Math.min(56, last.r.h * 0.4));
    var pts = [{ x: first.lane, y: y0 }];
    for (var k = 1; k < secs.length; k++) {
      var a = pts[pts.length - 1].x, b = secs[k].lane, yb = secs[k].r.t, dd = Math.abs(b - a), prevY = pts[pts.length - 1].y;
      if (yb >= endY) break;
      if (dd < 2) { if (yb > prevY + 1) pts.push({ x: a, y: yb }); continue; }
      var ya = Math.max(prevY + 1, yb - dd / 2);
      if (ya + dd >= endY) break;
      pts.push({ x: a, y: ya }, { x: b, y: ya + dd });
    }
    pts.push({ x: pts[pts.length - 1].x, y: Math.max(endY, pts[pts.length - 1].y + 10) });
    endY = pts[pts.length - 1].y;

    trunk = []; total = 0;
    var cur = null;
    for (var j = 1; j < pts.length; j++) {
      var tn = secAt(secs, (pts[j - 1].y + pts[j].y) / 2).tunnel;
      if (!cur || cur.tunnel !== tn) { cur = { tunnel: tn, pts: [pts[j - 1]] }; trunk.push(cur); }
      cur.pts.push(pts[j]);
    }
    trunk.forEach(function (pc) {
      var pl = poly(pc.pts), dd = pathD(pc.pts);
      pc.pl = pl; pc.len = pl.len; pc.off = total; pc.y0 = pc.pts[0].y; pc.y1 = pc.pts[pc.pts.length - 1].y; pc.shown = -1;
      total += pl.len;
      if (pc.tunnel) { node('path', { d: dd, class: 'cx-tn' }, gBase); return; }
      node('path', { d: dd }, gBase);
      pc.glow = node('path', { d: dd, class: 'cx-glow', 'stroke-dasharray': pl.len + ' ' + (pl.len + 2), 'stroke-dashoffset': pl.len }, gLive);
      pc.live = node('path', { d: dd, class: 'cx-l', 'stroke-dasharray': pl.len + ' ' + (pl.len + 2), 'stroke-dashoffset': pl.len }, gLive);
      /* a second, thinner rail beside the main trace (a shifted copy has the same length) */
      if (Math.min.apply(null, pc.pts.map(function (q) { return q.x; })) >= 14) {
        var d2 = pathD(pc.pts.map(function (q) { return { x: q.x - 5, y: q.y }; }));
        node('path', { d: d2, class: 'cx-b2' }, gBase);
        pc.live2 = node('path', { d: d2, class: 'cx-l2', 'stroke-dasharray': pl.len + ' ' + (pl.len + 2), 'stroke-dashoffset': pl.len }, gLive);
      }

      /* vias along the trace, some with a short stub into the margin */
      for (var l = 90 + rnd() * 120; l < pl.len - 60; l += 240 + rnd() * 260) {
        var p = at(pl, l), sec = secAt(secs, p.y);
        if (sec.lane >= 16 && rnd() < 0.55) {
          var s = Math.min(sec.lane - 7, 12), down = 10 + rnd() * 26;
          var w = wire([{ x: p.x, y: p.y }, { x: p.x - s, y: p.y + s }, { x: p.x - s, y: p.y + s + down }], p.y, 'stub');
          w.end = via(p.x - s, p.y + s + down, 'cx-via cx-end', 2.4);
        } else {
          wires.push({ y: p.y, kind: 'via', end: via(p.x, p.y, 'cx-via', 2.6), lit: false });
        }
      }
    });

    var tp = pts[pts.length - 1];
    terminal = chip(tp.x - 8, tp.y + 16, 16, 24);
    node('path', { d: 'M' + tp.x.toFixed(1) + ' ' + tp.y.toFixed(1) + 'V' + (tp.y + 4).toFixed(1) }, gBase);
  }

  function buildBuses(secs, obs) {
    secs.forEach(function (s, k) {
      if (s.tunnel || s.pad < (phone ? 36 : 48)) return;
      var yb = Math.round(s.r.t + s.pad * 0.5), x0 = s.lane;
      if (yb < headerH + 24 || yb > endY) return;
      var st = Math.min(10, s.pad * 0.18), stop = W - 8, blocked = false;
      obs.forEach(function (o) {
        if (o.t - 13 >= yb || o.b + 13 <= yb || o.r <= x0) return;
        if (o.l <= x0 + 4) blocked = true; else if (o.l < stop) stop = o.l;
      });
      if (blocked) return;
      var clear = stop >= W - 8, rl = W - s.cr, room = (clear ? W - clamp(rl * 0.5, 6, 72) : stop - 18) - x0;
      if (room < 80) return;
      var dir = rnd() < 0.5 ? -1 : 1, full = clear && rl >= 18 && (k % 2 === 1 || rnd() < 0.35), y2 = yb + dir * st, drop = 0;
      var endX = full ? x0 + room : clear ? x0 + room * (0.3 + rnd() * 0.35) : x0 + room - 32;
      if (full) {
        /* the drop stays inside this section and stops above anything in its way */
        var dTop = y2 + st;
        drop = Math.min(s.r.h * 0.35, 240, s.r.b - dTop - 12);
        obs.forEach(function (o) { if (o.l - 10 < endX && o.r + 10 > endX && o.b > dTop && o.t - 14 < dTop + drop) drop = Math.min(drop, o.t - 14 - dTop); });
        if (drop < 24) { full = false; endX = x0 + room * (0.3 + rnd() * 0.35); }
      }
      if (endX - x0 < 60) return;
      var xj = x0 + (endX - x0) * (0.22 + rnd() * 0.3);
      var pts = [{ x: x0, y: yb }, { x: xj, y: yb }, { x: xj + st, y: y2 }, { x: endX, y: y2 }], end;
      if (full) {
        pts[3] = { x: endX - st, y: y2 };
        pts.push({ x: endX, y: y2 + st }, { x: endX, y: y2 + st + drop });
        end = via(endX, y2 + st + drop, 'cx-via cx-end', 3);
      } else {
        end = chip(endX, y2, 26, 15);
      }
      wire(pts, yb, 'bus', end);

      /* a side branch off the bus, still inside the empty band */
      if (!phone && endX - x0 > 220 && rnd() < 0.6) {
        var bx = x0 + (endX - x0) * (0.55 + rnd() * 0.25), by = y2, bl = 16 + rnd() * 26;
        if (bx > xj + st + 10 && bx + st + bl < endX - 10) {
          var sb = wire([{ x: bx, y: by }, { x: bx + st, y: by - dir * st }, { x: bx + st + bl, y: by - dir * st }], yb + 0.1, 'stub');
          sb.delay = (bx - x0) * 1.1;
          sb.end = via(bx + st + bl, by - dir * st, 'cx-via cx-end', 2.4);
        }
      }
    });
  }

  function buildBranches(secs, obs) {
    secs.forEach(function (s) {
      var h = s.el.querySelector('h1, h2');
      if (s.tunnel || !h) return;
      var r = rectOf(h);
      if (r.w < 2) return;
      var y = Math.round(r.t + Math.min(22, r.h / 2)), x1 = r.l - 14;
      if (x1 - s.lane < 22) return;
      var hitsIt = obs.some(function (o) { return o.el !== h && !h.contains(o.el) && o.t - 6 < y && o.b + 6 > y && o.r > s.lane && o.l < x1; });
      if (hitsIt) return;
      var w = wire([{ x: s.lane, y: y }, { x: x1, y: y }], y, 'branch');
      w.end = via(x1, y, 'cx-pad cx-end', 3.6);
    });
  }

  function buildHits(secs) {
    hits = [];
    var main = doc.querySelector('main');
    if (!main || reduce) return;
    Array.prototype.forEach.call(main.querySelectorAll(HIT), function (e) {
      if (e.closest('[aria-hidden="true"]') || (hitSeen && hitSeen.has(e))) return;
      var r = rectOf(e);
      if (r.w < 2 || r.h < 2 || r.r < 0 || r.l > W) return;
      var y = r.t + Math.min(36, r.h * 0.3);
      hits.push({ el: e, y: y, delay: clamp((r.l - secAt(secs, y).lane) * 0.5, 0, 480) });
    });
    hits.sort(function (a, b) { return a.y - b.y; });
    if (hits.length > 160) hits.length = 160;
  }

  function layout() {
    layer.style.height = '0px';
    W = root.clientWidth;
    H = Math.max(root.scrollHeight, body.scrollHeight);
    sx = scrollX; sy = scrollY;
    layer.style.width = W + 'px';
    layer.style.height = H + 'px';
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 76;
    seed = seed0;
    [gBase, gLive, gPads, gFx].forEach(empty);
    wires = []; trunk = []; ends = []; hotPc = null;
    var obs = obstacles(), secs = sections(obs);
    if (!secs.length) return false;
    buildTrunk(secs);
    buildBuses(secs, obs);
    buildBranches(secs, obs);
    wires.sort(function (a, b) { return a.y - b.y; });
    buildHits(secs);
    wireIdx = 0; hitIdx = 0;
    return true;
  }

  /* ------------------------------------------------------------------
     Discovery: the spark lights everything above it
     ------------------------------------------------------------------ */
  function pointAtY(y) {
    for (var i = 0; i < trunk.length; i++) {
      var pc = trunk[i];
      if (y <= pc.y1 || i === trunk.length - 1) {
        var l = lenAtY(pc.pl, y), p = at(pc.pl, l);
        return { x: p.x, y: p.y, l: l, pc: pc, tunnel: pc.tunnel };
      }
    }
    return null;
  }
  function globalAt(L) {
    for (var i = 0; i < trunk.length; i++) {
      var pc = trunk[i];
      if (L <= pc.off + pc.len || i === trunk.length - 1) { var p = at(pc.pl, L - pc.off); return { x: p.x, y: p.y, tunnel: pc.tunnel }; }
    }
    return null;
  }
  function globalLenAtY(y) { var p = pointAtY(y); return p ? p.pc.off + p.l : 0; }

  function flash(x0, y0, x1, y1, amp, group) {
    if (reduce) return;
    var dd = jag(x0, y0, x1, y1, Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 14)), amp);
    var g = node('path', { class: 'cx-bolt-g cx-flash', d: dd }, group || gFx), b = node('path', { class: 'cx-bolt cx-flash', d: dd }, group || gFx);
    setTimeout(function () { g.remove(); b.remove(); }, 260);
  }

  function lightEnd(w) {
    if (!w.end) return;
    w.end.classList.add('on');
  }
  function fireWire(w, animate) {
    if (w.lit) return;
    w.lit = true;
    if (!w.live) { lightEnd(w); return; }
    var ms = animate && !reduce ? clamp(w.len * 1.1, 200, 900) : 0, delay = animate ? (w.delay || 0) : 0;
    function go() {
      [w.glow, w.live].forEach(function (p) { p.style.transitionDuration = ms + 'ms'; p.style.strokeDashoffset = '0'; });
      if (ms) {
        var a = w.pl.pts[0], b = at(w.pl, Math.min(w.len, 70));
        flash(a.x, a.y, b.x, b.y, 4);
        setTimeout(function () { lightEnd(w); }, ms);
      } else lightEnd(w);
    }
    if (delay && !reduce) setTimeout(go, delay); else go();
  }
  function fireHit(h, animate) {
    if (hitSeen) hitSeen.add(h.el);
    if (!animate) return;
    var r = h.el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    setTimeout(function () {
      h.el.classList.remove('cx-hit');
      void h.el.offsetWidth;
      h.el.classList.add('cx-hit');
      setTimeout(function () { h.el.classList.remove('cx-hit'); }, 1400);
    }, h.delay);
  }

  function advance(animate) {
    trunk.forEach(function (pc) {
      if (pc.tunnel) return;
      var l = headY >= pc.y1 ? pc.len : headY <= pc.y0 ? 0 : lenAtY(pc.pl, headY);
      if (Math.abs(l - pc.shown) < 0.5) return;
      pc.shown = l;
      var off = (pc.len - l).toFixed(1);
      pc.live.setAttribute('stroke-dashoffset', off);
      pc.glow.setAttribute('stroke-dashoffset', off);
      if (pc.live2) pc.live2.setAttribute('stroke-dashoffset', off);
    });
    while (wireIdx < wires.length && wires[wireIdx].y <= headY) fireWire(wires[wireIdx++], animate);
    while (hitIdx < hits.length && hits[hitIdx].y <= headY) fireHit(hits[hitIdx++], animate);
    if (!done && headY >= endY - 0.5) finish(animate);
  }

  function finish(animate) {
    done = true;
    if (terminal) terminal.classList.add('on');
    head.style.display = 'none';
    hot.style.display = 'none';
    if (!animate || !terminal) return;
    var p = pointAtY(endY);
    for (var i = 0; i < 4; i++) {
      var a = Math.PI * (0.15 + rnd() * 0.7) * (rnd() < 0.5 ? 1 : -1) + (rnd() < 0.5 ? 0 : Math.PI);
      flash(p.x, p.y + 20, p.x + Math.cos(a) * (26 + rnd() * 30), p.y + 20 + Math.sin(a) * (26 + rnd() * 30), 6);
    }
  }

  /* ------------------------------------------------------------------
     Header circuit: a trace along the header, wired into the main trace.
     Its drop line follows the main trace's lane as you scroll, its bus
     charges up with how much of the page the spark has discovered, and
     hovering a link fires a packet to that link's pad.
     ------------------------------------------------------------------ */
  var hdr = doc.getElementById('site-header'), hs = null;
  function laneNow() {
    var p = trunk.length ? pointAtY(scrollY + headerH) : null;
    return p ? p.x : 20;
  }
  function spineD() {
    var y = hs.y, x = hs.lane, bx = hs.bx;
    return pathD([{ x: bx, y: hs.top }, { x: bx, y: y - 6 }, { x: bx - 6, y: y }, { x: Math.min(bx - 6, x + 6), y: y }, { x: x, y: y + 6 }, { x: x, y: hs.h + 4 }]);
  }
  function buildHeader() {
    if (!hdr) return;
    if (!hs) {
      hs = { svg: node('svg', { class: 'cx-hdr', 'aria-hidden': 'true', focusable: 'false' }), run: null };
      hs.base = node('g', { class: 'cx-base' }, hs.svg);
      hs.live = node('g', { class: 'cx-live' }, hs.svg);
      hs.pads = node('g', { class: 'cx-pads' }, hs.svg);
      hs.fx = node('g', { class: 'cx-fx' }, hs.svg);
      hs.pk = node('circle', { class: 'cx-pk cx-pk-b', r: 2.2 }, hs.svg);
      hs.pk.style.display = 'none';
      hdr.appendChild(hs.svg);
      var aim = function (e) {
        var a = e.target && e.target.closest && e.target.closest('.hdr-nav a, .hdr-actions .btn');
        if (!a || !hs.map || reduce) return;
        var m = hs.map.filter(function (k) { return k.el === a; })[0];
        if (m && (!hs.run || hs.run.to !== m)) hs.run = { to: m, x: hs.bx };
      };
      hdr.addEventListener('pointerover', aim);
      hdr.addEventListener('focusin', aim);
    }
    [hs.base, hs.live, hs.pads, hs.fx].forEach(empty);
    var hr = hdr.getBoundingClientRect(), w = Math.round(root.clientWidth), h = Math.round(hr.height) || headerH;
    hs.svg.setAttribute('width', w);
    hs.svg.setAttribute('height', h + 4);
    hs.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + (h + 4));
    function rel(e) { var r = e.getBoundingClientRect(); return { l: r.left - hr.left, r: r.right - hr.left, t: r.top - hr.top, b: r.bottom - hr.top, w: r.width }; }
    var mark = hdr.querySelector('.brand-mark'), mr = mark ? rel(mark) : null;
    hs.h = h; hs.y = h - 9; hs.lane = laneNow();
    hs.bx = mr && mr.w ? (mr.l + mr.r) / 2 : hs.lane + 24;
    hs.top = mr && mr.w ? mr.b + 3 : hs.y - 10;
    hs.spineBase = node('path', { d: spineD() }, hs.base);
    hs.spine = node('path', { class: 'cx-l', d: spineD() }, hs.live);
    if (mr && mr.w) node('circle', { class: 'cx-pad on', cx: hs.bx.toFixed(1), cy: hs.top.toFixed(1), r: 2.6 }, hs.pads);

    /* the bus along the bottom of the header, with a pad under every link */
    var x1 = w - 10, pts = [{ x: hs.bx, y: hs.y }, { x: x1, y: hs.y }], dd = pathD(pts), len = Math.max(1, x1 - hs.bx);
    node('path', { d: dd }, hs.base);
    hs.busLen = len;
    hs.busGlow = node('path', { class: 'cx-glow', d: dd, 'stroke-dasharray': len + ' ' + (len + 2), 'stroke-dashoffset': len }, hs.live);
    hs.bus = node('path', { class: 'cx-l', d: dd, 'stroke-dasharray': len + ' ' + (len + 2), 'stroke-dashoffset': len }, hs.live);
    node('circle', { class: 'cx-via on', cx: x1, cy: hs.y, r: 2.4 }, hs.pads);
    hs.shown = -1;
    hs.map = [];
    Array.prototype.forEach.call(hdr.querySelectorAll('.hdr-nav a, .hdr-actions .btn'), function (a) {
      var r = rel(a);
      if (r.w < 2) return;
      var x = (r.l + r.r) / 2, cur = a.getAttribute('aria-current') === 'page';
      node('path', { d: 'M' + x.toFixed(1) + ' ' + (hs.y - 4) + 'V' + hs.y }, hs.base);
      hs.map.push({ el: a, x: x, top: r.b, pad: node('circle', { class: cur ? 'cx-pad on' : 'cx-via', cx: x.toFixed(1), cy: hs.y, r: cur ? 3.2 : 2.4 }, hs.pads) });
    });
    drawHeader(0);
  }
  function drawHeader(dt) {
    if (!hs) return;
    /* the drop line follows the main trace's lane */
    var lane = laneNow();
    if (Math.abs(lane - hs.lane) > 0.4) { hs.lane = lane; var dd = spineD(); hs.spine.setAttribute('d', dd); hs.spineBase.setAttribute('d', dd); }
    /* the bus charges with the share of the page discovered so far */
    var pct = reduce ? 1 : endY ? clamp(headY / endY, 0, 1) : 0, l = hs.busLen * pct;
    if (Math.abs(l - hs.shown) > 0.5) {
      hs.shown = l;
      hs.bus.setAttribute('stroke-dashoffset', (hs.busLen - l).toFixed(1));
      hs.busGlow.setAttribute('stroke-dashoffset', (hs.busLen - l).toFixed(1));
    }
    /* hover packet: runs from the junction to the link, then sparks up into it */
    var run = hs.run;
    if (!run) { hs.pk.style.display = 'none'; return; }
    var dir = run.to.x >= run.x ? 1 : -1;
    run.x += dir * 1100 * dt;
    if ((dir > 0 && run.x >= run.to.x) || (dir < 0 && run.x <= run.to.x)) {
      var pad = run.to.pad;
      pad.classList.remove('ping'); void pad.getBBox(); pad.classList.add('ping');
      flash(run.to.x, hs.y, run.to.x, Math.min(hs.y - 6, run.to.top + 2), 3, hs.fx);
      hs.run = null;
      hs.pk.style.display = 'none';
      return;
    }
    hs.pk.style.display = '';
    hs.pk.setAttribute('cx', run.x.toFixed(1));
    hs.pk.setAttribute('cy', hs.y);
  }

  /* ------------------------------------------------------------------
     Frame: move the spark, crackle, flow packets
     ------------------------------------------------------------------ */
  var raf = 0, lastT = 0, crackleT = 0, arcT = 0, pkt = [], busPk = [], busT = 0;
  for (var q = 0; q < (phone ? 3 : 6); q++) pkt.push({ el: node('circle', { class: 'cx-pk', r: 2.3 }, gPk), l: -1, v: 240 + q * 37 });
  for (var u = 0; u < 4; u++) busPk.push({ el: node('circle', { class: 'cx-pk cx-pk-b', r: 2 }, gPk), w: null, l: 0 });

  function drawHead(now, moving) {
    var p = !done && started ? pointAtY(headY) : null;
    var vis = p && !p.tunnel;
    head.style.display = vis ? '' : 'none';
    hot.style.display = vis ? '' : 'none';
    if (!vis) return;
    head.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
    if (p.pc !== hotPc) { hotPc = p.pc; hot.setAttribute('d', pathD(p.pc.pts)); hot.setAttribute('stroke-dasharray', '170 ' + (p.pc.len + 180).toFixed(0)); }
    hot.setAttribute('stroke-dashoffset', (170 - p.l).toFixed(1));
    /* while it races, the spark arcs to the vias it passes */
    if (moving && now > arcT) {
      arcT = now + 140 + rnd() * 220;
      var near = ends.filter(function (e) { return Math.abs(e.y - p.y) < 150 && Math.abs(e.x - p.x) < 260; });
      if (near.length) { var e = near[Math.floor(rnd() * near.length)]; flash(p.x, p.y, e.x, e.y, 7); }
    }
    if (now - crackleT < (moving ? 55 : 230)) return;
    crackleT = now;
    bolts.forEach(function (b, i) {
      if (!moving && i === 2) { b[0].setAttribute('d', ''); b[1].setAttribute('d', ''); return; }
      var a = rnd() * Math.PI * 2, len = (moving ? 18 : 10) + rnd() * (moving ? 28 : 14), dd = jag(0, 0, Math.cos(a) * len, Math.sin(a) * len, 5, 5);
      b[0].setAttribute('d', dd);
      b[1].setAttribute('d', dd);
      b[1].style.opacity = (0.45 + rnd() * 0.55).toFixed(2);
    });
  }

  function drawPackets(dt, now) {
    var top = scrollY - 80, bot = Math.min(headY, scrollY + innerHeight + 80);
    var l0 = globalLenAtY(top), l1 = globalLenAtY(bot);
    pkt.forEach(function (k) {
      if (!started || l1 - l0 < 50) { k.el.style.display = 'none'; k.l = -1; return; }
      if (k.l < l0 || k.l > l1) k.l = l0 + rnd() * Math.max(1, (l1 - l0) * 0.6);
      k.l += k.v * dt;
      var p = globalAt(k.l);
      if (!p || p.tunnel || k.l > l1) { k.el.style.display = 'none'; return; }
      k.el.style.display = '';
      k.el.setAttribute('cx', p.x.toFixed(1));
      k.el.setAttribute('cy', p.y.toFixed(1));
    });

    /* now and then a packet rides a lit bus out to its chip */
    if (now > busT) {
      busT = now + 700 + rnd() * 1300;
      var free = busPk.filter(function (b) { return !b.w; })[0];
      var vis = wires.filter(function (w) { return w.kind === 'bus' && w.lit && w.y > scrollY && w.y < scrollY + innerHeight; });
      if (free && vis.length) { free.w = vis[Math.floor(rnd() * vis.length)]; free.l = 0; }
    }
    busPk.forEach(function (b) {
      if (!b.w) { b.el.style.display = 'none'; return; }
      b.l += 380 * dt;
      if (b.l >= b.w.len) {
        var e = b.w.end;
        if (e) { e.classList.remove('ping'); void e.getBBox(); e.classList.add('ping'); }
        b.w = null; b.el.style.display = 'none';
        return;
      }
      var p = at(b.w.pl, b.l);
      b.el.style.display = '';
      b.el.setAttribute('cx', p.x.toFixed(1));
      b.el.setAttribute('cy', p.y.toFixed(1));
    });
  }

  function frame(now) {
    raf = 0;
    if (doc.hidden) { lastT = 0; return; }
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016;
    lastT = now;
    var moving = false;
    if (started && !done && headY < target) {
      var gap = target - headY, v = clamp(gap * 4.5, 380, 5200);
      headY = Math.min(target, headY + v * dt);
      moving = true;
      advance(true);
    }
    drawHead(now, moving);
    drawPackets(dt, now);
    drawHeader(dt);
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !reduce) raf = requestAnimationFrame(frame); }

  function onScroll() {
    var t = scrollY + innerHeight * 0.62;
    if (scrollY + innerHeight >= H - 4) t = H;
    if (t > target) target = t;
  }

  /* ------------------------------------------------------------------
     Start + relayout
     ------------------------------------------------------------------ */
  function rebuild() {
    if (!layout()) return;
    buildHeader();
    /* anything the spark already passed comes back lit, without replaying */
    trunk.forEach(function (pc) { pc.shown = -1; });
    advance(false);
    if (done) { if (terminal) terminal.classList.add('on'); head.style.display = 'none'; hot.style.display = 'none'; }
  }
  var rt = 0;
  function queue() { clearTimeout(rt); rt = setTimeout(rebuild, 180); }

  function start() {
    rebuild();
    if (reduce) {
      /* reduced motion: the whole board is simply on, no spark and no flow */
      headY = target = H;
      advance(false);
      drawHeader(0);
      window.addEventListener('scroll', function () { drawHeader(0); }, { passive: true });
      return;
    }
    headY = trunk.length ? trunk[0].y0 : 0;
    started = true;
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) kick(); });
    kick();
  }

  window.addEventListener('resize', queue);
  if ('ResizeObserver' in window) new ResizeObserver(queue).observe(body);
  var begun = false;
  function begin() { if (!begun) { begun = true; start(); } }
  if (XR.onReady) XR.onReady(begin);
  setTimeout(begin, 9000); /* safety net if the ready signal never comes */
})();
