import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';

// GET /api/bonuses - Get user's bonus balance and history
export async function GET(request: Request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser || !authUser.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = authUser.id;

  if (!supabaseServer) {
    // Return mock data if DB not configured
    return NextResponse.json({
      balance: 0,
      bonuses: [],
      referralCode: `IBERO-${userId.slice(0, 6).toUpperCase()}`,
    });
  }

  const { data: bonuses, error } = await supabaseServer
    .from('user_bonuses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[bonuses] Error:', error.message);
    return NextResponse.json({
      balance: 0,
      bonuses: [],
      referralCode: `IBERO-${userId.slice(0, 6).toUpperCase()}`,
    });
  }

  // Calculate active balance (in cents, convert to dollars)
  const activeBalance = (bonuses || [])
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  return NextResponse.json({
    balance: activeBalance / 100, // Convert cents to dollars
    bonuses: bonuses || [],
    referralCode: `IBERO-${userId.slice(0, 6).toUpperCase()}`,
  });
}
