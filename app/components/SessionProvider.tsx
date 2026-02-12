"use client";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * NextAuth SessionProvider restored to support hybrid auth (Google/OAuth + Supabase).
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
