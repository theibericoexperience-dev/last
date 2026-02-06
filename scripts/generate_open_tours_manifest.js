#!/usr/bin/env node
/**
 * Generate a manifest for Supabase storage bucket "Open Tours" and write to build/open-tours-manifest.json
 * Requires env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 * Usage: node scripts/generate_open_tours_manifest.js
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

(async function main(){
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
      process.exit(2);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const bucket = 'Open Tours';
    console.log('Listing objects for bucket:', bucket);

    // Try to list all objects in one large request (supabase supports limit up to ???). If the bucket is big we can paginate.
    const manifest = [];
    const limit = 10000;
    let offset = 0;
    while (true) {
      const res = await supabase.storage.from(bucket).list('', { limit, offset });
      if (res.error) {
        console.error('Supabase storage.list error:', res.error.message || res.error);
        process.exit(3);
      }
      const items = res.data || [];
      for (const it of items) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(it.name);
        manifest.push({ path: it.name, url: urlData?.publicUrl || urlData?.publicURL || null, name: path.basename(it.name), last_modified: it.updated_at || it.created_at || null, size: it.size || null });
      }
      if (items.length < limit) break;
      offset += items.length;
    }

    const outDir = path.join(process.cwd(), 'build');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'open-tours-manifest.json');
    fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('Wrote manifest to', outFile, 'entries:', manifest.length);
  } catch (err) {
    console.error('Failed to generate manifest:', err && (err.message || err));
    process.exit(4);
  }
})();
