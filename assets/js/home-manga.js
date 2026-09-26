/* =====================================================================
   XIRAIYA — home: "The Hidden Village", a four-page manga read by scrolling
   The section pins while you scroll. Each scroll step slams in the next
   panel (with its sound effect and speech bubbles); at the end of a page,
   the page turns right-to-left like a real manga. Buttons and arrow keys
   jump page by page. Reduced motion: all pages are shown flat, in order.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$;
  var sec = $('#manga');
  if (!sec) return;
  var IMG = 'assets/img/anime/';

  /* a panel: a = grid area (row / col / row-end / col-end), clip = polygon, bg = screen tone,
     img = [file, fit, object-position, scale], pop = breaks out of the frame,
     sfx = [text, x%, y%, deg, colour], b = bubbles [text, x%, y%, tail side, style] */
  var PAGES = [
    { title: 'Cover', cover: true },
    {
      title: 'Chapter 1 · The summons', no: '第一話',
      panels: [
        { a: '1/1/3/5', clip: '0 0,100% 0,100% 88%,0 100%', bg: 'night', img: ['shade', 'cover', '50% 22%', 1.25], sfx: ['ゴゴゴ', 78, 18, -8, '#b57bff'], b: [['A new client. Their shop needs a website by dawn.', 6, 12, 'r']] },
        { a: '3/3/7/5', clip: '0 8%,100% 0,100% 100%,0 100%', bg: 'focus', img: ['albedo', 'contain', '50% 100%', 1], pop: true, sfx: ['ザッ', 12, 20, 10, '#fff'], b: [['Then we build it tonight.', 4, 56, 'r', 'shout']] },
        { a: '3/1/5/3', clip: '0 4%,100% 0,94% 100%,0 100%', bg: 'tone', img: ['noir', 'cover', '50% 12%', 1.15], sfx: ['キラッ', 70, 72, -12, '#ffd34d'], cap: 'The night scribe wakes.' },
        { a: '5/1/7/3', clip: '0 0,94% 0,100% 100%,0 100%', bg: 'water', img: ['aqua', 'cover', '50% 14%', 1.1], b: [['Database is ready.', 8, 66, 'l']] }
      ]
    },
    {
      title: 'Chapter 2 · The all-nighter', no: '第二話',
      panels: [
        { a: '1/1/5/3', clip: '0 0,100% 0,84% 100%,0 100%', bg: 'fire', img: ['blaze', 'contain', '50% 100%', 1], pop: true, sfx: ['ドドドド', 52, 8, 8, '#ff7a2e'], b: [['Front-end, full power!', 40, 70, 'l', 'shout']] },
        { a: '1/3/3/5', clip: '12% 0,100% 0,100% 100%,0 92%', bg: 'pink', img: ['maid', 'cover', '50% 12%', 1.35], sfx: ['キャー', 70, 70, -10, '#ff5d9e'], b: [['Every customer answered!', 22, 8, 'b']] },
        { a: '3/3/5/5', clip: '0 8%,100% 0,100% 100%,16% 100%', bg: 'night', img: ['shade', 'contain', '78% 100%', 1.05], b: [['Shadow clones deployed. Scripts running.', 6, 14, 'r']] },
        { a: '5/1/7/5', clip: '0 6%,100% 0,100% 100%,0 100%', bg: 'impact', big: 'DEPLOYED', cap: '5:59 AM. One minute before dawn.' }
      ]
    },
    {
      title: 'Epilogue · Before the ink', no: '終話',
      panels: [
        { a: '1/1/4/3', clip: '0 0,100% 0,96% 100%,0 100%', bg: 'paper', img: ['sketch-oni', 'cover', '50% 8%', 1], cap: 'Every hero starts as a rough sketch.' },
        { a: '1/3/4/5', clip: '4% 0,100% 0,100% 100%,0 100%', bg: 'paper', img: ['sketch-horns', 'cover', '50% 30%', 1], b: [['…just like your idea.', 50, 70, 'l']] },
        { a: '4/1/7/3', clip: '0 0,100% 4%,100% 100%,0 100%', bg: 'paper', img: ['sketch-witch', 'cover', '50% 20%', 1], sfx: ['シャッ', 64, 12, -10, '#111'] },
        { a: '4/3/7/5', clip: '0 4%,100% 0,100% 100%,0 100%', bg: 'cta', cta: true }
      ]
    }
  ];

  var book = $('.mv-book', sec);
  function esc(t) { return XR.esc(t); }
  function panelHTML(p, i) {
    var h = '<div class="pn bg-' + p.bg + (p.pop ? ' pop' : '') + '" style="--a:' + p.a + ';--clip:polygon(' + p.clip + ');--i:' + i + '">';
    h += '<div class="pn-frame">';
    if (p.img && !p.pop) h += '<img class="pn-img' + (/^sketch/.test(p.img[0]) ? '' : ' px') + '" src="' + IMG + p.img[0] + '.webp" alt="" loading="lazy" decoding="async" style="object-fit:' + p.img[1] + ';object-position:' + p.img[2] + ';--s:' + p.img[3] + '">';
    if (p.big) h += '<b class="pn-big">' + esc(p.big) + '</b>';
    if (p.cta) h += '<div class="pn-cta"><small>Next chapter</small><b>Yours.</b><p>Tell me what your shop, bot or app should do and the crew gets to work tonight.</p><div><a class="btn btn-primary" href="hire">Start my chapter <svg class="ic"><use href="#i-arrow-right"/></svg></a><a class="btn btn-ghost" href="showcase">Enter the Lab</a></div></div>';
    h += '</div>';
    if (p.img && p.pop) h += '<img class="pn-img pn-out' + (p.img[0] === 'albedo' || p.img[0] === 'shade' ? '' : ' px') + '" src="' + IMG + p.img[0] + '.webp" alt="" loading="lazy" decoding="async" style="object-position:' + p.img[2] + '">';
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
  book.innerHTML = PAGES.map(function (pg, n) {
    var inner = pg.cover ? coverHTML() : '<header class="pg-head"><span class="jp">' + pg.no + '</span><b>' + esc(pg.title) + '</b></header><div class="pg-grid">' + pg.panels.map(panelHTML).join('') + '</div>';
    return '<article class="pg' + (pg.cover ? ' is-cover' : '') + '" data-n="' + n + '" aria-label="Page ' + (n + 1) + ': ' + esc(pg.title) + '"><div class="pg-paper">' + inner + '<span class="pg-num">' + (n + 1) + '</span></div></article>';
  }).join('');

  /* steps: the cover counts 3 (title, girls, tagline), each panel counts 1, plus one "turn" beat per page */
  var steps = [];
  PAGES.forEach(function (pg, n) {
    var count = pg.cover ? 3 : pg.panels.length;
    for (var k = 0; k <= count; k++) steps.push({ page: n, shown: k });
  });
  var pages = $$('.pg', book);
  var pos = $('.mv-pos b', sec);
  var flat = XR.reduce;
  if (flat) { sec.classList.add('is-flat'); pages.forEach(function (p) { p.classList.add('on'); $$('.pn', p).forEach(function (x) { x.classList.add('on'); }); p.setAttribute('data-shown', 9); }); return; }

  sec.style.setProperty('--steps', steps.length);
  var cur = -1;
  function apply(si) {
    si = XR.clamp(si, 0, steps.length - 1);
    if (si === cur) return;
    cur = si;
    var st = steps[si];
    pages.forEach(function (p, n) {
      p.classList.toggle('on', n === st.page);
      p.classList.toggle('turned', n < st.page);
      var shown = n < st.page ? 99 : n > st.page ? 0 : st.shown;
      p.setAttribute('data-shown', shown);
      $$('.pn', p).forEach(function (x, k) { x.classList.toggle('on', k < shown); });
    });
    if (pos) pos.textContent = st.page + 1;
    sec.classList.toggle('is-read', si > 0);
  }
  function stepFromScroll() {
    var r = sec.getBoundingClientRect();
    var run = sec.offsetHeight - innerHeight;
    var p = XR.clamp(-r.top / Math.max(1, run), 0, 1);
    return Math.min(steps.length - 1, Math.floor(p * steps.length));
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; apply(stepFromScroll()); });
  }, { passive: true });
  window.addEventListener('resize', function () { apply(stepFromScroll()); });
  apply(stepFromScroll());

  function goPage(n) {
    n = XR.clamp(n, 0, PAGES.length - 1);
    var idx = 0;
    for (var i = 0; i < steps.length; i++) { if (steps[i].page === n) { idx = i; break; } }
    // land on the fully read state of that page (last step before the turn beat)
    var last = idx; while (last + 1 < steps.length && steps[last + 1].page === n) last++;
    var target = n === 0 ? idx : last - 0;
    var run = sec.offsetHeight - innerHeight;
    var top = sec.getBoundingClientRect().top + scrollY + (target + .5) / steps.length * run;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }
  $('.mv-prev', sec).addEventListener('click', function () { goPage(steps[Math.max(cur, 0)].page - 1); });
  $('.mv-next', sec).addEventListener('click', function () { goPage(steps[Math.max(cur, 0)].page + 1); });
  sec.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); goPage(steps[cur].page + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPage(steps[cur].page - 1); }
  });
})();
