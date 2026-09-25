/* Lab stage 01 — The Build Arc: a manga page where Sakura Ramen's site gets typed and inked live */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  var ORDER = ['hero', 'menu', 'gallery', 'booking', 'payments'];

  function T(s) { return '<span class="t">' + s + '</span>'; }
  function A(s) { return '<span class="a">' + s + '</span>'; }
  function S(s) { return '<span class="s">' + s + '</span>'; }
  function C(s) { return '<span class="c">' + s + '</span>'; }
  function K(s) { return '<span class="k">' + s + '</span>'; }

  var DEFS = {
    hero: {
      jp: '顔', label: 'Hero',
      lines: [
        T('&lt;section') + ' ' + A('class') + '=' + S('"hero"') + T('&gt;'),
        '  ' + T('&lt;h1&gt;') + 'Sakura Ramen' + T('&lt;/h1&gt;'),
        '  ' + T('&lt;p&gt;') + 'Handmade noodles, since 1998.' + T('&lt;/p&gt;'),
        '  ' + T('&lt;button&gt;') + 'Order Now' + T('&lt;/button&gt;'),
        T('&lt;/section&gt;'),
        C('/* style.css */'),
        K('.hero') + ' { ' + A('background') + ': ' + S('#1c130f') + '; ' + A('color') + ': ' + S('#fff') + '; }'
      ],
      preview: function () {
        return '<div class="mwb-v-hero"><span class="mwb-v-k jp">麺</span><h3>Sakura Ramen</h3><p>Handmade noodles, since 1998.</p><span class="mwb-v-btn">Order Now</span></div>';
      }
    },
    menu: {
      jp: '品', label: 'Menu',
      lines: [
        T('&lt;ul') + ' ' + A('class') + '=' + S('"menu"') + T('&gt;'),
        '  ' + T('&lt;li&gt;') + 'Shoyu Ramen ' + T('&lt;b&gt;') + '৳350' + T('&lt;/b&gt;') + T('&lt;/li&gt;'),
        '  ' + T('&lt;li&gt;') + 'Miso Ramen ' + T('&lt;b&gt;') + '৳380' + T('&lt;/b&gt;') + T('&lt;/li&gt;'),
        '  ' + T('&lt;li&gt;') + 'Spicy Tonkotsu ' + T('&lt;b&gt;') + '৳420' + T('&lt;/b&gt;') + T('&lt;/li&gt;'),
        T('&lt;/ul&gt;'),
        C('/* style.css */'),
        K('.menu li') + ' { ' + A('border-bottom') + ': ' + S('1px dashed #4a4038') + '; }'
      ],
      preview: function () {
        return '<div class="mwb-v-menu"><span class="mwb-v-cap">Menu</span><ul>' +
          '<li><span>Shoyu Ramen</span><b>৳350</b></li>' +
          '<li><span>Miso Ramen</span><b>৳380</b></li>' +
          '<li><span>Spicy Tonkotsu</span><b>৳420</b></li></ul></div>';
      }
    },
    gallery: {
      jp: '絵', label: 'Gallery',
      lines: [
        T('&lt;div') + ' ' + A('class') + '=' + S('"gallery"') + T('&gt;'),
        '  ' + T('&lt;img') + ' ' + A('src') + '=' + S('"bowl-1.jpg"') + ' ' + A('alt') + '=' + S('""') + T('&gt;'),
        '  ' + T('&lt;img') + ' ' + A('src') + '=' + S('"bowl-2.jpg"') + ' ' + A('alt') + '=' + S('""') + T('&gt;'),
        '  ' + T('&lt;img') + ' ' + A('src') + '=' + S('"bowl-3.jpg"') + ' ' + A('alt') + '=' + S('""') + T('&gt;'),
        T('&lt;/div&gt;'),
        C('/* style.css */'),
        K('.gallery') + ' { ' + A('display') + ': ' + S('grid') + '; ' + A('grid-template-columns') + ': ' + S('repeat(3,1fr)') + '; }'
      ],
      preview: function () {
        return '<div class="mwb-v-gallery"><span class="mwb-v-cap">Gallery</span><div class="mwb-v-tiles">' +
          '<i class="km-tone">' + XR.icon('image') + '</i><i class="km-tone-2">' + XR.icon('image') + '</i><i class="km-tone-red">' + XR.icon('image') + '</i></div></div>';
      }
    },
    booking: {
      jp: '約', label: 'Booking',
      lines: [
        T('&lt;form') + ' ' + A('class') + '=' + S('"booking"') + T('&gt;'),
        '  ' + T('&lt;input') + ' ' + A('placeholder') + '=' + S('"Name"') + T('&gt;'),
        '  ' + T('&lt;input') + ' ' + A('type') + '=' + S('"date"') + T('&gt;'),
        '  ' + T('&lt;button&gt;') + 'Reserve Table' + T('&lt;/button&gt;'),
        T('&lt;/form&gt;'),
        C('/* style.css */'),
        K('.booking input') + ' { ' + A('border') + ': ' + S('1px solid #c9bfa8') + '; }'
      ],
      preview: function () {
        return '<div class="mwb-v-booking"><span class="mwb-v-cap">Reserve</span><span class="mwb-v-field">Name</span><span class="mwb-v-field">Date</span><span class="mwb-v-btn">Reserve Table</span></div>';
      }
    },
    payments: {
      jp: '払', label: 'Payments',
      lines: [
        T('&lt;div') + ' ' + A('class') + '=' + S('"pay"') + T('&gt;'),
        '  ' + T('&lt;button&gt;') + 'bKash' + T('&lt;/button&gt;'),
        '  ' + T('&lt;button&gt;') + 'Nagad' + T('&lt;/button&gt;'),
        '  ' + T('&lt;button&gt;') + 'Card' + T('&lt;/button&gt;'),
        T('&lt;/div&gt;'),
        C('/* style.css */'),
        K('.pay button') + ' { ' + A('border-radius') + ': ' + S('999px') + '; }'
      ],
      preview: function () {
        return '<div class="mwb-v-pay"><span class="mwb-v-cap">Pay</span><span class="mwb-v-tag is-bkash">bKash</span><span class="mwb-v-tag is-nagad">Nagad</span><span class="mwb-v-tag is-card">Card</span></div>';
      }
    }
  };

  function tpl() {
    var signs = ORDER.map(function (id) {
      var d = DEFS[id];
      return '<button type="button" class="km-btn mwb-sign" data-id="' + id + '" aria-pressed="false">' +
        '<span class="mwb-sign-jp jp" aria-hidden="true">' + d.jp + '</span><span>' + d.label + '</span></button>';
    }).join('');
    return (
      '<div class="km-page mwb-page">' +
        '<div class="km-panel km-tone km-slant km-in mwb-p mwb-p-intro">' +
          '<span class="km-cap">Ch.01 &mdash; The Build Arc</span>' +
          '<div class="mwb-intro-body">' +
            '<img class="mwb-mascot" src="assets/img/characters/xiraiya-writing.webp" alt="" width="725" height="924" loading="lazy" decoding="async">' +
            '<span class="km-bubble is-right mwb-bubble">Tell me what your site needs.</span>' +
          '</div>' +
        '</div>' +
        '<div class="km-panel mwb-p mwb-p-signs km-in">' +
          '<h3 class="km-h">Hand Signs</h3>' +
          '<div class="mwb-signs" role="group" aria-label="Website sections to build">' + signs + '</div>' +
          '<p class="mwb-status" aria-live="polite">Pick a hand sign to start building.</p>' +
        '</div>' +
        '<div class="km-panel km-tone-dark mwb-p mwb-p-code km-in">' +
          '<div class="mwb-editor-bar"><span class="mwb-dot"></span><span class="mwb-dot"></span><span class="mwb-dot"></span><span class="mwb-file">index.html</span></div>' +
          '<span class="km-sfx mwb-sfx jp" aria-hidden="true">カタカタ</span>' +
          '<pre class="km-code mwb-code" aria-hidden="true"><div class="mwb-caret-wrap mwb-code-ln"><span class="km-caret"></span></div></pre>' +
        '</div>' +
        '<div class="km-panel mwb-p mwb-p-preview km-in">' +
          '<div class="mwb-browser"><span class="mwb-dot"></span><span class="mwb-dot"></span><span class="mwb-dot"></span><span class="mwb-url">sakura-ramen.shop</span></div>' +
          '<div class="mwb-site" aria-hidden="true"><p class="mwb-empty">Pick a hand sign to start building&hellip;</p></div>' +
        '</div>' +
        '<div class="km-panel km-tone-red mwb-p mwb-p-deploy km-in">' +
          '<div class="mwb-deploy-cta">' +
            '<span class="km-tag is-red">Ready?</span>' +
            '<p class="mwb-deploy-txt"><b class="mwb-count">0</b> section<span class="mwb-plural">s</span> selected</p>' +
            '<button type="button" class="km-btn is-red mwb-deploy" disabled>' + XR.icon('rocket') + '<span>Deploy</span></button>' +
          '</div>' +
          '<div class="mwb-deploy-result" hidden>' +
            '<div class="km-focus" aria-hidden="true"></div>' +
            '<span class="km-sfx is-red is-pop mwb-donsfx jp" aria-hidden="true">ドン！</span>' +
            '<p class="mwb-deploy-msg">Deployed to <b>sakura-ramen.shop</b> &middot; 0.9s &middot; Lighthouse 99</p>' +
            '<button type="button" class="km-btn mwb-reset">' + XR.icon('refresh') + '<span>Build another</span></button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* insert el into root, keeping the fixed section ORDER (skips elements with no data-id, e.g. a caret line) */
  function insertInOrder(root, el, id) {
    var idx = ORDER.indexOf(id), kids = root.children, i, kid;
    for (i = 0; i < kids.length; i++) {
      kid = kids[i].getAttribute('data-id');
      if (kid && ORDER.indexOf(kid) > idx) { root.insertBefore(el, kids[i]); return; }
    }
    var caret = root.querySelector('.mwb-caret-wrap');
    if (caret) root.insertBefore(el, caret); else root.appendChild(el);
  }

  LAB.register('web', function (stage) {
    stage.innerHTML = tpl();
    var codeEl = XR.$('.mwb-code', stage);
    var siteEl = XR.$('.mwb-site', stage);
    var sfxEl = XR.$('.mwb-sfx', stage);
    var statusEl = XR.$('.mwb-status', stage);
    var previewPanel = XR.$('.mwb-p-preview', stage);
    var signBtns = XR.$$('.mwb-sign', stage);
    var deployBtn = XR.$('.mwb-deploy', stage);
    var resetBtn = XR.$('.mwb-reset', stage);
    var ctaBlock = XR.$('.mwb-deploy-cta', stage);
    var resultBlock = XR.$('.mwb-deploy-result', stage);
    var countEl = XR.$('.mwb-count', stage);
    var pluralEl = XR.$('.mwb-plural', stage);

    var active = {}, busy = false, deployed = false, visible = true;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 });
      io.observe(stage);
    }
    function idle() { return document.hidden || !visible; }

    /* retry a delayed callback until the tab/stage is actually visible, so nothing runs off-screen */
    function schedule(ms, fn) {
      setTimeout(function () { if (idle()) schedule(ms, fn); else fn(); }, ms);
    }

    function status(msg) { statusEl.textContent = msg; }

    function countActive() {
      var n = 0, i;
      for (i = 0; i < ORDER.length; i++) if (active[ORDER[i]]) n++;
      return n;
    }
    function refreshCount() {
      var n = countActive();
      countEl.textContent = n;
      pluralEl.textContent = n === 1 ? '' : 's';
      deployBtn.disabled = busy || deployed || n === 0;
    }

    function setBusy(v) {
      busy = v;
      signBtns.forEach(function (b) { b.disabled = v; });
      refreshCount();
    }

    /* ---- code panel ---- */
    function appendLn(container, html) {
      var d = document.createElement('div');
      d.className = 'mwb-code-ln';
      d.innerHTML = html;
      container.appendChild(d);
    }
    function typeLines(container, lines, done) {
      if (XR.reduce) {
        lines.forEach(function (html) { appendLn(container, html); });
        codeEl.scrollTop = codeEl.scrollHeight;
        done();
        return;
      }
      var i = 0, per = XR.clamp(Math.round(1300 / lines.length), 70, 220);
      function tick() {
        schedule(per, function () {
          appendLn(container, lines[i]);
          codeEl.scrollTop = codeEl.scrollHeight;
          i++;
          if (i < lines.length) tick(); else done();
        });
      }
      tick();
    }
    function showSfx() { sfxEl.classList.remove('is-pop'); void sfxEl.offsetWidth; sfxEl.classList.add('is-pop'); }
    function hideSfx() { sfxEl.classList.remove('is-pop'); }
    function addCode(id, done) {
      var group = document.createElement('div');
      group.className = 'mwb-code-group';
      group.setAttribute('data-id', id);
      insertInOrder(codeEl, group, id);
      showSfx();
      typeLines(group, DEFS[id].lines, function () { hideSfx(); done(); });
    }
    function removeCode(id) {
      var g = codeEl.querySelector('.mwb-code-group[data-id="' + id + '"]');
      if (g) g.parentNode.removeChild(g);
    }

    /* ---- preview panel ---- */
    function flashPreview() {
      if (XR.reduce) return;
      var f = document.createElement('div');
      f.className = 'km-speed mwb-flashlines';
      f.setAttribute('aria-hidden', 'true');
      previewPanel.appendChild(f);
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 520);
    }
    function ensureEmptyState() {
      if (!siteEl.querySelector('.mwb-v')) {
        var p = document.createElement('p');
        p.className = 'mwb-empty';
        p.textContent = 'Pick a hand sign to start building…';
        siteEl.appendChild(p);
      }
    }
    function addPreview(id) {
      var empty = siteEl.querySelector('.mwb-empty');
      if (empty) empty.parentNode.removeChild(empty);
      var el = document.createElement('div');
      el.className = 'mwb-v' + (XR.reduce ? '' : ' km-in');
      el.setAttribute('data-id', id);
      el.innerHTML = DEFS[id].preview();
      insertInOrder(siteEl, el, id);
      flashPreview();
    }
    function removePreview(id) {
      var el = siteEl.querySelector('.mwb-v[data-id="' + id + '"]');
      if (!el) return;
      el.parentNode.removeChild(el);
      ensureEmptyState();
      if (!XR.reduce) { siteEl.classList.remove('km-shake'); void siteEl.offsetWidth; siteEl.classList.add('km-shake'); }
    }

    /* ---- sign buttons ---- */
    signBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (busy || deployed) return;
        var id = btn.getAttribute('data-id'), def = DEFS[id];
        var on = !active[id];
        active[id] = on;
        btn.setAttribute('aria-pressed', String(on));
        btn.classList.toggle('is-on', on);
        setBusy(true);
        if (on) {
          status(def.label + ' section — writing code…');
          addCode(id, function () {
            addPreview(id);
            status(def.label + ' section added.');
            setBusy(false);
          });
        } else {
          removeCode(id);
          removePreview(id);
          status(def.label + ' section removed.');
          setBusy(false);
        }
      });
    });

    /* ---- deploy / reset ---- */
    deployBtn.addEventListener('click', function () {
      if (busy || deployed || countActive() === 0) return;
      setBusy(true);
      status('Deploying to sakura-ramen.shop…');
      schedule(XR.reduce ? 0 : 700, function () {
        deployed = true;
        ctaBlock.hidden = true;
        resultBlock.hidden = false;
        var sfx = XR.$('.mwb-donsfx', stage);
        if (!XR.reduce) { sfx.classList.remove('is-pop'); void sfx.offsetWidth; sfx.classList.add('is-pop'); }
        status('Deployed to sakura-ramen.shop — 0.9s load, Lighthouse 99.');
        busy = false;
      });
    });
    resetBtn.addEventListener('click', function () {
      ORDER.forEach(function (id) {
        active[id] = false;
        removeCode(id);
        removePreview(id);
      });
      signBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); b.classList.remove('is-on'); b.disabled = false; });
      ensureEmptyState();
      deployed = false;
      busy = false;
      ctaBlock.hidden = false;
      resultBlock.hidden = true;
      refreshCount();
      status('Build another site — pick a hand sign.');
    });

    refreshCount();
  });
})();
