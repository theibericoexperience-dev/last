'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoSequence from '@/components/VideoSequence';
import ReservationCard from '@/components/reservation/ReservationCard';
import TravelersSection from './TravelersSection';
import PaymentsSection from './PaymentsSection';
import { SparklesIcon, MapPinIcon } from '@heroicons/react/24/outline';
import PanelTourGrid from './PanelTourGrid';
import TourCreatorWizard from './TourCreatorWizard';

interface Order {
  id: string;
// ... existing Order properties ...
  order_id?: string;
  tour_name?: string;
  tourName?: string;
  tour?: any;
  tour_title?: string;
  departure_date?: string;
  departureDate?: string;
  adults?: number;
  children?: number;
  total_amount?: number;
  totalAmount?: number;
  status?: string;
  created_at?: string;
}

interface ReservationSectionProps {
  orders: Order[];
  personalTours?: any[];
  loading?: boolean;
  focusedOrderId?: string;
  onViewDetails?: (orderId: string) => void;
  onEditTravelers?: (orderId: string) => void;
  onEditPayments?: (orderId: string) => void;
  onVideoReady?: () => void;
  onOpenSidebar?: () => void;
}

export default function ReservationSection({ 
    orders, 
    personalTours = [],
    loading, 
    focusedOrderId, 
    onViewDetails, 
    onEditTravelers, 
    onEditPayments,
    onVideoReady,
    onOpenSidebar
  }: ReservationSectionProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'explore'|'custom'>('explore');
  const [modalOpen, setModalOpen] = useState(false);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);
  const [heroCollapsed, setHeroCollapsed] = useState(false);

  const lastFocusedId = React.useRef<string | undefined>(undefined);
  const heroRef = React.useRef<HTMLDivElement | null>(null);
  const tabContentRef = useRef<HTMLDivElement | null>(null);

  // Track whether we are on mobile (<768px) — used to disable hero expand/collapse on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Collapse hero when user scrolls down in the panel main scroller (desktop only)
  useEffect(() => {
    if (isMobile) return; // no expand/collapse on mobile
    const mainEl = document.getElementById('panel-main-content');
    if (!mainEl) return;
    const onScroll = () => {
      if (mainEl.scrollTop > 80) {
        setHeroCollapsed(true);
      } else if (mainEl.scrollTop < 20) {
        setHeroCollapsed(false);
      }
    };
    mainEl.addEventListener('scroll', onScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  // Provide default no-op handlers so child components that require callbacks
  // receive a function even if the parent didn't pass one.
  const _onViewDetails = onViewDetails || (() => {});
  const _onEditTravelers = onEditTravelers || (() => {});
  const _onEditPayments = onEditPayments || (() => {});

  const handleDeleteDraft = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    
    // Optimistic update
    setDeletedIds(prev => new Set(prev).add(orderId));

    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      router.refresh();
    } catch (e) {
      console.error(e);
      // Revert optimistic update
      setDeletedIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      alert('Could not delete draft. Please try again.');
    }
  };

  // The focusedOrderId is purely declarative (source of truth is the URL via usePanelState).
  // We perform a local UI effect (scroll + highlight) when focusedOrderId changes —
  // this is purely presentational and does NOT affect application state.
  useEffect(() => {
    if (!focusedOrderId || focusedOrderId === lastFocusedId.current) return;
    
    const el = document.getElementById('order-' + focusedOrderId);
    if (!el) return;
    
    lastFocusedId.current = focusedOrderId;

    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Remove visual ring highlight to keep UI clean
    } catch (e) {
      // ignore UI errors
    }
  }, [focusedOrderId, orders]);

  // Ensure the hero height is applied immediately on the client and responds to resizes.
  // We use Tailwind classes now for better reactiveness.

  // Measure available vertical space below hero so children can size themselves
  useEffect(() => {
    const measure = () => {
      try {
        const hero = heroRef.current;
        if (!hero || typeof window === 'undefined') { setAvailableHeight(null); return; }
        const rect = hero.getBoundingClientRect();
        const viewport = window.innerHeight;
        // leave 48px for margins/headers
        const available = Math.max(200, Math.floor(viewport - rect.bottom - 48));
        setAvailableHeight(available);
        // expose for dev inspection
        (hero as HTMLElement).dataset['availableHeight'] = String(available);
        console.log('[Reservation] availableHeight=', available);
      } catch (e) {
        setAvailableHeight(null);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('orientationchange', measure); };
  }, [heroRef]);

  const visibleOrders = orders.filter(o => {
    const idKey = String(o.order_id ?? o.id ?? '');
    return !deletedIds.has(idKey);
  });

  const handleTabClick = (tab: 'explore' | 'custom') => {
    setActiveTab(tab);
    // Collapse the hero when user interacts with tabs (desktop only)
    if (!isMobile) setHeroCollapsed(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Your Reservations</h2>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-6 w-48 rounded bg-slate-200" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-32 rounded bg-slate-100" />
                <div className="h-4 w-40 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle case where NO regular orders exist, but user might have Personal Tours requests
  if (visibleOrders.length === 0) {
  return (
    <div className="flex flex-col">
    {/* Welcome Hero — collapses on scroll, expands on click */}
  <div 
    ref={heroRef} 
    onClick={() => { if(!isMobile && heroCollapsed) setHeroCollapsed(false); }}
    className={`relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl reservation-hero transition-all duration-700 ease-in-out mb-8 h-[172px] min-h-[172px] ${heroCollapsed ? 'md:h-[90px] md:min-h-[90px] cursor-pointer' : 'md:h-[260px] md:min-h-[260px]'}`}
  >
     <div className="absolute inset-0 z-0 h-full w-full">
      <VideoSequence 
         contained 
         className="h-full w-full object-cover transition-opacity duration-700 opacity-100" 
         onLoad={onVideoReady} 
       />
       <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />
     </div>
     {heroCollapsed && !isMobile && (
       <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
         <span className="text-white/80 text-xs font-medium tracking-widest uppercase select-none">Tap to expand</span>
       </div>
     )}
     <div className="relative z-10 flex flex-col h-full justify-end p-4 sm:p-6 text-center text-white overflow-hidden">
       <div className="flex-1 md:flex-none md:mt-auto" />
     </div>
  </div>

      {/* Unified tab bar (mobile style) placed below hero for all breakpoints */}
      <div ref={tabContentRef} className="flex w-full text-center border-b border-slate-200 scroll-mt-[10vh]">
        <div className="flex w-full">
          <button
            onClick={() => handleTabClick('explore')}
            className={`flex-1 pb-1 pt-1 text-sm font-semibold transition-colors ${
              activeTab === 'explore'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Explore Tours
          </button>
          <button
            onClick={() => handleTabClick('custom')}
            aria-label="Design Custom Tour"
            className={`flex-1 pb-1 pt-1 text-sm font-semibold transition-colors ${
               activeTab === 'custom'
                 ? 'text-amber-600 border-b-2 border-amber-600'
                 : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Custom Tours
          </button>
        </div>
      </div>

      {/* Render the selected tab content inline. Pass available height to children so they can limit themselves. */}
      {activeTab === 'explore' ? (
        <div className="scroll-mt-4 pt-0" onMouseEnter={() => { if (!isMobile) setHeroCollapsed(true); }}>
          <PanelTourGrid maxHeight={availableHeight} />
        </div>
      ) : (
        <div className="scroll-mt-4" onMouseEnter={() => { if (!isMobile) setHeroCollapsed(true); }}>
          <TourCreatorWizard maxHeight={availableHeight} />
        </div>
      )}    {/* Display Personal Tour Requests if any */}
    {personalTours.length > 0 && (
      <div className="space-y-4">
        <h3 className="text-xl font-light text-slate-900">Your Custom Requests</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {personalTours.map((pt: any) => (
            <div key={pt.id} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-amber-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <MapPinIcon className="h-4 w-4" /> Custom Trip
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  pt.status === 'proposal_ready' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {pt.status?.replace('_', ' ') || 'Pending'}
                </span>
              </div>
              <h4 className="font-serif text-lg text-slate-900 mb-1 line-clamp-1">{pt.destination_text}</h4>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                {pt.party_description} • {pt.budget_range}
              </p>
              <div className="text-xs text-slate-400">
                Requested on {new Date(pt.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    </div>
  );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Your Reservations</h2>
          {/* Allow creating custom tours even if you have active reservations */}
          <button
              onClick={() => setModalOpen(true)}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
              <SparklesIcon className="h-4 w-4" /> New Custom Request
          </button>
      </div>

      {/* Mixed List: Regular Orders + Pending Custom Requests? 
          For now, keep Personal Tours separate list below reservations 
      */}
      
      <div className="grid gap-4">
        {visibleOrders.map((order) => {
          const idKey = String(order.order_id ?? order.id ?? '');
          const isFocused = focusedOrderId && idKey === String(focusedOrderId);
          
          // Show details if:
          // 1. Order is explicitly focused
          // 2. Or there is only one order (auto-expand for convenience)
          const showDetails = isFocused || visibleOrders.length === 1;

          return (
            <div key={idKey} id={`order-${idKey}`} className="snap-start pt-[20px] pb-40">
              <ReservationCard
                order={order}
                onViewDetails={_onViewDetails}
                onEditTravelers={_onEditTravelers}
                onEditPayments={_onEditPayments}
                onDelete={handleDeleteDraft}
                focused={isFocused}
              />
              
              {showDetails && (
                <div className="mt-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {/* Travelers Section */}
                   <div id="section-travelers" className="scroll-mt-24 pt-8 border-t border-slate-100">
                      <TravelersSection orders={[order as any]} loading={false} />
                   </div>

                   {/* Payments Section */}
                   <div id="section-payments" className="scroll-mt-24 pt-8 border-t border-slate-100">
                      <PaymentsSection orders={[order as any]} loading={false} />
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Personal Tours List when orders exist */}
      {personalTours.length > 0 && (
          <div className="pt-8 border-t border-slate-200">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Custom Trip Requests</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                  {personalTours.map((pt: any) => (
                      <div key={pt.id} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-amber-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                    <MapPinIcon className="h-4 w-4" /> Custom Trip
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    pt.status === 'proposal_ready' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {pt.status?.replace('_', ' ') || 'Pending'}
                                </span>
                            </div>
                            <h4 className="font-serif text-lg text-slate-900 mb-1 line-clamp-1">{pt.destination_text}</h4>
                            <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                                {pt.party_description} • {pt.budget_range}
                            </p>
                            <div className="text-xs text-slate-400">
                                Requested on {new Date(pt.created_at).toLocaleDateString()}
                            </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">Close</button>
              <TourCreatorWizard />
           </div>
        </div>
      )}
    </div>
  );
}

