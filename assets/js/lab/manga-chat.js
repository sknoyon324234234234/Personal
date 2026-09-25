/* Lab stage 07 -- Ask Sensei: a manga-page support chat, in English or Bangla. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  var IMG = { sensei: 'assets/img/characters/xiraiya-avatar.webp', human: 'assets/img/characters/tsunade.webp' };
  var NAME = { en: 'Sensei', bn: 'সেনসেই' };
  var SFX = 'ピコン';

  var T = {
    en: {
      greet: 'Hi! I’m {name}. Ask me about delivery, payments or returns — or track your order.',
      sugg: [['Delivery time?', 'delivery'], ['Payment methods', 'payment'], ['Return policy', 'returns'], ['Track my order', 'track'], ['Talk to a human', 'human']],
      delivery: 'Dhaka: same-day or next-day delivery. Outside Dhaka: 2–4 days. Free delivery on orders over ৳2,000.',
      payment: 'We accept bKash, Nagad, cards, crypto (USDT) and cash on delivery.',
      returns: 'You can return any item within 7 days of delivery. I can start the return for you right here.',
      track: 'Sure — what’s your order number? (for example 4821)',
      tracked: 'Order #{id} has shipped with our courier. Expected delivery: tomorrow before 6 PM. Tracking code: KG{id}BD.',
      deal: 'Today’s deal: 10% off all headphones with code KAGE10.',
      hours: 'Our team is online 9 AM – 11 PM (GMT+6). I answer 24/7.',
      human: 'Connecting you to a human agent…',
      joined: 'Nusrat (Kage Shop team) joined the chat',
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
      tracked: 'অর্ডার #{id} পাঠানো হয়েছে। আনুমানিক ডেলিভারি: আগামীকাল সন্ধ্যা ৬টার আগে। ট্র্যাকিং কোড: KG{id}BD।',
      deal: 'আজকের অফার: KAGE10 কোড দিয়ে সব হেডফোনে ১০% ছাড়।',
      hours: 'আমাদের টিম সকাল ৯টা থেকে রাত ১১টা পর্যন্ত অনলাইনে থাকে। আমি ২৪/৭ উত্তর দিই।',
      human: 'একজন প্রতিনিধির সাথে সংযুক্ত করা হচ্ছে…',
      joined: 'নুসরাত (Kage Shop টিম) চ্যাটে যুক্ত হয়েছেন',
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

  function markup() {
    return '' +
      '<div class="mse-page km-page">' +
        '<span class="km-cap">07 · Ask Sensei</span>' +
        '<div class="mse-head km-panel km-tone-dark">' +
          '<div class="km-speed is-dark" aria-hidden="true"></div>' +
          '<div class="mse-who">' +
            '<span class="mse-port"><img class="mse-portimg" src="' + IMG.sensei + '" alt="Sensei" width="56" height="56" loading="lazy"></span>' +
            '<span class="mse-id"><b class="mse-name km-h">Sensei</b><small class="mse-status"><i class="mse-dot" aria-hidden="true"></i>Kage Shop support · online</small></span>' +
          '</div>' +
          '<div class="mse-lang" role="radiogroup" aria-label="Language">' +
            '<button type="button" class="km-btn is-on" data-lang="en" role="radio" aria-checked="true">EN</button>' +
            '<button type="button" class="km-btn" data-lang="bn" role="radio" aria-checked="false">বাংলা</button>' +
          '</div>' +
        '</div>' +
        '<div class="mse-body km-panel km-tone">' +
          '<div class="km-hlines" aria-hidden="true"></div>' +
          '<ul class="mse-log" role="log" aria-live="polite" aria-label="Conversation with sensei"></ul>' +
        '</div>' +
        '<div class="mse-foot km-panel">' +
          '<div class="mse-sugg"></div>' +
          '<form class="mse-ask">' +
            '<input type="text" class="mse-in" aria-label="Ask sensei" placeholder="Ask anything…" autocomplete="off" maxlength="200">' +
            '<button type="submit" class="km-btn is-red mse-send" aria-label="Send message">' + XR.icon('send') + '</button>' +
          '</form>' +
        '</div>' +
      '</div>';
  }

  LAB.register('chat', function (stage) {
    stage.innerHTML = markup();
    var log = XR.$('.mse-log', stage);
    var sugg = XR.$('.mse-sugg', stage);
    var form = XR.$('.mse-ask', stage);
    var input = XR.$('.mse-in', stage);
    var portImg = XR.$('.mse-portimg', stage);
    var nameEl = XR.$('.mse-name', stage);
    var statusEl = XR.$('.mse-status', stage);
    var langBtns = XR.$$('[data-lang]', stage);
    var lang = 'en', waiting = false, human = false, queue = Promise.resolve(), n = 0;

    function scrollBottom() { log.scrollTop = log.scrollHeight; }

    function row(cls, inner) {
      var li = document.createElement('li');
      li.className = 'mse-row km-in ' + cls;
      li.innerHTML = inner;
      log.appendChild(li);
      while (log.children.length > 30) log.removeChild(log.firstChild);
      scrollBottom();
      return li;
    }

    /* a small round portrait, in a bold ink ring, next to each answer */
    function face(who) {
      var human2 = who === 'human';
      var src = human2 ? IMG.human : IMG.sensei;
      var alt = human2 ? 'Nusrat' : 'Sensei';
      return '<span class="mse-face' + (human2 ? ' is-human' : '') + '"><img src="' + src + '" alt="' + alt + '" width="40" height="40" loading="lazy"></span>';
    }

    /* answers arrive word by word, like fresh brush strokes */
    function ink(text) {
      var i = 0;
      return XR.esc(text).split(/(\s+)/).map(function (w) {
        if (!w.trim()) return w;
        return '<span class="mse-w" style="animation-delay:' + Math.min(i++ * 32, 1600) + 'ms">' + w + '</span>';
      }).join('');
    }

    /* a short line only: an occasional small sfx when an answer lands, never on long ones */
    function landSfx(text) {
      n++;
      if (text.length > 60 || n % 2 !== 0) return '';
      return '<span class="km-sfx is-gold is-pop mse-sfx" aria-hidden="true">' + SFX + '</span>';
    }

    function answer(text, opts) {
      opts = opts || {};
      queue = queue.then(function () {
        var think = row('is-think', face(opts.who) + '<span class="mse-bub"><span class="km-think">…</span></span>');
        var wait = (XR.reduce || document.hidden) ? 0 : Math.min(1400, 550 + text.length * 6);
        return LAB.sleep(wait).then(function () {
          think.remove();
          /* the jagged shout strip is only for short lines -- long ones stay a normal bubble */
          var shout = !!opts.shout && text.length <= 60;
          var cls = 'is-a' + (opts.who === 'human' ? ' is-human' : '');
          var bub = shout ? '<span class="km-shout">' + XR.esc(text) + '</span>' : '<span class="km-bubble">' + ink(text) + '</span>';
          row(cls + (shout ? ' km-shake' : ''), face(opts.who) + '<span class="mse-bub">' + bub + landSfx(text) + '</span>');
        });
      });
      return queue;
    }

    function ask(text) {
      text = (text || '').trim();
      if (!text) return;
      row('is-q', '<span class="km-bubble is-right">' + XR.esc(text) + '</span>');
      var L = T[lang];
      if (waiting) {
        var m = text.match(/\d{3,6}/);
        if (m) { waiting = false; answer(L.tracked.replace(/\{id\}/g, m[0]), { who: human ? 'human' : 'sensei', shout: true }); return; }
      }
      var k = intent(text);
      if (k === 'track') { waiting = true; answer(L.track, { who: human ? 'human' : 'sensei' }); return; }
      if (k === 'human') {
        answer(L.human, { who: human ? 'human' : 'sensei' }).then(function () {
          if (human) return;
          human = true;
          swapToHuman();
          row('is-sys', '<span class="km-tag is-red">' + XR.esc(L.joined) + '</span>');
          return answer(L.humanMsg, { who: 'human' });
        });
        return;
      }
      if (k === 'greet') { answer(L.greet.replace('{name}', NAME[lang]), { who: human ? 'human' : 'sensei' }); return; }
      answer(k ? L[k] : L.fallback, { who: human ? 'human' : 'sensei', shout: k === 'deal' });
    }

    function swapToHuman() {
      portImg.src = IMG.human;
      portImg.alt = 'Nusrat';
      nameEl.textContent = 'Nusrat';
      statusEl.innerHTML = '<i class="mse-dot" aria-hidden="true"></i>Nusrat joined';
    }

    function paintSugg() {
      sugg.innerHTML = T[lang].sugg.map(function (s) {
        return '<button type="button" class="km-btn">' + XR.esc(s[0]) + '</button>';
      }).join('');
      input.placeholder = T[lang].placeholder;
    }

    sugg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) ask(b.textContent);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = '';
      ask(v);
    });
    langBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var next = b.getAttribute('data-lang');
        if (next === lang) return;
        lang = next;
        langBtns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        row('is-sys', '<span class="km-tag">' + XR.esc(T[lang].switched) + '</span>');
        paintSugg();
        answer(T[lang].greet.replace('{name}', NAME[lang]), { who: human ? 'human' : 'sensei' });
      });
    });

    paintSugg();
    /* greeting lands immediately, no thinking delay, so no question can appear above it */
    row('is-a', face('sensei') + '<span class="mse-bub"><span class="km-bubble">' + ink(T.en.greet.replace('{name}', NAME.en)) + '</span></span>');
  });
})();
