/* Lab stage 01 -- Hand-Sign Dojo: weave the twelve signs in order to cast a jutsu in the panel. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  var SIGNS = [
    ['rat', '子', 'Rat'], ['ox', '丑', 'Ox'], ['tiger', '寅', 'Tiger'], ['hare', '卯', 'Hare'],
    ['dragon', '辰', 'Dragon'], ['snake', '巳', 'Snake'], ['horse', '午', 'Horse'], ['ram', '未', 'Ram'],
    ['monkey', '申', 'Monkey'], ['bird', '酉', 'Bird'], ['dog', '戌', 'Dog'], ['boar', '亥', 'Boar']
  ];
  var BY = {};
  SIGNS.forEach(function (s) { BY[s[0]] = s; });

  var JUTSU = [
    { id: 'fire', name: 'Fire Style: Great Fireball', jp: '火遁', seq: ['snake', 'ram', 'monkey', 'boar', 'horse', 'tiger'], sfx: 'ゴォォ', line: 'Fire Style! Great Fireball!' },
    { id: 'bolt', name: 'Chidori', jp: '千鳥', seq: ['ox', 'hare', 'monkey'], sfx: 'チチチ', line: 'Chidori! A thousand birds!' },
    { id: 'clone', name: 'Shadow Clone', jp: '分身', seq: ['ram', 'snake', 'tiger'], sfx: 'ボン', line: 'Shadow Clone Jutsu!' },
    { id: 'summon', name: 'Summoning', jp: '口寄せ', seq: ['boar', 'dog', 'bird', 'monkey', 'ram'], sfx: 'ドロン', line: 'Summoning Jutsu! Come out, Gama!' },
    { id: 'water', name: 'Water Dragon', jp: '水遁', seq: ['ox', 'monkey', 'hare', 'rat', 'boar', 'bird'], sfx: 'ザバァ', line: 'Water Style! Water Dragon!' },
    { id: 'wind', name: 'Great Breakthrough', jp: '風遁', seq: ['tiger', 'ox', 'dog', 'hare', 'snake'], sfx: 'ビュウ', line: 'Wind Style! Great Breakthrough!' }
  ];
  var MAX = 6;

  function markup() {
    return '<div class="km-page as-page">' +
      '<div class="km-panel km-tone-dark as-arena">' +
        '<span class="km-speed is-dark" aria-hidden="true"></span>' +
        '<span class="km-cap">Dojo · 印を結べ</span>' +
        '<img class="as-hero" src="assets/img/characters/xiraiya-arms.webp" alt="" width="407" height="1062" loading="lazy" decoding="async">' +
        '<div class="as-fx" aria-hidden="true"></div>' +
        '<p class="km-bubble as-say" aria-live="polite">Weave the signs. I will know the jutsu.</p>' +
      '</div>' +
      '<div class="km-panel km-tone as-track">' +
        '<ol class="as-slots" aria-label="Signs woven so far"></ol>' +
        '<div class="as-acts"><button type="button" class="km-btn as-undo">' + XR.icon('arrow-left') + 'Undo</button><button type="button" class="km-btn as-clear">Clear</button></div>' +
      '</div>' +
      '<div class="km-panel as-pad" role="group" aria-label="Hand signs">' +
        SIGNS.map(function (s) { return '<button type="button" class="as-sign" data-sign="' + s[0] + '"><b class="jp">' + s[1] + '</b><span>' + s[2] + '</span></button>'; }).join('') +
      '</div>' +
      '<div class="km-panel km-tone-2 as-book">' +
        '<div class="as-book-h"><span class="km-tag is-red">Jutsu scroll</span><label class="as-hint"><input type="checkbox" checked> Sensei hints</label></div>' +
        '<ul class="as-list">' + JUTSU.map(function (j) {
          return '<li><button type="button" class="as-j" data-j="' + j.id + '"><b class="jp">' + j.jp + '</b><span><strong>' + j.name + '</strong><small>' + j.seq.map(function (k) { return BY[k][2]; }).join(' · ') + '</small></span><i aria-hidden="true">' + XR.icon('check') + '</i></button></li>';
        }).join('') + '</ul>' +
      '</div>' +
    '</div>';
  }

  LAB.register('signs', function (el) {
    el.innerHTML = markup();
    var $ = function (s) { return el.querySelector(s); };
    var slots = $('.as-slots'), fx = $('.as-fx'), say = $('.as-say'), arena = $('.as-arena'), hint = $('.as-hint input');
    var seq = [], busy = false, done = {};
    try { done = XR.store('xr-lab-signs') || {}; } catch (e) { done = {}; }

    function prefixes() { return JUTSU.filter(function (j) { return seq.every(function (s, i) { return j.seq[i] === s; }); }); }
    function paint() {
      var html = '';
      for (var i = 0; i < MAX; i++) {
        var s = seq[i] && BY[seq[i]];
        html += '<li class="' + (s ? 'is-on' : '') + '">' + (s ? '<b class="jp">' + s[1] + '</b><span>' + s[2] + '</span>' : '<i>' + (i + 1) + '</i>') + '</li>';
      }
      slots.innerHTML = html;
      var next = {};
      if (hint.checked) prefixes().forEach(function (j) { if (j.seq[seq.length]) next[j.seq[seq.length]] = 1; });
      el.querySelectorAll('.as-sign').forEach(function (b) { b.classList.toggle('is-next', !!next[b.getAttribute('data-sign')]); });
      el.querySelectorAll('.as-j').forEach(function (b) { b.classList.toggle('is-done', !!done[b.getAttribute('data-j')]); });
    }
    function speak(t) { say.textContent = t; say.classList.remove('km-in'); void say.offsetWidth; say.classList.add('km-in'); }
    function sfx(text, cls) {
      var s = document.createElement('span');
      s.className = 'km-sfx is-pop ' + (cls || '');
      s.textContent = text;
      s.style.left = (18 + Math.random() * 30) + '%'; s.style.top = (8 + Math.random() * 20) + '%';
      fx.appendChild(s);
    }
    function misfire() {
      speak('The chakra fizzles. No jutsu starts that way. Try again.');
      arena.classList.remove('km-shake'); void arena.offsetWidth; arena.classList.add('km-shake');
      seq = []; paint();
    }
    function cast(j) {
      busy = true;
      fx.innerHTML = '';
      fx.className = 'as-fx is-' + j.id;
      arena.classList.add('is-casting');
      speak(j.line);
      sfx(j.sfx, j.id === 'fire' ? 'is-red' : j.id === 'bolt' || j.id === 'wind' ? '' : 'is-gold');
      if (j.id === 'fire') fx.insertAdjacentHTML('beforeend', '<i class="as-ball"></i><i class="as-ball b2"></i>');
      if (j.id === 'bolt') fx.insertAdjacentHTML('beforeend', '<svg class="as-bolt" viewBox="0 0 300 200" preserveAspectRatio="none"><path d="M10 110 L60 90 L80 120 L130 70 L150 105 L200 60 L220 95 L290 40"/><path class="b2" d="M20 140 L70 120 L95 150 L150 100 L175 130 L230 85 L285 110"/></svg><i class="as-flash"></i>');
      if (j.id === 'clone') [12, 30, 62, 80].forEach(function (x, i) { fx.insertAdjacentHTML('beforeend', '<img class="as-clone" style="left:' + x + '%;--d:' + (i * 0.12) + 's" src="assets/img/characters/xiraiya-arms.webp" alt=""><i class="as-puff" style="left:' + (x + 4) + '%;--d:' + (i * 0.12) + 's"></i>'); });
      if (j.id === 'summon') fx.insertAdjacentHTML('beforeend', '<i class="as-puff big"></i><i class="as-puff big p2"></i><img class="as-gama" src="assets/img/characters/gama.webp" alt="">');
      if (j.id === 'water') fx.insertAdjacentHTML('beforeend', '<svg class="as-wave" viewBox="0 0 300 120" preserveAspectRatio="none"><path d="M0 70 C40 30 70 100 110 60 S180 20 220 60 S280 90 300 50 V120 H0Z"/><path class="w2" d="M0 90 C50 60 80 110 130 80 S200 50 240 80 S290 100 300 80 V120 H0Z"/></svg>');
      if (j.id === 'wind') for (var i = 0; i < 9; i++) fx.insertAdjacentHTML('beforeend', '<i class="as-gust" style="top:' + (10 + i * 9) + '%;--d:' + (i * 0.06) + 's"></i>');
      done[j.id] = 1;
      try { XR.store('xr-lab-signs', done); } catch (e) { /* ignore */ }
      var all = JUTSU.every(function (x) { return done[x.id]; });
      setTimeout(function () {
        arena.classList.remove('is-casting');
        busy = false; seq = []; paint();
        if (all && !el.getAttribute('data-master')) { el.setAttribute('data-master', '1'); speak('All six jutsu! You are ready for the Chunin exam.'); }
      }, XR.reduce ? 600 : 2200);
      paint();
    }
    function add(k) {
      if (busy || seq.length >= MAX) return;
      seq.push(k);
      var pf = prefixes();
      if (!pf.length) { misfire(); return; }
      var hit = pf.filter(function (j) { return j.seq.length === seq.length; })[0];
      paint();
      if (hit) setTimeout(function () { cast(hit); }, 180);
      else speak(BY[k][2] + '… keep going.');
    }

    el.querySelector('.as-pad').addEventListener('click', function (e) { var b = e.target.closest('.as-sign'); if (b) add(b.getAttribute('data-sign')); });
    $('.as-undo').addEventListener('click', function () { if (!busy) { seq.pop(); paint(); } });
    $('.as-clear').addEventListener('click', function () { if (!busy) { seq = []; paint(); speak('Clean hands. Start again.'); } });
    hint.addEventListener('change', paint);
    el.querySelector('.as-list').addEventListener('click', function (e) {
      var b = e.target.closest('.as-j');
      if (!b || busy) return;
      var j = JUTSU.filter(function (x) { return x.id === b.getAttribute('data-j'); })[0];
      seq = []; paint();
      speak('Watch closely: ' + j.seq.map(function (k) { return BY[k][2]; }).join(', ') + '.');
      /* demonstrate by weaving the signs one at a time */
      busy = true;
      j.seq.forEach(function (k, i) {
        setTimeout(function () {
          var btn = el.querySelector('.as-sign[data-sign="' + k + '"]');
          if (btn) { btn.classList.add('is-press'); setTimeout(function () { btn.classList.remove('is-press'); }, 260); }
          seq.push(k); paint();
          if (i === j.seq.length - 1) setTimeout(function () { cast(j); }, 220);
        }, (XR.reduce ? 90 : 320) * (i + 1));
      });
    });
    paint();
  });
})();
