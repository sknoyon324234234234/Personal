/* Lab stage 09 — the project scroll: a handscroll you drag open; each scene stamps its seal as you reach it */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var NS = 'http://www.w3.org/2000/svg';
  var SEALS = ['壱', '弐', '参', '肆', '伍', '陸'];

  LAB.register('scroll', function (stage) {
    var paper = XR.$('.em-paper', stage), strip = XR.$('.em-strip', stage), land = XR.$('.em-land', stage), track = XR.$('.em-seals', stage);
    var scenes = XR.$$('.em-scene[data-i]', stage), outro = XR.$('.em-outro', stage), seals = XR.$$('.em-seals button', stage);
    var rods = XR.$$('.em-rod', stage), prev = XR.$('.em-prev', stage), next = XR.$('.em-next', stage);
    var now = -1, raf = 0;

    scenes.forEach(function (s, i) { s.insertAdjacentHTML('afterbegin', '<span class="cr-seal em-stamp jp" aria-hidden="true">' + SEALS[i] + '</span>'); });

    /* ---- the painted ground: two ink ridges, a dotted path, pines, and gold clouds between scenes ---- */
    function draw() {
      var W = strip.scrollWidth, H = paper.clientHeight, r = LAB.rng('emaki'), out = '';
      function ridge(base, amp, step) {
        var d = 'M0 ' + H, y;
        for (var x = 0; x <= W + step; x += step) { y = base - amp * (.35 + .65 * Math.abs(Math.sin(x / (step * 3.1) + r() * .6))) * (.6 + r() * .5); d += ' L' + x + ' ' + y.toFixed(1); }
        return d + ' L' + W + ' ' + H + 'Z';
      }
      out += '<defs><linearGradient id="emGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9cf8c" stop-opacity=".75"/><stop offset="1" stop-color="#d1a651" stop-opacity=".55"/></linearGradient></defs>';
      out += '<path class="ridge2" d="' + ridge(H * .74, H * .16, 46) + '"/>';
      out += '<path class="ridge" d="' + ridge(H * .9, H * .1, 34) + '"/>';
      var p = 'M0 ' + (H * .93).toFixed(1);
      for (var x = 40; x <= W; x += 40) p += ' L' + x + ' ' + (H * .93 - Math.sin(x / 90) * H * .025).toFixed(1);
      out += '<path class="path" d="' + p + '"/>';
      for (var t = 0; t < W / 160; t++) {
        var px = 60 + t * 160 + r() * 90, py = H * (.8 + r() * .08), h = 16 + r() * 16;
        out += '<path class="pine" d="M' + px.toFixed(0) + ' ' + py.toFixed(0) + 'v-' + h.toFixed(0) + 'm-7 ' + (h * .35).toFixed(0) + 'l7-6 7 6m-10 ' + (h * .3).toFixed(0) + 'l10-7 10 7"/>';
      }
      [scenes[0]].concat(scenes, [outro]).forEach(function (s, i) {
        if (!i) return;
        var bx = s.offsetLeft;
        [[.05, 150, 16], [.1, 96, 13], [.86, 170, 16], [.92, 110, 12]].forEach(function (c) {
          out += '<rect class="kasumi" x="' + (bx - c[1] / 2 + (r() - .5) * 40).toFixed(0) + '" y="' + (H * c[0]).toFixed(0) + '" width="' + c[1] + '" height="' + c[2] + '" rx="' + (c[2] / 2) + '"/>';
        });
      });
      land.setAttribute('width', W); land.setAttribute('height', H);
      land.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      land.innerHTML = out;
    }

    /* ---- where are we? ---- */
    function mid(el) { return el.offsetLeft + el.offsetWidth / 2; }
    function update() {
      raf = 0;
      var sl = paper.scrollLeft, c = sl + paper.clientWidth / 2;
      rods.forEach(function (rod, i) { rod.style.setProperty('--roll', (i ? -sl : sl) * .6 + 'px'); });
      var c0 = mid(scenes[0]), c5 = mid(scenes[scenes.length - 1]);
      track.style.setProperty('--p', XR.clamp((c - c0) / (c5 - c0), 0, 1).toFixed(3));
      var best = -1, bd = Infinity;
      scenes.forEach(function (s, i) { var d = Math.abs(mid(s) - c); if (d < bd) { bd = d; best = i; } });
      if (bd > scenes[0].offsetWidth * .6) best = c < c0 ? -1 : scenes.length;
      if (best === now) return;
      now = best;
      scenes.forEach(function (s, i) {
        if (i === now) s.classList.add('is-seen');
        seals[i].parentNode.classList.toggle('is-now', i === now);
        seals[i].parentNode.classList.toggle('is-seen', s.classList.contains('is-seen'));
        seals[i].setAttribute('aria-current', i === now ? 'step' : 'false');
      });
      prev.disabled = now < 0;
      next.disabled = now >= scenes.length;
    }
    paper.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });

    function go(i) {
      var el = i < 0 ? null : i >= scenes.length ? outro : scenes[i];
      var left = el ? mid(el) - paper.clientWidth / 2 : 0;
      paper.scrollTo({ left: Math.max(0, left), behavior: XR.reduce ? 'auto' : 'smooth' });
    }
    prev.addEventListener('click', function () { go(now - 1); });
    next.addEventListener('click', function () { go(now + 1); });
    seals.forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-go')); }); });
    paper.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); go(now + (k === 'ArrowRight' ? 1 : -1)); }
      else if (k === 'Home') { e.preventDefault(); go(-1); }
      else if (k === 'End') { e.preventDefault(); go(scenes.length); }
    });

    /* mouse drag (touch and trackpads already scroll natively) */
    var down = null;
    paper.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button')) return;
      e.preventDefault();
      paper.focus({ preventScroll: true });
      down = { x: e.clientX, s: paper.scrollLeft, moved: false };
      paper.classList.add('is-drag');
      try { paper.setPointerCapture(e.pointerId); } catch (err) {}
    });
    paper.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x;
      if (Math.abs(dx) > 3) down.moved = true;
      paper.scrollLeft = down.s - dx;
    });
    function release() {
      if (!down) return;
      down = null;
      paper.classList.remove('is-drag');
      if (now >= 0 && now < scenes.length) go(now);
    }
    paper.addEventListener('pointerup', release);
    paper.addEventListener('pointercancel', release);

    var redraw = 0;
    function relayout() { clearTimeout(redraw); redraw = setTimeout(function () { draw(); now = -2; update(); }, 120); }
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(paper);
    else window.addEventListener('resize', relayout);
    XR.$$('img', strip).forEach(function (im) { if (!im.complete) im.addEventListener('load', relayout, { once: true }); });
    draw(); update();
  });
})();
