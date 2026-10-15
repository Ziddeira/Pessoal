#!/usr/bin/env bash
# Divide um vídeo em N frames WEBP (padrão 300) em 1080p para a animação de scroll.
# Uso: ./extrair-frames.sh video.mp4 [quantidade] [qualidade-webp]
# Saída: frames/frame-0001.webp … frames/frame-0300.webp
set -euo pipefail

VIDEO="${1:?Uso: ./extrair-frames.sh video.mp4 [quantidade] [qualidade]}"
COUNT="${2:-300}"
QUALITY="${3:-78}"
OUT="$(dirname "$0")/frames"

DURATION="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")"
read -r WIDTH HEIGHT < <(ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height -of csv=p=0 "$VIDEO" | tr ',' ' ')

# 1080p: o lado menor vira 1080 px (1920x1080 na horizontal, 1080x1920 na vertical)
if [ "$WIDTH" -ge "$HEIGHT" ]; then SCALE="-2:1080"; else SCALE="1080:-2"; fi

# Taxa que distribui exatamente COUNT frames ao longo do vídeo inteiro
FPS="$(awk -v n="$COUNT" -v d="$DURATION" 'BEGIN { printf "%.6f", n / d }')"

mkdir -p "$OUT"
rm -f "$OUT"/frame-*.webp

ffmpeg -v error -stats -i "$VIDEO" -an \
  -vf "fps=${FPS},scale=${SCALE}:flags=lanczos" \
  -frames:v "$COUNT" -c:v libwebp -quality "$QUALITY" -compression_level 6 \
  "$OUT/frame-%04d.webp"

# Se o arredondamento deixar faltar algum frame no fim, repete o último
LAST="$(ls "$OUT"/frame-*.webp | sort | tail -1)"
for i in $(seq 1 "$COUNT"); do
  F="$(printf '%s/frame-%04d.webp' "$OUT" "$i")"
  [ -f "$F" ] || cp "$LAST" "$F"
done

echo "Pronto: $(ls "$OUT"/frame-*.webp | wc -l) frames em $OUT ($(du -sh "$OUT" | cut -f1))"
