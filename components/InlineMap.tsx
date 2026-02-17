"use client";

import React, { useEffect, useMemo, useRef } from "react";
import BusMarker from "./BusMarker";

export type MapPoint = {
  name?: string;
  day?: number | null;
  coords: [number, number];
  // Add support for order/type to filter in overview mode
  order?: number; 
  type?: 'lived' | 'traveled';
};

export type MapRoute = {
  id?: string;
  title?: string;
  geojson?: any;
  color?: string;
};

type InlineMapProps = {
  className?: string;
  // new prop for operation mode
  mode?: 'overview' | 'detailed';
  /** Optional primary route to render as a GeoJSON layer */
  route?: MapRoute | null;
  /** Points to render as circle markers. Keep filtering/selection outside the map. */
  points?: MapPoint[];
  /** Which day should be highlighted/centered. null = no highlight */
  activeDay?: number | null;
  /** Whether the map should fit to bounds when inputs change */
  fit?: "auto" | "none" | "route" | "points";
  /** Fit paddings (used when fit="auto" or when activeDay changes) */
  fitPaddingLeft?: number;
  fitPaddingRight?: number;
  fitPaddingBottom?: number;
  /** Cap max zoom when fitting */
  maxZoom?: number;
  /** Cap min zoom when fitting */
  minZoom?: number;
  /** Whether to show labels for key cities */
  showLabels?: boolean;
  initialDay?: number | null;
  day?: number | null;
  media?: any;
  onBusClickAction?: () => void;
};

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

const loadLeaflet = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no-window"));
    if ((window as any).L) return resolve();

    // CSS
    const existingCss = document.querySelector(`link[href="${LEAFLET_CSS}"]`);
    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // JS
    const existingScript = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", (e) => reject(e), { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = LEAFLET_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });

export default function InlineMap(props: InlineMapProps) {
  const {
    className,
    points = [],
    route,
    initialDay = 1,
    day,
    media,
    onBusClickAction,
    mode = 'detailed', // default detailed
    activeDay,
    fit = "auto",
    fitPaddingLeft = 30,
    fitPaddingRight = 0,
    fitPaddingBottom = 50,
    maxZoom = 13,
    showLabels = false,
  } = props;

  const currentDay = activeDay ?? day ?? initialDay ?? 1;

  const containerRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<any | null>(null);
  const mainLayerRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);
  const labelsRef = useRef<any[]>([]);
  const decoratorRef = useRef<any | null>(null);
  const debugRef = useRef<any | null>(null);

  const uidCounterRef = useRef<number>(1);
  const didInitialFitRef = useRef(false);
  const lastDataHashRef = useRef<string | null>(null);
  const [isMapReady, setIsMapReady] = React.useState(false);

  const applyActiveDay = (
    dayIndexOrDayNumber: number | null,
    opts?: {
      fitPaddingLeft?: number;
      fitPaddingRight?: number;
      fitPaddingBottom?: number;
      maxZoom?: number;
      maxLabels?: number;
      showLabels?: boolean;
    },
  ) => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    try {
      const showLabels = opts?.showLabels ?? false;
      let visible: any[] = [];

      if (typeof dayIndexOrDayNumber === "number") {
        const dayNum = Number(dayIndexOrDayNumber);

        // Determine "visible" subset for focusing.
        visible = markersRef.current.filter(
          (m) => (m as any).__day != null && Number((m as any).__day) === dayNum,
        );
        if (!visible.length)
          visible = markersRef.current.filter(
            (m) => (m as any).__day != null && Number((m as any).__day) === dayNum - 1,
          );
        if (!visible.length)
          visible = markersRef.current.filter(
            (m) => (m as any).__day != null && Number((m as any).__day) === dayNum + 1,
          );
        if (!visible.length) visible = markersRef.current.filter((m) => (m as any).__day == null);
      } else if (showLabels) {
        // Show labels for key cities
        visible = markersRef.current.filter((m) => ["Madrid", "Lisboa"].includes((m as any).__label));
      }

      if (typeof dayIndexOrDayNumber === "number") {
        // Update marker styles: highlight the focused ones but keep others.
        for (const m of markersRef.current) {
          try {
            const isFocused = visible.includes(m);
            if (m.setStyle && isFocused) {
              m.setStyle({ fillOpacity: 0.95, radius: 7, opacity: 1 });
            }
          } catch {
            // ignore
          }
        }
      }

      const padLeft = opts?.fitPaddingLeft ?? fitPaddingLeft;
      const padRight = opts?.fitPaddingRight ?? fitPaddingRight;
      const padBottom = opts?.fitPaddingBottom ?? fitPaddingBottom;
      const MAX_ZOOM = typeof opts?.maxZoom === "number" ? opts.maxZoom : maxZoom;
      const MIN_ZOOM = typeof props.minZoom === "number" ? props.minZoom : 4;

      // Compute combined bounds from route + visible markers.
      let finalBounds: any = null;
      if (mainLayerRef.current && typeof mainLayerRef.current.getBounds === "function") {
        const b = mainLayerRef.current.getBounds();
        if (b && b.isValid && b.isValid()) finalBounds = b;
      }
      if (visible.length) {
        const fg = L.featureGroup(visible);
        const mb = fg.getBounds();
        if (mb && mb.isValid && mb.isValid()) {
          if (finalBounds) finalBounds = finalBounds.extend(mb);
          else finalBounds = mb;
        }
      }

      if (finalBounds && finalBounds.isValid && finalBounds.isValid()) {
        const targetZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, mapRef.current.getBoundsZoom(finalBounds, false)),
        );
        const center = finalBounds.getCenter();

        try {
          // Prefer to keep current zoom and pan to center to avoid constant zoom changes
          const currentZoom = mapRef.current.getZoom ? mapRef.current.getZoom() : targetZoom;
          // if required zoom change is small, just pan; otherwise change zoom
          if (Math.abs(targetZoom - currentZoom) <= 0.6) {
            try {
              mapRef.current.panTo(center, { animate: true });
            } catch {
              mapRef.current.setView(center, currentZoom, { animate: true });
            }
          } else {
            mapRef.current.setView(center, targetZoom, { animate: true });
          }
        } catch {
          try {
            mapRef.current.fitBounds(finalBounds, {
              paddingTopLeft: [padLeft, 30],
              paddingBottomRight: [padRight, padBottom],
              animate: true,
              maxZoom: MAX_ZOOM,
            });
          } catch {
            // ignore
          }
        }
      }

      // Label placement logic
      // Clear previous labels with a smooth fade-out before removal.
      try {
        for (const lm of labelsRef.current) {
          try {
            const el = lm && lm.getElement ? lm.getElement() : null;
            if (el && el.classList) {
              el.classList.remove("ibe-label--visible");
              el.classList.add("ibe-label--hide");
            }
            // remove after transition
            setTimeout(() => {
              try {
                if (mapRef.current?.hasLayer && mapRef.current.hasLayer(lm)) mapRef.current.removeLayer(lm);
              } catch {
                // ignore
              }
            }, 340);
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
      labelsRef.current = [];
      for (const mm of markersRef.current) {
        try {
          delete (mm as any).__labelMarker;
        } catch {
          // ignore
        }
      }

      if (visible.length > 0) {
        // Label placement code here
        function escapeHtml(s: string) {
          return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        }
        function rectOverlapArea(a: any, b: any) {
          const left = Math.max(a.left, b.left);
          const right = Math.min(a.right, b.right);
          const top = Math.max(a.top, b.top);
          const bottom = Math.min(a.bottom, b.bottom);
          if (right <= left || bottom <= top) return 0;
          return (right - left) * (bottom - top);
        }

        const size = mapRef.current.getSize();
        const offsets: Array<[number, number]> = [];
        for (let r = 18; r <= 220; r += 14) {
          const circ = 2 * Math.PI * r;
          const steps = Math.max(8, Math.floor(circ / 22));
          for (let i = 0; i < steps; i++) {
            offsets.push([
              Math.round(Math.cos((i / steps) * Math.PI * 2) * r),
              Math.round(Math.sin((i / steps) * Math.PI * 2) * r),
            ]);
          }
        }

        const placedRects: any[] = [];
        const z = mapRef.current.getZoom?.() ?? 10;
        const MAX_LABELS =
          typeof opts?.maxLabels === "number" ? opts.maxLabels : z < 8 ? 3 : z < 11 ? 6 : 99;
        let placedCount = 0;

        // Sample route points to avoid covering the line.
        const routeRects: any[] = [];
    if (mainLayerRef.current && typeof mainLayerRef.current.getLayers === "function") {
          try {
            const layers = mainLayerRef.current.getLayers();
            for (const lay of layers) {
              const latlngs = lay?.getLatLngs ? lay.getLatLngs() : [];
              const flat: any[] = [];
              (function flatten(x: any) {
                if (!x) return;
                if (Array.isArray(x)) for (const it of x) flatten(it);
                else flat.push(x);
              })(latlngs);
              for (let i = 0; i < flat.length; i += 12) {
                try {
                  const pp = mapRef.current.latLngToContainerPoint(flat[i]);
                  routeRects.push({ left: pp.x - 6, top: pp.y - 6, right: pp.x + 6, bottom: pp.y + 6 });
                } catch {
                  // ignore
                }
              }
            }
          } catch {
            // ignore
          }
        }

        for (const mm of visible) {
          try {
            if (placedCount >= MAX_LABELS) break;
            const labelText = (mm as any).__label || null;
            if (!labelText) continue;
            if ((mm as any).__labelMarker) continue;

            const p = mapRef.current.latLngToContainerPoint((mm as any).getLatLng());
            const width = Math.min(260, 8 + String(labelText).length * 7);
            const height = 18;

            let chosenRect: any = null;
            let chosenCx = 0;
            let chosenCy = 0;

            for (const off of offsets) {
              const cx = p.x + off[0];
              const cy = p.y + off[1];
              const rect = {
                left: cx - width / 2,
                top: cy - height / 2,
                right: cx + width / 2,
                bottom: cy + height / 2,
              };
              const margin = 6;
              if (rect.left < margin || rect.top < margin) continue;
              if (rect.right > size.x - margin || rect.bottom > size.y - margin) continue;

              let ok = true;
              for (const r of placedRects) {
                if (rectOverlapArea(rect, r) > 0) {
                  ok = false;
                  break;
                }
              }
              if (!ok) continue;
              for (const rr of routeRects) {
                if (rectOverlapArea(rect, rr) > 0) {
                  ok = false;
                  break;
                }
              }
              if (!ok) continue;

              chosenRect = rect;
              chosenCx = cx;
              chosenCy = cy;
              break;
            }

            if (!chosenRect) continue;

            const labelLat = mapRef.current.containerPointToLatLng(L.point(chosenCx, chosenCy));
            const inner = `<div style="background: rgba(255,255,255,0.95); padding:4px 6px; border-radius:6px; font-size:11px; color:#222; box-shadow:0 1px 3px rgba(0,0,0,0.12);">${escapeHtml(
              labelText,
            )}</div>`;
            const icon = L.divIcon({ html: inner, className: "ibe-label", iconSize: [width, height], iconAnchor: [width / 2, height / 2] });
            const lm = L.marker(labelLat, { icon, interactive: false, pane: mapRef.current && mapRef.current.getPane ? "labelPane" : undefined }).addTo(mapRef.current);
            labelsRef.current.push(lm);
            try {
              (mm as any).__labelMarker = lm;
            } catch {
              // ignore
            }
            // trigger fade-in shortly after insertion
            try {
              const el = lm && lm.getElement ? lm.getElement() : null;
              if (el && el.classList) setTimeout(() => el.classList.add("ibe-label--visible"), 20);
            } catch {
              // ignore
            }
            placedRects.push(chosenRect);
            placedCount++;
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // swallow errors; do not crash map display
    }
  };

  function isValidLatLngPair(coords: any): coords is [number, number] {
    if (!Array.isArray(coords) || coords.length < 2) return false;
    const lat = Number(coords[0]);
    const lng = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    // Leaflet uses [lat, lng]
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    return true;
  }

  function isValidLatLngBounds(bounds: any): boolean {
    try {
      if (!bounds || !bounds.isValid || !bounds.isValid()) return false;
      const sw = bounds.getSouthWest?.();
      const ne = bounds.getNorthEast?.();
      const latOk =
        sw && ne &&
        Number.isFinite(sw.lat) && Number.isFinite(ne.lat) &&
        sw.lat >= -90 && sw.lat <= 90 &&
        ne.lat >= -90 && ne.lat <= 90;
      const lngOk =
        sw && ne &&
        Number.isFinite(sw.lng) && Number.isFinite(ne.lng) &&
        sw.lng >= -180 && sw.lng <= 180 &&
        ne.lng >= -180 && ne.lng <= 180;
      return !!(latOk && lngOk);
    } catch {
      return false;
    }
  }

  const dataHash = useMemo(() => {
    const pts = points.map((p) => ({ day: p.day ?? null, name: p.name ?? "", c: p.coords }));
    return JSON.stringify({
      pts,
      activeDay,
      color: route?.color || null,
      hasGeo: !!route?.geojson,
      showLabels,
    });
  }, [points, activeDay, route?.color, route?.geojson, showLabels]);

  const routeCoordsForBus = useMemo(() => {
    try {
      if (!route?.geojson) return [];
      const geom = route.geojson?.features?.[0]?.geometry || route.geojson?.geometry;
      if (!geom) return [];
      // expect LineString of [lon, lat]
      if (geom.type === "LineString") return geom.coordinates;
      // if FeatureCollection or other, attempt to find first LineString
      if (Array.isArray(geom)) return geom;
      return [];
    } catch {
      return [];
    }
  }, [route?.geojson]);

  // One-time Leaflet init.
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await loadLeaflet();
      } catch {
        return;
      }
      if (!mounted) return;

      const L = (window as any).L;
      if (!L) return;
      if (!containerRef.current) return;
      if (mapRef.current) return;

      try {
        // Default to a more distant view showing most of the Iberian peninsula.
        // Clicking the itinerary or changing `fit`/`activeDay` will still trigger the
        // existing fit logic and zoom into the route/points.
        const isOverview = mode === 'overview';
        mapRef.current = L.map(containerRef.current as HTMLElement, {
          zoomControl: false,
          attributionControl: false,
          minZoom: isOverview ? 1 : undefined,
          maxBounds: isOverview ? [[-90, -180], [90, 180]] : undefined,
          maxBoundsViscosity: isOverview ? 1.0 : 0.0
        }).setView([39.5, -6.0], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
          maxZoom: 19, 
          noWrap: isOverview 
        }).addTo(mapRef.current);

        // Create ordered panes so we can control stacking: route < markers < labels
        try {
          mapRef.current.createPane("routePane");
          mapRef.current.getPane("routePane").style.zIndex = "600";
          mapRef.current.createPane("markerPane");
          mapRef.current.getPane("markerPane").style.zIndex = "650";
          // dedicated pane for the bus marker so it stays above the route
          mapRef.current.createPane("busPane");
          // Put busPane above route and marker panes so bus body is rendered on top
          mapRef.current.getPane("busPane").style.zIndex = "720";
          mapRef.current.createPane("labelPane");
          mapRef.current.getPane("labelPane").style.zIndex = "700";
        } catch {
          // ignore if panes can't be created for any reason
        }

        // Inject lightweight label CSS for fade-in/out transitions
        if (typeof document !== "undefined" && !document.getElementById("ibe-label-styles")) {
          const s = document.createElement("style");
          s.id = "ibe-label-styles";
          s.innerHTML = `
            .ibe-label { opacity: 0; transform: translateY(6px); transition: opacity .28s ease, transform .28s ease; pointer-events: none; }
            .ibe-label.ibe-label--visible { opacity: 1; transform: translateY(0); }
            .ibe-label.ibe-label--hide { opacity: 0; transform: translateY(6px); }
          `;
          document.head.appendChild(s);
        }

        setIsMapReady(true);
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch {
        // ignore
      }
    };
  }, []);

  // Render/update route + markers when inputs change.
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;
    if (lastDataHashRef.current === dataHash) return;
    lastDataHashRef.current = dataHash;

    // Remove existing markers + labels
    try {
      for (const m of markersRef.current) {
        try {
          if (mapRef.current?.hasLayer && mapRef.current.hasLayer(m)) mapRef.current.removeLayer(m);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    try {
      for (const lm of labelsRef.current) {
        try {
          if (mapRef.current?.hasLayer && mapRef.current.hasLayer(lm)) mapRef.current.removeLayer(lm);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    labelsRef.current = [];
    markersRef.current = [];

    // Replace main route layer
    try {
      if (mainLayerRef.current) {
        try {
          mapRef.current.removeLayer(mainLayerRef.current);
        } catch {
          // ignore
        }
        mainLayerRef.current = null;
      }
      if (route?.geojson) {
        try {
          mainLayerRef.current = L.geoJSON(route.geojson, {
            pane: mapRef.current && mapRef.current.getPane ? "routePane" : undefined,
            style: { color: route.color || "#0077cc", weight: 2 },
          }).addTo(mapRef.current);
        } catch {
          mainLayerRef.current = L.geoJSON(route.geojson, {
            style: { color: route.color || "#0077cc", weight: 2 },
          }).addTo(mapRef.current);
        }
        // Debug overlay removed: only the official route (mainLayerRef) will be rendered.
      }
    } catch {
      // ignore
    }


        // Add markers (ignore invalid coords, so they can't blow up fitBounds)
    for (const p of points) {
      try {
        if (!isValidLatLngPair(p.coords)) continue;
        
        // Determine marker color based on type
        let fillColor = "#0074d9"; // default blue
        if (p.type === 'traveled') fillColor = "#10b981"; // emerald-500
        if (p.type === 'lived') fillColor = "#3b82f6"; // blue-500

        const m = L.circleMarker(p.coords, {
          radius: 6,
          fillColor: fillColor,
          fillOpacity: 0.95,
          color: "#fff",
          weight: 0.6,
        }).addTo(mapRef.current);

        if (p.day != null) (m as any).__day = Number(p.day);
        if (p.name) (m as any).__label = String(p.name);
        if (!(m as any).__uid) (m as any).__uid = String(uidCounterRef.current++);
        if (p.name) {
          m.bindTooltip(String(p.name), { direction: "top", offset: [0, -8], opacity: 0.95 });
        }

        markersRef.current.push(m);
      } catch {
        // ignore
      }
    }

    // Add fixed markers for key cities if showLabels.
    // Avoid duplicates if the itinerary points already include them.
    if (showLabels) {
      const hasLabel = (name: string) =>
        markersRef.current.some((m) => String((m as any)?.__label || "").toLowerCase() === name.toLowerCase());

      const fixedPoints: Array<{ name: string; coords: [number, number] }> = [
        // Leaflet expects [lat, lng]
        { name: "Madrid", coords: [40.4168, -3.7038] },
        { name: "Lisboa", coords: [38.7223, -9.1393] },
      ];
      for (const p of fixedPoints) {
        try {
          if (hasLabel(p.name)) continue;
          const m = L.circleMarker(p.coords, {
            radius: 6,
            fillColor: "#0074d9",
            fillOpacity: 0.95,
            color: "#fff",
            weight: 0.6,
          }).addTo(mapRef.current);
          (m as any).__label = p.name;
          markersRef.current.push(m);
        } catch {
          // ignore
        }
      }
    }

    // Create directional arrows with leaflet-polylinedecorator (loaded dynamically)
    // Attempt to load the polyline decorator from the CDN if it's not already available
    (async () => {
      try {
        if (!(window as any).L || !(L as any).polylineDecorator) {
          // inject script tag for decorator from unpkg
          const url = "https://unpkg.com/leaflet-polylinedecorator@1.7.0/dist/leaflet.polylineDecorator.min.js";
          const existing = document.querySelector(`script[src=\"${url}\"]`);
          if (!existing) {
            const s = document.createElement("script");
            s.src = url;
            s.async = true;
            document.body.appendChild(s);
            await new Promise((res, rej) => {
              s.onload = () => res(null);
              s.onerror = (e) => rej(e);
            });
          }
        }

        // remove previous decorator if any
        if (decoratorRef.current && mapRef.current?.hasLayer && mapRef.current.hasLayer(decoratorRef.current)) {
          try {
            mapRef.current.removeLayer(decoratorRef.current);
          } catch {}
          decoratorRef.current = null;
        }

        if (mainLayerRef.current && (L as any).polylineDecorator) {
          decoratorRef.current = (L as any).polylineDecorator(mainLayerRef.current, {
            patterns: [
              {
                offset: 12,
                repeat: 80,
                symbol: (L as any).Symbol.arrowHead({
                  pixelSize: 8,
                  polygon: false,
                  pathOptions: { stroke: true, color: route?.color || "#0077cc", weight: 1 },
                }),
              },
            ],
          }).addTo(mapRef.current);
        }
      } catch (e) {
        // ignore decorator errors — optional feature
      }
    })();

    // Fit logic
    let shouldFitNow = false;
    let fitBounds: any = null;
    if (fit === "auto" && !didInitialFitRef.current) {
      shouldFitNow = true;
      const groupItems: any[] = [];
      if (mainLayerRef.current) groupItems.push(mainLayerRef.current);
      if (markersRef.current.length) groupItems.push(...markersRef.current);
      const group = L.featureGroup(groupItems);
      fitBounds = group?.getBounds ? group.getBounds() : null;
    } else if (fit === "route") {
      if (mainLayerRef.current) {
        fitBounds = mainLayerRef.current.getBounds();
      }
    } else if (fit === "points") {
      if (markersRef.current.length) {
        const group = L.featureGroup(markersRef.current);
        fitBounds = group.getBounds();
      }
    }

    if (shouldFitNow || fit === "route" || fit === "points") {
      if (fitBounds && isValidLatLngBounds(fitBounds)) {
        // For the initial view, prefer a slightly more distant (zoomed-out)
        // presentation of the full route so users see context. When the
        // itinerary becomes active (activeDay changes), the existing
        // applyActiveDay logic will zoom/pan to the focused segment.
        if (shouldFitNow) {
          try {
            const center = fitBounds.getCenter();
            const tightZoom = mapRef.current.getBoundsZoom
              ? mapRef.current.getBoundsZoom(fitBounds, false)
              : undefined;
            const distantZoom = typeof tightZoom === "number" ? Math.max(4, tightZoom - 1) : undefined;
            if (typeof distantZoom === "number") {
              // setView without animation to present the distant overview immediately
              mapRef.current.setView(center, distantZoom, { animate: false });
            } else {
              mapRef.current.fitBounds(fitBounds, {
                paddingTopLeft: [fitPaddingLeft, 30],
                paddingBottomRight: [fitPaddingRight, fitPaddingBottom],
                maxZoom,
              });
            }
            didInitialFitRef.current = true;
          } catch {
            try {
              mapRef.current.fitBounds(fitBounds, {
                paddingTopLeft: [fitPaddingLeft, 30],
                paddingBottomRight: [fitPaddingRight, fitPaddingBottom],
                maxZoom,
              });
              didInitialFitRef.current = true;
            } catch {
              // ignore
            }
          }
        } else {
          mapRef.current.fitBounds(fitBounds, {
            paddingTopLeft: [fitPaddingLeft, 30],
            paddingBottomRight: [fitPaddingRight, fitPaddingBottom],
            maxZoom,
          });
        }
      }
    }

    // Apply active day after markers exist
    if (activeDay != null) {
      try {
        applyActiveDay(activeDay, { fitPaddingLeft, fitPaddingRight, fitPaddingBottom, maxZoom });
      } catch {
        // ignore
      }
    }

    // Show labels if needed
    if (showLabels) {
      try {
        applyActiveDay(null, { showLabels: true, maxLabels: 2 });
      } catch {
        // ignore
      }
    }
  }, [dataHash, isMapReady]);

  // When activeDay changes, highlight/recenter without re-drawing everything.
  useEffect(() => {
    if (activeDay == null) return;
    try {
      applyActiveDay(activeDay, { fitPaddingLeft, fitPaddingRight, fitPaddingBottom, maxZoom });
    } catch {
      // ignore
    }
  }, [activeDay, fitPaddingLeft, fitPaddingRight, fitPaddingBottom, maxZoom]);

  // compute a progress value 0..1 for the bus based on activeDay and number of days
  // Calculate bus progress based on a fixed schedule of cities by day ranges.
  // The bus will stay parked at the city's position for the configured day range.
  // When activeDay changes and the target city changes, the Bus3DOverlay will animate
  // smoothly toward the new progress value (no teleport).
  const busProgress = useMemo(() => {
    try {
      if (!routeCoordsForBus || routeCoordsForBus.length <= 1) return 0;

      // simple haversine between [lat,lng]
      function haversineLatLng(a: [number, number], b: [number, number]) {
        const toRad = (v: number) => (v * Math.PI) / 180;
        const R = 6371000; // meters
        const dLat = toRad(b[0] - a[0]);
        const dLon = toRad(b[1] - a[1]);
        const lat1 = toRad(a[0]);
        const lat2 = toRad(b[0]);
        const sinDLat = Math.sin(dLat / 2);
        const sinDLon = Math.sin(dLon / 2);
        const hh = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
        return 2 * R * Math.asin(Math.sqrt(hh));
      }

      // schedule: mapping day ranges -> city name
      const schedule: Array<{ from: number; to: number; city: string }> = [
        { from: 1, to: 1, city: "Madrid" },
        { from: 2, to: 3, city: "Plasencia" },
        { from: 4, to: 5, city: "Caceres" },
        { from: 6, to: 7, city: "Merida" },
        { from: 8, to: 9, city: "Elvas" },
        { from: 10, to: 11, city: "Evora" },
        { from: 12, to: 14, city: "Setubal" },
      ];

      // approximate coordinates for the named cities (lat, lng)
      const cityCoords: Record<string, [number, number]> = {
        Madrid: [40.4168, -3.7038],
        Plasencia: [40.0296, -6.0908],
        Caceres: [39.4753, -6.3729],
        Merida: [38.9156, -6.3419],
        Elvas: [38.8939, -7.1639],
        Evora: [38.5716, -7.9135],
        Setubal: [38.5244, -8.8882],
      };

      // find city for this activeDay (use local 'day' so we don't mutate props)
      const day = activeDay == null ? 1 : activeDay;
      let targetCity = schedule.find((s) => day! >= s.from && day! <= s.to)?.city;
      if (!targetCity) {
        // clamp to first/last
        if (day! < schedule[0].from) targetCity = schedule[0].city;
        else targetCity = schedule[schedule.length - 1].city;
      }

      const targetCoord = cityCoords[targetCity];
      if (!targetCoord) return 0;

      // convert routePoints to [lat, lng] array
      const pts = (routeCoordsForBus || []).map((c) => [c[1], c[0]] as [number, number]);
      // cumulative distances
      const cum: number[] = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[cum.length - 1] + haversineLatLng(pts[i - 1], pts[i]));
      const total = cum[cum.length - 1] || 1;

      // find nearest route point to target city
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = haversineLatLng(pts[i], targetCoord as [number, number]);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }

      const prog = Math.max(0, Math.min(1, cum[bestIdx] / total));
      return prog;
    } catch {
      return 0;
    }
  }, [activeDay, routeCoordsForBus]);

  return (
    <div
      ref={containerRef}
      className={className || "w-full h-full min-h-[150px]"}
      style={{ minHeight: 0, height: "100%", position: "relative" }}
    >
      {/* Bus marker (lightweight divIcon) renders on top of the Leaflet container */}
      {mapRef.current && routeCoordsForBus.length > 1 && mode === 'detailed' && (
        <BusMarker map={mapRef.current} routeCoords={routeCoordsForBus} progress={busProgress} />
      )}
    </div>
  );
}
