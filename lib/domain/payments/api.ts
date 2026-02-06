import type { CreateCheckoutSessionInput, CreateCheckoutSessionResponse } from './types';
import { apiFetch } from '@/lib/fetch/apiFetch';

export async function createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResponse> {
  const res = await apiFetch('/api/payments/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create checkout session');
  }
  return (await res.json()) as CreateCheckoutSessionResponse;
}
