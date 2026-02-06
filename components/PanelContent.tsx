import React from 'react';
import PanelSidebar from '@/app/panel/components/PanelSidebar';
import ReservationSection from '@/app/panel/components/ReservationSection';
import PaymentsSection from '@/app/panel/components/PaymentsSection';
import TravelersSection from '@/app/panel/components/TravelersSection';
import ProfileSection from '@/app/panel/components/ProfileSection';
import SupportSection from '@/app/panel/components/SupportSection';
import BonusSection from '@/app/panel/components/BonusSection';
import CallSection from '@/app/panel/components/CallSection';
import WhatsAppSection from '@/app/panel/components/WhatsAppSection';
import { usePanelData } from '@/app/panel/hooks/usePanelData';
import { usePanelState } from '@/app/panel/hooks/usePanelState';

export default function PanelContent() {
  const { orders, tickets, bonuses, bonusBalance, referralCode, loading, refetch } = usePanelData();
  const { activeSection, focusedOrderId, setSection, focusOrder } = usePanelState();

  const renderSection = () => {
    switch (activeSection) {
      case 'reservations':
        return (
          <ReservationSection
            orders={orders}
            loading={loading}
            onViewDetails={(orderId) => focusOrder(orderId)}
            focusedOrderId={focusedOrderId}
          />
        );
      case 'payments':
        return <PaymentsSection orders={orders} loading={loading} />;
      case 'travelers':
        return <TravelersSection orders={orders} loading={loading} />;
      case 'profile':
        return <ProfileSection loading={loading} />;
      case 'support':
        return <SupportSection tickets={tickets} loading={loading} onRefresh={refetch} />;
      case 'bonus':
        return <BonusSection balance={bonusBalance} bonuses={bonuses} referralCode={referralCode} loading={loading} />;
      case 'call':
        return <CallSection calls={tickets} loading={loading} onRefresh={refetch} />;
      case 'whatsapp':
        return <WhatsAppSection loading={loading} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <PanelSidebar activeSection={activeSection} onSectionChange={setSection} orderCount={orders.length} ticketCount={tickets.filter((t:any)=>t.status==='open').length} bonusBalance={bonusBalance} />
      <main>{renderSection()}</main>
    </div>
  );
}
