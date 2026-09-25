/* Lab chapter 03 - Pop-up Demon Slayer: a Chrome extension service demo */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  var POPUPS = [
    { t: 'YOU WON A PHONE!!!' },
    { t: 'Allow notifications?' },
    { t: 'SUBSCRIBE NOW!!' },
    { t: 'Spin the wheel!' },
    { t: 'VIRUS DETECTED!!!' }
  ];
  var SPOTS = [
    { l: 5, t: 6, r: -7 },
    { l: 44, t: 2, r: 5 },
    { l: 14, t: 42, r: -4 },
    { l: 52, t: 38, r: 6 },
    { l: 28, t: 68, r: -5 }
  ];
  var CAP = 5, SPAWN_MS = 4400;

  var ARTICLE = {
    h: 'Himsagar season pushes Rajshahi mango prices down',
    p: 'Traders at Shaheb Bazar say this year’s harvest is arriving early, and stalls are already cutting prices as supply builds. Buyers who wait a week or two may find the season’s favourite mango even cheaper.',
    product: 'Himsagar mango 5 kg',
    price: '৳1,450'
  };

  /* short manifest v3 style snippets, hand-marked with .t/.a/.s/.c/.k spans */
  var CODE = {
    base: { file: 'manifest.json', hl: [4, 5, 6, 7], lines: [
      '{',
      '  <span class="t">"manifest_version"</span>: <span class="s">3</span>,',
      '  <span class="t">"name"</span>: <span class="s">"Pop-up Demon Slayer"</span>,',
      '  <span class="t">"action"</span>: { <span class="t">"default_title"</span>: <span class="s">"Slay pop-ups"</span> },',
      '  <span class="t">"content_scripts"</span>: [{',
      '    <span class="t">"matches"</span>: [<span class="s">"*://dailyink.news/*"</span>],',
      '    <span class="t">"js"</span>: [<span class="s">"content.js"</span>]',
      '  }]',
      '}'
    ] },
    slay: { file: 'content.js', hl: [2, 3, 4], lines: [
      '<span class="c">// content.js — slay pop-up demons on sight</span>',
      '<span class="k">var</span> DEMON = <span class="s">\'.ad-popup, .overlay-ad\'</span>;',
      'document.<span class="a">querySelectorAll</span>(DEMON).<span class="a">forEach</span>(<span class="k">function</span> (el) {',
      '  el.classList.<span class="a">add</span>(<span class="s">\'slain\'</span>);  <span class="c">// play the slash</span>',
      '  <span class="k">setTimeout</span>(<span class="k">function</span> () { el.<span class="a">remove</span>(); }, 220);',
      '});'
    ] },
    hilite: { file: 'content.js', hl: [2, 3, 4], lines: [
      '<span class="c">// content.js — mark the words you care about</span>',
      '<span class="k">var</span> words = [<span class="s">\'mango\'</span>, <span class="s">\'price\'</span>];',
      '<span class="k">var</span> re = <span class="k">new</span> <span class="a">RegExp</span>(<span class="s">\'(\' + words.join(\'|\') + \')\', \'gi\'</span>);',
      'document.<span class="a">querySelectorAll</span>(<span class="s">\'p, h1\'</span>).<span class="a">forEach</span>(<span class="k">function</span> (el) {',
      '  el.innerHTML = el.innerHTML.<span class="a">replace</span>(re, <span class="s">\'&lt;mark&gt;$1&lt;/mark&gt;\'</span>);',
      '});'
    ] },
    price: { file: 'content.js', hl: [3], lines: [
      '<span class="c">// content.js — flag a price drop since last visit</span>',
      'chrome.storage.local.<span class="a">get</span>(<span class="s">\'lastPrice\'</span>, <span class="k">function</span> (data) {',
      '  <span class="k">var</span> now = 1450, was = data.lastPrice || 1650;',
      '  <span class="k">if</span> (now &lt; was) <span class="a">flagDrop</span>(<span class="s">\'Down ৳\' + (was - now) + \' since Monday\'</span>);',
      '  chrome.storage.local.<span class="a">set</span>({ lastPrice: now });',
      '});'
    ] }
  };

  function esc(s) { return XR.esc(s); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function markup() {
    return '' +
      '<div class="km-page mex-page">' +
        '<div class="km-panel km-tone-dark km-slant mex-cap">' +
          '<span class="km-tag is-red">Chapter 03</span>' +
          '<h3 class="km-h">Pop-up Demon Slayer</h3>' +
          '<span class="mex-cap-sub">A content script for <b>dailyink.news</b></span>' +
        '</div>' +
        '<div class="km-panel km-tone mex-browser">' +
          '<div class="mex-bar">' +
            '<span class="mex-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
            '<span class="mex-addr">' + XR.icon('lock') + '<span>dailyink.news/market</span></span>' +
            '<span class="mex-ext-slot" aria-hidden="true">' + XR.icon('puzzle') + '</span>' +
          '</div>' +
          '<div class="mex-art">' +
            '<span class="mex-kicker">Markets</span>' +
            '<h4 class="mex-h1"></h4>' +
            '<p class="mex-p"></p>' +
            '<div class="mex-product">' +
              '<b class="mex-name"></b><span class="mex-price"></span>' +
              '<span class="mex-watch" aria-hidden="true"><svg viewBox="0 0 34 14" aria-hidden="true"><polyline points="1,4 9,9 17,5 25,11 33,3"/></svg>Down ৳200 since Monday</span>' +
            '</div>' +
            '<div class="mex-pops"></div>' +
          '</div>' +
        '</div>' +
        '<div class="mex-side">' +
          '<div class="km-panel km-tone-2 mex-install-panel">' +
            '<button type="button" class="km-btn is-red mex-install">' + XR.icon('shield') + 'Install extension</button>' +
            '<div class="mex-slayer">' +
              '<span class="km-focus" aria-hidden="true"></span>' +
              '<img class="mex-slayer-img" alt="" width="120" height="103" loading="lazy">' +
              '<span class="km-shout">GOT YOU!</span>' +
            '</div>' +
          '</div>' +
          '<div class="km-panel km-tone mex-toggles">' +
            '<div class="mex-row">' +
              '<button type="button" class="km-btn mex-t-slay" aria-pressed="false" disabled>' + XR.icon('zap') + 'Slay pop-ups</button>' +
              '<span class="mex-count">Demons slain: <b>0</b></span>' +
            '</div>' +
            '<div class="mex-row">' +
              '<button type="button" class="km-btn mex-t-hilite" aria-pressed="false" disabled>' + XR.icon('search') + 'Highlight words</button>' +
              '<span class="mex-hw"><label for="mex-hw-in">Words</label><input id="mex-hw-in" type="text" value="mango, price" disabled></span>' +
            '</div>' +
            '<div class="mex-row">' +
              '<button type="button" class="km-btn mex-t-price" aria-pressed="false" disabled>' + XR.icon('trending') + 'Price watch</button>' +
            '</div>' +
          '</div>' +
          '<div class="km-panel km-tone-dark mex-code">' +
            '<div class="mex-code-file"></div>' +
            '<pre class="km-code mex-code-pre"></pre>' +
          '</div>' +
        '</div>' +
        '<p class="mex-status" aria-live="polite"></p>' +
      '</div>';
  }

  LAB.register('extension', function (stage) {
    var rng = LAB.rng('mex-demons');
    var installed = false, slayOn = false, hiliteOn = false, priceOn = false;
    var slain = 0, active = [], deck = [], spawnTimer = 0, onscreen = true;
    var outMs = XR.reduce ? 30 : 500, sfxMs = XR.reduce ? 30 : 700;

    stage.innerHTML = markup();
    var pops = XR.$('.mex-pops', stage);
    var els = {
      ext: XR.$('.mex-ext-slot', stage),
      install: XR.$('.mex-install', stage),
      slayer: XR.$('.mex-slayer', stage),
      slayerImg: XR.$('.mex-slayer-img', stage),
      h1: XR.$('.mex-h1', stage),
      p: XR.$('.mex-p', stage),
      name: XR.$('.mex-name', stage),
      price: XR.$('.mex-price', stage),
      watch: XR.$('.mex-watch', stage),
      tSlay: XR.$('.mex-t-slay', stage),
      tHilite: XR.$('.mex-t-hilite', stage),
      tPrice: XR.$('.mex-t-price', stage),
      hwIn: XR.$('#mex-hw-in', stage),
      count: XR.$('.mex-count b', stage),
      codeFile: XR.$('.mex-code-file', stage),
      code: XR.$('.mex-code-pre', stage),
      status: XR.$('.mex-status', stage)
    };

    /* ---- seeded shuffle so demons cycle without instant repeats ---- */
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } }
    function pickDef() { if (!deck.length) { deck = [0, 1, 2, 3, 4]; shuffle(deck); } return POPUPS[deck.pop()]; }

    /* ---- article text + highlight-words feature ---- */
    function highlight(text) {
      var raw = esc(text);
      if (!hiliteOn) return raw;
      var words = (els.hwIn.value || '').split(',').map(function (w) { return w.trim(); }).filter(Boolean);
      if (!words.length) return raw;
      var re = new RegExp('(' + words.map(escRe).join('|') + ')', 'gi');
      return raw.replace(re, '<mark class="mex-mark">$1</mark>');
    }
    function renderArticle() {
      els.h1.innerHTML = highlight(ARTICLE.h);
      els.p.innerHTML = highlight(ARTICLE.p);
      els.name.innerHTML = highlight(ARTICLE.product);
      els.price.textContent = ARTICLE.price;
    }

    /* ---- code panel: shows the content script for the active feature ---- */
    function renderCode(key) {
      var d = CODE[key];
      els.codeFile.textContent = d.file;
      els.code.innerHTML = d.lines.map(function (ln, i) {
        return '<span class="mex-cl' + (d.hl.indexOf(i) > -1 ? ' mex-hl' : '') + '">' + ln + '</span>';
      }).join('');
    }
    function refreshCode() { renderCode(slayOn ? 'slay' : hiliteOn ? 'hilite' : priceOn ? 'price' : 'base'); }

    function setStatus() {
      els.status.textContent = (installed ? 'Extension installed.' : 'Extension not installed.') + ' Demons slain: ' + slain + '.';
      els.count.textContent = slain;
    }

    /* ---- pop-up demons: spawn, shake in, get slashed away ---- */
    function spawnSfx(near) {
      var s = document.createElement('i');
      s.className = 'km-sfx is-red is-pop mex-sfx';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = 'ズバッ!';
      s.style.left = near.style.left;
      s.style.top = near.style.top;
      pops.appendChild(s);
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, sfxMs);
    }
    function slayOne(p) {
      if (p.dead) return;
      p.dead = true;
      p.el.classList.add('is-slain');
      spawnSfx(p.el);
      setTimeout(function () {
        if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
        active = active.filter(function (x) { return x !== p; });
        slain++;
        setStatus();
      }, outMs);
    }
    function slayAll() {
      active.slice().forEach(function (p, i) { setTimeout(function () { slayOne(p); }, i * 220); });
    }
    function spawnOne() {
      if (active.length >= CAP) return;
      var def = pickDef(), spot = SPOTS[active.length % SPOTS.length], tone = active.length % 3;
      var el = document.createElement('div');
      el.className = 'mex-pop mex-tone-' + tone + ' km-in km-shake';
      el.setAttribute('aria-hidden', 'true');
      el.style.left = spot.l + '%';
      el.style.top = spot.t + '%';
      el.style.setProperty('--r', (spot.r + Math.round((rng() - .5) * 6)) + 'deg');
      el.innerHTML = '<span class="mex-face"><i class="mex-horn l"></i><i class="mex-horn r"></i><i class="mex-eye l"></i><i class="mex-eye r"></i><i class="mex-fang l"></i><i class="mex-fang r"></i></span>' +
        '<b>' + esc(def.t) + '</b><i class="mex-slash"></i>';
      pops.appendChild(el);
      active.push({ el: el, dead: false });
    }
    function spawnInitial() {
      for (var i = 0; i < 3; i++) (function (i) { setTimeout(spawnOne, i * 180); })(i);
    }
    function startSpawn() {
      if (spawnTimer) return;
      spawnTimer = setInterval(function () {
        if (document.hidden || !onscreen || slayOn) return;
        spawnOne();
      }, SPAWN_MS);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { onscreen = en[0].isIntersecting; }, { threshold: 0 });
      io.observe(stage);
    }

    /* ---- install + feature wiring ---- */
    els.install.addEventListener('click', function () {
      installed = true;
      els.install.disabled = true;
      els.install.innerHTML = XR.icon('check') + 'Extension installed';
      els.ext.classList.add('is-on');
      els.slayerImg.src = 'assets/img/characters/xiraiya-stop.webp';
      els.slayer.classList.add('is-on');
      els.tSlay.disabled = false;
      els.tHilite.disabled = false;
      els.tPrice.disabled = false;
      els.hwIn.disabled = false;
      setStatus();
    });
    els.tSlay.addEventListener('click', function () {
      slayOn = !slayOn;
      els.tSlay.setAttribute('aria-pressed', String(slayOn));
      els.tSlay.classList.toggle('is-on', slayOn);
      if (slayOn) slayAll();
      refreshCode();
    });
    els.tHilite.addEventListener('click', function () {
      hiliteOn = !hiliteOn;
      els.tHilite.setAttribute('aria-pressed', String(hiliteOn));
      els.tHilite.classList.toggle('is-on', hiliteOn);
      renderArticle();
      refreshCode();
    });
    els.hwIn.addEventListener('input', function () { if (hiliteOn) renderArticle(); });
    els.tPrice.addEventListener('click', function () {
      priceOn = !priceOn;
      els.tPrice.setAttribute('aria-pressed', String(priceOn));
      els.tPrice.classList.toggle('is-on', priceOn);
      els.watch.classList.toggle('is-on', priceOn);
      refreshCode();
    });

    renderArticle();
    renderCode('base');
    setStatus();
    spawnInitial();
    startSpawn();
  });
})();
