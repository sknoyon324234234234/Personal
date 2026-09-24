/* =====================================================================
   XIRAIYA — Shop templates: store switcher, themed storefront, cart,
   checkout, shopping assistant and admin. Store data lives in
   shop-data.js. Everything is simulated — no payments, no network.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR, STORES = window.XR_STORES;
  if (!XR || !STORES || !STORES.length) return;
  var $ = XR.$, $$ = XR.$$, I = XR.icon, esc = XR.esc;

  var site = $('#sfSite'), sfEl = $('#sf');
  var S, P, byId;                     // current store, its products, lookup
  var state, cart, wish, promo;       // per-store state
  var orders = XR.store('shop-orders') || [];
  var fontsLoaded = {};

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function photo(name) { return 'assets/img/shop/' + S.id + '/' + name + '.jpg'; }
  function pimg(p) { return photo(p.img || p.id); }
  function img(src, alt, cls, eager) {
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + src + '" alt="' + esc(alt || '') + '"' + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }
  var LOCALE = { '৳': 'en-IN', kr: 'da-DK', '€': 'de-DE', '£': 'en-GB' };
  function fmt(n, dec) {
    return n.toLocaleString(LOCALE[S.cur] || 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
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

  /* image that fails to load: swap in a quiet name tile instead of a broken icon */
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
  function applyTheme() {
    var p = S.pal;
    loadFont(S);
    themeTag.textContent = '.sf-site,.pmodal .pm-box,.drawer .drawer-panel,.ai-shop{' +
      '--s-bg:' + p.bg + ';--s-surface:' + p.surface + ';--s-ink:' + p.ink + ';--s-muted:' + p.muted + ';--s-accent:' + p.accent + ';--s-on:' + p.on + ';--s-line:' + p.line + ';' +
      '--s-r:' + S.radius + 'px;--s-rs:' + Math.min(S.radius, 10) + 'px;--s-fh:' + S.font.h + (/serif|fraunces|mincho|garamond|playfair|baskerville|gloock/i.test(S.font.h) && !/sans/i.test(S.font.h) ? ',Georgia,serif' : ',system-ui,sans-serif') + ';--s-fb:' + S.font.b + ',system-ui,sans-serif;' +
      '--s-ratio:' + ({ square: '1 / 1', tall: '4 / 5', wide: '4 / 3' }[S.card] || '1 / 1') + ';color-scheme:' + (S.dark ? 'dark' : 'light') + '}';
    document.body.setAttribute('data-store', S.id);
    sfEl.classList.toggle('is-dark', !!S.dark);
  }

  /* ------------------------------------------------------------------
     Template rail
     ------------------------------------------------------------------ */
  var rail = $('.tpl-rail');
  $('.tpl-n').textContent = STORES.length;
  rail.innerHTML = STORES.map(function (s) {
    var cover = s.hero.img.replace('-xl', '');
    return '<button type="button" class="tpl-card" role="radio" aria-checked="false" data-store="' + s.id + '" style="--a:' + s.pal.accent + ';--b:' + s.pal.bg + ';--i:' + s.pal.ink + '">' +
      '<span class="tpl-img">' + '<img src="assets/img/shop/' + s.id + '/' + cover + '.jpg" alt="" loading="lazy" decoding="async"></span>' +
      '<span class="tpl-txt"><b>' + esc(s.name) + '</b><small>' + esc(s.kind) + '</small></span>' +
      '<span class="tpl-sw" aria-hidden="true"><i style="background:' + s.pal.bg + '"></i><i style="background:' + s.pal.ink + '"></i><i style="background:' + s.pal.accent + '"></i></span></button>';
  }).join('');
  rail.addEventListener('click', function (e) {
    var b = e.target.closest('[data-store]');
    if (!b) return;
    openStore(b.getAttribute('data-store'), true);
  });
  rail.addEventListener('keydown', function (e) {
    if (['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return;
    var btns = $$('.tpl-card', rail), i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length];
    n.focus(); n.click();
  });

  /* ------------------------------------------------------------------
     Storefront markup
     ------------------------------------------------------------------ */
  function heroHTML() {
    var h = S.hero, big = photo(h.img), note = h.note ? '<div class="sh-note"><b>' + esc(h.note[0]) + '</b><span>' + esc(h.note[1]) + '</span></div>' : '';
    var copy = '<span class="s-eyebrow">' + esc(h.eyebrow) + '</span><h2 class="sh-title">' + esc(h.title) + '</h2><p class="sh-sub">' + esc(h.sub) + '</p>' +
      '<div class="sh-cta"><a class="s-btn" href="#sfShop" data-jump>' + esc(h.cta) + I('arrow-right') + '</a><a class="s-btn s-btn-ghost" href="#sfLook" data-jump>' + esc(S.look.eyebrow) + '</a></div>';
    if (h.layout === 'overlay') return '<section class="sh sh-overlay"><div class="sh-media">' + img(big, '', '', true) + '</div><div class="sh-copy">' + copy + '</div></section>';
    if (h.layout === 'editorial') return '<section class="sh sh-editorial"><div class="sh-copy">' + copy + '</div><figure class="sh-media">' + img(big, '', '', true) + '<figcaption>' + esc(S.name) + ' · ' + esc(S.city) + '</figcaption></figure></section>';
    if (h.layout === 'collage') return '<section class="sh sh-collage"><div class="sh-copy">' + copy + '</div><div class="sh-mosaic"><div class="sh-media m1">' + img(big, '', '', true) + '</div>' +
      (h.imgs || []).map(function (x, i) { return '<div class="sh-media m' + (i + 2) + '">' + img(photo(x), '') + '</div>'; }).join('') + '</div></section>';
    return '<section class="sh sh-split"><div class="sh-copy">' + copy + '</div><div class="sh-media">' + img(big, '', '', true) + note + '</div></section>';
  }
  function build() {
    var catLinks = S.cats.slice(1).map(function (c) { return '<button type="button" data-navcat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
    var promo = S.promo.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    var look = S.look, lookPicks = (look.pids || []).map(function (id) { var p = byId[id]; return p ? '<button type="button" class="lk-pick" data-view="' + p.id + '"><span class="lk-thumb">' + img(pimg(p), '') + '</span><span><b>' + esc(p.name) + '</b><small>' + money(p.price) + '</small></span></button>' : ''; }).join('');
    var maxPrice = Math.max.apply(null, P.map(function (p) { return p.price; }));
    var step = maxPrice > 5000 ? 500 : maxPrice > 1000 ? 50 : maxPrice > 200 ? 10 : 1;
    state.cap = Math.ceil(maxPrice / step) * step; state.max = state.cap; state.step = step;
    var credits = (window.XR_SHOP_CREDITS && window.XR_SHOP_CREDITS[S.id]) || null;

    site.innerHTML =
      '<div class="s-promo" aria-label="Store offers"><div class="s-promo-track">' + promo + promo + '</div></div>' +
      '<header class="s-nav"><a class="s-word" href="#sfShop" data-jump>' + S.word + '</a>' +
        '<nav class="s-links" aria-label="' + esc(S.name) + ' categories">' + catLinks + '</nav>' +
        '<div class="s-acts"><label class="s-search">' + I('search') + '<input type="search" placeholder="Search ' + esc(S.name) + '" aria-label="Search products"></label>' +
        '<button type="button" class="s-ic wish-filter" aria-pressed="false" aria-label="Show saved items">' + I('heart') + '<span class="s-badge wish-count">0</span></button>' +
        '<button type="button" class="s-ic cart-open" aria-label="Open bag">' + I('bag') + '<span class="s-badge cart-count">0</span></button></div></header>' +
      heroHTML() +
      '<section class="s-shop" id="sfShop"><div class="s-shop-head"><div><span class="s-eyebrow">' + esc(S.kind) + '</span><h2 class="s-h2">Shop all</h2></div>' +
        '<div class="s-tools"><label class="s-range"><span>Up to <b class="price-v">' + money(state.cap) + '</b></span><input class="range" type="range" min="0" max="' + state.cap + '" step="' + step + '" value="' + state.cap + '" aria-label="Maximum price"></label>' +
        '<label class="s-sort"><span class="sr-only">Sort</span><select aria-label="Sort products"><option value="featured">Featured</option><option value="new">New in</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></label></div></div>' +
        '<div class="s-cats" role="radiogroup" aria-label="Category">' + S.cats.map(function (c) { return '<button type="button" role="radio" aria-checked="' + (c === 'All') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
        '<p class="s-count" aria-live="polite"></p><div class="s-grid" role="list"></div>' +
        '<p class="s-empty" hidden>Nothing matches that. Clear the filters or ask the assistant.</p></section>' +
      '<section class="s-look" id="sfLook"><div class="lk-media">' + img(photo(look.img), '') + '</div><div class="lk-copy"><span class="s-eyebrow">' + esc(look.eyebrow) + '</span><h2 class="s-h2">' + esc(look.title) + '</h2><p>' + esc(look.text) + '</p>' + (lookPicks ? '<div class="lk-picks"><small>In this photo</small>' + lookPicks + '</div>' : '') + '</div></section>' +
      '<section class="s-reviews"><h2 class="s-h2">What customers say</h2><div class="rv-grid">' + S.reviews.map(function (r) {
        return '<figure class="rv"><span class="rv-stars" aria-label="5 out of 5">' + I('star-fill') + I('star-fill') + I('star-fill') + I('star-fill') + I('star-fill') + '</span><blockquote>' + esc(r[0]) + '</blockquote><figcaption><b>' + esc(r[1]) + '</b> · ' + esc(r[2]) + '</figcaption></figure>';
      }).join('') + '</div></section>' +
      '<section class="s-pol">' + S.policies.map(function (x) { return '<div><span class="pol-ic">' + I(x[0]) + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></div>'; }).join('') + '</section>' +
      '<footer class="s-foot"><div class="sf-cols"><div><span class="s-word">' + S.word + '</span><p>' + esc(S.tagline) + '</p></div>' +
        '<div><b>Shop</b>' + S.cats.slice(1).map(function (c) { return '<button type="button" data-navcat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
        '<div><b>Help</b><span>' + esc(S.eta) + '</span><span>Returns & exchanges</span><span>@' + esc(S.handle) + '</span></div>' +
        '<form class="s-news" autocomplete="off"><b>Get the next drop first</b><div><input type="email" placeholder="Email address" aria-label="Email address"><button type="submit" class="s-btn">Join</button></div></form></div>' +
        '<p class="s-credit">' + esc(S.name) + ' is a made-up brand. Product photos: ' + esc(creditLine(credits)) + '. Store template by Xiraiya.</p></footer>';

    wireStore();
    render();
  }
  function creditLine(c) {
    if (!c) return 'free-licence photographers';
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
  /* ------------------------------------------------------------------
     Product grid
     ------------------------------------------------------------------ */
  function filtered() {
    var q = state.q.toLowerCase().trim();
    var list = P.filter(function (p) {
      if (state.cat !== 'All' && p.cat !== state.cat) return false;
      if (p.price > state.max) return false;
      if (state.wishOnly && wish.indexOf(p.id) < 0) return false;
      if (q && (p.name + ' ' + p.cat + ' ' + p.tags).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (state.sort === 'low') list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === 'rating') list.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
    if (state.sort === 'new') list.sort(function (a, b) { return (b.badge === 'new') - (a.badge === 'new'); });
    return list;
  }
  function card(p, i) {
    var badges = (p.was ? '<span class="p-badge sale">−' + pct(p) + '%</span>' : '') + (p.badge === 'new' ? '<span class="p-badge">New</span>' : p.badge === 'best' ? '<span class="p-badge">Bestseller</span>' : p.badge === 'pick' ? '<span class="p-badge">Staff pick</span>' : '');
    var w = wish.indexOf(p.id) >= 0;
    var lab = p.sizeLabel === 'Age' ? 'age' : /size/i.test(p.sizeLabel || 'size') ? (p.sizeLabel || 'size').replace(/^([A-Z])(?=[a-z])/, function (m) { return m.toLowerCase(); }) : 'size';
    var quick = p.sizes ? '<button type="button" class="p-quick" data-view="' + p.id + '" aria-label="Choose ' + esc(lab) + ': ' + esc(p.name) + '">' + I('bag') + '<span>Choose ' + esc(lab) + '</span></button>' : '<button type="button" class="p-quick" data-add="' + p.id + '" aria-label="Add to bag: ' + esc(p.name) + '">' + I('plus') + '<span>Add to bag</span></button>';
    var sw = p.colors ? '<span class="p-sw" aria-label="' + p.colors.length + ' colours">' + p.colors.map(function (c) { return '<i style="background:' + c[1] + '" title="' + esc(c[0]) + '"></i>'; }).join('') + '</span>' : '';
    return '<article class="pc" role="listitem" style="--d:' + Math.min(i * 40, 400) + 'ms">' +
      '<div class="pc-media"><button type="button" class="pc-open" data-view="' + p.id + '" aria-label="View ' + esc(p.name) + '">' + img(pimg(p), p.name) + '</button>' +
      '<div class="p-badges">' + badges + '</div>' +
      '<button type="button" class="p-wish' + (w ? ' is-on' : '') + '" data-wish="' + p.id + '" aria-pressed="' + w + '" aria-label="' + (w ? 'Remove from' : 'Save to') + ' wishlist: ' + esc(p.name) + '">' + I('heart') + '</button>' + quick + '</div>' +
      '<div class="pc-body"><h3 class="pc-name"><button type="button" data-view="' + p.id + '">' + esc(p.name) + '</button></h3>' +
      '<div class="pc-row"><span class="pc-price">' + money(p.price) + (p.was ? ' <s>' + money(p.was) + '</s>' : '') + '</span>' + sw + '</div>' +
      '<div class="pc-meta">' + stars(p) + (p.stock <= 5 ? '<span class="pc-low">Only ' + p.stock + ' left</span>' : '') + '</div></div></article>';
  }
  function render() {
    var list = filtered(), grid = $('.s-grid', site);
    grid.innerHTML = list.map(card).join('');
    $('.s-count', site).textContent = list.length === P.length ? P.length + ' products' : list.length + ' of ' + P.length + ' products';
    $('.s-empty', site).hidden = list.length > 0;
    $('.wish-count', site).textContent = wish.length;
    $('.wish-count', site).hidden = !wish.length;
  }

  function wireStore() {
    $('.s-search input', site).addEventListener('input', function (e) { state.q = e.target.value; render(); });
    $('.s-cats', site).addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      setCat(b.getAttribute('data-cat'));
    });
    var rng = $('.s-range input', site);
    rng.addEventListener('input', function () { state.max = +rng.value; $('.price-v', site).textContent = money(state.max); render(); });
    $('.s-sort select', site).addEventListener('change', function (e) { state.sort = e.target.value; render(); });
    $('.wish-filter', site).addEventListener('click', function (e) {
      state.wishOnly = !state.wishOnly;
      e.currentTarget.setAttribute('aria-pressed', state.wishOnly);
      if (state.wishOnly && !wish.length) XR.toast('Tap the heart on a product to save it');
      render(); jump('#sfShop');
    });
    $('.cart-open', site).addEventListener('click', function () { openCart(true); });
    $('.s-news', site).addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = $('input', e.currentTarget);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())) { XR.toast('That email does not look right', 'warn'); return; }
      inp.value = ''; XR.toast('You are on the list (demo, nothing was sent)');
    });
  }
  function setCat(c) {
    state.cat = c;
    $$('.s-cats [data-cat]', site).forEach(function (x) { x.setAttribute('aria-checked', x.getAttribute('data-cat') === c); });
    render();
  }
  function jump(sel) {
    var t = $(sel, site); if (!t) return;
    var y = t.getBoundingClientRect().top + scrollY - (XR.phone ? 70 : 90);
    window.scrollTo({ top: y, behavior: XR.reduce ? 'auto' : 'smooth' });
  }

  function toggleWish(id) {
    var i = wish.indexOf(id);
    if (i >= 0) wish.splice(i, 1); else { wish.push(id); XR.toast('Saved to your wishlist'); }
    save(); render();
    var pw = $('.pm-wish'); if (pw && pm.id === id) { pw.classList.toggle('is-on', wish.indexOf(id) >= 0); pw.setAttribute('aria-pressed', wish.indexOf(id) >= 0); }
  }

  document.addEventListener('click', function (e) {
    var j = e.target.closest('[data-jump]');
    if (j && site.contains(j)) { e.preventDefault(); jump(j.getAttribute('href')); return; }
    var nc = e.target.closest('[data-navcat]');
    if (nc) { setCat(nc.getAttribute('data-navcat')); jump('#sfShop'); return; }
    var add = e.target.closest('[data-add]');
    if (add) { e.stopPropagation(); var p = byId[add.getAttribute('data-add')]; addToCart(p.id, defaultColor(p), defaultSize(p), 1); return; }
    var w = e.target.closest('[data-wish]');
    if (w) { toggleWish(w.getAttribute('data-wish')); return; }
    var v = e.target.closest('[data-view]');
    if (v && !v.closest('.ai-shop')) openProduct(v.getAttribute('data-view'));
  });

  /* ------------------------------------------------------------------
     Product modal
     ------------------------------------------------------------------ */
  var pmEl = $('#pmodal'), pmModal = XR.modal(pmEl), pm = { id: null, color: null, size: null, qty: 1 };
  var zoom = $('.pm-zoom', pmEl);
  function openProduct(id) {
    var p = byId[id];
    if (!p) return;
    if (pmEl.classList.contains('is-open')) pmModal.close();
    pm = { id: id, color: defaultColor(p), size: p.sizes ? null : null, qty: 1 };
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
    $('.pm-details', pmEl).innerHTML = (p.details || []).map(function (d) { return '<li>' + I('check') + esc(d) + '</li>'; }).join('');
    $('.pm-perks', pmEl).innerHTML = '<li>' + I('truck') + esc(S.eta) + '</li><li>' + I('refresh') + esc(S.policies[1] ? S.policies[1][1] : 'Easy returns') + '</li>';
    var pair = P.filter(function (x) { return x.id !== id && x.cat === p.cat; }).concat(P.filter(function (x) { return x.id !== id && x.cat !== p.cat; })).slice(0, 3);
    $('.pm-pair', pmEl).innerHTML = '<small>Goes well with</small><div>' + pair.map(function (x) { return '<button type="button" class="pair" data-view="' + x.id + '"><span class="pair-img">' + img(pimg(x), '') + '</span><span><b>' + esc(x.name) + '</b><small>' + money(x.price) + '</small></span></button>'; }).join('') + '</div>';
    $('.pm-qty', pmEl).textContent = 1;
    var wOn = wish.indexOf(id) >= 0;
    $('.pm-wish', pmEl).classList.toggle('is-on', wOn);
    $('.pm-wish', pmEl).setAttribute('aria-pressed', wOn);
    $('.pm-add', pmEl).lastChild.textContent = 'Add to bag · ' + money(p.price);
    pmModal.open();
  }
  pmEl.addEventListener('click', function (e) {
    var c = e.target.closest('[data-color]');
    if (c) {
      pm.color = c.getAttribute('data-color');
      $$('[data-color]', pmEl).forEach(function (x) { x.setAttribute('aria-checked', x === c); });
      $('.pm-color-name', pmEl).textContent = pm.color;
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
    addToCart(pm.id, pm.color, pm.size, pm.qty); pmModal.close();
  });
  $('.pm-wish', pmEl).addEventListener('click', function () { toggleWish(pm.id); });

  /* ------------------------------------------------------------------
     Cart
     ------------------------------------------------------------------ */
  var drawer = $('#cart'), itemsEl = $('.cart-items', drawer);
  function key(k) { return 'shop-' + k + '-' + S.id; }
  function save() { XR.store(key('cart'), cart); XR.store(key('wish'), wish); XR.store(key('promo'), promo); XR.store('shop-orders', orders.slice(0, 30)); }
  function addToCart(id, color, size, qty) {
    var line = cart.find(function (l) { return l.id === id && l.color === color && l.size === size; });
    if (line) line.qty = Math.min(9, line.qty + qty); else cart.push({ id: id, color: color, size: size, qty: qty });
    save(); renderCart();
    var cc = $('.cart-count', site); if (cc) { cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump'); }
    XR.toast(byId[id].name + ' added to your bag');
    feed('cart', '#6fb3a8', 'Item added to a bag: ' + byId[id].name, 'storefront');
  }
  function totals() {
    var sub = cart.reduce(function (s, l) { return s + byId[l.id].price * l.qty; }, 0);
    var disc = promo === 'XIRAIYA10' ? sub * .1 : 0;
    var ship = sub === 0 || sub - disc >= S.free || promo === 'FREESHIP' ? 0 : S.ship;
    return { sub: sub, disc: disc, ship: ship, total: sub - disc + ship, count: cart.reduce(function (s, l) { return s + l.qty; }, 0) };
  }
  function renderCart() {
    var t = totals(), cc = $('.cart-count', site);
    if (cc) { cc.textContent = t.count; cc.hidden = !t.count; }
    $('.cart-store', drawer).textContent = S.name;
    drawer.classList.toggle('is-empty', !cart.length);
    itemsEl.innerHTML = cart.map(function (l, i) {
      var p = byId[l.id];
      return '<li class="ci"><span class="ci-img">' + img(pimg(p), '') + '</span><div class="ci-mid"><b>' + esc(p.name) + '</b><small>' + [l.color, l.size && (p.sizeLabel ? p.sizeLabel + ' ' : '') + l.size, money(p.price)].filter(Boolean).map(esc).join(' · ') + '</small>' +
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
    $('.ship-track i', drawer).style.width = Math.min(100, (t.sub - t.disc) / S.free * 100) + '%';
    $('.promo input', drawer).value = promo || '';
  }
  itemsEl.addEventListener('click', function (e) {
    var d = e.target.closest('[data-d]'), r = e.target.closest('[data-rm]');
    if (d) { var l = cart[+d.getAttribute('data-ci')]; l.qty += +d.getAttribute('data-d'); if (l.qty < 1) cart.splice(+d.getAttribute('data-ci'), 1); else l.qty = Math.min(9, l.qty); }
    if (r) cart.splice(+r.getAttribute('data-rm'), 1);
    if (d || r) { save(); renderCart(); }
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
  $('.checkout-open', drawer).addEventListener('click', function () {
    if (!cart.length) return;
    openCart(false);
    coStep(0); payDefault();
    $('#co-title').textContent = 'Checkout · ' + S.name;
    $('.co-total', coEl).innerHTML = '<small>Order total</small>' + money2(totals().total);
    setTimeout(co.open, 250);
  });
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
      panel.innerHTML = '<div class="card-form"><div class="card-prev"><div class="row"><small>' + esc(S.name) + ' · test card</small>' + I('card') + '</div><b>4242 4242 4242 4242</b><div class="row"><small>' + esc(customer.name || 'Demo customer') + '</small><small>12 / 30</small></div></div>' +
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
    var btn = this, label = $('span', btn), sleep = function (ms) { return new Promise(function (r) { setTimeout(r, XR.reduce ? 0 : ms); }); };
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
          return '<div class="ai-pick"><span class="ai-thumb">' + img(pimg(p), '') + '</span><div><b>' + esc(p.name) + '</b><small>' + money(p.price) + ' · ' + p.rating.toFixed(1) + ' stars</small></div>' +
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
    if (/ship|deliver|arrive|how long/.test(t)) return aiSay(esc(S.eta) + '. Delivery is free over ' + money(S.free) + ', otherwise ' + money(S.ship) + '.');
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
    var cap = t.match(/(?:under|below|less than|max|cheaper than|within|up to)\s*[^\d]{0,3}\s*([\d.,]+)/) || t.match(/[$€৳]\s*([\d.,]+)/);
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
      return '<li class="' + (p.stock <= 5 ? 'low' : '') + '"><span class="inv-img">' + img(pimg(p), '') + '</span><div class="inv-t"><div><b>' + esc(p.name) + '</b><em>' + p.stock + ' left' + (p.stock <= 5 ? ' · reorder drafted' : '') + '</em></div><div class="inv-bar"><i style="width:' + Math.min(100, p.stock / 40 * 100) + '%"></i></div></div></li>';
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
    if (m === 'admin') { renderAdmin(true); if (!feedEl.children.length) { feed('bot', '#6fb3a8', 'Automations running for ' + S.name, 'system'); feed('wallet', '#a9c46a', 'Payment watcher connected', 'bKash · Nagad · USDT'); } }
    var top = $('.shop-mode').getBoundingClientRect().top + scrollY - 120;
    if (scrollY > top) window.scrollTo({ top: top, behavior: XR.reduce ? 'auto' : 'smooth' });
  }
  $$('.shop-mode button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });

  function openStore(id, scroll) {
    var s = STORES.find(function (x) { return x.id === id; }) || STORES[0];
    if (S && S.id === s.id && !scroll) return;
    S = s; P = s.products; byId = {};
    P.forEach(function (p) { byId[p.id] = p; });
    state = { cat: 'All', q: '', max: 1e9, sort: 'featured', wishOnly: false };
    cart = (XR.store(key('cart')) || []).filter(function (l) { return byId[l.id]; });
    wish = (XR.store(key('wish')) || []).filter(function (x) { return byId[x]; });
    promo = XR.store(key('promo')) || null;
    $$('.tpl-card', rail).forEach(function (b) { var on = b.getAttribute('data-store') === s.id; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    $('.sf-domain').textContent = s.domain;
    $('.sf-tag').textContent = s.kind;
    applyTheme();
    site.classList.remove('is-in'); void site.offsetWidth; site.classList.add('is-in');
    build(); renderCart(); setupAI();
    if (!$('.admin').hidden) renderAdmin(false);
    try { history.replaceState(null, '', '#' + s.id); } catch (e) { /* file:// */ }
    if (scroll) {
      var c = $$('.tpl-card', rail).find(function (b) { return b.getAttribute('data-store') === s.id; });
      if (c && rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: c.offsetLeft - rail.clientWidth / 2 + c.offsetWidth / 2, behavior: XR.reduce ? 'auto' : 'smooth' });
      if ($('.admin').hidden) {
        var y = sfEl.getBoundingClientRect().top + scrollY - (XR.phone ? 64 : 84);
        if (Math.abs(scrollY - y) > 40) window.scrollTo({ top: y, behavior: XR.reduce ? 'auto' : 'smooth' });
      }
    }
  }
  window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (STORES.some(function (s) { return s.id === h; })) openStore(h, true); });

  /* credits are optional: the page works without them */
  fetch('assets/img/shop/credits.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
    if (!c) return;
    window.XR_SHOP_CREDITS = c;
    var el = $('.s-credit', site);
    if (el) el.textContent = S.name + ' is a made-up brand. Product photos: ' + creditLine(c[S.id]) + '. Store template by Xiraiya.';
  }).catch(function () {});

  var h0 = location.hash.slice(1);
  openStore(STORES.some(function (s) { return s.id === h0; }) ? h0 : STORES[0].id, false);
})();
