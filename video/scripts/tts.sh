#!/usr/bin/env bash
# Generate ElevenLabs VO segments for each pipe-delimited script line.
# Usage: tts.sh <script.txt> <out_dir> [voice_id]
set -euo pipefail
SCRIPT="$1"; OUT="$2"; VOICE="${3:-JBFqnCBsd6RMkjVDRZzb}"   # George — warm British storyteller
mkdir -p "$OUT"
while IFS='|' read -r id text; do
  [ -z "$id" ] && continue
  curl -s "https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" \
    -d "$(python3 -c 'import json,sys; print(json.dumps({"text": sys.argv[1], "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.25}}))' "$text")" \
    -o "$OUT/${id}.mp3"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/${id}.mp3" 2>/dev/null || echo "?")
  echo "$id  ${dur}s  $text"
done < "$SCRIPT"
