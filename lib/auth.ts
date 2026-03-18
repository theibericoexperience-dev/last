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

// Resolve Google OAuth credentials.
// Auth.js auto-detects AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from env at init
// (see @auth/core/lib/utils/env.js). We also accept the legacy names
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET for local dev (.env.local compat).
// IMPORTANT: pass `undefined` (not empty string) when missing so Auth.js's own
// env detection can still kick in as fallback.
const googleClientId =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || undefined;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || undefined;

if (!googleClientId || !googleClientSecret) {
  console.warn(
    '⚠️ Google OAuth credentials incomplete at module load.',
    `AUTH_GOOGLE_ID=${googleClientId ? '✓' : '✗'}`,
    `AUTH_GOOGLE_SECRET=${googleClientSecret ? '✓' : '✗'}`,
    `GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID ? '✓' : '✗'}`,
    `GOOGLE_CLIENT_SECRET=${process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗'}`,
  );
}

if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ NEXTAUTH_SECRET is not set. NextAuth requires NEXTAUTH_SECRET to sign and verify session tokens.');
  }
}

// Warn if AUTH_SECRET and NEXTAUTH_SECRET differ or one is missing
const envAuthSecret = process.env.AUTH_SECRET;
const envNextAuthSecret = process.env.NEXTAUTH_SECRET;
if (envAuthSecret && envNextAuthSecret && envAuthSecret !== envNextAuthSecret) {
  console.warn('⚠️ AUTH_SECRET and NEXTAUTH_SECRET differ. Ensure the same secret is set in Vercel production and locally to avoid cookie/signing mismatches.');
} else if (!envAuthSecret && !envNextAuthSecret) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ No NEXTAUTH_SECRET/AUTH_SECRET found in production environment. Aborting to avoid mis-signed sessions.');
    // In production we prefer to fail fast
    throw new Error('NEXTAUTH_SECRET or AUTH_SECRET must be set in production');
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
      // Pass credentials explicitly when available; leave undefined to let
      // Auth.js auto-detect from AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET env vars.
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
      // Force the issuer to Google's accounts endpoint so provider callbacks
      // use the expected issuer instead of any inferred proxy origin.
      issuer: 'https://accounts.google.com',
      // Use client_secret_post: sends client_id + client_secret in POST body
      // instead of an Authorization Basic header. Avoids encoding/proxy issues
      // that cause "invalid_client" with the default client_secret_basic method.
      client: {
        token_endpoint_auth_method: 'client_secret_post',
      },
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
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
