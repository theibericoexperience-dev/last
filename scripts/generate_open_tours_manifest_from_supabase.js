#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function listAll(bucket, prefix) {
  const items = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await supabase.storage.from(bucket).list(prefix, { limit, offset });
    if (res.error) {
      throw res.error;
    }
    const data = res.data || [];
    for (const entry of data) {
      // supabase returns folders as entries without '.' in name and with no metadata
      if (entry.name.endsWith('/')) continue;
      // If the entry represents a folder (no dot and metadata null) we still want to list it by recursing
      if (!entry.name.includes('.')) {
        // push as prefix to be recursed
        items.push({ type: 'prefix', name: entry.name });
      } else {
        items.push({ type: 'file', name: entry.name, metadata: entry.metadata });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return items;
}

async function walkBucket(bucket, rootPrefix) {
  const manifest = [];

  // Start by listing the rootPrefix to get top-level folders and files
  const top = await supabase.storage.from(bucket).list(rootPrefix, { limit: 1000 });
  if (top.error) throw top.error;
  const entries = top.data || [];

  // We'll treat each folder entry as a prefix to walk
  const prefixes = [];
  for (const e of entries) {
    if (!e.name.includes('.')) {
      // folder-like
      prefixes.push(rootPrefix + '/' + e.name);
    } else {
      manifest.push({ path: e.name, publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURI(e.name)}`, metadata: e.metadata });
    }
  }

  // Recurse into found prefixes
  for (const p of prefixes) {
    // list files directly under this prefix
    let offset = 0;
    const limit = 1000;
    while (true) {
      const res = await supabase.storage.from(bucket).list(p, { limit, offset });
      if (res.error) throw res.error;
      const data = res.data || [];
      for (const entry of data) {
        if (!entry.name.includes('.')) {
          // nested folder -> add to queue
          prefixes.push(p + '/' + entry.name);
        } else {
          manifest.push({ path: entry.name, publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURI(entry.name)}`, metadata: entry.metadata });
        }
      }
      if (data.length < limit) break;
      offset += limit;
    }
  }

  return manifest;
}

(async () => {
  try {
    const bucket = 'Tours';
    const rootPrefix = 'Open Tours';
    console.log('Listing top-level under', bucket, '/', rootPrefix);
    const manifest = await walkBucket(bucket, rootPrefix);
    const outDir = path.resolve('build');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'open-tours-manifest-from-supabase.json');
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
    console.log('Wrote manifest with', manifest.length, 'entries to', outPath);
    if (manifest.length > 0) console.log('Sample:', manifest.slice(0, 10));
  } catch (err) {
    console.error('Error generating manifest:', err.message || err);
    process.exit(1);
  }
})();
