"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
// NextAuth removed — session logic here is legacy and should rely on Supabase if resurrected.
import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/db/supabaseClient';
import CardShell from '../../components/panel/CardShell';
import KPIStrip from '../../components/panel/KPIStrip';
import Button from '../../components/ui/Button';
import TourCreator from '../../components/TourCreator';
import useReservationStore from '../../lib/reservations/store';
import type { ReservationProfile, PaymentRecord } from '../../lib/reservations/types';
import { listOrders, createOrder } from '../../lib/domain/orders/api';
import type { CreateOrderInput } from '../../lib/domain/orders/types';
import { getUserProfile, patchUserProfile } from '../../lib/domain/profile/api';
import { createCheckoutSession } from '../../lib/domain/payments/api';
import { publishLandingScrollTo } from '../../lib/navigation/intents';

function PanelPageContent() {

  // minimal hooks and store bindings required by the effects below
  const router = useRouter();
  const searchParams = useSearchParams();

  // Legacy file: replace NextAuth useSession with Supabase client session
  const [session, setSession] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!supabaseClient) return;
        const { data: { session: s } = {} as any } = await supabaseClient.auth.getSession();
        if (mounted) setSession(s ?? null);
      } catch (e) {
        if (mounted) setSession(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const { registerProfile } = useReservationStore();

  const [profileForm, setProfileForm] = React.useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    countryCode: '+34',
    marketingOptIn: true,
  });

  // additional store bindings and safe defaults to avoid runtime ReferenceErrors
  const {
    profile = null,
    activeDraft = null,
    activeReservationId = null,
    reservations = [],
    setActiveTour = () => {},
    setActiveReservation = (_: any) => {},
    addTraveler = (_: any) => {},
    removeTraveler = (_: any) => {},
    addPayment = (_: any) => {},
    updatePaymentStatus = (_: any, __: any) => {},
    submitReservation: submitReservationLocal = () => null,
    submitReservationToServer = async () => null,
  } = useReservationStore() as any;

  // --- Orders state (domain layer) ---
  const [orders, setOrders] = React.useState<any[]>([]);
  const orderIdFromParams = searchParams?.get?.('orderId') || null;

  // Fetch orders from domain layer on mount
  React.useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      try {
        const res = await listOrders();
        if (!cancelled && res?.orders) setOrders(res.orders);
      } catch {
        // ignore for now, keep empty
      }
    }
    fetchOrders();
    return () => { cancelled = true; };
  }, []);

  const [travelerForm, setTravelerForm] = React.useState<any>({
    fullName: '',
    birthDate: '',
    passportNumber: '',
    nationality: '',
    dietaryNeeds: '',
    emergencyContact: '',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = React.useState<any>({
    label: '',
    method: 'wire',
    status: 'pending',
    amount: '',
    last4: '',
    provider: '',
  });

  const [error, setError] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [showTourCreator, setShowTourCreator] = React.useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = React.useState(false);
  const [callDate, setCallDate] = React.useState('');
  const [callTime, setCallTime] = React.useState('');
  const [callNotes, setCallNotes] = React.useState('');

  const addonLabels: Record<string, string> = {};
  const welcomeCopy: string | null = null;

  // Confirm modal state and checkout flow
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = React.useState(false);

  async function handleConfirmAndCheckout() {
    setIsProcessingCheckout(true);
    setError(null);
    setStatusMessage('Creating reservation and preparing checkout…');
    try {
      // 1) Persist reservation to server (create order via domain layer)
      // Use the current draft from the reservation store as input
      const draft = activeDraft;
      if (!draft) throw new Error('No active reservation draft');
      const input: CreateOrderInput = {
        type: 'fixed',
        tourId: draft.tourId,
        tourTitle: draft.tourTitle,
        travelersCount: draft.travelers?.length || 0,
        extras: (draft.trip?.addons || {}) as Record<string, unknown>,
      };
      const res = await createOrder(input);
      const order = res?.order;
      if (!order || !order.id) throw new Error('Could not create order on server');

      // 2) Create Stripe checkout session via domain wrapper (server route expects orderId)
      const data = await createCheckoutSession({ orderId: order.id });
      const url = data?.url;
      if (!url) throw new Error('Stripe did not return a checkout URL');

      // Redirect to Stripe Checkout
      window.location.href = url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setIsProcessingCheckout(false);
      setStatusMessage(null);
    }
  }

  // Listen for external requests to open confirm modal (sticky CTA)
  React.useEffect(() => {
    function onOpen() {
      setShowConfirmModal(true);
    }
    window.addEventListener('open-panel-confirm', onOpen as any);
    return () => window.removeEventListener('open-panel-confirm', onOpen as any);
  }, []);



  // Initial load of profile from Supabase when user is authenticated
  React.useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!session?.user) return;
      try {
        const data = await getUserProfile();
        if (cancelled || !data?.profile) return;

        const row = data.profile as any;
        const merged: ReservationProfile = {
          firstName: row.first_name || profileForm.firstName || '',
          lastName: row.last_name || profileForm.lastName || '',
          email: row.email || profileForm.email || (session.user.email ?? ''),
          phone: row.phone || profileForm.phone || '',
          password: profileForm.password || '',
          countryCode: row.country_code || profileForm.countryCode || '+34',
          marketingOptIn:
            typeof row.marketing_opt_in === 'boolean'
              ? row.marketing_opt_in
              : profileForm.marketingOptIn ?? true,
        };

        // Update local form and reservation store to reflect Supabase record
        setProfileForm(merged);
        registerProfile(merged);
      } catch {
        // Silently ignore; panel still works with local state only
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session?.user, registerProfile]);

  React.useEffect(() => {
    // read latest profile from the reservation store binding (do not call hooks inside effects)
    const current = profile as ReservationProfile | null;
    setProfileForm((prev) => ({
      ...prev,
      firstName: current?.firstName || prev.firstName || '',
      lastName: current?.lastName || prev.lastName || '',
      email: current?.email || (session?.user?.email ?? prev.email ?? ''),
      phone: current?.phone || prev.phone || '',
      countryCode: current?.countryCode || prev.countryCode || '+34',
      marketingOptIn: current?.marketingOptIn ?? (prev.marketingOptIn ?? true),
    }));
  }, [session?.user, profile]);

  const sortedReservations = React.useMemo(
    () => [...reservations].sort((a, b) => new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()),
    [reservations],
  );

  const activeReservation = React.useMemo(() => {
    if (orders.length) {
      const byParam = orderIdFromParams && orders.find((o) => o.id === orderIdFromParams);
      if (byParam) return byParam as any;
      return orders[0] as any;
    }
    if (activeDraft && activeDraft.status !== 'draft') return activeDraft;
    if (sortedReservations.length) return sortedReservations[0];
    return activeDraft || null;
  }, [orders, orderIdFromParams, activeDraft, sortedReservations]);

  const travelerCount = (activeReservation as any)?.travelers?.length || 0;
  const paymentCount = (activeReservation as any)?.payments?.length || 0;
  const addonList = Object.entries((activeReservation as any)?.trip?.addons || {}).filter(([, enabled]) => Boolean(enabled));
  const departure = (activeReservation as any)?.trip?.fixedDeparture;

  const showEmpty = !activeReservation && sortedReservations.length === 0;
  const showOnboarding = !onboardingDismissed && !profile?.firstName && !profile?.phone;

  // derive KPI values from store data
  const totalTravelers = reservations.reduce((s: number, r: any) => s + ((r?.travelers?.length as number) || 0), 0) || travelerCount;
  const totalPayments = reservations.reduce((s: number, r: any) => s + ((r?.payments?.length as number) || 0), 0) || paymentCount;
  const roomType = (activeReservation as any)?.trip?.roomType || '—';
  const reservationsCount = Math.max(reservations.length, sortedReservations.length, 0);

  // formatter for USD amounts shown in modal
  const usdFmt = React.useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }), []);

  const requireActiveReservation = () => {
    if (!activeReservation) {
      setError('Create or select a reservation before adding details.');
      return false;
    }
    return true;
  };

  const clearStatus = () => {
    setTimeout(() => {
      setStatusMessage(null);
    }, 2200);
  };

  const handleStartDepositPayment = async () => {
    const current = activeReservation as any;
    if (!current || !current.id) {
      setError('Select a reservation before starting the deposit.');
      clearStatus();
      return;
    }
    try {
      setStatusMessage('Preparing Stripe checkout…');
      setError(null);
      const data = await createCheckoutSession({ orderId: current.id });
      const url = data?.url;
      if (!url) {
        throw new Error('Stripe did not return a checkout URL.');
      }
      window.location.href = url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while starting payment.');
      clearStatus();
    }
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Update local reservation store so panel remains snappy
    registerProfile(profileForm);

    // Also persist to Supabase when user is authenticated
    try {
      setError(null);
      setStatusMessage('Saving traveler account…');

      await patchUserProfile({
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        email: profileForm.email || session?.user?.email || undefined,
        phone: profileForm.phone,
        country_code: profileForm.countryCode,
        marketing_opt_in: profileForm.marketingOptIn,
      });

      setStatusMessage('Traveler account updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while saving profile');
    } finally {
      clearStatus();
    }
  };

  const handleTravelerSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requireActiveReservation()) return;
    if (!travelerForm.fullName || !travelerForm.passportNumber) {
      setError('Traveler needs a name and passport number.');
      return;
    }
    addTraveler({
      fullName: travelerForm.fullName,
      birthDate: travelerForm.birthDate,
      passportNumber: travelerForm.passportNumber,
      nationality: travelerForm.nationality,
      dietaryNeeds: travelerForm.dietaryNeeds || undefined,
      emergencyContact: travelerForm.emergencyContact || undefined,
      notes: travelerForm.notes || undefined,
    });
    setTravelerForm({
      fullName: '',
      birthDate: '',
      passportNumber: '',
      nationality: travelerForm.nationality,
      dietaryNeeds: '',
      emergencyContact: '',
      notes: '',
    });
    setStatusMessage('Traveler added');
    setError(null);
    clearStatus();
  };

  const handlePaymentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requireActiveReservation()) return;
    if (!paymentForm.label) {
      setError('Payment needs a short label.');
      return;
    }
    const numericAmount = paymentForm.amount ? Number(paymentForm.amount) : undefined;
    if (paymentForm.amount && Number.isNaN(numericAmount)) {
      setError('Payment amount has to be a number.');
      return;
    }
    addPayment({
      label: paymentForm.label,
      method: paymentForm.method,
      status: paymentForm.status,
      amount: numericAmount,
      last4: paymentForm.last4 || undefined,
      provider: paymentForm.provider || undefined,
    });
    setPaymentForm((prev) => ({ ...prev, amount: '', last4: '' }));
    setStatusMessage('Payment recorded');
    setError(null);
    clearStatus();
  };

  const handleBackToLanding = () => {
    router.push('/');
  };

  const handleCyclePaymentStatus = (id: string, status: PaymentRecord['status']) => {
    const next: PaymentRecord['status'] = status === 'pending' ? 'authorized' : status === 'authorized' ? 'paid' : 'pending';
    updatePaymentStatus(id, next);
  };

  const handleBookCall = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('Call request submitted — we will email you a Meet link.');
    setError(null);
    clearStatus();
  };

  // modal refs for basic focus management
  const confirmButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const modalRef = React.useRef<HTMLDivElement | null>(null);

  // when modal opens, focus confirm button, trap Escape, and lock body scroll
  React.useEffect(() => {
    if (!showConfirmModal) {
      document.body.style.overflow = '';
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowConfirmModal(false);
    };
    window.addEventListener('keydown', onKey);
    // focus the confirm button (micro-tick to allow element to mount)
    setTimeout(() => confirmButtonRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showConfirmModal]);

  // --- JSX ---
  return (
    <div
      ref={panelRef}
      className={
        `min-h-screen transition-colors duration-300 ` +
        (isDarkMode
          ? 'bg-gradient-to-b from-[#03000f] via-[#050018] to-[#02000a] text-white'
          : 'bg-gradient-to-b from-[#f6f4ff] via-[#f0f4ff] to-[#ffffff] text-slate-900')
      }
    >
      <div data-panel-anim>
        <header
          className={
            `border-b backdrop-blur transition-colors duration-300 ` +
            (isDarkMode
              ? 'border-white/10 bg-gradient-to-r from-[#04000f]/80 via-[#080427]/80 to-[#04000f]/80'
              : 'border-slate-200 bg-gradient-to-r from-white/80 via-slate-50/90 to-white/80')
          }
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p
                className={
                  `text-xs uppercase tracking-[0.25em] ` +
                  (isDarkMode ? 'text-white/60' : 'text-slate-500')
                }
              >
                Ibero Panel
              </p>
              <h1 className="mt-1 text-3xl font-semibold">Your trips &amp; requests</h1>
              <p
                className={
                  `mt-2 text-sm ` +
                  (isDarkMode ? 'text-white/70' : 'text-slate-600')
                }
              >
                {welcomeCopy
                  ? welcomeCopy
                  : 'Manage reservations, submit traveler info, track payments, and request custom routes.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-sm"
                style={{
                  borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.7)',
                  backgroundColor: isDarkMode ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.9)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsDarkMode(false)}
                  className={
                    'rounded-full px-3 py-1 transition-colors ' +
                    (isDarkMode
                      ? 'text-slate-300'
                      : 'bg-slate-900 text-slate-50 shadow-sm')
                  }
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setIsDarkMode(true)}
                  className={
                    'rounded-full px-3 py-1 transition-colors ' +
                    (isDarkMode
                      ? 'bg-slate-100 text-slate-900 shadow-sm'
                      : 'text-slate-500')
                  }
                >
                  Dark
                </button>
              </div>

              <Button variant={isDarkMode ? 'ghost' : 'primary'} onClick={handleBackToLanding}>
                Back to landing
              </Button>
              <Button variant="primary" onClick={() => setShowTourCreator(true)}>
                Launch Tour Creator
              </Button>
            </div>
          </div>
        </header>

  <KPIStrip travelers={totalTravelers} payments={totalPayments} roomType={roomType} reservations={reservationsCount} />

  <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)] items-start">
            <div className="space-y-6">
              {(error || statusMessage) && (
            <div
              className={
                'rounded-xl px-4 py-3 text-sm border ' +
                (isDarkMode
                  ? 'border-white/10 bg-white/10'
                  : 'border-slate-200 bg-white/80 shadow-sm')
              }
            >
              {error ? (
                <p className={isDarkMode ? 'text-rose-200' : 'text-red-600'}>{error}</p>
              ) : (
                <p className={isDarkMode ? 'text-emerald-200' : 'text-emerald-700'}>{statusMessage}</p>
              )}
            </div>
          )}

          {showOnboarding && (
            <section
              className={
                'rounded-2xl border p-5 ' +
                (isDarkMode
                  ? 'border-indigo-400/40 bg-indigo-900/20'
                  : 'border-indigo-100 bg-indigo-50')
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p
                    className={
                      'text-xs font-semibold uppercase tracking-[0.3em] ' +
                      (isDarkMode ? 'text-indigo-200' : 'text-indigo-500')
                    }
                  >
                    First steps
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">Complete your traveler profile</h2>
                  <p className={isDarkMode ? 'text-sm text-indigo-100' : 'text-sm text-slate-600'}>
                    We&apos;ll use this to pre-fill reservations and keep your traveler cards in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('traveler-account');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={
                      'inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold ' +
                      (isDarkMode
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-900 text-slate-50')
                    }
                  >
                    Go to account
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingDismissed(true)}
                    className={
                      'text-xs underline-offset-4 ' +
                      (isDarkMode ? 'text-indigo-100/80 hover:text-indigo-100' : 'text-slate-500 hover:text-slate-700')
                    }
                  >
                    I&apos;ll do this later
                  </button>
                </div>
              </div>
            </section>
          )}

          {showEmpty ? (
            <section
              className={
                'rounded-2xl border p-6 text-center ' +
                (isDarkMode
                  ? 'border-white/10 bg-white/5'
                  : 'border-slate-200 bg-white/90 shadow-sm')
              }
            >
              <h2 className="text-2xl font-semibold">No reservations yet</h2>
              <p
                className={
                  'mt-2 text-sm ' +
                  (isDarkMode ? 'text-white/70' : 'text-slate-600')
                }
              >
                Start on a tour page, reserve a departure, and you&apos;ll see it appear here instantly.
              </p>
            </section>
          ) : (
            <>
              <section className={'grid gap-4 md:grid-cols-3 ' + (isDarkMode ? 'text-white' : 'text-slate-900')}>
                <CardShell title="Travelers" subtitle={travelerCount ? `${travelerCount} added` : 'Awaiting roster'}>
                  {/* content moved below into traveler roster region */}
                </CardShell>

                <CardShell title="Payments" subtitle={paymentCount ? `${paymentCount} tracked` : 'Add deposit info'}>
                  {/* payments content rendered below */}
                </CardShell>

                <CardShell title="Room type" subtitle={activeReservation?.trip?.roomType || '—'}>
                  <p className={isDarkMode ? 'text-xs text-white/60' : 'text-xs text-slate-600'}>Fixed departure inventory</p>
                </CardShell>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className={
                    'rounded-xl border p-4 ' +
                    (isDarkMode
                      ? 'border-white/10 bg-black/40'
                      : 'border-slate-200 bg-white')
                  }
                >
                  <h3 className="text-base font-semibold">Traveler roster</h3>
                  {activeReservation?.travelers?.length ? (
                    <div className="mt-3 space-y-3">
                      {activeReservation.travelers.map((traveler: any) => (
                        <div
                          key={traveler.id}
                          className={
                            'rounded-lg border p-3 ' +
                            (isDarkMode
                              ? 'border-white/10 bg-white/5'
                              : 'border-slate-200 bg-slate-50')
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{traveler.fullName}</p>
                              <p className={isDarkMode ? 'text-xs text-white/60' : 'text-xs text-slate-600'}>
                                Passport {traveler.passportNumber || '—'} · {traveler.nationality}
                              </p>
                              {traveler.dietaryNeeds && (
                                <p className={isDarkMode ? 'text-xs text-amber-300' : 'text-xs text-amber-700'}>
                                  Dietary: {traveler.dietaryNeeds}
                                </p>
                              )}
                              {traveler.emergencyContact && (
                                <p className={isDarkMode ? 'text-xs text-white/60' : 'text-xs text-slate-600'}>
                                  Emergency: {traveler.emergencyContact}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTraveler(traveler.id)}
                              className={
                                'text-xs uppercase tracking-wide ' +
                                (isDarkMode
                                  ? 'text-rose-200/80 hover:text-rose-200'
                                  : 'text-rose-600 hover:text-rose-700')
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      className={
                        'mt-3 text-sm ' +
                        (isDarkMode ? 'text-white/70' : 'text-slate-600')
                      }
                    >
                      We&apos;ll remind you to add traveler passports after confirming the reservation.
                    </p>
                  )}
                </div>

                <div
                  className={
                    'rounded-xl border p-4 ' +
                    (isDarkMode
                      ? 'border-white/10 bg-black/40'
                      : 'border-slate-200 bg-white')
                  }
                >
                  <h3 className="text-base font-semibold">Payment tracker</h3>
                  {activeReservation?.payments?.length ? (
                    <div className="mt-3 space-y-3">
                      {activeReservation.payments.map((payment: any) => (
                        <div
                          key={payment.id}
                          className={
                            'rounded-lg border p-3 ' +
                            (isDarkMode
                              ? 'border-white/10 bg-white/5'
                              : 'border-slate-200 bg-slate-50')
                          }
                        >
                          <div className="flex items-center justify-between text-sm">
                            <p className="font-medium">{payment.label}</p>
                            <button
                              type="button"
                              onClick={() => handleCyclePaymentStatus(payment.id, payment.status)}
                              className={
                                'text-xs uppercase tracking-wide ' +
                                (payment.status === 'paid'
                                  ? isDarkMode
                                    ? 'text-emerald-300'
                                    : 'text-emerald-700'
                                  : payment.status === 'authorized'
                                    ? isDarkMode
                                      ? 'text-sky-300'
                                      : 'text-sky-700'
                                    : isDarkMode
                                      ? 'text-white/60 hover:text-white'
                                      : 'text-slate-600 hover:text-slate-800')
                              }
                            >
                              {payment.status}
                            </button>
                          </div>
                          <p className={isDarkMode ? 'text-xs text-white/60' : 'text-xs text-slate-600'}>
                            {payment.method.toUpperCase()} · {payment.amount ? `€${payment.amount.toFixed(0)}` : 'amount pending'}
                          </p>
                          {(payment.provider || payment.last4) && (
                            <p className={isDarkMode ? 'text-xs text-white/50' : 'text-xs text-slate-500'}>
                              {payment.provider} {payment.last4 && `• ****${payment.last4}`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      className={
                        'mt-3 text-sm ' +
                        (isDarkMode ? 'text-white/70' : 'text-slate-600')
                      }
                    >
                      Add wire receipts or card intents so our team has immediate visibility.
                    </p>
                  )}
                </div>
              </div>

              <div
                className={
                  'rounded-xl border p-4 ' +
                  (isDarkMode
                    ? 'border-white/10 bg-black/40'
                    : 'border-slate-200 bg-white')
                }
              >
                <h3 className="text-base font-semibold">Add-ons</h3>
                {addonList.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                    {addonList.map(([key]) => (
                      <li
                        key={key}
                        className={
                          'rounded-full border px-3 py-1 ' +
                          (isDarkMode
                            ? 'border-white/20 text-white/80'
                            : 'border-slate-300 text-slate-800 bg-slate-50')
                        }
                      >
                        {addonLabels[key] || key}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className={
                      'mt-2 text-sm ' +
                      (isDarkMode ? 'text-white/70' : 'text-slate-600')
                    }
                  >
                    No extras selected. You can request custom segments via Tour Creator.
                  </p>
                )}
              </div>

              <div
                className={
                  'rounded-xl border p-4 ' +
                  (isDarkMode
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-emerald-200 bg-emerald-50')
                }
              >
                <h3 className="text-base font-semibold">Finalize reservation</h3>
                <p
                  className={
                    'mt-1 text-sm ' +
                    (isDarkMode ? 'text-white/70' : 'text-emerald-900')
                  }
                >
                  Ready once your profile, at least one traveler, and payment intent are in place.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div
                    className={
                      'rounded-lg border px-2 py-2 ' +
                      (profile
                        ? isDarkMode
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-50'
                          : 'border-emerald-400 bg-emerald-100 text-emerald-900'
                        : isDarkMode
                          ? 'border-white/20 text-white/60'
                          : 'border-slate-200 text-slate-500')
                    }
                  >
                    Profile
                  </div>
                  <div
                    className={
                      'rounded-lg border px-2 py-2 ' +
                      (((activeReservation as any)?.travelers?.length || 0) > 0
                        ? isDarkMode
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-50'
                          : 'border-emerald-400 bg-emerald-100 text-emerald-900'
                        : isDarkMode
                          ? 'border-white/20 text-white/60'
                          : 'border-slate-200 text-slate-500')
                    }
                  >
                    Travelers
                  </div>
                  <div
                    className={
                      'rounded-lg border px-2 py-2 ' +
                      (((activeReservation as any)?.payments?.length || 0) > 0
                        ? isDarkMode
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-50'
                          : 'border-emerald-400 bg-emerald-100 text-emerald-900'
                        : isDarkMode
                          ? 'border-white/20 text-white/60'
                          : 'border-slate-200 text-slate-500')
                    }
                  >
                    Payments
                  </div>
                </div>
                <Button className="mt-4 w-full" variant="primary" onClick={() => setShowConfirmModal(true)}>
                  Pay deposit via Stripe
                </Button>
                <p
                  className={
                    'mt-2 text-xs ' +
                    (isDarkMode ? 'text-white/70' : 'text-emerald-900')
                  }
                >
                  Status: {activeReservation?.status || 'draft'} · {activeReservation?.referenceCode || 'Reference pending'}
                </p>
              </div>
            </>
          )}
            </div>

            <aside className="space-y-6">
              <section
                className={
                  'rounded-2xl border p-5 ' +
                  (isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white shadow-sm')
                }
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Reservations ({sortedReservations.length})</h3>
                  <Button size="sm" onClick={() => { publishLandingScrollTo('tour-2026'); router.push('/'); }}>Book another</Button>
                </div>
                <div className="mt-4 space-y-3">
                  {sortedReservations.map((reservation) => (
                    <button
                      key={reservation.id}
                      onClick={() => setActiveReservation(reservation.id)}
                      className={
                        'w-full rounded-xl border px-4 py-3 text-left text-sm transition ' +
                        ((activeReservation?.id || activeReservationId) === reservation.id
                          ? isDarkMode
                            ? 'border-white bg-white/10'
                            : 'border-slate-300 bg-slate-50'
                          : isDarkMode
                            ? 'border-white/10 hover:border-white/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white')
                      }
                    >
                      <p className="font-semibold">{reservation.tourTitle}</p>
                      <p className={isDarkMode ? 'text-xs text-white/60' : 'text-xs text-slate-600'}>
                        {reservation.referenceCode || 'Pending ref'} · {reservation.status}
                      </p>
                      <p className={isDarkMode ? 'text-xs text-white/60' : 'text-xs text-slate-500'}>
                        {reservation.trip?.fixedDeparture?.label || 'Departure pending'}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              <section
                className={
                  'rounded-2xl border p-5 ' +
                  (isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white shadow-sm')
                }
              >
                <h3 className="text-base font-semibold">Traveler account</h3>
                <p className={isDarkMode ? 'text-xs text-white/70' : 'text-xs text-slate-600'}>
                  Save your profile to create the account that powers the panel.
                </p>
                <form onSubmit={handleProfileSubmit} className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-black">
                    <input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} placeholder="First name" className="rounded-lg border border-black/10 px-2 py-2 text-sm" />
                    <input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} placeholder="Last name" className="rounded-lg border border-black/10 px-2 py-2 text-sm" />
                    <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Email" className="col-span-2 rounded-lg border border-black/10 px-2 py-2 text-sm" />
                    <div className="flex gap-2">
                      <select value={profileForm.countryCode} onChange={(e) => setProfileForm({ ...profileForm, countryCode: e.target.value })} className="rounded-lg border border-black/10 px-2 text-sm">
                        <option value="+34">+34 ES</option>
                        <option value="+351">+351 PT</option>
                        <option value="+1">+1 US</option>
                      </select>
                      <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone" className="flex-1 rounded-lg border border-black/10 px-2 py-2 text-sm" />
                    </div>
                    <input type="password" value={profileForm.password || ''} onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })} placeholder="Create password" className="col-span-2 rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  </div>
                  <label className={
                    'flex items-center gap-2 text-xs ' +
                    (isDarkMode ? 'text-white' : 'text-slate-700')
                  }>
                    <input type="checkbox" checked={profileForm.marketingOptIn ?? true} onChange={(e) => setProfileForm({ ...profileForm, marketingOptIn: e.target.checked })} />
                    Email me departure alerts
                  </label>
                  <Button type="submit" className="w-full" variant="ghost">Save traveler profile</Button>
                  <p className={isDarkMode ? 'text-xs text-white/60' : 'text-xs text-slate-600'}>
                    Status: {profile ? 'Synced' : 'Pending setup'}
                  </p>
                </form>
              </section>

              <section
                className={
                  'rounded-2xl border p-5 ' +
                  (isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white shadow-sm')
                }
              >
                <h3 className="text-base font-semibold">Add traveler</h3>
                <p className={isDarkMode ? 'text-xs text-white/70' : 'text-xs text-slate-600'}>
                  Enter each passport holder joining the fixed departure.
                </p>
                <form onSubmit={handleTravelerSubmit} className="mt-3 space-y-2 text-black">
                  <input value={travelerForm.fullName} onChange={(e) => setTravelerForm({ ...travelerForm, fullName: e.target.value })} placeholder="Full name" className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  <div className="flex gap-2">
                    <input type="date" value={travelerForm.birthDate} onChange={(e) => setTravelerForm({ ...travelerForm, birthDate: e.target.value })} className="w-1/2 rounded-lg border border-black/10 px-2 py-2 text-sm" />
                    <input value={travelerForm.nationality} onChange={(e) => setTravelerForm({ ...travelerForm, nationality: e.target.value })} placeholder="Nationality" className="w-1/2 rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  </div>
                  <input value={travelerForm.passportNumber} onChange={(e) => setTravelerForm({ ...travelerForm, passportNumber: e.target.value })} placeholder="Passport number" className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  <input value={travelerForm.dietaryNeeds} onChange={(e) => setTravelerForm({ ...travelerForm, dietaryNeeds: e.target.value })} placeholder="Dietary notes (optional)" className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  <input value={travelerForm.emergencyContact} onChange={(e) => setTravelerForm({ ...travelerForm, emergencyContact: e.target.value })} placeholder="Emergency contact" className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  <textarea value={travelerForm.notes} onChange={(e) => setTravelerForm({ ...travelerForm, notes: e.target.value })} placeholder="Internal notes" rows={2} className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  <Button type="submit" className="w-full" variant="ghost">Add traveler</Button>
                </form>
              </section>

              <section
                className={
                  'rounded-2xl border p-5 ' +
                  (isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white shadow-sm')
                }
              >
                <h3 className="text-base font-semibold">Record payment</h3>
                <p className={isDarkMode ? 'text-xs text-white/70' : 'text-xs text-slate-600'}>
                  Log card intents or wire receipts so finance can reconcile.
                </p>
                <form onSubmit={handlePaymentSubmit} className="mt-3 space-y-2 text-black">
                  <input value={paymentForm.label} onChange={(e) => setPaymentForm({ ...paymentForm, label: e.target.value })} placeholder="Label (e.g., Deposit)" className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as PaymentRecord['method'] })} className="rounded-lg border border-black/10 px-2 py-2 text-sm">
                      <option value="wire">Wire</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                    </select>
                    <select value={paymentForm.status} onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as PaymentRecord['status'] })} className="rounded-lg border border-black/10 px-2 py-2 text-sm">
                      <option value="pending">Pending</option>
                      <option value="authorized">Authorized</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  <input value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="Amount in EUR" className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  <div className="flex gap-2">
                    <input value={paymentForm.last4} onChange={(e) => setPaymentForm({ ...paymentForm, last4: e.target.value })} placeholder="Card last 4" className="w-1/2 rounded-lg border border-black/10 px-2 py-2 text-sm" />
                    <input value={paymentForm.provider} onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })} placeholder="Provider" className="w-1/2 rounded-lg border border-black/10 px-2 py-2 text-sm" />
                  </div>
                  <Button type="submit" className="w-full" variant="ghost">Save payment</Button>
                </form>
              </section>

              <section
                className={
                  'rounded-2xl border p-5 ' +
                  (isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white shadow-sm')
                }
              >
                <h3 className="text-base font-semibold">Custom routes</h3>
                <p className={
                  'mt-2 text-sm ' +
                  (isDarkMode ? 'text-white/70' : 'text-slate-600')
                }>
                  Launch Tour Creator to sketch a bespoke extension or share a visual brief with our team.
                </p>
                <Button className="mt-4 w-full" variant="primary" onClick={() => setShowTourCreator(true)}>Open Tour Creator</Button>
              </section>

              <section
                className={
                  'rounded-2xl border p-5 ' +
                  (isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white shadow-sm')
                }
              >
                <h3 className="text-base font-semibold">Book a 30-min call</h3>
                <p className={isDarkMode ? 'text-xs text-white/70' : 'text-xs text-slate-600'}>
                  Choose a time to speak with our team about routes, flights, or special needs. We&apos;ll send you a Meet link.
                </p>
                <form onSubmit={handleBookCall} className="mt-3 space-y-2 text-black">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={callDate}
                      onChange={(e) => setCallDate(e.target.value)}
                      className="w-1/2 rounded-lg border border-black/10 px-2 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={callTime}
                      onChange={(e) => setCallTime(e.target.value)}
                      className="w-1/2 rounded-lg border border-black/10 px-2 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Anything you&apos;d like us to prepare?"
                    rows={2}
                    className="w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
                  />
                  <Button type="submit" className="w-full" variant="ghost">
                    Request call
                  </Button>
                </form>
              </section>
            </aside>
          </div>
        </main>

        {/* Confirm modal (simple) */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirmModal(false)} />
            <div
              ref={modalRef}
              className={
                `relative max-w-lg w-full rounded-xl p-6 ` +
                (isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')
              }
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-deposit-title"
            >
              <h2 id="confirm-deposit-title" className="text-lg font-semibold">Confirm deposit</h2>
              <p className="mt-2 text-sm">
                You are about to pay the deposit for this reservation. Please confirm to continue to Stripe Checkout.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Per person</span>
                  <span className="font-medium">{usdFmt.format((activeReservation as any)?.per_person_deposit_usd ?? (activeReservation as any)?.perPerson ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total deposit</span>
                  <span className="font-medium">{usdFmt.format((activeReservation as any)?.deposit_total_usd ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Travelers</span>
                  <span className="font-medium">{(activeReservation as any)?.travelers?.length ?? travelerCount}</span>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className={
                    'flex-1 rounded-lg px-4 py-2 border ' +
                    (isDarkMode ? 'border-white/10 text-white' : 'border-slate-200 text-slate-700')
                  }
                >
                  Cancel
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={() => handleConfirmAndCheckout()}
                  disabled={isProcessingCheckout || ((activeReservation as any)?.deposit_total_usd ?? 0) <= 0}
                  className={
                    'flex-1 rounded-lg px-4 py-2 text-white ' +
                    (isProcessingCheckout ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700')
                  }
                >
                  {isProcessingCheckout ? 'Processing…' : 'Confirm & Pay'}
                </button>
              </div>
              {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            </div>
          </div>
        )}

        <TourCreator
          open={showTourCreator}
          onCloseAction={() => setShowTourCreator(false)}
        />
      </div>
    </div>
  );
}

export default function PanelPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
          Loading panel…
        </div>
      }
    >
      <div className="relative">
  <PanelPageContent />

        {/* Sticky CTA bar */}
        <div className="fixed left-0 right-0 bottom-6 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-3xl pointer-events-auto"> 
            <div className="rounded-full bg-slate-900 px-6 py-3 shadow-xl text-center">
              <Button className="w-full" variant="primary" onClick={() => window.dispatchEvent(new Event('open-panel-confirm'))}>Pay deposit via Stripe</Button>
            </div>
          </div>
        </div>
      </div>
    </React.Suspense>
  );
}
