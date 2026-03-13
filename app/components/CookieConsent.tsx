"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent(){
  const pathname = usePathname() || '';
  const [show, setShow] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Never render on the panel — hard rule
  const isPanel = pathname.startsWith('/panel');

  // Single effect: check cookie once on mount / when path changes
  useEffect(() => {
    if (isPanel) {
      setShow(false);
      return;
    }
    // Minimal delay — just enough for hydration to finish
    const timer = setTimeout(() => {
      try {
        const cookies = document.cookie.split(';').map(s => s.trim());
        // v2_ prefix: any old consent without the version prefix is treated as absent
        // so all users see the banner again after this deploy
        const existing = cookies.find(s => s.startsWith('cookie_consent=v2_'));
        // Show only when no decision has been made yet
        if (!existing) {
          setShow(true);
        }
      } catch (_) {}
    }, 100);
    return () => clearTimeout(timer);
  }, [isPanel]);

  function accept() {
    document.cookie = 'cookie_consent=v2_yes; path=/; max-age=' + 60 * 60 * 24 * 365;
    setShow(false);
    setShowModal(false);
    try { window.dispatchEvent(new Event('cookie-consent-accepted')); } catch (_) {}
  }

  function decline() {
    document.cookie = 'cookie_consent=v2_no; path=/; max-age=' + 60 * 60 * 24 * 365;
    setShow(false);
    setShowModal(false);
  }

  // Don't render anything if on panel or not yet decided to show
  if (isPanel || !show) return null;

  return (
    <>
      {/* Cookie bubble button */}
      <AnimatePresence>
        {!showModal && (
          <motion.div
            key="cookie-bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 left-4 md:bottom-2 md:left-6 z-[99999]"
          >
            <motion.button
              onClick={() => setShowModal(true)}
              className="bg-transparent hover:bg-white/5 border-0 md:border md:border-amber-900/40 text-amber-900 rounded-full p-2.5 md:p-1.5 shadow-sm flex items-center justify-center md:backdrop-blur-sm"
              title="Cookie Settings"
              animate={{ y: [0, -18, 0, -9, 0, -3, 0] }}
              transition={{ delay: 0.4, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-3xl md:text-2xl select-none">🍪</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="cookie-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              className="bg-white rounded-lg p-8 max-w-sm w-full shadow-2xl relative border border-slate-100"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="text-4xl mb-4">🍪</div>
              <h3 className="text-2xl font-serif text-slate-900 mb-2">We value your privacy</h3>
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                We use cookies to improve your browsing experience and analyze our traffic.
                Your privacy is our priority.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={accept}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-full text-sm font-semibold transition-colors shadow-md"
                >
                  Accept All
                </button>
                <button
                  onClick={decline}
                  className="w-full border-2 border-slate-200 hover:border-slate-300 text-slate-600 py-3 rounded-full text-sm font-medium transition-colors"
                >
                  Decline
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
