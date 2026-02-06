"use client";
import React, { useEffect, useRef, useCallback } from 'react';

type Props = {
  sectionSelectors: string[];
  children?: React.ReactNode;
  gapPx?: number;
  animationMs?: number;
  inactivityMs?: number;
};

// This pager implements a strict, non-free-scroll experience by moving the
// target section elements into a fixed, transform-driven container. The
// container is shown when the user first scrolls into the tours area and
// the body scrolling is locked while the container is active. On unmount
// the original DOM nodes are restored to their original positions.
export default function SectionPager({ sectionSelectors, children, gapPx = 48, animationMs = 500, inactivityMs = 60000 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slotsRef = useRef<HTMLElement[]>([]);
  const placeholderMap = useRef<Map<HTMLElement, HTMLElement>>(new Map());
  const indexRef = useRef<number>(-1); // -1 = hero/top
  const lockRef = useRef(false);
  const inactivityTimer = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const createContainer = useCallback(() => {
    const container = document.createElement('div');
    container.setAttribute('data-section-pager', '1');
    Object.assign(container.style, {
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      zIndex: '60',
      transition: `transform ${animationMs}ms ease`,
      willChange: 'transform',
      display: 'none'
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(container);
    containerRef.current = container;
    return container;
  }, [animationMs]);

  useEffect(() => {
    const c = createContainer();
    return () => {
      try {
        if (c && c.parentElement) c.parentElement.removeChild(c);
      } catch (e) {}
      containerRef.current = null;
    };
  }, [createContainer]);

  // Move target elements into fixed container (preserve original location with placeholders)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const found: HTMLElement[] = [];
    for (const sel of sectionSelectors) {
      try {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) found.push(el);
      } catch (e) {}
    }

    // clear any previous
    container.innerHTML = '';
    placeholderMap.current.clear();

    found.forEach((el) => {
      const placeholder = document.createElement('div');
      // keep a minimal placeholder so layout doesn't collapse; we'll size it later if possible
      placeholder.style.minHeight = el.getBoundingClientRect().height ? `${el.getBoundingClientRect().height}px` : '400px';
      placeholder.style.minWidth = el.getBoundingClientRect().width ? `${el.getBoundingClientRect().width}px` : '100%';
      placeholder.setAttribute('data-section-pager-ph', '1');
      if (el.parentElement) el.parentElement.replaceChild(placeholder, el);
      placeholderMap.current.set(el, placeholder);

      // wrap the element into a slide wrapper to enforce full-viewport layout
      const slide = document.createElement('div');
      slide.setAttribute('data-section-slide', '1');
      Object.assign(slide.style, {
        width: '100%',
        height: `calc(100vh)`,
        boxSizing: 'border-box',
        paddingBottom: `${gapPx}px`,
        overflow: 'auto'
      } as Partial<CSSStyleDeclaration>);

      // move el into slide
      try { slide.appendChild(el); } catch (e) {}
      container.appendChild(slide);
    });

    slotsRef.current = found;

    return () => {
      // restore original DOM
      const ph = placeholderMap.current;
      slotsRef.current.forEach((el) => {
        const placeholder = ph.get(el);
        if (placeholder && placeholder.parentElement) {
          try { placeholder.parentElement.replaceChild(el, placeholder); } catch (e) {}
        }
      });
      // cleanup
      ph.clear();
      if (container) container.innerHTML = '';
      slotsRef.current = [];
    };
  }, [sectionSelectors.join('|'), gapPx]);

  const resetInactivity = useCallback(() => {
    if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current);
    inactivityTimer.current = window.setTimeout(() => {
      // return to hero/top
      try { goToIndex(-1); } catch (e) {}
    }, inactivityMs);
  }, [inactivityMs]);

  useEffect(() => {
    resetInactivity();
    return () => { if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current); };
  }, [resetInactivity]);

  const showContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.display = 'block';
    // lock document scrolling
    try { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; } catch (e) {}
    document.body.classList.add('tour-visible');
  }, []);

  const hideContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.display = 'none';
    try { document.documentElement.style.overflow = ''; document.body.style.overflow = ''; } catch (e) {}
    document.body.classList.remove('tour-visible');
  }, []);

  // navigate to an index (strict behavior)
  const goToIndex = useCallback((targetIndex: number) => {
    if (lockRef.current) return;
    const n = slotsRef.current.length;
    if (targetIndex < -1) targetIndex = -1;
    if (targetIndex > n - 1) targetIndex = n - 1;
    lockRef.current = true;
    if (targetIndex === -1) {
      // hide container and scroll to top (hero)
      hideContainer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showContainer();
      const container = containerRef.current!;
      const translateY = -(targetIndex) * (window.innerHeight + gapPx);
      container.style.transition = `transform ${animationMs}ms ease`;
      container.style.transform = `translateY(${translateY}px)`;
    }
    indexRef.current = targetIndex;
    window.setTimeout(() => { lockRef.current = false; }, Math.max(animationMs, 200));
  }, [gapPx, animationMs, hideContainer, showContainer]);

  // helper: find scrollable ancestor within the slide context
  function findScrollableAncestor(el: Element | null): HTMLElement | null {
    while (el && el !== document.body) {
      const e = el as HTMLElement;
      const style = window.getComputedStyle(e);
      const overflowY = style.overflowY;
      const canScroll = e.scrollHeight > e.clientHeight + 1 && (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay');
      if (canScroll) return e;
      el = e.parentElement;
    }
    return null;
  }

  function canScrollInDirection(el: HTMLElement, direction: number) {
    if (direction > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    return el.scrollTop > 0;
  }

  // Wheel handler: strict paging, but allow inner scrollable elements
  useEffect(() => {
    function onWheel(e: WheelEvent) {
      resetInactivity();
      if (lockRef.current) return;
      const deltaY = e.deltaY;
      if (!deltaY) return;
      const direction = deltaY > 0 ? 1 : -1;
      // ignore when any parent has data-pager-ignore
      let el = e.target as Element | null;
      while (el) {
        if (el instanceof HTMLElement && el.hasAttribute('data-pager-ignore')) return;
        el = el.parentElement;
      }

      const scrollable = findScrollableAncestor(e.target as Element);
      if (scrollable && canScrollInDirection(scrollable, direction)) return; // let inner scroll

      // when at top (hero) and scrolling down -> open first section
      const current = indexRef.current;
      if (current === -1 && direction > 0) {
        e.preventDefault();
        goToIndex(0);
        return;
      }
      if (current >= 0) {
        e.preventDefault();
        const next = current + direction;
        if (next < 0) { goToIndex(-1); return; }
        goToIndex(next);
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel as any);
  }, [goToIndex, resetInactivity]);

  // touch swipe
  useEffect(() => {
    function onTouchStart(e: TouchEvent) { resetInactivity(); touchStartY.current = e.touches?.[0]?.clientY ?? null; }
    function onTouchEnd(e: TouchEvent) {
      resetInactivity();
      if (lockRef.current) return;
      const start = touchStartY.current; touchStartY.current = null;
      const end = e.changedTouches?.[0]?.clientY ?? null;
      if (start == null || end == null) return;
      const dy = start - end;
      if (Math.abs(dy) < 30) return;
      const direction = dy > 0 ? 1 : -1;
      let el = e.target as Element | null;
      while (el) { if (el instanceof HTMLElement && el.hasAttribute('data-pager-ignore')) return; el = el.parentElement; }
      const scrollable = findScrollableAncestor(e.target as Element);
      if (scrollable && canScrollInDirection(scrollable, direction)) return;
      const current = indexRef.current;
      if (current === -1 && direction > 0) { goToIndex(0); return; }
      if (current >= 0) { const next = current + direction; if (next < 0) { goToIndex(-1); return; } goToIndex(next); }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onTouchStart as any); window.removeEventListener('touchend', onTouchEnd as any); };
  }, [goToIndex, resetInactivity]);

  // keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      resetInactivity();
      if (lockRef.current) return;
      const key = e.key;
      if (key === 'PageDown' || key === 'ArrowDown') {
        e.preventDefault();
        const cur = indexRef.current;
        if (cur === -1) goToIndex(0); else goToIndex(cur + 1);
      } else if (key === 'PageUp' || key === 'ArrowUp') {
        e.preventDefault();
        const cur = indexRef.current;
        if (cur <= 0) { goToIndex(-1); } else goToIndex(cur - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToIndex, resetInactivity]);

  // Reset inactivity on interactions
  useEffect(() => {
    const events = ['pointerdown', 'click', 'focusin'];
    const handler = () => resetInactivity();
    for (const ev of events) window.addEventListener(ev, handler);
    return () => { for (const ev of events) window.removeEventListener(ev, handler); };
  }, [resetInactivity]);

  // Main render: we render children in place. The pager manipulates the DOM of the target
  // sections (moving them into the fixed container) so the original children are kept
  // for server-rendering correctness. This approach ensures we don't duplicate React nodes.
  return (
    <div>
      {children}
    </div>
  );
}
