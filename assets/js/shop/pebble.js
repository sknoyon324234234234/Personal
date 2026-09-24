/* =====================================================================
   XIRAIYA — Shop layout: Little Pebble (baby clothes, Dhaka)
   Soft playful baby boutique: bubbly shapes, wavy dividers, drifting
   pastel blobs. Signature pieces: a size-by-age finder, a three-piece
   gift box builder and personalised wooden name letters.
   ===================================================================== */
(function () {
  'use strict';
  if (!window.XRShop) return;

  var TONES = ['mint', 'lilac', 'butter', 'sky', 'blush'];
  var MILESTONES = [
    [0, 'Newborn', 'Mostly sleeping and milk'],
    [3, 'Smiling', 'Holding their head up'],
    [5, 'Rolling over', 'Wriggling out of everything'],
    [7, 'Sitting up', 'Grabbing whatever is near'],
    [9, 'Crawling', 'Knees need soft fabric'],
    [12, 'First steps', 'Time for soft-soled shoes'],
    [16, 'Toddling', 'Poppers beat buttons'],
    [20, 'Climbing', 'Nothing on a shelf is safe'],
    [24, 'Chatting', 'Has opinions about outfits']
  ];
  var cleanup = [];

  /* ---------- size helpers ---------- */
  function span(s) {
    var m = String(s).match(/(\d+)\s*[–-]\s*(\d+)\s*([my])/);
    if (!m) return null;
    var k = m[3] === 'y' ? 12 : 1;
    return [+m[1] * k, +m[2] * k];
  }
  function sizeFor(p, age) {
    if (!p.sizes) return null;
    for (var i = 0; i < p.sizes.length; i++) {
      var r = span(p.sizes[i]);
      if (r && r[0] <= age && (age < r[1] || (age === 24 && r[1] === 24))) return p.sizes[i];
    }
    return null;
  }
  function nearestSize(p, age) {
    var best = p.sizes[0], d = 1e9;
    p.sizes.forEach(function (s) {
      var r = span(s); if (!r) return;
      var x = age < r[0] ? r[0] - age : age >= r[1] ? age - r[1] + 1 : 0;
      if (x < d) { d = x; best = s; }
    });
    return best;
  }
  function fits(p, age) { return !p.sizes || !!sizeFor(p, age); }
  function ageLabel(a) {
    if (a === 0) return 'Newborn';
    if (a === 12) return '1 year';
    if (a === 24) return '2 years';
    return a + (a === 1 ? ' month' : ' months');
  }
  function milestone(a) {
    var m = MILESTONES[0];
    MILESTONES.forEach(function (x) { if (a >= x[0]) m = x; });
    return m;
  }

  /* ---------- decorative bits ---------- */
  function logoMark() {
    return '<svg class="pb-mark" viewBox="0 0 44 44" aria-hidden="true">' +
      '<ellipse cx="22" cy="34" rx="16" ry="8" fill="#bfe0cf"/>' +
      '<ellipse cx="21" cy="23" rx="11.5" ry="7" fill="#d9ccf0"/>' +
      '<ellipse cx="23" cy="13" rx="7.5" ry="5" fill="var(--s-accent)"/></svg>';
  }
  function wave(cls, fill) {
    return '<div class="pb-wave ' + (cls || '') + '" aria-hidden="true"><svg viewBox="0 0 2880 90" preserveAspectRatio="none"><path fill="' + fill + '" d="M0 46 C 240 92 480 0 720 46 S 1200 92 1440 46 S 1920 0 2160 46 S 2640 92 2880 46 V 90 H 0 Z"/></svg></div>';
  }
  function squiggle() {
    return '<svg class="pb-squig" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M3 12 Q 18 2 33 12 T 63 12 T 93 12 T 123 12 T 153 12 T 183 12 T 198 10" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>';
  }
  function blobs(n) {
    var h = '';
    for (var i = 0; i < n; i++) h += '<i class="pb-blob b' + i + '"></i>';
    return '<div class="pb-blobs" aria-hidden="true">' + h + '</div>';
  }

  XRShop.register('pebble', {
    build: function (api) {
      var S = api.S, P = api.P, esc = api.esc, I = api.I, money = api.money, h = S.hero, look = S.look;
      var age = api.store('age'); age = typeof age === 'number' ? age : 3;
      var revs = P.reduce(function (s, p) { return s + p.reviews; }, 0);
      var avg = P.reduce(function (s, p) { return s + p.rating * p.reviews; }, 0) / revs;
      var romper = api.byId.romper || P[0], shoes = api.byId.shoes || P[1], letters = api.byId.letters;

      /* ticker */
      var tick = S.promo.concat(['Hand-knitted in Dhaka', 'Gift wrap with a card, free']).map(function (t, i) {
        return '<span><i class="t-' + TONES[i % 5] + '"></i>' + esc(t) + '</span>';
      }).join('');
      var html = '<div class="pb">' +
        '<div class="pb-ticker" aria-label="Store offers"><div class="pb-ticker-track">' + tick + tick + '</div></div>' +

        /* ---------- nav ---------- */
        '<header class="pb-nav"><div class="pb-nav-in">' +
          '<a class="pb-logo" href="#pbShop" data-jump aria-label="' + esc(S.name) + ', go to the shop">' + logoMark() + '<span>little <b>pebble</b></span></a>' +
          '<nav class="pb-links" aria-label="Little Pebble sections">' +
            '<a href="#pbFinder" data-jump>Size finder</a><a href="#pbShop" data-jump>Shop</a><a href="#pbGift" data-jump>Gift box</a><a href="#pbName" data-jump>Name letters</a></nav>' +
          '<div class="pb-acts">' + api.searchBox('Search tiny things', 'pb-search') + api.wishButton('pb-ic') + api.cartButton('pb-ic pb-bag', 'Bag') + '</div>' +
        '</div></header>' +

        /* ---------- hero ---------- */
        '<section class="pb-hero">' + blobs(5) +
          '<div class="pb-hero-copy">' +
            '<span class="pb-eyebrow" data-reveal><i class="pb-dot"></i>' + esc(h.eyebrow) + '</span>' +
            '<h2 class="pb-title" data-reveal style="--d:.08s"><span class="pb-tiny">Tiny' + squiggle() + '</span> clothes, <span class="pb-soft">grown-up</span> quality.</h2>' +
            '<p class="pb-sub" data-reveal style="--d:.16s">' + esc(h.sub) + '</p>' +
            '<div class="pb-cta" data-reveal style="--d:.24s">' +
              '<button type="button" class="pb-btn" data-newborn>' + esc(h.cta) + '<span class="pb-btn-ic">' + I('arrow-right') + '</span></button>' +
              '<a class="pb-btn pb-btn-soft" href="#pbGift" data-jump>' + I('gift') + 'Build a gift box</a></div>' +
            '<div class="pb-proof" data-reveal style="--d:.32s">' +
              '<span class="pb-faces" aria-hidden="true"><i class="t-mint">F</i><i class="t-lilac">T</i><i class="t-butter">N</i></span>' +
              '<span><b>' + avg.toFixed(1) + ' out of 5</b> from ' + revs.toLocaleString('en-US') + ' parents</span></div>' +
          '</div>' +
          '<div class="pb-hero-art" data-reveal="scale">' +
            '<div class="pb-hero-blob" data-pb-speed="-0.05">' + api.img(api.photo(h.img), 'Two parents holding a tiny pair of baby shoes between them', '', true) + '</div>' +
            '<svg class="pb-ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="pbRingPath" d="M100 100 m -74 0 a 74 74 0 1 1 148 0 a 74 74 0 1 1 -148 0"/></defs><text><textPath href="#pbRingPath">organic cotton · washed three times · soft seams outside · </textPath></text></svg>' +
            '<button type="button" class="pb-float f1" data-view="' + romper.id + '" data-pb-speed="0.08" aria-label="View ' + esc(romper.name) + '">' + api.pic(romper) + '<span>' + esc(romper.name.split(' ').slice(0, 2).join(' ')) + '<b>' + money(romper.price) + '</b></span></button>' +
            '<button type="button" class="pb-float f2" data-view="' + shoes.id + '" data-pb-speed="0.12" aria-label="View ' + esc(shoes.name) + '">' + api.pic(shoes) + '</button>' +
            '<span class="pb-sticker s1"><b>' + esc(h.note[0]) + '</b>' + esc(h.note[1]) + '</span>' +
            '<span class="pb-sticker s2">' + I('heart') + 'GOTS organic</span>' +
          '</div>' +
        '</section>' +
        wave('w-mint', 'var(--pb-mint-bg)') +

        /* ---------- size by age finder ---------- */
        '<section class="pb-finder" id="pbFinder">' +
          '<div class="pb-finder-head" data-reveal><span class="pb-eyebrow">' + I('sliders') + 'Size by age</span>' +
            '<h2 class="pb-h2">How old is your <span class="pb-hl">little one?</span></h2>' +
            '<p>Slide to their age. We light up everything that fits today, and remember the size so the plus button adds it in one tap.</p></div>' +
          '<div class="pb-finder-card" data-reveal="scale">' +
            '<div class="pb-readout" aria-live="polite">' +
              '<div class="pb-age-bubble"><b class="pb-age-n">' + age + '</b><small class="pb-age-u">months</small></div>' +
              '<div class="pb-age-txt"><b class="pb-age-l">' + ageLabel(age) + '</b><span class="pb-age-m"></span></div>' +
              '<div class="pb-age-fit"><b class="pb-fit-n">0</b><span>pieces fit</span></div>' +
            '</div>' +
            '<div class="pb-slider"><label class="sr-only" for="pbAge">Baby’s age in months</label>' +
              '<input id="pbAge" class="pb-range" type="range" min="0" max="24" step="1" value="' + age + '" aria-valuetext="' + ageLabel(age) + '">' +
              '<div class="pb-ticks" aria-hidden="true">' + MILESTONES.map(function (m) { return '<span style="--at:' + (m[0] / 24 * 100) + '%"><i></i>' + (m[0] === 0 ? '0' : m[0] < 12 || m[0] % 12 ? m[0] + 'm' : m[0] / 12 + 'y') + '</span>'; }).join('') + '</div>' +
            '</div>' +
            '<div class="pb-finder-foot">' +
              '<div class="pb-fitlist" aria-label="Sizes for this age"></div>' +
              '<label class="pb-switch"><input type="checkbox" class="pb-only"><span class="pb-switch-ui" aria-hidden="true"><i></i></span><span>Only show what fits</span></label>' +
            '</div>' +
          '</div>' +
        '</section>' +
        wave('w-mint flip', 'var(--pb-mint-bg)') +

        /* ---------- shop ---------- */
        '<section class="pb-shop" id="pbShop">' +
          '<div class="pb-shop-head"><div data-reveal><span class="pb-eyebrow">' + I('bag') + 'The pebble shop</span><h2 class="pb-h2">Soft things for <span class="pb-hl">small people</span></h2></div>' +
            '<div class="pb-tools" data-reveal style="--d:.1s">' + api.sortHTML() + api.rangeHTML() + '</div></div>' +
          '<div class="pb-cats" role="radiogroup" aria-label="Category">' + S.cats.map(function (c, i) {
            var n = c === 'All' ? P.length : P.filter(function (p) { return p.cat === c; }).length;
            return '<button type="button" role="radio" aria-checked="' + (c === 'All') + '" data-pbcat="' + esc(c) + '" class="t-' + TONES[i % 5] + '">' + esc(c) + '<small>' + n + '</small></button>';
          }).join('') + '</div>' +
          '<div class="pb-fitnote" hidden><span></span><button type="button" class="pb-fitoff">Show everything</button></div>' +
          api.gridHTML('pb-grid') +
        '</section>' +
        wave('w-blush', 'var(--pb-blush-bg)') +

        /* ---------- gift box builder ---------- */
        '<section class="pb-gift" id="pbGift">' + blobs(3) +
          '<div class="pb-gift-head" data-reveal><span class="pb-eyebrow">' + I('gift') + 'Gift box builder</span>' +
            '<h2 class="pb-h2">Pick any three, <span class="pb-hl">we wrap them</span></h2>' +
            '<p>Three little things in a ribbon box with a card in Bangla or English. Bundles are <b>10% off</b>, and sized pieces come in the size from your finder.</p></div>' +
          '<div class="pb-gift-grid">' +
            '<div class="pb-picks" role="group" aria-label="Choose three items for the gift box">' + P.map(function (p, i) {
              return '<button type="button" class="pb-pick t-' + TONES[i % 5] + '" data-pick="' + p.id + '" aria-pressed="false"><span class="pb-pick-img">' + api.pic(p) + '<i class="pb-pick-n" aria-hidden="true"></i></span><span class="pb-pick-t"><b>' + esc(p.name) + '</b><small>' + money(p.price) + (p.sizes ? ' · sized' : '') + '</small></span></button>';
            }).join('') + '</div>' +
            '<div class="pb-boxcol">' +
              '<div class="pb-box" aria-hidden="true">' +
                '<div class="pb-lid"><span class="pb-bow"><i></i><i></i><b></b></span></div>' +
                '<div class="pb-items"><span class="pb-slot" data-slot="0"><em>1</em></span><span class="pb-slot" data-slot="1"><em>2</em></span><span class="pb-slot" data-slot="2"><em>3</em></span></div>' +
                '<div class="pb-body"><span class="pb-ribbon"></span><span class="pb-tag">for you</span></div>' +
                '<span class="pb-spark k1"></span><span class="pb-spark k2"></span><span class="pb-spark k3"></span>' +
              '</div>' +
              '<div class="pb-bill">' +
                '<ul class="pb-bill-lines"></ul>' +
                '<div class="pb-bill-sum"><div><small>Bundle price</small><b class="pb-bill-tot">' + money(0) + '</b><s class="pb-bill-was"></s></div><span class="pb-save">Pick 3 to save 10%</span></div>' +
                '<div class="pb-bill-acts"><button type="button" class="pb-btn pb-bundle-add" disabled>' + I('gift') + '<span>Add bundle to bag</span></button><button type="button" class="pb-link pb-bundle-clear">Empty the box</button></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>' +
        wave('w-blush flip', 'var(--pb-blush-bg)') +

        /* ---------- name letters ---------- */
        (letters ? '<section class="pb-name" id="pbName">' +
          '<div class="pb-name-copy" data-reveal><span class="pb-eyebrow">' + I('pen') + 'Personalised</span>' +
            '<h2 class="pb-h2">Spell their name <span class="pb-hl">in wood</span></h2>' +
            '<p>' + esc(letters.desc) + '</p>' +
            '<form class="pb-name-form" autocomplete="off"><label for="pbNameIn">Baby’s name</label>' +
              '<div class="pb-name-row"><input id="pbNameIn" type="text" maxlength="9" placeholder="e.g. Ayaan" spellcheck="false" aria-describedby="pbNameHint"><button type="submit" class="pb-btn pb-name-add" disabled>' + I('plus') + '<span>Add letters</span></button></div>' +
              '<small id="pbNameHint" class="pb-name-hint">Letters A to Z, up to 9. ' + money(letters.price) + ' per letter.</small>' +
            '</form>' +
            '<div class="pb-name-ideas" aria-label="Name ideas">' + ['Ayaan', 'Inaya', 'Zara', 'Rehan', 'Maya'].map(function (n) { return '<button type="button" data-nm="' + n + '">' + n + '</button>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="pb-shelf-wrap" data-reveal="scale">' +
            '<div class="pb-shelf-photo">' + api.img(api.photo('letters'), 'Bronze wooden letters spelling a name on a white nursery shelf') + '</div>' +
            '<div class="pb-shelf"><div class="pb-letters" aria-live="polite" aria-label="Letter preview"></div><div class="pb-plank"></div><p class="pb-shelf-sum"></p></div>' +
          '</div>' +
        '</section>' : '') +

        /* ---------- nursery look ---------- */
        '<section class="pb-look">' +
          '<div class="pb-look-media" data-reveal="scale">' + api.img(api.photo(look.img), 'A white teddy bear behind wooden letters on a nursery desk') +
            look.pids.map(function (id, i) { var p = api.byId[id]; if (!p) return ''; return '<button type="button" class="pb-hot h' + i + '" data-view="' + p.id + '" aria-label="View ' + esc(p.name) + '"><i></i><span>' + esc(p.name) + '<b>' + money(p.price) + '</b></span></button>'; }).join('') +
          '</div>' +
          '<div class="pb-look-copy" data-reveal><span class="pb-eyebrow">' + I('home') + esc(look.eyebrow) + '</span><h2 class="pb-h2">' + esc(look.title) + '</h2><p>' + esc(look.text) + '</p>' +
            '<div class="pb-look-pills">' + look.pids.map(function (id) { var p = api.byId[id]; return p ? '<button type="button" data-view="' + p.id + '"><span>' + api.pic(p) + '</span>' + esc(p.name) + '</button>' : ''; }).join('') + '</div></div>' +
        '</section>' +

        /* ---------- reviews ---------- */
        '<section class="pb-reviews"><div class="pb-rv-head" data-reveal><span class="pb-eyebrow">' + I('chat') + 'Notes from parents</span><h2 class="pb-h2">Washed forty times, <span class="pb-hl">still loved</span></h2></div>' +
          '<div class="pb-rv-row">' + S.reviews.map(function (r, i) {
            return '<figure class="pb-rv t-' + ['sky', 'butter', 'lilac'][i % 3] + '" data-reveal style="--d:' + (i * .1) + 's"><span class="pb-rv-stars" aria-label="5 out of 5 stars">' + I('star-fill') + I('star-fill') + I('star-fill') + I('star-fill') + I('star-fill') + '</span><blockquote>' + esc(r[0]) + '</blockquote><figcaption><span class="pb-rv-ava" aria-hidden="true">' + esc(r[1].charAt(0)) + '</span><b>' + esc(r[1]) + '</b>' + esc(r[2]) + '</figcaption></figure>';
          }).join('') + '</div>' +
        '</section>' +

        /* ---------- promises ---------- */
        '<section class="pb-promises" aria-label="Our promises">' + S.policies.map(function (x, i) {
          return '<div class="pb-promise t-' + ['mint', 'blush', 'lilac'][i % 3] + '" data-reveal style="--d:' + (i * .08) + 's"><span class="pb-promise-ic">' + I(x[0]) + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></div>';
        }).join('') + '</section>' +
        wave('w-ink', 'var(--pb-foot)') +

        /* ---------- footer ---------- */
        '<footer class="pb-foot">' +
          '<div class="pb-news-card">' +
            '<div><span class="pb-eyebrow">' + I('mail') + 'The pebble post</span><h2 class="pb-h2">One kind email a month</h2><p>New knits, size-swap reminders when they are due, and nothing else.</p></div>' +
            api.newsHTML('Join and get a free gift card with your first order') +
          '</div>' +
          '<div class="pb-foot-cols">' +
            '<div class="pb-foot-brand"><span class="pb-logo">' + logoMark() + '<span>little <b>pebble</b></span></span><p>' + esc(S.tagline) + '</p></div>' +
            '<div><b>Shop</b>' + S.cats.slice(1).map(function (c) { return '<button type="button" data-pbcatgo="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
            '<div><b>Helpers</b><a href="#pbFinder" data-jump>Size by age</a><a href="#pbGift" data-jump>Gift box builder</a><a href="#pbName" data-jump>Name letters</a></div>' +
            '<div><b>Say hello</b><span>' + esc(S.eta) + '</span><span>' + esc(S.city) + '</span><span>@' + esc(S.handle) + '</span></div>' +
          '</div>' +
          api.creditHTML() +
        '</footer>' +
      '</div>';
      return html;
    },

    card: function (p, i, api) {
      var esc = api.esc, I = api.I, money = api.money;
      var age = api.__pbAge != null ? api.__pbAge : 3;
      var size = sizeFor(p, age), w = api.isWished(p.id), tone = TONES[api.P.indexOf(p) % 5];
      var tag = p.badge === 'best' ? 'Bestseller' : p.badge === 'new' ? 'New' : p.badge === 'pick' ? 'Staff pick' : p.stock <= 8 ? 'Only ' + p.stock + ' left' : '';
      var chips = p.sizes ? p.sizes.map(function (s) { return '<i' + (s === size ? ' class="on"' : '') + '>' + esc(s) + '</i>'; }).join('') : '<i class="one">One size</i>';
      var fit = p.sizes ? (size ? '<span class="pb-fitb">' + I('check') + 'Fits ' + esc(size) + '</span>' : '<span class="pb-fitb no">Not in ' + esc(ageLabel(age).toLowerCase()) + '</span>') : '';
      var add = p.sizes && size
        ? '<button type="button" class="pb-add" data-add="' + p.id + '" data-size="' + esc(size) + '" aria-label="Add ' + esc(p.name) + ', size ' + esc(size) + ', to bag">' + I('plus') + '<span>Add ' + esc(size) + '</span></button>'
        : p.sizes
          ? '<button type="button" class="pb-add" data-add="' + p.id + '" aria-label="Choose an age for ' + esc(p.name) + '">' + I('plus') + '<span>Pick age</span></button>'
          : '<button type="button" class="pb-add" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ' to bag">' + I('plus') + '<span>Add</span></button>';
      return '<article class="pb-card t-' + tone + '" role="listitem" style="--d:' + Math.min(i * 60, 420) + 'ms">' +
        '<div class="pb-card-media">' +
          '<button type="button" class="pb-card-open" data-view="' + p.id + '" aria-label="Quick view: ' + esc(p.name) + '">' + api.pic(p) + '</button>' +
          (tag ? '<span class="pb-card-tag">' + esc(tag) + '</span>' : '') +
          '<button type="button" class="pb-heart' + (w ? ' is-on' : '') + '" data-wish="' + p.id + '" aria-pressed="' + w + '" aria-label="' + (w ? 'Remove from' : 'Save to') + ' wishlist: ' + esc(p.name) + '">' + I('heart') + '</button>' +
          fit +
        '</div>' +
        '<div class="pb-card-body">' +
          '<span class="pb-card-cat">' + esc(p.cat) + '<span class="pb-card-rate">' + I('star-fill') + p.rating.toFixed(1) + '</span></span>' +
          '<h3 class="pb-card-name"><button type="button" data-view="' + p.id + '">' + esc(p.name) + '</button></h3>' +
          '<div class="pb-chips" aria-label="' + (p.sizes ? 'Ages: ' + esc(p.sizes.join(', ')) : 'One size') + '">' + chips + '</div>' +
          '<div class="pb-card-foot"><span class="pb-price">' + money(p.price) + (p.was ? '<s>' + money(p.was) + '</s>' : '') + '</span>' + add + '</div>' +
        '</div></article>';
    },

    wire: function (api, root) {
      var $ = function (s, c) { return (c || root).querySelector(s); };
      var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
      var S = api.S, P = api.P, byId = api.byId, esc = api.esc, I = api.I, money = api.money;
      var pb = $('.pb');
      if (!pb) return;

      /* ================= size finder ================= */
      var age = api.store('age'); age = typeof age === 'number' ? age : 3;
      var only = !!api.store('only');
      api.__pbAge = age;
      var range = $('.pb-range'), onlyBox = $('.pb-only'), note = $('.pb-fitnote');
      onlyBox.checked = only;

      function paintFinder() {
        var ms = milestone(age), n = P.filter(function (p) { return fits(p, age); }).length;
        $('.pb-age-n').textContent = age === 0 ? '0' : age;
        $('.pb-age-u').textContent = age === 1 ? 'month' : 'months';
        $('.pb-age-l').textContent = ageLabel(age);
        $('.pb-age-m').textContent = ms[1] + ' · ' + ms[2];
        $('.pb-fit-n').textContent = n;
        range.style.setProperty('--v', (age / 24 * 100) + '%');
        range.setAttribute('aria-valuetext', ageLabel(age) + ', ' + n + ' pieces fit');
        var seen = {};
        $('.pb-fitlist').innerHTML = P.filter(function (p) { return p.sizes; }).map(function (p) {
          var s = sizeFor(p, age); if (!s || seen[p.id]) return '';
          seen[p.id] = 1;
          return '<button type="button" data-view="' + p.id + '" class="pb-fitchip"><span>' + api.pic(p) + '</span>' + esc(p.name.split(' ').slice(-1)[0]) + '<b>' + esc(s) + '</b></button>';
        }).join('') || '<span class="pb-fitnone">Nothing sized fits this age yet. Hats, mittens and letters are one size.</span>';
        note.hidden = !only;
        if (only) $('span', note).innerHTML = 'Showing what fits <b>' + esc(ageLabel(age).toLowerCase()) + '</b>';
      }
      function applyFilter() {
        api.filter = only ? function (p) { return fits(p, age); } : null;
        api.render();
      }
      var bubble = $('.pb-age-bubble');
      range.addEventListener('input', function () {
        var v = +range.value;
        if (v === age) return;
        age = v; api.__pbAge = age; api.store('age', age);
        paintFinder(); applyFilter();
        bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      });
      onlyBox.addEventListener('change', function () {
        only = onlyBox.checked; api.store('only', only);
        paintFinder(); applyFilter();
      });
      $('.pb-fitoff').addEventListener('click', function () { onlyBox.checked = false; only = false; api.store('only', false); paintFinder(); applyFilter(); });
      paintFinder();
      if (only) api.filter = function (p) { return fits(p, age); };

      /* "Shop newborn": set the finder to 0 months, show what fits */
      $('[data-newborn]').addEventListener('click', function () {
        age = 0; api.__pbAge = 0; api.store('age', 0);
        range.value = 0; only = true; onlyBox.checked = true; api.store('only', true);
        paintFinder(); applyFilter();
        api.jump('#pbShop');
      });

      /* ================= category bubbles ================= */
      function setCat(c) {
        $$('[data-pbcat]').forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-pbcat') === c); });
        api.setCat(c);
      }
      $('.pb-cats').addEventListener('click', function (e) { var b = e.target.closest('[data-pbcat]'); if (b) setCat(b.getAttribute('data-pbcat')); });
      $('.pb-cats').addEventListener('keydown', function (e) {
        if (['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return;
        var bs = $$('[data-pbcat]'), i = bs.indexOf(document.activeElement); if (i < 0) return;
        e.preventDefault();
        var n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length]; n.focus(); n.click();
      });
      $$('[data-pbcatgo]').forEach(function (b) { b.addEventListener('click', function () { setCat(b.getAttribute('data-pbcatgo')); api.jump('#pbShop'); }); });
      api.on('clear', function () { $$('[data-pbcat]').forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-pbcat') === 'All'); }); });

      /* ================= quick add with the finder size ================= */
      pb.addEventListener('click', function (e) {
        var a = e.target.closest('.pb-add[data-size]');
        if (!a) return;
        var p = byId[a.getAttribute('data-add')]; if (!p) return;
        e.stopPropagation();
        api.addToCart(p.id, undefined, a.getAttribute('data-size'), 1, { from: a });
        a.classList.remove('did'); void a.offsetWidth; a.classList.add('did');
      });

      /* ================= gift box builder ================= */
      var picks = (api.store('bundle') || []).filter(function (id) { return byId[id]; }).slice(0, 3);
      var box = $('.pb-box'), addB = $('.pb-bundle-add');
      function sizeNote(p) {
        if (!p.sizes) return null;
        return sizeFor(p, age) || nearestSize(p, age);
      }
      function paintBundle(changed) {
        $$('[data-pick]').forEach(function (b) {
          var i = picks.indexOf(b.getAttribute('data-pick'));
          b.setAttribute('aria-pressed', i >= 0);
          $('.pb-pick-n', b).textContent = i >= 0 ? i + 1 : '';
          b.classList.toggle('is-dim', picks.length >= 3 && i < 0);
        });
        $$('.pb-slot').forEach(function (s, i) {
          var id = picks[i], had = s.getAttribute('data-id');
          if (id === had) return;
          s.setAttribute('data-id', id || '');
          s.innerHTML = id ? api.pic(byId[id]) : '<em>' + (i + 1) + '</em>';
          s.classList.toggle('is-full', !!id);
          if (id && changed) { s.classList.remove('drop'); void s.offsetWidth; s.classList.add('drop'); }
        });
        box.classList.toggle('is-open', picks.length > 0);
        box.classList.toggle('is-done', picks.length === 3);
        var sum = picks.reduce(function (s, id) { return s + byId[id].price; }, 0), full = picks.length === 3;
        var save = Math.round(sum * .1);
        $('.pb-bill-lines').innerHTML = picks.length ? picks.map(function (id) {
          var p = byId[id], sz = sizeNote(p);
          return '<li><span class="pb-bl-img">' + api.pic(p) + '</span><span><b>' + esc(p.name) + '</b><small>' + (sz ? 'Age ' + esc(sz) + (sizeFor(p, age) ? ' · from finder' : ' · closest to ' + esc(ageLabel(age).toLowerCase())) : 'One size') + '</small></span><em>' + money(p.price) + '</em><button type="button" data-unpick="' + id + '" aria-label="Take ' + esc(p.name) + ' out of the box">' + I('close') + '</button></li>';
        }).join('') : '<li class="pb-bl-empty">Your box is empty. Tap three things on the left.</li>';
        $('.pb-bill-tot').textContent = money(full ? sum - save : sum);
        $('.pb-bill-was').textContent = full ? money(sum) : '';
        $('.pb-save').innerHTML = full ? I('sparkle') + 'You save ' + money(save) + ' (10%)' : 'Pick ' + (3 - picks.length) + ' more to save 10%';
        $('.pb-save').classList.toggle('on', full);
        addB.disabled = !full;
        $('span', addB).textContent = full ? 'Add bundle to bag · ' + money(sum - save) : 'Add bundle to bag';
        api.store('bundle', picks);
      }
      function wiggle() { box.classList.remove('wiggle'); void box.offsetWidth; box.classList.add('wiggle'); }
      $('.pb-picks').addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick]'); if (!b) return;
        var id = b.getAttribute('data-pick'), i = picks.indexOf(id);
        if (i >= 0) picks.splice(i, 1);
        else if (picks.length >= 3) { wiggle(); api.toast('The box holds three. Take one out first', 'warn'); return; }
        else picks.push(id);
        paintBundle(true);
        if (i < 0) wiggle();
      });
      $('.pb-bill-lines').addEventListener('click', function (e) {
        var b = e.target.closest('[data-unpick]'); if (!b) return;
        picks.splice(picks.indexOf(b.getAttribute('data-unpick')), 1); paintBundle(true);
      });
      $('.pb-bundle-clear').addEventListener('click', function () { picks = []; paintBundle(true); });
      addB.addEventListener('click', function () {
        if (picks.length !== 3) return;
        picks.forEach(function (id, i) {
          var p = byId[id];
          api.addToCart(id, undefined, sizeNote(p), 1, { quiet: true, note: 'Gift box, 10% off', from: i === 0 ? $('.pb-slot') : null });
        });
        box.classList.add('sent');
        api.toast('Gift box added: three pieces, wrapped with a card');
        api.later(function () { box.classList.remove('sent'); picks = []; paintBundle(false); }, 900);
      });
      /* the finder age changes the sizes in the box */
      range.addEventListener('input', function () { paintBundle(false); });
      $('[data-newborn]').addEventListener('click', function () { paintBundle(false); });
      paintBundle(false);

      /* ================= name letters ================= */
      var nameIn = $('#pbNameIn');
      if (nameIn) {
        var lettersP = byId.letters, lettersBox = $('.pb-letters'), nameAdd = $('.pb-name-add'), shown = '';
        var clean = function (v) { return v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 9); };
        var paintName = function () {
          var v = clean(nameIn.value), show = v || 'NAME';
          if (show !== shown) {
            var prev = shown; shown = show;
            lettersBox.innerHTML = show.split('').map(function (ch, i) {
              var fresh = !v ? '' : (prev[i] !== ch ? ' new' : '');
              return '<span class="pb-l' + (v ? '' : ' ghost') + fresh + '" style="--i:' + i + ';--r:' + (((i * 37) % 7) - 3) + 'deg">' + ch + '</span>';
            }).join('');
            lettersBox.style.setProperty('--n', show.length);
          }
          lettersBox.setAttribute('aria-label', v ? 'Preview: ' + v.split('').join(' ') : 'Type a name to preview the letters');
          nameAdd.disabled = !v;
          $('span', nameAdd).textContent = v ? 'Add ' + v.length + ' letter' + (v.length > 1 ? 's' : '') + ' · ' + money(v.length * lettersP.price) : 'Add letters';
          $('.pb-shelf-sum').innerHTML = v ? '<b>' + v.length + '</b> × ' + money(lettersP.price) + ' = <b>' + money(v.length * lettersP.price) + '</b>' : 'Type a name to see it on the shelf';
          api.store('name', nameIn.value);
        };
        nameIn.value = api.store('name') || '';
        nameIn.addEventListener('input', function () {
          var c = nameIn.value.replace(/[^A-Za-z]/g, '');
          if (c !== nameIn.value) nameIn.value = c;
          paintName();
        });
        $('.pb-name-form').addEventListener('submit', function (e) {
          e.preventDefault();
          var v = clean(nameIn.value); if (!v) { nameIn.focus(); return; }
          api.addToCart('letters', null, null, v.length, { note: 'Name: ' + v, from: $('.pb-shelf-photo') });
          lettersBox.classList.remove('hop'); void lettersBox.offsetWidth; lettersBox.classList.add('hop');
        });
        $('.pb-name-ideas').addEventListener('click', function (e) {
          var b = e.target.closest('[data-nm]'); if (!b) return;
          nameIn.value = b.getAttribute('data-nm'); paintName(); nameIn.focus();
        });
        paintName();
      }

      /* ================= motion: scroll-linked + pointer ================= */
      if (!api.reduce) {
        var par = $$('[data-pb-speed]'), ticking = false;
        var onScroll = function () {
          if (ticking) return; ticking = true;
          requestAnimationFrame(function () {
            ticking = false;
            var vh = innerHeight;
            par.forEach(function (el) {
              var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
              el.style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * +el.getAttribute('data-pb-speed')).toFixed(1) + 'px');
            });
            var pr = pb.getBoundingClientRect();
            pb.style.setProperty('--wx', (-(pr.top) * .25 % 1440).toFixed(1) + 'px');
          });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        cleanup.push(function () { window.removeEventListener('scroll', onScroll); });
        onScroll();
        if (api.fine) {
          var hero = $('.pb-hero');
          hero.addEventListener('pointermove', function (e) {
            var r = hero.getBoundingClientRect();
            hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
            hero.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
          });
          hero.addEventListener('pointerleave', function () { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
        }
      }

      /* quick view: pre-select the size the finder picked */
      api.on('view', function (p) {
        var s = sizeFor(p, age); if (!s) return;
        var b = document.querySelector('#pmodal .opt-size[data-size="' + s + '"]');
        if (b) b.click();
      });

      /* bag button hops when something is added */
      api.on('cart', function () {
        $$('.pb-bag').forEach(function (b) { b.classList.remove('hop'); void b.offsetWidth; b.classList.add('hop'); });
      });
    },

    destroy: function () {
      cleanup.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
      cleanup = [];
    }
  });
})();
