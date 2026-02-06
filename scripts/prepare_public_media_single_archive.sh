#!/usr/bin/env bash
set -euo pipefail
# prepare_public_media_single_archive.sh
# Usage: ./scripts/prepare_public_media_single_archive.sh /absolute/path/to/PUBLIC [output_tar_path]
#
# Copies the PUBLIC folder to a temporary location, converts raster images to WebP
# (preserving relative paths), leaves other files unchanged, generates a manifest.json
# listing original->compressed (relative paths) and sizes, then creates a single tar.gz
# archive of the temporary folder. Does NOT split into parts.

SRC=${1:-}
if [ -z "$SRC" ]; then
  echo "Usage: $0 /absolute/path/to/PUBLIC [output_tar_path]" >&2
  exit 1
fi

if [ ! -d "$SRC" ]; then
  echo "Source directory not found: $SRC" >&2
  exit 1
fi

OUT_TAR=${2:-}

IMG_QUALITY=${IMG_QUALITY:-80}
IMG_MAX_DIM=${IMG_MAX_DIM:-1920}

TIMESTAMP=$(date +%Y%m%d%H%M%S)
BASE_NAME=$(basename "$SRC")
DEST="/tmp/${BASE_NAME}_compressed_${TIMESTAMP}"

echo "Source: $SRC"
echo "Temporary copy: $DEST"
echo "Image quality: $IMG_QUALITY  max-dim: $IMG_MAX_DIM"

mkdir -p "$DEST"

echo "Copying source to temporary location (preserving structure)..."
rsync -a --delete --protect-args "$SRC/" "$DEST/"

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
  echo "Ubuntu/Debian: sudo apt update && sudo apt install -y imagemagick" >&2
  echo "macOS (brew): brew install imagemagick" >&2
  exit 2
fi

MANIFEST="$DEST/manifest.json"
echo '[' > "$MANIFEST"
first=true

total_orig=0
total_new=0

echo "Converting images to WebP in-place on the temporary copy..."
# Find all files under DEST, handle spaces
while IFS= read -r -d $'\0' file; do
  rel_path="${file#$DEST/}"
  orig_file="$SRC/$rel_path"
  orig_size=0
  if [ -f "$orig_file" ]; then
    orig_size=$(stat -c%s "$orig_file" 2>/dev/null || stat -f%z "$orig_file" 2>/dev/null || echo 0)
  fi

  # Determine action based on extension
  lower=$(printf '%s' "$file" | awk '{print tolower($0)}')
  case "$lower" in
    *.jpg|*.jpeg|*.png|*.gif)
      out_webp="${file%.*}.webp"
      echo "Converting: $rel_path -> ${out_webp#$DEST/}"
      conversion_ok=false
      if [ "$IMG_CMD" = "cwebp" ]; then
        if cwebp -q "$IMG_QUALITY" "$file" -o "$out_webp" >/dev/null 2>&1; then
          conversion_ok=true
        fi
      else
        if [ "$IMG_CMD" = "magick" ]; then
          if magick "$file" -strip -resize "${IMG_MAX_DIM}x${IMG_MAX_DIM}>" -quality "$IMG_QUALITY" "$out_webp" >/dev/null 2>&1; then
            conversion_ok=true
          fi
        else
          if convert "$file" -strip -resize "${IMG_MAX_DIM}x${IMG_MAX_DIM}>" -quality "$IMG_QUALITY" "$out_webp" >/dev/null 2>&1; then
            conversion_ok=true
          fi
        fi
      fi

      if [ "$conversion_ok" = true ]; then
        # remove original file from dest (we keep the webp)
        rm -f -- "$file"
        comp_size=$(stat -c%s "$out_webp" 2>/dev/null || stat -f%z "$out_webp" 2>/dev/null || echo 0)
      else
        echo "Warning: conversion failed for $rel_path; keeping original file in the archive." >&2
        out_webp="$file"
        comp_size=$(stat -c%s "$out_webp" 2>/dev/null || stat -f%z "$out_webp" 2>/dev/null || echo 0)
      fi
      ;;
    *)
      # not an image — keep as-is
      out_webp="$file"
      comp_size=$(stat -c%s "$out_webp" 2>/dev/null || stat -f%z "$out_webp" 2>/dev/null || echo 0)
      ;;
  esac

  total_orig=$((total_orig + orig_size))
  total_new=$((total_new + comp_size))

  # Append manifest entry
  if [ "$first" = true ]; then
    first=false
  else
    printf ',' >> "$MANIFEST"
  fi
  # Use jq if available to safely encode strings, otherwise use python fallback
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg orig "$rel_path" --arg comp "${out_webp#$DEST/}" --argjson o "$orig_size" --argjson c "$comp_size" '{original:$orig, compressed:$comp, original_size:$o, compressed_size:$c}' >> "$MANIFEST"
  else
    python3 - <<PY >> "$MANIFEST"
import json
obj={'original':${1!} , 'compressed':${2!}, 'original_size':${3!}, 'compressed_size':${4!}}
print(json.dumps(obj))
PY
  fi
done < <(find "$DEST" -type f -print0)

printf ']' >> "$MANIFEST"

echo "Creating single tar.gz archive..."
PARENT_DIR=$(dirname "$DEST")
ARCHIVE_PATH=${OUT_TAR:-"${PARENT_DIR}/${BASE_NAME}_compressed_${TIMESTAMP}.tar.gz"}
cd "$PARENT_DIR"
tar -czf "$ARCHIVE_PATH" "$(basename "$DEST")"

processed_count=$(jq 'length' "$MANIFEST" 2>/dev/null || echo 'unknown')
echo "Done."
echo "Files processed: $processed_count"
echo "Total original size: $total_orig bytes ($((total_orig/1024)) KB)"
echo "Total compressed size: $total_new bytes ($((total_new/1024)) KB)"
echo "Manifest: $MANIFEST"
echo "Archive: $ARCHIVE_PATH"

echo "Temporary copy preserved at: $DEST"
