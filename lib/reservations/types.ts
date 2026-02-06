export type ReservationProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  countryCode?: string;
  marketingOptIn?: boolean;
};

export type FixedDeparture = {
  code: string;
  label: string;
  startDate: string;
  endDate: string;
};

export type TripPreference = {
  travelers: number;
  roomType: 'double' | 'single' | 'suite';
  fixedDeparture: FixedDeparture;
  addons: {
    preArrival: boolean;
    easter: boolean;
    azores: boolean;
  };
  comments?: string;
};

export type Traveler = {
  id: string;
  fullName: string;
  birthDate: string;
  passportNumber: string;
  nationality: string;
  dietaryNeeds?: string;
  emergencyContact?: string;
  notes?: string;
};

export type PaymentRecord = {
  id: string;
  method: 'card' | 'wire' | 'cash';
  label: string;
  status: 'pending' | 'authorized' | 'paid';
  last4?: string;
  provider?: string;
  amount?: number;
  updatedAt: string;
};

export type ReservationDraft = {
  id: string;
  tourId: string;
  tourTitle: string;
  createdAt: string;
  lastSavedAt: string;
  status: 'draft' | 'ready' | 'submitted' | 'confirmed';
  referenceCode?: string;
  trip: TripPreference;
  travelers: Traveler[];
  payments: PaymentRecord[];
};
