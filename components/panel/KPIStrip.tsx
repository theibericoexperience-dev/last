"use client";

import React from 'react';

type Props = {
  travelers: number;
  payments: number;
  roomType?: string | null;
  reservations: number;
};

export default function KPIStrip({ travelers, payments, roomType, reservations }: Props) {
  const items = [
    { label: 'Travelers', value: travelers, hint: 'Awaiting roster' },
    { label: 'Payments', value: payments, hint: 'Add deposit info' },
    { label: 'Room type', value: roomType || '—', hint: 'Fixed departure inventory' },
    { label: 'Reservations', value: reservations, hint: '' },
  ];

  return (
    <div className="w-full my-6">
      <div className="mx-auto max-w-6xl grid grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border p-4 bg-white/90 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{it.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-2xl font-semibold text-slate-900">{it.value}</p>
                {it.hint && <p className="text-xs text-slate-500">{it.hint}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
