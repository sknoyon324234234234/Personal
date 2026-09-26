/* Lab stage 02 -- Chakra Nature Test: hold to channel chakra into the paper and watch how it reacts. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  var NATURES = [
    { id: 'fire', k: '火', name: 'Fire', jp: 'Katon', react: 'The paper bursts into flame and burns away.', jutsu: 'Great Fireball, Phoenix Flower', beats: 'wind', users: 'Itachi, Sasuke, Hiruzen', col: '#e0442e' },
    { id: 'wind', k: '風', name: 'Wind', jp: 'Fūton', react: 'The paper slices cleanly in two.', jutsu: 'Rasenshuriken, Vacuum Blade', beats: 'lightning', users: 'Naruto, Asuma, Temari', col: '#2c9f7b' },
    { id: 'lightning', k: '雷', name: 'Lightning', jp: 'Raiton', react: 'The paper crinkles and crumples with a snap.', jutsu: 'Chidori, Lightning Blade', beats: 'earth', users: 'Kakashi, Sasuke, A', col: '#d9a441' },
    { id: 'earth', k: '土', name: 'Earth', jp: 'Doton', react: 'The paper turns to dirt and crumbles apart.', jutsu: 'Earth Wall, Mud Dragon', beats: 'water', users: 'Ōnoki, Deidara, Kurotsuchi', col: '#8a5a2b' },
    { id: 'water', k: '水', name: 'Water', jp: 'Suiton', react: 'The paper soaks through and goes limp.', jutsu: 'Water Dragon, Water Prison', beats: 'fire', users: 'Kisame, Tobirama, Zabuza', col: '#2f5f9e' }
  ];
  var COLS = 2, ROWS = 5;

  function slipFace() {
    return '<span class="ac-face"><b class="jp">性</b><small>Chakra paper</small><em class="jp">木ノ葉</em></span>';
  }
  function markup() {
    var bits = '';
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      bits += '<span class="ac-bit" style="--c:' + c + ';--r:' + r + ';--rx:' + ((Math.random() - .5) * 120).toFixed(0) + 'deg;--dx:' + ((Math.random() - .5) * 60).toFixed(0) + 'px;--dl:' + (Math.random() * .25).toFixed(2) + 's"><span class="ac-in">' + slipFace() + '</span></span>';
    }
    return '<div class="km-page ac-page">' +
      '<div class="km-panel km-tone ac-lab">' +
        '<span class="km-focus" aria-hidden="true"></span>' +
        '<span class="km-cap">Test · 性質変化</span>' +
        '<div class="ac-hold"><div class="ac-slip" aria-hidden="true">' + bits + '<i class="ac-flame"></i><i class="ac-wet"></i></div></div>' +
        '<div class="ac-fx" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="km-panel ac-ctrl">' +
        '<label class="ac-name"><span>Your ninja name</span><input type="text" maxlength="24" placeholder="Type a name (optional)" autocomplete="off"></label>' +
        '<div class="ac-meter" aria-hidden="true"><i></i></div>' +
        '<button type="button" class="km-btn is-red ac-go"><span class="jp">氣</span><span class="ac-go-t">Hold to channel chakra</span></button>' +
        '<p class="ac-help">Press and hold. Space or Enter works too.</p>' +
      '</div>' +
      '<div class="km-panel km-tone-2 ac-out" aria-live="polite">' +
        '<p class="ac-wait">Your result appears here once the paper reacts.</p>' +
      '</div>' +
    '</div>';
  }

  LAB.register('chakra', function (el) {
    el.innerHTML = markup();
    var $ = function (s) { return el.querySelector(s); };
    var slip = $('.ac-slip'), meter = $('.ac-meter i'), go = $('.ac-go'), goT = $('.ac-go-t'), out = $('.ac-out'), name = $('.ac-name input'), fx = $('.ac-fx'), lab = $('.ac-lab');
    var p = 0, holding = false, raf = 0, last = 0, spent = false;

    function pick() {
      var n = name.value.trim();
      return NATURES[n ? LAB.hash(n.toLowerCase()) % NATURES.length : (Math.random() * NATURES.length) | 0];
    }
    function tick(t) {
      var dt = Math.min(64, t - (last || t)); last = t;
      p = XR.clamp(p + (holding ? dt / 1500 : -dt / 900), 0, 1);
      meter.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      slip.style.setProperty('--q', p.toFixed(3));
      lab.classList.toggle('is-charging', holding);
      if (p >= 1) { react(); return; }
      if (holding || p > 0) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
    }
    function start(e) {
      if (e) e.preventDefault();
      if (spent) { reset(); return; }
      holding = true;
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    }
    function stop() { holding = false; }
    function react() {
      holding = false; spent = true; cancelAnimationFrame(raf); raf = 0; last = 0;
      var n = pick();
      slip.className = 'ac-slip is-' + n.id;
      lab.classList.remove('is-charging');
      var s = document.createElement('span');
      s.className = 'km-sfx is-pop ' + (n.id === 'fire' ? 'is-red' : n.id === 'lightning' ? 'is-gold' : '');
      s.textContent = { fire: 'ボッ', wind: 'スパッ', lightning: 'バチッ', earth: 'ボロボロ', water: 'ジュワ' }[n.id];
      s.style.left = '8%'; s.style.top = '10%';
      fx.innerHTML = ''; fx.appendChild(s);
      var beats = NATURES.filter(function (x) { return x.id === n.beats; })[0];
      var weak = NATURES.filter(function (x) { return x.beats === n.id; })[0];
      var who = name.value.trim();
      out.style.setProperty('--nc', n.col);
      out.innerHTML = '<div class="ac-res km-in">' +
        '<b class="ac-k jp">' + n.k + '</b>' +
        '<div><span class="km-tag is-red">' + (who ? XR.esc(who) + ' · ' : '') + n.jp + '</span>' +
        '<h3 class="km-h">' + n.name + ' nature</h3>' +
        '<p>' + n.react + '</p>' +
        '<dl><dt>Signature jutsu</dt><dd>' + n.jutsu + '</dd><dt>Strong against</dt><dd>' + beats.name + ' ' + beats.k + '</dd><dt>Weak against</dt><dd>' + weak.name + ' ' + weak.k + '</dd><dt>Shared with</dt><dd>' + n.users + '</dd></dl></div>' +
      '</div>';
      goT.textContent = 'Take a new slip';
    }
    function reset() {
      spent = false; p = 0;
      slip.className = 'ac-slip';
      slip.style.setProperty('--q', 0);
      meter.style.transform = 'scaleX(0)';
      fx.innerHTML = '';
      goT.textContent = 'Hold to channel chakra';
    }

    go.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { go.addEventListener(ev, stop); });
    go.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    go.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); else if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); });
    go.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
    name.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go.focus(); } });
  });
})();
