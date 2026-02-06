// Ensure that a profile row exists for a given Supabase auth user.
import { apiFetch } from '@/lib/fetch/apiFetch';

export async function ensureProfileForAuthUser(authUser: { id: string; email?: string | null }) {
  if (!authUser || !authUser.id) return null;

  try {
    console.debug('[ensureProfile] GET /api/user/profile');
    const res = await apiFetch('/api/user/profile', { method: 'GET' });
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body && body.profile) return body.profile;
    } else {
      console.debug('[ensureProfile] GET profile returned', res.status);
    }
  } catch (e) {
    console.debug('[ensureProfile] GET profile error', e);
  }

  // No profile yet — attempt to upsert with user_id and email (email may be null and server handles it)
  try {
    const payload: any = { userId: authUser.id };
    if (authUser.email) payload.email = authUser.email;
    console.debug('[ensureProfile] PATCH /api/user/profile payload', payload);
    const res2 = await apiFetch('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (!res2.ok) {
      console.debug('[ensureProfile] PATCH returned', res2.status);
      return null;
    }
    const body2 = await res2.json().catch(() => ({}));
    return body2?.profile ?? null;
  } catch (e) {
    console.debug('[ensureProfile] PATCH error', e);
    return null;
  }
}

export default ensureProfileForAuthUser;
