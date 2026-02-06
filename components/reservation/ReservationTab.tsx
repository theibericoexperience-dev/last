"use client";

import React, { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { supabaseClient } from '@/lib/db/supabaseClient';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon } from '@heroicons/react/24/outline';
import useReservationStore from '@/lib/reservations/store';
import { isEnabled } from '@/lib/featureFlags';
import { apiFetch } from '@/lib/fetch/apiFetch';

export interface TourData {
  id?: string;
  title: string;
  nights?: number; // number of nights for single-surcharge calculation
  basePricePerTraveler?: number; // optional per-tour base price
  includedRoomType?: 'double' | 'single' | 'suite';
  inclusions: string[];
  insuranceOptions: { health: string; cancellation: string };
  disclaimer: string;
  // optional canonical extensions supplied by the tour page (days + optional pricePerDay)
  extensions?: Array<{ key: string; name: string; days: number; pricePerDay?: number }>;
}

export interface ReservationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  travelers: number;
  roomType?: 'double' | 'single' | 'suite';
  comments?: string;
}

export interface ReservationTabProps {
  tourData: TourData;
}

export default function ReservationTab({ tourData, onOpenRegister }: ReservationTabProps & { onOpenRegister?: () => void }) {
  const router = useRouter();
  // Supabase is the source of truth. Read client session from Supabase.
  const [sbSession, setSbSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (supabaseClient && supabaseClient.auth && typeof supabaseClient.auth.getSession === 'function') {
          const { data: { session } = {} as any } = await supabaseClient.auth.getSession();
          if (mounted) setSbSession(session);
        }
      } catch (e) {
        // ignore
      }
    })();
    
    const { data: { subscription } } = supabaseClient?.auth.onAuthStateChange((_event, session) => {
      setSbSession(session);
    }) || { data: { subscription: null } };

    return () => { 
      mounted = false; 
      subscription?.unsubscribe();
    };
  }, []);
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue } = useForm<ReservationFormData>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      countryCode: '+34',
      travelers: 2,
      comments: '',
    },
  });

  const travelers = Number(watch('travelers') || 2);
  const roomType = (watch('roomType') || 'double') as ReservationFormData['roomType'];

  // Pricing config (frontend-only defaults; can be overridden by tourData)
  const basePricePerTraveler = tourData.basePricePerTraveler ?? 3500; // USD
  const nights = tourData.nights ?? 11;
  // single-traveler nightly surcharge (per plan: $100 per night when only 1 traveler)
  const singleTravelerNightSurchargePerNight = 100; // USD
  const depositPerTraveler = 1000; // USD

  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [showNoAddonsPrompt, setShowNoAddonsPrompt] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [serverConfirmed, setServerConfirmed] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Right column accordion: one of 'included' | 'optionals' | 'important' | 'help' is open at a time
  const [rightPanelOpen, setRightPanelOpen] = useState<'included' | 'optionals' | 'important' | 'help' | null>('included');

  // Ref + measured minHeight for the right column to keep columns consistent
  const rightColumnRef = useRef<HTMLDivElement | null>(null);
  const [rightColumnMinHeight, setRightColumnMinHeight] = useState<number | null>(null);

  const submitReservationToServer = useReservationStore((s) => s.submitReservationToServer);
  const updateTrip = useReservationStore((s) => s.updateTrip);
  const activeDraft = useReservationStore((s) => s.activeDraft) as any;

  // Use canonical extensions passed from tourData if present, otherwise fall back to example list
  const extensionsList = useMemo(() => {
    if (Array.isArray(tourData.extensions) && tourData.extensions.length) {
      return tourData.extensions.map((ex) => ({ key: ex.key, name: ex.name, days: ex.days, pricePerDay: ex.pricePerDay ?? 250 }));
    }
    return [
      { key: 'azores', name: 'Azores', days: 7, pricePerDay: 500 },
      { key: 'alcobaca', name: 'Alcobaca & Nazaré', days: 2, pricePerDay: 200 },
      { key: 'porto_extension', name: 'Porto Extension', days: 3, pricePerDay: 250 },
    ];
  }, [tourData.extensions]);

  const [extensionsOpen, setExtensionsOpen] = useState(false);
  const extensionsToggleRef = useRef<HTMLButtonElement | null>(null);
  const extensionsPanelRef = useRef<HTMLDivElement | null>(null);

  // click-outside / ESC handler for extensions overlay
  useEffect(() => {
    if (!extensionsOpen) return;
    const onDoc = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') {
          setExtensionsOpen(false);
        }
        return;
      }
      const me = e as MouseEvent;
      const target = me.target as Node | null;
      if (!target) return;
      if (extensionsPanelRef.current && extensionsPanelRef.current.contains(target)) return;
      if (extensionsToggleRef.current && extensionsToggleRef.current.contains(target)) return;
      setExtensionsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onDoc as any);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onDoc as any);
    };
  }, [extensionsOpen]);

  // Measure right column once (included is open by default) and whenever tour data changes.
  useLayoutEffect(() => {
    const measure = () => {
      const el = rightColumnRef.current;
      if (!el) return;
      const h = el.getBoundingClientRect().height;
      setRightColumnMinHeight(h);
    };
    // measure after layout
    measure();
    // recalc on window resize
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tourData]);

  // Define available addons (some per-traveler, some flat)
  const addons = useMemo(() => [
    // generic addons (insurance etc.)
    { key: 'insHealth', label: tourData.insuranceOptions.health || 'Health insurance', price: 100, perTraveler: true, info: 'Covers basic medical emergencies.' },
    { key: 'insCancel', label: tourData.insuranceOptions.cancellation || 'Cancellation insurance', price: 120, perTraveler: true, info: 'Covers trip cancellation per policy.' },
  ], [tourData]);

  const toggleAddon = (key: string) => setSelectedAddons(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleExtension = (extKey: string) => setSelectedAddons(prev => ({ ...prev, ["ext:"+extKey]: !prev["ext:"+extKey] }));

  const addonsTotal = useMemo(() => {
    let total = 0;
    // add generic addons
    for (const a of addons) {
      if (selectedAddons[a.key]) {
        total += a.perTraveler ? a.price * travelers : a.price;
      }
    }
    // add selected extensions
    for (const ex of extensionsList) {
      if (selectedAddons['ext:'+ex.key]) {
        // extension price is per-traveler per day
        const pricePerDay = ex.pricePerDay ?? 250;
        total += pricePerDay * ex.days * travelers; // extension price = days * pricePerDay * travelers
      }
    }
    return total;
  }, [addons, selectedAddons, travelers, extensionsList]);

  // Optionals modal state (replaces inline optional card)
  const [optionalsOpen, setOptionalsOpen] = useState(false);
  const optionalsRef = useRef<HTMLDivElement | null>(null);
  const [optionalsExpanded, setOptionalsExpanded] = useState<{ extensions: boolean; insurance: boolean; flights: boolean }>({ extensions: true, insurance: false, flights: false });
  const [extensionTiming, setExtensionTiming] = useState<Record<string, 'before' | 'after'>>({});
  // modal open state for the support ticket form
  const [needHelpModalOpen, setNeedHelpModalOpen] = useState(false);
  const [needHelpMessage, setNeedHelpMessage] = useState('');
  const [needHelpSubmitting, setNeedHelpSubmitting] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const prevBodyOverflow = useRef<string | null>(null);

  // Lock body scroll when any modal/overlay is open so modal content doesn't show internal scrollbars
  useEffect(() => {
  const anyOpen = optionalsOpen || needHelpModalOpen || showServerModal || extensionsOpen || termsModalOpen;
    if (anyOpen) {
      prevBodyOverflow.current = document.body.style.overflow || null;
      document.body.style.overflow = 'hidden';
    } else if (prevBodyOverflow.current !== null) {
      document.body.style.overflow = prevBodyOverflow.current;
      prevBodyOverflow.current = null;
    }
    return () => {
      if (prevBodyOverflow.current !== null) {
        document.body.style.overflow = prevBodyOverflow.current;
        prevBodyOverflow.current = null;
      }
    };
  }, [optionalsOpen, needHelpModalOpen, showServerModal, extensionsOpen]);
  useEffect(() => {
    if (!optionalsOpen) return;
    const onDoc = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setOptionalsOpen(false);
        return;
      }
      const me = e as MouseEvent;
      const target = me.target as Node | null;
      if (!target) return;
      if (optionalsRef.current && optionalsRef.current.contains(target)) return;
      setOptionalsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onDoc as any);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onDoc as any);
    };
  }, [optionalsOpen]);

  // Single-traveler surcharge: applies only when travelers === 1
  const roomSupplement = travelers === 1 ? singleTravelerNightSurchargePerNight * nights : 0;

  const totalPrice = useMemo(() => {
    return basePricePerTraveler * travelers + roomSupplement + addonsTotal;
  }, [basePricePerTraveler, travelers, roomSupplement, addonsTotal]);

  const estimatedCashback = useMemo(() => {
    // 5% cashback on the full operation (tour price + addons)
    return Number((totalPrice * 0.05).toFixed(2));
  }, [totalPrice]);

  // ensure 'travelers' is registered for validation even though we render a custom counter
  useEffect(() => {
    try {
      // register without a DOM input so react-hook-form validates the field
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const r = register('travelers', { required: true, min: 1 });
    } catch (e) {
      // ignore in non-browser test environments
    }
  }, [register]);

  const depositDue = useMemo(() => {
    // deposit might include addon deposits if needed; for now deposit per traveler
    return depositPerTraveler * travelers;
  }, [depositPerTraveler, travelers]);

  const depositDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString();
  }, []);

  const onSubmit = async (data: ReservationFormData) => {
    if (!termsAccepted) {
      alert('Please accept Terms & Conditions before continuing.');
      return;
    }

    // NEW: Check if no add-ons are selected and we haven't shown the prompt yet
    const isBypassed = (onSubmit as any)._prompt_bypassed;
    if (addonsTotal === 0 && !showNoAddonsPrompt && !isBypassed) {
      setShowNoAddonsPrompt(true);
      return;
    }
    // Clean up bypass flag
    if (isBypassed) delete (onSubmit as any)._prompt_bypassed;

    // Dual Session Check: Supabase OR NextAuth
    let isAuthenticated = !!sbSession?.user;
    
    if (!isAuthenticated) {
      try {
        if (supabaseClient?.auth) {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (session?.user) isAuthenticated = true;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!isAuthenticated) {
        // Persist pending under the new key for professional flow and open login/register modal
        const pendingData = {
          tour_id: tourData.id,
          tour_title: tourData.title,
          travelers_count: data.travelers,
          extras: {
            room_type: data.roomType,
            phone: data.phone,
            country_code: data.countryCode,
            comments: data.comments,
            selected_addons: selectedAddons,
            total_price: totalPrice,
            deposit_due: depositDue
          }
        };
        localStorage.setItem('ibero_pending_reservation', JSON.stringify(pendingData));
        console.log('>>> [CLIENT] User not authenticated. Persisted pending reservation to localStorage.');
        
        if (typeof onOpenRegister === 'function') onOpenRegister(); else router.push('/auth/register');
        return;
    }

    // At this point we have some form of session. Ensure the reservation store has an active draft for this tour.
    try {
      if (tourData?.id) {
        try { useReservationStore.getState().setActiveTour(tourData.id, tourData.title); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // ignore
    }

    // Call the store submit which enforces Authorization header.
    setIsSubmitting(true);
    try {
      // Pass the user's email from the form and NextAuth as an emergency fallback in the body
      const emergencyEmail = data.email || (sbSession?.user?.email as string) || null;
      console.log('>>> [CLIENT] Attempting submit with emergencyEmail:', emergencyEmail);
      const order = await submitReservationToServer(emergencyEmail);
      // Only show success and redirect after a confirmed server response with order.id
      if (order && order.id) {
        // clear any pending form
        try { sessionStorage.removeItem('ibero:pendingReservationForm'); } catch (e) {}
        router.push(`/panel/orders?orderId=${encodeURIComponent(order.id)}`);
        return;
      }
      // If we reach here, something went wrong: throw to be handled below
      throw new Error('Order creation failed: no order id returned');
    } catch (err: any) {
      // Handle auth-specific message
      console.error('Order creation failed', err);
      if (err && err.status === 401) {
        alert('Session expired, please login again');
        // ensure pending form saved and open login
        try { sessionStorage.setItem('ibero:pendingReservationForm', JSON.stringify(data)); } catch (e) {}
        if (typeof onOpenRegister === 'function') onOpenRegister(); else router.push('/auth/register');
        return;
      }
      // other errors: show message provided by backend when available
      const msg = (err && err.body && err.body.error) ? err.body.error : (err && err.message) ? err.message : 'Order creation failed. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmServerPricingAndProceed = () => {
    setServerConfirmed(true);
    setShowServerModal(false);
    setIsSubmitting(true);
    // Redirect user to the panel where payments are managed
    try {
      const orderId = pendingOrderId ?? activeDraft?.id;
      if (!orderId) throw new Error('Missing order id');
      router.push(`/panel/orders?orderId=${encodeURIComponent(orderId)}`);
      return;
    } catch (err) {
      console.error('Redirect to panel failed', err);
      alert('Failed to open your panel. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelServerPricingConfirmation = () => {
    setShowServerModal(false);
    setIsSubmitting(false);
  };

  return (
    /* Container for reservation form - no scroll on desktop, two fixed columns */
  <div className="w-full px-4 py-4">
      <style>{`@keyframes ibero-pulse { 0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.0);} 50% { box-shadow: 0 0 20px 6px rgba(250, 204, 21, 0.12);} 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.0);} }`}</style>

   {/* Main layout: CSS Grid with FIXED two columns - NEVER stacks */}
  <div
    style={{
      display: 'grid',
  gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem',
      minWidth: '700px', /* Prevents stacking by enforcing minimum width */
    }}
  >
            {/* Left column: Pricing summary, comments, submit */}
            <div className="flex flex-col h-full min-h-0">
            <div className="p-4 rounded-lg border bg-white flex-1 flex flex-col">
              <div className="w-full flex flex-col h-full min-h-0">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-gray-900">Price summary</h4>
                    <div className="flex items-center gap-4">
                      <div className="font-medium">${basePricePerTraveler.toLocaleString()}</div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 mr-1">Travelers</label>
                        <div className="inline-flex items-center border rounded-md overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(1, travelers - 1);
                              setValue('travelers', next, { shouldValidate: true, shouldDirty: true });
                            }}
                            className="px-2 py-1 text-sm bg-white hover:bg-gray-100"
                          >-
                          </button>
                          <div className="px-3 py-1 text-sm">{travelers}</div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = travelers + 1;
                              setValue('travelers', next, { shouldValidate: true, shouldDirty: true });
                            }}
                            className="px-2 py-1 text-sm bg-white hover:bg-gray-100"
                          >+
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex-1 overflow-auto text-sm text-gray-700 space-y-2">
                    {roomSupplement > 0 && (
                      <div className="flex justify-between">
                        <div>Single-traveler surcharge</div>
                        <div className="font-medium">${roomSupplement.toLocaleString()}</div>
                      </div>
                    )}

                    <div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setOptionalsOpen(true)}
                            className="text-emerald-600 font-semibold text-sm hover:underline"
                            aria-haspopup="dialog"
                            aria-controls="optionals-modal"
                          >
                            Add‑ons
                          </button>
                          <div className="font-medium">${addonsTotal.toLocaleString()}</div>
                        </div>
                        {/* Selected Add-ons List */}
                        {addonsTotal > 0 && (
                          <div className="pl-2 border-l-2 border-emerald-100 flex flex-col gap-1">
                            {addons.map(a => selectedAddons[a.key] && (
                              <div key={a.key} className="flex justify-between items-center text-[10px] text-gray-500 italic">
                                <span>{a.label}</span>
                                <span>${(a.perTraveler ? a.price * travelers : a.price).toLocaleString()}</span>
                              </div>
                            ))}
                            {extensionsList.map(ex => selectedAddons['ext:'+ex.key] && (
                              <div key={ex.key} className="flex justify-between items-center text-[10px] text-gray-500 italic">
                                <span>{ex.name} Extension ({ex.days}d)</span>
                                <span>${((ex.pricePerDay || 250) * ex.days * travelers).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <hr className="my-2" />
                    <div className="flex flex-col items-stretch">
                      <div className="flex justify-between items-baseline">
                        <div className="text-sm text-gray-600">Deposit</div>
                        <div className="text-2xl font-semibold">${depositDue.toLocaleString()}</div>
                      </div>
                        <div className="mt-1 text-xs text-gray-500 flex flex-col gap-1">
                        <div className="flex justify-between">
                        <div>Due by {depositDate}</div>
                        <div>Total: ${totalPrice.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <div>Estimated cashback (5%)</div>
                          <div>${estimatedCashback.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-700 space-y-2">
                  <div className="mt-1">
                    <label className="text-xs text-gray-500">Comments</label>
                    <textarea {...register('comments')} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Add any notes or requests (optional)" />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                      <span>I have read and agree to the </span>
                      <button type="button" onClick={() => setTermsModalOpen(true)} className="underline text-sm text-gray-700">terms &amp; conditions</button>
                    </label>
                  </div>

                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={handleSubmit(onSubmit)}
                      disabled={!isValid || isSubmitting || !termsAccepted}
                      className="px-6 py-2 bg-emerald-600 text-white text-base rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
                    >
                      {isSubmitting ? 'Confirming...' : 'Submit reservation'}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 text-center">
                    {!sbSession?.user ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onOpenRegister === 'function') return onOpenRegister();
                          return router.push('/auth/register');
                        }}
                        className="text-xs font-medium text-slate-700 hover:text-slate-900"
                        style={{ animation: 'ibero-pulse 3s infinite ease-in-out' }}
                      >
                        You need to register to book a tour.
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End of Left column */}

          {/* Right column: What's included, Optionals, Important, Need help */}
          <div ref={rightColumnRef} style={rightColumnMinHeight ? { minHeight: `${rightColumnMinHeight}px` } : undefined} className="flex flex-col space-y-3 h-full min-h-0">
            {/* What's included - first and open by default */}
            <div className="p-4 rounded-lg border bg-white min-w-0">
              <div 
                className="flex items-start justify-between cursor-pointer group"
                onClick={() => setRightPanelOpen((p) => p === 'included' ? null : 'included')}
              >
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">What&apos;s included</h3>
                <button aria-label={rightPanelOpen === 'included' ? 'Collapse included' : 'Expand included'} className="text-gray-500">
                  {rightPanelOpen === 'included' ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
              </div>
              {/* Always render list container so the white card remains visible even when data is missing */}
              <ul className={`mt-3 text-sm text-gray-700 grid grid-cols-1 gap-2 ${rightPanelOpen !== 'included' ? 'hidden' : ''}`} aria-hidden={rightPanelOpen !== 'included'}>
                {(Array.isArray(tourData?.inclusions) && tourData.inclusions.length > 0) ? (
                  tourData.inclusions.filter((inc) => !/flight/i.test(inc)).map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-green-500 mt-1" />
                      <span>{inc}</span>
                    </li>
                  ))
                ) : (
                  // Placeholder rows when inclusions are not available
                  [1, 2, 3].map((n) => (
                    <li key={n} className="flex items-start gap-2">
                      <span className="inline-block h-4 w-4 rounded bg-gray-200" />
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                    </li>
                  ))
                )}
                <li className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-green-500 mt-1" />
                  <div>24h support during the trip</div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-green-500 mt-1" />
                  <div className="font-medium">Flights from New York, Boston &amp; Toronto</div>
                </li>
              </ul>
            </div>

            {/* Optionals: render only a persistent button (no box/background) */}
            <div className="flex">
              <button type="button" onClick={() => setOptionalsOpen(true)} className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium">View optionals & add-ons</button>
            </div>

            {/* Important information (now controlled by accordion) */}
            <div className="p-4 rounded-lg border bg-white min-w-0">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setRightPanelOpen((p) => p === 'important' ? null : 'important')}
              >
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">Important information</h3>
                <button aria-label={rightPanelOpen === 'important' ? 'Collapse important information' : 'Expand important information'} className="text-gray-500">
                  {rightPanelOpen === 'important' ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
              </div>
              <div className={`mt-3 text-sm text-gray-700 space-y-2 overflow-auto max-h-48 ${rightPanelOpen !== 'important' ? 'hidden' : ''}`} aria-hidden={rightPanelOpen !== 'important'}>
                <p className="whitespace-pre-wrap">{tourData?.disclaimer ?? 'Important trip information will appear here.'}</p>
                <p>
                  Ibero guarantees an unforgettable trip, crafted with your experience at the core. The purpose of our tours is to help you discover &amp; connect with other people &amp; places of our world, promoting a type of tourism that tries to benefit all the agents involved.
                </p>
                <ul className="mt-2 space-y-1">
                  <li>Prices are indicative and may fluctuate with exchange rates.</li>
                  <li>Flights and accommodations are subject to availability at time of booking.</li>
                  <li>Substitutions for itinerary components may occur; equal or higher value guaranteed.</li>
                </ul>
              </div>
            </div>

            {/* Need help card as sibling (accordion item) */}
            <div className="p-4 rounded-lg border bg-white min-w-0">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setRightPanelOpen((p) => p === 'help' ? null : 'help')}
              >
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">Need help?</h3>
                <button aria-label={rightPanelOpen === 'help' ? 'Collapse help panel' : 'Expand help panel'} className="text-gray-500">
                  {rightPanelOpen === 'help' ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
              </div>
              <div className={`mt-3 text-sm text-gray-700 ${rightPanelOpen !== 'help' ? 'hidden' : ''}`} aria-hidden={rightPanelOpen !== 'help'}>
                <p>If you need assistance, open a support ticket and our team will follow up. Tickets can be managed from your dashboard.</p>
                <div className="mt-3">
                  <button onClick={() => setNeedHelpModalOpen(true)} className="px-3 py-2 bg-emerald-600 text-white rounded">Open support ticket</button>
                </div>
              </div>
            </div>
          </div>
          {/* End of grid (left + right columns) */}

        {/* No Add-ons Prompt Modal */}
        {showNoAddonsPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
                  <PlusIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Optional Add-ons</h3>
                <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                  Are you interested in adding any optional services (insurance, extensions, flight requests) to your reservation?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowNoAddonsPrompt(false);
                      setOptionalsOpen(true);
                    }}
                    className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                  >
                    Yes, view options
                  </button>
                  <button
                    onClick={() => {
                      // Mark as prompted so we don't show it again for this submission attempt
                      // Then trigger the form submission manually
                      setShowNoAddonsPrompt(false);
                      // Form handleSubmit already has the state, we just need to bypass the check.
                      // We can achieve this by calling onSubmit with the current form data directly,
                      // or better, update a ref/state that onSubmit checks.
                      // Since we are inside the modal, we can call handleSubmit(onSubmit)() again
                      // but we need to ensure the check inside onSubmit is bypassed.
                      // I'll add a 'bypassed' flag or similar. Wait, the easiest is to just call onSubmit.
                      handleSubmit((data) => {
                        // Small hack: if we call it here, we know the user said "I'm good".
                        // So we set a temporary flag.
                        (onSubmit as any)._prompt_bypassed = true;
                        onSubmit(data);
                      })();
                    }}
                    className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    I&apos;m good, thanks
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optionals modal (replaces inline Optional card) */}
        {optionalsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div ref={optionalsRef} className="bg-white rounded-lg p-6 max-w-2xl w-full h-[70vh] overflow-hidden">
              <div className="flex justify-end items-start">
                    <h3 className="sr-only">Optionals & Add‑ons</h3>
                    <button type="button" onClick={() => setOptionalsOpen(false)} aria-label="Close optionals" className="text-gray-500 hover:text-gray-700 text-lg leading-none">×</button>
                  </div>

                <div className="mt-4 space-y-4 text-sm text-gray-700 overflow-auto max-h-[calc(70vh-160px)]">
                  {/* Collapsible sections: Extensions (open by default) and Insurance (collapsed) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setOptionalsExpanded((s) => ({ ...s, extensions: !s.extensions }))}
                      className="w-full flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      aria-expanded={optionalsExpanded.extensions}
                    >
                      <div className="text-sm font-medium">Extensions</div>
                      {optionalsExpanded.extensions ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                    {optionalsExpanded.extensions && (
                      <div className="mt-2 space-y-2">
                        {extensionsList.map((ex) => {
                          const key = 'ext:' + ex.key;
                          const pricePerDay = ex.pricePerDay ?? 250;
                          const price = pricePerDay * ex.days * travelers;
                          return (
                            <div key={ex.key} className="flex items-center justify-between">
                              <label className="flex items-center gap-3">
                                <input type="checkbox" checked={!!selectedAddons[key]} onChange={() => toggleExtension(ex.key)} />
                                <div>
                                  <div className="text-sm font-medium">{ex.name}</div>
                                  <div className="text-xs text-gray-500">+ {ex.days} days · ${pricePerDay}/day per traveler</div>
                                </div>
                              </label>
                              <div className="text-sm font-medium">${price.toLocaleString()}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setOptionalsExpanded((s) => ({ ...s, insurance: !s.insurance }))}
                      className="w-full flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      aria-expanded={optionalsExpanded.insurance}
                    >
                      <div className="text-sm font-medium">Insurance</div>
                      {optionalsExpanded.insurance ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                    {optionalsExpanded.insurance && (
                      <div className="mt-2 space-y-2">
                        {addons.map((a) => (
                          <div key={a.key} className="flex items-center justify-between">
                            <label className="flex items-center gap-3">
                              <input type="checkbox" checked={!!selectedAddons[a.key]} onChange={() => toggleAddon(a.key)} />
                              <div>
                                <div className="text-sm font-medium">{a.label}</div>
                                <div className="text-xs text-gray-500">{a.perTraveler ? `$${a.price} per traveler` : `$${a.price}`}</div>
                              </div>
                            </label>
                            <div className="text-sm text-gray-500"><button onClick={() => setIsDetailsOpen((s) => (s === a.key ? null : a.key))} className="underline text-xs">Details</button></div>
                          </div>
                        ))}
                        {isDetailsOpen && (
                          <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
                            {(() => {
                              const found = addons.find(x => x.key === isDetailsOpen!);
                              return found ? <div>{found.info}</div> : <div>Select an addon to see details.</div>;
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setOptionalsExpanded((s) => ({ ...s, flights: !s.flights }))}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                    aria-expanded={optionalsExpanded.flights}
                  >
                    <div className="text-sm font-medium">Flights from other destinations</div>
                    {optionalsExpanded.flights ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>
                  {optionalsExpanded.flights && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Flights from other origins are available upon request. Price on request — please contact our team or include a note in the comments.</div>
                      <div className="mt-3">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={!!selectedAddons['flightRequest']} onChange={(e) => {
                            setSelectedAddons((s) => ({ ...s, flightRequest: !s['flightRequest'] }));
                            // update the persisted trip preference in the store
                            updateTrip({ addons: { ...(activeDraft?.trip?.addons || {}), flightRequest: !selectedAddons['flightRequest'] } as any });
                          }} />
                          <span className="text-sm font-medium">Request flights from other origins (price on request)</span>
                        </label>
                        {selectedAddons['flightRequest'] && (
                          <div className="mt-2">
                            <input type="text" placeholder="Preferred departure airport (e.g. LAX)" value={(activeDraft?.trip as any)?.preferredDepartureAirport || ''} onChange={(e) => updateTrip({ preferredDepartureAirport: e.target.value } as any)} className="w-full rounded-lg border px-2 py-1 text-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setOptionalsOpen(false)} className="px-4 py-2 rounded border">Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Need help modal */}
        {needHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full h-[60vh] overflow-hidden">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">Open a support ticket</h3>
                <button type="button" onClick={() => setNeedHelpModalOpen(false)} aria-label="Close support ticket" className="text-gray-500 hover:text-gray-700 text-lg leading-none">×</button>
              </div>
              <p className="text-sm text-gray-600 mt-2">Write your message below and our team will get back to you. Tickets appear in your dashboard under "Support".</p>

              <div className="mt-4 overflow-auto max-h-[calc(60vh-160px)]">
                <label className="text-xs text-gray-500">Message</label>
                <textarea value={needHelpMessage} onChange={(e) => setNeedHelpMessage(e.target.value)} rows={6} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Describe your question or request..." />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setNeedHelpModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
                <button
                  onClick={async () => {
                    if (!sbSession?.user) {
                      alert('You must be logged in to create a support ticket.');
                      if (typeof onOpenRegister === 'function') onOpenRegister();
                      return;
                    }
                    if (!needHelpMessage.trim()) {
                      alert('Please enter a message for the support ticket.');
                      return;
                    }
                    setNeedHelpSubmitting(true);
                    try {
                      const res = await apiFetch('/api/support/tickets', {
                        method: 'POST',
                        body: JSON.stringify({ message: needHelpMessage }),
                      });
                      if (!res.ok) throw new Error('Failed to create ticket');
                      const data = await res.json();
                      setNeedHelpModalOpen(false);
                      setNeedHelpMessage('');
                      alert(`Support ticket created (ID: ${data.id}). You can check its status in your dashboard.`);
                    } catch (err) {
                      console.error(err);
                      alert('Failed to create support ticket. Please try again later.');
                    } finally {
                      setNeedHelpSubmitting(false);
                    }
                  }}
                  disabled={needHelpSubmitting}
                  className="px-4 py-2 rounded bg-emerald-600 text-white"
                >
                  {needHelpSubmitting ? 'Submitting...' : 'Submit ticket'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        {/* Terms & Conditions modal */}
        {termsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full h-[70vh] overflow-hidden">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold">Terms &amp; Conditions</h3>
                <button type="button" onClick={() => setTermsModalOpen(false)} aria-label="Close terms" className="text-gray-500 hover:text-gray-700 text-lg leading-none">×</button>
              </div>
              <div className="mt-4 overflow-auto max-h-[calc(70vh-160px)] text-sm text-gray-700 space-y-4">
                <div>
                  <p className="font-semibold">Terms &amp; Conditions</p>
                  <p>1. Scope of Services
                  Ibero acts as a travel organizer and/or intermediary for travel services that may include:
                  </p>
                  <ul className="list-disc ml-5">
                    <li>Organized tours</li>
                    <li>International and domestic flights</li>
                    <li>Hotel and other accommodation bookings</li>
                    <li>Ground transportation</li>
                    <li>Activities and excursions</li>
                    <li>Optional travel insurance products</li>
                  </ul>
                  <p className="mt-2">The specific services included in each booking will be detailed in the Client’s itinerary or booking confirmation.</p>
                </div>
                <div>
                  <p className="font-semibold">2. Booking and Payment</p>
                  <p>2.1. A booking is considered confirmed once payment has been received and written confirmation has been issued by Ibero.</p>
                  <p>2.2. By completing the payment, the Client authorizes Ibero to proceed with the organization and purchase of the travel services on the Client’s behalf.</p>
                </div>
                <div>
                  <p className="font-semibold">3. Refund Policy and Cooling-Off Period</p>
                  <p>3.1. 100% Refund Guarantee (First 48 Hours) Ibero guarantees a 100% refund of the amount paid, excluding bank or transfer fees, if the Client cancels the booking within 48 hours of payment, provided that no flight tickets or hotel reservations have been issued in the Client’s name.</p>
                  <p>3.2. After 48 Hours After the initial 48-hour period, Ibero will proceed with the purchase of airline tickets, hotel reservations, and other services in the Client's name. From that moment onward, refunds are not guaranteed.</p>
                </div>
                <div>
                  <p className="font-semibold">4. Cancellations After Ticketing and Reservations</p>
                  <p>4.1. In the event of cancellation after flights and/or accommodation have been booked, Ibero will always make reasonable efforts to recover and refund the maximum possible amount that does not result in financial loss to Ibero.</p>
                  <p>4.2. Any refund will depend on airline fare rules, hotel and supplier cancellation policies and third-party service provider conditions.</p>
                  <p>4.3. Ibero does not guarantee the refund of the total amount paid after bookings have been executed.</p>
                </div>
                <div>
                  <p className="font-semibold">5. Change of Traveler (Name Change)</p>
                  <p>5.1. Ibero will always attempt to facilitate last-minute changes of travelers, subject to airline, hotel, and supplier policies.</p>
                  <p>5.2. Name changes may involve additional costs, restrictions, or may not be permitted by certain providers.</p>
                  <p>5.3. Ibero does not guarantee that a traveler change will be possible, nor that it will be free of charge.</p>
                </div>
                <div>
                  <p className="font-semibold">6. Flights</p>
                  <p>6.1. Flight tickets are issued according to airline rules and are generally non-refundable and non-changeable, unless explicitly stated otherwise by the airline.</p>
                  <p>6.2. Ibero is not responsible for airline schedule changes, delays, cancellations, overbooking, baggage loss or damage, or airline operational decisions.</p>
                </div>
                <div>
                  <p className="font-semibold">7. Accommodation</p>
                  <p>7.1. Hotel reservations are subject to the terms and conditions of the respective accommodation providers.</p>
                  <p>7.2. Room types, amenities, and services are based on information provided by suppliers and may vary slightly from descriptions.</p>
                </div>
                <div>
                  <p className="font-semibold">8. Optional Travel Insurance</p>
                  <p>8.1. Travel insurance is optional and may be offered separately.</p>
                  <p>8.2. Insurance products may include health or medical travel insurance, trip cancellation insurance, and other travel-related coverage.</p>
                  <p>8.3. The specific coverage, exclusions, and conditions depend entirely on the insurance provider.</p>
                  <p>8.4. Ibero acts solely as an intermediary and is not responsible for claim approvals, denials, or coverage disputes.</p>
                </div>
                <div>
                  <p className="font-semibold">9. Client Responsibilities</p>
                  <p>The Client is responsible for providing accurate personal and travel information, ensuring passports, visas, and required documentation are valid, complying with health and entry requirements, and arriving on time for flights, transfers, and activities.</p>
                </div>
                <div>
                  <p className="font-semibold">10. Force Majeure</p>
                  <p>Ibero shall not be held liable for cancellations, changes, or losses caused by events beyond its control, including but not limited to natural disasters, pandemics, government actions, war or civil unrest, and airline strikes.</p>
                </div>
                <div>
                  <p className="font-semibold">11. Limitation of Liability</p>
                  <p>Ibero's liability is limited to the role of travel organizer and/or intermediary. Ibero shall not be liable for indirect, incidental, or consequential damages arising from travel services provided by third parties.</p>
                </div>
                <div>
                  <p className="font-semibold">12. Governing Law and Jurisdiction</p>
                  <p>These Terms shall be governed by and interpreted in accordance with the applicable laws of the jurisdiction in which Ibero operates. Any disputes shall be subject to the competent courts of that jurisdiction.</p>
                </div>
                <div>
                  <p className="font-semibold">13. Acceptance of Terms</p>
                  <p>By booking with Ibero, the Client acknowledges and accepts these Terms and Conditions in full.</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setTermsModalOpen(false)} className="px-4 py-2 rounded border">Close</button>
                <button onClick={() => { setTermsAccepted(true); setTermsModalOpen(false); }} className="px-4 py-2 rounded bg-emerald-600 text-white">Read &amp; agreed</button>
              </div>
            </div>
          </div>
        )}
        {/* Server pricing confirmation modal */}
        {showServerModal && activeDraft?.server_pricing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 max-w-xl w-full h-[70vh] overflow-hidden">
              <h3 className="text-lg font-semibold">Server price confirmation</h3>
              <p className="text-sm text-gray-600 mt-2">The server has a different total than your estimate. Please review and confirm to proceed.</p>
              <div className="mt-4 text-sm text-gray-700 space-y-2 overflow-auto max-h-[calc(70vh-160px)]">
                <div className="flex justify-between">
                  <div>Base price (per traveler)</div>
                  <div className="font-medium">${activeDraft.server_pricing.base_price_per_traveler_usd?.toLocaleString()}</div>
                </div>
                <div className="flex justify-between">
                  <div>Base total</div>
                  <div className="font-medium">${activeDraft.server_pricing.base_price_total_usd?.toLocaleString()}</div>
                </div>
                <div className="flex justify-between">
                  <div>Deposit total</div>
                  <div className="font-medium">${activeDraft.server_pricing.deposit_total_usd?.toLocaleString()}</div>
                </div>
                <div className="flex justify-between">
                  <div>Total</div>
                  <div className="font-semibold">${activeDraft.server_pricing.total_guaranteed_price_usd?.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={cancelServerPricingConfirmation} className="px-4 py-2 rounded border">Cancel</button>
                <button onClick={confirmServerPricingAndProceed} className="px-4 py-2 rounded bg-emerald-600 text-white">I accept the server total</button>
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
}
