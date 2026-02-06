/*
  Generates static, versionable map assets:

  - public/routes/madrid-lisbon.geojson
    A real OSRM driving route passing through key cities.
    Geometry is simplified to ~10-20 points (configurable).

  - public/routes/madrid-lisbon-points.json
    [{ name, day, coords: [lat,lng] }]

  Notes:
  - Requires network access to public OSRM demo server.
  - Output is static: the web app will only read and render.
*/

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const ROUTE_DIR = path.join(__dirname, "..", "public", "routes");
const POINTS_FILE = path.join(__dirname, "..", "public", "routes", "madrid-lisbon-points.json");
const ROUTE_FILE = path.join(ROUTE_DIR, "madrid-lisbon.geojson");

// Cities in order (matches the Google Maps route the user provided)
// Madrid → Ávila → Badajoz → Lisbon
const KEY_CITIES = ["Madrid", "Ávila", "Badajoz", "Lisboa"];

// Leaflet-friendly [lat,lng]
const KEY_CITY_COORDS = {
  Madrid: [40.416775, -3.70379],
  "Ávila": [40.656525, -4.681877],
  Badajoz: [38.878135, -6.970484],
  Lisboa: [38.722252, -9.139337],
};

// Day assignment (simple, versionable mapping)
const DAY_BY_CITY = {
  Madrid: 1,
  "Ávila": 2,
  Badajoz: 3,
  Lisboa: 4,
};

function assertLatLng(latlng, name) {
  if (!Array.isArray(latlng) || latlng.length !== 2) throw new Error(`Invalid coords for ${name}`);
  const [lat, lng] = latlng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error(`Non-numeric coords for ${name}`);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(`Out-of-range coords for ${name}: ${lat},${lng}`);
}

function toLonLat([lat, lng]) {
  return [lng, lat];
}

// Keep points within a rough Iberian bounding box (extra safety)
function isInIberiaLonLat([lon, lat]) {
  return lat >= 35 && lat <= 45.5 && lon >= -10.5 && lon <= 4.5;
}

function simplifyLineStringLonLat(coords, maxPoints = 60, opts = {}) {
  // Ramer–Douglas–Peucker simplifier (in lon/lat degrees) with adaptive tolerance.
  // We use an adaptive binary-search over tolerance to target approximately `maxPoints`.
  if (!Array.isArray(coords) || coords.length < 2) return coords;
  if (coords.length <= maxPoints) return coords;

  function perpSqDistance(pt, a, b) {
    // compute squared perpendicular distance from pt to segment a-b
    const x = pt[0], y = pt[1];
    const x1 = a[0], y1 = a[1];
    const x2 = b[0], y2 = b[1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      const dx2 = x - x1;
      const dy2 = y - y1;
      return dx2 * dx2 + dy2 * dy2;
    }
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t <= 0) {
      const dx2 = x - x1;
      const dy2 = y - y1;
      return dx2 * dx2 + dy2 * dy2;
    } else if (t >= 1) {
      const dx2 = x - x2;
      const dy2 = y - y2;
      return dx2 * dx2 + dy2 * dy2;
    }
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const dx3 = x - px;
    const dy3 = y - py;
    return dx3 * dx3 + dy3 * dy3;
  }

  function rdpRecursive(points, epsSq) {
    const n = points.length;
    if (n <= 2) return [points[0], points[n - 1]];
    let maxDist = -1;
    let idx = -1;
    const a = points[0];
    const b = points[n - 1];
    for (let i = 1; i < n - 1; i++) {
      const d = perpSqDistance(points[i], a, b);
      if (d > maxDist) {
        maxDist = d;
        idx = i;
      }
    }
    if (maxDist > epsSq) {
      const left = rdpRecursive(points.slice(0, idx + 1), epsSq);
      const right = rdpRecursive(points.slice(idx), epsSq);
      return left.slice(0, -1).concat(right);
    }
    return [a, b];
  }
  // If caller provided a maximum epsilon, respect it first: run RDP with that epsilon
  // (eps in degrees). This avoids expanding tolerance beyond the requested cap.
  const maxEpsDefault = typeof opts.maxEpsilon === 'number' ? opts.maxEpsilon : null;
  let best = coords;
  if (typeof maxEpsDefault === 'number') {
    const epsSq = maxEpsDefault * maxEpsDefault;
    const cand = rdpRecursive(coords, epsSq);
    best = cand && cand.length ? cand.slice() : coords.slice();
  } else {
    // Binary search tolerance (in degrees) to get roughly maxPoints
    let low = 0; // eps (degrees)
    let high = 0.5; // big tolerance (~0.5 degrees)
    // ensure high is large enough to reduce to <= maxPoints
    while (rdpRecursive(coords, high * high).length > maxPoints && high < 180) {
      high *= 2;
    }

    best = coords;
    for (let iter = 0; iter < 40; iter++) {
      const mid = (low + high) / 2;
      const epsSq = mid * mid;
      const cand = rdpRecursive(coords, epsSq);
      if (cand.length > maxPoints) {
        low = mid;
      } else {
        best = cand;
        high = mid;
      }
      if (Math.abs(high - low) < 1e-9) break;
    }
  }

  // Guarantee endpoints
  if (!best.length) return coords.slice(0, maxPoints);
  if (best[0][0] !== coords[0][0] || best[0][1] !== coords[0][1]) best.unshift(coords[0]);
  const last = coords[coords.length - 1];
  const bLast = best[best.length - 1];
  if (bLast[0] !== last[0] || bLast[1] !== last[1]) best.push(last);
  return best;
}

async function fetchOsrmRouteLonLat(viaLonLat) {
  const coordStr = viaLonLat.map((c) => c.join(",")).join(";");
  const url = `http://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM error ${res.status}`);
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route?.geometry?.coordinates?.length) throw new Error("OSRM: no geometry");
  return route;
}

async function main() {
  // Validate inputs
  for (const city of KEY_CITIES) {
    const coords = KEY_CITY_COORDS[city];
    assertLatLng(coords, city);
  }

  // Convert to lon/lat for OSRM
  const viaLonLat = KEY_CITIES.map((city) => toLonLat(KEY_CITY_COORDS[city]));

  const route = await fetchOsrmRouteLonLat(viaLonLat);

  // Filter any weird points + simplify
  const raw = route.geometry.coordinates;
  const filtered = raw.filter((c) => Array.isArray(c) && c.length === 2 && Number.isFinite(c[0]) && Number.isFinite(c[1]) && isInIberiaLonLat(c));
  // Use a softer simplification: target ~60 points and cap epsilon to 0.002° (~200 m)
  const simplified = simplifyLineStringLonLat(filtered, 60, { maxEpsilon: 0.002 });

  const fc = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "Madrid → Lisboa (driving)",
          color: "#0077cc",
          distance: route.distance,
          duration: route.duration,
          waypoints: KEY_CITIES,
          simplified_points: simplified.length,
        },
        geometry: {
          type: "LineString",
          coordinates: simplified,
        },
      },
    ],
  };

  fs.mkdirSync(ROUTE_DIR, { recursive: true });
  fs.writeFileSync(ROUTE_FILE, JSON.stringify(fc, null, 2));

  // Points file
  const points = KEY_CITIES.map((name) => ({
    name,
    day: DAY_BY_CITY[name] ?? null,
    coords: KEY_CITY_COORDS[name], // [lat,lng]
  }));

  // Validate leafet coords & also validate they map to Iberia
  for (const p of points) {
    assertLatLng(p.coords, p.name);
    if (!isInIberiaLonLat(toLonLat(p.coords))) throw new Error(`Point outside Iberia: ${p.name}`);
  }

  fs.mkdirSync(path.dirname(POINTS_FILE), { recursive: true });
  fs.writeFileSync(POINTS_FILE, JSON.stringify(points, null, 2));
  console.log(" -", path.relative(process.cwd(), POINTS_FILE));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
