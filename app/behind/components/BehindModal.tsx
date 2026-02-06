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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 pointer-events-auto"
    >
        {/* Main Modal Container */}
        <div data-behind-modal onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-6xl max-h-[90vh] rounded-lg shadow-2xl relative flex overflow-hidden">
            {/* Close Button */}
            <button
                onClick={() => setShowBehindModal(false)}
                className="absolute right-4 top-4 text-black rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/5 z-20"
                aria-label="Cerrar"
                data-no-close
            >
                ✕
            </button>

            {/* Content */}
            <div className="w-full h-full p-6 pt-12 relative flex-1 overflow-auto">
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
                    <EcosystemContent mediaAutoplay={Boolean(modalConfig.mediaAutoplay)} />
                 )}
            </div>
            
            {/* Centered Chevrons Overlay (Layout improvement over JS calculation) */}
            {/* We place chevrons in a layer *above* the content but constrained to the modal width */}
            {isHistory && (
                <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-between px-4 z-10">
                    <button
                        data-no-close
                        aria-label="prev-inline"
                        onClick={(e) => { e.stopPropagation(); historyRef.current?.prev(); }}
                        disabled={disabledPrevGlobal}
                        className={`pointer-events-auto w-12 h-12 bg-black/10 hover:bg-black/20 text-black text-4xl flex items-center justify-center rounded-full transition ${disabledPrevGlobal ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        ‹
                    </button>
                    <button
                        data-no-close
                        aria-label="next-inline"
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentYear = historyRef.current?.getYear?.();
                            const isNextDisabled = historyRef.current?.isNextDisabled?.();
                            if (currentYear === 2025 && isNextDisabled) {
                                setBehindView('ecosystem');
                                setModalConfig((m: any) => ({ ...m, view: 'ecosystem' }));
                            } else {
                                historyRef.current?.next();
                            }
                        }}
                        className={`pointer-events-auto w-12 h-12 bg-black/10 hover:bg-black/20 text-black text-4xl flex items-center justify-center rounded-full transition`}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>

        {/* Floating Tabs (Outside/Above Modal) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[10000] pointer-events-auto">
            <div className="flex gap-2 justify-center">
              <button
                data-no-close
                onClick={() => { setBehindView('history'); setModalConfig((m: any) => ({ ...m, view: 'history' })); }}
                aria-pressed={isHistory}
                className={`px-3 py-2 rounded-md text-sm font-semibold border ${isHistory ? 'border-gray-900 bg-gray-900 text-white' : 'border-white/30 text-white bg-transparent hover:bg-white/5'}`}>
                History
              </button>
              <button
                data-no-close
                onClick={() => { setBehindView('ecosystem'); setModalConfig((m: any) => ({ ...m, view: 'ecosystem' })); }}
                aria-pressed={isEcosystem}
                className={`px-3 py-2 rounded-md text-sm font-semibold border ${isEcosystem ? 'border-gray-900 bg-gray-900 text-white' : 'border-white/30 text-white bg-transparent hover:bg-white/5'}`}>
                Ecosystem
              </button>
            </div>
          </div>
    </div>
  );
}
