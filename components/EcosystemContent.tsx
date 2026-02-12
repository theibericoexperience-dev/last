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
  shortRole?: string;
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

export default function EcosystemContent({ mediaAutoplay = false }: { mediaAutoplay?: boolean } = {}) {
  const [tab, setTab] = useState<'team' | 'collaborators' | 'you'>('team');
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<'bio' | 'traveled' | 'lived'>('bio');

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
               <div className="w-24 h-24 rounded-2xl shadow-sm border border-white overflow-hidden group-hover:scale-105 transition-transform bg-white/5">
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
            <div className="flex flex-row gap-16 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 h-[600px]">
              {/* Profile Column */}
              <div className="flex flex-col items-start w-64 flex-shrink-0 pt-4 relative pl-8">
                <button 
                  onClick={() => setSelectedLeader(null)}
                  className="absolute -top-2 left-8 text-gray-900 hover:text-black flex items-center justify-center mb-4 transition-transform hover:-translate-x-1"
                  title="Back to list"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                </button>
                
                <img 
                  src={selectedLeader.image ? getSupabaseUrl(selectedLeader.image) : `https://ui-avatars.com/api/?name=${selectedLeader.name}&background=random`} 
                  alt={selectedLeader.name} 
                  className="w-24 h-24 object-cover rounded-2xl mb-6 shadow-sm border border-white mt-10" 
                />
                <h4 className="text-2xl font-serif font-bold text-gray-900 w-full text-left">{selectedLeader.name}</h4>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 w-full text-left">{selectedLeader.role}</div>
                <div className="text-xs text-gray-400 italic mb-10 w-full text-left">{selectedLeader.location}</div>
                
                <div className="flex flex-col gap-2 w-full">
                  <button onClick={() => setSelectedPanel('bio')} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${selectedPanel === 'bio' ? 'bg-black text-white shadow-md' : 'bg-white/50 text-gray-600 hover:bg-white'}`}>Biography</button>
                  <button onClick={() => setSelectedPanel('traveled')} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${selectedPanel === 'traveled' ? 'bg-black text-white shadow-md' : 'bg-white/50 text-gray-600 hover:bg-white'}`}>Traveled</button>
                  <button onClick={() => setSelectedPanel('lived')} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${selectedPanel === 'lived' ? 'bg-black text-white shadow-md' : 'bg-white/50 text-gray-600 hover:bg-white'}`}>Lived</button>
                </div>
              </div>

              {/* Content Column */}
              <div className="flex-1 pr-4 h-full overflow-y-auto custom-scrollbar">
                <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/50 shadow-sm min-h-full">
                  
                  {selectedPanel === 'bio' && (
                    <div className="space-y-6 animate-in fade-in duration-300 max-w-prose">
                        {selectedLeader.id === 'ramiro' ? (
                        <div className="text-gray-800 leading-relaxed font-serif text-lg">
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
                        <div className="pt-6 border-t border-gray-200/50">
                           <h5 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Passions</h5>
                           <div className="flex flex-wrap gap-2 text-sm">
                              {['Cooking', 'Exploring', 'Nature', 'Photography', 'History', 'Logistics'].map(p => (
                                 <span key={p} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-700 shadow-sm">{p}</span>
                              ))}
                           </div>
                        </div>
                        )}
                    </div>
                  )}

                  {selectedPanel === 'traveled' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                       <div className="h-96 w-full rounded-xl overflow-hidden border border-gray-200">
                         <InlineMap 
                            mode="overview"
                            points={[
                            "Portugal", "France", "Morocco", "Italy", "Slovakia", "Croatia", "Montenegro", 
                            "Czech Republic", "Austria", "Romania", "Germany", "Netherlands", "Belgium", 
                            "Luxembourg", "Latvia", "Russia", "Scotland", "England", "Ireland", "Canada", "Hungary",
                            "India", "USA", "Hainan", "Pingyao", "Shanghai", "Harbin", "Yunnan", "Guilin"
                            ].map(c => ({ coords: LOCATIONS[c], name: c })).filter(p => p.coords)}
                            showLabels={false}
                            fit="points"
                         />
                       </div>
                       
                       <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {[
                            "Portugal", "France", "Morocco", "Italy", "Slovakia", "Croatia", "Montenegro", 
                            "Czech Republic", "Austria", "Romania", "Germany", "Netherlands", "Belgium", 
                            "Luxembourg", "Latvia", "Russia", "Scotland", "England", "Ireland", "Canada", "Hungary",
                            "India", "China", "USA"
                          ].sort().map(country => (
                             <span key={country} className="text-sm font-serif text-gray-800 pb-1 border-b border-transparent hover:border-emerald-500 transition-colors cursor-default">
                                {country}
                             </span>
                          ))}
                       </div>
                    </div>
                  )}

                  {selectedPanel === 'lived' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                       <div className="h-96 w-full rounded-xl overflow-hidden border border-gray-200">
                         <InlineMap 
                            mode="overview"
                            points={[
                             "Switzerland", "Finland", "China", "South Korea", "USA"
                            ].map(c => ({ coords: LOCATIONS[c], name: c })).filter(p => p.coords)}
                            showLabels={false}
                            fit="points"
                         />
                       </div>
                       
                       <div className="flex flex-wrap gap-x-6 gap-y-2">
                          {[
                             "Switzerland", "Finland", "China", "South Korea", "USA"
                          ].sort().map(country => (
                             <span key={country} className="text-sm font-serif text-gray-800 pb-1 border-b border-transparent hover:border-blue-600 transition-colors cursor-default">
                                {country}
                             </span>
                          ))}
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
            <CollaboratorsList mediaAutoplay={mediaAutoplay} />
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

function CollaboratorsList({ mediaAutoplay = false }: { mediaAutoplay?: boolean } = {}) {
  // Use the BEHIND_OPTIMIZED/providers path which is now served from Supabase
  const path = 'providers';
  const files = useMediaList(path);
  // try to read metadata for captions if exists (optional)
  const metaUrl = getSupabaseUrl('providers/_meta.json');

  // Hooks must be declared unconditionally at the top of the component
  const [meta, setMeta] = useState<Record<string,string> | null>(null);
  const [index, setIndex] = useState(0);

  // accept mediaAutoplay prop for future use (not strictly necessary for static collaborators)
  // ...existing code...

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(metaUrl);
        if (!res.ok) return;
        const j = await res.json();
        if (mounted) setMeta(j);
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  // show 2 at a time with pagination controls (advance by 2 so pairs change together)
  const prev = () => setIndex(i => Math.max(0, i - 2));
  const next = () => setIndex(i => Math.min(Math.max(0, displayItems.length - 2), i + 2));

  // image error fallback: try multiple extensions before falling back to placeholder
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    try {
      const img = e.currentTarget as HTMLImageElement;
      tryImageFallback(img);
    } catch (err) {}
  };

  // Ordered list and captions provided by the user (fall back to files if available)
const ORDERED_COLLABORATORS = [
    { filename: 'MARIA-1.webp', person: 'MARIA', text: 'Collaborator' },
    { filename: 'RAMON.webp', person: 'RAMON', text: 'Collaborator' },
    { filename: 'TONI.webp', person: 'TONI', text: 'Collaborator' },
    { filename: 'KIERAN.webp', person: 'KIERAN', text: 'Collaborator' },
    { filename: 'JUANJO.webp', person: 'JUANJO', text: 'Collaborator' },
    { filename: 'HAFID.webp', person: 'HAFID', text: 'Collaborator' },
    { filename: 'YOUSSEF.webp', person: 'YOUSSEF', text: 'Collaborator' },
    { filename: 'MUSTAFA.webp', person: 'MUSTAFA', text: 'Collaborator' },
    { filename: 'OMAR.webp', person: 'OMAR', text: 'Collaborator' }
];  // helper: get base filename (no path, lowercased)
  const baseName = (p: string) => (p || '').split('/').pop()?.replace(/\.[^.]+$/, '')?.toLowerCase() || '';

  // Build display items in the requested order. 
  const displayItems = ORDERED_COLLABORATORS.map((o) => {
    const found = files.find(f => baseName(f.filename || f.path) === o.filename.replace(/\.[^.]+$/, '').toLowerCase());
    const path = found ? getSupabaseUrl(found.path || found.filename) : getSupabaseUrl('providers/' + o.filename);
    return { ...o, path };
  });

  // listen for global historyNav events (the portal chevrons dispatch these)
  useEffect(() => {
    const onNav = (e: any) => {
      if (e && e.detail) {
        if (e.detail === 'prev') prev();
        else if (e.detail === 'next') next();
      }
    };
    window.addEventListener('historyNav', onNav as EventListener);
    return () => window.removeEventListener('historyNav', onNav as EventListener);
  }, [displayItems]);

  const disabledPrev = index <= 0;
  const disabledNext = index + 2 >= displayItems.length;

  // Broadcast disabled state so external arrow controls (portal/fallback) can reflect it
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('historyState', { detail: { disabledPrev, disabledNext } }));
    } catch (e) {}
  }, [disabledPrev, disabledNext]);

  // Always render the displayItems (we use the manifest fallback paths when files are missing)
  return (
    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayItems.map((f) => (
          <div key={f.filename} className="bg-white p-4 rounded shadow-sm">
            <div className="flex items-start gap-4">
              <img
                src={f.path}
                onError={handleImgError}
                alt={f.person}
                className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-xl flex-shrink-0"
              />
              <div>
                <div className="font-semibold text-black">{f.person}</div>
                <div className="text-sm text-black/70 mt-1">{f.text}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YouGallery() {
  const files = useMediaList('YOU');
  if (!files || files.length === 0) return <div className="text-black/60">No "YOU" gallery found.</div>;
  return (
    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {files.map((f) => (
          <div key={f.path} className="bg-white rounded overflow-hidden">
            <img src={getSupabaseUrl(f.path)} alt={f.filename} className="w-full h-40 object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
