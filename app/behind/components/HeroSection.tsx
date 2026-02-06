"use client";
import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { getSupabaseUrl } from '@/lib/media-resolver';
import { useRouter } from 'next/navigation';

interface HeroSectionProps {
  phase: 'intro' | 'hero' | 'modal';
  setBehindView: (v: 'history' | 'ecosystem') => void;
  setModalConfig: (c: any) => void;
  setShowBehindModal: (v: boolean) => void;
  behindView: 'history' | 'ecosystem';
}

export function HeroSection({
  phase,
  setBehindView,
  setModalConfig,
  setShowBehindModal,
  behindView,
}: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Scroll into view logic when entering hero phase
  useEffect(() => {
    if (phase === 'hero' && typeof window !== 'undefined') {
        setTimeout(() => {
            if (heroRef.current) {
                heroRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 40);
    }
  }, [phase]);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32">
        <div 
          ref={heroRef} 
          className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(.2,.9,.22,1)] ${phase === 'intro' ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0'}`}
        >
          <Image
            src={getSupabaseUrl('HERO-BEHIND.webp')}
            alt="IBERO Historia - Haruna"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Buttons */}
        <div style={{ position: 'absolute', top: '14vh', left: '50%', transform: 'translate(-50%, 0)' }} className={`z-50 transition-opacity ${phase === 'intro' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setBehindView('history');
                  setModalConfig({ background: 'hero', mediaAutoplay: true, view: 'history' });
                  requestAnimationFrame(() => { setShowBehindModal(true); });
                }}
                aria-pressed={behindView === 'history'}
                className={`px-6 py-3 rounded-full font-semibold border ${behindView === 'history' ? 'border-gray-900 bg-transparent text-white' : 'border-white/30 text-white bg-transparent hover:bg-white/5'}`}>
                History
              </button>
              <button
                onClick={() => {
                  setBehindView('ecosystem');
                  setModalConfig({ background: 'hero', mediaAutoplay: true, view: 'ecosystem' });
                  requestAnimationFrame(() => { setShowBehindModal(true); });
                }}
                aria-pressed={behindView === 'ecosystem'}
                className={`px-6 py-3 rounded-full font-semibold border ${behindView === 'ecosystem' ? 'border-gray-900 bg-transparent text-white' : 'border-white/30 text-white bg-transparent hover:bg-white/5'}`}>
                Ecosystem
              </button>
            </div>
        </div>

        <div
          onClick={() => router.push('/?section=tour-2026')}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center cursor-pointer pointer-events-auto z-40"
        >
          <div className="w-6 h-6 border-l-transparent border-r-transparent border-t-2 border-white transform rotate--25 animate-bounce" />
        </div>
    </section>
  );
}
