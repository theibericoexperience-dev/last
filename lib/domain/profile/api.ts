import type { GetProfileResponse, PatchProfileInput, PatchProfileResponse } from './types';
import { apiFetch } from '@/lib/fetch/apiFetch';

export async function getUserProfile(signal?: AbortSignal): Promise<GetProfileResponse> {
  const res = await apiFetch('/api/user/profile', { method: 'GET', signal });
  // Note: server may return 401 for guests; callers decide how to handle.
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to load profile');
  }
  return (await res.json()) as GetProfileResponse;
}

export async function patchUserProfile(input: PatchProfileInput): Promise<PatchProfileResponse> {
  const res = await apiFetch('/api/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to save profile');
  }
  return (await res.json()) as PatchProfileResponse;
}
