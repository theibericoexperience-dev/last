import { useEffect, useRef, useState, useCallback } from 'react';

export function useSectionObserver(rootRef: React.RefObject<HTMLElement | null>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    // Filtramos solo las entradas visibles
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);
    if (visibleEntries.length === 0) return;

    // Elegimos la que tiene mayor area visible (intersectionRatio)
    const best = visibleEntries.reduce((prev, curr) => (curr.intersectionRatio > prev.intersectionRatio ? curr : prev));
    setActiveId(((best.target as HTMLElement).id) || null);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(observerCallback, {
      root: rootRef.current || null, // observar dentro del contenedor si existe
      // Zona activa centrada — evita cambios tempranos/tardíos
      rootMargin: '-45% 0px -45% 0px',
      threshold: [0.2, 0.35, 0.5],
    });

    const sections = root.querySelectorAll('.year-section');
    sections.forEach((s) => observer.observe(s));
    // Helper: compute closest section to the center of the root viewport.
    const computeClosestToCenter = () => {
      try {
        const r = root.getBoundingClientRect();
        const rootCenter = r.top + r.height / 2;
        let bestId: string | null = null;
        let bestDist = Infinity;
        sections.forEach((s) => {
          const el = s as HTMLElement;
          const rect = el.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const dist = Math.abs(center - rootCenter);
          if (dist < bestDist) {
            bestDist = dist;
            bestId = el.id || null;
          }
        });
        if (bestId) setActiveId(bestId);
      } catch (e) {
        // defensive: ignore measurement errors
      }
    };

    // Run initial measurement so the rail highlights immediately on mount.
    computeClosestToCenter();

    // Throttled scroll handler using requestAnimationFrame
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        computeClosestToCenter();
        ticking = false;
      });
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', computeClosestToCenter);

    return () => {
      observer.disconnect();
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', computeClosestToCenter);
    };
  }, [rootRef, observerCallback]);

  return activeId;
}
