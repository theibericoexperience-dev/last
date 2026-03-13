"use client";

import React from 'react';
import EcosystemContent from '@/components/EcosystemContent';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function EcosystemModal({ onCloseAction }: { onCloseAction: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 lg:p-6 bg-white/70 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if ((e.target as Element)?.closest?.('[data-no-close]')) return;
        onCloseAction();
      }}
    >
      <div
        data-no-close
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full max-w-[1400px] mx-auto flex flex-col overflow-hidden rounded-3xl border border-white/30 shadow-2xl"
        style={{
          backgroundColor: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-black/40">Ecosystem</span>
          <button
            onClick={onCloseAction}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-gray-700 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden rounded-xl m-3 mt-1 bg-white/60 backdrop-blur-sm border border-white/50">
          <EcosystemContent mediaAutoplay />
        </div>
      </div>
    </div>
  );
}
