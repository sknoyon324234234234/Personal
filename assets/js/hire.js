/* XIRAIYA — Hire page: packages, project configurator, instant estimate, brief hand-off */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, I = XR.icon, esc = XR.esc, C = XR.config, S = XR.services;
  var cur = C.currency || '$';
  function money(n) { return cur + Math.round(n).toLocaleString('en-US'); }

  /* availability */
  if (C.available === false) {
    var st = $('.hire-meta .status'); if (st) st.classList.add('off');
    var av = $('.hire-avail'); if (av) av.textContent = 'Fully booked — join the waitlist';
  }

  /* packages */
  var chosenPack = null;
  $('.packs').innerHTML = (C.packages || []).map(function (p, i) {
    return '<article class="pack card' + (p.popular ? ' hot' : '') + '" data-reveal style="--d:' + (i * .08) + 's">' + (p.popular ? '<span class="pack-rib">Most popular</span>' : '') +
      '<div class="pack-h"><span class="hanko">' + esc(p.jp || '') + '</span><div><b>' + esc(p.name) + '</b><small>' + esc(p.tagline || '') + '</small></div></div>' +
      '<div class="pack-price">' + money(p.price) + (p.to ? '<small> – </small>' + money(p.to) : '') + '<small> / ' + esc(p.per || 'project') + '</small></div>' +
      '<ul>' + p.features.map(function (f) { return '<li>' + I('check') + '<span>' + esc(f) + '</span></li>'; }).join('') + '</ul>' +
      '<button type="button" class="btn ' + (p.popular ? 'btn-primary' : 'btn-ghost') + '" data-pack="' + i + '">Start with ' + esc(p.name) + ' ' + I('arrow-right') + '</button></article>';
  }).join('');
  XR.reveals($('.packs'));

  /* price list: every service with its tiers */
  var plist = $('.plist');
  if (plist) plist.innerHTML = S.map(function (s) {
    return '<article class="pl card"><h3>' + I(s.icon) + esc(s.name) + '<small>' + money(s.priceFrom) + ' – ' + money(s.priceTo || s.priceFrom) + '</small></h3><ul>' +
      (s.tiers || []).map(function (t) { return '<li><span>' + esc(t[0]) + '</span><i></i><b>' + (t[1] === t[2] ? money(t[1]) : money(t[1]) + '–' + money(t[2]).replace(/^\D+/, '')) + '</b></li>'; }).join('') + '</ul></article>';
  }).join('');

  /* configurator state */
  var state = { svc: [], feats: {}, tl: 'standard', design: 'make', sup: '0', step: 0 };
  var byId = {};
  S.forEach(function (s) { byId[s.id] = s; });
  var q = new URLSearchParams(location.search).get('service');
  if (q) q.split(',').forEach(function (id) { if (byId[id] && state.svc.indexOf(id) < 0) state.svc.push(id); });

  $$('[data-pack]').forEach(function (b) {
    b.addEventListener('click', function () {
      chosenPack = C.packages[+b.getAttribute('data-pack')];
      XR.toast(chosenPack.name + ' package selected — now pick your services');
      $('#configure').scrollIntoView({ behavior: XR.reduce ? 'auto' : 'smooth' });
      calc();
    });
  });

  var pick = $('.svc-pick');
  pick.innerHTML = S.map(function (s) {
    return '<button type="button" class="sp" data-svc="' + s.id + '" aria-pressed="' + (state.svc.indexOf(s.id) >= 0) + '"><span class="sp-check">' + I('check') + '</span><span class="sp-ic">' + I(s.icon) + '</span><b>' + esc(s.name) + '</b><small>from ' + money(s.priceFrom) + ' · ' + esc(s.days) + ' days</small></button>';
  }).join('');
  pick.addEventListener('click', function (e) {
    var b = e.target.closest('[data-svc]'); if (!b) return;
    var id = b.getAttribute('data-svc'), i = state.svc.indexOf(id);
    if (i >= 0) { state.svc.splice(i, 1); delete state.feats[id]; } else state.svc.push(id);
    b.setAttribute('aria-pressed', i < 0);
    calc();
  });

  function renderFeatures() {
    $('.feat-pick').innerHTML = state.svc.map(function (id) {
      var s = byId[id], chosen = state.feats[id] || [];
      return '<div class="fp-group"><h4>' + I(s.icon) + esc(s.name) + '<small>base ' + money(s.priceFrom) + '</small></h4>' +
        s.features.map(function (f) {
          return '<label class="fp"><input type="checkbox" data-f="' + id + ':' + f.id + '"' + (chosen.indexOf(f.id) >= 0 ? ' checked' : '') + '><i>' + I('check') + '</i><span>' + esc(f.label) + '</span><em>+' + money(f.price) + '</em></label>';
        }).join('') + '</div>';
    }).join('') || '<p class="muted">Pick at least one service first.</p>';
  }
  $('.feat-pick').addEventListener('change', function (e) {
    var k = e.target.getAttribute('data-f'); if (!k) return;
    var p = k.split(':'), arr = state.feats[p[0]] = state.feats[p[0]] || [], i = arr.indexOf(p[1]);
    if (e.target.checked && i < 0) arr.push(p[1]);
    if (!e.target.checked && i >= 0) arr.splice(i, 1);
    calc();
  });

  $$('.opt-cards').forEach(function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('button', g).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
      if (b.hasAttribute('data-tl')) state.tl = b.getAttribute('data-tl');
      if (b.hasAttribute('data-design')) state.design = b.getAttribute('data-design');
      if (b.hasAttribute('data-sup')) state.sup = b.getAttribute('data-sup');
      calc();
    });
  });

  var paySel = $('#h-pay');
  paySel.innerHTML = ((C.payments && C.payments.methods) || []).map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '<option>Not sure yet</option>';

  /* ---------- estimate ---------- */
  var est = { low: 0, high: 0, dmin: 0, dmax: 0 };
  var TL = { relaxed: [.9, 1.3, 'Relaxed'], standard: [1, 1, 'Standard'], rush: [1.35, .7, 'Rush'] };
  function calc() {
    var list = $('.sum-list'), html = '', base = 0, mins = [], maxs = [], nf = 0;
    state.svc.forEach(function (id) {
      var s = byId[id];
      base += s.priceFrom;
      var d = s.days.split(/[–-]/).map(Number);
      mins.push(d[0]); maxs.push(d[1] || d[0]);
      html += '<li><b>' + esc(s.name) + '</b><span>' + money(s.priceFrom) + '</span></li>';
      (state.feats[id] || []).forEach(function (fid) {
        var f = s.features.find(function (x) { return x.id === fid; });
        if (!f) return;
        base += f.price; nf++;
        html += '<li class="sub"><span>+ ' + esc(f.label) + '</span><span>' + money(f.price) + '</span></li>';
      });
    });
    if (!state.svc.length) {
      list.innerHTML = '<li><span>No services selected yet</span><span></span></li>';
      $('.sum-range').textContent = cur + '0';
      $('.sum-time').textContent = 'Pick a service to start';
      est = { low: 0, high: 0, dmin: 0, dmax: 0 };
      return;
    }
    var total = base;
    if (state.design === 'make') html += '<li class="sub"><span>Custom UI design</span><span>included</span></li>';
    var tl = TL[state.tl];
    total *= tl[0];
    if (state.tl !== 'standard') html += '<li class="sub"><span>' + tl[2] + ' timeline</span><span>' + (tl[0] > 1 ? '+' : '') + Math.round((tl[0] - 1) * 100) + '%</span></li>';
    if (state.sup === '3') { total *= 1.12; html += '<li class="sub"><span>+3 months support</span><span>+12%</span></li>'; }
    if (state.sup === '6') { total *= 1.2; html += '<li class="sub"><span>+6 months support</span><span>+20%</span></li>'; }
    if (chosenPack) html = '<li><b>Package: ' + esc(chosenPack.name) + '</b><span>from ' + money(chosenPack.price) + '</span></li>' + html;
    var low = Math.max(total, chosenPack ? chosenPack.price : 0);
    est.low = Math.round(low / 10) * 10;
    /* the top of the range never passes the most the chosen services can cost */
    var cap = state.svc.reduce(function (a, id) { return a + (byId[id].priceTo || byId[id].priceFrom * 3); }, 0) + (total - base > 0 ? total - base : 0);
    (state.svc).forEach(function (id) { (state.feats[id] || []).forEach(function (fid) { var f = byId[id].features.find(function (x) { return x.id === fid; }); if (f) cap += f.price; }); });
    est.high = Math.round(Math.max(low * 1.15, Math.min(low * 1.4, cap)) / 10) * 10;
    mins.sort(function (a, b) { return b - a; }); maxs.sort(function (a, b) { return b - a; });
    var dmin = mins[0] + mins.slice(1).reduce(function (a, b) { return a + b; }, 0) * .5 + nf * .5;
    var dmax = maxs[0] + maxs.slice(1).reduce(function (a, b) { return a + b; }, 0) * .5 + nf;
    est.dmin = Math.max(2, Math.round(dmin * tl[1]));
    est.dmax = Math.max(est.dmin + 1, Math.round(dmax * tl[1]));
    list.innerHTML = html;
    $('.sum-range').textContent = money(est.low) + ' – ' + money(est.high);
    $('.sum-time').textContent = 'About ' + est.dmin + '–' + est.dmax + ' days · ' + tl[2] + ' timeline';
  }

  /* ---------- steps ---------- */
  var steps = $$('.cfg-panel'), stepLis = $$('.cfg-steps li'), back = $('.cfg-back'), next = $('.cfg-next');
  function go(n) {
    state.step = n;
    steps.forEach(function (p) { p.hidden = +p.getAttribute('data-step') !== n; });
    stepLis.forEach(function (li, i) { li.classList.toggle('is-on', i === n); li.classList.toggle('is-done', i < n); });
    back.hidden = n === 0;
    next.innerHTML = n === 3 ? I('check') + 'Prepare my brief' : 'Continue ' + I('arrow-right');
    if (n === 1) renderFeatures();
    var top = $('.cfg-main').getBoundingClientRect().top;
    if (top < 60) window.scrollBy({ top: top - 110, behavior: XR.reduce ? 'auto' : 'smooth' });
  }
  back.addEventListener('click', function () { go(Math.max(0, state.step - 1)); });
  next.addEventListener('click', function () {
    if (state.step === 0 && !state.svc.length) { XR.toast('Pick at least one service to continue', 'warn'); return; }
    if (state.step < 3) { go(state.step + 1); return; }
    var f = $('.cfg-form'), ok = f.name.value.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim());
    $('.form-err').hidden = ok;
    if (!ok) return;
    ready();
  });

  /* ---------- brief ---------- */
  function brief() {
    var f = $('.cfg-form'), lines = [];
    lines.push('Hi ' + (C.name || 'Xiraiya') + '! I’d like to hire you.', '');
    lines.push('Name: ' + f.name.value.trim(), 'Email: ' + f.email.value.trim());
    if (f.messenger.value.trim()) lines.push('Telegram / WhatsApp: ' + f.messenger.value.trim());
    if (chosenPack) lines.push('Package: ' + chosenPack.name);
    lines.push('', 'Services:');
    state.svc.forEach(function (id) {
      var s = byId[id];
      lines.push('- ' + s.name);
      (state.feats[id] || []).forEach(function (fid) { var ft = s.features.find(function (x) { return x.id === fid; }); if (ft) lines.push('   + ' + ft.label); });
    });
    lines.push('', 'Timeline: ' + TL[state.tl][2], 'Design: ' + (state.design === 'make' ? 'Please design it' : 'I have a design'), 'Support: ' + (state.sup === '0' ? 'Included window' : '+' + state.sup + ' months'));
    lines.push('Preferred payment: ' + f.payment.value, 'Budget: ' + f.budget.value);
    lines.push('Website estimate: ' + money(est.low) + ' – ' + money(est.high) + ', about ' + est.dmin + '–' + est.dmax + ' days');
    if (f.details.value.trim()) lines.push('', 'Project details:', f.details.value.trim());
    return lines.join('\n');
  }
  var contacts = XR.contacts();
  function hasC(id) { return contacts.some(function (c) { return c.id === id; }); }
  function ready() {
    var box = $('.sum-send');
    box.hidden = false;
    $('.sum-email').hidden = !hasC('email');
    $('.sum-tg').hidden = !hasC('telegram');
    $('.sum-wa').hidden = !hasC('whatsapp');
    stepLis[3].classList.add('is-done');
    XR.toast('Brief ready — choose how to send it');
    if (C.formEndpoint) {
      var f = $('.cfg-form');
      fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: f.name.value, email: f.email.value, messenger: f.messenger.value, brief: brief() }) })
        .then(function (r) { XR.toast(r.ok ? 'Brief sent! I’ll reply soon.' : 'Could not send automatically — use a button below', r.ok ? '' : 'warn'); })
        .catch(function () { XR.toast('Could not send automatically — use a button below', 'warn'); });
    }
    if (window.matchMedia('(max-width: 1100px)').matches) $('.cfg-sum').scrollIntoView({ behavior: XR.reduce ? 'auto' : 'smooth', block: 'start' });
  }
  $('.sum-email').addEventListener('click', function () {
    var email = (C.contact || {}).email;
    location.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Project brief — ' + state.svc.map(function (id) { return byId[id].name; }).join(', ')) + '&body=' + encodeURIComponent(brief());
  });
  $('.sum-tg').addEventListener('click', function () {
    XR.copy(brief()).then(function () {
      XR.toast('Brief copied — paste it in the Telegram chat');
      window.open('https://t.me/' + C.contact.telegram, '_blank', 'noopener');
    });
  });
  $('.sum-wa').addEventListener('click', function () {
    window.open('https://wa.me/' + C.contact.whatsapp + '?text=' + encodeURIComponent(brief()), '_blank', 'noopener');
  });
  $('.sum-copy').addEventListener('click', function () { XR.copy(brief()).then(function () { XR.toast('Brief copied to clipboard'); }); });

  calc();
})();
