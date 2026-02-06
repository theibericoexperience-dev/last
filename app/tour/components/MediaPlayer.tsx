"use client";

import { NormalizedMedia } from "../hooks/useTourMedia";

export interface MediaPlayerProps {
  media: NormalizedMedia | null;
  mediaCounter: string;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function MediaPlayer({
  media,
  mediaCounter,
  onPrev,
  onNext,
}: MediaPlayerProps) {
  return (
    <section className="media-player" style={{ padding: 20 }}>
      <h3>Media Player (Phase 10)</h3>
      <div>
        <strong>Media:</strong> {media ? `${media.title ?? media.id}` : "No media"}
      </div>
      <div>
        <strong>Counter:</strong> {mediaCounter}
      </div>
      <div style={{ marginTop: 10 }}>
        <button
          onClick={onPrev}
          disabled={!onPrev}
          style={{
            marginRight: 5,
            opacity: onPrev ? 1 : 0.5,
            cursor: onPrev ? "pointer" : "default",
          }}
        >
          Prev Media
        </button>
        <button
          onClick={onNext}
          disabled={!onNext}
          style={{
            opacity: onNext ? 1 : 0.5,
            cursor: onNext ? "pointer" : "default",
          }}
        >
          Next Media
        </button>
      </div>
    </section>
  );
}
