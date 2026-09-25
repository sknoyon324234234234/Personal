/* XIRAIYA — Motion Wing, part C: type effects and UI micro-interactions. */
(function () {
  'use strict';
  var W = window.XRWING, XR = window.XR;
  if (!W || !XR) return;
  var $ = XR.$, $$ = XR.$$, icon = XR.icon, esc = XR.esc, add = W.add, pointer = W.pointer, canvas = W.canvas, IMG = W.IMG;
  function letters(t, cls) { return t.split('').map(function (c, i) { return '<span class="' + (cls || '') + '" style="--i:' + i + '">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</span>'; }).join(''); }
  function bump(el, c) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); }

  /* ================= type ================= */
  var TY = [
    { id: 't-wave', t: 'Wave text', jp: '波字', hint: 'Letters ride a sine wave. Hover to make it bigger.', run: function (k, el) { el.innerHTML = '<div class="ty-c ty-wave">' + letters('MAKE IT MOVE') + '</div>'; } },
    { id: 't-glitch', t: 'Glitch title', jp: '乱', hint: 'A cyberpunk glitch with split RGB channels.', run: function (k, el) { el.innerHTML = '<div class="ty-c ty-glitch" data-t="SYSTEM ONLINE">SYSTEM ONLINE</div>'; var d = $('.ty-glitch', el); k.every(function () { bump(d, 'hit'); }, 1800); } },
    { id: 't-type', t: 'Typewriter', jp: '打', hint: 'Types, pauses, deletes and types again, with a blinking caret.', run: function (k, el) {
      var L = ['I build websites.', 'I build Telegram bots.', 'I build AI agents.', 'I build what you need.'], i = 0, j = 0, del = false;
      el.innerHTML = '<div class="ty-c ty-tw"><span class="tw-t"></span><i class="tw-c"></i></div>';
      var t = $('.tw-t', el);
      (function tick() { if (!k.alive()) return; var s = L[i % L.length]; if (!del) { t.textContent = s.slice(0, ++j); if (j >= s.length) { del = true; return k.later(tick, 1400); } } else { t.textContent = s.slice(0, --j); if (j <= 9) { del = false; i++; } } k.later(tick, del ? 35 : 70); })();
    } },
    { id: 't-sweep', t: 'Gradient sweep', jp: '彩', hint: 'A band of colour sweeps through bold type.', run: function (k, el) { el.innerHTML = '<div class="ty-c ty-sweep">Legendary<br>by design.</div>'; } },
    { id: 't-drop', t: 'Letter drop', jp: '落', hint: 'Letters fall into place with a bounce. Click to drop them again.', run: function (k, el) { el.innerHTML = '<div class="ty-c ty-drop">' + letters('GRAVITY') + '</div>'; var d = $('.ty-drop', el); function go() { bump(d, 'go'); } go(); k.on(el, 'click', go); k.every(go, 3200); } },
    { id: 't-weight', t: 'Breathing weight', jp: '息', hint: 'Each letter breathes between light and heavy, one after another.', run: function (k, el) { el.innerHTML = '<div class="ty-c ty-weight">' + letters('BREATHE') + '</div>'; } },
    { id: 't-circle', t: 'Circular badge', jp: '円', hint: 'A rotating badge with text on a circle. Hover to spin it faster.', run: function (k, el) { var s = 'AVAILABLE FOR WORK · 2026 · XIRAIYA · '; el.innerHTML = '<div class="ty-circ"><div class="ty-circ-r">' + s.split('').map(function (c, i) { return '<span style="--a:' + (i * 360 / s.length) + 'deg">' + esc(c) + '</span>'; }).join('') + '</div><b>' + icon('arrow-up-right') + '</b></div>'; } },
    { id: 't-marquee', t: 'Kinetic marquee', jp: '流字', size: 'l', hint: 'Stacked rows of type sliding in opposite directions. Hover to slow down.', run: function (k, el) { var R = ['WEBSITES · SHOPS · BOTS ·', 'AUTOMATION · AI AGENTS ·', 'MOTION · UI · UX · 3D ·']; el.innerHTML = '<div class="ty-mq">' + R.map(function (r, i) { var t = (' ' + r).repeat(4); return '<div class="ty-mq-r r' + i + '"><span>' + t + '</span><span>' + t + '</span></div>'; }).join('') + '</div>'; } },
    { id: 't-mask', t: 'Masked reveal', jp: '幕', hint: 'Lines rise out from behind an invisible mask.', run: function (k, el) { el.innerHTML = '<div class="ty-c ty-mask"><span><b>Every pixel</b></span><span><b>has a reason</b></span><span><b>to move.</b></span></div>'; var d = $('.ty-mask', el); function go() { bump(d, 'go'); } go(); k.every(go, 3600); } },
    { id: 't-odo', t: 'Odometer', jp: '数', hint: 'Numbers roll like a car odometer toward a new total.', run: function (k, el) {
      el.innerHTML = '<div class="ty-odo"><small>Visitors this month</small><div class="odo">' + ('<span class="od"><i>' + '0123456789'.split('').join('</i><i>') + '</i></span>').repeat(6) + '</div></div>';
      var D = $$('.od', el), n = 128400;
      function set() { n += Math.floor(Math.random() * 900 + 50); var s = String(n).padStart(6, '0'); D.forEach(function (d, i) { d.style.transform = 'translateY(' + -(+s[i]) * 10 + '%)'; }); }
      set(); k.every(set, 1800);
    } }
  ];
  TY.forEach(function (o) { add({ id: o.id, t: o.t, jp: o.jp, tag: 'type', size: o.size || 's', kw: 'typography text', hint: o.hint, run: o.run }); });

  /* ================= UI micro-interactions ================= */
  var UI = [
    { id: 'u-compare', t: 'Before / after', jp: '比', size: 'l', hint: 'Drag the handle to compare a raw photo with the edited one.', run: function (k, el) {
      var src = IMG + 'nordhem/sofa.jpg';
      el.innerHTML = '<div class="cmp"><img src="' + src + '" alt="" class="cmp-a" draggable="false"><div class="cmp-b"><img src="' + src + '" alt="" draggable="false"></div><div class="cmp-h"><i>' + icon('chevron-left') + icon('chevron-right') + '</i></div><span class="cmp-l l">Before</span><span class="cmp-l r">After</span></div>';
      var c = $('.cmp', el), b = $('.cmp-b', el), h = $('.cmp-h', el), p = pointer(k, c), x = .5, T = 0;
      k.loop(function (dt) { T += dt; var tx = p.down ? p.x / c.clientWidth : (p.in ? x : .5 + Math.sin(T * .8) * .3); x += (tx - x) * Math.min(1, dt * 10); b.style.clipPath = 'inset(0 0 0 ' + x * 100 + '%)'; h.style.left = x * 100 + '%'; });
    } },
    { id: 'u-lens', t: 'Zoom lens', jp: '鏡', hint: 'Hover the product. A magnifying lens shows every detail.', run: function (k, el) {
      var src = IMG + 'aurelia/watch.jpg';
      el.innerHTML = '<div class="lens"><img src="' + src + '" alt="" draggable="false"><i class="lens-g" style="background-image:url(' + src + ')"></i></div>';
      var L = $('.lens', el), g = $('.lens-g', el), p = pointer(k, L), T = 0;
      k.loop(function (dt) { T += dt; var w = L.clientWidth, h = L.clientHeight, x = p.in ? p.x : w / 2 + Math.cos(T * .7) * w * .25, y = p.in ? p.y : h / 2 + Math.sin(T * 1.1) * h * .25; g.style.transform = 'translate(' + (x - 60) + 'px,' + (y - 60) + 'px)'; g.style.backgroundSize = w * 2.5 + 'px ' + h * 2.5 + 'px'; g.style.backgroundPosition = (-x * 2.5 + 60) + 'px ' + (-y * 2.5 + 60) + 'px'; });
    } },
    { id: 'u-bento', t: 'Bento spotlight', jp: '弁当', size: 'l', hint: 'A bento grid where light follows your cursor across every tile.', run: function (k, el) {
      var B = [['zap', 'Fast', 'Under 1s load'], ['shield', 'Secure', 'A+ headers'], ['chart', 'Growth', '+38% sales'], ['bot', 'Automated', '24/7 bots'], ['globe', 'Global', '31 edge cities'], ['heart', 'Loved', '4.9 rating']];
      el.innerHTML = '<div class="bento">' + B.map(function (b, i) { return '<div class="bt b' + i + '"><span>' + icon(b[0] === 'chart' ? 'trending' : b[0]) + '</span><b>' + b[1] + '</b><small>' + b[2] + '</small></div>'; }).join('') + '</div>';
      var g = $('.bento', el), T = 0, p = pointer(k, g), tiles = $$('.bt', el);
      k.loop(function (dt) { T += dt; var gr = g.getBoundingClientRect(), x = p.in ? p.x : gr.width / 2 + Math.cos(T * .6) * gr.width * .4, y = p.in ? p.y : gr.height / 2 + Math.sin(T * .9) * gr.height * .4; tiles.forEach(function (t) { t.style.setProperty('--mx', (x - t.offsetLeft) + 'px'); t.style.setProperty('--my', (y - t.offsetTop) + 'px'); }); });
    } },
    { id: 'u-tabs', t: 'Liquid tab bar', jp: '液', hint: 'A gooey indicator that stretches between tabs.', run: function (k, el) {
      var fid = 'lq' + Math.random().toString(36).slice(2, 6), T = ['home', 'search', 'heart', 'cart', 'user'];
      el.innerHTML = '<svg class="goo-defs"><filter id="' + fid + '"><feGaussianBlur in="SourceGraphic" stdDeviation="6"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -8"/></filter></svg><div class="lq"><div class="lq-goo" style="filter:url(#' + fid + ')"><i class="lq-a"></i><i class="lq-b"></i></div>' + T.map(function (t, i) { return '<button type="button" data-i="' + i + '" aria-label="' + t + '">' + icon(t) + '</button>'; }).join('') + '</div>';
      var bs = $$('.lq button', el), a = $('.lq-a', el), b = $('.lq-b', el), cur = 0, hold = 0;
      function go(i) { cur = i; var x = bs[i].offsetLeft + bs[i].offsetWidth / 2 - 26; a.style.transform = 'translateX(' + x + 'px)'; k.later(function () { b.style.transform = 'translateX(' + x + 'px)'; }, 140); bs.forEach(function (x2, j) { x2.classList.toggle('on', j === i); }); }
      bs.forEach(function (x2, i) { k.on(x2, 'click', function () { hold = Date.now(); go(i); }); });
      k.later(function () { go(0); }, 50); k.every(function () { if (Date.now() - hold > 4000) go((cur + 1) % bs.length); }, 1300);
    } },
    { id: 'u-kanban', t: 'Kanban drag', jp: '板', size: 'l', hint: 'Drag task cards between columns. Cards tilt while you carry them.', run: function (k, el) {
      var C = [['To do', ['Logo files', 'Hero copy', 'Pick fonts']], ['Doing', ['Checkout page', 'Bot replies']], ['Done', ['Domain + SSL']]];
      el.innerHTML = '<div class="kb2">' + C.map(function (c) { return '<div class="kb2-col"><b>' + c[0] + '</b><div class="kb2-list">' + c[1].map(function (t) { return '<div class="kb2-card">' + t + '</div>'; }).join('') + '</div></div>'; }).join('') + '</div>';
      var drag = null, last = 0;
      k.on(el, 'pointerdown', function (e) { var c = e.target.closest('.kb2-card'); if (!c) return; var r = c.getBoundingClientRect(); drag = { c: c, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width }; c.classList.add('drag'); c.style.width = r.width + 'px'; c.style.position = 'fixed'; c.style.left = r.left + 'px'; c.style.top = r.top + 'px'; el.setPointerCapture(e.pointerId); last = Date.now(); });
      k.on(el, 'pointermove', function (e) { if (!drag) return; drag.c.style.left = (e.clientX - drag.dx) + 'px'; drag.c.style.top = (e.clientY - drag.dy) + 'px'; drag.c.style.transform = 'rotate(' + Math.max(-8, Math.min(8, e.movementX)) + 'deg) scale(1.05)'; $$('.kb2-col', el).forEach(function (col) { var r = col.getBoundingClientRect(); col.classList.toggle('over', e.clientX > r.left && e.clientX < r.right); }); });
      k.on(el, 'pointerup', function (e) { if (!drag) return; var c = drag.c, col = $$('.kb2-col', el).filter(function (x) { var r = x.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right; })[0]; c.classList.remove('drag'); c.style.cssText = ''; if (col) $('.kb2-list', col).appendChild(c); $$('.kb2-col', el).forEach(function (x) { x.classList.remove('over'); }); c.classList.add('land'); drag = null; });
      k.every(function () { if (Date.now() - last < 5000) return; var cols = $$('.kb2-col', el), from = cols.filter(function (c) { return $$('.kb2-card', c).length; }); var src = from[Math.random() * from.length | 0]; if (!src) return; var card = $('.kb2-card', src), to = cols[(cols.indexOf(src) + 1) % 3]; card.classList.add('fly'); k.later(function () { card.classList.remove('fly'); $('.kb2-list', to).appendChild(card); bump(card, 'land'); }, 350); }, 1600);
    } },
    { id: 'u-wheel', t: 'Colour wheel', jp: '色', hint: 'Drag around the wheel to pick a colour. The UI below follows.', run: function (k, el) {
      el.innerHTML = '<div class="cw"><div class="cw-w"><i class="cw-dot"></i><span class="cw-c"></span></div><div class="cw-ui"><b class="cw-hex"></b><span class="cw-btn">Button</span><span class="cw-chip">Chip</span></div></div>';
      var w = $('.cw-w', el), dot = $('.cw-dot', el), p = pointer(k, w), a = 0, r = .8, T = 0;
      k.loop(function (dt) { T += dt; var rw = w.clientWidth / 2; if (p.down) { a = Math.atan2(p.y - rw, p.x - rw); r = Math.min(1, Math.hypot(p.x - rw, p.y - rw) / rw); } else if (!p.in) { a += dt * .6; r = .7 + Math.sin(T) * .25; } var hue = ((a * 180 / Math.PI) + 450) % 360, col = 'hsl(' + hue.toFixed(0) + ' ' + Math.round(r * 90) + '% 52%)'; dot.style.transform = 'translate(' + (rw + Math.cos(a) * r * rw * .92 - 9) + 'px,' + (rw + Math.sin(a) * r * rw * .92 - 9) + 'px)'; dot.style.background = col; el.style.setProperty('--pc', col); $('.cw-hex', el).textContent = 'hsl(' + hue.toFixed(0) + ', ' + Math.round(r * 90) + '%, 52%)'; });
    } },
    { id: 'u-stars', t: 'Star rating', jp: '星評', hint: 'Hover and click a rating. Five stars get a celebration.', run: function (k, el) {
      el.innerHTML = '<div class="rt"><div class="rt-s">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-v="' + i + '" aria-label="' + i + ' stars">' + icon('star-fill') + '</button>'; }).join('') + '</div><b class="rt-l">Rate your order</b></div>';
      var bs = $$('.rt-s button', el), L = ['Terrible', 'Not great', 'Okay', 'Great', 'Legendary!'], v = 0, last = 0;
      function show(n, hov) { bs.forEach(function (b, i) { b.classList.toggle('on', i < n); b.classList.toggle('hov', hov && i < n); }); $('.rt-l', el).textContent = n ? L[n - 1] : 'Rate your order'; }
      function set(n) { v = n; show(n); bs.slice(0, n).forEach(function (b, i) { k.later(function () { bump(b, 'pop'); }, i * 60); }); if (n === 5) bump($('.rt', el), 'party'); }
      bs.forEach(function (b, i) { k.on(b, 'pointerenter', function () { show(i + 1, true); }); k.on(b, 'pointerleave', function () { show(v); }); k.on(b, 'click', function () { last = Date.now(); set(i + 1); }); });
      var n = 0; k.every(function () { if (Date.now() - last > 5000) set(++n % 6); }, 1200);
    } },
    { id: 'u-range', t: 'Range with bubble', jp: '幅', hint: 'A slider whose value bubble stretches and tilts as you drag.', run: function (k, el) {
      el.innerHTML = '<div class="rg"><small>Your budget</small><div class="rg-t"><i class="rg-f"></i><i class="rg-k"><b class="rg-b">$250</b></i></div><div class="rg-s"><span>$50</span><span>$500</span></div></div>';
      var t = $('.rg-t', el), f = $('.rg-f', el), kn = $('.rg-k', el), bb = $('.rg-b', el), p = pointer(k, t), x = .4, vx = 0, T = 0;
      k.loop(function (dt) { T += dt; var tx = p.down ? Math.max(0, Math.min(1, p.x / t.clientWidth)) : (p.in ? x : .5 + Math.sin(T * .9) * .4); var nx = x + (tx - x) * Math.min(1, dt * 12); vx = (nx - x) / Math.max(dt, .001); x = nx; f.style.width = x * 100 + '%'; kn.style.left = x * 100 + '%'; bb.textContent = '$' + Math.round((50 + x * 450) / 10) * 10; bb.style.transform = 'translateX(-50%) rotate(' + Math.max(-25, Math.min(25, -vx * 20)) + 'deg) scale(' + (p.down ? 1.15 : 1) + ')'; });
    } },
    { id: 'u-otp', t: 'Code input', jp: '暗証', hint: 'A 6-digit code box that jumps forward, shakes when wrong and glows when right.', run: function (k, el) {
      el.innerHTML = '<div class="otp"><small>Enter the code we sent</small><div class="otp-b">' + '<input inputmode="numeric" maxlength="1" aria-label="Digit">'.repeat(6) + '</div><b class="otp-m">Hint: 204816</b></div>';
      var I = $$('input', el), o = $('.otp', el), last = 0;
      function check() { var v = I.map(function (i) { return i.value; }).join(''); if (v.length < 6) return; if (v === '204816') { o.classList.add('ok'); $('.otp-m', el).textContent = 'Verified'; } else { bump(o, 'bad'); $('.otp-m', el).textContent = 'Wrong code, try again'; k.later(function () { I.forEach(function (i) { i.value = ''; }); I[0].focus(); }, 500); } }
      I.forEach(function (inp, i) { k.on(inp, 'input', function () { last = Date.now(); o.classList.remove('ok'); inp.value = inp.value.replace(/\D/g, ''); if (inp.value && I[i + 1]) I[i + 1].focus(); check(); }); k.on(inp, 'keydown', function (e) { if (e.key === 'Backspace' && !inp.value && I[i - 1]) I[i - 1].focus(); }); });
      var demo = ['135790', '204816'], d = 0; k.every(function () { if (Date.now() - last < 6000) return; o.classList.remove('ok'); var s = demo[d++ % 2]; I.forEach(function (i) { i.value = ''; }); s.split('').forEach(function (c, j) { k.later(function () { I[j].value = c; bump(I[j], 'in'); if (j === 5) check(); }, j * 140); }); }, 3200);
    } },
    { id: 'u-sheet', t: 'Bottom sheet', jp: '床', hint: 'A phone bottom sheet. Drag the handle up and down.', run: function (k, el) {
      el.innerHTML = '<div class="bs-ph"><div class="bs-map">' + icon('pin') + '</div><div class="bs"><i class="bs-h"></i><b>3 drivers nearby</b><div class="bs-r">' + ['Rafi · 2 min', 'Mim · 4 min', 'Arif · 6 min'].map(function (r) { return '<span>' + icon('user') + r + '</span>'; }).join('') + '</div><i class="bs-go">Book ride</i></div></div>';
      var s = $('.bs', el), ph = $('.bs-ph', el), y = .55, drag = null, T = 0, last = 0;
      k.on(s, 'pointerdown', function (e) { drag = { y: e.clientY, s: y }; s.setPointerCapture(e.pointerId); last = Date.now(); });
      k.on(s, 'pointermove', function (e) { if (drag) y = Math.max(.15, Math.min(.8, drag.s + (e.clientY - drag.y) / ph.clientHeight)); });
      k.on(s, 'pointerup', function () { drag = null; y = y < .35 ? .15 : y < .65 ? .55 : .8; });
      k.loop(function (dt) { T += dt; if (!drag && Date.now() - last > 4000) { var st = [.8, .55, .15, .55][Math.floor(T / 1.6) % 4]; y += (st - y) * Math.min(1, dt * 6); } s.style.transform = 'translateY(' + y * 100 + '%)'; });
    } },
    { id: 'u-refresh', t: 'Pull to refresh', jp: '更', hint: 'Pull the feed down and let go. New posts slide in.', run: function (k, el) {
      el.innerHTML = '<div class="pr-ph"><div class="pr-sp"><i></i></div><div class="pr-feed"></div></div>';
      var feed = $('.pr-feed', el), sp = $('.pr-sp', el), n = 0, pull = 0, drag = null, busy = false, last = 0;
      var POSTS = [['glow/look.jpg', 'Glow Theory', 'New serum drop'], ['carry/look.jpg', 'Carry', 'Leather restock'], ['thread/look.jpg', 'Thread', 'Autumn edit'], ['deshi/look.jpg', 'Deshi', 'Handwoven sarees'], ['pebble/look.jpg', 'Pebble', 'Tiny knits']];
      function post() { var p = POSTS[n++ % POSTS.length], d = document.createElement('div'); d.className = 'pr-post'; d.innerHTML = '<img src="' + IMG + p[0] + '" alt=""><div><b>' + p[1] + '</b><span>' + p[2] + '</span></div>'; feed.prepend(d); while (feed.children.length > 5) feed.lastChild.remove(); }
      post(); post(); post();
      function release() { if (pull > 60 && !busy) { busy = true; sp.classList.add('spin'); pull = 60; k.later(function () { post(); sp.classList.remove('spin'); busy = false; pull = 0; }, 900); } else pull = 0; }
      k.on(feed, 'pointerdown', function (e) { drag = e.clientY; last = Date.now(); feed.setPointerCapture(e.pointerId); });
      k.on(feed, 'pointermove', function (e) { if (drag != null && !busy) pull = Math.max(0, Math.min(100, (e.clientY - drag) * .6)); });
      k.on(feed, 'pointerup', function () { drag = null; release(); });
      var T = 0; k.loop(function (dt) { T += dt; if (drag == null && !busy && Date.now() - last > 3000 && T % 3.2 < 1) pull = Math.min(90, pull + dt * 160); else if (drag == null && !busy && pull > 0) release(); feed.style.transform = 'translateY(' + pull + 'px)'; sp.style.opacity = Math.min(1, pull / 60); sp.style.transform = 'translateX(-50%) rotate(' + pull * 4 + 'deg)'; });
    } },
    { id: 'u-notif', t: 'Notification stack', jp: '通知', hint: 'Notifications stack up. Hover the stack to fan it open.', run: function (k, el) {
      el.innerHTML = '<div class="nt"></div>';
      var box = $('.nt', el), N = [['cart', 'New order #4821', '$129 · Kage 75'], ['chat', 'Nusrat replied', '"Can you ship today?"'], ['bot', 'Bot handled 12 chats', 'While you slept'], ['trending', 'Sales up 38%', 'This week'], ['star-fill', 'New 5-star review', '"Legendary work"']], n = 0;
      function push() { var d = N[n++ % N.length], e = document.createElement('div'); e.className = 'nt-i'; e.innerHTML = '<span>' + icon(d[0]) + '</span><div><b>' + d[1] + '</b><small>' + d[2] + '</small></div><em>now</em>'; box.prepend(e); $$('.nt-i', box).forEach(function (x, i) { x.style.setProperty('--i', i); if (i > 3) x.remove(); }); }
      push(); push(); k.every(push, 1900);
    } },
    { id: 'u-shuffle', t: 'Shuffle grid', jp: '混', size: 'l', hint: 'Tiles glide to their new places when the grid is filtered or shuffled.', run: function (k, el) {
      var S = W.SETS, items = [['plant', 0], ['tech', 2], ['glow', 7], ['plant', 4], ['tech', 4], ['glow', 4], ['plant', 8], ['tech', 9], ['glow', 1]];
      el.innerHTML = '<div class="shf"><div class="shf-b">' + ['all', 'plant', 'tech', 'glow'].map(function (f) { return '<button type="button" data-f="' + f + '">' + f + '</button>'; }).join('') + '<button type="button" data-f="shuffle">' + icon('refresh') + '</button></div><div class="shf-g">' + items.map(function (it) { return '<div class="shf-i" data-c="' + it[0] + '"><img src="' + IMG + S[it[0]][it[1]] + '" alt="" loading="lazy"></div>'; }).join('') + '</div></div>';
      var g = $('.shf-g', el), last = 0, step = 0;
      function flip(fn) { var its = $$('.shf-i', g), a = its.map(function (i) { return i.getBoundingClientRect(); }); fn(); its.forEach(function (i, j) { var b = i.getBoundingClientRect(); if (!b.width) return; var dx = a[j].left - b.left, dy = a[j].top - b.top; i.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' }); }); }
      function act(f) { flip(function () { if (f === 'shuffle') { var its = $$('.shf-i', g); its.sort(function () { return Math.random() - .5; }).forEach(function (i) { g.appendChild(i); }); } else $$('.shf-i', g).forEach(function (i) { i.classList.toggle('off', f !== 'all' && i.getAttribute('data-c') !== f); }); }); $$('.shf-b button', el).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-f') === f); }); }
      k.on(el, 'click', function (e) { var b = e.target.closest('[data-f]'); if (b) { last = Date.now(); act(b.getAttribute('data-f')); } });
      var seq = ['shuffle', 'plant', 'all', 'shuffle', 'tech', 'all', 'glow', 'all']; k.every(function () { if (Date.now() - last > 5000) act(seq[step++ % seq.length]); }, 1800);
    } },
    { id: 'u-magnetic', t: 'Magnetic buttons', jp: '引', hint: 'Buttons lean toward your cursor before you even touch them.', run: function (k, el) {
      el.innerHTML = '<div class="mb">' + [['Hire me', 'arrow-up-right'], ['Say hi', 'send'], ['', 'heart']].map(function (b, i) { return '<button type="button" class="mb-b b' + i + '"><span>' + (b[0] ? esc(b[0]) : '') + icon(b[1]) + '</span></button>'; }).join('') + '</div>';
      var B = $$('.mb-b', el), p = pointer(k, el), T = 0;
      k.loop(function (dt) { T += dt; var er = el.getBoundingClientRect(), px = p.in ? p.x : er.width / 2 + Math.cos(T) * er.width * .35, py = p.in ? p.y : er.height / 2 + Math.sin(T * 1.4) * er.height * .3; B.forEach(function (b) { var cx = b.offsetLeft + b.offsetWidth / 2, cy = b.offsetTop + b.offsetHeight / 2, dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy), f = Math.max(0, 1 - d / 150); b.style.transform = 'translate(' + dx * f * .35 + 'px,' + dy * f * .35 + 'px)'; b.firstChild.style.transform = 'translate(' + dx * f * .15 + 'px,' + dy * f * .15 + 'px)'; b.classList.toggle('near', f > .3); }); });
    } },
    { id: 'u-icons', t: 'Morphing icons', jp: '形', hint: 'Menu to close, play to pause, plus to check: tap any icon.', run: function (k, el) {
      el.innerHTML = '<div class="mi2">' + ['burger', 'play', 'plus', 'arrow', 'search', 'heart'].map(function (m) { return '<button type="button" class="mi2-b m-' + m + '" aria-label="' + m + '"><i></i><i></i><i></i></button>'; }).join('') + '</div>';
      var B = $$('.mi2-b', el), last = 0; B.forEach(function (b) { k.on(b, 'click', function () { last = Date.now(); b.classList.toggle('on'); }); });
      var n = 0; k.every(function () { if (Date.now() - last > 4000) B[n++ % B.length].classList.toggle('on'); }, 500);
    } },
    { id: 'u-stepper', t: 'Checkout stepper', jp: '歩', hint: 'A checkout progress bar with a line that draws itself between steps.', run: function (k, el) {
      var S = [['cart', 'Cart'], ['truck', 'Shipping'], ['card', 'Payment'], ['check', 'Done']];
      el.innerHTML = '<div class="stp"><div class="stp-r"><i class="stp-l"><b></b></i>' + S.map(function (s) { return '<span class="stp-s"><i>' + icon(s[0]) + '</i><small>' + s[1] + '</small></span>'; }).join('') + '</div><div class="stp-card"><b></b><span></span></div></div>';
      var ss = $$('.stp-s', el), line = $('.stp-l b', el), cur = 0, TX = [['Your cart', '2 items · $214'], ['Where to?', 'Dhaka, Gulshan 2'], ['Pay with', 'bKash · Card · USDT'], ['Order placed', 'Arriving Thursday']];
      function go(i) { cur = i; ss.forEach(function (s, j) { s.classList.toggle('done', j < i); s.classList.toggle('on', j === i); }); line.style.width = i / (S.length - 1) * 100 + '%'; var c = $('.stp-card', el); bump(c, 'in'); $('b', c).textContent = TX[i][0]; $('span', c).textContent = TX[i][1]; }
      ss.forEach(function (s, i) { k.on(s, 'click', function () { go(i); }); });
      go(0); k.every(function () { go((cur + 1) % S.length); }, 1600);
    } }
  ];
  UI.forEach(function (o) { add({ id: o.id, t: o.t, jp: o.jp, tag: 'ui', size: o.size || 's', kw: 'ui ux component interaction', hint: o.hint, run: o.run }); });
})();
