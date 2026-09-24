/* =====================================================================
   XIRAIYA — KAGE.store demo: catalog, cart, checkout, AI assistant,
   autopilot admin. Everything is simulated — no payments, no network.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, I = XR.icon, esc = XR.esc;

  /* ------------------------------------------------------------------
     Product illustrations (inline SVG, drawn in code)
     ------------------------------------------------------------------ */
  var ART = {
    lamp: function (c) {
      return '<g transform="rotate(-38 100 100)"><rect x="89" y="14" width="22" height="126" rx="11" fill="' + c + '" opacity=".22"/><rect x="93" y="18" width="14" height="120" rx="7" fill="' + c + '" opacity=".55"/><rect x="96" y="20" width="8" height="116" rx="4" fill="#fff"/>' +
        '<rect x="84" y="136" width="32" height="9" rx="3" fill="#c9a44a"/><rect x="94" y="145" width="12" height="42" rx="3" fill="#1b1b28"/><path d="M94 152l12 6M94 162l12 6M94 172l12 6" stroke="' + c + '" stroke-width="3"/></g>' +
        '<ellipse cx="100" cy="184" rx="54" ry="7" fill="' + c + '" opacity=".35"/>';
    },
    phones: function (c) {
      return '<path d="M48 112C48 46 152 46 152 112" fill="none" stroke="#262636" stroke-width="15" stroke-linecap="round"/><path d="M48 112C48 46 152 46 152 112" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round" opacity=".85"/>' +
        '<rect x="26" y="100" width="44" height="68" rx="20" fill="#1f1f2e"/><rect x="34" y="108" width="28" height="52" rx="14" fill="' + c + '"/><rect x="130" y="100" width="44" height="68" rx="20" fill="#1f1f2e"/><rect x="138" y="108" width="28" height="52" rx="14" fill="' + c + '"/>' +
        '<path d="M42 122v24M150 122v24" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>';
    },
    keyboard: function (c) {
      var k = '', r, i;
      for (r = 0; r < 4; r++) for (i = 0; i < 10; i++) {
        var accent = (r === 0 && i === 0) || (r === 3 && i > 7) || (r === 1 && i === 9);
        k += '<rect x="' + (28 + i * 14.6) + '" y="' + (78 + r * 15) + '" width="11.5" height="11" rx="3" fill="' + (accent ? c : '#2e2e44') + '"/>';
      }
      return '<g transform="rotate(-8 100 110)"><rect x="18" y="68" width="164" height="94" rx="14" fill="#161622" stroke="' + c + '" stroke-opacity=".7" stroke-width="2"/>' + k +
        '<rect x="60" y="138" width="80" height="12" rx="3" fill="#2e2e44"/><rect x="18" y="160" width="164" height="4" rx="2" fill="' + c + '" opacity=".6"/></g>';
    },
    hoodie: function (c, c2) {
      return '<path d="M70 40C80 28 120 28 130 40L160 58 182 112 160 122 150 96V172H50V96L40 122 18 112 40 58Z" fill="' + c + '"/><path d="M76 42C82 72 118 72 124 42 116 32 84 32 76 42Z" fill="rgba(0,0,0,.35)"/>' +
        '<path d="M92 68 90 98M108 68 110 98" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M68 132H132V162H68Z" fill="rgba(0,0,0,.16)"/><path d="M100 118 90 104 92 90 100 96 108 90 110 104Z" fill="' + c2 + '"/>';
    },
    backpack: function (c, c2) {
      return '<path d="M80 46C80 20 120 20 120 46" fill="none" stroke="#1b1b28" stroke-width="9"/><rect x="50" y="42" width="100" height="132" rx="32" fill="' + c + '"/>' +
        '<rect x="64" y="106" width="72" height="52" rx="14" fill="rgba(0,0,0,.25)"/><path d="M68 92H132" stroke="rgba(255,255,255,.5)" stroke-width="3" stroke-dasharray="5 5"/><circle cx="100" cy="72" r="11" fill="' + c2 + '"/><path d="M100 132v12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>';
    },
    mat: function (c, c2) {
      var p = '';
      [[48, 78], [70, 70], [120, 118], [150, 70], [96, 88], [60, 130], [138, 102]].forEach(function (q) { p += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="4" ry="2.4" fill="' + c2 + '" transform="rotate(30 ' + q[0] + ' ' + q[1] + ')"/>'; });
      return '<g transform="translate(26 0) skewX(-14)"><rect x="20" y="56" width="152" height="98" rx="12" fill="#1a1428" stroke="' + c + '" stroke-opacity=".6" stroke-width="2"/><circle cx="140" cy="84" r="17" fill="' + c + '"/>' +
        '<path d="M22 152 62 102 86 126 116 90 170 152Z" fill="#2c2144"/>' + p + '</g>';
    },
    figure: function (c) {
      var px = [[12, 2], [11, 3], [10, 4], [9, 5], [8, 6], [7, 7], [6, 8], [12, 3], [11, 4], [10, 5], [9, 6], [8, 7]], s = '';
      px.forEach(function (q) { s += '<rect x="' + (40 + q[0] * 9) + '" y="' + (18 + q[1] * 9) + '" width="9" height="9" fill="' + c + '"/>'; });
      s += '<rect x="76" y="93" width="9" height="9" fill="#fff" opacity=".7"/>';
      [[4, 8], [5, 9], [6, 10], [7, 11], [3, 9], [5, 7]].forEach(function (q, i) { s += '<rect x="' + (40 + q[0] * 9) + '" y="' + (18 + q[1] * 9) + '" width="9" height="9" fill="' + (i > 3 ? '#c9a44a' : '#6b4a2b') + '"/>'; });
      return '<ellipse cx="100" cy="170" rx="48" ry="9" fill="' + c + '" opacity=".4"/><rect x="58" y="164" width="84" height="16" rx="4" fill="#1f1f2e"/>' + s;
    },
    mask: function (c) {
      return '<path d="M52 58 40 18 74 46ZM148 58 160 18 126 46Z" fill="#f4f0e8"/><path d="M100 36C150 36 168 80 160 120 152 160 126 178 100 178S48 160 40 120C32 80 50 36 100 36Z" fill="' + c + '"/>' +
        '<path d="M70 82 92 92M130 82 108 92" stroke="#1b1b28" stroke-width="6" stroke-linecap="round"/><path d="M62 100 90 110 62 118ZM138 100 110 110 138 118Z" fill="#fff6a6"/>' +
        '<path d="M70 142Q100 160 130 142L124 154Q100 168 76 154Z" fill="#1b1b28"/><path d="M80 146 84 156 88 148ZM112 148 116 156 120 146Z" fill="#fff"/>';
    },
    watch: function (c, c2) {
      return '<rect x="76" y="12" width="48" height="176" rx="16" fill="#1f1f2e"/><rect x="54" y="56" width="92" height="88" rx="26" fill="#0e0e14" stroke="' + c + '" stroke-width="3"/>' +
        '<circle cx="100" cy="100" r="28" fill="none" stroke="' + c + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="130 200" transform="rotate(-90 100 100)"/>' +
        '<circle cx="100" cy="100" r="17" fill="none" stroke="' + c2 + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="70 200" transform="rotate(-90 100 100)"/><rect x="146" y="88" width="6" height="20" rx="3" fill="#33334a"/>';
    },
    ramen: function (c) {
      return '<path d="M122 26 70 98M142 32 88 100" stroke="#c9a44a" stroke-width="5" stroke-linecap="round"/><path d="M34 100H166C166 148 136 174 100 174S34 148 34 100Z" fill="' + c + '"/>' +
        '<path d="M48 96C58 80 72 110 84 92 96 76 108 108 120 90 132 74 144 104 154 92" fill="none" stroke="#ffe08a" stroke-width="6" stroke-linecap="round"/><circle cx="128" cy="88" r="12" fill="#fff"/><circle cx="128" cy="88" r="6" fill="#ffb627"/>' +
        '<path d="M34 100H166" stroke="#fff" stroke-width="4"/><path d="M58 132H142" stroke="rgba(255,255,255,.45)" stroke-width="3" stroke-dasharray="9 6"/>';
    },
    jacket: function (c, c2) {
      return '<path d="M72 34 100 50 128 34 162 52 184 130 160 138 148 100V172H52V100L40 138 16 130 38 52Z" fill="' + c + '"/><path d="M72 34 100 50 128 34 118 28 100 40 82 28Z" fill="#1b1b28"/>' +
        '<path d="M100 50V172" stroke="#d6d6e2" stroke-width="3"/><rect x="52" y="160" width="96" height="12" fill="#1b1b28"/><circle cx="72" cy="98" r="12" fill="' + c2 + '"/><rect x="118" y="86" width="20" height="4" rx="2" fill="rgba(255,255,255,.6)"/>';
    },
    plush: function (c) {
      return '<ellipse cx="100" cy="174" rx="48" ry="16" fill="' + c + '" opacity=".85"/><path d="M50 72 62 22 94 60ZM150 72 138 22 106 60Z" fill="' + c + '"/><path d="M58 62 64 38 80 58ZM142 62 136 38 120 58Z" fill="#fff3e0"/>' +
        '<ellipse cx="100" cy="102" rx="60" ry="52" fill="' + c + '"/><path d="M100 152C70 152 56 126 60 110 76 126 92 128 100 128S124 126 140 110C144 126 130 152 100 152Z" fill="#fff3e0"/>' +
        '<ellipse cx="78" cy="100" rx="7" ry="9" fill="#1b1b28"/><ellipse cx="122" cy="100" rx="7" ry="9" fill="#1b1b28"/><circle cx="80" cy="97" r="2.5" fill="#fff"/><circle cx="124" cy="97" r="2.5" fill="#fff"/>' +
        '<ellipse cx="100" cy="126" rx="7" ry="5" fill="#1b1b28"/><ellipse cx="66" cy="120" rx="8" ry="4" fill="#ff6f86" opacity=".6"/><ellipse cx="134" cy="120" rx="8" ry="4" fill="#ff6f86" opacity=".6"/>';
    }
  };
  function artSVG(p, color) {
    return '<svg viewBox="0 0 200 200" aria-hidden="true">' + ART[p.art](color || p.colors[0][1], p.c2 || '#ffc24b') + '</svg>';
  }

  /* ------------------------------------------------------------------
     Catalog (fictional demo products)
     ------------------------------------------------------------------ */
  var P = [
    { id: 'katana', name: 'Neon Katana Lamp', cat: 'Decor', price: 59, rating: 4.9, reviews: 214, art: 'lamp', colors: [['Crimson', '#ff2e4d'], ['Cyan', '#27e1d6'], ['Violet', '#8b6cff']], stock: 4, desc: 'Katana-shaped RGB desk lamp with 16M colours, music sync and a USB-C base. Lights up any setup.', tags: 'gift light desk rgb lamp setup' },
    { id: 'ronin', name: 'Ronin ANC Headphones', cat: 'Tech', price: 129, was: 159, rating: 4.8, reviews: 512, art: 'phones', colors: [['Crimson', '#ff2e4d'], ['Arctic', '#dfe7f5'], ['Jade', '#27e1d6']], stock: 6, desc: 'Wireless noise-cancelling headphones with a 40-hour battery and a low-latency gaming mode.', tags: 'music audio gaming headphones sound travel' },
    { id: 'mecha', name: 'Mecha Keyboard K2', cat: 'Tech', price: 89, rating: 4.7, reviews: 389, art: 'keyboard', colors: [['Violet', '#8b6cff'], ['Sakura', '#ff6b9a'], ['Mint', '#5fe0c0']], stock: 21, desc: 'Hot-swappable 75% mechanical keyboard with gasket mount, per-key RGB and tactile switches.', tags: 'gaming desk typing keyboard setup coding' },
    { id: 'kitsune', name: 'Kitsune Hoodie', cat: 'Apparel', price: 64, rating: 4.9, reviews: 176, art: 'hoodie', colors: [['Crimson', '#d8203f'], ['Ink', '#34344c'], ['Cream', '#e9e1d0']], sizes: ['S', 'M', 'L', 'XL'], stock: 9, badge: 'new', desc: '450gsm heavyweight cotton hoodie with an embroidered fox crest and an oversized fit.', tags: 'clothes winter gift hoodie fashion' },
    { id: 'shinobi', name: 'Shinobi Backpack', cat: 'Apparel', price: 79, rating: 4.6, reviews: 98, art: 'backpack', colors: [['Ink', '#34344c'], ['Crimson', '#d8203f']], stock: 15, desc: 'Water-resistant 24L backpack with a padded 16" laptop sleeve and a hidden anti-theft pocket.', tags: 'travel laptop school bag backpack' },
    { id: 'sakura', name: 'Sakura Desk Mat XL', cat: 'Decor', price: 29, rating: 4.8, reviews: 640, art: 'mat', c2: '#ffd1dc', colors: [['Night', '#ff5fb6'], ['Dawn', '#ffc24b']], stock: 40, desc: '900 × 400 mm stitched-edge desk mat with a sakura-at-dusk print and a non-slip base.', tags: 'desk gift gaming mousepad setup cheap' },
    { id: 'pixel', name: 'Pixel Blade Figure', cat: 'Collectibles', price: 45, rating: 4.5, reviews: 61, art: 'figure', colors: [['Diamond', '#5fe0f0'], ['Gold', '#ffc24b']], stock: 12, badge: 'new', desc: 'Die-cast pixel-art sword on a light-up pedestal. Limited run of 500 pieces.', tags: 'gaming minecraft collect gift figure' },
    { id: 'oni', name: 'Oni LED Mask', cat: 'Collectibles', price: 39, rating: 4.4, reviews: 83, art: 'mask', colors: [['Crimson', '#d8203f'], ['Violet', '#6b4de6']], stock: 3, desc: 'Hand-painted oni mask with glowing LED eyes. Wall mount included.', tags: 'decor wall gift mask anime' },
    { id: 'kaze', name: 'Kaze Smartwatch', cat: 'Tech', price: 149, rating: 4.6, reviews: 204, art: 'watch', c2: '#a4ff6b', colors: [['Cyan', '#27e1d6'], ['Crimson', '#ff2e4d']], stock: 18, desc: 'AMOLED smartwatch with heart-rate, SpO2, GPS and a 10-day battery.', tags: 'fitness health sport watch gadget' },
    { id: 'ramen', name: 'Dragon Ramen Bowl Set', cat: 'Decor', price: 34, rating: 4.9, reviews: 302, art: 'ramen', colors: [['Crimson', '#c8173a'], ['Indigo', '#3b3bd0']], stock: 26, desc: 'Two ceramic ramen bowls with chopsticks, spoons and a hand-painted dragon motif.', tags: 'kitchen food gift bowl home' },
    { id: 'akira', name: 'Akira Bomber Jacket', cat: 'Apparel', price: 119, was: 139, rating: 4.7, reviews: 88, art: 'jacket', c2: '#ffc24b', colors: [['Crimson', '#c8173a'], ['Olive', '#5b6b3a'], ['Ink', '#34344c']], sizes: ['S', 'M', 'L', 'XL'], stock: 7, desc: 'Satin bomber jacket with a quilted lining and an embroidered back panel.', tags: 'clothes winter style jacket fashion' },
    { id: 'fox', name: 'Spirit Fox Plush', cat: 'Collectibles', price: 24, rating: 5.0, reviews: 451, art: 'plush', colors: [['Ember', '#ff7a3d'], ['Snow', '#dfe7f5']], stock: 33, desc: 'Ultra-soft 30 cm fox plush. The internet’s favourite desk buddy.', tags: 'gift cute kids plush toy cheap' }
  ];
  var byId = {};
  P.forEach(function (p) { byId[p.id] = p; });
  var CATS = ['All', 'Tech', 'Apparel', 'Decor', 'Collectibles'];

  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); }
  function money2(n) { return '$' + n.toFixed(2); }

  /* ------------------------------------------------------------------
     State (cart + wishlist persist per browser; safe if storage is blocked)
     ------------------------------------------------------------------ */
  var state = { cat: 'All', q: '', max: 150, sort: 'featured', wishOnly: false };
  var cart = (XR.store('kage-cart') || []).filter(function (l) { return byId[l.id]; });
  var wish = (XR.store('kage-wish') || []).filter(function (id) { return byId[id]; });
  var orders = XR.store('kage-orders') || [];
  var promo = XR.store('kage-promo') || null;
  function save() { XR.store('kage-cart', cart); XR.store('kage-wish', wish); XR.store('kage-orders', orders.slice(0, 20)); XR.store('kage-promo', promo); }

  /* ------------------------------------------------------------------
     Storefront rendering
     ------------------------------------------------------------------ */
  var grid = $('.products'), countEl = $('.store-count'), emptyEl = $('.store-empty');
  var catsEl = $('.store-cats');
  catsEl.innerHTML = CATS.map(function (c) { return '<button type="button" role="radio" aria-checked="' + (c === 'All') + '" data-cat="' + c + '">' + c + '</button>'; }).join('');

  function stars(p) { return '<span class="stars">' + I('star-fill') + ' ' + p.rating.toFixed(1) + '<small>(' + p.reviews + ')</small></span>'; }
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
    return list;
  }
  function render() {
    var list = filtered();
    grid.innerHTML = list.map(function (p, i) {
      var badges = (p.was ? '<span class="p-badge">-' + Math.round((1 - p.price / p.was) * 100) + '%</span>' : '') + (p.badge === 'new' ? '<span class="p-badge new">New</span>' : '') + (p.stock <= 6 ? '<span class="p-badge low">Only ' + p.stock + ' left</span>' : '');
      var w = wish.indexOf(p.id) >= 0;
      return '<article class="prod" role="listitem" style="animation-delay:' + (i * .045).toFixed(2) + 's">' +
        '<div class="p-art" style="--c:' + p.colors[0][1] + '" data-view="' + p.id + '" data-cursor-label="View"><div class="p-badges">' + badges + '</div>' + artSVG(p) +
        '<button type="button" class="p-quick" data-add="' + p.id + '">' + I('plus') + 'Quick add</button></div>' +
        '<button type="button" class="p-wish' + (w ? ' is-on' : '') + '" data-wish="' + p.id + '" aria-pressed="' + w + '" aria-label="' + (w ? 'Remove from' : 'Add to') + ' wishlist: ' + esc(p.name) + '">' + I('heart') + '</button>' +
        '<div class="p-info"><span class="p-cat">' + p.cat + '</span><h3 class="p-name"><button type="button" data-view="' + p.id + '">' + esc(p.name) + '</button></h3>' +
        '<div class="p-row"><span class="p-price">' + money(p.price) + (p.was ? '<s>' + money(p.was) + '</s>' : '') + '</span>' + stars(p) + '</div></div></article>';
    }).join('');
    countEl.textContent = list.length + ' of ' + P.length + ' products';
    emptyEl.hidden = list.length > 0;
    $('.wish-count').textContent = wish.length;
  }

  $('.store-search input').addEventListener('input', function (e) { state.q = e.target.value; render(); });
  catsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b) return;
    state.cat = b.getAttribute('data-cat');
    $$('button', catsEl).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
    render();
  });
  $('.store-price input').addEventListener('input', function (e) { state.max = +e.target.value; $('.price-v').textContent = '$' + state.max; render(); });
  $('.store-sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
  $('.wish-filter').addEventListener('click', function (e) {
    state.wishOnly = !state.wishOnly;
    e.currentTarget.setAttribute('aria-pressed', state.wishOnly);
    render();
  });

  function toggleWish(id) {
    var i = wish.indexOf(id);
    if (i >= 0) wish.splice(i, 1); else { wish.push(id); XR.toast('Saved to wishlist'); }
    save(); render();
    var pw = $('.pm-wish'); if (pw && pm.id === id) pw.classList.toggle('is-on', wish.indexOf(id) >= 0);
  }

  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) { e.stopPropagation(); var p = byId[add.getAttribute('data-add')]; addToCart(p.id, p.colors[0][0], p.sizes ? 'M' : null, 1); return; }
    var w = e.target.closest('[data-wish]');
    if (w) { toggleWish(w.getAttribute('data-wish')); return; }
    var v = e.target.closest('[data-view]');
    if (v && !v.closest('.ai-shop')) openProduct(v.getAttribute('data-view'));
  });

  /* ------------------------------------------------------------------
     Product modal
     ------------------------------------------------------------------ */
  var pmEl = $('#pmodal'), pmModal = XR.modal(pmEl), pm = { id: null, color: null, size: null, qty: 1 };
  function openProduct(id) {
    var p = byId[id];
    pm = { id: id, color: p.colors[0][0], size: p.sizes ? 'M' : null, qty: 1 };
    var art = $('.pm-art', pmEl);
    art.style.setProperty('--c', p.colors[0][1]);
    art.innerHTML = artSVG(p);
    $('.pm-cat', pmEl).textContent = p.cat;
    $('#pm-name').textContent = p.name;
    $('.pm-rating', pmEl).innerHTML = stars(p) + ' <span class="muted" style="font-size:13px">· ' + p.stock + ' in stock</span>';
    $('.pm-price', pmEl).innerHTML = money(p.price) + (p.was ? '<s>' + money(p.was) + '</s>' : '');
    $('.pm-desc', pmEl).textContent = p.desc;
    var opts = '<div class="opt-row"><span>Colour · <b class="pm-color-name">' + p.colors[0][0] + '</b></span><div role="radiogroup" aria-label="Colour">' +
      p.colors.map(function (c, i) { return '<button type="button" class="opt-color" role="radio" aria-checked="' + (i === 0) + '" aria-label="' + c[0] + '" data-color="' + c[0] + '" data-hex="' + c[1] + '" style="--sw:' + c[1] + '"></button>'; }).join('') + '</div></div>';
    if (p.sizes) opts += '<div class="opt-row"><span>Size</span><div role="radiogroup" aria-label="Size">' + p.sizes.map(function (s) { return '<button type="button" class="opt-size" role="radio" aria-checked="' + (s === 'M') + '" data-size="' + s + '">' + s + '</button>'; }).join('') + '</div></div>';
    $('.pm-opts', pmEl).innerHTML = opts;
    $('.pm-qty', pmEl).textContent = 1;
    $('.pm-wish', pmEl).classList.toggle('is-on', wish.indexOf(id) >= 0);
    pmModal.open();
  }
  pmEl.addEventListener('click', function (e) {
    var c = e.target.closest('[data-color]');
    if (c) {
      pm.color = c.getAttribute('data-color');
      $$('[data-color]', pmEl).forEach(function (x) { x.setAttribute('aria-checked', x === c); });
      $('.pm-color-name', pmEl).textContent = pm.color;
      var art = $('.pm-art', pmEl), p = byId[pm.id];
      art.style.setProperty('--c', c.getAttribute('data-hex'));
      art.innerHTML = artSVG(p, c.getAttribute('data-hex'));
    }
    var s = e.target.closest('[data-size]');
    if (s) { pm.size = s.getAttribute('data-size'); $$('[data-size]', pmEl).forEach(function (x) { x.setAttribute('aria-checked', x === s); }); }
    var q = e.target.closest('[data-q]');
    if (q) { pm.qty = XR.clamp(pm.qty + +q.getAttribute('data-q'), 1, 9); $('.pm-qty', pmEl).textContent = pm.qty; }
  });
  $('.pm-add', pmEl).addEventListener('click', function () { addToCart(pm.id, pm.color, pm.size, pm.qty); pmModal.close(); });
  $('.pm-wish', pmEl).addEventListener('click', function () { toggleWish(pm.id); });

  /* ------------------------------------------------------------------
     Cart
     ------------------------------------------------------------------ */
  var drawer = $('#cart'), itemsEl = $('.cart-items', drawer);
  function colorHex(p, name) { var c = p.colors.find(function (x) { return x[0] === name; }); return c ? c[1] : p.colors[0][1]; }
  function addToCart(id, color, size, qty) {
    var line = cart.find(function (l) { return l.id === id && l.color === color && l.size === size; });
    if (line) line.qty = Math.min(9, line.qty + qty); else cart.push({ id: id, color: color, size: size, qty: qty });
    save(); renderCart();
    var cc = $('.cart-count'); cc.classList.add('bump'); setTimeout(function () { cc.classList.remove('bump'); }, 300);
    XR.toast(byId[id].name + ' added to cart');
    feed('cart', '#27e1d6', 'Cart updated — ' + byId[id].name, 'storefront session');
  }
  function totals() {
    var sub = cart.reduce(function (s, l) { return s + byId[l.id].price * l.qty; }, 0);
    var disc = promo === 'XIRAIYA10' ? sub * .1 : 0;
    var ship = sub === 0 || sub - disc >= 100 || promo === 'AUTOPILOT' ? 0 : 6;
    return { sub: sub, disc: disc, ship: ship, total: sub - disc + ship, count: cart.reduce(function (s, l) { return s + l.qty; }, 0) };
  }
  function renderCart() {
    var t = totals();
    $('.cart-count').textContent = t.count;
    drawer.classList.toggle('is-empty', !cart.length);
    itemsEl.innerHTML = cart.map(function (l, i) {
      var p = byId[l.id], hex = colorHex(p, l.color);
      return '<li class="ci"><span class="ci-art" style="--c:' + hex + '">' + artSVG(p, hex) + '</span><div><b>' + esc(p.name) + '</b><small>' + l.color + (l.size ? ' · ' + l.size : '') + ' · ' + money(p.price) + '</small>' +
        '<div class="qty" role="group" aria-label="Quantity"><button type="button" data-ci="' + i + '" data-d="-1" aria-label="Decrease">' + I('minus') + '</button><span>' + l.qty + '</span><button type="button" data-ci="' + i + '" data-d="1" aria-label="Increase">' + I('plus') + '</button></div></div>' +
        '<div class="ci-right"><span class="ci-price">' + money2(p.price * l.qty) + '</span><button type="button" class="ci-rm" data-rm="' + i + '" aria-label="Remove ' + esc(p.name) + '">' + I('trash') + '</button></div></li>';
    }).join('');
    $('.t-sub').textContent = money2(t.sub);
    $('.t-disc-row').hidden = !t.disc;
    $('.t-disc').textContent = '-' + money2(t.disc);
    $('.t-ship').textContent = t.ship ? money2(t.ship) : 'Free';
    $('.t-tot').textContent = money2(t.total);
    var need = Math.max(0, 100 - (t.sub - t.disc));
    $('.ship-text').innerHTML = need > 0 && promo !== 'AUTOPILOT' ? 'Add <b>' + money2(need) + '</b> more for free delivery' : '<b>Free delivery unlocked</b>';
    $('.ship-track i').style.width = Math.min(100, (t.sub - t.disc) / 100 * 100) + '%';
    if (promo) $('.promo input').value = promo;
  }
  itemsEl.addEventListener('click', function (e) {
    var d = e.target.closest('[data-d]'), r = e.target.closest('[data-rm]');
    if (d) { var l = cart[+d.getAttribute('data-ci')]; l.qty += +d.getAttribute('data-d'); if (l.qty < 1) cart.splice(+d.getAttribute('data-ci'), 1); else l.qty = Math.min(9, l.qty); }
    if (r) cart.splice(+r.getAttribute('data-rm'), 1);
    if (d || r) { save(); renderCart(); }
  });
  $('.promo').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('.promo input').value.trim().toUpperCase();
    if (v === 'XIRAIYA10' || v === 'AUTOPILOT') { promo = v; XR.toast(v === 'XIRAIYA10' ? '10% discount applied' : 'Free delivery applied'); }
    else { promo = null; XR.toast('Code not recognised — try XIRAIYA10', 'warn'); }
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
  $('.cart-open').addEventListener('click', function () { openCart(true); });
  drawer.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) openCart(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) openCart(false); });

  /* ------------------------------------------------------------------
     Checkout
     ------------------------------------------------------------------ */
  var coEl = $('#checkout'), co = XR.modal(coEl), method = 'crypto', coin = 'USDT', paying = false, customer = {};
  var stepsLi = $$('.co-steps li', coEl);
  function coStep(n) {
    $$('.co-panel', coEl).forEach(function (p) { p.hidden = +p.getAttribute('data-step') !== n; });
    stepsLi.forEach(function (li, i) { li.classList.toggle('is-on', i === n); li.classList.toggle('is-done', i < n); });
  }
  $('.checkout-open').addEventListener('click', function () {
    if (!cart.length) return;
    openCart(false);
    coStep(0);
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
  function cryptoAmt() { var t = totals().total; return coin === 'USDT' ? (t + .0137).toFixed(4) : (t / RATES[coin]).toFixed(coin === 'BTC' ? 8 : 6); }
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
        '<p class="cr-status"><i></i><span>Waiting for payment · auto-detected on-chain</span></p></div></div>';
      XR.qr($('.cr-qr', panel), demoAddr() + cryptoAmt());
      label.textContent = 'Simulate payment';
    } else if (method === 'bkash' || method === 'nagad') {
      var nm = method === 'bkash' ? 'bKash' : 'Nagad', mc = method === 'bkash' ? '#e2136e' : '#f6921e';
      panel.innerHTML = '<div class="mfs"><span class="mfs-logo" style="--mc:' + mc + '"><span>' + I('phone') + '</span>' + nm + ' Merchant</span><ol><li>Open your ' + nm + ' app and choose <b>Payment</b></li><li>Merchant number: <b>01XXXXXXXXX (demo)</b></li><li>Amount: <b>৳' + Math.round(t * 118).toLocaleString('en-US') + '</b> (' + money2(t) + ')</li><li>Enter the Transaction ID below — it’s verified automatically</li></ol>' +
        '<div class="field"><label for="trx">Transaction ID</label><input id="trx" class="input" value="DEMO8X2K5Q" spellcheck="false" autocomplete="off"></div></div>';
      label.textContent = 'Verify payment';
    } else if (method === 'card') {
      panel.innerHTML = '<div class="card-form"><div class="card-prev"><div class="row"><small>KAGE.store · test card</small>' + I('card') + '</div><b>4242 4242 4242 4242</b><div class="row"><small>Demo customer</small><small>12 / 30</small></div></div>' +
        '<div class="field full"><label for="cc-num">Card number (test)</label><input id="cc-num" class="input" value="4242 4242 4242 4242" readonly></div>' +
        '<div class="field"><label for="cc-exp">Expiry</label><input id="cc-exp" class="input" value="12 / 30" readonly></div><div class="field"><label for="cc-cvc">CVC</label><input id="cc-cvc" class="input" value="123" readonly></div></div>' +
        '<p class="muted" style="font-size:13px">Test card only. Real stores use a hosted, PCI-compliant checkout (Stripe, SSLCommerz…) — card details never touch the site.</p>';
      label.textContent = 'Pay ' + money2(t);
    } else {
      panel.innerHTML = '<div class="mfs"><span class="mfs-logo" style="--mc:#8b6cff"><span>' + I('truck') + '</span>Cash on delivery</span><p>Pay <b>' + money2(t) + '</b> when your order arrives. An AI call-bot confirms the order by SMS before dispatch to reduce fake orders.</p></div>';
      label.textContent = 'Place order';
    }
  }
  $('.pm-panel', coEl).addEventListener('click', function (e) {
    var c = e.target.closest('[data-coin]');
    if (c && !paying) { coin = c.getAttribute('data-coin'); renderPay(); }
    if (e.target.closest('.cr-copy')) XR.copy($('.cr-addr code', coEl).textContent).then(function () { XR.toast('Demo address copied — never send real funds'); });
  });
  $('.co-pay-btn', coEl).addEventListener('click', async function () {
    if (paying) return;
    paying = true;
    var btn = this, label = $('span', btn), sleep = function (ms) { return new Promise(function (r) { setTimeout(r, XR.reduce ? 0 : ms); }); };
    btn.disabled = true;
    if (method === 'crypto') {
      var st = $('.cr-status span', coEl);
      st.textContent = 'Transaction detected · 0/3 confirmations'; await sleep(900);
      for (var i = 1; i <= 3; i++) { st.textContent = 'Confirming · ' + i + '/3'; await sleep(700); }
      $('.cr-status', coEl).classList.add('ok'); st.textContent = 'Payment confirmed on-chain';
      $('.cr-qr', coEl).classList.add('is-paid'); await sleep(700);
    } else {
      label.textContent = method === 'cod' ? 'Placing order…' : 'Verifying…'; await sleep(1300);
    }
    placeOrder();
    btn.disabled = false; paying = false;
  });

  function placeOrder() {
    var t = totals(), id = 'KG-' + (48000 + ((Math.random() * 1999) | 0));
    var names = { crypto: coin, bkash: 'bKash', nagad: 'Nagad', card: 'Card', cod: 'COD' };
    var order = { id: id, name: customer.name, items: cart.map(function (l) { return l.qty + '× ' + byId[l.id].name; }).join(', '), qty: t.count, pay: names[method], total: t.total, status: method === 'cod' ? 'cod' : 'paid', time: Date.now() };
    cart.forEach(function (l) { byId[l.id].stock = Math.max(0, byId[l.id].stock - l.qty); });
    orders.unshift(order);
    cart = []; promo = null; $('.promo input').value = '';
    save(); renderCart(); render(); renderAdmin(true);
    feed('bag', '#ffc24b', 'New order ' + id + ' — ' + money2(order.total), order.pay + (order.status === 'paid' ? ' · auto-confirmed' : ' · confirm call scheduled'));
    feed('send', '#2f9bff', 'Telegram alert sent to @kage_orders', id);
    $('.done-id', coEl).innerHTML = 'Order <b>' + id + '</b> · ' + esc(order.items) + '<br>Total ' + money2(order.total) + ' · ' + order.pay;
    coStep(2);
    confetti();
  }
  function confetti() {
    var b = $('.done-burst', coEl), cols = ['#ff2e4d', '#27e1d6', '#ffc24b', '#8b6cff', '#a4ff6b', '#ff5fb6'], h = '';
    for (var i = 0; i < 44; i++) {
      var a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 170;
      h += '<i style="background:' + cols[i % cols.length] + ';--x:' + (Math.cos(a) * d).toFixed(0) + 'px;--y:' + (Math.sin(a) * d * .8 + 40).toFixed(0) + 'px;--r:' + ((Math.random() * 720) | 0) + 'deg;animation-delay:' + (Math.random() * .15).toFixed(2) + 's"></i>';
    }
    b.innerHTML = h;
  }
  $('.see-admin', coEl).addEventListener('click', function () { co.close(); setMode('admin'); });

  /* ------------------------------------------------------------------
     AI shopping assistant
     ------------------------------------------------------------------ */
  var ai = $('.ai-shop'), aiBox = $('.ai-box', ai), aiMsgs = $('.ai-msgs', ai), aiQ = Promise.resolve(), greeted = false;
  function aiAdd(html, who) {
    var m = document.createElement('div');
    m.className = 'ai-m ' + who;
    m.innerHTML = html;
    aiMsgs.appendChild(m); aiMsgs.scrollTop = aiMsgs.scrollHeight;
  }
  function aiSay(html, picks) {
    aiQ = aiQ.then(function () {
      var t = document.createElement('div');
      t.className = 'ai-typing'; t.innerHTML = '<i></i><i></i><i></i>';
      aiMsgs.appendChild(t); aiMsgs.scrollTop = aiMsgs.scrollHeight;
      return new Promise(function (r) { setTimeout(r, XR.reduce ? 0 : 750); }).then(function () {
        t.remove();
        if (picks && picks.length) html += '<div class="ai-picks">' + picks.map(function (p) {
          return '<div class="ai-pick"><span class="ci-art" style="--c:' + p.colors[0][1] + '">' + artSVG(p) + '</span><div><b>' + esc(p.name) + '</b><small>' + money(p.price) + ' · ' + p.rating.toFixed(1) + '</small></div><button type="button" data-ai-add="' + p.id + '">Add</button></div>';
        }).join('') + '</div>';
        aiAdd(html, 'bot');
      });
    });
  }
  function think(text) {
    var t = text.toLowerCase(), list = P.slice(), note = [];
    if (/^(hi|hello|hey|salam|yo)\b/.test(t)) return aiSay('Hey! Tell me who it’s for, a budget, or a vibe — I’ll find the perfect pick.');
    if (/cart|basket/.test(t) && !/add/.test(t)) {
      var tt = totals();
      return aiSay(cart.length ? 'You have <b>' + tt.count + '</b> item(s) — total <b>' + money2(tt.total) + '</b>. ' + (tt.sub - tt.disc < 100 ? 'Add ' + money2(100 - (tt.sub - tt.disc)) + ' more for free delivery.' : 'Free delivery is unlocked.') : 'Your cart is empty. Want some suggestions?');
    }
    if (/discount|coupon|promo|code|offer|deal/.test(t)) return aiSay('Use <b>XIRAIYA10</b> for 10% off, or <b>AUTOPILOT</b> for free delivery. I can’t stack them — XIRAIYA10 usually saves more.');
    if (/ship|deliver/.test(t)) return aiSay('Dhaka: 1–2 days. Rest of Bangladesh: 2–4 days. Worldwide: 7–14 days. Free over $100.');
    if (/pay|crypto|bkash|nagad|usdt|card/.test(t)) return aiSay('You can pay with USDT, BTC, ETH, bKash, Nagad, card or cash on delivery. Crypto confirms automatically in about a minute.');
    var addM = t.match(/add (?:the |a |an )?(.+?)(?: to (?:my )?cart)?$/);
    if (addM) {
      var hit = P.find(function (p) { return (p.name + ' ' + p.tags).toLowerCase().indexOf(addM[1].trim().split(' ')[0]) >= 0; });
      if (hit) { addToCart(hit.id, hit.colors[0][0], hit.sizes ? 'M' : null, 1); return aiSay('Done — <b>' + esc(hit.name) + '</b> is in your cart.'); }
    }
    var cap = t.match(/(?:under|below|less than|max|cheaper than|within)\s*\$?\s*(\d+)/) || t.match(/\$\s*(\d+)/);
    if (cap) { list = list.filter(function (p) { return p.price <= +cap[1]; }); note.push('under $' + cap[1]); }
    var cats = { Tech: /tech|gadget|electronic/, Apparel: /cloth|wear|hoodie|jacket|apparel|fashion/, Decor: /decor|room|home|desk/, Collectibles: /collect|figure|toy|plush/ };
    Object.keys(cats).forEach(function (c) { if (cats[c].test(t)) { list = list.filter(function (p) { return p.cat === c; }); note.push(c.toLowerCase()); } });
    var words = t.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 3 && ['under', 'below', 'something', 'show', 'want', 'need', 'find', 'with', 'that', 'best', 'cheap', 'cheapest', 'rated', 'good', 'nice', 'more', 'please', 'budget', 'than'].indexOf(w) < 0; });
    var tagged = list.filter(function (p) { var hay = (p.name + ' ' + p.tags).toLowerCase(); return words.some(function (w) { return hay.indexOf(w.replace(/s$/, '')) >= 0; }); });
    if (tagged.length) { list = tagged; note.push('matching “' + words.join(' ') + '”'); }
    if (/best|top|rated|popular/.test(t)) list.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
    else if (/cheap|budget|lowest/.test(t)) list.sort(function (a, b) { return a.price - b.price; });
    else list.sort(function (a, b) { return b.reviews - a.reviews; });
    if (!list.length) return aiSay('Nothing matches that exactly. Here are our best-sellers instead:', P.slice().sort(function (a, b) { return b.reviews - a.reviews; }).slice(0, 3));
    aiSay((note.length ? 'Found ' + list.length + ' option(s) ' + note.join(', ') + '. ' : 'Here are my top picks. ') + 'My favourites:', list.slice(0, 3));
  }
  var SUGG = ['Gift under $50', 'Best rated', 'Something for gaming', 'Headphones', 'What’s in my cart?', 'Any discount?'];
  $('.ai-sugg', ai).innerHTML = SUGG.map(function (s) { return '<button type="button">' + esc(s) + '</button>'; }).join('');
  $('.ai-sugg', ai).addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { aiAdd(esc(b.textContent), 'me'); think(b.textContent); } });
  $('.ai-input', ai).addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('input', e.currentTarget), v = inp.value.trim(); if (!v) return;
    inp.value = ''; aiAdd(esc(v), 'me'); think(v);
  });
  aiMsgs.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ai-add]'); if (!b) return;
    var p = byId[b.getAttribute('data-ai-add')];
    addToCart(p.id, p.colors[0][0], p.sizes ? 'M' : null, 1);
    b.textContent = 'Added'; b.disabled = true;
    feed('sparkle', '#8b6cff', 'AI assistant added ' + p.name + ' to a cart', 'assisted sale');
  });
  function aiOpen(v) {
    aiBox.hidden = !v;
    $('.ai-launch', ai).setAttribute('aria-expanded', v);
    if (v && !greeted) { greeted = true; aiSay('Hi, I’m <b>Kage AI</b>. I know every product, price and stock level. What are you looking for today?'); }
    if (v && XR.fine) setTimeout(function () { $('.ai-input input', ai).focus({ preventScroll: true }); }, 200);
  }
  $('.ai-launch', ai).addEventListener('click', function () { aiOpen(aiBox.hidden); });
  $('.ai-x', ai).addEventListener('click', function () { aiOpen(false); });

  /* ------------------------------------------------------------------
     Admin / autopilot
     ------------------------------------------------------------------ */
  var AUTOS = [
    ['bot', '#27e1d6', 'AI shopping assistant', 'Answered 312 chats · 94% resolved'],
    ['box', '#ffc24b', 'Auto-restock', 'PO-2293 drafted for Oni LED Mask'],
    ['refresh', '#8b6cff', 'Abandoned-cart recovery', 'Recovered $412 this week via Telegram'],
    ['btc', '#a4ff6b', 'Crypto auto-confirm', 'Avg. 58s from payment to fulfilment'],
    ['send', '#2f9bff', 'Telegram order alerts', 'Posting to @kage_orders'],
    ['star', '#ff5fb6', 'AI review replies', 'Replied to 18 reviews in EN / BN']
  ];
  var autoOn = AUTOS.map(function () { return true; });
  var SEED_ORDERS = [
    { id: 'KG-47981', name: 'Nadia R.', items: '1× Ronin ANC Headphones', pay: 'USDT', total: 129, status: 'ship' },
    { id: 'KG-47977', name: 'Tanvir H.', items: '2× Sakura Desk Mat XL', pay: 'bKash', total: 58, status: 'pack' },
    { id: 'KG-47970', name: 'Emma W.', items: '1× Kaze Smartwatch', pay: 'Card', total: 149, status: 'ship' },
    { id: 'KG-47962', name: 'Arif S.', items: '1× Kitsune Hoodie, 1× Spirit Fox Plush', pay: 'COD', total: 88, status: 'cod' }
  ];
  var ST = { paid: 'Paid', pack: 'Packing', ship: 'Shipped', cod: 'COD · confirmed' };
  var adminReady = false;
  function renderAdmin(flash) {
    var mine = orders.slice(0, 8);
    var rev = 2480 + mine.reduce(function (s, o) { return s + o.total; }, 0);
    $('.k-rev').textContent = '$' + Math.round(rev).toLocaleString('en-US');
    $('.k-orders').textContent = 37 + mine.length;
    $('.orders-body').innerHTML = mine.concat(SEED_ORDERS).slice(0, 10).map(function (o, i) {
      return '<tr' + (flash && i === 0 && mine.length ? ' class="is-new"' : '') + '><td>' + esc(o.id) + '</td><td>' + esc(o.name) + '</td><td>' + esc(o.items) + '</td><td>' + esc(o.pay) + '</td><td>' + money2(o.total) + '</td><td><span class="st ' + o.status + '">' + ST[o.status] + '</span></td></tr>';
    }).join('');
    $('.inv').innerHTML = P.slice().sort(function (a, b) { return a.stock - b.stock; }).slice(0, 7).map(function (p) {
      return '<li class="' + (p.stock <= 6 ? 'low' : '') + '"><div><b>' + esc(p.name) + '</b><em>' + p.stock + ' left' + (p.stock <= 6 ? ' · restock queued' : '') + '</em></div><div class="inv-bar"><i style="width:' + Math.min(100, p.stock / 40 * 100) + '%"></i></div></li>';
    }).join('');
    if (!adminReady) {
      adminReady = true;
      $('.autos').innerHTML = AUTOS.map(function (a, i) {
        return '<li><label class="auto" style="--c:' + a[1] + '"><span>' + I(a[0]) + '</span><span><b>' + a[2] + '</b><small>' + a[3] + '</small></span><input type="checkbox" class="sr-only" checked data-auto="' + i + '"><span class="switch" aria-hidden="true"></span></label></li>';
      }).join('');
      drawChart();
    }
  }
  $('.autos').addEventListener('change', function (e) {
    var i = +e.target.getAttribute('data-auto');
    autoOn[i] = e.target.checked;
    e.target.closest('.auto').classList.toggle('off', !e.target.checked);
    var n = autoOn.filter(Boolean).length;
    $('.auto-state').textContent = n + ' running';
    feed(AUTOS[i][0], AUTOS[i][1], AUTOS[i][2] + (e.target.checked ? ' resumed' : ' paused'), 'by admin');
  });
  function drawChart() {
    var svg = $('.chart'), r = XR.seeded('kage-rev'), pts = [], W = 600, H = 220, n = 14, max = 0, i;
    for (i = 0; i < n; i++) { var v = 900 + r() * 1200 + i * 90; pts.push(v); max = Math.max(max, v); }
    max *= 1.15;
    var xy = pts.map(function (v, i) { return [(i / (n - 1)) * W, H - (v / max) * H]; });
    var d = xy.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var g = '';
    for (i = 1; i < 4; i++) g += '<line class="grid-l" x1="0" x2="' + W + '" y1="' + (H * i / 4) + '" y2="' + (H * i / 4) + '"/>';
    svg.innerHTML = '<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2e4d" stop-opacity=".35"/><stop offset="1" stop-color="#ff2e4d" stop-opacity="0"/></linearGradient></defs>' + g +
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
  var AMBIENT = [
    [0, 'AI assistant answered “do you ship to Sylhet?”', 'chat · 1.2s'],
    [2, 'Recovered abandoned cart — $64', 'Telegram reminder'],
    [5, '5-star review replied in Bangla', 'Spirit Fox Plush'],
    [1, 'Stock low: Oni LED Mask (3)', 'restock PO drafted'],
    [3, 'USDT payment auto-confirmed', 'KG-47988 · 58s'],
    [4, 'Order alert posted', '@kage_orders']
  ];
  var ai_i = 0;
  setInterval(function () {
    if (document.hidden || $('.admin').hidden) return;
    var a = AMBIENT[ai_i++ % AMBIENT.length];
    if (!autoOn[a[0]]) return;
    feed(AUTOS[a[0]][0], AUTOS[a[0]][1], a[1], a[2]);
  }, 3400);

  /* ------------------------------------------------------------------
     Mode switch
     ------------------------------------------------------------------ */
  function setMode(m) {
    $$('.shop-mode button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-mode') === m); });
    $('.store').hidden = m !== 'store';
    $('.admin').hidden = m !== 'admin';
    if (m === 'admin') { renderAdmin(true); if (!feedEl.children.length) { feed('bot', '#27e1d6', 'Autopilot online — 6 agents running', 'system'); feed('btc', '#a4ff6b', 'Crypto watcher connected', 'TRC20 · BEP20 · BTC · ETH'); } }
    var top = $('.shop-mode').getBoundingClientRect().top + scrollY - 120;
    if (scrollY > top) window.scrollTo({ top: top, behavior: XR.reduce ? 'auto' : 'smooth' });
  }
  $$('.shop-mode button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });

  render();
  renderCart();
})();
