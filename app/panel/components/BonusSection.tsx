'use client';

import { GiftIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import InviteFriends from './InviteFriends';
import { useState } from 'react';

interface BonusHistory {
  id: string;
  type: string;
  amount: number;
  description?: string;
  created_at: string;
}

interface BonusSectionProps {
  balance: number;
  bonuses: BonusHistory[];
  referralCode: string;
  loading: boolean;
}

export default function BonusSection({ balance, bonuses, referralCode, loading }: BonusSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}?ref=${referralCode}` 
    : '';

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Bonus & Rewards</h2>
        <div className="animate-pulse space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="h-8 w-32 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-48 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'referral':
        return 'Referral Bonus';
      case 'signup':
        return 'Welcome Bonus';
      case 'booking':
        return 'Booking Reward';
      case 'loyalty':
        return 'Loyalty Points';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'referral':
        return 'bg-purple-100 text-purple-700';
      case 'signup':
        return 'bg-green-100 text-green-700';
      case 'booking':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Bonus & Cashback</h2>

      {/* Compact two-column layout: balance + invite */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-purple-600 to-purple-800 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <GiftIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-purple-200">Available Balance</p>
          </div>
          <p className="mt-3 text-3xl font-bold">${balance.toLocaleString()}</p>
          <p className="mt-1 text-sm text-purple-200">Usable for up to 2 travelers</p>
        </div>

        <div>
          <InviteFriends />
        </div>
      </div>

      {/* Cashback info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">5% Cashback on every booking</h3>
        <p className="mt-2 text-sm text-slate-600">
          Earn 5% cashback on the total amount of each operation (tour price + add-ons). Cashback
          is automatically stored in your general Bonus & Cashback balance and can be used on
          future bookings. The cashback amount will appear here once the booking is processed.
        </p>
      </div>

      {/* Bonus History */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Reward History</h3>
        </div>

        {bonuses.length === 0 ? (
          <div className="p-8 text-center">
            <GiftIcon className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              No rewards yet. Book a tour or refer a friend to earn bonus credits!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bonuses.map((bonus) => (
              <div key={bonus.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(bonus.type)}`}>
                    {getTypeLabel(bonus.type)}
                  </span>
                  <div>
                    <p className="text-sm text-slate-900">{bonus.description || getTypeLabel(bonus.type)}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(bonus.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-green-600">+${bonus.amount}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
