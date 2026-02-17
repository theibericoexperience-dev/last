'use client';

import { ClipboardDocumentListIcon, CreditCardIcon, UsersIcon, UserCircleIcon, ChatBubbleLeftRightIcon, GiftIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import type { PanelSection } from '../types';
import WhatsAppJoinForm from './WhatsAppJoinForm';

interface PanelSidebarProps {
  isOpen: boolean; 
  setIsOpen: (o: boolean) => void;
  isCollapsed?: boolean; 
  onCollapseToggle?: () => void;
  activeSection: PanelSection;
  onSectionChange: (section: PanelSection) => void;
  orderCount?: number;
  ticketCount?: number;
  bonusBalance?: number;
  paymentsPendingCount?: number;
  travelersPendingCount?: number;
  tourName?: string | null;
  isWizardMode?: boolean;
}

const sections: { id: PanelSection; label: string; icon: typeof ClipboardDocumentListIcon }[] = [
  { id: 'reservations', label: 'Reservations', icon: ClipboardDocumentListIcon },
  { id: 'whatsapp', label: 'WhatsApp Community', icon: ClipboardDocumentListIcon },
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'support', label: 'Ibero Chat Support', icon: ChatBubbleLeftRightIcon },
  { id: 'call', label: 'Book a Call', icon: PhoneIcon },
  { id: 'bonus', label: 'Bonus & Cashback', icon: GiftIcon },
];

export default function PanelSidebar({
  isOpen, setIsOpen,
  isCollapsed = false,
  onCollapseToggle,
  activeSection,
  onSectionChange,
  orderCount = 0,
  ticketCount = 0,
  bonusBalance = 0,
  paymentsPendingCount = 0,
  travelersPendingCount = 0,
  tourName = null,
  isWizardMode = false
}: PanelSidebarProps) {
  const [reservationsOpen, setReservationsOpen] = useState(false);

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
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      {!isWizardMode && (
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-slate-100 transition-all duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20 items-center' : 'w-72'}`}
      >
      <div className={`p-4 w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
         {!isCollapsed && (
             <h1 className="text-2xl font-serif text-slate-900 transition-opacity duration-300">IBERO</h1>
         )}
         {/* Toggle Button */}
         {onCollapseToggle && (
         <button 
            onClick={onCollapseToggle} 
            className="hidden md:flex p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
         >
            <svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
         </button>
         )}
      </div>

      <div className={`px-4 py-2 ${isCollapsed ? 'hidden' : 'block'}`}>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Dashboard</p>
      </div>

      <ul className={`space-y-1 px-2 ${isCollapsed ? 'w-full flex flex-col items-center' : ''}`}>
        {sections.map((section) => {
          const Icon = section.icon;
          const badge = getBadge(section.id);
          const isActive = activeSection === section.id || 
            (section.id === 'reservations' && (activeSection === 'payments' || activeSection === 'travelers'));

          if (section.id === 'reservations') {
            const label = tourName ? `${tourName}` : section.label;
            return (
              <li key={section.id} className={isCollapsed ? 'w-full flex justify-center' : 'w-full'}>
                <div className={isCollapsed ? 'w-full flex justify-center relative group' : 'w-full'}>
                  <button
                    type="button"
                    onClick={() => { 
                        if (isCollapsed && onCollapseToggle) onCollapseToggle(); // Auto-expand if clicking while collapsed? Or just select?
                        else setReservationsOpen((s) => !s); 
                        
                        onSectionChange('reservations'); 
                    }}
                    className={`
                      flex items-center rounded-lg transition
                      ${isCollapsed ? 'p-3 justify-center' : 'w-full px-3 py-2 gap-3'}
                      ${isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                    title={isCollapsed ? label : ''}
                  >
                    <span className="flex items-center justify-center">
                      <Icon className="h-6 w-6 flex-shrink-0" />
                    </span>
                    
                    {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="text-base truncate">{label}</span>
                      <div className="flex items-center gap-2">
                        {orderCount > 0 && (
                          <svg className={`h-4 w-4 transform transition-transform ${reservationsOpen ? 'rotate-180' : ''} text-slate-500`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                             <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
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
                    )}
                  </button>

                  {(reservationsOpen && !isCollapsed) && (
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

          return (
            <li key={section.id} className={isCollapsed ? 'w-full flex justify-center' : 'w-full'}>
              <button
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={`
                  flex items-center rounded-lg transition
                  ${isCollapsed ? 'p-3 justify-center' : 'w-full px-3 py-2 gap-3'}
                  ${isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
                title={isCollapsed ? section.label : ''}
              >
                <span className="flex items-center justify-center">
                  {section.id === 'whatsapp' ? (
                    <span className="h-6 w-6 flex-shrink-0 text-slate-600 rounded-md border border-current flex items-center justify-center">
                      <PhoneIcon className="h-4 w-4" />
                    </span>
                  ) : (
                    <Icon className="h-6 w-6 flex-shrink-0" />
                  )}
                </span>
                {!isCollapsed && (
                <>
                <span className="flex-1 text-left text-base truncate">{section.label}</span>
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
                </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      </aside>
      )}

      { isWizardMode && (
         <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-30 border-b border-slate-100 flex items-center px-6 justify-between">
            <div className="text-2xl font-serif text-slate-900">IBERO</div>
            <div></div>
         </div>
      )}
    </>
  );
}
