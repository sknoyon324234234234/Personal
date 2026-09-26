/* =====================================================================
   XIRAIYA — anime layer for the inner pages
   A manga "opening spread" under each hero with a heroine guide, chapter
   stamps, screentone and speed lines, SFX on scroll and a panel-slash
   page transition. Each page gets one extra toy (gacha, mission rank…).
   Loads after core.js; everything here is decoration or navigation, so
   the page keeps working if this file never runs.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR || {};
  var root = document.documentElement;
  var page = document.body.getAttribute('data-page') || (/404/.test(document.title) ? '404' : '');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IMG = 'assets/img/anime/';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { if (XR.toast) XR.toast(m); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  var CAST = {
    mei:   { img: 'maid.webp',  name: 'Mei',    role: 'Shop maid', jp: '店番', w: 593, h: 1184 },
    homura:{ img: 'blaze.webp', name: 'Homura', role: 'Mission desk', jp: '任務', w: 522, h: 994 },
    mizu:  { img: 'aqua.webp',  name: 'Mizu',   role: 'Web sensei', jp: '先生', w: 434, h: 970 },
    yoru:  { img: 'shade.webp', name: 'Yoru',   role: 'Film critic', jp: '夜', w: 686, h: 873 },
    kuro:  { img: 'noir.webp',  name: 'Kuro',   role: 'UI kunoichi', jp: '黒', w: 298, h: 970 },
    tsuno: { img: 'sketch-horns.webp', name: 'Tsuno', role: 'Page sketcher', jp: '墨', w: 736, h: 928, ink: true }
  };

  var PAGES = {
    shop:       { who: 'mei',    ep: 4,  arc: 'The Market Arc', kanji: '市', sfx: 'キラッ',
                  say: 'Welcome back! Twelve stores and not one real charge. Can’t choose? Pull the gacha.',
                  blurb: 'Twelve storefronts, twelve different layouts. Pick one, fill a cart and check out for pretend.' },
    hire:       { who: 'homura', ep: 7,  arc: 'The Contract Arc', kanji: '契', sfx: 'ゴゴゴ',
                  say: 'Every job here gets a rank. Build your brief below and I will stamp it.',
                  blurb: 'Pick a package, configure the build and the estimate turns into a mission rank.' },
    learn:      { who: 'mizu',   ep: 3,  arc: 'The Training Arc', kanji: '修', sfx: 'シュッ',
                  say: 'Every lesson you mark as learned moves you up a rank. Let’s see how far you climb.',
                  blurb: '141 short lessons with live previews. Mark them learned and earn your ninja rank.' },
    demos:      { who: 'yoru',   ep: 5,  arc: 'The Premiere Arc', kanji: '映', sfx: 'バァン',
                  say: 'Fifteen sites, fifteen episodes. Can’t decide what to watch? I’ll pick for you.',
                  blurb: 'Every demo is a full episode with its own brand, type and motion. Preview on any screen size.' },
    kit:        { who: 'kuro',   ep: 6,  arc: 'The Arsenal Arc', kanji: '器', sfx: 'シャキン',
                  say: 'Fifty components, every one sharpened. Hover, click, then copy the code.',
                  blurb: 'Buttons, cards, forms and loaders you can poke. Then a button gets taken apart.' },
    pages:      { who: 'tsuno',  ep: 8,  arc: 'The Sketchbook Arc', kanji: '描', sfx: 'サラサラ',
                  say: 'I sketch it in ink first. You pick the theme and I colour it in.',
                  blurb: 'Thirteen full pages, seventy section variants and ten themes. Export when it looks right.' },
    world:      { who: 'kuro',   ep: 9,  arc: 'The Village Arc', kanji: '里', sfx: 'ワイワイ',
                  say: 'Welcome to the village. Each of us guards one building. Say hi and we’ll walk you there.',
                  blurb: 'Seven buildings, seven working tools. Meet the residents and pick where to start.' },
    '404':      { who: 'yoru',   ep: 0,  arc: 'The Lost Chapter', kanji: '迷', sfx: 'シーン',
                  say: 'This panel got torn out of the book. Pick a door and I’ll take you somewhere real.',
                  blurb: 'The page you wanted is not in this volume. These ones are.' }
  };
  var P = PAGES[page];
  root.classList.add('ax-on');

  /* ---------------- screentone + speed lines inside the hero ---------------- */
  var hero = $('main > .page-hero, main > .wd-hero, main.nf');
  if (hero) {
    hero.classList.add('ax-hero');
    hero.insertBefore(el('<div class="ax-tone" aria-hidden="true"><i class="ax-speed"></i><i class="ax-dots"></i></div>'), hero.firstChild);
  }

  /* ---------------- panel-slash page transition ---------------- */
  document.body.appendChild(el('<div class="ax-slash" aria-hidden="true"><i></i><i></i><i></i><b>次回</b></div>'));

  /* ---------------- chapters: collect sections, stamp them ---------------- */
  var KANJI_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  var chapters = [];
  $$('main > section').forEach(function (s) {
    if (s === hero || s.hidden) return;
    var h = $('.section-head h2, h2.h2', s);
    if (!h) return;
    if (!s.id) s.id = 'ch-' + (chapters.length + 1);
    var label = h.textContent.replace(/\s+/g, ' ').trim();
    chapters.push({ s: s, id: s.id, label: label.length > 46 ? label.slice(0, 44) + '…' : label });
    var head = h.closest('.section-head') || h.parentElement;
    if (head && !$('.ax-stamp', head)) {
      head.classList.add('ax-has-stamp');
      var stamp = el('<span class="ax-stamp" aria-hidden="true"><b>第' + KANJI_NUM[chapters.length - 1] + '話</b><small>Chapter ' + chapters.length + '</small></span>');
      var eyebrow = $(':scope > .num, :scope > .eyebrow', head);
      if (eyebrow) eyebrow.appendChild(stamp); else head.insertBefore(stamp, h);
    }
  });

  /* ---------------- SFX that pop in as chapters scroll into view ---------------- */
  var SFX = ['ドン', 'ゴゴゴ', 'バン', 'ズキュン', 'シュッ', 'ドドド', 'キラッ', 'ザッ', 'ドカン', 'ピカッ'];
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var head = $('.ax-has-stamp', e.target) || e.target;
        var fx = el('<span class="ax-sfx" aria-hidden="true">' + SFX[(chapters.findIndex(function (c) { return c.s === e.target; }) + (P ? P.ep : 0)) % SFX.length] + '</span>');
        head.appendChild(fx);
        requestAnimationFrame(function () { fx.classList.add('is-in'); });
      });
    }, { rootMargin: '0px 0px -30% 0px' });
    chapters.forEach(function (c) { io.observe(c.s); });
  }

  if (!P) return;
  var G = CAST[P.who];

  /* ---------------- the opening spread ---------------- */
  var epNo = P.ep ? ('0' + P.ep).slice(-2) : '??';
  var jumps = chapters.length < 2 ? '' : chapters.slice(0, 4).map(function (c, i) {
    return '<li><a href="#' + esc(c.id) + '"><span>第' + KANJI_NUM[i] + '話</span>' + esc(c.label) + '</a></li>';
  }).join('');
  var spread = el(
    '<section class="ax-open" aria-label="' + esc(P.arc) + ', guided by ' + esc(G.name) + '">' +
      '<div class="container container-wide">' +
        '<div class="ax-spread">' +
          '<div class="ax-p ax-p-girl' + (G.ink ? ' is-ink' : '') + '">' +
            '<i class="ax-burst" aria-hidden="true"></i>' +
            '<span class="ax-kanji" aria-hidden="true">' + P.kanji + '</span>' +
            '<img class="ax-girl" src="' + IMG + G.img + '" alt="' + esc(G.name) + ', the ' + esc(G.role.toLowerCase()) + ', anime guide for this page" width="' + G.w + '" height="' + G.h + '" loading="lazy" decoding="async">' +
            '<p class="ax-bubble">' + esc(P.say) + '</p>' +
            '<span class="ax-name"><b>' + esc(G.name) + '</b><small>' + esc(G.role) + ' · ' + G.jp + '</small></span>' +
            '<span class="ax-bigsfx" aria-hidden="true">' + P.sfx + '</span>' +
          '</div>' +
          '<div class="ax-p ax-p-title">' +
            '<span class="ax-ep">' + (P.ep ? 'Episode ' + epNo : 'Lost episode') + '</span>' +
            '<p class="ax-arc">' + esc(P.arc) + '</p>' +
            '<p class="ax-blurb">' + esc(P.blurb) + '</p>' +
          '</div>' +
          '<div class="ax-p ax-p-toy" data-toy="' + esc(page) + '"></div>' +
          (jumps ? '<nav class="ax-p ax-p-jump" aria-label="Chapters on this page"><span class="ax-cap">In this episode</span><ol>' + jumps + '</ol></nav>' : '') +
        '</div>' +
      '</div>' +
    '</section>'
  );
  if (hero && hero.tagName === 'SECTION') hero.parentNode.insertBefore(spread, hero.nextSibling);
  else if (hero) hero.appendChild(spread);
  var toy = $('.ax-p-toy', spread);

  // poke the heroine: she reacts and cycles her lines
  var LINES = [P.say, 'Hey! That tickles.', 'Scroll down, the good panels are below.', 'Try the ink mode in the menu. I look cooler in the dark.', 'Tap me again. I have more to say.'];
  var li = 0, girlPanel = $('.ax-p-girl', spread), bubble = $('.ax-bubble', spread);
  girlPanel.setAttribute('tabindex', '0');
  girlPanel.setAttribute('role', 'button');
  girlPanel.setAttribute('aria-label', 'Talk to ' + G.name);
  function poke() {
    li = (li + 1) % LINES.length;
    bubble.textContent = LINES[li];
    girlPanel.classList.remove('is-poked'); void girlPanel.offsetWidth; girlPanel.classList.add('is-poked');
  }
  girlPanel.addEventListener('click', poke);
  girlPanel.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });

  /* ---------------- one toy per page ---------------- */
  var TOYS = {
    shop: function () {
      toy.innerHTML = '<span class="ax-cap">Template gacha</span>' +
        '<div class="ax-gacha"><div class="ax-capsule" aria-hidden="true"><i></i></div><p class="ax-pull" aria-live="polite">One free pull. Every result is a real store you can open.</p></div>' +
        '<button type="button" class="btn btn-primary ax-btn">Pull the gacha</button>';
      var btn = $('.ax-btn', toy), cap = $('.ax-capsule', toy), out = $('.ax-pull', toy);
      btn.addEventListener('click', function () {
        var cards = $$('.tpl-rail .tpl-card');
        if (!cards.length) { out.textContent = 'The stores are still loading. Try again in a second.'; return; }
        btn.disabled = true; cap.classList.remove('is-open'); cap.classList.add('is-spin');
        setTimeout(function () {
          var c = cards[Math.floor(Math.random() * cards.length)];
          var name = ($('.tpl-txt b', c) || c).textContent;
          var stars = 3 + Math.floor(Math.random() * 3);
          cap.classList.remove('is-spin'); cap.classList.add('is-open');
          out.innerHTML = '<b class="ax-stars" aria-label="' + stars + ' stars">' + '★★★★★'.slice(0, stars) + '</b> You pulled <b>' + esc(name) + '</b>. Opening it below.';
          btn.disabled = false; btn.textContent = 'Pull again';
          c.hidden = false; c.click();
          var store = $('.store'); if (store) setTimeout(function () { store.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 500);
        }, reduce ? 50 : 1100);
      });
    },

    hire: function () {
      toy.innerHTML = '<span class="ax-cap">Mission rank</span>' +
        '<div class="ax-rank"><b class="ax-rank-l" aria-hidden="true">?</b><p aria-live="polite"><b class="ax-rank-t">Unranked mission</b><span class="ax-rank-d">Pick a service in the configurator and I will rank the job.</span></p></div>' +
        '<a class="btn btn-primary ax-btn" href="#configure">Build the brief</a>';
      var R = [
        [50, 'D', 'Errand', 'A quick fix or a small page. Done in days.'],
        [150, 'C', 'Patrol', 'A proper site or bot with a few moving parts.'],
        [300, 'B', 'Escort', 'A full build with custom features and care.'],
        [500, 'A', 'Assault', 'A big system: store, dashboard or app.'],
        [1e9, 'S', 'Legend', 'The whole village turns out for this one.']
      ];
      var sum = $('.sum-range'), L = $('.ax-rank-l', toy), T = $('.ax-rank-t', toy), D = $('.ax-rank-d', toy);
      function rank() {
        var nums = (sum.textContent || '').replace(/,/g, '').match(/\d+(\.\d+)?/g);
        var hi = nums ? parseFloat(nums[nums.length - 1]) : 0;
        if (!hi) { L.textContent = '?'; L.removeAttribute('data-r'); T.textContent = 'Unranked mission'; D.textContent = 'Pick a service in the configurator and I will rank the job.'; return; }
        var r = R.filter(function (x) { return hi <= x[0]; })[0];
        if (L.textContent !== r[1]) { L.classList.remove('is-stamp'); void L.offsetWidth; L.classList.add('is-stamp'); }
        L.textContent = r[1]; L.setAttribute('data-r', r[1]);
        T.textContent = r[1] + '-rank · ' + r[2];
        D.textContent = r[3];
      }
      if (sum) { rank(); new MutationObserver(rank).observe(sum, { childList: true, characterData: true, subtree: true }); }
    },

    learn: function () {
      toy.innerHTML = '<span class="ax-cap">Your ninja rank</span>' +
        '<div class="ax-rank"><b class="ax-rank-l ax-rank-k" aria-hidden="true">学</b><p aria-live="polite"><b class="ax-rank-t">Academy student</b><span class="ax-rank-d"></span></p></div>' +
        '<div class="ax-bar" aria-hidden="true"><i></i></div>';
      var R = [[0, '学', 'Academy student'], [5, '下', 'Genin'], [20, '中', 'Chūnin'], [50, '上', 'Jōnin'], [100, '影', 'Kage'], [1e9, '仙', 'Sannin']];
      var L = $('.ax-rank-l', toy), T = $('.ax-rank-t', toy), D = $('.ax-rank-d', toy), B = $('.ax-bar i', toy);
      var learnedEl = $('[data-kn="learned"]'), totalEl = $('[data-kn="lessons"]');
      function rank() {
        var n = parseInt(learnedEl && learnedEl.textContent, 10) || 0, total = parseInt(totalEl && totalEl.textContent, 10) || 141;
        var i = 0; while (i < R.length - 1 && n >= R[i + 1][0]) i++;
        if (n >= total) i = R.length - 1;
        var next = i < R.length - 1 ? Math.min(R[i + 1][0], total) : total;
        if (L.textContent !== R[i][1]) { L.classList.remove('is-stamp'); void L.offsetWidth; L.classList.add('is-stamp'); }
        L.textContent = R[i][1]; T.textContent = R[i][2];
        D.textContent = n + ' of ' + total + ' lessons learned' + (n < total ? ' · ' + (next - n) + ' more to ' + (n >= R[4][0] ? 'Sannin' : R[i + 1][2]) : ' · every scroll mastered');
        B.style.width = Math.round(n / total * 100) + '%';
      }
      rank();
      if (learnedEl) new MutationObserver(rank).observe(learnedEl, { childList: true, characterData: true, subtree: true });
    },

    demos: function () {
      var cards = $$('.dm-grid .dm');
      cards.forEach(function (c, i) {
        var body = $('.dm-body', c);
        if (body && !$('.ax-epi', body)) body.insertBefore(el('<span class="ax-epi">Ep. ' + ('0' + (i + 1)).slice(-2) + '</span>'), body.firstChild);
      });
      toy.innerHTML = '<span class="ax-cap">Tonight’s episode</span>' +
        '<p class="ax-pull" aria-live="polite">Fifteen episodes. Let Yoru spin the reel and pick one.</p>' +
        '<button type="button" class="btn btn-primary ax-btn">Pick for me</button>';
      var out = $('.ax-pull', toy);
      $('.ax-btn', toy).addEventListener('click', function () {
        var vis = cards.filter(function (c) { return !c.hidden && c.offsetParent; });
        if (!vis.length) return;
        var c = vis[Math.floor(Math.random() * vis.length)];
        var name = ($('.dm-body .h4', c) || c).textContent;
        out.innerHTML = 'Now showing: <b>' + esc(name) + '</b>. Hit the poster to open the preview.';
        c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        cards.forEach(function (x) { x.classList.remove('ax-pick'); });
        c.classList.add('ax-pick');
        setTimeout(function () { c.classList.remove('ax-pick'); }, 3600);
      });
    },

    kit: function () { tips(['Every component on this page is live. Hover it before you copy it.', 'The anatomy section shows every token a button uses. Steal the spacing.', 'Open a component’s code, copy it, paste it. No dependencies to install.', 'Switch to ink mode in the menu. Every component has a dark version.']); },
    pages: function () { tips(['Pick a theme first. Every section repaints to match.', 'Swap any section for one of its variants. There are seventy.', 'Change the button style once and it changes on every page.', 'Happy with it? Export the page and it’s yours to keep.']); },

    world: function () {
      var RES = [['mizu', 'terminal', 'Terminal Dojo'], ['homura', 'playground', 'Code Workshop'], ['mei', 'toolbox', 'Toolbox Forge'], ['yoru', 'api', 'API Shrine'], ['kuro', 'git', 'Git Tower']];
      toy.classList.add('ax-p-res');
      toy.innerHTML = '<span class="ax-cap">Village residents</span><ul class="ax-res">' + RES.map(function (r) {
        var c = CAST[r[0]];
        return '<li><a href="#' + r[1] + '"><img src="' + IMG + c.img + '" alt="" width="' + c.w + '" height="' + c.h + '" loading="lazy" decoding="async"><b>' + esc(c.name) + '</b><small>' + esc(r[2]) + '</small></a></li>';
      }).join('') + '</ul>';
    },

    '404': function () {
      toy.innerHTML = '<span class="ax-cap">Pick a door</span><div class="ax-doors">' +
        [['./', 'Home', '家'], ['showcase', 'The Lab', '研'], ['shop', 'Shop', '店'], ['hire', 'Hire me', '雇']].map(function (d) {
          return '<a href="' + d[0] + '"><span aria-hidden="true">' + d[2] + '</span>' + d[1] + '</a>';
        }).join('') + '</div>';
      spread.classList.add('ax-open-404');
    }
  };
  function tips(list) {
    toy.innerHTML = '<span class="ax-cap">' + esc(G.name) + '’s tip</span><p class="ax-pull" aria-live="polite">' + esc(list[0]) + '</p><button type="button" class="btn btn-ghost ax-btn">Next tip</button>';
    var i = 0, out = $('.ax-pull', toy);
    $('.ax-btn', toy).addEventListener('click', function () { i = (i + 1) % list.length; out.textContent = list[i]; });
  }
  if (TOYS[page]) TOYS[page]();
  else toy.remove();

  // entrance: panels slam in one after another when the spread reaches the screen
  if ('IntersectionObserver' in window && !reduce) {
    spread.classList.add('ax-wait');
    var so = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      so.disconnect();
      spread.classList.add('is-in');
    }, { threshold: 0.15 });
    so.observe(spread);
  }
})();
