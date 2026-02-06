// Design/spec only: canonical Tour model and defaults
import { z } from 'zod';

export const DepositPolicySchema = z.object({
  amount_per_traveler_usd: z.number().optional(),
  extra_for_extension_usd: z.number().optional(),
  extra_for_single_traveler_usd: z.number().optional(),
  coverage: z.string(),
  payment_schedule: z.string(),
  deposit_type: z.string(),
});

export const ExtensionsPolicySchema = z.object({
  price_per_day_per_person_usd: z.number().optional(),
  notes: z.string(),
  extension_duration_impact: z.object({
    extend_tour: z.boolean(),
    extra_deposit_per_person_usd: z.number().optional(),
  }),
});

export const InsurancePolicySchema = z.object({
  travel_insurance_usd: z.number().optional(),
  cancellation_insurance_usd: z.number().optional(),
});

export const SingleSupplementAndRoomSchema = z.object({
  single_extra_per_day_usd: z.number().optional(),
  room_type_options: z.array(z.enum(['double', 'single'])),
});

export const DepositRefundPolicySchema = z.object({
  refundable_within_hours: z.number().optional(),
  after_48h: z.string(),
});

export const TourCanonicalSchema = z.object({
  tourId: z.string(),
  title: z.string().optional(),
  currency: z.literal('USD'),
  // Base price per traveler (USD) for the tour. If absent, UI/server may fall back to other sources.
  base_price_per_traveler_usd: z.number().optional(),
  deposit: DepositPolicySchema,
  extensions: ExtensionsPolicySchema,
  insurance: InsurancePolicySchema,
  single_supplement_and_room: SingleSupplementAndRoomSchema,
  pdf_ticket: z.literal('yes'),
  per_tour_overrides_allowed: z.boolean(),
  price_change_authority: z.string().optional(),
  pricing_override_policy: z.string().optional(),
  deposit_refund_policy: DepositRefundPolicySchema,
  extension_availability: z.object({
    per_tour_specific: z.boolean().optional(),
    repeated_tours_same_extensions: z.boolean().optional(),
  }).optional(),
  overrides: z.object({
    deposit_amount_per_traveler_usd: z.number().optional(),
    extensions_price_per_day_per_person_usd: z.number().optional(),
    single_extra_per_day_usd: z.number().optional(),
    travel_insurance_usd: z.number().optional(),
    cancellation_insurance_usd: z.number().optional(),
  }).optional(),
});

export type TourCanonical = z.infer<typeof TourCanonicalSchema>;

// Default canonical object reflecting the blocking decisions (used by the pricing endpoint when no per-tour data exists yet)
export const DEFAULT_TOUR_CANONICAL: TourCanonical = {
  tourId: 'DEFAULT',
  currency: 'USD',
  base_price_per_traveler_usd: 3500,
  deposit: {
    amount_per_traveler_usd: 1000,
    extra_for_extension_usd: 500,
    extra_for_single_traveler_usd: 500,
    coverage: 'flight and hotel',
    payment_schedule: 'remaining payment in 3 weeks',
    deposit_type: 'always 1000 per traveler',
  },
  extensions: {
    price_per_day_per_person_usd: 250,
    notes: '2 travelers per hotel room; if single, +500 at the end',
    extension_duration_impact: {
      extend_tour: true,
      extra_deposit_per_person_usd: 500,
    },
  },
  insurance: {
    travel_insurance_usd: 200,
    cancellation_insurance_usd: 500,
  },
  single_supplement_and_room: {
    single_extra_per_day_usd: 100,
    room_type_options: ['double', 'single'],
  },
  pdf_ticket: 'yes',
  per_tour_overrides_allowed: true,
  pricing_override_policy: 'TBD',
  price_change_authority: 'only me',
  deposit_refund_policy: {
    refundable_within_hours: 48,
    after_48h: 'only refundable what does not cause losses to the agency; extra cancellation insurance optional',
  },
};

export default TourCanonicalSchema;
