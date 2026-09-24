/* Lab stage 03 — working Telegram-style shop bot with crypto invoice + live admin panel */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  var PRODUCTS = [
    { id: 'lamp', name: 'Neon Katana Lamp', price: 59, icon: 'sword', c: '#ff2e4d', stock: 14, d: 'RGB desk lamp shaped like a katana. USB-C, 16M colors.' },
    { id: 'phones', name: 'Ronin Headphones', price: 129, icon: 'volume', c: '#27e1d6', stock: 6, d: 'Wireless ANC headphones, 40h battery, low-latency mode.' },
    { id: 'kb', name: 'Mecha Keyboard K2', price: 89, icon: 'grid', c: '#8b6cff', stock: 21, d: 'Hot-swap 75% mechanical keyboard with gasket mount.' },
    { id: 'hoodie', name: 'Kitsune Hoodie', price: 64, icon: 'tag', c: '#ffc24b', stock: 9, d: 'Heavyweight cotton hoodie with embroidered fox crest.' }
  ];

  LAB.register('telegram', function (stage) {
    var msgs = XR.$('.tg-msgs', stage), quick = XR.$('.tg-quick', stage), form = XR.$('.tg-input', stage), input = XR.$('input', form);
    var stateEl = XR.$('.tg-state', stage);
    var usersEl = XR.$('.tg-users', stage), ordersEl = XR.$('.tg-orders', stage), revEl = XR.$('.tg-rev', stage), evEl = XR.$('.tg-event', stage);
    var users = 2341, orderCount = 18, revenue = 1240, myOrders = [], mode = 'menu', lang = 'en';
    var queue = Promise.resolve();

    function scroll() { msgs.scrollTop = msgs.scrollHeight; }
    function add(html, who) {
      var m = document.createElement('div');
      m.className = 'tg-m ' + who;
      m.innerHTML = html + '<time>' + LAB.now() + '</time>';
      msgs.appendChild(m); scroll();
      return m;
    }
    function clearKbs() { XR.$$('.tg-kb', msgs).forEach(function (k) { XR.$$('button', k).forEach(function (b) { b.disabled = true; b.style.opacity = .45; }); }); }
    function kb(buttons) {
      var k = document.createElement('div');
      k.className = 'tg-kb';
      buttons.forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = b[0];
        if (b[2]) btn.className = 'wide';
        btn.addEventListener('click', function () {
          if (btn.disabled) return;
          clearKbs();
          add(XR.esc(b[0]), 'me');
          handle(b[1], b[3]);
        });
        k.appendChild(btn);
      });
      msgs.appendChild(k); scroll();
    }
    function bot(html, buttons, delay) {
      queue = queue.then(function () {
        var t = document.createElement('div');
        t.className = 'tg-typing'; t.innerHTML = '<i></i><i></i><i></i>';
        msgs.appendChild(t); scroll();
        stateEl.textContent = 'typing…';
        return LAB.sleep(XR.reduce ? 0 : (delay || 650)).then(function () {
          t.remove(); stateEl.textContent = 'online';
          add(html, 'bot');
          if (buttons) kb(buttons);
        });
      });
      return queue;
    }
    function bump(el, text) {
      el.textContent = text; el.classList.add('bump');
      setTimeout(function () { el.classList.remove('bump'); }, 900);
    }
    function event(text) {
      evEl.classList.add('is-new');
      evEl.lastElementChild.textContent = text;
      setTimeout(function () { evEl.classList.remove('is-new'); }, 1500);
    }
    function product(id) { return PRODUCTS.find(function (p) { return p.id === id; }); }

    var MENU = [['Catalog', 'catalog'], ['My orders', 'orders'], ['AI support', 'support'], ['Language', 'lang']];

    function start() {
      mode = 'menu';
      bot('Welcome to <b>Kage Shop</b>! I’m your 24/7 shopping bot.<br>Browse the catalog, pay with crypto and get instant order updates — all inside Telegram.', MENU, 500);
    }

    function handle(action, arg) {
      switch (action) {
        case 'start': return start();
        case 'catalog':
          mode = 'menu';
          return bot('<b>Catalog</b> — tap a product:<br>' + PRODUCTS.map(function (p) { return '• ' + p.name + ' — <b>' + p.price + ' USDT</b>'; }).join('<br>'),
            PRODUCTS.map(function (p) { return [p.name, 'product', false, p.id]; }).concat([['Back to menu', 'start', true]]));
        case 'product':
          var p = product(arg);
          return bot('<div class="tg-prod"><span style="--c:' + p.c + '">' + XR.icon(p.icon) + '</span><div><b>' + p.name + '</b><br>' + p.price + '.00 USDT · ' + p.stock + ' in stock</div></div>' + p.d,
            [['Buy now — ' + p.price + ' USDT', 'buy', true, p.id], ['Back to catalog', 'catalog', true]]);
        case 'buy':
          var b = product(arg), inv = 'K-' + (5000 + ((Math.random() * 4000) | 0));
          return bot('<b>Invoice ' + inv + '</b><br>Send exactly <b>' + b.price + '.00 USDT</b> (TRC20) to:<br><code style="font-size:11.5px;word-break:break-all">TXr9demoWa11etAddr3ssOnlyF0rPreview</code><br><br>Payment is detected automatically — no screenshots needed.',
            [['I have paid (simulate)', 'paid', true, { p: b, inv: inv }], ['Cancel', 'start', true]]);
        case 'paid':
          var o = arg;
          bot('Checking the blockchain… <b>1/3</b> confirmations', null, 700);
          bot('Confirmations <b>3/3</b>. Payment received.', null, 1000);
          return bot('<b>Order ' + o.inv + ' confirmed!</b><br>' + o.p.name + ' is being packed.<br>Tracking: <b>RJ' + ((Math.random() * 9e8) | 0) + 'BD</b><br>I’ll message you when it ships.', [['My orders', 'orders'], ['Keep shopping', 'catalog']], 700)
            .then(function () {
              myOrders.push(o);
              orderCount++; revenue += o.p.price;
              bump(ordersEl, orderCount); bump(revEl, revenue.toLocaleString('en-US') + ' USDT');
              event('New paid order ' + o.inv + ' — ' + o.p.price + ' USDT (auto-confirmed)');
            });
        case 'orders':
          if (!myOrders.length) return bot('You have no orders yet. Want to see the catalog?', [['Open catalog', 'catalog', true]]);
          return bot('<b>Your orders</b><br>' + myOrders.map(function (x) { return '• ' + x.inv + ' — ' + x.p.name + ' — <i>packing</i>'; }).join('<br>'), [['Back to menu', 'start', true]]);
        case 'support':
          mode = 'ai';
          return bot('You’re now chatting with <b>Kage AI support</b>. Ask me about shipping, returns, payments or discounts. Type <b>/start</b> to go back.');
        case 'lang':
          return bot('Choose your language:', [['English', 'setlang', false, 'en'], ['বাংলা', 'setlang', false, 'bn']]);
        case 'setlang':
          lang = arg;
          return bot(lang === 'bn' ? 'ভাষা বাংলা করা হয়েছে। কেনাকাটা শুরু করতে “Catalog” চাপুন।' : 'Language set to English.', MENU);
        case 'help':
          return bot('<b>Commands</b><br>/start — main menu<br>/catalog — browse products<br>/orders — your orders<br>/support — AI support chat<br>/help — this list');
      }
    }

    function ai(text) {
      var t = text.toLowerCase();
      if (/ship|deliver|how long|courier/.test(t)) return 'We ship worldwide. Dhaka: 1–2 days, rest of Bangladesh: 2–4 days, international: 7–14 days. You get tracking automatically.';
      if (/return|refund|exchange/.test(t)) return 'You can return any item within 7 days. Just send /orders and tap the order — I’ll create the return label for you.';
      if (/pay|crypto|usdt|btc|bkash|nagad|card/.test(t)) return 'We accept USDT, BTC, ETH, BNB, bKash and Nagad. Crypto payments confirm automatically in about a minute.';
      if (/discount|coupon|promo|code|cheap/.test(t)) return 'Use code <b>XIRAIYA10</b> for 10% off your first order.';
      if (/human|agent|person|admin/.test(t)) return 'Connecting you to a human agent… (demo) A team member will reply here within 10 minutes.';
      if (/^(hi|hello|hey|salam|assalam|yo)\b/.test(t)) return 'Hey! How can I help you today?';
      if (/bot|who made|developer|xiraiya/.test(t)) return 'This bot was built by <b>Xiraiya</b>, who builds Telegram bots like me for shops, communities and SaaS products.';
      return null;
    }

    function onText(text) {
      text = text.trim();
      if (!text) return;
      add(XR.esc(text), 'me');
      clearKbs();
      var cmd = text.toLowerCase();
      if (cmd.charAt(0) === '/') {
        var map = { '/start': 'start', '/catalog': 'catalog', '/orders': 'orders', '/support': 'support', '/help': 'help', '/menu': 'start' };
        if (map[cmd]) { if (map[cmd] !== 'support') mode = 'menu'; handle(map[cmd]); }
        else bot('Unknown command. Try /help');
        return;
      }
      var a = ai(text);
      if (a) bot(a, null, 900);
      else if (mode === 'ai') bot('Good question! I’ve forwarded it to the team — you’ll get an answer within 10 minutes. Meanwhile, try /catalog.', null, 900);
      else bot('Tap a button or type /help to see what I can do.', MENU);
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; onText(v); });
    ['/start', '/catalog', '/orders', '/support', '/help'].forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = c;
      b.addEventListener('click', function () { onText(c); });
      quick.appendChild(b);
    });
    XR.$('.tg-reset', stage).addEventListener('click', function () {
      msgs.innerHTML = ''; mode = 'menu'; queue = Promise.resolve(); start();
    });

    // live user counter
    setInterval(function () {
      if (document.hidden) return;
      users += 1 + ((Math.random() * 2) | 0);
      bump(usersEl, users.toLocaleString('en-US'));
      if (Math.random() < .4) event('New user joined via referral link');
    }, 7000);

    add('/start', 'me');
    start();
  });
})();
