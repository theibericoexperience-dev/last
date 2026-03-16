"use client";

// Types
type ActiveTab = "itinerary" | "reservation";
type ViewMode = 'SUMMARY' | 'ITINERARY' | 'EXTENSIONS';
type RightPanelContent = 'MEDIA' | 'WEATHER' | 'PACKAGE' | 'FLIGHTS' | 'EXTENSIONS';

function goBackToLanding(router: ReturnType<typeof useRouter>, tourYear?: number) {
   try {
       publishLandingScrollTo('tour-2026');
       router.push("/");
   } catch { /* ignore */ }
}

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/db/supabaseClient";
import InlineMap, { type MapPoint } from "../../components/InlineMap";
import { format, differenceInDays, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import SmartSlideshow from "./components/SmartSlideshow";
import { 
  ArrowLeftIcon, 
  XMarkIcon, 
  MapIcon, 
  CalendarDaysIcon, 
  GlobeAltIcon, 
  UserIcon, 
  CheckIcon, 
  ChevronDownIcon, 
  ChevronRightIcon, 
  ChevronUpIcon,
  InformationCircleIcon, 
  SunIcon, 
  DocumentTextIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentArrowDownIcon,
  HomeIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  MoonIcon,
  CameraIcon
} from "@heroicons/react/24/outline";
import UserBubble from '@/components/UserBubble';
import ReservationTab, { TourData } from "../../components/reservation/ReservationTab";
import { publishLandingScrollTo, subscribeTourOpenReservation } from "../../lib/navigation/intents";
import { safeWebPath, normalizeUrl, tryImageFallback } from "./utils/media";
import mediaUrl from '@/lib/media/mediaUrl';

// Icons
const CommercialPlaneIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
   <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
   </svg>
);

const WeatherStatusIcon = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
      {/* Sun behind */}
      <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 3V1M21 8H23M19.5 4.5L21 3M19.5 11.5L21 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Cloud overlapping */}
      <path d="M5 16C3.34315 16 2 14.6569 2 13C2 11.3431 3.34315 10 5 10C5.127 10 5.251 10.009 5.372 10.026C5.836 7.747 7.846 6 10.25 6C13.011 6 15.25 8.239 15.25 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 16H13C14.6569 16 16 14.6569 16 13C16 12.33 15.79 11.72 15.44 11.21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Rain drops */}
      <path d="M8 19L7 21M13 19L12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
   </svg>
);

export default function TourClient({ id, initialData }: { id?: string; initialData?: any }): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<ActiveTab>("itinerary");
  const [viewMode, setViewMode] = useState<ViewMode>('SUMMARY');
  const [rightPanelContent, setRightPanelContent] = useState<RightPanelContent>('MEDIA');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isFlightsModalOpen, setIsFlightsModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isOptionalsModalOpen, setIsOptionalsModalOpen] = useState(false);
  const [selectedOptionals, setSelectedOptionals] = useState<Record<string, boolean>>({});
  const [itineraryMedia, setItineraryMedia] = useState<any[]>([]);
  const [showLearnMore, setShowLearnMore] = useState(false); // Restored state for Ibero Package footer
   const [summaryExpanded, setSummaryExpanded] = useState(false);
   // Defaulting to 'morning' so it is shown initially as requested
   const [mobileItinerarySection, setMobileItinerarySection] = useState<'morning' | 'afternoon' | null>('morning');
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({}); // For mobile itinerary text toggle
  const [expandedDayId, setExpandedDayId] = useState<number | null>(null);
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
   const lastScrollY = useRef(0);
  const [itineraryExpanded, setItineraryExpanded] = useState(false);

  // Mobile continuous scroll refs + state
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [mobileActiveSection, setMobileActiveSection] = useState<'summary' | 'itinerary' | 'extensions' | 'reservation'>('summary');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showMobileScrollTop, setShowMobileScrollTop] = useState(false);

  // Detect mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobileDevice(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // IntersectionObserver for mobile scroll-position-aware navbar
  useEffect(() => {
    if (!isMobileDevice || !mobileScrollRef.current) return;
    const sections = mobileScrollRef.current.querySelectorAll('[data-mobile-section]');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        let maxRatio = 0;
        let activeId = 'summary';
        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            activeId = (entry.target as HTMLElement).dataset.mobileSection || 'summary';
          }
        });
        if (maxRatio > 0) {
          setMobileActiveSection(activeId as any);
        }
      },
      { root: mobileScrollRef.current, threshold: [0, 0.1, 0.3, 0.5, 0.7] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isMobileDevice, activeTab]);

  // Mobile: scroll to section helper
  const scrollToMobileSection = (sectionId: string) => {
    if (!mobileScrollRef.current) return;
    const el = mobileScrollRef.current.querySelector(`[data-mobile-section="${sectionId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  

   const handleItineraryScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;
      const currentScrollY = container.scrollTop;

      if (viewMode === 'ITINERARY') {
         if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
            setIsBottomNavVisible(false);
         } else if (currentScrollY < lastScrollY.current - 10) {
            setIsBottomNavVisible(true);
         }
      }

      // Mobile continuous scroll: expand summary text on scroll down, collapse at top
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
         if (currentScrollY > 40 && !summaryExpanded) {
            setSummaryExpanded(true);
            // Scroll container back to top so user sees the beginning of expanded text
            requestAnimationFrame(() => {
               mobileScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            });
         } else if (currentScrollY <= 10 && summaryExpanded) {
            setSummaryExpanded(false);
         }
         // Show/hide scroll-to-top button
         setShowMobileScrollTop(currentScrollY > 300);
      } else if (viewMode === 'SUMMARY' && typeof window !== 'undefined' && window.innerWidth < 768) {
         // legacy path (desktop fallback)
         if (currentScrollY > 40 && !summaryExpanded) {
            setSummaryExpanded(true);
         } else if (currentScrollY <= 10 && summaryExpanded) {
            setSummaryExpanded(false);
         }
      }

      lastScrollY.current = currentScrollY;
   };

         

  // Layout refs for modal
  const headerRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  
  // --- DATA PARSING ---
  const { 
    title, 
    start_date, 
    end_date, 
    price_data, 
    summary, // Using summary per request
    description, // Fallback if needed, but summary is priority
    stops_path,
    days: tourDays = [],
    Weather: weatherInfo,
  } = initialData || {};

   // PDF info for download button: derive filename from URL when available
   const pdfUrl = initialData?.pdf_url || "https://auth.ibero.world/storage/v1/object/public/pdf-prueba/Forgotten%20Iberia.pdf";
   const pdfFileLabel = useMemo(() => {
      try {
         const parts = (pdfUrl || '').split('/');
         let name = parts[parts.length - 1] || 'PDF';
         try { name = decodeURIComponent(name); } catch {}
         return name;
      } catch { return 'PDF'; }
   }, [pdfUrl]);

  const [mainTitle, subTitle] = useMemo(() => (title || "").split('\n'), [title]);

  const daysCount = useMemo(() => {
    if (!start_date || !end_date) return 0;
    try { return differenceInDays(parseISO(end_date), parseISO(start_date)) + 1; } catch { return 0; }
  }, [start_date, end_date]);

   // Fetch Itinerary Media from Supabase folder "stops"
   useEffect(() => {
      async function fetchItineraryMedia() {
         // Force the canonical stops folder for itinerary media
         const canonicalPath = "Open Tours/MADRID TO LISBOA/MAIN TOUR/stops";
         try {
            const res = await fetch(`/api/media/list?path=${encodeURIComponent(canonicalPath)}`);
            if (!res.ok) {
               console.warn('[fetchItineraryMedia] failed to list media for', canonicalPath);
               return;
            }
            const json = await res.json();
            const files = json.files || [];

            // Keep only images and sort by filename numeric order so Day 1, Day 2... align with filenames
            const imgs = files
               .filter((f: any) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f.filename || f.path))
               .sort((a: any, b: any) => (a.filename || '').localeCompare(b.filename || '', undefined, { numeric: true }));

            // Group images by their day number extracted from filename. Each day can have multiple images (preserve folder order)
            const mediaByDay: any[] = [];
            imgs.forEach((f: any) => {
               const fn = (f.filename || '').toString();
               const dayNum = parseInt(fn.match(/\d+/)?.[0] || '0');
               if (dayNum > 0) {
                  const entry = {
                     src: f.path,
                     place: (f.metadata && (f.metadata.place || f.metadata.caption || f.metadata.title)) || f.caption || f.title || null,
                     folder: f.path ? f.path.split('/').slice(0, -1).join('/') : undefined,
                  };
                  mediaByDay[dayNum - 1] = mediaByDay[dayNum - 1] || [];
                  mediaByDay[dayNum - 1].push(entry);
               }
            });

            setItineraryMedia(mediaByDay);
         } catch (err) {
            console.error('Failed to fetch itinerary media', err);
         }
      }
      fetchItineraryMedia();
   }, [stops_path]);
  const dateRangeStr = useMemo(() => {
    if (!start_date || !end_date) return "Dates TBD";
    try {
      const s = parseISO(start_date);
      const e = parseISO(end_date);
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
            return `${format(s, 'd')} to ${format(e, 'd MMMM yyyy')}`;
      }
      return `${format(s, 'd MMMM')} to ${format(e, 'd MMMM yyyy')}`;
    } catch { return "Dates TBD"; }
  }, [start_date, end_date]);

   // Compact mobile-friendly date range: 1-16 March 2026
   const dateRangeCompactStr = useMemo(() => {
      if (!start_date || !end_date) return "Dates TBD";
      try {
         const s = parseISO(start_date);
         const e = parseISO(end_date);
         if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
            return `${format(s, 'd')}-${format(e, 'd MMMM yyyy')}`;
         }
         return `${format(s, 'd MMM')} - ${format(e, 'd MMM yyyy')}`;
      } catch { return "Dates TBD"; }
   }, [start_date, end_date]);

  const priceStr = useMemo(() => {
    // Calculate total price from "Flights" + "Tour Cost" columns
    // Note: initialData keys coming from Postgres might preserve casing/spaces if not transformed.
    // We try to access them robustly.
    const flightCost = Number(initialData?.["Flights"] || 0);
    const tourCost = Number(initialData?.["Tour Cost"] || 0);
    const total = flightCost + tourCost;
    
    // Fallback to price_data if individual columns are missing but price_data exists
    if (total > 0) return `€${total.toLocaleString()}`;
    if (price_data?.amount) return `€${price_data.amount.toLocaleString()}`;
    
    return "TBD";
  }, [initialData, price_data]);
  
  // Hero Image (Background)
  const heroSrc = initialData?.card_image || 'https://auth.ibero.world/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/MAIN TOUR/hero.webp';

  // Auth User Effect
  useEffect(() => {
    supabaseClient?.auth.getUser().then(({ data }) => setUser(data?.user));
  }, []);

  // Compute map points
  const mapPoints = useMemo(() => {
    return tourDays
      .filter((d: any) => d.stops_data && d.stops_data.lat)
      .map((d: any) => ({
        coords: [d.stops_data.lat, d.stops_data.lng],
        name: d.stops_data.stop_name || `Day ${d.day_number}`,
        day: d.day_number,
        order: d.day_number
      }));
  }, [tourDays]);
  
  // Media Logic: Back to random tour highlights per request
  const currentDayMedia = useMemo(() => {
    // We still keep the mapping for possible use, but it won't be from 'stops' folder anymore in the UI
    const dayData = tourDays.find((d: any) => d.day_number === selectedDay);
    if (dayData?.activities_data?.media) {
       return dayData.activities_data.media.map((m: any) => ({
         type: 'image',
         src: m.url || m.src
       }));
    }
    return [];
  }, [tourDays, selectedDay]);

  // Reservation Data Construction
  const tourData: TourData = {
    id: initialData?.id,
    title: title || "MADRID TO LISBOA",
    nights: 11,
    basePricePerTraveler: (initialData?.["Tour Cost"] || 0) + (initialData?.["Flights"] || 0),
    includedRoomType: 'double',
    inclusions: initialData?.inclusions,
    insuranceOptions: initialData?.insurance_options,
    departureAirports: initialData?.departure_airports,
    Weather: initialData?.Weather || "24°C - Sunny",
    disclaimer: "The itinerary shown reflects planned activities prior to reservations.",
    // Pass extensions from related_tours so ReservationTab can compute prices with matching keys
    extensions: (() => {
      try {
        const raw = typeof initialData?.related_tours === 'string'
          ? JSON.parse(initialData.related_tours)
          : (initialData?.related_tours || []);
        return raw.map((ex: any) => ({
          key: ex.id || ex.key,
          name: ex.title || ex.name,
          days: ex.days || 3,
          pricePerDay: ex.price_per_day ?? 250,
        }));
      } catch { return []; }
    })(),
  };

  // --- SCROLL NAVIGATION LOGIC ---
  useEffect(() => {
   const handleWheel = (e: any) => {
      // If any right panel contains scrollable content (not the default MEDIA) or a modal is open,
      // don't treat wheel as a command to switch the left view (Summary <-> Itinerary).
      if (rightPanelContent !== 'MEDIA' || isFlightsModalOpen || isWeatherModalOpen || isPackageModalOpen || isOptionalsModalOpen) return;

      // Horizontal Scroll -> Switch Main Tab (Details <-> Reservation)
      // We use a threshold of 30 to detect a clear swipe intention
      if (Math.abs(e.deltaX) > 30 && Math.abs(e.deltaY) < 20) {
         if (e.deltaX > 0 && activeTab === 'itinerary') setActiveTab('reservation');
         else if (e.deltaX < 0 && activeTab === 'reservation') setActiveTab('itinerary');
      }

      // Vertical Scroll -> Switch View Mode (Summary <-> Itinerary <-> Extensions)
      // Only if we are in 'itinerary' (Details) activeTab, because Reservation has its own scroll
      if (activeTab === 'itinerary' && Math.abs(e.deltaY) > 30 && Math.abs(e.deltaX) < 20) {
          if (e.deltaY > 0) { // Scroll Down
             if (viewMode === 'SUMMARY') setViewMode('ITINERARY');
          } else { // Scroll Up
             if (viewMode === 'ITINERARY') setViewMode('SUMMARY');
          }
      }
   };

    window.addEventListener('wheel', handleWheel); 
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeTab, viewMode, isFlightsModalOpen, isWeatherModalOpen, isPackageModalOpen, isOptionalsModalOpen]);

  // --- HANDLERS ---
   const handleBrochureClick = () => {
      if (!user) {
         alert("Please sign in to download the PDF.");
         return;
      }
      try {
         setDownloadStatus('loading');
         // Open original PDF directly in a new tab/window
         window.open(pdfUrl, '_blank', 'noopener,noreferrer');
         setDownloadStatus('success');
      } catch (err) {
         console.error('Opening original PDF failed', err);
         setDownloadStatus('idle');
      }
   };

  const handleItineraryClick = () => {
    if (viewMode === 'ITINERARY') {
      setViewMode('SUMMARY');
    } else {
      setViewMode('ITINERARY');
      if (selectedDay === 0) setSelectedDay(1);
    }
  };

  const handleExtensionsClick = () => {
    setRightPanelContent(rightPanelContent === 'EXTENSIONS' ? 'MEDIA' : 'EXTENSIONS');
  };
  
  // Helper to calculate date for a specific day number
  const getDateForDay = (dayNum: number) => {
    if (!start_date) return null;
    try {
      return addDays(parseISO(start_date), dayNum - 1);
    } catch {
      return null;
    }
  };

  // --- RENDER HELPERS (QUADRANTS) ---

  const renderSummaryPanel = () => {
    // Basic text processing for mobile summary
    const fullText = summary || description || "Join us on this incredible journey...";
    const paragraphs = fullText.split('\n').filter((p: string) => p.trim().length > 0);
    const firstPara = paragraphs[0] || fullText;

    return (
       <div className="h-full bg-white/60 p-5 lg:p-6 rounded-xl flex flex-col backdrop-blur-sm border border-white/50 shadow-sm relative overflow-hidden">
           {/* Header Section: Collapsable on Mobile */}
           <div className={`shrink-0 border-b border-gray-200/50 transition-all duration-500 ease-in-out origin-top md:block md:opacity-100 md:h-auto md:mb-3
              ${summaryExpanded ? 'h-0 opacity-0 overflow-hidden mb-0 border-none' : 'h-auto opacity-100 mb-3 pb-3'}`}
           >
              <div className="flex items-center justify-between gap-4 w-full">
                   {/* LEFT: Title + Subtitle + Date */}
                  <div className="flex-shrink-0 title-block max-w-[50%]">
                      <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-gray-900 leading-[0.9] -tracking-wide">
                        {mainTitle}
                      </h1>
                      <p className="text-sm md:text-base text-gray-500 font-serif italic leading-tight mt-1">
                         The original ibero tour
                      </p>
                      <div className="flex items-center gap-1.5 mt-2.5 text-gray-600">
                         <CalendarDaysIcon className="w-4 h-4" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest">
                                       <span className="block md:hidden">{dateRangeCompactStr}</span>
                                       <span className="hidden md:inline">{dateRangeStr}</span>
                                    </span>
                      </div>
                  </div>

                   {/* RIGHT: BUTTONS GRID */}
                  <div className="flex-1 min-w-0 tags-container">
                     <div className="header-buttons-grid-container grid grid-cols-3 gap-2 w-full">
                        <button 
                           onClick={handleItineraryClick}
                           className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white/50 rounded-full border border-gray-100 hover:border-black/30 hover:bg-white transition-all group text-[11px] w-full"
                        >
                           <span className="font-bold group-hover:text-black uppercase tracking-tight text-[13px] sm:text-sm">{daysCount} Days</span>
                        </button>

                        <button 
                           onClick={() => setRightPanelContent(rightPanelContent === 'PACKAGE' ? 'MEDIA' : 'PACKAGE')}
                           className="flex items-center justify-center gap-1 px-3 py-1.5 bg-white/50 rounded-full border border-gray-100 hover:border-black/30 hover:bg-white transition-all group text-[11px] w-full"
                        >
                           <span className="group-hover:text-black font-bold uppercase tracking-tight text-[13px] sm:text-sm">{priceStr}</span>
                        </button>

                        <button 
                           onClick={() => setRightPanelContent(rightPanelContent === 'FLIGHTS' ? 'MEDIA' : 'FLIGHTS')}
                           className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-colors includes-btn ${rightPanelContent === 'FLIGHTS' ? 'bg-white text-black border border-black' : 'bg-black text-white hover:bg-gray-800'} w-full`}
                        >
                           <CommercialPlaneIcon className="w-5 h-5 shrink-0 rotate-90" />
                           <span className="hidden md:inline-flex text-[10px] uppercase tracking-tight ml-1">Flights</span>
                        </button>

                        <button 
                           onClick={() => setRightPanelContent(rightPanelContent === 'WEATHER' ? 'MEDIA' : 'WEATHER')}
                           className={`px-3 py-1.5 flex items-center justify-center gap-1.5 rounded-full border transition-all shadow-sm weather-btn ${rightPanelContent === 'WEATHER' ? 'bg-black text-white border-black' : 'bg-white/60 text-gray-600 border-gray-200 hover:bg-white hover:border-gray-400'} w-full`}
                           title="Weather Info"
                        >
                           <WeatherStatusIcon />
                           <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-tight ml-1">Weather</span>
                        </button>

                        <button 
                           onClick={() => setRightPanelContent(rightPanelContent === 'PACKAGE' ? 'MEDIA' : 'PACKAGE')}
                           className={`col-span-2 px-3 py-1.5 border rounded-full text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 transition-colors shadow-sm package-btn ${rightPanelContent === 'PACKAGE' ? 'bg-black text-white border-black' : 'bg-white/60 text-gray-700 border-gray-200 hover:bg-white hover:border-gray-400'} w-full min-w-0`}
                        >
                           <span className="text-[10px] font-bold uppercase tracking-tight truncate shrink-0">Ibero Package</span>
                           <ChevronDownIcon className="w-3 h-3 ml-0.5 shrink-0" />
                        </button>
                     </div>
                  </div>
              </div>
           </div>

           {/* Scrollable Summary for Desktop */}
           <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar min-h-0 mb-2 hidden md:block">
             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 md:sticky md:top-0 bg-white/0 backdrop-blur-none">Tour Overview</h3>
             <div className="text-base md:text-lg text-gray-700 leading-relaxed font-serif whitespace-pre-line underline decoration-black/5 underline-offset-8">
                {fullText}
             </div>
           </div>

           {/* MOBILE CONTENT STACK: Text + Media */}
           <div className="flex flex-col md:hidden relative w-full">
               {(rightPanelContent === 'PACKAGE' || rightPanelContent === 'EXTENSIONS') ? (
                  /* FULL WINDOW OVERLAY STYLE FOR PACKAGE/EXTENSIONS */
                  <div className="flex-1 animate-in fade-in slide-in-from-bottom-5 duration-700 bg-white">
                     {rightPanelContent === 'PACKAGE' ? (
                         <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
                             {/* HERO IMAGE */}
                             <div className="w-full h-[35vh] relative overflow-hidden shrink-0">
                                <img 
                                   src={heroSrc} 
                                   alt="Package Hero" 
                                   className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6 text-white">
                                   <h3 className="text-3xl font-serif font-bold tracking-tight">Ibero Package</h3>
                                   <p className="text-sm opacity-80 italic font-serif">A complete journey, fully inclusive.</p>
                                </div>
                             </div>

                             <div className="p-6 space-y-8">
                                 <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 border-b pb-2">Included in your tour</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                       {[
                                          { title: "Flights Included", text: "International round-trip flights from major US/EU Hubs included.", icon: PaperAirplaneIcon },
                                          { title: "Premium Hotels", text: "Stays in hand-picked 4 and 5-star properties in city centers.", icon: HomeIcon },
                                          { title: "Bilingual Guides", text: "Expert local guides accompanying you for the entire duration.", icon: UserIcon },
                                          { title: "All Logistics", text: "Luxury ground transport, luggage handling, and local transfers.", icon: GlobeAltIcon },
                                          { title: "Daily Meals", text: "Full buffet breakfast daily plus select regional gourmet dinners.", icon: SunIcon }
                                       ].map((item, i) => (
                                          <div key={i} className="flex gap-4 items-start bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                             <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shrink-0">
                                                <item.icon className="w-5 h-5" />
                                             </div>
                                             <div>
                                                <h5 className="font-bold text-gray-900 text-sm">{item.title}</h5>
                                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.text}</p>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 {/* PACKAGE FOOTER / DISCLAIMER */}
                                 <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100/50">
                                    <div className="flex items-center gap-2 mb-3">
                                       <InformationCircleIcon className="w-5 h-5 text-amber-600" />
                                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Transparency Notice</h5>
                                    </div>
                                    <p className="text-[11px] text-amber-900/70 leading-relaxed italic">
                                       The Ibero Package price is locked upon reservation. We do not apply seasonal surcharges or hidden booking fees. All international airport taxes are included.
                                    </p>
                                 </div>
                             </div>

                             <div className="p-6 pt-0 mt-8 relative bg-transparent pb-10">
                                <div className="border-t border-gray-100 pt-6 mb-6">
                                    <p className="font-bold text-black mb-2 text-xs uppercase tracking-wide">
                                        Certified Travel Agency Details
                                    </p>
                                    <div className="space-y-1 text-xs font-medium text-gray-500">
                                        <div className="grid grid-cols-2 gap-x-4">
                                            <span>NAME: <strong className="text-black">IBERO</strong></span>
                                            <span>CIEX: <strong className="text-black">06-00049-Om</strong></span>
                                        </div>
                                        <div>REG: <strong className="text-black">AV-00661</strong></div>
                                        <div className="pt-2 text-gray-600">tours@ibero.world</div>
                                        <div className="font-bold text-black">www.ibero.world</div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setRightPanelContent('MEDIA')}
                                    className="w-full py-4 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                                 >
                                    Back to Overview
                                 </button>
                             </div>
                         </div>
                     ) : (
                         /* EXTENSIONS + INSURANCE + FLIGHTS CONTENT */
                         <div className="flex flex-col h-full bg-white">
                             <div className="p-6 overflow-y-auto no-scrollbar pb-32">
                                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-1">Tailor Your Journey</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-tighter mb-8 border-b pb-2">Customize extensions and insurance options</p>

                                <div className="space-y-10">
                                     {/* 1. EXTENSIONS (Parsed) */}
                                     <div>
                                         <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black mb-4">
                                             <PuzzlePieceIcon className="w-4 h-4" /> Optional Extensions
                                         </h4>
                                         <div className="grid grid-cols-1 gap-3">
                                             {(() => {
                                                 let exts = [];
                                                 try {
                                                    exts = typeof initialData?.related_tours === 'string' 
                                                      ? JSON.parse(initialData.related_tours) 
                                                      : initialData?.related_tours || [];
                                                 } catch { exts = []; }
                                                 
                                                 if (exts.length === 0) return <p className="text-xs italic text-gray-400 p-4 border rounded-xl">No extensions available.</p>;

                                                 return exts.map((ex: any, i: number) => {
                                                     const key = `ext:${ex.id || ex.key}`;
                                                     return (
                                                        <label key={i} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer 
                                                           ${selectedOptionals[key] ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}>
                                                           <input 
                                                              type="checkbox" 
                                                              checked={!!selectedOptionals[key]} 
                                                              onChange={() => setSelectedOptionals(s => ({...s, [key]: !s[key]}))}
                                                              className="mt-1 w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                                                           />
                                                           <div className="flex-1">
                                                              <div className="flex justify-between">
                                                                 <span className="font-bold text-sm text-gray-900">{ex.title || ex.name}</span>
                                                                 <span className="font-mono text-xs font-bold">€{(ex.price_per_day || 250) * (ex.days || 3)}</span>
                                                              </div>
                                                              <p className="text-[11px] text-gray-500 mt-1">+{ex.days || 3} days • €{ex.price_per_day || 250}/day</p>
                                                           </div>
                                                        </label>
                                                     );
                                                 });
                                             })()}
                                         </div>
                                     </div>

                                     {/* 2. INSURANCE (Health/Cancel) */}
                                     <div>
                                         <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black mb-4">
                                             <ShieldCheckIcon className="w-4 h-4" /> Insurance Options
                                         </h4>
                                         <div className="grid grid-cols-1 gap-3">
                                            {[
                                               { key: 'insHealth', label: tourData.insuranceOptions?.health || 'Global Health Hub (Premium)', price: 100 },
                                               { key: 'insCancel', label: tourData.insuranceOptions?.cancellation || 'Full Cancellation Protection', price: 120 }
                                            ].map((ins) => (
                                               <label key={ins.key} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer 
                                                  ${selectedOptionals[ins.key] ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}>
                                                  <input 
                                                     type="checkbox" 
                                                     checked={!!selectedOptionals[ins.key]} 
                                                     onChange={() => setSelectedOptionals(s => ({...s, [ins.key]: !s[ins.key]}))}
                                                     className="mt-1 w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                                                  />
                                                  <div className="flex-1 flex justify-between">
                                                     <span className="font-bold text-sm text-gray-900">{ins.label}</span>
                                                     <span className="text-xs font-bold">€{ins.price}</span>
                                                  </div>
                                               </label>
                                            ))}
                                         </div>
                                     </div>

                                     {/* 3. CUSTOM FLIGHTS (Departure Hubs) */}
                                     <div>
                                         <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black mb-4">
                                             <PaperAirplaneIcon className="w-4 h-4" /> Custom Flights
                                         </h4>
                                         <div className="p-5 border border-gray-100 bg-gray-50/50 rounded-2xl">
                                             <p className="text-[11px] text-gray-500 italic mb-4">Select your departure hub for specific flight coordination.</p>
                                             <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-black">
                                                <option value="">Select Departure Airport...</option>
                                                {tourData.departureAirports?.map(a => (
                                                   <option key={a} value={a}>{a}</option>
                                                ))}
                                             </select>
                                         </div>
                                     </div>
                                </div>
                             </div>
                             
                             <div className="p-6 pt-0 mt-8 relative bg-transparent pb-10">
                                <button 
                                    onClick={() => setRightPanelContent('MEDIA')}
                                    className="w-full py-4 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                                 >
                                    Save & Back to Overview
                                 </button>
                             </div>
                         </div>
                     )}
                  </div>
               ) : (
                  <>
                     {/* 1. Summary Text — expands and pushes image down. Chevron toggles expansion. */}
                     {(rightPanelContent !== 'FLIGHTS' && rightPanelContent !== 'WEATHER') && (
                        <div className="mb-4">
                           <div
                              className="text-base font-serif text-gray-800 leading-relaxed text-left whitespace-pre-line overflow-hidden transition-all duration-500 ease-in-out"
                              style={{ maxHeight: summaryExpanded ? '999px' : '4.5rem' }}
                           >
                              {fullText}
                           </div>
                           
                           {/* CHEVRON — toggles text expansion, image stays below */}
                           <button 
                              onClick={() => setSummaryExpanded(s => !s)} 
                              className="mt-2 w-full flex items-center justify-center py-2 text-black/40 hover:text-black transition-colors"
                              aria-label={summaryExpanded ? "Show less" : "Show more"}
                           >
                              <ChevronDownIcon 
                                 className={`w-5 h-5 transition-transform duration-500 ${summaryExpanded ? 'rotate-180' : 'rotate-0'}`} 
                              />
                           </button>
                        </div>
                     )}

                     {/* 2. DYNAMIC Media Box — always below the text, pushed down when text expands */}
                     {rightPanelContent === 'FLIGHTS' ? (
                        <div className="flex-1 w-full min-h-0 overflow-y-auto rounded-lg shadow-sm border border-gray-200 bg-white p-4">
                           <h3 className="text-sm font-semibold text-gray-900 mb-3">Flights included from the following destinations:</h3>
                           <ul className="grid grid-cols-2 gap-2 w-full">
                              {tourData.departureAirports?.map((airport) => (
                                 <li key={airport} className="flex items-center justify-center text-[11px] font-bold text-gray-800 bg-gray-100 px-2 py-2 rounded border border-gray-200 uppercase">
                                    {airport}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     ) : rightPanelContent === 'WEATHER' ? (
                        <div className="flex-1 w-full min-h-0 overflow-y-auto rounded-lg shadow-sm border border-gray-200 bg-white p-6 animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50/50 to-white">
                           <div className="relative mb-3">
                              <SunIcon className="w-14 h-14 text-amber-500 animate-pulse" />
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-amber-100">
                                 <span className="text-[10px] font-bold text-amber-600">
                                    {tourData.Weather?.match(/\d+/)?.[0] || '24'}°
                                 </span>
                              </div>
                           </div>
                           <h3 className="text-xl font-serif font-bold text-gray-900 mb-1">
                              {tourData.Weather?.split('-')[0].trim() || 'Madrid-Lisbon'}
                           </h3>
                           <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Average Conditions</p>
                           <p className="text-[11px] text-gray-600 mb-4 px-4 leading-relaxed whitespace-pre-line">
                              {/* Show exactly what is in Supabase */}
                              {tourData.Weather || "Weather information coming soon."}
                           </p>
                           <button 
                              onClick={() => setRightPanelContent('MEDIA')} 
                              className="px-5 py-1.5 bg-black text-white rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm"
                           >
                              Back to Gallery
                           </button>
                        </div>
                     ) : (
                        <div className="w-full aspect-video rounded-lg overflow-hidden relative shrink-0 shadow-sm border border-gray-200 bg-white">
                           {/* Default Gallery — always visible */}
                           <>
                              <SmartSlideshow 
                                    basePath="Open Tours/MADRID TO LISBOA"
                                    className="w-full h-full object-cover"
                                    disableZoom={false}
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                              </>
                           </div>
                     )}
                  </>
               )}
           </div>
       </div>
    );
  };  // Quadrant 1: Top Left (Info or Calendar)
   const renderTopLeft = () => {
      if (viewMode === 'ITINERARY') {
         return (
             <div className="h-full bg-white/40 p-4 pb-20 rounded-xl flex flex-col relative overflow-hidden backdrop-blur-sm border border-white/50 shadow-sm transition-all duration-300 hidden md:block">
            {/* Calendar Grid - Smart Date Aware */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
               
               {/* Month + Year Header */}
               <div className="mb-2 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                     {(() => {
                        if (!calendarGrid || calendarGrid.length === 0) return 'Trip Calendar';
                        const validDays = calendarGrid.filter((c: any) => c.status === 'tour');
                        if (validDays.length === 0) return 'Trip Calendar';
                        const startLabel = format(validDays[0].date, 'MMM yyyy').toUpperCase();
                        const endLabel = format(validDays[validDays.length - 1].date, 'MMM yyyy').toUpperCase();
                        return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
                     })()}
                  </span>
               </div>

               {/* Weekday Headers */}
               <div className="grid grid-cols-7 mb-1 border-b border-gray-200/50 pb-1">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <div key={d} className="text-[8px] font-bold text-center text-gray-400 uppercase tracking-widest">
                      {d[0]}
                    </div>
                  ))}
               </div>

               <div className="grid grid-cols-7 gap-1 pb-2">
                {calendarGrid.map((cell: any, idx: number) => {
                  const isSelected = cell.status === 'tour' && selectedDay === cell.dayNum;
                  
                  return (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (cell.status === 'tour') setSelectedDay(cell.dayNum);
                      }}
                      disabled={cell.status !== 'tour'}
                      className={`h-10 flex flex-col items-center justify-center rounded-lg transition-all relative
                        ${cell.status === 'tour' 
                          ? (isSelected 
                              ? 'bg-black text-white border-black scale-105 shadow-md ring-1 ring-black/20 z-10' 
                              : 'text-gray-900 border-gray-200 hover:border-black hover:bg-white/40' 
                            )
                          : (cell.status === 'empty'
                              ? 'opacity-0 pointer-events-none'
                              : 'bg-gray-100/50 text-gray-400 border border-dashed border-gray-200 cursor-not-allowed'
                            )
                        } border`}
                    >
                      {cell.status !== 'empty' && (
                         <>
                           <span className={`text-[9px] font-mono absolute top-1 left-1 ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                              {format(cell.date, 'd')}
                           </span>
                           
                           {/* Highlight EXTENSIONS inside the box as requested */}
                           {(cell.status === 'pre' || cell.status === 'post') && (
                              <span className="text-[6px] font-bold uppercase tracking-widest mt-3 leading-tight text-center px-0.5">
                                 {cell.status === 'pre' ? 'PRE\nTOUR' : 'POST\nTOUR'}
                              </span>
                           )}
                           
                           {/* Tour Day Number only if needed, user said "deja solo el gris text-mono, texto negro no" */}
                           {/* Intentionally omitted dayNum big text based on user request */}
                         </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
         </div>
      );
    }
    return null;
  };

  // Quadrant 2: Bottom Left (Description or Day Detail)
  const renderBottomLeft = () => {
    if (viewMode === 'ITINERARY') {
      const day = tourDays.find((d:any) => d.day_number === selectedDay);
      const detailText = day?.day_description || day?.activities_data?.description || '';
      const morningText = typeof day?.activities_data?.morning === 'string' 
         ? day.activities_data.morning 
         : day?.activities_data?.morning?.text || day?.activities_data?.morning?.title || '';
      const afternoonText = typeof day?.activities_data?.afternoon === 'string' 
         ? day.activities_data.afternoon 
         : day?.activities_data?.afternoon?.text || day?.activities_data?.afternoon?.title || '';

      return (
        <div className="h-full bg-white/60 p-5 rounded-xl flex flex-col backdrop-blur-sm border border-white/50 relative shadow-sm group/card">
           <div className="flex-grow overflow-y-auto mb-2 custom-scrollbar pr-2">
              <div className="flex items-baseline gap-3 mb-4 border-b border-gray-200/50 pb-3 md:sticky md:top-0 bg-white/0 backdrop-blur-sm z-10 pr-2">
                 <div className="min-w-0">
                   <h3 className="text-xl font-bold text-gray-900 leading-tight truncate">
                     {day?.day_title || day?.stops_data?.stop_name || `Day ${selectedDay}`}
                   </h3>
                   {day?.overnight_city && (
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                        <HomeIcon className="w-3 h-3" /> Overnight: {day.overnight_city}
                      </div>
                   )}
                 </div>
              </div>
              <div className="space-y-6">
                 {detailText && (
                    <p className="text-base text-gray-800 leading-relaxed whitespace-pre-line font-serif">
                       {detailText}
                    </p>
                 )}

                 {/* Mobile: Gallery First, then Accordions */}
                 <div className="md:hidden mt-4">
                    {/* Gallery replacing Calendar */}
                    <div className="w-full aspect-[16/8] rounded-lg overflow-hidden relative shadow-sm border border-gray-200 mb-4">
                       <SmartSlideshow basePath="Open Tours/MADRID TO LISBOA" className="w-full h-full object-cover" disableZoom={false} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>

                    {/* Morning Accordion */}
                    <div className="mb-2 border border-blue-100 rounded-lg overflow-hidden bg-white/60">
                        <button
                           onClick={() => setMobileItinerarySection(mobileItinerarySection === 'morning' ? null : 'morning')}
                           className="w-full flex items-center justify-between p-3 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                        >
                           <div className="flex items-center gap-2">
                              <SunIcon className="w-4 h-4 text-orange-400" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Morning</span>
                           </div>
                           <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${mobileItinerarySection === 'morning' ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${mobileItinerarySection === 'morning' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                           <div className="p-3 pt-1 text-sm text-gray-800 leading-relaxed font-serif border-t border-blue-100/50">
                              {morningText || 'Free time for leisure.'}
                           </div>
                        </div>
                    </div>

                    {/* Afternoon Accordion */}
                    <div className="mb-2 border border-indigo-100 rounded-lg overflow-hidden bg-white/60">
                        <button
                           onClick={() => setMobileItinerarySection(mobileItinerarySection === 'afternoon' ? null : 'afternoon')}
                           className="w-full flex items-center justify-between p-3 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                        >
                           <div className="flex items-center gap-2">
                              <MoonIcon className="w-4 h-4 text-indigo-400" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Afternoon</span>
                           </div>
                           <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${mobileItinerarySection === 'afternoon' ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${mobileItinerarySection === 'afternoon' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                           <div className="p-3 pt-1 text-sm text-gray-800 leading-relaxed font-serif border-t border-indigo-100/50">
                              {afternoonText || 'Activities and excursions.'}
                           </div>
                        </div>
                    </div>
                 </div>

                 {/* Desktop: original stacked Morning/Afternoon */}
                 <div className="hidden md:block">
                    {morningText && (
                       <div className="mt-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Morning</span>
                          <p className="text-base text-gray-800 leading-relaxed font-serif">
                             {morningText}
                          </p>
                       </div>
                    )}
                    {afternoonText && (
                       <div className="mt-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Afternoon / Evening</span>
                          <p className="text-base text-gray-800 leading-relaxed font-serif">
                             {afternoonText}
                          </p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
           
           {/* Navigation Buttons */}
           <div className="mt-auto pt-4 flex gap-2 border-t border-gray-100/50">
               <button 
                  onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))} 
                  disabled={selectedDay <= 1} 
                  className="flex-1 py-3 bg-white border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-50 disabled:opacity-50 transition-colors"
               >
                 Prev Day
               </button>
               <button 
                   onClick={() => setSelectedDay(Math.min(daysCount, selectedDay + 1))} 
                   disabled={selectedDay >= daysCount}
                   className="flex-1 py-3 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors"
               >
                 Next Day
               </button>
           </div>
        </div>
      );
    }
    return null;
  };

  // --- CALENDAR GRID COMPUTATION ---
  const calendarGrid = useMemo(() => {
    if (!start_date || !end_date) return [];
    
    const start = parseISO(start_date);
    const end = parseISO(end_date);
    
    // Parse extensions
    let preDays = 0;
    let postDays = 0;
    let extensions: any[] = [];
    try {
       extensions = typeof initialData?.related_tours === 'string' 
         ? JSON.parse(initialData.related_tours) 
         : initialData?.related_tours || [];
    } catch { extensions = []; }

    extensions.forEach(ext => {
        const when = (ext.when || '').toLowerCase();
        if (when.includes('pre')) preDays += (ext.days || 0);
        if (when.includes('post')) postDays += (ext.days || 0);
    });

    const effectiveStart = subDays(start, preDays);
    const effectiveEnd = addDays(end, postDays);
    
    // Full weeks (Mon start)
    const gridStart = startOfWeek(effectiveStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(effectiveEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: gridStart, end: gridEnd }).map(date => {
       let status: 'tour' | 'pre' | 'post' | 'empty' = 'empty';
       let dayNum = 0;

       if (date >= start && date <= end) {
          status = 'tour';
          dayNum = differenceInDays(date, start) + 1;
       } else if (date >= subDays(start, preDays) && date < start) {
          status = 'pre';
       } else if (date > end && date <= addDays(end, postDays)) {
          status = 'post';
       }
       
       return { date, status, dayNum };
    });
  }, [start_date, end_date, initialData]);

  // --- OPTIONALS MODAL CONTENT (COPIED FROM RESERVATIONTAB) ---
  const OptionalsContent = ({ tourData, onClose }: { tourData: TourData; onClose: () => void }) => {
     const [selected, setSelected] = useState<Record<string, boolean>>({});

     const extensionsList = useMemo(() => {
        // Parse from related_tours if string or array
        let exts = [];
        try {
           exts = typeof initialData?.related_tours === 'string' 
             ? JSON.parse(initialData.related_tours) 
             : initialData?.related_tours || [];
        } catch { exts = []; }

        // formats them to match ReservationTab expected structure
        return exts.map((ex: any) => ({
             key: ex.id || ex.key,
             name: ex.title || ex.name,
             days: ex.days || 3,
             pricePerDay: ex.price_per_day || 250
        }));
     }, []);

     const addons = useMemo(() => [
        { key: 'insHealth', label: tourData.insuranceOptions?.health || 'Health insurance', price: 100, perTraveler: true, info: 'Covers basic medical emergencies.' },
        { key: 'insCancel', label: tourData.insuranceOptions?.cancellation || 'Cancellation insurance', price: 120, perTraveler: true, info: 'Covers trip cancellation per policy.' },
     ], [tourData]);

     const totalExtra = useMemo(() => {
        return Object.keys(selected).reduce((acc, k) => {
            if(!selected[k]) return acc;
            if(k.startsWith('ext:')) {
                const exKey = k.replace('ext:' ,'');
                const ex = extensionsList.find((e:any) => e.key === exKey);
                return acc + (ex ? ex.pricePerDay * ex.days : 0);
            }
            const ad = addons.find(a => a.key === k);
            return acc + (ad ? ad.price : 0);
        }, 0);
     }, [selected, extensionsList, addons]);

     return (
        <div className="flex flex-col h-full bg-white">
             {/* BLACK HEADER */}
             <div className="flex-shrink-0 p-3 bg-black flex items-center justify-between">
                <div className="flex flex-col">
                   <h2 className="text-2xl font-serif font-bold text-white tracking-widest uppercase">Optional Extensions</h2>
                   <p className="text-xs text-white/50 uppercase tracking-tighter">Customize your trip with extensions and insurance</p>
                </div>
                
                <div className="flex items-center gap-8">
                   <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Additional Total</span>
                      <span className="text-3xl font-serif font-bold text-white">
                          €{totalExtra.toLocaleString()}
                      </span>
                   </div>
                   <button 
                     onClick={onClose}
                     className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                   >
                     <span className="sr-only">Close</span>
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-hidden p-8">
                  <div className="flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar pr-2">
                      {/* ROW 1: Extensions */}
                      <div className="shrink-0">
                          <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-black mb-4 md:sticky md:top-0 bg-white/80 backdrop-blur-md py-3 z-10 border-b border-black/5">
                              <PuzzlePieceIcon className="w-5 h-5" />
                              Extensions
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {extensionsList.length === 0 && (
                               <div className="col-span-full p-6 border border-dashed border-gray-300 rounded-lg text-center text-gray-400 text-sm italic">
                                   No extensions available for this tour.
                               </div>
                            )}
                            {extensionsList.map((ex: any) => (
                               <label key={ex.key} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-white
                                  ${selected['ext:'+ex.key] ? 'border-black bg-white shadow-md' : 'border-gray-200 bg-white/60 hover:border-gray-300'}`}>
                                  <input 
                                    type="checkbox" 
                                    checked={!!selected['ext:'+ex.key]} 
                                    onChange={() => setSelected(s => ({...s, ['ext:'+ex.key]: !s['ext:'+ex.key]}))}
                                    className="mt-1 w-5 h-5 text-black border-gray-300 rounded focus:ring-black shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-start">
                                        <span className="font-bold text-gray-900 text-base leading-tight truncate pr-2">{ex.name}</span>
                                        <span className="font-mono text-xs font-bold whitespace-nowrap bg-gray-100 px-2 py-1 rounded">€{(ex.pricePerDay * ex.days).toLocaleString()}</span>
                                     </div>
                                     <p className="text-xs text-gray-500 mt-2 font-medium">+{ex.days} days • €{ex.pricePerDay}/day</p>
                                  </div>
                               </label>
                            ))}
                          </div>
                      </div>

                      {/* ROW 2: Insurance */}
                      <div className="shrink-0">
                          <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-black mb-4 md:sticky md:top-0 bg-white/80 backdrop-blur-md py-3 z-10 border-b border-black/5">
                              <ShieldCheckIcon className="w-5 h-5" />
                              Insurance
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {addons.map((a) => (
                              <label key={a.key} className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:bg-white
                                ${selected[a.key] ? 'border-black bg-white shadow-sm' : 'border-gray-200 bg-white/60 hover:border-gray-300'}`}>
                                  <input 
                                    type="checkbox" 
                                    checked={!!selected[a.key]} 
                                    onChange={() => setSelected(s => ({...s, [a.key]: !s[a.key]}))}
                                    className="mt-0.5 w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                  />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-sm text-gray-900">{a.label}</span>
                                        <span className="text-xs font-bold">€{a.price}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">{a.info}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                      </div>
                      
                      {/* ROW 3: Flights */}
                      <div className="shrink-0 pb-4">
                        <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-black mb-4 py-2">
                           <PaperAirplaneIcon className="w-5 h-5" />
                           Flights
                        </h3>
                        <div className="bg-white/60 p-5 rounded-xl border border-gray-200">
                           <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                              We include flights from select hubs. Check this box to request a custom connection quote from our team.
                           </p>
                           <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black" />
                              <span className="text-sm font-bold text-gray-900">Request custom flight quote</span>
                           </label>
                        </div>
                      </div>
                  </div>
             </div>
        </div>
     );
  };

  return (
   <div className="min-h-screen relative bg-black/5 tour-modal-wrapper" style={{ background: "transparent" }}>
      {/* 1. HERO BACKGROUND (Fixed) */}
      <div className="fixed inset-0 z-0">
         <img
            src={heroSrc.startsWith('http') ? heroSrc : (mediaUrl(heroSrc) ? normalizeUrl(mediaUrl(heroSrc) as string) : normalizeUrl(heroSrc))}
            alt="hero"
            className="w-full h-full object-cover opacity-90"
            onError={(e) => tryImageFallback(e.currentTarget as HTMLImageElement)}
          />
         <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
      </div>
      {/* Spacer for layout if needed */}
      <div aria-hidden style={{ height: "1px" }} />

         <style>{`
            /* 3x2 Grid for Header Buttons (Desktop & Mobile) */
            .header-buttons-grid-container {
               display: grid !important;
               grid-template-columns: repeat(3, 1fr) !important;
               grid-template-rows: repeat(2, auto) !important;
               gap: 0.6rem !important;
               width: 100% !important;
               margin-top: 0.5rem !important;
            }
            .header-buttons-grid-container > button {
               width: 100% !important;
               min-height: 42px !important;
               padding: 6px 12px !important;
               display: flex !important;
               align-items: center !important;
               justify-content: center !important;
               font-size: 11px !important;
            }

            /* Mobile-only overrides for Tour modal layout */
            @media (max-width: 767.98px) {
               .header-buttons-grid-container {
                  gap: 0.35rem !important;
                  margin-top: 0.25rem !important;
               }
               .header-buttons-grid-container > button {
                  min-height: 36px !important;
                  text-wrap: nowrap;
                  padding: 4px 6px !important;
                  font-size: 10px !important;
               }

               /* Make the modal wrapper occupy full viewport and remove framing */
               .tour-modal-wrapper {
                  border-radius: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  background-color: transparent !important;
                  max-width: 100% !important;
                  height: 100dvh !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden;
               }

               /* Force main container to be full screen minus tiny padding */
               main[class*="fixed inset-0"] {
                  padding: 0 !important;
                  align-items: flex-end !important;
               }

               /* Inner container styling for app-like feel */
               .tour-modal-inner {
                  border-radius: 12px 12px 0 0 !important; /* Rounded top on mobile */
                  box-shadow: 0 -4px 20px rgba(0,0,0,0.1) !important;
                  background-color: rgba(255,255,255,0.98) !important;
                  backdrop-filter: blur(25px) saturate(150%) !important;
                  width: 100% !important; 
                  max-width: 100% !important;
                  height: 100dvh !important;
                  max-height: 100dvh !important;
                  border: none !important;
                  display: flex !important;
                  flex-direction: column !important;
                  margin-bottom: 0 !important;
                  overflow: hidden !important; 
               }

            /* Floating Vertical Reserve Button */
            .floating-reserve-btn {
               position: fixed;
               top: 50%;
               right: 0; /* flush to the right edge */
               transform: translateY(-50%);
               writing-mode: vertical-rl; /* keep text vertical */
               text-orientation: mixed;
               background: rgba(0, 0, 0, 0.8);
               backdrop-filter: blur(8px);
               color: white;
               padding: 12px 6px;
               border-top-left-radius: 12px;
               border-bottom-left-radius: 12px;
               font-weight: 700;
               font-size: 10px;
               line-height: 1;
               letter-spacing: 0.12em;
               text-transform: uppercase;
               z-index: 9999;
               display: flex;
               flex-direction: column;
               align-items: center;
               justify-content: center;
               cursor: pointer;
               transition: opacity 0.15s ease, transform 0.12s ease;
               opacity: 1;
               box-shadow: -4px 0 20px rgba(0,0,0,0.2);
            }
            .floating-reserve-btn:hover {
               opacity: 0.9;
            }
            .floating-reserve-btn:active {
               transform: translateY(-50%) scale(0.98);
            }
            .floating-reserve-btn .chev-btm svg {
               width: 10px;
               height: 10px;
               margin-top: 4px;
               transform: rotate(90deg);
               stroke-width: 2px;
               color: inherit;
            }

            /* Minimal bounce for expand arrow */
            @keyframes minimal-bounce {
               0%, 100% { transform: translateY(0); }
               50% { transform: translateY(4px); }
            }
            .animate-minimal-bounce {
               animation: minimal-bounce 2.5s ease-in-out infinite;
            }

               /* Hide the generic 'top tag row' classes if they conflict */
               .tour-modal-wrapper .top-tag-row,
               .tour-modal-wrapper .top-tag-row * {
                  display: none !important;
               }

               /* Specific: shrink Tour Overview pills (tag row) */
                     .tour-modal-wrapper .tour-overview-tags {
                        gap: 0.35rem !important;
                        margin-top: 0.35rem !important;
                        padding-top: 0.25rem !important;
                     }
                           .tour-modal-wrapper .tour-overview-tags > button {
                              padding: 4px 6px !important;
                              font-size: 10px !important;
                              min-height: 36px !important; /* slightly smaller but still tappable */
                              min-width: 36px !important;
                              border-radius: 9999px !important;
                           }
                     .tour-modal-wrapper .tour-overview-tags > button svg { width: 14px !important; height: 14px !important; }
                  /* Header controls compact box */
                  .tour-modal-header .header-controls-box {
                     display: flex !important;
                     gap: 0.35rem !important;
                     align-items: center !important;
                  }
                  .tour-modal-header .header-controls-box .package-btn,
                  .tour-modal-header .header-controls-box button[title="Weather Info"],
                  .tour-modal-header .header-controls-box .includes-btn {
                     padding: 6px 8px !important;
                     min-height: 36px !important;
                     font-size: 11px !important;
                  }

                 /* Make all header buttons visually uniform on mobile: transparent borders and no box-shadow */
                 @media (max-width: 767.98px) {
                   .tour-modal-header button,
                   .tour-modal-header .header-buttons-grid-container > button,
                   .tour-modal-header .header-controls-box button,
                   .tour-modal-header .header-controls-box .package-btn,
                   .tour-modal-header .header-controls-box .includes-btn {
                      border-color: transparent !important;
                      box-shadow: none !important;
                   }
                  /* Also target the header buttons inside the summary panel (mobile) */
                  .header-buttons-grid-container > button,
                  .tags-container .header-buttons-grid-container > button,
                  .header-buttons-grid-container button,
                  .tags-container button,
                  .header-buttons-grid-container .package-btn {
                     border: none !important;
                     border-color: transparent !important;
                     box-shadow: none !important;
                     outline: none !important;
                     background-clip: padding-box !important;
                  }
                  /* Remove focus ring / shadow on active/focus */
                  .header-buttons-grid-container > button:focus,
                  .header-buttons-grid-container > button:active,
                  .tags-container button:focus,
                  .tags-container button:active {
                     box-shadow: none !important;
                     outline: none !important;
                  }
                 }
                  /* Weather smaller icon-only on mobile */
                  .tour-modal-header .header-controls-box button[title="Weather Info"] svg { width: 18px !important; height: 18px !important; }
                  .tour-modal-header .header-controls-box .package-text { display: none !important; }
                  .tour-modal-header .header-controls-box .package-btn { padding-left: 8px !important; padding-right: 8px !important; }

                  /* Mobile Header: Smaller icons and reduced padding */
                  .tour-modal-header {
                     padding-top: 0.5rem !important;
                     padding-bottom: 0.25rem !important;
                     min-height: auto !important;
                  }
                  /* Apply small size to the main header buttons (Back, Globe, User) */
                  .tour-modal-header > div:first-child button,
                  .tour-modal-header > div:first-child .user-bubble-btn {
                     width: 28px !important;
                     height: 28px !important;
                     min-width: 28px !important;
                  }
                  .tour-modal-header > div:first-child button svg {
                     width: 14px !important;
                     height: 14px !important;
                  }

                  /* Maximize content box height and width */
                  .tour-modal-body {
                     padding: 0 !important;
                     height: 100% !important;
                     overflow: hidden !important;
                  }
                  /* Final width adjustment to absolute 100% */
                  main[class*="fixed inset-0"] {
                     padding: 0 !important;
                  }
                  .tour-modal-inner {
                     width: 100dvw !important; 
                     max-width: 100dvw !important;
                     margin: 0 !important;
                     border-radius: 0 !important; /* Edge to edge */
                     height: 100dvh !important;
                     max-height: 100dvh !important;
                     border: none !important;
                     display: flex !important;
                     flex-direction: column !important;
                     overflow: hidden !important; 
                  }

                  /* Edge-to-edge content panels */
                  .tour-modal-inner [class*="bg-white/60"],
                  .tour-modal-inner [class*="bg-white/40"],
                  .tour-modal-inner .flex-1.relative.flex.flex-col {
                     border-radius: 0 !important;
                     border-left: none !important;
                     border-right: none !important;
                     padding-left: 14px !important;
                     padding-right: 14px !important;
                     padding-top: 14px !important;
                  }
                   /* Ensure scrollable area has padding for bottom nav (Mobile Stack) */
                   .no-scrollbar {
                      padding-bottom: 0px !important; 
                   }
         `}</style>

      {/* 3. MODAL CONTAINER (Center Floating) */}
         <main
            className="fixed inset-0 z-[80] flex items-center justify-center md:p-[clamp(2px,0.25vh,6px)] p-0"
         >
            <div 
               ref={modalRef}
               className="w-full h-full relative flex flex-col overflow-hidden max-w-[1700px] mx-auto tour-modal-inner md:rounded-2xl rounded-none md:border border-none"
          style={{
            backgroundColor: "rgba(255,255,255,0.5)", 
            backdropFilter: "blur(25px) saturate(150%)",
            WebkitBackdropFilter: "blur(25px) saturate(150%)",
            borderColor: "rgba(255,255,255,0.4)",
            boxShadow: "0 50px 100px -20px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.2)"
          }}
        >
             {/* INTERNAL MODAL HEADER - Only on Desktop now, Mobile uses bottom nav */}
             <div className="w-full pt-4 px-4 lg:px-6 md:flex items-center justify-between relative z-10 shrink-0 pb-3 tour-modal-header hidden">
                 
                 {/* Left Group intentionally minimal on mobile to save vertical space; desktop keeps controls via CSS */}
                 <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2">
                       <button 
                         onClick={() => goBackToLanding(router)}
                         className="w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full text-gray-700 transition-colors"
                         title="Back"
                       >
                         <ArrowLeftIcon className="w-4 h-4" />
                       </button>

                       <button 
                          onClick={() => goBackToLanding(router)}
                          className="flex items-center justify-center w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                          title="Go to 2026 section"
                          aria-label="Go to 2026 section on landing"
                       >
                          <GlobeAltIcon className="w-4 h-4" />
                       </button>
                    </div>

                    <div className="origin-left ml-0.5 hidden md:block">
                       <UserBubble 
                          variant="modalHeader" 
                          buttonClassName="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full text-black transition-colors"
                       />
                    </div>
                 </div>

                 {/* Center Tabs Only (hidden on mobile) */}
                 <div className="absolute left-1/2 top-4 -translate-x-1/2 flex flex-col items-center gap-1 z-50 hidden md:flex">
                    <div className="bg-black/80 p-1 rounded-full backdrop-blur-xl shadow-2xl flex border border-white/10">
                     <button 
                       onClick={() => setActiveTab('itinerary')}
                       className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'itinerary' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                     >
                       Details
                     </button>
                     <button 
                       onClick={() => setActiveTab('reservation')}
                       className={`px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'reservation' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                     >
                       Reservation
                     </button>
                  </div>
                 </div>

                         {/* Right Spacer - mobile user bubble placed here (only visible on mobile) */}
                         <div className="w-[100px] pointer-events-none flex items-center justify-end">
                            <div className="user-mobile-bubble md:hidden pointer-events-auto pr-2">
                               <UserBubble 
                                    variant="modalHeader"
                                    buttonClassName="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full text-black transition-colors"
                               />
                            </div>
                         </div>
             </div>
            {/* MODAL CONTENT */}
            <div className="flex-1 overflow-hidden px-4 lg:px-6 pb-2 lg:pb-3 relative pt-2 tour-modal-body">

               {/* ═══ MOBILE CONTINUOUS SCROLL ═══ */}
               {isMobileDevice && (
                 <div
                   ref={mobileScrollRef}
                   className="md:hidden h-full w-full overflow-y-auto overscroll-contain no-scrollbar scroll-smooth"
                   style={{ WebkitOverflowScrolling: 'touch' }}
                   onScroll={handleItineraryScroll}
                 >
                   {/* Floating "Close Itinerary" tag — visible whenever itinerary is expanded */}
                   {itineraryExpanded && (
                     <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] pointer-events-auto">
                       <button
                         onClick={() => {
                           setItineraryExpanded(false);
                           scrollToMobileSection('itinerary');
                         }}
                         className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                       >
                         <XMarkIcon className="w-3 h-3" />
                         Close Itinerary
                       </button>
                     </div>
                   )}

                   {/* — SUMMARY SECTION — */}
                   <section data-mobile-section="summary" className="min-h-[60vh]">
                     {renderSummaryPanel()}
                   </section>

                   <div className="w-full py-4 flex items-center gap-4 px-6">
                     <div className="flex-1 h-px bg-black/10" />
                   </div>

                   {/* — ITINERARY SECTION — */}
                   <section data-mobile-section="itinerary" className="bg-gray-50/30">
                     {/* Collapsible header — always visible */}
                     <div className="px-4 pt-8 pb-4 flex flex-col items-center gap-3">
                       <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Itinerary</span>
                       <h2 className="text-2xl font-serif font-bold text-gray-900 text-center">{mainTitle}</h2>
                       {!itineraryExpanded ? (
                         <button
                           onClick={() => setItineraryExpanded(true)}
                           className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-transform"
                         >
                           <ChevronDownIcon className="w-3.5 h-3.5" />
                           Expand full itinerary
                         </button>
                       ) : (
                         <button
                           onClick={() => setItineraryExpanded(false)}
                           className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-transform"
                         >
                           <ChevronDownIcon className="w-3.5 h-3.5 rotate-180" />
                           Collapse itinerary
                         </button>
                       )}
                     </div>

                     {/* Day-by-day: first 2 always visible, rest gated by itineraryExpanded */}
                     {tourDays.flatMap((d: any, idx: number) => {
                       // Only show first 2 days unless expanded
                       if (idx >= 2 && !itineraryExpanded) return [];
                       const dMorning = typeof d?.activities_data?.morning === 'string' ? d.activities_data.morning : d?.activities_data?.morning?.text || '';
                       const dAfternoon = typeof d?.activities_data?.afternoon === 'string' ? d.activities_data.afternoon : d?.activities_data?.afternoon?.text || '';
                       const descCandidate = (d.day_description || d.activities_data?.description || '').toString();
                       const stopsCandidate = (d.stops_data?.stop_description || '').toString();
                       const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                       const firstSentence = (s: string) => {
                         if (!s) return '';
                         const clean = stripHtml(s);
                         const match = clean.match(/^(.*?[\.\?!])(?:\s|$)/);
                         if (match && match[1]) return match[1].trim();
                         const byLine = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                         if (byLine.length > 0) return byLine[0];
                         let snippet = clean.slice(0, 120).trim();
                         const lastSpace = snippet.lastIndexOf(' ');
                         if (lastSpace > 40) snippet = snippet.slice(0, lastSpace);
                         return snippet;
                       };
                       let subtitle = firstSentence(dMorning) || firstSentence(descCandidate) || firstSentence(dAfternoon) || firstSentence(stopsCandidate) || '';
                       const explicitTitle = (d.day_title || d.stops_data?.stop_name || '').toString().trim();
                       if (explicitTitle && !new RegExp(`^Day\\s*${d.day_number}\\b`, 'i').test(explicitTitle)) {
                         if (!subtitle) subtitle = explicitTitle;
                       }
                       subtitle = subtitle.replace(new RegExp(`^Day\\s*${d.day_number}\\b[:\\-\\s]*`, 'i'), '').trim().replace(/\s+/g, ' ').trim();

                       const dayMedia = Array.isArray(itineraryMedia[d.day_number - 1])
                         ? itineraryMedia[d.day_number - 1].map((m: any) => ({ type: 'image', src: m.src, folder: m.folder, place: m.place }))
                         : [];
                       const isExpanded = expandedDayId === d.day_number;

                       const dayElement = (
                         <div key={`m-day-${d.day_number}`} className="flex flex-col relative w-full bg-white">
                           <div className="bg-white px-5 pt-5 pb-2 z-30" onClick={() => setExpandedDayId(isExpanded ? null : d.day_number)}>
                             <div className="flex flex-col items-center gap-0">
                               <div className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-1">
                                 <span>Day {d.day_number}</span>
                                 <span className="w-1.5 h-1.5 border border-gray-300 rounded-full" />
                                 <span>{format(addDays(parseISO(start_date), d.day_number - 1), 'MMM dd')}</span>
                               </div>
                               <h2 className="text-[20px] font-serif font-medium text-gray-900 leading-[1.15] tracking-tighter w-full text-center px-2">
                                 {subtitle}
                               </h2>
                               <div className="py-3 flex items-center gap-1.5 text-black text-[12px] font-bold uppercase tracking-[0.25em]">
                                 <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                                 <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 animate-minimal-bounce ${isExpanded ? 'rotate-180' : ''}`} />
                               </div>
                             </div>
                           </div>
                           <div className={`px-5 pt-0 flex flex-col items-center ${isExpanded ? 'pb-10' : 'pb-24 border-b border-gray-100'}`}>
                             {!isExpanded && (
                               <div className="w-11/12 relative overflow-hidden rounded-3xl bg-gray-100 shadow-sm border border-black/5 mx-auto mt-6 mb-6" style={{ aspectRatio: '16/9' }}>
                                 {dayMedia.length > 0 ? (
                                   <>
                                     <SmartSlideshow daySpecificMedia={dayMedia} basePath="Open Tours/MADRID TO LISBOA" className="w-full h-full object-cover object-center" disableZoom={false} />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                   </>
                                 ) : (
                                   <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50 rounded-2xl">
                                     <CameraIcon className="w-12 h-12 opacity-50 mb-4" />
                                     <span className="text-[10px] uppercase tracking-widest font-bold">No Media Available</span>
                                   </div>
                                 )}
                               </div>
                             )}
                             <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0 invisible'}`}>
                               <div className="space-y-6">
                                 {dMorning && (
                                   <div>
                                     <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-1 flex items-center gap-2"><SunIcon className="w-3.5 h-3.5" /> Morning</h4>
                                     <p className="text-[15px] text-gray-700 leading-relaxed font-serif whitespace-pre-line">{dMorning}</p>
                                   </div>
                                 )}
                                 {dAfternoon && (
                                   <div className="pb-6">
                                     <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-2 flex items-center gap-2"><MoonIcon className="w-3.5 h-3.5" /> Afternoon</h4>
                                     <p className="text-[15px] text-gray-700 leading-relaxed font-serif whitespace-pre-line">{dAfternoon}</p>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         </div>
                       );

                       if (d.day_number > 0 && d.day_number % 3 === 0) {
                         return [
                           dayElement,
                           <div key={`m-cta-${d.day_number}`} className="w-full px-5 py-6 bg-gray-50/50 border-y border-gray-100 flex flex-col items-center justify-center gap-3">
                             <div className="flex items-center gap-3 w-full max-w-[340px]">
                               <button onClick={handleBrochureClick} className="flex-1 bg-white border border-gray-200 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm transition-all hover:bg-gray-50 active:scale-95">
                                 Download Brochure
                               </button>
                               <button onClick={() => scrollToMobileSection('reservation')} className="flex-1 bg-black text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-gray-900 active:scale-95">
                                 Book Now
                               </button>
                             </div>
                           </div>
                         ];
                       }
                       // After day 2, when collapsed, show a second "Expand full itinerary" button
                       if (idx === 1 && !itineraryExpanded) {
                         return [
                           dayElement,
                           <div key="m-expand-inline" className="w-full px-5 py-8 flex flex-col items-center gap-3 bg-gray-50/50 border-b border-gray-100">
                             <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold text-center">
                               + {tourDays.length - 2} more days
                             </p>
                             <button
                               onClick={() => setItineraryExpanded(true)}
                               className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[11px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-transform"
                             >
                               <ChevronDownIcon className="w-3.5 h-3.5" />
                               Expand full itinerary
                             </button>
                           </div>
                         ];
                       }
                       return [dayElement];
                     })}
                   </section>

                   <div className="w-full py-4 flex items-center gap-4 px-6">
                     <div className="flex-1 h-px bg-black/10" />
                   </div>

                   {/* — EXTENSIONS SECTION — */}
                   <section data-mobile-section="extensions" className="bg-white px-4 py-12">
                     <h3 className="text-2xl font-serif font-bold text-gray-900 mb-1 text-center">Tailor Your Journey</h3>
                     <p className="text-xs text-gray-500 uppercase tracking-tighter mb-6 text-center border-b pb-2">Extensions, insurance &amp; flights</p>
                     <div className="space-y-6">
                       {/* Extensions list */}
                       <div>
                         <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black mb-3">
                           <PuzzlePieceIcon className="w-4 h-4" /> Optional Extensions
                         </h4>
                         {(() => {
                           let exts: any[] = [];
                           try { exts = typeof initialData?.related_tours === 'string' ? JSON.parse(initialData.related_tours) : initialData?.related_tours || []; } catch { exts = []; }
                           if (exts.length === 0) return <p className="text-xs italic text-gray-400 p-4 border rounded-xl">No extensions available.</p>;
                           return (
                             <div className="grid grid-cols-1 gap-3">
                               {exts.map((ex: any, i: number) => {
                                 const key = `ext:${ex.id || ex.key}`;
                                 return (
                                   <label key={i} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedOptionals[key] ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}>
                                     <input type="checkbox" checked={!!selectedOptionals[key]} onChange={() => setSelectedOptionals(s => ({...s, [key]: !s[key]}))} className="mt-1 w-5 h-5 text-black border-gray-300 rounded focus:ring-black" />
                                     <div className="flex-1">
                                       <div className="flex justify-between"><span className="font-bold text-sm text-gray-900">{ex.title || ex.name}</span><span className="font-mono text-xs font-bold">€{(ex.price_per_day || 250) * (ex.days || 3)}</span></div>
                                       <p className="text-[11px] text-gray-500 mt-1">+{ex.days || 3} days • €{ex.price_per_day || 250}/day</p>
                                     </div>
                                   </label>
                                 );
                               })}
                             </div>
                           );
                         })()}
                       </div>
                       {/* Insurance */}
                       <div>
                         <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black mb-3">
                           <ShieldCheckIcon className="w-4 h-4" /> Insurance Options
                         </h4>
                         <div className="grid grid-cols-1 gap-3">
                           {[
                             { key: 'insHealth', label: tourData.insuranceOptions?.health || 'Global Health Hub (Premium)', price: 100 },
                             { key: 'insCancel', label: tourData.insuranceOptions?.cancellation || 'Full Cancellation Protection', price: 120 }
                           ].map((ins) => (
                             <label key={ins.key} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedOptionals[ins.key] ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'}`}>
                               <input type="checkbox" checked={!!selectedOptionals[ins.key]} onChange={() => setSelectedOptionals(s => ({...s, [ins.key]: !s[ins.key]}))} className="mt-1 w-5 h-5 text-black border-gray-300 rounded focus:ring-black" />
                               <div className="flex-1 flex justify-between"><span className="font-bold text-sm text-gray-900">{ins.label}</span><span className="text-xs font-bold">€{ins.price}</span></div>
                             </label>
                           ))}
                         </div>
                       </div>
                     </div>
                   </section>

                   <div className="w-full py-4 flex items-center gap-4 px-6">
                     <div className="flex-1 h-px bg-black/10" />
                   </div>

                   {/* — RESERVATION SECTION — */}
                   <section data-mobile-section="reservation" className="min-h-[80vh]">
                     <div className="px-4 pt-10 pb-4 text-center">
                       <h2 className="text-3xl font-serif font-bold text-slate-900 leading-tight">Secure Your Spot</h2>
                       <p className="text-sm text-slate-400 font-serif italic mt-2">Book your lifetime experience today</p>
                     </div>
                     <div style={{ overflow: 'visible' }}>
                       <ReservationTab tourData={tourData} preSelectedOptionals={selectedOptionals} noInternalScroll />
                     </div>
                   </section>

                   {/* Bottom spacer for navbar */}
                   <div className="h-20" />
                 </div>
               )}

               {/* Mobile scroll-to-top button */}
               {showMobileScrollTop && (
                 <button
                   onClick={() => mobileScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                   className="fixed bottom-24 right-4 z-[130] md:hidden bg-slate-900 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl text-sm font-bold transition-all duration-300 active:scale-95"
                   aria-label="Scroll to top"
                 >↑</button>
               )}

               {/* ═══ DESKTOP LAYOUT (unchanged) ═══ */}
               <div className="hidden md:block h-full">
               {activeTab === "itinerary" ? (
                   <div className="h-full w-full overflow-hidden">
                      {/* --- THE 2x2 DASHBOARD GRID --- */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full gap-4">
                        
                         {/* LEFT COLUMN: Consolidate Calendar + Details */}
                         <div className="h-full min-h-0 relative flex flex-col pt-0">
                            {/* Left Column Container */}
                            <div className="flex-1 relative flex flex-col bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden shadow-sm h-full">
                            
                            {/* PERSISTENT DESKTOP BOTTOM NAVIGATION - Overlaid */}
                            <div className="hidden md:block absolute bottom-2 left-2 right-2 z-[60]">
                               <div className="grid grid-cols-4 gap-2 bg-white/20 backdrop-blur-xl p-1.5 rounded-2xl border border-white/30 shadow-2xl">
                                 <button 
                                    onClick={() => {
                                        setViewMode('SUMMARY');
                                        setRightPanelContent('MEDIA');
                                        setActiveTab('itinerary');
                                        setSummaryExpanded(false); // Reset to collapsed view
                                    }} 
                                    className={`py-3 flex flex-col items-center justify-center gap-1 transition-all rounded-xl
                                       ${viewMode === 'SUMMARY' && activeTab === 'itinerary' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}
                                    `}
                                 >
                                    <DocumentTextIcon className={`w-5 h-5`} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Summary</span>
                                 </button>

                                 {/* 3. ITINERARY */}
                                 <button 
                                    onClick={() => {
                                        setViewMode('ITINERARY');
                                        setRightPanelContent('MEDIA');
                                        setActiveTab('itinerary');
                                    }} 
                                    className={`py-3 flex flex-col items-center justify-center gap-1 transition-all rounded-xl
                                       ${viewMode === 'ITINERARY' && activeTab === 'itinerary' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}
                                    `}
                                 >
                                    <CalendarDaysIcon className={`w-5 h-5`} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Itinerary</span>
                                 </button>

                                 {/* 4. EXTEND */}
                                 <button 
                                    onClick={() => {
                                       setRightPanelContent('EXTENSIONS');
                                       setViewMode('EXTENSIONS'); // Force ViewMode change for visibility
                                       setActiveTab('itinerary');
                                    }}
                                    className={`py-3 flex flex-col items-center justify-center gap-1 transition-all rounded-xl
                                       ${(rightPanelContent === 'EXTENSIONS' || viewMode === 'EXTENSIONS') && activeTab === 'itinerary' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}
                                    `}
                                 >
                                    <MapIcon className={`w-5 h-5`} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Extend</span>
                                 </button>

                                 {/* 5. PDF */}
                                 <button 
                                    onClick={handleBrochureClick}
                                    disabled={downloadStatus === 'loading' || downloadStatus === 'success'}
                                    className="py-3 flex flex-col items-center justify-center gap-1 transition-all rounded-xl text-gray-400 hover:text-black"
                                 >
                                    {downloadStatus === 'loading' ? (
                                       <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"/>
                                    ) : (
                                       <DocumentArrowDownIcon className="w-5 h-5" />
                                    )}
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-center px-1">Download Brochure</span>
                                 </button>
                               </div>
                            </div>

                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                               {viewMode === 'ITINERARY' ? (
                                   <div className="h-full flex flex-col">
                                      {/* Content Area - No Scroll */}
                                      <div className="p-0 md:p-6 relative flex-1 flex flex-col justify-center overflow-hidden">
                                           {(() => {
                                          /* DESKTOP VIEW LOGICS */
                                          const day = tourDays.find((d:any) => d.day_number === selectedDay);
                                          const detailText = day?.day_description || day?.activities_data?.description || '';
                                          const morningText = typeof day?.activities_data?.morning === 'string' 
                                             ? day.activities_data.morning 
                                             : day?.activities_data?.morning?.text || day?.activities_data?.morning?.title || '';
                                          const afternoonText = typeof day?.activities_data?.afternoon === 'string' 
                                             ? day.activities_data.afternoon 
                                             : day?.activities_data?.afternoon?.text || day?.activities_data?.afternoon?.title || '';

                                          return (
                                            <>
                                            {/* --- MOBILE CONTINUOUS SCROLL --- */}
                                            <div 
                                               onScroll={handleItineraryScroll}
                                               className="md:hidden absolute inset-0 overflow-y-auto no-scrollbar scroll-smooth bg-gray-50/30"
                                               style={{ overscrollBehavior: 'contain', scrollPaddingTop: 0 }}
                                            >
                                                  {tourDays.flatMap((d: any) => {
                                                  const dMorning = typeof d?.activities_data?.morning === 'string' ? d.activities_data.morning : d?.activities_data?.morning?.text || '';
                                                  const dAfternoon = typeof d?.activities_data?.afternoon === 'string' ? d.activities_data.afternoon : d?.activities_data?.afternoon?.text || '';
                                                  
                                                  const descCandidate = (d.day_description || d.activities_data?.description || '').toString();
                                                  const stopsCandidate = (d.stops_data?.stop_description || '').toString();

                                                  const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                                                  const firstSentence = (s: string) => {
                                                     if (!s) return '';
                                                     const clean = stripHtml(s);
                                                     const match = clean.match(/^(.*?[\.\?!])(?:\s|$)/);
                                                     if (match && match[1]) return match[1].trim();
                                                     const byLine = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                                                     if (byLine.length > 0) return byLine[0];
                                                     let snippet = clean.slice(0, 120).trim();
                                                     const lastSpace = snippet.lastIndexOf(' ');
                                                     if (lastSpace > 40) snippet = snippet.slice(0, lastSpace);
                                                     return snippet;
                                                  };

                                                  let subtitle = firstSentence(dMorning) || firstSentence(descCandidate) || firstSentence(dAfternoon) || firstSentence(stopsCandidate) || '';
                                                  const explicitTitle = (d.day_title || d.stops_data?.stop_name || '').toString().trim();
                                                  if (explicitTitle && !new RegExp(`^Day\\s*${d.day_number}\\b`, 'i').test(explicitTitle)) {
                                                     if (!subtitle) subtitle = explicitTitle;
                                                  }
                                                  subtitle = subtitle.replace(new RegExp(`^Day\\s*${d.day_number}\\b[:\\-\\s]*`, 'i'), '').trim();
                                                  subtitle = subtitle.replace(/\s+/g, ' ').trim();

                                                  const dayMedia = Array.isArray(itineraryMedia[d.day_number - 1]) 
                                                     ? itineraryMedia[d.day_number - 1].map((m: any) => ({
                                                         type: 'image',
                                                         src: m.src,
                                                         folder: m.folder,
                                                         place: m.place
                                                       }))
                                                     : [];
                                                  
                                                  const isExpanded = expandedDayId === d.day_number;

                                                  const dayElement = (
                                                     <div key={`day-${d.day_number}`} data-it-day={d.day_number} className={`flex flex-col relative w-full bg-white ${isExpanded ? '' : ''}`}>
                                                        {/* Sticky Day Header with Toggle Arrow */}
                                  <div className="bg-white px-5 pt-5 pb-2 transition-all md:sticky md:top-0 z-30"
                                                             onClick={() => setExpandedDayId(isExpanded ? null : d.day_number)}
                                                        >
                                                            <div className="flex flex-col items-center gap-0">
                                                               {/* Top Line: Day N · Date */}
                                                               <div className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-1">
                                                                  <span>Day {d.day_number}</span>
                                                                  <span className="w-1.5 h-1.5 border border-gray-300 rounded-full" />
                                                                  <span>{format(addDays(parseISO(start_date), d.day_number - 1), 'MMM dd')}</span>
                                                               </div>
                                                               
                                                                                              {/* Middle Line: H2 Subtitle */}
                                                                                              <h2 className="text-[20px] font-serif font-medium text-gray-900 leading-[1.15] tracking-tighter w-full text-center px-2">
                                                                  {subtitle}
                                                               </h2>

                                                               {/* Bottom Line: Expand / Chevron */}
                                                               <div className="py-3 flex items-center gap-1.5 text-black text-[12px] font-bold uppercase tracking-[0.25em]">
                                                                  <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                                                                  <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 animate-minimal-bounce ${isExpanded ? 'rotate-180' : ''}`} />
                                                               </div>
                                                            </div>
                                                        </div>

                                                        {/* CONTENT BLOCK */}
                                                       <div className={`px-5 pt-0 flex flex-col items-center ${isExpanded ? 'pb-10' : 'pb-24 border-b border-gray-100'}`}>
                                                           {/* MEDIA */}
                                                           {!isExpanded && (
                                                              <div className="w-11/12 relative overflow-hidden rounded-3xl bg-gray-100 shadow-sm border border-black/5 mx-auto mt-6 md:mt-8 mb-6" style={{ aspectRatio: '16/9' }}>
                                                                 {dayMedia.length > 0 ? (
                                                                    <>
                                                                     <SmartSlideshow 
                                                                        daySpecificMedia={dayMedia}
                                                                        basePath="Open Tours/MADRID TO LISBOA"
                                                                        className="w-full h-full object-cover object-center"
                                                                        disableZoom={false}
                                                                     />
                                                                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                                                    </>
                                                                 ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50 rounded-2xl">
                                                                       <CameraIcon className="w-12 h-12 opacity-50 mb-4" />
                                                                       <span className="text-[10px] uppercase tracking-widest font-bold">No Media Available</span>
                                                                    </div>
                                                                 )}
                                                              </div>
                                                           )}

                                                           {/* TEXT */}
                                                           <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0 invisible'}`}>
                                                               <div className="space-y-6">
                                                                  {dMorning && (
                                                                     <div>
                                                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-1 flex items-center gap-2">
                                                                           <SunIcon className="w-3.5 h-3.5" /> Morning
                                                                        </h4>
                                                                        <p className="text-[15px] text-gray-700 leading-relaxed font-serif whitespace-pre-line">
                                                                           {dMorning}
                                                                        </p>
                                                                     </div>
                                                                  )}
                                                                  {dAfternoon && (
                                                                     <div className="pb-6">
                                                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-2 flex items-center gap-2">
                                                                           <MoonIcon className="w-3.5 h-3.5" /> Afternoon
                                                                        </h4>
                                                                        <p className="text-[15px] text-gray-700 leading-relaxed font-serif whitespace-pre-line">
                                                                           {dAfternoon}
                                                                        </p>
                                                                     </div>
                                                                  )}
                                                               </div>
                                                           </div>
                                                        </div>
                                                     </div>
                                                  );

                                                  if (d.day_number > 0 && d.day_number % 3 === 0) {
                                                     return [
                                                        dayElement,
                                          <div key={`cta-${d.day_number}`} className="w-full px-5 py-6 bg-gray-50/50 border-y border-gray-100 flex flex-col items-center justify-center gap-3">
                                             <div className="flex items-center gap-3 w-full max-w-[340px]">
                                                <button 
                                                   onClick={handleBrochureClick}
                                                   className="flex-1 bg-white border border-gray-200 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                                                >
                                                   Download Brochure
                                                </button>
                                                <button 
                                                   onClick={() => setActiveTab('reservation')}
                                                   className="flex-1 bg-black text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-gray-900 active:scale-95"
                                                >
                                                   Book Now
                                                </button>
                                             </div>
                                          </div>
                                                     ];
                                                  }
                                                  
                                                  return [dayElement];
                                               })}
                                            </div>
                                            {/* --- DESKTOP VIEW --- */}
                                            <div className="hidden md:flex flex-col max-w-4xl mx-auto w-full h-full overflow-hidden md:justify-center relative">
                                                
                                                {/* Day Navigation Strip */}
                                                <div className="shrink-0 mb-3 flex items-center gap-1 overflow-visible py-1">
                                                   <button
                                                      type="button"
                                                      onClick={() => setSelectedDay(Math.max(1, selectedDay - 1))}
                                                      disabled={selectedDay <= 1}
                                                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-white/60 transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                                                      aria-label="Previous day"
                                                   >
                                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                                   </button>
                                                   <div className="flex-1 overflow-x-auto overflow-y-visible no-scrollbar">
                                                      <div className="flex gap-1 justify-center py-0.5">
                                                         {tourDays.map((d: any) => {
                                                            const isActive = selectedDay === d.day_number;
                                                            return (
                                                               <button
                                                                  key={d.day_number}
                                                                  type="button"
                                                                  onClick={() => setSelectedDay(d.day_number)}
                                                                  className={`w-8 h-8 rounded-full text-[11px] font-bold transition-all whitespace-nowrap flex items-center justify-center ${
                                                                     isActive
                                                                        ? 'bg-black text-white shadow-md'
                                                                        : 'text-gray-400 hover:text-gray-900 hover:bg-white/60'
                                                                  }`}
                                                               >
                                                                  {d.day_number}
                                                               </button>
                                                            );
                                                         })}
                                                      </div>
                                                   </div>
                                                   <button
                                                      type="button"
                                                      onClick={() => setSelectedDay(Math.min(tourDays.length, selectedDay + 1))}
                                                      disabled={selectedDay >= tourDays.length}
                                                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-white/60 transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                                                      aria-label="Next day"
                                                   >
                                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                   </button>
                                                </div>

                                                {/* Desktop Header (Day N + Summary) */}
                                                <div className="mb-4 shrink-0 text-center">
                                                   <span className="text-xl font-bold uppercase tracking-[0.25em] text-gray-400 block mb-2">
                                                      Day {selectedDay}
                                                   </span>
                                                   {detailText && (
                                                      <h2 className="text-2xl md:text-4xl font-serif font-medium text-gray-900 leading-tight tracking-tighter text-center max-w-2xl mx-auto">
                                                         {detailText}
                                                      </h2>
                                                   )}
                                                </div>
                                                
                                                {/* STACKED CONTENT (Mobile) or ROW CONTENT (Desktop) */}
                                                <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-4 md:min-h-0 px-4 md:px-0">
                                                   
                                                   {/* 1. MORNING (Stuck to Day N on mobile) */}
                                                   <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-md rounded-xl p-4 md:p-4 border border-white/50 shadow-sm transition-all hover:shadow-md">
                                                      <div className="flex items-center gap-2 mb-2 border-b border-gray-200/50 pb-2 shrink-0">
                                                         <SunIcon className="w-5 h-5 text-orange-400" />
                                                         <span className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Morning</span>
                                                      </div>
                                                      <div className="text-base md:text-lg text-gray-800 leading-relaxed font-serif">
                                                         {morningText ? (
                                                            morningText.split('\n').map((line: string, i: number) => line.trim() ? (
                                                               <p key={i} className="mb-2 last:mb-0">{line}</p>
                                                            ) : null)
                                                         ) : (
                                                            <p className="text-gray-400 italic text-sm mt-2">Free time for leisure.</p>
                                                         )}
                                                      </div>
                                                   </div>

                                                   {/* 2. DYNAMIC MEDIA BOX (Mobile Only - Between Morning and Afternoon) */}
                                                   <div className="md:hidden w-full aspect-[4/3] rounded-xl overflow-hidden relative shadow-lg border border-gray-200 shrink-0 my-2 bg-white">
                                                      {rightPanelContent === 'WEATHER' ? (
                                                         <div className="w-full h-full p-6 animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center text-center">
                                                            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                                                               <SunIcon className="w-10 h-10" />
                                                            </div>
                                                            <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                                                               {weatherInfo ? weatherInfo.split('-')[0].trim() : "Local Weather"}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 whitespace-pre-line">
                                                               {weatherInfo ? weatherInfo.replace(/^[^-]+-\s*/, '') : "Weather information coming soon."}
                                                            </p>
                                                            <button onClick={() => setRightPanelContent('MEDIA')} className="mt-4 text-xs font-bold uppercase tracking-widest text-blue-600">Back to Photos</button>
                                                         </div>
                                                      ) : rightPanelContent === 'FLIGHTS' ? (
                                                         <div className="w-full h-full p-6 animate-in fade-in zoom-in duration-300 flex flex-col overflow-y-auto">
                                                            <div className="flex items-center gap-3 mb-6">
                                                               <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                                  <PaperAirplaneIcon className="w-6 h-6 -rotate-45 ml-1" />
                                                               </div>
                                                               <div>
                                                                  <h3 className="font-serif font-bold text-gray-900">Flights Included</h3>
                                                                  <p className="text-xs text-gray-500">International round-trip</p>
                                                               </div>
                                                            </div>
                                                            <ul className="grid grid-cols-2 gap-2 mb-4">
                                                               {tourData.departureAirports?.map((airport) => (
                                                                  <li key={airport} className="flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-50 px-2 py-2 rounded border border-gray-100">
                                                                    {airport}
                                                                  </li>
                                                               ))}
                                                            </ul>
                                                            <p className="text-xs text-gray-500 italic mt-auto">
                                                               Flight details confirmed 30 days prior. Check documentation for specific hubs.
                                                            </p>
                                                            <button onClick={() => setRightPanelContent('MEDIA')} className="mt-4 text-xs font-bold uppercase tracking-widest text-emerald-600 self-center">Back to Photos</button>
                                                         </div>
                                                      ) : (rightPanelContent === 'PACKAGE' || rightPanelContent === 'EXTENSIONS') ? (
                                                         /* FULL SCREEN OVERLAY FOR MOBILE PACKAGE/EXTENSIONS */
                                                         <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                                                            {rightPanelContent === 'PACKAGE' ? (
                                                               <>
                                                                  {/* Close Button */}
                                                                  <button 
                                                                     onClick={() => setRightPanelContent('MEDIA')}
                                                                     className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all"
                                                                  >
                                                                     <XMarkIcon className="w-6 h-6" />
                                                                  </button>

                                                                  {/* TOP: Visual Image */}
                                                                  <div className="w-full h-40 xl:h-48 relative overflow-hidden shrink-0">
                                                                     <img 
                                                                       src="https://auth.ibero.world/storage/v1/object/public/MISC/IberoPackage.webp" 
                                                                       alt="Ibero Package" 
                                                                       className="absolute inset-0 w-full h-full object-cover"
                                                                     />
                                                                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                                     
                                                                     <h2 className="absolute bottom-6 left-6 text-2xl font-serif font-bold text-white shadow-sm leading-tight">
                                                                        The Ibero<br/>Package
                                                                     </h2>
                                                                  </div>

                                                                  {/* CONTENT SCROLL */}
                                                                  <div className="flex-1 overflow-y-auto p-6 pb-32 bg-white">
                                                                     <p className="text-gray-600 mb-8 text-base leading-relaxed font-serif">
                                                                        Everything you need for a seamless journey, included in one transparent price.
                                                                     </p>
                                                                     
                                                                     <ul className="space-y-4 mb-8">
                                                                        {[
                                                                           "International flights from US Hubs", 
                                                                           "Accommodation in 4-5★ hotels", 
                                                                           "Full-time bilingual tour guide", 
                                                                           "Ground transportation", 
                                                                           "Daily buffet breakfast"
                                                                        ].map((item, i) => (
                                                                           <li key={i} className="flex items-start gap-4">
                                                                              <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
                                                                                 <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                                                                              </div>
                                                                              <span className="leading-tight">{item}</span>
                                                                           </li>
                                                                        ))}
                                                                     </ul>

                                                                     <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-8">
                                                                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 mb-2">Why Certification Matters</h4>
                                                                        <p className="text-xs text-gray-600 leading-relaxed">
                                                                           A certified travel agency offers exclusive perks, expert vetting, and a professional safety net if things go wrong.
                                                                        </p>
                                                                     </div>

                                                                     {/* Cert Footer */}
                                                                     <div className="border-t border-gray-100 pt-6">
                                                                        <p className="font-bold text-black mb-2 text-xs uppercase tracking-wide">
                                                                           Certified Travel Agency Details
                                                                        </p>
                                                                        <div className="space-y-1 text-xs font-medium text-gray-500">
                                                                           <div className="grid grid-cols-2 gap-x-4">
                                                                              <span>NAME: <strong className="text-black">IBERO</strong></span>
                                                                              <span>CIEX: <strong className="text-black">06-00049-Om</strong></span>
                                                                           </div>
                                                                           <div>REG: <strong className="text-black">AV-00661</strong></div>
                                                                           <div className="pt-2 text-gray-600">tours@ibero.world</div>
                                                                           <div className="font-bold text-black">www.ibero.world</div>
                                                                        </div>
                                                                     </div>
                                                                  </div>
                                                                  
                                                                  {/* FLOAT BUTTON */}
                                                                  <div className="absolute bottom-6 left-6 right-6">
                                                                     <button 
                                                                           onClick={() => setRightPanelContent('EXTENSIONS')}
                                                                           className="w-full py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-xl hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                                                                     >
                                                                           <span>Explore Extensions</span>
                                                                           <ChevronRightIcon className="w-4 h-4" />
                                                                     </button>
                                                                  </div>
                                                               </>
                                                            ) : (
                                                               /* EXTENSIONS FULL PANE */
                                                               <OptionalsContent tourData={tourData} onClose={() => setRightPanelContent('MEDIA')} />
                                                            )}
                                                         </div>
                                                      ) : (
                                                         /* Default Gallery */
                                                         <>
                                                            <SmartSlideshow 
                                                               basePath="Open Tours/MADRID TO LISBOA"
                                                               daySpecificMedia={Array.isArray(itineraryMedia[selectedDay - 1])
                                                                   ? itineraryMedia[selectedDay - 1].map((m: any) => ({ type: 'image', src: m.src, folder: m.folder, place: m.place }))
                                                                   : undefined}
                                                               className="w-full h-full object-cover"
                                                               disableZoom={false}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                                                            <div className="absolute top-3 left-4">
                                                               <span className="text-xs font-bold text-white/90 bg-black/40 px-2 py-1 rounded border border-white/20 backdrop-blur-md">
                                                                  Highlights
                                                               </span>
                                                            </div>
                                                         </>
                                                      )}
                                                   </div>

                                                   {/* 3. AFTERNOON */}
                                                   <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-md rounded-xl p-4 md:p-4 border border-white/50 shadow-sm transition-all hover:shadow-md">
                                                         <div className="flex items-center gap-2 mb-2 border-b border-gray-200/50 pb-2 shrink-0">
                                                            <MoonIcon className="w-5 h-5 text-indigo-400" />
                                                            <span className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Afternoon</span>
                                                         </div>
                                                         <div className="text-base md:text-lg text-gray-800 leading-relaxed font-serif">
                                                            {afternoonText ? (
                                                               afternoonText.split('\n').map((line: string, i: number) => line.trim() ? (
                                                                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                                                               ) : null)
                                                            ) : (
                                                               <p className="text-gray-400 italic text-sm mt-2">Free time for leisure.</p>
                                                            )}
                                                         </div>
                                                   </div>

                                                   {/* Safety Spacer for Mobile - Ensures no overlap with bottom bar */}
                                                   <div className="md:hidden h-28 shrink-0" />
                                                </div>
                                            </div>
                                            </>
                                          );
                                      })()}
                                      </div>
                                      
                                      {/* BOTTOM: Fixed Calendar Strip - Hidden on Mobile */}
                                      <div className="hidden md:block mt-auto flex-shrink-0 bg-white/40 border-t border-gray-200/20 p-4 pb-2 z-20 rounded-b-xl">
                                         <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                              {(() => {
                                                 if (!calendarGrid || calendarGrid.length === 0) return "Trip Calendar";
                                                 const validDays = calendarGrid.filter((c: any) => c.status === 'tour');
                                                 if (validDays.length === 0) return "Trip Calendar";
                                                 
                                                 const startMonth = format(validDays[0].date, 'MMMM yyyy').toUpperCase();
                                                 const endMonth = format(validDays[validDays.length - 1].date, 'MMMM yyyy').toUpperCase();
                                                 return startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;
                                              })()}
                                            </h3>
                                         </div>
                                         <div className="overflow-x-auto pb-2 custom-scrollbar -mx-4 px-4">
                                            <div className="grid grid-cols-7 gap-1 min-w-[300px]">
                                              {calendarGrid.map((cell: any, idx: number) => {
                                                const isSelected = cell.status === 'tour' && selectedDay === cell.dayNum;
                                                const isFirstOfMonth = idx === 0 || format(cell.date, 'd') === '1' || (cell.status === 'tour' && cell.dayNum === 1);
                                                const monthLabel = format(cell.date, 'MMM').toUpperCase();

                                                return (
                                                  <button 
                                                    key={idx}
                                                    onClick={() => {
                                                      if (cell.status === 'tour') setSelectedDay(cell.dayNum);
                                                    }}
                                                    disabled={cell.status !== 'tour'}
                                                    className={`h-14 flex flex-col items-center justify-center rounded-lg transition-all relative overflow-hidden group
                                                      ${cell.status === 'tour' 
                                                        ? (isSelected 
                                                            ? 'bg-black text-white border-black shadow-md ring-1 ring-black/20 z-10' 
                                                            : 'bg-white/40 text-gray-900 border-gray-200 hover:border-black hover:bg-white'
                                                          ) 
                                                        : (cell.status === 'empty'
                                                            ? 'opacity-0 pointer-events-none'
                                                            : 'bg-gray-50 text-gray-300 border border-dashed border-gray-200 cursor-not-allowed'
                                                          )
                                                      } border`}
                                                  >
                                                    {cell.status !== 'empty' && (
                                                       <div className="flex flex-col items-center justify-center pt-1">
                                                         {isFirstOfMonth && (
                                                            <span className={`text-[9px] font-bold uppercase tracking-tighter leading-none mb-0.5 ${isSelected ? 'text-white/80' : 'text-black'}`}>
                                                               {monthLabel}
                                                            </span>
                                                         )}
                                                         <span className={`text-xl md:text-2xl font-bold leading-none -tracking-widest ${isFirstOfMonth ? '' : ''}`}>
                                                            {format(cell.date, 'd')}
                                                         </span>
                                                         {(cell.status === 'pre' || cell.status === 'post') && (
                                                            <span className="text-[6px] font-bold uppercase tracking-widest mt-0.5 leading-tight text-center px-0.5 opacity-60">
                                                               {cell.status === 'pre' ? 'PRE' : 'POST'}
                                                            </span>
                                                         )}
                                                         {cell.status === 'tour' && !isFirstOfMonth && (
                                                            <div className={`mt-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-black/20 group-hover:bg-black'}`} />
                                                         )}
                                                       </div>
                                                    )}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                         </div>
                                      </div>

                                   </div>
                               ) : (
                                   <div className="h-full min-h-0 overflow-y-auto md:overflow-hidden" onScroll={handleItineraryScroll}>
                                      {renderSummaryPanel()}
                                   </div>
                               )}
                            </div>
                         </div>
                      </div>
                         {/* RIGHT COLUMN (Vertical Split: Media + Map) OR Full Panel */}
                         <div className={`hidden md:block h-full min-h-0 transition-all duration-300 ${['PACKAGE', 'EXTENSIONS'].includes(rightPanelContent) ? 'flex flex-col' : 'grid grid-rows-2 gap-4'}`}>
                            
                            {/* 1. FULL COLUMN CONTENT (Package / Extensions) */}
                            {['PACKAGE', 'EXTENSIONS'].includes(rightPanelContent) ? (
                               <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300 relative flex flex-col">
                                  
                                  <div className="flex-1 overflow-y-auto p-0 relative">
                                     {rightPanelContent === 'PACKAGE' && (
                                        <div className="flex flex-col h-full bg-white relative">
                                           {/* TOP: Visual Image */}
                                           <div className="w-full h-40 xl:h-48 relative overflow-hidden shrink-0">
                                              <img 
                                                src="https://auth.ibero.world/storage/v1/object/public/MISC/IberoPackage.webp" 
                                                alt="Ibero Package" 
                                                className="absolute inset-0 w-full h-full object-cover"
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                              
                                              <h2 className="absolute bottom-6 left-6 text-2xl font-serif font-bold text-white shadow-sm leading-tight">
                                                The Ibero<br/>Package
                                             </h2>
                                           </div>

                                           {/* BOTTOM: Content */}
                                           <div className="flex-1 px-6 xl:px-8 pt-4 pb-4 flex flex-col relative overflow-hidden">
                                              <div className="flex-1 overflow-y-auto custom-scrollbar">
                                                  <p className="text-gray-600 mb-6 text-sm xl:text-base leading-relaxed">
                                                  Everything you need for a seamless journey, included in one transparent price.
                                                  </p>
                                                  
                                                  <ul className="space-y-4 mb-6">
                                                  {[
                                                      "International flights from US Hubs", 
                                                      "Accommodation in 4-5★ hotels", 
                                                      "Full-time bilingual tour guide", 
                                                      "Ground transportation", 
                                                      "Daily buffet breakfast"
                                                  ].map((item, i) => (
                                                      <li key={i} className="flex items-start gap-3 text-sm text-gray-800">
                                                          <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
                                                          <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                                                          </div>
                                                          <span className="leading-tight">{item}</span>
                                                      </li>
                                                  ))}
                                                  </ul>

                                                  <div className="flex justify-start">
                                                      <button 
                                                          onClick={() => setRightPanelContent('EXTENSIONS')}
                                                          className="group flex items-center gap-2 text-xs font-bold text-gray-900 border border-black/10 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all transform hover:-translate-y-0.5 shadow-sm"
                                                      >
                                                          <span>Explore Optionals</span>
                                                          <ChevronRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                                      </button>
                                                  </div>
                                              </div>

                                              {/* Legal Footer */}
                                              <div className="mt-auto pt-6 border-t border-gray-100 text-xs text-gray-500 font-sans w-full bg-white relative z-10 shrink-0">
                                                 <div className="flex items-center justify-between gap-4 w-full">
                                                     <div className="flex-1 min-w-0">
                                                          <p className="font-bold text-black mb-2 text-xs uppercase tracking-wide">
                                                              Certified Travel Agency Details
                                                          </p>
                                                          <div className="space-y-1 text-xs font-medium text-gray-500">
                                                             <div className="grid grid-cols-2 gap-x-4">
                                                                <span>NAME: <strong className="text-black">IBERO</strong></span>
                                                                <span>CIEX: <strong className="text-black">06-00049-Om</strong></span>
                                                             </div>
                                                             <div>REG: <strong className="text-black">AV-00661</strong></div>
                                                             <div className="pt-2 text-gray-600">tours@ibero.world</div>
                                                             <div className="font-bold text-black">www.ibero.world</div>
                                                          </div>
                                                     </div>
                                                     <div className="text-right shrink-0 text-xs leading-tight flex flex-col items-end gap-1">
                                                          <button 
                                                              onClick={() => setShowLearnMore(!showLearnMore)}
                                                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition-colors text-[10px] uppercase tracking-wide mb-1"
                                                          >
                                                              <InformationCircleIcon className="w-3.5 h-3.5" />
                                                              <span>Learn more about it</span>
                                                          </button>
                                                          
                                                          {/* Popover */}
                                                          {showLearnMore && (
                                                              <div className="absolute right-0 bottom-full mb-2 w-72 bg-gray-900 text-white p-4 rounded-xl shadow-xl z-50 text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2 text-left">
                                                              <h5 className="font-bold mb-2 text-white border-b border-white/20 pb-2">Why Certification Matters</h5>
                                                              <p>
                                                                  A certified travel agency offers exclusive perks, expert vetting, and a professional safety net if things go wrong. You save time, gain consumer protection, and trade "hoping for the best" for guaranteed peace of mind.
                                                              </p>
                                                              <button onClick={() => setShowLearnMore(false)} className="absolute top-2 right-2 text-white/50 hover:text-white">✕</button>
                                                              </div>
                                                          )}

                                                          <div className="block whitespace-nowrap text-gray-400">tours@ibero.world</div>
                                                          <div className="block font-bold text-black whitespace-nowrap">www.ibero.world</div>
                                                     </div>
                                                 </div>
                                              </div>
                                           </div>
                                        </div>
                                     )}

                                     {rightPanelContent === 'EXTENSIONS' && (
                                         <div className="h-full">
                                            <OptionalsContent tourData={tourData} onClose={() => setRightPanelContent('MEDIA')} />
                                         </div>
                                     )}
                                  </div>
                               </div>
                            ) : (
                               /* 2. SPLIT VIEW (Standard or Weather/Flight Overlay) */
                               <div className="hidden md:grid md:grid-rows-2 h-full min-h-[600px] gap-4 transition-all duration-300">
                                  {/* Top Right: Media OR Weather/Flight Panel */}
                                  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200/50 bg-white relative group h-full min-h-0">
                                     {rightPanelContent === 'WEATHER' ? (
                                        <div className="w-full h-full bg-white p-6 animate-in fade-in zoom-in duration-300 overflow-y-auto">
                                           <div className="flex items-center justify-between mb-4">
                                              <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                    <SunIcon className="w-6 h-6" />
                                                 </div>
                                                 <div>
                                                    <h3 className="font-serif font-bold text-gray-900">Local Weather</h3>
                                                    <p className="text-xs text-gray-500">Forecast overview</p>
                                                 </div>
                                              </div>
                                              <button onClick={() => setRightPanelContent('MEDIA')} className="text-gray-400 hover:text-gray-600">
                                                 <ChevronDownIcon className="w-4 h-4" />
                                              </button>
                                           </div>
                                           <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-6">
                                              <p>{weatherInfo || "Weather information coming soon."}</p>
                                           </div>
                                        </div>
                                     ) : rightPanelContent === 'FLIGHTS' ? (
                                        <div className="w-full h-full bg-white p-6 animate-in fade-in zoom-in duration-300 overflow-y-auto">
                                           <div className="flex items-center justify-between mb-4">
                                              <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45 ml-1" />
                                                 </div>
                                                 <div>
                                                    <h3 className="font-serif font-bold text-gray-900">Flights Included</h3>
                                                    <p className="text-xs text-gray-500">International round-trip</p>
                                                 </div>
                                              </div>
                                              <button onClick={() => setRightPanelContent('MEDIA')} className="text-gray-400 hover:text-gray-600">
                                                 <ChevronDownIcon className="w-4 h-4" />
                                              </button>
                                           </div>
                                           <ul className="grid grid-cols-2 gap-2 mb-4">
                                              {tourData.departureAirports?.map((airport) => (
                                                <li key={airport} className="flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-50 px-2 py-2 rounded border border-gray-100">
                                                  {airport}
                                                </li>
                                              ))}
                                           </ul>
                                        </div>
                                     ) : (
                                        /* Default Media Player */
                                        <>
                                            <SmartSlideshow 
                                                basePath="Open Tours/MADRID TO LISBOA"
                                                daySpecificMedia={viewMode === 'ITINERARY' && Array.isArray(itineraryMedia[selectedDay - 1])
                                                    ? itineraryMedia[selectedDay - 1].map((m: any) => ({ type: 'image', src: m.src, folder: m.folder, place: m.place }))
                                                    : undefined}
                                                disableZoom={viewMode === 'ITINERARY'}
                                                className="w-full h-full object-cover"
                                            />
                                           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                                           <div className="absolute bottom-3 left-4">
                                              <span className="text-xs font-bold text-white/90 bg-black/40 px-2 py-1 rounded border border-white/20 backdrop-blur-md">
                                                {viewMode === 'ITINERARY' ? `Day ${selectedDay} Highlights` : 'Tour Highlights'}
                                              </span>
                                           </div>
                                        </>
                                     )}
                                  </div>
                                  {/* Bottom Right: Map (Always visible in Split View) */}
                                   <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200/50 bg-white relative h-full w-full">
                                      <InlineMap 
                                         mode={viewMode === 'ITINERARY' ? 'detailed' : 'overview'}
                                         points={mapPoints}
                                         route={{
                                           geojson: initialData?.routeGeoJson,
                                           color: '#3b82f6'
                                         }}
                                         activeDay={viewMode === 'ITINERARY' ? selectedDay : null}
                                         className="w-full h-full"
                                         fit="auto"
                                      />
                                  </div>
                               </div>
                            )}
                         </div>
                         {/* END OF MAIN CONTENT GRID */}
                         </div>
                   </div>
                ) : (
                   <div className="h-full w-full overflow-hidden">
                      <div className="h-full w-full">
                         <ReservationTab tourData={tourData} preSelectedOptionals={selectedOptionals} />
                      </div>
                   </div>
                )}
             </div>{/* end hidden md:block */}
             </div>{/* end tour-modal-body */}
             
             {/* PERSISTENT BOTTOM NAVIGATION - NOW SHARED ACROSS ALL TABS */}
             <div className={`shrink-0 z-50 md:hidden w-full bg-[#fcfcfc] border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[max(env(safe-area-inset-bottom),0.5rem)] transition-all duration-500 ease-in-out ${isBottomNavVisible ? 'max-h-32 opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-full overflow-hidden'}`}>
                <div 
                  className="relative w-full px-2" 
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', width: '100%' }}
                >
                  {/* DYNAMIC SLIDING UNDERLINE (Top-aligned) — driven by scroll position */}
                  <div 
                     className="absolute top-0 h-[2px] bg-black transition-all duration-300 ease-in-out z-20"
                     style={{ 
                        width: '18%', 
                        left: (() => {
                           if (mobileActiveSection === 'summary') return '22%';
                           if (mobileActiveSection === 'itinerary') return '42%';
                           if (mobileActiveSection === 'extensions') return '62%';
                           if (mobileActiveSection === 'reservation') return '-100%';
                           return '-100%';
                        })(),
                        opacity: mobileActiveSection !== 'reservation' ? 1 : 0
                     }}
                  />

                  {/* 1. BACK */}
                  <button 
                     onClick={() => goBackToLanding(router)}
                     className="py-1.5 flex flex-col items-center justify-center gap-1 transition-all text-gray-400 hover:text-black"
                     style={{ flex: 1, minWidth: 0, display: 'flex' }}
                  >
                     <ArrowLeftIcon className={`w-4 h-4`} />
                     <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Back</span>
                  </button>

                  {/* 2. SUMMARY */}
                  <button 
                     onClick={() => scrollToMobileSection('summary')} 
                     className={`py-1.5 flex flex-col items-center justify-center gap-1 transition-all
                        ${mobileActiveSection === 'summary' ? 'text-black font-bold' : 'text-gray-400 hover:text-black'}
                     `}
                     style={{ flex: 1, minWidth: 0, display: 'flex' }}
                  >
                     <DocumentTextIcon className={`w-4 h-4`} />
                     <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Summary</span>
                  </button>

                  {/* 3. ITINERARY */}
                  <button 
                     onClick={() => scrollToMobileSection('itinerary')} 
                     className={`py-1.5 flex flex-col items-center justify-center gap-1 transition-all
                        ${mobileActiveSection === 'itinerary' ? 'text-black font-bold' : 'text-gray-400 hover:text-black'}
                     `}
                     style={{ flex: 1, minWidth: 0, display: 'flex' }}
                  >
                     <CalendarDaysIcon className={`w-4 h-4`} />
                     <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Itinerary</span>
                  </button>

                  {/* 4. EXTEND */}
                  <button 
                     onClick={() => scrollToMobileSection('extensions')}
                     className={`py-1.5 flex flex-col items-center justify-center gap-1 transition-all
                        ${mobileActiveSection === 'extensions' ? 'text-black font-bold' : 'text-gray-400 hover:text-black'}
                     `}
                     style={{ flex: 1, minWidth: 0, display: 'flex' }}
                  >
                     <MapIcon className={`w-4 h-4`} />
                     <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Extend</span>
                  </button>

                  {/* 5. PDF */}
                  <button 
                     onClick={handleBrochureClick}
                     disabled={downloadStatus === 'loading' || downloadStatus === 'success'}
                     className="py-1.5 flex flex-col items-center justify-center gap-1 transition-all text-gray-400 hover:text-black"
                     style={{ flex: 1, minWidth: 0, display: 'flex' }}
                  >
                     {downloadStatus === 'loading' ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"/>
                     ) : (
                        <DocumentArrowDownIcon className="w-4 h-4" />
                     )}
                     <span className="text-[8px] font-bold uppercase tracking-widest leading-none text-center px-1">Download Brochure</span>
                  </button>
                </div>
             </div>

             {/* Bottom Nav Re-opener Arrow (Mobile Itinerary) */}
             {!isBottomNavVisible && viewMode === 'ITINERARY' && (
                <div 
                   onClick={() => setIsBottomNavVisible(true)}
                   role="button"
                   aria-label="Show navigation"
                   className="fixed bottom-6 z-50 p-1 bg-transparent cursor-pointer animate-minimal-bounce text-black transition-colors"
                   style={{ left: '48vw', transform: 'translateX(-50%)' }}
                >
                   <ChevronUpIcon className="w-8 h-8 pointer-events-none" />
                </div>
             )}
             
             {/* FLOATING SIDE BUTTON FOR RESERVATION (MOBILE) */}
             {mobileActiveSection !== 'reservation' && (
                <button 
                   onClick={() => scrollToMobileSection('reservation')}
                   className="md:hidden floating-reserve-btn"
                   aria-label="Reserve"
                >
                   <span className="reserve-label">Reservation</span>
                   <span className="chev-btm" aria-hidden>
                      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
                   </span>
                </button>
             )}
        </div>
      </main>
    </div>
  );
}
