/* Lab stage 02 — the karakuri machine: crank a ticket through stations you can switch off with a lever */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  var ST = [
    { k: '受', ic: 'bell', name: 'Trigger', sub: 'it starts here' },
    { k: '帳', ic: 'grid', name: 'Sheet', sub: 'add a row',
      log: function (t) { return t.daily ? 'sheets.read     yesterday · ' + t.orders + ' rows' : 'sheets.append   row #' + t.row + ' · ' + t.item; } },
    { k: '文', ic: 'mail', name: 'Email', sub: 'send receipt',
      log: function (t) { return t.daily ? 'mail.send       report → owner@kage.shop' : 'mail.send       receipt → ' + t.mail; } },
    { k: '伝', ic: 'send', name: 'Telegram', sub: 'alert owner',
      log: function (t) { return t.daily ? 'telegram.post   daily summary · ৳' + t.total : 'telegram.notify @kage_orders · $' + t.price; } },
    { k: '請', ic: 'download', name: 'Invoice', sub: 'make a PDF',
      log: function (t) { return t.daily ? 'report.pdf      sales-' + t.date + '.pdf' : 'invoice.pdf     INV-' + t.n + '.pdf · 38 KB'; } }
  ];
  var ITEMS = [['Ronin Headphones', 129], ['Neon Katana Lamp', 59], ['Mecha Keyboard', 89], ['Kitsune Hoodie', 64]];
  var MAILS = ['nadia@', 'rafi@', 'tanvir@', 'mim@'];

  function gear(cx, cy, r, teeth, cls) {
    var d = '', n = teeth * 2;
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2, rr = i % 2 ? r + 7 : r;
      var a2 = a + Math.PI / n * .5;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + 'L' + (cx + Math.cos(a2) * rr).toFixed(1) + ' ' + (cy + Math.sin(a2) * rr).toFixed(1);
    }
    return '<g class="g spin' + (cls || '') + '"><path d="' + d + 'Z"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * .55).toFixed(1) + '"/><circle cx="' + cx + '" cy="' + cy + '" r="5"/></g>';
  }

  LAB.register('automation', function (stage) {
    var works = XR.$('.kr-works', stage), line = XR.$('.kr-line', stage), ticket = XR.$('.kr-ticket', stage), log = XR.$('.kr-log', stage);
    var crank = XR.$('.kr-crank', stage), wheel = XR.$('.kr-wheel', stage), countEl = XR.$('.kr-n', stage), auto = XR.$('.kr-auto input', stage);
    var trig = 'order', busy = false, rot = 0, count = 214, n = 4822, row = 218, seen = false, timer = 0;

    XR.$('.kr-gears', stage).innerHTML = gear(90, 70, 46, 12) + gear(178, 44, 26, 8, ' rev') + gear(330, 80, 58, 14) + gear(440, 34, 30, 9, ' rev') + gear(560, 74, 44, 12);
    line.innerHTML = ST.map(function (s, i) {
      return '<li class="kr-st' + (i ? '' : ' kr-st-first') + '">' + (i ? '<button type="button" class="kr-lever" role="switch" aria-checked="true" aria-label="' + s.name + ' step"><i></i></button>' : '') +
        '<span class="kr-box"><span class="jp">' + s.k + '</span>' + XR.icon(s.ic) + '</span><b>' + s.name + '</b><small>' + s.sub + '</small></li>';
    }).join('');
    var sts = XR.$$('.kr-st', line), boxes = XR.$$('.kr-box', line);

    function write(html, cls) {
      var idle = XR.$('.kr-idle', log);
      if (idle) idle.remove();
      var li = document.createElement('li');
      if (cls) li.className = cls;
      li.innerHTML = '<time>' + LAB.stamp() + '</time>' + html;
      log.appendChild(li);
      while (log.children.length > 30) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
    }
    function move(i, instant) {
      var w = works.getBoundingClientRect(), b = boxes[i].getBoundingClientRect();
      var tx = XR.clamp(b.left + b.width / 2 - w.left - ticket.offsetWidth / 2, 4, works.clientWidth - ticket.offsetWidth - 4);
      var ty = Math.max(6, b.top - w.top - ticket.offsetHeight - 26);
      if (instant) { ticket.style.transition = 'none'; }
      ticket.style.setProperty('--tx', tx.toFixed(1) + 'px');
      ticket.style.setProperty('--ty', ty.toFixed(1) + 'px');
      if (instant) { void ticket.offsetWidth; ticket.style.transition = ''; }
    }
    var sleep = function (ms) { return LAB.sleep(XR.reduce ? Math.min(ms, 60) : ms); };

    async function run() {
      if (busy) return;
      busy = true; crank.disabled = true;
      rot += 360; wheel.style.transform = 'rotate(' + rot + 'deg)';
      stage.classList.add('is-running');
      var it = ITEMS[n % ITEMS.length], d = new Date(Date.now() - 864e5);
      var t = trig === 'daily'
        ? { daily: true, orders: 9 + (n % 7), total: (14200 + (n % 9) * 530).toLocaleString('en-US'), date: d.toISOString().slice(0, 10) }
        : { n: n, row: row, item: it[0], price: it[1], mail: MAILS[n % MAILS.length] + 'gmail.com' };
      XR.$('.kr-t-title', ticket).textContent = t.daily ? 'Daily report · 09:00' : 'Order #' + n;
      XR.$('.kr-t-sub', ticket).textContent = t.daily ? t.orders + ' orders · ৳' + t.total : it[0] + ' · $' + it[1];
      XR.$('.kr-t-marks', ticket).innerHTML = '';
      ticket.classList.remove('is-done');
      move(0, true);
      ticket.classList.add('is-live');
      var done = 0;
      write(t.daily ? 'cron 09:00      daily report started' : 'order.created   #' + n + ' · $' + it[1], 'ok');
      await sleep(550);
      for (var i = 1; i < ST.length; i++) {
        move(i);
        await sleep(650);
        if (sts[i].classList.contains('is-off')) { write(ST[i].log(t) + '  (switched off)', 'skip'); continue; }
        sts[i].classList.add('is-hit');
        XR.$('.kr-t-marks', ticket).insertAdjacentHTML('beforeend', '<span class="cr-mini">' + ST[i].k + '</span>');
        write(ST[i].log(t) + '  ✓', 'ok');
        done++;
        await sleep(320);
        sts[i].classList.remove('is-hit');
      }
      ticket.classList.add('is-done');
      count++; countEl.textContent = count;
      countEl.classList.remove('is-bump'); void countEl.offsetWidth; countEl.classList.add('is-bump');
      write('done · ' + done + ' step' + (done === 1 ? '' : 's') + ' in ' + (.3 + done * .2 + Math.random() * .2).toFixed(1) + ' s · by hand ≈ ' + (2 + done * 2) + ' min', 'done');
      if (!t.daily) { n++; row++; }
      await sleep(600);
      ticket.classList.remove('is-live');
      stage.classList.remove('is-running');
      busy = false; crank.disabled = false;
    }

    crank.addEventListener('click', run);
    XR.$$('.kr-lever', line).forEach(function (lv) {
      lv.addEventListener('click', function () {
        var on = lv.getAttribute('aria-checked') !== 'true', st = lv.closest('.kr-st');
        lv.setAttribute('aria-checked', on);
        st.classList.toggle('is-off', !on);
        write('lever · ' + XR.$('b', st).textContent.toLowerCase() + ' ' + (on ? 'on' : 'off'));
      });
    });
    XR.$$('[data-trig]', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        trig = b.getAttribute('data-trig');
        XR.$$('[data-trig]', stage).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
        XR.$('small', sts[0]).textContent = trig === 'daily' ? 'every 9:00' : 'order in';
      });
    });

    /* "leave it running": one ticket every few seconds, only while the machine is on screen */
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; }).observe(stage);
    else seen = true;
    auto.addEventListener('change', function () {
      clearInterval(timer);
      if (auto.checked) { run(); timer = setInterval(function () { if (seen && !document.hidden) run(); }, 5200); }
    });
    window.addEventListener('resize', function () { if (ticket.classList.contains('is-live')) move(0, true); });
    XR.$('small', sts[0]).textContent = 'order in';
  });
})();
