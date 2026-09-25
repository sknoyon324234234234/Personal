/* XIRAIYA — Motion Wing: kinetic type and professional interface patterns. */
(function () {
  'use strict';
  var W = window.XRWING, XR = window.XR;
  if (!W || !XR) return;
  var $ = XR.$, $$ = XR.$$, icon = XR.icon, esc = XR.esc, add = W.add, pointer = W.pointer, canvas = W.canvas, IMG = W.IMG;
  function letters(t, cls) { return t.split('').map(function (c, i) { return '<span class="' + (cls || '') + '" style="--i:' + i + '">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</span>'; }).join(''); }
  function bump(el, c) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); }

  /* ================= type ================= */
  var TY = [
    { id: 't-marquee', t: 'Kinetic marquee', jp: '流字', size: 'l', hint: 'Stacked rows of type sliding in opposite directions. Hover to slow down.', run: function (k, el) { var R = ['WEBSITES · SHOPS · BOTS ·', 'AUTOMATION · AI AGENTS ·', 'MOTION · UI · UX · 3D ·']; el.innerHTML = '<div class="ty-mq">' + R.map(function (r, i) { var t = (' ' + r).repeat(4); return '<div class="ty-mq-r r' + i + '"><span>' + t + '</span><span>' + t + '</span></div>'; }).join('') + '</div>'; } }
  ];
  TY.forEach(function (o) { add({ id: o.id, t: o.t, jp: o.jp, tag: 'type', size: o.size || 's', kw: 'typography text', hint: o.hint, run: o.run }); });

  /* ================= interface ================= */
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
    { id: 'u-kanban', t: 'Kanban drag', jp: '板', size: 'l', hint: 'Drag task cards between columns. Cards tilt while you carry them.', run: function (k, el) {
      var C = [['To do', ['Logo files', 'Hero copy', 'Pick fonts']], ['Doing', ['Checkout page', 'Bot replies']], ['Done', ['Domain + SSL']]];
      el.innerHTML = '<div class="kb2">' + C.map(function (c) { return '<div class="kb2-col"><b>' + c[0] + '</b><div class="kb2-list">' + c[1].map(function (t) { return '<div class="kb2-card">' + t + '</div>'; }).join('') + '</div></div>'; }).join('') + '</div>';
      var drag = null, last = 0;
      k.on(el, 'pointerdown', function (e) { var c = e.target.closest('.kb2-card'); if (!c) return; var r = c.getBoundingClientRect(); drag = { c: c, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width }; c.classList.add('drag'); c.style.width = r.width + 'px'; c.style.position = 'fixed'; c.style.left = r.left + 'px'; c.style.top = r.top + 'px'; el.setPointerCapture(e.pointerId); last = Date.now(); });
      k.on(el, 'pointermove', function (e) { if (!drag) return; drag.c.style.left = (e.clientX - drag.dx) + 'px'; drag.c.style.top = (e.clientY - drag.dy) + 'px'; drag.c.style.transform = 'rotate(' + Math.max(-8, Math.min(8, e.movementX)) + 'deg) scale(1.05)'; $$('.kb2-col', el).forEach(function (col) { var r = col.getBoundingClientRect(); col.classList.toggle('over', e.clientX > r.left && e.clientX < r.right); }); });
      k.on(el, 'pointerup', function (e) { if (!drag) return; var c = drag.c, col = $$('.kb2-col', el).filter(function (x) { var r = x.getBoundingClientRect(); return e.clientX > r.left && e.clientX < r.right; })[0]; c.classList.remove('drag'); c.style.cssText = ''; if (col) $('.kb2-list', col).appendChild(c); $$('.kb2-col', el).forEach(function (x) { x.classList.remove('over'); }); c.classList.add('land'); drag = null; });
      k.every(function () { if (Date.now() - last < 5000) return; var cols = $$('.kb2-col', el), from = cols.filter(function (c) { return $$('.kb2-card', c).length; }); var src = from[Math.random() * from.length | 0]; if (!src) return; var card = $('.kb2-card', src), to = cols[(cols.indexOf(src) + 1) % 3]; card.classList.add('fly'); k.later(function () { card.classList.remove('fly'); $('.kb2-list', to).appendChild(card); bump(card, 'land'); }, 350); }, 1600);
    } },
    { id: 'u-sheet', t: 'Bottom sheet', jp: '床', hint: 'A phone bottom sheet. Drag the handle up and down.', run: function (k, el) {
      el.innerHTML = '<div class="bs-ph"><div class="bs-map">' + icon('pin') + '</div><div class="bs"><i class="bs-h"></i><b>3 drivers nearby</b><div class="bs-r">' + ['Rafi · 2 min', 'Mim · 4 min', 'Arif · 6 min'].map(function (r) { return '<span>' + icon('user') + r + '</span>'; }).join('') + '</div><i class="bs-go">Book ride</i></div></div>';
      var s = $('.bs', el), ph = $('.bs-ph', el), y = .55, drag = null, T = 0, last = 0;
      k.on(s, 'pointerdown', function (e) { drag = { y: e.clientY, s: y }; s.setPointerCapture(e.pointerId); last = Date.now(); });
      k.on(s, 'pointermove', function (e) { if (drag) y = Math.max(.15, Math.min(.8, drag.s + (e.clientY - drag.y) / ph.clientHeight)); });
      k.on(s, 'pointerup', function () { drag = null; y = y < .35 ? .15 : y < .65 ? .55 : .8; });
      k.loop(function (dt) { T += dt; if (!drag && Date.now() - last > 4000) { var st = [.8, .55, .15, .55][Math.floor(T / 1.6) % 4]; y += (st - y) * Math.min(1, dt * 6); } s.style.transform = 'translateY(' + y * 100 + '%)'; });
    } },
    { id: 'u-notif', t: 'Notification stack', jp: '通知', hint: 'Notifications stack up. Hover the stack to fan it open.', run: function (k, el) {
      el.innerHTML = '<div class="nt"></div>';
      var box = $('.nt', el), N = [['cart', 'New order #4821', '$129 · Kage 75'], ['chat', 'Nusrat replied', '"Can you ship today?"'], ['bot', 'Bot handled 12 chats', 'While you slept'], ['trending', 'Sales up 38%', 'This week'], ['star-fill', 'New 5-star review', '"Legendary work"']], n = 0;
      function push() { var d = N[n++ % N.length], e = document.createElement('div'); e.className = 'nt-i'; e.innerHTML = '<span>' + icon(d[0]) + '</span><div><b>' + d[1] + '</b><small>' + d[2] + '</small></div><em>now</em>'; box.prepend(e); $$('.nt-i', box).forEach(function (x, i) { x.style.setProperty('--i', i); if (i > 3) x.remove(); }); }
      push(); push(); k.every(push, 1900);
    } },
    { id: 'u-stepper', t: 'Checkout stepper', jp: '歩', hint: 'A checkout progress bar with a line that draws itself between steps.', run: function (k, el) {
      var S = [['cart', 'Cart'], ['truck', 'Shipping'], ['card', 'Payment'], ['check', 'Done']];
      el.innerHTML = '<div class="stp"><div class="stp-r"><i class="stp-l"><b></b></i>' + S.map(function (s) { return '<span class="stp-s"><i>' + icon(s[0]) + '</i><small>' + s[1] + '</small></span>'; }).join('') + '</div><div class="stp-card"><b></b><span></span></div></div>';
      var ss = $$('.stp-s', el), line = $('.stp-l b', el), cur = 0, TX = [['Your cart', '2 items · $214'], ['Where to?', 'Dhaka, Gulshan 2'], ['Pay with', 'bKash · Card · USDT'], ['Order placed', 'Arriving Thursday']];
      function go(i) { cur = i; ss.forEach(function (s, j) { s.classList.toggle('done', j < i); s.classList.toggle('on', j === i); }); line.style.width = i / (S.length - 1) * 100 + '%'; var c = $('.stp-card', el); bump(c, 'in'); $('b', c).textContent = TX[i][0]; $('span', c).textContent = TX[i][1]; }
      ss.forEach(function (s, i) { k.on(s, 'click', function () { go(i); }); });
      go(0); k.every(function () { go((cur + 1) % S.length); }, 1600);
    } },
    { id: 'u-magnetic', t: 'Magnetic buttons', jp: '引', hint: 'Buttons lean toward your cursor before you even touch them.', run: function (k, el) {
      el.innerHTML = '<div class="mb">' + [['Hire me', 'arrow-up-right'], ['Say hi', 'send'], ['', 'heart']].map(function (b, i) { return '<button type="button" class="mb-b b' + i + '"><span>' + (b[0] ? esc(b[0]) : '') + icon(b[1]) + '</span></button>'; }).join('') + '</div>';
      var B = $$('.mb-b', el), p = pointer(k, el), T = 0;
      k.loop(function (dt) { T += dt; var er = el.getBoundingClientRect(), px = p.in ? p.x : er.width / 2 + Math.cos(T) * er.width * .35, py = p.in ? p.y : er.height / 2 + Math.sin(T * 1.4) * er.height * .3; B.forEach(function (b) { var cx = b.offsetLeft + b.offsetWidth / 2, cy = b.offsetTop + b.offsetHeight / 2, dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy), f = Math.max(0, 1 - d / 150); b.style.transform = 'translate(' + dx * f * .35 + 'px,' + dy * f * .35 + 'px)'; b.firstChild.style.transform = 'translate(' + dx * f * .15 + 'px,' + dy * f * .15 + 'px)'; b.classList.toggle('near', f > .3); }); });
    } },
    { id: 'u-cmdk', t: 'Command palette', jp: '令', hint: 'Type to filter, use ↑ ↓ and Enter. Every action is one keystroke away.', run: function (k, el) {
      var C = [['Pages', 'home', 'Go to home', 'G H'], ['Pages', 'cart', 'Open the shop', 'G S'], ['Pages', 'briefcase', 'Hire Xiraiya', 'G J'], ['Pages', 'book', 'Basic Knowledge', 'G L'], ['Actions', 'moon', 'Toggle dark mode', '⌘ D'], ['Actions', 'copy', 'Copy email address', '⌘ C'], ['Actions', 'download', 'Download invoice', '⌘ I'], ['Actions', 'bot', 'Ask the AI assistant', '⌘ J'], ['Actions', 'send', 'Message on Telegram', '⌘ T'], ['Settings', 'user', 'Account settings', '⌘ ,'], ['Settings', 'bell', 'Notification rules', ''], ['Settings', 'key', 'API keys', '']];
      el.innerHTML = '<div class="ck"><div class="ck-in">' + icon('search') + '<input type="text" placeholder="Type a command or search…" aria-label="Command"><kbd>⌘K</kbd></div><div class="ck-list"><i class="ck-sel"></i><div class="ck-items"></div></div><div class="ck-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> run</span><span class="ck-res"></span></div></div>';
      var inp = $('input', el), box = $('.ck-items', el), sel = $('.ck-sel', el), res = $('.ck-res', el), cur = 0, rows = [], last = 0;
      function match(t, q) { if (!q) return esc(t); var out = '', j = 0, ql = q.toLowerCase(); for (var i = 0; i < t.length; i++) { if (j < ql.length && t[i].toLowerCase() === ql[j]) { out += '<mark>' + esc(t[i]) + '</mark>'; j++; } else out += esc(t[i]); } return j === ql.length ? out : null; }
      function render() {
        var q = inp.value.trim(), g = '', html = '';
        rows = [];
        C.forEach(function (c) { var m = match(c[2], q); if (m == null) return; if (c[0] !== g) { g = c[0]; html += '<small>' + g + '</small>'; } rows.push(c); html += '<div class="ck-r" data-i="' + (rows.length - 1) + '">' + icon(c[1]) + '<span>' + m + '</span>' + (c[3] ? '<kbd>' + c[3] + '</kbd>' : '') + '</div>'; });
        box.innerHTML = html || '<p class="ck-none">No results for “' + esc(q) + '”</p>';
        cur = 0; move(0);
      }
      function move(i) { var rs = $$('.ck-r', box); if (!rs.length) { sel.style.opacity = 0; return; } cur = (i + rs.length) % rs.length; var r = rs[cur]; sel.style.opacity = 1; sel.style.transform = 'translateY(' + r.offsetTop + 'px)'; sel.style.height = r.offsetHeight + 'px'; rs.forEach(function (x, j) { x.classList.toggle('on', j === cur); }); var L = $('.ck-list', el); if (r.offsetTop < L.scrollTop) L.scrollTop = r.offsetTop - 30; else if (r.offsetTop + r.offsetHeight > L.scrollTop + L.clientHeight) L.scrollTop = r.offsetTop + r.offsetHeight - L.clientHeight + 6; }
      function run() { var c = rows[cur]; if (!c) return; res.innerHTML = icon('check') + esc(c[2]); res.classList.remove('in'); void res.offsetWidth; res.classList.add('in'); var r = $$('.ck-r', box)[cur]; if (r) { r.classList.remove('run'); void r.offsetWidth; r.classList.add('run'); } }
      k.on(inp, 'input', function () { last = Date.now(); render(); });
      k.on(inp, 'keydown', function (e) { last = Date.now(); if (e.key === 'ArrowDown') { e.preventDefault(); move(cur + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(cur - 1); } else if (e.key === 'Enter') { e.preventDefault(); run(); } });
      k.on(box, 'pointermove', function (e) { var r = e.target.closest('.ck-r'); if (r && +r.getAttribute('data-i') !== cur) move(+r.getAttribute('data-i')); });
      k.on(box, 'click', function (e) { var r = e.target.closest('.ck-r'); if (r) { last = Date.now(); move(+r.getAttribute('data-i')); run(); } });
      render();
      var Q = ['dark', 'tel', 'inv', 'shop', ''], qi = 0;
      function demo() {
        if (!k.alive() || Date.now() - last < 6000) return k.later(demo, 1500);
        var q = Q[qi++ % Q.length], i = 0; inp.value = ''; render();
        (function type() { if (Date.now() - last < 6000) return k.later(demo, 1500); if (i < q.length) { inp.value += q[i++]; render(); return k.later(type, 130); } k.later(function () { if (!q) { move(cur + 2); k.later(function () { move(cur + 1); }, 350); } run(); k.later(demo, 1600); }, 500); })();
      }
      k.later(demo, 900);
    } },
    { id: 'u-dash', t: 'Analytics dashboard', jp: '析', hint: 'Switch the range and hover the chart. Numbers and curve morph together.', run: function (k, el) {
      var R = { '7D': 7, '30D': 30, '90D': 90 }, N = 32;
      function series(days) { var o = [], v = 40 + days * .2, seed = days * 13.7; for (var i = 0; i < N; i++) { var s = Math.sin(seed + i * 1.7) * 43758.5; v += (s - Math.floor(s) - .42) * 14 + days / 90 * 1.6; v = Math.max(20, v); o.push(Math.round(v * (days / 7 + 1) * 8)); } return o; }
      el.innerHTML = '<div class="db"><div class="db-top"><div><small>Revenue</small><b class="db-title">Overview</b></div><div class="db-seg">' + Object.keys(R).map(function (r) { return '<button type="button" data-r="' + r + '">' + r + '</button>'; }).join('') + '<i></i></div></div>' +
        '<div class="db-kpis">' + [['Revenue', '$', ''], ['Orders', '', ''], ['Conversion', '', '%']].map(function (x, i) { return '<div class="db-k"><small>' + x[0] + '</small><b data-k="' + i + '" data-p="' + x[1] + '" data-s="' + x[2] + '">0</b><em></em></div>'; }).join('') + '</div>' +
        '<div class="db-chart"><svg preserveAspectRatio="none"><defs><linearGradient id="dbg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff7a59" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a59" stop-opacity="0"/></linearGradient></defs><g class="db-grid"></g><path class="db-area" fill="url(#dbg)"/><path class="db-line"/><line class="db-x" y1="0"/><circle class="db-pt" r="5"/></svg><div class="db-tip"><small></small><b></b></div><div class="db-y"></div></div></div>';
      var svg = $('svg', el), area = $('.db-area', el), line = $('.db-line', el), cx = $('.db-x', el), pt = $('.db-pt', el), tip = $('.db-tip', el), ch = $('.db-chart', el), p = pointer(k, ch);
      var cur = series(30), from = cur, to = cur, t0 = 0, range = '30D', last = 0, kv = [0, 0, 0], kt = [0, 0, 0], T = 0;
      function setRange(r) {
        range = r; from = cur.slice(); to = series(R[r]); t0 = T;
        $$('.db-seg button', el).forEach(function (b, i) { var on = b.getAttribute('data-r') === r; b.classList.toggle('on', on); if (on) { var ind = $('.db-seg i', el); ind.style.width = b.offsetWidth + 'px'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px)'; } });
        var sum = to.reduce(function (a, b) { return a + b; }, 0);
        kt = [sum, Math.round(sum / 74), 2.1 + R[r] / 90 * 1.4];
        var d = [[12.4, 8.1, .3], [18.6, 11.2, .6], [24.9, 16.5, .9]][Object.keys(R).indexOf(r)];
        $$('.db-k em', el).forEach(function (e, i) { e.textContent = '▲ ' + d[i] + '%'; });
      }
      $$('.db-seg button', el).forEach(function (b) { k.on(b, 'click', function () { last = Date.now(); setRange(b.getAttribute('data-r')); }); });
      k.later(function () { setRange('30D'); }, 30);
      k.every(function () { if (Date.now() - last > 6000) { var ks = Object.keys(R); setRange(ks[(ks.indexOf(range) + 1) % 3]); } }, 4000);
      function fmt(v, i) { return i === 2 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'); }
      k.loop(function (dt) {
        T += dt;
        var w = ch.clientWidth, h = ch.clientHeight, pad = 8, e = Math.min(1, (T - t0) / .8); e = 1 - Math.pow(1 - e, 3);
        cur = from.map(function (v, i) { return v + (to[i] - v) * e; });
        var mx = Math.max.apply(null, cur) * 1.15, xs = function (i) { return pad + i / (N - 1) * (w - pad * 2); }, ys = function (v) { return h - 18 - v / mx * (h - 34); };
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        var d = '';
        cur.forEach(function (v, i) { if (!i) { d = 'M' + xs(0) + ' ' + ys(v); return; } var x0 = xs(i - 1), x1 = xs(i), c = (x1 - x0) / 2; d += ' C' + (x0 + c) + ' ' + ys(cur[i - 1]) + ' ' + (x1 - c) + ' ' + ys(v) + ' ' + x1 + ' ' + ys(v); });
        line.setAttribute('d', d); area.setAttribute('d', d + ' L' + xs(N - 1) + ' ' + (h - 18) + ' L' + xs(0) + ' ' + (h - 18) + ' Z');
        $('.db-grid', el).innerHTML = [0, 1, 2, 3].map(function (j) { var y = 16 + j * (h - 34) / 3; return '<line x1="0" x2="' + w + '" y1="' + y + '" y2="' + y + '"/>'; }).join('');
        $('.db-y', el).innerHTML = [3, 2, 1, 0].map(function (j) { return '<span style="top:' + (16 + (3 - j) * (h - 34) / 3 - 7) + 'px">$' + Math.round(mx * j / 3 / 1000 * 10) / 10 + 'k</span>'; }).join('');
        var hx = p.in ? p.x : (Math.sin(T * .5) * .5 + .5) * w, i = Math.max(0, Math.min(N - 1, Math.round((hx - pad) / (w - pad * 2) * (N - 1)))), X = xs(i), Y = ys(cur[i]);
        cx.setAttribute('x1', X); cx.setAttribute('x2', X); cx.setAttribute('y2', h - 18); pt.setAttribute('cx', X); pt.setAttribute('cy', Y);
        var days = R[range], dd = new Date(Date.now() - (N - 1 - i) * days / N * 864e5);
        $('small', tip).textContent = dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); $('b', tip).textContent = '$' + Math.round(cur[i]).toLocaleString('en-US');
        tip.style.transform = 'translate(' + Math.max(0, Math.min(w - 110, X - 55)) + 'px,' + Math.max(0, Y - 64) + 'px)';
        $$('.db-k b', el).forEach(function (b, j) { kv[j] += (kt[j] - kv[j]) * Math.min(1, dt * 5); b.textContent = b.getAttribute('data-p') + fmt(kv[j], j) + b.getAttribute('data-s'); });
      });
    } }
  ];
  UI.forEach(function (o) { add({ id: o.id, t: o.t, jp: o.jp, tag: 'ui', size: o.size || 's', kw: 'ui ux component interaction', hint: o.hint, run: o.run }); });
})();
