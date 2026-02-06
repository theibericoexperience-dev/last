import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/panel'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const { user } = data;
      // Sync user profile with metadata from social provider (Google)
      try {
        const { upsertUserProfile } = await import('@/lib/db/upsertUserProfile');
        
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const parts = fullName.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        await upsertUserProfile({
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          user_id: user.id
        }, { id: user.id });
        
        console.log(`>>> [AUTH CALLBACK] Profile total sync successful for ${user.email}`);
      } catch (syncError) {
        console.error('>>> [AUTH CALLBACK] Profile sync failed:', syncError);
      }

      // Use the actual origin for redirect
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
