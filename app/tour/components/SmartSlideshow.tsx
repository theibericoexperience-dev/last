import React, { useState, useEffect, useRef } from 'react';
import { extractPlaceFromPath, toSentenceCase } from '../utils/media';

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
  // prevIndex: the slide that was showing before — kept rendered underneath so there is NEVER a black gap
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  // loadedSrc: src of the most-recently decoded image; compared against current.src to derive isCurrentLoaded
  // Using a string comparison instead of boolean avoids React stale-state races
  const [loadedSrc, setLoadedSrc] = useState<string>('');
  // Keep Image objects alive in memory so the browser won't evict them from cache between slides
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

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
      setCurrentIndex(prev => {
        setPrevIndex(prev);
        return (prev + 1) % images.length;
      });
    }, 6000); // matches Ken Burns duration so zoom completes before crossfade
    return () => clearInterval(interval);
  }, [images]);

  // Pre-load all images into memory cache so onLoad fires instantly for already-fetched assets
  useEffect(() => {
    images.forEach(img => {
      if (!imageCache.current.has(img.src)) {
        const el = new Image();
        el.src = img.src;
        imageCache.current.set(img.src, el);
      }
    });
  }, [images]);

  // If the incoming image is already in the preload cache, mark it loaded without waiting for onLoad
  useEffect(() => {
    const src = images[currentIndex]?.src;
    if (!src) return;
    const cached = imageCache.current.get(src);
    if (cached?.complete && cached.naturalHeight > 0) {
      setLoadedSrc(src);
    }
  }, [currentIndex, images]);

  if (images.length === 0) return <div className={`bg-gray-900 ${className}`} />;

  const current = images[currentIndex] || images[0];
  if (!current || !current.src) return <div className={`bg-gray-900 ${className}`} />;

  const prev = prevIndex !== null ? (images[prevIndex] ?? null) : null;
  // Derived from string comparison — never stale unlike a boolean flag
  const isCurrentLoaded = loadedSrc === current.src;

  // Determine whether this slideshow is being used for itinerary-specific media
  const isItineraryMode = Boolean(daySpecificMedia && daySpecificMedia.length > 0);

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

  // Ken Burns origin alternates per slide so each image pans from a different corner
  const transformOrigin = currentIndex % 2 === 0 ? '30% 30%' : '70% 70%';

  return (
    <div className={`relative overflow-hidden bg-gray-900 ${className} aspect-video`}>
      {/*
        Two-layer crossfade — prev stays fully visible underneath current.
        This guarantees zero black frames: if current hasn't loaded yet,
        prev fills the space. CSS @keyframes (not framer-motion) drives the
        Ken Burns zoom so it runs on the GPU compositor thread, never jank.
      */}

      {/* Layer 1 — previous slide, static, always opaque */}
      {prev && (
        <img
          src={prev.src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Layer 2 — current slide: fades in after onLoad, then Ken Burns begins */}
      <img
        key={current.src}
        src={current.src}
        alt="Slideshow"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: isCurrentLoaded ? 1 : 0,
          transition: 'opacity 0.9s ease',
          // Static scale before animation starts (matches the 'from' keyframe — no visual jump)
          transform: 'scale(1.08)',
          transformOrigin: disableZoom ? undefined : transformOrigin,
          // CSS animation runs entirely on the compositor thread — smooth at any frame rate
          animation: (!disableZoom && isCurrentLoaded) ? 'kenburns-slide 6s ease-out forwards' : 'none',
          willChange: 'transform, opacity',
        }}
        onLoad={() => setLoadedSrc(current.src)}
      />

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
