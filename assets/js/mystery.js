/* =====================================================================
   XIRAIYA — The Lost Scroll: a treasure hunt across the whole site.
   Eight seal fragments are hidden on different pages. A compass opens a
   parchment map with riddles; finding all eight unrolls the scroll and
   unlocks Sage Mode. Progress lives in this browser only.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, esc = XR.esc, KEY = 'xr-hunt';
  var SEALS = [
    { id: 'home-1', page: 'home', k: '闇', name: 'The dark room', href: 'index.html#mystery', riddle: 'Where the lantern reaches last, something glints.', x: 12, y: 70 },
    { id: 'home-2', page: 'home', k: '扉', name: 'The sealed door', href: 'index.html#mystery', riddle: 'Behind three seals: storm, flame and moon.', x: 25, y: 38 },
    { id: 'lab', page: 'lab', k: '貨', name: 'The Lab · Crypto', href: 'showcase.html#crypto', sel: '#crypto .lab-info', riddle: 'Eleven systems stand in a row. The last one pays in coins.', x: 40, y: 62 },
    { id: 'kit', page: 'kit', k: '動', name: 'UI Kit · Motion', href: 'components.html#motion', sel: '#motion .kx-head', riddle: 'Where easing can be felt, look above the curve.', x: 52, y: 26 },
    { id: 'shop', page: 'shop', k: '店', name: 'Shop · the last word', href: 'shop.html', sel: '.shop-cta .section-head', riddle: 'After twelve stores, someone asks: want one like this?', x: 63, y: 70 },
    { id: 'demos', page: 'demos', k: '演', name: 'Demo sites · Built right', href: 'demos.html', sel: '.dm-inc .section-head', riddle: 'Not just pretty. Look where it is built right.', x: 72, y: 40 },
    { id: 'world', page: 'world', k: '里', name: 'Dev World · Git tower', href: 'dev-world.html#git', sel: '#git .section-head, #git h2', riddle: 'In the village, the tower remembers every commit.', x: 83, y: 66 },
    { id: 'hire', page: 'hire', k: '約', name: 'Hire · Payments', href: 'hire.html', sel: '#pay-t', riddle: 'The last seal waits where you choose how to pay.', x: 90, y: 24 }
  ];
  function st() { var s = XR.store(KEY) || {}; s.found = s.found || []; return s; }
  function save(s) { XR.store(KEY, s); }
  var S = st(), page = document.body.getAttribute('data-page');
  function has(id) { return S.found.indexOf(id) > -1; }

  /* ---------- sage mode reward ---------- */
  function sage(on) { document.documentElement.classList.toggle('sage-mode', !!on); }
  sage(S.sage);

  /* ---------- compass HUD ---------- */
  var hud = document.createElement('button');
  hud.type = 'button'; hud.className = 'ms-hud'; hud.setAttribute('aria-label', 'Open the treasure map');
  hud.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2"/><path class="ms-needle" d="M20 6l4 14-4 14-4-14z" fill="currentColor"/><path d="M20 6l4 14h-8z" fill="#c4321d"/></svg><b class="ms-count"></b>';
  document.body.appendChild(hud);
  function paintHud() {
    hud.hidden = !(S.started || S.found.length);
    $('.ms-count', hud).textContent = S.found.length + '/' + SEALS.length;
    hud.classList.toggle('done', S.found.length === SEALS.length);
  }
  paintHud();
  hud.addEventListener('click', function () { openMap(); });

  /* ---------- the fragments ---------- */
  function fragBtn(seal) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ms-frag'; b.setAttribute('data-frag', seal.id);
    b.setAttribute('aria-label', 'A hidden seal fragment');
    b.innerHTML = '<i>' + seal.k + '</i>';
    return b;
  }
  function collect(id, btn) {
    if (has(id)) return;
    var seal = SEALS.find(function (x) { return x.id === id; });
    S.found.push(id); S.started = true; save(S);
    if (btn) {
      var r = btn.getBoundingClientRect(), h = hud.getBoundingClientRect(), fly = btn.cloneNode(true);
      fly.className = 'ms-frag ms-fly'; fly.style.left = r.left + 'px'; fly.style.top = r.top + 'px';
      document.body.appendChild(fly);
      paintHud();
      var h2 = hud.getBoundingClientRect();
      requestAnimationFrame(function () { fly.style.transform = 'translate(' + (h2.left - r.left) + 'px,' + (h2.top - r.top) + 'px) scale(.4) rotate(540deg)'; fly.style.opacity = '.2'; });
      setTimeout(function () { fly.remove(); hud.classList.remove('pulse'); void hud.offsetWidth; hud.classList.add('pulse'); }, 900);
      btn.classList.add('got'); setTimeout(function () { btn.remove(); }, 500);
      void h;
    }
    paintHud();
    burst(btn);
    XR.toast('Seal found: ' + seal.k + ' · ' + S.found.length + ' of ' + SEALS.length);
    if (S.found.length === SEALS.length) setTimeout(finale, 1200);
  }
  function burst(el) {
    if (!el || XR.reduce) return;
    var r = el.getBoundingClientRect(), b = document.createElement('div');
    b.className = 'ms-burst'; b.style.left = r.left + r.width / 2 + 'px'; b.style.top = r.top + r.height / 2 + 'px';
    b.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><span>封印</span>';
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 1000);
  }
  document.addEventListener('click', function (e) { var f = e.target.closest && e.target.closest('.ms-frag:not(.ms-fly)'); if (f) { e.preventDefault(); e.stopPropagation(); collect(f.getAttribute('data-frag'), f); } }, true);

  function plant() {
    SEALS.forEach(function (seal) {
      if (seal.page !== page || has(seal.id) || !seal.sel) return;
      var t = $(seal.sel); if (!t) return;
      if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
      var b = fragBtn(seal); b.classList.add('ms-planted'); t.appendChild(b);
    });
    $$('[data-frag-slot]').forEach(function (slot) {
      var id = slot.getAttribute('data-frag-slot');
      if (!has(id)) slot.appendChild(fragBtn(SEALS.find(function (x) { return x.id === id; })));
    });
  }
  plant();

  /* ---------- the map ---------- */
  var map;
  function openMap() {
    if (!map) {
      map = document.createElement('div');
      map.className = 'ms-map'; map.setAttribute('role', 'dialog'); map.setAttribute('aria-modal', 'true'); map.setAttribute('aria-label', 'Treasure map');
      document.body.appendChild(map);
      map.addEventListener('click', function (e) {
        if (e.target === map || e.target.closest('[data-close]')) closeMap();
        var n = e.target.closest('.mm-node'); if (n) { $$('.mm-node', map).forEach(function (x) { x.classList.toggle('on', x === n); }); var s = SEALS[+n.getAttribute('data-i')]; $('.mm-note', map).innerHTML = noteFor(s); }
        if (e.target.closest('[data-sage]')) { S.sage = !S.sage; save(S); sage(S.sage); drawMap(); }
        if (e.target.closest('[data-reset]')) { if (confirm('Start the hunt again? Your seals will be lost.')) { S = { found: [], started: true }; save(S); location.reload(); } }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && map.classList.contains('on')) closeMap(); });
    }
    drawMap();
    map.hidden = false; requestAnimationFrame(function () { map.classList.add('on'); });
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var c = $('[data-close]', map); c && c.focus({ preventScroll: true }); }, 60);
  }
  function closeMap() { map.classList.remove('on'); document.body.style.overflow = ''; setTimeout(function () { map.hidden = true; }, 400); }
  function noteFor(s) {
    return has(s.id)
      ? '<b>' + s.k + ' · ' + esc(s.name) + '</b><p>Found. The ink is still wet.</p><a href="' + s.href + '">Go back there →</a>'
      : '<b>? · A sealed riddle</b><p>“' + esc(s.riddle) + '”</p>';
  }
  function drawMap() {
    var n = S.found.length, path = 'M' + SEALS.map(function (s) { return s.x * 10 + ' ' + s.y * 6; }).join(' L');
    var next = SEALS.find(function (s) { return !has(s.id); }) || SEALS[0];
    map.innerHTML = '<div class="mm-sheet"><button type="button" class="mm-x" data-close aria-label="Close map">×</button>' +
      '<div class="mm-head"><span>巻物 · The Lost Scroll</span><h2>' + (n === SEALS.length ? 'The scroll is whole.' : n + ' of ' + SEALS.length + ' seals found') + '</h2></div>' +
      '<div class="mm-land"><svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path class="mm-coast" d="M40 300C60 120 220 60 420 90S760 30 900 140 980 420 820 520 420 580 240 520 20 460 40 300Z"/><path class="mm-trail" d="' + path + '"/>' +
        '<g class="mm-deco"><path d="M140 180l20-30 20 30zM170 190l14-22 14 22z"/><path d="M780 470c20-10 40-10 60 0M790 486c16-8 32-8 48 0"/><circle cx="880" cy="90" r="30"/></g></svg>' +
        SEALS.map(function (s, i) { return '<button type="button" class="mm-node' + (has(s.id) ? ' got' : '') + (s === next ? ' on' : '') + '" data-i="' + i + '" style="left:' + s.x + '%;top:' + s.y + '%" aria-label="' + (has(s.id) ? esc(s.name) : 'Unfound seal') + '"><i>' + (has(s.id) ? s.k : '?') + '</i></button>'; }).join('') +
        '<span class="mm-rose" aria-hidden="true">N</span></div>' +
      '<div class="mm-foot"><div class="mm-note">' + noteFor(next) + '</div>' +
        (n === SEALS.length ? '<button type="button" class="btn btn-primary btn-sm" data-sage>' + (S.sage ? 'Turn Sage Mode off' : 'Turn Sage Mode on') + '</button>' : '<small>Find all eight to unlock something.</small>') +
        '<button type="button" class="mm-reset" data-reset>Start over</button></div></div>';
  }

  /* ---------- the finale ---------- */
  function finale() {
    var f = document.createElement('div'); f.className = 'ms-finale';
    f.innerHTML = '<div class="mf-scroll"><i class="mf-rod"></i><div class="mf-paper"><span>自来也の巻</span><h2>The Scroll of the Toad Sage</h2><p>“A developer is not measured by the code they write, but by the people it keeps working for while they sleep.”</p><p class="mf-gift">You found all eight seals. <b>Sage Mode</b> is yours: the whole site turns gold.</p><div><button type="button" class="btn btn-primary" data-sageon>Enter Sage Mode</button><button type="button" class="btn btn-ghost" data-fclose>Later</button></div></div><i class="mf-rod"></i></div>';
    document.body.appendChild(f);
    requestAnimationFrame(function () { f.classList.add('on'); });
    f.addEventListener('click', function (e) {
      if (e.target.closest('[data-sageon]')) { S.sage = true; save(S); sage(true); }
      if (e.target.closest('[data-sageon], [data-fclose]') || e.target === f) { f.classList.remove('on'); setTimeout(function () { f.remove(); }, 600); }
    });
  }

  /* ---------- homepage: the dark room and the sealed door ---------- */
  var room = $('.ms-room');
  if (room) {
    var dark = $('.ms-dark', room), lx = 50, ly = 50, idle = true, t0 = performance.now();
    function lamp(x, y) { room.style.setProperty('--lx', x + '%'); room.style.setProperty('--ly', y + '%'); }
    room.addEventListener('pointermove', function (e) { var r = room.getBoundingClientRect(); idle = false; lx = (e.clientX - r.left) / r.width * 100; ly = (e.clientY - r.top) / r.height * 100; lamp(lx, ly); });
    room.addEventListener('pointerdown', function (e) { var r = room.getBoundingClientRect(); idle = false; lamp((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100); });
    room.addEventListener('pointerleave', function () { idle = true; });
    (function wander(t) { if (idle && !XR.reduce) { var a = (t - t0) / 2600; lamp(50 + Math.cos(a) * 30, 50 + Math.sin(a * 1.4) * 26); } requestAnimationFrame(wander); })(t0);
    void dark;
  }
  var door = $('.ms-door');
  if (door) {
    var SYM = ['火', '水', '風', '土', '雷', '月', '日', '木'], CODE = ['雷', '火', '月'], pos = [0, 0, 0], opened = false;
    var rings = $$('.md-ring', door);
    function drawRings() {
      rings.forEach(function (r, i) {
        $('.md-sym', r).textContent = SYM[pos[i]];
        $('.md-wheel', r).style.transform = 'rotate(' + (-pos[i] * 45) + 'deg)';
      });
    }
    function check() {
      if (opened) return;
      var ok = pos.every(function (p, i) { return SYM[p] === CODE[i]; });
      rings.forEach(function (r, i) { r.classList.toggle('right', SYM[pos[i]] === CODE[i]); });
      if (ok) {
        opened = true; door.classList.add('open'); S.started = true; save(S); paintHud();
        XR.toast('The door opens.');
      }
    }
    door.addEventListener('click', function (e) {
      var b = e.target.closest('[data-turn]'); if (!b || opened) return;
      var i = +b.closest('.md-ring').getAttribute('data-r'), d = +b.getAttribute('data-turn');
      pos[i] = (pos[i] + d + SYM.length) % SYM.length;
      var ring = rings[i]; ring.classList.remove('tick'); void ring.offsetWidth; ring.classList.add('tick');
      drawRings(); check();
      if (e.target.closest('[data-openmap]')) openMap();
    });
    door.addEventListener('click', function (e) { if (e.target.closest('[data-openmap]')) openMap(); });
    $$('.md-wheel', door).forEach(function (w) { w.innerHTML = SYM.map(function (s, k) { return '<i style="--k:' + k + '">' + s + '</i>'; }).join(''); });
    if (has('home-2')) { opened = true; pos = CODE.map(function (c) { return SYM.indexOf(c); }); door.classList.add('open', 'instant'); }
    drawRings();
  }
})();
