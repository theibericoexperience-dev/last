export type OrderType = 'fixed' | 'private';

export type OrderStatus =
  | 'draft'
  | 'travelers_pending'
  | 'ready_for_deposit'
  | 'deposit_paid'
  | 'completed'
  | 'canceled';

export interface Order {
  id: string;
  user_id: string;
  type: OrderType;
  tour_id: string | null;
  tour_title: string | null;
  travelers_count: number;
  status: OrderStatus;
  per_person_deposit_usd: number;
  deposit_total_usd: number;
  extras: Record<string, any> | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Traveler {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  country: string | null;
  state: string | null;
  address: string | null;
  passport_number: string | null;
  medical_conditions: string | null;
  dietary_preferences: string | null;
  preferences: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallBooking {
  id: string;
  user_id: string;
  email: string;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  meet_link: string | null;
  status: 'pending' | 'confirmed' | 'canceled';
  created_at: string;
}

export interface UserProfileRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  country_code: string | null;
  marketing_opt_in: boolean | null;
  created_at: string;
  updated_at: string;
}

