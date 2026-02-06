import { useMemo } from 'react';

export function useDaySidebarLayout({
  totalDays,
  expanded,
  extensionsVisible,
  gridCols,
  gridRows,
  panelInnerHeight
}: {
  totalDays: number;
  expanded: boolean;
  extensionsVisible: boolean;
  gridCols: number;
  gridRows: number;
  panelInnerHeight?: number;
}) {
  const days = useMemo(() => Array.from({ length: totalDays }, (_, i) => i + 1), [totalDays]);
  // Fixed grid: 5 columns x 4 rows = 20 slots maximum
  const cols = gridCols || 5; // default to 5 columns
  const rows = gridRows || 4; // default to 4 rows
  const TARGET_VISIBLE = cols * rows; // 20 by default

  // Count reserved toggle slots: ACTIVITIES, EXTENSIONS, and ITINERARY toggles occupy slots too
  const RESERVED_TOGGLES = expanded ? 4 : 3; // itinerary + activities + extensions + daybyday when expanded
  const extensionCardsCount = extensionsVisible ? 4 : 0; // EXTENSIONS.length is 4

  // Available slots for day cards after reserving space for toggles and extension cards
  const availableForDays = Math.max(0, TARGET_VISIBLE - RESERVED_TOGGLES - extensionCardsCount);
  const visibleDaysCount = expanded ? Math.min(totalDays, availableForDays) : 0;

  // Compute per-card height in px when panelInnerHeight is provided so cards can be taller
  const GAP_PX = 8; // gap-2 -> 8px
  const headerPx = 40; // space for header area
  const outerPaddingPx = 8; // breathing room
  let cardHeightPx: number | undefined = undefined;
  if (panelInnerHeight && typeof panelInnerHeight === 'number') {
    // Reserve a small safety margin (-2px) to avoid rounding/box-model clipping
    const available = Math.max(0, panelInnerHeight - headerPx - outerPaddingPx - 2);
    const totalGaps = Math.max(0, (rows - 1) * GAP_PX);
    const per = Math.floor((available - totalGaps) / rows);
    // Prefer a larger, more comfortable minimum card height so rows occupy
    // more of the available vertical space. Do not aggressively shave pixels
    // here — rely on clamping instead so we don't accidentally underflow.
    cardHeightPx = Math.max(120, Math.min(360, per));
  }

  // Common card style: ensure all cards have identical height.
  // Use a slightly larger fallback so cards look roomier when measurement
  // is not yet available.
  const COMMON_CARD_HEIGHT_PX = cardHeightPx ?? 140;
  const commonCardStyle = { height: `${COMMON_CARD_HEIGHT_PX}px`, minHeight: COMMON_CARD_HEIGHT_PX, maxHeight: COMMON_CARD_HEIGHT_PX, overflow: 'hidden' } as React.CSSProperties;

  // Determine whether to center the grid content vertically within the provided panelInnerHeight.
  const totalGapsGrid = Math.max(0, (rows - 1) * GAP_PX);
  const totalGridHeight = rows * COMMON_CARD_HEIGHT_PX + totalGapsGrid;
  const containerInnerHeight = panelInnerHeight && typeof panelInnerHeight === 'number' ? Math.max(0, (panelInnerHeight as number) - 8) : null;
  const alignContentValue = containerInnerHeight && containerInnerHeight > totalGridHeight ? 'center' : 'stretch';

  return {
    days,
    cols,
    rows,
    TARGET_VISIBLE,
    RESERVED_TOGGLES,
    extensionCardsCount,
    availableForDays,
    visibleDaysCount,
    GAP_PX,
    headerPx,
    outerPaddingPx,
    cardHeightPx,
    COMMON_CARD_HEIGHT_PX,
    commonCardStyle,
    totalGapsGrid,
    totalGridHeight,
    containerInnerHeight,
    alignContentValue
  };
}