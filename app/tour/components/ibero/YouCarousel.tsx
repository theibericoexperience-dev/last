"use client";

import React, { useEffect, useState } from 'react';
import { IBERO_ORDER } from './constants';
import { normalizeMediaSrc, toSentenceCase, tryImageFallback } from '../../utils/media';

type Props = {
  youFiles: any[];
  panelInnerHeight?: number;
  stopsPath: string;
};

export function YouCarousel({ youFiles, panelInnerHeight, stopsPath }: Props) {
  const basePath = stopsPath.replace(/\/MAIN TOUR\/stops.*$/i, '');
  const YOU_TEXT = `We can't finish this section without reminding that it is you, the one who places the trust in Ibero, that makes this a reality. An authentic tour, where the only purpose is to bring alive the culture and history of these regions, in a way that you will always remember and feel part of.`;
  const raw = (youFiles && youFiles.length > 0) ? youFiles : [{ path: `${basePath}/IBERO/YOU/you.jpg`, filename: 'you.jpg' }];
  const items = raw.map((p: any) => ({ src: (typeof p === 'string' ? p : (p.path || '')), caption: YOU_TEXT }));
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [youFiles && youFiles.length]);
  function prev() { setIdx(i => Math.max(0, i - 1)); }
  function next() { setIdx(i => Math.min(items.length - 1, i + 1)); }
  const src = (items[idx] && items[idx].src) || '';
  const youEntry = IBERO_ORDER.find(it => (it.filename || '').toUpperCase().includes('YOU'));
  const fallbackText = youEntry ? youEntry.text : 'YOU — the traveler who makes this tour special.';
  const text = (items[idx] && items[idx].caption) ? items[idx].caption : fallbackText;

  return (
    <div className="w-full h-full bg-transparent p-1" style={{ height: '100%', boxSizing: 'border-box' }}>
      <div className="flex flex-col h-full gap-2 justify-center">
        <div
          className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
          style={{ flex: '0 0 auto', minHeight: panelInnerHeight ? Math.max(140, Math.round(panelInnerHeight * 0.35)) : 220, maxHeight: '60%' }}
        >
          <button aria-label="Prev you" onClick={prev} className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white border shadow ${idx === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={idx === 0}>‹</button>
          <button aria-label="Next you" onClick={next} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white border shadow ${idx >= items.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={idx >= items.length - 1}>›</button>
          <img src={normalizeMediaSrc(src)} alt={`you-${idx}`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', maxHeight: '100%' }} onError={(e) => { tryImageFallback(e.currentTarget as HTMLImageElement); }} />
          <div className="absolute left-0 right-0 bottom-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 60%)' }} />
          <div className="absolute left-0 right-0 bottom-0 p-4" style={{ background: 'rgba(255,255,255,0.35)', minHeight: '72px', boxSizing: 'border-box' }}>
            <div className="text-sm text-gray-800">{toSentenceCase(String(text)).slice(0, 800)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YouCarousel;
