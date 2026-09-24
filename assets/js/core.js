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
        '<g class="m-eye"><path d="M258 206C256 190 212 188 208 204 208 222 220 230 234 230 248 230 258 222 258 206Z" fill="#fffaf0"/>' +
          '<g clip-path="url(#' + p + 'er)"><g class="m-iris"><ellipse cx="232" cy="210" rx="12" ry="15" fill="url(#' + p + 'i)"/><ellipse cx="232" cy="212" rx="5" ry="8" fill="#1d1208"/><circle cx="227" cy="204" r="3.8" fill="#fff"/></g></g>' +
          '<path d="M262 202C254 184 212 180 204 198L208 203C216 192 250 192 256 206Z" fill="#1d1208"/></g>' +
        // brows, nose, grin
        '<path d="M144 180 182 190M256 180 218 190" stroke="#f4efe4" stroke-width="7" stroke-linecap="round"/><path d="M144 180 182 190M256 180 218 190" stroke="#a79e8e" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
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
      // the toad familiar
      '<g class="m-toad">' +
        '<ellipse cx="92" cy="500" rx="74" ry="14" fill="#000" opacity=".28"/>' +
        '<path d="M26 492C18 452 44 420 92 418 140 420 166 452 158 492Z" fill="url(#' + p + 't)" stroke="#5a2e12" stroke-width="2"/>' +
        '<g fill="#7a3c18" opacity=".7"><circle cx="58" cy="452" r="7"/><circle cx="124" cy="446" r="6"/><circle cx="96" cy="436" r="4"/><circle cx="140" cy="470" r="5"/><circle cx="42" cy="476" r="4"/></g>' +
        '<ellipse class="m-throat" cx="92" cy="480" rx="38" ry="16" fill="#ecd3a6"/>' +
        '<path d="M52 470C72 480 112 480 132 470" stroke="#5a2e12" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<g class="m-toad-eyes"><circle cx="60" cy="426" r="15" fill="url(#' + p + 't)" stroke="#5a2e12" stroke-width="2"/><circle cx="124" cy="424" r="15" fill="url(#' + p + 't)" stroke="#5a2e12" stroke-width="2"/>' +
          '<circle cx="60" cy="425" r="9" fill="#f0c040"/><circle cx="124" cy="423" r="9" fill="#f0c040"/><rect x="53" y="423" width="14" height="4" rx="2" fill="#1d1208"/><rect x="117" y="421" width="14" height="4" rx="2" fill="#1d1208"/></g>' +
        '<path d="M36 494C30 500 30 506 40 506H62M148 494C154 500 154 506 144 506H122" stroke="#5a2e12" stroke-width="3" fill="url(#' + p + 't)"/>' +
        '<path d="M74 456 110 456 92 470Z" fill="#b8321f"/><path d="M78 458 106 458" stroke="#efe4cc" stroke-width="1.5"/>' +
      '</g>' +
      // floating paper talismans (ofuda)
      '<g class="m-holo h1"><g transform="rotate(-8 44 150)"><rect x="24" y="100" width="40" height="104" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><rect x="29" y="105" width="30" height="94" fill="none" stroke="#b8321f" stroke-width="1"/><text x="44" y="146" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="20" fill="#1d1208">AI</text><text x="44" y="178" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="18" fill="#b8321f">術</text></g></g>' +
      '<g class="m-holo h2"><g transform="rotate(7 356 330)"><rect x="336" y="280" width="40" height="104" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><rect x="341" y="285" width="30" height="94" fill="none" stroke="#b8321f" stroke-width="1"/><text x="356" y="326" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="15" fill="#1d1208">{ }</text><text x="356" y="360" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="18" fill="#b8321f">码</text></g></g>' +
      '<g class="m-holo h3"><g transform="rotate(-4 350 64)"><rect x="330" y="20" width="40" height="92" fill="#efe4cc" stroke="#b8321f" stroke-width="2"/><text x="350" y="60" text-anchor="middle" font-family="Shippori Mincho B1,serif" font-weight="800" font-size="20" fill="#b8321f">忍</text><text x="350" y="92" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="11" fill="#1d1208">&lt;/&gt;</text></g></g>' +
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
    { id: 'lab', href: 'showcase.html', label: 'The Lab', jp: '技' },
    { id: 'shop', href: 'shop.html', label: 'Shop Demo', jp: '店' },
    { id: 'kit', href: 'components.html', label: 'UI Kit', jp: '型' },
    { id: 'demos', href: 'demos.html', label: 'Demo Sites', jp: '演' },
    { id: 'academy', href: 'tutorials.html', label: 'Academy', jp: '学' },
    { id: 'hire', href: 'hire.html', label: 'Hire Me', jp: '雇' }
  ];

  function roll(t) { return '<span class="roll"><span data-t="' + esc(t) + '">' + esc(t) + '</span></span>'; }

  function buildHeader() {
    var h = $('#site-header');
    if (!h) return;
    var links = NAV.filter(function (n) { return n.id !== 'hire'; }).map(function (n) {
      return '<a href="' + n.href + '"' + (n.id === page ? ' aria-current="page"' : '') + '>' + roll(n.label) + '</a>';
    }).join('');
    h.innerHTML =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="hdr-bg"></div>' +
      '<div class="container container-wide hdr-bar">' +
        '<a class="brand" href="index.html" aria-label="' + esc(C.name || 'Xiraiya') + ' — home">' + brandMark() + '<span class="brand-word">' + esc((C.name || 'Xiraiya').toUpperCase()) + '</span><span class="brand-jp">開発者</span></a>' +
        '<nav class="hdr-nav" aria-label="Primary">' + links + '</nav>' +
        '<div class="hdr-actions">' +
          '<button type="button" class="hdr-search" data-palette aria-label="Search and quests (Ctrl K)">' + icon('search') + '<span>Search</span><kbd>Ctrl K</kbd></button>' +
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
        '<span>© <span data-year></span> ' + esc(C.name) + ' · Designed & coded by hand in ' + esc(C.city) + ', ' + esc(C.country) + '.</span>' +
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
    NAV.forEach(function (n) { items.push({ g: 'Pages', t: n.label, s: n.jp, ic: n.id === 'hire' ? 'briefcase' : n.id === 'shop' ? 'cart' : n.id === 'lab' ? 'sparkle' : n.id === 'kit' ? 'layers' : n.id === 'demos' ? 'monitor' : n.id === 'academy' ? 'film' : 'home', href: n.href }); });
    SERVICES.forEach(function (sv) { items.push({ g: 'Live demos in the Lab', t: sv.name, s: 'from ' + fmtPrice(sv.priceFrom), ic: sv.icon, href: 'showcase.html#' + sv.id }); });
    [['Nova AI', 'SaaS landing page', 'nova-saas'], ['Sakura Bistro', 'Restaurant', 'sakura-bistro'], ['Vault', 'Crypto dashboard', 'vault-dashboard'], ['BlockRealm', 'Minecraft server site', 'blockrealm'], ['Studio Kami', 'Agency', 'studio-kami'], ['Pulse', 'App landing page', 'pulse-app']].forEach(function (d) {
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
    var pageQuest = { home: 'page-home', lab: 'page-lab', shop: 'page-shop', kit: 'page-kit', demos: 'page-demos', academy: 'page-academy', hire: 'page-hire' }[page];
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
  $$('[data-mascot]').forEach(function (el) { el.innerHTML = mascot({ cls: el.getAttribute('data-mascot') }); });
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
  watchMascots();
  $$('canvas[data-petals]').forEach(function (c) { petals(c, { density: parseFloat(c.getAttribute('data-petals')) || 26000 }); });
  loader();
})();
