"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { supabaseClient } from '@/lib/db/supabaseClient';
import { usePathname, useRouter } from 'next/navigation';
import { useLoader } from '@/components/GlobalLoaderProvider';
import '../styles/header.css'; // Import the CSS file

// ... (keep the existing UserBubbleVariant type)
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
  const { startLoading } = useLoader();
  const [isPending, startTransition] = useTransition();
  const [logged, setLogged] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (!supabaseClient) return setLogged(false);
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (mounted) {
          setLogged(!!session?.user);
        }
      } catch (e) {
        if (mounted) {
          setLogged(false);
        }
      }
    }
    check();
    const { data: sub } = supabaseClient?.auth.onAuthStateChange?.((event, sess) => {
      if (mounted) {
        setLogged(!!sess?.user);
      }
    }) ?? { data: null };
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  const handleClick = async () => {
    if (logged) {
      startLoading();
      startTransition(() => {
        router.push('/panel');
      });
    } else {
      if (typeof onOpenRegisterAction === 'function') {
        onOpenRegisterAction();
      } else {
        startLoading();
        startTransition(() => {
          router.push('/auth/login');
        });
      }
    }
  };

  const Icon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" fill="currentColor" />
      <path d="M2 20c0-3.866 3.582-7 10-7s10 3.134 10 7v1H2v-1z" fill="currentColor" />
    </svg>
  );

  const isLanding = pathname === '/' || pathname === '';
  const isTourPage = pathname?.startsWith('/tour');
  const isBehindPage = pathname === '/behind';

  if (variant === 'auto' && (isTourPage || isBehindPage)) {
    return null;
  }

  const resolvedVariant: UserBubbleVariant = variant === 'auto' ? (isLanding ? 'inline' : 'floating') : variant;

  if (resolvedVariant === 'modalHeader') {
    return (
      <div className={wrapperClassName}>
        <button
          type="button"
          aria-label="Open your panel"
          onClick={handleClick}
          className={`p-3 text-black bg-transparent inline-flex items-center justify-center ${logged === null ? 'opacity-70' : 'opacity-100'} ${buttonClassName}`}>
          <span className="sr-only">Open your panel</span>
          <span className="flex items-center justify-center text-current">{Icon}</span>
        </button>
      </div>
    );
  }

  if (resolvedVariant === 'inline') {
    return (
      <div className={wrapperClassName ?? 'inline-block'}>
        <button
          type="button"
          aria-label="Open your panel"
          onClick={handleClick}
          className={`user-bubble-button ${buttonClassName}`}>
          <span className="sr-only">Open your panel</span>
          <span className="flex items-center justify-center text-white">{Icon}</span>
        </button>
      </div>
    );
  }

  // Elsewhere: compact floating circular button in top-right
  return (
    <div className={`user-bubble-floating-wrapper ${wrapperClassName}`}>
      <button
        aria-label="Open your panel"
        onClick={handleClick}
        className={`user-bubble-floating-button ${buttonClassName}`}>
        <span className="sr-only">Open your panel</span>
        <span className="block text-current">{Icon}</span>
      </button>
    </div>
  );
}
