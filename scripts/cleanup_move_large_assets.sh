#!/usr/bin/env bash
set -euo pipefail

# One-time cleanup helper: moves obviously-unused large assets out of the repo.
# It is reversible because everything is moved to IBERO_DISCARDED.

ROOT="/home/Rjmenaya/IBERO"
DISCARDED="/home/Rjmenaya/IBERO_DISCARDED"

mkdir -p "$DISCARDED/assets/public-videos"

if [ -d "$ROOT/public/videos" ]; then
  echo "Moving $ROOT/public/videos -> $DISCARDED/assets/public-videos/videos"
  mv -n "$ROOT/public/videos" "$DISCARDED/assets/public-videos/videos"
else
  echo "No public/videos folder found. Nothing to do."
fi

echo "Done."
