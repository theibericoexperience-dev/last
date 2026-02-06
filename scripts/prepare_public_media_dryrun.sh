#!/usr/bin/env bash
set -euo pipefail
# prepare_public_media_dryrun.sh
# Dry-run: sample a small set of files from source, convert images to webp, copy videos,
# produce manifest JSON and a short size summary.

SRC=${1:-/home/Rjmenaya/IBERO/public/PUBLIC}
SAMPLE_COUNT=${2:-8}
QUALITY=${IMG_QUALITY:-80}
MAX_DIM=${IMG_MAX_DIM:-1920}

if [ ! -d "$SRC" ]; then
  echo "Source directory not found: $SRC" >&2
  exit 1
fi

DEST=$(mktemp -d -t public_media_dryrun_XXXX)
MANIFEST="$DEST/manifest.json"
echo "Dry-run destination: $DEST"

echo "Detecting image converter..."
IMG_CMD=""
if command -v magick >/dev/null 2>&1; then
  IMG_CMD="magick"
elif command -v convert >/dev/null 2>&1; then
  IMG_CMD="convert"
elif command -v cwebp >/dev/null 2>&1; then
  IMG_CMD="cwebp"
fi

if [ -z "$IMG_CMD" ]; then
  echo "No ImageMagick (magick/convert) or cwebp found. Please install imagemagick or libwebp." >&2
  echo "On Debian/Ubuntu: sudo apt install -y imagemagick" >&2
  exit 2
fi

echo "Using image converter: $IMG_CMD"


tmpfiles=$(mktemp)

# collect files (images and common video extensions) safely handling spaces
# we use -print0 and shuf -z to shuffle null-delimited list, then take N entries
find "$SRC" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' -o -iname '*.mp4' -o -iname '*.mov' -o -iname '*.mkv' \) -print0 | shuf -z | tr '\0' '\n' | head -n "$SAMPLE_COUNT" > "$tmpfiles"

echo "Files selected (up to $SAMPLE_COUNT):"
cat "$tmpfiles"

echo "Processing files..."
printf '[' > "$MANIFEST"
first=true
total_orig=0
total_new=0
while IFS= read -r file; do
  rel=${file#${SRC}/}
  out="$DEST/$rel"
  mkdir -p "$(dirname "$out")"

  orig_size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo 0)
  new_file=""

  case "${file,,}" in
    *.jpg|*.jpeg|*.png|*.gif)
      # convert to webp
      out_webp="${out%.*}.webp"
      if [ "$IMG_CMD" = "cwebp" ]; then
        # cwebp usage: cwebp -q QUALITY infile -o outfile
        cwebp -q "$QUALITY" "$file" -o "$out_webp" >/dev/null 2>&1 || cp "$file" "$out_webp"
      else
        # magick/convert: keep aspect ratio and limit to MAX_DIM
        if [ "$IMG_CMD" = "magick" ]; then
          magick "$file" -strip -resize "${MAX_DIM}x${MAX_DIM}>" -quality "$QUALITY" "$out_webp"
        else
          convert "$file" -strip -resize "${MAX_DIM}x${MAX_DIM}>" -quality "$QUALITY" "$out_webp"
        fi
      fi
      new_file="$out_webp"
      ;;
    *.mp4|*.mov|*.mkv)
      # For dry-run we simply copy videos. For full processing we may transcode with ffmpeg.
      cp "$file" "$out"
      new_file="$out"
      ;;
    *)
      cp "$file" "$out"
      new_file="$out"
      ;;
  esac

  new_size=$(stat -c%s "$new_file" 2>/dev/null || stat -f%z "$new_file" 2>/dev/null || echo 0)
  total_orig=$((total_orig + orig_size))
  total_new=$((total_new + new_size))

  # append to manifest
  if [ "$first" = true ]; then
    first=false
  else
    printf ',' >> "$MANIFEST"
  fi
  jq -n --arg orig "$file" --arg new "$new_file" --argjson orig_size "$orig_size" --argjson new_size "$new_size" '{original:$orig, compressed:$new, original_size: $orig_size, compressed_size: $new_size}' >> "$MANIFEST"

done < "$tmpfiles"

printf ']' >> "$MANIFEST"

echo "Processing complete. Manifest: $MANIFEST"
echo "Summary:"
echo "  files: $(wc -l < "$tmpfiles")"
echo "  total original size: $((total_orig / 1024)) KB" 
echo "  total new size: $((total_new / 1024)) KB"

echo "Destination directory: $DEST"
echo "To inspect results, open the manifest and the files under $DEST"
