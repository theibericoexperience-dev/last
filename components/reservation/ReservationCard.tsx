import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { safeWebPath } from '@/app/tour/utils/media';
import ReservationCheckout from './ReservationCheckout';

// no icon for departure city — backend does not guarantee start_city

const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='224' viewBox='0 0 400 224'><rect width='100%' height='100%' fill='%23f1f5f9' /><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, Helvetica, sans-serif' font-size='18'>No image</text></svg>`)}`;

interface Props {
  order: {
    id?: string | number;
    order_id?: string | number;
    tour?: {
      title?: string | null;
      card_image?: string | null;
      start_date?: string | null;
    } | null;
    tour_title?: string | null;
    departure_date?: string | null;
    travelers_count?: number | null;
    status?: string | null;
    created_at?: string;
  };
  onViewDetails: (orderId: string) => void;
  onEditTravelers: (orderId: string) => void;
  onEditPayments: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
  focused: boolean;
}

// Minimal ReservationCard: strictly follow the backend contract.
export default function ReservationCard({ order, onViewDetails, onEditTravelers, onEditPayments, onDelete, focused }: Props) {
  const tour = order?.tour ?? null;

  const title = tour?.title ?? order?.tour_title ?? 'Tour Reservation';
  const image = tour?.card_image ? safeWebPath(tour.card_image) : SVG_PLACEHOLDER;
  const departureDate = order?.departure_date ?? tour?.start_date ?? null;
  const travelers = typeof order?.travelers_count === 'number' ? order.travelers_count : null;
  const status = order?.status ?? 'draft';
  const created_at = order?.created_at;
  const idStr = String(order?.order_id ?? order?.id ?? '');
  const isDraft = (status || '').toLowerCase() === 'draft';

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!isDraft || !created_at) return;

    const interval = setInterval(() => {
      const created = new Date(created_at).getTime();
      const now = new Date().getTime();
      const expires = created + 1000 * 60 * 60 * 48; // 48 hours
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let txt = '';
      if (days > 0) txt += `${days} day${days > 1 ? 's' : ''} `;
      if (hours > 0) txt += `${hours} hour${hours > 1 ? 's' : ''} `;
      if (diff < 1000 * 60 * 60 && mins > 0) txt += `${mins} min`; 
      
      setTimeLeft(txt.trim());
    }, 1000 * 60); // update every minute

    // Initial run
    const created = new Date(created_at).getTime();
    const now = new Date().getTime();
    const expires = created + 1000 * 60 * 60 * 48; // 48 hours
    const diff = expires - now;
    if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        let txt = '';
        if (days > 0) txt += `${days} day${days > 1 ? 's' : ''} `;
        if (hours > 0) txt += `${hours} hour${hours > 1 ? 's' : ''} `;
        if (diff < 1000 * 60 * 60 && mins > 0) txt += `${mins} min`;
        setTimeLeft(txt.trim());
    } else {
        setTimeLeft('Expired');
    }

    return () => clearInterval(interval);
  }, [created_at, isDraft]);

  return (
    <div id={`order-${idStr}`} className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md ${focused ? 'ring-2 ring-emerald-300' : ''} min-h-[220px]`}>
      <div className="flex gap-6 flex-col md:flex-row">
        <div className="w-full md:w-64 h-48 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 relative">
          <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-50" />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{title}</h3>
              {!isDraft && (
                <span className={`rounded-full px-4 py-1 text-sm font-semibold ${getStatusColor(status)}`}>
                  {status}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 border border-slate-100">
                <CalendarDaysIcon className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-slate-700">{departureDate ? new Date(departureDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Date TBD'}</span>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 border border-slate-100">
                <UserGroupIcon className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-slate-700">{travelers !== null ? `${travelers} traveler${travelers !== 1 ? 's' : ''}` : 'TBD'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex gap-2">
              {isDraft && onDelete ? (
                <button 
                  onClick={() => onDelete(idStr)} 
                  className="px-4 py-2 text-red-500 hover:text-red-700 rounded-lg text-sm font-medium transition-colors bg-transparent"
                >
                  Delete draft
                </button>
              ) : null}

              {!isDraft && typeof onViewDetails === 'function' && (
                <button onClick={() => onViewDetails(idStr)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
                  View Details
                </button>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              {isDraft ? (
                <>
                  <ReservationCheckout
                    label="Pay Deposit"
                    createOrderInputProvider={async () => ({ useExistingOrderId: idStr })}
                  />
                  {timeLeft && timeLeft !== 'Expired' && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span className="font-bold">
                            You have {timeLeft} left to pay deposit
                        </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-2">
                  {/* Additional buttons for non-draft states if needed */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
    case 'paid': return 'bg-green-100 text-green-700 border border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'cancelled': case 'canceled': return 'bg-red-100 text-red-700 border border-red-200';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}
