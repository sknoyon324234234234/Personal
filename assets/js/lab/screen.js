/* Lab stage 01 — six demo sites on a gold folding screen; the chosen panel opens live underneath */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var SIZES = { desktop: 1280, tablet: 820, phone: 390 };
  var SITES = [
    ['Nova AI', 'SaaS', 'nova-saas', 'nova-ai.app'],
    ['Sakura Bistro', 'Restaurant', 'sakura-bistro', 'sakura-bistro.com'],
    ['Vault', 'Crypto dashboard', 'vault-dashboard', 'app.vault.finance'],
    ['BlockRealm', 'Minecraft server', 'blockrealm', 'blockrealm.net'],
    ['Kage Build', 'PC builder', 'kage', 'kagebuild.com.bd'],
    ['Pulse', 'App landing', 'pulse-app', 'pulsefit.app']
  ];

  LAB.register('web', function (stage) {
    var screen = XR.$('.bf-screen', stage), view = XR.$('.bf-stage', stage), frame = XR.$('.bf-frame', stage), iframe = XR.$('iframe', stage);
    var url = XR.$('.bf-url span', stage), open = XR.$('.bf-open', stage), devs = XR.$$('.bf-dev button', stage);
    var device = 'desktop', cur = -1;

    screen.innerHTML = SITES.map(function (s, i) {
      return '<button type="button" class="bf-panel" role="tab" aria-selected="false" tabindex="-1" data-i="' + i + '" aria-label="' + s[0] + ', ' + s[1] + '">' +
        '<span class="bf-leaf"><img src="assets/img/demos/' + s[2] + '.jpg" alt="" width="800" height="500" loading="lazy" decoding="async"></span>' +
        '<span class="bf-tag"><b>' + s[0] + '</b><small>' + s[1] + '</small></span></button>';
    }).join('');
    var panels = XR.$$('.bf-panel', screen);

    /* render the site at its real width, then scale it down into the frame */
    function fit() {
      var inset = device === 'desktop' ? 0 : 20, W = SIZES[device];
      var s = Math.min(1, (view.clientWidth - inset * 2) / W), H = view.clientHeight - inset;
      frame.style.width = Math.round(W * s) + 'px';
      iframe.style.width = W + 'px';
      iframe.style.height = Math.ceil(H / s) + 'px';
      iframe.style.transform = 'scale(' + s + ')';
    }
    function pick(i, focus) {
      if (i === cur) return;
      cur = i;
      var s = SITES[i];
      panels.forEach(function (p, k) { p.setAttribute('aria-selected', k === i); p.tabIndex = k === i ? 0 : -1; });
      if (focus) panels[i].focus();
      url.textContent = s[3];
      open.href = 'demos/' + s[2];
      stage.classList.add('is-loading');
      iframe.onload = function () { stage.classList.remove('is-loading'); };
      iframe.src = 'demos/' + s[2];
    }
    panels.forEach(function (p, i) {
      p.addEventListener('click', function () { pick(i); });
      p.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        pick((cur + d + panels.length) % panels.length, true);
      });
    });
    devs.forEach(function (b) {
      b.addEventListener('click', function () {
        device = b.getAttribute('data-device');
        devs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        stage.classList.toggle('is-phone', device === 'phone');
        stage.classList.toggle('is-tablet', device === 'tablet');
        fit();
      });
    });
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(view);
    else window.addEventListener('resize', fit);
    fit();
    pick(0);
  });
})();
