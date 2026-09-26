/* Lab stage 06 -- Manga Panel Maker: choose a layout, then fill each panel with a character, a line and a sound effect. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  var CAST = [
    ['', 'Empty'], ['xiraiya', 'Sage'], ['xiraiya-arms', 'Sage, arms crossed'], ['xiraiya-stop', 'Sage, stop!'],
    ['xiraiya-writing', 'Sage, writing'], ['tsunade', 'Xiri'], ['gama', 'Gama'], ['katsuyu', 'Katsuyu']
  ];
  var TONES = [['plain', 'Plain'], ['dots', 'Dots'], ['speed', 'Speed lines'], ['focus', 'Focus lines'], ['dark', 'Night']];
  var SFX = ['', 'ドーン', 'ゴゴゴ', 'バン', 'シーン', 'キラッ', 'ドキドキ', 'ズバッ'];
  var LAYOUTS = [['classic', 'Classic 3', 3], ['action', 'Action 4', 4], ['splash', 'Splash 2', 2], ['yonkoma', '4-koma', 4]];
  var STORIES = [
    [['xiraiya-writing', 'dots', 'Chapter one… the hero arrives.', ''], ['gama', 'plain', 'Late again, Sage!', 'ドーン'], ['xiraiya-arms', 'speed', 'A great writer is never late!', 'ゴゴゴ'], ['tsunade', 'focus', 'Deadline is in one hour.', 'シーン']],
    [['tsunade', 'plain', 'Who broke the build?', ''], ['xiraiya-stop', 'speed', 'Wait! I can explain!', 'バン'], ['katsuyu', 'dots', 'The tests are red…', 'ドキドキ'], ['xiraiya', 'focus', 'Fixed. Nobody saw.', 'キラッ']],
    [['xiraiya-arms', 'dark', 'The village sleeps.', 'シーン'], ['gama', 'speed', 'Enemies at the gate!', 'ズバッ'], ['xiraiya', 'focus', 'Summoning Jutsu!', 'ドーン'], ['tsunade', 'dots', 'Show-off.', '']]
  ];
  var KEY = 'xr-lab-panel';

  function blank() { return { layout: 'classic', panels: [0, 1, 2, 3].map(function () { return { who: '', tone: 'plain', say: '', sfx: '' }; }) }; }
  function img(who) { return who ? 'assets/img/characters/' + who + '.webp' : ''; }

  LAB.register('panel', function (el) {
    var st;
    try { st = XR.store(KEY); } catch (e) { st = null; }
    if (!st || !st.panels) { st = blank(); STORIES[0].forEach(function (p, i) { st.panels[i] = { who: p[0], tone: p[1], say: p[2], sfx: p[3] }; }); }
    var sel = 0, reading = false;

    el.innerHTML = '<div class="mp-wrap">' +
      '<div class="mp-bar"><div class="mp-lay" role="radiogroup" aria-label="Page layout">' +
        LAYOUTS.map(function (l) { return '<button type="button" class="km-btn" role="radio" data-l="' + l[0] + '">' + l[1] + '</button>'; }).join('') +
      '</div><div class="mp-tools"><button type="button" class="km-btn mp-rand">' + XR.icon('sparkle') + 'Random story</button><button type="button" class="km-btn is-ink mp-read">' + XR.icon('book') + '<span>Read mode</span></button></div></div>' +
      '<div class="km-page mp-page" aria-label="Your manga page"></div>' +
      '<div class="mp-edit km-panel km-tone-2">' +
        '<span class="km-tag is-red mp-which">Panel 1</span>' +
        '<label><span>Character</span><select class="mp-who">' + CAST.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join('') + '</select></label>' +
        '<label><span>Screen tone</span><select class="mp-tone">' + TONES.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select></label>' +
        '<label class="mp-say-l"><span>Speech bubble</span><input class="mp-say" type="text" maxlength="60" placeholder="What do they say?"></label>' +
        '<div class="mp-sfx" role="group" aria-label="Sound effect">' + SFX.map(function (s) { return '<button type="button" data-s="' + s + '" class="jp">' + (s || 'None') + '</button>'; }).join('') + '</div>' +
      '</div></div>';

    var page = el.querySelector('.mp-page'), edit = el.querySelector('.mp-edit');
    var who = el.querySelector('.mp-who'), tone = el.querySelector('.mp-tone'), say = el.querySelector('.mp-say');

    function count() { return LAYOUTS.filter(function (l) { return l[0] === st.layout; })[0][2]; }
    function save() { try { XR.store(KEY, st); } catch (e) { /* ignore */ } }
    function panelHtml(p, i) {
      var toneEl = p.tone === 'speed' ? '<span class="km-speed' + '" aria-hidden="true"></span>' : p.tone === 'focus' ? '<span class="km-focus" aria-hidden="true"></span>' : '';
      return '<button type="button" class="km-panel mp-p t-' + p.tone + (i === sel && !reading ? ' is-sel' : '') + '" data-i="' + i + '" aria-label="Panel ' + (i + 1) + (p.say ? ': ' + XR.esc(p.say) : '') + '">' + toneEl +
        (p.who ? '<img class="mp-img w-' + p.who + '" src="' + img(p.who) + '" alt="" loading="lazy" decoding="async">' : '<span class="mp-empty">' + (reading ? '' : 'Tap to fill') + '</span>') +
        (p.say ? '<span class="km-bubble' + (i % 2 ? ' is-right' : '') + ' mp-b">' + XR.esc(p.say) + '</span>' : '') +
        (p.sfx ? '<span class="km-sfx is-pop' + (i % 2 ? ' is-red' : '') + ' mp-s">' + p.sfx + '</span>' : '') +
        '<i class="mp-n" aria-hidden="true">' + (i + 1) + '</i></button>';
    }
    function paint() {
      var n = count();
      if (sel >= n) sel = 0;
      page.className = 'km-page mp-page l-' + st.layout + (reading ? ' is-read' : '');
      page.innerHTML = st.panels.slice(0, n).map(panelHtml).join('');
      el.querySelectorAll('.mp-lay .km-btn').forEach(function (b) { var on = b.getAttribute('data-l') === st.layout; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      var p = st.panels[sel];
      el.querySelector('.mp-which').textContent = 'Panel ' + (sel + 1);
      who.value = p.who; tone.value = p.tone;
      if (document.activeElement !== say) say.value = p.say;
      el.querySelectorAll('.mp-sfx button').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-s') === p.sfx); });
      edit.hidden = reading;
      el.querySelector('.mp-read span').textContent = reading ? 'Edit mode' : 'Read mode';
    }
    function set(k, v) { st.panels[sel][k] = v; save(); paint(); }

    el.querySelector('.mp-lay').addEventListener('click', function (e) { var b = e.target.closest('[data-l]'); if (b) { st.layout = b.getAttribute('data-l'); save(); paint(); } });
    page.addEventListener('click', function (e) {
      var b = e.target.closest('.mp-p');
      if (!b) return;
      if (reading) { b.classList.remove('km-shake'); void b.offsetWidth; b.classList.add('km-shake'); return; }
      sel = +b.getAttribute('data-i'); paint();
    });
    who.addEventListener('change', function () { set('who', who.value); });
    tone.addEventListener('change', function () { set('tone', tone.value); });
    say.addEventListener('input', function () { st.panels[sel].say = say.value; save(); var b = page.querySelector('[data-i="' + sel + '"]'); if (b) { var sp = b.querySelector('.mp-b'); if (!sp && say.value) paint(); else if (sp && !say.value) paint(); else if (sp) sp.textContent = say.value; } });
    el.querySelector('.mp-sfx').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) set('sfx', b.getAttribute('data-s')); });
    el.querySelector('.mp-rand').addEventListener('click', function () {
      var s = STORIES[(Math.random() * STORIES.length) | 0];
      st.layout = ['classic', 'action', 'yonkoma'][(Math.random() * 3) | 0];
      s.forEach(function (p, i) { st.panels[i] = { who: p[0], tone: p[1], say: p[2], sfx: p[3] }; });
      save(); paint();
    });
    el.querySelector('.mp-read').addEventListener('click', function () { reading = !reading; paint(); });
    paint();
  });
})();
