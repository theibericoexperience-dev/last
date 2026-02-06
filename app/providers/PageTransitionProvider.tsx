"use client";

import React, { useEffect } from 'react';
import { gsap } from 'gsap';
// Lightweight page entry animation helper. All cross-route transitions are now
// handled by simple route changes; this hook only animates page content on mount.

export function usePageEntryAnimation(ref: React.RefObject<HTMLElement>, variant: 'landing' | 'panel') {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let tween: gsap.core.Tween | null = null;

    const run = () => {
      // Simple variant-based entry animations. Server-side render just shows content.
      if (typeof window === 'undefined') {
        // SSR: show content without animation.
        gsap.set(el, { autoAlpha: 1, yPercent: 0, scaleY: 1, y: 0 });
        return;
      }

      if (variant === 'panel') {
        // Panel: background appears immediately; inner content can emerge from below.
        // Expect the calling component to mark inner elements with [data-panel-anim]
        // if staggered emergence is desired.
        gsap.set(el, { autoAlpha: 1, y: 0, scaleY: 1 });

        const targets = el.querySelectorAll<HTMLElement>('[data-panel-anim]');
        if (targets.length > 0) {
          // Elements emerge softly from below their final position.
          tween = gsap.fromTo(
            targets,
            { autoAlpha: 0, y: 40 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: 'power3.out',
              stagger: 0.06,
            }
          );
        } else {
          // Fallback: animate the whole panel block from below.
          tween = gsap.fromTo(
            el,
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }
          );
        }
      } else {
        // Landing: subtle fade/slide.
        tween = gsap.fromTo(
          el,
          { autoAlpha: 0, yPercent: 6 },
          { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: 'power3.out' }
        );
      }
    };

    run();
    return () => {
      tween?.kill();
    };
  }, [ref, variant]);
}
