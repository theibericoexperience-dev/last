#!/usr/bin/env node
/**
 * 🎯 SURGICAL TOURS MEDIA MIGRATION TO SUPABASE
 * 
 * SCOPE: ONLY TOURS media (mediacards + Open Tours content)
 * DOES NOT TOUCH: LANDING, BEHIND, or other public media
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting TOURS media migration to Supabase...\n');

// Load manifest (source of truth)
const manifestPath = path.resolve('build/open-tours-manifest-from-supabase.json');
console.log('📁 Looking for manifest at:', manifestPath);

if (!fs.existsSync(manifestPath)) {
  console.error('❌ Manifest not found:', manifestPath);
  console.error('Run: node scripts/generate_tours_manifest_recursive.js');
  process.exit(1);
}

console.log('✅ Manifest file found');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log('✅ Loaded manifest with', manifest.length, 'entries\n');

// Build lookup index
const pathIndex = new Map();
manifest.forEach(entry => {
  // Index by full path
  pathIndex.set(entry.path, entry.publicUrl);
  
  // Also index by filename alone for simple lookups
  const filename = entry.path.split('/').pop();
  if (!pathIndex.has(filename)) {
    pathIndex.set(filename, entry.publicUrl);
  }
});

console.log('📚 Path index built with', pathIndex.size, 'keys\n');

/**
 * MEDIACARD MAPPING
 * Old "mediacards/" concept → actual location in Supabase
 */
const MEDIACARD_MAPPING = {
  'mediacards/madrid.jpg': 'Open Tours/MADRID TO LISBOA/madrid.webp',
  'mediacards/madrid.webp': 'Open Tours/MADRID TO LISBOA/madrid.webp',
  'mediacards/porto.jpg': 'Open Tours/PORTO & GALICIA/porto.webp',
  'mediacards/porto.webp': 'Open Tours/PORTO & GALICIA/porto.webp',
  'mediacards/laos.jpg': 'Open Tours/LAOS & VIETNAM/laos.webp',
  'mediacards/laos.webp': 'Open Tours/LAOS & VIETNAM/laos.webp',
  'mediacards/australia.jpg': 'Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
  'mediacards/australia.webp': 'Open Tours/NEW ZEALAND & AUSTRALIA/australia.webp',
  'mediacards/lofotensummer.webp': 'Open Tours/lofoten/lofotensummer.webp',
  'mediacards/lofotenwinter.webp': 'Open Tours/lofoten/lofotenwinter.webp',
};

/**
 * TOUR-SPECIFIC PATH MAPPING
 * Old relative paths → actual location in Supabase
 */
const TOUR_PATH_MAPPING = {
  '2026/MADRID TO LISBOA/MAIN TOUR/hero.jpg': 'Open Tours/MADRID TO LISBOA/MAIN TOUR/hero.webp',
  '2026/MADRID TO LISBOA/MAIN TOUR/hero.webp': 'Open Tours/MADRID TO LISBOA/MAIN TOUR/hero.webp',
  '2026/MADRID TO LISBOA/MAIN TOUR/madrid_tourcard.webp': 'Open Tours/MADRID TO LISBOA/MAIN TOUR/madrid_tourcard.webp',
  '2026/MADRID TO LISBOA/MAIN TOUR/stops': 'Open Tours/MADRID TO LISBOA/MAIN TOUR/stops',
};

/**
 * Resolve a path to its Supabase URL
 */
function resolveToSupabaseUrl(localPath) {
  // Strip leading slashes and /MEDIAWEB/TOURS/
  let normalized = localPath
    .replace(/^\/+/, '')
    .replace(/^MEDIAWEB\/TOURS\//, '')
    .replace(/^TOURS\//, '');
  
  // Check mediacard mapping
  if (MEDIACARD_MAPPING[normalized]) {
    const supabasePath = MEDIACARD_MAPPING[normalized];
    const url = pathIndex.get(supabasePath);
    if (url) return url;
  }
  
  // Check tour path mapping
  if (TOUR_PATH_MAPPING[normalized]) {
    const supabasePath = TOUR_PATH_MAPPING[normalized];
    const url = pathIndex.get(supabasePath);
    if (url) return url;
  }
  
  // Try direct lookup
  const url = pathIndex.get(normalized);
  if (url) return url;
  
  // Try with Open Tours prefix
  const withPrefix = `Open Tours/${normalized}`;
  const urlWithPrefix = pathIndex.get(withPrefix);
  if (urlWithPrefix) return urlWithPrefix;
  
  return null;
}

/**
 * FILES TO PROCESS (TOURS-RELATED ONLY)
 */
const FILES_TO_PROCESS = [
  'data/toursOverview.ts',
  'components/TourGrid.tsx',
  'app/tour/TourClient.tsx',
];

const replacements = [];
const errors = [];

for (const relPath of FILES_TO_PROCESS) {
  const filePath = path.resolve(relPath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping (not found): ${relPath}`);
    continue;
  }
  
  console.log(`\n🔍 Processing: ${relPath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern 1: mediacards/xxx
  const mediacardPattern = /(['"`])(mediacards\/[^'"` ]+?\.(jpg|webp|png))(['"`])/g;
  content = content.replace(mediacardPattern, (match, q1, path, ext, q2) => {
    const url = resolveToSupabaseUrl(path);
    if (url) {
      replacements.push({ file: relPath, from: path, to: url });
      console.log(`  ✅ ${path} → ${url.substring(0, 80)}...`);
      modified = true;
      return `${q1}${url}${q2}`;
    } else {
      errors.push({ file: relPath, path, reason: 'No Supabase URL found' });
      console.log(`  ❌ ${path} → NOT FOUND IN MANIFEST`);
      return match;
    }
  });
  
  // Pattern 2: 2026/MADRID TO LISBOA/xxx or /MEDIAWEB/TOURS/2026/xxx
  const tourPathPattern = /(['"`])((?:\/MEDIAWEB\/TOURS\/)?(?:2026\/)?MADRID TO LISBOA\/[^'"` ]+?\.(jpg|webp|png))(['"`])/g;
  content = content.replace(tourPathPattern, (match, q1, path, ext, q2) => {
    const url = resolveToSupabaseUrl(path);
    if (url) {
      replacements.push({ file: relPath, from: path, to: url });
      console.log(`  ✅ ${path} → ${url.substring(0, 80)}...`);
      modified = true;
      return `${q1}${url}${q2}`;
    } else {
      errors.push({ file: relPath, path, reason: 'No Supabase URL found' });
      console.log(`  ❌ ${path} → NOT FOUND IN MANIFEST`);
      return match;
    }
  });
  
  // Pattern 3: stopsPath references
  const stopsPattern = /stopsPath:\s*(['"`])([^'"` ]*MADRID TO LISBOA[^'"` ]*)(['"`])/g;
  content = content.replace(stopsPattern, (match, q1, path, q2) => {
    // For stopsPath, we want to point to the Supabase folder
    // Example: '2026/MADRID TO LISBOA/MAIN TOUR/stops' → 'Open Tours/MADRID TO LISBOA/MAIN TOUR/stops'
    const normalized = path.replace(/^\/+/, '').replace(/^MEDIAWEB\/TOURS\//, '').replace(/^2026\//, '');
    const supabasePath = `Open Tours/${normalized}`;
    console.log(`  📁 stopsPath: ${path} → ${supabasePath}`);
    modified = true;
    return `stopsPath: ${q1}${supabasePath}${q2}`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Saved changes to ${relPath}`);
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 MIGRATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Total replacements: ${replacements.length}`);
console.log(`❌ Total errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(e => {
    console.log(`  ${e.file}: ${e.path} - ${e.reason}`);
  });
}

// Save report
const reportPath = path.resolve('build/tours-media-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  replacements,
  errors,
  summary: {
    filesProcessed: FILES_TO_PROCESS.length,
    replacementsMade: replacements.length,
    errorCount: errors.length
  }
}, null, 2));

console.log(`\n💾 Report saved to: ${reportPath}`);
console.log('\n✅ MIGRATION COMPLETE!');
console.log('\n🎯 NEXT STEPS:');
console.log('1. Test the tour pages locally');
console.log('2. Verify all images load from Supabase');
console.log('3. Commit changes with: git add -A && git commit -m "feat: migrate TOURS media to Supabase"');
