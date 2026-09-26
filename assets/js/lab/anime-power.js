/* Lab stage 07 -- Power Scouter: hold to power up through the Super Saiyan forms, then fire a Kamehameha. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  var FORMS = [
    { at: 0, id: 'base', name: 'Base form', line: 'Scouter on. Show me what you have.' },
    { at: 9001, id: 'over', name: 'Over 9000', line: 'It’s over 9000!', sfx: 'ピピピ' },
    { at: 50000, id: 'ssj', name: 'Super Saiyan', line: 'Golden hair. Green eyes. The legend is real.', sfx: 'ゴゴゴ' },
    { at: 250000, id: 'ssj2', name: 'Super Saiyan 2', line: 'Lightning in the aura. This is Super Saiyan 2.', sfx: 'バチバチ' },
    { at: 1500000, id: 'ssj3', name: 'Super Saiyan 3', line: 'The ground is shaking. Super Saiyan 3!', sfx: 'ドドド' },
    { at: 12000000, id: 'blue', name: 'Super Saiyan Blue', line: 'A god’s ki. The scouter cannot read this.', sfx: 'キィィン' }
  ];
  var MAXP = 20000000;

  function fmt(n) { return n >= MAXP ? 'ERROR' : Math.round(n).toLocaleString('en-US'); }

  LAB.register('power', function (el) {
    el.innerHTML = '<div class="km-page ap-page">' +
      '<div class="km-panel ap-arena f-base">' +
        '<span class="km-speed is-dark" aria-hidden="true"></span>' +
        '<span class="km-cap">戦闘力 · Power level</span>' +
        '<div class="ap-aura" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<div class="ap-sparks" aria-hidden="true"></div>' +
        '<img class="ap-hero" src="assets/img/characters/xiraiya-arms.webp" alt="" width="407" height="1062" loading="lazy" decoding="async">' +
        '<div class="ap-scouter" role="status" aria-live="off"><small>Scouter</small><b class="ap-num">5</b><span class="ap-form">Base form</span></div>' +
        '<div class="ap-beam" aria-hidden="true"><i></i></div>' +
        '<div class="ap-kame" aria-hidden="true"></div>' +
        '<div class="ap-fx" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="km-panel km-tone ap-ctrl">' +
        '<p class="km-bubble ap-say" aria-live="polite">Scouter on. Show me what you have.</p>' +
        '<ol class="ap-forms" aria-label="Forms">' + FORMS.slice(1).map(function (f) { return '<li data-f="' + f.id + '"><i></i>' + f.name + '</li>'; }).join('') + '</ol>' +
        '<div class="ap-acts"><button type="button" class="km-btn is-red ap-charge"><span class="jp">気</span>Hold to power up</button>' +
        '<button type="button" class="km-btn is-ink ap-fire" disabled><span class="jp">波</span>Kamehameha</button>' +
        '<button type="button" class="km-btn ap-reset">' + XR.icon('refresh') + '<span class="sr-only">Power down</span></button></div>' +
        '<p class="ap-help">Hold the button, or hold Space while it has focus. Kamehameha unlocks at Super Saiyan.</p>' +
      '</div></div>';

    var $ = function (s) { return el.querySelector(s); };
    var arena = $('.ap-arena'), num = $('.ap-num'), formEl = $('.ap-form'), say = $('.ap-say'), fx = $('.ap-fx'), fire = $('.ap-fire'), sparks = $('.ap-sparks'), kame = $('.ap-kame');
    var power = 5, holding = false, raf = 0, last = 0, form = 0, firing = false;

    function speak(t) { say.textContent = t; say.classList.remove('km-in'); void say.offsetWidth; say.classList.add('km-in'); }
    function setForm(k) {
      if (k === form) return;
      var up = k > form;
      form = k;
      var f = FORMS[k];
      arena.className = 'km-panel ap-arena f-' + f.id;
      formEl.textContent = f.name;
      el.querySelectorAll('.ap-forms li').forEach(function (li, i) { li.classList.toggle('is-on', i + 1 <= k); });
      fire.disabled = k < 2 || firing;
      if (up) {
        speak(f.line);
        if (f.sfx) fx.innerHTML = '<span class="km-sfx is-pop ' + (k >= 2 ? 'is-gold' : '') + '" style="left:' + (10 + Math.random() * 40).toFixed(0) + '%;top:' + (12 + Math.random() * 30).toFixed(0) + '%">' + f.sfx + '</span>';
        arena.classList.remove('is-burst'); void arena.offsetWidth; arena.classList.add('is-burst');
        if (k >= 3 && !sparks.children.length) for (var i = 0; i < 6; i++) sparks.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 20 60" style="left:' + (25 + i * 9) + '%;--d:' + (i * .17).toFixed(2) + 's"><path d="M10 0 L4 22 L13 26 L6 60"/></svg>');
      }
      if (k < 3) sparks.innerHTML = '';
    }
    function tick(t) {
      var dt = Math.min(64, t - (last || t)); last = t;
      if (holding) power = Math.min(MAXP, power * (1 + dt * 0.0019) + dt * 4);
      else power = Math.max(5, power * (1 - dt * 0.0006));
      num.textContent = fmt(power);
      arena.style.setProperty('--pw', Math.min(1, Math.log10(power) / Math.log10(MAXP)).toFixed(3));
      var k = 0;
      FORMS.forEach(function (f, i) { if (power >= f.at) k = i; });
      if (!holding && k < form && power < FORMS[form].at * 0.6) setForm(k);
      else if (k > form) setForm(k);
      arena.classList.toggle('is-charging', holding);
      if (holding || power > 5.5) raf = requestAnimationFrame(tick); else { raf = 0; last = 0; }
    }
    function start(e) { if (e) e.preventDefault(); holding = true; if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
    function stop() { holding = false; }
    function kamehameha() {
      if (firing || form < 2) return;
      firing = true; fire.disabled = true;
      var parts = ['KA', 'ME', 'HA', 'ME', 'HA!'], step = XR.reduce ? 60 : 380;
      kame.innerHTML = '';
      speak('Ka… me… ha… me…');
      parts.forEach(function (p, i) {
        setTimeout(function () { kame.insertAdjacentHTML('beforeend', '<span style="--i:' + i + '">' + p + '</span>'); }, step * i);
      });
      setTimeout(function () {
        arena.classList.add('is-beam');
        fx.innerHTML = '<span class="km-sfx is-pop" style="right:6%;top:8%">ドォォン</span>';
        speak('HAAAA! The beam tears across the panel.');
      }, step * parts.length);
      setTimeout(function () {
        arena.classList.remove('is-beam'); kame.innerHTML = '';
        firing = false; fire.disabled = form < 2;
      }, step * parts.length + (XR.reduce ? 400 : 1900));
    }
    function reset() {
      holding = false; power = 5; num.textContent = '5';
      arena.style.setProperty('--pw', 0);
      setForm(0); sparks.innerHTML = ''; fx.innerHTML = '';
      speak(FORMS[0].line);
    }

    var btn = $('.ap-charge');
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, stop); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    btn.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) start(); } });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
    fire.addEventListener('click', kamehameha);
    $('.ap-reset').addEventListener('click', reset);
  });
})();
