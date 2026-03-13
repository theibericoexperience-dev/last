"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import tours, { TourOverview } from '@/data/toursOverview';
import mediaUrl from '@/lib/media/mediaUrl';
import { subscribeLandingOpenServices, publishLandingOpenServices, publishLandingScrollTo } from '@/lib/navigation/intents';
import ServicesPanelWrapper from '@/components/services/ServicesPanelWrapper';

/* ── helpers (shared with TourGrid) ─────────────────────────── */

function getMediacardForTour(tour: TourOverview) {
  const lc = (tour.id || '').toLowerCase();
  const title = (tour.title || '').toLowerCase();
  const mapping: Record<string, string> = {
    madrid:
      'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/madrid.webp',
    porto:
      'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    'porto & galicia':
      'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    laos:
      'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/LAOS%20&%20VIETNAM/laos.webp',
    australia:
      'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    'new zealand':
      'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    lofo:
      'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
    lofoten:
      'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
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
      try { goToAction?.('tour-2026'); } catch (_) {}
      setVisualView('services');
    });
    return () => unsub();
  }, [goToAction]);

  // Publish intents so the rest of the page (header/nav) can react when services is shown
  React.useEffect(() => {
    if (visualView === 'services') {
      publishLandingOpenServices();
    } else if (visualView === 'itineraries') {
      // publish a scroll intent only when we're back to the itineraries/hero view
      publishLandingScrollTo('hero-section');
    } else {
      // visualView === 'join-club' is internal to the sweep; do not publish a scroll intent
      // so the sweep remains open and the join-club content is shown in-place.
    }
  }, [visualView]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !isTourActive) return;

    const handleWheel = (event: WheelEvent) => {
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
            // 2026 → hero (collapse sweep)
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

  const COLLAPSED_HEIGHT = 64;
  const EXPANDED_HEIGHT = '90vh';

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Build tiles for a given year and ensure a 'Join The Ibero Club' card
  // is always present in the second row center (index 4, zero-based).
  const createYearTiles = (year: number) => {
    const yearTours = tours.filter(t => t.year === year);
    const tourItems: JSX.Element[] = yearTours.map((t) => (
      <Link key={t.id} href={`/tour/${t.id}`} className="group relative block">
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/40 shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
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
            <p className="mt-1.5 text-[10px] opacity-80 font-medium">
              {formatStartDate(t.startDate)}{t.days ? ` · ${t.days} days` : ''}
            </p>
          </div>
        </div>
      </Link>
    ));

    const joinTile = (
      <div key={`join-${year}`} className="group relative block">
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/40 shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl flex items-center justify-center p-6">
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

    const insertAt = 4; // second row center (0-based index)
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

  React.useEffect(() => {
    if (!isOpen) return;
    ignoreClicksRef.current = true;
    const t = window.setTimeout(() => { ignoreClicksRef.current = false; }, 260);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  return (
    <div className="hidden md:block">
      {/* Backdrop to close the sweep when clicking outside the content */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-transparent"
          onClick={() => {
            if (ignoreClicksRef.current) return;
            closeSweep(true);
          }}
        />
      )}
      {/* Unified fixed sweep container: collapsed -> expanded (single DOM node) */}
      <div
        ref={containerRef}
  className={`fixed inset-x-0 bottom-0 z-[100] shadow-[-10px_0_60px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-600 ease-in-out ${visualView === 'services' ? 'bg-[#06080c] border-none rounded-t-[32px]' : 'bg-white border-t border-white/20 rounded-t-[32px]'}`}
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
  <div className={`absolute inset-0 ${visualView === 'services' ? 'bg-[#06080c]' : 'bg-white'}`} />
  {/* Watermark: only visible when open AND not showing services */}
  {isOpen && visualView !== 'services' && (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center backdrop-blur-xl bg-white/50`}>
      <span
        key={`watermark-${visualYear}`}
        className="font-extrabold leading-none tracking-[-0.06em] text-slate-100/70 animate-in fade-in duration-1000"
        style={{ fontSize: 'min(35vw, 450px)' }}
      >
        {visualYear}
      </span>
    </div>
  )}

      {/* Handle floating outer: hide when services view to avoid tours chrome */}
      {visualView !== 'services' && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-9 z-40 pointer-events-none handle-floating-outer" aria-hidden>
          <div className="w-20 h-2 rounded-full bg-slate-400/95 shadow-md" style={{ boxShadow: '0 8px 20px rgba(2,6,23,0.12)' }} />
        </div>
      )}

  <div className="relative z-10 w-full h-full flex flex-col items-center">
        {/* Collapsed header/top button: hide entirely when services view is active so Services becomes full-bleed */}
        {visualView !== 'services' && (
          <div
            className="w-full flex-shrink-0 text-center px-6 cursor-pointer"
            style={{ height: `${COLLAPSED_HEIGHT}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            role="button"
            tabIndex={0}
            onClick={() => { if (!isOpen) goToAction?.('tour-2026'); }}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isOpen) { e.preventDefault(); goToAction?.('tour-2026'); } }}
            aria-expanded={isOpen}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <span className={isOpen ? `text-[22px] font-semibold tracking-[0.18em] text-slate-800` : 'text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-700'}>
                {isOpen ? String(visualYear) : 'Itineraries for 2026, 2027 & 2028'}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 w-full max-w-[1400px] px-8 py-3 flex items-center justify-center">
          <div
            key={`grid-${visualYear}`}
            className={visualView === 'itineraries' ? 'grid grid-cols-3 gap-x-8 gap-y-6 w-full animate-in fade-in zoom-in-95 duration-700' : 'w-full'}
          >
            {visualView === 'itineraries' ? (
              <>
                {createYearTiles(visualYear)}

                {/* Final 'join-year' row: full-width element with centered Join card */}
                <div className="col-span-3 w-full">
                  <div className="max-w-3xl mx-auto p-6">
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/40 shadow-sm transition-all duration-300 flex items-center justify-center p-6">
                      <div className="text-center">
                        <h3 className="text-2xl font-serif font-bold text-slate-900">Join The Ibero Club</h3>
                        <p className="mt-3 text-sm text-slate-600">Your All-In Solution For Authentic Group & Personal Travel. Create an account and get a $500 credit.</p>
                        <div className="mt-6 flex justify-center">
                          <button onClick={() => setVisualView('join-club')} className="bg-slate-900 text-white px-4 py-2 rounded-full font-bold uppercase tracking-widest">Create an Account & Win $500</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : visualView === 'services' ? (
              <div className="w-full">
                  <ServicesPanelWrapper
                    onCloseAction={() => closeSweep(true)}
                    onSwitchToToursAction={() => setVisualView('itineraries')}
                    onRequireAuthAction={onRequireAuthAction}
                    onOpenPackageAction={onOpenPackageAction}
                  />
              </div>
            ) : (
              <div className="w-full max-w-2xl mx-auto p-6 text-center">
                <h3 className="text-2xl font-serif font-bold text-slate-900">Join The Ibero Club</h3>
                <p className="mt-3 text-sm text-slate-600">Your All-In Solution For Authentic Group & Personal Travel. Create an account and get a $500 credit.</p>
                <div className="mt-6 flex justify-center">
                  <button onClick={() => goToAction?.('behind')} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest">Create an Account & Win $500</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close button: hide when services to remove extra chrome */}
        {isOpen && visualView !== 'services' && (
          <button 
            onClick={() => closeSweep(true)}
            className={`absolute top-6 right-8 group flex items-center gap-3 transition-colors text-slate-600 hover:text-slate-900`}
            aria-label="Close itineraries"
          >
            <span className="sr-only">Close</span>
            <div className="p-2.5 rounded-full bg-transparent" style={{ lineHeight: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
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
