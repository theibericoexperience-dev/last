"use client";

import React, { useCallback, useMemo, useRef } from 'react';
import type { YearData } from '@/data/behindYears';

type YearRailProps = {
  rows: YearData[];
  activeId: string | null;
  onSelectAction: (id: string) => void;
  /** CSS top offset in px for the sticky positioning (optional) */
  topOffset?: number;
  /** Position of the rail relative to content */
  side?: 'left' | 'right';
};

function clampSegHeight(score: number, min = 18, max = 80, base = 18, step = 8) {
  return Math.min(max, Math.max(min, base + score * step));
}

const YearRailItem = React.memo(function YearRailItem({
  id,
  label,
  segHeight,
  isActive,
  onClick,
  index,
  isLast,
  buttonRef,
}: {
  id: string;
  label: string;
  segHeight: number;
  isActive: boolean;
  onClick: (id: string) => void;
  index: number;
  isLast: boolean;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <li className="flex flex-col items-start group" data-index={index}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onClick(id)}
        className={`flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded group transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80'}`}
        aria-current={isActive ? 'page' : undefined}
        aria-controls={id}
        data-index={index}
      >
        <div
          aria-hidden
          className={`w-3 h-3 rounded-full transition-transform duration-300 will-change-transform border-2 ${isActive ? 'bg-[#111827] border-[#111827] scale-150 shadow-md' : 'bg-white border-gray-300 scale-100 group-hover:border-gray-600 group-hover:scale-110'}`}
        />

        <span className={`text-xs transform transition-transform duration-300 ${isActive ? 'translate-x-1 text-[#111827] font-bold opacity-100' : 'translate-x-0 text-gray-400 font-normal opacity-60'}`}>
          {label}
        </span>
      </button>

      {!isLast && (
        <div className="w-full flex justify-start pl-[6px]" aria-hidden>
          <div
            className={`w-[2px] transition-all duration-300 my-1 ${isActive ? 'bg-[#111827]' : 'bg-gray-200 group-hover:bg-gray-300'}`}
            style={{ height: `${segHeight}px`, transform: isActive ? 'scaleY(1)' : 'scaleY(0.85)', transformOrigin: 'top' }}
          />
        </div>
      )}
    </li>
  );
});

export default function YearRail({ rows, activeId, onSelectAction, topOffset = 96, side = 'left' }: YearRailProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const handleButtonRef = useCallback((index: number) => (el: HTMLButtonElement | null) => {
    buttonsRef.current[index] = el;
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const idxAttr = target.getAttribute('data-index') ?? target.closest('[data-index]')?.getAttribute('data-index');
    const idx = idxAttr ? Number(idxAttr) : -1;
    if (idx < 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = buttonsRef.current[idx + 1] ?? buttonsRef.current[idx];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = buttonsRef.current[idx - 1] ?? buttonsRef.current[idx];
      prev?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      // let button handle click naturally
    }
  }, []);

  const items = useMemo(() => rows.map((r, i) => {
    const id = `year-${r.year}`;
    const score = (r.paragraphs?.length ?? 0) + (r.media ? 1 : 0);
    const segHeight = clampSegHeight(score);
    const isLast = i === rows.length - 1;
    return { id, label: String(r.title ?? r.year), segHeight, isLast };
  }), [rows]);

  const railClass = useMemo(() => {
    const base = 'year-rail hidden md:flex flex-col items-start gap-0 mr-8 sticky self-start pl-4';
    return `${base} ${side === 'right' ? 'right-0' : 'left-0'}`;
  }, [side]);

  return (
    <nav className={railClass} aria-label="Navegación cronológica" style={{ top: `${topOffset}px` }}>
      <ul className="list-none p-0 m-0" onKeyDown={onKeyDown}>
        {items.map((it, idx) => (
          <YearRailItem
            key={it.id}
            id={it.id}
            label={it.label}
            segHeight={it.segHeight}
            isActive={activeId === it.id}
            onClick={onSelectAction}
            index={idx}
            isLast={it.isLast}
            buttonRef={handleButtonRef(idx)}
          />
        ))}
      </ul>
    </nav>
  );
}
