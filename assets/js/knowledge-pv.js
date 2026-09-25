/* XIRAIYA — Basic Knowledge: live preview engines, part 1
   (web, HTML/CSS, JavaScript, UI). Each engine is PV[kind](k, cfg, lesson);
   k gives the stage element plus timers that are cleared when the lesson changes. */
(function () {
  'use strict';
  var PV = window.XR_PV = window.XR_PV || {};
  var I = function (n) { return window.XRIcon ? window.XRIcon(n) : ''; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- shared helpers ---------- */
  var KW = 'const|let|var|function|return|if|else|for|of|in|while|async|await|import|export|default|from|new|try|catch|finally|throw|class|extends|true|false|null|undefined|typeof|interface|type|string|number|boolean|require|module';
  var SQLKW = 'SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|LEFT|ON|GROUP|BY|ORDER|LIMIT|AND|OR|LIKE|AS|COUNT|SUM|AVG|DESC|ASC|CREATE|TABLE|INDEX|PRIMARY|KEY|BEGIN|COMMIT|ROLLBACK|FOREIGN|REFERENCES|HAVING';
  function hl(code, lang) {
    var hash = /^(bash|sh|docker|yaml|env|py)$/.test(lang || '');
    var sql = lang === 'sql';
    var re = new RegExp(
      '(' + (hash ? '#[^\\n]*|' : '') + (sql ? '--[^\\n]*|' : '') + '\\/\\*[\\s\\S]*?\\*\\/|' + (hash || lang === 'html' ? '' : '\\/\\/[^\\n]*|') + '<!--[\\s\\S]*?-->)' +
      '|("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`[^`]*`)' +
      '|(<\\/?[a-zA-Z][\\w-]*|\\/?>)' +
      '|\\b(\\d+(?:\\.\\d+)?(?:px|ms|s|rem|em|%)?)\\b' +
      '|\\b(' + (sql ? SQLKW : KW + '|GET|POST|PUT|PATCH|DELETE|HTTP|FROM|RUN|COPY|CMD|WORKDIR|EXPOSE') + ')\\b' +
      '|([a-zA-Z_$][\\w$-]*)(?=\\s*\\()' +
      '|([a-z-]+)(?=\\s*:\\s)', 'g');
    var out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 't' : m[4] ? 'n' : m[5] ? 'k' : m[6] ? 'f' : 'p';
      out += '<i class="h-' + cls + '">' + esc(m[0]) + '</i>';
      last = m.index + m[0].length;
      if (!m[0].length) re.lastIndex++;
    }
    return out + esc(code.slice(last));
  }
  function codeBlock(code, lang, cls) {
    return '<pre class="pv-code ' + (cls || '') + '"><code>' + hl(code, lang).split('\n').map(function (l, i) { return '<span class="ln" style="--l:' + i + '">' + (l || ' ') + '</span>'; }).join('') + '</code></pre>';
  }
  function logLine(list, html, cls, max) {
    var li = document.createElement('li');
    if (cls) li.className = cls;
    li.innerHTML = html;
    list.appendChild(li);
    while (list.children.length > (max || 5)) list.removeChild(list.firstChild);
  }
  function type(k, el, text, speed, done) {
    var i = 0; el.textContent = '';
    (function t() {
      if (!k.alive()) return;
      el.textContent = text.slice(0, ++i);
      if (i < text.length) k.later(t, speed || 18); else if (done) done();
    })();
  }
  /* Range / select controls. specs: [key, label, min, max, value, step, unit] or [key, label, [options], value] */
  function controls(host, specs, change) {
    var v = {};
    host.innerHTML = specs.map(function (s) {
      v[s[0]] = s[2] instanceof Array ? s[3] : s[4];
      if (s[2] instanceof Array) {
        return '<div class="pv-ctl sel"><span>' + esc(s[1]) + '</span><div class="pv-seg" data-k="' + s[0] + '">' + s[2].map(function (o) { return '<button type="button" data-v="' + esc(o) + '"' + (o === s[3] ? ' class="on"' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div></div>';
      }
      return '<label class="pv-ctl"><span>' + esc(s[1]) + ' <b data-o="' + s[0] + '">' + s[4] + (s[6] || '') + '</b></span><input type="range" data-k="' + s[0] + '" min="' + s[2] + '" max="' + s[3] + '" step="' + (s[5] || 1) + '" value="' + s[4] + '"></label>';
    }).join('');
    host.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-k'); if (!k) return;
      var s = specs.filter(function (x) { return x[0] === k; })[0];
      v[k] = +e.target.value;
      var o = host.querySelector('[data-o="' + k + '"]'); if (o) o.textContent = e.target.value + (s[6] || '');
      change(v);
    });
    host.addEventListener('click', function (e) {
      var b = e.target.closest('.pv-seg button'); if (!b) return;
      var seg = b.parentElement;
      $$('button', seg).forEach(function (x) { x.classList.toggle('on', x === b); });
      v[seg.getAttribute('data-k')] = b.getAttribute('data-v');
      change(v);
    });
    change(v);
    return v;
  }
  function seg(opts, val, cls) {
    return '<div class="pv-seg ' + (cls || '') + '">' + opts.map(function (o) { var id = o instanceof Array ? o[0] : o, lb = o instanceof Array ? o[1] : o; return '<button type="button" data-v="' + esc(id) + '"' + (id === val ? ' class="on"' : '') + '>' + lb + '</button>'; }).join('') + '</div>';
  }
  function onSeg(k, root, sel, fn) {
    k.on(root, 'click', function (e) {
      var b = e.target.closest(sel + ' button'); if (!b) return;
      $$('button', b.parentElement).forEach(function (x) { x.classList.toggle('on', x === b); });
      fn(b.getAttribute('data-v'), b);
    });
  }
  function nodeIcon(s) {
    s = s.toLowerCase();
    if (/phone|you|user|client|customer/.test(s)) return 'phone';
    if (/browser|page|site|app\b|evil/.test(s)) return 'window';
    if (/db|database|redis|cache/.test(s)) return 'database';
    if (/router|provider|internet|dns|resolver|root|\.dev|name server/.test(s)) return 'globe';
    if (/cdn|edge/.test(s)) return 'zap';
    if (/ai|llm|model|agent|gpt/.test(s)) return 'chip';
    if (/tool|search|vector|doc/.test(s)) return 'search';
    if (/auth|login|google|github|oauth|bank|stripe|pay/.test(s)) return 'lock';
    if (/bot|telegram/.test(s)) return 'bot';
    return 'server';
  }
  var K = { hl: hl, codeBlock: codeBlock, logLine: logLine, type: type, controls: controls, seg: seg, onSeg: onSeg, esc: esc, I: I, $: $, $$: $$, nodeIcon: nodeIcon };
  window.XR_PVK = K;

  /* ================= generic kinds ================= */

  PV.flow = function (k, c) {
    var n = c.n || [], m = c.m || [];
    k.el.innerHTML = '<div class="pv pv-flow">' +
      '<div class="fl-nodes" style="--n:' + n.length + '">' + n.map(function (x, i) { return '<div class="fl-node" data-i="' + i + '"><span class="fl-dot">' + I(nodeIcon(x)) + '</span><b>' + esc(x) + '</b></div>'; }).join('') +
      '<i class="fl-wire"></i><span class="fl-pkt"><span></span></span></div>' +
      '<ol class="pv-log fl-log"></ol>' +
      '<div class="pv-row"><button type="button" class="pv-btn" data-a="replay">' + I('refresh') + ' Replay</button><span class="pv-note fl-count"></span></div></div>';
    var box = $('.fl-nodes', k.el), pkt = $('.fl-pkt', k.el), log = $('.fl-log', k.el), nodes = $$('.fl-node', k.el), cnt = $('.fl-count', k.el);
    var i = 0;
    function pos(idx) {
      var d = $('.fl-dot', nodes[idx]).getBoundingClientRect(), b = box.getBoundingClientRect();
      return [d.left - b.left + d.width / 2, d.top - b.top + d.height / 2];
    }
    function place(idx, anim) {
      var p = pos(idx);
      if (!anim) { pkt.style.transition = 'none'; }
      pkt.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px) translate(-50%,-50%)';
      if (!anim) { void pkt.offsetWidth; pkt.style.transition = ''; }
    }
    function step() {
      if (i >= m.length) { k.later(function () { i = 0; log.innerHTML = ''; step(); }, 2000); pkt.classList.remove('on'); return; }
      var mv = m[i], a = mv[0], b = mv[1];
      nodes.forEach(function (x, j) { x.classList.toggle('from', j === a); x.classList.remove('hit'); });
      place(a, false);
      pkt.firstChild.textContent = mv[2] || '';
      pkt.classList.add('on');
      pkt.classList.toggle('back', b < a);
      cnt.textContent = 'Step ' + (i + 1) + ' of ' + m.length;
      k.later(function () { place(b, true); }, 60);
      k.later(function () {
        nodes[b].classList.add('hit');
        logLine(log, '<b>' + esc(n[a]) + '</b>' + I('arrow-right') + '<b>' + esc(n[b]) + '</b><code>' + esc(mv[2] || '') + '</code>');
        i++; step();
      }, 1050);
    }
    k.on($('[data-a="replay"]', k.el), 'click', function () { k.reset(); PV.flow(k, c); });
    k.later(step, 250);
  };

  PV.layers = function (k, c) {
    var L = c.l || [];
    k.el.innerHTML = '<div class="pv pv-layers"><div class="ly-stack" style="--n:' + L.length + '">' +
      L.map(function (x, i) { return '<button type="button" class="ly-plate" style="--i:' + i + '" data-i="' + i + '"><span>' + esc(x[0]) + '</span></button>'; }).join('') +
      '</div><div class="ly-desc"><span class="ly-num"></span><b></b><p></p></div></div>';
    var plates = $$('.ly-plate', k.el), cur = -1, hold = 0;
    function sel(i) {
      cur = i;
      plates.forEach(function (p, j) { p.classList.toggle('on', j === i); });
      $('.ly-num', k.el).textContent = 'Layer ' + (i + 1) + ' / ' + L.length;
      $('.ly-desc b', k.el).textContent = L[i][0];
      $('.ly-desc p', k.el).textContent = L[i][1];
      var d = $('.ly-desc', k.el); d.classList.remove('in'); void d.offsetWidth; d.classList.add('in');
    }
    k.on(k.el, 'click', function (e) { var p = e.target.closest('.ly-plate'); if (p) { hold = Date.now(); sel(+p.getAttribute('data-i')); } });
    sel(0);
    k.every(function () { if (Date.now() - hold > 5000) sel((cur + 1) % L.length); }, 2200);
  };

  PV.compare = function (k, c) {
    function side(s, cls) {
      var parts = String(s[1]).split(/\s·\s/);
      return '<div class="cm-side ' + cls + '"><span class="cm-tag">' + (cls === 'a' ? 'A' : 'B') + '</span><h4>' + esc(s[0]) + '</h4><ul>' + parts.map(function (p, i) { return '<li style="--i:' + i + '">' + I(cls === 'a' ? 'dot' : 'check') + esc(p) + '</li>'; }).join('') + '</ul></div>';
    }
    k.el.innerHTML = '<div class="pv pv-cmp">' + side(c.a, 'a') + '<div class="cm-vs"><span>VS</span></div>' + side(c.b, 'b') + '</div>' +
      '<div class="pv-row pv-center">' + seg([['a', c.a[0]], ['b', c.b[0]], ['both', 'Side by side']], 'both', 'cm-pick') + '</div>';
    var root = $('.pv-cmp', k.el);
    onSeg(k, k.el, '.cm-pick', function (v) { root.setAttribute('data-f', v); });
  };

  PV.code = function (k, c) {
    var html = c.o === '__html__';
    k.el.innerHTML = '<div class="pv pv-codebox"><div class="cb-win"><div class="cb-bar"><i></i><i></i><i></i><span>' + esc(c.lang || 'code') + '</span><button type="button" class="pv-btn sm cb-run">' + I('play') + ' Run</button></div>' +
      codeBlock(c.c, c.lang, 'lines') + '</div>' +
      '<div class="cb-out"><div class="cb-out-h">' + I(html ? 'window' : 'terminal') + (html ? 'Browser' : 'Output') + '<span class="cb-st"></span></div>' +
      (html ? '<iframe title="Rendered HTML" sandbox="" class="cb-frame"></iframe>' : '<pre class="cb-o"></pre>') + '</div></div>';
    var out = $('.cb-o', k.el), fr = $('.cb-frame', k.el), st = $('.cb-st', k.el), pre = $('.pv-code', k.el);
    function run() {
      pre.classList.remove('lines'); void pre.offsetWidth; pre.classList.add('lines');
      st.textContent = 'running…'; st.className = 'cb-st run';
      if (out) out.textContent = '';
      if (fr) fr.srcdoc = '';
      k.later(function () {
        st.textContent = 'done'; st.className = 'cb-st ok';
        if (fr) fr.srcdoc = '<style>body{font:15px/1.5 system-ui,sans-serif;margin:14px;color:#1f1813;background:#fffdf8}h1{font-size:22px;margin:0 0 6px}button{padding:8px 14px;border-radius:8px;border:0;background:#c4321d;color:#fff}</style>' + c.c;
        else type(k, out, c.o || '', 14);
      }, Math.min(1600, 400 + c.c.split('\n').length * 60));
    }
    k.on($('.cb-run', k.el), 'click', run);
    run();
  };

  PV.steps = function (k, c) {
    var S = c.s || [];
    k.el.innerHTML = '<div class="pv pv-steps"><div class="st-bar"><i></i></div><ol class="st-list">' +
      S.map(function (s, i) { return '<li data-i="' + i + '"><span class="st-n">' + (i + 1) + '</span><div><b>' + esc(s[0]) + '</b><p>' + esc(s[1]) + '</p></div><span class="st-ok">' + I('check') + '</span></li>'; }).join('') + '</ol></div>';
    var li = $$('.st-list li', k.el), bar = $('.st-bar i', k.el), cur = 0, hold = 0;
    function go(i) {
      cur = i;
      li.forEach(function (x, j) { x.classList.toggle('on', j === i); x.classList.toggle('done', j < i); });
      bar.style.width = ((i + 1) / S.length * 100) + '%';
    }
    k.on(k.el, 'click', function (e) { var x = e.target.closest('.st-list li'); if (x) { hold = Date.now(); go(+x.getAttribute('data-i')); } });
    go(0);
    k.every(function () { if (Date.now() - hold > 5000) go((cur + 1) % S.length); }, 1700);
  };

  PV.term = function (k, c) {
    var C = c.c || [];
    k.el.innerHTML = '<div class="pv pv-term"><div class="cb-bar"><i></i><i></i><i></i><span>terminal — xiraiya@dev</span></div><div class="tm-body"></div></div>';
    var body = $('.tm-body', k.el), i = 0;
    function next() {
      if (!k.alive()) return;
      if (i >= C.length) { k.later(function () { body.innerHTML = ''; i = 0; next(); }, 3000); return; }
      var row = document.createElement('div'); row.className = 'tm-cmd'; body.appendChild(row);
      var cur = document.createElement('i'); cur.className = 'tm-caret';
      type(k, row, C[i][0], 38, function () {
        k.later(function () {
          if (C[i][1]) { var o = document.createElement('div'); o.className = 'tm-out'; o.textContent = C[i][1]; body.appendChild(o); }
          i++; k.later(next, 700);
        }, 380);
      });
      row.after(cur);
      k.later(function () { cur.remove(); }, C[i][0].length * 38 + 360);
    }
    next();
  };

  /* ================= web ================= */

  PV.url = function (k, c) {
    var P = [['https://', 'Protocol', 'How browser and server talk. HTTPS means the connection is encrypted.'], ['shop.', 'Subdomain', 'A separate part of the site. You can create as many as you like for free.'], ['xiraiya', 'Domain', 'The name you rent from a registrar, yearly.'], ['.dev', 'TLD', 'Top-level domain: .com, .dev, .shop, .bd …'], ['/products/keyboard', 'Path', 'Which page or file on the server.'], ['?color=red', 'Query', 'Extra options the page can read, like filters.'], ['#reviews', 'Fragment', 'Jumps to a spot on the page. Never sent to the server.']];
    var ssl = c.dns;
    k.el.innerHTML = '<div class="pv pv-url"><div class="ur-bar"><span class="ur-lock">' + I('lock') + '</span><div class="ur-text">' + P.map(function (p, i) { return '<span class="ur-p" data-i="' + i + '" style="--i:' + i + '">' + esc(p[0]) + '</span>'; }).join('') + '</div></div>' +
      (ssl ? '<div class="ur-cert"><div class="uc-h">' + I('shield') + ' <b>Connection is secure</b></div><dl><dt>Issued to</dt><dd>shop.xiraiya.dev</dd><dt>Issued by</dt><dd>Let’s Encrypt R11</dd><dt>Valid</dt><dd>90 days · auto-renews</dd><dt>Cipher</dt><dd>TLS 1.3 · AES-256-GCM</dd></dl><div class="uc-hs">' + ['Client hello', 'Certificate', 'Key exchange', 'Encrypted'].map(function (x, i) { return '<span style="--i:' + i + '">' + x + '</span>'; }).join('') + '</div></div>' : '') +
      '<div class="ur-legend">' + P.map(function (p, i) { return '<button type="button" class="ur-l" data-i="' + i + '"><i style="--i:' + i + '"></i>' + p[1] + '</button>'; }).join('') + '</div>' +
      '<div class="ur-desc"><b></b><p></p></div></div>';
    var parts = $$('.ur-p', k.el), leg = $$('.ur-l', k.el), cur = 0, hold = 0;
    function sel(i) {
      cur = i;
      parts.forEach(function (p, j) { p.classList.toggle('on', j === i); });
      leg.forEach(function (p, j) { p.classList.toggle('on', j === i); });
      $('.ur-desc b', k.el).textContent = P[i][1] + ' — ' + P[i][0];
      $('.ur-desc p', k.el).textContent = P[i][2];
    }
    k.on(k.el, 'click', function (e) { var x = e.target.closest('[data-i]'); if (x && (x.classList.contains('ur-l') || x.classList.contains('ur-p'))) { hold = Date.now(); sel(+x.getAttribute('data-i')); } });
    sel(0);
    k.every(function () { if (Date.now() - hold > 5000) sel((cur + 1) % P.length); }, 1800);
  };

  PV.status = function (k) {
    var S = [[200, 'OK', 'Everything worked. Here is your page.'], [201, 'Created', 'Your new item was saved (after a POST).'], [204, 'No Content', 'Done. Nothing to send back.'], [301, 'Moved Permanently', 'This page lives at a new address now.'], [304, 'Not Modified', 'Nothing changed. Use your cached copy.'], [400, 'Bad Request', 'The request was broken or missing data.'], [401, 'Unauthorized', 'Please log in first.'], [403, 'Forbidden', 'You are logged in, but not allowed here.'], [404, 'Not Found', 'There is no page at this address.'], [429, 'Too Many Requests', 'Slow down. You hit the rate limit.'], [500, 'Internal Server Error', 'The server code crashed.'], [503, 'Service Unavailable', 'The server is down or overloaded.']];
    k.el.innerHTML = '<div class="pv pv-status"><div class="ss-grid">' + S.map(function (s, i) { return '<button type="button" class="ss-c c' + String(s[0])[0] + '" data-i="' + i + '">' + s[0] + '</button>'; }).join('') + '</div>' +
      '<div class="ss-view"><div class="cb-bar"><i></i><i></i><i></i><span class="ss-url">GET /products</span></div><div class="ss-body"><b class="ss-big"></b><div><h4></h4><p></p></div></div></div>' +
      '<div class="ss-key"><span class="c2">2xx success</span><span class="c3">3xx redirect</span><span class="c4">4xx your mistake</span><span class="c5">5xx server mistake</span></div></div>';
    var btn = $$('.ss-c', k.el), cur = 0, hold = 0;
    function sel(i) {
      cur = i;
      btn.forEach(function (b, j) { b.classList.toggle('on', j === i); });
      var v = $('.ss-view', k.el); v.className = 'ss-view c' + String(S[i][0])[0];
      $('.ss-big', k.el).textContent = S[i][0];
      $('.ss-view h4', k.el).textContent = S[i][1];
      $('.ss-view p', k.el).textContent = S[i][2];
      var b = $('.ss-body', k.el); b.classList.remove('in'); void b.offsetWidth; b.classList.add('in');
    }
    k.on(k.el, 'click', function (e) { var x = e.target.closest('.ss-c'); if (x) { hold = Date.now(); sel(+x.getAttribute('data-i')); } });
    sel(0);
    k.every(function () { if (Date.now() - hold > 5000) sel((cur + 1) % S.length); }, 1900);
  };

  /* ================= HTML & CSS ================= */

  PV.dom = function (k) {
    var T = [[0, 'html', ''], [1, 'head', ''], [2, 'title', ''], [1, 'body', 'body'], [2, 'header', 'header'], [3, 'h1', 'h1'], [3, 'nav', 'nav'], [2, 'main', 'main'], [3, 'p', 'p'], [3, 'button', 'button']];
    k.el.innerHTML = '<div class="pv pv-dom"><div class="dm-tree">' + T.map(function (t, i) { return '<button type="button" class="dm-n" data-i="' + i + '" style="--d:' + t[0] + '"><i></i>&lt;' + t[1] + '&gt;</button>'; }).join('') + '</div>' +
      '<div class="dm-page" data-d="body"><div class="dm-hd" data-d="header"><b data-d="h1">My shop</b><span data-d="nav">Home · Shop · Cart</span></div><div class="dm-main" data-d="main"><p data-d="p">Fresh keyboards every week.</p><button type="button" data-d="button" class="dm-buy">Buy now</button></div></div>' +
      '<div class="dm-js pv-row"><code class="dm-code">document.querySelector(\'h1\')</code><button type="button" class="pv-btn sm dm-run">' + I('play') + ' Change the h1 with JS</button></div></div>';
    var rows = $$('.dm-n', k.el), cur = 3, hold = 0, n = 0;
    function sel(i) {
      cur = i;
      rows.forEach(function (r, j) { r.classList.toggle('on', j === i); });
      $$('[data-d]', k.el).forEach(function (e) { e.classList.toggle('dm-hit', e.getAttribute('data-d') === T[i][2] && !!T[i][2]); });
      $('.dm-code', k.el).textContent = "document.querySelector('" + T[i][1] + "')";
    }
    k.on(k.el, 'click', function (e) {
      var r = e.target.closest('.dm-n'); if (r) { hold = Date.now(); sel(+r.getAttribute('data-i')); }
      if (e.target.closest('.dm-run')) {
        hold = Date.now(); sel(5);
        var h = $('[data-d="h1"]', k.el), names = ['Hello, DOM!', 'Changed by JS', 'My shop'];
        h.textContent = names[n++ % 3]; h.classList.remove('dm-flash'); void h.offsetWidth; h.classList.add('dm-flash');
        $('.dm-code', k.el).textContent = "document.querySelector('h1').textContent = '" + h.textContent + "'";
      }
    });
    sel(3);
    k.every(function () { if (Date.now() - hold > 5000) sel((cur + 1) % T.length); }, 1500);
  };

  PV.selector = function (k) {
    var EX = ['li', '.hot', '#buy', 'ul > li:first-child', 'nav a', 'a[href^="https"]', '.card button', 'li:nth-child(odd)', 'p b', '*'];
    k.el.innerHTML = '<div class="pv pv-sel"><div class="sl-in"><span>$(</span><input type="text" spellcheck="false" aria-label="CSS selector" value="li"><span>)</span><b class="sl-count"></b></div>' +
      '<div class="sl-dom"><nav id="menu" data-tag="nav#menu"><a href="/" data-tag="a">Home</a><a href="https://x.com" class="ext" data-tag="a.ext">X.com</a></nav>' +
      '<ul class="list" data-tag="ul.list"><li data-tag="li">Tea</li><li class="hot" data-tag="li.hot">Coffee</li><li data-tag="li">Juice</li><li data-tag="li">Water</li></ul>' +
      '<div class="card" data-tag="div.card"><h4 data-tag="h4">Card</h4><button type="button" id="buy" class="btn" data-tag="button#buy">Buy</button></div>' +
      '<p data-tag="p">Hello <b data-tag="b">world</b></p></div>' +
      '<div class="sl-ex">' + EX.map(function (x) { return '<button type="button" class="pv-chip">' + esc(x) + '</button>'; }).join('') + '</div>' +
      '<div class="pv-note sl-spec"></div></div>';
    var inp = $('input', k.el), dom = $('.sl-dom', k.el), cnt = $('.sl-count', k.el), spec = $('.sl-spec', k.el), hold = 0, ei = 0;
    function run() {
      $$('.sl-hit', dom).forEach(function (e) { e.classList.remove('sl-hit'); });
      var s = inp.value.trim(), list = [];
      try { list = s ? $$(s, dom) : []; cnt.textContent = list.length + ' match' + (list.length === 1 ? '' : 'es'); cnt.className = 'sl-count'; }
      catch (e) { cnt.textContent = 'invalid'; cnt.className = 'sl-count bad'; }
      list.forEach(function (e, i) { e.style.setProperty('--i', i); e.classList.add('sl-hit'); });
      var ids = (s.match(/#[\w-]+/g) || []).length, cls = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length, el = (s.replace(/"[^"]*"|\[[^\]]+\]/g, '').match(/(^|[\s>+~(])[a-z]+/gi) || []).length;
      spec.innerHTML = 'Specificity <b>(' + ids + ', ' + cls + ', ' + el + ')</b> — ids, classes, elements. Higher wins when rules clash.';
    }
    k.on(inp, 'input', function () { hold = Date.now(); run(); });
    k.on(k.el, 'click', function (e) { var b = e.target.closest('.pv-chip'); if (b) { hold = Date.now(); inp.value = b.textContent; run(); } });
    run();
    k.every(function () { if (Date.now() - hold > 6000) { inp.value = EX[++ei % EX.length]; run(); } }, 2200);
  };

  function play(k, o) {
    k.el.innerHTML = '<div class="pv pv-play"><div class="pl-stage ' + (o.cls || '') + '">' + o.stage + '</div><div class="pl-side"><div class="pv-ctls"></div>' + (o.noCode ? '' : '<pre class="pv-code pl-code"><code></code></pre>') + '</div></div>';
    var stage = $('.pl-stage', k.el), code = $('.pl-code code', k.el);
    controls($('.pv-ctls', k.el), o.ctl, function (v) {
      var css = o.apply(v, stage);
      if (code && css) code.innerHTML = hl(css, 'css');
    });
    return stage;
  }
  K.play = play;

  var CSSDEMO = {
    box: { stage: '<div class="bx"><span class="bx-l">margin</span><div class="bx-b"><span class="bx-l">border</span><div class="bx-p"><span class="bx-l">padding</span><div class="bx-c">content</div></div></div></div><div class="bx-sum"></div>',
      ctl: [['w', 'Width', 60, 200, 120, 1, 'px'], ['p', 'Padding', 0, 40, 18, 1, 'px'], ['b', 'Border', 0, 16, 4, 1, 'px'], ['m', 'Margin', 0, 40, 16, 1, 'px']],
      apply: function (v, s) {
        var bx = $('.bx', s); bx.style.padding = v.m + 'px';
        $('.bx-b', s).style.borderWidth = v.b + 'px'; $('.bx-p', s).style.padding = v.p + 'px'; $('.bx-c', s).style.width = v.w + 'px';
        $('.bx-sum', s).innerHTML = 'Rendered width = <b>' + v.w + '</b> + 2×' + v.p + ' + 2×' + v.b + ' = <b>' + (v.w + 2 * v.p + 2 * v.b) + 'px</b>';
        return '.box {\n  width: ' + v.w + 'px;\n  padding: ' + v.p + 'px;\n  border: ' + v.b + 'px solid;\n  margin: ' + v.m + 'px;\n}\n/* tip: box-sizing: border-box\n   keeps the width at ' + v.w + 'px */';
      } },
    flex: { stage: '<div class="fx">' + [1, 2, 3, 4].map(function (i) { return '<span style="--i:' + i + '">' + i + '</span>'; }).join('') + '</div>',
      ctl: [['dir', 'flex-direction', ['row', 'column'], 'row'], ['jc', 'justify-content', ['start', 'center', 'space-between', 'space-evenly', 'end'], 'center'], ['ai', 'align-items', ['stretch', 'start', 'center', 'end'], 'center'], ['gap', 'Gap', 0, 30, 10, 1, 'px']],
      apply: function (v, s) {
        var f = $('.fx', s); f.style.flexDirection = v.dir; f.style.justifyContent = v.jc; f.style.alignItems = v.ai; f.style.gap = v.gap + 'px';
        return '.row {\n  display: flex;\n  flex-direction: ' + v.dir + ';\n  justify-content: ' + v.jc + ';\n  align-items: ' + v.ai + ';\n  gap: ' + v.gap + 'px;\n}';
      } },
    grid: { stage: '<div class="gd">' + [1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return '<span>' + i + '</span>'; }).join('') + '</div>',
      ctl: [['cols', 'Columns', 1, 6, 3, 1, ''], ['gap', 'Gap', 0, 24, 8, 1, 'px'], ['row', 'Row height', 28, 80, 44, 1, 'px'], ['span', 'Item 1 spans', ['1', '2', '3'], '2']],
      apply: function (v, s) {
        var g = $('.gd', s); g.style.gridTemplateColumns = 'repeat(' + v.cols + ', 1fr)'; g.style.gap = v.gap + 'px'; g.style.gridAutoRows = v.row + 'px';
        g.firstChild.style.gridColumn = 'span ' + Math.min(+v.span, v.cols);
        return '.grid {\n  display: grid;\n  grid-template-columns: repeat(' + v.cols + ', 1fr);\n  grid-auto-rows: ' + v.row + 'px;\n  gap: ' + v.gap + 'px;\n}\n.grid > :first-child {\n  grid-column: span ' + Math.min(+v.span, v.cols) + ';\n}';
      } },
    color: { stage: '<div class="cl"><div class="cl-sw"><b>Aa</b><span class="cl-hex"></span></div><div class="cl-shades"></div><div class="cl-ratio"></div></div>',
      ctl: [['h', 'Hue', 0, 360, 8, 1, '°'], ['s', 'Saturation', 0, 100, 74, 1, '%'], ['l', 'Lightness', 5, 95, 44, 1, '%']],
      apply: function (v, s) {
        var hex = hslHex(v.h, v.s, v.l), rgb = hexRgb(hex);
        var sw = $('.cl-sw', s); sw.style.background = hex;
        var cw = contrast(rgb, [255, 255, 255]), cb = contrast(rgb, [0, 0, 0]);
        sw.style.color = cw > cb ? '#fff' : '#000';
        $('.cl-hex', s).textContent = hex.toUpperCase();
        $('.cl-shades', s).innerHTML = [92, 75, 55, 35, 18].map(function (l) { return '<i style="background:hsl(' + v.h + ' ' + v.s + '% ' + l + '%)"></i>'; }).join('');
        $('.cl-ratio', s).innerHTML = '<span>on white <b>' + cw.toFixed(2) + ':1</b> ' + badge(cw) + '</span><span>on black <b>' + cb.toFixed(2) + ':1</b> ' + badge(cb) + '</span>';
        return ':root {\n  --brand: ' + hex + ';\n  --brand: rgb(' + rgb.join(' ') + ');\n  --brand: hsl(' + v.h + ' ' + v.s + '% ' + v.l + '%);\n}';
      } },
    type: { stage: '<div class="ty"><h3>Build something legendary</h3><p>Good type is most of good design. Size, line height and weight make text easy to read on every screen.</p></div>',
      ctl: [['fs', 'Heading size', 16, 56, 34, 1, 'px'], ['lh', 'Line height', 1, 2, 1.5, 0.05, ''], ['fw', 'Weight', 300, 900, 700, 100, ''], ['ls', 'Letter spacing', -4, 10, 0, 1, '%'], ['ff', 'Family', ['serif', 'sans', 'mono'], 'serif']],
      apply: function (v, s) {
        var fam = { serif: 'var(--font-display)', sans: 'var(--font-body)', mono: 'var(--font-mono)' }[v.ff];
        var h = $('h3', s), p = $('p', s);
        h.style.fontSize = v.fs + 'px'; h.style.fontWeight = v.fw; h.style.fontFamily = fam; h.style.letterSpacing = (v.ls / 100) + 'em';
        p.style.lineHeight = v.lh; p.style.fontFamily = v.ff === 'mono' ? fam : '';
        return 'h1 {\n  font-family: ' + v.ff + ';\n  font-size: ' + v.fs + 'px;\n  font-weight: ' + v.fw + ';\n  letter-spacing: ' + (v.ls / 100) + 'em;\n}\np { line-height: ' + v.lh + '; }';
      } },
    shadow: { stage: '<div class="sh"><b>Card</b><span>Soft shadows lift things off the page.</span></div>',
      ctl: [['x', 'Offset X', -30, 30, 0, 1, 'px'], ['y', 'Offset Y', -30, 40, 18, 1, 'px'], ['b', 'Blur', 0, 80, 40, 1, 'px'], ['sp', 'Spread', -20, 20, -10, 1, 'px'], ['a', 'Opacity', 0, 80, 30, 1, '%']],
      apply: function (v, s) {
        var val = v.x + 'px ' + v.y + 'px ' + v.b + 'px ' + v.sp + 'px rgba(40,20,10,' + (v.a / 100) + ')';
        $('.sh', s).style.boxShadow = val;
        return '.card {\n  box-shadow:\n    ' + val + ';\n}';
      } },
    transform: { stage: '<div class="tf"><div class="tf-card"><b>transform</b><span>No layout shift, GPU friendly.</span></div></div>',
      ctl: [['r', 'rotate', -180, 180, -8, 1, 'deg'], ['s', 'scale', 0.5, 1.6, 1, 0.05, ''], ['k', 'skew', -30, 30, 0, 1, 'deg'], ['x', 'translateX', -60, 60, 0, 1, 'px'], ['ry', 'rotateY (3D)', -80, 80, 20, 1, 'deg']],
      apply: function (v, s) {
        var t = 'translateX(' + v.x + 'px) rotate(' + v.r + 'deg) rotateY(' + v.ry + 'deg) scale(' + v.s + ') skew(' + v.k + 'deg)';
        $('.tf-card', s).style.transform = t;
        return '.card {\n  transform:\n    translateX(' + v.x + 'px)\n    rotate(' + v.r + 'deg)\n    rotateY(' + v.ry + 'deg)\n    scale(' + v.s + ')\n    skew(' + v.k + 'deg);\n}';
      } },
    vars: { stage: '<div class="tk"><div class="tk-card"><span class="tk-chip">New</span><b>Design tokens</b><p>Change one variable, the whole UI follows.</p><div class="tk-in">you@mail.com</div><button type="button">Subscribe</button></div></div>',
      ctl: [['h', '--brand hue', 0, 360, 8, 1, '°'], ['r', '--radius', 0, 28, 12, 1, 'px'], ['sp', '--space', 6, 22, 14, 1, 'px'], ['mode', 'Theme', ['light', 'dark'], 'light']],
      apply: function (v, s) {
        var t = $('.tk', s);
        t.style.setProperty('--tb', 'hsl(' + v.h + ' 72% 46%)'); t.style.setProperty('--tr', v.r + 'px'); t.style.setProperty('--ts', v.sp + 'px');
        t.classList.toggle('dark', v.mode === 'dark');
        return ':root {\n  --brand: hsl(' + v.h + ' 72% 46%);\n  --radius: ' + v.r + 'px;\n  --space: ' + v.sp + 'px;\n  --bg: ' + (v.mode === 'dark' ? '#16120f' : '#fffdf8') + ';\n}\n.button {\n  background: var(--brand);\n  border-radius: var(--radius);\n  padding: var(--space);\n}';
      } }
  };
  function hslHex(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l), f = function (n) { var k2 = (n + h / 30) % 12, c = l - a * Math.max(-1, Math.min(k2 - 3, 9 - k2, 1)); return Math.round(255 * c).toString(16).padStart(2, '0'); };
    return '#' + f(0) + f(8) + f(4);
  }
  function hexRgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function lum(c) { return c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function badge(r) { return r >= 7 ? '<em class="ok">AAA</em>' : r >= 4.5 ? '<em class="ok">AA</em>' : r >= 3 ? '<em class="mid">AA large</em>' : '<em class="bad">Fail</em>'; }
  K.hslHex = hslHex; K.hexRgb = hexRgb; K.contrast = contrast; K.badge = badge;

  PV.css = function (k, c) { var d = CSSDEMO[c.demo] || CSSDEMO.box; play(k, { stage: d.stage, ctl: d.ctl, apply: d.apply, cls: 'pl-' + c.demo }); };

  PV.resp = function (k) {
    k.el.innerHTML = '<div class="pv pv-resp"><div class="pv-row rs-top">' + seg([['360', I('phone') + ' Phone'], ['768', I('tablet') + ' Tablet'], ['1280', I('laptop') + ' Desktop']], '360', 'rs-dev') +
      '<label class="pv-ctl rs-w"><span>Width <b>360px</b></span><input type="range" min="320" max="1280" value="360"></label></div>' +
      '<div class="rs-wrap"><div class="rs-frame"><div class="rs-site"><div class="rs-nav"><b>Shop</b><span class="rs-links"><i>Home</i><i>Shop</i><i>Cart</i></span><span class="rs-burger"><i></i><i></i><i></i></span></div><div class="rs-hero"><h4>New season</h4><p>Fresh drops every week.</p></div><div class="rs-grid">' +
      [1, 2, 3, 4, 5, 6].map(function (i) { return '<div class="rs-card"><i></i><b>Item ' + i + '</b></div>'; }).join('') + '</div></div></div></div>' +
      '<pre class="pv-code rs-mq"></pre></div>';
    var wrap = $('.rs-wrap', k.el), fr = $('.rs-frame', k.el), rng = $('.rs-w input', k.el), lab = $('.rs-w b', k.el), mq = $('.rs-mq', k.el), hold = 0, auto = 0;
    function set(w) {
      w = +w; rng.value = w; lab.textContent = w + 'px';
      var cols = w < 600 ? 1 : w < 1000 ? 2 : 3;
      var avail = wrap.clientWidth - 4, sc = Math.min(1, avail / w);
      fr.style.width = w + 'px'; fr.style.transform = 'scale(' + sc + ')';
      wrap.style.height = (fr.offsetHeight * sc + 4) + 'px';
      fr.setAttribute('data-bp', cols === 1 ? 'sm' : cols === 2 ? 'md' : 'lg');
      $('.rs-grid', k.el).style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      mq.innerHTML = hl('.grid { grid-template-columns: 1fr; }' + (w >= 600 ? '' : '   /* active */') + '\n@media (min-width: 600px) {\n  .grid { grid-template-columns: 1fr 1fr; }' + (w >= 600 && w < 1000 ? ' /* active */' : '') + '\n}\n@media (min-width: 1000px) {\n  .grid { grid-template-columns: repeat(3, 1fr); }' + (w >= 1000 ? ' /* active */' : '') + '\n}', 'css');
      $$('.rs-dev button', k.el).forEach(function (b) { b.classList.toggle('on', Math.abs(+b.getAttribute('data-v') - w) < 40); });
    }
    k.on(rng, 'input', function () { hold = Date.now(); set(rng.value); });
    onSeg(k, k.el, '.rs-dev', function (v) { hold = Date.now(); set(v); });
    set(360);
    var W = [360, 768, 1280];
    k.every(function () { if (Date.now() - hold > 5000) set(W[++auto % 3]); }, 2600);
    k.on(window, 'resize', function () { set(rng.value); });
  };

  /* ================= JavaScript ================= */

  PV.events = function (k, c) {
    if (c.toggle) return domManip(k);
    k.el.innerHTML = '<div class="pv pv-ev"><div class="ev-pad"><button type="button" class="pv-btn primary ev-b">' + I('cursor') + ' Click me</button><input class="ev-i" placeholder="Type something" aria-label="Type something"><div class="ev-area">Move or tap in here<span class="ev-dot"></span></div><span class="ev-cur">' + I('mouse') + '</span></div>' +
      '<ol class="pv-log ev-log"></ol><div class="pv-note">Every line is a real event your browser fired. Try it yourself.</div></div>';
    var log = $('.ev-log', k.el), b = $('.ev-b', k.el), inp = $('.ev-i', k.el), area = $('.ev-area', k.el), dot = $('.ev-dot', k.el), cur = $('.ev-cur', k.el), user = false, lastMove = 0;
    function L(ev, what) { logLine(log, '<code>' + ev + '</code><span>' + what + '</span>', 'ev-' + ev, 6); }
    k.on(b, 'click', function (e) { L('click', 'button · x ' + Math.round(e.offsetX) + ', y ' + Math.round(e.offsetY)); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
    k.on(inp, 'keydown', function (e) { L('keydown', 'key = "' + esc(e.key) + '"'); });
    k.on(inp, 'input', function () { L('input', 'value = "' + esc(inp.value.slice(-24)) + '"'); });
    k.on(inp, 'focus', function () { L('focus', 'the input is active'); });
    k.on(area, 'pointerenter', function () { L('pointerenter', 'entered the box'); });
    k.on(area, 'pointermove', function (e) {
      var r = area.getBoundingClientRect(); dot.style.transform = 'translate(' + (e.clientX - r.left) + 'px,' + (e.clientY - r.top) + 'px)';
      if (Date.now() - lastMove > 400) { lastMove = Date.now(); L('pointermove', 'x ' + Math.round(e.clientX - r.left) + ', y ' + Math.round(e.clientY - r.top)); }
    });
    k.on(k.el, 'pointerdown', function (e) { if (e.isTrusted) { user = true; cur.hidden = true; } }, true);
    /* A ghost cursor shows the events until the visitor takes over. */
    function ghost() {
      if (user || !k.alive()) return;
      var pad = $('.ev-pad', k.el).getBoundingClientRect(), br = b.getBoundingClientRect();
      cur.style.transform = 'translate(' + (br.left - pad.left + br.width / 2) + 'px,' + (br.top - pad.top + br.height / 2) + 'px)';
      k.later(function () { if (!user) b.click(); }, 800);
      k.later(function () {
        if (user) return;
        var ir = inp.getBoundingClientRect(); cur.style.transform = 'translate(' + (ir.left - pad.left + 30) + 'px,' + (ir.top - pad.top + ir.height / 2) + 'px)';
        inp.value = '';
        var word = 'hello', i = 0;
        (function t() {
          if (user || !k.alive() || i >= word.length) return;
          var ch = word[i++]; inp.value += ch;
          L('keydown', 'key = "' + ch + '"'); L('input', 'value = "' + inp.value + '"');
          k.later(t, 260);
        })();
      }, 1700);
      k.later(ghost, 4800);
    }
    k.later(ghost, 500);
  };

  function domManip(k) {
    k.el.innerHTML = '<div class="pv pv-dm"><ul class="dmx-list"><li>Tea</li><li>Coffee</li></ul>' +
      '<div class="dmx-acts">' + [['add', 'plus', 'Add item'], ['cls', 'sparkle', 'Toggle class'], ['txt', 'pen', 'Change text'], ['del', 'trash', 'Remove last']].map(function (a) { return '<button type="button" class="pv-btn sm" data-a="' + a[0] + '">' + I(a[1]) + a[2] + '</button>'; }).join('') + '</div>' +
      '<pre class="pv-code dmx-code"><code></code></pre></div>';
    var ul = $('.dmx-list', k.el), code = $('.dmx-code code', k.el), hold = 0, n = 0, auto = 0;
    var ITEMS = ['Juice', 'Water', 'Milk', 'Soda', 'Lassi'];
    var ACT = {
      add: function () { var li = document.createElement('li'); li.textContent = ITEMS[n++ % ITEMS.length]; li.className = 'new'; ul.appendChild(li); if (ul.children.length > 6) ul.removeChild(ul.firstChild); return "const li = document.createElement('li');\nli.textContent = '" + li.textContent + "';\nlist.append(li);"; },
      cls: function () { var li = ul.lastElementChild; if (!li) return '// nothing to style'; li.classList.toggle('star'); return "list.lastElementChild\n  .classList.toggle('star');"; },
      txt: function () { var li = ul.firstElementChild; if (!li) return '// nothing to change'; li.textContent = li.textContent === 'Green tea' ? 'Tea' : 'Green tea'; li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash'); return "list.firstElementChild\n  .textContent = '" + li.textContent + "';"; },
      del: function () { var li = ul.lastElementChild; if (!li) return '// list is empty'; li.classList.add('bye'); k.later(function () { li.remove(); }, 300); return 'list.lastElementChild.remove();'; }
    };
    function run(a) { code.innerHTML = hl(ACT[a](), 'js'); }
    k.on(k.el, 'click', function (e) { var b = e.target.closest('[data-a]'); if (b) { hold = Date.now(); run(b.getAttribute('data-a')); } });
    run('add');
    var SEQ = ['add', 'cls', 'txt', 'add', 'del', 'txt', 'cls'];
    k.every(function () { if (Date.now() - hold > 5000) run(SEQ[++auto % SEQ.length]); }, 1600);
  }

  PV.json = function (k, c) {
    var paths = [];
    function walk(v, p, d) {
      if (v && typeof v === 'object') {
        var arr = Array.isArray(v), keys = Object.keys(v);
        return '<span class="js-b">' + (arr ? '[' : '{') + '</span><div class="js-o" style="--d:' + d + '">' + keys.map(function (key, i) {
          var np = arr ? p + '[' + key + ']' : (p ? p + '.' : '') + key;
          return '<div class="js-r" data-p="' + esc(np) + '">' + (arr ? '' : '<i class="js-k">"' + esc(key) + '"</i>: ') + walk(v[key], np, d + 1) + (i < keys.length - 1 ? ',' : '') + '</div>';
        }).join('') + '</div><span class="js-b">' + (arr ? ']' : '}') + '</span>';
      }
      paths.push([p, v]);
      var t = typeof v;
      return '<i class="js-v ' + t + '">' + esc(JSON.stringify(v)) + '</i>';
    }
    var tree = walk(c.o, '', 0);
    k.el.innerHTML = '<div class="pv pv-json"><div class="pv-code js-tree">' + tree + '</div><div class="js-path"><code class="js-p"></code>' + I('arrow-right') + '<b class="js-val"></b></div><div class="pv-note">Click any line to read its path. Strings, numbers, true/false, arrays and objects: that is all JSON is.</div></div>';
    var cur = 0, hold = 0;
    function sel(p) {
      $$('.js-r', k.el).forEach(function (r) { r.classList.toggle('on', r.getAttribute('data-p') === p); });
      var hit = paths.filter(function (x) { return x[0] === p; })[0];
      $('.js-p', k.el).textContent = 'data.' + p;
      $('.js-val', k.el).textContent = hit ? JSON.stringify(hit[1]) : '{…}';
    }
    k.on(k.el, 'click', function (e) { var r = e.target.closest('.js-r'); if (r) { e.stopPropagation(); hold = Date.now(); sel(r.getAttribute('data-p')); } });
    if (paths.length) sel(paths[0][0]);
    k.every(function () { if (Date.now() - hold > 5000 && paths.length) sel(paths[++cur % paths.length][0]); }, 1700);
  };

  PV.async = function (k) {
    var T = [['getUser()', 1.2], ['getOrders()', 0.8], ['getStock()', 1.5]], MAX = 3.6;
    k.el.innerHTML = '<div class="pv pv-async"><div class="pv-row">' + seg([['seq', 'One by one (await each)'], ['par', 'Together (Promise.all)']], 'seq', 'as-mode') + '</div>' +
      '<div class="as-lanes">' + T.map(function (t) { return '<div class="as-lane"><code>' + t[0] + '</code><div class="as-track"><i class="as-bar"></i></div><span class="as-st">waiting</span></div>'; }).join('') +
      '<div class="as-axis"><span>0s</span><span>1s</span><span>2s</span><span>3s</span></div></div>' +
      '<div class="as-total">Total <b>0.0s</b></div><pre class="pv-code as-code"><code></code></pre></div>';
    var bars = $$('.as-bar', k.el), st = $$('.as-st', k.el), tot = $('.as-total b', k.el), code = $('.as-code code', k.el), mode = 'seq', hold = 0;
    var CODE = { seq: 'const user   = await getUser();\nconst orders = await getOrders();\nconst stock  = await getStock();\n// each waits for the one before', par: 'const [user, orders, stock] =\n  await Promise.all([\n    getUser(), getOrders(), getStock()\n  ]);\n// all three run at the same time' };
    var gen = 0;
    function run() {
      var g = ++gen;
      code.innerHTML = hl(CODE[mode], 'js');
      var start = 0, sched = T.map(function (t) { var s = mode === 'seq' ? start : 0; start += t[1]; return [s, t[1]]; });
      var end = Math.max.apply(null, sched.map(function (s) { return s[0] + s[1]; }));
      bars.forEach(function (b, i) { b.style.transition = 'none'; b.style.left = (sched[i][0] / MAX * 100) + '%'; b.style.width = '0'; st[i].textContent = 'waiting'; st[i].className = 'as-st'; });
      var t0 = performance.now();
      k.loop(function (now) {
        var t = (now - t0) / 1000;
        bars.forEach(function (b, i) {
          var s = sched[i], p = Math.max(0, Math.min(t - s[0], s[1]));
          b.style.width = (p / MAX * 100) + '%';
          if (t >= s[0] && t < s[0] + s[1]) { st[i].textContent = 'pending…'; st[i].className = 'as-st run'; }
          if (t >= s[0] + s[1]) { st[i].textContent = 'fulfilled'; st[i].className = 'as-st ok'; }
        });
        tot.textContent = Math.min(t, end).toFixed(1) + 's';
        return g === gen && t < end;
      });
      k.later(function () { if (g !== gen) return; if (Date.now() - hold > 4000) { mode = mode === 'seq' ? 'par' : 'seq'; $$('.as-mode button', k.el).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === mode); }); } run(); }, end * 1000 + 2200);
    }
    onSeg(k, k.el, '.as-mode', function (v) { hold = Date.now(); mode = v; run(); });
    run();
  };

  PV.storage = function (k) {
    k.el.innerHTML = '<div class="pv pv-store"><div class="sto-form"><input class="sto-in" maxlength="40" value="Dark mode: on" aria-label="Value to save"><button type="button" class="pv-btn primary sm sto-save">' + I('download') + ' Save everywhere</button><button type="button" class="pv-btn sm sto-clear">' + I('trash') + ' Clear</button></div>' +
      '<div class="sto-cards">' + [['local', 'localStorage', 'Stays until cleared. ~5 MB. Same site only.'], ['session', 'sessionStorage', 'Gone when the tab closes.'], ['cookie', 'Cookie', 'Sent to the server with every request. Small (4 KB).']].map(function (s) { return '<div class="sto-c" data-s="' + s[0] + '"><b>' + s[1] + '</b><code class="sto-v">—</code><p>' + s[2] + '</p></div>'; }).join('') + '</div>' +
      '<div class="pv-note">These are real: reload this page and the localStorage value is still here.</div></div>';
    var KEY = 'xr-demo-note';
    function read() {
      var v = {};
      try { v.local = localStorage.getItem(KEY); } catch (e) { v.local = null; }
      try { v.session = sessionStorage.getItem(KEY); } catch (e) { v.session = null; }
      var m = document.cookie.match(/(?:^|; )xr-demo=([^;]*)/); v.cookie = m ? decodeURIComponent(m[1]) : null;
      $$('.sto-c', k.el).forEach(function (c) { var x = v[c.getAttribute('data-s')]; $('.sto-v', c).textContent = x == null ? 'empty' : '"' + x + '"'; c.classList.toggle('has', x != null); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); });
    }
    k.on($('.sto-save', k.el), 'click', function () {
      var val = $('.sto-in', k.el).value;
      try { localStorage.setItem(KEY, val); sessionStorage.setItem(KEY, val); } catch (e) {}
      document.cookie = 'xr-demo=' + encodeURIComponent(val) + '; path=/; max-age=3600; SameSite=Lax';
      read();
    });
    k.on($('.sto-clear', k.el), 'click', function () {
      try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {}
      document.cookie = 'xr-demo=; path=/; max-age=0';
      read();
    });
    read();
  };

  /* ================= UI components ================= */

  var UI = {};
  UI.card = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui"><div class="ui-card"><div class="uc-img"><span class="uc-badge">-20%</span><button type="button" class="uc-like" aria-label="Like">' + I('heart') + '</button></div><div class="uc-body"><small>Keyboards</small><b>Kage 75 Mechanical</b><div class="uc-stars">' + [1, 2, 3, 4, 5].map(function (i) { return I(i < 5 ? 'star-fill' : 'star'); }).join('') + '<span>4.8 (212)</span></div><div class="uc-row"><span class="uc-p"><s>$129</s> $103</span><button type="button" class="pv-btn primary sm uc-add">' + I('cart') + ' Add</button></div></div></div>' +
      '<div class="pv-note">Image, label, title, proof, price, one clear action. Hover to tilt, tap the heart or Add.</div></div>';
    var card = $('.ui-card', k.el);
    k.on(card, 'pointermove', function (e) { var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; card.style.transform = 'perspective(700px) rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg)'; });
    k.on(card, 'pointerleave', function () { card.style.transform = ''; });
    k.on($('.uc-like', k.el), 'click', function (e) { e.currentTarget.classList.toggle('on'); });
    k.on($('.uc-add', k.el), 'click', function (e) { var b = e.currentTarget; b.innerHTML = I('check') + ' Added'; b.classList.add('done'); k.later(function () { b.innerHTML = I('cart') + ' Add'; b.classList.remove('done'); }, 1600); });
  };
  UI.btn = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui"><div class="ub-grid">' +
      '<button type="button" class="ub ub-primary">Primary</button><button type="button" class="ub ub-ghost">Secondary</button><button type="button" class="ub ub-text">Text link</button>' +
      '<button type="button" class="ub ub-danger">' + I('trash') + ' Delete</button><button type="button" class="ub ub-primary ub-load">Save changes</button><button type="button" class="ub ub-primary" disabled>Disabled</button>' +
      '<button type="button" class="ub ub-icon" aria-label="Search">' + I('search') + '</button><button type="button" class="ub ub-pill">' + I('sparkle') + ' Pill</button><button type="button" class="ub ub-grad">Gradient ' + I('arrow-right') + '</button></div>' +
      '<div class="pv-note">Click any button: ripple, press and a loading state. One primary button per screen.</div></div>';
    k.on(k.el, 'click', function (e) {
      var b = e.target.closest('.ub'); if (!b || b.disabled) return;
      var r = b.getBoundingClientRect(), s = document.createElement('i'); s.className = 'ub-rip'; s.style.left = (e.clientX - r.left) + 'px'; s.style.top = (e.clientY - r.top) + 'px'; b.appendChild(s); k.later(function () { s.remove(); }, 600);
      if (b.classList.contains('ub-load') && !b.classList.contains('busy')) { b.classList.add('busy'); b.innerHTML = '<i class="ub-spin"></i> Saving…'; k.later(function () { b.innerHTML = I('check') + ' Saved'; }, 1300); k.later(function () { b.classList.remove('busy'); b.textContent = 'Save changes'; }, 2600); }
    });
  };
  UI.form = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui"><form class="uf" novalidate><b class="uf-t">Create account</b>' +
      '<label class="uf-f"><span>Email</span><input type="email" name="em" placeholder="you@mail.com" autocomplete="off"><em></em></label>' +
      '<label class="uf-f"><span>Password</span><input type="password" name="pw" placeholder="At least 8 characters" autocomplete="new-password"><em></em></label>' +
      '<div class="uf-meter"><i></i><i></i><i></i><i></i></div><button type="submit" class="pv-btn primary">Sign up</button><div class="uf-done">' + I('check') + ' Account created</div></form></div>';
    var f = $('.uf', k.el), em = f.em, pw = f.pw;
    function score(p) { var s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^\w]/.test(p) || p.length > 13) s++; return s; }
    function check(show) {
      var okE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(em.value), sc = score(pw.value), okP = sc >= 2;
      em.parentElement.className = 'uf-f ' + (em.value || show ? okE ? 'ok' : 'bad' : '');
      $('em', em.parentElement).textContent = okE ? 'Looks good' : em.value || show ? 'Enter a valid email, like you@mail.com' : '';
      pw.parentElement.className = 'uf-f ' + (pw.value || show ? okP ? 'ok' : 'bad' : '');
      $('em', pw.parentElement).textContent = pw.value || show ? ['Too short', 'Weak — add numbers or capitals', 'Okay', 'Strong', 'Very strong'][sc] : '';
      f.setAttribute('data-s', sc);
      return okE && okP;
    }
    k.on(f, 'input', function () { user = true; check(false); });
    k.on(f, 'submit', function (e) { e.preventDefault(); if (check(true)) { f.classList.add('sent'); k.later(function () { f.classList.remove('sent'); }, 2200); } else { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); } });
    var user = false;
    function demo() {
      if (user || !k.alive()) return;
      em.value = ''; pw.value = ''; check(false);
      var seq = [['em', 'nusrat@'], ['em', 'nusrat@mail.com'], ['pw', 'abc'], ['pw', 'abc12345'], ['pw', 'Abc12345!']], i = 0;
      (function t() { if (user || !k.alive()) return; if (i >= seq.length) { k.later(demo, 2600); return; } f[seq[i][0]].value = seq[i][1]; check(false); i++; k.later(t, 900); })();
    }
    k.later(demo, 400);
  };
  UI.nav = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui"><div class="un"><b class="un-logo">Kage</b><nav class="un-links"><a data-i="0" class="on">Home</a><a data-i="1">Shop</a><a data-i="2">About</a><a data-i="3">Contact</a><i class="un-ind"></i></nav><button type="button" class="un-burger" aria-label="Menu"><i></i><i></i><i></i></button></div>' +
      '<div class="un-drawer"><a>Home</a><a>Shop</a><a>About</a><a>Contact</a></div><div class="pv-note">Desktop: links with a sliding indicator. Phones: a burger that opens a drawer. Tap both.</div></div>';
    var links = $$('.un-links a', k.el), ind = $('.un-ind', k.el), cur = 0, hold = 0;
    function sel(i) { cur = i; links.forEach(function (a, j) { a.classList.toggle('on', j === i); }); var a = links[i]; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = 'translateX(' + a.offsetLeft + 'px)'; }
    k.on(k.el, 'click', function (e) {
      var a = e.target.closest('.un-links a'); if (a) { hold = Date.now(); sel(+a.getAttribute('data-i')); }
      if (e.target.closest('.un-burger')) { hold = Date.now(); k.el.querySelector('.pv-ui').classList.toggle('open'); }
    });
    k.later(function () { sel(0); }, 50);
    k.every(function () { if (Date.now() - hold > 5000) { sel((cur + 1) % 4); if (cur === 0) $('.pv-ui', k.el).classList.toggle('open'); } }, 1500);
  };
  UI.modal = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui um-wrap"><div class="um-page"><b>Your cart</b><p>2 items · $214</p><button type="button" class="pv-btn primary sm um-open">' + I('trash') + ' Empty cart</button></div>' +
      '<div class="um-back"><div class="um-box" role="dialog" aria-label="Confirm"><span class="um-ic">' + I('alert') + '</span><b>Empty your cart?</b><p>This removes 2 items. You can’t undo it.</p><div class="pv-row"><button type="button" class="pv-btn sm um-no">Cancel</button><button type="button" class="pv-btn primary sm um-yes">Yes, empty it</button></div></div></div></div>';
    var w = $('.um-wrap', k.el), hold = 0;
    k.on(k.el, 'click', function (e) {
      if (e.target.closest('.um-open')) { hold = Date.now(); w.classList.add('open'); }
      else if (e.target.closest('.um-no, .um-yes') || e.target.classList.contains('um-back')) { hold = Date.now(); w.classList.remove('open'); if (e.target.closest('.um-yes')) $('.um-page p', k.el).textContent = 'Cart is empty'; }
    });
    k.every(function () { if (Date.now() - hold > 5000) w.classList.toggle('open'); }, 2200);
  };
  UI.toast = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui ut-wrap"><div class="pv-row">' + [['ok', 'check', 'Success'], ['err', 'alert', 'Error'], ['info', 'info', 'Info']].map(function (t) { return '<button type="button" class="pv-btn sm ut-b ' + t[0] + '" data-t="' + t[0] + '">' + I(t[1]) + t[2] + '</button>'; }).join('') + '</div><div class="ut-stack"></div></div>';
    var stack = $('.ut-stack', k.el), n = 0, hold = 0;
    var MSG = { ok: ['check', 'Saved', 'Your changes are live.'], err: ['alert', 'Payment failed', 'Card declined. Try another one.'], info: ['info', 'New version', 'Refresh to update.'] };
    function show(t) {
      var m = MSG[t], d = document.createElement('div'); d.className = 'ut ' + t;
      d.innerHTML = '<span>' + I(m[0]) + '</span><div><b>' + m[1] + '</b><p>' + m[2] + '</p></div><i class="ut-t"></i>';
      stack.prepend(d);
      while (stack.children.length > 3) stack.lastChild.remove();
      k.later(function () { d.classList.add('out'); k.later(function () { d.remove(); }, 400); }, 3200);
    }
    k.on(k.el, 'click', function (e) { var b = e.target.closest('.ut-b'); if (b) { hold = Date.now(); show(b.getAttribute('data-t')); } });
    var T = ['ok', 'info', 'err'];
    show('ok');
    k.every(function () { if (Date.now() - hold > 4000) show(T[++n % 3]); }, 1800);
  };
  UI.tabs = function (k) {
    var T = [['Overview', 'A quick summary of the product with the most important facts.'], ['Specs', '75% layout · hot-swap switches · aluminium case · USB-C.'], ['Reviews', '4.8 out of 5 from 212 buyers. “Best keyboard I own.”'], ['Shipping', 'Ships in 2 days. Free returns for 30 days.']];
    k.el.innerHTML = '<div class="pv pv-ui"><div class="utb"><div class="utb-h" role="tablist">' + T.map(function (t, i) { return '<button type="button" role="tab" data-i="' + i + '">' + t[0] + '</button>'; }).join('') + '<i class="utb-ind"></i></div><div class="utb-p"><b></b><p></p></div></div></div>';
    var bs = $$('.utb-h button', k.el), ind = $('.utb-ind', k.el), cur = 0, hold = 0;
    function sel(i) {
      cur = i; bs.forEach(function (b, j) { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i); });
      ind.style.width = bs[i].offsetWidth + 'px'; ind.style.transform = 'translateX(' + bs[i].offsetLeft + 'px)';
      var p = $('.utb-p', k.el); p.classList.remove('in'); void p.offsetWidth; p.classList.add('in');
      $('.utb-p b', k.el).textContent = T[i][0]; $('.utb-p p', k.el).textContent = T[i][1];
    }
    k.on(k.el, 'click', function (e) { var b = e.target.closest('.utb-h button'); if (b) { hold = Date.now(); sel(+b.getAttribute('data-i')); } });
    k.later(function () { sel(0); }, 50);
    k.every(function () { if (Date.now() - hold > 5000) sel((cur + 1) % T.length); }, 1800);
  };
  UI.skel = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui"><div class="usk">' + [0, 1, 2].map(function (i) { return '<div class="usk-r" style="--i:' + i + '"><i class="usk-av"></i><div><i class="usk-l"></i><i class="usk-l s"></i></div><div class="usk-real"><span class="usk-ava">' + 'NRT'[i] + '</span><div><b>' + ['Nusrat', 'Rafi', 'Tanvir'][i] + '</b><p>' + ['Ordered a keyboard', 'Left a 5-star review', 'Joined the waitlist'][i] + '</p></div></div></div>'; }).join('') + '</div><button type="button" class="pv-btn sm usk-re">' + I('refresh') + ' Reload</button></div>';
    var w = $('.usk', k.el);
    function load() { w.classList.remove('loaded'); k.later(function () { w.classList.add('loaded'); }, 1600); }
    k.on($('.usk-re', k.el), 'click', load);
    load(); k.every(load, 4200);
  };
  UI.dark = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui"><div class="udk"><div class="udk-top"><b>Settings</b><button type="button" class="udk-sw" aria-label="Toggle dark mode"><i>' + I('sun') + I('moon') + '</i></button></div><div class="udk-row"><span>Notifications</span><i class="udk-t on"></i></div><div class="udk-row"><span>Sound</span><i class="udk-t"></i></div><div class="udk-card"><b>Pro plan</b><p>Next bill on 1 Oct</p></div></div><div class="pv-note">Dark mode is not just “black”: softer surfaces, less saturated colours, same contrast.</div></div>';
    var d = $('.udk', k.el), hold = 0;
    k.on($('.udk-sw', k.el), 'click', function () { hold = Date.now(); d.classList.toggle('dark'); });
    k.every(function () { if (Date.now() - hold > 5000) d.classList.toggle('dark'); }, 2400);
  };
  UI.spacing = function (k) {
    play(k, { cls: 'pl-spacing', stage: '<div class="usp"><div class="usp-card"><small>Plan</small><b>Blade</b><p>For shops and bots that need to sell.</p><span class="usp-btn">Choose</span></div><i class="usp-grid"></i></div>',
      ctl: [['u', 'Base unit', 2, 12, 8, 1, 'px'], ['g', 'Show 8pt grid', ['on', 'off'], 'on']],
      apply: function (v, s) { var c = $('.usp-card', s); c.style.setProperty('--u', v.u + 'px'); $('.usp-grid', s).style.opacity = v.g === 'on' ? 1 : 0; $('.usp-grid', s).style.backgroundSize = v.u + 'px ' + v.u + 'px'; return '/* spacing scale */\n--s1: ' + v.u + 'px;\n--s2: ' + v.u * 2 + 'px;\n--s3: ' + v.u * 3 + 'px;\n--s4: ' + v.u * 4 + 'px;\n.card { padding: var(--s3); gap: var(--s1); }'; } });
  };
  UI.toggle = function (k) {
    k.el.innerHTML = '<div class="pv pv-ui"><div class="utg"><label class="utg-r"><span>Wi-Fi</span><input type="checkbox" checked><i class="utg-sw"></i></label><label class="utg-r"><span>Bluetooth</span><input type="checkbox"><i class="utg-sw"></i></label>' +
      '<label class="utg-r"><span>I agree to the terms</span><input type="checkbox"><i class="utg-cb">' + I('check') + '</i></label>' +
      '<div class="utg-r"><span>Plan</span>' + seg(['Monthly', 'Yearly'], 'Monthly', 'utg-seg') + '</div>' +
      '<div class="utg-r radio">' + ['Small', 'Medium', 'Large'].map(function (s, i) { return '<label><input type="radio" name="sz' + Math.random().toString(36).slice(2, 6) + '"' + (i === 1 ? ' checked' : '') + '><i></i>' + s + '</label>'; }).join('') + '</div></div></div>';
    $$('.utg-r.radio input', k.el).forEach(function (r, i, a) { r.name = a[0].name; });
    onSeg(k, k.el, '.utg-seg', function () {});
    var cbs = $$('.utg input[type=checkbox]', k.el), n = 0, hold = 0;
    k.on(k.el, 'pointerdown', function () { hold = Date.now(); });
    k.every(function () { if (Date.now() - hold > 5000) { var c = cbs[n++ % cbs.length]; c.checked = !c.checked; } }, 1300);
  };

  PV.ui = function (k, c) { (UI[c.demo] || UI.card)(k); };
})();
