/** Input masks for the demo card form (item 18). Pure, no validation against a provider. */

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/** "4111111111111111" → "4111 1111 1111 1111" (up to 19 digits). */
export function formatCardNumber(value: string): string {
  return digitsOnly(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** "1227" → "12/27". */
export function formatExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length < 3 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export const formatCvv = (value: string): string => digitsOnly(value).slice(0, 4);
