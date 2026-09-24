/* Lab stage 04 — Chrome extension popup that really modifies the mock page */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  LAB.register('extension', function (stage) {
    var btn = XR.$('.ext-btn', stage), popup = XR.$('.ext-popup', stage), hint = XR.$('.ext-hint', stage);
    var page = XR.$('.ext-page', stage), article = XR.$('.xp-article', stage);
    var words = XR.$('#ep-words', stage), price = XR.$('.xp-price', stage), drop = XR.$('.xp-drop', stage);
    var wcEl = XR.$('.ep-wc', stage), rtEl = XR.$('.ep-rt', stage), hcEl = XR.$('.ep-hc', stage), rtPage = XR.$('.xp-rt', stage);
    var paras = XR.$$('p:not(.xp-meta), h3', article);
    var originals = paras.map(function (p) { return p.innerHTML; });
    var active = false;

    function open(v) {
      popup.hidden = !v;
      btn.setAttribute('aria-expanded', v);
      if (v) { hint.classList.add('is-gone'); active = true; highlight(); }
    }
    btn.addEventListener('click', function () { open(popup.hidden); });
    XR.$('.ep-close', stage).addEventListener('click', function () { open(false); btn.focus(); });
    stage.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !popup.hidden) open(false); });

    // tabs
    XR.$$('.ep-tabs button', stage).forEach(function (t) {
      t.addEventListener('click', function () {
        XR.$$('.ep-tabs button', stage).forEach(function (x) { x.setAttribute('aria-selected', x === t); });
        XR.$$('.ep-panel', stage).forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== t.getAttribute('data-ep'); });
      });
    });

    // toggles
    XR.$$('[data-opt]', stage).forEach(function (cb) {
      cb.addEventListener('change', function () {
        var on = cb.checked, opt = cb.getAttribute('data-opt');
        if (opt === 'dark') page.classList.toggle('is-dark', on);
        if (opt === 'ads') {
          page.classList.toggle('no-ads', on);
          if (on) XR.toast('FocusKit blocked 3 distractions on this page');
        }
        if (opt === 'price') {
          drop.hidden = !on;
          price.innerHTML = on ? '<s>$89</s>$73' : '$89';
          if (on) XR.toast('Price alert set — you’ll be notified on the next drop');
        }
      });
    });

    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function highlight() {
      var list = words.value.split(',').map(function (w) { return w.trim(); }).filter(function (w) { return w.length > 1; });
      var re = list.length ? new RegExp('\\b(' + list.map(esc).join('|') + ')', 'gi') : null, count = 0;
      paras.forEach(function (p, i) {
        var html = originals[i];
        if (re && active) html = html.replace(re, function (m) { count++; return '<mark class="hl">' + m + '</mark>'; });
        p.innerHTML = html;
      });
      hcEl.textContent = count;
    }
    words.addEventListener('input', highlight);

    // page stats
    var wc = article.textContent.trim().split(/\s+/).length;
    wcEl.textContent = wc;
    rtEl.textContent = Math.max(1, Math.round(wc / 200));
    if (rtPage) rtPage.textContent = Math.max(1, Math.round(wc / 200)) + ' min read';

    XR.$$('[data-act]', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('data-act') === 'shot') {
          page.classList.remove('flash'); void page.offsetWidth; page.classList.add('flash');
          XR.toast('Full-page screenshot saved (demo)');
        } else {
          XR.toast('Extracted ' + (XR.$$('a, .xp-nav span', page).length + 9) + ' links to clipboard (demo)');
        }
      });
    });
  });
})();
