/* =====================================================================
   XIRAIYA — Shop engine
   Store switcher, cart, product quick view, checkout, shopping assistant
   and admin, shared by every store. Each store has its own storefront
   layout module in assets/js/shop/<id>.js (+ assets/css/shop/<id>.css),
   loaded on demand. A module calls:

     XRShop.register('<id>', {
       build: function (api) { return '<html of the storefront>'; },
       wire:  function (api, root) { ... },          // optional
       card:  function (p, i, api) { return '...'; }, // optional product card
       filter: function (p, api) { return true; },   // optional extra filter
       destroy: function () { ... }                  // optional cleanup
     });

   Store data lives in shop-data.js. Everything is simulated: no payments,
   no network (except loading the layout files and photo credits).
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR, STORES = window.XR_STORES;
  if (!XR || !STORES || !STORES.length) return;
  var $ = XR.$, $$ = XR.$$, I = XR.icon, esc = XR.esc;

  var site = $('#sfSite'), sfEl = $('#sf');
  var S, P, byId;                     // current store, its products, lookup
  var state, cart, wish, promo;       // per-store state
  var mod = null, api = null;         // current layout module + api
  var orders = XR.store('shop-orders') || [];
  var fontsLoaded = {}, LAYOUTS = {}, loading = {}, listeners = {}, timers = [];

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function photo(name, sid) { return 'assets/img/shop/' + (sid || S.id) + '/' + name + '.jpg'; }
  function pimg(p) { return photo(p.img || p.id); }
  function img(src, alt, cls, eager) {
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + src + '" alt="' + esc(alt || '') + '"' + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }
  function pic(p, cls, eager) { return img(pimg(p), p.name, cls, eager); }
  var LOCALE = { '৳': 'en-IN', kr: 'da-DK', '€': 'de-DE', '£': 'en-GB' };
  function fmt(n, dec) { return n.toLocaleString(LOCALE[S.cur] || 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
  function money(n, force) {
    var dec = force != null ? force : (S.dec && n % 1 ? 2 : 0);
    var v = fmt(Math.round(n * 100) / 100, dec);
    return S.after ? v + ' ' + S.cur : S.cur + v;
  }
  function money2(n) { return money(n, S.dec); }
  function usd(n) { return n / S.fx; }
  function stars(p) { return '<span class="stars" aria-label="Rated ' + p.rating.toFixed(1) + ' out of 5">' + I('star-fill') + '<b>' + p.rating.toFixed(1) + '</b><small>(' + p.reviews.toLocaleString('en-US') + ')</small></span>'; }
  function defaultSize(p) { return p.sizes ? p.sizes[Math.min(p.sizes.length - 1, Math.floor(p.sizes.length / 2))] : null; }
  function defaultColor(p) { return p.colors ? p.colors[0][0] : null; }
  function pct(p) { return Math.round((1 - p.price / p.was) * 100); }
  function badges(p) {
    return (p.was ? '<span class="p-badge sale">−' + pct(p) + '%</span>' : '') +
      (p.badge === 'new' ? '<span class="p-badge">New</span>' : p.badge === 'best' ? '<span class="p-badge">Bestseller</span>' : p.badge === 'pick' ? '<span class="p-badge">Staff pick</span>' : '');
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, XR.reduce ? 0 : ms); }); }
  function emit(ev, data) { (listeners[ev] || []).forEach(function (f) { try { f(data); } catch (e) { console.error(e); } }); }

  /* image that fails to load: swap in a quiet tile instead of a broken icon */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t.tagName !== 'IMG' || !t.closest('.sf, .pmodal, .drawer, .ai-shop, .tpl')) return;
    var box = t.parentNode;
    t.remove();
    box.classList.add('no-img');
  }, true);

  /* ------------------------------------------------------------------
     Theme
     ------------------------------------------------------------------ */
  var themeTag = document.createElement('style');
  themeTag.id = 'sfTheme';
  document.head.appendChild(themeTag);
  function loadFont(s) {
    if (!s.font.q || fontsLoaded[s.id]) return;
    fontsLoaded[s.id] = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + s.font.q + '&display=swap';
    document.head.appendChild(l);
  }
  function fontStack(f) { return f + (/serif|fraunces|mincho|garamond|playfair|baskerville|gloock|bodoni|cormorant|lora|spectral/i.test(f) && !/sans/i.test(f) ? ',Georgia,serif' : ',system-ui,sans-serif'); }
  function applyTheme() {
    var p = S.pal;
    loadFont(S);
    themeTag.textContent = '.sf-site,.pmodal .pm-box,.drawer .drawer-panel,.ai-shop,.sf-sticky,.s-suggest{' +
      '--s-bg:' + p.bg + ';--s-surface:' + p.surface + ';--s-ink:' + p.ink + ';--s-muted:' + p.muted + ';--s-accent:' + p.accent + ';--s-on:' + p.on + ';--s-line:' + p.line + ';' +
      '--s-r:' + S.radius + 'px;--s-rs:' + Math.min(S.radius, 10) + 'px;--s-fh:' + fontStack(S.font.h) + ';--s-fb:' + S.font.b + ',system-ui,sans-serif;' +
      '--s-ratio:' + ({ square: '1 / 1', tall: '4 / 5', wide: '4 / 3' }[S.card] || '1 / 1') + ';color-scheme:' + (S.dark ? 'dark' : 'light') + '}';
    document.body.setAttribute('data-store', S.id);
    sfEl.classList.toggle('is-dark', !!S.dark);
  }

  /* ------------------------------------------------------------------
     Store directory (page hero)
     ------------------------------------------------------------------ */
  var GROUPS = { thread: 'Fashion', pebble: 'Fashion', deshi: 'Fashion', stride: 'Fashion', carry: 'Fashion', glow: 'Beauty', aurelia: 'Beauty', kage: 'Tech', halide: 'Tech', nordhem: 'Home', sobuj: 'Home', fieldday: 'Outdoor' };
  var rail = $('.tpl-rail');
  $('.tpl-n').textContent = STORES.length;
  rail.innerHTML = STORES.map(function (s, i) {
    var cover = s.hero.img.replace('-xl', '');
    return '<button type="button" class="tpl-card" role="radio" aria-checked="false" data-store="' + s.id + '" data-group="' + (GROUPS[s.id] || 'Other') + '" style="--a:' + s.pal.accent + ';--b:' + s.pal.bg + ';--i:' + s.pal.ink + ';--n:' + i + '">' +
      '<span class="tpl-img">' + img('assets/img/shop/' + s.id + '/' + cover + '.jpg', '') + '<span class="tpl-no">' + (i < 9 ? '0' : '') + (i + 1) + '</span></span>' +
      '<span class="tpl-txt"><b>' + esc(s.name) + '</b><small>' + esc(s.kind) + ' · ' + esc(s.city) + '</small></span>' +
      '<span class="tpl-meta"><span class="tpl-sw" aria-hidden="true"><i style="background:' + s.pal.bg + '"></i><i style="background:' + s.pal.ink + '"></i><i style="background:' + s.pal.accent + '"></i></span><span class="tpl-cur">' + esc(s.cur) + ' · ' + s.products.length + ' items</span></span>' +
      '<span class="tpl-go" aria-hidden="true">' + I('arrow-up-right') + '</span></button>';
  }).join('');
  var groupBar = $('.tpl-groups');
  if (groupBar) {
    var gl = ['All'].concat(Object.keys(GROUPS).map(function (k) { return GROUPS[k]; }).filter(function (g, i, a) { return a.indexOf(g) === i; }));
    groupBar.innerHTML = gl.map(function (g) { return '<button type="button" role="radio" aria-checked="' + (g === 'All') + '" data-group="' + g + '">' + g + '</button>'; }).join('');
    groupBar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-group]'); if (!b) return;
      var g = b.getAttribute('data-group');
      $$('button', groupBar).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
      $$('.tpl-card', rail).forEach(function (c) { c.hidden = g !== 'All' && c.getAttribute('data-group') !== g; });
    });
  }
  var shuffle = $('.tpl-shuffle');
  if (shuffle) shuffle.addEventListener('click', function () {
    var others = STORES.filter(function (s) { return s.id !== S.id; });
    openStore(others[(Math.random() * others.length) | 0].id, true);
  });
  rail.addEventListener('click', function (e) {
    var b = e.target.closest('[data-store]');
    if (!b) return;
    openStore(b.getAttribute('data-store'), true);
  });
  rail.addEventListener('keydown', function (e) {
    if (['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return;
    var btns = $$('.tpl-card:not([hidden])', rail), i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
    n.focus(); n.click();
  });
  /* the card follows the pointer a little */
  if (XR.fine && !XR.reduce) rail.addEventListener('pointermove', function (e) {
    var c = e.target.closest('.tpl-card'); if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  });

  /* ------------------------------------------------------------------
     Shared storefront pieces (layouts can use or ignore them)
     ------------------------------------------------------------------ */
  function searchBox(ph, cls) {
    return '<label class="s-search' + (cls ? ' ' + cls : '') + '">' + I('search') + '<input type="search" placeholder="' + esc(ph || ('Search ' + S.name)) + '" aria-label="Search products" autocomplete="off"><kbd class="s-kbd">/</kbd></label>';
  }
  function wishButton(cls) { return '<button type="button" class="s-ic wish-filter' + (cls ? ' ' + cls : '') + '" aria-pressed="false" aria-label="Show saved items">' + I('heart') + '<span class="s-badge wish-count" hidden>0</span></button>'; }
  function cartButton(cls, label) { return '<button type="button" class="s-ic cart-open' + (cls ? ' ' + cls : '') + '" aria-label="Open bag">' + I('bag') + (label ? '<span class="s-ic-t">' + esc(label) + '</span>' : '') + '<span class="s-badge cart-count" hidden>0</span></button>'; }
  function promoHTML() {
    var promo = S.promo.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    return '<div class="s-promo" aria-label="Store offers"><div class="s-promo-track">' + promo + promo + '</div></div>';
  }
  function catsHTML(cls) {
    return '<div class="s-cats' + (cls ? ' ' + cls : '') + '" role="radiogroup" aria-label="Category">' + S.cats.map(function (c) {
      var n = c === 'All' ? P.length : P.filter(function (p) { return p.cat === c; }).length;
      return '<button type="button" role="radio" aria-checked="' + (c === state.cat) + '" data-cat="' + esc(c) + '">' + esc(c) + '<small>' + n + '</small></button>';
    }).join('') + '</div>';
  }
  function rangeHTML() {
    return '<label class="s-range"><span>Up to <b class="price-v">' + money(state.cap) + '</b></span><input class="range" type="range" min="0" max="' + state.cap + '" step="' + state.step + '" value="' + state.max + '" aria-label="Maximum price"></label>';
  }
  function sortHTML() {
    return '<label class="s-sort"><span class="sr-only">Sort</span><select aria-label="Sort products"><option value="featured">Featured</option><option value="new">New in</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></label>';
  }
  function toolbar(o) {
    o = o || {};
    return '<div class="s-toolbar">' + (o.cats === false ? '' : catsHTML()) + '<div class="s-tools">' + (o.range === false ? '' : rangeHTML()) + (o.sort === false ? '' : sortHTML()) + '</div></div>';
  }
  function gridHTML(cls) {
    return '<p class="s-count" aria-live="polite"></p><div class="s-grid' + (cls ? ' ' + cls : '') + '" role="list"></div>' +
      '<div class="s-empty" hidden>' + I('search') + '<p>Nothing matches that.</p><button type="button" class="s-btn s-btn-ghost" data-clear>Clear filters</button></div>';
  }
  function reviewsHTML(title) {
    return '<section class="s-reviews"><h2 class="s-h2">' + esc(title || 'What customers say') + '</h2><div class="rv-grid">' + S.reviews.map(function (r) {
      return '<figure class="rv"><span class="rv-stars" aria-label="5 out of 5">' + I('star-fill') + I('star-fill') + I('star-fill') + I('star-fill') + I('star-fill') + '</span><blockquote>' + esc(r[0]) + '</blockquote><figcaption><b>' + esc(r[1]) + '</b> · ' + esc(r[2]) + '</figcaption></figure>';
    }).join('') + '</div></section>';
  }
  function policiesHTML() { return '<section class="s-pol">' + S.policies.map(function (x) { return '<div><span class="pol-ic">' + I(x[0]) + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></div>'; }).join('') + '</section>'; }
  function newsHTML(title) { return '<form class="s-news" autocomplete="off"><b>' + esc(title || 'Get the next drop first') + '</b><div><input type="email" placeholder="Email address" aria-label="Email address"><button type="submit" class="s-btn">Join</button></div></form>'; }
  function creditHTML() { return '<p class="s-credit">' + esc(S.name) + ' is a made-up brand. Product photos: ' + esc(creditLine((window.XR_SHOP_CREDITS || {})[S.id])) + '. Store template by Xiraiya.</p>'; }
  function footerHTML() {
    return '<footer class="s-foot"><div class="sf-cols"><div><span class="s-word">' + S.word + '</span><p>' + esc(S.tagline) + '</p></div>' +
      '<div><b>Shop</b>' + S.cats.slice(1).map(function (c) { return '<button type="button" data-navcat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
      '<div><b>Help</b><span>' + esc(S.eta) + '</span><span>Returns & exchanges</span><span>@' + esc(S.handle) + '</span></div>' +
      newsHTML() + '</div>' + creditHTML() + '</footer>';
  }
  function creditLine(c) {
    if (!c) return 'free-licence photographers (see assets/img/shop/credits.json)';
    var seen = {}, names = [], cc = false;
    Object.keys(c).forEach(function (k) {
      var x = c[k], n = (x.photographer || '').replace(/\s+/g, ' ').trim();
      if (!n || n === 'unknown' || seen[n]) return;
      seen[n] = 1;
      var lic = x.license && !/unsplash/i.test(x.license) ? x.license : '';
      if (lic) cc = true;
      names.push(n.length > 40 ? n.slice(0, 40) + '…' : n + (lic ? ' (' + lic + ')' : ''));
    });
    return names.slice(0, 14).join(', ') + (names.length > 14 ? ' and others' : '') + (cc ? ', used under Creative Commons and Unsplash licences' : ' on Unsplash');
  }

  function defaultCard(p, i) {
    var w = wish.indexOf(p.id) >= 0;
    var lab = p.sizeLabel === 'Age' ? 'age' : /size/i.test(p.sizeLabel || 'size') ? (p.sizeLabel || 'size').replace(/^([A-Z])(?=[a-z])/, function (m) { return m.toLowerCase(); }) : 'size';
    var quick = p.sizes ? '<button type="button" class="p-quick" data-view="' + p.id + '" aria-label="Choose ' + esc(lab) + ': ' + esc(p.name) + '">' + I('bag') + '<span>Choose ' + esc(lab) + '</span></button>' : '<button type="button" class="p-quick" data-add="' + p.id + '" aria-label="Add to bag: ' + esc(p.name) + '">' + I('plus') + '<span>Add to bag</span></button>';
    var sw = p.colors ? '<span class="p-sw" aria-label="' + p.colors.length + ' colours">' + p.colors.map(function (c) { return '<i style="background:' + c[1] + '" title="' + esc(c[0]) + '"></i>'; }).join('') + '</span>' : '';
    return '<article class="pc" role="listitem" style="--d:' + Math.min(i * 40, 400) + 'ms">' +
      '<div class="pc-media"><button type="button" class="pc-open" data-view="' + p.id + '" aria-label="View ' + esc(p.name) + '">' + pic(p) + '</button>' +
      '<div class="p-badges">' + badges(p) + '</div>' +
      '<button type="button" class="p-wish' + (w ? ' is-on' : '') + '" data-wish="' + p.id + '" aria-pressed="' + w + '" aria-label="' + (w ? 'Remove from' : 'Save to') + ' wishlist: ' + esc(p.name) + '">' + I('heart') + '</button>' + quick + '</div>' +
      '<div class="pc-body"><h3 class="pc-name"><button type="button" data-view="' + p.id + '">' + esc(p.name) + '</button></h3>' +
      '<div class="pc-row"><span class="pc-price">' + money(p.price) + (p.was ? ' <s>' + money(p.was) + '</s>' : '') + '</span>' + sw + '</div>' +
      '<div class="pc-meta">' + stars(p) + (p.stock <= 5 ? '<span class="pc-low">Only ' + p.stock + ' left</span>' : '') + '</div></div></article>';
  }

  /* the original single-template storefront, used if a layout module fails to load */
  var FALLBACK = {
    build: function () {
      var h = S.hero;
      return promoHTML() +
        '<header class="s-nav"><a class="s-word" href="#sfShop" data-jump>' + S.word + '</a><nav class="s-links" aria-label="' + esc(S.name) + ' categories">' +
        S.cats.slice(1).map(function (c) { return '<button type="button" data-navcat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</nav>' +
        '<div class="s-acts">' + searchBox() + wishButton() + cartButton() + '</div></header>' +
        '<section class="sh sh-split"><div class="sh-copy"><span class="s-eyebrow">' + esc(h.eyebrow) + '</span><h2 class="sh-title">' + esc(h.title) + '</h2><p class="sh-sub">' + esc(h.sub) + '</p>' +
        '<div class="sh-cta"><a class="s-btn" href="#sfShop" data-jump>' + esc(h.cta) + I('arrow-right') + '</a></div></div><div class="sh-media">' + img(photo(h.img), '', '', true) + '</div></section>' +
        '<section class="s-shop" id="sfShop"><div class="s-shop-head"><div><span class="s-eyebrow">' + esc(S.kind) + '</span><h2 class="s-h2">Shop all</h2></div></div>' + toolbar() + gridHTML() + '</section>' +
        reviewsHTML() + policiesHTML() + footerHTML();
    }
  };

  /* ------------------------------------------------------------------
     Layout loading
     ------------------------------------------------------------------ */
  function loadLayout(id) {
    if (LAYOUTS[id]) return Promise.resolve(LAYOUTS[id]);
    if (loading[id]) return loading[id];
    loading[id] = new Promise(function (resolve) {
      var done = false, cssOk = false, jsOk = false;
      function finish() { if (done || !(cssOk && jsOk)) return; done = true; resolve(LAYOUTS[id] || null); }
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = 'assets/css/shop/' + id + '.css';
      l.onload = l.onerror = function () { cssOk = true; finish(); };
      document.head.appendChild(l);
      var s = document.createElement('script');
      s.src = 'assets/js/shop/' + id + '.js';
      s.onload = s.onerror = function () { jsOk = true; finish(); };
      document.body.appendChild(s);
      setTimeout(function () { cssOk = jsOk = true; finish(); }, 6000);
    });
    return loading[id];
  }
  /* warm the next stores in the background once the page is idle */
  function prefetch() {
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 1500); };
    STORES.forEach(function (s, i) { idle(function () { if (!LAYOUTS[s.id]) setTimeout(function () { loadLayout(s.id); }, i * 400); }); });
  }

  /* ------------------------------------------------------------------
     Product grid
     ------------------------------------------------------------------ */
  function filtered() {
    var q = state.q.toLowerCase().trim();
    var list = P.filter(function (p) {
      if (state.cat !== 'All' && p.cat !== state.cat) return false;
      if (p.price > state.max) return false;
      if (state.wishOnly && wish.indexOf(p.id) < 0) return false;
      if (q && (p.name + ' ' + p.cat + ' ' + (p.tags || '')).toLowerCase().indexOf(q) < 0) return false;
      if (mod && mod.filter && !mod.filter(p, api)) return false;
      if (api && api.filter && !api.filter(p)) return false;
      return true;
    });
    if (state.sort === 'low') list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === 'rating') list.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
    if (state.sort === 'new') list.sort(function (a, b) { return (b.badge === 'new') - (a.badge === 'new'); });
    return list;
  }
  function render() {
    var grid = $('.s-grid', site);
    var list = filtered();
    if (grid) {
      var cardFn = mod && mod.card ? function (p, i) { return mod.card(p, i, api); } : defaultCard;
      grid.innerHTML = list.map(cardFn).join('');
    }
    var cnt = $('.s-count', site);
    if (cnt) cnt.textContent = list.length === P.length ? P.length + ' products' : list.length + ' of ' + P.length + ' products';
    var em = $('.s-empty', site); if (em) em.hidden = list.length > 0;
    $$('.wish-count', site).forEach(function (w) { w.textContent = wish.length; w.hidden = !wish.length; });
    emit('render', list);
  }
  function setCat(c) {
    state.cat = c;
    $$('.s-cats [data-cat]', site).forEach(function (x) { x.setAttribute('aria-checked', x.getAttribute('data-cat') === c); });
    render();
  }
  function jump(sel) {
    var t = typeof sel === 'string' ? $(sel, site) : sel; if (!t) return;
    var y = t.getBoundingClientRect().top + scrollY - (XR.phone ? 70 : 90);
    window.scrollTo({ top: y, behavior: XR.reduce ? 'auto' : 'smooth' });
  }
  function clearFilters() {
    state.q = ''; state.wishOnly = false; state.max = state.cap; state.sort = 'featured';
    $$('.s-search input', site).forEach(function (i) { i.value = ''; });
    var r = $('.s-range input', site); if (r) { r.value = state.cap; $('.price-v', site).textContent = money(state.cap); }
    var so = $('.s-sort select', site); if (so) so.value = 'featured';
    $$('.wish-filter', site).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    emit('clear');
    setCat('All');
  }

  /* live search suggestions: any .s-search input in a layout gets them */
  var sugg = document.createElement('div');
  sugg.className = 's-suggest'; sugg.hidden = true; sugg.setAttribute('role', 'listbox');
  document.body.appendChild(sugg);
  var suggFor = null, suggIdx = -1;
  function showSuggest(input) {
    var q = input.value.trim().toLowerCase();
    if (!q) { sugg.hidden = true; return; }
    var hits = P.filter(function (p) { return (p.name + ' ' + p.cat + ' ' + (p.tags || '')).toLowerCase().indexOf(q) >= 0; }).slice(0, 5);
    suggFor = input; suggIdx = -1;
    sugg.innerHTML = hits.length ? '<small>' + hits.length + ' match' + (hits.length > 1 ? 'es' : '') + ' · Enter to open</small>' + hits.map(function (p, i) {
      return '<button type="button" role="option" data-view="' + p.id + '" data-i="' + i + '"><span class="sg-img">' + pic(p) + '</span><span><b>' + esc(p.name) + '</b><em>' + esc(p.cat) + ' · ' + money(p.price) + '</em></span>' + I('arrow-right') + '</button>';
    }).join('') : '<p>No products match “' + esc(input.value) + '”.</p>';
    var r = input.closest('.s-search').getBoundingClientRect();
    sugg.style.left = Math.max(8, Math.min(r.left, innerWidth - 348)) + 'px';
    sugg.style.top = (r.bottom + 8) + 'px';
    sugg.style.width = Math.max(300, r.width) + 'px';
    sugg.hidden = false;
  }
  function moveSuggest(d) {
    var bs = $$('button', sugg); if (!bs.length) return;
    suggIdx = (suggIdx + d + bs.length) % bs.length;
    bs.forEach(function (b, i) { b.classList.toggle('on', i === suggIdx); });
  }
  sugg.addEventListener('mousedown', function (e) { e.preventDefault(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.s-suggest, .s-search')) sugg.hidden = true; });
  window.addEventListener('scroll', function () { if (!sugg.hidden) sugg.hidden = true; }, { passive: true });

  /* ------------------------------------------------------------------
     Generic wiring for the hooks a layout includes
     ------------------------------------------------------------------ */
  function wireStore() {
    $$('.s-search input', site).forEach(function (inp) {
      inp.addEventListener('input', function () { state.q = inp.value; render(); showSuggest(inp); });
      inp.addEventListener('focus', function () { if (inp.value) showSuggest(inp); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggest(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggest(-1); }
        else if (e.key === 'Escape') { sugg.hidden = true; inp.blur(); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          var b = $$('button', sugg)[Math.max(0, suggIdx)];
          sugg.hidden = true;
          if (b && suggIdx >= 0) openProduct(b.getAttribute('data-view'));
          else { var g = $('.s-grid', site); if (g) jump(g.closest('section') || g); }
        }
      });
    });
    var cats = $('.s-cats', site);
    if (cats) cats.addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (b) setCat(b.getAttribute('data-cat')); });
    var rng = $('.s-range input', site);
    if (rng) rng.addEventListener('input', function () { state.max = +rng.value; $('.price-v', site).textContent = money(state.max); render(); });
    var so = $('.s-sort select', site);
    if (so) so.addEventListener('change', function (e) { state.sort = e.target.value; render(); });
    $$('.wish-filter', site).forEach(function (b) {
      b.addEventListener('click', function () {
        state.wishOnly = !state.wishOnly;
        $$('.wish-filter', site).forEach(function (x) { x.setAttribute('aria-pressed', state.wishOnly); });
        if (state.wishOnly && !wish.length) XR.toast('Tap the heart on a product to save it');
        render();
        var g = $('.s-grid', site); if (g) jump(g.closest('section') || g);
      });
    });
    $$('.cart-open', site).forEach(function (b) { b.addEventListener('click', function () { openCart(true); }); });
    $$('.s-news', site).forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = $('input', f);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) { XR.toast('That email does not look right', 'warn'); return; }
        inp.value = ''; XR.toast('You are on the list (demo, nothing was sent)');
      });
    });
  }

  function toggleWish(id) {
    var i = wish.indexOf(id);
    if (i >= 0) wish.splice(i, 1); else { wish.push(id); XR.toast('Saved to your wishlist'); }
    save(); render();
    var pw = $('.pm-wish'); if (pw && pm.id === id) { pw.classList.toggle('is-on', wish.indexOf(id) >= 0); pw.setAttribute('aria-pressed', wish.indexOf(id) >= 0); }
    emit('wish', wish);
  }

  document.addEventListener('click', function (e) {
    var j = e.target.closest('[data-jump]');
    if (j && site.contains(j)) { e.preventDefault(); jump(j.getAttribute('href')); return; }
    var cl = e.target.closest('[data-clear]');
    if (cl && site.contains(cl)) { clearFilters(); return; }
    var nc = e.target.closest('[data-navcat]');
    if (nc && site.contains(nc)) { setCat(nc.getAttribute('data-navcat')); var g = $('.s-grid', site); if (g) jump(g.closest('section') || g); return; }
    var add = e.target.closest('[data-add]');
    if (add && (site.contains(add) || pmEl.contains(add) || drawer.contains(add))) {
      e.stopPropagation();
      var p = byId[add.getAttribute('data-add')]; if (!p) return;
      if (p.sizes) { openProduct(p.id); return; }
      addToCart(p.id, defaultColor(p), null, 1, { from: add });
      return;
    }
    var w = e.target.closest('[data-wish]');
    if (w && site.contains(w)) { toggleWish(w.getAttribute('data-wish')); return; }
    var v = e.target.closest('[data-view]');
    if (v && !v.closest('.ai-shop') && byId[v.getAttribute('data-view')]) { sugg.hidden = true; openProduct(v.getAttribute('data-view')); }
  });
  /* "/" jumps to the store search */
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
    var inp = $$('.s-search input', site).filter(function (x) { return x.offsetParent !== null; })[0];
    if (!inp || $('.store').hidden) return;
    e.preventDefault(); inp.focus();
  });

  /* ------------------------------------------------------------------
     Recently viewed
     ------------------------------------------------------------------ */
  function recentIds() { return (XR.store(key('recent')) || []).filter(function (id) { return byId[id]; }); }
  function pushRecent(id) { var r = recentIds().filter(function (x) { return x !== id; }); r.unshift(id); XR.store(key('recent'), r.slice(0, 8)); }

  /* ------------------------------------------------------------------
     Product modal
     ------------------------------------------------------------------ */
  var pmEl = $('#pmodal'), pmModal = XR.modal(pmEl), pm = { id: null, color: null, size: null, qty: 1 };
  var zoom = $('.pm-zoom', pmEl);
  function deliveryLine() {
    var d = new Date(), days = /next day|same day/i.test(S.eta) ? 1 : /3–5|2–3/.test(S.eta) ? 3 : 2;
    d.setDate(d.getDate() + days + (d.getDay() + days > 6 ? 1 : 0));
    var cut = new Date(); cut.setHours(17, 0, 0, 0);
    var left = cut - Date.now(), h = Math.floor(left / 36e5), m = Math.floor(left % 36e5 / 6e4);
    return I('truck') + '<span>' + (left > 0 ? 'Order within <b>' + h + 'h ' + m + 'm</b> for delivery by ' : 'Order now for delivery by ') + '<b>' + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + '</b></span>';
  }
  function openProduct(id) {
    var p = byId[id];
    if (!p) return;
    if (pmEl.classList.contains('is-open')) pmModal.close();
    pm = { id: id, color: defaultColor(p), size: null, qty: 1 };
    pushRecent(id);
    zoom.classList.remove('no-img');
    zoom.innerHTML = img(pimg(p), p.name, '', true);
    $('.pm-cat', pmEl).textContent = S.name + ' · ' + p.cat;
    $('#pm-name').textContent = p.name;
    $('.pm-rating', pmEl).innerHTML = stars(p) + '<span class="pm-stock' + (p.stock <= 5 ? ' low' : '') + '">' + (p.stock <= 5 ? 'Only ' + p.stock + ' left' : 'In stock') + '</span>';
    $('.pm-price', pmEl).innerHTML = money(p.price) + (p.was ? '<s>' + money(p.was) + '</s><em>Save ' + pct(p) + '%</em>' : '');
    $('.pm-desc', pmEl).textContent = p.desc;
    var opts = '';
    if (p.colors) opts += '<div class="opt-row"><span>Colour <b class="pm-color-name">' + esc(p.colors[0][0]) + '</b></span><div role="radiogroup" aria-label="Colour">' +
      p.colors.map(function (c, i) { return '<button type="button" class="opt-color" role="radio" aria-checked="' + (i === 0) + '" aria-label="' + esc(c[0]) + '" data-color="' + esc(c[0]) + '" style="--sw:' + c[1] + '"></button>'; }).join('') + '</div></div>';
    if (p.sizes) opts += '<div class="opt-row"><span>' + esc(p.sizeLabel || 'Size') + ' <b class="pm-size-name">Select</b></span><div role="radiogroup" aria-label="' + esc(p.sizeLabel || 'Size') + '">' +
      p.sizes.map(function (s) { return '<button type="button" class="opt-size" role="radio" aria-checked="false" data-size="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div></div>';
    $('.pm-opts', pmEl).innerHTML = opts;
    var stockPct = Math.max(6, Math.min(100, p.stock / 40 * 100));
    $('.pm-ship', pmEl).innerHTML = '<div class="pm-deliv">' + deliveryLine() + '</div><div class="pm-stockbar' + (p.stock <= 5 ? ' low' : '') + '"><span>' + (p.stock <= 5 ? 'Selling fast · ' + p.stock + ' left' : p.stock + ' in stock') + '</span><i><b style="width:' + stockPct.toFixed(0) + '%"></b></i></div>';
    $('.pm-details', pmEl).innerHTML = (p.details || []).map(function (d) { return '<li>' + I('check') + esc(d) + '</li>'; }).join('');
    $('.pm-perks', pmEl).innerHTML = '<li>' + I('truck') + esc(S.eta) + '</li><li>' + I('refresh') + esc(S.policies[1] ? S.policies[1][1] : 'Easy returns') + '</li>';
    var pair = P.filter(function (x) { return x.id !== id && x.cat === p.cat; }).concat(P.filter(function (x) { return x.id !== id && x.cat !== p.cat; })).slice(0, 3);
    var mate = pair.filter(function (x) { return !x.sizes; })[0];
    $('.pm-pair', pmEl).innerHTML = '<small>Goes well with</small><div>' + pair.map(function (x) { return '<button type="button" class="pair" data-view="' + x.id + '"><span class="pair-img">' + pic(x) + '</span><span><b>' + esc(x.name) + '</b><small>' + money(x.price) + '</small></span></button>'; }).join('') + '</div>' +
      (mate && !p.sizes ? '<button type="button" class="pm-bundle" data-bundle="' + mate.id + '">' + I('plus') + '<span>Add both · <b>' + money(p.price + mate.price) + '</b></span></button>' : '');
    var idx = P.indexOf(p);
    $('.pm-nav', pmEl).innerHTML = '<button type="button" data-pmstep="-1" aria-label="Previous product">' + I('chevron-left') + '</button><span>' + (idx + 1) + ' / ' + P.length + '</span><button type="button" data-pmstep="1" aria-label="Next product">' + I('chevron-right') + '</button>';
    $('.pm-qty', pmEl).textContent = 1;
    var wOn = wish.indexOf(id) >= 0;
    $('.pm-wish', pmEl).classList.toggle('is-on', wOn);
    $('.pm-wish', pmEl).setAttribute('aria-pressed', wOn);
    $('.pm-add', pmEl).lastChild.textContent = 'Add to bag · ' + money(p.price);
    pmModal.open();
    emit('view', p);
  }
  pmEl.addEventListener('click', function (e) {
    var c = e.target.closest('[data-color]');
    if (c) {
      pm.color = c.getAttribute('data-color');
      $$('[data-color]', pmEl).forEach(function (x) { x.setAttribute('aria-checked', x === c); });
      $('.pm-color-name', pmEl).textContent = pm.color;
      var sw = c.style.getPropertyValue('--sw');
      zoom.style.setProperty('--tint', sw);
      zoom.classList.remove('tinting'); void zoom.offsetWidth; zoom.classList.add('tinting');
    }
    var s = e.target.closest('[data-size]');
    if (s) {
      pm.size = s.getAttribute('data-size');
      $$('[data-size]', pmEl).forEach(function (x) { x.setAttribute('aria-checked', x === s); });
      $('.pm-size-name', pmEl).textContent = pm.size;
      $('.pm-opts', pmEl).classList.remove('need');
    }
    var q = e.target.closest('[data-q]');
    if (q) {
      pm.qty = XR.clamp(pm.qty + +q.getAttribute('data-q'), 1, 9);
      $('.pm-qty', pmEl).textContent = pm.qty;
      $('.pm-add', pmEl).lastChild.textContent = 'Add to bag · ' + money(byId[pm.id].price * pm.qty);
    }
    var st = e.target.closest('[data-pmstep]');
    if (st) stepProduct(+st.getAttribute('data-pmstep'));
    var bd = e.target.closest('[data-bundle]');
    if (bd) {
      addToCart(pm.id, pm.color, null, 1, { quiet: true, from: $('.pm-media', pmEl) });
      addToCart(bd.getAttribute('data-bundle'), defaultColor(byId[bd.getAttribute('data-bundle')]), null, 1, { quiet: true });
      XR.toast('Both added to your bag');
      pmModal.close();
    }
  });
  function stepProduct(d) {
    if (!pm.id) return;
    var i = P.indexOf(byId[pm.id]);
    openProduct(P[(i + d + P.length) % P.length].id);
  }
  document.addEventListener('keydown', function (e) {
    if (!pmEl.classList.contains('is-open') || /input|select|textarea/i.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') stepProduct(1);
    if (e.key === 'ArrowLeft') stepProduct(-1);
  });
  /* hover zoom on the product photo (mouse only) */
  var zm = $('.pm-media', pmEl);
  zm.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = zm.getBoundingClientRect(), im = $('img', zoom); if (!im) return;
    im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100).toFixed(1) + '% ' + ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%';
    zm.classList.add('zooming');
  });
  zm.addEventListener('pointerleave', function () { zm.classList.remove('zooming'); });
  $('.pm-add', pmEl).addEventListener('click', function () {
    var p = byId[pm.id];
    if (p.sizes && !pm.size) {
      var o = $('.pm-opts', pmEl); o.classList.remove('need'); void o.offsetWidth; o.classList.add('need');
      XR.toast('Pick a ' + (p.sizeLabel || 'size').toLowerCase() + ' first', 'warn');
      return;
    }
    addToCart(pm.id, pm.color, pm.size, pm.qty, { from: $('.pm-media', pmEl) }); pmModal.close();
  });
  $('.pm-wish', pmEl).addEventListener('click', function () { toggleWish(pm.id); });
  $('.pm-share', pmEl).addEventListener('click', function () {
    XR.copy(location.href.split('#')[0] + '#' + S.id + '/' + pm.id).then(function () { XR.toast('Product link copied'); });
  });

  /* ------------------------------------------------------------------
     Cart
     ------------------------------------------------------------------ */
  var drawer = $('#cart'), itemsEl = $('.cart-items', drawer);
  function key(k) { return 'shop-' + k + '-' + S.id; }
  function save() { XR.store(key('cart'), cart); XR.store(key('wish'), wish); XR.store(key('promo'), promo); XR.store('shop-orders', orders.slice(0, 30)); }
  function flyToCart(from) {
    if (XR.reduce || !from) return;
    var target = $$('.cart-open', site).filter(function (b) { var r = b.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight; })[0] || $('.sf-sticky.is-on .sfs-go');
    var im = from.tagName === 'IMG' ? from : $('img', from.closest('.pc, article, .pm-media, [data-fly]') || from);
    if (!target || !im) return;
    var a = im.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width) return;
    var f = im.cloneNode();
    f.className = 'fly-img';
    f.removeAttribute('loading');
    f.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px';
    document.body.appendChild(f);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    f.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: '8px' },
      { transform: 'translate(' + dx * .5 + 'px,' + (dy * .5 - 120) + 'px) scale(.45)', opacity: 1, offset: .55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08)', opacity: .4, borderRadius: '50%' }
    ], { duration: 820, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = function () { f.remove(); };
  }
  function addToCart(id, color, size, qty, o) {
    o = o || {};
    var line = cart.find(function (l) { return l.id === id && l.color === color && l.size === size && !l.note; });
    if (line && !o.note) line.qty = Math.min(9, line.qty + qty); else cart.push({ id: id, color: color, size: size, qty: qty, note: o.note || null });
    save(); renderCart();
    if (o.from) flyToCart(o.from);
    $$('.cart-count', site).forEach(function (cc) { cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump'); });
    if (!o.quiet) XR.toast(byId[id].name + ' added to your bag');
    feed('cart', '#6fb3a8', 'Item added to a bag: ' + byId[id].name, 'storefront');
    emit('cart', cart);
  }
  function totals() {
    var sub = cart.reduce(function (s, l) { return s + byId[l.id].price * l.qty; }, 0);
    var disc = promo === 'XIRAIYA10' ? sub * .1 : 0;
    var ship = sub === 0 || sub - disc >= S.free || promo === 'FREESHIP' ? 0 : S.ship;
    return { sub: sub, disc: disc, ship: ship, total: sub - disc + ship, count: cart.reduce(function (s, l) { return s + l.qty; }, 0) };
  }
  var sticky = $('.sf-sticky');
  function renderCart() {
    var t = totals();
    $$('.cart-count', site).forEach(function (cc) { cc.textContent = t.count; cc.hidden = !t.count; });
    $('.cart-store', drawer).textContent = S.name;
    drawer.classList.toggle('is-empty', !cart.length);
    itemsEl.innerHTML = cart.map(function (l, i) {
      var p = byId[l.id];
      return '<li class="ci"><span class="ci-img">' + pic(p) + '</span><div class="ci-mid"><b>' + esc(p.name) + '</b><small>' + [l.color, l.size && (p.sizeLabel ? p.sizeLabel + ' ' : '') + l.size, l.note, money(p.price)].filter(Boolean).map(esc).join(' · ') + '</small>' +
        '<div class="qty" role="group" aria-label="Quantity"><button type="button" data-ci="' + i + '" data-d="-1" aria-label="Decrease">' + I('minus') + '</button><span>' + l.qty + '</span><button type="button" data-ci="' + i + '" data-d="1" aria-label="Increase">' + I('plus') + '</button></div></div>' +
        '<div class="ci-right"><span class="ci-price">' + money2(p.price * l.qty) + '</span><button type="button" class="ci-rm" data-rm="' + i + '" aria-label="Remove ' + esc(p.name) + '">' + I('trash') + '</button></div></li>';
    }).join('');
    $('.t-sub', drawer).textContent = money2(t.sub);
    $('.t-disc-row', drawer).hidden = !t.disc;
    $('.t-disc', drawer).textContent = '−' + money2(t.disc);
    $('.t-ship', drawer).textContent = t.ship ? money2(t.ship) : 'Free';
    $('.t-tot', drawer).textContent = money2(t.total);
    var need = Math.max(0, S.free - (t.sub - t.disc));
    $('.ship-text', drawer).innerHTML = need > 0 && promo !== 'FREESHIP' ? 'Add <b>' + money2(need) + '</b> more for free delivery' : '<b>Free delivery unlocked</b>';
    $('.ship-track i', drawer).style.width = (S.free ? Math.min(100, (t.sub - t.disc) / S.free * 100) : 100) + '%';
    $('.promo input', drawer).value = promo || '';
    /* upsell: two things not in the bag, no sizes needed */
    var inBag = cart.map(function (l) { return l.id; });
    var ups = P.filter(function (p) { return inBag.indexOf(p.id) < 0 && !p.sizes; }).sort(function (a, b) { return b.reviews - a.reviews; }).slice(0, 2);
    $('.cart-ups', drawer).innerHTML = ups.length && cart.length ? '<small>Customers also add</small>' + ups.map(function (p) {
      return '<div class="up"><span class="up-img">' + pic(p) + '</span><span><b>' + esc(p.name) + '</b><em>' + money(p.price) + '</em></span><button type="button" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + '">' + I('plus') + '</button></div>';
    }).join('') : '';
    if (sticky) {
      sticky.classList.toggle('is-on', t.count > 0 && !$('.store').hidden);
      $('.sfs-t', sticky).innerHTML = '<b>' + t.count + ' item' + (t.count === 1 ? '' : 's') + '</b> · ' + money2(t.total);
    }
  }
  itemsEl.addEventListener('click', function (e) {
    var d = e.target.closest('[data-d]'), r = e.target.closest('[data-rm]');
    if (d) { var l = cart[+d.getAttribute('data-ci')]; l.qty += +d.getAttribute('data-d'); if (l.qty < 1) cart.splice(+d.getAttribute('data-ci'), 1); else l.qty = Math.min(9, l.qty); }
    if (r) cart.splice(+r.getAttribute('data-rm'), 1);
    if (d || r) { save(); renderCart(); emit('cart', cart); }
  });
  $('.promo', drawer).addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('.promo input', drawer).value.trim().toUpperCase();
    if (v === 'XIRAIYA10' || v === 'FREESHIP') { promo = v; XR.toast(v === 'XIRAIYA10' ? '10% off applied' : 'Free delivery applied'); }
    else { promo = null; XR.toast('Code not recognised. Try XIRAIYA10', 'warn'); }
    save(); renderCart();
  });
  var lastFocus;
  function openCart(v) {
    if (v) lastFocus = document.activeElement;
    drawer.classList.toggle('is-open', v);
    drawer.setAttribute('aria-hidden', !v);
    document.body.style.overflow = v ? 'hidden' : '';
    if (v) setTimeout(function () { var f = $('.modal-close', drawer); f && f.focus({ preventScroll: true }); }, 50);
    else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  drawer.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) openCart(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) openCart(false); });
  if (sticky) $('.sfs-go', sticky).addEventListener('click', function () { openCart(true); });

  /* ------------------------------------------------------------------
     Checkout
     ------------------------------------------------------------------ */
  var coEl = $('#checkout'), co = XR.modal(coEl), method = 'bkash', coin = 'USDT', paying = false, customer = {};
  var stepsLi = $$('.co-steps li', coEl);
  function coStep(n) {
    $$('.co-panel', coEl).forEach(function (p) { p.hidden = +p.getAttribute('data-step') !== n; });
    stepsLi.forEach(function (li, i) { li.classList.toggle('is-on', i === n); li.classList.toggle('is-done', i < n); });
  }
  function payDefault() {
    method = S.cur === '৳' ? 'bkash' : 'card';
    $$('[data-pm]', coEl).forEach(function (x) { x.setAttribute('aria-checked', x.getAttribute('data-pm') === method); });
  }
  function startCheckout() {
    if (!cart.length) return;
    openCart(false);
    coStep(0); payDefault();
    $('#co-title').textContent = 'Checkout · ' + S.name;
    $('.co-total', coEl).innerHTML = '<small>Order total</small>' + money2(totals().total);
    $('.co-summary', coEl).innerHTML = cart.slice(0, 4).map(function (l) { var p = byId[l.id]; return '<span class="cs-item"><span class="cs-img">' + pic(p) + '<em>' + l.qty + '</em></span></span>'; }).join('') + (cart.length > 4 ? '<span class="cs-more">+' + (cart.length - 4) + '</span>' : '');
    setTimeout(co.open, 250);
  }
  $('.checkout-open', drawer).addEventListener('click', startCheckout);
  $('.co-details', coEl).addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.currentTarget, name = f.name.value.trim(), email = f.email.value.trim();
    var ok = name.length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    $('.co-err', coEl).hidden = ok;
    if (!ok) return;
    customer = { name: name, email: email, city: f.city.value };
    coStep(1); renderPay();
  });
  $('.co-back', coEl).addEventListener('click', function () { coStep(0); });
  $('.pay-methods', coEl).addEventListener('click', function (e) {
    var b = e.target.closest('[data-pm]'); if (!b || paying) return;
    method = b.getAttribute('data-pm');
    $$('[data-pm]', coEl).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
    renderPay();
  });

  var RATES = { USDT: 1, BTC: 64250, ETH: 3180 };
  function cryptoAmt() { var t = usd(totals().total); return coin === 'USDT' ? (t + .0137).toFixed(4) : (t / RATES[coin]).toFixed(coin === 'BTC' ? 8 : 6); }
  function taka(t) { return S.cur === '৳' ? t : usd(t) * 118; }
  function demoAddr() {
    var r = XR.seeded(coin + customer.email), s = coin === 'BTC' ? 'bc1q' : coin === 'ETH' ? '0x' : 'T', chars = coin === 'ETH' ? '0123456789abcdef' : '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    for (var i = 0; i < (coin === 'ETH' ? 40 : 33); i++) s += chars[(r() * chars.length) | 0];
    return s;
  }
  function renderPay() {
    var panel = $('.pm-panel', coEl), t = totals().total, label = $('.co-pay-btn span', coEl);
    if (method === 'crypto') {
      panel.innerHTML = '<div class="cr-row"><div class="cr-qr" aria-label="Decorative QR code (demo)"></div><div class="cr-info"><div class="cr-coins" role="radiogroup" aria-label="Coin">' +
        ['USDT', 'BTC', 'ETH'].map(function (c) { return '<button type="button" role="radio" aria-checked="' + (c === coin) + '" data-coin="' + c + '">' + I(c.toLowerCase()) + c + '</button>'; }).join('') + '</div>' +
        '<div class="cr-amt"><small>Send exactly</small>' + cryptoAmt() + ' ' + coin + '</div><div class="cr-addr"><code>' + demoAddr() + '</code><button type="button" class="cr-copy" aria-label="Copy demo address">' + I('copy') + '</button></div>' +
        '<p class="cr-status"><i></i><span>Waiting for payment · detected on-chain automatically</span></p></div></div>';
      XR.qr($('.cr-qr', panel), demoAddr() + cryptoAmt());
      label.textContent = 'Simulate payment';
    } else if (method === 'bkash' || method === 'nagad') {
      var nm = method === 'bkash' ? 'bKash' : 'Nagad', mc = method === 'bkash' ? '#e2136e' : '#f6921e';
      panel.innerHTML = '<div class="mfs"><span class="mfs-logo" style="--mc:' + mc + '"><span>' + I('phone') + '</span>' + nm + ' merchant payment</span><ol><li>Open the ' + nm + ' app and tap <b>Payment</b></li><li>Merchant number: <b>01XXXXXXXXX (demo)</b></li><li>Amount: <b>৳' + Math.round(taka(t)).toLocaleString('en-IN') + '</b>' + (S.cur !== '৳' ? ' (' + money2(t) + ')' : '') + '</li><li>Paste the transaction ID below. It is checked automatically.</li></ol>' +
        '<div class="field"><label for="trx">Transaction ID</label><input id="trx" class="input" value="DEMO8X2K5Q" spellcheck="false" autocomplete="off"></div></div>';
      label.textContent = 'Verify payment';
    } else if (method === 'card') {
      panel.innerHTML = '<div class="card-form"><div class="card-prev" style="--ca:' + S.pal.accent + '"><div class="row"><small>' + esc(S.name) + ' · test card</small>' + I('card') + '</div><b>4242 4242 4242 4242</b><div class="row"><small>' + esc(customer.name || 'Demo customer') + '</small><small>12 / 30</small></div></div>' +
        '<div class="field full"><label for="cc-num">Card number (test)</label><input id="cc-num" class="input" value="4242 4242 4242 4242" readonly></div>' +
        '<div class="field"><label for="cc-exp">Expiry</label><input id="cc-exp" class="input" value="12 / 30" readonly></div><div class="field"><label for="cc-cvc">CVC</label><input id="cc-cvc" class="input" value="123" readonly></div></div>' +
        '<p class="muted" style="font-size:13px">Test card only. A real store uses a hosted checkout (Stripe, SSLCommerz) so card numbers never touch the site.</p>';
      label.textContent = 'Pay ' + money2(t);
    } else {
      panel.innerHTML = '<div class="mfs"><span class="mfs-logo" style="--mc:#6d7a8c"><span>' + I('truck') + '</span>Cash on delivery</span><p>Pay <b>' + money2(t) + '</b> to the courier when your order arrives. We send an SMS to confirm the order before it ships, which cuts fake orders.</p></div>';
      label.textContent = 'Place order';
    }
  }
  $('.pm-panel', coEl).addEventListener('click', function (e) {
    var c = e.target.closest('[data-coin]');
    if (c && !paying) { coin = c.getAttribute('data-coin'); renderPay(); }
    if (e.target.closest('.cr-copy')) XR.copy($('.cr-addr code', coEl).textContent).then(function () { XR.toast('Demo address copied. Never send real funds'); });
  });
  $('.co-pay-btn', coEl).addEventListener('click', async function () {
    if (paying) return;
    paying = true;
    var btn = this, label = $('span', btn);
    btn.disabled = true;
    if (method === 'crypto') {
      var st = $('.cr-status span', coEl);
      st.textContent = 'Transaction seen · 0/3 confirmations'; await sleep(900);
      for (var i = 1; i <= 3; i++) { st.textContent = 'Confirming · ' + i + '/3'; await sleep(700); }
      $('.cr-status', coEl).classList.add('ok'); st.textContent = 'Payment confirmed';
      $('.cr-qr', coEl).classList.add('is-paid'); await sleep(700);
    } else {
      label.textContent = method === 'cod' ? 'Placing order…' : 'Checking…'; await sleep(1300);
    }
    placeOrder();
    btn.disabled = false; paying = false;
  });

  function orderPrefix() { return S.id.slice(0, 2).toUpperCase(); }
  function placeOrder() {
    var t = totals(), id = orderPrefix() + '-' + (48000 + ((Math.random() * 1999) | 0));
    var names = { crypto: coin, bkash: 'bKash', nagad: 'Nagad', card: 'Card', cod: 'COD' };
    var order = { store: S.id, id: id, name: customer.name, items: cart.map(function (l) { return l.qty + '× ' + byId[l.id].name; }).join(', '), pay: names[method], total: t.total, status: method === 'cod' ? 'cod' : 'paid', time: Date.now() };
    cart.forEach(function (l) { byId[l.id].stock = Math.max(0, byId[l.id].stock - l.qty); });
    orders.unshift(order);
    cart = []; promo = null;
    save(); renderCart(); render(); renderAdmin(true);
    feed('bag', '#d9a441', 'New order ' + id + ' · ' + money2(order.total), order.pay + (order.status === 'paid' ? ' · paid' : ' · confirmation SMS sent'));
    feed('send', '#2f9bff', 'Telegram alert sent to @' + S.handle, id);
    $('.done-id', coEl).innerHTML = 'Order <b>' + id + '</b> · ' + esc(order.items) + '<br>Total ' + money2(order.total) + ' · ' + order.pay;
    coStep(2);
    confetti();
    emit('order', order);
  }
  function confetti() {
    var b = $('.done-burst', coEl), cols = [S.pal.accent, '#6fb3a8', '#d9a441', '#9483c2', '#a9c46a', S.pal.ink], h = '';
    for (var i = 0; i < 40; i++) {
      var a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 170;
      h += '<i style="background:' + cols[i % cols.length] + ';--x:' + (Math.cos(a) * d).toFixed(0) + 'px;--y:' + (Math.sin(a) * d * .8 + 40).toFixed(0) + 'px;--r:' + ((Math.random() * 720) | 0) + 'deg;animation-delay:' + (Math.random() * .15).toFixed(2) + 's"></i>';
    }
    b.innerHTML = h;
  }
  $('.see-admin', coEl).addEventListener('click', function () { co.close(); setMode('admin'); });

  /* ------------------------------------------------------------------
     Shopping assistant (rule-based, knows the current catalogue)
     ------------------------------------------------------------------ */
  var ai = $('.ai-shop'), aiBox = $('.ai-box', ai), aiMsgs = $('.ai-msgs', ai), aiQ = Promise.resolve(), greeted = false;
  function aiAdd(html, who) {
    var m = document.createElement('div');
    m.className = 'ai-m ' + who;
    m.innerHTML = html;
    aiMsgs.appendChild(m); aiMsgs.scrollTop = aiMsgs.scrollHeight;
  }
  function aiSay(html, picks) {
    var store = S.id;
    aiQ = aiQ.then(function () {
      if (store !== S.id) return;
      var t = document.createElement('div');
      t.className = 'ai-typing'; t.innerHTML = '<i></i><i></i><i></i>';
      aiMsgs.appendChild(t); aiMsgs.scrollTop = aiMsgs.scrollHeight;
      return new Promise(function (r) { setTimeout(r, XR.reduce ? 0 : 650); }).then(function () {
        t.remove();
        if (store !== S.id) return;
        if (picks && picks.length) html += '<div class="ai-picks">' + picks.map(function (p) {
          return '<div class="ai-pick"><span class="ai-thumb">' + pic(p) + '</span><div><b>' + esc(p.name) + '</b><small>' + money(p.price) + ' · ' + p.rating.toFixed(1) + ' stars</small></div>' +
            (p.sizes ? '<button type="button" data-view="' + p.id + '" data-ai-view>View</button>' : '<button type="button" data-ai-add="' + p.id + '">Add</button>') + '</div>';
        }).join('') + '</div>';
        aiAdd(html, 'bot');
      });
    });
  }
  function think(text) {
    var t = text.toLowerCase(), list = P.slice(), note = [];
    if (/^(hi|hello|hey|salam|assalamu|yo)\b/.test(t)) return aiSay('Hello! Tell me who it is for, a budget, or what you have in mind, and I will find it.');
    if (/cart|basket|bag/.test(t) && !/add|bag\s+for|bags?$/.test(t)) {
      var tt = totals();
      return aiSay(cart.length ? 'You have <b>' + tt.count + '</b> item' + (tt.count > 1 ? 's' : '') + ' in your bag, <b>' + money2(tt.total) + '</b> in total. ' + (tt.sub - tt.disc < S.free ? 'Add ' + money2(S.free - (tt.sub - tt.disc)) + ' more for free delivery.' : 'Free delivery is unlocked.') : 'Your bag is empty. Want a few suggestions?');
    }
    if (/discount|coupon|promo|code|offer|deal|sale/.test(t)) {
      var sale = P.filter(function (p) { return p.was; });
      return aiSay('Use <b>XIRAIYA10</b> for 10% off, or <b>FREESHIP</b> for free delivery (one code per order).' + (sale.length ? ' These are already reduced:' : ''), sale.slice(0, 3));
    }
    if (/ship|deliver|arrive|how long/.test(t)) return aiSay(esc(S.eta) + '. ' + (S.free ? 'Delivery is free over ' + money(S.free) + ', otherwise ' + money(S.ship) + '.' : 'Delivery is always free.'));
    if (/return|refund|exchange|warranty|guarantee/.test(t)) return aiSay(S.policies.map(function (x) { return '<b>' + esc(x[1]) + '.</b> ' + esc(x[2]); }).join('<br>'));
    if (/size|fit/.test(t) && !/under|below/.test(t)) {
      var sized = P.filter(function (p) { return p.sizes; });
      return aiSay(sized.length ? 'Sizes are listed on each product (' + esc(sized[0].sizeLabel || 'size') + ' ' + sized[0].sizes.map(esc).join(', ') + ' for ' + esc(sized[0].name) + '). If you are between two, most customers go for the larger one, and exchanges are free.' : 'Everything here is one size, so no guessing needed.');
    }
    if (/pay|crypto|bkash|nagad|usdt|card|cash/.test(t)) return aiSay('You can pay with bKash, Nagad, card, cash on delivery or crypto (USDT, BTC, ETH). Crypto and bKash are confirmed automatically.');
    var addM = t.match(/add (?:the |a |an |one )?(.+?)(?: to (?:my )?(?:cart|bag))?$/);
    if (addM) {
      var w0 = addM[1].trim().split(' ')[0];
      var hit = P.find(function (p) { return (p.name + ' ' + p.tags).toLowerCase().indexOf(w0) >= 0; });
      if (hit && !hit.sizes) { addToCart(hit.id, defaultColor(hit), null, 1); return aiSay('Done. <b>' + esc(hit.name) + '</b> is in your bag.'); }
      if (hit) return aiSay('<b>' + esc(hit.name) + '</b> comes in different ' + esc((hit.sizeLabel || 'size').toLowerCase()) + 's. Pick one here:', [hit]);
    }
    var cap = t.match(/(?:under|below|less than|max|cheaper than|within|up to)\s*[^\d]{0,3}\s*([\d.,]+)/) || t.match(/[$€£৳]\s*([\d.,]+)/);
    if (cap) { var lim = +cap[1].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'); list = list.filter(function (p) { return p.price <= lim; }); note.push('under ' + money(lim)); }
    S.cats.slice(1).forEach(function (c) {
      var stem = c.toLowerCase().replace(/s$/, '');
      if (t.indexOf(stem) >= 0) { list = list.filter(function (p) { return p.cat === c; }); note.push(c.toLowerCase()); }
    });
    var STOP = ['under', 'below', 'something', 'show', 'want', 'need', 'find', 'with', 'that', 'best', 'cheap', 'cheapest', 'rated', 'good', 'nice', 'more', 'please', 'budget', 'than', 'what', 'have', 'your', 'some', 'gift', 'idea', 'ideas', 'less', 'from', 'this', 'there', 'looking'];
    var words = t.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 3 && STOP.indexOf(w) < 0; });
    var tagged = list.filter(function (p) { var hay = (p.name + ' ' + p.tags + ' ' + p.cat).toLowerCase(); return words.some(function (w) { return hay.indexOf(w.replace(/s$/, '')) >= 0; }); });
    if (tagged.length) { list = tagged; note.push('matching “' + esc(words.join(' ')) + '”'); }
    if (/gift|present/.test(t)) { var g = list.filter(function (p) { return /gift/.test(p.tags); }); if (g.length) list = g; }
    if (/best|top|rated|popular/.test(t)) list.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
    else if (/cheap|budget|lowest|affordable/.test(t)) list.sort(function (a, b) { return a.price - b.price; });
    else list.sort(function (a, b) { return b.reviews - a.reviews; });
    if (!list.length) return aiSay('Nothing matches that exactly. These are our most-loved pieces instead:', P.slice().sort(function (a, b) { return b.reviews - a.reviews; }).slice(0, 3));
    aiSay((note.length ? 'Found ' + list.length + ' ' + note.join(', ') + '. ' : '') + 'My picks:', list.slice(0, 3));
  }
  function setupAI() {
    $('.ai-name', ai).textContent = S.aiName;
    $('.ai-launch-t', ai).textContent = 'Ask ' + S.aiName.replace(/ (assistant|bot|desk|helper)$/i, '');
    $('.ai-input input', ai).placeholder = 'e.g. ' + S.aiSugg[0].toLowerCase();
    $('.ai-sugg', ai).innerHTML = S.aiSugg.map(function (s) { return '<button type="button">' + esc(s) + '</button>'; }).join('');
    aiMsgs.innerHTML = ''; greeted = false;
    if (!aiBox.hidden) aiOpen(true);
  }
  $('.ai-sugg', ai).addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { aiAdd(esc(b.textContent), 'me'); think(b.textContent); } });
  $('.ai-input', ai).addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('input', e.currentTarget), v = inp.value.trim(); if (!v) return;
    inp.value = ''; aiAdd(esc(v), 'me'); think(v);
  });
  aiMsgs.addEventListener('click', function (e) {
    var v = e.target.closest('[data-ai-view]');
    if (v) { openProduct(v.getAttribute('data-view')); return; }
    var b = e.target.closest('[data-ai-add]'); if (!b) return;
    var p = byId[b.getAttribute('data-ai-add')];
    addToCart(p.id, defaultColor(p), null, 1);
    b.textContent = 'Added'; b.disabled = true;
    feed('sparkle', '#9483c2', 'Assistant added ' + p.name + ' to a bag', 'assisted sale');
  });
  function aiOpen(v) {
    aiBox.hidden = !v;
    $('.ai-launch', ai).setAttribute('aria-expanded', v);
    if (v && !greeted) { greeted = true; aiSay('Hi, I am the <b>' + esc(S.aiName) + '</b> for ' + esc(S.name) + '. I know every product, price and size here. What are you looking for?'); }
    if (v && XR.fine) setTimeout(function () { $('.ai-input input', ai).focus({ preventScroll: true }); }, 200);
  }
  $('.ai-launch', ai).addEventListener('click', function () { aiOpen(aiBox.hidden); });
  $('.ai-x', ai).addEventListener('click', function () { aiOpen(false); });

  /* ------------------------------------------------------------------
     Admin
     ------------------------------------------------------------------ */
  var AUTOS = [
    ['bot', '#6fb3a8', 'Shopping assistant', 'Answered 312 chats · 94% without a human'],
    ['box', '#d9a441', 'Low-stock reorder', 'Drafts a purchase order at 5 units'],
    ['refresh', '#9483c2', 'Abandoned-bag reminder', 'Sends one friendly message after 3 hours'],
    ['wallet', '#a9c46a', 'Payment matching', 'bKash and crypto matched to orders automatically'],
    ['send', '#2f9bff', 'Order alerts', 'Posts every order to Telegram'],
    ['star', '#df7f73', 'Review replies', 'Drafts replies in English and Bangla for approval']
  ];
  var autoOn = AUTOS.map(function () { return true; });
  var BUYERS = [['Nadia R.', 'bKash'], ['Tanvir H.', 'Card'], ['Emma W.', 'USDT'], ['Arif S.', 'COD'], ['Maliha K.', 'Nagad'], ['Jonas P.', 'Card']];
  var STATUSES = ['ship', 'pack', 'ship', 'cod', 'paid', 'ship'];
  var ST = { paid: 'Paid', pack: 'Packing', ship: 'Shipped', cod: 'COD · confirmed' };
  function seedOrders() {
    var r = XR.seeded('orders-' + S.id);
    return BUYERS.slice(0, 5).map(function (b, i) {
      var p = P[(r() * P.length) | 0], q = r() > .75 ? 2 : 1;
      return { id: orderPrefix() + '-' + (47990 - i * 7), name: b[0], items: q + '× ' + p.name, pay: b[1], total: p.price * q, status: STATUSES[i] };
    });
  }
  var adminReady = false;
  function renderAdmin(flash) {
    var mine = orders.filter(function (o) { return o.store === S.id; }).slice(0, 8), seed = seedOrders();
    var rev = seed.reduce(function (s, o) { return s + o.total; }, 0) * 2.6 + mine.reduce(function (s, o) { return s + o.total; }, 0);
    $('.adm-store').innerHTML = S.word;
    $('.adm-date').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    $('.k-rev').textContent = money(Math.round(rev));
    $('.k-orders').textContent = 37 + mine.length;
    $('.orders-body').innerHTML = mine.concat(seed).slice(0, 10).map(function (o, i) {
      return '<tr' + (flash && i === 0 && mine.length ? ' class="is-new"' : '') + '><td>' + esc(o.id) + '</td><td>' + esc(o.name) + '</td><td>' + esc(o.items) + '</td><td>' + esc(o.pay) + '</td><td>' + money2(o.total) + '</td><td><span class="st ' + o.status + '">' + ST[o.status] + '</span></td></tr>';
    }).join('');
    $('.inv').innerHTML = P.slice().sort(function (a, b) { return a.stock - b.stock; }).slice(0, 6).map(function (p) {
      return '<li class="' + (p.stock <= 5 ? 'low' : '') + '"><span class="inv-img">' + pic(p) + '</span><div class="inv-t"><div><b>' + esc(p.name) + '</b><em>' + p.stock + ' left' + (p.stock <= 5 ? ' · reorder drafted' : '') + '</em></div><div class="inv-bar"><i style="width:' + Math.min(100, p.stock / 40 * 100) + '%"></i></div></div></li>';
    }).join('');
    AUTOS[4][3] = 'Posts every order to @' + S.handle;
    if (!adminReady) {
      adminReady = true;
      $('.autos').innerHTML = AUTOS.map(function (a, i) {
        return '<li><label class="auto" style="--c:' + a[1] + '"><span>' + I(a[0]) + '</span><span><b>' + a[2] + '</b><small>' + a[3] + '</small></span><input type="checkbox" class="sr-only" checked data-auto="' + i + '"><span class="switch" aria-hidden="true"></span></label></li>';
      }).join('');
    } else {
      var sm = $$('.auto small')[4]; if (sm) sm.textContent = AUTOS[4][3];
    }
    drawChart();
  }
  $('.autos').addEventListener('change', function (e) {
    var i = +e.target.getAttribute('data-auto');
    autoOn[i] = e.target.checked;
    e.target.closest('.auto').classList.toggle('off', !e.target.checked);
    $('.auto-state').textContent = autoOn.filter(Boolean).length + ' running';
    feed(AUTOS[i][0], AUTOS[i][1], AUTOS[i][2] + (e.target.checked ? ' switched on' : ' paused'), 'by you');
  });
  function drawChart() {
    var svg = $('.chart'), r = XR.seeded('rev-' + S.id), pts = [], W = 600, H = 220, n = 14, max = 0, i, base = P.reduce(function (s, p) { return s + p.price; }, 0) / P.length;
    for (i = 0; i < n; i++) { var v = base * (4 + r() * 5 + i * .35); pts.push(v); max = Math.max(max, v); }
    max *= 1.15;
    var xy = pts.map(function (v, i) { return [(i / (n - 1)) * W, H - (v / max) * H]; });
    var d = xy.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var g = '';
    for (i = 1; i < 4; i++) g += '<line class="grid-l" x1="0" x2="' + W + '" y1="' + (H * i / 4) + '" y2="' + (H * i / 4) + '"/>';
    svg.innerHTML = '<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0442e" stop-opacity=".28"/><stop offset="1" stop-color="#e0442e" stop-opacity="0"/></linearGradient></defs>' + g +
      '<path class="area" d="' + d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z"/><path class="line" d="' + d + '"/>';
    var days = [];
    for (i = n - 1; i >= 0; i -= 3) { var dt = new Date(Date.now() - i * 864e5); days.push(dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })); }
    $('.chart-x').innerHTML = days.map(function (x) { return '<span>' + x + '</span>'; }).join('');
  }
  var feedEl = $('.feed');
  function feed(icon, color, text, sub) {
    var li = document.createElement('li');
    var d = new Date(), tm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    li.innerHTML = '<span style="--c:' + color + '">' + I(icon) + '</span><div>' + esc(text) + '<small>' + tm + ' · ' + esc(sub) + '</small></div>';
    feedEl.insertBefore(li, feedEl.firstChild);
    while (feedEl.children.length > 7) feedEl.removeChild(feedEl.lastChild);
  }
  function ambient() {
    var p = P[(Math.random() * P.length) | 0];
    return [
      [0, 'Assistant answered “do you deliver to Sylhet?”', 'chat · 1.2 s'],
      [2, 'Reminder recovered a bag worth ' + money(p.price), 'Telegram'],
      [5, 'Review reply drafted for ' + p.name, '5 stars'],
      [1, 'Stock check: ' + p.name + ' has ' + p.stock + ' left', 'inventory'],
      [3, 'bKash payment matched to an order', '58 s after payment'],
      [4, 'Order alert posted', '@' + S.handle]
    ];
  }
  var amb_i = 0;
  setInterval(function () {
    if (document.hidden || $('.admin').hidden) return;
    var a = ambient()[amb_i++ % 6];
    if (!autoOn[a[0]]) return;
    feed(AUTOS[a[0]][0], AUTOS[a[0]][1], a[1], a[2]);
  }, 3600);

  /* ------------------------------------------------------------------
     Mode + store switching
     ------------------------------------------------------------------ */
  function setMode(m) {
    $$('.shop-mode button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-mode') === m); });
    $('.store').hidden = m !== 'store';
    $('.admin').hidden = m !== 'admin';
    ai.hidden = m !== 'store';
    renderCart();
    if (m === 'admin') { renderAdmin(true); if (!feedEl.children.length) { feed('bot', '#6fb3a8', 'Automations running for ' + S.name, 'system'); feed('wallet', '#a9c46a', 'Payment watcher connected', 'bKash · Nagad · USDT'); } }
    var top = $('.shop-mode').getBoundingClientRect().top + scrollY - 120;
    if (scrollY > top) window.scrollTo({ top: top, behavior: XR.reduce ? 'auto' : 'smooth' });
  }
  $$('.shop-mode button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });

  function makeApi() {
    var a = {
      S: S, P: P, byId: byId, state: state, esc: esc, I: I, XR: XR, reduce: XR.reduce, phone: XR.phone, fine: XR.fine,
      money: money, money2: money2, usd: usd, fmt: fmt, photo: photo, pimg: pimg, img: img, pic: pic, stars: stars, badges: badges, pct: pct,
      defaultCard: defaultCard, defaultSize: defaultSize, defaultColor: defaultColor,
      searchBox: searchBox, wishButton: wishButton, cartButton: cartButton, promoHTML: promoHTML, catsHTML: catsHTML, rangeHTML: rangeHTML, sortHTML: sortHTML,
      toolbar: toolbar, gridHTML: gridHTML, reviewsHTML: reviewsHTML, policiesHTML: policiesHTML, newsHTML: newsHTML, creditHTML: creditHTML, footerHTML: footerHTML,
      render: render, setCat: setCat, clearFilters: clearFilters, jump: jump, filtered: filtered,
      openProduct: openProduct, addToCart: function (id, color, size, qty, o) { addToCart(id, color === undefined ? defaultColor(byId[id]) : color, size || null, qty || 1, o); },
      toggleWish: toggleWish, isWished: function (id) { return wish.indexOf(id) >= 0; }, wishList: function () { return wish.slice(); },
      cart: function () { return cart.slice(); }, totals: totals, openCart: openCart, checkout: startCheckout, flyToCart: flyToCart,
      recent: function () { return recentIds().map(function (id) { return byId[id]; }); },
      toast: XR.toast, store: function (k, v) { return v === undefined ? XR.store('shop-x-' + S.id + '-' + k) : XR.store('shop-x-' + S.id + '-' + k, v); },
      on: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
      every: function (fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; },
      later: function (fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; },
      filter: null
    };
    return a;
  }

  var openSeq = 0;
  function openStore(id, scroll) {
    var s = STORES.find(function (x) { return x.id === id; }) || STORES[0];
    if (S && S.id === s.id && !scroll) return;
    var seq = ++openSeq;
    $$('.tpl-card', rail).forEach(function (b) { var on = b.getAttribute('data-store') === s.id; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    sfEl.classList.add('is-loading');
    loadLayout(s.id).then(function (m) {
      if (seq !== openSeq) return;
      if (mod && mod.destroy) { try { mod.destroy(); } catch (e) { console.error(e); } }
      timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = [];
      listeners = {};
      S = s; P = s.products; byId = {};
      P.forEach(function (p) { byId[p.id] = p; });
      var maxPrice = Math.max.apply(null, P.map(function (p) { return p.price; }));
      var step = maxPrice > 5000 ? 500 : maxPrice > 1000 ? 50 : maxPrice > 200 ? 10 : 1;
      state = { cat: 'All', q: '', max: 1e9, sort: 'featured', wishOnly: false, step: step, cap: Math.ceil(maxPrice / step) * step };
      state.max = state.cap;
      cart = (XR.store(key('cart')) || []).filter(function (l) { return byId[l.id]; });
      wish = (XR.store(key('wish')) || []).filter(function (x) { return byId[x]; });
      promo = XR.store(key('promo')) || null;
      mod = m || FALLBACK;
      api = makeApi();
      $('.sf-domain').textContent = s.domain;
      $('.sf-tag').textContent = s.kind;
      applyTheme();
      site.className = 'sf-site lay-' + s.id + (m ? '' : ' lay-fallback');
      try { site.innerHTML = mod.build(api); }
      catch (e) { console.error(e); mod = FALLBACK; site.className = 'sf-site lay-fallback'; site.innerHTML = FALLBACK.build(api); }
      site.classList.remove('is-in'); void site.offsetWidth; site.classList.add('is-in');
      sfEl.classList.remove('is-loading');
      wireStore();
      if (mod.wire) { try { mod.wire(api, site); } catch (e) { console.error(e); } }
      render(); renderCart(); setupAI();
      if (!$('.admin').hidden) renderAdmin(false);
      if (XR.reveals) XR.reveals(site);
      try { history.replaceState(null, '', '#' + s.id); } catch (e) { /* file:// */ }
      if (scroll) {
        var c = $$('.tpl-card', rail).find(function (b) { return b.getAttribute('data-store') === s.id; });
        if (c && rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: c.offsetLeft - rail.clientWidth / 2 + c.offsetWidth / 2, behavior: XR.reduce ? 'auto' : 'smooth' });
        if ($('.admin').hidden) {
          var y = sfEl.getBoundingClientRect().top + scrollY - (XR.phone ? 64 : 84);
          if (Math.abs(scrollY - y) > 40) window.scrollTo({ top: y, behavior: XR.reduce ? 'auto' : 'smooth' });
        }
      }
      if (pendingProduct && byId[pendingProduct]) { var pp = pendingProduct; pendingProduct = null; setTimeout(function () { openProduct(pp); }, 300); }
    });
  }
  window.addEventListener('hashchange', function () {
    var h = location.hash.slice(1).split('/');
    if (STORES.some(function (s) { return s.id === h[0]; })) { if (h[1]) pendingProduct = h[1]; openStore(h[0], true); }
  });

  window.XRShop = {
    register: function (id, m) { LAYOUTS[id] = m; },
    stores: STORES,
    current: function () { return S; },
    open: openStore
  };

  /* credits are optional: the page works without them */
  fetch('assets/img/shop/credits.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
    if (!c) return;
    window.XR_SHOP_CREDITS = c;
    $$('.s-credit', site).forEach(function (el) { el.textContent = S.name + ' is a made-up brand. Product photos: ' + creditLine(c[S.id]) + '. Store template by Xiraiya.'; });
  }).catch(function () {});

  var h0 = location.hash.slice(1).split('/'), pendingProduct = h0[1] || null;
  openStore(STORES.some(function (s) { return s.id === h0[0]; }) ? h0[0] : STORES[0].id, false);
  if (XR.onReady) XR.onReady(prefetch); else setTimeout(prefetch, 3000);
})();
