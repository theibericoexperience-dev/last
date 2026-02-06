"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const handleGoToPanel = () => {
    if (orderId) {
      router.push(`/panel/orders?orderId=${encodeURIComponent(orderId)}`);
    } else {
      router.push('/panel/orders');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-white shadow-xl border border-emerald-100 p-6 space-y-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Deposit received</p>
          <h1 className="text-2xl font-semibold text-slate-900">Thank you for confirming</h1>
          <p className="text-sm text-slate-600">
            We&apos;ve recorded your deposit and linked it to your IBERO reservation. You can review travelers, protections,
            and next steps inside your panel.
          </p>
        </header>
        {orderId && (
          <p className="text-xs text-slate-500">Order reference: <span className="font-mono">{orderId}</span></p>
        )}
        <button
          type="button"
          onClick={handleGoToPanel}
          className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Open my panel
        </button>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessInner />
    </Suspense>
  );
}
