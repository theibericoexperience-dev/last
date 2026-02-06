#!/usr/bin/env node
/*
  e2e-booking-test.js
  - Ensures an availability row exists for a given tour/date
  - Calls /api/bookings/create to create a booking (which creates a Stripe PaymentIntent)
  - Prints the booking id and payment intent id

  Requires: node >=18 (native fetch) and .env.local present with SUPABASE and local NEXT server running on :3000
*/

import fs from 'fs';
import path from 'path';
import process from 'process';
import { randomUUID } from 'crypto';

const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found in repo root');
  process.exit(1);
}

const env = Object.fromEntries(fs.readFileSync(envPath, 'utf8').split(/\n+/).map(l=>l.trim()).filter(Boolean).map(l=>{
  const i = l.indexOf('=');
  return [l.slice(0,i), l.slice(i+1)];
}));

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars in .env.local');
  process.exit(1);
}

const tour_id = 'MADRID-LISBON-APR-2026';
const date = '2026-04-10';
const seats = 1;
const email = 'test+e2e@local.test';
const idempotency_key = `e2e-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
const total_amount_cents = 1000; // $10 for a small test

async function ensureAvailability() {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/availability`;
  // check existing
  const q = `${url}?tour_id=eq.${encodeURIComponent(tour_id)}&date=eq.${encodeURIComponent(date)}`;
  let resp = await fetch(q, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!resp.ok) throw new Error('Failed to query availability: ' + resp.statusText);
  const items = await resp.json();
  if (Array.isArray(items) && items.length) {
    console.log('Found existing availability:', items[0].id);
    return items[0];
  }
  // insert
  resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: 'return=representation' },
    body: JSON.stringify([{ tour_id, date, capacity_total: 10 }]),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error('Failed to insert availability: ' + resp.status + '\n' + txt);
  }
  const created = await resp.json();
  console.log('Inserted availability id:', created[0].id);
  return created[0];
}

async function createBooking() {
  const url = 'http://localhost:3000/api/bookings/create';
  const body = { tour_id, date, seats, email, idempotency_key, total_amount_cents, currency: 'usd' };
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await resp.json().catch(()=>null);
  if (!resp.ok) {
    console.error('Booking create failed', resp.status, j);
    throw new Error('Booking create failed');
  }
  if (!j || !j.ok) {
    console.error('Booking create replied not ok', j);
    throw new Error('Booking create not ok');
  }
  console.log('Booking created:', j.booking.id);
  console.log('Stripe PaymentIntent id on booking:', j.booking.stripe_payment_intent_id);
  console.log('Client secret (for client-side flows):', j.client_secret);
  return { booking: j.booking, client_secret: j.client_secret };
}

(async function main(){
  try {
    console.log('Ensuring availability for', tour_id, date);
    const avail = await ensureAvailability();
    const result = await createBooking();
    console.log('\nSUCCESS: booking id =', result.booking.id);
    console.log('pi =', result.booking.stripe_payment_intent_id);
    console.log('\nNext steps: run the Stripe CLI to forward a payment_intent.succeeded event for that payment_intent id, or I can attempt to send a test event for you.');
    process.exit(0);
  } catch (err) {
    console.error('E2E test failed', err);
    process.exit(2);
  }
})();
