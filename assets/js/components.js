/* =====================================================================
   XIRAIYA — UI Kit sections
   One interactive bench per category: a measured stage, a variant row,
   canvas / accent / zoom / speed / redline controls and live code
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR, KIT = window.KIT;
  if (!XR || !KIT) return;
  var $ = XR.$, $$ = XR.$$, I = XR.icon, esc = XR.esc;

  var root = $('.kb-cats'), nav = $('.kb-nav-chips');
  if (!root) return;
  var all = [], byId = {};

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.id = 'kit-css';
  style.textContent = KIT.map(function (g) { return g.items.map(function (it) { return it.css; }).join('\n'); }).join('\n');
  document.head.appendChild(style);

  /* ---------- behaviours (also shown as JS in the code tab) ---------- */
  var JS = {
    tabs: "// Slide the .ink under the active item\ndocument.querySelectorAll('[data-k-tabs]').forEach(bar => {\n  const ink = bar.querySelector('.ink');\n  const items = [...bar.children].filter(el => el.matches('a, button'));\n  const move = el => { if (!ink || !el) return; ink.style.left = el.offsetLeft + 'px'; ink.style.width = el.offsetWidth + 'px'; };\n  items.forEach(el => el.addEventListener('click', () => {\n    items.forEach(i => i.classList.toggle('on', i === el));\n    move(el);\n  }));\n  move(bar.querySelector('.on'));\n});",
    toggle: "document.querySelectorAll('[data-k-toggle]').forEach(el =>\n  el.addEventListener('click', () => el.classList.toggle('on')));",
    load: "const btn = document.querySelector('[data-k-load]');\nconst label = btn.querySelector('.t');\nbtn.addEventListener('click', () => {\n  if (btn.classList.contains('is-loading')) return;\n  btn.classList.add('is-loading');\n  setTimeout(() => { btn.classList.replace('is-loading', 'is-done'); label.textContent = 'Deployed'; }, 1400);\n  setTimeout(() => { btn.classList.remove('is-done'); label.textContent = 'Deploy site'; }, 3200);\n});",
    otp: "const boxes = [...document.querySelectorAll('[data-k-otp] input')];\nboxes.forEach((b, i) => {\n  b.addEventListener('input', () => {\n    b.value = b.value.replace(/\\D/g, '').slice(-1);\n    b.classList.toggle('full', !!b.value);\n    if (b.value && boxes[i + 1]) boxes[i + 1].focus();\n  });\n  b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });\n  b.addEventListener('paste', e => {\n    e.preventDefault();\n    [...e.clipboardData.getData('text').replace(/\\D/g, '')].slice(0, 6).forEach((d, j) => { boxes[j].value = d; boxes[j].classList.add('full'); });\n  });\n});",
    palette: "const list = [...document.querySelectorAll('[data-k-palette] li')];\nlet i = 0;\ndocument.querySelector('[data-k-palette] input').addEventListener('keydown', e => {\n  if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;\n  e.preventDefault();\n  i = (i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;\n  list.forEach((li, j) => li.classList.toggle('on', j === i));\n});"
  };
  function wire(root) {
    $$('[data-k-tabs]', root).forEach(function (bar) {
      var ink = $('.ink', bar), items = Array.prototype.filter.call(bar.children, function (el) { return el.matches('a, button'); });
      function move(el) { if (!ink || !el) return; ink.style.left = el.offsetLeft + 'px'; ink.style.width = el.offsetWidth + 'px'; }
      items.forEach(function (el) {
        el.addEventListener('click', function () { items.forEach(function (i) { i.classList.toggle('on', i === el); }); move(el); });
      });
      requestAnimationFrame(function () { move($('.on', bar)); });
    });
    $$('[data-k-toggle]', root).forEach(function (el) { el.addEventListener('click', function () { el.classList.toggle('on'); }); });
    $$('[data-k-load]', root).forEach(function (btn) {
      var label = $('.t', btn), orig = label.textContent;
      btn.addEventListener('click', function () {
        if (btn.classList.contains('is-loading') || btn.classList.contains('is-done')) return;
        btn.classList.add('is-loading');
        setTimeout(function () { btn.classList.remove('is-loading'); btn.classList.add('is-done'); label.textContent = 'Deployed'; }, 1400);
        setTimeout(function () { btn.classList.remove('is-done'); label.textContent = orig; }, 3200);
      });
    });
    $$('[data-k-otp]', root).forEach(function (w) {
      var boxes = $$('input', w);
      boxes.forEach(function (b, i) {
        b.addEventListener('input', function () {
          b.value = b.value.replace(/\D/g, '').slice(-1);
          b.classList.toggle('full', !!b.value);
          if (b.value && boxes[i + 1]) boxes[i + 1].focus();
        });
        b.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
        b.addEventListener('paste', function (e) {
          e.preventDefault();
          (e.clipboardData.getData('text').replace(/\D/g, '').split('')).slice(0, 6).forEach(function (d, j) { boxes[j].value = d; boxes[j].classList.add('full'); });
        });
      });
    });
    $$('[data-k-palette]', root).forEach(function (p) {
      var list = $$('li', p), idx = 0;
      $('input', p).addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
        list.forEach(function (li, j) { li.classList.toggle('on', j === idx); });
      });
      list.forEach(function (li, j) { li.addEventListener('mouseenter', function () { idx = j; list.forEach(function (x) { x.classList.toggle('on', x === li); }); }); });
    });
    // components are demos: keep their links and forms from navigating
    $$('a', root).forEach(function (a) { a.setAttribute('tabindex', '0'); });
    $$('form', root).forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });
  }

  /* ---------- one bench per category ---------- */
  var COPY = {
    Foundations: ['The tokens <em>everything</em> is built from.', 'Colour and type first. Every other bench on this page pulls from these two.'],
    Headers: ['Five headers, tried at <em>real size.</em>', 'Pick one, shift its accent, slow its hover down and read the exact measurements.'],
    Bars: ['Navigation that shows <em>where you are.</em>', 'Tabs, segments, steppers and sidebars. Click inside them, they all work.'],
    Heroes: ['First screens, <em>measured.</em>', 'The part people see before they decide to scroll. Try it on a different canvas.'],
    Buttons: ['Ten buttons, <em>one bench.</em>', 'Zoom to 2×, drop the speed to a quarter and hover. Every easing is on show.'],
    Cards: ['Cards you can <em>pull apart.</em>', 'Turn on the redlines to see every box inside a card, with its size.'],
    Forms: ['Inputs that <em>forgive</em> typos.', 'Type into them. Paste a code into the OTP field. Use the arrow keys in the palette.'],
    Footers: ['The last thing people <em>see.</em>', 'Three footers, from a full sitemap to a single signed line.'],
    Loaders: ['Waiting, but <em>nicer.</em>', 'Put a loader at 0.25× and watch how each one is timed.'],
    Feedback: ['Toasts, dialogs and alerts <em>in context.</em>', 'Messages that tell people what happened, without shouting.']
  };
  var TALL = { Heroes: 1, Footers: 1, Foundations: 1 };
  function slug(t) { return 'kb-' + t.toLowerCase().replace(/[^a-z]+/g, '-'); }
  var html = '', chips = '';
  KIT.forEach(function (g, gi) {
    var c = COPY[g.cat] || [esc(g.cat), ''];
    chips += '<a href="#' + slug(g.cat) + '" data-kb="' + gi + '">' + esc(g.cat) + '<b>' + g.items.length + '</b></a>';
    g.items.forEach(function (it) { it.cat = g.cat; all.push(it); byId[it.id] = it; });
    html += '<section class="section pg-sec" id="' + slug(g.cat) + '" data-kb-sec="' + gi + '">' +
      '<div class="kx-head"><span class="num"><span class="hanko sm">' + g.jp + '</span> ' + String(gi + 1).padStart(2, '0') + ' · ' + esc(g.cat) + '</span>' +
      '<h2 class="h2">' + c[0] + '</h2><p class="lead">' + c[1] + '</p></div>' +
      '<div class="kx-anat-grid pg" data-g="' + gi + '">' +
        '<div class="kx-spec">' +
          '<div class="kx-stage pg-stage' + (TALL[g.cat] ? ' tall' : '') + '"><span class="pg-name"></span><div class="pg-fit"></div><svg class="kx-lines pg-lines" aria-hidden="true"></svg></div>' +
          '<div class="pg-vars" role="tablist" aria-label="' + esc(g.cat) + ' variants">' + g.items.map(function (it, i) {
            return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-pick="' + it.id + '"><small>' + String(i + 1).padStart(2, '0') + '</small>' + esc(it.name) + '</button>';
          }).join('') + '</div>' +
        '</div>' +
        '<aside class="kx-tok">' +
          '<h3>Bench</h3>' +
          '<p class="pg-note"></p>' +
          '<div class="kx-ctl"><span>Canvas</span><div class="kx-seg" data-ctl="canvas"><button type="button" aria-checked="true" data-v="own">Own</button><button type="button" aria-checked="false" data-v="paper">Paper</button><button type="button" aria-checked="false" data-v="ink">Ink</button><button type="button" aria-checked="false" data-v="blue">Blueprint</button></div></div>' +
          '<label class="kx-ctl"><span>Accent shift <b class="pg-hv">0°</b></span><input type="range" min="-180" max="180" step="5" value="0" data-ctl="hue"></label>' +
          '<div class="kx-ctl"><span>Zoom</span><div class="kx-seg" data-ctl="zoom"><button type="button" aria-checked="true" data-v="fit">Fit</button><button type="button" aria-checked="false" data-v="1">1×</button><button type="button" aria-checked="false" data-v="2">2×</button></div></div>' +
          '<div class="kx-ctl"><span>Animation speed</span><div class="kx-seg" data-ctl="speed"><button type="button" aria-checked="false" data-v=".25">0.25×</button><button type="button" aria-checked="false" data-v=".5">0.5×</button><button type="button" aria-checked="true" data-v="1">1×</button><button type="button" aria-checked="false" data-v="2">2×</button></div></div>' +
          '<label class="kx-sw pg-rl"><input type="checkbox" checked data-ctl="lines"><span aria-hidden="true"></span>Redlines</label>' +
          '<div class="kx-out"><div class="kx-out-h"><div class="pg-langs" role="tablist"></div><span class="pg-acts"><button type="button" class="ki-copy" data-copy-now>' + I('copy') + 'Copy</button><button type="button" class="ki-copy" data-present title="Present full screen">' + I('fullscreen') + '</button></span></div><pre class="code pg-code"></pre></div>' +
        '</aside>' +
      '</div></section>';
  });
  root.innerHTML = html;
  nav.innerHTML = chips;
  $$('.k-count').forEach(function (el) { el.textContent = all.length; });

  function hl(code, lang) {
    var s = esc(code);
    if (lang === 'css') {
      return s.replace(/(@[a-z-]+)/g, '<span class="k">$1</span>')
        .replace(/([a-z-]+)(\s*:)(?!\/)/g, function (m, p, c) { return /^(hover|focus|active|before|after|root|not|nth-child|focus-within|focus-visible|placeholder-shown|checked)$/.test(p) ? m : '<span class="f">' + p + '</span>' + c; })
        .replace(/(#[0-9a-fA-F]{3,8})\b/g, '<span class="n">$1</span>')
        .replace(/(&#39;[^&]*?&#39;)/g, '<span class="s">$1</span>');
    }
    if (lang === 'html') {
      return s.replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="k">$2</span>')
        .replace(/ ([a-z-]+)=(&quot;)/g, ' <span class="f">$1</span>=$2');
    }
    return s.replace(/\b(const|let|if|return|forEach|addEventListener|document)\b/g, '<span class="k">$1</span>').replace(/(&#39;[^&]*?&#39;)/g, '<span class="s">$1</span>');
  }
  function pretty(h) { return h.replace(/></g, '>\n<').replace(/\n(<\/?(?:span|b|i|em|small|svg|path|circle|rect|use|strong)\b)/g, '$1'); }
  function codeFor(it, lang) { return lang === 'js' ? JS[it.js] : lang === 'html' ? pretty(it.html) : it.css; }

  var CANVAS = { paper: '#f3ecdf', ink: '#14110e', blue: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px) 0 0 / 20px 20px, #16325c' };
  var benches = $$('.pg', root).map(function (el) {
    var B = { el: el, g: KIT[+el.getAttribute('data-g')], canvas: 'own', hue: 0, zoom: 'fit', speed: 1, lines: true, lang: 'html', it: null };
    B.stage = $('.pg-stage', el); B.fit = $('.pg-fit', el); B.svg = $('.pg-lines', el);
    B.pick = function (id) {
      B.it = byId[id];
      $$('[data-pick]', el).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-pick') === id); });
      B.fit.innerHTML = B.it.html;
      wire(B.fit);
      $('.pg-name', el).textContent = B.it.cat + ' / ' + B.it.name;
      $('.pg-note', el).textContent = B.it.note || '';
      B.lang = 'html';
      B.paint(); B.code();
    };
    B.paint = function () {
      var it = B.it;
      B.stage.style.setProperty('--fbg', B.canvas === 'own' ? (it.bg || '#15120f') : CANVAS[B.canvas]);
      B.fit.style.setProperty('--pad', it.pad || '32px');
      B.fit.style.filter = B.hue ? 'hue-rotate(' + B.hue + 'deg)' : '';
      B.fit.style.zoom = 1;
      var root = B.fit.firstElementChild;
      if (root) {
        var sw = B.stage.clientWidth - 80, sh = B.stage.clientHeight - 90, w = B.fit.offsetWidth, h = B.fit.offsetHeight;
        B.z = B.zoom === 'fit' ? Math.max(.3, Math.min(2.2, sw / w, sh / h)) : +B.zoom;
        B.fit.style.zoom = B.z;
      }
      $('.pg-hv', el).textContent = (B.hue > 0 ? '+' : '') + B.hue + '°';
      requestAnimationFrame(B.measure);
    };
    B.measure = function () {
      var root = B.fit.firstElementChild;
      if (!B.lines || !root) { B.svg.innerHTML = ''; return; }
      var sr = B.stage.getBoundingClientRect(), r = root.getBoundingClientRect(), z = B.z || 1;
      var x0 = r.left - sr.left, y0 = r.top - sr.top, x1 = r.right - sr.left, y1 = r.bottom - sr.top, out = '';
      out += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '"/>';
      /* child boxes, one level down, so you can see how it is put together */
      $$(':scope > *', root).slice(0, 14).forEach(function (c) {
        var q = c.getBoundingClientRect();
        if (q.width < 4 || q.height < 4) return;
        out += '<rect class="sub" x="' + (q.left - sr.left) + '" y="' + (q.top - sr.top) + '" width="' + q.width + '" height="' + q.height + '"/>';
      });
      var ty = Math.max(14, y0 - 16), lx = Math.max(14, x0 - 16);
      out += '<line x1="' + x0 + '" y1="' + ty + '" x2="' + x1 + '" y2="' + ty + '"/><line x1="' + x0 + '" y1="' + (ty - 5) + '" x2="' + x0 + '" y2="' + (ty + 5) + '"/><line x1="' + x1 + '" y1="' + (ty - 5) + '" x2="' + x1 + '" y2="' + (ty + 5) + '"/>';
      out += '<line x1="' + lx + '" y1="' + y0 + '" x2="' + lx + '" y2="' + y1 + '"/><line x1="' + (lx - 5) + '" y1="' + y0 + '" x2="' + (lx + 5) + '" y2="' + y0 + '"/><line x1="' + (lx - 5) + '" y1="' + y1 + '" x2="' + (lx + 5) + '" y2="' + y1 + '"/>';
      var W = Math.round(r.width / z), H = Math.round(r.height / z), cs = getComputedStyle(root);
      var tag = function (x, y, t) { var w = t.length * 6.2 + 10; return '<g class="tag"><rect x="' + (x - w / 2) + '" y="' + (y - 8) + '" width="' + w + '" height="16" rx="3"/><text x="' + x + '" y="' + (y + 3.5) + '" text-anchor="middle">' + t + '</text></g>'; };
      out += tag((x0 + x1) / 2, ty, 'W ' + W) + tag(lx, (y0 + y1) / 2, 'H ' + H);
      var rad = parseFloat(cs.borderTopLeftRadius);
      if (rad) out += tag(x1 + 4, y1 + 14, rad >= r.height / z / 2 ? 'pill' : 'r ' + Math.round(rad));
      if (z !== 1) out += tag(sr.width - 44, sr.height - 18, Math.round(z * 100) + '%');
      B.svg.setAttribute('viewBox', '0 0 ' + sr.width + ' ' + sr.height);
      B.svg.innerHTML = out;
    };
    B.code = function () {
      var it = B.it, langs = ['html', 'css'].concat(it.js ? ['js'] : []);
      $('.pg-langs', el).innerHTML = langs.map(function (l) { return '<button type="button" role="tab" aria-selected="' + (l === B.lang) + '" data-lang="' + l + '">' + l.toUpperCase() + '</button>'; }).join('');
      $('.pg-code', el).innerHTML = hl(codeFor(it, B.lang), B.lang);
    };
    el.addEventListener('click', function (e) {
      var pk = e.target.closest('[data-pick]'); if (pk) { B.pick(pk.getAttribute('data-pick')); return; }
      var sg = e.target.closest('[data-ctl] button');
      if (sg) {
        var box = sg.parentElement, key = box.getAttribute('data-ctl');
        $$('button', box).forEach(function (x) { x.setAttribute('aria-checked', x === sg); });
        B[key] = key === 'speed' ? +sg.getAttribute('data-v') : sg.getAttribute('data-v');
        if (key === 'speed') rate(B); else B.paint();
        return;
      }
      var lg = e.target.closest('[data-lang]'); if (lg) { B.lang = lg.getAttribute('data-lang'); B.code(); return; }
      if (e.target.closest('[data-copy-now]')) { XR.copy(codeFor(B.it, B.lang)).then(function () { XR.toast(B.it.name + ': ' + B.lang.toUpperCase() + ' copied'); }); return; }
      if (e.target.closest('[data-present]')) openPresent(all.indexOf(B.it));
    });
    $('[data-ctl="hue"]', el).addEventListener('input', function (e) { B.hue = +e.target.value; B.paint(); });
    $('[data-ctl="lines"]', el).addEventListener('change', function (e) { B.lines = e.target.checked; B.measure(); });
    B.fit.addEventListener('transitionend', function () { if (B.lines) B.measure(); });
    B.pick(B.g.items[0].id);
    return B;
  });
  /* slow motion: every CSS animation and transition inside a bench runs at its chosen rate */
  function rate(B) {
    if (!document.getAnimations) return;
    document.getAnimations().forEach(function (a) { var t = a.effect && a.effect.target; if (t && B.fit.contains(t) && a.playbackRate !== B.speed) a.playbackRate = B.speed; });
  }
  setInterval(function () { benches.forEach(function (B) { if (B.speed !== 1) rate(B); }); }, 120);
  var rs; window.addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(function () { benches.forEach(function (B) { B.paint(); }); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { benches.forEach(function (B) { B.paint(); }); });

  /* ---------- category bar: scrollspy + search that jumps to a component ---------- */
  var secs = $$('.pg-sec', root);
  function spy() {
    var cur = 0, mid = innerHeight * .35;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < mid) cur = i; });
    $$('a', nav).forEach(function (a) { a.classList.toggle('on', +a.getAttribute('data-kb') === cur); });
  }
  var sp = false;
  window.addEventListener('scroll', function () { if (!sp) { sp = true; requestAnimationFrame(function () { sp = false; spy(); }); } }, { passive: true });
  spy();
  var search = $('.kb-search input');
  function find(q) { return all.filter(function (it) { return (it.cat + ' ' + it.name).toLowerCase().indexOf(q) > -1; }); }
  if (search) {
    search.addEventListener('input', function () {
      var q = search.value.toLowerCase().trim(), hits = q ? find(q) : all;
      $('.kb-found').textContent = q ? (hits.length ? hits.length + ' found · Enter' : 'no match') : all.length + ' components';
    });
    search.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var hit = find(search.value.toLowerCase().trim())[0]; if (!hit) return;
      var B = benches.filter(function (b) { return b.g.cat === hit.cat; })[0];
      B.pick(hit.id);
      B.el.scrollIntoView({ behavior: XR.reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }

  /* ---------- present mode ---------- */
  var present = $('.present'), stage = $('.present-stage'), pIdx = 0, lastFocus;
  function showPresent(i) {
    pIdx = (i + all.length) % all.length;
    var it = all[pIdx];
    $('.present-name').textContent = it.cat + ' / ' + it.name;
    stage.innerHTML = '<div class="pv" style="' + (it.bg ? '--fbg:' + it.bg + ';' : '') + (it.pad ? '--pad:' + it.pad + ';' : '') + '">' + it.html + '</div>';
    wire(stage);
  }
  function openPresent(i) {
    lastFocus = document.activeElement;
    present.hidden = false;
    document.body.style.overflow = 'hidden';
    showPresent(i);
    $('.present-x').focus();
  }
  function closePresent() {
    present.hidden = true;
    document.body.style.overflow = '';
    stage.innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('.present-x').addEventListener('click', closePresent);
  $$('[data-pn]').forEach(function (b) { b.addEventListener('click', function () { showPresent(pIdx + +b.getAttribute('data-pn')); }); });
  document.addEventListener('keydown', function (e) {
    if (present.hidden) return;
    if (e.key === 'Escape') closePresent();
    if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) showPresent(pIdx + 1);
    if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) showPresent(pIdx - 1);
  });
})();
