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
  <div className="w-full h-full flex flex-row items-start">

      {/* Página izquierda: texto - Fondo transparente */}
      <div className="flex-1 flex flex-col pt-4 px-6 lg:pt-6 lg:px-12 h-full overflow-hidden relative z-10">
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-sm text-left max-w-prose">
            <div className="text-black font-extrabold text-7xl mb-6">{year === 2021 ? '2021-22' : year}</div>
            <div className="space-y-4">
                {data && data.bullets && data.bullets.map((b, i) => (
                <p key={i} className="text-lg md:text-xl text-gray-800 leading-relaxed font-serif">{b}</p>
                ))}
            </div>
        </div>
      </div>

      {/* Página derecha: media + lista de hitos (sin carrusel) */}
      <div className="flex-1 flex flex-col py-6 px-6 lg:px-12 h-full overflow-hidden relative z-10">
         <div className="h-full flex flex-col gap-6">
             {/* Media container moved up */}
             <div 
                className="relative w-full overflow-hidden rounded-xl shadow-2xl bg-black shrink-0 border border-white/20"
                style={{ aspectRatio: '16/9', maxHeight: '40vh' }}
            >
                    {media && media.type === 'image' ? (
                    <img src={media.src} alt={`Year ${year}`} className="w-full h-full object-cover" />
                    ) : media ? (
                    <video ref={videoRef} src={media.src} className="w-full h-full object-cover" muted playsInline autoPlay loop />
                    ) : null}
            </div>

            {/* List of Hitos - Scrollable if needed */}
            {hitos.length > 0 && (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 bg-white/40 backdrop-blur-md rounded-xl p-6 border border-white/50 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 sticky top-0 bg-white/0 backdrop-blur-sm">Milestones</h4>
                    <ul className="space-y-3">
                        {hitos.map((hito, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-base text-gray-800 font-medium leading-snug p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <span className="text-xs font-bold text-gray-400 mt-1 min-w-[20px]">{idx + 1}.</span>
                                <span>{hito}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
         </div>
      </div>

      {/* Internal chevrons removed - managed by parent Modal */}
    </div>
  );
  });

