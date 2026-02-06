import { NextResponse } from 'next/server';

export async function GET() {
  // Legacy endpoint: older "travelers" table system.
  // Archived copy: _archive/legacy-api/travelers.route.ts
  return NextResponse.json({ error: 'legacy_endpoint_disabled' }, { status: 410 });
}

export async function POST(request: Request) {
  // Legacy endpoint: older "travelers" table system.
  // Archived copy: _archive/legacy-api/travelers.route.ts
  void request;
  return NextResponse.json({ error: 'legacy_endpoint_disabled' }, { status: 410 });
}
