
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- MOCK DATA FOR PORTO & GALICIA ---

const tourData = {
  id: 'porto-galicia-2026',
  title: 'PORTO & GALICIA',
  summary: `Discover the hidden corners of Northern Portugal and Spain’s Atlantic coast.
Experience the green landscapes, the unique vineyards of the Douro Valley, and the spiritual path of Santiago.
Enjoy fresh seafood, Albariño wine, and the celtic heritage of Galicia.`,
  card_image: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
  start_date: '2026-04-15T00:00:00Z', 
  stops_path: 'Open Tours/PORTO & GALICIA/media'
};

// Coords for Porto Tour (Mocked/Approximate)
const portoCoords = {
  "Porto": { lat: 41.1579, lng: -8.6291 },
  "Douro Valley": { lat: 41.1496, lng: -7.6106 },
  "Guimarães": { lat: 41.4425, lng: -8.2930 },
  "Braga": { lat: 41.5454, lng: -8.4265 },
  "Santiago de Compostela": { lat: 42.8782, lng: -8.5448 },
  "Finisterre": { lat: 42.9090, lng: -9.2635 },
  "Rías Baixas": { lat: 42.5, lng: -8.8 }, // General area
  "Vigo": { lat: 42.2406, lng: -8.7207 }
};

// Itinerary Mock
const stopsByDay = {
  1: ['Porto'],
  2: ['Porto', 'Douro Valley'],
  3: ['Douro Valley', 'Guimarães'],
  4: ['Guimarães', 'Braga'],
  5: ['Vigo', 'Rías Baixas'],
  6: ['Santiago de Compostela'],
  7: ['Santiago de Compostela', 'Finisterre'],
  8: ['Porto'] // Return
};

// Activities Mock
const activities = [
  {
    day: 1,
    morning: {
      title: "Welcome to Porto",
      text: "Arrival in Porto. Welcome drink and transfer to the hotel overlooking the Douro River.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/PORTO%20&%20GALICIA/porto.webp"
    },
    afternoon: {
      title: "Ribeira District",
      text: "Walking tour through the colorful streets of Ribeira and a boat cruise under the 6 bridges.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/PORTO%20&%20GALICIA/porto.webp"
    }
  },
  {
    day: 2,
    morning: {
      title: "Douro Valley Wine Tasting",
      text: "Journey into the heart of the Douro Valley. Visit a family-owned quinta for port wine tasting.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/PORTO%20&%20GALICIA/porto.webp"
    },
    afternoon: {
      title: "River Cruise",
      text: "Relaxing cruise up the Douro river, admiring the terraced vineyards from the water.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/PORTO%20&%20GALICIA/porto.webp"
    }
  },
  {
    day: 3,
    morning: {
      title: "Birthplace of Portugal",
      text: "Visit Guimarães, the birthplace of the nation. Tour the medieval castle and the Palace of the Dukes.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/PORTO%20&%20GALICIA/porto.webp"
    },
    afternoon: {
      title: "Historic Center",
      text: "Free time to explore the UNESCO-listed historic center of Guimarães.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/PORTO%20&%20GALICIA/porto.webp"
    }
  },
  {
    day: 6,
    morning: {
      title: "The Pilgrim's Goal",
      text: "Arrival in Santiago de Compostela. Visit the magnificent cathedral and witness the Botafumeiro ritual if scheduled.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/PORTO%20&%20GALICIA/porto.webp"
    },
    afternoon: {
      title: "Old Town Santiago",
      text: "Wander through the granite streets of Santiago's old town, tasting tapas and Tarta de Santiago.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/PORTO%20&%20GALICIA/porto.webp"
    }
  }
];

// --- MAIN ---

async function run() {
  console.log('Starting migration for Porto-Galicia tour...');

  // 1. Insert Tour
  const { error: tourError } = await supabase
    .from('tours')
    .upsert({
      id: tourData.id,
      title: tourData.title,
      summary: tourData.summary,
      card_image: tourData.card_image,
      start_date: tourData.start_date,
      stops_path: tourData.stops_path
    })
    .select();

  if (tourError) {
    console.error('Error inserting Tour:', tourError);
    return;
  }
  console.log(`Updated tour: ${tourData.id}`);

  // 2. Process Info for Tour Days
  let daysPayload = [];

  for (const [dayStr, stops] of Object.entries(stopsByDay)) {
    const dayNum = parseInt(dayStr);
    
    // Enrich stops with coords
    const stopsData = stops.map(stopName => {
      let coords = portoCoords[stopName];
      let lat = coords?.lat || 0;
      let lng = coords?.lng || 0;
      return { name: stopName, lat, lng };
    });

    // Find activities
    const act = activities.find(a => a.day === dayNum);
    const activityData = act ? {
      morning: act.morning,
      afternoon: act.afternoon
    } : null;

    daysPayload.push({
      tour_id: tourData.id,
      row_type: 'day',
      day_number: dayNum,
      stops_data: stopsData,
      activities_data: activityData,
      day_title: `Day ${dayNum} - ${stops[0] || ''}`, 
    });
  }

  // 3. Process Map Route (Mocking a simple straight line for demo)
  // In reality, this would be a GeoJSON file load
  const mockRouteJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Porto Route", color: "#FF5733" },
        geometry: {
          type: "LineString",
          coordinates: [
            [portoCoords["Porto"].lng, portoCoords["Porto"].lat],
            [portoCoords["Santiago de Compostela"].lng, portoCoords["Santiago de Compostela"].lat]
          ]
        }
      }
    ]
  };

  daysPayload.push({
    tour_id: tourData.id,
    row_type: 'map',
    day_number: 0, 
    stops_data: mockRouteJSON,
    day_title: 'Full Route Map'
  });

  // Clean existing rows for this tour
  await supabase.from('tour_days').delete().eq('tour_id', tourData.id);

  // Insert Days
  const { error: daysError } = await supabase
    .from('tour_days')
    .insert(daysPayload);

  if (daysError) {
    console.error('Error inserting days:', daysError);
  } else {
    console.log(`Successfully inserted ${daysPayload.length} rows into tour_days for Porto.`);
  }
}

run();
