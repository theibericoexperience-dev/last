require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main(){
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(2);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }});
  const orderId = process.argv[2] || '11';
  try{
    const { data: order, error: oerr } = await supabase.from('orders').select('*').eq('id', orderId).limit(1).maybeSingle();
    if(oerr){ console.error('Order select error:', oerr); }
    else console.log('Order:', order);

    const { data: payments, error: perr } = await supabase.from('payments').select('*').order('created_at', {ascending:false}).limit(10);
    if(perr) console.error('Payments select error:', perr);
    else console.log('Recent payments:', payments);
  }catch(e){ console.error('Unhandled', e); }
}

main();
