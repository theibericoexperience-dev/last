"use client";

import React, { useEffect, useRef } from "react";
import "./BusMarker.css";

// small haversine used to compute distances along the route
function haversine(a: [number, number], b: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const hh = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(hh));
}

type Props = {
  map: any; // Leaflet map instance
  routeCoords: Array<[number, number]>; // GeoJSON coords [lng, lat]
  progress: number; // 0..1
};

// Creates ONE Leaflet marker with a divIcon and updates its lat/lng + rotation when progress changes.
export default function BusMarker({ map, routeCoords = [], progress = 0 }: Props) {
  const markerRef = useRef<any | null>(null);
  const lastProgressRef = useRef<number>(progress);
  const rotationRef = useRef<number>(0); // degrees, CSS rotation applied to inner element
  const positionsRef = useRef<Array<[number, number]>>([]);
  const cumulativeRef = useRef<number[]>([]);

  // Prepare lat/lng points and cumulative distances (in meters)
  useEffect(() => {
    const pts = (routeCoords || []).map((c) => [c[1], c[0]] as [number, number]);
    positionsRef.current = pts;
    const cum: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[cum.length - 1] + haversine(pts[i - 1], pts[i]));
    }
    cumulativeRef.current = cum;
  }, [routeCoords]);

  // create marker once (use window.L at runtime because Leaflet is loaded via CDN)
  useEffect(() => {
    if (!map || markerRef.current) return;
    if (typeof window === "undefined") return;
    const L = (window as any).L;
    if (!L) return;

    const el = document.createElement("div");
    el.className = "ibe-bus-icon";
    // inner HTML: realistic minibus shape (matches BusMarker.css)
    el.innerHTML = `
      <div class="ibe-bus">
        <div class="bus-body">
          <div class="bus-windows"></div>
          <div class="bus-front"></div>
          <div class="bus-details"></div>
        </div>
        <div class="bus-shadow"></div>
      </div>
    `;

  // anchor slightly lower so wheels (which are drawn below the body) sit on the route line
  const icon = L.divIcon({ className: "ibe-bus-icon", html: el, iconSize: [72, 44], iconAnchor: [36, 30] });
  // prefer busPane if available so the bus body renders above the route line
  const preferredPane = (map.getPane && map.getPane('busPane')) ? 'busPane' : (map.getPane && map.getPane('markerPane')) ? 'markerPane' : undefined;
  markerRef.current = L.marker([0, 0], { icon, interactive: false, pane: preferredPane }).addTo(map);

    return () => {
      try { if (markerRef.current && map?.hasLayer && map.hasLayer(markerRef.current)) map.removeLayer(markerRef.current); } catch {}
      markerRef.current = null;
    };
  }, [map]);

  // helper: find latlng at given progress (0..1) by distance interpolation
  function latLngAtProgress(t: number): { lat: number; lng: number; angle: number } | null {
    const pts = positionsRef.current;
    const cum = cumulativeRef.current;
    if (!pts || pts.length < 2 || !cum || cum.length < 2) return null;
    const total = cum[cum.length - 1] || 1;
    const target = Math.max(0, Math.min(1, t)) * total;
    let seg = 0;
    while (seg < cum.length - 1 && cum[seg + 1] < target) seg++;
    const s0 = cum[seg];
    const s1 = cum[seg + 1] || s0;
    const local = s1 === s0 ? 0 : (target - s0) / (s1 - s0);
    const a = pts[seg];
    // ensure we have a proper next point for bearing; if we're at the end use previous segment direction
    const b = pts[Math.min(pts.length - 1, seg + 1)];
    const bearingA = seg === pts.length - 1 && pts.length >= 2 ? pts[pts.length - 2] : a;
    const bearingB = seg === pts.length - 1 && pts.length >= 2 ? pts[pts.length - 1] : b;
    const lat = a[0] * (1 - local) + b[0] * local;
    const lng = a[1] * (1 - local) + b[1] * local;
    // bearing between a and b
    const y = Math.sin((bearingB[1] - bearingA[1]) * Math.PI / 180) * Math.cos(bearingB[0] * Math.PI / 180);
    const x = Math.cos(bearingA[0] * Math.PI / 180) * Math.sin(bearingB[0] * Math.PI / 180) - Math.sin(bearingA[0] * Math.PI / 180) * Math.cos(bearingB[0] * Math.PI / 180) * Math.cos((bearingB[1] - bearingA[1]) * Math.PI / 180);
    let brng = Math.atan2(y, x) * 180 / Math.PI; // degrees from north, clockwise
    brng = (brng + 360) % 360;
    return { lat, lng, angle: brng };
  }

  // update marker position when progress changes — smooth the movement a bit
  useEffect(() => {
    if (!markerRef.current || !map) return;
    let raf = 0;
    const from = lastProgressRef.current;
    const to = progress;
    lastProgressRef.current = to;

    // If difference small, jump immediately to avoid tiny animations
    const diff = Math.abs(to - from);
    const duration = diff < 0.001 ? 0 : Math.min(1200, 600 + diff * 2000); // ms, scaled by distance
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const tt = duration === 0 ? 1 : Math.min(1, elapsed / duration);
      // ease in-out cubic
      const ease = tt < 0.5 ? 4 * tt * tt * tt : 1 - Math.pow(-2 * tt + 2, 3) / 2;
      const cur = from + (to - from) * ease;
      const p = latLngAtProgress(cur);
      if (p) {
        try {
          // place marker exactly on the interpolated lat/lng
          markerRef.current.setLatLng([p.lat, p.lng]);
          const el = (markerRef.current.getElement && markerRef.current.getElement()) as HTMLElement | null;
          if (el) {
            const inner = el.querySelector('.ibe-bus') as HTMLElement | null;
            // our bearing is degrees clockwise from north; bus graphic points to the RIGHT (east) by default.
            // so to align the bus front to bearing we rotate by (bearing - 90).
            const targetRot = 0; // Always horizontal, no rotation based on route direction
            // read current rotation (degrees) from ref and smoothly approach target using shortest path
            const curRot = rotationRef.current || 0;
            // compute shortest angular difference in [-180, 180]
            let diff = ((targetRot - curRot + 540) % 360) - 180; // +540 to keep positive before modulo
            const smooth = 0.25; // interpolation factor per animation frame
            const newRot = curRot + diff * smooth;
            rotationRef.current = newRot;
            // apply computed rotation so the bus front points along the route
            // NOTE: bus is now in original orientation (not flipped)
            const transformStr = `translate(-50%, -50%) rotateZ(${newRot}deg) rotateX(25deg)`;
            if (inner) {
              inner.style.transform = transformStr;
              inner.style.transformOrigin = "center center";
            } else {
              el.style.transform = transformStr;
              el.style.transformOrigin = "center center";
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (tt < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [progress, map]);

  return null;
}
