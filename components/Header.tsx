"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TransitionLink, useLoader } from './GlobalLoaderProvider';
import { publishLandingOpenServices } from '@/lib/navigation/intents';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Header({
  transparent,
  onOpenToursAction,
  compactMenuOnly,
  activeGridView,
}: {
  transparent?: boolean;
  onOpenRegisterAction?: () => void;
  onOpenToursAction?: () => void;
  compactMenuOnly?: boolean;
  activeGridView?: 'tours' | 'services' | null;
} = {}) {
  const pathname = usePathname();
  const { startLoading } = useLoader();

  const [isIberoOpen, setIsIberoOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const iberoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // panels state (driven by sweep/components)
  const [servicesOpen, setServicesOpen] = useState(false);
  const [toursOpen, setToursOpen] = useState(false);
  const [hasEverActivated, setHasEverActivated] = useState(false);
  
  const desktopActivated = isDesktop && (hasEverActivated || servicesOpen || toursOpen);

  const activeItemClass = desktopActivated ? 'text-amber-600' : 'text-amber-300';
  const inactiveItemClass = desktopActivated ? 'text-black hover:text-black' : 'text-white/70 hover:text-white';

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const handleServices = (e: any) => setServicesOpen(!!e.detail?.open);
    const handleTours = (e: any) => setToursOpen(!!e.detail?.open);
    window.addEventListener('landing-services-state', handleServices);
    window.addEventListener('landing-tours-state', handleTours);
    return () => {
      window.removeEventListener('landing-services-state', handleServices);
      window.removeEventListener('landing-tours-state', handleTours);
    };
  }, []);

  useEffect(() => {
    // isIberoOpen and moreOpen excluded intentionally: hovering these should not collapse the
    // header nor hide the hero buttons. Only sweep panels actually opening collapse the header.
    if (isDesktop && (servicesOpen || toursOpen)) {
      setHasEverActivated(true);
    }
  }, [isDesktop, servicesOpen, toursOpen]);

  const handleOpenTours = () => {
    if (onOpenToursAction) onOpenToursAction();
    else {
      try { document.getElementById('tour-2026')?.scrollIntoView({ behavior: 'smooth' }); } catch {}
    }
    setIsIberoOpen(false);
    setMoreOpen(false);
  };

  return (
    <header
      data-ibero-header
      className={`fixed left-0 right-0 z-[1000] transition-all duration-300 ease-in-out ${
        desktopActivated 
          ? 'top-0 bg-white border-b border-black/10 h-10 py-1 text-black' 
          : (compactMenuOnly ? 'top-2 md:top-6' : transparent ? 'top-6' : 'top-4') + ' bg-transparent h-14 text-white'
      }`}
    >
      <div className="w-full px-4 lg:px-8 h-full relative">
        <div className="h-full flex items-center justify-center">
          {/* Left: OPEN TOURS */}
          <div className="flex justify-start w-1/3">
            {pathname === '/' ? (
              <a 
                href="#tour-2026" 
                onClick={(e) => { 
                  e.preventDefault();
                  if (toursOpen) return; // already in the open sweep — do nothing
                  document.getElementById('tour-2026')?.scrollIntoView({ behavior: 'smooth' }); 
                }} 
                className={`${desktopActivated ? 'text-black text-[14px]' : 'text-white text-base md:text-xl'} font-extrabold uppercase tracking-wider transition-all duration-300`}
              >
                OPEN TOURS
              </a>
            ) : (
              <TransitionLink 
                href="/destinations" 
                className={`${desktopActivated ? 'text-black text-[14px]' : 'text-white text-base md:text-xl'} font-extrabold uppercase tracking-wider transition-all duration-300`}
              >
                OPEN TOURS
              </TransitionLink>
            )}
          </div>

          {/* Center: IBERO */}
          <div className="flex justify-center w-1/3">
            <div
              className="relative pb-3"
              onMouseEnter={() => {
                if (iberoCloseTimerRef.current) clearTimeout(iberoCloseTimerRef.current);
                setIsIberoOpen(true);
              }}
              onMouseLeave={() => {
                iberoCloseTimerRef.current = setTimeout(() => setIsIberoOpen(false), 300);
              }}
            >
              <button 
                className={`${desktopActivated ? 'text-black text-[16px] font-bold' : 'text-white font-normal'} uppercase tracking-tighter text-center flex items-center justify-center transition-all duration-300`}
                style={!desktopActivated ? { fontSize: 'clamp(1.6rem, 4.6vw, 2.8rem)' } : {}}
              >
                IBERO
                <ChevronDownIcon className={`inline-block ml-1 ${desktopActivated ? 'w-3 h-3 text-black' : 'w-6 h-6 text-white/50'} transition-transform ${isIberoOpen ? 'rotate-180' : ''}`} />
              </button>

              {isIberoOpen && (
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[220px] ${desktopActivated ? 'bg-white border border-black/10 shadow-xl text-black' : 'bg-black/85 border border-white/10 text-white'} rounded-xl py-2 px-3 z-[1001]`}>
                  <button onClick={() => handleOpenTours()} className={`${desktopActivated ? 'text-[14px]' : 'text-sm'} ${activeGridView === 'tours' ? activeItemClass : inactiveItemClass} w-full py-1 text-center font-extrabold uppercase`}>Tours</button>
                  <button onClick={() => { publishLandingOpenServices(); setIsIberoOpen(false); }} className={`${desktopActivated ? 'text-[14px]' : 'text-sm'} ${activeGridView === 'services' ? activeItemClass : inactiveItemClass} w-full py-1 text-center font-extrabold uppercase`}>Services</button>
                  <Link href="/behind" onClick={() => setIsIberoOpen(false)} className={`${desktopActivated ? 'text-[14px]' : 'text-sm'} ${inactiveItemClass} block w-full text-center py-1 font-extrabold uppercase`}>About Us</Link>
                  <Link href="/panel" onClick={() => setIsIberoOpen(false)} className={`${desktopActivated ? 'text-[14px]' : 'text-sm'} ${inactiveItemClass} block w-full text-center py-1 font-extrabold uppercase`}>Dashboard</Link>
                </div>
              )}
            </div>
          </div>

          {/* Right: MORE */}
          <div className="flex justify-end w-1/3">
            <div
              className="relative pb-3"
              onMouseEnter={() => {
                if (moreCloseTimerRef.current) clearTimeout(moreCloseTimerRef.current);
                setMoreOpen(true);
              }}
              onMouseLeave={() => {
                moreCloseTimerRef.current = setTimeout(() => setMoreOpen(false), 300);
              }}
            >
              <button 
                onClick={() => setMoreOpen((s) => !s)} 
                className={`${desktopActivated ? 'text-black text-[14px]' : 'text-white text-base md:text-xl'} font-extrabold uppercase tracking-wider flex items-center transition-all duration-300`}
              >
                MORE
                <ChevronDownIcon className={`inline-block ml-1 ${desktopActivated ? 'w-3 h-3 text-black' : 'w-5 h-5 text-white/50'} transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div className={`absolute right-0 top-full mt-3 w-[200px] ${desktopActivated ? 'bg-white border border-black/10 shadow-xl text-black' : 'bg-black/85 border border-white/10 text-white'} rounded-xl py-2 px-3 z-[1001]`}>
                  <Link href="/behind" onClick={() => setMoreOpen(false)} className={`${desktopActivated ? 'text-[14px]' : 'text-sm'} ${inactiveItemClass} block w-full text-left py-1 font-extrabold uppercase`}>About Us</Link>
                  <Link href="/panel" onClick={() => setMoreOpen(false)} className={`${desktopActivated ? 'text-[14px]' : 'text-sm'} ${inactiveItemClass} block w-full text-left py-1 font-extrabold uppercase`}>Dashboard</Link>
                  <div className={`my-1 border-t ${desktopActivated ? 'border-black/10' : 'border-white/10'}`} />
                  <Link href="/legal?tab=guarantee" onClick={() => setMoreOpen(false)} className={`${desktopActivated ? 'text-[14px]' : 'text-sm'} ${inactiveItemClass} block w-full text-left py-1 font-extrabold uppercase`}>Legal Info</Link>
                  <Link href="/legal?tab=privacy" onClick={() => setMoreOpen(false)} className={`${desktopActivated ? 'text-[14px]' : 'text-sm'} ${inactiveItemClass} block w-full text-left py-1 font-extrabold uppercase`}>Privacy Policy</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
