"use client";

import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/db/supabaseClient';
import { usePathname, useRouter } from 'next/navigation';

/**
 * UserBubble - styled similarly to MY PANEL on landing (oval, header-aligned) and compact/fixed on other pages.
 * Shows only an icon (no text). Clicking navigates to /panel (or login flow if not authenticated).
 */
type UserBubbleVariant = 'auto' | 'inline' | 'floating' | 'modalHeader';

export default function UserBubble({
  onOpenRegisterAction,
  variant = 'auto',
  wrapperClassName,
  buttonClassName,
}: {
  onOpenRegisterAction?: () => void;
  variant?: UserBubbleVariant;
  wrapperClassName?: string;
  buttonClassName?: string;
}) {
  const pathname = usePathname?.() ?? '/';
  const router = useRouter();
  const [logged, setLogged] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

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
    (async () => {
      setChecking(true);
      await check();
      setChecking(false);
    })();
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


  const isLanding = pathname === '/' || pathname === '';
  const isTourPage = pathname?.startsWith('/tour');
  const isBehindPage = pathname === '/behind';

  const handleClick = async () => {
    // If not logged, navigate to login/register flow (maintain current behaviour)
    const { data: { session } = {} as any } = await supabaseClient.auth.getSession();
    if (session?.user) {
      router.push('/panel');
    } else {
      // If a parent provided a register handler, prefer that (e.g. landing page opens a modal)
      if (typeof onOpenRegisterAction === 'function') {
        onOpenRegisterAction();
      } else {
        router.push('/auth/login');
      }
    }
  };

  // Shared icon (user outline)
  const Icon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="currentColor" />
      <path d="M2 20c0-3.866 3.582-7 10-7s10 3.134 10 7v1H2v-1z" fill="currentColor" />
    </svg>
  );

  if (variant === 'auto' && (isTourPage || isBehindPage)) return null;

  const resolvedVariant: UserBubbleVariant = variant === 'auto'
    ? (isLanding ? 'inline' : 'floating')
    : variant;

  if (resolvedVariant === 'modalHeader') {
    return (
      <div className={wrapperClassName ?? ''}>
        <button
          type="button"
          aria-label="Open your panel"
          onClick={handleClick}
          className={(buttonClassName ?? 'p-2 text-black bg-transparent inline-flex items-center justify-center') + (checking ? ' opacity-70' : ' opacity-100')}
        >
          <span className="sr-only">Open your panel</span>
          <span className="flex items-center justify-center text-current">{Icon}</span>
        </button>
      </div>
    );
  }

  if (resolvedVariant === 'inline') {
    // Render inline-styled oval similar to My Panel (header-aligned). Non-fixed.
    return (
      <div className={wrapperClassName ?? 'inline-block'}>
        <button
          type="button"
          aria-label="Open your panel"
          onClick={handleClick}
          className={buttonClassName ?? "group inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 p-2 text-[14px] font-semibold uppercase tracking-tight text-white backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"}
        >
          <span className="sr-only">Open your panel</span>
          <span className="flex items-center justify-center text-white">{Icon}</span>
        </button>
      </div>
    );
  }

  // Elsewhere: compact floating circular button in top-right
  return (
    <div className={wrapperClassName ?? 'fixed right-6 top-6 z-40 pointer-events-none sm:block'}>
      <button
        aria-label="Open your panel"
        onClick={handleClick}
        className={buttonClassName ?? 'pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-transparent text-white transition hover:bg-white/5 focus:outline-none'}
      >
        <span className="sr-only">Open your panel</span>
        <span className="block text-current">{Icon}</span>
      </button>
    </div>
  );
}
