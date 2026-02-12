
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

// --- DATA ---

// 1. Tour Data (from toursOverview.ts)
const tourData = {
  id: 'madrid-2026',
  title: 'MADRID TO LISBOA\nForgotten Iberia',
  summary: `Explore the unkown areas of Southwest Iberia and get a glimpse of the 2 Capitals.
Visit Roman, Arab and Medieval Christian heritage.
Learn about the Dehesa Landscape and its unique millenial farming culture.
Get to know locals that preserve this area as what it is, a unique treasure that is yet to be discovered.
This area tends to have mild temperatures in Winter & Early Spring`,
  card_image: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/madrid.webp',
  start_date: '2026-03-01T00:00:00Z', // Approximated from '2026-03'
  stops_path: 'Open Tours/MADRID TO LISBOA/MAIN TOUR/stops',
  // Pricing & Extras
  price_tour: 3500,
  price_flights: 0, 
  departure_airports: [
    "New York (JFK)",
    "Newark (EWR)",
    "Miami (MIA)",
    "Chicago (ORD)",
    "Los Angeles (LAX)",
    "Boston (BOS)",
    "Toronto (YYZ)",
    "Montreal (YUL)",
    "Seattle (SEA)",
    "San Francisco (SFO)"
  ],
  inclusions: [
    "Flights (international & internal, included)",
    "Accommodation in 4-5★ hotels",
    "Full-time bilingual tour guide",
    "Ground transportation",
    "All meals & suppers",
    "Guided visits, entrance fees, and experiences as per itinerary"
  ],
  insurance_options: {
    health: "Health travel insurance",
    cancellation: "Trip cancellation insurance"
  },
  // Linking extensions by ID (We will create these "mini tours" rows later if needed)
  // For now, storing metadata needed for the Reservation Tab UI
  related_tours: [
    { id: 'ext-bcn-2026', title: 'BARCELONA & TARRAGONA', days: 5, when: 'PREVIOUS TO TOUR', price: 1250 },
    { id: 'ext-azores-2026', title: 'LISBON & AZORES', days: 8, when: 'AFTER THE TOUR', price: 2000 },
    { id: 'ext-easter-2026', title: 'SPAIN EASTER CELEBRATIONS', days: 7, when: 'AFTER THE TOUR', price: 1750 },
    { id: 'ext-easter-azores-2026', title: 'EASTER + AZORES', days: 11, when: 'AFTER THE TOUR', price: 2750 }
  ]
};

// 2. Coords (from coordsByName.json)
// Loading this from file since it's JSON
const coordsPath = path.join(__dirname, '../data/coords/coordsByName.json');
const coordsByName = JSON.parse(fs.readFileSync(coordsPath, 'utf8'));

// 3. Itinerary Stops (from itineraries/madrid-2026.ts)
const stopsByDay = {
  1: ['Madrid'],
  2: ['Escorial', 'Ávila', 'Plasencia'],
  3: ['Jerte Waterfalls', 'Hervás', 'Granadilla'],
  4: ['Monsanto', 'San Martín', 'Plasencia'],
  5: ['Plasencia', 'Cáceres'],
  6: ['Alburquerque', 'Barruecos', 'Dehesa'],
  7: ['Trujillo', 'Guadalupe'],
  8: ['Mérida', 'Zafra', 'Elvas'],
  9: ['Badajoz', 'Campo Maior'],
  10: ['Juromenha', 'Vila Viçosa'],
  11: ['Monsaraz', 'Jerez de los Caballeros'],
  12: ['Sesimbra', 'Setúbal'],
  13: ['Lisboa'],
  14: []
};

// 4. Activities (from dayByDayActivities.ts)
const activities = [
  {
    day: 1,
    morning: {
      title: "Welcome Event",
      text: "Arrival of participants and introduction to the program. Time to settle in and meet the group in an informal setting.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Madrid Walking Tour",
      text: "Guided walk through the historic center of Madrid, covering key landmarks and neighborhoods. Orientation to the city's layout and cultural context.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 2,
    morning: {
      title: "Ávila Walking Tour",
      text: "Walking tour of Ávila focusing on its medieval walls and historic center. Overview of the city's history and architectural heritage.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Arrival & Dinner in Plasencia",
      text: "Arrival in Plasencia and check-in. Group dinner to close the day and introduce the local cuisine.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 3,
    morning: {
      title: "Visit to Monfragüe National Park",
      text: "Exploration of Monfragüe National Park with short walks and viewpoints. Introduction to the natural landscape and biodiversity of the area.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Discovery of 3 Lugares",
      text: "Visit to selected rural locations representative of the region. Focus on local traditions, landscapes, and daily life.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 4,
    morning: {
      title: "Discovery of Monsanto",
      text: "Walking visit through the village of Monsanto, known for its integration into the surrounding granite landscape. Time to explore viewpoints and village streets.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "The Historic Borderlands",
      text: "Introduction to the historical border region between Spain and Portugal. Explanation of its cultural, political, and geographic significance.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 5,
    morning: {
      title: "Borderlands & Barruecos",
      text: "Visit to the Borderlands area and the natural site of Los Barruecos. Combination of cultural context and natural scenery.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Arrival to Cáceres & Visit",
      text: "Arrival in Cáceres and guided walk through its old town. Overview of its medieval and Renaissance heritage.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 6,
    morning: {
      title: "Visit to Luna Castle & Dehesa",
      text: "Visit to Luna Castle and surrounding dehesa landscape. Introduction to rural land use and historical defensive structures.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Toni's Farm",
      text: "Visit to a local farm to understand regional agricultural practices. Informal exchange with local hosts.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 7,
    morning: {
      title: "Walking Tour in Trujillo",
      text: "Guided walk through Trujillo's historic center and main square. Context on its historical role and notable architecture.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Guadalupe Monastery",
      text: "Visit to the Royal Monastery of Santaamria de Guadalupe. Context on its historical role and notable architecture. This place has been center of pilgrimage for centuries.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 8,
    morning: {
      title: "Roman Mérida",
      text: "Guided tour tour of the Roman ruins in Mérida, including the theater and amphitheater. Focus on the Roman legacy in the Iberian Peninsula.", 
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Zafra & Elvas",
      text: "The Little Seville & The Biggest Fortress in Europe. Focus on the mix of cultures in the Southern part of the border",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 9,
    morning: {
      title: "Badajoz",
      text: "The Capital of the Frontier. We will visit the Alcazaba (Arab Citadel).",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Campo Maior",
      text: "Visit to the Fortress and the Chapel of Bones. ",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 10,
    morning: {
      title: "Juromenha",
      text: "Walking tour of the abandoned fortress of Juromenha. Discussion of its strategic location and history.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Vila Viçosa",
      text: "Visit to the Duchal Palace of Vila Viçosa. Insight into the history of the Portuguese monarchy and aristocracy.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 11,
    morning: {
      title: "Monsaraz",
      text: "Visit to the medieval village of Monsaraz. Focus on its castle, views of the Alqueva reservoir, and local crafts.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Jerez de los Caballeros",
      text: "Exploration of Jerez de los Caballeros, known for its Templar history and baroque towers. Walk through the historic center.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 12,
    morning: {
      title: "Sesimbra",
      text: "Visit to the coastal town of Sesimbra. Time to explore the castle and the fishing harbor.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Setúbal",
      text: "Visit to Setúbal, including the market and the city center. Introduction to the region's maritime traditions.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 13,
    morning: {
      title: "Lisbon - Belém",
      text: "Visit to the Belém district, including the Tower of Belém and the Jerónimos Monastery. Focus on the Age of Discoveries.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "Lisbon City Center",
      text: "Free time in downtown Lisbon or guided walk through key squares and streets. Wrap-up of the tour experience.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    }
  },
  {
    day: 14,
    morning: {
      title: "Departure",
      text: "Check-out and departure. Assistance with transfers to the airport or further travel arrangements.",
      media: "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp"
    },
    afternoon: {
      title: "",
      text: "",
      media: ""
    }
  }
];

// --- EXTENSIONS DATA ---

const extBarcelona = {
  id: 'ext-bcn-2026',
  title: 'BARCELONA & TARRAGONA',
  summary: 'Experience the Mediterranean charm before your main journey. From the Roman ruins of Tarragona to the vibrant streets of Barcelona.',
  card_image: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/MAIN TOUR/hero.webp', // Placeholder
  start_date: null, // Relative
  stops_path: 'Open Tours/MADRID TO LISBOA/EXTENSIONS/BCN',
  // Pricing
  price_tour: 1250,
  price_flights: 0,
  inclusions: ["Accommodation", "Transport", "Guide"],
  insurance_options: {},
  related_tours: null
};

const extBarcelonaDays = [
  {
    day_number: 1,
    overnight: 'Tarragona',
    stops: ['Barcelona', 'Tarragona'],
    morning: { title: "Barcelona On Wheels", text: "Panoramic tour of Barcelona's modernist architecture.", media: "" },
    afternoon: { title: "Boat Experience", text: "Relaxing boat trip along the coast.", media: "" }
  },
  {
    day_number: 2,
    overnight: 'Tarragona',
    stops: ['Tarragona'],
    morning: { title: "Roman City", text: "Visit to the Roman amphitheater and circus of Tarraco.", media: "" },
    afternoon: { title: "Old Town", text: "Walking tour of the medieval center.", media: "" }
  },
  {
    day_number: 3,
    overnight: 'Tarragona',
    stops: ['Delta del Ebro'],
    morning: { title: "Delta Ebro", text: "Nature excursion to the Ebro Delta Natural Park.", media: "" },
    afternoon: { title: "Rice Fields", text: "Cultural insight into the local rice traditions.", media: "" }
  },
  {
    day_number: 4,
    overnight: 'Madrid',
    stops: ['Madrid'],
    morning: { title: "El Escorial", text: "Visit to the Royal Site of San Lorenzo de El Escorial.", media: "" },
    afternoon: { title: "Bolsa de Madrid", text: "Visit to the Madrid Stock Exchange palace.", media: "" }
  }
];

const extAzores = {
  id: 'ext-azores-2026',
  title: 'AZORES & SAO MIGUEL',
  summary: 'A post-tour adventure into the wild beauty of the Azores archipelago. Volcanic landscapes, lush jungles, and ocean wonders.',
  card_image: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/MAIN TOUR/hero.webp', // Placeholder
  start_date: null,
  stops_path: 'Open Tours/MADRID TO LISBOA/EXTENSIONS/AZORES',
  price_tour: 2000,
  price_flights: 0,
  inclusions: ["Accommodation", "Internal Flights", "Guide"],
  insurance_options: {},
  related_tours: null
};

const extAzoresDays = [
  {
    day_number: 1,
    overnight: 'Sao Miguel',
    stops: ['Ponta Delgada'],
    morning: { title: "Arrival", text: "Welcome to the Azores.", media: "" },
    afternoon: { title: "Volcanic Therms", text: "Relaxing bath in the natural thermal pools.", media: "" }
  },
  {
    day_number: 2,
    overnight: 'Sao Miguel',
    stops: ['Ponta Delgada'],
    morning: { title: "Sao Miguel On Wheels", text: "4x4 tour exploring the island's interior.", media: "" },
    afternoon: { title: "Boat Trip", text: "Whale and dolphin watching experince.", media: "" }
  },
  {
    day_number: 3,
    overnight: 'Sao Miguel',
    stops: ['Sete Cidades'],
    morning: { title: "Jungle & Locals", text: "Hiking through lush vegetation.", media: "" },
    afternoon: { title: "Volcanic Lagoons", text: "Visit to the iconic Blue and Green lagoons.", media: "" }
  },
  {
    day_number: 4,
    overnight: 'Flores',
    stops: ['Faja Grande'],
    morning: { title: "Fly to Flores", text: "Flight to Flores island.", media: "" },
    afternoon: { title: "The Wildest Island", text: "Exploration of Europe's westernmost point.", media: "" }
  },
  {
    day_number: 5,
    overnight: 'Flores',
    stops: ['Corvo'],
    morning: { title: "Boat to Corvo", text: "Visit to the smallest island of the archipelago.", media: "" },
    afternoon: { title: "The Incredible Caldera", text: "Hiking the massive volcanic crater.", media: "" }
  },
  {
    day_number: 6,
    overnight: 'Terceira',
    stops: ['Terceira'],
    morning: { title: "Departure", text: "Flight to Terceira / Mainland.", media: "" },
    afternoon: { title: "Farewell", text: "End of the journey.", media: "" }
  }
];

// --- MAIN ---

async function run() {
  console.log('Starting migration for Madrid-Lisbon tour & Extensions...');

  // 1. Insert Main Tour
  // ... existing code ...
  const tourRecord = {
      id: tourData.id,
      title: tourData.title,
      summary: tourData.summary,
      card_image: tourData.card_image,
      start_date: tourData.start_date,
      stops_path: tourData.stops_path,
      // New columns (mapped to DB schema names)
      "Tour Cost": tourData.price_tour,
      "Flights": tourData.price_flights,
      inclusions: tourData.inclusions,
      insurance_options: tourData.insurance_options,
      related_tours: tourData.related_tours
    };

  const { error: tourError } = await supabase
    .from('tours')
    .upsert(tourRecord)
    .select();

  if (tourError) {
    console.error('Error inserting Tour:', tourError);
    return;
  }
  console.log(`Updated tour: ${tourData.id}`);

  // 1.1 Insert Extensions Tours
  const extensions = [
      { data: extBarcelona, days: extBarcelonaDays },
      { data: extAzores, days: extAzoresDays }
  ];

  for (const ext of extensions) {
      const { error: extErr } = await supabase.from('tours').upsert({
          id: ext.data.id,
          title: ext.data.title,
          summary: ext.data.summary,
          card_image: ext.data.card_image,
          stops_path: ext.data.stops_path,
          "Tour Cost": ext.data.price_tour,
          "Flights": ext.data.price_flights,
          inclusions: ext.data.inclusions,
          // related_tours: null (extensions usually don't have sub-extensions in this model yet)
      });
      if (extErr) console.error(`Error inserting extension ${ext.data.id}:`, extErr);
      else console.log(`Updated Extension Tour: ${ext.data.id}`);

      // Insert Extension Days
      const extDaysPayload = ext.days.map(d => {
          // Mock locs
          const stopsData = d.stops.map(s => {
             // Try to find coords in existing map or default to 0
             // We can expand coordsByName.json later
             let lat = 0, lng=0;
             // quick lookup in coordsByName if exists
             if (coordsByName[s]) { lat = coordsByName[s][0]; lng = coordsByName[s][1]; }
             return { name: s, lat, lng };
          });
          
          return {
              tour_id: ext.data.id,
              row_type: 'day',
              day_number: d.day_number,
              overnight_city: d.overnight,
              day_title: d.morning.title, // Simplified title logic
              activities_data: {
                  morning: d.morning,
                  afternoon: d.afternoon
              },
              stops_data: stopsData
          };
      });

      // Clear old extension days
      await supabase.from('tour_days').delete().eq('tour_id', ext.data.id);
      
      const { error: dErr } = await supabase.from('tour_days').insert(extDaysPayload);
      if (dErr) console.error(`Error inserting days for ${ext.data.id}:`, dErr);
  }

  // 2. Process Info for Tour Days (Main Tour) 
  // ... (rest of the script for main tour days) ...


  // 2. Process Info for Tour Days
  let daysPayload = [];

  for (const [dayStr, stops] of Object.entries(stopsByDay)) {
    const dayNum = parseInt(dayStr);
    
    // Enrich stops with coords
    const stopsData = stops.map(stopName => {
      let coords = coordsByName[stopName];
      // Normalize coords from [lat,lng] or {lat, lng} or whatever
      let lat = 0, lng = 0;
      if (Array.isArray(coords) && coords.length >= 2) {
        lat = coords[0];
        lng = coords[1];
      }
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
      day_title: `Day ${dayNum}`, // Optional default title
      // day_date and others can be null for now
    });
  }

  // 3. Process Map Route
  try {
    const geojsonPath = path.join(__dirname, '../public/routes/madrid-lisbon.geojson');
    if (fs.existsSync(geojsonPath)) {
      const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
      daysPayload.push({
        tour_id: tourData.id,
        row_type: 'map',
        day_number: 0, // Special sorting for map
        stops_data: geojsonData, // Storing GeoJSON in stops_data as discussed
        day_title: 'Full Route Map'
      });
      console.log('Loaded map route geojson.');
    }
  } catch (e) {
    console.warn('Could not load map geojson, skipping map row', e);
  }

  // Clean existing rows for this tour to avoid duplicates if re-running
  await supabase.from('tour_days').delete().eq('tour_id', tourData.id);

  // Insert Days
  const { error: daysError } = await supabase
    .from('tour_days')
    .insert(daysPayload);

  if (daysError) {
    console.error('Error inserting days:', daysError);
  } else {
    console.log(`Successfully inserted ${daysPayload.length} rows into tour_days.`);
  }
}

run();
