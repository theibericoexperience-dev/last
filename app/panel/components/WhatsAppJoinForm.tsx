"use client";

import { useState } from 'react';
import { apiFetch } from '@/lib/fetch/apiFetch';

interface Props {
  onSaved?: () => void;
}

const COMMON_PREFIXES = ['+1', '+34', '+44', '+49', '+33', '+39'];

export default function WhatsAppJoinForm({ onSaved }: Props) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ whatsappCountryCode: countryCode, whatsappPhone: phone, whatsappOptIn: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || 'Failed to save');
        setLoading(false);
        return;
      }
      setSuccess(true);
      onSaved && onSaved();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  if (success) return <div className="text-sm text-green-700">Request sent. Thanks — we'll notify you when you're added.</div>;

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm"
        >
          {COMMON_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="612345678"
          className="flex-1 rounded-md border px-2 py-1 text-sm"
        />
      </div>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      <div className="mt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Request to be added to the group'}
        </button>
      </div>
    </form>
  );
}
