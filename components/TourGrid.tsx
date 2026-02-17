"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import tours, { TourOverview } from '../data/toursOverview';
import mediaUrl from '@/lib/media/mediaUrl';
import { publishLandingScrollTo } from '../lib/navigation/intents';

function getMediacardForTour(tour: TourOverview) {
  const lc = (tour.id || '').toLowerCase();
  const title = (tour.title || '').toLowerCase();
  const mapping: Record<string, string> = {
    'madrid': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/madrid.webp',
    'porto': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    'porto & galicia': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    'laos': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open%20Tours/LAOS%20&%20VIETNAM/laos.webp',
    'australia': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    'new zealand': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    'lofo': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
    'lofoten': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
    'lofotensummer': 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp'
  };

  for (const key of Object.keys(mapping)) {
    if (lc.includes(key) || title.includes(key)) return mapping[key];
  }

  // Fallbacks: prefer a compact mediacard if present, else use tour.cardImage, else placeholder
  // Prefer mapped mediacard or explicit cardImage; leave placeholder under mediacards bucket
  const raw = tour.cardImage || 'mediacards/placeholder.jpg';
  return mediaUrl(raw) || `/${raw}`;
}

function formatStartDate(s?: string) {
  if (!s) return '';
  const parts = s.split('-');
  if (parts.length < 2) return s;
  const month = parseInt(parts[1], 10);
  const year = parts[0];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mname = months[Math.max(0, Math.min(11, month - 1))] || '';
  return `${mname} ${year}`;
}

export default function TourGrid({ isModal = false, onCardClickAction, goToAction }: { isModal?: boolean, onCardClickAction?: () => void, goToAction?: (id: string) => void } = {}) {
  const onCardClickHandler = onCardClickAction;
  const [activeYear, setActiveYear] = React.useState<2026 | 2027 | null>(null);

  // Tours por año para el modal
  const tours2026 = tours.filter((t) => t.year === 2026);
  const tours2027 = tours.filter((t) => t.year === 2027);
  // Nota: 2027 usa el mismo render por filas que 2026 para mantener el centrado visual.

  // Renderizado del modal
  function renderModal() {
    return (
      <div className="flex flex-col">
        {/* 2026 */}
        <div id="tour-2026" className="flex flex-col items-center justify-center w-full" style={{height:'100vh', minHeight:'100vh', width:'100vw', maxWidth:'none', marginBottom: 0, paddingTop: 0}}>
          <div className="relative flex flex-col items-center justify-center w-full h-full" style={{overflow: 'visible', padding: 0, minHeight: '400px', height: '100vh', maxWidth:'1200px', margin:'0 auto'}}>
            <span aria-hidden className="pointer-events-none select-none absolute left-1/2 font-extrabold z-0 giant-year" style={{ top: '60%', transform: 'translate(-50%, -50%)', left: '50%', pointerEvents: 'none', zIndex: 0 }}>2026</span>
            <div className="relative w-full z-10 flex flex-col gap-4 md:gap-8 items-center justify-center" style={{minHeight:'400px', justifyContent:'center', position:'relative'}}>
              {Array.from({length: Math.ceil(tours2026.length / 3)}).map((_, rowIdx) => (
                <div key={rowIdx} className="flex flex-col md:flex-row justify-center gap-4 md:gap-10 w-full items-center">
                  {tours2026.slice(rowIdx * 3, rowIdx * 3 + 3).map((t) => renderCard(t, { forceSingleLine: true }))}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* 2027 */}
        <div id="tour-2027" className="flex flex-col items-center justify-center w-full" style={{height:'100vh', minHeight:'100vh', width:'100vw', maxWidth:'none', marginBottom: 0, paddingTop: 0}}>
          <div className="relative flex flex-col items-center justify-center w-full h-full" style={{overflow: 'visible', padding: 0, minHeight: '400px', height: '100vh', maxWidth:'1200px', margin:'0 auto'}}>
              <span aria-hidden className="pointer-events-none select-none absolute left-1/2 font-extrabold z-0 giant-year" style={{ left: '50%', transform: 'translate(-50%, -50%)' }}>{2027}</span>
            <div className="relative w-full z-10 flex flex-col gap-4 md:gap-8 items-center justify-center" style={{minHeight:'400px', justifyContent:'center', position:'relative'}}>
              {Array.from({length: Math.ceil(tours2027.length / 3)}).map((_, rowIdx) => (
                <div key={rowIdx} className="flex flex-col md:flex-row justify-center gap-4 md:gap-10 w-full items-center">
                  {tours2027.slice(rowIdx * 3, rowIdx * 3 + 3).map((t) => renderCard(t, { forceSingleLine: true }))}
                </div>
              ))}
              {/* visually-hidden small label retained for accessibility */}
              <span className="sr-only">2027</span>
            </div>
          </div>
        </div>
        {/* Custom Tours button */}
        <div className="flex justify-center mt-10">
          <a
            href="/panel?tourCreatorOpen=1"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-black via-gray-800 to-black text-white text-xl font-semibold shadow-lg border-2 border-white/80 hover:scale-105 hover:bg-white/10 transition-all duration-300"
            style={{letterSpacing: '0.04em'}}>
            Custom Tours
          </a>
        </div>
      </div>
    );
  }

  // Detectar qué año está realmente "en pantalla" (solo en landing), para que
  // el overlay + X no se activen antes de tiempo ni se queden atascados.
  React.useEffect(() => {
    if (isModal) return;
    // el scroll container real es el <main> con className landing-main
    const root = document.querySelector('.landing-main') as HTMLElement | null;
    if (!root) return;

    const el2026 = document.getElementById('tour-2026');
    const el2027 = document.getElementById('tour-2027');
    if (!el2026 || !el2027) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // elegimos el entry con mayor intersección
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!best) {
          setActiveYear(null);
          return;
        }

        const id = (best.target as HTMLElement).id;
        if (id === 'tour-2026') setActiveYear(2026);
        else if (id === 'tour-2027') setActiveYear(2027);
      },
      {
        root,
        threshold: [0.55],
      }
    );

    obs.observe(el2026);
    obs.observe(el2027);

    return () => {
      obs.disconnect();
    };
  }, [isModal]);
  // Helper para mostrar título corto
  function getShortTitle(title: string) {
    if (title.toLowerCase().includes('new zealand') && title.toLowerCase().includes('australia')) {
      return 'AUSTRALIA & NEW ZEALAND';
    }
    return title;
  }

  function renderCard(t: TourOverview, opts?: { forceSingleLine?: boolean }) {
    const forceSingle = !!opts?.forceSingleLine;
    return (
      <Link key={t.id} href={`/tour/${t.id}`} prefetch={false} legacyBehavior>
        <a
          className="group relative z-0 inline-block"
          onClick={(e) => {
            try {
              // Recordar la sección de origen (tour-2026 / tour-2027)
              const sectionId = `tour-${t.year}`;
              try { sessionStorage.setItem('landing:lastSection', sectionId); } catch (err) { /* ignore */ }
              // Emitir evento para que el landing pueda reaccionar si está escuchando
              try { publishLandingScrollTo(sectionId); } catch (err) { /* ignore */ }
            } catch (err) {}
            if (onCardClickHandler) onCardClickHandler();
          }}
        >
            <div className="relative rounded-2xl bg-white/5 border border-white/10 transition-transform duration-300 transform-gpu group-hover:-translate-y-2 aspect-square w-full md:w-[260px] max-w-[260px] min-w-0">
            <Image
              src={getMediacardForTour(t) as string}
              alt={t.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 23vw"
              className="object-cover rounded-2xl"
              unoptimized
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
            <div className="absolute left-4 bottom-4 right-4 text-white">
              <h4 className="font-semibold leading-tight w-full text-sm md:text-[0.65rem] truncate">
                {getShortTitle(t.title)}
              </h4>
              {t.startDate && (
                <p
                  className="text-xs font-bold text-white/90 w-auto"
                  style={forceSingle
                    ? {
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        textOverflow: 'clip',
                        width: 'auto',
                        minWidth: 0,
                        maxWidth: 'none',
                        display: 'block',
                        margin: 0,
                      }
                    : {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        minWidth: 0,
                        maxWidth: '100%',
                        display: 'block',
                        margin: 0,
                      }
                  }
                >
                  {formatStartDate((t as any).startDate)}
                </p>
              )}
            </div>
          </div>
        </a>
      </Link>
    );
  }
  function renderLanding() {
    const years = [2026, 2027];
    return (
      <>
        {/* Overlay + X (solo en landing, no en modal) */}
        {activeYear != null && (
          <>
            <div
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                zIndex: 1000,
                transition: 'background 300ms ease',
              }}
              aria-hidden
            />
            <button
              className={`landing-grid-floating-x${activeYear != null ? ' landing-grid-floating-x-visible' : ''}`}
              aria-label="Volver al inicio"
              style={{
                position: 'fixed',
                top: 'calc(100vh * 0.12)',
                right: '6vw',
                zIndex: 1200,
                background: 'none',
                border: 'none',
                borderRadius: '50%',
                width: 62,
                height: 62,
                display: activeYear != null ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: activeYear != null ? 1 : 0,
                transition: 'opacity 0.4s',
                pointerEvents: activeYear != null ? 'auto' : 'none',
              }}
              onClick={() => {
                // Volver al hero: publicamos intent para que el controller haga el scroll
                try { publishLandingScrollTo('hero-section'); } catch (err) {}
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="27" y1="9" x2="9" y2="27" />
                <line x1="9" y1="9" x2="27" y2="27" />
              </svg>
            </button>
            <style>{`
              .landing-grid-floating-x {
                opacity: 0;
                pointer-events: none;
                transform: scale(0.85) translateY(60px);
                transition: opacity 0.4s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1);
              }
              .landing-grid-floating-x-visible {
                opacity: 1 !important;
                pointer-events: auto !important;
                transform: scale(1) translateY(0) !important;
              }
            `}</style>
          </>
        )}

        {years.map((year) => {
          const yearTours = tours.filter((t) => t.year === year);
          return (
            <div
              key={year}
              id={`tour-${year}`}
              className="relative landing-section flex items-center justify-center"
              style={{
                minHeight: '100vh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                position: 'relative',
                overflow: 'visible',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Giant year behind cards (for both 2026 and 2027) */}
              <span
                aria-hidden
                className="pointer-events-none select-none absolute left-1/2 font-extrabold z-0"
                style={{
                  display: 'block',
                  width: 'auto',
                  textAlign: 'center',
                  fontSize: 'clamp(12rem, 30vw, 36rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  color: '#000',
                  WebkitTextFillColor: '#000',
                  WebkitTextStroke: '1px #9CA3AF',
                  top: year === 2026 ? '50%' : '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {year}
              </span>
              {/* visually-hidden year label for accessibility */}
              <h3 className="sr-only">{year}</h3>
              <div className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-4 md:gap-12 relative z-10" style={{overflow: 'visible'}}>
                {yearTours.length ? (
                  yearTours.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tour/${t.id}`}
                      className="group relative z-0 inline-block"
                      onClick={(e) => {
                        try {
                          const sectionId = `tour-${t.year}`;
                          try { sessionStorage.setItem('landing:lastSection', sectionId); } catch (err) { /* ignore */ }
                          try { publishLandingScrollTo(sectionId); } catch (err) { /* ignore */ }
                        } catch (err) { }
                        if (onCardClickHandler) onCardClickHandler();
                      }}
                    >
                      <div className="relative rounded-2xl bg-white/5 border border-white/10 transition-transform duration-300 transform-gpu group-hover:-translate-y-2 aspect-square w-full md:w-[260px] max-w-[260px] min-w-0">
                        <Image
                          src={getMediacardForTour(t)}
                          alt={t.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 23vw"
                          className="object-cover rounded-2xl"
                          unoptimized
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
                        <div className="absolute left-4 bottom-4 right-4 text-white">
                          <h4 className="text-xl font-bold leading-tight" style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'initial', lineHeight: 1.1, wordBreak: 'break-word' }}>{getShortTitle(t.title)}</h4>
                          {t.startDate && <p className="mt-2 text-base font-bold text-white/90">{formatStartDate((t as any).startDate)}</p>}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-white/60">No tours listed for {year}</div>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  // Main render
  return (
    <div id="tour-grid" className={`relative ${isModal ? 'pt-0 pb-0' : ''} z-30 flex flex-col items-center justify-center`}>
      <div className="mx-auto max-w-6xl px-4 w-full flex flex-col items-center justify-center">
        {isModal ? renderModal() : renderLanding()}
      </div>
    </div>
  );
}
