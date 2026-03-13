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

export default function ServicesPanelDesktop({ onCloseAction, onSwitchToToursAction, onRequireAuthAction }: Props) {
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

  const handleExplore = () => {
    onSwitchToToursAction?.();
  };
  const handleBuild = () => {
    void handleTourOnDemand();
  };

  return (
    <div className="w-full h-full text-white flex flex-col justify-between">
      <div className="services-panel-root w-full h-full min-h-[90vh] rounded-[28px] overflow-hidden bg-[#06080c] flex flex-col">
        <div className="px-8 pt-14 pb-6 flex-1 flex items-start justify-center relative">
          {onCloseAction && (
            <button onClick={onCloseAction} aria-label="Close services" className="absolute top-4 right-4 p-1 text-white hover:text-amber-300 z-50 bg-transparent">
              <svg className="block" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}

          <div className="w-full flex justify-center">
            <div className="max-w-[1400px] w-full mx-auto flex flex-col items-center">
              <div className="grid grid-cols-3 gap-8 w-full auto-rows-fr">
                {/* Column 1 */}
                <div className="flex flex-col items-center text-center px-6 py-4 h-full">
                  <div className="title-wrapper flex items-center justify-center min-h-[5.5rem]">
                    <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.08em] text-amber-300">Itineraries<br/>for 26, 27 &amp; 28</h3>
                  </div>
                  <div className="body-wrapper flex-1 flex flex-col items-center justify-start pt-3">
                    <p className="text-lg md:text-xl text-white/80 leading-relaxed text-center md:max-w-[34rem] min-h-[7.5rem]">
                      <span className="md:whitespace-nowrap">New Itineraries Run by Ibero, up to 25 travelers.</span><br/>Guaranteed departures from 6 travelers in Europe and 12 travelers in other Continents.
                    </p>
                    <button onClick={handleExplore} className="mt-5 inline-flex items-center justify-center rounded-full border border-amber-300 text-amber-300 px-5 py-2 text-sm font-semibold uppercase hover:bg-amber-300 hover:text-black transition-colors">Explore</button>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="flex flex-col items-center text-center px-6 py-4 h-full md:border-l md:border-white/10 md:px-10 md:items-start md:text-left">
                  <div className="title-wrapper w-full flex items-center justify-center min-h-[5.5rem]">
                    <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.08em] text-amber-300 text-center">AD HOC</h3>
                  </div>
                  <div className="body-wrapper flex-1 flex flex-col items-center justify-start pt-3">
                    <p className="text-lg md:text-xl text-white/80 leading-relaxed text-center min-h-[7.5rem] max-w-[30rem]">
                      <span className="whitespace-nowrap">Create your own tour, at your pace.</span> Bookings are available for next-week trips or months in advance.
                    </p>
                    <button onClick={handleBuild} className="mt-5 inline-flex items-center justify-center rounded-full border border-amber-300 text-amber-300 px-5 py-2 text-sm font-semibold uppercase hover:bg-amber-300 hover:text-black transition-colors">Build</button>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="flex flex-col items-center text-center px-6 py-4 h-full md:border-l md:border-white/10 md:px-10">
                  <div className="title-wrapper flex items-center justify-center min-h-[5.5rem]">
                    <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.08em] text-amber-300">B2B</h3>
                  </div>
                  <div className="body-wrapper flex-1 flex flex-col items-center justify-start pt-3">
                    <p className="text-lg md:text-xl text-white/80 leading-relaxed text-center md:text-left min-h-[7.5rem] max-w-[31rem] md:max-w-[45rem]">
                      Ibero is an official DMC registered in Extremadura, Spain with current Global capability of Operation.
                      <span className="block mt-2 text-sm text-white/80 text-center">Any proposal can also be sent to <a href="mailto:b2b@ibero.world" className="underline underline-offset-4 hover:text-amber-300">b2b@ibero.world</a>.</span>
                    </p>
                    <div className="mt-5 h-[42px]" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-center mt-6 pointer-events-auto">
                <button onClick={handleBookCall} className="bg-amber-300 text-black font-semibold px-5 py-2 rounded-full hover:bg-amber-400 transition-colors">Book a Call</button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mt-auto bg-transparent">
          <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col items-center justify-center gap-2">
            <div className="text-white/90 text-sm md:text-base text-center">
              Our Mission is to provide True Travel Value to any operation that is trusted to us.
            </div>
            <div className="text-white/90 text-sm md:text-base text-center">
              All services provided under certified license: NAME: IBERO · CIEX: 06-00049-Om · REG NO: AV-00661 · EMAIL: tours@ibero.world
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
