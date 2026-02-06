// Shared media-related helpers extracted from TourClient to simplify reuse.
// Keep implementations identical to the previous in-file versions to avoid UX changes.

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

  // Supabase Configuration
  const SUPABASE_ID = 'wqpyfdxbkvvzjoniguld';
  const SUPABASE_BASE = `https://${SUPABASE_ID}.supabase.co/storage/v1/object/public`;

  // Rule-based transformation to Supabase buckets
  const rules = [
    { bucket: 'vidoe%20behind', match: 'tinta-behind-background-opt.webm', strip: 'MEDIAWEB/BEHIND_OPTIMIZED' },
    { bucket: 'ACTIVITITES', match: 'MEDIAWEB/activities_optimized', strip: 'MEDIAWEB/activities_optimized' },
    { bucket: 'behind', match: 'MEDIAWEB/BEHIND_OPTIMIZED', strip: 'MEDIAWEB/BEHIND_OPTIMIZED' },
    { bucket: 'MISC', match: 'MEDIAWEB/LANDING', strip: 'MEDIAWEB/LANDING' },
    { bucket: 'pdf-prueba', match: 'MEDIAWEB/PDFS', strip: 'MEDIAWEB/PDFS' },
    { bucket: 'Tours', match: 'MEDIAWEB/TOURS', strip: 'MEDIAWEB/TOURS' },
    // Special case for "Open Tours" paths that might not have MEDIAWEB prefix
    { bucket: 'Tours', match: 'Open Tours', strip: 'unused' } 
  ];

  const clean = s.replace(/^\/+/, ''); // remove leading slash
  
  for (const rule of rules) {
    if (clean.includes(rule.match)) {
      let bucketPath = '';
      if (rule.match === 'Open Tours') {
        bucketPath = clean;
      } else if (rule.match === 'tinta-behind-background-opt.webm') {
        bucketPath = 'tinta-behind-background-opt.webm';
      } else {
        bucketPath = clean.replace(rule.strip, '').replace(/^\/+/, '');
      }
      
      const encodedParts = bucketPath.split('/').map(part => encodeURIComponent(part)).join('/');
      return `${SUPABASE_BASE}/${rule.bucket}/${encodedParts}`;
    }
  }

  // Legacy fallback if no rule matched
  try {
    const m = s.match(/(\/MEDIAWEB\/.*)$/i);
    if (m && m[1]) return m[1];
    const m2 = s.match(/.*(MEDIAWEB\/.*)$/i);
    if (m2 && m2[1]) return '/' + m2[1].replace(/^\//, '');
    if (s.startsWith('/')) return s;
    return s;
  } catch (e) { return s; }
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
