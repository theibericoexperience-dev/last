"use client";
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

function ChevronSVG({ dir = 'left' }: { dir?: 'left' | 'right' }) {
  if (dir === 'left') {
    return (
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="22" y1="12" x2="10" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="36" x2="10" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="12" x2="22" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <line x1="10" y1="36" x2="22" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function PageArrows({ leftStyle, rightStyle, prevPath, nextPath, disabledPrev = false, disabledNext = false }: any) {
  const router = useRouter();
  const [el] = useState(() => (typeof document === 'undefined' ? null : document.createElement('div')));

  useEffect(() => {
    if (!el) return;
    document.body.appendChild(el);
    return () => {
      try { if (el && document.body.contains(el)) document.body.removeChild(el); } catch (e) {}
    };
  }, [el]);

  if (!el) return null;

  const left = leftStyle ?? { position: 'fixed', left: 'calc(50% - 420px - 48px)', top: '50%', transform: 'translateY(-50%)', zIndex: 9999 };
  const right = rightStyle ?? { position: 'fixed', left: 'calc(50% + 420px + 12px)', top: '50%', transform: 'translateY(-50%)', zIndex: 9999 };

  return createPortal(
    <>
      <button
        data-no-close
        onClick={() => { if (prevPath) router.push(prevPath); }}
        aria-label="prev"
        style={left}
        className={`p-3 bg-transparent z-50 pointer-events-auto ${disabledPrev ? 'opacity-40 pointer-events-none' : ''}`}>
        <div style={{ width: 44, height: 64 }}>
          <ChevronSVG dir="left" />
        </div>
      </button>
      <button
        data-no-close
        onClick={() => { if (nextPath) router.push(nextPath); }}
        aria-label="next"
        style={right}
        className={`p-3 bg-transparent z-50 pointer-events-auto ${disabledNext ? 'opacity-40 pointer-events-none' : ''}`}>
        <div style={{ width: 44, height: 64 }}>
          <ChevronSVG dir="right" />
        </div>
      </button>
    </>,
    el
  );
}
