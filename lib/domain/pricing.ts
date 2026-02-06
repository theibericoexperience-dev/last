import TourCanonicalSchema, { TourCanonical, DEFAULT_TOUR_CANONICAL } from './tour-canonical';

type ExtensionRequest = { extensionId: string; days: number };

export type PricingRequest = {
  tourId: string;
  travelers: number;
  roomType: 'double' | 'single';
  extensions?: ExtensionRequest[];
  insuranceSelected?: { travel?: boolean; cancellation?: boolean };
  perTourOverrides?: Partial<Pick<TourCanonical['overrides'], keyof NonNullable<TourCanonical['overrides']>> | null>;
};

export type PricingResponse = {
  currency: 'USD';
  deposit_per_person_usd: number;
  deposit_total_usd: number;
  deposit_breakdown?: { label: string; amount_usd: number }[];
  extensions_usd: { extensionId: string; days: number; per_person_per_day_usd: number; total_per_extension_usd: number }[];
  insurance_usd: { type: 'travel' | 'cancellation'; per_person_usd: number; total_usd: number }[];
  single_supplement_usd: number;
  total_guaranteed_price_usd: number;
  /** 5% cashback applied to the operation (tour price + addons) */
  cashback_total_usd?: number;
  cashback_per_person_usd?: number;
  notes?: string[];
  per_tour_override_applied?: boolean;
  per_tour_override_fields?: Record<string, number> | null;
  serverTimestamp: string;
  rounding: { unit: 'cent'; strategy: 'half-up' };
};

// Rounding util: round to nearest cent, half-up
function roundToCents(n: number) {
  return Math.round(n * 100) / 100;
}

// Compute pricing given canonical tour data (defaults) and request
export function computePricing(tour: TourCanonical | null, req: PricingRequest): PricingResponse {
  const now = new Date().toISOString();
  const base = tour ?? DEFAULT_TOUR_CANONICAL;

  // Apply per-tour overrides if allowed and provided
  let overridesApplied = false;
  const overrideFields: Record<string, number> = {};
  const effective = JSON.parse(JSON.stringify(base)) as TourCanonical;
  if (base.per_tour_overrides_allowed && req.perTourOverrides) {
    overridesApplied = true;
    const allowed = ['deposit_amount_per_traveler_usd', 'extensions_price_per_day_per_person_usd', 'single_extra_per_day_usd', 'travel_insurance_usd', 'cancellation_insurance_usd'];
    for (const k of Object.keys(req.perTourOverrides)) {
      if (allowed.includes(k)) {
        // @ts-ignore
        (effective as any).overrides = (effective as any).overrides || {};
        // @ts-ignore
        (effective as any).overrides[k] = (req.perTourOverrides as any)[k];
        // record effective numeric value so response can show it
        // @ts-ignore
        overrideFields[k] = (req.perTourOverrides as any)[k];
      }
    }
  }

  // Resolve numeric defaults: prefer overrides -> tour overrides -> canonical defaults
  const depositPerPerson = (effective.overrides?.deposit_amount_per_traveler_usd ?? effective.deposit.amount_per_traveler_usd ?? DEFAULT_TOUR_CANONICAL.deposit.amount_per_traveler_usd) as number;
  const extensionPerDay = (effective.overrides?.extensions_price_per_day_per_person_usd ?? effective.extensions.price_per_day_per_person_usd ?? DEFAULT_TOUR_CANONICAL.extensions.price_per_day_per_person_usd) as number;
  const extraDepositForExtension = effective.deposit.extra_for_extension_usd ?? DEFAULT_TOUR_CANONICAL.deposit.extra_for_extension_usd;
  const extraDepositForSingle = effective.deposit.extra_for_single_traveler_usd ?? DEFAULT_TOUR_CANONICAL.deposit.extra_for_single_traveler_usd;
  const travelInsurance = (effective.overrides?.travel_insurance_usd ?? effective.insurance.travel_insurance_usd ?? DEFAULT_TOUR_CANONICAL.insurance.travel_insurance_usd) as number;
  const cancellationInsurance = (effective.overrides?.cancellation_insurance_usd ?? effective.insurance.cancellation_insurance_usd ?? DEFAULT_TOUR_CANONICAL.insurance.cancellation_insurance_usd) as number;
  const singleExtraPerDay = (effective.overrides?.single_extra_per_day_usd ?? effective.single_supplement_and_room.single_extra_per_day_usd ?? DEFAULT_TOUR_CANONICAL.single_supplement_and_room.single_extra_per_day_usd) as number;

  // Deposit per person base
  const depositPerPersonResolved = depositPerPerson;

  // Compute extensions lines
  const extensionsReq = req.extensions ?? [];
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

  // Insurance lines
  const insuranceLines: PricingResponse['insurance_usd'] = [];
  if (req.insuranceSelected?.travel) {
    const total = travelInsurance * req.travelers;
    insuranceLines.push({ type: 'travel', per_person_usd: roundToCents(travelInsurance), total_usd: roundToCents(total) });
  }
  if (req.insuranceSelected?.cancellation) {
    const total = cancellationInsurance * req.travelers;
    insuranceLines.push({ type: 'cancellation', per_person_usd: roundToCents(cancellationInsurance), total_usd: roundToCents(total) });
  }

  // Single supplement amount (per-day). The endpoint does not know total days here; UI may pass days via extension or tour metadata in future.
  // For now compute an example single_supplement_usd as singleExtraPerDay (per day) * 1 day to show presence; callers should interpret correctly.
  const singleSupplementUsd = req.roomType === 'single' ? roundToCents(singleExtraPerDay) : 0;

  // Deposit total calculation
  let depositTotal = depositPerPersonResolved * req.travelers;
  // If single traveler booking and roomType single and travelers === 1, add extra deposit for single traveler
  if (req.travelers === 1 && req.roomType === 'single') {
    depositTotal += extraDepositForSingle ?? 0;
  }
  // If extensions present, add extra deposit per traveler for extensions (one-time per extension rule)
  if (extensionsReq.length > 0) {
    depositTotal += (extraDepositForExtension ?? 0) * req.travelers;
  }

  // Compute totals
  const extensionsTotal = extensionsLines.reduce((s, x) => s + x.total_per_extension_usd, 0);
  const insuranceTotal = insuranceLines.reduce((s, x) => s + x.total_usd, 0);

  // Base price per traveler (resolved via overrides -> tour -> default)
  const basePricePerTraveler = (effective.base_price_per_traveler_usd ?? DEFAULT_TOUR_CANONICAL.base_price_per_traveler_usd) as number;
  const basePriceTotal = basePricePerTraveler * req.travelers;

  // NOTE: total_guaranteed_price includes base price + extensions + insurance + single supplement
  const totalGuaranteed = depositTotal + extensionsTotal + insuranceTotal + singleSupplementUsd + basePriceTotal;

  // Cashback: 5% of the operation amount defined as (tour price + addons)
  // Operation total excludes deposit amounts because cashback applies to the purchase amount
  const operationTotal = basePriceTotal + extensionsTotal + insuranceTotal + singleSupplementUsd;
  const cashback = roundToCents(operationTotal * 0.05);

  const resp: PricingResponse = {
    currency: 'USD',
    deposit_per_person_usd: roundToCents(depositPerPersonResolved),
    deposit_total_usd: roundToCents(depositTotal),
    deposit_breakdown: [
      { label: `base deposit (${req.travelers} traveler${req.travelers > 1 ? 's' : ''})`, amount_usd: roundToCents(depositPerPersonResolved * req.travelers) },
    ],
    // include base price line for client display
    // note: clients should treat total_guaranteed_price_usd as authoritative
    // and display base_price_per_traveler_usd separately if desired
    // (returned here for convenience)
    // @ts-ignore add to response dynamically
    base_price_per_traveler_usd: roundToCents(basePricePerTraveler),
    // @ts-ignore
    base_price_total_usd: roundToCents(basePriceTotal),
    extensions_usd: extensionsLines,
    insurance_usd: insuranceLines,
    single_supplement_usd: roundToCents(singleSupplementUsd),
    total_guaranteed_price_usd: roundToCents(totalGuaranteed),
  cashback_total_usd: cashback,
  cashback_per_person_usd: roundToCents(cashback / (req.travelers || 1)),
    notes: [
      'Deposit covers flight and hotel.',
      'Remaining payment in 3 weeks.',
    ],
    per_tour_override_applied: overridesApplied,
    per_tour_override_fields: overridesApplied ? overrideFields : null,
    serverTimestamp: now,
    rounding: { unit: 'cent', strategy: 'half-up' },
  };

  return resp;
}

export default computePricing;
