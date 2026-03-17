"use client";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      basePath="/api/auth"
      // Quitamos refetchOnWindowFocus para evitar llamadas innecesarias en Vercel
      refetchOnWindowFocus={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
