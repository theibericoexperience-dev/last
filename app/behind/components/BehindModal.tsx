"use client";
import React from 'react';
import HistoryContent, { HistoryHandle } from '@/components/HistoryContent';
import EcosystemContent from '@/components/EcosystemContent';

interface BehindModalProps {
  showBehindModal: boolean;
  setShowBehindModal: (v: boolean) => void;
  behindView: 'history' | 'ecosystem';
  setBehindView: (v: 'history' | 'ecosystem') => void;
  setModalConfig: (c: any) => void;
  modalConfig: any;
  bigYear: number | null;
  setBigYear: (y: number) => void;
  setDisabledPrevGlobal: (v: boolean) => void;
  setDisabledNextGlobal: (v: boolean) => void;
  historyRef: React.RefObject<HistoryHandle | null>;
  disabledPrevGlobal: boolean;
  disabledNextGlobal: boolean;
}

export function BehindModal({
  showBehindModal,
  setShowBehindModal,
  behindView,
  setBehindView,
  setModalConfig,
  modalConfig,
  bigYear,
  setBigYear,
  setDisabledPrevGlobal,
  setDisabledNextGlobal,
  historyRef,
  disabledPrevGlobal,
  disabledNextGlobal,
}: BehindModalProps) {
  if (!showBehindModal) return null;

  const isHistory = behindView === 'history';
  const isEcosystem = behindView === 'ecosystem';

  return (
    <div
      onClick={(e) => {
        // Close on backdrop click (if not on a no-close element)
        if ((e.target as Element)?.closest?.('[data-no-close]')) return;
        setShowBehindModal(false);
      }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 lg:p-5 pointer-events-auto bg-white/70 backdrop-blur-md transition-all duration-300"
      style={{ padding: "clamp(0.75rem, 3.5vh, 2.25rem)" }}
    >
        {/* Main Modal Container Styles copied from TourClient */}
        <div 
          data-behind-modal 
          onClick={(e) => e.stopPropagation()} 
          className="w-full h-full relative flex flex-col overflow-hidden max-w-[1500px] mx-auto"
          style={{
            backgroundColor: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255,255,255,0.1)"
          }}
        >
             {/* Header */}
             <div className="w-full pt-1 px-4 lg:px-6 flex items-center justify-between relative z-10 shrink-0 pb-1 h-10">
                 <div className="w-[100px]" /> {/* Spacer */}

                 {/* Center Tabs */}
                 <div className="flex flex-col items-center gap-1 z-50 absolute left-1/2 top-1 -translate-x-1/2">
                    <div className="bg-black/90 p-0.5 rounded-full backdrop-blur-xl shadow-2xl flex border border-white/10 scale-90 origin-top">
                     <button 
                       onClick={() => setBehindView('history')}
                       className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${behindView === 'history' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                     >
                       History
                     </button>
                     <button 
                       onClick={() => setBehindView('ecosystem')}
                       className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${behindView === 'ecosystem' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                     >
                       Behind
                     </button>
                    </div>
                 </div>

                 {/* Close Button Group */}
                 <div className="flex justify-end w-[100px]">
                    <button
                        onClick={() => setShowBehindModal(false)}
                        className="w-7 h-7 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full text-gray-700 transition-colors backdrop-blur-sm text-sm"
                        aria-label="Cerrar"
                        data-no-close
                    >
                        ✕
                    </button>
                 </div>
             </div>

            {/* Content */}
            <div className={`w-full h-full relative flex-1 overflow-hidden ${isHistory ? 'bg-transparent' : 'bg-white/60 backdrop-blur-sm m-4 rounded-xl border border-white/50'}`}>
                 {isHistory ? (
                    <HistoryContent
                        ref={historyRef}
                        initialYear={bigYear ?? 2021}
                        mediaAutoplay={Boolean(modalConfig.mediaAutoplay)}
                        onStateChange={(s) => {
                            setDisabledPrevGlobal(Boolean(s.disabledPrev));
                            setDisabledNextGlobal(Boolean(s.disabledNext));
                            setBigYear(Number(s.year));
                        }}
                        onYearSelected={(y) => setBigYear(Number(y))}
                        onAdvanceBeyondLast={() => {
                            setBehindView('ecosystem');
                            setModalConfig((m: any) => ({ ...m, view: 'ecosystem' }));
                        }}
                    />
                 ) : (
                    <div className="w-full h-full overflow-hidden rounded-xl">
                       <EcosystemContent mediaAutoplay={Boolean(modalConfig.mediaAutoplay)} />
                    </div>
                 )}
            </div>
            
            {/* Centered Chevrons Overlay (Only for History) */}
            {isHistory && (
                <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-between px-4 z-10">
                    <button
                        data-no-close
                        aria-label="prev-inline"
                        onClick={(e) => { e.stopPropagation(); historyRef.current?.prev(); }}
                        disabled={disabledPrevGlobal}
                        className={`pointer-events-auto w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-black text-4xl flex items-center justify-center rounded-full transition shadow-lg ${disabledPrevGlobal ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        ‹
                    </button>
                    <button
                        data-no-close
                        aria-label="next-inline"
                        onClick={(e) => { e.stopPropagation(); historyRef.current?.next(); }}
                        disabled={disabledNextGlobal}
                        className={`pointer-events-auto w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-black text-4xl flex items-center justify-center rounded-full transition shadow-lg ${disabledNextGlobal ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}
