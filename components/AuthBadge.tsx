"use client";

import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/db/supabaseClient';

export default function AuthBadge() {
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (!supabaseClient) return setLogged(false);
      try {
        const { data: { session } = {} as any } = await supabaseClient.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          setLogged(true);
          setEmail((session.user as any).email || null);
        } else {
          setLogged(false);
          setEmail(null);
        }
      } catch (e) {
        if (!mounted) return;
        setLogged(false);
        setEmail(null);
      }
    }
    check();
    // listen for auth changes so the badge updates
    const { data: sub } = supabaseClient?.auth.onAuthStateChange?.((event, sess) => {
      if (!mounted) return;
      if (sess?.user) {
        setLogged(true);
        setEmail((sess.user as any).email || null);
      } else {
        setLogged(false);
        setEmail(null);
      }
    }) ?? { data: null };
    return () => { mounted = false; try { sub?.subscription?.unsubscribe?.(); } catch(e){} };
  }, []);

  if (!logged) return null;

  return (
    <div aria-hidden="true" className="fixed right-4 top-4 z-50 pointer-events-none">
      <div className="bg-green-600 text-white text-xs font-semibold rounded-full px-3 py-1 shadow-lg opacity-95 pointer-events-auto">
        {email ? `Logged as ${email}` : 'Logged in'}
      </div>
    </div>
  );
}
