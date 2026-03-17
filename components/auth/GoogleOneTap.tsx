"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function GoogleOneTap() {
  const { status } = useSession();
  const router = useRouter();
  const [hasPrompted, setHasPrompted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!isMounted) return;
    if (status === "authenticated" || hasPrompted) return;
    // Diagnostic: ensure clientId is available in the built client bundle
    try { console.debug('[GoogleOneTap] clientId present:', Boolean(clientId)); } catch (e) {}

    if (typeof window === "undefined") return;
    if (!clientId) {
      try { console.warn('[GoogleOneTap] NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing - One Tap will not initialize'); } catch (e) {}
      return;
    }

    const existingScript = document.getElementById("google-one-tap-script");

    let container = document.getElementById("google-one-tap-container") as HTMLElement | null;
    if (!container) {
      container = document.createElement("div");
      container.id = "google-one-tap-container";
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.right = "0";
      container.style.zIndex = "99999";
      container.style.pointerEvents = "none";
      // evitar reflow/shift: tamaño 0, solo sirve como overlay anchor
      container.style.width = '0px';
      container.style.height = '0px';
      document.body.appendChild(container);
    }

    const initGSI = () => {
      if (!(window as any).google || !(window as any).google.accounts) {
        try { console.debug('[GoogleOneTap] google.accounts not yet available'); } catch (e) {}
        return;
      }
      try {
        if ((window as any).__gsi_initialized) return;
        (window as any).__gsi_initialized = true;
      } catch (e) {
        /* ignore */
      }

      const handleResponse = async (response: any) => {
        if (response && typeof response.credential === 'string' && response.credential.length > 100) {
          try {
            await signIn('google', {
              id_token: response.credential,
              redirect: false,
              callbackUrl: '/panel',
            });
            try { await router.refresh(); } catch (e) { /* ignore */ }
          } catch (e) {
            try { console.error('Google One Tap signIn failed:', e); } catch (err) { }
          }
        }
      };

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleResponse,
        use_fedcm: false,
        ux_mode: 'popup',
      });

      // Render an (invisible) button into our container so the library is happy
      try {
        const containerEl = document.getElementById('google-one-tap-container');
        if (containerEl && typeof window.google.accounts.id.renderButton === 'function') {
          window.google.accounts.id.renderButton(containerEl, { theme: 'outline', size: 'large', type: 'standard' });
        }
      } catch (e) { /* ignore */ }

      // Give the page a moment to settle, then prompt (only when unauthenticated)
      setTimeout(() => {
        try {
          // Avoid prompting unless the session is explicitly unauthenticated
          if (status !== 'unauthenticated') {
            try { console.debug('[GoogleOneTap] skipping prompt, status:', status); } catch (e) {}
            return;
          }
          // Prevent double-prompting during the same page lifecycle
          if ((window as any).__gsi_prompted) {
            try { console.debug('[GoogleOneTap] prompt already triggered'); } catch (e) {}
            return;
          }
          (window as any).__gsi_prompted = true;

          window.google.accounts.id.prompt((notification: any) => {
            try {
              if (notification && typeof notification.isNotDisplayed === 'function' && notification.isNotDisplayed()) {
                console.log('One Tap no se mostró:', notification.getNotDisplayedReason && notification.getNotDisplayedReason());
              }
            } catch (e) { /* ignore */ }
          });
        } catch (e) {
          try { console.error('Google One Tap prompt failed:', e); } catch (err) { }
        }
      }, 1000);
    };

    if (existingScript) {
      // If the GSI script is already present, try to initialize immediately
      if ((window as any).google && (window as any).google.accounts && !(window as any).__gsi_initialized) {
        initGSI();
      }
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.id = "google-one-tap-script";
      // do NOT set data-auto_prompt to avoid collision with manual prompt
      script.onload = () => initGSI();
      document.body.appendChild(script);
    }

    // Keep the script in the page (do not remove it on cleanup). Only remove
    // the container we created if the component unmounts to avoid re-creating
    // the script repeatedly during navigation/hot reloads.
    return () => {
      const c = document.getElementById("google-one-tap-container");
      if (c) c.remove();
    };
  }, [isMounted, status, hasPrompted, router]);

  if (!isMounted) return null;
  return null;
}
