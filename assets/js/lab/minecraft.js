/* Lab stage 05 — BlockRealm Survival
   A playable pixel-art survival world running a fake "RealmCore" server plugin:
   mining, building, crafting, hunger + eating, day/night, zombies, creepers, pigs,
   TNT, ender pearls, crates, shop GUI, advancements, events and plugin commands. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  /* ================================================================
     Constants + data
     ================================================================ */
  var B = 16, CH = 288, W = 200, H = 72, SEA = 29, SPAWN_X = 100, DAY_LEN = 240;
  var GRAV = 30, JUMP = 9.3, SPEED = 4.4, REACH = 5.2;
  var SAVE_KEY = 'xr-mc-save-v1';

  var T = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLE: 4, LOG: 5, LEAVES: 6, PLANKS: 7, SAND: 8, WATER: 9, COAL: 10, IRON: 11, GOLD: 12, DIAMOND: 13, BEDROCK: 14, TORCH: 15, GLASS: 16, TNT: 17, CHEST: 18, FLOWER: 19, TALLGRASS: 20 };
  // solid, opaque (blocks sky light), hardness, needs pickaxe, tier needed for a drop, drop item
  var BL = [];
  function bl(id, o) { BL[id] = o; }
  bl(T.AIR, { n: 'Air' });
  bl(T.GRASS, { n: 'Grass Block', s: 1, o: 1, h: .6, drop: 'dirt', c: ['#5fbf3b', '#7a5230'] });
  bl(T.DIRT, { n: 'Dirt', s: 1, o: 1, h: .5, drop: 'dirt', c: ['#7a5230', '#5d3c20'] });
  bl(T.STONE, { n: 'Stone', s: 1, o: 1, h: 1.5, pick: 1, tier: 1, drop: 'cobble', c: ['#7d7d86', '#5f5f68'] });
  bl(T.COBBLE, { n: 'Cobblestone', s: 1, o: 1, h: 2, pick: 1, tier: 1, drop: 'cobble', c: ['#8a8a92', '#55555c'] });
  bl(T.LOG, { n: 'Oak Log', s: 1, o: 1, h: 2, drop: 'log', c: ['#6b4a2b', '#4f361e'] });
  bl(T.LEAVES, { n: 'Leaves', s: 1, h: .2, drop: 'leaves', c: ['#2f7a24', '#235c1b'] });
  bl(T.PLANKS, { n: 'Oak Planks', s: 1, o: 1, h: 2, drop: 'planks', c: ['#b8864b', '#8a6232'] });
  bl(T.SAND, { n: 'Sand', s: 1, o: 1, h: .5, drop: 'sand', c: ['#e3d59a', '#c9b878'] });
  bl(T.WATER, { n: 'Water', liquid: 1 });
  bl(T.COAL, { n: 'Coal Ore', s: 1, o: 1, h: 3, pick: 1, tier: 1, drop: 'coal', xp: 1, coins: 2, c: ['#7d7d86', '#1c1c1c'] });
  bl(T.IRON, { n: 'Iron Ore', s: 1, o: 1, h: 3, pick: 1, tier: 2, drop: 'raw_iron', xp: 1, coins: 8, c: ['#7d7d86', '#d8af93'] });
  bl(T.GOLD, { n: 'Gold Ore', s: 1, o: 1, h: 3, pick: 1, tier: 3, drop: 'raw_gold', xp: 2, coins: 20, c: ['#7d7d86', '#f7d154'] });
  bl(T.DIAMOND, { n: 'Diamond Ore', s: 1, o: 1, h: 3, pick: 1, tier: 3, drop: 'diamond', xp: 5, coins: 50, c: ['#7d7d86', '#5ff0e0'] });
  bl(T.BEDROCK, { n: 'Bedrock', s: 1, o: 1, h: Infinity, c: ['#333', '#111'] });
  bl(T.TORCH, { n: 'Torch', h: 0, drop: 'torch', c: ['#ffe14d', '#8a5a2b'] });
  bl(T.GLASS, { n: 'Glass', s: 1, h: .3, drop: 'glass', c: ['#cfefff', '#9fd0e8'] });
  bl(T.TNT, { n: 'TNT', s: 1, o: 1, h: 0, drop: 'tnt', c: ['#d8372b', '#efe4cc'] });
  bl(T.CHEST, { n: 'Chest', s: 1, o: 1, h: 2.5, drop: 'planks', c: ['#a0692e', '#5a3a1a'] });
  bl(T.FLOWER, { n: 'Poppy', h: 0, c: ['#e8322e', '#3f8a2e'] });
  bl(T.TALLGRASS, { n: 'Grass', h: 0, c: ['#5fbf3b', '#3f8a2e'] });

  // items: block (placeable), food, tool, spr (flat sprite)
  var IT = {
    dirt: { n: 'Dirt', block: T.DIRT }, cobble: { n: 'Cobblestone', block: T.COBBLE }, log: { n: 'Oak Log', block: T.LOG },
    planks: { n: 'Oak Planks', block: T.PLANKS }, sand: { n: 'Sand', block: T.SAND }, glass: { n: 'Glass', block: T.GLASS },
    leaves: { n: 'Leaves', block: T.LEAVES }, torch: { n: 'Torch', block: T.TORCH, spr: 'torch' }, tnt: { n: 'TNT', block: T.TNT },
    stick: { n: 'Stick', spr: 'stick' }, coal: { n: 'Coal', spr: 'coal' }, raw_iron: { n: 'Raw Iron', spr: 'raw_iron' },
    raw_gold: { n: 'Raw Gold', spr: 'raw_gold' }, iron_ingot: { n: 'Iron Ingot', spr: 'iron_ingot' }, gold_ingot: { n: 'Gold Ingot', spr: 'gold_ingot' },
    diamond: { n: 'Diamond', spr: 'diamond' }, gunpowder: { n: 'Gunpowder', spr: 'gunpowder' }, pearl: { n: 'Ender Pearl', spr: 'pearl', max: 16 },
    apple: { n: 'Apple', spr: 'apple', food: 4 }, golden_apple: { n: 'Golden Apple', spr: 'golden_apple', food: 4, gold: 1 },
    porkchop: { n: 'Raw Porkchop', spr: 'porkchop', food: 3 }, cooked_porkchop: { n: 'Cooked Porkchop', spr: 'cooked_porkchop', food: 8 },
    bread: { n: 'Bread', spr: 'bread', food: 5 }, rotten_flesh: { n: 'Rotten Flesh', spr: 'rotten_flesh', food: 4 },
    key: { n: 'Legend Crate Key', spr: 'key', max: 16 }, coins: { n: 'Coins', spr: 'coin' },
    wood_pick: { n: 'Wooden Pickaxe', spr: 'pick', col: '#a0692e', tool: 'pick', tier: 1, dmg: 2 },
    stone_pick: { n: 'Stone Pickaxe', spr: 'pick', col: '#8f8f96', tool: 'pick', tier: 2, dmg: 3 },
    iron_pick: { n: 'Iron Pickaxe', spr: 'pick', col: '#e6e6e6', tool: 'pick', tier: 3, dmg: 4 },
    diamond_pick: { n: 'Diamond Pickaxe', spr: 'pick', col: '#4fe3e0', tool: 'pick', tier: 4, dmg: 5 },
    wood_sword: { n: 'Wooden Sword', spr: 'sword', col: '#a0692e', tool: 'sword', dmg: 4 },
    stone_sword: { n: 'Stone Sword', spr: 'sword', col: '#8f8f96', tool: 'sword', dmg: 5 },
    iron_sword: { n: 'Iron Sword', spr: 'sword', col: '#e6e6e6', tool: 'sword', dmg: 6 },
    diamond_sword: { n: 'Diamond Sword', spr: 'sword', col: '#4fe3e0', tool: 'sword', dmg: 7 }
  };
  var PICK_SPEED = [1, 2, 4, 6, 8];

  var RECIPES = [
    { out: 'planks', n: 4, need: { log: 1 } },
    { out: 'stick', n: 4, need: { planks: 2 } },
    { out: 'torch', n: 4, need: { stick: 1, coal: 1 } },
    { out: 'wood_pick', need: { planks: 3, stick: 2 } },
    { out: 'wood_sword', need: { planks: 2, stick: 1 } },
    { out: 'stone_pick', need: { cobble: 3, stick: 2 } },
    { out: 'stone_sword', need: { cobble: 2, stick: 1 } },
    { out: 'iron_ingot', need: { raw_iron: 1, coal: 1 }, smelt: 1 },
    { out: 'gold_ingot', need: { raw_gold: 1, coal: 1 }, smelt: 1 },
    { out: 'iron_pick', need: { iron_ingot: 3, stick: 2 } },
    { out: 'iron_sword', need: { iron_ingot: 2, stick: 1 } },
    { out: 'diamond_pick', need: { diamond: 3, stick: 2 } },
    { out: 'diamond_sword', need: { diamond: 2, stick: 1 } },
    { out: 'cooked_porkchop', need: { porkchop: 1, coal: 1 }, smelt: 1 },
    { out: 'glass', need: { sand: 1, coal: 1 }, smelt: 1 },
    { out: 'tnt', need: { gunpowder: 1, sand: 4 } },
    { out: 'golden_apple', need: { apple: 1, gold_ingot: 4 } }
  ];

  var SHOP = [
    { id: 'diamond_sword', price: 250 }, { id: 'golden_apple', n: 2, price: 120 }, { id: 'pearl', n: 8, price: 120 },
    { id: 'iron_pick', price: 150 }, { id: 'torch', n: 16, price: 40 }, { id: 'tnt', n: 4, price: 160 },
    { id: 'cooked_porkchop', n: 8, price: 80 }, { id: 'key', price: 300, label: 'Legend Crate Key' }, { id: 'rank', price: 1500, label: 'Rank [VIP]' }
  ];
  var CRATE = [
    { id: 'diamond', n: 3, w: 10 }, { id: 'golden_apple', n: 2, w: 10 }, { id: 'diamond_sword', n: 1, w: 6 }, { id: 'iron_pick', n: 1, w: 10 },
    { id: 'tnt', n: 4, w: 12 }, { id: 'pearl', n: 8, w: 12 }, { id: 'coins', n: 500, w: 8 }, { id: 'cooked_porkchop', n: 8, w: 14 }, { id: 'diamond_pick', n: 1, w: 4 }
  ];

  var ADV = {
    wood: ['Getting Wood', 'Punch a tree until a log pops out', 'log'],
    stone: ['Stone Age', 'Mine cobblestone with a pickaxe', 'cobble'],
    upgrade: ['Getting an Upgrade', 'Craft a better pickaxe', 'stone_pick'],
    iron: ['Acquire Hardware', 'Smelt an iron ingot', 'iron_ingot'],
    diamonds: ['Diamonds!', 'Find diamonds deep underground', 'diamond'],
    light: ['Let There Be Light', 'Place a torch', 'torch'],
    eat: ['Husbandry', 'Eat something', 'cooked_porkchop'],
    hunter: ['Monster Hunter', 'Defeat a hostile mob', 'iron_sword'],
    night: ['Survive the Night', 'See the sunrise alive', 'bread'],
    boom: ['Kaboom', 'Blow something up with TNT', 'tnt'],
    pearl: ['Beam Me Up', 'Teleport with an ender pearl', 'pearl'],
    vip: ['VIP Status', 'Rank up on the server', 'key'],
    moon: ['Blood Moon Slayer', 'Win the Blood Moon event', 'golden_apple']
  };

  /* ================================================================
     Pixel sprites (8x8) for items and HUD
     ================================================================ */
  var SPR = {
    stick: { p: ['......d.', '.....b..', '....b...', '...b....', '..b.....', '.d......', '........', '........'], c: { b: '#8a5a2b', d: '#5e3b1a' } },
    coal: { p: ['........', '..kkk...', '.kKkkk..', '.kkkKkk.', '.kKkkkk.', '..kkkk..', '...kk...', '........'], c: { k: '#262626', K: '#5a5a5a' } },
    raw_iron: { p: ['........', '..kkk...', '.kKkkk..', '.kkkKkk.', '.kKkkkk.', '..kkkk..', '...kk...', '........'], c: { k: '#a47456', K: '#e8c4a8' } },
    raw_gold: { p: ['........', '..kkk...', '.kKkkk..', '.kkkKkk.', '.kKkkkk.', '..kkkk..', '...kk...', '........'], c: { k: '#c9951e', K: '#ffe680' } },
    iron_ingot: { p: ['........', '........', '...IIIII', '..IiiiiI', '.IiiiiI.', 'IIIIII..', '........', '........'], c: { I: '#8f8f8f', i: '#ececec' } },
    gold_ingot: { p: ['........', '........', '...IIIII', '..IiiiiI', '.IiiiiI.', 'IIIIII..', '........', '........'], c: { I: '#b8860b', i: '#ffe066' } },
    diamond: { p: ['........', '..cccc..', '.cCCCCc.', 'cCwCCCCc', '.cCCCCc.', '..cCCc..', '...cc...', '........'], c: { c: '#128a8a', C: '#5ff0e0', w: '#e9ffff' } },
    gunpowder: { p: ['........', '..g.g...', '.gGg.g..', '..gGgg..', '.g.gGg..', '..g.g...', '........', '........'], c: { g: '#5a5a5a', G: '#a0a0a0' } },
    pearl: { p: ['..tttt..', '.tTTTTt.', 'tTTwTTTt', 'tTTTTTTt', 'tTTTTTTt', 'tTTTTTTt', '.tTTTTt.', '..tttt..'], c: { t: '#0f5c55', T: '#2bb3a6', w: '#bff' } },
    apple: { p: ['....g...', '...g....', '.rrrrrr.', 'rrrrrrrr', 'rrwrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..'], c: { g: '#3f8a2e', r: '#e0302a', w: '#ff9a8a' } },
    golden_apple: { p: ['....g...', '...g....', '.yyyyyy.', 'yyyyyyyy', 'yywyyyyy', 'yyyyyyyy', '.yyyyyy.', '..yyyy..'], c: { g: '#3f8a2e', y: '#ffcc33', w: '#fff6b0' } },
    porkchop: { p: ['........', '.pppppp.', 'pPPPPPPp', 'pPwPPPPp', 'pPPPPwPp', '.pppppp.', '........', '........'], c: { p: '#d7707a', P: '#f5b0b5', w: '#fff' } },
    cooked_porkchop: { p: ['........', '.pppppp.', 'pPPPPPPp', 'pPwPPPPp', 'pPPPPwPp', '.pppppp.', '........', '........'], c: { p: '#6b3818', P: '#b8743c', w: '#e8c48a' } },
    rotten_flesh: { p: ['........', '.pppp...', 'pPPwPp..', 'pPPPPPp.', '.pPwPPPp', '..ppppp.', '........', '........'], c: { p: '#5a3a1a', P: '#8a7a3a', w: '#4a6b2b' } },
    bread: { p: ['........', '..bbbb..', '.bBBBBb.', 'bBwBwBBb', 'bBBBBBBb', '.bbbbbb.', '........', '........'], c: { b: '#8a5a2b', B: '#d49a4c', w: '#f0c878' } },
    torch: { p: ['...yy...', '...oy...', '...ww...', '...ww...', '...ww...', '...ww...', '...ww...', '........'], c: { y: '#ffe14d', o: '#ff8a00', w: '#8a5a2b' } },
    key: { p: ['..yyy...', '.y...y..', '.y...y..', '..yyy...', '...y....', '...yy...', '...y....', '...yy...'], c: { y: '#ffcc33' } },
    coin: { p: ['..yyyy..', '.yYYYYy.', 'yYyyyYYy', 'yYyYYYYy', 'yYyyyYYy', 'yYYYYYYy', '.yYYYYy.', '..yyyy..'], c: { y: '#b8860b', Y: '#ffd84a' } },
    pick: { p: ['.HHHHHH.', 'H..ss..H', '...ss...', '...ss...', '...ss...', '...ss...', '...ss...', '........'], c: { s: '#8a5a2b' } },
    sword: { p: ['......BB', '.....BBB', '....BBB.', '.g.BBB..', '..gBB...', '..sg....', '.s..g...', 's.......'], c: { g: '#6b4a2b', s: '#6b4a2b' } },
    heart: { p: ['.XX.XX.', 'XrrXrrX', 'XrwrrrX', 'XrrrrrX', '.XrrrX.', '..XrX..', '...X...'], c: { X: '#1a0000', r: '#e4202a', w: '#ffb0b0' } },
    food: { p: ['...XXX.', '..XbbbX', '..XbwbX', '.XmXbX.', 'XmX.X..', 'XX.....', '.......'], c: { X: '#2a1400', b: '#c8743a', w: '#f0b070', m: '#ede3d0' } }
  };

  function sprSVG(name, cols, cls) {
    var s = SPR[name], d = '', map = Object.assign({}, s.c, cols || {});
    s.p.forEach(function (row, y) {
      row.split('').forEach(function (ch, x) { if (map[ch]) d += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + map[ch] + '"/>'; });
    });
    return '<svg class="' + (cls || '') + '" viewBox="0 0 ' + s.p[0].length + ' ' + s.p.length + '" shape-rendering="crispEdges" aria-hidden="true">' + d + '</svg>';
  }
  function heartSVG(state) { // 2 full, 1 half, 0 empty
    if (state === 2) return sprSVG('heart', null, 'mc-hi');
    if (state === 0) return sprSVG('heart', { r: '#3a2226', w: '#3a2226' }, 'mc-hi');
    return sprSVG('heart', { r: '#3a2226', w: '#3a2226' }, 'mc-hi').replace(/(<rect x="[0-3](\.\d+)?" [^>]*fill=")#3a2226/g, '$1#e4202a');
  }
  function foodSVG(state) {
    if (state === 2) return sprSVG('food', null, 'mc-hi');
    if (state === 0) return sprSVG('food', { b: '#3a2a1a', w: '#3a2a1a', m: '#5a5046' }, 'mc-hi');
    return sprSVG('food', { b: '#3a2a1a', w: '#3a2a1a' }, 'mc-hi').replace(/(<rect x="[4-6](\.\d+)?" [^>]*fill=")#3a2a1a/g, '$1#c8743a');
  }

  function mc(text) {
    var out = '', open = false;
    XR.esc(text).replace(/&amp;[lnmo]/g, '').split(/&amp;([0-9a-f])/).forEach(function (part, i) {
      if (i % 2 === 1) { if (open) out += '</span>'; out += '<span class="c-' + part + '">'; open = true; }
      else out += part;
    });
    return out + (open ? '</span>' : '');
  }

  /* ================================================================
     Stage
     ================================================================ */
  LAB.register('minecraft', function (stage) {
    var wrap = XR.$('.mc-wrap', stage);
    var rand = LAB.rng('blockrealm-survival');
    var I = XR.icon;

    wrap.innerHTML =
      '<div class="mc-screen" tabindex="-1">' +
        '<canvas class="mc-canvas" width="512" height="' + CH + '" aria-label="BlockRealm: a playable pixel-art survival world"></canvas>' +
        '<div class="mc-flash" aria-hidden="true"></div>' +
        '<div class="mc-top"><div class="mc-tools">' +
          '<button type="button" class="mc-ib mc-sound" aria-label="Mute sound" aria-pressed="false">' + I('volume') + '</button>' +
          '<button type="button" class="mc-ib mc-full" aria-label="Fullscreen">' + I('fullscreen') + '</button>' +
          '<button type="button" class="mc-ib mc-pause" aria-label="Pause">' + I('pause') + '</button></div>' +
          '<span class="mc-info"></span></div>' +
        '<div class="mc-boss" hidden><span></span><div><i></i></div></div>' +
        '<div class="mc-board"><b>BLOCKREALM</b><span>Rank <em class="mc-rank">[MEMBER]</em></span><span>Coins <em class="mc-coins">0</em></span><span>Kills <em class="mc-kills">0</em></span><span>Mined <em class="mc-mined">0</em></span><span>Advancements <em class="mc-adv">0/13</em></span></div>' +
        '<div class="mc-toasts" aria-live="polite"></div>' +
        '<div class="mc-chat" role="log" aria-live="polite"></div>' +
        '<form class="mc-input" autocomplete="off" hidden><input type="text" placeholder="Type a message or /help" aria-label="Minecraft chat" maxlength="80"></form>' +
        '<div class="mc-hud">' +
          '<div class="mc-bars"><div class="mc-hearts" aria-label="Health"></div><div class="mc-food" aria-label="Hunger"></div></div>' +
          '<div class="mc-xp"><i></i><b>0</b></div>' +
          '<div class="mc-hotbar" role="toolbar" aria-label="Hotbar"></div>' +
        '</div>' +
        '<div class="mc-gui mc-inv" hidden><div class="mc-gui-box mc-inv-box">' +
          '<div class="mc-gui-title">Inventory <span>Tap two slots to swap</span></div>' +
          '<div class="mc-inv-cols"><div><div class="mc-slots mc-bag"></div><div class="mc-slots mc-bag-hot"></div></div>' +
          '<div class="mc-craft"><div class="mc-gui-sub">Crafting &amp; smelting</div><div class="mc-recipes"></div></div></div>' +
          '<div class="mc-gui-foot"><button type="button" class="mc-btn mc-close">Close (E)</button><button type="button" class="mc-btn mc-reset">New world</button></div>' +
        '</div></div>' +
        '<div class="mc-gui mc-shop" hidden><div class="mc-gui-box">' +
          '<div class="mc-gui-title">Realm Shop <span>Click an item to buy</span></div>' +
          '<div class="mc-slots mc-shop-slots"></div>' +
          '<p class="mc-gui-note">Items go straight into your inventory.</p>' +
          '<div class="mc-gui-foot"><button type="button" class="mc-btn mc-close">Close (Esc)</button></div>' +
        '</div></div>' +
        '<div class="mc-gui mc-crate" hidden><div class="mc-gui-box">' +
          '<div class="mc-gui-title">Legend Crate <span class="mc-crate-state">Spinning...</span></div>' +
          '<div class="mc-reel"><div class="mc-reel-track"></div><i class="mc-reel-mark"></i></div>' +
          '<div class="mc-gui-foot"><button type="button" class="mc-btn mc-close" disabled>Collect</button></div>' +
        '</div></div>' +
        '<div class="mc-over mc-start"><div>' +
          '<p class="mc-logo">BLOCK<span>REALM</span></p><p class="mc-tag">Survival · RealmCore plugin v4</p>' +
          '<div class="mc-menu"><button type="button" class="mc-btn mc-play">Play</button><button type="button" class="mc-btn mc-new" hidden>New world</button></div>' +
          '<p class="mc-help mc-help-keys"><b>A D</b> move · <b>W</b> / <b>Space</b> jump · <b>Left click</b> mine &amp; attack · <b>Right click</b> build, eat &amp; use · <b>1–9</b> items · <b>E</b> craft · <b>T</b> chat</p>' +
          '<p class="mc-help mc-help-touch">Use the pad under the screen. Tap the world to mine, or switch to <b>Build</b> to place blocks.</p>' +
        '</div></div>' +
        '<div class="mc-over mc-paused" hidden><div><p class="mc-logo sm">Game paused</p><div class="mc-menu"><button type="button" class="mc-btn mc-resume">Back to game</button></div><p class="mc-help">Your world is saved in this browser.</p></div></div>' +
        '<div class="mc-over mc-dead" hidden><div><p class="mc-logo sm red">You died!</p><p class="mc-help mc-dead-why"></p><div class="mc-menu"><button type="button" class="mc-btn mc-respawn">Respawn</button></div><p class="mc-help">RealmCore <b>KeepInventory</b> is on for this server.</p></div></div>' +
      '</div>' +
      '<div class="mc-pad" aria-label="Touch controls">' +
        '<div class="mp-dir"><button type="button" data-hold="left" aria-label="Move left">' + I('arrow-left') + '</button><button type="button" data-hold="right" aria-label="Move right">' + I('arrow-right') + '</button></div>' +
        '<div class="mp-mid"><button type="button" class="mp-mode" aria-label="Switch between mine and build"></button><button type="button" class="mp-eat" aria-label="Eat">' + sprSVG('apple', null, 'mp-spr') + '<span>Eat</span></button><button type="button" class="mp-bag" aria-label="Inventory and crafting">' + sprSVG('pick', { H: '#8f8f96' }, 'mp-spr') + '<span>Craft</span></button><button type="button" class="mp-chat" aria-label="Chat">' + I('chat') + '<span>Chat</span></button></div>' +
        '<div class="mp-jump"><button type="button" data-hold="down" class="mp-down" aria-label="Fly down" hidden>' + I('chevron-down') + '</button><button type="button" data-hold="jump" aria-label="Jump">' + I('arrow-up') + '</button></div>' +
      '</div>';

    var $ = function (s) { return XR.$(s, wrap); };
    var screen = $('.mc-screen'), canvas = $('.mc-canvas'), ctx = canvas.getContext('2d');
    var chat = $('.mc-chat'), form = $('.mc-input'), input = XR.$('input', form);
    var hotbarEl = $('.mc-hotbar'), heartsEl = $('.mc-hearts'), foodEl = $('.mc-food'), xpEl = $('.mc-xp');
    var infoEl = $('.mc-info'), bossEl = $('.mc-boss'), toastsEl = $('.mc-toasts'), flashEl = $('.mc-flash');
    var guiInv = $('.mc-inv'), guiShop = $('.mc-shop'), guiCrate = $('.mc-crate');
    var ovStart = $('.mc-start'), ovPause = $('.mc-paused'), ovDead = $('.mc-dead');
    var CW = 512;

    /* ---------------- textures ---------------- */
    function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
    var TEX = [], TOPTEX = [], r = rand;
    function noiseTex(base, dark, light, n) {
      var c = mk(B), g = c.getContext('2d');
      g.fillStyle = base; g.fillRect(0, 0, B, B);
      for (var i = 0; i < (n || 26); i++) { g.fillStyle = r() < .5 ? dark : (light || dark); g.fillRect((r() * B) | 0, (r() * B) | 0, 1 + (r() < .3), 1); }
      return c;
    }
    function oreTex(col, dark) {
      var c = noiseTex('#7d7d86', '#666670', '#8d8d96'), g = c.getContext('2d');
      for (var k = 0; k < 5; k++) {
        var x = 2 + (r() * 11) | 0, y = 2 + (r() * 11) | 0;
        g.fillStyle = dark; g.fillRect(x, y, 3, 2); g.fillStyle = col; g.fillRect(x, y, 2, 2); g.fillRect(x + 1, y + 1, 1, 1);
      }
      return c;
    }
    (function buildTextures() {
      var g, c;
      TEX[T.DIRT] = noiseTex('#7a5230', '#5d3c20', '#8b6139', 40);
      c = noiseTex('#7a5230', '#5d3c20', '#8b6139', 40); g = c.getContext('2d');
      g.fillStyle = '#5fbf3b'; g.fillRect(0, 0, B, 4);
      for (var i = 0; i < B; i++) { g.fillStyle = r() < .5 ? '#4ea82f' : '#5fbf3b'; g.fillRect(i, 4, 1, (r() * 3) | 0); }
      g.fillStyle = '#7ad64f'; for (i = 0; i < 6; i++) g.fillRect((r() * B) | 0, (r() * 3) | 0, 1, 1);
      TEX[T.GRASS] = c;
      TOPTEX[T.GRASS] = noiseTex('#5fbf3b', '#4ea82f', '#7ad64f', 40);
      TEX[T.STONE] = noiseTex('#7d7d86', '#666670', '#8d8d96', 44);
      c = mk(B); g = c.getContext('2d'); g.fillStyle = '#6a6a72'; g.fillRect(0, 0, B, B);
      [[0, 0, 7, 5], [8, 0, 8, 6], [0, 6, 5, 5], [6, 7, 6, 4], [13, 7, 3, 5], [0, 12, 9, 4], [10, 12, 6, 4]].forEach(function (q) {
        g.fillStyle = r() < .5 ? '#8a8a92' : '#9a9aa2'; g.fillRect(q[0] + 1, q[1] + 1, q[2] - 1, q[3] - 1);
      });
      TEX[T.COBBLE] = c;
      c = mk(B); g = c.getContext('2d'); g.fillStyle = '#6b4a2b'; g.fillRect(0, 0, B, B);
      for (i = 0; i < B; i += 3) { g.fillStyle = '#4f361e'; g.fillRect(i, 0, 1, B); }
      for (i = 0; i < 10; i++) { g.fillStyle = '#7d5835'; g.fillRect((r() * B) | 0, (r() * B) | 0, 1, 2); }
      TEX[T.LOG] = c;
      c = noiseTex('#2f7a24', '#1f5418', '#3f9a30', 70); TEX[T.LEAVES] = c;
      c = mk(B); g = c.getContext('2d'); g.fillStyle = '#b8864b'; g.fillRect(0, 0, B, B);
      g.fillStyle = '#8a6232'; [3, 7, 11, 15].forEach(function (y) { g.fillRect(0, y, B, 1); });
      [[5, 0], [12, 4], [2, 8], [9, 12]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 3); });
      g.fillStyle = '#c99a5c'; for (i = 0; i < 8; i++) g.fillRect((r() * B) | 0, (r() * B) | 0, 2, 1);
      TEX[T.PLANKS] = c;
      TEX[T.SAND] = noiseTex('#e3d59a', '#c9b878', '#efe3b0', 40);
      c = mk(B); g = c.getContext('2d'); g.fillStyle = 'rgba(40,110,255,.62)'; g.fillRect(0, 0, B, B);
      g.fillStyle = 'rgba(160,200,255,.35)'; g.fillRect(0, 0, B, 1); g.fillRect(3, 5, 5, 1); g.fillRect(9, 10, 5, 1);
      TEX[T.WATER] = c;
      TEX[T.COAL] = oreTex('#1c1c1c', '#101010');
      TEX[T.IRON] = oreTex('#e8c4a8', '#a47456');
      TEX[T.GOLD] = oreTex('#ffe066', '#c9951e');
      TEX[T.DIAMOND] = oreTex('#7ff5ea', '#128a8a');
      TEX[T.BEDROCK] = noiseTex('#3a3a3a', '#111', '#5a5a5a', 90);
      c = mk(B); g = c.getContext('2d'); g.fillStyle = '#8a5a2b'; g.fillRect(7, 6, 2, 10); g.fillStyle = '#ffe14d'; g.fillRect(7, 3, 2, 3); g.fillStyle = '#ff8a00'; g.fillRect(7, 5, 2, 1); g.fillStyle = '#fff6b0'; g.fillRect(7, 3, 1, 1);
      TEX[T.TORCH] = c;
      c = mk(B); g = c.getContext('2d'); g.fillStyle = 'rgba(200,235,255,.14)'; g.fillRect(0, 0, B, B);
      g.fillStyle = '#d8f1ff'; g.fillRect(0, 0, B, 1); g.fillRect(0, B - 1, B, 1); g.fillRect(0, 0, 1, B); g.fillRect(B - 1, 0, 1, B);
      g.fillRect(3, 3, 1, 1); g.fillRect(4, 4, 1, 1); g.fillRect(5, 5, 1, 1); g.fillRect(10, 9, 1, 1); g.fillRect(11, 10, 1, 1);
      TEX[T.GLASS] = c;
      c = mk(B); g = c.getContext('2d'); g.fillStyle = '#d8372b'; g.fillRect(0, 0, B, B);
      g.fillStyle = '#b02a20'; for (i = 1; i < B; i += 3) g.fillRect(i, 0, 1, B);
      g.fillStyle = '#efe4cc'; g.fillRect(0, 5, B, 6); g.fillStyle = '#1c1c1c';
      ['x.x.x.xxx', '.x..x..x.'].forEach(function () { /* keep */ });
      [[2, 6], [3, 6], [4, 6], [3, 7], [3, 8], [3, 9], [6, 6], [6, 7], [6, 8], [6, 9], [7, 7], [8, 8], [9, 6], [9, 7], [9, 8], [9, 9], [11, 6], [12, 6], [13, 6], [12, 7], [12, 8], [12, 9]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); });
      TEX[T.TNT] = c;
      c = mk(B); g = c.getContext('2d'); g.fillStyle = '#5a3a1a'; g.fillRect(0, 0, B, B); g.fillStyle = '#a0692e'; g.fillRect(1, 1, 14, 6); g.fillRect(1, 8, 14, 7);
      g.fillStyle = '#8a5a26'; g.fillRect(1, 4, 14, 1); g.fillRect(1, 11, 14, 1); g.fillStyle = '#ffcc33'; g.fillRect(7, 6, 2, 3); g.fillStyle = '#3a2a10'; g.fillRect(7, 8, 2, 1);
      TEX[T.CHEST] = c;
      c = mk(B); g = c.getContext('2d'); g.fillStyle = '#3f8a2e'; g.fillRect(7, 8, 2, 8); g.fillRect(5, 11, 2, 1);
      g.fillStyle = '#e8322e'; g.fillRect(6, 4, 4, 4); g.fillRect(5, 5, 6, 2); g.fillStyle = '#1c1c1c'; g.fillRect(7, 5, 2, 2);
      TEX[T.FLOWER] = c;
      c = mk(B); g = c.getContext('2d'); g.fillStyle = '#4ea82f';
      [[2, 9], [4, 6], [6, 10], [8, 4], [10, 8], [12, 5], [13, 10]].forEach(function (p) { g.fillRect(p[0], p[1], 1, B - p[1]); });
      g.fillStyle = '#6fcf45'; [[3, 11], [7, 8], [11, 9]].forEach(function (p) { g.fillRect(p[0], p[1], 1, B - p[1]); });
      TEX[T.TALLGRASS] = c;
    })();

    // darkened copies for background walls
    var BGTEX = [];
    [T.DIRT, T.STONE, T.PLANKS].forEach(function (id) {
      var c = mk(B), g = c.getContext('2d'); g.drawImage(TEX[id], 0, 0); g.fillStyle = 'rgba(8,8,16,.58)'; g.fillRect(0, 0, B, B); BGTEX[id] = c;
    });
    // crack stages
    var CRACKS = [];
    (function () {
      var pts = [], cr = LAB.rng('cracks');
      for (var i = 0; i < 60; i++) pts.push([(cr() * B) | 0, (cr() * B) | 0]);
      for (var s = 0; s < 10; s++) {
        var c = mk(B), g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,0,.72)';
        for (var k = 0; k < (s + 1) * 6; k++) g.fillRect(pts[k][0], pts[k][1], 1, 1);
        CRACKS.push(c);
      }
    })();

    /* ---------------- item icons ---------------- */
    var ICON = {}, ICONC = {};
    function itemCanvas(id) {
      if (ICONC[id]) return ICONC[id];
      var c = mk(32), g = c.getContext('2d'), it = IT[id] || {};
      g.imageSmoothingEnabled = false;
      if (it.block != null && !it.spr) {
        var tex = TEX[it.block], top = TOPTEX[it.block] || tex;
        g.setTransform(1, .5, -1, .5, 16, 0); g.drawImage(top, 0, 0);
        g.setTransform(1, .5, 0, 1, 0, 8); g.drawImage(tex, 0, 0); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 0, 16, 16);
        g.setTransform(1, -.5, 0, 1, 16, 16); g.drawImage(tex, 0, 0); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, 0, 16, 16);
        g.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        var s = SPR[it.spr || id] || SPR.coin, map = Object.assign({}, s.c, it.col ? { H: it.col, B: it.col } : {});
        s.p.forEach(function (row, y) { row.split('').forEach(function (ch, x) { if (map[ch]) { g.fillStyle = map[ch]; g.fillRect(x * 4, y * 4, 4, 4); } }); });
      }
      ICONC[id] = c;
      return c;
    }
    function icon(id) {
      if (!ICON[id]) { try { ICON[id] = itemCanvas(id).toDataURL(); } catch (e) { ICON[id] = ''; } }
      return '<img src="' + ICON[id] + '" alt="" draggable="false">';
    }
    function itemName(id) { return (IT[id] && IT[id].n) || id; }

    /* ---------------- world ---------------- */
    var world = new Uint8Array(W * H), bg = new Uint8Array(W * H), skyTop = new Int16Array(W), surf = new Int16Array(W), sky = new Uint8Array(W * H), lightDirty = true;
    var torches = {}, chests = {};
    function get(x, y) { return x < 0 || x >= W || y < 0 ? 0 : y >= H ? T.BEDROCK : world[y * W + x]; }
    function solidAt(x, y) { if (x < 0 || x >= W) return true; var b = BL[get(x, y)]; return !!(b && b.s); }
    function set(x, y, id) {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      var k = y * W + x, old = world[k];
      if (old === T.TORCH) delete torches[k];
      world[k] = id;
      if (id === T.TORCH) torches[k] = 1;
      calcSky(x);
    }
    function calcSky(x) {
      var y = 0;
      while (y < H && !(BL[world[y * W + x]] || {}).o) y++;
      skyTop[x] = y;
      lightDirty = true;
    }
    // Minecraft-style skylight: full light straight down from the sky, then it spreads
    // sideways through open tiles, losing one level per tile (so doors and caves glow softly).
    function relight() {
      lightDirty = false;
      sky.fill(0);
      var q = [], x, y, k;
      for (x = 0; x < W; x++) {
        var lv = 15;
        for (y = 0; y < H; y++) {
          k = y * W + x;
          var id = world[k];
          if ((BL[id] || {}).o) { sky[k] = lv; break; }
          if (id === T.LEAVES || id === T.WATER) lv = Math.max(0, lv - 1);
          sky[k] = lv; q.push(k);
        }
      }
      for (var h = 0; h < q.length; h++) {
        k = q[h];
        var nl = sky[k] - 1; if (nl <= 0) continue;
        var kx = k % W, n;
        for (var d = 0; d < 4; d++) {
          if (d === 0) { if (kx === 0) continue; n = k - 1; } else if (d === 1) { if (kx === W - 1) continue; n = k + 1; }
          else if (d === 2) { if (k < W) continue; n = k - W; } else { n = k + W; if (n >= W * H) continue; }
          if (sky[n] >= nl) continue;
          sky[n] = nl;
          if (!(BL[world[n]] || {}).o) q.push(n);
        }
      }
    }

    function generate(seedStr) {
      var gr = LAB.rng(seedStr);
      world.fill(0); bg.fill(0); torches = {}; chests = {};
      function noise(scale) {
        var pts = []; for (var i = 0; i <= W / scale + 2; i++) pts.push(gr());
        return function (x) { var i = Math.floor(x / scale), f = x / scale - i, t = (1 - Math.cos(f * Math.PI)) / 2; return pts[i] * (1 - t) + pts[i + 1] * t; };
      }
      var n1 = noise(26), n2 = noise(9), x, y;
      for (x = 0; x < W; x++) surf[x] = Math.round(26 + (n1(x) - .5) * 12 + (n2(x) - .5) * 4);
      // flat spawn area
      var h0 = surf[SPAWN_X];
      for (x = SPAWN_X - 7; x <= SPAWN_X + 7; x++) surf[x] = h0;
      for (x = 0; x < W; x++) {
        var s = surf[x], beach = s >= SEA - 1;
        for (y = s; y < H; y++) {
          var id = y === s ? (beach ? T.SAND : T.GRASS) : y < s + 4 ? (beach && y < s + 3 ? T.SAND : T.DIRT) : T.STONE;
          if (y >= H - 1 || (y === H - 2 && gr() < .5) || (y === H - 3 && gr() < .2)) id = T.BEDROCK;
          world[y * W + x] = id;
          if (y > s) bg[y * W + x] = y < s + 4 ? T.DIRT : T.STONE;
        }
        for (y = SEA; y < s; y++) world[y * W + x] = T.WATER;
      }
      // caves (random worms)
      for (var w = 0; w < 16; w++) {
        var cx = 6 + gr() * (W - 12), cy = 34 + gr() * (H - 42), a = gr() * 6.28, len = 40 + gr() * 70;
        for (var st = 0; st < len; st++) {
          a += (gr() - .5) * .7; cx += Math.cos(a); cy += Math.sin(a) * .6;
          if (cy < 30) cy = 30;
          var rad = 1.1 + gr() * .9;
          for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
            var tx = Math.round(cx + dx), ty = Math.round(cy + dy);
            if (tx < 1 || tx >= W - 1 || ty >= H - 3 || ty <= surf[tx] + 4) continue;
            if (dx * dx + dy * dy <= rad * rad) world[ty * W + tx] = 0;
          }
        }
      }
      // ore veins
      function veins(id, count, size, minDepth) {
        for (var v = 0; v < count; v++) {
          var vx = (gr() * W) | 0, vy = Math.round(surf[vx] + minDepth + gr() * (H - 3 - surf[vx] - minDepth));
          for (var k = 0; k < size; k++) {
            if (world[vy * W + vx] === T.STONE) world[vy * W + vx] = id;
            vx += Math.round(gr() * 2 - 1); vy += Math.round(gr() * 2 - 1);
            if (vx < 0 || vx >= W || vy < 0 || vy >= H - 2) break;
          }
        }
      }
      veins(T.COAL, 110, 6, 3); veins(T.IRON, 60, 4, 9); veins(T.GOLD, 22, 3, 20); veins(T.DIAMOND, 18, 3, 28);
      // spawn house
      var hx = SPAWN_X - 4;
      for (x = hx; x <= hx + 8; x++) for (y = h0 - 5; y < h0; y++) { world[y * W + x] = 0; if (x > hx && x < hx + 8 && y > h0 - 5) bg[y * W + x] = T.PLANKS; }
      for (y = h0 - 5; y < h0; y++) { world[y * W + hx] = T.PLANKS; world[y * W + hx + 8] = T.PLANKS; }
      world[(h0 - 1) * W + hx] = 0; world[(h0 - 2) * W + hx] = 0;           // left door
      world[(h0 - 3) * W + hx + 8] = T.GLASS;                                  // window
      for (x = hx - 1; x <= hx + 9; x++) world[(h0 - 6) * W + x] = T.COBBLE;  // roof
      for (x = hx + 1; x <= hx + 7; x++) world[(h0 - 7) * W + x] = T.PLANKS;
      for (x = hx; x <= hx + 8; x++) world[(h0 - 5) * W + x] = T.PLANKS;
      world[(h0 - 3) * W + hx + 2] = T.TORCH; world[(h0 - 3) * W + hx + 6] = T.TORCH;
      world[(h0 - 1) * W + hx + 6] = T.CHEST; chests[(h0 - 1) * W + hx + 6] = 1;
      // trees, grass and flowers
      var lastTree = -9;
      for (x = 3; x < W - 3; x++) {
        var top = surf[x];
        if (world[top * W + x] !== T.GRASS || Math.abs(x - SPAWN_X) < 8) continue;
        if (x - lastTree > 4 && gr() < .16) {
          lastTree = x;
          var th = 4 + ((gr() * 3) | 0);
          for (var k2 = 1; k2 <= th; k2++) world[(top - k2) * W + x] = T.LOG;
          for (var ly = -2; ly <= 1; ly++) for (var lx = -2; lx <= 2; lx++) {
            if (Math.abs(lx) + Math.abs(ly) > 3 || (ly === 1 && Math.abs(lx) > 1)) continue;
            var yy = top - th + ly - 1 + 1, xx = x + lx;
            if (world[yy * W + xx] === 0) world[yy * W + xx] = T.LEAVES;
          }
          world[(top - th - 2) * W + x] = T.LEAVES;
        } else if (world[(top - 1) * W + x] === 0) {
          var roll = gr();
          if (roll < .14) world[(top - 1) * W + x] = T.TALLGRASS; else if (roll < .19) world[(top - 1) * W + x] = T.FLOWER;
        }
      }
      for (x = 0; x < W; x++) calcSky(x);
      for (var i2 = 0; i2 < world.length; i2++) if (world[i2] === T.TORCH) torches[i2] = 1;
    }

    /* ---------------- state ---------------- */
    var S; // game state (saved)
    var player = { x: 0, y: 0, w: .6, h: 1.8, vx: 0, vy: 0, dir: 1, ground: false, fallFrom: null, inv: 0, walk: 0, swing: 0 };
    var mobs = [], drops = [], parts = [], floats = [], tnts = [], pearls = [];
    var started = false, paused = false, dead = false, visible = true, panel = null;
    var keys = {}, aim = { x: 0, y: 0, tx: 0, ty: 0, on: false }, primary = false, secondary = false, useCd = 0;
    var mineT = null, attackCd = 0, eating = 0, shake = 0, flashA = 0, spawnT = 0, hungerT = 0, regenT = 0, groanT = 5, saveT = 0;
    var mode = 'mine', touch = false, event = null, lastBright = 1, sawNight = false;

    function freshState() {
      return {
        v: 1, seed: 'realm-' + Math.floor(Math.random() * 1e6), t: .08, day: 1, hp: 20, food: 20, xp: 0, lvl: 0,
        coins: 250, rank: 'MEMBER', kills: 0, mined: 0, adv: {}, daily: false, kit: false, home: null, looted: false,
        slots: (function () { var a = []; for (var i = 0; i < 36; i++) a.push(null); return a; })(), sel: 0
      };
    }
    function spawnPoint() { return { x: SPAWN_X + .2, y: surf[SPAWN_X] - player.h - .01 }; }

    /* ---------------- save / load ---------------- */
    function encode(u8) { var s = '', CHUNK = 4096; for (var i = 0; i < u8.length; i += CHUNK) s += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK)); return btoa(s); }
    function decode(str, u8) { var s = atob(str); for (var i = 0; i < s.length && i < u8.length; i++) u8[i] = s.charCodeAt(i); }
    function save() {
      if (!S) return;
      S.px = player.x; S.py = player.y;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ s: S, w: encode(world), b: encode(bg), surf: Array.from(surf) })); } catch (e) { /* storage off */ }
    }
    function load() {
      try {
        var raw = localStorage.getItem(SAVE_KEY); if (!raw) return false;
        var d = JSON.parse(raw); if (!d || !d.s || d.s.v !== 1) return false;
        S = d.s; decode(d.w, world); decode(d.b, bg);
        for (var x = 0; x < W; x++) { surf[x] = d.surf[x]; calcSky(x); }
        torches = {}; for (var i = 0; i < world.length; i++) if (world[i] === T.TORCH) torches[i] = 1;
        chests = {}; if (!S.looted) { for (i = 0; i < world.length; i++) if (world[i] === T.CHEST) chests[i] = 1; }
        player.x = S.px; player.y = S.py; player.fallFrom = player.y; player.landed = 0;
        return true;
      } catch (e) { return false; }
    }
    function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
    function newWorld() {
      S = freshState();
      generate(S.seed);
      var sp = spawnPoint(); player.x = sp.x; player.y = sp.y; player.vx = player.vy = 0; player.fallFrom = player.y; player.landed = 0;
      dead = false; ovDead.hidden = true;
      mobs = []; drops = []; tnts = []; pearls = []; event = null;
      addItem('wood_pick', 1); addItem('bread', 3); addItem('torch', 6);
    }

    /* ---------------- inventory ---------------- */
    function maxStack(id) { var it = IT[id] || {}; return it.tool ? 1 : it.max || 64; }
    function addItem(id, n) {
      if (id === 'coins') { setCoins(S.coins + n); return 0; }
      var m = maxStack(id), i, order = [];
      for (i = 0; i < 36; i++) order.push(i);
      order.forEach(function (k) { var s = S.slots[k]; if (n > 0 && s && s.id === id && s.n < m) { var put = Math.min(m - s.n, n); s.n += put; n -= put; } });
      order.forEach(function (k) { if (n > 0 && !S.slots[k]) { var put = Math.min(m, n); S.slots[k] = { id: id, n: put }; n -= put; } });
      if (id === 'log') adv('wood');
      if (id === 'cobble') adv('stone');
      if (id === 'diamond') adv('diamonds');
      renderHotbar(); if (panel === 'inv') renderInv();
      return n;
    }
    function count(id) { return S.slots.reduce(function (a, s) { return a + (s && s.id === id ? s.n : 0); }, 0); }
    function removeItem(id, n) {
      for (var i = 35; i >= 0 && n > 0; i--) {
        var s = S.slots[i]; if (!s || s.id !== id) continue;
        var take = Math.min(n, s.n); s.n -= take; n -= take; if (!s.n) S.slots[i] = null;
      }
      renderHotbar(); if (panel === 'inv') renderInv();
    }
    function held() { return S.slots[S.sel]; }
    function heldIt() { var h = held(); return h ? IT[h.id] || {} : {}; }
    function useHeld(n) { var h = held(); if (!h) return; h.n -= n || 1; if (h.n <= 0) S.slots[S.sel] = null; renderHotbar(); }

    /* ---------------- HUD ---------------- */
    var hudCache = {};
    function renderHotbar() {
      var html = '';
      for (var i = 0; i < 9; i++) {
        var s = S.slots[i];
        html += '<button type="button" class="mc-hs' + (i === S.sel ? ' on' : '') + '" data-i="' + i + '" aria-label="Slot ' + (i + 1) + (s ? ': ' + itemName(s.id) + ' x' + s.n : ' (empty)') + '"' + (s ? ' title="' + itemName(s.id) + '"' : '') + '>' +
          (s ? icon(s.id) + (s.n > 1 ? '<small>' + s.n + '</small>' : '') : '') + '</button>';
      }
      if (hudCache.hot !== html) { hotbarEl.innerHTML = html; hudCache.hot = html; }
      var it = heldIt();
      $('.mp-eat').classList.toggle('on', !!it.food);
    }
    function renderBars() {
      var food = Math.ceil(S.food), key = S.hp + '|' + food + '|' + S.xp + '|' + S.lvl;
      if (hudCache.bars === key) return;
      hudCache.bars = key;
      var h = '', f = '';
      for (var i = 0; i < 10; i++) {
        var hv = S.hp - i * 2; h += heartSVG(hv >= 2 ? 2 : hv === 1 ? 1 : 0);
        var fv = food - (9 - i) * 2; f += foodSVG(fv >= 2 ? 2 : fv === 1 ? 1 : 0);
      }
      heartsEl.innerHTML = h; foodEl.innerHTML = f;
      heartsEl.classList.toggle('low', S.hp <= 6);
      heartsEl.setAttribute('aria-label', 'Health ' + S.hp / 2 + ' of 10');
      foodEl.setAttribute('aria-label', 'Hunger ' + food / 2 + ' of 10');
      var need = 7 + S.lvl * 2;
      xpEl.firstChild.style.width = Math.min(100, S.xp / need * 100) + '%';
      xpEl.lastChild.textContent = S.lvl;
      xpEl.classList.toggle('zero', S.lvl === 0);
    }
    function renderBoard() {
      $('.mc-coins').textContent = S.coins.toLocaleString('en-US');
      $('.mc-rank').textContent = '[' + S.rank + ']';
      $('.mc-kills').textContent = S.kills;
      $('.mc-mined').textContent = S.mined.toLocaleString('en-US');
      $('.mc-adv').textContent = Object.keys(S.adv).length + '/' + Object.keys(ADV).length;
    }
    function setCoins(v) { S.coins = Math.max(0, v); renderBoard(); }

    function say(text) {
      var p = document.createElement('p');
      p.innerHTML = mc(text);
      chat.appendChild(p);
      while (chat.children.length > 9) chat.removeChild(chat.firstChild);
      setTimeout(function () { p.classList.add('old'); }, 10000);
    }
    function toast(title, desc, id) {
      var t = document.createElement('div');
      t.className = 'mc-toast';
      t.innerHTML = '<span class="mc-ti">' + icon(id) + '</span><span><b>' + XR.esc(title) + '</b><small>' + XR.esc(desc) + '</small></span>';
      toastsEl.appendChild(t);
      setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 3600);
    }
    function adv(id) {
      if (!S || S.adv[id]) return;
      S.adv[id] = 1;
      var a = ADV[id];
      toast('Advancement made!', a[0], a[2]);
      say('&e[RealmCore] &fYou earned &a+25 coins &ffor &6' + a[0]);
      setCoins(S.coins + 25);
      sfx('toast');
    }

    /* ---------------- sound (WebAudio, synthesized) ---------------- */
    var AC = null, muted = false;
    try { muted = localStorage.getItem('xr-mc-mute') === '1'; } catch (e) { /* ignore */ }
    function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } return AC; }
    function tone(type, f0, f1, dur, vol, delay) {
      var a = audio(); if (!a || muted) return;
      var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
      o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + .02);
    }
    var noiseBuf = null;
    function noise(dur, vol, freq, delay) {
      var a = audio(); if (!a || muted) return;
      if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      var t0 = a.currentTime + (delay || 0), s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq || 1200;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(a.destination); s.start(t0, Math.random() * .5); s.stop(t0 + dur + .02);
    }
    function sfx(n) {
      switch (n) {
        case 'dig': noise(.05, .08, 900); break;
        case 'break': noise(.14, .16, 1400); tone('square', 180, 90, .08, .03); break;
        case 'place': noise(.06, .12, 500); break;
        case 'pop': tone('sine', 700, 1300, .07, .08); break;
        case 'hurt': tone('square', 320, 110, .18, .07); break;
        case 'hit': noise(.06, .12, 2200); tone('square', 240, 160, .06, .04); break;
        case 'eat': noise(.07, .1, 1600); noise(.07, .1, 1600, .16); noise(.07, .1, 1600, .32); break;
        case 'boom': noise(1.1, .5, 380); tone('sine', 90, 30, .9, .3); break;
        case 'fuse': noise(.5, .06, 4000); break;
        case 'zombie': tone('sawtooth', 110, 70, .5, .045); tone('sawtooth', 96, 60, .5, .03, .08); break;
        case 'level': [523, 659, 784, 1046].forEach(function (f, i) { tone('triangle', f, f, .14, .07, i * .08); }); break;
        case 'toast': tone('triangle', 880, 880, .1, .06); tone('triangle', 1320, 1320, .16, .06, .1); break;
        case 'click': tone('square', 600, 600, .03, .03); break;
        case 'tick': tone('square', 1200, 1200, .02, .025); break;
        case 'pearl': tone('sine', 300, 1200, .3, .07); break;
        case 'win': [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone('square', f, f, .18, .05, i * .1); }); break;
      }
    }

    /* ---------------- physics ---------------- */
    function inWater(e) { return get(Math.floor(e.x + e.w / 2), Math.floor(e.y + e.h * .6)) === T.WATER; }
    function collides(e) {
      for (var y = Math.floor(e.y); y <= Math.floor(e.y + e.h - 1e-4); y++)
        for (var x = Math.floor(e.x); x <= Math.floor(e.x + e.w - 1e-4); x++) if (solidAt(x, y)) return true;
      return false;
    }
    function move(e, dt, flying) {
      var wet = inWater(e);
      if (!flying) {
        e.vy += (wet ? GRAV * .22 : GRAV) * dt;
        if (wet && e.vy > 2.4) e.vy = 2.4;
        if (e.vy > 24) e.vy = 24;
      }
      var steps = Math.ceil(Math.max(Math.abs(e.vx), Math.abs(e.vy)) * dt / .3) || 1, sdt = dt / steps;
      e.hitX = false; var wasGround = e.ground; e.ground = false;
      for (var i = 0; i < steps; i++) {
        e.x += e.vx * (wet ? .6 : 1) * sdt;
        if (collides(e)) {
          if (e.vx > 0) e.x = Math.floor(e.x + e.w) - e.w - 1e-3; else if (e.vx < 0) e.x = Math.floor(e.x) + 1 + 1e-3;
          e.hitX = true;
        }
        if (e.x < 0) { e.x = 0; e.hitX = true; } if (e.x > W - e.w) { e.x = W - e.w; e.hitX = true; }
        e.y += e.vy * sdt;
        if (collides(e)) {
          if (e.vy > 0) { e.y = Math.floor(e.y + e.h) - e.h - 1e-3; e.ground = true; } else if (e.vy < 0) e.y = Math.floor(e.y) + 1 + 1e-3;
          e.vy = 0;
        }
      }
      if (!e.ground && wasGround) e.fallFrom = e.y;
      if (e.ground && !wasGround && e.fallFrom != null) { e.landed = e.y - e.fallFrom; }
      if (e.fallFrom == null) e.fallFrom = e.y;
      if (e.ground || wet || flying) e.fallFrom = e.y;
      return wet;
    }
    function blockedAhead(e) {
      var fx = e.dir > 0 ? Math.floor(e.x + e.w + .05) : Math.floor(e.x - .05), fy = Math.floor(e.y + e.h - .05);
      return solidAt(fx, fy) && !solidAt(fx, fy - 1) && !solidAt(fx, fy - 2) && !solidAt(Math.floor(e.x + e.w / 2), Math.floor(e.y) - 1);
    }

    /* ---------------- player ---------------- */
    function brightness() {
      var sunH = Math.sin(S.t * Math.PI * 2);
      return XR.clamp(sunH * 2.4 + .55, 0, 1);
    }
    function hurt(dmg, from, why) {
      if (dead || player.inv > 0 || dmg <= 0) return;
      S.hp = Math.max(0, S.hp - dmg);
      player.inv = .55; flashA = .45; shake = Math.max(shake, .18);
      if (from != null) { player.vx = from * 7; player.vy = -5.5; }
      sfx('hurt');
      renderBars();
      if (S.hp <= 0) die(why || 'You were slain');
    }
    function die(why) {
      dead = true; primary = secondary = false; keys = {};
      $('.mc-dead-why').textContent = why + '. Score: ' + (S.kills * 10 + S.mined + S.coins).toLocaleString('en-US');
      ovDead.hidden = false;
      say('&c' + why + '. &7Respawn to keep playing.');
      if (event) endEvent(false);
    }
    function respawn() {
      var sp = S.home || spawnPoint();
      teleport(sp.x, sp.y);
      S.hp = 20; S.food = 20; dead = false; ovDead.hidden = true;
      mobs = mobs.filter(function (m) { return m.type === 'pig'; });
      renderBars(); focusGame();
    }
    function teleport(x, y) {
      player.x = x; player.y = y; player.vx = player.vy = 0;
      var g = 0; while (collides(player) && g++ < 60) player.y -= 1;
      player.fallFrom = player.y;
    }
    function eatDone(id) {
      var it = IT[id];
      S.food = Math.min(20, S.food + it.food);
      if (it.gold) { S.hp = Math.min(20, S.hp + 8); say('&6Golden Apple! &fRegeneration II applied.'); burst(player.x + .3, player.y + .6, ['#ffcc33', '#fff6b0'], 26, 5); }
      removeItem(id, 1);
      sfx('eat'); adv('eat'); renderBars();
      if (id === 'rotten_flesh' && Math.random() < .5) { S.food = Math.max(0, S.food - 3); say('&2You feel queasy... &7(rotten flesh)'); }
    }
    function tryEat() {
      var h = held(), it = heldIt();
      if (!it.food) {
        // eat the first food in the hotbar
        for (var i = 0; i < 9; i++) { var s = S.slots[i]; if (s && IT[s.id] && IT[s.id].food) { S.sel = i; renderHotbar(); h = s; it = IT[s.id]; break; } }
        if (!it.food) { say('&7You have no food in your hotbar. Try &e/kit &7or kill a pig.'); return; }
      }
      if (S.food >= 20 && !it.gold) { say('&7You are not hungry.'); return; }
      if (eating > 0) return;
      eating = .9; player.eatId = h.id;
    }

    /* ---------------- world actions ---------------- */
    function burst(x, y, colors, n, sp) {
      for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: (Math.random() - .5) * (sp || 6), vy: -Math.random() * (sp || 6), l: .5 + Math.random() * .6, c: colors[i % colors.length], g: 1, s: 1 + (Math.random() < .4) });
    }
    function floatText(x, y, text, color) { floats.push({ x: x, y: y, t: text, c: color || '#ffd84a', l: 1.3 }); }
    function dropItem(id, n, x, y) { drops.push({ id: id, n: n, x: x, y: y, w: .35, h: .35, vx: (Math.random() - .5) * 3, vy: -4, age: 0, ground: false }); }
    function breakBlock(tx, ty, byPlayer) {
      var id = get(tx, ty), b = BL[id];
      if (!b || id === T.AIR || id === T.WATER || id === T.BEDROCK) return;
      var k = ty * W + tx;
      if (id === T.CHEST && chests[k]) lootChest(k);
      set(tx, ty, T.AIR);
      // tall plants above fall
      var above = get(tx, ty - 1);
      if (above === T.TALLGRASS || above === T.FLOWER || above === T.TORCH) set(tx, ty - 1, T.AIR);
      burst(tx + .5, ty + .5, b.c || ['#888'], 10, 4);
      if (!byPlayer) return;
      sfx('break'); S.mined++; renderBoard();
      var tier = heldIt().tool === 'pick' ? heldIt().tier : 0;
      if (b.pick && tier < b.tier) { if (b.tier > 1) say('&cYou need a better pickaxe to mine ' + b.n + '.'); else say('&7Stone needs a pickaxe. Craft one with &eE&7.'); return; }
      var drop = b.drop;
      if (id === T.LEAVES) { drop = Math.random() < .09 ? 'apple' : Math.random() < .12 ? 'stick' : null; }
      if (id === T.CHEST) { dropItem('planks', 4, tx + .3, ty + .2); return; }
      if (drop) dropItem(drop, 1, tx + .3, ty + .2);
      if (b.xp) giveXp(b.xp);
      if (b.coins) { setCoins(S.coins + b.coins); floatText(tx + .5, ty, '+' + b.coins, '#ffd84a'); if (b.coins >= 20) say('&e[RealmCore] &fOre reward: &a+' + b.coins + ' coins &ffor ' + b.n); }
    }
    function giveXp(n) {
      S.xp += n;
      var need = 7 + S.lvl * 2;
      while (S.xp >= need) { S.xp -= need; S.lvl++; need = 7 + S.lvl * 2; sfx('level'); say('&aLevel up! &fYou are now level &a' + S.lvl); }
      renderBars();
    }
    function lootChest(k) {
      if (!chests[k]) return;
      delete chests[k]; S.looted = true;
      [['bread', 4], ['apple', 3], ['wood_sword', 1], ['torch', 8], ['coal', 4], ['key', 1]].forEach(function (p) { addItem(p[0], p[1]); });
      say('&6[RealmCore] &fStarter chest looted: &ebread, apples, a sword, torches, coal &fand a &dLegend Crate Key&f!');
      sfx('pop');
    }
    function placeBlock(tx, ty, id) {
      var cur = get(tx, ty);
      if (cur !== T.AIR && cur !== T.WATER && cur !== T.TALLGRASS && cur !== T.FLOWER) return false;
      if (tx < 0 || tx >= W || ty < 1 || ty >= H - 1) return false;
      var near = solidAt(tx - 1, ty) || solidAt(tx + 1, ty) || solidAt(tx, ty - 1) || solidAt(tx, ty + 1) || get(tx, ty) === T.WATER;
      if (!near && id !== T.TORCH) return false;
      if (id === T.TORCH && !solidAt(tx, ty + 1) && !solidAt(tx - 1, ty) && !solidAt(tx + 1, ty) && !bg[ty * W + tx]) return false;
      var box = { x: tx, y: ty, w: 1, h: 1 };
      function overlap(e) { return e.x < box.x + 1 && e.x + e.w > box.x && e.y < box.y + 1 && e.y + e.h > box.y; }
      if (BL[id].s && (overlap(player) || mobs.some(overlap))) return false;
      set(tx, ty, id);
      sfx('place');
      if (id === T.TORCH) adv('light');
      return true;
    }
    function explode(cx, cy, rad, byTnt) {
      sfx('boom'); shake = .6; flashA = Math.max(flashA, .35);
      for (var y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++) for (var x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
        var d = Math.hypot(x + .5 - cx, y + .5 - cy);
        if (d > rad * (.75 + Math.random() * .35)) continue;
        var id = get(x, y);
        if (id === T.BEDROCK || id === T.WATER || id === T.AIR) continue;
        if (id === T.TNT) { set(x, y, T.AIR); tnts.push({ x: x, y: y, fuse: .4 + Math.random() * .6 }); continue; }
        var b = BL[id];
        set(x, y, T.AIR);
        if (Math.random() < .22 && b.drop && id !== T.LEAVES && id !== T.CHEST) dropItem(b.drop, 1, x + .3, y + .3);
      }
      for (var i = 0; i < 70; i++) parts.push({ x: cx, y: cy, vx: (Math.random() - .5) * 18, vy: (Math.random() - .5) * 18, l: .4 + Math.random() * .8, c: ['#fff6b0', '#ffb04a', '#6a6a6a', '#3a3a3a'][i % 4], g: .3, s: 2 });
      var pd = Math.hypot(player.x + .3 - cx, player.y + .9 - cy);
      if (pd < rad * 2.1) hurt(Math.round(15 * (1 - pd / (rad * 2.1))) + 1, player.x + .3 > cx ? 1 : -1, 'You were blown up');
      mobs.forEach(function (m) {
        var md = Math.hypot(m.x + m.w / 2 - cx, m.y + m.h / 2 - cy);
        if (md < rad * 2) damageMob(m, Math.round(20 * (1 - md / (rad * 2))) + 2, m.x > cx ? 1 : -1, byTnt);
      });
      if (byTnt) adv('boom');
    }

    /* ---------------- mobs ---------------- */
    var MOB = {
      zombie: { w: .6, h: 1.8, hp: 20, speed: 2.1, hostile: 1 },
      creeper: { w: .6, h: 1.65, hp: 20, speed: 2.3, hostile: 1 },
      pig: { w: .9, h: .9, hp: 10, speed: 1.3 }
    };
    function spawnMob(type, x, y) {
      var d = MOB[type];
      var m = { type: type, x: x, y: y != null ? y : surf[Math.floor(x)] - d.h - 1, w: d.w, h: d.h, vx: 0, vy: 0, hp: d.hp, max: d.hp, dir: 1, ground: false, hurtT: 0, cd: 0, fuse: 0, wander: 0, walk: 0, burn: 0, fallFrom: null };
      // lift onto the surface if spawned inside blocks
      var guard = 0; while (collides(m) && guard++ < 40) m.y -= 1;
      mobs.push(m);
      return m;
    }
    function surfaceY(x) { var y = 0; while (y < H && !solidAt(x, y) && get(x, y) !== T.WATER) y++; return y; }
    function spawnNear(type, minD, maxD) {
      for (var tries = 0; tries < 8; tries++) {
        var side = Math.random() < .5 ? -1 : 1, x = Math.floor(player.x + side * (minD + Math.random() * (maxD - minD)));
        if (x < 2 || x > W - 3) continue;
        var y = surfaceY(x);
        if (get(x, y) === T.WATER || y >= H - 2) continue;
        if (type === 'pig' && get(x, y) !== T.GRASS) continue;
        return spawnMob(type, x + .2, y - MOB[type].h - .01);
      }
      return null;
    }
    function damageMob(m, dmg, dir, byTnt) {
      if (m.dead) return;
      m.hp -= dmg; m.hurtT = .35; m.vx = dir * 7; m.vy = -5;
      if (m.type === 'pig') m.flee = 3;
      sfx('hit');
      burst(m.x + m.w / 2, m.y + m.h / 2, ['#b0202a', '#7a1018'], 6, 3);
      if (m.hp <= 0) killMob(m, byTnt);
    }
    function killMob(m, byTnt) {
      m.dead = true;
      burst(m.x + m.w / 2, m.y + m.h / 2, ['#dcdcdc', '#9a9a9a', '#ffffff'], 22, 5);
      var cx = m.x + m.w / 2, cy = m.y + .2;
      if (m.type === 'zombie') { if (Math.random() < .75) dropItem('rotten_flesh', 1, cx, cy); if (Math.random() < .08) dropItem('iron_ingot', 1, cx, cy); reward(15, cx, cy); }
      if (m.type === 'creeper') { if (!m.boomed) dropItem('gunpowder', 1 + (Math.random() < .5), cx, cy); reward(25, cx, cy); }
      if (m.type === 'pig') { dropItem('porkchop', 1 + (Math.random() < .5), cx, cy); giveXp(1); }
      if (MOB[m.type].hostile && !m.boomed) {
        S.kills++; renderBoard(); adv('hunter'); giveXp(5);
        if (event) { event.left--; renderBoss(); if (event.left <= 0) endEvent(true); }
        if (S.kills % 10 === 0) say('&6[RealmCore] &f' + S.kills + ' kill streak! &a+100 coins'), setCoins(S.coins + 100);
      }
      void byTnt;
    }
    function reward(c, x, y) { setCoins(S.coins + c); floatText(x, y, '+' + c, '#ffd84a'); }

    function updateMobs(dt, b) {
      var pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
      mobs.forEach(function (m) {
        var d = MOB[m.type], dx = pcx - (m.x + m.w / 2), adx = Math.abs(dx);
        m.hurtT = Math.max(0, m.hurtT - dt); m.cd = Math.max(0, m.cd - dt);
        var want = 0;
        if (d.hostile && !dead && adx < 22 && Math.abs(pcy - (m.y + m.h / 2)) < 10) {
          m.dir = dx > 0 ? 1 : -1;
          if (m.type === 'creeper' && adx < 1.8 && Math.abs(pcy - (m.y + m.h / 2)) < 2) {
            if (m.fuse === 0) sfx('fuse');
            m.fuse += dt; want = 0;
            if (m.fuse >= 1.5) { m.boomed = true; m.dead = true; explode(m.x + m.w / 2, m.y + m.h / 2, 3, false); return; }
          } else {
            if (m.type === 'creeper' && m.fuse > 0) m.fuse = Math.max(0, m.fuse - dt * 2);
            want = m.dir * d.speed;
          }
          if (m.type === 'zombie' && adx < .85 && Math.abs(pcy - (m.y + m.h / 2)) < 1.4 && m.cd === 0) { m.cd = 1; hurt(3, m.dir, 'You were slain by a Zombie'); }
        } else {
          m.wander -= dt;
          if (m.wander <= 0) { m.wander = 1.5 + Math.random() * 3; m.wdir = [-1, 0, 0, 1][(Math.random() * 4) | 0]; }
          if (m.flee > 0) { m.flee -= dt; m.wdir = dx > 0 ? -1 : 1; }
          if (m.wdir) m.dir = m.wdir;
          want = (m.wdir || 0) * d.speed * (m.flee > 0 ? 2.4 : .6);
        }
        if (m.hurtT <= 0) m.vx += (want - m.vx) * Math.min(1, dt * 10);
        var wet = move(m, dt, false);
        if ((m.hitX || blockedAhead(m)) && want !== 0 && (m.ground || wet)) m.vy = wet ? -4 : -8.8;
        if (wet && m.vy > 0) m.vy -= GRAV * .3 * dt;
        if (m.landed > 4) { damageMob(m, Math.floor(m.landed - 3), 0); } m.landed = 0;
        m.walk += Math.abs(m.vx) * dt * 3;
        // burn in daylight
        var col = Math.floor(m.x + m.w / 2);
        if (m.type === 'zombie' && b > .72 && m.y + m.h <= skyTop[col] + .1) {
          m.burn += dt; if (Math.random() < dt * 20) parts.push({ x: m.x + Math.random() * m.w, y: m.y + Math.random() * m.h, vx: 0, vy: -1.5, l: .4, c: Math.random() < .5 ? '#ffb04a' : '#ff5a1f', g: -.2, s: 1 });
          if (m.burn > 1) { m.burn = 0; damageMob(m, 2, 0); }
        }
        if (m.type === 'zombie' && adx < 12) { m.groan = (m.groan || Math.random() * 8) - dt; if (m.groan <= 0) { m.groan = 6 + Math.random() * 8; sfx('zombie'); } }
        if (adx > 48 || m.y > H + 4) m.dead = true;
      });
      mobs = mobs.filter(function (m) { return !m.dead; });
    }

    /* ---------------- events ---------------- */
    function renderBoss() {
      if (!event) { bossEl.hidden = true; return; }
      bossEl.hidden = false;
      XR.$('span', bossEl).textContent = 'Blood Moon · defeat ' + event.left + ' more zombie' + (event.left === 1 ? '' : 's');
      XR.$('i', bossEl).style.width = (event.left / event.total * 100) + '%';
    }
    function startEvent() {
      if (event) { say('&cThe Blood Moon is already rising!'); return; }
      event = { total: 8, left: 8 };
      S.t = .56;
      say('&4&l[EVENT] &cThe Blood Moon rises! &fDefeat &c8 zombies &ffor &6500 coins &fand a crate key.');
      for (var i = 0; i < 3; i++) spawnNear('zombie', 8, 16);
      renderBoss(); sfx('zombie');
    }
    function endEvent(won) {
      if (!event) return;
      event = null; renderBoss();
      if (won) {
        say('&6&l[EVENT] &aBlood Moon defeated! &f+500 coins and a &dLegend Crate Key');
        setCoins(S.coins + 500); addItem('key', 1); adv('moon'); fireworks(); sfx('win');
      } else say('&7[EVENT] The Blood Moon has set.');
    }
    function fireworks() {
      for (var f = 0; f < 5; f++) (function (f) {
        setTimeout(function () {
          var fx = player.x + (Math.random() - .5) * 14, fy = player.y - 5 - Math.random() * 4, cols = [['#e0442e', '#ffd84a'], ['#6fb3a8', '#ffffff'], ['#9483c2', '#df7f73']][f % 3];
          for (var i = 0; i < 40; i++) { var a = i / 40 * 6.28; parts.push({ x: fx, y: fy, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, l: .9 + Math.random() * .4, c: cols[i % 2], g: .15, s: 1 }); }
          tone('sine', 200, 60, .3, .06);
        }, f * 260);
      })(f);
    }

    /* ---------------- GUIs ---------------- */
    var swapFrom = null;
    function openPanel(p) {
      closePanel(true);
      panel = p;
      var el = p === 'inv' ? guiInv : p === 'shop' ? guiShop : guiCrate;
      el.hidden = false;
      primary = secondary = false; keys = {};
      if (p === 'inv') renderInv();
      if (p === 'shop') renderShop();
      var f = XR.$('button:not([disabled])', el); if (f) f.focus({ preventScroll: true });
    }
    function closePanel(silent) {
      if (!panel) return;
      if (panel === 'crate' && crateSpinning) return;
      [guiInv, guiShop, guiCrate].forEach(function (g) { g.hidden = true; });
      panel = null; swapFrom = null;
      if (!silent) focusGame();
    }
    function slotHTML(i, s, extra) {
      return '<button type="button" class="mc-slot' + (extra || '') + '" data-slot="' + i + '"' + (s ? ' title="' + itemName(s.id) + '" aria-label="' + itemName(s.id) + ' x' + s.n + '"' : ' aria-label="Empty slot"') + '>' + (s ? icon(s.id) + (s.n > 1 ? '<small>' + s.n + '</small>' : '') : '') + '</button>';
    }
    function renderInv() {
      var bag = '', hot = '';
      for (var i = 9; i < 36; i++) bag += slotHTML(i, S.slots[i], swapFrom === i ? ' pick' : '');
      for (i = 0; i < 9; i++) hot += slotHTML(i, S.slots[i], (swapFrom === i ? ' pick' : '') + (i === S.sel ? ' sel' : ''));
      XR.$('.mc-bag', guiInv).innerHTML = bag;
      XR.$('.mc-bag-hot', guiInv).innerHTML = hot;
      XR.$('.mc-recipes', guiInv).innerHTML = RECIPES.map(function (rc, k) {
        var ok = Object.keys(rc.need).every(function (id) { return count(id) >= rc.need[id]; });
        return '<div class="mc-rc' + (ok ? ' ok' : '') + '"><span class="mc-rc-out">' + icon(rc.out) + (rc.n ? '<small>' + rc.n + '</small>' : '') + '</span>' +
          '<span class="mc-rc-txt"><b>' + itemName(rc.out) + '</b><span>' + Object.keys(rc.need).map(function (id) {
            return '<i class="' + (count(id) >= rc.need[id] ? '' : 'miss') + '">' + icon(id) + rc.need[id] + '</i>';
          }).join('') + '</span></span>' +
          '<button type="button" class="mc-btn sm" data-craft="' + k + '"' + (ok ? '' : ' disabled') + '>' + (rc.smelt ? 'Smelt' : 'Craft') + '</button></div>';
      }).join('');
    }
    function craft(k) {
      var rc = RECIPES[k];
      if (!Object.keys(rc.need).every(function (id) { return count(id) >= rc.need[id]; })) return;
      Object.keys(rc.need).forEach(function (id) { removeItem(id, rc.need[id]); });
      addItem(rc.out, rc.n || 1);
      sfx('pop');
      if (rc.out === 'stone_pick' || rc.out === 'iron_pick' || rc.out === 'diamond_pick') adv('upgrade');
      if (rc.out === 'iron_ingot') adv('iron');
      renderInv();
    }
    guiInv.addEventListener('click', function (e) {
      var c = e.target.closest('[data-craft]'); if (c) { craft(+c.getAttribute('data-craft')); return; }
      var sl = e.target.closest('[data-slot]');
      if (sl) {
        var i = +sl.getAttribute('data-slot');
        if (swapFrom == null) { if (S.slots[i]) swapFrom = i; else if (i < 9) S.sel = i; }
        else { var tmp = S.slots[i]; S.slots[i] = S.slots[swapFrom]; S.slots[swapFrom] = tmp; swapFrom = null; sfx('click'); }
        renderInv(); renderHotbar();
      }
      if (e.target.closest('.mc-reset')) {
        if (e.target.closest('.mc-reset').getAttribute('data-sure')) { closePanel(true); newWorld(); refreshAll(); say('&aA brand new world was generated. Seed: &f' + S.seed); focusGame(); }
        else { e.target.closest('.mc-reset').setAttribute('data-sure', '1'); e.target.closest('.mc-reset').textContent = 'Tap again to confirm'; }
      }
    });
    function renderShop() {
      var html = '';
      SHOP.forEach(function (it) {
        var name = it.label || itemName(it.id) + (it.n ? ' x' + it.n : '');
        var ic = it.id === 'rank' ? sprSVG('coin', { Y: '#55ff55', y: '#1f8a1f' }, 'mc-svgi') : icon(it.id);
        html += '<button type="button" class="mc-slot" data-buy="' + it.id + '" title="' + name + ' — ' + it.price + ' coins" aria-label="' + name + ', ' + it.price + ' coins">' + ic + (it.n ? '<small>' + it.n + '</small>' : '') + '<em>' + it.price + '</em></button>';
      });
      XR.$('.mc-shop-slots', guiShop).innerHTML = html;
    }
    guiShop.addEventListener('click', function (e) {
      var b = e.target.closest('[data-buy]'); if (!b) return;
      var it = SHOP.find(function (s) { return s.id === b.getAttribute('data-buy'); });
      if (S.coins < it.price) { say('&cNot enough coins! &7You need &e' + (it.price - S.coins) + ' &7more.'); sfx('hurt'); return; }
      if (it.id === 'rank') { if (S.rank === 'VIP') { say('&7You are already &a[VIP]'); return; } setCoins(S.coins - it.price); rankUp(); return; }
      setCoins(S.coins - it.price); addItem(it.id, it.n || 1); sfx('pop');
      say('&aPurchased &f' + itemName(it.id) + (it.n ? ' x' + it.n : '') + ' &afor &e' + it.price + ' coins');
    });
    function rankUp() {
      S.rank = 'VIP'; renderBoard();
      say('&a&lRANK UP! &fYou are now &a[VIP]&f. Unlocked: &e/fly&f, &e/heal&f, &e/feed');
      fireworks(); sfx('win'); adv('vip');
    }

    var crateSpinning = false;
    function openCrate() {
      if (count('key') < 1) { say('&cYou need a &dLegend Crate Key&c. Buy one in &e/shop &cor win the &4Blood Moon&c.'); return; }
      removeItem('key', 1);
      openPanel('crate');
      var total = CRATE.reduce(function (a, c) { return a + c.w; }, 0), pick = function () { var x = Math.random() * total; for (var i = 0; i < CRATE.length; i++) { x -= CRATE[i].w; if (x <= 0) return CRATE[i]; } return CRATE[0]; };
      var strip = [], win = pick();
      for (var i = 0; i < 44; i++) strip.push(i === 38 ? win : pick());
      var track = XR.$('.mc-reel-track', guiCrate);
      track.innerHTML = strip.map(function (c) { return '<span class="mc-slot">' + icon(c.id) + '<small>' + (c.id === 'coins' ? c.n : c.n > 1 ? c.n : '') + '</small></span>'; }).join('');
      track.style.transition = 'none'; track.style.transform = 'translateX(0)';
      var btn = XR.$('.mc-close', guiCrate); btn.disabled = true;
      XR.$('.mc-crate-state', guiCrate).textContent = 'Spinning...';
      crateSpinning = true;
      requestAnimationFrame(function () {
        var slotW = track.firstChild.getBoundingClientRect().width + 4, reelW = track.parentElement.clientWidth;
        var target = 38 * slotW - reelW / 2 + slotW / 2 + (Math.random() - .5) * slotW * .6;
        track.style.transition = 'transform 4.2s cubic-bezier(.1,.75,.18,1)';
        track.style.transform = 'translateX(' + (-target) + 'px)';
        var ticks = 0, iv = setInterval(function () { sfx('tick'); if (++ticks > 26) clearInterval(iv); }, 120);
        setTimeout(function () {
          crateSpinning = false; btn.disabled = false; btn.focus({ preventScroll: true });
          track.children[38].classList.add('win');
          XR.$('.mc-crate-state', guiCrate).textContent = 'You won ' + (win.id === 'coins' ? win.n + ' coins' : itemName(win.id) + (win.n > 1 ? ' x' + win.n : ''));
          addItem(win.id, win.n); sfx('win');
          say('&d[Crates] &fYou opened a Legend Crate and won &e' + (win.id === 'coins' ? win.n + ' coins' : itemName(win.id) + (win.n > 1 ? ' x' + win.n : '')) + '&f!');
        }, 4400);
      });
    }
    guiCrate.addEventListener('click', function (e) { if (e.target.closest('.mc-close')) closePanel(); });
    guiShop.addEventListener('click', function (e) { if (e.target.closest('.mc-close')) closePanel(); });
    guiInv.addEventListener('click', function (e) { if (e.target.closest('.mc-close')) closePanel(); });
    [guiInv, guiShop, guiCrate].forEach(function (g) { g.addEventListener('click', function (e) { if (e.target === g) closePanel(); }); });

    /* ---------------- chat + commands ---------------- */
    function openChat(prefill) {
      if (!started || dead) return;
      form.hidden = false; chat.classList.add('show'); input.value = prefill || ''; primary = secondary = false; keys = {};
      input.focus({ preventScroll: true });
    }
    function closeChat() { form.hidden = true; chat.classList.remove('show'); input.blur(); focusGame(); }
    var CMDS = {
      help: function (a) {
        if (a === '2') {
          say('&6--- &eRealmCore Help (2/2) &6---');
          say('&e/summon zombie|creeper|pig &8| &e/event bloodmoon');
          say('&e/sethome &8| &e/home &8| &e/spawn &8| &e/stats &8| &e/seed');
          say('&e/heal &8| &e/feed &7(VIP) &8| &e/plugins &8| &e/newworld');
          return;
        }
        say('&6--- &eRealmCore Help (1/2) &6--- &7/help 2 for more');
        say('&e/kit &7starter kit &8| &e/shop &8| &e/crate &8| &e/daily');
        say('&e/balance &8| &e/rankup &8| &e/fly');
        say('&e/time day|night &8| &e/weather clear|rain');
      },
      shop: function () { say('&7Opening &6Realm Shop&7...'); openPanel('shop'); },
      crate: function () { openCrate(); },
      balance: function () { say('&6Balance: &e' + S.coins.toLocaleString('en-US') + ' coins'); },
      bal: function () { CMDS.balance(); },
      daily: function () {
        if (S.daily) { say('&cAlready claimed! &7Come back in &e23h 59m'); return; }
        S.daily = true; setCoins(S.coins + 250); burst(player.x + .3, player.y, ['#ffcc33', '#fff6b0', '#ff8800'], 30, 6); sfx('win');
        say('&a+250 coins &7— daily reward claimed! Streak: &e6 days');
      },
      kit: function () {
        if (S.kit) { say('&cYou already claimed the starter kit. &7Cooldown: &e24h'); return; }
        S.kit = true;
        [['stone_pick', 1], ['stone_sword', 1], ['bread', 8], ['torch', 16], ['planks', 16]].forEach(function (p) { addItem(p[0], p[1]); });
        say('&a[Kits] &fStarter kit received: &estone tools, bread, torches &fand &eplanks');
        sfx('pop');
      },
      time: function (a) {
        if (a === 'night') { S.t = .56; say('&7Set the time to &913000 &7(night). &cWatch out for zombies...'); }
        else if (a === 'day') { S.t = .05; say('&7Set the time to &e1000 &7(day)'); if (event) endEvent(false); }
        else say('&cUsage: /time <day|night>');
      },
      weather: function (a) {
        if (a === 'rain') { S.rain = true; say('&7Changing to &9rainy &7weather'); }
        else if (a === 'clear') { S.rain = false; say('&7Changing to &eclear &7weather'); }
        else say('&cUsage: /weather <clear|rain>');
      },
      fly: function () { S.fly = !S.fly; player.vy = 0; $('.mp-down').hidden = !S.fly; say(S.fly ? '&aFlight enabled. &7Jump to rise, S / down to sink.' : '&cFlight disabled.'); },
      rankup: function () {
        if (S.rank === 'VIP') { say('&7You are already &a[VIP]&7. Next rank &d[LEGEND] &7costs &e5,000'); return; }
        if (S.coins < 1000) { say('&cYou need &e1,000 coins &cto rank up. &7You have &e' + S.coins); return; }
        setCoins(S.coins - 1000); rankUp();
      },
      spawn: function () { var sp = spawnPoint(); teleport(sp.x, sp.y); say('&aTeleported to spawn.'); sfx('pearl'); },
      sethome: function () { S.home = { x: player.x, y: player.y }; say('&aHome set! &7Use &e/home &7to return.'); },
      home: function () { if (!S.home) { say('&cNo home set. Use &e/sethome'); return; } teleport(S.home.x, S.home.y); say('&aWelcome home.'); sfx('pearl'); },
      heal: function () { if (S.rank !== 'VIP') { say('&c/heal is a &a[VIP] &cperk. &7Try &e/rankup'); return; } S.hp = 20; renderBars(); say('&aYou have been healed.'); },
      feed: function () { if (S.rank !== 'VIP') { say('&c/feed is a &a[VIP] &cperk. &7Try &e/rankup'); return; } S.food = 20; renderBars(); say('&aYour hunger has been satisfied.'); },
      summon: function (a) {
        if (!MOB[a]) { say('&cUsage: /summon <zombie|creeper|pig>'); return; }
        var mx = XR.clamp(player.x + player.dir * 3, 1, W - 2); spawnMob(a, mx, surfaceY(Math.floor(mx)) - MOB[a].h - .01); say('&7Summoned a &e' + a + '&7.');
      },
      event: function (a) { if (a === 'bloodmoon') startEvent(); else say('&cUsage: /event bloodmoon'); },
      stats: function () { say('&6Stats: &fKills &e' + S.kills + ' &8| &fBlocks mined &e' + S.mined + ' &8| &fLevel &a' + S.lvl + ' &8| &fDay &e' + S.day); },
      seed: function () { say('&7World seed: &f' + S.seed); },
      plugins: function () { say('&fPlugins (6): &aRealmCore&f, &aVault&f, &aLuckPerms&f, &aPlaceholderAPI&f, &aWorldGuard&f, &aCrates'); },
      newworld: function () { newWorld(); refreshAll(); say('&aA brand new world was generated. Seed: &f' + S.seed); },
      gamemode: function () { say('&cYou don\'t have permission to do that.'); },
      gm: function () { CMDS.gamemode(); },
      give: function () { say('&cYou don\'t have permission to do that. &7Try &e/kit &7or &e/shop'); }
    };
    function run(text) {
      text = text.trim();
      if (!text) return;
      if (text.charAt(0) === '/') {
        var p = text.slice(1).toLowerCase().split(/\s+/), fn = CMDS[p[0]];
        if (fn) fn(p[1]); else say('&cUnknown command. Type "/help" for help.');
      } else {
        say((S.rank === 'VIP' ? '&a[VIP] ' : '&7') + 'You&f: ' + text.replace(/&/g, ''));
        if (Math.random() < .6) setTimeout(function () {
          var r2 = ['gg', 'welcome to the server!', 'try /kit then go mining', 'blood moon tonight? /event bloodmoon', 'diamonds are below y 55', 'the crate gave me a diamond pick lol'];
          say('&b[MVP] Kaito&f: ' + r2[(Math.random() * r2.length) | 0]);
        }, 900);
      }
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; closeChat(); run(v); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); closeChat(); } e.stopPropagation(); });
    XR.$$('.mc-cmds button', stage).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!started) startGame();
        run(b.getAttribute('data-cmd'));
        focusGame();
      });
    });

    /* ---------------- input ---------------- */
    function focusGame() { if (started) screen.focus({ preventScroll: true }); }
    function active() { return started && !paused && !dead && !panel && form.hidden; }
    var KEYMAP = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'jump', ArrowUp: 'jump', Space: 'jump', KeyS: 'down', ArrowDown: 'down' };
    window.addEventListener('keydown', function (e) {
      if (!started || paused || dead) return;
      var tag = (e.target && e.target.tagName) || '', ae = document.activeElement;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (ae && ae !== document.body && !stage.contains(ae)) return;
      if (panel) {
        if (e.key === 'Escape' || (e.code === 'KeyE' && panel === 'inv')) { e.preventDefault(); closePanel(); }
        return;
      }
      if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); return; }
      if (/^Digit[1-9]$/.test(e.code)) { S.sel = +e.code.slice(5) - 1; renderHotbar(); e.preventDefault(); return; }
      if (e.code === 'KeyE') { e.preventDefault(); openPanel('inv'); return; }
      if (e.code === 'KeyF') { e.preventDefault(); tryEat(); return; }
      if (e.code === 'KeyT' || e.code === 'Enter') { e.preventDefault(); openChat(''); return; }
      if (e.code === 'Slash') { e.preventDefault(); openChat('/'); return; }
      if (e.code === 'Escape') { e.preventDefault(); pause(); }
    });
    window.addEventListener('keyup', function (e) { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
    window.addEventListener('blur', function () { keys = {}; primary = secondary = false; });

    function setAim(e) {
      var rc = canvas.getBoundingClientRect();
      var lx = (e.clientX - rc.left) / rc.width * CW, ly = (e.clientY - rc.top) / rc.height * CH;
      aim.x = cam.x + lx / B; aim.y = cam.y + ly / B; aim.tx = Math.floor(aim.x); aim.ty = Math.floor(aim.y); aim.on = true;
    }
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('pointerdown', function (e) {
      if (!started || paused || dead || panel) return;
      if (!form.hidden) closeChat();
      touch = e.pointerType !== 'mouse';
      wrap.classList.toggle('is-touch', touch);
      setAim(e);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (e.pointerType === 'mouse') { if (e.button === 2) { secondary = true; useCd = 0; } else if (e.button === 0) primary = true; }
      else if (mode === 'build') { secondary = true; useCd = 0; } else primary = true;
      focusGame();
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) { if (started) setAim(e); });
    function release() { primary = secondary = false; mineT = null; }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('pointerleave', function () { if (!touch) aim.on = false; });
    canvas.addEventListener('wheel', function (e) {
      if (!active()) return;
      e.preventDefault();
      S.sel = (S.sel + (e.deltaY > 0 ? 1 : 8)) % 9; renderHotbar();
    }, { passive: false });
    hotbarEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return;
      S.sel = +b.getAttribute('data-i'); renderHotbar(); focusGame();
    });

    // touch pad
    XR.$$('[data-hold]', wrap).forEach(function (b) {
      var k = b.getAttribute('data-hold');
      function on(e) { e.preventDefault(); if (!started) return; keys[k] = true; b.classList.add('on'); touch = true; wrap.classList.add('is-touch'); }
      function off() { keys[k] = false; b.classList.remove('on'); }
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    var modeBtn = $('.mp-mode');
    function renderMode() {
      modeBtn.innerHTML = (mode === 'mine' ? sprSVG('pick', { H: '#4fe3e0' }, 'mp-spr') + '<span>Mine</span>' : '<img class="mp-spr" src="' + (ICON.grassblk || (ICON.grassblk = (function () { var c = mk(32), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(1, .5, -1, .5, 16, 0); g.drawImage(TOPTEX[T.GRASS], 0, 0); g.setTransform(1, .5, 0, 1, 0, 8); g.drawImage(TEX[T.GRASS], 0, 0); g.setTransform(1, -.5, 0, 1, 16, 16); g.drawImage(TEX[T.GRASS], 0, 0); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, 16, 16); return c.toDataURL(); })())) + '" alt=""><span>Build</span>');
      modeBtn.classList.toggle('build', mode === 'build');
    }
    modeBtn.addEventListener('click', function () { mode = mode === 'mine' ? 'build' : 'mine'; renderMode(); sfx('click'); });
    $('.mp-eat').addEventListener('click', function () { if (active()) tryEat(); });
    $('.mp-bag').addEventListener('click', function () { if (!started) return; if (panel === 'inv') closePanel(); else openPanel('inv'); });
    $('.mp-chat').addEventListener('click', function () { if (started) openChat('/'); });

    // top buttons
    var soundBtn = $('.mc-sound');
    function renderSound() { soundBtn.innerHTML = I(muted ? 'volume' : 'volume'); soundBtn.classList.toggle('off', muted); soundBtn.setAttribute('aria-pressed', muted ? 'true' : 'false'); soundBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound'); }
    soundBtn.addEventListener('click', function () { muted = !muted; try { localStorage.setItem('xr-mc-mute', muted ? '1' : '0'); } catch (e) { /* ignore */ } renderSound(); if (!muted) sfx('click'); focusGame(); });
    $('.mc-full').addEventListener('click', function () {
      var el = wrap;
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (el.requestFullscreen) el.requestFullscreen().catch(function () { say('&7Fullscreen is not available here.'); });
        else say('&7Fullscreen is not available here.');
      } catch (e) { say('&7Fullscreen is not available here.'); }
      focusGame();
    });
    document.addEventListener('fullscreenchange', function () { setTimeout(resize, 60); });
    $('.mc-pause').addEventListener('click', function () { if (started) pause(); });
    function pause() {
      if (!started || dead) return;
      paused = true; keys = {}; primary = secondary = false; ovPause.hidden = false; save();
    }
    function resume() { paused = false; ovPause.hidden = true; focusGame(); }
    $('.mc-resume').addEventListener('click', resume);
    $('.mc-respawn').addEventListener('click', respawn);
    // clicking anywhere outside the game pauses it (so it never runs in the background)
    document.addEventListener('pointerdown', function (e) { if (started && !paused && !dead && !wrap.contains(e.target) && !stage.contains(e.target)) pause(); }, true);
    document.addEventListener('focusin', function (e) { if (started && !paused && !dead && !stage.contains(e.target)) pause(); });

    /* ---------------- start ---------------- */
    function refreshAll() { hudCache = {}; renderHotbar(); renderBars(); renderBoard(); renderMode(); renderSound(); $('.mp-down').hidden = !S.fly; }
    function startGame(fresh) {
      if (started) return;
      audio();
      if (fresh || !loaded) { if (fresh) { newWorld(); } }
      started = true; ovStart.hidden = true; wrap.classList.add('is-playing');
      refreshAll();
      say('&eWelcome to &6&lBlockRealm&e!');
      say('&7RealmCore v4 loaded. Loot the &6chest &7in the house, then type &f/help');
      focusGame();
    }
    var loaded = load();
    if (!loaded) newWorld();
    else { $('.mc-play').textContent = 'Continue'; $('.mc-new').hidden = false; }
    $('.mc-play').addEventListener('click', function () { startGame(false); });
    $('.mc-new').addEventListener('click', function () { newWorld(); startGame(false); say('&aA brand new world was generated.'); });
    refreshAll();
    $('.mc-help-touch').hidden = !window.matchMedia('(hover: none)').matches;
    $('.mc-help-keys').hidden = window.matchMedia('(hover: none)').matches;
    if (window.matchMedia('(hover: none)').matches) wrap.classList.add('is-touch');

    /* ---------------- camera + resize ---------------- */
    var cam = { x: player.x - 10, y: player.y - 8 };
    var light = mk(CW, CH), lctx = light.getContext('2d'), lm = mk(4, 4), lmx = lm.getContext('2d'), lmData = lmx.createImageData(4, 4);
    function resize() {
      var rc = screen.getBoundingClientRect();
      if (!rc.width || !rc.height) return;
      var nw = Math.round(CH * rc.width / rc.height / 2) * 2;
      nw = XR.clamp(nw, 256, 720);
      if (nw !== CW) { CW = nw; canvas.width = CW; canvas.height = CH; light.width = CW; light.height = CH; ctx.imageSmoothingEnabled = false; }
    }
    ctx.imageSmoothingEnabled = false;
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(screen); else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (!visible && started && !paused && !dead) pause();
    }).observe(screen);
    document.addEventListener('visibilitychange', function () { if (document.hidden && started && !paused) pause(); });
    window.addEventListener('pagehide', save);

    /* ---------------- update ---------------- */
    function update(dt) {
      var b = brightness();
      // time
      S.t += dt / DAY_LEN;
      if (S.t >= 1) { S.t -= 1; S.day++; }
      if (b < .3) sawNight = true;
      if (sawNight && b > .6) { sawNight = false; if (!dead) adv('night'); if (event) endEvent(false); say('&eThe sun rises on day ' + S.day + '.'); }
      if (lastBright >= .35 && b < .35) say('&7Night falls... &cmonsters are coming out.');
      lastBright = b;

      // player movement
      var it = heldIt(), fly = !!S.fly;
      var dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (dir) player.dir = dir;
      if (player.inv > 0) player.inv -= dt;
      var target = dir * SPEED * (eating > 0 ? .4 : 1);
      if (Math.abs(player.vx) > SPEED + .5) player.vx *= Math.pow(.02, dt); else player.vx += (target - player.vx) * Math.min(1, dt * 14);
      if (fly) {
        var vv = (keys.down ? 1 : 0) - (keys.jump ? 1 : 0);
        player.vy += (vv * 6 - player.vy) * Math.min(1, dt * 10);
      }
      var wet = move(player, dt, fly);
      if (!fly) {
        if (keys.jump && player.ground) { player.vy = -JUMP; }
        else if (keys.jump && wet) player.vy = Math.max(player.vy - 30 * dt, -4);
        else if (dir && player.ground && blockedAhead(player)) player.vy = -JUMP; // auto-jump
      }
      if (player.landed > 3.4 && !wet && !fly) hurt(Math.floor(player.landed - 3), null, 'You hit the ground too hard');
      player.landed = 0;
      if (player.y > H + 2) { hurt(20, null, 'You fell out of the world'); }
      player.walk += Math.abs(player.vx) * dt * 3;

      // primary: attack or mine
      attackCd = Math.max(0, attackCd - dt);
      player.swing = Math.max(0, player.swing - dt * 4);
      var pcx = player.x + player.w / 2, pcy = player.y + .4;
      if (primary && aim.on) {
        var mob = null;
        mobs.forEach(function (m) { if (aim.x >= m.x - .2 && aim.x <= m.x + m.w + .2 && aim.y >= m.y - .2 && aim.y <= m.y + m.h + .2 && Math.hypot(m.x + m.w / 2 - pcx, m.y + m.h / 2 - pcy) < REACH) mob = m; });
        if (mob) {
          mineT = null;
          if (attackCd === 0) {
            attackCd = .42; player.swing = 1; player.dir = mob.x > player.x ? 1 : -1;
            var dmg = it.dmg || 1, crit = !player.ground && player.vy > 0;
            if (crit) { dmg = Math.round(dmg * 1.5); burst(mob.x + mob.w / 2, mob.y + .4, ['#ffffff', '#cfcfcf'], 10, 5); }
            damageMob(mob, dmg, player.dir);
          }
        } else {
          var tx = aim.tx, ty = aim.ty, id = get(tx, ty), bdef = BL[id];
          var dist = Math.hypot(tx + .5 - pcx, ty + .5 - pcy);
          if (id && id !== T.WATER && bdef && bdef.h !== Infinity && dist <= REACH) {
            if (!mineT || mineT.x !== tx || mineT.y !== ty) mineT = { x: tx, y: ty, p: 0 };
            var tier = it.tool === 'pick' ? it.tier : 0;
            var time = bdef.pick ? (tier ? bdef.h * 1.5 / PICK_SPEED[tier] : bdef.h * 5) : bdef.h * 1.5;
            mineT.p += dt / Math.max(.05, time);
            player.swing = 1; player.dir = tx + .5 > pcx ? 1 : -1;
            mineT.snd = (mineT.snd || 0) - dt; if (mineT.snd <= 0) { mineT.snd = .22; sfx('dig'); parts.push({ x: tx + Math.random(), y: ty + Math.random(), vx: (Math.random() - .5) * 3, vy: -2, l: .3, c: (bdef.c || ['#888'])[0], g: 1, s: 1 }); }
            if (mineT.p >= 1) { breakBlock(tx, ty, true); mineT = null; exhaust(.05); }
          } else mineT = null;
        }
      }
      // secondary: use / place (repeats while held)
      useCd = Math.max(0, useCd - dt);
      if (secondary && aim.on && useCd === 0) { useCd = .25; use(); }
      if (eating > 0) {
        eating -= dt;
        if (Math.random() < dt * 14) { var col = (SPR[heldIt().spr] || SPR.apple).c; var cs = Object.keys(col).map(function (k) { return col[k]; }); parts.push({ x: pcx + player.dir * .3, y: player.y + .5, vx: (Math.random() - .5) * 2, vy: -2, l: .35, c: cs[(Math.random() * cs.length) | 0], g: 1, s: 1 }); }
        if (eating <= 0 && player.eatId) { eatDone(player.eatId); player.eatId = null; }
      }

      // hunger + regen
      hungerT += dt;
      if (hungerT > 26) { hungerT = 0; exhaust(1); }
      regenT += dt;
      if (regenT > 3) {
        regenT = 0;
        if (S.food >= 18 && S.hp < 20) { S.hp++; renderBars(); }
        else if (S.food <= 0 && S.hp > 1) hurt(1, null, 'You starved to death');
      }

      // spawning
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = event ? 2.2 : 3.6;
        var hostile = mobs.filter(function (m) { return MOB[m.type].hostile; }).length;
        if (b < .35 && hostile < (event ? 7 : 5)) spawnNear(event || Math.random() < .72 ? 'zombie' : 'creeper', 13, 22);
        if (b > .6 && mobs.filter(function (m) { return m.type === 'pig'; }).length < 4 && Math.random() < .5) spawnNear('pig', 10, 26);
      }
      updateMobs(dt, b);

      // primed tnt
      tnts.forEach(function (t) { t.fuse -= dt; if (t.fuse <= 0) { t.done = true; explode(t.x + .5, t.y + .5, 3.6, true); } });
      tnts = tnts.filter(function (t) { return !t.done; });
      // pearls
      pearls.forEach(function (p) {
        p.vy += 22 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, l: .25, c: '#b36bff', g: 0, s: 1 });
        if (solidAt(Math.floor(p.x), Math.floor(p.y)) || p.y > H) {
          p.done = true;
          var nx = p.x - p.vx * dt * 1.5 - player.w / 2, ny = p.y - p.vy * dt * 1.5 - player.h;
          var probe = { x: nx, y: ny, w: player.w, h: player.h }, g = 0; while (collides(probe) && g++ < 4) probe.y -= 1;
          if (!collides(probe)) {
            burst(player.x + .3, player.y + .9, ['#b36bff', '#6b2bd9'], 20, 4);
            player.x = probe.x; player.y = probe.y; player.vx = player.vy = 0; player.fallFrom = player.y;
            burst(player.x + .3, player.y + .9, ['#b36bff', '#6b2bd9'], 20, 4);
            hurt(1, null, 'You were hurt by an ender pearl'); sfx('pearl'); adv('pearl');
          }
        }
      });
      pearls = pearls.filter(function (p) { return !p.done; });
      // drops
      drops.forEach(function (d) {
        d.age += dt;
        var dx = pcx - (d.x + d.w / 2), dy = player.y + 1 - (d.y + d.h / 2), dd = Math.hypot(dx, dy);
        if (d.age > .35 && dd < 2.2) { d.vx += dx * 30 * dt; d.vy += dy * 30 * dt; }
        move(d, dt, false);
        d.vx *= d.ground ? .8 : .99;
        if (d.age > .35 && dd < .8) { var left = addItem(d.id, d.n); if (left < d.n) sfx('pop'); d.n = left; if (!left) d.done = true; }
        if (d.age > 180) d.done = true;
      });
      drops = drops.filter(function (d) { return !d.done; });
      // particles + floats
      parts.forEach(function (p) { p.l -= dt; p.vy += GRAV * (p.g == null ? 1 : p.g) * dt * .5; p.x += p.vx * dt; p.y += p.vy * dt; });
      parts = parts.filter(function (p) { return p.l > 0; });
      if (parts.length > 500) parts.splice(0, parts.length - 500);
      floats.forEach(function (f) { f.l -= dt; f.y -= dt * 1.2; });
      floats = floats.filter(function (f) { return f.l > 0; });
      shake = Math.max(0, shake - dt); flashA = Math.max(0, flashA - dt * 1.6);
      saveT += dt; if (saveT > 20) { saveT = 0; save(); }
      if (dead) return;
    }
    function exhaust(n) { S.food = Math.max(0, S.food - n); renderBars(); }
    function use() {
      var it = heldIt(), h = held(), tx = aim.tx, ty = aim.ty, id = get(tx, ty);
      var pcx = player.x + player.w / 2, pcy = player.y + .4, dist = Math.hypot(tx + .5 - pcx, ty + .5 - pcy);
      if (dist <= REACH) {
        if (id === T.CHEST) { var k = ty * W + tx; if (chests[k]) lootChest(k); else say('&7The chest is empty.'); secondary = false; return; }
        if (id === T.TNT) { set(tx, ty, T.AIR); tnts.push({ x: tx, y: ty, fuse: 2.6 }); sfx('fuse'); say('&cTNT primed! &7Run!'); secondary = false; return; }
      }
      if (it.food) { tryEat(); secondary = false; return; }
      if (h && h.id === 'pearl') {
        var ang = Math.atan2(aim.y - pcy, aim.x - pcx);
        pearls.push({ x: pcx, y: pcy, vx: Math.cos(ang) * 17, vy: Math.sin(ang) * 17 });
        useHeld(1); player.swing = 1; sfx('pearl'); secondary = false; return;
      }
      if (h && h.id === 'key') { secondary = false; openCrate(); return; }
      if (it.block != null && dist <= REACH) {
        if (placeBlock(tx, ty, it.block)) { useHeld(1); player.swing = 1; }
      }
    }

    /* ---------------- render ---------------- */
    function drawSky(b) {
      var sunH = Math.sin(S.t * Math.PI * 2), dusk = Math.max(0, 1 - Math.abs(sunH) * 3.2);
      var top = mix(event ? '#1a0205' : '#04061a', S.rain ? '#56657d' : '#5d93ff', b);
      var bot = mix(event ? '#5a0e14' : '#141a44', S.rain ? '#98a5b8' : '#bcd8ff', b);
      if (!S.rain) bot = mix(bot, '#ff8a4c', dusk * .55);
      var g = ctx.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, top); g.addColorStop(1, bot);
      ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
      if (b < .6) {
        ctx.globalAlpha = 1 - b / .6; ctx.fillStyle = '#fff';
        for (var i = 0; i < 60; i++) { var sx = (i * 97.3 + 13) % CW, sy = (i * 53.7) % (CH * .6); if ((i + (frame >> 5)) % 7) ctx.fillRect(sx | 0, sy | 0, 1, 1); }
        ctx.globalAlpha = 1;
      }
      // sun + moon on an arc
      var a = S.t * Math.PI * 2, R = CW * .44;
      var sx2 = CW / 2 - Math.cos(a) * R, sy2 = CH * .7 - Math.sin(a) * CH * .62;
      if (!S.rain) { ctx.fillStyle = '#fff3a6'; ctx.fillRect(sx2 - 11, sy2 - 11, 22, 22); ctx.fillStyle = '#ffe14d'; ctx.fillRect(sx2 - 7, sy2 - 7, 14, 14); }
      var mx = CW / 2 + Math.cos(a) * R, my = CH * .7 + Math.sin(a) * CH * .62;
      ctx.fillStyle = event ? '#ff3a3a' : '#e8ecff'; ctx.fillRect(mx - 9, my - 9, 18, 18); ctx.fillStyle = event ? '#a01818' : '#c3c9e8'; ctx.fillRect(mx - 5, my - 4, 4, 4); ctx.fillRect(mx + 2, my + 2, 3, 3);
      // parallax hills
      hills(.18, '#3d5f9a', '#16213f', 7, 36, b);
      hills(.35, '#2f6a45', '#0f2419', 5, 22, b);
      // clouds
      ctx.fillStyle = S.rain ? 'rgba(80,90,110,.9)' : 'rgba(255,255,255,' + (.35 + b * .55) + ')';
      for (var c = 0; c < 6; c++) {
        var cx = ((c * 173 - cam.x * B * .1 - frame * .08) % (CW + 120) + CW + 120) % (CW + 120) - 60, cy = 18 + (c * 37) % 50 - cam.y * .5;
        ctx.fillRect(cx | 0, cy | 0, 48 + (c % 3) * 14, 8); ctx.fillRect((cx + 8) | 0, (cy - 5) | 0, 26 + (c % 2) * 10, 5);
      }
    }
    function hills(f, day, night, amp, base, b) {
      ctx.fillStyle = mix(night, day, b);
      ctx.beginPath();
      var by = (SEA - 3 - cam.y * f) * B * .9 + CH * .08 - base;
      ctx.moveTo(0, CH);
      for (var x = 0; x <= CW; x += 8) {
        var wx = (x + cam.x * B * f) / 40;
        ctx.lineTo(x, by - (Math.sin(wx) * .6 + Math.sin(wx * .37 + 2) + Math.sin(wx * 2.1) * .2) * amp * 4);
      }
      ctx.lineTo(CW, CH); ctx.closePath(); ctx.fill();
    }
    function mix(a, b2, t) {
      var p = function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
      var x = p(a), y = p(b2);
      return '#' + [0, 1, 2].map(function (i) { return ('0' + Math.round(x[i] + (y[i] - x[i]) * t).toString(16)).slice(-2); }).join('');
    }
    function drawHuman(e, skin) {
      var X = Math.round((e.x - cam.x) * B), Y = Math.round((e.y - cam.y) * B), f = e.dir || 1;
      var ox = X - 1, sw = Math.sin(e.walk * 2.2) * (e.ground === false ? .3 : 1);
      var hurtF = e.hurtT > 0 || (e === player && player.inv > .3);
      function R(x, y, w, h, c) { ctx.fillStyle = hurtF ? blend(c) : c; ctx.fillRect(ox + x, Y + y, w, h); }
      // legs
      R(1, 18, 4, 10 - Math.max(0, sw * 2), skin.legs); R(5, 18, 4, 10 - Math.max(0, -sw * 2), skin.legs2 || skin.legs);
      if (skin.shoes) { R(1, 26 - Math.max(0, sw * 2), 4, 2, skin.shoes); R(5, 26 - Math.max(0, -sw * 2), 4, 2, skin.shoes); }
      // body
      R(1, 8, 8, 10, skin.body); if (skin.zip) R(4, 9, 1, 8, skin.zip);
      // arms
      if (skin.reach) { R(f > 0 ? 6 : -4, 9, 8, 2, skin.arm); R(f > 0 ? 6 : -4, 12, 8, 2, skin.arm); }
      else { var swing = e.swing ? -e.swing * 3 : sw; R(f > 0 ? 7 : 1, 9 + Math.round(swing), 2, 7, skin.arm); }
      // head
      R(1, 0, 8, 8, skin.face);
      R(1, 0, 8, 3, skin.hair); if (skin.band) R(1, 2, 8, 1, skin.band);
      if (skin.fringe) { R(f > 0 ? 1 : 7, 3, 2, 3, skin.hair); }
      var ex = f > 0 ? 5 : 2;
      R(ex, 4, 2, 1, skin.eye1 || '#fff'); R(ex + (f > 0 ? 1 : 0), 4, 1, 1, skin.eye || '#1d1733');
      R(ex + (f > 0 ? -3 : 3), 4, 1, 1, skin.eye || '#1d1733');
      if (skin.mouth) R(ex - (f > 0 ? 1 : 0), 6, 2, 1, skin.mouth);
    }
    function blend(c) { return '#ff5a5a'; }
    var SKIN = {
      player: { hair: '#e8ebf8', band: '#1c1a33', face: '#ffd8c4', body: '#e0203f', zip: '#6e1c10', arm: '#b8321f', legs: '#1d1b33', shoes: '#efe4cc', eye: '#0b8f8a', fringe: 1 },
      zombie: { hair: '#2f5a2a', face: '#5f9a4a', body: '#2f9c9c', arm: '#5f9a4a', legs: '#3b3b8f', eye: '#101010', eye1: '#101010', reach: 1, mouth: '#2a4a22' }
    };
    function drawCreeper(m) {
      var X = Math.round((m.x - cam.x) * B) - 1, Y = Math.round((m.y - cam.y) * B);
      var white = m.fuse > 0 && Math.floor(m.fuse * 8) % 2 === 0;
      var sw = Math.sin(m.walk * 2.2) * 2;
      function R(x, y, w, h, c) { ctx.fillStyle = white ? '#ffffff' : m.hurtT > 0 ? '#ff5a5a' : c; ctx.fillRect(X + x, Y + y, w, h); }
      var sc = m.fuse > 0 ? 1 + m.fuse * .08 : 1;
      if (sc !== 1) { ctx.save(); ctx.translate(X + 5, Y + 14); ctx.scale(sc, sc); ctx.translate(-(X + 5), -(Y + 14)); }
      R(1, 0, 8, 8, '#4fa83a'); R(2, 1, 2, 1, '#6fcf55'); R(6, 5, 2, 1, '#3a8a2a');
      R(2, 2, 2, 2, '#101010'); R(6, 2, 2, 2, '#101010'); R(4, 4, 2, 3, '#101010'); R(3, 5, 1, 2, '#101010'); R(6, 5, 1, 2, '#101010');
      R(2, 8, 6, 12, '#4fa83a'); R(3, 10, 2, 2, '#6fcf55'); R(5, 14, 2, 2, '#3a8a2a'); R(3, 17, 1, 1, '#6fcf55');
      R(0, 20, 4, 6 - Math.max(0, sw), '#3f9030'); R(6, 20, 4, 6 - Math.max(0, -sw), '#3f9030');
      if (sc !== 1) ctx.restore();
    }
    function drawPig(m) {
      var X = Math.round((m.x - cam.x) * B) - 2, Y = Math.round((m.y - cam.y) * B), f = m.dir || 1;
      var sw = Math.sin(m.walk * 2.4) * 1.5;
      function R(x, y, w, h, c) { var xx = f > 0 ? x : 18 - x - w; ctx.fillStyle = m.hurtT > 0 ? '#ff5a5a' : c; ctx.fillRect(X + xx, Y + y, w, h); }
      R(1, 11, 3, 4 - Math.max(0, sw), '#e0909a'); R(4, 11, 3, 4 - Math.max(0, -sw), '#e0909a'); R(10, 11, 3, 4 - Math.max(0, -sw), '#e0909a'); R(13, 11, 3, 4 - Math.max(0, sw), '#e0909a');
      R(0, 4, 15, 8, '#f0a8b0'); R(2, 5, 3, 2, '#f7c4ca');
      R(12, 1, 7, 8, '#f0a8b0'); R(17, 4, 3, 3, '#e07a88'); R(18, 5, 1, 1, '#8a3040');
      R(14, 3, 1, 1, '#101010'); R(13, 3, 1, 1, '#fff');
    }
    function drawHeld() {
      var h = held(); if (!h || dead) return;
      var c = itemCanvas(h.id), f = player.dir;
      var X = (player.x - cam.x) * B + (f > 0 ? 9 : -1), Y = (player.y - cam.y) * B + 14 - player.swing * 3;
      ctx.save(); ctx.translate(Math.round(X), Math.round(Y));
      ctx.rotate(f * (-.6 + player.swing * 1.2)); if (f < 0) ctx.scale(-1, 1);
      ctx.drawImage(c, -2, -9, 10, 10);
      ctx.restore();
    }
    function drawNameTag(e, text, color) {
      var X = (e.x + e.w / 2 - cam.x) * B, Y = (e.y - cam.y) * B - 5;
      ctx.font = '8px VT323, monospace'; ctx.textAlign = 'center';
      var w = ctx.measureText(text).width + 4;
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(Math.round(X - w / 2), Math.round(Y - 7), Math.round(w), 8);
      ctx.fillStyle = color; ctx.fillText(text, Math.round(X), Math.round(Y));
    }
    var frame = 0;
    function render() {
      frame++;
      var b = brightness();
      var sx = shake > 0 ? (Math.random() - .5) * shake * 12 : 0, sy = shake > 0 ? (Math.random() - .5) * shake * 12 : 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      drawSky(b);
      ctx.setTransform(1, 0, 0, 1, Math.round(sx), Math.round(sy));
      var vw = CW / B, vh = CH / B;
      var x0 = Math.floor(cam.x), y0 = Math.floor(cam.y), x1 = Math.ceil(cam.x + vw), y1 = Math.ceil(cam.y + vh);
      var offX = Math.round(cam.x * B), offY = Math.round(cam.y * B), x, y;
      // tiles
      for (y = y0; y <= y1; y++) {
        if (y < 0 || y >= H) continue;
        for (x = x0; x <= x1; x++) {
          if (x < 0 || x >= W) continue;
          var id = world[y * W + x], px = x * B - offX, py = y * B - offY;
          if ((!id || !BL[id].o) && bg[y * W + x]) ctx.drawImage(BGTEX[bg[y * W + x]], px, py);
          if (id) ctx.drawImage(TEX[id], px, py);
        }
      }
      // mining crack + selection
      if (mineT) ctx.drawImage(CRACKS[Math.min(9, Math.floor(mineT.p * 10))], mineT.x * B - offX, mineT.y * B - offY);
      if (aim.on && started && !touch && !dead) {
        var pcx = player.x + player.w / 2, pcy = player.y + .4;
        if (Math.hypot(aim.tx + .5 - pcx, aim.ty + .5 - pcy) <= REACH) { ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 1; ctx.strokeRect(aim.tx * B - offX + .5, aim.ty * B - offY + .5, B - 1, B - 1); }
      }
      // tnt
      tnts.forEach(function (t) {
        ctx.drawImage(TEX[T.TNT], t.x * B - offX, t.y * B - offY);
        if (Math.floor(t.fuse * 6) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(t.x * B - offX, t.y * B - offY, B, B); }
      });
      // drops
      drops.forEach(function (d) { ctx.drawImage(itemCanvas(d.id), Math.round((d.x - cam.x) * B) - 1, Math.round((d.y - cam.y) * B + Math.sin(d.age * 4) * 1.5) - 2, 8, 8); });
      // mobs
      mobs.forEach(function (m) {
        if (m.type === 'zombie') drawHuman(m, SKIN.zombie); else if (m.type === 'creeper') drawCreeper(m); else drawPig(m);
        if (m.hp < m.max) { var X = (m.x + m.w / 2 - cam.x) * B, Y = (m.y - cam.y) * B - 4; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(Math.round(X - 8), Math.round(Y), 16, 2); ctx.fillStyle = m.hp / m.max > .4 ? '#55ff55' : '#ff5555'; ctx.fillRect(Math.round(X - 8), Math.round(Y), Math.round(16 * m.hp / m.max), 2); }
      });
      // player
      if (!dead) {
        if (!(player.inv > 0 && Math.floor(player.inv * 20) % 2)) drawHuman(player, SKIN.player);
        drawHeld();
      }
      // pearls
      pearls.forEach(function (p) { ctx.fillStyle = '#2bb3a6'; ctx.fillRect(Math.round((p.x - cam.x) * B) - 2, Math.round((p.y - cam.y) * B) - 2, 4, 4); });
      // water overlay in front
      // lighting
      if (lightDirty) relight();
      lctx.globalCompositeOperation = 'source-over';
      lctx.clearRect(0, 0, CW, CH);
      var lw = x1 - x0 + 3, lh = y1 - y0 + 3;
      if (lm.width !== lw || lm.height !== lh) { lm.width = lw; lm.height = lh; lmData = lmx.createImageData(lw, lh); }
      var dd = lmData.data, dayK = .16 + .84 * b, tint = event ? [34, 0, 6] : [2, 4, 18];
      for (y = 0; y < lh; y++) for (x = 0; x < lw; x++) {
        var wx = x0 - 1 + x, wy = y0 - 1 + y, lvl = wx < 0 || wx >= W ? 15 : wy < 0 ? 15 : wy >= H ? 0 : sky[wy * W + wx];
        var o = (y * lw + x) * 4, a = (1 - lvl / 15 * dayK);
        dd[o] = tint[0]; dd[o + 1] = tint[1]; dd[o + 2] = tint[2]; dd[o + 3] = Math.round(Math.min(.95, a * a * .5 + a * .5) * 255);
      }
      lmx.putImageData(lmData, 0, 0);
      lctx.imageSmoothingEnabled = true;
      lctx.drawImage(lm, (x0 - 1) * B - offX, (y0 - 1) * B - offY, lw * B, lh * B);
      lctx.globalCompositeOperation = 'destination-out';
      function glow(wx, wy, r, a) {
        var gx = wx * B - offX, gy = wy * B - offY;
        if (gx < -r * B || gx > CW + r * B || gy < -r * B || gy > CH + r * B) return;
        var g = lctx.createRadialGradient(gx, gy, 0, gx, gy, r * B);
        g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
        lctx.fillStyle = g; lctx.fillRect(gx - r * B, gy - r * B, r * B * 2, r * B * 2);
      }
      for (var k in torches) { var tx2 = k % W, ty2 = (k / W) | 0; if (tx2 >= x0 - 7 && tx2 <= x1 + 7 && ty2 >= y0 - 7 && ty2 <= y1 + 7) glow(tx2 + .5, ty2 + .3, 6.5, 1); }
      var hid = held() && held().id;
      glow(player.x + .3, player.y + .6, hid === 'torch' ? 6 : 2.6, hid === 'torch' ? 1 : .55);
      tnts.forEach(function (t) { glow(t.x + .5, t.y + .5, 3, .8); });
      if (flashA > .2 && shake > .3) glow(player.x, player.y, 12, flashA);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(light, 0, 0);
      ctx.setTransform(1, 0, 0, 1, Math.round(sx), Math.round(sy));
      // torch flames + particles glow on top of darkness
      for (k in torches) {
        var fx = k % W, fy = (k / W) | 0;
        if (fx < x0 || fx > x1 || fy < y0 || fy > y1) continue;
        ctx.fillStyle = (frame >> 3) % 2 ? '#ffe14d' : '#ffb03a'; ctx.fillRect(fx * B - offX + 7, fy * B - offY + 3, 2, 2);
      }
      parts.forEach(function (p) { ctx.fillStyle = p.c; ctx.fillRect(Math.round((p.x - cam.x) * B), Math.round((p.y - cam.y) * B), p.s || 1, p.s || 1); });
      // rain
      if (S.rain) {
        ctx.fillStyle = 'rgba(160,190,255,.6)';
        for (var i = 0; i < 70; i++) { var rx = (i * 83 + frame * 3) % CW, ry = (i * 47 + frame * 9) % CH; ctx.fillRect(rx, ry, 1, 5); }
      }
      // name tags + floats
      if (!dead && started) drawNameTag(player, S.rank === 'VIP' ? '[VIP] You' : 'You', S.rank === 'VIP' ? '#55ff55' : '#ffffff');
      ctx.font = '9px VT323, monospace'; ctx.textAlign = 'center';
      floats.forEach(function (f) { ctx.globalAlpha = Math.min(1, f.l); ctx.fillStyle = '#3a2a00'; ctx.fillText(f.t, Math.round((f.x - cam.x) * B) + 1, Math.round((f.y - cam.y) * B) + 1); ctx.fillStyle = f.c; ctx.fillText(f.t, Math.round((f.x - cam.x) * B), Math.round((f.y - cam.y) * B)); ctx.globalAlpha = 1; });
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // underwater tint
      if (get(Math.floor(player.x + .3), Math.floor(player.y + .3)) === T.WATER) { ctx.fillStyle = 'rgba(30,80,200,.28)'; ctx.fillRect(0, 0, CW, CH); }
      flashEl.style.opacity = flashA.toFixed(2);
      // info line
      var hr = (6 + S.t * 24) % 24, mn = Math.floor((hr % 1) * 60);
      var info = 'Day ' + S.day + ' · ' + String(Math.floor(hr)).padStart(2, '0') + ':' + String(mn - mn % 10).padStart(2, '0') + ' · ' + (b < .35 ? 'Night' : b < .7 ? (S.t < .25 || S.t > .9 ? 'Dawn' : 'Dusk') : 'Day') + ' · X ' + Math.floor(player.x) + ' Y ' + (H - Math.floor(player.y));
      if (hudCache.info !== info) { infoEl.textContent = info; hudCache.info = info; }
    }

    /* ---------------- loop ---------------- */
    var last = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!visible || document.hidden) return;
      if (started && !paused && !dead && !panel) update(dt);
      else if (!started) { S.t += dt / DAY_LEN * 2; if (S.t >= 1) S.t -= 1; }
      // camera follows the player
      var vw = CW / B, vh = CH / B;
      var tx = XR.clamp(player.x + .3 - vw / 2 + player.dir * 1.5, 0, W - vw), ty = XR.clamp(player.y + .9 - vh * .55, 0, H - vh);
      if (!started) tx = XR.clamp(player.x - vw / 2 + Math.sin(now / 4000) * 3, 0, W - vw);
      cam.x += (tx - cam.x) * Math.min(1, dt * 6); cam.y += (ty - cam.y) * Math.min(1, dt * 6);
      render();
    }
    cam.x = XR.clamp(player.x - CW / B / 2, 0, W - CW / B); cam.y = XR.clamp(player.y + .9 - CH / B * .55, 0, H - CH / B);
    requestAnimationFrame(loop);
    stage.__mc = { player: player, cam: cam, get: get, state: function () { return S; }, B: B, W: W, width: function () { return CW; } }; // used by automated tests

    // periodic server broadcast
    setInterval(function () {
      if (!started || paused || document.hidden || !visible) return;
      var msgs = ['&d[Realm] &fDouble XP weekend is live!', '&d[Realm] &fVote daily with &e/vote &ffor crate keys', '&d[Realm] &fTry &c/event bloodmoon &fif you feel brave', '&d[Realm] &fDiamonds spawn deep underground. Bring torches!'];
      say(msgs[(Math.random() * msgs.length) | 0]);
    }, 45000);
  });
})();
