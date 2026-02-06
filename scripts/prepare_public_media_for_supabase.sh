#!/usr/bin/env bash
set -euo pipefail
# prepare_public_media_for_supabase.sh
# Usage: ./scripts/prepare_public_media_for_supabase.sh /absolute/path/to/source_dir [output_dir]
#
# - Converts common image types (jpg/jpeg/png/gif) to WebP (quality configurable)
# - Preserves directory structure under the output directory
# - Copies non-image files as-is
# - Creates a tar.gz of the output directory and splits it into 50MB parts

SRC=${1:-/home/Rjmenaya/IBERO/public/PUBLIC}
DEST=${2:-${SRC}_compressed}
QUALITY=${IMG_QUALITY:-80}
MAX_DIM=${IMG_MAX_DIM:-1920}
SPLIT_SIZE=${SPLIT_SIZE:-50m}

if [ ! -d "$SRC" ]; then
  echo "Source directory not found: $SRC" >&2
  exit 1
fi

echo "Source: $SRC"
echo "Destination: $DEST"
echo "Image quality: $QUALITY  max-dim: $MAX_DIM"

mkdir -p "$DEST"

echo "Copying non-image files..."
# Copy everything except common raster images; we'll generate webp versions for images
rsync -a --prune-empty-dirs \
  --exclude='*.jpg' --exclude='*.jpeg' --exclude='*.png' --exclude='*.gif' \
  --exclude='*.JPG' --exclude='*.JPEG' --exclude='*.PNG' --exclude='*.GIF' \
  "$SRC/" "$DEST/"

echo "Converting images to WebP and writing into destination (preserving paths)..."
# Find raster images and convert them to webp into DEST with same relative path
cd "$SRC"
find . -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' \) -print0 |
  while IFS= read -r -d $'\0' file; do
    rel="${file#./}"
    out="$DEST/${rel%.*}.webp"
    mkdir -p "$(dirname "$out")"
    echo "  convert: $rel -> ${out#$DEST/}"
    # Use ImageMagick's magick/convert (depends on installation). This keeps aspect ratio and limits to MAX_DIM
    if command -v magick >/dev/null 2>&1; then
      magick "$file" -strip -resize "${MAX_DIM}x${MAX_DIM}>" -quality "$QUALITY" "$out"
    else
      # fallback to convert
      convert "$file" -strip -resize "${MAX_DIM}x${MAX_DIM}>" -quality "$QUALITY" "$out"
    fi
  done

echo "Preparing tar.gz archive..."
PARENT_DIR=$(dirname "$DEST")
BASE_NAME=$(basename "$DEST")
ARCHIVE="$PARENT_DIR/${BASE_NAME}.tar.gz"

cd "$PARENT_DIR"
tar -czf "$ARCHIVE" "$BASE_NAME"

echo "Splitting archive into ${SPLIT_SIZE} parts (for <=50MB Supabase limit set SPLIT_SIZE=50m)..."
split -b "$SPLIT_SIZE" --numeric-suffixes=1 --suffix-length=3 "$ARCHIVE" "${ARCHIVE}.part-"

echo "Done."
echo "Output directory: $DEST"
echo "Archive: $ARCHIVE"
echo "Parts: ${ARCHIVE}.part-001 etc."

echo "To recombine on the target machine: cat ${ARCHIVE}.part-* > ${ARCHIVE} && tar -xzf ${ARCHIVE}"
