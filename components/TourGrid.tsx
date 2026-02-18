"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import tours, { TourOverview } from '../data/toursOverview';
import mediaUrl from '@/lib/media/mediaUrl';
import { publishLandingScrollTo } from '../lib/navigation/intents';
import '../styles/tour-grid.css';

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

function getShortTitle(title: string) {
    if (title.toLowerCase().includes('new zealand') && title.toLowerCase().includes('australia')) {
        return 'AUSTRALIA & NEW ZEALAND';
    }
    return title;
}

export default function TourGrid({ isModal = false, onCardClickAction, goToAction }: { isModal?: boolean, onCardClickAction?: () => void, goToAction?: (id: string) => void }) {
    const onCardClickHandler = onCardClickAction;
    const [activeYear, setActiveYear] = React.useState<2026 | 2027 | null>(null);

    const tours2026 = tours.filter((t) => t.year === 2026);
    const tours2027 = tours.filter((t) => t.year === 2027);

    React.useEffect(() => {
        if (isModal) return;
        const root = document.querySelector('.landing-main') as HTMLElement | null;
        if (!root) return;

        const el2026 = document.getElementById('tour-2026');
        const el2027 = document.getElementById('tour-2027');
        if (!el2026 || !el2027) return;

        const obs = new IntersectionObserver(
            (entries) => {
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

    function renderCard(t: TourOverview) {
        return (
            <Link key={t.id} href={`/tour/${t.id}`} prefetch={false} legacyBehavior>
                <a
                    className="group relative z-10 inline-block w-full max-w-[260px]"
                    onClick={(e) => {
                        try {
                            const sectionId = `tour-${t.year}`;
                            sessionStorage.setItem('landing:lastSection', sectionId);
                            publishLandingScrollTo(sectionId);
                        } catch (err) { }
                        if (onCardClickHandler) onCardClickHandler();
                    }}
                >
                    <div className="relative rounded-2xl bg-white/5 border border-white/10 transition-transform duration-300 transform-gpu group-hover:-translate-y-2 aspect-square">
                        <Image
                            src={getMediacardForTour(t) as string}
                            alt={t.title}
                            fill
                            sizes="(max-width: 768px) 80vw, (max-width: 1024px) 40vw, 260px"
                            className="object-cover rounded-2xl"
                            unoptimized
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
                        <div className="absolute left-4 bottom-4 right-4 text-white p-2">
                            <h4 className="text-lg font-bold leading-tight line-clamp-2">{getShortTitle(t.title)}</h4>
                            {t.startDate && <p className="mt-1 text-sm font-bold text-white/90">{formatStartDate(t.startDate)}</p>}
                        </div>
                    </div>
                </a>
            </Link>
        );
    }

    function renderYearSection(year: number, tours: TourOverview[]) {
        return (
            <div id={`tour-${year}`} className="tour-grid-landing-section px-4">
                <span aria-hidden className="tour-grid-giant-year pointer-events-none select-none absolute z-0">{year}</span>
                <h3 className="sr-only">{year}</h3>
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-center justify-center">
                    {tours.length > 0 ? (
                        tours.map(renderCard)
                    ) : (
                        <div className="text-white/60 col-span-full text-center">No tours listed for {year}</div>
                    )}
                </div>
            </div>
        );
    }
    
    function renderModalContent() {
        return (
            <div className="flex flex-col gap-12 py-12">
                <div>
                    <h2 className="text-4xl font-bold text-center text-white mb-8">2026</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tours2026.map(renderCard)}
                    </div>
                </div>
                <div>
                    <h2 className="text-4xl font-bold text-center text-white mb-8">2027</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tours2027.map(renderCard)}
                    </div>
                </div>
                <div className="flex justify-center mt-8">
                    <a
                        href="/panel?tourCreatorOpen=1"
                        className="px-8 py-4 rounded-full bg-gradient-to-r from-black via-gray-800 to-black text-white text-xl font-semibold shadow-lg border-2 border-white/80 hover:scale-105 hover:bg-white/10 transition-all duration-300"
                    >
                        Custom Tours
                    </a>
                </div>
            </div>
        )
    }

    function renderLandingContent() {
        return (
            <>
                {activeYear != null && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/25 pointer-events-none z-40 transition-colors duration-300"
                            aria-hidden
                        />
                        <button
                            className={`tour-grid-floating-x fixed top-12 right-6 sm:right-12 z-50 ${activeYear != null ? ' tour-grid-floating-x-visible' : ''}`}
                            aria-label="Back to top"
                            onClick={() => {
                                try { publishLandingScrollTo('hero-section'); } catch (err) { }
                            }}
                        >
                            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="27" y1="9" x2="9" y2="27" />
                                <line x1="9" y1="9" x2="27" y2="27" />
                            </svg>
                        </button>
                    </>
                )}
                {renderYearSection(2026, tours2026)}
                {renderYearSection(2027, tours2027)}
            </>
        )
    }

    return (
        <div id="tour-grid" className={`relative z-30 w-full ${isModal ? '' : 'flex flex-col'}`}>
            {isModal ? renderModalContent() : renderLandingContent()}
        </div>
    );
}
