"use client";

import Link from 'next/link';
import Image from 'next/image';
import tours, { TourOverview } from '@/data/toursOverview';
import mediaUrl from '@/lib/media/mediaUrl';
import { ArrowRightIcon, CalendarIcon } from '@heroicons/react/24/outline';

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

export default function MobileItinerariesGrid() {
  const years = [2026, 2027, 2028] as const;

  return (
  <div className="flex flex-col gap-16 pb-12 pt-2">
      {years.map((year) => {
        const yearTours = tours.filter((tour) => tour.year === year);
        return (
          <section key={year} className="space-y-8">
            <div className="text-center space-y-3">
              <h3 className="text-slate-900 text-[1.7rem] font-bold tracking-[0.08em]">{year}</h3>
              <span className="block text-[12px] uppercase tracking-[0.2em] text-slate-400">
                {yearTours.length} itineraries
              </span>
            </div>

            {yearTours.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-7">
                {yearTours.map((tour) => (
                  <Link
                    key={tour.id}
                    href={`/tour/${tour.id}`}
                    prefetch={false}
                    className="group relative flex flex-col rounded-2xl overflow-hidden min-h-[170px] border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
                  >
                    <div className="relative h-[170px]">
                      <Image
                        src={getMediacardForTour(tour)}
                        alt={tour.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 767px) 50vw, 33vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
                      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur text-[10px] font-semibold px-2 py-1 rounded-full text-slate-800 flex items-center gap-1 shadow-sm">
                        <CalendarIcon className="w-3 h-3 text-amber-600" />
                        {tour.startDate || 'TBA'}
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-3 z-10 flex items-end justify-between gap-3">
                      <div>
                        <h4 className="font-serif text-[12px] leading-tight text-white font-bold drop-shadow-md">
                          {tour.title}
                        </h4>
                        {tour.days && (
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/70">
                            {tour.days} days
                          </p>
                        )}
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-white/80 transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
                <p className="text-sm text-slate-400">No itineraries announced yet for {year}.</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
