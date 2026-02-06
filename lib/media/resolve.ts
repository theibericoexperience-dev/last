// Helper to resolve media URLs in a consistent way.
// - If NEXT_PUBLIC_MEDIA_BASE_URL is set, it will be used as the CDN/base prefix.
// - Otherwise, returns a path under /MEDIAWEB/... so existing local symlink setups continue to work.
export function resolveMediaUrl(input?: string | null): string | null {
  if (!input) return null;

  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

  // Prefer an explicit /MEDIAWEB/... substring if present (case-insensitive)
  const mediaMatch = input.match(/(\/MEDIAWEB\/.*)$/i);
  let path = mediaMatch ? mediaMatch[1] : input;

  // If someone passed an absolute filesystem path containing MEDIAWEB, extract it
  if (!mediaMatch) {
    const fsMatch = input.match(/.*(MEDIAWEB[\/].*)$/i);
    if (fsMatch) {
      path = '/' + fsMatch[1].replace(/\\/g, '/');
    }
  }

  // Ensure leading slash
  if (!path.startsWith('/')) path = '/' + path;

  if (base && base.length > 0) {
    // Join base and path, avoiding duplicate slashes
    return base.replace(/\/$/, '') + path;
  }

  return path;
}

export function normalizeMediaUrl(input?: string | null): string | null {
  return resolveMediaUrl(input);
}
