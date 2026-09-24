/* Lab stage 09 — AI support chat widget with Bangla/English, order tracking, human handoff + live designer */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  var T = {
    en: {
      greet: 'Hi! I’m {name}. Ask me about delivery, payments or returns — or track your order.',
      sugg: [['Delivery time?', 'delivery'], ['Payment methods', 'payment'], ['Return policy', 'returns'], ['Track my order', 'track'], ['Talk to a human', 'human']],
      delivery: 'Dhaka: same-day or next-day delivery. Outside Dhaka: 2–4 days. Free delivery on orders over ৳2,000.',
      payment: 'We accept bKash, Nagad, cards, crypto (USDT) and cash on delivery.',
      returns: 'You can return any item within 7 days of delivery. I can start the return for you right here.',
      track: 'Sure — what’s your order number? (for example 4821)',
      tracked: 'Order #{id} has shipped with our courier. Expected delivery: tomorrow before 6 PM. Tracking code: DK{id}BD.',
      deal: 'Today’s deal: 10% off all headphones with code DOKAN10.',
      hours: 'Our team is online 9 AM – 11 PM (GMT+6). I answer 24/7.',
      human: 'Connecting you to a human agent…',
      joined: 'Nusrat (Dokan team) joined the chat',
      humanMsg: 'Hi, I’m Nusrat. I’ve read your conversation — how can I help?',
      fallback: 'I’m not sure about that yet. Want me to connect you to a human?',
      placeholder: 'Ask anything…', langBtn: 'বাংলা', switched: 'Language: English'
    },
    bn: {
      greet: 'আসসালামু আলাইকুম! আমি {name}। কীভাবে সাহায্য করতে পারি?',
      sugg: [['ডেলিভারি কতদিনে?', 'delivery'], ['পেমেন্ট পদ্ধতি', 'payment'], ['রিটার্ন পলিসি', 'returns'], ['অর্ডার ট্র্যাক', 'track'], ['মানুষের সাথে কথা', 'human']],
      delivery: 'ঢাকায় ১–২ দিনে ডেলিভারি, ঢাকার বাইরে ২–৪ দিন। ৳২,০০০ এর বেশি অর্ডারে ডেলিভারি ফ্রি।',
      payment: 'আমরা বিকাশ, নগদ, কার্ড, ক্রিপ্টো (USDT) এবং ক্যাশ অন ডেলিভারি গ্রহণ করি।',
      returns: 'পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে রিটার্ন করতে পারবেন। চাইলে আমি এখনই রিটার্ন শুরু করে দিতে পারি।',
      track: 'অবশ্যই! আপনার অর্ডার নম্বর লিখুন (যেমন: 4821)।',
      tracked: 'অর্ডার #{id} পাঠানো হয়েছে। আনুমানিক ডেলিভারি: আগামীকাল সন্ধ্যা ৬টার আগে। ট্র্যাকিং কোড: DK{id}BD।',
      deal: 'আজকের অফার: DOKAN10 কোড দিয়ে সব হেডফোনে ১০% ছাড়।',
      hours: 'আমাদের টিম সকাল ৯টা থেকে রাত ১১টা পর্যন্ত অনলাইনে থাকে। আমি ২৪/৭ উত্তর দিই।',
      human: 'একজন প্রতিনিধির সাথে সংযুক্ত করা হচ্ছে…',
      joined: 'নুসরাত (Dokan টিম) চ্যাটে যুক্ত হয়েছেন',
      humanMsg: 'হ্যালো, আমি নুসরাত। আপনার কথোপকথন দেখেছি — কীভাবে সাহায্য করতে পারি?',
      fallback: 'দুঃখিত, বিষয়টি বুঝতে পারিনি। একজন মানুষের সাথে কথা বলবেন?',
      placeholder: 'কিছু জিজ্ঞেস করুন…', langBtn: 'English', switched: 'ভাষা: বাংলা'
    }
  };

  function intent(t) {
    t = t.toLowerCase();
    if (/deliver|shipping|ship|how long|ডেলিভারি|কতদিন/.test(t)) return 'delivery';
    if (/pay|bkash|nagad|card|crypto|usdt|cash|পেমেন্ট|বিকাশ|নগদ/.test(t)) return 'payment';
    if (/return|refund|exchange|রিটার্ন|ফেরত/.test(t)) return 'returns';
    if (/track|order status|where is|ট্র্যাক|অর্ডার/.test(t)) return 'track';
    if (/discount|deal|offer|coupon|promo|ছাড়|অফার/.test(t)) return 'deal';
    if (/hour|open|time|কখন|সময়/.test(t)) return 'hours';
    if (/human|agent|person|staff|মানুষ|প্রতিনিধি/.test(t)) return 'human';
    if (/^(hi|hello|hey|salam|assalam|হ্যালো|সালাম)/.test(t)) return 'greet';
    return null;
  }

  LAB.register('chat', function (stage) {
    var site = XR.$('.cs-site', stage), cw = XR.$('.cw', stage), box = XR.$('.cw-box', stage), launch = XR.$('.cw-launch', stage);
    var msgs = XR.$('.cw-msgs', stage), sugg = XR.$('.cw-sugg', stage), form = XR.$('.cw-input', stage), input = XR.$('input', form);
    var badge = XR.$('.cw-badge', stage), langBtn = XR.$('.cw-lang', stage), nameEl = XR.$('.cw-name', stage), nameInput = XR.$('#cw-botname', stage);
    var lang = 'en', awaitingOrder = false, human = false, greeted = false, queue = Promise.resolve();

    function botName() { return nameInput.value.trim() || 'Assistant'; }
    function add(text, who) {
      var m = document.createElement('div');
      m.className = 'cw-m ' + who;
      m.textContent = text;
      msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight;
    }
    function reply(text, who, delay) {
      queue = queue.then(function () {
        var t = document.createElement('div');
        t.className = 'cw-typing'; t.innerHTML = '<i></i><i></i><i></i>';
        msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight;
        return LAB.sleep(XR.reduce ? 0 : (delay || 700)).then(function () { t.remove(); add(text, who || 'bot'); });
      });
      return queue;
    }
    function renderSugg() {
      sugg.innerHTML = '';
      T[lang].sugg.forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = s[0];
        b.addEventListener('click', function () { add(s[0], 'me'); answer(s[1]); });
        sugg.appendChild(b);
      });
      input.placeholder = T[lang].placeholder;
      langBtn.textContent = T[lang].langBtn;
    }
    function answer(key, raw) {
      var L = T[lang];
      if (awaitingOrder && raw && /\d{3,}/.test(raw)) {
        awaitingOrder = false;
        return reply(L.tracked.replace(/\{id\}/g, raw.match(/\d{3,}/)[0]));
      }
      if (key === 'track') awaitingOrder = true;
      if (key === 'human') {
        if (human) return reply(L.humanMsg, 'bot human');
        human = true;
        reply(L.human);
        queue = queue.then(function () { return LAB.sleep(900); }).then(function () { add(L.joined, 'sys'); });
        return reply(L.humanMsg, 'bot human', 1200);
      }
      if (key === 'greet') return reply(L.greet.replace('{name}', botName()));
      if (key && L[key]) return reply(L[key]);
      return reply(L.fallback);
    }
    function open(v) {
      box.hidden = !v;
      launch.setAttribute('aria-label', v ? 'Close chat' : 'Open chat');
      if (v) {
        badge.hidden = true;
        if (!greeted) { greeted = true; reply(T[lang].greet.replace('{name}', botName()), 'bot', 500); }
        setTimeout(function () { if (XR.fine) input.focus({ preventScroll: true }); }, 300);
      }
    }
    launch.addEventListener('click', function () { open(box.hidden); });
    XR.$('.cw-x', stage).addEventListener('click', function () { open(false); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim(); if (!v) return;
      input.value = '';
      add(v, 'me');
      answer(intent(v), v);
    });
    langBtn.addEventListener('click', function () {
      lang = lang === 'en' ? 'bn' : 'en';
      add(T[lang].switched, 'sys');
      renderSugg();
      reply(T[lang].greet.replace('{name}', botName()));
    });

    // designer
    XR.$$('.swatches button', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        XR.$$('.swatches button', stage).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
        site.style.setProperty('--cw', b.getAttribute('data-color'));
      });
    });
    nameInput.addEventListener('input', function () { nameEl.textContent = botName(); });
    XR.$$('[data-pos]', stage).forEach(function (b) {
      if (b.classList.contains('cw')) return;
      b.addEventListener('click', function () {
        XR.$$('.cs-custom [data-pos]', stage).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
        cw.setAttribute('data-pos', b.getAttribute('data-pos'));
      });
    });

    renderSugg();
    setTimeout(function () { open(true); }, XR.reduce ? 0 : 1400);
  });
})();
