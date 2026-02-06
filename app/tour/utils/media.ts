// Shared media-related helpers extracted from TourClient to simplify reuse.
// Keep implementations identical to the previous in-file versions to avoid UX changes.
import { getSupabaseUrl } from '../../../lib/media-resolver';

export function normalizeUrl(raw: string | null | undefined) {
  if (!raw) return raw as any;
  let s = String(raw || '');
  s = s.replace(/\r?\n/g, '').trim();
  try { s = decodeURIComponent(s); } catch (e) { /* noop */ }
  if (!s.startsWith('/')) s = '/' + s;
  try { return encodeURI(s); } catch (e) { return s; }
}

export function safeWebPath(raw?: string | null) {
  if (!raw) return '';
  // If it's already an absolute URL, return it
  if (String(raw).startsWith('http')) return String(raw);

  // If it's a MEDIAWEB path, redirect to Supabase
  if (String(raw).includes('MEDIAWEB/')) {
    return normalizeMediaSrc(raw);
  }

  try {
    let s = String(raw);
    if (s.includes('%25')) {
      try { s = decodeURIComponent(s); } catch (e) { /* noop */ }
    }
    try { s = decodeURIComponent(s); } catch (e) { /* noop */ }
    if (!s.startsWith('/')) s = '/' + s;
    return encodeURI(s);
  } catch (e) { return String(raw); }
}

export function normalizeMediaSrc(p?: string | null) {
  if (!p) return '';
  const s = String(p).trim();
  
  if (s.startsWith('http')) return s;

  // Use the manifest-based resolver which is the source of truth
  const resolved = getSupabaseUrl(s);
  if (resolved && resolved.startsWith('http')) {
    return resolved;
  }

  // Fallback: Return original if not found (or maybe the legacy logic?)
  // For now, let's trust the manifest. If it fails, the previous logic 
  // was also likely failing or guessing.
  // We'll keep a minimal fallback just in case the manifest is missing
  // specific "Open Tours" or legacy paths not in buckets yet.
  
  if (s.startsWith('/')) return s;
  return '/' + s;
}

export function tryImageFallback(imgEl: HTMLImageElement) {
  try {
    const cur = imgEl.src || '';
    const decoded = decodeURIComponent(cur.split('/').pop() || '');
    if (/\.heic$/i.test(decoded)) {
      const base = cur.replace(/\.heic$/i, '');
      imgEl.onerror = null;
      imgEl.src = base + '.jpg';
      setTimeout(() => { if (imgEl.naturalWidth === 0) imgEl.src = base + '.png'; }, 200);
      setTimeout(() => { if (imgEl.naturalWidth === 0) imgEl.src = 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/providers/placeholder.jpg'; }, 800);
      return;
    }
    imgEl.onerror = null;
    imgEl.src = 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/providers/placeholder.jpg';
  } catch (e) { imgEl.src = 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/providers/placeholder.jpg'; }
}

// Convert text to sentence case: first letter uppercase, and uppercase after punctuation.
export function toSentenceCase(raw?: string | null) {
  if (!raw) return '';
  try {
    let s = String(raw).trim();
    s = s.replace(/\s+/g, ' ');
    s = s.toLowerCase();
    s = s.replace(/^\s*([a-záéíóúñ])/i, (m, p1) => p1.toUpperCase());
    s = s.replace(/([\.\!\?\;:\n]\s+)([a-záéíóúñ])/gi, (m, p1, p2) => p1 + p2.toUpperCase());
    return s;
  } catch (e) { return String(raw || ''); }
}
