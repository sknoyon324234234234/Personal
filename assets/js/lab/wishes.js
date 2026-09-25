/* Lab stage 10 — the wish wall: ema plaques that turn over into a plan, plus the ones visitors write */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var KEY = 'xr-wishes';

  var WISHES = [
    { svc: 'telegram', ic: 'send', t: 'A Telegram bot that takes orders while I sleep',
      plan: ['A menu, cart and checkout inside the chat, in English and Bangla', 'bKash, Nagad or USDT payments that confirm on their own', 'An admin panel for orders, stock and broadcasts to every customer'] },
    { svc: 'crypto', ic: 'btc', t: 'Customers pay in USDT and I never check a transfer again',
      plan: ['A unique amount or address for every order, so each payment matches itself', 'A watcher that counts confirmations on TRC20, BEP20 or ERC20', 'A signed webhook that marks the order paid and delivers it'] },
    { svc: 'ai-agent', ic: 'chip', t: 'Something that restocks and emails my suppliers for me',
      plan: ['Connect it to your stock sheet or database and to your email', 'Rules for budget, suppliers and when it must ask you first', 'A daily report on Telegram listing every action it took'] },
    { svc: 'ecommerce', ic: 'bag', t: 'An online shop for my clothing brand, with bKash checkout',
      plan: ['A storefront built around your own photos, quick on cheap phones', 'bKash, Nagad, card and cash on delivery at checkout', 'Order alerts on Telegram and an admin you can run from your phone'] },
    { svc: 'ai-chat', ic: 'chat', t: 'A chat on my site that answers customers at 3 a.m.',
      plan: ['Teach it your prices, policies and most common questions', 'Answers in English and Bangla, and hands over to you when unsure', 'A weekly summary of what people asked the most'] },
    { svc: 'web', ic: 'globe', t: 'A website that opens fast on my customers’ phones',
      plan: ['Rebuild the pages lean, with compressed photos and nothing extra', 'Keep your address and old links, set up Search Console and analytics', 'About a second to load on 4G, checked on a cheap phone'] },
    { svc: 'automation', ic: 'flow', t: 'Post to my Facebook page every morning, by itself',
      plan: ['Pull posts from a Google Sheet, a folder or a feed', 'Schedule them with captions and images at your best hours', 'A log, plus a Telegram alert if anything ever fails'] },
    { svc: 'minecraft', ic: 'cube', t: 'A Minecraft server with its own shop and ranks',
      plan: ['An economy with coins, a shop menu and daily rewards', 'Ranks, kits and permissions you manage in the game', 'A web store that hands out items after payment'] },
    { svc: 'mobile', ic: 'phone', t: 'An app my gym members can install on Android',
      plan: ['Class times, bookings and a membership card in the app', 'Notifications for new classes and renewals', 'A signed APK, or a Play Store release'] }
  ];
  var GENERIC = ['A short call to pin down exactly what you need, then a one-page plan and a fixed price', 'The build, with a preview link you can try on your phone as it grows', 'Launch at a quiet hour, then 30 days of free fixes'];
  var GUESS = [
    ['telegram', /telegram/], ['minecraft', /minecraft|spigot|plugin/], ['extension', /extension|chrome|browser/],
    ['crypto', /crypto|usdt|bitcoin|\bbtc\b|\beth\b|binance|\bcoin/], ['ecommerce', /shop|store|sell|product|cart|bkash|nagad|checkout/],
    ['ai-agent', /agent|restock|assistant|supplier/], ['ai-chat', /\bai\b|chat|answer|faq|support|gpt|claude/],
    ['mobile', /\bapp\b|android|\bios\b|apk|mobile/], ['desktop', /desktop|windows|\.?exe\b|software/],
    ['automation', /automat|schedule|every (day|morning|night|week)|scrap|sheet|post to|by itself/], ['telegram', /\bbot\b/]
  ];
  function guess(t) { t = t.toLowerCase(); for (var i = 0; i < GUESS.length; i++) if (GUESS[i][1].test(t)) return GUESS[i][0]; return 'web'; }
  function service(id) { return (XR.services || []).filter(function (s) { return s.id === id; })[0] || {}; }

  LAB.register('wishes', function (stage) {
    var rack = XR.$('.ew-rack', stage), slip = XR.$('.ew-slip', stage), form = XR.$('.ew-write', stage), input = XR.$('input', form);
    var hint = slip.innerHTML, mine = (XR.store(KEY) || []).slice(0, 3), list = [], on = -1;
    slip.id = 'ew-slip';

    function all() {
      return mine.map(function (t) { var id = guess(t), base = WISHES.filter(function (w) { return w.svc === id; })[0]; return { svc: id, t: t, mine: true, plan: base ? base.plan : GENERIC }; }).concat(WISHES);
    }
    function plaque(w, i) {
      var s = service(w.svc);
      return '<div role="listitem"><button type="button" class="ew-ema' + (w.mine ? ' ew-mine' : '') + '" data-w="' + i + '" aria-expanded="false" aria-controls="ew-slip">' +
        '<span class="ew-card"><span class="ew-face ew-front">' + (w.mine ? '<i>Your wish</i>' : XR.icon(w.ic)) + '<b>' + XR.esc(w.t) + '</b></span>' +
        '<span class="ew-face ew-back" aria-hidden="true"><span class="cr-seal jp">受</span><small>' + XR.esc(s.name || '') + '</small></span></span></button></div>';
    }
    function render() {
      list = all();
      rack.innerHTML = list.map(plaque).join('');
    }
    function read(i) {
      var w = list[i], s = service(w.svc);
      slip.innerHTML = '<div class="ew-slip-h"><span class="cr-seal jp" aria-hidden="true">願</span><div><small>How I’d build it</small><b>' + XR.esc(s.name || 'A custom build') + '</b></div></div>' +
        '<p class="ew-quote">“' + XR.esc(w.t) + '”</p>' +
        '<ol class="ew-plan">' + w.plan.map(function (p) { return '<li>' + XR.esc(p) + '</li>'; }).join('') + '</ol>' +
        (s.tech ? '<p class="ew-stack">' + s.tech.slice(0, 5).map(XR.esc).join(' / ') + '</p>' : '') +
        '<div class="ew-foot"><span class="ew-price">From <b>' + XR.fmtPrice(s.priceFrom || 30) + '</b>' + (s.days ? ' · ' + XR.esc(s.days) + ' days' : '') + '</span>' +
        '<a class="btn btn-primary btn-sm" href="hire?service=' + encodeURIComponent(w.svc) + '"' + (w.mine ? ' data-brief' : '') + '>Start this wish ' + XR.icon('arrow-right') + '</a></div>';
      slip.classList.remove('is-open'); void slip.offsetWidth; slip.classList.add('is-open');
    }
    function swing(b) {
      b.classList.remove('is-swing'); void b.offsetWidth; b.classList.add('is-swing');
    }
    function pick(i) {
      XR.$$('.ew-ema', rack).forEach(function (b, k) {
        var sel = k === i && on !== i;
        b.classList.toggle('is-on', sel);
        b.setAttribute('aria-expanded', sel);
      });
      if (on === i) { on = -1; slip.innerHTML = hint; return; }
      on = i;
      swing(XR.$('[data-w="' + i + '"]', rack));
      read(i);
    }
    rack.addEventListener('click', function (e) {
      var b = e.target.closest('.ew-ema');
      if (b) pick(+b.getAttribute('data-w'));
    });
    rack.addEventListener('animationend', function (e) { e.target.classList.remove('is-swing', 'is-new'); });
    slip.addEventListener('click', function (e) {
      if (e.target.closest('[data-brief]') && on > -1) XR.store('xr-wish-brief', list[on].t);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = input.value.replace(/\s+/g, ' ').trim();
      if (t.length < 4) { input.focus(); return; }
      mine.unshift(t.slice(0, 70));
      mine = mine.slice(0, 3);
      XR.store(KEY, mine);
      input.value = '';
      on = -1;
      render();
      var b = XR.$('[data-w="0"]', rack);
      b.classList.add('is-new');
      pick(0);
      if (XR.quest) try { XR.quest('stage-wishes'); } catch (err) {}
    });

    render();
  });
})();
