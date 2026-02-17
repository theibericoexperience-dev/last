'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoSequence from '@/components/VideoSequence';
import ReservationCard from '@/components/reservation/ReservationCard';
import TravelersSection from './TravelersSection';
import PaymentsSection from './PaymentsSection';
import WhatsAppSection from './WhatsAppSection';
import PersonalTourModal from './PersonalTourModal';
import { SparklesIcon, MapPinIcon } from '@heroicons/react/24/outline';

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
}

export default function ReservationSection({ 
    orders, 
    personalTours = [],
    loading, 
    focusedOrderId, 
    onViewDetails, 
    onEditTravelers, 
    onEditPayments,
    onVideoReady 
  }: ReservationSectionProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const lastFocusedId = React.useRef<string | undefined>(undefined);

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
      el.classList.add('ring-2', 'ring-emerald-300');
      const t = setTimeout(() => { try { el.classList.remove('ring-2', 'ring-emerald-300'); } catch(e){} }, 4000);
      return () => clearTimeout(t);
    } catch (e) {
      // ignore UI errors
    }
  }, [focusedOrderId, orders]);

  const visibleOrders = orders.filter(o => {
    const idKey = String(o.order_id ?? o.id ?? '');
    return !deletedIds.has(idKey);
  });

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
      <div className="space-y-8">
        {/* Welcome Card */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
             <div className="absolute inset-0 z-0">
                  <VideoSequence 
                       contained 
                       className="h-full w-full object-cover transition-opacity duration-700 opacity-60" 
                       onLoad={onVideoReady} 
                  />
             </div>
             <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center text-white space-y-6">
                  <h2 className="text-3xl font-serif font-medium">Welcome to your Travel Panel</h2>
                  <p className="max-w-md text-slate-200">
                      You haven't made any reservations yet. Explore our curated experiences or design your own journey.
                  </p>
                  <div className="flex gap-4">
                      <Link
                          href="/#tour-2026"
                          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-transform hover:scale-105"
                      >
                          Explore Tours
                      </Link>
                      <button
                          onClick={() => setModalOpen(true)}
                          className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold hover:bg-white/20 transition-all"
                      >
                          <SparklesIcon className="h-4 w-4" /> Design Custom Tour
                      </button>
                  </div>
             </div>
        </div>

        {/* Display Personal Tour Requests if any */}
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
        
        <PersonalTourModal 
            isOpen={modalOpen} 
            onClose={() => setModalOpen(false)} 
            onSuccess={() => {
                // Ideally refresh data
                router.refresh(); 
            }}
        />
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
                   
                   {/* WhatsApp Section */}
                   <div id="section-whatsapp" className="scroll-mt-24 pt-8 border-t border-slate-100">
                      <WhatsAppSection />
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

      <PersonalTourModal 
            isOpen={modalOpen} 
            onClose={() => setModalOpen(false)} 
            onSuccess={() => router.refresh()}
      />
    </div>
  );
}

