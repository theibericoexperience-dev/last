"use client";

import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/db/supabaseClient';
import useReservationStore from '@/lib/reservations/store';
import { apiFetch } from '@/lib/fetch/apiFetch';

type Profile = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  receiveGeneralCommunications?: boolean | null;
};

const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/HOj3LzBchPEAzm0sDKnEUd';

export default function ProfileSection({ loading }: { loading?: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/user/profile', { method: 'GET' });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();

        // API shape in this repo is { profile: {...} | null }
        const p = (data && typeof data === 'object' && 'profile' in data) ? (data as any).profile : data;

        // If no profile row yet, still show the form with empty defaults.
        setProfile({
          email: p?.email ?? '',
          firstName: p?.firstName ?? p?.first_name ?? '',
          lastName: p?.lastName ?? p?.last_name ?? '',
          receiveGeneralCommunications:
            p?.receiveGeneralCommunications ?? p?.receive_general_communications ?? false,
        });
      } catch (err) {
        console.error(err);
        // Show empty form instead of staying in loading state
        setProfile({ email: '', firstName: '', lastName: '', receiveGeneralCommunications: false });
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const handleChange = (k: keyof Profile, v: any) => {
    setProfile((p) => ({ ...(p ?? {}), [k]: v }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      const p = (data && typeof data === 'object' && 'profile' in data) ? (data as any).profile : data;
      setProfile({
        email: p?.email ?? '',
        firstName: p?.firstName ?? p?.first_name ?? '',
        lastName: p?.lastName ?? p?.last_name ?? '',
        receiveGeneralCommunications: p?.receiveGeneralCommunications ?? p?.receive_general_communications ?? false,
      });
      setMessage('Saved');
    } catch (err) {
      console.error(err);
      setMessage('Error saving profile');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const handleWhatsAppJoin = async () => {
    // Open the configured WhatsApp community group in a new tab.
    // Note: `wa.me/<phone>` opens a direct chat, not a group join link.
    window.open(WHATSAPP_COMMUNITY_URL, '_blank');
  };

  const handleLogout = async () => {
    try {
      // Clear local reservation store so user data isn't visible after logout
      try {
        const store = useReservationStore.getState ? useReservationStore.getState() : null;
        if (store && typeof store.clear === 'function') store.clear();
      } catch (e) {
        // ignore
      }

      // Sign out from Supabase to clear its session/cookie
      try {
        if (supabaseClient && supabaseClient.auth && typeof supabaseClient.auth.signOut === 'function') {
          await supabaseClient.auth.signOut();
        }
      } catch (e) {
        console.error('Supabase signOut failed', e);
      }

      // Redirect to home after sign out
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed', err);
      // Best-effort redirect
      window.location.href = '/';
    }
  };

  if (loading || !loaded) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 space-y-3">
          <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Basic account settings</p>
        {profile?.email && (
          <p className="mt-1 text-sm text-slate-500">You are logged in as {profile.email}</p>
        )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col">
          <span className="text-sm text-slate-600">First name</span>
          <input
            value={profile.firstName ?? ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="mt-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-slate-600">Last name</span>
          <input
            value={profile.lastName ?? ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="mt-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col sm:col-span-2">
          <span className="text-sm text-slate-600">Email</span>
          <input
            value={profile.email ?? ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="mt-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Edit'}
        </button>

        <button
          onClick={handleWhatsAppJoin}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Join the WhatsApp community
        </button>

        <button
          onClick={() => setConfirmLogoutOpen(true)}
          className="ml-auto inline-flex items-center rounded-full border border-transparent bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
        >
          Log out
        </button>
      </div>

      {message && <div className="mt-3 text-sm text-slate-700">{message}</div>}

        {/* Logout confirmation modal */}
        {confirmLogoutOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40">
            <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-900">Confirm logout</h3>
              <p className="mt-3 text-sm text-slate-600">You will be logged out and any local draft reservation data will be cleared from this browser. You will need to sign in again to access your dashboard.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setConfirmLogoutOpen(false)} className="rounded border px-4 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    setConfirmLogoutOpen(false);
                    await handleLogout();
                  }}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >Confirm logout</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
