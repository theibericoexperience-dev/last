import type { CreateOrderInput, CreateOrderResponse, OrdersListResponse } from './types';
import { apiFetch } from '@/lib/fetch/apiFetch';

// Client-safe wrappers (UI calls these; implementation stays stable)

export async function listOrders(signal?: AbortSignal): Promise<OrdersListResponse> {
  const res = await apiFetch('/api/orders', { method: 'GET', signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to load orders');
  }
  return (await res.json()) as OrdersListResponse;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  const res = await apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create order');
  }
  return (await res.json()) as CreateOrderResponse;
}
