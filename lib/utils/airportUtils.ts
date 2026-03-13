export const AIRPORT_MAPPING: Record<string, { city: string, country: string, flag: string }> = {
  // USA
  'JFK': { city: 'New York', country: 'United States', flag: '🇺🇸' },
  'EWR': { city: 'Newark', country: 'United States', flag: '🇺🇸' },
  'MIA': { city: 'Miami', country: 'United States', flag: '🇺🇸' },
  'LAX': { city: 'Los Angeles', country: 'United States', flag: '🇺🇸' },
  'SFO': { city: 'San Francisco', country: 'United States', flag: '🇺🇸' },
  'ORD': { city: 'Chicago', country: 'United States', flag: '🇺🇸' },
  'DFW': { city: 'Dallas', country: 'United States', flag: '🇺🇸' },
  'ATL': { city: 'Atlanta', country: 'United States', flag: '🇺🇸' },
  'BOS': { city: 'Boston', country: 'United States', flag: '🇺🇸' },
  'IAD': { city: 'Washington DC', country: 'United States', flag: '🇺🇸' },
  'SEA': { city: 'Seattle', country: 'United States', flag: '🇺🇸' },
  'PHL': { city: 'Philadelphia', country: 'United States', flag: '🇺🇸' },
  'CLT': { city: 'Charlotte', country: 'United States', flag: '🇺🇸' },
  'DEN': { city: 'Denver', country: 'United States', flag: '🇺🇸' },
  'IAH': { city: 'Houston', country: 'United States', flag: '🇺🇸' },
  
  // Canada
  'YYZ': { city: 'Toronto', country: 'Canada', flag: '🇨🇦' },
  'YVR': { city: 'Vancouver', country: 'Canada', flag: '🇨🇦' },
  'YUL': { city: 'Montreal', country: 'Canada', flag: '🇨🇦' },

  // UK (just in case)
  'LHR': { city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  'LGW': { city: 'London', country: 'United Kingdom', flag: '🇬🇧' },

  // Spain (if local departures)
  'MAD': { city: 'Madrid', country: 'Spain', flag: '🇪🇸' },
  'BCN': { city: 'Barcelona', country: 'Spain', flag: '🇪🇸' },

  // Portugal
  'LIS': { city: 'Lisbon', country: 'Portugal', flag: '🇵🇹' },
  'OPO': { city: 'Porto', country: 'Portugal', flag: '🇵🇹' },
};

export function getAirportDisplay(code: string) {
  const normalizedCode = code.toUpperCase().trim();
  const data = AIRPORT_MAPPING[normalizedCode];
  
  if (data) {
    return {
      label: `${data.city}`,
      flag: data.flag,
      full: `${data.flag} ${data.city} (${normalizedCode})`,
      cityOnly: data.city // Only the city name as requested
    };
  }
  
  // Fallback
  return {
    label: code,
    flag: '✈️',
    full: code,
    cityOnly: code
  };
}
