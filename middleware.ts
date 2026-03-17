import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export const runtime = 'nodejs';
import { auth } from '@/lib/auth';

// Global middleware to immediately short-circuit any client attempts to POST
// diagnostics. This is an emergency measure so the server doesn't waste CPU or
// I/O on thousands of incoming diagnostic requests during development.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth routes and static assets to pass through without middleware checks.
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|svg|css|js|ico|webmanifest)$/)
  ) {
    return NextResponse.next();
  }

  // Block diagnostic endpoint
  if (pathname.startsWith('/api/diagnostic')) {
    return new NextResponse(null, { status: 204 });
  }

  // SECURITY: Protect private routes - require authentication
  const protectedRoutes = ['/panel', '/admin', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    try {
      // Check authentication using NextAuth
      // Debug: check if the session cookie is present in the incoming request
      const cookieName = 'next-auth.session-token';
      const hasCookie = !!req.cookies.get(cookieName);
      console.log(`[Middleware] Path: ${pathname} | Cookie ${cookieName} present: ${hasCookie}`);

      const session = await auth();
      console.log(`[Middleware] Path: ${pathname} | Session detected: ${!!session?.user}`);

      if (!session?.user) {
        // Redirect to login if no session
        console.log(`[Middleware] No session for ${pathname}, redirecting to /auth/login`);
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
