import { supabaseServer } from '../lib/db/supabaseServer.js';

(async () => {
  if (!supabaseServer) {
    console.log('Supabase not configured');
    return;
  }
  try {
    const { data, error } = await supabaseServer
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'orders')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Tables found:', data);
      if (data && data.length > 0) {
        console.log('La tabla orders existe.');
      } else {
        console.log('La tabla orders NO existe.');
      }
    }
  } catch (e) {
    console.error('Exception:', e);
  }
})();