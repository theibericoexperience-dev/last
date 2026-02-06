const fs = require('fs');
const fetch = require('node-fetch');

// Overnight stops sequence: Madrid → Plasencia → Cáceres → Elvas → Évora → Setúbal → Lisboa
const overnightStops = [
  'Madrid',
  'Plasencia',
  'Cáceres',
  'Elvas',
  'Évora',
  'Setubal tour',
  'Lisbon'
];

const coordsByName = require('./gen-osrm-route-coords.json');

(async function(){
  try {
    const coords = overnightStops.map(name => {
      const v = coordsByName[name];
      if (!v) throw new Error('Missing coord for ' + name);
      return [v[1], v[0]]; // lon,lat
    });

    const coordStr = coords.map(c => c.join(',')).join(';');
    const url = `http://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
    console.log('OSRM overnight request ->', url);

    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM error ' + res.status);
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error('No routes returned');
    const route = data.routes[0];
    const feature = {
      type: 'Feature',
      properties: { distance: route.distance, duration: route.duration },
      geometry: route.geometry
    };
    const fc = { type: 'FeatureCollection', features: [feature] };

    // backup existing file
    const outDir = './public/routes';
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = outDir + '/madrid-lisbon.geojson';
    if (fs.existsSync(outFile)) {
      fs.copyFileSync(outFile, outDir + '/madrid-lisbon.geojson.bak');
      console.log('Backed up existing madrid-lisbon.geojson to madrid-lisbon.geojson.bak');
    }
    fs.writeFileSync(outFile, JSON.stringify(fc, null, 2));
    console.log('Saved', outFile);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
