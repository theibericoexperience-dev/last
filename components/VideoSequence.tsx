"use client";
import { useEffect, useRef, useState } from 'react';

interface VideoSequenceProps {
  className?: string;
  isPaused?: boolean;
  contained?: boolean;
}

export default function VideoSequence({ className = "", isPaused = false, contained = false }: VideoSequenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");
  const landingVideoSrc = "https://pub-4595df28cecb404d939e877381aec4a0.r2.dev/IBERO-LANDING_hero_295mb.mp4";

  // Lazy load the video src to prevent contention with initial JS chunk loading (avoids ChunkLoadError)
  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoSrc(landingVideoSrc);
    }, 500); // Small delay to let critical chunks load first
    return () => clearTimeout(timer);
  }, []);

  // Pausar/reanudar video según prop isPaused
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoSrc) return;
    if (isPaused) {
      el.pause();
    } else {
      try { el.play(); } catch (e) {}
    }
  }, [isPaused]);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Best-effort autoplay attempt; if blocked, show the button.
    const tryPlay = () => {
      try {
        const p = el.play();
        if (p && typeof (p as any).then === 'function') {
          (p as Promise<void>).then(() => setNeedsUserGesture(false)).catch(() => setNeedsUserGesture(true));
        }
      } catch (e) {
        setNeedsUserGesture(true);
      }
    };

    // Try immediately and again on first user interaction.
    tryPlay();
    const onFirstInteraction = () => tryPlay();
    window.addEventListener('pointerdown', onFirstInteraction, { once: true } as any);

    return () => {
      try { window.removeEventListener('pointerdown', onFirstInteraction as any); } catch (e) {}
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        src={videoSrc}
        playsInline
        autoPlay
        muted
        loop
        preload="auto"
      />
      {/* Fondo negro solo visible si el video no está cargado */}
      {!isLoaded && (
        <div
          style={{
            position: contained ? 'absolute' : 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: contained ? '100%' : '100vh',
            background: '#000',
            zIndex: 1,
            transition: 'opacity 0.4s',
            opacity: 1,
            pointerEvents: 'none',
          }}
        />
      )}
      <video
        ref={videoRef}
        src={videoSrc}
        style={{
          position: contained ? 'absolute' : 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: contained ? '100%' : '100vh',
          objectFit: 'cover',
          // Keep zIndex high so the video is visible; page content and overlays
          // are positioned over it by design. Using a negative z-index caused
          // the video to be hidden behind the root in some browsers.
          zIndex: contained ? 0 : 20,
        }}
        muted
        autoPlay
        playsInline
        // Avoid preloading the full 295MB file on navigation; do not preload to
        // prevent large network requests from interfering with app chunk loads.
        preload="none"
        loop
        poster="https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/MISC/thumbnail.jpg"
        onCanPlay={() => { setIsLoaded(true); setFailed(false); }}
        onLoadedData={() => { setIsLoaded(true); setFailed(false); }}
        onError={() => { setIsLoaded(false); setFailed(true); }}
      />

      {needsUserGesture && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={() => {
              try {
                const el = videoRef.current;
                if (!el) return;
                el.play().then(() => setNeedsUserGesture(false)).catch(() => setNeedsUserGesture(true));
              } catch (e) {
                setNeedsUserGesture(true);
              }
            }}
            className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-full font-medium tracking-wide hover:bg-white/30 transition-all duration-300 hover:scale-105 shadow-lg flex items-center space-x-2"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Reproducir Video</span>
          </button>
        </div>
      )}

      {/* If video failed to load, show a full-bleed poster as fallback */}
      {failed && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 19, pointerEvents: 'none' }}>
          <img src="https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/MISC/thumbnail.jpg" alt="landing thumbnail" style={{ width: '100%', height: '100vh', objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );
}
