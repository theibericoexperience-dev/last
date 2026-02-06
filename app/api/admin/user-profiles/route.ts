import { NextResponse } from 'next/server';

// Minimal admin endpoint to list all traveler profiles.
// Only the primary admin email should be able to access this.
const ADMIN_EMAILS = ['tours@ibero.world'];

export async function GET() {
  // Legacy endpoint: admin panel route removed from product.
  // Archived copy: _archive/legacy-api/admin-user-profiles.route.ts
  return NextResponse.json({ error: 'legacy_endpoint_disabled' }, { status: 410 });
}
