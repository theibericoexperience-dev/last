import { NextResponse } from 'next/server';

/**
 * Temporary diagnostic endpoint — deep inspection of auth env vars.
 * Also tests credentials against Google's token endpoint directly.
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

  // ── Direct credential test against Google's token endpoint ──────────
  // Sends a token request with a dummy code. If client credentials are
  // valid, Google responds "invalid_grant" (wrong code).
  // If client credentials are invalid, Google responds "invalid_client".
  const resolvedClientId =
    process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '';
  const resolvedClientSecret =
    process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

  let credentialTest: Record<string, unknown> = {};
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'DUMMY_CODE_FOR_CREDENTIAL_CHECK',
      redirect_uri: 'https://ibero.world/api/auth/callback/google',
      client_id: resolvedClientId,
      client_secret: resolvedClientSecret,
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const json = await res.json();
    // Expected: "invalid_grant" means credentials OK, code is wrong.
    //           "invalid_client" means credentials themselves are wrong.
    credentialTest = {
      status: res.status,
      error: json.error,
      error_description: json.error_description,
      verdict:
        json.error === 'invalid_grant'
          ? '✅ CLIENT CREDENTIALS ACCEPTED (code was dummy → invalid_grant expected)'
          : json.error === 'invalid_client'
          ? '❌ CLIENT CREDENTIALS REJECTED by Google'
          : `⚠️ Unexpected: ${json.error}`,
      usedClientId: mask(resolvedClientId),
      usedClientSecret: mask(resolvedClientSecret),
    };
  } catch (err: unknown) {
    credentialTest = { fetchError: String(err) };
  }

  const report = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,

    // ── Credential test result ──
    credentialTest,

    // ── Target variables with wide mask ──
    AUTH_GOOGLE_ID: mask(process.env.AUTH_GOOGLE_ID),
    AUTH_GOOGLE_SECRET: mask(process.env.AUTH_GOOGLE_SECRET),
    GOOGLE_CLIENT_ID: mask(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: mask(process.env.GOOGLE_CLIENT_SECRET),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: mask(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
    AUTH_SECRET: mask(process.env.AUTH_SECRET),
    NEXTAUTH_SECRET: mask(process.env.NEXTAUTH_SECRET),

    // ── URLs ──
    AUTH_URL: process.env.AUTH_URL || '(not set)',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || '(not set)',
    AUTH_REDIRECT_PROXY_URL: process.env.AUTH_REDIRECT_PROXY_URL || '(not set)',

    // ── Vercel injected ──
    VERCEL: process.env.VERCEL || '(not set)',
    VERCEL_URL: process.env.VERCEL_URL || '(not set)',
    VERCEL_ENV: process.env.VERCEL_ENV || '(not set)',

    // ── Discovery ──
    discoveredAuthKeys: authRelatedKeys,
    totalEnvVars: allEnvKeys.length,
  };

  return NextResponse.json(report, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
