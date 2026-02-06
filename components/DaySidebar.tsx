import React, { useState, useEffect } from 'react';
import { useActivitiesByDay } from '../hooks/useActivitiesByDay';
import { useDaySidebarLayout } from '../hooks/useDaySidebarLayout';
import { ModeToggleCard } from './ModeToggleCard';
import { ExtensionCard } from './ExtensionCard';
import { DayCard } from './DayCard';
import { EXTENSIONS } from '../constants/extensions';
import { injectDaySidebarStyles } from '../styles/daySidebarStyles';

export type DaySidebarProps = {
  mode?: 'vertical' | 'horizontal' | 'initial';
  className?: string;
  totalDays?: number;
  selectedDayNumber?: number | null;
  panelInnerHeight?: number;
  dayStops?: Record<number, any>;
  onSelectDay?: (day: number | null) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onGeneralPrev?: () => void;
  onGeneralNext?: () => void;
  onModeSelect?: (mode: string) => void;
  flippedAll?: boolean;
  extensionsVisible?: boolean;
  showHeader?: boolean;
  showOnlyHeader?: boolean;
  gridCols?: number;
  gridRows?: number;
  collapsedRows?: number; // number of rows to show when collapsed (default 2)
  currentSubMode?: string;
};

export function DaySidebar(props: DaySidebarProps) {
  const {
    mode = 'vertical',
    className = '',
    totalDays = 14,
    selectedDayNumber = null,
    dayStops = {},
    onSelectDay,
    onModeSelect,
    flippedAll: initialFlippedAll = false,
    extensionsVisible: initialExtensionsVisible = false,
    showHeader = true,
    showOnlyHeader = false,
    gridCols = 5,
    gridRows,
    panelInnerHeight,
    collapsedRows = 2,
    currentSubMode
  } = props;

  // show all days by default
  const [expanded, setExpanded] = useState(false);
  // Track which day (if any) is flipped to show activities. Only that card will flip.
  const [flippedDay, setFlippedDay] = useState<number | null>(null);
  // If true, all day cards are flipped to show activities
  const [flippedAll, setFlippedAll] = useState(initialFlippedAll);
  const [extensionsVisible, setExtensionsVisible] = useState(initialExtensionsVisible);
  // Track which row is hovered to show all days in that row
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const { activitiesByDay } = useActivitiesByDay(totalDays);

  const layout = useDaySidebarLayout({
    totalDays,
    expanded,
    extensionsVisible,
    gridCols,
    gridRows,
    panelInnerHeight
  });

  const days = layout.days;

  const visibleRow = selectedDayNumber ? Math.floor(days.indexOf(selectedDayNumber) / layout.cols) : null;

  if (!expanded) {
    return (
      <div className={className}>
        <div className="grid grid-cols-4 gap-2">
          <ModeToggleCard
            key="itinerary"
            label="ITINERARY"
            onClick={() => setExpanded(true)}
            borderColor="border-black"
            commonCardStyle={layout.commonCardStyle}
          />
          <ModeToggleCard
            key="activities"
            label="ACTIVITIES"
            onClick={() => { setExpanded(true); setFlippedAll(true); }}
            borderColor="border-purple-600"
            commonCardStyle={layout.commonCardStyle}
          />
          <ModeToggleCard
            key="daybyday"
            label="DAY BY DAY"
            onClick={() => { setExpanded(true); onModeSelect?.('daybyday'); }}
            borderColor="border-blue-600"
            commonCardStyle={layout.commonCardStyle}
          />
          <ModeToggleCard
            key="extensions"
            label="EXTENSIONS"
            onClick={() => { setExpanded(true); setExtensionsVisible(true); }}
            borderColor="border-red-600"
            commonCardStyle={layout.commonCardStyle}
          />
        </div>
      </div>
    );
  }

  if (showOnlyHeader) {
    return (
      <div className={className}>
      </div>
    );
  }
  return (
    <div
      className={className}
      style={panelInnerHeight ? { height: panelInnerHeight, minHeight: 120, overflow: 'visible', display: 'flex', flexDirection: 'column' } : { height: '100%', minHeight: 0, overflow: 'visible', display: 'flex', flexDirection: 'column' }}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-2">
          {/* Botón 'Show less' eliminado */}
        </div>
      )}
      {/* The grid should always fill the available height, never scroll, and always show all rows. */}
      <div
        className="flex-1 min-h-0"
        style={{
          height: '100%',
          minHeight: 0,
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'stretch',
        }}
      >
        <div
          className={`grid gap-2 h-full day-grid`}
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${layout.rows}, ${layout.COMMON_CARD_HEIGHT_PX}px)`,
            alignContent: layout.alignContentValue as any,
            height: '100%',
            minHeight: 0,
            overflow: 'visible',
            ['--common-card-height' as any]: `${layout.COMMON_CARD_HEIGHT_PX}px`
          }}
        >
        {layout.days.slice(0, layout.visibleDaysCount).map((day, mapIdx) => {
          const frontStops = (dayStops[day] && Array.isArray(dayStops[day]) ? dayStops[day] : dayStops[day]?.paradas || []);
          const activities = activitiesByDay[day] || [];
          const isFlippedLocal = flippedDay === day;
          return (
            <DayCard
              key={day}
              day={day}
              mapIdx={mapIdx}
              frontStops={frontStops}
              activities={activities}
              selectedDayNumber={selectedDayNumber}
              flippedAll={flippedAll}
              isFlippedLocal={isFlippedLocal}
              onSelectDay={onSelectDay}
              setFlippedDay={setFlippedDay}
              setFlippedAll={setFlippedAll}
              commonCardStyle={layout.commonCardStyle}
              visibleDaysCount={layout.visibleDaysCount}
              visibleRow={visibleRow}
              hoveredRow={hoveredRow}
              setHoveredRow={setHoveredRow}
            />
          );
        })}
        <ModeToggleCard
          key="itinerary-card"
          label="HIDE ITINERARY"
          onClick={() => setExpanded(false)}
          borderColor="border-black"
          commonCardStyle={layout.commonCardStyle}
          ariaPressed={expanded}
          isButton={true}
        />
        <ModeToggleCard
          key="activities-card"
          label="ACTIVITIES"
          onClick={() => { setFlippedDay(null); setFlippedAll(true); }}
          borderColor="border-purple-600"
          commonCardStyle={layout.commonCardStyle}
          ariaPressed={flippedAll}
          isButton={true}
        />
        <ModeToggleCard
          key="daybyday-card"
          label="DAY BY DAY"
          onClick={() => onModeSelect?.('daybyday')}
          borderColor="border-blue-600"
          commonCardStyle={layout.commonCardStyle}
        />
        <ModeToggleCard
          key="extensions-toggle"
          label={extensionsVisible ? 'HIDE EXTENSIONS' : 'EXTENSIONS'}
          onClick={() => setExtensionsVisible(s => !s)}
          borderColor="border-red-600"
          commonCardStyle={layout.commonCardStyle}
          ariaPressed={extensionsVisible}
          isButton={true}
        />
        {extensionsVisible && EXTENSIONS.map((ext, ei) => (
          <ExtensionCard key={`ext-${ei}`} ext={ext} commonCardStyle={layout.commonCardStyle} />
        ))}
        </div>
      </div>
    </div>
  );
}

export default DaySidebar;

// Inject styles
injectDaySidebarStyles();













































































































































































































































































































































































































































