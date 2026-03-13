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
import LegalSection from './components/LegalSection';
import { usePanelData } from './hooks/usePanelData';
import { usePanelState } from './hooks/usePanelState';
import type { PanelSection } from './types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Added MagnifyingGlassIcon

function PanelContent() {
  const router = useRouter();
  const { orders, tickets, bonuses, calls, bonusBalance, referralCode, loading, refetch, personalTours } = usePanelData();
  const { activeSection, focusedOrderId, setSection, focusOrder } = usePanelState();
  const [videoReady, setVideoReady] = useState(false);
  const [mobileSidebarState, setMobileSidebarState] = useState<'closed' | 'mini' | 'full'>('closed');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Move all hooks above any conditional returns
  const [hideFloatingMenu, setHideFloatingMenu] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Override the global body background (#000) so the panel never shows a black bar
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#f8fafc';
    document.documentElement.style.background = '#f8fafc';
    return () => {
      document.body.style.background = prev;
      document.documentElement.style.background = '';
    };
  }, []);

  // Close the full panel if clicked outside on main content
  const handleMainClick = () => {
    if (mobileSidebarState !== 'closed') {
      setMobileSidebarState('closed');
    }
  };

  // Close sidebar on scroll
  useEffect(() => {
    const mainEl = document.getElementById('panel-main-content');
    if (!mainEl) return;
    const onScroll = () => {
       if (window.innerWidth < 768 && mobileSidebarState !== 'closed') {
         setMobileSidebarState('closed');
       }
    };
    mainEl.addEventListener('scroll', onScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', onScroll);
  }, [mobileSidebarState]);

  const showLoader = loading || (orders.length === 0 && !videoReady && false);
  const sectionRef = useRef(activeSection);
  useEffect(() => { sectionRef.current = activeSection; }, [activeSection]);

  useEffect(() => {
    const mainEl = document.getElementById('panel-main-content');
    if (!mainEl) return;
    // Check if the floating menu overlaps with tabs or other important top content
    const onScrollForMenu = () => {
      if (window.innerWidth >= 768) return;
      // If we scroll down a bit, show it. If we are near top (where tabs are), hide or make translucent.
      // Easiest is to fade it when scrolling past the hero unit.
      const scrollY = mainEl.scrollTop;
      // Tab area is roughly 200px from top
      if (scrollY > 150 && scrollY < 400) {
         setHideFloatingMenu(true);
      } else {
         setHideFloatingMenu(false);
      }
      // Show scroll-to-top button after 300px
      setShowScrollTop(scrollY > 300);
    };
    mainEl.addEventListener('scroll', onScrollForMenu, { passive: true });
    return () => mainEl.removeEventListener('scroll', onScrollForMenu);
  }, []);

  useEffect(() => {
    const syncPending = async () => {
      try {
        const stored = localStorage.getItem('ibero_pending_reservation');
        if (!stored) return;
        const pending = JSON.parse(stored);
        const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending) });
        if (res.ok) {
          const data = await res.json();
          localStorage.removeItem('ibero_pending_reservation');
          refetch();
          if (data.order?.id) focusOrder(data.order.id);
        }
      } catch (err) { console.error(err); }
    };
    if (!loading) syncPending();
  }, [loading, refetch, focusOrder]);

  const computePendingForOrder = (o: any) => {
    if (!o) return { paymentsPendingCount: 0, travelersPendingCount: 0 };
    const deposit = (o.deposit_total_usd ?? o.deposit_total ?? o.server_pricing?.deposit_total_usd) || 0;
    const paid = (o.amount_paid ?? o.amountPaid ?? 0) || 0;
    const paymentsPendingCount = deposit > 0 && paid < deposit ? 1 : 0;
    let travelersPendingCount = 0;
    if (o.travelers && Array.isArray(o.travelers)) {
      const anyIncomplete = o.travelers.some((t: any) => { const full = t.full_name || t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim(); return !full; });
      travelersPendingCount = anyIncomplete ? 1 : 0;
    } else {
      const count = o.travelers_count || o.travelers || 0;
      travelersPendingCount = count > 0 && (!o.travelers || (Array.isArray(o.travelers) && o.travelers.length < count)) ? 1 : 0;
    }
    return { paymentsPendingCount, travelersPendingCount };
  };

  const orderForBadges = (focusedOrderId && orders.find((x) => String(x.id) === String(focusedOrderId))) || orders[0] || null;
  const { paymentsPendingCount, travelersPendingCount } = computePendingForOrder(orderForBadges);

  const scrollToSection = (sectionId: string) => {
    if (['travelers', 'payments', 'whatsapp'].includes(sectionId)) {
      if (!focusedOrderId && orders.length > 0) focusOrder(String(orders[0].id || orders[0].order_id || ''));
    }
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionId}`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setSection(sectionId as PanelSection); }
      else setSection(sectionId as PanelSection);
      
      // Close mobile sidebar only if it's in 'full' mode. Keep 'mini' open.
      if (mobileSidebarState === 'full') setMobileSidebarState('mini');
    }, 50);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length === 0) return;
      const best = visibleEntries.reduce((prev, current) => (current.intersectionRatio > prev.intersectionRatio) ? current : prev);
      if (best.intersectionRatio > 0.1) {
        const id = best.target.id.replace('section-', '') as PanelSection;
        if (sectionRef.current !== id) setSection(id);
      }
    }, { threshold: [0.1, 0.2, 0.4], rootMargin: '-10% 0px -50% 0px' });

    const sectionIds = ['reservations', 'whatsapp', 'profile', 'support', 'call', 'bonus', 'legal'];
    sectionIds.forEach((s) => { const el = document.getElementById(`section-${s}`); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [setSection]);

  if (loading) return <TravelLoader />;

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 relative overflow-x-hidden" style={{ background: '#f8fafc' }}>
      {/* Mobile Floating Panel Tag */}
      {mobileSidebarState === 'closed' && (
        <button
          onClick={() => setMobileSidebarState('mini')}
          className={`md:hidden fixed left-[-1px] top-1/2 -translate-y-1/2 z-40 bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200 border-l-0 rounded-r-xl shadow-lg py-3 px-0 w-7 flex flex-col items-center justify-center transition-all duration-300 ${hideFloatingMenu ? 'opacity-30 pointer-events-none -translate-x-full' : 'opacity-100'}`}
          aria-label="Open Navigation Panel"
        >
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-700 m-0 p-0" />
        </button>
      )}

      <PanelSidebar
        mobileState={mobileSidebarState}
        setMobileState={setMobileSidebarState}
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
    id="panel-main-content"
    className={`flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden overscroll-none scroll-smooth transition-all duration-300 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}
    style={{ WebkitOverflowScrolling: 'auto', touchAction: 'pan-y', overflowX: 'hidden', width: '100%', display: 'block' }}
      onClick={handleMainClick}
    >
        <div className="w-full min-w-0 px-4 md:px-8 mx-auto max-w-5xl box-border min-w-0">
          <div className="flex flex-col min-w-0 w-full">
            <section id="section-reservations" className="snap-start scroll-mt-[100px] min-h-[70vh] flex flex-col pt-12 pb-32">
              <ReservationSection
                orders={orders}
                personalTours={personalTours || []}
                loading={loading}
                onViewDetails={(orderId) => focusOrder(String(orderId))}
                onEditTravelers={(orderId) => { focusOrder(String(orderId)); setSection('reservations'); setTimeout(() => { document.getElementById('section-travelers')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}
                onEditPayments={(orderId) => { focusOrder(String(orderId)); setSection('reservations'); setTimeout(() => { document.getElementById('section-payments')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}
                focusedOrderId={focusedOrderId}
                onVideoReady={() => setVideoReady(true)}
              />
            </section>

            <section id="section-whatsapp" className="snap-start scroll-mt-[15vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <WhatsAppSection loading={loading} />
            </section>

            <section id="section-profile" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <ProfileSection loading={loading} />
            </section>

            <section id="section-support" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <SupportSection tickets={tickets} loading={loading} onRefresh={refetch} />
            </section>

            <section id="section-call" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <CallSection calls={calls} loading={loading} onRefresh={refetch} />
            </section>

            <section id="section-bonus" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <BonusSection balance={bonusBalance} bonuses={bonuses} referralCode={referralCode} loading={loading} />
            </section>

            <section id="section-legal" className="snap-start scroll-mt-[12vh] min-h-[70vh] flex flex-col pt-0 pb-32">
              <LegalSection />
            </section>
          </div>

          <div className="h-[20vh]" />
        </div>
      </main>

      {showLoader && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <TravelLoader />
        </div>
      )}

      {/* Mobile scroll-to-top button */}
      {showScrollTop && (
        <button
          onClick={() => document.getElementById('panel-main-content')?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="md:hidden fixed bottom-6 right-4 z-50 bg-slate-900 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl text-sm font-bold transition-all duration-300 active:scale-95"
          aria-label="Scroll to top"
        >
          ↑
        </button>
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
