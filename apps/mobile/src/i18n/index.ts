import { defaultLocale, type Locale, locales, messages } from '@concr/shared';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Idempotent i18next bootstrap. Resources come from @concr/shared, so mobile, web and API
 * share one set of keys. Single-brace interpolation ("{phone}") matches next-intl on the web.
 * The app starts in Azerbaijani whatever the phone's language (owner, 2026-10-12); the
 * persisted preference in `settings.store.ts` switches it after hydration.
 */
export function initI18n(locale: Locale = defaultLocale): typeof i18n {
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
