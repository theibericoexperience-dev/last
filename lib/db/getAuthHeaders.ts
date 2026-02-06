// Returns an object with Authorization header when a Supabase token is available.
import { supabaseClient } from './supabaseClient';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    if (supabaseClient && supabaseClient.auth && typeof supabaseClient.auth.getSession === 'function') {
      const { data: { session } = {} as any } = await supabaseClient.auth.getSession();
      const token = session?.access_token;
      if (token) {
        console.log(`>>> [getAuthHeaders] Token encontrado en Supabase Client`);
        return { Authorization: `Bearer ${token}` };
      }
    }
  } catch (e) {
    console.error('>>> [getAuthHeaders] Error obteniendo sesión:', e);
  }

  // Fallback to document.cookie when running in browser
  if (typeof document !== 'undefined') {
    const cookieHeader = document.cookie || '';
    const cookies = Object.fromEntries(cookieHeader.split(';').map(p => {
      const [k, ...v] = p.split('=');
      return [k?.trim(), decodeURIComponent((v || []).join('='))];
    }));
    const token = cookies['sb-access-token'] || cookies['supabase-auth-token'] || '';
    if (token) {
      console.log(`>>> [getAuthHeaders] Token encontrado en Cookies`);
      return { Authorization: `Bearer ${token}` };
    }
  }

  console.log(`>>> [getAuthHeaders] NO se encontró token de autenticación`);
  return {};
}
