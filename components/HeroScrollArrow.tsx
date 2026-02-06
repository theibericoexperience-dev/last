"use client";

import React from 'react';

export default function HeroScrollArrow({ targetId = 'tour-grid' }: { targetId?: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button
      aria-label="Scroll down"
      className="hero-scroll-arrow fixed left-1/2 -translate-x-1/2 z-50"
      onClick={handleClick}
      style={{ bottom: '28px', background: 'transparent' }}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffd778" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <g>
          <path d="M12 4v12" stroke="url(#g1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 11l-7 7-7-7" stroke="url(#g1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </button>
  );
}
