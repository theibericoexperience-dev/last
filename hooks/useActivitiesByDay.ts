import { useState, useEffect } from 'react';

const ACTIVITY_POOL = [
  'HISTORIC WALKING TOUR',
  'CULTURAL DISCOVERIES',
  'GASTRONOMIC ACTIVITIES',
  'OWN LEISURE & RELAX',
  'EASY HIKE',
  'BOAT TOUR'
];

export function useActivitiesByDay(totalDays: number) {
  const [activitiesByDay, setActivitiesByDay] = useState<Record<number, string[]>>({});

  // persistent deterministic assignment of 2 activities per day
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const key = `ibero_activities_by_day_v1:${window.location.pathname || 'default'}`;
      const existing = window.localStorage.getItem(key);
      if (existing) {
        try { setActivitiesByDay(JSON.parse(existing)); return; } catch (e) { /* fallthrough */ }
      }
      const generated: Record<number, string[]> = {};
      const seedBase = (window.location.pathname || '') + '::activities';
      function hash(s: string) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
        return h;
      }
      for (let d = 1; d <= totalDays; d++) {
        const h = hash(seedBase + '::' + d);
        const idx1 = h % ACTIVITY_POOL.length;
        let idx2 = ((h >>> 8) % ACTIVITY_POOL.length);
        if (idx2 === idx1) idx2 = (idx2 + 1) % ACTIVITY_POOL.length;
        let picks = [ACTIVITY_POOL[idx1], ACTIVITY_POOL[idx2]];
        // ensure OWN LEISURE & RELAX appears for days 5-7
        if (d >= 5 && d <= 7) {
          if (!picks.includes('OWN LEISURE & RELAX')) picks[1] = 'OWN LEISURE & RELAX';
        }
        generated[d] = picks;
      }
      try { window.localStorage.setItem(key, JSON.stringify(generated)); } catch (e) {}
      setActivitiesByDay(generated);
    } catch (e) {}
  }, [totalDays]);

  return { activitiesByDay };
}