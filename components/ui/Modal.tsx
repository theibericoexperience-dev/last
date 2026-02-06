"use client";

import React, { useEffect } from 'react';

type ModalProps = {
  open: boolean;
  onCloseAction: () => void;
  children: React.ReactNode;
  maxWidth?: string;
};

export default function Modal({ open, onCloseAction, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseAction();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCloseAction]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
  <div className="fixed inset-0 z-[200] flex items-center justify-center" aria-modal role="dialog" onMouseDown={(e) => { if (e.target === e.currentTarget) onCloseAction(); }}>
      <div className="absolute inset-0 bg-black/50" />

      <div className={`relative z-10 w-full mx-4 ${maxWidth}`}>
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-black/5 modal-panel">
          <button aria-label="Close modal" onClick={onCloseAction} className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">×</button>
          {children}
        </div>
      </div>
    </div>
  );
}
