"use client";
import React from 'react';
import Link from 'next/link';

type Props = {
  year: number;
  title?: string;
  paragraphs: string[];
  media?: string;
  hitos: string[];
  mediaAutoplay?: boolean;
};

export default function YearView({ year, title, paragraphs, media, hitos, mediaAutoplay }: Props) {
  return (
    <div className="w-full">
      <div className="relative w-full h-[70vh] bg-white rounded-md" style={{ overflow: 'hidden' }}>
        <div className="absolute top-6 left-[3.25rem] z-30 pointer-events-none">
          <span className="text-3xl md:text-4xl lg:text-6xl font-normal tracking-tight text-gray-900">{title ?? year}</span>
        </div>

        <div className="flex w-full h-full">
          <div className="w-1/2 pr-6 pl-14 overflow-hidden pt-[120px]">
            <div className="space-y-6 max-w-lg">
              <div className="text-gray-700" style={{ lineHeight: 1.5 }}>
                {paragraphs.map((p, i) => (
                  <span key={i} className="block mb-4" dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </div>
          </div>

          <div className="w-1/2 p-6 overflow-hidden border-l border-gray-100 flex items-start pt-16">
            <div className="w-full">
              <div className="mb-4 flex justify-center">
                {media && media.endsWith('.mp4') ? (
                  <video
                    src={media}
                    className="w-11/12 md:w-3/4 rounded-md bg-black max-h-[360px] object-cover"
                    muted
                    playsInline
                    loop
                    autoPlay={Boolean(mediaAutoplay)}
                  />
                ) : media ? (
                  <img src={media} className="w-11/12 md:w-3/4 rounded-md bg-black max-h-[360px] object-cover" alt={`media ${year}`} />
                ) : (
                  <div className="w-11/12 md:w-3/4 rounded-md bg-gray-200 h-56 flex items-center justify-center text-gray-600">No media</div>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-md max-w-md mx-auto mt-6">
                <ul className="grid grid-cols-2 gap-3 text-sm list-none">
                  {hitos.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
