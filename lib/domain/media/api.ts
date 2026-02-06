// Domain wrapper for tour media API
// Usage: getTourMedia(path: string, signal?) => Promise<MediaItem[]>

export type MediaItem = {
  id?: string | number;
  type?: 'image' | 'video' | 'embed' | string;
  src: string;
  title?: string;
  caption?: string;
  thumbnail?: string;
  durationSec?: number | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Fetches media files for a given tour/media path.
 * Returns a list of MediaItem objects (path mapped to src).
 */
export async function getTourMedia(path: string, signal?: AbortSignal): Promise<MediaItem[]> {
  const res = await fetch(`/api/media/list?path=${encodeURIComponent(path)}`,
    { method: 'GET', signal });
  if (!res.ok) return [];
  const j = await res.json();
  if (!j?.ok || !Array.isArray(j.files)) return [];
  return j.files.map((f: any) => ({
    id: typeof f === 'object' && f ? f.id || f.path || f.filename : f,
    src: typeof f === 'object' && f ? f.path || f.filename : f,
    title: typeof f === 'object' && f ? f.title || f.caption || '' : '',
    caption: typeof f === 'object' && f ? f.caption || '' : '',
    ...((typeof f === 'object' && f) ? f : {})
  }));
}
