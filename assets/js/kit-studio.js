/* =====================================================================
   XIRAIYA — UI Kit studio: specimen board, button anatomy with live tokens, and a cubic-bezier motion editor.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$;

  /* ---------- specimen board ---------- */
  var board = $('.kx-board');
  if (board) {
    var rng = $('#kxR'), ship = $('#kxShip'), toastEl = $('#kxToast'), tt;
    var flash = function (msg) {
      $('span', toastEl).textContent = msg;
      toastEl.classList.add('on');
      clearTimeout(tt);
      tt = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
    };
    rng.addEventListener('input', function () {
      board.style.setProperty('--r', rng.value + 'px');
      $('.kx-rv').textContent = 'r ' + rng.value;
      $('.kx-rv2').textContent = rng.value;
    });
    ship.addEventListener('click', function () {
      if (ship.classList.contains('done')) return;
      ship.classList.add('done');
      ship.firstChild.textContent = 'Shipped ';
      flash('Exported 12 frames to code');
      setTimeout(function () { ship.classList.remove('done'); ship.firstChild.textContent = 'Ship it '; }, 2400);
    });
    $('#kxAuto').addEventListener('change', function (e) { flash(e.target.checked ? 'Autosave is on' : 'Autosave paused'); });
    if (!XR.fine) $('.kx-pin').classList.add('on');
    XR.whenVisible(board, function () { setTimeout(function () { flash('Exported 12 frames to code'); }, 1400); }, '0px');
  }

  /* ---------- anatomy + tokens ---------- */
  var spec = $('.kx-spec');
  if (spec) {
    var stage = $('#kxStage'), big = $('#kxBig'), lines = $('#kxLines'), callouts = $('#kxCallouts');
    var ACC = [{ n: 'Shu', c: '#c4321d' }, { n: 'Ai', c: '#2b4c9b' }, { n: 'Aotake', c: '#2c6f65' }, { n: 'Kincha', c: '#d9a441' }, { n: 'Sumi', c: '#1f1813' }];
    var DEN = [{ py: 10, px: 16, fs: 14 }, { py: 14, px: 22, fs: 15 }, { py: 18, px: 28, fs: 16 }];
    var T = { a: 0, r: 12, d: 1, w: 700 };
    var LIGHT = '#fff8ee', DARK = '#1f1813';
    var lum = function (hex) {
      var n = parseInt(hex.slice(1), 16);
      return [n >> 16, n >> 8 & 255, n & 255].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); })
        .reduce(function (s, v, i) { return s + v * [.2126, .7152, .0722][i]; }, 0);
    };
    var ratio = function (a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

    var ICO = '<svg class="kx-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';
    var SPIN = '<svg class="kx-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9"/></svg>';
    $('#kxStates').innerHTML = [['Default', ''], ['Hover', 's-hover'], ['Pressed', 's-press'], ['Focus', 's-focus'], ['Loading', 's-load'], ['Disabled', 's-dis']].map(function (s) {
      return '<div><span class="kx-btn ' + s[1] + '">' + (s[1] === 's-load' ? SPIN : ICO) + '<span>' + (s[1] === 's-load' ? 'Saving' : 'Download') + '</span></span><small>' + s[0] + '</small></div>';
    }).join('');
    $('#kxAcc').innerHTML = ACC.map(function (a, i) { return '<button type="button" role="radio" aria-checked="' + (i === 0) + '" aria-label="' + a.n + '" title="' + a.n + '" style="--c:' + a.c + '" data-i="' + i + '"></button>'; }).join('');

    var place = function () {
      var sr = stage.getBoundingClientRect(), br = big.getBoundingClientRect(), ir = $('.kx-ico', big).getBoundingClientRect(), lr = $('.kx-lbl', big).getBoundingClientRect();
      var W = sr.width, H = sr.height, k = br.width / big.offsetWidth;
      var rel = function (r) { return { l: r.left - sr.left, t: r.top - sr.top, r: r.right - sr.left, b: r.bottom - sr.top, w: r.width, h: r.height }; };
      var B = rel(br), I = rel(ir), L = rel(lr), dn = DEN[T.d];
      var pts = [
        { n: 1, t: 'Container', v: 'radius ' + T.r + 'px', x: B.l + Math.max(8, T.r * k * .6), y: B.t + 2, side: 'l', ly: .16 },
        { n: 4, t: 'Padding', v: dn.py + ' × ' + dn.px, x: B.l + dn.px * k / 2, y: B.t + B.h / 2, side: 'l', ly: .5, box: [B.l, B.t, dn.px * k, B.h] },
        { n: 2, t: 'Icon', v: '18 px · 2 px stroke', x: I.l + I.w / 2, y: I.b, side: 'l', ly: .84 },
        { n: 3, t: 'Label', v: dn.fs + 'px / ' + T.w, x: L.l + L.w * .6, y: L.t, side: 'r', ly: .16 },
        { n: 5, t: 'Focus ring', v: '3 px · offset 2', x: B.r + 5 * k, y: B.t + B.h / 2, side: 'r', ly: .5 },
        { n: 6, t: 'Elevation', v: '0 10 24 −12', x: B.l + B.w * .7, y: B.b + 8, side: 'r', ly: .84 }
      ];
      var svg = '', html = '', m = W < 560 ? 10 : 22;
      pts.forEach(function (p) {
        p.ty = Math.round(H * p.ly);
        html += '<li class="' + (p.side === 'r' ? 'r' : '') + '" style="top:' + (p.ty - 10) + 'px;' + (p.side === 'l' ? 'left:' + m + 'px' : 'right:' + m + 'px') + '"><b>' + p.n + '</b><span><b>' + p.t + '</b> ' + p.v + '</span></li>';
      });
      callouts.innerHTML = html;
      $$('li', callouts).forEach(function (li, i) {
        var p = pts[i], r = li.getBoundingClientRect(), tx = p.side === 'l' ? r.right - sr.left + 8 : r.left - sr.left - 8;
        if (p.box) svg += '<rect x="' + p.box[0].toFixed(1) + '" y="' + p.box[1].toFixed(1) + '" width="' + p.box[2].toFixed(1) + '" height="' + p.box[3].toFixed(1) + '"/>';
        svg += '<line x1="' + tx.toFixed(1) + '" y1="' + p.ty + '" x2="' + p.x.toFixed(1) + '" y2="' + p.y.toFixed(1) + '"/><circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.5"/>';
      });
      lines.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      lines.innerHTML = svg;
    };
    var apply = function () {
      var a = ACC[T.a].c, on = ratio(a, LIGHT) >= ratio(a, DARK) ? LIGHT : DARK, cr = ratio(a, on), dn = DEN[T.d];
      spec.style.setProperty('--acc', a);
      spec.style.setProperty('--on', on);
      spec.style.setProperty('--rad', T.r + 'px');
      spec.style.setProperty('--py', dn.py + 'px');
      spec.style.setProperty('--px', dn.px + 'px');
      spec.style.setProperty('--fs', dn.fs + 'px');
      spec.style.setProperty('--wt', T.w);
      $('#kxRadV').textContent = T.r + 'px';
      $('#kxCr').textContent = cr.toFixed(1) + ' : 1' + (cr >= 7 ? ' · AAA' : cr >= 4.5 ? ' · AA' : ' · fails');
      var bar = $('#kxCrI'); bar.style.width = Math.min(100, cr * 10) + '%'; bar.style.background = cr >= 4.5 ? '#1f8a5b' : '#d97706';
      $('#kxTokCode').textContent = ':root {\n  --btn-accent: ' + a + ';\n  --btn-on-accent: ' + on + ';\n  --btn-radius: ' + T.r + 'px;\n  --btn-pad: ' + dn.py + 'px ' + dn.px + 'px;\n  --btn-font: ' + T.w + ' ' + dn.fs + 'px/1 "Zen Kaku Gothic New";\n  --btn-shadow: 0 10px 24px -12px var(--btn-accent);\n  --btn-ring: 0 0 0 3px color-mix(in srgb, var(--btn-accent) 45%, transparent);\n}';
      requestAnimationFrame(function () { setTimeout(place, 220); });
    };
    var seg = function (id, key) {
      $(id).addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        $$('button', $(id)).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
        T[key] = +b.getAttribute(key === 'a' ? 'data-i' : 'data-v');
        apply();
      });
    };
    seg('#kxAcc', 'a'); seg('#kxDen', 'd'); seg('#kxWt', 'w');
    $('#kxRad').addEventListener('input', function (e) { T.r = +e.target.value; apply(); });
    $('#kxCopyTok').addEventListener('click', function () { XR.copy($('#kxTokCode').textContent).then(function () { XR.toast('Tokens copied'); }); });
    window.addEventListener('resize', function () { clearTimeout(place.t); place.t = setTimeout(place, 120); });
    XR.whenVisible(spec, function () { apply(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(place); });
  }

  /* ---------- motion: cubic-bezier editor ---------- */
  var bz = $('#kxBz');
  if (bz) {
    var S = 320, P = [.16, 1, .3, 1], dur = 600, playing = null, visible = false, loopT;
    var PRE = [['Out expo', [.16, 1, .3, 1]], ['Snappy', [.2, .8, .2, 1]], ['Overshoot', [.34, 1.56, .64, 1]], ['Anticipate', [.68, -.55, .27, 1.55]], ['In-out', [.77, 0, .175, 1]], ['Standard', [.25, .1, .25, 1]]];
    $('#kxPre').innerHTML = PRE.map(function (p, i) { return '<button type="button" aria-pressed="' + (i === 0) + '" data-i="' + i + '">' + p[0] + '</button>'; }).join('');
    var X = function (v) { return v * S; }, Y = function (v) { return S - v * S; };
    var grid = '';
    for (var g = 0; g <= S; g += 32) grid += '<line class="gridl" x1="' + g + '" y1="0" x2="' + g + '" y2="' + S + '"/><line class="gridl" x1="0" y1="' + g + '" x2="' + S + '" y2="' + g + '"/>';
    bz.innerHTML = grid + '<rect class="box" x="0" y="0" width="' + S + '" height="' + S + '"/><line class="lin" x1="0" y1="' + S + '" x2="' + S + '" y2="0"/>' +
      '<text x="' + S + '" y="' + (S + 24) + '" text-anchor="end">time →</text><text x="-16" y="' + S / 2 + '" text-anchor="middle" transform="rotate(-90 -16 ' + S / 2 + ')">progress →</text>' +
      '<line class="arm" id="kxA1"/><line class="arm" id="kxA2"/><path class="crv" id="kxC"/><circle class="prog" id="kxProg" r="6" cx="0" cy="' + S + '"/>' +
      '<circle class="hd" id="kxH1" r="10" tabindex="0" aria-label="Handle 1"/><circle class="hd" id="kxH2" r="10" tabindex="0" aria-label="Handle 2"/>';
    var r3 = function (v) { return Math.round(v * 100) / 100; };
    var drawBz = function () {
      $('#kxC').setAttribute('d', 'M0 ' + S + ' C' + X(P[0]) + ' ' + Y(P[1]) + ' ' + X(P[2]) + ' ' + Y(P[3]) + ' ' + S + ' 0');
      [['#kxA1', 0, S, P[0], P[1]], ['#kxA2', S, 0, P[2], P[3]]].forEach(function (a) { var l = $(a[0]); l.setAttribute('x1', a[1]); l.setAttribute('y1', a[2]); l.setAttribute('x2', X(a[3])); l.setAttribute('y2', Y(a[4])); });
      $('#kxH1').setAttribute('cx', X(P[0])); $('#kxH1').setAttribute('cy', Y(P[1]));
      $('#kxH2').setAttribute('cx', X(P[2])); $('#kxH2').setAttribute('cy', Y(P[3]));
      var cb = 'cubic-bezier(' + P.map(r3).join(', ') + ')';
      $('#kxEaseCode').textContent = ':root { --ease-custom: ' + cb + '; }\n\n.menu {\n  transition:\n    transform ' + dur + 'ms var(--ease-custom),\n    opacity ' + Math.round(dur * .6) + 'ms ease-out;\n}';
      $('#kxDurV').textContent = dur + 'ms';
    };
    /* solve the curve: x(t) = time -> y(t) */
    var bez = function (t, a, b) { var u = 1 - t; return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t; };
    var ease = function (x) {
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 8; i++) {
        var cx = bez(t, P[0], P[2]) - x, d = 3 * (1 - t) * (1 - t) * P[0] + 6 * (1 - t) * t * (P[2] - P[0]) + 3 * t * t * (1 - P[2]);
        if (Math.abs(cx) < 1e-5) break;
        if (Math.abs(d) < 1e-6) break;
        t -= cx / d;
      }
      if (t < 0 || t > 1 || Math.abs(bez(t, P[0], P[2]) - x) > 1e-3) {
        t = x;
        for (var j = 0; j < 30; j++) { var v = bez(t, P[0], P[2]); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      }
      return bez(t, P[1], P[3]);
    };
    var drag = null;
    var pt = function (e) { var m = bz.getScreenCTM().inverse(), q = bz.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; return q.matrixTransform(m); };
    bz.addEventListener('pointerdown', function (e) {
      var h = e.target.closest('.hd'); if (!h) return;
      drag = h.id === 'kxH1' ? 0 : 2; h.classList.add('drag'); bz.setPointerCapture(e.pointerId); e.preventDefault();
    });
    bz.addEventListener('pointermove', function (e) {
      if (drag === null) return;
      var q = pt(e);
      P[drag] = Math.max(0, Math.min(1, q.x / S));
      P[drag + 1] = Math.max(-.25, Math.min(1.25, (S - q.y) / S));
      $$('#kxPre button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      drawBz();
    });
    var end = function () { if (drag === null) return; drag = null; $$('.hd', bz).forEach(function (h) { h.classList.remove('drag'); }); run(); };
    bz.addEventListener('pointerup', end); bz.addEventListener('pointercancel', end);
    bz.addEventListener('keydown', function (e) {
      var h = e.target.closest('.hd'); if (!h) return;
      var i = h.id === 'kxH1' ? 0 : 2, s = e.shiftKey ? .1 : .02;
      if (e.key === 'ArrowLeft') P[i] = Math.max(0, P[i] - s); else if (e.key === 'ArrowRight') P[i] = Math.min(1, P[i] + s);
      else if (e.key === 'ArrowUp') P[i + 1] = Math.min(1.25, P[i + 1] + s); else if (e.key === 'ArrowDown') P[i + 1] = Math.max(-.25, P[i + 1] - s);
      else return;
      e.preventDefault(); drawBz();
    });
    $('#kxPre').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('#kxPre button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      P = PRE[+b.getAttribute('data-i')][1].slice(); drawBz(); run();
    });
    $('#kxDur').addEventListener('input', function (e) { dur = +e.target.value; drawBz(); });
    $('#kxDur').addEventListener('change', run);
    var dot = $('#kxDot'), card = $('#kxCard'), menu = $('#kxMenu'), prog = $('#kxProg');
    function run() {
      clearTimeout(loopT);
      if (playing) cancelAnimationFrame(playing);
      var cb = 'cubic-bezier(' + P.join(',') + ')', track = dot.parentElement.clientWidth - 34;
      var opt = { duration: dur, easing: XR.reduce ? 'linear' : cb, fill: 'both' };
      dot.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + track + 'px)' }], opt);
      card.animate([{ transform: 'translateY(14px) scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], opt);
      menu.animate([{ transform: 'scale(.6, .4)', opacity: 0 }, { transform: 'none', opacity: 1 }], opt);
      var t0 = performance.now();
      (function f(now) {
        var k = Math.min(1, (now - t0) / dur), y = ease(k);
        prog.setAttribute('cx', X(k)); prog.setAttribute('cy', Y(y));
        if (k < 1) playing = requestAnimationFrame(f);
        else { playing = null; if ($('#kxLoop').checked && visible) loopT = setTimeout(run, 900); }
      })(t0);
    }
    $('#kxRun').addEventListener('click', run);
    $('#kxLoop').addEventListener('change', function (e) { if (e.target.checked) run(); });
    $('#kxCopyEase').addEventListener('click', function () { XR.copy($('#kxEaseCode').textContent).then(function () { XR.toast('Easing copied'); }); });
    drawBz();
    new IntersectionObserver(function (en) {
      var was = visible; visible = en[0].isIntersecting;
      if (visible && !was && !XR.reduce) run();
    }, { threshold: .3 }).observe($('.kx-mo-grid'));
  }
})();
