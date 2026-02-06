# Map assets (static)

This repo contains pre-generated, static map assets used by Leaflet.

## Files

- `public/routes/madrid-lisbon.geojson`
  - Real **driving** route Madrid → Lisboa (via key cities).
  - Generated from public OSRM demo server.
  - Simplified to ~15–20 points to keep Leaflet light.

- `public/routes/madrid-lisbon-points.json`
  - Array of `{ name, day, coords: [lat, lng] }`.
  - `coords` are **Leaflet order**.

## Regenerating

Run the generator:

```bash
node scripts/build-madrid-lisbon-static.js
```

This will overwrite the files and keep them versionable.
