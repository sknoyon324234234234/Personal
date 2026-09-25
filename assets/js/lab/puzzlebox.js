/* Lab stage 05 — the puzzle box: an installer that slides open panel by panel, then unfolds a desktop app */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var FILES = ['KageLedger.exe', 'updater.exe', 'ledger.db (SQLite)', 'reports/templates.pdfx', 'fonts/ShipporiMincho.ttf', 'lang/bn-BD.json', 'lang/en-US.json', 'uninstall.exe', 'Desktop shortcut'];
  var CLIENTS = [['Mishti Ghor', 'sweets'], ['Rahman Traders', 'wholesale'], ['Nirmal Clinic', 'health'], ['Padma Tours', 'travel'], ['Kage Build', 'PCs'], ['Shikkha Coaching', 'education']];

  LAB.register('desktop', function (stage) {
    var table = XR.$('.pb-table', stage), box = XR.$('.pb-box', stage), slip = XR.$('.pb-slip', stage), app = XR.$('.pb-app', stage);
    var slides = XR.$$('.pb-slide', stage), steps = XR.$$('.pb-steps li', stage);
    var step = 0, key = '', ver = '2.4', rows = [], busy = false;

    function paintSteps() {
      steps.forEach(function (li, i) { li.classList.toggle('is-done', i < step); li.classList.toggle('is-now', i === step); });
      slides.forEach(function (s, i) { s.classList.toggle('is-open', i < step); s.classList.toggle('is-next', i === step && step < 2); });
      box.setAttribute('data-step', step);
    }
    function card(html) {
      slip.innerHTML = html;
      slip.classList.remove('is-in'); void slip.offsetWidth; slip.classList.add('is-in');
    }
    function go(s) {
      step = s;
      paintSteps();
      if (s === 0) card('<small class="pb-k">Step 1 of 4 · License</small><h4>Kage Ledger ' + ver + ' setup</h4><p>This box opens one panel at a time. The first panel is the license.</p>' +
        '<div class="pb-lic">KAGE LEDGER · END USER LICENSE (DEMO)\n1. One license covers one shop and up to three computers.\n2. Your data stays on your computer. Backups are yours.\n3. Updates are free for the major version you bought.\n4. This is a demo in a web page. Nothing is installed.</div>' +
        '<div class="pb-act"><button type="button" class="btn btn-primary btn-sm" data-go="1">I accept ' + XR.icon('arrow-right') + '</button></div>');
      else if (s === 1) card('<small class="pb-k">Step 2 of 4 · Folder</small><h4>Where should it live?</h4>' +
        '<label class="pb-path">' + XR.icon('box') + '<input type="text" value="C:\\Program Files\\Kage Ledger" aria-label="Install folder" spellcheck="false"></label>' +
        '<label class="pb-opt"><input type="checkbox" checked> Desktop shortcut</label><label class="pb-opt"><input type="checkbox" checked> Start with Windows</label><label class="pb-opt"><input type="checkbox"> Install for every user on this PC</label>' +
        '<div class="pb-act" style="margin-top:10px"><button type="button" class="btn btn-primary btn-sm" data-go="2">Install ' + XR.icon('download') + '</button><button type="button" class="btn btn-ghost btn-sm" data-go="0">Back</button></div>');
      else if (s === 2) install();
    }
    async function install() {
      busy = true;
      card('<small class="pb-k">Step 3 of 4 · Install</small><h4>Turning the key…</h4><div class="pb-bar"><i></i></div><ul class="pb-files"></ul><div class="pb-keyline" hidden></div><div class="pb-act" hidden><button type="button" class="btn btn-primary btn-sm" data-go="3">Open the box ' + XR.icon('arrow-up-right') + '</button></div>');
      var bar = XR.$('.pb-bar i', slip), list = XR.$('.pb-files', slip);
      box.classList.add('is-turning');
      for (var i = 0; i < FILES.length; i++) {
        await LAB.sleep(XR.reduce ? 20 : 230 + Math.random() * 160);
        if (step !== 2) return;
        list.insertAdjacentHTML('afterbegin', '<li>' + XR.esc(FILES[i]) + '</li>');
        bar.style.setProperty('--p', ((i + 1) / FILES.length).toFixed(3));
      }
      var r = LAB.rng(String(Date.now())), ab = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      key = 'KGL-' + [0, 1, 2].map(function () { var s = ''; for (var k = 0; k < 4; k++) s += ab[(r() * ab.length) | 0]; return s; }).join('-');
      XR.$('h4', slip).textContent = 'Installed.';
      var kl = XR.$('.pb-keyline', slip);
      kl.innerHTML = '<span class="cr-mini">鍵</span>License ' + key + ' registered';
      kl.hidden = false;
      XR.$('.pb-act', slip).hidden = false;
      busy = false;
    }
    function openApp() {
      step = 3; paintSteps();
      steps[3].classList.add('is-done');
      box.classList.add('is-open');
      setTimeout(function () {
        table.classList.add('is-app');
        rows = CLIENTS.slice(0, 4).map(function (c, i) { return { c: c[0], k: c[1], n: 1041 + i, amt: [4500, 12800, 2300, 7600][i], paid: i % 2 === 1 }; });
        app.hidden = false;
        renderApp();
      }, XR.reduce ? 0 : 750);
    }
    function money(v) { return '৳' + v.toLocaleString('en-US'); }
    function renderApp() {
      var unpaid = rows.filter(function (r) { return !r.paid; }).reduce(function (a, r) { return a + r.amt; }, 0);
      var paid = rows.filter(function (r) { return r.paid; }).reduce(function (a, r) { return a + r.amt; }, 0);
      app.innerHTML = '<div class="pb-appbar"><span class="mk-dots" aria-hidden="true"><i></i><i></i><i></i></span><b>Kage Ledger ' + ver + ' — Invoices</b>' +
        (ver === '2.4' ? '<button type="button" class="pb-upd" data-upd>' + XR.icon('refresh') + 'Update 2.5 ready</button>' : '<button type="button" class="pb-upd" disabled>' + XR.icon('check') + 'Up to date</button>') + '</div>' +
        '<div class="pb-body"><ul class="pb-nav"><li class="is-on"><span class="jp">帳</span>Invoices</li><li><span class="jp">客</span>Clients</li><li><span class="jp">表</span>Reports</li><li><span class="jp">設</span>Settings</li></ul>' +
        '<div class="pb-main"><div class="pb-stats"><div><small>Unpaid</small><b>' + money(unpaid) + '</b></div><div><small>Paid</small><b>' + money(paid) + '</b></div><div><small>Invoices</small><b>' + rows.length + '</b></div></div>' +
        '<ul class="pb-rows">' + rows.map(function (r, i) {
          return '<li><span><b>' + XR.esc(r.c) + '</b><small>INV-' + r.n + ' · ' + r.k + '</small></span><b>' + money(r.amt) + '</b><button type="button" class="pb-paid" aria-pressed="' + r.paid + '" data-i="' + i + '" aria-label="Paid">' + (r.paid ? '済' : '未') + '</button></li>';
        }).join('') + '</ul>' +
        '<div class="pb-tools"><button type="button" class="btn btn-primary btn-sm" data-add>' + XR.icon('plus') + 'New invoice</button><span class="pb-lk">License <b>' + key + '</b> · <button type="button" class="pb-back" data-reset style="text-decoration:underline">put it back in the box</button></span></div></div></div>';
    }
    stage.addEventListener('click', function (e) {
      var t = e.target.closest('[data-go], [data-add], [data-upd], [data-reset], .pb-paid');
      if (!t || busy) return;
      if (t.hasAttribute('data-go')) { var s = +t.getAttribute('data-go'); if (s === 3) openApp(); else go(s); return; }
      if (t.hasAttribute('data-add')) { var c = CLIENTS[rows.length % CLIENTS.length]; rows.unshift({ c: c[0], k: c[1], n: 1041 + rows.length, amt: 1500 + ((rows.length * 3700) % 9000), paid: false }); renderApp(); return; }
      if (t.classList.contains('pb-paid')) { var r = rows[+t.getAttribute('data-i')]; r.paid = !r.paid; renderApp(); return; }
      if (t.hasAttribute('data-upd')) {
        t.disabled = true; t.innerHTML = XR.icon('refresh') + 'Downloading…';
        setTimeout(function () { ver = '2.5'; renderApp(); XR.toast('Kage Ledger updated to 2.5 (demo)'); }, XR.reduce ? 0 : 1300);
        return;
      }
      if (t.hasAttribute('data-reset')) { app.hidden = true; app.innerHTML = ''; table.classList.remove('is-app'); box.classList.remove('is-open', 'is-turning'); ver = '2.4'; go(0); }
    });
    /* the glowing panel can be pushed by hand too */
    slides.forEach(function (s, i) { s.addEventListener('click', function () { if (!busy && i === step && step < 2) go(step + 1); }); });
    go(0);
  });
})();
