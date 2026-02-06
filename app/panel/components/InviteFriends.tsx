"use client";

import React from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';

export default function InviteFriends() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-slate-50 p-2">
          <UserPlusIcon className="h-6 w-6 text-slate-700" />
        </div>
        <div>
          <p className="font-medium text-slate-900">Invite Friends</p>
          <p className="text-sm text-slate-500">Share a referral link and earn rewards when friends book.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input readOnly value="YouInviteCode123" className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
        <button type="button" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Copy</button>
      </div>
    </div>
  );
}
