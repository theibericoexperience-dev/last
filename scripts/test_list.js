import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.storage.from('behind').list('BEHIND_OPTIMIZED');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
test();
