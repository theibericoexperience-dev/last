import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

type RouteParams = { params: Promise<{ orderId: string }> };

// PATCH /api/orders/[orderId]/travelers - Update travelers for an order
export async function PATCH(
  req: Request,
  { params }: RouteParams
) {
  const { orderId } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const userId = authUser.id;
  const body = await req.json().catch(() => ({}));
  const { travelers } = body;

  if (!Array.isArray(travelers)) {
    return NextResponse.json({ error: 'Travelers must be an array' }, { status: 400 });
  }

  // Verify order belongs to user
  let query = supabaseServer
    .from('orders')
    .select('id, travelers_count')
    .eq('user_id', userId);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
  if (isUuid) {
    query = query.or(`id.eq.${orderId},id_new.eq.${orderId}`);
  } else {
    // Fallback for legacy integer IDs
    query = query.eq('id', String(orderId));
  }

  const { data: order, error: orderError } = await query.single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Validate travelers data
  const validatedTravelers = travelers.map((t: any, index: number) => ({
    id: t.id || `traveler-${index + 1}`,
    fullName: t.fullName?.trim() || '',
    passportNumber: t.passportNumber?.trim() || '',
    nationality: t.nationality?.trim() || '',
    birthDate: t.birthDate || null,
    dietaryNeeds: t.dietaryNeeds?.trim() || null,
    emergencyContact: t.emergencyContact?.trim() || null,
    notes: t.notes?.trim() || null,
  }));

  // Update order with travelers
  const { data: updated, error } = await supabaseServer
    .from('orders')
    .update({
      travelers: validatedTravelers,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id) // Use the resolved ID from previous step
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: updated });
}

// GET /api/orders/[orderId]/travelers - Get travelers for an order
export async function GET(
  req: Request,
  { params }: RouteParams
) {
  const { orderId } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const userId = authUser.id;

  const { data: order, error } = await supabaseServer
    .from('orders')
    .select('id, travelers, travelers_count')
    .or(`id.eq.${orderId},id_new.eq.${orderId}`) // Support both UUID and Int
    .eq('user_id', userId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    travelers: order.travelers || [],
    count: order.travelers_count || 0,
  });
}
