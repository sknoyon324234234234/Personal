# Arise on twos: frame captures

Contact sheets from `tools/arise-frames.js`, one screenshot per 60 fps frame of the
Arise cut on the home page at 1280x720, under a paused fake clock with a seeded
`Math.random`, so the "before" and "after" runs put every knight in the same place.

- `knights-first-wave.jpg`: the two middle knights on the first hit of the drop,
  before (a smooth 650 ms ease) and after (two smear frames, a squash, a hard hold).
- `monarch-rise.jpg`: the Monarch rising on the word, before and after.
- `drop-before.jpg`, `drop-after.jpg`: every frame of the whole drop, all four waves.

Reproduce (needs the `playwright` package with Chromium):

    node tools/arise-frames.js capture /tmp/arise-before cut      # on main
    node tools/arise-frames.js capture /tmp/arise-after cut       # on the branch
    node tools/arise-frames.js sheet knights.jpg --dirs before=/tmp/arise-before,after=/tmp/arise-after \
      --from 6298 --to 6680 --every 2 --crop 380,200,520,520 --thumb 200 --mode rows --t0 6310
