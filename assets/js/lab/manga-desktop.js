/* Lab stage 05 — the installer arc: a 4-panel manga page that "installs" a desktop app (demo only, nothing real happens) */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  var LABELS = ['Download', 'Install', 'License', 'Launch'];
  var KANJI = ['\u58f1', '\u5f10', '\u53c2', '\u8086']; /* 壱 弐 参 肆 */
  var DEFAULT_PATH = 'C:\\Program Files\\Kage Ledger';
  var FILES = ['ledger-core.dll', 'invoices.db', 'printer-driver.dll', 'report-engine.dll', 'ui-assets.pak', 'currency-bn.locale', 'backup-service.exe', 'sqlite3.dll', 'update-agent.exe', 'license-guard.dll'];
  var NAMES = ['Nabila Mart', 'Bashundhara Traders', 'Green Leaf Store', 'Dhaka Electronics', 'Sultana Boutique', 'Hasan Hardware', 'Karwan Bazar Foods', 'Chowdhury Textiles'];
  var KEYCH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; /* no ambiguous chars */
  var OTHER_TEXT = {
    customers: 'Customer profiles, order history and notes \u2014 coming soon in this demo.',
    reports: 'Sales, tax and cash-flow reports \u2014 coming soon in this demo.',
    settings: 'Company details, tax rate and printer setup \u2014 coming soon in this demo.'
  };

  function fmtTaka(n) { return '\u09f3' + Math.round(n).toLocaleString('en-US'); }
  function defaultInvoices() {
    return [
      { client: 'Anika Traders', amount: 12500, paid: true },
      { client: 'Rahim General Store', amount: 8400, paid: false },
      { client: 'Mou Fashion House', amount: 15200, paid: true },
      { client: 'Karim & Sons', amount: 6300, paid: false }
    ];
  }

  LAB.register('desktop', function (stage) {
    var rand = LAB.rng('kage-ledger-' + Date.now());
    var pageHidden = document.hidden, stageVisible = true;
    document.addEventListener('visibilitychange', function () { pageHidden = document.hidden; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { stageVisible = en[0].isIntersecting; }, { threshold: 0 });
      io.observe(stage);
    }
    function paused() { return pageHidden || !stageVisible; }

    function genGroup() {
      var s = '';
      for (var i = 0; i < 4; i++) s += KEYCH.charAt(Math.floor(rand() * KEYCH.length));
      return s;
    }
    function genKey() { return 'KGL-' + genGroup() + '-' + genGroup() + '-' + genGroup(); }

    var state = {
      step: 0, farthest: 0, busy: false,
      path: DEFAULT_PATH, shortcut: true, startup: false,
      downloaded: false, installed: false, activated: false, launchedOnce: false,
      licenseKey: genKey(), version: '2.4', invoices: defaultInvoices()
    };

    /* ---------------------------------------------------------------
       markup
       --------------------------------------------------------------- */
    function lockHtml() {
      return '<div class="mis-lock" aria-hidden="true">' + XR.icon('lock') + '<b>?</b><span>Locked</span></div>';
    }
    function panel0() {
      return '<div class="mis-panel km-panel" data-step="0">' + lockHtml() +
        '<span class="mis-badge" hidden>' + XR.icon('check') + '</span>' +
        '<div class="mis-body">' +
        '<span class="km-cap">01 &middot; Download</span>' +
        '<div class="mis-fly" aria-hidden="true"><div class="km-speed is-dark"></div>' +
        '<div class="mis-file"><span class="mis-file-fold"></span><b>.EXE</b></div>' +
        '<span class="km-sfx is-red mis-sfx-dl">\u30b7\u30e5\u30c3</span></div>' +
        '<p class="mis-note">KageLedger-Setup.exe &middot; 48 MB</p>' +
        '<div class="mis-progress-row"><div class="mis-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Download progress"><i style="--p:0"></i></div><span class="mis-pct" aria-hidden="true">0%</span></div>' +
        '<div class="mis-actions"><button type="button" class="km-btn is-red" data-act="download">' + XR.icon('download') + 'Download KageLedger-Setup.exe (48 MB)</button>' +
        '<button type="button" class="km-btn is-ink" data-act="to-install" hidden>Continue to install ' + XR.icon('arrow-right') + '</button></div>' +
        '</div></div>';
    }
    function panel1() {
      return '<div class="mis-panel km-panel" data-step="1">' + lockHtml() +
        '<span class="mis-badge" hidden>' + XR.icon('check') + '</span>' +
        '<div class="mis-body">' +
        '<span class="km-cap">02 &middot; Install</span>' +
        '<label class="mis-field"><span>Install folder</span><input type="text" class="mis-in mis-path" value="' + XR.esc(DEFAULT_PATH) + '" spellcheck="false"></label>' +
        '<div class="mis-checks"><label class="mis-check"><input type="checkbox" class="mis-shortcut" checked>Desktop shortcut</label>' +
        '<label class="mis-check"><input type="checkbox" class="mis-startup">Start with Windows</label></div>' +
        '<div class="mis-installing" hidden>' +
        '<div class="mis-row"><div class="mis-gama"><img src="assets/img/characters/gama.webp" alt="" width="60" height="60" loading="lazy">' +
        '<span class="mis-drop" aria-hidden="true"></span><span class="mis-drop d2" aria-hidden="true"></span></div>' +
        '<span class="km-sfx is-gold mis-sfx-install">\u30b4\u30b4\u30b4</span></div>' +
        '<p class="mis-file-tick" aria-hidden="true">&nbsp;</p>' +
        '<div class="mis-progress-row"><div class="mis-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Install progress"><i style="--p:0"></i></div><span class="mis-pct" aria-hidden="true">0%</span></div>' +
        '</div>' +
        '<div class="mis-actions"><button type="button" class="km-btn is-red" data-act="install">Install</button>' +
        '<button type="button" class="km-btn is-ink" data-act="to-license" hidden>Continue to license ' + XR.icon('arrow-right') + '</button></div>' +
        '</div></div>';
    }
    function panel2() {
      return '<div class="mis-panel km-panel" data-step="2">' + lockHtml() +
        '<span class="mis-badge" hidden>' + XR.icon('check') + '</span>' +
        '<div class="mis-body">' +
        '<span class="km-cap">03 &middot; License</span>' +
        '<div class="mis-key-wrap"><p class="mis-key">' + XR.esc(state.licenseKey) + '</p>' +
        '<div class="mis-stamp" aria-hidden="true"><span class="jp">\u8a8d\u8a3c</span></div></div>' +
        '<p class="mis-note">A key was emailed to you. Demo keys always work.</p>' +
        '<div class="mis-actions"><button type="button" class="km-btn is-red" data-act="activate">' + XR.icon('key') + 'Activate</button>' +
        '<button type="button" class="km-btn is-ink" data-act="to-launch" hidden>Continue to launch ' + XR.icon('arrow-right') + '</button></div>' +
        '</div></div>';
    }
    function panel3() {
      return '<div class="mis-panel km-panel" data-step="3">' + lockHtml() +
        '<div class="mis-body">' +
        '<div class="km-focus" aria-hidden="true"></div>' +
        '<span class="km-sfx is-red mis-sfx-launch">\u30d0\u30fc\u30f3!</span>' +
        '<span class="km-cap">04 &middot; Launch</span>' +
        '<div class="mis-app">' +
        '<div class="mis-appbar"><span class="mis-dots" aria-hidden="true"><i></i><i></i><i></i></span><b>Kage Ledger</b><span class="mis-ver">v' + state.version + '</span></div>' +
        '<div class="mis-appwrap">' +
        '<nav class="mis-side">' +
        '<button type="button" class="is-on" data-act="nav" data-view="invoices">' + XR.icon('database') + 'Invoices</button>' +
        '<button type="button" data-act="nav" data-view="customers">' + XR.icon('box') + 'Customers</button>' +
        '<button type="button" data-act="nav" data-view="reports">' + XR.icon('server') + 'Reports</button>' +
        '<button type="button" data-act="nav" data-view="settings">' + XR.icon('shield') + 'Settings</button>' +
        '</nav>' +
        '<div class="mis-main">' +
        '<div class="mis-toolbar"><button type="button" class="km-btn" data-act="new-invoice">' + XR.icon('plus') + 'New invoice</button>' +
        '<button type="button" class="km-btn is-ink" data-act="update">' + XR.icon('refresh') + 'Update 2.5 available</button></div>' +
        '<div class="mis-view-invoices"><div class="mis-table-wrap"><table class="mis-table"><thead><tr><th>Client</th><th>Amount</th><th>Status</th></tr></thead><tbody class="mis-tbody"></tbody></table></div></div>' +
        '<div class="mis-view-other" hidden><p class="mis-note"></p></div>' +
        '</div></div></div>' +
        '<div class="mis-actions"><button type="button" class="km-btn is-red" data-act="uninstall">' + XR.icon('close') + 'Uninstall</button></div>' +
        '</div></div>';
    }
    function stepsHtml() {
      var out = '<ol class="mis-steps" role="list"><i class="mis-steps-line" aria-hidden="true"></i>';
      LABELS.forEach(function (l, i) {
        out += '<li><button type="button" class="mis-step" data-act="jump" data-step="' + i + '"><b class="jp">' + KANJI[i] + '</b><small>' + l + '</small></button></li>';
      });
      return out + '</ol>';
    }

    stage.innerHTML = '<div class="mis-wrap km-in">' +
      '<div class="mis-top"><span class="km-tag is-red">Demo &mdash; nothing is really installed</span>' + stepsHtml() + '</div>' +
      '<p class="mis-live sr-only" aria-live="polite"></p>' +
      '<div class="km-page mis-page">' + panel0() + panel1() + panel2() + panel3() + '</div>' +
      '</div>';

    var panels = XR.$$('.mis-panel', stage);
    var stepBtns = XR.$$('.mis-step', stage);
    var lineEl = XR.$('.mis-steps-line', stage);
    var live = XR.$('.mis-live', stage);

    function announce(msg) { live.textContent = msg; }
    function pop(el, cls) {
      if (!el) return;
      cls = cls || 'is-pop';
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }
    function playTurn(el) {
      el.classList.remove('mis-turn');
      void el.offsetWidth;
      el.classList.add('mis-turn');
    }
    function setInteractive(panel, on) {
      XR.$$('button, input', panel).forEach(function (el) {
        if (el.closest('.mis-lock')) return;
        el.disabled = !on;
      });
    }
    function applyLocks() {
      panels.forEach(function (p, i) {
        var locked = i > state.farthest;
        p.classList.toggle('is-locked', locked);
        setInteractive(p, !locked);
      });
    }
    function updateDoneBadges() {
      XR.$('.mis-badge', panels[0]).hidden = !state.downloaded;
      XR.$('.mis-badge', panels[1]).hidden = !state.installed;
      XR.$('.mis-badge', panels[2]).hidden = !state.activated;
    }
    function updateSteps() {
      var done = [state.downloaded, state.installed, state.activated, false];
      stepBtns.forEach(function (b, i) {
        b.disabled = i > state.farthest;
        b.classList.toggle('is-current', i === state.step);
        b.classList.toggle('is-done', done[i] && i !== state.step);
        if (i === state.step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      if (lineEl) lineEl.style.setProperty('--p', (state.farthest / 3).toFixed(3));
    }
    function setCurrent(n) {
      panels.forEach(function (p, i) { p.classList.toggle('is-current', i === n); });
    }

    function goToStep(n) {
      n = XR.clamp(n, 0, 3);
      if (n > state.farthest || n === state.step) return;
      state.step = n;
      setCurrent(n);
      updateSteps();
      playTurn(panels[n]);
      if (n === 3 && !state.launchedOnce) { state.launchedOnce = true; pop(XR.$('.mis-sfx-launch', panels[3])); }
      announce('Step ' + (n + 1) + ' of 4: ' + LABELS[n] + '.');
    }

    function setPct(bar, pctEl, pct) {
      var i = XR.$('i', bar);
      if (i) i.style.setProperty('--p', (pct / 100).toFixed(3));
      bar.setAttribute('aria-valuenow', Math.round(pct));
      if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    }
    function runProgress(bar, pctEl, onTick, onDone, ms) {
      var pct = 0;
      var id = setInterval(function () {
        if (paused()) return;
        pct += 7 + rand() * 11;
        if (pct >= 100) pct = 100;
        setPct(bar, pctEl, pct);
        if (onTick) onTick(pct);
        if (pct >= 100) { clearInterval(id); onDone(); }
      }, ms || 140);
    }

    /* ---------------------------------------------------------------
       panel actions
       --------------------------------------------------------------- */
    function startDownload() {
      if (state.busy) return;
      state.busy = true;
      var btn = XR.$('[data-act="download"]', panels[0]);
      btn.disabled = true;
      XR.$('.mis-fly', panels[0]).classList.add('is-go');
      pop(XR.$('.mis-sfx-dl', panels[0]));
      announce('Downloading KageLedger-Setup.exe, 48 megabytes.');
      var bar = XR.$('.mis-bar', panels[0]), pctEl = XR.$('.mis-pct', panels[0]);
      runProgress(bar, pctEl, null, function () {
        state.busy = false;
        state.downloaded = true;
        state.farthest = Math.max(state.farthest, 1);
        btn.hidden = true;
        XR.$('[data-act="to-install"]', panels[0]).hidden = false;
        applyLocks(); updateDoneBadges(); updateSteps();
        announce('Download complete. Ready to install.');
      });
    }
    function startInstall() {
      if (state.busy) return;
      state.busy = true;
      var btn = XR.$('[data-act="install"]', panels[1]);
      btn.disabled = true;
      var wrap = XR.$('.mis-installing', panels[1]);
      wrap.hidden = false;
      pop(XR.$('.mis-sfx-install', panels[1]));
      pop(XR.$('.mis-gama', panels[1]), 'is-sweat');
      panels[1].classList.add('km-shake');
      setTimeout(function () { panels[1].classList.remove('km-shake'); }, 420);
      announce('Installing to ' + state.path + '.');
      var bar = XR.$('.mis-bar', wrap), pctEl = XR.$('.mis-pct', wrap), tick = XR.$('.mis-file-tick', wrap), fi = 0;
      runProgress(bar, pctEl, function () {
        tick.textContent = 'Copying ' + FILES[fi % FILES.length] + '\u2026';
        fi++;
      }, function () {
        state.busy = false;
        state.installed = true;
        state.farthest = Math.max(state.farthest, 2);
        btn.hidden = true;
        tick.textContent = 'Done.';
        XR.$('[data-act="to-license"]', panels[1]).hidden = false;
        applyLocks(); updateDoneBadges(); updateSteps();
        announce('Install complete.');
      }, 170);
    }
    function activateLicense() {
      if (state.busy) return;
      state.busy = true;
      var btn = XR.$('[data-act="activate"]', panels[2]);
      btn.disabled = true;
      announce('Activating license ' + state.licenseKey + '.');
      setTimeout(function () {
        pop(XR.$('.mis-stamp', panels[2]), 'is-on');
        panels[2].classList.add('km-shake');
        setTimeout(function () { panels[2].classList.remove('km-shake'); }, 420);
        state.busy = false;
        state.activated = true;
        state.farthest = Math.max(state.farthest, 3);
        btn.hidden = true;
        XR.$('[data-act="to-launch"]', panels[2]).hidden = false;
        applyLocks(); updateDoneBadges(); updateSteps();
        announce('License activated.');
      }, XR.reduce ? 30 : 260);
    }
    function runUpdate() {
      if (state.busy || state.version === '2.5') return;
      state.busy = true;
      var btn = XR.$('[data-act="update"]', panels[3]);
      btn.disabled = true;
      btn.innerHTML = XR.icon('refresh', 'mis-spin') + 'Updating\u2026';
      announce('Updating Kage Ledger to version 2.5.');
      setTimeout(function () {
        state.version = '2.5';
        XR.$('.mis-ver', panels[3]).textContent = 'v2.5';
        btn.innerHTML = XR.icon('check') + 'Up to date';
        state.busy = false;
        announce('Kage Ledger updated to version 2.5.');
        XR.toast('Kage Ledger updated to v2.5.');
      }, XR.reduce ? 60 : 900);
    }

    /* ---------------------------------------------------------------
       invoices
       --------------------------------------------------------------- */
    function invoiceRow(inv, i) {
      return '<tr><td>' + XR.esc(inv.client) + '</td><td class="mis-amt">' + fmtTaka(inv.amount) + '</td>' +
        '<td><button type="button" class="mis-stamp-btn ' + (inv.paid ? 'is-paid' : 'is-unpaid') + '" data-act="toggle-paid" data-idx="' + i + '" aria-pressed="' + inv.paid + '">' + (inv.paid ? 'Paid' : 'Unpaid') + '</button></td></tr>';
    }
    function renderInvoices() {
      XR.$('.mis-tbody', panels[3]).innerHTML = state.invoices.map(invoiceRow).join('');
    }
    function toggleInvoice(i) {
      var inv = state.invoices[i];
      if (!inv) return;
      inv.paid = !inv.paid;
      renderInvoices();
      announce(inv.client + ' marked ' + (inv.paid ? 'paid' : 'unpaid') + '.');
    }
    function addInvoice() {
      var name = NAMES[Math.floor(rand() * NAMES.length)];
      var amount = Math.round((1800 + rand() * 18000) / 50) * 50;
      state.invoices.unshift({ client: name, amount: amount, paid: false });
      renderInvoices();
      announce('New invoice added for ' + name + ', ' + fmtTaka(amount) + '.');
    }
    function setView(view) {
      XR.$$('.mis-side button', panels[3]).forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-view') === view); });
      XR.$('.mis-view-invoices', panels[3]).hidden = view !== 'invoices';
      XR.$('.mis-view-other', panels[3]).hidden = view === 'invoices';
      XR.$('[data-act="new-invoice"]', panels[3]).hidden = view !== 'invoices';
      if (view !== 'invoices') XR.$('.mis-view-other p', panels[3]).textContent = OTHER_TEXT[view];
    }

    /* ---------------------------------------------------------------
       uninstall / reset
       --------------------------------------------------------------- */
    function resetAll() {
      state.busy = false; state.step = 0; state.farthest = 0;
      state.downloaded = false; state.installed = false; state.activated = false; state.launchedOnce = false;
      state.path = DEFAULT_PATH; state.shortcut = true; state.startup = false;
      state.version = '2.4'; state.invoices = defaultInvoices(); state.licenseKey = genKey();

      XR.$('.mis-path', panels[1]).value = state.path;
      XR.$('.mis-shortcut', panels[1]).checked = true;
      XR.$('.mis-startup', panels[1]).checked = false;

      var dl = XR.$('[data-act="download"]', panels[0]); dl.hidden = false; dl.disabled = false;
      XR.$('[data-act="to-install"]', panels[0]).hidden = true;
      setPct(XR.$('.mis-bar', panels[0]), XR.$('.mis-pct', panels[0]), 0);
      XR.$('.mis-fly', panels[0]).classList.remove('is-go');

      var inst = XR.$('[data-act="install"]', panels[1]); inst.hidden = false; inst.disabled = false;
      XR.$('[data-act="to-license"]', panels[1]).hidden = true;
      XR.$('.mis-installing', panels[1]).hidden = true;
      setPct(XR.$('.mis-bar', panels[1]), XR.$('.mis-pct', panels[1]), 0);
      XR.$('.mis-gama', panels[1]).classList.remove('is-sweat');

      XR.$('.mis-key', panels[2]).textContent = state.licenseKey;
      XR.$('.mis-stamp', panels[2]).classList.remove('is-on');
      var act = XR.$('[data-act="activate"]', panels[2]); act.hidden = false; act.disabled = false;
      XR.$('[data-act="to-launch"]', panels[2]).hidden = true;

      XR.$('.mis-ver', panels[3]).textContent = 'v2.4';
      var ub = XR.$('[data-act="update"]', panels[3]); ub.disabled = false; ub.innerHTML = XR.icon('refresh') + 'Update 2.5 available';
      setView('invoices');
      renderInvoices();

      panels.forEach(function (p) { XR.$('.mis-badge', p) && (XR.$('.mis-badge', p).hidden = true); });
      applyLocks();
      setCurrent(0);
      updateSteps();
      playTurn(panels[0]);
      announce('Kage Ledger uninstalled. Back to download.');
      XR.toast('Kage Ledger uninstalled.');
    }

    /* ---------------------------------------------------------------
       wiring
       --------------------------------------------------------------- */
    stage.addEventListener('click', function (e) {
      if (e.target.closest('.mis-lock')) { XR.toast('Finish this page first.'); return; }
      var btn = e.target.closest('[data-act]');
      if (!btn || btn.disabled) return;
      switch (btn.getAttribute('data-act')) {
        case 'download': startDownload(); break;
        case 'to-install': goToStep(1); break;
        case 'install': startInstall(); break;
        case 'to-license': goToStep(2); break;
        case 'activate': activateLicense(); break;
        case 'to-launch': goToStep(3); break;
        case 'uninstall': resetAll(); break;
        case 'new-invoice': addInvoice(); break;
        case 'update': runUpdate(); break;
        case 'toggle-paid': toggleInvoice(+btn.getAttribute('data-idx')); break;
        case 'nav': setView(btn.getAttribute('data-view')); break;
        case 'jump': goToStep(+btn.getAttribute('data-step')); break;
      }
    });
    XR.$('.mis-path', panels[1]).addEventListener('input', function (e) { state.path = e.target.value; });
    XR.$('.mis-shortcut', panels[1]).addEventListener('change', function (e) { state.shortcut = e.target.checked; });
    XR.$('.mis-startup', panels[1]).addEventListener('change', function (e) { state.startup = e.target.checked; });

    applyLocks();
    setCurrent(0);
    updateDoneBadges();
    updateSteps();
    renderInvoices();
    announce('Step 1 of 4: Download.');
  });
})();
