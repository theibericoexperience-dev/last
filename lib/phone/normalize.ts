export function normalizeToE164(country: string | undefined, phoneRaw: string | undefined): string | null {
  if (!country || !phoneRaw) return null;
  // Keep only digits
  const digits = (phoneRaw || '').replace(/\D+/g, '');
  if (digits.length < 6 || digits.length > 15) return null;
  const cc = (country || '').replace(/\D+/g, '');
  if (!cc) return null;
  return `+${cc}${digits}`;
}

export default normalizeToE164;
