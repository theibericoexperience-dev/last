"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import UserPanel from '../../components/UserPanel';

interface PanelOverlayContextValue {
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

const PanelOverlayContext = createContext<PanelOverlayContextValue | null>(null);

export function usePanelOverlay() {
  const ctx = useContext(PanelOverlayContext);
  if (!ctx) throw new Error('usePanelOverlay must be used within PanelOverlayProvider');
  return ctx;
}

export function usePanelOverlayMaybe() {
  return useContext(PanelOverlayContext);
}

type Focusable = HTMLElement & { disabled?: boolean };

type TappableEvent = 'openUserPanel' | 'closeUserPanel' | 'toggleUserPanel';

export function PanelOverlayProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<any>(null);
  const focusablesRef = useRef<Focusable[]>([]);
  const lastActiveRef = useRef<Focusable | null>(null);
  const prevOverflowRef = useRef<string | null>(null);
  const createdPortalRef = useRef(false);
  const userGestureSeenRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let cleaned = false;
    const markGesture = () => {
      userGestureSeenRef.current = true;
      if (cleaned) return;
      cleaned = true;
      document.removeEventListener('pointerdown', markGesture, true);
      document.removeEventListener('keydown', markGesture, true);
    };
    document.addEventListener('pointerdown', markGesture, true);
    document.addEventListener('keydown', markGesture, true);
    return () => {
      document.removeEventListener('pointerdown', markGesture, true);
      document.removeEventListener('keydown', markGesture, true);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!portalReady || typeof document === 'undefined') return;
    const existing = document.getElementById('panel-overlay-root') as HTMLDivElement | null;
    if (existing) {
      setPortalElement(existing);
      return;
    }
    const el = document.createElement('div');
    el.id = 'panel-overlay-root';
    document.body.appendChild(el);
    createdPortalRef.current = true;
    setPortalElement(el);
    return () => {
      if (createdPortalRef.current && el.parentElement) {
        el.parentElement.removeChild(el);
      }
    };
  }, [portalReady]);

  const refreshFocusables = useCallback(() => {
    if (!panelRef.current) {
      focusablesRef.current = [];
      return;
    }
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea',
      'input',
      'select',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    focusablesRef.current = Array.from(panelRef.current.querySelectorAll<Focusable>(selectors)).filter((el) => {
      return !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden');
    });
  }, []);

  const openPanel = useCallback(() => {
    if (isOpen) return;
    lastActiveRef.current = document.activeElement as Focusable | null;
    setIsOpen(true);
  }, [isOpen]);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    if (!userGestureSeenRef.current) return;
    setIsOpen((prev) => {
      if (!prev) {
        lastActiveRef.current = document.activeElement as Focusable | null;
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlers: Record<TappableEvent, () => void> = {
      openUserPanel: openPanel,
      closeUserPanel: closePanel,
      toggleUserPanel: togglePanel
    };
    const attach = (event: TappableEvent) => window.addEventListener(event, handlers[event]);
    const detach = (event: TappableEvent) => window.removeEventListener(event, handlers[event]);
    (Object.keys(handlers) as TappableEvent[]).forEach(attach);
    return () => { (Object.keys(handlers) as TappableEvent[]).forEach(detach); };
  }, [openPanel, closePanel, togglePanel]);

  useEffect(() => {
    if (!portalElement || timelineRef.current) return;
    let mounted = true;
    (async () => {
      try {
        const { gsap } = await import('gsap');
        if (!mounted) return;
        const tl = gsap.timeline({ paused: true });
        tl.set(overlayRef.current, { autoAlpha: 0, pointerEvents: 'none' });
        tl.set(panelRef.current, { yPercent: -12, autoAlpha: 0, scale: 0.96 });
        tl.to(
          overlayRef.current,
          { autoAlpha: 1, duration: 0.4, ease: 'power2.out', pointerEvents: 'auto' },
          0
        );
        tl.to(
          panelRef.current,
          { yPercent: 0, autoAlpha: 1, scale: 1, duration: 0.65, ease: 'power4.out' },
          0
        );
        tl.eventCallback('onReverseComplete', () => {
          if (overlayRef.current) overlayRef.current.style.pointerEvents = 'none';
          const target = lastActiveRef.current;
          if (target) {
            target.focus({ preventScroll: true });
          }
        });
        timelineRef.current = tl;
      } catch (error) {
        console.warn('[PanelOverlay] Failed to init GSAP timeline', error);
      }
    })();
    return () => { mounted = false; };
  }, [portalElement]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    if (isOpen) {
      prevOverflowRef.current = html.style.overflow;
      html.style.overflow = 'hidden';
      document.body.dataset.panelOpen = 'true';
      refreshFocusables();
      requestAnimationFrame(() => {
        const first = focusablesRef.current[0];
        first?.focus({ preventScroll: true });
      });
      if (overlayRef.current) overlayRef.current.style.pointerEvents = 'auto';
      if (timelineRef.current) {
        timelineRef.current.play();
      } else if (overlayRef.current) {
        overlayRef.current.style.opacity = '1';
      }
    } else {
      html.style.overflow = prevOverflowRef.current || '';
      document.body.removeAttribute('data-panel-open');
      if (timelineRef.current) {
        timelineRef.current.reverse();
      } else if (overlayRef.current) {
        overlayRef.current.style.opacity = '0';
        overlayRef.current.style.pointerEvents = 'none';
        const target = lastActiveRef.current;
        target?.focus({ preventScroll: true });
      }
    }
  }, [isOpen, refreshFocusables]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key === 'Tab' && focusablesRef.current.length > 0) {
        const active = document.activeElement as Focusable | null;
        const list = focusablesRef.current;
        const currentIndex = Math.max(0, list.indexOf(active || list[0]));
        const nextIndex = e.shiftKey ? (currentIndex - 1 + list.length) % list.length : (currentIndex + 1) % list.length;
        e.preventDefault();
        list[nextIndex]?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, closePanel]);

  const handleOpenTourCreator = useCallback(() => {
    try { window.dispatchEvent(new Event('openTourCreator')); } catch (e) { /* noop */ }
  }, []);

  const contextValue = React.useMemo(() => ({ isOpen, openPanel, closePanel, togglePanel }), [isOpen, openPanel, closePanel, togglePanel]);

  return (
    <PanelOverlayContext.Provider value={contextValue}>
      {children}
      {portalReady && portalElement && createPortal(
        <div
          ref={overlayRef}
          aria-hidden={!isOpen}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-start bg-black/70 backdrop-blur-[18px] px-4 sm:px-10 pt-12 md:pt-20 panel-overlay"
          style={{ opacity: 0, pointerEvents: 'none' }}
        >
          <button
            type="button"
            aria-label="Close panel"
            onClick={closePanel}
            className="absolute inset-0 cursor-default"
            tabIndex={-1}
          />
          <div className="relative w-full max-w-6xl pointer-events-none">
            <div ref={panelRef} className="pointer-events-auto">
              <UserPanel onCloseAction={closePanel} onOpenTourCreatorAction={() => { handleOpenTourCreator(); closePanel(); }} />
            </div>
          </div>
        </div>,
        portalElement
      )}
    </PanelOverlayContext.Provider>
  );
}
