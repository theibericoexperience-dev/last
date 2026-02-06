// Domain contracts for Orders (business backbone)
// Keep these types stable to avoid UI-driven coupling.

export type OrderStatus = 'draft' | 'submitted' | 'paid' | string;

export type OrderType = 'fixed' | 'private' | string;

export type Order = {
  id: string;
  user_id?: string | null;
  type: OrderType;
  tour_id?: string | null;
  tour_title?: string | null;
  travelers_count?: number | null;
  status?: OrderStatus | null;
  reference_code?: string | null;

  // Payments
  stripe_session_id?: string | null;

  // Deposit amounts (may be synthesized by API for backward-compatible DB schemas)
  per_person_deposit_usd?: number | null;
  deposit_total_usd?: number | null;

  // Extras/addons
  extras?: Record<string, unknown> | null;

  created_at?: string | null;
};

export type OrdersListResponse = { orders: Order[] };

export type CreateOrderInput = {
  type: 'fixed' | 'private';
  tourId?: string | null;
  tourTitle?: string | null;
  travelersCount?: number;
  extras?: Record<string, unknown>;
};

export type CreateOrderResponse = { order: Order };
