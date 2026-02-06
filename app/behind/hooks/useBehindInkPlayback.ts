"use client";

import { useEffect } from 'react';

export function useBehindInkPlayback({
  phase,
  inkRef,
}: {
  phase: 'intro' | 'hero' | 'modal';
  inkRef: React.RefObject<HTMLVideoElement | null>;
}) {
  // When entering modal phase, pause the page ink video but keep it visible. When returning to intro, play from start.
  useEffect(() => {
    if (phase === 'modal') {
      try {
        if (inkRef.current) {
          inkRef.current.currentTime = 0;
          inkRef.current.pause();
        }
      } catch {
        // ignore
      }
    }
    if (phase === 'intro') {
      try {
        if (inkRef.current) {
          inkRef.current.currentTime = 0;
          inkRef.current.play().catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, [phase, inkRef]);

  // Intro speed pulse: start at 2x speed for first 2s, then ease back to 1x.
  useEffect(() => {
    const v = inkRef.current;
    if (!v) return;

    let running = false;
    let holdTimeout: number | null = null;
    const stepTimeouts: number[] = [];

    const applyPulse = () => {
      try {
        if (!v || running) return;
        running = true;
        v.playbackRate = 2;
        v.muted = true;
        v.play().catch(() => {});

        holdTimeout = window.setTimeout(() => {
          const steps = 10;
          const duration = 800;
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const id = window.setTimeout(() => {
              try {
                if (v) v.playbackRate = 2 - t * 1;
              } catch {
                // ignore
              }
              if (i === steps) running = false;
            }, Math.round((i - 1) * (duration / steps)));
            stepTimeouts.push(id);
          }
        }, 2000);
      } catch {
        // ignore
      }
    };

    if (phase === 'intro') {
      applyPulse();
      v.addEventListener('play', applyPulse);
    } else {
      try {
        v.pause();
      } catch {
        // ignore
      }
    }

    return () => {
      try {
        v.removeEventListener('play', applyPulse);
      } catch {
        // ignore
      }

      if (holdTimeout) clearTimeout(holdTimeout);
      stepTimeouts.forEach((t) => clearTimeout(t));
    };
  }, [phase, inkRef]);
}
