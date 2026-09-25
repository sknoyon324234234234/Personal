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
    /* layout reads before the style writes below */
    var s = stepsWrap && stepsLine ? stepsWrap.getBoundingClientRect() : null;
    if (hs && track && desktop.matches) {
      var r = hs.getBoundingClientRect();
      var total = r.height - vh;
      var p = total > 0 ? XR.clamp(-r.top / total, 0, 1) : 0;
      var lastP = panels[panels.length - 1], firstP = panels[0];
      /* travel from the first panel centred to the last panel centred */
      var dist = lastP && firstP ? (lastP.offsetLeft + lastP.offsetWidth / 2) - (firstP.offsetLeft + firstP.offsetWidth / 2) : track.scrollWidth - innerWidth;
      track.style.transform = 'translate3d(' + (-p * Math.max(0, dist)).toFixed(1) + 'px,0,0)';
      if (prog) prog.style.setProperty('--p', p.toFixed(4));
      tilt3d();
    } else if (track) {
      track.style.transform = '';
      panels.forEach(function (pn) { pn.style.transform = ''; pn.style.opacity = ''; });
      tilt3d(true);
    }
    if (s) {
      var sp = XR.clamp((vh * .6 - s.top) / s.height, 0, 1);
      stepsLine.style.setProperty('--p', sp.toFixed(4));
    }
  }
  /* 3D gallery: panels turn and sink as they leave the centre; the HUD follows the front one */
  var panels = $$('.panel'), hudN = $('.hs-count b'), hudT = $('.hs-title'), dots = $$('.hs-dots button'), active = -1;
  function tilt3d(flat) {
    var mid = innerWidth / 2, best = 0, bestD = Infinity;
    /* read every panel rect first, then write: one layout per frame instead of one per panel */
    var rects = panels.map(function (pn) { return pn.getBoundingClientRect(); });
    panels.forEach(function (pn, i) {
      var r = rects[i], c = r.left + r.width / 2, d = (c - mid) / (r.width + 30);
      var a = Math.abs(d);
      if (a < bestD) { bestD = a; best = i; }
      if (XR.reduce || flat) return;
      var k = Math.min(a, 2.2);
      pn.style.transform = 'rotateY(' + (-XR.clamp(d, -1.6, 1.6) * 24).toFixed(2) + 'deg) translateZ(' + (-k * 150).toFixed(1) + 'px) scale(' + (1 - Math.min(a, 1.5) * .06).toFixed(3) + ')';
      pn.style.opacity = (1 - Math.min(a, 1.8) * .3).toFixed(3);
    });
    if (best !== active) {
      active = best;
      panels.forEach(function (pn, i) { pn.classList.toggle('is-active', i === best); });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === best); d.setAttribute('aria-current', i === best ? 'true' : 'false'); });
      if (hudN) hudN.textContent = String(best + 1).padStart(2, '0');
      var h = panels[best] && panels[best].querySelector('.pn-body .h3');
      if (hudT && h) { hudT.textContent = h.textContent; hudT.classList.remove('swap'); void hudT.offsetWidth; hudT.classList.add('swap'); }
    }
  }
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () {
      if (!hs) return;
      var total = hs.offsetHeight - innerHeight, top = hs.getBoundingClientRect().top + scrollY;
      window.scrollTo({ top: top + total * (panels.length > 1 ? i / (panels.length - 1) : 0), behavior: XR.reduce ? 'auto' : 'smooth' });
    });
  });
  if (XR.fine) panels.forEach(function (pn) {
    pn.addEventListener('pointermove', function (e) {
      var r = pn.getBoundingClientRect();
      pn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      pn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', req, { passive: true });
  if (track) track.addEventListener('scroll', req, { passive: true });
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

  /* ---- services: filter tabs, 3D tilt with glare, price + delivery from the config ---- */
  var bento = $('.bento');
  if (bento) {
    var MAP = { 's-web': ['web', 'web'], 's-agent': ['ai-agent', 'ai'], 's-auto': ['automation', 'bots'], 's-tg': ['telegram', 'bots'],
      's-ext': ['extension', 'web'], 's-shop': ['ecommerce', 'shop'], 's-crypto': ['crypto', 'shop'], 's-mc': ['minecraft', 'bots'],
      's-desk': ['desktop', 'web'], 's-mob': ['mobile', 'web'], 's-chat': ['ai-chat', 'ai'] };
    var byId = {};
    (XR.services || []).forEach(function (sv) { byId[sv.id] = sv; });
    var cards = $$('.svc', bento);
    cards.forEach(function (c, i) {
      var key = Object.keys(MAP).filter(function (k) { return c.classList.contains(k); })[0], m = MAP[key];
      if (!m) return;
      c.setAttribute('data-cat', m[1]);
      var sv = byId[m[0]], top = $('.svc-top', c);
      if (top) top.insertAdjacentHTML('afterbegin', '<span class="svc-n">' + String(i + 1).padStart(2, '0') + '</span>');
      if (top) top.insertAdjacentHTML('beforeend', '<span class="svc-live"><i></i>live</span>');
      var more = $('.svc-more', c);
      if (sv && more) more.insertAdjacentHTML('beforebegin', '<div class="svc-meta"><span><small>From</small><b>' + XR.fmtPrice(sv.priceFrom) + '</b></span><span><small>Delivery</small><b>' + XR.esc(sv.days) + ' days</b></span></div>');
      c.insertAdjacentHTML('beforeend', '<i class="svc-glare" aria-hidden="true"></i>');
    });
    var cats = [['all', 'All eleven'], ['web', 'Web & apps'], ['bots', 'Bots & automation'], ['ai', 'AI'], ['shop', 'Commerce & payments']];
    var bar = document.createElement('div');
    bar.className = 'svc-filter';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Filter services');
    bar.innerHTML = cats.map(function (c, i) {
      var n = c[0] === 'all' ? cards.length : cards.filter(function (k) { return k.getAttribute('data-cat') === c[0]; }).length;
      return '<button type="button" data-f="' + c[0] + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + c[1] + '<em>' + n + '</em></button>';
    }).join('');
    bento.parentNode.insertBefore(bar, bento);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var f = b.getAttribute('data-f');
      $$('button', bar).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      bento.classList.toggle('is-filtered', f !== 'all');
      cards.forEach(function (c) { c.classList.toggle('is-dim', f !== 'all' && c.getAttribute('data-cat') !== f); });
    });
    if (XR.fine && !XR.reduce) cards.forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        c.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 7).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 9).toFixed(2) + 'deg) translateY(-4px)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }
})();
