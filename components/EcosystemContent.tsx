"use client";

import React, { useState, useEffect } from 'react';
import { getTourMedia } from '@/lib/domain/media/api';
import { safeWebPath, tryImageFallback } from '@/app/tour/utils/media';
import { getSupabaseUrl } from '@/lib/media-resolver';

type MediaFile = { path: string; filename: string; caption?: string | null };

export default function EcosystemContent({ mediaAutoplay = false }: { mediaAutoplay?: boolean } = {}) {
  const [tab, setTab] = useState<'team' | 'collaborators' | 'you'>('collaborators');
  const [teamSubTab, setTeamSubTab] = useState<'founder' | 'collaborators' | 'you'>('founder');
  const [selectedPanel, setSelectedPanel] = useState<'bio' | 'passions' | 'traveled' | 'lived'>('bio');

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setTab('team')} className={`px-4 py-2 rounded ${tab === 'team' ? 'bg-transparent text-black' : 'bg-white text-black'}`}>Team</button>
        <button onClick={() => setTab('collaborators')} className={`px-4 py-2 rounded ${tab === 'collaborators' ? 'bg-transparent text-black' : 'bg-white text-black'}`}>Collaborators</button>
        <button onClick={() => setTab('you')} className={`px-4 py-2 rounded ${tab === 'you' ? 'bg-transparent text-black' : 'bg-white text-black'}`}>You</button>
      </div>

      <div className="mt-4">
        {tab === 'team' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center md:col-span-1">
                <img src={getSupabaseUrl('89df8474-1078-4a09-bbf8-a719c29b1b7c.webp')} alt="Ramiro profile" className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full mb-3" />
                <h4 className="font-semibold text-black">Ramiro</h4>
                <div className="text-sm text-black/80">Founder & Product</div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex gap-3 mb-3">
                  <button onClick={() => setSelectedPanel('bio')} className={`px-3 py-1 rounded ${selectedPanel === 'bio' ? 'bg-gray-900 text-white font-semibold' : 'bg-white text-black'}`}>Biography</button>
                  <button onClick={() => setSelectedPanel('passions')} className={`px-3 py-1 rounded ${selectedPanel === 'passions' ? 'bg-gray-900 text-white font-semibold' : 'bg-white text-black'}`}>Passions</button>
                  <button onClick={() => setSelectedPanel('traveled')} className={`px-3 py-1 rounded ${selectedPanel === 'traveled' ? 'bg-gray-900 text-white font-semibold' : 'bg-white text-black'}`}>Traveled</button>
                  <button onClick={() => setSelectedPanel('lived')} className={`px-3 py-1 rounded ${selectedPanel === 'lived' ? 'bg-gray-900 text-white font-semibold' : 'bg-white text-black'}`}>Lived</button>
                </div>

                <div className="bg-white p-4 rounded border min-h-[220px]">
                  {/* Biography or selected panel content */}
                  {selectedPanel === 'bio' && (
                    <div className="text-black leading-relaxed">
                      Ramiro was Born in Badajoz, the most populated town in the regioon of Extremadura, Spain. Located only 5 minutes away from Portugal, he grew up in Badajoz until the age of 16. He already ahd explored some European Countries with his family & friends. He gpt the chance to study in summer in a Scottish High School with other international students and that's when he decided he wanted to earn more about the world. He was accepted in a Chinese HIgh School thanks to the AFS organization, and had the opportunity to live with a Chinese famliy and attend schol for a year.

                      <br /><br />
                      After the exchange year in Harbin, China, Ramiro finished the remaining 2 years of Spanish High School and enrolled in the LEINN International Bachelors Degree. He was able to lead different initiatives with other entrepeneurs like him. The degree took part in Shanghai (3 months), Bilbao (1 year), Seattle (5 months due to Covid), Seoul (1 year) and Madrid (1 year).

                      <br /><br />
                      For his final degree project, Ramiro launched what is today Ibero, a travel agency aiming to showcase the true gems of Extremadura & Alentejo. Thanks to the warm support received by Ibero's first 200+ customers served during these years, Ibero now is launching other itineraries with the same passion and care as it has been handled in Spain & Portugal
                    </div>
                  )}

                  {selectedPanel === 'passions' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-black">
                      <div className="p-2 border rounded text-center">Cooking</div>
                      <div className="p-2 border rounded text-center">Exploring</div>
                      <div className="p-2 border rounded text-center">Nature</div>
                      <div className="p-2 border rounded text-center">Photography</div>
                    </div>
                  )}

                  {selectedPanel === 'traveled' && (
                    <div className="text-black leading-relaxed">
                      <ul className="list-disc list-inside">
                        <li>Portugal</li>
                        <li>France</li>
                        <li>Morocco</li>
                        <li>Italy</li>
                        <li>Slovakia</li>
                        <li>Croatia</li>
                        <li>Montenegro</li>
                        <li>Czech Republic</li>
                        <li>Austria</li>
                        <li>Romania</li>
                        <li>Germany</li>
                        <li>Netherlands</li>
                        <li>Belgium</li>
                        <li>Luxembourg</li>
                        <li>Latvia</li>
                        <li>Russia</li>
                        <li>Scotland</li>
                        <li>England</li>
                        <li>Ireland</li>
                        <li>Canada</li>
                        <li>Hungary</li>
                      </ul>
                    </div>
                  )}

                  {selectedPanel === 'lived' && (
                    <div className="text-black leading-relaxed">
                      <ul className="list-disc list-inside">
                        <li>Switzerland</li>
                        <li>Finland</li>
                        <li>China</li>
                        <li>South Korea</li>
                        <li>USA</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

  if (!files || files.length === 0) return <div className="text-black/60">No collaborators found.</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <button onClick={(e) => { e.stopPropagation(); if (!disabledPrev) prev(); }} disabled={disabledPrev} className={`p-2 bg-white border rounded ${disabledPrev ? 'opacity-40 cursor-not-allowed' : ''}`} aria-disabled={disabledPrev}>‹</button>
        <div className="flex-1 grid grid-cols-2 gap-6">
          {displayItems.slice(index, index + 2).map((f) => {
            return (
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
            );
          })}
        </div>
        <button onClick={(e) => { e.stopPropagation(); if (!disabledNext) next(); }} disabled={disabledNext} className={`p-2 bg-white border rounded ${disabledNext ? 'opacity-40 cursor-not-allowed' : ''}`} aria-disabled={disabledNext}>›</button>
      </div>

      {/* NOTE: 'YOU' gallery intentionally omitted here so 'behind' shows only collaborators */}
    </div>
  );
}

function YouGallery() {
  const files = useMediaList('YOU');
  if (!files || files.length === 0) return <div className="text-black/60">No "YOU" gallery found.</div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {files.map((f) => (
        <div key={f.path} className="bg-white rounded overflow-hidden">
          <img src={getSupabaseUrl(f.path)} alt={f.filename} className="w-full h-40 object-cover" />
        </div>
      ))}
    </div>
  );
}

// PlacesSection removed per user request
