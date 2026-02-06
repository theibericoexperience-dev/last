import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(">>> [SUPABASE SERVER] MISSING CONFIG:", { url: !!supabaseUrl, key: !!supabaseServiceKey });
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-my-custom-header': 'ibero-admin' // Esto fuerza a resetear los headers globales
      }
    }
  }
);

// Alias para no romper otras partes del código si se importaba como supabaseServer
export const supabaseServer = supabaseAdmin;


// Lightweight connectivity check used by diagnostics.
export async function supabaseHealthCheck() {
  if (!supabaseServer) {
    return { ok: false, reason: 'Supabase client not configured' };
  }
  try {
    const { error } = await supabaseServer.from('orders').select('id').limit(1);
    if (error) {
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'Unknown error' };
  }
}

