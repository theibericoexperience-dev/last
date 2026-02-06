"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type DiagnosticPayload = { level?: string; message: string; meta?: any };

type MapContextType = {
  mapOpen: boolean;
  openMap: () => void;
  closeMap: () => void;
  logDiagnostic: (p: DiagnosticPayload) => void;
  // map renderer selection: 'svg' (WorldMapWrapper) or 'inline' (Leaflet InlineMap)
  mapRenderer: string;
  setMapRenderer: (v: string) => void;
};

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mapOpen, setMapOpen] = useState(false);
  // default to the richer inline/Leaflet renderer so Tour Creator shows the interactive map
  const [mapRenderer, setMapRenderer] = useState<string>('inline');

  // runtime toggle: only POST diagnostics when this env var is explicitly enabled.
  // This prevents noisy POSTs during development by default.
  const DIAGNOSTIC_ENABLED = typeof process !== 'undefined' && String(process.env.NEXT_PUBLIC_ENABLE_DIAGNOSTIC || '').toLowerCase() === 'true';

  // rate limiter for diagnostics to avoid spamming the server with repeated posts
  const lastSentRef = useRef<Map<string, number>>(new Map());

  const sendDiagnostic = useCallback(async (p: DiagnosticPayload) => {
    try {
      const now = Date.now();
      const key = `${p.level || 'info'}:${p.message}`;
      // throttle windows: debug = 15s, info = 5s, warn/error = 0 (send immediately)
      const throttleMs = (p.level === 'debug') ? 15000 : (p.level === 'info' ? 5000 : 0);
      const last = lastSentRef.current.get(key) || 0;
      const shouldPost = throttleMs === 0 ? true : (now - last >= throttleMs);
      if (!shouldPost) {
        // update console log instead of Sentry
        if (p.level === 'warn' || p.level === 'error') {
          console[p.level](`[Diagnostic ${p.level}] ${p.message}`, p.meta || {});
        }
        return;
      }

      // record last sent time
      lastSentRef.current.set(key, now);

      // If diagnostics are not enabled at runtime, avoid POSTing to the server
      // (this prevents floods on developer machines). Still attempt Sentry if configured.
      if (!DIAGNOSTIC_ENABLED) {
        if (p.level === 'error' || p.level === 'warn') {
          console[p.level === 'error' ? 'error' : 'warn']('[diagnostic skipped]', p);
        }
      } else {
        // best-effort POST to server diagnostic endpoint
        await fetch('/api/diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ts: now, ...p })
        });
      }

      // Sentry references removed
    } catch (e) {
      // ignore network errors in client
      // still keep console record
      // eslint-disable-next-line no-console
      console.warn('diagnostic post failed', e);
    }
  }, []);

  const openMap = useCallback(() => {
    setMapOpen(true);
    sendDiagnostic({ level: 'info', message: 'openMap called' });
  }, [sendDiagnostic]);

  const closeMap = useCallback(() => {
    setMapOpen(false);
    sendDiagnostic({ level: 'info', message: 'closeMap called' });
  }, [sendDiagnostic]);

  // diagnostic: record when mapOpen flips so we can debug open/close flows
  React.useEffect(() => {
    try {
      sendDiagnostic({ level: 'debug', message: 'mapOpen changed', meta: { mapOpen } });
    } catch (e) {}
  }, [mapOpen, sendDiagnostic]);

  // expose a global helper as well
  (globalThis as any).openInteractiveMap = () => openMap();

  // Mount the chosen renderer into any placeholder elements. Placeholders may be added
  // dynamically (for example when a modal like TourCreator opens), so use a
  // MutationObserver to detect newly added placeholders and mount into them.
  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    const mountedRoots = new Map<Element, { cleanup?: (() => void) | null }>();

    const mountRenderer = async (el: Element) => {
      if (mountedRoots.has(el)) return; // already mounted
      try {
        try { await sendDiagnostic({ level: 'debug', message: 'global-map-placeholder-found', meta: { renderer: mapRenderer } }); } catch (e) {}
        // also console log in case dev captures client logs
        try { console.debug('MapProvider: mounting renderer', mapRenderer, 'into', el); } catch (e) {}
        // import React and ReactDOM client createRoot to avoid relying on globals
        const ReactLib = await import('react');
        const { createRoot } = await import('react-dom/client');

        if (mapRenderer === 'svg') {
          const { default: WorldMapWrapper } = await import('../../components/WorldMapWrapper');
          const mount = document.createElement('div');
          // ensure mount occupies placeholder space
          mount.style.width = '100%';
          mount.style.height = '100%';
          mount.className = 'w-full h-full';
          el.innerHTML = '';
          el.appendChild(mount);
          const r = createRoot(mount);
          r.render(ReactLib.createElement(WorldMapWrapper, { onSelect: undefined }));
          mountedRoots.set(el, { cleanup: () => r.unmount() });
          // dev-visible badge so testers can see which renderer mounted
          try {
            if (process.env.NODE_ENV !== 'production') {
              const badge = document.createElement('div');
              badge.textContent = 'Map: svg (dev)';
              badge.style.position = 'absolute';
              badge.style.right = '6px';
              badge.style.top = '6px';
              badge.style.padding = '4px 6px';
              badge.style.background = 'rgba(0,0,0,0.6)';
              badge.style.color = '#fff';
              badge.style.fontSize = '11px';
              badge.style.borderRadius = '4px';
              badge.style.pointerEvents = 'none';
              badge.className = 'dev-map-badge';
              mount.style.position = mount.style.position || 'relative';
              mount.appendChild(badge);
            }
          } catch (e) {}
          try { await sendDiagnostic({ level: 'info', message: 'global-map-mounted', meta: { renderer: 'svg' } }); } catch (e) {}

          // watchdog: if the SVG map library doesn't inject an <svg> into the container within
          // a few seconds, automatically fallback to the inline Leaflet map so users see a map.
          const watchdogMs = 3500;
          setTimeout(async () => {
            try {
              const svgPresent = !!el.querySelector('#svg-world-map-container svg');
              const containerPresent = !!el.querySelector('#svg-world-map-container');
              if (!svgPresent && containerPresent) {
                // check if global svgWorldMap is available
                const svgFn = (window as any).svgWorldMap || null;
                if (!svgFn) {
                  // unmount svg wrapper and mount inline map instead
                  try { r.unmount(); } catch (e) {}
                  mountedRoots.delete(el);
                  try { await sendDiagnostic({ level: 'warn', message: 'svg-init-failed-fallback', meta: { placeholder: el.outerHTML ? 'has-placeholder' : 'unknown' } }); } catch (e) {}
                  // mount inline map
                  const { default: InlineMap } = await import('../../components/InlineMap');
                  const mount2 = document.createElement('div');
                  mount2.style.width = '100%';
                  mount2.style.height = '100%';
                  el.innerHTML = '';
                  el.appendChild(mount2);
                  const r2 = createRoot(mount2);
                  r2.render(ReactLib.createElement(InlineMap, { className: 'w-full h-full' }));
                  mountedRoots.set(el, { cleanup: () => r2.unmount() });
                    try {
                      if (process.env.NODE_ENV !== 'production') {
                        const badge = document.createElement('div');
                        badge.textContent = 'Map: inline (dev)';
                        badge.style.position = 'absolute';
                        badge.style.right = '6px';
                        badge.style.top = '6px';
                        badge.style.padding = '4px 6px';
                        badge.style.background = 'rgba(0,0,0,0.6)';
                        badge.style.color = '#fff';
                        badge.style.fontSize = '11px';
                        badge.style.borderRadius = '4px';
                        badge.style.pointerEvents = 'none';
                        mount2.style.position = mount2.style.position || 'relative';
                        mount2.appendChild(badge);
                      }
                    } catch (e) {}
                  try { await sendDiagnostic({ level: 'info', message: 'global-map-mounted', meta: { renderer: 'inline', fallback: true } }); } catch (e) {}
                }
              }
            } catch (e) {}
          }, watchdogMs);
        } else if (mapRenderer === 'inline') {
          const { default: InlineMap } = await import('../../components/InlineMap');
          const mount = document.createElement('div');
          mount.style.width = '100%';
          mount.style.height = '100%';
          mount.className = 'w-full h-full';
          el.innerHTML = '';
          el.appendChild(mount);
          const r = createRoot(mount);
          r.render(ReactLib.createElement(InlineMap, { className: 'w-full h-full' }));
          mountedRoots.set(el, { cleanup: () => r.unmount() });
          try {
            if (process.env.NODE_ENV !== 'production') {
              const badge = document.createElement('div');
              badge.textContent = 'Map: inline (dev)';
              badge.style.position = 'absolute';
              badge.style.right = '6px';
              badge.style.top = '6px';
              badge.style.padding = '4px 6px';
              badge.style.background = 'rgba(0,0,0,0.6)';
              badge.style.color = '#fff';
              badge.style.fontSize = '11px';
              badge.style.borderRadius = '4px';
              badge.style.pointerEvents = 'none';
              mount.style.position = mount.style.position || 'relative';
              mount.appendChild(badge);
            }
          } catch (e) {}
          try { await sendDiagnostic({ level: 'info', message: 'global-map-mounted', meta: { renderer: 'inline' } }); } catch (e) {}
        }
      } catch (e) {
        try { await sendDiagnostic({ level: 'warn', message: 'global-map-mount-failed', meta: { err: String(e), renderer: mapRenderer } }); } catch (e) {}
      }
    };

    // initial scan
  Array.from(document.querySelectorAll('[data-global-map]')).forEach((el) => { void mountRenderer(el); });

    // observe additions to the document so we can mount placeholders that appear later
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            try {
              if (node instanceof Element) {
                if (node.matches && node.matches('[data-global-map]')) {
                  try { sendDiagnostic({ level: 'debug', message: 'mutation-detected-placeholder', meta: {} }); } catch (e) {}
                  void mountRenderer(node as Element);
                }
                // also check its subtree
                node.querySelectorAll && node.querySelectorAll('[data-global-map]').forEach((sub) => { void mountRenderer(sub); });
              }
            } catch (e) {}
          });
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      try {
        observer.disconnect();
      } catch (e) {}
      try {
        mountedRoots.forEach((v, el) => { try { v.cleanup && v.cleanup(); } catch (e) {} });
      } catch (e) {}
    };
  }, [mapRenderer, sendDiagnostic]);

  return (
    <MapContext.Provider value={{ mapOpen, openMap, closeMap, logDiagnostic: sendDiagnostic, mapRenderer, setMapRenderer }}>
      {children}
    </MapContext.Provider>
  );
}

// Small helper component that renders the global map choice. Importing components here could create circular
// imports, so this component is intentionally minimal: it will render a div with a data attribute that other
// components (like TourCreator) can use to mount the chosen renderer. The consumer should replace this with
// a specific implementation if needed. This keeps a single global switch in the provider.
export function GlobalMapPlaceholder({ className }: { className?: string }) {
  return <div data-global-map className={className || 'w-full h-64'} style={{ width: '100%', height: '100%' }} />;
}

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMap must be used within MapProvider');
  return ctx;
}

// Safe version: returns null when used outside of a provider.
export function useMapMaybe() {
  return useContext(MapContext);
}
