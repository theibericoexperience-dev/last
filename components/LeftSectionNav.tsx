"use client";

import React from 'react';

export default function LeftSectionNav({
  activeSectionId,
  goToAction,
}: {
  activeSectionId: string | null;
  goToAction: (id: string) => void;
}) {
  const FULL_IDS = ['hero-section', 'tour-2026', 'tour-2027', 'join-club'];
  const TIMELINE_ITEMS = ['tour-2026', 'tour-2027', 'join-club'];
  const LABELS: Record<string, string> = {
    'hero-section': 'Home',
    'tour-2026': '2026',
    'tour-2027': '2027',
    'join-club': 'Club',
  };

  const currentIdx = Math.max(0, FULL_IDS.indexOf(activeSectionId || 'hero-section'));
  const prevId = currentIdx > 0 ? FULL_IDS[currentIdx - 1] : null;
  const nextId = currentIdx < FULL_IDS.length - 1 ? FULL_IDS[currentIdx + 1] : null;

  return (
    <div className="left-section-nav fixed left-8 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500" style={{ background: 'transparent' }}>
      {/* Prev Arrow */}
      <button
        onClick={() => prevId && goToAction(prevId)}
        disabled={!prevId}
        aria-label="Previous section"
        className={`transition-all duration-300 p-2 ${!prevId ? 'opacity-0 pointer-events-none' : 'text-white/40 hover:text-white hover:-translate-y-1'}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Timeline List */}
      <div className="flex flex-col items-center">
         {TIMELINE_ITEMS.map((id, index) => {
           const isActive = activeSectionId === id;
           return (
             <React.Fragment key={id}>
               {/* Connecting Line */}
               {index > 0 && <div className="w-px h-32 bg-black/10" />}
               
               <button
                  onClick={() => goToAction(id)}
                  className="group relative py-2 flex items-center justify-center outline-none"
               >
                  {/* Active Indicator / Dot */}
                  <div className={`rounded-full transition-all duration-300 z-10 ${isActive ? 'w-2 h-2 bg-black ring-4 ring-black/10 scale-125' : 'w-1.5 h-1.5 bg-transparent border border-black/30 group-hover:bg-black/40'}`} />
                  
                  {/* Floating Label (Bottom side) - Always visible, simple fade */}
                  <span className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-bold tracking-[0.2em] md:tracking-[0.25em] uppercase whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-black' : 'text-black/50 group-hover:text-black/80'}`}>
                    {LABELS[id]}
                  </span>
               </button>
             </React.Fragment>
           )
         })}
      </div>

      {/* Next Arrow */}
      <button
        onClick={() => nextId && goToAction(nextId)}
        disabled={!nextId}
        aria-label="Next section"
        className={`transition-all duration-300 p-2 ${!nextId ? 'opacity-0 pointer-events-none' : 'text-black/40 hover:text-black hover:translate-y-1'}`}
      >
         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
