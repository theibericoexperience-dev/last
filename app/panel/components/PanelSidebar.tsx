'use client';

import { ClipboardDocumentListIcon, CreditCardIcon, UsersIcon, UserCircleIcon, ChatBubbleLeftRightIcon, GiftIcon, PhoneIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import type { PanelSection } from '../types';
import WhatsAppJoinForm from './WhatsAppJoinForm';

interface PanelSidebarProps {
  mobileState?: 'closed' | 'mini' | 'full'; 
  setMobileState?: (state: 'closed' | 'mini' | 'full') => void;
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

const sections: { id: PanelSection; label: string; icon: any }[] = [
  { id: 'reservations', label: 'Reservations', icon: ClipboardDocumentListIcon },
  { 
    id: 'whatsapp', 
    label: 'WhatsApp Community', 
    icon: (props: any) => (
      <svg {...props} viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor"/>
      </svg>
    )
  },
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'support', label: 'Ibero Chat Support', icon: ChatBubbleLeftRightIcon },
  { id: 'call', label: 'Book a Call', icon: PhoneIcon },
  { id: 'bonus', label: 'Bonus & Cashback', icon: GiftIcon },
  { id: 'legal', label: 'Legal Information', icon: ShieldCheckIcon },
];

export default function PanelSidebar({
  mobileState = 'closed', setMobileState,
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

  const isMini = mobileState === 'mini';
  const isFull = mobileState === 'full';
  const isVisibleMobile = isMini || isFull;

  return (
    <>
      {/* Mobile Backdrop for Full Mode Only */}
      {isFull && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileState?.('closed')}
        />
      )}

      {/* Sidebar Container */}
      {!isWizardMode && (
      <aside
        onClick={(e) => {
          if (e.target === e.currentTarget && isVisibleMobile) {
            setMobileState?.('closed');
          }
        }}
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-slate-100 transition-all duration-300 md:translate-x-0 ${
          isVisibleMobile ? 'translate-x-0' : '-translate-x-full'
        } ${isMini ? 'w-16 items-center' : 'w-64'} ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
      {/* Top spacer — keeps content from touching the very top edge */}
      <div className="flex-shrink-0 h-4" />

      <ul className={`space-y-1 px-2 ${(isCollapsed || isMini) ? 'w-full flex flex-col items-center' : ''}`}>

        {/* Go Back — returns to landing page */}
        <li className="hidden md:flex w-full justify-center mb-1">
          <a
            href="/"
            className={`
              flex items-center rounded-lg transition text-slate-400 hover:bg-slate-100 hover:text-slate-600
              ${(isCollapsed || isMini) ? 'p-3 justify-center' : 'w-full px-3 py-2 gap-3'}
            `}
            title="Go back to home"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {!(isCollapsed || isMini) && <span className="text-base text-slate-400 truncate">Go back</span>}
          </a>
        </li>

        {/* Desktop collapse/expand chevron — aligned with nav buttons */}
        {onCollapseToggle && (
          <li className="hidden md:flex w-full justify-center mb-1">
            <button
              onClick={onCollapseToggle}
              className={`
                flex items-center rounded-lg transition text-slate-400 hover:bg-slate-100 hover:text-slate-600
                ${(isCollapsed || isMini) ? 'p-3 justify-center' : 'w-full px-3 py-2 gap-3'}
              `}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              {!(isCollapsed || isMini) && (
                <span className="text-base text-slate-400 truncate">Collapse</span>
              )}
            </button>
          </li>
        )}

        {sections.map((section) => {
          const Icon = section.icon;
          const badge = getBadge(section.id);
          const isActive = activeSection === section.id || 
            (section.id === 'reservations' && (activeSection === 'payments' || activeSection === 'travelers'));

          if (section.id === 'reservations') {
            const label = tourName ? `${tourName}` : section.label;
            return (
              <li key={section.id} className={(isCollapsed || isMini) ? 'w-full flex justify-center' : 'w-full'}>
                <div className={(isCollapsed || isMini) ? 'w-full flex justify-center relative group' : 'w-full'}>
                  <button
                    type="button"
                    onClick={() => { 
                        if (isCollapsed && onCollapseToggle) onCollapseToggle();
                        else if (isMini && setMobileState) setMobileState('full');
                        else setReservationsOpen((s) => !s); 
                        
                        onSectionChange('reservations'); 
                    }}
                    className={`
                      flex items-center rounded-lg transition
                      ${(isCollapsed || isMini) ? 'p-3 justify-center' : 'w-full px-3 py-2 gap-3'}
                      ${isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }
                    `}
                    title={(isCollapsed || isMini) ? label : ''}
                  >
                    <span className="flex items-center justify-center">
                      <Icon className="h-6 w-6 flex-shrink-0" />
                    </span>
                    
                    {!(isCollapsed || isMini) && (
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

                  {(reservationsOpen && !(isCollapsed || isMini)) && (
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
            <li key={section.id} className={(isCollapsed || isMini) ? 'w-full flex justify-center' : 'w-full'}>
              <button
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={`
                  flex items-center rounded-lg transition
                  ${(isCollapsed || isMini) ? 'p-3 justify-center' : 'w-full px-3 py-2 gap-3'}
                  ${isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
                title={(isCollapsed || isMini) ? section.label : ''}
              >
                <span className="flex items-center justify-center">
                   <Icon className="h-6 w-6 flex-shrink-0" />
                </span>
                {!(isCollapsed || isMini) && (
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

      {/* Mobile (+) / (-) expand toggle (placed below the last button) */}
      <div className="mt-auto p-4 flex md:hidden flex-col gap-2 items-center">
         <button 
            onClick={(e) => { e.stopPropagation(); setMobileState?.('full'); }}
            className={`flex items-center justify-center p-2 rounded-full hover:bg-slate-100 transition-colors text-amber-600 ${isFull ? 'hidden' : 'flex'}`}
            title="Expand"
         >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
         </button>
         
         <button 
            onClick={(e) => { e.stopPropagation(); setMobileState?.('closed'); }}
            className={`flex items-center justify-center p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500`}
            title="Close"
         >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
         </button>
      </div>

      </aside>
      )}

      { isWizardMode && (
         <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md z-30 border-b border-slate-100 flex items-center px-6 justify-between">
            <div className="text-2xl font-serif text-slate-900"></div>
            <div></div>
         </div>
      )}
    </>
  );
}
