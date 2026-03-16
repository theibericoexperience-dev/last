"use client";

import React, { useRef, useEffect } from 'react';

export default function AboutIntro({ onStartAction }: { onStartAction: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Ink video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
      >
        <source
          src="https://auth.ibero.world/storage/v1/object/public/video%20behind%20last/tinta-behind-background-2x.webm"
          type="video/webm"
        />
      </video>

      {/* Overlay content */}
      <div className="relative z-10 text-center pointer-events-auto">
        <p className="uppercase text-gray-200 text-2xl md:text-4xl tracking-wider font-semibold mb-6">
          5 years in the making
        </p>
        <h1
          className="text-7xl md:text-9xl font-extrabold tracking-tight text-gray-200 mb-10"
        >
          IBERO
        </h1>
        <button
          onClick={() => {
            try { videoRef.current?.pause(); } catch (_) {}
            onStartAction();
          }}
          className="px-8 py-2.5 rounded-full border border-gray-200 text-gray-200 font-semibold bg-transparent hover:bg-white/10 transition-all text-sm uppercase tracking-widest"
        >
          Start
        </button>
      </div>
    </div>
  );
}
