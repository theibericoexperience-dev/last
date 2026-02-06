import { NextResponse } from 'next/server';
import { supabaseHealthCheck, supabaseServer } from '@/lib/db/supabaseServer';

export async function GET() {
	const url = (process.env.SUPABASE_URL as string | undefined) || (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined);
	const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

	const health = await supabaseHealthCheck();

	return NextResponse.json({
		urlPresent: !!url,
		hasServiceKey,
		clientCreated: !!supabaseServer,
		health,
	});
}
