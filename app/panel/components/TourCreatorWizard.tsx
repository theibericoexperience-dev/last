"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPinIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const AVAILABLE_ADDONS = [
  { id: 'Rental Car or Van', icon: '🚗' },
  { id: 'Car/Van + Driver', icon: '👨‍✈️' },
  { id: 'Guided Tours', icon: '🏛️' },
  { id: 'Cultural Experiences', icon: '🎭' },
  { id: 'Gastronomic Experiences', icon: '🍷' },
  { id: 'Suite Hotel Rooming', icon: '✨' },
];

type Step = 'where' | 'details' | 'success';

interface PreferenceData {
  destination_text: string;
  preferred_dates: string;
  party_description: string;
  features: string[];
  extra_comments: string;
}

export default function TourCreatorWizard({ maxHeight }: { maxHeight?: number | null }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('where');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalTravelers, setTotalTravelers] = useState<number>(2);
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
  
  const [data, setData] = useState<PreferenceData>({
    destination_text: '',
    preferred_dates: '',
    party_description: '',
    features: [],
    extra_comments: ''
  });

  const toggleAddon = (addonId: string) => {
    setData(prev => ({
      ...prev,
      features: prev.features.includes(addonId)
        ? prev.features.filter(f => f !== addonId)
        : [...prev.features, addonId]
    }));
  };

  const nextStep = () => {
    if (currentStep === 'where') {
      setCurrentStep('details');
      setHasAutoAdvanced(true);
    }
  };

  const prevStep = () => {
    if (currentStep === 'details') {
      setCurrentStep('where');
      setHasAutoAdvanced(true);
    }
  };

  useEffect(() => {
    if (!hasAutoAdvanced && currentStep === 'where' && data.destination_text.length > 3 && data.preferred_dates.length > 3 && selectedParty) {
      const timer = setTimeout(() => {
         nextStep();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data.destination_text, data.preferred_dates, selectedParty, currentStep, hasAutoAdvanced]);

  const submitProposal = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        party_description: selectedParty 
          ? `${selectedParty} • ${totalTravelers} travelers` + (data.party_description ? ` • ${data.party_description}` : '')
          : `${totalTravelers} travelers` + (data.party_description ? ` • ${data.party_description}` : ''),
      };

      const res = await fetch('/api/personal-tours', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to submit');
      }
      
      router.refresh();
      setCurrentStep('success');
    } catch(e) { 
      console.error(e); 
      alert("Failed to create request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPartyOption = (option: string) => {
    setSelectedParty(option);
    if (option === 'Just Me') setTotalTravelers(1);
    else if (option === 'Couple') setTotalTravelers(2);
    else if (option === 'Family') setTotalTravelers(3);
    else if (option === 'Group of Friends') setTotalTravelers(4);
  };

  if (currentStep === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-slate-100 shadow-sm w-full">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 mx-auto"
          >
            <CheckCircleIcon className="w-12 h-12" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-serif text-slate-900 mb-3">Request Sent Successfully</h2>
          <p className="text-base sm:text-lg text-slate-600 mb-6 max-w-md mx-auto">
            Our team is on the works! You will be contacted in less than 24 hours.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-0">
      <div className="w-full flex flex-col">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col w-full min-h-[460px]">
          <div className="p-3 sm:p-6 pb-0 flex-1">
            <AnimatePresence mode="wait">
              {currentStep === 'where' && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-10"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MapPinIcon className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm sm:text-base font-medium text-slate-900">Where</h3>
                    </div>
                    <input
                      type="text"
                      value={data.destination_text}
                      onChange={e => setData({...data, destination_text: e.target.value})}
                      placeholder="e.g. Costa Brava..."
                      className="w-full text-sm sm:text-base p-2.5 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow appearance-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CalendarIcon className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm sm:text-base font-medium text-slate-900">When</h3>
                    </div>
                    <input
                      type="text"
                      value={data.preferred_dates}
                      onChange={e => setData({...data, preferred_dates: e.target.value})}
                      placeholder="e.g. Next Summer..."
                      className="w-full text-sm sm:text-base p-2.5 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow appearance-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <UserGroupIcon className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm sm:text-base font-medium text-slate-900">Travelers</h3>
                    </div>
                    <div 
                      className="gap-2 mb-2 sm:mb-4 w-full"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                    >
                      {['Just Me', 'Couple', 'Family', 'Group of Friends'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setPartyOption(opt)}
                          className={`py-2 px-1 rounded-xl text-[12px] sm:text-sm text-center transition-all flex items-center justify-center border-2 leading-tight min-h-[38px] sm:min-h-[44px] bg-white ${
                            selectedParty === opt 
                              ? 'border-amber-600 text-slate-800 font-medium' 
                              : 'border-slate-100 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="hidden md:block mb-1.5 pointer-events-none" style={{ height: '24px' }} aria-hidden />

                    <div className="flex flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-3 mb-2 sm:mb-4">
                      <div className="text-xs sm:text-sm font-medium text-slate-700">Total travelers</div>
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                        <button
                          onClick={() => setTotalTravelers(t => Math.max(1, t - 1))}
                          className="w-9 h-9 rounded-md hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors font-medium text-lg"
                        >-</button>
                        <div className="w-8 text-center font-semibold text-slate-900 select-none text-base">{totalTravelers}</div>
                        <button
                          onClick={() => setTotalTravelers(t => t + 1)}
                          className="w-9 h-9 rounded-md hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors font-medium text-lg"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'details' && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 pb-4"
                >
                  <div className="space-y-3 sm:space-y-5">
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-slate-900 mb-2">Trip Details</h3>
                      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium mb-3 border border-emerald-100/50">
                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                        <span>Included by default: Flights, Hotels & Local Transport</span>
                      </div>
                    </div>

                    <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">
                      Would you like to add any of these services?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {AVAILABLE_ADDONS.map(addon => (
                        <button
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border-2 text-left transition-all bg-white ${
                            data.features.includes(addon.id)
                            ? 'border-amber-600 text-slate-800 font-medium'
                            : 'border-slate-100 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="text-base sm:text-lg shrink-0">{addon.icon}</span>
                          <span className="text-[11px] sm:text-[13px] leading-tight break-words">{addon.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-5">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2">Special Requests?</label>
                      <textarea 
                        className="w-full text-sm sm:text-base p-2.5 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow resize-none appearance-none"
                        placeholder="Dietary restrictions, specific places you must visit..."
                        rows={4}
                        value={data.extra_comments}
                        onChange={(e) => setData({...data, extra_comments: e.target.value})}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-4 py-3 sm:px-8 border-t border-slate-100 bg-slate-50/50 flex flex-col justify-between items-center rounded-b-3xl mt-auto w-full">
            {/* Progress bar below content */}
            <div className="flex items-center justify-center w-full mb-4">
              <div className="w-full max-w-sm flex items-center gap-2">
                <div className="flex-1 h-0.5 rounded-full bg-slate-200">
                  <div 
                    className="h-0.5 rounded-full bg-slate-900 transition-all duration-500"
                    style={{ width: currentStep === 'where' ? '50%' : '100%' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex w-full justify-between items-center relative">
              {currentStep !== 'where' ? (
                <button 
                  onClick={prevStep}
                  className="flex items-center p-2 text-slate-400 hover:text-amber-600 transition-colors"
                  title="Back"
                >
                  <ArrowLeftIcon className="w-6 h-6" strokeWidth={2}/>
                </button>
              ) : (
                <div />
              )}
              
              {currentStep === 'details' ? (
                <button 
                  disabled={isSubmitting || !data.destination_text.trim()}
                  onClick={submitProposal}
                  className="flex items-center px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-900 text-white rounded-full text-xs sm:text-sm font-medium hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed absolute left-1/2 -translate-x-1/2"
                >
                  {isSubmitting ? 'Sending...' : 'Request Proposal'} <SparklesIcon className="w-4 h-4 ml-1.5 sm:ml-2" />
                </button>
              ) : (
                <button 
                  onClick={nextStep}
                  disabled={currentStep === 'where' && !data.destination_text.trim()}
                  className="flex items-center p-2 text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed absolute right-0"
                  title="Next"
                >
                  <ArrowRightIcon className="w-6 h-6" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
