'use client';

import { ClipboardDocumentListIcon, CreditCardIcon, UsersIcon, UserCircleIcon, ChatBubbleLeftRightIcon, GiftIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import type { PanelSection } from '../types';
import WhatsAppJoinForm from './WhatsAppJoinForm';

interface PanelSidebarProps {
  activeSection: PanelSection;
  onSectionChange: (section: PanelSection) => void;
  orderCount?: number;
  ticketCount?: number;
  bonusBalance?: number;
  paymentsPendingCount?: number;
  travelersPendingCount?: number;
  tourName?: string | null;
}

// Keep only top-level items that are independent; payments/travelers will be
// nested under the Reservations dropdown to match the new UX requirement.
const sections: { id: PanelSection; label: string; icon: typeof ClipboardDocumentListIcon }[] = [
  { id: 'reservations', label: 'Reservations', icon: ClipboardDocumentListIcon },
  { id: 'whatsapp', label: 'WhatsApp Community', icon: ClipboardDocumentListIcon },
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'support', label: 'Ibero Chat Support', icon: ChatBubbleLeftRightIcon },
  { id: 'call', label: 'Book a Call', icon: PhoneIcon },
  { id: 'bonus', label: 'Bonus & Cashback', icon: GiftIcon },
];

export default function PanelSidebar({
  activeSection,
  onSectionChange,
  orderCount = 0,
  ticketCount = 0,
  bonusBalance = 0,
  paymentsPendingCount = 0,
  travelersPendingCount = 0,
  tourName = null,
}: PanelSidebarProps) {
  const [reservationsOpen, setReservationsOpen] = useState(false);

  // Open the reservations dropdown by default if there are existing orders
  useEffect(() => {
    setReservationsOpen(orderCount > 0);
  }, [orderCount]);
  const getBadge = (id: PanelSection) => {
      switch (id) {
      case 'reservations':
        return orderCount > 0 ? orderCount : null;
      case 'support':
        return ticketCount > 0 ? ticketCount : null;
      case 'bonus':
        return bonusBalance > 0 ? `$${bonusBalance}` : null;
      default:
        return null;
    }
  };

  return (
    <nav className="w-64 flex-shrink-0 border-r border-slate-200 bg-white">
      <div className="p-4">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Dashboard</p>
      </div>
      <ul className="space-y-1 px-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const badge = getBadge(section.id);
          const isActive = activeSection === section.id || 
            (section.id === 'reservations' && (activeSection === 'payments' || activeSection === 'travelers'));

          // For reservations we render a dropdown that contains Payments and Travelers
          if (section.id === 'reservations') {
            const label = tourName ? `${tourName}` : section.label;
            return (
              <li key={section.id}>
                <div>
                  <button
                    type="button"
                    onClick={() => { setReservationsOpen((s) => !s); onSectionChange('reservations'); }}
                    className={`
                      w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
                      ${isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                  >
                    <span className="flex items-center">
                      <Icon className="h-6 w-6 flex-shrink-0" />
                    </span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-base">{label}</span>
                      <div className="flex items-center gap-2">
                        {orderCount > 0 && (
                          <svg className={`h-4 w-4 transform transition-transform ${reservationsOpen ? 'rotate-180' : ''} text-slate-500`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                             <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {/* When collapsed show an aggregate badge representing any pending tasks
                            under this reservation (payments or travelers). When expanded, the
                            badge will be rendered next to the specific child entries instead. */}
                        {!reservationsOpen && (() => {
                          const agg = orderCount > 0 ? (paymentsPendingCount || 0) + (travelersPendingCount || 0) : 0;
                          return agg > 0 ? (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              {agg}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </button>

                  {reservationsOpen && (
                    <ul className="mt-2 space-y-1 pl-8">
                      {orderCount > 0 && (
                        <>
                          <li>
                            <button
                              type="button"
                              onClick={() => onSectionChange('travelers')}
                              className={`w-full text-left text-sm transition ${activeSection === 'travelers' ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                              <span className="flex items-center gap-2">
                                <UsersIcon className={`h-4 w-4 ${activeSection === 'travelers' ? 'text-slate-900' : 'text-slate-500'}`} />
                                <span>Travelers</span>
                                {(travelersPendingCount || 0) > 0 && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">1</span>
                                )}
                              </span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => onSectionChange('payments')}
                              className={`w-full text-left text-sm transition ${activeSection === 'payments' ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                              <span className="flex items-center gap-2">
                                <CreditCardIcon className={`h-4 w-4 ${activeSection === 'payments' ? 'text-slate-900' : 'text-slate-500'}`} />
                                <span>Payments</span>
                                {(paymentsPendingCount || 0) > 0 && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">1</span>
                                )}
                              </span>
                            </button>
                          </li>
                        </>
                      )}
                    </ul>
                  )}
                </div>
              </li>
            );
          }

          // Regular top-level entries
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={`
                  w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
                  ${isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <span className="flex items-center">
                  {/* Render a simple WhatsApp-like icon inline for the whatsapp section */}
                  {section.id === 'whatsapp' ? (
                    // Use the same icon source as the rest (heroicons) for visual consistency
                    // Render PhoneIcon inside a rounded square/bubble so it matches the provided asset shape
                    <span className="h-6 w-6 flex-shrink-0 text-slate-600 rounded-md border border-current flex items-center justify-center">
                      <PhoneIcon className="h-4 w-4" />
                    </span>
                  ) : (
                    <Icon className="h-6 w-6 flex-shrink-0" />
                  )}
                </span>
                <span className="flex-1 text-left text-base">{section.label}</span>
                {badge && (
                  <span
                    className={`
                      rounded-full px-2 py-0.5 text-xs font-semibold
                      ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}
                    `}
                  >
                    {badge}
                  </span>
                )}
              </button>
              {/* WhatsApp UI moved to the main panel content (WhatsAppSection). Sidebar only shows the navigation entry. */}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
