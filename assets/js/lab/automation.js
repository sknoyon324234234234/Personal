/* Lab stage 02 — draggable automation workflow with animated data packets */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var W = 900, H = 380;

  var NODES = [
    { id: 'hook', x: 18, y: 160, icon: 'zap', t: 'Webhook', s: 'POST /new-order', c: '#ffc24b', noIn: true },
    { id: 'val', x: 222, y: 160, icon: 'code', t: 'Validate', s: 'Code · JavaScript', c: '#27e1d6' },
    { id: 'ai', x: 440, y: 58, icon: 'chip', t: 'AI Classify', s: 'LLM · priority', c: '#8b6cff' },
    { id: 'sheet', x: 440, y: 262, icon: 'grid', t: 'Google Sheets', s: 'Append row', c: '#a4ff6b' },
    { id: 'tg', x: 700, y: 18, icon: 'send', t: 'Telegram', s: 'Notify admin', c: '#2f9bff', noOut: true },
    { id: 'mail', x: 700, y: 160, icon: 'mail', t: 'Email', s: 'Send invoice', c: '#ff5fb6', noOut: true },
    { id: 'crm', x: 700, y: 302, icon: 'users', t: 'CRM', s: 'Upsert customer', c: '#ff2e4d', noOut: true }
  ];
  var EDGES = [['hook', 'val'], ['val', 'ai'], ['val', 'sheet'], ['ai', 'tg'], ['ai', 'mail'], ['sheet', 'crm']];

  var NAMES = ['Rahim U.', 'Sara K.', 'Tanvir H.', 'Maya L.', 'Arif R.', 'Nadia S.', 'John P.', 'Emma W.'];
  var ITEMS = [['Neon Katana Lamp', 59], ['Ronin Headphones', 129], ['Mecha Keyboard', 89], ['Kitsune Hoodie', 64], ['Shinobi Backpack', 79]];

  LAB.register('automation', function (stage) {
    var wrap = XR.$('.wf-canvas-wrap', stage), canvas = XR.$('.wf-canvas', stage), svg = XR.$('.wf-edges', stage);
    var log = XR.$('.wf-log', stage), status = XR.$('.wf-status', stage), runBtn = XR.$('.wf-run', stage);
    var runsEl = XR.$('.wf-runs', stage), savedEl = XR.$('.wf-saved', stage);
    var scale = 1, running = false, runs = 1284, saved = 42.5, byId = {};
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    NODES.forEach(function (n) {
      var el = document.createElement('div');
      el.className = 'wf-node' + (n.noIn ? ' no-in' : '') + (n.noOut ? ' no-out' : '');
      el.style.setProperty('--nc', n.c);
      el.style.left = n.x + 'px'; el.style.top = n.y + 'px';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', n.t + ' node — drag to move');
      el.innerHTML = '<span class="wn-ic">' + XR.icon(n.icon) + '</span><span><b>' + n.t + '</b><small>' + n.s + '</small></span><span class="wn-ok">' + XR.icon('check') + '</span>';
      canvas.appendChild(el);
      n.el = el;
      byId[n.id] = n;
      drag(n);
    });

    var paths = EDGES.map(function (e) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(p);
      return { from: byId[e[0]], to: byId[e[1]], el: p };
    });

    function edgeD(a, b) {
      var ax = a.x + 170, ay = a.y + a.el.offsetHeight / 2, bx = b.x, by = b.y + b.el.offsetHeight / 2;
      var dx = Math.max(40, Math.abs(bx - ax) * .5);
      return 'M' + ax + ' ' + ay + ' C' + (ax + dx) + ' ' + ay + ' ' + (bx - dx) + ' ' + by + ' ' + bx + ' ' + by;
    }
    function draw() { paths.forEach(function (p) { p.el.setAttribute('d', edgeD(p.from, p.to)); }); }

    function fit() {
      scale = Math.min(1, wrap.clientWidth / W);
      canvas.style.transform = 'scale(' + scale + ')';
      wrap.style.height = Math.round(H * scale) + 'px';
    }

    function drag(n) {
      var sx, sy, ox, oy, moved;
      n.el.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        n.el.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY; ox = n.x; oy = n.y; moved = false;
        n.el.classList.add('is-drag');
      });
      n.el.addEventListener('pointermove', function (e) {
        if (!n.el.hasPointerCapture(e.pointerId)) return;
        var dx = (e.clientX - sx) / scale, dy = (e.clientY - sy) / scale;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        n.x = XR.clamp(ox + dx, 0, W - 170);
        n.y = XR.clamp(oy + dy, 0, H - n.el.offsetHeight);
        n.el.style.left = n.x + 'px'; n.el.style.top = n.y + 'px';
        draw();
      });
      function up(e) { if (n.el.hasPointerCapture(e.pointerId)) n.el.releasePointerCapture(e.pointerId); n.el.classList.remove('is-drag'); }
      n.el.addEventListener('pointerup', up);
      n.el.addEventListener('pointercancel', up);
      n.el.addEventListener('keydown', function (e) {
        var k = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[e.key];
        if (!k) return;
        e.preventDefault();
        n.x = XR.clamp(n.x + k[0], 0, W - 170); n.y = XR.clamp(n.y + k[1], 0, H - n.el.offsetHeight);
        n.el.style.left = n.x + 'px'; n.el.style.top = n.y + 'px';
        draw();
      });
    }

    function line(html) {
      var p = document.createElement('p');
      p.innerHTML = '<span class="t">[' + LAB.stamp() + ']</span> ' + html;
      if (log.firstElementChild && log.firstElementChild.classList.contains('muted')) log.innerHTML = '';
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
    }

    function packet(edge) {
      return new Promise(function (resolve) {
        var path = edge.el, len = path.getTotalLength(), c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', 6); svg.appendChild(c);
        path.classList.add('is-hot');
        var t0 = performance.now(), dur = XR.reduce ? 1 : 650;
        (function step(t) {
          var k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          var pt = path.getPointAtLength(len * e);
          c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y);
          if (k < 1) requestAnimationFrame(step);
          else { c.remove(); path.classList.remove('is-hot'); resolve(); }
        })(t0);
      });
    }
    function edge(a, b) { return paths.find(function (p) { return p.from.id === a && p.to.id === b; }); }
    function activate(id) {
      var n = byId[id];
      n.el.classList.add('is-active');
      return LAB.sleep(XR.reduce ? 0 : 320).then(function () { n.el.classList.remove('is-active'); n.el.classList.add('is-done'); });
    }
    function setStatus(cls, text) { status.className = 'wf-status ' + cls; status.lastElementChild.textContent = text; }

    async function run() {
      if (running) return;
      running = true; runBtn.disabled = true;
      NODES.forEach(function (n) { n.el.classList.remove('is-done'); });
      var name = NAMES[(Math.random() * NAMES.length) | 0], item = ITEMS[(Math.random() * ITEMS.length) | 0];
      var id = 4800 + ((Math.random() * 900) | 0), prio = item[1] > 80 ? 'HIGH' : 'NORMAL';
      setStatus('is-running', 'Running');
      line('<span class="hl">webhook</span> › received order <b>#' + id + '</b> from ' + name + ' — ' + item[0] + ' ($' + item[1] + '.00)');
      await activate('hook');
      await packet(edge('hook', 'val'));
      await activate('val');
      line('<span class="hl">validate</span> › payload ok · email verified · stock reserved');
      await Promise.all([
        (async function () {
          await packet(edge('val', 'ai')); await activate('ai');
          line('<span class="ai">ai.classify</span> › priority=' + prio + ' · sentiment=positive · tag="' + (prio === 'HIGH' ? 'vip' : 'standard') + '"');
          await Promise.all([
            packet(edge('ai', 'tg')).then(function () { return activate('tg'); }).then(function () { line('<span class="hl">telegram</span> › admin notified in @kage_orders'); }),
            packet(edge('ai', 'mail')).then(function () { return activate('mail'); }).then(function () { line('<span class="hl">email</span> › invoice INV-' + id + '.pdf sent to customer'); })
          ]);
        })(),
        (async function () {
          await packet(edge('val', 'sheet')); await activate('sheet');
          line('<span class="hl">sheets</span> › row appended to "Orders 2026" (A' + (id - 4700) + ')');
          await packet(edge('sheet', 'crm')); await activate('crm');
          line('<span class="hl">crm</span> › customer "' + name + '" upserted · LTV updated');
        })()
      ]);
      runs++; saved += .05;
      runsEl.textContent = runs.toLocaleString('en-US');
      savedEl.textContent = saved.toFixed(1);
      line('<span class="ok">' + XR.icon('check') + ' workflow finished in ' + (0.9 + Math.random() * .6).toFixed(2) + 's — 7/7 steps succeeded</span>');
      setStatus('is-done', 'Success');
      running = false; runBtn.disabled = false;
    }

    runBtn.addEventListener('click', run);
    var sched = XR.$('.wf-sched input', stage);
    sched.addEventListener('change', function () {
      line(sched.checked ? 'scheduler › enabled — runs every 5 minutes' : 'scheduler › paused');
    });

    window.addEventListener('resize', function () { fit(); draw(); });
    fit();
    requestAnimationFrame(function () { draw(); });
    // auto-play once when first shown
    setTimeout(run, 900);
  });
})();
