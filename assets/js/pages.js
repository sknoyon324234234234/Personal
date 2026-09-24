/* XIRAIYA — Pages Studio: live page template editor */
(function () {
  'use strict';
  var XR = window.XR, K = window.XRPages;
  if (!XR || !K) return;
  var $ = XR.$, $$ = XR.$$, icon = XR.icon, esc = XR.esc;
  var root = $('#pst');
  if (!root) return;

  var DEV = { desktop: [1280, 800], tablet: [820, 1180], phone: [390, 844] };
  var KEY = 'xr-pages-v1';

  function defaults() {
    var pages = {};
    K.PAGES.forEach(function (p) { pages[p.id] = { sections: p.s.map(function (k) { return { k: k, v: 0, on: true, o: {} }; }) }; });
    // a few tasteful defaults so every page looks designed out of the box
    pages.home.sections[1].v = 1;
    pages.pricing.sections[1].v = 1;
    pages.contact.sections[0].v = 2;
    pages.blog.sections[0].v = 2;
    pages.login.sections[0].v = 1;
    pages.signup.sections[0].v = 2;
    return {
      page: 'home', brand: 'Lumen', tag: 'The calm workspace for teams that ship',
      p: '#5b5bf0', a: '#ff7a59', tone: 'neutral', mode: 'light', font: 'modern',
      fs: 16, r: 14, space: 1, shadow: .5, bw: 1, bgc: {}, txc: {},
      btn: { style: 'solid', shape: 'rounded', size: 'md', hover: 'lift', icon: true },
      pages: pages
    };
  }
  function load() {
    var d = defaults(), m = location.hash.match(/[#&]d=([^&]+)/), got = null;
    if (m) { try { got = JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch (e) { got = null; } }
    if (!got) got = XR.store(KEY);
    if (!got || typeof got !== 'object') return d;
    Object.keys(d).forEach(function (k) { if (!(k in got)) got[k] = d[k]; });
    got.btn = Object.assign({}, d.btn, got.btn || {});
    K.PAGES.forEach(function (p) { if (!got.pages[p.id] || !Array.isArray(got.pages[p.id].sections)) got.pages[p.id] = d.pages[p.id]; });
    if (!K.PAGES.some(function (p) { return p.id === got.page; })) got.page = 'home';
    return got;
  }

  var S = load(), hist = [JSON.stringify(S)], hi = 0, dev = XR.phone ? 'phone' : 'desktop', mode = 'use', sel = -1, lastTab = 'design';
  var iframe = $('#pv'), frame = $('#frame'), canvas = $('#canvas');

  function pageDef() { return K.PAGES.filter(function (p) { return p.id === S.page; })[0]; }
  function pageState() { return S.pages[S.page]; }
  function pageObj() { return { name: pageDef().name, sections: pageState().sections }; }

  /* ---------------- persistence + history ---------------- */
  var saveT;
  function saved(busy) { var el = $('#pstSaved'); el.textContent = busy ? 'Saving' : 'Saved'; el.classList.toggle('busy', !!busy); }
  function persist() { saved(true); clearTimeout(saveT); saveT = setTimeout(function () { XR.store(KEY, S); saved(false); }, 400); }
  function commit() {
    var j = JSON.stringify(S);
    if (j === hist[hi]) return;
    hist = hist.slice(0, hi + 1); hist.push(j); if (hist.length > 80) hist.shift(); hi = hist.length - 1;
    undoUI(); persist();
  }
  function undoUI() { $('#undoB').disabled = hi <= 0; $('#redoB').disabled = hi >= hist.length - 1; }
  function travel(d) { var n = hi + d; if (n < 0 || n >= hist.length) return; hi = n; S = JSON.parse(hist[hi]); sel = -1; undoUI(); persist(); renderAll(); hint(d < 0 ? 'Undone' : 'Redone'); }

  /* ---------------- canvas ---------------- */
  var EDITOR_CSS =
    'body.xr-select .xr-sec{cursor:pointer;position:relative}' +
    'body.xr-select .xr-sec::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 2px transparent;transition:box-shadow .2s;z-index:50}' +
    'body.xr-select .xr-sec:hover::after{box-shadow:inset 0 0 0 2px rgba(196,50,29,.55)}' +
    'body.xr-select .xr-sec:hover::before{content:attr(data-name);position:absolute;z-index:51;left:10px;top:10px;padding:3px 9px;border-radius:6px;background:#c4321d;color:#fff;font:600 11px system-ui,sans-serif;pointer-events:none}' +
    '.xr-sec.xr-on{position:relative}.xr-sec.xr-on::after{content:"";position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 3px #c4321d!important;z-index:50}' +
    'body.xr-edit [contenteditable]{outline:1px dashed rgba(196,50,29,.35);outline-offset:3px;border-radius:2px;cursor:text}body.xr-edit [contenteditable]:hover{outline-color:#c4321d}body.xr-edit [contenteditable]:focus{outline:2px solid #c4321d}';
  var EDITABLE = 'h1,h2,h3,h4,p,blockquote,summary,li,.btn span,.nav .links a,.mnav a,.wm,.stat span,.stat b,.kick,figcaption b,figcaption small,.eyebrow,.badge,.tags a,.fgrid a,.fgrid h4,.foot small,.chips span,.logo span,label';

  var scrollKeep = 0, pending = false;
  function doc() { try { return iframe.contentDocument; } catch (e) { return null; } }
  function rebuild(keepScroll) {
    var d = doc();
    scrollKeep = keepScroll && d && d.defaultView ? d.defaultView.scrollY : 0;
    frame.classList.remove('loading'); void frame.offsetWidth; frame.classList.add('loading');
    iframe.srcdoc = K.build(S, pageObj(), { editor: EDITOR_CSS });
  }
  iframe.addEventListener('load', function () {
    var d = doc();
    if (!d || !d.body) return;
    if (scrollKeep) d.defaultView.scrollTo(0, scrollKeep);
    applyMode();
    markSel(false);
    d.addEventListener('click', onCanvasClick, true);
    d.addEventListener('input', function () { saved(true); clearTimeout(saveT); saveT = setTimeout(function () { saved(false); }, 600); });
    d.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && mode !== 'edit') { e.preventDefault(); travel(e.shiftKey ? 1 : -1); } });
  });
  var rbT;
  function rebuildSoon() { clearTimeout(rbT); rbT = setTimeout(function () { rebuild(true); }, 220); }

  function applyVars() {
    var d = doc();
    if (!d || !d.getElementById('xr-vars')) return rebuild(true);
    d.getElementById('xr-vars').textContent = K.varsCSS(S);
    d.documentElement.setAttribute('data-btn', S.btn.style);
    d.documentElement.setAttribute('data-hover', S.btn.hover);
    var f = d.getElementById('xr-font'), href = K.fontLink(S);
    if (f && f.getAttribute('href') !== href) f.setAttribute('href', href);
  }
  function applyMode() {
    var d = doc();
    if (!d || !d.body) return;
    d.body.classList.toggle('xr-select', mode === 'select');
    d.body.classList.toggle('xr-edit', mode === 'edit');
    $$(EDITABLE, d.body).forEach(function (el) {
      if (mode === 'edit' && !el.querySelector('input,select,textarea,svg.mark')) el.setAttribute('contenteditable', 'true');
      else el.removeAttribute('contenteditable');
    });
  }
  function onCanvasClick(e) {
    if (mode === 'use') return;
    var s = e.target.closest('.xr-sec');
    if (mode === 'select') {
      e.preventDefault(); e.stopPropagation();
      if (s) { select(+s.getAttribute('data-sec')); tab('sections'); }
    } else if (mode === 'edit') {
      if (e.target.closest('a')) e.preventDefault();
      if (s) { sel = +s.getAttribute('data-sec'); markSel(false); drawSections(); }
    }
  }
  function markSel(scroll) {
    var d = doc();
    if (!d) return;
    $$('.xr-sec', d).forEach(function (el) { el.classList.toggle('xr-on', +el.getAttribute('data-sec') === sel && mode !== 'use'); });
    if (scroll && sel > -1) { var el = d.querySelector('.xr-sec[data-sec="' + sel + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  function fit() {
    var dims = DEV[dev], W = dims[0], H = dims[1];
    var cs = getComputedStyle(canvas), pad = parseFloat(cs.paddingLeft) * 2 + (dev === 'desktop' ? 0 : 24);
    var availW = canvas.clientWidth - pad, availH = canvas.clientHeight - parseFloat(cs.paddingTop) * 2 - (dev === 'desktop' ? 0 : 24);
    var s = Math.min(1, availW / W);
    if (dev !== 'desktop') s = Math.min(s, availH / H);
    var fh = dev === 'desktop' ? availH : H * s;
    frame.style.width = Math.round(W * s) + 'px';
    frame.style.height = Math.round(fh) + 'px';
    iframe.style.width = W + 'px';
    iframe.style.height = Math.round(fh / s) + 'px';
    iframe.style.transform = 'scale(' + s + ')';
    frame.className = 'pst-frame dev-' + dev + (frame.classList.contains('loading') ? ' loading' : '');
    $('#sizeL').textContent = W + ' px · ' + Math.round(s * 100) + '%';
  }

  var hintT;
  function hint(t) { var h = $('#hint'); h.textContent = t; h.classList.add('on'); clearTimeout(hintT); hintT = setTimeout(function () { h.classList.remove('on'); }, 2200); }

  /* ---------------- pages list ---------------- */
  function drawPages() {
    $('#plist').innerHTML = K.PAGES.map(function (p) {
      var n = S.pages[p.id].sections.filter(function (s) { return s.on; }).length;
      return '<button type="button" role="tab" aria-selected="' + (p.id === S.page) + '" data-pg="' + p.id + '"><span class="pi">' + icon(p.ic) + '</span><span>' + esc(p.name) + '<small>' + n + ' section' + (n === 1 ? '' : 's') + '</small></span></button>';
    }).join('');
    $('#pstTitle').textContent = pageDef().name;
  }
  $('#plist').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pg]');
    if (!b || b.getAttribute('data-pg') === S.page) return;
    S.page = b.getAttribute('data-pg'); sel = -1; commit(); drawPages(); drawSections(); rebuild(false);
  });

  /* ---------------- design pane ---------------- */
  function ratio(a, b) { var r = K.contrast(a, b); return r; }
  function ccRow(label, r, need) { var ok = r >= need; return '<div><span>' + label + '</span><span><span class="aa">' + r.toFixed(1) + ':1</span><b class="' + (ok ? 'pass' : 'fail') + '">' + (ok ? 'AA pass' : 'Low') + '</b></span></div>'; }
  function drawDesign() {
    var t = K.tokens(S);
    var bg = t['--bg'], tx = t['--tx'];
    var h = '';
    h += '<div class="grp"><h4>Brand</h4><label class="fld">Name<input type="text" id="dBrand" maxlength="24" value="' + esc(S.brand) + '"></label><label class="fld">Headline<input type="text" id="dTag" maxlength="80" value="' + esc(S.tag) + '"></label></div>';
    h += '<div class="grp"><h4>Palette <button type="button" id="dRandPal">Shuffle</button></h4><div class="swatches">' + K.PALETTES.map(function (p, i) {
      return '<button type="button" class="sw" data-pal="' + i + '" aria-label="' + p.n + '" title="' + p.n + '" aria-pressed="' + (S.p.toLowerCase() === p.p && S.a.toLowerCase() === p.a) + '"><i style="background:' + p.p + '"></i><i style="background:' + p.a + '"></i></button>';
    }).join('') + '</div><div class="crow" style="margin-top:10px">' +
      '<label class="cpick"><input type="color" data-c="p" value="' + S.p + '" aria-label="Primary colour"><span><small>Primary</small><input type="text" data-ct="p" value="' + S.p + '" maxlength="7" aria-label="Primary hex"></span></label>' +
      '<label class="cpick"><input type="color" data-c="a" value="' + S.a + '" aria-label="Accent colour"><span><small>Accent</small><input type="text" data-ct="a" value="' + S.a + '" maxlength="7" aria-label="Accent hex"></span></label></div></div>';
    h += '<div class="grp"><h4>Surface</h4><div class="chips2" id="dTone">' + Object.keys(K.TONES).map(function (k) { return '<button type="button" data-tone="' + k + '" aria-pressed="' + (S.tone === k) + '">' + K.TONES[k].n + '</button>'; }).join('') + '</div>' +
      '<div class="chips2" id="dMode" style="margin-top:8px"><button type="button" data-md="light" aria-pressed="' + (S.mode === 'light') + '">Light</button><button type="button" data-md="dark" aria-pressed="' + (S.mode === 'dark') + '">Dark</button></div>' +
      '<div class="crow" style="margin-top:10px"><label class="cpick"><input type="color" data-o="bgc" value="' + bg + '" aria-label="Background colour"><span><small>Background</small><input type="text" data-ot="bgc" value="' + bg + '" maxlength="7" aria-label="Background hex"></span></label>' +
      '<label class="cpick"><input type="color" data-o="txc" value="' + tx + '" aria-label="Text colour"><span><small>Text</small><input type="text" data-ot="txc" value="' + tx + '" maxlength="7" aria-label="Text hex"></span></label></div>' +
      ((S.bgc && S.bgc[S.mode]) || (S.txc && S.txc[S.mode]) ? '<div class="chips2" style="margin-top:8px"><button type="button" id="dResetC">Reset background and text</button></div>' : '') + '</div>';
    h += '<div class="grp"><h4>Typography</h4><div class="fonts">' + K.FONTS.map(function (f) { return '<button type="button" data-font="' + f.id + '" aria-pressed="' + (S.font === f.id) + '"><b>' + esc(f.name) + '</b><span>Aa</span></button>'; }).join('') + '</div></div>';
    h += '<div class="grp"><h4>Shape and space</h4>' +
      rng('fs', 'Base text size', 14, 19, 1, S.fs, 'px') + rng('r', 'Corner radius', 0, 32, 1, S.r, 'px') + rng('space', 'Section spacing', .6, 1.5, .05, S.space, 'x') +
      rng('shadow', 'Shadow depth', 0, 1, .05, S.shadow, '') + rng('bw', 'Border width', 0, 2, 1, S.bw, 'px') + '</div>';
    h += '<div class="grp"><h4>Contrast check</h4><div class="cc">' + ccRow('Text on background', ratio(tx, bg), 4.5) + ccRow('Button label on primary', ratio(K.onColor(S.p), S.p), 4.5) + ccRow('Primary on background', ratio(S.p, bg), 3) + '</div></div>';
    $('#paneDesign').innerHTML = h;
  }
  function rng(k, label, min, max, step, val, unit) {
    return '<label class="rng">' + label + '<output data-out="' + k + '">' + fmtR(val, unit) + '</output><input type="range" data-r="' + k + '" data-u="' + unit + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>';
  }
  function fmtR(v, u) { v = +v; return (u === 'x' ? v.toFixed(2) : u === '' ? Math.round(v * 100) + '%' : v) + (u === 'x' || u === '' ? (u === 'x' ? 'x' : '') : u); }
  var validHex = function (v) { return /^#[0-9a-f]{6}$/i.test(v); };

  var pane = $('#paneDesign');
  pane.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'dBrand') { S.brand = t.value.trim() || 'Lumen'; rebuildSoon(); return; }
    if (t.id === 'dTag') { S.tag = t.value.trim() || 'Your headline'; rebuildSoon(); return; }
    if (t.hasAttribute('data-c')) { S[t.getAttribute('data-c')] = t.value; syncTxt(t.getAttribute('data-c'), t.value, 'ct'); applyVars(); return; }
    if (t.hasAttribute('data-ct')) { var v = t.value.trim(); if (v[0] !== '#') v = '#' + v; if (validHex(v)) { S[t.getAttribute('data-ct')] = v.toLowerCase(); $('[data-c="' + t.getAttribute('data-ct') + '"]', pane).value = v; applyVars(); } return; }
    if (t.hasAttribute('data-o')) { setOverride(t.getAttribute('data-o'), t.value); syncTxt(t.getAttribute('data-o'), t.value, 'ot'); applyVars(); return; }
    if (t.hasAttribute('data-ot')) { var w = t.value.trim(); if (w[0] !== '#') w = '#' + w; if (validHex(w)) { setOverride(t.getAttribute('data-ot'), w.toLowerCase()); $('[data-o="' + t.getAttribute('data-ot') + '"]', pane).value = w; applyVars(); } return; }
    if (t.hasAttribute('data-r')) { var k = t.getAttribute('data-r'); S[k] = +t.value; $('[data-out="' + k + '"]', pane).textContent = fmtR(t.value, t.getAttribute('data-u')); applyVars(); }
  });
  pane.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('#dBrand,#dTag,[data-r],[data-c],[data-ct],[data-o],[data-ot]')) { commit(); if (!t.matches('#dBrand,#dTag,[data-r]')) drawDesign(); drawButtons(); }
  });
  function syncTxt(k, v, attr) { var el = $('[data-' + attr + '="' + k + '"]', pane); if (el) el.value = v; }
  function setOverride(k, v) { S[k] = S[k] || {}; S[k][S.mode] = v; }
  pane.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-pal')) { var p = K.PALETTES[+b.getAttribute('data-pal')]; S.p = p.p; S.a = p.a; hint(p.n + ' palette'); }
    else if (b.id === 'dRandPal') { var hue = Math.floor(Math.random() * 360); S.p = hsl(hue, 70, 48); S.a = hsl((hue + 150 + Math.random() * 60) % 360, 80, 58); hint('Fresh palette'); }
    else if (b.hasAttribute('data-tone')) S.tone = b.getAttribute('data-tone');
    else if (b.hasAttribute('data-md')) S.mode = b.getAttribute('data-md');
    else if (b.id === 'dResetC') { if (S.bgc) delete S.bgc[S.mode]; if (S.txc) delete S.txc[S.mode]; }
    else if (b.hasAttribute('data-font')) { S.font = b.getAttribute('data-font'); hint(K.FONTS.filter(function (f) { return f.id === S.font; })[0].name); }
    else return;
    applyVars(); commit(); drawDesign(); drawButtons(); darkUI();
  });
  function hsl(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0'); };
    return '#' + f(0) + f(8) + f(4);
  }

  /* ---------------- sections pane ---------------- */
  function thumb(k, v) {
    // tiny abstract wireframe for each variant
    var c = 'currentColor', o = ' fill="' + c + '" opacity=".22"', s = ' fill="' + c + '" opacity=".6"';
    var g = '';
    if (k === 'hero') g = [v === 1 ? '<rect x="8" y="12" width="40" height="5" rx="2"' + s + '/><rect x="8" y="21" width="30" height="3" rx="1.5"' + o + '/><rect x="8" y="28" width="16" height="6" rx="3"' + s + '/><rect x="58" y="8" width="54" height="30" rx="4"' + o + '/>' :
      v === 2 ? '<rect x="8" y="8" width="90" height="9" rx="2"' + s + '/><rect x="8" y="21" width="40" height="3" rx="1.5"' + o + '/><rect x="8" y="28" width="104" height="12" rx="3"' + o + '/>' :
      v === 3 ? '<rect x="0" y="0" width="120" height="44"' + o + '/><rect x="30" y="10" width="60" height="5" rx="2"' + s + '/><rect x="18" y="26" width="24" height="10" rx="3"' + o + '/><rect x="48" y="26" width="24" height="10" rx="3"' + o + '/><rect x="78" y="26" width="24" height="10" rx="3"' + o + '/>' :
      v === 4 ? '<rect x="30" y="10" width="60" height="5" rx="2"' + s + '/><rect x="20" y="22" width="80" height="9" rx="4.5"' + o + '/><rect x="72" y="23.5" width="26" height="6" rx="3"' + s + '/>' :
      '<rect x="25" y="10" width="70" height="6" rx="2"' + s + '/><rect x="35" y="20" width="50" height="3" rx="1.5"' + o + '/><rect x="42" y="28" width="16" height="6" rx="3"' + s + '/><rect x="62" y="28" width="16" height="6" rx="3"' + o + '/>'][0];
    else if (k === 'nav') g = v === 1 ? '<rect x="8" y="19" width="30" height="4" rx="2"' + o + '/><rect x="52" y="17" width="16" height="8" rx="3"' + s + '/><rect x="92" y="18" width="20" height="6" rx="3"' + s + '/>' : v === 2 ? '<rect x="6" y="12" width="108" height="20" rx="10"' + o + '/><rect x="12" y="18" width="14" height="8" rx="3"' + s + '/><rect x="92" y="18" width="18" height="8" rx="4"' + s + '/>' : v === 3 ? '<rect x="8" y="17" width="16" height="8" rx="3"' + s + '/><rect x="96" y="17" width="16" height="8" rx="3"' + o + '/>' : v === 4 ? '<rect x="0" y="0" width="120" height="10"' + s + '/><rect x="8" y="22" width="14" height="8" rx="3"' + s + '/><rect x="40" y="24" width="40" height="4" rx="2"' + o + '/><rect x="92" y="22" width="20" height="8" rx="3"' + s + '/>' : '<rect x="8" y="17" width="14" height="8" rx="3"' + s + '/><rect x="34" y="19" width="44" height="4" rx="2"' + o + '/><rect x="92" y="17" width="20" height="8" rx="3"' + s + '/>';
    else {
      var n = [3, 2, 4, 3, 2][v % 5];
      for (var i = 0; i < n; i++) g += '<rect x="' + (8 + i * (104 / n)) + '" y="' + (v % 2 ? 14 : 10) + '" width="' + (104 / n - 6) + '" height="' + (v % 2 ? 16 : 24) + '" rx="3"' + (i === (v % n) ? s : o) + '/>';
    }
    return '<svg viewBox="0 0 120 44" aria-hidden="true">' + g + '</svg>';
  }
  function drawSections() {
    var ps = pageState(), list = ps.sections;
    var h = '<div class="grp"><h4>Layers <span style="text-transform:none;letter-spacing:0;font-weight:500">' + list.length + '</span></h4><div class="layers">' + list.map(function (s, i) {
      var d = K.SEC[s.k];
      return '<div class="lyr' + (i === sel ? ' sel' : '') + (s.on ? '' : ' off') + '" data-i="' + i + '"><button type="button" class="nm" data-act="sel"><b>' + esc(d.name) + '</b><small>' + esc(d.v[Math.min(s.v, d.v.length - 1)]) + '</small></button>' +
        '<button type="button" class="ib" data-act="up" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + icon('arrow-up') + '</button>' +
        '<button type="button" class="ib" data-act="vis" aria-label="' + (s.on ? 'Hide' : 'Show') + ' section">' + icon(s.on ? 'eye' : 'minus') + '</button></div>';
    }).join('') + '</div>';
    if (!list.some(function (x) { return K.SEC[x.k] && K.SEC[x.k].full; })) {
      h += '<div class="addsec" id="addsec"><button type="button" data-act="add">' + icon('plus') + 'Add a section</button><div class="addlist">' + K.LIBRARY.map(function (k) { return '<button type="button" data-add="' + k + '">' + esc(K.SEC[k].name) + '</button>'; }).join('') + '</div></div>';
    }
    h += '</div>';
    if (sel > -1 && list[sel]) {
      var s = list[sel], d = K.SEC[s.k];
      h += '<div class="grp"><h4>' + esc(d.name) + ' variant</h4><div class="vars">' + d.v.map(function (n, i) { return '<button type="button" data-var="' + i + '" aria-pressed="' + (i === s.v) + '">' + thumb(s.k, i) + esc(n) + '</button>'; }).join('') + '</div></div>';
      if (d.o) h += '<div class="grp"><h4>Options</h4><div class="tgls">' + d.o.map(function (o) { var on = s.o && o[0] in s.o ? s.o[o[0]] : o[2]; return '<label class="tg">' + esc(o[1]) + '<input type="checkbox" data-opt="' + o[0] + '"' + (on ? ' checked' : '') + '></label>'; }).join('') + '</div></div>';
      h += '<div class="grp"><h4>Actions</h4><div class="secacts">' +
        '<button type="button" data-act="up" data-i="' + sel + '"' + (sel === 0 ? ' disabled' : '') + '>' + icon('arrow-up') + 'Up</button>' +
        '<button type="button" data-act="down" data-i="' + sel + '"' + (sel === list.length - 1 ? ' disabled' : '') + '>' + icon('arrow-up').replace('<svg', '<svg style="transform:rotate(180deg)"') + 'Down</button>' +
        '<button type="button" data-act="dup" data-i="' + sel + '"' + (d.full ? ' disabled' : '') + '>' + icon('copy') + 'Copy</button>' +
        '<button type="button" data-act="del" data-i="' + sel + '"' + (list.length < 2 ? ' disabled' : '') + '>' + icon('trash') + 'Delete</button></div></div>';
    } else {
      h += '<div class="grp"><div class="empty-sel">Pick a layer above, or switch the canvas to <b>Select</b> and click any section on the page.</div></div>';
    }
    $('#paneSections').innerHTML = h;
  }
  function select(i) { sel = i; drawSections(); markSel(true); }
  $('#paneSections').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var list = pageState().sections, row = b.closest('[data-i]'), i = row ? +row.getAttribute('data-i') : sel, act = b.getAttribute('data-act');
    if (act === 'sel') { select(i === sel ? -1 : i); return; }
    if (act === 'add') { $('#addsec').classList.toggle('open'); return; }
    if (b.hasAttribute('data-add')) {
      var k = b.getAttribute('data-add'), at = sel > -1 ? sel + 1 : Math.max(0, list.length - (list[list.length - 1] && list[list.length - 1].k === 'footer' ? 1 : 0));
      list.splice(at, 0, { k: k, v: 0, on: true, o: {} }); sel = at; hint(K.SEC[k].name + ' added');
    } else if (b.hasAttribute('data-var')) { list[sel].v = +b.getAttribute('data-var'); hint(K.SEC[list[sel].k].name + ': ' + K.SEC[list[sel].k].v[list[sel].v]); }
    else if (act === 'up' && i > 0) { list.splice(i - 1, 0, list.splice(i, 1)[0]); if (sel === i) sel = i - 1; }
    else if (act === 'down' && i < list.length - 1) { list.splice(i + 1, 0, list.splice(i, 1)[0]); if (sel === i) sel = i + 1; }
    else if (act === 'vis') { list[i].on = !list[i].on; }
    else if (act === 'dup') { list.splice(i + 1, 0, JSON.parse(JSON.stringify(list[i]))); sel = i + 1; hint('Section duplicated'); }
    else if (act === 'del' && list.length > 1) { var nm = K.SEC[list[i].k].name; list.splice(i, 1); sel = -1; hint(nm + ' deleted. Ctrl Z brings it back.'); }
    else return;
    commit(); drawSections(); drawPages(); rebuild(true);
    setTimeout(function () { markSel(act !== 'vis'); }, 300);
  });
  $('#paneSections').addEventListener('change', function (e) {
    var t = e.target;
    if (!t.hasAttribute('data-opt') || sel < 0) return;
    var s = pageState().sections[sel]; s.o = s.o || {}; s.o[t.getAttribute('data-opt')] = t.checked;
    commit(); rebuild(true);
  });

  /* ---------------- buttons pane ---------------- */
  function bpStyle() { return '--bpc:' + S.p + ';--bpa:' + S.a + ';--bpo:' + K.onColor(S.p) + ';--bpr:' + (S.btn.shape === 'pill' ? '999px' : S.btn.shape === 'square' ? '4px' : '10px') + ';'; }
  function drawButtons() {
    var b = S.btn, st = bpStyle();
    var h = '<div class="grp"><h4>Style</h4><div class="bstyles" style="' + st + '">' + K.BTN.style.map(function (x) {
      return '<button type="button" class="bst" data-bs="' + x[0] + '" aria-pressed="' + (b.style === x[0]) + '"><span class="bp ' + (x[0] === '3d' ? 'b3d' : x[0]) + '">Get started</span>' + x[1] + '</button>';
    }).join('') + '</div></div>';
    [['shape', 'Shape'], ['size', 'Size'], ['hover', 'Hover effect']].forEach(function (g) {
      h += '<div class="grp"><h4>' + g[1] + '</h4><div class="chips2">' + K.BTN[g[0]].map(function (x) { return '<button type="button" data-bk="' + g[0] + '" data-bv="' + x[0] + '" aria-pressed="' + (b[g[0]] === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
    });
    h += '<div class="grp"><h4>Details</h4><div class="tgls"><label class="tg">Arrow icon on main buttons<input type="checkbox" id="bIcon"' + (b.icon ? ' checked' : '') + '></label></div></div>';
    h += '<div class="grp"><h4>Preview</h4><div class="bprev" style="' + st + '"><span class="bp ' + (b.style === '3d' ? 'b3d' : b.style) + '">Primary</span><span class="bp" style="border:1px solid var(--line-2);color:var(--ink)">Secondary</span></div><p style="margin-top:10px;font-size:12.5px;color:var(--ink-3)">Hover the buttons on the canvas to feel the effect.</p></div>';
    $('#paneButtons').innerHTML = h;
  }
  $('#paneButtons').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-bs')) S.btn.style = b.getAttribute('data-bs');
    else if (b.hasAttribute('data-bk')) S.btn[b.getAttribute('data-bk')] = b.getAttribute('data-bv');
    else return;
    applyVars(); commit(); drawButtons(); hint('Buttons: ' + S.btn.style + ', ' + S.btn.shape + ', ' + S.btn.hover);
  });
  $('#paneButtons').addEventListener('change', function (e) { if (e.target.id === 'bIcon') { S.btn.icon = e.target.checked; commit(); rebuild(true); } });

  /* ---------------- tabs, toolbar ---------------- */
  function tab(t) {
    lastTab = t;
    $$('.pst-tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === t); });
    $$('.pane').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-pane') === t); });
  }
  $$('.pst-tabs [data-tab]').forEach(function (b) { b.addEventListener('click', function () { tab(b.getAttribute('data-tab')); }); });

  $$('#modeSeg [data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-mode');
      $$('#modeSeg [data-mode]').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
      applyMode(); markSel(false);
      hint(mode === 'use' ? 'Use mode: click around like a visitor' : mode === 'select' ? 'Select mode: click any section to edit it' : 'Text mode: click any text and type. Export keeps your words.');
      if (mode === 'select') tab('sections');
    });
  });
  $$('#devSeg [data-dev]').forEach(function (b) {
    b.addEventListener('click', function () {
      dev = b.getAttribute('data-dev');
      $$('#devSeg [data-dev]').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
      fit();
    });
  });
  function darkUI() { var d = $('#darkB'); d.classList.toggle('on', S.mode === 'dark'); d.innerHTML = icon(S.mode === 'dark' ? 'sun' : 'moon'); }
  $('#darkB').addEventListener('click', function () { S.mode = S.mode === 'dark' ? 'light' : 'dark'; applyVars(); commit(); drawDesign(); darkUI(); hint(S.mode === 'dark' ? 'Dark mode' : 'Light mode'); });
  $('#undoB').addEventListener('click', function () { travel(-1); });
  $('#redoB').addEventListener('click', function () { travel(1); });
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    var k = e.key.toLowerCase();
    if (k === 'z') { e.preventDefault(); travel(e.shiftKey ? 1 : -1); }
    else if (k === 'y') { e.preventDefault(); travel(1); }
  });

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  $('#luckyB').addEventListener('click', function () {
    var p = pick(K.PALETTES);
    S.p = p.p; S.a = p.a; S.font = pick(K.FONTS).id; S.tone = pick(Object.keys(K.TONES));
    S.r = pick([0, 6, 10, 14, 18, 24]); S.shadow = pick([0, .3, .5, .8]); S.bw = pick([0, 1, 1, 2]); S.space = pick([.85, 1, 1.15]);
    S.btn.style = pick(K.BTN.style)[0]; S.btn.shape = pick(K.BTN.shape)[0]; S.btn.hover = pick(K.BTN.hover.slice(0, 4))[0];
    pageState().sections.forEach(function (s) { s.v = Math.floor(Math.random() * K.SEC[s.k].v.length); });
    sel = -1; commit(); renderAll();
    hint(p.n + ' + ' + K.FONTS.filter(function (f) { return f.id === S.font; })[0].name + ' + ' + S.btn.style + ' buttons');
  });
  $('#shareB').addEventListener('click', function () {
    var data = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    var url = location.href.split('#')[0] + '#d=' + data;
    XR.copy(url);
    XR.toast('Share link copied. Anyone who opens it sees this exact design.');
  });

  /* ---------------- export ---------------- */
  function cleanHTML() {
    var d = doc();
    if (!d) return K.build(S, pageObj());
    var c = d.documentElement.cloneNode(true);
    ['#xr-ed'].forEach(function (s) { var el = c.querySelector(s); if (el) el.remove(); });
    $$('[contenteditable]', c).forEach(function (el) { el.removeAttribute('contenteditable'); });
    $$('.xr-sec', c).forEach(function (w) { while (w.firstChild) w.parentNode.insertBefore(w.firstChild, w); w.remove(); });
    var body = c.querySelector('body'); if (body) body.removeAttribute('class');
    return '<!doctype html>\n' + c.outerHTML;
  }
  var expB = $('#expB'), expM = $('#expM');
  expB.addEventListener('click', function (e) { e.stopPropagation(); var on = expM.classList.toggle('on'); expB.setAttribute('aria-expanded', on); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.pst-exp')) { expM.classList.remove('on'); expB.setAttribute('aria-expanded', 'false'); } });
  expM.addEventListener('click', function (e) {
    var b = e.target.closest('[data-exp]');
    if (!b) return;
    var k = b.getAttribute('data-exp'), html = cleanHTML(), name = (S.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'page') + '-' + S.page + '.html';
    if (k === 'dl') {
      var url = URL.createObjectURL(new Blob([html], { type: 'text/html' })), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      XR.toast('Downloaded ' + name + '. Open it anywhere, no build step.');
    } else if (k === 'html') { XR.copy(html); XR.toast('HTML copied (' + Math.round(html.length / 1024) + ' KB).'); }
    else if (k === 'css') { XR.copy(K.varsCSS(S).replace('{', '{\n  ').replace(/;/g, ';\n  ').replace(/\s+}$/, '\n}')); XR.toast('Design tokens copied as CSS variables.'); }
    else if (k === 'tab') { var w = window.open('', '_blank'); if (w) { w.document.open(); w.document.write(html); w.document.close(); } else XR.toast('Pop-up blocked. Allow pop-ups or use Download.', 'warn'); }
    if (XR.quest) XR.quest('studio-export');
    expM.classList.remove('on'); expB.setAttribute('aria-expanded', 'false');
  });

  /* ---------------- boot ---------------- */
  function renderAll() { drawPages(); drawDesign(); drawSections(); drawButtons(); darkUI(); rebuild(true); }
  $$('#devSeg [data-dev]').forEach(function (x) { x.setAttribute('aria-checked', x.getAttribute('data-dev') === dev); });
  renderAll(); undoUI(); fit();
  window.addEventListener('resize', fit);
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(canvas);
  if (location.hash.indexOf('d=') > -1) setTimeout(function () { XR.toast('Loaded a shared design. Your changes save to this browser.'); }, 900);
})();
