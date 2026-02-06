import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';
import { isEnabled } from '@/lib/featureFlags';
import computePricing from '@/lib/domain/pricing';
import tourCanonicals from '@/data/tourCanonicals';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string | undefined;
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL as string | undefined;
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL as string | undefined;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY as string, {}) : null;

export async function POST(request: Request) {
  console.log('>>> PAYMENTS: Iniciando proceso de Checkout');
  console.log('>>> STRIPE KEY EXISTS:', !!STRIPE_SECRET_KEY);

  const body = await request.json().catch(() => ({}));
  const { orderId } = body || {};
  
  if (!orderId) {
    console.error('>>> ERROR: orderId missing in request body');
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  // 1. Auth check
  let authUser;
  try {
    authUser = await getAuthUserFromRequest(request);
    if (!authUser || !authUser.id) {
      console.error('>>> ERROR AUTH: No user session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('>>> AUTH OK: User ID', authUser.id);
  } catch (e: any) {
    console.error('>>> ERROR CRITICO AUTH:', e.message);
    return NextResponse.json({ error: 'Auth failure' }, { status: 500 });
  }

  if (!supabaseServer || !stripe || !STRIPE_SUCCESS_URL || !STRIPE_CANCEL_URL) {
    console.error('>>> ERROR CONFIG: Missing server env vars');
    return NextResponse.json({ error: 'Payments not configured' }, { status: 500 });
  }

  const userId = authUser.id as string;
  const numericOrderId = parseInt(orderId, 10);

  // 2. Fetch Order
  let order;
  try {
    const { data, error } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', numericOrderId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('>>> ERROR DB ORDER:', error?.message || 'Order not found');
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
    }
    order = data;
    console.log('>>> DB OK: Order found', order.id);
  } catch (e: any) {
    console.error('>>> ERROR CRITICO DB:', e.message);
    return NextResponse.json({ error: 'Database failure' }, { status: 500 });
  }

  // 3. Pricing Re-computation (with safe fallback)
  let depositTotal = (order as any).deposit_total_usd ?? ((order as any).per_person_deposit_usd ?? 0) * ((order as any).travelers_count ?? 1);
  
  if (isEnabled('serverPricingEnabled')) {
    try {
      const pricingReq = {
        tourId: (order as any).tour_id || (order as any).tourId || 'unknown',
        travelers: (order as any).travelers_count || (order as any).travelersCount || 1,
        roomType: (order as any).room_type || 'double',
      } as any;
      const canonical = tourCanonicals[(order as any).tour_id || (order as any).tourId || ''] || null;
      
      if (canonical) {
        const pricing = computePricing(canonical as any, pricingReq);
        depositTotal = pricing.deposit_total_usd;
        (order as any).per_person_deposit_usd = pricing.deposit_per_person_usd;
        console.log('>>> PRICING: Server re-computation success');
      } else {
        console.warn('>>> PRICING WARNING: No canonical found, using DB values as fallback');
      }
    } catch (e: any) {
      console.warn('>>> PRICING FALLBACK: Re-computation failed, using DB values:', e.message);
    }
  }

  const amount = Math.round((depositTotal || 0) * 100);
  if (!amount || amount <= 0) {
    console.error('>>> ERROR: Invalid amount calculated:', amount);
    return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
  }

  // 4. Stripe Session
  let sessionStripe;
  try {
    sessionStripe = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Reserva de Tour - Depósito Inicial",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${STRIPE_SUCCESS_URL}?orderId=${encodeURIComponent(order.id)}`,
      cancel_url: `${STRIPE_CANCEL_URL}?orderId=${encodeURIComponent(order.id)}`,
      metadata: { orderId: String(order.id), userId },
    });
    console.log('>>> STRIPE OK: Session created', sessionStripe.id);
  } catch (e: any) {
    console.error('>>> ERROR STRIPE:', e.message);
    return NextResponse.json({ error: 'Stripe session creation failed' }, { status: 500 });
  }

  // 5. Save Session ID to DB
  try {
    const { error: updateError } = await supabaseServer
      .from('orders')
      .update({ stripe_session_id: sessionStripe.id })
      .eq('id', numericOrderId);

    if (updateError) {
      console.error('>>> ERROR DB UPDATE:', updateError.message);
      return NextResponse.json({ error: 'Failed to update order with payment session' }, { status: 500 });
    }
    console.log('>>> DB UPDATE OK: Session stored');
  } catch (e: any) {
    console.error('>>> ERROR CRITICO DB UPDATE:', e.message);
    return NextResponse.json({ error: 'Persistence failure' }, { status: 500 });
  }

  return NextResponse.json({ url: sessionStripe.url });
}

