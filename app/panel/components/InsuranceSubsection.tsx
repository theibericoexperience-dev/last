'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function InsuranceSubsection() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheckIcon className="h-6 w-6 text-slate-400" />
        <h3 className="text-lg font-light text-slate-900">Insurance</h3>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-slate-100 p-4 mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">There are no insurance reservations yet</p>
        <p className="text-sm text-slate-500">Our team is finalizing the last details</p>
      </div>
    </div>
  );
}
