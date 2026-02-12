// TourClient.tsx: Restores the Glass Modal Shell + Injects 2x2 Dashboard Logic

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/db/supabaseClient";
import InlineMap, { type MapPoint } from "../../components/InlineMap";
import { format, differenceInDays, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from 'date-fns';
import SmartSlideshow from "./components/SmartSlideshow";
import { ChevronRightIcon, GlobeAltIcon, CalendarDaysIcon, MapIcon, HomeIcon, ChevronLeftIcon, ArrowLeftIcon, SunIcon, MoonIcon, ChevronDownIcon, ChevronUpIcon, PlayCircleIcon, CheckIcon, DocumentTextIcon, ShieldCheckIcon, PaperAirplaneIcon, PuzzlePieceIcon, ClockIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import UserBubble from '@/components/UserBubble';
import ReservationTab, { TourData } from "../../components/reservation/ReservationTab";
import { publishLandingScrollTo, subscribeTourOpenReservation } from "../../lib/navigation/intents";
import { safeWebPath, normalizeUrl, tryImageFallback } from "./utils/media";
import mediaUrl from '@/lib/media/mediaUrl';

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

// Icons
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
  const [itineraryMedia, setItineraryMedia] = useState<string[]>([]);
  const [showLearnMore, setShowLearnMore] = useState(false); // Restored state for Ibero Package footer

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
  } = initialData || {};

  const [mainTitle, subTitle] = useMemo(() => (title || "").split('\n'), [title]);

  const daysCount = useMemo(() => {
    if (!start_date || !end_date) return 0;
    try { return differenceInDays(parseISO(end_date), parseISO(start_date)) + 1; } catch { return 0; }
  }, [start_date, end_date]);

  // Fetch Itinerary Media from Supabase folder "stops"
  useEffect(() => {
    async function fetchItineraryMedia() {
      // Use DB stops_path if available
      const path = stops_path || "Open Tours/MADRID TO LISBOA/MAIN TOUR/stops";
      if (!path) return;

      try {
        const res = await fetch(`/api/media/list?path=${encodeURIComponent(path)}`);
        if (res.ok) {
          const json = await res.json();
          const files = json.files || [];
          // Sort alphabetically to ensure Day 1 uses first photo, Day 2 second, etc.
          const sortedImgs = files
             .filter((f: any) => /\.(jpg|jpeg|png|webp|avif)$/i.test(f.filename || f.path))
             .sort((a: any, b: any) => (a.filename || "").localeCompare(b.filename || "", undefined, { numeric: true }))
             .map((f: any) => ({
                path: f.path,
                day: parseInt((f.filename || "").match(/\d+/)?.[0] || "0")
             }));
          
          // Map each day index to its corresponding image path
          const mediaByDay: string[] = [];
          sortedImgs.forEach((img: any) => {
            if (img.day > 0) {
              mediaByDay[img.day - 1] = img.path;
            }
          });
          setItineraryMedia(mediaByDay);
        }
      } catch (err) {
        console.error("Failed to fetch itinerary media", err);
      }
    }
    fetchItineraryMedia();
  }, [stops_path]);

  // Auto-advance Days effect (every 9 seconds)
  // Reset timer whenever selectedDay changes manually or automatically
  useEffect(() => {
    if (viewMode !== 'ITINERARY') return;
    const interval = setInterval(() => {
      setSelectedDay(prev => (prev >= daysCount ? 1 : prev + 1));
    }, 9000);
    return () => clearInterval(interval);
  }, [viewMode, daysCount, selectedDay]);

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
  const heroSrc = initialData?.card_image || 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Tours/Open Tours/MADRID TO LISBOA/MAIN TOUR/hero.webp';

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
    disclaimer: "The itinerary shown reflects planned activities prior to reservations."
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
      alert("Please sign in to download the brochure.");
      return;
    }
      const pdfUrl = initialData?.pdf_url || "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/pdf-prueba/Forgotten%20Iberia.pdf";
      const proxyUrl = `/api/download-brochure?url=${encodeURIComponent(pdfUrl)}`;
      // Try to fetch the PDF via internal proxy and trigger a download without opening a new tab
      (async () => {
         try {
            setDownloadStatus('loading');
            const res = await fetch(proxyUrl, { method: 'GET' });
            if (!res.ok) throw new Error('Failed to fetch brochure via proxy');
            const blob = await res.blob();

            // Derive a filename from the proxy response header or from original URL
            const contentDisposition = res.headers.get('content-disposition') || '';
            let filename = '';
            const match = /filename\*?=\s*(?:UTF-8'')?"?([^";]+)/i.exec(contentDisposition);
            if (match && match[1]) filename = match[1];
            if (!filename) {
               const urlParts = (pdfUrl || '').split('/');
               filename = urlParts[urlParts.length - 1] || 'brochure.pdf';
               try { filename = decodeURIComponent(filename); } catch (e) { /* ignore */ }
            }

            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
               try { document.body.removeChild(a); } catch (e) {}
               URL.revokeObjectURL(objectUrl);
            }, 1500);

            setDownloadStatus('success');
            } catch (err) {
               console.error('Brochure download via proxy failed', err);
                     // Fallback: create a hidden iframe to the proxy URL to trigger a download
                     try {
                        console.log('Attempting iframe fallback to proxy URL', proxyUrl);
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = proxyUrl;
                        document.body.appendChild(iframe);
                        // Remove iframe after a short while
                        setTimeout(() => { try { document.body.removeChild(iframe); } catch(e){} }, 5000);
                        setDownloadStatus('idle');
                        return;
                     } catch (e) {
                        console.error('Iframe fallback failed', e);
                     }

               // Last resort: open in new tab (user will be taken there) -- rarely used
               try {
                  window.open(pdfUrl, '_blank', 'noopener,noreferrer');
               } catch (e) {
                  console.error('Final fallback open failed', e);
               }
               setDownloadStatus('idle');
            }
      })();
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
    return (
       <div className="h-full bg-white/60 p-5 lg:p-6 rounded-xl flex flex-col backdrop-blur-sm border border-white/50 shadow-sm relative overflow-hidden">
           {/* Header Section: Compact & Impactful */}
           <div className="flex-shrink-0 mb-3 border-b border-gray-200/50 pb-3">
              <div className="flex items-start justify-between gap-4">
                  {/* LEFT: Title + Subtitle */}
                  <div className="flex flex-col gap-1 max-w-[70%]">
                      <h1 className="text-3xl md:text-3xl lg:text-4xl font-serif text-gray-900 leading-[0.9] -tracking-wide">
                        {mainTitle}
                      </h1>
                       {subTitle && (
                        <p className="text-sm md:text-base text-gray-500 font-serif italic leading-tight">
                          {subTitle}
                        </p>
                      )}
                  </div>
                  
                  {/* RIGHT: Weather & Package */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                       {/* Weather Button */}
                       <button 
                          onClick={() => setRightPanelContent(rightPanelContent === 'WEATHER' ? 'MEDIA' : 'WEATHER')}
                          className={`px-2 py-1 flex items-center gap-1 rounded-full border transition-all shadow-sm ${rightPanelContent === 'WEATHER' ? 'bg-black text-white border-black' : 'bg-white/60 text-gray-600 border-gray-200 hover:bg-white hover:border-gray-400'}`}
                          title="Weather Info"
                       >
                          <WeatherStatusIcon />
                          <ChevronDownIcon className="w-3 h-3 stroke-2" />
                       </button>
                       {/* Ibero Package Dropdown */}
                       <button 
                          onClick={() => setRightPanelContent(rightPanelContent === 'PACKAGE' ? 'MEDIA' : 'PACKAGE')}
                          className={`px-3 py-1 border rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-sm ${rightPanelContent === 'PACKAGE' ? 'bg-black text-white border-black' : 'bg-white/60 text-gray-700 border-gray-200 hover:bg-white hover:border-gray-400'}`}
                       >
                          <span>Ibero Package</span>
                          <ChevronDownIcon className="w-3 h-3 stroke-2" />
                       </button>
                  </div>
              </div>

              {/* Tag Row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-gray-900 mt-3 pt-1">
                 <button 
                    onClick={handleItineraryClick}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/50 rounded-full border border-gray-100 hover:border-black/30 hover:bg-white transition-all group"
                 >
                    <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-black" />
                    <span className="group-hover:text-black">{dateRangeStr}</span>
                 </button>
                 <button 
                    onClick={handleItineraryClick}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/50 rounded-full border border-gray-100 hover:border-black/30 hover:bg-white transition-all group"
                 >
                    <span className="font-bold group-hover:text-black">{daysCount} Days</span>
                 </button>
                 <button 
                    onClick={() => setRightPanelContent(rightPanelContent === 'PACKAGE' ? 'MEDIA' : 'PACKAGE')}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/50 rounded-full border border-gray-100 hover:border-black/30 hover:bg-white transition-all group"
                 >
                    <span className="group-hover:text-black">{priceStr} <span className="text-gray-400 font-normal">/ person</span></span>
                 </button>
                 <button 
                  onClick={() => setRightPanelContent(rightPanelContent === 'FLIGHTS' ? 'MEDIA' : 'FLIGHTS')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors ${rightPanelContent === 'FLIGHTS' ? 'bg-white text-black border border-black' : 'bg-black text-white hover:bg-gray-800'}`}
                 >
                   <GlobeAltIcon className="w-3 h-3" /> Includes Flights
                 </button>
              </div>
           </div>

           {/* Scrollable Summary */}
           <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar min-h-0 mb-2">
           <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 sticky top-0 bg-white/0 backdrop-blur-none">Tour Overview</h3>
           <div className="text-base md:text-lg text-gray-700 leading-relaxed font-serif whitespace-pre-line underline decoration-black/5 underline-offset-8">
              {summary || description || "Join us on this incredible journey..."}
           </div>
         </div>
       </div>
    );
  };

  // Quadrant 1: Top Left (Info or Calendar)
  const renderTopLeft = () => {
    if (viewMode === 'ITINERARY') {
      return (
         <div className="h-full bg-white/40 p-4 rounded-xl flex flex-col relative overflow-hidden backdrop-blur-sm border border-white/50 shadow-sm transition-all duration-300">
            {/* Calendar Grid - Smart Date Aware */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
               
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
                      className={`h-12 flex flex-col items-center justify-center rounded-lg transition-all relative
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
              <div className="flex items-baseline gap-3 mb-4 border-b border-gray-200/50 pb-3 sticky top-0 bg-white/0 backdrop-blur-sm z-10 pr-2">
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
                 
                 {/* Morning/Afternoon segments - Promoted Size as requested */}
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
                const exKey = k.replace('ext:','');
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
             <div className="flex-shrink-0 p-6 bg-black flex items-center justify-between">
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
                          <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-black mb-4 sticky top-0 bg-white/80 backdrop-blur-md py-3 z-10 border-b border-black/5">
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
                          <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-widest text-black mb-4 sticky top-0 bg-white/80 backdrop-blur-md py-3 z-10 border-b border-black/5">
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
    <div className="min-h-screen relative bg-black/5" style={{ background: "transparent" }}>
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

      {/* 3. MODAL CONTAINER (Center Floating) */}
      <main
        className="fixed inset-0 z-[80] flex items-center justify-center p-0"
        style={{ padding: "clamp(4px, 0.5vh, 8px)" }}
      >
        <div 
          ref={modalRef}
          className="w-full h-full relative flex flex-col overflow-hidden max-w-[1500px] mx-auto"
          style={{
            backgroundColor: "rgba(255,255,255,0.45)", 
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255,255,255,0.1)"
          }}
        >
             {/* INTERNAL MODAL HEADER */}
             <div className="w-full pt-4 px-4 lg:px-6 flex items-center justify-between relative z-10 shrink-0 pb-3">
                 
                 {/* Left Group: Back Arrow + Globe + User */}
                 <div className="flex items-center gap-2">
                     <button 
                         onClick={() => goBackToLanding(router)}
                         className="w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full text-gray-700 transition-colors backdrop-blur-sm"
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
                    
                     <div className="origin-left ml-0.5">
                        <UserBubble 
                           variant="modalHeader" 
                           buttonClassName="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full text-black transition-colors"
                        />
                     </div>
                 </div>

                 {/* Center Tabs Only */}
                 <div className="absolute left-1/2 top-4 -translate-x-1/2 flex flex-col items-center gap-1 z-50">
                    <div className="bg-black/80 p-0.5 rounded-full backdrop-blur-xl shadow-2xl flex border border-white/10">
                     <button 
                       onClick={() => setActiveTab('itinerary')}
                       className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'itinerary' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                     >
                       Details
                     </button>
                     <button 
                       onClick={() => setActiveTab('reservation')}
                       className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'reservation' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                     >
                       Reservation
                     </button>
                  </div>
                 </div>

                 {/* Right Spacer */}
                 <div className="w-[100px] pointer-events-none" />
             </div>

             {/* MODAL CONTENT */}
             <div className="flex-1 overflow-hidden px-4 lg:px-6 pb-2 lg:pb-3 relative pt-2">
                {activeTab === "itinerary" ? (
                   <div className="h-full w-full overflow-hidden">
                      {/* --- THE 2x2 DASHBOARD GRID --- */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 h-full gap-4">
                        
                         {/* LEFT COLUMN: Consolidate Calendar + Details */}
                         <div className="h-full min-h-0 relative flex flex-col pt-0">
                            {/* Left Column Container */}
                            <div className="flex-1 relative flex flex-col bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden shadow-sm h-full">
                            <div className="flex-1 flex flex-col h-full overflow-hidden">
                               {viewMode === 'ITINERARY' ? (
                                   <div className="h-full flex flex-col">
                                      {/* Content Area - No Scroll */}
                                      <div className="p-6 relative flex-1 flex flex-col justify-center overflow-hidden">
                                           {(() => {
                                          const day = tourDays.find((d:any) => d.day_number === selectedDay);
                                          const detailText = day?.day_description || day?.activities_data?.description || '';
                                          const morningText = typeof day?.activities_data?.morning === 'string' 
                                             ? day.activities_data.morning 
                                             : day?.activities_data?.morning?.text || day?.activities_data?.morning?.title || '';
                                          const afternoonText = typeof day?.activities_data?.afternoon === 'string' 
                                             ? day.activities_data.afternoon 
                                             : day?.activities_data?.afternoon?.text || day?.activities_data?.afternoon?.title || '';

                                          return (
                                            <div className="flex flex-col justify-center max-w-4xl mx-auto w-full h-full">
                                                {/* DAY N Title Always Visible Above Everything */}
                                                <div className="mb-4 shrink-0 text-center">
                                                   <span className="text-3xl md:text-5xl font-serif font-bold text-gray-400 block mb-2">
                                                      Day {selectedDay}
                                                   </span>
                                                   {/* 
                                                      User requested removing the "black" title (H2) and keeping only the "gray" day indicator 
                                                      but making it larger. 
                                                      
                                                      <h2 className="text-3xl md:text-3xl font-serif font-bold text-gray-900 leading-none mb-3">
                                                         {day?.day_title || day?.stops_data?.stop_name}
                                                      </h2>
                                                   */}
                                                   {detailText && (
                                                      <p className="text-xl md:text-2xl text-gray-900 leading-relaxed font-serif text-center max-w-2xl mx-auto">
                                                         {detailText}
                                                      </p>
                                                   )}
                                                </div>
                                                
                                                {/* Morning & Afternoon - Separate Cards */}
                                                <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                                                   {/* Morning Card */}
                                                   <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/50 shadow-sm transition-all hover:shadow-md min-h-0">
                                                      <div className="flex items-center gap-2 mb-2 border-b border-gray-200/50 pb-2 shrink-0">
                                                         <SunIcon className="w-5 h-5 text-orange-400" />
                                                         <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Morning</span>
                                                      </div>
                                                      <div className="text-lg text-gray-800 leading-relaxed font-serif overflow-hidden">
                                                         {morningText ? (
                                                            morningText.split('\n').map((line: string, i: number) => line.trim() ? (
                                                               <p key={i} className="mb-2 last:mb-0 line-clamp-[8]">{line}</p>
                                                            ) : null)
                                                         ) : (
                                                            <p className="text-gray-400 italic text-sm mt-2">Free time for leisure.</p>
                                                         )}
                                                      </div>
                                                   </div>

                                                   {/* Afternoon Card */}
                                                   <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/50 shadow-sm transition-all hover:shadow-md min-h-0">
                                                      <div className="flex items-center gap-2 mb-2 border-b border-gray-200/50 pb-2 shrink-0">
                                                         <MoonIcon className="w-5 h-5 text-indigo-400" />
                                                         <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Afternoon</span>
                                                      </div>
                                                      <div className="text-lg text-gray-800 leading-relaxed font-serif overflow-hidden">
                                                         {afternoonText ? (
                                                            afternoonText.split('\n').map((line: string, i: number) => line.trim() ? (
                                                               <p key={i} className="mb-2 last:mb-0 line-clamp-[8]">{line}</p>
                                                            ) : null)
                                                         ) : (
                                                            <p className="text-gray-400 italic text-sm mt-2">Free time for leisure.</p>
                                                         )}
                                                      </div>
                                                   </div>
                                                </div>
                                            </div>
                                          );
                                      })()}
                                      </div>
                                      
                                      {/* BOTTOM: Fixed Calendar Strip */}
                                      <div className="mt-auto flex-shrink-0 bg-white/40 border-t border-gray-200/20 p-4 pb-2 z-20 rounded-b-xl">
                                         <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                              {(() => {
                                                 if (!calendarGrid || calendarGrid.length === 0) return "Trip Calendar";
                                                 const validDays = calendarGrid.filter((c: any) => c.status === 'tour');
                                                 if (validDays.length === 0) return "Trip Calendar";
                                                 
                                                 const startMonth = format(validDays[0].date, 'MMMM').toUpperCase();
                                                 const endMonth = format(validDays[validDays.length - 1].date, 'MMMM').toUpperCase();
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
                                   <div className="h-full min-h-0 pb-20">
                                      {renderSummaryPanel()}
                                   </div>
                               )}
                            </div>
                            </div>

                            {/* PERSISTENT BOTTOM NAVIGATION - Overlaid */}
                            <div className="absolute bottom-2 left-2 right-2 z-50">
                               <div className="grid grid-cols-4 gap-2 bg-white/20 backdrop-blur-xl p-1.5 rounded-2xl border border-white/30 shadow-2xl">
                                 <button 
                                    onClick={() => {
                                        setViewMode('SUMMARY');
                                        setRightPanelContent('MEDIA');
                                    }} 
                                    className={`py-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all
                                       ${viewMode === 'SUMMARY' ? 'bg-black text-white shadow-lg' : 'bg-white/60 text-gray-400 hover:bg-white hover:text-black border border-white/50 shadow-sm'}
                                    `}
                                 >
                                    <DocumentTextIcon className={`w-4 h-4 ${viewMode === 'SUMMARY' ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Summary</span>
                                 </button>

                                 <button 
                                    onClick={() => {
                                        setViewMode('ITINERARY');
                                        setRightPanelContent('MEDIA');
                                    }} 
                                    className={`py-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all
                                       ${viewMode === 'ITINERARY' ? 'bg-black text-white shadow-lg' : 'bg-white/60 text-gray-400 hover:bg-white hover:text-black border border-white/50 shadow-sm'}
                                    `}
                                 >
                                    <CalendarDaysIcon className={`w-4 h-4 ${viewMode === 'ITINERARY' ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Itinerary</span>
                                 </button>

                                 <button 
                                    onClick={() => setRightPanelContent(rightPanelContent === 'EXTENSIONS' ? 'MEDIA' : 'EXTENSIONS')}
                                    className={`py-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all
                                       ${rightPanelContent === 'EXTENSIONS' ? 'bg-black text-white shadow-lg' : 'bg-white/60 text-gray-400 hover:bg-white hover:text-black border border-white/50 shadow-sm'}
                                    `}
                                 >
                                    <MapIcon className={`w-4 h-4 ${rightPanelContent === 'EXTENSIONS' ? 'text-white' : 'text-gray-400'}`} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Extensions</span>
                                 </button>

                                 <button 
                                    onClick={handleBrochureClick} 
                                    disabled={downloadStatus === 'loading' || downloadStatus === 'success'}
                                    className="py-2 bg-white/60 backdrop-blur-md border border-white/50 rounded-xl flex flex-col items-center justify-center gap-0.5 hover:bg-white hover:shadow-md transition-all group shadow-sm"
                                 >
                                    {downloadStatus === 'loading' ? (
                                       <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mb-0.5"></span>
                                    ) : downloadStatus === 'success' ? (
                                       <CheckIcon className="w-4 h-4 text-green-600 mb-0.5" />
                                    ) : (
                                       <span className="font-serif font-bold text-sm leading-none text-gray-400 group-hover:text-black transition-colors">PDF</span>
                                    )}
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${downloadStatus === 'success' ? 'text-green-600' : 'text-gray-400 group-hover:text-black'}`}>
                                       {downloadStatus === 'loading' ? 'Loading' : downloadStatus === 'success' ? 'Downloaded' : 'Brochure'}
                                    </span>
                                 </button>
                               </div>
                            </div>
                         </div>

                         {/* RIGHT COLUMN (Vertical Split: Media + Map) OR Full Panel */}
                         <div className={`h-full min-h-0 transition-all duration-300 ${['PACKAGE', 'EXTENSIONS'].includes(rightPanelContent) ? 'flex flex-col' : 'grid grid-rows-2 gap-4'}`}>
                            
                            {/* 1. FULL COLUMN CONTENT (Package / Extensions) */}
                            {['PACKAGE', 'EXTENSIONS'].includes(rightPanelContent) ? (
                               <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300 relative flex flex-col">
                                  
                                  <div className="flex-1 overflow-y-auto p-0 relative">
                                     {rightPanelContent === 'PACKAGE' && (
                                        <div className="flex flex-col h-full bg-white relative">
                                           {/* TOP: Visual Image */}
                                           <div className="w-full h-40 xl:h-48 relative overflow-hidden shrink-0">
                                              <img 
                                                src="https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/MISC/IberoPackage.webp" 
                                                alt="Ibero Package" 
                                                className="absolute inset-0 w-full h-full object-cover"
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                              
                                              <button 
                                                 onClick={() => setRightPanelContent('MEDIA')}
                                                 className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-all z-10"
                                              >
                                                 <span className="sr-only">Close</span>
                                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                 </svg>
                                              </button>

                                              <h2 className="absolute bottom-4 left-6 text-2xl xl:text-3xl font-serif font-bold text-white shadow-sm">The Ibero Package</h2>
                                           </div>

                                           {/* BOTTOM: Content */}
                                           <div className="flex-1 px-6 xl:px-8 pt-4 pb-4 flex flex-col relative overflow-hidden">
                                              <div className="flex-1 overflow-y-auto custom-scrollbar">
                                                  <p className="text-gray-600 mb-6 text-sm xl:text-base leading-relaxed">
                                                  Everything you need for a seamless journey, included in one transparent price.
                                                  </p>
                                                  
                                                  <ul className="grid grid-cols-1 gap-3 mb-6">
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

                                              {/* Legal Footer - Restored */}
                                              <div className="mt-auto pt-6 border-t border-gray-100 text-xs text-gray-500 font-sans w-full bg-white relative z-10 shrink-0">
                                                 <div className="flex items-center justify-between gap-4 w-full">
                                                     <div className="flex-1 min-w-0">
                                                          <p className="font-bold text-black mb-2 text-xs uppercase tracking-wide truncate">
                                                              Certified Travel Agency Details
                                                          </p>
                                                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-medium leading-tight">
                                                              <span className="whitespace-nowrap">NAME: <strong className="text-black">IBERO</strong></span>
                                                              <span className="whitespace-nowrap">CIEX: <strong className="text-black">06-00049-Om</strong></span>
                                                              <span className="whitespace-nowrap">REG: <strong className="text-black">AV-00661</strong></span>
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
                               <>
                                  {/* Top Right: Media OR Weather/Flight Panel */}
                                  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200/50 bg-white relative group h-full">
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
                                           <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-6">
                                              {initialData?.Weather || "Weather information coming soon."}
                                           </p>
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
                                           <p className="text-xs text-gray-500 italic">
                                              Flight details confirmed 30 days prior.
                                           </p>
                                        </div>
                                     ) : (
                                        /* Default Media Player */
                                        <>
                                           <SmartSlideshow 
                                             basePath="Open Tours/MADRID TO LISBOA"
                                             daySpecificMedia={viewMode === 'ITINERARY' && itineraryMedia[selectedDay - 1] 
                                               ? [{ type: 'image', src: itineraryMedia[selectedDay - 1] }] 
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
                                  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200/50 bg-white relative">
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
                               </>
                            )}
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="h-full w-full overflow-hidden">
                      <div className="h-full w-full">
                         <ReservationTab tourData={tourData} />
                      </div>
                   </div>
                )}
             </div>








        </div>
      </main>
    </div>
  );
}
