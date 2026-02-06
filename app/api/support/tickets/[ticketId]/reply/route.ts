import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

type RouteParams = { params: Promise<{ ticketId: string }> };

// POST /api/support/tickets/[ticketId]/reply - Add reply to ticket
export async function POST(
  req: Request,
  { params }: RouteParams
) {
  const { ticketId } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const userId = authUser.id;
  const body = await req.json().catch(() => ({}));
  const { message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // Verify ticket belongs to user
  const { data: ticket, error: ticketError } = await supabaseServer
    .from('support_tickets')
    .select('id')
    .eq('id', ticketId)
    .eq('user_id', userId)
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  // Insert reply
  const { data: reply, error } = await supabaseServer
    .from('support_ticket_replies')
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      message: message.trim(),
      is_staff: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update ticket updated_at
  await supabaseServer
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  return NextResponse.json({ reply }, { status: 201 });
}
