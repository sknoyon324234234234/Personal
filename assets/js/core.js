/* =====================================================================
   XIRAIYA — core engine
   Header / footer, page transitions, cursor, reveals, split text,
   counters, marquee, parallax, magnetic buttons, toasts, mascot, petals.
   ===================================================================== */
(function () {
  'use strict';

  var C = window.XIRAIYA_CONFIG || {};
  var SERVICES = window.XIRAIYA_SERVICES || [];
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
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
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff2e4d"/><stop offset="1" stop-color="#8b6cff"/></linearGradient></defs>' +
      '<path d="M20 2 38 20 20 38 2 20Z" fill="none" stroke="url(#' + id + ')" stroke-width="2.2"/>' +
      '<path d="M12 11h5.5L28 29h-5.5Z" fill="#f4f0e8"/>' +
      '<path d="M28 11h-5.5L12 29h5.5Z" fill="url(#' + id + ')"/></svg>';
  }

  function mascot(opts) {
    opts = opts || {};
    var p = 'mx' + (++uid);
    return '<svg class="mascot ' + (opts.cls || '') + '" viewBox="0 0 400 540" role="img" aria-label="' + esc(C.name || 'Xiraiya') + ' — animated anime-style developer character">' +
      '<defs>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#e4e7f8"/><stop offset="1" stop-color="#a7aee0"/></linearGradient>' +
      '<linearGradient id="' + p + 'h2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d3d7f4"/><stop offset="1" stop-color="#7f86c2"/></linearGradient>' +
      '<linearGradient id="' + p + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9dc"/><stop offset="1" stop-color="#ffd2bb"/></linearGradient>' +
      '<linearGradient id="' + p + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4262"/><stop offset="1" stop-color="#a50e27"/></linearGradient>' +
      '<radialGradient id="' + p + 'i" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#8ffff5"/><stop offset=".5" stop-color="#17b8b0"/><stop offset="1" stop-color="#083c4a"/></radialGradient>' +
      '<linearGradient id="' + p + 'p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5f8ff"/><stop offset="1" stop-color="#95a1c2"/></linearGradient>' +
      '<radialGradient id="' + p + 'g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff2e4d" stop-opacity=".5"/><stop offset=".6" stop-color="#8b6cff" stop-opacity=".12"/><stop offset="1" stop-color="#8b6cff" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + p + 'el"><path d="M142 206C144 190 188 188 192 204 192 222 180 230 166 230 152 230 142 222 142 206Z"/></clipPath>' +
      '<clipPath id="' + p + 'er"><path d="M258 206C256 190 212 188 208 204 208 222 220 230 234 230 248 230 258 222 258 206Z"/></clipPath>' +
      '</defs>' +
      // aura
      '<circle cx="200" cy="270" r="200" fill="url(#' + p + 'g)"/>' +
      // magic circle
      '<g transform="translate(200 505) scale(1 .2)" opacity=".9">' +
        '<g class="m-spin"><circle r="170" fill="none" stroke="#ff2e4d" stroke-width="3" stroke-dasharray="4 10"/><circle r="150" fill="none" stroke="#ff2e4d" stroke-opacity=".6" stroke-width="2"/></g>' +
        '<g class="m-spin rev"><circle r="120" fill="none" stroke="#27e1d6" stroke-opacity=".7" stroke-width="2" stroke-dasharray="30 12"/><path d="M0-120 104 60-104 60Z M0 120-104-60 104-60Z" fill="none" stroke="#8b6cff" stroke-opacity=".6" stroke-width="2"/></g>' +
      '</g>' +
      '<g class="m-body">' +
        // ponytail
        '<path class="m-tail" d="M292 170C342 196 376 252 368 336L348 304 352 362 324 322 318 380 298 318 286 344 282 250Z" fill="url(#' + p + 'h2)"/>' +
        // back hair
        '<path d="M112 250 92 206 64 214 84 170 52 150 96 136 82 92 126 108 134 58 170 92 196 38 222 88 262 56 266 104 310 88 300 132 346 146 312 170 334 208 300 206 290 250Z" fill="url(#' + p + 'h)" stroke="#8d93c7" stroke-width="1.5" stroke-linejoin="round"/>' +
        // headband tails
        '<g class="m-tails"><path d="M268 148C302 136 326 162 368 142L374 156C330 180 302 156 270 166Z" fill="#1c1a33"/><path d="M268 158C298 164 318 192 356 190L352 204C312 206 294 178 268 172Z" fill="#26234a"/></g>' +
        // legs + shoes
        '<path d="M152 460 150 500H188L190 460ZM210 460 212 500H250L248 460Z" fill="#1d1b33"/>' +
        '<path d="M140 506C140 490 190 488 194 500V512H140ZM206 500C210 488 260 490 260 506V512H206Z" fill="#f4f0e8"/>' +
        '<path d="M142 504H192M208 504H258" stroke="#ff2e4d" stroke-width="3"/>' +
        // hoodie
        '<path d="M112 472C108 402 118 330 160 300 172 292 186 290 200 290S228 292 240 300C282 330 292 402 288 472Z" fill="url(#' + p + 'r)"/>' +
        '<path d="M158 298C168 318 232 318 242 298 236 286 164 286 158 298Z" fill="#7d0a1d"/>' +
        '<path d="M200 318V472" stroke="#7d0a1d" stroke-width="3"/>' +
        '<path d="M186 314 182 352M214 314 218 352" stroke="#f4f0e8" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M114 456C170 466 230 466 286 456L288 472H112Z" fill="#7d0a1d"/>' +
        // neck
        '<path d="M184 262V292C190 298 210 298 216 292V262Z" fill="#f2bea5"/>' +
        // arms
        '<path d="M152 318C128 342 122 382 138 408L162 400C154 380 158 352 170 336Z" fill="#c8173a"/>' +
        '<path d="M248 318C272 342 278 382 262 408L238 400C246 380 242 352 230 336Z" fill="#c8173a"/>' +
        // laptop
        '<g class="m-laptop"><ellipse cx="200" cy="336" rx="86" ry="16" fill="#27e1d6" opacity=".18"/>' +
          '<rect x="132" y="338" width="136" height="88" rx="10" fill="#1a1a2a" stroke="#3a3a58" stroke-width="2"/>' +
          '<g class="m-logo"><path d="M200 364 218 382 200 400 182 382Z" fill="none" stroke="#ff2e4d" stroke-width="2"/><path d="M193 373h4l10 18h-4Z" fill="#f4f0e8"/><path d="M207 373h-4l-10 18h4Z" fill="#ff2e4d"/></g>' +
          '<path d="M124 426H276L268 436H132Z" fill="#2b2b44"/></g>' +
        // hands
        '<ellipse cx="142" cy="398" rx="14" ry="12" fill="url(#' + p + 's)"/><ellipse cx="258" cy="398" rx="14" ry="12" fill="url(#' + p + 's)"/>' +
        // head
        '<path d="M131 190C118 186 116 210 128 218 132 220 136 214 136 206ZM269 190C282 186 284 210 272 218 268 220 264 214 264 206Z" fill="#ffd8c4"/>' +
        '<path d="M130 160C128 204 142 238 170 258 182 267 193 271 200 271S218 267 230 258C258 238 272 204 270 160 270 120 240 100 200 100S130 120 130 160Z" fill="url(#' + p + 's)"/>' +
        '<path d="M134 168C160 190 240 190 266 168V150H134Z" fill="#f0b39a" opacity=".45"/>' +
        '<ellipse cx="150" cy="236" rx="13" ry="6" fill="#ff6f86" opacity=".35"/><ellipse cx="250" cy="236" rx="13" ry="6" fill="#ff6f86" opacity=".35"/>' +
        // eyes
        '<g class="m-eye"><path d="M142 206C144 190 188 188 192 204 192 222 180 230 166 230 152 230 142 222 142 206Z" fill="#fff"/>' +
          '<g clip-path="url(#' + p + 'el)"><g class="m-iris"><ellipse cx="168" cy="210" rx="13" ry="16" fill="url(#' + p + 'i)"/><ellipse cx="168" cy="212" rx="6" ry="8.5" fill="#05232c"/><circle cx="162" cy="203" r="4.3" fill="#fff"/><circle cx="173" cy="219" r="2" fill="#fff" opacity=".85"/></g></g>' +
          '<path d="M138 204C144 184 188 180 196 200L192 204C184 192 150 192 144 208ZM138 204 128 196 141 199Z" fill="#1d1733"/>' +
          '<path d="M150 228C160 232 174 232 184 226" stroke="#1d1733" stroke-width="1.6" fill="none" opacity=".55"/></g>' +
        '<g class="m-eye"><path d="M258 206C256 190 212 188 208 204 208 222 220 230 234 230 248 230 258 222 258 206Z" fill="#fff"/>' +
          '<g clip-path="url(#' + p + 'er)"><g class="m-iris"><ellipse cx="232" cy="210" rx="13" ry="16" fill="url(#' + p + 'i)"/><ellipse cx="232" cy="212" rx="6" ry="8.5" fill="#05232c"/><circle cx="226" cy="203" r="4.3" fill="#fff"/><circle cx="237" cy="219" r="2" fill="#fff" opacity=".85"/></g></g>' +
          '<path d="M262 204C256 184 212 180 204 200L208 204C216 192 250 192 256 208ZM262 204 272 196 259 199Z" fill="#1d1733"/>' +
          '<path d="M250 228C240 232 226 232 216 226" stroke="#1d1733" stroke-width="1.6" fill="none" opacity=".55"/></g>' +
        // nose + mouth
        '<path d="M199 234 197 241H202" stroke="#dc9c86" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M186 252C194 258 206 258 214 250" stroke="#8f3446" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M205 256 208 261 210 255Z" fill="#fff"/>' +
        // front hair
        '<path d="M124 166C118 108 152 80 200 78S282 108 276 166Z" fill="url(#' + p + 'h)"/>' +
        '<path d="M158 98C172 88 188 86 204 86M150 116C160 104 170 98 184 96" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M232 92C248 98 260 110 266 124" stroke="#9ba1d6" stroke-width="3" stroke-linecap="round" opacity=".7"/>' +
        // headband
        '<path d="M126 150C160 134 240 134 274 150V172C240 158 160 158 126 172Z" fill="#1c1a33"/>' +
        '<path d="M164 142C188 138 212 138 236 142V166C212 162 188 162 164 166Z" fill="url(#' + p + 'p)" stroke="#6f7aa0" stroke-width="1.5"/>' +
        '<text x="200" y="159" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="15" fill="#3b4466">&lt;/&gt;</text>' +
        '<g fill="#6f7aa0"><circle cx="170" cy="146" r="1.6"/><circle cx="230" cy="146" r="1.6"/><circle cx="170" cy="161" r="1.6"/><circle cx="230" cy="161" r="1.6"/></g>' +
        // bangs
        '<path d="M128 166C124 198 132 228 142 246L148 214 158 172ZM158 168 170 198 180 166ZM186 166 198 194 210 165ZM216 166 228 196 242 168ZM272 166C276 198 268 228 258 246L252 214 242 172Z" fill="url(#' + p + 'h)" stroke="#9ba1d6" stroke-width="1" stroke-linejoin="round"/>' +
        // brows
        '<path d="M148 182 180 188M252 182 220 188" stroke="#7f86c2" stroke-width="4" stroke-linecap="round"/>' +
      '</g>' +
      // holograms
      '<g class="m-holo h1"><rect x="8" y="262" width="104" height="70" rx="9" fill="rgba(39,225,214,.07)" stroke="#27e1d6" stroke-opacity=".7"/><path d="M22 282h40M22 295h62M22 308h30M22 320h52" stroke="#27e1d6" stroke-width="3.2" stroke-linecap="round" opacity=".85"/><circle cx="96" cy="276" r="4" fill="#ff2e4d"/></g>' +
      '<g class="m-holo h2"><rect x="294" y="352" width="98" height="74" rx="9" fill="rgba(139,108,255,.08)" stroke="#8b6cff" stroke-opacity=".8"/><path d="M310 410V396M326 410V384M342 410V390M358 410V372M374 410V380" stroke="#8b6cff" stroke-width="7" stroke-linecap="round"/></g>' +
      '<g class="m-holo h3"><circle cx="62" cy="120" r="30" fill="rgba(255,46,77,.08)" stroke="#ff2e4d" stroke-opacity=".8"/><text x="62" y="128" text-anchor="middle" font-family="Unbounded,sans-serif" font-weight="800" font-size="20" fill="#ff2e4d">AI</text></g>' +
      '<g class="m-holo h4"><rect x="318" y="40" width="70" height="44" rx="8" fill="rgba(255,194,75,.08)" stroke="#ffc24b" stroke-opacity=".8"/><text x="353" y="68" text-anchor="middle" font-family="JetBrains Mono,monospace" font-weight="700" font-size="14" fill="#ffc24b">{ }</text></g>' +
      '</svg>';
  }

  // Eyes follow the pointer
  var mascots = [];
  function watchMascots() {
    mascots = $$('.mascot');
    if (!mascots.length || !fine || reduce) return;
    window.addEventListener('pointermove', function (e) {
      mascots.forEach(function (m) {
        var r = m.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var cx = r.left + r.width * .5, cy = r.top + r.height * .4;
        var dx = clamp((e.clientX - cx) / (innerWidth * .5), -1, 1), dy = clamp((e.clientY - cy) / (innerHeight * .5), -1, 1);
        $$('.m-iris', m).forEach(function (i) { i.style.transform = 'translate(' + (dx * 5).toFixed(2) + 'px,' + (dy * 4).toFixed(2) + 'px)'; });
      });
    }, { passive: true });
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
     Global overlays: grain, progress, curtain, cursor, toasts
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

  function cursor() {
    if (!fine || reduce) return;
    var dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
    ring.innerHTML = '<span></span>';
    dot.style.opacity = ring.style.opacity = 0;
    document.body.append(dot, ring);
    root.classList.add('has-cursor');
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; rx = x; ry = y; dot.style.opacity = ring.style.opacity = 1; }
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    }, { passive: true });
    (function loop() {
      rx = lerp(rx, x, .18); ry = lerp(ry, y, .18);
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      var lab = e.target.closest('[data-cursor-label]');
      var hov = e.target.closest('a,button,[role="button"],label,select,[data-cursor]');
      ring.classList.toggle('is-label', !!lab);
      ring.classList.toggle('is-hover', !!hov && !lab);
      ring.firstChild.textContent = lab ? lab.getAttribute('data-cursor-label') : '';
    });
    document.addEventListener('pointerdown', function () { ring.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { ring.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { dot.style.opacity = ring.style.opacity = 0; });
    document.addEventListener('mouseenter', function () { dot.style.opacity = ring.style.opacity = 1; });
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
      setTimeout(function () { location.href = url.href; }, reduce ? 0 : 720);
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
    document.addEventListener('pointermove', function (e) {
      var m = e.target.closest('[data-magnetic]');
      $$('[data-magnetic].is-mag').forEach(function (el) {
        if (el !== m) { el.classList.remove('is-mag'); el.style.transform = ''; }
      });
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
    var colors = opts.colors || ['#ff2e4d', '#ff6b81', '#ffd1dc', '#f4f0e8', '#8b6cff'];
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(W * H / (opts.density || 26000), 12, opts.max || 70));
      parts = [];
      for (var i = 0; i < n; i++) parts.push(make(true));
    }
    function make(init) {
      var petal = Math.random() < (opts.petalRatio == null ? .55 : opts.petalRatio);
      return {
        x: Math.random() * W, y: init ? Math.random() * H : -20,
        s: petal ? 5 + Math.random() * 8 : .8 + Math.random() * 1.8,
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
      if (num) { num.textContent = n; num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); }
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
    el.innerHTML = '<svg viewBox="0 0 ' + N + ' ' + N + '" shape-rendering="crispEdges" aria-hidden="true"><path d="' + d + '" fill="#0b0b12"/></svg>';
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
    reveals: reveals, whenVisible: whenVisible, onReady: onReady, modal: modal, reduce: reduce, fine: fine, qr: qr, seeded: seeded,
    config: C, services: SERVICES
  };

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  buildHeader();
  buildFooter();
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
  cursor();
  transitions();
  watchMascots();
  $$('canvas[data-petals]').forEach(function (c) { petals(c, { density: parseFloat(c.getAttribute('data-petals')) || 26000 }); });
  loader();
})();
