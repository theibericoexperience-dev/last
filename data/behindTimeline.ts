import { getSupabaseUrl } from '@/lib/media-resolver';

export type MediaItem = {
  type: 'video' | 'image';
  src: string;
  alt?: string;
};

export type Year = {
  year: number;
  bullets: string[];
  media: MediaItem[];
};

export const years: Year[] = [
  {
    year: 2021,
    bullets: [
      'For his final degree project, Ramiro launched what is now Ibero, a travel agency dedicated to showcasing the hidden gems of Extremadura and Alentejo.'
    ],
    media: [
      { type: 'video', src: getSupabaseUrl('YEARS MEDIA/2022.mp4'), alt: 'Video 2021-22' }
    ]
  },
  {
    year: 2022,
    bullets: [
      'From 2022 onward, Ramiro’s professional experience as a guide and tour organizer grew rapidly. In 2022, he led two classic car tours with the British and Swedish Rolls Royce and Jaguar Clubs under the organization of the Madrid-based agency Classics On The Road. That same year, he began collaborating with Education First (EF) (www.eftours.com), guiding more than ten U.S. and Canadian high school tours and showing over 300 students and teachers the cultural richness of Spain, Portugal, and Italy.'
    ],
    media: [
      { type: 'video', src: getSupabaseUrl('YEARS MEDIA/2022.mp4'), alt: 'Video 2022' }
    ]
  },
  {
    year: 2023,
    bullets: [
      'In April 2023, Ibero creates an itinerary for the U.S. agency I, Like You, Tours, with 17 years of experience operating tours in Morocco. After validating the area, the tour is promoted locally in the US thanks to Dean Rhodes Community in Goshen. More than 50 travelers signed up for 2024\'s inaugural editions.',
      'Ramiro leads other 2 US High Schools Tours for EF during May & June.',
      'During the Winter Season, Ramiro worked as a guide in Lapland, leading Northern Lights hunts, snowmobile rides, husky farm visits, and tours of Santa Claus Village in Rovaniemi.',
      'Carlos, a close friend who recently graduated as a pharmacist, joins Ramiro in the adventure.'
    ],
    media: [
      { type: 'video', src: getSupabaseUrl('YEARS MEDIA/2023.mov'), alt: 'Video 2023' }
    ]
  },
  {
    year: 2024,
    bullets: [
      'In 2024, Ibero successfully organized and led its first two annual tours, visiting Vidal, María, Toni, and many friends who contributed to unforgettable experiences. Some travelers also enjoyed optional extensions to the Azores and Lisbon.',
      'Ramiro travels in India for 5 weeks and British Columbia for 3 in order to search potential destinations. During Summer Ramiro leads 3 US High Schools Tours for EF and a new itinerary—Porto to Galicia, later called Borderlands North—began development in partnership with I, Like You, Tours.'
    ],
    media: [
      { type: 'image', src: getSupabaseUrl('YEARS MEDIA/2024.webp'), alt: 'Foto 2024' }
    ]
  },
  {
    year: 2025,
    bullets: [
      'In 2025, Ibero ran its third Borderlands Tour and 2 tours for Canadian and US High Schools in Barcelona, Southern Spain (Málaga, Sevilla, Córdoba) and Madrid & Toledo. Ramiro also led 2 customized tours for small groups of Australian and Canadian travelers. One of the journeys across Northern and Central Portugal—visiting Porto, Aveiro, Coimbra, Lisbon, Mérida and Andalusia. The trip in December took off in Madrid, continued to Toledo —on behalf of Juliá Travel.',
      'Ibero\'s new website is completely re-designed to support its expanding portfolio of itineraries for 2026 & 2027.'
    ],
    media: [
      { type: 'image', src: getSupabaseUrl('YEARS MEDIA/2025.webp'), alt: 'Foto 2025' }
    ]
  }
];
