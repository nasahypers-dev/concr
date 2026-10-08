/**
 * Masks a phone number for logs (CLAUDE.md: phone numbers are masked).
 * "+994506209584" -> "+99450*****84". Anything shorter than 8 characters becomes "***".
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '***';
  const value = phone.trim();
  if (value.length < 8) return '***';
  const head = value.slice(0, 6);
  const tail = value.slice(-2);
  return `${head}${'*'.repeat(value.length - 8)}${tail}`;
}
