#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(2);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

(async function(){
  try {
    console.log('Supabase URL:', SUPABASE_URL);
    // Try to list buckets if available
    if (typeof supabase.storage.listBuckets === 'function') {
      console.log('Listing buckets...');
      const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
      if (bucketsErr) console.error('listBuckets error:', bucketsErr.message || bucketsErr);
      else console.log('buckets:', (buckets || []).map(b => b.name).join(', '));
    } else {
      console.log('listBuckets() not available in this SDK version');
    }

    const candidates = [
      'Open Tours','OpenTours','open-tours','open_tours','opentours','Open_Tours','public','open tours'
    ];

    for (const name of candidates) {
      try {
        console.log('\nTrying bucket:', name);
        const res = await supabase.storage.from(name).list('', { limit: 100 });
        if (res.error) {
          console.log('  error:', res.error.message || res.error);
        } else {
          console.log('  items count:', (res.data || []).length);
          if ((res.data || []).length) console.log('  sample:', res.data.slice(0,5).map(i=>i.name).join(', '));
        }
      } catch (e) {
        console.log('  exception listing bucket', name, e && e.message ? e.message : e);
      }
    }
  } catch (err) {
    console.error('debug failed:', err && err.message ? err.message : err);
    process.exit(3);
  }
  process.exit(0);
})();
