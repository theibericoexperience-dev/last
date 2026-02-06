import { supabaseServer } from './supabaseServer';
import bcrypt from 'bcryptjs';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  created_at: string;
  provider?: string | null;
};

// DEPRECATED: manual password management and auth users stored in `user_profiles`.
// This module will be removed in FASE 3 when Supabase Auth replaces NextAuth and
// manual credential handling. Do not add new password logic here.
// DEPRECATED: manejar contraseñas manualmente, eliminar en FASE 3
const TABLE = 'user_profiles';

export async function findAuthUserByEmail(email: string): Promise<AuthUser | null> {
  if (!supabaseServer) return null;
  // @ts-ignore - using dynamic supabase client call to avoid type generics
  const { data, error } = await (supabaseServer as any)
    .from('user_profiles')
    .select('id,email,password_hash,provider')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('[authUsers] findAuthUserByEmail error', error.message);
    return null;
  }
  return (data as AuthUser) ?? null;
}

export async function createAuthUser(params: {
  name?: string | null;
  email: string;
  password: string;
}): Promise<AuthUser | null> {
  if (!supabaseServer) return null;
  const email = params.email.toLowerCase();
  const existing = await findAuthUserByEmail(email);
  if (existing) return existing;

  const password_hash = await bcrypt.hash(params.password, 10);

  // @ts-ignore - using dynamic supabase client call to avoid type generics
  const { data, error } = await (supabaseServer as any)
    .from(TABLE)
    .insert({
      email,
      password_hash,
      provider: 'credentials',
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[authUsers] createAuthUser error', error.message);
    return null;
  }

  return data as AuthUser;
}

export async function verifyAuthUserPassword(email: string, password: string): Promise<AuthUser | null> {
  const user = await findAuthUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}
