'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoSequence from '@/components/VideoSequence';
import ReservationCard from '@/components/reservation/ReservationCard';
import TravelersSection from './TravelersSection';
import PaymentsSection from './PaymentsSection';
import WhatsAppSection from './WhatsAppSection';

interface Order {
  id: string;
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
  loading: boolean;
  onViewDetails?: (orderId: string) => void;
  onEditTravelers?: (orderId: string) => void;
  onEditPayments?: (orderId: string) => void;
  focusedOrderId?: string | undefined;
}

export default function ReservationSection({ orders, loading, onViewDetails, onEditTravelers, onEditPayments, focusedOrderId }: ReservationSectionProps) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
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

  if (visibleOrders.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">You haven't made any reservations</h2>
        <div className="group relative min-h-[220px] w-full overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-md bg-transparent">
       <div className="absolute inset-0 z-0">
         <VideoSequence contained className="h-full w-full object-cover transition-opacity duration-700" />
       </div>
          <div className="relative z-10 flex min-h-[220px] items-end justify-center p-6 text-center">
            <Link
              href="/#tour-2026"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-transform hover:scale-105"
            >
              Explore Tours
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Your Reservations</h2>
      
      <div className="grid gap-4">
        {visibleOrders.map((order) => {
          const idKey = String(order.order_id ?? order.id ?? '');
          const isFocused = focusedOrderId && idKey === String(focusedOrderId);
          // If this order represents the Madrid → Lisbon tour, always render the
          // TravelersSection under the card so the user doesn't need to click
          // "Edit Travelers" to open it.
          const tourTitle = String(order.tour_title ?? order.tourName ?? order.tour?.title ?? '').toLowerCase();
          const isMadridToLisbon = tourTitle.includes('madrid to lisbon') || (tourTitle.includes('madrid') && tourTitle.includes('lisbon'));
          const showDetails = isFocused || isMadridToLisbon;
          return (
            <div key={idKey}>
              <ReservationCard
                order={order}
                onViewDetails={_onViewDetails}
                onEditTravelers={_onEditTravelers}
                onEditPayments={_onEditPayments}
                onDelete={handleDeleteDraft}
                focused={isFocused}
              />
              {showDetails && (
                <div className="mt-4 space-y-6">
                  {/* Render travelers and payments directly under the focused card */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600">Reservation has pending tasks in Travelers and Payments. Complete them below.</p>
                  </div>
                  <TravelersSection orders={[order as any]} loading={false} />
                  <PaymentsSection orders={[order as any]} loading={false} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
