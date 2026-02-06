import { TourCanonical, DEFAULT_TOUR_CANONICAL } from '../lib/domain/tour-canonical';

// Minimal per-tour canonical overrides. Real per-tour data will be populated from CMS or DB later.
const tourCanonicals: Record<string, Partial<TourCanonical>> = {
  'madrid-2026': {
    tourId: 'madrid-2026',
    title: 'Madrid to Lisbon 2026',
    // use defaults but allow explicit fields if needed
    currency: 'USD',
    deposit: DEFAULT_TOUR_CANONICAL.deposit,
    extensions: DEFAULT_TOUR_CANONICAL.extensions,
    insurance: DEFAULT_TOUR_CANONICAL.insurance,
    single_supplement_and_room: DEFAULT_TOUR_CANONICAL.single_supplement_and_room,
    pdf_ticket: 'yes',
    per_tour_overrides_allowed: true,
    deposit_refund_policy: DEFAULT_TOUR_CANONICAL.deposit_refund_policy,
  },
};

export default tourCanonicals;
