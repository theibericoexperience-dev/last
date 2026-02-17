
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listOrders() {
  console.log('--- Fetching recent orders ---');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, id_new, user_id, status, created_at, tour_title')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching orders:', error.message);
    return;
  }

  if (!orders || orders.length === 0) {
    console.log('No orders found.');
    return;
  }

  console.table(orders.map(o => ({
    ID: o.id,
    UUID: o.id_new || 'N/A',
    Status: o.status,
    Created: new Date(o.created_at).toLocaleString(),
    Tour: o.tour_title || 'Unknown'
  })));
  
  console.log('\nTo mark an order as PAID, run:');
  console.log('  node scripts/fix_payment_manual.js <ORDER_ID>');
}

async function markAsPaid(orderId) {
  console.log(`--- Marking Order ${orderId} as PAID ---`);
  
  // Check if it's UUID or Int to pick the right column
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
  
  let query = supabase.from('orders').update({ 
    status: 'paid',
    updated_at: new Date().toISOString()
  });

  if (isUuid) {
    query = query.or(`id.eq.${orderId},id_new.eq.${orderId}`);
  } else {
    query = query.eq('id', orderId);
  }

  const { data, error } = await query.select();

  if (error) {
    console.error('Error updating order:', error.message);
  } else if (!data || data.length === 0) {
    console.error('Order not found or not updated.');
  } else {
    console.log('Success! Order updated:', data[0]);
    console.log('Now refresh your browser panel to see the changes.');
  }
}

const args = process.argv.slice(2);
if (args.length > 0) {
  markAsPaid(args[0]);
} else {
  listOrders();
}
