"use client";

import React, { useState, useCallback } from 'react';
import AboutIntro from './components/AboutIntro';
import ManifestoSection from './components/ManifestoSection';
import HistoryColumns from './components/HistoryColumns';
import EcosystemModal from './components/EcosystemModal';

type Phase = 'intro' | 'manifesto' | 'history';

export default function AboutPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [ecoOpen, setEcoOpen] = useState(false);
  const [headerSticky, setHeaderSticky] = useState(false);
  const [manifestoHidden, setManifestoHidden] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);

  // intro -> manifesto only; header/menu activation must happen only on explicit button clicks
  const goManifesto = useCallback(() => {
    setPhase('manifesto');
  }, []);

  const goHistory = useCallback(() => {
    // user requested History: make header sticky and hide manifesto immediately
    setHeaderSticky(true);
    setManifestoHidden(true);
    setPhase('history');
  }, []);

  const openEcosystem = useCallback(() => {
    setHeaderSticky(true);
    setManifestoHidden(true);
    setEcoOpen(true);
  }, []);

  const closeEcosystem = useCallback(() => setEcoOpen(false), []);

  const historyPrev = useCallback(() => setHistoryIndex((i) => Math.max(0, i - 1)), []);
  const historyNext = useCallback(() => setHistoryIndex((i) => Math.min(2, i + 1)), []);

  return (
  <main className="min-h-screen bg-[#f5f0e8] text-[#111111] relative">
      {/* Phase: Intro (ink video overlay) */}
      {phase === 'intro' && <AboutIntro onStartAction={goManifesto} />}

      {/* Phase: Manifesto */}
      {phase === 'manifesto' && (
        <ManifestoSection
          onHistoryAction={goHistory}
          onEcosystemAction={openEcosystem}
          hidden={manifestoHidden}
        />
      )}

      {/* Sticky header (appears when manifesto pushed up) */}
      {headerSticky && (
  <div className="fixed top-0 left-0 right-0 z-60 bg-[#f5f0e8]/78 backdrop-blur-xl border-b border-transparent shadow-none">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-[120px]">
              <button
                onClick={() => { setPhase('manifesto'); setManifestoHidden(false); setHeaderSticky(false); }}
                className="text-[10px] md:text-xs font-bold uppercase tracking-[0.22em] text-black/50 hover:text-black transition-colors"
              >
                Back
              </button>
              <div className="text-[10px] md:text-xs font-medium tracking-[0.18em] uppercase text-black/25">About</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/30 px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                <button onClick={() => { setPhase('history'); setHeaderSticky(true); setManifestoHidden(true); }} className={`px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all ${phase === 'history' ? 'bg-black text-white shadow-sm' : 'text-[#111111] hover:bg-black/5'}`}>History</button>
                <button onClick={() => openEcosystem()} className={`px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all ${ecoOpen ? 'bg-black text-white shadow-sm' : 'text-[#111111] hover:bg-black/5'}`}>Ecosystem</button>
              </div>

              {/* History prev/next buttons removed: navigation is scroll-driven via HistoryColumns */}
            </div>

            <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.28em] text-black/35 min-w-[120px] text-right">IBERO</div>
          </div>
        </div>
      )}

      {/* Phase: History rows */}
      {phase === 'history' && (
        <div className="fixed inset-x-0 top-[72px] bottom-0 overflow-hidden flex flex-col items-center justify-start bg-[#f5f0e8]">
          <HistoryColumns historyIndex={historyIndex} onHistoryIndexChangeAction={setHistoryIndex} />
        </div>
      )}

      {/* Ecosystem modal overlay (can be opened from any phase) */}
      {ecoOpen && <EcosystemModal onCloseAction={closeEcosystem} />}
    </main>
  );
}
