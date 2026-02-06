"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

function ChevronSVG({ dir = 'left' }: { dir?: 'left' | 'right' }) {
  if (dir === 'left') {
    return (
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="22" y1="12" x2="10" y2="24" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1="22" y1="36" x2="10" y2="24" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="12" x2="22" y2="24" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="36" x2="22" y2="24" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function PortalChevrons({
  leftStyle,
  rightStyle,
}: {
  leftStyle?: React.CSSProperties;
  rightStyle?: React.CSSProperties;
}) {
  const [disabledPrev, setDisabledPrev] = useState(false);
  const [disabledNext, setDisabledNext] = useState(false);

  const defaultLeft = {
    position: 'fixed',
    left: 'calc(50% - 420px - 48px)',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 9999,
  } as React.CSSProperties;
  const defaultRight = {
    position: 'fixed',
    left: 'calc(50% + 420px + 12px)',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 9999,
  } as React.CSSProperties;

  const left = leftStyle && (leftStyle.left !== undefined || leftStyle.top !== undefined) ? leftStyle : defaultLeft;
  const right =
    rightStyle && (rightStyle.left !== undefined || rightStyle.top !== undefined) ? rightStyle : defaultRight;

  const el = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const container = document.createElement('div');
    document.body.appendChild(container);
    try { console.debug('[PortalChevrons] portal mounted'); } catch (e) {}
    return container;
  }, []);

  useEffect(() => {
    const onState = (e: any) => {
      try {
        setDisabledPrev(Boolean(e.detail && e.detail.disabledPrev));
        setDisabledNext(Boolean(e.detail && e.detail.disabledNext));
        try { console.debug('[PortalChevrons] historyState', e.detail); } catch (e) {}
      } catch {
        // ignore
      }
    };

    window.addEventListener('historyState', onState as EventListener);
    // mark global flag so parent can detect portal presence (fallback rendering)
    try { (window as any).__PORTAL_CHEVRONS_MOUNTED = true; } catch (e) {}
    return () => {
      window.removeEventListener('historyState', onState as EventListener);
      try {
        if (el && document.body.contains(el)) document.body.removeChild(el);
      } catch {
        // ignore
      }
      try { (window as any).__PORTAL_CHEVRONS_MOUNTED = false; } catch (e) {}
    };
  }, [el]);

  if (!el) return null;

  const leftBtnStyle: React.CSSProperties = {
    ...(left as React.CSSProperties),
    background: 'rgba(0,0,0,0.6)',
    borderRadius: '8px',
    padding: '10px',
    zIndex: 2147483647,
  };
  const rightBtnStyle: React.CSSProperties = {
    ...(right as React.CSSProperties),
    background: 'rgba(0,0,0,0.6)',
    borderRadius: '8px',
    padding: '10px',
    zIndex: 2147483647,
  };

  return createPortal(
    <>
      <button
        data-no-close
        onClick={() => window.dispatchEvent(new CustomEvent('historyNav', { detail: 'prev' }))}
        aria-label="prev"
        style={leftBtnStyle}
        className={`z-50 pointer-events-auto transition-opacity duration-150 ${disabledPrev ? 'opacity-40 pointer-events-none' : 'hover:opacity-100 focus:outline-none'}`}
      >
        <div style={{ width: 44, height: 64 }}>
          <ChevronSVG dir="left" />
        </div>
      </button>

      <button
        data-no-close
        onClick={() => window.dispatchEvent(new CustomEvent('historyNav', { detail: 'next' }))}
        aria-label="next"
        style={rightBtnStyle}
        className={`z-50 pointer-events-auto transition-opacity duration-150 ${disabledNext ? 'opacity-40 pointer-events-none' : 'hover:opacity-100 focus:outline-none'}`}
      >
        <div style={{ width: 44, height: 64 }}>
          <ChevronSVG dir="right" />
        </div>
      </button>
    </>,
    el,
  );
}
