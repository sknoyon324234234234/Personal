/* Lab chapter 06 - Phone Jutsu: a working delivery-app phone beside a manga strip that plays the order live. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;
  var $ = XR.$, $$ = XR.$$, icon = XR.icon, esc = XR.esc;

  var MENU = [
    { id: 'biryani', name: 'Kacchi Biryani', price: 320, note: 'Slow mutton, ghee rice, potato' },
    { id: 'tehari', name: 'Chicken Tehari', price: 180, note: 'Mustard oil, fried onion, boiled egg' },
    { id: 'doi', name: 'Mishti Doi', price: 90, note: 'Clay-pot sweet yogurt' }
  ];

  /* the 4 status nodes shown on the phone's stepper */
  var STATUSES = [
    { label: 'Placed' },
    { label: 'Cooking' },
    { label: 'On the way' },
    { label: 'Delivered' }
  ];

  /* the order timeline: each tick advances the phone AND (mostly) one strip panel */
  var TICKS = [
    { status: 0, eta: '~18 min', note: 'Rajshahi Bites received your order.', push: 'Order received. Thanks!', cell: -1 },
    { status: 1, eta: '~14 min', note: 'The kitchen just started cooking.', push: 'Kitchen started cooking your order.', cell: 0, sfx: 'ジュー', tone: 'is-gold' },
    { status: 2, eta: '~8 min', note: 'Your rider picked up the bag.', push: 'Rider picked up your order.', cell: 1, sfx: null, tone: null },
    { status: 2, eta: '~2 min', note: 'Weaving through Rajshahi traffic.', push: 'Your rider is 2 min away.', cell: 2, sfx: 'ブーン', tone: 'is-red' },
    { status: 3, eta: 'Arrived', note: 'Delivered. Itadakimasu!', push: 'Delivered! Enjoy your meal.', cell: 3, sfx: 'ピンポーン!', tone: 'is-gold' }
  ];

  var ART = {
    kitchen: '<div class="mph-art-box"><svg viewBox="0 0 120 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="mph-ink" d="M28 54h64l-7 25a9 9 0 0 1-9 7H44a9 9 0 0 1-9-7z"/><path class="mph-ink" d="M22 54h76"/><path class="mph-ink" d="M40 54c0-15 9-26 20-26s20 11 20 26"/><circle class="mph-ink" cx="60" cy="28" r="3"/><path class="mph-steam" d="M48 20c-4-6 4-9 0-17"/><path class="mph-steam" d="M60 18c-4-6 4-9 0-17"/><path class="mph-steam" d="M72 20c-4-6 4-9 0-17"/></svg></div><span class="km-sfx mph-sfx-slot" data-sfx aria-hidden="true"></span>',
    pickup: '<div class="mph-art-box"><svg viewBox="0 0 120 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><rect class="mph-ink" x="16" y="10" width="38" height="76" rx="2"/><circle class="mph-ink" cx="46" cy="49" r="2.4"/></svg></div><img class="mph-rider" src="assets/img/characters/gama.webp" alt="" loading="lazy" width="72" height="72"><span class="km-sfx mph-sfx-slot" data-sfx aria-hidden="true"></span>',
    road: '<div class="mph-art-box"><svg viewBox="0 0 120 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="mph-road" d="M0 78h120" stroke-dasharray="9 11"/></svg></div><img class="mph-rider mph-rider-go" src="assets/img/characters/gama.webp" alt="" loading="lazy" width="76" height="76"><span class="km-sfx mph-sfx-slot" data-sfx aria-hidden="true"></span>',
    door: '<div class="mph-art-box"><svg viewBox="0 0 120 96" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><rect class="mph-ink" x="30" y="8" width="56" height="80" rx="3"/><circle class="mph-ink" cx="76" cy="48" r="2.6"/><circle class="mph-bell" cx="58" cy="26" r="7"/></svg></div><span class="km-sfx mph-sfx-slot" data-sfx aria-hidden="true"></span>'
  };
  var CELLS = [
    { key: 'kitchen', label: 'Kitchen', tone: 'km-tone-2' },
    { key: 'pickup', label: 'Pickup', tone: 'km-tone-teal' },
    { key: 'road', label: 'On the road', tone: 'km-tone-dark km-slant' },
    { key: 'door', label: 'Delivered', tone: 'km-tone-red' }
  ];

  function taka(n) { return '৳' + n; }

  LAB.register('mobile', function (stage) {
    var cart = {}, busy = false, runToken = 0, visible = true, pushTimer = null, orderId = '';

    /* ---------- page shell, built once ---------- */
    stage.innerHTML =
      '<div class="km-page mph-page">' +
        '<div class="km-panel km-tone km-slant mph-p-head km-in">' +
          '<span class="km-cap">Ch. 06</span>' +
          '<div class="mph-head-in">' +
            '<h3 class="km-h">Phone Jutsu <span class="jp">電話の術</span></h3>' +
            '<p class="km-bubble">Rajshahi Bites · order in two taps, watch the rider fly across the page.</p>' +
          '</div>' +
        '</div>' +
        '<div class="km-panel mph-p-phone km-in">' +
          '<div class="mph-phone">' +
            '<div class="mph-notch" aria-hidden="true"></div>' +
            '<div class="mph-push" aria-hidden="true"></div>' +
            '<div class="mph-screen"></div>' +
          '</div>' +
          '<div class="mph-apk">' +
            '<div class="mph-qr"></div>' +
            '<div class="mph-apk-t"><span class="km-tag is-red">APK</span><small>Android 8+ · 7.4 MB<br>Scan to install (demo)</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="km-panel mph-p-strip km-in">' +
          '<div class="mph-strip">' +
            CELLS.map(function (c, i) {
              return '<div class="mph-cell ' + c.tone + '" data-cell="' + i + '"><span class="km-cap">' + (i + 1) + '</span>' + ART[c.key] + '<span class="mph-cell-l">' + c.label + '</span></div>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<p class="sr-only mph-live" aria-live="polite"></p>' +
      '</div>';

    var screen = $('.mph-screen', stage);
    var pushEl = $('.mph-push', stage);
    var liveEl = $('.mph-live', stage);
    var cellEls = $$('.mph-cell', stage);
    LAB.qr($('.mph-qr', stage), 'rajshahi-bites-apk-demo');

    /* ---------- cart helpers ---------- */
    function qty(id) { return cart[id] || 0; }
    function cartTotal() { var t = 0; MENU.forEach(function (d) { t += d.price * qty(d.id); }); return t; }
    function cartCount() { var n = 0; MENU.forEach(function (d) { n += qty(d.id); }); return n; }

    function menuHTML() {
      var rows = MENU.map(function (d) {
        var q = qty(d.id);
        return '<li class="mph-dish" data-dish="' + d.id + '">' +
          '<div class="mph-dish-t"><b>' + esc(d.name) + '</b><small>' + esc(d.note) + '</small></div>' +
          '<div class="mph-dish-r">' +
            '<span class="mph-price">' + taka(d.price) + '</span>' +
            '<div class="mph-stepper">' +
              '<button type="button" class="mph-step" data-act="qty" data-id="' + d.id + '" data-d="-1"' + (q === 0 ? ' disabled' : '') + ' aria-label="Remove one ' + esc(d.name) + '">' + icon('minus') + '</button>' +
              '<span class="mph-qty">' + q + '</span>' +
              '<button type="button" class="mph-step" data-act="qty" data-id="' + d.id + '" data-d="1" aria-label="Add one ' + esc(d.name) + '">' + icon('plus') + '</button>' +
            '</div>' +
          '</div>' +
          '<span class="mph-blip" data-blip="' + d.id + '" aria-hidden="true">ピッ</span>' +
        '</li>';
      }).join('');
      var t = cartTotal(), n = cartCount();
      return '<div class="mph-menu">' +
        '<div class="mph-menu-h"><b>Rajshahi Bites</b><small>' + icon('pin') + '1.2 km · ' + icon('clock') + '20–35 min</small></div>' +
        '<ul class="mph-list">' + rows + '</ul>' +
        '<div class="mph-cart">' +
          '<div class="mph-cart-row"><small>' + n + ' item' + (n === 1 ? '' : 's') + '</small><b>' + taka(t) + '</b></div>' +
          '<button type="button" class="km-btn is-red mph-order" data-act="order"' + (t === 0 ? ' disabled' : '') + '>' + icon('bag') + 'Place order · bKash</button>' +
        '</div>' +
      '</div>';
    }

    function trackHTML(i) {
      var tk = TICKS[i], done = i === TICKS.length - 1;
      var steps = STATUSES.map(function (s, k) {
        var cls = k < tk.status ? 'is-done' : k === tk.status ? 'is-now' : '';
        var mark = k < tk.status ? icon('check') : String(k + 1);
        return '<li class="' + cls + '"><span class="mph-node">' + mark + '</span><small>' + s.label + '</small></li>';
      }).join('');
      return '<div class="mph-track">' +
        '<div class="mph-track-h"><small>Order #' + orderId + '</small><b>' + tk.eta + '</b></div>' +
        '<ol class="mph-steps">' + steps + '</ol>' +
        '<p class="mph-note">' + esc(tk.note) + '</p>' +
        (done ? '<button type="button" class="km-btn is-ink mph-again" data-act="reset">' + icon('refresh') + 'Order again</button>' : '<p class="mph-wait">' + icon('bell') + 'Tracking live…</p>') +
      '</div>';
    }

    function renderMenu() { screen.innerHTML = menuHTML(); }

    function pushToast(msg) {
      if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
      pushEl.innerHTML = '<span class="ic">' + icon('bell') + '</span><span>' + esc(msg) + '</span>';
      pushEl.classList.remove('is-out');
      pushEl.classList.add('is-in');
      pushTimer = setTimeout(function () {
        pushEl.classList.add('is-out');
        pushEl.classList.remove('is-in');
      }, 2300);
    }

    function sfxInCell(cellEl, text, tone) {
      var slot = $('[data-sfx]', cellEl);
      if (!slot || !text) return;
      slot.textContent = text;
      slot.className = 'km-sfx mph-sfx-slot is-pop' + (tone ? ' ' + tone : '');
    }

    function showTick(i) {
      var tk = TICKS[i];
      screen.innerHTML = trackHTML(i);
      liveEl.textContent = tk.note;
      pushToast(tk.push);
      if (tk.cell >= 0) {
        var el = cellEls[tk.cell];
        el.classList.add('is-seen');
        sfxInCell(el, tk.sfx, tk.tone);
      }
      if (i === TICKS.length - 1) busy = false;
    }

    /* waits until the tab is visible and the stage is on screen before doing any work */
    function waitActive() {
      return new Promise(function (resolve) {
        (function poll(token) {
          if (token !== runToken) return;
          if (!document.hidden && visible) { resolve(); return; }
          setTimeout(function () { poll(token); }, 350);
        })(runToken);
      });
    }

    function runOrder() {
      busy = true;
      orderId = 'RB-' + (100 + Math.floor(LAB.rng(LAB.stamp())() * 900));
      var token = ++runToken;
      var delay = XR.reduce ? 550 : 2100;
      var p = Promise.resolve();
      TICKS.forEach(function (tk, i) {
        p = p.then(function () { return i === 0 ? null : LAB.sleep(delay); })
          .then(waitActive)
          .then(function () { if (token === runToken) showTick(i); });
      });
    }

    function resetAll() {
      runToken++; /* cancels any pending order chain */
      busy = false;
      cart = {};
      if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
      pushEl.classList.remove('is-in'); pushEl.classList.remove('is-out'); pushEl.innerHTML = '';
      cellEls.forEach(function (el) {
        el.classList.remove('is-seen');
        var slot = $('[data-sfx]', el);
        if (slot) { slot.className = 'km-sfx mph-sfx-slot'; slot.textContent = ''; }
      });
      renderMenu();
      liveEl.textContent = 'Menu ready. Add dishes to your cart.';
    }

    stage.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'qty') {
        var id = b.getAttribute('data-id'), d = +b.getAttribute('data-d');
        cart[id] = XR.clamp(qty(id) + d, 0, 9);
        renderMenu();
        var blip = $('.mph-blip[data-blip="' + id + '"]', stage);
        if (blip) blip.classList.add('is-pop');
        var back = $('.mph-step[data-id="' + id + '"][data-d="' + d + '"]', stage);
        if (!back || back.disabled) back = $('.mph-step[data-id="' + id + '"][data-d="1"]', stage);
        if (back) back.focus();
      } else if (act === 'order') {
        if (busy || cartTotal() === 0) return;
        runOrder();
      } else if (act === 'reset') {
        resetAll();
      }
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 });
      io.observe(stage);
    }

    resetAll();
  });
})();
