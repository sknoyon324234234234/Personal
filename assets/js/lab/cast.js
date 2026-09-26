/* Lab stage 02 — Character Select: a fighting-game roster of the village
   heroines with stats, a move list, a summon and a special for each. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB || !window.XRCAST) return;
  var CAST = window.XRCAST, STATS = CAST.STATS;
  function r(a, b) { return a + Math.random() * (b - a); }
  function sfx(name, a) { var P = window.XRPOWER; if (P && P.sfx && P.sfx[name]) P.sfx[name](a); }

  function radar(stats) {
    var cx = 90, cy = 88, R = 64, pts = [], grid = '', axes = '', labels = '';
    for (var ring = 1; ring <= 4; ring++) {
      var gp = [];
      for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * Math.PI * 2 / 5; gp.push((cx + Math.cos(a) * R * ring / 4).toFixed(1) + ',' + (cy + Math.sin(a) * R * ring / 4).toFixed(1)); }
      grid += '<polygon points="' + gp.join(' ') + '"/>';
    }
    for (i = 0; i < 5; i++) {
      var an = -Math.PI / 2 + i * Math.PI * 2 / 5, v = stats[i] / 100;
      pts.push((cx + Math.cos(an) * R * v).toFixed(1) + ',' + (cy + Math.sin(an) * R * v).toFixed(1));
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(an) * R).toFixed(1) + '" y2="' + (cy + Math.sin(an) * R).toFixed(1) + '"/>';
      var lx = cx + Math.cos(an) * (R + 16), ly = cy + Math.sin(an) * (R + 14) + 4;
      labels += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + (Math.abs(lx - cx) < 8 ? 'middle' : lx < cx ? 'end' : 'start') + '">' + STATS[i] + '</text>';
    }
    return '<svg class="cs-radar" viewBox="-10 0 200 180" role="img" aria-label="' + STATS.map(function (s, k) { return s + ' ' + stats[k]; }).join(', ') + '"><g class="cs-grid">' + grid + axes + '</g><polygon class="cs-poly" points="' + pts.join(' ') + '"/>' + labels + '</svg>';
  }

  LAB.register('cast', function (stage) {
    var $ = function (s) { return XR.$(s, stage); };
    var cur = CAST.indexOf(CAST.pick()), timer = 99, busy = false;
    stage.innerHTML =
      '<div class="cs-screen">' +
        '<div class="cs-top"><span class="cs-p1">P1</span><b>Select your heroine</b><span class="cs-timer" aria-hidden="true">99</span></div>' +
        '<div class="cs-main">' +
          '<figure class="cs-art"><span class="cs-bgk jp" aria-hidden="true"></span><i class="cs-speed" aria-hidden="true"></i><img class="cs-img" alt="" decoding="async"><canvas class="cs-fx" aria-hidden="true"></canvas><div class="cs-call" aria-hidden="true"><b></b><small></small></div></figure>' +
          '<div class="cs-card">' +
            '<p class="cs-el"></p>' +
            '<h3 class="cs-name"></h3>' +
            '<p class="cs-line"></p>' +
            '<div class="cs-stats"></div>' +
            '<div class="cs-moves"><b>Move list</b><ul></ul></div>' +
            '<div class="cs-acts"><button type="button" class="cs-go">Summon</button><button type="button" class="cs-sp">Special</button><button type="button" class="cs-dojo">Train in the dojo</button></div>' +
          '</div>' +
        '</div>' +
        '<div class="cs-roster" role="radiogroup" aria-label="Heroines">' + CAST.map(function (c, i) {
          return '<button type="button" role="radio" class="cs-tile" data-i="' + i + '" style="--hc:' + c.col + '" aria-label="' + c.name + ', ' + c.title + '"><img src="' + c.img + '" alt="" loading="lazy" decoding="async" style="object-position:' + c.face + '"><span>' + c.name + '</span><i class="jp">' + c.jp + '</i></button>';
        }).join('') + '</div>' +
        '<p class="sr-only" aria-live="polite"></p>' +
      '</div>';
    var screen = $('.cs-screen'), art = $('.cs-art'), img = $('.cs-img'), cv = $('.cs-fx'), g = cv.getContext('2d'), call = $('.cs-call'), live = $('.sr-only');
    var tiles = XR.$$('.cs-tile', stage);

    function say(big, sm, ms) {
      call.querySelector('b').textContent = big; call.querySelector('small').textContent = sm || '';
      call.classList.remove('is-on'); void call.offsetWidth; call.classList.add('is-on');
      clearTimeout(say.t); say.t = setTimeout(function () { call.classList.remove('is-on'); }, ms || 1000);
    }
    function select(i, focus) {
      cur = (i + CAST.length) % CAST.length;
      var c = CAST[cur];
      screen.style.setProperty('--hc', c.col); screen.style.setProperty('--hd', c.dark);
      tiles.forEach(function (t, k) { t.setAttribute('aria-checked', k === cur ? 'true' : 'false'); t.tabIndex = k === cur ? 0 : -1; });
      if (focus) tiles[cur].focus();
      img.classList.remove('is-in', 'is-summon'); void img.offsetWidth;
      img.src = c.img; img.width = c.w; img.height = c.h; img.alt = c.name + ', ' + c.title;
      img.classList.toggle('is-pixel', !!c.pixel);
      img.classList.add('is-in');
      $('.cs-bgk').textContent = c.jp;
      $('.cs-el').innerHTML = '<span>' + c.el + '</span>' + XR.esc(c.title);
      $('.cs-name').innerHTML = XR.esc(c.name) + ' <span class="jp">' + c.jp + '</span>';
      $('.cs-line').textContent = '“' + c.line + '”';
      $('.cs-stats').innerHTML = radar(c.stats) + '<ul class="cs-bars">' + STATS.map(function (s, k) { return '<li><span>' + s + '</span><i style="--v:' + c.stats[k] + '%"></i><b>' + c.stats[k] + '</b></li>'; }).join('') + '</ul>';
      $('.cs-moves ul').innerHTML = c.moves.map(function (m, k) { return '<li' + (k === 2 ? ' class="is-sp"' : '') + '><span>' + XR.esc(m[0]) + '</span><kbd>' + m[1] + '</kbd></li>'; }).join('');
      $('.cs-sp').textContent = 'Special: ' + c.special;
      live.textContent = c.name + ' selected. ' + c.title + '.';
      sfx('blip', 700);
    }

    /* ---------- specials: one particle recipe per element ---------- */
    var parts = [], running = false, last = 0, W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2), T = 0;
    function size() { W = art.clientWidth; H = art.clientHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    function heart(x, y, s) { g.beginPath(); g.moveTo(x, y + s * .3); g.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3); g.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .8, x, y + s); g.bezierCurveTo(x, y + s * .8, x + s * .5, y + s * .6, x + s * .5, y + s * .3); g.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3); g.fill(); }
    function star(x, y, s) { g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill(); }
    function burst(fx) {
      if (XR.reduce) return;
      var cx = W / 2, cy = H * .55, i, n = W < 420 ? .6 : 1;
      if (fx === 'fire') for (i = 0; i < 140 * n; i++) parts.push({ k: 'dot', x: cx + r(-W * .3, W * .3), y: H + r(0, 40), vx: r(-40, 40), vy: -r(200, 620), g: -60, s: r(3, 9), max: r(.8, 1.8), col: ['#ffb347', '#ff6a1a', '#ffe08a', '#e0301e'][i % 4], add: 1 });
      if (fx === 'frost') for (i = 0; i < 90 * n; i++) { var a = r(0, 6.283), sp = r(200, 700); parts.push({ k: 'shard', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, s: r(8, 22), max: r(.6, 1.2), col: i % 3 ? '#dff4ff' : '#8fd0ff', add: 1 }); }
      if (fx === 'frost') for (i = 0; i < 16; i++) parts.push({ k: 'fog', x: r(0, W), y: r(H * .4, H), vx: r(-30, 30), vy: r(-20, 0), g: 0, s: r(40, 90), max: r(1.2, 2), col: 'rgba(230,245,255,.35)' });
      if (fx === 'water') for (i = 0; i < 6; i++) parts.push({ k: 'wave', x: 0, y: H * (.35 + i * .1), vx: 0, vy: 0, g: 0, s: r(10, 26), max: 1.4 + i * .08, d: i * .08, col: i % 2 ? 'rgba(120,200,255,.9)' : 'rgba(255,255,255,.9)', add: 1 });
      if (fx === 'water') for (i = 0; i < 70 * n; i++) parts.push({ k: 'dot', x: r(0, W), y: H * r(.3, .8), vx: r(-80, 280), vy: -r(100, 400), g: 900, s: r(2, 5), max: r(.6, 1.3), col: '#bfe6ff', add: 1 });
      if (fx === 'dark') for (i = 0; i < 60 * n; i++) parts.push({ k: 'feather', x: r(0, W), y: -r(0, H * .6), vx: r(-40, 40), vy: r(60, 180), g: 0, s: r(8, 16), max: r(1.6, 2.6), rot: r(0, 6.283), vr: r(-3, 3), col: i % 4 ? '#140b22' : '#5a3a9a' });
      if (fx === 'dark') parts.push({ k: 'glow', x: cx, y: cy, s: Math.max(W, H) * .6, max: 1.6, col: '155,107,255', add: 1 });
      if (fx === 'ribbon') for (i = 0; i < 5; i++) parts.push({ k: 'ribbon', x: 0, y: 0, s: 0, max: 1.8, d: i * .12, ph: r(0, 6.283), amp: r(.14, .3), yy: r(.25, .8), col: i % 2 ? 'rgba(196,125,255,.95)' : 'rgba(30,10,50,.95)' });
      if (fx === 'hearts') for (i = 0; i < 70 * n; i++) parts.push({ k: i % 3 ? 'heart' : 'star', x: cx + r(-W * .4, W * .4), y: H * r(.5, 1.05), vx: r(-40, 40), vy: -r(80, 320), g: 0, s: r(8, 20), max: r(1, 2), col: i % 3 ? ['#ff6fa3', '#ff9ec1', '#ffd23f'][i % 3] : '#fff6c2', add: 1 });
      kick();
    }
    function loop(t) {
      var dt = Math.max(0, Math.min(.05, (t - last) / 1000)); last = t; T += dt;
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
      parts = parts.filter(function (p) {
        if (p.d > 0) { p.d -= dt; return true; }
        p.life = (p.life == null ? p.max : p.life) - dt;
        if (p.life <= 0) return false;
        var a = Math.min(1, p.life / p.max * 2), prog = 1 - p.life / p.max;
        p.vy += (p.g || 0) * dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
        g.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
        g.globalAlpha = a; g.fillStyle = p.col; g.strokeStyle = p.col;
        if (p.k === 'dot') { g.beginPath(); g.arc(p.x, p.y, p.s * (p.life / p.max), 0, 6.283); g.fill(); }
        else if (p.k === 'shard') { g.lineWidth = 2; g.beginPath(); var l = Math.hypot(p.vx, p.vy) || 1; g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx / l * p.s, p.y - p.vy / l * p.s); g.stroke(); p.vx *= .97; p.vy *= .97; }
        else if (p.k === 'fog') { p.s += 20 * dt; g.globalAlpha = a * .7; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.283); g.fill(); }
        else if (p.k === 'wave') { g.lineWidth = p.s * (p.life / p.max); g.beginPath(); for (var x = 0; x <= W * prog * 1.3; x += 8) g.lineTo(x, p.y + Math.sin(x * .03 + T * 6) * H * .05); g.stroke(); }
        else if (p.k === 'feather') { p.rot += p.vr * dt; p.vx += Math.sin(T * 3 + p.s) * 30 * dt; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.beginPath(); g.ellipse(0, 0, p.s, p.s * .3, 0, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(160,120,255,.7)'; g.lineWidth = 1; g.stroke(); g.restore(); }
        else if (p.k === 'glow') { var gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s); gr.addColorStop(0, 'rgba(' + p.col + ',.55)'); gr.addColorStop(1, 'rgba(' + p.col + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
        else if (p.k === 'ribbon') {
          g.lineWidth = 10 * a + 2; g.lineCap = 'round'; g.beginPath();
          var span = Math.min(1, prog * 1.6) * W * 1.2;
          for (var k = 0; k <= span; k += 10) g.lineTo(k - W * .1, H * p.yy + Math.sin(k * .02 + p.ph + T * 4) * H * p.amp);
          g.stroke();
        }
        else if (p.k === 'heart') heart(p.x, p.y, p.s);
        else if (p.k === 'star') star(p.x, p.y, p.s * .6);
        return true;
      });
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      if (parts.length) requestAnimationFrame(loop); else running = false;
    }
    function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } }

    function summon(then) {
      if (busy) return;
      busy = true;
      var c = CAST[cur];
      img.classList.remove('is-in', 'is-summon'); void img.offsetWidth; img.classList.add('is-summon');
      art.classList.remove('is-flash'); void art.offsetWidth; art.classList.add('is-flash');
      say('READY', c.name, 700); sfx('blip', 520);
      setTimeout(function () { say('FIGHT!', 'ファイト', 800); sfx('hit'); }, 750);
      setTimeout(function () { busy = false; if (then) then(); }, 1400);
    }
    function special() {
      if (busy) return;
      busy = true;
      var c = CAST[cur];
      art.classList.remove('is-sp'); void art.offsetWidth; art.classList.add('is-sp');
      say(c.sjp, c.special, 1600);
      sfx(c.fx === 'dark' || c.fx === 'ribbon' ? 'arise' : c.fx === 'water' ? 'whoosh' : c.fx === 'hearts' ? 'blip' : 'boom', 1.4);
      size(); burst(c.fx);
      live.textContent = c.name + ' uses ' + c.special + '.';
      setTimeout(function () { busy = false; }, 1500);
    }

    stage.addEventListener('click', function (e) {
      var t = e.target.closest('.cs-tile');
      if (t) { select(+t.getAttribute('data-i')); return; }
      if (e.target.closest('.cs-go')) summon();
      else if (e.target.closest('.cs-sp')) special();
      else if (e.target.closest('.cs-dojo')) {
        CAST.choose(CAST[cur].id);
        XR.toast(CAST[cur].name + ' is waiting in the Jutsu Dojo.');
        var d = document.getElementById('dojo');
        if (d) { if (document.body.classList.contains('lab-one')) location.hash = 'dojo'; else d.scrollIntoView({ behavior: XR.reduce ? 'auto' : 'smooth', block: 'start' }); }
      }
    });
    $('.cs-roster').addEventListener('keydown', function (e) {
      var k = e.key, step = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 0;
      if (step) { e.preventDefault(); select(cur + step, true); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); summon(); }
    });
    var tick = setInterval(function () {
      if (!document.body.contains(stage)) { clearInterval(tick); return; }
      timer = timer <= 0 ? 99 : timer - 1;
      $('.cs-timer').textContent = String(timer).padStart(2, '0');
    }, 1000);
    select(cur);
  });
})();
