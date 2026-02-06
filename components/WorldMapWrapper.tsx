"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  onSelect?: (id: string) => void;
  libPath?: string;
  backgroundImage?: string;
  mapOptions?: any;
};

export default function WorldMapWrapper({ onSelect, libPath, backgroundImage, mapOptions }: Props) {
  const mapRef = useRef<any>(null);
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const retriesRef = useRef(0);
  const initRef = useRef<() => void | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    setStatus('loading');

    const defaultLib = 'https://raw.githubusercontent.com/raphaellepuschitz/SVG-World-Map/master/src/';
    const lib = libPath || defaultLib;

    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existing) {
          if ((existing as any).loaded) return resolve();
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('Failed to load script: ' + src)));
          return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.onload = () => { (s as any).loaded = true; resolve(); };
        s.onerror = () => reject(new Error('Failed to load script: ' + src));
        document.head.appendChild(s);
      });
    }

    let svgMapInstance: any = null;
    let timedOut = false;

    async function tryInit() {
      try {
        // Find the container that is rendered in this component
        let container: HTMLElement | null = null;
        if (containerRef.current) {
          container = containerRef.current.querySelector('#svg-world-map-container');
        }
        // As a last resort, fall back to global id (shouldn't happen with our JSX)
        if (!container) container = document.getElementById('svg-world-map-container');
        if (!container) {
          // If container still missing, throw so we retry
          throw new Error('svg-world-map-container-not-found');
        }

        // Try local vendor files first, then fall back to CDN/raw
        const panZoomCandidates = ['/vendor/svg-pan-zoom.min.js', 'https://unpkg.com/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js'];
        const worldMapCandidates = [
          '/vendor/svg-world-map.js',
          lib + 'svg-world-map.js',
        ];

        // helper to try several candidate URLs until one loads
        async function tryLoadList(list: string[]) {
          for (const url of list) {
            try {
              // attempt to load
              // small optimization: if url starts with '/' check existence quickly
              if (url.startsWith('/')) {
                // try HEAD to see if exists (best-effort)
                try {
                  const r = await fetch(url, { method: 'HEAD' });
                  if (!r.ok) throw new Error('not ok');
                } catch (e) {
                  // continue to next
                  throw e;
                }
              }
              await loadScript(url);
              return url;
            } catch (e) {
              // continue
            }
          }
          throw new Error('no-candidate-loaded');
        }

        // give the whole init a timeout so we can retry if needed
        const initPromise = (async () => {
          await tryLoadList(panZoomCandidates);
          await tryLoadList(worldMapCandidates);

          if (!mountedRef.current) return;

          const cbName = '__WMMAP_mapClick';
          (window as any)[cbName] = function (payload: any) {
            try {
              let id: string | undefined;
              if (!payload) id = '';
              else if (typeof payload === 'string') id = payload;
              else if (payload.id) id = payload.id;
              else if (payload.country && payload.country.id) id = payload.country.id;
              if (onSelect && id !== undefined) onSelect(id as string);
            } catch (e) {
              console.warn('WorldMapWrapper: mapClick handler error', e);
            }
          };

          // Build basic options and merge with any global defaults or parent-supplied mapOptions.
          // This keeps the original lightweight behavior: prefer the lib path and pass
          // through backgroundImage if provided by the caller, but do not force a specific
          // shaded-relief behavior here so the wrapper remains generic.
          const options: any = Object.assign(
            { libPath: lib, bigMap: true, showInfoBox: false, trackCoords: true, mapClick: cbName },
            (window as any).__globalSvgWorldMapDefaults || {},
            {}
          );

          // merge explicit props
          if (backgroundImage) options.backgroundImage = backgroundImage;

          // merge mapOptions prop if provided by parent
          if (mapOptions && typeof mapOptions === 'object') {
            try { Object.assign(options, mapOptions); } catch (e) { /* ignore */ }
          }

          const svgWorldMapFn = (window as any).svgWorldMap as any;
          if (typeof svgWorldMapFn !== 'function') {
            console.warn('WorldMapWrapper: svgWorldMap not found on window after load');
            throw new Error('svgWorldMap-not-found');
          }

          svgMapInstance = await svgWorldMapFn(options);
          mapRef.current = svgMapInstance;

          // try to hookup pan/zoom if present
          try {
            const svgPanZoom = (window as any).svgPanZoom;
            if (svgPanZoom && svgMapInstance && svgMapInstance.worldMap) {
              try { svgPanZoom(svgMapInstance.worldMap, { minZoom: 1, dblClickZoomEnabled: false }); } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
        })();

  const timeoutMs = 15000; // give more time for local or remote loads
  const timeout = new Promise((_, reject) => setTimeout(() => { timedOut = true; reject(new Error('init-timeout')); }, timeoutMs));
  await Promise.race([initPromise, timeout]);

        if (!mountedRef.current) return;
        console.info('WorldMapWrapper: map initialized successfully');
        setStatus('ready');
      } catch (err) {
        console.error('WorldMapWrapper: failed to initialize map', err);
        if (!mountedRef.current) return;
        retriesRef.current = (retriesRef.current || 0) + 1;
        const maxRetries = 2;
        if (retriesRef.current <= maxRetries) {
          console.warn(`WorldMapWrapper: retrying initialization (${retriesRef.current}/${maxRetries})`);
          setStatus('loading');
          // small backoff before retry
          setTimeout(() => { tryInit(); }, 1000 * retriesRef.current);
        } else {
          console.error('WorldMapWrapper: all retries failed');
          setStatus('failed');
        }
      }
    }

  // expose init to UI for manual retry
  initRef.current = tryInit;

  tryInit();

    return () => {
      mountedRef.current = false;
      try { delete (window as any)['__WMMAP_mapClick']; } catch (e) {}
      try { if (mapRef.current && typeof mapRef.current.reset === 'function') mapRef.current.reset(); } catch (e) {}
    };
  }, [onSelect, libPath, backgroundImage]);

  // Render container and status. If failed, show an error and allow manual retry — no simplified map will be shown.
  return (
    <div ref={containerRef} className="w-full h-64 worldmap-wrapper">
      {/* explicit container where the demo will inject the SVG world map */}
      <div id="svg-world-map-container" className="w-full h-64" style={{ width: '100%', height: '100%' }} />
      {status === 'loading' && <div className="text-xs text-muted">Cargando mapa interactivo…</div>}
      {status === 'failed' && (
        <div>
          <div className="text-xs text-red-600">No se pudo cargar el mapa interactivo. Reintentar para cargar la versión completa.</div>
          <div className="mt-2">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              onClick={() => {
                retriesRef.current = 0;
                setStatus('loading');
                try { initRef.current && initRef.current(); } catch (e) { console.error(e); }
              }}
            >Reintentar</button>
          </div>
        </div>
      )}
      {/* When ready, the demo library will attach the map into the element with id 'svg-world-map-container' */}
    </div>
  );
}
