"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/db/supabaseClient';

type Props = {
  onCloseAction?: () => void;
  onSwitchToToursAction?: () => void;
  onRequireAuthAction?: () => void;
  onOpenPackageAction?: () => void;
};

export default function ServicesPanelMobile({ onSwitchToToursAction, onRequireAuthAction, onOpenPackageAction }: Props) {
  const router = useRouter();

  const handleTourOnDemand = async () => {
    const session = await supabaseClient?.auth.getSession();
    if (session?.data.session?.user) {
      router.push('/panel#section-profile');
      return;
    }
    onRequireAuthAction?.();
  };

  const handleBookCall = () => {
    router.push('/panel#section-call');
  };

  return (
    <div className="w-full rounded-[28px] bg-[#06080c] text-white border border-white/10 overflow-hidden min-h-[calc(100vh-140px)]">
      <div className="flex min-h-[calc(100vh-140px)] flex-col divide-y divide-white/15">
        <section className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
          <button onClick={onSwitchToToursAction} className="text-center text-lg font-extrabold uppercase tracking-[0.12em] text-white hover:text-amber-300 transition-colors">
            Itineraries for 26, 27 & 28
          </button>
          <p className="text-sm leading-relaxed text-white/80">
            New Itineraries Run by Ibero, up to 25 travelers. Guaranteed departures from 6 travelers in Europe and 12 travelers in other Continents.
          </p>
        </section>

        <section className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
          <button onClick={handleTourOnDemand} className="text-center text-lg font-extrabold uppercase tracking-[0.12em] text-white hover:text-amber-300 transition-colors">
            Tour On Demand
          </button>
          <p className="text-sm leading-relaxed text-white/80">
            Create your own tour, at your pace. Bookings are available for next-week trips or months in advance.
          </p>
        </section>

        <section className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
          <h3 className="text-center text-lg font-extrabold uppercase tracking-[0.12em] text-white">B2B</h3>
          <div className="space-y-3 text-sm leading-relaxed text-white/80">
            <p>Ibero is an official DMC registered in Extremadura, Spain with current global capability of Operation.</p>
            <p>Our Mission is to provide True Travel Value to any operation that is trusted to us.</p>
            <p>
              Current fields for collaboration:
              <br />
              Tour Design | Catering | Events | Content Creation | Real Estate | Logistics | System Creation | Education | Software
            </p>
            <p>Any proposal can also be sent to <a href="mailto:b2b@ibero.world" className="text-white underline underline-offset-4 hover:text-amber-300">b2b@ibero.world</a>.</p>
          </div>
          <div className="pt-2 space-y-3">
            <button
              onClick={handleBookCall}
              className="inline-flex items-center justify-center rounded-full border border-white/25 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white hover:border-white hover:bg-white/10 transition-colors"
            >
              Book a Call
            </button>
            <div className="space-y-2 text-[10px] leading-relaxed text-white/45">
              <p className="font-bold uppercase tracking-[0.12em] text-white/55">All services provided under certified license:</p>
              <div className="space-y-1">
                <p>NAME: <strong className="text-white/75">IBERO</strong></p>
                <p>CIEX: <strong className="text-white/75">06-00049-Om</strong></p>
                <p>REG NO: <strong className="text-white/75">AV-00661</strong></p>
                <p>EMAIL: <strong className="text-white/75">tours@ibero.world</strong></p>
                <p>WEBSITE: <strong className="text-white/75">www.ibero.world</strong></p>
              </div>
              <button onClick={onOpenPackageAction} className="text-white underline underline-offset-4 hover:text-amber-300 transition-colors">
                Learn more about it
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
