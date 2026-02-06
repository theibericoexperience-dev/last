import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';
import { supabaseServer } from '@/lib/db/supabaseServer';

type RouteParams = { params: Promise<{ orderId: string }> };

// DELETE /api/orders/[orderId] - delete a draft order belonging to the current user
export async function DELETE(req: Request, { params }: RouteParams) {
  const { orderId } = await params;
  const authUser = await getAuthUserFromRequest(req);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseServer) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

  try {
    // Only allow deleting orders that belong to the user and are in draft status
    const { data: existing, error: fetchErr } = await supabaseServer
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (existing.user_id !== authUser.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (existing.status && existing.status !== 'draft') return NextResponse.json({ error: 'Only draft orders can be deleted' }, { status: 400 });

    const { error: delErr } = await supabaseServer
      .from('orders')
      .delete()
      .eq('id', orderId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
