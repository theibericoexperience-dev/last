#!/usr/bin/env node
/**
 * Apply replacements in the repo for TOURS/mediacards/* and TOURS/2026/MADRID TO LISBOA/**
 * using the build/open-tours-manifest.json created earlier.
 * Produces a git branch 'open-tours-media-migration' with changes.
 */
const fs = require('fs');
const path = require('path');
const child = require('child_process');

const MANIFEST = path.join(process.cwd(), 'build', 'open-tours-manifest.json');
if (!fs.existsSync(MANIFEST)) {
  console.error('Manifest not found at', MANIFEST);
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/madrid.webp'No mediacards or MADRID TO LISBOA entries found in manifest');
  process.exit(0);
}

const exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html'];
function walk(dir) {
  const out = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (['node_modules', '.git', 'build', '.next', 'out', 'dist'].includes(it.name)) continue;
      out.push(...walk(p));
    } else {
      if (exts.includes(path.extname(it.name))) out.push(p);
    }
  }
  return out;
}

const files = walk(process.cwd());
const changes = [];
const replacementsReport = [];

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  let modified = src;
  let fileReplacements = [];
  for (const t of targets) {
    // Normalize manifest path variants
    let withoutBucket = t.path.replace(/^Open Tours\//i, '');
    withoutBucket = withoutBucket.replace(/^TOURS\//i, '');
    const basename = path.basename(withoutBucket);
    const baseNoExt = path.basename(withoutBucket, path.extname(withoutBucket));
    const escBasename = basename.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const escBaseNoExt = baseNoExt.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

    // Build a permissive regex to match quoted strings that reference the same logical file
    // Accept variants like:
    // - 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/madrid.webp'
    // - 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/activities/1welcome.webp'
    // - 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/MAIN%20TOUR/hero.webp'
    const pattern = "(['\"`])([^'\"`]*?(?:MADRID TO LISBOA|/MEDIAWEB/TOURS/2026/MADRID TO LISBOA|2026/MADRID TO LISBOA|mediacards)[^'\"`]*?" + escBaseNoExt + "(?:\\.[a-z0-9]{1,6})?[^'\"`]*)\\1";
    const re = new RegExp(pattern, 'gi');

    modified = modified.replace(re, (m, q, inner) => {
      // record this replacement for reporting
      fileReplacements.push({ original: m, replacement: q + t.url + q, url: t.url });
      return q + t.url + q;
    });

    // Also handle the simple relative case like 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/madrid.webp' where basename with ext matches
    const simplePattern = "(['\"`])([^'\"`]*?mediacards[^'\"`]*?" + escBasename + "[^'\"`]*)\\1";
    const simpleRe = new RegExp(simplePattern, 'gi');
    modified = modified.replace(simpleRe, (m, q, inner) => {
      fileReplacements.push({ original: m, replacement: q + t.url + q, url: t.url });
      return q + t.url + q;
    });
  }
  if (fileReplacements.length > 0 && modified !== src) {
    changes.push({ file, before: src, after: modified, replacements: fileReplacements });
    for (const r of fileReplacements) replacementsReport.push({ file, original: r.original, replacement: r.replacement, url: r.url });
  }
}

if (changes.length === 0) {
  console.log('No replacements to apply');
  process.exit(0);
}

const branch = 'open-tours-media-migration';
try {
  // If branch exists, checkout it; otherwise create it
  child.execSync('git rev-parse --verify ' + branch + ' >/dev/null 2>&1');
  child.execSync('git checkout ' + branch, { stdio: 'inherit' });
} catch (e) {
  child.execSync('git checkout -b ' + branch, { stdio: 'inherit' });
}


const addedFiles = [];
const failedAdds = [];
for (const c of changes) {
  fs.writeFileSync(c.file, c.after, 'utf8');
  try {
    child.execSync('git add ' + JSON.stringify(c.file));
    addedFiles.push(c.file);
  } catch (e) {
    failedAdds.push({ file: c.file, error: String(e) });
    // continue applying other files
  }
}
if (addedFiles.length === 0) {
  console.error('No files were added to git (all adds failed). Aborting commit.');
  if (failedAdds.length) {
    console.error('Failed adds:', failedAdds.map(f => f.file).join(', '));
  }
  process.exit(1);
}
child.execSync('git commit -m "https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/madrid.webp"', { stdio: 'inherit' });

// Write reports
const reportList = changes.map(c => c.file).join('\n');
fs.writeFileSync(path.join(process.cwd(), 'build', 'open-tours-replacements.txt'), reportList, 'utf8');

const csvLines = ['file,original,replacement,url'];
for (const r of replacementsReport) {
  // escape quotes
  const escOrig = r.original.replace(/"/g, '""');
  const escRep = r.replacement.replace(/"/g, '""');
  csvLines.push(`${r.file},"${escOrig}","${escRep}",${r.url}`);
}
fs.writeFileSync(path.join(process.cwd(), 'build', 'open-tours-replacements-report.csv'), csvLines.join('\n'), 'utf8');

console.log('Applied', changes.length, 'file changes, committed on branch', branch, 'report at build/open-tours-replacements.txt and build/open-tours-replacements-report.csv');
