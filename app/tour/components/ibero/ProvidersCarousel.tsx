"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { IBERO_ORDER } from './constants';
import { normalizeMediaSrc, toSentenceCase, tryImageFallback } from '../../utils/media';

type Props = {
  iberoFiles: any[];
  panelInnerHeight?: number;
  stopsPath: string;
};

export function ProvidersCarousel({ iberoFiles, panelInnerHeight, stopsPath }: Props) {
  const providersBase = stopsPath.replace(/MAIN TOUR\/stops.*$/i, 'IBERO/providers');
  const fallbackItems = useMemo(() => {
    return IBERO_ORDER
      .filter((entry) => entry.filename && entry.filename !== 'YOU')
      .map((entry) => ({
        src: normalizeMediaSrc(`${providersBase}/${entry.filename}`),
        caption: entry.text,
      }));
  }, [providersBase]);

  const carouselItems = useMemo(() => {
    if (Array.isArray(iberoFiles) && iberoFiles.length > 0) {
      return iberoFiles
        .map((file: any, idx: number) => ({
          src: normalizeMediaSrc(typeof file === 'string' ? file : (file.path || file.url || file.filename || '')),
          caption: file.caption || fallbackItems[idx % fallbackItems.length]?.caption || '',
        }))
        .filter((item) => item.src);
    }
    return fallbackItems;
  }, [iberoFiles, fallbackItems]);

  const [idx, setIdx] = useState(0);
  const total = carouselItems.length || 1;
  useEffect(() => { setIdx(0); }, [total]);
  const current = carouselItems[Math.min(idx, total - 1)] || { src: '', caption: '' };

  function prev() { setIdx((i) => Math.max(0, i - 1)); }
  function next() { setIdx((i) => Math.min(total - 1, i + 1)); }

  return (
    <div className="w-full h-full bg-transparent p-1" style={{ boxSizing: 'border-box', height: '100%', overflow: 'hidden' }}>
      <div className="flex flex-col h-full gap-2 justify-center">
        <div
          className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
          style={{ flex: '0 0 auto', minHeight: panelInnerHeight ? Math.max(160, Math.round(panelInnerHeight * 0.45)) : 260, maxHeight: '60%' }}
        >
          <button aria-label="Prev" onClick={prev} className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white border shadow ${idx === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={idx === 0}>‹</button>
          <button aria-label="Next" onClick={next} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white border shadow ${idx >= total - 1 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={idx >= total - 1}>›</button>
          {current.src ? (
            <img src={current.src} alt={`provider-${idx}`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', maxHeight: '100%' }} onError={(e) => { tryImageFallback(e.currentTarget as HTMLImageElement); }} />
          ) : (
            <div className="text-sm text-gray-500">Provider media coming soon.</div>
          )}
          <div className="absolute left-0 right-0 bottom-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.96) 60%)' }} />
          <div className="absolute left-0 right-0 bottom-0 p-4" style={{ background: 'rgba(255,255,255,0.97)', minHeight: '80px', boxSizing: 'border-box' }}>
            <div className="text-sm md:text-base text-gray-900 whitespace-pre-line leading-relaxed" style={{ maxHeight: '96px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {current.caption ? toSentenceCase(String(current.caption)) : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProvidersCarousel;
