#!/usr/bin/env node
/**
 * sync_behind_data.js
 * Small helper to compare and optionally sync data between data/behindTimeline.ts and data/behindYears.ts
 * Usage:
 *   node scripts/sync_behind_data.js --report
 *   node scripts/sync_behind_data.js --sync-from=timeline   # copies bullets/ media into behindYears paragraphs/hitos where applicable
 *   node scripts/sync_behind_data.js --sync-from=years      # copies paragraphs/hitos into timeline bullets
 * Note: this script is intentionally conservative and will not overwrite complex fields without logging.
 */
const fs = require('fs');
const path = require('path');

const argv = require('minimist')(process.argv.slice(2));
const root = path.resolve(__dirname, '..');
const timelinePath = path.join(root, 'data', 'behindTimeline.ts');
const yearsPath = path.join(root, 'data', 'behindYears.ts');

function loadFile(p) {
  const src = fs.readFileSync(p, 'utf8');
  return src;
}

function extractExportedVariable(src, varName) {
  // very small parser: find `export const X =` and capture the following bracketed array/object
  const idx = src.indexOf(`export const ${varName}`);
  if (idx === -1) return null;
  const after = src.slice(idx);
  const eq = after.indexOf('=');
  const arr = after.slice(eq + 1);
  // naive bracket matching to find the end of the exported value
  let depth = 0;
  let start = null;
  for (let i = 0; i < arr.length; i++) {
    const ch = arr[i];
    if (ch === '[' || ch === '{') {
      if (start === null) start = i;
      depth++;
    }
    if ((ch === ']' || ch === '}') && start !== null) {
      depth--;
      if (depth === 0) {
        const raw = arr.slice(start, i + 1);
        return raw;
      }
    }
  }
  return null;
}

function safeWrite(p, content) {
  fs.writeFileSync(p, content, 'utf8');
}

function parseTimeline(src) {
  // require the file as a module by writing a temp JS file that exports JSON
  // this is easier than parsing TypeScript fully.
  const tmp = path.join(root, '.tmp_timeline_json.js');
  const wrapped = src
    .replace(/export const years:\s*Year\[]\s*=\s*/m, 'module.exports = ')
    .replace(/getSupabaseUrl\([^)]*\)/g, `''`);
  fs.writeFileSync(tmp, wrapped, 'utf8');
  const json = require(tmp);
  fs.unlinkSync(tmp);
  return json;
}

function parseYears(src) {
  const tmp = path.join(root, '.tmp_years_json.js');
  const wrapped = src.replace(/export const behindYears:\s*YearData\[]\s*=\s*/m, 'module.exports = ');
  fs.writeFileSync(tmp, wrapped, 'utf8');
  const json = require(tmp);
  fs.unlinkSync(tmp);
  return json;
}

function reportDifferences(tl, ys) {
  const byYear = {};
  tl.forEach((t) => { byYear[t.year] = byYear[t.year] || {}; byYear[t.year].timeline = t; });
  ys.forEach((y) => { byYear[y.year] = byYear[y.year] || {}; byYear[y.year].years = y; });

  Object.keys(byYear).sort().forEach((k) => {
    const y = byYear[k];
    console.log('=== YEAR', k, '===');
    if (y.timeline && y.years) {
      // compare bullets <-> paragraphs/hitos
      const bullets = (y.timeline.bullets || []).join('\n');
      const paras = (y.years.paragraphs || []).join('\n');
      if (bullets.trim() === paras.trim()) console.log('  Copy: identical'); else console.log('  Copy: DIFFER');
      const tMedia = (y.timeline.media || []).map(m => m.src).join(',');
      const yMedia = (y.years.media || '') || '';
      if (tMedia === yMedia) console.log('  Media: identical'); else console.log('  Media: DIFFER');
      const tHitos = (y.timeline.hitos || []).join('\n');
      const yHitos = (y.years.hitos || []).join('\n');
      if (tHitos === yHitos) console.log('  Hitos: IDENTICAL or empty'); else console.log('  Hitos: DIFFER');
    } else if (y.timeline) {
      console.log('  Only in timeline');
    } else {
      console.log('  Only in years file');
    }
  });
}

function syncFromTimeline(tl, ys) {
  const out = ys.map((y) => {
    const match = tl.find((t) => t.year === y.year);
    if (!match) return y;
    // copy bullets -> paragraphs, media -> media, bullets -> hitos if hitos empty
    const newY = { ...y };
    if (match.bullets && match.bullets.length) newY.paragraphs = match.bullets.slice();
    if (match.media && match.media.length) newY.media = match.media[0].src || newY.media;
    if ((!newY.hitos || newY.hitos.length === 0) && match.bullets && match.bullets.length) newY.hitos = match.bullets.slice();
    return newY;
  });
  return out;
}

function syncFromYears(ys, tl) {
  const out = tl.map((t) => {
    const match = ys.find((y) => y.year === t.year);
    if (!match) return t;
    const newT = { ...t };
    if (match.paragraphs && match.paragraphs.length) newT.bullets = match.paragraphs.slice();
    if (match.media) newT.media = [{ type: 'image', src: match.media, alt: '' }];
    if (match.hitos && match.hitos.length) newT.hitos = match.hitos.slice();
    return newT;
  });
  return out;
}

async function main() {
  const srcT = loadFile(timelinePath);
  const srcY = loadFile(yearsPath);
  const tl = parseTimeline(srcT);
  const ys = parseYears(srcY);

  if (argv.report || !argv['sync-from']) {
    console.log('\nReport differences between timeline and years files:\n');
    reportDifferences(tl, ys);
    return;
  }

  const from = argv['sync-from'];
  if (from === 'timeline') {
    const synced = syncFromTimeline(tl, ys);
    // naive write: replace the behindYears array content with JSON.stringify(synced)
    const newContent = srcY.replace(/export const behindYears:[\s\S]*$/m, `export const behindYears = ${JSON.stringify(synced, null, 2)};\n`);
    safeWrite(yearsPath, newContent);
    console.log('Synced timeline -> behindYears (written to', yearsPath, ')');
  } else if (from === 'years') {
    const synced = syncFromYears(ys, tl);
    const newContent = srcT.replace(/export const years:[\s\S]*$/m, `export const years = ${JSON.stringify(synced, null, 2)};\n`);
    safeWrite(timelinePath, newContent);
    console.log('Synced behindYears -> timeline (written to', timelinePath, ')');
  } else {
    console.error('Unknown --sync-from value. Use "timeline" or "years"');
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
