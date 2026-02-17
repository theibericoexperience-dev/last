"use client";

import React, { useState, useEffect } from 'react';
import { getSupabaseUrl } from '@/lib/media-resolver';
import { tryImageFallback } from '@/app/tour/utils/media';
import InlineMap from './InlineMap';

const LOCATIONS: Record<string, [number, number]> = {
  // EUROPE
  "Portugal": [39.55, -7.83],
  "Spain": [40.46, -3.74],
  "France": [46.22, 2.21],
  "Italy": [41.87, 12.56],
  "Germany": [51.16, 10.45],
  "Netherlands": [52.13, 5.29],
  "Belgium": [50.5, 4.46],
  "Luxembourg": [49.81, 6.12],
  "Switzerland": [46.81, 8.22],
  "Austria": [47.51, 14.55],
  "Czech Republic": [49.81, 15.47],
  "Slovakia": [48.66, 19.69],
  "Hungary": [47.16, 19.50],
  "Croatia": [45.10, 15.20],
  "Montenegro": [42.70, 19.37],
  "Romania": [45.94, 24.96],
  "Latvia": [56.87, 24.60],
  "Russia": [55.75, 37.61], // Moscow
  "Scotland": [56.49, -4.20],
  "England": [52.35, -1.17],
  "Ireland": [53.41, -8.24],
  "Finland": [61.92, 25.74],
  
  // AFRICA
  "Morocco": [31.79, -7.09],
  
  // AMERICAS
  "USA": [47.60, -122.33], // Seattle
  "Canada": [56.13, -106.34],
  
  // ASIA
  "China": [35.86, 104.19],
  "India": [20.59, 78.96],
  "Hainan": [19.20, 109.60],
  "Pingyao": [37.20, 112.18],
  "Shanghai": [31.23, 121.47],
  "Harbin": [45.80, 126.53],
  "Yunnan": [25.04, 102.71],
  "Guilin": [25.26, 110.29],
  "South Korea": [35.90, 127.76],
};

type Leader = {
  id: string;
  name: string;
  role: string;
  location: string;
  image?: string;
}

const LEADERS: Leader[] = [
  {
    id: 'ramiro',
    name: 'Ramiro',
    role: 'Founder, Global Product, Leader',
    location: 'Extremadura, Spain',
    image: '89df8474-1078-4a09-bbf8-a719c29b1b7c.webp'
  },
  {
    id: 'belen',
    name: 'Belen',
    role: 'Tour Support, Dancer & Mathematician', 
    location: 'Extremadura, Spain',
  },
  {
    id: 'carlos',
    name: 'Carlos',
    role: 'Leader, Lapland & South-East Asia',
    location: 'Extremadura, Spain',
  },
  {
    id: 'nacho',
    name: 'Nacho',
    role: 'Leader, Sailor in Norway',
    location: 'Andalucia, Spain',
  }
];

// Constants for Map Logic
const TRAVELED_COUNTRIES = [
   "Portugal", "France", "Morocco", "Italy", "Slovakia", "Croatia", "Montenegro", 
   "Czech Republic", "Austria", "Romania", "Germany", "Netherlands", "Belgium", 
   "Luxembourg", "Latvia", "Russia", "Scotland", "England", "Ireland", "Canada", "Hungary",
   "India", "USA", "Hainan", "Pingyao", "Shanghai", "Harbin", "Yunnan", "Guilin"
];

const LIVED_COUNTRIES = [
   "Switzerland", "Finland", "China", "South Korea", "USA"
];

export default function EcosystemContent({ mediaAutoplay = false }: { mediaAutoplay?: boolean } = {}) {
  const [tab, setTab] = useState<'team' | 'collaborators' | 'you'>('team');
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<'bio' | 'map'>('bio');

  return (
    <div className="space-y-6 h-full flex flex-col">

      <div className="flex-shrink-0 flex items-center justify-center gap-2">
        <button onClick={() => setTab('team')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${tab === 'team' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black hover:bg-black/5'}`}>Leaders</button> 
        <button onClick={() => setTab('collaborators')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${tab === 'collaborators' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black hover:bg-black/5'}`}>Collaborators</button>
        <button onClick={() => setTab('you')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${tab === 'you' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black hover:bg-black/5'}`}>You</button>
      </div>

      <div className="flex-1 pr-2">
        {tab === 'team' && (
          <div className="space-y-6">
            {!selectedLeader ? (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4">
                  {LEADERS.map(leader => (
                    <button 
                      key={leader.id} 
                      onClick={() => setSelectedLeader(leader)}
                      className="group flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-black/5 transition-all"
                    >
               <div className="w-36 h-36 rounded-2xl shadow-sm border border-white overflow-hidden group-hover:scale-105 transition-transform bg-white/5">
                <img 
                  src={leader.image ? getSupabaseUrl(leader.image) : `https://ui-avatars.com/api/?name=${leader.name}&background=random`} 
                  alt={leader.name}
                  className="w-full h-full object-cover"
                />
               </div>
                       <div>
                          <div className="font-serif font-bold text-lg text-gray-900 group-hover:text-black">{leader.name}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1 mb-1">{leader.role}</div>
                          <div className="text-xs text-gray-400 italic">{leader.location}</div>
                       </div>
                    </button>
                  ))}
               </div>
            ) : (
            <div className="relative flex flex-row gap-4 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 w-full mb-2 pl-4 md:pl-8 overflow-hidden">
              {/* Profile Column - Sticky */}
              <div className="flex flex-col items-center w-64 xl:w-72 flex-shrink-0 sticky top-10 self-start mt-[-10px]">
                
                {/* Back Button - Positioned absolutely relative to the sticky container */}
                <button
                  onClick={() => setSelectedLeader(null)}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center text-black bg-white/40 hover:bg-white/60 backdrop-blur-md px-3 py-1 rounded-full transition-all border border-white/20 hover:border-white/40 z-50 hover:-translate-y-1 shadow-sm whitespace-nowrap"
                  title="Back to list"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
                </button>

                <div className="w-full max-h-[calc(100vh-6rem)] overflow-y-auto hide-scrollbar pt-2 pr-2 pb-10 flex flex-col items-center">
                  <div className="w-full relative mb-4 flex justify-center">
                    <div className="relative group w-32 h-32">
                      <div className="absolute inset-0 bg-blue-500/10 rounded-2xl scale-95 group-hover:scale-105 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                      <img 
                        src={selectedLeader.image ? getSupabaseUrl(selectedLeader.image) : `https://ui-avatars.com/api/?name=${selectedLeader.name}&background=random`} 
                        alt={selectedLeader.name} 
                        className="w-full h-full object-cover rounded-2xl shadow-sm border border-gray-100 relative z-10" 
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col items-center text-center space-y-1 mb-6 px-2 w-full">
                    <h4 className="text-2xl font-serif font-bold text-gray-900 leading-tight">{selectedLeader.name}</h4>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{selectedLeader.role}</div>
                    <div className="text-xs text-gray-400 font-medium">{selectedLeader.location}</div>
                  </div>
                
                  <nav className="flex flex-col gap-1 w-full">
                    <button onClick={() => setSelectedPanel('bio')} className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${selectedPanel === 'bio' ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                      <span>Biography</span>
                      {selectedPanel === 'bio' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                    <button onClick={() => setSelectedPanel('map')} className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${selectedPanel === 'map' ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                      <span>Living & Travelling</span>
                      {selectedPanel === 'map' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  </nav>
                </div> {/* End of scrollable container */}
              </div> {/* End of sticky column */}

              {/* Content Column */}
              <div className="flex-1 h-full pt-0 overflow-hidden flex justify-center">
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white/60 min-h-[340px] h-full w-full max-w-5xl flex flex-col overflow-y-auto hide-scrollbar overflow-x-hidden">
                  
                  {selectedPanel === 'bio' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {selectedLeader.id === 'ramiro' ? (
                        <div className="text-gray-800 leading-8 font-serif text-lg space-y-6 border-l-4 border-blue-500/30 pl-4">
                          <p className="mb-4">
                            Ramiro was born in Badajoz, the most populated town in the region of Extremadura, Spain. Located only 5 minutes away from Portugal, he grew up exploring the borderlands until the age of 16. After exploring various European countries with family & friends, a summer exchange in Scotland sparked his desire to learn more about the world. He was later accepted into a Chinese High School via the AFS organization, living with a host family in Harbin for a year.
                          </p>
                          <p className="mb-4">
                            After China, he completed his studies and enrolled in the LEINN International Bachelors Degree, leading entrepreneurial initiatives in Shanghai, Bilbao, Seattle, Seoul, and Madrid.
                          </p>
                          <p>
                            For his final project, Ramiro launched what is today Ibero, a travel agency aiming to showcase the true gems of Extremadura & Alentejo. Thanks to the support of Ibero's first 200+ customers, the agency now launches expanded itineraries with the same passion and care.
                          </p>
                        </div>
                        ) : (
                          <div className="text-gray-500 italic text-center py-10">
                            Biography for {selectedLeader.name} coming soon...
                          </div>
                        )}
                        
                        {/* Merged Passions Section */}
                        {selectedLeader.id === 'ramiro' && (
                          <div className="pt-10 border-t border-gray-200/60 mt-8">
                             <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Passions</h5>
                             <div className="flex flex-wrap gap-3">
                                {['Cooking', 'Exploring', 'Nature', 'Photography', 'History', 'Logistics'].map(p => (
                                   <span key={p} className="px-5 py-2 bg-white/80 border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:shadow-md transition-all cursor-default">{p}</span>
                                ))}
                             </div>
                          </div>
                        )}
                    </div>
                  )}

                  {selectedPanel === 'map' && (
                    <div className="flex flex-col h-full animate-in fade-in duration-300">
                       <div className="flex-1 min-h-[20rem] basis-0 w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner mb-4 bg-[#aad3df]">
                         <InlineMap 
                            mode="overview"
                            points={[
                              ...TRAVELED_COUNTRIES.map(c => ({ coords: LOCATIONS[c], name: c, type: 'traveled' })).filter(p => p.coords),
                              ...LIVED_COUNTRIES.map(c => ({ coords: LOCATIONS[c], name: c, type: 'lived' })).filter(p => p.coords)
                            ] as any}
                            showLabels={false}
                            fit="points"
                            minZoom={3} // Increased minimum zoom to prevent gray areas on wider screens
                            maxZoom={5} // Slightly more zoom allowed
                         />
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-4 2xl:gap-8 pt-2 flex-shrink-0">
                          <div>
                             <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-3 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
                                Traveled
                             </h5>
                             <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {TRAVELED_COUNTRIES.filter(c => !LIVED_COUNTRIES.includes(c)).sort().map(country => (
                                  <span key={country} className="text-sm font-serif text-gray-800 pb-0.5 border-b border-transparent hover:border-emerald-500 transition-colors cursor-default">
                                      {country}
                                  </span>
                                ))}
                             </div>
                          </div>

                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-3 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>
                              Lived
                            </h5>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {LIVED_COUNTRIES.sort().map(country => (
                                  <span key={country} className="text-sm font-serif text-gray-800 pb-0.5 border-b border-transparent hover:border-blue-600 transition-colors cursor-default">
                                      {country}
                                  </span>
                                ))}
                            </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        )}


        {tab === 'collaborators' && (
          <div className="space-y-4">
            {/* load and show collaborators from MEDIAWEB/BEHIND/providers */}
            <CollaboratorsList />
          </div>
        )}

        {tab === 'you' && (
          <div className="space-y-4">
            <YouGallery />
          </div>
        )}

  {/* Places section required by design. Do not show while viewing collaborators to avoid mixing content */}
  {/* PlacesSection removed per request */}
      </div>
    </div>
  );
}

/**
 * Hook to fetch images from a folder path via our manifest-backed API.
 * Uses the list route: /api/media/list?path=...
 */
function useMediaList(path: string) {
  const [files, setFiles] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/media/list?path=${encodeURIComponent(path)}`);
        if (!res.ok) {
          if (mounted) setFiles([]);
          return;
        }
        const data = await res.json();
        if (mounted) {
          // The API returns { ok: true, files: [...] }
          let fileArray = [];
          if (data && data.ok && Array.isArray(data.files)) {
            fileArray = data.files;
          } else if (Array.isArray(data)) {
            fileArray = data;
          }
          setFiles(fileArray);
        }
      } catch (err) {}
    })();
    return () => { mounted = false; };
  }, [path]);
  return files;
}

function CollaboratorsList() {
  const path = 'providers';
  const files = useMediaList(path);

  // Specific collaborators requested by user
  const ORDERED_COLLABORATORS = [
    { 
      filename: 'MARIA-1.webp', 
      person: 'Maria', 
      role: 'Chef',
      text: "Maria, a local chef from Inner Alentejo, she evokes in her original recipes ingredients and techniques that were popular among the Romans that used to rule this part of Iberia."
    },
    { 
      // explicit public URL provided by user
      path: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/BEHIND_OPTIMIZED/providers/IMG_3685.webp',
      filename: 'TONI.webp', 
      person: 'Toni', 
      role: 'Shepperd & Cheese Maker',
      text: "Toni, who used to work in IT and decided to approach the shepherd's lifestyle, he receives us in his farm and takes us on a short hike with his goats, and lets us try homemade cheese and local treats."
    },
    {
      path: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/BEHIND_OPTIMIZED/providers/VIDAL.webp',
      filename: 'VIDAL.webp',
      person: 'Vidal',
      role: 'Dehesa Estate Owner',
      text: "Vidal, a dehesa estate owner, has bred the invaluable ibérico and retinto breeds for over 50 years and is now retired. He welcomed us and showed us the dehesa's millennial farming techniques and treated us to a traditional western Spanish rice meal (black rice)."
    },
    {
      path: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/BEHIND_OPTIMIZED/providers/isabe%20bottle-1.webp',
      filename: 'ISABEL.webp',
      person: 'Isabel',
      role: 'Restaurant Owner',
      text: "Isabel runs a local restaurant in Monsaraz and cooks traditional family meals from Inner Alentejo. She is the warmest cook around!"
    },
    {
      path: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/BEHIND_OPTIMIZED/providers/antonio.webp',
      filename: 'ANTONIO.webp',
      person: 'Antonio',
      role: 'Historian in Extremadura',
      text: "Antonio is one of the most knowledgeable historians in Extremadura, and he is always ready to lead wonderful walking tours with many discoveries."
    },
    {
      path: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/BEHIND_OPTIMIZED/providers/IMG_4275.webp',
      filename: 'RENACER.webp',
      person: 'Renacer',
      role: 'Folklore Group',
      text: "One of Spain's finest folklore groups, they are very connected with Ibero's mission of showcasing to the world the true gems of Extremadura & Alentejo."
    },
    {
      path: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/BEHIND_OPTIMIZED/nelson.webp',
      filename: 'NELSON.webp',
      person: 'Nelson',
      role: "Alentejo Local Expert",
      text: "Nelson's expertise in the Alentejo Region helps us dive faster into its History & Culture"
    },
    {
      path: 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/BEHIND_OPTIMIZED/providers/53606291333_aa65f02d0b_o.webp',
      filename: 'JOAO.webp',
      person: 'Joao',
      role: 'Local in Salvaterra',
      text: "Joao used to help, as a kid, smuggle coffee from Portugal to Spain during Salazar's and Franco's dictatorships."
    }
  ];

  // helper: get base filename (no path, lowercased)
  const baseName = (p: string) => (p || '').split('/').pop()?.replace(/\.[^.]+$/, '')?.toLowerCase() || '';

  const displayItems = ORDERED_COLLABORATORS.map((o) => {
    // If collaborator already provides a 'path' (absolute URL), prefer it.
    if (o.path) return { ...o };
    const found = files.find(f => baseName(f.filename || f.path) === o.filename.replace(/\.[^.]+$/, '').toLowerCase());
    const path = found ? getSupabaseUrl(found.path || found.filename) : getSupabaseUrl('providers/' + o.filename);
    return { ...o, path };
  });

  return (
    <div className="px-4 pb-10 flex justify-center">
      <div className="max-w-7xl w-full">

        {/* outer scroll container showing approx 4 items; intro paragraph is inside so it scrolls with the items */}
        <div className="max-h-[calc(4*13rem)] overflow-y-auto hide-scrollbar pb-40 space-y-6">
          <p className="text-center text-gray-700 text-base max-w-4xl mx-auto">
            Our tours offer a true glimpse of the people that live in the area where Ibero travels, here you can learn a little about some of the people that make the Highlights of Ibero Open Tours
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14">
            {displayItems.map((item, idx) => (
              <div key={idx} className="group flex flex-row items-center gap-8 p-6 rounded-[2rem] hover:bg-white/40 transition-colors border border-transparent hover:border-white/20">
                {/* Photo Column - Reduced height portrait */}
                <div className="w-56 flex-shrink-0">
                  <div className="rounded-2xl overflow-hidden shadow-lg bg-gray-100 relative group-hover:-translate-y-1 transition-transform duration-500 h-40">
                    <img 
                      src={item.path} 
                      alt={item.person}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${item.person}&background=random&size=256`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>
                </div>
                
                {/* Text Column - Slightly wider: Name + Title in one line, and larger explanatory text */}
                <div className="w-80">
                   <h3 className="font-serif font-bold text-2xl text-gray-900 mb-3 flex items-center gap-3 overflow-hidden">
                     <span className="whitespace-nowrap truncate">{item.person}</span>
                     <span className="font-normal text-lg text-gray-700 whitespace-nowrap truncate">- {item.role}</span>
                   </h3>
                   <p className="text-base leading-relaxed text-gray-700 font-medium font-serif border-l-4 border-blue-500/30 pl-4 py-1">
                     {item.text}
                   </p>
                </div>
              </div>
            ))}
          </div>
          {/* spacer so last row can be scrolled fully into view */}
          <div className="h-40 md:h-48" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function YouGallery() {
  const files = useMediaList('YOU');
  const [showGallery, setShowGallery] = useState(false);
  if (!files || files.length === 0) return <div className="text-black/60">No "YOU" gallery found.</div>;

  // chunk files into pages of 8 images
  const perPage = 8;
  const pages: any[] = [];
  for (let i = 0; i < files.length; i += perPage) pages.push(files.slice(i, i + perPage));

  if (!showGallery) {
    // initial view: intro text + a single small row of images + 'See gallery' CTA
    const preview = files.slice(0, Math.min(4, files.length));
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <p className="text-gray-700 text-base leading-relaxed">
          We can't finish this section without reminding that it is you, the one who places the trust in Ibero, that makes this a reality. An authentic tour, where the only purpose is to bring alive the culture and history of these regions, in a way that you will always remember and feel part of.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {preview.map((f: any) => (
            <div key={f.path} className="bg-white rounded overflow-hidden h-40">
              <img src={getSupabaseUrl(f.path)} alt={f.filename} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowGallery(true)} className="text-sm font-semibold text-blue-600 hover:underline">- see gallery</button>
        </div>
      </div>
    );
  }

  // full gallery: show inside the same centered container as the preview (max-w-4xl)
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="max-h-[80vh] overflow-y-auto custom-scrollbar space-y-6">
        <p className="text-gray-700 text-base leading-relaxed">
          We can't finish this section without reminding that it is you, the one who places the trust in Ibero, that makes this a reality. An authentic tour, where the only purpose is to bring alive the culture and history of these regions, in a way that you will always remember and feel part of.
        </p>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowGallery(false)} className="text-sm font-semibold text-blue-600 hover:underline">hide gallery</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {files.map((f: any) => (
            <div key={f.path} className="bg-white rounded overflow-hidden h-40">
              <img src={getSupabaseUrl(f.path)} alt={f.filename} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* spacer to allow final row to scroll into view fully */}
        <div className="h-20" aria-hidden />
      </div>
    </div>
  );
}
