/* XIRAIYA — Basic Knowledge: live preview engines, part 2
   (UX, motion, APIs, databases, security, incidents, ops, performance, AI). */
(function () {
  'use strict';
  var PV = window.XR_PV = window.XR_PV || {};
  var K = window.XR_PVK;
  if (!K) return;
  var I = K.I, esc = K.esc, $ = K.$, $$ = K.$$, hl = K.hl, seg = K.seg, onSeg = K.onSeg, logLine = K.logLine, play = K.play, codeBlock = K.codeBlock;
  function setSeg(root, sel, v) { $$(sel + ' button', root).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); }); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function bump(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  /* Auto-toggle a segmented control until the visitor clicks it. */
  function autoSeg(k, sel, vals, fn, ms) {
    var hold = 0, i = 0;
    onSeg(k, k.el, sel, function (v) { hold = Date.now(); i = vals.indexOf(v); fn(v); });
    fn(vals[0]);
    k.every(function () { if (Date.now() - hold > 6000) { i = (i + 1) % vals.length; setSeg(k.el, sel, vals[i]); fn(vals[i]); } }, ms || 3000);
  }

  /* ================= UX ================= */
  var UX = {};
  UX.flow = function (k) {
    var ST = ['Visit', 'Product', 'Cart', 'Checkout', 'Paid'], D = { bad: [100, 58, 24, 11, 6], good: [100, 76, 49, 38, 33] };
    k.el.innerHTML = '<div class="pv pv-ux"><div class="pv-row pv-center">' + seg([['bad', 'Confusing shop'], ['good', 'Clear shop']], 'bad', 'ux-m') + '</div><div class="ux-fun">' +
      ST.map(function (s) { return '<div class="ux-fr"><span>' + s + '</span><div class="ux-ft"><i></i></div><b>0</b></div>'; }).join('') + '</div><div class="ux-conv"></div></div>';
    var rows = $$('.ux-fr', k.el);
    autoSeg(k, '.ux-m', ['bad', 'good'], function (v) {
      rows.forEach(function (r, i) { $('i', r).style.width = D[v][i] + '%'; $('b', r).textContent = D[v][i] * 10; r.parentElement.className = 'ux-fun ' + v; });
      $('.ux-conv', k.el).innerHTML = 'Out of 1,000 visitors, <b>' + D[v][4] * 10 + '</b> buy. ' + (v === 'bad' ? 'Hidden prices, long forms and surprise fees push people away.' : 'Clear prices, guest checkout and one-tap pay keep them moving.');
    }, 3200);
  };
  UX.hier = function (k) {
    k.el.innerHTML = '<div class="pv pv-ux"><div class="pv-row pv-center">' + seg([['bad', 'No hierarchy'], ['good', 'Clear hierarchy']], 'bad', 'ux-m') + '</div>' +
      '<div class="ux-hier"><div class="uh-card"><small class="uh-e">Blade plan</small><b class="uh-t">Sell online in 2 weeks</b><span class="uh-p">$100–300</span><p class="uh-d">Shop, payments, admin panel and a Telegram bot for orders.</p><span class="uh-b">Start my shop</span><span class="uh-l">Compare plans</span>' +
      [1, 2, 3, 4].map(function (i) { return '<i class="uh-eye e' + i + '">' + i + '</i>'; }).join('') + '</div></div><div class="pv-note ux-say"></div></div>';
    autoSeg(k, '.ux-m', ['bad', 'good'], function (v) {
      $('.ux-hier', k.el).className = 'ux-hier ' + v;
      $('.ux-say', k.el).textContent = v === 'bad' ? 'Everything shouts, so nothing is heard. The eye jumps around and leaves.' : 'Size, weight and colour lead the eye: 1 title, 2 price, 3 details, 4 action.';
    }, 3400);
  };
  UX.fitts = function (k) {
    k.el.innerHTML = '<div class="pv pv-ux"><div class="uf-lanes">' + [['Small and far', 24, 90], ['Big and close', 64, 55]].map(function (l, i) {
      var t = Math.round(120 + 160 * Math.log2(l[2] / l[1] * 4 + 1));
      return '<div class="uf-lane" data-t="' + t + '"><span class="uf-lb">' + l[0] + '</span><div class="uf-track"><i class="uf-cur">' + I('mouse') + '</i><button type="button" class="uf-tg" style="--w:' + l[1] + 'px;--x:' + l[2] + '%">Buy</button></div><b class="uf-ms">' + t + ' ms</b></div>';
    }).join('') + '</div><div class="ft-f">T = a + b · log<sub>2</sub>(distance / size + 1)</div><div class="pv-note">Bigger, closer targets are faster to hit. That is why phone buttons need at least 44px and main actions sit near the thumb.</div></div>';
    function go() { $$('.uf-lane', k.el).forEach(function (l) { l.classList.remove('go'); void l.offsetWidth; l.style.setProperty('--dur', l.getAttribute('data-t') * 3 + 'ms'); l.classList.add('go'); }); }
    go(); k.every(go, 3600);
  };
  UX.hick = function (k) {
    var ITEMS = ['Home', 'Shop', 'Sale', 'New', 'Men', 'Women', 'Kids', 'Shoes', 'Bags', 'Gifts', 'Brands', 'Blog', 'Help', 'Stores', 'Careers', 'Press', 'Returns', 'Track', 'Wishlist', 'Rewards', 'App', 'Contact', 'About', 'Legal'];
    k.el.innerHTML = '<div class="pv pv-ux"><label class="pv-ctl"><span>Menu items <b class="hk-n">4</b></span><input type="range" min="2" max="24" value="4"></label><div class="hk-menu"></div><div class="hk-bar"><i></i><span></span></div><div class="pv-note">Hick’s law: every extra choice makes deciding slower. Group, hide and prioritise.</div></div>';
    var rng = $('input', k.el), hold = 0, dir = 1;
    function set(n) {
      rng.value = n; $('.hk-n', k.el).textContent = n;
      $('.hk-menu', k.el).innerHTML = ITEMS.slice(0, n).map(function (x, i) { return '<span style="--i:' + i + '">' + x + '</span>'; }).join('');
      var t = Math.round(200 + 180 * Math.log2(n + 1));
      $('.hk-bar i', k.el).style.width = (t / 1100 * 100) + '%';
      $('.hk-bar span', k.el).textContent = 'Time to decide ≈ ' + t + ' ms';
      $('.hk-bar', k.el).className = 'hk-bar ' + (n <= 6 ? 'ok' : n <= 12 ? 'mid' : 'bad');
    }
    k.on(rng, 'input', function () { hold = Date.now(); set(+rng.value); });
    set(4);
    k.every(function () { if (Date.now() - hold < 5000) return; var n = +rng.value + dir * 4; if (n > 24 || n < 2) { dir *= -1; n = Math.max(2, Math.min(24, n)); } set(n); }, 1400);
  };
  UX.contrast = function (k) {
    play(k, { cls: 'pl-contrast', noCode: true, stage: '<div class="uc2"><b>Readable text</b><p>People with low vision, old screens or bright sun all need contrast.</p><div class="uc2-r"></div></div>',
      ctl: [['h', 'Hue', 0, 360, 20, 1, '°'], ['fl', 'Text lightness', 0, 100, 62, 1, '%'], ['bl', 'Background lightness', 0, 100, 96, 1, '%']],
      apply: function (v, s) {
        var fg = K.hslHex(v.h, 30, v.fl), bg = K.hslHex(v.h, 40, v.bl), r = K.contrast(K.hexRgb(fg), K.hexRgb(bg));
        var b = $('.uc2', s); b.style.color = fg; b.style.background = bg;
        $('.uc2-r', s).innerHTML = '<span>Contrast <b>' + r.toFixed(2) + ':1</b></span>' + K.badge(r) + '<small>Aim for 4.5:1 for body text, 3:1 for big headings.</small>';
      } });
  };
  UX.feedback = function (k) {
    k.el.innerHTML = '<div class="pv pv-ux"><div class="fb-2">' + [['none', 'No feedback'], ['yes', 'With feedback']].map(function (s) { return '<div class="fb-s ' + s[0] + '"><small>' + s[1] + '</small><button type="button" class="fb-b">Pay $49</button><span class="fb-msg"></span></div>'; }).join('') + '</div><div class="pv-note">Without feedback people click again, and pay twice. Show pressed, busy and done states.</div></div>';
    function press(side) {
      var s = $('.fb-s.' + side, k.el), b = $('.fb-b', s), m = $('.fb-msg', s);
      if (s.classList.contains('busy')) return;
      s.classList.add('busy');
      if (side === 'yes') { b.innerHTML = '<i class="ub-spin"></i> Paying…'; m.textContent = ''; }
      else { m.textContent = 'Did it work? Click again?'; }
      k.later(function () {
        s.classList.remove('busy');
        if (side === 'yes') { b.innerHTML = I('check') + ' Paid'; b.classList.add('done'); m.textContent = 'Receipt sent to your email.'; }
        else { m.textContent = 'Charged twice.'; m.classList.add('bad'); }
        k.later(function () { b.textContent = 'Pay $49'; b.classList.remove('done'); m.textContent = ''; m.classList.remove('bad'); }, 1800);
      }, 1500);
    }
    k.on(k.el, 'click', function (e) { var b = e.target.closest('.fb-b'); if (b) press(b.parentElement.classList.contains('yes') ? 'yes' : 'none'); });
    function auto() { press('none'); press('yes'); }
    auto(); k.every(auto, 4200);
  };
  UX.consist = function (k) {
    k.el.innerHTML = '<div class="pv pv-ux"><div class="pv-row pv-center">' + seg([['bad', 'Inconsistent'], ['good', 'Consistent']], 'bad', 'ux-m') + '</div><div class="cs-ui">' +
      ['Profile', 'Orders', 'Settings'].map(function (x, i) { return '<div class="cs-c c' + i + '"><b>' + x + '</b><p>Manage your ' + x.toLowerCase() + '.</p><span class="cs-b">' + ['Save', 'SUBMIT', 'Ok, apply'][i] + '</span></div>'; }).join('') + '</div><div class="pv-note ux-say"></div></div>';
    autoSeg(k, '.ux-m', ['bad', 'good'], function (v) {
      $('.cs-ui', k.el).className = 'cs-ui ' + v;
      $$('.cs-b', k.el).forEach(function (b, i) { b.textContent = v === 'good' ? 'Save' : ['Save', 'SUBMIT', 'Ok, apply'][i]; });
      $('.ux-say', k.el).textContent = v === 'bad' ? 'Three screens, three button styles, three words for the same action. Users have to relearn every page.' : 'Same shape, colour, position and word. Learn once, use everywhere.';
    }, 3200);
  };
  UX.white = function (k) {
    play(k, { cls: 'pl-white', noCode: true, stage: '<div class="wh"><small>Chapter 3</small><b>Space is a feature</b><p>Whitespace groups related things, separates the rest and makes a page feel calm and premium.</p><span>Read more</span></div>',
      ctl: [['s', 'Whitespace', 0, 32, 4, 1, 'px']],
      apply: function (v, s) { var w = $('.wh', s); w.style.padding = (6 + v.s) + 'px'; w.style.gap = (2 + v.s / 2.5) + 'px'; w.style.lineHeight = 1.15 + v.s / 60; } });
    var r = $('input', k.el), dir = 1, hold = 0;
    k.on(r, 'input', function () { hold = Date.now(); });
    k.every(function () { if (Date.now() - hold < 5000) return; var n = +r.value + dir * 2; if (n > 32 || n < 0) { dir *= -1; n = Math.max(0, Math.min(32, n)); } r.value = n; r.dispatchEvent(new Event('input', { bubbles: true })); hold = 0; }, 160);
  };
  UX.empty = function (k) {
    k.el.innerHTML = '<div class="pv pv-ux"><div class="pv-row pv-center">' + seg([['bad', 'Blank screen'], ['good', 'Designed empty state']], 'bad', 'ux-m') + '</div><div class="em-app"><div class="em-top"><b>Orders</b><span>' + I('search') + '</span></div><div class="em-body"><div class="em-bad">0 results</div><div class="em-good"><span class="em-ill">' + I('box') + '</span><b>No orders yet</b><p>When someone buys, their order shows up here.</p><span class="em-cta">' + I('link') + ' Share your shop link</span></div></div></div></div>';
    autoSeg(k, '.ux-m', ['bad', 'good'], function (v) { $('.em-app', k.el).className = 'em-app ' + v; }, 3000);
  };
  PV.ux = function (k, c) { (UX[c.demo] || UX.flow)(k); };

  /* ================= Motion ================= */
  var MO = {};
  function lanes(k, list, note) {
    k.el.innerHTML = '<div class="pv pv-mo"><div class="mo-lanes">' + list.map(function (l) {
      return '<div class="mo-lane"><span>' + l[0] + '</span><div class="mo-track"><i class="mo-ball" style="transition-timing-function:' + l[1] + ';transition-duration:' + (l[2] || 1100) + 'ms"></i></div>' + (l[3] || '') + '</div>';
    }).join('') + '</div><div class="pv-note">' + note + '</div></div>';
    var box = $('.mo-lanes', k.el), on = false;
    function go() { on = !on; box.classList.toggle('go', on); }
    k.later(go, 200); k.every(go, 1900);
  }
  function curve(b) {
    var p = b.slice(b.indexOf('(') + 1, -1).split(',').map(Number);
    return '<svg class="mo-curve" viewBox="-4 -24 48 72" aria-hidden="true"><path d="M0 40 C' + p[0] * 40 + ' ' + (40 - p[1] * 40) + ' ' + p[2] * 40 + ' ' + (40 - p[3] * 40) + ' 40 0"/></svg>';
  }
  MO.ease = function (k) {
    var E = [['linear', 'cubic-bezier(0,0,1,1)'], ['ease-in', 'cubic-bezier(.42,0,1,1)'], ['ease-out', 'cubic-bezier(0,0,.58,1)'], ['ease-in-out', 'cubic-bezier(.42,0,.58,1)'], ['spring', 'cubic-bezier(.34,1.56,.64,1)']];
    lanes(k, E.map(function (e) { return [e[0], e[1], 1100, curve(e[1])]; }), 'Same distance, same time, different feel. Use ease-out for things entering, ease-in for things leaving.');
  };
  MO.dur = function (k) {
    lanes(k, [[100, 'too fast'], [200, 'snappy'], [300, 'just right'], [500, 'calm'], [1000, 'too slow']].map(function (d) { return [d[0] + 'ms', 'cubic-bezier(.2,.8,.2,1)', d[0], '<em class="mo-tag">' + d[1] + '</em>']; }), 'Small UI changes: 150–300ms. Big moves across the screen: 300–500ms. Over 500ms feels slow.');
  };
  MO.key = function (k) {
    k.el.innerHTML = '<div class="pv pv-mo"><div class="kf-stage"><i class="kf-box"></i><div class="kf-marks"><span style="left:0">0%</span><span style="left:50%">50%</span><span style="left:100%">100%</span></div></div>' +
      '<div class="pv-row kf-ctl"><button type="button" class="pv-btn sm kf-play">' + I('pause') + '</button><input type="range" min="0" max="1000" value="0" aria-label="Scrub the animation"><b class="kf-pct">0%</b></div>' +
      codeBlock('@keyframes jump {\n  0%   { transform: translateX(0) rotate(0); border-radius: 6px; }\n  50%  { transform: translate(50%, -40px) rotate(180deg) scale(1.3); border-radius: 50%; }\n  100% { transform: translateX(100%) rotate(360deg); border-radius: 6px; }\n}\n.box { animation: jump 2s ease-in-out infinite; }', 'css') + '</div>';
    var box = $('.kf-box', k.el), stage = $('.kf-stage', k.el), rng = $('input', k.el), pct = $('.kf-pct', k.el), btn = $('.kf-play', k.el);
    var w = stage.clientWidth - 40, a = null;
    if (box.animate) {
      a = box.animate([{ transform: 'translateX(0) rotate(0)', borderRadius: '6px', background: 'var(--red)' }, { transform: 'translate(' + w / 2 + 'px,-40px) rotate(180deg) scale(1.3)', borderRadius: '50%', background: 'var(--gold)' }, { transform: 'translateX(' + w + 'px) rotate(360deg)', borderRadius: '6px', background: 'var(--cyan)' }], { duration: 2000, iterations: Infinity, easing: 'ease-in-out', direction: 'alternate' });
      k.loop(function () { if (!a.playState || a.playState === 'running') { var t = (a.currentTime % 4000); var p = t < 2000 ? t / 2000 : 2 - t / 2000; rng.value = Math.round(p * 1000); pct.textContent = Math.round(p * 100) + '%'; } return true; });
      k.on(rng, 'input', function () { a.pause(); btn.innerHTML = I('play'); a.currentTime = rng.value * 2; pct.textContent = Math.round(rng.value / 10) + '%'; });
      k.on(btn, 'click', function () { if (a.playState === 'running') { a.pause(); btn.innerHTML = I('play'); } else { a.play(); btn.innerHTML = I('pause'); } });
      k.onStop(function () { a.cancel(); });
    }
  };
  MO.micro = function (k) {
    k.el.innerHTML = '<div class="pv pv-mo"><div class="mi-grid">' +
      '<button type="button" class="mi mi-like" aria-label="Like">' + I('heart') + '<span class="mi-burst">' + '<i></i>'.repeat(8) + '</span></button>' +
      '<button type="button" class="mi mi-copy" aria-label="Copy"><span class="a">' + I('copy') + '</span><span class="b">' + I('check') + '</span></button>' +
      '<button type="button" class="mi mi-bell" aria-label="Notifications">' + I('bell') + '<em>3</em></button>' +
      '<button type="button" class="mi mi-cart" aria-label="Add to cart">' + I('cart') + '<em>0</em></button></div><div class="pv-note">Micro-interactions: tiny motion that confirms “I heard you”. Tap them.</div></div>';
    var n = 0;
    function fire(b) {
      if (b.classList.contains('mi-like')) b.classList.toggle('on');
      if (b.classList.contains('mi-cart')) { var e = $('em', b); e.textContent = +e.textContent + 1; }
      bump(b, 'fire');
    }
    k.on(k.el, 'click', function (e) { var b = e.target.closest('.mi'); if (b) fire(b); });
    var all = $$('.mi', k.el);
    k.every(function () { fire(all[n++ % all.length]); }, 1100);
  };
  MO.stagger = function (k) {
    play(k, { cls: 'pl-stagger', stage: '<ul class="sg">' + ['Design', 'Build', 'Test', 'Launch', 'Grow', 'Repeat'].map(function (x, i) { return '<li style="--i:' + i + '">' + I('check') + x + '</li>'; }).join('') + '</ul>',
      ctl: [['d', 'Stagger delay', 0, 200, 70, 10, 'ms']],
      apply: function (v, s) { var u = $('.sg', s); u.style.setProperty('--d', v.d + 'ms'); u.classList.remove('in'); void u.offsetWidth; u.classList.add('in'); return 'li {\n  animation: rise .5s ease-out both;\n  animation-delay: calc(var(--i) * ' + v.d + 'ms);\n}'; } });
    k.every(function () { var u = $('.sg', k.el); u.classList.remove('in'); void u.offsetWidth; u.classList.add('in'); }, 2600);
  };
  MO.spring = function (k) {
    k.el.innerHTML = '<div class="pv pv-mo"><div class="sp-box"><svg class="sp-line"><line x1="50%" y1="50%" x2="50%" y2="50%"/></svg><i class="sp-anchor"></i><b class="sp-ball">drag</b></div><div class="pv-ctls sp-ctl"></div></div>';
    var box = $('.sp-box', k.el), ball = $('.sp-ball', k.el), line = $('.sp-line line', k.el);
    var p = { x: 0, y: 0 }, v = { x: 0, y: 0 }, drag = false, cfg = {}, last = 0;
    K.controls($('.sp-ctl', k.el), [['st', 'Stiffness', 20, 400, 170, 5, ''], ['dm', 'Damping', 2, 40, 10, 1, '']], function (c) { cfg = c; });
    k.on(ball, 'pointerdown', function (e) { drag = true; last = Date.now(); ball.setPointerCapture(e.pointerId); });
    k.on(ball, 'pointermove', function (e) { if (!drag) return; var r = box.getBoundingClientRect(); p.x = e.clientX - r.left - r.width / 2; p.y = e.clientY - r.top - r.height / 2; v.x = v.y = 0; });
    k.on(ball, 'pointerup', function () { drag = false; last = Date.now(); });
    var prev = performance.now();
    k.loop(function (now) {
      var dt = Math.min(0.032, (now - prev) / 1000); prev = now;
      if (!drag) { ['x', 'y'].forEach(function (a) { var f = -cfg.st * p[a] - cfg.dm * v[a]; v[a] += f * dt; p[a] += v[a] * dt; }); }
      ball.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      var r = box.getBoundingClientRect();
      line.setAttribute('x2', r.width / 2 + p.x); line.setAttribute('y2', r.height / 2 + p.y);
      line.setAttribute('x1', r.width / 2); line.setAttribute('y1', r.height / 2);
      return true;
    });
    k.every(function () { if (!drag && Date.now() - last > 3000) { var r = box.getBoundingClientRect(); p.x = rnd(-0.4, 0.4) * r.width; p.y = rnd(-0.35, 0.35) * r.height; v.x = v.y = 0; } }, 2600);
  };
  MO.reveal = function (k) {
    k.el.innerHTML = '<div class="pv pv-mo"><div class="rv-scroll" tabindex="0" aria-label="Scroll me">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<div class="rv-it" style="--h:' + (i * 37 % 360) + '"><i class="rv-img"></i><div><b>Section ' + (i + 1) + '</b><span>loads when you scroll to it</span></div></div>'; }).join('') + '</div><div class="rv-count pv-note"></div></div>';
    var sc = $('.rv-scroll', k.el), items = $$('.rv-it', k.el), n = 0, user = 0, dir = 1;
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting && !e.target.classList.contains('in')) { e.target.classList.add('in'); n++; $('.rv-count', k.el).textContent = 'Loaded ' + n + ' of ' + items.length + ' — the rest wait until they are needed.'; } }); }, { root: sc, threshold: 0.35 });
    items.forEach(function (i) { io.observe(i); });
    k.onStop(function () { io.disconnect(); });
    k.on(sc, 'wheel', function () { user = Date.now(); }, { passive: true });
    k.on(sc, 'touchstart', function () { user = Date.now(); }, { passive: true });
    k.loop(function () { if (Date.now() - user > 4000) { sc.scrollTop += dir * 0.9; if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1) dir = -1; if (sc.scrollTop <= 0) dir = 1; } return true; });
  };
  MO.parallax = function (k) {
    k.el.innerHTML = '<div class="pv pv-mo"><div class="px-scene"><i class="px-l px-sky" data-d="0"></i><i class="px-l px-sun" data-d="0.08"></i><i class="px-l px-far" data-d="0.18"></i><i class="px-l px-mid" data-d="0.35"></i><i class="px-l px-near" data-d="0.6"></i><b class="px-l px-t" data-d="0.9">視差 Parallax</b></div><div class="pv-note">Layers move at different speeds, so flat shapes feel deep. Move your mouse or finger over it.</div></div>';
    var sc = $('.px-scene', k.el), L = $$('.px-l', k.el), mx = 0, my = 0, t0 = performance.now(), user = 0;
    k.on(sc, 'pointermove', function (e) { var r = sc.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; user = Date.now(); });
    k.loop(function (now) {
      if (Date.now() - user > 2500) { var t = (now - t0) / 1000; mx = Math.sin(t * 0.8) * 0.5; my = Math.cos(t * 0.6) * 0.25; }
      L.forEach(function (l) { var d = +l.getAttribute('data-d'); l.style.transform = 'translate(' + (-mx * d * 60) + 'px,' + (-my * d * 30) + 'px)'; });
      return true;
    });
  };
  MO.page = function (k) {
    var P = [['Home', 'Welcome back, Nusrat.', 'home'], ['Shop', '24 new products this week.', 'bag'], ['Profile', '3 orders · 1 on the way.', 'user']];
    k.el.innerHTML = '<div class="pv pv-mo"><div class="pv-row pv-center">' + seg(['fade', 'slide', 'zoom', 'wipe'], 'slide', 'pg-m') + '</div><div class="pg-app"><div class="pg-view"></div><nav class="pg-nav">' + P.map(function (p, i) { return '<button type="button" data-i="' + i + '">' + I(p[2]) + p[0] + '</button>'; }).join('') + '</nav></div></div>';
    var view = $('.pg-view', k.el), mode = 'slide', cur = 0, hold = 0;
    function go(i) {
      var old = $('.pg-p', view), d = i >= cur ? 1 : -1; cur = i;
      $$('.pg-nav button', k.el).forEach(function (b, j) { b.classList.toggle('on', j === i); });
      var p = document.createElement('div'); p.className = 'pg-p in ' + mode; p.style.setProperty('--d', d);
      p.innerHTML = '<span>' + I(P[i][2]) + '</span><b>' + P[i][0] + '</b><p>' + P[i][1] + '</p>';
      if (old) { old.className = 'pg-p out ' + mode; old.style.setProperty('--d', d); k.later(function () { old.remove(); }, 450); }
      view.appendChild(p);
    }
    onSeg(k, k.el, '.pg-m', function (v) { hold = Date.now(); mode = v; go((cur + 1) % 3); });
    k.on(k.el, 'click', function (e) { var b = e.target.closest('.pg-nav button'); if (b) { hold = Date.now(); go(+b.getAttribute('data-i')); } });
    go(0);
    var M = ['fade', 'slide', 'zoom', 'wipe'], m = 1, n = 0;
    k.every(function () { if (Date.now() - hold < 5000) return; if (++n % 3 === 0) { m = (m + 1) % 4; mode = M[m]; setSeg(k.el, '.pg-m', mode); } go((cur + 1) % 3); }, 1500);
  };
  MO.loader = function (k) {
    k.el.innerHTML = '<div class="pv pv-mo"><div class="ld-grid"><div class="ld"><i class="ld-ring"></i><span>Spinner</span></div><div class="ld"><i class="ld-dots"><b></b><b></b><b></b></i><span>Dots</span></div><div class="ld"><i class="ld-bar"><b></b></i><span>Indeterminate</span></div>' +
      '<div class="ld"><svg class="ld-prog" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16"/><circle class="v" cx="20" cy="20" r="16"/></svg><em class="ld-pc">0%</em><span>Progress</span></div><div class="ld"><i class="ld-sk"><b></b><b></b></i><span>Skeleton</span></div><div class="ld"><i class="ld-pulse"></i><span>Pulse</span></div></div><div class="pv-note">Known length? Show progress. Unknown? A spinner. Content coming? A skeleton.</div></div>';
    var p = 0, c = $('.ld-prog .v', k.el), t = $('.ld-pc', k.el);
    k.every(function () { p = p >= 100 ? 0 : Math.min(100, p + rnd(3, 11)); c.style.strokeDashoffset = 100.5 - p / 100 * 100.5; t.textContent = Math.round(p) + '%'; }, 220);
  };
  PV.motion = function (k, c) { (MO[c.demo] || MO.ease)(k); };

  /* ================= APIs ================= */
  PV.rest = function (k) {
    var db = [{ id: 1, name: 'Keyboard', price: 129 }, { id: 2, name: 'Mouse', price: 49 }], nid = 3;
    var A = [
      ['GET', '/api/products', null, function () { return [200, db]; }],
      ['GET', '/api/products/1', null, function () { return [200, db[0] || null]; }],
      ['POST', '/api/products', { name: 'Webcam', price: 69 }, function (b) { var r = { id: nid++, name: b.name, price: b.price }; db.push(r); return [201, r, r.id]; }],
      ['PATCH', '/api/products/2', { price: 39 }, function (b) { var r = db.filter(function (x) { return x.id === 2; })[0]; if (!r) return [404, { error: 'Not found' }]; r.price = b.price; return [200, r, 2]; }],
      ['DELETE', '/api/products/3', null, function () { var i = db.findIndex(function (x) { return x.id === 3; }); if (i < 0) return [404, { error: 'Not found' }]; db.splice(i, 1); return [204, null]; }]
    ];
    k.el.innerHTML = '<div class="pv pv-rest"><div class="rs-acts">' + A.map(function (a, i) { return '<button type="button" class="rs-a m-' + a[0] + '" data-i="' + i + '"><b>' + a[0] + '</b>' + a[1].replace('/api', '') + '</button>'; }).join('') + '</div>' +
      '<div class="rs-2"><div class="rs-req"><small>Request</small><pre class="pv-code"><code></code></pre></div><div class="rs-res"><small>Response <em class="rs-st"></em></small><pre class="pv-code"><code></code></pre></div></div>' +
      '<div class="rs-db"><small>' + I('database') + ' products table</small><div class="rs-rows"></div></div><button type="button" class="pv-btn sm rs-reset">' + I('refresh') + ' Reset data</button></div>';
    var cur = 0, hold = 0;
    function rows(hit) { $('.rs-rows', k.el).innerHTML = db.map(function (r) { return '<div class="rs-r' + (r.id === hit ? ' hit' : '') + '"><span>#' + r.id + '</span><b>' + r.name + '</b><em>$' + r.price + '</em></div>'; }).join('') || '<div class="rs-r"><span>empty</span></div>'; }
    function run(i) {
      cur = i; var a = A[i], r = a[3](a[2]);
      $$('.rs-a', k.el).forEach(function (b, j) { b.classList.toggle('on', j === i); });
      $('.rs-req code', k.el).innerHTML = hl(a[0] + ' ' + a[1] + ' HTTP/1.1\nHost: shop.xiraiya.dev\nAuthorization: Bearer eyJhbGci…' + (a[2] ? '\nContent-Type: application/json\n\n' + JSON.stringify(a[2], null, 2) : ''), 'http');
      var st = $('.rs-st', k.el); st.textContent = r[0] + ' ' + { 200: 'OK', 201: 'Created', 204: 'No Content', 404: 'Not Found' }[r[0]]; st.className = 'rs-st s' + String(r[0])[0];
      $('.rs-res code', k.el).innerHTML = r[1] == null ? '<i class="h-c">(empty body)</i>' : hl(JSON.stringify(r[1], null, 2), 'js');
      bump($('.rs-res', k.el), 'in');
      rows(r[2] || (a[1].match(/\d+$/) ? +a[1].match(/\d+$/)[0] : 0));
    }
    k.on(k.el, 'click', function (e) {
      var b = e.target.closest('.rs-a'); if (b) { hold = Date.now(); run(+b.getAttribute('data-i')); }
      if (e.target.closest('.rs-reset')) { hold = Date.now(); db = [{ id: 1, name: 'Keyboard', price: 129 }, { id: 2, name: 'Mouse', price: 49 }]; nid = 3; rows(0); }
    });
    run(0);
    k.every(function () { if (Date.now() - hold < 6000) return; var n = (cur + 1) % A.length; if (n === 0) { db = [{ id: 1, name: 'Keyboard', price: 129 }, { id: 2, name: 'Mouse', price: 49 }]; nid = 3; } run(n); }, 3600);
  };

  function b64u(s) { return btoa(unescape(encodeURIComponent(s))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); }
  function hmac(algo, keyBytes, msgBytes) {
    if (!(window.crypto && crypto.subtle)) return Promise.resolve(null);
    return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: algo }, false, ['sign']).then(function (key) { return crypto.subtle.sign('HMAC', key, msgBytes); }).then(function (b) { return new Uint8Array(b); });
  }
  var enc = function (s) { return new TextEncoder().encode(s); };
  PV.jwt = function (k) {
    var head = { alg: 'HS256', typ: 'JWT' }, SECRET = 'server-only-secret';
    k.el.innerHTML = '<div class="pv pv-jwt"><div class="pv-row pv-center">' + seg([['ok', 'Real token'], ['tamper', 'Hacker edits role']], 'ok', 'jw-m') + '</div><div class="jw-tok"></div>' +
      '<div class="jw-parts"><div><small class="jw-h">Header</small><pre class="pv-code jw-hd"></pre></div><div><small class="jw-p">Payload</small><pre class="pv-code jw-pl"></pre></div><div><small class="jw-s">Signature</small><pre class="pv-code jw-sg">HMACSHA256(\n  header + "." + payload,\n  secret)</pre></div></div><div class="jw-ver"></div></div>';
    var gen = 0;
    function show(mode) {
      var g = ++gen;
      var pay = { sub: '4822', name: 'Nusrat', role: 'user', exp: 1767225600 };
      var h = b64u(JSON.stringify(head)), p = b64u(JSON.stringify(pay));
      hmac('SHA-256', enc(SECRET), enc(h + '.' + p)).then(function (sig) {
        if (g !== gen) return;
        var s = sig ? btoa(String.fromCharCode.apply(null, sig)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_') : 'Xb3x9QkT1n0sR-demo-signature_Aq';
        var pl = pay, p2 = p;
        if (mode === 'tamper') { pl = JSON.parse(JSON.stringify(pay)); pl.role = 'admin'; p2 = b64u(JSON.stringify(pl)); }
        $('.jw-tok', k.el).innerHTML = '<span class="h">' + h + '</span>.<span class="p' + (mode === 'tamper' ? ' bad' : '') + '">' + p2 + '</span>.<span class="s">' + s + '</span>';
        $('.jw-hd', k.el).innerHTML = hl(JSON.stringify(head, null, 2), 'js');
        $('.jw-pl', k.el).innerHTML = hl(JSON.stringify(pl, null, 2), 'js').replace('&quot;admin&quot;', '<mark>&quot;admin&quot;</mark>');
        var v = $('.jw-ver', k.el);
        v.className = 'jw-ver ' + (mode === 'tamper' ? 'bad' : 'ok');
        v.innerHTML = mode === 'tamper' ? I('alert') + '<b>401 — signature does not match.</b> The hacker changed the payload but cannot re-sign without the server secret.' : I('check') + '<b>Signature valid.</b> The server trusts this token: user 4822, role user.';
        bump(v, 'in');
      });
    }
    autoSeg(k, '.jw-m', ['ok', 'tamper'], show, 3600);
  };
  PV.ws = function (k) {
    var S = [['a', 'Hey! Is the Kage 75 in stock?'], ['b', 'Yes, 4 left'], ['a', 'Order placed!'], ['b', 'Shipping today']];
    k.el.innerHTML = '<div class="pv pv-ws"><div class="ws-c a"><small>' + I('phone') + ' You</small><div class="ws-msgs"></div><form class="ws-f"><input placeholder="Say something" aria-label="Message"><button type="submit" aria-label="Send">' + I('send') + '</button></form></div>' +
      '<div class="ws-mid"><span class="ws-srv">' + I('server') + '<small>server</small></span><i class="ws-pipe"><b class="ws-pk"></b></i><em>one open connection</em></div>' +
      '<div class="ws-c b"><small>' + I('user') + ' Shop</small><div class="ws-msgs"></div></div></div>';
    var n = 0, user = 0;
    function send(who, text) {
      var pk = $('.ws-pk', k.el); pk.className = 'ws-pk go-' + who; void pk.offsetWidth; pk.classList.add('run');
      function add(side, mine) { var m = $('.ws-c.' + side + ' .ws-msgs', k.el), d = document.createElement('p'); d.className = mine ? 'me' : ''; d.textContent = text; m.appendChild(d); while (m.children.length > 4) m.firstChild.remove(); }
      add(who, true);
      k.later(function () { add(who === 'a' ? 'b' : 'a', false); }, 520);
    }
    k.on($('.ws-f', k.el), 'submit', function (e) { e.preventDefault(); var i = $('.ws-f input', k.el); if (i.value.trim()) { user = Date.now(); send('a', i.value.trim()); i.value = ''; } });
    k.every(function () { if (Date.now() - user > 5000) { var s = S[n++ % S.length]; send(s[0], s[1]); } }, 1500);
  };

  /* ================= Attacks (all simulated, nothing real is sent) ================= */
  var AT = {};
  AT.rate = function (k) {
    var CAP = 5, tokens = CAP;
    k.el.innerHTML = '<div class="pv pv-atk"><div class="rl-top"><div class="rl-bucket"><small>Token bucket · refills 1 / second</small><div class="rl-tk">' + '<i></i>'.repeat(CAP) + '</div></div><div class="rl-btns"><button type="button" class="pv-btn sm rl-1">' + I('send') + ' 1 request</button><button type="button" class="pv-btn sm primary rl-20">' + I('zap') + ' Spam 20</button></div></div><ol class="pv-log rl-log"></ol><div class="rl-sum"><span class="ok">0 × 200</span><span class="bad">0 × 429</span></div></div>';
    var ok = 0, bad = 0, n = 0, hold = 0;
    function draw() { $$('.rl-tk i', k.el).forEach(function (t, i) { t.classList.toggle('on', i < tokens); }); $('.rl-sum .ok', k.el).textContent = ok + ' × 200 OK'; $('.rl-sum .bad', k.el).textContent = bad + ' × 429 Too Many'; }
    function req() {
      n++;
      if (tokens >= 1) { tokens--; ok++; logLine($('.rl-log', k.el), '<code>#' + n + '</code><span class="ok">200 OK</span><span>token used</span>', '', 6); }
      else { bad++; logLine($('.rl-log', k.el), '<code>#' + n + '</code><span class="bad">429 Too Many Requests</span><span>Retry-After: 1</span>', 'bad', 6); }
      draw();
    }
    k.on(k.el, 'click', function (e) {
      if (e.target.closest('.rl-1')) { hold = Date.now(); req(); }
      if (e.target.closest('.rl-20')) { hold = Date.now(); for (var i = 0; i < 20; i++) k.later(req, i * 60); }
    });
    k.every(function () { if (tokens < CAP) { tokens++; draw(); } }, 1000);
    k.every(function () { if (Date.now() - hold > 6000) for (var i = 0; i < 9; i++) k.later(req, i * 90); }, 5200);
    draw(); k.later(function () { for (var i = 0; i < 9; i++) k.later(req, i * 90); }, 300);
  };
  AT.sqli = function (k) {
    k.el.innerHTML = '<div class="pv pv-atk"><div class="pv-row pv-center">' + seg([['bad', 'String glued together'], ['ok', 'Prepared statement']], 'bad', 'at-m') + '</div>' +
      '<div class="sq-login"><label><span>Username</span><input class="sq-u" value="admin\' --" spellcheck="false"></label><label><span>Password</span><input class="sq-p" value="anything" spellcheck="false"></label></div>' +
      '<small class="at-lb">What the server runs</small><pre class="pv-code sq-q"></pre><div class="at-res"></div></div>';
    var mode = 'bad';
    function run() {
      var u = $('.sq-u', k.el).value, p = $('.sq-p', k.el).value, q = $('.sq-q', k.el), r = $('.at-res', k.el), inj = /'/.test(u);
      if (mode === 'bad') {
        var m = u.match(/^([^']*)'(.*)$/);
        q.innerHTML = '<i class="h-k">SELECT</i> * <i class="h-k">FROM</i> users<br><i class="h-k">WHERE</i> name = <i class="h-s">\'' + esc(m ? m[1] : u) + (m ? '\'</i><mark>' + esc(m[2]) + '</mark>' : '\'</i>') + (m && /--/.test(m[2]) ? '<s>\' AND pass = \'' + esc(p) + '\'</s>' : ' <i class="h-k">AND</i> pass = <i class="h-s">\'' + esc(p) + '\'</i>');
        r.className = 'at-res ' + (inj ? 'bad' : 'ok');
        r.innerHTML = inj ? I('alert') + '<b>Logged in as admin — no password needed.</b> The quote closed the string and <code>--</code> commented out the password check.' : I('info') + 'Normal input. Still unsafe: one quote away from a breach.';
      } else {
        q.innerHTML = hl('SELECT * FROM users\nWHERE name = ? AND pass = ?', 'sql') + '<br><i class="h-c">-- params: ' + esc(JSON.stringify([u, p])) + '</i>';
        r.className = 'at-res ok';
        r.innerHTML = I('shield') + '<b>No user found.</b> The input is only ever treated as data, never as SQL.';
      }
      bump(r, 'in');
    }
    k.on(k.el, 'input', run);
    autoSeg(k, '.at-m', ['bad', 'ok'], function (v) { mode = v; run(); }, 3600);
  };
  AT.xss = function (k) {
    k.el.innerHTML = '<div class="pv pv-atk"><div class="pv-row pv-center">' + seg([['bad', 'innerHTML'], ['ok', 'textContent / escaped']], 'bad', 'at-m') + '</div>' +
      '<label class="xs-in"><span>New comment</span><textarea rows="2" spellcheck="false">Nice shop! &lt;img src=x onerror="stealCookies()"&gt;</textarea></label>' +
      '<pre class="pv-code xs-code"></pre><div class="xs-page"><small>' + I('window') + ' Comments</small><div class="xs-c"><b>Rafi</b><div class="xs-body"></div></div><div class="xs-pop">' + I('alert') + ' <b>Script ran: stealCookies()</b><span>Attacker now has the session of everyone who reads this comment.</span></div></div></div>';
    var mode = 'bad';
    function run() {
      var v = $('textarea', k.el).value, pg = $('.xs-page', k.el), body = $('.xs-body', k.el), evil = /<\s*(script|img|svg|iframe)|on\w+\s*=/i.test(v);
      $('.xs-code', k.el).innerHTML = hl(mode === 'bad' ? 'comment.innerHTML = userInput;  // danger' : 'comment.textContent = userInput; // safe', 'js');
      if (mode === 'bad') {
        /* Simulated: show what the browser would do, without running anything. */
        body.innerHTML = esc(v.replace(/<[^>]*>/g, '')) + (evil ? '<span class="xs-broken">' + I('image') + '</span>' : '');
        pg.classList.toggle('pwn', evil);
      } else { body.textContent = v; pg.classList.remove('pwn'); }
    }
    k.on($('textarea', k.el), 'input', run);
    autoSeg(k, '.at-m', ['bad', 'ok'], function (v) { mode = v; run(); }, 3600);
  };
  AT.csrf = function (k) {
    k.el.innerHTML = '<div class="pv pv-atk"><div class="pv-row pv-center">' + seg([['bad', 'No protection'], ['ok', 'SameSite + CSRF token']], 'bad', 'at-m') + '</div>' +
      '<div class="cf-2"><div class="cf-w evil"><small>' + I('alert') + ' free-prizes.site</small><b>You won a phone!</b><button type="button" class="cf-claim">Claim prize</button><code>&lt;form action="bank.com/transfer"&gt;</code></div>' +
      '<i class="cf-arrow"><b class="cf-pk">POST /transfer<br>to=hacker&amp;amount=500<span class="cf-ck"></span></b></i>' +
      '<div class="cf-w bank"><small>' + I('lock') + ' bank.com · logged in</small><span>Balance</span><b class="cf-bal">$1,200</b><div class="cf-st"></div></div></div></div>';
    var mode = 'bad', bal = 1200;
    function fire() {
      var pk = $('.cf-pk', k.el), st = $('.cf-st', k.el);
      $('.cf-ck', k.el).textContent = mode === 'bad' ? ' + your session cookie' : ' (no cookie, no token)';
      st.textContent = ''; st.className = 'cf-st';
      bump($('.cf-claim', k.el), 'pop'); bump(pk, 'run');
      k.later(function () {
        if (mode === 'bad') { bal -= 500; if (bal < 0) bal = 1200; $('.cf-bal', k.el).textContent = '$' + bal.toLocaleString('en-US'); st.textContent = '$500 sent to hacker. The bank saw a valid cookie.'; st.className = 'cf-st bad'; }
        else { st.textContent = '403 Forbidden — missing CSRF token.'; st.className = 'cf-st ok'; }
        bump($('.cf-w.bank', k.el), 'hit');
      }, 1300);
    }
    k.on($('.cf-claim', k.el), 'click', fire);
    autoSeg(k, '.at-m', ['bad', 'ok'], function (v) { mode = v; bal = 1200; $('.cf-bal', k.el).textContent = '$1,200'; k.later(fire, 400); }, 3400);
  };
  AT.brute = function (k) {
    var WL = ['123456', 'password', 'qwerty', '111111', 'iloveyou', 'admin', 'letmein', 'dragon', 'sunshine', 'football', 'monkey', 'shadow'];
    k.el.innerHTML = '<div class="pv pv-atk"><div class="br-opts"><div><small>Password</small>' + seg([['sunshine', 'sunshine'], ['T7#qv!9Lm2@x', 'T7#qv!9Lm2@x']], 'sunshine', 'br-pw') + '</div><div><small>Defence</small>' + seg([['none', 'None'], ['lock', 'Lock after 5 tries']], 'none', 'br-def') + '</div></div>' +
      '<div class="br-scr"><div class="br-try"></div><div class="br-bar"><i></i></div></div><div class="at-res br-res"></div><div class="pv-note br-est"></div></div>';
    var pw = 'sunshine', def = 'none', gen = 0;
    function est(p) { var cs = (/[a-z]/.test(p) ? 26 : 0) + (/[A-Z]/.test(p) ? 26 : 0) + (/\d/.test(p) ? 10 : 0) + (/[^\w]/.test(p) ? 32 : 0), s = Math.pow(cs, p.length) / 1e10; return s < 1 ? 'instantly' : s < 3600 ? Math.round(s / 60) + ' minutes' : s < 31536000 ? Math.round(s / 86400) + ' days' : s < 3.15e10 ? Math.round(s / 31536000).toLocaleString('en-US') + ' years' : 'millions of years'; }
    function run() {
      var g = ++gen, i = 0, box = $('.br-try', k.el), res = $('.at-res', k.el), bar = $('.br-bar i', k.el);
      res.className = 'at-res'; res.innerHTML = ''; box.innerHTML = '';
      $('.br-est', k.el).innerHTML = 'A fast computer trying 10 billion guesses a second would crack <b>' + esc(pw) + '</b> ' + est(pw) + '.';
      (function t() {
        if (g !== gen || !k.alive()) return;
        var w = WL[i++], hit = w === pw;
        var s = document.createElement('span'); s.textContent = w; s.className = hit ? 'hit' : 'no'; box.appendChild(s); while (box.children.length > 6) box.firstChild.remove();
        bar.style.width = (i / WL.length * 100) + '%';
        if (hit) { res.className = 'at-res bad in'; res.innerHTML = I('alert') + '<b>Cracked in ' + i + ' tries.</b> “' + esc(pw) + '” is in every leaked-password list.'; return k.later(run, 3000); }
        if (def === 'lock' && i >= 5) { res.className = 'at-res ok in'; res.innerHTML = I('lock') + '<b>Account locked after 5 tries.</b> The attacker must wait 15 minutes per 5 guesses.'; return k.later(run, 3000); }
        if (i >= WL.length) { res.className = 'at-res ok in'; res.innerHTML = I('shield') + '<b>Not in the list.</b> Long random passwords beat wordlists.'; return k.later(run, 3000); }
        k.later(t, 260);
      })();
    }
    onSeg(k, k.el, '.br-pw', function (v) { pw = v; run(); });
    onSeg(k, k.el, '.br-def', function (v) { def = v; run(); });
    run();
  };
  AT.ddos = function (k) {
    k.el.innerHTML = '<div class="pv pv-atk"><div class="pv-row pv-center">' + seg([['bad', 'Server alone'], ['ok', 'Behind a CDN / WAF']], 'bad', 'at-m') + '</div>' +
      '<div class="dd-field"><div class="dd-src">' + '<i class="dd-b"></i>'.repeat(18) + '<i class="dd-u"></i><i class="dd-u"></i></div><div class="dd-shield">' + I('shield') + '<small>CDN</small></div><div class="dd-srv">' + I('server') + '<small class="dd-state">online</small></div></div>' +
      '<div class="dd-meter"><span>Server load</span><div><i></i></div><b>0%</b></div><div class="pv-note dd-say"></div></div>';
    var mode = 'bad', load = 10, f = $('.dd-field', k.el);
    $$('.dd-src i', k.el).forEach(function (d) { d.style.setProperty('--y', rnd(6, 94).toFixed(0) + '%'); d.style.setProperty('--dl', rnd(0, 1.6).toFixed(2) + 's'); d.style.setProperty('--sp', rnd(0.9, 1.5).toFixed(2) + 's'); });
    k.every(function () {
      load += mode === 'bad' ? rnd(6, 14) : -rnd(4, 10); load = Math.max(12, Math.min(100, load)); if (mode === 'ok') load = Math.max(14, Math.min(load, 28));
      $('.dd-meter i', k.el).style.width = load + '%'; $('.dd-meter b', k.el).textContent = Math.round(load) + '%';
      $('.dd-meter', k.el).className = 'dd-meter ' + (load > 85 ? 'bad' : load > 55 ? 'mid' : 'ok');
      var down = load >= 99; f.classList.toggle('down', down);
      $('.dd-state', k.el).textContent = down ? '503 down' : 'online';
    }, 350);
    autoSeg(k, '.at-m', ['bad', 'ok'], function (v) {
      mode = v; f.className = 'dd-field ' + v; if (v === 'bad') load = 20;
      $('.dd-say', k.el).textContent = v === 'bad' ? 'Thousands of bots flood one server. Real customers (green) can’t get in.' : 'The CDN soaks up the flood at its edge and only real visitors reach your server.';
    }, 5200);
  };
  AT.phish = function (k) {
    var L = [['https://paypal.com/signin', 1], ['https://paypa1.com/signin', 0], ['https://accounts.google.com', 1], ['https://google.com.secure-check.io/login', 0], ['https://xiraiya.dev/hire', 1], ['https://xiraiya-dev.support-login.ru', 0]];
    k.el.innerHTML = '<div class="pv pv-atk"><div class="ph-mail"><div class="ph-h"><span class="ph-av">' + I('mail') + '</span><div><b>Security Team</b><small>no-reply@account-alerts.co</small></div></div><p>Your account will be <b>locked in 24 hours</b>. Confirm your details now:</p><a class="ph-link" href="#" onclick="return false"></a></div>' +
      '<div class="ph-q"><span>Is this link safe?</span><button type="button" class="pv-btn sm ph-y" data-a="1">' + I('check') + ' Safe</button><button type="button" class="pv-btn sm ph-n" data-a="0">' + I('alert') + ' Phishing</button></div>' +
      '<div class="at-res ph-res"></div><div class="ph-score pv-note"></div></div>';
    var i = 0, score = 0, seen = 0, hold = 0, lock = false;
    function real(u) { var h = u.replace(/^https?:\/\//, '').split('/')[0].split('.'); return h.slice(-2).join('.'); }
    function show() { lock = false; var u = L[i % L.length][0]; $('.ph-link', k.el).textContent = u; $('.ph-res', k.el).className = 'at-res ph-res'; $('.ph-res', k.el).innerHTML = ''; }
    function answer(a) {
      if (lock) return; lock = true;
      var it = L[i % L.length], right = +a === it[1]; seen++; if (right) score++;
      var r = $('.ph-res', k.el);
      r.className = 'at-res ph-res in ' + (it[1] ? 'ok' : 'bad');
      r.innerHTML = (it[1] ? I('check') : I('alert')) + '<b>' + (right ? 'Correct. ' : 'Not quite. ') + '</b>The real domain is <code>' + real(it[0]) + '</code>' + (it[1] ? ' — the genuine site.' : ' — not the brand. Read the domain right before the first “/”.');
      $('.ph-score', k.el).textContent = 'Score ' + score + ' / ' + seen;
      k.later(function () { i++; show(); }, 2600);
    }
    k.on(k.el, 'click', function (e) { var b = e.target.closest('[data-a]'); if (b) { hold = Date.now(); answer(b.getAttribute('data-a')); } });
    show();
    k.every(function () { if (Date.now() - hold > 8000 && !lock) { var it = L[i % L.length]; answer(String(it[1])); } }, 4200);
  };
  PV.atk = function (k, c) { (AT[c.demo] || AT.rate)(k); };

  /* ================= Databases ================= */
  var USERS = [[1, 'Nusrat', 'Dhaka', 24], [2, 'Rafi', 'Rajshahi', 29], [3, 'Tanvir', 'Dhaka', 31], [4, 'Mim', 'Khulna', 22], [5, 'Arif', 'Rajshahi', 35]];
  var ORDERS = [[101, 1, 'Keyboard', 129], [102, 3, 'Mouse', 49], [103, 1, 'Monitor', 219], [104, 2, 'Webcam', 69], [105, 5, 'Headset', 89], [106, 3, 'Keyboard', 129]];
  var UC = ['id', 'name', 'city', 'age'], OC = ['id', 'user_id', 'item', 'total'];
  function uname(id, u) { var r = u.filter(function (x) { return x[0] === id; })[0]; return r ? r[1] : '?'; }
  var Q = {
    all: ['SELECT * FROM users;', function (u) { return { cols: UC, rows: u, hit: u.map(function (r) { return r[0]; }) }; }],
    cols: ['SELECT name, city FROM users;', function (u) { return { cols: ['name', 'city'], rows: u.map(function (r) { return [r[1], r[2]]; }), hit: u.map(function (r) { return r[0]; }) }; }],
    where: ["SELECT * FROM users\nWHERE city = 'Dhaka';", function (u) { var r = u.filter(function (x) { return x[2] === 'Dhaka'; }); return { cols: UC, rows: r, hit: r.map(function (x) { return x[0]; }) }; }],
    like: ["SELECT name, city FROM users\nWHERE name LIKE 'R%' OR age > 30;", function (u) { var r = u.filter(function (x) { return /^R/.test(x[1]) || x[3] > 30; }); return { cols: ['name', 'city'], rows: r.map(function (x) { return [x[1], x[2]]; }), hit: r.map(function (x) { return x[0]; }) }; }],
    order: ['SELECT name, age FROM users\nORDER BY age DESC\nLIMIT 3;', function (u) { var r = u.slice().sort(function (a, b) { return b[3] - a[3]; }).slice(0, 3); return { cols: ['name', 'age'], rows: r.map(function (x) { return [x[1], x[3]]; }), hit: r.map(function (x) { return x[0]; }) }; }],
    insert: ["INSERT INTO users (name, city, age)\nVALUES ('Sadia', 'Sylhet', 27);", function (u) { var id = Math.max.apply(null, u.map(function (x) { return x[0]; }).concat(0)) + 1; u.push([id, 'Sadia', 'Sylhet', 27]); return { cols: UC, rows: u, hit: [id], msg: '1 row inserted (id ' + id + ')' }; }],
    update: ["UPDATE users SET city = 'Dhaka'\nWHERE id = 4;", function (u) { u.forEach(function (x) { if (x[0] === 4) x[2] = 'Dhaka'; }); return { cols: UC, rows: u, hit: [4], msg: '1 row updated' }; }],
    delete: ['DELETE FROM users\nWHERE id = 5;', function (u) { var n = u.length; for (var i = u.length - 1; i >= 0; i--) if (u[i][0] === 5) u.splice(i, 1); return { cols: UC, rows: u, hit: [], msg: (n - u.length) + ' row deleted' }; }],
    join: ['SELECT users.name, orders.item, orders.total\nFROM orders\nJOIN users ON users.id = orders.user_id;', function (u) { return { cols: ['name', 'item', 'total'], rows: ORDERS.map(function (o) { return [uname(o[1], u), o[2], o[3]]; }), hit: ORDERS.map(function (o) { return o[1]; }), orders: 1 }; }],
    group: ['SELECT users.name, COUNT(*) AS orders,\n       SUM(orders.total) AS spent\nFROM orders JOIN users ON users.id = orders.user_id\nGROUP BY users.name;', function (u) { var g = {}; ORDERS.forEach(function (o) { var n = uname(o[1], u); g[n] = g[n] || [n, 0, 0]; g[n][1]++; g[n][2] += o[3]; }); return { cols: ['name', 'orders', 'spent'], rows: Object.keys(g).map(function (x) { return g[x]; }), hit: ORDERS.map(function (o) { return o[1]; }), orders: 1 }; }]
  };
  function table(cols, rows, hitCol, hits, cls) {
    return '<table class="sq-t ' + (cls || '') + '"><thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r, i) { return '<tr style="--i:' + i + '"' + (hits && hits.indexOf(r[hitCol]) > -1 ? ' class="hit"' : '') + '>' + r.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  PV.sql = function (k, c) {
    var mine = c.q || ['all'], keys = mine.concat(Object.keys(Q).filter(function (x) { return mine.indexOf(x) < 0; }));
    var users = USERS.map(function (r) { return r.slice(); });
    k.el.innerHTML = '<div class="pv pv-sql"><div class="sq-ops">' + keys.map(function (x) { return '<button type="button" class="pv-chip' + (mine.indexOf(x) > -1 ? ' main' : '') + '" data-q="' + x + '">' + Q[x][0].split(/\s/)[0] + ' · ' + x + '</button>'; }).join('') + '</div>' +
      '<div class="sq-ed"><div class="cb-bar"><i></i><i></i><i></i><span>MySQL · shop_db</span><button type="button" class="pv-btn sm sq-run">' + I('play') + ' Run</button></div><pre class="pv-code sq-code"></pre></div>' +
      '<div class="sq-2"><div><small class="sq-lb">' + I('database') + ' users</small><div class="sq-src"></div><div class="sq-ord"></div></div><div><small class="sq-lb">' + I('filter') + ' Result <em class="sq-msg"></em></small><div class="sq-res"></div></div></div>' +
      '<button type="button" class="pv-btn sm sq-reset">' + I('refresh') + ' Reset tables</button></div>';
    var cur = mine[0], hold = 0, ai = 0;
    function src(hits, ord) {
      $('.sq-src', k.el).innerHTML = table(UC, users, 0, hits);
      $('.sq-ord', k.el).innerHTML = ord ? '<small class="sq-lb">' + I('database') + ' orders</small>' + table(OC, ORDERS, 1, hits, 'small') : '';
    }
    function load(q) {
      cur = q;
      $$('.sq-ops button', k.el).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-q') === q); });
      $('.sq-code', k.el).innerHTML = hl(Q[q][0], 'sql');
      $('.sq-res', k.el).innerHTML = '<div class="sq-wait">Press Run</div>'; $('.sq-msg', k.el).textContent = '';
      src([], /join|group/.test(q));
    }
    function run() {
      var r = Q[cur][1](users);
      src(r.hit, r.orders);
      $('.sq-res', k.el).innerHTML = table(r.cols, r.rows, -1, null, 'res');
      $('.sq-msg', k.el).textContent = r.msg || r.rows.length + ' row' + (r.rows.length === 1 ? '' : 's') + ' · 0.00' + (1 + Math.floor(Math.random() * 8)) + 's';
      if (r.msg) { $$('.sq-res tr', k.el).forEach(function (tr) { if (r.hit.indexOf(+tr.firstChild.textContent) > -1) tr.classList.add('hit'); }); }
    }
    k.on(k.el, 'click', function (e) {
      var b = e.target.closest('[data-q]'); if (b) { hold = Date.now(); load(b.getAttribute('data-q')); k.later(run, 350); }
      if (e.target.closest('.sq-run')) { hold = Date.now(); run(); }
      if (e.target.closest('.sq-reset')) { hold = Date.now(); users = USERS.map(function (r) { return r.slice(); }); load(cur); }
    });
    load(cur); k.later(run, 700);
    k.every(function () { if (Date.now() - hold < 7000) return; ai = (ai + 1) % mine.length; if (ai === 0 && mine.length > 1) users = USERS.map(function (r) { return r.slice(); }); load(mine[ai]); k.later(run, 600); }, 3400);
  };
  PV.index = function (k) {
    var N = 64, target = 47;
    k.el.innerHTML = '<div class="pv pv-idx"><div class="pv-row pv-center">' + seg([['scan', 'Without index (full scan)'], ['idx', 'With index (B-tree)']], 'scan', 'ix-m') + '</div><code class="ix-q">SELECT * FROM users WHERE id = ' + target + ';</code>' +
      '<div class="ix-grid">' + Array.from({ length: N }, function (_, i) { return '<i>' + (i + 1) + '</i>'; }).join('') + '</div><div class="ix-stat"><b class="ix-n">0</b> rows checked<span class="ix-big"></span></div></div>';
    var cells = $$('.ix-grid i', k.el), gen = 0;
    function run(m) {
      var g = ++gen, n = 0;
      cells.forEach(function (c) { c.className = ''; });
      $('.ix-big', k.el).textContent = m === 'scan' ? 'With 1,000,000 rows: up to 1,000,000 checks' : 'With 1,000,000 rows: about 20 checks';
      if (m === 'scan') {
        (function t(i) { if (g !== gen || !k.alive()) return; cells[i].className = 'seen'; n++; $('.ix-n', k.el).textContent = n; if (i + 1 === target) { cells[i].className = 'found'; return; } k.later(function () { t(i + 1); }, 45); })(0);
      } else {
        var lo = 1, hi = N;
        (function t() {
          if (g !== gen || !k.alive()) return;
          var mid = Math.floor((lo + hi) / 2); n++; $('.ix-n', k.el).textContent = n;
          cells.forEach(function (c, i) { var v = i + 1; if (v < lo || v > hi) c.className = 'out'; });
          cells[mid - 1].className = 'seen';
          if (mid === target) { cells[mid - 1].className = 'found'; return; }
          if (mid < target) lo = mid + 1; else hi = mid - 1;
          k.later(t, 520);
        })();
      }
    }
    autoSeg(k, '.ix-m', ['scan', 'idx'], run, 4800);
  };
  PV.txn = function (k) {
    var SQL = ['BEGIN;', "UPDATE accounts SET balance = balance - 100\n  WHERE name = 'Alice';", "UPDATE accounts SET balance = balance + 100\n  WHERE name = 'Bob';", 'COMMIT;'];
    k.el.innerHTML = '<div class="pv pv-txn"><div class="pv-row pv-center">' + seg([['ok', 'All goes well'], ['crash', 'Crash + transaction'], ['raw', 'Crash, no transaction']], 'ok', 'tx-m') + '</div>' +
      '<div class="tx-2"><ol class="tx-sql">' + SQL.map(function (s) { return '<li><pre>' + hl(s, 'sql') + '</pre></li>'; }).join('') + '</ol><div class="tx-acc"><div class="tx-a"><span>' + I('user') + ' Alice</span><b data-a="0">$500</b></div><div class="tx-a"><span>' + I('user') + ' Bob</span><b data-a="1">$200</b></div><div class="tx-tot">Total money: <b>$700</b></div></div></div><div class="at-res tx-res"></div></div>';
    var gen = 0;
    function set(a, b) { var e = $$('.tx-acc b[data-a]', k.el); e[0].textContent = '$' + a; e[1].textContent = '$' + b; $('.tx-tot b', k.el).textContent = '$' + (a + b); $('.tx-tot', k.el).className = 'tx-tot' + (a + b !== 700 ? ' bad' : ''); e.forEach(function (x) { bump(x, 'flash'); }); }
    function run(m) {
      var g = ++gen, li = $$('.tx-sql li', k.el), res = $('.tx-res', k.el);
      li.forEach(function (l) { l.className = ''; }); res.className = 'at-res tx-res'; res.innerHTML = ''; set(500, 200);
      $$('.tx-sql li', k.el)[0].style.opacity = m === 'raw' ? 0.3 : ''; li[3].style.opacity = m === 'raw' ? 0.3 : '';
      var steps = [
        function () { li[0].className = 'on'; },
        function () { li[0].className = 'done'; li[1].className = 'on'; set(400, 200); },
        function () {
          li[1].className = 'done';
          if (m === 'ok') { li[2].className = 'on'; set(400, 300); return; }
          li[2].className = 'crash'; res.className = 'at-res bad in'; res.innerHTML = I('zap') + '<b>Power cut!</b> The server died between the two updates.';
        },
        function () {
          if (m === 'ok') { li[2].className = 'done'; li[3].className = 'on'; res.className = 'at-res ok in'; res.innerHTML = I('check') + '<b>COMMIT.</b> Both changes saved together. Money is never lost.'; return; }
          if (m === 'crash') { li.forEach(function (l) { l.className = 'rolled'; }); set(500, 200); res.className = 'at-res ok in'; res.innerHTML = I('refresh') + '<b>ROLLBACK.</b> On restart the database undoes the half-done transfer. Alice still has $500.'; }
          else { res.className = 'at-res bad in'; res.innerHTML = I('alert') + '<b>$100 vanished.</b> Alice was charged, Bob never got it. That is why money moves inside a transaction.'; }
        }
      ];
      steps.forEach(function (f, i) { k.later(function () { if (g === gen) f(); }, 500 + i * 1100); });
    }
    autoSeg(k, '.tx-m', ['ok', 'crash', 'raw'], run, 6000);
  };

  /* ================= Security: hashing and 2FA ================= */
  function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
  function sha256(s) { return window.crypto && crypto.subtle ? crypto.subtle.digest('SHA-256', enc(s)).then(hex) : Promise.resolve(null); }
  PV.hash = function (k) {
    var LEAK = ['123456', 'password', 'sunshine', 'qwerty', 'iloveyou', 'admin', 'dragon'];
    k.el.innerHTML = '<div class="pv pv-hash"><label class="hs-in"><span>Password</span><input value="sunshine" spellcheck="false" aria-label="Password to hash"></label>' +
      '<div class="pv-row pv-center">' + seg([['no', 'No salt'], ['salt', 'With random salt']], 'no', 'hs-m') + '</div>' +
      '<div class="hs-flow"><code class="hs-a"></code><span class="hs-fn">SHA-256 ' + I('arrow-right') + '</span><code class="hs-h"></code></div>' +
      '<div class="hs-db"><small>' + I('database') + ' What the database stores</small><code class="hs-row"></code></div><div class="at-res hs-res"></div>' +
      '<div class="pv-note">Change one letter and the whole hash changes. Real apps use bcrypt or Argon2, which are slow on purpose.</div></div>';
    var mode = 'no', salt = '', prev = '', gen = 0;
    function newSalt() { var a = new Uint8Array(6); crypto.getRandomValues(a); salt = hex(a); }
    function run() {
      var g = ++gen, p = $('input', k.el).value, input = mode === 'salt' ? salt + p : p;
      $('.hs-a', k.el).innerHTML = mode === 'salt' ? '<mark>' + salt + '</mark>' + esc(p) : esc(p) || '(empty)';
      sha256(input).then(function (h) {
        if (g !== gen) return;
        if (!h) { $('.hs-h', k.el).textContent = 'Needs HTTPS to compute'; return; }
        $('.hs-h', k.el).innerHTML = h.split('').map(function (c, i) { return prev && prev[i] !== c ? '<b>' + c + '</b>' : c; }).join('');
        prev = h;
        $('.hs-row', k.el).textContent = 'nusrat | ' + (mode === 'salt' ? salt + ':' : '') + h.slice(0, 24) + '…';
        var r = $('.hs-res', k.el), leaked = LEAK.indexOf(p) > -1 && mode === 'no';
        r.className = 'at-res hs-res in ' + (leaked ? 'bad' : 'ok');
        r.innerHTML = leaked ? I('alert') + '<b>Found in a rainbow table:</b> this hash is “' + esc(p) + '”. Same password, same hash, everywhere.' : I('shield') + (mode === 'salt' ? '<b>Salted.</b> Even two users with the same password get different hashes, so lookup tables are useless.' : '<b>Not in the leaked table.</b> But without salt, common passwords are found instantly.');
      });
    }
    k.on($('input', k.el), 'input', run);
    if (window.crypto && crypto.getRandomValues) newSalt(); else salt = 'a91f3c';
    autoSeg(k, '.hs-m', ['no', 'salt'], function (v) { mode = v; if (v === 'salt' && window.crypto && crypto.getRandomValues) newSalt(); run(); }, 3800);
  };
  function b32(s) { var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', bits = '', out = []; s.replace(/=+$/, '').split('').forEach(function (c) { bits += A.indexOf(c).toString(2).padStart(5, '0'); }); for (var i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.substr(i, 8), 2)); return new Uint8Array(out); }
  PV.totp = function (k) {
    var SECRET = 'JBSWY3DPEHPK3PXP';
    k.el.innerHTML = '<div class="pv pv-totp"><div class="tp-phone"><small>' + I('lock') + ' Authenticator</small><b>Xiraiya Shop</b><span class="tp-code">— — —</span><svg class="tp-ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/><circle class="v" cx="18" cy="18" r="15"/></svg><em class="tp-s"></em></div>' +
      '<div class="tp-login"><small>Step 2 of 2</small><b>Enter the 6-digit code</b><div class="tp-box"></div><div class="at-res tp-res"></div></div>' +
      '<div class="pv-note tp-note">Real TOTP: the phone and the server share a secret and both compute HMAC(secret, current 30-second window). A stolen password alone is useless.</div></div>';
    var last = -1, code = '';
    function tick() {
      var now = Date.now() / 1000, win = Math.floor(now / 30), left = 30 - (now % 30);
      $('.tp-ring .v', k.el).style.strokeDashoffset = (94.2 * (1 - left / 30)).toFixed(1);
      $('.tp-s', k.el).textContent = Math.ceil(left) + 's';
      if (win === last) return; last = win;
      var buf = new Uint8Array(8), w = win; for (var i = 7; i >= 0; i--) { buf[i] = w & 255; w = Math.floor(w / 256); }
      hmac('SHA-1', b32(SECRET), buf).then(function (h) {
        if (!h) { code = String(100000 + (win * 7919) % 900000); }
        else { var o = h[h.length - 1] & 15, v = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]; code = String(v % 1e6).padStart(6, '0'); }
        var c = $('.tp-code', k.el); c.textContent = code.slice(0, 3) + ' ' + code.slice(3); bump(c, 'flash');
        typeIn();
      });
    }
    function typeIn() {
      var box = $('.tp-box', k.el), r = $('.tp-res', k.el), i = 0; box.innerHTML = ''; r.className = 'at-res tp-res'; r.innerHTML = '';
      (function t() {
        if (!k.alive()) return;
        if (i >= 6) { r.className = 'at-res tp-res ok in'; r.innerHTML = I('check') + '<b>Verified.</b> Code matches this 30-second window.'; return; }
        var s = document.createElement('span'); s.textContent = code[i++]; box.appendChild(s); k.later(t, 240);
      })();
    }
    tick(); k.every(tick, 250);
    k.every(typeIn, 7000);
  };

  /* ================= When you get hacked ================= */
  var HS = [['Contain', 'Put the site in maintenance mode, block the attacker, take a snapshot for evidence. Stop the bleeding first.', 'Maintenance mode', 'lock'], ['Investigate', 'Read logs, look for new files, new admin users and changed code. Find the door they used.', 'Reading the logs', 'search'], ['Clean & restore', 'Restore a clean backup from before the attack, then patch the hole. Deleting one bad file is not enough.', 'Restoring backup', 'refresh'], ['Rotate secrets', 'Change every password, API key, database password and token. Log everyone out.', 'New keys issued', 'key'], ['Tell people', 'Tell your users and host honestly: what happened, what was exposed, what they should do.', 'Notice sent', 'mail'], ['Prevent', 'Update everything, turn on 2FA, add a firewall, backups and monitoring. Write down what you learned.', 'Secured', 'shield']];
  PV.hack = function (k, c) {
    var here = c.step || 0;
    k.el.innerHTML = '<div class="pv pv-hack"><div class="hk-site"><div class="cb-bar"><i></i><i></i><i></i><span>yourshop.com</span></div><div class="hk-screen"><b class="hk-big">HACKED</b><small class="hk-sub"></small></div></div>' +
      '<ol class="hk-steps">' + HS.map(function (s, i) { return '<li class="' + (i === here ? 'here' : '') + '"><span class="hk-n">' + I(s[3]) + '</span><div><b>' + (i + 1) + '. ' + s[0] + (i === here ? ' <em>this lesson</em>' : '') + '</b><p>' + s[1] + '</p></div></li>'; }).join('') + '</ol></div>';
    var li = $$('.hk-steps li', k.el), scr = $('.hk-screen', k.el), cur = -1;
    function go(i) {
      cur = i;
      li.forEach(function (l, j) { l.classList.toggle('on', j === i); l.classList.toggle('done', j < i); });
      scr.className = 'hk-screen s' + (i + 1);
      $('.hk-big', k.el).textContent = i < 0 ? 'HACKED' : i < 5 ? HS[i][2] : 'Secure';
      $('.hk-sub', k.el).textContent = i < 0 ? 'Your data is ours.' : 'Step ' + (i + 1) + ' of 6';
    }
    k.on(k.el, 'click', function (e) { var l = e.target.closest('.hk-steps li'); if (l) go(li.indexOf(l)); });
    go(-1);
    k.every(function () { go(cur >= 5 ? -1 : cur + 1); }, 1800);
  };

  /* ================= Ops ================= */
  PV.git = function (k) {
    var S = [['git init', null], ['git commit -m "first page"', ['m', 0]], ['git commit -m "add styles"', ['m', 1]], ['git switch -c feature/cart', null], ['git commit -m "cart drawer"', ['f', 2]], ['git commit -m "checkout"', ['f', 3]], ['git switch main', null], ['git commit -m "fix typo"', ['m', 4]], ['git merge feature/cart', ['x', 5]]];
    k.el.innerHTML = '<div class="pv pv-git"><svg class="gt-svg" viewBox="0 0 400 130" preserveAspectRatio="xMidYMid meet"><text x="6" y="38" class="gt-lb">main</text><text x="6" y="104" class="gt-lb f">feature</text><g class="gt-g"></g></svg><div class="pv-term gt-term"><div class="tm-body"></div></div></div>';
    var g = $('.gt-g', k.el), body = $('.tm-body', k.el), i = 0, pts = { m: [], f: [] };
    var NS = 'http://www.w3.org/2000/svg';
    function el(t, a) { var e = document.createElementNS(NS, t); for (var x in a) e.setAttribute(x, a[x]); g.appendChild(e); return e; }
    function step() {
      if (i >= S.length) { k.later(function () { g.innerHTML = ''; body.innerHTML = ''; pts = { m: [], f: [] }; i = 0; step(); }, 2600); return; }
      var s = S[i++], row = document.createElement('div'); row.className = 'tm-cmd'; row.textContent = '$ ' + s[0]; body.appendChild(row); while (body.children.length > 4) body.firstChild.remove();
      if (s[1]) {
        var lane = s[1][0], x = 76 + s[1][1] * 54, y = lane === 'f' ? 100 : 34;
        var prev = lane === 'f' ? (pts.f.length ? pts.f[pts.f.length - 1] : pts.m[pts.m.length - 1]) : pts.m[pts.m.length - 1];
        if (prev) el('path', { d: 'M' + prev[0] + ' ' + prev[1] + ' C' + (prev[0] + 27) + ' ' + prev[1] + ' ' + (x - 27) + ' ' + y + ' ' + x + ' ' + y, class: 'gt-e ' + (lane === 'f' ? 'f' : '') });
        if (lane === 'x') { var fl = pts.f[pts.f.length - 1]; el('path', { d: 'M' + fl[0] + ' ' + fl[1] + ' C' + (fl[0] + 60) + ' ' + fl[1] + ' ' + (x - 30) + ' ' + y + ' ' + x + ' ' + y, class: 'gt-e f' }); }
        el('circle', { cx: x, cy: y, r: lane === 'x' ? 10 : 8, class: 'gt-c ' + (lane === 'f' ? 'f' : lane === 'x' ? 'x' : '') });
        (lane === 'f' ? pts.f : pts.m).push([x, y]);
        var tx = el('text', { x: x, y: lane === 'f' ? y + 24 : y - 16, class: 'gt-t' }); tx.textContent = s[0].match(/"(.*)"/) ? s[0].match(/"(.*)"/)[1] : 'merge';
      }
      k.later(step, 1150);
    }
    step();
  };
  PV.deploy = function (k) {
    var ST = [['Push', 'git', 'git push origin main'], ['Install', 'download', 'npm ci — 214 packages'], ['Build', 'box', 'vite build — 38 files, 142 KB'], ['Test', 'check', '48 tests passed'], ['Deploy', 'rocket', 'Uploading to the edge (31 cities)'], ['Live', 'globe', 'https://shop.xiraiya.dev']];
    k.el.innerHTML = '<div class="pv pv-dep"><div class="dp-pipe">' + ST.map(function (s) { return '<div class="dp-s"><span>' + I(s[1]) + '</span><b>' + s[0] + '</b></div>'; }).join('') + '</div><div class="pv-term"><div class="tm-body dp-log"></div></div>' +
      '<div class="pv-row"><button type="button" class="pv-btn sm dp-break">' + I('alert') + ' Break a test</button><span class="dp-live"></span></div></div>';
    var s = $$('.dp-s', k.el), log = $('.dp-log', k.el), gen = 0, broken = false;
    function run() {
      var g = ++gen, t0 = Date.now();
      s.forEach(function (x) { x.className = 'dp-s'; }); log.innerHTML = ''; $('.dp-live', k.el).className = 'dp-live'; $('.dp-live', k.el).textContent = '';
      (function step(i) {
        if (g !== gen || !k.alive()) return;
        if (i >= ST.length) { $('.dp-live', k.el).className = 'dp-live on'; $('.dp-live', k.el).innerHTML = '<i></i> Live in ' + ((Date.now() - t0) / 1000 * 6).toFixed(0) + 's'; k.later(run, 3200); return; }
        s[i].className = 'dp-s run';
        k.later(function () {
          if (g !== gen) return;
          if (i === 3 && broken) { s[i].className = 'dp-s fail'; logLine(log, '<span class="bad">✗ 1 test failed: cart total is wrong</span>', '', 5); logLine(log, '<span>Deploy stopped. Production is untouched.</span>', '', 5); broken = false; k.later(run, 3600); return; }
          s[i].className = 'dp-s done'; logLine(log, '<span class="ok">✓</span> ' + ST[i][2], '', 5); step(i + 1);
        }, 800);
      })(0);
    }
    k.on($('.dp-break', k.el), 'click', function () { broken = true; run(); });
    run();
  };
  PV.monitor = function (k) {
    var W = 60, pts = []; for (var i = 0; i < W; i++) pts.push(rnd(90, 150));
    k.el.innerHTML = '<div class="pv pv-mon"><div class="mn-top"><div><small>Uptime (30 days)</small><b>99.98%</b></div><div><small>Response</small><b class="mn-rt">120ms</b></div><div><small>Errors</small><b class="mn-er">0.1%</b></div></div>' +
      '<svg class="mn-chart" viewBox="0 0 300 100" preserveAspectRatio="none"><path class="mn-area"/><path class="mn-line"/><line x1="0" x2="300" y1="30" y2="30" class="mn-th"/></svg>' +
      '<div class="mn-svc">' + ['Website', 'API', 'Database', 'Payments'].map(function (s) { return '<span><i></i>' + s + '</span>'; }).join('') + '</div><div class="mn-alert">' + I('bell') + ' <b>Alert:</b> /checkout slow (900ms) — Telegram message sent to you</div></div>';
    var n = 0, spike = 0;
    function draw() {
      var d = pts.map(function (v, i) { return (i / (W - 1) * 300).toFixed(1) + ' ' + (100 - Math.min(v, 1000) / 1000 * 100 * 1.4).toFixed(1); });
      $('.mn-line', k.el).setAttribute('d', 'M' + d.join(' L'));
      $('.mn-area', k.el).setAttribute('d', 'M0 100 L' + d.join(' L') + ' L300 100 Z');
    }
    k.every(function () {
      n++; if (n % 18 === 0) spike = 5;
      var v = spike > 0 ? rnd(700, 950) : rnd(90, 160); if (spike > 0) spike--;
      pts.push(v); pts.shift(); draw();
      $('.mn-rt', k.el).textContent = Math.round(v) + 'ms';
      $('.mn-er', k.el).textContent = (spike > 0 ? rnd(2, 4) : rnd(0, 0.3)).toFixed(1) + '%';
      var bad = spike > 0; k.el.querySelector('.pv-mon').classList.toggle('alarm', bad);
    }, 450);
    draw();
  };

  /* ================= Performance ================= */
  PV.vitals = function (k) {
    var M = [['LCP', 'Largest Contentful Paint', 's', 2.5, 4, 5.8, 1.4, 'How fast the main content shows'], ['INP', 'Interaction to Next Paint', 'ms', 200, 500, 640, 90, 'How fast the page reacts to taps'], ['CLS', 'Cumulative Layout Shift', '', 0.1, 0.25, 0.34, 0.02, 'How much things jump around']];
    k.el.innerHTML = '<div class="pv pv-vit"><div class="pv-row pv-center">' + seg([['before', 'Before'], ['after', 'After optimising']], 'before', 'vt-m') + '</div><div class="vt-g">' +
      M.map(function (m) { return '<div class="vt"><svg viewBox="0 0 100 60"><path class="bg" d="M10 55 A40 40 0 0 1 90 55"/><path class="v" d="M10 55 A40 40 0 0 1 90 55"/></svg><b class="vt-v">0</b><strong>' + m[0] + '</strong><small>' + m[7] + '</small></div>'; }).join('') + '</div><ul class="vt-fix"></ul></div>';
    var FIX = ['Images converted to WebP and sized correctly', 'Hero image preloaded, fonts swap', 'Heavy scripts deferred and split', 'Width and height set on every image'];
    autoSeg(k, '.vt-m', ['before', 'after'], function (v) {
      $$('.vt', k.el).forEach(function (el, i) {
        var m = M[i], val = v === 'before' ? m[5] : m[6], max = m[4] * 1.6, st = val <= m[3] ? 'ok' : val <= m[4] ? 'mid' : 'bad';
        el.className = 'vt ' + st;
        $('.v', el).style.strokeDashoffset = 126 - Math.min(1, val / max) * 126;
        var t0 = performance.now(), b = $('.vt-v', el);
        k.loop(function (now) { var p = Math.min(1, (now - t0) / 700); var x = val * p; b.textContent = (m[2] === 'ms' ? Math.round(x) : x.toFixed(m[2] === 's' ? 1 : 2)) + m[2]; return p < 1; });
      });
      $('.vt-fix', k.el).innerHTML = v === 'after' ? FIX.map(function (f, i) { return '<li style="--i:' + i + '">' + I('check') + f + '</li>'; }).join('') : '<li class="bad">' + I('alert') + 'Google ranks slow pages lower, and visitors leave after 3 seconds.</li>';
    }, 4200);
  };
  PV.img = function (k) {
    play(k, { cls: 'pl-img', stage: '<div class="im"><img src="assets/img/shop/halide/tlr.jpg" alt="Camera product photo" loading="lazy"><div class="im-meta"><b class="im-kb"></b><span class="im-t"></span></div><div class="im-bar"><i></i></div></div>',
      ctl: [['f', 'Format', ['PNG', 'JPG', 'WebP', 'AVIF'], 'PNG'], ['w', 'Width', 400, 2400, 2400, 100, 'px'], ['q', 'Quality', 30, 100, 90, 5, '%']],
      apply: function (v, s) {
        var mp = v.w * v.w * 0.75 / 1e6, base = { PNG: 1500, JPG: 260, WebP: 180, AVIF: 120 }[v.f], qf = v.f === 'PNG' ? 1 : Math.pow(v.q / 80, 2);
        var kb = Math.max(8, Math.round(mp * base * qf)), sec = kb * 8 / 1024 / 5;
        $('.im-kb', s).textContent = kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB';
        $('.im-t', s).textContent = sec.toFixed(1) + 's on a 5 Mbps phone';
        var bar = $('.im-bar', s); bar.className = 'im-bar ' + (kb < 150 ? 'ok' : kb < 500 ? 'mid' : 'bad'); $('i', bar).style.width = Math.min(100, kb / 4000 * 100) + '%';
        $('img', s).style.filter = v.q < 50 && v.f !== 'PNG' ? 'blur(' + ((50 - v.q) / 25) + 'px)' : '';
        return '<img\n  src="shoe-' + v.w + '.' + v.f.toLowerCase() + '"\n  srcset="shoe-600.' + v.f.toLowerCase() + ' 600w,\n          shoe-1200.' + v.f.toLowerCase() + ' 1200w"\n  sizes="(max-width: 600px) 100vw, 600px"\n  width="' + v.w + '" height="' + Math.round(v.w * 0.75) + '"\n  loading="lazy" alt="Red running shoe">';
      } });
    k.el.querySelector('.pl-code').classList.add('html');
  };
  PV.serp = function (k) {
    k.el.innerHTML = '<div class="pv pv-seo"><div class="se-form"><label><span>Title <em class="se-c1"></em></span><input class="se-t" value="Xiraiya — Websites, Shops and Telegram Bots in Bangladesh"></label><label><span>Description <em class="se-c2"></em></span><textarea class="se-d" rows="3">Hire Xiraiya to build fast websites, online shops with payments, Telegram bots and AI agents. Fixed prices from $50, reply within hours.</textarea></label></div>' +
      '<div class="se-g"><div class="se-src"><span class="se-fav">X</span><div><b>Xiraiya</b><small>sknoyon324234234234.github.io › Personal</small></div></div><h4 class="se-h"></h4><p class="se-p"></p></div></div>';
    function run() {
      var t = $('.se-t', k.el).value, d = $('.se-d', k.el).value;
      $('.se-h', k.el).textContent = t.length > 60 ? t.slice(0, 57) + '…' : t;
      $('.se-p', k.el).textContent = d.length > 158 ? d.slice(0, 155) + '…' : d;
      var c1 = $('.se-c1', k.el), c2 = $('.se-c2', k.el);
      c1.textContent = t.length + ' / 60'; c1.className = 'se-c1 ' + (t.length > 60 ? 'bad' : t.length < 30 ? 'mid' : 'ok');
      c2.textContent = d.length + ' / 158'; c2.className = 'se-c2 ' + (d.length > 158 ? 'bad' : d.length < 70 ? 'mid' : 'ok');
    }
    k.on(k.el, 'input', run); run();
  };
  PV.og = function (k) {
    k.el.innerHTML = '<div class="pv pv-seo"><div class="se-form"><label><span>og:title</span><input class="og-t" value="Xiraiya — build something legendary"></label><label><span>og:description</span><input class="og-d" value="Websites, shops, bots and AI agents. Instant estimates."></label></div>' +
      '<div class="og-2"><div class="og-chat"><small>' + I('send') + ' Telegram</small><div class="og-msg"><p>check this out sknoyon324234234234.github.io/Personal</p><div class="og-card"><b class="og-site">Xiraiya</b><b class="og-tt"></b><span class="og-dd"></span><img src="assets/img/og-cover.png" alt=""></div></div></div>' +
      '<div class="og-fb"><img src="assets/img/og-cover.png" alt=""><div><small>GITHUB.IO</small><b class="og-tt"></b><span class="og-dd"></span></div></div></div>' +
      '<pre class="pv-code og-code"></pre></div>';
    function run() {
      var t = $('.og-t', k.el).value, d = $('.og-d', k.el).value;
      $$('.og-tt', k.el).forEach(function (e) { e.textContent = t; }); $$('.og-dd', k.el).forEach(function (e) { e.textContent = d; });
      $('.og-code', k.el).innerHTML = hl('<meta property="og:title" content="' + t + '">\n<meta property="og:description" content="' + d + '">\n<meta property="og:image" content="/og-cover.png">', 'html');
    }
    k.on(k.el, 'input', run); run();
  };

  /* ================= AI ================= */
  PV.tokens = function (k) {
    k.el.innerHTML = '<div class="pv pv-tok"><textarea class="tk-in" rows="3" spellcheck="false" aria-label="Text to split into tokens">Xiraiya builds websites, Telegram bots and unbelievably fast AI agents in 2026.</textarea><div class="tk-out"></div><div class="tk-stat"></div><div class="pv-note">Models read tokens, not letters: common words are one token, rare words split into pieces. You pay per token.</div></div>';
    function split(s) {
      var out = [];
      (s.match(/\s*[A-Za-z]+|\s*\d{1,3}|\s*[^\sA-Za-z\d]|\s+/g) || []).forEach(function (w) {
        var core = w.trim();
        if (core.length > 7 && /[a-z]/i.test(core)) { var lead = w.slice(0, w.length - core.length), parts = core.match(/.{1,4}/g); parts[0] = lead + parts[0]; out.push.apply(out, parts); }
        else out.push(w);
      });
      return out;
    }
    function run() {
      var t = split($('.tk-in', k.el).value);
      $('.tk-out', k.el).innerHTML = t.map(function (x, i) { return '<span style="--h:' + (i * 47 % 360) + ';--i:' + i + '">' + esc(x).replace(/ /g, '&nbsp;') + '</span>'; }).join('');
      var v = $('.tk-in', k.el).value;
      $('.tk-stat', k.el).innerHTML = '<span><b>' + t.length + '</b> tokens</span><span><b>' + v.length + '</b> characters</span><span>≈ <b>' + (v.length / Math.max(1, t.length)).toFixed(1) + '</b> chars per token</span>';
    }
    k.on($('.tk-in', k.el), 'input', run); run();
  };
  PV.embed = function (k) {
    var W = [['apple', 18, 22, 'f'], ['mango', 26, 16, 'f'], ['banana', 14, 32, 'f'], ['orange', 28, 28, 'f'], ['cat', 72, 20, 'a'], ['dog', 80, 28, 'a'], ['tiger', 66, 12, 'a'], ['lion', 76, 10, 'a'], ['python', 22, 74, 'c'], ['javascript', 32, 84, 'c'], ['html', 14, 86, 'c'], ['css', 28, 66, 'c'], ['Dhaka', 70, 74, 'p'], ['Rajshahi', 80, 82, 'p'], ['Tokyo', 64, 86, 'p'], ['Paris', 84, 66, 'p']];
    k.el.innerHTML = '<div class="pv pv-emb"><div class="em-plot"><svg class="em-lines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>' + W.map(function (w, i) { return '<button type="button" class="em-w ' + w[3] + '" data-i="' + i + '" style="left:' + w[1] + '%;top:' + w[2] + '%">' + w[0] + '</button>'; }).join('') + '</div><div class="em-near"></div><div class="pv-note">Embeddings turn meaning into coordinates. Close points mean similar meaning, which is how AI search (RAG) finds the right document.</div></div>';
    var cur = 0, hold = 0, btn = $$('.em-w', k.el);
    function sel(i) {
      cur = i; var q = W[i];
      var d = W.map(function (w, j) { return [j, Math.hypot(w[1] - q[1], w[2] - q[2])]; }).filter(function (x) { return x[0] !== i; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 3);
      btn.forEach(function (b, j) { b.classList.toggle('on', j === i); b.classList.toggle('near', d.some(function (x) { return x[0] === j; })); });
      $('.em-lines', k.el).innerHTML = d.map(function (x) { return '<line x1="' + q[1] + '" y1="' + q[2] + '" x2="' + W[x[0]][1] + '" y2="' + W[x[0]][2] + '"/>'; }).join('');
      $('.em-near', k.el).innerHTML = '<b>“' + q[0] + '”</b> is closest to ' + d.map(function (x) { return '<span>' + W[x[0]][0] + ' <em>' + Math.max(0, 1 - x[1] / 110).toFixed(2) + '</em></span>'; }).join('');
    }
    k.on(k.el, 'click', function (e) { var b = e.target.closest('.em-w'); if (b) { hold = Date.now(); sel(+b.getAttribute('data-i')); } });
    sel(0);
    k.every(function () { if (Date.now() - hold > 5000) sel((cur + 5) % W.length); }, 1900);
  };
})();
