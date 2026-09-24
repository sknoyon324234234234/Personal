/* Lab stage 01 — live website preview with device switcher */
(function () {
  'use strict';
  var XR = window.XR;
  var SIZES = { desktop: 1280, tablet: 820, phone: 390 };

  window.LAB.register('web', function (stage) {
    var view = XR.$('.br-view', stage), frame = XR.$('.br-frame', stage), iframe = XR.$('iframe', stage);
    var urlText = XR.$('.br-url-text', stage);
    var device = 'desktop';

    function fit() {
      var W = SIZES[device], avail = view.clientWidth - (device === 'desktop' ? 0 : 24), H = view.clientHeight;
      var s = Math.min(1, avail / W);
      frame.style.width = Math.round(W * s) + 'px';
      iframe.style.width = W + 'px';
      iframe.style.height = Math.ceil(H / s) + 'px';
      iframe.style.transform = 'scale(' + s + ')';
    }

    function load(src) {
      frame.classList.add('is-loading');
      iframe.onload = function () { frame.classList.remove('is-loading'); };
      iframe.src = src;
    }

    XR.$$('.br-devices button', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        device = b.getAttribute('data-device');
        XR.$$('.br-devices button', stage).forEach(function (x) {
          x.classList.toggle('is-on', x === b);
          x.setAttribute('aria-pressed', x === b);
        });
        fit();
      });
    });

    var tabs = XR.$$('.br-tabs button', stage);
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', x === t); });
        urlText.textContent = t.getAttribute('data-url');
        load(t.getAttribute('data-src'));
      });
    });

    window.addEventListener('resize', fit);
    fit();
    load(tabs[0].getAttribute('data-src'));
  });
})();
