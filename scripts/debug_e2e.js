// scripts/debug_e2e.js
// Quick end-to-end check: verifies Supabase keys can read/insert and Stripe secret can create a Checkout session.

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

async function main() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL;
  const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL;

  console.log('env present:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON: !!SUPABASE_ANON,
    STRIPE_SECRET_KEY: !!STRIPE_SECRET_KEY,
    STRIPE_SUCCESS_URL: !!STRIPE_SUCCESS_URL,
    STRIPE_CANCEL_URL: !!STRIPE_CANCEL_URL,
  });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase URL or service role key missing in .env.local');
    process.exit(2);
  }
  if (!STRIPE_SECRET_KEY || !STRIPE_SUCCESS_URL || !STRIPE_CANCEL_URL) {
    console.error('Stripe keys/urls missing in .env.local');
    process.exit(2);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let sample = null;
  try {
    console.log('\n-- Supabase: inspect /orders first row (to detect columns) --');
    const { data: sampleRows, error: sampleErr, status } = await supabase.from('orders').select('*').limit(1);
    if (sampleErr) {
      console.error('Select error:', sampleErr);
    } else {
      console.log('Select ok. rows:', sampleRows?.length ?? 0, 'status', status);
      if (sampleRows && sampleRows.length > 0) {
        console.log('Sample row keys:', Object.keys(sampleRows[0]));
        sample = sampleRows[0];
      } else {
        console.log('No sample row to inspect — table may be empty.');
      }
    }
  } catch (e) {
    console.error('Select threw', e);
  }

  // Insert a minimal order (core columns only)
  let inserted;
  try {
    console.log('\n-- Supabase: inserting minimal order using only detected columns --');
    const now = Date.now();

  // Query column types so we don't insert strings into uuid columns
  const { data: cols } = await supabase.from('information_schema.columns').select('column_name,data_type').eq('table_name', 'orders');
  const colMap = {};
  if (cols && Array.isArray(cols)) cols.forEach(c => { if (c && c.column_name) colMap[c.column_name] = c.data_type; });

  const insertObj = {};
  const userType = colMap['user_id'];
  const ownerType = colMap['owner_id'];
  if (userType && /char|text/i.test(userType)) insertObj.user_id = `debug-node-${now}`;
  else if (ownerType && /char|text/i.test(ownerType)) insertObj.owner_id = `debug-node-${now}`;
  // otherwise skip user/owner id (likely uuid)

  if (sample && Object.prototype.hasOwnProperty.call(sample, 'tour_id')) insertObj.tour_id = 'debug-tour';
  if (sample && Object.prototype.hasOwnProperty.call(sample, 'tour_title')) insertObj.tour_title = 'Debug Tour';
  if (sample && Object.prototype.hasOwnProperty.call(sample, 'name') && !insertObj.tour_title) insertObj.name = 'Debug Tour';

  if (sample && Object.prototype.hasOwnProperty.call(sample, 'travelers_count')) insertObj.travelers_count = 2;
  if (sample && Object.prototype.hasOwnProperty.call(sample, 'travelers') && !insertObj.travelers_count) insertObj.travelers = 2;

  if (sample && Object.prototype.hasOwnProperty.call(sample, 'type')) insertObj.type = 'fixed';

    const { data, error } = await supabase.from('orders').insert(insertObj).select('*').limit(1).single();

    if (error) {
      console.error('Insert error:', error);
    } else {
      inserted = data;
      console.log('Insert ok. inserted id:', inserted.id);
    }
  } catch (e) {
    console.error('Insert threw', e);
  }

  // Create Stripe checkout session using secret key
  try {
    console.log('\n-- Stripe: creating checkout session --');
  const stripe = new Stripe(STRIPE_SECRET_KEY);
    const amountCents = Math.round((5 * 2) * 100); // simple amount
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'IBERO debug deposit' },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${STRIPE_SUCCESS_URL}?test=1`,
      cancel_url: `${STRIPE_CANCEL_URL}?test=1`,
      metadata: { test: 'true' },
    });

    console.log('Stripe session created. url:', session.url || 'NO_URL');

    if (inserted) {
      console.log('\n-- Supabase: attempting to update inserted order with stripe_session_id --');
      const { error: updErr } = await supabase.from('orders').update({ stripe_session_id: session.id }).eq('id', inserted.id);
      if (updErr) {
        console.warn('Update error (might be missing column):', updErr.message || updErr);
      } else {
        console.log('Order updated with stripe_session_id');
      }
    }

    console.log('\nDone.');
  } catch (e) {
    console.error('Stripe error:', e);
    process.exit(3);
  }
}

main().catch((e) => {
  console.error('Unhandled', e);
  process.exit(99);
});
