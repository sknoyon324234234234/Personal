/* Lab stage 03 — the seal box: a Chrome extension whose features are hanko you stamp onto a newspaper */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var FACE = { mark: '光', ads: '隠', bn: '訳', price: '値', read: '読' };
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  LAB.register('extension', function (stage) {
    var page = XR.$('.sb-page', stage), marks = XR.$('.sb-marks', stage), badge = XR.$('.sb-ext-n', stage), kw = XR.$('.sb-kw input', stage);
    var texts = XR.$$('.sb-t', stage).map(function (el) { return { el: el, en: el.textContent, bn: el.getAttribute('data-bn') }; });
    var on = {};

    function words() { return kw.value.split(',').map(function (w) { return w.trim(); }).filter(function (w) { return w.length > 1; }).slice(0, 6); }
    function paint() {
      var list = on.mark ? words() : [], re = list.length ? new RegExp('(' + list.map(escRe).join('|') + ')', 'gi') : null;
      texts.forEach(function (t) {
        var html = XR.esc(on.bn && t.bn ? t.bn : t.en);
        t.el.innerHTML = re ? html.replace(re, '<mark class="sb-mk">$1</mark>') : html;
      });
    }
    function translate() {
      texts.forEach(function (t) { t.el.classList.add('is-swap'); });
      setTimeout(function () { paint(); texts.forEach(function (t) { t.el.classList.remove('is-swap'); }); }, XR.reduce ? 0 : 220);
    }
    function impression(fx, v) {
      var old = XR.$('.sb-imp[data-fx="' + fx + '"]', marks);
      if (old) old.remove();
      if (!v) return;
      var s = document.createElement('span');
      s.className = 'sb-imp';
      s.setAttribute('data-fx', fx);
      s.textContent = FACE[fx];
      s.style.setProperty('--r', Math.round(Math.random() * 24 - 12) + 'deg');
      marks.appendChild(s);
    }
    XR.$$('.sb-seal', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        var fx = b.getAttribute('data-fx'), v = !on[fx];
        on[fx] = v;
        b.setAttribute('aria-pressed', v);
        b.classList.remove('is-stamp'); void b.offsetWidth; b.classList.add('is-stamp');
        page.classList.toggle('fx-' + fx, v);
        if (fx === 'mark') paint();
        if (fx === 'bn') translate();
        impression(fx, v);
        badge.textContent = Object.keys(on).filter(function (k) { return on[k]; }).length;
        badge.classList.remove('is-bump'); void badge.offsetWidth; badge.classList.add('is-bump');
        setTimeout(function () { badge.classList.remove('is-bump'); }, 300);
      });
    });
    kw.addEventListener('input', function () { if (on.mark) paint(); });
  });
})();
