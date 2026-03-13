"use client";
import Link from 'next/link';
import { TransitionLink, useLoader } from './GlobalLoaderProvider';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { publishLandingOpenServices } from '@/lib/navigation/intents';
// UserMenu removed from header to avoid duplicate user controls; floating user button is kept elsewhere
import { ChevronDownIcon, GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LegalSection from '@/app/panel/components/LegalSection';

export default function Header({
  transparent,
  onOpenRegisterAction,
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
  const [isIberoOpen, setIsIberoOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();
  const { startLoading } = useLoader();
  const [isPending, startTransition] = useTransition();
  const moreRef = useRef<HTMLDivElement>(null);
  const iberoRef = useRef<HTMLDivElement>(null);
  const moreCloseTimeoutRef = useRef<number | null>(null);
  const iberoCloseTimeoutRef = useRef<number | null>(null);
  const mobileIberoRef = useRef<HTMLButtonElement | null>(null);
  const [mobileMenuLeft, setMobileMenuLeft] = useState<number | null>(null);

  const handleGoTo2026 = () => {
    const el = document.getElementById('tour-2026');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsIberoOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track whether we're on desktop (lg) to enable hover-to-open behavior
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, []);

  // Close desktop "More" dropdown when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  // Close IBERO dropdown when clicking outside
  useEffect(() => {
    if (!isIberoOpen) return;
    const handler = (e: MouseEvent) => {
      if (iberoRef.current && !iberoRef.current.contains(e.target as Node)) setIsIberoOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isIberoOpen]);

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const handleIberoMouseEnter = () => {
    if (!isDesktop) return;
    if (iberoCloseTimeoutRef.current) {
      clearTimeout(iberoCloseTimeoutRef.current);
      iberoCloseTimeoutRef.current = null;
    }
    setIsIberoOpen(true);
  };
  const handleIberoMouseLeave = () => {
    if (!isDesktop) return;
    // small delay so user can move pointer into the dropdown without it disappearing
    if (iberoCloseTimeoutRef.current) clearTimeout(iberoCloseTimeoutRef.current);
    iberoCloseTimeoutRef.current = window.setTimeout(() => {
      setIsIberoOpen(false);
      iberoCloseTimeoutRef.current = null;
    }, 180);
  };

  const handleMoreMouseEnter = () => {
    if (!isDesktop) return;
    if (moreCloseTimeoutRef.current) {
      clearTimeout(moreCloseTimeoutRef.current);
      moreCloseTimeoutRef.current = null;
    }
    setMoreOpen(true);
  };
  const handleMoreMouseLeave = () => {
    if (!isDesktop) return;
    // small delay to allow pointer to move into the dropdown
    if (moreCloseTimeoutRef.current) clearTimeout(moreCloseTimeoutRef.current);
    moreCloseTimeoutRef.current = window.setTimeout(() => {
      setMoreOpen(false);
      moreCloseTimeoutRef.current = null;
    }, 180);
  };

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (moreCloseTimeoutRef.current) clearTimeout(moreCloseTimeoutRef.current);
      if (iberoCloseTimeoutRef.current) clearTimeout(iberoCloseTimeoutRef.current);
    };
  }, []);

  const closeAllMenus = () => {
    setIsIberoOpen(false);
    setActiveDropdown(null);
    setMoreOpen(false);
  };

  const topClass = transparent ? 'top-8' : 'top-4';
  const activeItemClass = 'text-amber-300';
  const inactiveItemClass = 'text-white/70 hover:text-white';

  return (
    <>
  <header data-ibero-header="true" className={`fixed ${compactMenuOnly ? 'top-2 md:top-6' : transparent ? 'top-6' : 'top-4'} left-0 right-0 z-50 transition-all duration-500 ease-in-out h-14 ${transparent ? 'bg-transparent backdrop-blur-none border-0' : 'bg-transparent backdrop-blur-sm'}`}>
      <div className="w-full px-4 lg:px-8 h-full relative">
        <div className={`h-full flex items-center ${compactMenuOnly ? 'justify-center' : 'justify-center lg:justify-center'}`}>

          {compactMenuOnly && (
            <div className="flex items-center justify-center w-full">
              <div className="relative" ref={moreRef}>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMoreOpen(!moreOpen); }}
                  className="text-white font-normal no-underline uppercase text-5xl md:text-5xl tracking-tighter leading-none flex items-center gap-2"
                >
                  IBERO
                  <ChevronDownIcon className={`w-4 h-4 text-white/50 transition-transform duration-300 ${moreOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreOpen && (
                  <div className="ibero-menu absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] bg-black/85 border border-white/10 rounded-xl py-2 px-3 text-center flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <button onClick={() => { setMoreOpen(false); onOpenToursAction?.(); }} className={`${activeGridView === 'tours' ? activeItemClass : inactiveItemClass} font-extrabold uppercase tracking-wider text-base md:text-lg transition-colors w-full text-center py-1`}>
                      Tours
                    </button>
                    <button onClick={() => { setMoreOpen(false); publishLandingOpenServices(); }} className={`${activeGridView === 'services' ? activeItemClass : inactiveItemClass} font-extrabold uppercase tracking-wider text-base md:text-lg transition-colors w-full text-center py-1`}>
                      Services
                    </button>
                    <TransitionLink href="/behind" className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors w-full text-center py-1`} onClick={() => setMoreOpen(false)}>
                      About Us
                    </TransitionLink>
                    <TransitionLink href="/panel" className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors w-full text-center py-1`} onClick={() => setMoreOpen(false)}>
                      Dashboard
                    </TransitionLink>
                    <button onClick={() => { setMoreOpen(false); setLegalOpen(true); }} className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors w-full text-center py-1`}>
                      Legal Info
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!compactMenuOnly && (
          <>
          {/* ═══ MOBILE: Logo + chevron (Top-Left aligned) ═══ */}
          <div className="lg:hidden flex items-center h-full">
             <button 
               ref={(el) => { mobileIberoRef.current = el ?? null; }}
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsIberoOpen(!isIberoOpen);
                 // compute menu left pos for mobile dropdown
                 try {
                   const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                   setMobileMenuLeft(r.left + r.width / 2);
                 } catch {}
               }}
               className="flex items-center gap-1.5 group z-[120] relative"
             >
                 <span className="text-white font-normal uppercase text-5xl tracking-wide leading-none">
                  IBERO
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-white/50 transition-transform duration-300 ${isIberoOpen ? 'rotate-180' : ''}`} />
             </button>
          </div>

          {/* ═══ DESKTOP NAV ═══ */}
          <nav className="hidden lg:block w-full px-4">
            <div className="grid grid-cols-3 items-center w-full">
              <div className="flex justify-start">
                {pathname === '/' ? (
                  <a
                    href="#tour-2026"
                    className="text-white font-extrabold no-underline uppercase tracking-wider cursor-pointer"
                    onClick={e => {
                      e.preventDefault();
                      const el = document.getElementById('tour-2026');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    OPEN TOURS
                  </a>
                ) : (
                  <TransitionLink href="/destinations" className="text-white font-extrabold no-underline uppercase tracking-wider">
                    OPEN TOURS
                  </TransitionLink>
                )}
              </div>

              <div className="text-center">
                    <div className="relative" ref={iberoRef} onMouseEnter={handleIberoMouseEnter} onMouseLeave={handleIberoMouseLeave}>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsIberoOpen(!isIberoOpen); }}
                        aria-expanded={isIberoOpen}
                        style={{ fontSize: 'clamp(1.6rem, 4.6vw, 3.2rem)' }}
                        className={`text-white font-normal no-underline uppercase tracking-tighter leading-none flex items-center justify-center gap-2 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 ${transparent ? 'desktop-ibero-large' : ''}`}
                      >
                        IBERO
                        <ChevronDownIcon className={`w-4 h-4 text-white/50 transition-transform duration-300 ${isIberoOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isIberoOpen && (
                        <div className="ibero-menu absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] bg-black/85 border border-white/10 rounded-xl py-2 px-3 text-center flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                          <button onClick={() => { setIsIberoOpen(false); onOpenToursAction?.(); }} className={`${activeGridView === 'tours' ? activeItemClass : inactiveItemClass} font-extrabold uppercase tracking-wider text-base md:text-lg transition-colors w-full text-center py-1`}>
                            Tours
                          </button>
                          <button onClick={() => { setIsIberoOpen(false); publishLandingOpenServices(); }} className={`${activeGridView === 'services' ? activeItemClass : inactiveItemClass} font-extrabold uppercase tracking-wider text-base md:text-lg transition-colors w-full text-center py-1`}>
                            Services
                          </button>
                          <TransitionLink href="/behind" className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors w-full text-center py-1`} onClick={() => setIsIberoOpen(false)}>
                            About Us
                          </TransitionLink>
                          <TransitionLink href="/panel" className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors w-full text-center py-1`} onClick={() => setIsIberoOpen(false)}>
                            Dashboard
                          </TransitionLink>
                          <button onClick={() => { setIsIberoOpen(false); setLegalOpen(true); }} className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors w-full text-center py-1`}>
                            Legal Info
                          </button>
                        </div>
                      )}
                    </div>
              </div>

              <div className="flex justify-end pr-4 relative" ref={moreRef} onMouseEnter={handleMoreMouseEnter} onMouseLeave={handleMoreMouseLeave}>
                {!compactMenuOnly && (
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="text-white font-extrabold no-underline uppercase tracking-wider flex items-center gap-1"
                  >
                    MORE
                    <ChevronDownIcon className={`w-4 h-4 text-white/50 transition-transform duration-300 ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* Desktop dropdown — no background, right-aligned text rows */}
                {moreOpen && (
                  <div className="absolute top-full right-0 mt-3 w-max bg-black/85 border border-white/10 rounded-xl py-2 px-3 text-right flex flex-col items-end gap-1 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <button onClick={() => { setMoreOpen(false); onOpenToursAction?.(); }} className={`${activeGridView === 'tours' ? activeItemClass : inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors whitespace-nowrap`}>
                      Tours
                    </button>
                    <button onClick={() => { setMoreOpen(false); publishLandingOpenServices(); }} className={`${activeGridView === 'services' ? activeItemClass : inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors whitespace-nowrap`}>
                      Services
                    </button>
                    <TransitionLink href="/behind" className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors whitespace-nowrap`} onClick={() => setMoreOpen(false)}>
                      About Us
                    </TransitionLink>
                    <TransitionLink href="/panel" className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors whitespace-nowrap`} onClick={() => setMoreOpen(false)}>
                      Dashboard
                    </TransitionLink>
                    <button onClick={() => { setMoreOpen(false); setLegalOpen(true); }} className={`${inactiveItemClass} font-extrabold uppercase tracking-wider text-sm transition-colors whitespace-nowrap`}>
                      Legal Info
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* User panel removed from header (floating user button remains in page) */}
          </>
          )}
        </div>
      </div>
    </header>

    {/* ═══ MOBILE: Dropdown menu (under logo, no background) ═══ */}
    {isIberoOpen && (
      <div className={`lg:hidden fixed ${compactMenuOnly ? 'left-1/2 -translate-x-1/2 top-[3.2rem]' : 'top-[4.2rem]'} z-[320] animate-in fade-in slide-in-from-top-1 duration-200`} style={mobileMenuLeft && !compactMenuOnly ? { left: mobileMenuLeft, transform: 'translateX(-50%)' } : undefined}>
        <div className="ibero-menu flex flex-col items-center gap-0.5 p-2 bg-black/90 border border-white/12 rounded-xl text-center">
          <button
            onClick={() => { setIsIberoOpen(false); onOpenToursAction?.(); }}
            className={`${activeGridView === 'tours' ? activeItemClass : 'text-white/90 hover:text-white'} text-base font-extrabold uppercase tracking-wider transition-colors w-full py-1`}
          >
            Tours
          </button>
          <button
            onClick={() => { setIsIberoOpen(false); publishLandingOpenServices(); }}
            className={`${activeGridView === 'services' ? activeItemClass : 'text-white/90 hover:text-white'} text-base font-extrabold uppercase tracking-wider transition-colors w-full py-1`}
          >
            Services
          </button>
          <TransitionLink
            href="/behind"
            className="text-white/90 hover:text-white text-base font-extrabold uppercase tracking-wider transition-colors w-full py-1"
            onClick={() => setIsIberoOpen(false)}
          >
            About Us
          </TransitionLink>
          <TransitionLink
            href="/panel"
            className="text-white/90 hover:text-white text-base font-extrabold uppercase tracking-wider transition-colors w-full py-1"
            onClick={() => setIsIberoOpen(false)}
          >
            Dashboard
          </TransitionLink>
          <button
            onClick={() => { setIsIberoOpen(false); setLegalOpen(true); }}
            className="text-white/90 hover:text-white text-base font-extrabold uppercase tracking-wider transition-colors w-full py-1"
          >
            Legal Info
          </button>
        </div>
      </div>
    )}

    {/* ═══ Legal Info Full-screen overlay (dark, works on landing) ═══ */}
    {legalOpen && (
      <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 relative">
          <button
            onClick={() => setLegalOpen(false)}
            className="sticky top-4 ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Close legal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          {/* Invert the LegalSection for dark bg */}
          <div className="[&_*]:!text-white [&_.text-slate-900]:!text-white [&_.text-slate-600]:!text-white/70 [&_.text-slate-500]:!text-white/50 [&_.text-slate-400]:!text-white/40 [&_.bg-white]:!bg-white/10 [&_.bg-slate-50]:!bg-white/5 [&_.bg-slate-900]:!bg-white/10 [&_.border-slate-200]:!border-white/10 [&_.border-slate-100]:!border-white/10 [&_.text-amber-600]:!text-amber-400 [&_.text-amber-400]:!text-amber-300 [&_.border-amber-600]:!border-amber-400">
            <LegalSection />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
