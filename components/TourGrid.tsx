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
  const raw = tour.cardImage || 'mediacards/placeholder.jpg';
  return mediaUrl(raw) || `/${raw}`;
}

function formatStartDate(s?: string, short = false) {
  if (!s) return '';
  const parts = s.split('-');
  if (parts.length < 2) return s;
  const month = parseInt(parts[1], 10);
  const year = parts[0];
  const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const idx = Math.max(0, Math.min(11, month - 1));
  return `${short ? monthsShort[idx] : monthsFull[idx]} ${year}`;
}

export default function TourGrid({ isModal = false, onCardClickAction, goToAction }: { isModal?: boolean, onCardClickAction?: () => void, goToAction?: (id: string) => void } = {}) {
  const [activeYear, setActiveYear] = React.useState<2026 | 2027 | null>(null);

  const tours2026 = tours.filter((t) => t.year === 2026);
  const tours2027 = tours.filter((t) => t.year === 2027);

  React.useEffect(() => {
    if (isModal) return;
    const root = document.querySelector('.landing-main') as HTMLElement | null;
    const el2026 = document.getElementById('tour-2026');
    const el2027 = document.getElementById('tour-2027');
    if (!el2026 || !el2027 || !root) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!best) { setActiveYear(null); return; }
        setActiveYear(best.target.id === 'tour-2026' ? 2026 : 2027);
      },
      { root, threshold: [0.55] }
    );

    obs.observe(el2026);
    obs.observe(el2027);
    return () => obs.disconnect();
  }, [isModal]);

  function getShortTitle(title: string) {
    if (title.toLowerCase().includes('new zealand') && title.toLowerCase().includes('australia')) {
      return 'AUSTRALIA & NEW ZEALAND';
    }
    return title;
  }

  function renderCard(t: TourOverview) {
    return (
      <Link
        key={t.id}
        href={`/tour/${t.id}`}
        prefetch={false}
        className="tour-card-wrapper group"
        onClick={() => {
          try {
            const sectionId = `tour-${t.year}`;
            sessionStorage.setItem('landing:lastSection', sectionId);
            publishLandingScrollTo(sectionId);
          } catch (e) {}
          if (onCardClickAction) onCardClickAction();
        }}
      >
          <div className="tour-card-container">
            <Image
              src={getMediacardForTour(t) as string}
              alt={t.title}
              fill
              sizes="(max-width: 768px) 50vw, 260px"
              className="object-cover"
              unoptimized
            />
            <div className="tour-card-overlay" />
            
            <div className="tour-card-content">
              <h4 className="tour-card-title">{getShortTitle(t.title)}</h4>
              {t.startDate && (
                <p className="tour-card-date">
                  <span className="date-full">{formatStartDate(t.startDate)}</span>
                  <span className="date-short">{formatStartDate(t.startDate, true)}</span>
                </p>
              )}
            </div>
          </div>
      </Link>
    );
  }

  const responsiveStyles = `
    /* Mobile-first: smaller cards and larger titles on mobile only */
    .tour-grid-custom {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      column-gap: 6px;
      row-gap: 6px;
      gap: 6px;
      width: 100%;
      max-width: 86vw; /* tighter so cards sit closer together */
      margin: 0 auto;
      justify-items: center;
      justify-content: center; /* center the whole grid */
      padding-inline: 0.5rem; /* small lateral padding so cards don't touch edges */
    }

    /* Mobile-only: nudge the grid to the right and pin nav to the left edge */
    @media (max-width: 767.98px) {
      .tour-grid-custom {
        transform: translateX(8%); /* push grid slightly right on mobile */
        /* pack columns much tighter and increase vertical spacing between rows */
        column-gap: 16px; /* more separation */
        row-gap: 32px;
        gap: 32px 16px; /* row col */
        padding-inline: 0.5rem;
      }
      .tour-card-container {
        border: 1px solid rgba(255,255,255,0.3) !important; /* Stronger border for visibility */
        max-width: 115px; /* Smaller cards */
        background: rgba(0,0,0,0.12) !important;
        border-radius: 8px; /* fine rounded border */
        overflow: hidden;
      }
      .tour-card-title {
        font-size: 11px !important; /* Smaller text for smaller cards */
      }
      /* shift left column items to the right to create a staggered feel */
      .tour-grid-custom > * {
        transition: transform 220ms ease;
      }
      .tour-grid-custom > *:nth-child(2n+1) {
        transform: translateX(28px);
      }
      .tour-card-overlay {
        background: linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 40%, rgba(0,0,0,0.85) 100%) !important;
      }
      /* show short month on mobile, hide full month to avoid wrapping */
      .date-full { display: none !important; }
      .date-short { display: inline !important; }
      .date-short { display: inline !important; }
      .left-section-nav {
        left: 4px !important; /* stick nav to very left edge */
        transform: translateY(-50%); /* keep centred vertically */
      }
      .giant-year { display: none !important; }
    }

    /* desktop: show full month, hide short form */
    .date-short { display: none; }
    .date-full { display: inline; }

    /* Giant year styling (desktop) */
    .giant-year {
      display: block;
      color: #000;
      -webkit-text-fill-color: #000;
      -webkit-text-stroke: 1px #9CA3AF;
      line-height: 1;
      letter-spacing: -0.04em;
      text-align: center;
    }

    .tour-card-wrapper {
      display: block;
      width: 100%;
      position: relative;
      z-index: 10;
    }

    .tour-card-container {
      position: relative;
      width: 100%;
      max-width: clamp(100px, 40vw, 140px); /* slightly smaller on mobile, responsive */
      aspect-ratio: 1/1;
      border-radius: 1rem;
      overflow: hidden;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      transition: transform 0.3s ease;
    }

    /* Ensure the image fills the container height and may be cropped (object-cover) */
    .tour-card-container img {
      height: 100% !important;
      width: 100% !important;
      object-fit: cover !important;
      object-position: center !important;
    }

    .tour-card-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.7) 100%);
    }

    .tour-card-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 12px;
      color: white;
    }

    .tour-card-title {
      font-weight: 800;
      font-size: 13px; /* slightly larger on mobile */
      line-height: 1.1;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .tour-card-date {
      font-size: 9px;
      font-weight: 500;
      opacity: 0.9;
    }

    /* DESKTOP (md+) - unchanged behavior preserved */
    @media (min-width: 768px) {
      .tour-grid-custom {
        grid-template-columns: repeat(3, 1fr);
        gap: 3rem;
        max-width: 1200px;
      }
      .tour-card-container {
        width: 260px;
        max-width: none;
        margin: 0 auto;
      }
      .tour-card-wrapper:hover .tour-card-container {
        transform: translateY(-8px);
      }
      .tour-card-content {
        justify-content: flex-end;
        padding: 1.25rem;
      }
      .tour-card-title {
        font-size: 1.125rem;
        text-transform: none;
      }
      .tour-card-date {
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
    }
  `;

  function renderModal() {
    return (
      <div className="flex flex-col w-full">
        {[2026, 2027].map(year => (
          <div key={year} id={`tour-${year}`} className="py-12 flex flex-col items-center w-full">
            <h2 className="text-white text-4xl font-bold mb-8">{year}</h2>
            <div className="tour-grid-custom">
              {(year === 2026 ? tours2026 : tours2027).map(t => renderCard(t))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderLanding() {
    const years = [2026, 2027];
    return (
      <>
        {/* Floating X button to navigate back to hero */}
        {activeYear != null && (
          <button
            className="fixed top-5 right-[6vw] z-[1200] flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Volver al inicio"
            onClick={() => {
              if (goToAction) goToAction('hero-section');
              else try { publishLandingScrollTo('hero-section'); } catch (err) {}
            }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="27" y1="9" x2="9" y2="27" />
              <line x1="9" y1="9" x2="27" y2="27" />
            </svg>
          </button>
        )}

        {years.map((year) => {
          const yearTours = tours.filter((t) => t.year === year);
          return (
            <div
              key={year}
              id={`tour-${year}`}
              className="relative min-h-screen w-full flex items-center justify-center landing-section"
              style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                minHeight: '100vh',
                position: 'relative',
                overflow: 'visible',
                display: 'flex',
              }}
            >
              <span aria-hidden className="giant-year pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-extrabold z-0" style={{ fontSize: 'clamp(8rem, 25vw, 30rem)' }}>
                {year}
              </span>
              <div className="relative z-10 w-full tour-grid-custom">
                {yearTours.map(t => renderCard(t))}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div id="tour-grid" className={`relative ${isModal ? 'pt-0 pb-0' : ''} z-30 flex flex-col items-center justify-center`}>
      <div className="mx-auto max-w-6xl px-4 w-full flex flex-col items-center justify-center">
        <style>{responsiveStyles}</style>
        {isModal ? renderModal() : renderLanding()}
      </div>
    </div>
  );
}
