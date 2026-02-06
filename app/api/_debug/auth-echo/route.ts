import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

// Dev-only auth debugging endpoint
// Returns request headers, cookies, and auth detection result
export async function GET(request: Request) {
  // Only enable in development
  if (process.env.NODE_ENV !== 'development' && !process.env.DEBUG_AUTH) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const authHeader = request.headers.get('authorization') || '';
  
  // Use official SSR client for debug check
  const cookieStore = await nextCookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Test getAuthUserFromRequest (proxy to the centralized helper)
  let authUser = null;
  try {
    authUser = await getAuthUserFromRequest(request);
  } catch (e) {
    // ignore
  }

  const allCookies = cookieStore.getAll().map(c => ({ name: c.name, size: c.value.length }));

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    official_ssr: {
      user: user?.id || null,
      error: authError?.message || null,
    },
    helper_result: {
      user: authUser?.id || null,
    },
    cookies_inventory: allCookies,
    raw_cookie_header: cookieHeader ? 'Present' : 'Missing',
  });
}
