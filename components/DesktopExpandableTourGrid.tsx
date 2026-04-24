"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import tours, { TourOverview } from '@/data/toursOverview';
import mediaUrl from '@/lib/media/mediaUrl';
import { publishLandingScrollTo } from '@/lib/navigation/intents';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

function getMediacardForTour(tour: TourOverview) {
  const lc = (tour.id || '').toLowerCase();
  const title = (tour.title || '').toLowerCase();
  const mapping: Record<string, string> = {
    madrid: 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/madrid.webp',
    porto: 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    'porto & galicia': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/PORTO & GALICIA/porto.webp',
    laos: 'https://auth.ibero.world/storage/v1/object/public/Tours/Open%20Tours/LAOS%20&%20VIETNAM/laos.webp',
    australia: 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    'new zealand': 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
    lofo: 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
    lofoten: 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/lofoten/lofotensummer.webp',
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
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const idx = Math.max(0, Math.min(11, month - 1));
  return `${months[idx]} ${year}`;
}

function DesktopTourCard({
  tour,
  expanded,
  onToggle,
}: {
  tour: TourOverview;
  expanded: boolean;
  onToggle: () => void;
}) {
  const years = [2026, 2027] as const;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeYear, setActiveYear] = React.useState<typeof years[number]>(tour.year as 2026 | 2027);

  React.useEffect(() => {
    if (!expanded || !scrollRef.current) return;
    const root = scrollRef.current;
    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-embedded-year]'));
    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!best) return;
        const year = Number((best.target as HTMLElement).dataset.embeddedYear) as 2026 | 2027;
        if (year) setActiveYear(year);
      },
      { root, threshold: [0.45, 0.65, 0.85] }
    );

    sections.forEach((section) => obs.observe(section));
    return () => obs.disconnect();
  }, [expanded, tour.year]);

  const rootRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!expanded) return;
    
    // Notify Header that tour is EXPANDED
    window.dispatchEvent(new CustomEvent('landing-tours-state', { detail: { open: true } }));
    
    const handler = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        onToggle();
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => {
      document.removeEventListener('pointerdown', handler);
      // Notify Header that tour is COLLAPSED
      window.dispatchEvent(new CustomEvent('landing-tours-state', { detail: { open: false } }));
    };
  }, [expanded, onToggle]);

  return (
    <article ref={rootRef} className={`group rounded-[28px] border border-white/15 bg-black/20 backdrop-blur-xl overflow-visible transition-all duration-500 ${expanded ? 'col-span-2' : ''}`}>
      <div className={`grid transition-all duration-500 ${expanded ? 'grid-cols-[1.1fr_0.9fr]' : 'grid-cols-1'}`}>
        <div className={
          `relative ${expanded ? 'min-h-[420px] md:min-h-[480px]' : 'min-h-[320px]'}`
        }>
          <Image
            src={getMediacardForTour(tour)}
            alt={tour.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(min-width: 768px) 50vw, 33vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-white/55">{tour.year}</p>
            <h3 className="mt-2 font-serif text-3xl font-bold leading-tight max-w-[80%]">{tour.title}</h3>
            <p className="mt-3 text-sm text-white/70">{formatStartDate(tour.startDate)}{tour.days ? ` · ${tour.days} days` : ''}</p>
          </div>
          <div className="absolute top-2 right-5 flex flex-col items-center gap-1 overflow-visible z-20">
            <ChevronDownIcon className={`w-5 h-5 text-white transition-transform ${expanded ? 'rotate-180' : ''}`} />
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center rounded-full border border-white/15 bg-black/35 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 hover:text-white transition-colors"
            >
              {expanded ? 'Less' : 'Details'}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="relative bg-white text-slate-900 overflow-hidden">
                {/* Thin floating handle above the white panel (pointer-events none so it doesn't intercept clicks) */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none handle-floating">
                  <div className="w-14 h-1.5 rounded-full bg-slate-200/80 shadow-sm" />
                </div>

                {/* Borderless close button (visible in expanded state) */}
                <button
                  type="button"
                  aria-label="Close itineraries"
                  onClick={() => onToggle()}
                  className="absolute top-3 right-4 z-30 text-slate-600 hover:text-slate-900 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="w-5 h-5" />
                </button>

            <div
              ref={scrollRef}
              className="h-full max-h-[560px] overflow-y-auto snap-y snap-mandatory desktop-tour-scene"
              onClick={(e) => {
                // Collapse when clicking on the expanded white area but not on any card, link or button
                const t = e.target as HTMLElement;
                if (t.closest('.tour-card-wrapper')) return;
                if (t.closest('a')) return;
                if (t.closest('button')) return;
                // If we got here, the click was on the white background/empty area -> collapse
                onToggle();
              }}
            >
              {years.map((year) => {
                const yearTours = tours.filter((item) => item.year === year);
                return (
                  <section data-embedded-year={year} key={year} className="relative min-h-[540px] snap-start overflow-hidden border-b border-slate-100 last:border-b-0 desktop-tour-section" style={{ scrollSnapStop: 'always' }}>
                    <span
                      aria-hidden
                      className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-extrabold text-slate-100 leading-none tracking-[-0.06em] giant-year-embedded"
                    >
                      {year}
                    </span>

                    <div className="relative z-10 w-full h-full flex items-center justify-center px-10 py-12">
                      <div className="relative z-10 w-full max-w-[1160px] mx-auto space-y-8">
                        <div className="text-center space-y-2">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Itineraries</p>
                          <h4 className="font-serif text-7xl font-bold text-slate-900">{year}</h4>
                        </div>

                        <div className="relative z-10 w-full tour-grid-desktop-embedded">
                          {yearTours.map((item) => (
                            <Link
                              key={item.id}
                              href={`/tour/${item.id}`}
                              prefetch={false}
                              className="tour-card-wrapper group"
                              onClick={() => {
                                try {
                                  publishLandingScrollTo(`tour-${item.year}`);
                                } catch {}
                              }}
                            >
                              <div className="tour-card-container">
                                <Image
                                  src={getMediacardForTour(item)}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  sizes="(min-width: 768px) 33vw, 50vw"
                                  unoptimized
                                />
                                <div className="tour-card-overlay" />
                                <div className="tour-card-content">
                                  <h5 className="tour-card-title">{item.title}</h5>
                                  <p className="tour-card-date">
                                    {formatStartDate(item.startDate)}{item.days ? ` · ${item.days} days` : ''}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {year === tour.year && (
                          <div className="flex justify-center pt-2">
                            <Link
                              href={`/tour/${tour.id}`}
                              prefetch={false}
                              className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-700 transition-colors"
                            >
                              Open highlighted itinerary
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .desktop-tour-scene {
          scroll-behavior: smooth;
        }

        .desktop-tour-section {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98));
        }

        .giant-year-embedded {
          font-size: clamp(11rem, 26vw, 19rem);
          color: #e7eaee;
          line-height: 1;
        }

        .tour-grid-desktop-embedded {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2.5rem;
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
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
          max-width: 260px;
          height: 300px;
          margin: 0 auto;
          border-radius: 1rem;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(15,23,42,0.08);
          transition: transform 0.3s ease;
          box-shadow: 0 14px 30px rgba(15,23,42,0.08);
        }

        .tour-card-wrapper:hover .tour-card-container {
          transform: translateY(-8px);
        }

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
          justify-content: flex-end;
          padding: 1.25rem;
          color: white;
        }

        .tour-card-title {
          font-weight: 700;
          font-size: 1.08rem;
          line-height: 1.15;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .tour-card-date {
          font-size: 0.8rem;
          margin-top: 0.25rem;
          opacity: 0.9;
        }
      `}</style>
    </article>
  );
}

export default function DesktopExpandableTourGrid() {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [isSmall, setIsSmall] = React.useState(false);

  React.useEffect(() => {
    // Keep a client-side guard so this component won't render on large viewports
    // even if SSR/hydration or missing CSS causes the md:hidden rule to fail.
    const mq = window.matchMedia('(max-width: 767.98px)');
    const handle = (ev: MediaQueryListEvent | MediaQueryList) => setIsSmall((ev as any).matches);
    // initialize
    setIsSmall(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', handle as EventListener);
    else mq.addListener(handle as any);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handle as EventListener);
      else mq.removeListener(handle as any);
    };
  }, []);
  const years = [2026, 2027] as const;

  // Render nothing on larger screens (defensive against SSR/hydration or missing CSS).
  if (!isSmall) return null;

  return (
    // Mobile-only: keep this component available for small screens but prevent rendering on md+.
    // The client-side guard above is the authoritative check; md:hidden remains as defensive CSS.
    <div className="block md:hidden relative z-30 w-full px-8 lg:px-12 pb-20">
      <div className="max-w-[1440px] mx-auto space-y-20">
        {years.map((year) => {
          const yearTours = tours.filter((tour) => tour.year === year);
          return (
            <section key={year} id={`tour-${year}`} className="min-h-screen flex flex-col justify-center gap-10">
              <div className="text-center text-white">
                <p className="text-sm uppercase tracking-[0.25em] text-white/45">Available itineraries</p>
                <h2 className="mt-4 font-serif text-7xl font-bold">{year}</h2>
              </div>
              <div className="grid grid-cols-2 gap-8 items-start">
                {yearTours.map((tour) => (
                  <DesktopTourCard
                    key={tour.id}
                    tour={tour}
                    expanded={expandedId === tour.id}
                    onToggle={() => setExpandedId((current) => (current === tour.id ? null : tour.id))}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
