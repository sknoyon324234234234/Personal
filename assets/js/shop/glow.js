/* =====================================================================
   XIRAIYA — Shop layout: Glow Theory (glassmorphism beauty lab)
   Frosted glass over rose light. Signature features:
     1. Shade lab: undertone x depth swatch grid -> lipstick / blush /
        skin tint matches, opened in quick view or added to the bag.
     2. Virtual swatch: hovering or tapping a shade tints the palette
        pans in the look photo (mix-blend-mode), with a before/after wipe.
     3. Build-a-routine: Skin, Face, Eyes & lips, Brushes stepper with a
        running total and "Add routine to bag".
   ===================================================================== */
(function () {
  'use strict';
  if (!window.XRShop) return;

  /* periodic-table style tiles on the product cards */
  var EL = {
    serum: ['Vc', '15%'], lipstick: ['Lp', '4 g'], palette: ['Es', '×12'], blush: ['Bl', '6 g'], base: ['St', 'SPF 20'],
    trio: ['Tr', '×3'], kabuki: ['Ab', '×1'], brushroll: ['Bc', '×12'], perfume: ['Ep', '50 ml']
  };
  var FORMULA = [
    ['15%', 'ascorbic acid'], ['0.5%', 'ferulic acid'], ['SPF 20', 'in the skin tint'], ['Shea', '+ vitamin E'],
    ['0%', 'talc'], ['0%', 'added fragrance'], ['100%', 'synthetic fibre'], ['18', 'real-skin shades']
  ];
  var TONES = [
    { id: 'cool', name: 'Cool', hint: 'Pink or rosy, silver suits you' },
    { id: 'neutral', name: 'Neutral', hint: 'A mix, gold and silver both work' },
    { id: 'warm', name: 'Warm', hint: 'Golden or peachy, gold suits you' },
    { id: 'olive', name: 'Olive', hint: 'Green-grey cast, common in South Asia' }
  ];
  var DEPTHS = ['Fair', 'Light', 'Medium', 'Tan', 'Deep'];
  /* skin swatches [depth][tone] */
  var SKIN = [
    ['#f7ddd6', '#f4dac8', '#f3d4b6', '#eadab9'],
    ['#ecc2b2', '#e8c0a3', '#e7ba90', '#d9be95'],
    ['#cf9a86', '#cb9a7a', '#cd9467', '#b7996c'],
    ['#a56c5b', '#a36f53', '#a66d45', '#8f714b'],
    ['#643c34', '#6a4331', '#6e432a', '#5a452e']
  ];
  /* how each shade behaves: lightness (0 dark .. 1 light) and fit per undertone */
  var SHADE = {
    'Nude': { l: .74, a: { cool: .45, neutral: .82, warm: 1, olive: .72 }, why: 'A peachy-brown nude that reads as your lips, only better.' },
    'Rosewood': { l: .5, a: { cool: .72, neutral: 1, warm: .76, olive: .95 }, why: 'Muted rose with a brown base, the everyday shade that goes with everything.' },
    'Berry': { l: .36, a: { cool: 1, neutral: .8, warm: .5, olive: .86 }, why: 'A blue-based berry that makes teeth look whiter and skin brighter.' },
    'Plum': { l: .2, a: { cool: .95, neutral: .72, warm: .56, olive: .8 }, why: 'Deep plum with depth to spare, made for evenings and deeper skin.' },
    'Coral pink': { l: .74, a: { cool: .5, neutral: .82, warm: 1, olive: .76 }, why: 'Coral warms up the centre of the face, like you just walked in from the sun.' },
    'Warm rose': { l: .48, a: { cool: .84, neutral: .96, warm: .8, olive: .92 }, why: 'A grown-up rose that shows up on medium and deep skin without looking chalky.' }
  };
  var TINT_NUM = [2, 5, 9, 13, 16];
  var TONE_CODE = { cool: 'C', neutral: 'N', warm: 'W', olive: 'O' };
  var STEPS = [
    { cat: 'Skin', note: 'Treat first. Serum goes on clean skin, before anything else.' },
    { cat: 'Face', note: 'Even out, then add colour back to the cheeks.' },
    { cat: 'Eyes & lips', note: 'A wash on the lids and a lip to match the blush.' },
    { cat: 'Brushes', note: 'The tools. Synthetic fibre, washable, cruelty-free.' }
  ];

  var off = [];            /* cleanup callbacks for destroy() */
  function listen(t, ev, fn, o) { t.addEventListener(ev, fn, o); off.push(function () { t.removeEventListener(ev, fn, o); }); }

  function titleHTML(t, esc) {
    var parts = t.split(', ');
    if (parts.length === 3) return esc(parts[0]) + ', <em>' + esc(parts[1]) + ',</em> ' + esc(parts[2]);
    return esc(t);
  }

  function shadeList(api) {
    var out = [];
    api.P.forEach(function (p) { (p.colors || []).forEach(function (c) { out.push({ pid: p.id, name: c[0], hex: c[1], p: p }); }); });
    return out;
  }

  function score(name, tone, depth) {
    var s = SHADE[name]; if (!s) return 0;
    var ideal = .8 - .62 * depth / 4;
    return s.a[tone] * .58 + Math.max(0, 1 - Math.abs(s.l - ideal) * 1.7) * .42;
  }
  function matches(api, tone, depth) {
    function best(pid) {
      var p = api.byId[pid]; if (!p || !p.colors) return [];
      return p.colors.map(function (c) { return { pid: pid, name: c[0], hex: c[1], p: p, s: score(c[0], tone, depth) }; })
        .sort(function (a, b) { return b.s - a.s; });
    }
    var lips = best('lipstick'), cheek = best('blush');
    return { lip: lips[0], lip2: lips[1], cheek: cheek[0], tint: (TINT_NUM[depth] < 10 ? '0' : '') + TINT_NUM[depth] + ' ' + TONE_CODE[tone] };
  }
  function pctOf(s) { return Math.round(Math.min(99, 62 + s * 38)); }

  /* ------------------------------------------------------------------
     Product card
     ------------------------------------------------------------------ */
  function card(p, i, api) {
    var esc = api.esc, I = api.I, w = api.isWished(p.id), n = api.P.indexOf(p) + 1, el = EL[p.id] || [p.name.slice(0, 2), ''];
    var label = (p.details && p.details[0]) || p.cat;
    var sw = p.colors ? '<div class="gl-card-sw" role="group" aria-label="Shades">' + p.colors.map(function (c) {
      return '<button type="button" data-cardshade="' + p.id + '|' + esc(c[0]) + '" style="--c:' + c[1] + '" aria-label="Preview shade ' + esc(c[0]) + '" title="' + esc(c[0]) + '"></button>';
    }).join('') + '</div>' : '';
    return '<article class="gl-card" role="listitem" style="--d:' + Math.min(i * 60, 480) + 'ms">' +
      '<div class="gl-card-media">' +
        '<button type="button" class="gl-card-open" data-view="' + p.id + '" aria-label="View ' + esc(p.name) + '">' + api.pic(p) + '</button>' +
        '<i class="gl-card-tint" aria-hidden="true"></i><i class="gl-card-shine" aria-hidden="true"></i>' +
        '<span class="gl-el" aria-hidden="true"><small>' + (n < 10 ? '0' : '') + n + '</small><b>' + esc(el[0]) + '</b><em>' + esc(el[1]) + '</em></span>' +
        '<div class="gl-card-badges">' + api.badges(p) + '</div>' +
        '<button type="button" class="gl-card-wish' + (w ? ' is-on' : '') + '" data-wish="' + p.id + '" aria-pressed="' + w + '" aria-label="' + (w ? 'Remove from' : 'Save to') + ' wishlist: ' + esc(p.name) + '">' + I('heart') + '</button>' +
      '</div>' +
      '<div class="gl-card-body">' +
        '<span class="gl-card-label">' + esc(p.cat) + '<i></i>' + esc(label) + '</span>' +
        '<h3 class="gl-card-name"><button type="button" data-view="' + p.id + '">' + esc(p.name) + '</button></h3>' +
        '<div class="gl-card-meta">' + api.stars(p) + (p.stock <= 9 ? '<span class="gl-card-low">' + p.stock + ' left</span>' : '') + '</div>' +
        '<div class="gl-card-row"><span class="gl-card-price">' + api.money(p.price) + (p.was ? ' <s>' + api.money(p.was) + '</s>' : '') + '</span>' + sw +
          '<button type="button" class="gl-card-add" data-add="' + p.id + '" aria-label="Add to bag: ' + esc(p.name) + '">' + I('plus') + '<span>Add</span></button></div>' +
      '</div></article>';
  }

  /* ------------------------------------------------------------------
     Build
     ------------------------------------------------------------------ */
  function build(api) {
    var S = api.S, P = api.P, esc = api.esc, I = api.I, h = S.hero, lk = S.look, money = api.money;
    var byId = api.byId;
    var totalRev = P.reduce(function (s, p) { return s + p.reviews; }, 0);
    var avg = P.reduce(function (s, p) { return s + p.rating * p.reviews; }, 0) / totalRev;
    var serum = byId.serum, blush = byId.blush, kab = byId.kabuki, perf = byId.perfume;
    var formula = FORMULA.map(function (f) { return '<span><b>' + esc(f[0]) + '</b><em>' + esc(f[1]) + '</em></span>'; }).join('<i aria-hidden="true"></i>');

    var aura = '<div class="gl-aura" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>';

    var top = '<div class="gl-top"><span class="gl-top-l">' + I('pin') + 'Gulshan lab · ' + esc(S.city) + '</span>' +
      '<p class="gl-top-m" aria-live="polite"><span>' + esc(S.promo[0]) + '</span></p>' +
      '<span class="gl-top-r">' + I('clock') + esc(S.eta) + '</span></div>';

    var nav = '<header class="gl-nav"><div class="gl-nav-in">' +
      '<a class="gl-word" href="#glHero" data-gljump>' + S.word + '<sup>lab</sup></a>' +
      '<nav class="gl-links" aria-label="' + esc(S.name) + ' sections">' +
        '<a href="#glFinder" data-gljump><span>01</span>Shade lab</a><a href="#glTry" data-gljump><span>02</span>Try-on</a>' +
        '<a href="#glRoutine" data-gljump><span>03</span>Routine</a><a href="#glShop" data-gljump><span>04</span>Formulary</a></nav>' +
      '<div class="gl-acts">' + api.searchBox('Search formulas, shades', 'gl-search') + api.wishButton('gl-ic') + api.cartButton('gl-ic gl-bag', 'Bag') + '</div>' +
      '</div></header>';

    var hero = '<section class="gl-hero" id="glHero">' +
      '<div class="gl-hero-copy">' +
        '<span class="gl-kicker gl-rv"><i class="gl-pulse"></i>' + esc(h.eyebrow) + ' · Formula N°04</span>' +
        '<h1 class="gl-h1 gl-rv" style="--d:80ms">' + titleHTML(h.title, esc) + '</h1>' +
        '<p class="gl-lede gl-rv" style="--d:160ms">' + esc(h.sub) + '</p>' +
        '<div class="gl-cta gl-rv" style="--d:240ms"><a class="gl-btn" href="#glFinder" data-gljump>' + I('sparkle') + 'Find my shade</a>' +
          '<a class="gl-btn gl-btn-glass" href="#glShop" data-gljump>' + esc(h.cta) + I('arrow-right') + '</a></div>' +
        '<dl class="gl-stats gl-rv" style="--d:320ms">' +
          '<div><dt>' + avg.toFixed(1) + '<small>/5</small></dt><dd>from ' + totalRev.toLocaleString('en-US') + ' reviews</dd></div>' +
          '<div><dt>15<small>%</small></dt><dd>stable vitamin C</dd></div>' +
          '<div><dt>18</dt><dd>skin tint shades</dd></div></dl>' +
      '</div>' +
      '<div class="gl-stage">' +
        '<div class="gl-orbit" aria-hidden="true"><svg viewBox="0 0 200 200"><defs><path id="glCirc" d="M100 100 m-84 0 a84 84 0 1 1 168 0 a84 84 0 1 1 -168 0"/></defs><text><textPath href="#glCirc">INGREDIENTS ON THE FRONT · CRUELTY-FREE · MADE IN DHAKA · </textPath></text></svg></div>' +
        '<div class="gl-arch">' + api.img(api.photo(h.img), 'Makeup brushes in a lace cup beside pink roses and a vanity mirror', 'gl-arch-img', true) +
          '<div class="gl-lens" aria-hidden="true"><div class="gl-lens-in">' + api.img(api.photo(h.img), '') + '</div></div></div>' +
        '<button type="button" class="gl-float gl-f1 gl-glass" data-view="' + kab.id + '" data-depth="1.4"><span class="gl-float-img">' + api.pic(kab) + '</span><span><small>Brush N°07</small><b>' + esc(kab.name) + '</b><em>' + money(kab.price) + '</em></span></button>' +
        '<button type="button" class="gl-float gl-f2 gl-glass" data-view="' + perf.id + '" data-depth="-1"><span class="gl-float-img">' + api.pic(perf) + '</span><span><small>Rose · oud · pepper</small><b>Eau de Parfum</b><em>' + money(perf.price) + '</em></span></button>' +
        '<button type="button" class="gl-chip gl-c1 gl-glass" data-view="' + serum.id + '" data-depth=".7"><span class="gl-chip-k">Active</span><b>15%</b><span>ascorbic acid<br>0.5% ferulic</span></button>' +
        '<button type="button" class="gl-chip gl-c2 gl-glass" data-view="' + blush.id + '" data-depth="-.6"><span class="gl-chip-dots"><i style="background:' + blush.colors[0][1] + '"></i><i style="background:' + blush.colors[1][1] + '"></i></span><span><b>' + blush.rating.toFixed(1) + '</b> ' + I('star-fill') + '<br><small>' + esc(blush.name) + '</small></span></button>' +
      '</div></section>';

    var strip = '<div class="gl-formula" aria-label="What is inside our formulas"><div class="gl-formula-track">' + formula + '<i aria-hidden="true"></i>' + formula + '</div></div>';

    /* 01 shade lab */
    var toneHead = TONES.map(function (t, ti) { return '<button type="button" class="gl-tone" data-tone="' + t.id + '" aria-pressed="false"><span class="gl-tone-dot" style="--c:' + SKIN[2][ti] + '"></span><b>' + t.name + '</b><small>' + esc(t.hint) + '</small></button>'; }).join('');
    var swatches = '';
    DEPTHS.forEach(function (d, di) {
      swatches += '<span class="gl-depth" aria-hidden="true">' + d + '</span>';
      TONES.forEach(function (t, ti) {
        swatches += '<button type="button" class="gl-sk" role="radio" aria-checked="false" tabindex="-1" data-d="' + di + '" data-t="' + ti + '" style="--c:' + SKIN[di][ti] + '" aria-label="' + d + ' skin, ' + t.name.toLowerCase() + ' undertone"><i></i></button>';
      });
    });
    var finder = '<section class="gl-sec gl-finder" id="glFinder">' +
      '<header class="gl-head gl-rv"><span class="gl-eyebrow"><b>01</b>Shade lab</span><h2 class="gl-h2">Find your <em>shade</em> in two taps.</h2>' +
        '<p>Pick your undertone, then how light or deep your skin is. We match it against every shade we make and tell you why.</p></header>' +
      '<div class="gl-finder-grid">' +
        '<div class="gl-glass gl-picker gl-rv">' +
          '<div class="gl-step-t"><span>A</span>Undertone <small>Look at the veins on your wrist, or how gold and silver sit on you.</small></div>' +
          '<div class="gl-tones" role="group" aria-label="Undertone">' + toneHead + '</div>' +
          '<div class="gl-step-t"><span>B</span>Depth <small>Tap the swatch closest to your jawline in daylight.</small></div>' +
          '<div class="gl-sk-grid" role="radiogroup" aria-label="Skin depth and undertone"><span aria-hidden="true"></span>' +
            TONES.map(function (t) { return '<span class="gl-sk-h" aria-hidden="true">' + t.name + '</span>'; }).join('') + swatches + '</div>' +
        '</div>' +
        '<div class="gl-glass gl-result gl-rv" style="--d:120ms" aria-live="polite"></div>' +
      '</div></section>';

    /* 02 virtual swatch */
    var shades = shadeList(api).map(function (s, i) {
      return '<button type="button" class="gl-shade" role="radio" aria-checked="false" tabindex="-1" data-shade="' + s.pid + '|' + esc(s.name) + '" style="--c:' + s.hex + ';--i:' + i + '"><i></i><b>' + esc(s.name) + '</b><small>' + (s.pid === 'blush' ? 'Blush' : 'Lipstick') + '</small></button>';
    }).join('');
    var lookPicks = (lk.pids || []).map(function (id) { var p = byId[id]; return p ? '<button type="button" class="gl-lp" data-view="' + p.id + '"><span>' + api.pic(p) + '</span><b>' + esc(p.name) + '</b><em>' + money(p.price) + '</em></button>' : ''; }).join('');
    var tryon = '<section class="gl-sec gl-try" id="glTry">' +
      '<div class="gl-try-grid">' +
        '<div class="gl-mirror gl-glass gl-rv">' +
          '<div class="gl-photo" data-mode="pans">' + api.img(api.photo(lk.img), 'Open rose eyeshadow palette with a mirror and a cup of brushes', 'gl-photo-img') +
            '<i class="gl-tint gl-tint-a" aria-hidden="true"></i><i class="gl-tint gl-tint-b" aria-hidden="true"></i><i class="gl-tint gl-tint-glint" aria-hidden="true"></i>' +
            '<div class="gl-before" aria-hidden="true">' + api.img(api.photo(lk.img), '') + '</div>' +
            '<span class="gl-wipe" aria-hidden="true"><i>' + I('chevron-left') + I('chevron-right') + '</i></span>' +
            '<span class="gl-tag gl-tag-l" aria-hidden="true">Swatched</span><span class="gl-tag gl-tag-r" aria-hidden="true">Bare</span>' +
            '<input type="range" class="gl-cmp" min="0" max="100" value="100" aria-label="Compare swatched and bare, drag to wipe">' +
          '</div>' +
          '<div class="gl-now"><span class="gl-now-sw"></span><span><small>Previewing</small><b class="gl-now-n"></b></span><span class="gl-now-p"></span></div>' +
        '</div>' +
        '<div class="gl-try-side">' +
          '<header class="gl-head gl-rv"><span class="gl-eyebrow"><b>02</b>Virtual swatch</span><h2 class="gl-h2">Swatch it <em>before</em> you buy it.</h2>' +
            '<p>Hover or tap a shade and watch it land on the palette. Drag the photo to wipe between swatched and bare.</p></header>' +
          '<div class="gl-shades gl-rv" role="radiogroup" aria-label="Shade to preview" style="--d:80ms">' + shades + '</div>' +
          '<div class="gl-try-ctl gl-rv" style="--d:140ms">' +
            '<div class="gl-seg" role="radiogroup" aria-label="Where to swatch"><button type="button" role="radio" aria-checked="true" data-mode="pans">On the pans</button><button type="button" role="radio" aria-checked="false" data-mode="wash">Full wash</button></div>' +
            '<label class="gl-amt"><span>Intensity <b class="gl-amt-v">70%</b></span><input type="range" min="20" max="100" value="70" aria-label="Swatch intensity"></label>' +
          '</div>' +
          '<div class="gl-try-acts gl-rv" style="--d:200ms"><button type="button" class="gl-btn gl-try-add">' + I('bag') + '<span>Add to bag</span></button><button type="button" class="gl-btn gl-btn-glass gl-try-view">' + I('eye') + 'Quick view</button></div>' +
          '<div class="gl-look gl-rv" style="--d:260ms"><span class="gl-eyebrow"><b>' + I('play') + '</b>' + esc(lk.eyebrow) + ' · ' + esc(lk.title) + '</span><p>' + esc(lk.text) + '</p><div class="gl-lps">' + lookPicks + '</div></div>' +
        '</div>' +
      '</div></section>';

    /* 03 routine */
    var routine = '<section class="gl-sec gl-routine" id="glRoutine">' +
      '<header class="gl-head gl-head-c gl-rv"><span class="gl-eyebrow"><b>03</b>Build a routine</span><h2 class="gl-h2">Four steps, <em>one</em> bag.</h2>' +
        '<p>Pick what you need at each step. The total updates as you go, and the whole routine goes in the bag in one tap.</p></header>' +
      '<div class="gl-rt gl-glass gl-rv">' +
        '<div class="gl-steps" role="tablist" aria-label="Routine steps">' + STEPS.map(function (s, i) {
          return '<button type="button" role="tab" id="glTab' + i + '" aria-controls="glPanel" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-step="' + i + '"><span class="gl-step-n">' + (i + 1) + '</span><span class="gl-step-l">' + esc(s.cat) + '<small></small></span></button>';
        }).join('') + '<span class="gl-steps-bar" aria-hidden="true"><i></i></span></div>' +
        '<div class="gl-rt-body">' +
          '<div class="gl-rt-panel" id="glPanel" role="tabpanel" tabindex="0"></div>' +
          '<aside class="gl-rt-sum" data-fly aria-label="Your routine"></aside>' +
        '</div>' +
      '</div></section>';

    /* 04 shop */
    var shop = '<section class="gl-sec gl-shop" id="glShop">' +
      '<header class="gl-head gl-head-row gl-rv"><div><span class="gl-eyebrow"><b>04</b>The formulary</span><h2 class="gl-h2">Everything, with <em>the label</em> on.</h2></div>' +
        '<p>' + P.length + ' formulas and tools. Each card shows its key active or spec up front, the same way the box does.</p></header>' +
      '<div class="gl-toolbar gl-glass gl-rv">' + api.catsHTML('gl-cats') + '<div class="gl-tools">' + api.sortHTML() + api.rangeHTML() + '</div></div>' +
      '<div class="gl-fchip" hidden><span>' + I('sparkle') + '<b>Showing your shade matches</b></span><button type="button" data-glunfilter>' + I('close') + 'Show everything</button></div>' +
      api.gridHTML('gl-grid') +
      '</section>';

    /* 05 reviews */
    var reviews = '<section class="gl-sec gl-reviews">' +
      '<header class="gl-head gl-head-row gl-rv"><div><span class="gl-eyebrow"><b>05</b>Skin notes</span><h2 class="gl-h2">Tested on <em>real</em> skin.</h2></div>' +
        '<div class="gl-agg"><b>' + avg.toFixed(1) + '</b><span>' + I('star-fill') + I('star-fill') + I('star-fill') + I('star-fill') + I('star-fill') + '<small>' + totalRev.toLocaleString('en-US') + ' verified reviews</small></span></div></header>' +
      '<div class="gl-quotes">' + S.reviews.map(function (r, i) {
        var ini = r[1].split(' ').map(function (x) { return x.charAt(0); }).join('');
        return '<figure class="gl-quote gl-glass gl-rv" style="--d:' + (i * 90) + 'ms"><span class="gl-q-ic">' + I('quote') + '</span><blockquote>' + esc(r[0]) + '</blockquote>' +
          '<figcaption><span class="gl-av" aria-hidden="true">' + esc(ini) + '</span><span><b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + ' · verified buyer</small></span><span class="gl-q-st" aria-label="5 out of 5">' + I('star-fill') + '5.0</span></figcaption></figure>';
      }).join('') + '</div></section>';

    var pol = '<section class="gl-pol">' + S.policies.map(function (x, i) {
      return '<div class="gl-glass gl-rv" style="--d:' + (i * 80) + 'ms"><span class="gl-pol-n">0' + (i + 1) + '</span><span class="gl-pol-ic">' + I(x[0]) + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></div>';
    }).join('') + '</section>';

    var foot = '<footer class="gl-foot">' +
      '<div class="gl-news gl-glass gl-rv"><div><span class="gl-eyebrow"><b>' + I('mail') + '</b>Lab notes</span><h3>New shades and refills, <em>first</em>.</h3><p>One email a month from the lab in Gulshan. No daily sales, no fake countdowns.</p></div>' +
        api.newsHTML('Your email') + '</div>' +
      '<div class="gl-foot-cols">' +
        '<div><a class="gl-word" href="#glHero" data-gljump>' + S.word + '</a><p>' + esc(S.tagline) + '</p></div>' +
        '<div><b>Shop</b>' + S.cats.slice(1).map(function (c) { return '<button type="button" data-navcat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
        '<div><b>Lab tools</b><a href="#glFinder" data-gljump>Shade lab</a><a href="#glTry" data-gljump>Virtual swatch</a><a href="#glRoutine" data-gljump>Build a routine</a></div>' +
        '<div><b>Visit</b><span>Gulshan Avenue, ' + esc(S.city) + '</span><span>' + esc(S.eta) + '</span><span>@' + esc(S.handle) + '</span></div>' +
      '</div>' +
      '<div class="gl-giant" aria-hidden="true">glow <em>theory</em></div>' +
      api.creditHTML() +
      '</footer>';

    return aura + top + nav + '<main class="gl-main">' + hero + strip + finder + tryon + routine + shop + reviews + pol + foot + '</main>';
  }

  /* ------------------------------------------------------------------
     Wire
     ------------------------------------------------------------------ */
  function wire(api, root) {
    var $ = function (s, c) { return (c || root).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
    var S = api.S, P = api.P, byId = api.byId, esc = api.esc, I = api.I, money = api.money, reduce = api.reduce;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    root.classList.add('gl-ready');

    /* ---------- reveals ---------- */
    var rv = $$('.gl-rv');
    if (reduce || !('IntersectionObserver' in window)) rv.forEach(function (e) { e.classList.add('is-in'); });
    else {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
      }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
      rv.forEach(function (e) { io.observe(e); });
      off.push(function () { io.disconnect(); });
    }

    /* ---------- promo line ---------- */
    var pi = 0, pm = $('.gl-top-m');
    api.every(function () {
      if (document.hidden) return;
      pi = (pi + 1) % S.promo.length;
      var sp = document.createElement('span');
      sp.textContent = S.promo[pi];
      var old = pm.firstElementChild;
      pm.appendChild(sp);
      if (old) { old.classList.add('out'); api.later(function () { old.remove(); }, reduce ? 0 : 600); }
    }, 3800);

    /* ---------- in-page jumps (offset for the fixed + sticky headers) ---------- */
    function goTo(sel) {
      var t = $(sel); if (!t) return;
      api.jump(t);   /* the engine knows every sticky bar above the store */
    }
    listen(root, 'click', function (e) {
      var j = e.target.closest('[data-gljump]');
      if (j) { e.preventDefault(); goTo(j.getAttribute('href')); }
    });

    /* ---------- scroll-linked effects ---------- */
    var hero = $('.gl-hero'), track = $('.gl-formula-track'), floats = $$('.gl-stage [data-depth]'), nav = $('.gl-nav');
    var ticking = false;
    function onScroll() {
      ticking = false;
      var vh = innerHeight;
      var hr = hero.getBoundingClientRect();
      if (hr.bottom > 0 && hr.top < vh) {
        var k = -hr.top;
        floats.forEach(function (f) { f.style.setProperty('--sy', (k * .08 * parseFloat(f.getAttribute('data-depth'))).toFixed(1) + 'px'); });
        root.style.setProperty('--hero-k', Math.max(0, Math.min(1, k / hr.height)).toFixed(3));
      }
      var tr = track.parentNode.getBoundingClientRect();
      if (tr.bottom > 0 && tr.top < vh) track.style.transform = 'translate3d(' + (-((vh - tr.top) * .35) % (track.scrollWidth / 2)).toFixed(1) + 'px,0,0)';
      var rr = root.getBoundingClientRect();
      nav.classList.toggle('is-stuck', rr.top < -40);
      root.style.setProperty('--aura-y', (rr.top * .12).toFixed(1) + 'px');
    }
    if (!reduce) {
      listen(window, 'scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
      onScroll();
    } else {
      listen(window, 'scroll', function () { nav.classList.toggle('is-stuck', root.getBoundingClientRect().top < -40); }, { passive: true });
    }

    /* ---------- hero lens + light (fine pointer only) ---------- */
    var arch = $('.gl-arch'), lens = $('.gl-lens'), lensIn = $('.gl-lens-in');
    if (fine) {
      listen(arch, 'pointermove', function (e) {
        var r = arch.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, L = lens.offsetWidth;
        lens.style.transform = 'translate(' + (x - L / 2).toFixed(1) + 'px,' + (y - L / 2).toFixed(1) + 'px)';
        lensIn.style.width = r.width + 'px'; lensIn.style.height = r.height + 'px';
        lensIn.style.transformOrigin = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
        lensIn.style.left = (L / 2 - x).toFixed(1) + 'px'; lensIn.style.top = (L / 2 - y).toFixed(1) + 'px';
        arch.classList.add('is-lens');
      });
      listen(arch, 'pointerleave', function () { arch.classList.remove('is-lens'); });
      listen(hero, 'pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        hero.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }

    /* ==================================================================
       1. Shade lab
       ================================================================== */
    var prof = api.store('shade') || { t: 2, d: 1 };
    var res = $('.gl-result'), sks = $$('.gl-sk'), tones = $$('.gl-tone');
    function recHTML(m, kind, label) {
      if (!m) return '';
      var key = m.pid + '|' + esc(m.name);
      return '<li class="gl-rec" style="--c:' + m.hex + '"><span class="gl-rec-sw" aria-hidden="true"><i></i></span>' +
        '<div class="gl-rec-t"><small>' + label + ' · ' + pctOf(m.s) + '% match</small><b>' + esc(m.name) + '</b><em>' + esc(m.p.name) + ' · ' + money(m.p.price) + '</em><p>' + esc(SHADE[m.name] ? SHADE[m.name].why : '') + '</p></div>' +
        '<div class="gl-rec-a"><button type="button" class="gl-mini" data-try="' + key + '">' + I('eye') + '<span>Swatch</span></button>' +
        '<button type="button" class="gl-mini" data-glview="' + key + '">' + I('search') + '<span>View</span></button>' +
        '<button type="button" class="gl-mini gl-mini-on" data-gladd="' + key + '" aria-label="Add ' + esc(m.name) + ' ' + esc(m.p.name) + ' to bag">' + I('plus') + '</button></div></li>';
    }
    function renderFinder() {
      var tone = TONES[prof.t], m = matches(api, tone.id, prof.d);
      sks.forEach(function (b) {
        var on = +b.getAttribute('data-d') === prof.d && +b.getAttribute('data-t') === prof.t;
        b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
        b.classList.toggle('in-col', +b.getAttribute('data-t') === prof.t);
      });
      tones.forEach(function (b, i) { b.setAttribute('aria-pressed', i === prof.t); });
      var skin = SKIN[prof.d][prof.t], base = byId.base;
      var overall = pctOf((m.lip.s + m.cheek.s) / 2);
      res.innerHTML = '<div class="gl-res-head"><span class="gl-res-skin" style="--c:' + skin + '"></span><div><small>Your profile</small><b>' + DEPTHS[prof.d] + ' · ' + tone.name + '</b></div>' +
        '<span class="gl-ring" style="--p:' + overall + '"><b>' + overall + '<small>%</small></b><small>fit</small></span></div>' +
        '<ul class="gl-recs">' + recHTML(m.lip, 'lip', 'Lip, best') + recHTML(m.cheek, 'cheek', 'Cheek') + recHTML(m.lip2, 'lip', 'Lip, also try') + '</ul>' +
        (base ? '<div class="gl-tintrow"><span class="gl-tint-sw" style="--c:' + skin + '"></span><div><small>Skin tint shade</small><b>' + m.tint + '</b><em>' + esc(base.name) + ' · ' + money(base.price) + '</em></div>' +
          '<button type="button" class="gl-mini gl-mini-on" data-gltint="' + m.tint + '" aria-label="Add Skin Tint shade ' + m.tint + ' to bag">' + I('plus') + '<span>Add ' + m.tint + '</span></button></div>' : '') +
        '<button type="button" class="gl-link" data-glmatch>' + I('filter') + 'Show my matches in the formulary' + I('arrow-right') + '</button>';
      res.classList.remove('flash'); void res.offsetWidth; res.classList.add('flash');
      api.store('shade', prof);
    }
    function setProf(d, t, focus) {
      prof = { d: d, t: t }; renderFinder();
      if (focus) { var b = sks.filter(function (x) { return +x.getAttribute('data-d') === d && +x.getAttribute('data-t') === t; })[0]; if (b) b.focus(); }
    }
    $('.gl-sk-grid').addEventListener('click', function (e) { var b = e.target.closest('.gl-sk'); if (b) setProf(+b.getAttribute('data-d'), +b.getAttribute('data-t')); });
    $('.gl-sk-grid').addEventListener('keydown', function (e) {
      var mv = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
      if (!mv) return;
      e.preventDefault();
      setProf((prof.d + mv[0] + 5) % 5, (prof.t + mv[1] + 4) % 4, true);
    });
    $('.gl-tones').addEventListener('click', function (e) { var b = e.target.closest('.gl-tone'); if (b) setProf(prof.d, tones.indexOf(b)); });
    function split(v) { var i = v.indexOf('|'); return [v.slice(0, i), v.slice(i + 1)]; }
    function viewShade(pid, color) {
      api.openProduct(pid);
      var b = document.querySelector('#pmodal .opt-color[data-color="' + color.replace(/"/g, '') + '"]');
      if (b) b.click();
    }
    res.addEventListener('click', function (e) {
      var t = e.target.closest('[data-try]'), v = e.target.closest('[data-glview]'), a = e.target.closest('[data-gladd]'), tn = e.target.closest('[data-gltint]'), mt = e.target.closest('[data-glmatch]');
      if (t) { var k = split(t.getAttribute('data-try')); pickShade(k[0], k[1], true); goTo('#glTry'); }
      if (v) { var kv = split(v.getAttribute('data-glview')); viewShade(kv[0], kv[1]); }
      if (a) { var ka = split(a.getAttribute('data-gladd')); api.addToCart(ka[0], ka[1], null, 1, { from: a.closest('.gl-rec').querySelector('.gl-rec-sw') ? null : null }); pop(a); }
      if (tn) { api.addToCart('base', null, null, 1, { note: 'Shade ' + tn.getAttribute('data-gltint') }); pop(tn); }
      if (mt) {
        var ids = ['lipstick', 'blush', 'base'];
        api.filter = function (p) { return ids.indexOf(p.id) >= 0; };
        api.setCat('All');
        $('.gl-fchip').hidden = false;
        goTo('#glShop');
      }
    });
    function pop(b) { b.classList.remove('did'); void b.offsetWidth; b.classList.add('did'); }
    function unfilter() { api.filter = null; $('.gl-fchip').hidden = true; }
    root.addEventListener('click', function (e) { if (e.target.closest('[data-glunfilter]')) { unfilter(); api.render(); } });
    api.on('clear', unfilter);
    renderFinder();

    /* ==================================================================
       2. Virtual swatch try-on
       ================================================================== */
    var photo = $('.gl-photo'), shadesEl = $$('.gl-shade'), SH = shadeList(api);
    var cur = api.store('tryon') || { pid: 'lipstick', name: 'Rosewood', amt: 70, mode: 'pans' };
    if (!SH.some(function (s) { return s.pid === cur.pid && s.name === cur.name; })) cur = { pid: SH[0].pid, name: SH[0].name, amt: 70, mode: 'pans' };
    function findShade(pid, name) { return SH.filter(function (s) { return s.pid === pid && s.name === name; })[0]; }
    function showShade(s) {
      if (!s) return;
      photo.style.setProperty('--tint', s.hex);
      photo.classList.remove('swap'); void photo.offsetWidth; photo.classList.add('swap');
      $('.gl-now-sw').style.background = s.hex;
      $('.gl-now-n').textContent = s.name;
      $('.gl-now-p').textContent = s.p.name + ' · ' + money(s.p.price);
    }
    function pickShade(pid, name, silent) {
      var s = findShade(pid, name); if (!s) return;
      cur.pid = pid; cur.name = name;
      shadesEl.forEach(function (b) { var on = b.getAttribute('data-shade') === pid + '|' + name; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
      showShade(s);
      $('.gl-try-add span').textContent = 'Add ' + name + ' · ' + money(s.p.price);
      api.store('tryon', cur);
    }
    function setMode(m) {
      cur.mode = m; photo.setAttribute('data-mode', m);
      $$('.gl-seg button').forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-mode') === m); });
      api.store('tryon', cur);
    }
    function setAmt(v) { cur.amt = v; photo.style.setProperty('--amt', (v / 100).toFixed(2)); $('.gl-amt-v').textContent = v + '%'; api.store('tryon', cur); }
    var shWrap = $('.gl-shades');
    shWrap.addEventListener('click', function (e) { var b = e.target.closest('.gl-shade'); if (b) { var k = split(b.getAttribute('data-shade')); pickShade(k[0], k[1]); } });
    if (fine) {
      shWrap.addEventListener('mouseover', function (e) { var b = e.target.closest('.gl-shade'); if (b) { var k = split(b.getAttribute('data-shade')); showShade(findShade(k[0], k[1])); } });
      shWrap.addEventListener('mouseleave', function () { showShade(findShade(cur.pid, cur.name)); });
    }
    shWrap.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
      e.preventDefault();
      var i = shadesEl.indexOf(document.activeElement), n = shadesEl[(i + d + shadesEl.length) % shadesEl.length];
      n.focus(); n.click();
    });
    $('.gl-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-mode]'); if (b) setMode(b.getAttribute('data-mode')); });
    var amt = $('.gl-amt input'); amt.value = cur.amt;
    amt.addEventListener('input', function () { setAmt(+amt.value); });
    var cmp = $('.gl-cmp');
    function setCmp(v) { photo.style.setProperty('--cut', v + '%'); photo.classList.toggle('is-cmp', v < 100); }
    cmp.addEventListener('input', function () { setCmp(+cmp.value); });
    /* a first-visit hint: the wipe sweeps once when the mirror comes into view */
    if (!reduce && 'IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io2.disconnect();
        var t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1800), v = 100 - Math.sin(k * Math.PI) * 55;
          if (+cmp.value === 100 || photo.classList.contains('auto')) { photo.classList.add('auto'); setCmp(Math.round(v)); }
          if (k < 1 && root.isConnected) requestAnimationFrame(step); else { photo.classList.remove('auto'); setCmp(+cmp.value); }
        }
        api.later(function () { requestAnimationFrame(step); }, 500);
      }, { threshold: .5 });
      io2.observe(photo);
      off.push(function () { io2.disconnect(); });
    }
    $('.gl-try-add').addEventListener('click', function (e) { api.addToCart(cur.pid, cur.name, null, 1, { from: $('.gl-now-sw') ? null : null }); pop(e.currentTarget); });
    $('.gl-try-view').addEventListener('click', function () { viewShade(cur.pid, cur.name); });
    pickShade(cur.pid, cur.name); setMode(cur.mode || 'pans'); setAmt(cur.amt || 70); setCmp(100);

    /* ==================================================================
       3. Build-a-routine
       ================================================================== */
    var rt = api.store('routine') || { step: 0, sel: { serum: true, blush: 'Warm rose', lipstick: 'Rosewood', trio: true } };
    var panel = $('.gl-rt-panel'), sum = $('.gl-rt-sum'), tabs = $$('.gl-steps [role="tab"]');
    function selIds() { var ids = []; STEPS.forEach(function (s) { P.forEach(function (p) { if (p.cat === s.cat && rt.sel[p.id]) ids.push(p.id); }); }); return ids; }
    var shownTotal = 0;
    function countTo(el, to) {
      if (reduce) { el.textContent = money(to); shownTotal = to; return; }
      var from = shownTotal, t0 = null;
      shownTotal = to;
      function f(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 500), e = 1 - Math.pow(1 - k, 3); el.textContent = money(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(f); }
      requestAnimationFrame(f);
    }
    function renderRoutine(focusPanel) {
      var st = STEPS[rt.step];
      tabs.forEach(function (t, i) {
        var n = P.filter(function (p) { return p.cat === STEPS[i].cat && rt.sel[p.id]; }).length;
        t.setAttribute('aria-selected', i === rt.step); t.tabIndex = i === rt.step ? 0 : -1;
        t.classList.toggle('has', n > 0);
        t.querySelector('small').textContent = n ? n + ' picked' : 'Optional';
      });
      root.style.setProperty('--rt-p', ((rt.step) / (STEPS.length - 1)).toFixed(3));
      panel.setAttribute('aria-labelledby', 'glTab' + rt.step);
      var items = P.filter(function (p) { return p.cat === st.cat; });
      panel.innerHTML = '<p class="gl-rt-note"><span>Step ' + (rt.step + 1) + ' of ' + STEPS.length + '</span>' + esc(st.note) + '</p><div class="gl-rt-items">' + items.map(function (p, i) {
        var on = !!rt.sel[p.id];
        var cols = p.colors ? '<div class="gl-rt-cols" role="radiogroup" aria-label="Shade for ' + esc(p.name) + '">' + p.colors.map(function (c) {
          var ck = on ? rt.sel[p.id] === c[0] : false;
          return '<button type="button" role="radio" aria-checked="' + ck + '" data-rtc="' + p.id + '|' + esc(c[0]) + '" style="--c:' + c[1] + '" aria-label="' + esc(c[0]) + '" title="' + esc(c[0]) + '"></button>';
        }).join('') + '</div>' : '';
        return '<div class="gl-rt-item' + (on ? ' is-on' : '') + '" style="--d:' + (i * 70) + 'ms">' +
          '<button type="button" class="gl-rt-tog" data-rt="' + p.id + '" aria-pressed="' + on + '"><span class="gl-rt-img">' + api.pic(p) + '</span>' +
          '<span class="gl-rt-t"><b>' + esc(p.name) + '</b><small>' + esc((p.details || [''])[0]) + '</small></span>' +
          '<span class="gl-rt-pr">' + money(p.price) + '</span><span class="gl-rt-ck" aria-hidden="true">' + I('check') + '</span></button>' +
          '<div class="gl-rt-foot">' + cols + '<button type="button" class="gl-rt-more" data-view="' + p.id + '">Details' + I('arrow-up-right') + '</button></div></div>';
      }).join('') + '</div>' +
        '<div class="gl-rt-nav"><button type="button" class="gl-btn gl-btn-glass" data-rtgo="-1"' + (rt.step === 0 ? ' disabled' : '') + '>' + I('arrow-left') + 'Back</button>' +
        (rt.step < STEPS.length - 1 ? '<button type="button" class="gl-btn" data-rtgo="1">Next: ' + esc(STEPS[rt.step + 1].cat) + I('arrow-right') + '</button>' : '<button type="button" class="gl-btn" data-rtbag>' + I('bag') + 'Review and add</button>') + '</div>';
      renderSum();
      if (focusPanel) panel.focus({ preventScroll: true });
      api.store('routine', rt);
    }
    function renderSum() {
      var ids = selIds(), tot = ids.reduce(function (s, id) { return s + byId[id].price; }, 0);
      var need = Math.max(0, S.free - tot), pct = S.free ? Math.min(100, tot / S.free * 100) : 100;
      sum.innerHTML = '<div class="gl-sum-h"><span class="gl-eyebrow"><b>' + ids.length + '</b>Your routine</span><button type="button" class="gl-sum-clear" data-rtclear' + (ids.length ? '' : ' disabled') + '>Clear</button></div>' +
        (ids.length ? '<ol class="gl-sum-list">' + ids.map(function (id) {
          var p = byId[id], c = typeof rt.sel[id] === 'string' ? rt.sel[id] : '', hex = c && p.colors ? p.colors.filter(function (x) { return x[0] === c; })[0] : null;
          return '<li><span class="gl-sum-img">' + api.pic(p) + '</span><span class="gl-sum-t"><b>' + esc(p.name) + '</b><small>' + esc(p.cat) + (c ? ' · <i style="background:' + hex[1] + '"></i>' + esc(c) : '') + '</small></span><span class="gl-sum-p">' + money(p.price) + '</span>' +
            '<button type="button" class="gl-sum-x" data-rtx="' + id + '" aria-label="Remove ' + esc(p.name) + ' from routine">' + I('close') + '</button></li>';
        }).join('') + '</ol>' : '<p class="gl-sum-empty">' + I('layers') + 'Nothing picked yet. Start with a serum.</p>') +
        '<div class="gl-sum-ship"><span>' + (need > 0 ? 'Add <b>' + money(need) + '</b> for free delivery' : '<b>Free delivery</b> included') + '</span><i><b style="width:' + pct.toFixed(0) + '%"></b></i></div>' +
        '<div class="gl-sum-tot"><span>Routine total</span><b class="gl-sum-v">' + money(shownTotal) + '</b></div>' +
        '<button type="button" class="gl-btn gl-sum-add" data-rtadd' + (ids.length ? '' : ' disabled') + '>' + I('bag') + 'Add routine to bag</button>';
      countTo($('.gl-sum-v', sum), tot);
    }
    function goStep(i, focus) { rt.step = Math.max(0, Math.min(STEPS.length - 1, i)); renderRoutine(focus); }
    $('.gl-steps').addEventListener('click', function (e) { var t = e.target.closest('[data-step]'); if (t) goStep(+t.getAttribute('data-step')); });
    $('.gl-steps').addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
      e.preventDefault(); goStep((rt.step + d + STEPS.length) % STEPS.length); tabs[rt.step].focus();
    });
    panel.addEventListener('click', function (e) {
      var tg = e.target.closest('[data-rt]'), c = e.target.closest('[data-rtc]'), go = e.target.closest('[data-rtgo]'), bag = e.target.closest('[data-rtbag]');
      if (tg) {
        var id = tg.getAttribute('data-rt'), p = byId[id];
        if (rt.sel[id]) delete rt.sel[id]; else rt.sel[id] = p.colors ? p.colors[0][0] : true;
        renderRoutine();
        var nb = panel.querySelector('[data-rt="' + id + '"]'); if (nb) nb.focus({ preventScroll: true });
      }
      if (c) { var k = split(c.getAttribute('data-rtc')); rt.sel[k[0]] = k[1]; renderRoutine(); var nc = panel.querySelector('[data-rtc="' + c.getAttribute('data-rtc') + '"]'); if (nc) nc.focus({ preventScroll: true }); }
      if (go) goStep(rt.step + +go.getAttribute('data-rtgo'), true);
      if (bag) { var ab = sum.querySelector('[data-rtadd]'); if (ab && !ab.disabled) ab.focus(); sum.classList.remove('glow'); void sum.offsetWidth; sum.classList.add('glow'); }
    });
    sum.addEventListener('click', function (e) {
      var x = e.target.closest('[data-rtx]'), cl = e.target.closest('[data-rtclear]'), add = e.target.closest('[data-rtadd]');
      if (x) { delete rt.sel[x.getAttribute('data-rtx')]; renderRoutine(); }
      if (cl) { rt.sel = {}; renderRoutine(); }
      if (add) {
        var ids = selIds(); if (!ids.length) return;
        var im = sum.querySelector('.gl-sum-img img');
        ids.forEach(function (id, i) { api.addToCart(id, typeof rt.sel[id] === 'string' ? rt.sel[id] : undefined, null, 1, { quiet: true, from: i === 0 ? im : null }); });
        api.toast('Routine added: ' + ids.length + ' item' + (ids.length > 1 ? 's' : '') + ' in your bag');
        add.innerHTML = I('check') + 'Added to your bag';
        add.classList.add('done');
        api.later(function () { if (add.isConnected) { add.innerHTML = I('bag') + 'Add routine to bag'; add.classList.remove('done'); } }, 2400);
      }
    });
    renderRoutine();

    /* ==================================================================
       Product cards: tilt, shimmer and shade tint (grid re-renders a lot,
       so everything is delegated)
       ================================================================== */
    var grid = $('.s-grid');
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cardshade]'); if (!b) return;
      e.stopPropagation();
      var k = split(b.getAttribute('data-cardshade')); viewShade(k[0], k[1]);
    });
    function tintCard(b, on) {
      var c = b.closest('.gl-card'); if (!c) return;
      c.style.setProperty('--tc', on ? b.style.getPropertyValue('--c') : 'transparent');
      c.classList.toggle('is-tint', on);
    }
    grid.addEventListener('mouseover', function (e) { var b = e.target.closest('[data-cardshade]'); if (b) tintCard(b, true); });
    grid.addEventListener('mouseout', function (e) { var b = e.target.closest('[data-cardshade]'); if (b) tintCard(b, false); });
    grid.addEventListener('focusin', function (e) { var b = e.target.closest('[data-cardshade]'); if (b) tintCard(b, true); });
    grid.addEventListener('focusout', function (e) { var b = e.target.closest('[data-cardshade]'); if (b) tintCard(b, false); });
    if (fine && !reduce) {
      grid.addEventListener('pointermove', function (e) {
        var c = e.target.closest('.gl-card'); if (!c) return;
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--rx', ((.5 - y) * 6).toFixed(2) + 'deg');
        c.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      grid.addEventListener('pointerout', function (e) {
        var c = e.target.closest('.gl-card'); if (!c || c.contains(e.relatedTarget)) return;
        c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg');
      });
    }
    /* keep the match filter chip honest if something else resets filters */
    api.on('render', function () { var ch = $('.gl-fchip'); if (ch) ch.hidden = !api.filter; });
  }

  function destroy() {
    off.forEach(function (f) { try { f(); } catch (e) { /* already gone */ } });
    off = [];
  }

  XRShop.register('glow', { build: build, wire: wire, card: card, destroy: destroy });
})();
