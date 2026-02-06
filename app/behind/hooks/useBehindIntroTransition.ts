"use client";

import { useEffect, useRef } from 'react';

export function useBehindIntroTransition(
  phase: 'intro' | 'hero' | 'modal',
  setPhaseAction: (p: 'intro' | 'hero' | 'modal') => void,
  inkRef: React.RefObject<HTMLVideoElement | null>,
) {
  const touchStartY = useRef<number | null>(null);
  const canScrollRef = useRef(false);

  // Enable scroll-driven transition only after 5s have elapsed.
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        canScrollRef.current = true;
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearTimeout(id);
  }, []);

  // Manage intro swipe/scroll to move intro -> hero (same as START)
  useEffect(() => {
    function goHero() {
      setPhaseAction('hero');
      try {
        inkRef.current?.pause();
      } catch {
        // ignore
      }
    }

    function onWheel(e: WheelEvent) {
      try {
        if (phase !== 'intro') return;
        if (!canScrollRef.current) return;
        if (Math.abs(e.deltaY) < 30) return;
        e.preventDefault();
        if (e.deltaY > 0) goHero();
      } catch {
        // ignore
      }
    }

    function onTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches && e.touches[0] ? e.touches[0].clientY : null;
    }

    function onTouchEnd(e: TouchEvent) {
      try {
        if (phase !== 'intro') return;
        if (!canScrollRef.current) return;
        const start = touchStartY.current;
        const end = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : null;
        touchStartY.current = null;
        if (start == null || end == null) return;
        const d = start - end;
        if (d > 40) goHero();
      } catch {
        // ignore
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel as any);
      window.removeEventListener('touchstart', onTouchStart as any);
      window.removeEventListener('touchend', onTouchEnd as any);
    };
  }, [phase, setPhaseAction, inkRef]);
}
