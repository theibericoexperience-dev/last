// lib/media-resolver.ts
import manifest from '../build/supabase-storage-manifest.json';

/**
 * Resolves a local media path to its corresponding Supabase public URL
 * by searching through the generated manifest.
 *
 * @param localPath - The path to resolve (e.g., 'YOU/IMG_8351.webp' or '/MEDIAWEB/BEHIND_OPTIMIZED/HERO-BEHIND.webp')
 * @returns The public URL from Supabase if found, otherwise returns the original path.
 */
export function getSupabaseUrl(localPath: string): string {
  if (!localPath) return '';
  if (localPath.startsWith('http')) return localPath;

  // Normalize path: remove leading /MEDIAWEB/ or / if present
  let normalized = localPath.replace(/^\/+/, '');
  if (normalized.startsWith('MEDIAWEB/')) {
    normalized = normalized.replace('MEDIAWEB/', '').replace(/^\/+/, '');
  }
  
  // We want to match the end of the bucket path. 
  // e.g. input 'HERO-BEHIND.webp' should match 'BEHIND_OPTIMIZED/HERO-BEHIND.webp'
  // e.g. input 'BEHIND_OPTIMIZED/HERO-BEHIND.webp' should also match.

  for (const bucketName in manifest.buckets) {
    const items = (manifest.buckets as any)[bucketName];
    for (const item of items) {
      // Check for exact match or suffix match with slash
      if (item.path === normalized || item.path.endsWith('/' + normalized)) {
        return item.publicUrl;
      }
    }
  }

  // Fallback if not found exactly
  return localPath;
}
