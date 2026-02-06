// LEGACY
// NOTE: historical helper kept for reversibility.
// It created an Order from a local reservation draft by POSTing to /api/orders.
// New code should use domain wrappers (`lib/domain/orders/api.ts`) instead.

import { apiFetch } from '@/lib/fetch/apiFetch';

export async function createOrderFromDraft(draft: any) {
  const body = {
    type: 'fixed',
    tourId: draft.tourId,
    tourTitle: draft.tourTitle,
    travelersCount: draft.travelers?.length || 0,
    extras: draft.trip?.addons || {},
  };

  const res = await apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create order');
  }
  const data = await res.json();
  return data.order;
}
