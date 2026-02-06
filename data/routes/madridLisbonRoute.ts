export type RouteFeatureCollection = any;

/**
 * Loads the static, versioned route file from /public at runtime.
 *
 * We intentionally keep the GeoJSON under `public/` because Next.js doesn't
 * parse `.geojson` imports out of the box without webpack loaders.
 */
export async function loadMadridLisbonRoute(): Promise<RouteFeatureCollection> {
  // In development append a cache-busting timestamp query so the browser
  // doesn't serve a stale copy from its HTTP cache or a dev proxy.
  const dev = process.env.NODE_ENV !== "production";
  const url = dev ? `/routes/madrid-lisbon.geojson?cb=${Date.now()}` : "/routes/madrid-lisbon.geojson";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load route: ${res.status}`);
  return res.json();
}
