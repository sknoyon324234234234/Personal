/* Lab stage 03 -- Summoning Scroll: pick a contract, trace the seal with your finger, and summon. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  var PACT = [
    { id: 'toad', name: 'Gama', title: 'Toad of Mount Myōboku', img: 'assets/img/characters/gama.webp', w: 703, h: 462, k: '蝦蟇',
      line: 'Who summoned me? You had better have snacks.', stats: [['Size', 'Mountain'], ['Chakra', '9,800'], ['Specialty', 'Toad Oil Flame Bullet']] },
    { id: 'slug', name: 'Katsuyu', title: 'Great Slug of Shikkotsu Forest', img: 'assets/img/characters/katsuyu.webp', w: 733, h: 925, k: '蛞蝓',
      line: 'I am here. I will heal everyone in the village.', stats: [['Size', 'Divides into thousands'], ['Chakra', '12,400'], ['Specialty', 'Healing and acid spray']] },
    { id: 'sage', name: 'Xiraiya', title: 'Reverse summon: the Toad Sage', img: 'assets/img/characters/xiraiya.webp', w: 514, h: 1069, k: '仙人',
      line: 'You summoned the great Toad Sage himself. Autographs later.', stats: [['Size', 'Legendary'], ['Chakra', 'Sage Mode'], ['Specialty', 'Rasengan and bad novels']] }
  ];
  var KANJI = '口寄せの術天地人火水';

  function seal() {
    var marks = '';
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2 - Math.PI / 2, x = 100 + Math.cos(a) * 78, y = 100 + Math.sin(a) * 78;
      marks += '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" transform="rotate(' + (i * 36) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + KANJI[i] + '</text>';
    }
    return '<svg class="su-seal" viewBox="0 0 200 200" role="application" tabindex="0" aria-label="Summoning seal. Trace around the circle with your finger or mouse, or press Enter to slam the seal.">' +
      '<circle class="su-ring" cx="100" cy="100" r="90"/><circle class="su-ring thin" cx="100" cy="100" r="64"/>' +
      '<g class="su-marks">' + marks + '</g>' +
      '<path class="su-spokes" d="M100 36v128M36 100h128M55 55l90 90M145 55l-90 90"/>' +
      '<circle class="su-trace" cx="100" cy="100" r="90" pathLength="100"/>' +
      '<circle class="su-core" cx="100" cy="100" r="22"/><text class="su-core-k" x="100" y="108">召</text>' +
      '</svg>';
  }
  function markup() {
    return '<div class="km-page su-page">' +
      '<div class="km-panel su-pacts" role="radiogroup" aria-label="Summoning contract">' +
        '<span class="km-tag is-red">Contract</span>' +
        PACT.map(function (p, i) { return '<button type="button" class="su-pact' + (i ? '' : ' is-on') + '" role="radio" aria-checked="' + (i ? 'false' : 'true') + '" data-p="' + p.id + '"><b class="jp">' + p.k + '</b><span>' + p.name + '</span></button>'; }).join('') +
      '</div>' +
      '<div class="km-panel km-tone su-scroll">' +
        '<span class="km-cap">口寄せ · Summoning</span>' +
        '<div class="su-rod l" aria-hidden="true"></div><div class="su-rod r" aria-hidden="true"></div>' +
        '<div class="su-stage">' + seal() + '<div class="su-smoke" aria-hidden="true"></div><img class="su-beast" alt="" loading="lazy" decoding="async"><div class="su-fx" aria-hidden="true"></div></div>' +
        '<p class="km-bubble is-top su-say" aria-live="polite">Pick a contract, then trace the seal all the way round.</p>' +
      '</div>' +
      '<div class="km-panel km-tone-2 su-card" aria-live="polite"><div class="su-steps"><span class="is-on">1 Pick</span><span>2 Trace</span><span>3 Summon</span></div><div class="su-info"></div>' +
        '<div class="su-acts"><button type="button" class="km-btn is-red su-slam"><span class="jp">印</span>Slam the seal</button><button type="button" class="km-btn su-again" hidden>' + XR.icon('refresh') + 'Dismiss</button></div></div>' +
    '</div>';
  }

  LAB.register('summon', function (el) {
    el.innerHTML = markup();
    var $ = function (s) { return el.querySelector(s); };
    var svg = $('.su-seal'), trace = $('.su-trace'), beast = $('.su-beast'), smoke = $('.su-smoke'), say = $('.su-say'), info = $('.su-info'), fx = $('.su-fx'), steps = el.querySelectorAll('.su-steps span');
    var cur = PACT[0], turned = 0, lastA = null, drag = false, busy = false, out = false;

    function step(n) { steps.forEach(function (s, i) { s.classList.toggle('is-on', i <= n); }); }
    function speak(t) { say.textContent = t; say.classList.remove('km-in'); void say.offsetWidth; say.classList.add('km-in'); }
    function progress(v) { trace.style.strokeDashoffset = (100 - v * 100).toFixed(1); svg.classList.toggle('is-lit', v > 0); }
    function angle(e) {
      var r = svg.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    }
    function summon() {
      if (busy) return;
      busy = true; out = true;
      progress(1); step(2);
      svg.classList.add('is-slam');
      smoke.innerHTML = '';
      for (var i = 0; i < 14; i++) {
        var a = i / 14 * Math.PI * 2;
        smoke.insertAdjacentHTML('beforeend', '<i style="--x:' + (Math.cos(a) * 42).toFixed(0) + '%;--y:' + (Math.sin(a) * 30).toFixed(0) + '%;--s:' + (0.8 + Math.random() * 0.8).toFixed(2) + ';--d:' + (Math.random() * 0.15).toFixed(2) + 's"></i>');
      }
      smoke.classList.remove('is-go'); void smoke.offsetWidth; smoke.classList.add('is-go');
      fx.innerHTML = '<span class="km-sfx is-pop is-gold" style="left:6%;top:6%">ドロン</span>';
      setTimeout(function () {
        beast.src = cur.img; beast.width = cur.w; beast.height = cur.h;
        beast.className = 'su-beast is-in is-' + cur.id;
        speak(cur.line);
        info.innerHTML = '<div class="km-in"><h3 class="km-h">' + cur.name + '</h3><small>' + cur.title + '</small><dl>' + cur.stats.map(function (s) { return '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>'; }).join('') + '</dl></div>';
        $('.su-slam').hidden = true; $('.su-again').hidden = false;
        busy = false;
      }, XR.reduce ? 100 : 650);
    }
    function dismiss() {
      out = false; turned = 0; lastA = null;
      beast.className = 'su-beast'; svg.classList.remove('is-slam');
      smoke.classList.remove('is-go'); fx.innerHTML = '';
      progress(0); step(0); info.innerHTML = '';
      $('.su-slam').hidden = false; $('.su-again').hidden = true;
      speak('The ' + cur.name + ' contract is open. Trace the seal again.');
    }

    el.querySelector('.su-pacts').addEventListener('click', function (e) {
      var b = e.target.closest('.su-pact');
      if (!b || busy) return;
      el.querySelectorAll('.su-pact').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
      cur = PACT.filter(function (p) { return p.id === b.getAttribute('data-p'); })[0];
      if (out) dismiss(); else { turned = 0; progress(0); step(0); speak('The ' + cur.name + ' contract is open. Trace the seal all the way round.'); }
    });
    svg.addEventListener('pointerdown', function (e) {
      if (out || busy) return;
      drag = true; lastA = angle(e); step(1);
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    svg.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var a = angle(e), d = a - lastA;
      if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
      turned += Math.abs(d); lastA = a;
      var v = Math.min(1, turned / (Math.PI * 2 * 0.92));
      progress(v);
      if (v >= 1) { drag = false; summon(); }
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { svg.addEventListener(ev, function () { if (drag && !out) speak('Keep going, all the way round the seal.'); drag = false; }); });
    svg.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (out) dismiss(); else summon(); } });
    $('.su-slam').addEventListener('click', summon);
    $('.su-again').addEventListener('click', dismiss);
    progress(0);
  });
})();
