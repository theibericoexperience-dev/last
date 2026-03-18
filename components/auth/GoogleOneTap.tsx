"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Google One Tap component.
 *
 * Loads the GSI client library, prompts the user if unauthenticated,
 * and POSTs the credential (JWT id_token) to /api/auth/one-tap for
 * server-side verification and session creation.
 *
 * Falls back silently: if anything fails, the user can still use the
 * standard Google sign-in button on the login/register pages.
 */
export default function GoogleOneTap() {
  const { status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMounted) return;
    if (status === "authenticated") return;
    if (typeof window === "undefined") return;
    if (!clientId) return;

    // Avoid re-initializing the GSI library within the same page lifecycle
    if ((window as any).__gsi_initialized) return;

    const initGSI = () => {
      if (!(window as any).google?.accounts?.id) return;
      if ((window as any).__gsi_initialized) return;
      (window as any).__gsi_initialized = true;

      const handleResponse = async (response: any) => {
        if (!response?.credential || typeof response.credential !== 'string') return;

        try {
          const res = await fetch('/api/auth/one-tap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential }),
          });

          if (res.ok) {
            // Session cookie was set by the API — refresh to pick it up
            router.refresh();
            // Small delay to let the session propagate, then navigate
            setTimeout(() => {
              window.location.href = '/panel';
            }, 300);
          } else {
            // One Tap failed — silently fall back to normal login
            console.warn('[GoogleOneTap] Server rejected credential:', res.status);
          }
        } catch (e) {
          // Network error — silently fall back
          console.warn('[GoogleOneTap] Network error:', e);
        }
      };

      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleResponse,
        use_fedcm_for_prompt: true,
      });

      // Only prompt when the user is explicitly unauthenticated
      if (status === 'unauthenticated') {
        setTimeout(() => {
          if ((window as any).__gsi_prompted) return;
          (window as any).__gsi_prompted = true;

          (window as any).google.accounts.id.prompt((notification: any) => {
            if (notification?.isNotDisplayed?.()) {
              const reason = notification.getNotDisplayedReason?.() || 'unknown';
              console.debug('[GoogleOneTap] Not displayed:', reason);
            }
          });
        }, 1200);
      }
    };

    // Load the GSI script if not already present
    const existingScript = document.getElementById("google-one-tap-script");
    if (existingScript) {
      if ((window as any).google?.accounts?.id) initGSI();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.id = "google-one-tap-script";
      script.onload = () => initGSI();
      document.body.appendChild(script);
    }

    return () => {
      // Don't remove the script — just clean up the prompt container if any
      const c = document.getElementById("google-one-tap-container");
      if (c) c.remove();
    };
  }, [isMounted, status, clientId, router]);

  return null;
}
