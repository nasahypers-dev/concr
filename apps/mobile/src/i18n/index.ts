import { defaultLocale, isLocale, type Locale, locales, messages } from '@concr/shared';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/** Device language if it is one of az/ru/en, otherwise Azerbaijani. */
export function detectDeviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? null;
  return isLocale(code) ? code : defaultLocale;
}

/**
 * Idempotent i18next bootstrap. Resources come from @concr/shared, so mobile, web and API
 * share one set of keys. Single-brace interpolation ("{phone}") matches next-intl on the web.
 */
export function initI18n(locale: Locale = detectDeviceLocale()): typeof i18n {
  if (i18n.isInitialized) {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    return i18n;
  }
  void i18n.use(initReactI18next).init({
    resources: Object.fromEntries(locales.map((code) => [code, { translation: messages[code] }])),
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    initAsync: false,
    interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
    returnNull: false,
  });
  return i18n;
}

export async function changeLocale(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export { i18n };
