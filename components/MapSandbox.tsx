"use client";
import React from 'react';
import InlineMap from './InlineMap';

export default function MapSandbox() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 10, background: '#111', color: '#fff' }}>
        <strong>Map Sandbox</strong> — this mounts the InlineMap component directly (no provider).
      </div>
      <div style={{ flex: 1 }}>
        <InlineMap />
      </div>
    </div>
  );
}
