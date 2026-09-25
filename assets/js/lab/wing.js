/* XIRAIYA — The Lab, Part II: the Motion Wing (動の間).
   Twenty-eight small interactive experiments in motion, 3D, type and feel.
   Each exhibit mounts when its card is on screen and is torn down when it leaves. */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, icon = XR.icon, esc = XR.esc;
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var IMG = 'assets/img/shop/';

  /* ---------- a context whose timers and listeners die together ---------- */
  function ctx(el) {
    var st = { t: [], iv: [], off: [], stop: [], alive: true };
    return {
      el: el,
      alive: function () { return st.alive; },
      later: function (f, ms) { st.t.push(setTimeout(function () { if (st.alive) f(); }, ms)); },
      every: function (f, ms) { st.iv.push(setInterval(function () { if (st.alive && !document.hidden) f(); }, ms)); },
      loop: function (f) { var last = performance.now(); (function tick(now) { if (!st.alive) return; var dt = Math.min(.05, (now - last) / 1000); last = now; if (f(dt, now) !== false) requestAnimationFrame(tick); })(last); },
      on: function (t, ev, f, o) { t.addEventListener(ev, f, o); st.off.push(function () { t.removeEventListener(ev, f, o); }); },
      onStop: function (f) { st.stop.push(f); },
      stop: function () { st.alive = false; st.t.forEach(clearTimeout); st.iv.forEach(clearInterval); st.off.forEach(function (f) { f(); }); st.stop.forEach(function (f) { try { f(); } catch (e) {} }); }
    };
  }
  /* pointer position relative to an element, plus "idle" tracking */
  function pointer(k, el) {
    var p = { x: 0, y: 0, nx: 0, ny: 0, in: false, down: false, last: 0 };
    function set(e) { var r = el.getBoundingClientRect(); p.x = e.clientX - r.left; p.y = e.clientY - r.top; p.nx = p.x / r.width - .5; p.ny = p.y / r.height - .5; p.last = Date.now(); }
    k.on(el, 'pointermove', function (e) { set(e); p.in = true; });
    k.on(el, 'pointerdown', function (e) { set(e); p.in = true; p.down = true; });
    k.on(window, 'pointerup', function () { p.down = false; });
    k.on(el, 'pointerleave', function () { p.in = false; p.down = false; });
    p.idle = function (ms) { return Date.now() - p.last > (ms || 2500); };
    return p;
  }
  function canvas(k, host) {
    var c = document.createElement('canvas'); host.appendChild(c);
    var g = c.getContext('2d'), s = { c: c, g: g, w: 0, h: 0 };
    function fit() { s.w = host.clientWidth; s.h = host.clientHeight; c.width = s.w * DPR; c.height = s.h * DPR; c.style.width = s.w + 'px'; c.style.height = s.h + 'px'; g.setTransform(DPR, 0, 0, DPR, 0, 0); if (s.onfit) s.onfit(); }
    fit();
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(fit); ro.observe(host); k.onStop(function () { ro.disconnect(); }); }
    return s;
  }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function ink() { return document.documentElement.getAttribute('data-mode') === 'ink'; }

  var EX = [];
  function add(o) { EX.push(o); }

  /* 12 — Ink brush: a sumi-e trail; draws an ensō on its own when idle */
  add({ id: 'ink', t: 'Sumi ink brush', jp: '墨', tag: 'motion', size: 'l', hint: 'Draw with your mouse or finger. Leave it alone and it paints an ensō.',
    run: function (k, el) {
      var cv = canvas(k, el), g = cv.g, p = pointer(k, el), prev = null, a = 0, width = 0;
      function paper() { g.fillStyle = ink() ? '#15110d' : '#f4ecdc'; g.fillRect(0, 0, cv.w, cv.h); }
      cv.onfit = paper; paper();
      function stroke(x, y, press) {
        if (prev) {
          var d = Math.hypot(x - prev.x, y - prev.y), target = Math.max(2, 22 - d * .5) * press;
          width += (target - width) * .35;
          var steps = Math.max(1, d / 2);
          for (var i = 0; i < steps; i++) {
            var t = i / steps, px = prev.x + (x - prev.x) * t, py = prev.y + (y - prev.y) * t;
            g.beginPath(); g.fillStyle = ink() ? 'rgba(239,228,204,.16)' : 'rgba(20,14,10,.2)';
            g.arc(px + (Math.random() - .5) * 1.5, py + (Math.random() - .5) * 1.5, width * (.8 + Math.random() * .3), 0, 7); g.fill();
          }
          if (Math.random() < .08) { g.beginPath(); g.fillStyle = 'rgba(196,50,29,.5)'; g.arc(x + (Math.random() - .5) * 30, y + (Math.random() - .5) * 30, Math.random() * 3, 0, 7); g.fill(); }
        }
        prev = { x: x, y: y };
      }
      k.on(el, 'pointerdown', function () { prev = null; });
      k.on(el, 'dblclick', paper);
      var enso = 0;
      k.loop(function (dt) {
        g.fillStyle = ink() ? 'rgba(21,17,13,.012)' : 'rgba(244,236,220,.012)'; g.fillRect(0, 0, cv.w, cv.h);
        if (p.in && !p.idle(60)) { stroke(p.x, p.y, 1); return; }
        if (p.idle(1800)) {
          if (enso === 0) { prev = null; paper(); }
          enso += dt * .55;
          var r = Math.min(cv.w, cv.h) * .32, ang = -Math.PI / 2 + enso * Math.PI * 1.85;
          if (enso < 1) stroke(cv.w / 2 + Math.cos(ang) * r, cv.h / 2 + Math.sin(ang) * r, 1.15 - enso * .6);
          else if (enso > 2.6) enso = 0;
          else prev = null;
        } else prev = null;
      });
    } });

  /* 13 — Magnetic type: letters flee the cursor and spring home */
  add({ id: 'magnet', t: 'Magnetic type', jp: '磁', tag: 'type', size: 'm', hint: 'Move through the word. Every letter is on a spring.',
    run: function (k, el) {
      var W = 'XIRAIYA';
      el.innerHTML = '<div class="mg-word">' + W.split('').map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div><div class="mg-sub">磁力 · spring physics</div>';
      var L = $$('.mg-word span', el).map(function (s) { return { s: s, x: 0, y: 0, vx: 0, vy: 0, r: 0 }; }), p = pointer(k, el), T = 0;
      k.loop(function (dt, now) {
        T += dt;
        var er = el.getBoundingClientRect();
        L.forEach(function (l, i) {
          var r = l.s.getBoundingClientRect(), cx = r.left - er.left + r.width / 2 - l.x, cy = r.top - er.top + r.height / 2 - l.y, fx = 0, fy = 0;
          var px = p.in ? p.x : cv(T, i, er.width), py = p.in ? p.y : er.height / 2 + Math.sin(T * 2 + i) * 30;
          var dx = cx + l.x - px, dy = cy + l.y - py, d = Math.hypot(dx, dy) || 1, R = 140;
          if (d < R) { var f = (1 - d / R) * 2600; fx += dx / d * f; fy += dy / d * f; }
          fx += -l.x * 90 - l.vx * 9; fy += -l.y * 90 - l.vy * 9;
          l.vx += fx * dt; l.vy += fy * dt; l.x += l.vx * dt; l.y += l.vy * dt;
          l.s.style.transform = 'translate(' + l.x.toFixed(1) + 'px,' + l.y.toFixed(1) + 'px) rotate(' + (l.x * .35).toFixed(1) + 'deg) scale(' + (1 + Math.min(.4, Math.hypot(l.vx, l.vy) / 2000)).toFixed(3) + ')';
          l.s.style.color = Math.hypot(l.x, l.y) > 12 ? 'var(--red)' : '';
        });
      });
      function cv(t, i, w) { return w / 2 + Math.sin(t * .9) * w * .42; }
    } });

  /* 14 — Particle type: thousands of dots form words */
  add({ id: 'particles', t: 'Particle words', jp: '粒', tag: 'motion', size: 'm', hint: 'Push the particles. Click to change the word.',
    run: function (k, el) {
      var cv = canvas(k, el), g = cv.g, p = pointer(k, el), words = ['LAB', '忍', 'BUILD', 'MOTION', '動'], wi = 0, P = [];
      function targets(word) {
        var o = document.createElement('canvas'), w = Math.floor(cv.w), h = Math.floor(cv.h); o.width = w; o.height = h;
        var c = o.getContext('2d'), fs = Math.min(h * .6, w / (word.length * .78));
        c.fillStyle = '#000'; c.font = '900 ' + fs + 'px "Shippori Mincho B1", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(word, w / 2, h / 2 + fs * .04);
        var d = c.getImageData(0, 0, w, h).data, out = [], step = Math.max(4, Math.round(Math.sqrt(w * h / 2600)));
        for (var y = 0; y < h; y += step) for (var x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > 128) out.push([x, y]);
        return out;
      }
      function shape() {
        var T = targets(words[wi % words.length]);
        while (P.length < T.length) P.push({ x: Math.random() * cv.w, y: Math.random() * cv.h, vx: 0, vy: 0, tx: 0, ty: 0, c: Math.random() });
        P.length = T.length;
        T.sort(function () { return Math.random() - .5; }).forEach(function (t, i) { P[i].tx = t[0]; P[i].ty = t[1]; });
      }
      cv.onfit = shape; shape();
      k.on(el, 'click', function () { wi++; shape(); P.forEach(function (q) { q.vx += (Math.random() - .5) * 600; q.vy += (Math.random() - .5) * 600; }); });
      k.every(function () { if (p.idle(6000)) { wi++; shape(); } }, 4200);
      k.loop(function (dt) {
        g.clearRect(0, 0, cv.w, cv.h);
        var red = css('--red') || '#c4321d', ink1 = ink() ? '#efe4cc' : '#1f1813';
        P.forEach(function (q) {
          var ax = (q.tx - q.x) * 40 - q.vx * 6, ay = (q.ty - q.y) * 40 - q.vy * 6;
          if (p.in) { var dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d < 70 && d > 0) { ax += dx / d * 9000 / (d + 10); ay += dy / d * 9000 / (d + 10); } }
          q.vx += ax * dt; q.vy += ay * dt; q.x += q.vx * dt; q.y += q.vy * dt;
          var sp = Math.min(1, Math.hypot(q.vx, q.vy) / 400);
          g.fillStyle = sp > .25 || q.c > .9 ? red : ink1;
          g.fillRect(q.x - 1.2, q.y - 1.2, 2.4 + sp * 2, 2.4);
        });
      });
    } });

  /* Coverflow: a 3D ring of product photos with momentum, snapping and a caption HUD */
  add({ id: 'coverflow', t: '3D coverflow', jp: '環', tag: '3d', size: 'l', hint: 'Drag, swipe or use the arrows. It snaps to each product.',
    run: function (k, el) {
      var P = [['halide/tlr.jpg', 'Twin lens reflex', 'Halide · $420'], ['aurelia/watch.jpg', 'Field watch', 'Aurèle · $890'], ['carry/backpack.jpg', 'Canvas pack', 'Carry · $140'], ['glow/perfume.jpg', 'Eau de nuit', 'Glow Theory · $78'], ['deshi/saree.jpg', 'Jamdani saree', 'Deshi · $210'], ['fieldday/cruiser.jpg', 'City cruiser', 'Field Day · $540'], ['halide/x100.jpg', 'X100 compact', 'Halide · $1,190'], ['aurelia/locket.jpg', 'Gold locket', 'Aurèle · $360'], ['carry/duffel.jpg', 'Weekender', 'Carry · $260'], ['glow/palette.jpg', 'Eye palette', 'Glow Theory · $42']];
      el.innerHTML = '<div class="cf-ring">' + P.map(function (p, i) { return '<figure class="cf-it" style="--i:' + i + '"><img src="' + IMG + p[0] + '" alt="' + esc(p[1]) + '" draggable="false" loading="lazy"></figure>'; }).join('') + '</div><div class="cf-floor"></div>' +
        '<div class="cf-hud"><button type="button" class="cf-b" data-d="-1" aria-label="Previous">' + icon('arrow-left') + '</button><div class="cf-cap"><b></b><span></span></div><button type="button" class="cf-b" data-d="1" aria-label="Next">' + icon('arrow-right') + '</button></div><div class="cf-dots">' + P.map(function () { return '<i></i>'; }).join('') + '</div>';
      var ring = $('.cf-ring', el), items = $$('.cf-it', el), dots = $$('.cf-dots i', el), n = items.length, step = 360 / n, rot = 0, vel = 0, drag = null, R = 0, target = 0, last = 0, cur = -1;
      function place() { R = Math.max(200, Math.min(420, el.clientWidth * .34)); items.forEach(function (it, i) { it.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + R + 'px)'; }); }
      place(); k.on(window, 'resize', place);
      function go(d) { target = Math.round(rot / step) * step - d * step; vel = 0; last = Date.now(); }
      k.on(el, 'pointerdown', function (e) { if (e.target.closest('.cf-b')) return; drag = { x: e.clientX, r: rot, t: performance.now() }; vel = 0; target = null; last = Date.now(); });
      k.on(el, 'pointermove', function (e) { if (!drag) return; var nr = drag.r + (e.clientX - drag.x) * .28, now = performance.now(); vel = (nr - rot) / Math.max(.016, (now - drag.t) / 1000); drag.t = now; rot = nr; });
      k.on(window, 'pointerup', function () { if (!drag) return; drag = null; last = Date.now(); target = Math.round((rot + vel * .35) / step) * step; });
      $$('.cf-b', el).forEach(function (b) { k.on(b, 'click', function () { go(+b.getAttribute('data-d')); }); });
      k.on(el, 'keydown', function (e) { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
      el.tabIndex = 0;
      k.every(function () { if (!drag && Date.now() - last > 3500) go(1); }, 3500);
      k.loop(function (dt) {
        if (!drag && target != null) rot += (target - rot) * Math.min(1, dt * 5.5);
        ring.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + rot + 'deg)';
        var front = ((-rot % 360) + 360) % 360, fi = Math.round(front / step) % n;
        items.forEach(function (it, i) { var a = Math.abs(((i * step - front) + 540) % 360 - 180); it.style.opacity = Math.max(.08, 1 - a / 200).toFixed(3); it.style.filter = 'brightness(' + (1 - Math.min(a, 120) / 240).toFixed(3) + ')'; it.classList.toggle('front', a < step / 2); });
        if (fi !== cur) { cur = fi; $('.cf-cap b', el).textContent = P[fi][1]; $('.cf-cap span', el).textContent = P[fi][2]; dots.forEach(function (d, j) { d.classList.toggle('on', j === fi); }); var c = $('.cf-cap', el); c.classList.remove('in'); void c.offsetWidth; c.classList.add('in'); }
      });
    } });

  /* 16 — Gooey blobs: an SVG goo filter merges drops like liquid */
  add({ id: 'goo', t: 'Liquid goo', jp: '滴', tag: 'motion', size: 's', hint: 'Your cursor is a drop. Click to spill more.',
    run: function (k, el) {
      var fid = 'goo' + Math.random().toString(36).slice(2, 7);
      el.innerHTML = '<svg class="goo-defs" aria-hidden="true"><filter id="' + fid + '"><feGaussianBlur in="SourceGraphic" stdDeviation="12"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter></svg><div class="goo-f" style="filter:url(#' + fid + ')"></div>';
      var f = $('.goo-f', el), p = pointer(k, el), B = [];
      function blob(x, y, r, orbit) { var d = document.createElement('i'); d.style.width = d.style.height = r * 2 + 'px'; f.appendChild(d); var b = { d: d, x: x, y: y, vx: 0, vy: 0, r: r, o: orbit, a: Math.random() * 7, life: orbit ? 1e9 : 6 }; B.push(b); return b; }
      var me = blob(0, 0, 34, 0); me.life = 1e9; me.me = true;
      for (var i = 0; i < 6; i++) blob(0, 0, 18 + Math.random() * 16, 1);
      k.on(el, 'click', function () { for (var j = 0; j < 4; j++) { var b = blob(p.x, p.y, 10 + Math.random() * 14, 0); b.vx = (Math.random() - .5) * 500; b.vy = (Math.random() - .5) * 500; } });
      var T = 0;
      k.loop(function (dt) {
        T += dt; var w = el.clientWidth, h = el.clientHeight, cx = w / 2, cy = h / 2;
        var tx = p.in ? p.x : cx + Math.cos(T * .9) * w * .28, ty = p.in ? p.y : cy + Math.sin(T * 1.3) * h * .25;
        B = B.filter(function (b) {
          if (b.me) { b.x += (tx - b.x) * Math.min(1, dt * 10); b.y += (ty - b.y) * Math.min(1, dt * 10); }
          else if (b.o) { b.a += dt * (.6 + b.r / 60); var ox = cx + Math.cos(b.a) * w * .22, oy = cy + Math.sin(b.a * 1.3) * h * .22; b.vx += ((ox + (me.x - cx) * .35) - b.x) * 6 * dt; b.vy += ((oy + (me.y - cy) * .35) - b.y) * 6 * dt; b.vx *= .96; b.vy *= .96; b.x += b.vx * dt * 6; b.y += b.vy * dt * 6; }
          else { b.vy += 300 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (b.y > h - b.r) { b.y = h - b.r; b.vy *= -.4; } }
          b.d.style.transform = 'translate(' + (b.x - b.r) + 'px,' + (b.y - b.r) + 'px)';
          if (b.life <= 0) { b.d.remove(); return false; }
          return true;
        });
      });
    } });

  /* 17 — Aurora glass: moving light behind frosted glass, specular under the cursor */
  add({ id: 'glass', t: 'Aurora glass', jp: '光', tag: '3d', size: 'm', hint: 'Tilt the glass card. The shine follows your cursor.',
    run: function (k, el) {
      el.innerHTML = '<div class="au-bg"><i></i><i></i><i></i><i></i></div><div class="au-card"><span class="au-chip">' + icon('sparkle') + 'Pro</span><b>Xiraiya Studio</b><p>Websites · Bots · AI agents</p><div class="au-num">**** 2026</div><i class="au-shine"></i></div>';
      var c = $('.au-card', el), p = pointer(k, el), rx = 0, ry = 0, T = 0;
      k.loop(function (dt) {
        T += dt;
        var nx = p.in ? p.nx : Math.sin(T * .7) * .35, ny = p.in ? p.ny : Math.cos(T * .5) * .3;
        rx += (-ny * 22 - rx) * Math.min(1, dt * 6); ry += (nx * 26 - ry) * Math.min(1, dt * 6);
        c.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        c.style.setProperty('--sx', (50 + nx * 100).toFixed(1) + '%'); c.style.setProperty('--sy', (50 + ny * 100).toFixed(1) + '%');
      });
    } });

  /* 19 — Text scramble: headlines decode like a terminal */
  add({ id: 'scramble', t: 'Decode text', jp: '暗', tag: 'type', size: 's', hint: 'Hover a line to scramble it again.',
    run: function (k, el) {
      var L = ['Build something legendary.', 'Shops that sell while you sleep.', 'Bots that answer at 3am.', 'Motion with a reason.'];
      el.innerHTML = '<div class="sc-list">' + L.map(function (l) { return '<p class="sc-l" data-t="' + esc(l) + '"></p>'; }).join('') + '</div>';
      var G = '!<>-_\\/[]{}—=+*^?#01アイウエオカキ';
      function run(p) {
        var t = p.getAttribute('data-t'), f = 0, q = t.split('').map(function (_, i) { return i * 1.2 + Math.random() * 10; });
        (function tick() {
          if (!k.alive()) return;
          var out = '', done = 0;
          for (var i = 0; i < t.length; i++) { if (f >= q[i] + 8) { out += esc(t[i]); done++; } else if (f >= q[i]) out += '<i>' + esc(G[Math.floor(Math.random() * G.length)]) + '</i>'; else out += ' '; }
          p.innerHTML = out; f++;
          if (done < t.length) k.later(tick, 28);
        })();
      }
      $$('.sc-l', el).forEach(function (p, i) { k.later(function () { run(p); }, i * 500); k.on(p, 'pointerenter', function () { run(p); }); });
      var n = 0; k.every(function () { run($$('.sc-l', el)[n++ % L.length]); }, 2600);
    } });

  /* 21 — Magnifying dock */
  add({ id: 'dock', t: 'Magnify dock', jp: '港', tag: 'ui', size: 'm', hint: 'Sweep across the dock. Click an app to launch it.',
    run: function (k, el) {
      var A = [['home', '#c4321d'], ['chat', '#2f6fe0'], ['cart', '#1f8a5b'], ['bot', '#7c5cff'], ['film', '#d9a441'], ['terminal', '#17130f'], ['palette', '#e2703a']];
      el.innerHTML = '<div class="dk-desk"><b class="dk-open"></b></div><div class="dk-bar">' + A.map(function (a) { return '<button type="button" class="dk-i" style="--c:' + a[1] + '" aria-label="' + a[0] + '">' + icon(a[0]) + '<em></em></button>'; }).join('') + '</div>';
      var bar = $('.dk-bar', el), it = $$('.dk-i', bar), p = pointer(k, bar), T = 0;
      k.on(bar, 'click', function (e) { var b = e.target.closest('.dk-i'); if (!b) return; b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce', 'run'); var o = $('.dk-open', el); o.textContent = b.getAttribute('aria-label') + ' opened'; o.classList.remove('in'); void o.offsetWidth; o.classList.add('in'); });
      k.loop(function (dt) {
        T += dt;
        var br = bar.getBoundingClientRect(), mx = p.in ? p.x : (Math.sin(T * .8) * .5 + .5) * br.width;
        it.forEach(function (b) {
          var c = b.offsetLeft + b.offsetWidth / 2, d = Math.abs(mx - c), s = 1 + Math.max(0, 1 - d / 150) * (br.width < 420 ? .45 : .9);
          b.style.setProperty('--s', s.toFixed(3));
        });
      });
    } });

  /* 22 — Swipe deck with physics */
  add({ id: 'swipe', t: 'Swipe deck', jp: '束', tag: 'ui', size: 's', hint: 'Drag a card left or right and let go.',
    run: function (k, el) {
      var D = [['halide/f2.jpg', 'Film SLR', '$240'], ['glow/serum.jpg', 'Night serum', '$38'], ['carry/satchel.jpg', 'Satchel', '$120'], ['aurelia/solitaire.jpg', 'Solitaire', '$890'], ['fieldday/tent.jpg', 'Trail tent', '$310'], ['deshi/panjabi.jpg', 'Panjabi', '$64']], n = 0;
      el.innerHTML = '<div class="sw-deck"></div><div class="sw-btns"><button type="button" class="sw-no" aria-label="Skip">' + icon('close') + '</button><button type="button" class="sw-yes" aria-label="Like">' + icon('heart') + '</button></div>';
      var deck = $('.sw-deck', el), last = Date.now();
      function card() {
        var d = D[n++ % D.length], c = document.createElement('div'); c.className = 'sw-c';
        c.innerHTML = '<img src="' + IMG + d[0] + '" alt="" draggable="false"><div><b>' + d[1] + '</b><span>' + d[2] + '</span></div><em class="sw-st yes">LIKE</em><em class="sw-st no">NOPE</em>';
        deck.prepend(c); return c;
      }
      for (var i = 0; i < 3; i++) card();
      function top() { return deck.lastElementChild; }
      function fling(c, dir) {
        c.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1), opacity .5s'; c.style.transform = 'translate(' + dir * 420 + 'px,-40px) rotate(' + dir * 30 + 'deg)'; c.style.opacity = 0;
        k.later(function () { c.remove(); card(); }, 480);
      }
      var drag = null;
      k.on(deck, 'pointerdown', function (e) { var c = top(); if (!c || !c.contains(e.target)) return; drag = { c: c, x: e.clientX, y: e.clientY }; c.style.transition = 'none'; deck.setPointerCapture(e.pointerId); last = Date.now(); });
      k.on(deck, 'pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.dx = dx; drag.c.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + dx * .08 + 'deg)'; drag.c.style.setProperty('--y', Math.max(0, dx / 120)); drag.c.style.setProperty('--n', Math.max(0, -dx / 120)); });
      k.on(deck, 'pointerup', function () { if (!drag) return; var c = drag.c, dx = drag.dx || 0; drag = null; if (Math.abs(dx) > 90) fling(c, dx > 0 ? 1 : -1); else { c.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)'; c.style.transform = ''; c.style.setProperty('--y', 0); c.style.setProperty('--n', 0); } });
      k.on($('.sw-yes', el), 'click', function () { last = Date.now(); var c = top(); c.style.setProperty('--y', 1); fling(c, 1); });
      k.on($('.sw-no', el), 'click', function () { last = Date.now(); var c = top(); c.style.setProperty('--n', 1); fling(c, -1); });
      k.every(function () { if (Date.now() - last > 5000 && !drag) { var c = top(), d = Math.random() > .4 ? 1 : -1; c.style.setProperty(d > 0 ? '--y' : '--n', 1); fling(c, d); } }, 2400);
    } });

  /* 23 — Scroll story: a scene driven by scroll progress */
  add({ id: 'story', t: 'Scroll story', jp: '巻', tag: 'motion', size: 'm', hint: 'Scroll inside the frame. The sun, hills and words follow your scroll.',
    run: function (k, el) {
      el.innerHTML = '<div class="ss-scroll" tabindex="0" aria-label="Scroll the story"><div class="ss-sticky"><div class="ss-sky"></div><i class="ss-sun"></i><i class="ss-h h1"></i><i class="ss-h h2"></i><i class="ss-h h3"></i><div class="ss-words"><b>夜明け</b><b>Dawn.</b><b>Build.</b><b>Launch.</b></div><div class="ss-bar"><i></i></div></div><div class="ss-space"></div></div>';
      var sc = $('.ss-scroll', el), st = $('.ss-sticky', el), user = 0, dir = 1;
      function draw() { var p = sc.scrollTop / Math.max(1, sc.scrollHeight - sc.clientHeight); st.style.setProperty('--p', p.toFixed(4)); $$('.ss-words b', el).forEach(function (b, i) { var c = (i + .5) / 4, o = Math.max(0, 1 - Math.abs(p - c) * 6); b.style.opacity = o; b.style.transform = 'translateY(' + ((c - p) * 160).toFixed(1) + 'px) scale(' + (.9 + o * .1) + ')'; }); }
      k.on(sc, 'scroll', draw, { passive: true });
      k.on(sc, 'wheel', function () { user = Date.now(); }, { passive: true });
      k.on(sc, 'touchstart', function () { user = Date.now(); }, { passive: true });
      draw();
      k.loop(function (dt) { if (Date.now() - user > 3000) { sc.scrollTop += dir * dt * 180; if (sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 1) dir = -1; else if (sc.scrollTop <= 0) dir = 1; } });
    } });

  /* 25 — Expanding panels */
  add({ id: 'panels', t: 'Accordion gallery', jp: '帳', tag: 'ui', size: 'l', hint: 'Hover or tap a panel to open it.',
    run: function (k, el) {
      var P = [['aurelia/hero.jpg', 'Aurèle', 'Fine jewellery', '01'], ['carry/hero.jpg', 'Carry', 'Leather goods', '02'], ['deshi/hero.jpg', 'Deshi', 'Handwoven wear', '03'], ['glow/hero.jpg', 'Glow Theory', 'Beauty', '04'], ['halide/x100-xl.jpg', 'Halide', 'Film cameras', '05'], ['fieldday/road-xl.jpg', 'Field Day', 'Outdoor', '06']];
      el.innerHTML = '<div class="pn-row">' + P.map(function (p, i) { return '<button type="button" class="pn" style="--i:' + i + '"><img src="' + IMG + p[0] + '" alt="" loading="lazy"><span class="pn-n">' + p[3] + '</span><span class="pn-t"><b>' + p[1] + '</b><small>' + p[2] + '</small></span></button>'; }).join('') + '</div>';
      var ps = $$('.pn', el), cur = 0, hold = 0;
      function open(i) { cur = i; ps.forEach(function (p, j) { p.classList.toggle('on', j === i); }); }
      ps.forEach(function (p, i) { k.on(p, 'pointerenter', function () { hold = Date.now(); open(i); }); k.on(p, 'click', function () { hold = Date.now(); open(i); }); });
      open(0);
      k.every(function () { if (Date.now() - hold > 5000) open((cur + 1) % ps.length); }, 2400);
    } });

  /* 26 — Day and night morph */
  add({ id: 'daynight', t: 'Day ⇄ night', jp: '昼夜', tag: 'motion', size: 'm', hint: 'Flip the switch. The sun becomes the moon and the town wakes up.',
    run: function (k, el) {
      el.innerHTML = '<div class="dn"><div class="dn-stars">' + '<i></i>'.repeat(30) + '</div><i class="dn-orb"><i></i></i><div class="dn-cloud c1"></div><div class="dn-cloud c2"></div><div class="dn-town">' + [60, 90, 70, 110, 80, 64, 96, 74].map(function (h, i) { return '<span style="--h:' + h + 'px;--i:' + i + '">' + '<i></i>'.repeat(4) + '</span>'; }).join('') + '</div><button type="button" class="dn-sw" aria-label="Toggle day and night"><i></i></button></div>';
      var d = $('.dn', el), hold = 0;
      $$('.dn-stars i', el).forEach(function (s) { s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 60 + '%'; s.style.animationDelay = (-Math.random() * 3) + 's'; });
      $$('.dn-town i', el).forEach(function (w) { w.style.transitionDelay = (Math.random() * .9 + .2).toFixed(2) + 's'; });
      k.on($('.dn-sw', el), 'click', function () { hold = Date.now(); d.classList.toggle('night'); });
      k.every(function () { if (Date.now() - hold > 6000) d.classList.toggle('night'); }, 3200);
    } });


  /* other files add more exhibits through this API before the page is ready */
  window.XRWING = { add: add, ctx: ctx, pointer: pointer, canvas: canvas, css: css, ink: ink, IMG: IMG, DPR: DPR };

  document.addEventListener('DOMContentLoaded', build);

  /* the curated set, in display order */
  var ORDER = ['coverflow', 'glass', 'u-cmdk', 'c-globe', 'u-dash', 'particles', 'o-phone', 'magnet', 'swipe', 'u-kanban', 'dock', 'u-bento', 'o-pricing', 'ink', 'scramble', 'u-notif', 'u-compare', 'goo', 'o-laptop', 'story', 'u-lens', 't-marquee', 'u-sheet', 'p-flow', 'u-stepper', 'daynight', 'panels', 'u-magnetic'];

  function build() {
  var LARGE = ['coverflow', 'c-globe', 'u-dash', 'u-kanban', 'u-bento', 'u-compare', 't-marquee', 'panels'];
  EX.forEach(function (x) { x.size = LARGE.indexOf(x.id) > -1 ? 'l' : 's'; });
  EX = EX.filter(function (x) { return ORDER.indexOf(x.id) > -1; }).sort(function (a, b) { return ORDER.indexOf(a.id) - ORDER.indexOf(b.id); });
  var root = document.getElementById('wing');
  if (!root) return;
  var grid = $('.wg-grid', root), more = $('.wg-more', root), qIn = $('.wg-q', root), count = $('.wg-count', root);
  var TAGS = { motion: 'Motion', '3d': '3D', type: 'Type', ui: 'Interface' };
  var PAGE = 30, shown = PAGE, filter = 'all', query = '';
  grid.innerHTML = EX.map(function (x, i) {
    return '<article class="wx wx-' + (x.size === 'l' ? 'l' : 's') + '" data-tag="' + x.tag + '" data-x="' + x.id + '" data-q="' + esc((x.t + ' ' + x.tag + ' ' + TAGS[x.tag] + ' ' + (x.kw || '')).toLowerCase()) + '">' +
      '<header class="wx-h"><span class="wx-n">' + ('00' + (i + 1)).slice(EX.length > 99 ? -3 : -2) + '</span><div class="wx-tt"><b>' + esc(x.t) + '</b><small><span class="jp">' + x.jp + '</span> · ' + TAGS[x.tag] + '</small></div>' +
      '<button type="button" class="wx-max" aria-label="Expand ' + esc(x.t) + '">' + icon('fullscreen') + '</button></header>' +
      '<div class="wx-stage wx-' + x.id + '"></div><p class="wx-hint">' + icon('hand') + esc(x.hint) + '</p></article>';
  }).join('');
  $$('[data-wing-count]').forEach(function (e) { e.textContent = EX.length; });
  var cnt = {}; EX.forEach(function (x) { cnt[x.tag] = (cnt[x.tag] || 0) + 1; });
  $$('.wg-f button', root).forEach(function (b) { var t = b.getAttribute('data-f'); b.insertAdjacentHTML('beforeend', '<em>' + (t === 'all' ? EX.length : cnt[t] || 0) + '</em>'); });

  var live = {};
  function mount(card) {
    var id = card.getAttribute('data-x'), x = EX.filter(function (e) { return e.id === id; })[0], st = $('.wx-stage', card);
    if (live[id]) live[id].stop();
    st.innerHTML = '';
    var k = ctx(st); live[id] = k;
    try { x.run(k, st, x.cfg || {}); } catch (e) { if (window.console) console.error('[wing] ' + id, e); }
  }
  function unmount(card) { var id = card.getAttribute('data-x'); if (live[id]) { live[id].stop(); live[id] = null; $('.wx-stage', card).innerHTML = ''; } }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      var c = e.target;
      if (e.isIntersecting && !c.hidden && !live[c.getAttribute('data-x')]) mount(c);
      else if (!e.isIntersecting && !c.classList.contains('max')) unmount(c);
    });
  }, { rootMargin: '150px 0px' }) : null;
  $$('.wx', grid).forEach(function (c) { if (io) io.observe(c); });

  function apply() {
    var n = 0, total = 0;
    $$('.wx', grid).forEach(function (c) {
      var ok = (filter === 'all' || c.getAttribute('data-tag') === filter) && (!query || c.getAttribute('data-q').indexOf(query) > -1);
      if (ok) total++;
      var show = ok && n < shown; if (show) n++;
      if (c.hidden !== !show) { c.hidden = !show; if (!show) unmount(c); else if (!io) mount(c); }
    });
    more.hidden = n >= total;
    more.querySelector('span').textContent = 'Show ' + Math.min(PAGE, total - n) + ' more';
    count.textContent = 'Showing ' + n + ' of ' + total;
    if (!total) count.textContent = 'Nothing matches “' + query + '”';
  }
  $$('.wg-f button', root).forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.getAttribute('data-f'); shown = PAGE;
      $$('.wg-f button', root).forEach(function (x) { x.classList.toggle('on', x === b); });
      apply();
    });
  });
  if (qIn) qIn.addEventListener('input', function () { query = qIn.value.trim().toLowerCase(); shown = PAGE; apply(); });
  more.addEventListener('click', function () { shown += PAGE; apply(); });
  apply();

  /* expand one exhibit to fill the screen */
  var back = document.createElement('div'); back.className = 'wx-back'; document.body.appendChild(back);
  function shrink() {
    var c = $('.wx.max', grid); if (!c) return;
    c.classList.remove('max'); back.classList.remove('on'); document.documentElement.classList.remove('wx-lock');
    $('.wx-max', c).innerHTML = icon('fullscreen'); mount(c);
  }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('.wx-max'); if (!b) return;
    var c = b.closest('.wx');
    if (c.classList.contains('max')) return shrink();
    shrink();
    c.classList.add('max'); back.classList.add('on'); document.documentElement.classList.add('wx-lock');
    b.innerHTML = icon('close'); mount(c);
    if (XR.quest) try { XR.quest('wing'); } catch (err) {}
  });
  back.addEventListener('click', shrink);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shrink(); });
  }
})();
