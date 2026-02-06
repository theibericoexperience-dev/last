"use client";

// Simple checkout version that redirects directly
import React, { useState } from 'react';
import { createCheckoutSession } from '@/lib/domain/payments/api';

interface CreateOrderInput {
  useExistingOrderId?: string;
  [key: string]: any;
}

interface Props {
  createOrderInputProvider: () => Promise<CreateOrderInput>;
  onSuccess?: () => void;
  label?: string;
}

export default function ReservationCheckout({ createOrderInputProvider, onSuccess, label = 'Checkout' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const input = await createOrderInputProvider();
      const orderId = input.useExistingOrderId;

      if (!orderId) {
        alert('Internal error: missing order id');
        setLoading(false);
        return;
      }

      // Using the server action result directly (it returns { url?: string; error?: string })
      const res = await createCheckoutSession({ orderId });
      
      const resError = (res as any).error; // Cast because type definition might be slightly outdated
      if (resError) {
        alert('Checkout error: ' + resError);
        setLoading(false);
        return;
      }

      if (res.url) {
        window.location.href = res.url;
      } else {
        alert('Failed to initialize checkout session');
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert('Checkout error');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
    >
      {loading ? 'Processing...' : label}
    </button>
  );
}
