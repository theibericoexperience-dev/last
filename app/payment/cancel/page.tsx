"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentCancelInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const handleBackToPanel = () => {
    if (orderId) {
      router.push(`/panel/orders?orderId=${encodeURIComponent(orderId)}`);
    } else {
      router.push('/panel/orders');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-white shadow-xl border border-slate-200 p-6 space-y-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Payment not completed</p>
          <h1 className="text-2xl font-semibold text-slate-900">You can try again anytime</h1>
          <p className="text-sm text-slate-600">
            It looks like the Stripe checkout was closed before the deposit was confirmed. Your reservation is still in draft
            mode. You can review details and restart the payment from your panel.
          </p>
        </header>
        {orderId && (
          <p className="text-xs text-slate-500">Order reference: <span className="font-mono">{orderId}</span></p>
        )}
        <button
          type="button"
          onClick={handleBackToPanel}
          className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Back to panel
        </button>
      </div>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={null}>
      <PaymentCancelInner />
    </Suspense>
  );
}
