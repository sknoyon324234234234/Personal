/* =====================================================================
   XIRAIYA — home: "The Hidden Village", a camera-guided motion comic
   The section pins while you scroll. Each page is a plane of inked
   panels floating on a dark stage, and a virtual camera reads it panel
   by panel: it glides onto the next panel as a brush slab wipes it in,
   pulls back into a tilted view at the end of a chapter, then whip-pans
   (speed lines, a red slash) to the next chapter's episode title card.
   Seals, buttons, arrow keys and swipes jump chapter by chapter.
   Reduced motion: all pages are shown flat, in order.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, clamp = XR.clamp;
  var sec = $('#manga');
  if (!sec) return;
  var stage = $('.mv-stage', sec), world = $('.mv-world', sec);
  if (!stage || !world) return;
  var IMG = 'assets/img/anime/';

  /* a panel: a = grid area (row / col / row-end / col-end), clip = polygon, bg = screen tone,
     img = [file, fit, object-position, scale], pop = breaks out of the frame,
     sfx = [text, x%, y%, deg, colour], b = bubbles [text, x%, y%, tail side, style], f = camera focus [x%, y%] */
  var PAGES = [
    { title: 'Cover', cover: true, no: '表紙', seal: '表', acc: '#c4321d' },
    {
      title: 'Chapter 1 · The summons', no: '第一話', ep: '01', name: 'The summons', seal: '壱', acc: '#b57bff', lead: ['shade', 0],
      panels: [
        { a: '1/1/3/5', f: [50, 30], clip: '0 0,100% 0,100% 88%,0 100%', bg: 'night', img: ['shade', 'cover', '50% 22%', 1.25], sfx: ['ゴゴゴ', 78, 18, -8, '#b57bff'], b: [['A new client. Their shop needs a website by dawn.', 6, 12, 'r']] },
        { a: '3/3/7/5', clip: '0 8%,100% 0,100% 100%,0 100%', bg: 'focus', img: ['albedo', 'contain', '50% 100%', 1], pop: true, sfx: ['ザッ', 12, 20, 10, '#fff'], b: [['Then we build it tonight.', 4, 56, 'r', 'shout']] },
        { a: '3/1/5/3', clip: '0 4%,100% 0,94% 100%,0 100%', bg: 'tone', img: ['noir', 'cover', '50% 12%', 1.15], sfx: ['キラッ', 70, 72, -12, '#ffd34d'], cap: 'The night scribe wakes.' },
        { a: '5/1/7/3', clip: '0 0,94% 0,100% 100%,0 100%', bg: 'water', img: ['aqua', 'cover', '50% 14%', 1.1], b: [['Database is ready.', 8, 66, 'l']] }
      ]
    },
    {
      title: 'Chapter 2 · The all-nighter', no: '第二話', ep: '02', name: 'The all-nighter', seal: '弐', acc: '#ff7a2e', lead: ['blaze', 1],
      panels: [
        { a: '1/1/5/3', clip: '0 0,100% 0,84% 100%,0 100%', bg: 'fire', img: ['blaze', 'contain', '50% 100%', 1], pop: true, sfx: ['ドドドド', 52, 8, 8, '#ff7a2e'], b: [['Front-end, full power!', 40, 70, 'l', 'shout']] },
        { a: '1/3/3/5', clip: '12% 0,100% 0,100% 100%,0 92%', bg: 'pink', img: ['maid', 'cover', '50% 12%', 1.35], sfx: ['キャー', 70, 70, -10, '#ff5d9e'], b: [['Every customer answered!', 22, 8, 'b']] },
        { a: '3/3/5/5', clip: '0 8%,100% 0,100% 100%,16% 100%', bg: 'night', img: ['shade', 'contain', '78% 100%', 1.05], b: [['Shadow clones deployed. Scripts running.', 6, 14, 'r']] },
        { a: '5/1/7/5', f: [50, 50], clip: '0 6%,100% 0,100% 100%,0 100%', bg: 'impact', big: 'DEPLOYED', cap: '5:59 AM. One minute before dawn.' }
      ]
    },
    {
      title: 'Epilogue · Dawn', no: '終話', ep: '03', name: 'Dawn', seal: '終', acc: '#ffd34d', lead: ['albedo', 0],
      panels: [
        { a: '1/1/4/3', clip: '0 0,100% 0,96% 100%,0 100%', bg: 'night', img: ['albedo', 'cover', '50% 10%', 1.3], cap: 'Dawn. The shop is live.' },
        { a: '1/3/4/5', clip: '4% 0,100% 0,100% 100%,0 100%', bg: 'tone', img: ['noir', 'contain', '50% 100%', 1], b: [['First order already came in.', 52, 16, 'l']] },
        { a: '4/1/7/3', clip: '0 0,100% 4%,100% 100%,0 100%', bg: 'water', img: ['aqua', 'contain', '50% 100%', 1], sfx: ['ピカッ', 72, 16, -10, '#4fd4ff'], b: [['And it loads in one second.', 4, 10, 'r']] },
        { a: '4/3/7/5', clip: '0 4%,100% 0,100% 100%,0 100%', bg: 'cta', cta: true }
      ]
    }
  ];

  /* ---------- page geometry (page units; the camera scales them) ---------- */
  var PW = 1000, PH = 1400, GAP = 22, PAD = 40, GAPX = 1600;
  var colW = (PW - 2 * PAD - 3 * GAP) / 4, rowH = (PH - PAD - 70 - 5 * GAP) / 6;
  function rect(a) {
    var q = a.split('/').map(Number);
    return { x: PAD + (q[1] - 1) * (colW + GAP), y: PAD + (q[0] - 1) * (rowH + GAP),
      w: (q[3] - q[1]) * colW + (q[3] - q[1] - 1) * GAP, h: (q[2] - q[0]) * rowH + (q[2] - q[0] - 1) * GAP, cols: q[3] - q[1] };
  }

  /* ---------- build ---------- */
  function esc(t) { return XR.esc(t); }
  function px(file) { return file === 'albedo' || file === 'shade' ? '' : ' px'; }
  function panelHTML(p, i) {
    var h = '<div class="pn bg-' + p.bg + (p.pop ? ' pop' : '') + (rect(p.a).cols === 4 ? ' w4' : '') + '" style="--a:' + p.a + ';--clip:polygon(' + p.clip + ');--i:' + i + ';--z:' + (i * 18) + 'px">';
    h += '<div class="pn-frame">';
    if (p.img && !p.pop) h += '<img class="pn-img' + px(p.img[0]) + '" src="' + IMG + p.img[0] + '.webp" alt="" decoding="async" style="object-fit:' + p.img[1] + ';object-position:' + p.img[2] + ';--s:' + p.img[3] + '">';
    if (p.big) h += '<b class="pn-big">' + esc(p.big) + '</b>';
    if (p.cta) h += '<div class="pn-cta"><small>Next chapter</small><b>Yours.</b><p>Tell me what your shop, bot or app should do and the crew gets to work tonight.</p><div><a class="btn btn-primary" href="hire">Start my chapter <svg class="ic"><use href="#i-arrow-right"/></svg></a><a class="btn btn-ghost" href="showcase">Enter the Lab</a></div></div>';
    h += '<i class="pn-dim"></i><i class="pn-flash"></i><i class="pn-ink"></i></div>';
    if (p.img && p.pop) h += '<img class="pn-img pn-out' + px(p.img[0]) + '" src="' + IMG + p.img[0] + '.webp" alt="" decoding="async" style="object-position:' + p.img[2] + '">';
    if (p.sfx) h += '<span class="pn-sfx jp" aria-hidden="true" style="left:' + p.sfx[1] + '%;top:' + p.sfx[2] + '%;--r:' + p.sfx[3] + 'deg;--c:' + p.sfx[4] + '">' + p.sfx[0] + '</span>';
    (p.b || []).forEach(function (b, k) {
      h += '<p class="pn-bub t-' + b[3] + (b[4] ? ' ' + b[4] : '') + '" style="left:' + b[1] + '%;top:' + b[2] + '%;--k:' + k + '">' + esc(b[0]) + '</p>';
    });
    if (p.cap) h += '<p class="pn-cap">' + esc(p.cap) + '</p>';
    return h + '</div>';
  }
  function coverHTML() {
    return '<div class="mv-cover">' +
      '<div class="cv-rays" aria-hidden="true"></div>' +
      '<span class="cv-mast"><b>WEEKLY</b> XIRAIYA</span><span class="cv-vol">Vol.<b>01</b></span>' +
      '<span class="cv-new">New series!</span>' +
      '<img class="cv-a" src="' + IMG + 'albedo.webp" alt="" decoding="async">' +
      '<img class="cv-b px" src="' + IMG + 'blaze.webp" alt="" decoding="async">' +
      '<img class="cv-c" src="' + IMG + 'shade.webp" alt="" decoding="async">' +
      '<span class="cv-kanji jp" aria-hidden="true">隠れ里</span>' +
      '<span class="cv-title">The Hidden<br>Village</span>' +
      '<span class="cv-tag">Six girls. One all-night deploy.</span>' +
      '<span class="cv-bar" aria-hidden="true"><i></i><small>4 912345 000017</small></span>' +
      '</div>';
  }
  function footHTML(n) {
    if (n === PAGES.length - 1) return '<p class="pg-foot"><b class="pg-kan jp">完</b><span>The end. Your chapter is next.</span></p>';
    return '<p class="pg-foot"><b class="pg-no">p.0' + (n + 1) + '</b><span>To be continued <svg class="ic" aria-hidden="true"><use href="#i-arrow-right"/></svg></span></p>';
  }
  world.innerHTML = PAGES.map(function (pg, n) {
    var inner = pg.cover ? coverHTML() : '<div class="pg-grid">' + pg.panels.map(panelHTML).join('') + '</div>' + footHTML(n);
    return '<article class="pg' + (pg.cover ? ' is-cover' : '') + '" data-n="' + n + '" style="left:' + (n * GAPX) + 'px" aria-label="Page ' + (n + 1) + ': ' + esc(pg.title) + '">' + inner + '</article>';
  }).join('');
  var pages = $$('.pg', world);
  var cover = $('.pg.is-cover', world);

  /* seals: one per page */
  var sealsEl = $('.mv-seals', sec), seals = [];
  if (sealsEl) {
    PAGES.forEach(function (pg, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mv-seal';
      b.setAttribute('aria-label', 'Go to ' + (pg.cover ? 'the cover' : pg.title.replace(' · ', ': ')));
      b.innerHTML = '<b class="jp">' + pg.seal + '</b><i class="seal-track"><i class="seal-fill"></i></i>';
      b.addEventListener('click', function () { goPage(n); });
      sealsEl.appendChild(b);
      seals.push(b);
    });
  }

  /* ---------- reduced motion: flat pages ---------- */
  if (XR.reduce) {
    sec.classList.add('is-flat');
    pages.forEach(function (p, n) {
      var wrap = document.createElement('div');
      wrap.className = 'mv-fit';
      p.parentNode.insertBefore(wrap, p);
      wrap.appendChild(p);
      p.style.left = '0';
      p.classList.add('is-cur', 'is-near', 'is-reveal');
      p.setAttribute('data-shown', 3);
      $$('.pn', p).forEach(function (x) { x.classList.add('on'); });
      if (n > 0) {
        var pg = PAGES[n], hd = document.createElement('p');
        hd.className = 'mv-flat-head';
        hd.innerHTML = '<span class="hanko sm">' + pg.seal + '</span><b class="jp">' + pg.no + '</b><small>Episode ' + pg.ep + '</small><span>' + esc(pg.name) + '</span>';
        wrap.parentNode.insertBefore(hd, wrap);
      }
    });
    var fits = $$('.mv-fit', world);
    var fitAll = function () { fits.forEach(function (w) { w.style.setProperty('--fs', (w.clientWidth / PW).toFixed(4)); }); };
    if ('ResizeObserver' in window) new ResizeObserver(fitAll).observe(world);
    fitAll();
    return;
  }

  /* ---------- steps ---------- */
  var steps = [];
  PAGES.forEach(function (pg, n) {
    var k;
    if (pg.cover) { for (k = 1; k <= 3; k++) steps.push({ page: n, kind: 'cover', shown: k }); return; }
    steps.push({ page: n, kind: 'title', shown: 0 });
    for (k = 1; k <= 4; k++) steps.push({ page: n, kind: 'panel', shown: k });
    steps.push({ page: n, kind: 'reveal', shown: 4 });
  });
  var N = steps.length;
  sec.style.setProperty('--steps', N);

  /* ---------- metrics + camera shots ---------- */
  var W = 1, H = 1, phone = false, fit = .4, sMax = .9, sMin = .5, sw = 1, sh = 1, scx = 0, scy = 0, run = 1, secTop = 0;
  function metrics() {
    W = stage.clientWidth || 1;
    H = stage.clientHeight || 1;
    phone = window.matchMedia('(max-width: 760px)').matches;
    var barH = phone ? 34 : clamp(H * .06, 38, 56);
    stage.style.setProperty('--barH', barH + 'px');
    var top = barH + 10, bottom = H - barH - 30;
    sw = W - 24; sh = Math.max(40, bottom - top); scx = W / 2; scy = (top + bottom) / 2;
    fit = Math.min(sw * .92 / PW, sh * .94 / PH);
    sMax = phone ? 1 : .9;
    sMin = phone ? .46 : .5;
    run = Math.max(1, sec.offsetHeight - window.innerHeight);
    secTop = sec.getBoundingClientRect().top + window.scrollY;
    sec.classList.toggle('mv-3d', !phone && XR.fine);
  }
  function place(wx, wy, s, qx, qy, extra) {
    var o = { x: wx - (qx - W / 2) / s, y: wy - (qy - H / 2) / s, ls: Math.log(s), roll: 0, rx: 0, ry: 0 };
    for (var k in extra) o[k] = extra[k];
    return o;
  }
  function shot(st) {
    var ox = st.page * GAPX, s, r, p;
    if (st.kind === 'cover') {
      if (st.shown === 1) { s = Math.min(fit * 1.9, sMax); return place(ox + 320, 900, s, scx, scy, { roll: -1.5, rx: -2 }); }
      if (st.shown === 2) { s = Math.min(fit * 1.3, sMax); return place(ox + 500, 880, s, scx, scy, { roll: .6 }); }
      return place(ox + 500, 700, fit * .96, scx, scy, { roll: -.8, rx: phone ? 2 : 3, ry: phone ? -3 : -5 });
    }
    if (st.kind === 'title') {
      if (phone) return place(ox + 500, 700, fit * .86, scx, scy + sh * .12, {});
      return place(ox + 500, 700, fit * .8, W * .7, scy, { roll: .6, rx: 2, ry: -4 });
    }
    if (st.kind === 'panel') {
      p = PAGES[st.page].panels[st.shown - 1];
      r = rect(p.a);
      s = clamp(Math.min(sw * .92 / r.w, sh * .9 / r.h), sMin, sMax);
      if (p.cta && phone) s = Math.max(s, .62);
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      if (r.w * s > sw) cx = clamp(r.x + (p.f ? p.f[0] : 50) / 100 * r.w, r.x + sw / 2 / s, r.x + r.w - sw / 2 / s);
      if (r.h * s > sh) cy = clamp(r.y + (p.f ? p.f[1] : 40) / 100 * r.h, r.y + sh / 2 / s, r.y + r.h - sh / 2 / s);
      return place(ox + cx, cy, s, scx, scy, { roll: [-1.2, .8, -.6, 1][st.shown - 1] });
    }
    if (phone && st.page === PAGES.length - 1) { r = rect(PAGES[st.page].panels[3].a); return place(ox + r.x + r.w / 2, r.y + r.h / 2, .62, scx, scy, { roll: -1, rx: 3, ry: -4 }); }
    return place(ox + 500, 700, fit * .94, scx, scy, { roll: -1, rx: phone ? 3 : 5, ry: phone ? -4 : -7 });
  }
  function target(frac) {
    var st = steps[cur], T = shot(st);
    if (st.kind === 'panel' || st.kind === 'cover') T.ls += Math.log(1 + .03 * frac);
    else if (st.kind === 'title') T.ls += Math.log(1 + .02 * frac);
    else { T.ry -= 1.5 * frac; T.rx += .8 * frac; }
    return T;
  }

  /* ---------- camera ---------- */
  var cam = { x: 0, y: 0, ls: 0, roll: 0, rx: 0, ry: 0 }, CH = ['x', 'y', 'ls', 'roll', 'rx', 'ry'];
  var whip = null, shakes = [], raf = 0, last = 0, live = false, cur = -1, frac = 0, firstApply = true, skew = 0, prevSX = 0;
  function easeIO(u) { return u === 0 ? 0 : u === 1 ? 1 : u < .5 ? Math.pow(2, 20 * u - 10) / 2 : (2 - Math.pow(2, -20 * u + 10)) / 2; }
  function render() {
    var s = Math.exp(cam.ls), now = performance.now(), sx = 0, sy = 0;
    shakes = shakes.filter(function (k) { return now - k.t0 < 300; });
    shakes.forEach(function (k) {
      var t = now - k.t0, a = k.A * Math.exp(-t / 90);
      sx += a * Math.sin(2 * Math.PI * t / 70); sy += a * .6 * Math.cos(2 * Math.PI * t / 55);
    });
    var st = whip ? 1 + Math.min(Math.abs(skew) * .01, .07) : 1;
    world.style.transform = 'translate3d(' + (W / 2 + sx).toFixed(2) + 'px,' + (H / 2 + sy).toFixed(2) + 'px,0) rotateX(' + cam.rx.toFixed(3) + 'deg) rotateY(' + cam.ry.toFixed(3) + 'deg) rotate(' + cam.roll.toFixed(3) + 'deg) skewX(' + skew.toFixed(3) + 'deg) scale(' + (s * st).toFixed(5) + ',' + s.toFixed(5) + ') translate3d(' + (-cam.x).toFixed(2) + 'px,' + (-cam.y).toFixed(2) + 'px,0)';
  }
  function snap() {
    var T = target(frac);
    CH.forEach(function (k) { cam[k] = T[k]; });
    whip = null; skew = 0;
    stage.classList.add('no-anim');
    requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.remove('no-anim'); }); });
    render();
  }
  function frame(now) {
    raf = 0;
    var dt = last ? clamp(now - last, 1, 50) : 16;
    last = now;
    readScroll();
    var T = target(frac), moving = false, k;
    var x0 = cam.x;
    if (whip) {
      var t = now - whip.t0, u = clamp(t / 640, 0, 1), e = easeIO(u);
      CH.forEach(function (c) { cam[c] = whip.from[c] + (T[c] - whip.from[c]) * e; });
      cam.ls += Math.log(1 - (phone ? .14 : .2) * Math.sin(Math.PI * u));
      if (u >= 1) { whip = null; CH.forEach(function (c) { cam[c] = T[c]; }); }
      moving = true;
    } else {
      var a = 1 - Math.exp(-dt / (phone ? 120 : 150));
      for (k = 0; k < CH.length; k++) {
        var c = CH[k], d = T[c] - cam[c];
        if (Math.abs(d) > (c === 'ls' ? .0004 : c === 'x' || c === 'y' ? .06 : .005)) { cam[c] += d * a; moving = true; }
        else cam[c] = T[c];
      }
    }
    // skew smear from the camera's screen-space speed
    var vs = (cam.x - x0) * Math.exp(cam.ls) / dt, kMax = whip ? (phone ? 6 : 9) : 2.5;
    var ks = clamp(-vs * 1.6, -kMax, kMax);
    skew += (ks - skew) * .5;
    if (!isFinite(skew) || Math.abs(skew) < .01) skew = 0; else moving = true;
    if (!CH.every(function (c) { return isFinite(cam[c]); })) { whip = null; CH.forEach(function (c) { cam[c] = T[c]; }); }
    if (shakes.length) moving = true;
    render();
    stage.classList.toggle('is-moving', moving);
    if (live && moving) { if (!raf) raf = requestAnimationFrame(frame); }
    else if (!raf) last = 0;
  }
  function wake() { if (!raf && live) raf = requestAnimationFrame(frame); }
  function shake(A) { shakes.push({ t0: performance.now(), A: A }); wake(); }

  /* ---------- the discrete state ---------- */
  var card = $('.mv-card', sec), cardImg = card && $('.cd-char img', card), cdKanji = card && $('.cd-kanji', card), cdEp = card && $('.cd-ep', card), cdTitle = card && $('.cd-title', card), cdHanko = card && $('.cd-hanko', card);
  var speed = $('.mv-speed', sec), spdLines = $('.spd-lines', sec), spdKanji = $('.spd-kanji', sec), spdSlash = $('.spd-slash', sec), bars = $$('.mv-bars i', sec), vig = $('.mv-vignette i', sec), flash = $('.mv-flash', sec);
  var posNo = $('.pos-no', sec), posCol = $('.pos-col', sec), live2 = $('.mv-live', sec), prevBtn = $('.mv-prev', sec), nextBtn = $('.mv-next', sec);
  var glows = $$('.mv-glow', sec), timers = [], anims = [], cardPage = -1;
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function setCard(n) {
    if (!card || cardPage === n) return;
    cardPage = n;
    var pg = PAGES[n];
    if (!pg.lead) return;
    stage.style.setProperty('--acc', pg.acc);
    cardImg.src = IMG + pg.lead[0] + '.webp';
    cardImg.className = pg.lead[1] ? 'px' : '';
    cdKanji.textContent = pg.no;
    cdEp.textContent = 'Episode ' + pg.ep;
    cdTitle.innerHTML = pg.name.split(' ').map(function (w, i) { return '<span class="w" style="--i:' + i + '"><span>' + esc(w) + '</span></span>'; }).join(' ');
    cdHanko.textContent = pg.seal;
  }
  function startWhip(from, to) {
    var dir = to > from ? 1 : -1;
    whip = { t0: performance.now(), from: { x: cam.x, y: cam.y, ls: cam.ls, roll: cam.roll, rx: cam.rx, ry: cam.ry } };
    anims.forEach(function (a) { a.cancel(); });
    anims = [];
    if (spdKanji) spdKanji.textContent = PAGES[to].no;
    if (!speed || !speed.animate) return;
    var ease = 'cubic-bezier(.77,0,.175,1)';
    anims.push(speed.animate({ opacity: [0, 0, 1, 1, 0], offset: [0, .1, .28, .72, 1] }, { duration: 660 }));
    if (spdLines) anims.push(spdLines.animate({ transform: ['translateX(' + dir * 35 + '%)', 'translateX(' + (-dir * 35) + '%)'] }, { duration: 480, delay: 80, easing: 'linear' }));
    if (spdKanji) anims.push(spdKanji.animate({ transform: ['translate(-50%,-50%) translateX(' + (dir * W * .55) + 'px)', 'translate(-50%,-50%) translateX(' + (-dir * W * .8) + 'px)'] }, { duration: 480, delay: 80, easing: 'linear' }));
    if (spdSlash) anims.push(spdSlash.animate({ transform: ['translateX(' + (dir * W) + 'px) rotate(-18deg)', 'translateX(' + (-dir * W) + 'px) rotate(-18deg)'], opacity: [0, 1, 1, 0] }, { duration: 340, delay: 90, easing: ease }));
    bars.forEach(function (b) { anims.push(b.animate({ transform: ['scaleY(1)', 'scaleY(1.9)', 'scaleY(1.9)', 'scaleY(1)'], offset: [0, .44, .7, 1] }, { duration: 660, easing: ease })); });
    if (vig) anims.push(vig.animate({ opacity: [0, 1, 1, 0], offset: [0, .15, .7, 1] }, { duration: 660 }));
  }
  function apply(si, jump) {
    si = clamp(si, 0, N - 1);
    if (si === cur) return;
    var prev = cur >= 0 ? steps[cur] : null;
    cur = si;
    var st = steps[si], n = st.page;
    timers.forEach(clearTimeout);
    timers = [];
    var changed = [];
    pages.forEach(function (p, i) {
      var isCur = i === n;
      p.classList.toggle('is-cur', isCur);
      p.classList.toggle('is-near', Math.abs(i - n) <= 1);
      p.classList.toggle('is-title', isCur && st.kind === 'title');
      p.classList.toggle('is-panels', isCur && st.kind === 'panel');
      p.classList.toggle('is-reveal', isCur && st.kind === 'reveal');
      if (isCur) p.removeAttribute('inert'); else p.setAttribute('inert', '');
      var shown = i < n ? 4 : i > n ? 0 : st.shown;
      $$('.pn', p).forEach(function (x, k) {
        var on = k < shown;
        if (x.classList.contains('on') !== on) { x.classList.toggle('on', on); changed.push(x); }
        x.classList.toggle('is-focus', isCur && st.kind === 'panel' && k === shown - 1);
      });
    });
    var fwd = !prev || si > steps.indexOf(prev);
    if (changed.length > 1) (fwd ? changed : changed.slice().reverse()).forEach(function (x, k) { x.style.setProperty('--d', Math.min(k, 3) * 90 + 'ms'); });
    else changed.forEach(function (x) { x.style.setProperty('--d', '0ms'); });
    if (cover) cover.setAttribute('data-shown', n > 0 ? 3 : st.shown);
    // page change
    var pageChanged = !prev || prev.page !== n;
    if (pageChanged) {
      setCard(n);
      glows.forEach(function (g, i) { g.classList.toggle('on', i === n); });
      if (live2 && !firstApply) live2.textContent = 'Page ' + (n + 1) + ' of ' + PAGES.length + ': ' + PAGES[n].title.replace(' · ', ', ');
      if (live && !firstApply && !jump) startWhip(prev.page, n);
    }
    // episode title card
    if (card) {
      if (st.kind === 'title') {
        card.classList.remove('is-off');
        if (pageChanged && live && !firstApply) { card.classList.remove('quick'); later(function () { card.classList.add('is-on'); }, 380); }
        else { card.classList.add('is-on', 'quick'); }
      } else if (card.classList.contains('is-on')) {
        card.classList.remove('is-on');
        card.classList.add('is-off');
        later(function () { card.classList.remove('is-off'); }, 420);
      }
    }
    // hits: SFX stamps shake the camera, DEPLOYED flashes once
    if (live && prev && fwd && steps.indexOf(prev) === si - 1 && st.kind === 'panel') {
      var p = PAGES[n].panels[st.shown - 1];
      if (p.big) later(function () { shake(14); if (flash && flash.animate) flash.animate({ opacity: [0, .22, 0] }, { duration: 110 }); }, 300);
      else if (p.sfx) later(function () { shake(7); }, 300);
    }
    // HUD
    if (posNo) posNo.textContent = PAGES[n].no;
    if (posCol) posCol.style.transform = 'translateY(' + (-n) + 'em)';
    seals.forEach(function (b, i) {
      if (i === n) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      var f = i < n ? 1 : i > n ? 0 : PAGES[i].cover ? st.shown / 3 : st.shown / 4;
      var fill = $('.seal-fill', b);
      if (fill) fill.style.transform = 'scaleX(' + f + ')';
    });
    if (prevBtn) prevBtn.setAttribute('aria-disabled', si === 0);
    if (nextBtn) nextBtn.setAttribute('aria-disabled', n === PAGES.length - 1);
    sec.classList.toggle('is-read', si > 0);
    if (firstApply || !live || jump) { firstApply = false; snap(); }
    wake();
  }

  /* ---------- scroll ---------- */
  var ignore = 0;
  function readScroll() {
    if (ignore > 0) { ignore--; return; }
    if (document.documentElement.classList.contains('pw-active')) return;   /* a power is moving the camera */
    var p = clamp(-sec.getBoundingClientRect().top / run, 0, 1), f = p * N, n = Math.min(N - 1, Math.floor(f));
    if (cur >= 0 && n !== cur && f > cur - .08 && f < cur + 1.08) n = cur;   // hysteresis at step edges
    frac = clamp(f - n, 0, 1);
    if (n !== cur) apply(n);
  }
  window.addEventListener('scroll', function () { if (live) wake(); else readScroll(); }, { passive: true });

  /* ---------- controls ---------- */
  function firstStep(n) { for (var i = 0; i < N; i++) if (steps[i].page === n) return i; return 0; }
  function goPage(n) {
    n = clamp(n, 0, PAGES.length - 1);
    var t = firstStep(n);
    window.scrollTo({ top: secTop + (t + .5) / N * run, behavior: 'instant' });
    ignore = 2;
    frac = .5;
    apply(t);
  }
  if (prevBtn) prevBtn.addEventListener('click', function () {
    var st = steps[cur], t = firstStep(st.page);
    if (st.page > 0 && cur > t) { window.scrollTo({ top: secTop + (t + .5) / N * run, behavior: 'instant' }); ignore = 2; frac = .5; apply(t); }
    else goPage(st.page - 1);
  });
  if (nextBtn) nextBtn.addEventListener('click', function () { goPage(steps[cur].page + 1); });
  sec.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); if (nextBtn) nextBtn.click(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (prevBtn) prevBtn.click(); }
  });
  var tx = null, ty = 0;
  stage.addEventListener('touchstart', function (e) {
    if (e.target.closest('a, button')) { tx = null; return; }
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.6 * Math.abs(dy)) { if (dx < 0) { if (nextBtn) nextBtn.click(); } else if (prevBtn) prevBtn.click(); }
  }, { passive: true });

  /* ---------- live only while on screen ---------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      var was = live;
      live = en[0].isIntersecting;
      sec.classList.toggle('is-live', live);
      if (live && !was) { metrics(); readScroll(); snap(); wake(); }
    }).observe(sec);
  } else { live = true; sec.classList.add('is-live'); }
  var rt = 0;
  function onResize() { clearTimeout(rt); rt = setTimeout(function () { metrics(); snap(); }, 100); }
  window.addEventListener('resize', onResize);
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage);

  metrics();
  readScroll();
  if (cur < 0) apply(0);
})();
