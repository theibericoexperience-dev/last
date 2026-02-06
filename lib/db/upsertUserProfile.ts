import { supabaseAdmin } from './supabaseServer';

export async function upsertUserProfile(payload: Record<string, any> | null, opts?: { id?: string }) {
  // payload: object with profile fields (email, name, metadata, etc.)
  // opts.id: optional UUID representing auth.users.id to be used as authoritative identifier
  if (!supabaseAdmin) return null;
  if (!payload) payload = {};

  // If caller provided an explicit id in opts, include it in the payload using both
  // 'user_id' (used across app tables) and 'id' (primary key for user_profiles) to support
  // the RPC and future migrations. This is non-destructive: callers may omit id and
  // we fall back to email/provider matching as before.
  if (opts?.id) {
    payload.user_id = opts.id;
    // keep existing id field name for the upsert RPC if present
    payload.id = opts.id;
  }

  try {
    // Attempt RPC first
    const { data: rpcData, error: rpcError } = await (supabaseAdmin as any).rpc('upsert_user_profile', { p_payload: payload });
    if (!rpcError) return rpcData;
    
    // eslint-disable-next-line no-console
    console.log('[upsertUserProfile] rpc returned error, falling back to client upsert', rpcError.message || rpcError);
  } catch (e: any) {
    // ignore rpc errors and fallback
    // eslint-disable-next-line no-console
    console.log('[upsertUserProfile] rpc call threw, falling back to client upsert', e?.message || e);
  }

  // Fallback: client-side upsert. Keep email conflict fallback for Phase 1/2.
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('user_profiles')
      .upsert(payload, { onConflict: 'email' })
      .select();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[upsertUserProfile] fallback upsert error', error.message || error);
      return null;
    }
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[upsertUserProfile] unexpected error', err);
    return null;
  }
}
