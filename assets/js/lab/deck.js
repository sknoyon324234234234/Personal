/* =====================================================================
   XIRAIYA — The Lab: control deck
   Everything around the ten live stages: the contents page in the
   hero, a chapter sidebar with progress, a window frame on
   every stage with a fullscreen focus mode, J/K/F shortcuts, and the
   "build your combo" price calculator at the end. The stages themselves
   stay untouched in their own files.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, doc = document, root = doc.documentElement;
  var CH = [
    ['web', 'web', 'globe', 'Websites'], ['automation', 'automation', 'flow', 'Automation'],
    ['extension', 'extension', 'puzzle', 'Chrome Extensions'], ['minecraft', 'minecraft', 'cube', 'Minecraft Plugins'],
    ['desktop', 'desktop', 'window', 'Desktop EXE'], ['mobile', 'mobile', 'phone', 'Mobile APK'],
    ['ai-chat', 'chat', 'chat', 'AI Chat'], ['makeover', 'makeover', 'wand', 'Site Makeovers'],
    ['scroll', 'scroll', 'book', 'The Project Scroll'], ['wishes', 'wishes', 'pen', 'The Wish Wall']
  ].map(function (c, i) { return { id: c[0], stage: c[1], icon: c[2], name: c[3], n: i + 1 }; });
  var wide = window.matchMedia('(min-width: 1180px)');

  /* ---------- progress: reuses the site's quest log (stage-<name>) ---------- */
  function tried() {
    var st = XR.store('xr-quests') || {};
    return CH.filter(function (c) { return st['stage-' + c.stage]; }).map(function (c) { return c.id; });
  }
  var celebrated = false;
  function paintProgress() {
    var done = tried(), n = done.length;
    $$('[data-lab-done]').forEach(function (e) { e.textContent = n; });
    $$('[data-ch]').forEach(function (a) { a.classList.toggle('is-done', done.indexOf(a.getAttribute('data-ch')) > -1); });
    $$('.lab-win').forEach(function (w) { w.classList.toggle('is-done', done.indexOf(w.getAttribute('data-win')) > -1); });
    var ring = $('.ls-ring');
    if (ring) ring.style.setProperty('--p', (n / CH.length).toFixed(3));
    if (n === CH.length && !celebrated && XR.store('xr-lab-all') !== 1) {
      celebrated = true;
      XR.store('xr-lab-all', 1);
      XR.toast('You tried all ' + CH.length + ' demos. That is the whole Lab.');
    }
  }

  /* ---------- sidebar (wide screens) ---------- */
  function buildShell() {
    var secs = CH.map(function (c) { return doc.getElementById(c.id); }).filter(Boolean);
    if (!secs.length) return;
    var shell = doc.createElement('div');
    shell.className = 'lab-shell';
    var side = doc.createElement('aside');
    side.className = 'lab-side';
    side.setAttribute('aria-label', 'Lab chapters');
    side.innerHTML =
      '<div class="ls-head"><div class="ls-ring" aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19"/><circle class="ls-arc" cx="22" cy="22" r="19" pathLength="100"/></svg><b data-lab-done>0</b></div>' +
      '<div><b>Demos tried</b><small><span data-lab-done>0</span> of ' + CH.length + ' · tap any demo</small></div></div>' +
      '<ol class="ls-list">' + CH.map(function (c) {
        return '<li><a href="#' + c.id + '" data-ch="' + c.id + '"><span class="ls-n">' + String(c.n).padStart(2, '0') + '</span><span class="ls-name">' + c.name + '</span><i class="ls-ok" aria-hidden="true">' + XR.icon('check') + '</i></a></li>';
      }).join('') + '</ol>' +
      '<div class="ls-acts"><button type="button" class="ls-focus">' + XR.icon('fullscreen') + '<span>Focus this demo</span><kbd>F</kbd></button>' +
      '<button type="button" class="ls-next">' + XR.icon('arrow-right') + '<span>Next demo</span><kbd>J</kbd></button></div>';
    secs[0].parentNode.insertBefore(shell, secs[0]);
    shell.appendChild(side);
    var mainCol = doc.createElement('div');
    mainCol.className = 'lab-main';
    shell.appendChild(mainCol);
    secs.forEach(function (s) { mainCol.appendChild(s); });
    $('.ls-focus', side).addEventListener('click', function () { var c = currentCh(); if (c) focus(c.id); });
    $('.ls-next', side).addEventListener('click', function () { go(1); });
  }

  /* ---------- window frame + focus mode around each stage ---------- */
  var focused = null, backdrop = null, restore = null;
  function buildWindows() {
    CH.forEach(function (c) {
      var sec = doc.getElementById(c.id), st = sec && $('[data-stage]', sec);
      if (!st) return;
      var win = doc.createElement('div');
      win.className = 'lab-win';
      win.setAttribute('data-win', c.id);
      win.innerHTML = '<div class="lw-bar"><span class="lh-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="lw-title">' + XR.icon(c.icon) + c.name + '<em>live</em></span>' +
        '<span class="lw-done">' + XR.icon('check') + 'Tried</span>' +
        '<button type="button" class="lw-btn lw-focus" aria-label="Open ' + c.name + ' in focus mode">' + XR.icon('fullscreen') + '<span>Focus</span></button>' +
        '<button type="button" class="lw-btn lw-close" aria-label="Close focus mode">' + XR.icon('close') + '<span>Close</span></button></div>';
      st.parentNode.insertBefore(win, st);
      win.appendChild(st);
      $('.lw-focus', win).addEventListener('click', function () { focus(c.id); });
      $('.lw-close', win).addEventListener('click', unfocus);
    });
  }
  function focus(id) {
    var win = $('.lab-win[data-win="' + id + '"]');
    if (!win || focused === win) return;
    if (focused) unfocus();
    restore = doc.activeElement;
    backdrop = doc.createElement('div');
    backdrop.className = 'lw-backdrop';
    backdrop.addEventListener('click', unfocus);
    doc.body.appendChild(backdrop);
    win.classList.add('is-focus');
    root.classList.add('lab-focusing');
    focused = win;
    $('.lw-close', win).focus({ preventScroll: true });
    window.dispatchEvent(new Event('resize'));
  }
  function unfocus() {
    if (!focused) return;
    focused.classList.remove('is-focus');
    root.classList.remove('lab-focusing');
    if (backdrop) backdrop.remove();
    var was = focused;
    focused = backdrop = null;
    window.dispatchEvent(new Event('resize'));
    if (restore && restore.focus) restore.focus({ preventScroll: true });
    else $('.lw-focus', was).focus({ preventScroll: true });
  }

  /* ---------- chapter navigation ---------- */
  function currentCh() {
    var mid = innerHeight * .4, cur = CH[0];
    CH.forEach(function (c) { var s = doc.getElementById(c.id); if (s && s.getBoundingClientRect().top <= mid) cur = c; });
    return cur;
  }
  function jump(id) {
    var s = doc.getElementById(id);
    if (!s) return;
    if (doc.body.classList.contains('lab-one')) { location.hash = id; return; }
    s.scrollIntoView({ behavior: XR.reduce ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignore */ }
  }
  function go(step) {
    var i = CH.indexOf(currentCh());
    var first = doc.getElementById(CH[0].id);
    if (step > 0 && first && first.getBoundingClientRect().top > innerHeight * .4) i = -1;
    jump(CH[Math.max(0, Math.min(CH.length - 1, i + step))].id);
  }
  function spySide() {
    var cur = currentCh(), first = doc.getElementById(CH[0].id);
    var started = first && first.getBoundingClientRect().top <= innerHeight * .4;
    $$('.ls-list a').forEach(function (a) { a.classList.toggle('is-on', started && a.getAttribute('data-ch') === cur.id); });
  }

  function keys(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && focused) { unfocus(); return; }
    var t = e.target;
    if (t && (t.closest('input, textarea, select, [contenteditable], [data-stage]') || (focused && focused.contains(t)))) return;
    if (root.classList.contains('menu-open') || $('.palette.is-open, .modal.is-open')) return;
    var k = e.key.toLowerCase();
    if (k === 'j') { e.preventDefault(); go(1); }
    else if (k === 'k') { e.preventDefault(); go(-1); }
    else if (k === 'f') { e.preventDefault(); focus(currentCh().id); }
  }

  /* ---------- build your combo ---------- */
  function combo() {
    var box = $('.combo-picks');
    if (!box) return;
    var S = XR.services || [], picked = [];
    box.innerHTML = S.map(function (s) {
      return '<button type="button" class="cp" aria-pressed="false" data-svc="' + s.id + '">' + XR.icon(s.icon) +
        '<span><b>' + XR.esc(s.name) + '</b><small>from ' + XR.fmtPrice(s.priceFrom) + ' · ' + XR.esc(s.days) + ' days</small></span><i aria-hidden="true">' + XR.icon('check') + '</i></button>';
    }).join('');
    function days(r) { var m = String(r).split(/[–-]/); return [parseInt(m[0], 10) || 0, parseInt(m[1] || m[0], 10) || 0]; }
    function paint() {
      var list = S.filter(function (s) { return picked.indexOf(s.id) > -1; });
      var sum = list.reduce(function (a, s) { return a + s.priceFrom; }, 0);
      /* systems are built side by side: the longest one sets the pace, each extra adds a little */
      var lo = 0, hi = 0;
      list.forEach(function (s) { var d = days(s.days); lo = Math.max(lo, d[0]); hi = Math.max(hi, d[1]); });
      hi = Math.round(hi * (1 + .2 * Math.max(0, list.length - 1)));
      $('.combo-total').textContent = XR.fmtPrice(sum);
      $('.combo-meta').textContent = list.length ? list.length + (list.length === 1 ? ' system' : ' systems') + ' · about ' + lo + '–' + Math.max(lo, hi) + ' days' + (list.length > 1 ? ', built in parallel' : '') : 'Pick at least one system';
      $('.combo-list').innerHTML = list.map(function (s) { return '<li><span>' + XR.esc(s.name) + '</span><b>' + XR.fmtPrice(s.priceFrom) + '</b></li>'; }).join('');
      $('.combo-go').setAttribute('href', list.length ? 'hire?service=' + list.map(function (s) { return s.id; }).join(',') : 'hire');
      $('.combo-sum').classList.toggle('is-empty', !list.length);
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.cp');
      if (!b) return;
      var id = b.getAttribute('data-svc'), i = picked.indexOf(id);
      if (i > -1) picked.splice(i, 1); else picked.push(id);
      b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true');
      paint();
    });
    paint();
  }


  /* ---------- chapter dress: accent colour and a margin note under each stage ---------- */
  var DRESS = {
    web: ['#c4321d', 'pick a panel on the screen, then switch the preview to phone size.'],
    automation: ['#2c6f65', 'flip the Email lever off, turn the crank and read the paper tape.'],
    extension: ['#b7862a', 'press 光 and 訳 together, then change the words to highlight.'],
    minecraft: ['#4d7424', 'raise the 経 and 店 banners, type /kit, then hang a lantern.'],
    desktop: ['#5f4f95', 'push the glowing panel, install, then take the update the app offers.'],
    mobile: ['#a4473a', 'book tonight’s class, flip the membership card, then log a training day.'],
    'ai-chat': ['#c4321d', 'ask to track order 4821, switch to বাংলা, then ask for a human.'],
    makeover: ['#2c6f65', 'drag the red seal all the way across, then switch to another shop.'],
    scroll: ['#c4321d', 'drag the paper sideways and watch each seal stamp itself as you pass.'],
    wishes: ['#b7862a', 'turn a plaque over, then write your own wish and hang it on the rack.']
  };
  var ARROW = '<svg class="arr" viewBox="0 0 44 34" aria-hidden="true"><path d="M4 31c9-2 19-9 25-24"/><path d="M22 10l7-4 3 8"/></svg>';
  function tiers() {
    CH.forEach(function (c) {
      var sec = doc.getElementById(c.id), s = (XR.services || []).filter(function (x) { return x.id === c.id; })[0], pr = sec && $('.lab-price', sec);
      if (!s || !s.tiers || !pr || $('.lab-tiers', sec)) return;
      pr.insertAdjacentHTML('afterend', '<ul class="lab-tiers">' + s.tiers.map(function (t) { return '<li><span>' + XR.esc(t[0]) + '</span><i></i><b>' + (t[1] === t[2] ? XR.fmtPrice(t[1]) : XR.fmtPrice(t[1]) + '–' + t[2]) + '</b></li>'; }).join('') + '</ul>');
    });
  }
  function dress() {
    CH.forEach(function (c) {
      var sec = doc.getElementById(c.id), d = DRESS[c.id];
      if (!sec || !d) return;
      sec.style.setProperty('--ac', d[0]);
      var win = $('.lab-win', sec);
      if (win && !$('.lab-note', win)) win.insertAdjacentHTML('beforeend', '<p class="lab-note">' + ARROW + '<span><b>Try it:</b> ' + XR.esc(d[1]) + '</span></p>');
    });
  }

  doc.addEventListener('DOMContentLoaded', function () {
    buildWindows();
    dress();
    tiers();
    buildShell();
    combo();
    paintProgress();
    var rnd = $('[data-lab-random]');
    if (rnd) rnd.addEventListener('click', function () {
      var left = CH.filter(function (c) { return tried().indexOf(c.id) < 0; });
      var pool = left.length ? left : CH;
      jump(pool[(Math.random() * pool.length) | 0].id);
    });
    doc.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('[data-stage]')) setTimeout(paintProgress, 60); }, true);
    doc.addEventListener('keydown', keys);
    var ticking = false;
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spySide(); }); } }, { passive: true });
    spySide();
    if (wide.addEventListener) wide.addEventListener('change', spySide);
  });
})();
