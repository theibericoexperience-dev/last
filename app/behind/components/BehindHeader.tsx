"use client";

import Link from 'next/link';
import React from 'react';
import UserBubble from '@/components/UserBubble';

export function BehindHeader({
  isHeaderOpaque,
}: {
  isHeaderOpaque: boolean;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 py-2 px-4 bg-transparent pointer-events-none" style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-none" style={{ minHeight: 40 }}>
        <div className="flex-1 pointer-events-auto">
          <Link href="/" className="relative -left-6 text-lg font-extrabold tracking-widest no-underline transition-colors duration-300 text-white">
            IBERO
          </Link>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="relative z-40">
            <UserBubble
              variant="inline"
              buttonClassName={`rounded-full p-1.5 flex items-center justify-center border ${isHeaderOpaque ? 'bg-white/10 text-black border-black/10' : 'bg-white/5 text-white border-white/20'}`}
            />
          </div>

          <button
            aria-label="Go to 2026 tours"
            onClick={() => {
              window.location.href = '/?section=tour-2026';
            }}
            className={`p-2 rounded-full ${isHeaderOpaque ? 'bg-white/10 text-black' : 'bg-white/5 text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
