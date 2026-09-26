# Super Saiyan: the floor and its stones, before and after

Contact sheets from `tools/ssj-frames.js`: one screenshot per 60 fps frame of the
Super Saiyan power-up on the home page at 1280x720, in headless Chromium under
begin-frame control (virtual time, requestAnimationFrame, timers and Web Animations
step together, 16.7 ms per frame), with a seeded `Math.random`, no audio and the
intro skipped, the same conventions as `tools/arise-frames.js`. Times are milliseconds
after the tap; the burst lands at 1700.

- `power-up.jpg`: the whole power-up, before and after, every 133 ms. Before: the
  ring of embers and the core gradient in the middle of the screen. After: no ring,
  the fire climbs off the floor, the light comes up from below.
- `stones.jpg`: the floor, before and after, every 133 ms. Before: flat dark
  pentagons with a gold stroke, rising from below the screen at random. After: the
  floor cracks and leaks gold, pebbles shiver loose, then rocks, then slabs tear free
  and drift up in the updraft, tumbling, in a far and a near layer, cel-shaded from
  the light below.
- `after-lift.jpg`: the after run, every 67 ms, from the first crack to the burst.
- `after-drop.jpg`: the after run, every 67 ms, from the burst: the cracks heal under
  the flash, the stones are thrown by the shockwave, drop and shatter on the floor.

Reproduce (needs the `playwright` package with Chromium):

    node tools/ssj-frames.js capture /tmp/ssj-before ssj 8097 4     # on main
    node tools/ssj-frames.js capture /tmp/ssj-after ssj 8098 2      # on the branch
    node tools/ssj-frames.js sheet power-up.jpg --dirs before=/tmp/ssj-before,after=/tmp/ssj-after \
      --from 200 --to 1700 --step 133.33 --thumb 470 --cols 4
    node tools/ssj-frames.js sheet stones.jpg --dirs before=/tmp/ssj-before,after=/tmp/ssj-after \
      --from 500 --to 1700 --step 133.33 --crop 200,330,880,390 --thumb 470 --cols 4
