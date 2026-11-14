#!/bin/zsh
# Stamp a visible "SI-generated" mark into generated pictures and clips, and record the same
# in their metadata. The NASA Space Apps Project Submission Guide requires a visible watermark
# on SI-generated images and videos, and forbids NASA logos, flags and mission identifiers in
# generated content, so look at every new picture before it goes in.
#
# Usage, from web/:
#   scripts/mark-generated.sh public/illustrations/*.jpg public/illustrations/motion/*.mp4
#
# Files that already carry the mark are skipped, so it is safe to run on the whole folder
# whenever new pictures are dropped in. Needs ImageMagick (magick) and ffmpeg.
set -e

FONT="${SI_MARK_FONT:-/System/Library/Fonts/SFNSMono.ttf}"
TEXT="SI-generated"
NOTE="SI-generated concept illustration (Higgsfield). Not a NASA image."
INK="rgba(26,31,43,0.5)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for f in "$@"; do
  name="${f:t}"
  case "${f:l}" in
    *.jpg|*.jpeg|*.png)
      if magick identify -format "%c" "$f" 2>/dev/null | grep -q "SI-generated"; then echo "already marked  $f"; continue; fi
      w=$(magick identify -format "%w" "$f")
      size=$(( w * 21 / 1000 )); pad=$(( w * 18 / 1000 ))
      magick "$f" -font "$FONT" -pointsize $size -fill "$INK" -gravity northwest -annotate +$pad+$pad "$TEXT" -set comment "$NOTE" -quality 92 "$TMP/$name"
      mv "$TMP/$name" "$f"
      echo "marked          $f"
      ;;
    *.mp4)
      if ffprobe -v error -show_entries format_tags=comment -of default=nw=1:nk=1 "$f" | grep -q "SI-generated"; then echo "already marked  $f"; continue; fi
      w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$f")
      size=$(( w * 21 / 1000 )); pad=$(( w * 18 / 1000 ))
      magick -background none -font "$FONT" -pointsize $size -fill "$INK" label:"$TEXT" "$TMP/mark.png"
      # Clips the visitor turns by hand (turn-*) keep every frame as a key frame, so dragging stays smooth.
      gop=(); [[ "$name" == turn-* ]] && gop=(-g 1)
      ffmpeg -hide_banner -loglevel error -y -i "$f" -i "$TMP/mark.png" \
        -filter_complex "[0:v][1:v]overlay=$pad:$pad,format=yuv420p[v]" -map "[v]" -an \
        -c:v libx264 -crf 20 -preset slow $gop -movflags +faststart -metadata comment="$NOTE" "$TMP/$name"
      mv "$TMP/$name" "$f"
      echo "marked          $f"
      ;;
    *) echo "skipped         $f" ;;
  esac
done
