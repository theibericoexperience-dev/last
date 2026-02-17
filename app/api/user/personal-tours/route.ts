import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

export async function GET(req: Request) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { data: tours, error } = await supabaseServer
    .from('personal_tours')
    .select('*')
    .eq('user_id', authUser.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tours: tours || [] });
}

export async function POST(req: Request) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  
  // Validation
  if (!body.destination_text) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
  }

  // Construct payload from body
  const payload = {
      user_id: authUser.id,
      destination_text: body.destination_text,
      features: Array.isArray(body.features) ? body.features : [],
      extra_comments: body.extra_comments || null,
      party_description: body.party_description || null,
      status: body.status || 'draft',
      budget_range: body.budget_range || null,
      // Handle lat/lng if provided
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      source: 'web',
      locale: body.locale || 'en',
      // For preferred_dates (daterange), assuming Supabase handles string format '[202X-MM-DD,202X-MM-DD)' or simple text/json if re-typed.
      // If the table uses actual `daterange` type, we need to format correctly string like `[start,end)`.
      // Let's assume body.preferred_dates is { start, end } or string.
      // If it's a string, pass it directly. If object, format it.
  };

  if (body.preferred_dates && typeof body.preferred_dates === 'object' && body.preferred_dates.start && body.preferred_dates.end) {
      // Format as Postgres daterange literal
      (payload as any).preferred_dates = `[${body.preferred_dates.start},${body.preferred_dates.end}]`;
  } else if (typeof body.preferred_dates === 'string') {
       (payload as any).preferred_dates = body.preferred_dates;
  }

  const { data, error } = await supabaseServer
    .from('personal_tours')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tour: data });
}
