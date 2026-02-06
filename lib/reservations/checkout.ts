/**
 * Orchestration helper for reservation checkout.
 * Converts the previous checkout.runtime.js into TypeScript.
 */
export type OrderLike = { id?: string; server_pricing?: any } & Record<string, any>;

export type CreateOrderFn = () => Promise<OrderLike>;
export type ConfirmFn = (opts: { order: OrderLike; serverPricing: any | null; clientTotalUsd?: number }) => Promise<boolean>;
export type CreateCheckoutSessionFn = (opts: { orderId: string }) => Promise<any>;

export type ProcessCheckoutResult =
  | { status: 'ok'; session: any; order: OrderLike }
  | { status: 'cancelled' }
  | { status: 'error'; error: string; order?: OrderLike };

export async function processCheckout({
  clientTotalUsd,
  createOrderFn,
  confirmFn,
  createCheckoutSessionFn,
}: {
  clientTotalUsd?: number;
  createOrderFn: CreateOrderFn;
  confirmFn: ConfirmFn;
  createCheckoutSessionFn: CreateCheckoutSessionFn;
}): Promise<ProcessCheckoutResult> {
  if (typeof createOrderFn !== 'function') throw new Error('createOrderFn required');
  if (typeof confirmFn !== 'function') throw new Error('confirmFn required');
  if (typeof createCheckoutSessionFn !== 'function') throw new Error('createCheckoutSessionFn required');

  // 1) create order on server (should return order with server_pricing when flag enabled)
  let order: OrderLike | null = null;
  try {
    order = await createOrderFn();
  } catch (err) {
    return { status: 'error', error: (err as any)?.message || String(err) };
  }

  if (!order || !order.id) return { status: 'error', error: 'Order creation failed' };

  const serverPricing = (order as any).server_pricing || null;
  // If server pricing present and differs, require confirmation
  if (serverPricing) {
    const serverTotal = serverPricing.total_guaranteed_price_usd;
    if (typeof clientTotalUsd !== 'undefined' && Number(serverTotal) !== Number(clientTotalUsd)) {
      try {
        const confirmed = await confirmFn({ order, serverPricing, clientTotalUsd });
        if (!confirmed) return { status: 'cancelled' };
      } catch (e) {
        return { status: 'error', error: (e as any)?.message || String(e), order };
      }
    }
  }

  // Proceed to create checkout session (server is authoritative for amounts)
  try {
    const session = await createCheckoutSessionFn({ orderId: String(order.id) });
    return { status: 'ok', session, order };
  } catch (err) {
    return { status: 'error', error: (err as any)?.message || String(err), order };
  }
}

export default processCheckout;
