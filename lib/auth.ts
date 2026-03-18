import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';


export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string;
      name?: string;
      image?: string;
    };
  }
}

// Debug logs for JWT configuration

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ ERROR: Google OAuth credentials are incomplete!');
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ NEXTAUTH_SECRET is not set. NextAuth requires NEXTAUTH_SECRET to sign and verify session tokens.');
  }
}

// If NEXTAUTH_SECRET is present but short, warn in development
if (process.env.NEXTAUTH_SECRET && process.env.NODE_ENV !== 'production') {
  if ((process.env.NEXTAUTH_SECRET || '').length < 32) {
    console.warn('⚠️ NEXTAUTH_SECRET is shorter than 32 characters; consider generating a long random secret for local testing.');
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Supabase envs missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Skipping server-side profile sync.');
  }
}

const authConfig = NextAuth({
  basePath: '/api/auth',
  // When testing behind a proxy/tunnel (localtunnel/ngrok) we need to ensure
  // NextAuth trusts the host/proxy so cookies set by NextAuth are valid.
  trustHost: true,
  // Simplified cookie policy: use secure, sameSite lax in production with canonical domain
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.ibero.world' : undefined,
      },
    },
  },
  session: {
    strategy: 'jwt',
  },
  // Let NextAuth manage cookies by default. Manual cookie overrides caused
  // configuration issues in some hosting environments — remove custom cookie
  // definitions so NextAuth can pick sensible defaults for Vercel/HTTPS.
  // `secret` is the top-level option used to sign/verifiy tokens in NextAuth.
  // Allow either AUTH_SECRET or NEXTAUTH_SECRET to be provided in the env.
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
      allowDangerousEmailAccountLinking: true,
      // Force the issuer to Google's accounts endpoint so provider callbacks
      // use the expected issuer instead of any inferred proxy origin.
      issuer: 'https://accounts.google.com',
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Allow Google sign-ins. Keep this callback minimal to avoid blocking auth.
      if (account?.provider === 'google') return true;
      return true;
    },
    async session({ session, token }) {
      // Minimal session enrichment without debug logging to avoid leaking headers/content.
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.email = token.email || '';
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user && (user as any)._internalProfileId) {
        token.sub = (user as any)._internalProfileId;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Prefer application canonical base URL when available to avoid
      // redirects to hostnames injected by proxies/hosts (e.g., Vercel internals).
      const canonicalBase = process.env.NEXTAUTH_URL || baseUrl;
      try {
        return url.startsWith(canonicalBase) ? url : canonicalBase;
      } catch (e) {
        return canonicalBase;
      }
    },
  },
});

export const { handlers, auth, signIn, signOut } = authConfig;
