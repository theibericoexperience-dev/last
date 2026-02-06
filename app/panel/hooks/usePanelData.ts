'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/lib/db/supabaseClient';
import ensureProfileForAuthUser from '@/lib/auth/ensureProfile';
import { apiFetch } from '@/lib/fetch/apiFetch';

export interface PanelData {
  orders: any[];
  tickets: any[];
  bonuses: any[];
  bonusBalance: number;
  referralCode: string;
  calls: any[];
  paymentsPendingCount: number;
  travelersPendingCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePanelData(): PanelData {
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ordersRes, ticketsRes, bonusesRes, callsRes] = await Promise.all([
        apiFetch('/api/orders', { method: 'GET' }).then(r => r.json()).catch(() => ({ orders: [] })),
        apiFetch('/api/support/tickets', { method: 'GET' }).then(r => r.json()).catch(() => ({ tickets: [] })),
        apiFetch('/api/bonuses', { method: 'GET' }).then(r => r.json()).catch(() => ({ balance: 0, bonuses: [], referralCode: '' })),
        apiFetch('/api/calls', { method: 'GET' }).then(r => r.json()).catch(() => ({ calls: [] })),
      ]);

      setOrders(ordersRes.orders || []);
      setTickets(ticketsRes.tickets || []);
      setBonuses(bonusesRes.bonuses || []);
      setBonusBalance(bonusesRes.balance || 0);
      setReferralCode(bonusesRes.referralCode || '');
      setCalls(callsRes.calls || []);
      // Compute simple pending-task counts used by the sidebar badges.
      try {
        const fetched = (ordersRes.orders || []) as any[];
        const paymentsPending = fetched.reduce((sum, o) => {
          const deposit = (o.deposit_total_usd ?? o.deposit_total ?? o.server_pricing?.deposit_total_usd) || 0;
          const paid = (o.amount_paid ?? o.amountPaid ?? 0) || 0;
          return sum + (deposit > 0 && paid < deposit ? 1 : 0);
        }, 0);

        const travelersPending = fetched.reduce((sum, o) => {
          // If travelers array exists, consider it pending when any traveler lacks a visible name.
          if (o.travelers && Array.isArray(o.travelers)) {
            const anyIncomplete = o.travelers.some((t: any) => {
              const full = t.full_name || t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim();
              return !full;
            });
            return sum + (anyIncomplete ? 1 : 0);
          }
          // If no travelers array but a travelers_count is present and there is no traveler details, mark as pending
          const count = o.travelers_count || o.travelers || 0;
          if (count > 0 && (!o.travelers || (Array.isArray(o.travelers) && o.travelers.length < count))) return sum + 1;
          return sum;
        }, 0);

        // Store computed values in local state so callers can consume them
        // (we don't mutate the raw orders objects here)
        // Use temporary setters by reusing existing state setters - keep them in sync
        // by setting new derived values on next render cycle via local variables below.
        // We'll attach them to the returned object instead of separate state to avoid
        // extra re-renders in simple hook.
        // (no-op here)
        // eslint-disable-next-line no-unused-expressions
        paymentsPending;
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('[usePanelData] Error:', err);
      setError('Failed to load panel data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = async () => {
      // If a client session exists, attempt to ensure profile exists/claimed first
      try {
        const { data: { session } } = supabaseClient ? await supabaseClient.auth.getSession() : { data: { session: null } };
        if (session && session.user) {
          await ensureProfileForAuthUser({ id: session.user.id, email: session.user.email });
        }
      } catch (e) {
        // ignore
      }
      await fetchData();
    };

    handle();

    // Re-fetch / ensure profile when a client-side Supabase session becomes available (hydration after OAuth)
    const onSession = () => {
      handle();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('supabase:session-ready', onSession);
      const onOrdersChanged = () => { fetchData(); };
      window.addEventListener('ibero:orders-changed', onOrdersChanged as EventListener);
      return () => {
        window.removeEventListener('supabase:session-ready', onSession);
        window.removeEventListener('ibero:orders-changed', onOrdersChanged as EventListener);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('supabase:session-ready', onSession);
      }
    };
  }, [fetchData]);

  return {
    orders,
    tickets,
    bonuses,
    bonusBalance,
    referralCode,
    calls,
    loading,
    error,
    // Compute and return the pending counts on-demand so the hook remains
    // resilient to different order shapes across deployments.
    paymentsPendingCount: (() => {
      try {
        return (orders || []).reduce((sum, o: any) => {
          const deposit = (o.deposit_total_usd ?? o.deposit_total ?? o.server_pricing?.deposit_total_usd) || 0;
          const paid = (o.amount_paid ?? o.amountPaid ?? 0) || 0;
          return sum + (deposit > 0 && paid < deposit ? 1 : 0);
        }, 0);
      } catch (e) {
        return 0;
      }
    })(),
    travelersPendingCount: (() => {
      try {
        return (orders || []).reduce((sum, o: any) => {
          if (o.travelers && Array.isArray(o.travelers)) {
            const anyIncomplete = o.travelers.some((t: any) => {
              const full = t.full_name || t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim();
              return !full;
            });
            return sum + (anyIncomplete ? 1 : 0);
          }
          const count = o.travelers_count || o.travelers || 0;
          if (count > 0 && (!o.travelers || (Array.isArray(o.travelers) && o.travelers.length < count))) return sum + 1;
          return sum;
        }, 0);
      } catch (e) {
        return 0;
      }
    })(),
    refetch: fetchData,
  };
}
