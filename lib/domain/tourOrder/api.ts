// Domain wrapper for legacy tour-order endpoint
// NOTE: This endpoint is currently disabled server-side (410) in `app/api/tour-order/route.ts`.
// Keep this wrapper so UI code never calls `/api/*` directly, and so migration is reversible.

import { apiFetch } from '@/lib/fetch/apiFetch';

export type CreateTourOrderInput = {
  title: string;
  requester?: string;
  contact?: string;
  notes?: string;
  countries: string[];
};

export type CreateTourOrderResponse = {
  ok: boolean;
  id?: string;
  error?: string;
};

export async function createTourOrder(input: CreateTourOrderInput): Promise<CreateTourOrderResponse> {
  const res = await apiFetch('/api/tour-order', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    return { ok: false, error: data?.error || 'legacy_endpoint_disabled' };
  }
  return data as CreateTourOrderResponse;
}
