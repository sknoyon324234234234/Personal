/* XIRAIYA — Motion Wing: CSS 3D device mockups, 3D pricing and a generative flow field. */
(function () {
  'use strict';
  var W = window.XRWING, XR = window.XR;
  if (!W || !XR) return;
  var $ = XR.$, $$ = XR.$$, icon = XR.icon, esc = XR.esc, add = W.add, pointer = W.pointer, canvas = W.canvas, IMG = W.IMG;
  function rep(s, n) { var o = ''; for (var i = 0; i < n; i++) o += s(i); return o; }


  /* ================= CSS 3D objects ================= */
  var O = [];
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
  O.push({ id: 'o-pricing', t: 'Floating pricing', jp: '価', size: 'l', hint: 'Three plans floating in 3D. Hover one to bring it forward.', run: function (k, el) {
    var P = [['Spark', '$50', 'Landing pages'], ['Blade', '$100', 'Shops & bots'], ['Legend', '$250', 'Full systems']];
    el.innerHTML = '<div class="o3 pr3"><div class="pr3-w">' + P.map(function (p, i) { return '<div class="pr3-c c' + i + '"><small>' + p[0] + '</small><b>' + p[1] + '<em>+</em></b><span>' + p[2] + '</span><i>Choose</i></div>'; }).join('') + '</div></div>';
    var w = $('.pr3-w', el), cs = $$('.pr3-c', el), cur = 1, hold = 0, p = pointer(k, el), T = 0;
    function set(i) { cur = i; cs.forEach(function (c, j) { c.classList.toggle('on', j === i); }); }
    cs.forEach(function (c, i) { k.on(c, 'pointerenter', function () { hold = Date.now(); set(i); }); });
    set(1); k.every(function () { if (Date.now() - hold > 4000) set((cur + 1) % 3); }, 1800);
    k.loop(function (dt) { T += dt; w.style.transform = 'rotateX(' + (p.in ? -p.ny * 16 : 8) + 'deg) rotateY(' + (p.in ? p.nx * 24 : Math.sin(T * .5) * 12) + 'deg)'; });
  } });
  O.forEach(function (o) { add({ id: o.id, t: o.t, jp: o.jp, tag: '3d', size: o.size || 's', kw: 'css 3d object', hint: o.hint, run: o.run }); });

  /* ================= generative canvas ================= */
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
  PS.push({ id: 'p-flow', t: 'Generative flow field', jp: '流', hint: 'Generative art from 1,400 particles. Your cursor becomes a whirlpool.', bg: '#0d0a14', init: function (S) { for (var i = 0; i < 1400; i++) S.P.push({ x: rnd(0, 700), y: rnd(0, 400), l: rnd(0, 1) }); }, step: function (S) {
    var g = S.g, w = S.cv.w, h = S.cv.h, dt = S.dt; g.fillStyle = 'rgba(13,10,20,.06)'; g.fillRect(0, 0, w, h);
    S.P.forEach(function (q) { var a = (Math.sin(q.x * .008 + S.T * .2) + Math.cos(q.y * .01 - S.T * .15)) * 3; if (S.p.in) { var vx = q.x - S.p.x, vy = q.y - S.p.y, vd = Math.hypot(vx, vy); if (vd < 130) a = Math.atan2(vy, vx) + 1.9 - (1 - vd / 130) * .6; } var nx = q.x + Math.cos(a) * 50 * dt, ny = q.y + Math.sin(a) * 50 * dt; g.strokeStyle = 'hsla(' + (a * 40 + 280) % 360 + ',85%,65%,.5)'; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(nx, ny); g.stroke(); q.x = nx; q.y = ny; q.l -= dt * .2; if (q.l < 0 || q.x < 0 || q.x > w || q.y < 0 || q.y > h) { q.x = rnd(0, w); q.y = rnd(0, h); q.l = 1; } });
  } });
  PS.forEach(function (o) { add({ id: o.id, t: o.t, jp: o.jp, tag: 'motion', size: o.size || 's', kw: 'canvas particles generative', hint: o.hint, run: sim(o) }); });
})();
