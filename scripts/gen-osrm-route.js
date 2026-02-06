const fs = require('fs');
const fetch = require('node-fetch');

// mainItinerary flattened in order of appearance (from InteractiveMap)
const points = [
  ['Madrid'],
  ['Escorial','Avila','Plasencia'],
  ['Jerte (Gargantas)','Hervás','Granadilla','Plasencia'],
  ['Alburquerque','Barruecos','Dehesa'],
  ['Trujillo','Guadalupe'],
  ['Mérida','Elvas'],
  ['Badajoz','Campomaior'],
  ['Juromenha','Vila Viçosa','Marble'],
  ['Monsaraz','Jerez de Los Caballeros'],
  ['Setubal tour','Winery'],
  ['Lisbon'],
  ['Depart']
];

const coordsByName = {
  Madrid: [40.4168, -3.7038],
  Escorial: [40.5913, -4.1479],
  Avila: [40.6565, -4.6819],
  Plasencia: [40.0316, -6.091],
  'Jerte (Gargantas)': [40.209, -6.473],
  Hervás: [40.255, -6.389],
  Granadilla: [39.1883, -6.417],
  Alburquerque: [39.0628, -7.0802],
  Barruecos: [39.4578, -6.7635],
  Dehesa: [38.99, -7.015],
  Trujillo: [39.458, -5.888],
  Guadalupe: [39.4986, -5.8681],
  Mérida: [38.9167, -6.3333],
  Elvas: [38.8917, -7.1631],
  Badajoz: [38.8794, -6.9707],
  Campomaior: [38.73, -7.299],
  Juromenha: [38.655, -7.25],
  'Vila Viçosa': [38.7836, -7.2311],
  Marble: [38.7667, -7.3],
  Monsaraz: [38.4326, -7.4113],
  'Jerez de Los Caballeros': [38.55, -6.792],
  'Setubal tour': [38.5244, -8.8942],
  Winery: [38.5333, -8.9],
  Lisbon: [38.7223, -9.1393],
  Depart: [38.7223, -9.1393]
};

(async function() {
  try {
    // 1) full route (flattened)
    const flat = [];
    for (const day of points) {
      for (const p of day) {
        flat.push(p);
      }
    }
    const dedup = flat.filter((v, i) => i === 0 || v !== flat[i-1]);
    const coords = dedup.map(name => {
      const v = coordsByName[name];
      if (!v) throw new Error('Missing coord for ' + name);
      return [v[1], v[0]]; // lon,lat
    });

    const coordStr = coords.map(c => c.join(',')).join(';');
    const url = `http://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
    console.log('OSRM request (full) ->', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM error ' + res.status);
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error('No routes returned');
    const route = data.routes[0];
    const feature = {
      type: 'Feature',
      properties: {
        summary: route.legs.map(l => l.summary).join(', '),
        distance: route.distance,
        duration: route.duration
      },
      geometry: route.geometry
    };
    const fc = { type: 'FeatureCollection', features: [feature] };
    fs.mkdirSync('./public/routes', { recursive: true });
    fs.writeFileSync('./public/routes/madrid-lisbon.geojson', JSON.stringify(fc, null, 2));
    console.log('Saved public/routes/madrid-lisbon.geojson');

    // 2) per-day routes
    for (let i = 0; i < points.length; i++) {
      const day = points[i];
      // dedupe consecutive duplicates in day
      const dayDedup = day.filter((v, idx) => idx === 0 || v !== day[idx-1]);
      if (dayDedup.length < 2) {
        console.log(`Day ${i+1} has <2 points, skipping route generation`);
        continue;
      }
      const dayCoords = dayDedup.map(name => {
        const v = coordsByName[name];
        if (!v) throw new Error('Missing coord for ' + name);
        return [v[1], v[0]];
      });
      const dayCoordStr = dayCoords.map(c => c.join(',')).join(';');
      const dayUrl = `http://router.project-osrm.org/route/v1/driving/${dayCoordStr}?overview=full&geometries=geojson`;
      console.log(`OSRM request (day ${i+1}) ->`, dayUrl);
      const r = await fetch(dayUrl);
      if (!r.ok) {
        console.warn(`OSRM day ${i+1} returned ${r.status}, skipping`);
        continue;
      }
      const dayData = await r.json();
      if (!dayData.routes || !dayData.routes.length) { console.warn(`No route day ${i+1}`); continue; }
      const dayRoute = dayData.routes[0];
      const dayFeature = {
        type: 'Feature',
        properties: { distance: dayRoute.distance, duration: dayRoute.duration },
        geometry: dayRoute.geometry
      };
      const dayFc = { type: 'FeatureCollection', features: [dayFeature] };
      fs.writeFileSync(`./public/routes/madrid-lisbon-day-${i+1}.geojson`, JSON.stringify(dayFc, null, 2));
      console.log(`Saved public/routes/madrid-lisbon-day-${i+1}.geojson`);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
