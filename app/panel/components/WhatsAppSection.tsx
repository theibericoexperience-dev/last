"use client";

import { useState } from 'react';
import { PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
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

  const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">WhatsApp Community</h2>
        <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="h-6 w-48 rounded bg-slate-200" />
              <div className="h-20 w-full rounded bg-slate-50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
        <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600" />
        
        <div className="p-5 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 xl:gap-12">
            
            {/* Main Action: Join */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <div className="shrink-0 rounded-2xl bg-green-50 p-4 text-green-600 ring-1 ring-green-100">
                  <WhatsAppIcon className="h-8 w-8 fill-current" />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    Join the Ibero Channel
                  </h3>
                  <p className="text-base text-slate-600 leading-relaxed max-w-md">
                    Connect with fellow travelers and our support team. Get real-time updates and share your experience immediately.
                  </p>
                  
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={openWhatsApp}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-green-600 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-green-700 hover:shadow-lg active:scale-[0.98] shadow-green-100"
                    >
                      <WhatsAppIcon className="mr-2 h-5 w-5 fill-current" />
                      Join now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Action: Form */}
            <div className="w-full lg:w-[380px] shrink-0">
              <div className="relative overflow-hidden flex flex-col gap-5 rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200 shadow-inner">
                <p className="text-sm text-slate-600 leading-relaxed">
                  If you cannot join directly, leave us your number and our team will send you a personalized invitation.
                </p>
                <div className="pt-1">
                  <WhatsAppJoinForm />
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
