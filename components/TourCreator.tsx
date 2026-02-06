"use client";
import React, { useEffect, useRef, useState } from 'react';
import InlineMap from './InlineMap';
import { createTourOrder } from '@/lib/domain/tourOrder/api';

type Props = { open: boolean; onCloseAction: () => void };

export default function TourCreator({ open, onCloseAction }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [requester, setRequester] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // When user clicks a country in the WorldMapWrapper, it calls onSelect with the country id
  const onMapSelect = (id: string) => {
    try {
      const code = String(id || '').toUpperCase();
      if (!code) return;
      setSelected((prev) => {
        if (prev.includes(code)) return prev;
        return [...prev, code];
      });
    } catch (e) {}
  };

  const removeCountry = (code: string) => {
    setSelected((prev) => prev.filter((p) => p !== code));
  };

  const submitOrder = async () => {
    if (!title || selected.length === 0 || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const body = { title, requester, contact, notes, countries: selected };
      const data = await createTourOrder(body);
      if (!data?.ok) throw new Error(data?.error || 'server error');
      setMessage('Pedido creado (id: ' + data.id + ')');
      setSelected([]);
      setTitle(''); setRequester(''); setContact(''); setNotes('');
    } catch (err: any) {
      console.error('submitOrder failed', err);
      setMessage('Error al enviar el pedido: ' + String(err.message || err));
    } finally { setSubmitting(false); }
  };

  if (!open) return null;

  // prefer local background if available, else fallback to the demo image hosted in the repo
  const localBg = '/map-backgrounds/world-physical.png';
  const fallbackBg = 'https://raw.githubusercontent.com/raphaellepuschitz/SVG-World-Map/master/demo/img/world-physical.png';
  const backgroundImage = localBg; // WorldMapWrapper will try local first and if not available the library will handle it

  // Options to pass to svgWorldMap initializer: transparent province fills so background shows through
  const mapOptions = {
    bigMap: true,
    showInfoBox: false,
    backgroundImage: backgroundImage || fallbackBg,
    provinceFill: { out: 'rgba(255,255,255,0)', over: 'rgba(255,255,255,0.25)', click: 'rgba(255,255,255,0.6)' },
    provinceStroke: { out: 'rgba(0,0,0,0.25)', over: 'rgba(0,0,0,0.4)', click: 'rgba(0,0,0,0.6)' },
    countryStrokeWidth: { out: '0', over: '0.3', click: '0.5' },
    trackCoords: true,
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="relative bg-transparent w-full max-w-5xl p-4" style={{ zIndex: 910 }}>
        <div className="relative bg-white/95 rounded-lg shadow-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Tour Creator — Mapa</h3>
              <button onClick={onCloseAction} className="text-gray-600">Cerrar</button>
            </div>
              <div className="w-full h-96 border rounded overflow-hidden">
              <InlineMap className="w-full h-full" />
            </div>
          </div>

          <div className="col-span-1 space-y-3">
            <div>
              <label className="block text-sm font-medium">Paises seleccionados</label>
              <div className="mt-2 max-h-36 overflow-auto p-1 rounded">
                {selected.length === 0 ? <div className="text-sm text-gray-500">Ninguno</div> : selected.map((c) => (
                  <div key={c} className="flex items-center justify-between py-1">
                    <div className="text-sm">{c}</div>
                    <button className="text-xs text-red-600" onClick={() => removeCountry(c)}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Título del pedido</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium">Solicitante</label>
              <input value={requester} onChange={(e) => setRequester(e.target.value)} className="w-full border p-2 rounded mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium">Contacto</label>
              <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full border p-2 rounded mt-1" />
            </div>

            <div>
              <label className="block text-sm font-medium">Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border p-2 rounded mt-1" />
            </div>

            <div className="flex items-center gap-2">
              <button onClick={submitOrder} disabled={!title || selected.length === 0 || submitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{submitting ? 'Enviando...' : 'Generar pedido'}</button>
              <button onClick={() => setSelected([])} className="px-3 py-2 bg-gray-200 rounded">Vaciar</button>
            </div>

            {message && <div className="mt-2 text-sm text-gray-700">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

