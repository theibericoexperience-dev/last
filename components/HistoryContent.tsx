"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { years as YEARS_DATA, Year } from '../data/behindTimeline';
import { behindYears as BEHIND_YEARS } from '../data/behindYears';
import { getSupabaseUrl } from '@/lib/media-resolver';

type MediaItem = { type: 'video' | 'image'; src: string; alt?: string };

// HistoryContent: self-contained history modal content with local navigation and absolute chevrons.
type HistoryState = { disabledPrev: boolean; disabledNext: boolean; year: number };

export type HistoryHandle = {
  next: () => void;
  prev: () => void;
  getYear: () => number;
  isPrevDisabled: () => boolean;
  isNextDisabled: () => boolean;
};

export default forwardRef<
  HistoryHandle,
  {
    initialYear?: number;
    mediaAutoplay?: boolean;
    onStateChange?: (s: HistoryState) => void;
    onYearSelected?: (y: number) => void;
    onAdvanceBeyondLast?: () => void;
  }
>(
  function HistoryContent({ initialYear = 2021, mediaAutoplay = false, onStateChange, onYearSelected, onAdvanceBeyondLast }, ref) {
  const years = YEARS_DATA;

  // modalYears intentionally omits 2022 (we show combined 2021-22 as 2021).
  const modalYears = useMemo(() => years.map((y) => y.year).filter((y) => y !== 2022), [years]);
  const mappedInitial = initialYear === 2022 ? 2021 : initialYear;
  const initialIndex = Math.max(0, modalYears.indexOf(mappedInitial));

  // single source of truth for current index
  const [modalIndex, setModalIndex] = useState<number>(initialIndex);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // HistoryContent is autonomous: no parent callback is required when year changes.

  // Note: we intentionally do NOT auto-sync `initialYear` after mount. initialYear
  // is used only to set the initial index. Keeping the modalIndex fully local
  // avoids double updates and race conditions that caused desynchronization.

  const yearMediaMap: Record<number, { type: 'video' | 'image'; src: string }> = {
    2021: { type: 'video', src: getSupabaseUrl('YEARS MEDIA/2022.mp4') },
    2022: { type: 'video', src: getSupabaseUrl('YEARS MEDIA/2022.mp4') },
    2023: { type: 'video', src: getSupabaseUrl('YEARS MEDIA/2023.mov') },
    2024: { type: 'image', src: getSupabaseUrl('YEARS MEDIA/2024.webp') },
    2025: { type: 'image', src: getSupabaseUrl('YEARS MEDIA/2025.webp') },
  };

  // Carga previa de siguiente asset
  useEffect(() => {
     // Preload next year media
     const nextIdx = modalIndex + 1;
     if (nextIdx < modalYears.length) {
       const nextYear = modalYears[nextIdx];
       const nextMedia = yearMediaMap[nextYear];
       if (nextMedia?.type === 'video') {
         const link = document.createElement('link');
         link.rel = 'preload';
         link.as = 'video';
         link.href = nextMedia.src;
         document.head.appendChild(link);
         return () => { document.head.removeChild(link); };
       } else if (nextMedia?.type === 'image') {
          const img = new Image();
          img.src = nextMedia.src;
       }
     }
  }, [modalIndex, modalYears]); // Added yearMediaMap to dependencies implicitly via closure but it's constant

  useEffect(() => {
    if (!mediaAutoplay) return;
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.autoplay = true;
    v.playsInline = true;
    v.preload = "auto"; // Force preload
    try {
      // Small delay to ensure render
      const playPromise = v.play();
      if (playPromise !== undefined) {
         playPromise.catch(() => {
           // Auto-play was prevented
         });
      }
    } catch (err) {
      console.error('video load/play error', err);
    }
  }, [mediaAutoplay, modalIndex]);

  const next = () => {
    setModalIndex((i) => {
      if (i >= modalYears.length - 1) {
        try {
          if (typeof onAdvanceBeyondLast === 'function') onAdvanceBeyondLast();
        } catch (e) {}
        return i;
      }
      return Math.min(modalYears.length - 1, i + 1);
    });
  };
  const prev = () => setModalIndex((i) => Math.max(0, i - 1));

  // expose imperative handlers to parent via ref so external chevrons can call next/prev
  useImperativeHandle(ref, () => ({
    next,
    prev,
    getYear: () => modalYears[modalIndex],
    isPrevDisabled: () => modalIndex <= 0,
    isNextDisabled: () => modalIndex >= modalYears.length - 1,
  }), [modalIndex, modalYears]);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // disabled state derived from modalIndex
  const disabledPrev = modalIndex <= 0;
  const disabledNext = modalIndex >= modalYears.length - 1;

  // Notify parent via callbacks when modalIndex changes. This keeps History autonomous
  // but allows the page to react (e.g., disable external chevrons) via props.
  useEffect(() => {
    try {
      const selectedYear = modalYears[modalIndex];
      if (typeof onStateChange === 'function') {
        onStateChange({ disabledPrev, disabledNext, year: selectedYear });
      }
      if (typeof onYearSelected === 'function') {
        onYearSelected(selectedYear);
      }
    } catch (e) {
      // don't throw — keep UI stable
      // but avoid silently swallowing developer errors
      // console.error(e);
    }
  }, [modalIndex, disabledPrev, disabledNext, modalYears, onStateChange, onYearSelected]);

  const year = modalYears[modalIndex];

  // Merge 2021 and 2022 content when showing combined view
  let data: Year | undefined = years.find((y) => y.year === year);
  let media: MediaItem | undefined = undefined;
  // prefer explicit HITOS mapping to ensure consistent presentation
  const HITOS: Record<number, string[]> = {
    2021: [
      "1st website",
      "1st promotional videos & contact with other agencies",
      "100 customers led in 5 tours",
      "3 High Schools (USA)",
      "4 Classic Cars Groups"
    ],
    2022: [],
    2023: [
      "Ibero & I, like you, tours are able to create 2 groups for 2024 (50 travellers)",
      "60 US students led in 2 tours for Education First",
      "Over 300 customers served in Lapland in different tour packages"
    ],
    2024: [
      "First 50 Ibero's customers travel the Borderlands itinerary",
      "Scouting trips to Porto, Galicia, India, Thailand, Laos, Vietnam",
      "90 US students led in 2 tours for Education First",
      "Over 300 customers served in Lapland by Carlos",
      "Ibero is able to gather another group for 2025",
      "Ramiro works in Events Logistics in Switzerland during Christmas"
    ],
    2025: [
      "Borderland 3.0 is successfully run during Easter Time",
      "1st Canadian High School and 1 US High School for Education First",
      "New Itineraries for 2026 & 2027",
      "Porto tour & Southern Spain tour led for Juliá Travel"
    ]
  };

  let hitos: string[] = [];

  if (year === 2021) {
    const data2021 = years.find((y) => y.year === 2021);
    const data2022 = years.find((y) => y.year === 2022);
    const mergedBullets = [...(data2021?.bullets || []), ...(data2022?.bullets || [])];
    const mergedMedia = [...(data2022?.media || []), ...(data2021?.media || [])];
    data = { year: 2021, bullets: mergedBullets, media: mergedMedia } as Year;
    media = mergedMedia && mergedMedia.length ? mergedMedia[0] : yearMediaMap[2021];
    // prefer HITOS mapping, fallback to data file
    const hitos2021 = HITOS[2021] || BEHIND_YEARS.find((b) => b.year === 2021)?.hitos || [];
    const hitos2022 = HITOS[2022] || BEHIND_YEARS.find((b) => b.year === 2022)?.hitos || [];
    hitos = [...hitos2021, ...hitos2022];
  } else {
    data = years.find((y) => y.year === year);
    media = data && data.media && data.media.length ? data.media[0] : yearMediaMap[year];
    hitos = HITOS[year] || BEHIND_YEARS.find((b) => b.year === year)?.hitos || [];
  }

  // If year is 2023/2024/2025, prefer the text from behindYears data (already updated in data/behindYears.ts)

  // local state for single-hito navigation
  const [hitoIndex, setHitoIndex] = useState<number>(0);

  // reset hitoIndex whenever the year changes
  useEffect(() => {
    setHitoIndex(0);
  }, [year]);

  const hitoPrev = () => setHitoIndex((i) => Math.max(0, i - 1));
  const hitoNext = () => setHitoIndex((i) => Math.min(hitos.length - 1, i + 1));

  const hitoDisabledPrev = hitoIndex <= 0;
  const hitoDisabledNext = hitoIndex >= Math.max(0, hitos.length - 1);

  return (
  <div className="w-full h-[80vh] max-h-[80vh] overflow-hidden flex flex-row">

      {/* Página izquierda: texto */}
  <div className="flex-1 flex flex-col p-6 bg-white h-full overflow-hidden justify-start">
    <div className="text-black font-extrabold text-6xl mb-4">{year === 2021 ? '2021-22' : year}</div>
        {data && data.bullets && data.bullets.map((b, i) => (
          <div key={i} className="p-3"><p className="text-black leading-relaxed">{b}</p></div>
        ))}
      </div>

      {/* Página derecha: media/hitos */}
  <div className="flex-1 flex flex-col justify-center py-8 px-8 bg-white h-full overflow-hidden">
    <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <div 
        className="relative w-full overflow-hidden rounded-lg shadow-xl bg-black"
        style={{ aspectRatio: '21/9', maxHeight: '30vh' }} // Formato cinemático aún más reducido
      >
            {media && media.type === 'image' ? (
              <img src={media.src} alt={`Year ${year}`} className="w-full h-full object-cover" />
            ) : media ? (
              <video ref={videoRef} src={media.src} className="w-full h-full object-cover" muted playsInline autoPlay loop />
            ) : null}
          </div>

          {hitos.length > 0 && (
            <div className="bg-white p-3 rounded-md w-[480px] mx-auto flex-none overflow-hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={hitoPrev}
                  disabled={hitoDisabledPrev}
                  aria-label="Previous hito"
                  className={`px-2 py-1 rounded-md text-sm font-semibold border ${hitoDisabledPrev ? 'opacity-40 pointer-events-none' : 'border-gray-200 hover:bg-gray-50'}`}>
                  ‹
                </button>

                <div className="flex-1 text-center text-base md:text-lg text-gray-800 px-2">
                  <div className="font-medium text-lg leading-tight">{hitos[hitoIndex]}</div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="text-xs text-gray-500">{`${hitoIndex + 1} / ${hitos.length}`}</div>
                  <button
                    onClick={hitoNext}
                    disabled={hitoDisabledNext}
                    aria-label="Next hito"
                    className={`mt-1 px-2 py-1 rounded-md text-sm font-semibold border ${hitoDisabledNext ? 'opacity-40 pointer-events-none' : 'border-gray-200 hover:bg-gray-50'}`}>
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* internal chevrons removed - use external portal chevrons in page */}
    </div>
  );
  });

