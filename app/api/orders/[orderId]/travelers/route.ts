import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

type RouteParams = { params: Promise<{ orderId: string }> };

// PATCH /api/orders/[orderId]/travelers - Update a traveler for an order
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
  const { traveler, slotId } = body;

  if (!traveler) {
    return NextResponse.json({ error: 'Missing traveler data' }, { status: 400 });
  }

  // 1. Verify accessibility/ownership of the order
  let query = supabaseServer
    .from('orders')
    .select('id, user_id')
    .eq('user_id', userId);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
  if (isUuid) {
    query = query.or(`id.eq.${orderId},id_new.eq.${orderId}`);
  } else {
    query = query.eq('id', String(orderId));
  }

  const { data: order, error: orderError } = await query.single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // 2. Prepare passenger data
  const passengerData = {
    user_id: userId,
    order_id: order.id,
    first_name: traveler.firstName?.trim() || null,
    last_name: traveler.lastName?.trim() || null,
    dob: traveler.dateOfBirth || null,
    gender: (traveler.gender === 'unspecified' || !traveler.gender) ? null : traveler.gender,
    nationality: traveler.nationality || null,
    document_type: traveler.documentType || 'Passport',
    document_number: traveler.documentNumber || null,
    document_country: traveler.documentCountry || traveler.issuingCountry || null,
    document_expires: traveler.documentExpires || null,
    updated_at: new Date().toISOString(),
  };

  // 3. Upsert into passengers table
  let upsertPayload: any = { ...passengerData };
  
  const isIdUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
  
  if (traveler.id && isIdUUID(traveler.id)) {
      upsertPayload.id = traveler.id;
  } else if (slotId && isIdUUID(slotId)) {
      upsertPayload.id = slotId;
  }

  const { data: savedPassenger, error: saveError } = await supabaseServer
    .from('passengers')
    .upsert(upsertPayload)
    .select()
    .single();

  if (saveError) {
    console.error("Error saving passenger:", saveError);
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, traveler: savedPassenger });
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

  // 1. Resolve order UUID and verify ownership
  let query = supabaseServer
    .from('orders')
    .select('id, travelers_count')
    .eq('user_id', userId);
    
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
  if (isUuid) {
    query = query.or(`id.eq.${orderId},id_new.eq.${orderId}`);
  } else {
    query = query.eq('id', String(orderId));
  }

  const { data: order, error: orderError } = await query.single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // 2. Fetch passengers from the table
  const { data: passengers, error: passengersError } = await supabaseServer
    .from('passengers')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true }); 

  if (passengersError) {
    return NextResponse.json({ error: passengersError.message }, { status: 500 });
  }

  // 3. Map back to frontend format
  const mappedTravelers = (passengers || []).map(p => ({
     id: p.id,
     firstName: p.first_name || '',
     lastName: p.last_name || '',
     dateOfBirth: p.dob || '',
     gender: p.gender || 'unspecified',
     nationality: p.nationality || '',
     documentType: p.document_type || 'Passport',
     documentNumber: p.document_number || '',
     documentCountry: p.document_country || '',
     documentExpires: p.document_expires || '',
     fullName: `${p.first_name || ''} ${p.last_name || ''}`.trim()
  }));

  // If no passengers found, try to pre-fill the first slot with the user's profile info
  if (mappedTravelers.length === 0) {
      const { data: profile } = await supabaseServer
        .from('user_profiles')
        .select('first_name, last_name, email, phone, metadata')
        .eq('user_id', userId)
        .single();
      
      if (profile) {
          // Check metadata for additional fields if available
          const meta = profile.metadata || {};
          
          mappedTravelers.push({
              id: `virtual-${Date.now()}`, // Temporary ID to indicate it's not saved yet but pre-filled
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              // Try to map dateOfBirth and gender if present in metadata
              dateOfBirth: meta.dateOfBirth || '',
              gender: meta.gender || 'unspecified',
              nationality: meta.nationality || '',
              documentType: 'Passport',
              documentNumber: '',
              documentCountry: '',
              documentExpires: '',
              fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          });
      }
  }

  return NextResponse.json({ 
      travelers: mappedTravelers,
      count: Math.max(mappedTravelers.length, order.travelers_count || 0)
  });
}
