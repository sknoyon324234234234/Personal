# Power sound sources

The clips in `assets/sfx/` were cut, layered and loudness-mastered (about -7 to -12 LUFS, peaks at -1 dBTP)
from these Pixabay sound effects. All are under the Pixabay Content License: free for commercial use,
no attribution required; they may not be resold or redistributed as standalone sound files.

| Clip | Made from |
| --- | --- |
| `chidori` | the "thousand birds": [Many Birds Chirping 2](https://pixabay.com/sound-effects/nature-many-birds-chirping-2-30686/) and [Birds Swarm in Bush](https://pixabay.com/sound-effects/nature-birds-swarm-in-bush-67843/) sped up 1.6x, pitched up and made to crackle, over [Static Shock Crackle](https://pixabay.com/sound-effects/film-special-effects-static-shock-crackle-423427/), [Electric Spark Zap](https://pixabay.com/sound-effects/film-special-effects-electric-spark-zap-423424/) and [High Voltage Spark](https://pixabay.com/sound-effects/film-special-effects-high-voltage-spark-486895/) |
| `chidori-hit` | [Lightning Strike](https://pixabay.com/sound-effects/nature-lightning-strike-386161/) + [Glass Shatter](https://pixabay.com/sound-effects/film-special-effects-glass-shatter-291049/) + [Thunder For Anime](https://pixabay.com/sound-effects/film-special-effects-thunder-for-anime-161022/) |
| `kamehameha` | [Anime_charge_03](https://pixabay.com/sound-effects/film-special-effects-anime-charge-03-96230/) + [Energy Charge-Up Full Power](https://pixabay.com/sound-effects/film-special-effects-energy-charge-up-full-power-452848/) |
| `kamehameha-fire` | [Energy Beam Blast (1)](https://pixabay.com/sound-effects/film-special-effects-energy-beam-blast-1-482513/) + [Epic Cinematic Explosion](https://pixabay.com/sound-effects/epic-cinematic-explosion-454857/) |
| `super-saiyan` | [Energy Charge-Up Full Power](https://pixabay.com/sound-effects/film-special-effects-energy-charge-up-full-power-452848/) + [Thunder For Anime](https://pixabay.com/sound-effects/film-special-effects-thunder-for-anime-161022/) |
| `super-saiyan-burst` | [Epic Cinematic Explosion](https://pixabay.com/sound-effects/epic-cinematic-explosion-454857/) |
| `wind` | [Strong Gusting Wind](https://pixabay.com/sound-effects/film-special-effects-strong-gusting-wind-537714/) (seamless 11 s loop) |
| `arise` | [Dark Magic (1)](https://pixabay.com/sound-effects/film-special-effects-dark-magic-1-378650/) + a low boom from [Epic Cinematic Explosion](https://pixabay.com/sound-effects/epic-cinematic-explosion-454857/) |

Supplied by the site owner (not from Pixabay): `chidori` (replaced), `kamehameha-voice`, `arise-voice` and `arise-theme`.
Their timings are in `assets/sfx/marks.json`.

Voice slots: `arise-voice` (a voice saying "Arise", lands on the command) and
`kamehameha-voice` (the full chant; the beam fires about 1.3 s before the clip ends, on the final HAAA).

To replace a clip, drop a new file with the same name into `assets/sfx/`, run `node tools/version-assets.js`, and push.
