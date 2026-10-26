#!/usr/bin/env bash
set -euo pipefail
cd /Users/udingethe/Dev/jejak/video
RAW=raw; OUT=out; AUD=audio

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

# ---------- helpers ----------
# card still -> video segment
card_seg() { # $1 png $2 seconds $3 out $4 WxH
  ffmpeg -y -v error -loop 1 -i "$1" -t "$2" -vf "scale=${4%x*}:${4#*x}:force_original_aspect_ratio=decrease,pad=${4%x*}:${4#*x}:(ow-iw)/2:(oh-ih)/2:color=0xF3EDE2,setsar=1,fps=30" -c:v libx264 -pix_fmt yuv420p -crf 18 "$3"
}
seg() { # $1 src $2 t-start $3 t-len $4 out $5 filter
  ffmpeg -y -v error -ss "$2" -i "$1" -t "$3" -an -vf "$5" -c:v libx264 -pix_fmt yuv420p -crf 18 "$4"
}

# ============ 30s SOCIAL CUT (4:5 1080x1350) ============
# desktop 1440x900 -> center crop 720x900 -> scale 1080x1350
C="crop=720:900:(iw-720)/2:0,scale=1080:1350,setsar=1,fps=30"
seg $RAW/a01-hero.mp4      0.3 5.2  /tmp/s01.mp4 "$C"
seg $RAW/a02-scroll.mp4    0.2 4.2  /tmp/s02.mp4 "$C"
seg $RAW/a03-identify.mp4  0.5 4.1  /tmp/s03.mp4 "$C"
seg $RAW/a06-split.mp4     0.3 6.8  /tmp/s04.mp4 "$C"
seg $RAW/a07-receipt.mp4   1.0 6.0  /tmp/s05.mp4 "$C"
seg $RAW/a10-proof.mp4     1.2 4.5  /tmp/s06.mp4 "$C"
# mobile clip: already tall — pad to 4:5
seg $RAW/m01-mobile.mp4    0.2 3.9  /tmp/s07.mp4 "scale=624:1350:force_original_aspect_ratio=decrease,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=0xF3EDE2,setsar=1,fps=30"
card_seg cards/end-169.png 4.0 /tmp/s08.mp4 1080x1350

cat > /tmp/social-concat.txt <<EOF
$(for i in 01 02 03 04 05 06 07 08; do echo "file '/tmp/s$i.mp4'"; done)
EOF
ffmpeg -y -v error -f concat -safe 0 -i /tmp/social-concat.txt -c:v libx264 -pix_fmt yuv420p -crf 18 $OUT/social-video.mp4

# VO: social lines back to back with small gaps
ffmpeg -y -v error -f concat -safe 0 -i <(for f in $AUD/social/s0{1,2,3,4,5,6,7}.mp3; do echo "file '/Users/udingethe/Dev/jejak/video/$f'"; done) -c copy /tmp/social-vo.mp3
ffmpeg -y -v error -i $OUT/social-video.mp4 -i /tmp/social-vo.mp3 -c:v copy -c:a aac -shortest $OUT/jejak-social-30s.mp4
echo "SOCIAL: $(dur $OUT/jejak-social-30s.mp4)s"

# ============ ~95s JUDGES CUT (16:9 1440x900) ============
K="scale=1440:900,setsar=1,fps=30"
card_seg cards/title-169.png 3.0 /tmp/j00.mp4 1440x900
seg $RAW/a01-hero.mp4      0.0 6.5  /tmp/j01.mp4 "$K"
seg $RAW/a02-scroll.mp4    0.0 4.4  /tmp/j02.mp4 "$K"
seg $RAW/a03-identify.mp4  0.0 4.6  /tmp/j03.mp4 "$K"
seg $RAW/a04-journey.mp4   0.0 4.8  /tmp/j04.mp4 "$K"
seg $RAW/a05-label.mp4     0.0 5.0  /tmp/j05.mp4 "$K"
seg $RAW/a06-split.mp4     0.0 8.4  /tmp/j06.mp4 "$K"
seg $RAW/a07-receipt.mp4   0.5 12.0 /tmp/j07.mp4 "$K"
seg $RAW/a10-proof.mp4     0.0 6.9  /tmp/j08.mp4 "$K"
seg $RAW/a08-atlas.mp4     0.0 6.0  /tmp/j09.mp4 "$K"
seg $RAW/m01-mobile.mp4    0.0 4.1  /tmp/j10.mp4 "scale=390:844,pad=1440:900:525:28:color=0xF3EDE2,setsar=1,fps=30"
card_seg cards/end-169.png 5.0 /tmp/j11.mp4 1440x900

cat > /tmp/judges-concat.txt <<EOF
$(for i in 00 01 02 03 04 05 06 07 08 09 10 11; do echo "file '/tmp/j$i.mp4'"; done)
EOF
ffmpeg -y -v error -f concat -safe 0 -i /tmp/judges-concat.txt -c:v libx264 -pix_fmt yuv420p -crf 18 $OUT/judges-video.mp4

ffmpeg -y -v error -f concat -safe 0 -i <(for f in $AUD/judges/j0{1,2,3,4,5,6,7,8}.mp3; do echo "file '/Users/udingethe/Dev/jejak/video/$f'"; done) -c copy /tmp/judges-vo.mp3
ffmpeg -y -v error -i $OUT/judges-video.mp4 -i /tmp/judges-vo.mp3 -c:v copy -c:a aac -shortest $OUT/jejak-judges-2min.mp4
echo "JUDGES: $(dur $OUT/jejak-judges-2min.mp4)s"
ls -la $OUT/
