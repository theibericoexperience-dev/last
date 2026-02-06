import { NextResponse } from 'next/server';

// Read the TSV from disk and return a normalized JSON with ordered days.
export async function GET() {
  // Legacy endpoint: ad-hoc itinerary parser for a dev TSV.
  return NextResponse.json({ ok: false, error: 'legacy_endpoint_disabled' }, { status: 410 });
}
