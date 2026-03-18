import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { upsertUserProfile } from '@/lib/db/upsertUserProfile';
import { cookies } from 'next/headers';

const GOOGLE_ISSUER = 'https://accounts.google.com';
const GOOGLE_JWKS = jose.createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

/**
 * POST /api/auth/one-tap
 *
 * Receives a Google One Tap credential (JWT id_token), verifies it
 * server-side against Google's JWKS, upserts the user profile in
 * Supabase, and issues a NextAuth session.
 *
 * Body: { credential: string }
 * Returns: { ok: true } on success, or { error: string } on failure.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const credential = typeof body?.credential === 'string' ? body.credential.trim() : '';

    if (!credential || credential.length < 100) {
      return NextResponse.json({ error: 'Missing or invalid credential' }, { status: 400 });
    }

    // Resolve the expected client ID (same logic as lib/auth.ts)
    const expectedClientId =
      process.env.AUTH_GOOGLE_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!expectedClientId) {
      console.error('[one-tap] No Google client ID configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Verify the JWT against Google's public keys
    const { payload } = await jose.jwtVerify(credential, GOOGLE_JWKS, {
      issuer: [GOOGLE_ISSUER, 'accounts.google.com'],
      audience: expectedClientId,
    });

    const {
      sub: googleSub,
      email,
      email_verified: emailVerified,
      name,
      picture,
      given_name: firstName,
      family_name: lastName,
    } = payload as Record<string, any>;

    if (!email || !googleSub) {
      return NextResponse.json({ error: 'Token missing email or subject' }, { status: 400 });
    }

    // Upsert into user_profiles (same as regular Google OAuth flow)
    await upsertUserProfile({
      email: (email as string).toLowerCase(),
      name: name || undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      avatar_url: picture || undefined,
      provider: 'google',
      provider_account_id: googleSub,
      is_email_verified: emailVerified === true,
    });

    // Issue a NextAuth session by calling the server-side signIn.
    // We use the "credentials" provider pattern with redirect: false
    // so we can control the response. Auth.js signIn server-side returns
    // a redirect response; we capture the session cookie it sets.
    //
    // Alternative approach: directly encode a JWT and set the session cookie.
    // This is more reliable since Auth.js server signIn for OAuth providers
    // requires an actual OAuth code exchange.
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('[one-tap] No AUTH_SECRET/NEXTAUTH_SECRET configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Manually create the NextAuth JWT and set it as a session cookie.
    // This mirrors what NextAuth does internally after a successful signIn.
    const jwtPayload: Record<string, unknown> = {
      sub: googleSub,
      email: (email as string).toLowerCase(),
      name: name || '',
      picture: picture || '',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    };

    const encodedToken = await new jose.SignJWT(jwtPayload as jose.JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(new TextEncoder().encode(secret));

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    const cookieStore = await cookies();
    cookieStore.set(cookieName, encodedToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      ...(isProduction ? { domain: '.ibero.world' } : {}),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // jose throws on invalid/expired tokens
    if (err?.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    if (err?.code?.startsWith('ERR_JW')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('[one-tap] Unexpected error:', err?.message || err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
