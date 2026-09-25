/* XIRAIYA — Basic Knowledge page: chapters, lesson cards, search, progress
   and the lesson viewer that mounts a live preview from XR_PV. */
(function () {
  'use strict';
  var XR = window.XR, D = window.XR_LEARN, PV = window.XR_PV;
  if (!XR || !D || !PV) return;
  var $ = XR.$, $$ = XR.$$, esc = XR.esc, icon = XR.icon;

  var KIND = { flow: 'Animated flow', layers: 'Layer stack', url: 'URL anatomy', compare: 'Side by side', code: 'Run the code', steps: 'Step by step', status: 'Status codes', dom: 'DOM tree', selector: 'Selector lab', css: 'CSS playground', resp: 'Responsive frame', events: 'Live events', json: 'JSON explorer', async: 'Async timeline', storage: 'Real storage', ui: 'Live component', ux: 'UX experiment', motion: 'Motion study', rest: 'REST console', jwt: 'JWT decoder', ws: 'Live socket', atk: 'Attack simulator', sql: 'SQL console', index: 'Index race', txn: 'Transaction', hash: 'Live hashing', totp: 'Live 2FA code', term: 'Terminal', hack: 'Incident playbook', git: 'Git graph', deploy: 'Deploy pipeline', monitor: 'Live monitor', vitals: 'Web Vitals', img: 'Image lab', serp: 'Google preview', og: 'Share preview', tokens: 'Tokenizer', embed: 'Meaning map' };
  var KIC = { flow: 'flow', layers: 'layers', url: 'link', compare: 'filter', code: 'code', steps: 'target', status: 'activity', dom: 'frame', selector: 'cursor', css: 'sliders', resp: 'tablet', events: 'mouse', json: 'box', async: 'clock', storage: 'database', ui: 'palette', ux: 'users', motion: 'film', rest: 'server', jwt: 'key', ws: 'chat', atk: 'shield', sql: 'database', index: 'zap', txn: 'refresh', hash: 'hash', totp: 'lock', term: 'terminal', hack: 'alert', git: 'git', deploy: 'rocket', monitor: 'activity', vitals: 'trending', img: 'image', serp: 'search', og: 'send', tokens: 'type', embed: 'target' };
  var THUMB = { flow: 'net', url: 'net', status: 'net', rest: 'net', ws: 'net', deploy: 'net', code: 'code', term: 'term', json: 'code', events: 'code', dom: 'code', selector: 'code', jwt: 'code', hash: 'code', storage: 'code', async: 'bars', git: 'net', sql: 'table', index: 'table', txn: 'table', atk: 'shield', hack: 'shield', totp: 'shield', css: 'box', resp: 'box', layers: 'stack', compare: 'box', steps: 'bars', ui: 'ui', ux: 'ui', serp: 'ui', og: 'ui', motion: 'motion', vitals: 'bars', monitor: 'bars', img: 'ui', tokens: 'ai', embed: 'ai' };

  var ALL = [], BY = {};
  D.forEach(function (c, ci) {
    c.l.forEach(function (l) {
      var a = { c: c, ci: ci, i: ALL.length, id: l[0], t: l[1], one: l[2], body: l[3], pts: String(l[4] || '').split('|'), kind: l[5], cfg: l[6] || {} };
      ALL.push(a); BY[a.id] = a;
    });
  });
  var learned = XR.store('xr-learn') || {};
  function num(n) { return ('00' + (n + 1)).slice(-3); }

  /* ---------- preview context: timers and listeners that die together ---------- */
  function ctx(el) {
    var st = { t: [], iv: [], off: [], stop: [], alive: true, gen: 0 };
    function clear() {
      st.t.forEach(clearTimeout); st.iv.forEach(clearInterval);
      st.off.forEach(function (f) { f(); });
      st.stop.forEach(function (f) { try { f(); } catch (e) {} });
      st.t = []; st.iv = []; st.off = []; st.stop = []; st.gen++;
    }
    return {
      el: el,
      alive: function () { return st.alive; },
      later: function (f, ms) { var id = setTimeout(function () { if (st.alive) f(); }, ms); st.t.push(id); return id; },
      every: function (f, ms) { var id = setInterval(function () { if (st.alive && !document.hidden) f(); }, ms); st.iv.push(id); return id; },
      loop: function (f) { var g = st.gen; (function tick(ts) { if (!st.alive || g !== st.gen) return; if (f(ts || performance.now()) !== false) requestAnimationFrame(tick); })(performance.now()); },
      on: function (t, ev, f, o) { t.addEventListener(ev, f, o); st.off.push(function () { t.removeEventListener(ev, f, o); }); },
      onStop: function (f) { st.stop.push(f); },
      reset: function () { clear(); st.alive = true; },
      stop: function () { clear(); st.alive = false; }
    };
  }
  function mount(host, a) {
    host.innerHTML = '';
    var k = ctx(host);
    try { (PV[a.kind] || PV.steps)(k, a.cfg, a); }
    catch (e) { host.innerHTML = '<p class="pv-note">This preview could not start in your browser.</p>'; if (window.console) console.error(e); }
    return k;
  }

  /* ---------- stats, progress ---------- */
  function learnedCount(c) { return (c ? c.l : ALL.map(function (a) { return [a.id]; })).filter(function (l) { return learned[l[0]]; }).length; }
  function paintProgress() {
    var n = learnedCount(), p = n / ALL.length;
    $$('[data-kn="learned"]').forEach(function (e) { e.textContent = n; });
    var ring = $('.kn-ring .v'); if (ring) ring.style.strokeDashoffset = (283 * (1 - p)).toFixed(1);
    var pc = $('.kn-ring-pc'); if (pc) pc.textContent = Math.round(p * 100) + '%';
    D.forEach(function (c) {
      var s = $('#ch-' + c.id); if (!s) return;
      var m = learnedCount(c);
      $('.kn-ch-count', s).textContent = c.l.length + ' lessons · ' + m + ' learned';
      $('.kn-ch-bar i', s).style.width = (m / c.l.length * 100) + '%';
      s.classList.toggle('complete', m === c.l.length);
      var chip = $('.kn-chip[data-ch="' + c.id + '"]'); if (chip) chip.classList.toggle('complete', m === c.l.length);
    });
    $$('.kn-card').forEach(function (b) { b.classList.toggle('learned', !!learned[b.getAttribute('data-id')]); });
  }
  function setLearned(id, v) {
    var before = learnedCount();
    if (v) learned[id] = Date.now(); else delete learned[id];
    XR.store('xr-learn', learned);
    paintProgress();
    var a = BY[id], n = learnedCount();
    if (v && a && learnedCount(a.c) === a.c.l.length) XR.toast('Chapter complete: ' + a.c.t + '. ' + n + ' of ' + ALL.length + ' lessons learned.');
    else if (v && n > before && (n === 10 || n === 50 || n === 100)) XR.toast(n + ' lessons learned. Keep going, sage.');
    if (v && n === ALL.length) XR.toast('Every lesson learned. You now know the basics better than most developers.');
  }

  /* ---------- page ---------- */
  function thumb(kind) {
    var t = THUMB[kind] || 'code';
    var inner = { net: '<i></i><i></i><i></i><b></b>', code: '<i></i><i></i><i></i><i></i><i></i>', term: '<i></i><i></i><i></i><b></b>', bars: '<i></i><i></i><i></i><i></i><i></i>', table: '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>', shield: icon('shield') + '<i></i><i></i>', box: '<i><i><i></i></i></i>', stack: '<i></i><i></i><i></i>', ui: '<i></i><i></i><i></i><b></b>', motion: '<svg viewBox="0 0 60 30"><path d="M2 28 C24 28 30 2 58 2"/></svg><b></b>', ai: '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><b></b>' }[t];
    return '<span class="kt kt-' + t + '" aria-hidden="true">' + inner + '</span>';
  }
  function card(a) {
    return '<button type="button" class="kn-card" data-id="' + a.id + '" style="--i:' + (a.i % 12) + '">' +
      '<span class="kc-top"><span class="kc-no">' + num(a.i) + '</span><span class="kc-kind">' + icon(KIC[a.kind] || 'play') + esc(KIND[a.kind] || 'Preview') + '</span></span>' +
      thumb(a.kind) +
      '<b class="kc-t">' + esc(a.t) + '</b><span class="kc-one">' + esc(a.one) + '</span>' +
      '<span class="kc-go">Open live preview' + icon('arrow-right') + '</span><span class="kc-done" title="Learned">' + icon('check') + '</span></button>';
  }
  function build() {
    var chips = $('.kn-chips'), host = $('.kn-chapters');
    if (!host) return;
    chips.innerHTML = D.map(function (c, i) { return '<a class="kn-chip" href="#ch-' + c.id + '" data-ch="' + c.id + '" style="--cc:' + c.c + '"><span class="jp">' + c.jp + '</span>' + esc(c.t) + '<em>' + c.l.length + '</em></a>'; }).join('');
    host.innerHTML = D.map(function (c, i) {
      return '<section class="kn-ch" id="ch-' + c.id + '" style="--cc:' + c.c + '" data-reveal>' +
        '<header class="kn-ch-h"><span class="kn-ch-no">' + ('0' + (i + 1)).slice(-2) + '</span><span class="kn-seal jp">' + c.jp + '</span>' +
        '<div class="kn-ch-t"><h2>' + esc(c.t) + '</h2><span class="kn-ch-count"></span><span class="kn-ch-bar"><i></i></span></div>' +
        '<button type="button" class="kn-ch-start" data-open="' + c.l[0][0] + '">' + icon('play') + 'Start chapter</button></header>' +
        '<div class="kn-grid">' + ALL.filter(function (a) { return a.ci === i; }).map(card).join('') + '</div></section>';
    }).join('');
    $$('[data-kn="lessons"]').forEach(function (e) { e.textContent = ALL.length; });
    $$('[data-kn="chapters"]').forEach(function (e) { e.textContent = D.length; });
    $$('[data-kn="kinds"]').forEach(function (e) { e.textContent = Object.keys(KIND).length; });
    paintProgress();
    if (XR.reveals) XR.reveals();

    /* card tilt on fine pointers */
    if (XR.fine && !XR.reduce) {
      host.addEventListener('pointermove', function (e) {
        var b = e.target.closest('.kn-card'); if (!b) return;
        var r = b.getBoundingClientRect();
        b.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -8).toFixed(2) + 'deg');
        b.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg');
        b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        b.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
      host.addEventListener('pointerout', function (e) { var b = e.target.closest('.kn-card'); if (b && !b.contains(e.relatedTarget)) { b.style.removeProperty('--rx'); b.style.removeProperty('--ry'); } });
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.kn-card, [data-open]'); if (!b) return;
      e.preventDefault(); open(b.getAttribute('data-id') || b.getAttribute('data-open'));
    });

    /* active chapter chip */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (!x.isIntersecting) return;
          var id = x.target.id.slice(3);
          $$('.kn-chip').forEach(function (c) {
            var on = c.getAttribute('data-ch') === id; c.classList.toggle('on', on);
            if (on && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left: c.offsetLeft - chips.clientWidth / 2 + c.offsetWidth / 2, behavior: 'smooth' });
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('.kn-ch').forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- search ---------- */
  function search() {
    var inp = $('.kn-q'); if (!inp) return;
    var empty = $('.kn-empty'), count = $('.kn-found');
    function run() {
      var q = inp.value.trim().toLowerCase(), n = 0;
      $$('.kn-card').forEach(function (b) {
        var a = BY[b.getAttribute('data-id')];
        var hit = !q || (a.t + ' ' + a.one + ' ' + a.body + ' ' + a.c.t + ' ' + (KIND[a.kind] || '')).toLowerCase().indexOf(q) > -1;
        b.hidden = !hit; if (hit) n++;
      });
      $$('.kn-ch').forEach(function (s) { s.hidden = !$$('.kn-card', s).some(function (b) { return !b.hidden; }); });
      if (empty) empty.hidden = n > 0;
      if (count) count.textContent = q ? n + ' lesson' + (n === 1 ? '' : 's') + ' found' : '';
    }
    inp.addEventListener('input', run);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var b = $$('.kn-card').filter(function (x) { return !x.hidden; })[0]; if (b) open(b.getAttribute('data-id')); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/input|textarea/i.test((document.activeElement || {}).tagName || '') && !lv.classList.contains('is-open')) { e.preventDefault(); inp.focus(); inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    });
    $$('[data-kn-tag]').forEach(function (t) { t.addEventListener('click', function () { inp.value = t.getAttribute('data-kn-tag'); run(); $('#chapters').scrollIntoView({ behavior: 'smooth' }); }); });
    $$('[data-kn-random]').forEach(function (b) {
      b.addEventListener('click', function () {
        var pool = ALL.filter(function (a) { return !learned[a.id]; }); if (!pool.length) pool = ALL;
        open(pool[Math.floor(Math.random() * pool.length)].id);
      });
    });
  }

  /* ---------- hero live preview ---------- */
  var heroK = null;
  function hero() {
    var box = $('.kn-live'); if (!box) return;
    var list = ['internet', 'flexbox', 'sqli', 'easing', 'join', 'ddos', 'buttons', 'jwt', 'git', 'embeddings'].filter(function (x) { return BY[x]; });
    var i = 0, stage = $('.kn-live-stage', box), timer = null, visible = true;
    function show() {
      if (heroK) heroK.stop();
      var a = BY[list[i % list.length]];
      $('.kn-live-t', box).textContent = a.t;
      $('.kn-live-k', box).innerHTML = icon(KIC[a.kind] || 'play') + esc(KIND[a.kind] || '');
      $('.kn-live-open', box).setAttribute('data-open', a.id);
      $('.kn-live-dots', box).innerHTML = list.map(function (_, j) { return '<i' + (j === i % list.length ? ' class="on"' : '') + '></i>'; }).join('');
      box.style.setProperty('--cc', a.c.c);
      stage.classList.remove('in'); void stage.offsetWidth; stage.classList.add('in');
      heroK = mount(stage, a);
    }
    function cycle() { clearInterval(timer); timer = setInterval(function () { if (!document.hidden && visible && !lv.classList.contains('is-open')) { i++; show(); } }, 9000); }
    $('.kn-live-next', box).addEventListener('click', function () { i++; show(); cycle(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (!visible && heroK) { heroK.stop(); heroK = null; }
        else if (visible && !heroK && !lv.classList.contains('is-open')) show();
      }, { rootMargin: '100px' }).observe(box);
    } else show();
    cycle();
  }

  /* ---------- lesson viewer ---------- */
  var lv = $('#lv'), cur = null, curK = null, lastFocus = null;
  function open(id) {
    var a = BY[id]; if (!a || !lv) return;
    var first = !lv.classList.contains('is-open');
    if (first) {
      lastFocus = document.activeElement;
      lv.classList.add('is-open'); lv.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('kn-lock');
      if (heroK) { heroK.stop(); heroK = null; }
      if (XR.quest) XR.quest('learn');
    }
    var dir = cur && a.i < cur.i ? -1 : 1;
    cur = a;
    lv.style.setProperty('--cc', a.c.c);
    $('.lv-seal', lv).textContent = a.c.jp;
    $('.lv-ch', lv).textContent = a.c.t;
    $('.lv-pos', lv).textContent = (a.i + 1) + ' / ' + ALL.length;
    $('.lv-prog i', lv).style.width = ((a.i + 1) / ALL.length * 100) + '%';
    $('.lv-no', lv).textContent = 'Lesson ' + num(a.i);
    $('#lvTitle').textContent = a.t;
    $('.lv-one', lv).textContent = a.one;
    $('.lv-body', lv).textContent = a.body;
    $('.lv-pts', lv).innerHTML = a.pts.map(function (p, i) { return '<li style="--i:' + i + '"><span>' + (i + 1) + '</span>' + esc(p) + '</li>'; }).join('');
    $('.lv-kind', lv).innerHTML = icon(KIC[a.kind] || 'play') + esc(KIND[a.kind] || 'Preview');
    var prev = ALL[a.i - 1], next = ALL[a.i + 1];
    var pb = $('.lv-prevb', lv), nb = $('.lv-nextb', lv);
    pb.disabled = !prev; $('span', pb).textContent = prev ? prev.t : 'Start';
    nb.disabled = !next; $('span', nb).textContent = next ? next.t : 'The end';
    paintLearn();
    var text = $('.lv-text', lv);
    text.style.setProperty('--dir', dir);
    text.classList.remove('in'); void text.offsetWidth; text.classList.add('in');
    text.scrollTop = 0;
    var stage = $('.lv-stage', lv);
    stage.classList.remove('in'); void stage.offsetWidth; stage.classList.add('in');
    if (curK) curK.stop();
    curK = mount(stage, a);
    try { history.replaceState(null, '', '#' + a.id); } catch (e) {}
    if (first) setTimeout(function () { var x = $('.lv-x', lv); if (x) x.focus({ preventScroll: true }); }, 60);
  }
  function paintLearn() {
    var on = !!learned[cur.id], b = $('.lv-learn', lv);
    b.classList.toggle('on', on);
    b.innerHTML = on ? icon('check') + 'Learned' : icon('star') + 'Mark as learned';
    $('.lv-next-go', lv).innerHTML = (ALL[cur.i + 1] ? 'Got it — next lesson' : 'Got it — finish') + icon('arrow-right');
  }
  function close() {
    if (!lv.classList.contains('is-open')) return;
    lv.classList.remove('is-open'); lv.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('kn-lock');
    if (curK) { curK.stop(); curK = null; }
    $('.lv-stage', lv).innerHTML = '';
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    var card = cur && $('.kn-card[data-id="' + cur.id + '"]');
    if (card && !card.hidden) { card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'nearest' }); }
    else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (!heroK) { var box = $('.kn-live'); if (box) { var r = box.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) $('.kn-live-next', box).click(); } }
  }
  function viewer() {
    if (!lv) return;
    lv.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
      else if (e.target.closest('.lv-prevb') && cur && ALL[cur.i - 1]) open(ALL[cur.i - 1].id);
      else if (e.target.closest('.lv-nextb') && cur && ALL[cur.i + 1]) open(ALL[cur.i + 1].id);
      else if (e.target.closest('.lv-learn')) { setLearned(cur.id, !learned[cur.id]); paintLearn(); }
      else if (e.target.closest('.lv-next-go')) { if (!learned[cur.id]) setLearned(cur.id, true); if (ALL[cur.i + 1]) open(ALL[cur.i + 1].id); else close(); }
      else if (e.target.closest('.lv-replay')) { if (curK) curK.stop(); var s = $('.lv-stage', lv); s.classList.remove('in'); void s.offsetWidth; s.classList.add('in'); curK = mount(s, cur); }
    });
    document.addEventListener('keydown', function (e) {
      if (!lv.classList.contains('is-open')) return;
      var typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || '');
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (!typing && e.key === 'ArrowRight' && ALL[cur.i + 1]) open(ALL[cur.i + 1].id);
      else if (!typing && e.key === 'ArrowLeft' && ALL[cur.i - 1]) open(ALL[cur.i - 1].id);
      else if (e.key === 'Tab') {
        var f = $$('button:not([disabled]), [href], input, textarea, [tabindex]:not([tabindex="-1"])', lv).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    /* swipe between lessons on the text column */
    var sx = null, sy = 0, text = $('.lv-text', lv);
    text.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    text.addEventListener('touchend', function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) { var n = ALL[cur.i + (dx < 0 ? 1 : -1)]; if (n) open(n.id); }
    }, { passive: true });
    var h = decodeURIComponent(location.hash.slice(1));
    if (BY[h]) setTimeout(function () { open(h); }, 200);
  }

  build();
  search();
  viewer();
  hero();
  window.XR_KN = { open: open, lessons: ALL };
})();
