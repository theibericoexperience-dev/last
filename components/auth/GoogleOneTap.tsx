"use client";

import { useEffect, useRef } from "react";
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
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  const initializedRef = useRef(false);
  const promptedRef = useRef(false);

  useEffect(() => {
    // Wait until session status is definitively resolved
    if (status !== "unauthenticated") return;
    if (typeof window === "undefined") return;

    if (!clientId) {
      console.warn('[GoogleOneTap] NEXT_PUBLIC_GOOGLE_CLIENT_ID is empty — One Tap disabled');
      return;
    }

    const handleResponse = async (response: any) => {
      if (!response?.credential || typeof response.credential !== 'string') return;

      try {
        const res = await fetch('/api/auth/one-tap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });

        if (res.ok) {
          router.refresh();
          setTimeout(() => {
            window.location.href = '/panel';
          }, 300);
        } else {
          console.warn('[GoogleOneTap] Server rejected credential:', res.status);
        }
      } catch (e) {
        console.warn('[GoogleOneTap] Network error:', e);
      }
    };

    const initAndPrompt = () => {
      const gsi = (window as any).google?.accounts?.id;
      if (!gsi) return;

      // Initialize once per page lifecycle
      if (!initializedRef.current) {
        initializedRef.current = true;
        gsi.initialize({
          client_id: clientId,
          callback: handleResponse,
          use_fedcm_for_prompt: true,
        });
        console.debug('[GoogleOneTap] Initialized with client_id:', clientId.slice(0, 12) + '…');
      }

      // Prompt once — no status callback to avoid deprecated FedCM warnings
      if (!promptedRef.current) {
        promptedRef.current = true;
        setTimeout(() => {
          gsi.prompt();
        }, 1200);
      }
    };

    // Load the GSI script if not already present
    const existingScript = document.getElementById("google-one-tap-script");
    if (existingScript) {
      if ((window as any).google?.accounts?.id) {
        initAndPrompt();
      } else {
        // Script tag exists but hasn't loaded yet — wait for it
        existingScript.addEventListener('load', initAndPrompt);
      }
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.id = "google-one-tap-script";
      script.onload = () => initAndPrompt();
      document.body.appendChild(script);
    }
  }, [status, clientId, router]);

  return null;
}
