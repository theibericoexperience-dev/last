const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', url);
console.log('Service Key starts with:', serviceKey ? serviceKey.substring(0, 10) : 'MISSING');
console.log('Anon Key starts with:', anonKey ? anonKey.substring(0, 10) : 'MISSING');

async function test() {
  if (!url || !serviceKey) {
    console.error('Missing env vars');
    return;
  }

  const supabase = createClient(url, serviceKey);
  
  console.log('\n--- Testing Service Key ---');
  const { data, error } = await supabase.from('orders').select('id').limit(1);
  if (error) {
    console.error('Service Key Error:', error.message);
  } else {
    console.log('Service Key success, found orders:', data.length);
  }

  const supabaseAnon = createClient(url, anonKey);
  console.log('\n--- Testing Anon Key ---');
  const { data: data2, error: error2 } = await supabaseAnon.from('orders').select('id').limit(1);
  if (error2) {
    console.log('Anon Key Error (Expected if RLS is on):', error2.message);
  } else {
    console.log('Anon Key success (RLS might be off), found orders:', data2.length);
  }
}

test();
