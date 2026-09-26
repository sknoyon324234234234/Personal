/* XIRAIYA — the heroines of the village: one list shared by the Lab
   (Character Select, Jutsu Dojo, Panel Maker) and the home page (the
   3D village and the power scroll). Stats: power, speed, chakra, style, charm. */
(function () {
  'use strict';
  var D = 'assets/img/heroines/';
  window.XRCAST = [
    { id: 'homura', name: 'Homura', jp: '焔', title: 'The Ember Blade', el: 'Fire', col: '#ff7a1a', dark: '#2a0b04', img: D + 'homura.webp', w: 521, h: 992, pixel: true,
      stats: [94, 82, 70, 86, 88], special: 'Crimson Lotus', sjp: '紅蓮華', fx: 'fire', face: '50% 10%',
      line: 'Stand still. This will only burn a little.',
      moves: [['Ember Step', '↓ ↘ → P'], ['Flare Heel', '→ ↓ ↘ K'], ['Crimson Lotus', '↓ ↓ P+K']] },
    { id: 'kiri', name: 'Kiri', jp: '霧', title: 'Elf of the Mist', el: 'Mist', col: '#8fd0ff', dark: '#0b1624', img: D + 'kiri.webp', w: 297, h: 968, pixel: true,
      stats: [66, 96, 84, 90, 92], special: 'Silent Frost Veil', sjp: '霧氷帳', fx: 'frost', face: '50% 9%',
      line: 'You will not see me coming. You will only feel the cold.',
      moves: [['Mist Walk', '← ↙ ↓ K'], ['Needle Rain', '↓ ↘ → P'], ['Silent Frost Veil', '→ ← → P+K']] },
    { id: 'aoi', name: 'Aoi', jp: '葵', title: 'Tidecaller', el: 'Water', col: '#3a9dff', dark: '#06142e', img: D + 'aoi.webp', w: 432, h: 968, pixel: true,
      stats: [80, 78, 96, 88, 90], special: 'Moonlit Tsunami', sjp: '月下大津波', fx: 'water', face: '50% 9%',
      line: 'The tide always comes back. So do I.',
      moves: [['Ripple Palm', '↓ ↘ → P'], ['Undertow', '← ↓ ↙ K'], ['Moonlit Tsunami', '↓ ↓ ↓ P+K']] },
    { id: 'yami', name: 'Yami', jp: '闇', title: 'Guardian of the Black Tomb', el: 'Darkness', col: '#9b6bff', dark: '#0d0718', img: D + 'yami.webp', w: 473, h: 1000,
      stats: [96, 74, 92, 98, 94], special: 'Black Wing Dominion', sjp: '黒翼支配', fx: 'dark', face: '50% 8%',
      line: 'Kneel. Or I will help you kneel.',
      moves: [['Obsidian Guard', '← ← P'], ['Horned Rush', '→ → K'], ['Black Wing Dominion', '↓ ↙ ← P+K']] },
    { id: 'shion', name: 'Shion', jp: '紫苑', title: 'The Shadow Weaver', el: 'Shadow', col: '#c47dff', dark: '#12061c', img: D + 'shion.webp', w: 689, h: 875,
      stats: [84, 90, 88, 94, 86], special: 'Thousand Ribbon Bind', sjp: '千影縛り', fx: 'ribbon', face: '48% 22%',
      line: 'Every shadow in this room already belongs to me.',
      moves: [['Ribbon Lash', '→ ↘ ↓ P'], ['Shade Swap', '↓ ↓ K'], ['Thousand Ribbon Bind', '← ↙ ↓ ↘ → P+K']] },
    { id: 'hikari', name: 'Hikari', jp: '光', title: 'The Sunshine Maid', el: 'Light', col: '#ffc93c', dark: '#2a1c02', img: D + 'hikari.webp', w: 501, h: 1000, pixel: true,
      stats: [72, 88, 80, 92, 99], special: 'Sparkle Heart Service', sjp: 'きらきら奉仕', fx: 'hearts', face: '50% 8%',
      line: 'Welcome home, master! Today’s special is victory!',
      moves: [['Tray Toss', '↓ ↘ → P'], ['Twirl Step', '→ → K'], ['Sparkle Heart Service', '↓ ↑ ↓ ↑ P+K']] }
  ];
  window.XRCAST.STATS = ['Power', 'Speed', 'Chakra', 'Style', 'Charm'];
  window.XRCAST.pick = function () {
    var id = null;
    try { id = localStorage.getItem('xr-cast-pick'); } catch (e) { /* ignore */ }
    return window.XRCAST.filter(function (c) { return c.id === id; })[0] || window.XRCAST[2];
  };
  window.XRCAST.choose = function (id) {
    try { localStorage.setItem('xr-cast-pick', id); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('xr:cast', { detail: id }));
  };
})();
