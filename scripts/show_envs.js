/*
 Safe environment inspector
 - DOES NOT print full secret values
 - Shows presence, length and a masked preview (first 4 / last 4 characters) for manual verification
 Usage:
   node scripts/show_envs.js
*/

require('dotenv').config({ path: '.env.local' });

const expected = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SUCCESS_URL',
  'STRIPE_CANCEL_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

function mask(val) {
  if (val == null) return null;
  const s = String(val);
  if (s.length <= 8) return '*'.repeat(s.length);
  return `${s.slice(0,4)}${'*'.repeat(Math.max(0, s.length - 8))}${s.slice(-4)}`;
}

console.log('Inspecting environment (local .env and process.env). No secrets will be shown in full.');
console.log('---------------------------------------------------------------------');

for (const key of expected) {
  const fromDotenv = process.env[key] !== undefined ? process.env[key] : undefined;
  const fromProcess = process.env[key] !== undefined ? process.env[key] : undefined;
  const present = typeof fromProcess !== 'undefined';
  const val = present ? fromProcess : null;
  if (!present) {
    console.log(`${key.padEnd(30)} : MISSING`);
  } else {
    console.log(`${key.padEnd(30)} : present | length=${String(val).length.toString().padEnd(4)} | preview=${mask(val)}`);
  }
}

console.log('\nTip: If a variable is marked MISSING, either add it to .env.local (development) or set it in your hosting provider (Vercel) and redeploy.');
console.log('To list variables in Vercel (names only) use `vercel env ls` and to pull them locally `vercel env pull .env` (requires vercel CLI auth).');
