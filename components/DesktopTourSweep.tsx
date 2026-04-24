"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import tours, { TourOverview } from '@/data/toursOverview';
import mediaUrl from '@/lib/media/mediaUrl';
import { subscribeLandingOpenServices, publishLandingOpenServices } from '@/lib/navigation/intents';
import ServicesPanelWrapper from '@/components/services/ServicesPanelWrapper';

/* ── helpers (shared with TourGrid) ─────────────────────────── */

function getMediacardForTour(tour: TourOverview) {
  const lc = (tour.id || '').toLowerCase();
  const title = (tour.title || '').toLowerCase();
  const mapping: Record<string, string> = {
    madrid:
      'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/madrid.webp',
    porto:
      'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    'porto & galicia':
      'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    laos:
      'https://auth.ibero.world/storage/v1/object/public/Tours/Open%20Tours/LAOS%20&%20VIETNAM/laos.webp',
    australia:
      'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    'new zealand':
      'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    lofo:
      'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
    lofoten:
      'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
  };
  for (const key of Object.keys(mapping)) {
    if (lc.includes(key) || title.includes(key)) return mapping[key];
  }
  const raw = tour.cardImage || 'mediacards/placeholder.jpg';
  return mediaUrl(raw) || `/${raw}`;
}

function formatStartDate(s?: string) {
  if (!s) return '';
  const parts = s.split('-');
  if (parts.length < 2) return s;
  const month = parseInt(parts[1], 10);
  const year = parts[0];
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  return `${months[Math.max(0, Math.min(11, month - 1))]} ${year}`;
}

/* ── component ──────────────────────────────────────────────── */

export default function DesktopTourSweep({
  activeSectionId,
  goToAction,
  onRequireAuthAction,
  onOpenPackageAction,
}: {
  activeSectionId: string | null;
  goToAction?: (id: string) => void;
  onRequireAuthAction?: () => void;
  onOpenPackageAction?: () => void;
}) {
  const years = [2026, 2027] as const;
  const [visualYear, setVisualYear] = React.useState<(typeof years)[number]>(2026);
  const [visualView, setVisualView] = React.useState<'itineraries' | 'join-club' | 'services'>('itineraries');
  const [isDesktop, setIsDesktop] = React.useState(false);
  const wheelLockRef = React.useRef(false);
  const sweepTransitionLockRef = React.useRef(false);
  const lockTimerRef = React.useRef<number | null>(null);
  const openedAtRef = React.useRef<number>(0);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [startColumns, setStartColumns] = React.useState<Record<number, number>>({ 2026: 0, 2027: 0 });
  const carouselContRef = React.useRef<HTMLDivElement>(null);
  const [colPx, setColPx] = React.useState(0);
  const yearTitleRef = React.useRef<HTMLSpanElement>(null);
  const prevRenderedYearRef = React.useRef<number>(2026);

  const startColumn = startColumns[visualYear] ?? 0;

  const lockTransition = (duration = 1000) => {
    if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    sweepTransitionLockRef.current = true;
    setIsTransitioning(true);
    lockTimerRef.current = window.setTimeout(() => {
      sweepTransitionLockRef.current = false;
      setIsTransitioning(false);
      lockTimerRef.current = null;
    }, duration) as unknown as number;
  };

  // Determinamos si estamos en alguna sección de tours ('tour-2026' o 'tour-2027')
  const isTourActive = activeSectionId?.startsWith('tour-');
  const activeYear = activeSectionId === 'tour-2027' ? 2027 : 2026;
  const showCollapsedHeader = isDesktop && !isTourActive;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (ev: MediaQueryListEvent | MediaQueryList) => setIsDesktop((ev as MediaQueryList).matches);
    setIsDesktop(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange as EventListener);
    else mq.addListener(onChange as any);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange as EventListener);
      else mq.removeListener(onChange as any);
    };
  }, []);

  // When the user explicitly closes the Services view we set this flag so
  // subsequent automatic scroll-driven logic will prefer itineraries.
  const servicesManuallyClosedRef = React.useRef(false);

  React.useEffect(() => {
    if (isTourActive) {
      openedAtRef.current = Date.now();
      setVisualYear(activeYear);
      // entering tours should show itineraries view by default
      // do not overwrite services if user explicitly opened services
      setVisualView((prev) => {
        // If user previously closed services manually, prefer itineraries and clear the flag
        if (prev === 'services' && servicesManuallyClosedRef.current) {
          servicesManuallyClosedRef.current = false;
          return 'itineraries';
        }
        return prev === 'services' ? prev : 'itineraries';
      });
    }
  }, [activeYear, isTourActive]);

  // Subscribe to open-services intent
  React.useEffect(() => {
    const unsub = subscribeLandingOpenServices(() => {
      // Opening services via intent should clear any manual-close flag
      servicesManuallyClosedRef.current = false;
      // Lock transition to prevent scroll inertia/interactions while opening
      lockTransition(1000);
      try { goToAction?.('tour-2026'); } catch (_) {}
      setVisualView('services');
    });
    return () => unsub();
  }, [goToAction]);

  // Publish intents so the rest of the page (header/nav) can react when services is shown
  React.useEffect(() => {
    if (visualView === 'services') {
      publishLandingOpenServices();
    }
    // Never publish landing:scrollTo from here — doing so creates a feedback loop with the
    // controller's subscribeLandingScrollTo handler that can auto-close the sweep.
    // The sweep closes directly via goToAction('hero-section') when needed.
  }, [visualView]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !isTourActive) return;
    const handleWheel = (event: WheelEvent) => {
      // If sweep is transitioning, block internal scroll/inertia
      if (sweepTransitionLockRef.current) {
        event.preventDefault();
        event.stopPropagation();
        // stopImmediatePropagation may not exist on all platforms but try
        try { (event as any).stopImmediatePropagation(); } catch (e) {}
        return;
      }
      if (!isTourActive) return;
      if (Math.abs(event.deltaY) < 8) return;

      // Capturamos el evento antes de que llegue al scroller del controlador
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (wheelLockRef.current) return;

      if (event.deltaY > 0) {
        // Scroll down
        if (visualView === 'itineraries') {
          if (visualYear === 2026) {
            // 2026 → 2027
            wheelLockRef.current = true;
            setVisualYear(2027);
            goToAction?.('tour-2027');
            window.setTimeout(() => { wheelLockRef.current = false; }, 600);
          } else if (visualYear === 2027) {
            // 2027 → join-club (internalized inside the sweep)
            wheelLockRef.current = true;
            setVisualView('join-club');
            // Do NOT call goToAction('join-club') here: keep join-club inside the sweep on desktop
            window.setTimeout(() => { wheelLockRef.current = false; }, 600);
          }
        } else {
          // when already viewing join-club, do nothing on further scroll-down (prevent accidental exit)
        }
        return;
      }

      if (event.deltaY < 0) {
        // Scroll up
        if (visualView === 'join-club') {
          // From join-club go back to itineraries (2027 context)
          wheelLockRef.current = true;
          setVisualView('itineraries');
          setVisualYear(2027);
          window.setTimeout(() => { wheelLockRef.current = false; }, 600);
          return;
        }

        if (visualView === 'itineraries') {
          if (visualYear === 2027) {
            // 2027 → 2026
            wheelLockRef.current = true;
            setVisualYear(2026);
            goToAction?.('tour-2026');
            window.setTimeout(() => { wheelLockRef.current = false; }, 600);
            return;
          }

          if (visualYear === 2026) {
            // 2026 → hero (collapse sweep) — guard against accidental close within 2s of opening
            if (Date.now() - openedAtRef.current < 2000) return;
            wheelLockRef.current = true;
            goToAction?.('hero-section');
            window.setTimeout(() => { wheelLockRef.current = false; }, 600);
          }
        }
      }
    };

    // Usamos capture: true para que este handler se ejecute ANTES del onWheel del scroller
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => window.removeEventListener('wheel', handleWheel, { capture: true });
  }, [goToAction, isTourActive, visualYear]);

  // Centralized lock when sweep opens/closes to prevent internal scrolling during transition
  const mountedRef = React.useRef(false);
  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    // lock for the same duration as CSS transition (1000ms)
    sweepTransitionLockRef.current = true;
    setIsTransitioning(true);
    if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    lockTimerRef.current = window.setTimeout(() => {
      sweepTransitionLockRef.current = false;
      setIsTransitioning(false);
      lockTimerRef.current = null;
    }, 1000) as unknown as number;
    // reset carousel position when opening/closing
    setStartColumns({ 2026: 0, 2027: 0 });
    return () => {
      if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
      sweepTransitionLockRef.current = false;
      setIsTransitioning(false);
      lockTimerRef.current = null;
    };
  }, [isTourActive]);

  // Measure carousel column width for pixel-accurate column translation
  React.useLayoutEffect(() => {
    const el = carouselContRef.current;
    if (!el) return;
    // Each column is exactly w-1/3 of the container; no gap means shift = container/3 per step.
    const measure = () => { setColPx(el.clientWidth / 3); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visualView]); // re-observe when tiles section mounts/unmounts

  // Animate ONLY the year title when switching year — cards stay static
  React.useLayoutEffect(() => {
    const el = yearTitleRef.current;
    if (!el || prevRenderedYearRef.current === visualYear) return;
    const dir = visualYear > prevRenderedYearRef.current ? 'Down' : 'Up';
    prevRenderedYearRef.current = visualYear;
    el.style.animation = 'none';
    void el.offsetWidth; // force reflow so animation restarts
    el.style.animation = `sweepYearIn${dir} 0.35s cubic-bezier(.22,1,.36,1) both`;
  }, [visualYear]);

  const COLLAPSED_HEIGHT = 52;
  const EXPANDED_HEIGHT = '90vh';

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Build tiles for a given year and ensure a 'Join The Ibero Club' card
  // is always present in the second row center (index 4, zero-based).
  const createYearTiles = (year: number) => {
    const yearTours = tours.filter(t => t.year === year);
      const tourItems: JSX.Element[] = yearTours.map((t) => (
      <Link key={t.id} href={`/tour/${t.id}`} className="group relative block">
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/40 shadow-sm transition-shadow duration-700 ease-out group-hover:shadow-xl">
          <Image
            src={getMediacardForTour(t)}
            alt={t.title}
            fill
            sizes="400px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h4 className="font-bold text-base leading-tight uppercase tracking-wide group-hover:text-amber-400 transition-colors line-clamp-2">{t.title}</h4>
            <p className="mt-1.5 text-sm opacity-80 font-medium">
              {formatStartDate(t.startDate)}{t.days ? ` · ${t.days} days` : ''}
            </p>
          </div>
        </div>
      </Link>
    ));

    const joinTile = (
      <div key={`join-${year}`} className="group relative block">
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/40 shadow-sm transition-shadow duration-700 ease-out group-hover:shadow-xl flex items-center justify-center p-6">
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-slate-900">Join The Ibero Club</h3>
            <p className="mt-3 text-sm text-slate-600">Your All-In Solution For Authentic Group & Personal Travel. Create an account and get a $500 credit.</p>
            <div className="mt-6 flex justify-center">
              <button onClick={() => setVisualView('join-club')} className="bg-slate-900 text-white px-4 py-2 rounded-full font-bold uppercase tracking-widest">Create an Account & Win $500</button>
            </div>
          </div>
        </div>
      </div>
    );

    const insertAt = 3; // bottom row, middle column (0-based index)
    if (tourItems.length >= insertAt) {
      tourItems.splice(insertAt, 0, joinTile);
    } else {
      tourItems.push(joinTile);
    }
    return tourItems;
  };

  // Helper to close the sweep. If `manual` is true and the current visual
  // view is 'services', mark that services was manually closed so subsequent
  // scroll-driven logic will open itineraries instead.
  const closeSweep = (manual = false) => {
    // If manually closed while in services, mark that services was manually closed
    if (manual && visualView === 'services') servicesManuallyClosedRef.current = true;
    // Always reset visual view to itineraries on close to avoid persisting services state
    setVisualView('itineraries');
    goToAction?.('hero-section');
  };

  // Prevent immediate click-after-open from closing the sweep. When the sweep
  // becomes open we ignore clicks for a short window to avoid the same event
  // that opened it from triggering the onClick close handler.
  const ignoreClicksRef = React.useRef(false);
  const isOpen = isTourActive;

  // Inform header when the tours sweep is opened/closed so the header can collapse
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const open = Boolean(isOpen && visualView !== 'services');
    window.dispatchEvent(new CustomEvent('landing-tours-state', { detail: { open } }));
  }, [isOpen, visualView]);

  React.useEffect(() => {
    if (!isOpen) return;
    ignoreClicksRef.current = true;
    const t = window.setTimeout(() => { ignoreClicksRef.current = false; }, 260);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  return (
    <div className="hidden md:block">
      <style>{`
        @keyframes sweepYearInDown {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sweepYearInUp {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Backdrop to close the sweep when clicking outside the content */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-transparent"
          onClick={() => {
            if (ignoreClicksRef.current) return;
            if (sweepTransitionLockRef.current) return;
            closeSweep(true);
          }}
        />
      )}
      {/* Unified fixed sweep container: collapsed -> expanded (single DOM node) */}
      <div
        ref={containerRef}
      className={`fixed inset-x-0 bottom-0 z-[100] shadow-[-10px_0_60px_rgba(0,0,0,0.15)] ${isOpen ? 'overflow-visible' : 'overflow-hidden'} transition-all duration-1000 ease-[cubic-bezier(.22,1,.36,1)] ${(isOpen && visualView !== 'services') ? 'bg-[#0893C4] border-t border-[#0893C4]/20 rounded-t-[32px]' : 'bg-[#044E6F] border-t border-[#044E6F]/20 rounded-t-[32px]'}`}
        style={{
          height: isOpen ? EXPANDED_HEIGHT : `${COLLAPSED_HEIGHT}px`,
          // Keep rounded top corners on the sweep in all views so the black panel also has rounded corners
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          // ensure full-width visual surface
          width: '100%',
        }}
        role="dialog"
        aria-hidden={!isOpen}
        aria-label="Itineraries sweep"
      >
  {/* Background */}
  <div className={`absolute inset-0 ${(isOpen && visualView !== 'services') ? 'bg-[#0893C4] rounded-t-[32px]' : 'bg-[#044E6F] rounded-t-[32px]'}`} />
  {/* Watermark removed intentionally (background year hidden) */}

      {/* Handle floating outer: hide when services view to avoid tours chrome */}
      {visualView !== 'services' && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-9 z-40 pointer-events-none handle-floating-outer" aria-hidden>
          <div className="w-20 h-2 rounded-full bg-slate-400/95 shadow-md" style={{ boxShadow: '0 8px 20px rgba(2,6,23,0.12)' }} />
        </div>
      )}

  <div className={`relative z-10 w-full h-full flex flex-col items-center`}>
        {/* Collapsed header/top button: hide entirely when services view is active so Services becomes full-bleed */}
        {visualView !== 'services' && (
          <div
            className="w-full flex-shrink-0 text-center px-6 cursor-pointer"
            style={{ height: `${COLLAPSED_HEIGHT}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            role="button"
            tabIndex={0}
            onPointerDown={(e) => {
              if (sweepTransitionLockRef.current) return;
              // prevent the same pointer event from immediately closing the sweep via backdrop
              ignoreClicksRef.current = true;
              if (!isOpen) goToAction?.('tour-2026');
            }}
            onClick={() => {
              // clicks after pointerdown should be ignored to avoid double-trigger
              if (sweepTransitionLockRef.current) return;
              if (ignoreClicksRef.current) return;
              if (!isOpen) goToAction?.('tour-2026');
            }}
            onKeyDown={(e) => {
              if (sweepTransitionLockRef.current) return;
              if ((e.key === 'Enter' || e.key === ' ') && !isOpen) {
                e.preventDefault();
                // keyboard-trigger should also set the ignore guard briefly
                ignoreClicksRef.current = true;
                goToAction?.('tour-2026');
              }
            }}
            aria-expanded={isOpen}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <span
                ref={yearTitleRef}
                className={isOpen ? `text-[36px] font-semibold tracking-[0.18em] text-white transform translate-y-8 block` : 'text-[20px] font-semibold uppercase tracking-[0.18em] text-white'}
              >
                {isOpen ? String(visualYear) : 'Itineraries for 2026, 2027 & 2028'}
              </span>
            </div>
          </div>
        )}

        <div className={`flex-1 w-full ${visualView === 'services' ? 'px-3' : 'max-w-[1400px] px-8'} ${isOpen ? 'py-2' : 'py-3'} flex items-center justify-center`}>
          {visualView === 'services' ? (
            <div className="w-full">
              <ServicesPanelWrapper
                onCloseAction={() => closeSweep(true)}
                onSwitchToToursAction={() => setVisualView('itineraries')}
                onRequireAuthAction={onRequireAuthAction}
                onOpenPackageAction={onOpenPackageAction}
              />
            </div>
          ) : (
            <div className="w-full relative">
              {/* Tiles carousel: columns of 2 items, visible 3 columns */}
              <div className="w-full">
                <div ref={carouselContRef} className="overflow-hidden w-full">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: colPx ? `translateX(-${startColumn * colPx}px)` : `translateX(-${(startColumn * 100) / 3}%)` }}
                >
                  {(() => {
                    const tiles = createYearTiles(visualYear);
                    const columns = Math.ceil(tiles.length / 2);
                    const cols: JSX.Element[] = [];
                    for (let i = 0; i < columns; i++) {
                      const items = tiles.slice(i * 2, i * 2 + 2);
                      cols.push(
                        <div key={`col-${i}`} className="w-1/3 flex-shrink-0 px-3">
                          <div className="flex flex-col gap-y-8">
                            <div className="overflow-hidden">
                              {items[0]}
                            </div>
                            <div className="overflow-hidden">
                              {items[1]}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return cols;
                  })()}
                </div>
                </div>
              </div>

              {/* Arrows (left + right) */}
              {(() => {
                const tiles = createYearTiles(visualYear);
                const columns = Math.ceil(tiles.length / 2);
                const maxStart = Math.max(0, columns - 3);
                if (columns <= 3) return null;
                return (
                  <>
                    <div style={{ position: 'absolute', left: '-48px', top: '50%', transform: 'translateY(-50%)' }} className="z-40">
                      <button
                        aria-label="Previous columns"
                        onClick={() => { if (sweepTransitionLockRef.current) return; setStartColumns(prev => ({ ...prev, [visualYear]: Math.max(0, (prev[visualYear] ?? 0) - 1) })); }}
                        className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                        disabled={startColumn === 0}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                    </div>
                    <div style={{ position: 'absolute', right: '-48px', top: '50%', transform: 'translateY(-50%)' }} className="z-40">
                      <button
                        aria-label="Next columns"
                        onClick={() => { if (sweepTransitionLockRef.current) return; setStartColumns(prev => ({ ...prev, [visualYear]: Math.min(maxStart, (prev[visualYear] ?? 0) + 1) })); }}
                        className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                        disabled={startColumn === maxStart}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Close button for tours view */}
        {isOpen && visualView !== 'services' && (
          <button 
            onClick={() => { if (sweepTransitionLockRef.current) return; closeSweep(true); }}
            className="absolute top-6 right-8 group flex items-center gap-3 transition-colors text-white/90 hover:text-white"
            aria-label="Close itineraries"
          >
            <span className="sr-only">Close</span>
            <div className="p-3 rounded-full bg-transparent" style={{ lineHeight: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
          </button>
        )}
        {/* Close button for services view — sits at the top-right of the sweep container (no nesting/padding) */}
        {isOpen && visualView === 'services' && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => { if (sweepTransitionLockRef.current) return; closeSweep(true); }}
            className="absolute top-4 right-6 z-[150] p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all duration-300 flex items-center justify-center h-12 w-12 backdrop-blur-md"
            aria-label="Close services"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      </div>

      <div className="relative z-0" aria-hidden>
        <section
          id="tour-2026"
          className="h-screen w-full pointer-events-none select-none"
          style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
        />
        <section
          id="tour-2027"
          className="h-screen w-full pointer-events-none select-none"
          style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
        />
      </div>
    </div>
  );
}
