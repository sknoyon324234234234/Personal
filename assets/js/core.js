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
    // o: {y, gap, iris, lash, lid}
    var y = o.y, L = 200 - o.gap, R = 200 + o.gap, out = '';
    [[L, -1, 'el', ''], [R, 1, 'er', ' m-eye-r']].forEach(function (e) {
      var cx = e[0], s = e[1];
      var sclera = 'M' + (cx - 11 * s) + ' ' + (y + 1) + 'C' + (cx - 8 * s) + ' ' + (y - 4.8) + ' ' + (cx + 4 * s) + ' ' + (y - 6.2) + ' ' + (cx + 11 * s) + ' ' + (y - 1.5) +
        'C' + (cx + 8 * s) + ' ' + (y + 4) + ' ' + (cx - 1 * s) + ' ' + (y + 6) + ' ' + (cx - 9 * s) + ' ' + (y + 4) + 'Z';
      out += '<clipPath id="' + p + e[2] + '"><path d="' + sclera + '"/></clipPath>' +
        '<g class="m-eye' + e[3] + '"><path d="' + sclera + '" fill="#fbf6ec"/>' +
        '<path d="M' + (cx - 11 * s) + ' ' + (y + 1) + 'C' + (cx - 6 * s) + ' ' + (y - 2) + ' ' + (cx + 6 * s) + ' ' + (y - 3) + ' ' + (cx + 11 * s) + ' ' + (y - 1.5) + '" stroke="#d9c8b8" stroke-width="2.4" fill="none" opacity=".6"/>' +
        '<g clip-path="url(#' + p + e[2] + ')"><g class="m-iris">' +
          '<circle cx="' + (cx + 1 * s) + '" cy="' + (y - .4) + '" r="5.6" fill="url(#' + p + 'i)"/><circle cx="' + (cx + 1 * s) + '" cy="' + (y - .4) + '" r="5.6" fill="none" stroke="' + o.iris + '" stroke-width="1" opacity=".8"/>' +
          '<circle cx="' + (cx + 1 * s) + '" cy="' + (y - .2) + '" r="2.4" fill="#140c06"/><circle cx="' + (cx - .8 * s) + '" cy="' + (y - 2.4) + '" r="1.5" fill="#fff"/><circle cx="' + (cx + 3 * s) + '" cy="' + (y + 2) + '" r=".7" fill="#fff" opacity=".8"/>' +
        '</g></g>' +
        // upper lid line with a flick at the outer corner
        '<path d="M' + (cx - 12 * s) + ' ' + (y + .5) + 'C' + (cx - 8 * s) + ' ' + (y - 6.4) + ' ' + (cx + 5 * s) + ' ' + (y - 8) + ' ' + (cx + 12.5 * s) + ' ' + (y - 2.2) + (o.lash ? 'L' + (cx + 15 * s) + ' ' + (y - 5) : '') + '" stroke="' + o.lid + '" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        (o.lash ? '<path d="M' + (cx + 9 * s) + ' ' + (y - 5.4) + 'l' + (2.6 * s) + ' -3M' + (cx + 5 * s) + ' ' + (y - 6.8) + 'l' + (1.6 * s) + ' -3.2" stroke="' + o.lid + '" stroke-width="1.2" stroke-linecap="round"/>' : '') +
        '<path d="M' + (cx - 8 * s) + ' ' + (y + 4.6) + 'C' + (cx - 2 * s) + ' ' + (y + 7) + ' ' + (cx + 5 * s) + ' ' + (y + 6) + ' ' + (cx + 10 * s) + ' ' + (y + 1) + '" stroke="' + o.lid + '" stroke-width=".9" fill="none" opacity=".45"/>' +
        '<path d="M' + (cx - 10 * s) + ' ' + (y - 9) + 'C' + (cx - 4 * s) + ' ' + (y - 12) + ' ' + (cx + 5 * s) + ' ' + (y - 12) + ' ' + (cx + 11 * s) + ' ' + (y - 7) + '" stroke="#c48f72" stroke-width="1" fill="none" opacity=".45"/>' +
        '</g>';
    });
    return out;
  }
  function stage(p, c1, c2) {
    return '<circle cx="200" cy="280" r="200" fill="url(#' + p + 'g)"/>' +
      '<g transform="translate(200 510) scale(1 .22)" opacity=".9"><g class="m-spin"><circle r="172" fill="none" stroke="' + c1 + '" stroke-width="3"/><circle r="152" fill="none" stroke="' + c1 + '" stroke-opacity=".5" stroke-width="2" stroke-dasharray="2 9"/>' +
      '<path d="M0-172V-124M0 172V124M-172 0H-124M172 0H124" stroke="' + c1 + '" stroke-width="3"/></g><g class="m-spin rev"><circle r="104" fill="none" stroke="' + c2 + '" stroke-opacity=".75" stroke-width="2"/></g></g>' +
      '<ellipse cx="200" cy="512" rx="96" ry="9" fill="#3a2a1e" opacity=".16"/>';
  }
  function hand(x, y, s, p) {
    return '<g><path d="M' + x + ' ' + y + 'c' + (-1 * s) + ' -7 ' + (8 * s) + ' -11 ' + (14 * s) + ' -7c' + (5 * s) + ' 4 ' + (5 * s) + ' 12 ' + (1 * s) + ' 17c' + (-5 * s) + ' 5 ' + (-13 * s) + ' 2 ' + (-15 * s) + ' -4z" fill="url(#' + p + 's)" stroke="#b98464" stroke-width=".8"/>' +
      '<path d="M' + (x + 5 * s) + ' ' + (y - 8) + 'l' + (2 * s) + ' 9M' + (x + 9 * s) + ' ' + (y - 8.5) + 'l' + (1.6 * s) + ' 9M' + (x + 12.5 * s) + ' ' + (y - 6.5) + 'l' + (.8 * s) + ' 7" stroke="#c08a6c" stroke-width=".8" opacity=".7"/></g>';
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
    return '<svg class="mascot sage ' + (opts.cls || '') + '" viewBox="0 0 400 540" role="img" aria-label="' + esc(C.name || 'Xiraiya') + ' — an original toad-sage character with a long white mane, red haori and a toad companion">' +
      '<defs>' + crewDefs(p) +
      '<radialGradient id="' + p + 'g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e0442e" stop-opacity=".26"/><stop offset=".6" stop-color="#d9a441" stop-opacity=".07"/><stop offset="1" stop-color="#d9a441" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#ece7dd"/><stop offset="1" stop-color="#bdb5a6"/></linearGradient>' +
      '<linearGradient id="' + p + 'hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2dccf"/><stop offset="1" stop-color="#a39a8a"/></linearGradient>' +
      '<linearGradient id="' + p + 's" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5d7bf"/><stop offset="1" stop-color="#dfae8e"/></linearGradient>' +
      '<linearGradient id="' + p + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dc4a2e"/><stop offset=".6" stop-color="#b8321f"/><stop offset="1" stop-color="#8a2314"/></linearGradient>' +
      '<linearGradient id="' + p + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e5d48"/><stop offset="1" stop-color="#22372a"/></linearGradient>' +
      '<linearGradient id="' + p + 'm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eeeae2"/><stop offset=".5" stop-color="#bdb6aa"/><stop offset="1" stop-color="#8d867b"/></linearGradient>' +
      '<radialGradient id="' + p + 'i" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffd98c"/><stop offset=".5" stop-color="#c9811f"/><stop offset="1" stop-color="#5a3208"/></radialGradient>' +
      '<clipPath id="' + p + 'coat"><path d="M122 226C140 212 170 205 200 205S260 212 278 226C288 300 294 390 298 468H102C106 390 112 300 122 226Z"/></clipPath>' +
      '<clipPath id="' + p + 'scr"><rect x="156" y="290" width="88" height="54" rx="2"/></clipPath>' +
      '</defs>' + stage(p, '#e0442e', '#d9a441') +
      '<g class="m-body">' +
        // scroll on the back
        '<g transform="rotate(-18 200 250)"><rect x="54" y="236" width="292" height="34" rx="17" fill="#ebe1c8" stroke="#6b5a40" stroke-width="1.6"/><path d="M70 244H330M70 262H330" stroke="#cdbf9c" stroke-width="1.4"/><rect x="44" y="230" width="22" height="46" rx="7" fill="#b8321f" stroke="#5a1a0e" stroke-width="1.6"/><rect x="334" y="230" width="22" height="46" rx="7" fill="#b8321f" stroke="#5a1a0e" stroke-width="1.6"/></g>' +
        // long mane behind
        '<g class="m-tail">' + hairLocks(mane, 'url(#' + p + 'hb)', '#9c9384', '#8f8778') + '</g>' +
        '<g class="m-crown">' + hairLocks(crown, H, '#aaa293', '#c3bcae') + '</g>' +
        // legs: hakama + geta
        '<path d="M158 464 154 502H192L195 464ZM205 464 208 502H246L242 464Z" fill="#2b2a33"/><path d="M172 468 170 502M224 468 226 502" stroke="#1b1a21" stroke-width="1.4" opacity=".7"/>' +
        '<path d="M146 504H198V511H146ZM202 504H254V511H202Z" fill="#7a5230"/><path d="M152 511V518M192 511V518M208 511V518M248 511V518" stroke="#4a3018" stroke-width="5"/><path d="M160 503 170 494 180 503M220 503 230 494 240 503" stroke="#efe4cc" stroke-width="2.6" fill="none"/>' +
        '<g class="m-breath">' +
          // haori
          '<path d="M122 226C140 212 170 205 200 205S260 212 278 226C288 300 294 390 298 468H102C106 390 112 300 122 226Z" fill="url(#' + p + 'r)"/>' +
          '<g clip-path="url(#' + p + 'coat)"><rect x="96" y="446" width="208" height="26" fill="#6e1c10"/><g fill="none" stroke="#efe4cc" stroke-width="1.6" opacity=".85">' + waves + '</g>' +
            '<g fill="none" stroke="#7a1d0f" stroke-width="2.2" stroke-linecap="round" opacity=".45"><path d="M142 256C148 320 150 380 148 446"/><path d="M258 256C252 320 250 380 252 446"/><path d="M126 300C128 360 126 410 120 446"/><path d="M276 300C274 360 276 410 282 446"/></g>' +
            '<path d="M130 238C146 226 162 219 176 216" stroke="#f47f5f" stroke-width="2" fill="none" opacity=".55"/></g>' +
          // kimono underneath, collar and haori lapels
          '<path d="M180 207C186 260 190 330 192 468H208C210 330 214 260 220 207Z" fill="url(#' + p + 'k)"/>' +
          '<path d="M181 208 200 262 219 208" fill="none" stroke="#e9e1d0" stroke-width="3"/>' +
          '<path d="M170 207H180C186 260 190 330 192 468H182C180 330 176 260 170 207ZM230 207H220C214 260 210 330 208 468H218C220 330 224 260 230 207Z" fill="#2b1d16"/>' +
          '<path d="M186 334H214V348H186Z" fill="#1b1511"/><path d="M186 341H214" stroke="#d9a441" stroke-width="1.4"/>' +
          '<circle cx="150" cy="246" r="8.5" fill="none" stroke="#efe4cc" stroke-width="1.4"/><circle cx="250" cy="246" r="8.5" fill="none" stroke="#efe4cc" stroke-width="1.4"/>' +
          '<text x="150" y="250" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="10" fill="#efe4cc">蝦</text><text x="250" y="250" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="10" fill="#efe4cc">蝦</text>' +
          // sleeves
          '<g class="m-sleeve"><path d="M124 228C106 244 96 280 94 330 92 370 96 400 104 420 116 427 136 425 146 414 146 390 150 364 158 346 150 330 146 300 150 270Z" fill="url(#' + p + 'r)" stroke="#6e1c10" stroke-width="1.2"/>' +
            '<path d="M104 420C116 427 136 425 146 414L144 404C134 412 116 413 106 408Z" fill="#6e1c10"/><path d="M110 300C106 340 106 380 112 410M128 280C124 320 126 370 132 408" stroke="#7a1d0f" stroke-width="2" fill="none" opacity=".45"/></g>' +
          '<g class="m-sleeve r"><path d="M276 228C294 244 304 280 306 330 308 370 304 400 296 420 284 427 264 425 254 414 254 390 250 364 242 346 250 330 254 300 250 270Z" fill="url(#' + p + 'r)" stroke="#6e1c10" stroke-width="1.2"/>' +
            '<path d="M296 420C284 427 264 425 254 414L256 404C266 412 284 413 294 408Z" fill="#6e1c10"/><path d="M290 300C294 340 294 380 288 410M272 280C276 320 274 370 268 408" stroke="#7a1d0f" stroke-width="2" fill="none" opacity=".45"/></g>' +
          // laptop held at the chest
          '<g class="m-laptop"><rect x="150" y="284" width="100" height="66" rx="5" fill="#1d1813" stroke="#4a3b2e" stroke-width="1.6"/>' +
            '<g clip-path="url(#' + p + 'scr)"><rect x="156" y="290" width="88" height="54" fill="#15110d"/><g class="m-code" opacity=".8"><rect x="160" y="294" width="30" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="300" width="46" height="2.4" rx="1.2" fill="#d9a441"/><rect x="165" y="306" width="24" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="160" y="312" width="40" height="2.4" rx="1.2" fill="#e0442e"/><rect x="165" y="318" width="52" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="324" width="20" height="2.4" rx="1.2" fill="#d9a441"/><rect x="160" y="330" width="36" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="336" width="48" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="160" y="342" width="30" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="348" width="46" height="2.4" rx="1.2" fill="#d9a441"/><rect x="165" y="354" width="24" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="160" y="360" width="40" height="2.4" rx="1.2" fill="#e0442e"/><rect x="165" y="366" width="52" height="2.4" rx="1.2" fill="#6fb3a8"/><rect x="165" y="372" width="20" height="2.4" rx="1.2" fill="#d9a441"/></g></g>' +
            '<g class="m-logo"><rect x="190" y="307" width="20" height="20" fill="#e0442e" transform="rotate(-4 200 317)"/><text x="200" y="322" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="13" fill="#efe4cc">開</text></g>' +
            '<path d="M144 350H256L250 358H150Z" fill="#2c241c"/></g>' +
          hand(146, 354, 1, p) + hand(254, 354, -1, p) +
        '</g>' +
        // neck
        '<path d="M188 172 186 206C194 212 206 212 214 206L212 172Z" fill="url(#' + p + 's)"/><path d="M188 176C194 186 206 186 212 176V192C206 197 194 197 188 192Z" fill="#c98b6c" opacity=".45"/>' +
        // long locks framing the face, over the shoulders
        '<g class="m-lock l">' + hairLocks(sideL, H, '#aaa293', '#c3bcae') + '</g><g class="m-lock r">' + hairLocks(sideR, H, '#aaa293', '#c3bcae') + '</g>' +
        '<g class="m-look"><g class="m-nod">' +
          // ears
          '<path d="M161 118C153 115 150 132 157 140 160 143 164 139 164 134ZM239 118C247 115 250 132 243 140 240 143 236 139 236 134Z" fill="#e9bc9d" stroke="#c08a6c" stroke-width=".8"/><path d="M158 124C156 130 158 135 161 137M242 124C244 130 242 135 239 137" stroke="#c08a6c" stroke-width="1" fill="none"/>' +
          // face
          '<path d="M160 110C158 136 164 156 176 170 184 179 192 184 200 184S216 179 224 170C236 156 242 136 240 110 240 86 222 72 200 72S160 86 160 110Z" fill="url(#' + p + 's)"/>' +
          '<path d="M236 116C237 142 230 162 214 179 226 164 231 144 231 116Z" fill="#c98b6c" opacity=".35"/><path d="M162 110H238V120C214 114 186 114 162 120Z" fill="#c98b6c" opacity=".28"/>' +
          '<path d="M170 150C176 158 180 164 186 168M230 150C224 158 220 164 214 168" stroke="#c98b6c" stroke-width="1" fill="none" opacity=".45"/>' +
          eyePair(p, { y: 130, gap: 17, iris: '#6a3a0a', lash: false, lid: '#2a1a10' }) +
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
        '</g></g>' +
      '</g>' +
      toadG(p) +
      '<g class="m-holo h1"><g transform="rotate(-8 44 150)"><rect x="24" y="100" width="40" height="104" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><rect x="29" y="105" width="30" height="94" fill="none" stroke="#b8321f" stroke-width="1"/><text x="44" y="146" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="20" fill="#1d1208">AI</text><text x="44" y="178" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="18" fill="#b8321f">術</text></g></g>' +
      '<g class="m-holo h2"><g transform="rotate(7 356 330)"><rect x="336" y="280" width="40" height="104" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><rect x="341" y="285" width="30" height="94" fill="none" stroke="#b8321f" stroke-width="1"/><text x="356" y="326" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="15" fill="#1d1208">{ }</text><text x="356" y="360" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="18" fill="#b8321f">码</text></g></g>' +
      '<g class="m-holo h3"><g transform="rotate(-4 350 64)"><rect x="330" y="20" width="40" height="92" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><text x="350" y="60" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="20" fill="#b8321f">忍</text><text x="350" y="92" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="11" fill="#1d1208">&lt;/&gt;</text></g></g>' +
      '</svg>';
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
  function miniToad() { var p = 'mt' + (++uid); return '<svg class="mascot mini-crew" viewBox="14 392 160 128" role="img" aria-label="Gama the toad"><defs>' + crewDefs(p) + '</defs>' + toadG(p) + '</svg>'; }
  function miniSlug() { var p = 'ms' + (++uid); return '<svg class="mascot mini-crew" viewBox="200 436 210 82" role="img" aria-label="Namekuji the slug in a support headset"><defs>' + crewDefs(p) + '</defs>' + slugG(p) + '</svg>'; }

  // An original "slug princess" from the same 1839 folk tale: head of QA, tea enthusiast.
  function tsunade(opts) {
    opts = opts || {};
    var p = 'ts' + (++uid), R = rng(11), spirals = '';
    [[132, 300], [140, 380], [268, 300], [262, 380], [150, 452], [250, 452]].forEach(function (c) {
      spirals += '<path d="M' + c[0] + ' ' + c[1] + 'm-7 0a7 7 0 1 1 7 7a4.4 4.4 0 1 1 -4.4 -4.4a1.8 1.8 0 1 1 1.8 1.8"/>';
    });
    var mane = [];
    for (var i = 0; i < 12; i++) {
      var sd = i % 2 ? 1 : -1, k = Math.floor(i / 2);
      mane.push([r1(200 + sd * (6 + k * 6.5)), r1(106 + k * 5), r1(90 - sd * (3 + k * 1.6) + (R() - .5) * 3), r1(226 + R() * 36 - k * 5), r1(38 + R() * 6 - k), r1(sd * (4 + R() * 6) * (k % 2 ? -1 : 1))]);
    }
    mane.reverse();
    var sideL = [[166, 104, 96, 110, 22, 10], [161, 112, 100, 150, 24, 14]], sideR = [[234, 104, 84, 110, 22, -10], [239, 112, 80, 150, 24, -14]];
    var H = 'url(#' + p + 'h)';
    return '<svg class="mascot tsunade ' + (opts.cls || '') + '" viewBox="0 0 400 540" role="img" aria-label="Tsunade, head of QA — an original slug-princess character in a green kimono with a clipboard, a cup of tea and a slug in a headset">' +
      '<defs>' + crewDefs(p) +
      '<radialGradient id="' + p + 'g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3f8f84" stop-opacity=".24"/><stop offset=".6" stop-color="#d9a441" stop-opacity=".07"/><stop offset="1" stop-color="#d9a441" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbeec3"/><stop offset=".5" stop-color="#e7c979"/><stop offset="1" stop-color="#c29a4a"/></linearGradient>' +
      '<linearGradient id="' + p + 'hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3c173"/><stop offset="1" stop-color="#a47b33"/></linearGradient>' +
      '<linearGradient id="' + p + 's" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9e1cd"/><stop offset="1" stop-color="#e8bb9c"/></linearGradient>' +
      '<linearGradient id="' + p + 'k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5f9a5c"/><stop offset=".6" stop-color="#3f7442"/><stop offset="1" stop-color="#2a5230"/></linearGradient>' +
      '<linearGradient id="' + p + 'o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecc063"/><stop offset="1" stop-color="#a87a22"/></linearGradient>' +
      '<radialGradient id="' + p + 'i" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#f3c98a"/><stop offset=".5" stop-color="#a8651f"/><stop offset="1" stop-color="#3f1c06"/></radialGradient>' +
      '<clipPath id="' + p + 'coat"><path d="M124 226C142 212 170 206 200 206S258 212 276 226C286 300 292 390 294 470H106C108 390 114 300 124 226Z"/></clipPath>' +
      '</defs>' + stage(p, '#3f8f84', '#d9a441') +
      '<g class="m-body">' +
        '<g class="m-tail">' + hairLocks(mane, 'url(#' + p + 'hb)', '#a07a36', '#8e6a2a') + '</g>' +
        // tabi + zori
        '<path d="M162 466 160 502H192L194 466ZM206 466 208 502H240L238 466Z" fill="#f3efe8"/><path d="M152 504H198V511H152ZM202 504H248V511H202Z" fill="#b8321f"/><path d="M168 502 176 493 184 502M216 502 224 493 232 502" stroke="#1d1813" stroke-width="2.4" fill="none"/>' +
        '<g class="m-breath">' +
          '<path d="M124 226C142 212 170 206 200 206S258 212 276 226C286 300 292 390 294 470H106C108 390 114 300 124 226Z" fill="url(#' + p + 'k)"/>' +
          '<g clip-path="url(#' + p + 'coat)"><g fill="none" stroke="#e6b650" stroke-width="1.8" opacity=".7">' + spirals + '</g>' +
            '<g fill="none" stroke="#1f4526" stroke-width="2.2" stroke-linecap="round" opacity=".4"><path d="M146 262C150 330 152 400 150 466"/><path d="M254 262C250 330 248 400 250 466"/><path d="M200 350C198 400 198 440 200 470"/></g>' +
            '<path d="M132 238C148 226 164 219 178 216" stroke="#8fc58a" stroke-width="2" fill="none" opacity=".6"/>' +
            '<path d="M200 350 150 470M200 350 250 470" stroke="#2a5230" stroke-width="1.6" opacity=".45"/></g>' +
          // crossed collar: white under-collar, green overlap closing high
          '<path d="M176 207 200 252 224 207" fill="none" stroke="#f7f2ea" stroke-width="9" stroke-linejoin="round"/><path d="M170 209 200 262 230 209" fill="none" stroke="#b8321f" stroke-width="3" stroke-linejoin="round" opacity=".85"/>' +
          '<path d="M178 206C188 214 212 214 222 206" stroke="#f7f2ea" stroke-width="3" fill="none"/>' +
          // obi
          '<path d="M128 330C160 324 240 324 272 330V338H128Z" fill="#e79aa6"/>' +
          '<path d="M127 336H273V372H127Z" fill="url(#' + p + 'o)"/><path d="M127 344H273M127 364H273" stroke="#8a6320" stroke-width="1.3" opacity=".6"/>' +
          '<g fill="none" stroke="#8a6320" stroke-width="1.2" opacity=".55"><path d="M140 354h12l6-5 6 5h12M190 354h12l6-5 6 5h12M240 354h12l6-5 6 5h12"/></g>' +
          '<path d="M127 354H273" stroke="#b8321f" stroke-width="3"/><circle cx="200" cy="354" r="6" fill="#b8321f"/><circle cx="200" cy="354" r="2.6" fill="#e6b650"/>' +
          // sleeves
          '<g class="m-sleeve"><path d="M126 228C108 246 98 282 96 330 94 372 98 402 106 422 118 429 138 427 148 416 148 392 152 366 160 348 152 330 148 300 152 270Z" fill="url(#' + p + 'k)" stroke="#1f4526" stroke-width="1.2"/>' +
            '<path d="M106 422C118 429 138 427 148 416L146 406C136 414 118 415 108 410Z" fill="#1f4526"/><path d="M112 300C108 340 108 380 114 412" stroke="#1f4526" stroke-width="2" fill="none" opacity=".4"/></g>' +
          '<g class="m-sleeve r"><path d="M274 228C292 246 302 282 304 330 306 372 302 402 294 422 282 429 262 427 252 416 252 392 248 366 240 348 248 330 252 300 248 270Z" fill="url(#' + p + 'k)" stroke="#1f4526" stroke-width="1.2"/>' +
            '<path d="M294 422C282 429 262 427 252 416L254 406C264 414 282 415 292 410Z" fill="#1f4526"/><path d="M288 300C292 340 292 380 286 412" stroke="#1f4526" stroke-width="2" fill="none" opacity=".4"/></g>' +
          // tea cup in the left hand
          '<g class="m-tea"><path class="m-steam" d="M152 316C146 308 158 302 152 294M162 318C156 310 168 304 162 296" stroke="#c9c2b2" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M142 324H172L168 342C166 347 148 347 146 342Z" fill="#efe4cc" stroke="#6b5a40" stroke-width="1.6"/><path d="M145 330H169" stroke="#3f8f84" stroke-width="2.6"/></g>' +
          hand(150, 352, 1, p) +
          // QA clipboard on the right arm
          '<g transform="rotate(6 246 330)"><rect x="214" y="280" width="64" height="84" rx="5" fill="#8a5a2b" stroke="#5a3a1a" stroke-width="1.6"/><rect x="221" y="292" width="50" height="66" fill="#fffaf0"/><rect x="235" y="275" width="22" height="10" rx="3" fill="#c9c2b2" stroke="#7d7466" stroke-width="1.2"/>' +
            '<text x="246" y="305" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="8" fill="#1d1208">QA LOG</text>' +
            '<path d="M226 314l2.6 2.6 4.4-5.2M226 324l2.6 2.6 4.4-5.2M226 334l2.6 2.6 4.4-5.2" stroke="#3f8f84" stroke-width="1.8" fill="none"/><path d="M238 315h26M238 325h22M238 335h26" stroke="#c9bb98" stroke-width="1.8"/>' +
            '<g class="m-stamp"><circle cx="258" cy="348" r="10" fill="none" stroke="#d63a24" stroke-width="2.2"/><text x="258" y="351.5" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="9.5" fill="#d63a24">OK</text></g></g>' +
          hand(262, 356, -1, p) +
        '</g>' +
        // neck
        '<path d="M189 170 187 206C194 211 206 211 213 206L211 170Z" fill="url(#' + p + 's)"/><path d="M189 174C194 184 206 184 211 174V190C206 195 194 195 189 190Z" fill="#cf9677" opacity=".4"/>' +
        '<g class="m-lock l">' + hairLocks(sideL, H, '#b08a44', '#fff2c8') + '</g><g class="m-lock r">' + hairLocks(sideR, H, '#b08a44', '#fff2c8') + '</g>' +
        '<g class="m-look"><g class="m-nod">' +
          '<path d="M163 118C156 116 153 131 159 138 162 141 165 137 165 133ZM237 118C244 116 247 131 241 138 238 141 235 137 235 133Z" fill="#efc3a6" stroke="#c89274" stroke-width=".8"/>' +
          '<g class="m-earrings"><path d="M160 139V147M240 139V147" stroke="#d9a441" stroke-width="1.4"/><circle cx="160" cy="150" r="3.4" fill="#e6b650" stroke="#8a6320" stroke-width=".8"/><circle cx="240" cy="150" r="3.4" fill="#e6b650" stroke="#8a6320" stroke-width=".8"/><circle cx="160" cy="157" r="2.2" fill="#3f8f84"/><circle cx="240" cy="157" r="2.2" fill="#3f8f84"/></g>' +
          '<path d="M162 110C160 136 166 156 177 169 185 178 193 182 200 182S215 178 223 169C234 156 240 136 238 110 238 86 221 72 200 72S162 86 162 110Z" fill="url(#' + p + 's)"/>' +
          '<path d="M234 116C235 140 229 160 214 177 225 162 230 142 229 116Z" fill="#cf9677" opacity=".3"/>' +
          '<ellipse cx="178" cy="150" rx="9" ry="4.5" fill="#ef8f86" opacity=".26"/><ellipse cx="222" cy="150" rx="9" ry="4.5" fill="#ef8f86" opacity=".26"/>' +
          eyePair(p, { y: 131, gap: 17, iris: '#5a2c08', lash: true, lid: '#2b1a1c' }) +
          '<g class="m-brows"><path d="M167 118C174 113 184 112 193 116" stroke="#a4803a" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M233 118C226 113 216 112 207 116" stroke="#a4803a" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>' +
          '<path d="M200 134C201 141 202 146 203 150 201 152 199 152 197 151" stroke="#c48a6c" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".85"/>' +
          '<path d="M190 162C194 160.5 198 160 200 161 202 160 206 160.5 210 162 205 164 195 164 190 162Z" fill="#c96a68"/><path d="M191 162.6C195 166.6 205 166.6 209 162.6 205 164.6 195 164.6 191 162.6Z" fill="#b5585a"/><path d="M195 162.4C198 163 202 163 205 162.4" stroke="#7a3032" stroke-width=".8"/>' +
          // bun, bangs, pins
          '<path d="M160 120C156 84 176 62 200 62S244 84 240 120C236 108 228 100 218 97 206 95 194 95 182 97 172 100 164 108 160 120Z" fill="' + H + '"/>' +
          '<g class="m-bun"><ellipse cx="200" cy="58" rx="30" ry="24" fill="' + H + '" stroke="#b08a44" stroke-width="1"/><path d="M174 62C180 44 214 38 226 54M178 70C188 56 214 52 224 66M186 48C194 42 206 42 212 46" stroke="#b08a44" stroke-width="1.2" fill="none" opacity=".7"/><path d="M180 52C188 44 204 42 214 46" stroke="#fff2c8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/></g>' +
          '<g class="m-pins"><path d="M166 44 236 80" stroke="#d9a441" stroke-width="3" stroke-linecap="round"/><path d="M236 40 170 80" stroke="#d9a441" stroke-width="3" stroke-linecap="round"/><circle cx="164" cy="43" r="4.6" fill="#d63a24"/><circle cx="238" cy="39" r="4.6" fill="#d63a24"/><path d="M238 44v11M243 44v8" stroke="#d63a24" stroke-width="1.6"/></g>' +
          '<g fill="' + H + '" stroke="#b08a44" stroke-width="1" stroke-linejoin="round"><path d="M201 82C186 84 171 95 165 115 163 124 164 132 167 138 169 124 176 110 188 102 194 97 199 91 201 82Z"/><path d="M199 82C214 84 229 95 235 115 237 124 236 132 233 138 231 124 224 110 212 102 206 97 201 91 199 82Z"/></g>' +
          '<path d="M196 88C184 94 174 104 170 120M204 88C216 94 226 104 230 120M200 70C194 74 190 80 190 86" stroke="#fff2c8" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>' +
          '<circle cx="226" cy="96" r="4" fill="#3f8f84" stroke="#1f4526" stroke-width="1"/><circle cx="224.8" cy="94.8" r="1.2" fill="#fff" opacity=".8"/>' +
        '</g></g>' +
      '</g>' +
      '<g transform="translate(92 124) scale(.76)">' + slugG(p) + '</g>' +
      '<g class="m-holo h1"><g transform="rotate(-7 44 150)"><rect x="24" y="100" width="40" height="104" fill="#efe4cc" stroke="#3f8f84" stroke-width="2"/><rect x="29" y="105" width="30" height="94" fill="none" stroke="#3f8f84" stroke-width="1"/><text x="44" y="146" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="19" fill="#1d1208">QA</text><text x="44" y="178" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="18" fill="#3f8f84">癒</text></g></g>' +
      '<g class="m-holo h2"><g transform="rotate(6 356 110)"><rect x="336" y="60" width="40" height="100" fill="#efe4cc" stroke="#d63a24" stroke-width="2"/><text x="356" y="102" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="20" fill="#d63a24">承</text><text x="356" y="136" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="11" fill="#1d1208">OK</text></g></g>' +
      '</svg>';
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
  function contacts() {
    var c = C.contact || {}, out = [];
    if (c.email) out.push({ id: 'email', icon: 'mail', label: 'Email', text: c.email, href: 'mailto:' + c.email });
    if (c.telegram) out.push({ id: 'telegram', icon: 'send', label: 'Telegram', text: '@' + c.telegram, href: 'https://t.me/' + c.telegram });
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

    var mm = document.createElement('div');
    mm.className = 'mmenu';
    mm.id = 'mmenu';
    mm.setAttribute('aria-hidden', 'true');
    mm.innerHTML = '<div class="kanji-bg mmenu-kanji" aria-hidden="true">忍</div><nav aria-label="Mobile"><ol>' +
      NAV.map(function (n, i) {
        return '<li><a href="' + n.href + '" style="--i:' + i + '"' + (n.id === page ? ' aria-current="page"' : '') + '><small>0' + (i + 1) + '</small><span>' + esc(n.label) + '</span><span class="jp">' + n.jp + '</span></a></li>';
      }).join('') + '</ol></nav>' +
      '<div class="mmenu-foot">' + contacts().slice(0, 3).map(function (c) {
        return '<a class="chip" href="' + esc(c.href) + '" target="_blank" rel="noopener">' + icon(c.icon) + esc(c.label) + '</a>';
      }).join('') + '<span class="chip">' + icon('pin') + esc(C.city + ', ' + C.country) + '</span></div>';
    h.after(mm);

    var btn = $('.menu-btn', h);
    btn.addEventListener('click', function () {
      var open = !root.classList.contains('menu-open');
      root.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mm.setAttribute('aria-hidden', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) btn.click();
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
          '<h2 class="h1">Got an idea? Let’s make it <span class="grad-text">legendary.</span></h2>' +
          '<div class="flex wrap"><a class="btn btn-primary btn-lg" href="hire.html" data-magnetic>Start a project ' + icon('arrow-right') + '</a>' +
          '<a class="btn btn-ghost btn-lg" href="showcase.html">Explore the Lab</a></div>' +
        '</div>' +
        '<div class="ftr-grid">' +
          '<div class="ftr-about"><a class="brand" href="index.html">' + brandMark() + '<span class="brand-word">' + esc((C.name || 'Xiraiya').toUpperCase()) + '</span></a>' +
            '<p>' + esc(C.age) + '-year-old developer from ' + esc(C.city) + ', ' + esc(C.country) + '. ' + esc(C.experienceYears) + '+ years turning ideas into websites, bots, apps and AI agents that run on autopilot.</p>' +
            '<div class="ftr-clock">' + icon('clock') + '<span>' + esc(C.city) + ' · <b data-clock>--:--</b> GMT+6</span></div></div>' +
          '<div><h3>Explore</h3><ul>' + NAV.map(function (n) { return '<li><a href="' + n.href + '">' + esc(n.label) + '</a></li>'; }).join('') + '</ul></div>' +
          '<div><h3>Services</h3><ul>' + svc + '<li><a href="showcase.html">All services</a></li></ul></div>' +
          '<div><h3>Contact</h3><ul>' + ct + '<li><a href="hire.html">' + icon('briefcase') + 'Project brief form</a></li></ul></div>' +
        '</div>' +
      '</div>' +
      '<div class="ftr-word" aria-hidden="true">' + esc((C.name || 'Xiraiya').toUpperCase()) + '</div>' +
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
      var y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
      if (hdr) {
        hdr.classList.toggle('is-scrolled', y > 24);
        if (!root.classList.contains('menu-open')) hdr.classList.toggle('is-hidden', y > 320 && y > lastY + 2);
        if (y < lastY - 2) hdr.classList.remove('is-hidden');
      }
      lastY = y;
      if (!reduce) par.forEach(function (el) {
        var r = (el.parentElement || el).getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        var d = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.getAttribute('data-speed'));
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
    var W, H, parts = [], running = true, visible = true;
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
      requestAnimationFrame(draw);
      if (!visible) return;
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
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; });
    if (reduce) { visible = true; draw(); running = false; return; }
    draw();
  }




  // Poke a character: it hops and cracks a joke in the nearest speech bubble
  var JOKES = {
    sage: ['Ouch! That is my coding hand.', 'Stop poking, I am compiling.', 'I do not fix bugs. The toad eats them.', 'Deploy on a Friday? Bold. I like it.', 'My mane is 40% hair, 60% ideas.', 'Tsunade approved this joke. Barely.', 'The toad is my senior DevOps engineer.', 'Ribbit means "ship it" in toad.'],
    tsunade: ['Tests first. Tea second.', 'I stamp OK only when it is perfect.', 'Your build is broken. I am already healing it.', 'The slug answers tickets faster than it moves.', 'Xiraiya wrote it. I made it work.', 'No console errors on my watch.']
  };
  function pokeMascots() {
    document.addEventListener('click', function (e) {
      var m = e.target.closest && e.target.closest('svg.mascot');
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
    NAV.forEach(function (n) { items.push({ g: 'Pages', t: n.label, s: n.jp, ic: n.id === 'hire' ? 'briefcase' : n.id === 'shop' ? 'cart' : n.id === 'lab' ? 'sparkle' : n.id === 'kit' ? 'layers' : n.id === 'demos' ? 'monitor' : n.id === 'pages' ? 'window' : n.id === 'world' ? 'terminal' : 'home', href: n.href }); });
    SERVICES.forEach(function (sv) { items.push({ g: 'Live demos in the Lab', t: sv.name, s: 'from ' + fmtPrice(sv.priceFrom), ic: sv.icon, href: 'showcase.html#' + sv.id }); });
    [['Nova AI', 'SaaS landing page', 'nova-saas'], ['Sakura Bistro', 'Restaurant', 'sakura-bistro'], ['Vault', 'Crypto dashboard', 'vault-dashboard'], ['BlockRealm', 'Minecraft server site', 'blockrealm'], ['Pulse', 'App landing page', 'pulse-app'], ['Mori Tea', 'Tea shop', 'mori-tea'], ['Haven', 'Architecture and homes', 'haven'], ['Ledger', 'Banking dashboard', 'ledger'], ['Nomad', 'Travel booking', 'nomad'], ['Kumo Docs', 'Developer docs', 'devdocs'], ['Orbital', 'Space travel booking', 'orbital'], ['Kinetik', 'EV configurator', 'kinetik'], ['Echo', 'Music streaming app', 'echo'], ['Medica', 'Clinic and telehealth', 'medica'], ['Grove', 'Online learning platform', 'grove'], ['Nimbus', 'Weather dashboard', 'nimbus'], ['Neon Drift', 'Esports tournaments', 'neon-drift'], ['Flowboard', 'Project management app', 'flowboard'], ['Summit 26', 'Tech conference', 'summit'], ['Quill', 'Editorial magazine', 'quill']].forEach(function (d) {
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
  buildTabbar();
  overlays();
  $$('[data-mascot]').forEach(function (el) {
    var k = el.getAttribute('data-mascot');
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
})();
