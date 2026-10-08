import { defaultLocale, isLocale, messages } from '@concr/shared';
import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

/** Cookie that stores the staff user's UI language; no locale prefix in URLs (ADR 0005). */
export const LOCALE_COOKIE = 'concr.locale';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const candidate = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(candidate) ? candidate : defaultLocale;
  return { locale, messages: messages[locale] };
});
