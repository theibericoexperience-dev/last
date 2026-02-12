/**
 * useLandingSectionsController
 *
 * Controlador SIMPLE para navegación seccional de la landing.
 * 
 * - 3 secciones: hero-section, tour-2026, tour-2027
 * - Scroll abajo = siguiente sección
 * - Scroll arriba = sección anterior
 * - Sin posibilidad de quedarse entre secciones
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { subscribeLandingScrollTo } from '@/lib/navigation/intents';

export interface UseLandingSectionsController {
  activeSectionId: string | null;
  goTo: (id: string) => void;
  goNext: () => void;
  goPrev: () => void;
  scrollerRef: React.RefObject<HTMLElement>;
  showHeader: boolean;
  showHeroButtons: boolean;
  onWheel: (e: WheelEvent) => void;
  onSectionClick: (e: MouseEvent) => void;
}

// Las 4 secciones de la landing (en orden)
const SECTION_IDS = ['hero-section', 'tour-2026', 'tour-2027', 'join-club'];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isSectionId(id: string): id is (typeof SECTION_IDS)[number] {
  return (SECTION_IDS as readonly string[]).includes(id);
}

export function useLandingSectionsController(): UseLandingSectionsController {
  const scrollerRef = useRef<HTMLElement>(null);
  
  // Inicialización Lazy basada en URL para evitar flash del Hero
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section');
      if (section === 'tour-2026') return 1;
      if (section === 'tour-2027') return 2;
    }
    return 0;
  });

  const isScrolling = useRef(false);
  const targetIndexRef = useRef<number>(currentIndex);
  const offsetsRef = useRef<number[]>([]);
  
  // Efecto de inicialización de scroll inmediato (sin animación)
  useEffect(() => {
    // Desactivar restauración de scroll del navegador para tener control total
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Si arrancamos en una sección distinta de 0, forzamos la posición antes de pintar nada visible
    if (currentIndex > 0 && scrollerRef.current) {
      const vh = window.innerHeight || 1000;
      // Forzar layout reflow si es necesario para asegurar que el scroll se aplique
      scrollerRef.current.scrollTop = currentIndex * vh;
      
      // Reintentar en el siguiente frame por si el layout no estaba listo
      requestAnimationFrame(() => {
        if (scrollerRef.current) {
           scrollerRef.current.scrollTop = currentIndex * vh;
        }
      });
    }
    // Solo se debe ejecutar al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  // UI state
  const [showHeader, setShowHeader] = useState(true);
  const [showHeroButtons, setShowHeroButtons] = useState(true);

  const activeSectionId = SECTION_IDS[currentIndex];

  // Recalcular offsets reales (top dentro del scroller) de SOLO las 3 secciones válidas.
  const recomputeOffsets = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    offsetsRef.current = SECTION_IDS.map((id) => {
      const el = scroller.querySelector(`#${id}`) as HTMLElement | null;
      if (!el) return Number.POSITIVE_INFINITY;
      
      // Calculate properly independent of offsetParent nesting
      // (Fixes issue where nested sections inside relative containers return 0 offsetTop)
      return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    });
  }, []);

  // Dado un scrollTop, devuelve el dice de seccin ms cercana.
  const getClosestIndexFromScrollTop = useCallback((scrollTop: number) => {
    const offsets = offsetsRef.current;
    if (!offsets.length) return 0;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < offsets.length; i += 1) {
      const off = offsets[i];
      if (!Number.isFinite(off)) continue;
      const dist = Math.abs(off - scrollTop);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, []);

  // Ir a una sección específica por ID
  const goTo = useCallback((id: string) => {
    if (!isSectionId(id)) return;
    const idx = SECTION_IDS.indexOf(id);
    if (isScrolling.current) return;

    // Force offset recompute to ensure accuracy before scrolling
    recomputeOffsets();

    const scroller = scrollerRef.current;
    if (!scroller) return;

    // Use PRECISE element offset if available, otherwise fallback to vh calculation
    // This fixes the bug where "2027" is detected while visually on "2026" due to height mismatches.
    const offsets = offsetsRef.current;
    let targetTop = 0;
    
    if (offsets[idx] !== undefined && Number.isFinite(offsets[idx])) {
       targetTop = offsets[idx];
    } else {
       const vh = window.innerHeight || 1000;
       targetTop = idx * vh;
    }

    // Controlled RAF animation to ensure there is no free/native scrolling
    const startScroll = scroller.scrollTop;
    const duration = 600;
    const startTime = performance.now();

    isScrolling.current = true;
    targetIndexRef.current = idx;

    const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const step = (now: number) => {
      const elapsed = Math.min(now - startTime, duration);
      const t = elapsed / duration;
      const eased = ease(t);
      const current = Math.round(startScroll + (targetTop - startScroll) * eased);
      try { scroller.scrollTop = current; } catch (e) {}
      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        // Ensure exact final position
        try { scroller.scrollTop = targetTop; } catch (e) {}
        // Sincronizar el índice
        setCurrentIndex(targetIndexRef.current);
        isScrolling.current = false;
      }
    };

    requestAnimationFrame(step);
  }, []);

  // Ir a la siguiente sección
  const goNext = useCallback(() => {
    const scroller = scrollerRef.current;
    const baseIdx = scroller ? getClosestIndexFromScrollTop(scroller.scrollTop) : currentIndex;
    if (baseIdx >= SECTION_IDS.length - 1) return;
    goTo(SECTION_IDS[baseIdx + 1]);
  }, [currentIndex, getClosestIndexFromScrollTop, goTo]);

  // Ir a la sección anterior
  const goPrev = useCallback(() => {
    const scroller = scrollerRef.current;
    const baseIdx = scroller ? getClosestIndexFromScrollTop(scroller.scrollTop) : currentIndex;
    if (baseIdx <= 0) return;
    goTo(SECTION_IDS[baseIdx - 1]);
  }, [currentIndex, getClosestIndexFromScrollTop, goTo]);

  // Handler de wheel: cualquier movimiento de wheel (positivo/negativo)
  // navega inmediatamente a la sección siguiente/anterior. Bloqueamos
  // mientras hacemos el scroll programático para evitar múltiples disparos.
  const onWheel = useCallback((e: WheelEvent) => {
    // En modo seccional: SIEMPRE bloqueamos el scroll nativo y forzamos salto.
    try { e.preventDefault(); } catch (err) {}

    // Filtrar solo deltas extremadamente pequeños (ruido puro), pero permitir gestos normales.
    const delta = e.deltaY;
    if (Math.abs(delta) < 1) return; // Reducido para mayor sensibilidad

    if (isScrolling.current) return;

    // Calcular el índice actual basado en scrollTop real, para mayor robustez
    const scroller = scrollerRef.current;
    const vh = window.innerHeight || 1000;
    const currentScrollTop = scroller ? scroller.scrollTop : 0;
    const currentIdx = getClosestIndexFromScrollTop(currentScrollTop);

    if (delta > 0) {
      if (currentIdx >= SECTION_IDS.length - 1) return;
      goTo(SECTION_IDS[currentIdx + 1]);
      return;
    }

    if (delta < 0) {
      if (currentIdx <= 0) return;
      goTo(SECTION_IDS[currentIdx - 1]);
    }
  }, [goTo, getClosestIndexFromScrollTop]);

  

  // Handler de click en secciones de tour (volver al hero si click fuera de cards)
  const onSectionClick = useCallback((e: MouseEvent) => {
    if (currentIndex === 0) return; // Ya en hero
    const target = e.target as HTMLElement;
    const card = target?.closest?.('a');
    if (!card) {
      goTo('hero-section');
    }
  }, [currentIndex, goTo]);

  // Actualizar UI state según la sección activa
  useEffect(() => {
    const isHero = currentIndex === 0;
    setShowHeader(isHero);
    setShowHeroButtons(isHero);
  }, [currentIndex]);

  // Failsafe: ante un unmount (Fast Refresh / runtime error), nunca dejamos la landing bloqueada.
  useEffect(() => {
    return () => {
      isScrolling.current = false;
    };
  }, []);

  // Mantener el dice sincronizado con el scroll real (por ejemplo, si el usuario
  // hace scroll nativo o si el layout recalcula alturas).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const update = () => {
      if (isScrolling.current) return;
      const idx = getClosestIndexFromScrollTop(scroller.scrollTop);
      setCurrentIndex((prev) => (prev === idx ? prev : idx));
    };

    const onScroll = () => update();
    scroller.addEventListener('scroll', onScroll, { passive: true });

    // offsets + primer sync
    recomputeOffsets();
    update();

    // Use ResizeObserver for robust offset updates (better than just window resize)
    const observer = new ResizeObserver(() => {
      recomputeOffsets();
      update();
    });
    
    if (scroller) observer.observe(scroller);
    
    // Also observe the specific sections if they exist, to detect height changes
    SECTION_IDS.forEach(id => {
       const el = document.getElementById(id);
       if (el) observer.observe(el);
    });

    // Fallback: periodic check for the first few seconds to ensure lazy loaded content is caught
    const interval = setInterval(() => {
       recomputeOffsets();
       update();
    }, 1000);
    // Clear interval after 5 seconds
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      scroller.removeEventListener('scroll', onScroll);
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [getClosestIndexFromScrollTop, recomputeOffsets]);

  // Ir al hero al montar (ELIMINADO para respetar deep links)
  // useEffect(() => {
  //   goTo('hero-section');
  // }, [goTo]);

  // Suscribirse a intents externos de scroll
  useEffect(() => {
    const unsubscribe = subscribeLandingScrollTo(({ id }) => {
      if (id && isSectionId(id)) goTo(id);
    });
    return () => unsubscribe();
  }, [goTo]);

  // Restaurar última sección desde sessionStorage SOLO AL MONTAR
  // Usamos una ref para asegurar que esto ocurra exactamente una vez y no en cada render/cambio de índice
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        // Si hay parámetro ?section=..., ignoramos sessionStorage
        if (!params.has('section')) {
           const saved = sessionStorage.getItem('landing:lastSection');
           if (saved && isSectionId(saved)) {
              // Navegar al destino guardado una única vez
              goTo(saved);
           }
        }
      }
    } catch (e) {}
  }, [goTo]);

  return {
    activeSectionId,
    goTo,
    goNext,
    goPrev,
    scrollerRef,
    showHeader,
    showHeroButtons,
    onWheel,
    onSectionClick,
  };
}
