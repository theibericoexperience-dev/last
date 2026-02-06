import React from "react";
import { NormalizedMedia } from "../hooks/useTourMedia";

type MediaPreviewProps = {
  media: NormalizedMedia | null;
  mediaCounter: string;
  onPrev?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
};

export default function MediaPreview({ media, mediaCounter, onPrev, onNext }: MediaPreviewProps) {
  return (
    <section style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
      <h3>Media Preview ({mediaCounter})</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>{media ? JSON.stringify(media, null, 2) : "No media available"}</pre>
      <div style={{ marginTop: 4 }}>
        <button onClick={onPrev} disabled={!onPrev} style={{ marginRight: 4 }}>Prev Media</button>
        <button onClick={onNext} disabled={!onNext}>Next Media</button>
      </div>
    </section>
  );
}
