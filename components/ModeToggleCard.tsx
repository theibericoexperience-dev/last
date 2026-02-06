import React from 'react';

export type ModeToggleCardProps = {
  key: string;
  label: string;
  onClick: () => void;
  borderColor: string;
  commonCardStyle: React.CSSProperties;
  ariaPressed?: boolean;
  isButton?: boolean;
};

export function ModeToggleCard({
  key,
  label,
  onClick,
  borderColor,
  commonCardStyle,
  ariaPressed,
  isButton = false
}: ModeToggleCardProps) {
  return (
    <div key={key} className={`flex items-center justify-center rounded-lg interactive-card border-2 ${borderColor} text-xs px-1 py-1 bg-black text-white transition-all duration-150 cursor-pointer`} style={Object.assign({}, commonCardStyle)}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {isButton ? (
          <button type="button" onClick={onClick} aria-pressed={ariaPressed} className="w-full h-full flex flex-col items-center justify-center rounded-lg focus:outline-none font-bold" style={{ textTransform: 'uppercase' }}>
            <div className="text-base md:text-lg">{label}</div>
          </button>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center rounded-lg focus:outline-none font-bold" style={{ textTransform: 'uppercase' }} onClick={onClick}>
            <div className="text-base md:text-lg">{label}</div>
          </div>
        )}
        <div aria-hidden className="card-shine" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none' }}>
          <div className="card-beam" />
        </div>
      </div>
    </div>
  );
}