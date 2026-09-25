/* XIRAIYA — manga sections: the chapter reader and the boss battle */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$;

  /* comic reader: three chapters, panel-by-panel reveal, typed bubbles,
     scroll-driven camera, chapter tabs with a page turn */
  var reader = $('.mg-reader');
  if (reader) initReader(reader);

  function initReader(root) {
    var RM = XR.reduce;
    var pages = $$('.mg-page', root), tabs = $$('.mg-tab', root), tabsWrap = $('.mg-tabs', root);
    var book = $('.mg-book', root), brush = $('.mg-brush', root);
    var countB = $('.mg-count b', root), countT = $('.mg-count', root), track = $('.mg-track i', root);
    var prevB = $('[data-go="-1"]', root), nextB = $('[data-go="1"]', root), endP = $('.mg-end', root);
    var names = tabs.map(function (t) { return $('b', t).textContent; });
    var cur = 0, turning = false, onScreen = [], ticking = false, lastCount = -1;
    if (!pages.length || pages.length !== tabs.length) return;

    root.classList.add('mg-live');
    pages.forEach(function (p, i) { p.hidden = i !== cur; });
    $$('.mg-dash', root).forEach(function (d) { d.innerHTML = speedSVG(); });
    $$('.mg-b', root).forEach(prepBubble);

    /* ---- speech bubbles: keep the full text for screen readers, type the
       visible copy (the untyped rest is reserved but invisible, so the
       bubble never changes size while it types) ---- */
    function prepBubble(b) {
      var text = b.textContent.trim();
      b.textContent = '';
      var sr = document.createElement('span'); sr.className = 'sr-only-mg'; sr.textContent = text;
      var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
      vis.innerHTML = '<span class="ty-s"></span><span class="ty-h"></span>';
      b.appendChild(sr); b.appendChild(vis);
      b._t = text; b._s = vis.firstChild; b._h = vis.lastChild;
      b._h.textContent = text;
    }
    function typeBubble(b, delay) {
      if (b._done) return 0;
      b._done = true;
      var t = b._t, i = 0;
      if (RM) { b._s.textContent = t; b._h.textContent = ''; b.classList.add('pop'); return 0; }
      /* time-based, so a busy main thread skips letters instead of slowing down */
      var per = t.length > 50 ? 18 : 26, pauses = 0;
      setTimeout(function () {
        b.classList.add('pop', 'typing');
        var t0 = performance.now() + 200;
        (function step(now) {
          var n = Math.max(0, Math.min(t.length, Math.floor((now - t0 - pauses) / per)));
          if (n > i) {
            var c = t.charAt(n - 1);
            i = n; b._s.textContent = t.slice(0, i); b._h.textContent = t.slice(i);
            if (/[.!?…,]/.test(c) && i < t.length && t.charAt(i) === ' ') pauses += c === ',' ? 90 : 170;
          }
          if (i >= t.length) { setTimeout(function () { b.classList.remove('typing'); }, 500); return; }
          requestAnimationFrame(step);
        })(performance.now());
      }, delay);
      return delay + 400 + t.length * per;
    }

    /* ---- panel reveal ---- */
    function reveal(list) {
      list.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
      list.forEach(function (p, i) {
        var d = RM ? 0 : i * 0.14;
        p.style.setProperty('--d', d + 's');
        p.classList.add('in');
        var at = d * 1000 + 820;
        $$('.mg-b', p).forEach(function (b) { at = typeBubble(b, at) + 180; });
      });
      progress();
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        var list = [];
        en.forEach(function (e) { if (e.isIntersecting && !e.target.classList.contains('in')) { list.push(e.target); io.unobserve(e.target); } });
        if (list.length) reveal(list);
      }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' });
      var seen = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          var p = e.target, i = onScreen.indexOf(p);
          p.classList.toggle('on', e.isIntersecting);
          if (e.isIntersecting && i < 0) onScreen.push(p);
          if (!e.isIntersecting && i > -1) onScreen.splice(i, 1);
        });
        if (onScreen.length) kick();
      }, { rootMargin: '60px 0px' });
      var heads = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { e.target.parentNode.classList.add('head-in'); heads.unobserve(e.target); } });
      }, { threshold: 0.5 });
      $$('.mg-p', root).forEach(function (p) { io.observe(p); seen.observe(p); });
      $$('.mg-head', root).forEach(function (h) { heads.observe(h); });
    } else {
      reveal($$('.mg-p', root));
      pages.forEach(function (p) { p.classList.add('head-in'); });
    }

    /* ---- camera: each panel pans or zooms with its scroll position.
       Only panels on screen are measured, and only on frames after a scroll. ---- */
    var CAM = {
      push: function (k) { return [0, 2 - k * 4, 1.03 + k * 0.1]; },
      zoom: function (k) { return [0, 0, 1 + k * 0.12]; },
      pan: function (k) { return [4 - k * 8, 0, 1.1]; },
      'pan-r': function (k) { return [-4 + k * 8, 0, 1.1]; }
    };
    function camera() {
      ticking = false;
      if (RM) return;
      var vh = window.innerHeight, reads = onScreen.map(function (p) {
        var r = p.getBoundingClientRect();
        return [p, Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)))];
      });
      reads.forEach(function (x) {
        var f = CAM[x[0].getAttribute('data-cam')], art = x[0]._art || (x[0]._art = $('.mg-art', x[0]));
        if (!f || !art) return;
        var v = f(x[1]);
        art.style.transform = 'translate3d(' + v[0].toFixed(2) + '%,' + v[1].toFixed(2) + '%,0) scale(' + v[2].toFixed(4) + ')';
      });
    }
    function kick() { if (!ticking && onScreen.length && !RM) { ticking = true; requestAnimationFrame(camera); } }
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });

    /* ---- progress: per chapter on the tabs, current chapter in the meta ---- */
    function progress() {
      pages.forEach(function (pg, i) {
        var all = $$('.mg-p', pg), done = all.filter(function (p) { return p.classList.contains('in'); }).length;
        tabs[i].style.setProperty('--p', all.length ? done / all.length : 0);
        tabs[i].classList.toggle('done', done === all.length);
        if (i === cur) {
          if (track) track.style.setProperty('--p', all.length ? done / all.length : 0);
          if (countT) {
            countB.textContent = (done < 10 ? '0' : '') + done;
            countT.lastChild.textContent = ' / ' + (all.length < 10 ? '0' : '') + all.length;
            if (done !== lastCount && lastCount > -1 && !RM) { countB.classList.remove('tick'); void countB.offsetWidth; countB.classList.add('tick'); }
            lastCount = done;
          }
        }
      });
    }

    /* ---- chapter switching with a page turn ---- */
    function setNav() {
      var last = pages.length - 1;
      prevB.hidden = cur === 0;
      nextB.hidden = cur === last;
      if (cur < last) $('b', nextB).textContent = names[cur + 1];
      endP.hidden = cur !== last;
      tabs.forEach(function (t, i) { t.setAttribute('aria-selected', i === cur ? 'true' : 'false'); t.tabIndex = i === cur ? 0 : -1; });
      tabsWrap.style.setProperty('--i', cur);
    }
    function go(n) {
      if (n < 0 || n >= pages.length || n === cur || turning) return;
      var dir = n > cur ? 1 : -1, old = pages[cur], nw = pages[n];
      var top = root.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.pageYOffset + top - 96, behavior: RM ? 'auto' : 'smooth' });
      lastCount = -1;
      if (RM) { old.hidden = true; nw.hidden = false; cur = n; setNav(); progress(); return; }
      turning = true;
      tabsWrap.style.setProperty('--i', n);
      book.style.minHeight = book.offsetHeight + 'px';
      old.style.setProperty('--dir', dir); old.classList.add('turn-out');
      brush.classList.remove('go', 'back'); void brush.offsetWidth;
      brush.classList.toggle('back', dir < 0); brush.classList.add('go');
      setTimeout(function () {
        old.hidden = true; old.classList.remove('turn-out');
        nw.style.setProperty('--dir', dir); nw.hidden = false; nw.classList.add('turn-in');
        cur = n; setNav(); progress(); kick();
        setTimeout(function () { nw.classList.remove('turn-in'); book.style.minHeight = ''; turning = false; }, 720);
      }, 420);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { go(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = k === 'ArrowRight' ? cur + 1 : k === 'ArrowLeft' ? cur - 1 : k === 'Home' ? 0 : k === 'End' ? pages.length - 1 : null;
        if (n === null) return;
        e.preventDefault(); n = Math.max(0, Math.min(pages.length - 1, n));
        tabs[n].focus(); go(n);
      });
    });
    prevB.addEventListener('click', function () { go(cur - 1); });
    nextB.addEventListener('click', function () { go(cur + 1); });
    setNav(); progress();
  }

  function speedSVG() {
    var s = '', i, y, x, w;
    for (i = 0; i < 18; i++) {
      y = (i * 5.6 + Math.random() * 3).toFixed(1); x = Math.random() * 150; w = 24 + Math.random() * 50;
      s += '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height=".6"/><rect x="' + (x + 200).toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height=".6"/>';
    }
    return '<svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g fill="#f4ead6">' + s + '</g></svg>';
  }

  /* boss battle */
  var arena = $('.bt-arena'); if (!arena) return;
  var fx = $('.bt-fx', arena), log = $('.bt-log'), me = { hp: 100, max: 100 }, boss = { hp: 120, max: 120 };
  var cd = { toad: 0, heal: 0 }, charge = 0, busy = false, over = false;
  var BOSS = [['Scope creep', 'シュッ', 10, 16], ['"Quick change" at 4:59 PM', 'ガッ', 12, 18], ['Friday deploy panic', 'ドドド', 14, 20], ['Client went quiet', 'シーン', 6, 12]];
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function paint() {
    [['me', me], ['boss', boss]].forEach(function (x) {
      var i = $('[data-hp="' + x[0] + '"]'), p = Math.max(0, x[1].hp) / x[1].max;
      i.style.width = p * 100 + '%'; i.classList.toggle('low', x[0] === 'me' && p < .35);
      $('[data-hpt="' + x[0] + '"]').textContent = Math.max(0, x[1].hp) + ' / ' + x[1].max;
    });
    $$('.bt-move').forEach(function (b) {
      var m = b.getAttribute('data-move');
      b.disabled = busy || over || (m === 'ship' ? charge < 3 : cd[m] > 0);
      if (cd[m] > 0) b.querySelector('small').textContent = 'Resting · ' + cd[m] + ' turn' + (cd[m] > 1 ? 's' : '');
      else if (m === 'toad') b.querySelector('small').textContent = '34–44 damage · rests 2 turns';
      else if (m === 'heal') b.querySelector('small').textContent = '+30 HP · rests 2 turns';
    });
    $('[data-charge]').textContent = charge;
  }
  function pop(text, side, cls, r) {
    var el = document.createElement('span');
    el.className = 'bt-pop' + (cls ? ' ' + cls : '');
    el.textContent = text;
    el.style.left = (side === 'boss' ? 62 + Math.random() * 14 : 8 + Math.random() * 14) + '%';
    el.style.top = (18 + Math.random() * 26) + '%';
    el.style.setProperty('--r', (r || (Math.random() * 20 - 10)) + 'deg');
    fx.appendChild(el); setTimeout(function () { el.remove(); }, 1200);
  }
  function hit(side, big) {
    var s = $('.bt-side.' + (side === 'boss' ? 'boss' : 'me'));
    s.classList.remove('hit'); void s.offsetWidth; s.classList.add('hit');
    if (big && !XR.reduce) { arena.classList.remove('shake'); void arena.offsetWidth; arena.classList.add('shake'); var f = document.createElement('i'); f.className = 'bt-flash'; fx.appendChild(f); setTimeout(function () { f.remove(); }, 400); }
  }
  function act(side) { var s = $('.bt-side.' + side); s.classList.remove('act'); void s.offsetWidth; s.classList.add('act'); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, XR.reduce ? 60 : ms); }); }
  function end(win) {
    over = true; paint();
    var box = document.createElement('div'); box.className = 'bt-win';
    box.innerHTML = win
      ? '<b>DEADLINE<br>DEFEATED</b><p>Shipped on Thursday with a day to spare. That is how it goes with a real project too.</p><div><a class="btn btn-primary" href="hire.html">Beat my deadline</a><button type="button" class="btn btn-ghost" data-again>Play again</button></div>'
      : '<b>TO BE<br>CONTINUED…</b><p>Even sages need a second try. Deadlines are easier with a plan.</p><div><button type="button" class="btn btn-primary" data-again>Try again</button><a class="btn btn-ghost" href="hire.html">Get a plan</a></div>';
    arena.appendChild(box);
    log.textContent = win ? 'The Deadline falls. The toad does a small victory hop.' : 'The Deadline wins this round.';
    if (win && XR.quest) try { XR.quest('battle'); } catch (e) { /* ignore */ }
  }
  function reset() { me.hp = 100; boss.hp = 120; cd = { toad: 0, heal: 0 }; charge = 0; over = false; busy = false; var w = $('.bt-win', arena); if (w) w.remove(); log.textContent = 'The Deadline is back. It always comes back.'; paint(); }
  async function turn(m) {
    if (busy || over) return; busy = true; paint();
    act('me'); await wait(220);
    if (m === 'code') { var d = rnd(18, 26); boss.hp -= d; pop('カタカタ', 'boss'); pop('−' + d, 'boss', 'dmg'); hit('boss'); log.textContent = 'Code sprint! ' + d + ' damage.'; charge = Math.min(3, charge + 1); }
    if (m === 'toad') { var t = rnd(34, 44); boss.hp -= t; pop('ドン!', 'boss', '', -12); pop('−' + t, 'boss', 'dmg'); hit('boss', true); log.textContent = 'Summoning jutsu! The toad lands for ' + t + ' damage.'; cd.toad = 3; charge = Math.min(3, charge + 1); }
    if (m === 'heal') { var h = Math.min(30, me.max - me.hp); me.hp += h; pop('+' + h, 'hero', 'heal'); pop('癒', 'hero'); log.textContent = 'Xiri patches you up. +' + h + ' HP.'; cd.heal = 3; }
    if (m === 'ship') { var u = rnd(55, 70); boss.hp -= u; pop('螺旋!', 'boss', '', 8); pop('−' + u, 'boss', 'dmg'); hit('boss', true); log.textContent = 'RASEN-DEPLOY! Straight to production. ' + u + ' damage.'; charge = 0; }
    paint();
    if (boss.hp <= 0) { await wait(500); end(true); return; }
    await wait(900);
    var b = BOSS[(Math.random() * BOSS.length) | 0], bd = rnd(b[2], b[3]);
    act('boss'); await wait(200);
    me.hp -= bd; pop(b[1], 'hero'); pop('−' + bd, 'hero', 'dmg'); hit('hero', bd > 16);
    log.textContent = 'The Deadline uses ' + b[0] + '. You take ' + bd + ' damage.';
    Object.keys(cd).forEach(function (k) { if (cd[k] > 0) cd[k]--; });
    busy = false; paint();
    if (me.hp <= 0) { await wait(400); end(false); }
  }
  $$('.bt-move').forEach(function (b) { b.addEventListener('click', function () { turn(b.getAttribute('data-move')); }); });
  arena.addEventListener('click', function (e) { if (e.target.closest('[data-again]')) reset(); });
  paint();
})();
