"use client";

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { CheckIcon, ChevronRightIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

interface IberoPackageModalProps {
  open: boolean;
  onClose: () => void;
  showOptionals?: boolean;
  onOpenOptionals?: () => void;
}

export default function IberoPackageModal({ 
  open, 
  onClose, 
  showOptionals = false, 
  onOpenOptionals 
}: IberoPackageModalProps) {
  const [showLearnMore, setShowLearnMore] = useState(false);

  return (
    <Modal open={open} onCloseAction={onClose} maxWidth="max-w-4xl" plain>
      <div className="w-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
         
         {/* TOP: Visual Image (Cinematic) */}
         <div className="w-full h-48 relative overflow-hidden shrink-0">
            <img 
              src="https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/MISC/IberoPackage.webp" 
              alt="Ibero Package" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <h2 className="absolute bottom-4 left-8 text-3xl font-serif font-bold text-white shadow-sm">The Ibero Package</h2>
         </div>

         {/* BOTTOM: Content */}
         <div className="flex-1 p-8 flex flex-col relative">
            <p className="text-gray-600 mb-6 text-base leading-relaxed">
              Everything you need for a seamless journey, included in one transparent price.
            </p>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                "International flights from US Hubs", 
                "Accommodation in 4-5★ hotels", 
                "Full-time bilingual tour guide", 
                "Ground transportation", 
                "Daily buffet breakfast"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-800">
                    <div className="bg-green-100 p-0.5 rounded-full mt-0.5 shrink-0">
                      <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span className="leading-tight">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-start pt-6 border-t border-gray-100/50">
                {showOptionals && onOpenOptionals && (
                  <button 
                    onClick={() => {
                      onClose();
                      onOpenOptionals();
                    }}
                    className="group flex items-center gap-2 text-xs font-bold text-gray-900 border border-black/10 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all"
                  >
                    <span>Explore Optionals</span>
                    <ChevronRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
            </div>

            {/* Legal Footer */}
            <div className="mt-8 pt-4 border-t border-gray-100 text-[9px] text-gray-400 leading-relaxed font-sans relative">
               <p className="font-bold text-gray-500 mb-2 uppercase tracking-wide">
                  All services provided under certified license:
               </p>
               <div className="grid grid-cols-2 gap-x-8 gap-y-1 w-full max-w-md">
                 <div>NAME: <strong>IBERO</strong></div>
                 <div>CIEX: <strong>06-00049-Om</strong></div>
                 <div>REG NO: <strong>AV-00661</strong></div>
                 <div>EMAIL: <strong>tours@ibero.world</strong></div>
                 <div className="col-span-2">WEBSITE: <strong>www.ibero.world</strong></div>
               </div>

               <div className="mt-3">
                  <button 
                    onClick={() => setShowLearnMore(!showLearnMore)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition-colors"
                  >
                    <InformationCircleIcon className="w-3.5 h-3.5" />
                    <span>Learn more about it</span>
                  </button>
                  
                  {/* Popover */}
                  {showLearnMore && (
                    <div className="absolute left-0 bottom-full mb-2 w-72 bg-gray-900 text-white p-4 rounded-xl shadow-xl z-50 text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                       <h5 className="font-bold mb-2 text-white border-b border-white/20 pb-2">Why Certification Matters</h5>
                       <p>
                         A certified travel agency offers exclusive perks, expert vetting, and a professional safety net if things go wrong. You save time, gain consumer protection, and trade "hoping for the best" for guaranteed peace of mind.
                       </p>
                       <button onClick={() => setShowLearnMore(false)} className="absolute top-2 right-2 text-white/50 hover:text-white">✕</button>
                    </div>
                  )}
               </div>
            </div>
         </div>

         <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors z-20 flex items-center justify-center h-8 w-8 backdrop-blur-md"
         >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
      </div>
    </Modal>
  );
}
