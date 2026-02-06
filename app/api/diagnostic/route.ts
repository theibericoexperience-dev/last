import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Legacy diagnostics sink.
  // Archived copy: _archive/legacy-api/diagnostic.route.ts
  void req;
  return new NextResponse(null, { status: 410 });
}
