const fs = require('fs');
const path = require('path');
const repoPath = path.resolve('build','open-tours-manifest.json');
const supPath = path.resolve('build','open-tours-manifest-from-supabase.json');
function readJSON(p){ if(!fs.existsSync(p)) return []; try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ console.error('Error parsing',p,e.message); return []; }}
function extract(entry){ if(!entry) return null; if(entry.path) return entry.path; if(entry.name) return entry.name; if(entry.url) return entry.url.split('/').pop(); if(entry.publicUrl) return decodeURIComponent(entry.publicUrl.split('/').pop()); return null; }
const repo = readJSON(repoPath);
const sup = readJSON(supPath);
const repoPaths = new Set(repo.map(extract).filter(Boolean));
const supPaths = new Set(sup.map(extract).filter(Boolean));
const supOnly = [...supPaths].filter(x=>!repoPaths.has(x)).sort();
const repoOnly = [...repoPaths].filter(x=>!supPaths.has(x)).sort();
const out = { repoCount: repoPaths.size, supCount: supPaths.size, supOnlyCount: supOnly.length, repoOnlyCount: repoOnly.length, supOnly, repoOnly };
const outPath = path.resolve('build','open-tours-manifest-compare.json');
fs.writeFileSync(outPath, JSON.stringify(out,null,2));
console.log('Wrote compare file to', outPath);
console.log('Repo files:', out.repoCount);
console.log('Supabase files:', out.supCount);
console.log('Sup only:', out.supOnlyCount, 'Repo only:', out.repoOnlyCount);
if(supOnly.length>0){ console.log('\nFirst 50 Sup only:\n', supOnly.slice(0,50).join('\n')) }
if(repoOnly.length>0){ console.log('\nFirst 50 Repo only:\n', repoOnly.slice(0,50).join('\n')) }
