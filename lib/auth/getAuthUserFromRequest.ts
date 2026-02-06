import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Extract an authenticated user id and optional metadata from the incoming Request.
 * Now using exclusively Supabase Auth (no NextAuth).
 */
export async function getAuthUserFromRequest(request: Request): Promise<{ id: string; email?: string } | null> {
  const fake = process.env.FAKE_AUTH_USER_ID;
  if (fake && process.env.NODE_ENV === 'development') {
    return { id: fake };
  }

  // 1) Try Supabase Auth from Authorization Header (Bearer Token)
  // This is often used for server-to-server or specific API calls
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // Explicitly import supabaseServer to avoid circular dependencies if any
    const { supabaseServer } = await import('@/lib/db/supabaseServer');
    if (supabaseServer) {
      try {
        const { data: { user } } = await supabaseServer.auth.getUser(token);
        if (user) {
          console.log(`>>> [AUTH] OK via Supabase Header: ${user.id}`);
          return { id: user.id, email: user.email };
        }
      } catch (e: any) {
        console.warn('>>> [AUTH] Supabase Header getUser failed:', e.message);
      }
    }
  }

  // 2) Use @supabase/ssr via createServerClient to handle cookie chunks (.0, .1)
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // If we see a cookie but getUser failed, log the specific error
      const hasSBCookie = request.headers.get('cookie')?.includes('sb-');
      if (hasSBCookie) {
        console.error('>>> [AUTH DEBUG] Supabase cookie detected but getUser failed:', error.message || error);
      }
      return null;
    }

    if (user) {
      console.log(`>>> [AUTH] OK via Supabase SSR Client: ${user.id}`);
      return { id: user.id, email: user.email };
    }
  } catch (err: any) {
    console.warn('>>> [AUTH] Supabase SSR Client check failed:', err.message);
  }

  console.log('>>> [AUTH] No valid session found');
  return null;
}

