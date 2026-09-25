/* =====================================================================
   XIRAIYA — core engine
   Header / footer, page transitions, reveals, split text,
   counters, marquee, parallax, magnetic buttons, toasts, mascot, petals.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.XIRAIYA_CONFIG || {};
  var SERVICES = window.XIRAIYA_SERVICES || [];
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var phone = window.matchMedia('(max-width: 760px)').matches;
  var page = document.body.getAttribute('data-page') || '';
  var icon = window.XRIcon || function () { return ''; };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function get(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) {
    try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; }
  }
  function fmtPrice(n) { return (C.currency || '$') + Number(n).toLocaleString('en-US'); }

  /* ------------------------------------------------------------------
     Brand mark + mascot (inline SVG so they animate)
     ------------------------------------------------------------------ */
  var uid = 0;
  function brandMark(cls) {
    var id = 'bm' + (++uid);
    return '<svg class="brand-mark ' + (cls || '') + '" viewBox="0 0 40 40" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0442e"/><stop offset="1" stop-color="#d9a441"/></linearGradient></defs>' +
      '<path d="M20 2 38 20 20 38 2 20Z" fill="none" stroke="url(#' + id + ')" stroke-width="2.2"/>' +
      '<path d="M12 11h5.5L28 29h-5.5Z" fill="#efe4cc"/>' +
      '<path d="M28 11h-5.5L12 29h5.5Z" fill="url(#' + id + ')"/></svg>';
  }

  /* ------------------------------------------------------------------
     Characters. Both are original designs drawn in code, loosely inspired by
     the 1839 folk tale of Jiraiya the toad sage and the slug princess. The
     hair is built from tapered, curved locks so it reads as hair, not spikes.
     ------------------------------------------------------------------ */
  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function lockPath(x, y, ang, len, w, bend) {
    // a tapered lock with a soft belly and an S-curve, so hair reads as hair
    var dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    var tx = x + dx * len + px * bend * .55, ty = y + dy * len + py * bend * .55;
    var c1x = x + dx * len * .34 + px * bend, c1y = y + dy * len * .34 + py * bend;
    var c2x = x + dx * len * .72 + px * bend * .85, c2y = y + dy * len * .72 + py * bend * .85;
    return 'M' + r1(x + px * w / 2) + ' ' + r1(y + py * w / 2) +
      'C' + r1(c1x + px * w * .56) + ' ' + r1(c1y + py * w * .56) + ' ' + r1(c2x + px * w * .28) + ' ' + r1(c2y + py * w * .28) + ' ' + r1(tx) + ' ' + r1(ty) +
      'C' + r1(c2x - px * w * .22) + ' ' + r1(c2y - py * w * .22) + ' ' + r1(c1x - px * w * .46) + ' ' + r1(c1y - py * w * .46) + ' ' + r1(x - px * w / 2) + ' ' + r1(y - py * w / 2) + 'Z';
  }
  function strandPath(x, y, ang, len, bend, off) {
    var dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    return 'M' + r1(x + px * off) + ' ' + r1(y + py * off) + 'C' + r1(x + dx * len * .34 + px * (bend + off * .6)) + ' ' + r1(y + dy * len * .34 + py * (bend + off * .6)) + ' ' +
      r1(x + dx * len * .66 + px * (bend * .85 + off * .3)) + ' ' + r1(y + dy * len * .66 + py * (bend * .85 + off * .3)) + ' ' + r1(x + dx * len * .86 + px * bend * .62) + ' ' + r1(y + dy * len * .86 + py * bend * .62);
  }
  /* a bundle of locks: [x, y, angleDeg, length, width, bend] */
  function hairLocks(list, fill, edge, strand) {
    var body = '', lines = '';
    list.forEach(function (l) {
      var a = l[2] * Math.PI / 180;
      body += '<path d="' + lockPath(l[0], l[1], a, l[3], l[4], l[5]) + '"/>';
      lines += '<path d="' + strandPath(l[0], l[1], a, l[3], l[5], l[4] * .12) + '"/>';
    });
    return '<g fill="' + fill + '" stroke="' + edge + '" stroke-width="1" stroke-linejoin="round">' + body + '</g>' +
      '<g fill="none" stroke="' + strand + '" stroke-width="1.1" stroke-linecap="round" opacity=".75">' + lines + '</g>';
  }
  function eyePair(p, o) {
    // o: {y, gap, iris, lash, lid}. Anime-style eye: almond white, a big layered iris with
    // a lid shadow and two catch-lights, a tapered lash line that thickens outward, a crease.
    var y = o.y, out = '';
    [[200 - o.gap, -1, 'el', ''], [200 + o.gap, 1, 'er', ' m-eye-r']].forEach(function (e) {
      var cx = e[0], s = e[1], X = function (v) { return r1(cx + v * s); }, Y = function (v) { return r1(y + v); };
      var white = 'M' + X(-13) + ' ' + Y(1.5) + 'C' + X(-9) + ' ' + Y(-6.5) + ' ' + X(5) + ' ' + Y(-8) + ' ' + X(13) + ' ' + Y(-2) + 'C' + X(10) + ' ' + Y(4.5) + ' ' + X(1) + ' ' + Y(6.8) + ' ' + X(-9) + ' ' + Y(5.2) + 'Z';
      out += '<clipPath id="' + p + e[2] + '"><path d="' + white + '"/></clipPath>' +
        '<g class="m-eye' + e[3] + '"><path d="' + white + '" fill="#fdf9f2"/>' +
        '<g clip-path="url(#' + p + e[2] + ')">' +
          '<g class="m-iris"><circle cx="' + X(1) + '" cy="' + Y(0) + '" r="7.4" fill="url(#' + p + 'i)"/>' +
            '<circle cx="' + X(1) + '" cy="' + Y(0) + '" r="7.4" fill="none" stroke="' + o.iris + '" stroke-width="1.2"/>' +
            '<ellipse cx="' + X(1) + '" cy="' + Y(3.6) + '" rx="4.6" ry="2.2" fill="#ffdca6" opacity=".45"/>' +
            '<circle cx="' + X(1) + '" cy="' + Y(.2) + '" r="3.1" fill="#120a05"/>' +
            '<circle cx="' + X(-1.6) + '" cy="' + Y(-3) + '" r="2" fill="#fff"/><circle cx="' + X(3.6) + '" cy="' + Y(2.8) + '" r=".95" fill="#fff" opacity=".9"/></g>' +
          '<path d="M' + X(-14) + ' ' + Y(-9) + 'H' + X(14) + 'V' + Y(-3.2) + 'C' + X(6) + ' ' + Y(-6.5) + ' ' + X(-6) + ' ' + Y(-6) + ' ' + X(-14) + ' ' + Y(-1) + 'Z" fill="#2a160c" opacity=".3"/>' +
        '</g>' +
        '<path d="M' + X(-14) + ' ' + Y(1.6) + 'C' + X(-9) + ' ' + Y(-8.2) + ' ' + X(6) + ' ' + Y(-9.8) + ' ' + X(14.5) + ' ' + Y(-2.6) + (o.lash ? 'L' + X(18) + ' ' + Y(-6.4) + 'L' + X(14.6) + ' ' + Y(-.6) : 'L' + X(15.6) + ' ' + Y(-1.4)) +
          'C' + X(6) + ' ' + Y(-6.6) + ' ' + X(-8) + ' ' + Y(-5.8) + ' ' + X(-12.6) + ' ' + Y(1.6) + 'Z" fill="' + o.lid + '"/>' +
        (o.lash ? '<path d="M' + X(9.5) + ' ' + Y(-6.2) + 'l' + r1(2.8 * s) + ' -3.6M' + X(5.4) + ' ' + Y(-7.6) + 'l' + r1(1.8 * s) + ' -3.6" stroke="' + o.lid + '" stroke-width="1.3" stroke-linecap="round"/>' : '') +
        '<path d="M' + X(-8.6) + ' ' + Y(5.4) + 'C' + X(-2) + ' ' + Y(7.6) + ' ' + X(6) + ' ' + Y(6.8) + ' ' + X(11) + ' ' + Y(1.8) + '" stroke="' + o.lid + '" stroke-width="1" fill="none" opacity=".5" stroke-linecap="round"/>' +
        '<path d="M' + X(-10.5) + ' ' + Y(-10.6) + 'C' + X(-3) + ' ' + Y(-14) + ' ' + X(6) + ' ' + Y(-13.6) + ' ' + X(12.5) + ' ' + Y(-8) + '" stroke="#b97d62" stroke-width="1.1" fill="none" opacity=".55" stroke-linecap="round"/>' +
        '</g>';
    });
    return out;
  }
  /* soft modelling on a face: cheekbone, nose tip, under-lip and a chin highlight */
  function faceModel(shade) {
    return '<ellipse cx="226" cy="150" rx="9" ry="14" fill="' + shade + '" opacity=".08"/>' +
      '<ellipse cx="201" cy="151" rx="4.5" ry="2" fill="' + shade + '" opacity=".28"/>' +
      '<path d="M195 170C198 171.5 203 171.5 206 170" stroke="' + shade + '" stroke-width="1.6" fill="none" opacity=".2" stroke-linecap="round"/>' +
      '<ellipse cx="197" cy="176" rx="6" ry="2.4" fill="#fff" opacity=".18"/>';
  }
  function stage(p, c1, c2) {
    return '<circle cx="200" cy="280" r="200" fill="url(#' + p + 'g)"/>' +
      '<g transform="translate(200 510) scale(1 .22)" opacity=".9"><g class="m-spin"><circle r="172" fill="none" stroke="' + c1 + '" stroke-width="3"/><circle r="152" fill="none" stroke="' + c1 + '" stroke-opacity=".5" stroke-width="2" stroke-dasharray="2 9"/>' +
      '<path d="M0-172V-124M0 172V124M-172 0H-124M172 0H124" stroke="' + c1 + '" stroke-width="3"/></g><g class="m-spin rev"><circle r="104" fill="none" stroke="' + c2 + '" stroke-opacity=".75" stroke-width="2"/></g></g>' +
      '<ellipse cx="200" cy="512" rx="96" ry="9" fill="#3a2a1e" opacity=".16"/>';
  }
  /* a kimono sleeve on a bent arm: the upper arm hangs from the shoulder, the forearm
     turns in toward the hands and the wide sleeve drapes under it */
  function sleeve(fill, dark, fold, right, dx) {
    var body = '<path d="M139 222C122 230 112 254 108 290C104 324 102 362 106 398C108 414 120 423 137 421C151 419 160 409 162 395L164 364C163 357 159 351 154 348C146 338 136 322 132 304C132 286 138 262 150 246C150 236 146 228 139 222Z" fill="' + fill + '" stroke="' + dark + '" stroke-width="1.2"/>' +
      '<path d="M106 398C108 414 120 423 137 421C151 419 160 409 162 395L161 386C156 400 146 408 134 409C122 410 112 404 107 390Z" fill="' + dark + '"/>' +
      '<path d="M149 345C157 347 164 355 164 366C158 361 150 359 143 359Z" fill="' + dark + '"/>' +
      '<path d="M118 300C114 336 114 372 118 402M136 336C134 360 136 386 142 408" stroke="' + fold + '" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/>' +
      '<path d="M150 247C138 263 132 287 132 305C136 322 145 337 153 347" stroke="' + dark + '" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>';
    return '<g class="m-sleeve' + (right ? ' r' : '') + '"><g transform="' + (right ? 'matrix(-1 0 0 1 400 0) ' : '') + 'translate(' + (dx || 0) + ' 0)">' + body + '</g></g>';
  }
  var HEAD = 1.12;
  /* neck: flat skin lit from the left, a crisp shadow cast by the jaw and a soft collar shadow */
  function neck(lit, shade, cast) {
    return '<path d="M187 172 185 207C193 213 207 213 215 207L213 172Z" fill="' + lit + '"/><path d="M204 172H213L215 207C211 210 207 211 204 211Z" fill="' + shade + '" opacity=".75"/>' +
      '<path d="M185 178C191 189 209 189 215 178V185C208 192 192 192 185 185Z" fill="' + cast + '" opacity=".42"/>' +
      '<path d="M185 205C192 209 208 209 215 205V208C208 212 192 212 185 208Z" fill="' + cast + '" opacity=".22"/>';
  }
  function hand(x, y, s, p) {
    return '<g><path d="M' + x + ' ' + y + 'c' + (-1 * s) + ' -7 ' + (8 * s) + ' -11 ' + (14 * s) + ' -7c' + (5 * s) + ' 4 ' + (5 * s) + ' 12 ' + (1 * s) + ' 17c' + (-5 * s) + ' 5 ' + (-13 * s) + ' 2 ' + (-15 * s) + ' -4z" fill="url(#' + p + 's)" stroke="#b98464" stroke-width=".8"/>' +
      '<path d="M' + (x + 5 * s) + ' ' + (y - 8) + 'l' + (2 * s) + ' 9M' + (x + 9 * s) + ' ' + (y - 8.5) + 'l' + (1.6 * s) + ' 9M' + (x + 12.5 * s) + ' ' + (y - 6.5) + 'l' + (.8 * s) + ' 7" stroke="#c08a6c" stroke-width=".8" opacity=".7"/></g>';
  }


  /* 3D shading pass: every skin, cloth, hair and toad shape gets a twin painted with a
     light-to-shadow gradient (lit from the upper left), plus soft contact shadows.
     Pure gradients, no SVG filters, so the animations stay cheap. */
  function shade3d(p, svg) {
    var defs = '<radialGradient id="' + p + 'v" cx=".32" cy=".24" r=".92" fx=".3" fy=".2">' +
        '<stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".3" stop-color="#fff" stop-opacity=".1"/>' +
        '<stop offset=".58" stop-color="#000" stop-opacity="0"/><stop offset=".86" stop-color="#1a0d06" stop-opacity=".22"/><stop offset="1" stop-color="#1a0d06" stop-opacity=".38"/></radialGradient>' +
      '<linearGradient id="' + p + 'rim" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffd9a8" stop-opacity=".55"/><stop offset=".18" stop-color="#ffd9a8" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + p + 'vs" cx=".34" cy=".26" r=".9" fx=".32" fy=".22"><stop offset="0" stop-color="#fff6ea" stop-opacity=".42"/><stop offset=".32" stop-color="#fff6ea" stop-opacity=".06"/>' +
        '<stop offset=".62" stop-color="#c0603a" stop-opacity="0"/><stop offset=".88" stop-color="#a54a2a" stop-opacity=".16"/><stop offset="1" stop-color="#8a3a1e" stop-opacity=".26"/></radialGradient>' +
      '<radialGradient id="' + p + 'ao" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1a0d06" stop-opacity=".42"/><stop offset="1" stop-color="#1a0d06" stop-opacity="0"/></radialGradient>';
    var twin = new RegExp('<(path|ellipse|circle|rect)\\b([^>]*?)\\sfill="url\\(#' + p + '(s|r|k|t|o|h|hb|m|sl|mt)\\)"([^>]*?)/>', 'g');
    var hair = new RegExp('<g fill="url\\(#' + p + '(?:h|hb)\\)"[^>]*>((?:(?!</g>).)*)</g>', 'g');
    function clean(a) { return a.replace(/\s(stroke(-[a-z]+)?|class|filter)="[^"]*"/g, ''); }
    return svg
      .replace('<defs>', '<defs>' + defs)
      .replace(twin, function (m, tag, pre, key, post) {
        var copy = '<' + tag + clean(pre) + ' fill="url(#' + p + (key === 's' ? 'vs' : 'v') + ')"' + clean(post) + ' pointer-events="none"/>';
        var rim = key === 's' || key === 'r' || key === 'k' ? '<' + tag + clean(pre) + ' fill="url(#' + p + 'rim)"' + clean(post) + ' pointer-events="none"/>' : '';
        return m + copy + rim;
      })
      .replace(hair, function (m, body) { return m + '<g fill="url(#' + p + 'v)" pointer-events="none">' + body + '</g>'; })
      .replace('<g class="m-look">', '<ellipse cx="200" cy="356" rx="58" ry="10" fill="url(#' + p + 'ao)"/><g class="m-look">');
  }

  /* Artwork shown as a 3D standee: a few darkened copies stacked behind the art give it
     real thickness when it tilts, a sheen masked to the character follows the pointer,
     and a contact shadow keeps it on the floor. The tilt reads --hx / --hy from watchMascots. */
  function standee(src, label, cls) {
    var u = esc(src), back = '';
    for (var i = 1; i <= 5; i++) back += '<img class="a3-back" src="' + u + '" alt="" aria-hidden="true" style="--z:' + i + '" decoding="async" crossorigin="anonymous">';
    return '<div class="mascot mascot-art ' + cls + '" role="img" aria-label="' + esc(label) + '">' +
      '<i class="a3-shadow" aria-hidden="true"></i><div class="a3-sway"><div class="a3-body">' + back +
      '<img class="a3-front" src="' + u + '" alt="" decoding="async" crossorigin="anonymous">' +
      '<i class="a3-sheen" aria-hidden="true" style="-webkit-mask-image:url(' + u + ');mask-image:url(' + u + ')"></i></div></div></div>';
  }
  function mascot(opts) {
    opts = opts || {};
    var p = 'mx' + (++uid), R = rng(7);
    var waves = '';
    for (var wx = 96; wx < 310; wx += 20) waves += '<path d="M' + wx + ' 466a10 10 0 0 1 20 0"/><path d="M' + (wx + 5) + ' 466a5 5 0 0 1 10 0"/>';
    // back mane: crown spikes + long locks falling behind the shoulders
    var crown = [], mane = [];
    for (var i = 0; i <= 10; i++) {
      var t = i / 10, a = -172 + t * 164, rad = a * Math.PI / 180, side = a < -90 ? -1 : 1;
      crown.push([r1(200 + Math.cos(rad) * 22), r1(108 + Math.sin(rad) * 28), r1(a + side * 12 + (R() - .5) * 8), r1(56 + R() * 30 - Math.abs(a + 90) * .1), r1(40 + R() * 10), r1(side * (16 + R() * 14))]);
    }
    for (i = 0; i < 12; i++) {
      var sd = i % 2 ? 1 : -1, k = Math.floor(i / 2);
      mane.push([r1(200 + sd * (6 + k * 10)), r1(118 + k * 6), r1(90 - sd * (10 + k * 7) + (R() - .5) * 6), r1(210 + R() * 70 - k * 10), r1(46 + R() * 12 - k * 2), r1(sd * (22 + R() * 26) * (k % 2 ? -1 : 1))]);
    }
    mane.reverse();
    var fringe = [[174, 100, -118, 34, 22, -12], [188, 96, -100, 30, 20, -8], [202, 95, -84, 30, 20, 8], [216, 96, -68, 32, 20, 10], [229, 100, -54, 34, 22, 14]];
    var sideL = [[165, 106, 98, 96, 22, 14], [159, 114, 104, 158, 26, 20]], sideR = [[235, 106, 82, 96, 22, -14], [241, 114, 76, 158, 26, -20]];
    var H = 'url(#' + p + 'h)';
    return shade3d(p, '<svg class="mascot sage ' + (opts.cls || '') + '" viewBox="0 0 400 540" role="img" aria-label="' + esc(C.name || 'Xiraiya') + ' — an original toad-sage character with a long white mane, red haori and a toad companion">' +
      '<defs>' + crewDefs(p) +
      '<radialGradient id="' + p + 'g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e0442e" stop-opacity=".26"/><stop offset=".6" stop-color="#d9a441" stop-opacity=".07"/><stop offset="1" stop-color="#d9a441" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#ece7dd"/><stop offset="1" stop-color="#bdb5a6"/></linearGradient>' +
      '<linearGradient id="' + p + 'hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2dccf"/><stop offset="1" stop-color="#a39a8a"/></linearGradient>' +
      '<linearGradient id="' + p + 's" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5d7bf"/><stop offset="1" stop-color="#dfae8e"/></linearGradient>' +
      '<linearGradient id="' + p + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dc4a2e"/><stop offset=".6" stop-color="#b8321f"/><stop offset="1" stop-color="#8a2314"/></linearGradient>' +
      '<linearGradient id="' + p + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e5d48"/><stop offset="1" stop-color="#22372a"/></linearGradient>' +
      '<linearGradient id="' + p + 'm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eeeae2"/><stop offset=".5" stop-color="#bdb6aa"/><stop offset="1" stop-color="#8d867b"/></linearGradient>' +
      '<radialGradient id="' + p + 'i" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffd98c"/><stop offset=".5" stop-color="#c9811f"/><stop offset="1" stop-color="#5a3208"/></radialGradient>' +
      '<clipPath id="' + p + 'coat"><path d="M170 205C152 208 142 214 137 228C130 300 122 392 114 468H286C278 392 270 300 263 228C258 214 248 208 230 205Z"/></clipPath>' +
      '<clipPath id="' + p + 'scr"><rect x="156" y="290" width="88" height="54" rx="2"/></clipPath>' +
      '</defs>' + stage(p, '#e0442e', '#d9a441') +
      '<g class="m-body">' +
        // scroll on the back
        '<g transform="rotate(-18 200 250)"><rect x="54" y="236" width="292" height="34" rx="17" fill="#ebe1c8" stroke="#6b5a40" stroke-width="1.6"/><path d="M70 244H330M70 262H330" stroke="#cdbf9c" stroke-width="1.4"/><rect x="44" y="230" width="22" height="46" rx="7" fill="#b8321f" stroke="#5a1a0e" stroke-width="1.6"/><rect x="334" y="230" width="22" height="46" rx="7" fill="#b8321f" stroke="#5a1a0e" stroke-width="1.6"/></g>' +
        // long mane behind
        '<g class="m-tail"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' + hairLocks(mane, 'url(#' + p + 'hb)', '#9c9384', '#8f8778') + '</g></g>' +
        '<g class="m-crown"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' + hairLocks(crown, H, '#aaa293', '#c3bcae') + '</g></g>' +
        // legs: hakama + geta
        '<path d="M158 464 154 502H192L195 464ZM205 464 208 502H246L242 464Z" fill="#2b2a33"/><path d="M172 468 170 502M224 468 226 502" stroke="#1b1a21" stroke-width="1.4" opacity=".7"/>' +
        '<path d="M146 504H198V511H146ZM202 504H254V511H202Z" fill="#7a5230"/><path d="M152 511V518M192 511V518M208 511V518M248 511V518" stroke="#4a3018" stroke-width="5"/><path d="M160 503 170 494 180 503M220 503 230 494 240 503" stroke="#efe4cc" stroke-width="2.6" fill="none"/>' +
        '<g class="m-breath">' +
          // haori
          '<path d="M170 205C152 208 142 214 137 228C130 300 122 392 114 468H286C278 392 270 300 263 228C258 214 248 208 230 205Z" fill="url(#' + p + 'r)"/>' +
          '<g clip-path="url(#' + p + 'coat)"><rect x="96" y="446" width="208" height="26" fill="#6e1c10"/><g fill="none" stroke="#efe4cc" stroke-width="1.6" opacity=".85">' + waves + '</g>' +
            '<g fill="none" stroke="#7a1d0f" stroke-width="2.2" stroke-linecap="round" opacity=".45"><path d="M152 256C156 320 157 380 155 446"/><path d="M248 256C244 320 243 380 245 446"/><path d="M140 300C139 360 134 410 126 446"/><path d="M260 300C261 360 266 410 274 446"/></g>' +
            '<path d="M142 236C152 224 164 216 176 212" stroke="#f47f5f" stroke-width="2" fill="none" opacity=".55"/></g>' +
          // kimono underneath, collar and haori lapels
          '<path d="M180 207C186 260 190 330 192 468H208C210 330 214 260 220 207Z" fill="url(#' + p + 'k)"/>' +
          '<path d="M181 208 200 262 219 208" fill="none" stroke="#e9e1d0" stroke-width="3"/>' +
          '<path d="M170 207H180C186 260 190 330 192 468H182C180 330 176 260 170 207ZM230 207H220C214 260 210 330 208 468H218C220 330 224 260 230 207Z" fill="#2b1d16"/>' +
          '<path d="M186 334H214V348H186Z" fill="#1b1511"/><path d="M186 341H214" stroke="#d9a441" stroke-width="1.4"/>' +
          '<circle cx="157" cy="248" r="8.5" fill="none" stroke="#efe4cc" stroke-width="1.4"/><circle cx="243" cy="248" r="8.5" fill="none" stroke="#efe4cc" stroke-width="1.4"/>' +
          '<text x="157" y="252" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="10" fill="#efe4cc">蝦</text><text x="243" y="252" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="10" fill="#efe4cc">蝦</text>' +
          // sleeves on bent arms
          sleeve('url(#' + p + 'r)', '#6e1c10', '#7a1d0f') + sleeve('url(#' + p + 'r)', '#6e1c10', '#7a1d0f', true) +
          // laptop held at the chest
          '<g class="m-laptop"><rect x="150" y="284" width="100" height="66" rx="5" fill="#1d1813" stroke="#4a3b2e" stroke-width="1.6"/>' +
            '<g clip-path="url(#' + p + 'scr)"><rect x="156" y="290" width="88" height="54" fill="#15110d"/><g class="m-code" opacity=".8"><rect x="160" y="294" width="30" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="300" width="46" height="2.4" rx="1.2" fill="#d9a441"/><rect x="165" y="306" width="24" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="160" y="312" width="40" height="2.4" rx="1.2" fill="#e0442e"/><rect x="165" y="318" width="52" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="324" width="20" height="2.4" rx="1.2" fill="#d9a441"/><rect x="160" y="330" width="36" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="336" width="48" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="160" y="342" width="30" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="348" width="46" height="2.4" rx="1.2" fill="#d9a441"/><rect x="165" y="354" width="24" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="160" y="360" width="40" height="2.4" rx="1.2" fill="#e0442e"/><rect x="165" y="366" width="52" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="372" width="20" height="2.4" rx="1.2" fill="#d9a441"/></g></g>' +
            '<g class="m-logo"><rect x="190" y="307" width="20" height="20" fill="#e0442e" transform="rotate(-4 200 317)"/><text x="200" y="322" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="13" fill="#efe4cc">開</text></g>' +
            '<path d="M144 350H256L250 358H150Z" fill="#2c241c"/></g>' +
          hand(146, 354, 1, p) + hand(254, 354, -1, p) +
        '</g>' +
        // neck
        neck('#f1cfb5', '#d8a383', '#b57a5c') +
        // long locks framing the face, over the shoulders
        '<g class="m-lock l"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' + hairLocks(sideL, H, '#aaa293', '#c3bcae') + '</g></g><g class="m-lock r"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' + hairLocks(sideR, H, '#aaa293', '#c3bcae') + '</g></g>' +
        '<g class="m-look"><g class="m-nod"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' +
          // ears
          '<path d="M161 118C153 115 150 132 157 140 160 143 164 139 164 134ZM239 118C247 115 250 132 243 140 240 143 236 139 236 134Z" fill="#e9bc9d" stroke="#c08a6c" stroke-width=".8"/><path d="M158 124C156 130 158 135 161 137M242 124C244 130 242 135 239 137" stroke="#c08a6c" stroke-width="1" fill="none"/>' +
          // face
          '<path d="M160 110C158 136 164 156 176 170 184 179 192 184 200 184S216 179 224 170C236 156 242 136 240 110 240 86 222 72 200 72S160 86 160 110Z" fill="url(#' + p + 's)"/>' +
          '<path d="M236 116C237 142 230 162 214 179 226 164 231 144 231 116Z" fill="#c98b6c" opacity=".35"/><path d="M162 110H238V120C214 114 186 114 162 120Z" fill="#c98b6c" opacity=".28"/>' +
          '<path d="M170 150C176 158 180 164 186 168M230 150C224 158 220 164 214 168" stroke="#c98b6c" stroke-width="1" fill="none" opacity=".45"/>' +
          faceModel('#a4583a') + eyePair(p, { y: 131, gap: 19, iris: '#6a3a0a', lash: false, lid: '#2a1a10' }) +
          // brows: heavy, white, a little raised
          '<g class="m-brows" fill="#f7f4ee" stroke="#a39a8a" stroke-width=".8" stroke-linejoin="round"><path d="M163 121 166 113 170 117 174 110 178 115 183 109 186 114 191 111 196 116C188 115 178 116 169 121Z"/><path d="M237 121 234 113 230 117 226 110 222 115 217 109 214 114 209 111 204 116C212 115 222 116 231 121Z"/></g>' +
          // kumadori stage lines
          '<g stroke="#c9361f" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M178 139C176 148 175 156 174 165"/><path d="M185 140C184 147 183 153 182 159"/><path d="M222 139C224 148 225 156 226 165"/><path d="M215 140C216 147 217 153 218 159"/></g>' +
          // nose, smile lines, grin
          '<path d="M199 132C200 139 202 145 204 150 202 152 199 152 196 151" stroke="#b27758" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M202 134C204 141 206 146 206 150" stroke="#cf9677" stroke-width="2" fill="none" opacity=".5"/>' +
          '<path d="M189 153C186 158 186 162 188 165M211 153C214 158 214 162 212 165" stroke="#b27758" stroke-width=".9" fill="none" opacity=".45"/>' +
          '<path d="M187 163C195 168 205 168 213 160" stroke="#6a2a1c" stroke-width="2.1" fill="none" stroke-linecap="round"/><path d="M207 164.5 208.6 168.4 210.2 163.6Z" fill="#fff"/><path d="M193 169C198 170.4 203 170 207 168" stroke="#c98a70" stroke-width="1.1" fill="none" opacity=".6"/>' +
          // hair over the crown, fringe and headband
          '<path d="M157 108C152 72 176 56 200 56S248 72 243 108C228 98 172 98 157 108Z" fill="' + H + '"/>' +
          hairLocks(fringe, H, '#aaa293', '#c3bcae') +
          '<g class="m-tails"><path d="M240 102C262 98 282 110 306 100L310 108C286 122 262 112 242 113Z" fill="#241c16"/><path d="M240 108C262 116 280 134 302 134L300 142C276 144 258 124 240 118Z" fill="#33281f"/></g>' +
          '<path d="M157 101C180 93 220 93 243 101V113C220 105 180 105 157 113Z" fill="#221a14"/>' +
          '<path d="M178 95.5C192 94 208 94 222 95.5V110C208 108.6 192 108.6 178 110Z" fill="url(#' + p + 'm)" stroke="#6f685d" stroke-width="1"/>' +
          '<text x="200" y="106" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="9" fill="#2f2822">&lt;/&gt;</text>' +
          '<g fill="#6f685d"><circle cx="182" cy="98.5" r="1.1"/><circle cx="218" cy="98.5" r="1.1"/><circle cx="182" cy="107" r="1.1"/><circle cx="218" cy="107" r="1.1"/></g>' +
        '</g></g></g>' +
      '</g>' +
      toadG(p) +
      '<g class="m-holo h1"><g transform="rotate(-8 44 150)"><rect x="24" y="100" width="40" height="104" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><rect x="29" y="105" width="30" height="94" fill="none" stroke="#b8321f" stroke-width="1"/><text x="44" y="146" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="20" fill="#1d1208">AI</text><text x="44" y="178" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="18" fill="#b8321f">術</text></g></g>' +
      '<g class="m-holo h2"><g transform="rotate(7 356 330)"><rect x="336" y="280" width="40" height="104" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><rect x="341" y="285" width="30" height="94" fill="none" stroke="#b8321f" stroke-width="1"/><text x="356" y="326" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="15" fill="#1d1208">{ }</text><text x="356" y="360" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="18" fill="#b8321f">码</text></g></g>' +
      '<g class="m-holo h3"><g transform="rotate(-4 350 64)"><rect x="330" y="20" width="40" height="92" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><text x="350" y="60" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="20" fill="#b8321f">忍</text><text x="350" y="92" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="11" fill="#1d1208">&lt;/&gt;</text></g></g>' +
      '</svg>');
  }


  function toadG(p) {
    return '<g class="m-toad">' +
      '<ellipse cx="92" cy="500" rx="74" ry="14" fill="#000" opacity=".2"/>' +
      '<path d="M26 492C18 452 44 420 92 418 140 420 166 452 158 492Z" fill="url(#' + p + 't)" stroke="#5a2e12" stroke-width="2"/>' +
      '<g fill="#7a3c18" opacity=".7"><circle cx="58" cy="452" r="7"/><circle cx="124" cy="446" r="6"/><circle cx="96" cy="436" r="4"/><circle cx="140" cy="470" r="5"/><circle cx="42" cy="476" r="4"/></g>' +
      '<ellipse class="m-throat" cx="92" cy="480" rx="38" ry="16" fill="#ecd3a6"/>' +
      '<path d="M52 470C72 480 112 480 132 470" stroke="#5a2e12" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path class="m-tongue" d="M100 468C118 446 134 424 150 398" stroke="#e0607a" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<g class="m-toad-eyes"><circle cx="60" cy="426" r="15" fill="url(#' + p + 't)" stroke="#5a2e12" stroke-width="2"/><circle cx="124" cy="424" r="15" fill="url(#' + p + 't)" stroke="#5a2e12" stroke-width="2"/>' +
        '<circle cx="60" cy="425" r="9" fill="#f0c040"/><circle cx="124" cy="423" r="9" fill="#f0c040"/><rect x="53" y="423" width="14" height="4" rx="2" fill="#1d1208"/><rect x="117" y="421" width="14" height="4" rx="2" fill="#1d1208"/></g>' +
      '<path d="M36 494C30 500 30 506 40 506H62M148 494C154 500 154 506 144 506H122" stroke="#5a2e12" stroke-width="3" fill="url(#' + p + 't)"/>' +
      '<path d="M74 456 110 456 92 470Z" fill="#b8321f"/><path d="M78 458 106 458" stroke="#efe4cc" stroke-width="1.5"/>' +
      '<g class="m-fly"><ellipse cx="-3" cy="-4" rx="4" ry="2.4" fill="#cfe3ef" opacity=".85" class="m-wing"/><ellipse cx="3" cy="-4" rx="4" ry="2.4" fill="#cfe3ef" opacity=".85" class="m-wing"/><circle r="3" fill="#1d1208"/></g>' +
    '</g>';
  }
  function slugG(p) {
    // a leopard slug: mantle with growth rings and a breathing pore, tubercled skin, keel tail,
    // two long eye stalks + two short feelers, wet highlights and a slime trail (plus a support headset)
    var spots = '';
    [[268, 496, 3.2], [282, 489, 2.6], [296, 495, 3.4], [310, 488, 2.4], [252, 500, 2.2], [322, 494, 2.8], [288, 500, 2], [304, 501, 2.2], [274, 501, 1.8], [338, 489, 2.4], [350, 482, 2], [340, 474, 2.6], [356, 470, 1.8]].forEach(function (d) {
      spots += '<ellipse cx="' + d[0] + '" cy="' + d[1] + '" rx="' + d[2] + '" ry="' + (d[2] * .7).toFixed(1) + '" />';
    });
    return '<g class="m-slug">' +
      '<path d="M206 510C236 506 272 508 300 508" stroke="#cfd8dc" stroke-width="7" stroke-linecap="round" opacity=".45"/><path d="M214 508C240 506 262 507 286 507" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>' +
      '<ellipse cx="300" cy="507" rx="78" ry="6" fill="#000" opacity=".16"/>' +
      // body + keel tail
      '<path d="M222 506C232 500 256 494 290 490 310 486 332 478 350 470 362 466 374 468 380 478 386 490 380 504 368 507Z" fill="url(#' + p + 'sl)" stroke="#5b4a3a" stroke-width="1.6"/>' +
      '<path d="M226 504C252 497 284 494 318 488" stroke="#5b4a3a" stroke-width="1.2" fill="none" opacity=".45"/>' +
      '<g fill="#3e3025" opacity=".75">' + spots + '</g>' +
      // mantle saddle with growth rings + pneumostome
      '<path d="M318 486C318 470 334 460 352 458 368 457 380 464 382 476 372 482 350 488 318 486Z" fill="url(#' + p + 'mt)" stroke="#5b4a3a" stroke-width="1.4"/>' +
      '<path d="M326 482C330 470 344 464 358 463M334 481C338 473 348 469 360 469M344 480C348 476 354 474 362 474" stroke="#5b4a3a" stroke-width="1" fill="none" opacity=".5"/>' +
      '<ellipse cx="338" cy="482" rx="3" ry="2" fill="#2a1f18"/>' +
      // head, feelers and eye stalks
      '<path d="M372 486C380 484 388 488 388 496 386 504 376 506 368 504Z" fill="url(#' + p + 'sl)" stroke="#5b4a3a" stroke-width="1.2"/>' +
      '<path d="M384 498 394 504M382 502 390 510" stroke="#6b5846" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g class="m-stalk"><path d="M378 488C380 474 384 462 388 450M384 490C390 478 396 470 402 460" stroke="#6b5846" stroke-width="3.2" stroke-linecap="round" fill="none"/>' +
        '<circle cx="388" cy="448" r="3.6" fill="#2a1f18"/><circle cx="402" cy="458" r="3.6" fill="#2a1f18"/><circle cx="387" cy="447" r="1.2" fill="#fff"/><circle cx="401" cy="457" r="1.2" fill="#fff"/></g>' +
      // wet sheen
      '<path d="M244 498C268 491 292 489 314 485" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55" fill="none"/><path d="M336 466C346 462 358 461 368 463" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6" fill="none"/>' +
      '<circle cx="262" cy="495" r="1.6" fill="#fff" opacity=".8"/><circle cx="300" cy="490" r="1.3" fill="#fff" opacity=".8"/>' +
      // tiny support headset
      '<path d="M364 470C364 450 396 446 400 466" stroke="#1d1813" stroke-width="2.6" fill="none"/><rect x="360" y="468" width="7" height="10" rx="3" fill="#1d1813"/><path d="M363 478C364 488 372 492 380 492" stroke="#1d1813" stroke-width="2" fill="none"/><circle cx="381" cy="492" r="2.6" fill="#d63a24"/>' +
    '</g>';
  }
  function crewDefs(p) {
    return '<linearGradient id="' + p + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98044"/><stop offset="1" stop-color="#8a4a22"/></linearGradient>' +
      '<linearGradient id="' + p + 'sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdb99f"/><stop offset=".55" stop-color="#a48b70"/><stop offset="1" stop-color="#7c6650"/></linearGradient>' +
      '<linearGradient id="' + p + 'mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bda78c"/><stop offset="1" stop-color="#8a735c"/></linearGradient>';
  }
  function miniToad() { var p = 'mt' + (++uid); return shade3d(p, '<svg class="mascot mini-crew" viewBox="14 392 160 128" role="img" aria-label="Gama the toad"><defs>' + crewDefs(p) + '</defs>' + toadG(p) + '</svg>'); }
  function miniSlug() { var p = 'ms' + (++uid); return shade3d(p, '<svg class="mascot mini-crew" viewBox="200 436 210 82" role="img" aria-label="Namekuji the slug in a support headset"><defs>' + crewDefs(p) + '</defs>' + slugG(p) + '</svg>'); }

  // An original "slug princess" from the same 1839 folk tale: head of QA, tea enthusiast.
  function tsunade(opts) {
    opts = opts || {};
    var p = 'ts' + (++uid), R = rng(11), spirals = '';
    [[160, 292], [150, 420], [240, 292], [250, 420], [174, 456], [226, 456]].forEach(function (c) {
      spirals += '<path d="M' + c[0] + ' ' + c[1] + 'm-7 0a7 7 0 1 1 7 7a4.4 4.4 0 1 1 -4.4 -4.4a1.8 1.8 0 1 1 1.8 1.8"/>';
    });
    var mane = [];
    for (var i = 0; i < 12; i++) {
      var sd = i % 2 ? 1 : -1, k = Math.floor(i / 2);
      mane.push([r1(200 + sd * (6 + k * 6.5)), r1(106 + k * 5), r1(90 - sd * (3 + k * 1.6) + (R() - .5) * 3), r1(226 + R() * 36 - k * 5), r1(38 + R() * 6 - k), r1(sd * (4 + R() * 6) * (k % 2 ? -1 : 1))]);
    }
    mane.reverse();
    var sideL = [[166, 106, 94, 214, 30, 8], [162, 112, 97, 196, 26, -6], [170, 110, 92, 170, 20, 10]], sideR = [[234, 106, 86, 214, 30, -8], [238, 112, 83, 196, 26, 6], [230, 110, 88, 170, 20, -10]];
    var H = 'url(#' + p + 'h)';
    return shade3d(p, '<svg class="mascot tsunade ' + (opts.cls || '') + '" viewBox="0 0 400 540" role="img" aria-label="Tsunade, head of QA — an original slug-princess character with blonde twin tails, a grey kimono and an open green haori, a clipboard, a cup of tea and a slug in a headset">' +
      '<defs>' + crewDefs(p) +
      '<radialGradient id="' + p + 'g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3f8f84" stop-opacity=".24"/><stop offset=".6" stop-color="#d9a441" stop-opacity=".07"/><stop offset="1" stop-color="#d9a441" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbeec3"/><stop offset=".5" stop-color="#e7c979"/><stop offset="1" stop-color="#c29a4a"/></linearGradient>' +
      '<linearGradient id="' + p + 'hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3c173"/><stop offset="1" stop-color="#a47b33"/></linearGradient>' +
      '<linearGradient id="' + p + 's" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9e1cd"/><stop offset="1" stop-color="#e8bb9c"/></linearGradient>' +
      '<linearGradient id="' + p + 'k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece8df"/><stop offset=".6" stop-color="#c3bdb1"/><stop offset="1" stop-color="#8f897e"/></linearGradient>' +
      '<linearGradient id="' + p + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#62a060"/><stop offset=".6" stop-color="#3f7442"/><stop offset="1" stop-color="#264b2c"/></linearGradient>' +
      '<linearGradient id="' + p + 'o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#56679a"/><stop offset="1" stop-color="#28334f"/></linearGradient>' +
      '<radialGradient id="' + p + 'i" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#f3c98a"/><stop offset=".5" stop-color="#a8651f"/><stop offset="1" stop-color="#3f1c06"/></radialGradient>' +
      '<clipPath id="' + p + 'coat"><path d="M172 206C156 209 146 215 142 228C138 280 142 318 150 336C146 380 132 430 124 470H276C268 430 254 380 250 336C258 318 262 280 258 228C254 215 244 209 228 206Z"/></clipPath>' +
      '</defs>' + stage(p, '#3f8f84', '#d9a441') +
      '<g class="m-body">' +
        '<g class="m-tail"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' + hairLocks(mane, 'url(#' + p + 'hb)', '#a07a36', '#8e6a2a') + '</g></g>' +
        // tabi + zori
        '<path d="M162 466 160 502H192L194 466ZM206 466 208 502H240L238 466Z" fill="#f3efe8"/><path d="M152 504H198V511H152ZM202 504H248V511H202Z" fill="#b8321f"/><path d="M168 502 176 493 184 502M216 502 224 493 232 502" stroke="#1d1813" stroke-width="2.4" fill="none"/>' +
        '<g class="m-breath">' +
          '<path d="M172 206C156 209 146 215 142 228C138 280 142 318 150 336C146 380 132 430 124 470H276C268 430 254 380 250 336C258 318 262 280 258 228C254 215 244 209 228 206Z" fill="url(#' + p + 'k)"/>' +
          '<g clip-path="url(#' + p + 'coat)">' +
            '<g fill="none" stroke="#6f695f" stroke-width="2.2" stroke-linecap="round" opacity=".4"><path d="M158 262C160 296 158 318 155 334"/><path d="M242 262C240 296 242 318 245 334"/><path d="M200 374C198 410 198 440 200 470"/><path d="M172 376C166 410 152 440 140 468"/><path d="M228 376C234 410 248 440 260 468"/></g>' +
            '<path d="M148 236C158 225 168 218 180 213" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>' +
            '</g>' +
          // crossed collar: white under-collar, green overlap closing high
          '<path d="M176 207 200 252 224 207" fill="none" stroke="#f7f4ee" stroke-width="8" stroke-linejoin="round"/><path d="M171 209 200 262 229 209" fill="none" stroke="#8f897e" stroke-width="2" stroke-linejoin="round" opacity=".8"/>' +
          '<path d="M178 206C188 214 212 214 222 206" stroke="#f7f2ea" stroke-width="3" fill="none"/>' +
          // obi
                    '<path d="M149 336H251L254 372H146Z" fill="url(#' + p + 'o)"/><path d="M149 344H251M147 364H253" stroke="#8d9cc4" stroke-width="1.2" opacity=".55"/>' +
          
          '<path d="M186 372C184 392 180 410 176 426M196 372C196 394 194 414 192 432" stroke="#28334f" stroke-width="5" stroke-linecap="round"/>' +
          // the green haori, worn open over the grey kimono
          '<path d="M172 206C156 209 146 215 142 228C138 280 142 318 150 336C146 380 132 430 124 470H170C173 400 176 300 181 207Z" fill="url(#' + p + 'r)"/><path d="M228 206C244 209 254 215 258 228C262 280 258 318 250 336C254 380 268 430 276 470H230C227 400 224 300 219 207Z" fill="url(#' + p + 'r)"/>' +
          '<path d="M181 207C176 300 173 400 170 470M219 207C224 300 227 400 230 470" stroke="#1f4526" stroke-width="3" fill="none"/><path d="M124 462H170V470H124ZM230 462H276V470H230Z" fill="#1f4526"/>' +
          '<path d="M152 262C154 300 152 330 148 360M248 262C246 300 248 330 252 360" stroke="#1f4526" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"/>' +
          // sleeves on bent arms
          sleeve('url(#' + p + 'r)', '#1f4526', '#1f4526', false, 4) + sleeve('url(#' + p + 'r)', '#1f4526', '#1f4526', true, 4) +
          // tea cup in the left hand
          '<g class="m-tea"><path class="m-steam" d="M152 316C146 308 158 302 152 294M162 318C156 310 168 304 162 296" stroke="#c9c2b2" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M142 324H172L168 342C166 347 148 347 146 342Z" fill="#efe4cc" stroke="#6b5a40" stroke-width="1.6"/><path d="M145 330H169" stroke="#3f8f84" stroke-width="2.6"/></g>' +
          hand(150, 352, 1, p) +
          // QA clipboard on the right arm
          '<g transform="rotate(6 246 330)"><rect x="214" y="280" width="64" height="84" rx="5" fill="#8a5a2b" stroke="#5a3a1a" stroke-width="1.6"/><rect x="221" y="292" width="50" height="66" fill="#fffaf0"/><rect x="235" y="275" width="22" height="10" rx="3" fill="#c9c2b2" stroke="#7d7466" stroke-width="1.2"/>' +
            '<text x="246" y="305" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="8" fill="#1d1208">QA LOG</text>' +
            '<path d="M226 314l2.6 2.6 4.4-5.2M226 324l2.6 2.6 4.4-5.2M226 334l2.6 2.6 4.4-5.2" stroke="#3f8f84" stroke-width="1.8" fill="none"/><path d="M238 315h26M238 325h22M238 335h26" stroke="#c9bb98" stroke-width="1.8"/>' +
            '<g class="m-stamp"><circle cx="258" cy="348" r="10" fill="none" stroke="#d63a24" stroke-width="2.2"/><text x="258" y="351.5" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="9.5" fill="#d63a24">OK</text></g></g>' +
          hand(256, 356, -1, p) +
        '</g>' +
        // neck
        neck('#f8dcc6', '#e3b393', '#c08466') +
        '<g class="m-lock l"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' + hairLocks(sideL, H, '#b08a44', '#fff2c8') + '<rect x="157" y="196" width="15" height="6" rx="3" fill="#28334f" transform="rotate(-4 164 199)"/></g></g><g class="m-lock r"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' + hairLocks(sideR, H, '#b08a44', '#fff2c8') + '<rect x="228" y="196" width="15" height="6" rx="3" fill="#28334f" transform="rotate(4 236 199)"/></g></g>' +
        '<g class="m-look"><g class="m-nod"><g transform="translate(200 190) scale(' + HEAD + ') translate(-200 -190)">' +
          '<path d="M163 118C156 116 153 131 159 138 162 141 165 137 165 133ZM237 118C244 116 247 131 241 138 238 141 235 137 235 133Z" fill="#efc3a6" stroke="#c89274" stroke-width=".8"/>' +
          '<path d="M162 110C160 136 166 156 177 169 185 178 193 182 200 182S215 178 223 169C234 156 240 136 238 110 238 86 221 72 200 72S162 86 162 110Z" fill="url(#' + p + 's)"/>' +
          '<path d="M234 116C235 140 229 160 214 177 225 162 230 142 229 116Z" fill="#cf9677" opacity=".3"/>' +
          '<ellipse cx="178" cy="150" rx="9" ry="4.5" fill="#ef8f86" opacity=".26"/><ellipse cx="222" cy="150" rx="9" ry="4.5" fill="#ef8f86" opacity=".26"/>' +
          '<path d="M200 101.5 203.4 107 200 112.5 196.6 107Z" fill="#8a4fb0"/><path d="M200 103 201.6 107 200 109" stroke="#d7b6ee" stroke-width=".9" fill="none" opacity=".8"/>' +
          faceModel('#b86a4c') + eyePair(p, { y: 131, gap: 19, iris: '#5a2c08', lash: true, lid: '#2b1a1c' }) +
          '<g class="m-brows"><path d="M167 118C174 113 184 112 193 116" stroke="#a4803a" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M233 118C226 113 216 112 207 116" stroke="#a4803a" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>' +
          '<path d="M200 134C201 141 202 146 203 150 201 152 199 152 197 151" stroke="#c48a6c" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>' +
          '<path d="M190 162C194 160.5 198 160 200 161 202 160 206 160.5 210 162 205 164 195 164 190 162Z" fill="#c96a68"/><path d="M191 162.6C195 166.6 205 166.6 209 162.6 205 164.6 195 164.6 191 162.6Z" fill="#b5585a"/><path d="M195 162.4C198 163 202 163 205 162.4" stroke="#7a3032" stroke-width=".8"/>' +
          // hair cap and centre-parted bangs
          '<path d="M160 120C156 84 176 62 200 62S244 84 240 120C236 108 228 100 218 97 206 95 194 95 182 97 172 100 164 108 160 120Z" fill="' + H + '"/>' +
          '<g fill="' + H + '" stroke="#b08a44" stroke-width="1" stroke-linejoin="round"><path d="M201 82C186 84 171 95 165 115 163 124 164 132 167 138 169 124 176 110 188 102 194 97 199 91 201 82Z"/><path d="M199 82C214 84 229 95 235 115 237 124 236 132 233 138 231 124 224 110 212 102 206 97 201 91 199 82Z"/></g>' +
          '<path d="M196 88C184 94 174 104 170 120M204 88C216 94 226 104 230 120M186 72C178 78 172 88 170 98M214 72C222 78 228 88 230 98" stroke="#fff2c8" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>' +
          
        '</g></g></g>' +
      '</g>' +
      '<g transform="translate(92 124) scale(.76)">' + slugG(p) + '</g>' +
      '<g class="m-holo h1"><g transform="rotate(-7 44 150)"><rect x="24" y="100" width="40" height="104" fill="#efe4cc" stroke="#3f8f84" stroke-width="2"/><rect x="29" y="105" width="30" height="94" fill="none" stroke="#3f8f84" stroke-width="1"/><text x="44" y="146" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="19" fill="#1d1208">QA</text><text x="44" y="178" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="18" fill="#3f8f84">癒</text></g></g>' +
      '<g class="m-holo h2"><g transform="rotate(6 356 110)"><rect x="336" y="60" width="40" height="100" fill="#efe4cc" stroke="#d63a24" stroke-width="2"/><text x="356" y="102" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="20" fill="#d63a24">承</text><text x="356" y="136" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="11" fill="#1d1208">OK</text></g></g>' +
      '</svg>');
  }

  // Eyes follow the pointer
  var mascots = [];
  function watchMascots() {
    mascots = $$('.mascot').map(function (m) { return { el: m, iris: $$('.m-iris', m) }; });
    if (!mascots.length || !fine || reduce) return;
    var ev = null, queued = false;
    function apply() {
      queued = false;
      mascots.forEach(function (m) {
        var r = m.el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var cx = r.left + r.width * .5, cy = r.top + r.height * .4;
        var dx = clamp((ev.clientX - cx) / (innerWidth * .5), -1, 1), dy = clamp((ev.clientY - cy) / (innerHeight * .5), -1, 1);
        var t = 'translate(' + (dx * 2.4).toFixed(2) + 'px,' + (dy * 1.8).toFixed(2) + 'px)';
        m.iris.forEach(function (i) { i.style.transform = t; });
        m.el.style.setProperty('--hx', dx.toFixed(3));
        m.el.style.setProperty('--hy', dy.toFixed(3));
      });
    }
    window.addEventListener('pointermove', function (e) { ev = e; if (!queued) { queued = true; requestAnimationFrame(apply); } }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Contact helpers
     ------------------------------------------------------------------ */
  /* Official Telegram logo (blue circle, white plane) */
  function tgLogo() {
    var id = 'tg' + (++uid);
    return '<svg class="tg-logo" viewBox="0 0 240 240" aria-hidden="true"><defs><linearGradient id="' + id + 'a" x1=".667" x2=".417" y1=".167" y2=".75"><stop offset="0" stop-color="#37aee2"/><stop offset="1" stop-color="#1e96c8"/></linearGradient><linearGradient id="' + id + 'b" x1=".66" x2=".851" y1=".437" y2=".802"><stop offset="0" stop-color="#eff7fc"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>' +
      '<circle cx="120" cy="120" r="120" fill="url(#' + id + 'a)"/><path fill="#c8daea" d="M98 175c-3.888 0-3.227-1.468-4.568-5.17L82 132.207 170 80"/><path fill="#a9c9dd" d="M98 175c3 0 4.325-1.372 6-3l16-15.558-19.958-12.035"/>' +
      '<path fill="url(#' + id + 'b)" d="M100.04 144.41l48.36 35.729c5.519 3.045 9.501 1.468 10.876-5.123l19.685-92.763c2.015-8.08-3.08-11.746-8.36-9.349l-115.59 44.571c-7.89 3.165-7.843 7.567-1.438 9.528l29.663 9.259 68.673-43.325c3.242-1.966 6.218-.91 3.776 1.258"/></svg>';
  }
  function real(v) { return !!v && !/example\.com|your[-_]/i.test(v); }
  function contacts() {
    var c = C.contact || {}, out = [];
    if (real(c.email)) out.push({ id: 'email', icon: 'mail', label: 'Email', text: c.email, href: 'mailto:' + c.email });
    if (real(c.telegram)) out.push({ id: 'telegram', icon: 'telegram', label: 'Telegram', text: '@' + c.telegram, href: 'https://t.me/' + c.telegram });
    if (c.whatsapp) out.push({ id: 'whatsapp', icon: 'phone-call', label: 'WhatsApp', text: '+' + c.whatsapp, href: 'https://wa.me/' + c.whatsapp });
    if (c.github) out.push({ id: 'github', icon: 'git', label: 'GitHub', text: 'GitHub', href: c.github });
    if (c.linkedin) out.push({ id: 'linkedin', icon: 'briefcase', label: 'LinkedIn', text: 'LinkedIn', href: c.linkedin });
    if (c.fiverr) out.push({ id: 'fiverr', icon: 'star', label: 'Fiverr', text: 'Fiverr', href: c.fiverr });
    if (c.upwork) out.push({ id: 'upwork', icon: 'briefcase', label: 'Upwork', text: 'Upwork', href: c.upwork });
    return out;
  }

  /* ------------------------------------------------------------------
     Header + mobile menu + footer
     ------------------------------------------------------------------ */
  var NAV = [
    { id: 'home', href: 'index.html', label: 'Home', jp: '家' },
    { id: 'lab', href: 'showcase.html', label: 'The Lab', short: 'Lab', jp: '技' },
    { id: 'shop', href: 'shop.html', label: 'Shop Templates', short: 'Shop', jp: '店' },
    { id: 'kit', href: 'components.html', label: 'UI Kit', jp: '型' },
    { id: 'demos', href: 'demos.html', label: 'Demo Sites', short: 'Demos', jp: '演' },
    { id: 'pages', href: 'pages.html', label: 'Pages', jp: '頁' },
    { id: 'world', href: 'dev-world.html', label: 'Dev World', jp: '里' },
    { id: 'learn', href: 'knowledge.html', label: 'Basic Knowledge', short: 'Learn', jp: '学' },
    { id: 'hire', href: 'hire.html', label: 'Hire Me', jp: '雇' }
  ];

  function roll(t) { return '<span class="roll"><span data-t="' + esc(t) + '">' + esc(t) + '</span></span>'; }

  function buildHeader() {
    var h = $('#site-header');
    if (!h) return;
    var links = NAV.filter(function (n) { return n.id !== 'hire'; }).map(function (n) {
      return '<a href="' + n.href + '"' + (n.id === page ? ' aria-current="page"' : '') + (n.short ? ' title="' + esc(n.label) + '"' : '') + '>' + roll(n.short || n.label) + '</a>';
    }).join('');
    h.innerHTML =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="hdr-bg"></div>' +
      '<div class="container container-wide hdr-bar">' +
        '<a class="brand" href="index.html" aria-label="' + esc(C.name || 'Xiraiya') + ' — home">' + brandMark() + '<span class="brand-word">' + esc((C.name || 'Xiraiya').toUpperCase()) + '</span><span class="brand-jp">開発者</span></a>' +
        '<nav class="hdr-nav" aria-label="Primary">' + links + '</nav>' +
        '<div class="hdr-actions">' +
          '<button type="button" class="hdr-search" data-palette aria-label="Search and quests (Ctrl K)">' + icon('search') + '<span>Search</span><kbd>Ctrl K</kbd></button>' +
          '<button type="button" class="mode-btn" data-mode-toggle aria-label="Switch to ink (dark) mode" title="Paper / ink mode"><span class="mb-sun">' + icon('sun') + '</span><span class="mb-moon">' + icon('moon') + '</span></button>' +
          '<span class="status' + (C.available === false ? ' off' : '') + '"><i></i>' + (C.available === false ? 'Booked — waitlist open' : 'Available for work') + '</span>' +
          '<a class="btn btn-primary btn-sm" href="hire.html" data-magnetic>' + roll('Hire me') + icon('arrow-up-right', 'ic-up') + '</a>' +
          '<button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mmenu"><span></span><span></span></button>' +
        '</div>' +
      '</div>';

    buildMenu(h);
  }

  /* Full-screen menu: link list on the left, a preview card on the right that follows
     hover / focus. Facts come from tools/seo.config.json. */
  var MENU_INFO = {
    home: { tags: 'Websites|Telegram bots|AI agents|Shops', ic: 'home', n: 5, post: '+', what: 'years building', d: 'Start here. Who I am, what I build and roughly what it costs.' },
    lab: { tags: '3D gallery|Telegram bot|AI agent|Crypto checkout', ic: 'sparkle', n: 30, what: 'motion pieces', d: 'Demos you can actually use: a shop bot, AI agents, a Chrome extension, a Minecraft world.' },
    shop: { tags: 'Cart|Admin panel|AI agent|bKash · USDT', ic: 'cart', n: 12, what: 'store templates', d: 'Working stores with cart, admin panel and bKash, card or USDT checkout.' },
    kit: { tags: 'Buttons|Cards|Forms|Motion', ic: 'layers', n: 50, what: 'components', d: 'Headers, buttons, cards, forms and loaders. Restyle them, then copy the HTML and CSS.' },
    demos: { tags: 'SaaS|Restaurant|Fashion|Dashboard', ic: 'monitor', n: 15, what: 'full demo sites', d: 'A SaaS, a restaurant, a jeweller, a crypto dashboard and more, on every screen size.' },
    pages: { tags: 'Homepage|Login|Dashboard|Export', ic: 'window', n: 13, what: 'pages, one design system', d: 'Change fonts, colours and layout live, then export the code.' },
    world: { tags: 'Terminal|Playground|Dev tools|Algorithms', ic: 'terminal', n: 17, what: 'dev tools', d: 'A terminal, a code playground, an API console, an algorithm arena and a typing dojo.' },
    learn: { tags: 'HTML · CSS|JavaScript|SQL|Security', ic: 'book', n: 141, what: 'short lessons', d: 'How websites work, from HTML to security and SEO, each with a live preview.' },
    hire: { tags: 'Fixed quote|bKash · USDT|Fast reply', ic: 'briefcase', n: 50, pre: '$', what: 'is where prices start', d: 'Pick what you need and get a price and timeline in about a minute.' }
  };

  function buildMenu(h) {
    var cur = 0;
    NAV.forEach(function (n, i) { if (n.id === page) cur = i; });
    function stat(m) { return (m.pre || '') + m.n + (m.post || ''); }
    function num(i) { return (i < 9 ? '0' : '') + (i + 1); }

    var mm = document.createElement('div');
    mm.className = 'mmenu';
    mm.id = 'mmenu';
    mm.setAttribute('aria-hidden', 'true');
    mm.setAttribute('role', 'dialog');
    mm.setAttribute('aria-label', 'Site menu');
    var links = NAV.map(function (n, i) {
      var m = MENU_INFO[n.id] || {};
      return '<li style="--i:' + i + '"><a href="' + n.href + '" data-i="' + i + '" aria-describedby="nvd-' + n.id + '"' + (n.id === page ? ' aria-current="page"' : '') + '>' +
        '<small class="nv-no">' + num(i) + '</small>' +
        '<span class="nv-label"><span class="nv-t">' + esc(n.label) + '</span>' +
          (n.id === page ? '<em class="nv-here">You are here</em>' : '') +
          '<span class="nv-meta">' + stat(m) + ' ' + esc(m.what || '') + '</span></span>' +
        '<span class="nv-jp" aria-hidden="true">' + n.jp + '</span></a></li>';
    }).join('');
    var descs = NAV.map(function (n) { return '<span id="nvd-' + n.id + '">' + esc((MENU_INFO[n.id] || {}).d || '') + '</span>'; }).join('');
    var foot = contacts().slice(0, 3).map(function (c) {
      var tg = c.id === 'telegram';
      return '<a class="nv-chip' + (tg ? ' nv-tg' : '') + '" href="' + esc(c.href) + '" target="_blank" rel="noopener">' +
        (tg ? tgLogo() : icon(c.icon)) + '<span>' + esc(tg ? c.text : c.label) + '</span></a>';
    }).join('') + '<span class="nv-chip">' + icon('pin') + '<span>' + esc(C.city + ', ' + C.country) + '</span></span>';

    mm.innerHTML =
      '<div class="container container-wide nv-inner">' +
        '<nav class="nv-nav" aria-label="All pages"><p class="nv-kicker">Menu <span aria-hidden="true">· 道</span></p><ol>' + links + '</ol></nav>' +
        '<aside class="nv-card" aria-hidden="true">' +
          '<div class="nv-card-top"><span class="nv-card-no"></span><span class="nv-card-ic"></span></div>' +
          '<div class="nv-card-jp"></div>' +
          '<div class="nv-card-body">' +
            '<h2 class="nv-card-t"></h2><p class="nv-card-d"></p><ul class="nv-card-tags"></ul>' +
            '<p class="nv-card-stat"><b></b><span></span></p>' +
          '</div>' +
          '<i class="nv-card-bar"></i>' +
        '</aside>' +
        '<div class="nv-foot">' + foot + '<span class="nv-hint"><kbd>Esc</kbd> to close</span></div>' +
        '<div class="sr-only">' + descs + '</div>' +
      '</div>';
    h.after(mm);

    var card = $('.nv-card', mm), shown = -1, tick = 0;
    function show(i) {
      if (i === shown) return;
      var n = NAV[i], m = MENU_INFO[n.id] || {}, dir = i > shown ? 1 : -1;
      shown = i;
      card.style.setProperty('--dir', dir);
      $('.nv-card-no', card).textContent = num(i) + ' / 0' + NAV.length;
      $('.nv-card-ic', card).innerHTML = icon(m.ic || 'arrow-right');
      $('.nv-card-jp', card).textContent = n.jp;
      $('.nv-card-t', card).textContent = n.label;
      $('.nv-card-d', card).textContent = m.d || '';
      $('.nv-card-tags', card).innerHTML = (m.tags || '').split('|').map(function (x) { return x ? '<li>' + esc(x) + '</li>' : ''; }).join('');
      $('.nv-card-stat span', card).textContent = m.what || '';
      card.classList.toggle('is-here', n.id === page);
      $$('.mmenu nav a').forEach(function (a) { a.classList.toggle('is-shown', +a.getAttribute('data-i') === i); });
      card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
      // count the stat up
      var b = $('.nv-card-stat b', card), id = ++tick, t0 = performance.now();
      if (reduce || !root.classList.contains('menu-open')) { b.textContent = stat(m); return; }
      (function step(now) {
        if (id !== tick) return;
        var p = Math.min(1, (now - t0) / 520), e = 1 - Math.pow(1 - p, 3);
        b.textContent = (m.pre || '') + Math.round(m.n * e) + (p < 1 ? '' : (m.post || ''));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    $$('nav a', mm).forEach(function (a) {
      var i = +a.getAttribute('data-i');
      a.addEventListener('pointerenter', function () { show(i); });
      a.addEventListener('focus', function () { show(i); });
    });

    var btn = $('.menu-btn', h);
    function setOpen(open, keepFocus) {
      root.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mm.setAttribute('aria-hidden', !open);
      if (open) {
        shown = -1; show(cur);
        mm.scrollTop = 0;
        setTimeout(function () { var a = $$('nav a', mm)[cur]; if (a && root.classList.contains('menu-open')) a.focus({ preventScroll: true }); }, reduce ? 0 : 420);
      } else if (!keepFocus && mm.contains(document.activeElement)) {
        btn.focus({ preventScroll: true });
      }
    }
    btn.addEventListener('click', function () { setOpen(!root.classList.contains('menu-open')); });
    mm.addEventListener('click', function (e) { if (e.target.closest('nav a')) setOpen(false, true); });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setOpen(false); btn.focus({ preventScroll: true }); return; }
      if (e.key !== 'Tab') return;
      // keep Tab inside the menu and its close button
      var f = [btn].concat($$('a[href]', mm));
      var at = f.indexOf(document.activeElement);
      if (at === -1) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); return; }
      if (!e.shiftKey && at === f.length - 1) { e.preventDefault(); f[0].focus(); }
      else if (e.shiftKey && at === 0) { e.preventDefault(); f[f.length - 1].focus(); }
    });
  }

  // App-style bottom tab bar (shown on phones only, via phone.css)
  function buildTabbar() {
    var TABS = [
      { id: 'home', href: 'index.html', label: 'Home', ic: 'home' },
      { id: 'lab', href: 'showcase.html', label: 'Lab', ic: 'sparkle' },
      { id: 'hire', href: 'hire.html', label: 'Hire me', ic: 'briefcase', cls: 'tb-hire' },
      { id: 'shop', href: 'shop.html', label: 'Shop', ic: 'cart' }
    ];
    var nav = document.createElement('nav');
    nav.className = 'tabbar';
    nav.setAttribute('aria-label', 'Quick navigation');
    nav.innerHTML = TABS.map(function (t) {
      var ic = icon(t.ic);
      return '<a href="' + t.href + '"' + (t.cls ? ' class="' + t.cls + '"' : '') + (t.id === page ? ' aria-current="page"' : '') + '>' +
        (t.cls ? '<span class="tb-orb">' + ic + '</span>' : ic) + '<span>' + t.label + '</span></a>';
    }).join('') + '<button type="button" class="tb-more" aria-label="More pages">' + icon('grid') + '<span>More</span></button>';
    document.body.appendChild(nav);
    $('.tb-more', nav).addEventListener('click', function () { var b = $('.menu-btn'); if (b) b.click(); });
  }

  /* The footer wordmark as a manga splash panel: speed lines and halftone behind, each
     letter slams in with an impact flash, a katana slash cuts across, the panel shakes and
     SFX pop. Then the letters idle, follow the pointer and jump when hovered. */
  function mangaWord(name) {
    var letters = name.split('').map(function (ch, i) { return '<span class="fm-l" style="--i:' + i + '" data-ch="' + esc(ch) + '">' + esc(ch) + '</span>'; }).join('');
    return '<div class="ftr-manga" aria-hidden="true"><div class="fm-panel">' +
      '<i class="fm-rays"></i><i class="fm-dots"></i><i class="fm-flash"></i>' +
      '<span class="fm-jp">自来也</span>' +
      '<div class="fm-word">' + letters + '</div>' +
      '<i class="fm-slash"></i>' +
      '<span class="fm-sfx s1">ドン!</span><span class="fm-sfx s2">ゴゴゴ</span><span class="fm-sfx s3">斬</span>' +
      '<span class="fm-cap">Chapter ∞ · The toad sage of code</span>' +
      '</div></div>';
  }
  function mangaFooter() {
    var m = $('.ftr-manga'); if (!m) return;
    var panel = $('.fm-panel', m);
    if (reduce) { m.classList.add('go', 'done'); return; }
    whenVisible(m, function () { m.classList.add('go'); setTimeout(function () { m.classList.add('done'); }, 2600); }, '-15% 0px');
    if (!fine) return;
    panel.addEventListener('pointermove', function (e) {
      var r = panel.getBoundingClientRect();
      panel.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      panel.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
    panel.addEventListener('pointerleave', function () { panel.style.setProperty('--px', 0); panel.style.setProperty('--py', 0); });
    panel.addEventListener('click', function () { m.classList.remove('go', 'done'); void m.offsetWidth; m.classList.add('go'); setTimeout(function () { m.classList.add('done'); }, 2600); });
  }
  function buildFooter() {
    var f = $('#site-footer');
    if (!f) return;
    var svc = SERVICES.slice(0, 7).map(function (s) {
      return '<li><a href="showcase.html#' + s.id + '">' + esc(s.name) + '</a></li>';
    }).join('');
    var ct = contacts().map(function (c) {
      return '<li><a href="' + esc(c.href) + '" target="_blank" rel="noopener">' + icon(c.icon) + esc(c.text) + '</a></li>';
    }).join('');
    f.innerHTML =
      '<div class="container container-wide">' +
        '<div class="ftr-cta">' +
          '<span class="eyebrow">Next chapter · 次の章</span>' +
          '<h2 class="h1">Got an idea? Send it over. <span class="grad-text">I’ll build it.</span></h2>' +
          '<div class="flex wrap"><a class="btn btn-primary btn-lg" href="hire.html" data-magnetic>Start a project ' + icon('arrow-right') + '</a>' +
          '<a class="btn btn-ghost btn-lg" href="showcase.html">Explore the Lab</a></div>' +
        '</div>' +
        '<div class="ftr-grid">' +
          '<div class="ftr-about"><a class="brand" href="index.html">' + brandMark() + '<span class="brand-word">' + esc((C.name || 'Xiraiya').toUpperCase()) + '</span></a>' +
            '<p>' + esc(C.age) + '-year-old developer from ' + esc(C.city) + ', ' + esc(C.country) + '. ' + esc(C.experienceYears) + '+ years building websites, bots, apps and AI agents that keep working after I log off.</p>' +
            '<div class="ftr-clock">' + icon('clock') + '<span>' + esc(C.city) + ' · <b data-clock>--:--</b> GMT+6</span></div>' +
            (C.contact && real(C.contact.telegram) ? '<a class="ftr-tg" href="https://t.me/' + esc(C.contact.telegram) + '" target="_blank" rel="noopener" aria-label="Message Xiraiya on Telegram"><span class="ftr-tg-ic">' + tgLogo() + '</span><span><small>Fastest reply</small><b>@' + esc(C.contact.telegram) + '</b></span>' + icon('arrow-up-right') + '</a>' : '') + '</div>' +
          '<div><h3>Explore</h3><ul>' + NAV.map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('') + '</ul></div>' +
          '<div><h3>Services</h3><ul>' + svc + '<li><a href="showcase.html">All services</a></li></ul></div>' +
          '<div><h3>Contact</h3><ul>' + ct + '<li><a href="hire.html">' + icon('briefcase') + 'Project brief form</a></li></ul></div>' +
        '</div>' +
      '</div>' +
      mangaWord((C.name || 'Xiraiya').toUpperCase()) +
      '<div class="container container-wide ftr-bottom">' +
        '<span>© <span data-year></span> ' + esc(C.name) + ' · Hand-made in ' + esc(C.city) + ', ' + esc(C.country) + ' with ink, tea and one very patient toad.</span>' +
        '<a class="to-top" href="#top" data-no-transition>Back to top ' + icon('arrow-up') + '</a>' +
      '</div>';
  }

  /* ------------------------------------------------------------------
     Global overlays: grain, progress, curtain, toasts
     ------------------------------------------------------------------ */
  function overlays() {
    var frag = document.createElement('div');
    frag.innerHTML =
      '<div class="curtain" aria-hidden="true"><div class="curtain-panel p1"></div><div class="curtain-panel p2"></div><div class="curtain-mark"><span class="jp">忍</span>' + brandMark() + '</div></div>' +
      '<div class="progress" aria-hidden="true"></div>' +
      '<div class="grain" aria-hidden="true"></div>' +
      '<div class="toasts" role="status" aria-live="polite"></div>';
    while (frag.firstChild) document.body.appendChild(frag.firstChild);
  }

  function toast(msg, type) {
    var box = $('.toasts');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = icon(type === 'warn' ? 'info' : 'check') + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 2800);
  }

  /* ------------------------------------------------------------------
     Page transitions
     ------------------------------------------------------------------ */
  function transitions() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.protocol !== location.protocol || url.host !== location.host) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page (hash)
      e.preventDefault();
      if (root.classList.contains('menu-open')) root.classList.remove('menu-open');
      root.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, reduce ? 0 : 480);
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) root.classList.remove('is-leaving');
    });
  }

  /* ------------------------------------------------------------------
     Split text + reveal
     ------------------------------------------------------------------ */
  function splitText(el) {
    if (el.__split) return;
    el.__split = true;
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var ci = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'w';
            w.setAttribute('aria-hidden', 'true');
            Array.from(part).forEach(function (ch) {
              var c = document.createElement('span');
              c.className = 'c'; c.style.setProperty('--ci', ci++); c.textContent = ch;
              w.appendChild(c);
            });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          if (n.classList.contains('no-split') || n.classList.contains('grad-text')) {
            // keep the element whole per word (so gradients stay intact) but let phrases wrap between words
            var words = n.children.length ? [null] : n.textContent.trim().split(/\s+/);
            var group = document.createDocumentFragment(), mark = document.createTextNode('');
            n.replaceWith(mark);
            words.forEach(function (word, i) {
              if (i) group.appendChild(document.createTextNode(' '));
              var w = document.createElement('span'), c = document.createElement('span');
              w.className = 'w'; w.setAttribute('aria-hidden', 'true');
              c.className = 'c'; c.style.setProperty('--ci', ci++);
              var piece = word === null ? n : n.cloneNode(false);
              if (word !== null) piece.textContent = word;
              c.appendChild(piece); w.appendChild(c); group.appendChild(w);
            });
            mark.replaceWith(group);
          } else walk(n);
        }
      });
    }
    walk(el);
    el.classList.add('split');
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', label);
  }

  var io;
  function reveals(scope) {
    var els = $$('[data-reveal],[data-split]', scope);
    els.forEach(function (el) { if (el.hasAttribute('data-split')) splitText(el); });
    if (!('IntersectionObserver' in window) || reduce) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          if (el.getAttribute('data-split') === 'ready' && !root.classList.contains('is-ready')) return;
          el.classList.add('is-in');
          io.unobserve(el);
        });
      }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    }
    els.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Scroll effects: header, progress, parallax
     ------------------------------------------------------------------ */
  function scrollFx() {
    var hdr = $('#site-header'), bar = $('.progress');
    var par = $$('[data-speed]');
    var lastY = scrollY, ticking = false;
    function update() {
      ticking = false;
      var y = scrollY, max = document.documentElement.scrollHeight - innerHeight, vh = innerHeight;
      /* read every parallax rect before any style write below, so one layout serves them all */
      var rects = reduce ? null : par.map(function (el) { return (el.parentElement || el).getBoundingClientRect(); });
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
      if (hdr) {
        hdr.classList.toggle('is-scrolled', y > 24);
        if (!root.classList.contains('menu-open')) hdr.classList.toggle('is-hidden', y > 320 && y > lastY + 2);
        if (y < lastY - 2) hdr.classList.remove('is-hidden');
      }
      lastY = y;
      if (!reduce) par.forEach(function (el, i) {
        var r = rects[i];
        if (r.bottom < -200 || r.top > vh + 200) return;
        var d = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-speed'));
        el.style.transform = 'translate3d(0,' + d.toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ------------------------------------------------------------------
     Interactions: magnetic, tilt, spotlight, counters, marquee, copy, clock
     ------------------------------------------------------------------ */
  function magnetic() {
    if (!fine || reduce) return;
    var cur = null;
    document.addEventListener('pointermove', function (e) {
      var m = e.target.closest ? e.target.closest('[data-magnetic]') : null;
      if (cur && cur !== m) { cur.classList.remove('is-mag'); cur.style.transform = ''; }
      cur = m;
      if (!m) return;
      var r = m.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      m.classList.add('is-mag');
      m.style.transform = 'translate(' + (dx * .22).toFixed(1) + 'px,' + (dy * .3).toFixed(1) + 'px)';
    }, { passive: true });
  }

  function tilt() {
    if (!fine || reduce) return;
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 8;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * max).toFixed(2) + 'deg) rotateY(' + (px * max).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  function spotlight() {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.card');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  function counters() {
    var els = $$('[data-count],[data-count-cfg]');
    els.forEach(function (el) {
      var cfg = el.getAttribute('data-count-cfg');
      if (cfg) el.setAttribute('data-count', get(C, cfg) || 0);
      el.textContent = reduce ? Number(el.getAttribute('data-count')).toLocaleString('en-US') + (el.getAttribute('data-suffix') || '') : '0';
    });
    if (reduce || !('IntersectionObserver' in window)) return;
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        o.unobserve(en.target);
        var el = en.target, to = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '', t0 = performance.now(), dur = 2000;
        (function step(t) {
          var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(2, -10 * k);
          el.textContent = Math.round(to * (k === 1 ? 1 : e)).toLocaleString('en-US') + suf;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: .4 });
    els.forEach(function (el) { o.observe(el); });
  }

  function marquees() {
    $$('.marquee').forEach(function (m) {
      var t = $('.marquee-track', m);
      if (!t || m.__dup) return;
      m.__dup = true;
      var c = t.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      m.appendChild(c);
    });
  }

  function copyButtons() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      var v = b.getAttribute('data-copy');
      if (v.charAt(0) === '#') { var t = $(v); v = t ? (t.value || t.textContent) : ''; }
      copy(v).then(function () { toast('Copied to clipboard'); });
    });
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(fallback);
    return Promise.resolve(fallback());
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      ta.remove();
    }
  }

  function clock() {
    var els = $$('[data-clock]');
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    if (!els.length) return;
    var fmt;
    try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: C.timezone || 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false }); }
    catch (e) { fmt = { format: function (d) { return d.toTimeString().slice(0, 5); } }; }
    function tick() {
      var parts = fmt.format(new Date()).split(':');
      els.forEach(function (el) { el.innerHTML = parts[0] + '<span class="colon">:</span>' + parts[1]; });
    }
    tick(); setInterval(tick, 15000);
  }

  function fillConfig() {
    $$('[data-cfg]').forEach(function (el) { var v = get(C, el.getAttribute('data-cfg')); if (v != null) el.textContent = v; });
    $$('[data-price]').forEach(function (el) {
      var s = SERVICES.find(function (x) { return x.id === el.getAttribute('data-price'); });
      if (s) el.textContent = fmtPrice(s.priceFrom);
    });
    $$('[data-contact]').forEach(function (el) {
      var id = el.getAttribute('data-contact');
      var c = contacts().find(function (x) { return x.id === id; });
      if (!c) { el.hidden = true; return; }
      el.href = c.href;
      if (el.hasAttribute('data-contact-text')) el.textContent = c.text;
    });
  }

  /* ------------------------------------------------------------------
     Sakura petals / particle canvas
     ------------------------------------------------------------------ */
  function petals(canvas, opts) {
    if (!canvas || !canvas.getContext) return;
    opts = opts || {};
    var ctx = canvas.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W, H, parts = [], running = true, visible = true, onScreen = true, looping = false;
    var colors = opts.colors || ['#e0442e', '#f2a7a0', '#f6c9c1', '#eab3a8', '#d9a441'];
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(W * H / (opts.density || 26000), phone ? 6 : 12, phone ? 16 : (opts.max || 70)));
      parts = [];
      for (var i = 0; i < n; i++) parts.push(make(true));
    }
    function make(init) {
      var petal = Math.random() < (opts.petalRatio == null ? .55 : opts.petalRatio);
      return {
        x: Math.random() * W, y: init ? Math.random() * H : -20,
        s: petal ? 3.5 + Math.random() * 5 : .8 + Math.random() * 1.4,
        vy: petal ? .35 + Math.random() * .8 : .1 + Math.random() * .3,
        vx: -.2 + Math.random() * .6, a: Math.random() * 6.28, va: -.03 + Math.random() * .06,
        sw: Math.random() * 6.28, petal: petal, c: colors[(Math.random() * colors.length) | 0],
        o: .25 + Math.random() * .6
      };
    }
    function draw() {
      if (!running) return;
      /* off-screen or hidden tab: stop the loop entirely, wake() restarts it */
      if (!visible) { looping = false; return; }
      requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.sw += .02; p.a += p.va;
        p.x += p.vx + Math.sin(p.sw) * .6; p.y += p.vy;
        if (p.y > H + 20 || p.x < -30 || p.x > W + 30) { parts[i] = make(false); parts[i].x = Math.random() * W; continue; }
        ctx.save(); ctx.globalAlpha = p.o; ctx.fillStyle = p.c; ctx.translate(p.x, p.y); ctx.rotate(p.a);
        if (p.petal) {
          ctx.scale(1, .55 + Math.abs(Math.sin(p.sw)) * .45);
          ctx.beginPath(); ctx.moveTo(0, -p.s);
          ctx.bezierCurveTo(p.s * .9, -p.s * .7, p.s * .8, p.s * .6, 0, p.s);
          ctx.bezierCurveTo(-p.s * .8, p.s * .6, -p.s * .9, -p.s * .7, 0, -p.s);
          ctx.fill();
        } else { ctx.beginPath(); ctx.arc(0, 0, p.s, 0, 6.283); ctx.fill(); }
        ctx.restore();
      }
    }
    resize();
    window.addEventListener('resize', resize);
    function wake() {
      visible = onScreen && !document.hidden;
      if (visible && running && !looping) { looping = true; requestAnimationFrame(draw); }
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[en.length - 1].isIntersecting; wake(); }).observe(canvas);
    document.addEventListener('visibilitychange', wake);
    if (reduce) { visible = true; draw(); running = false; return; }
    looping = true;
    draw();
  }




  // Poke a character: it hops and cracks a joke in the nearest speech bubble
  var JOKES = {
    sage: ['Ouch! That is my coding hand.', 'Stop poking, I am compiling.', 'I do not fix bugs. The toad eats them.', 'Deploy on a Friday? Bold. I like it.', 'My mane is 40% hair, 60% ideas.', 'Xiri approved this joke. Barely.', 'The toad is my senior DevOps engineer.', 'Ribbit means "ship it" in toad.'],
    tsunade: ['Tests first. Tea second.', 'I stamp OK only when it is perfect.', 'Your build is broken. I am already healing it.', 'The slug answers tickets faster than it moves.', 'Xiraiya wrote it. I made it work.', 'No console errors on my watch.']
  };
  function pokeMascots() {
    document.addEventListener('click', function (e) {
      var m = e.target.closest && e.target.closest('.mascot');
      if (!m || m.classList.contains('mini-crew')) return;
      m.classList.remove('hop'); void m.getBoundingClientRect(); m.classList.add('hop');
      var box = m.closest('.hero-visual, .nf-mascot, .hire-mascot, .crew-card') || m.parentElement;
      var bubble = box && $('.bubble', box);
      var list = m.classList.contains('tsunade') ? JOKES.tsunade : JOKES.sage;
      var line = list[(Math.random() * list.length) | 0];
      if (bubble) {
        var t = $('.typer', bubble) || bubble;
        t.textContent = line;
        bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      } else toast(line);
    });
  }

  /* ------------------------------------------------------------------
     Paper (light) / ink (dark) mode, pointer-aware button fills,
     inertia smooth scrolling
     ------------------------------------------------------------------ */
  function modeToggle() {
    function label() {
      var ink = root.getAttribute('data-mode') === 'ink';
      $$('[data-mode-toggle]').forEach(function (b) { b.setAttribute('aria-label', ink ? 'Switch to paper (light) mode' : 'Switch to ink (dark) mode'); b.setAttribute('aria-pressed', ink ? 'true' : 'false'); });
      var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', ink ? '#0f0d0b' : '#f6f1e7');
    }
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-mode-toggle]')) return;
      var ink = root.getAttribute('data-mode') !== 'ink';
      root.classList.add('mode-anim');
      if (ink) root.setAttribute('data-mode', 'ink'); else root.removeAttribute('data-mode');
      try { localStorage.setItem('xr-mode', ink ? 'ink' : 'paper'); } catch (err) { /* ignore */ }
      label();
      toast(ink ? 'Ink mode. The toad approves.' : 'Paper mode. Fresh washi, fresh ideas.');
      setTimeout(function () { root.classList.remove('mode-anim'); }, 700);
    });
    label();
  }
  function buttonFills() {
    document.addEventListener('pointerover', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (!b || (e.relatedTarget && b.contains(e.relatedTarget))) return;
      var r = b.getBoundingClientRect();
      b.style.setProperty('--bx', (e.clientX - r.left).toFixed(0) + 'px');
      b.style.setProperty('--by', (e.clientY - r.top).toFixed(0) + 'px');
      b.style.setProperty('--btn-grow', Math.ceil(Math.hypot(r.width, r.height) / 4.4));
    }, { passive: true });
  }
  /* Performance: freeze CSS animations in page blocks that are far off screen.
     A block gets .xr-offscreen (see assets/css/perf.css: animation-play-state: paused)
     while it is more than ~one screen away, so the browser stops recalculating
     styles every frame for loops nobody can see. Blocks that hold overlays which
     can go position:fixed are left alone. Tall blocks are split into their children. */
  function pauseOffscreen() {
    if (!('IntersectionObserver' in window)) return;
    var SKIP = '.wx, [class*="lw-"], .pst, .modal, .drawer, .lv, .palette, .studio, .present, dialog, [aria-modal]';
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { e.target.classList.toggle('xr-offscreen', !e.isIntersecting); });
    }, { rootMargin: '100% 0px' });
    var vh = innerHeight;
    function add(el, depth) {
      if (el.offsetHeight < 2 || el.querySelector(SKIP)) {
        /* too small to observe, or holds an overlay: split it further when we can */
        if (el.offsetHeight >= 2 && depth < 3) $$(':scope > *', el).forEach(function (c) { if (!c.matches(SKIP)) add(c, depth + 1); });
        return;
      }
      if (depth < 3 && el.offsetHeight > vh * 2.5 && el.children.length > 1) { $$(':scope > *', el).forEach(function (c) { add(c, depth + 1); }); return; }
      io.observe(el);
    }
    $$('main > *').forEach(function (el) { add(el, 0); });
  }

  // Inertia scrolling for mouse wheels (trackpads, touch, keyboard and scrollbars stay native)
  function smoothScroll() {
    if (reduce || !fine || !window.requestAnimationFrame) return;
    var target = scrollY, current = scrollY, running = false;
    function scrollable(el) {
      for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        if (el.scrollHeight > el.clientHeight + 2) {
          var oy = getComputedStyle(el).overflowY;
          if (oy === 'auto' || oy === 'scroll') return true;
        }
      }
      return false;
    }
    function step() {
      current += (target - current) * .12;
      if (Math.abs(target - current) < .6) { current = target; running = false; }
      window.scrollTo({ top: current, behavior: 'instant' });
      if (running) requestAnimationFrame(step);
    }
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || e.deltaMode !== 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaY) < 40 && !running) return; // small deltas = trackpad, keep native
      if (scrollable(e.target) || document.body.style.overflow === 'hidden') return;
      e.preventDefault();
      if (!running) { target = current = scrollY; }
      var max = document.documentElement.scrollHeight - innerHeight;
      target = clamp(target + e.deltaY, 0, max);
      if (!running) { running = true; requestAnimationFrame(step); }
    }, { passive: false });
    window.addEventListener('scroll', function () { if (!running) target = current = scrollY; }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Command Center: search every page, demo and action (Ctrl / Cmd + K)
     + visitor quest log (try things, earn XP) + a hidden Konami secret
     ------------------------------------------------------------------ */
  var QUESTS = [
    { id: 'page-home', label: 'Visit the home page', xp: 10 },
    { id: 'page-lab', label: 'Enter the Lab', xp: 10 },
    { id: 'page-shop', label: 'Browse the shop demo', xp: 10 },
    { id: 'page-kit', label: 'Open the UI Kit', xp: 10 },
    { id: 'page-demos', label: 'Look at the demo sites', xp: 10 },
    { id: 'page-hire', label: 'Check the Hire page', xp: 10 },
    { id: 'page-pages', label: 'Open the Pages Studio', xp: 10 },
    { id: 'page-world', label: 'Walk into Dev World', xp: 10 },
    { id: 'studio-export', label: 'Export a page from the studio', xp: 20 },
    { id: 'world-terminal', label: 'Run a command in the village terminal', xp: 20 },
    { id: 'world-tool', label: 'Use a tool in the Dev Toolbox', xp: 20 },
    { id: 'world-passport', label: 'Collect all 7 village stamps', xp: 50 },
    { id: 'stage-web', label: 'Try the live website preview', xp: 20 },
    { id: 'stage-automation', label: 'Run the automation workflow', xp: 20 },
    { id: 'stage-telegram', label: 'Chat with the Telegram bot', xp: 20 },
    { id: 'stage-extension', label: 'Use the Chrome extension', xp: 20 },
    { id: 'stage-minecraft', label: 'Play BlockRealm survival', xp: 30 },
    { id: 'stage-desktop', label: 'Install the desktop app', xp: 20 },
    { id: 'stage-mobile', label: 'Tap around the Android app', xp: 20 },
    { id: 'stage-agent', label: 'Give the AI agent a goal', xp: 20 },
    { id: 'stage-chat', label: 'Talk to the AI support chat', xp: 20 },
    { id: 'stage-ecommerce', label: 'Watch the store autopilot', xp: 20 },
    { id: 'stage-crypto', label: 'Pay the crypto invoice', xp: 20 },
    { id: 'learn', label: 'Open a Basic Knowledge lesson', xp: 20 },
    { id: 'wing', label: 'Open a Motion Wing exhibit full screen', xp: 20 },
    { id: 'palette', label: 'Open the Command Center', xp: 10 },
    { id: 'konami', label: 'Find the secret code', xp: 50, secret: 1 }
  ];
  function questState() { return store('xr-quests') || {}; }
  function questXp(st) { return QUESTS.reduce(function (a, q) { return a + (st[q.id] ? q.xp : 0); }, 0); }
  function questLevel(xp) { return 1 + Math.floor(xp / 60); }
  function quest(id) {
    var q = QUESTS.find(function (x) { return x.id === id; });
    if (!q) return;
    var st = questState();
    if (st[id]) return;
    var before = questLevel(questXp(st));
    st[id] = Date.now();
    store('xr-quests', st);
    var xp = questXp(st), lvl = questLevel(xp);
    questToast(q, lvl > before ? lvl : 0);
    var done = QUESTS.filter(function (x) { return st[x.id]; }).length;
    if (done === QUESTS.length) setTimeout(function () { toast('All quests complete. You have seen everything. Ready to build yours?'); }, 2600);
  }
  function questToast(q, levelUp) {
    var box = $('.toasts');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast quest';
    t.innerHTML = '<span class="q-ic">' + icon('shuriken') + '</span><span><small>' + (levelUp ? 'Level up · Lv ' + levelUp : 'Quest complete') + '</small>' + esc(q.label) + '</span><b>+' + q.xp + ' XP</b>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 3400);
  }

  function paletteItems() {
    var items = [];
    NAV.forEach(function (n) { items.push({ g: 'Pages', t: n.label, s: n.jp, ic: n.id === 'hire' ? 'briefcase' : n.id === 'shop' ? 'cart' : n.id === 'lab' ? 'sparkle' : n.id === 'kit' ? 'layers' : n.id === 'demos' ? 'monitor' : n.id === 'pages' ? 'window' : n.id === 'world' ? 'terminal' : n.id === 'learn' ? 'book' : 'home', href: n.href }); });
    SERVICES.forEach(function (sv) { items.push({ g: 'Live demos in the Lab', t: sv.name, s: 'from ' + fmtPrice(sv.priceFrom), ic: sv.icon, href: 'showcase.html#' + sv.id }); });
    [['Aurèle', 'Fine jewellery atelier', 'aurele'], ['Nordhem', 'Furniture and sofa builder', 'nordhem'], ['Halide', 'Film cameras and lab', 'halide'], ['Kage Build', 'Gaming PC configurator', 'kage'], ['Stride', 'Sneaker drops and raffle', 'stride'], ['Nova AI', 'SaaS landing page', 'nova-saas'], ['Sakura Bistro', 'Restaurant', 'sakura-bistro'], ['Vault', 'Crypto dashboard', 'vault-dashboard'], ['BlockRealm', 'Minecraft server site', 'blockrealm'], ['Pulse', 'App landing page', 'pulse-app'], ['Mori Tea', 'Tea shop', 'mori-tea'], ['Haven', 'Architecture and homes', 'haven'], ['Ledger', 'Banking dashboard', 'ledger'], ['Nomad', 'Travel booking', 'nomad'], ['Kumo Docs', 'Developer docs', 'devdocs']].forEach(function (d) {
      items.push({ g: 'Demo websites', t: d[0], s: d[1], ic: 'window', href: 'demos/' + d[2] + '.html' });
    });
    items.push(
      { g: 'Actions', t: 'Play BlockRealm (Minecraft survival)', s: 'Mine, craft, fight zombies', ic: 'cube', href: 'showcase.html#minecraft' },
      { g: 'Actions', t: 'Get a price estimate', s: '60-second configurator', ic: 'sliders', href: 'hire.html#configure' },
      { g: 'Actions', t: 'Start a project', s: 'Send a brief', ic: 'rocket', href: 'hire.html' },
      { g: 'Actions', t: 'Pay with crypto (demo)', s: 'Auto-confirming checkout', ic: 'btc', href: 'showcase.html#crypto' },
      { g: 'Actions', t: 'Shop with the AI assistant', s: 'Store demo', ic: 'bag', href: 'shop.html' }
    );
    var c = (C.contact || {});
    if (c.email) items.push({ g: 'Actions', t: 'Copy email address', s: c.email, ic: 'mail', run: function () { copy(c.email).then(function () { toast('Email copied'); }); } });
    items.push({ g: 'Actions', t: 'Back to top', s: 'Scroll up', ic: 'arrow-up', run: function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); } });
    return items;
  }
  function score(text, q) {
    text = text.toLowerCase();
    if (!q) return 1;
    var i = text.indexOf(q);
    if (i >= 0) return 100 - i;
    var ti = 0, sc = 0;
    for (var k = 0; k < q.length; k++) { var f = text.indexOf(q[k], ti); if (f < 0) return 0; sc += f === ti ? 3 : 1; ti = f + 1; }
    return sc;
  }
  var pal = null;
  function palette() {
    if (pal) { pal.open(); return; }
    var el = document.createElement('div');
    el.className = 'palette';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Command Center');
    el.innerHTML = '<div class="pal-backdrop" data-close></div><div class="pal-box">' +
      '<div class="pal-search">' + icon('search') + '<input type="text" placeholder="Search pages, demos, services..." aria-label="Search" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div>' +
      '<div class="pal-body"><div class="pal-list" role="listbox"></div><aside class="pal-quests"></aside></div>' +
      '<div class="pal-foot"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> move</span><span><kbd>Enter</kbd> open</span><span class="pal-tip">Tip: try the Konami code somewhere on the site</span></div></div>';
    document.body.appendChild(el);
    var input = $('input', el), list = $('.pal-list', el), side = $('.pal-quests', el), items = paletteItems(), shown = [], idx = 0, last;
    function renderQuests() {
      var st = questState(), xp = questXp(st), lvl = questLevel(xp), into = xp % 60, done = QUESTS.filter(function (q) { return st[q.id]; }).length;
      side.innerHTML = '<div class="pq-head"><span class="pq-lv">Lv ' + lvl + '</span><div><b>Visitor quest log</b><small>' + done + ' of ' + QUESTS.length + ' quests · ' + xp + ' XP</small></div></div>' +
        '<div class="pq-bar"><i style="width:' + (into / 60 * 100).toFixed(1) + '%"></i></div>' +
        '<ul>' + QUESTS.map(function (q) {
          var ok = !!st[q.id];
          return '<li class="' + (ok ? 'ok' : '') + '">' + icon(ok ? 'check' : q.secret ? 'lock' : 'target') + '<span>' + (q.secret && !ok ? 'Secret quest' : esc(q.label)) + '</span><em>' + q.xp + '</em></li>';
        }).join('') + '</ul>';
    }
    function render() {
      var q = input.value.trim().toLowerCase();
      shown = items.map(function (it) { return { it: it, sc: Math.max(score(it.t, q), score(it.s || '', q) * .6, score(it.g, q) * .3) }; })
        .filter(function (x) { return x.sc > 0; }).sort(function (a, b) { return q ? b.sc - a.sc : 0; }).map(function (x) { return x.it; });
      idx = Math.min(idx, Math.max(0, shown.length - 1));
      var html = '', g = '';
      shown.forEach(function (it, i) {
        if (it.g !== g && !q) { g = it.g; html += '<p class="pal-g">' + esc(g) + '</p>'; }
        html += '<a class="pal-item' + (i === idx ? ' on' : '') + '" role="option" aria-selected="' + (i === idx) + '" data-i="' + i + '"' + (it.href ? ' href="' + esc(it.href) + '"' : ' href="#"') + '>' + icon(it.ic || 'arrow-right') + '<span><b>' + esc(it.t) + '</b>' + (it.s ? '<small>' + esc(it.s) + '</small>' : '') + '</span>' + icon('arrow-right', 'pal-go') + '</a>';
      });
      list.innerHTML = html || '<p class="pal-empty">No results for “' + esc(input.value) + '”.</p>';
    }
    function move(d) {
      if (!shown.length) return;
      idx = (idx + d + shown.length) % shown.length; render();
      var on = $('.pal-item.on', list); if (on) on.scrollIntoView({ block: 'nearest' });
    }
    function go(i) {
      var it = shown[i]; if (!it) return;
      if (it.run) { close(); it.run(); return; }
      close();
      var a = document.createElement('a'); a.href = it.href; document.body.appendChild(a); a.click(); a.remove();
    }
    function open() {
      last = document.activeElement;
      items = paletteItems(); input.value = ''; idx = 0; render(); renderQuests();
      el.classList.add('is-open'); document.body.style.overflow = 'hidden';
      setTimeout(function () { input.focus({ preventScroll: true }); }, 30);
      quest('palette'); renderQuests();
    }
    function close() {
      el.classList.remove('is-open'); document.body.style.overflow = '';
      if (last && last.focus) last.focus({ preventScroll: true });
    }
    input.addEventListener('input', function () { idx = 0; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); go(idx); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    list.addEventListener('click', function (e) { var a = e.target.closest('.pal-item'); if (!a) return; e.preventDefault(); go(+a.getAttribute('data-i')); });
    list.addEventListener('mousemove', function (e) { var a = e.target.closest('.pal-item'); if (a && +a.getAttribute('data-i') !== idx) { idx = +a.getAttribute('data-i'); $$('.pal-item', list).forEach(function (x, i) { x.classList.toggle('on', i === idx); }); } });
    el.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    pal = { open: open, close: close, el: el };
    open();
  }
  function commandCenter() {
    document.addEventListener('click', function (e) { if (e.target.closest('[data-palette]')) { e.preventDefault(); if (root.classList.contains('menu-open')) { var b = $('.menu-btn'); if (b) b.click(); } palette(); } });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (pal && pal.el.classList.contains('is-open')) pal.close(); else palette();
      }
    });
    // page-visit quests + quests for trying each Lab stage
    var pageQuest = { home: 'page-home', lab: 'page-lab', shop: 'page-shop', kit: 'page-kit', demos: 'page-demos', hire: 'page-hire', pages: 'page-pages', world: 'page-world' }[page];
    if (pageQuest) setTimeout(function () { quest(pageQuest); }, 2200);
    document.addEventListener('pointerdown', function (e) {
      var st = e.target.closest && e.target.closest('[data-stage]');
      if (st) quest('stage-' + st.getAttribute('data-stage'));
    }, true);
    // Konami code: up up down down left right left right B A
    var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0;
    document.addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) { pos = 0; shinobiMode(); }
    });
  }
  function shinobiMode() {
    quest('konami');
    toast('Secret found: Shinobi mode');
    var c = document.createElement('canvas');
    c.className = 'shinobi-storm'; c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    root.classList.add('shinobi');
    petals(c, { density: 2600, max: 260, petalRatio: .9 });
    setTimeout(function () { c.classList.add('out'); root.classList.remove('shinobi'); setTimeout(function () { c.remove(); }, 1200); }, 6500);
  }

  /* ------------------------------------------------------------------
     Intro loader (home only) + ready state
     ------------------------------------------------------------------ */
  var readyFns = [], isReady = false;
  function onReady(fn) { if (isReady) fn(); else readyFns.push(fn); }
  function setReady() {
    if (isReady) return;
    isReady = true;
    root.classList.add('is-ready');
    root.classList.remove('is-loading');
    readyFns.forEach(function (f) { try { f(); } catch (e) { console.error(e); } });
    $$('[data-split="ready"]').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight) el.classList.add('is-in');
    });
  }

  function loader() {
    var L = $('#loader');
    if (!L) { setTimeout(setReady, reduce ? 0 : 380); return; }
    var seen = false;
    try { seen = sessionStorage.getItem('xr-intro') === '1'; } catch (e) { /* ignore */ }
    if (seen || reduce) { L.remove(); setTimeout(setReady, reduce ? 0 : 300); return; }
    try { sessionStorage.setItem('xr-intro', '1'); } catch (e) { /* ignore */ }
    root.classList.add('is-loading');
    L.classList.add('is-running');
    var num = $('.loader-num', L), n = 3, done = false;
    function finish() {
      if (done) return;
      done = true;
      L.classList.add('is-done');
      setTimeout(setReady, 350);
      setTimeout(function () { L.remove(); }, 1300);
    }
    var iv = setInterval(function () {
      n--;
      if (n <= 0) { clearInterval(iv); finish(); return; }
      if (num) { num.textContent = ['〇', '一', '二', '三'][n] || n; num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); }
    }, 520);
    L.addEventListener('click', function () { clearInterval(iv); finish(); });
    document.addEventListener('keydown', function k() { clearInterval(iv); finish(); document.removeEventListener('keydown', k); });
  }

  /* ------------------------------------------------------------------
     Decorative QR-style pattern (always labelled "demo" in the UI)
     ------------------------------------------------------------------ */
  function seeded(str) {
    var a = 2166136261;
    for (var i = 0; i < str.length; i++) { a ^= str.charCodeAt(i); a = Math.imul(a, 16777619); }
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function qr(el, seed) {
    if (!el) return;
    var N = 25, r = seeded(String(seed)), cells = [], x, y;
    for (y = 0; y < N; y++) { cells[y] = []; for (x = 0; x < N; x++) cells[y][x] = r() > .52; }
    function finder(ox, oy) {
      for (var j = -1; j < 8; j++) for (var i = -1; i < 8; i++) {
        var X = ox + i, Y = oy + j;
        if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
        var edge = i === 0 || i === 6 || j === 0 || j === 6, core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        cells[Y][X] = (i >= 0 && i <= 6 && j >= 0 && j <= 6) && (edge || core);
      }
    }
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    for (x = 8; x < N - 8; x++) { cells[6][x] = x % 2 === 0; cells[x][6] = x % 2 === 0; }
    var d = '';
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (cells[y][x]) d += 'M' + x + ' ' + y + 'h1v1h-1z';
    el.innerHTML = '<svg viewBox="0 0 ' + N + ' ' + N + '" shape-rendering="crispEdges" aria-hidden="true"><path d="' + d + '" fill="#15120f"/></svg>';
  }

  /* ------------------------------------------------------------------
     Utilities exposed to page scripts
     ------------------------------------------------------------------ */
  function whenVisible(el, fn, margin) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var o = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { o.disconnect(); fn(); }
    }, { rootMargin: margin || '200px' });
    o.observe(el);
  }

  function modal(el) {
    var last;
    function open() {
      last = document.activeElement;
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var f = $('button, [href], input, select, textarea', el);
      setTimeout(function () { f && f.focus({ preventScroll: true }); }, 60);
    }
    function close() {
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (last && last.focus) last.focus({ preventScroll: true });
    }
    el.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el.classList.contains('is-open')) close(); });
    return { open: open, close: close };
  }

  window.XR = {
    $: $, $$: $$, clamp: clamp, lerp: lerp, esc: esc, icon: icon, store: store, toast: toast, copy: copy,
    fmtPrice: fmtPrice, contacts: contacts, mascot: mascot, tsunade: tsunade, brandMark: brandMark, petals: petals,
    reveals: reveals, whenVisible: whenVisible, onReady: onReady, modal: modal, reduce: reduce, fine: fine, phone: phone, qr: qr, seeded: seeded,
    config: C, services: SERVICES, quest: quest, palette: function () { palette(); }
  };

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  buildHeader();
  buildFooter();
  mangaFooter();
  buildTabbar();
  overlays();
  $$('[data-mascot]').forEach(function (el) {
    var k = el.getAttribute('data-mascot');
    var art = C.characters || {}, who = /^tsunade/.test(k) ? 'tsunade' : k === 'toad' || k === 'slug' ? k : 'xiraiya';
    var pose = el.getAttribute('data-pose') || k, src = who === 'xiraiya' && art.poses && art.poses[pose] || art[who];
    var LABEL = { tsunade: 'Xiri, head of QA', toad: 'Gama the toad', slug: 'Namekuji the slug', xiraiya: C.name || 'Xiraiya' };
    if (src) {
      el.innerHTML = standee(src, LABEL[who], (k || '') + ' pose-' + (pose || 'default') + (who === 'tsunade' ? ' tsunade' : who === 'xiraiya' ? ' sage' : ' crew-pet'));
      var bub = el.parentElement && el.parentElement.querySelector(':scope > .bubble');
      if (bub) { bub.classList.add('over'); el.parentElement.classList.add('has-art'); }
      return;
    }
    el.innerHTML = k === 'tsunade' ? tsunade() : k === 'tsunade-portrait' ? tsunade({ cls: 'portrait' }) : k === 'toad' ? miniToad() : k === 'slug' ? miniSlug() : mascot({ cls: k });
  });
  fillConfig();
  reveals();
  marquees();
  counters();
  scrollFx();
  magnetic();
  tilt();
  spotlight();
  copyButtons();
  clock();
  transitions();
  commandCenter();
  modeToggle();
  pokeMascots();
  buttonFills();
  smoothScroll();
  watchMascots();
  $$('canvas[data-petals]').forEach(function (c) { petals(c, { density: parseFloat(c.getAttribute('data-petals')) || 26000 }); });
  loader();
  onReady(function () { setTimeout(pauseOffscreen, 1200); });
})();
