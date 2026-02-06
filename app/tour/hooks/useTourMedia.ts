import React from 'react';

/**
 * A minimal media item shape used by the tour UI.
 * Keep this intentionally permissive to accommodate images, videos or embeds.
 */
export type MediaItem = {
  id?: string | number;
  type?: 'image' | 'video' | 'embed' | string;
  src: string;
  title?: string;
  caption?: string;
  thumbnail?: string;
  durationSec?: number | null;
  // freeform metadata for adapters/controllers
  metadata?: Record<string, unknown> | null;
};

/** Normalized, internal representation with stable string id */
export type NormalizedMedia = MediaItem & { id: string };

export type UseTourMediaOptions = {
  loop?: boolean; // whether next() wraps to start and prev() wraps to end
  startIndex?: number; // initial index into the normalized list
};

export type UseTourMediaReturn = {
  media: NormalizedMedia[];
  length: number;
  currentIndex: number | null;
  currentMedia: NormalizedMedia | null;

  // setters
  setMedia: (items: MediaItem[]) => void;
  appendMedia: (item: MediaItem) => void;
  removeById: (id: string | number) => void;
  clearMedia: () => void;

  // navigation
  selectIndex: (index: number | null) => void;
  selectById: (id: string | number) => void;
  next: () => void;
  prev: () => void;
  goToFirst: () => void;
  goToLast: () => void;

  // helpers
  hasNext: boolean;
  hasPrev: boolean;
  findIndexById: (id: string | number) => number;
};

/**
 * Convert incoming list to a normalized array with stable string ids.
 * Does not perform side-effects.
 */
export function normalizeMediaList(items: MediaItem[]): NormalizedMedia[] {
  if (!Array.isArray(items)) return [];
  return items.map((it, idx) => {
    const baseId = it.id != null ? String(it.id) : `media_${idx}`;
    return {
      id: baseId,
      type: it.type ?? 'image',
      src: it.src,
      title: it.title,
      caption: it.caption,
      thumbnail: it.thumbnail,
      durationSec: it.durationSec ?? null,
      metadata: it.metadata ?? null,
    } as NormalizedMedia;
  });
}

/**
 * Pure, composable hook that manages a normalized media list and a current index.
 * - No DOM reads
 * - No network
 * - No layout logic or refs
 */
export function useTourMedia(initial: MediaItem[] = [], opts: UseTourMediaOptions = {}): UseTourMediaReturn {
  const { loop = false, startIndex = 0 } = opts;

  const [media, setMediaState] = React.useState<NormalizedMedia[]>(() => normalizeMediaList(initial));
  const [currentIndex, setCurrentIndex] = React.useState<number | null>(() => {
    const list = normalizeMediaList(initial);
    if (!list.length) return null;
    const i = Math.max(0, Math.min(startIndex, list.length - 1));
    return i;
  });

  const length = media.length;

  const currentMedia = React.useMemo(() => {
    if (currentIndex == null) return null;
    return media[currentIndex] ?? null;
  }, [media, currentIndex]);

  const setMedia = React.useCallback((items: MediaItem[]) => {
    const norm = normalizeMediaList(items || []);
    setMediaState(norm);
    // adjust currentIndex to remain valid
    setCurrentIndex((prev) => {
      if (!norm.length) return null;
      if (prev == null) return 0;
      return Math.max(0, Math.min(prev, norm.length - 1));
    });
  }, []);

  const appendMedia = React.useCallback((item: MediaItem) => {
    setMediaState((prev) => {
      const norm = normalizeMediaList([item]);
      return prev.concat(norm);
    });
    setCurrentIndex((prev) => (prev == null ? 0 : prev));
  }, []);

  const removeById = React.useCallback((id: string | number) => {
    setMediaState((prev) => {
      const strId = String(id);
      const next = prev.filter((m) => m.id !== strId);
      return next;
    });
    setCurrentIndex((prevIndex) => {
      if (prevIndex == null) return null;
      // adjust after removal: clamp to new length - 1
      // we compute based on previous state via functional update not available here, so rely on effect via media updates
      return prevIndex;
    });
  }, []);

  const clearMedia = React.useCallback(() => {
    setMediaState([]);
    setCurrentIndex(null);
  }, []);

  const findIndexById = React.useCallback(
    (id: string | number) => {
      const str = String(id);
      for (let i = 0; i < media.length; i++) if (media[i].id === str) return i;
      return -1;
    },
    [media]
  );

  const selectIndex = React.useCallback((index: number | null) => {
    if (index == null) {
      setCurrentIndex(null);
      return;
    }
    if (!Number.isFinite(index)) return;
    const i = Math.floor(index);
    if (i < 0) {
      setCurrentIndex(loop && media.length ? media.length - 1 : 0);
      return;
    }
    if (i >= media.length) {
      setCurrentIndex(loop && media.length ? 0 : Math.max(0, media.length - 1));
      return;
    }
    setCurrentIndex(i);
  }, [media.length, loop]);

  const selectById = React.useCallback((id: string | number) => {
    const i = findIndexById(id);
    if (i >= 0) setCurrentIndex(i);
  }, [findIndexById]);

  const next = React.useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev == null) return media.length ? 0 : null;
      if (prev + 1 < media.length) return prev + 1;
      return loop && media.length ? 0 : prev;
    });
  }, [media.length, loop]);

  const prev = React.useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev == null) return media.length ? 0 : null;
      if (prev - 1 >= 0) return prev - 1;
      return loop && media.length ? media.length - 1 : prev;
    });
  }, [media.length, loop]);

  const goToFirst = React.useCallback(() => selectIndex(media.length ? 0 : null), [media.length, selectIndex]);
  const goToLast = React.useCallback(() => selectIndex(media.length ? media.length - 1 : null), [media.length, selectIndex]);

  const hasNext = React.useMemo(() => {
    if (currentIndex == null) return media.length > 1;
    if (currentIndex + 1 < media.length) return true;
    return loop && media.length > 0;
  }, [currentIndex, media.length, loop]);

  const hasPrev = React.useMemo(() => {
    if (currentIndex == null) return media.length > 1;
    if (currentIndex - 1 >= 0) return true;
    return loop && media.length > 0;
  }, [currentIndex, media.length, loop]);

  // Keep currentIndex clamped if media list shrinks.
  React.useEffect(() => {
    if (!media.length) {
      setCurrentIndex(null);
      return;
    }
    setCurrentIndex((prev) => {
      if (prev == null) return Math.max(0, Math.min(startIndex, media.length - 1));
      if (prev >= media.length) return media.length - 1;
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.length]);

  return React.useMemo(() => ({
    media,
    length: media.length,
    currentIndex,
    currentMedia,
    setMedia,
    appendMedia,
    removeById,
    clearMedia,
    selectIndex,
    selectById,
    next,
    prev,
    goToFirst,
    goToLast,
    hasNext,
    hasPrev,
    findIndexById,
  }), [
    media,
    currentIndex,
    currentMedia,
    setMedia,
    appendMedia,
    removeById,
    clearMedia,
    selectIndex,
    selectById,
    next,
    prev,
    goToFirst,
    goToLast,
    hasNext,
    hasPrev,
    findIndexById,
  ]);
}

export default useTourMedia;

