"use client";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * NextAuth SessionProvider restored to support hybrid auth (Google/OAuth + Supabase).
 * Uses NEXT_PUBLIC_AUTH_URL so the client knows where auth endpoints are.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000';

  console.log('🔐 SessionProvider configuring with basePath: /api/auth');
  console.log('🔐 SessionProvider authUrl:', authUrl);

  return (
    <NextAuthSessionProvider
      basePath="/api/auth"
      refetchInterval={0}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
