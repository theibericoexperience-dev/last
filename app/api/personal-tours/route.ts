import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { destination_text, preferred_dates, party_description, features, extra_comments } = body;

    if (!destination_text) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }

    const extraCommentsCompiled = [
      extra_comments ? extra_comments : null,
      preferred_dates ? `Requested dates: ${preferred_dates}` : null
    ].filter(Boolean).join('\n');

    const { data, error } = await supabaseServer
      .from('personal_tours')
      .insert({
        user_id: authUser.id,
        destination_text,
        preferred_dates: null, // Depending on if we use daterange or text, we may skip or format it
        party_description: party_description || preferred_dates, // Store dates in party_description temporarily if needed, wait, let's look at table definition
        features: features || [],
        extra_comments: extraCommentsCompiled,
        status: 'draft',
        source: 'web'
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Personal tour create error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
