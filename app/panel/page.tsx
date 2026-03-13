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
    // TEMPORARY DEV BYPASS: allow unauthenticated access to the panel so we can
    // preview and work on the dashboard without signing in. Remove this bypass
    // before deploying to any staging/production environment.
    return <PanelClient />;
  }

  // Authenticated - render the client panel which will use client hooks
  return <PanelClient />;
}
