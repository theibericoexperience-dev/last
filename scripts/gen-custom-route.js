const fs = require('fs');
const fetch = require('node-fetch');

// Ordered list requested by user (final sequence)
const requested = [
  'Madrid',
  'Avila',
  'Hervás',
  'Plasencia',
  'Cáceres',
  'Guadalupe',
  'Mérida',
  'Badajoz',
  'Elvas',
  'Évora',
  'Setubal tour',
  'Lisbon'
];

function normalize(s) {
  return String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

(async function(){
  try {
    const coordsByName = require('./gen-osrm-route-coords.json');
    // build lookup by normalized key
    const lookup = {};
    for (const k of Object.keys(coordsByName)) lookup[normalize(k)] = coordsByName[k];

    const coords = [];
    for (const name of requested) {
      const n = normalize(name);
      const v = lookup[n];
      if (!v) {
        throw new Error('Missing coord for ' + name + " (normalized: " + n + ")");
      }
      coords.push([v[1], v[0]]); // lon, lat
    }

    const coordStr = coords.map(c => c.join(',')).join(';');
    const url = `http://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
    console.log('OSRM custom request ->', url);

    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM error ' + res.status);
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error('No routes returned');
    const route = data.routes[0];
    const feature = {
      type: 'Feature',
      properties: { summary: route.legs.map(l => l.summary).join(', '), distance: route.distance, duration: route.duration },
      geometry: route.geometry
    };
    const fc = { type: 'FeatureCollection', features: [feature] };

    const outDir = './public/routes';
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = outDir + '/madrid-lisbon.geojson';
    if (fs.existsSync(outFile)) {
      const bak = outDir + '/madrid-lisbon.geojson.bak.' + Date.now();
      fs.copyFileSync(outFile, bak);
      console.log('Backed up existing madrid-lisbon.geojson to', bak);
    }
    fs.writeFileSync(outFile, JSON.stringify(fc, null, 2));
    console.log('Saved', outFile);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
