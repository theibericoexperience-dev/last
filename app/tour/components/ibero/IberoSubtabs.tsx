"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { getTourMedia } from '@/lib/domain/media/api';
import { safeWebPath, normalizeUrl, tryImageFallback } from '../../utils/media';

type Props = {
  stopsPath: string;
  iberoFiles: any[];
  youFiles: any[];
  innerTab: 'summary' | 'guides' | 'hotels';
  panelInnerHeight?: number;
};

export function IberoSubtabs({ stopsPath, iberoFiles, youFiles, innerTab, panelInnerHeight }: Props) {
  const basePath = stopsPath.replace(/\/MAIN TOUR\/stops.*$/i, '');
  const mediaList: Array<{ name: string; path: string; caption: string }> = (iberoFiles && iberoFiles.length > 0)
    ? iberoFiles.slice(0, 6).map((p: any, i: number) => ({ name: (p.filename || String(p).split('/').pop() || `person-${i}`).replace(/\.[^/.]+$/, ''), path: (p.path || p), caption: '' }))
    : [
      { name: 'maria', path: `${basePath}/IBERO/providers/MARIA.jpg`, caption: 'maria, a local chef' },
      { name: 'toni', path: `${basePath}/IBERO/providers/TONI.jpg`, caption: 'toni, the shepherd' },
      { name: 'vidal', path: `${basePath}/IBERO/providers/VIDAL.jpg`, caption: 'vidal, estate owner' },
      { name: 'isabel', path: `${basePath}/IBERO/providers/isabel.jpg`, caption: 'isabel, local cook' }
    ];

  const [pageIndexLocal, setPageIndexLocal] = useState(0);
  const [youIndexLocal, setYouIndexLocal] = useState(0);
  const [hotelsFiles, setHotelsFiles] = useState<string[]>([]);
  const [hotelIndex, setHotelIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // DEPRECATED: fetch directo legacy reemplazado por domain wrapper
        // const res = await fetch('/api/media/list?path=' + encodeURIComponent(path));
        const path = `${basePath}/IBERO/sleeps`;
        const files = await getTourMedia(path);
        const filePaths: string[] = Array.isArray(files)
          ? files.map((x: any) => (typeof x === 'string' ? x : (x.src || x.path || x.filename || ''))).filter(Boolean)
          : [];
        setHotelsFiles(filePaths.slice(0, 200));
      } catch (e) { /* ignore */ }
    })();
  }, [basePath, iberoFiles]);

  useEffect(() => { setHotelIndex(0); }, [hotelsFiles.length]);

  const pages = useMemo(() => {
    const p: typeof mediaList[] = [] as any;
    for (let i = 0; i < mediaList.length; i += 2) p.push(mediaList.slice(i, i + 2));
    return p;
  }, [basePath]);

  const current = pages[Math.max(0, Math.min(pages.length - 1, pageIndexLocal))] || [];

  function prevPage() { setPageIndexLocal(i => Math.max(0, i - 1)); }
  function nextPage() { setPageIndexLocal(i => Math.min(pages.length - 1, i + 1)); }

  const youData = {
    text: "We can't finish this section without reminding that it is you, the one who places the trust in Ibero, that makes this a reality. An authentic tour, where the only purpose is to bring alive the culture and history of these regions, in a way that you will always remember and feel part of.",
    path: (youFiles && youFiles.length > 0) ? (youFiles[0].path || youFiles[0]) : `${basePath}/IBERO/YOU/you.jpg`
  };

  return (
    <div className="w-full h-full px-0" style={{ minHeight: 0, height: '100%', overflow: 'hidden' }}>
      <div className="relative p-2 h-full" style={{ minHeight: 0 }}>
        {innerTab !== 'summary' && (
          <>
            <button aria-label="Previous providers" onClick={prevPage} className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 ${pageIndexLocal === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={pageIndexLocal === 0}>‹</button>
            <button aria-label="Next providers" onClick={nextPage} className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 ${pageIndexLocal >= pages.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={pageIndexLocal >= pages.length - 1}>›</button>
          </>
        )}

        {innerTab === 'summary' && (
          <div className="h-full w-full px-1 flex flex-col" style={{ minHeight: 0, height: '100%' }}>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex-1 flex flex-col" style={{ boxSizing: 'border-box', padding: 0, minHeight: 0 }}>
              <div className="flex-1 px-6 py-6" style={{ height: '100%', minHeight: 0 }}>
                <div className="text-base md:text-[1.05rem] text-gray-900 whitespace-pre-line leading-relaxed w-full" style={{ paddingBottom: '8px', maxHeight: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
{`The tour that started it all—an ever-evolving journey through the heart of Extremadura and Alentejo in Southwest Iberia.
Beginning in Madrid, you’ll experience a taste of the capital’s vibrant lifestyle while exploring iconic sites tied to Spain’s royal heritage.

From there, we enter Extremadura through the dramatic Gredos Mountains, pausing first in the storied city of Ávila. Over the next three days, you’ll discover the hidden gems of Northern Extremadura and Alentejo, visiting remarkable places such as Monsanto, San Martín, Granadilla, and the sacred town of Guadalupe.

As the adventure continues south, we immerse ourselves in the region’s most important cities—including Badajoz, Mérida, and Cáceres—each offering its own blend of history, culture, and architecture. Crossing into Portugal, we journey through the Alentejo, exploring UNESCO-listed jewels like Évora and Elvas, where centuries of craftsmanship shine through in stunning marble architecture sourced from local quarries.

We conclude our experience in Setúbal, a tranquil coastal town near Lisbon. From here, we explore nearby attractions before your departure—or you may choose to continue diving deeper into Easter's Cultural Celebrations and Azores extension.`}
                </div>
              </div>
            </div>
          </div>
        )}

        {innerTab === 'guides' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex gap-4 items-center p-3">
              <div className="w-36 h-36 bg-gray-100 overflow-hidden">
                <img src="https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/behind/89df8474-1078-4a09-bbf8-a719c29b1b7c.webp" alt="Ramiro" loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => tryImageFallback(e.currentTarget as HTMLImageElement)} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">Ramiro</div>
                <div className="text-sm text-gray-700">Guide</div>
              </div>
            </div>
          </div>
        )}

        {innerTab === 'hotels' && (
          <div className="mt-4">
            <div className="relative p-0">
              <div className="w-full h-64 bg-gray-100 overflow-hidden flex items-center justify-center">
                {hotelsFiles.length === 0 ? (
                  <div className="text-gray-500">No hotel photos available.</div>
                ) : (
                  <div className="w-full h-64 overflow-hidden">
                    <img src={safeWebPath(hotelsFiles[hotelIndex] || '')} className="w-full h-full object-cover bg-black/5" style={{ objectPosition: 'center' }} alt={`hotel-${hotelIndex}`} onError={(e) => tryImageFallback(e.currentTarget as HTMLImageElement)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IberoSubtabs;
