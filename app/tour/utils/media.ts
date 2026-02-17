// Shared media-related helpers extracted from TourClient to simplify reuse.
// Keep implementations identical to the previous in-file versions to avoid UX changes.
import { getSupabaseUrl } from '../../../lib/media-resolver';
import { getMediaPlaceOverride } from './media-overrides';

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

// Extract a human-friendly place/name from a media path or filename.
export function extractPlaceFromPath(raw?: string | null) {
  if (!raw) return null;
  try {
    // Prefer explicit overrides for known bad filenames before applying heuristics
    const override = getMediaPlaceOverride(raw);
    if (override) return override;

    let s = String(raw).trim();
    // get last path segment
    const parts = s.split('/').filter(Boolean);
    let candidate = parts.length ? parts[parts.length - 1] : s;
    // remove querystring
    candidate = candidate.split('?')[0];
    // remove extension
    candidate = candidate.replace(/\.[a-z0-9]{2,5}$/i, '');
    // replace common separators
    candidate = candidate.replace(/[_\-]+/g, ' ');
    // remove common prefixes like day numbers or IMG/DSC
    candidate = candidate.replace(/^\d+\s*/g, '').replace(/^(img|dsc|photo)\s*/i, '');
    candidate = candidate.replace(/\b(extension|extensions)\b/gi, '');
    candidate = candidate.replace(/\b(main|hero|cover)\b/gi, '');
    candidate = candidate.replace(/\s+/g, ' ').trim();
    if (!candidate) return null;
    // Heuristics: reject if contains digits or too many tokens or tokens are short / noisy
    const tokens = candidate.split(' ').filter(Boolean);
    // reject if any token contains a digit
    if (tokens.some(t => /\d/.test(t))) return null;
    // reject if too many tokens (likely a filename with many parts) - allow up to 4 tokens
    if (tokens.length === 0 || tokens.length > 4) return null;
    // reject tokens that are too short or common noise
    const noise = /^(img|dsc|photo|final|edit|v1|v2|2020|2021|2022|2023|2024|2025)$/i;
    if (tokens.every(t => t.length <= 2 || noise.test(t))) return null;
    // Title case and keep only alphabetic parts
    const cleanTokens = tokens.map(t => t.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑçÇ\s]/g, '')).filter(Boolean);
    if (cleanTokens.length === 0) return null;
    const title = cleanTokens.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    // final length safety
    if (title.length < 3) return null;
    return title;
  } catch (e) { return null; }
}
