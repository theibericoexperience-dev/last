import { NextResponse } from 'next/server';

// DEPRECATED: This debug route previously attempted to read a NextAuth session.
// NextAuth is no longer used; Supabase Auth is the single source of truth.
export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((c) => {
      const [k, ...v] = c.split('=');
      return { name: k, value: decodeURIComponent((v || []).join('=')) };
    });

  return NextResponse.json({ ok: true, cookieHeader, cookies, note: 'NextAuth disabled; inspect Supabase cookies instead' });
}
