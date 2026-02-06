"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMapMaybe } from '../app/providers/MapProvider';

type Props = { onCloseAction: () => void; onOpenTourCreatorAction: () => void };

export default function UserPanel({ onCloseAction, onOpenTourCreatorAction }: Props) {
  const router = useRouter();
  const mapCtx = useMapMaybe();
  const [illuminate, setIlluminate] = React.useState(false);

  React.useEffect(() => {
    function onIll() {
      setIlluminate(true);
      setTimeout(() => setIlluminate(false), 4000);
    }
    if (typeof window !== 'undefined') window.addEventListener('illuminateUI', onIll);
    return () => window.removeEventListener('illuminateUI', onIll);
  }, []);

  const goToPanel = React.useCallback(() => {
    onCloseAction();
    router.push('/panel');
  }, [onCloseAction, router]);

  const shortcuts = [
    { label: 'My reservations', href: '/bookings' },
    { label: 'Wishlist & holds', href: '/panel#wishlist' },
    { label: 'Payments & invoices', href: '/panel#payments' },
    { label: 'Settings', href: '/settings' }
  ];

  return (
    <section
      className={`relative isolate flex w-full min-h-[82vh] flex-col overflow-hidden rounded-[34px] border border-white/40 bg-white/95 shadow-[0_50px_140px_rgba(3,6,23,0.55)] ${illuminate ? 'illuminate illuminate-pulse' : ''}`}
      role="dialog"
      aria-label="User control panel"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50" aria-hidden />
      <div className="pointer-events-none absolute -right-20 top-4 h-64 w-64 rounded-full bg-amber-200/40 blur-[130px]" aria-hidden />
      <button
        className="group absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80 text-slate-600 transition hover:bg-white"
        onClick={onCloseAction}
      >
        <span className="sr-only">Close panel overlay</span>
        <span className="relative block h-4 w-4">
          <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rotate-45 bg-current" />
          <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 -rotate-45 bg-current" />
        </span>
      </button>

      <div className="relative grid gap-10 p-8 md:p-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-400">User panel</p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-900 sm:text-5xl">
              Everything for your Iberian journey, in one place.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-500">
              Confirm days, add extras, coordinate with your host team and keep your reservations synced across
              devices.
            </p>
          </header>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={goToPanel}
              className="flex-1 min-w-[180px] rounded-2xl bg-slate-900 px-5 py-4 text-center text-base font-semibold text-white shadow-[0_20px_45px_rgba(3,6,23,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Go to my panel
            </button>
            <button
              onClick={() => { onOpenTourCreatorAction(); goToPanel(); }}
              className="flex-1 min-w-[180px] rounded-2xl border border-slate-900/15 bg-white px-5 py-4 text-center text-base font-semibold text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.15)] transition hover:-translate-y-0.5"
            >
              Open tour creator
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.1)]">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Reservations</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">Madrid → Lisbon 2026</p>
              <p className="mt-2 text-sm text-slate-500">Status: itinerary ready · awaiting flight info</p>
              <button onClick={goToPanel} className="mt-4 text-sm font-semibold text-slate-900 underline">
                Review details
              </button>
            </article>
            <article className="rounded-3xl border border-black/5 bg-slate-900/95 p-6 text-white shadow-[0_25px_60px_rgba(3,6,23,0.45)]">
              <p className="text-sm uppercase tracking-[0.35em] text-white/60">Add-ons</p>
              <p className="mt-3 text-2xl font-semibold">Pre-arrival art walk</p>
              <p className="mt-2 text-sm text-white/80">Extend your stay with curated activities before day 1.</p>
              <button onClick={goToPanel} className="mt-4 text-sm font-semibold text-white underline">
                Manage add-ons
              </button>
            </article>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl bg-slate-900 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Identity</p>
            <h3 className="mt-4 text-2xl font-semibold">
              You are browsing as guest
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Sign in to sync your wishlist, save edits and unlock the Iberico concierge team.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/auth/login')}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900"
              >
                Sign in / create account
              </button>
              <button
                onClick={goToPanel}
                className="flex-1 rounded-2xl border border-white/25 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Continue as guest
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Shortcuts</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-800">
              {shortcuts.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 transition hover:border-slate-200 hover:bg-white"
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {process.env.NODE_ENV !== 'production' && (
            <section className="rounded-3xl border border-amber-200/60 bg-amber-50/80 p-5 text-amber-900">
              <p className="text-xs font-semibold uppercase tracking-[0.4em]">Dev map controls</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    try {
                      mapCtx?.setMapRenderer('inline');
                      mapCtx?.logDiagnostic({ level: 'info', message: 'dev: setMapRenderer inline' });
                    } catch (e) {}
                  }}
                  className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Inline renderer
                </button>
                <button
                  onClick={() => {
                    try {
                      mapCtx?.setMapRenderer('svg');
                      mapCtx?.logDiagnostic({ level: 'info', message: 'dev: setMapRenderer svg' });
                    } catch (e) {}
                  }}
                  className="flex-1 rounded-2xl border border-amber-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-900"
                >
                  SVG renderer
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
