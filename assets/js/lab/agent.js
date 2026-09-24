/* Lab stage 08 — configurable AI agent: plans, calls tools, respects autonomy + disabled tools */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  var SCENARIOS = {
    restock: {
      goal: 'Restock best-sellers and notify suppliers',
      steps: [
        { t: 'think', text: 'Plan: 1) pull 7-day sales, 2) compare against stock, 3) draft purchase orders within budget, 4) email suppliers, 5) notify the owner.' },
        { t: 'tool', tool: 'inventory', call: 'inventory.query_sales', args: { range: '7d', top: 5, sort: 'units_desc' } },
        { t: 'obs', tool: 'inventory', text: 'Top sellers: Ronin Headphones (42 sold · 6 left), Mecha Keyboard (35 · 21), Neon Katana Lamp (31 · 4), Kitsune Hoodie (22 · 9).' },
        { t: 'tool', tool: 'inventory', call: 'inventory.check_safety_stock', args: { skus: ['RONIN-HP', 'KATANA-LMP', 'KITSUNE-HD'] } },
        { t: 'obs', tool: 'inventory', text: '2 SKUs below safety stock: RONIN-HP (6 < 15), KATANA-LMP (4 < 12).' },
        { t: 'think', text: 'Order 60× RONIN-HP and 50× KATANA-LMP. Total $4,120 — within the $6,000 monthly budget.' },
        { t: 'tool', tool: 'email', action: true, call: 'email.send', args: { to: 'orders@supplier-a.example', subject: 'PO-2291 · 60× Ronin Headphones', attach: 'PO-2291.pdf' } },
        { t: 'tool', tool: 'email', action: true, call: 'email.send', args: { to: 'sales@supplier-b.example', subject: 'PO-2292 · 50× Neon Katana Lamp', attach: 'PO-2292.pdf' } },
        { t: 'tool', tool: 'telegram', action: true, call: 'telegram.notify', args: { chat: '@store_owner', text: 'Restock POs sent: PO-2291, PO-2292 ($4,120). ETA 5 days.' } },
        { t: 'final', text: 'Done. 2 purchase orders sent (PO-2291, PO-2292) totalling $4,120, ETA 5 days. I’ll re-check stock tomorrow at 09:00 and alert you if anything drops below safety levels.' }
      ]
    },
    support: {
      goal: 'Answer all unread support tickets',
      steps: [
        { t: 'think', text: 'Plan: fetch unread tickets, classify them, look up the related orders, reply using the knowledge base, and handle refunds.' },
        { t: 'tool', tool: 'email', call: 'inbox.fetch_unread', args: { folder: 'support', limit: 50 } },
        { t: 'obs', tool: 'email', text: '7 unread tickets — 3 shipping questions, 2 order status, 1 refund request (#4821), 1 product question.' },
        { t: 'tool', tool: 'inventory', call: 'orders.lookup', args: { ids: ['#4809', '#4815', '#4821'] } },
        { t: 'obs', tool: 'inventory', text: '#4809 shipped (RJ8823BD) · #4815 packing · #4821 delivered 2 days ago, eligible for return.' },
        { t: 'think', text: 'Drafting 6 replies from the KB (shipping times, tracking links, sizing). Refund #4821 is within the 7-day policy.' },
        { t: 'tool', tool: 'email', action: true, call: 'email.reply_batch', args: { tickets: 6, tone: 'friendly', language: 'auto (EN/BN)' } },
        { t: 'tool', tool: 'payments', action: true, call: 'payments.refund', args: { order: '#4821', amount: 64.0, currency: 'USD', method: 'original' }, fallback: { tool: 'telegram', call: 'telegram.escalate', args: { chat: '@support_team', text: 'Refund needed for #4821 ($64)' } } },
        { t: 'final', text: 'Inbox zero. 6 tickets answered in under 40 seconds, refund #4821 processed and the customer notified. Average first-response time today: 38s.' }
      ]
    },
    leads: {
      goal: 'Find 20 leads and draft outreach',
      steps: [
        { t: 'think', text: 'Plan: search for businesses that sell online without proper checkout, qualify them, save to CRM, then draft personalised emails.' },
        { t: 'tool', tool: 'web', call: 'web.search', args: { query: 'Bangladesh online shops Facebook-only no website checkout', limit: 40 } },
        { t: 'obs', tool: 'web', text: 'Found 37 businesses. 20 qualified: active social pages, 1k+ followers, no website or broken checkout.' },
        { t: 'tool', tool: 'crm', call: 'crm.upsert_leads', args: { count: 20, source: 'agent/web', tag: 'no-checkout' }, fallback: { tool: null, call: 'files.write_csv', args: { path: 'leads-2026-09.csv', rows: 20 } } },
        { t: 'think', text: 'Personalising each email with the shop’s niche, follower count and one concrete idea (e.g. bKash checkout + Telegram order alerts).' },
        { t: 'tool', tool: 'email', action: true, call: 'email.draft_batch', args: { count: 20, template: 'intro-autopilot-store', send: false } },
        { t: 'final', text: '20 qualified leads saved and 20 personalised drafts ready in your outbox for review. Estimated reply rate for this segment: 8–12%.' }
      ]
    },
    generic: {
      steps: [
        { t: 'think', text: 'Breaking the goal into steps: research, gather data, act, then report back.' },
        { t: 'tool', tool: 'web', call: 'web.search', args: { query: '{goal}', limit: 10 } },
        { t: 'obs', tool: 'web', text: 'Collected 10 relevant sources and extracted key facts.' },
        { t: 'tool', tool: 'telegram', action: true, call: 'telegram.notify', args: { chat: '@owner', text: 'Summary ready for: {goal}' } },
        { t: 'final', text: 'I researched “{goal}”, summarised the findings and sent you the report on Telegram. In a real deployment I’d use your own tools and data for this.' }
      ]
    }
  };
  var PERSONA = { ops: 'Operations report', sales: 'Sales update', support: 'Support summary' };
  var ICON = { think: 'sparkle', tool: 'terminal', obs: 'eye', final: 'check', warn: 'alert', wait: 'hand' };
  var LABEL = { think: 'Thinking', tool: 'Tool call', obs: 'Observation', final: 'Result', warn: 'Adapting', wait: 'Needs approval' };

  LAB.register('agent', function (stage) {
    var steps = XR.$('.ag-steps', stage), form = XR.$('.ag-goal', stage), input = XR.$('input', form);
    var temp = XR.$('#ag-temp', stage), tempV = XR.$('.ag-temp-v', stage), nameEl = XR.$('#ag-name', stage), persona = XR.$('#ag-persona', stage);
    var running = false, autonomy = 'approve';

    temp.addEventListener('input', function () { tempV.textContent = Number(temp.value).toFixed(1); });
    XR.$$('[data-auto]', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        autonomy = b.getAttribute('data-auto');
        XR.$$('[data-auto]', stage).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
      });
    });
    function enabled(tool) { if (!tool) return true; var cb = XR.$('[data-tool="' + tool + '"]', stage); return cb && cb.checked; }

    function add(type, html) {
      var li = document.createElement('li');
      li.className = 'ag-step ' + type;
      li.innerHTML = '<span class="ag-ic">' + XR.icon(ICON[type]) + '</span><div><b>' + LABEL[type] + '</b>' + html + '</div>';
      steps.appendChild(li);
      steps.scrollTop = steps.scrollHeight;
      return li;
    }
    function stream(el, text) {
      if (XR.reduce) { el.textContent = text; return Promise.resolve(); }
      el.classList.add('ag-cursor');
      return new Promise(function (res) {
        var i = 0;
        (function go() {
          i = Math.min(text.length, i + 3);
          el.textContent = text.slice(0, i);
          steps.scrollTop = steps.scrollHeight;
          if (i < text.length) setTimeout(go, 14); else { el.classList.remove('ag-cursor'); res(); }
        })();
      });
    }
    function json(obj) { return '<pre class="ag-json">' + XR.esc(JSON.stringify(obj, null, 2)) + '</pre>'; }
    function approval(call) {
      var li = add('wait', '<p>Next action has side effects: <code>' + call + '</code></p><div class="ag-approve"><button type="button" class="btn btn-primary btn-sm" data-ok>Approve</button><button type="button" class="btn btn-ghost btn-sm" data-no>Reject</button></div>');
      return new Promise(function (res) {
        li.addEventListener('click', function (e) {
          var ok = e.target.closest('[data-ok]'), no = e.target.closest('[data-no]');
          if (!ok && !no) return;
          XR.$('.ag-approve', li).innerHTML = '<span class="chip ' + (ok ? 'chip-cyan' : '') + '">' + (ok ? 'Approved' : 'Rejected') + '</span>';
          res(!!ok);
        });
      });
    }

    async function run(key, customGoal) {
      if (running) return;
      running = true;
      XR.$$('.ag-presets button, .ag-goal button', stage).forEach(function (b) { b.disabled = true; });
      var sc = SCENARIOS[key], goal = customGoal || sc.goal, name = nameEl.value.trim() || 'Agent';
      var sub = function (s) { return s.replace(/\{goal\}/g, goal); };
      steps.innerHTML = '';
      add('think', '<p><b style="display:inline;text-transform:none;letter-spacing:0;color:var(--ink)">' + XR.esc(name) + '</b> received goal: “' + XR.esc(goal) + '” · model ' + XR.esc(XR.$('#ag-model', stage).value) + ' · creativity ' + tempV.textContent + ' · autonomy ' + autonomy + '</p>');
      var suggested = 0, stopped = false;
      for (var i = 0; i < sc.steps.length && !stopped; i++) {
        var s = sc.steps[i];
        await LAB.sleep(XR.reduce ? 0 : 450 + Math.random() * 400);
        if (s.t === 'think' || s.t === 'final') {
          if (s.t === 'final') {
            var prefix = PERSONA[persona.value] + ' — ';
            var text = autonomy === 'suggest' && suggested ? 'Plan ready. ' + suggested + ' action(s) are prepared but not executed because autonomy is set to “Suggest”. Switch to “Full auto” and I’ll carry them out.' : sub(s.text);
            var pf = add('final', '<p></p>');
            await stream(XR.$('p', pf), prefix + text);
          } else {
            var p = add('think', '<p></p>');
            await stream(XR.$('p', p), sub(s.text));
          }
          continue;
        }
        if (s.t === 'obs') {
          if (!enabled(s.tool)) continue;
          add('obs', '<p>' + XR.esc(sub(s.text)) + '</p>');
          continue;
        }
        // tool call
        var call = s.call, args = s.args, tool = s.tool;
        if (!enabled(tool)) {
          if (s.fallback) {
            add('warn', '<p>Tool <code>' + tool + '</code> is disabled in the config — falling back to <code>' + s.fallback.call + '</code>.</p>');
            call = s.fallback.call; args = s.fallback.args; tool = s.fallback.tool;
            if (!enabled(tool)) { add('warn', '<p>Fallback is disabled too — skipping this step and noting it in the report.</p>'); continue; }
          } else {
            add('warn', '<p>Tool <code>' + tool + '</code> is disabled — skipping <code>' + call + '</code>.</p>');
            continue;
          }
        }
        var argsSub = JSON.parse(sub(JSON.stringify(args)));
        if (s.action && autonomy === 'suggest') {
          suggested++;
          add('obs', '<p>Suggested (not executed): <code>' + call + '</code></p>' + json(argsSub));
          continue;
        }
        if (s.action && autonomy === 'approve') {
          var ok = await approval(call);
          if (!ok) {
            add('final', '<p>Stopped by you before <code>' + call + '</code>. Nothing was sent. Everything done so far is saved in the audit log.</p>');
            stopped = true; break;
          }
        }
        add('tool', '<p><code>' + call + '</code></p>' + json(argsSub));
        await LAB.sleep(XR.reduce ? 0 : 500);
        if (s.action) add('obs', '<p>' + (call.indexOf('email') === 0 ? 'Sent · 200 OK' : call.indexOf('payments') === 0 ? 'Refund issued · txn rf_9Q2k · 200 OK' : 'Delivered · 200 OK') + '</p>');
      }
      running = false;
      XR.$$('.ag-presets button, .ag-goal button', stage).forEach(function (b) { b.disabled = false; });
    }

    XR.$$('[data-goal]', stage).forEach(function (b) {
      b.addEventListener('click', function () { input.value = SCENARIOS[b.getAttribute('data-goal')].goal; run(b.getAttribute('data-goal')); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = input.value.trim();
      if (!g) { input.focus(); return; }
      var t = g.toLowerCase();
      var key = /stock|inventory|supplier|restock/.test(t) ? 'restock' : /ticket|support|reply|customer|refund/.test(t) ? 'support' : /lead|prospect|outreach|client|sales/.test(t) ? 'leads' : 'generic';
      run(key, g);
    });
  });
})();
