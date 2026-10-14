/** Cookie that stores the staff user's UI language; no locale prefix in URLs (ADR 0005). */
export const LOCALE_COOKIE = 'concr.locale';

/** Written by the language switcher in the top bar; the server reads it on the next render. */
export function writeLocaleCookie(locale: string): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}
