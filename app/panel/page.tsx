import PanelClient from './PanelClient';
import PanelHydrateClient from './PanelHydrateClient';
import { headers } from 'next/headers';
import { supabaseServer } from '@/lib/db/supabaseServer';
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
    // Unauthenticated: render landing / register prompt (server-rendered)
    return (
      <>
        <div id="ibero-landing" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Welcome to IBERO</h1>
            <p className="text-slate-600 mb-8">Create your account to manage reservations, view payments, and access your personalized dashboard.</p>
            <a href="/auth/login" className="w-full inline-flex justify-center bg-slate-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-slate-800 transition-colors">Sign in or Create Account</a>
          </div>
        </div>
        {/* Client-side hydrator: if the browser has a Supabase session (user just logged in),
            the hydrator will render PanelClient on the client so the user sees their panel
            immediately without requiring the server to detect the cookie on first request. */}
        <PanelHydrateClient />
      </>
    );
  }

  // Authenticated - render the client panel which will use client hooks
  return <PanelClient />;
}
