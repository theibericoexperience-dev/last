"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TravelLoader from '@/components/TravelLoader';
import PanelSidebar from './components/PanelSidebar';
import ReservationSection from './components/ReservationSection';
import ProfileSection from './components/ProfileSection';
import SupportSection from './components/SupportSection';
import BonusSection from './components/BonusSection';
import CallSection from './components/CallSection';
import WhatsAppSection from './components/WhatsAppSection';
import TourCreatorWizard from './components/TourCreatorWizard';
import { usePanelData } from './hooks/usePanelData';
import { usePanelState } from './hooks/usePanelState';
import type { PanelSection } from './types';
import { TransitionLink } from '@/components/GlobalLoaderProvider';

function PanelContent() {
  const router = useRouter();
  const { orders, tickets, bonuses, calls, bonusBalance, referralCode, loading, refetch, personalTours } = usePanelData();
  const { activeSection, focusedOrderId, setSection, focusOrder } = usePanelState();
  const [videoReady, setVideoReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show loader if fetching data OR if we have no orders (landing video mode) and video isn't ready
  // NOTE: set false in logic above to allow TourCreator to show instantly if we decide to remove video for 'no-reservation' state. 
  // Actually, let's keep logic but if orders.length === 0, we render Wizard instead of default panel content.
  const showLoader = loading || (orders.length === 0 && !videoReady && false); 

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
// ...existing code...
    // If clicking travelers/payments/whatsapp, ensure we have a focused order if possible
    // so that the section exists in the DOM (since it's now conditional inside ReservationSection)
    if (['travelers', 'payments', 'whatsapp'].includes(sectionId)) {
        if (!focusedOrderId && orders.length > 0) {
            // Default to first order if none focused
           focusOrder(String(orders[0].id || orders[0].order_id || ''));
        }
    }
// ...existing code...    // Give a tiny tick for state updates (focusOrder) to render the target section
    setTimeout(() => {
        const el = document.getElementById(`section-${sectionId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setSection(sectionId as PanelSection);
        } else {
          // If element doesn't exist (e.g. no orders), just switch state
          setSection(sectionId as PanelSection);
        }
    }, 50);
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

  if (loading) {
    return <TravelLoader />;
  }
  
  // NOTE: TourCreatorWizard integration is moving to ReservationSection
  // Removing the direct Wizard render to keep the standard layout.

  return (
    <div className="flex h-screen bg-slate-50">
      <PanelSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection={activeSection}
        onSectionChange={scrollToSection}
        orderCount={orders.length}
        ticketCount={tickets.length}
        bonusBalance={bonusBalance}
        paymentsPendingCount={paymentsPendingCount}
        travelersPendingCount={travelersPendingCount}
      />
      <main 
         className="flex-1 overflow-y-auto scroll-smooth snap-y snap-mandatory px-8 text-[1.15rem]"
         onClick={() => { if (!sidebarCollapsed) setSidebarCollapsed(true); }}
      >
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
            // ...existing code...
            <section id="section-reservations" className="snap-start scroll-mt-[25vh] min-h-[70vh] flex flex-col pt-12 pb-32">
              <ReservationSection
                orders={orders}
                personalTours={personalTours || []}
                loading={loading}
                onViewDetails={(orderId) => focusOrder(String(orderId))}
                onEditTravelers={(orderId) => { 
                  // Focus order to expand details, then slight delay to allow render before scroll
                  focusOrder(String(orderId));
                  setSection('reservations'); 
                  setTimeout(() => {
                    document.getElementById('section-travelers')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                onEditPayments={(orderId) => { 
                  focusOrder(String(orderId));
                  setSection('reservations');
                  setTimeout(() => {
                    document.getElementById('section-payments')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                focusedOrderId={focusedOrderId}
                onVideoReady={() => setVideoReady(true)}
              />
            </section>

            // ...existing code...
            {/* Subsections: Only shown if explicitly triggered */}
            {/* REMOVED: Travelers, Payments are now rendered inside ReservationSection */}
            
// ...existing code...
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
      
      {showLoader && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <TravelLoader />
        </div>
      )}
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
