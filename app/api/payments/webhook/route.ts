import { NextResponse } from 'next/server';
import { processStripeEvent } from '../../../../lib/payments/processEvent';
import { getStripeServer, getStripeWebhookSecret } from '@/lib/server/stripe';

export async function POST(req: Request) {
  const STRIPE_WEBHOOK_SECRET = getStripeWebhookSecret();
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'stripe not configured' }, { status: 500 });
  }

  const stripe = (await getStripeServer()) as any;
  if (!stripe) {
    return NextResponse.json({ ok: false, error: 'stripe not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature') || '';
  const body = await req.text();
  try {
    // Always validate the signature. Do not allow bypass in production or dev.
  const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

    console.log('[webhook] received event', event.type, 'id=', event.id);

    const res = await processStripeEvent(event);
    console.log('[webhook] processed event result', res);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('webhook error', err?.message || err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
 