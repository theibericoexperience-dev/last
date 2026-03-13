"use client";

import React, { useEffect, useRef, useState } from 'react';
import { behindYears, type YearData } from '@/data/behindYears';
import { getSupabaseUrl } from '@/lib/media-resolver';
import YearRail from './YearRail';
import { useSectionObserver } from '@/hooks/useSectionObserver';

const merged2122: YearData = {
  year: 2021,
  title: '2021-22',
  paragraphs: [
    ...(behindYears.find((y) => y.year === 2021)?.paragraphs ?? []),
    ...(behindYears.find((y) => y.year === 2022)?.paragraphs ?? []),
  ],
  hitos: [
    ...(behindYears.find((y) => y.year === 2021)?.hitos ?? []),
    ...(behindYears.find((y) => y.year === 2022)?.hitos ?? []),
  ],
  media: behindYears.find((y) => y.year === 2022)?.media ?? behindYears.find((y) => y.year === 2021)?.media,
};

const orderedRows: YearData[] = [
  merged2122,
  ...behindYears.filter((y) => y.year !== 2021 && y.year !== 2022),
];

const yearMediaMap: Record<number, string> = {
  2021: getSupabaseUrl('YEARS MEDIA/2022.mp4'),
  2022: getSupabaseUrl('YEARS MEDIA/2022.mp4'),
  2023: getSupabaseUrl('YEARS MEDIA/2023.mov'),
  2024: getSupabaseUrl('YEARS MEDIA/2024.webp'),
  2025: getSupabaseUrl('YEARS MEDIA/2025.webp'),
};

function YearSection({ row, next, id }: { row: YearData; next?: YearData; id?: string }) {
  const paragraphsRef = useRef<HTMLDivElement | null>(null);
  const [showPager, setShowPager] = useState(false);
  const [paraIndex, setParaIndex] = useState(0);

  useEffect(() => {
    if (row.year !== 2024) return;
    const el = paragraphsRef.current;
    if (!el) return;
    // If content overflows, enable pager behavior for 2024
    if (el.scrollHeight > el.clientHeight) setShowPager(true);
  }, [row.year]);

  function handleNextPara() {
    setParaIndex((p) => Math.min(p + 1, Math.max(0, row.paragraphs.length - 1)));
  }

  return (
    <section id={id} className="year-section snap-start min-h-screen">
      <div className="year-top flex flex-col items-center justify-start pt-0 md:pt-2">
        <div className="history-stage w-full px-6 md:px-10">
          {/* year badge positioned absolutely so the card doesn't shift */}
          <div className="year-badge absolute-year-badge inline-block px-2 py-0 md:px-3 md:py-1 rounded-full">
            <div className="text-[0.95rem] md:text-[1.45rem] font-semibold text-[#111827] leading-tight">
              {String(row.title ?? row.year)}
            </div>
          </div>

          <div className="content-grid">
            <div className="left-col">
              <div ref={paragraphsRef} className="paragraphs-stack">
                {row.year === 2024 && showPager ? (
                  <p className="history-paragraph text-[0.98rem] md:text-[1rem] text-justify text-[#171717]">
                    {row.paragraphs[paraIndex]}
                  </p>
                ) : (
                  row.paragraphs.map((p, i) => (
                    <p key={`para-${i}`} className="history-paragraph text-[0.98rem] md:text-[1rem] text-justify text-[#171717]">
                      {p}
                    </p>
                  ))
                )}
              </div>

              {row.year === 2024 && showPager && row.paragraphs.length > 1 ? (
                <div className="mt-4">
                  <button aria-label="Siguiente párrafo" onClick={handleNextPara} className="history-next-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="right-col right-stack">
              <aside className="history-media-shell" aria-label={`Media for ${String(row.title ?? row.year)}`}>
                <MediaCard media={yearMediaMap[row.year] ?? row.media} alt={String(row.title ?? row.year)} />
              </aside>

              <div className="hitos-stack hitos-grid right-hitos mt-2">
                {row.hitos.map((hito, i) => (
                  <div key={`hito-${i}`} className="hito-item text-xs md:text-[0.88rem] leading-tight text-[#171717] opacity-80">
                    {hito}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="year-bottom flex flex-col items-center justify-center gap-1">
        {next ? (
          <>
            <div className="next-year-label text-[1.4rem] md:text-[2rem] font-semibold text-[#111827] opacity-60">
              {String(next.title ?? next.year)}
            </div>
            <div className="animate-bounce opacity-40">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
              </svg>
            </div>
          </>
        ) : (
          <div className="next-year-label text-[1rem] text-[#111827] opacity-30">&nbsp;</div>
        )}
      </div>
    </section>
  );
}

export default function HistoryColumns({ historyIndex, onHistoryIndexChangeAction }: { historyIndex: number; onHistoryIndexChangeAction: (index: number) => void }) {
  void historyIndex;
  void onHistoryIndexChangeAction;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeId = useSectionObserver(containerRef);

  function scrollToId(id: string) {
    const el = containerRef.current?.querySelector(`#${id}`) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="history-snap-outer w-full flex justify-center">
      <div className="hidden md:block">
        <YearRail rows={orderedRows} activeId={activeId} onSelectAction={scrollToId} />
      </div>

  <div ref={containerRef} className="history-snap-container scrollbar-hide h-screen overflow-y-auto scroll-smooth w-full max-w-[1280px]">
        {orderedRows.map((row, idx) => {
          const next = orderedRows[idx + 1];
          const id = `year-${row.year}`;
          return (
            <YearSection key={`year-${row.year}-${idx}`} row={row} next={next} id={id} />
          );
        })}
      </div>
    </div>
  );
}

function MediaCard({ media, alt }: { media?: string; alt: string }) {
  const resolvedMedia = media ? getSupabaseUrl(media) : '';

  if (!resolvedMedia) {
    return <div className="w-full aspect-[21/9] md:aspect-[2.35/1] rounded-[20px] bg-transparent" />;
  }

  const isVideo = /\.(mp4|mov|webm)$/i.test(resolvedMedia);

  return (
    <div className="relative w-full h-full min-h-[140px] aspect-[21/9] md:aspect-[2.35/1] rounded-[20px] overflow-hidden bg-transparent transition-all duration-300 ease-out">
      {isVideo ? (
        <video src={resolvedMedia} className="w-full h-full object-cover" muted playsInline autoPlay loop preload="metadata" />
      ) : (
        <img src={resolvedMedia} className="w-full h-full object-cover" alt={alt} loading="eager" />
      )}
    </div>
  );
}
