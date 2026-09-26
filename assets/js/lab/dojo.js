/* Lab stage 01 — the Jutsu Dojo: weave three hand signs to fire Chidori,
   a wind blade or a Kamehameha at five training posts, go Super Saiyan,
   then make the broken posts Arise as shadow soldiers. "Whole page" aims
   the same jutsu at the site itself (assets/js/impact.js). */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  var SIGNS = [['tiger', '寅', 'Tiger'], ['snake', '巳', 'Snake'], ['rat', '子', 'Rat'], ['dog', '戌', 'Dog'], ['ox', '丑', 'Ox'], ['bird', '酉', 'Bird']];
  var JP = {}; SIGNS.forEach(function (s) { JP[s[0]] = s[1]; });
  var JUTSU = [
    { id: 'chidori', name: 'Chidori', jp: '千鳥', seq: ['tiger', 'snake', 'rat'], note: 'lightning chain' },
    { id: 'wind', name: 'Wind Blade', jp: '風刃', seq: ['rat', 'bird', 'tiger'], note: 'cuts every post' },
    { id: 'kamehameha', name: 'Kamehameha', jp: '波', seq: ['dog', 'bird', 'snake'], note: 'charge, then beam' },
    { id: 'ssj', name: 'Super Saiyan', jp: '超', seq: ['ox', 'ox', 'ox'], note: 'double power' },
    { id: 'arise', name: 'Arise', jp: '起', seq: ['dog', 'ox', 'snake'], note: 'shadows rise' }
  ];
  function sfx(name, a) { var P = window.XRPOWER; if (P && P.sfx && P.sfx[name]) P.sfx[name](a); }
  function r(a, b) { return a + Math.random() * (b - a); }

  LAB.register('dojo', function (stage) {
    var $ = function (s) { return XR.$(s, stage); };
    var hero = window.XRCAST ? window.XRCAST.pick() : null;
    stage.innerHTML =
      '<div class="km-page dj-page">' +
        '<div class="km-panel dj-arena">' +
          '<canvas class="dj-cv" aria-hidden="true"></canvas>' +
          '<div class="dj-hero"><span class="dj-aura" aria-hidden="true"></span><img alt="" decoding="async"></div>' +
          '<span class="km-cap">Training ground · 演習場</span>' +
          '<div class="dj-hud"><span>Standing <b class="dj-left">5</b>/5</span><span>Broken <b class="dj-broke">0</b></span><span class="dj-tag" hidden>超 SSJ</span></div>' +
          '<div class="dj-call" aria-hidden="true"><b></b><small></small></div>' +
          '<div class="dj-flash" aria-hidden="true"></div>' +
        '</div>' +
        '<div class="km-panel km-tone dj-signs">' +
          '<p class="dj-h">Hand signs <small>any three</small></p>' +
          '<div class="dj-seq" aria-hidden="true"><i></i><i></i><i></i></div>' +
          '<div class="dj-pad" role="group" aria-label="Hand signs">' + SIGNS.map(function (s) {
            return '<button type="button" data-s="' + s[0] + '"><b>' + s[1] + '</b><small>' + s[2] + '</small></button>';
          }).join('') + '</div>' +
          '<p class="dj-said" aria-live="polite"></p>' +
        '</div>' +
        '<div class="km-panel dj-scroll">' +
          '<p class="dj-h">Jutsu scroll <small>tap to weave</small></p>' +
          '<ul class="dj-list">' + JUTSU.map(function (j) {
            return '<li><button type="button" data-j="' + j.id + '"><i>' + j.jp + '</i><span><b>' + j.name + '</b><small>' + j.note + '</small></span><em>' + j.seq.map(function (s) { return JP[s]; }).join(' ') + '</em></button></li>';
          }).join('') + '</ul>' +
          '<div class="dj-foot"><div class="dj-aim" role="group" aria-label="Aim the jutsu at"><button type="button" aria-pressed="true" data-aim="dojo">Dojo</button><button type="button" aria-pressed="false" data-aim="page">Whole page</button></div>' +
          '<button type="button" class="dj-reset">Reset posts</button></div>' +
        '</div>' +
      '</div>';

    var arena = $('.dj-arena'), cv = $('.dj-cv'), g = cv.getContext('2d'), heroEl = $('.dj-hero'), img = $('.dj-hero img'), call = $('.dj-call'), flashEl = $('.dj-flash');
    var said = $('.dj-said'), slots = XR.$$('.dj-seq i', stage);
    var DPR = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, ground = 0, pw = 18, ph = 100;
    var posts = [], parts = [], fx = [], ssj = false, busy = false, aim = 'dojo', seq = [], broke = 0, running = false, seen = false, last = 0, T = 0;
    var hills = [[], []];
    for (var k = 0; k <= 24; k++) { hills[0].push(.55 + Math.sin(k * .7) * .08 + Math.sin(k * 1.9) * .04); hills[1].push(.66 + Math.sin(k * .9 + 2) * .05 + Math.sin(k * 2.7) * .03); }

    function setHero(c) {
      hero = c;
      if (!c) return;
      img.src = c.img; img.width = c.w; img.height = c.h;
      img.alt = c.name + ', ' + c.title;
      heroEl.style.setProperty('--hc', c.col);
      heroEl.classList.toggle('is-pixel', !!c.pixel);
    }
    setHero(hero);
    document.addEventListener('xr:cast', function () { setHero(window.XRCAST.pick()); });

    function reset() {
      posts = [.46, .58, .7, .82, .93].map(function (x) { return { rx: x, state: 'up', top: null, rise: 0, hit: 0, slash: 0 }; });
      broke = 0; hud(); kick();
    }
    function size() {
      W = arena.clientWidth; H = Math.round(Math.max(240, Math.min(380, W * .52)));
      arena.style.height = H + 'px';
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ground = H * .82; pw = Math.max(15, W * .032); ph = H * .4;
      posts.forEach(function (p) { p.x = p.rx * W; });
      kick();
    }
    function standing() { return posts.filter(function (p) { return p.state === 'up' || p.state === 'shadow'; }); }
    function hud() {
      $('.dj-left').textContent = standing().length;
      $('.dj-broke').textContent = broke;
      $('.dj-tag').hidden = !ssj;
    }
    function hand() {
      var a = arena.getBoundingClientRect(), b = img.getBoundingClientRect();
      return { x: b.right - a.left - b.width * .18, y: b.top - a.top + b.height * .42 };
    }
    function say(big, sm, ms, kind) {
      call.setAttribute('data-kind', kind || '');
      call.querySelector('b').textContent = big; call.querySelector('small').textContent = sm || '';
      call.classList.remove('is-on'); void call.offsetWidth; call.classList.add('is-on');
      clearTimeout(say.t); say.t = setTimeout(function () { call.classList.remove('is-on'); }, ms || 1100);
    }
    function flash(col) {
      flashEl.style.background = col || '#fff';
      flashEl.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' });
    }
    function shake() { arena.classList.remove('is-shake'); void arena.offsetWidth; arena.classList.add('is-shake'); }

    /* ---------- particles and effects ---------- */
    function add(p) { if (XR.reduce || parts.length > 500) return; p.life = p.max; parts.push(p); kick(); }
    function splinters(x, y, n, dir) {
      for (var i = 0; i < n; i++) add({ k: 'chip', x: x, y: y, vx: (dir || (Math.random() < .5 ? -1 : 1)) * r(60, 420), vy: -r(120, 520), max: r(.6, 1.2), rot: r(0, 6), vr: r(-14, 14), s: r(3, 8), col: Math.random() < .5 ? '#b27b46' : '#e2b27a' });
    }
    function sparks(x, y, n, col, sp) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = r(.3, 1) * (sp || 500); add({ k: 'spark', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, max: r(.25, .6), col: col || '#bfe8ff' }); } }
    function puff(x, y, n, col) { for (var i = 0; i < n; i++) add({ k: 'smoke', x: x + r(-14, 14), y: y + r(-8, 8), vx: r(-30, 30), vy: -r(20, 70), max: r(.8, 1.6), s: r(10, 26), col: col || 'rgba(60,50,44,.45)' }); }
    function jag(x1, y1, x2, y2, d) {
      var pts = [[x1, y1], [x2, y2]];
      for (var k = 0; k < 4; k++) {
        var n = [pts[0]];
        for (var i = 0; i < pts.length - 1; i++) { var a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, o = (Math.random() - .5) * d; n.push([(a[0] + b[0]) / 2 - dy / l * o, (a[1] + b[1]) / 2 + dx / l * o], b); }
        pts = n; d *= .55;
      }
      return pts;
    }
    function strokeBolt(x1, y1, x2, y2, col, w, a) {
      var pts = jag(x1, y1, x2, y2, Math.hypot(x2 - x1, y2 - y1) * .3);
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.lineCap = g.lineJoin = 'round';
      g.globalAlpha = a * .3; g.strokeStyle = col; g.lineWidth = w * 4; g.stroke();
      g.globalAlpha = a; g.strokeStyle = '#fff'; g.lineWidth = w; g.stroke();
      g.globalAlpha = 1;
    }

    /* ---------- the posts ---------- */
    function breakPost(p, how, dir) {
      if (p.state !== 'up' && p.state !== 'shadow') return;
      var wasShadow = p.state === 'shadow', brk = ground - ph * .42, len = ph * .58;
      p.state = how === 'gone' ? 'gone' : 'broken';
      p.hit = .25;
      p.top = { x: p.x, y: brk - len / 2, len: len, rot: 0, shadow: wasShadow, rest: false,
        vx: how === 'gone' ? r(900, 1300) : how === 'cut' ? r(140, 300) : (dir || 1) * r(90, 260),
        vy: how === 'gone' ? -r(200, 420) : how === 'cut' ? -r(40, 120) : -r(260, 460),
        vr: how === 'cut' ? r(1.5, 3.5) : r(-9, 9) };
      if (how === 'cut') p.slash = .5;
      broke++;
      splinters(p.x, brk, wasShadow ? 6 : 14, how === 'gone' || how === 'cut' ? 1 : dir);
      puff(p.x, brk, 4, wasShadow ? 'rgba(90,60,180,.5)' : null);
      sfx('hit');
      hud(); kick();
    }
    function drawLog(x, y0, y1, o) {
      var w = pw, grd = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      if (o.shadow) { grd.addColorStop(0, '#1a0f3a'); grd.addColorStop(.5, '#2b1a5c'); grd.addColorStop(1, '#120a26'); }
      else if (o.char) { grd.addColorStop(0, '#2a1d14'); grd.addColorStop(.5, '#4a3322'); grd.addColorStop(1, '#1e150e'); }
      else { grd.addColorStop(0, '#7a4a22'); grd.addColorStop(.45, '#c48a52'); grd.addColorStop(1, '#6a3d1a'); }
      g.fillStyle = grd; g.strokeStyle = o.shadow ? '#8f7bff' : '#2a1a0e'; g.lineWidth = 1.5;
      g.beginPath();
      if (o.jag) {
        g.moveTo(x - w / 2, y1); g.lineTo(x - w / 2, y0 + 5);
        for (var i = 1; i <= 5; i++) g.lineTo(x - w / 2 + w * i / 5, y0 + (i % 2 ? -3 : 5));
        g.lineTo(x + w / 2, y1);
      } else {
        g.moveTo(x - w / 2, y1); g.lineTo(x - w / 2, y0 + w * .3); g.quadraticCurveTo(x, y0 - w * .15, x + w / 2, y0 + w * .3); g.lineTo(x + w / 2, y1);
      }
      g.closePath(); g.fill(); g.stroke();
      if (!o.shadow) {
        g.strokeStyle = 'rgba(40,20,8,.35)'; g.lineWidth = 1;
        for (var y = y0 + 12; y < y1 - 4; y += 11) { g.beginPath(); g.moveTo(x - w * .32, y); g.quadraticCurveTo(x, y + 3, x + w * .28, y - 1); g.stroke(); }
        [.3, .66].forEach(function (f) { var ry = ground - ph + ph * f; if (o.full ? true : (ry > y0 && ry < y1)) { g.fillStyle = o.char ? '#3b3024' : '#d8bd84'; g.fillRect(x - w / 2 - 1, ry, w + 2, Math.max(3, w * .3)); } });
        if (o.target && !o.char) {
          var ty = y0 + ph * .12;
          g.fillStyle = '#f7efdf'; g.fillRect(x - w * .42, ty, w * .84, w * .84);
          g.fillStyle = '#c4321d'; g.beginPath(); g.arc(x, ty + w * .42, w * .28, 0, 6.283); g.fill();
          g.fillStyle = '#f7efdf'; g.beginPath(); g.arc(x, ty + w * .42, w * .12, 0, 6.283); g.fill();
        }
      }
    }
    function drawShadow(p) {
      var rise = Math.min(1, p.rise), bob = rise >= 1 ? Math.sin(T * 2.2 + p.rx * 9) * 2 : 0, top = ground - ph + bob;
      g.save();
      g.beginPath(); g.rect(p.x - pw * 2, ground - ph * rise - 14, pw * 4, ph * rise + 14); g.clip();
      g.shadowColor = 'rgba(143,123,255,.9)'; g.shadowBlur = 18;
      drawLog(p.x, top, ground, { shadow: true });
      g.shadowBlur = 0;
      var ey = top + ph * .16;
      g.fillStyle = '#e0d6ff'; g.shadowColor = '#b3a3ff'; g.shadowBlur = 10;
      g.beginPath(); g.ellipse(p.x - pw * .18, ey, pw * .1, pw * .06, 0, 0, 6.283); g.ellipse(p.x + pw * .18, ey, pw * .1, pw * .06, 0, 0, 6.283); g.fill();
      g.restore();
    }

    /* ---------- the scene ---------- */
    function scene() {
      var sky = g.createLinearGradient(0, 0, 0, ground);
      sky.addColorStop(0, '#1b1030'); sky.addColorStop(.55, '#b8483a'); sky.addColorStop(1, '#f2b77a');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,236,200,.9)'; g.beginPath(); g.arc(W * .72, ground * .62, Math.min(W, H) * .16, 0, 6.283); g.fill();
      [['#4a2438', 0], ['#2a1622', 1]].forEach(function (h) {
        g.fillStyle = h[0]; g.beginPath(); g.moveTo(0, ground);
        hills[h[1]].forEach(function (v, i) { g.lineTo(i / 24 * W, ground * v); });
        g.lineTo(W, ground); g.closePath(); g.fill();
      });
      g.fillStyle = '#1a120c'; g.fillRect(0, ground, W, H - ground);
      g.fillStyle = '#3a2a1c'; g.fillRect(0, ground, W, 3);
      g.strokeStyle = 'rgba(20,12,8,.8)'; g.lineWidth = 2;
      for (var fx0 = W * .36; fx0 < W; fx0 += W * .06) { g.beginPath(); g.moveTo(fx0, ground); g.lineTo(fx0, ground - H * .07); g.stroke(); }
      g.beginPath(); g.moveTo(W * .36, ground - H * .055); g.lineTo(W, ground - H * .055); g.stroke();
    }

    function loop(t) {
      var dt = Math.max(0, Math.min(.05, (t - last) / 1000)); last = t; T += dt;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      scene();
      var moving = false;
      posts.forEach(function (p) {
        if (p.state === 'up') {
          var sh = p.hit > 0 ? Math.sin(T * 90) * 3 * p.hit * 4 : 0;
          drawLog(p.x + sh, ground - ph, ground, { target: true, full: true });
        } else if (p.state === 'shadow') {
          if (p.rise < 1) { p.rise += dt * .9; moving = true; }
          drawShadow(p); moving = true;
        } else {
          drawLog(p.x, ground - ph * .42, ground, { jag: true, char: p.state === 'gone' });
        }
        if (p.hit > 0) { p.hit -= dt; moving = true; }
        var tp = p.top;
        if (tp && !tp.off) {
          if (!tp.rest) {
            moving = true;
            tp.vy += 1500 * dt; tp.x += tp.vx * dt; tp.y += tp.vy * dt; tp.rot += tp.vr * dt;
            if (tp.x > W + tp.len) tp.off = true;
            else if (tp.y > ground - pw * .55 && tp.vy > 0) {
              tp.y = ground - pw * .55; tp.vy *= -.28; tp.vx *= .55; tp.vr *= .4;
              if (Math.abs(tp.vy) < 70) { tp.rest = true; tp.rot = (Math.cos(tp.rot) >= 0 ? 1 : -1) * (Math.sin(tp.rot) >= 0 ? 1 : -1) * Math.PI / 2; }
            }
          }
          if (!tp.off) {
            g.save(); g.translate(tp.x, tp.y); g.rotate(tp.rot);
            drawLog(0, -tp.len / 2, tp.len / 2, { shadow: tp.shadow, char: p.state === 'gone' });
            g.restore();
          }
        }
        if (p.slash > 0) {
          p.slash -= dt; moving = true;
          g.strokeStyle = 'rgba(255,255,255,' + Math.min(1, p.slash * 3) + ')'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(p.x - pw * 1.6, ground - ph * .36); g.lineTo(p.x + pw * 1.6, ground - ph * .5); g.stroke();
        }
      });
      g.globalCompositeOperation = 'lighter';
      fx = fx.filter(function (f) {
        f.t += dt; moving = true;
        var a = Math.max(0, 1 - f.t / f.max);
        if (f.k === 'bolt') strokeBolt(f.x1, f.y1, f.x2, f.y2, f.col, f.w, a * r(.5, 1));
        else if (f.k === 'orb') {
          f.r += ((f.to || 16) - f.r) * Math.min(1, dt * 4);
          var gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 3);
          gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, f.col); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = gr; g.globalAlpha = Math.min(1, a * 3); g.beginPath(); g.arc(f.x, f.y, f.r * 3, 0, 6.283); g.fill(); g.globalAlpha = 1;
          if (f.arcs) for (var i = 0; i < 4; i++) { var an = Math.random() * 6.283, d = f.r * r(1.2, 2.6); strokeBolt(f.x, f.y, f.x + Math.cos(an) * d, f.y + Math.sin(an) * d, '#8fd3ff', 1.2, .9); }
        } else if (f.k === 'beam') {
          var grow = Math.min(1, f.t / .18), x1 = f.x + (W + 40 - f.x) * grow, hh = f.h * (a > .2 ? 1 : a * 5) * (.9 + Math.sin(T * 50) * .08);
          [[1, f.gold ? 'rgba(255,190,60,.45)' : 'rgba(70,150,255,.45)'], [.6, f.gold ? 'rgba(255,230,140,.8)' : 'rgba(130,210,255,.8)'], [.26, '#fff']].forEach(function (L) {
            var h2 = hh * L[0] / 2; g.fillStyle = L[1]; g.beginPath(); g.moveTo(f.x, f.y - h2 * .6);
            for (var x = f.x; x <= x1; x += 14) g.lineTo(x, f.y - h2 - Math.sin(x * .05 + T * 30) * h2 * .12);
            for (x = x1; x >= f.x; x -= 14) g.lineTo(x, f.y + h2 + Math.sin(x * .05 + T * 26) * h2 * .12);
            g.closePath(); g.fill();
          });
        } else if (f.k === 'blade') {
          var bx = f.x + f.v * f.t, px = f.px == null ? f.x : f.px;
          f.px = bx;
          g.strokeStyle = 'rgba(235,250,235,' + Math.min(1, a * 2) + ')'; g.lineWidth = 4;
          g.beginPath(); g.arc(bx, f.y, f.r, -1.1, 1.1); g.stroke();
          g.strokeStyle = 'rgba(160,220,150,' + Math.min(1, a * 2) * .6 + ')'; g.lineWidth = 9;
          g.beginPath(); g.arc(bx - 6, f.y, f.r, -.9, .9); g.stroke();
          posts.forEach(function (p) { if (p.x >= px - 2 && p.x <= bx + 2 && (p.state === 'up' || p.state === 'shadow')) breakPost(p, 'cut'); });
          if (bx > W + 40) return false;
        } else if (f.k === 'aura') {
          var hb = img.getBoundingClientRect(), ab = arena.getBoundingClientRect();
          if (Math.random() < .6) add({ k: 'ember', x: hb.left - ab.left + r(.15, .85) * hb.width, y: hb.bottom - ab.top - r(0, .3) * hb.height, vx: r(-10, 10), vy: -r(60, 160), max: r(.5, 1), col: '#ffd24a' });
          return ssj;
        }
        return f.t < f.max;
      });
      parts = parts.filter(function (p) {
        p.life -= dt; if (p.life <= 0) return false;
        var a = p.life / p.max; moving = true;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.k === 'spark') { p.vy += 600 * dt; g.globalAlpha = a; g.strokeStyle = p.col; g.lineWidth = 1.6; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); g.stroke(); }
        else if (p.k === 'ember') { g.globalAlpha = a; g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, 2.2, 0, 6.283); g.fill(); }
        return true;
      });
      g.globalCompositeOperation = 'source-over';
      parts.forEach(function (p) {
        var a = p.life / p.max;
        if (p.k === 'chip') {
          p.vy += 1200 * dt; p.rot += p.vr * dt;
          if (p.y > ground) { p.y = ground; p.vy *= -.3; p.vx *= .6; }
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, a * 2); g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 5, p.s, p.s / 2.5); g.restore();
        } else if (p.k === 'smoke') {
          p.s += 20 * dt; g.globalAlpha = a * .8; g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.283); g.fill();
        }
      });
      g.globalAlpha = 1;
      if (seen && (moving || ssj)) requestAnimationFrame(loop); else running = false;
    }
    function kick() { if (!running && W) { running = true; last = performance.now(); requestAnimationFrame(loop); } }

    /* ---------- the jutsu ---------- */
    function after(ms, fn) { setTimeout(fn, XR.reduce ? Math.min(ms, 60) : ms); }
    var RUN = {
      chidori: function () {
        var h = hand(), tgt = standing()[0];
        say('千鳥', 'Chidori', 1300, 'chidori'); sfx('chirp', 1.1);
        var orb = { k: 'orb', x: h.x, y: h.y, r: 2, to: ssj ? 18 : 13, t: 0, max: 1.2, col: 'rgba(120,190,255,.8)', arcs: true };
        fx.push(orb); kick();
        after(750, function () {
          if (!tgt) { orb.max = 0; say('…', 'No posts left. Try Arise.', 1400); return; }
          var hb = img.getBoundingClientRect(), dx = tgt.x - (hb.right - arena.getBoundingClientRect().left) + pw;
          heroEl.style.transition = 'transform .16s cubic-bezier(.5,0,.9,.5)'; heroEl.style.transform = 'translateX(' + Math.max(0, dx) + 'px)';
          orb.x = tgt.x - pw; orb.max = 0;
        });
        after(920, function () {
          if (!tgt) return;
          flash('#e8f6ff'); shake(); sfx('boom'); sfx('crack');
          var chain = ssj ? standing() : standing().slice(0, 3);
          chain.forEach(function (p, i) {
            var from = i ? chain[i - 1] : { x: tgt.x - pw, y: ground - ph * .6 };
            fx.push({ k: 'bolt', x1: from.x, y1: from.y || ground - ph * .6, x2: p.x, y2: ground - ph * .6, t: 0, max: .5, col: '#8fd3ff', w: 2.4 });
            sparks(p.x, ground - ph * .6, 18, '#cfeeff', 420);
            after(i * 110, function () { breakPost(p, 'broken', 1); });
          });
        });
        after(1500, function () { heroEl.style.transition = 'transform .5s var(--ease-out)'; heroEl.style.transform = ''; });
        return 1700;
      },
      wind: function () {
        var h = hand();
        say('風刃', 'Wind Blade', 1200, 'wind'); sfx('whoosh', 1.4);
        heroEl.classList.add('is-swing'); after(600, function () { heroEl.classList.remove('is-swing'); });
        for (var i = 0; i < (ssj ? 4 : 3); i++) (function (i) {
          after(i * 170, function () { fx.push({ k: 'blade', x: h.x, y: ground - ph * (.35 + i * .12), r: ph * .32, v: W * (1.3 + i * .15), t: 0, max: 2 }); kick(); });
        })(i);
        return 1500;
      },
      kamehameha: function () {
        var h = hand();
        sfx('charge', 1.4);
        var orb = { k: 'orb', x: h.x, y: h.y, r: 2, to: ssj ? 26 : 18, t: 0, max: 1.45, col: ssj ? 'rgba(255,210,90,.85)' : 'rgba(90,170,255,.85)' };
        fx.push(orb); kick();
        ['か', 'め', 'は', 'め'].forEach(function (s, i) { after(i * 330, function () { say(s, ['Ka', 'Me', 'Ha', 'Me'][i] + '…', 320, 'kame'); sfx('blip', 520 + i * 120); }); });
        after(1400, function () {
          say('波ァッ!!', 'HAAAA', 1300, 'kame'); sfx('beam', 1.2); shake(); flash(ssj ? '#fff3c2' : '#dff2ff');
          fx.push({ k: 'beam', x: h.x, y: h.y, h: ph * (ssj ? .95 : .7), t: 0, max: 1.2, gold: ssj });
          posts.forEach(function (p, i) { after(60 + i * 45, function () { breakPost(p, 'gone'); }); });
        });
        return 2700;
      },
      ssj: function () {
        ssj = !ssj;
        heroEl.classList.toggle('is-ssj', ssj);
        if (ssj) { say('超', 'Super Saiyan', 1300, 'ssj'); sfx('ssj'); flash('#ffe9a0'); shake(); fx.push({ k: 'aura', t: 0, max: 1e9 }); }
        else { say('解', 'Power down', 800, 'off'); sfx('hit'); }
        hud(); kick();
        return 1000;
      },
      arise: function () {
        var down = posts.filter(function (p) { return p.state === 'broken' || p.state === 'gone'; });
        say('ARISE', '起きろ', 1700, 'arise'); sfx('arise');
        arena.classList.add('is-arise'); after(2000, function () { arena.classList.remove('is-arise'); });
        if (!down.length) { said.textContent = 'Nothing is broken yet. Break a post first.'; return 1200; }
        down.forEach(function (p, i) {
          after(500 + i * 220, function () {
            p.state = 'shadow'; p.rise = 0; if (p.top) p.top.off = true;
            puff(p.x, ground - 6, 6, 'rgba(70,40,160,.55)');
            for (var k2 = 0; k2 < 8; k2++) add({ k: 'ember', x: p.x + r(-pw, pw), y: ground, vx: r(-10, 10), vy: -r(60, 200), max: r(.6, 1.2), col: '#a792ff' });
            hud(); kick();
          });
        });
        return 1800;
      }
    };
    function fire(id) {
      var j = JUTSU.filter(function (x) { return x.id === id; })[0];
      if (!j || busy) return;
      said.textContent = j.name + '!';
      if (aim === 'page' && window.XRPOWER) {
        var P = window.XRPOWER;
        ({ chidori: P.chidori, wind: P.wind, kamehameha: P.kamehameha, arise: P.arise, ssj: function () { P.ssj(); } })[id]();
        return;
      }
      busy = true;
      var ms = RUN[id]();
      setTimeout(function () { busy = false; }, XR.reduce ? 200 : ms);
    }
    function paintSeq() {
      slots.forEach(function (s, i) { s.textContent = seq[i] ? JP[seq[i]] : ''; s.classList.toggle('is-on', !!seq[i]); });
    }
    function sign(s) {
      if (busy) return;
      seq.push(s); paintSeq(); sfx('blip', 440 + seq.length * 110);
      var btn = stage.querySelector('[data-s="' + s + '"]');
      if (btn) { btn.classList.remove('is-hit'); void btn.offsetWidth; btn.classList.add('is-hit'); }
      if (seq.length < 3) return;
      var key = seq.join(','), j = JUTSU.filter(function (x) { return x.seq.join(',') === key; })[0];
      var done = seq.slice(); seq = [];
      setTimeout(paintSeq, 700);
      if (j) fire(j.id);
      else { said.textContent = done.map(function (x) { return JP[x]; }).join(' ') + ': the chakra fizzles. Check the scroll.'; puff(hand().x, hand().y, 6); kick(); }
    }

    stage.addEventListener('click', function (e) {
      var s = e.target.closest('[data-s]'), j = e.target.closest('[data-j]'), a = e.target.closest('[data-aim]');
      if (s) sign(s.getAttribute('data-s'));
      else if (j && !busy) {
        var J = JUTSU.filter(function (x) { return x.id === j.getAttribute('data-j'); })[0];
        seq = []; paintSeq();
        J.seq.forEach(function (x, i) { setTimeout(function () { sign(x); }, XR.reduce ? 0 : i * 200); });
      } else if (a) {
        aim = a.getAttribute('data-aim');
        XR.$$('[data-aim]', stage).forEach(function (b) { b.setAttribute('aria-pressed', b === a ? 'true' : 'false'); });
        said.textContent = aim === 'page' ? 'Aimed at the whole page. Weave a jutsu, then press Arise in the corner.' : 'Aimed at the training posts.';
      } else if (e.target.closest('.dj-reset')) { reset(); said.textContent = 'Five fresh posts.'; }
    });

    reset();
    size();
    if (window.ResizeObserver) new ResizeObserver(function () { size(); }).observe(arena);
    else window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; if (seen) kick(); }).observe(arena);
    else seen = true;
  });
})();
