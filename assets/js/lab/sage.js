/* Lab stage 07 — the toad sage: a support chat whose answers arrive in brush ink, in English or Bangla */
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

  var NAME = 'Gama, the shop’s toad sage';
  var STRIP = ['#f2d9c7', '#cfe0d8', '#f3e3b0', '#dcd3ee'];

  LAB.register('chat', function (stage) {
    var log = XR.$('.ts-log', stage), sugg = XR.$('.ts-sugg', stage), form = XR.$('.ts-ask', stage), input = XR.$('input', form), strips = XR.$('.ts-strips', stage);
    var lang = 'en', waiting = false, human = false, queue = Promise.resolve(), n = 0;

    function scroll() { log.scrollTop = log.scrollHeight; }
    function li(cls, html) {
      var el = document.createElement('li');
      el.className = cls;
      el.innerHTML = html;
      log.appendChild(el);
      while (log.children.length > 40) log.removeChild(log.firstChild);
      scroll();
      return el;
    }
    /* each word arrives like a fresh brush stroke */
    function ink(text) {
      var i = 0;
      return XR.esc(text).split(/(\s+)/).map(function (w) {
        if (!w.trim()) return w;
        return '<span class="ts-w" style="animation-delay:' + Math.min(i++ * 38, 2200) + 'ms">' + w + '</span>';
      }).join('');
    }
    function answer(text, who) {
      queue = queue.then(function () {
        stage.classList.add('is-thinking');
        var dots = li('ts-a', '<span class="cr-mini">' + (who ? '人' : '仙') + '</span><span class="ts-dots"><i></i><i></i><i></i></span>');
        return LAB.sleep(XR.reduce ? 0 : 650 + Math.min(900, text.length * 6)).then(function () {
          dots.remove();
          stage.classList.remove('is-thinking');
          li('ts-a' + (who ? ' is-human' : ''), '<span class="cr-mini">' + (who ? '人' : '仙') + '</span><p>' + ink(text) + '</p>');
        });
      });
      return queue;
    }
    function hang(text) {
      var s = document.createElement('span');
      s.className = 'ts-strip';
      s.textContent = text.length > 22 ? text.slice(0, 21) + '…' : text;
      s.style.setProperty('--c', STRIP[n % STRIP.length]);
      s.style.setProperty('--r', ((n % 3) - 1) * 3 + 'deg');
      strips.appendChild(s);
      while (strips.children.length > 4) strips.removeChild(strips.firstChild);
      n++;
    }
    function ask(text) {
      text = text.trim();
      if (!text) return;
      hang(text);
      li('ts-q', XR.esc(text)).style.setProperty('--c', STRIP[(n - 1) % STRIP.length]);
      var L = T[lang];
      if (waiting) {
        var m = text.match(/\d{3,6}/);
        if (m) { waiting = false; answer(L.tracked.replace(/\{id\}/g, m[0])); return; }
      }
      var k = intent(text);
      if (k === 'track') { waiting = true; answer(L.track); return; }
      if (k === 'human') {
        answer(L.human).then(function () {
          if (human) return;
          human = true;
          li('ts-sys', XR.esc(L.joined));
          return answer(L.humanMsg, true);
        });
        return;
      }
      if (k === 'greet') { answer(L.greet.replace('{name}', NAME)); return; }
      answer(k ? L[k] : L.fallback);
    }
    function paintSugg() {
      sugg.innerHTML = T[lang].sugg.map(function (s) { return '<button type="button">' + XR.esc(s[0]) + '</button>'; }).join('');
      input.placeholder = lang === 'bn' ? T.bn.placeholder : 'Ask the sage…';
    }
    sugg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) ask(b.textContent); });
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); });
    XR.$$('[data-lang]', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('data-lang') === lang) return;
        lang = b.getAttribute('data-lang');
        XR.$$('[data-lang]', stage).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
        li('ts-sys', XR.esc(T[lang].switched));
        paintSugg();
        answer(T[lang].greet.replace('{name}', lang === 'bn' ? 'গামা' : NAME));
      });
    });
    paintSugg();
    li('ts-a', '<span class="cr-mini">仙</span><p>' + ink(T.en.greet.replace('{name}', NAME)) + '</p>');
  });
})();
