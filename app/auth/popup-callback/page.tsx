'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Popup OAuth Callback Page
 * 
 * Purpose: Close popup, send postMessage to opener, redirect if no opener (mobile fallback)
 * 
 * Flow:
 * 1. Desktop popup: Send 'oauth-complete' message to parent window, then close
 * 2. Mobile redirect: Navigate directly to redirect URL
 * 
 * Note: 'oauth-complete' does NOT mean success, only that OAuth flow finished.
 * Parent must call getSession() to verify actual authentication.
 */
function PopupCallbackContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/panel?tab=orders';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.opener && !window.opener.closed) {
        // Desktop popup flow: notify parent with postMessage
        try {
          const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          window.opener.postMessage(
            {
              type: 'oauth-complete',
              redirect,
              session: access_token && refresh_token ? { access_token, refresh_token } : null,
            },
            window.location.origin
          );
          
          // Log for debugging (will be visible in popup console)
          console.log('[PopupCallback] Sent oauth-complete message to parent');
          
          // Close popup after short delay to ensure message delivery
          setTimeout(() => {
            window.close();
          }, 100);
        } catch (error) {
          console.error('[PopupCallback] Error sending postMessage:', error);
          // Fallback: try to close anyway
          window.close();
        }
      } else {
        // Mobile redirect flow: navigate directly
        console.log('[PopupCallback] No opener detected, redirecting to:', redirect);
        window.location.href = redirect;
      }
    }, 200); // 200ms delay for cookie propagation

    return () => clearTimeout(timer);
  }, [redirect]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
        <p className="text-sm text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function PopupCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
            <p className="text-sm text-slate-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PopupCallbackContent />
    </Suspense>
  );
}
