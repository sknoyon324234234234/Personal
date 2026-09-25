/* XIRAIYA — manga sections: comic page reveal and the boss battle */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$;

  /* comic page: panels ink in when the page scrolls into view */
  var page = $('.mg-page');
  if (page) XR.whenVisible(page, function () { page.classList.add('in'); }, '-20% 0px');

  /* boss battle */
  var arena = $('.bt-arena'); if (!arena) return;
  var fx = $('.bt-fx', arena), log = $('.bt-log'), me = { hp: 100, max: 100 }, boss = { hp: 120, max: 120 };
  var cd = { toad: 0, heal: 0 }, charge = 0, busy = false, over = false;
  var BOSS = [['Scope creep', 'シュッ', 10, 16], ['"Quick change" at 4:59 PM', 'ガッ', 12, 18], ['Friday deploy panic', 'ドドド', 14, 20], ['Client went quiet', 'シーン', 6, 12]];
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function paint() {
    [['me', me], ['boss', boss]].forEach(function (x) {
      var i = $('[data-hp="' + x[0] + '"]'), p = Math.max(0, x[1].hp) / x[1].max;
      i.style.width = p * 100 + '%'; i.classList.toggle('low', x[0] === 'me' && p < .35);
      $('[data-hpt="' + x[0] + '"]').textContent = Math.max(0, x[1].hp) + ' / ' + x[1].max;
    });
    $$('.bt-move').forEach(function (b) {
      var m = b.getAttribute('data-move');
      b.disabled = busy || over || (m === 'ship' ? charge < 3 : cd[m] > 0);
      if (cd[m] > 0) b.querySelector('small').textContent = 'Resting · ' + cd[m] + ' turn' + (cd[m] > 1 ? 's' : '');
      else if (m === 'toad') b.querySelector('small').textContent = '34–44 damage · rests 2 turns';
      else if (m === 'heal') b.querySelector('small').textContent = '+30 HP · rests 2 turns';
    });
    $('[data-charge]').textContent = charge;
  }
  function pop(text, side, cls, r) {
    var el = document.createElement('span');
    el.className = 'bt-pop' + (cls ? ' ' + cls : '');
    el.textContent = text;
    el.style.left = (side === 'boss' ? 62 + Math.random() * 14 : 8 + Math.random() * 14) + '%';
    el.style.top = (18 + Math.random() * 26) + '%';
    el.style.setProperty('--r', (r || (Math.random() * 20 - 10)) + 'deg');
    fx.appendChild(el); setTimeout(function () { el.remove(); }, 1200);
  }
  function hit(side, big) {
    var s = $('.bt-side.' + (side === 'boss' ? 'boss' : 'me'));
    s.classList.remove('hit'); void s.offsetWidth; s.classList.add('hit');
    if (big && !XR.reduce) { arena.classList.remove('shake'); void arena.offsetWidth; arena.classList.add('shake'); var f = document.createElement('i'); f.className = 'bt-flash'; fx.appendChild(f); setTimeout(function () { f.remove(); }, 400); }
  }
  function act(side) { var s = $('.bt-side.' + side); s.classList.remove('act'); void s.offsetWidth; s.classList.add('act'); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, XR.reduce ? 60 : ms); }); }
  function end(win) {
    over = true; paint();
    var box = document.createElement('div'); box.className = 'bt-win';
    box.innerHTML = win
      ? '<b>DEADLINE<br>DEFEATED</b><p>Shipped on Thursday with a day to spare. That is how it goes with a real project too.</p><div><a class="btn btn-primary" href="hire.html">Beat my deadline</a><button type="button" class="btn btn-ghost" data-again>Play again</button></div>'
      : '<b>TO BE<br>CONTINUED…</b><p>Even sages need a second try. Deadlines are easier with a plan.</p><div><button type="button" class="btn btn-primary" data-again>Try again</button><a class="btn btn-ghost" href="hire.html">Get a plan</a></div>';
    arena.appendChild(box);
    log.textContent = win ? 'The Deadline falls. The toad does a small victory hop.' : 'The Deadline wins this round.';
    if (win && XR.quest) try { XR.quest('battle'); } catch (e) { /* ignore */ }
  }
  function reset() { me.hp = 100; boss.hp = 120; cd = { toad: 0, heal: 0 }; charge = 0; over = false; busy = false; var w = $('.bt-win', arena); if (w) w.remove(); log.textContent = 'The Deadline is back. It always comes back.'; paint(); }
  async function turn(m) {
    if (busy || over) return; busy = true; paint();
    act('me'); await wait(220);
    if (m === 'code') { var d = rnd(18, 26); boss.hp -= d; pop('カタカタ', 'boss'); pop('−' + d, 'boss', 'dmg'); hit('boss'); log.textContent = 'Code sprint! ' + d + ' damage.'; charge = Math.min(3, charge + 1); }
    if (m === 'toad') { var t = rnd(34, 44); boss.hp -= t; pop('ドン!', 'boss', '', -12); pop('−' + t, 'boss', 'dmg'); hit('boss', true); log.textContent = 'Summoning jutsu! The toad lands for ' + t + ' damage.'; cd.toad = 3; charge = Math.min(3, charge + 1); }
    if (m === 'heal') { var h = Math.min(30, me.max - me.hp); me.hp += h; pop('+' + h, 'hero', 'heal'); pop('癒', 'hero'); log.textContent = 'Xiri patches you up. +' + h + ' HP.'; cd.heal = 3; }
    if (m === 'ship') { var u = rnd(55, 70); boss.hp -= u; pop('螺旋!', 'boss', '', 8); pop('−' + u, 'boss', 'dmg'); hit('boss', true); log.textContent = 'RASEN-DEPLOY! Straight to production. ' + u + ' damage.'; charge = 0; }
    paint();
    if (boss.hp <= 0) { await wait(500); end(true); return; }
    await wait(900);
    var b = BOSS[(Math.random() * BOSS.length) | 0], bd = rnd(b[2], b[3]);
    act('boss'); await wait(200);
    me.hp -= bd; pop(b[1], 'hero'); pop('−' + bd, 'hero', 'dmg'); hit('hero', bd > 16);
    log.textContent = 'The Deadline uses ' + b[0] + '. You take ' + bd + ' damage.';
    Object.keys(cd).forEach(function (k) { if (cd[k] > 0) cd[k]--; });
    busy = false; paint();
    if (me.hp <= 0) { await wait(400); end(false); }
  }
  $$('.bt-move').forEach(function (b) { b.addEventListener('click', function () { turn(b.getAttribute('data-move')); }); });
  arena.addEventListener('click', function (e) { if (e.target.closest('[data-again]')) reset(); });
  paint();
})();
