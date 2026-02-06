// Centralized, minimal tours overview used by the InteractiveMap modal
// Keep this small and authoritative: id, title, year, cardImage (web path), stopsPath (for preview media)
export type TourOverview = {
  id: string;
  title: string;
  year: number;
  cardImage: string; // web-accessible path under /MEDIAWEB
  stopsPath?: string; // optional path to folder with stops/media used by preview
  description?: string;
  startDate?: string; // optional YYYY-MM start date (used for card display)
};

const tours: TourOverview[] = [
  // 2026
  {
    id: 'madrid-2026',
    title: 'MADRID TO LISBOA',
    year: 2026,
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/madrid.webp',
    startDate: '2026-03',
    stopsPath: 'Open Tours/MADRID TO LISBOA/MAIN TOUR/stops',
    description: `Explore the unkown areas of Southwest Iberia and get a glimpse of the 2 Capitals.
Visit Roman, Arab and Medieval Christian heritage.
Learn about the Dehesa Landscape and its unique millenial farming culture.
Get to know locals that preserve this area as what it is, a unique treasure that is yet to be discovered.
This area tends to have mild temperatures in Winter & Early Spring`
  },
  {
    id: 'porto-galicia-2026',
    title: 'PORTO & GALICIA',
    year: 2026,
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    startDate: '2026-04',
    stopsPath: 'Open Tours/PORTO & GALICIA/media',
    description: 'Discover the hidden corners of Northern Portugal and Spain’s Atlantic coast.'
  },
  {
    id: 'laos-vietnam-2026',
    title: 'LAOS & VIETNAM',
    year: 2026,
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/LAOS%20&%20VIETNAM/laos.webp',
    startDate: '2026-05',
    stopsPath: 'Open Tours/LAOS & VIETNAM/media'
  },
  {
    id: 'aus-nz-2026',
    title: 'NEW ZEALAND & AUSTRALIA',
    year: 2026,
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    startDate: '2026-09',
    stopsPath: 'Open Tours/NEW ZEALAND & AUSTRALIA/media'
  },

  // Lofoten summer 2026 only
  {
    id: 'lofo-summer-2026',
    title: 'LOFOTEN - SUMMER',
    year: 2026,
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
    startDate: '2026-07',
    stopsPath: 'Open Tours/lofoten/media'
  },

  // 2027
  { 
    id: 'lofo-winter-2027', 
    title: 'LOFOTEN - WINTER', 
    year: 2027, 
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/2027/lofowinter27.jpg', 
    stopsPath: '2027/lofowinter27_media', 
    startDate: '2027-01' 
  },
  { 
    id: 'madrid-2027', 
    title: 'MADRID TO LISBON (2027)', 
    year: 2027, 
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/2027/mad27.jpg', 
    stopsPath: '2027/mad27_media' 
  },
  { 
    id: 'porto-2027', 
    title: 'PORTO & GALICIA (2027)', 
    year: 2027, 
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/2027/por27.jpg', 
    stopsPath: '2027/por27_media' 
  },
  { 
    id: 'lofo-summer-2027', 
    title: 'LOFOTEN - SUMMER', 
    year: 2027, 
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/2027/lofosummer27.jpg', 
    stopsPath: '2027/lofosummer27_media', 
    startDate: '2027-07' 
  },
  { 
    id: 'laos-2027', 
    title: 'LAOS & VIETNAM (2027)', 
    year: 2027, 
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/2027/laos27.jpg', 
    stopsPath: '2027/laos27_media' 
  },
  { 
    id: 'aus-2027', 
    title: 'NEW ZEALAND & AUSTRALIA (2027)', 
    year: 2027, 
    cardImage: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/2027/aus27.jpg', 
    stopsPath: '2027/aus27_media' 
  }
];

export default tours;
