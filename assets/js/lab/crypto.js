/* Lab stages 10 + 11 — e-commerce autopilot feed and auto-confirming crypto checkout (demo only) */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  /* ------------------------ 10: e-commerce autopilot feed ------------------------ */
  var EVENTS = [
    ['bag', '#d9a441', 'New order #{n} — Ronin Headphones', 'paid in USDT · auto-confirmed', true],
    ['chat', '#6fb3a8', 'AI assistant closed a sale', 'suggested Mecha Keyboard + wrist rest'],
    ['refresh', '#9483c2', 'Abandoned cart recovered', 'Telegram reminder · $64'],
    ['box', '#a9c46a', 'Auto-restock triggered', 'Neon Katana Lamp · PO-2293'],
    ['send', '#2f9bff', 'Order alert sent to Telegram', '@kage_orders · 0.4s'],
    ['star-fill', '#d9a441', '5-star review answered', 'AI reply in Bangla'],
    ['bag', '#e0442e', 'New order #{n} — Kitsune Hoodie', 'bKash · auto-verified', true]
  ];
  LAB.register('ecommerce', function (stage) {
    var list = XR.$('.ec-events', stage), count = XR.$('.ec-count', stage), i = 0, n = 4822, cart = 2;
    function push() {
      var e = EVENTS[i++ % EVENTS.length];
      var li = document.createElement('li');
      li.innerHTML = '<span style="--c:' + e[1] + '">' + XR.icon(e[0]) + '</span><div>' + e[2].replace('{n}', n) + '<small>' + LAB.now() + ' · ' + e[3] + '</small></div>';
      if (e[4]) { n++; cart++; count.textContent = cart; count.classList.add('bump'); setTimeout(function () { count.classList.remove('bump'); }, 300); }
      list.insertBefore(li, list.firstChild);
      while (list.children.length > 5) list.removeChild(list.lastChild);
    }
    push(); push(); push();
    setInterval(function () { if (!document.hidden) push(); }, 2800);
  });

  /* ------------------------ 11: crypto checkout ------------------------ */
  var RATES = { USDT: 1, BTC: 64250, ETH: 3180, BNB: 590 };
  var NETS = { USDT: ['TRC20 (Tron)', 'BEP20 (BNB Chain)', 'ERC20 (Ethereum)'], BTC: ['Bitcoin'], ETH: ['ERC20 (Ethereum)', 'Arbitrum One'], BNB: ['BEP20 (BNB Chain)'] };
  var DEC = { USDT: 4, BTC: 8, ETH: 6, BNB: 6 };

  LAB.register('crypto', function (stage) {
    var card = XR.$('.pay-card', stage), conv = XR.$('.pay-conv', stage), net = XR.$('.pay-net', stage), addrEl = XR.$('.pay-address', stage);
    var qrEl = XR.$('.pay-qr', stage), timerEl = XR.$('.pay-timer span', stage), sim = XR.$('.pay-sim', stage), out = XR.$('.pay-out', stage);
    var stepsEls = XR.$$('.pay-steps li', stage), confEl = XR.$('.pay-conf', stage), invEl = XR.$('.pay-inv', stage);
    var coin = 'USDT', usd = 129, inv = 20481, left = 900, paid = false, busy = false;
    var uniq = (Math.random() * .05).toFixed(4);

    function address() {
      var r = LAB.rng(coin + net.value + inv), s = '', i;
      var b58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', hex = '0123456789abcdef', b32 = '023456789acdefghjklmnpqrstuvwxyz';
      if (/TRC20/.test(net.value)) { s = 'T'; for (i = 0; i < 33; i++) s += b58[(r() * b58.length) | 0]; }
      else if (coin === 'BTC') { s = 'bc1q'; for (i = 0; i < 38; i++) s += b32[(r() * b32.length) | 0]; }
      else { s = '0x'; for (i = 0; i < 40; i++) s += hex[(r() * 16) | 0]; }
      return s;
    }
    function amount() {
      var a = coin === 'USDT' ? usd + Number(uniq) : usd / RATES[coin];
      return a.toFixed(DEC[coin]);
    }
    function refresh() {
      var a = amount();
      conv.textContent = '= ' + a + ' ' + coin + (coin === 'USDT' ? ' (unique amount)' : '');
      addrEl.textContent = address();
      LAB.qr(qrEl, addrEl.textContent + a);
    }
    function setNets() {
      net.innerHTML = NETS[coin].map(function (n) { return '<option>' + n + '</option>'; }).join('');
    }
    function setStep(k) {
      stepsEls.forEach(function (li, i) { li.classList.toggle('is-done', i < k); li.classList.toggle('is-on', i === k); });
    }
    function log(html) { out.innerHTML += '\n' + html; out.scrollTop = out.scrollHeight; }

    XR.$$('.pay-coins button', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        if (busy || paid) return;
        coin = b.getAttribute('data-coin');
        XR.$$('.pay-coins button', stage).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
        setNets(); refresh();
      });
    });
    net.addEventListener('change', refresh);
    XR.$('.pay-copy', stage).addEventListener('click', function () {
      XR.copy(addrEl.textContent).then(function () { XR.toast('Demo address copied — do not send real funds'); });
    });

    setInterval(function () {
      if (paid || left <= 0) return;
      left--;
      timerEl.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
      if (left === 0) { timerEl.textContent = 'Expired'; log('<span class="m">› invoice expired — a new one is created automatically</span>'); setTimeout(reset, 1500); }
    }, 1000);

    function reset() {
      paid = false; busy = false; inv++; left = 900; uniq = (Math.random() * .05).toFixed(4);
      invEl.textContent = '#INV-' + inv;
      card.classList.remove('is-paid'); qrEl.classList.remove('is-paid');
      sim.innerHTML = XR.icon('zap') + 'Simulate payment';
      confEl.textContent = '0/3'; setStep(0);
      timerEl.textContent = '15:00';
      out.innerHTML = '› waiting for on-chain events…';
      refresh();
    }

    async function simulate() {
      if (paid) { reset(); return; }
      if (busy) return;
      busy = true; sim.disabled = true;
      var a = amount(), n = net.value.split(' ')[0], tx = LAB.hash(addrEl.textContent + Date.now()).toString(16) + LAB.hash(a).toString(16) + 'e9c1';
      var sp = function (ms) { return LAB.sleep(XR.reduce ? 0 : ms); };
      out.innerHTML = '<span class="m">› chain-watcher started · ' + coin + ' / ' + n + '</span>';
      await sp(700);
      setStep(1);
      log('<span class="k">[' + LAB.stamp() + ']</span> tx detected in mempool');
      log('  hash   <span class="s">' + tx.slice(0, 24) + '…</span>');
      log('  amount <span class="s">' + a + ' ' + coin + '</span> <span class="ok">(matches invoice)</span>');
      await sp(800);
      setStep(2);
      for (var c = 1; c <= 3; c++) {
        confEl.textContent = c + '/3';
        log('<span class="k">[' + LAB.stamp() + ']</span> confirmation <span class="s">' + c + '/3</span>');
        await sp(850);
      }
      setStep(3);
      card.classList.add('is-paid'); qrEl.classList.add('is-paid');
      log('<span class="k">[' + LAB.stamp() + ']</span> <span class="ok">payment confirmed</span>');
      log('\n<span class="m">POST https://yourstore.example/webhooks/crypto</span>');
      log('<span class="m">X-Signature: sha256=' + LAB.hash(tx).toString(16) + LAB.hash(tx + 'k').toString(16) + '…</span>');
      log(XR.esc(JSON.stringify({ event: 'payment.confirmed', invoice: 'INV-' + inv, coin: coin, network: n, amount: a, usd: usd.toFixed(2), tx_hash: tx.slice(0, 18) + '…', confirmations: 3, timestamp: new Date().toISOString().slice(0, 19) + 'Z' }, null, 2))
        .replace(/&quot;([a-z_]+)&quot;:/g, '<span class="k">"$1"</span>:'));
      await sp(700);
      log('\n<span class="k">[' + LAB.stamp() + ']</span> hmac-sha256 signature <span class="ok">verified</span> · 200 OK');
      await sp(600);
      setStep(4);
      log('<span class="k">[' + LAB.stamp() + ']</span> order.fulfill → <span class="ok">license key emailed · Telegram alert sent · stock updated</span>');
      stepsEls[4].classList.add('is-done'); stepsEls[4].classList.remove('is-on');
      paid = true; busy = false; sim.disabled = false;
      sim.innerHTML = XR.icon('refresh') + 'New invoice';
      XR.toast('Payment auto-confirmed and order delivered (demo)');
    }
    sim.addEventListener('click', simulate);

    setNets(); refresh();
  });
})();
