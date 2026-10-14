import { defaultLocale, isLocale, messages } from '@concr/shared';
import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { LOCALE_COOKIE } from './locale-cookie';

export { LOCALE_COOKIE };

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const candidate = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(candidate) ? candidate : defaultLocale;
  return { locale, messages: messages[locale] };
});
