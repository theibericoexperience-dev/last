#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'build', 'open-tours-manifest.json');
const outJson = path.join(root, 'build', 'media-map-report.json');
const outCsv = path.join(root, 'build', 'media-map-report.csv');

function loadManifest() {
  if (!fs.existsSync(manifestPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse manifest:', e.message);
    return [];
  }
}

const manifest = loadManifest();

function walk(dir, cb) {
  const ignore = ['.git', 'node_modules', '.next', 'build', 'dist', 'public/recovered_site'];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (ignore.includes(it.name)) continue;
    if (it.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

const mediaRegex = /\/MEDIAWEB\/[A-Za-z0-9_\- %&.,()\'"\[\]\/\\]+/g;

const results = {};

walk(root, (file) => {
  // only text files
  const ext = path.extname(file).toLowerCase();
  const textExts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.mdx'];
  if (!textExts.includes(ext)) return;
  let s = '';
  try { s = fs.readFileSync(file, 'utf8'); } catch (e) { return; }
  const lines = s.split(/\r?\n/);
  for (let i=0;i<lines.length;i++){
    const line = lines[i];
    const m = line.match(mediaRegex);
    if (m) {
      for (const raw of m) {
        const key = raw.trim();
        if (!results[key]) results[key] = [];
        results[key].push({ file, line: i+1, text: line.trim() });
      }
    }
  }
});

function findManifestFor(mediaPath) {
  // mediaPath starts with /MEDIAWEB/...
  const tail = mediaPath.replace(/^\/MEDIAWEB\//i, '');
  const tailLower = tail.toLowerCase();
  const filename = path.basename(tailLower);

  // try exact-ish match: manifest.path contains tailLower
  const byContain = manifest.filter(e => (e.path || '').toLowerCase().includes(tailLower));
  if (byContain.length) return byContain.map(e => e.url);

  // try match by filename
  const byFilename = manifest.filter(e => (e.name || '').toLowerCase() === filename || e.path.toLowerCase().endsWith('/' + filename));
  if (byFilename.length) return byFilename.map(e => e.url);

  // try by base name without extension
  const base = filename.replace(/\.[^.]+$/, '');
  const byBasename = manifest.filter(e => ((e.name||'').toLowerCase().replace(/\.[^.]+$/, '')) === base || e.path.toLowerCase().includes(base));
  if (byBasename.length) return byBasename.map(e => e.url);

  return null;
}

const mapped = [];

for (const mediaPath of Object.keys(results)){
  const matches = results[mediaPath];
  const urls = findManifestFor(mediaPath);
  mapped.push({ mediaPath, occurrences: matches, manifestUrls: urls });
}

// Check .env* files in root
const envFiles = [];
const rootItems = fs.readdirSync(root);
for (const it of rootItems) {
  if (it.startsWith('.env')) {
    const p = path.join(root, it);
    let val = null;
    try {
      const contents = fs.readFileSync(p, 'utf8');
      const m = contents.match(/^\s*NEXT_PUBLIC_MEDIA_BASE_URL\s*=\s*(.*)$/m);
      if (m) val = m[1].trim();
    } catch (e) {}
    envFiles.push({ file: it, NEXT_PUBLIC_MEDIA_BASE_URL: val });
  }
}

const summary = {
  timestamp: new Date().toISOString(),
  totalDistinctMediaReferences: mapped.length,
  totalOccurrences: Object.values(results).reduce((a,b)=>a+b.length,0),
  envFiles,
  mapped
};

try { fs.mkdirSync(path.join(root,'build'),{ recursive: true }); } catch(e){}
fs.writeFileSync(outJson, JSON.stringify(summary, null, 2), 'utf8');

// CSV: mediaPath, mapped(true/false), firstManifestUrl, occurrencesCount, sampleFile:line
const csvLines = ['mediaPath,mapped,firstManifestUrl,occurrencesCount,sampleLocation,sampleLine,sampleText'];
for (const row of mapped) {
  const mappedFlag = row.manifestUrls ? 'true' : 'false';
  const first = row.manifestUrls ? '"' + row.manifestUrls[0] + '"' : '';
  const occ = row.occurrences.length;
  const sample = row.occurrences[0];
  csvLines.push(`"${row.mediaPath}",${mappedFlag},${first},${occ},"${sample.file}",${sample.line},"${(sample.text||'').replace(/"/g,'""')}"`);
}
fs.writeFileSync(outCsv, csvLines.join('\n'), 'utf8');

console.log('Report written:', outJson);
console.log('CSV written:', outCsv);
console.log('Summary:');
console.log('  distinct /MEDIAWEB refs:', summary.totalDistinctMediaReferences);
console.log('  total occurrences:', summary.totalOccurrences);
console.log('  env files checked:', envFiles.length ? envFiles.map(e=>e.file+'('+ (e.NEXT_PUBLIC_MEDIA_BASE_URL||'') +')').join(', ') : 'none');

// Print a short console sample of up to 20 rows
for (let i=0;i<Math.min(20, mapped.length); i++){
  const r = mapped[i];
  console.log(`\n${r.mediaPath}`);
  console.log('  occurrences:', r.occurrences.length);
  console.log('  sample:', r.occurrences[0].file + ':' + r.occurrences[0].line);
  console.log('  mapped to manifest:', r.manifestUrls ? r.manifestUrls.slice(0,3).join(', ') : 'NO');
}

process.exit(0);
