/**
 * Azerbaijani mobile numbers: the app shows a fixed "+994" and the customer types the 9 local
 * digits (owner, 2026-10-12). E.164 ("+994503260343") is what the API receives (CLAUDE.md rule 11).
 */
export const AZ_PREFIX = '+994';
export const AZ_LOCAL_LENGTH = 9;

/** "+994503260343" → "503260343"; anything that is not an AZ number yields its digits only. */
export function localDigits(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  return digits.startsWith('994') && digits.length > AZ_LOCAL_LENGTH
    ? digits.slice(3)
    : digits.slice(0, AZ_LOCAL_LENGTH);
}

/**
 * Normalises what lands in the local field (typing, paste, iOS autofill of "+994 50 …", "0 50 …").
 * Prefixes are stripped only when the input is longer than a local number, so "99…" (Nar) survives.
 */
export function stripAzPrefix(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.length > AZ_LOCAL_LENGTH) {
    if (digits.startsWith('994')) digits = digits.slice(3);
    else if (digits.startsWith('0')) digits = digits.slice(1);
  }
  return digits.slice(0, AZ_LOCAL_LENGTH);
}

/** "503260343" → "50 326 03 43" (partial input is grouped as far as it goes). */
export function formatAzLocal(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, AZ_LOCAL_LENGTH);
  const groups = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(
    (g) => g.length > 0,
  );
  return groups.join(' ');
}

export function isCompleteAzLocal(digits: string): boolean {
  return /^\d{9}$/.test(digits);
}

/** "503260343" → "+994503260343"; '' when nothing was typed. */
export function toAzE164(digits: string): string {
  return digits === '' ? '' : `${AZ_PREFIX}${digits}`;
}
