import { NextResponse } from 'next/server';
import { isEnabled } from '../../../../../lib/featureFlags';
import computePricing from '../../../../../lib/domain/pricing';
import tourCanonicals from '../../../../../data/tourCanonicals';

export async function POST(req: Request, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  if (!isEnabled('serverPricingEnabled')) {
    return NextResponse.json({ error: 'Server pricing disabled' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const travelers = Number(body.travelers || 1);
    const roomType = body.roomType === 'single' ? 'single' : 'double';
    const extensions = Array.isArray(body.extensions) ? body.extensions : [];
    const insuranceSelected = body.insuranceSelected || {};

    const tourData = tourCanonicals[params.id] || null;
    const pricing = computePricing(tourData as any, {
      tourId: params.id,
      travelers,
      roomType,
      extensions,
      insuranceSelected,
      perTourOverrides: body.perTourOverrides || null,
    });

    return NextResponse.json(pricing);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'invalid request' }, { status: 400 });
  }
}

export async function GET(req: Request, ctx: any) {
  const { params } = ctx as { params: { id: string } };
  // For convenience support GET with query params for quick checks
  if (!isEnabled('serverPricingEnabled')) {
    return NextResponse.json({ error: 'Server pricing disabled' }, { status: 503 });
  }
  const url = new URL(req.url);
  const travelers = Number(url.searchParams.get('travelers') || '1');
  const roomType = url.searchParams.get('roomType') === 'single' ? 'single' : 'double';
  // extensions not supported via GET in full form; clients should use POST for payloads.
  const pricing = computePricing(null, { tourId: params.id, travelers, roomType });
  return NextResponse.json(pricing);
}
