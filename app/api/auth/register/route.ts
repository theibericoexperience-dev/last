import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { upsertUserProfile } from '@/lib/db/upsertUserProfile';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // 1. Create user in auth.users using Service Role Key
    // This allows bypass of confirmation if desired, but here we just create it.
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirming for better UX in this specific environment
      user_metadata: { full_name: name }
    });

    if (authError) {
      console.error('>>> [REGISTER API] Auth error:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // 2. Sync with user_profiles IMMEDIATELY
    const fullName = name || '';
    const parts = fullName.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    await upsertUserProfile({
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      user_id: user.id
    }, { id: user.id });

    console.log(`>>> [REGISTER API] Total sync successful for ${user.email}`);

    // 3. Since we used admin.createUser, the user is created but we don't have a session.
    // The client should now sign in with the password to get a real session.
    return NextResponse.json({ success: true, userId: user.id });
  } catch (err: any) {
    console.error('>>> [REGISTER API] Unexpected error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
