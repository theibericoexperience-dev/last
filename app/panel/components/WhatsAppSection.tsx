"use client";

import { useState } from 'react';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import WhatsAppJoinForm from './WhatsAppJoinForm';

interface WhatsAppSectionProps {
  loading?: boolean;
}

export default function WhatsAppSection({ loading = false }: WhatsAppSectionProps) {
  const [invitePhone, setInvitePhone] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const openWhatsApp = () => {
    // Open the official Ibero WhatsApp channel invite
    window.open('https://chat.whatsapp.com/H3wckfrN0DX3UGfZSg4wBl', '_blank');
  };

  const sendInvite = async () => {
    if (!invitePhone.trim()) return;
    setSendingInvite(true);
    setInviteResult(null);
    try {
      const headers = await import('@/lib/db/getAuthHeaders').then(m => m.getAuthHeaders()).catch(() => ({}));
      const res = await fetch('/api/whatsapp/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
        body: JSON.stringify({ phone: invitePhone }),
      });
      if (res.ok) {
        setInviteResult('Invitation sent (simulated)');
        setInvitePhone('');
      } else {
        const data = await res.json().catch(() => ({}));
        setInviteResult(data?.error || 'Failed to send invite');
      }
    } catch (err) {
      setInviteResult('Network error');
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">WhatsApp Community</h2>
        <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="mt-4 h-10 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">WhatsApp Community</h2>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-8 xl:gap-12">
          {/* Main Action: Join */}
          <div className="flex flex-col gap-5 flex-1 justify-center">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-slate-200 p-3 text-slate-900">
                <PhoneIcon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg text-slate-900">
                  Join the Ibero Channel
                </h3>
                <p className="text-base text-slate-800 leading-relaxed">
                  Connect with fellow travelers and our support team. Get real-time updates and share your experience immediately.
                </p>
              </div>
            </div>
            <div className="pl-[4.25rem]">
              <button
                type="button"
                onClick={openWhatsApp}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 shadow-sm"
              >
                Join Ibero Community
              </button>
            </div>
          </div>

          {/* Secondary Action: Form */}
          <div className="w-full lg:w-[420px] shrink-0">
             <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-full justify-center">
              <div className="text-sm font-medium text-slate-900">
                Can&apos;t join directly? Request an invite:
              </div>
              <WhatsAppJoinForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
