import { NextResponse } from 'next/server';

/**
 * Temporary diagnostic endpoint — returns presence/length of auth-related
 * env vars WITHOUT revealing actual values. Safe to deploy; remove after
 * the invalid_client issue is resolved.
 *
 * GET /api/diagnostic/auth-env
 */
export async function GET() {
  const mask = (val: string | undefined) => {
    if (!val) return { set: false, length: 0, preview: '(empty)' };
    return {
      set: true,
      length: val.length,
      // Show first 4 and last 4 characters only
      preview: val.length > 10
        ? `${val.slice(0, 4)}…${val.slice(-4)}`
        : '****',
    };
  };

  const report = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    // Google OAuth credentials
    AUTH_GOOGLE_ID: mask(process.env.AUTH_GOOGLE_ID),
    AUTH_GOOGLE_SECRET: mask(process.env.AUTH_GOOGLE_SECRET),
    GOOGLE_CLIENT_ID: mask(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: mask(process.env.GOOGLE_CLIENT_SECRET),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: mask(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
    // Auth session secrets
    AUTH_SECRET: mask(process.env.AUTH_SECRET),
    NEXTAUTH_SECRET: mask(process.env.NEXTAUTH_SECRET),
    // Auth URLs
    AUTH_URL: process.env.AUTH_URL || '(not set)',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || '(not set)',
    AUTH_REDIRECT_PROXY_URL: process.env.AUTH_REDIRECT_PROXY_URL || '(not set)',
    // Vercel injected
    VERCEL: process.env.VERCEL || '(not set)',
    VERCEL_URL: process.env.VERCEL_URL || '(not set)',
    VERCEL_ENV: process.env.VERCEL_ENV || '(not set)',
  };

  return NextResponse.json(report, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
