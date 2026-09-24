/* =====================================================================
   XIRAIYA — The Lab: control deck
   Everything around the eleven live stages: the hero network and its
   chapter console, a chapter sidebar with progress, a window frame on
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
    ['telegram', 'telegram', 'send', 'Telegram Bots'], ['extension', 'extension', 'puzzle', 'Chrome Extensions'],
    ['minecraft', 'minecraft', 'cube', 'Minecraft Plugins'], ['desktop', 'desktop', 'window', 'Desktop EXE'],
    ['mobile', 'mobile', 'phone', 'Mobile APK'], ['ai-agent', 'agent', 'chip', 'AI Agents'],
    ['ai-chat', 'chat', 'chat', 'AI Chat'], ['ecommerce', 'ecommerce', 'bag', 'E-commerce'],
    ['crypto', 'crypto', 'btc', 'Crypto Payments']
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
      XR.toast('You tried all 11 demos. That is the whole Lab.');
    }
  }

  /* ---------- hero: a signal network behind the console ---------- */
  function heroNet() {
    var cv = $('.lh-net');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, nodes = [], pulses = [], on = true;
    var col = '196, 50, 29', line = '40, 28, 16';
    function colors() {
      var ink = root.getAttribute('data-mode') === 'ink';
      col = ink ? '240, 106, 82' : '196, 50, 29';
      line = ink ? '239, 228, 204' : '40, 28, 16';
    }
    function size() {
      var r = cv.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      var count = Math.round(Math.min(70, W * H / 16000));
      nodes = [];
      for (var i = 0; i < count; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 12, vy: (Math.random() - .5) * 12 });
    }
    colors(); size();
    new MutationObserver(colors).observe(root, { attributes: true, attributeFilter: ['data-mode'] });
    window.addEventListener('resize', size);
    var last = performance.now(), spawn = 0, running = false;
    function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(tick); }
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) start(); }).observe(cv);
    function tick(t) {
      if (!on) { running = false; return; }
      var dt = Math.min(.05, (t - last) / 1000); last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, d;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!XR.reduce) { a.x += a.vx * dt; a.y += a.vy * dt; }
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          a = nodes[i]; b = nodes[j]; d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 130) continue;
          ctx.strokeStyle = 'rgba(' + line + ',' + (.1 * (1 - d / 130)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      spawn -= dt;
      if (spawn <= 0 && !XR.reduce && nodes.length > 1) {
        spawn = .35;
        a = nodes[(Math.random() * nodes.length) | 0];
        var near = nodes.filter(function (n) { return n !== a && Math.hypot(n.x - a.x, n.y - a.y) < 130; });
        if (near.length) pulses.push({ a: a, b: near[(Math.random() * near.length) | 0], t: 0 });
      }
      ctx.fillStyle = 'rgba(' + col + ', .9)';
      pulses = pulses.filter(function (p) {
        p.t += dt * 1.4;
        var x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
        return p.t < 1;
      });
      for (i = 0; i < nodes.length; i++) {
        ctx.fillStyle = 'rgba(' + line + ', .22)';
        ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    start();
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
      '<div><b>Demos tried</b><small><span data-lab-done>0</span> of 11 · tap any demo</small></div></div>' +
      '<ol class="ls-list">' + CH.map(function (c) {
        return '<li><a href="#' + c.id + '" data-ch="' + c.id + '"><span class="ls-n">' + String(c.n).padStart(2, '0') + '</span>' + XR.icon(c.icon) + '<span class="ls-name">' + c.name + '</span><i class="ls-ok" aria-hidden="true">' + XR.icon('check') + '</i></a></li>';
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
      $('.combo-go').setAttribute('href', list.length ? 'hire.html?service=' + list.map(function (s) { return s.id; }).join(',') : 'hire.html');
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


  /* ---------- chapter dress: accent colour, giant number, stage plate, "try this" hints ---------- */
  var DRESS = {
    web: ['#c4321d', ['Switch between the demo sites', 'Change the device size', 'Scroll inside the preview']],
    automation: ['#2c6f65', ['Drag the workflow nodes', 'Press Run', 'Watch the log fill up']],
    telegram: ['#2f6fe0', ['Type /help', 'Tap Catalog and buy something', 'Watch the admin panel update']],
    extension: ['#b7862a', ['Toggle the popup switches', 'Change the highlight words', 'See the page change live']],
    minecraft: ['#4d7424', ['Click the world to start', 'Mine, craft and build', 'Type /kit in the chat']],
    desktop: ['#5f4f95', ['Run the EXE installer', 'Open the installed app', 'Drag the window around']],
    mobile: ['#a4473a', ['Tap the bottom tabs', 'Open a product', 'Scroll the feed']],
    'ai-agent': ['#5f4f95', ['Pick a preset goal', 'Switch tools on or off', 'Press Run and watch it work']],
    'ai-chat': ['#c4321d', ['Ask about delivery time', 'Switch to বাংলা', 'Change the widget colour']],
    ecommerce: ['#b7862a', ['Watch orders arrive', 'Follow the autopilot feed', 'See restocks happen on their own']],
    crypto: ['#d9a441', ['Pick a coin', 'Press Simulate payment', 'Read the webhook log']]
  };
  function dress() {
    CH.forEach(function (c) {
      var sec = doc.getElementById(c.id), d = DRESS[c.id];
      if (!sec || !d) return;
      sec.style.setProperty('--ac', d[0]);
      var info = $('.lab-info', sec);
      if (info && !$('.lab-bignum', info)) info.insertAdjacentHTML('afterbegin', '<span class="lab-bignum" aria-hidden="true">' + String(c.n).padStart(2, '0') + '</span>');
      var feats = $('.lab-feats', sec);
      if (feats) feats.classList.add('lab-feats-grid');
      var win = $('.lab-win', sec);
      if (win && !$('.lab-tips', win)) {
        win.insertAdjacentHTML('beforeend', '<div class="lab-tips"><span>' + XR.icon('cursor') + 'Try this</span>' +
          d[1].map(function (t, i) { return '<em><b>' + (i + 1) + '</b>' + XR.esc(t) + '</em>'; }).join('') + '</div>');
        win.insertAdjacentHTML('afterbegin', '<i class="lab-plate" aria-hidden="true"></i>');
      }
    });
  }

  doc.addEventListener('DOMContentLoaded', function () {
    buildWindows();
    dress();
    buildShell();
    heroNet();
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
