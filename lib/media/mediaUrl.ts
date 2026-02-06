import { safeWebPath } from '@/app/tour/utils/media';

// Helper to build absolute media URLs pointing to Supabase Storage public objects.
// Usage: mediaUrl('https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/madrid.webp') or mediaUrl('https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/MAIN%20TOUR/hero.webp')
export default function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  const p = String(path).trim();
  if (!p) return null;
  // If already absolute URL, return as-is
  if (/^https?:\/\//i.test(p)) return p;

  // If it's a legacy mediaweb path, use the new safe helper
  if (p.includes('MEDIAWEB/')) {
    return safeWebPath(p);
  }

  // Remove leading slashes
  const cleaned = p.replace(/^\/+/, '');

  // Encode each segment to preserve spaces and special chars (e.g. "PORTO & GALICIA")
  const encoded = cleaned.split('/').map(encodeURIComponent).join('/');

  const base = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || '').replace(/\/$/, '');
  if (!base) {
    // Fallback to a relative path if env is missing (shouldn't happen in production)
    return `/${encoded}`;
  }
  return `${base}/${encoded}`;
}
