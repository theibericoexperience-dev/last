'use client';

import { useEffect, useState } from 'react';

interface OAuthLoadingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Overlay shown while OAuth popup is open
 * Provides visual feedback that authentication is in progress
 */
export default function OAuthLoadingOverlay({ isOpen, onClose }: OAuthLoadingOverlayProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="mx-4 max-w-sm rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* Google logo spinning animation */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 48 48" 
              className="h-12 w-12 animate-pulse"
            >
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 15.3 18.8 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.9 26.8 37 24 37c-5.3 0-9.8-3.4-11.4-8.1l-6.5 5C9.3 39.7 16.1 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l.1-.1 6.4 5.3c.1-.1 6.5-4.9 6.5-14.1 0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
          </div>
          
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Signing in with Google{dots}
          </h3>
          
          <p className="mb-6 text-sm text-slate-600">
            Complete the sign-in in the popup window
          </p>
          
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-6 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
