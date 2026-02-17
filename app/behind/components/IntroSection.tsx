"use client";
import React, { useRef } from 'react';
import { getSupabaseUrl } from '@/lib/media-resolver';

interface IntroSectionProps {
  phase: 'intro' | 'hero' | 'modal';
  setPhase: (p: 'intro' | 'hero' | 'modal') => void;
  inkRef: React.RefObject<HTMLVideoElement | null>;
  showBehindModal: boolean;
}

export function IntroSection({ phase, setPhase, inkRef, showBehindModal }: IntroSectionProps) {
  if (phase !== 'intro' && phase !== 'modal') return null;

  return (
    <div id="inkIntro" className={`absolute inset-0 ${showBehindModal ? 'z-30 bg-transparent' : 'z-40 bg-black'}`}>
      <video
        ref={inkRef}
        id="inkVideo"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200 opacity-100"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
      >
  {/* Replaced by explicit fast.last.webm per request */}
  <source src="https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/video%20behind%20last/tinta-behind-background-2x.webm" type="video/webm" />
      </video>

      <div className={`absolute inset-0 ${showBehindModal ? 'z-10' : 'z-50'} pointer-events-none`}>
        {/* Tag line */}
        <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)' }} className="pointer-events-none">
          <div className="tag mb-2 uppercase text-gray-200 text-4xl tracking-wider font-semibold">5 years in the making</div>
        </div>

        {/* Center Logo and Button */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} className="pointer-events-auto text-center">
          <div className="logo text-8xl font-extrabold tracking-tight mb-4 text-gray-200" style={{ transform: 'translateY(-120px)' }}>IBERO</div>
          {phase === 'intro' && (
            <div className="-mt-4">
              <button
                onClick={() => {
                  setPhase('hero');
                  try { if (inkRef.current) inkRef.current.pause(); } catch (e) {}
                }}
                className="px-6 py-2 rounded-full border-[0.5px] font-semibold text-gray-200 border-gray-200 bg-transparent hover:bg-white/10 transition"
              >
                START
              </button>
            </div>
          )}
          
          {/* Stats */}
          <div style={{ position: 'absolute', left: '50%', top: '6%', transform: 'translateX(-50%)' }} className="pointer-events-auto z-30 text-center w-[70vw] max-w-4xl mx-auto">
             <div className="flex items-center justify-center gap-8 whitespace-nowrap">
                <span className="text-xs md:text-sm text-gray-200 font-bold uppercase">+1000 CUSTOMERS SERVED</span>
                <span className="text-xs md:text-sm text-gray-200 font-bold uppercase">GROUP TRAVEL REIMAGINED</span>
                <span className="text-xs md:text-sm text-gray-200 font-bold uppercase">+25 COUNTRIES TRAVELED</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
