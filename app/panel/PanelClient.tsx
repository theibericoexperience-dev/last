"use client";

import { Suspense, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PanelSidebar from './components/PanelSidebar';
import ReservationSection from './components/ReservationSection';
import PaymentsSection from './components/PaymentsSection';
import TravelersSection from './components/TravelersSection';
import ProfileSection from './components/ProfileSection';
import SupportSection from './components/SupportSection';
import BonusSection from './components/BonusSection';
import CallSection from './components/CallSection';
import WhatsAppSection from './components/WhatsAppSection';
import { usePanelData } from './hooks/usePanelData';
import { usePanelState } from './hooks/usePanelState';
import type { PanelSection } from './types';

function PanelContent() {
  const router = useRouter();
  const { orders, tickets, bonuses, calls, bonusBalance, referralCode, loading, refetch } = usePanelData();
  const { activeSection, focusedOrderId, setSection, focusOrder } = usePanelState();

  const sectionRef = useRef(activeSection);
  useEffect(() => {
    sectionRef.current = activeSection;
  }, [activeSection]);

  // Synchronizer: Reresume and submit pending reservations found in localStorage
  useEffect(() => {
    const syncPending = async () => {
      try {
        const stored = localStorage.getItem('ibero_pending_reservation');
        if (!stored) return;

        const pending = JSON.parse(stored);
        console.log('>>> [PANEL SYNC] Pending reservation found:', pending);

        // Call the API to create the order
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pending),
        });

        if (res.ok) {
          const data = await res.json();
          console.log('>>> [PANEL SYNC] Order created successfully:', data.order.id);
          localStorage.removeItem('ibero_pending_reservation');
          // Refresh data to show the new order
          refetch();
          // Optionally focus the new order
          if (data.order.id) focusOrder(data.order.id);
        } else {
          console.error('>>> [PANEL SYNC] Failed to create order:', res.status);
          // If 401, maybe user session is still not ready, we will try again on next mount/render
        }
      } catch (err) {
        console.error('>>> [PANEL SYNC] Error:', err);
      }
    };

    if (!loading) {
      syncPending();
    }
  }, [loading, refetch, focusOrder]);

  // Compute pending counts per currently-focused order (or first order) to
  // drive sidebar badge behavior. These are small, idempotent boolean counts
  // (0 or 1) per-order as requested by product.
  const computePendingForOrder = (o: any) => {
    if (!o) return { paymentsPendingCount: 0, travelersPendingCount: 0 };
    const deposit = (o.deposit_total_usd ?? o.deposit_total ?? o.server_pricing?.deposit_total_usd) || 0;
    const paid = (o.amount_paid ?? o.amountPaid ?? 0) || 0;
    const paymentsPendingCount = deposit > 0 && paid < deposit ? 1 : 0;

    let travelersPendingCount = 0;
    if (o.travelers && Array.isArray(o.travelers)) {
      const anyIncomplete = o.travelers.some((t: any) => {
        const full = t.full_name || t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim();
        return !full;
      });
      travelersPendingCount = anyIncomplete ? 1 : 0;
    } else {
      const count = o.travelers_count || o.travelers || 0;
      travelersPendingCount = count > 0 && (!o.travelers || (Array.isArray(o.travelers) && o.travelers.length < count)) ? 1 : 0;
    }

    return { paymentsPendingCount, travelersPendingCount };
  };

  const orderForBadges = (focusedOrderId && orders.find((x) => String(x.id) === String(focusedOrderId))) || orders[0] || null;
  const { paymentsPendingCount, travelersPendingCount } = computePendingForOrder(orderForBadges);

  // Handle sidebar navigation clicking
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSection(sectionId as PanelSection);
    } else {
      setSection(sectionId as PanelSection);
    }
  };

  // Sync active section based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length === 0) return;

        // Pick section with largest intersection
        const best = visibleEntries.reduce((prev, current) => 
          (current.intersectionRatio > prev.intersectionRatio) ? current : prev
        );

        if (best.intersectionRatio > 0.1) {
          const id = best.target.id.replace('section-', '') as PanelSection;
          if (sectionRef.current !== id) {
            setSection(id);
          }
        }
      },
      { 
        threshold: [0.1, 0.2, 0.4], 
        rootMargin: '-10% 0px -50% 0px' 
      }
    );

    const sectionIds = ['reservations', 'whatsapp', 'profile', 'support', 'call', 'bonus'];
    sectionIds.forEach((s) => {
      const el = document.getElementById(`section-${s}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [setSection]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <PanelSidebar
        activeSection={activeSection}
        onSectionChange={scrollToSection}
        orderCount={orders.length}
        ticketCount={tickets.filter((t) => t.status === 'open').length}
        bonusBalance={bonusBalance}
        paymentsPendingCount={paymentsPendingCount}
        travelersPendingCount={travelersPendingCount}
        tourName={(() => {
          if (!orders || orders.length === 0) return null;
          const o = orders[0];
          let title = o.tour?.title || o.tour_title || o.tour_name || o.tourName || null;
          if (!title) return null;
          title = title.replace(/\s*\(?20\d{2}\)?\s*$/g, '').trim();
          return title || null;
        })()}
      />

      <main className="flex-1 overflow-y-auto scroll-smooth snap-y snap-mandatory px-8 text-[1.15rem]">
        <div className="mx-auto max-w-4xl relative">
          {/* Fixed "Back to landing" floating button for cleaner UI */}
          <div className="sticky top-8 z-50 flex justify-end pointer-events-none">
            <a href="/" aria-label="Back to landing" className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor" />
              </svg>
              <span>Back to site</span>
            </a>
          </div>

          <div className="flex flex-col">
            {/* Section: Reservations */}
            <section id="section-reservations" className="snap-start scroll-mt-[25vh] min-h-[70vh] flex flex-col pt-12 pb-32">
              <ReservationSection
                orders={orders}
                loading={loading}
                onViewDetails={(orderId) => focusOrder(orderId)}
                onEditTravelers={(orderId) => { setSection('travelers'); focusOrder(orderId); }}
                onEditPayments={(orderId) => { setSection('payments'); focusOrder(orderId); }}
                focusedOrderId={focusedOrderId}
              />
            </section>

            {/* Subsections: Only shown if explicitly triggered */}
            {(activeSection === 'payments' || activeSection === 'travelers') && orders.length > 0 && (
               <section id={`section-${activeSection}`} className="snap-start scroll-mt-[15vh] min-h-[70vh] flex flex-col pt-0 pb-32">
                 <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 mb-6">
                   <button onClick={() => scrollToSection('reservations')} className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                     ← Back to Overview
                   </button>
                 </div>
                 {activeSection === 'payments' ? (
                   <PaymentsSection orders={orders} loading={loading} />
                 ) : (
                   <TravelersSection orders={orders} loading={loading} />
                 )}
               </section>
            )}

            {/* Section: WhatsApp Community */}
            <section id="section-whatsapp" className="snap-start scroll-mt-[15vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <WhatsAppSection loading={loading} />
            </section>

            {/* Section: Profile */}
            <section id="section-profile" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <ProfileSection loading={loading} />
            </section>

            {/* Section: Ibero Chat Support */}
            <section id="section-support" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <SupportSection tickets={tickets} loading={loading} onRefresh={refetch} />
            </section>

            {/* Section: Book a Call */}
            <section id="section-call" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <CallSection calls={calls} loading={loading} onRefresh={refetch} />
            </section>

            {/* Section: Bonus */}
            <section id="section-bonus" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
               <BonusSection
                balance={bonusBalance}
                bonuses={bonuses}
                referralCode={referralCode}
                loading={loading}
              />
            </section>
          </div>
          
          {/* Spacer for the last element's snap room */}
          <div className="h-[20vh]" />
        </div>
      </main>
    </div>
  );
}

export default function PanelClient() {
  return (
    <div id="ibero-panel" data-panel-mounted="1">
      <script dangerouslySetInnerHTML={{ __html: "console.debug('[PanelClient] mounted')" }} />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" /></div>}>
        <PanelContent />
      </Suspense>
    </div>
  );
}
