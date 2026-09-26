# Chidori: the destruction, before and after

Contact sheets and key frames for the Chidori strike and the destruction that
follows it (the hard cut and the impact frames, the cracks racing out, the page
bursting into rubble that falls, tumbles and settles in dust, the scorch, the
ruin).

How they were made: `node tools/chidori-frames.js capture <dir> strike`, then
`sheet`. Headless Chromium (Playwright's headless shell) under begin-frame
control, so every virtual frame is rendered in full and Web Animations (the
page pieces, the camera, the tremor), requestAnimationFrame, the canvas and
timers advance together, 16.7 ms per frame. Home page at 1280×720, seeded
Math.random, no audio, intro skipped (the same conventions as
tools/arise-frames.js). Times on the frames are milliseconds after the strike
mark (3300 ms after Chidori is called, from assets/sfx/marks.json).

- impact.jpg          the strike, every second frame, +0 .. +400 ms, before over after
- break.jpg           the break, every third frame, +417 .. +1400 ms, before over after
- settle.jpg          the rubble settling and the ruin, +1400 .. +5700 ms, before over after
- after-impact-frame.jpg  a held negative impact frame (+50 ms), cracks racing out under the bolt
- after-burst.jpg     the burst, +433 ms: bolts to every edge, the ring, the page pieces leaving
- after-dust.jpg      +683 ms: the dust dome lit by the strike, the scorch, the pieces in flight
- after-settling.jpg  +2000 ms: rubble down, dust hanging, the scorch cooling
- before-break.jpg / before-settling.jpg  the same two moments in the old cut
