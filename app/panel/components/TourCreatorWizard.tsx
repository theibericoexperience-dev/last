"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GlobeAmericasIcon, 
  CalendarDaysIcon, 
  UserGroupIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

/* 
  Tour Creator / Preferences Wizard 
  Seamlessly collects user preferences when they have no active orders.
*/

type Step = 'destination' | 'dates' | 'style' | 'travelers' | 'summary';

interface PreferenceData {
  destinations: string[];
  dateRange: string; // 'flexible', 'specific', 'month'
  approxDate?: string;
  travelStyle: string[]; // 'culinary', 'history', 'adventure', 'relax'
  adults: number;
  children: number;
  notes: string;
}

export default function TourCreatorWizard() {
  const [currentStep, setCurrentStep] = useState<Step>('destination');
  const [data, setData] = useState<PreferenceData>({
    destinations: [],
    dateRange: 'flexible',
    travelStyle: [],
    adults: 2,
    children: 0,
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const toggleSelection = (field: keyof PreferenceData, value: string) => {
    const list = data[field] as string[];
    const exists = list.includes(value);
    if (exists) {
      setData({ ...data, [field]: list.filter(item => item !== value) });
    } else {
      setData({ ...data, [field]: [...list, value] });
    }
  };

  const nextStep = () => {
    const order: Step[] = ['destination', 'dates', 'style', 'travelers', 'summary'];
    const idx = order.indexOf(currentStep);
    if (idx < order.length - 1) setCurrentStep(order[idx + 1]);
  };

  const prevStep = () => {
    const order: Step[] = ['destination', 'dates', 'style', 'travelers', 'summary'];
    const idx = order.indexOf(currentStep);
    if (idx > 0) setCurrentStep(order[idx - 1]);
  };

  const submitPreferences = async () => {
    // API Call placeholder
    console.log("Submitting preferences:", data);
    // Ideally save to a 'leads' or 'user_preferences' table
    try {
        await fetch('/api/user/preferences', { 
            method: 'POST', 
            body: JSON.stringify(data)
        });
    } catch(e) { console.error(e); }
    
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16 px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-amber-100"
        >
          <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircleIcon className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-serif text-slate-900 mb-4">Dream Trip Saved!</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Our travel designers are reviewing your preferences. We'll curate a personalized itinerary for you shortly.
          </p>
          <button 
             onClick={() => setSubmitted(false)}
             className="text-amber-600 font-medium hover:underline"
          >
            Edit Preferences
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mb-3">
          Design Your Journey
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Tell us what you love, and we'll craft the perfect Iberian experience for you.
        </p>
      </div>

      {/* Progress */}
      <div className="flex justify-center mb-10 gap-2">
        {['destination', 'dates', 'style', 'travelers', 'summary'].map((step, i) => (
          <div 
            key={step} 
            className={`h-2 rounded-full transition-all duration-300 ${
              step === currentStep ? 'w-12 bg-amber-500' : 
              ['destination', 'dates', 'style', 'travelers', 'summary'].indexOf(currentStep) > i ? 'w-4 bg-slate-300' : 'w-2 bg-slate-100'
            }`} 
          />
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex-1 p-8 md:p-12">
          <AnimatePresence mode="wait">
            
            {/* DESTINATION */}
            {currentStep === 'destination' && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <GlobeAmericasIcon className="w-8 h-8 text-amber-500" />
                  <h3 className="text-2xl font-light text-slate-900">Where would you like to go?</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Spain', 'Portugal', 'Combined'].map((place) => (
                    <button
                      key={place}
                      onClick={() => toggleSelection('destinations', place)}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        data.destinations.includes(place) 
                        ? 'border-amber-500 bg-amber-50 shadow-md ring-1 ring-amber-500' 
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-lg font-medium text-slate-900">{place}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* DATES */}
            {currentStep === 'dates' && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <CalendarDaysIcon className="w-8 h-8 text-amber-500" />
                  <h3 className="text-2xl font-light text-slate-900">When are you planning to travel?</h3>
                </div>
                <div className="space-y-4">
                   <button
                    onClick={() => setData({ ...data, dateRange: 'flexible' })}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                        data.dateRange === 'flexible' ? 'border-amber-500 bg-amber-50' : 'border-slate-100'
                    }`}
                   >
                     <div className="bg-white p-2 rounded-full shadow-sm">Thinking about it </div>
                     <span>I'm flexible with dates</span>
                   </button>
                   <button
                    onClick={() => setData({ ...data, dateRange: 'specific' })}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                        data.dateRange === 'specific' ? 'border-amber-500 bg-amber-50' : 'border-slate-100'
                    }`}
                   >
                     <div className="bg-white p-2 rounded-full shadow-sm">Exact Dates</div>
                     <span>I have specific dates in mind</span>
                   </button>
                </div>
              </motion.div>
            )}

             {/* STYLE */}
             {currentStep === 'style' && (
              <motion.div 
                 key="step3"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-6"
               >
                 <div className="flex items-center gap-3 mb-6">
                   <SparklesIcon className="w-8 h-8 text-amber-500" />
                   <h3 className="text-2xl font-light text-slate-900">What interests you most?</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   {[
                     { id: 'culinary', label: 'Food & Wine', emoji: '🍷' },
                     { id: 'history', label: 'History & Culture', emoji: '🏛️' },
                     { id: 'adventure', label: 'Nature & Adventure', emoji: '🌲' },
                     { id: 'relax', label: 'Relax & Leisure', emoji: '🏖️' },
                     { id: 'art', label: 'Art & Museums', emoji: '🎨' },
                     { id: 'luxury', label: 'Luxury & Shopping', emoji: '🛍️' },
                   ].map((style) => (
                     <button
                       key={style.id}
                       onClick={() => toggleSelection('travelStyle', style.id)}
                       className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${
                         data.travelStyle.includes(style.id) 
                         ? 'border-amber-500 bg-amber-50' 
                         : 'border-slate-100 hover:border-slate-300'
                       }`}
                     >
                       <span className="text-2xl mr-2">{style.emoji}</span>
                       <span className="font-medium text-slate-900">{style.label}</span>
                     </button>
                   ))}
                 </div>
               </motion.div>
             )}

            {/* TRAVELERS */}
             {currentStep === 'travelers' && (
              <motion.div 
                 key="step4"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-6"
               >
                 <div className="flex items-center gap-3 mb-6">
                   <UserGroupIcon className="w-8 h-8 text-amber-500" />
                   <h3 className="text-2xl font-light text-slate-900">Who is traveling?</h3>
                 </div>
                 
                 <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl">
                    <span className="text-lg font-medium text-slate-900">Adults</span>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setData({ ...data, adults: Math.max(1, data.adults - 1) })}
                            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-amber-600 font-bold text-xl"
                        >-</button>
                        <span className="text-xl w-8 text-center">{data.adults}</span>
                        <button 
                            onClick={() => setData({ ...data, adults: data.adults + 1 })}
                            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-amber-600 font-bold text-xl"
                        >+</button>
                    </div>
                 </div>

                 <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl">
                    <span className="text-lg font-medium text-slate-900">Children</span>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setData({ ...data, children: Math.max(0, data.children - 1) })}
                            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-amber-600 font-bold text-xl"
                        >-</button>
                        <span className="text-xl w-8 text-center">{data.children}</span>
                        <button 
                            onClick={() => setData({ ...data, children: data.children + 1 })}
                            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-amber-600 font-bold text-xl"
                        >+</button>
                    </div>
                 </div>
               </motion.div>
             )}

            {/* SUMMARY / CONFIRM */}
            {currentStep === 'summary' && (
                <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircleIcon className="w-8 h-8 text-amber-500" />
                  <h3 className="text-2xl font-light text-slate-900">Everything look correct?</h3>
                </div>
                
                <div className="bg-amber-50 rounded-2xl p-6 space-y-4 text-sm text-slate-700">
                    <div className="flex justify-between border-b border-amber-100 pb-2">
                        <span className="font-semibold">Destinations</span>
                        <span>{data.destinations.join(', ') || 'Not decided'}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-100 pb-2">
                        <span className="font-semibold">Travel Style</span>
                        <span>{data.travelStyle.join(', ') || 'Any'}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-100 pb-2">
                        <span className="font-semibold">Travelers</span>
                        <span>{data.adults} Adults, {data.children} Children</span>
                    </div>
                    <div>
                        <span className="font-semibold block mb-2">Additional Notes</span>
                        <textarea 
                            className="w-full p-3 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            placeholder="Tell us about special occasions, dietary restrictions, or specific cities you want to visit..."
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData({...data, notes: e.target.value})}
                        />
                    </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            {currentStep !== 'destination' ? (
                 <button 
                 onClick={prevStep}
                 className="flex items-center px-6 py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2"/> Back
                </button>
            ) : (
                <div /> // Spacer
            )}
           
            {currentStep === 'summary' ? (
                <button 
                onClick={submitPreferences}
                className="flex items-center px-8 py-3 bg-slate-900 text-white rounded-full font-semibold hover:bg-black transition-all shadow-lg hover:shadow-xl"
               >
                   Create My Trip <SparklesIcon className="w-5 h-5 ml-2" />
               </button>
            ) : (
                <button 
                onClick={nextStep}
                className="flex items-center px-8 py-3 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-all shadow-md"
               >
                   Next <ArrowRightIcon className="w-5 h-5 ml-2" />
               </button>
            )}
        </div>
      </div>
    </div>
  );
}
