/* Lab stage 02 — shadow clone cron: scripts as kage bunshin that run while the owner sleeps */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  /* each clone = one automation script. lines: [text, kind] kind is k(cmd) a(info) s(ok) */
  var CLONES = [
    { id: 'prices', file: 'prices.py', desc: 'Watches competitor prices, hour by hour.', cron: '*/30 * * * *', icon: 'trending',
      lines: [['$ python prices.py --sites 12', 'k'], ['checked 62 products this pass', 'a'], ['3 price drops -> sheet updated', 's']],
      n: '312', label: 'prices checked' },
    { id: 'fbpost', file: 'fb-post.js', desc: 'Keeps the Facebook page fed.', cron: '0 9,17 * * *', icon: 'send',
      lines: [['$ node fb-post.js', 'k'], ['queued 1 image + caption', 'a'], ['posted to @xiraiya.dev', 's']],
      n: '3', label: 'posts published' },
    { id: 'invoices', file: 'invoices.js', desc: 'Bills the clients so you do not have to.', cron: '0 9 * * 1', icon: 'mail',
      lines: [['$ node invoices.js --send', 'k'], ['generated 6 PDFs', 'a'], ['sent 6 emails via SMTP', 's']],
      n: '18', label: 'invoices sent' },
    { id: 'backup', file: 'backup.sh', desc: 'Dumps the database somewhere safe.', cron: '0 3 * * *', icon: 'database',
      lines: [['$ bash backup.sh', 'k'], ['pg_dump -> backup-0926.sql.gz', 'a'], ['uploaded to s3://backups', 's']],
      n: '1.2 GB', label: 'backup size' }
  ];

  function fmtClock(h) { return (h < 10 ? '0' + h : String(h)) + ':00'; }

  function sceneSvg() {
    return '<svg class="mcl-scene" viewBox="0 0 220 120" aria-hidden="true" focusable="false">' +
      '<circle class="mcl-star" cx="26" cy="18" r="1.4"/><circle class="mcl-star" cx="60" cy="10" r="1.1"/>' +
      '<circle class="mcl-star" cx="150" cy="14" r="1.3"/><circle class="mcl-star" cx="190" cy="30" r="1.1"/>' +
      '<circle class="mcl-star" cx="110" cy="8" r="1"/>' +
      '<path class="mcl-bed" d="M20 96h100M20 96c0-7 4-11 11-11h78c7 0 11 4 11 11M24 85V70a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v15" />' +
      '<path class="mcl-blanket" d="M20 96l4-20h96l6 20z"/>' +
      '</svg>';
  }

  function moonSvg() {
    return '<svg class="mcl-moon" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
      '<path d="M33 25.5A15 15 0 1 1 14.5 7a12 12 0 0 0 18.5 18.5z"/></svg>';
  }

  function cloneCard(c, i) {
    return '<div class="mcl-clone" data-clone="' + c.id + '">' +
      '<div class="mcl-clone-head">' +
      '<div class="mcl-portrait mcl-t' + (i % 4) + '"><span class="mcl-num">' + (i + 1) + '</span><img src="assets/img/characters/xiraiya-avatar.webp" alt="" loading="lazy" width="64" height="64"></div>' +
      '<div class="mcl-clone-meta">' +
      '<b>' + XR.icon(c.icon, 'mcl-fico') + '<span>' + XR.esc(c.file) + '</span></b>' +
      '<code class="mcl-cron">' + XR.esc(c.cron) + '</code>' +
      '<span class="mcl-clone-desc">' + XR.esc(c.desc) + '</span>' +
      '</div>' +
      '<button type="button" class="mcl-toggle" role="switch" aria-checked="true" aria-label="' + XR.esc(c.file) + ' schedule">' +
      '<i class="mcl-toggle-track"><i class="mcl-toggle-thumb"></i></i><span class="mcl-toggle-txt">On</span>' +
      '</button>' +
      '</div>' +
      '<div class="mcl-bar" aria-hidden="true"><i></i></div>' +
      '<pre class="mcl-log" aria-hidden="true"></pre>' +
      '<div class="mcl-resting" aria-hidden="true">' + XR.icon('clock') + '<span>Resting tonight — switched off</span></div>' +
      '<div class="mcl-seal jp" aria-hidden="true">済</div>' +
      '</div>';
  }

  function statTile(c) {
    return '<div class="mcl-stat" data-stat="' + c.id + '"><b>' + XR.esc(c.n) + '</b><small>' + XR.esc(c.label) + '</small></div>';
  }

  function markup() {
    var i, html = '<div class="km-page mcl-page">';

    html += '<div class="km-panel km-tone-dark km-slant mcl-p-sleep">' +
      '<div class="km-hlines is-dark"></div>' +
      '<div class="km-cap">02 &middot; Shadow Clone Cron</div>' +
      moonSvg() +
      sceneSvg() +
      '<div class="km-think mcl-zzz">Zzz&hellip;</div>' +
      '<div class="mcl-clock" aria-hidden="true"><span class="mcl-clock-lbl">Night watch</span><b class="mcl-clock-time">00:00</b></div>' +
      '<p class="mcl-sleep-cap">While the owner sleeps, four shadow clones keep the shop running.</p>' +
      '</div>';

    html += '<div class="km-panel km-tone mcl-p-summon">' +
      '<div class="km-speed"></div>' +
      '<h3 class="km-h">Kage Bunshin no Jutsu</h3>' +
      '<p class="mcl-summon-cap">Four scripts, four clones. Flip any of them off first if you like.</p>' +
      '<button type="button" class="km-btn is-red mcl-summon"><span class="jp mcl-jp">影分身</span> Summon clones ' + XR.icon('zap') + '</button>' +
      '<div class="km-sfx is-red mcl-sfx-pop" aria-hidden="true">ボン!</div>' +
      '<p class="mcl-status" aria-live="polite">&gt; status: idle, four scripts resting</p>' +
      '</div>';

    html += '<div class="km-panel km-tone-2 mcl-p-clones"><div class="km-cap">The clones</div><div class="mcl-clones-grid">';
    for (i = 0; i < CLONES.length; i++) html += cloneCard(CLONES[i], i);
    html += '</div></div>';

    html += '<div class="km-panel km-tone-red km-slant mcl-p-report">' +
      '<div class="km-focus"></div>' +
      '<div class="km-cap">Morning report</div>' +
      '<div class="km-sfx is-gold mcl-sfx-chirp" aria-hidden="true">チュン</div>' +
      '<div class="mcl-report-body">' +
      '<p class="mcl-hint">Summon the clones to see what got done while you slept.</p>' +
      '<div class="mcl-report-grid">';
    for (i = 0; i < CLONES.length; i++) html += statTile(CLONES[i]);
    html += '</div>' +
      '<p class="mcl-report-line">Time you spent: <b>0 min</b></p>' +
      '<button type="button" class="km-btn mcl-again">Run again ' + XR.icon('refresh') + '</button>' +
      '</div></div>';

    html += '</div>';
    return html;
  }

  LAB.register('automation', function (stage) {
    stage.innerHTML = markup();

    var page = XR.$('.mcl-page', stage);
    var summonBtn = XR.$('.mcl-summon', stage);
    var againBtn = XR.$('.mcl-again', stage);
    var statusEl = XR.$('.mcl-status', stage);
    var clockEl = XR.$('.mcl-clock-time', stage);
    var reportPanel = XR.$('.mcl-p-report', stage);
    var sfxChirp = XR.$('.mcl-sfx-chirp', stage);
    var sfxPop = XR.$('.mcl-sfx-pop', stage);
    var smokeHost = summonBtn;
    var toggles = {};
    var cards = {};

    CLONES.forEach(function (c) {
      var card = stage.querySelector('[data-clone="' + c.id + '"]');
      cards[c.id] = { el: card, log: XR.$('.mcl-log', card), bar: XR.$('.mcl-bar i', card), on: true };
      toggles[c.id] = XR.$('.mcl-toggle', card);
    });

    var running = false, runTimer = 0, stageVisible = true;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { stageVisible = en[0].isIntersecting; }, { threshold: 0.05 });
      io.observe(stage);
    }

    function say(msg) { statusEl.textContent = '> status: ' + msg; }

    function setToggle(id, on) {
      var c = cards[id], btn = toggles[id];
      c.on = on;
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      XR.$('.mcl-toggle-txt', btn).textContent = on ? 'On' : 'Off';
      c.el.classList.toggle('is-off', !on);
    }

    function lockToggles(locked) {
      CLONES.forEach(function (c) { toggles[c.id].disabled = locked; });
    }

    CLONES.forEach(function (c) {
      toggles[c.id].addEventListener('click', function () {
        if (running) return;
        setToggle(c.id, !cards[c.id].on);
      });
    });

    function poof() {
      if (XR.reduce) return;
      var box = document.createElement('div');
      box.className = 'mcl-smoke';
      box.setAttribute('aria-hidden', 'true');
      var n, p;
      for (n = 0; n < 5; n++) {
        p = document.createElement('i');
        p.style.setProperty('--d', (n * 70) + 'ms');
        p.style.setProperty('--x', (Math.round((n - 2) * 14)) + 'px');
        box.appendChild(p);
      }
      smokeHost.appendChild(box);
      setTimeout(function () { box.remove(); }, 1000);
    }

    function retrigger(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    /* pop an SFX glyph in, then drop it again once its fade-out finishes so it never lingers on screen */
    function popSfx(el) {
      clearTimeout(el._mclT);
      retrigger(el, 'is-pop');
      el._mclT = setTimeout(function () { el.classList.remove('is-pop'); }, 1250);
    }

    function resetClones() {
      CLONES.forEach(function (c) {
        var card = cards[c.id].el;
        card.classList.remove('is-running', 'is-done', 'is-active');
        cards[c.id].log.textContent = '';
        cards[c.id].bar.style.transitionDuration = '0s';
        cards[c.id].bar.style.transform = 'scaleX(0)';
      });
    }

    function startClone(c, dur) {
      var card = cards[c.id].el, bar = cards[c.id].bar;
      card.classList.add('is-active', 'is-running');
      say('running ' + c.file + '...');
      bar.style.transitionDuration = (XR.reduce ? 60 : dur) + 'ms';
      bar.style.transform = 'scaleX(1)';
    }

    function appendLog(c, line) {
      var pre = cards[c.id].log;
      var span = document.createElement('span');
      span.className = line[1];
      span.textContent = line[0];
      pre.appendChild(span);
      pre.appendChild(document.createTextNode('\n'));
      pre.scrollTop = pre.scrollHeight;
    }

    function finishClone(c) {
      var card = cards[c.id].el;
      card.classList.remove('is-running');
      card.classList.add('is-done');
      say(c.file + ' done, seal stamped');
    }

    function setClock(h) {
      clockEl.textContent = fmtClock(h);
      retrigger(clockEl, 'km-shake');
    }

    function showReport() {
      reportPanel.classList.add('is-ready');
      CLONES.forEach(function (c) {
        var tile = reportPanel.querySelector('[data-stat="' + c.id + '"]');
        var on = cards[c.id].on;
        tile.classList.toggle('is-off', !on);
        tile.querySelector('b').textContent = on ? c.n : '0';
        tile.querySelector('small').textContent = c.label + (on ? '' : ' (resting)');
      });
      popSfx(sfxChirp);
      say('morning report ready, all clones dismissed');
      summonBtn.disabled = false;
      lockToggles(false);
      running = false;
    }

    function buildSteps() {
      var enabled = CLONES.filter(function (c) { return cards[c.id].on; });
      var rng = LAB.rng(Date.now()), steps = [], scale = XR.reduce ? .35 : 1;
      var STAGGER = 260 * scale, MIN_DUR = 1500 * scale, MAX_DUR = 2300 * scale, maxEnd = 0;

      enabled.forEach(function (c, i) {
        var start = 220 * scale + i * STAGGER;
        var dur = Math.round(MIN_DUR + rng() * (MAX_DUR - MIN_DUR));
        var end = start + dur, fracs = [.28, .6, .92];
        if (end > maxEnd) maxEnd = end;
        steps.push({ t: start, fn: (function (c, dur) { return function () { startClone(c, dur); }; })(c, dur) });
        c.lines.forEach(function (line, li) {
          steps.push({ t: start + Math.round(dur * fracs[li]), fn: (function (c, line) { return function () { appendLog(c, line); }; })(c, line) });
        });
        steps.push({ t: end, fn: (function (c) { return function () { finishClone(c); }; })(c) });
      });

      if (!enabled.length) return null;

      var h;
      for (h = 0; h <= 7; h++) {
        steps.push({ t: Math.round((h / 7) * maxEnd), fn: (function (h) { return function () { setClock(h); }; })(h) });
      }
      steps.push({ t: maxEnd + 500 * scale, fn: showReport });
      steps.sort(function (a, b) { return a.t - b.t; });
      return steps;
    }

    function runSteps(steps) {
      var elapsed = 0, idx = 0, TICK = 90;
      if (runTimer) clearInterval(runTimer);
      runTimer = setInterval(function () {
        if (document.hidden || !stageVisible) return;
        elapsed += TICK;
        while (idx < steps.length && steps[idx].t <= elapsed) { steps[idx].fn(); idx++; }
        if (idx >= steps.length) { clearInterval(runTimer); runTimer = 0; }
      }, TICK);
    }

    function summon() {
      if (running) return;
      var steps = buildSteps();
      if (!steps) { XR.toast('All four clones are resting. Turn at least one on first.', 'warn'); return; }
      running = true;
      summonBtn.disabled = true;
      lockToggles(true);
      reportPanel.classList.remove('is-ready');
      resetClones();
      clockEl.textContent = '00:00';
      say('summoning clones...');
      retrigger(page, 'km-shake');
      popSfx(sfxPop);
      poof();
      runSteps(steps);
    }

    summonBtn.addEventListener('click', summon);
    againBtn.addEventListener('click', summon);
  });
})();
