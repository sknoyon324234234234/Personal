/* =====================================================================
   XIRAIYA — UI Kit workspace (Figma-style)
   Layers · zoomable canvas · selection · inspector · code · present mode
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR, KIT = window.KIT;
  if (!XR || !KIT) return;
  var $ = XR.$, $$ = XR.$$, I = XR.icon, esc = XR.esc;

  var app = $('.kit-app'), wrap = $('.kit-canvas-wrap'), canvas = $('.kit-canvas'), tree = $('.kl-tree');
  var inspect = $('.kit-inspect'), kiBody = $('.ki-body'), zv = $('.kt-zv'), pageName = $('.kt-page');
  var all = [], byId = {}, selected = null, tab = 'design', zoom = 1, tool = 'move';

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

  /* ---------- build layers + canvas ---------- */
  var sizer = document.createElement('div');
  sizer.className = 'kit-sizer';
  sizer.style.position = 'relative';
  wrap.insertBefore(sizer, canvas);
  sizer.appendChild(canvas);
  canvas.style.position = 'absolute';
  canvas.style.left = '0'; canvas.style.top = '0';

  var treeHTML = '', canvasHTML = '';
  KIT.forEach(function (g, gi) {
    treeHTML += '<div class="kl-group" data-g="' + gi + '"><button type="button" aria-expanded="true">' + I('chevron-down', 'chev') + I(g.icon) + '<span>' + g.cat + '</span><em>' + g.items.length + '</em></button><ul role="group">';
    canvasHTML += '<section class="kc-sec" id="kc-' + gi + '"><div class="kc-sec-h"><b>' + g.cat + '</b><span class="jp">' + g.jp + '</span><span>' + g.items.length + ' components</span></div><div class="kc-frames">';
    g.items.forEach(function (it) {
      it.cat = g.cat; all.push(it); byId[it.id] = it;
      treeHTML += '<li><button type="button" class="kl-item" role="treeitem" data-id="' + it.id + '">' + I('frame') + '<span>' + esc(it.name) + '</span></button></li>';
      canvasHTML += '<div class="kf" data-id="' + it.id + '"><div class="kf-label">' + I('frame') + esc(g.cat + ' / ' + it.name) + '</div>' +
        '<div class="kf-frame" style="' + (it.bg ? '--fbg:' + it.bg + ';' : '') + (it.pad ? '--pad:' + it.pad + ';' : '') + '">' + it.html + '</div>' +
        '<div class="kf-handles" aria-hidden="true"><i></i><i></i><i></i><i></i></div><span class="kf-size"></span></div>';
    });
    treeHTML += '</ul></div>';
    canvasHTML += '</div></section>';
  });
  tree.innerHTML = treeHTML;
  canvas.innerHTML = canvasHTML;
  wire(canvas);
  var countEl = $('.k-count'); if (countEl) countEl.textContent = all.length;

  /* ---------- zoom + pan ---------- */
  function applyZoom(z, anchor) {
    var old = zoom;
    zoom = XR.clamp(z, .25, 2);
    var ax = anchor ? anchor.x : wrap.clientWidth / 2, ay = anchor ? anchor.y : wrap.clientHeight / 2;
    var cx = (wrap.scrollLeft + ax) / old, cy = (wrap.scrollTop + ay) / old;
    canvas.style.transform = 'scale(' + zoom + ')';
    sizer.style.width = canvas.offsetWidth * zoom + 'px';
    sizer.style.height = canvas.offsetHeight * zoom + 'px';
    wrap.scrollLeft = cx * zoom - ax;
    wrap.scrollTop = cy * zoom - ay;
    zv.textContent = Math.round(zoom * 100) + '%';
  }
  function fit() { applyZoom(Math.min(1, (wrap.clientWidth - 10) / canvas.offsetWidth)); wrap.scrollLeft = 0; }
  $$('[data-zoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-zoom');
      if (v === 'fit') fit(); else applyZoom(zoom * (v === '1' ? 1.2 : 1 / 1.2));
    });
  });
  wrap.addEventListener('wheel', function (e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    var r = wrap.getBoundingClientRect();
    applyZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), { x: e.clientX - r.left, y: e.clientY - r.top });
  }, { passive: false });

  var pan = null, spaceHand = false;
  function setTool(t) {
    tool = t;
    $$('[data-tool]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-tool') === t); });
    wrap.classList.toggle('is-hand', t === 'hand' || spaceHand);
  }
  $$('[data-tool]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-tool');
      if (t === 'move' || t === 'hand') setTool(t);
      else XR.toast('This file is view-only — use Move, Hand, zoom and Present', 'warn');
    });
  });
  wrap.addEventListener('pointerdown', function (e) {
    if (!wrap.classList.contains('is-hand')) return;
    pan = { x: e.clientX, y: e.clientY, sl: wrap.scrollLeft, st: wrap.scrollTop };
    wrap.classList.add('is-panning');
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', function (e) {
    if (!pan) return;
    wrap.scrollLeft = pan.sl - (e.clientX - pan.x);
    wrap.scrollTop = pan.st - (e.clientY - pan.y);
  });
  wrap.addEventListener('pointerup', function () { pan = null; wrap.classList.remove('is-panning'); });
  document.addEventListener('keydown', function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (typing || !$('.present').hidden) return;
    var inKit = app.matches(':hover') || app.contains(document.activeElement);
    if (!inKit) return;
    if (e.key === 'v' || e.key === 'V') setTool('move');
    if (e.key === 'h' || e.key === 'H') setTool('hand');
    if (e.code === 'Space' && !spaceHand) { e.preventDefault(); spaceHand = true; setTool(tool); }
    if ((e.key === '=' || e.key === '+') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); applyZoom(zoom * 1.2); }
    if (e.key === '-' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); applyZoom(zoom / 1.2); }
    if (e.key === 'Escape' && selected) select(null);
  });
  document.addEventListener('keyup', function (e) { if (e.code === 'Space' && spaceHand) { spaceHand = false; setTool(tool); } });

  /* ---------- selection ---------- */
  function frameEl(id) { return $('.kf[data-id="' + id + '"]', canvas); }
  function select(id, scroll) {
    $$('.kf.is-sel', canvas).forEach(function (f) { f.classList.remove('is-sel'); });
    $$('.kl-item.is-sel', tree).forEach(function (f) { f.classList.remove('is-sel'); });
    selected = id ? byId[id] : null;
    if (!selected) { renderInspect(); inspect.classList.remove('is-open'); pageName.textContent = 'All components'; return; }
    var f = frameEl(id), li = $('.kl-item[data-id="' + id + '"]', tree);
    f.classList.add('is-sel');
    if (li) { li.classList.add('is-sel'); li.scrollIntoView({ block: 'nearest' }); }
    var root = $('.kf-frame', f).firstElementChild;
    $('.kf-size', f).textContent = root.offsetWidth + ' × ' + root.offsetHeight;
    pageName.textContent = selected.cat + ' / ' + selected.name;
    if (scroll) {
      var cr = canvas.getBoundingClientRect(), fr = f.getBoundingClientRect();
      var x = (fr.left - cr.left) / zoom, y = (fr.top - cr.top) / zoom;
      wrap.scrollTo({ left: Math.max(0, x * zoom - 40), top: Math.max(0, y * zoom - 50), behavior: XR.reduce ? 'auto' : 'smooth' });
    }
    renderInspect();
    if (window.matchMedia('(max-width: 960px)').matches) inspect.classList.add('is-open');
  }
  canvas.addEventListener('click', function (e) {
    if (wrap.classList.contains('is-hand')) return;
    var f = e.target.closest('.kf');
    if (f) select(f.getAttribute('data-id')); else select(null);
  });
  tree.addEventListener('click', function (e) {
    var it = e.target.closest('.kl-item');
    if (it) { select(it.getAttribute('data-id'), true); return; }
    var gb = e.target.closest('.kl-group > button');
    if (gb) {
      var g = gb.parentElement;
      if (window.matchMedia('(max-width: 960px)').matches) {
        var sec = $('#kc-' + g.getAttribute('data-g'));
        var cr = canvas.getBoundingClientRect(), sr = sec.getBoundingClientRect();
        wrap.scrollTo({ left: 0, top: (sr.top - cr.top) - 10, behavior: 'smooth' });
        return;
      }
      g.classList.toggle('is-closed');
      gb.setAttribute('aria-expanded', !g.classList.contains('is-closed'));
    }
  });
  $('.kl-search input').addEventListener('input', function (e) {
    var q = e.target.value.toLowerCase().trim();
    $$('.kl-group', tree).forEach(function (g) {
      var any = false, catName = $('.kl-group > button span', g).textContent.toLowerCase();
      $$('.kl-item', g).forEach(function (b) {
        var ok = !q || b.textContent.toLowerCase().indexOf(q) >= 0 || catName.indexOf(q) >= 0;
        b.parentElement.hidden = !ok; if (ok) any = true;
      });
      g.hidden = !any;
      if (q) g.classList.remove('is-closed');
    });
  });

  /* ---------- inspector ---------- */
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
  function field(k, v, full) { return '<div class="ki-f' + (full ? ' full' : '') + '"><span>' + k + '</span><b title="' + esc(v) + '">' + esc(v) + '</b></div>'; }
  function renderInspect() {
    $$('.ki-tabs [role="tab"]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-ki') === tab); });
    if (!selected) { kiBody.innerHTML = '<div class="ki-empty">' + I('cursor') + '<p>Select a frame on the canvas to inspect its styles and code.</p></div>'; return; }
    var it = selected, f = frameEl(it.id), root = $('.kf-frame', f).firstElementChild, cs = getComputedStyle(root);
    if (tab === 'design') {
      var cr = canvas.getBoundingClientRect(), fr = f.getBoundingClientRect();
      var hexes = (it.css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).map(function (h) { return h.toLowerCase(); }).filter(function (h, i, a) { return a.indexOf(h) === i; }).slice(0, 8);
      var durs = (it.css.match(/(?:\d*\.)?\d+m?s\b/g) || []).filter(function (h, i, a) { return a.indexOf(h) === i; }).slice(0, 4);
      var eases = (it.css.match(/cubic-bezier\([^)]*\)|ease-in-out|ease-out|linear|steps\(\d+\)/g) || []).filter(function (h, i, a) { return a.indexOf(h) === i; }).slice(0, 2);
      var keyframes = (it.css.match(/@keyframes\s+([\w-]+)/g) || []).map(function (k) { return k.replace('@keyframes ', ''); });
      var font = cs.fontFamily.split(',')[0].replace(/["']/g, '');
      kiBody.innerHTML =
        '<div class="ki-sec"><div class="ki-name"><b>' + esc(it.name) + '</b><span>' + esc(it.cat) + '</span></div><p class="ki-note">' + esc(it.note || '') + '</p></div>' +
        '<div class="ki-sec"><h3>Frame</h3><div class="ki-grid">' + field('W', root.offsetWidth) + field('H', root.offsetHeight) + field('X', Math.round((fr.left - cr.left) / zoom)) + field('Y', Math.round((fr.top - cr.top) / zoom)) + '</div></div>' +
        '<div class="ki-sec"><h3>Appearance</h3><div class="ki-grid">' + field('Radius', cs.borderTopLeftRadius) + field('Padding', cs.paddingTop + ' ' + cs.paddingRight) +
          field('Display', cs.display) + field('Gap', cs.gap === 'normal' ? '—' : cs.gap) + field('Border', cs.borderTopWidth === '0px' ? 'none' : cs.borderTopWidth + ' ' + cs.borderTopStyle, true) +
          field('Shadow', cs.boxShadow === 'none' ? 'none' : cs.boxShadow.split(/,(?![^(]*\))/)[0], true) + '</div></div>' +
        '<div class="ki-sec"><h3>Typography</h3><div class="ki-grid">' + field('Font', font, true) + field('Size', cs.fontSize) + field('Weight', cs.fontWeight) + '</div></div>' +
        (hexes.length ? '<div class="ki-sec"><h3>Fill · click to copy</h3>' + hexes.map(function (h) { return '<button type="button" class="ki-fill" data-copy="' + h + '"><i style="--c:' + h + '"></i>' + h.toUpperCase() + '<em>100%</em></button>'; }).join('') + '</div>' : '') +
        ((durs.length || keyframes.length) ? '<div class="ki-sec"><h3>Motion</h3><div class="ki-grid">' + (durs.length ? field('Duration', durs.join(' · '), true) : '') + (eases.length ? field('Easing', eases[0], true) : '') + (keyframes.length ? field('Keyframes', keyframes.join(', '), true) : '') + '</div></div>' : '') +
        (it.js ? '<div class="ki-sec"><h3>Interaction</h3><p class="ki-note">This component has a small script (' + it.js + '). See the Code tab.</p></div>' : '');
    } else {
      kiBody.innerHTML =
        '<div class="ki-sec ki-code"><div class="ki-code-h"><span>HTML</span><button type="button" class="ki-copy" data-copy-code="html">' + I('copy') + 'Copy</button></div><pre class="code">' + hl(it.html, 'html') + '</pre></div>' +
        '<div class="ki-sec ki-code"><div class="ki-code-h"><span>CSS</span><button type="button" class="ki-copy" data-copy-code="css">' + I('copy') + 'Copy</button></div><pre class="code">' + hl(it.css, 'css') + '</pre></div>' +
        (it.js ? '<div class="ki-sec ki-code"><div class="ki-code-h"><span>JS</span><button type="button" class="ki-copy" data-copy-code="js">' + I('copy') + 'Copy</button></div><pre class="code">' + hl(JS[it.js], 'js') + '</pre></div>' : '');
    }
  }
  kiBody.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy-code]');
    if (!b || !selected) return;
    var k = b.getAttribute('data-copy-code');
    XR.copy(k === 'js' ? JS[selected.js] : selected[k]).then(function () { XR.toast(k.toUpperCase() + ' copied — paste it into your project'); });
  });
  $$('.ki-tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { tab = b.getAttribute('data-ki'); renderInspect(); });
  });
  $('.ki-close').addEventListener('click', function () { inspect.classList.remove('is-open'); });

  /* ---------- present mode ---------- */
  var present = $('.present'), stage = $('.present-stage'), pIdx = 0, lastFocus;
  function showPresent(i) {
    pIdx = (i + all.length) % all.length;
    var it = all[pIdx];
    $('.present-name').textContent = it.cat + ' / ' + it.name;
    stage.innerHTML = '<div class="pv" style="' + (it.bg ? '--fbg:' + it.bg + ';' : '') + (it.pad ? '--pad:' + it.pad + ';' : '') + '">' + it.html + '</div>';
    wire(stage);
  }
  function openPresent() {
    lastFocus = document.activeElement;
    present.hidden = false;
    document.body.style.overflow = 'hidden';
    showPresent(selected ? all.indexOf(selected) : 0);
    $('.present-x').focus();
  }
  function closePresent() {
    present.hidden = true;
    document.body.style.overflow = '';
    stage.innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('.kt-present').addEventListener('click', openPresent);
  $('.present-x').addEventListener('click', closePresent);
  $$('[data-pn]').forEach(function (b) { b.addEventListener('click', function () { showPresent(pIdx + +b.getAttribute('data-pn')); }); });
  document.addEventListener('keydown', function (e) {
    if (present.hidden) return;
    if (e.key === 'Escape') closePresent();
    if (e.key === 'ArrowRight' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) showPresent(pIdx + 1);
    if (e.key === 'ArrowLeft' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) showPresent(pIdx - 1);
  });

  /* ---------- init ---------- */
  var inited = false;
  function init() {
    if (inited) return;
    inited = true;
    fit();
    if (!window.matchMedia('(max-width: 960px)').matches) select('hdr-glass');
    wrap.scrollTop = 0;
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(init); });
  setTimeout(init, 1500);
  window.addEventListener('resize', function () { applyZoom(zoom); });
})();
