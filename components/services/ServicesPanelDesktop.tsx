"use client";

import React, { useRef } from 'react';
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
  const panelRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // Notify Header that services panel is OPEN
    window.dispatchEvent(new CustomEvent('landing-services-state', { detail: { open: true } }));
    
    if (!panelRef.current) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target && panelRef.current && !panelRef.current.contains(target)) {
        onCloseAction?.();
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => {
      document.removeEventListener('pointerdown', handler);
      // Notify Header that services panel is CLOSED
      window.dispatchEvent(new CustomEvent('landing-services-state', { detail: { open: false } }));
    };
  }, [onCloseAction]);

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
      <div ref={panelRef} className="services-panel-root relative w-full h-full min-h-[90vh] rounded-[28px] overflow-hidden bg-[#044E6F] flex flex-col">
        <div className="px-0 pt-16 pb-12 flex-1 flex items-start justify-center">
          <div className="w-full flex justify-center">
            <div className="max-w-none w-full mx-auto flex flex-col items-center px-0">
              {/* Main centered Services title */}
              <div className="w-full text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-[0.08em] text-amber-300">Services</h2>
              </div>

              <div className="grid grid-cols-3 gap-8 w-full auto-rows-fr items-stretch">
                {/* Column 1 */}
                <div className="px-0 py-2 h-full flex">
                  <div className="border border-white/10 rounded-2xl p-3 w-full flex flex-col items-stretch text-justify overflow-hidden h-full">
                    <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.08em] text-amber-300 w-full text-center">GROUPS</h3>
                    <div className="mt-4 flex-1 w-full min-h-[12rem] overflow-auto overflow-x-hidden pr-2">
                      <p className="text-lg md:text-xl text-white/80 leading-relaxed whitespace-normal break-words">
                        <span className="md:whitespace-normal">New Itineraries Run by Ibero, up to 25 travelers.</span>
                        <br />Guaranteed departures from 6 travelers in Europe and 12 travelers in other Continents.
                        <br />We provide on-the-ground guides, local curated experiences and full logistical support for groups and private departures.
                      </p>
                    </div>
                    <button onClick={handleExplore} className="mt-6 md:mt-auto self-center inline-flex items-center justify-center rounded-full border border-amber-300 text-amber-300 px-5 py-2 text-sm font-semibold uppercase hover:bg-amber-300 hover:text-black transition-colors">Explore</button>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="px-0 py-2 h-full">
                  <div className="border border-white/10 rounded-2xl p-3 w-full flex flex-col items-stretch text-justify overflow-hidden h-full">
                    <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.08em] text-amber-300 w-full text-center">AD HOC</h3>
                    <div className="mt-4 flex-1 w-full min-h-[12rem] overflow-auto overflow-x-hidden pr-2">
                      <p className="text-lg md:text-xl text-white/80 leading-relaxed whitespace-normal break-words">
                        <span className="whitespace-normal">Create your own tour, at your pace.</span>
                        <br />Bookings are available for next-week trips or months in advance.
                        <br />Our advisors help with route design, accommodation selection and bespoke activities.
                      </p>
                    </div>
                    <button onClick={handleBuild} className="mt-6 md:mt-auto self-center inline-flex items-center justify-center rounded-full border border-amber-300 text-amber-300 px-5 py-2 text-sm font-semibold uppercase hover:bg-amber-300 hover:text-black transition-colors">Build</button>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="px-0 py-2 h-full">
                  <div className="border border-white/10 rounded-2xl p-3 w-full flex flex-col items-stretch text-justify overflow-hidden h-full">
                    <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-[0.08em] text-amber-300 w-full text-center">B2B</h3>
                    <div className="mt-4 flex-1 w-full min-h-[12rem] overflow-auto overflow-x-hidden pr-2">
                      <p className="text-lg md:text-xl text-white/80 leading-relaxed md:text-left whitespace-normal break-words">
                        Ibero is an official DMC registered in Extremadura, Spain with current Global capability of Operation.
                        <br />We handle incentives, operator partnerships and large-group logistics worldwide.
                      </p>
                    </div>
                    <div className="mt-6 w-full flex justify-center">
                      <a href="mailto:b2b@ibero.world" className="inline-flex items-center justify-center rounded-full border border-amber-300 text-amber-300 px-5 py-2 text-sm font-semibold uppercase hover:bg-amber-300 hover:text-black transition-colors">b2b@ibero.world</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-center mt-10 pointer-events-auto">
                <button onClick={handleBookCall} className="bg-amber-300 text-black font-semibold px-6 py-3 rounded-full hover:bg-amber-400 transition-colors">Book a Call</button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mt-auto bg-transparent">
          <div className="max-w-[1400px] mx-auto px-6 py-6 flex flex-col items-center justify-center gap-2">
            <div className="text-white/90 text-sm md:text-base text-center">
              Our Mission is to provide True Travel Value to any operation that is entrusted to us.
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
