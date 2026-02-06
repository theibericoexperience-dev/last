"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BehindHeader } from './components/BehindHeader';
import { IntroSection } from './components/IntroSection';
import { HeroSection } from './components/HeroSection';
import { BehindModal } from './components/BehindModal';
import { useBehindIntroTransition } from './hooks/useBehindIntroTransition';
import { useBehindInkPlayback } from './hooks/useBehindInkPlayback';
import { HistoryHandle } from '@/components/HistoryContent';

export default function HistoriaPage() {
  const router = useRouter();
  const [isHeaderOpaque, setIsHeaderOpaque] = useState(false);
  const [phase, setPhase] = useState<'intro' | 'hero' | 'modal'>('intro');
  
  // Refs
  const inkRef = useRef<HTMLVideoElement | null>(null);
  const historyRef = useRef<HistoryHandle | null>(null);

  // Modal State
  const [showBehindModal, setShowBehindModal] = useState(false);
  const [behindView, setBehindView] = useState<'history' | 'ecosystem'>('history');
  const [bigYear, setBigYear] = useState<number | null>(null);
  const [modalConfig, setModalConfig] = useState<{ background: 'ink' | 'hero' | 'transparent'; mediaAutoplay?: boolean; view?: 'history' | 'ecosystem' }>({ background: 'ink', mediaAutoplay: false, view: 'history' });
  const [disabledPrevGlobal, setDisabledPrevGlobal] = useState(false);
  const [disabledNextGlobal, setDisabledNextGlobal] = useState(false);

  // Hooks
  useBehindInkPlayback({ phase, inkRef });
  useBehindIntroTransition(phase, setPhase, inkRef);

  // Manage header opacity on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderOpaque(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-black" style={{ scrollBehavior: 'smooth' }}>
      <BehindHeader isHeaderOpaque={isHeaderOpaque} />

      {/* Intro Overlay */}
      <IntroSection 
        phase={phase} 
        setPhase={setPhase} 
        inkRef={inkRef} 
        showBehindModal={showBehindModal} 
      />

      {/* Hero Content */}
      <HeroSection 
        phase={phase}
        setBehindView={setBehindView}
        setModalConfig={setModalConfig}
        setShowBehindModal={setShowBehindModal}
        behindView={behindView}
      />

      {/* Modal & Logic */}
      <BehindModal
        showBehindModal={showBehindModal}
        setShowBehindModal={setShowBehindModal}
        behindView={behindView}
        setBehindView={setBehindView}
        setModalConfig={setModalConfig}
        modalConfig={modalConfig}
        bigYear={bigYear}
        setBigYear={setBigYear}
        setDisabledPrevGlobal={setDisabledPrevGlobal}
        setDisabledNextGlobal={setDisabledNextGlobal}
        historyRef={historyRef}
        disabledPrevGlobal={disabledPrevGlobal}
        disabledNextGlobal={disabledNextGlobal}
      />
    </main>
  );
}
