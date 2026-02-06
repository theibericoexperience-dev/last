import React from 'react';

export type DayCardProps = {
  key: number;
  day: number;
  mapIdx: number;
  frontStops: string[];
  activities: string[];
  selectedDayNumber: number | null;
  flippedAll: boolean;
  isFlippedLocal: boolean;
  onSelectDay: (day: number | null) => void;
  setFlippedDay: React.Dispatch<React.SetStateAction<number | null>>;
  setFlippedAll: React.Dispatch<React.SetStateAction<boolean>>;
  commonCardStyle: React.CSSProperties;
  visibleDaysCount: number;
  visibleRow: number | null;
  hoveredRow: number | null;
  setHoveredRow: React.Dispatch<React.SetStateAction<number | null>>;
};

export function DayCard({
  key,
  day,
  mapIdx,
  frontStops,
  activities,
  selectedDayNumber,
  flippedAll,
  isFlippedLocal,
  onSelectDay,
  setFlippedDay,
  setFlippedAll,
  commonCardStyle,
  visibleDaysCount,
  visibleRow,
  hoveredRow,
  setHoveredRow
}: DayCardProps) {
  const idx = mapIdx;
  // stagger delay per card for flip animation (forward and reverse)
  const maxDelay = Math.min(120, (visibleDaysCount - 1) * 40);
  const delayMs = Math.min(120, idx * 40);
  let appliedDelay = 0;
  if (flippedAll) appliedDelay = delayMs;
  else if (isFlippedLocal) appliedDelay = 0;
  else appliedDelay = maxDelay - delayMs;

  return (
    <div
      key={key}
      role="button"
      tabIndex={0}
      className={`relative rounded-lg text-[11px] transition-all duration-150 cursor-pointer focus:outline-none flex ${selectedDayNumber !== null && visibleRow !== null && Math.floor(mapIdx / 5) !== visibleRow && Math.floor(mapIdx / 5) !== hoveredRow ? 'card-with-blur' : ''}`}
      style={Object.assign({ padding: 0, boxSizing: 'border-box', perspective: '800px' }, commonCardStyle, selectedDayNumber === day ? { zIndex: 10 } : {}) as React.CSSProperties}
      onClick={() => {
        // If clicking the already-selected day, toggle its flipped state.
        if (selectedDayNumber === day) {
          // clicking an individual day should disable the global flip
          setFlippedAll(false);
          setFlippedDay((prev) => (prev === day ? null : day));
        } else {
          onSelectDay(day);
        }
      }}
      onMouseEnter={() => setHoveredRow(Math.floor(mapIdx / 5))}
      onMouseLeave={() => setHoveredRow(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (selectedDayNumber === day) setFlippedDay((prev) => (prev === day ? null : day));
          else onSelectDay(day);
        }
      }}
    >
      <div className={`card-inner ${(flippedAll || isFlippedLocal) ? 'is-flipped' : ''}`} style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d', WebkitTransformOrigin: 'center center', transformOrigin: 'center center', transition: 'transform 520ms cubic-bezier(.2,.8,.2,1)', willChange: 'transform', transform: (flippedAll || isFlippedLocal) ? 'rotateY(180deg) translateZ(0)' : 'none', transitionDelay: `${appliedDelay}ms` }}>
        {/* front */}
        <div className={`card-front absolute inset-0 rounded-lg interactive-card ${selectedDayNumber === day ? 'selected border-[#007CFF] border-4' : 'border border-black'}`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: 5, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div className="font-bold text-[11px] text-gray-900 mb-1" style={{ textTransform: 'uppercase' }}>DAY {day}</div>
          <div className="flex flex-col items-center text-[12px] text-gray-900 leading-tight flex-grow w-full justify-center">
            {frontStops.map((stop: string, idx2: number) => (
              <span key={idx2} className="w-full text-center break-words whitespace-normal max-w-full px-1 py-0.5 font-semibold text-gray-900" style={{ marginTop: idx2 > 0 ? 4 : 0, marginBottom: 2, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{String(stop).toUpperCase()}</span>
            ))}
          </div>
        </div>
        {/* back */}
        <div className={`card-back absolute inset-0 rounded-lg interactive-card ${selectedDayNumber === day ? 'selected border-[#007CFF] border-4' : 'border border-gray-200'}`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: 4, transform: 'rotateY(180deg)', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', boxSizing: 'border-box', overflow: 'hidden' }}>
          <div className="font-bold text-[11px] text-gray-900 mb-1" style={{ textTransform: 'uppercase' }}>DAY {day}</div>
          <div className="flex flex-col items-center text-[11px] text-gray-900 leading-tight flex-grow w-full justify-center">
            {activities.slice(0,2).map((act: string, aidx: number) => (
              <span key={aidx} className="w-full text-center break-words whitespace-normal max-w-full px-1 py-0.5 font-semibold text-gray-900" style={{ marginTop: aidx > 0 ? 6 : 0, marginBottom: 2, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{String(act).toUpperCase()}</span>
            ))}
          </div>
        </div>
      </div>
      {selectedDayNumber !== null && visibleRow !== null && Math.floor(mapIdx / 5) !== visibleRow && Math.floor(mapIdx / 5) !== hoveredRow && (
              <div className="absolute inset-0 bg-black/2 backdrop-blur-sm rounded-lg z-20 pointer-events-none blur-overlay"></div>
            )}
    </div>
  );
}