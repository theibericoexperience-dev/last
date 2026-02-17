"use client";

import { useEffect, useState, useMemo } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import PassportSubsection from './PassportSubsection';
import { getUserProfile } from '@/lib/domain/profile/api';
import { usePanelState } from '../hooks/usePanelState';

interface Order {
  id: string;
  order_id?: string;
  tour_name?: string;
  tourName?: string;
  adults?: number;
  children?: number;
  travelers?: any[]; // To support name extraction
}

interface TravelersSectionProps {
  orders: Order[];
  loading: boolean;
}

export default function TravelersSection({ orders, loading }: TravelersSectionProps) {
  const { focusedOrderId } = usePanelState();
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({});
  const [completedCards, setCompletedCards] = useState<Record<number, boolean>>({});
  const [primaryName, setPrimaryName] = useState<string | null>(null);
  const [travelerNames, setTravelerNames] = useState<Record<number, string>>({});

  useEffect(() => {
    // If not completed, force open primary on first load
    if (!completedCards[0]) {
      setOpenCards(prev => ({ ...prev, 0: true }));
    }
  }, []); // Run once on mount

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await getUserProfile();
        if (!mounted) return;
        const pp = p as any;
        const name = (pp?.full_name || pp?.name || `${pp?.first_name || ''} ${pp?.last_name || ''}`).trim();
        setPrimaryName(name || null);
      } catch (e) {
         // console.warn('Failed to fetch profile in TravelersSection', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ...existing code...
  // Find the relevant order (either focused or first available)
  const activeOrder = focusedOrderId 
    ? orders.find(o => String(o.id) === String(focusedOrderId) || String(o.order_id) === String(focusedOrderId)) 
    : orders[0];

  // If no order context, show empty state or return null
  if (!orders || orders.length === 0) {
    return null;
  }

  // Determine number of travelers from order details (default to 2 if not found for now, or use adults + children)
  const travelerCount = activeOrder.adults ? ((activeOrder.adults || 0) + (activeOrder.children || 0)) : 2;
  const travelersList = Array.from({ length: travelerCount }, (_, i) => i);
  
  // Sync traveler names from active order initially
  useEffect(() => {
     if (activeOrder?.travelers && Array.isArray(activeOrder.travelers)) {
         const initialNames: Record<number, string> = {};
         const initialCompleted: Record<number, boolean> = {};
         activeOrder.travelers.forEach((t: any, i: number) => {
             const full = (t.full_name || t.name || `${t.first_name || ''} ${t.last_name || ''}`).trim();
             if (full) {
                 initialNames[i] = full;
                 initialCompleted[i] = true; 
             }
         });
         setTravelerNames(prev => ({ ...prev, ...initialNames }));
         setCompletedCards(prev => ({ ...prev, ...initialCompleted }));
     }
  }, [activeOrder]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <UsersIcon className="h-6 w-6 text-slate-400" />
        <h2 className="text-2xl font-light text-slate-900">Travelers</h2>
      </div>

      {/* Cards Grid: Render one card per traveler slot */}
      <div className="grid gap-4 sm:grid-cols-2">
        {travelersList.map((index) => {
          const isPrimary = index === 0;
          const slotId = isPrimary ? 'primary' : `traveler-${index + 1}`;
          const isOpen = openCards[index] || false;
          const isCompleted = completedCards[index] || false;
          
          const toggle = () => {
             setOpenCards(prev => ({ 
                ...prev, 
                [index]: !prev[index] 
             }));
          };

          const handleSaveSuccess = (savedName?: string) => {
             // Mark this as complete
             setCompletedCards(prev => ({ ...prev, [index]: true }));
             if (savedName) {
                setTravelerNames(prev => ({ ...prev, [index]: savedName }));
             }
             // Close this card
             setOpenCards(prev => ({ ...prev, [index]: false }));
             // Open next card if exists
             if (index < travelersList.length - 1) {
                setOpenCards(prev => ({ ...prev, [index+1]: true }));
             }
          };

          // Logic for personal title
          // If we have a manually saved name for this slot, use it.
          // Or if we have a name from the loaded order data (synced in useEffect above), that's already in travelerNames.
          
          let title = `Guest ${index + 1}`;
          
          if (travelerNames[index]) {
             title = travelerNames[index];
          } else if (isPrimary && primaryName) {
             // If not saved yet but logged in, use profile name as default display
             title = primaryName;
          }
          
          // Logic for dynamic subtitle
          const subtitle = isCompleted ? 'Information saved' : (isPrimary ? 'Please complete your details' : 'Add guest details');

          return (
            <div key={slotId} className={`rounded-xl border transition-all duration-300 ${isOpen ? 'border-amber-200 bg-amber-50/30 ring-1 ring-amber-100' : 'border-slate-200 bg-white hover:border-amber-200'}`}>
               <button
                  type="button"
                  onClick={toggle}
                  className="w-full text-left p-5"
               >
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {isPrimary ? 'Primary Traveler' : `Guest ${index + 1}`}
                     </span>
                     {/* Status Indicator */}
                     <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-100 text-green-600' : (isOpen ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400')}`}>
                        {isCompleted ? (
                           <CheckCircleIcon className="w-6 h-6" />
                        ) : (
                           <div className="w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {isOpen ? '...' : '!'}
                           </div>
                        )}
                     </div>
                  </div>
                  
                  <div className="font-medium text-slate-900 text-lg flex items-center gap-2">
                     {title}
                  </div>
                  <p className={`text-sm mt-1 transition-colors ${isCompleted ? 'text-green-600' : 'text-slate-500'}`}>{subtitle}</p>
               </button>

               {/* Collapsible Content */}
               <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-5 pt-0 border-t border-amber-100/50 mt-2">
                     <PassportSubsection 
                        orderId={String(activeOrder.id || activeOrder.order_id)} 
                        slotId={slotId} 
                        initial={isPrimary ? { 
                           firstName: (travelerNames[index] || primaryName)?.split(' ')[0] || '', 
                           lastName: (travelerNames[index] || primaryName)?.split(' ').slice(1).join(' ') || '' 
                        } : {
                           firstName: travelerNames[index]?.split(' ')[0] || '',
                           lastName: travelerNames[index]?.split(' ').slice(1).join(' ') || ''
                        }}
                        onSave={handleSaveSuccess}
                     />
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

