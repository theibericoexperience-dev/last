"use client";
import React from 'react';
import InteractiveMap from '../../components/InteractiveMap';
import { useMap } from '../providers/MapProvider';

export default function PersistentInteractiveMap() {
  const { mapOpen, closeMap } = useMap();
  return <InteractiveMap open={mapOpen} onCloseAction={closeMap} />;
}
