import React from 'react';

// Phase 2: useTourItinerary
// Contract (minimal):
// - Input: optional initial raw itinerary object (Record<number, any> or null)
// - Outputs: itinerary array (ItDay[]), setters and small accessors
// - No JSX, no global side-effects. Hook owns in-memory parsed state only.

export type ItDay = {
  day: number;
  title?: string;
  alojamiento?: string;
  paradas?: string[];
  actividades?: string[];
  destacado?: string;
  files?: string[]; // list of media file paths (if available)
};

function safeString(v: unknown): string | undefined {
  if (v == null) return undefined;
  return String(v).trim() || undefined;
}

function toStringArray(v: unknown): string[] | undefined {
  if (!v) return undefined;
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string') return v ? [v] : undefined;
  return undefined;
}

export function parseRawItinerary(raw?: Record<number | string, any> | null): ItDay[] {
  if (!raw || typeof raw !== 'object') return [];
  const out: ItDay[] = [];
  for (const k of Object.keys(raw)) {
    // accept numeric keys or numeric-like strings
    const n = Number(k);
    if (!Number.isFinite(n)) continue;
    const entry = raw[k as any];
    if (entry == null) continue;
    const dayObj: ItDay = { day: n };
    if (entry.title) dayObj.title = safeString(entry.title);
    if (entry.alojamiento) dayObj.alojamiento = safeString(entry.alojamiento);
    if (entry.paradas) dayObj.paradas = toStringArray(entry.paradas);
    if (entry.actividades) dayObj.actividades = toStringArray(entry.actividades);
    if (entry.destacado) dayObj.destacado = safeString(entry.destacado);
    if (entry.files) dayObj.files = toStringArray(entry.files) || undefined;
    out.push(dayObj);
  }
  // sort by day ascending
  out.sort((a, b) => a.day - b.day);
  return out;
}

export type UseTourItineraryReturn = {
  itinerary: ItDay[];
  setItineraryFromRaw: (raw?: Record<number | string, any> | null) => void;
  setItinerary: (it: ItDay[]) => void;
  getDay: (day: number) => ItDay | undefined;
  daysList: () => number[];
};

export function useTourItinerary(initialRaw?: Record<number | string, any> | null): UseTourItineraryReturn {
  const [itinerary, setItineraryState] = React.useState<ItDay[]>(() => parseRawItinerary(initialRaw));

  const setItineraryFromRaw = React.useCallback((raw?: Record<number | string, any> | null) => {
    setItineraryState(parseRawItinerary(raw));
  }, []);

  const setItinerary = React.useCallback((it: ItDay[]) => {
    // make a shallow copy to avoid external mutation
    setItineraryState(it ? it.map((x) => ({ ...x })) : []);
  }, []);

  const getDay = React.useCallback((day: number) => itinerary.find((d) => d.day === day), [itinerary]);

  const daysList = React.useCallback(() => itinerary.map((d) => d.day), [itinerary]);

  return {
    itinerary,
    setItineraryFromRaw,
    setItinerary,
    getDay,
    daysList,
  };
}

export default useTourItinerary;
