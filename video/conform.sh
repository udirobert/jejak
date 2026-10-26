#!/usr/bin/env bash
# Conform pass: trim each beat-sheet shot to a padded segment for fframes.
# start_from is scene-time (not a source seek), so every shot gets its own mp4.
set -euo pipefail
cd /Users/udingethe/Dev/jejak/video
RAW=raw; A=jejak-vid/assets
enc() { # $1 src $2 ss $3 t $4 out
  ffmpeg -y -v error -ss "$2" -i "$1" -t "$3" -an -vf "fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=${PAD:-0}" -c:v libx264 -pix_fmt yuv420p -crf 17 -preset medium "$A/$4"
}

# ---- shared segments ----
enc $RAW/v2-globe.mp4       3.2  4.6  seg-globe-spin.mp4     # planet coasting/dragging (G1 open, J11a)
enc $RAW/v2-globe.mp4      10.2  4.0  seg-globe-morph.mp4    # Map toggle -> morph back to ink (G1b, J11b)
enc $RAW/v2-globe.mp4       0.4  6.8  seg-globe-flip.mp4     # ink -> planet morph (alt take, J11)
enc $RAW/v2-flow-intro.mp4  0.3  5.9  seg-transform.mp4      # polaroid->sketch->IDENTIFIED->journey mount
enc $RAW/v2-flow-intro.mp4  5.5  6.0  seg-drawon.mp4         # route pencils itself (G2, J3)
PAD=3.5 enc $RAW/v2-honesty.mp4   8.0 11.8  seg-honesty.mp4        # honesty rows readable (G3, J5) — dedicated parked capture
enc $RAW/v2-split.mp4       0.8  6.0  seg-split.mp4          # slider drag -> orbs (G5, J6)
enc $RAW/v2-receipt.mp4    12.2  8.0  seg-receipt-fill.mp4   # invoke -> lines tick traced (G6, J8)
PAD=1.2 enc $RAW/v2-receipt.mp4    15.0  7.0  seg-receipt-cards.mp4  # journal entries appear (G8, J9) — source is only 20.7s
enc $RAW/v2-ambient.mp4     0.5  7.0  seg-ambient.mp4        # ships+plane+shimmer (J2)
enc $RAW/v2-ticker.mp4      1.5  8.0  seg-ticker.mp4         # corridor lanes cycling (J13)
enc $RAW/v2-streak.mp4      0.3  6.6  seg-streak.mp4         # chip -> /impact (J14)
enc $RAW/v2-describe.mp4    0.5 11.5  seg-describe.mp4       # type -> trace -> journey lands (J7)
enc $RAW/v2-letter2.mp4     0.3 12.5  seg-letter.mp4         # sheet -> drafted letter (J10)
PAD=3.5 enc $RAW/a01-hero.mp4       0.2  9.9  seg-hero.mp4           # landing hero (J4)
enc $RAW/a10-proof.mp4      0.8  5.8  seg-proof.mp4          # proof drawer + Stellar (G7, J14b)
enc $RAW/m01-mobile.mp4     0.1  4.2  seg-mobile.mp4         # pocket journal (J12)
enc $RAW/a02-scroll.mp4     0.1  4.5  seg-scroll.mp4         # landing scroll (J12 pair)

# VO
cp audio/social/s0*.mp3 $A/ ; cp audio/judges/j0*.mp3 $A/
echo "--- segments ---" && ls $A/seg-*.mp4 | wc -l && du -sh $A
