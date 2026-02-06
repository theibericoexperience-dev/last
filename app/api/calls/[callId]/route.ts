import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

type RouteParams = { params: Promise<{ callId: string }> };

// PATCH /api/calls/[callId] - update scheduled call (owner only)
export async function PATCH(req: Request, { params }: RouteParams) {
  const { callId } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const userId = authUser.id;
  const body = await req.json().catch(() => ({}));
  const { scheduledAt, topic, notes } = body;

  // Verify ownership
  const { data: existing, error: findErr } = await supabaseServer
    .from('scheduled_calls')
    .select('id')
    .eq('id', callId)
    .eq('user_id', userId)
    .single();

  if (findErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: any = {};
  if (scheduledAt) updates.scheduled_at = scheduledAt;
  if (topic !== undefined) updates.topic = topic?.trim() || null;
  if (notes !== undefined) updates.notes = notes?.trim() || null;

  const { data: updated, error } = await supabaseServer
    .from('scheduled_calls')
    .update(updates)
    .eq('id', callId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalized = {
    id: updated.id,
    scheduled_time: updated.scheduled_at,
    topic: updated.topic,
    status: updated.status,
    meet_link: updated.meet_link,
    created_at: updated.created_at,
  };

  return NextResponse.json({ call: normalized });
}

// DELETE /api/calls/[callId] - cancel call (owner only)
export async function DELETE(req: Request, { params }: RouteParams) {
  const { callId } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const userId = authUser.id;

  // Verify ownership
  const { data: existing, error: findErr } = await supabaseServer
    .from('scheduled_calls')
    .select('id')
    .eq('id', callId)
    .eq('user_id', userId)
    .single();

  if (findErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabaseServer
    .from('scheduled_calls')
    .delete()
    .eq('id', callId)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
