import React from 'react';

export type ExtensionCardProps = {
  key: string;
  ext: { title: string; days: number; when: string };
  commonCardStyle: React.CSSProperties;
};

export function ExtensionCard({ key, ext, commonCardStyle }: ExtensionCardProps) {
  return (
    <div key={key} className={`flex items-center justify-center rounded-lg border-2 border-red-600 text-xs px-1 py-1 bg-black text-white transition-all duration-150`} style={Object.assign({}, commonCardStyle)}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center gap-1 p-2" style={{ textTransform: 'uppercase' }}>
          <div className="font-semibold text-sm text-white leading-tight">{ext.title}</div>
          <div className="text-[11px] text-white">{String(ext.days).toUpperCase()} DAYS</div>
          <div className="text-[10px] text-white/80">{ext.when}</div>
        </div>
        <div aria-hidden className="card-shine" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none' }}>
          <div className="card-beam" />
        </div>
      </div>
    </div>
  );
}