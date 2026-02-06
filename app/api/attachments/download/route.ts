import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth/getAuthUserFromRequest';
import { supabaseServer } from '@/lib/db/supabaseServer';

type JsonError = { error: string; message?: string; statusCode?: number; details?: any };

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'unauthorized', message: 'User not authenticated' } as JsonError, { status: 401 });

    if (!supabaseServer) return NextResponse.json({ error: 'server_config', message: 'Supabase server not configured' } as JsonError, { status: 500 });

  // Use bucket/path from environment (fallbacks match real storage values)
  const filename = process.env.ATTACHMENT_ITINERARY_PATH || 'Iberico Experience.pptx-1_compressed.pdf';
  const bucket = process.env.SUPABASE_ATTACHMENTS_BUCKET || 'pdf-prueba';

  // Generate a signed URL for 30 minutes (1800 seconds)
  const expiresIn = 1800;

  console.log('[attachments/download]', { bucket, path: filename });
    const { data, error } = await supabaseServer.storage.from(bucket).createSignedUrl(filename, expiresIn);
    if (error) {
      console.error('[attachments/download] createSignedUrl error', error);
      return NextResponse.json({ error: 'signed_url_failed', message: error.message || 'Failed to create signed URL', details: error } as JsonError, { status: 500 });
    }

  const signedUrl = (data && ((data as any).signedUrl || (data as any).signedURL)) || null;
    if (!signedUrl) {
      return NextResponse.json({ error: 'no_url', message: 'Signed URL not available' } as JsonError, { status: 500 });
    }

    return NextResponse.json({ url: signedUrl });
  } catch (e: any) {
    console.error('[attachments/download] unexpected error', e);
    return NextResponse.json({ error: 'internal', message: e?.message || String(e), details: e } as JsonError, { status: 500 });
  }
}
