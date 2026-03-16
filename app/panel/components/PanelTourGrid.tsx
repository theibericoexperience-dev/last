"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarIcon, MapIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import tours, { TourOverview } from '@/data/toursOverview';
import mediaUrl from '@/lib/media/mediaUrl';

// Re-use image matching logic from main TourGrid
function getMediacardForTour(tour: TourOverview) {
  const lc = (tour.id || '').toLowerCase();
  const title = (tour.title || '').toLowerCase();
  const mapping: Record<string, string> = {
    'madrid': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/madrid.webp',
    'porto': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    'porto & galicia': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    'laos': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open%20Tours/LAOS%20&%20VIETNAM/laos.webp',
    'australia': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    'new zealand': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    'lofo': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
    'lofoten': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp'
  };

  for (const key of Object.keys(mapping)) {
    if (lc.includes(key) || title.includes(key)) return mapping[key];
  }
  const raw = tour.cardImage || 'mediacards/placeholder.jpg';
  return mediaUrl(raw) || `/${raw}`;
}

export default function PanelTourGrid({ maxHeight }: { maxHeight?: number | null }) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  
  const filteredTours = tours.filter((t) => t.year === selectedYear);

  return (
  <div 
    className="w-full mt-0 animate-in fade-in slide-in-from-top-4 duration-500 pb-16"
  >
      <div className="flex mb-3 relative items-center justify-center sm:justify-start mt-2.5 sm:mt-4">
        {/* Year Selector */}
        <div className="flex bg-slate-100 p-0.5 rounded-full z-10 w-fit items-center shadow-inner">
          {[2026, 2027].map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 sm:px-4 py-0 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-300 leading-none min-h-0 h-auto flex items-center justify-center ${
                selectedYear === year 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              style={{ paddingTop: '1px', paddingBottom: '1px' }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

  <div className="custom-panel-grid w-full">
        <style>{`
          .custom-panel-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 32px 16px;
            width: 100%;
            margin: 0 auto;
          }
          @media (max-width: 767px) { 
            .custom-panel-grid { 
              padding: 0;
              justify-content: center;
              justify-items: center;
            }
            .tour-card-mobile {
              width: 100% !important;
              max-width: 100% !important;
              flex: 1 !important;
            }
            .tour-card-image {
              position: absolute !important;
              inset: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
            }
          }
          @media (min-width: 768px) { 
            .custom-panel-grid { 
              grid-template-columns: repeat(3, 1fr); 
              gap: 24px;
            } 
          }
        `}</style>
        {filteredTours.map(tour => (
          <Link 
            href={`/tour/${tour.id}`} 
            key={tour.id}
            className="group relative flex flex-col rounded-xl overflow-hidden h-28 sm:h-36 md:h-40 border border-slate-200/50 shadow-sm hover:shadow-md hover:border-amber-400 transition-all duration-300 w-full tour-card-mobile"
          >
            <Image 
              src={getMediacardForTour(tour)}
              alt={tour.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out tour-card-image"
              sizes="(max-width: 767px) 50vw, 33vw"
              unoptimized
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 z-10" />
            
            <div className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-md text-slate-800 flex items-center gap-1 shadow-sm">
               <CalendarIcon className="w-3 h-3 text-amber-600 hidden sm:block" />
               {tour.startDate || 'TBA'}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 z-20 flex items-end justify-between">
               <h4 className="font-serif text-[11px] sm:text-sm md:text-base text-white font-bold leading-tight group-hover:text-amber-300 transition-colors line-clamp-2 drop-shadow-md pr-4">
                 {tour.title}
               </h4>
               <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white/80 group-hover:text-amber-300 transform group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
          </Link>
        ))}
        
        {filteredTours.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-slate-500">
             No open tours found for {selectedYear} yet. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}
