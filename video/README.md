# The video

Two cuts live here, built with [fframes](https://github.com/dmtrKovalenko/fframes) (Rust + SVG, Skia/Metal
backend) and plain ffmpeg.

| | |
|---|---|
| `jejak-vid/` | The Rust composition — scenes, animation, audio map. `cargo run --release -- render` writes the final cut. |
| `raw/` | Poster and reference stills from the capture sessions. |
| `out/` | The finished cuts. |
| `ego/` | The capture scripts (35 of them) — how the captures were recorded. |
| `assets/` | The card templates (`cards.html`, `receipt.html`). |
| `scripts/` | The voiceover text and the TTS script. |
| `assemble.sh` | The ffmpeg cut of the social video (30s, 4:5). |
| `conform.sh` | The conform pass: trims each beat-sheet shot to a padded segment for fframes. |
| `beat-sheet.md` | The shot list, with timings. |

## The pipeline

```
Chrome screencast ──▶ ego/*.mjs ──▶ raw/*.mp4 ──▶ conform.sh ──▶ jejak-vid/assets/seg-*.mp4
                        (capture)      (the cut)    (trim)          (the segments)
                                                                              │
                                                        cargo run --release -- render
                                                                              ▼
                                                                              the video
```

`raw/*.mp4` was the archival form of every capture, and `conform.sh` cut the segments
straight out of those MP4s — so the whole pipeline ran from `raw/` alone. The original
Chrome-screencast JPEG frame sequences (8,791 frames, 1.9 GB) were removed after the cuts
were made, and then the MP4s were removed too, once the final cuts were rendered and
submitted. The capture scripts, the card templates, the fonts and the sound beds are all
tracked, so a new capture can be made and conformed from scratch.

The rendered `seg-*.mp4` segments are build output: `bash conform.sh` rebuilds them from
`raw/*.mp4` in about four minutes.

## What was captured

25 screen captures, taken 18–26 Oct 2026 against the running app.

| capture | seconds | size | original frames |
|---|---|---|---|
| `a01-hero.mp4` | 6.533 | 1.6M | 145 |
| `a02-scroll.mp4` | 4.400 | 1.2M | 14 |
| `a03-identify.mp4` | 4.600 | 436K | 65 |
| `a04-journey.mp4` | 4.833 | 1.4M | 31 |
| `a05-label.mp4` | 4.966 | 956K | 42 |
| `a06-split.mp4` | 8.466 | 1.2M | 173 |
| `a07-receipt.mp4` | 80.20 | 3.8M | 1609 |
| `a08-atlas.mp4` | 5.966 | 1.9M | 89 |
| `a09-describe.mp4` | 4.466 | 720K | 42 |
| `a10-proof.mp4` | 6.933 | 1.1M | 129 |
| `m01-mobile.mp4` | 4.133 | 292K | 90 |
| `v2-ambient.mp4` | 9.666 | 3.3M | 240 |
| `v2-describe.mp4` | 12.66 | 3.8M | 950 |
| `v2-flow-intro.mp4` | 11.60 | 3.7M | 207 |
| `v2-globe.mp4` | 14.56 | 5.0M | 278 |
| `v2-honesty.mp4` | 16.33 | 4.0M | 168 |
| `v2-letter.mp4` | 7.033 | 460K | 165 |
| `v2-letter2.mp4` | 35.36 | 2.5M | 830 |
| `v2-receipt.mp4` | 20.66 | 2.1M | 2370 |
| `v2-split.mp4` | 9.033 | 1.0M | 183 |
| `v2-streak.mp4` | 7.866 | 1.6M | 152 |
| `v2-ticker.mp4` | 14.00 | 2.9M | 348 |
| `v3-explorer.mp4` | 2.533 | 460K | 13 |
| `v3-passport.mp4` | 11.23 | 968K | 206 |
| `v3-stake.mp4` | 12.66 | 3.7M | 251 |

`raw/*.png` are poster and reference stills from the same sessions, and are the only
visual record of the captures that remains.

## What's tracked

The **recipe** is tracked: `ego/*.mjs`, `assets/*.html`, `jejak-vid/media/` (fonts),
`jejak-vid/assets/*.mp3` (sound beds and voiceovers), and the Rust source.

Everything the recipe **produces** is not: `raw/`, `out/`, `audio/`, `cards/`, `frames/`,
`target/`, and the rendered `seg-*.mp4`.
