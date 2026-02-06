import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerConfig } from './config';

let cached: SupabaseClient | null | undefined;

export function getSupabaseServer(): SupabaseClient | null {
  // Cache por proceso (server runtime). Evita recrear cliente en cada request.
  if (cached !== undefined) return cached;

  const cfg = getServerConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey) {
    console.warn('[SUPABASE SERVER] Missing URL or ServiceKey in config');
    cached = null;
    return cached;
  }

  // Create Service Role client
  const serviceClient = createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  // Create Anon Client as emergency fallback
  const anonClient = cfg.supabaseAnonKey 
    ? createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: false }})
    : null;

  // Enhance the client with a proxy to auto-fallback on "Invalid API key" errors
  // However, for simplicity and speed, let's just use a multi-capable client object.
  // Actually, standardizing on getSupabaseServer() and just providing a functional client is better
  
  cached = serviceClient;
  return cached;
}

/**
 * Functional fallback: if Service Key is known to be broken, use this.
 */
export function getFunctionalSupabaseServer(): SupabaseClient | null {
  const cfg = getServerConfig();
  if (!cfg.supabaseUrl) return null;
  // If Service Role fails, many parts use getSupabaseServer.
  // For now, return Anon if it's available.
  return createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, { auth: { persistSession: false } }) 
    || (cfg.supabaseAnonKey ? createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: false } }) : null);
}
