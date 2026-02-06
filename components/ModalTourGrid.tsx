import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
import { publishLandingScrollTo } from '../lib/navigation/intents';

// Use dynamic import to avoid hydration issues if TourGrid uses client hooks
const TourGrid = dynamic(() => import('./TourGrid'), { ssr: false });

export default function ModalTourGrid({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  // Handler para cerrar al hacer click fuera del modal
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[99999] bg-black/40" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className="relative rounded-xl p-0 max-w-6xl w-full shadow-2xl border border-black/10 flex flex-col bg-transparent"
        style={{
          maxHeight: 'calc(100vh - 5rem)',
          marginTop: '1.5rem',
          marginBottom: '3.5rem',
          overflow: 'hidden',
          background: 'transparent'
        }}
      >
        <div className="flex items-center justify-between sticky top-0 z-[1000] p-2" style={{background:'rgba(0,0,0,0.25)'}}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // leer la sección guardada y navegar al landing
                try {
                  const last = sessionStorage.getItem('landing:lastSection');
                  // dispatch event por si el landing está escuchando
                  try { publishLandingScrollTo(last); } catch (e) {}
                  // navegar a la raíz (landing)
                  window.location.href = '/';
                } catch (e) {}
              }}
              aria-label="Volver a explorar"
              title="Volver a explorar"
              className="text-white p-2 rounded focus:outline-none bg-transparent"
              style={{fontSize: '20px', lineHeight: 1}}
            >
              {/* mejor usar un SVG para consistencia */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            title="Cerrar"
            className="text-2xl text-black hover:text-black p-2 rounded focus:outline-none z-[1000] bg-transparent border-none shadow-none"
            style={{
              background: 'transparent',
              color: '#000',
              zIndex: 1000,
              boxShadow: 'none',
              border: 'none',
            }}
          >
            ×
          </button>
        </div>
        <div
          className="modal-tourgrid-bg-override flex-1 overflow-y-auto p-6"
          style={{ borderRadius: '0.75rem' }}
        >
          <TourGrid isModal onCardClickAction={onClose} />
        </div>
        <style jsx global>{`
          .modal-tourgrid-bg-override #tour-grid .mb-6 {
            margin-bottom: 0 !important;
          }
          .modal-tourgrid-bg-override #tour-grid {
            background: none !important;
            padding-top: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          /* Cuadradas y más pequeñas solo en el modal */
          .modal-tourgrid-bg-override #tour-grid .h-56 {
            height: 175px !important;
            width: 175px !important;
            min-height: 160px !important;
            min-width: 160px !important;
            aspect-ratio: 1/1 !important;
          }
          .modal-tourgrid-bg-override #tour-grid .grid {
            gap: 6px !important;
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }
          /* Más separación entre la fila 1 y 2 de 2027 */
          .modal-tourgrid-bg-override #tour-grid .mb-10:last-child .grid > *:nth-child(n+6) {
            margin-top: 18px !important;
          }
          .modal-tourgrid-bg-override #tour-grid .text-4xl,
          .modal-tourgrid-bg-override #tour-grid .md\:text-5xl {
            font-size: 2.2rem !important;
            line-height: 1.1 !important;
            letter-spacing: -0.01em !important;
          }
          .modal-tourgrid-bg-override #tour-grid h4 {
            font-size: 0.95rem !important;
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: initial !important;
            line-height: 1.1 !important;
            word-break: break-word !important;
            max-width: 90px !important;
          }
        `}</style>
      </div>
    </div>
  );
}
