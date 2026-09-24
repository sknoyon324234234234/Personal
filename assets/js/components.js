/* =====================================================================
   XIRAIYA — UI Kit sections
   One specimen board per category, a live panel per component with
   copyable HTML / CSS / JS, a sticky category bar with search, present mode
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

  /* ---------- sections ---------- */
  var COLS = { Foundations: 2, Headers: 1, Bars: 2, Heroes: 1, Buttons: 3, Cards: 3, Forms: 2, Footers: 1, Loaders: 4, Feedback: 2 };
  function slug(t) { return 'kb-' + t.toLowerCase().replace(/[^a-z]+/g, '-'); }
  var html = '', chips = '';
  KIT.forEach(function (g, gi) {
    chips += '<a href="#' + slug(g.cat) + '" data-kb="' + gi + '">' + esc(g.cat) + '<b>' + g.items.length + '</b></a>';
    html += '<section class="kb-sec" id="' + slug(g.cat) + '" data-kb-sec="' + gi + '">' +
      '<div class="kb-head"><span class="hanko sm">' + g.jp + '</span><h2>' + esc(g.cat) + '</h2><span class="kb-count">' + String(gi + 1).padStart(2, '0') + ' · ' + g.items.length + ' components</span></div>' +
      '<div class="kb-board" style="--cols:' + (COLS[g.cat] || 2) + '"><span class="kb-flabel">' + I('frame') + esc(g.cat) + ' / v3.2</span>';
    g.items.forEach(function (it) {
      it.cat = g.cat; all.push(it); byId[it.id] = it;
      var wide = /^(hdr|hero|ftr)/.test(it.id) || COLS[g.cat] === 1;
      html += '<article class="kb-cell' + (wide ? ' wide' : '') + '" data-id="' + it.id + '" data-name="' + esc((g.cat + ' ' + it.name).toLowerCase()) + '">' +
        '<div class="kb-top"><span class="kb-tag">' + esc(g.cat) + ' / ' + esc(it.name) + '</span><div class="kb-acts">' +
          '<button type="button" data-kb-code aria-expanded="false">' + I('code') + '<span>Code</span></button>' +
          '<button type="button" data-kb-copy="html" title="Copy HTML">' + I('copy') + '<span>HTML</span></button>' +
          '<button type="button" data-kb-copy="css" title="Copy CSS">' + I('copy') + '<span>CSS</span></button>' +
          '<button type="button" data-kb-present title="Present full screen" aria-label="Present ' + esc(it.name) + '">' + I('fullscreen') + '</button></div></div>' +
        '<div class="kb-well" style="' + (it.bg ? '--fbg:' + it.bg + ';' : '') + (it.pad ? '--pad:' + it.pad + ';' : '') + '"><div class="kb-fit">' + it.html + '</div></div>' +
        '<p class="kb-note">' + esc(it.note || '') + (it.js ? ' <em>Has a small script.</em>' : '') + '</p>' +
        '<div class="kb-code" hidden></div>' +
      '</article>';
    });
    html += '</div></section>';
  });
  root.innerHTML = html;
  nav.innerHTML = chips;
  wire(root);
  $$('.k-count').forEach(function (el) { el.textContent = all.length; });

  /* ---------- code panel ---------- */
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
  function codeFor(it, lang) { return lang === 'js' ? JS[it.js] : it[lang]; }
  function paintCode(cell, lang) {
    var it = byId[cell.getAttribute('data-id')], box = $('.kb-code', cell), langs = ['html', 'css'].concat(it.js ? ['js'] : []);
    box.innerHTML = '<div class="kb-code-h"><div role="tablist">' + langs.map(function (l) { return '<button type="button" role="tab" aria-selected="' + (l === lang) + '" data-kb-lang="' + l + '">' + l.toUpperCase() + '</button>'; }).join('') +
      '</div><button type="button" class="ki-copy" data-kb-copy="' + lang + '">' + I('copy') + 'Copy ' + lang.toUpperCase() + '</button></div><pre class="code">' + hl(codeFor(it, lang), lang) + '</pre>';
  }
  root.addEventListener('click', function (e) {
    var cell = e.target.closest('.kb-cell'); if (!cell) return;
    var it = byId[cell.getAttribute('data-id')];
    var t = e.target.closest('[data-kb-code]');
    if (t) {
      var box = $('.kb-code', cell), open = box.hidden;
      if (open) paintCode(cell, 'html');
      box.hidden = !open; t.setAttribute('aria-expanded', open); cell.classList.toggle('is-open', open);
      return;
    }
    var l = e.target.closest('[data-kb-lang]'); if (l) { paintCode(cell, l.getAttribute('data-kb-lang')); return; }
    var c = e.target.closest('[data-kb-copy]');
    if (c) { var lang = c.getAttribute('data-kb-copy'); XR.copy(codeFor(it, lang)).then(function () { XR.toast(it.name + ': ' + lang.toUpperCase() + ' copied'); }); return; }
    if (e.target.closest('[data-kb-present]')) openPresent(all.indexOf(it));
  });

  /* ---------- category bar: scrollspy + search ---------- */
  var secs = $$('.kb-sec', root);
  function spy() {
    var cur = 0, mid = innerHeight * .35;
    secs.forEach(function (s, i) { if (!s.hidden && s.getBoundingClientRect().top < mid) cur = i; });
    $$('a', nav).forEach(function (a) { a.classList.toggle('on', +a.getAttribute('data-kb') === cur); });
  }
  var sp = false;
  window.addEventListener('scroll', function () { if (!sp) { sp = true; requestAnimationFrame(function () { sp = false; spy(); }); } }, { passive: true });
  spy();
  var search = $('.kb-search input');
  if (search) search.addEventListener('input', function () {
    var q = search.value.toLowerCase().trim(), shown = 0;
    secs.forEach(function (s) {
      var any = 0;
      $$('.kb-cell', s).forEach(function (c) { var ok = !q || c.getAttribute('data-name').indexOf(q) > -1; c.hidden = !ok; if (ok) any++; });
      s.hidden = !any; shown += any;
    });
    $('.kb-empty').hidden = shown > 0;
    $('.kb-found').textContent = q ? shown + ' of ' + all.length : all.length + ' components';
  });

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
