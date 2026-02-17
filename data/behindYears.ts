export type YearData = {
  year: number;
  title?: string;
  paragraphs: string[];
  media?: string; // path to video or image
  hitos: string[];
};

export const behindYears: YearData[] = [
  {
    year: 2021,
    title: '2021',
    paragraphs: [
      `For his final degree project, Ramiro launched what is now Ibero, a travel agency dedicated to showcasing the hidden gems of Extremadura and Alentejo.`
    ],
    media: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/YEARS%20MEDIA/2021.mp4',
    hitos: ['1st website', '1st promotional videos & contact with other agencies']
  },
  {
    year: 2022,
    title: '2022',
    paragraphs: [
  `From 2022 onward, Ramiro’s professional experience as a guide and tour organizer grew rapidly. In 2022, he led two classic car tours with the British and Swedish Rolls Royce and Jaguar Clubs under the organization of the Madrid-based agency Classics On The Road. That same year, he began collaborating with Education First (EF) www.eftours.com, guiding more than ten U.S and Canadian high school tours and showing over 300 students and teachers the cultural richness of Spain, Portugal, and Italy.`
    ],
    media: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/YEARS%20MEDIA/2022.mp4',
    hitos: ['100 customers led in 5 tours', '3 High Schools (USA)', '4 Classic Cars Groups']
  },
  {
    year: 2023,
    title: '2023',
    paragraphs: [
      `In April 2023, Ibero creates an itinerary for the U.S. agency I, Like You, Tours, with 17 years of experience operating tours in Morocco. After validating the area, the tour is promoted locally in the US thanks to Dean Rhodes Community in Goshen. More than 50 travelers signed up for 2024's inaugural editions.`,
      `Ramiro leads other 2 US High Schools Tours for EF during May & June. During the Winter Season, Ramiro worked as a guide in Lapland, leading Northern Lights hunts, snowmobile rides, husky farm visits, and tours of Santa Claus Village in Rovaniemi. His closest friend Carlos, that has just become an official Pharmacist, decides to join Ramiro in the adventure.`
    ],
    media: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/YEARS%20MEDIA/2023.mov',
    hitos: ['Ibero & I, Like You, Tours create 2 groups for 2024 (50 travellers)', '60 US students led in 2 tours for Education First', 'Over 300 customers served in Lapland in different tour packages']
  },
  {
    year: 2024,
    title: '2024',
    paragraphs: [
      `In 2024, Ibero successfully organized and led its first two annual tours, visiting Vidal, María, Toni, and many friends who contributed to unforgettable experiences. Some travelers also enjoyed optional extensions to the Azores and Lisbon. Ramiro travels in India for 5 weeks and British Columbia for 3 in order to search potential destinations.`,
      `During Summer Ramiro leads 3 US High Schools Tours for EF and a new itinerary—Porto to Galicia, later called Borderlands North—began development in partnership with I, Like You, Tours. Several scouting trips were completed. Dean promotes Borderlands 3.0 for 2025. Meanwhile, Carlos has stayed in Lapland during the Spring Season and decides to travel Thailand, Laos & Vietnam for over 6 months.`,
      `During Winter, Ramiro joined the Logistics Team at SternerMarket in Bern, Switzerland for the winter season, helping build and run one of the country’s most iconic Christmas events—an experience that welcomes over 200,000 guests every year. Carlos decides to spend another Winter Season in Lapland and keep becoming more expert in Northern Lights Photo Tours.`
    ],
    media: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/YEARS%20MEDIA/2024.webp',
    hitos: ['First 50 Ibero customers travel the Borderlands itinerary', 'Scouting trips to Porto, Galicia, India, Thailand, Laos, Vietnam', '90 US students led in 2 tours for Education First', 'Over 300 customers served in Lapland by Carlos', 'Ibero gathers another group for 2025', 'Ramiro learns about Massive Events Logistics in Switzerland']
  },
  {
    year: 2025,
    title: '2025',
    paragraphs: [
      `In 2025, Ibero ran its third Borderlands Tour and 2 tours for Canadian and US High Schools, in Barcelona, Southern Spain (Málaga, Sevilla, Córdoba) and Madrid & Toledo. Ramiro also led 2 customized tours for small groups of Australian and Canadian travelers. One of the journeys across Northern and Central Portugal—visiting Porto, Aveiro, Coimbra, Lisbon, Mérida and Andalusia. The trip in December took off in Madrid, continued to Toledo, Southern Spain & Morocco —on behalf of Juliá Travel.`,
      `During this same period, Ibero’s new website is completely re-designed to support its expanding portfolio of itineraries for 2026 & 2027.`
    ],
    media: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/YEARS%20MEDIA/2025.webp',
    hitos: ['Borderlands 3.0 successfully run during Easter Time', '1st Canadian High School and 1 US High School for Education First', 'New Itineraries for 2026 & 2027', 'Porto tour & Southern Spain tour led for Juliá Travel']
  }
];

export const yearsList = behindYears.map((y) => y.year);
