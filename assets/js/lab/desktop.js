/* Lab stage 06 — mini desktop OS: draggable windows, EXE installer wizard, launchable app */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var I = function (n) { return XR.icon(n); };

  var FILES = ['xira.exe', 'resources/app.asar', 'locales/en-US.pak', 'locales/bn-BD.pak', 'ffmpeg.dll', 'd3dcompiler_47.dll', 'libGLESv2.dll', 'resources/icons/tray.ico', 'updater.exe', 'db/core.sqlite', 'plugins/renamer.node', 'plugins/monitor.node', 'uninstall.exe'];

  LAB.register('desktop', function (stage) {
    var desk = XR.$('.desk', stage), layer = XR.$('.windows', stage), tasks = XR.$('.desk-tasks', stage), hint = XR.$('.desk-hint', stage);
    var clock = XR.$('.desk-clock', stage), appIcon = XR.$('[data-open="app"]', stage);
    var wins = {}, z = 10;
    var coarse = window.matchMedia('(pointer: coarse)').matches;

    function tick() { clock.textContent = LAB.now(); }
    tick(); setInterval(tick, 30000);

    /* ---------- window manager ---------- */
    function focus(w) {
      Object.keys(wins).forEach(function (k) { wins[k].el.classList.remove('is-front'); });
      w.el.style.zIndex = ++z; w.el.classList.add('is-front');
    }
    function create(id, title, icon, body, width) {
      var el = document.createElement('div');
      el.className = 'win';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', title);
      if (width) el.style.width = 'min(' + width + 'px, 94%)';
      el.innerHTML = '<div class="win-bar">' + I(icon) + '<span>' + title + '</span><div class="win-ctrls">' +
        '<button type="button" data-w="min" aria-label="Minimize">' + I('minus') + '</button>' +
        '<button type="button" data-w="max" aria-label="Maximize">' + I('frame') + '</button>' +
        '<button type="button" class="x" data-w="close" aria-label="Close">' + I('close') + '</button></div></div>' +
        '<div class="win-body">' + body + '</div>';
      layer.appendChild(el);
      var n = Object.keys(wins).length;
      var lw = layer.clientWidth, lh = layer.clientHeight;
      el.style.left = Math.max(0, Math.min(lw - el.offsetWidth, (lw - el.offsetWidth) / 2 + n * 24 - 20)) + 'px';
      el.style.top = Math.max(0, Math.min(lh - el.offsetHeight, (lh - el.offsetHeight) / 2 + n * 20 - 20)) + 'px';

      var task = document.createElement('button');
      task.type = 'button';
      task.innerHTML = I(icon) + '<span>' + title + '</span>';
      tasks.appendChild(task);

      var w = { id: id, el: el, task: task };
      wins[id] = w;
      el.addEventListener('pointerdown', function () { focus(w); });
      task.addEventListener('click', function () {
        if (el.classList.contains('is-min') || !el.classList.contains('is-front')) { el.classList.remove('is-min'); task.classList.remove('is-min'); focus(w); }
        else { el.classList.add('is-min'); task.classList.add('is-min'); }
      });
      XR.$('.win-ctrls', el).addEventListener('click', function (e) {
        var b = e.target.closest('[data-w]'); if (!b) return;
        var a = b.getAttribute('data-w');
        if (a === 'min') { el.classList.add('is-min'); task.classList.add('is-min'); }
        if (a === 'max') el.classList.toggle('is-max');
        if (a === 'close') close(id);
      });
      dragBar(el);
      focus(w);
      return w;
    }
    function close(id) {
      var w = wins[id]; if (!w) return;
      if (w.onClose) w.onClose();
      w.el.remove(); w.task.remove(); delete wins[id];
    }
    function dragBar(el) {
      var bar = XR.$('.win-bar', el), sx, sy, ox, oy;
      bar.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button') || el.classList.contains('is-max')) return;
        bar.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop;
      });
      bar.addEventListener('pointermove', function (e) {
        if (!bar.hasPointerCapture(e.pointerId)) return;
        el.style.left = XR.clamp(ox + e.clientX - sx, -el.offsetWidth + 80, layer.clientWidth - 80) + 'px';
        el.style.top = XR.clamp(oy + e.clientY - sy, 0, layer.clientHeight - 36) + 'px';
      });
      bar.addEventListener('dblclick', function (e) { if (!e.target.closest('button')) el.classList.toggle('is-max'); });
    }

    /* ---------- apps ---------- */
    var logoSVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 38 20 20 38 2 20Z" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12 11h5.5L28 29h-5.5Z" fill="#fff"/><path d="M28 11h-5.5L12 29h5.5Z" fill="rgba(255,255,255,.6)"/></svg>';

    function setup() {
      if (wins.setup) { wins.setup.el.classList.remove('is-min'); focus(wins.setup); return; }
      var w = create('setup', 'Xira Toolkit Setup', 'download', '<div class="inst"><div class="inst-side">' + logoSVG + '</div><div class="inst-main"></div></div>', 500);
      var main = XR.$('.inst-main', w.el), step = 0, timer;
      w.onClose = function () { clearInterval(timer); };
      function render() {
        if (step === 0) {
          main.innerHTML = '<h4>Welcome to the Xira Toolkit Setup Wizard</h4><p>This will install <b>Xira Toolkit 2.1.0</b> on your computer. It is recommended that you close all other applications before continuing.</p><p>Click Next to continue.</p>' +
            '<div class="inst-foot"><button class="wbtn" data-a="cancel">Cancel</button><button class="wbtn pri" data-a="next">Next</button></div>';
        } else if (step === 1) {
          main.innerHTML = '<h4>License Agreement</h4><div class="inst-lic" tabindex="0">XIRA TOOLKIT END-USER LICENSE (DEMO)<br><br>1. This is a demonstration installer running in your browser. Nothing is downloaded or installed on your device.<br>2. The real product ships as a signed .exe / .msi with auto-updates and license keys.<br>3. Built by Xiraiya with Electron + Node.js and a native SQLite core.</div>' +
            '<label class="inst-check"><input type="checkbox" data-accept> I accept the agreement</label>' +
            '<div class="inst-foot"><button class="wbtn" data-a="back">Back</button><button class="wbtn pri" data-a="next" disabled>Next</button></div>';
          XR.$('[data-accept]', main).addEventListener('change', function (e) { XR.$('[data-a="next"]', main).disabled = !e.target.checked; });
        } else if (step === 2) {
          main.innerHTML = '<h4>Select Destination Location</h4><p>Setup will install Xira Toolkit into the following folder.</p>' +
            '<div class="inst-path"><input class="input" value="C:\\Program Files\\Xira Toolkit" aria-label="Install path" spellcheck="false"><button class="wbtn" data-a="browse">Browse…</button></div>' +
            '<label class="inst-check"><input type="checkbox" checked data-shortcut> Create a desktop shortcut</label><p>At least 84.2 MB of free disk space is required.</p>' +
            '<div class="inst-foot"><button class="wbtn" data-a="back">Back</button><button class="wbtn pri" data-a="install">Install</button></div>';
        } else if (step === 3) {
          main.innerHTML = '<h4>Installing</h4><p>Please wait while Setup installs Xira Toolkit on your computer.</p><div class="inst-prog"><i></i></div><div class="inst-file">Preparing…</div>' +
            '<div class="inst-foot"><button class="wbtn" disabled>Cancel</button></div>';
          var bar = XR.$('.inst-prog i', main), file = XR.$('.inst-file', main), p = 0, f = 0;
          timer = setInterval(function () {
            p = Math.min(100, p + 2 + Math.random() * 5);
            bar.style.width = p + '%';
            file.textContent = 'Extracting: C:\\Program Files\\Xira Toolkit\\' + FILES[f++ % FILES.length].replace(/\//g, '\\');
            if (p >= 100) { clearInterval(timer); step = 4; setTimeout(render, 300); }
          }, XR.reduce ? 10 : 120);
        } else {
          main.innerHTML = '<h4>Completing the Xira Toolkit Setup</h4><p>Setup has finished installing Xira Toolkit on your computer.</p>' +
            '<label class="inst-check"><input type="checkbox" checked data-launch> Launch Xira Toolkit</label>' +
            '<div class="inst-foot"><button class="wbtn pri" data-a="finish">Finish</button></div>';
        }
      }
      var shortcut = true;
      main.addEventListener('change', function (e) { if (e.target.hasAttribute('data-shortcut')) shortcut = e.target.checked; });
      main.addEventListener('click', function (e) {
        var b = e.target.closest('[data-a]'); if (!b) return;
        var a = b.getAttribute('data-a');
        if (a === 'next') { step++; render(); }
        if (a === 'back') { step--; render(); }
        if (a === 'cancel') close('setup');
        if (a === 'browse') XR.toast('Folder picker opens here in the real app');
        if (a === 'install') { step = 3; render(); }
        if (a === 'finish') {
          var launch = XR.$('[data-launch]', main).checked;
          close('setup');
          if (shortcut) appIcon.hidden = false;
          XR.toast('Xira Toolkit installed successfully');
          if (launch) setTimeout(app, 300);
        }
      });
      render();
    }

    function app() {
      if (wins.app) { wins.app.el.classList.remove('is-min'); focus(wins.app); return; }
      appIcon.hidden = false;
      var w = create('app', 'Xira Toolkit 2.1.0', 'zap',
        '<div class="tk"><nav class="tk-side" aria-label="Toolkit sections">' +
        '<button type="button" class="is-on" data-tab="mon">' + I('activity') + 'Monitor</button>' +
        '<button type="button" data-tab="ren">' + I('pen') + 'Renamer</button>' +
        '<button type="button" data-tab="dl">' + I('download') + 'Downloader</button>' +
        '<button type="button" data-tab="about">' + I('info') + 'About</button></nav><div class="tk-main"></div></div>', 560);
      var main = XR.$('.tk-main', w.el), loop, cpu = [], ram = [];
      for (var i = 0; i < 40; i++) { cpu.push(20 + Math.random() * 30); ram.push(48 + Math.random() * 8); }
      w.onClose = function () { clearInterval(loop); };

      function graph(cv, data, color) {
        var r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
        if (!r.width) return;
        cv.width = r.width * dpr; cv.height = r.height * dpr;
        var c = cv.getContext('2d'); c.scale(dpr, dpr);
        var W = r.width, H = r.height, step = W / (data.length - 1);
        c.beginPath();
        data.forEach(function (v, i) { var x = i * step, y = H - v / 100 * H; i ? c.lineTo(x, y) : c.moveTo(x, y); });
        c.strokeStyle = color; c.lineWidth = 1.6; c.stroke();
        c.lineTo(W, H); c.lineTo(0, H); c.closePath();
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, color + '55'); g.addColorStop(1, color + '00');
        c.fillStyle = g; c.fill();
      }
      function tab(t) {
        clearInterval(loop);
        XR.$$('.tk-side button', w.el).forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-tab') === t); });
        if (t === 'mon') {
          main.innerHTML = '<h5>System monitor</h5><div class="tk-graphs"><div class="tk-g"><div class="tk-g-h"><span>CPU</span><b class="v-cpu">0%</b></div><canvas class="g-cpu"></canvas></div>' +
            '<div class="tk-g"><div class="tk-g-h"><span>RAM</span><b class="v-ram">0%</b></div><canvas class="g-ram"></canvas></div></div>' +
            '<div class="tk-list"><div><span>chrome.exe</span>' + I('activity') + '<b>812 MB</b></div><div><span>xira.exe</span>' + I('activity') + '<b>96 MB</b></div><div><span>code.exe</span>' + I('activity') + '<b>544 MB</b></div></div>';
          var gc = XR.$('.g-cpu', main), gr = XR.$('.g-ram', main), vc = XR.$('.v-cpu', main), vr = XR.$('.v-ram', main);
          var draw = function () {
            cpu.push(XR.clamp(cpu[cpu.length - 1] + (Math.random() - .5) * 22, 4, 96)); cpu.shift();
            ram.push(XR.clamp(ram[ram.length - 1] + (Math.random() - .5) * 3, 40, 70)); ram.shift();
            graph(gc, cpu, '#27e1d6'); graph(gr, ram, '#ff5fb6');
            vc.textContent = Math.round(cpu[cpu.length - 1]) + '%'; vr.textContent = Math.round(ram[ram.length - 1]) + '%';
          };
          draw(); loop = setInterval(draw, 600);
        } else if (t === 'ren') {
          var files = ['IMG_2031.JPG', 'IMG_2032.JPG', 'DSC00917.JPG', 'screenshot (4).png', 'Untitled-1.png', 'photo_final_v2.jpg'];
          main.innerHTML = '<h5>Batch renamer</h5><div class="inst-path"><input class="input ren-pat" value="rajshahi-trip-{n}" aria-label="Rename pattern" spellcheck="false"><button class="wbtn pri ren-go">Apply</button></div><div class="tk-list ren-list"></div>';
          var list = XR.$('.ren-list', main), pat = XR.$('.ren-pat', main);
          var preview = function () {
            list.innerHTML = files.map(function (f, i) {
              var ext = f.split('.').pop().toLowerCase(), n = String(i + 1).padStart(3, '0');
              return '<div><span>' + XR.esc(f) + '</span>' + I('arrow-right') + '<b>' + XR.esc((pat.value || 'file-{n}').replace('{n}', n)) + '.' + ext + '</b></div>';
            }).join('');
          };
          pat.addEventListener('input', preview); preview();
          XR.$('.ren-go', main).addEventListener('click', function () { XR.toast('Renamed ' + files.length + ' files'); });
        } else if (t === 'dl') {
          var q = [['xiraiya-portfolio.zip', 62], ['dataset-orders-2026.csv', 18], ['tutorial-motion.mp4', 240]];
          main.innerHTML = '<h5>Downloader</h5><div class="tk-q">' + q.map(function (d) {
            return '<div><span>' + d[0] + '<em>' + d[1] + ' MB</em></span><div class="inst-prog"><i style="width:0"></i></div></div>';
          }).join('') + '</div>';
          var bars = XR.$$('.inst-prog i', main), prog = [0, 0, 0];
          loop = setInterval(function () {
            prog = prog.map(function (p, i) { return p >= 100 ? 100 : Math.min(100, p + (3 - i) * Math.random() * 4); });
            bars.forEach(function (b, i) { b.style.width = prog[i] + '%'; });
            if (prog.every(function (p) { return p >= 100; })) { clearInterval(loop); XR.toast('All downloads complete'); }
          }, 200);
        } else {
          main.innerHTML = '<h5>About</h5><div class="tk-list"><div><span>Version</span>' + I('check') + '<b>2.1.0 (latest)</b></div><div><span>License</span>' + I('key') + '<b>XIRA-7F3K-DEMO</b></div><div><span>Built with</span>' + I('code') + '<b>Electron + Node.js</b></div></div>' +
            '<p style="margin-top:12px;color:var(--ink-3)">Auto-updates, license activation and crash reporting are built in.</p><p style="margin-top:10px"><button class="wbtn upd">Check for updates</button></p>';
          XR.$('.upd', main).addEventListener('click', function () { XR.toast('You’re on the latest version'); });
        }
      }
      XR.$('.tk-side', w.el).addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) tab(b.getAttribute('data-tab')); });
      requestAnimationFrame(function () { tab('mon'); });
    }

    function readme() {
      if (wins.readme) { focus(wins.readme); return; }
      create('readme', 'readme.txt — Notepad', 'book',
        '<div class="readme">Hi! This desktop runs in your browser.\n\n1. Double-click XiraSetup.exe\n2. Accept the license, pick a folder\n3. Install, then launch Xira Toolkit\n\nWindows can be dragged, minimized to the\ntaskbar, maximized (double-click the title)\nand closed.\n\nWant real Windows software like this?\nHire → xiraiya</div>', 380);
    }

    var OPEN = { setup: setup, app: app, readme: readme };
    XR.$$('.desk-icon', stage).forEach(function (ic) {
      var id = ic.getAttribute('data-open');
      function go() { hint.classList.add('is-gone'); OPEN[id](); }
      ic.addEventListener('dblclick', go);
      ic.addEventListener('click', function () {
        var was = ic.classList.contains('is-sel');
        XR.$$('.desk-icon', stage).forEach(function (x) { x.classList.remove('is-sel'); });
        ic.classList.add('is-sel');
        if (coarse || was) go();
      });
      ic.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });
    desk.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.desk-icon')) XR.$$('.desk-icon', stage).forEach(function (x) { x.classList.remove('is-sel'); });
    });
  });
})();
