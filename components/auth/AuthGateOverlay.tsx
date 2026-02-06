"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import clsx from 'clsx';

export type AuthGateOverlayProps = {
  open: boolean;
  onCloseAction?: () => void;
  callbackUrl?: string;
  headline?: string;
  description?: string;
};

function appendCallback(base: string, callbackUrl?: string) {
  if (!callbackUrl) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export default function AuthGateOverlay({ open, onCloseAction, callbackUrl, headline, description }: AuthGateOverlayProps) {
  const loginHref = useMemo(() => appendCallback('/auth/login', callbackUrl), [callbackUrl]);
  const registerHref = useMemo(() => appendCallback('/auth/register', callbackUrl), [callbackUrl]);

  return (
    <div
      aria-hidden={!open}
      className={clsx(
        'fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 py-12 transition-opacity',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-white/95 p-8 shadow-2xl">
        <div className="absolute right-4 top-4">
          <button
            type="button"
            aria-label="Close"
            className="rounded-full bg-slate-100 p-1 text-slate-500 hover:text-slate-900"
            onClick={onCloseAction}
          >
            ×
          </button>
        </div>
        <div className="space-y-4 text-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">Secure panel</p>
          <h3 className="text-2xl font-semibold">
            {headline || 'Create your IBERO account to continue'}
          </h3>
          <p className="text-base text-slate-600">
            {description ||
              'We guide every reservation inside a personal panel. Save traveler cards, choose protections and pay the deposit with complete transparency.'}
          </p>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Next steps:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-6">
              <li>Sign in / create your account with Google.</li>
              <li>Add traveler details (passport, dietary, medical notes).</li>
              <li>Secure the tour with the $1,500 per traveler deposit.</li>
            </ol>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href={registerHref}
              className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-center font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5"
            >
              Create account
            </Link>
            <Link
              href={loginHref}
              className="flex-1 rounded-full border border-slate-900 px-4 py-3 text-center font-semibold text-slate-900 hover:bg-slate-900 hover:text-white"
            >
              I already have one
            </Link>
          </div>
          <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-500">
            Concierge support · Human travel design
          </p>
        </div>
      </div>
    </div>
  );
}
