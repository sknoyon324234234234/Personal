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

  function mascot(opts) {
    opts = opts || {};
    var p = 'mx' + (++uid);
    // An original "toad sage" in the kabuki / folklore tradition of Jiraiya (児雷也, 1839):
    // wild white mane, kumadori eye strokes, red haori with a wave hem, scroll on the back, and a toad familiar.
    var waves = '';
    for (var wx = 96; wx < 310; wx += 22) waves += '<path d="M' + wx + ' 478a11 11 0 0 1 22 0" /><path d="M' + (wx + 5) + ' 478a6 6 0 0 1 12 0" />';
    return '<svg class="mascot ' + (opts.cls || '') + '" viewBox="0 0 400 540" role="img" aria-label="' + esc(C.name || 'Xiraiya') + ' — an original toad-sage character with a white mane, red haori and a toad companion">' +
      '<defs>' +
      '<radialGradient id="' + p + 'g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e0442e" stop-opacity=".32"/><stop offset=".6" stop-color="#d9a441" stop-opacity=".08"/><stop offset="1" stop-color="#d9a441" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf7ee"/><stop offset=".6" stop-color="#e8e1d2"/><stop offset="1" stop-color="#b9b0a0"/></linearGradient>' +
      '<linearGradient id="' + p + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dcc6"/><stop offset="1" stop-color="#e9bf9f"/></linearGradient>' +
      '<linearGradient id="' + p + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d23c26"/><stop offset="1" stop-color="#8f2517"/></linearGradient>' +
      '<radialGradient id="' + p + 'i" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#ffe3a0"/><stop offset=".45" stop-color="#d9962a"/><stop offset="1" stop-color="#5a3208"/></radialGradient>' +
      '<linearGradient id="' + p + 't" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98044"/><stop offset="1" stop-color="#8a4a22"/></linearGradient>' +
      '<clipPath id="' + p + 'el"><path d="M142 206C144 190 188 188 192 204 192 222 180 230 166 230 152 230 142 222 142 206Z"/></clipPath>' +
      '<clipPath id="' + p + 'er"><path d="M258 206C256 190 212 188 208 204 208 222 220 230 234 230 248 230 258 222 258 206Z"/></clipPath>' +
      '<clipPath id="' + p + 'coat"><path d="M100 482C94 404 104 334 150 302L200 292 250 302C296 334 306 404 300 482Z"/></clipPath>' +
      '</defs>' +
      '<circle cx="200" cy="280" r="200" fill="url(#' + p + 'g)"/>' +
      // summoning seal under the feet
      '<g transform="translate(200 510) scale(1 .22)" opacity=".95">' +
        '<g class="m-spin"><circle r="172" fill="none" stroke="#e0442e" stroke-width="3"/><circle r="152" fill="none" stroke="#e0442e" stroke-opacity=".55" stroke-width="2" stroke-dasharray="2 9"/>' +
          '<path d="M0-172V-120M0 172V120M-172 0H-120M172 0H120M-122-122-85-85M122 122 85 85M122-122 85-85M-122 122-85 85" stroke="#e0442e" stroke-width="3"/></g>' +
        '<g class="m-spin rev"><circle r="104" fill="none" stroke="#d9a441" stroke-opacity=".8" stroke-width="2"/><path d="M0-104 90 52-90 52Z" fill="none" stroke="#d9a441" stroke-opacity=".6" stroke-width="2"/></g>' +
      '</g>' +
      '<g class="m-body">' +
        // scroll carried on the back
        '<g transform="rotate(-16 200 290)"><rect x="40" y="268" width="320" height="44" rx="22" fill="#e9dfc6" stroke="#6b5a40" stroke-width="2"/><path d="M60 276H340M60 304H340" stroke="#c9bb98" stroke-width="2"/>' +
          '<rect x="30" y="262" width="26" height="56" rx="8" fill="#b8321f" stroke="#5a1a0e" stroke-width="2"/><rect x="344" y="262" width="26" height="56" rx="8" fill="#b8321f" stroke="#5a1a0e" stroke-width="2"/><path d="M200 268V312" stroke="#b8321f" stroke-width="5"/></g>' +
        // mane shadow for depth
        '<path d="M206 36 234 84 268 48 278 98 326 74 312 124 364 122 330 158 380 182 334 202 372 246 326 246 354 298 308 286 326 342 282 306 270 258H142L130 306 86 342 104 286 58 298 86 246 40 246 78 202 32 182 82 158 48 122 100 124 86 74 134 98 144 48 178 84Z" fill="#6b6152" opacity=".22"/>' +
        // long mane behind (sways)
        '<path class="m-tail" d="M248 236C300 262 336 330 330 420L310 390 314 446 288 404 284 458 266 400 252 426 250 330 236 268Z" fill="url(#' + p + 'h)" stroke="#a79e8e" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M200 28 228 76 262 40 272 90 320 66 306 116 358 114 324 150 374 174 328 194 366 238 320 238 348 290 302 278 320 334 276 298 264 250H136L124 298 80 334 98 278 52 290 80 238 34 238 72 194 26 174 76 150 42 114 94 116 80 66 128 90 138 40 172 76Z" fill="url(#' + p + 'h)" stroke="#a79e8e" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M92 132 120 150M70 208 104 204M310 132 282 150M332 208 298 204M150 60 160 96M252 60 242 96" stroke="#c8c0b0" stroke-width="3" stroke-linecap="round"/>' +
        // headband tails
        '<g class="m-tails"><path d="M270 150C304 138 330 160 374 138L380 152C334 178 304 156 272 166Z" fill="#241c16"/><path d="M270 160C300 168 322 196 360 194L356 208C314 210 296 182 270 174Z" fill="#33281f"/></g>' +
        // legs: hakama + geta
        '<path d="M150 470 146 504H192L194 470ZM206 470 208 504H254L250 470Z" fill="#2c2a33"/>' +
        '<path d="M138 506H196V514H138ZM204 506H262V514H204Z" fill="#7a5230"/><path d="M144 514V520M188 514V520M210 514V520M254 514V520" stroke="#4a3018" stroke-width="5"/>' +
        '<path d="M160 504 168 496 176 504M222 504 230 496 238 504" stroke="#efe4cc" stroke-width="3" fill="none"/>' +
        // haori coat with wave hem
        '<path d="M100 482C94 404 104 334 150 302L200 292 250 302C296 334 306 404 300 482Z" fill="url(#' + p + 'r)"/>' +
        '<g clip-path="url(#' + p + 'coat)"><rect x="90" y="462" width="220" height="30" fill="#6e1c10"/><g fill="none" stroke="#efe4cc" stroke-width="2" opacity=".85">' + waves + '</g></g>' +
        '<path d="M178 296 200 372 222 296Z" fill="#2f4a38"/><path d="M186 298 200 350 214 298" fill="none" stroke="#efe4cc" stroke-width="2"/>' +
        '<path d="M176 296 194 420M224 296 206 420" stroke="#241c16" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M150 400H250" stroke="#241c16" stroke-width="10"/><path d="M196 394h8v12h-8z" fill="#d9a441"/>' +
        // wide sleeves
        '<path d="M150 306C110 322 90 368 88 428L142 436C142 396 150 360 168 336Z" fill="url(#' + p + 'r)" stroke="#6e1c10" stroke-width="1.5"/>' +
        '<path d="M250 306C290 322 310 368 312 428L258 436C258 396 250 360 232 336Z" fill="url(#' + p + 'r)" stroke="#6e1c10" stroke-width="1.5"/>' +
        '<path d="M90 420 142 428M310 420 258 428" stroke="#efe4cc" stroke-width="3"/>' +
        // neck
        '<path d="M184 262V294C190 300 210 300 216 294V262Z" fill="#e7b999"/>' +
        // laptop
        '<g class="m-laptop"><ellipse cx="200" cy="338" rx="86" ry="16" fill="#d9a441" opacity=".16"/>' +
          '<rect x="132" y="340" width="136" height="86" rx="6" fill="#1d1813" stroke="#4a3b2e" stroke-width="2"/>' +
          '<clipPath id="' + p + 'scr"><rect x="140" y="348" width="120" height="70" rx="3"/></clipPath>' +
          '<g clip-path="url(#' + p + 'scr)"><g class="m-code" fill="#6fb3a8" opacity=".75"><rect x="146" y="354" width="40" height="3" rx="1.5"/><rect x="152" y="362" width="62" height="3" rx="1.5" fill="#d9a441"/><rect x="152" y="370" width="30" height="3" rx="1.5"/><rect x="146" y="378" width="54" height="3" rx="1.5" fill="#e0442e"/><rect x="152" y="386" width="70" height="3" rx="1.5"/><rect x="152" y="394" width="24" height="3" rx="1.5" fill="#d9a441"/><rect x="146" y="402" width="48" height="3" rx="1.5"/><rect x="152" y="410" width="66" height="3" rx="1.5"/><rect x="146" y="418" width="40" height="3" rx="1.5"/><rect x="152" y="426" width="62" height="3" rx="1.5" fill="#d9a441"/><rect x="152" y="434" width="30" height="3" rx="1.5"/><rect x="146" y="442" width="54" height="3" rx="1.5" fill="#e0442e"/><rect x="152" y="450" width="70" height="3" rx="1.5"/><rect x="152" y="458" width="24" height="3" rx="1.5" fill="#d9a441"/></g></g>' +
          '<g class="m-logo"><rect x="186" y="369" width="28" height="28" fill="#e0442e" transform="rotate(-4 200 383)"/><text x="200" y="390" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="17" fill="#efe4cc">開</text></g>' +
          '<path d="M124 426H276L268 436H132Z" fill="#2c241c"/></g>' +
        '<ellipse cx="142" cy="400" rx="14" ry="12" fill="url(#' + p + 's)"/><ellipse cx="258" cy="400" rx="14" ry="12" fill="url(#' + p + 's)"/>' +
        // head
        '<path d="M131 190C118 186 116 210 128 218 132 220 136 214 136 206ZM269 190C282 186 284 210 272 218 268 220 264 214 264 206Z" fill="#efc7aa"/>' +
        '<path d="M130 160C128 204 142 238 170 258 182 267 193 271 200 271S218 267 230 258C258 238 272 204 270 160 270 120 240 100 200 100S130 120 130 160Z" fill="url(#' + p + 's)"/>' +
        '<path d="M134 172C160 190 240 190 266 172V154H134Z" fill="#d9a080" opacity=".35"/>' +
        // kabuki kumadori strokes sweeping up from the eyes
        '<g stroke="#c9361f" stroke-width="3.4" stroke-linecap="round" fill="none"><path d="M158 234C154 242 150 248 146 252"/><path d="M168 236C165 245 161 252 156 258"/><path d="M242 234C246 242 250 248 254 252"/><path d="M232 236C235 245 239 252 244 258"/></g>' +
        // eyes
        '<g class="m-eye"><path d="M142 206C144 190 188 188 192 204 192 222 180 230 166 230 152 230 142 222 142 206Z" fill="#fffaf0"/>' +
          '<g clip-path="url(#' + p + 'el)"><g class="m-iris"><ellipse cx="168" cy="210" rx="12" ry="15" fill="url(#' + p + 'i)"/><ellipse cx="168" cy="212" rx="5" ry="8" fill="#1d1208"/><circle cx="163" cy="204" r="3.8" fill="#fff"/></g></g>' +
          '<path d="M138 202C146 184 188 180 196 198L192 203C184 192 150 192 144 206Z" fill="#1d1208"/></g>' +
        '<g class="m-eye m-eye-r"><path d="M258 206C256 190 212 188 208 204 208 222 220 230 234 230 248 230 258 222 258 206Z" fill="#fffaf0"/>' +
          '<g clip-path="url(#' + p + 'er)"><g class="m-iris"><ellipse cx="232" cy="210" rx="12" ry="15" fill="url(#' + p + 'i)"/><ellipse cx="232" cy="212" rx="5" ry="8" fill="#1d1208"/><circle cx="227" cy="204" r="3.8" fill="#fff"/></g></g>' +
          '<path d="M262 202C254 184 212 180 204 198L208 203C216 192 250 192 256 206Z" fill="#1d1208"/></g>' +
        // brows, nose, grin
        '<g class="m-brows"><path d="M144 180 182 190M256 180 218 190" stroke="#f4efe4" stroke-width="7" stroke-linecap="round"/><path d="M144 180 182 190M256 180 218 190" stroke="#a79e8e" stroke-width="2" stroke-linecap="round" opacity=".6"/></g>' +
        '<ellipse cx="152" cy="238" rx="12" ry="6" fill="#ff7f6e" opacity=".28"/><ellipse cx="248" cy="238" rx="12" ry="6" fill="#ff7f6e" opacity=".28"/>' +
        '<path d="M199 234 196 242H202" stroke="#c98c70" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
        '<path d="M182 250C194 258 210 257 220 246" stroke="#7a2a1c" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M210 253 213 259 215 252Z" fill="#fff"/>' +
        // side locks + spiky fringe
        '<path d="M130 158C120 196 124 232 136 256L144 212 146 176ZM270 158C280 196 276 232 264 256L256 212 254 176Z" fill="url(#' + p + 'h)" stroke="#a79e8e" stroke-width="1"/>' +
        '<path d="M126 164 142 190 152 168 166 186 176 166 190 184 200 164 210 184 224 166 234 186 248 168 258 190 274 164Z" fill="url(#' + p + 'h)" stroke="#a79e8e" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M124 118C150 96 250 96 276 118L272 150H128Z" fill="url(#' + p + 'h)"/>' +
        // headband with a steel plate
        '<path d="M124 146C160 132 240 132 276 146V170C240 158 160 158 124 170Z" fill="#241c16"/>' +
        '<path d="M164 140C188 136 212 136 236 140V166C212 162 188 162 164 166Z" fill="#c9c2b2" stroke="#7d7466" stroke-width="1.5"/>' +
        '<text x="200" y="158" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="14" fill="#3a3128">&lt;/&gt;</text>' +
        '<g fill="#7d7466"><circle cx="170" cy="144" r="1.6"/><circle cx="230" cy="144" r="1.6"/><circle cx="170" cy="160" r="1.6"/><circle cx="230" cy="160" r="1.6"/></g>' +
      '</g>' +
      // the toad familiar (with a fly it will eventually catch)
      toadG(p) +
      // floating paper talismans (ofuda)
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

  // An original "slug princess" from the same 1839 Jiraiya folk tale: head of QA, tea enthusiast.
  function tsunade(opts) {
    opts = opts || {};
    var p = 'ts' + (++uid), spirals = '';
    [[112, 360], [120, 410], [288, 360], [280, 410], [150, 468], [250, 468]].forEach(function (c) {
      spirals += '<path d="M' + c[0] + ' ' + c[1] + 'm-8 0a8 8 0 1 1 8 8a5 5 0 1 1 -5 -5a2 2 0 1 1 2 2" />';
    });
    return '<svg class="mascot tsunade ' + (opts.cls || '') + '" viewBox="0 0 400 540" role="img" aria-label="Tsunade, head of QA — an original slug-princess character with a clipboard, a cup of tea and a slug in a headset">' +
      '<defs>' + crewDefs(p) +
      '<radialGradient id="' + p + 'g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3f8f84" stop-opacity=".28"/><stop offset=".6" stop-color="#d9a441" stop-opacity=".08"/><stop offset="1" stop-color="#d9a441" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6b0"/><stop offset=".6" stop-color="#e2c77e"/><stop offset="1" stop-color="#b8974e"/></linearGradient>' +
      '<linearGradient id="' + p + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e2cf"/><stop offset="1" stop-color="#ecc4a6"/></linearGradient>' +
      '<linearGradient id="' + p + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f9a58"/><stop offset="1" stop-color="#2f5f35"/></linearGradient>' +
      '<linearGradient id="' + p + 'o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6b650"/><stop offset="1" stop-color="#a87a22"/></linearGradient>' +
      '<radialGradient id="' + p + 'i" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#ffe0b0"/><stop offset=".45" stop-color="#c47a2c"/><stop offset="1" stop-color="#4a2008"/></radialGradient>' +
      '<clipPath id="' + p + 'el"><path d="M144 208C148 194 184 192 190 206 188 222 178 228 166 228 154 228 146 220 144 208Z"/></clipPath>' +
      '<clipPath id="' + p + 'er"><path d="M256 208C252 194 216 192 210 206 212 222 222 228 234 228 246 228 254 220 256 208Z"/></clipPath>' +
      '</defs>' +
      '<circle cx="200" cy="280" r="200" fill="url(#' + p + 'g)"/>' +
      '<g transform="translate(200 510) scale(1 .22)" opacity=".9"><g class="m-spin"><circle r="170" fill="none" stroke="#3f8f84" stroke-width="3"/><circle r="148" fill="none" stroke="#d9a441" stroke-opacity=".6" stroke-width="2" stroke-dasharray="2 9"/></g><g class="m-spin rev"><path d="M-70 0a70 70 0 1 1 70 70a44 44 0 1 1 -44 -44" fill="none" stroke="#d9a441" stroke-width="3"/></g></g>' +
      '<g class="m-body">' +
        // long hair behind
        '<path class="m-tail" d="M128 150C96 232 98 330 124 404L170 392C154 330 150 250 166 196ZM272 150C304 232 302 330 276 404L230 392C246 330 250 250 234 196Z" fill="url(#' + p + 'h)"/>' +
        '<path d="M142 186H258V330H142Z" fill="url(#' + p + 'h)"/>' +
        // zori + tabi
        '<path d="M158 470 156 504H190L192 470ZM208 470 210 504H244L242 470Z" fill="#f3efe8"/><path d="M148 506H198V514H148ZM202 506H252V514H202Z" fill="#b8321f"/><path d="M170 504 176 494 182 504M220 504 226 494 232 504" stroke="#1d1813" stroke-width="3" fill="none"/>' +
        // kimono
        '<path d="M108 484C102 404 112 334 156 304L200 296 244 304C288 334 298 404 292 484Z" fill="url(#' + p + 'k)"/>' +
        '<g fill="none" stroke="#e6b650" stroke-width="2" opacity=".75">' + spirals + '</g>' +
        '<path d="M164 298 200 384 236 298" fill="none" stroke="#b8321f" stroke-width="7" stroke-linejoin="round"/><path d="M172 298 200 372 228 298" fill="none" stroke="#f7f2ea" stroke-width="7" stroke-linejoin="round"/>' +
        '<path d="M150 340C170 350 230 350 250 340" stroke="#1f4526" stroke-width="2" fill="none" opacity=".5"/><path d="M140 452C170 462 230 462 262 452" stroke="#1f4526" stroke-width="2" fill="none" opacity=".4"/>' +
        '<path d="M128 382C160 376 240 376 272 382V392H128Z" fill="#e79aa6"/>' +
        '<path d="M126 390H274V428H126Z" fill="url(#' + p + 'o)"/><path d="M126 398H274M126 420H274" stroke="#8a6320" stroke-width="1.5" opacity=".6"/>' +
        '<g fill="none" stroke="#8a6320" stroke-width="1.4" opacity=".55"><path d="M140 409h12l6-6 6 6h12M190 409h12l6-6 6 6h12M240 409h12l6-6 6 6h12"/></g>' +
        '<path d="M126 409H274" stroke="#b8321f" stroke-width="3.5"/><circle cx="200" cy="409" r="7" fill="#b8321f"/><circle cx="200" cy="409" r="3" fill="#e6b650"/>' +
        // sleeves
        '<path d="M154 306C114 322 94 368 92 430L146 438C146 398 154 362 172 338Z" fill="url(#' + p + 'k)" stroke="#1f4526" stroke-width="1.5"/>' +
        '<path d="M246 306C286 322 306 368 308 430L254 438C254 398 246 362 228 338Z" fill="url(#' + p + 'k)" stroke="#1f4526" stroke-width="1.5"/>' +
        // tea cup with steam
        '<g class="m-tea"><path class="m-steam" d="M112 370C104 360 120 352 112 342M124 372C116 362 132 354 124 344" stroke="#c9c2b2" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M100 380H136L132 400C130 406 106 406 104 400Z" fill="#efe4cc" stroke="#6b5a40" stroke-width="2"/><path d="M104 386H132" stroke="#3f8f84" stroke-width="3"/><ellipse cx="118" cy="406" rx="16" ry="12" fill="url(#' + p + 's)"/></g>' +
        // QA clipboard with a stamp
        '<g transform="rotate(7 250 380)"><rect x="214" y="330" width="74" height="96" rx="6" fill="#8a5a2b" stroke="#5a3a1a" stroke-width="2"/><rect x="222" y="344" width="58" height="76" fill="#fffaf0"/><rect x="238" y="324" width="26" height="12" rx="3" fill="#c9c2b2" stroke="#7d7466" stroke-width="1.5"/>' +
          '<text x="251" y="360" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="9" fill="#1d1208">QA LOG</text>' +
          '<path d="M228 370l3 3 5-6M228 382l3 3 5-6M228 394l3 3 5-6" stroke="#3f8f84" stroke-width="2" fill="none"/><path d="M242 371h30M242 383h26M242 395h30" stroke="#c9bb98" stroke-width="2"/>' +
          '<g class="m-stamp"><circle cx="262" cy="408" r="12" fill="none" stroke="#d63a24" stroke-width="2.5"/><text x="262" y="412" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="11" fill="#d63a24">OK</text></g></g>' +
        '<ellipse cx="282" cy="418" rx="14" ry="12" fill="url(#' + p + 's)"/>' +
        '<path d="M184 262V294C190 300 210 300 216 294V262Z" fill="#eac1a3"/>' +
        // head
        '<path d="M130 160C128 204 142 238 170 258 182 267 193 271 200 271S218 267 230 258C258 238 272 204 270 160 270 120 240 100 200 100S130 120 130 160Z" fill="url(#' + p + 's)"/>' +
        '<ellipse cx="154" cy="240" rx="13" ry="6" fill="#ff7f6e" opacity=".32"/><ellipse cx="246" cy="240" rx="13" ry="6" fill="#ff7f6e" opacity=".32"/>' +
        '<ellipse cx="166" cy="198" rx="24" ry="9" fill="#c9566a" opacity=".22"/><ellipse cx="234" cy="198" rx="24" ry="9" fill="#c9566a" opacity=".22"/>' +
        '<g class="m-eye"><path d="M144 208C148 194 184 192 190 206 188 222 178 228 166 228 154 228 146 220 144 208Z" fill="#fffaf0"/>' +
          '<g clip-path="url(#' + p + 'el)"><g class="m-iris"><ellipse cx="167" cy="211" rx="11" ry="13" fill="url(#' + p + 'i)"/><ellipse cx="167" cy="213" rx="4.5" ry="7" fill="#1d1208"/><circle cx="162" cy="206" r="3.4" fill="#fff"/></g></g>' +
          '<path d="M140 204C148 188 186 186 194 204L189 206C182 196 152 196 146 210ZM140 204 128 194 144 200Z" fill="#1b1524"/><path d="M146 196 142 190M156 192 154 186M168 191 168 185" stroke="#1b1524" stroke-width="1.6" stroke-linecap="round"/><path d="M150 226C160 230 174 230 184 224" stroke="#1b1524" stroke-width="1" fill="none" opacity=".45"/></g>' +
        '<g class="m-eye m-eye-r"><path d="M256 208C252 194 216 192 210 206 212 222 222 228 234 228 246 228 254 220 256 208Z" fill="#fffaf0"/>' +
          '<g clip-path="url(#' + p + 'er)"><g class="m-iris"><ellipse cx="233" cy="211" rx="11" ry="13" fill="url(#' + p + 'i)"/><ellipse cx="233" cy="213" rx="4.5" ry="7" fill="#1d1208"/><circle cx="228" cy="206" r="3.4" fill="#fff"/></g></g>' +
          '<path d="M260 204C252 188 214 186 206 204L211 206C218 196 248 196 254 210ZM260 204 272 194 256 200Z" fill="#1b1524"/><path d="M254 196 258 190M244 192 246 186M232 191 232 185" stroke="#1b1524" stroke-width="1.6" stroke-linecap="round"/><path d="M250 226C240 230 226 230 216 224" stroke="#1b1524" stroke-width="1" fill="none" opacity=".45"/></g>' +
        '<g class="m-brows"><path d="M146 180C160 180 174 184 186 192" stroke="#8a6a2a" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M254 180C240 180 226 184 214 192" stroke="#8a6a2a" stroke-width="4.5" fill="none" stroke-linecap="round"/></g>' +
        '<path d="M203 220C204 230 204 236 201 242" stroke="#d9a080" stroke-width="2" fill="none" opacity=".6"/><path d="M196 243C198 245 202 245 205 243" stroke="#c98c70" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
        '<path d="M189 252C194 250 198 249 200 250 202 249 206 250 211 252 206 254 194 254 189 252Z" fill="#c9555a"/><path d="M191 253C195 256 205 256 209 253 205 255 195 255 191 253Z" fill="#b04448"/><path d="M194 252C198 253 203 253 207 252" stroke="#ff9a8a" stroke-width="1" opacity=".7"/>' +
        // hair: side locks, fringe, bun and pins
        '<path d="M130 166C116 206 122 250 132 286 140 300 150 296 146 280 142 256 146 220 152 170ZM270 166C284 206 278 250 268 286 260 300 250 296 254 280 258 256 254 220 248 170Z" fill="url(#' + p + 'h)"/>' +
        '<path d="M136 190C132 220 134 252 142 280M264 190C268 220 266 252 258 280" stroke="#fff6d6" stroke-width="2" fill="none" opacity=".6"/>' +
        '<g class="m-earrings"><path d="M138 244V256M262 244V256" stroke="#d9a441" stroke-width="1.6"/><circle cx="138" cy="260" r="4.5" fill="#e6b650" stroke="#8a6320" stroke-width="1"/><circle cx="262" cy="260" r="4.5" fill="#e6b650" stroke="#8a6320" stroke-width="1"/><circle cx="138" cy="270" r="3" fill="#d63a24"/><circle cx="262" cy="270" r="3" fill="#d63a24"/></g>' +
        '<path d="M126 174C126 118 168 96 202 98 240 98 276 122 274 176 262 150 238 134 210 132 218 148 214 164 206 174 196 150 176 140 152 142 140 150 132 162 126 174Z" fill="url(#' + p + 'h)"/>' +
        '<path d="M160 118C178 108 200 106 222 110" stroke="#fff6d6" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>' +
        '<ellipse cx="200" cy="90" rx="52" ry="31" fill="url(#' + p + 'h)"/><circle cx="200" cy="60" r="26" fill="url(#' + p + 'h)"/>' +
        '<path d="M160 86C176 72 222 70 240 84M182 52C192 44 208 44 218 52" stroke="#fff6d6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><path d="M150 96C170 108 230 108 250 96" stroke="#9c7d3a" stroke-width="2" fill="none" opacity=".6"/>' +
        '<path d="M232 72C244 64 256 66 262 74 256 72 248 74 244 80Z" fill="#e79aa6"/><circle cx="252" cy="74" r="3" fill="#fff" opacity=".8"/>' +
        '<g class="m-pins"><path d="M150 48 250 104" stroke="#d9a441" stroke-width="4" stroke-linecap="round"/><path d="M250 44 158 104" stroke="#d9a441" stroke-width="4" stroke-linecap="round"/><circle cx="148" cy="46" r="6" fill="#d63a24"/><circle cx="252" cy="42" r="6" fill="#d63a24"/><path d="M252 48v14M258 48v10" stroke="#d63a24" stroke-width="2"/></g>' +
        '<path d="M176 76C184 70 196 68 208 70" stroke="#fff6d6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' +
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
        var t = 'translate(' + (dx * 5).toFixed(1) + 'px,' + (dy * 4).toFixed(1) + 'px)';
        m.iris.forEach(function (i) { i.style.transform = t; });
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
    { id: 'shop', href: 'shop.html', label: 'Shop Demo', short: 'Shop', jp: '店' },
    { id: 'kit', href: 'components.html', label: 'UI Kit', jp: '型' },
    { id: 'demos', href: 'demos.html', label: 'Demo Sites', short: 'Demos', jp: '演' },
    { id: 'pages', href: 'pages.html', label: 'Pages', jp: '頁' },
    { id: 'world', href: 'dev-world.html', label: 'Dev World', jp: '里' },
    { id: 'academy', href: 'tutorials.html', label: 'Academy', jp: '学' },
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
        return '<li><a href="' + n.href + '" style="--i:' + i + '"' + (n.id === page ? ' aria-current="page"' : '') + '><small>0' + (i + 1) + '</small>' + esc(n.label) + ' <span class="jp" style="font-size:.5em;color:var(--ink-3)">' + n.jp + '</span></a></li>';
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
    { id: 'page-academy', label: 'Visit the Motion Academy', xp: 10 },
    { id: 'page-hire', label: 'Check the Hire page', xp: 10 },
    { id: 'page-pages', label: 'Open the Pages Studio', xp: 10 },
    { id: 'page-world', label: 'Walk into Dev World', xp: 10 },
    { id: 'studio-export', label: 'Export a page from the studio', xp: 20 },
    { id: 'world-terminal', label: 'Run a command in the village terminal', xp: 20 },
    { id: 'world-tool', label: 'Use a tool in the Dev Toolbox', xp: 20 },
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
    NAV.forEach(function (n) { items.push({ g: 'Pages', t: n.label, s: n.jp, ic: n.id === 'hire' ? 'briefcase' : n.id === 'shop' ? 'cart' : n.id === 'lab' ? 'sparkle' : n.id === 'kit' ? 'layers' : n.id === 'demos' ? 'monitor' : n.id === 'academy' ? 'film' : n.id === 'pages' ? 'window' : n.id === 'world' ? 'terminal' : 'home', href: n.href }); });
    SERVICES.forEach(function (sv) { items.push({ g: 'Live demos in the Lab', t: sv.name, s: 'from ' + fmtPrice(sv.priceFrom), ic: sv.icon, href: 'showcase.html#' + sv.id }); });
    [['Nova AI', 'SaaS landing page', 'nova-saas'], ['Sakura Bistro', 'Restaurant', 'sakura-bistro'], ['Vault', 'Crypto dashboard', 'vault-dashboard'], ['BlockRealm', 'Minecraft server site', 'blockrealm'], ['Studio Kami', 'Agency', 'studio-kami'], ['Pulse', 'App landing page', 'pulse-app'], ['Aurum', 'Luxury watch store', 'aurum'], ['Mori Tea', 'Tea shop', 'mori-tea'], ['Haven', 'Architecture and homes', 'haven'], ['Ledger', 'Banking dashboard', 'ledger'], ['Nomad', 'Travel booking', 'nomad'], ['Kumo Docs', 'Developer docs', 'devdocs']].forEach(function (d) {
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
    var pageQuest = { home: 'page-home', lab: 'page-lab', shop: 'page-shop', kit: 'page-kit', demos: 'page-demos', academy: 'page-academy', hire: 'page-hire', pages: 'page-pages', world: 'page-world' }[page];
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
    fmtPrice: fmtPrice, contacts: contacts, mascot: mascot, brandMark: brandMark, petals: petals,
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
