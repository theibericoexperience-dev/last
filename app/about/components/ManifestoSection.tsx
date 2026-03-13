"use client";

import React, { useState, useEffect } from 'react';

export default function ManifestoSection({
  onHistoryAction,
  onEcosystemAction,
  hidden,
}: {
  onHistoryAction: () => void;
  onEcosystemAction: () => void;
  hidden?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{
        transform: hidden ? 'translateY(-120%)' : undefined,
        transition: 'transform 700ms cubic-bezier(0.16,1,0.3,1)'
      }}
    >
      {/* Manifesto text */}
      <div
        className="max-w-2xl text-center space-y-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 800ms cubic-bezier(0.16,1,0.3,1), transform 800ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
  <p className="text-lg md:text-xl leading-relaxed text-[#111111] font-serif">
          Ibero is born as a concept in Seoul, Korea, during Ramiro&apos;s last year of his Bachelor&apos;s
          Degree in the Summer of 2021, with the idea of promoting the regions of Extremadura &amp;
          Alentejo as true gems for the people looking for unspoiled locations that haven&apos;t been
          affected by massive tourism.
        </p>
  <p className="text-lg md:text-xl leading-relaxed text-[#111111] font-serif">
          5 years later, Ibero is expanding to other locations in the planet with the same purpose,
          give travelers authentic options with the same ingredient: True love for Travel.
        </p>
      </div>

      {/* Action buttons */}
      <div
        className="mt-12 flex items-center gap-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 800ms cubic-bezier(0.16,1,0.3,1) 300ms, transform 800ms cubic-bezier(0.16,1,0.3,1) 300ms',
        }}
      >
        <button
          onClick={onHistoryAction}
          className="px-6 py-2.5 rounded-full border border-black/20 text-sm font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all"
        >
          History
        </button>
        <button
          onClick={onEcosystemAction}
          className="px-6 py-2.5 rounded-full border border-black/20 text-sm font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all"
        >
          Ecosystem
        </button>
      </div>
    </div>
  );
}
