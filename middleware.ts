import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from './lib/db/supabaseServer';

// Global middleware to immediately short-circuit any client attempts to POST
// diagnostics. This is an emergency measure so the server doesn't waste CPU or
// I/O on thousands of incoming diagnostic requests during development.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block diagnostic endpoint
  if (pathname.startsWith('/api/diagnostic')) {
    return new NextResponse(null, { status: 204 });
  }

  // SECURITY: Protect private routes - require authentication
  const protectedRoutes = ['/panel', '/admin', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    try {
      // Extract token from cookies
      const cookieHeader = req.headers.get('cookie') || '';
      const cookiesMap = Object.fromEntries(cookieHeader.split(';').map(p => {
        const [k, ...v] = p.split('=');
        return [k?.trim(), decodeURIComponent((v || []).join('='))];
      }));

      const token = cookiesMap['sb-access-token'] ||
                    cookiesMap['supabase-auth-token'] ||
                    Object.keys(cookiesMap).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
                    ? (function() {
                        const key = Object.keys(cookiesMap).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                        if (!key) return null;
                        try {
                          const val = cookiesMap[key];
                          if (val.startsWith('{')) {
                            return JSON.parse(val).access_token;
                          }
                          return val;
                        } catch { return cookiesMap[key]; }
                      })()
                    : null;

      if (!token || !supabaseServer) {
        // Redirect to login if no token
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }

      // Verify token with Supabase
      const { data: { user }, error } = await supabaseServer.auth.getUser(token);
      if (error || !user) {
        // Redirect to login if invalid token
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }

      // User is authenticated, allow access
    } catch (error) {
      // On any error, redirect to login
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  return NextResponse.next();
}

// Explicit matcher: apply to diagnostic endpoints AND protected routes
export const config = {
  matcher: ['/api/diagnostic/:path*', '/panel/:path*', '/admin/:path*', '/dashboard/:path*']
};
