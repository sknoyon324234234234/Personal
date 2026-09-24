/* Lab stage 07 — "Pulse" fitness app running in a phone frame */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var I = function (n, c) { return XR.icon(n, c); };

  var WORKOUTS = [
    { n: 'Morning Run', d: '5 km · 32 min', ic: 'activity', c: '#e0442e', cat: 'Cardio' },
    { n: 'Core Blast', d: '15 min · 12 moves', ic: 'flame', c: '#ff8a3d', cat: 'Strength' },
    { n: 'Yoga Stretch', d: '20 min · calm', ic: 'sun', c: '#27b5d6', cat: 'Yoga' },
    { n: 'HIIT Sprint', d: '18 min · intense', ic: 'zap', c: '#9483c2', cat: 'Cardio' },
    { n: 'Upper Body', d: '35 min · dumbbells', ic: 'trophy', c: '#22a35a', cat: 'Strength' }
  ];

  function ring(r, cls, p) {
    var c = 2 * Math.PI * r;
    return '<circle class="bg" cx="60" cy="60" r="' + r + '"/><circle class="val ' + cls + '" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '" data-off="' + (c * (1 - p)).toFixed(1) + '"/>';
  }
  function item(w, i) {
    return '<button type="button" class="app-item" data-w="' + i + '"><span class="ai-ic" style="--c:' + w.c + '">' + I(w.ic) + '</span><span><b>' + w.n + '</b><small>' + w.d + '</small></span>' + I('chevron-right', 'go') + '</button>';
  }

  var SCREENS = {
    home: '<div class="app-h"><div><small>Good morning</small><b>Rafi</b></div><span class="app-ava">R</span></div>' +
      '<div class="app-rings"><svg viewBox="0 0 120 120" aria-hidden="true">' + ring(52, 'r1', .72) + ring(40, 'r2', .54) + ring(28, 'r3', .88) + '</svg>' +
      '<ul><li><i style="background:#e0442e"></i><span>Move <b>432</b>/600 kcal</span></li><li><i style="background:#a9c46a"></i><span>Exercise <b>27</b>/50 min</span></li><li><i style="background:#6fb3a8"></i><span>Stand <b>11</b>/12 h</span></li></ul></div>' +
      '<div class="app-cards"><div class="app-card"><small>' + I('activity') + 'Steps</small><b>8,432</b><em>+12% vs yesterday</em></div><div class="app-card"><small>' + I('heart') + 'Heart</small><b>72 bpm</b><em>resting</em></div>' +
      '<div class="app-card"><small>' + I('flame') + 'Calories</small><b>1,240</b><em>on track</em></div><div class="app-card"><small>' + I('moon') + 'Sleep</small><b>7h 20m</b><em>deep 1h 50m</em></div></div>' +
      '<p class="app-sec">Today’s plan</p><div class="app-list">' + WORKOUTS.slice(0, 3).map(item).join('') + '</div>',
    workouts: '<div class="app-h"><div><small>Choose your</small><b>Workout</b></div><span class="app-ava">R</span></div>' +
      '<div class="app-chips"><button type="button" class="is-on" data-cat="All">All</button><button type="button" data-cat="Strength">Strength</button><button type="button" data-cat="Cardio">Cardio</button><button type="button" data-cat="Yoga">Yoga</button></div>' +
      '<div class="app-hero-card"><b>30-Day Shred</b><small>Day 12 of 30 · keep the streak</small>' + I('flame', 'big') + '</div><div class="app-list w-list"></div>',
    stats: '<div class="app-h"><div><small>This week</small><b>Activity</b></div><span class="app-ava">R</span></div>' +
      '<div class="app-bars">' + [['M', 45], ['T', 70], ['W', 55], ['T', 90], ['F', 62], ['S', 100], ['S', 38]].map(function (d, i) { return '<div class="' + (i === 5 ? 'hi' : '') + '"><i style="--h:' + d[1] + '%"></i><span>' + d[0] + '</span></div>'; }).join('') + '</div>' +
      '<div class="app-cards"><div class="app-card"><small>' + I('pin') + 'Distance</small><b>32.4 km</b><em>+4.1 km</em></div><div class="app-card"><small>' + I('clock') + 'Active</small><b>6h 12m</b><em>best week</em></div>' +
      '<div class="app-card"><small>' + I('trophy') + 'Workouts</small><b>9</b><em>goal 8</em></div><div class="app-card"><small>' + I('trending') + 'Streak</small><b>48 days</b><em>personal best</em></div></div>',
    profile: '<div class="app-prof"><span class="app-ava">R</span><b>Rafi Ahmed</b><small>Level 12 · Pro member · Rajshahi</small></div>' +
      '<label class="app-set"><span>Dark mode</span><input type="checkbox" class="sr-only" data-set="dark"><span class="switch" aria-hidden="true"></span></label>' +
      '<label class="app-set"><span>Workout reminders</span><input type="checkbox" class="sr-only" checked data-set="notif"><span class="switch" aria-hidden="true"></span></label>' +
      '<label class="app-set"><span>Sync with smartwatch</span><input type="checkbox" class="sr-only" checked data-set="sync"><span class="switch" aria-hidden="true"></span></label>' +
      '<div class="app-set"><span>Language</span><span style="color:#8a8a99">English / বাংলা</span></div><div class="app-set"><span>Subscription</span><span style="color:#e0442e;font-weight:700">Pro</span></div>'
  };

  LAB.register('mobile', function (stage) {
    var phone = XR.$('.app-phone', stage), wrap = XR.$('.app-screens', stage), nav = XR.$('.app-nav', stage);
    var order = ['home', 'workouts', 'stats', 'profile'], current = 'home', els = {};

    Object.keys(SCREENS).forEach(function (k) {
      var s = document.createElement('div');
      s.className = 'app-screen' + (k === 'home' ? ' is-on' : '');
      s.innerHTML = SCREENS[k];
      wrap.appendChild(s); els[k] = s;
    });
    var sheet = document.createElement('div');
    sheet.className = 'app-sheet';
    sheet.innerHTML = '<div class="grip"></div><div class="app-h"><div><small class="sh-cat">Cardio</small><b class="sh-name">Workout</b></div><button type="button" class="sh-x" aria-label="Close">' + I('close') + '</button></div>' +
      '<div class="app-timer"><small>Elapsed</small><b class="sh-time">00:00</b><div style="display:flex;gap:8px"><button type="button" class="app-btn sh-go">' + I('play') + 'Start</button><button type="button" class="app-btn ghost sh-reset">' + I('refresh') + '</button></div></div>';
    wrap.appendChild(sheet);

    function animateRings() {
      XR.$$('.app-rings .val', els.home).forEach(function (c) {
        c.setAttribute('stroke-dashoffset', c.getAttribute('stroke-dasharray'));
        requestAnimationFrame(function () { requestAnimationFrame(function () { c.setAttribute('stroke-dashoffset', c.getAttribute('data-off')); }); });
      });
    }
    function show(k) {
      if (k === current) return;
      var back = order.indexOf(k) < order.indexOf(current);
      els[current].classList.remove('is-on');
      els[current].classList.toggle('is-back', !back);
      els[k].classList.remove('is-back');
      els[k].classList.add('is-on');
      current = k;
      XR.$$('button', nav).forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-screen') === k); });
      sheet.classList.remove('is-open');
      if (k === 'home') animateRings();
    }
    nav.addEventListener('click', function (e) { var b = e.target.closest('[data-screen]'); if (b) show(b.getAttribute('data-screen')); });

    // workouts list + filter
    var wl = XR.$('.w-list', els.workouts);
    function list(cat) { wl.innerHTML = WORKOUTS.map(function (w, i) { return cat === 'All' || w.cat === cat ? item(w, i) : ''; }).join(''); }
    list('All');
    XR.$('.app-chips', els.workouts).addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      XR.$$('.app-chips button', els.workouts).forEach(function (x) { x.classList.toggle('is-on', x === b); });
      list(b.getAttribute('data-cat'));
    });

    // workout sheet with timer
    var secs = 0, timer = null, go = XR.$('.sh-go', sheet), tEl = XR.$('.sh-time', sheet);
    function fmt(s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
    function stop() { clearInterval(timer); timer = null; go.innerHTML = I('play') + (secs ? 'Resume' : 'Start'); }
    wrap.addEventListener('click', function (e) {
      var it = e.target.closest('[data-w]'); if (!it) return;
      var w = WORKOUTS[+it.getAttribute('data-w')];
      if (current === 'home') show('workouts');
      XR.$('.sh-name', sheet).textContent = w.n; XR.$('.sh-cat', sheet).textContent = w.cat + ' · ' + w.d;
      stop(); secs = 0; tEl.textContent = '00:00'; go.innerHTML = I('play') + 'Start';
      sheet.classList.add('is-open');
    });
    go.addEventListener('click', function () {
      if (timer) { stop(); return; }
      go.innerHTML = I('pause') + 'Pause';
      timer = setInterval(function () { secs++; tEl.textContent = fmt(secs); }, 1000);
    });
    XR.$('.sh-reset', sheet).addEventListener('click', function () { stop(); secs = 0; tEl.textContent = '00:00'; go.innerHTML = I('play') + 'Start'; });
    XR.$('.sh-x', sheet).addEventListener('click', function () { stop(); sheet.classList.remove('is-open'); });

    // settings
    els.profile.addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-set');
      if (k === 'dark') phone.classList.toggle('dark-app', e.target.checked);
      if (k === 'notif') XR.toast(e.target.checked ? 'Reminders on — 7:00 AM daily' : 'Reminders off');
    });

    // clock + splash
    var te = XR.$('.app-time', stage);
    te.textContent = LAB.now();
    setInterval(function () { te.textContent = LAB.now(); }, 30000);
    setTimeout(function () { XR.$('.app-splash', stage).classList.add('is-gone'); animateRings(); }, XR.reduce ? 0 : 1300);

    // APK card
    LAB.qr(XR.$('.apk-qr', stage), 'pulse-apk');
    XR.$('.apk-dl', stage).addEventListener('click', function () { XR.toast('Demo only — clients receive the real signed APK'); });
  });
})();
