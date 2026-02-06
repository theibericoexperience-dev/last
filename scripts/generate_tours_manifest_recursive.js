#!/usr/bin/env node
/**
 * Generate a complete manifest from Supabase Storage bucket 'Tours'
 * Walks recursively through all prefixes and captures full paths
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve('.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { 
  auth: { persistSession: false } 
});

const BUCKET = 'Tours';
const manifest = [];

/**
 * Recursively list all objects in a bucket prefix
 */
async function listRecursive(prefix = '', depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}📂 Listing: ${prefix || '(root)'}`);
  
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit, offset });
    
    if (error) {
      console.error(`${indent}❌ Error listing ${prefix}:`, error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    for (const entry of data) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      
      // Check if it's a folder (no extension or metadata indicates folder)
      const isFolder = !entry.name.includes('.') || entry.metadata === null;
      
      if (isFolder && !entry.name.endsWith('/')) {
        // It's a folder, recurse into it
        console.log(`${indent}  📁 ${entry.name}/`);
        await listRecursive(fullPath, depth + 1);
      } else {
        // It's a file
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fullPath}`;
        manifest.push({
          path: fullPath,
          publicUrl,
          name: entry.name,
          metadata: entry.metadata
        });
        console.log(`${indent}  📄 ${entry.name}`);
      }
    }
    
    if (data.length < limit) break;
    offset += limit;
  }
}

(async () => {
  try {
    console.log('🚀 Starting recursive manifest generation...');
    console.log(`📦 Bucket: ${BUCKET}`);
    console.log(`🔗 Base URL: ${SUPABASE_URL}\n`);
    
    await listRecursive();
    
    // Sort by path for readability
    manifest.sort((a, b) => a.path.localeCompare(b.path));
    
    const outDir = path.resolve('build');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const outPath = path.join(outDir, 'open-tours-manifest-from-supabase.json');
    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
    
    console.log('\n✅ Manifest generated successfully!');
    console.log(`📊 Total entries: ${manifest.length}`);
    console.log(`💾 Saved to: ${outPath}`);
    
    // Show breakdown by folder
    const folders = {};
    manifest.forEach(e => {
      const parts = e.path.split('/');
      const folder = parts.length > 1 ? parts[0] : '(root)';
      folders[folder] = (folders[folder] || 0) + 1;
    });
    
    console.log('\n📁 Breakdown by folder:');
    Object.entries(folders)
      .sort((a, b) => b[1] - a[1])
      .forEach(([folder, count]) => {
        console.log(`  ${folder}: ${count} files`);
      });
    
  } catch (err) {
    console.error('💥 Fatal error:', err.message || err);
    process.exit(1);
  }
})();
