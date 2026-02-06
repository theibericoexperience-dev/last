"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// simple haversine distance in meters between two [lat, lng]
function haversine(a: [number, number], b: [number, number]) {
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

type Props = {
  map: any; // Leaflet map instance
  routeCoords?: Array<[number, number]>; // GeoJSON coordinates [lon, lat]
  progress?: number; // 0..1 overall progress along route
  visible?: boolean;
};

// Utility: convert lon/lat to Leaflet container point later in runtime
export default function Bus3DOverlay({ map, routeCoords = [], progress = 0, visible = true }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const busRef = useRef<THREE.Mesh | null>(null);

  // Convert route coordinates to an array of lat/lng Leaflet points lazily
  const latlngs = useRef<Array<[number, number]>>([]);
  const cumulative = useRef<number[]>([]);
  const progressRef = useRef<number>(progress);
  useEffect(() => {
    const pts = (routeCoords || []).map((c) => [c[1], c[0]] as [number, number]);
    latlngs.current = pts;
    // compute cumulative distances (meters) using haversine approx via leaflet
    const cum: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      const d = haversine(pts[i - 1], pts[i]);
      cum.push(cum[cum.length - 1] + d);
    }
    cumulative.current = cum;
  }, [routeCoords]);

  useEffect(() => {
    if (!map || !containerRef.current) return;
    // create canvas overlay container
    const container = containerRef.current;
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "none";

    // three.js renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  // Ensure the three.js canvas sits above Leaflet panes (labels/markers)
  // and doesn't intercept pointer events from the map beneath.
  renderer.domElement.style.zIndex = "800";
  renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Use an orthographic camera mapped to container pixel coordinates for stable overlay placement
  const w = container.clientWidth;
  const h = container.clientHeight;
  const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -2000, 2000);
  camera.position.set(0, 0, 1000);
  camera.lookAt(0, 0, 0);

    // light
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(0.5, 1, 0.3);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0x666666, 0.8));

    // simple bus mesh (box) - you can replace with glTF loader later
  // size the bus in pixel-like units (width, height, depth)
  const busGeo = new THREE.BoxGeometry(24, 12, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0077cc, metalness: 0.3, roughness: 0.6 });
    const bus = new THREE.Mesh(busGeo, mat);
    bus.castShadow = true;
    bus.receiveShadow = true;
    busRef.current = bus;
    scene.add(bus);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

  let raf = 0;

    const onResize = () => {
      if (!renderer || !camera) return;
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      renderer.setSize(w2, h2);
      // update orthographic camera frustum to match new pixel dimensions
      (camera as THREE.OrthographicCamera).left = -w2 / 2;
      (camera as THREE.OrthographicCamera).right = w2 / 2;
      (camera as THREE.OrthographicCamera).top = h2 / 2;
      (camera as THREE.OrthographicCamera).bottom = -h2 / 2;
      camera.updateProjectionMatrix();
    };

    const animate = () => {
      // update bus position based on map & progress
  // read progress from ref (kept updated by effect)
  const curProgress = Math.max(0, Math.min(1, progressRef.current || 0));
        if (map && busRef.current && latlngs.current.length > 1 && cumulative.current.length > 1) {
        // compute target latlng along the polyline proportional to progress
  const t = curProgress;
        // interpolation by distance
        const pts = latlngs.current;
        const cum = cumulative.current;
        const totalDist = cum[cum.length - 1] || 1;
        const target = t * totalDist;
        // find segment
        let seg = 0;
        while (seg < cum.length - 1 && cum[seg + 1] < target) seg++;
        const segStart = cum[seg];
        const segEnd = cum[seg + 1] || segStart;
        const local = segEnd === segStart ? 0 : (target - segStart) / (segEnd - segStart);
        const lat = pts[seg][0] * (1 - local) + pts[seg + 1][0] * local;
        const lng = pts[seg][1] * (1 - local) + pts[seg + 1][1] * local;

        // convert lat/lng to container point (Leaflet returns container coordinates in pixels)
        try {
          const p = map.latLngToContainerPoint([lat, lng]);
          // convert to Three.js orthographic coordinates (center origin)
          const rect = container.getBoundingClientRect();
          const cx = p.x - rect.width / 2;
          const cy = rect.height / 2 - p.y;
          busRef.current.position.set(cx, cy, 0);

          // orient bus towards the next point along the segment
          const nextIdx = Math.min(pts.length - 1, seg + 1);
          const lat2 = pts[nextIdx][0];
          const lng2 = pts[nextIdx][1];
          const p2 = map.latLngToContainerPoint([lat2, lng2]);
          const dx = p2.x - p.x;
          const dy = p2.y - p.y;
          const angle = Math.atan2(dy, dx);
          // rotate the bus around Z (since we're in XY plane), use smooth interpolation
          const targetRot = -angle;
          const cur = busRef.current.rotation.z || 0;
          // lerp angle with small smoothing
          const diff = ((targetRot - cur + Math.PI) % (Math.PI * 2)) - Math.PI;
          busRef.current.rotation.z = cur + diff * 0.25;
        } catch (e) {
          // silently ignore coordinate transforms
        }
      }

      if (renderer && scene && camera) renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", onResize);
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      try {
        renderer.dispose();
      } catch {}
      try {
        if (renderer && renderer.domElement && renderer.domElement.parentNode)
          renderer.domElement.parentNode.removeChild(renderer.domElement);
      } catch {}
    };
  }, [map, routeCoords]);

  // update progress triggers a re-render of position inside the RAF loop via closure
  useEffect(() => {
    // keep progressRef up-to-date so the RAF loop reads latest value
    progressRef.current = progress;
  }, [progress]);

  if (!visible) return null;
  return <div ref={containerRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 800 }} />;
}
