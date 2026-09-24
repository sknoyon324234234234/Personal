/* =====================================================================
   XIRAIYA — Pages Studio: ten complete websites
   Each site is a brand with its own copy, photos, colours, type, button
   style, effects and section layouts. Picking one in the studio rewrites
   every page (home, pricing, product, portfolio, about...) for that
   business. The default "Lumen" SaaS copy lives in pages-kit.js.
   ===================================================================== */
(function () {
  'use strict';
  var I = 'assets/img/shop/';
  function imgs(dir, list) { return list.map(function (f) { return I + dir + '/' + f + '.jpg'; }); }

  window.XRSites = [
    {
      id: 'lumen', name: 'Lumen', kind: 'SaaS workspace', brand: 'Lumen', tag: 'The calm workspace for teams that ship',
      look: { p: '#5b5bf0', a: '#ff7a59', tone: 'neutral', mode: 'light', font: 'modern', r: 14, space: 1, shadow: .5, bw: 1, btn: { style: 'solid', shape: 'rounded', size: 'md', hover: 'lift' }, fx: { anim: 'fade', card: 'lift', bg: 'plain', head: 'plain', nav: 'static' } },
      layout: { hero: 1, features: 0, testimonials: 0, cta: 0, footer: 0, nav: 0 }
    },
    {
      id: 'aurele', name: 'Aurèle', kind: 'Fine jewellery', brand: 'Aurèle', tag: 'Fine jewellery, made slowly in Dhaka',
      img: imgs('aurelia', ['hero', 'solitaire', 'rosegold', 'cuff', 'locket', 'tennis', 'bangle', 'watch']),
      look: { p: '#b8924a', a: '#e7d3a6', tone: 'warm', mode: 'dark', font: 'luxe', r: 2, space: 1.2, shadow: .3, bw: 1, btn: { style: 'outline', shape: 'square', size: 'md', hover: 'shine' }, fx: { anim: 'blur', card: 'border', bg: 'noise', head: 'plain', nav: 'glass' } },
      layout: { hero: 1, features: 1, testimonials: 1, cta: 2, footer: 2, nav: 1 },
      c: {
        links: ['Collections', 'Bridal', 'Bespoke', 'Atelier'], eb: 'The Solstice collection is here', sub: '18k gold and ethically sourced stones, set by hand in our Gulshan atelier. Every piece is signed, numbered and yours to pass down.',
        cta1: 'Explore the collection', cta2: 'Book a fitting', proof: 'Worn by 4,000+ brides since 2016',
        heroStats: [['18k', 'Solid gold only'], ['100%', 'Traceable stones'], ['Lifetime', 'Free polishing']],
        logosH: 'As seen in', logos: [['VOGUE India', 700, 0], ['Harper’s', 500, 1], ['The Daily Star', 700, 0], ['ELLE', 800, 0], ['Brides', 500, 1], ['Tatler', 600, 1]],
        featH: 'Made to be kept for a lifetime', featSub: 'The small decisions that make a piece last.',
        feat: [['spark', 'Hand-set stones', 'Every claw is set under a loupe by one of our four master setters.'], ['shield', 'Certified and traceable', 'GIA certificates and a mine-to-market record for every diamond.'], ['users', 'Private fittings', 'Try pieces at home or in the atelier, with tea and no pressure.'], ['layers', 'Bespoke design', 'Sketch, wax model, then gold. Three meetings and it is yours.'], ['clock', 'Lifetime care', 'Free cleaning, polishing and re-plating for as long as you own it.'], ['globe', 'Insured delivery', 'Hand-delivered in Dhaka, insured shipping to 40 countries.']],
        stats: [['4,000+', 'Brides dressed'], ['1 in 1', 'Numbered pieces'], ['9 yrs', 'In the atelier'], ['4.9/5', 'Client rating']],
        quoteH: 'Pieces that became family stories',
        quotes: [['My grandmother’s ring was re-set by Aurèle. It still feels like hers, only brighter.', 'Nusrat Jahan', 'Bride, 2024'], ['The fitting felt like visiting a friend. They talked me out of the bigger stone, and they were right.', 'Rumana Afrin', 'Bespoke client'], ['Three years on and they still polish it for free. That is rare.', 'Tahmid Khan', 'Anniversary gift']],
        priceH: 'Care plans', priceSub: 'Every piece includes lifetime cleaning. Add cover for everything else.', per: '/year',
        plans: [['Essential', 0, 0, 'Included with every piece.', ['Lifetime cleaning', 'Yearly polish', 'Certificate copy']], ['Heirloom', 49, 39, 'For pieces you wear every day.', ['Everything in Essential', 'Loss and theft cover', 'Free re-sizing', 'Stone tightening']], ['Atelier', 149, 119, 'For collectors and families.', ['Everything in Heirloom', 'Home visits', 'Priority bespoke slots', 'Annual valuation']]],
        faq: [['Can I see pieces before I buy?', 'Yes. Book a private fitting in the atelier or at home in Dhaka.'], ['How long does bespoke take?', 'Six to eight weeks from the first sketch to the finished piece.'], ['Do you re-set old jewellery?', 'Often. Bring it in and we will tell you what the stones and gold can become.'], ['Is shipping insured?', 'Always. Every parcel is insured for its full value and signed for.'], ['Can I pay in instalments?', 'Yes, over 3 or 6 months with no interest, by card or bKash.']],
        ctaT: 'Book a private fitting', ctaS: 'An hour in the atelier with tea, no pressure and no obligation.', footLine: 'Signed, numbered and made to be passed down.',
        prod: { name: 'Solstice solitaire', desc: 'A 0.7 carat lab-certified diamond in an 18k yellow gold six-claw setting.', price: '$1,890', was: '$2,100', img: 1 },
        proj: [['Solstice collection', 'Rings'], ['Rose gold stack', 'Rings'], ['Moghul cuff', 'Bangles'], ['Keepsake locket', 'Pendants'], ['Tennis line', 'Bracelets'], ['Bridal bangles', 'Bangles'], ['Heritage watch', 'Watches'], ['The first ring', 'Rings']],
        projH: 'The collections', projSub: 'Every piece photographed in the atelier, on the day it was finished.'
      }
    },
    {
      id: 'nordhem', name: 'Nordhem', kind: 'Interior design studio', brand: 'Nordhem', tag: 'Rooms that feel like a deep breath',
      img: imgs('nordhem', ['sofa-xl', 'armchair', 'pendant', 'desk', 'bedside', 'cafe', 'leather', 'stool']),
      look: { p: '#1f2328', a: '#b86b3c', tone: 'warm', mode: 'light', font: 'grotesk', r: 0, space: 1.15, shadow: 0, bw: 1, btn: { style: 'solid', shape: 'square', size: 'lg', hover: 'press' }, fx: { anim: 'slide', card: 'border', bg: 'plain', head: 'plain', nav: 'glass' } },
      layout: { hero: 2, features: 1, testimonials: 1, cta: 0, footer: 2, nav: 3 },
      c: {
        links: ['Projects', 'Furniture', 'Process', 'Journal'], eb: 'Booking spring projects now', sub: 'We design and furnish homes, cafés and small offices across Dhaka and Chattogram. Scandinavian bones, Bengali warmth, nothing you will want to replace.',
        cta1: 'See our projects', cta2: 'Book a consultation', proof: '140 rooms finished since 2019',
        heroStats: [['140', 'Rooms finished'], ['6 wks', 'Average project'], ['0', 'Flat-pack furniture']],
        logosH: 'Featured in', logos: [['Dezeen', 700, 0], ['Kinfolk', 500, 1], ['Wallpaper*', 700, 0], ['Frame', 800, 0], ['AD', 800, 1], ['Openhouse', 500, 0]],
        featH: 'A calm process for a calm room', featSub: 'Four steps, one fixed price and a single person who answers your calls.',
        feat: [['search', 'Listen first', 'A two-hour walk-through of how you actually live before we draw a line.'], ['layers', 'Plans you can feel', 'Mood boards, fabric swatches and a 3D walk-through of every room.'], ['home', 'Made locally', 'Joinery by three Dhaka workshops we have trusted for a decade.'], ['clock', 'On time, on budget', 'A fixed quote and a weekly photo update until handover.'], ['shield', 'Five-year guarantee', 'Every piece we make is covered for five years.'], ['spark', 'Styled to the last cup', 'We finish with plants, books and lighting so it feels lived in.']],
        stats: [['140', 'Rooms finished'], ['4.9/5', 'Client rating'], ['92%', 'Clients who refer us'], ['6 wks', 'Average project']],
        quoteH: 'Homes our clients never want to leave',
        quotes: [['They made our 900 square feet feel like twice that. We host dinners now.', 'Farhan & Tania', 'Dhanmondi apartment'], ['The café paid for its redesign in four months. People come for the room.', 'Imran Kabir', 'Owner, Ghor Café'], ['Weekly photos, a fixed price and no surprises. I would hire them again tomorrow.', 'Sadia Islam', 'Gulshan home']],
        priceH: 'Design packages', priceSub: 'Fixed prices per room. Furniture is quoted separately, at cost plus 12%.', per: '/room',
        plans: [['Consult', 90, 90, 'Two hours, a plan and a shopping list.', ['On-site walk-through', 'Layout sketch', 'Shopping list']], ['Design', 690, 590, 'A full design you can build yourself.', ['Mood board + 3D model', 'Custom joinery drawings', 'Lighting plan', 'Two revisions']], ['Turnkey', 1890, 1590, 'We design, build and style it all.', ['Everything in Design', 'Project management', 'Furniture sourcing', 'Final styling day']]],
        faq: [['Do you work outside Dhaka?', 'Yes, in Chattogram and Sylhet. Travel is billed at cost.'], ['Can I keep some of my furniture?', 'Almost always. We design around the pieces you love.'], ['How long does a room take?', 'Four to eight weeks, depending on custom joinery.'], ['Do you do offices?', 'Small ones, up to 40 desks, and cafés and shops.'], ['How do payments work?', 'Thirty percent to start, the rest in three milestones.']],
        ctaT: 'Let us walk through your space', ctaS: 'A two-hour consultation, a plan and a shopping list. Yours to keep.', footLine: 'Scandinavian bones, Bengali warmth.',
        prod: { name: 'Hem lounge chair', desc: 'Solid mango wood frame, wool bouclé seat and a back angle tuned over 30 prototypes.', price: '$640', was: '$720', img: 1 },
        proj: [['Dhanmondi apartment', 'Homes'], ['Lamplight study', 'Homes'], ['Ghor Café', 'Cafés'], ['Banani studio', 'Offices'], ['Quiet bedroom', 'Homes'], ['Corner café', 'Cafés'], ['Leather library', 'Homes'], ['Stool series', 'Furniture']],
        projH: 'Selected rooms', projSub: 'Homes, cafés and small offices, photographed on handover day.'
      }
    },
    {
      id: 'thread', name: 'Thread & Co', kind: 'Menswear label', brand: 'Thread & Co', tag: 'Clothes you will wear for ten years',
      img: imgs('thread', ['hero', 'coat', 'blazer', 'oxford', 'navyknit', 'denim', 'brogue', 'cardigan']),
      look: { p: '#1f2a44', a: '#c4321d', tone: 'warm', mode: 'light', font: 'editorial', r: 4, space: 1.1, shadow: .2, bw: 1, btn: { style: 'solid', shape: 'square', size: 'md', hover: 'shine' }, fx: { anim: 'fade', card: 'lift', bg: 'noise', head: 'plain', nav: 'glass' } },
      layout: { hero: 1, features: 2, testimonials: 2, cta: 1, footer: 0, nav: 2 },
      c: {
        links: ['New in', 'Tailoring', 'Knitwear', 'Journal'], eb: 'Autumn / Winter 26 is live', sub: 'Tailoring, knitwear and shirting cut in Narayanganj from mills we have visited. Fewer, better pieces with free repairs for life.',
        cta1: 'Shop the collection', cta2: 'Find your size', proof: 'Rated 4.8 by 9,000+ customers',
        heroStats: [['Free', 'Repairs for life'], ['30 day', 'Easy returns'], ['3', 'Mills we visit']],
        logosH: 'Written up in', logos: [['GQ', 800, 0], ['Esquire', 600, 1], ['Monocle', 700, 0], ['Permanent Style', 500, 1], ['Hypebeast', 800, 0], ['Mr Porter', 600, 0]],
        featH: 'Built properly, priced honestly', featSub: 'What goes into every piece, and what we leave out.',
        feat: [['layers', 'Mill-sourced cloth', 'Wool from Biella, cotton from Egypt, woven for us in small runs.'], ['users', 'Cut by hand', 'Twelve tailors in Narayanganj, paid well and credited on every label.'], ['shield', 'Free repairs for life', 'Send it back with a split seam or a lost button and we fix it.'], ['search', 'A fit finder that works', 'Tell us two things that fit you now. We suggest the size.'], ['globe', 'Carbon-neutral shipping', 'Every parcel offset, packaging you can compost.'], ['chart', 'Open pricing', 'We show the cost of cloth, labour and margin on every item.']],
        stats: [['9,000+', 'Customers'], ['4.8/5', 'Average rating'], ['2%', 'Return rate'], ['12', 'Tailors credited']],
        quoteH: 'Customers who kept coming back',
        quotes: [['The overcoat is the best thing I own. Two winters in and it still looks new.', 'Arif Hasan', 'Overcoat, charcoal'], ['The fit finder nailed my size first time. That never happens online.', 'Jubayer Alam', 'Oxford shirt'], ['They repaired a pocket I tore climbing a fence. Free, in four days.', 'Rafiq Uddin', 'Selvedge denim']],
        priceH: 'The Thread Club', priceSub: 'Membership for people who would rather buy less and better.', per: '/year',
        plans: [['Free', 0, 0, 'Everyone starts here.', ['Free repairs for life', 'Early sale access', 'Birthday gift']], ['Club', 29, 24, 'For regulars.', ['Everything in Free', 'Free express shipping', 'Alterations included', '10% off every order']], ['Tailor', 99, 79, 'For the wardrobe builders.', ['Everything in Club', 'One made-to-measure piece', 'Personal stylist', 'Private fitting nights']]],
        faq: [['How does the fit finder work?', 'Tell us the size of two things that fit you well. We compare the measurements and suggest a size.'], ['What if it does not fit?', 'Returns are free for 30 days, or we alter it for you at no cost.'], ['Where is it made?', 'In our Narayanganj workshop, from cloth woven in Italy, Egypt and Japan.'], ['Do you ship abroad?', 'Yes, to 32 countries, carbon-neutral.'], ['Can I pay with bKash?', 'Yes, as well as cards, Nagad and cash on delivery in Dhaka.']],
        ctaT: 'Ten years of wear, or we fix it', ctaS: 'Join the Club for free repairs, early access and a birthday gift.', footLine: 'Fewer, better clothes. Mended forever.',
        prod: { name: 'Charcoal overcoat', desc: 'Double-faced Italian wool, half-canvassed and fully lined. Cut long, made to last a decade.', price: '$289', was: '$340', img: 1 },
        proj: [['AW26 lookbook', 'Lookbook'], ['The overcoat', 'Outerwear'], ['Navy blazer', 'Tailoring'], ['Oxford shirts', 'Shirting'], ['Navy knit', 'Knitwear'], ['Selvedge denim', 'Denim'], ['Brogues', 'Shoes'], ['Cardigans', 'Knitwear']],
        projH: 'The collection', projSub: 'Autumn / Winter 26, shot on the streets of Old Dhaka.'
      }
    },
    {
      id: 'glow', name: 'Glow Theory', kind: 'Beauty & skincare', brand: 'Glow Theory', tag: 'Skin first. Make-up second.',
      img: imgs('glow', ['hero', 'serum', 'palette', 'lipstick', 'blush', 'perfume', 'trio', 'base']),
      look: { p: '#d6456f', a: '#f4a261', tone: 'warm', mode: 'light', font: 'friendly', r: 24, space: 1, shadow: .6, bw: 0, btn: { style: 'gradient', shape: 'pill', size: 'lg', hover: 'glow' }, fx: { anim: 'zoom', card: 'tilt', bg: 'mesh', head: 'gradient', nav: 'glass' } },
      layout: { hero: 1, features: 2, testimonials: 2, cta: 0, footer: 0, nav: 2 },
      c: {
        links: ['Skincare', 'Make-up', 'Shade finder', 'Routines'], eb: 'New: the Dew serum', sub: 'Clinically tested skincare and make-up made for humid weather and every shade of brown. Vegan, cruelty-free and refillable.',
        cta1: 'Find your shade', cta2: 'Take the skin quiz', proof: '1.2M bottles refilled',
        heroStats: [['42', 'Foundation shades'], ['0', 'Animal testing'], ['Refill', 'Every bottle']],
        logosH: 'Loved by editors at', logos: [['Allure', 700, 1], ['Glamour', 700, 0], ['Byrdie', 600, 1], ['Cosmopolitan', 700, 0], ['Refinery29', 600, 0], ['Nykaa', 800, 0]],
        featH: 'Beauty that works in 34°C', featSub: 'Formulas tested on real skin, in real humidity.',
        feat: [['spark', '42 true shades', 'Built on 3,000 skin scans from Dhaka to Delhi, not on a guess.'], ['shield', 'Dermatologist tested', 'Every formula tested on sensitive skin for 28 days.'], ['bolt', 'Sweat-proof wear', 'Twelve hours in monsoon weather without a touch-up.'], ['globe', 'Refillable everything', 'Bring the bottle back, pay 30% less and skip the plastic.'], ['users', 'Free shade matching', 'Upload a selfie or visit a counter. We match you in minutes.'], ['layers', 'Routines, not products', 'Three steps, morning and night. We tell you which three.']],
        stats: [['1.2M', 'Bottles refilled'], ['42', 'Shades'], ['4.8/5', 'From 30k reviews'], ['28 days', 'Skin testing']],
        quoteH: 'Real skin, real results',
        quotes: [['First foundation that matches me without turning grey by lunch.', 'Tasnia Rahman', 'Shade 32 Warm'], ['The Dew serum fixed the dry patches my winter routine never touched.', 'Mehjabin Chowdhury', 'Dew serum'], ['I refill everything now. Same product, less guilt, lower price.', 'Anika Sultana', 'Member since 2023']],
        priceH: 'Glow Club', priceSub: 'A monthly routine box, matched to your skin.', per: '/month',
        plans: [['Try', 0, 0, 'Samples before you commit.', ['Three deluxe samples', 'Free shade match', 'Skin quiz results']], ['Routine', 29, 24, 'Your full routine, every month.', ['Cleanser, serum, SPF', 'Free refills', 'Skin check-ins', 'Member prices']], ['Pro', 59, 47, 'For make-up lovers.', ['Everything in Routine', 'Two make-up picks', 'Artist video calls', 'Early launches']]],
        faq: [['How does the shade finder work?', 'Upload a selfie in daylight. We compare it with 3,000 skin scans and suggest two shades.'], ['Is everything vegan?', 'Yes, and nothing is ever tested on animals.'], ['How do refills work?', 'Bring or post the empty bottle back and the refill costs 30% less.'], ['Is it safe for sensitive skin?', 'Every formula is tested for 28 days on sensitive skin first.'], ['Can I return an opened product?', 'Yes, within 30 days if it does not suit you.']],
        ctaT: 'Match your shade in two minutes', ctaS: 'Upload a selfie and we suggest your two closest shades, free.', footLine: 'Skin first. Make-up second.',
        prod: { name: 'Dew serum', desc: 'Niacinamide, ceramides and snow mushroom for plump, calm skin in humid weather. 30 ml, refillable.', price: '$32', was: '$38', img: 1 },
        proj: [['Dew campaign', 'Skincare'], ['The serum', 'Skincare'], ['Sunset palette', 'Make-up'], ['Lip library', 'Make-up'], ['Blush edit', 'Make-up'], ['Signature scent', 'Fragrance'], ['Routine trio', 'Skincare'], ['42 shades', 'Make-up']],
        projH: 'Campaigns', projSub: 'Shot on real skin, never retouched.'
      }
    },
    {
      id: 'sobuj', name: 'Sobuj', kind: 'Plant shop & studio', brand: 'Sobuj', tag: 'Plants that survive your life',
      img: imgs('sobuj', ['fern-xl', 'bonsai', 'orchid', 'succulents', 'hanging', 'aloe', 'cactus', 'tulips']),
      look: { p: '#1f6b3a', a: '#d4a017', tone: 'mint', mode: 'light', font: 'classic', r: 16, space: 1.1, shadow: .4, bw: 1, btn: { style: 'solid', shape: 'pill', size: 'md', hover: 'lift' }, fx: { anim: 'fade', card: 'lift', bg: 'dots', head: 'plain', nav: 'static' } },
      layout: { hero: 1, features: 0, testimonials: 0, cta: 0, footer: 0, nav: 0 },
      c: {
        links: ['Shop plants', 'Workshops', 'Plant doctor', 'Gifts'], eb: 'Free delivery in Dhaka this week', sub: 'Healthy, nursery-grown plants matched to your light, your balcony and how often you actually remember to water.',
        cta1: 'Find my plant', cta2: 'Book a workshop', proof: '38,000 plants still alive and counting',
        heroStats: [['38k', 'Plants rehomed'], ['60 day', 'Plant guarantee'], ['Free', 'Plant doctor chats']],
        logosH: 'Grown with', logos: [['Savar Nursery', 700, 0], ['Green Savers', 600, 1], ['Bagan Bilas', 700, 0], ['Rooftop BD', 800, 0], ['Leaf & Co', 500, 1], ['Mati Pots', 700, 0]],
        featH: 'The right plant for your real life', featSub: 'We do the matching. You do the enjoying.',
        feat: [['sliders', 'Light matching', 'Tell us your window direction and we only show plants that will thrive there.'], ['shield', '60-day guarantee', 'If it dies in two months, we replace it. No questions.'], ['phone', 'Plant doctor', 'Send a photo of a sad leaf and a botanist replies within the hour.'], ['bell', 'Watering reminders', 'A gentle SMS when it is time, tuned to each plant.'], ['home', 'Pots from local potters', 'Terracotta from Bogura, glazed by hand.'], ['users', 'Weekend workshops', 'Kokedama, terrariums and balcony gardens, tea included.']],
        stats: [['38k', 'Plants rehomed'], ['96%', 'Still alive after a year'], ['1 hr', 'Plant doctor replies'], ['4.9/5', 'Customer rating']],
        quoteH: 'Balconies we have turned green',
        quotes: [['I have killed every plant I ever owned. The fern from Sobuj is eight months old.', 'Sabrina Haque', 'Boston fern'], ['The plant doctor saved my orchid with one photo and one sentence.', 'Nafis Ahmed', 'Orchid owner'], ['The kokedama workshop was the best Saturday I have had this year.', 'Lamia Karim', 'Workshop guest']],
        priceH: 'Plant subscriptions', priceSub: 'A new plant every month, matched to your light and your skill.', per: '/month',
        plans: [['Seedling', 0, 0, 'Plant doctor and reminders.', ['Plant doctor chats', 'Watering reminders', 'Care guides']], ['Grower', 15, 12, 'One new plant a month.', ['A matched plant monthly', 'Free delivery', 'Pot upgrades', '60-day guarantee']], ['Jungle', 39, 31, 'Turn a room into a garden.', ['Three plants monthly', 'Seasonal repotting', 'A workshop each quarter', 'Balcony design call']]],
        faq: [['What if my plant dies?', 'Within 60 days we replace it for free. Just send a photo.'], ['Do you deliver outside Dhaka?', 'Yes, to Chattogram and Sylhet in climate-safe boxes.'], ['How do I know what will survive?', 'Tell us your window direction and light hours. We only show plants that fit.'], ['Are the pots included?', 'Every plant comes in a nursery pot; terracotta is an optional upgrade.'], ['Can I gift a plant?', 'Yes, with a handwritten card and a care guide for the lucky person.']],
        ctaT: 'Tell us about your window', ctaS: 'Three quick questions and we show you the plants that will actually thrive there.', footLine: 'Plants that survive your life.',
        prod: { name: 'Fiddle bonsai', desc: 'A 12-year-old ficus bonsai, trained in Savar, in a hand-glazed Bogura pot. Loves bright indirect light.', price: '$48', was: '$56', img: 1 },
        proj: [['Rooftop jungle', 'Balconies'], ['Bonsai corner', 'Indoor'], ['Orchid shelf', 'Indoor'], ['Succulent table', 'Offices'], ['Hanging garden', 'Balconies'], ['Aloe wall', 'Offices'], ['Cactus desk', 'Offices'], ['Spring tulips', 'Gifts']],
        projH: 'Green spaces', projSub: 'Balconies, offices and living rooms we have planted.'
      }
    },
    {
      id: 'halide', name: 'Halide', kind: 'Film camera store & lab', brand: 'Halide', tag: 'Film is not dead. It was just waiting.',
      img: imgs('halide', ['x100-xl', 'f2', 'tlr', 'onestep', 'rx', 'instamatic', 'tele', 'press']),
      look: { p: '#e8b04b', a: '#e25b3c', tone: 'neutral', mode: 'dark', font: 'grotesk', r: 6, space: 1, shadow: .4, bw: 1, btn: { style: 'solid', shape: 'rounded', size: 'md', hover: 'glow' }, fx: { anim: 'slide', card: 'glow', bg: 'noise', head: 'caps', nav: 'glass' } },
      layout: { hero: 2, features: 2, testimonials: 1, cta: 0, footer: 2, nav: 0 },
      c: {
        links: ['Cameras', 'Film', 'Lab', 'Workshops'], eb: 'Lab turnaround: 3 days', sub: 'Tested vintage cameras, fresh film and a real darkroom in Old Dhaka. Every camera is cleaned, fixed and shot with before it reaches you.',
        cta1: 'Shop cameras', cta2: 'Send film to the lab', proof: '11,000 rolls developed this year',
        heroStats: [['11k', 'Rolls developed'], ['6 mo', 'Camera warranty'], ['3 day', 'Lab turnaround']],
        logosH: 'Our film comes from', logos: [['Kodak', 800, 0], ['Ilford', 700, 0], ['Fujifilm', 700, 1], ['Lomography', 600, 1], ['CineStill', 700, 0], ['Foma', 600, 0]],
        featH: 'Every camera shot before it ships', featSub: 'We test so you do not waste your first roll.',
        feat: [['eye', 'Tested with film', 'Every camera shoots a full roll before it is listed. You see the scans.'], ['shield', '6-month warranty', 'If a shutter sticks or a meter dies, we fix it.'], ['layers', 'Real darkroom', 'C-41, black and white and E-6 developed by hand.'], ['bolt', 'Scans in 3 days', 'High-res scans in your inbox, negatives posted back.'], ['users', 'Weekend classes', 'Loading film, metering and developing your own roll.'], ['globe', 'Film sent anywhere', 'Fresh, cold-stored stock shipped across Bangladesh.']],
        stats: [['11k', 'Rolls developed'], ['640', 'Cameras restored'], ['3 days', 'Lab turnaround'], ['4.9/5', 'Customer rating']],
        quoteH: 'Rolls that came back better than expected',
        quotes: [['My first roll through the Halide TLR looked like a dream. The test scans were not lying.', 'Shafin Rahman', 'Yashica TLR'], ['The lab scans are sharper than the big labs in Singapore I used to post to.', 'Priya Das', 'Lab regular'], ['They fixed the meter on my dad’s old camera for less than a roll of film.', 'Asif Mahmud', 'Repair customer']],
        priceH: 'Lab plans', priceSub: 'Develop and scan every roll you shoot, for a flat monthly price.', per: '/month',
        plans: [['Pay per roll', 0, 0, 'For the occasional shooter.', ['Develop + scan: $9 a roll', 'Standard scans', 'Negatives posted back']], ['Shooter', 25, 20, 'Three rolls a month.', ['Three rolls included', 'High-res scans', 'Free return post', '10% off film']], ['Pro', 59, 47, 'For people who shoot every week.', ['Eight rolls included', 'TIFF scans', 'Push and pull free', 'Priority 24h lane']]],
        faq: [['Are the cameras really tested?', 'Yes. Every camera shoots a roll and you can see the scans on its page.'], ['What film do you develop?', 'Colour negative, black and white and slide film, in 35mm and 120.'], ['How do I send film?', 'Drop it off in Old Dhaka or post it in the free mailer we send you.'], ['What if my camera breaks?', 'Everything has a six-month warranty. We repair it or refund you.'], ['Do you buy cameras?', 'Yes. Bring it in and we will test it and make an offer on the spot.']],
        ctaT: 'Your first roll is on us', ctaS: 'Buy any camera this month and we develop and scan the first roll free.', footLine: 'Film is not dead. It was just waiting.',
        prod: { name: 'Fuji X100 kit', desc: 'A tested rangefinder-style camera with a fixed 23mm lens, two batteries and the test-roll scans.', price: '$820', was: '$899', img: 0 },
        proj: [['X100 street set', 'Digital'], ['F2 in Sadarghat', '35mm'], ['TLR portraits', '120'], ['Instant weekend', 'Instant'], ['RX in the rain', '35mm'], ['Instamatic diary', '35mm'], ['Tele compression', 'Digital'], ['Press camera', '120']],
        projH: 'From the lab', projSub: 'Rolls our customers shot, developed in our darkroom.'
      }
    },
    {
      id: 'kage', name: 'Kage Tech', kind: 'PC & gadget store', brand: 'Kage Tech', tag: 'Build the machine you actually need',
      img: imgs('kage', ['ultrawide-xl', 'laptop', 'keyboard', 'tower', 'monitor', 'mouse', 'tablet', 'ram']),
      look: { p: '#7c5cff', a: '#22d3ee', tone: 'neutral', mode: 'dark', font: 'tech', r: 10, space: 1, shadow: .6, bw: 1, btn: { style: 'neon', shape: 'rounded', size: 'md', hover: 'glow' }, fx: { anim: 'zoom', card: 'glow', bg: 'grid', head: 'gradient', nav: 'glass' } },
      layout: { hero: 1, features: 2, testimonials: 0, cta: 0, footer: 0, nav: 0 },
      c: {
        links: ['PC builder', 'Laptops', 'Monitors', 'Accessories'], eb: 'RTX 50 series in stock', sub: 'Custom PCs assembled and stress-tested in Dhaka, plus laptops, monitors and parts with a real warranty and same-day delivery.',
        cta1: 'Build my PC', cta2: 'Compare laptops', proof: '24,000 machines built and shipped',
        heroStats: [['48 h', 'Stress test'], ['3 yr', 'Build warranty'], ['Same day', 'Dhaka delivery']],
        logosH: 'Official partner of', logos: [['NVIDIA', 800, 0], ['AMD', 800, 0], ['ASUS', 700, 0], ['Corsair', 700, 1], ['Samsung', 700, 0], ['Logitech', 600, 0]],
        featH: 'A PC shop run by people who game', featSub: 'No upsells, no bottlenecks, no mystery power supplies.',
        feat: [['sliders', 'Bottleneck checker', 'Pick parts and see the real FPS for the games you play.'], ['bolt', '48-hour stress test', 'Every build runs benchmarks for two days before it ships.'], ['shield', '3-year warranty', 'Parts and labour, with a loaner PC while we fix yours.'], ['code', 'Clean installs', 'Windows or Linux, drivers set, zero bloatware.'], ['chart', 'Honest prices', 'Live price history on every part so you know when to buy.'], ['users', 'Real humans', 'Chat with a technician, not a bot, until 2 AM.']],
        stats: [['24k', 'Machines built'], ['0.8%', 'Return rate'], ['48 h', 'Stress test'], ['4.8/5', 'Customer rating']],
        quoteH: 'Builders who came back for the second one',
        quotes: [['The FPS estimate was within 5 frames of what I got. That tool alone is worth it.', 'Tanvir Hossain', 'RTX 5070 build'], ['Cable management so clean I took the side panel off to show friends.', 'Mahir Faisal', 'Custom tower'], ['A loaner PC while mine was in repair. Nobody else does that.', 'Rakib Hasan', 'Warranty claim']],
        priceH: 'Care plans', priceSub: 'Keep your machine fast for years.', per: '/year',
        plans: [['Standard', 0, 0, 'Included with every build.', ['3-year warranty', 'Free driver checks', 'Chat support']], ['Plus', 39, 31, 'For people who game every day.', ['Everything in Standard', 'Yearly deep clean', 'Thermal paste refresh', 'Loaner PC']], ['Pro', 99, 79, 'For creators and streamers.', ['Everything in Plus', 'Upgrade trade-ins', 'On-site repairs', 'Priority 24h lane']]],
        faq: [['How accurate is the FPS estimate?', 'Within about 10% for the 60 games we benchmark ourselves.'], ['Can I bring my own parts?', 'Yes. We charge a flat build fee and still stress-test everything.'], ['Do you ship outside Dhaka?', 'Yes, in custom foam crates, insured, to every district.'], ['What if a part fails?', 'We swap it within the warranty and lend you a PC meanwhile.'], ['Can I pay in instalments?', 'Yes, 0% EMI for 3 to 12 months on major cards.']],
        ctaT: 'Your build, benchmarked before you pay', ctaS: 'Pick your games and budget. We suggest three builds with real FPS numbers.', footLine: 'Build the machine you actually need.',
        prod: { name: 'Kage 34" ultrawide', desc: 'A 165 Hz curved QD-OLED panel with 0.03 ms response, KVM switch and a 90 W USB-C port.', price: '$749', was: '$829', img: 0 },
        proj: [['Ultrawide battlestation', 'Setups'], ['Creator laptop', 'Laptops'], ['Low-profile keyboard', 'Accessories'], ['White tower build', 'Builds'], ['Dual monitor desk', 'Setups'], ['Esports mouse', 'Accessories'], ['Drawing tablet', 'Accessories'], ['64 GB kit', 'Parts']],
        projH: 'Customer setups', projSub: 'Builds and desks from the Kage community.'
      }
    },
    {
      id: 'deshi', name: 'Deshi Loom', kind: 'Handloom & heritage wear', brand: 'Deshi Loom', tag: 'Woven by hand. Worn with pride.',
      img: imgs('deshi', ['hero', 'saree', 'panjabi', 'bandhani', 'jutti', 'gold', 'paisley', 'runner']),
      look: { p: '#8c1c2b', a: '#d4a017', tone: 'warm', mode: 'light', font: 'classic', r: 8, space: 1.1, shadow: .3, bw: 1, btn: { style: 'solid', shape: 'rounded', size: 'md', hover: 'shine' }, fx: { anim: 'fade', card: 'lift', bg: 'noise', head: 'underline', nav: 'static' } },
      layout: { hero: 1, features: 0, testimonials: 1, cta: 0, footer: 0, nav: 4 },
      c: {
        links: ['Sarees', 'Panjabi', 'Weavers', 'Our story'], eb: 'Eid collection: 40 new weaves', sub: 'Jamdani, muslin and Tangail sarees woven by 120 families across Bangladesh. You see the weaver, the village and the days it took.',
        cta1: 'Shop the Eid edit', cta2: 'Meet the weavers', proof: '120 weaving families paid fairly',
        heroStats: [['120', 'Weaving families'], ['6 wks', 'Per jamdani'], ['100%', 'Handwoven']],
        logosH: 'Supported by', logos: [['Aarong', 700, 0], ['Bengal Foundation', 600, 1], ['BSCIC', 700, 0], ['Crafts Council', 600, 0], ['UNESCO', 800, 0], ['Jatra', 700, 1]],
        featH: 'Every thread has a name behind it', featSub: 'Heritage craft, sold with the respect it deserves.',
        feat: [['users', 'Meet the weaver', 'Each piece is tagged with the weaver’s name, village and a photo.'], ['clock', 'Slow on purpose', 'A jamdani can take six weeks on the loom. We never rush it.'], ['chart', 'Fair pay, published', 'Weavers earn 60% of the price, and we publish the numbers.'], ['layers', 'Natural dyes', 'Indigo, turmeric and madder, fixed by hand.'], ['globe', 'Worldwide shipping', 'Wrapped in muslin and shipped to 30 countries.'], ['spark', 'Heirloom care', 'Free re-starching and repairs for every saree.']],
        stats: [['120', 'Weaving families'], ['60%', 'Of the price to weavers'], ['8,000+', 'Sarees woven'], ['4.9/5', 'Customer rating']],
        quoteH: 'Worn on the days that mattered',
        quotes: [['I wore my mother’s jamdani to my wedding and a Deshi Loom one to my daughter’s.', 'Shirin Akter', 'Jamdani saree'], ['Knowing the weaver’s name makes it feel like a gift from a person, not a shop.', 'Farzana Yasmin', 'Tangail saree'], ['My panjabi got more compliments at Eid than anything I have bought abroad.', 'Kamrul Hasan', 'Silk panjabi']],
        priceH: 'Weaver patron', priceSub: 'Support a weaving family directly, every month.', per: '/month',
        plans: [['Friend', 0, 0, 'Stay close to the looms.', ['Weaver stories', 'Early Eid access', 'Care guides']], ['Patron', 20, 16, 'Sponsor a loom.', ['Everything in Friend', 'A scarf every season', 'Weaver video calls', '10% off sarees']], ['Guardian', 60, 48, 'Keep a family weaving.', ['Everything in Patron', 'A saree each year', 'Village visit invite', 'Your name on the loom']]],
        faq: [['Is it really handwoven?', 'Yes. Every piece is woven on a hand loom and tagged with the weaver’s name.'], ['How long does custom weaving take?', 'Six to ten weeks, depending on the motif and the thread count.'], ['How do I care for a jamdani?', 'Dry clean or gentle hand wash, and we re-starch it for free.'], ['Do you ship abroad?', 'Yes, to 30 countries, wrapped in muslin.'], ['Can I visit the weavers?', 'Guardians are invited on a village visit every winter.']],
        ctaT: 'Meet the hands behind your saree', ctaS: 'Every piece comes with the weaver’s name, village and story.', footLine: 'Woven by hand. Worn with pride.',
        prod: { name: 'Dhakai jamdani', desc: 'Pure cotton jamdani with a hand-woven paisley border, six weeks on the loom in Rupganj.', price: '$180', was: '$210', img: 1 },
        proj: [['Eid campaign', 'Campaign'], ['Jamdani', 'Sarees'], ['Silk panjabi', 'Panjabi'], ['Bandhani dye', 'Sarees'], ['Nakshi jutti', 'Footwear'], ['Gold zari', 'Sarees'], ['Paisley border', 'Sarees'], ['Table runner', 'Home']],
        projH: 'The Eid edit', projSub: 'Forty new weaves from eleven villages.'
      }
    },
    {
      id: 'fieldday', name: 'Field Day', kind: 'Sports & outdoor club', brand: 'Field Day', tag: 'Get outside. Bring friends.',
      img: imgs('fieldday', ['road-xl', 'tent', 'football', 'basketball', 'tennis', 'cruiser', 'gloves', 'rope']),
      look: { p: '#facc15', a: '#111111', tone: 'warm', mode: 'light', font: 'bold', r: 4, space: 1, shadow: 0, bw: 2, btn: { style: 'brutal', shape: 'square', size: 'lg', hover: 'lift' }, fx: { anim: 'zoom', card: 'lift', bg: 'dots', head: 'caps', nav: 'static' } },
      layout: { hero: 3, features: 2, testimonials: 2, cta: 0, footer: 2, nav: 0 },
      c: {
        links: ['Events', 'Gear', 'Clubs', 'Rentals'], eb: 'Saturday: 10k river run', sub: 'Weekly runs, rides, football and camping trips across Bangladesh, plus gear you can buy or rent for the weekend.',
        cta1: 'Join an event', cta2: 'Rent gear', proof: '18,000 members out every weekend',
        heroStats: [['18k', 'Members'], ['40+', 'Events a month'], ['Rent', 'Any gear']],
        logosH: 'Partners', logos: [['Decathlon', 800, 0], ['Garmin', 700, 0], ['Strava', 700, 1], ['Bata Sports', 800, 0], ['Red Bull', 700, 1], ['Nike Run', 700, 0]],
        featH: 'Everything you need to get outside', featSub: 'Events, gear and people. You just show up.',
        feat: [['clock', 'Events every week', 'Runs, rides, football, climbing and camping for every level.'], ['layers', 'Rent the gear', 'Tents, bikes and boots for the weekend, delivered to your door.'], ['users', 'Clubs near you', '52 clubs in 9 cities, each with its own captain.'], ['chart', 'Track your progress', 'Sync Strava or Garmin and climb the club leaderboard.'], ['shield', 'Safety first', 'First aiders and a support van on every long event.'], ['spark', 'Beginners welcome', 'Couch to 5k and first-camp programs every month.']],
        stats: [['18k', 'Members'], ['52', 'Clubs in 9 cities'], ['40+', 'Events a month'], ['3,100', 'Gear rentals a month']],
        quoteH: 'Weekends that turned into habits',
        quotes: [['I joined for one fun run. Two years later I captain the Mirpur club.', 'Sumaiya Tasnim', 'Club captain'], ['Renting a tent for Bandarban cost less than a dinner out.', 'Riyad Chowdhury', 'Camping trip'], ['My first 10k, with 300 people cheering. I still have the medal on my desk.', 'Nabila Islam', 'River run']],
        priceH: 'Membership', priceSub: 'Every event, every club, discounted gear.', per: '/month',
        plans: [['Day pass', 0, 0, 'Try one event free.', ['One free event', 'Community chat', 'Event photos']], ['Member', 9, 7, 'For regulars.', ['Unlimited events', '20% off rentals', 'Club leaderboard', 'Member kit']], ['Team', 49, 39, 'For companies and squads.', ['Up to 10 members', 'Private events', 'Branded jerseys', 'Team challenges']]],
        faq: [['I am a complete beginner. Can I join?', 'Yes. Every event has a beginner group and a pacer at the back.'], ['What if it rains?', 'Most events run in light rain. We message you by 6 AM if anything changes.'], ['How does gear rental work?', 'Book online, we deliver on Friday and pick up on Monday.'], ['Is there a support vehicle?', 'On every ride and run longer than 10k, with first aiders.'], ['Can my company join?', 'Yes, the Team plan covers ten people and private events.']],
        ctaT: 'Your first event is free', ctaS: 'Pick a run, ride or match this weekend and bring a friend.', footLine: 'Get outside. Bring friends.',
        prod: { name: 'Weekend tent kit', desc: 'A two-person tent, two sleeping mats and a stove, delivered Friday and collected Monday.', price: '$24', was: '$30', img: 1 },
        proj: [['River 10k', 'Runs'], ['Bandarban camp', 'Camping'], ['Friday football', 'Football'], ['Court nights', 'Basketball'], ['Tennis ladder', 'Tennis'], ['Cruiser ride', 'Rides'], ['Boxing class', 'Training'], ['Rope climb', 'Training']],
        projH: 'Recent events', projSub: 'Photos from the last month of weekends.'
      }
    },
    {
      id: 'pebble', name: 'Pebble', kind: 'Kids & baby boutique', brand: 'Pebble', tag: 'Soft things for small people',
      img: imgs('pebble', ['hero', 'romper', 'dress', 'sleepsuit', 'mittens', 'shoes', 'lilac', 'mint']),
      look: { p: '#e07a5f', a: '#81b29a', tone: 'mint', mode: 'light', font: 'friendly', r: 26, space: 1, shadow: .5, bw: 0, btn: { style: '3d', shape: 'pill', size: 'lg', hover: 'press' }, fx: { anim: 'zoom', card: 'tilt', bg: 'dots', head: 'plain', nav: 'static' } },
      layout: { hero: 1, features: 0, testimonials: 0, cta: 0, footer: 0, nav: 2 },
      c: {
        links: ['Baby', 'Toddler', 'Gifts', 'Size guide'], eb: 'New: organic sleepsuits', sub: 'Organic cotton clothes for newborns to five-year-olds, with no scratchy labels, no harsh dyes and room to grow.',
        cta1: 'Shop baby', cta2: 'Build a gift box', proof: '50,000 happy (and napping) babies',
        heroStats: [['GOTS', 'Organic cotton'], ['0', 'Scratchy labels'], ['Grow', 'Fold-over cuffs']],
        logosH: 'Recommended by', logos: [['Mother & Baby', 700, 1], ['Parents', 800, 0], ['Babyzone', 700, 0], ['Shishu', 600, 1], ['Mumsnet', 700, 0], ['Kidspot', 800, 0]],
        featH: 'Made for skin that is one week old', featSub: 'Everything we leave out matters as much as what we put in.',
        feat: [['shield', 'Certified organic', 'GOTS cotton with plant-based dyes and zero harsh chemicals.'], ['spark', 'No labels, ever', 'Sizes are printed inside, so nothing scratches.'], ['layers', 'Grows with them', 'Fold-over cuffs and feet add three extra months of wear.'], ['bolt', 'Easy changes', 'Two-way zips and snaps for 3 AM nappy changes.'], ['home', 'Pass it on', 'Send outgrown clothes back for credit. We re-home them.'], ['users', 'Real parent reviews', 'Every size and fit rated by parents, not models.']],
        stats: [['50k', 'Happy babies'], ['0', 'Harsh chemicals'], ['3 mo', 'Extra wear per piece'], ['4.9/5', 'Parent rating']],
        quoteH: 'Parents who stopped buying anywhere else',
        quotes: [['The only sleepsuit my son does not scratch at. We own six now.', 'Tahmina Begum', 'Mother of Ayaan'], ['Two-way zips at 3 AM. Whoever designed that has had a baby.', 'Sajid Rahman', 'Father of twins'], ['We sent back a bag of outgrown clothes and got credit for the next size. Genius.', 'Nadia Hossain', 'Mother of two']],
        priceH: 'Grow Box', priceSub: 'The next size, delivered just before they need it.', per: '/quarter',
        plans: [['Starter', 0, 0, 'Try Pebble with a free gift.', ['Free muslin with first order', 'Size reminders', 'Parent guides']], ['Grow Box', 45, 36, 'Five essentials each season.', ['Five pieces every quarter', 'Free delivery', 'Send-back credit', 'Choose colours']], ['Nursery', 99, 79, 'Everything for the first year.', ['Everything in Grow Box', 'Sleep bags + blankets', 'Gift wrapping', 'Swap any size free']]],
        faq: [['What sizes do you make?', 'Newborn to five years, in three-month steps up to age two.'], ['Are the dyes safe?', 'Yes. Plant-based, GOTS-certified and tested for sensitive skin.'], ['How does send-back credit work?', 'Post clean, outgrown Pebble clothes back and get 20% of the price as credit.'], ['Do you do gift boxes?', 'Yes, wrapped with a handwritten card and a muslin square.'], ['What is your return policy?', '60 days, even if it has been washed.']],
        ctaT: 'Build a newborn gift box', ctaS: 'Pick four soft things, add a card and we wrap it by hand.', footLine: 'Soft things for small people.',
        prod: { name: 'Organic sleepsuit', desc: 'GOTS cotton with a two-way zip, fold-over mitts and feet, and no labels at all.', price: '$22', was: '$26', img: 3 },
        proj: [['Spring campaign', 'Campaign'], ['Rompers', 'Baby'], ['Party dress', 'Toddler'], ['Sleepsuits', 'Baby'], ['Mittens', 'Baby'], ['First shoes', 'Toddler'], ['Lilac edit', 'Toddler'], ['Mint basics', 'Baby']],
        projH: 'The spring edit', projSub: 'Shot at home, with real kids and real naps.'
      }
    },
    {
      id: 'stride', name: 'Stride', kind: 'Sneaker drops', brand: 'Stride', tag: 'Limited drops. Fair raffles.',
      img: imgs('stride', ['prism-xl', 'court', 'knit', 'eqt', 'canvas', 'shadow', 'prism']).concat(imgs('carry', ['backpack'])),
      look: { p: '#ff4d2e', a: '#111827', tone: 'neutral', mode: 'light', font: 'bold', r: 12, space: .95, shadow: .5, bw: 1, btn: { style: 'solid', shape: 'pill', size: 'lg', hover: 'lift' }, fx: { anim: 'slide', card: 'tilt', bg: 'grid', head: 'caps', nav: 'glass' } },
      layout: { hero: 2, features: 2, testimonials: 2, cta: 1, footer: 2, nav: 2 },
      c: {
        links: ['Drops', 'Raffles', 'Resell', 'Size guide'], eb: 'Drop #48: Prism Low, Friday 8 PM', sub: 'Limited sneakers released by fair raffle, not by bots. Size-first browsing, authenticated resale and delivery in 24 hours.',
        cta1: 'Enter the raffle', cta2: 'Shop my size', proof: '0 bots won a raffle this year',
        heroStats: [['48', 'Drops so far'], ['0', 'Bot wins'], ['24 h', 'Delivery']],
        logosH: 'Authentic pairs from', logos: [['Nike', 800, 1], ['adidas', 700, 0], ['New Balance', 800, 0], ['ASICS', 800, 0], ['Puma', 800, 1], ['Converse', 700, 0]],
        featH: 'Drops that are actually fair', featSub: 'We built the store we wanted to buy from.',
        feat: [['shield', 'Bot-proof raffles', 'Verified phone, one entry per person, drawn live on stream.'], ['sliders', 'Size-first browsing', 'Set your size once. Everything you see is in stock for you.'], ['eye', 'Authenticated resale', 'Every resale pair is checked by two people before it ships.'], ['bolt', '24-hour delivery', 'Win on Friday, lace up on Saturday.'], ['chart', 'Price history', 'See what every pair has sold for, so you never overpay.'], ['users', 'Collector community', 'Trade, review and show off your rotation.']],
        stats: [['48', 'Drops'], ['210k', 'Raffle entries'], ['0', 'Bot wins'], ['4.8/5', 'Customer rating']],
        quoteH: 'Pairs people actually won',
        quotes: [['First raffle I have ever won. Watching the live draw was half the fun.', 'Adnan Karim', 'Prism Low winner'], ['Size-first browsing means I never fall for a pair that is not in 11.', 'Zarif Ahmed', 'Size 11 regular'], ['Sold my deadstock pair through Stride. Checked, paid and done in two days.', 'Fahim Hasan', 'Reseller']],
        priceH: 'Stride Pass', priceSub: 'Better odds, earlier access and free returns.', per: '/month',
        plans: [['Free', 0, 0, 'Enter every raffle.', ['One entry per drop', 'Size alerts', 'Price history']], ['Pass', 9, 7, 'For regulars.', ['Two entries per drop', 'Early access window', 'Free returns', '5% resale fee']], ['Collector', 29, 23, 'For the rotation builders.', ['Three entries per drop', 'Guaranteed pair yearly', 'Free authentication', '0% resale fee']]],
        faq: [['How do raffles work?', 'Verify your phone, enter once, and winners are drawn live on stream.'], ['Can bots enter?', 'One verified phone, one entry, plus manual review. Zero bots have won this year.'], ['Is resale authentic?', 'Every pair is checked by two authenticators before it ships.'], ['How fast is delivery?', 'Within 24 hours in Dhaka and 48 hours elsewhere.'], ['Can I return a pair?', 'Unworn pairs within 14 days, free for Pass members.']],
        ctaT: 'Drop #48 opens Friday at 8 PM', ctaS: 'Get a text the moment the raffle opens. One entry per person, no bots.', footLine: 'Limited drops. Fair raffles.',
        prod: { name: 'Prism Low', desc: 'A reflective three-layer upper on a cushioned cup sole. Limited to 480 pairs, released by raffle.', price: '$160', was: '$180', img: 0 },
        proj: [['Prism Low', 'Drops'], ['Court Classic', 'Drops'], ['Knit Runner', 'Running'], ['EQT revival', 'Drops'], ['Canvas Hi', 'Lifestyle'], ['Shadow pack', 'Drops'], ['Prism detail', 'Drops'], ['Drop-day bag', 'Accessories']],
        projH: 'Past drops', projSub: 'Every release so far, and how fast it went.'
      }
    }
  ];
})();
