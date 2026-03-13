'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCardIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon, ShieldCheckIcon, SparklesIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/fetch/apiFetch';

interface Order {
  id: string;
  order_id?: string;
  tour_name?: string;
  tourName?: string;
  total_amount?: number;
  totalAmount?: number;
  deposit_amount?: number;
  amount_paid?: number;
  amountPaid?: number;
  status?: string;
  payment_status?: string;
  created_at?: string;
  travelers_count?: number;
  adults?: number;
  children?: number;
}

interface PaymentsSectionProps {
  orders: Order[];
  loading: boolean;
  onPayNow?: (orderId: string, amount: number) => void;
  onOpenTerms?: () => void;
  onOpenInsurance?: () => void;
}

/* ─── 48-h Countdown Hook ─── */
function useCountdown(createdAt: string | undefined) {
  const calcRemaining = useCallback(() => {
    if (!createdAt) return 0;
    const created = new Date(createdAt).getTime();
    const deadline = created + 48 * 60 * 60 * 1000;
    return Math.max(0, deadline - Date.now());
  }, [createdAt]);

  const [ms, setMs] = useState(calcRemaining);
  useEffect(() => {
    if (!createdAt) return;
    const id = setInterval(() => setMs(calcRemaining()), 60_000); // update every minute
    return () => clearInterval(id);
  }, [createdAt, calcRemaining]);

  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours}h`);
  return { expired: ms === 0, display: parts.join(' '), ms };
}

export default function PaymentsSection({ orders, loading, onPayNow, onOpenTerms, onOpenInsurance }: PaymentsSectionProps) {
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  // Track chosen payment option per order: 'deposit' | 'full'
  const [payOption, setPayOption] = useState<Record<string, 'deposit' | 'full'>>({});
  const [termsOpen, setTermsOpen] = useState(false);

  const handlePayment = async (orderId: string, amount: number) => {
    setProcessingOrderId(orderId);
    try {
      if (onPayNow) {
        await onPayNow(orderId, amount);
      } else {
        const response = await apiFetch('/api/payments/create-checkout-session', {
          method: 'POST',
          body: JSON.stringify({ orderId, amount }),
        });
        const data = await response.json();
        if (data.url) window.location.href = data.url;
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
          <p className="mt-2 text-sm text-slate-500">Your payment history will appear here once you make a reservation.</p>
        </div>
      </div>
    );
  }

  const getPaymentStatus = (order: Order) => {
    const total = order.total_amount || order.totalAmount || 0;
    const paid = order.amount_paid || order.amountPaid || 0;
    const status = order.payment_status || order.status;
    if (status === 'paid' || paid >= total) return { status: 'paid', label: 'Paid', icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' };
    if (paid > 0 && paid < total) return { status: 'partial', label: 'Deposit Paid', icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50' };
    return { status: 'pending', label: 'Awaiting Payment', icon: ExclamationCircleIcon, color: 'text-red-500', bg: 'bg-red-50' };
  };

  const totalDue = orders.reduce((sum, o) => sum + (o.total_amount || o.totalAmount || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.amount_paid || o.amountPaid || 0), 0);
  const remaining = totalDue - totalPaid;

  return (
    <div className="space-y-5">
      {/* ── Summary Card ── */}
      <div className="rounded-2xl bg-slate-900 p-5 text-white overflow-hidden relative">
        <CreditCardIcon className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 text-white/[.04] rotate-12 z-0 hidden sm:block" aria-hidden />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Payment Summary</p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Total</p>
              <p className="mt-0.5 text-lg sm:text-xl font-bold text-white leading-none">${totalDue.toLocaleString()}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Paid</p>
              <p className="mt-0.5 text-lg sm:text-xl font-bold text-emerald-400 leading-none">${totalPaid.toLocaleString()}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 pt-3 sm:pt-0 border-t border-slate-800 sm:border-0 min-w-0 flex sm:block items-center justify-between">
              <p className="text-[10px] text-amber-500/80 uppercase tracking-wider font-medium">Remaining</p>
              <p className="mt-0 sm:mt-0.5 text-xl sm:text-2xl font-black text-amber-400 leading-none">${remaining.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Order Cards ── */}
      <div className="space-y-4">
        {orders.map((order) => {
          const tourName = order.tour_name || order.tourName || 'Tour Reservation';
          const total = order.total_amount || order.totalAmount || 0;
          const travelers = order.travelers_count || ((order.adults || 0) + (order.children || 0)) || 1;
          const deposit = travelers * 1000; // $1,000 per person
          const paid = order.amount_paid || order.amountPaid || 0;
          const balance = total - paid;
          const depositBalance = Math.max(0, deposit - paid);
          const paymentInfo = getPaymentStatus(order);
          const StatusIcon = paymentInfo.icon;
          const isProcessing = processingOrderId === order.id;
          const option = payOption[order.id] || 'deposit';
          const payAmount = option === 'deposit' ? depositBalance : balance;

          return (
            <OrderCard
              key={order.id}
              order={order}
              tourName={tourName}
              total={total}
              deposit={deposit}
              paid={paid}
              balance={balance}
              depositBalance={depositBalance}
              paymentInfo={paymentInfo}
              StatusIcon={StatusIcon}
              isProcessing={isProcessing}
              option={option}
              payAmount={payAmount}
              onOptionChange={(opt) => setPayOption(prev => ({ ...prev, [order.id]: opt }))}
              onPay={() => handlePayment(order.id, payAmount)}
              onOpenTerms={onOpenTerms || (() => setTermsOpen(true))}
              onOpenInsurance={onOpenInsurance}
            />
          );
        })}
      </div>

      {/* ── Inline Terms Modal (fallback) ── */}
      {termsOpen && <TermsModal onClose={() => setTermsOpen(false)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Order Card — extracted for countdown hook usage
   ═══════════════════════════════════════════════════ */
function OrderCard({
  order, tourName, total, deposit, paid, balance, depositBalance,
  paymentInfo, StatusIcon, isProcessing, option, payAmount,
  onOptionChange, onPay, onOpenTerms, onOpenInsurance,
}: {
  order: Order;
  tourName: string;
  total: number;
  deposit: number;
  paid: number;
  balance: number;
  depositBalance: number;
  paymentInfo: { status: string; label: string; color: string; bg: string };
  StatusIcon: any;
  isProcessing: boolean;
  option: 'deposit' | 'full';
  payAmount: number;
  onOptionChange: (opt: 'deposit' | 'full') => void;
  onPay: () => void;
  onOpenTerms: () => void;
  onOpenInsurance?: () => void;
}) {
  const countdown = useCountdown(order.created_at);
  const needsPayment = balance > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* ── 48 h Countdown Banner ── */}
      {needsPayment && !countdown.expired && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-100">
          <ClockIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700">
              Spots held for <span className="font-mono tabular-nums">{countdown.display}</span>
            </p>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
              Once deposit is received we begin booking flights & all trip components.
            </p>
          </div>
        </div>
      )}
      {needsPayment && countdown.expired && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-100">
          <ExclamationCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-xs font-medium text-slate-700">
            Hold expired — <button type="button" className="underline text-slate-900">contact us</button> to restore your reservation.
          </p>
        </div>
      )}

      {/* ── Row 1: Tour name + status ── */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex-shrink-0 rounded-full p-1.5 ${paymentInfo.bg}`}>
            <StatusIcon className={`h-4 w-4 ${paymentInfo.color}`} />
          </div>
          <p className="font-semibold text-slate-900 text-sm leading-snug truncate">{tourName}</p>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${paymentInfo.bg} ${paymentInfo.color}`}>
          {paymentInfo.label}
        </span>
      </div>

      {/* ── Row 2: Price breakdown ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 py-2 border-t border-slate-100">
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
          <p className="text-sm font-bold text-slate-800">${total.toLocaleString()}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Deposit</p>
          <p className="text-sm font-bold text-slate-600">${deposit.toLocaleString()}</p>
        </div>
        <div className="min-w-0 col-span-2 sm:col-span-1 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 flex sm:block items-center justify-between">
          <p className="text-[10px] text-amber-500 uppercase tracking-wide">Due</p>
          <p className="text-sm sm:text-sm font-bold text-amber-600">${balance.toLocaleString()}</p>
        </div>
      </div>

      {/* ── Row 3: Payment option selector + pay button ── */}
      {needsPayment && (
        <div className="px-4 pb-4 pt-2 space-y-3">
          {/* Option selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onOptionChange('deposit')}
              className={`rounded-lg border-2 p-2.5 text-left transition-all ${
                option === 'deposit'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-300'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Deposit ($1,000/person)</p>
              <p className="text-base font-black text-slate-900 mt-0.5">${depositBalance.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Secure your spots now</p>
            </button>
            <button
              type="button"
              onClick={() => onOptionChange('full')}
              className={`rounded-lg border-2 p-2.5 text-left transition-all ${
                option === 'full'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-300'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Full Amount</p>
              <p className="text-base font-black text-slate-900 mt-0.5">${balance.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">Pay in full & save time</p>
            </button>
          </div>

          {/* Pay button */}
          <button
            type="button"
            onClick={onPay}
            disabled={isProcessing}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 active:scale-[.98] transition-all disabled:opacity-50"
          >
            {isProcessing ? 'Redirecting to payment...' : `Pay $${payAmount.toLocaleString()} — ${option === 'deposit' ? 'Secure Deposit' : 'Full Payment'}`}
          </button>
        </div>
      )}

      {/* ── Row 4: Quick links ── */}
      <div className="border-t border-slate-100 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5">
          <SparklesIcon className="h-3.5 w-3.5" />
          <span>See optionals</span>
        </button>
        <button type="button" onClick={onOpenTerms} className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5">
          <DocumentTextIcon className="h-3.5 w-3.5" />
          <span>Cancellation Policy</span>
        </button>
        <button type="button" onClick={onOpenInsurance} className="text-xs text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
          <span>Insurances</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Inline Terms & Conditions Modal
   ═══════════════════════════════════════════════════ */
function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Terms & Conditions</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-slate-700 space-y-4">
          <Section title="1. Scope of Services">
            <p>Ibero acts as a travel organizer and/or intermediary for travel services including organized tours, international and domestic flights, hotel and accommodation bookings, ground transportation, activities and excursions, and optional travel insurance products.</p>
            <p className="mt-1">The specific services included in each booking will be detailed in the Client's itinerary or booking confirmation.</p>
          </Section>
          <Section title="2. Booking and Payment">
            <p>2.1. A booking is considered confirmed once payment has been received and written confirmation has been issued by Ibero.</p>
            <p>2.2. By completing the payment, the Client authorizes Ibero to proceed with the organization and purchase of the travel services on the Client's behalf.</p>
            <p>2.3. The Client may choose to pay a deposit of $1,000 USD per person or the full price at the time of booking. The remaining balance, if applicable, is due no later than 30 days before the departure date.</p>
          </Section>
          <Section title="3. Refund Policy and Cooling-Off Period">
            <p>3.1. <strong>100% Refund Guarantee (First 48 Hours)</strong> — Ibero guarantees a 100% refund of the amount paid, excluding bank or transfer fees, if the Client cancels within 48 hours of payment, provided that no flight tickets or hotel reservations have been issued.</p>
            <p>3.2. <strong>After 48 Hours</strong> — Ibero will proceed with purchasing airline tickets, hotel reservations, and other services. From that moment, refunds are not guaranteed and depend on supplier cancellation policies.</p>
          </Section>
          <Section title="4. Cancellations After Ticketing">
            <p>4.1. After flights and/or accommodation have been booked, Ibero will make reasonable efforts to recover the maximum possible amount.</p>
            <p>4.2. Refunds depend on airline fare rules, hotel policies, and third-party conditions.</p>
            <p>4.3. Ibero does not guarantee a full refund after bookings have been executed.</p>
          </Section>
          <Section title="5. Change of Traveler (Name Change)">
            <p>Ibero will attempt to facilitate changes subject to airline, hotel, and supplier policies. Additional costs may apply.</p>
          </Section>
          <Section title="6. Flights">
            <p>Flight tickets are issued per airline rules and are generally non-refundable. Ibero is not responsible for airline schedule changes, delays, cancellations, or baggage issues.</p>
          </Section>
          <Section title="7. Accommodation">
            <p>Hotel reservations are subject to the terms of the respective providers. Room types and amenities are based on supplier information and may vary slightly.</p>
          </Section>
          <Section title="8. Optional Travel Insurance">
            <p>Insurance is optional and offered separately. Coverage depends entirely on the insurance provider. Ibero acts solely as intermediary.</p>
          </Section>
          <Section title="9. Client Responsibilities">
            <p>The Client is responsible for providing accurate information, ensuring valid travel documents, complying with health and entry requirements, and arriving on time.</p>
          </Section>
          <Section title="10. Force Majeure">
            <p>Ibero shall not be held liable for events beyond its control, including natural disasters, pandemics, government actions, war, or airline strikes.</p>
          </Section>
          <Section title="11. European Package Travel Directive">
            <p>As a registered agency in Europe, Ibero complies with Directive (EU) 2015/2302. The agency takes full responsibility for the proper performance of all travel services included in the package.</p>
          </Section>
          <Section title="12. Financial Security">
            <p>Ibero maintains a Surety Bond (Aval de Caución) of €100,000 and a Comprehensive Civil Liability Insurance of up to €300,000, ensuring full protection of client funds and coverage for bodily injury, property damage, and professional indemnity.</p>
          </Section>
          <Section title="13. Data Protection (GDPR)">
            <p>Ibero processes personal data in strict compliance with Regulation (EU) 2016/679. Data is collected solely for travel organization, stored securely, and never sold to third parties.</p>
          </Section>
          <Section title="14. Governing Law and Jurisdiction">
            <p>These Terms are governed by European Union law. Any disputes shall be subject to the competent courts of the jurisdiction in which Ibero operates.</p>
          </Section>
          <Section title="15. Acceptance">
            <p>By booking with Ibero, the Client acknowledges and accepts these Terms and Conditions in full.</p>
          </Section>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            <p>Ibero · CIEX: 06-00049-Om · REG: AV-00661 · tours@ibero.world · www.ibero.world</p>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">Close</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-slate-900 mb-1">{title}</p>
      <div className="space-y-1 text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}
