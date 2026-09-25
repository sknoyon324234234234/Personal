/* XIRAIYA — Motion Wing, part B: CSS 3D objects and particle systems. */
(function () {
  'use strict';
  var W = window.XRWING, XR = window.XR;
  if (!W || !XR) return;
  var $ = XR.$, $$ = XR.$$, icon = XR.icon, esc = XR.esc, add = W.add, pointer = W.pointer, canvas = W.canvas, IMG = W.IMG;
  function rep(s, n) { var o = ''; for (var i = 0; i < n; i++) o += s(i); return o; }
  function drag3d(k, el, target, o) {
    o = o || {}; var rx = o.rx == null ? -20 : o.rx, ry = o.ry || 30, vx = 0, vy = o.spin == null ? 20 : o.spin, d = null;
    k.on(el, 'pointerdown', function (e) { d = { x: e.clientX, y: e.clientY }; vx = vy = 0; });
    k.on(el, 'pointermove', function (e) { if (!d) return; var dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY; ry += dx * .5; rx -= dy * .5; vy = dx * 30; vx = -dy * 30; });
    k.on(window, 'pointerup', function () { d = null; });
    k.loop(function (dt) { if (!d) { ry += vy * dt; rx += vx * dt; vy += ((o.spin == null ? 20 : o.spin) - vy) * dt; vx *= .92; rx += ((o.rx == null ? -20 : o.rx) - rx) * dt * .8; } target.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)'; });
  }

  /* ================= CSS 3D objects ================= */
  var O = [];
  O.push({ id: 'o-cube', t: 'Service cube', jp: '立', hint: 'Drag the cube. Each face is something I build.', run: function (k, el) {
    var F = [['WEB', 'globe', '#c4321d'], ['BOTS', 'bot', '#2f6fe0'], ['SHOPS', 'cart', '#1f8a5b'], ['AI', 'chip', '#7c5cff'], ['APPS', 'phone', '#d9a441'], ['忍', 'shuriken', '#17130f']];
    el.innerHTML = '<div class="o3 cb3"><div class="cb3-c">' + F.map(function (f, i) { return '<div class="cb3-f f' + i + '" style="--c:' + f[2] + '">' + icon(f[1]) + '<b>' + f[0] + '</b></div>'; }).join('') + '</div></div>';
    drag3d(k, el, $('.cb3-c', el));
  } });
  O.push({ id: 'o-flip', t: 'Flip cards', jp: '翻', hint: 'Hover a card to flip it. They also flip on their own.', run: function (k, el) {
    var C = [['globe', 'Websites', 'from $50'], ['bot', 'Telegram bots', 'from $50'], ['cart', 'Online shops', '$100–300'], ['chip', 'AI agents', 'from $150'], ['puzzle', 'Extensions', 'from $50'], ['cube', 'MC plugins', 'from $50']];
    el.innerHTML = '<div class="fc-grid">' + C.map(function (c) { return '<div class="fc"><div class="fc-in"><div class="fc-a">' + icon(c[0]) + '<b>' + c[1] + '</b></div><div class="fc-b"><small>price</small><b>' + c[2] + '</b></div></div></div>'; }).join('') + '</div>';
    var cs = $$('.fc', el);
    cs.forEach(function (c) { k.on(c, 'pointerenter', function () { c.classList.add('on'); }); k.on(c, 'pointerleave', function () { c.classList.remove('on'); }); });
    k.every(function () { var c = cs[Math.random() * cs.length | 0]; c.classList.toggle('on'); }, 900);
  } });
  O.push({ id: 'o-coin', t: 'Coin toss', jp: '銭', hint: 'Tap to toss the coin. Heads or tails?', run: function (k, el) {
    el.innerHTML = '<div class="o3 cn3"><div class="cn3-c"><div class="cn3-f h">' + icon('crown') + '<b>HEADS</b></div><div class="cn3-f t">' + icon('shuriken') + '<b>TAILS</b></div>' + rep(function (i) { return '<i style="--i:' + i + '"></i>'; }, 10) + '</div><div class="cn3-sh"></div></div><div class="o3-out"></div>';
    var c = $('.cn3-c', el), sh = $('.cn3-sh', el), out = $('.o3-out', el), turns = 0, busy = false;
    function toss() { if (busy) return; busy = true; var h = Math.random() < .5; turns += 5 + (h ? 0 : .5) + (turns % 1 ? .5 : 0); turns = Math.round(turns * 2) / 2; if ((turns % 1 === 0) !== h) turns += .5; c.style.transform = 'translateY(-110px) rotateX(' + turns * 360 + 'deg)'; sh.classList.add('up'); out.textContent = ''; k.later(function () { c.style.transform = 'translateY(0) rotateX(' + turns * 360 + 'deg)'; sh.classList.remove('up'); }, 600); k.later(function () { out.textContent = turns % 1 === 0 ? 'Heads!' : 'Tails!'; busy = false; }, 1250); }
    k.on(el, 'click', toss); toss(); k.every(toss, 3200);
  } });
  O.push({ id: 'o-dice', t: 'Dice roll', jp: '賽', hint: 'Tap to roll. It lands on a real face every time.', run: function (k, el) {
    var pips = [[4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
    el.innerHTML = '<div class="o3 dc3"><div class="dc3-c">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<div class="dc3-f f' + n + '">' + rep(function (i) { return '<i' + (pips[n - 1].indexOf(i) > -1 ? ' class="on"' : '') + '></i>'; }, 9) + '</div>'; }).join('') + '</div></div><div class="o3-out"></div>';
    var c = $('.dc3-c', el), out = $('.o3-out', el), R = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] }, spins = 0;
    function roll() { var n = 1 + Math.random() * 6 | 0; spins += 2; c.style.transform = 'rotateX(' + (R[n][0] + spins * 360) + 'deg) rotateY(' + (R[n][1] + spins * 360) + 'deg)'; out.textContent = ''; k.later(function () { out.textContent = 'You rolled ' + n; }, 1300); }
    k.on(el, 'click', roll); roll(); k.every(roll, 3400);
  } });
  O.push({ id: 'o-box', t: 'Unboxing', jp: '開', hint: 'The lid opens and the product rises out, in 3D.', size: 'l', run: function (k, el) {
    el.innerHTML = '<div class="o3 bx3"><div class="bx3-w"><div class="bx3-f fr"><b>KAGE</b></div><div class="bx3-f bk"></div><div class="bx3-f lf"></div><div class="bx3-f rt"></div><div class="bx3-f bt"></div><div class="bx3-lid"><div class="bx3-f tp"><b>忍</b></div></div><img class="bx3-p" src="' + IMG + 'kage/keyboard.jpg" alt=""></div></div>';
    var w = $('.bx3-w', el), box = $('.bx3', el);
    k.on(el, 'click', function () { box.classList.toggle('open'); });
    k.every(function () { box.classList.toggle('open'); }, 3000);
    var p = pointer(k, el), T = 0; k.loop(function (dt) { T += dt; var ry = p.in ? p.nx * 70 : Math.sin(T * .5) * 30 - 25; w.style.transform = 'rotateX(-24deg) rotateY(' + ry + 'deg)'; });
  } });
  O.push({ id: 'o-phone', t: '3D phone mockup', jp: '携', hint: 'A phone turning in space with a live, scrolling screen.', run: function (k, el) {
    el.innerHTML = '<div class="o3 ph3"><div class="ph3-b"><div class="ph3-s"><div class="ph3-feed">' + rep(function (i) { return '<div class="ph3-post"><img src="' + IMG + ['glow/look.jpg', 'thread/look.jpg', 'deshi/look.jpg', 'carry/look.jpg', 'pebble/look.jpg'][i % 5] + '" alt=""><b>' + ['New drop', 'Autumn looks', 'Handwoven', 'Carry kit', 'Little ones'][i % 5] + '</b></div>'; }, 10) + '</div></div><i class="ph3-side"></i></div></div>';
    var b = $('.ph3-b', el), f = $('.ph3-feed', el), p = pointer(k, el), T = 0;
    k.loop(function (dt) { T += dt; var ry = p.in ? p.nx * 80 : Math.sin(T * .7) * 35, rx = p.in ? -p.ny * 30 : 8; b.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) rotateZ(' + (-ry * .05) + 'deg)'; f.style.transform = 'translateY(' + -((T * 40) % 900) + 'px)'; });
  } });
  O.push({ id: 'o-laptop', t: 'Laptop open', jp: '机', hint: 'The lid opens, the screen wakes up. Tap to close it.', run: function (k, el) {
    el.innerHTML = '<div class="o3 lp3"><div class="lp3-w"><div class="lp3-lid"><div class="lp3-scr"><img src="' + IMG + '../demos/nova-saas.jpg" alt=""></div><div class="lp3-back">' + icon('shuriken') + '</div></div><div class="lp3-base"><i></i></div></div></div>';
    var l = $('.lp3', el);
    k.on(el, 'click', function () { l.classList.toggle('open'); });
    k.later(function () { l.classList.add('open'); }, 300);
    k.every(function () { l.classList.toggle('open'); }, 3600);
  } });
  O.push({ id: 'o-extrude', t: 'Extruded type', jp: '厚', hint: 'Solid 3D letters whose depth follows your cursor.', run: function (k, el) {
    el.innerHTML = '<div class="ex3"><b>忍 LAB</b></div>';
    var b = $('b', el), p = pointer(k, el), T = 0;
    k.loop(function (dt) { T += dt; var nx = p.in ? p.nx : Math.sin(T * .8) * .5, ny = p.in ? p.ny : Math.cos(T * .6) * .4, sh = []; for (var i = 1; i <= 18; i++) sh.push((-nx * i * 1.1).toFixed(1) + 'px ' + (-ny * i * 1.1).toFixed(1) + 'px 0 hsl(8,' + (70 - i) + '%,' + (38 - i * 1.2) + '%)'); sh.push((-nx * 26) + 'px ' + (-ny * 26 + 10) + 'px 30px rgba(0,0,0,.35)'); b.style.textShadow = sh.join(','); b.style.transform = 'translate(' + nx * 12 + 'px,' + ny * 12 + 'px)'; });
  } });
  O.push({ id: 'o-keys', t: 'Mechanical keys', jp: '鍵', hint: 'Keycaps with real travel. Type on your keyboard, or watch it type.', run: function (k, el) {
    var ROW = 'XIRAIYA'.split('');
    el.innerHTML = '<div class="ky3"><div class="ky3-out"></div><div class="ky3-row">' + 'QWERTYUIOP'.split('').map(function (c) { return '<span data-k="' + c + '"><b>' + c + '</b></span>'; }).join('') + '</div><div class="ky3-row r2">' + 'ASDFGHJKL'.split('').map(function (c) { return '<span data-k="' + c + '"><b>' + c + '</b></span>'; }).join('') + '</div><div class="ky3-row r3">' + 'ZXCVBNM'.split('').map(function (c) { return '<span data-k="' + c + '"><b>' + c + '</b></span>'; }).join('') + '</div></div>';
    var out = $('.ky3-out', el), last = 0;
    function press(c) { var s = $('[data-k="' + c + '"]', el); if (!s) return; s.classList.remove('dn'); void s.offsetWidth; s.classList.add('dn'); out.textContent = (out.textContent + c).slice(-14); }
    k.on(window, 'keydown', function (e) { var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || /input|textarea/i.test(document.activeElement.tagName)) return; if (/^[a-z]$/i.test(e.key)) { press(e.key.toUpperCase()); last = Date.now(); } });
    k.on(el, 'click', function (e) { var s = e.target.closest('[data-k]'); if (s) { press(s.getAttribute('data-k')); last = Date.now(); } });
    var i = 0; k.every(function () { if (Date.now() - last > 4000) { press(ROW[i++ % ROW.length]); if (i % ROW.length === 0) k.later(function () { out.textContent += ' '; }, 200); } }, 380);
  } });
  O.push({ id: 'o-bars', t: '3D bar chart', jp: '柱', hint: 'Isometric bars grow as the monthly numbers come in.', run: function (k, el) {
    el.innerHTML = '<div class="o3 br3"><div class="br3-w">' + rep(function (i) { return '<div class="br3-b" style="--i:' + i + '"><i class="t"></i><i class="l"></i><i class="r"></i><em>' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i] + '</em></div>'; }, 6) + '</div></div>';
    var bars = $$('.br3-b', el);
    function grow() { bars.forEach(function (b) { b.style.setProperty('--v', (30 + Math.random() * 120).toFixed(0) + 'px'); }); }
    grow(); k.every(grow, 2200);
  } });
  O.push({ id: 'o-city', t: 'Isometric city', jp: '街', size: 'l', hint: 'A tiny city whose towers rise and fall. Hover a block.', run: function (k, el) {
    el.innerHTML = '<div class="o3 ct3"><div class="ct3-w">' + rep(function (i) { return '<div class="ct3-b" style="--x:' + (i % 6) + ';--y:' + (i / 6 | 0) + ';--hu:' + [8, 28, 200, 160, 45, 280][i % 6] + '"><i class="t"></i><i class="l"></i><i class="r"></i></div>'; }, 36) + '</div></div>';
    var B = $$('.ct3-b', el);
    function lift() { B.forEach(function (b) { b.style.setProperty('--h', (8 + Math.pow(Math.random(), 2) * 110).toFixed(0) + 'px'); }); }
    lift(); k.every(lift, 2600);
    B.forEach(function (b) { k.on(b, 'pointerenter', function () { b.style.setProperty('--h', '150px'); }); });
  } });
  O.push({ id: 'o-door', t: 'Open door', jp: '扉', hint: 'Knock knock. The door swings open to the light.', run: function (k, el) {
    el.innerHTML = '<div class="o3 dr3"><div class="dr3-frame"><div class="dr3-light"><b>Welcome in.</b><span>Your project starts here.</span></div><div class="dr3-door"><i class="dr3-knob"></i><i class="dr3-p p1"></i><i class="dr3-p p2"></i></div></div></div>';
    var d = $('.dr3', el); k.on(el, 'click', function () { d.classList.toggle('open'); }); k.later(function () { d.classList.add('open'); }, 400); k.every(function () { d.classList.toggle('open'); }, 3200);
  } });
  O.push({ id: 'o-textring', t: 'Text ring', jp: '環字', hint: 'A sentence wrapped around a spinning cylinder.', run: function (k, el) {
    var S = ' BUILD · AUTOMATE · SHIP · REPEAT ·'.split('');
    el.innerHTML = '<div class="o3 tr3"><div class="tr3-r">' + S.map(function (c, i) { return '<span style="--a:' + (i * 360 / S.length) + 'deg">' + esc(c) + '</span>'; }).join('') + '</div><b class="tr3-c">忍</b></div>';
    var r = $('.tr3-r', el); drag3d(k, el, r, { rx: -12, spin: 30 });
  } });
  O.push({ id: 'o-flipclock', t: 'Flip clock', jp: '時', hint: 'A real flip clock showing your local time.', run: function (k, el) {
    el.innerHTML = '<div class="fl3">' + rep(function (i) { return (i === 2 || i === 4 ? '<i class="fl3-c">:</i>' : '') + '<div class="fl3-d"><span class="up"><b>0</b></span><span class="dn"><b>0</b></span><span class="fu"><b>0</b></span><span class="fd"><b>0</b></span></div>'; }, 6) + '</div>';
    var D = $$('.fl3-d', el), cur = ['', '', '', '', '', ''];
    function tick() { var s = new Date().toTimeString().slice(0, 8).replace(/:/g, ''); D.forEach(function (d, i) { if (s[i] === cur[i]) return; var old = cur[i] || s[i]; cur[i] = s[i]; $('.up b', d).textContent = s[i]; $('.fu b', d).textContent = old; $('.dn b', d).textContent = old; $('.fd b', d).textContent = s[i]; d.classList.remove('go'); void d.offsetWidth; d.classList.add('go'); k.later(function () { $('.dn b', d).textContent = s[i]; }, 600); }); }
    tick(); k.every(tick, 250);
  } });
  O.push({ id: 'o-pricing', t: 'Floating pricing', jp: '価', size: 'l', hint: 'Three plans floating in 3D. Hover one to bring it forward.', run: function (k, el) {
    var P = [['Spark', '$50', 'Landing pages'], ['Blade', '$100', 'Shops & bots'], ['Legend', '$250', 'Full systems']];
    el.innerHTML = '<div class="o3 pr3"><div class="pr3-w">' + P.map(function (p, i) { return '<div class="pr3-c c' + i + '"><small>' + p[0] + '</small><b>' + p[1] + '<em>+</em></b><span>' + p[2] + '</span><i>Choose</i></div>'; }).join('') + '</div></div>';
    var w = $('.pr3-w', el), cs = $$('.pr3-c', el), cur = 1, hold = 0, p = pointer(k, el), T = 0;
    function set(i) { cur = i; cs.forEach(function (c, j) { c.classList.toggle('on', j === i); }); }
    cs.forEach(function (c, i) { k.on(c, 'pointerenter', function () { hold = Date.now(); set(i); }); });
    set(1); k.every(function () { if (Date.now() - hold > 4000) set((cur + 1) % 3); }, 1800);
    k.loop(function (dt) { T += dt; w.style.transform = 'rotateX(' + (p.in ? -p.ny * 16 : 8) + 'deg) rotateY(' + (p.in ? p.nx * 24 : Math.sin(T * .5) * 12) + 'deg)'; });
  } });
  O.push({ id: 'o-origami', t: 'Origami fold', jp: '折', hint: 'A square of paper folding into quarters and opening again.', run: function (k, el) {
    el.innerHTML = '<div class="o3 og3"><div class="og3-p"><div class="og3-q q1"></div><div class="og3-q q2"></div><div class="og3-h"><div class="og3-q q3"></div><div class="og3-q q4"></div></div></div></div>';
    var o = $('.og3', el), st = 0; k.on(el, 'click', function () { st = (st + 1) % 3; o.setAttribute('data-s', st); }); k.every(function () { st = (st + 1) % 3; o.setAttribute('data-s', st); }, 1500);
    var p = $('.og3-p', el), T = 0; k.loop(function (dt) { T += dt; p.style.transform = 'rotateX(52deg) rotateZ(' + (T * 12) + 'deg)'; });
  } });
  O.forEach(function (o) { add({ id: o.id, t: o.t, jp: o.jp, tag: '3d', size: o.size || 's', kw: 'css 3d object', hint: o.hint, run: o.run }); });

  /* ================= particle systems ================= */
  function sim(o) {
    return function (k, el) {
      var cv = canvas(k, el), g = cv.g, p = pointer(k, el), S = { P: [], T: 0, cv: cv, g: g, p: p, k: k };
      el.style.background = o.bg || '#0c0a10';
      if (o.init) o.init(S);
      if (o.click) k.on(el, 'pointerdown', function () { o.click(S); });
      k.loop(function (dt) { S.T += dt; S.dt = dt; o.step(S); });
    };
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var PS = [];
  PS.push({ id: 'p-fireworks', t: 'Fireworks', jp: '花火', size: 'l', hint: 'Click anywhere to launch a firework. It also fires on its own.', bg: '#07060c', init: function (S) { S.R = []; }, click: function (S) { S.R.push({ x: S.p.x, y: S.cv.h, ty: S.p.y, vy: -Math.sqrt(2 * 520 * Math.max(40, S.cv.h - S.p.y)), h: rnd(0, 360) }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt; g.fillStyle = 'rgba(7,6,12,.22)'; g.fillRect(0, 0, w, h);
    if (Math.random() < dt * 1.1) S.R.push({ x: rnd(w * .15, w * .85), y: h, ty: rnd(h * .15, h * .45), vy: 0, h: rnd(0, 360) }), S.R[S.R.length - 1].vy = -Math.sqrt(2 * 520 * (h - S.R[S.R.length - 1].ty));
    S.R = S.R.filter(function (r) { r.vy += 520 * dt; r.y += r.vy * dt; g.fillStyle = 'hsl(' + r.h + ',90%,80%)'; g.fillRect(r.x - 1, r.y, 2, 6); if (r.vy >= 0) { var n = 70; for (var i = 0; i < n; i++) { var a = i / n * 6.283, s = rnd(60, 190); S.P.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1, h: r.h + rnd(-20, 20) }); } return false; } return true; });
    S.P = S.P.filter(function (q) { q.vy += 90 * dt; q.vx *= .985; q.vy *= .985; q.x += q.vx * dt; q.y += q.vy * dt; q.l -= dt * .6; g.fillStyle = 'hsla(' + q.h + ',95%,' + (60 + q.l * 20) + '%,' + q.l + ')'; g.fillRect(q.x, q.y, 2, 2); return q.l > 0; });
  } });
  PS.push({ id: 'p-sakura', t: 'Sakura petals', jp: '桜', hint: 'Cherry blossom petals tumbling in 3D. Your cursor is the wind.', bg: '#f7e9ea', init: function (S) { for (var i = 0; i < 70; i++) S.P.push({ x: rnd(0, 600), y: rnd(-400, 400), z: rnd(.4, 1.2), a: rnd(0, 6), s: rnd(.5, 2) }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt, p = S.p; g.clearRect(0, 0, w, h);
    S.P.forEach(function (q) { var wind = p.in ? (p.nx) * 120 : Math.sin(S.T * .4) * 40; q.x += (20 + wind) * dt * q.z + Math.sin(S.T + q.a) * .4; q.y += 40 * dt * q.z; q.a += dt * q.s; if (q.y > h + 20) { q.y = -20; q.x = rnd(-50, w); } if (q.x > w + 20) q.x = -20; if (q.x < -20) q.x = w + 20;
      g.save(); g.translate(q.x, q.y); g.rotate(q.a); g.scale(Math.cos(q.a * 1.3) * q.z * 1.1, q.z); g.fillStyle = 'hsl(' + (345 + q.z * 8) + ',75%,' + (78 - q.z * 8) + '%)'; g.beginPath(); g.moveTo(0, -7); g.bezierCurveTo(6, -6, 6, 5, 0, 8); g.bezierCurveTo(-6, 5, -6, -6, 0, -7); g.fill(); g.restore(); });
  } });
  PS.push({ id: 'p-snow', t: 'Snowfall', jp: '雪', hint: 'Three layers of snow. Move the cursor to blow it around.', bg: '#0e1624', init: function (S) { for (var i = 0; i < 260; i++) S.P.push({ x: rnd(0, 900), y: rnd(0, 500), z: rnd(.3, 1), o: rnd(0, 6) }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt, p = S.p; g.fillStyle = '#0e1624'; g.fillRect(0, 0, w, h);
    S.P.forEach(function (q) { var wx = Math.sin(S.T * .8 + q.o) * 14; if (p.in) { var dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d < 90) { q.x += dx / d * 160 * dt; q.y += dy / d * 80 * dt; } } q.x += wx * dt * q.z; q.y += (18 + q.z * 40) * dt; if (q.y > h) { q.y = -4; q.x = rnd(0, w); } if (q.x > w) q.x = 0; if (q.x < 0) q.x = w; g.fillStyle = 'rgba(255,255,255,' + (.3 + q.z * .7) + ')'; g.beginPath(); g.arc(q.x, q.y, q.z * 2.4, 0, 6.3); g.fill(); });
  } });
  PS.push({ id: 'p-confetti', t: 'Confetti', jp: '祝', hint: 'Click to celebrate. Paper confetti with real flutter.', bg: '#fffaf1', init: function (S) { S.burst = function (x, y) { for (var i = 0; i < 90; i++) S.P.push({ x: x, y: y, vx: rnd(-260, 260), vy: rnd(-520, -120), a: rnd(0, 6), va: rnd(-10, 10), c: ['#c4321d', '#d9a441', '#2f6fe0', '#1f8a5b', '#7c5cff', '#e2703a'][i % 6], w: rnd(5, 9), h: rnd(8, 14) }); }; }, click: function (S) { S.burst(S.p.x, S.p.y); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt; g.clearRect(0, 0, w, h); if (Math.random() < dt * .45) S.burst(rnd(w * .2, w * .8), h * .9);
    S.P = S.P.filter(function (q) { q.vy += 500 * dt; q.vx *= .99; q.vy = Math.min(q.vy, 140); q.x += q.vx * dt + Math.sin(q.a) * .6; q.y += q.vy * dt; q.a += q.va * dt; g.save(); g.translate(q.x, q.y); g.rotate(q.a); g.scale(1, Math.cos(q.a * 2)); g.fillStyle = q.c; g.fillRect(-q.w / 2, -q.h / 2, q.w, q.h); g.restore(); return q.y < h + 20; });
  } });
  PS.push({ id: 'p-fireflies', t: 'Fireflies', jp: '蛍', hint: 'Fireflies drift at dusk and gather around your cursor.', bg: '#0b1410', init: function (S) { for (var i = 0; i < 60; i++) S.P.push({ x: rnd(0, 600), y: rnd(0, 360), a: rnd(0, 6), s: rnd(10, 30), ph: rnd(0, 6) }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt, p = S.p; var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b1410'); gr.addColorStop(1, '#162619'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    S.P.forEach(function (q) { q.a += rnd(-2, 2) * dt; if (p.in) { var ta = Math.atan2(p.y - q.y, p.x - q.x); q.a += Math.sin(ta - q.a) * dt * 2; } q.x += Math.cos(q.a) * q.s * dt; q.y += Math.sin(q.a) * q.s * dt; if (q.x < 0 || q.x > w) q.a = Math.PI - q.a; if (q.y < 0 || q.y > h) q.a = -q.a; q.x = Math.max(0, Math.min(w, q.x)); q.y = Math.max(0, Math.min(h, q.y)); var b = Math.max(0, Math.sin(S.T * 2 + q.ph)); var rg = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 14); rg.addColorStop(0, 'rgba(220,255,120,' + b + ')'); rg.addColorStop(1, 'rgba(220,255,120,0)'); g.fillStyle = rg; g.fillRect(q.x - 14, q.y - 14, 28, 28); });
  } });
  PS.push({ id: 'p-rain', t: 'Rain & ripples', jp: '雨', hint: 'Rain falling on a still pond. Every drop leaves a ring.', bg: '#101820', init: function (S) { S.Rp = []; }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt, hz = h * .55; g.fillStyle = '#101820'; g.fillRect(0, 0, w, h); g.fillStyle = '#152330'; g.fillRect(0, hz, w, h - hz);
    for (var i = 0; i < 3; i++) if (Math.random() < .9) S.P.push({ x: rnd(0, w), y: rnd(-40, 0), ty: rnd(hz, h), v: rnd(500, 700) });
    g.strokeStyle = 'rgba(170,200,230,.5)'; g.lineWidth = 1;
    S.P = S.P.filter(function (q) { q.y += q.v * dt; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x - 1, q.y - 10); g.stroke(); if (q.y >= q.ty) { S.Rp.push({ x: q.x, y: q.y, r: 0, s: (q.ty - hz) / (h - hz) }); return false; } return true; });
    S.Rp = S.Rp.filter(function (r) { r.r += dt * 40; var a = 1 - r.r / 30; g.strokeStyle = 'rgba(170,200,230,' + a * .6 + ')'; g.beginPath(); g.ellipse(r.x, r.y, r.r * (.6 + r.s), r.r * .3 * (.6 + r.s), 0, 0, 6.3); g.stroke(); return a > 0; });
  } });
  PS.push({ id: 'p-bubbles', t: 'Soap bubbles', jp: '泡', hint: 'Iridescent bubbles float up. Click one to pop it.', bg: '#e9f1f6', init: function (S) { for (var i = 0; i < 18; i++) S.P.push({ x: rnd(0, 600), y: rnd(0, 400), r: rnd(10, 34), v: rnd(15, 40), ph: rnd(0, 6) }); S.pop = []; }, click: function (S) { S.P = S.P.filter(function (q) { if (Math.hypot(q.x - S.p.x, q.y - S.p.y) < q.r) { for (var i = 0; i < 10; i++) S.pop.push({ x: q.x, y: q.y, a: i / 10 * 6.3, d: q.r, l: 1 }); return false; } return true; }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt; g.clearRect(0, 0, w, h); while (S.P.length < 18) S.P.push({ x: rnd(0, w), y: h + 40, r: rnd(10, 34), v: rnd(15, 40), ph: rnd(0, 6) });
    S.P.forEach(function (q) { q.y -= q.v * dt; q.x += Math.sin(S.T + q.ph) * .5; if (q.y < -40) q.y = h + 40; var gr = g.createRadialGradient(q.x - q.r * .3, q.y - q.r * .4, q.r * .1, q.x, q.y, q.r); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.6, 'hsla(' + (S.T * 40 + q.ph * 60) % 360 + ',80%,70%,.12)'); gr.addColorStop(.95, 'hsla(' + (S.T * 40 + q.ph * 60 + 120) % 360 + ',80%,60%,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 6.3); g.fill(); });
    S.pop = S.pop.filter(function (d) { d.l -= dt * 3; d.d += dt * 60; g.fillStyle = 'rgba(120,160,190,' + d.l + ')'; g.fillRect(d.x + Math.cos(d.a) * d.d, d.y + Math.sin(d.a) * d.d, 2, 2); return d.l > 0; });
  } });
  PS.push({ id: 'p-boids', t: 'Flocking birds', jp: '群', size: 'l', hint: '150 birds following three simple rules. Your cursor is a hawk.', bg: '#f2e6d4', init: function (S) { for (var i = 0; i < 150; i++) S.P.push({ x: rnd(0, 700), y: rnd(0, 380), vx: rnd(-60, 60), vy: rnd(-60, 60) }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt, p = S.p, P = S.P; g.fillStyle = 'rgba(242,230,212,.5)'; g.fillRect(0, 0, w, h);
    P.forEach(function (b) { var cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0; for (var i = 0; i < P.length; i += 2) { var o = P[i]; if (o === b) continue; var dx = o.x - b.x, dy = o.y - b.y, d = dx * dx + dy * dy; if (d < 3600) { cx += o.x; cy += o.y; ax += o.vx; ay += o.vy; n++; if (d < 400) { sx -= dx; sy -= dy; } } } if (n) { b.vx += ((cx / n - b.x) * .6 + (ax / n - b.vx) * .8 + sx * 3) * dt; b.vy += ((cy / n - b.y) * .6 + (ay / n - b.vy) * .8 + sy * 3) * dt; } if (p.in) { var hx = b.x - p.x, hy = b.y - p.y, hd = Math.hypot(hx, hy); if (hd < 110) { b.vx += hx / hd * 900 * dt; b.vy += hy / hd * 900 * dt; } } var sp = Math.hypot(b.vx, b.vy), mx = 150; if (sp > mx) { b.vx *= mx / sp; b.vy *= mx / sp; } if (sp < 60) { b.vx *= 1.05; b.vy *= 1.05; } if (b.x < 30) b.vx += 300 * dt; if (b.x > w - 30) b.vx -= 300 * dt; if (b.y < 30) b.vy += 300 * dt; if (b.y > h - 30) b.vy -= 300 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      var a = Math.atan2(b.vy, b.vx); g.save(); g.translate(b.x, b.y); g.rotate(a); g.fillStyle = '#1f1813'; g.beginPath(); g.moveTo(6, 0); g.lineTo(-5, 3.5); g.lineTo(-3, 0); g.lineTo(-5, -3.5); g.fill(); g.restore(); });
  } });
  PS.push({ id: 'p-flow', t: 'Flow field', jp: '流', hint: 'Thousands of particles following an invisible current.', bg: '#0d0a14', init: function (S) { for (var i = 0; i < 1400; i++) S.P.push({ x: rnd(0, 700), y: rnd(0, 400), l: rnd(0, 1) }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt; g.fillStyle = 'rgba(13,10,20,.06)'; g.fillRect(0, 0, w, h);
    S.P.forEach(function (q) { var a = (Math.sin(q.x * .008 + S.T * .2) + Math.cos(q.y * .01 - S.T * .15)) * 3; var nx = q.x + Math.cos(a) * 50 * dt, ny = q.y + Math.sin(a) * 50 * dt; g.strokeStyle = 'hsla(' + (a * 40 + 280) % 360 + ',85%,65%,.5)'; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(nx, ny); g.stroke(); q.x = nx; q.y = ny; q.l -= dt * .2; if (q.l < 0 || q.x < 0 || q.x > w || q.y < 0 || q.y > h) { q.x = rnd(0, w); q.y = rnd(0, h); q.l = 1; } });
  } });
  PS.push({ id: 'p-gravity', t: 'Gravity sandbox', jp: '重力', hint: 'Click to drop a new moon into orbit around the sun.', bg: '#05040a', init: function (S) { S.add = function (x, y) { var cx = S.cv.w / 2, cy = S.cv.h / 2, dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, v = Math.sqrt(60000 / d); S.P.push({ x: x, y: y, vx: -dy / d * v, vy: dx / d * v, h: rnd(0, 360), tr: [] }); if (S.P.length > 14) S.P.shift(); }; for (var i = 0; i < 6; i++) S.add(S.cv.w / 2 + rnd(60, 160) * (i % 2 ? 1 : -1), S.cv.h / 2 + rnd(-30, 30)); }, click: function (S) { S.add(S.p.x, S.p.y); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt, cx = w / 2, cy = h / 2; g.fillStyle = 'rgba(5,4,10,.3)'; g.fillRect(0, 0, w, h); var rg = g.createRadialGradient(cx, cy, 0, cx, cy, 30); rg.addColorStop(0, '#fff3c4'); rg.addColorStop(.4, '#ffb347'); rg.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = rg; g.fillRect(cx - 30, cy - 30, 60, 60);
    S.P.forEach(function (q) { for (var s = 0; s < 4; s++) { var dx = cx - q.x, dy = cy - q.y, d2 = Math.max(200, dx * dx + dy * dy), d = Math.sqrt(d2), a = 60000 / d2; q.vx += dx / d * a * dt / 4; q.vy += dy / d * a * dt / 4; q.x += q.vx * dt / 4; q.y += q.vy * dt / 4; } g.fillStyle = 'hsl(' + q.h + ',80%,65%)'; g.beginPath(); g.arc(q.x, q.y, 3.5, 0, 6.3); g.fill(); });
  } });
  PS.push({ id: 'p-meta', t: 'Lava lamp', jp: '溶', hint: 'Metaballs: blobs that melt together like a lava lamp.', bg: '#1a0b12', init: function (S) { for (var i = 0; i < 7; i++) S.P.push({ x: rnd(.2, .8), y: rnd(.1, .9), vy: rnd(-.06, .06), r: rnd(.08, .15) }); S.o = document.createElement('canvas'); S.o.width = 120; S.o.height = 90; S.og = S.o.getContext('2d'); S.img = S.og.createImageData(120, 90); }, step: function (S) {
    var P = S.P, d = S.img.data, dt = S.dt; P.forEach(function (b, i) { b.y += Math.sin(S.T * .3 + i * 1.7) * .08 * dt; b.x += Math.cos(S.T * .2 + i) * .03 * dt; });
    for (var y = 0; y < 90; y++) for (var x = 0; x < 120; x++) { var s = 0; for (var i = 0; i < P.length; i++) { var dx = x / 120 - P[i].x, dy = (y / 90 - P[i].y) * .75; s += P[i].r * P[i].r / (dx * dx + dy * dy + 1e-4); } var k2 = (y * 120 + x) * 4; if (s > 1) { var t = Math.min(1, (s - 1) * 2); d[k2] = 255; d[k2 + 1] = 70 + t * 110; d[k2 + 2] = 40 + t * 20; d[k2 + 3] = 255; } else { d[k2] = 26 + y * .6; d[k2 + 1] = 11; d[k2 + 2] = 18 + y * .3; d[k2 + 3] = 255; } }
    S.og.putImageData(S.img, 0, 0); S.g.imageSmoothingEnabled = true; S.g.drawImage(S.o, 0, 0, S.cv.w, S.cv.h);
  } });
  PS.push({ id: 'p-net', t: 'Constellation', jp: '網', hint: 'Points join into constellations near your cursor.', bg: '#0b0d18', init: function (S) { for (var i = 0; i < 90; i++) S.P.push({ x: rnd(0, 700), y: rnd(0, 400), vx: rnd(-20, 20), vy: rnd(-20, 20) }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt, p = S.p, P = S.P; g.fillStyle = '#0b0d18'; g.fillRect(0, 0, w, h); var cx = p.in ? p.x : w / 2 + Math.cos(S.T * .5) * w * .3, cy = p.in ? p.y : h / 2 + Math.sin(S.T * .7) * h * .3;
    P.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.x < 0 || q.x > w) q.vx *= -1; if (q.y < 0 || q.y > h) q.vy *= -1; });
    for (var i = 0; i < P.length; i++) { var a = P[i], da = Math.hypot(a.x - cx, a.y - cy); for (var j = i + 1; j < P.length; j++) { var b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 90) { var near = Math.max(0, 1 - da / 200); g.strokeStyle = 'rgba(140,170,255,' + ((1 - d / 90) * (.1 + near * .7)).toFixed(3) + ')'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } } g.fillStyle = da < 200 ? '#ffe2a8' : 'rgba(200,210,255,.6)'; g.fillRect(a.x - 1.5, a.y - 1.5, 3, 3); }
  } });
  PS.push({ id: 'p-matrix', t: 'Code rain', jp: '雨字', hint: 'Falling code in katakana and digits. Hover to slow it.', bg: '#020a04', init: function (S) { S.cols = []; }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, fs = 14, n = Math.ceil(w / fs); while (S.cols.length < n) S.cols.push(rnd(-40, 0)); g.fillStyle = 'rgba(2,10,4,.12)'; g.fillRect(0, 0, w, h); g.font = fs + 'px "JetBrains Mono", monospace';
    var ch = 'アイウエオカキクケコサシスセソ0123456789忍XIRAIYA', slow = S.p.in ? .35 : 1;
    for (var i = 0; i < n; i++) { var y = S.cols[i] * fs; g.fillStyle = Math.random() < .05 ? '#e8ffe8' : '#3fd07f'; g.fillText(ch[Math.random() * ch.length | 0], i * fs, y); if (Math.random() < .5 * slow) S.cols[i]++; if (y > h && Math.random() > .975) S.cols[i] = 0; }
  } });
  PS.push({ id: 'p-smoke', t: 'Incense smoke', jp: '煙', hint: 'Soft smoke curls up from a stick of incense.', bg: '#15110e', step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt, x0 = S.p.in ? S.p.x : w / 2, y0 = h * .85; g.fillStyle = 'rgba(21,17,14,.14)'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 3; i++) S.P.push({ x: x0 + rnd(-2, 2), y: y0, vx: rnd(-6, 6), vy: rnd(-45, -30), r: rnd(3, 6), l: 1, ph: rnd(0, 6) });
    S.P = S.P.filter(function (q) { q.x += (q.vx + Math.sin(S.T * 1.5 + q.ph + q.y * .03) * 22) * dt; q.y += q.vy * dt; q.r += dt * 10; q.l -= dt * .28; g.fillStyle = 'rgba(210,200,190,' + (q.l * .05).toFixed(3) + ')'; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 6.3); g.fill(); return q.l > 0; });
    g.fillStyle = '#6b3a2f'; g.fillRect(x0 - 1.5, y0, 3, h - y0); g.fillStyle = '#ff7a3a'; g.fillRect(x0 - 2, y0 - 2, 4, 4);
  } });
  PS.push({ id: 'p-field', t: 'Magnetic field', jp: '磁界', hint: 'Field lines between two poles. Drag the red pole around.', bg: '#f4ecdc', init: function (S) { S.a = { x: .3, y: .5 }; S.b = { x: .7, y: .5 }; }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, p = S.p; if (p.in && p.down) { S.a.x = p.x / w; S.a.y = p.y / h; } else if (!p.in) { S.a.x = .3 + Math.sin(S.T * .5) * .12; S.a.y = .5 + Math.cos(S.T * .7) * .2; }
    var A = { x: S.a.x * w, y: S.a.y * h }, B = { x: S.b.x * w, y: S.b.y * h }; g.clearRect(0, 0, w, h); g.lineWidth = 1.2;
    for (var k2 = 0; k2 < 18; k2++) { var an = k2 / 18 * 6.283, x = A.x + Math.cos(an) * 8, y = A.y + Math.sin(an) * 8; g.strokeStyle = 'rgba(31,24,19,.55)'; g.beginPath(); g.moveTo(x, y); for (var s = 0; s < 240; s++) { var dax = x - A.x, day = y - A.y, dbx = x - B.x, dby = y - B.y, ra = Math.pow(dax * dax + day * day, 1.5), rb = Math.pow(dbx * dbx + dby * dby, 1.5), fx = dax / ra - dbx / rb, fy = day / ra - dby / rb, m = Math.hypot(fx, fy) || 1; x += fx / m * 4; y += fy / m * 4; g.lineTo(x, y); if (Math.hypot(x - B.x, y - B.y) < 8 || x < -50 || x > w + 50 || y < -50 || y > h + 50) break; } g.stroke(); }
    [[A, '#c4321d', 'N'], [B, '#2f6fe0', 'S']].forEach(function (o) { g.fillStyle = o[1]; g.beginPath(); g.arc(o[0].x, o[0].y, 12, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.font = '700 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o[2], o[0].x, o[0].y); });
  } });
  PS.forEach(function (o) { add({ id: o.id, t: o.t, jp: o.jp, tag: 'particles', size: o.size || 's', kw: 'canvas particles', hint: o.hint, run: sim(o) }); });
})();
