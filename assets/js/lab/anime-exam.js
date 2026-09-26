/* Lab stage 05 -- Ninja Academy Exam: eight timed anime questions, then a stamped rank scroll. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  /* [question, correct answer, three wrong answers] */
  var POOL = [
    ['Who teaches Goku the Kamehameha?', 'Master Roshi', ['King Kai', 'Vegeta', 'Krillin']],
    ['What does Sung Jinwoo say to raise his shadow soldiers?', 'Arise', ['Awaken', 'Rise up', 'Obey']],
    ['Which three hand signs start the Chidori?', 'Ox, Hare, Monkey', ['Tiger, Snake, Ram', 'Rat, Dog, Bird', 'Boar, Horse, Dragon']],
    ['Kakashi Hatake is famous as the…', 'Copy Ninja', ['Toad Sage', 'Yellow Flash', 'Slug Princess']],
    ['Goku first turns Super Saiyan while fighting…', 'Frieza', ['Cell', 'Majin Buu', 'Vegeta']],
    ['In the dub, who shouts “It’s over 9000!”?', 'Vegeta', ['Nappa', 'Goku', 'Gohan']],
    ['Which toad chief answers the Toad Sage’s call?', 'Gamabunta', ['Katsuyu', 'Manda', 'Enma']],
    ['What is Luffy’s Devil Fruit?', 'Gum-Gum Fruit', ['Flame-Flame Fruit', 'Op-Op Fruit', 'Chop-Chop Fruit']],
    ['Which breathing style does Tanjiro learn first?', 'Water Breathing', ['Flame Breathing', 'Thunder Breathing', 'Sun Breathing']],
    ['Which wall falls first in Attack on Titan?', 'Wall Maria', ['Wall Rose', 'Wall Sina', 'Wall Liberio']],
    ['Naruto’s favourite food is…', 'Ichiraku ramen', ['Onigiri', 'Dango', 'Takoyaki']],
    ['Who created the Rasengan?', 'The Fourth Hokage', ['The Toad Sage', 'The First Hokage', 'Kakashi']],
    ['The Sharingan belongs to which clan?', 'Uchiha', ['Hyūga', 'Senju', 'Uzumaki']],
    ['What is Gojo Satoru’s domain called?', 'Unlimited Void', ['Malevolent Shrine', 'Chimera Shadow Garden', 'Self-Embodiment of Perfection']],
    ['What alias does Light Yagami use?', 'Kira', ['L', 'Near', 'Ryuk']],
    ['In Naruto, which nature beats Lightning?', 'Wind', ['Water', 'Fire', 'Earth']],
    ['Who is Team 7’s jōnin teacher?', 'Kakashi', ['Guy', 'Asuma', 'Kurenai']],
    ['What colour is Super Saiyan Blue’s hair?', 'Blue', ['Gold', 'Red', 'Silver']]
  ];
  var N = 8, TIME = 20;
  var RANKS = [
    [0, 'Academy Student', '生'], [3, 'Genin', '下'], [5, 'Chūnin', '中'], [7, 'Jōnin', '上'], [8, 'Kage', '影']
  ];

  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (r() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  LAB.register('exam', function (el) {
    el.innerHTML = '<div class="km-page ae-page"><div class="km-panel km-grid-paper ae-sheet"></div></div>';
    var sheet = el.querySelector('.ae-sheet');
    var qs = [], i = 0, score = 0, timer = 0, left = 0, t0 = 0, marks = [];

    function intro() {
      sheet.innerHTML = '<div class="ae-intro km-in">' +
        '<span class="km-cap">試験 · Written exam</span>' +
        '<img class="ae-proctor" src="assets/img/characters/tsunade.webp" alt="" width="656" height="1073" loading="lazy" decoding="async">' +
        '<div class="ae-intro-t"><h3 class="km-h">Ninja Academy written exam</h3>' +
        '<p>' + N + ' questions on anime and manga. ' + TIME + ' seconds each. Score all ' + N + ' to be named Kage.</p>' +
        '<p class="km-bubble ae-quote">No cheating with the Byakugan. I will know.</p>' +
        '<button type="button" class="km-btn is-red ae-start"><span class="jp">始</span>Begin the exam</button></div></div>';
      sheet.querySelector('.ae-start').addEventListener('click', start);
    }
    function start() {
      var r = LAB.rng(Date.now());
      qs = shuffle(POOL, r).slice(0, N).map(function (q) { return { q: q[0], a: q[1], opts: shuffle([q[1]].concat(q[2]), r) }; });
      i = 0; score = 0; marks = []; t0 = Date.now();
      ask();
    }
    function ask() {
      var q = qs[i];
      sheet.innerHTML = '<div class="ae-q km-in">' +
        '<div class="ae-top"><span class="km-tag">Question ' + (i + 1) + ' / ' + N + '</span><ol class="ae-dots" aria-hidden="true">' +
          qs.map(function (x, k) { return '<li class="' + (marks[k] === 1 ? 'ok' : marks[k] === 0 ? 'no' : k === i ? 'cur' : '') + '"></li>'; }).join('') + '</ol>' +
          '<span class="ae-time" aria-label="Seconds left"><b>' + TIME + '</b>s</span></div>' +
        '<div class="ae-bar" aria-hidden="true"><i></i></div>' +
        '<h3 class="ae-ask">' + XR.esc(q.q) + '</h3>' +
        '<div class="ae-opts">' + q.opts.map(function (o, k) { return '<button type="button" class="km-btn ae-opt" data-o="' + k + '"><span class="ae-l">' + 'ABCD'[k] + '</span><span>' + XR.esc(o) + '</span></button>'; }).join('') + '</div>' +
        '<p class="ae-fb" aria-live="polite"></p></div>';
      sheet.querySelector('.ae-opts').addEventListener('click', function (e) { var b = e.target.closest('.ae-opt'); if (b) answer(q.opts[+b.getAttribute('data-o')]); });
      left = TIME;
      var bar = sheet.querySelector('.ae-bar i'), tn = sheet.querySelector('.ae-time b');
      bar.style.transitionDuration = TIME + 's';
      requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.transform = 'scaleX(0)'; }); });
      clearInterval(timer);
      timer = setInterval(function () {
        left--; tn.textContent = left;
        if (left <= 5) tn.parentNode.classList.add('is-low');
        if (left <= 0) answer(null);
      }, 1000);
      var first = sheet.querySelector('.ae-opt');
      if (first && el.contains(document.activeElement)) first.focus({ preventScroll: true });
    }
    function answer(pick) {
      clearInterval(timer);
      var q = qs[i], ok = pick === q.a;
      if (ok) score++;
      marks[i] = ok ? 1 : 0;
      sheet.querySelector('.ae-bar i').style.transitionDuration = '0s';
      sheet.querySelectorAll('.ae-opt').forEach(function (b) {
        var txt = q.opts[+b.getAttribute('data-o')];
        b.disabled = true;
        if (txt === q.a) b.classList.add('is-right');
        else if (txt === pick) b.classList.add('is-wrong');
      });
      var fb = sheet.querySelector('.ae-fb');
      fb.innerHTML = '<span class="ae-stamp ' + (ok ? 'ok' : 'no') + '">' + (ok ? '正' : '誤') + '</span><span>' + (ok ? 'Correct.' : (pick === null ? 'Time is up.' : 'Not quite.') + ' The answer was <b>' + XR.esc(q.a) + '</b>.') + '</span>';
      setTimeout(function () { i++; if (i < N) ask(); else result(); }, ok ? 900 : 1700);
    }
    function result() {
      var rank = RANKS.filter(function (r) { return score >= r[0]; }).pop();
      var secs = Math.round((Date.now() - t0) / 1000);
      sheet.innerHTML = '<div class="ae-res km-in">' +
        '<div class="ae-scroll"><span class="ae-rod" aria-hidden="true"></span>' +
          '<div class="ae-paper"><small>Hidden Leaf Academy certifies that you are a</small>' +
          '<h3 class="ae-rank">' + rank[1] + '</h3>' +
          '<p>' + score + ' of ' + N + ' correct · ' + secs + ' seconds</p>' +
          '<span class="ae-hanko jp" aria-hidden="true">' + rank[2] + '</span></div>' +
        '<span class="ae-rod" aria-hidden="true"></span></div>' +
        '<div class="ae-acts"><button type="button" class="km-btn is-red ae-again">' + XR.icon('refresh') + 'Retake the exam</button><button type="button" class="km-btn ae-copy">' + XR.icon('copy') + 'Copy my rank</button></div></div>';
      sheet.querySelector('.ae-again').addEventListener('click', start);
      sheet.querySelector('.ae-copy').addEventListener('click', function () {
        XR.copy('I ranked ' + rank[1] + ' (' + score + '/' + N + ') in the Ninja Academy exam at xiraiya.shop/showcase#exam').then(function () { XR.toast('Rank copied'); });
      });
    }
    intro();
  });
})();
