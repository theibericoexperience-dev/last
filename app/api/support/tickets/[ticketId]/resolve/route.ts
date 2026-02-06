import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

type RouteParams = { params: Promise<{ ticketId: string }> };

// PATCH /api/support/tickets/[ticketId]/resolve - delete conversation (user-only)
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { ticketId } = await params;
    const authUser = await getAuthUserFromRequest(req);
    if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!supabaseServer) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const userId = authUser.id;

    console.log('[support/resolve] user:', userId, 'ticket:', ticketId);

    // Verify ticket belongs to user
    const { data: ticket, error: ticketError } = await supabaseServer
      .from('support_tickets')
      .select('id')
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single();

    if (ticketError || !ticket) {
      console.warn('[support/resolve] ticket not found or not owned by user', ticketError?.message);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Update status to closed
    const { error: updateError } = await supabaseServer
      .from('support_tickets')
      .update({ status: 'closed' })
      .eq('id', ticketId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('[support/resolve] failed updating ticket status', updateError.message);
      return NextResponse.json({ error: 'update_failed', message: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[support/resolve] unexpected', e);
    return NextResponse.json({ error: 'internal', message: e?.message || String(e) }, { status: 500 });
  }
}
