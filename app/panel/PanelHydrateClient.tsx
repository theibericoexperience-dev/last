"use client";

import React, { useEffect, useState } from 'react';
import PanelClient from './PanelClient';
import { supabaseClient } from '@/lib/db/supabaseClient';

export default function PanelHydrateClient() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.hash) {
        return window.location.hash.includes('access_token=');
      }
    } catch (e) {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.debug('[PanelHydrateClient] mounted, attempting to detect client session / hash');
      try {
        // First: parse URL hash tokens regardless of whether the Supabase client is available.
        // This helps when NEXT_PUBLIC env vars were not set in the build and `supabaseClient` is null.
        let finalSession: any = null;
        if (typeof window !== 'undefined' && window.location && window.location.hash) {
          try {
            const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
            const access_token = hashParams.get('access_token');
            const refresh_token = hashParams.get('refresh_token');
            const expires_in = hashParams.get('expires_in');
            const expires_at = hashParams.get('expires_at');

            if (access_token) {
              console.debug('[PanelHydrateClient] found hash tokens in URL');
              try {
                const cookieHeader = typeof document !== 'undefined' ? document.cookie || '' : '';
                const cookiesMap = Object.fromEntries(cookieHeader.split(';').map(p => {
                  const [k, ...v] = p.split('=');
                  return [k?.trim(), decodeURIComponent((v||[]).join('='))];
                }));
                const already = cookiesMap['sb-access-token'] || cookiesMap['supabase-auth-token'];
                const reloaded = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ibero:hydrated');
                // If cookies not present, write cookie and reload once so the server-side will see it
                if (!already && !reloaded) {
                  try {
                    const maxAge = expires_in ? Number(expires_in) : undefined;
                    const expiresDate = expires_at ? new Date(Number(expires_at) * 1000) : (maxAge ? new Date(Date.now() + maxAge * 1000) : null);
                    document.cookie = `sb-access-token=${encodeURIComponent(access_token)}; path=/;${expiresDate ? ` expires=${expiresDate.toUTCString()};` : ''}`;
                    if (refresh_token) {
                      document.cookie = `sb-refresh-token=${encodeURIComponent(refresh_token)}; path=/;${expiresDate ? ` expires=${expiresDate.toUTCString()};` : ''}`;
                    }
                    // Mark reloaded so we don't loop
                    try { sessionStorage.setItem('ibero:hydrated', '1'); } catch (e) {}
                    // Replace the URL to remove hash and reload so server can render authenticated panel
                    const cleanUrl = window.location.href.replace(window.location.hash, '');
                    window.location.replace(cleanUrl);
                    return;
                  } catch (e) {
                    // if reload fails, continue with optimistic client hydration
                    console.debug('[PanelHydrateClient] reload fallback failed', e);
                  }
                }
              } catch (e) {
                // ignore
              }
              // Optimistically mark authenticated so the Panel renders immediately while we
              // persist the session (setSession or cookie fallback) in the background.
              try {
                setAuthed(true);
                window.dispatchEvent(new Event('supabase:session-ready'));
                console.debug('[PanelHydrateClient] optimistic auth + dispatched supabase:session-ready');
              } catch (e) {
                // ignore
              }
              // If we have a client, let it persist the session properly via setSession()
              if (supabaseClient && supabaseClient.auth && typeof supabaseClient.auth.setSession === 'function') {
                try {
                  console.debug('[PanelHydrateClient] calling supabaseClient.auth.setSession with hash tokens');
                  await supabaseClient.auth.setSession({ access_token, refresh_token: refresh_token || undefined });
                  const { data: { session: s } = {} as any } = await supabaseClient.auth.getSession();
                  finalSession = s;
                  console.debug('[PanelHydrateClient] setSession returned session', !!finalSession);
                } catch (err) {
                  console.debug('[PanelHydrateClient] setSession error', err);
                }
              } else {
                // supabaseClient is not available (likely NEXT_PUBLIC env missing) - write cookies as a fallback
                try {
                  const maxAge = expires_in ? Number(expires_in) : undefined;
                  const expiresDate = expires_at ? new Date(Number(expires_at) * 1000) : (maxAge ? new Date(Date.now() + maxAge * 1000) : null);
                  // sb-access-token is used by client cookie fallback; set a refresh cookie too for completeness
                  document.cookie = `sb-access-token=${encodeURIComponent(access_token)}; path=/;${expiresDate ? ` expires=${expiresDate.toUTCString()};` : ''}`;
                  if (refresh_token) {
                    document.cookie = `sb-refresh-token=${encodeURIComponent(refresh_token)}; path=/;${expiresDate ? ` expires=${expiresDate.toUTCString()};` : ''}`;
                  }
                  console.debug('[PanelHydrateClient] wrote sb-access-token cookie fallback');

                  // Immediately mark as authenticated because server-side cookie fallback and client fetches
                  // will use the cookie to authenticate API calls. This avoids showing the landing UI when
                  // the Supabase JS client is not initialized in the browser.
                  setAuthed(true);
                  try {
                    window.dispatchEvent(new Event('supabase:session-ready'));
                    console.debug('[PanelHydrateClient] dispatched supabase:session-ready (cookie fallback)');
                  } catch (e) {
                    // ignore
                  }
                } catch (e) {
                  console.debug('[PanelHydrateClient] cookie write fallback failed', e);
                }
              }

              // Remove hash fragment from URL so UI is clean
              try {
                const url = window.location.href.replace(window.location.hash, '');
                window.history.replaceState(null, '', url);
              } catch (e) {
                // ignore
              }
            }
          } catch (e) {
            // ignore parsing errors
          }
        }

        // If we didn't set finalSession above (via setSession), try to get session from the client (if available)
        if (supabaseClient) {
          try {
            const { data: { session } = {} as any } = await supabaseClient.auth.getSession();
            if (!mounted) return;
            if (session) finalSession = session;
          } catch (e) {
            // ignore
          }
        }

        if (finalSession && finalSession.user) {
          setAuthed(true);
          try {
            window.dispatchEvent(new Event('supabase:session-ready'));
            console.debug('[PanelHydrateClient] dispatched supabase:session-ready');
          } catch (e) {
            // ignore
          }
        } else {
          // Poll briefly (2s) in case session is set shortly after redirect
          const start = Date.now();
          while (mounted && Date.now() - start < 2000 && !finalSession) {
            try {
              await new Promise((r) => setTimeout(r, 250));
              if (supabaseClient) {
                try {
                  const { data: { session: s2 } = {} as any } = await supabaseClient.auth.getSession();
                  if (s2 && s2.user) {
                    finalSession = s2;
                    setAuthed(true);
                    try {
                      window.dispatchEvent(new Event('supabase:session-ready'));
                      console.debug('[PanelHydrateClient] dispatched supabase:session-ready (from poll)');
                    } catch (e) {}
                    break;
                  }
                } catch (e) {
                  // ignore
                }
              }
              // cookie fallback
              if (typeof window !== 'undefined') {
                const cookieHeader = document.cookie || '';
                const cookies = Object.fromEntries(cookieHeader.split(';').map(p => {
                  const [k, ...v] = p.split('=');
                  return [k?.trim(), decodeURIComponent((v||[]).join('='))];
                }));
                const token = cookies['sb-access-token'] || cookies['supabase-auth-token'];
                if (token) {
                  // nothing immediate to do here; rely on supabaseClient.getSession above if available
                }
              }
            } catch (e) {
              // ignore and continue polling
            }
          }
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setChecked(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // If authenticated on client, render the full PanelClient immediately (do not wait for `checked`).
  if (authed) {
    // Hide server-rendered landing UI if present to avoid visual flash
    try {
      if (typeof document !== 'undefined') {
        const landing = document.getElementById('ibero-landing');
        if (landing) landing.style.display = 'none';
      }
    } catch (e) {
      // ignore
    }
    return <PanelClient />;
  }

  // While checking, render nothing (preserve server-rendered landing UI).
  if (!checked) return null;

  // Not authenticated after checking
  return null;
}
