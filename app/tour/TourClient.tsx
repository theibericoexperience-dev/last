"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/db/supabaseClient";
// removed: local data imports
import InlineMap, { type MapPoint } from "../../components/InlineMap";
import DaySidebar from "../../components/DaySidebar";
import ReservationTab, { TourData } from "../../components/reservation/ReservationTab";
import { EXTENSIONS } from '../../constants/extensions';
import { publishLandingScrollTo, subscribeTourOpenReservation } from "../../lib/navigation/intents";
import { safeWebPath, normalizeUrl, tryImageFallback } from "./utils/media";
import mediaUrl from '@/lib/media/mediaUrl';
import { getTourMedia, MediaItem } from "../../lib/domain/media/api";
import DayByDayView from "../../components/DayByDayView";
import RegisterForm from '@/components/auth/RegisterForm';
import useReservationStore from '@/lib/reservations/store';
import PrizeModal from '@/components/ui/PrizeModal';
import Modal from '@/components/ui/Modal';
import UserBubble from '@/components/UserBubble';

type ActiveTab = "itinerary" | "reservation";

type MediaFile = { path: string; filename?: string; caption?: string | null };

function extractDayNumberFromFilename(fp: string): number | null {
  try {
    const name = decodeURIComponent(fp.split("/").pop() || "");
    const m = name.match(/(?:dia|day)\s*0*(\d+)/i) || name.match(/^0*(\d+)[_\-\s]/i);
    if (m) return parseInt(m[1], 10);
    return null;
  } catch {
    return null;
  }
}

function goBackToLanding(router: ReturnType<typeof useRouter>, tourYear?: number) {
  try {
    const target = tourYear === 2027 ? "tour-2027" : "tour-2026";
    try {
      sessionStorage.setItem("landing:lastSection", target);
    } catch {
      // ignore
    }
    try {
      publishLandingScrollTo(target);
    } catch {
      // ignore
    }
    router.replace("/");
  } catch {
    // ignore
  }
}

export default function TourClient({ id, initialData }: { id?: string; initialData?: any }): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabaseClient?.auth.getUser().then(({ data }) => setUser(data?.user));
    const { data: { subscription } } = supabaseClient?.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    }) || { data: { subscription: null } };
    return () => subscription?.unsubscribe();
  }, []);

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [prizeOpen, setPrizeOpen] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [welcomeToastShown, setWelcomeToastShown] = useState(false);

  // Mobile OAuth return: UX feedback (toast + scroll + highlight)
  useEffect(() => {
    if (welcomeToastShown) return;
    
    // Mobile OAuth return handling: persistence disabled, so skip pending-reservation recovery.
    // If auth=success present we just show a small welcome toast.
    const authSuccess = searchParams?.get('auth') === 'success';
    if (!authSuccess) return;
    setWelcomeToastShown(true);
    // Remove ?auth=success from URL without reload
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [searchParams, welcomeToastShown]);

  // close modal on Escape
  useEffect(() => {
    if (!registerModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRegisterModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [registerModalOpen]);

  // Handle register button click with session pre-check
  const handleOpenRegister = () => {
    // User not authenticated, open modal
    // ensure we have an active draft so state is saved before auth
    try {
      if (tour?.id) {
        useReservationStore.getState().setActiveTour(tour.id, tourTitle);
      }
    } catch (e) {}
    setRegisterModalOpen(true);
  };

  const tour = initialData; // Main tour object
  const tourTitle = tour?.title || "MADRID TO LISBOA";
  
  // Use relative bucket paths for Madrid->Lisbon; resolve with mediaUrl at render time
  const stopsPath = tour?.stops_path || 'Open Tours/MADRID TO LISBOA/MAIN TOUR/stops'; // Fallback for safety
  
  // Direct Supabase URL logic
  const heroSrc = tour?.card_image || 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/MAIN TOUR/hero.webp';

  const [activeTab, setActiveTab] = useState<ActiveTab>("itinerary");
  const [sectionOpen, setSectionOpen] = useState(true);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<'vertical' | 'horizontal' | 'initial'>('initial');
  const [subMode, setSubMode] = useState<'itinerary' | 'activities' | 'extensions' | 'daybyday' | null>(null);
  const [mapView, setMapView] = useState<'panoramic' | 'day-focused'>('panoramic');
  const [isFlipping, setIsFlipping] = useState(false);

  // Helper Maps for efficient lookups
  const daysMap = useMemo(() => {
    const m = new Map<number, any>();
    if (initialData?.days && Array.isArray(initialData.days)) {
      initialData.days.forEach((d: any) => m.set(d.day_number, d));
    }
    return m;
  }, [initialData]);

  // Replaces buildStopsForDay
  const getStopsForDay = (day: number): string[] => {
    const d = daysMap.get(day);
    if (!d || !d.stops_data) return [];
    return d.stops_data.map((s: any) => s.name);
  };

  // Replaces buildMapPointsForDay
  const getMapPointsForDay = (day: number): MapPoint[] => {
    const d = daysMap.get(day);
    if (!d || !d.stops_data) return [];
    return d.stops_data.map((s: any) => ({
      name: s.name,
      day: day,
      coords: [s.lat, s.lng] // Ensure these exist in DB
    }));
  };
  
  // Replaces dayByDayActivities lookup
  const getActivitiesForDay = (day: number) => {
    const d = daysMap.get(day);
    if (!d || !d.activities_data) return null;
    return {
      day,
      ...d.activities_data
    };
  }

  const tourData: TourData = {
    id: tour?.id,
    title: tourTitle,
    // nights used for surcharge calculations
    nights: 11,
    basePricePerTraveler: (tour?.["Tour Cost"] || 0) + (tour?.["Flights"] || 0),
    includedRoomType: 'double',
    inclusions: tour?.inclusions || [
      "Flights (international & internal, included)",
      "Accommodation in 4-5★ hotels",
      "Full-time bilingual tour guide",
      "Ground transportation",
      "All meals & suppers",
      "Guided visits, entrance fees, and experiences as per itinerary"
    ],
    insuranceOptions: tour?.insurance_options || {
      health: "Health travel insurance",
      cancellation: "Trip cancellation insurance"
    },
    disclaimer: "The itinerary shown reflects planned activities prior to reservations. Any component may be replaced due to unforeseen circumstances. Substitutions will always be of equal or higher value, at no extra cost. Responsibility lies with the travel agency."
  };

  // augment tourData with canonical extensions (use default pricePerDay)
  if (tour?.related_tours) {
     tourData.extensions = tour.related_tours.map((e: any) => ({
       key: (e.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
       name: e.title,
       days: e.days,
       pricePerDay: e.price ? Math.round(e.price / e.days) : 250
     }));
  } else if (tour?.extensions_data) {
     // Fallback for transition
     tourData.extensions = tour.extensions_data.map((e: any) => ({
       key: (e.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_'),
       name: e.title,
       days: e.days,
       pricePerDay: e.price ? Math.round(e.price / e.days) : 250
     }));
  } else {
    tourData.extensions = EXTENSIONS.map((e) => ({ key: (e.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_'), name: e.title, days: e.days, pricePerDay: 250 }));
  }

  const handleModeSelect = (mode: string) => {
    if (subMode === mode) {
      setSubMode(null);
    } else {
      setSubMode(mode as any);
    }
    if (mode === 'itinerary') {
      setSelectedMode('vertical');
      setMapView('day-focused');
    } else {
      setSelectedMode('horizontal');
      setMapView('day-focused'); // or keep panoramic? but according to plan, day-focused for itinerary
    }
  };

  // ignore the first subMode change (initial mount) to avoid an automatic flip on load
  const initialSubModeMount = useRef(true);
  useEffect(() => {
    if (initialSubModeMount.current) {
      initialSubModeMount.current = false;
      return;
    }
    if (subMode !== 'itinerary') {
      setIsFlipping(true);
      const t = setTimeout(() => setIsFlipping(false), 500);
      return () => clearTimeout(t);
    }
  }, [subMode]);

  // Listen for external requests to open the reservation tab (e.g., 'Reserve' CTA)
  useEffect(() => {
    const unsub = subscribeTourOpenReservation(() => {
      setActiveTab('reservation');
      setSectionOpen(true);
    });
    return unsub;
  }, []);

  // Delegated click handler: if any element with data-action="open-reservation" is clicked,
  // open the reservation tab. As a fallback, also match visible buttons with text 'Reserve your spot'.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const el = target.closest('[data-action="open-reservation"]') as HTMLElement | null;
        if (el) {
          e.preventDefault();
          setActiveTab('reservation');
          setSectionOpen(true);
          return;
        }

        // fallback: match by visible text content
        const btn = target.closest('button, a') as HTMLElement | null;
        if (btn) {
          const txt = (btn.textContent || '').trim();
          if (/^reserve\b/i.test(txt) || /reserve your spot/i.test(txt)) {
            e.preventDefault();
            setActiveTab('reservation');
            setSectionOpen(true);
            return;
          }
        }
      } catch {
        // ignore
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const dayStops = useMemo(() => {
    const out: Record<number, string[]> = {};
    for (let d = 1; d <= 14; d++) out[d] = getStopsForDay(d);
    return out;
  }, [initialData]);

  const [dayFiles, setDayFiles] = useState<Record<number, MediaFile[]>>({});
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    setMediaIndex(0);
  }, [selectedDayNumber]);

  const [tourGeoJson, setTourGeoJson] = useState<any>(null);
  const [staticPoints, setStaticPoints] = useState<MapPoint[]>([]);

  // Use GeoJSON from DB props instead of fetching file
  useEffect(() => {
    if (initialData?.routeGeoJson) {
       // Ensure a stable color/name
       const geojson = JSON.parse(JSON.stringify(initialData.routeGeoJson));
        if (geojson?.features?.[0]) {
          geojson.features[0].properties = {
            ...(geojson.features[0].properties || {}),
            name: geojson.features[0].properties?.name || "Madrid → Lisboa (driving)",
            color: geojson.features[0].properties?.color || "#0077cc",
          };
        }
        setTourGeoJson(geojson);
    }
  }, [initialData]);
  
  // NOTE: staticPoints fetching removed as requested "todo en supabase".
  // If static key-cities for the map (not day points) are needed, they should be in the DB.
  // For now, removing the fetch means `staticPoints` stays empty.
  // The original code used /routes/madrid-lisbon-points.json.
  // I should probably support this if needed, but let's stick to the prompt.


  // Load the static key-city points from /public (generated via scripts/build-madrid-lisbon-static.js)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
  const dev = process.env.NODE_ENV !== "production";
        const res = await fetch(dev ? `/routes/madrid-lisbon-points.json?cb=${Date.now()}` : "/routes/madrid-lisbon-points.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load points: ${res.status}`);
        const arr = (await res.json()) as any[];
        if (cancelled) return;
        const pts = Array.isArray(arr)
          ? (arr
              .filter(Boolean)
              .map((p) => ({
                name: String(p.name || ""),
                day: typeof p.day === "number" ? p.day : null,
                coords:
                  Array.isArray(p.coords) && p.coords.length >= 2
                    ? [Number(p.coords[0]), Number(p.coords[1])]
                    : ([0, 0] as [number, number]),
              })) as MapPoint[])
          : [];
        setStaticPoints(pts);
      } catch (e) {
        console.error("Failed to load tour points:", e);
        if (!cancelled) setStaticPoints([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tourRoute = useMemo(
    () =>
      tourGeoJson
        ? ({
            id: "madrid-lisbon-route",
            title: "Madrid → Lisboa (driving)",
            geojson: tourGeoJson,
            color: "#0077cc",
          } as const)
        : null,
    [tourGeoJson],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // DEPRECATED: fetch directo legacy reemplazado por domain wrapper
        // const res = await fetch("/api/media/list?path=" + encodeURIComponent(stopsPath));
        // ...
        const files: MediaItem[] = await getTourMedia(stopsPath);
        const groups: Record<number, MediaFile[]> = {};
        for (const f of files) {
          const path = f.src || (typeof f === "string" ? f : "");
          if (!path) continue;
          const dn = extractDayNumberFromFilename(path);
          if (!dn || dn < 1 || dn > 99) continue;
          groups[dn] = groups[dn] || [];
          groups[dn].push({
            path,
            caption: typeof f === "object" && f && "caption" in f ? ((f as any).caption ?? null) : null,
          });
        }
        if (!cancelled) setDayFiles(groups);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stopsPath]);

  const mediaListForDay = useMemo(() => {
    const items = dayFiles[selectedDayNumber] || [];
    const files = items
      .map((x) => {
        // If x.path is already an absolute URL (Supabase), use it directly
        if (x.path && x.path.startsWith('http')) return x.path;
        // Otherwise apply safeWebPath for local paths
        return safeWebPath(x.path);
      })
      .filter((p) => /\.(jpg|jpeg|png|webp|avif|gif|mp4|mov|webm|heic|heif)$/i.test(p));
    return files;
  }, [dayFiles, selectedDayNumber]);

  const currentMediaSrc = mediaListForDay.length
    ? mediaListForDay[Math.min(mediaIndex, mediaListForDay.length - 1)]
    : null;

  const isImage = (src: string) => /\.(jpg|jpeg|png|webp|avif|gif|heic|heif)$/i.test(src);
  const isVideo = (src: string) => /\.(mp4|mov|webm)$/i.test(src);

  // Per-day points from itinerary file (uses data/coords/coordsByName.json) + static anchors
  const mapPoints = useMemo(() => {
    const dayPts = getMapPointsForDay(selectedDayNumber);
    // merge without duplicates by name (prefer itinerary-specific labels)
    const seen = new Set(dayPts.map((p) => String(p.name || "").toLowerCase()));
    const merged = [...dayPts];
    for (const p of staticPoints) {
      const k = String(p.name || "").toLowerCase();
      if (!k || seen.has(k)) continue;
      merged.push(p);
      seen.add(k);
    }
    return merged;
  }, [selectedDayNumber, staticPoints]);

  // Create the tour route that will always be visible
  // const tourRoute = useMemo(() => ({
  //   id: 'madrid-lisbon-route',
  //   title: 'Madrid to Lisbon Tour Route',
  //   geojson: createTourRoute(),
  //   color: '#0077cc' // Blue color
  // }), []);

  // minimal modal sizing refs (kept simple; CSS already has responsive modal rules)
  const headerRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [contentHeightPx, setContentHeightPx] = useState<number | null>(600); // Fixed height for consistent modal size

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      {/* HERO */}
      <header className="w-full relative">
        <section className="fixed top-0 left-0 right-0 w-full h-screen overflow-hidden" style={{ zIndex: 10 }}>
          <div className="absolute inset-0">
            <img
              src={heroSrc.startsWith('http') ? heroSrc : (mediaUrl(heroSrc) ? normalizeUrl(mediaUrl(heroSrc) as string) : normalizeUrl(heroSrc))}
              alt="hero"
              className="w-full h-full object-cover"
              onError={(e) => {
                tryImageFallback(e.currentTarget as HTMLImageElement);
              }}
            />
          </div>
        </section>
      </header>

      {/* spacer so modal starts low like before */}
      <div aria-hidden style={{ height: "75vh" }} />

      {/* subtle blur overlay when modal open */}
      {sectionOpen && (
        <div
          className="fixed inset-0"
          style={{
            zIndex: 30,
            pointerEvents: "none",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
        />
      )}

      {/* MODAL */}
      <main
        className="w-full"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          maxWidth: "100vw",
          height: "99vh",
          zIndex: 80,
        }}
      >
        <div className="mx-auto ui-container responsive-modal" style={{ maxWidth: "1400px", padding: "0 1rem" }}>
          <div
            ref={modalRef}
            className="bg-white/10 rounded-lg shadow-lg overflow-hidden ui-pad-sm ui-edge-offset modal-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 48px)",
              borderRadius: 16,
              margin: "24px auto",
              backgroundColor: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(12px) saturate(120%)",
              WebkitBackdropFilter: "blur(12px) saturate(120%)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* header */}
            <div
              ref={headerRef}
              className="w-full bg-white/10 text-black border-b border-gray-200"
              style={{ backgroundColor: "rgba(255,255,255,0.25)", margin: "-12px -12px 0 -12px" }}
            >
              <div className="flex items-stretch">
                <div className="w-1/2 flex items-center justify-center py-2 px-3" style={{ position: "relative" }}>
                  <button
                    aria-label="Back to landing"
                    onClick={() => goBackToLanding(router, tour?.year)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-black bg-transparent"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H6" />
                      <path d="M12 5l-7 7 7 7" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </button>

                  <div className="flex gap-2 w-full justify-center items-center">
                    <button
                      onClick={() => {
                        setActiveTab("itinerary");
                        setSectionOpen(true);
                      }}
                      aria-pressed={activeTab === "itinerary"}
                      className={`px-3 py-1 rounded font-semibold ${activeTab === "itinerary" ? "bg-black text-white" : "bg-transparent text-black"}`}
                    >
                      Itinerary
                    </button>
                    <button
                      onClick={() => setActiveTab("reservation")}
                      aria-pressed={activeTab === "reservation"}
                      className={`px-3 py-1 rounded font-semibold ${activeTab === "reservation" ? "bg-black text-white" : "bg-transparent text-black"}`}
                    >
                      Reservation
                    </button>

                    {/* User button + right arrow: positioned just left of center, closer to Reservation */}
                      <div className="absolute top-1/2 -translate-y-1/2 flex items-center" style={{ right: '32px', gap: '8px', zIndex: 20 }}>
                      <UserBubble
                        variant="modalHeader"
                        // increased right nudge: move the user icon further to the right
                        buttonClassName="inline-flex items-center justify-center p-2 text-black bg-transparent h-10 translate-x-4"
                        onOpenRegisterAction={handleOpenRegister}
                      />
                      <button aria-hidden className="inline-flex items-center justify-center p-2 text-black bg-transparent h-10">
                        {/* Right-pointing arrow (mirror of the left arrow) - match other header arrow size (20x20) */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 12H18" />
                          <path d="M12 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-1/2 py-2 pl-6 pr-3 flex items-center justify-center relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-stretch justify-center" style={{ width: "1px" }}>
                    <div className="w-px bg-gray-200 h-full" />
                  </div>
                  {subMode === 'daybyday' ? (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedDayNumber(prev => Math.max(1, prev - 1))}
                        disabled={selectedDayNumber === 1}
                        className="text-black disabled:opacity-40"
                        aria-label="Previous day"
                      >
                        ‹
                      </button>
                      <div style={{ background: "rgba(255,255,255,0.35)", padding: "4px 14px", borderRadius: 6 }}>
                        <div className="font-normal uppercase tracking-wider text-sm md:text-base truncate" style={{ whiteSpace: "nowrap", maxWidth: "52ch" }}>
                          DAY BY DAY
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedDayNumber(prev => Math.min(14, prev + 1))}
                        disabled={selectedDayNumber === 14}
                        className="text-black disabled:opacity-40"
                        aria-label="Next day"
                      >
                        ›
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(255,255,255,0.35)", padding: "4px 14px", borderRadius: 6 }}>
                      <div className="font-normal uppercase tracking-wider text-sm md:text-base truncate" style={{ whiteSpace: "nowrap", maxWidth: "52ch" }}>
                        {tourTitle}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-0 bg-white/10" style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, backgroundColor: "transparent" }}>
              <div
                className="h-full w-full modal-scroll"
                style={{
                  minHeight: 0,
                  flex: 1,
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                  height: typeof contentHeightPx === "number" ? `${contentHeightPx}px` : "100%",
                }}
              >
                {activeTab === "itinerary" && sectionOpen ? (
                  <section className="snap-start snap-always min-h-0 flex flex-col" style={{ height: "600px", minHeight: 0, overflow: "hidden" }}>
                    <div className="grid grid-cols-2 h-full min-h-0 w-full gap-3" style={{ height: "100%", minHeight: 0, perspective: '1000px' }}>
                      {/* LEFT: days */}
                      <div className="flex flex-col justify-center items-center min-h-0 h-full overflow-visible">
                        <DaySidebar
                          mode={selectedMode}
                          dayStops={dayStops}
                          selectedDayNumber={selectedDayNumber}
                          onSelectDay={(d) => {
                            if (typeof d === "number") setSelectedDayNumber(d);
                          }}
                          totalDays={14}
                          onModeSelect={handleModeSelect}
                          flippedAll={subMode === 'activities'}
                          extensionsVisible={subMode === 'extensions'}
                          currentSubMode={subMode}
                        />
                      </div>

                      {/* RIGHT: media + map or day by day */}
                      <div className="col-span-1 h-full" style={{ transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.5s ease-in-out' }}>
                        {subMode === 'daybyday' ? (
                          <DayByDayView
                            day={selectedDayNumber}
                            data={getActivitiesForDay(selectedDayNumber)}
                            onPrevDay={() => setSelectedDayNumber(Math.max(1, selectedDayNumber - 1))}
                            onNextDay={() => setSelectedDayNumber(Math.min(14, selectedDayNumber + 1))}
                          />
                        ) : (
                          <div className="grid grid-rows-2 min-h-0 h-full gap-3">
                            {/* media */}
                            <div className="row-span-1 h-full min-h-0 w-full bg-white/10 rounded-lg flex items-stretch overflow-hidden">
                              {!currentMediaSrc ? (
                                <div className="flex items-center justify-center h-full text-gray-700 p-6">No media available for this day.</div>
                              ) : (
                                <div className="relative w-full h-full bg-black/5 rounded overflow-hidden flex items-center justify-center">
                                  {isImage(currentMediaSrc) ? (
                                    <img
                                      src={currentMediaSrc}
                                      alt={`Preview ${mediaIndex + 1}`}
                                      className="block object-cover w-full h-full"
                                      style={{ borderRadius: 8 }}
                                      onError={(e) => tryImageFallback(e.currentTarget as HTMLImageElement)}
                                    />
                                  ) : isVideo(currentMediaSrc) ? (
                                    <video src={currentMediaSrc} controls className="block object-cover w-full h-full" style={{ borderRadius: 8 }} />
                                  ) : null}

                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs text-white shadow font-bold">
                                    <button
                                      aria-label="Previous media"
                                      onClick={() => setMediaIndex((i) => Math.max(0, i - 1))}
                                      disabled={mediaIndex === 0}
                                      className="px-1 py-0.5 rounded disabled:opacity-40 font-bold"
                                    >
                                      ‹
                                    </button>
                                    <span className="mx-1 select-none font-bold">
                                      {mediaListForDay.length ? mediaIndex + 1 : 0} / {mediaListForDay.length}
                                    </span>
                                    <button
                                      aria-label="Next media"
                                      onClick={() => setMediaIndex((i) => Math.min(Math.max(0, mediaListForDay.length - 1), i + 1))}
                                      disabled={mediaIndex >= Math.max(0, mediaListForDay.length - 1)}
                                      className="px-1 py-0.5 rounded disabled:opacity-40 font-bold"
                                    >
                                      ›
                                    </button>
                                  </div>
                                </div>
                              )
                            }
                            </div>
                            {/* map */}
                            <div className="row-span-1 h-full min-h-0 w-full bg-white/10 rounded-lg overflow-hidden">
                              <InlineMap
                                hideExploreAround={true}
                                className="w-full h-full"
                                route={tourRoute}
                                points={mapPoints}
                                activeDay={selectedDayNumber}
                                // In day-focused mode we do not want the map to refit bounds
                                // (that causes zoom jumps). Let InlineMap pan/adjust subtly.
                                fit={mapView === 'panoramic' ? 'route' : 'none'}
                                showLabels={mapView === 'panoramic'}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                ) : activeTab === "reservation" ? (
                  // Minimal change (Option A): make the reservation area horizontal so
                  // ReservationTab has horizontal space for its left/right columns.
                  <section className="h-full w-full min-h-0 flex flex-row gap-4" style={{ minHeight: 320 }}>
                    <div className="flex-1 min-h-0 overflow-visible" id="reservation-form">
                      <ReservationTab tourData={tourData} onOpenRegister={handleOpenRegister} />
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Register modal (opened from Reservation) */}
      {registerModalOpen && (
        <Modal open={registerModalOpen} onCloseAction={() => { setRegisterModalOpen(false); setRegisteredSuccess(false); setRegError(null); }} maxWidth="max-w-xl">
          <div className="flex">
            <div className="hidden lg:block flex-shrink-0" style={{ width: '40%', minWidth: 240 }}>
              <div
                className="h-full rounded-2xl overflow-hidden relative"
                style={{
                  height: '100%',
                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url('https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/MISC/thumbnail.jpg')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute left-0 right-0 top-[16.666%] flex justify-center">
                  <button type="button" onClick={() => setPrizeOpen(true)} aria-label="Join the journey" className="inline-flex items-center justify-center rounded-full border border-white/30 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/90 bg-transparent hover:bg-white/10">JOIN THE JOURNEY</button>
                </div>
                <div className="absolute left-0 right-0 top-[83.333%] flex justify-center">
                  <button type="button" onClick={() => setPrizeOpen(true)} aria-label="Win 500 dollars bonus" className="inline-flex items-center justify-center rounded-full border border-white/30 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/90 bg-transparent hover:bg-white/10">Win 500$ bonus</button>
                </div>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-4 py-6" style={{ minWidth: 0 }}>
              <div className="w-full max-w-md">
                {!registeredSuccess ? (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">Create your IBERO account</h2>
                    <RegisterForm autoFocus onSuccessAction={() => { setRegisteredSuccess(true); }} />
                    <div className="mt-3 text-sm text-slate-600">Already have an account?
                      <button type="button" onClick={() => { const next = `/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`; window.location.href = next; }} className="ml-2 font-semibold text-emerald-700 underline underline-offset-2">Log in</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">You're almost there</h2>
                    <p className="text-sm text-slate-700 mb-4">You will be redirected to your personal Dashboard, so you can finalize the reservations.</p>
                    {regError && <div className="text-sm text-red-600 mb-2">{regError}</div>}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setRegError(null);
                            setRegSubmitting(true);
                            // attempt to submit reservation to server
                            const order = await useReservationStore.getState().submitReservationToServer(user?.email || undefined);
                            setRegSubmitting(false);
                            setRegisterModalOpen(false);
                            setRegisteredSuccess(false);
                            // navigate to panel (dashboard)
                            try { router.push('/panel'); } catch (e) { /* ignore */ }
                          } catch (err: any) {
                            setRegSubmitting(false);
                            setRegError(err?.message || 'Failed to create reservation. Please try again.');
                          }
                        }}
                        className="inline-flex items-center justify-center rounded bg-emerald-600 px-4 py-2 text-white font-semibold disabled:opacity-50"
                        disabled={regSubmitting}
                      >
                        {regSubmitting ? 'Processing…' : 'Ok'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRegisterModalOpen(false);
                          setRegisteredSuccess(false);
                          setRegError(null);
                        }}
                        className="inline-flex items-center justify-center rounded border px-4 py-2 text-sm"
                        disabled={regSubmitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

  {/* Prize modal (opened from badges) */}
  <PrizeModal open={prizeOpen} onCloseAction={() => setPrizeOpen(false)} />
    </div>
  );
}

