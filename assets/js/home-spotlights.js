/* =====================================================================
   XIRAIYA — home: one cinematic scene per girl
   Six full-bleed scenes spread down the homepage, each with its own
   colours, particle weather (feathers, embers, void motes, bubbles, ink,
   sparkles), a giant kanji, a name that slams in letter by letter and
   scroll parallax. Particles only run while a scene is on screen.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$;
  var IMG = 'assets/img/anime/';

  var GIRLS = {
    albedo: { n: 1, name: 'Albedo', role: 'The Overseer', job: 'Project lead', kanji: '統', fx: 'feathers', side: 'r', pixel: false,
      quote: 'Every project runs on my plan. Deadlines are not suggestions.',
      stats: [['Leadership', 98], ['Planning', 95], ['Patience', 14]], svc: ['web', 'Plan my project'] },
    blaze: { n: 2, name: 'Blaze', role: 'Flame kunoichi', job: 'Front-end', kanji: '炎', fx: 'embers', side: 'l', pixel: true,
      quote: 'Slow pages burn first. Mine load before you blink.',
      stats: [['Speed', 99], ['Style', 92], ['Chill', 8]], svc: ['web', 'Build my website'] },
    shade: { n: 3, name: 'Shade', role: 'Shadow weaver', job: 'Automation and bots', kanji: '影', fx: 'void', side: 'r', pixel: false,
      quote: 'My shadow clones work the night shift, so you never have to.',
      stats: [['Clones', 97], ['Stealth', 94], ['Sleep', 3]], svc: ['automation', 'Automate my work'] },
    aqua: { n: 4, name: 'Aqua', role: 'Tide mage', job: 'Databases and APIs', kanji: '水', fx: 'bubbles', side: 'l', pixel: true,
      quote: 'Data flows where I tell it to. Nothing leaks.',
      stats: [['Flow', 93], ['Security', 96], ['Small talk', 20]], svc: ['ai-agent', 'Connect my systems'] },
    noir: { n: 5, name: 'Noir', role: 'Night scribe', job: 'Back-end and Telegram bots', kanji: '墨', fx: 'ink', side: 'r', pixel: true,
      quote: 'I write the server code while the village sleeps.',
      stats: [['Uptime', 99], ['Focus', 95], ['Daylight', 6]], svc: ['telegram', 'Build my bot'] },
    maid: { n: 6, name: 'Honey', role: 'Tea house keeper', job: 'Support and AI chat', kanji: '光', fx: 'sparkle', side: 'l', pixel: true,
      quote: 'Every customer gets an answer. In English or Bangla, with a smile!',
      stats: [['Kindness', 100], ['Replies', 97], ['Grumpiness', 1]], svc: ['ai-chat', 'Add AI chat'] }
  };

  var scenes = [];
  $$('.sp[data-sp]').forEach(function (sec) {
    var id = sec.getAttribute('data-sp'), g = GIRLS[id];
    if (!g) return;
    sec.classList.add('sp-' + id, 'side-' + g.side);
    var letters = g.name.toUpperCase().split('').map(function (ch, i) { return '<span style="--l:' + i + '">' + ch + '</span>'; }).join('');
    sec.innerHTML =
      '<div class="sp-bg" aria-hidden="true"><i class="sp-rays"></i><span class="sp-kanji jp">' + g.kanji + '</span><i class="sp-orb"></i></div>' +
      '<canvas class="sp-fx" aria-hidden="true"></canvas>' +
      '<div class="sp-bars" aria-hidden="true"><i></i><i></i></div>' +
      '<div class="container container-wide sp-grid">' +
        '<figure class="sp-fig"><i class="sp-halo" aria-hidden="true"></i>' +
          '<img class="sp-img' + (g.pixel ? ' px' : '') + '" src="' + IMG + id + '.webp" alt="' + g.name + ', ' + g.role + '" loading="lazy" decoding="async">' +
          '<i class="sp-sweep" aria-hidden="true"></i></figure>' +
        '<div class="sp-copy">' +
          '<p class="sp-no"><b>' + String(g.n).padStart(2, '0') + '</b><span>/ 06</span> Character file · <span class="jp">' + g.kanji + '</span></p>' +
          '<h2 class="sp-name" aria-label="' + g.name + '">' + letters + '</h2>' +
          '<p class="sp-role">' + g.role + ' <em>·</em> ' + g.job + '</p>' +
          '<blockquote class="sp-quote"><p>' + XR.esc(g.quote) + '</p></blockquote>' +
          '<dl class="sp-stats">' + g.stats.map(function (s, i) {
            return '<div style="--v:' + s[1] + '%;--d:' + (i * .12) + 's"><dt>' + s[0] + '</dt><dd><i></i><b>' + s[1] + '</b></dd></div>';
          }).join('') + '</dl>' +
          '<a class="sp-link" href="hire?service=' + g.svc[0] + '">' + g.svc[1] + ' <svg class="ic"><use href="#i-arrow-right"/></svg></a>' +
        '</div>' +
      '</div>';
    var sc = { sec: sec, g: g, canvas: $('.sp-fx', sec), on: false, parts: [], raf: 0 };
    scenes.push(sc);
  });
  if (!scenes.length) return;

  /* entrance: fire once when the scene is mostly on screen */
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      var sc = scenes.find(function (s) { return s.sec === e.target; });
      if (!sc) return;
      if (e.isIntersecting && e.intersectionRatio > .35) sc.sec.classList.add('in');
      sc.on = e.isIntersecting;
      if (sc.on && !XR.reduce) start(sc);
    });
  }, { threshold: [0, .35, .6] });
  scenes.forEach(function (sc) { io.observe(sc.sec); });

  /* scroll parallax: --p runs from -1 (entering) to 1 (leaving) */
  if (!XR.reduce) {
    var ticking = false;
    function para() {
      ticking = false;
      scenes.forEach(function (sc) {
        if (!sc.on) return;
        var r = sc.sec.getBoundingClientRect();
        var p = XR.clamp(((r.top + r.height / 2) - innerHeight / 2) / (innerHeight / 2 + r.height / 2), -1, 1);
        sc.sec.style.setProperty('--p', (-p).toFixed(3));
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(para); } }, { passive: true });
    para();
  }

  /* particle weather */
  var FX = {
    feathers: { n: 26, make: function (w, h) { return { x: Math.random() * w, y: Math.random() * h - h, vx: (Math.random() - .5) * .4, vy: .5 + Math.random() * .8, r: 7 + Math.random() * 10, a: Math.random() * 6, va: (Math.random() - .5) * .03 }; },
      draw: function (x, p, t) {
        x.save(); x.translate(p.x + Math.sin(t / 900 + p.a) * 20, p.y); x.rotate(p.a + Math.sin(t / 700 + p.a) * .6);
        x.fillStyle = 'rgba(20,8,30,.85)'; x.strokeStyle = 'rgba(181,123,255,.55)'; x.lineWidth = 1;
        x.beginPath(); x.ellipse(0, 0, p.r * .35, p.r, 0, 0, Math.PI * 2); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(0, -p.r); x.lineTo(0, p.r * 1.3); x.stroke(); x.restore();
      }, fall: 1 },
    embers: { n: 70, make: function (w, h) { return { x: Math.random() * w, y: h + Math.random() * h, vx: (Math.random() - .5) * .6, vy: -(.8 + Math.random() * 1.8), r: 1 + Math.random() * 2.6, a: Math.random() * 6 }; },
      draw: function (x, p, t) {
        var fl = .6 + Math.sin(t / 90 + p.a) * .4;
        x.fillStyle = 'rgba(255,' + (140 + (p.r * 30 | 0)) + ',60,' + fl + ')';
        x.shadowColor = '#ff6a1f'; x.shadowBlur = 12;
        x.beginPath(); x.arc(p.x + Math.sin(t / 400 + p.a) * 8, p.y, p.r, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
      }, rise: 1 },
    void: { n: 40, make: function (w, h) { return { cx: w * (.5 + (Math.random() - .5) * .6), cy: h * (.5 + (Math.random() - .5) * .6), rad: 40 + Math.random() * Math.min(w, h) * .45, a: Math.random() * 6, va: (.002 + Math.random() * .006) * (Math.random() < .5 ? -1 : 1), r: 1.5 + Math.random() * 4 }; },
      draw: function (x, p) {
        p.a += p.va;
        var px = p.cx + Math.cos(p.a) * p.rad, py = p.cy + Math.sin(p.a) * p.rad * .55;
        x.fillStyle = 'rgba(194,139,255,.7)'; x.shadowColor = '#9b5cff'; x.shadowBlur = 16;
        x.beginPath(); x.arc(px, py, p.r, 0, Math.PI * 2); x.fill(); x.shadowBlur = 0;
      }, orbit: 1 },
    bubbles: { n: 34, make: function (w, h) { return { x: Math.random() * w, y: h + Math.random() * h, vx: 0, vy: -(.4 + Math.random() * 1), r: 3 + Math.random() * 12, a: Math.random() * 6 }; },
      draw: function (x, p, t) {
        var bx = p.x + Math.sin(t / 600 + p.a) * 12;
        x.strokeStyle = 'rgba(160,235,255,.7)'; x.lineWidth = 1.4;
        x.beginPath(); x.arc(bx, p.y, p.r, 0, Math.PI * 2); x.stroke();
        x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(bx - p.r * .35, p.y - p.r * .35, p.r * .22, 0, Math.PI * 2); x.fill();
      }, rise: 1 },
    ink: { n: 36, make: function (w, h) { return { x: Math.random() * w, y: Math.random() * h - h, vx: 0, vy: 1.2 + Math.random() * 2.4, r: 1.5 + Math.random() * 3.5, a: Math.random() * 6 }; },
      draw: function (x, p) {
        x.fillStyle = 'rgba(232,226,208,.55)';
        x.beginPath(); x.ellipse(p.x, p.y, p.r * .6, p.r * 2.4, 0, 0, Math.PI * 2); x.fill();
      }, fall: 1 },
    sparkle: { n: 44, make: function (w, h) { return { x: Math.random() * w, y: Math.random() * h, vx: 0, vy: -.25 - Math.random() * .4, r: 3 + Math.random() * 6, a: Math.random() * 6, heart: Math.random() < .35 }; },
      draw: function (x, p, t) {
        var s = p.r * (.6 + Math.abs(Math.sin(t / 500 + p.a)) * .6);
        x.save(); x.translate(p.x, p.y);
        if (p.heart) {
          x.fillStyle = 'rgba(255,93,158,.8)'; x.scale(s / 8, s / 8);
          x.beginPath(); x.moveTo(0, 3); x.bezierCurveTo(-8, -3, -4, -9, 0, -4); x.bezierCurveTo(4, -9, 8, -3, 0, 3); x.fill();
        } else {
          x.fillStyle = 'rgba(255,240,180,.95)';
          x.beginPath(); x.moveTo(0, -s); x.quadraticCurveTo(0, 0, s, 0); x.quadraticCurveTo(0, 0, 0, s); x.quadraticCurveTo(0, 0, -s, 0); x.quadraticCurveTo(0, 0, 0, -s); x.fill();
        }
        x.restore();
      }, rise: 1, wrap: 1 }
  };

  function start(sc) {
    if (sc.raf) return;
    var c = sc.canvas, x = c.getContext('2d'), fx = FX[sc.g.fx];
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5), W = 0, H = 0;
    var small = window.matchMedia('(max-width: 760px)').matches;
    function size() {
      W = sc.sec.clientWidth; H = sc.sec.clientHeight;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    if (!sc.parts.length) {
      var n = small ? Math.round(fx.n * .55) : fx.n;
      for (var i = 0; i < n; i++) { var p = fx.make(W, H); if (fx.fall) p.y = Math.random() * H; if (fx.rise) p.y = Math.random() * H; sc.parts.push(p); }
    }
    window.addEventListener('resize', size);
    function frame(t) {
      if (!sc.on || document.hidden) { sc.raf = 0; window.removeEventListener('resize', size); return; }
      sc.raf = requestAnimationFrame(frame);
      x.clearRect(0, 0, W, H);
      sc.parts.forEach(function (p) {
        if (!fx.orbit) {
          p.x += p.vx; p.y += p.vy; if (p.va) p.a += p.va;
          if (fx.fall && p.y > H + 30) { p.y = -30; p.x = Math.random() * W; }
          if (fx.rise && p.y < -30) { p.y = H + 30; p.x = Math.random() * W; }
        }
        fx.draw(x, p, t);
      });
    }
    sc.raf = requestAnimationFrame(frame);
  }
})();
