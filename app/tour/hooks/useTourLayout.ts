import React from 'react';

export type LayoutRefs = {
  dayPanelRef: React.RefObject<HTMLElement | null>;
  mapWrapperRef: React.RefObject<HTMLElement | null>;
  tabsColRef: React.RefObject<HTMLElement | null>;
  leftColRef: React.RefObject<HTMLElement | null>;
  mediaRef: React.RefObject<HTMLElement | null>;
  modalBoxRef: React.RefObject<HTMLElement | null>;
  headerRef: React.RefObject<HTMLElement | null>;
};

export type MapPad = { left: number; right: number; bottom: number };

export type UseTourLayoutOptions = {
  initialSelectedDay?: number | null;
};

export type UseTourLayoutReturn = {
  // selection
  selectedDay: number | null;
  setSelectedDay: (d: number | null) => void;

  // refs (typed, but no DOM reads inside this hook)
  refs: LayoutRefs;

  // measurement setters (components or effects external to this hook will call these)
  setContainerHeight: (h: number | null) => void;
  setContentHeight: (h: number | null) => void;
  setMapPad: (p: MapPad) => void;

  // derived read-only values
  containerHeightPx: number | null;
  contentHeightPx: number | null;
  computedPanelInnerHeight: number | null;
  mapPad: MapPad;

  // composability helpers
  computeDaysToShow: (availableDays: number[]) => number[];
  getScrollTargetForDay: (day: number) => { ref: keyof LayoutRefs | null; offset: number | null };

  // mutable ref for consumers that need to track initial fit state
  didInitialFitRef: React.MutableRefObject<boolean>;
};

export function useTourLayout(opts: UseTourLayoutOptions = {}): UseTourLayoutReturn {
  const { initialSelectedDay = null } = opts;

  const [selectedDay, setSelectedDay] = React.useState<number | null>(initialSelectedDay);

  const refs: LayoutRefs = React.useRef({
    dayPanelRef: React.createRef<HTMLElement | null>(),
    mapWrapperRef: React.createRef<HTMLElement | null>(),
    tabsColRef: React.createRef<HTMLElement | null>(),
    leftColRef: React.createRef<HTMLElement | null>(),
    mediaRef: React.createRef<HTMLElement | null>(),
    modalBoxRef: React.createRef<HTMLElement | null>(),
    headerRef: React.createRef<HTMLElement | null>(),
  }).current;

  // measurements controlled externally (no DOM reads in this hook)
  const [containerHeightPx, setContainerHeightPx] = React.useState<number | null>(null);
  const [contentHeightPx, setContentHeightPx] = React.useState<number | null>(null);
  const [mapPad, setMapPadState] = React.useState<MapPad>({ left: 16, right: 16, bottom: 60 });

  // simple derived value: panel inner height is contentHeight minus a small header area
  const computedPanelInnerHeight = React.useMemo(() => {
    if (contentHeightPx == null) return null;
    // reserve 56px for controls/header inside the panel by default
    const v = Math.max(0, Math.round(contentHeightPx - 56));
    return v;
  }, [contentHeightPx]);

  const setContainerHeight = React.useCallback((h: number | null) => setContainerHeightPx(h), []);
  const setContentHeight = React.useCallback((h: number | null) => setContentHeightPx(h), []);
  const setMapPad = React.useCallback((p: MapPad) => setMapPadState(p), []);

  // helper: given a list of available days return a stable sorted window (no business logic)
  const computeDaysToShow = React.useCallback((availableDays: number[]) => {
    if (!Array.isArray(availableDays)) return [] as number[];
    const unique = Array.from(new Set(availableDays.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0))).sort((a, b) => a - b);
    return unique;
  }, []);

  // simple mapping from day -> preferred scroll target; purely declarative
  const getScrollTargetForDay = React.useCallback((day: number) => {
    // By convention: day panel content is primary, map is secondary
    if (typeof day !== 'number' || !Number.isFinite(day)) return { ref: null, offset: null };
    return { ref: 'dayPanelRef' as keyof LayoutRefs, offset: 0 };
  }, []);

  const didInitialFitRef = React.useRef(false);

  return {
    selectedDay,
    setSelectedDay,
    refs,
    setContainerHeight,
    setContentHeight,
    setMapPad,
    containerHeightPx,
    contentHeightPx,
    computedPanelInnerHeight,
    mapPad,
    computeDaysToShow,
    getScrollTargetForDay,
    didInitialFitRef,
  };
}

export default useTourLayout;

