# Preparing public media for Supabase buckets

This repo stores static media under `public/PUBLIC`. Supabase bucket size limits require that you upload media in chunks <= 50MB, and it's preferable to compress/optimize images before uploading.

This document describes a small, reproducible script that:

- converts raster images (jpg/jpeg/png/gif) to WebP at configurable quality and max dimension;
- preserves directory structure;
- copies non-image files as-is;
- creates a gzipped tar archive of the prepared media and splits it into parts (default 50MB) ready to upload to Supabase buckets.

Prerequisites
-------------

- A POSIX-compatible shell (Linux/macOS).
- ImageMagick installed (`magick` or `convert` command). On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y imagemagick
```

On macOS with Homebrew:

```bash
brew install imagemagick
```

If you prefer `cwebp` (libwebp) you can adapt the script easily.

Usage
-----

From the repo root run:

```bash
chmod +x ./scripts/prepare_public_media_for_supabase.sh
./scripts/prepare_public_media_for_supabase.sh /home/Rjmenaya/IBERO/public/PUBLIC
```

Optional arguments:

- second argument: destination directory (default: <source>_compressed)
- environment variables:
  - `IMG_QUALITY` (default 80)
  - `IMG_MAX_DIM` (default 1920)
  - `SPLIT_SIZE` (default 50m)

Example:

```bash
IMG_QUALITY=75 IMG_MAX_DIM=1600 SPLIT_SIZE=50m ./scripts/prepare_public_media_for_supabase.sh /home/Rjmenaya/IBERO/public/PUBLIC /tmp/PUBLIC_for_upload
```

Reassembly on the server
------------------------

After uploading the parts to the target machine, recombine and extract:

```bash
cat PUBLIC_compressed.tar.gz.part-* > PUBLIC_compressed.tar.gz
tar -xzf PUBLIC_compressed.tar.gz
```

Notes & alternatives
--------------------

- If you have lots of videos, consider transcoding them to smaller resolutions with `ffmpeg` before upload.
- For very large datasets, consider splitting directories into logical buckets and preparing each separately.
- You can replace `magick/convert` calls with `cwebp` for better WebP control.
