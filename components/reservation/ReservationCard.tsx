import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, UserGroupIcon, ClockIcon, ChevronDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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
    adults?: number;
    children?: number;
    status?: string | null;
    created_at?: string;
    total_amount?: number;
    totalAmount?: number;
    amount_paid?: number;
    amountPaid?: number;
    deposit_amount?: number;
    travelers?: any[];
    extras?: {
      selected_addons?: Record<string, boolean>;
      [key: string]: any;
    };
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
  const travelersCount = typeof order?.travelers_count === 'number' ? order.travelers_count : null;
  const status = order?.status ?? 'draft';
  const created_at = order?.created_at;
  const idStr = String(order?.order_id ?? order?.id ?? '');
  const isDraft = (status || '').toLowerCase() === 'draft';

  // Pending tasks computation
  const total = order?.total_amount || (order as any)?.totalAmount || 0;
  const paid = order?.amount_paid || (order as any)?.amountPaid || 0;
  const numTravelers = order?.travelers_count || ((order?.adults || 0) + (order?.children || 0)) || 1;
  const deposit = numTravelers * 1000;
  const depositPending = paid < deposit;
  const fullPricePending = paid < total && !depositPending;
  const travelersMissing = (() => {
    if (order?.travelers && Array.isArray(order.travelers)) {
      return order.travelers.some((t: any) => {
        const full = t.full_name || t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim();
        return !full;
      });
    }
    return (travelersCount || 0) > 0;
  })();

  const pendingTasks: string[] = [];
  if (travelersMissing) pendingTasks.push('Complete traveler details');
  if (depositPending) pendingTasks.push('Pay deposit');
  else if (fullPricePending) pendingTasks.push('Pay remaining balance');

  const [tasksOpen, setTasksOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!created_at) return;

    const calc = () => {
      const created = new Date(created_at).getTime();
      const expires = created + 1000 * 60 * 60 * 48;
      const diff = expires - Date.now();
      if (diff <= 0) return 'Expired';
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours}h`);
      return parts.join(' ');
    };

    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 60_000);
    return () => clearInterval(interval);
  }, [created_at]);

  return (
    <div id={`order-${idStr}`} className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md`}>
      <div className="flex gap-4 flex-col md:flex-row p-4 md:p-6">
        {/* Image */}
        <div className="w-full md:w-56 h-40 md:h-44 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 relative">
          <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-50" />
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg md:text-2xl font-bold text-slate-900 leading-tight truncate">{title}</h3>
              {!isDraft && (
                <span className={`flex-shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold ${getStatusColor(status)}`}>
                  {status}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-slate-600">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 border border-slate-100 min-w-0">
                <CalendarDaysIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium text-slate-700 text-xs sm:text-sm truncate">{departureDate ? new Date(departureDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Date TBD'}</span>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 border border-slate-100 min-w-0">
                <UserGroupIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium text-slate-700 text-xs sm:text-sm truncate">{travelersCount !== null ? `${travelersCount} traveler${travelersCount !== 1 ? 's' : ''}` : 'TBD'}</span>
              </div>
            </div>

            {/* Selected add-ons / insurance */}
            {(() => {
              const addons = order?.extras?.selected_addons;
              if (!addons) return null;
              const selected = Object.entries(addons).filter(([, v]) => v).map(([k]) => k);
              if (selected.length === 0) return null;
              return (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.map((key) => {
                    const isIns = key.startsWith('ins');
                    const label = key === 'insHealth' ? 'Health Insurance'
                      : key === 'insCancel' ? 'Cancellation Insurance'
                      : key.replace(/^ext:/, '').replace(/_/g, ' ');
                    return (
                      <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isIns ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {isIns ? '🛡' : '➕'} {label}
                      </span>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Actions row */}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex gap-2">
              {isDraft && onDelete ? (
                <button 
                  onClick={() => onDelete(idStr)} 
                  className="px-3 py-1.5 text-red-500 hover:text-red-700 rounded-lg text-xs font-medium transition-colors bg-transparent"
                >
                  Delete draft
                </button>
              ) : null}
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              {isDraft && (
                <>
                  <ReservationCheckout
                    label="Pay Deposit"
                    createOrderInputProvider={async () => ({ useExistingOrderId: idStr })}
                  />
                  {timeLeft && timeLeft !== 'Expired' && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span className="font-bold">{timeLeft} left to pay</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks Dropdown */}
      {pendingTasks.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            type="button"
            onClick={() => setTasksOpen(!tasksOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-amber-700">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
              {pendingTasks.length} pending task{pendingTasks.length > 1 ? 's' : ''}
            </span>
            <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${tasksOpen ? 'rotate-180' : ''}`} />
          </button>
          {tasksOpen && (
            <ul className="px-4 pb-3 space-y-1.5">
              {pendingTasks.map((task, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {task}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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
