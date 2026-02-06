import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

function generateId() {
  return 'TKT-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}

// GET /api/support/tickets - List user's tickets
export async function GET(request: Request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = authUser.id;

  // If Supabase is configured, use it
  if (supabaseServer) {
    const { data: tickets, error } = await supabaseServer
      .from('support_tickets')
      .select(`
        *,
        replies:support_ticket_replies(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[tickets] Supabase error:', error.message);
      return NextResponse.json({ tickets: [] });
    }

    return NextResponse.json({ tickets: tickets || [] });
  }

  // Fallback: return empty list
  return NextResponse.json({ tickets: [] });
}

// POST /api/support/tickets - Create new ticket
export async function POST(req: Request) {
  const authUser = await getAuthUserFromRequest(req);
  
  const body = await req.json().catch(() => ({}));
  const { message, subject, orderId, priority } = body;
  
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const userId = (authUser as any)?.id;

  // Validate constraint values
  const validPriorities = ['low', 'normal', 'high', 'urgent'];
  const finalPriority = validPriorities.includes(priority) ? priority : 'normal';

  // If Supabase is configured and user is authenticated, persist
  if (supabaseServer && userId) {
    const { data: ticket, error } = await supabaseServer
      .from('support_tickets')
      .insert({
        user_id: userId,
        order_id: orderId || null,
        subject: subject?.trim() || 'Support Request',
        message: message.trim(),
        priority: finalPriority,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.warn('[tickets] Insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket }, { status: 201 });
  }

  return NextResponse.json({ error: 'Database not available' }, { status: 503 });
}
