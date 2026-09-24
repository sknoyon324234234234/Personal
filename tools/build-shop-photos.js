#!/usr/bin/env node
/* Builds the Shop demo photos in assets/img/shop/<store>/<id>.jpg.

   Source: the free Unsplash photos bundled in the demo store of the
   @vendure/create npm package (assets/images). Unsplash License: free to
   use, attribution appreciated, so every photographer is credited on the
   page and in assets/img/shop/credits.json.

     npm pack @vendure/create && tar xzf vendure-create-*.tgz
     npm i sharp
     node tools/build-shop-photos.js package/assets/images

   Each photo is resized to 1000 px on its long side. Photos used as a
   store's hero banner also get a 1800 px "-xl" copy. */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) { console.error('usage: node tools/build-shop-photos.js <vendure images dir>'); process.exit(1); }
const OUT = path.join(__dirname, '..', 'assets', 'img', 'shop');

/* store -> { productId: source file stem } */
const MAP = {
  kage: {
    laptop: 'derick-david-409858', tablet: 'kelly-sikkema-685291', ultrawide: 'alexandru-acea-686569',
    monitor: 'daniel-korpai-1302051', keyboard: 'juan-gomez-674574', mouse: 'oscar-ivan-esquivel-arteaga-687447',
    tower: 'florian-olivo-1166419', ram: 'liam-briese-1128307', hdd: 'vincent-botta-736919',
    usbc: 'adam-birkett-239153', cat6: 'thomas-q-1229169'
  },
  halide: {
    tlr: 'alexander-andrews-260988', f2: 'chuttersnap-324234', onestep: 'eniko-kis-663725',
    instamatic: 'jakob-owens-274337', press: 'jonathan-talbert-697262', rx: 'patrick-brinksma-663044',
    x100: 'robert-shunev-528016', tele: 'brandi-redd-104140', tabletop: 'zoltan-tasi-423051'
  },
  stride: {
    prism: 'chuttersnap-584518', shadow: 'imani-clovis-234736', canvas: 'mitch-lensink-256007',
    knit: 'nikolai-chernichenko-1299748', eqt: 'thomas-serer-420833', court: 'xavier-teo-469050'
  },
  fieldday: {
    tent: 'michael-guite-571169', road: 'mikkel-bech-748940', cruiser: 'max-tarkhov-737999',
    football: 'nik-shuliahin-619349', tennis: 'ben-hershey-574483', gloves: 'neonbrand-428982',
    basketball: 'tommy-bebo-600358', rope: 'stoica-ionela-530966'
  },
  sobuj: {
    fern: 'caleb-george-536388', hanging: 'alex-rodriguez-santibanez-200278', succulents: 'annie-spratt-78044',
    cactus: 'charles-deluvio-695736', bonsai: 'mark-tegethoff-667351', tulips: 'natalia-y-345738',
    aloe: 'silvia-agrasar-227575', orchid: 'zoltan-kovacs-642412', trowel: 'neslihan-gunaydin-3493'
  },
  nordhem: {
    sofa: 'nathan-fertig-249917', leather: 'paul-weaver-1120584', armchair: 'kari-shea-398668',
    shell: 'andres-jasso-220776', cafe: 'jean-philippe-delberghe-1400011', balloon: 'florian-klauer-14840',
    pendant: 'pierre-chatel-innocenti-483198', desk: 'abel-y-costa-716024', bedside: 'benjamin-voros-310026',
    stool: 'ruslan-bardash-351288', lion: 'vincent-liu-525429'
  }
};
/* photos that are also shown as a wide hero banner */
const XL = { kage: ['monitor', 'ultrawide'], halide: ['x100', 'f2'], stride: ['prism'], fieldday: ['tent', 'road'], sobuj: ['fern', 'hanging'], nordhem: ['sofa', 'leather'] };

function credit(stem) {
  const m = stem.match(/^(.*)-(\d+)$/);
  const name = m[1].split('-').map(function (w) { return w.length > 1 ? w[0].toUpperCase() + w.slice(1) : w.toUpperCase(); }).join(' ');
  return { photographer: name, unsplash: m[2] };
}

(async function () {
  const credits = {};
  let bytes = 0;
  for (const store of Object.keys(MAP)) {
    const dir = path.join(OUT, store);
    fs.mkdirSync(dir, { recursive: true });
    credits[store] = {};
    for (const id of Object.keys(MAP[store])) {
      const stem = MAP[store][id], src = path.join(SRC, stem + '-unsplash.jpg');
      const out = path.join(dir, id + '.jpg');
      await sharp(src).rotate().resize(1000, 1000, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true, progressive: true }).toFile(out);
      bytes += fs.statSync(out).size;
      if ((XL[store] || []).indexOf(id) >= 0) {
        const xl = path.join(dir, id + '-xl.jpg');
        await sharp(src).rotate().resize(1800, 1800, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 70, mozjpeg: true, progressive: true }).toFile(xl);
        bytes += fs.statSync(xl).size;
      }
      credits[store][id] = credit(stem);
    }
  }
  fs.writeFileSync(path.join(OUT, 'credits.json'), JSON.stringify(credits, null, 1) + '\n');
  console.log('wrote', Object.values(MAP).reduce(function (s, m) { return s + Object.keys(m).length; }, 0), 'photos,', (bytes / 1048576).toFixed(2), 'MB');
})();
