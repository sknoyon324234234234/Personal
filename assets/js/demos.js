/* XIRAIYA — demo gallery filter + device preview studio */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$;

  var DEMOS = [
    { id: 'nova-saas', name: 'Nova AI' },
    { id: 'sakura-bistro', name: 'Sakura Bistro' },
    { id: 'vault-dashboard', name: 'Vault' },
    { id: 'blockrealm', name: 'BlockRealm' },
    { id: 'pulse-app', name: 'Pulse' },
    { id: 'mori-tea', name: 'Mori Tea' },
    { id: 'haven', name: 'Haven' },
    { id: 'ledger', name: 'Ledger' },
    { id: 'nomad', name: 'Nomad' },
    { id: 'devdocs', name: 'Kumo Docs' },
    { id: 'orbital', name: 'Orbital' },
    { id: 'kinetik', name: 'Kinetik' },
    { id: 'echo', name: 'Echo' },
    { id: 'medica', name: 'Medica' },
    { id: 'grove', name: 'Grove' },
    { id: 'nimbus', name: 'Nimbus' },
    { id: 'neon-drift', name: 'Neon Drift' },
    { id: 'flowboard', name: 'Flowboard' },
    { id: 'summit', name: 'Summit 26' },
    { id: 'quill', name: 'Quill' }
  ];
  var DEV = { desktop: [1440, 900], laptop: [1280, 800], tablet: [820, 1180], phone: [390, 844] };

  /* filter */
  $$('.dm-filter button').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      $$('.dm-filter button').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
      $$('.dm').forEach(function (c) { c.classList.toggle('is-hidden', f !== 'all' && c.getAttribute('data-k') !== f); });
    });
  });

  /* studio */
  var studio = $('.studio'), stage = $('.st-stage'), device = $('.st-device'), screen = $('.st-screen'), iframe = $('iframe', studio);
  var tabs = $('.st-tabs'), sizeEl = $('.st-size'), openA = $('.st-open'), nameEl = $('.st-name'), rotateBtn = $('.st-rotate');
  var current = null, dev = window.matchMedia('(max-width: 680px)').matches ? 'phone' : 'laptop', rotated = false, lastFocus;

  tabs.innerHTML = DEMOS.map(function (d) { return '<button type="button" role="tab" aria-selected="false" data-demo="' + d.id + '">' + d.name + '</button>'; }).join('');

  function dims() {
    var d = DEV[dev];
    return rotated && (dev === 'tablet' || dev === 'phone') ? [d[1], d[0]] : d;
  }
  function fit() {
    if (studio.hidden) return;
    var d = dims(), W = d[0], H = d[1];
    var chromeX = dev === 'phone' ? 28 : dev === 'tablet' ? 36 : 0, chromeY = dev === 'phone' ? 28 : dev === 'tablet' ? 36 : 26;
    var availW = stage.clientWidth - 36 - chromeX, availH = stage.clientHeight - 36 - chromeY;
    var s = Math.min(1, availW / W, availH / H);
    screen.style.width = Math.round(W * s) + 'px';
    screen.style.height = Math.round(H * s) + 'px';
    iframe.style.width = W + 'px';
    iframe.style.height = H + 'px';
    iframe.style.transform = 'scale(' + s + ')';
    device.className = 'st-device dev-' + dev;
    sizeEl.textContent = W + ' × ' + H + (s < 1 ? ' · ' + Math.round(s * 100) + '%' : '');
    rotateBtn.disabled = !(dev === 'tablet' || dev === 'phone');
  }
  function load(id) {
    current = id;
    var d = DEMOS.find(function (x) { return x.id === id; });
    nameEl.textContent = d.name;
    iframe.src = 'demos/' + id + '.html';
    openA.href = 'demos/' + id + '.html';
    $$('button', tabs).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-demo') === id); });
  }
  function open(id) {
    lastFocus = document.activeElement;
    studio.hidden = false;
    document.body.style.overflow = 'hidden';
    $$('[data-dev]').forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-dev') === dev); });
    load(id);
    fit();
    $('.st-close').focus();
  }
  function close() {
    studio.hidden = true;
    document.body.style.overflow = '';
    iframe.src = 'about:blank';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) open(o.getAttribute('data-open'));
  });
  tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-demo]'); if (b) load(b.getAttribute('data-demo')); });
  $$('[data-dev]').forEach(function (b) {
    b.addEventListener('click', function () {
      dev = b.getAttribute('data-dev'); rotated = false;
      $$('[data-dev]').forEach(function (x) { x.setAttribute('aria-checked', x === b); });
      fit();
    });
  });
  rotateBtn.addEventListener('click', function () { rotated = !rotated; fit(); });
  $('.st-close').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !studio.hidden) close(); });
  window.addEventListener('resize', fit);

  // deep link: demos.html#preview=blockrealm
  var m = location.hash.match(/preview=([\w-]+)/);
  if (m && DEMOS.some(function (d) { return d.id === m[1]; })) setTimeout(function () { open(m[1]); }, 600);
})();
