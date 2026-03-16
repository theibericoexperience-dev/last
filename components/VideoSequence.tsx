"use client";
import { useEffect, useRef, useState, useCallback } from 'react';

interface VideoSequenceProps {
  className?: string;
  isPaused?: boolean;
  contained?: boolean;
  poster?: string;
  onLoad?: () => void;
}

export default function VideoSequence({ className = "", isPaused = false, contained = false, poster, onLoad }: VideoSequenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");
  const [failed, setFailed] = useState(false);
  const landingVideoSrc = "https://video.ibero.world/IBERO_HERO_SEO.webm";
  const landingVideoSrcMp4 = "https://video.ibero.world/IBERO_HERO_FINAL.mp4";

  // Set video src immediately on mount
  useEffect(() => {
    setVideoSrc(landingVideoSrc);
  }, []);

  // Ref callback: force muted + play as soon as the <video> DOM node mounts
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node;
    if (!node) return;
    // Fix React muted attribute bug: force it on the DOM element directly
    node.muted = true;
    node.defaultMuted = true;
    // Attempt autoplay immediately when the element appears
    node.play().catch(() => {});
  }, []);

  // Unified play/pause control — reacts to isPaused AND videoSrc changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoSrc) return;

    // Always enforce muted (browser autoplay policy)
    el.muted = true;

    const attemptPlay = async () => {
      try {
        if (isPaused) {
          el.pause();
        } else {
          await el.play();
        }
      } catch {
        // Autoplay blocked — will retry on first user interaction
      }
    };

    attemptPlay();

    // Fallback: retry play on first user interaction
    const onInteraction = () => {
      if (!isPaused && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', onInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', onInteraction);
  }, [videoSrc, isPaused]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <style>{`@media (max-width: 767px) { .landing-video { object-position: center center !important; } }`}</style>

      {/* Poster / Fallback — visible while video loads, fades out once ready */}
      {(!isLoaded || failed) && (
        <div
          className="absolute inset-0 z-10 transition-opacity duration-1000"
          style={{ opacity: isLoaded && !failed ? 0 : 1, background: '#000' }}
        >
          {poster && (
            <img src={poster} alt="background preview" className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {videoSrc && (
        <video
          ref={videoCallbackRef}
          src={videoSrc}
          className={`transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} landing-video`}
          style={
            contained
              ? {
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  zIndex: 20,
                }
              : {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  height: '100dvh',
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  zIndex: 20,
                }
          }
          muted
          autoPlay
          playsInline
          preload="metadata"
          loop
          onCanPlayThrough={() => { setIsLoaded(true); setFailed(false); if (onLoad) onLoad(); }}
          onError={() => { setFailed(true); if (onLoad) onLoad(); }}
        >
          <source src={landingVideoSrcMp4} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
