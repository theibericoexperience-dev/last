import PanelClient from './PanelClient';
import { headers } from 'next/headers';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { TransitionLink } from '@/components/GlobalLoaderProvider';
export const dynamic = 'force-dynamic';

export default async function PanelPage() {
  // Server-side session check using exclusively Supabase.
  const hdrs = await headers();
  const cookieHeader = hdrs.get('cookie') || '';
  const cookiesMap = Object.fromEntries(cookieHeader.split(';').map(p => {
    const [k, ...v] = p.split('=');
    return [k?.trim(), decodeURIComponent((v || []).join('='))];
  }));
  
  // Try various common supabase cookie names
  const token = cookiesMap['sb-access-token'] || 
                cookiesMap['supabase-auth-token'] || 
                Object.keys(cookiesMap).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')) 
                ? (function() {
                    const key = Object.keys(cookiesMap).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                    if (!key) return null;
                    try {
                      const val = cookiesMap[key];
                      if (val.startsWith('{')) {
                        return JSON.parse(val).access_token;
                      }
                      return val;
                    } catch { return cookiesMap[key]; }
                  })()
                : null;

  let user = null;
  if (token && supabaseServer) {
    try {
      const resp = await supabaseServer.auth.getUser(token);
      user = (resp && (resp.data as any)?.user) ? (resp.data as any).user : null;
    } catch (e) {
      user = null;
    }
  }

  if (!user) {
    // SECURITY: No bypass allowed - redirect to login for unauthenticated access
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">Debes iniciar sesión para acceder al panel.</p>
        <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Iniciar Sesión
        </a>
      </div>
    </div>;
  }

  // Authenticated - render the client panel which will use client hooks
  return <PanelClient />;
}
