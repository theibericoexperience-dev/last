import { NextResponse } from 'next/server';

/**
 * Temporary diagnostic endpoint — deep inspection of auth env vars.
 * Shows wider previews (first 10 + last 10), scans ALL env var names
 * for auth-related keys, and checks for invisible/special characters.
 *
 * GET /api/diagnostic/auth-env
 */
export async function GET() {
  const mask = (val: string | undefined) => {
    if (!val) return { set: false, length: 0, preview: '(empty)', hasWhitespace: false };
    const hasLeadingSpace = val !== val.trimStart();
    const hasTrailingSpace = val !== val.trimEnd();
    const hasNewline = /[\r\n]/.test(val);
    return {
      set: true,
      length: val.length,
      // Show first 10 and last 10 chars for easier comparison
      preview: val.length > 22
        ? `${val.slice(0, 10)}…${val.slice(-10)}`
        : val.length > 10
        ? `${val.slice(0, 6)}…${val.slice(-6)}`
        : '****',
      hasLeadingSpace,
      hasTrailingSpace,
      hasNewline,
    };
  };

  // Scan ALL env var keys for anything auth/google/secret related
  const allEnvKeys = Object.keys(process.env).sort();
  const authRelatedKeys = allEnvKeys.filter(k => {
    const lower = k.toLowerCase();
    return lower.includes('auth') ||
      lower.includes('google') ||
      lower.includes('secret') ||
      lower.includes('nextauth') ||
      lower.includes('oauth');
  });

  const report = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,

    // ------ Target variables with wide mask ------
    AUTH_GOOGLE_ID: mask(process.env.AUTH_GOOGLE_ID),
    AUTH_GOOGLE_SECRET: mask(process.env.AUTH_GOOGLE_SECRET),
    GOOGLE_CLIENT_ID: mask(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: mask(process.env.GOOGLE_CLIENT_SECRET),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: mask(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
    AUTH_SECRET: mask(process.env.AUTH_SECRET),
    NEXTAUTH_SECRET: mask(process.env.NEXTAUTH_SECRET),

    // ------ URLs (not secret, show full) ------
    AUTH_URL: process.env.AUTH_URL || '(not set)',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || '(not set)',
    AUTH_REDIRECT_PROXY_URL: process.env.AUTH_REDIRECT_PROXY_URL || '(not set)',

    // ------ Vercel injected ------
    VERCEL: process.env.VERCEL || '(not set)',
    VERCEL_URL: process.env.VERCEL_URL || '(not set)',
    VERCEL_ENV: process.env.VERCEL_ENV || '(not set)',

    // ------ Discovery: all auth-related env var NAMES in this runtime ------
    discoveredAuthKeys: authRelatedKeys,

    // ------ Total env vars count (sanity check) ------
    totalEnvVars: allEnvKeys.length,
  };

  return NextResponse.json(report, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
