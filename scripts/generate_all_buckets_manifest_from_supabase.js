// scripts/generate_all_buckets_manifest_from_supabase.js
// Requirements:
// - Node 18+
// - npm install @supabase/supabase-js dotenv
// - .env.local must contain SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
//
// Output:
// - build/supabase-storage-manifest.json

import fs from 'fs';
import path from 'path';
import process from 'node:process';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const OUT_DIR = path.join(process.cwd(), 'build');
const OUT_FILE = path.join(OUT_DIR, 'supabase-storage-manifest.json');
const PAGE_SIZE = 500;

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function buildPublicUrl(supabaseUrl, bucketName, objectPath) {
  const base = supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/public';
  const bucketEncoded = encodeURIComponent(bucketName);
  // split by '/', encode each segment, join with '/'
  const segments = objectPath.split('/').map(seg => encodeURIComponent(seg));
  const encodedPath = segments.join('/');
  return `${base}/${bucketEncoded}/${encodedPath}`;
}

async function listAllObjectsInBucket(supabase, bucket) {
  let all = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error) throw error;
    if (!data || data.length === 0) break;

    // The SDK returns both files and folders. We'll process files and queue folders for recursion.
    const files = data.filter(i => i.id !== null);
    const folders = data.filter(i => i.id === null).map(f => f.name);
    console.log(` - list('') found ${files.length} files and ${folders.length} folders`);

    all = all.concat(files);

    // recursively list each folder
    for (const folder of folders) {
      const nested = await listObjectsWithPrefix(supabase, bucket, folder);
      all = all.concat(nested);
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // de-duplicate by name
  const map = new Map();
  for (const item of all) map.set(item.name, item);
  return Array.from(map.values());
}

async function listObjectsWithPrefix(supabase, bucket, prefix) {
  let all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });
    if (error) throw error;
    if (!data || data.length === 0) break;

    const files = data.filter(i => i.id !== null);
    const folders = data.filter(i => i.id === null).map(f => f.name);

    all = all.concat(
      files.map(f => {
        // For folder listings, the returned name may be full path or relative depending on API; ensure we return full path.
        return { ...f, name: f.name.startsWith(prefix) ? f.name : `${prefix}/${f.name}`.replace(/\/+/g, '/') };
      })
    );

    for (const folder of folders) {
      // Ensure folder path is full
      const folderPath = folder.startsWith(prefix) ? folder : `${prefix}/${folder}`.replace(/\/+/g, '/');
      const nested = await listObjectsWithPrefix(supabase, bucket, folderPath);
      all = all.concat(nested);
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const map = new Map();
  for (const item of all) map.set(item.name, item);
  return Array.from(map.values());
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  ensureOutDir();

  try {
    // list buckets
    const { data: bucketsList, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;
    if (!bucketsList || bucketsList.length === 0) {
      console.log('No buckets found.');
      fs.writeFileSync(OUT_FILE, JSON.stringify({ generated_at: new Date().toISOString(), buckets: {} }, null, 2));
      process.exit(0);
    }

    const manifest = {
      generated_at: new Date().toISOString(),
      project_ref: SUPABASE_URL.replace(/^https?:\/\/ /, '').replace(/\/$/, ''),
      buckets: {}
    };

    for (const b of bucketsList) {
      const bucketName = b.name;
      console.log(`Listing bucket: ${bucketName}`);
      const objects = await listAllObjectsInBucket(supabase, bucketName);
      const files = objects.filter(o => o.id !== null);
      const items = files.map(f => {
        return {
          path: f.name,
          publicUrl: buildPublicUrl(SUPABASE_URL, bucketName, f.name),
          metadata: {
            size: f.size ?? null,
            updated_at: f.updated_at ?? null,
            created_at: f.created_at ?? null,
            content_type: f.content_type ?? null
          }
        };
      });
      manifest.buckets[bucketName] = items;
      console.log(` - ${items.length} files`);
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`Manifest written to ${OUT_FILE}`);
  } catch (err) {
    console.error('Error generating manifest:', err);
    process.exit(1);
  }
}

main();
