import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Global middleware to immediately short-circuit any client attempts to POST
// diagnostics. This is an emergency measure so the server doesn't waste CPU or
// I/O on thousands of incoming diagnostic requests during development.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/diagnostic')) {
    // return 204 No Content immediately; do not run route handlers or file I/O
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.next();
}

// Explicit matcher: apply only to diagnostic endpoint(s)
export const config = {
  matcher: ['/api/diagnostic/:path*']
};
