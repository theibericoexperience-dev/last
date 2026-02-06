"use client";
import React, { useEffect, useRef, useState } from 'react';
// import InlineMap, { InlineMapHandle } from './InlineMap';
// import toursData from '../data/toursOverview';
import dynamic from 'next/dynamic';

const ModalTourGrid = dynamic(() => import('./ModalTourGrid'), { ssr: false });

type Props = { open?: boolean; onCloseAction?: () => void };

const DEFAULT_IMAGE = 'https://wqpyfdxbkvvzjoniguld.supabase.co/storage/v1/object/public/Open%20Tours/Open%20Tours/MADRID%20TO%20LISBOA/MAIN%20TOUR/madrid_tourcard.webp';

function safeWebPath(raw?: string | null) {
  if (!raw) return '';
  try {
    let s = String(raw);
    // If double-encoded (contains %25) try decoding once
    if (s.includes('%25')) {
      try { s = decodeURIComponent(s); } catch (e) { /* ignore */ }
    }
    // try decode if encoded
    try { s = decodeURIComponent(s); } catch (e) { /* ignore */ }
    if (!s.startsWith('/')) s = '/' + s;
    return encodeURI(s);
  } catch (e) { return String(raw); }
}

export default function TourSlotsModal({ open = false, onCloseAction }: Props) {
  if (!open) return null;

  // New: show the TourGrid modal instead of the old modal content
  return <ModalTourGrid onClose={() => onCloseAction?.()} />;
}


