"use client";
import React, { useEffect, useState } from 'react';
import YearView from './YearView';
import PageArrows from './PageArrows';
import { usePathname } from 'next/navigation';

export default function YearPageClient({ yearData, allYears }: any) {
  const pathname = usePathname();
  const idx = allYears.indexOf(yearData.year);
  const prev = idx > 0 ? `/behind/years/${allYears[idx - 1]}` : null;
  const next = idx < allYears.length - 1 ? `/behind/years/${allYears[idx + 1]}` : null;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
      <div style={{ perspective: 1200 }}>
        <div className="bg-white rounded-md shadow-lg year-inner" style={{ transformStyle: 'preserve-3d' }}>
          <YearView {...yearData} mediaAutoplay={true} />
        </div>
      </div>
      <PageArrows prevPath={prev} nextPath={next} />
    </div>
  );
}
