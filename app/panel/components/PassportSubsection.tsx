'use client';

import { useState } from 'react';
import { IdentificationIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/fetch/apiFetch';

interface Traveler {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

interface PassportSubsectionProps {
  orderId?: string | null;
  slotId?: string; // optional single slot rendering
  initial?: Partial<Traveler>;
}

export default function PassportSubsection({ orderId, slotId, initial }: PassportSubsectionProps) {
  const defaultTraveler: Traveler = {
    id: slotId || `new-${Date.now()}`,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
  } as Traveler;

  const [travelers, setTravelers] = useState<Traveler[]>(() => (initial ? [{ ...defaultTraveler, ...(initial as any) }] : []));
  const [loading, setLoading] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const addTraveler = () => {
    setTravelers([
      ...travelers,
      {
        id: `new-${Date.now()}`,
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        passportNumber: '',
        passportExpiry: '',
      },
    ]);
  };

  const removeTraveler = (id: string) => {
    setTravelers(travelers.filter((t) => t.id !== id));
  };

  const updateTraveler = (id: string, field: keyof Traveler, value: string) => {
    setTravelers(
      travelers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const saveTravelers = async () => {
    // Try to get orderId from URL if not provided via props
    let finalOrderId = orderId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      console.log('>>> URL ORDER ID:', params.get('orderId'));
      if (!finalOrderId) finalOrderId = params.get('orderId');
    }

    if (!finalOrderId) {
      console.error('>>> ERROR: No orderId found for travelers update');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/orders/${finalOrderId}/travelers`, {
        method: 'PATCH',
        body: JSON.stringify({ travelers }),
      });
      if (!res.ok) throw new Error('Failed to save');
      // Success feedback here
    } catch (err) {
      console.error('Failed to save travelers:', err);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = (t: Traveler) => !!(t.firstName && t.passportNumber);

  const toggleOpen = (id: string) => {
    setOpenMap((m) => ({ ...m, [id]: !m[id] }));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-3">
          <IdentificationIcon className="h-6 w-6 text-slate-400" />
          <h3 className="text-lg font-light text-slate-900">Passport Information</h3>
        </div>
        <div>
          <button
            onClick={addTraveler}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Traveler
          </button>
        </div>
      </div>

      {!orderId && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4 mx-4">
          <p className="text-sm text-amber-800">
            {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('orderId') 
              ? `Order ${new URLSearchParams(window.location.search).get('orderId')} selected` 
              : 'No order selected — you can still add traveler info here'}
          </p>
        </div>
      )}

      {travelers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-slate-100 p-3 mb-3">
            <IdentificationIcon className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No travelers added yet</p>
          <p className="text-sm text-slate-500 mb-4">Add traveler passport information for your booking</p>
          <button
            onClick={addTraveler}
            disabled={false}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add First Traveler
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {travelers.map((traveler, idx) => (
            <div key={traveler.id} className="rounded-xl border border-slate-200 bg-slate-50">
              <button
                onClick={() => toggleOpen(traveler.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{traveler.firstName ? `${traveler.firstName} ${traveler.lastName}` : `Traveler ${idx + 1}`}</div>
                  <div className="text-xs text-slate-500">{traveler.passportNumber ? traveler.passportNumber : 'Passport info missing'}</div>
                </div>
                <div className="ml-4">
                  {isComplete(traveler) ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-amber-500">!</span>
                  )}
                </div>
              </button>

              {openMap[traveler.id] && (
                <div className="p-4 border-t bg-white">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={traveler.firstName}
                        onChange={(e) => updateTraveler(traveler.id, 'firstName', e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-0"
                        placeholder="As shown on passport"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={traveler.lastName}
                        onChange={(e) => updateTraveler(traveler.id, 'lastName', e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-0"
                        placeholder="As shown on passport"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        value={traveler.dateOfBirth}
                        onChange={(e) => updateTraveler(traveler.id, 'dateOfBirth', e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-slate-400 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Nationality *</label>
                      <input
                        type="text"
                        value={traveler.nationality}
                        onChange={(e) => updateTraveler(traveler.id, 'nationality', e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-0"
                        placeholder="e.g., United States"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Passport Number *</label>
                      <input
                        type="text"
                        value={traveler.passportNumber}
                        onChange={(e) => updateTraveler(traveler.id, 'passportNumber', e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-0"
                        placeholder="ABC123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Passport Expiry *</label>
                      <input
                        type="date"
                        value={traveler.passportExpiry}
                        onChange={(e) => updateTraveler(traveler.id, 'passportExpiry', e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-slate-400 focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => removeTraveler(traveler.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors mr-3"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={saveTravelers}
                      disabled={loading}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Traveler'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500 px-4">* Passport must be valid for at least 6 months after your travel dates</p>
    </div>
  );
}
