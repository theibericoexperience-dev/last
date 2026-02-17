# Payment Flow Analysis

## Problem
The user paid, but the UI still shows "Pay Deposit". This means the `orders` table `status` column is not updating to `'paid'`.

## Potential Root Causes

1. **Dual Webhook Handlers (Confusion)**
   - The repository contains **two** distinct webhook handlers:
     1. `app/api/payments/webhook/route.ts` (Next.js API Route)
     2. `supabase/functions/stripe_webhook/index.ts` (Supabase Edge Function)
   - **Risk**: If Stripe is configured to send events to only one of these, but the logic you rely on is in the other, the update won't happen. The Next.js one uses the robust `processStripeEvent` shared library. The Edge function has its own isolated logic.

2. **Webhook URL Configuration in Stripe**
   - We need to know where Stripe is actually sending the `checkout.session.completed` event.
   - If it's sending to `https://.../api/payments/webhook`, the Next.js code runs.
   - If it's sending to `https://.../functions/v1/stripe_webhook`, the Edge Function runs.

3. **Status Update Logic Mismatch**
   - `lib/payments/processEvent.ts` (Next.js) handles the update by checking `metadata.orderId`. It seems robust, handling UUID/Int.
   - `supabase/functions/stripe_webhook/index.ts` (Edge) *also* handles the update, but it has slightly different logic handling `id_new` and fallback to `stripe_session_id`.

4. **Environment Variables**
   - Specifically `STRIPE_WEBHOOK_SECRET`. If this doesn't match the secret for the *specific endpoint* configured in the Stripe Dashboard, signature verification fails and the code aborts before updating the database.

5. **Missing `orderId` in Metadata (Unlikely but possible)**
   - The creation code puts `orderId` in metadata. If for some reason that's missing, the fallback is to look up by `stripe_session_id`.
   - The creation code *does* update the `orders` table with the `stripe_session_id` immediately after creation (`app/api/payments/create-checkout-session/route.ts`).
   - **However**, if the user pays *extremely quickly* (or race condition), the webhook might arrive before the creation endpoint finishes updating the DB with the session ID. Relying on `metadata.orderId` is safer. Both handlers try metadata first.

## Recommendations

1. **Verify Stripe Dashboard Logs**: Check the "Events" logs in the Stripe Dashboard for the specific payment. 
   - Did the webhook succeed (200 OK)? 
   - Which URL did it hit?

2. **Consolidate Logic**:
   - Determine which handler is active.
   - Ensure both handlers (if kept) share the same business logic for marking an order as paid.

3. **Database Inspection**:
   - Check the `orders` table for the specific order.
   - Check the `raw_events` table (used by the Next.js handler) to see if the event was received but failed processing.
