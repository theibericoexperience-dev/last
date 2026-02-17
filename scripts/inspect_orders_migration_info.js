require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('--- Checking Orders Table Metadata (via API) ---');
  // Attempt to read just 2 rows to see data format
  const { data: orders, error: oErr } = await supabase
    .from('orders')
    .select('id, user_id, status, stripe_session_id, type, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (oErr) {
    console.error('Error fetching orders:', oErr.message);
  } else {
    console.log('Sample Rows:', JSON.stringify(orders, null, 2));
    if (orders.length > 0) {
       console.log('Sample ID Type:', typeof orders[0].id);
       console.log('Sample user_id Type:', typeof orders[0].user_id);
    }
  }

  // Attempt to list columns if permissions allow querying information_schema NOT directly supported usually
  // But sometimes exposed via a view.
  // We can infer column existence by selecting * from 1 row if getting info schema fails.
  
  // Try calling a raw SQL function if it exists (unlikely but worth a check if we were using pg-node)
  // Since we are using supabase-js, we can't run raw SQL unless there's an RPC.
  
  // We can try to see if id_new exists or user_id_uuid exists by selecting them
  const { data: checkCols, error: colErr } = await supabase
    .from('orders')
    .select('id_new, user_id_uuid')
    .limit(1);
    
  if (colErr) {
      console.log('Columns id_new / user_id_uuid check:', colErr.message);
  } else {
      console.log('Columns id_new / user_id_uuid seem to exist.');
  }

  console.log('--- Checking User Profiles ---');
  const { data: profiles, error: pErr } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(3);
  
  if (pErr) console.error('Profiles error:', pErr.message);
  else console.log('Profiles sample:', JSON.stringify(profiles, null, 2));
}

main();
