"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { behindYears, yearsList } from '@/data/behindYears';

export function useBehindModalChevrons({
  showBehindModal,
  behindView,
  bigYear,
  modalRef,
  router,
}: {
  showBehindModal: boolean;
  behindView: 'history' | 'ecosystem';
  bigYear: number | null;
  modalRef: React.RefObject<HTMLDivElement | null>;
  router: { push: (href: string) => void };
}) {
  const [arrowStyles, setArrowStyles] = useState<{ left?: React.CSSProperties; right?: React.CSSProperties }>();

  // Modal-specific years sequence: treat 2021-2022 as a single combined view and omit 2022.
  const modalYears = yearsList.filter((y) => Number(y) !== 2022);

  // Position chevrons based on modal bounding box.
  useLayoutEffect(() => {
    function compute() {
      try {
        const m = modalRef.current;
        if (!m) return false;
        const rect = m.getBoundingClientRect();
        if (!isFinite(rect.width) || !isFinite(rect.height) || rect.width === 0 || rect.height === 0) return false;
        const top = rect.top + rect.height / 2;
        // place buttons just outside the modal (offset) and clamp to viewport with a small margin
        const offsetLeft = 24; // px from modal edge
        const offsetRight = 12; // px from modal edge
        const minMargin = 8; // px from viewport edge
        const btnWidth = 64; // approximate button area width
        let leftX = Math.round(rect.left - btnWidth - offsetLeft);
        let rightX = Math.round(rect.right + offsetRight);

        // clamp so chevrons stay within viewport
        leftX = Math.max(minMargin, Math.min(leftX, window.innerWidth - btnWidth - minMargin));
        rightX = Math.max(minMargin, Math.min(rightX, window.innerWidth - btnWidth - minMargin));

        try {
          console.debug('[useBehindModalChevrons] modal rect', rect, 'computed', { leftX, rightX, top });
        } catch (e) {}
        setArrowStyles({
          left: { position: 'fixed', left: `${leftX}px`, top: `${top}px`, transform: 'translateY(-50%)', zIndex: 2147483647, pointerEvents: 'auto' },
          right: { position: 'fixed', left: `${rightX}px`, top: `${top}px`, transform: 'translateY(-50%)', zIndex: 2147483647, pointerEvents: 'auto' },
        });
        return true;
      } catch {
        return false;
      }
    }

    if (!showBehindModal) return;

    let mounted = true;
    let attempts = 0;
    const maxAttempts = 10;

    const perform = () => {
      if (!mounted) return;
      const ok = compute();
      attempts += 1;
      if (!ok && attempts < maxAttempts) requestAnimationFrame(perform);
    };

    requestAnimationFrame(perform);

    const onScrollOrResize = () => {
      try {
        compute();
      } catch {
        // ignore
      }
    };

    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });

    let ro: ResizeObserver | null = null;
    try {
      if (typeof ResizeObserver !== 'undefined' && modalRef.current) {
        ro = new ResizeObserver(() => {
          try {
            compute();
          } catch {
            // ignore
          }
        });
        ro.observe(modalRef.current);
      }
    } catch {
      ro = null;
    }

    return () => {
      mounted = false;
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize as any);
      try {
        ro?.disconnect();
      } catch {
        // ignore
      }
    };
  }, [showBehindModal, modalRef]);

  // Broadcast disabled state for chevrons.
  useEffect(() => {
    try {
      if (!showBehindModal) return;
      const current = bigYear ?? (behindYears && behindYears.length ? behindYears[0].year : null);
      const modalCurrent = current === 2022 ? 2021 : current;
      const idx = modalCurrent != null ? modalYears.indexOf(Number(modalCurrent)) : -1;
      const disabledPrev = idx <= 0;
      const disabledNext = idx >= modalYears.length - 1 || idx === -1;
      window.dispatchEvent(new CustomEvent('historyState', { detail: { disabledPrev, disabledNext } }));
    } catch {
      // ignore
    }
  }, [showBehindModal, bigYear, modalYears]);

  // Listen to chevron navigation events.
  useEffect(() => {
    const onNav = (e: any) => {
      try {
        const dir = e && e.detail;
        const current = bigYear ?? (behindYears && behindYears.length ? behindYears[0].year : null);
        const modalCurrent = current === 2022 ? 2021 : current;
        const idx = modalCurrent != null ? modalYears.indexOf(Number(modalCurrent)) : -1;
        if (idx === -1) return;
        let targetIdx = idx;
        if (dir === 'next') targetIdx = Math.min(modalYears.length - 1, idx + 1);
        if (dir === 'prev') targetIdx = Math.max(0, idx - 1);
        const targetYear = modalYears[targetIdx];
        if (!targetYear || targetYear === current) return;

        // When the modal is open, HistoryContent listens to 'historyNav' and is source of truth.
        if (!showBehindModal) {
          router.push(`/behind/years/${targetYear}`);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('historyNav', onNav as EventListener);
    return () => window.removeEventListener('historyNav', onNav as EventListener);
  }, [showBehindModal, bigYear, modalYears, router]);

  return { arrowStyles };
}
