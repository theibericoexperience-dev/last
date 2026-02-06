"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import type { Splide as SplideInstance } from '@splidejs/splide';
import '@splidejs/react-splide/css/core';
import tours from '../data/toursOverview';
import { safeWebPath } from '@/app/tour/utils/media';

const wavePath = 'M0,96L80,112C160,128,320,160,480,192C640,224,800,256,960,240C1120,224,1280,160,1360,128L1440,96V320H0Z';

export default function FeaturedSlider() {
  const [splide, setSplide] = useState<SplideInstance | null>(null);
  const featuredTours = useMemo(() => tours.slice(0, 9), []);

  const sliderOptions = {
    type: 'loop' as const,
    perPage: 3,
    perMove: 1,
    gap: '1.8rem',
    arrows: false,
    pagination: false,
    drag: 'free' as const,
    speed: 900,
    easing: 'ease',
    breakpoints: {
      1280: { perPage: 2, gap: '1.5rem' },
      900: { perPage: 1, gap: '1rem' }
    }
  };

  const handlePrev = () => splide?.go('<');
  const handleNext = () => splide?.go('>');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#02000d] via-[#070223] to-[#02000a] py-20 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-[-24%] w-[140%] -translate-x-1/2 opacity-40 sm:w-full sm:left-1/2">
        <svg viewBox="0 0 1440 320" className="w-full text-[#14052d]">
          <path fill="currentColor" d={wavePath} />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[-20%] w-[140%] -translate-x-1/2 opacity-30 sm:w-full sm:left-1/2">
        <svg viewBox="0 0 1440 320" className="w-full rotate-180 text-[#0a031c]">
          <path fill="currentColor" d={wavePath} />
        </svg>
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">Routes in motion</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Curated journeys sweeping across Iberia & beyond</h2>
          <p className="mt-4 text-base text-white/70">Swipe through our upcoming departures and extensions. Each card mirrors the Cards reference: full-bleed artwork, bold typography, and the same hover lift as the Webflow demo.</p>
        </header>

        <div className="relative">
          <div className="absolute -right-1 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3 lg:right-[-70px] lg:flex-row">
            <SliderControl direction="prev" label="Previous" onClick={handlePrev} />
            <SliderControl direction="next" label="Next" onClick={handleNext} />
          </div>
          <Splide options={sliderOptions} onMounted={setSplide} aria-label="Upcoming Ibero tours">
            {featuredTours.map((tour) => (
              <SplideSlide key={tour.id}>
                <Link
                  href={`/tour/${tour.id}`}
                  className="group block h-[520px] w-full overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-3 hover:border-white/40"
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={safeWebPath(tour.cardImage)}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 30vw"
                      className="object-cover"
                      priority={tour.id === featuredTours[0].id}
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
                    <div className="absolute inset-0 flex flex-col justify-between p-8">
                      <div>
                        <p className="text-xs uppercase tracking-[0.5em] text-white/60">{tour.year}</p>
                        <h3 className="mt-4 text-3xl font-semibold leading-tight">{tour.title}</h3>
                        {tour.description && (
                          <p className="mt-4 h-[72px] overflow-hidden text-sm text-white/70">
                            {tour.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs uppercase">
                        <span className="tracking-[0.5em] text-white/70">Explore</span>
                        <div className="flex items-center gap-2 text-white/70">
                          <span className="text-[10px] tracking-[0.4em]">VIEW</span>
                          <span className="relative block h-[2px] w-16 overflow-hidden rounded-full bg-white/30">
                            <span className="absolute inset-0 origin-left scale-x-0 bg-white transition-transform duration-500 group-hover:scale-x-100" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </SplideSlide>
            ))}
          </Splide>
        </div>
      </div>
    </section>
  );
}

function SliderControl({ direction, onClick, label }: { direction: 'prev' | 'next'; onClick: () => void; label: string }) {
  const isNext = direction === 'next';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative h-14 w-14 overflow-hidden rounded-full border border-white/30 bg-white/10 text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span
        className={`absolute inset-0 rounded-full bg-white/90 transition-transform duration-500 ${isNext ? 'translate-x-full group-hover:translate-x-0' : '-translate-x-full group-hover:translate-x-0'}`}
      />
      <svg
        viewBox="0 0 24 24"
        className={`relative z-10 h-5 w-5 ${isNext ? '' : 'rotate-180'} transition-transform duration-300 group-hover:translate-x-[2px]`}
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
