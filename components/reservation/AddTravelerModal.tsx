"use client";

import React, { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (traveler: any) => Promise<void> | void;
  initial?: any;
}

export default function AddTravelerModal({ open, onClose, onSave, initial }: Props) {
  const [fullName, setFullName] = useState(initial?.fullName || '');
  const [birthDate, setBirthDate] = useState(initial?.birthDate || '');
  const [passportNumber, setPassportNumber] = useState(initial?.passportNumber || '');
  const [nationality, setNationality] = useState(initial?.nationality || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Add traveler</h3>
        <div className="mt-4 grid gap-3">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="rounded-lg border px-3 py-2" />
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="rounded-lg border px-3 py-2" />
          <input value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="Passport number" className="rounded-lg border px-3 py-2" />
          <input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="Nationality" className="rounded-lg border px-3 py-2" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="rounded-lg border px-3 py-2" />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded border px-4 py-2">Cancel</button>
          <button
            onClick={async () => {
              if (!fullName) return alert('Please enter a name');
              setSaving(true);
              try {
                await onSave({ fullName, birthDate, passportNumber, nationality, notes });
                onClose();
              } catch (e) {
                console.error(e);
                alert('Failed to save traveler');
              } finally {
                setSaving(false);
              }
            }}
            className="rounded bg-emerald-600 px-4 py-2 text-white"
            disabled={saving}
          >{saving ? 'Saving...' : 'Save traveler'}</button>
        </div>
      </div>
    </div>
  );
}
