"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PaymentRecord, ReservationDraft, ReservationProfile, Traveler, TripPreference, FixedDeparture } from './types';
import { apiFetch } from '@/lib/fetch/apiFetch';

const makeId = (prefix: string) => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    // ignore
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

const MADRID_LISBON_DEPARTURE: FixedDeparture = {
  code: 'MAD26-APR',
  label: 'April 10 – 21, 2026',
  startDate: '2026-04-10',
  endDate: '2026-04-21',
};

const emptyTrip: TripPreference = {
  travelers: 2,
  roomType: 'double',
  fixedDeparture: MADRID_LISBON_DEPARTURE,
  addons: {
    preArrival: false,
    easter: false,
    azores: false,
  },
};

const defaultDraft = (tourId: string, tourTitle: string): ReservationDraft => {
  const now = new Date().toISOString();
  return {
    id: makeId('draft'),
    tourId,
    tourTitle,
    createdAt: now,
    lastSavedAt: now,
    status: 'draft',
    trip: { ...emptyTrip },
    travelers: [],
    payments: [],
  };
};

type ReservationStore = {
  profile: ReservationProfile | null;
  activeDraft: ReservationDraft | null;
  activeReservationId: string | null;
  reservations: ReservationDraft[];
  registerProfile: (profile: ReservationProfile) => void;
  updateTrip: (input: Partial<TripPreference>) => void;
  toggleAddon: (key: keyof TripPreference['addons']) => void;
  setActiveTour: (tourId: string, tourTitle: string) => void;
  setActiveReservation: (reservationId: string) => void;
  addTraveler: (traveler: Omit<Traveler, 'id'>) => void;
  updateTraveler: (travelerId: string, update: Partial<Traveler>) => void;
  removeTraveler: (travelerId: string) => void;
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'updatedAt'>) => void;
  updatePaymentStatus: (paymentId: string, status: PaymentRecord['status']) => void;
  submitReservation: () => ReservationDraft | null;
  submitReservationToServer: (emergencyEmail?: string) => Promise<any> | null;
  clear: () => void;
};

const noopStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
} as Storage;

const storage = createJSONStorage<ReservationStore>(() => (typeof window === 'undefined' ? noopStorage : window.localStorage));

const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => {
      const commitDraft = (draft: ReservationDraft) => {
        set((state) => {
          const shouldPersist = draft.status !== 'draft';
          const nextReservations = shouldPersist
            ? [...state.reservations.filter((r) => r.id !== draft.id), draft]
            : state.reservations;
          return {
            activeDraft: draft,
            reservations: nextReservations,
            activeReservationId: shouldPersist ? draft.id : state.activeReservationId,
          };
        });
      };

      const updateReservationField = (mutator: (draft: ReservationDraft) => ReservationDraft) => {
        const draft = get().activeDraft;
        if (!draft) return;
        const nextDraft = mutator(draft);
        commitDraft(nextDraft);
      };

      const buildReference = (tourId: string) => {
        const date = new Date();
        return `IBR-${tourId.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      };

      return {
        profile: null,
        activeDraft: null,
        activeReservationId: null,
        reservations: [],
        registerProfile: (profile) => {
          set({ profile: { ...profile } });
        },
        setActiveTour: (tourId, tourTitle) => {
          const draft = get().activeDraft;
          if (draft && draft.tourId === tourId) return;
          const newDraft = defaultDraft(tourId, tourTitle);
          commitDraft(newDraft);

          // Try to create a server-side draft for authenticated users.
          // Run asynchronously and do not block the caller.
          (async () => {
            try {
              if (typeof window === 'undefined') return;
              // check client session
              const supabase = await import('@/lib/db/supabaseClient').then(m => m.supabaseClient).catch(() => null);
              if (!supabase || !supabase.auth || typeof supabase.auth.getSession !== 'function') return;
              const { data: { session } = {} as any } = await supabase.auth.getSession();
              if (!session || !session.user) return;

              const res = await apiFetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify({ type: 'fixed', tourId: newDraft.tourId, tourTitle: newDraft.tourTitle, travelersCount: (newDraft.trip as any)?.travelers || 2 }),
              });
              if (!res.ok) return; // leave local draft as-is
              const body = await res.json().catch(() => ({}));
              const order = body.order;
              if (!order) return;

              // update local store to reflect server order
              const serverPricing = (order as any).server_pricing ?? null;
              const savedReservation = { ...newDraft, id: order.id, status: order.status || 'draft', referenceCode: order.reference_code || newDraft.referenceCode } as any;
              if (serverPricing) savedReservation.server_pricing = serverPricing;

              set((state) => ({
                reservations: [...state.reservations.filter((r) => r.id !== newDraft.id), savedReservation],
                activeDraft: savedReservation,
                activeReservationId: order.id,
              }));
            } catch (e) {
              // ignore failures; keep local draft
              // console.debug('create server draft failed', e);
            }
          })();
        },
        setActiveReservation: (reservationId) => {
          const found = get().reservations.find((r) => r.id === reservationId);
          if (found) commitDraft({ ...found });
        },
        updateTrip: (input) => {
          updateReservationField((draft) => ({
            ...draft,
            trip: {
              ...draft.trip,
              ...input,
              addons: {
                ...draft.trip.addons,
                ...(input.addons || {}),
              },
            },
            lastSavedAt: new Date().toISOString(),
          }));
        },
        toggleAddon: (key) => {
          updateReservationField((draft) => ({
            ...draft,
            trip: {
              ...draft.trip,
              addons: {
                ...draft.trip.addons,
                [key]: !draft.trip.addons[key],
              },
            },
            lastSavedAt: new Date().toISOString(),
          }));
        },
        addTraveler: (traveler) => {
          updateReservationField((draft) => ({
            ...draft,
            travelers: [...draft.travelers, { id: makeId('trav'), ...traveler }],
            status: draft.status === 'draft' ? 'ready' : draft.status,
            lastSavedAt: new Date().toISOString(),
          }));
        },
        updateTraveler: (travelerId, update) => {
          updateReservationField((draft) => ({
            ...draft,
            travelers: draft.travelers.map((t) => (t.id === travelerId ? { ...t, ...update } : t)),
            lastSavedAt: new Date().toISOString(),
          }));
        },
        removeTraveler: (travelerId) => {
          updateReservationField((draft) => ({
            ...draft,
            travelers: draft.travelers.filter((t) => t.id !== travelerId),
            lastSavedAt: new Date().toISOString(),
          }));
        },
        addPayment: (payment) => {
          updateReservationField((draft) => {
            const rec: PaymentRecord = {
              id: makeId('pay'),
              updatedAt: new Date().toISOString(),
              ...payment,
            };
            return {
              ...draft,
              payments: [...draft.payments, rec],
              status: draft.status === 'draft' && draft.travelers.length > 0 ? 'ready' : draft.status,
              lastSavedAt: rec.updatedAt,
            };
          });
        },
        updatePaymentStatus: (paymentId, status) => {
          updateReservationField((draft) => ({
            ...draft,
            payments: draft.payments.map((p) => (p.id === paymentId ? { ...p, status, updatedAt: new Date().toISOString() } : p)),
            lastSavedAt: new Date().toISOString(),
          }));
        },
        submitReservation: () => {
          const draft = get().activeDraft;
          const profile = get().profile;
          if (!draft || !profile) return null;
          const next: ReservationDraft = {
            ...draft,
            status: 'submitted',
            referenceCode: draft.referenceCode || buildReference(draft.tourId),
            lastSavedAt: new Date().toISOString(),
          };
          commitDraft(next);
          return next;
        },
        // persist current activeDraft to server and replace with server-backed order
        submitReservationToServer: async (emergencyEmail?: string) => {
          const draft = get().activeDraft;
          // profile in the local store is optional for submitting; only draft is required
          if (!draft) throw new Error('Missing draft');
          try {
            // Ensure we have an active Supabase session and explicit access token
            if (typeof window === 'undefined') throw new Error('Client-only operation');
            const supabase = await import('@/lib/db/supabaseClient').then(m => m.supabaseClient).catch(() => null);
            if (!supabase || !supabase.auth || typeof supabase.auth.getSession !== 'function') {
              throw new Error('Supabase client not available');
            }
            const { data: { session } = {} as any } = await supabase.auth.getSession();
            // We allow the request even without a Supabase session, 
            // as the server now handles both Supabase and NextAuth sessions via cookies.
            
            const res = await apiFetch('/api/orders', {
              method: 'POST',
              body: JSON.stringify({
                type: 'fixed',
                tourId: draft.tourId,
                tourTitle: draft.tourTitle,
                travelersCount: draft.travelers.length || (draft.trip as any).travelers || 2,
                extras: draft.trip.addons,
                preferredDepartureAirport: (draft.trip as any).preferredDepartureAirport || null,
                userEmail: emergencyEmail || null,
              }),
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              const err: any = new Error(body?.error || `Order creation failed (${res.status})`);
              err.status = res.status;
              err.body = body;
              throw err;
            }

            const body = await res.json();
            const order = body.order;
            if (!order || !order.id) {
              const err: any = new Error('Order creation failed: missing order id');
              err.status = 500;
              throw err;
            }

            // attach server_pricing to the local reservation representation (read-only snapshot)
            const serverPricing = (order as any).server_pricing ?? null;
            const savedReservation = { ...draft, id: order.id, status: order.status || 'submitted', referenceCode: order.reference_code || draft.referenceCode } as any;
            if (serverPricing) savedReservation.server_pricing = serverPricing;

            // replace local draft with server order representation stored in reservations
            set((state) => ({
              reservations: [...state.reservations.filter((r) => r.id !== draft.id), savedReservation],
              activeDraft: savedReservation,
              activeReservationId: order.id,
            }));
            return order;
          } catch (err) {
            // do not modify local draft on failure; surface error to caller
            throw err;
          }
        },
        deleteDraftById: async (orderId: string) => {
          const draft = get().reservations.find((r) => String(r.id) === String(orderId) || String(r.id) === String((r as any).order_id));
          try {
            const res = await apiFetch(`/api/orders/${encodeURIComponent(orderId)}`, {
              method: 'DELETE',
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body?.error || 'Delete failed');
            }
            // remove from local reservations list
            set((state) => ({
              reservations: state.reservations.filter((r) => String(r.id) !== String(orderId) && String((r as any).order_id || '') !== String(orderId)),
              activeDraft: state.activeDraft && (String(state.activeDraft.id) === String(orderId) || String((state.activeDraft as any).order_id || '') === String(orderId)) ? null : state.activeDraft,
              activeReservationId: state.activeReservationId === orderId ? null : state.activeReservationId,
            }));
            // Notify interested UI (panel) to refetch server-side orders
            try {
              if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('ibero:orders-changed'));
              }
            } catch (e) {
              // ignore
            }
            return true;
          } catch (err) {
            console.error('deleteDraftById failed', err);
            throw err;
          }
        },
        clear: () => set({ profile: null, activeDraft: null, activeReservationId: null, reservations: [] }),
      };
    },
    {
      name: 'reservation-store-v1',
      storage,
    },
  ),
);

export default useReservationStore;
