"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { useLandingSectionsController } from './landing/controllers/useLandingSectionsController';
import VideoSequence from '../components/VideoSequence';
import { usePageEntryAnimation } from './providers/PageTransitionProvider';
import Button from '../components/ui/Button';
import TourGrid from '../components/TourGrid';
import HeroScrollArrow from '../components/HeroScrollArrow';
import RegisterForm from '@/components/auth/RegisterForm';
import Modal from '@/components/ui/Modal';

function Page() {
  const router = useRouter();
  const [registerModalOpen, setRegisterModalOpen] = React.useState(false);
  const {
    activeSectionId,
    goTo,
    scrollerRef,
    showHeader: controllerShowHeader,
    showHeroButtons: controllerShowHeroButtons,
    onWheel,
    onSectionClick,
  } = useLandingSectionsController();

  // Estados derivados: solo hay 3 vistas posibles: hero, 2026, 2027
  const isTourSection = activeSectionId === 'tour-2026' || activeSectionId === 'tour-2027';

  // Ocultar header y botones si estamos en card views (Tour 2026/2027)
  // para dar sensación de inmersión total.
  const showHeader = controllerShowHeader && !isTourSection;
  const showHeroButtons = controllerShowHeroButtons && !isTourSection;

  // Video: solo se reproduce cuando NO se está viendo 2026/2027
  const isVideoPaused = isTourSection;

  usePageEntryAnimation(scrollerRef, 'landing');

  const handleOpenPanel = React.useCallback(() => {
    router.push('/panel');
  }, [router]);

  const handleOpenRegister = React.useCallback(() => {
    setRegisterModalOpen(true);
  }, []);

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    // Wheel debe funcionar desde el primer frame, sin depender de que TourGrid ya haya montado.
    scroller.addEventListener('wheel', onWheel, { passive: false });

    // Click: usamos delegación (captura) en el scroller para que funcione aunque
    // las secciones 2026/2027 aparezcan más tarde.
    const handleClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const section = target?.closest?.('#tour-2026, #tour-2027');
      if (section) onSectionClick(e);
    };
    scroller.addEventListener('click', handleClickCapture, true);

    // Touch support: snap tras gesto táctil
    let touchY = null;
    const handleTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchY == null) return;
      const deltaY = e.changedTouches[0].clientY - touchY;
      if (Math.abs(deltaY) < 30) return; // Ignorar toques cortos
      if (deltaY < 0) {
        onWheel({ deltaY: 100, preventDefault: () => {}, } as any);
      } else {
        onWheel({ deltaY: -100, preventDefault: () => {}, } as any);
      }
      touchY = null;
    };
    scroller.addEventListener('touchstart', handleTouchStart, { passive: true });
    scroller.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('click', handleClickCapture, true);
      scroller.removeEventListener('touchstart', handleTouchStart);
      scroller.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollerRef, onWheel, onSectionClick]);

  return (
    <>
      {/* Fixed background video always present under the landing content */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden>
        <VideoSequence className="w-full h-full object-cover" isPaused={isVideoPaused} />
      </div>
      <div
        className={`landing-header-transition${showHeader ? ' landing-header-visible' : ''}`}
        style={{
          zIndex: 100,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          pointerEvents: showHeader ? 'auto' : 'none',
        }}
      >
        <Header transparent onOpenRegisterAction={handleOpenRegister} />
      </div>
      <main
  ref={scrollerRef}
        className="relative min-h-screen landing-main"
        style={{
          position: 'relative',
          zIndex: 20,
          height: '100vh',
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
          {/* HERO SECTION - pegado sin margen ni padding extra */}
          <section
            id="hero-section"
            style={{
              minHeight: '100vh',
              scrollSnapAlign: 'start',
              position: 'relative',
              scrollSnapStop: 'always',
              margin: 0,
              padding: 0,
              border: 0,
              boxSizing: 'border-box',
            }}
          >
            {/* hero section left intentionally empty because the video is fixed as background */}
            {/* overlay (no usado en modo estricto seccion-a-seccion) */}
            <div
              id="hero-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'transparent',
                pointerEvents: 'none',
                transition: 'background 300ms ease',
              }}
              data-covered={false}
            ></div>
            {/* overlay central con botones visibles sobre el video */}
            <div
              className={`hero-overlay fixed inset-0 z-[99] flex items-start justify-center pointer-events-none hero-buttons-anim${showHeroButtons ? ' hero-buttons-visible' : ''}`}
            >
              <div className="flex flex-row gap-48 mt-40 pointer-events-auto">
                <Button
                  id="landing-open-map-btn"
                  aria-label="Scroll to 2026 section"
                  onClick={() => {
                    goTo('tour-2026');
                  }}
                  size="lg"
                  className="gap-2 border border-white/20 bg-transparent shadow-none hover:bg-white/5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-globe"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span className="sr-only">Open map</span>
                </Button>
                <Button
                  id="landing-open-user-btn"
                  aria-label="Open user panel"
                  onClick={handleOpenPanel}
                  size="lg"
                  className="gap-2 border border-white/20 bg-transparent shadow-none hover:bg-white/5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-user"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="sr-only">Open user panel</span>
                </Button>
              </div>
            </div>
            {/* mini user icon solo visible cuando tour section está activa (body.tour-visible) */}
            <button
              onClick={handleOpenPanel}
              aria-label="Open user panel"
              className="mini-user-icon fixed top-4 right-4 z-[100] border border-white/20 bg-black/70 rounded-full p-2 shadow-lg transition-all duration-300"
              style={{ display: 'none' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-user text-white"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            <style>{`
              body.tour-visible .mini-user-icon { display: block !important; }
            `}</style>
          </section>
        {/* TOUR SECTIONS - TourGrid renderiza internamente tour-2026 y tour-2027 */}
        <TourGrid />
        {/* InteractiveMap is mounted persistently in layout via MapProvider; control via context */}
      </main>
      <style>{`
        .landing-header-transition {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-40px);
          transition: opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1);
          z-index: 100;
        }
        .landing-header-visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        .hero-buttons-anim {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-40px);
          transition: opacity 0.5s cubic-bezier(.4,0,.2,1), transform 0.5s cubic-bezier(.4,0,.2,1);
        }
        .hero-buttons-visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        #hero-overlay { z-index: 9999; transition: background 500ms ease, opacity 500ms ease; }
        #hero-overlay[data-covered="true"] {
          background: #000;
          opacity: 1;
          pointer-events: none;
        }
        #hero-overlay[data-covered="false"] { background: transparent; opacity: 0; pointer-events: none; }
        .landing-header-transition:not(.landing-header-visible) + main .hero-overlay { opacity: 0; pointer-events: none; transition: opacity 300ms ease; }
      `}</style>

      {registerModalOpen && (
        <Modal open={registerModalOpen} onCloseAction={() => setRegisterModalOpen(false)} maxWidth="max-w-xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-4">Register</h2>
            <RegisterForm autoFocus onSuccessAction={() => setRegisterModalOpen(false)} />
          </div>
        </Modal>
      )}
    </>
  );
}

export default Page;
