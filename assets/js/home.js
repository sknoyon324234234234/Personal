/* XIRAIYA — home page interactions */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$;

  /* ---- rotating "I build ___" word ---- */
  var words = ['websites', 'Telegram bots', 'AI agents', 'Chrome extensions', 'Minecraft plugins', 'desktop apps', 'Android APKs', 'automations', 'online stores', 'crypto checkouts'];
  var rot = $('.rot-word');
  if (rot && !XR.reduce) {
    var wi = 0;
    XR.onReady(function () {
      setInterval(function () {
        rot.classList.remove('in');
        rot.classList.add('out');
        setTimeout(function () {
          wi = (wi + 1) % words.length;
          rot.textContent = words[wi];
          rot.classList.remove('out');
          rot.classList.add('in');
        }, 430);
      }, 2300);
    });
  }

  /* ---- speech bubble typer ---- */
  var typer = $('.typer');
  if (typer && !XR.reduce) {
    var lines = typer.getAttribute('data-lines').split('|'), li = 0;
    XR.onReady(function () {
      setTimeout(function cycle() {
        li = (li + 1) % lines.length;
        var target = lines[li], cur = typer.textContent;
        (function erase() {
          if (cur.length) { cur = cur.slice(0, -1); typer.textContent = cur; setTimeout(erase, 22); return; }
          var i = 0;
          (function type() {
            typer.textContent = target.slice(0, ++i);
            if (i < target.length) setTimeout(type, 45); else setTimeout(cycle, 3200);
          })();
        })();
      }, 4200);
    });
  }

  /* ---- skill radar ---- */
  var radar = $('.radar');
  if (radar) {
    var skills = [['Frontend', .96], ['Backend', .9], ['Automation', .97], ['AI / LLM', .9], ['Apps', .84], ['Design', .88]];
    var R = 110, n = skills.length, NS = 'http://www.w3.org/2000/svg', html = '';
    function pt(i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [Math.cos(a) * r, Math.sin(a) * r]; }
    [.25, .5, .75, 1].forEach(function (k) {
      html += '<polygon class="ring" points="' + skills.map(function (_, i) { return pt(i, R * k).join(','); }).join(' ') + '"/>';
    });
    skills.forEach(function (s, i) {
      var p = pt(i, R), l = pt(i, R + 26);
      html += '<line class="axis" x1="0" y1="0" x2="' + p[0] + '" y2="' + p[1] + '"/>';
      html += '<text x="' + l[0] + '" y="' + (l[1] - 4) + '" text-anchor="middle">' + s[0] + '</text>';
      html += '<text class="val" x="' + l[0] + '" y="' + (l[1] + 10) + '" text-anchor="middle">' + Math.round(s[1] * 100) + '</text>';
    });
    html += '<polygon class="shape" points="' + skills.map(function (s, i) { return pt(i, R * s[1]).join(','); }).join(' ') + '"/>';
    skills.forEach(function (s, i) { var p = pt(i, R * s[1]); html += '<circle class="pt" cx="' + p[0] + '" cy="' + p[1] + '" r="3.5"/>'; });
    radar.innerHTML = html;
    void NS;
  }

  /* ---- timeline line ---- */
  var tl = $('.timeline');
  if (tl) XR.whenVisible(tl, function () { setTimeout(function () { tl.classList.add('is-in'); }, 200); }, '-15%');

  /* ---- horizontal scroll panels + process line ---- */
  var hs = $('.hs'), track = $('.hs-track'), prog = $('.hs-progress');
  var stepsWrap = $('.steps-wrap'), stepsLine = $('.steps-line');
  var desktop = window.matchMedia('(min-width: 761px)');
  var ticking = false;

  function update() {
    ticking = false;
    var vh = innerHeight;
    if (hs && track && desktop.matches) {
      var r = hs.getBoundingClientRect();
      var total = r.height - vh;
      var p = total > 0 ? XR.clamp(-r.top / total, 0, 1) : 0;
      var dist = track.scrollWidth - innerWidth;
      track.style.transform = 'translate3d(' + (-p * Math.max(0, dist)).toFixed(1) + 'px,0,0)';
      if (prog) prog.style.setProperty('--p', p.toFixed(4));
    } else if (track) {
      track.style.transform = '';
    }
    if (stepsWrap && stepsLine) {
      var s = stepsWrap.getBoundingClientRect();
      var sp = XR.clamp((vh * .6 - s.top) / s.height, 0, 1);
      stepsLine.style.setProperty('--p', sp.toFixed(4));
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  update();

  /* ---- subtle hero parallax on pointer ---- */
  var hero = $('.hero'), sun = $('.hero-sun'), vis = $('.hero-visual');
  if (hero && XR.fine && !XR.reduce) {
    hero.addEventListener('pointermove', function (e) {
      var x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      if (sun) sun.style.translate = (x * -24).toFixed(1) + 'px ' + (y * -18).toFixed(1) + 'px';
      if (vis) vis.style.translate = (x * 18).toFixed(1) + 'px ' + (y * 12).toFixed(1) + 'px';
    });
  }
})();
