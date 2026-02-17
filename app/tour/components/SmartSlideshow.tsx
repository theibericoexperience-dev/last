import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseUrl } from '@/lib/media-resolver';
import { extractPlaceFromPath, toSentenceCase } from '../utils/media';
import { ChevronRightIcon } from '@heroicons/react/24/outline'; // Or similar

interface SmartSlideshowProps {
  basePath: string; // e.g. "Open Tours/MADRID TO LISBOA"
  className?: string;
  daySpecificMedia?: Array<{ type: 'image' | 'video', src: string; folder?: string; place?: string }>; // For Itinerary mode
  disableZoom?: boolean; // Disable Ken Burns effect
}

// Hardcoded for demo/MVP - in production this could come from a listBucket call if available publicly or pre-fetched
// For Madrid-Lisbon, we know some structure. 
// Since we don't have a "list bucket" API accessible from client anonymously easily without a function, 
// we might rely on a known list or just the day media if in Itinerary mode.
// 
// For "Summary" mode (overview), the user asked to show photos from "Open Tours/MADRID TO LISBOA".
// We will use a predefined list of high-quality assets or a prop.
// 
// Since we can't list files client-side easily without an API route, I will create a basic API route or helper.
// For now, let's assume we pass a list of images or fetch them.

const SmartSlideshow: React.FC<SmartSlideshowProps> = ({ basePath, className, daySpecificMedia, disableZoom }) => {
  const [images, setImages] = useState<Array<{ src: string; folder?: string; place?: string; width?: number; height?: number; isPortrait?: boolean }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // If we have specific media (Itinerary mode), use it
    if (daySpecificMedia && daySpecificMedia.length > 0) {
      // Preload itinerary images and detect orientation
      const load = async () => {
        let loaded = await Promise.all(daySpecificMedia.map(async (m: any) => {
          const src = m.src;
          const info = await new Promise<{ width: number; height: number }>((res) => {
            const img = new Image();
            img.src = src;
            img.onload = () => res({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
            img.onerror = () => res({ width: 1, height: 1 });
          });
          return {
            src,
            folder: m.folder || undefined,
            place: m.place || undefined,
            width: info.width,
            height: info.height,
            isPortrait: info.height > info.width * 1.05
          };
        }));
        // Exclude portrait images entirely as requested
        loaded = loaded.filter(l => !l.isPortrait);
        setImages(loaded);
      };
      load();
      return;
    }

    // Otherwise load "Open Tours" overview set.
    // Load images from the specified folders (randomized). The user requested images to be
    // chosen from these folders:
    // - Open Tours/MADRID TO LISBOA/activities
    // - Open Tours/MADRID TO LISBOA/Barcelona_Extension
    // - Open Tours/MADRID TO LISBOA/Azores_Extension
    // - Open Tours/MADRID TO LISBOA/sleeps
    // We will request the media list from the API and randomize the results.
    
    const fetchImages = async () => {
      try {
        // Query each folder separately and aggregate
        const folders = [
          `${basePath}/activities`,
          `${basePath}/Barcelona_Extension`,
          `${basePath}/Azores_Extension`,
          `${basePath}/sleeps`,
        ];
        const all: string[] = [];
        for (const folder of folders) {
          const res = await fetch(`/api/media/list?path=${encodeURIComponent(folder)}`);
          if (!res.ok) continue;
          const json = await res.json();
          const files = json.files || [];
          const imgs = files
            .filter((f: any) => /\.(jpg|jpeg|png|webp|avif)$/i.test((f.filename || f.path || '')))
            .map((f: any) => {
              const place = (f.metadata && (f.metadata.place || f.metadata.caption || f.metadata.title)) || f.caption || f.title || null;
              return { src: f.path, folder, place };
            });
          all.push(...imgs.map(i => JSON.stringify(i)));
        }
        // randomize and limit to a reasonable number (e.g., 12)
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j], all[i]];
        }
        const parsed = all.slice(0, 12).map(s => JSON.parse(s));
        const final = parsed.map((p: any) => p);
        // Preload to detect portrait orientation
        let loaded = await Promise.all(final.map(async (p: any) => {
          const src = p.src;
          const info = await new Promise<{ width: number; height: number }>((res) => {
            const img = new Image();
            img.src = src;
            img.onload = () => res({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
            img.onerror = () => res({ width: 1, height: 1 });
          });
          return { ...p, width: info.width, height: info.height, isPortrait: info.height > info.width * 1.05 };
        }));
        // Exclude portrait images entirely as requested
        loaded = loaded.filter(l => !l.isPortrait);
        if (loaded.length > 0) setImages(loaded);
        else setImages([]);
      } catch (e) {
         // Fallback
      }
    };
    fetchImages();
  }, [basePath, daySpecificMedia]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0) return <div className={`bg-gray-900 ${className}`} />;

  const current = images[currentIndex] || images[0];
  if (!current || !current.src) return <div className={`bg-gray-900 ${className}`} />;

  // Determine whether this slideshow is being used for itinerary-specific media
  const isItineraryMode = Boolean(daySpecificMedia && daySpecificMedia.length > 0);

  // Compute extension and place info, but only show overlays when in itinerary mode
  const isExtension = (current.folder || current.src || '').toLowerCase().includes('extension');
  const placeName = (current.place && String(current.place).trim()) ? String(current.place).trim() : extractPlaceFromPath(current.src);
  const placeDisplay = placeName ? placeName : null;
  let extensionName: string | null = null;
  if (isExtension) {
    const folder = current.folder || '';
    const folderName = folder.split('/').filter(Boolean).pop() || '';
    let name = folderName.replace(/[_\-\s]*extension[_\-\s]*$/i, '');
    name = name.replace(/[_\-\.\s]+/g, ' ').trim();
    extensionName = toSentenceCase(name) || null;
    if (extensionName === '') extensionName = null;
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <AnimatePresence>
        {/* If current is portrait and we have a group of >=2 consecutive portraits, render them stacked vertically */}
        {current.isPortrait ? (
          (() => {
            // collect portrait images starting at currentIndex (wrap around), skipping non-portraits
            const maxGroup = 4;
            const group: typeof current[] = [];
            for (let i = 0; i < images.length && group.length < maxGroup; i++) {
              const idx = (currentIndex + i) % images.length;
              const img = images[idx];
              if (img && img.isPortrait) {
                group.push(img);
              } else {
                // skip non-portraits but keep scanning to find more portraits
                continue;
              }
            }
            if (group.length >= 2) {
              return (
                <motion.div key={group.map(g => g.src).join('|')} className="absolute inset-0 w-full h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {group.map((g, i) => {
                    const gPlace = (g.place && String(g.place).trim()) ? String(g.place).trim() : extractPlaceFromPath(g.src);
                    return (
                      <div key={g.src} style={{ height: `${100 / group.length}%` }} className="w-full relative overflow-hidden">
                        <img src={g.src} alt={`slideshow-${i}`} className="w-full h-full object-cover" />
                        {isItineraryMode && gPlace && (
                          <div className="absolute bottom-3 left-3 z-50 text-white pointer-events-none">
                            <div className="text-sm md:text-base font-bold drop-shadow-lg">{gPlace}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              );
            }
            // not enough portrait images to fill the vertical space: fall back to single image
            return (
              <motion.img
                key={current.src}
                src={current.src}
                alt="Slideshow"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ scale: disableZoom ? 1 : 1.1, opacity: 0 }}
                animate={{ 
                  scale: 1.0, 
                  opacity: 1, 
                  transition: { 
                    scale: { duration: disableZoom ? 0 : 8, ease: "linear" }, 
                    opacity: { duration: 1.2 } 
                  } 
                }}
                exit={{ opacity: 0, transition: { duration: 1.2 } }}
              />
            );
          })()
        ) : (
          <motion.img
            key={current.src}
            src={current.src}
            alt="Slideshow"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: disableZoom ? 1 : 1.1, opacity: 0 }}
            animate={{ 
              scale: 1.0, 
              opacity: 1, 
              transition: { 
                scale: { duration: disableZoom ? 0 : 8, ease: "linear" }, 
                opacity: { duration: 1.2 } 
              } 
            }}
            exit={{ opacity: 0, transition: { duration: 1.2 } }}
          />
        )}
      </AnimatePresence>
      
      {/* Place name overlay (show only in itinerary mode) */}
      {isItineraryMode && placeDisplay && (
        <div className="absolute bottom-12 left-4 text-white z-50 pointer-events-none">
          <div className="text-2xl md:text-3xl font-bold drop-shadow-lg">{placeDisplay}</div>
        </div>
      )}

      {/* Extension badge (show only in itinerary mode) */}
      {isItineraryMode && isExtension && (
        <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-lg">
          Extension{extensionName ? ` · ${extensionName}` : ''}
        </div>
      )}
    </div>
  );
};

export default SmartSlideshow;
