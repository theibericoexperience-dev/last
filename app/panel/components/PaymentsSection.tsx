'use client';

import { useState } from 'react';
import { CreditCardIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/fetch/apiFetch';

interface Order {
  id: string;
  order_id?: string;
  tour_name?: string;
  tourName?: string;
  total_amount?: number;
  totalAmount?: number;
  amount_paid?: number;
  amountPaid?: number;
  status?: string;
  payment_status?: string;
  created_at?: string;
}

interface PaymentsSectionProps {
  orders: Order[];
  loading: boolean;
  onPayNow?: (orderId: string, amount: number) => void;
}

export default function PaymentsSection({ orders, loading, onPayNow }: PaymentsSectionProps) {
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const handlePayment = async (orderId: string, amount: number) => {
    setProcessingOrderId(orderId);
    try {
      if (onPayNow) {
        await onPayNow(orderId, amount);
      } else {
        // Default Stripe checkout
        const response = await apiFetch('/api/payments/create-checkout-session', {
          method: 'POST',
          body: JSON.stringify({ orderId, amount }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <CreditCardIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No payments yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Your payment history will appear here once you make a reservation.
          </p>
        </div>
      </div>
    );
  }

  const getPaymentStatus = (order: Order) => {
    const total = order.total_amount || order.totalAmount || 0;
    const paid = order.amount_paid || order.amountPaid || 0;
    const status = order.payment_status || order.status;

    if (status === 'paid' || paid >= total) {
      return { status: 'paid', label: 'Paid', icon: CheckCircleIcon, color: 'text-green-600' };
    }
    if (paid > 0 && paid < total) {
      return { status: 'partial', label: 'Partial', icon: ClockIcon, color: 'text-yellow-600' };
    }
    return { status: 'pending', label: 'Pending', icon: ExclamationCircleIcon, color: 'text-red-600' };
  };

  // Calculate summary
  const totalDue = orders.reduce((sum, o) => sum + (o.total_amount || o.totalAmount || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.amount_paid || o.amountPaid || 0), 0);
  const remaining = totalDue - totalPaid;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
        <p className="text-sm font-medium text-slate-300">Payment Summary</p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold">${totalDue.toLocaleString()}</p>
            <p className="text-sm text-slate-400">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">${totalPaid.toLocaleString()}</p>
            <p className="text-sm text-slate-400">Paid</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">${remaining.toLocaleString()}</p>
            <p className="text-sm text-slate-400">Remaining</p>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {orders.map((order) => {
          const tourName = order.tour_name || order.tourName || 'Tour Reservation';
          const total = order.total_amount || order.totalAmount || 0;
          const paid = order.amount_paid || order.amountPaid || 0;
          const balance = total - paid;
          const paymentInfo = getPaymentStatus(order);
          const StatusIcon = paymentInfo.icon;
          const isProcessing = processingOrderId === order.id;

          return (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-2 ${paymentInfo.status === 'paid' ? 'bg-green-100' : 'bg-slate-100'}`}>
                  <StatusIcon className={`h-5 w-5 ${paymentInfo.color}`} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{tourName}</p>
                  <p className="text-sm text-slate-500">
                    {paymentInfo.status === 'paid'
                      ? `Paid on ${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}`
                      : `$${paid.toLocaleString()} of $${total.toLocaleString()} paid`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-slate-900">${total.toLocaleString()}</p>
                  <p className={`text-sm ${paymentInfo.color}`}>{paymentInfo.label}</p>
                </div>

                {balance > 0 && (
                  <button
                    type="button"
                    onClick={() => handlePayment(order.id, balance)}
                    disabled={isProcessing}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : `Pay $${balance.toLocaleString()}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
