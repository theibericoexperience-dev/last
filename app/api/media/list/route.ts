import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Return a JSON list of files under public/MEDIAWEB/TOURS/... limited to media extensions.
// OR: If path starts with "Open Tours", query from Supabase manifest (Tours bucket)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get('path') || '';
    // sanitize and normalize
    const decoded = decodeURIComponent(raw || '');
    
    // ========================================
    // SUPABASE MEDIA (Manifest-based)
    // ========================================
    const newManifestPath = path.join(process.cwd(), 'build', 'supabase-storage-manifest.json');
    if (fs.existsSync(newManifestPath)) {
      const storageManifest = JSON.parse(fs.readFileSync(newManifestPath, 'utf8'));
      
      // We look across all buckets for paths containing the 'path' param
      let foundFiles: any[] = [];
      const buckets = storageManifest.buckets || {};
      
      for (const bucketName of Object.keys(buckets)) {
        const bucketFiles = buckets[bucketName];
        // Filter files that are in a folder named after our 'decoded' path
        // e.g. if decoded is 'YOU', find files with path containing '/YOU/' or starting with 'YOU/'
        const matches = bucketFiles.filter((f: any) => {
          const p = f.path.toLowerCase();
          const target = decoded.toLowerCase();
          return p.includes(`/${target}/`) || p.startsWith(`${target}/`);
        });
        
        if (matches.length > 0) {
          foundFiles = [...foundFiles, ...matches.map((m: any) => ({
            path: m.publicUrl,
            filename: m.path.split('/').pop(),
            caption: null
          }))];
        }
      }

      if (foundFiles.length > 0) {
        return NextResponse.json({ ok: true, files: foundFiles });
      }
    }

    const manifestPath = path.join(process.cwd(), 'build', 'all-media-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Normalize search path
      let searchPath = decoded;
      if (!searchPath.startsWith('/')) searchPath = '/' + searchPath;
      if (!searchPath.endsWith('/')) searchPath = searchPath + '/';

      // Check if we are asking for a prefix that exists in the manifest
      const matches = manifest.filter((entry: any) => {
        const lp = entry.localPath;
        // Case insensitive match for convenience, but manifest paths are exact
        return lp.startsWith(searchPath) || lp.startsWith(searchPath.substring(1));
      });

      if (matches.length > 0) {
        const files = matches.map((entry: any) => ({
          path: entry.publicUrl,
          filename: entry.name,
          caption: null // captions are harder from manifest, usually local _meta.json handles it
        }));
        return NextResponse.json({ ok: true, files });
      }
    }

    // Fallback for "Open Tours" specifically if not in global manifest (older logic)
    if (decoded.startsWith('Open Tours/') || decoded.startsWith('Open Tours')) {
      const legacyManifestPath = path.join(process.cwd(), 'build', 'open-tours-manifest-from-supabase.json');
      if (fs.existsSync(legacyManifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(legacyManifestPath, 'utf8'));
        const files = manifest
          .filter((entry: any) => entry.path && entry.path.startsWith(decoded))
          .map((entry: any) => ({
            path: entry.publicUrl,
            filename: entry.name,
            caption: null
          }));
        return NextResponse.json({ ok: true, files });
      }
    }
    
    // ========================================
    // LOCAL MEDIA (legacy /MEDIAWEB paths)
    // ========================================
    // ensure the path points under MEDIAWEB/TOURS or MEDIAWEB/BEHIND and does not contain traversal
    const rel = decoded.replace(/^\/+/, ''); // remove leading slash
    const normalized = path.normalize(rel);
    // reject traversal
    if (normalized.split(path.sep).includes('..')) {
      return NextResponse.json({ ok: false, error: 'invalid-path' }, { status: 400 });
    }
    const up = normalized.toUpperCase();
    const valid1 = 'MEDIAWEB' + path.sep + 'TOURS';
    const valid2 = 'MEDIAWEB' + path.sep + 'BEHIND';
    if (!(up.startsWith(valid1.toUpperCase()) || up.startsWith(valid2.toUpperCase()))) {
      return NextResponse.json({ ok: false, error: 'invalid-path' }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const dir = path.join(publicDir, normalized);
    // check existence
    const stat = await fs.promises.stat(dir).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      return NextResponse.json({ ok: false, files: [], error: 'not-found' });
    }

    const entries = await fs.promises.readdir(dir);
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.webm', '.heic', '.heif'];

    // try read _meta.json if present to attach captions
    let meta: Record<string, string> = {};
    const metaPath = path.join(dir, '_meta.json');
    try {
      const rawMeta = await fs.promises.readFile(metaPath, 'utf8');
      const parsed = JSON.parse(rawMeta);
      if (parsed && typeof parsed === 'object') meta = parsed as Record<string, string>;
    } catch (err) {
      // ignore if not present or invalid
    }

    const files = entries.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return allowed.includes(ext);
    }).map((f) => {
      // construct a web-path relative to / with each segment encoded
      const parts = normalized.split(path.sep).map((p) => encodeURIComponent(p)).join('/');
      const webPath = '/' + parts + '/' + encodeURIComponent(f);
      return { path: webPath, filename: f, caption: meta[f] || null };
    });

    return NextResponse.json({ ok: true, files });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
