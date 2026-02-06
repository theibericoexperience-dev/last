"use client";

import { useEffect, useState, useMemo } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import PassportSubsection from './PassportSubsection';
import { getUserProfile } from '@/lib/domain/profile/api';
import { usePanelState } from '../hooks/usePanelState';

interface Order {
  id: string;
  tour_name?: string;
  tourName?: string;
}

interface TravelersSectionProps {
  orders: Order[];
  loading: boolean;
}

export default function TravelersSection({ orders, loading }: TravelersSectionProps) {
  const { focusedOrderId } = usePanelState();
  const [primaryOpen, setPrimaryOpen] = useState(false);
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [primaryName, setPrimaryName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await getUserProfile();
        if (!mounted) return;
        const pp = p as any;
        const name = (pp?.full_name || pp?.name || `${pp?.first_name || ''} ${pp?.last_name || ''}`).trim();
        setPrimaryName(name || null);
      } catch (e) {
        // console.warn('Failed to fetch profile in TravelersSection', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const activeOrderId = focusedOrderId || (orders && orders.length > 0 ? orders[0].id : null);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Travelers</h2>
        <div className="animate-pulse space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="h-6 w-48 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <UsersIcon className="h-6 w-6 text-slate-400" />
        <h2 className="text-2xl font-light text-slate-900">Travelers</h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Primary Traveler Card */}
          <div className="p-4 rounded-lg border border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Primary traveler</p>
            <button
              onClick={() => setPrimaryOpen(!primaryOpen)}
              className="mt-2 w-full text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900 group-hover:text-amber-600 transition-colors">
                  {primaryName || 'Your Name'}
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-600">
                  !
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Complete passport details</p>
            </button>
          </div>

          {/* Buddy Card */}
          <div className="p-4 rounded-lg border border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Travel buddy</p>
            <button
              onClick={() => setBuddyOpen(!buddyOpen)}
              className="mt-2 w-full text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-900 group-hover:text-amber-600 transition-colors">
                  Add travel buddy details
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-600">
                  !
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Optional information</p>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="space-y-6">
          {primaryOpen && (
            <PassportSubsection 
              orderId={activeOrderId} 
              slotId="primary" 
              initial={{ 
                firstName: primaryName?.split(' ')[0] || '', 
                lastName: primaryName?.split(' ').slice(1).join(' ') || '' 
              }} 
            />
          )}
          {buddyOpen && (
            <PassportSubsection 
              orderId={activeOrderId} 
              slotId="buddy" 
              initial={{}} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

