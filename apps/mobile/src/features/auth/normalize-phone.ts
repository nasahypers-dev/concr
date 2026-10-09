/** Normalises "050 620 95 84" / "+994 50 ..." / "994..." into E.164 for validation. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('994')) return `+${digits}`;
  if (digits.startsWith('0')) return `+994${digits.slice(1)}`;
  return `+994${digits}`;
}
