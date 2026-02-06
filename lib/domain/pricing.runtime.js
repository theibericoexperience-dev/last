// Runtime CommonJS implementation of computePricing for test purposes.
function roundToCents(n) {
  return Math.round(n * 100) / 100;
}

const DEFAULT = {
  base_price_per_traveler_usd: 3500,
  deposit: {
    amount_per_traveler_usd: 1000,
    extra_for_extension_usd: 500,
    extra_for_single_traveler_usd: 500,
  },
  extensions: {
    price_per_day_per_person_usd: 250,
    extension_duration_impact: { extend_tour: true, extra_deposit_per_person_usd: 500 },
  },
  insurance: { travel_insurance_usd: 200, cancellation_insurance_usd: 500 },
  single_supplement_and_room: { single_extra_per_day_usd: 100 },
  per_tour_overrides_allowed: true,
};

function computePricing(tour, req) {
  const now = new Date().toISOString();
  const base = tour || DEFAULT;

  let overridesApplied = false;
  const overrideFields = {};
  const effective = JSON.parse(JSON.stringify(base));
  if (base.per_tour_overrides_allowed && req.perTourOverrides) {
    overridesApplied = true;
    const allowed = ['deposit_amount_per_traveler_usd', 'extensions_price_per_day_per_person_usd', 'single_extra_per_day_usd', 'travel_insurance_usd', 'cancellation_insurance_usd'];
    for (const k of Object.keys(req.perTourOverrides)) {
      if (allowed.includes(k)) {
        effective.overrides = effective.overrides || {};
        effective.overrides[k] = req.perTourOverrides[k];
        overrideFields[k] = req.perTourOverrides[k];
      }
    }
  }

  const depositPerPerson = (effective.overrides && effective.overrides.deposit_amount_per_traveler_usd) || effective.deposit.amount_per_traveler_usd || DEFAULT.deposit.amount_per_traveler_usd;
  const extensionPerDay = (effective.overrides && effective.overrides.extensions_price_per_day_per_person_usd) || effective.extensions.price_per_day_per_person_usd || DEFAULT.extensions.price_per_day_per_person_usd;
  const extraDepositForExtension = effective.deposit.extra_for_extension_usd || DEFAULT.deposit.extra_for_extension_usd;
  const extraDepositForSingle = effective.deposit.extra_for_single_traveler_usd || DEFAULT.deposit.extra_for_single_traveler_usd;
  const travelInsurance = (effective.overrides && effective.overrides.travel_insurance_usd) || effective.insurance.travel_insurance_usd || DEFAULT.insurance.travel_insurance_usd;
  const cancellationInsurance = (effective.overrides && effective.overrides.cancellation_insurance_usd) || effective.insurance.cancellation_insurance_usd || DEFAULT.insurance.cancellation_insurance_usd;
  const singleExtraPerDay = (effective.overrides && effective.overrides.single_extra_per_day_usd) || effective.single_supplement_and_room.single_extra_per_day_usd || DEFAULT.single_supplement_and_room.single_extra_per_day_usd;

  const extensionsReq = req.extensions || [];
  const extensionsLines = extensionsReq.map((e) => {
    const perPersonPerDay = extensionPerDay;
    const total = perPersonPerDay * req.travelers * e.days;
    return {
      extensionId: e.extensionId,
      days: e.days,
      per_person_per_day_usd: roundToCents(perPersonPerDay),
      total_per_extension_usd: roundToCents(total),
    };
  });

  const insuranceLines = [];
  if (req.insuranceSelected && req.insuranceSelected.travel) {
    const total = travelInsurance * req.travelers;
    insuranceLines.push({ type: 'travel', per_person_usd: roundToCents(travelInsurance), total_usd: roundToCents(total) });
  }
  if (req.insuranceSelected && req.insuranceSelected.cancellation) {
    const total = cancellationInsurance * req.travelers;
    insuranceLines.push({ type: 'cancellation', per_person_usd: roundToCents(cancellationInsurance), total_usd: roundToCents(total) });
  }

  const singleSupplementUsd = req.roomType === 'single' ? roundToCents(singleExtraPerDay) : 0;

  let depositTotal = depositPerPerson * req.travelers;
  if (req.travelers === 1 && req.roomType === 'single') {
    depositTotal += extraDepositForSingle || 0;
  }
  if (extensionsReq.length > 0) {
    depositTotal += (extraDepositForExtension || 0) * req.travelers;
  }

  const extensionsTotal = extensionsLines.reduce((s, x) => s + x.total_per_extension_usd, 0);
  const insuranceTotal = insuranceLines.reduce((s, x) => s + x.total_usd, 0);

  const basePricePerTraveler = (effective.base_price_per_traveler_usd) || DEFAULT.base_price_per_traveler_usd;
  const basePriceTotal = basePricePerTraveler * req.travelers;

  const totalGuaranteed = depositTotal + extensionsTotal + insuranceTotal + singleSupplementUsd + basePriceTotal;

  return {
    currency: 'USD',
    deposit_per_person_usd: roundToCents(depositPerPerson),
    deposit_total_usd: roundToCents(depositTotal),
    deposit_breakdown: [{ label: `base deposit (${req.travelers} traveler${req.travelers > 1 ? 's' : ''})`, amount_usd: roundToCents(depositPerPerson * req.travelers) }],
    extensions_usd: extensionsLines,
    insurance_usd: insuranceLines,
    single_supplement_usd: roundToCents(singleSupplementUsd),
    total_guaranteed_price_usd: roundToCents(totalGuaranteed),
    base_price_per_traveler_usd: roundToCents(basePricePerTraveler),
    base_price_total_usd: roundToCents(basePriceTotal),
    notes: ['Deposit covers flight and hotel.', 'Remaining payment in 3 weeks.'],
    per_tour_override_applied: overridesApplied,
    per_tour_override_fields: overridesApplied ? overrideFields : null,
    serverTimestamp: now,
    rounding: { unit: 'cent', strategy: 'half-up' },
  };
}

module.exports = { computePricing };
