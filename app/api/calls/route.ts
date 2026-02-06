import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

// GET /api/calls - List user's scheduled calls
export async function GET(request: Request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser || !authUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = authUser.id;

  if (!supabaseServer) {
    return NextResponse.json({ calls: [] });
  }

  const { data: calls, error } = await supabaseServer
    .from('scheduled_calls')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.warn('[calls] Error:', error.message);
    return NextResponse.json({ calls: [] });
  }

  // Normalize returned keys for the frontend (scheduled_time)
  const normalized = (calls || []).map((c: any) => ({
    id: c.id,
    scheduled_time: c.scheduled_at, // Schema uses scheduled_at
    topic: c.topic || null,
    status: c.status || 'pending',
    meet_link: c.meet_link || null,
    created_at: c.created_at || null,
  }));

  return NextResponse.json({ calls: normalized });
}

// POST /api/calls - Schedule a new call
export async function POST(req: Request) {
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = authUser.id;
  const body = await req.json().catch(() => ({}));
  const { scheduledAt, timezone, topic, notes, orderId } = body;

  if (!scheduledAt) {
    return NextResponse.json({ error: 'Scheduled date/time is required' }, { status: 400 });
  }

  // Validate date is in the future
  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) {
    return NextResponse.json({ error: 'Please select a future date and time' }, { status: 400 });
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  // Use a simulated google meet link for now, until we integrate with Calendar API or similar
  const meetLink = `https://meet.google.com/ibero-${Math.random().toString(36).slice(2, 8)}`;

  const { data: call, error } = await supabaseServer
    .from('scheduled_calls')
    .insert({
      user_id: userId,
      order_id: orderId || null,
      scheduled_at: scheduledAt,
      timezone: timezone || 'UTC',
      topic: topic?.trim() || null,
      notes: notes?.trim() || null,
      meet_link: meetLink,
      status: 'pending', // Use 'pending' as per schema default
      duration_minutes: 30 // Default as per schema
    })
    .select()
    .single();

  if (error) {
    console.error('[calls] Insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = call ? {
    id: call.id,
    scheduled_time: call.scheduled_at,
    topic: call.topic,
    status: call.status,
    meet_link: call.meet_link,
    created_at: call.created_at,
  } : null;

  return NextResponse.json({ call: normalized }, { status: 201 });
}
