"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronDownIcon as ChevronDownSolidIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import MobileItinerariesGrid from '@/components/MobileItinerariesGrid';
import ServicesPanelWrapper from '@/components/services/ServicesPanelWrapper';

/* ═══════════════════════════════════════════
   Join Club content (simplified)
   ═══════════════════════════════════════════ */
function JoinClubContent({ onRegister }: { onRegister?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center gap-6">
      <h2 className="text-3xl font-serif font-bold text-slate-900 leading-tight">Join The Ibero Club</h2>
      <p className="text-sm text-slate-500 font-serif max-w-xs leading-relaxed">
        Your All-In Solution For Authentic Group &amp; Personal Travel. Let us design lifetime experiences while discovering the world.
      </p>
      <button
        onClick={onRegister}
        className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-colors shadow-md"
      >
        Create an Account &amp; Win $500 Credit
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
  Main: MobileTourLayers — continuous scroll
  Strictly mobile-only. Desktop owns its own sweep and collapsed header.
  ═══════════════════════════════════════════ */
export default function MobileTourLayers({
  open,
  view,
  onCloseAction,
  onOpenAction,
  onRegisterAction,
  onSwitchToToursAction,
  onOpenPackageAction,
  showHandle,
}: {
  open: boolean;
  view: 'tours' | 'services';
  onCloseAction: () => void;
  onOpenAction: () => void;
  onRegisterAction?: () => void;
  onSwitchToToursAction?: () => void;
  onOpenPackageAction?: () => void;
  showHandle: boolean;
}) {
  const HANDLE_HEIGHT = 64;
  const HANDLE_COLLAPSED_HEIGHT = 30;
  const TOP_OFFSET = 80;
  const scrollRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartOffset = useRef<number>(0);
  const globalTouchStartY = useRef<number | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [closedOffset, setClosedOffset] = useState(480);
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const calc = () => {
      const viewportHeight = window.innerHeight - TOP_OFFSET;
      setClosedOffset(Math.max(0, viewportHeight - HANDLE_HEIGHT));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767.98px)');
    const onChange = (ev: MediaQueryListEvent | MediaQueryList) => setIsSmall((ev as any).matches);
    setIsSmall(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange as EventListener);
    else mq.addListener(onChange as any);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange as EventListener);
      else mq.removeListener(onChange as any);
    };
  }, []);

  const currentOffset = dragOffset ?? (open ? 0 : closedOffset);
  const headerHeight = open ? HANDLE_COLLAPSED_HEIGHT : HANDLE_HEIGHT;

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setIsAtTop(true);
    }
  }, [open]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    setIsAtTop(scrollRef.current.scrollTop <= 5);
  }, []);

  const beginDrag = useCallback((clientY: number) => {
    touchStartY.current = clientY;
    touchStartOffset.current = currentOffset;
    setDragging(true);
    try {
      document.documentElement.style.overscrollBehavior = 'none';
    } catch {}
  }, [currentOffset]);

  const updateDrag = useCallback((clientY: number) => {
    if (touchStartY.current === null) return;
    const delta = clientY - touchStartY.current;
    const nextOffset = Math.min(closedOffset, Math.max(0, touchStartOffset.current + delta));
    setDragOffset(nextOffset);
  }, [closedOffset]);

  const endDrag = useCallback((clientY: number) => {
    if (touchStartY.current === null) return;
    const delta = clientY - touchStartY.current;
    const shouldOpen = touchStartOffset.current > 0
      ? delta < -Math.max(60, window.innerHeight * 0.12) || (dragOffset ?? currentOffset) < closedOffset * 0.55
      : !(delta > Math.max(80, window.innerHeight * 0.18));

    touchStartY.current = null;
    setDragging(false);
    setDragOffset(null);
    try {
      document.documentElement.style.overscrollBehavior = '';
    } catch {}

    if (shouldOpen) {
      onOpenAction();
    } else {
      onCloseAction();
    }
  }, [closedOffset, currentOffset, dragOffset, onCloseAction, onOpenAction]);

  const handleHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
    beginDrag(e.targetTouches[0].clientY);
  }, [beginDrag]);

  const handleHandleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    e.preventDefault();
    updateDrag(e.targetTouches[0].clientY);
  }, [updateDrag]);

  const handleHandleTouchEnd = useCallback((e: React.TouchEvent) => {
    endDrag(e.changedTouches[0].clientY);
  }, [endDrag]);

  const handlePanelTouchStart = useCallback((e: React.TouchEvent) => {
    if (!open || !isAtTop) return;
    beginDrag(e.targetTouches[0].clientY);
  }, [beginDrag, isAtTop, open]);

  const handlePanelTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null || !open || !isAtTop) return;
    const delta = e.targetTouches[0].clientY - touchStartY.current;
    if (delta <= 0) return;
    e.preventDefault();
    updateDrag(e.targetTouches[0].clientY);
  }, [isAtTop, open, updateDrag]);

  const handlePanelTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    endDrag(e.changedTouches[0].clientY);
  }, [endDrag]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseAction();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCloseAction]);

  // Global "trap" to catch pull-to-refresh (swipe down from top) on mobile Chrome
  // If the user starts a touch at the top and pulls down past a threshold, prevent
  // the browser refresh and open the mobile drawer instead.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSmall || open) return; // only active when closed on small screens

    const THRESHOLD = Math.max(60, window.innerHeight * 0.12);

    const onTouchStart = (e: TouchEvent) => {
      // only start tracking if page is scrolled to the top
      if (window.scrollY > 5) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      // prefer touches that start near the top edge to avoid interfering with inner scrolls
      if (t.clientY > 120) return;
      globalTouchStartY.current = t.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (globalTouchStartY.current === null) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      const delta = t.clientY - globalTouchStartY.current;
      if (delta > THRESHOLD) {
        // prevent the browser pull-to-refresh
        try {
          e.preventDefault();
        } catch {}
        globalTouchStartY.current = null;
        try {
          document.documentElement.style.overscrollBehavior = 'none';
        } catch {}
        // open the drawer
        onOpenAction();
        // restore overscrollBehavior shortly after
        setTimeout(() => {
          try { document.documentElement.style.overscrollBehavior = ''; } catch {}
        }, 500);
      }
    };

    const onTouchEnd = () => {
      globalTouchStartY.current = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    // touchmove must be passive: false so we can call preventDefault()
    window.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart as EventListener);
      window.removeEventListener('touchmove', onTouchMove as EventListener);
      window.removeEventListener('touchend', onTouchEnd as EventListener);
      window.removeEventListener('touchcancel', onTouchEnd as EventListener);
    };
  }, [isSmall, open, onOpenAction]);

  if (!isSmall) return null;

  // Mobile-only drawer behaviour
  return (
    <>
      {/* Tap-to-close zone */}

      <div
        className="fixed inset-x-0 top-0 z-[199]"
        style={{ height: '80px', pointerEvents: open ? 'auto' : 'none' }}
        onClick={(e) => {
          // Ignore clicks that originate from the header or the IBERO menu so
          // interacting with IBERO doesn't close the drawer.
          const target = (e.target as HTMLElement | null);
          if (!target) return;
          if (target.closest('[data-ibero-header]')) return;
          if (target.closest('.ibero-menu')) return;
          onCloseAction();
        }}
      />

      {/* Unified drawer: persistent header + content are one visual unit */}
      <div
        ref={drawerRef}
        className="fixed inset-x-0 bottom-0 z-[200] flex flex-col"
        style={{
          top: `${TOP_OFFSET}px`,
          transform: `translateY(${currentOffset}px)`,
          transition: dragging ? 'none' : 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
          borderTopLeftRadius: '2rem',
          borderTopRightRadius: '2rem',
          background: view === 'services' ? '#06080c' : 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 -10px 45px rgba(0,0,0,0.16)',
          overflow: 'visible',
          willChange: 'transform',
          touchAction: 'none',
          pointerEvents: (showHandle || open || dragging) ? 'auto' : 'none',
        }}
      >
        {!open && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-[210]">
            <ChevronUpIcon className="w-5 h-5 text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.4)] animate-bounce" />
          </div>
        )}

        <div
          className="shrink-0 w-full flex flex-col items-center justify-center"
          style={{
            height: `${headerHeight}px`,
            transition: dragging ? 'none' : 'height 220ms ease',
            borderBottom: open ? 'none' : '1px solid rgba(241,245,249,0.8)',
            borderTopLeftRadius: '2rem',
            borderTopRightRadius: '2rem',
            overflow: 'visible',
          }}
          onClick={!open ? onOpenAction : undefined}
          onTouchStart={handleHandleTouchStart}
          onTouchMove={handleHandleTouchMove}
          onTouchEnd={handleHandleTouchEnd}
        >
          <div className="flex flex-col items-center justify-center w-full h-full relative px-6">
              <div
              className="flex flex-col items-center justify-center absolute inset-0"
              style={{
                opacity: open ? 0 : 1,
                transform: open ? 'translateY(-6px)' : 'translateY(0)',
                transition: dragging ? 'none' : 'opacity 200ms ease, transform 200ms ease',
                pointerEvents: open ? 'none' : 'auto',
              }}
            >
              {/* Teaser hidden on md+ to prevent desktop teaser from opening alternate grid */}
              <span className={`text-[13px] font-semibold uppercase tracking-[0.12em] ${view === 'services' ? 'text-white' : 'text-black'} text-center md:hidden`}>
                {view === 'services' ? 'Services' : 'Itineraries for 2026, 2027 & 2028'}
              </span>
            </div>

            <div
              className="flex flex-col items-center justify-center gap-1 absolute inset-0"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0)' : 'translateY(6px)',
                transition: dragging ? 'none' : 'opacity 200ms ease, transform 200ms ease',
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              <div className="w-10 h-1 rounded-full bg-slate-300" />
              <button
                onClick={onCloseAction}
                className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                aria-label="Collapse"
              >
                <ChevronDownSolidIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content — mobile-only grid + join club */}
        <div
          ref={scrollRef}
          className={`flex-1 overflow-y-auto overscroll-contain px-4 pb-16 ${view === 'services' ? 'text-white' : ''}`}
          style={{
            // Ensure no card content peeks under the magnetic closed position
            paddingTop: 0,
          }}
          onScroll={handleScroll}
          onClick={(e) => {
            if (!open) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest('a, button')) return;
          }}
          onTouchStart={handlePanelTouchStart}
          onTouchMove={handlePanelTouchMove}
          onTouchEnd={handlePanelTouchEnd}
        >
          {view === 'services' ? (
            <div className="pt-4">
              <ServicesPanelWrapper
                onCloseAction={onCloseAction}
                onSwitchToToursAction={onSwitchToToursAction}
                onRequireAuthAction={onRegisterAction}
                onOpenPackageAction={onOpenPackageAction}
              />
            </div>
          ) : (
            <>
              <MobileItinerariesGrid />

              {/* Join the Ibero Club at the bottom */}
              <JoinClubContent onRegister={onRegisterAction} />
            </>
          )}
        </div>
      </div>

    </>
  );
}
