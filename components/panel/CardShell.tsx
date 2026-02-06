"use client";

import React from 'react';

type Props = {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  targetId?: string;
};

export default function CardShell({ title, subtitle, badge, children, defaultOpen = false, targetId }: Props) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="pr-3">
          <button
            aria-expanded={open}
            aria-controls={`card-${title.replace(/\s+/g, '-')}`}
            onClick={() => {
              setOpen((v) => !v);
              if (targetId) {
                const el = document.getElementById(targetId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="text-left"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{title}</p>
            {subtitle && <p className="mt-1 text-sm text-slate-700">{subtitle}</p>}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {badge}
          <button onClick={() => setOpen((v) => !v)} className="text-sm text-slate-500">
            {open ? 'Hide' : 'Open'}
          </button>
        </div>
      </div>

      <div id={`card-${title.replace(/\s+/g, '-')}`} className={`mt-4 overflow-hidden transition-[max-height,opacity] duration-300 ${open ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}
