"use client";

import { FormEvent, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/db/supabaseClient';

export default function RegisterForm({ onSuccessAction, autoFocus }: { onSuccessAction?: () => void; autoFocus?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get('callbackUrl') || '/panel?tab=orders';
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    if (loading || !supabaseClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('[RegisterForm] handleGoogle error:', error);
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 1. Call our custom register API that uses Service Role Key for sync
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await res.json();
      
      if (!res.ok) {
        setError(result.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // 2. Account created and synced. Now sign in to get a session.
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Account created but could not sign in automatically. Please try logging in.');
        setLoading(false);
        return;
      }

      // 3. Success
      if (typeof onSuccessAction === 'function') {
        onSuccessAction();
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      console.error('[RegisterForm] handleEmailRegister error:', err);
      setError('Unexpected error while creating your account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleEmailRegister} className="mb-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          name="name"
          autoFocus={autoFocus}
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          name="email"
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          name="password"
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-offset-2 transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating your account…' : 'Create account with email'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm ring-offset-2 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 15.3 18.8 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.9 26.8 37 24 37c-5.3 0-9.8-3.4-11.4-8.1l-6.5 5C9.3 39.7 16.1 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l.1-.1 6.4 5.3c.1-.1 6.5-4.9 6.5-14.1 0-1.3-.1-2.4-.4-3.5z"/></svg>
        {loading ? 'Creating your space…' : 'Continue with Google'}
      </button>
    </>
  );
}
