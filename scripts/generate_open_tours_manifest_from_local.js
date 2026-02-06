#!/usr/bin/env node
/**
 * Build open-tours manifest from local copy under public/MEDIAWEB_final_20260126123024/TOURS/Open Tours
 * and generate public urls using NEXT_PUBLIC_SUPABASE_URL and bucket name "Open Tours".
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'public', 'MEDIAWEB_final_20260126123024', 'TOURS', 'Open Tours');
const OUT_DIR = path.join(process.cwd(), 'build');
const OUT_FILE = path.join(OUT_DIR, 'open-tours-manifest.json');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const BUCKET = 'Open Tours';

if (!fs.existsSync(ROOT)) {
  console.error('Local copy not found at', ROOT);
  process.exit(2);
}
if (!SUPABASE_URL) {
  console.error('NEXT_PUBLIC_SUPABASE_URL not set in env (required to build public URLs)');
  process.exit(3);
}

function walk(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const absFiles = walk(ROOT);
const prefix = path.join(process.cwd(), 'public') + path.sep;
const manifest = [];
for (const f of absFiles) {
  const rel = f.substring(prefix.length).replace(/\\\\/g, '/'); // public/TOURS/... path
  // manifest expects path inside bucket without leading 'TOURS/'? The local files are under 'public/MEDIAWEB_final_.../TOURS/Open Tours/...'
  // We will derive bucketPath as the part after 'TOURS/'
  const idx = rel.indexOf('TOURS/');
  if (idx === -1) continue;
  const bucketPath = rel.substring(idx + 'TOURS/'.length);
  const stat = fs.statSync(f);
  const encodedBucket = encodeURIComponent(BUCKET);
  // Supabase public object URL format:
  const base = SUPABASE_URL.replace(/\/$/, '');
  // For safety, encode each path segment
  const segments = bucketPath.split('/').map(s => encodeURIComponent(s)).join('/');
  const url = `${base}/storage/v1/object/public/${encodedBucket}/${segments}`;
  manifest.push({ path: bucketPath, url, name: path.basename(bucketPath), last_modified: stat.mtime.toISOString(), size: stat.size });
}
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');
console.log('Wrote local-derived manifest to', OUT_FILE, 'entries:', manifest.length);
