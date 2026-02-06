import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/db/supabaseServer';

// Upload a local file from the repository to Supabase storage and return a public URL.
// POST /api/attachments/upload
export async function POST(req: Request) {
  if (!supabaseServer) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const BODY = await req.json().catch(() => ({}));
  const srcRelative = BODY?.path || '/public/PUBLIC/Iberico Experience.pptx-1.pdf';

  // Resolve the absolute path in the project workspace root
  const repoRoot = process.cwd();
  // If path starts with /public, we expect it relative to repoRoot
  let absPath = srcRelative;
  if (absPath.startsWith('/public')) absPath = path.join(repoRoot, absPath.replace(/^[\/]/, ''));
  else absPath = path.join(repoRoot, absPath);

  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: 'file_not_found', path: absPath }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(absPath);
    // Choose candidate buckets to try (projects often use different names)
    const candidateBuckets = [process.env.SUPABASE_ATTACHMENTS_BUCKET || 'attachments', 'public', 'public-files', 'uploads'];
    const filename = `reservations/${Date.now()}-${path.basename(absPath).replace(/\s+/g, '_')}`;

    let lastError: any = null;
    let uploadedPath: string | null = null;
    let usedBucket: string | null = null;
    for (const bucket of candidateBuckets) {
      if (!bucket) continue;
      try {
        const { data, error: uploadError } = await supabaseServer.storage.from(bucket).upload(filename, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });
        if (uploadError) {
          lastError = uploadError;
          console.warn(`[attachments/upload] upload to bucket=${bucket} failed:`, uploadError.message || uploadError);
          continue;
        }
        uploadedPath = data?.path || filename;
        usedBucket = bucket;
        break;
      } catch (e: any) {
        lastError = e;
        console.warn(`[attachments/upload] exception uploading to bucket=${bucket}:`, e?.message || e);
        continue;
      }
    }

    if (!uploadedPath || !usedBucket) {
      console.error('[attachments/upload] all candidate buckets failed, lastError=', lastError);
      return NextResponse.json({ error: 'upload_failed', message: lastError?.message || String(lastError), lastError }, { status: 500 });
    }

    // Build a public URL (use createSignedUrl for private buckets if needed)
    const publicRes = supabaseServer.storage.from(usedBucket).getPublicUrl(uploadedPath);
    const publicUrl = publicRes?.data?.publicUrl || null;

    return NextResponse.json({ ok: true, url: publicUrl, path: uploadedPath, bucket: usedBucket });
  } catch (e: any) {
    console.error('[attachments/upload] error', e?.message || e);
    return NextResponse.json({ error: 'internal_error', message: e?.message || String(e) }, { status: 500 });
  }
}
