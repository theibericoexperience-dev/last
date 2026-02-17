// Known overrides for media-derived place names.
// Use conservative matches to avoid accidental replacements.
export const mediaPlaceOverrides: Array<{ match: RegExp; name: string }> = [
  // Common misspellings or compact filenames found in the manifest
  { match: /arrivalplasencia/i, name: 'Plasencia' },
  { match: /oliveza/i, name: 'Olivenza' },
  { match: /depature|depature|depature/i, name: 'Departure' },
  { match: /ramiros/i, name: 'Ramiros' },
  // generic day/arrival labels that we want to convert into readable forms
  { match: /arrival/i, name: 'Arrival' },
  { match: /departure/i, name: 'Departure' },
];

export function getMediaPlaceOverride(raw?: string | null) {
  if (!raw) return null;
  try {
    const s = String(raw).toLowerCase();
    for (const o of mediaPlaceOverrides) {
      if (o.match.test(s)) return o.name;
    }
    return null;
  } catch (e) {
    return null;
  }
}
