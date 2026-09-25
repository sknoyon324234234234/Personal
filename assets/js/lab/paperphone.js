/* Lab stage 06 — the paper phone: a small gym app whose tabs fold in like origami */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var CLASSES = [['18:00', 'Karate Kids', 'Hall 1 · Sensei Tania'], ['20:00', 'Judo open mat', 'Hall 2 · all levels'], ['Sat', 'Iaido basics', '08:00 · bring a bokken']];

  LAB.register('mobile', function (stage) {
    var screen = XR.$('.pp-screen', stage), toast = XR.$('.pp-toast', stage), tabs = XR.$$('.pp-tabs [role="tab"]', stage);
    var cur = 'home', pct = 68, days = 17, tt = 0;

    screen.innerHTML =
      '<div class="pp-page is-on" data-p="home" role="tabpanel" aria-label="Classes">' +
        '<div class="pp-hi"><div><small>Good evening</small><b>Rafi</b></div><span class="pp-me">R</span></div>' +
        '<div class="pp-hero"><small>Tonight · 19:30</small><b>Kendo</b><span>Sensei Mori · Hall 2 · 6 spots left</span><button type="button" class="pp-book" data-c="Kendo">Book my spot</button></div>' +
        '<p class="pp-h">This week</p><ul class="pp-list">' + CLASSES.map(function (c) {
          return '<li><time>' + c[0] + '</time><span><b>' + c[1] + '</b><small>' + c[2] + '</small></span><button type="button" class="pp-book" data-c="' + c[1] + '">Book</button></li>';
        }).join('') + '</ul>' +
      '</div>' +
      '<div class="pp-page" data-p="card" role="tabpanel" aria-label="Membership card">' +
        '<div class="pp-hi"><div><small>Membership</small><b>Show at the door</b></div><span class="pp-me">R</span></div>' +
        '<div class="pp-card" role="button" tabindex="0" aria-label="Membership card, tap to flip"><div class="pp-card-in">' +
          '<div class="pp-face pp-front"><div><small>Kage Dojo · Member</small><b>Rafi Ahmed</b><p class="pp-no">KD-2041<br>Blue belt · valid 12/2026</p></div><span class="pp-qr-in"></span></div>' +
          '<div class="pp-face pp-back"><b>House rules</b><span>Bow in and out. Clean gi. Phones stay in the locker. Tell sensei about any injury before class.</span></div>' +
        '</div></div><p class="pp-tip">Tap the card to flip it</p>' +
      '</div>' +
      '<div class="pp-page" data-p="belt" role="tabpanel" aria-label="Progress">' +
        '<div class="pp-hi"><div><small>Road to brown belt</small><b>Blue belt</b></div><span class="pp-me">R</span></div>' +
        '<div class="pp-ring"><svg viewBox="0 0 40 40"><circle class="bgc" cx="20" cy="20" r="15.9155" pathLength="100"/><circle class="fg" cx="20" cy="20" r="15.9155" pathLength="100"/></svg><div><b class="pp-pct">68%</b><small>to the next test</small></div></div>' +
        '<p class="pp-h">Last four weeks</p><div class="pp-days"></div>' +
        '<button type="button" class="pp-train">I trained today</button>' +
      '</div>';
    var ring = XR.$('.pp-ring', screen), grid = XR.$('.pp-days', screen), train = XR.$('.pp-train', screen);
    var pattern = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0];
    grid.innerHTML = pattern.concat([0, 0, 0, 0]).map(function (v) { return '<i' + (v ? ' class="on"' : '') + '></i>'; }).join('');
    LAB.qr(XR.$('.pp-qr-in', screen), 'KD-2041');
    LAB.qr(XR.$('.pp-qr', stage), 'kage-dojo-apk');

    function note(text) {
      clearTimeout(tt);
      toast.innerHTML = '<span class="cr-mini">知</span><span>' + XR.esc(text) + '</span>';
      toast.classList.add('is-on');
      tt = setTimeout(function () { toast.classList.remove('is-on'); }, 2600);
    }
    function show(p, focus) {
      if (p === cur) return;
      var out = XR.$('.pp-page[data-p="' + cur + '"]', screen), inn = XR.$('.pp-page[data-p="' + p + '"]', screen);
      out.classList.add('is-leaving'); out.classList.remove('is-on');
      setTimeout(function () { out.classList.remove('is-leaving'); }, XR.reduce ? 0 : 560);
      inn.classList.add('is-on');
      cur = p;
      tabs.forEach(function (t) { var on = t.getAttribute('data-p') === p; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.getAttribute('data-p')); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        show(tabs[(i + d + tabs.length) % tabs.length].getAttribute('data-p'), true);
      });
    });
    screen.addEventListener('click', function (e) {
      var b = e.target.closest('.pp-book');
      if (b) {
        var on = !b.classList.contains('is-booked');
        b.classList.toggle('is-booked', on);
        b.textContent = on ? '予約 Booked' : (b.closest('.pp-hero') ? 'Book my spot' : 'Book');
        note(on ? b.getAttribute('data-c') + ' booked. Reminder 30 minutes before.' : 'Booking cancelled.');
        return;
      }
      var c = e.target.closest('.pp-card');
      if (c) c.classList.toggle('is-flip');
    });
    screen.addEventListener('keydown', function (e) {
      var c = e.target.closest && e.target.closest('.pp-card');
      if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); c.classList.toggle('is-flip'); }
    });
    train.addEventListener('click', function () {
      var cells = XR.$$('i', grid), next = pattern.length + (days - 17);
      if (cells[next]) cells[next].className = 'on new';
      days++;
      pct = Math.min(100, pct + 8);
      ring.style.setProperty('--p', pct);
      XR.$('.pp-pct', ring).textContent = pct + '%';
      if (pct >= 100) { ring.classList.add('is-full'); train.disabled = true; train.textContent = 'Test unlocked'; note('Brown belt test unlocked. Sensei will confirm a date.'); }
      else note('Logged. ' + (100 - pct) + '% to go.');
    });
  });
})();
