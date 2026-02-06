import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Legacy endpoint: tour orders were previously stored in local JSON.
  // Current backbone: /api/orders.
  void req;
  return NextResponse.json({ ok: false, error: 'legacy_endpoint_disabled' }, { status: 410 });
}
