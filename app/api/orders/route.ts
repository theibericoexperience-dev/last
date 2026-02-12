import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/db/supabaseServer';
import type { OrderType } from '@/lib/db/types';
import { isEnabled } from '@/lib/featureFlags';
import computePricing from '@/lib/domain/pricing';
import tourCanonicals from '@/data/tourCanonicals';
import toursOverview from '@/data/toursOverview';

// Helper to create a Supabase client for Route Handlers using @supabase/ssr
async function getSupabaseRouteClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  );
}

export async function GET(request: Request) {
  const supabase = await getSupabaseRouteClient();
  let authUser = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    authUser = user;
  } catch (err) {
    console.warn('>>> [AUTH] Exception in getUser in GET /api/orders:', err);
  }
  
  if (authUser) {
    console.log('>>> AUTH DEBUG - User:', authUser.id, 'SessionType: Supabase SSR');
  }

  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  const userId = authUser.id as string;
  // Fetch orders for the user
  const { data: ordersData, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

  const orders = ordersData || [];

  // Collect referenced tour ids (filter falsy / null)
  const tourIds = Array.from(new Set(orders.map((o: any) => o.tour_id).filter(Boolean)));

  // Try to load canonical tour rows from DB in one query when available
  let toursMap: Record<string, any> = {};
  if (tourIds.length > 0) {
    try {
      const { data: toursData } = await supabaseAdmin
        .from('tours')
        .select('id, title, card_image, start_date, year')
        .in('id', tourIds as any[]);
      if (Array.isArray(toursData)) {
        toursMap = Object.fromEntries((toursData || []).map((t: any) => [t.id, t]));
      }
    } catch (e) {
      // ignore failures fetching tours table; we'll fallback to in-repo canonicals
    }
  }

  // Fallback to in-repo tourCanonicals when DB table not present or missing entries
  for (const o of orders) {
    if (!o.tour_id) continue;
    if (!toursMap[o.tour_id] && typeof tourCanonicals === 'object') {
      const canonical = (tourCanonicals as any)[o.tour_id];
      if (canonical) {
        toursMap[o.tour_id] = {
          id: o.tour_id,
          title: canonical.title || o.tour_title || canonical.name,
          card_image: canonical.cardImage || canonical.card_image || null,
          start_date: canonical.startDate || null,
        };
      }
    }
  }

  // Additional fallback: use the in-repo `toursOverview` list when available.
  // This is important for deployments where the DB `tours` table is empty but
  // we have authoritative cardImage public URLs in `data/toursOverview.ts`.
  if (Array.isArray(toursOverview)) {
    for (const o of orders) {
      if (!o.tour_id) continue;
      if (toursMap[o.tour_id]) continue; // already populated
      try {
        const found = (toursOverview as any[]).find((t) => t.id === o.tour_id || t.id === String(o.tour_id));
        if (found) {
          toursMap[o.tour_id] = {
            id: found.id,
            title: found.title || o.tour_title || null,
            // `toursOverview` stores `cardImage` (camelCase) with absolute Supabase URLs
            card_image: (found.cardImage as any) || (found.card_image as any) || null,
            start_date: found.startDate || found.start_date || null,
            year: found.year || undefined,
          };
        }
      } catch (e) {
        // ignore any lookup errors
      }
    }
  }

  // Ensure any existing toursMap entries use the absolute card_image from
  // `toursOverview` when available. This handles cases where a DB `tours`
  // row exists but its `card_image` is still a local path (legacy).
  try {
    if (Array.isArray(toursOverview)) {
      for (const [tid, tRow] of Object.entries(toursMap)) {
        const existing = tRow as any;
        const hasAbsolute = typeof existing?.card_image === 'string' && existing.card_image.startsWith('http');
        if (hasAbsolute) continue;
        const found = (toursOverview as any[]).find((t) => t.id === tid || t.id === String(tid));
        if (found && ((found.cardImage && String(found.cardImage).startsWith('http')) || (found.card_image && String(found.card_image).startsWith('http')))) {
          existing.card_image = (found.cardImage as any) || (found.card_image as any) || existing.card_image;
          toursMap[tid] = existing;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Attach optional server pricing and the tour object to each order
  const attachPricing = isEnabled('serverPricingEnabled');
  const enrichedOrders = await Promise.all(orders.map(async (o: any) => {
    const tour = o.tour_id ? (toursMap[o.tour_id] || null) : null;
    const orderCopy: any = { ...o, tour };

    // Provide convenient fallbacks so the UI can reliably show tour title and
    // departure date even when older DB rows don't have those columns filled.
    if (!orderCopy.tour_title) {
      orderCopy.tour_title = orderCopy.tourTitle ?? (tour ? (tour.title || tour.name) : null) ?? null;
    }
    if (!orderCopy.departure_date && !orderCopy.departureDate) {
      // tour.start_date comes from the canonical/tours table select above.
      orderCopy.departure_date = (tour && (tour.start_date || tour.startDate)) ?? null;
    }

    if (attachPricing) {
      try {
        const travelers = o.travelers_count || o.travelers || 2;
        const canonical = tourCanonicals[o.tour_id || ''] || null;
        const pricing = computePricing(canonical as any, {
          tourId: o.tour_id || 'unknown',
          travelers,
          roomType: (o.trip?.roomType as any) || 'double',
          extensions: o.trip?.extensions || undefined,
          insuranceSelected: o.trip?.insuranceSelected || undefined,
        });
        orderCopy.server_pricing = pricing;
        orderCopy.per_person_deposit_usd = pricing.deposit_per_person_usd ?? orderCopy.per_person_deposit_usd;
        orderCopy.deposit_total_usd = pricing.deposit_total_usd ?? orderCopy.deposit_total_usd;
        // Attach convenient cashback top-level fields when pricing is present
        orderCopy.cashback_total_usd = pricing.cashback_total_usd ?? 0;
        orderCopy.cashback_per_person_usd = pricing.cashback_per_person_usd ?? 0;
      } catch (e) {
        // ignore pricing errors
      }
    }

    return orderCopy;
  }));

  return NextResponse.json({ orders: enrichedOrders });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseRouteClient();
  let authUser = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    authUser = user;
  } catch (err) {
    console.warn('>>> [AUTH] Exception in getUser in POST /api/orders:', err);
  }

  const bodyText = await request.text().catch(() => '');
  const body = bodyText ? JSON.parse(bodyText) : {};
  
  const {
    type: payloadType,
    tourId,
    tourTitle,
    travelersCount,
    tour_id, // New sync field
    tour_title, // New sync field
    travelers_count, // New sync field
    extras,
    userEmail: payloadEmail, 
  }: {
    type?: OrderType;
    tourId?: string | null;
    tourTitle?: string | null;
    travelersCount?: number;
    tour_id?: string | null;
    tour_title?: string | null;
    travelers_count?: number;
    extras?: Record<string, any>;
    userEmail?: string;
  } = body || {};

  // Normalize fields (favor new snake_case if present)
  const finalTourId = tour_id || tourId;
  const finalTourTitle = tour_title || tourTitle;
  const finalTravelersCount = travelers_count || travelersCount;
  const finalType = payloadType || 'fixed'; // Default to fixed for standard reservations

  let userId = authUser?.id;
  const effectiveEmail = authUser?.email || payloadEmail;

  if (!userId) {
    console.error('>>> [POST /api/orders] Rejected: No valid user identity found');
    return NextResponse.json({ error: 'Unauthorized: No valid session found' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // VALIDATION BYPASS: Ensure userId exists in user_profiles
  const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  
  if (isUuid(userId)) {
    // Basic sync for user_profiles if missing
    try {
      const { data: p } = await supabaseAdmin.from('user_profiles').select('user_id').eq('user_id', userId).maybeSingle();
      if (!p && effectiveEmail) {
        await supabaseAdmin.from('user_profiles').upsert({
          user_id: userId,
          email: effectiveEmail
        });
      }
    } catch (e) { /* ignore */ }
  }

  if (!finalType || !['fixed', 'private'].includes(finalType)) {
    return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
  }

  const travelers = typeof finalTravelersCount === 'number' && finalTravelersCount > 0 ? finalTravelersCount : 2;
  const DEFAULT_PER_PERSON_DEPOSIT_USD = 1000;
  const perPerson = DEFAULT_PER_PERSON_DEPOSIT_USD;
  const total = perPerson * travelers;

  const insertPayload = {
    user_id: userId,
    // Dual-write user_id_uuid for RLS/Migration support
    user_id_uuid: userId,
    type: finalType,
    tour_id: finalTourId || null,
    tour_title: finalTourTitle || null,
    travelers_count: travelers,
    status: 'draft',
    extras: extras || {},
  };

  // Perform insert ONLY via Service Role (Admin) client
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('orders')
    .insert(insertPayload as any)
    .select('*')
    .single();

  if (insertError) {
    console.error(">>> [POST /api/orders] Insert failed via ServiceRole:", insertError.message);
    return NextResponse.json({ 
      error: insertError.message || "Failed to create order.",
      details: insertError 
    }, { status: 500 });
  }

  console.log("POST /api/orders insert successful", inserted);

  // Build a response-order object filling in defaults for any missing columns
  const orderResponse = {
    ...inserted,
    per_person_deposit_usd: (inserted as any).per_person_deposit_usd ?? perPerson,
    deposit_total_usd: (inserted as any).deposit_total_usd ?? total,
    server_pricing: undefined,
    extras: (inserted as any).extras ?? extras ?? {},
  } as any;

  // Compute and attach server pricing
  try {
    if (isEnabled('serverPricingEnabled')) {
      const pricingReq = {
        tourId: finalTourId || 'unknown',
        travelers,
        roomType: (extras?.room_type) || 'double',
        extensions: extras?.selected_addons ? Object.keys(extras.selected_addons).filter(k => k.startsWith('ext:')).map(k => k.replace('ext:', '')) : undefined,
        insuranceSelected: extras?.selected_addons ? Object.keys(extras.selected_addons).filter(k => k.startsWith('ins')) : undefined,
      };
      const canonical = tourCanonicals[finalTourId || ''] || null;
      const pricing = computePricing(canonical as any, pricingReq as any);
      orderResponse.server_pricing = pricing;
      orderResponse.per_person_deposit_usd = pricing.deposit_per_person_usd;
      orderResponse.deposit_total_usd = pricing.deposit_total_usd;
      orderResponse.cashback_total_usd = pricing.cashback_total_usd ?? 0;
      orderResponse.cashback_per_person_usd = pricing.cashback_per_person_usd ?? 0;
    }
  } catch (e) {
    console.warn('server pricing compute failed', e);
  }

  return NextResponse.json({ order: orderResponse });
}
