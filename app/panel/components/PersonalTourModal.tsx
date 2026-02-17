'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/fetch/apiFetch';

interface PersonalTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // To support editing later
}

type Step = 'destination' | 'dates' | 'style' | 'travelers' | 'summary';

export default function PersonalTourModal({ isOpen, onClose, onSuccess, initialData }: PersonalTourModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('destination');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
      destinations: [] as string[],
      dateType: 'flexible', // flexible, specific
      dateText: '',
      styles: [] as string[],
      adults: 2,
      children: 0,
      notes: '',
      budget: 'medium' // economy, medium, luxury
  });

  // Reset or load initial data when modal opens
  useEffect(() => {
      if (isOpen) {
          if (initialData) {
              // TODO: Map existing data back to form if editing
          } else {
              setFormData({
                  destinations: [],
                  dateType: 'flexible',
                  dateText: '',
                  styles: [],
                  adults: 2,
                  children: 0,
                  notes: '',
                  budget: 'medium'
              });
              setCurrentStep('destination');
          }
      }
  }, [isOpen, initialData]);

  const toggleSelection = (field: 'destinations' | 'styles', value: string) => {
      setFormData(prev => {
          const list = prev[field];
          if (list.includes(value)) {
              return { ...prev, [field]: list.filter(x => x !== value) };
          } else {
              if (field === 'destinations' && list.length >= 3) return prev; // Max 3 destinations
              return { ...prev, [field]: [...list, value] };
          }
      });
  };

  const nextStep = () => {
    const steps: Step[] = ['destination', 'dates', 'style', 'travelers', 'summary'];
    const currIdx = steps.indexOf(currentStep);
    if (currIdx < steps.length - 1) setCurrentStep(steps[currIdx + 1]);
  };

  const prevStep = () => {
    const steps: Step[] = ['destination', 'dates', 'style', 'travelers', 'summary'];
    const currIdx = steps.indexOf(currentStep);
    if (currIdx > 0) setCurrentStep(steps[currIdx - 1]);
  };

  const handleSubmit = async () => {
      setLoading(true);
      try {
          const payload = {
              destination_text: formData.destinations.join(', '),
              features: formData.styles,
              extra_comments: formData.notes,
              party_description: `${formData.adults} Adults, ${formData.children} Children`,
              preferred_dates: formData.dateType === 'flexible' ? formData.dateText : formData.dateText, // Logic to improve
              budget_range: formData.budget,
              status: 'draft'
          };

          const res = await apiFetch('/api/user/personal-tours', {
              method: 'POST',
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              onSuccess();
              onClose();
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.95 }}
         className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-xl font-medium text-slate-900">Design your Custom Tour</h3>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
                <XMarkIcon className="h-6 w-6 text-slate-500" />
            </button>
        </div>

        {/* Body Content */}
        <div className="p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
                {currentStep === 'destination' && (
                    <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                        <h4 className="mb-4 text-lg font-medium text-slate-800">Where would you like to go?</h4>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {['Spain', 'Portugal', 'Morocco', 'France', 'Italy', 'Greece'].map(country => (
                                <button
                                    key={country}
                                    onClick={() => toggleSelection('destinations', country)}
                                    className={`rounded-xl border p-4 text-left transition-all ${formData.destinations.includes(country) ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'hover:border-slate-300'}`}
                                >
                                    <span className="font-medium">{country}</span>
                                </button>
                            ))}
                        </div>
                        <input 
                            type="text" 
                            placeholder="Other destinations (e.g. Barcelona, Seville...)" 
                            className="mt-4 w-full rounded-lg border-slate-300 p-3"
                            value={formData.destinations.filter(d => !['Spain', 'Portugal', 'Morocco', 'France', 'Italy', 'Greece'].includes(d)).join(', ')} 
                            onChange={(e) => {
                                // Simple text input handling for custom logic would be more complex, keeping simple for now
                            }}
                        />
                         <p className="mt-2 text-sm text-slate-500">Select partially or type specific regions.</p>
                    </motion.div>
                )}

                {currentStep === 'dates' && (
                    <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                        <h4 className="mb-4 text-lg font-medium text-slate-800">When are you planning to travel?</h4>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-slate-50">
                                <input type="radio" name="dateType" value="flexible" checked={formData.dateType === 'flexible'} onChange={() => setFormData({...formData, dateType: 'flexible'})} />
                                <div>
                                    <div className="font-medium">Flexible Dates</div>
                                    <div className="text-sm text-slate-500">I'm open to suggestions based on best season</div>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-slate-50">
                                <input type="radio" name="dateType" value="specific" checked={formData.dateType === 'specific'} onChange={() => setFormData({...formData, dateType: 'specific'})} />
                                <div>
                                    <div className="font-medium">Specific Dates</div>
                                    <div className="text-sm text-slate-500">I have exact dates in mind</div>
                                </div>
                            </label>
                            
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {formData.dateType === 'flexible' ? 'Approximate Month / Season' : 'Exact Dates'}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full rounded-lg border-slate-300 p-2"
                                    placeholder={formData.dateType === 'flexible' ? "e.g. September 2026" : "e.g. Oct 12 - Oct 20"}
                                    value={formData.dateText}
                                    onChange={(e) => setFormData({...formData, dateText: e.target.value})}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 'style' && (
                    <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                        <h4 className="mb-4 text-lg font-medium text-slate-800">What is your travel style?</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['History', 'Gastronomy', 'Relax & Luxury', 'Adventure', 'Family Friendly', 'Romantic'].map(style => (
                                <button
                                    key={style}
                                    onClick={() => toggleSelection('styles', style)}
                                    className={`rounded-xl border p-4 text-center transition-all ${formData.styles.includes(style) ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'hover:border-slate-300'}`}
                                >
                                    <span className="font-medium">{style}</span>
                                </button>
                            ))}
                        </div>
                        
                        <h4 className="mt-6 mb-3 text-lg font-medium text-slate-800">Budget Range</h4>
                        <div className="flex gap-4">
                            {['Economy', 'Medium', 'Luxury'].map(b => (
                                <button
                                  key={b}
                                  onClick={() => setFormData({...formData, budget: b.toLowerCase()})}
                                  className={`flex-1 rounded-lg border p-3 ${formData.budget === b.toLowerCase() ? 'bg-slate-900 text-white border-slate-900' : 'hover:bg-slate-50'}`}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {currentStep === 'travelers' && (
                    <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                         <h4 className="mb-6 text-lg font-medium text-slate-800">Who is traveling?</h4>
                         <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <div className="font-medium text-lg">Adults</div>
                                    <div className="text-slate-500">Age 13+</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setFormData(prev => ({...prev, adults: Math.max(1, prev.adults - 1)}))} className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-slate-100">-</button>
                                    <span className="w-8 text-center text-xl font-medium">{formData.adults}</span>
                                    <button onClick={() => setFormData(prev => ({...prev, adults: prev.adults + 1}))} className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-slate-100">+</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <div className="font-medium text-lg">Children</div>
                                    <div className="text-slate-500">Age 0-12</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setFormData(prev => ({...prev, children: Math.max(0, prev.children - 1)}))} className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-slate-100">-</button>
                                    <span className="w-8 text-center text-xl font-medium">{formData.children}</span>
                                    <button onClick={() => setFormData(prev => ({...prev, children: prev.children + 1}))} className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-slate-100">+</button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">Additional Notes / Special Requests</label>
                                <textarea 
                                    className="w-full rounded-lg border-slate-300 p-3 h-24"
                                    placeholder="Tell us about any special interests, allergies, or specific requirements..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                />
                            </div>
                         </div>
                    </motion.div>
                )}

                {currentStep === 'summary' && (
                    <motion.div key="step5" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                        <h4 className="mb-4 text-xl font-medium text-slate-900">Review your Request</h4>
                        <div className="rounded-xl bg-slate-50 p-6 space-y-4 text-sm text-slate-700">
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Destinations</span>
                                 <span className="font-medium text-right">{formData.destinations.join(', ') || 'Not selected'}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Dates</span>
                                 <span className="font-medium text-right">{formData.dateText || 'Flexible'}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Travel Party</span>
                                 <span className="font-medium text-right">{formData.adults} Adults, {formData.children} Children</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Style</span>
                                 <span className="font-medium text-right">{formData.styles.join(', ') || 'Any'}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Budget</span>
                                 <span className="font-medium text-right capitalize">{formData.budget}</span>
                             </div>
                             {formData.notes && (
                                 <div className="pt-2 border-t mt-2">
                                     <span className="block text-slate-500 mb-1">Notes</span>
                                     <p className="italic">{formData.notes}</p>
                                 </div>
                             )}
                        </div>
                        <p className="mt-6 text-sm text-slate-500 text-center">
                            By submitting, our team will review your preferences and contact you with a proposal.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between border-t bg-slate-50 px-6 py-4">
            {currentStep !== 'destination' ? (
                <button 
                  onClick={prevStep}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                    <ArrowLeftIcon className="h-4 w-4" /> Back
                </button>
            ) : (
                <div /> // Spacer
            )}

            {currentStep === 'summary' ? (
                 <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
                 >
                     {loading ? 'Submitting...' : 'Submit Request'}
                 </button>
            ) : (
                 <button 
                    onClick={nextStep}
                    disabled={currentStep === 'destination' && formData.destinations.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                 >
                     Next <ArrowRightIcon className="h-4 w-4" />
                 </button>
            )}
        </div>
      </motion.div>
    </div>
  );
}
