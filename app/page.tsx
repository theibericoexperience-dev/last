"use client";

import React, { useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import LeftSectionNav from '../components/LeftSectionNav';
import { useLandingSectionsController } from './landing/controllers/useLandingSectionsController';
import VideoSequence from '../components/VideoSequence';
import { usePageEntryAnimation } from './providers/PageTransitionProvider';
import Button from '../components/ui/Button';
import TourGrid from '../components/TourGrid';
import HeroScrollArrow from '../components/HeroScrollArrow';
import RegisterForm from '@/components/auth/RegisterForm';
import Modal from '@/components/ui/Modal';
import IberoPackageModal from '@/components/IberoPackageModal';
import { useLoader } from '@/components/GlobalLoaderProvider';

function Page() {
  const router = useRouter();
  const { startLoading } = useLoader();
  const [isPending, startTransition] = useTransition();
  const [registerModalOpen, setRegisterModalOpen] = React.useState(false);
  const [packageModalOpen, setPackageModalOpen] = React.useState(false);

  const {
    activeSectionId,
    goTo,
    scrollerRef,
    showHeader: controllerShowHeader,
    showHeroButtons: controllerShowHeroButtons,
    onWheel,
    onSectionClick,
  } = useLandingSectionsController();

  const isTourSection = activeSectionId === 'tour-2026' || activeSectionId === 'tour-2027';
  const isJoinSection = activeSectionId === 'join-club';
  const isHero = !isTourSection && !isJoinSection;
  const showHeader = (controllerShowHeader || isHero) && !isTourSection && !isJoinSection;
  const showHeroButtons = controllerShowHeroButtons && !isTourSection && !isJoinSection;
  const isVideoPaused = isTourSection;

  usePageEntryAnimation(scrollerRef, 'landing');

  const handleOpenPanel = React.useCallback(() => {
    startLoading();
    startTransition(() => {
      router.push('/panel');
    });
  }, [router, startLoading]);

  const handleOpenRegister = React.useCallback(() => {
    setRegisterModalOpen(true);
  }, []);

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.addEventListener('wheel', onWheel, { passive: false });

    const handleClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const section = target?.closest?.('#tour-2026, #tour-2027');
      if (section) onSectionClick(e);
    };
    scroller.addEventListener('click', handleClickCapture, true);

    let touchY: number | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchY === null) return;
      const deltaY = e.changedTouches[0].clientY - touchY;
      if (Math.abs(deltaY) < 30) return;
      if (deltaY < 0) {
        onWheel({ deltaY: 100, preventDefault: () => {} } as any);
      } else {
        onWheel({ deltaY: -100, preventDefault: () => {} } as any);
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
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <VideoSequence
          className="w-full h-full object-cover"
          isPaused={isVideoPaused}
          contained={true}
          poster="https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/MISC/thumbnail.jpg"
        />
      </div>
      <div
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-500 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <Header transparent onOpenRegisterAction={handleOpenRegister} />
      </div>

      {(isTourSection || isJoinSection) && (
        <LeftSectionNav
          activeSectionId={activeSectionId}
          goToAction={goTo}
        />
      )}
      <main
        ref={scrollerRef}
        className="relative h-screen overflow-y-auto snap-y snap-mandatory touch-pan-y"
      >
        <section
          id="hero-section"
          className="h-screen snap-start relative"
        >
          <div
            id="hero-overlay"
            className="absolute inset-0 bg-transparent transition-colors duration-300 pointer-events-none"
            data-covered={false}
          ></div>
          <div
            className={`fixed inset-0 z-40 flex items-start justify-center pointer-events-none transition-opacity duration-500 ${showHeroButtons ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 mt-32 sm:mt-40 pointer-events-auto">
              <Button
                id="landing-open-map-btn"
                aria-label="Scroll to 2026 section"
                onClick={() => goTo('tour-2026')}
                size="lg"
                className="gap-2 border border-white/20 bg-transparent shadow-none hover:bg-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-globe"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                <span className="sr-only">Open map</span>
              </Button>
              <Button
                id="landing-open-user-btn"
                aria-label="Open user panel"
                onClick={handleOpenPanel}
                size="lg"
                className="gap-2 border border-white/20 bg-transparent shadow-none hover:bg-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span className="sr-only">Open user panel</span>
              </Button>
            </div>
          </div>
        </section>

        <TourGrid goToAction={goTo} />

        <section
          id="join-club"
          className="h-screen relative flex items-center justify-center snap-start text-white bg-black/60"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
          <div className="max-w-4xl w-full mx-6 p-8 sm:p-14 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 z-10 flex flex-col items-center gap-6 shadow-2xl animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold leading-tight text-center">
              Join The Ibero Club <br />
              <span className="text-lg sm:text-xl md:text-2xl font-sans font-light italic text-gray-300 block mt-2 sm:mt-4 tracking-wide">
                Your All-In Solution For Authentic Group & Personal Travel
              </span>
            </h2>
            <p className="text-gray-300 max-w-2xl text-base sm:text-lg leading-relaxed font-serif text-center">
              Let us design with all the ingredients that when combined, create lifetime experiences while discovering the world & meeting fellow travelers.
            </p>
            <div className="flex flex-col md:flex-row gap-4 mt-4 w-full justify-center">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200 px-6 py-3 sm:px-8 sm:py-4 text-sm font-bold uppercase tracking-widest rounded-full"
                onClick={handleOpenRegister}
              >
                Create an Account & Win $500 Credit
              </Button>
              <Button
                size="lg"
                className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 sm:px-8 sm:py-4 text-sm font-bold uppercase tracking-widest rounded-full backdrop-blur-md"
                onClick={() => router.push('/behind')}
              >
                Who's Behind Ibero?
              </Button>
            </div>
            <button
              onClick={() => setPackageModalOpen(true)}
              className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors border-b border-white/20 hover:border-white pb-0.5"
            >
              Discover about the Ibero Package
            </button>
          </div>
        </section>
      </main>

      {registerModalOpen && (
        <Modal open={registerModalOpen} onCloseAction={() => setRegisterModalOpen(false)} maxWidth="max-w-xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center mb-4">Register</h2>
            <RegisterForm autoFocus onSuccessAction={() => setRegisterModalOpen(false)} />
          </div>
        </Modal>
      )}

      <IberoPackageModal
        open={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
        showOptionals={false}
      />
    </>
  );
}

export default Page;
