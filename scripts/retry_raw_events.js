#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

async function main(){
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabase.from('raw_events').select('*').eq('processed', false).limit(50);
  if(!data || data.length===0){ console.log('No unprocessed events'); return; }
  for(const e of data){
    console.log('Replaying', e.id, e.event_id);
    const res = await fetch('http://localhost:3000/api/debug/replay', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id: e.id }) });
    const json = await res.json();
    console.log('->', json);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
