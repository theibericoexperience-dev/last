"use client";

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';

function buildLink(base: string, callbackUrl?: string | null) {
  if (!callbackUrl) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export default function RegisterInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/panel?tab=orders';
  const loginHref = useMemo(() => buildLink('/auth/login', callbackUrl), [callbackUrl]);

  return (
    <AuthLayout
      title="Create your IBERO account"
      subtitle="Set up your personal travel panel so we can save your traveler cards, deposits and concierge calls in one secure place."
      helperText="Already have an account?"
      helperAction={{ label: 'Sign in here', href: loginHref }}
      sidebar={{
        eyebrow: 'JOIN THE JOURNEY',
        heading: 'Concierge-level planning starts here',
        copy:
          'Bring every tour, traveler profile and payment into a single, elegant workspace. We guide you with warm instructions at every step.',
      }}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
