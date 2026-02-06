module.exports = {
  'madrid-2026': {
    tourId: 'madrid-2026',
    title: 'Madrid to Lisbon 2026',
    currency: 'USD',
    base_price_per_traveler_usd: 3500,
    deposit: { amount_per_traveler_usd: 1000, extra_for_extension_usd: 500, extra_for_single_traveler_usd: 500, coverage: 'flight and hotel', payment_schedule: 'remaining payment in 3 weeks', deposit_type: 'always 1000 per traveler' },
    extensions: { price_per_day_per_person_usd: 250, notes: '2 travelers per hotel room; if single, +500 at the end', extension_duration_impact: { extend_tour: true, extra_deposit_per_person_usd: 500 } },
    insurance: { travel_insurance_usd: 200, cancellation_insurance_usd: 500 },
    single_supplement_and_room: { single_extra_per_day_usd: 100, room_type_options: ['double', 'single'] },
    pdf_ticket: 'yes',
    per_tour_overrides_allowed: true,
    deposit_refund_policy: { refundable_within_hours: 48, after_48h: 'only refundable what does not cause losses to the agency; extra cancellation insurance optional' }
  }
};
