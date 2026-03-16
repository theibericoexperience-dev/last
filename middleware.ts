import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

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
      // Check authentication using NextAuth
      const session = await auth();

      if (!session?.user) {
        // Redirect to login if no session
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
