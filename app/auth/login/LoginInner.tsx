"use client";

import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthLayout from '@/components/auth/AuthLayout';
import { supabaseClient } from '@/lib/db/supabaseClient';
import { useLoader } from '@/components/GlobalLoaderProvider';

function buildLink(base: string, callbackUrl?: string | null) {
  if (!callbackUrl) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export default function LoginInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/panel';
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { startLoading } = useLoader();
  const [isPending, startTransition] = useTransition();

  const registerHref = useMemo(() => buildLink('/auth/register', callbackUrl), [callbackUrl]);

  const handleGoogle = async () => {
    if (loading || !supabaseClient) return;
    try {
      setLoading(true);
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });
      if (error) {
        console.error('Google sign in error:', error);
        setError('Failed to sign in with Google.');
        setLoading(false);
      }
      // OAuth will redirect automatically
    } catch (error) {
      console.error(error);
      setError('Unexpected error while signing in.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (loading || !supabaseClient) return;
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('We could not sign you in with that email and password.');
        setLoading(false);
        return;
      }

      // Redirect after successful login
      startLoading();
      startTransition(() => {
        router.push(callbackUrl);
      });
    } catch (err) {
      console.error(err);
      setError('Unexpected error while signing in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back to IBERO"
      subtitle="Sign in to pick up your itineraries, traveler cards, deposits and concierge calls exactly where you left them."
      helperText="New to IBERO?"
      helperAction={{ label: 'Create an account', href: registerHref }}
    >
      <form onSubmit={handleEmailLogin} className="mb-4 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-offset-2 transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing you in…' : 'Sign in with email'}
        </button>
      </form>

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm ring-offset-2 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 15.3 18.8 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.9 26.8 37 24 37c-5.3 0-9.8-3.4-11.4-8.1l-6.5 5C9.3 39.7 16.1 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l.1-.1 6.3 5.3c-.4.4 6.5-4.8 6.5-14 0-1.3-.1-2.4-.4-3.5z"/></svg>
        {loading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Need a quick refresher?</p>
        <ul className="mt-3 space-y-2">
          {[
            '1 · Review your open orders and traveler cards in the panel.',
            '2 · Update dietary needs, passports and medical notes anytime.',
            '3 · Pay the $1,500 per traveler deposit to secure flights and hotels.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
          Panel access <span aria-hidden="true">→</span> Concierge care
        </div>
      </div>
    </AuthLayout>
  );
}
