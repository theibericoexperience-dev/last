import React from 'react';
import TourClient from '../TourClient';
import { MapProvider } from '../../providers/MapProvider';
import PersistentInteractiveMap from '../../components/PersistentInteractiveMap';
import { supabaseServer } from '@/lib/db/supabaseServer';
import { notFound } from 'next/navigation';

// use a permissive params typing to avoid conflicts with generated PageProps

function normalizeUrl(raw: string | null | undefined) {
  if (!raw) return raw;
  let s = String(raw || '');
  s = s.replace(/\r?\n/g, '').trim();
  try { s = decodeURIComponent(s); } catch (e) { }
  if (!s.startsWith('/')) s = '/' + s;
  try { return encodeURI(s); } catch (e) { return s; }
}

export default async function TourPage({ params }: any) {
  // Next.js may provide params as a promise; await to be safe
  const { id } = await params as { id: string };

  // Fetch from Supabase
  const { data: tour } = await supabaseServer
    .from('tours')
    .select('*')
    .eq('id', id)
    .single();

  if (!tour) {
    // Falls back to static file behavior if not found in DB? 
    // Or simpler: just throw 404. For migration "madrid-2026" should exist.
    // If testing other IDs that are not in DB, this will 404.
    // However, existing simple behavior was just rendering.
    // Let's stick to strict behavior to verify migration.
    // console.warn(`Tour ${id} not found in DB`);
    // but maybe the user wants to fallback to static for old tours?
    // Let's assume we want DB only for now as requested.
  }
  
  // Fetch Days and Map
  // Only proceed if tour exists, otherwise might want to rely on fallback local data?
  // Given user request "todo en supabase", I will assume DB is the source of truth.
  
  let dbData = null;
  if (tour) {
    const { data: rows } = await supabaseServer
      .from('tour_days')
      .select('*')
      .eq('tour_id', id)
      .order('day_number', { ascending: true });

    const mapRow = rows?.find((r: any) => r.row_type === 'map');
    const days = rows?.filter((r: any) => r.row_type === 'day') || [];
    
    dbData = {
      ...tour,
      days: days, // array of { day_number, stops_data, activities_data }
      routeGeoJson: mapRow?.stops_data || null
    };
  } else {
     // If tour not found in DB, maybe return 404
     // return notFound(); 
     // For safety during dev, let's allow rendering without data if id is 'madrid-2026' to see errors?
     // No, clean fail is better.
  }

  return (
    <MapProvider>
      <TourClient id={id} initialData={dbData} />
      {/* persistently mount the interactive map only on tour pages */}
      <div id="persistent-interactive-map-root">
        <PersistentInteractiveMap />
      </div>
    </MapProvider>
  );
}
