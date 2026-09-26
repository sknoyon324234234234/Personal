# Arise: the command shot, before and after

Contact sheets and key frames for the camera direction of the ARISE command
(a low, slow push-in with speed lines on the word, a black-and-white freeze
under a longer hit-stop on the drop's first hit, a sudden dolly-out on its
second hit, the settle on the last hit).

How they were made: headless Chromium (Playwright's headless shell) under
begin-frame control, so every virtual frame is rendered in full and Web
Animations, requestAnimationFrame and timers advance together, 16.7 ms per
frame. Home page at 1280×720, Chidori first so Arise restores the page,
seeded Math.random, no audio, intro skipped (the same conventions as
tools/arise-frames.js). Times on the frames are milliseconds after Arise is
called: the voice mark lands at 1800, the four hits of the drop at
6310 / 6510 / 6630 / 6750.

- command-shot-a.jpg   the build and the hit: after the word, leaning in, the freeze, the release
- command-shot-b.jpg   the release and the beat grid: the snap out, the last hit, settled, rebuilding
- after-push-in.jpg    the push-in with speed lines converging on the seal (just before the drop)
- after-freeze.jpg     the held black-and-white negative on the first hit
- after-dolly-out.jpg  the dolly-out, one frame into the release
